import mongoose from 'mongoose';
import { StorePosIntegration } from '../models/storePosIntegration.model.js';
import { PosSyncLog } from '../models/posSyncLog.model.js';
import { FoodOrder } from '../../orders/models/order.model.js';
import { FoodStore } from '../../store/models/store.model.js';
import { emitStoreEvent } from '../../../../config/socket.js';
import { logger } from '../../../../utils/logger.js';
import { keysOf, callbackUrlOf, publicBase } from './posIntegration.service.js';
import * as petpooja from './petpooja.adapter.js';

// Orders out to Pet Pooja. Each store that switched Pet Pooja on (and "send orders") gets every new order in its own
// Pet Pooja, where the manager runs it with the Zomato / Swiggy orders. An order cancelled here after it was sent is
// cancelled there too.
//
// This never blocks or changes the order flow: the order is placed, paid, accepted and delivered exactly as without Pet
// Pooja. Sending happens after the fact, from a row in food_pos_sync_logs (the outbox):
//   - queued when the order reaches the store (from the order event stream, and a sweep every 30 s that catches anything
//     the stream missed),
//   - sent at once, retried after 1, 2, 5, 10 and 30 minutes, then 'failed' (the manager can send it again),
//   - 'skipped' when the store is not set up or the server does not know Pet Pooja's address yet (sent once it is).

const BACKOFF_MIN = [1, 2, 5, 10, 30];
const MAX_ATTEMPTS = BACKOFF_MIN.length + 1;
const LEASE_MS = 2 * 60 * 1000;   // a row being sent is not picked up by another process for this long
const SWEEP_MS = 30 * 1000;
const CATCH_UP_HOURS = 6;
const CANCELLED = ['cancelled_by_user', 'cancelled_by_store', 'cancelled_by_admin'];
const DONE = [...CANCELLED, 'delivered'];
const oid = (v) => new mongoose.Types.ObjectId(String(v));

/** Has the order reached the store? (Online orders only once paid; cash and wallet orders straight away: same rule as Incoming Orders.) */
export const reachedStore = (o) => !!o && (['cash', 'wallet'].includes(o.payment?.method) || ['paid', 'authorized'].includes(o.payment?.status));

const pushingStore = (storeId) => StorePosIntegration.findOne({ storeId, enabled: true, pushOrders: true }).lean();

/** Queues the order for its store's Pet Pooja if the store sends orders there and it was not queued yet. Safe to call often. */
export async function queueOrderIfNeeded(order) {
  if (!order?.storeId || order.orderStatus !== 'created' || !reachedStore(order) || order.pos?.status) return null;
  const integ = await pushingStore(order.storeId);
  if (!integ) return null;
  let row;
  try {
    row = await PosSyncLog.create({
      storeId: order.storeId, orderId: order._id, orderNumber: order.order_id || '', direction: 'out', action: 'save_order',
      status: 'pending', nextAttemptAt: new Date(), dedupeKey: `save:${order._id}`,
    });
  } catch (err) {
    if (err?.code === 11000) return null;   // already queued
    throw err;
  }
  await FoodOrder.updateOne({ _id: order._id, pos: { $exists: false } }, { $set: { pos: { provider: petpooja.PROVIDER, status: 'pending' } } });
  processRow(row._id).catch((err) => logger.warn(`Pet Pooja send failed: ${err.message}`));
  return row;
}

/** An order that was sent to Pet Pooja and then cancelled here (by the customer or an admin) is cancelled there too. */
export async function queueCancelIfNeeded(order) {
  if (!order?.storeId || !CANCELLED.includes(order.orderStatus) || order.pos?.status !== 'sent') return null;
  try {
    const row = await PosSyncLog.create({
      storeId: order.storeId, orderId: order._id, orderNumber: order.order_id || '', direction: 'out', action: 'cancel_order',
      status: 'pending', nextAttemptAt: new Date(), dedupeKey: `cancel:${order._id}`,
    });
    processRow(row._id).catch((err) => logger.warn(`Pet Pooja cancel failed: ${err.message}`));
    return row;
  } catch (err) {
    if (err?.code === 11000) return null;
    throw err;
  }
}

/** From the order event stream: every insert / update of an order. */
export async function onOrderChanged(change) {
  const doc = change?.fullDocument;
  if (!doc) return;
  if (doc.orderStatus === 'created') await queueOrderIfNeeded(doc);
  else if (CANCELLED.includes(doc.orderStatus)) await queueCancelIfNeeded(doc);
}

const retryAt = (attempts) => (attempts >= MAX_ATTEMPTS ? null : new Date(Date.now() + BACKOFF_MIN[Math.max(0, attempts - 1)] * 60000));

