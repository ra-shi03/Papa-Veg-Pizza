import mongoose from 'mongoose';
import { FoodOrder } from '../../modules/food/orders/models/order.model.js';
import { FoodTransaction } from '../../modules/food/orders/models/foodTransaction.model.js';
import { WalletAccount } from '../../modules/food/user/models/walletAccount.model.js';
import { WalletTransaction } from '../../modules/food/user/models/walletTransaction.model.js';
import { Refund } from './models/refund.model.js';
import * as foodTransactionService from '../../modules/food/orders/services/foodTransaction.service.js';
import { refundCancelledOrderToWallet } from './refund.service.js';
import { getRazorpayInstance, isRazorpayConfigured } from '../../modules/food/orders/helpers/razorpay.helper.js';
import { logger } from '../../utils/logger.js';

// Developer > Payment Reconciliation (Jharkhand Rasoi's checks, on Papa Veg's payment records).
// Finding problems is read-only (the optional gateway check only READS from Razorpay). Repairs run one order at a
// time, on an admin's click, and only do what cannot pay anyone twice:
//   - capture: Razorpay says the payment for this order was captured, for the full total -> mark the order paid
//     exactly once, as Papa Veg's own payment verification does
//   - refund_wallet: a paid online / wallet order was cancelled and never refunded -> refund to the customer's wallet
//     (idempotent per order, capped at the refundable amount)
//   - resync: the order's ledger row disagrees with the order -> bring the ledger row in line with the order
// A gateway refund stuck in "processing" is reported only: retrying it could refund twice if the first attempt went
// through, so someone checks it in the Razorpay dashboard.

const CANCELLED = ['cancelled_by_user', 'cancelled_by_store', 'cancelled_by_admin'];
const ONLINE = ['razorpay', 'razorpay_qr', 'wallet'];
const STUCK_REFUND_MINUTES = 15;
const GATEWAY_PENDING_MINUTES = 10;
const toPaise = (rupees) => Math.round((Number(rupees) || 0) * 100);
const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

const issue = (type, severity, orderId, detail, extra = {}) => ({ type, severity, orderId: String(orderId || ''), detail, ...extra });

/** The ledger status an order's payment status corresponds to. */
const LEDGER_STATUS_FOR = { paid: 'captured', refunded: 'refunded', failed: 'failed' };

// ---------------------------------------------------------------------------------------------------------------
// Customer wallets: balance must equal the ledger
// ---------------------------------------------------------------------------------------------------------------

/**
 * Each customer wallet's balance (available + reserved) must equal its ledger: completed credits minus completed
 * debits (a reservation is a PENDING debit, held in "reserved").
 */
export async function reconcileWallets({ maxMismatches = 200 } = {}) {
  const [wallets, ledger] = await Promise.all([
    WalletAccount.find({}).select('userId availableBalancePaise reservedBalancePaise').lean(),
    WalletTransaction.aggregate([
      { $match: { status: 'COMPLETED' } },
      { $group: { _id: '$userId', net: { $sum: { $cond: [{ $eq: ['$type', 'CREDIT'] }, '$amountPaise', { $multiply: ['$amountPaise', -1] }] } }, count: { $sum: 1 } } },
    ]),
  ]);
  const ledgerOf = new Map(ledger.map((row) => [String(row._id), row]));
  const mismatches = [];
  let mismatched = 0;
  const seen = new Set();

  const check = (userId, walletPaise, row) => {
    const ledgerPaise = row?.net || 0;
    const delta = walletPaise - ledgerPaise;
    if (delta !== 0) {
      mismatched += 1;
      if (mismatches.length < maxMismatches) {
        mismatches.push({
          entityType: 'user',
          entityId: userId,
          walletBalance: round2(walletPaise / 100),
          ledgerBalance: round2(ledgerPaise / 100),
          delta: round2(delta / 100),
          ledgerTransactionCount: row?.count || 0,
          hasMismatch: true,
        });
      }
    }
  };

  for (const wallet of wallets) {
    const userId = String(wallet.userId);
    seen.add(userId);
    check(userId, (wallet.availableBalancePaise || 0) + (wallet.reservedBalancePaise || 0), ledgerOf.get(userId));
  }
  // ledger money for a customer who has no wallet document at all
  for (const [userId, row] of ledgerOf) {
    if (!seen.has(userId) && row.net !== 0) check(userId, 0, row);
  }

  const checked = seen.size + [...ledgerOf.keys()].filter((id) => !seen.has(id)).length;
  return { checkedAt: new Date().toISOString(), checked, mismatched, byType: { user: { wallets: wallets.length, mismatched } }, mismatches };
}

