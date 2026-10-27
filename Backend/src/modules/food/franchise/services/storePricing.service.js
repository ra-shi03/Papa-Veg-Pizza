import { Product } from '../../admin/models/product.model.js';
import { CategoryProduct } from '../../admin/models/categoryProduct.model.js';
import { StoreProductPrice } from '../models/storeProductPrice.model.js';
import { PriceHistory } from '../models/priceHistory.model.js';
import { NotFoundError, ValidationError } from '../../../../core/auth/errors.js';
import { isId, toId } from '../../dashboard/services/dashboardAccess.js';
import { accessOf, scopedStores, scopedStore, scopedStoreList } from './storeAccess.js';
import { toDay } from './storeHours.js';
import { RULE_KEYS, catalogRule, pickRule, sameRule, isCustomPrice, today } from './storePriceRules.js';
import { validatePricingDto, validateBulkPriceDto, validateCopyPricingDto, validateBulkActionDto } from '../validators/storeOps.validator.js';

// Store Pricing screen: /v1/store-pricing, /v1/bulk-price-update, /v1/copy-pricing, /v1/price-history/:productId.
// One row per store x catalogue product; its id is "<storeId>_<productId>". A row without a saved rule shows the
// catalogue price. Every change is written to PriceHistory. Franchise admin: own stores, read and write.
// Store manager: own store, read only.

const STORE_FIELDS = '_id franchiseId storeName code';
const PRODUCT_FIELDS = 'name categoryId image price sizes status createdAt updatedAt';
const isAll = (v) => !v || v === 'all' || v === 'All';
const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const rowId = (storeId, productId) => `${storeId}_${productId}`;
const sku = (product) => `PRD-${String(product._id).slice(-6).toUpperCase()}`;

function parseRowId(id) {
  const [storeId, productId] = String(id || '').split('_');
  if (!isId(storeId) || !isId(productId)) throw new NotFoundError('Pricing record not found');
  return { storeId, productId };
}

const catalogue = (filter = {}) => Product.find({ status: { $ne: 'Archived' }, ...filter }).select(PRODUCT_FIELDS).sort({ name: 1 }).lean();

async function categoryNames(products) {
  const ids = [...new Set(products.map((p) => String(p.categoryId || '')).filter(isId))];
  const cats = await CategoryProduct.find({ _id: { $in: ids.map(toId) } }).select('label').lean();
  return new Map(cats.map((c) => [String(c._id), c.label]));
}

function toRow(store, product, rule, cats) {
  const base = catalogRule(product);
  return {
    _id: rowId(store._id, product._id),
    storeId: String(store._id),
    productId: String(product._id),
    ...(rule ? pickRule(rule) : base),
    isCustom: isCustomPrice(rule, product),
    catalogPrice: { smallPrice: base.smallPrice, mediumPrice: base.mediumPrice, largePrice: base.largePrice },
    updatedBy: rule?.updatedBy || 'Catalogue',
    updatedAt: rule?.updatedAt || product.updatedAt,
    createdAt: rule?.createdAt || product.createdAt,
    storeName: store.storeName,
    storeCode: store.code,
    productName: product.name,
    productSku: sku(product),
    productImage: product.image || '',
    categoryName: cats.get(String(product.categoryId)) || 'Uncategorized',
    categoryId: String(product.categoryId || ''),
  };
}

/** Saves rule changes and their history. changes: [{ store, product, before (saved rule or null), after (rule or null = back to catalogue), reason }] */
async function applyChanges(access, user, changes) {
  const by = { updatedBy: access.actor, updatedById: isId(user?.userId) ? toId(user.userId) : null };
  const ops = [];
  const history = [];
  for (const c of changes) {
    const before = c.before ? pickRule(c.before) : catalogRule(c.product);
    const after = c.after ? pickRule({ ...before, ...c.after }) : catalogRule(c.product);
    if (sameRule(before, after) && (c.after || !c.before)) continue;
    const filter = { storeId: c.store._id, productId: c.product._id };
    ops.push(c.after
      ? { updateOne: { filter, update: { $set: { ...after, ...by }, $setOnInsert: { franchiseId: c.store.franchiseId } }, upsert: true } }
      : { deleteOne: { filter } });
    history.push({
      storeId: c.store._id, franchiseId: c.store.franchiseId, productId: c.product._id,
      oldPrice: before, newPrice: after, changedBy: access.actor, changedById: by.updatedById, reason: c.reason,
    });
  }
  if (ops.length) await StoreProductPrice.bulkWrite(ops, { ordered: false });
  if (history.length) await PriceHistory.insertMany(history);
  return history.length;
}

