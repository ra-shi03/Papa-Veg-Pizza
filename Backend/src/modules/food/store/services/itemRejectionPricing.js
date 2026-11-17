import mongoose from 'mongoose';
import { FoodTransaction } from '../../orders/models/foodTransaction.model.js';
import { Refund } from '../../../../core/payments/models/refund.model.js';

const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

/**
 * The bill after some pizzas are rejected by the kitchen. The customer stops paying for them:
 *   - subtotal drops by the rejected lines (price x quantity);
 *   - a coupon's discount scales with the food that is left (never more than the food);
 *   - GST is charged again on what is left, at the rate the order was placed with;
 *   - packaging, delivery, platform and handling fees stay as they were.
 * Pure function: nothing is saved here.
 * @returns {{ pricing: object, rejectedAmount: number, reduction: number }|null} null when nothing is left to change
 */
export function repriceAfterRejection(pricing = {}, rejectedLines = []) {
  const oldSubtotal = r2(pricing.subtotal);
  const rejectedAmount = r2(rejectedLines.reduce((n, l) => n + (Number(l.price) || 0) * (Number(l.quantity) || 1), 0));
  if (!(rejectedAmount > 0) || !(oldSubtotal > 0)) return null;
  const subtotal = Math.max(0, r2(oldSubtotal - rejectedAmount));
  const discount = Math.min(subtotal, r2((Number(pricing.discount) || 0) * (subtotal / oldSubtotal)));
  const handling = Number(pricing.handlingFee) || 0;
  const gstRate = Number(pricing.gstRate) || 0;
  const tax = gstRate > 0 ? Math.round(Math.max(0, subtotal - discount + handling) * (gstRate / 100)) : 0;
  const total = Math.max(0, r2(subtotal + (Number(pricing.packagingFee) || 0) + (Number(pricing.deliveryFee) || 0) + (Number(pricing.platformFee) || 0) + handling + tax - discount));
  const oldTotal = r2(pricing.total);
  return { pricing: { subtotal, discount, tax, total }, rejectedAmount, reduction: Math.max(0, r2(oldTotal - total)) };
}

/**
 * Applies the rejection to the order (caller saves it) and keeps the money records in step:
 *   - cash / pay on delivery: payment.amountDue drops, so the rider collects the new total;
 *   - paid online: a pending refund request for the difference goes to the same queue as every other refund
 *     (money is processed there, not here).
 * The transaction ledger snapshot follows the new bill.
 * @returns {Promise<{ rejectedAmount:number, reduction:number, refund:object|null }|null>}
 */
export async function applyItemRejection(order, rejectedLines, { reason = '', byUserId = null } = {}) {
  const next = repriceAfterRejection(order.pricing?.toObject?.() || order.pricing, rejectedLines);
  if (!next) return null;
  const old = order.pricing?.toObject?.() || { ...order.pricing };
  if (!(order.pricing.originalTotal > 0)) order.pricing.originalTotal = r2(old.total);
  order.pricing.subtotal = next.pricing.subtotal;
  order.pricing.discount = next.pricing.discount;
  order.pricing.tax = next.pricing.tax;
  order.pricing.total = next.pricing.total;
  order.pricing.rejectedItemsAmount = r2((Number(old.rejectedItemsAmount) || 0) + next.rejectedAmount);
  order.markModified('pricing');

  const paid = order.payment?.status === 'paid';
  let refund = null;
  if (!paid) {
    if (order.payment) order.payment.amountDue = next.pricing.total;
  } else if (next.reduction > 0) {
    refund = await Refund.create({
      orderId: order._id, userId: order.userId, amount: next.reduction,
      reason: `Items not prepared: ${String(reason || '').slice(0, 400)}`.trim(),
      status: 'pending', refundTo: 'wallet', requestedBy: 'ADMIN',
      metadata: { source: 'item-rejection', storeId: String(order.storeId), requestedBy: byUserId ? String(byUserId) : '' },
    });
  }

  // ledger snapshot
  const tx = await FoodTransaction.findOne({ orderId: order._id });
  if (tx) {
    const ratio = old.subtotal > 0 ? next.pricing.subtotal / old.subtotal : 1;
    tx.pricing.subtotal = next.pricing.subtotal;
    tx.pricing.discount = next.pricing.discount;
    tx.pricing.tax = next.pricing.tax;
    tx.pricing.total = next.pricing.total;
    if (!paid) tx.payment.amountDue = next.pricing.total;
    const commission = r2((tx.amounts.storeCommission || 0) * ratio);
    tx.amounts.storeCommission = commission;
    tx.amounts.storeShare = Math.max(0, r2(next.pricing.subtotal + (Number(old.packagingFee) || 0) - commission));
    tx.amounts.taxAmount = next.pricing.tax;
    if (!paid) tx.amounts.totalCustomerPaid = next.pricing.total;
    tx.markModified('amounts');
    await tx.save();
  }
  return { rejectedAmount: next.rejectedAmount, reduction: next.reduction, refund };
}

export const isObjectId = (v) => mongoose.Types.ObjectId.isValid(String(v || ''));