// ---------------------------------------------------------------------------------------------------------------
// Orders <-> ledger <-> refunds <-> gateway
// ---------------------------------------------------------------------------------------------------------------

/** Razorpay's captured payment for an order's Razorpay order, or null. */
async function capturedGatewayPayment(rzOrderId) {
  const list = await getRazorpayInstance().orders.fetchPayments(rzOrderId);
  return (list?.items || []).find((p) => p.status === 'captured') || null;
}

/**
 * Finds payment inconsistencies (read-only).
 * @param {{ limit?: number, checkGateway?: boolean, minAgeMinutes?: number }} opts
 */
export async function reconcileOrders({ limit = 500, checkGateway = false, minAgeMinutes = 0 } = {}) {
  const issues = [];
  const settledBefore = new Date(Date.now() - minAgeMinutes * 60 * 1000);
  const txCollection = FoodTransaction.collection.name;
  const orderCollection = FoodOrder.collection.name;

  // 1. Paid / refunded order with no ledger row
  const noTx = await FoodOrder.aggregate([
    { $match: { 'payment.status': { $in: ['paid', 'refunded'] }, updatedAt: { $lt: settledBefore } } },
    { $sort: { updatedAt: -1 } },
    { $limit: limit },
    { $lookup: { from: txCollection, localField: '_id', foreignField: 'orderId', as: 'tx' } },
    { $match: { tx: { $size: 0 } } },
    { $project: { _id: 1, order_id: 1, 'payment.status': 1 } },
  ]);
  for (const o of noTx) {
    issues.push(issue('paid_order_without_transaction', 'critical', o._id, `Order #${o.order_id || o._id} is ${o.payment?.status} but has no finance record`, { orderRef: o.order_id }));
  }

  // 2. Ledger row with no order
  const noOrder = await FoodTransaction.aggregate([
    { $sort: { updatedAt: -1 } },
    { $limit: limit },
    { $lookup: { from: orderCollection, localField: 'orderId', foreignField: '_id', as: 'order' } },
    { $match: { order: { $size: 0 } } },
    { $project: { orderId: 1, status: 1 } },
  ]);
  for (const t of noOrder) issues.push(issue('transaction_without_order', 'warning', t.orderId, `Finance record (${t.status}) points at a missing order`));

  // 3. Order and ledger disagree / 4. paid and cancelled but never refunded
  const rows = await FoodTransaction.aggregate([
    { $match: { updatedAt: { $lt: settledBefore } } },
    { $sort: { updatedAt: -1 } },
    { $limit: limit },
    { $lookup: { from: orderCollection, localField: 'orderId', foreignField: '_id', as: 'order' } },
    { $unwind: '$order' },
    {
      $project: {
        orderId: 1, status: 1, paymentMethod: 1,
        orderRef: '$order.order_id', orderStatus: '$order.orderStatus', orderPayStatus: '$order.payment.status',
        orderPayMethod: '$order.payment.method', refundStatus: '$order.payment.refund.status',
      },
    },
  ]);
  const cancelledPaid = rows.filter((t) => CANCELLED.includes(t.orderStatus) && t.orderPayStatus === 'paid' && ONLINE.includes(String(t.orderPayMethod || '').toLowerCase()));
  const processedRefunds = new Set(
    (await Refund.find({ orderId: { $in: cancelledPaid.map((t) => t.orderId) }, status: 'processed' }).select('orderId').lean()).map((r) => String(r.orderId))
  );

  for (const t of rows) {
    const expected = LEDGER_STATUS_FOR[t.orderPayStatus];
    if (expected && t.status !== expected) {
      issues.push(issue('order_transaction_status_mismatch', 'critical', t.orderId, `Order #${t.orderRef || t.orderId} says '${t.orderPayStatus}', its finance record says '${t.status}'`, { repairable: 'resync', orderRef: t.orderRef }));
    }
    if (t.status === 'refunded' && t.orderPayStatus !== 'refunded') {
      issues.push(issue('transaction_refunded_order_not', 'warning', t.orderId, `Finance record is refunded but order #${t.orderRef || t.orderId} is '${t.orderPayStatus}'`, { orderRef: t.orderRef }));
    }
  }
  for (const t of cancelledPaid) {
    if (t.refundStatus !== 'processed' && !processedRefunds.has(String(t.orderId))) {
      issues.push(issue('captured_payment_on_cancelled_order', 'critical', t.orderId, `Customer paid for cancelled order #${t.orderRef || t.orderId} but was not refunded`, { repairable: 'refund_wallet', orderRef: t.orderRef }));
    }
  }

  // 5. Gateway refunds stuck in processing (report only)
  const stuck = await Refund.find({ refundTo: 'gateway', status: 'processing', updatedAt: { $lt: new Date(Date.now() - STUCK_REFUND_MINUTES * 60 * 1000) } })
    .select('orderId amount updatedAt').limit(limit).lean();
  for (const r of stuck) {
    issues.push(issue('refund_stuck', 'critical', r.orderId, `Gateway refund of ₹${round2(r.amount)} has been processing for over ${STUCK_REFUND_MINUTES} minutes: check it in the Razorpay dashboard`));
  }

  // 6. Razorpay captured the payment but the order is still unpaid here (optional; reads from Razorpay)
  if (checkGateway && isRazorpayConfigured()) {
    const pending = await FoodOrder.find({
      'payment.method': 'razorpay',
      'payment.status': { $in: ['created', 'pending', 'failed'] },
      'payment.razorpay.orderId': { $gt: '' },
      createdAt: { $lt: new Date(Date.now() - GATEWAY_PENDING_MINUTES * 60 * 1000), $gt: new Date(Date.now() - 48 * 60 * 60 * 1000) },
    }).select('order_id payment.razorpay.orderId pricing.total').limit(100).lean();
    for (const o of pending) {
      try {
        const captured = await capturedGatewayPayment(o.payment.razorpay.orderId);
        if (captured) {
          issues.push(issue('gateway_paid_database_pending', 'critical', o._id, `Razorpay captured ${captured.id} but order #${o.order_id || o._id} is unpaid here`, { repairable: 'capture', gatewayPaymentId: captured.id, orderRef: o.order_id }));
        }
      } catch (err) {
        issues.push(issue('gateway_check_failed', 'warning', o._id, err?.message || 'Gateway lookup failed', { orderRef: o.order_id }));
      }
    }
  }

  const counts = issues.reduce((acc, i) => ({ ...acc, [i.type]: (acc[i.type] || 0) + 1 }), {});
  return { checkedAt: new Date().toISOString(), total: issues.length, counts, issues };
}

