import crypto from 'crypto';
import { StorePosIntegration } from '../models/storePosIntegration.model.js';
import { PosSyncLog } from '../models/posSyncLog.model.js';
import { Product } from '../../admin/models/product.model.js';
import { StoreProductPrice } from '../../franchise/models/storeProductPrice.model.js';
import { StoreHours } from '../../franchise/models/storeHours.model.js';
import { FoodStore } from '../../store/models/store.model.js';
import { catalogRule } from '../../franchise/services/storePriceRules.js';
import { isOpenAt, isManuallyClosed } from '../../franchise/services/storeHours.js';
import { emitStoreEvent } from '../../../../config/socket.js';
import { logger } from '../../../../utils/logger.js';
import { NotFoundError } from '../../../../core/auth/errors.js';
import { storeMenu } from './posMenu.service.js';
import * as petpooja from './petpooja.adapter.js';

// The endpoints Pet Pooja calls on us (Online Ordering APIs v2.1.0): Push Menu, item / add-on in and out of stock, get and
// update store status. Each store gives Pet Pooja its own links, shown on its Pet Pooja page:
//   <public URL>/api/v1/pos/petpooja/hooks/<store's secret key>/pushmenu | item_stock | item_stock_off |
//                                                                get_store_status | update_store_status
// The key in the link is the only credential (Pet Pooja sends none). It is the same key as the store's status callback
// link, kept in the database and rotated from the page. The restaurant ID in the call must be that store's.
// (Optionally, PETPOOJA_WEBHOOK_SECRET on the server gives one set of links for every store, matched by restaurant ID.)
// Each store decides what Pet Pooja may change:
//   pushmenu             "syncMenu"         the menu is kept for item mapping (exact-name matches are mapped)
//   item_stock(_off)     "syncStock"        products go on / off in this store's menu (Store Pricing availability)
//   update_store_status  "syncStoreStatus"  the store opens / closes for online orders (same switch as the manager's)
// Answers use Pet Pooja's own response shapes, with a 400 when the call was not applied.

const BY = 'Pet Pooja';
const MIN_SECRET = 24;

const STORE_KEY_RE = /^[a-f0-9]{64}$/;

/** The link's key -> { storeId } (a store's own key) or { app: true } (the optional app-wide secret); 404 otherwise. */
export async function resolveHookKey(secret) {
  const given = String(secret || '');
  if (STORE_KEY_RE.test(given)) {
    const integ = await StorePosIntegration.findOne({ provider: petpooja.PROVIDER, callbackKey: given }).select('storeId').lean();
    if (integ) return { storeId: integ.storeId };
  }
  const expected = String(process.env.PETPOOJA_WEBHOOK_SECRET || '');
  if (expected.length >= MIN_SECRET && given.length === expected.length && crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected))) {
    return { app: true };
  }
  throw new NotFoundError('Not found');
}

/** The outlet a call names by restaurant ID; with a store's own link, only that store (and only its restaurant ID). */
const integrationFor = (ids, scope = {}) => {
  const list = (Array.isArray(ids) ? ids : [ids]).map((v) => String(v || '').trim()).filter(Boolean);
  if (!list.length) return null;
  return StorePosIntegration.findOne({ provider: petpooja.PROVIDER, restaurantId: { $in: list }, ...(scope.storeId ? { storeId: scope.storeId } : {}) });
};

const log = (integ, action, status, note) => PosSyncLog.create({
  storeId: integ.storeId, direction: 'in', action, status, note: String(note || '').slice(0, 500), attempts: 1,
}).catch((err) => logger.warn(`Pet Pooja log failed: ${err.message}`));

// ----- Push Menu -----
const menuFail = (message) => ({ code: 400, body: { success: '0', message } });