const rulesOf = async (storeIds, productIds) => {
  const filter = { storeId: { $in: storeIds } };
  if (productIds) filter.productId = { $in: productIds };
  const rules = await StoreProductPrice.find(filter).lean();
  return new Map(rules.map((r) => [rowId(r.storeId, r.productId), r]));
};

/** Catalogue products picked on the screen: explicit ids, else a category, else all. Unknown ids are 404. */
async function pickProducts({ selectedProductIds, categoryId }, { useIds = true } = {}) {
  if (useIds && selectedProductIds?.length) {
    const ids = [...new Set(selectedProductIds)];
    if (ids.some((id) => !isId(id))) throw new NotFoundError('Product not found');
    const products = await catalogue({ _id: { $in: ids.map(toId) } });
    if (products.length !== ids.length) throw new NotFoundError('Product not found');
    return products;
  }
  if (!isAll(categoryId)) {
    if (!isId(categoryId)) throw new NotFoundError('Category not found');
    return catalogue({ categoryId: toId(categoryId) });
  }
  return catalogue();
}

// ---------------------------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------------------------

export async function list(user, q = {}) {
  const access = accessOf(user, q, { manager: true });
  const stores = isAll(q.storeId) ? await scopedStores(access, {}, STORE_FIELDS) : [await scopedStore(access, q.storeId, STORE_FIELDS)];
  let productFilter = {};
  if (!isAll(q.categoryId)) productFilter = isId(q.categoryId) ? { categoryId: toId(q.categoryId) } : { _id: null };
  const [products, rules] = await Promise.all([catalogue(productFilter), rulesOf(stores.map((s) => s._id))]);
  const cats = await categoryNames(products);

  const all = [];
  for (const s of stores) for (const p of products) all.push(toRow(s, p, rules.get(rowId(s._id, p._id)), cats));
  const stats = {
    totalStoresCount: stores.length,
    totalProductsCount: products.length,
    customPricingCount: all.filter((r) => r.isCustom).length,
    promotionalPricingCount: all.filter((r) => r.availability === 'PROMOTION ACTIVE').length,
    unavailableProductsCount: all.filter((r) => r.availability === 'UNAVAILABLE').length,
  };

  let rows = all;
  const search = String(q.search || '').trim().toLowerCase();
  if (search) rows = rows.filter((r) => [r.productName, r.productSku, r.storeName, r.storeCode].some((v) => String(v || '').toLowerCase().includes(search)));
  if (!isAll(q.availability)) rows = rows.filter((r) => r.availability === q.availability);
  if (!isAll(q.status)) rows = rows.filter((r) => r.status === q.status);
  const dir = q.sortOrder === 'desc' ? -1 : 1;
  const key = q.sortBy && q.sortBy in (rows[0] || {}) ? q.sortBy : null;
  rows.sort((a, b) => {
    if (key) {
      const x = a[key];
      const y = b[key];
      const c = typeof x === 'number' ? x - y : String(x ?? '').localeCompare(String(y ?? ''));
      if (c) return c * dir;
    }
    return a.storeName.localeCompare(b.storeName) || a.productName.localeCompare(b.productName);
  });

  const page = Math.max(1, parseInt(q.page, 10) || 1);
  const limit = Math.min(200, Math.max(1, parseInt(q.limit, 10) || 10));
  return { pricing: rows.slice((page - 1) * limit, page * limit), totalCount: rows.length, page, limit, totalPages: Math.max(1, Math.ceil(rows.length / limit)), stats };
}

