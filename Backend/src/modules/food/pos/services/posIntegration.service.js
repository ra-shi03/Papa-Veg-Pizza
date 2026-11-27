import mongoose from 'mongoose';
import { StorePosIntegration } from '../models/storePosIntegration.model.js';
import { PosSyncLog, POS_SYNC_STATUSES } from '../models/posSyncLog.model.js';
import { FoodStore } from '../../store/models/store.model.js';
import { StoreManager } from '../../franchise/models/storeManager.model.js';
import { ForbiddenError, NotFoundError, ValidationError } from '../../../../core/auth/errors.js';
import { config } from '../../../../config/env.js';
import { sealSecret, openSecret, secretView, newCallbackKey } from './posSecrets.js';
import * as petpooja from './petpooja.adapter.js';

// A store's own Pet Pooja setup (each store has its own Pet Pooja account). Only the store manager of the store reads or
// changes it: the store comes from the token, never from the request. The keys are write-only from the screen.

const normalize = (role) => String(role || '').trim().replace(/-/g, '_').toUpperCase();
const isId = (v) => mongoose.Types.ObjectId.isValid(String(v || ''));
const oid = (v) => new mongoose.Types.ObjectId(String(v));
const SECRET_FIELDS = ['appKey', 'appSecret', 'accessToken'];
const SWITCHES = ['enabled', 'pushOrders', 'acceptStatusUpdates', 'syncMenu', 'syncStock', 'syncStoreStatus'];

/** The store manager's own store, or 403. */
export async function managerStore(user) {
  if (normalize(user?.role) !== 'STORE_MANAGER') throw new ForbiddenError('Only the store manager can do this.');
  if (!isId(user.storeId)) throw new ForbiddenError('You are not assigned to a store.');
  const store = await FoodStore.findById(oid(user.storeId)).select('storeName franchiseId address phone').lean();
  if (!store) throw new NotFoundError('Store not found');
  return store;
}

/** The store's Pet Pooja record; created (switched off) the first time the manager opens the page. */
export async function integrationOf(store, { create = false } = {}) {
  const found = await StorePosIntegration.findOne({ storeId: store._id, provider: petpooja.PROVIDER });
  if (found || !create) return found;
  try {
    return await StorePosIntegration.create({ storeId: store._id, franchiseId: store.franchiseId || null, provider: petpooja.PROVIDER, callbackKey: newCallbackKey() });
  } catch (err) {
    if (err?.code === 11000) return StorePosIntegration.findOne({ storeId: store._id, provider: petpooja.PROVIDER });
    throw err;
  }
}

/** The plain keys of a record (server side only, never returned to a screen). */
export const keysOf = (doc) => ({
  restaurantId: doc?.restaurantId || '',
  appKey: openSecret(doc?.appKey),
  appSecret: openSecret(doc?.appSecret),
  accessToken: openSecret(doc?.accessToken),
});

/** This server's public address: PUBLIC_API_URL, else the address the request came in on. */
export const publicBase = (req) => (config.publicApiUrl || (req ? `${req.protocol}://${req.get('host')}` : '')).replace(/\/+$/, '');
export const callbackUrlOf = (doc, base) => (doc?.callbackKey && base ? `${base}/api/v1/pos/petpooja/callback/${doc.callbackKey}` : '');
/** The links to give Pet Pooja for this store's menu, stock and store status (same secret key as the callback link). */
export const HOOKS = ['pushmenu', 'item_stock', 'item_stock_off', 'get_store_status', 'update_store_status'];
export const hookUrlsOf = (doc, base) => Object.fromEntries(HOOKS.map((h) => [h, doc?.callbackKey && base ? `${base}/api/v1/pos/petpooja/hooks/${doc.callbackKey}/${h}` : '']));
/** The store's chosen Pet Pooja server (petpooja.adapter.js endpointUrl). */
export const serverConf = (doc) => ({ apiEnv: doc?.apiEnv || '', apiBaseUrl: doc?.apiBaseUrl || '' });
/** The address Pet Pooja must use to reach this server for this store: the one the manager saved, else the given one. */
export const linkBase = (doc, base) => String(doc?.publicUrl || base || '').replace(/\/+$/, '');

/** Is the store set up AND switched on to run its orders in Pet Pooja? (used by the order screens and the outbox) */
export const runsOrdersInPos = (doc) => !!(doc?.enabled && doc.acceptStatusUpdates);

async function counts(storeId) {
  const since = new Date(Date.now() - 24 * 3600 * 1000);
  const [pending, failed, skipped, sentToday, inToday] = await Promise.all([
    PosSyncLog.countDocuments({ storeId, direction: 'out', status: 'pending' }),
    PosSyncLog.countDocuments({ storeId, direction: 'out', status: 'failed' }),
    PosSyncLog.countDocuments({ storeId, direction: 'out', status: 'skipped' }),
    PosSyncLog.countDocuments({ storeId, direction: 'out', status: 'sent', updatedAt: { $gte: since } }),
    PosSyncLog.countDocuments({ storeId, direction: 'in', createdAt: { $gte: since } }),
  ]);
  return { pending, failed, skipped, sentToday, updatesReceivedToday: inToday };
}

