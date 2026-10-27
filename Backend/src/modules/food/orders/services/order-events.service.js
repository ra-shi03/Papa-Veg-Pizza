import { FoodOrder } from '../models/order.model.js';
import { getIO, rooms } from '../../../../config/socket.js';
import { logger } from '../../../../utils/logger.js';

// Live order events for the store and franchise screens (they used to poll every 8 seconds).
//
// Every change to an order is seen once, here, whichever code path made it, by watching the orders collection.
// The event goes to the store room and the franchise room of the ORDER (taken from the saved order record), never
// to rooms named by a client. Sockets join those rooms from their own signed token (config/socket.js).
// The payload carries ids and states only: no customer details, no OTP.
//
// event 'order_event': { type, orderId, orderMongoId, storeId, franchiseId, orderStatus, stage, deliveryPartnerId, at }
//   type: new_order | stage_changed | rider_assigned | delivered | cancelled | status_changed

const touched = (fields, prefix) => Object.keys(fields).some((k) => k === prefix || k.startsWith(`${prefix}.`));

/** Which events a change-stream document means. Pure, so it can be tested without a database. */
export function eventTypesOf(change) {
  const doc = change.fullDocument;
  if (!doc) return [];
  if (change.operationType === 'insert') return ['new_order'];
  const fields = change.updateDescription?.updatedFields || {};
  const replaced = change.operationType === 'replace';
  const types = [];
  if (replaced || touched(fields, 'orderStatus')) {
    const status = String(doc.orderStatus || '');
    if (status.startsWith('cancelled')) types.push('cancelled');
    else if (status === 'delivered') types.push('delivered');
    else if (!replaced) types.push('status_changed');
  }
  if (touched(fields, 'kitchen')) types.push('stage_changed');
  if ((touched(fields, 'dispatch.deliveryPartnerId') || touched(fields, 'dispatch')) && doc.dispatch?.deliveryPartnerId) types.push('rider_assigned');
  return types;
}

export function buildEvent(type, doc) {
  return {
    type,
    orderId: doc.order_id || doc.orderId || String(doc._id),
    orderMongoId: String(doc._id),
    storeId: doc.storeId ? String(doc.storeId) : null,
    franchiseId: doc.franchiseId ? String(doc.franchiseId) : null,
    orderStatus: doc.orderStatus || null,
    stage: doc.kitchen?.stage || null,
    deliveryPartnerId: doc.dispatch?.deliveryPartnerId ? String(doc.dispatch.deliveryPartnerId) : null,
    at: new Date().toISOString(),
  };
}

export function emitOrderEvents(change) {
  const io = getIO();
  if (!io) return;
  const doc = change.fullDocument;
  for (const type of eventTypesOf(change)) {
    const event = buildEvent(type, doc);
    const targets = [];
    if (doc.storeId) targets.push(rooms.store(doc.storeId));
    if (doc.franchiseId) targets.push(rooms.franchise(doc.franchiseId));
    if (targets.length) io.to(targets).emit('order_event', event);
  }
}

let stream = null;
let stopped = true;

/** Starts watching orders (needs a replica set, which the app already requires). Safe to call twice. */
export function startOrderEventStream() {
  if (stream) return;
  stopped = false;
  const open = () => {
    try {
      stream = FoodOrder.watch(
        [{ $match: { operationType: { $in: ['insert', 'update', 'replace'] } } }],
        { fullDocument: 'updateLookup' },
      );
      stream.on('change', (change) => {
        try { emitOrderEvents(change); } catch (err) { logger.error(`Order event emit failed: ${err.message}`); }
      });
      stream.on('error', (err) => {
        logger.error(`Order event stream error: ${err.message}`);
        stream?.close().catch(() => {});
        stream = null;
        if (!stopped) setTimeout(open, 5000).unref();
      });
    } catch (err) {
      stream = null;
      logger.warn(`Order event stream not started: ${err.message}`);
    }
  };
  open();
}

export async function stopOrderEventStream() {
  stopped = true;
  const s = stream;
  stream = null;
  await s?.close().catch(() => {});
}
