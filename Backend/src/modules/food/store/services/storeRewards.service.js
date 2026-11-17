import { ForbiddenError, NotFoundError, ValidationError } from '../../../../core/auth/errors.js';
import { Refund } from '../../../../core/payments/models/refund.model.js';
import { FoodOrder } from '../../orders/models/order.model.js';
import { getWalletSummary, listWalletTransactions } from '../../user/services/walletLedger.service.js';
import { getRewardsSummary, listRewardTransactions } from '../../user/services/rewards.service.js';
import { RewardRedemption } from '../../user/models/rewardRedemption.model.js';
import { lookupByCode, confirmRedemption, cancelRedemption, withStoreNames } from '../../user/services/rewardRedemption.service.js';
import { customerProfile } from './storeCrm.service.js';
import mongoose from 'mongoose';

// Store manager panel: a customer's wallet and rewards, and handing over a reward the customer claimed with a code.
// Only the store manager of the store; the customer must be one of that store's customers (same rule as the Customers page).

const role = (u) => String(u?.role || '').trim().replace(/-/g, '_').toUpperCase();
const manager = (user) => {
  if (role(user) !== 'STORE_MANAGER') throw new ForbiddenError('Only the store manager can do this.');
  if (!mongoose.Types.ObjectId.isValid(String(user.storeId || ''))) throw new ForbiddenError('No store is linked to your account.');
  return String(user.storeId);
};

/** The customer's wallet, points and reward codes, and the wallet refunds asked for on their orders at this store. */
export async function customerWalletAndRewards(user, customerId) {
  const storeId = manager(user);
  await customerProfile(user, customerId); // 404 unless this is a customer of the store
  const [wallet, walletTx, rewards, rewardTx, redemptions, orders] = await Promise.all([
    getWalletSummary(customerId),
    listWalletTransactions(customerId, { page: 1, limit: 20 }),
    getRewardsSummary(customerId),
    listRewardTransactions(customerId, { page: 1, limit: 20 }),
    RewardRedemption.find({ userId: customerId }).sort({ createdAt: -1 }).limit(10).lean(),
    FoodOrder.find({ userId: customerId, storeId }).select('_id order_id').lean(),
  ]);
  const refunds = orders.length
    ? await Refund.find({ orderId: { $in: orders.map((o) => o._id) }, refundTo: 'wallet' }).sort({ createdAt: -1 }).limit(20).lean()
    : [];
  const numberOf = new Map(orders.map((o) => [String(o._id), o.order_id || String(o._id)]));
  return {
    wallet: { balance: wallet.balance, status: wallet.status },
    walletTransactions: walletTx.transactions,
    rewards,
    rewardTransactions: rewardTx.transactions,
    redemptions: (await withStoreNames(redemptions.map((r) => ({ id: String(r._id), code: r.status === 'PENDING' ? r.code : '', status: r.status, product: r.product, points: r.points, createdAt: r.createdAt, redeemedAt: r.redeemedAt || null, expiresAt: r.expiresAt, storeId: r.storeId, handledByName: r.handledByName || '' })))),
    walletRefunds: refunds.map((r) => ({ id: String(r._id), orderNumber: numberOf.get(String(r.orderId)) || '', amount: r.amount, reason: r.reason, status: r.status, createdAt: r.createdAt, rejectionReason: r.rejectionReason || '' })),
  };
}

export async function lookupRewardCode(user, code) {
  manager(user);
  return lookupByCode(code);
}

export async function confirmRewardCode(user, code) {
  const storeId = manager(user);
  return confirmRedemption(code, { storeId, actorId: user.userId, actorName: user.name || user.email || 'Store manager' });
}

export async function cancelRewardCode(user, code, reason) {
  manager(user);
  const row = await lookupByCode(code);
  if (!row) throw new NotFoundError('This code was not found.');
  if (!String(reason || '').trim()) throw new ValidationError('Give a reason for cancelling.');
  return cancelRedemption({ code, reason: String(reason).trim() });
}