export async function pushMenu(body = {}, scope = {}) {
  const parsed = petpooja.parseMenu(body);
  const integ = await integrationFor(parsed.restaurantIds, scope);
  if (!integ) return menuFail('Menu sync failed: unknown restaurant ID');
  if (!integ.syncMenu) {
    await log(integ, 'menu_push', 'ignored', 'Menu push refused: "Accept menu from Pet Pooja" is off');
    return menuFail('Menu sync failed: menu sync is switched off for this outlet');
  }
  if (!parsed.items.length) {
    await log(integ, 'menu_push', 'failed', 'Menu push had no items');
    return menuFail('Menu sync failed: no items');
  }
  const out = await storeMenu(integ, parsed, 'push');
  await log(integ, 'menu_push', 'applied', `Menu received: ${out.items} items, ${out.addons} add-ons; ${out.autoMapped} mapped by name`);
  emitStoreEvent(integ.storeId, 'pos');
  return { code: 200, body: { success: '1', message: 'Menu items are successfully listed.' } };
}

// ----- Item / add-on stock -----
const stockOk = { code: 200, body: { code: 200, status: 'success', message: 'Stock status updated successfully' } };
const stockFail = (message = 'Stock status not updated successfully') => ({ code: 400, body: { code: 400, status: 'failed', message } });

/** Our product ids mapped to these Pet Pooja item ids (a Pet Pooja item may stand for several sizes of one product). */
function productIdsFor(integ, ppIds) {
  const wanted = new Set(ppIds);
  const out = new Set();
  for (const [key, value] of integ.itemMap || []) {
    if (key.startsWith('addon:')) continue;
    if (wanted.has(String(value).split('|')[0])) out.add(key.split('|')[0]);
  }
  return [...out];
}

/** Switches products on / off in this store's menu (the Store Pricing availability). -> number changed */
async function setAvailability(integ, productIds, available) {
  if (!productIds.length) return 0;
  const franchiseId = integ.franchiseId || (await FoodStore.findById(integ.storeId).select('franchiseId').lean())?.franchiseId;
  if (!franchiseId) return 0;
  const products = await Product.find({ _id: { $in: productIds } }).select('name price sizes').lean();
  let changed = 0;
  for (const p of products) {
    const rule = await StoreProductPrice.findOne({ storeId: integ.storeId, productId: p._id });
    if (!rule) {
      if (available) continue;   // no rule = sold at catalogue prices already
      const base = catalogRule(p);
      await StoreProductPrice.create({ ...base, storeId: integ.storeId, franchiseId, productId: p._id, availability: 'UNAVAILABLE', status: 'ACTIVE', updatedBy: BY });
      changed += 1;
      continue;
    }
    const target = available ? 'AVAILABLE' : 'UNAVAILABLE';
    if (rule.availability === target && (available || rule.status === 'ACTIVE')) continue;
    rule.availability = target;
    // an inactive rule is ignored by the menu: to take an item off, it must be active (at catalogue prices)
    if (!available && rule.status !== 'ACTIVE') Object.assign(rule, catalogRule(p), { availability: 'UNAVAILABLE', status: 'ACTIVE' });
    rule.updatedBy = BY;
    await rule.save();
    changed += 1;
  }
  return changed;
}

export async function itemStock(body = {}, scope = {}) {
  const s = petpooja.parseStock(body);
  const integ = await integrationFor(s.restaurantId, scope);
  if (!integ) return stockFail('Unknown restaurant ID');
  if (!integ.enabled || !integ.syncStock) {
    await log(integ, 'item_stock', 'ignored', 'Stock update refused: "Item stock from Pet Pooja" is off');
    return stockFail('Stock sync is switched off for this outlet');
  }
  if (!s.ids.length) return stockFail('No item IDs');
  if (s.type === 'addon') {
    await log(integ, 'item_stock', 'ignored', `Add-on ${s.inStock ? 'in' : 'out of'} stock (${s.ids.length}): add-ons are not switched per store in this app`);
    return stockOk;
  }
  const productIds = productIdsFor(integ, s.ids);
  const changed = await setAvailability(integ, productIds, s.inStock);
  const others = (integ.stockHolds || []).filter((h) => !productIds.includes(String(h.productId)));
  const holds = !s.inStock && s.turnOnAt ? productIds.map((id) => ({ productId: id, until: s.turnOnAt })) : [];
  await StorePosIntegration.updateOne({ _id: integ._id }, { $set: { stockHolds: [...others, ...holds] } });
  const unknown = s.ids.length - s.ids.filter((id) => productIdsFor(integ, [id]).length).length;
  await log(integ, 'item_stock', productIds.length ? 'applied' : 'ignored',
    `${s.inStock ? 'In stock' : 'Out of stock'}: ${changed} product(s) changed`
    + `${holds.length ? `, back on ${s.turnOnAt.toISOString()}` : ''}${unknown ? `; ${unknown} Pet Pooja item(s) not mapped` : ''}`);
  if (changed) emitStoreEvent(integ.storeId, 'pos');
  return stockOk;
}

