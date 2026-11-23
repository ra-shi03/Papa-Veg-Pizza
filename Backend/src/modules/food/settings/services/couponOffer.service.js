import mongoose from 'mongoose';
import { FoodCoupon } from '../models/foodCoupon.model.js';
import { FoodOfferUsage } from '../../admin/models/offerUsage.model.js';
import { FoodOrder } from '../../orders/models/order.model.js';
import { Product } from '../../admin/models/product.model.js';
import { FoodStore } from '../../store/models/store.model.js';
import { FoodFranchise } from '../../franchise/models/franchise.model.js';
import { CategoryProduct } from '../../admin/models/categoryProduct.model.js';
import { FoodAppConfig } from '../models/appConfig.model.js';

const ids = (list) => (list || []).map(String);

const DISABLED_STATUSES = ['disabled', 'inactive', 'expired'];

// The super admin manages coupons as FoodCoupon (Marketing > Coupons). The cart and order pricing read the offer shape,
// so this maps one onto the other. BOGO / free-product coupons have no money value here and are marked unsupported.
export function couponToOffer(c) {
  const doc = typeof c?.toObject === 'function' ? c.toObject() : c;
  const type = String(doc.couponType || '').toLowerCase();
  const discountType = type === 'percentage' ? 'percentage' : type === 'flat amount' ? 'flat-price' : 'unsupported';
  // The admin form writes maximumDiscount / usageLimit / usagePerCustomer. The record also has older copies
  // (maxDiscount, usageLimitTotal, usageLimitPerUser) that the form never updates, so they are not read.
  const maxDiscount = Number(doc.maximumDiscount) > 0 ? Number(doc.maximumDiscount) : null;
  const segments = (doc.customerSegments || []).map((s) => String(s).toLowerCase());
  const legacyFirstTime = segments.length > 0 && segments.every((s) => s.includes('new'));
  // userType is what the admin form writes; coupons saved before it existed fall back to their old segments.
  // An explicit userType (including 'all') always wins over leftover segments.
  const userType = ['all', 'new', 'old'].includes(doc.userType) ? doc.userType : legacyFirstTime ? 'new' : 'all';
  const usageLimit = Number(doc.usageLimit) || null;
  const perUserLimit = Number(doc.usagePerCustomer) || null;
  const off = doc.isActive === false || DISABLED_STATUSES.includes(String(doc.status || '').toLowerCase());
  return {
    ...doc,
    id: String(doc._id),
    _id: doc._id,
    couponCode: doc.code,
    discountType,
    discountValue: Number(doc.value) || 0,
    minOrderValue: Number(doc.minimumOrderAmount) || 0,
    maxDiscount,
    customerScope: userType === 'new' ? 'first-time' : userType === 'old' ? 'returning' : 'all',
    applicableSizes: (doc.applicableSizes || []).map((s) => String(s).trim()).filter(Boolean),
    usageLimit,
    perUserLimit,
    usedCount: Number(doc.usageCount) || 0,
    storeScope: 'all',
    storeIds: ids(doc.storeIds),
    franchiseIds: ids(doc.franchiseIds),
    regionIds: ids(doc.regionIds),
    zoneIds: ids(doc.zoneIds),
    territoryIds: ids(doc.territoryIds),
    productIds: ids(doc.productIds),
    categoryIds: ids(doc.categoryIds),
    status: off ? 'inactive' : 'active',
    offerType: 'online',
    showInCart: true,
  };
}

export async function findCouponOfferByCode(code) {
  const coupon = await FoodCoupon.findOne({ code }).lean();
  return coupon ? couponToOffer(coupon) : null;
}

/** The names of the categories a coupon is limited to, for the "Only on ..." message (at most three). */
async function categoryNames(categoryIds) {
  const idList = ids(categoryIds).filter((x) => mongoose.isValidObjectId(x));
  if (!idList.length) return '';
  const rows = await CategoryProduct.find({ _id: { $in: idList } }).select('label').lean();
  const names = rows.map((r) => r.label).filter(Boolean);
  return names.length > 3 ? `${names.slice(0, 3).join(', ')} and more` : names.join(', ');
}

