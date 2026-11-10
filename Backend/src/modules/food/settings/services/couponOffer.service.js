import mongoose from 'mongoose';
import { FoodCoupon } from '../models/foodCoupon.model.js';
import { FoodOfferUsage } from '../../admin/models/offerUsage.model.js';
import { FoodOrder } from '../../orders/models/order.model.js';
import { Product } from '../../admin/models/product.model.js';
import { FoodStore } from '../../store/models/store.model.js';
import { FoodFranchise } from '../../franchise/models/franchise.model.js';

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
  const firstTimeOnly = segments.length > 0 && segments.every((s) => s.includes('new'));
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
    customerScope: firstTimeOnly ? 'first-time' : 'all',
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

  // A store carries its franchise; region and zone usually live on the franchise, so fall back to it.
  const where = offer.storeIds?.length || offer.franchiseIds?.length || offer.regionIds?.length || offer.zoneIds?.length || offer.territoryIds?.length
    ? await placeOf(store)
    : {};
  const place = [
    ['storeIds', where.storeId],
    ['franchiseIds', where.franchiseId],
    ['regionIds', where.regionId],
    ['zoneIds', where.zoneId],
    ['territoryIds', where.territoryId],
  ];
  for (const [field, value] of place) {
    if (offer[field]?.length && !ids(offer[field]).includes(String(value || ''))) return no('Not available at your store');
  }

  const minOrder = Number(offer.minOrderValue) || 0;
  if (subtotal < minOrder) return no(`Add items worth ₹${Math.ceil(minOrder - subtotal)} more`);

  if (userId && offer.perUserLimit > 0) {
    const usage = await FoodOfferUsage.findOne({ offerId: offer._id, userId }).lean();
    if (usage && usage.count >= offer.perUserLimit) return no('You have already used this coupon');
  }
  if (userId && offer.customerScope === 'first-time') {
    const orders = await FoodOrder.countDocuments({ userId: new mongoose.Types.ObjectId(userId) });
    if (orders > 0) return no('Only for your first order');
  }

  let eligibleSubtotal = subtotal;
  const scope = String(offer.applicableOn || 'All').toLowerCase();
  if (scope === 'category' || scope === 'product') {
    const lines = items.filter((i) => i.kind !== 'addon' && i.kind !== 'topping' && !i.isLimitedOffer && mongoose.isValidObjectId(i.itemId));
    const products = await Product.find({ _id: { $in: lines.map((i) => i.itemId) } }).select('categoryId').lean();
    const byId = new Map(products.map((p) => [String(p._id), p]));
    const matches = (i) => {
      const p = byId.get(String(i.itemId));
      if (!p) return false;
      return scope === 'product' ? ids(offer.productIds).includes(String(p._id)) : ids(offer.categoryIds).includes(String(p.categoryId));
    };
    eligibleSubtotal = lines.filter(matches).reduce((n, i) => n + i.price * i.quantity, 0);
    if (eligibleSubtotal <= 0) return no(scope === 'product' ? 'Only on selected items' : 'Only on selected categories');
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