/** What the settings page shows: the switches, the restaurant ID, whether each key is set (last 4 only), the callback link. */
export async function view(doc, base) {
  const keys = keysOf(doc);
  const missing = petpooja.missingSetup(keys);
  return {
    provider: petpooja.PROVIDER,
    ...Object.fromEntries(SWITCHES.map((k) => [k, !!doc[k]])),
    restaurantId: doc.restaurantId || '',
    appKey: secretView(doc.appKey),
    appSecret: secretView(doc.appSecret),
    accessToken: secretView(doc.accessToken),
    mappedItems: doc.itemMap?.size || 0,
    apiEnv: doc.apiEnv || '',
    apiBaseUrl: doc.apiBaseUrl || '',
    publicUrl: doc.publicUrl || '',
    callbackUrl: callbackUrlOf(doc, linkBase(doc, base)),
    hookUrls: hookUrlsOf(doc, linkBase(doc, base)),
    setupComplete: missing.length === 0,
    missing,
    serverReady: petpooja.apiReady(serverConf(doc)),   // false until a Pet Pooja server is chosen (nothing is sent before that)
    runsOrdersInPos: runsOrdersInPos(doc),
    lastTest: doc.lastTest?.at ? { at: doc.lastTest.at, ok: !!doc.lastTest.ok, message: doc.lastTest.message || '' } : null,
    updatedAt: doc.updatedAt || null,
    updatedByName: doc.updatedByName || '',
    stats: await counts(doc.storeId),
  };
}

/** Remembers the address the panel reached this server on, for the callback link sent with each order. */
async function rememberBase(doc, base) {
  if (base && /^https?:\/\//.test(base) && doc.callbackBase !== base) {
    doc.callbackBase = base.slice(0, 300);
    await doc.save();
  }
}

/** GET /food/store/pos/petpooja */
export async function getSettings(user, base) {
  const store = await managerStore(user);
  const doc = await integrationOf(store, { create: true });
  await rememberBase(doc, base);
  return view(doc, base);
}

/**
 * PUT /food/store/pos/petpooja { enabled?, pushOrders?, acceptStatusUpdates?, syncMenu?, syncStock?, syncStoreStatus?,
 *   restaurantId?, appKey?, appSecret?, accessToken?, clear?: ['appKey', ...], apiEnv?, apiBaseUrl?, publicUrl? }
 * A key that is not sent (or sent empty) is kept; `clear` removes one. Pet Pooja cannot be switched on until the
 * restaurant ID and all three keys are saved.
 */