async function placeOf(store) {
  const row = store?._id ? await FoodStore.findById(store._id).select('franchiseId regionId zoneId territoryId').lean() : null;
  const franchise = row?.franchiseId ? await FoodFranchise.findById(row.franchiseId).select('regionId zoneId territoryId').lean() : null;
  return {
    storeId: store?._id,
    franchiseId: row?.franchiseId,
    regionId: row?.regionId || franchise?.regionId,
    zoneId: row?.zoneId || franchise?.zoneId,
    territoryId: row?.territoryId || franchise?.territoryId,
  };
}

const PLACE_FIELDS = [['storeIds', 'storeId'], ['franchiseIds', 'franchiseId'], ['regionIds', 'regionId'], ['zoneIds', 'zoneId'], ['territoryIds', 'territoryId']];

/** A coupon with no place list at all is global. */
export const isGlobalCoupon = (offer) => !PLACE_FIELDS.some(([field]) => offer[field]?.length);

/**
 * THE place rule, used by checkout and by the public coupon list: every place list the coupon sets (store, franchise,
 * region, zone, territory) must include the store's own value. `where` is the store's place from `placeOf`.
 */
export const couponAppliesAtPlace = (offer, where = {}) =>
  PLACE_FIELDS.every(([field, key]) => !offer[field]?.length || ids(offer[field]).includes(String(where[key] || '')));

/** The rule for one store (loads its place only when the coupon has a place list). A coupon with no place list is global. */
export async function couponAppliesAtStore(offer, store) {
  if (isGlobalCoupon(offer)) return true;
  return couponAppliesAtPlace(offer, await placeOf(store));   // a store carries its franchise; region / zone / territory fall back to it
}

/** The place of a store, loaded once, for filtering many coupons with `couponAppliesAtPlace`. */
export const placeOfStore = (storeId) => placeOf({ _id: storeId });