// ---------------------------------------------------------------------------------------------------------------
// Repairing one order
// ---------------------------------------------------------------------------------------------------------------

/** Marks the order paid from Razorpay's captured payment: the same steps as a verified payment, exactly once. */
async function captureFromGateway(order) {
  if (order.payment?.method !== 'razorpay' || !order.payment?.razorpay?.orderId || !isRazorpayConfigured()) return { action: 'capture', applied: false, reason: 'not_a_pending_razorpay_order' };
  if (['paid', 'refunded'].includes(order.payment?.status)) return { action: 'capture', applied: false, reason: 'already_paid' };
  const captured = await capturedGatewayPayment(order.payment.razorpay.orderId);
  if (!captured) return { action: 'capture', applied: false, reason: 'gateway_not_captured' };
  if (Number(captured.amount) !== toPaise(order.pricing?.total) || String(captured.currency || 'INR').toUpperCase() !== 'INR') {
    return { action: 'capture', applied: false, reason: 'amount_mismatch', detail: `Razorpay captured ${captured.amount} paise, the order total is ${toPaise(order.pricing?.total)} paise: check manually` };
  }
  const claimed = await FoodOrder.findOneAndUpdate(
    { _id: order._id, 'payment.status': { $nin: ['paid', 'refunded'] } },
    {
      $set: { 'payment.status': 'paid', 'payment.razorpay.paymentId': captured.id },
      $push: { statusHistory: { at: new Date(), byRole: 'SYSTEM', from: order.orderStatus, to: order.orderStatus, note: `Payment recovered by reconciliation (Razorpay ${captured.id})` } },
    },
    { new: true }
  );
  if (!claimed) return { action: 'capture', applied: false, reason: 'already_paid' };
  await foodTransactionService.updateTransactionStatus(order._id, 'captured', {
    status: 'captured',
    razorpayPaymentId: captured.id,
    note: 'Payment recovered by reconciliation: Razorpay had captured it',
  });
  // The store hears about an online order only once it is paid
  try {
    const { notifyStoreNewOrder } = await import('../../modules/food/orders/services/order.helpers.js');
    if (typeof notifyStoreNewOrder === 'function') await notifyStoreNewOrder(claimed);
  } catch (err) {
    logger.warn(`Reconciliation: store notification for order ${order._id} failed: ${err.message}`);
  }
  return { action: 'capture', applied: true, gatewayPaymentId: captured.id };
}

