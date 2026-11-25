import mongoose from 'mongoose';
import { FoodOrder } from '../../orders/models/order.model.js';
import { KitchenTask } from '../../store/models/kitchenTask.model.js';
import { updateOrderStatusStore } from '../../orders/services/order.service.js';
import { buildOrderIdentityFilter, pushStatusHistory } from '../../orders/services/order.helpers.js';
import { requestRefund, approveRefund } from '../../../../core/payments/refund.service.js';
import { Refund } from '../../../../core/payments/models/refund.model.js';
import { notifyOwnersSafely, storeManagerUserIds, franchiseAdminUserIds } from '../../../../core/notifications/firebase.service.js';
import { emitStoreEvent } from '../../../../config/socket.js';
import { NotFoundError, ValidationError } from '../../../../core/auth/errors.js';

// What the super admin can do to an order from All Orders / Order Tracking: cancel it, pay money back, and chase a
// delay. Super admin only (the route is in the requireSuperAdmin section).

const text = (v, max = 300) => String(v ?? '').trim().slice(0, max);
const DONE = ['delivered', 'cancelled_by_user', 'cancelled_by_store', 'cancelled_by_admin'];

async function findOrder(orderId) {
  const identity = buildOrderIdentityFilter(orderId);
  const order = identity ? await FoodOrder.findOne(identity) : null;
  if (!order) throw new NotFoundError('Order not found');
  return order;
}

/** Cancels an order that is not delivered yet. A paid order is refunded in full (wallet or the original payment). */
export async function cancelByAdmin(orderId, body = {}) {
  const reason = text(body.reason);
  if (reason.length < 5) throw new ValidationError('Give a reason; the customer and the store see it.');
  const order = await findOrder(orderId);
  if (DONE.includes(order.orderStatus)) throw new ValidationError('This order is already delivered or cancelled.');
  // claimed first, so two clicks can never cancel (and refund) the same order twice
  const claimed = await FoodOrder.updateOne({ _id: order._id, orderStatus: { $nin: DONE }, 'cancellation.at': null }, { $set: { 'cancellation.at': new Date() } });
  if (!claimed.modifiedCount) throw new ValidationError('This order is already being cancelled.');
  try {
    await updateOrderStatusStore(String(order._id), String(order.storeId), 'cancelled_by_admin', reason, { byRole: 'ADMIN' });
  } catch (err) {
    await FoodOrder.updateOne({ _id: order._id, orderStatus: { $nin: DONE } }, { $set: { 'cancellation.at': null } });
    throw err;
  }
  await KitchenTask.deleteMany({ orderId: order._id, status: { $ne: 'completed' } });
  emitStoreEvent(order.storeId, 'order');
  const fresh = await FoodOrder.findById(order._id).select('orderStatus payment.status payment.refund').lean();
  const refund = fresh.payment?.refund?.status;
  return {
    orderStatus: fresh.orderStatus,
    refund: refund && refund !== 'none' ? { status: refund, amount: fresh.payment.refund.amount } : null,
  };
}

/** Money back on a delivered or cancelled order that was paid: all that is left, or a part of it. Paid at once. */
export async function refundByAdmin(orderId, body = {}, adminId) {
  const reason = text(body.reason);
  if (reason.length < 5) throw new ValidationError('Give a reason for the refund.');
  const order = await findOrder(orderId);
  const created = await requestRefund({
    userId: String(order.userId), orderId: String(order._id), reason, amount: body.amount,
    destination: String(order.payment?.method).toLowerCase() === 'razorpay' ? 'source' : 'wallet',
  });
  await Refund.updateOne({ _id: created.id }, { $set: { requestedBy: 'ADMIN' } });
  const refund = await approveRefund(created.id, { adminId });
  return { refund };
}

/** A delayed order: tell the store's managers, the rider or the franchise admin, and note it on the order. */
export async function delayAlert(orderId, body = {}) {
  const target = String(body.target || '').toLowerCase();
  const message = text(body.message);
  if (!['store', 'rider', 'admin'].includes(target)) throw new ValidationError('Choose who to alert.');
  if (message.length < 5) throw new ValidationError('Write what is delayed.');
  const order = await findOrder(orderId);
  if (DONE.includes(order.orderStatus)) throw new ValidationError('This order is already finished.');
  const ref = order.order_id || String(order._id);
  let owners = [];
  if (target === 'store') owners = (await storeManagerUserIds(String(order.storeId))).map((id) => ({ ownerType: 'STORE_MANAGER', ownerId: id }));
  if (target === 'admin') owners = (await franchiseAdminUserIds(String(order.franchiseId))).map((id) => ({ ownerType: 'FRANCHISE_ADMIN', ownerId: id }));
  if (target === 'rider') {
    if (!order.dispatch?.deliveryPartnerId) throw new ValidationError('No rider is assigned to this order yet.');
    owners = [{ ownerType: 'DELIVERY_PARTNER', ownerId: String(order.dispatch.deliveryPartnerId) }];
  }
  if (!owners.length) throw new ValidationError('There is nobody to alert for this order.');
  await notifyOwnersSafely(owners, { title: `Order #${ref} is delayed`, body: message, data: { type: 'order_delay', orderId: String(order._id) } });
  pushStatusHistory(order, { byRole: 'ADMIN', from: order.orderStatus, to: order.orderStatus, note: `Delay alert to ${target}: ${message}` });
  await FoodOrder.updateOne({ _id: order._id }, { $set: { statusHistory: order.statusHistory } });
  if (target === 'store') emitStoreEvent(order.storeId, 'order');
  return { told: owners.length, orderId: String(new mongoose.Types.ObjectId(order._id)) };
}