// Decides whether a coupon works for this cart and what it takes off. These are the rules the super admin sets on
// Marketing > Coupons: validity, first-order-only, usage limits, minimum order, place (store / franchise / region /
// zone / territory) and what it applies to (everything, chosen categories, or chosen products).
// `items` are priced cart lines (with itemId); `store` is the store the order is for.
export async function evaluateCoupon(offer, { userId, store, items, subtotal }) {
  const no = (reason) => ({ ok: false, reason, discount: 0, eligibleSubtotal: 0 });
  const now = new Date();
  if (offer.status !== 'active') return no('This coupon is not active');
  if (offer.discountType === 'unsupported') return no('This coupon cannot be applied online');
  if (offer.startDate && now < new Date(offer.startDate)) return no('This coupon is not live yet');
  if (offer.endDate && now >= new Date(offer.endDate)) return no('This coupon has expired');
  if (offer.usageLimit > 0 && offer.usedCount >= offer.usageLimit) return no('This coupon has been fully redeemed');

  if (!(await couponAppliesAtStore(offer, store))) return no('Not available at your store');

  const minOrder = Number(offer.minOrderValue) || 0;
  if (subtotal < minOrder) return no(`Add items worth ₹${Math.ceil(minOrder - subtotal)} more`);

  if (userId && offer.perUserLimit > 0) {
    const usage = await FoodOfferUsage.findOne({ offerId: offer._id, userId }).lean();
    if (usage && usage.count >= offer.perUserLimit) return no('You have already used this coupon');
  }
  if (offer.customerScope === 'first-time' || offer.customerScope === 'returning') {
    if (!userId) return no('Log in to use this coupon');
    // An order counts once it was really placed: not cancelled, and (for online payment) actually paid.
    const orders = await FoodOrder.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
      orderStatus: { $nin: ['cancelled_by_user', 'cancelled_by_store', 'cancelled_by_admin'] },
      'payment.status': { $in: ['cod_pending', 'authorized', 'paid', 'pending_qr'] },
    });
    if (offer.customerScope === 'first-time' && orders > 0) return no('Only for your first order');
    if (offer.customerScope === 'returning' && orders === 0) return no('Only for customers who have ordered before');
  }

  let eligibleSubtotal = subtotal;
  const scope = String(offer.applicableOn || 'All').toLowerCase();
  const sizes = (offer.applicableSizes || []).map((s) => String(s).trim().toLowerCase()).filter(Boolean);
  if (scope === 'category' || scope === 'product' || sizes.length) {
    const lines = items.filter((i) => i.kind !== 'addon' && i.kind !== 'topping' && !i.isLimitedOffer && mongoose.isValidObjectId(i.itemId));
    const products = scope === 'all'
      ? []
      : await Product.find({ _id: { $in: lines.map((i) => i.itemId) } }).select('categoryId').lean();
    const byId = new Map(products.map((p) => [String(p._id), p]));
    const inScope = (i) => {
      if (scope === 'all') return true;
      const p = byId.get(String(i.itemId));
      if (!p) return false;
      return scope === 'product' ? ids(offer.productIds).includes(String(p._id)) : ids(offer.categoryIds).includes(String(p.categoryId));
    };
    const inSize = (i) => !sizes.length || sizes.includes(String(i.size || '').trim().toLowerCase());
    eligibleSubtotal = lines.filter((i) => inScope(i) && inSize(i)).reduce((n, i) => n + i.price * i.quantity, 0);
    if (eligibleSubtotal <= 0) {
      // Say what is actually missing: the right items, the right size, or both
      const sizeText = `${offer.applicableSizes.join(' / ')} size pizzas`;
      const wrongItems = (scope === 'category' || scope === 'product') && !lines.some(inScope);
      if (wrongItems) {
        const where = scope === 'product' ? 'the selected items' : (await categoryNames(offer.categoryIds)) || 'the selected categories';
        return no(sizes.length ? `Only on ${sizeText} from ${where}` : `Only on ${where}`);
      }
      return no(sizes.length ? `Only on ${sizeText}` : 'Only on selected items');
    }
  }

  let discount;
  if (offer.discountType === 'percentage') {
    const raw = eligibleSubtotal * (Number(offer.discountValue) / 100);
    discount = Number(offer.maxDiscount) ? Math.min(raw, Number(offer.maxDiscount)) : raw;
  } else {
    discount = Number(offer.discountValue) || 0;
  }
  discount = Math.max(0, Math.min(eligibleSubtotal, Math.floor(discount)));
  return { ok: true, reason: '', discount, eligibleSubtotal };
}

// ----- What customers see -----
// One coupon system: the super admin's Marketing > Coupons (FoodCoupon). Every customer screen (home, Coupons page,
// cart, Apply Coupon) lists coupons through liveCouponsForStore, with the same place rule checkout applies, so a coupon
// shown is a coupon checkout accepts at that store.

const HIDDEN_STATUSES = ['disabled', 'Disabled', 'inactive', 'Inactive', 'expired', 'Expired'];
const HISTORY_DAYS = 30;

/** What a customer may see of a coupon: display fields only (no store / franchise ids, usage counts or audit fields). */
export const publicCouponView = (o) => ({
  id: o.id,
  _id: o._id,
  couponCode: o.couponCode,
  title: o.title || '',
  description: o.description || '',
  discountType: o.discountType,
  discountValue: o.discountValue,
  maxDiscount: o.maxDiscount,
  minOrderValue: o.minOrderValue,
  startDate: o.startDate || null,
  endDate: o.endDate || null,
  customerScope: o.customerScope,
  status: o.status,
});