async function finish(row, set, orderSet) {
  await PosSyncLog.updateOne({ _id: row._id }, { $set: set });
  if (orderSet && row.orderId) await FoodOrder.updateOne({ _id: row.orderId }, { $set: Object.fromEntries(Object.entries(orderSet).map(([k, v]) => [`pos.${k}`, v])) });
  emitStoreEvent(row.storeId, 'pos');
}

/** Sends one due outbox row (claims it first, so two processes never send the same row). */
export async function processRow(id) {
  const now = new Date();
  const row = await PosSyncLog.findOneAndUpdate(
    { _id: id, direction: 'out', status: 'pending', nextAttemptAt: { $lte: now } },
    { $set: { nextAttemptAt: new Date(now.getTime() + LEASE_MS) }, $inc: { attempts: 1 } },
    { new: true },
  ).lean();
  if (!row) return null;

  const [integ, order] = await Promise.all([
    StorePosIntegration.findOne({ storeId: row.storeId, provider: petpooja.PROVIDER }),
    row.orderId ? FoodOrder.findById(row.orderId).lean() : null,
  ]);
  const skip = (why) => finish(row, { status: 'skipped', lastError: why, nextAttemptAt: null }, { status: 'skipped', note: why, lastSyncAt: now });
  if (!order) return finish(row, { status: 'failed', lastError: 'The order no longer exists', nextAttemptAt: null });
  if (!integ?.enabled || (row.action === 'save_order' && !integ.pushOrders)) return skip('Pet Pooja is switched off for this store');
  const keys = keysOf(integ);
  const missing = petpooja.missingSetup(keys);
  if (missing.length) return skip(`Pet Pooja setup is missing: ${missing.join(', ')}`);
  if (!petpooja.apiReady()) return skip('The server is not connected to Pet Pooja yet (PETPOOJA_API_BASE_URL)');

  let res;
  let note = '';
  if (row.action === 'save_order') {
    if (DONE.includes(order.orderStatus)) return finish(row, { status: 'skipped', lastError: `Not sent: the order is already ${order.orderStatus.replace(/_/g, ' ')}`, nextAttemptAt: null }, { status: 'skipped', lastSyncAt: now });
    const store = await FoodStore.findById(order.storeId).select('storeName address phone').lean();
    const built = petpooja.buildSaveOrder(order, store, keys, { callbackUrl: callbackUrlOf(integ, publicBase() || integ.callbackBase), itemMap: integ.itemMap });
    if (built.unmapped.length) note = `${built.unmapped.length} item(s) not mapped to Pet Pooja items yet (sent with this app's ids)`;
    res = await petpooja.saveOrder(built.body);
  } else {
    res = await petpooja.cancelOrder(petpooja.buildCancelOrder(order, keys, order.cancellation?.reason));
  }

  if (res.skipped) return skip(res.message);
  if (res.ok) {
    return finish(row, { status: 'sent', lastError: '', note: note || res.message, posOrderId: res.posOrderId || row.posOrderId || '', nextAttemptAt: null },
      row.action === 'save_order'
        ? { status: 'sent', posOrderId: res.posOrderId || '', lastSyncAt: now, note: note.slice(0, 300) }
        : { status: 'cancelled', lastSyncAt: now });
  }
  const next = res.retry ? retryAt(row.attempts) : null;
  return finish(row, { status: next ? 'pending' : 'failed', lastError: res.message, nextAttemptAt: next },
    next ? null : { status: 'failed', note: res.message.slice(0, 300), lastSyncAt: now });
}

/** Catches orders the event stream missed, then sends every due row. */
export async function sweep() {
  const stores = await StorePosIntegration.find({ enabled: true, pushOrders: true }).select('storeId').lean();
  if (stores.length) {
    const missed = await FoodOrder.find({
      storeId: { $in: stores.map((s) => s.storeId) },
      orderStatus: 'created',
      pos: { $exists: false },
      createdAt: { $gte: new Date(Date.now() - CATCH_UP_HOURS * 3600000) },
    }).select('storeId orderStatus payment order_id pos').limit(200).lean();
    for (const o of missed) await queueOrderIfNeeded(o);
  }
  const due = await PosSyncLog.find({ direction: 'out', status: 'pending', nextAttemptAt: { $lte: new Date() } }).select('_id').limit(50).lean();
  for (const r of due) await processRow(r._id).catch((err) => logger.warn(`Pet Pooja send failed: ${err.message}`));
}

let timer = null;
/** Runs the sweep every 30 s (job worker only, see server.js). Safe to call twice. */
export function startPosOutbox() {
  if (timer) return;
  timer = setInterval(() => { sweep().catch((err) => logger.warn(`Pet Pooja sweep failed: ${err.message}`)); }, SWEEP_MS);
  timer.unref?.();
}
export function stopPosOutbox() {
  if (timer) clearInterval(timer);
  timer = null;
}

export { oid };