export async function saveSettings(user, body = {}, base) {
  const store = await managerStore(user);
  const doc = await integrationOf(store, { create: true });
  for (const k of SWITCHES) if (typeof body[k] === 'boolean') doc[k] = body[k];
  if (typeof body.restaurantId === 'string') {
    const rid = body.restaurantId.trim();
    if (rid && !/^[A-Za-z0-9_-]{1,60}$/.test(rid)) throw new ValidationError('restaurantId: letters, numbers, - and _ only (up to 60).');
    // Pet Pooja's menu / stock / store calls name the outlet only by this ID, so two stores cannot share it
    if (rid && rid !== doc.restaurantId
      && await StorePosIntegration.exists({ provider: petpooja.PROVIDER, restaurantId: rid, storeId: { $ne: store._id } })) {
      throw new ValidationError('This Pet Pooja restaurant ID is already used by another store.');
    }
    doc.restaurantId = rid;
  }
  for (const k of SECRET_FIELDS) {
    const v = typeof body[k] === 'string' ? body[k].trim() : '';
    if (v) {
      if (v.length > 300) throw new ValidationError(`${k}: too long.`);
      doc[k] = sealSecret(v);
    }
  }
  for (const k of Array.isArray(body.clear) ? body.clear : []) if (SECRET_FIELDS.includes(k)) doc[k] = sealSecret('');

  // Which Pet Pooja server, and the address Pet Pooja reaches this server on
  if (typeof body.apiEnv === 'string') doc.apiEnv = body.apiEnv;
  if (typeof body.apiBaseUrl === 'string') {
    const url = body.apiBaseUrl.trim().replace(/\/+$/, '');
    if (url && !petpooja.validApiBaseUrl(url)) throw new ValidationError('Pet Pooja production URL: an https:// address.');
    doc.apiBaseUrl = url;
  }
  if (doc.apiEnv === 'production' && !doc.apiBaseUrl) throw new ValidationError('Add the Pet Pooja production URL (from Pet Pooja).');
  if (typeof body.publicUrl === 'string') {
    const url = body.publicUrl.trim().replace(/\/+$/, '');
    if (url && !/^https?:\/\/[^\s/]+(\/[^\s]*)?$/i.test(url)) throw new ValidationError('Public server URL: an http(s):// address.');
    doc.publicUrl = url;
  }

  const missing = petpooja.missingSetup(keysOf(doc));
  if (doc.enabled && missing.length) {
    throw new ValidationError(`Add the ${missing.join(', ')} before switching Pet Pooja on.`);
  }
  doc.updatedBy = isId(user.userId) ? oid(user.userId) : null;
  doc.updatedByName = (await StoreManager.findOne({ userId: user.userId }).select('name').lean())?.name || 'Store Manager';
  if (base && /^https?:\/\//.test(base)) doc.callbackBase = base.slice(0, 300);
  await doc.save();

  // Orders that were waiting because the store was not set up go again now that it is
  if (doc.enabled && doc.pushOrders && !missing.length) {
    await PosSyncLog.updateMany(
      { storeId: store._id, direction: 'out', status: 'skipped' },
      { $set: { status: 'pending', nextAttemptAt: new Date(), attempts: 0, lastError: '' } },
    );
  }
  return view(doc, base);
}

/** POST /food/store/pos/petpooja/test : checks the setup and, when the server knows Pet Pooja's address, makes a read-only call. */
export async function testConnection(user, base) {
  const store = await managerStore(user);
  const doc = await integrationOf(store, { create: true });
  const keys = keysOf(doc);
  const missing = petpooja.missingSetup(keys);
  let result;
  if (missing.length) result = { ok: false, message: `Missing: ${missing.join(', ')}.` };
  else if (!petpooja.endpointUrl('fetch_menu', serverConf(doc))) result = { ok: false, message: 'Your keys are saved. Choose the Pet Pooja server (Staging or Production) to connect.' };
  else {
    // Fetch Menu is read-only: a good answer proves the restaurant ID and the three keys
    const res = await petpooja.fetchMenu(keys, serverConf(doc));
    result = { ok: res.ok, message: res.ok ? 'Pet Pooja answered: the keys work.' : res.message };
  }
  doc.lastTest = { at: new Date(), ok: result.ok, message: result.message.slice(0, 300) };
  await doc.save();
  await PosSyncLog.create({ storeId: store._id, direction: 'out', action: 'test', status: result.ok ? 'sent' : 'failed', note: result.message.slice(0, 500), attempts: 1 });
  return { ...result, settings: await view(doc, base) };
}

/** POST /food/store/pos/petpooja/callback-key : a new callback link (the old one stops working at once). */
export async function rotateCallbackKey(user, base) {
  const store = await managerStore(user);
  const doc = await integrationOf(store, { create: true });
  doc.callbackKey = newCallbackKey();
  await doc.save();
  return view(doc, base);
}

const logDto = (r) => ({
  _id: String(r._id), direction: r.direction, action: r.action, status: r.status, attempts: r.attempts || 0,
  orderId: r.orderId ? String(r.orderId) : null, orderNumber: r.orderNumber || '', posOrderId: r.posOrderId || '', posStatus: r.posStatus || '',
  note: r.note || '', lastError: r.lastError || '', nextAttemptAt: r.nextAttemptAt || null, createdAt: r.createdAt, updatedAt: r.updatedAt,
});

/** GET /food/store/pos/petpooja/logs?status=&direction=&search=&limit= : the store's sync log, newest first. */
export async function listLogs(user, q = {}) {
  const store = await managerStore(user);
  const filter = { storeId: store._id };
  if (POS_SYNC_STATUSES.includes(q.status)) filter.status = q.status;
  if (q.direction === 'in' || q.direction === 'out') filter.direction = q.direction;
  const search = String(q.search || '').trim().slice(0, 40);
  if (search) filter.orderNumber = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
  const limit = Math.min(200, Math.max(1, parseInt(q.limit, 10) || 50));
  const rows = await PosSyncLog.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
  return { logs: rows.map(logDto), stats: await counts(store._id) };
}

/** POST /food/store/pos/petpooja/logs/:id/retry : sends a failed or skipped order again. */
export async function retryLog(user, id) {
  const store = await managerStore(user);
  if (!isId(id)) throw new NotFoundError('Sync entry not found');
  const row = await PosSyncLog.findOneAndUpdate(
    { _id: oid(id), storeId: store._id, direction: 'out', action: { $in: ['save_order', 'cancel_order'] }, status: { $in: ['failed', 'skipped'] } },
    { $set: { status: 'pending', attempts: 0, nextAttemptAt: new Date(), lastError: '' } },
    { new: true },
  ).lean();
  if (!row) {
    if (await PosSyncLog.exists({ _id: oid(id), storeId: store._id })) throw new ValidationError('Only a failed or skipped order can be sent again.');
    throw new NotFoundError('Sync entry not found');
  }
  const { processRow } = await import('./posOutbox.service.js');
  await processRow(row._id);
  return logDto(await PosSyncLog.findById(row._id).lean());
}

export { logDto };