/**
 * The store a customer coupon list is for: ?storeId=, else the store serving ?lat=&lng= (the rule
 * /food/stores/status uses). No store means only coupons that apply everywhere are listed.
 */
export async function couponStoreFromQuery(query = {}) {
  const storeId = String(query.storeId || '');
  if (mongoose.isValidObjectId(storeId)) return storeId;
  const lat = parseFloat(query.lat);
  const lng = parseFloat(query.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  try {
    const { resolveStoreForLocation } = await import('../../orders/services/order-store.service.js');
    const found = await resolveStoreForLocation(lat, lng, { anyHours: true });
    return found?.store?._id ? String(found.store._id) : null;
  } catch {
    return null;
  }
}

/** The super admin can switch coupons off for the whole app (App configuration > Coupons). */
export async function couponsSwitchedOff() {
  const config = await FoodAppConfig.findOne().select('couponEnabled').lean();
  return config?.couponEnabled === false;
}

const placeFilter = async (storeId) => {
  const where = storeId ? await placeOfStore(storeId) : null;
  return (o) => (where ? couponAppliesAtPlace(o, where) : isGlobalCoupon(o));
};

/** Coupons a customer can use right now at this store (offer shape). Without a store: global coupons only. */
export async function liveCouponsForStore(storeId) {
  if (await couponsSwitchedOff()) return [];
  const now = new Date();
  const coupons = await FoodCoupon.find({
    isActive: { $ne: false },
    status: { $nin: HIDDEN_STATUSES },
    $or: [{ endDate: null }, { endDate: { $exists: false } }, { endDate: { $gte: now } }],
  }).sort({ createdAt: -1 }).limit(100).lean();
  const atPlace = await placeFilter(storeId);
  return coupons
    .map(couponToOffer)
    .filter((o) => o.discountType !== 'unsupported')
    .filter((o) => !o.startDate || new Date(o.startDate) <= now)
    .filter((o) => !(o.usageLimit > 0 && o.usedCount >= o.usageLimit))
    .filter(atPlace);
}

/**
 * The customer's coupon history for the Coupons page.
 * expired: coupons for this store (same place rule) whose end date passed in the last 30 days.
 * redeemed: coupons this customer has used (the usage record checkout writes when an order is placed), newest first;
 * `usedUp` means they hit the per-customer limit, so the coupon no longer works for them.
 */
export async function couponHistoryFor(userId, storeId) {
  if (!mongoose.isValidObjectId(String(userId || ''))) return { expired: [], redeemed: [] };
  const now = new Date();
  const since = new Date(now.getTime() - HISTORY_DAYS * 24 * 60 * 60 * 1000);
  const [usages, ended] = await Promise.all([
    FoodOfferUsage.find({ userId, count: { $gt: 0 } }).sort({ lastUsedAt: -1 }).limit(50).lean(),
    FoodCoupon.find({ endDate: { $lt: now, $gte: since } }).sort({ endDate: -1 }).limit(50).lean(),
  ]);

  const used = usages.length ? await FoodCoupon.find({ _id: { $in: usages.map((u) => u.offerId) } }).lean() : [];
  const usedById = new Map(used.map((c) => [String(c._id), couponToOffer(c)]));
  const redeemed = usages
    .map((u) => {
      const o = usedById.get(String(u.offerId));
      if (!o) return null;   // the coupon was deleted
      return {
        ...publicCouponView(o),
        status: 'redeemed',
        timesUsed: u.count,
        lastUsedAt: u.lastUsedAt || null,
        usedUp: o.perUserLimit > 0 && u.count >= o.perUserLimit,
      };
    })
    .filter(Boolean);

  const atPlace = await placeFilter(storeId);
  const expired = ended
    .map(couponToOffer)
    .filter((o) => o.discountType !== 'unsupported')
    .filter(atPlace)
    .map((o) => ({ ...publicCouponView(o), status: 'expired' }));

  return { expired, redeemed };
}