// ----- Store status -----
export async function getStoreStatus(body = {}, scope = {}) {
  const integ = await integrationFor(body.restID ?? body.restId, scope);
  if (!integ) return { code: 400, body: { http_code: 400, status: 'failed', message: 'Unknown restaurant ID' } };
  const hours = await StoreHours.findOne({ storeId: integ.storeId }).lean();
  const open = !isManuallyClosed(hours) && isOpenAt(hours);
  return { code: 200, body: { http_code: 200, status: 'success', store_status: open ? '1' : '0', message: 'Store Delivery Status fetched successfully' } };
}

async function setStoreOpen(integ, open) {
  const store = await FoodStore.findById(integ.storeId).select('franchiseId').lean();
  await StoreHours.findOneAndUpdate(
    { storeId: integ.storeId },
    { $set: { manualClosure: open ? { active: false, by: '', at: null } : { active: true, by: BY, at: new Date() } }, $setOnInsert: { franchiseId: store?.franchiseId } },
    { upsert: true },
  );
}

export async function updateStoreStatus(body = {}, scope = {}) {
  const s = petpooja.parseStoreStatus(body);
  const integ = await integrationFor(s.restaurantId, scope);
  const fail = (message) => ({ code: 400, body: { http_code: 400, status: 'failed', message } });
  if (!integ) return fail('Unknown restaurant ID');
  if (!integ.enabled || !integ.syncStoreStatus) {
    await log(integ, 'store_status', 'ignored', `Store ${s.open ? 'on' : 'off'} refused: "Store on / off from Pet Pooja" is off`);
    return fail('Store status sync is switched off for this outlet');
  }
  await setStoreOpen(integ, s.open);
  await StorePosIntegration.updateOne({ _id: integ._id }, { $set: { 'storeHold.until': !s.open && s.turnOnAt ? s.turnOnAt : null } });
  await log(integ, 'store_status', 'applied', s.open
    ? 'Store opened from Pet Pooja'
    : `Store closed from Pet Pooja${s.reason ? `: ${s.reason}` : ''}${s.turnOnAt ? ` (reopens ${s.turnOnAt.toISOString()})` : ''}`);
  emitStoreEvent(integ.storeId, 'pos');
  return { code: 200, body: { http_code: 200, status: 'success', message: `Store Status updated successfully for store ${s.restaurantId}` } };
}

/** Puts back items and stores whose Pet Pooja "turn on" time has come (from the outbox sweep). */
export async function releaseHolds(now = new Date()) {
  const due = await StorePosIntegration.find({ $or: [{ 'stockHolds.until': { $lte: now } }, { 'storeHold.until': { $lte: now } }] });
  for (const integ of due) {
    const items = (integ.stockHolds || []).filter((h) => h.until && h.until <= now);
    if (items.length) {
      if (integ.enabled && integ.syncStock) await setAvailability(integ, items.map((h) => String(h.productId)), true);
      await StorePosIntegration.updateOne({ _id: integ._id }, { $pull: { stockHolds: { until: { $lte: now } } } });
      await log(integ, 'item_stock', 'applied', `Back in stock at the time Pet Pooja set: ${items.length} product(s)`);
    }
    if (integ.storeHold?.until && integ.storeHold.until <= now) {
      const hours = await StoreHours.findOne({ storeId: integ.storeId }).select('manualClosure').lean();
      // only a closure Pet Pooja made is lifted: a manager's own "Closed" stays
      if (integ.enabled && integ.syncStoreStatus && hours?.manualClosure?.active && hours.manualClosure.by === BY) {
        await setStoreOpen(integ, true);
        await log(integ, 'store_status', 'applied', 'Store reopened at the time Pet Pooja set');
      }
      await StorePosIntegration.updateOne({ _id: integ._id }, { $set: { 'storeHold.until': null } });
    }
    emitStoreEvent(integ.storeId, 'pos');
  }
}