async function loadRow(access, id) {
  const { storeId, productId } = parseRowId(id);
  const store = await scopedStore(access, storeId, STORE_FIELDS);
  const product = await Product.findOne({ _id: toId(productId), status: { $ne: 'Archived' } }).select(PRODUCT_FIELDS).lean();
  if (!product) throw new NotFoundError('Pricing record not found');
  const rule = await StoreProductPrice.findOne({ storeId: store._id, productId: product._id }).lean();
  return { store, product, rule };
}

export async function getOne(user, id, q = {}) {
  const access = accessOf(user, q, { manager: true });
  const { store, product, rule } = await loadRow(access, id);
  return {
    ...toRow(store, product, rule, await categoryNames([product])),
    store: { _id: String(store._id), storeName: store.storeName, code: store.code },
    product: { _id: String(product._id), name: product.name, price: product.price, sizes: product.sizes || [], image: product.image || '' },
  };
}

export async function priceHistory(user, productId, q = {}) {
  const access = accessOf(user, q, { manager: true });
  if (!isId(productId)) throw new NotFoundError('Product not found');
  const stores = isAll(q.storeId) ? await scopedStores(access, {}, STORE_FIELDS) : [await scopedStore(access, q.storeId, STORE_FIELDS)];
  const filter = { productId: toId(productId), storeId: { $in: stores.map((s) => s._id) } };
  const page = Math.max(1, parseInt(q.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(q.limit, 10) || 10));
  const [rows, total, product] = await Promise.all([
    PriceHistory.find(filter).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    PriceHistory.countDocuments(filter),
    Product.findById(toId(productId)).select('name').lean(),
  ]);
  const names = new Map(stores.map((s) => [String(s._id), s.storeName]));
  return {
    history: rows.map((h) => ({
      _id: String(h._id), storeId: String(h.storeId), productId: String(h.productId), oldPrice: h.oldPrice, newPrice: h.newPrice,
      changedBy: h.changedBy, reason: h.reason, createdAt: h.createdAt, storeName: names.get(String(h.storeId)) || '', productName: product?.name || '',
    })),
    totalCount: total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

// ---------------------------------------------------------------------------------------------
// Writes (franchise admin / super admin)
// ---------------------------------------------------------------------------------------------

function checkDates(rule) {
  if (rule.startDate) rule.startDate = toDay(rule.startDate, 'start date');
  if (rule.endDate) rule.endDate = toDay(rule.endDate, 'end date');
  if (rule.availability === 'PROMOTION ACTIVE' && (!rule.startDate || !rule.endDate)) throw new ValidationError('A promotion needs a start and an end date');
  if (rule.startDate && rule.endDate && rule.endDate < rule.startDate) throw new ValidationError('End date must be after start date');
  return rule;
}

export async function update(user, id, body = {}, q = {}) {
  const access = accessOf(user, q, { write: true });
  const { store, product, rule } = await loadRow(access, id);
  const { reason, ...dto } = validatePricingDto(body);
  const next = { ...(rule ? pickRule(rule) : catalogRule(product)) };
  for (const k of RULE_KEYS) if (dto[k] !== undefined) next[k] = typeof dto[k] === 'number' ? round2(dto[k]) : dto[k];
  checkDates(next);
  await applyChanges(access, user, [{ store, product, before: rule, after: next, reason: reason || 'Manual Override Update' }]);
  const saved = await StoreProductPrice.findOne({ storeId: store._id, productId: product._id }).lean();
  return toRow(store, product, saved, await categoryNames([product]));
}

export async function bulkPriceUpdate(user, body = {}, q = {}) {
  const access = accessOf(user, q, { write: true });
  const dto = validateBulkPriceDto(body);
  const stores = dto.applyTo === 'ALL_STORES'
    ? await scopedStores(access, {}, STORE_FIELDS)
    : await scopedStoreList(access, dto.selectedStoreIds || [], STORE_FIELDS);
  const products = await pickProducts(dto);
  const pct = dto.increaseType === 'PERCENTAGE';
  const bump = (p) => Math.max(0, pct ? Math.round(p * (1 + dto.value / 100)) : round2(p + dto.value));
  const rules = await rulesOf(stores.map((s) => s._id), products.map((p) => p._id));
  const reason = `Bulk Update: ${dto.value >= 0 ? '+' : ''}${dto.value}${pct ? '%' : ' ₹'}`;
  const changes = [];
  for (const store of stores) {
    for (const product of products) {
      const before = rules.get(rowId(store._id, product._id));
      const cur = before ? pickRule(before) : catalogRule(product);
      const after = { ...cur };
      for (const k of ['smallPrice', 'mediumPrice', 'largePrice', 'deliveryPrice', 'takeawayPrice', 'dineInPrice']) after[k] = bump(cur[k]);
      changes.push({ store, product, before, after, reason });
    }
  }
  return { success: true, affectedCount: await applyChanges(access, user, changes) };
}

export async function copyPricing(user, body = {}, q = {}) {
  const access = accessOf(user, q, { write: true });
  const dto = validateCopyPricingDto(body);
  const source = await scopedStore(access, dto.sourceStoreId, STORE_FIELDS);
  const dests = await scopedStoreList(access, dto.destinationStoreIds, STORE_FIELDS);
  if (dests.some((d) => String(d._id) === String(source._id))) throw new ValidationError('The source store cannot also be a destination');
  // "all products" sends the whole product list of the screen; only explicit picks are matched by id
  const products = await pickProducts(dto, { useIds: !dto.copyAllProducts });
  const rules = await rulesOf([source._id, ...dests.map((d) => d._id)], products.map((p) => p._id));
  const changes = [];
  for (const dest of dests) {
    for (const product of products) {
      const src = rules.get(rowId(source._id, product._id));
      changes.push({ store: dest, product, before: rules.get(rowId(dest._id, product._id)), after: src ? pickRule(src) : null, reason: `Copied from ${source.storeName}` });
    }
  }
  await applyChanges(access, user, changes);
  return { success: true, affectedStoresCount: dests.length, affectedProductsCount: dests.length * products.length };
}

const ACTION_REASON = {
  ENABLE: 'Enabled store price', DISABLE: 'Disabled store price', MARK_UNAVAILABLE: 'Marked unavailable',
  ACTIVATE_PROMOTION: 'Promotion activated', DELETE_RULES: 'Reset to catalogue price',
};

export async function bulkAction(user, body = {}, q = {}) {
  const access = accessOf(user, q, { write: true });
  const dto = validateBulkActionDto(body);
  const pairs = [...new Set(dto.pricingIds)].map(parseRowId);
  const stores = await scopedStoreList(access, [...new Set(pairs.map((p) => p.storeId))], STORE_FIELDS);
  const productIds = [...new Set(pairs.map((p) => p.productId))];
  const products = await catalogue({ _id: { $in: productIds.map(toId) } });
  if (products.length !== productIds.length) throw new NotFoundError('Pricing record not found');
  const storeOf = new Map(stores.map((s) => [String(s._id), s]));
  const productOf = new Map(products.map((p) => [String(p._id), p]));
  const rules = await rulesOf(stores.map((s) => s._id), products.map((p) => p._id));

  let promo = {};
  if (dto.action === 'ACTIVATE_PROMOTION') {
    const week = new Date();
    week.setDate(week.getDate() + 7);
    promo = checkDates({ availability: 'PROMOTION ACTIVE', startDate: dto.payload.startDate || today(), endDate: dto.payload.endDate || today(week) });
  }
  const patch = {
    ENABLE: { status: 'ACTIVE' }, DISABLE: { status: 'INACTIVE' }, MARK_UNAVAILABLE: { availability: 'UNAVAILABLE' }, ACTIVATE_PROMOTION: promo,
  }[dto.action];
  const changes = pairs.map(({ storeId, productId }) => {
    const store = storeOf.get(storeId);
    const product = productOf.get(productId);
    const before = rules.get(rowId(storeId, productId));
    const after = dto.action === 'DELETE_RULES' ? null : { ...(before ? pickRule(before) : catalogRule(product)), ...patch };
    return { store, product, before, after, reason: ACTION_REASON[dto.action] };
  });
  return { success: true, affectedCount: await applyChanges(access, user, changes) };
}
