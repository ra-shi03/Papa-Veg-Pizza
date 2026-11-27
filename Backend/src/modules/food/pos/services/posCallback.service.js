import { StorePosIntegration } from '../models/storePosIntegration.model.js';
import { PosSyncLog } from '../models/posSyncLog.model.js';
import { FoodOrder } from '../../orders/models/order.model.js';
import { updateOrderStatusStore } from '../../orders/services/order.service.js';
import { pushStatusHistory } from '../../orders/services/order.helpers.js';
import { moveToStage } from '../../store/services/storeOrders.service.js';
import { emitStoreEvent } from '../../../../config/socket.js';
import { ForbiddenError, NotFoundError } from '../../../../core/auth/errors.js';
import * as petpooja from './petpooja.adapter.js';

// Status updates from a store's Pet Pooja (POST /v1/pos/petpooja/callback/<store's callback key>, no login: the key in the
// link names the store and is the secret). The store manager runs the order in Pet Pooja, so:
//   accepted   -> the order is accepted here (customer told, rider dispatch starts), with Pet Pooja's prep time
//   food ready -> the order is ready for pickup here (the rider flow carries on as usual)
//   cancelled  -> the order is cancelled by the store here (a paid online order gets its refund request)
//   dispatched / delivered -> nothing: delivery is always run by this app's riders (handover photo, OTP, ...)
// Everything goes through the same status functions the store panel uses, so the order flow and its rules are the same.
// Updates are applied once: an update for a step the order has already passed is recorded as ignored. Only when the store
// switched on "Let Pet Pooja update order status".

const IN_KITCHEN = ['confirmed', 'preparing'];
const CANCELLED = ['cancelled_by_user', 'cancelled_by_store', 'cancelled_by_admin'];
const DONE = [...CANCELLED, 'delivered'];
const KEY_RE = /^[a-f0-9]{64}$/;

// Who the order history names for a change Pet Pooja made
const posActor = (storeId) => ({ role: 'SYSTEM', userId: String(storeId), storeId: String(storeId) });

async function accept(order, storeId, prepMinutes) {
  await updateOrderStatusStore(String(order._id), String(storeId), 'confirmed', 'Accepted in Pet Pooja', { byRole: 'SYSTEM' });
  const fresh = await FoodOrder.findById(order._id);
  const now = new Date();
  const minutes = prepMinutes || 20;
  fresh.kitchen = {
    ...(fresh.kitchen?.toObject?.() || {}),
    stage: 'pending',
    priority: fresh.kitchen?.priority || 'normal',
    estimatedPrepMinutes: minutes,
    acceptedAt: now,
    expectedReadyAt: new Date(now.getTime() + minutes * 60000),
  };
  pushStatusHistory(fresh, { byRole: 'SYSTEM', byId: storeId, from: 'confirmed', to: 'confirmed', note: `Pet Pooja: prep time ${minutes} min` });
  await fresh.save();
  return fresh;
}

async function apply(order, storeId, parsed) {
  const status = order.orderStatus;
  switch (parsed.meaning) {
    case 'accepted':
      if (status !== 'created') return { status: 'ignored', note: `Already ${status.replace(/_/g, ' ')}` };
      await accept(order, storeId, parsed.prepMinutes);
      return { status: 'applied', note: 'Order accepted' };
    case 'food_ready': {
      if (DONE.includes(status) || !['created', ...IN_KITCHEN].includes(status)) return { status: 'ignored', note: `Already ${status.replace(/_/g, ' ')}` };
      const current = status === 'created' ? await accept(order, storeId, parsed.prepMinutes) : await FoodOrder.findById(order._id);
      if (current.kitchen) {
        current.kitchen.packaging = { ...(current.kitchen.packaging?.toObject?.() || {}), status: 'ready_for_pickup', sealedAt: new Date() };
        current.markModified('kitchen');
        await current.save();
      }
      await moveToStage(posActor(storeId), String(storeId), current, 'ready');
      return { status: 'applied', note: 'Order ready for pickup' };
    }
    case 'cancelled': {
      if (DONE.includes(status)) return { status: 'ignored', note: `Already ${status.replace(/_/g, ' ')}` };
      // marked first, so this cancellation is not sent back to Pet Pooja as one of ours
      await FoodOrder.updateOne({ _id: order._id }, { $set: { 'pos.status': 'cancelled' } });
      await updateOrderStatusStore(String(order._id), String(storeId), 'cancelled_by_store',
        `Cancelled in Pet Pooja${parsed.reason ? `: ${parsed.reason}` : ''}`, { byRole: 'SYSTEM' });
      const fresh = await FoodOrder.findById(order._id);
      if (fresh.payment?.status === 'paid') {
        fresh.payment.refund = { ...(fresh.payment.refund?.toObject?.() || {}), status: 'pending', amount: fresh.pricing?.total || 0 };
        await fresh.save();
      }
      return { status: 'applied', note: 'Order cancelled' };
    }
    case 'dispatched':
    case 'delivered':
      return { status: 'ignored', note: 'Delivery is run by this app\'s riders' };
    default:
      return { status: 'ignored', note: `Unknown Pet Pooja status "${parsed.code}"` };
  }
}