/** Refunds a paid, cancelled, never-refunded order to the customer's wallet (idempotent per order). */
async function refundCancelledToWallet(order) {
  if (!CANCELLED.includes(order.orderStatus) || order.payment?.status !== 'paid' || !ONLINE.includes(String(order.payment?.method || '').toLowerCase())) {
    return { action: 'refund_wallet', applied: false, reason: 'not_a_paid_cancelled_order' };
  }
  if (order.payment?.refund?.status === 'processed' || (await Refund.exists({ orderId: order._id, status: 'processed' }))) {
    return { action: 'refund_wallet', applied: false, reason: 'already_refunded' };
  }
  const amount = Math.max(0, (Number(order.pricing?.total) || 0) - (Number(order.pricing?.cancellationFeeCharged) || 0));
  const result = await refundCancelledOrderToWallet(order, {
    description: `Refund for cancelled order #${order.order_id || order._id}`,
    reason: 'Reconciliation: paid order was cancelled without a refund',
    amount,
  });
  await FoodOrder.updateOne(
    { _id: order._id },
    { $set: { 'payment.status': 'refunded', 'payment.refund': { status: 'processed', destination: 'wallet', amount: result.amount, refundId: '', processedAt: new Date() } } }
  );
  await foodTransactionService.updateTransactionStatus(order._id, 'refunded', { status: 'refunded', note: 'Refunded to wallet by reconciliation' });
  return { action: 'refund_wallet', applied: !result.duplicate, amount: result.amount, reason: result.duplicate ? 'already_credited' : undefined };
}

/** Brings the order's ledger row in line with the order's payment status. */
async function resyncLedger(order) {
  const expected = LEDGER_STATUS_FOR[order.payment?.status];
  const tx = await FoodTransaction.findOne({ orderId: order._id }).select('status').lean();
  if (!tx) return { action: 'resync', applied: false, reason: 'no_transaction' };
  if (!expected || tx.status === expected) return { action: 'resync', applied: false, reason: 'in_step' };
  await foodTransactionService.updateTransactionStatus(order._id, 'reconciliation_resync', {
    status: expected,
    note: `Reconciliation: finance record set to '${expected}' to match the order ('${order.payment?.status}')`,
  });
  return { action: 'resync', applied: true, from: tx.status, to: expected };
}

/** Applies every safe repair that fits this order, and reports what it did. Running it twice is harmless. */
export async function repairOrder(orderId) {
  if (!mongoose.Types.ObjectId.isValid(String(orderId))) return { orderId: String(orderId), actions: [{ action: 'skipped', reason: 'invalid_order_id' }] };
  const actions = [];
  let order = await FoodOrder.findById(orderId).lean();
  if (!order) return { orderId: String(orderId), actions: [{ action: 'skipped', reason: 'order_not_found' }] };

  if (order.payment?.method === 'razorpay' && !['paid', 'refunded'].includes(order.payment?.status)) {
    actions.push(await captureFromGateway(order));
    order = await FoodOrder.findById(orderId).lean();
  }
  if (CANCELLED.includes(order.orderStatus) && order.payment?.status === 'paid') {
    actions.push(await refundCancelledToWallet(order));
    order = await FoodOrder.findById(orderId).lean();
  }
  actions.push(await resyncLedger(order));

  logger.info(`Reconciliation repair for order ${orderId}: ${actions.map((a) => `${a.action}=${a.applied ? 'applied' : a.reason}`).join(', ')}`);
  return { orderId: String(orderId), orderRef: order.order_id || '', actions };
}
