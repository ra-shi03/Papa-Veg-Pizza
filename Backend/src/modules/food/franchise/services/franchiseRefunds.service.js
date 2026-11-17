import mongoose from 'mongoose';
import { ForbiddenError, NotFoundError, ValidationError } from '../../../../core/auth/errors.js';
import { Refund } from '../../../../core/payments/models/refund.model.js';
import { approveRefund, rejectRefund } from '../../../../core/payments/refund.service.js';
import { FoodOrder } from '../../orders/models/order.model.js';
import { FoodStore } from '../../store/models/store.model.js';

// Wallet refunds a store manager asked for: the franchise admin of that store's franchise approves or rejects them.
// (The super admin can do the same from the main Refunds page.) Approving credits the customer's wallet.

const role = (u) => String(u?.role || '').trim().replace(/-/g, '_').toUpperCase();

async function scope(user) {
  if (role(user) !== 'FRANCHISE_ADMIN') throw new ForbiddenError('Only a franchise admin can do this.');
  if (!mongoose.Types.ObjectId.isValid(String(user.franchiseId || ''))) throw new ForbiddenError('No franchise is linked to your account.');
  const stores = await FoodStore.find({ franchiseId: user.franchiseId }).select('storeName').lean();
  return { storeIds: stores.map((s) => String(s._id)), names: new Map(stores.map((s) => [String(s._id), s.storeName])) };
}

const shape = (r, order, names) => ({
  id: String(r._id),
  orderId: String(r.orderId),
  orderNumber: order?.order_id || String(r.orderId),
  customerName: order?.customerName || '',
  storeId: String(r.metadata?.storeId || ''),
  storeName: names.get(String(r.metadata?.storeId)) || '',
  orderTotal: Number(order?.pricing?.total) || 0,
  amount: r.amount,
  reason: r.reason || '',
  status: r.status,
  rejectionReason: r.rejectionReason || '',
  createdAt: r.createdAt,
  processedAt: r.processedAt || null,
});

export async function listStoreRefunds(user, { status } = {}) {
  const { storeIds, names } = await scope(user);
  const filter = { refundTo: 'wallet', 'metadata.source': 'store', 'metadata.storeId': { $in: storeIds } };
  if (status && status !== 'All') filter.status = String(status);
  const refunds = await Refund.find(filter).sort({ createdAt: -1 }).limit(200).lean();
  const orders = await FoodOrder.find({ _id: { $in: refunds.map((r) => r.orderId) } }).select('order_id customerName pricing.total').lean();
  const byId = new Map(orders.map((o) => [String(o._id), o]));
  return refunds.map((r) => shape(r, byId.get(String(r.orderId)), names));
}

async function ownRefund(user, id) {
  const { storeIds } = await scope(user);
  if (!mongoose.Types.ObjectId.isValid(String(id || ''))) throw new NotFoundError('Refund request not found');
  const refund = await Refund.findOne({ _id: id, refundTo: 'wallet', 'metadata.source': 'store', 'metadata.storeId': { $in: storeIds } }).lean();
  if (!refund) throw new NotFoundError('Refund request not found');
  return refund;
}

export async function approveStoreRefund(user, id) {
  await ownRefund(user, id);
  return approveRefund(id, { adminId: user.userId });
}

export async function rejectStoreRefund(user, id, reason) {
  await ownRefund(user, id);
  if (!String(reason || '').trim()) throw new ValidationError('Give a reason for rejecting.');
  return rejectRefund(id, { adminId: user.userId, reason: String(reason).trim() });
}