/** -> { applied, status, note } (the route answers 200 for every update it understood, so Pet Pooja does not keep resending). */
export async function handleCallback(key, body = {}) {
  if (!KEY_RE.test(String(key || ''))) throw new NotFoundError('Not found');
  const integ = await StorePosIntegration.findOne({ callbackKey: String(key), provider: petpooja.PROVIDER }).lean();
  if (!integ) throw new NotFoundError('Not found');
  const parsed = petpooja.parseCallback(body);
  // a callback for another outlet is refused (the key is per store; the restaurant id must match when both are known)
  if (integ.restaurantId && parsed.restaurantId && integ.restaurantId !== parsed.restaurantId) throw new ForbiddenError('Restaurant does not match');

  const storeId = integ.storeId;
  // The docs' callback names the order by OUR id (orderID); older ones also send clientorderID (ours) with orderID being
  // Pet Pooja's. Either is matched against our order number and the Pet Pooja id we saved.
  const order = parsed.refs.length
    ? await FoodOrder.findOne({ storeId, $or: [{ order_id: { $in: parsed.refs } }, { 'pos.posOrderId': { $in: parsed.refs } }] })
    : null;
  // Pet Pooja's own id, when the callback carries one that is not our order number
  const posOrderId = order && parsed.posOrderId && parsed.posOrderId !== order.order_id ? parsed.posOrderId : '';

  const log = (status, note, lastError = '') => PosSyncLog.create({
    storeId, orderId: order?._id || null, orderNumber: order?.order_id || parsed.refs[0] || '', direction: 'in', action: 'status_callback',
    status, note: note.slice(0, 500), lastError: lastError.slice(0, 500), posOrderId, posStatus: parsed.code, attempts: 1,
  });

  if (!order) {
    await log('ignored', 'No order of this store matches');
    return { applied: false, status: 'ignored', note: 'No order of this store matches' };
  }
  await FoodOrder.updateOne({ _id: order._id }, {
    $set: {
      'pos.provider': petpooja.PROVIDER, 'pos.lastPosStatus': parsed.code, 'pos.lastSyncAt': new Date(),
      ...(posOrderId ? { 'pos.posOrderId': posOrderId } : {}),
      ...(parsed.modified ? { 'pos.note': 'The order was changed in Pet Pooja: check it there' } : {}),
    },
  });
  if (!integ.enabled || !integ.acceptStatusUpdates) {
    await log('ignored', 'Pet Pooja status updates are switched off for this store');
    return { applied: false, status: 'ignored', note: 'Status updates are switched off for this store' };
  }
  try {
    const out = await apply(order, storeId, parsed);
    await log(out.status, out.note);
    emitStoreEvent(storeId, 'pos');
    return { applied: out.status === 'applied', ...out };
  } catch (err) {
    await log('failed', 'Could not apply the update', err.message || 'error');
    return { applied: false, status: 'failed', note: err.message || 'Could not apply the update' };
  }
}
