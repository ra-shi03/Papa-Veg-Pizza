import mongoose from 'mongoose';
import { FoodOrder } from '../../orders/models/order.model.js';
import { FoodTransaction } from '../../orders/models/foodTransaction.model.js';
import { FoodStore } from '../../store/models/store.model.js';
import { DeliveryBonusTransaction } from '../../admin/models/deliveryBonusTransaction.model.js';
import { FoodDeliveryWithdrawal } from '../../delivery/models/foodDeliveryWithdrawal.model.js';
import { FoodPayout } from '../models/payout.model.js';

// What each level is owed, worked out only from delivered orders (never from an amount someone typed):
//   rider, per store  = the rider's pay on orders delivered for that store + bonuses counted to that store
//   store             = for each of its delivered orders: the store's share (food + packaging - commission, after any
//                       item the kitchen could not make) + the rider's pay (the store pays its riders) + rider bonuses
//                       counted to it
//   franchise         = what all its stores are owed (no royalty is kept)
// minus every payout already paid or still waiting. An order counts once it was delivered more than HOLD_HOURS ago
// (time for a cancellation or full refund to land); until then it shows as "on hold". A fully refunded order counts
// for nothing.

export const HOLD_HOURS = 24;
const HOLD_MS = HOLD_HOURS * 60 * 60 * 1000;
const OPEN_OR_PAID = ['pending', 'paid'];
const oid = (v) => new mongoose.Types.ObjectId(String(v));
const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

const deliveredAtOf = (o) => o?.deliveryState?.deliveredAt || o?.updatedAt || o?.createdAt || null;
const cleared = (o, now) => {
  const at = deliveredAtOf(o);
  return at ? now.getTime() - new Date(at).getTime() >= HOLD_MS : false;
};

/** Per-order share for the store: { storeShare, riderShare }, from the order's transaction record when there is one. */
function sharesOf(order, tx) {
  if (tx?.status === 'refunded') return { storeShare: 0, riderShare: 0 };
  const riderShare = Number(tx?.amounts?.riderShare ?? order.riderEarning) || 0;
  const computed = (Number(order.pricing?.subtotal) || 0) + (Number(order.pricing?.packagingFee) || 0) - (Number(order.pricing?.storeCommission) || 0);
  const storeShare = Math.max(0, Number(tx?.amounts?.storeShare ?? computed) || 0);
  return { storeShare, riderShare: Math.max(0, riderShare) };
}

async function transactionsFor(orderIds) {
  if (!orderIds.length) return new Map();
  const rows = await FoodTransaction.find({ orderId: { $in: orderIds } }).select('orderId status amounts.storeShare amounts.riderShare').lean();
  return new Map(rows.map((t) => [String(t.orderId), t]));
}

const DELIVERED_FIELDS = 'storeId riderEarning pricing.subtotal pricing.packagingFee pricing.storeCommission deliveryState.deliveredAt updatedAt createdAt dispatch.deliveryPartnerId';

/**
 * Each bonus a super admin gave a rider counts to one store: the store of the rider's last delivery before the bonus
 * (or their latest delivery when there was none before). A rider with no delivery at all has nowhere to be paid from yet.
 * Returns [{ riderId, storeId, amount }].
 */
async function attributedBonuses(filter = {}) {
  const bonuses = await DeliveryBonusTransaction.find(filter).select('deliveryPartnerId amount createdAt').lean();
  const out = [];
  for (const b of bonuses) {
    const rider = b.deliveryPartnerId;
    const before = await FoodOrder.findOne({ 'dispatch.deliveryPartnerId': rider, orderStatus: 'delivered', 'deliveryState.deliveredAt': { $lte: b.createdAt } })
      .sort({ 'deliveryState.deliveredAt': -1 }).select('storeId').lean();
    const last = before || await FoodOrder.findOne({ 'dispatch.deliveryPartnerId': rider, orderStatus: 'delivered' }).sort({ updatedAt: -1 }).select('storeId').lean();
    if (last?.storeId) out.push({ riderId: String(rider), storeId: String(last.storeId), amount: Number(b.amount) || 0 });
  }
  return out;
}

/** Sum of paid + waiting payouts matching `match`, grouped by `key` (a field path) or as one total. */
async function heldBy(match, key) {
  const rows = await FoodPayout.aggregate([
    { $match: { ...match, status: { $in: OPEN_OR_PAID } } },
    { $group: { _id: key ? `$${key}` : null, paid: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0] } }, pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0] } } } },
  ]);
  return new Map(rows.map((r) => [String(r._id), { paid: r.paid, pending: r.pending }]));
}

const summary = ({ earned = 0, onHold = 0, paid = 0, pending = 0 }) => ({
  earned: r2(earned),                                    // cleared earnings (past the hold)
  onHold: r2(onHold),                                    // delivered in the last HOLD_HOURS
  paid: r2(paid),
  pending: r2(pending),
  available: r2(Math.max(0, earned - paid - pending)),   // what can be asked for now
  owedAfterPayouts: r2(earned - paid - pending),         // can go below 0 after a late refund (taken off the next payout)
});

/**
 * A rider's balance at each store they delivered for: [{ storeId, storeName, franchiseId, earned, onHold, paid, pending, available }].
 * Older withdrawal requests (before per-store payouts) are taken off too, from the stores that owe the most first.
 */
export async function riderBalances(riderId, now = new Date()) {
  const rider = oid(riderId);
  const orders = await FoodOrder.find({ 'dispatch.deliveryPartnerId': rider, orderStatus: 'delivered', riderEarning: { $gt: 0 } }).select(DELIVERED_FIELDS).lean();
  const txs = await transactionsFor(orders.map((o) => o._id));
  const byStore = new Map();
  const row = (storeId) => {
    const k = String(storeId);
    if (!byStore.has(k)) byStore.set(k, { storeId: k, earned: 0, onHold: 0 });
    return byStore.get(k);
  };
  for (const o of orders) {
    if (!o.storeId) continue;
    const { riderShare } = sharesOf(o, txs.get(String(o._id)));
    if (cleared(o, now)) row(o.storeId).earned += riderShare;
    else row(o.storeId).onHold += riderShare;
  }
  for (const b of await attributedBonuses({ deliveryPartnerId: rider })) row(b.storeId).earned += b.amount;

  // legacy requests (food_delivery_withdrawals) still count: approved = paid, pending = waiting
  const legacy = await FoodDeliveryWithdrawal.aggregate([
    { $match: { deliveryPartnerId: rider, status: { $in: ['approved', 'pending'] } } },
    { $group: { _id: '$status', total: { $sum: '$amount' } } },
  ]);
  let legacyLeft = legacy.reduce((n, l) => n + (Number(l.total) || 0), 0);

  const held = await heldBy({ kind: 'rider_withdrawal', payeeId: rider }, 'storeId');
  const stores = await FoodStore.find({ _id: { $in: [...byStore.keys()].map(oid) } }).select('storeName franchiseId').lean();
  const storeById = new Map(stores.map((s) => [String(s._id), s]));
  const list = [...byStore.values()]
    .map((b) => {
      const h = held.get(b.storeId) || { paid: 0, pending: 0 };
      return { ...b, paid: h.paid, pending: h.pending };
    })
    .sort((a, b) => (b.earned - b.paid - b.pending) - (a.earned - a.paid - a.pending));
  for (const b of list) {
    const take = Math.min(legacyLeft, Math.max(0, b.earned - b.paid - b.pending));
    b.paid += take;
    legacyLeft -= take;
  }
  return list.map((b) => ({
    storeId: b.storeId,
    storeName: storeById.get(b.storeId)?.storeName || 'Store',
    franchiseId: storeById.get(b.storeId)?.franchiseId ? String(storeById.get(b.storeId).franchiseId) : null,
    ...summary(b),
  }));
}

/** What a set of stores is owed from their delivered orders and rider bonuses (before any payout): Map storeId -> { earned, onHold }. */
async function storeEarnings(storeIds, now) {
  const ids = storeIds.map(oid);
  const out = new Map(storeIds.map((id) => [String(id), { earned: 0, onHold: 0 }]));
  if (!ids.length) return out;
  const orders = await FoodOrder.find({ storeId: { $in: ids }, orderStatus: 'delivered' }).select(DELIVERED_FIELDS).lean();
  const txs = await transactionsFor(orders.map((o) => o._id));
  for (const o of orders) {
    const { storeShare, riderShare } = sharesOf(o, txs.get(String(o._id)));
    const row = out.get(String(o.storeId));
    if (!row) continue;
    if (cleared(o, now)) row.earned += storeShare + riderShare;
    else row.onHold += storeShare + riderShare;
  }
  // bonuses the store pays its riders on the super admin's behalf
  const riders = await FoodOrder.distinct('dispatch.deliveryPartnerId', { storeId: { $in: ids }, orderStatus: 'delivered' });
  if (riders.length) {
    for (const b of await attributedBonuses({ deliveryPartnerId: { $in: riders.filter(Boolean) } })) {
      const row = out.get(b.storeId);
      if (row) row.earned += b.amount;
    }
  }
  return out;
}

/** A store's balance with its franchise: { earned, onHold, paid, pending, available, owedAfterPayouts }. */
export async function storeBalance(storeId, now = new Date()) {
  const earnings = (await storeEarnings([storeId], now)).get(String(storeId)) || { earned: 0, onHold: 0 };
  const held = (await heldBy({ kind: 'store_payout', payeeId: oid(storeId) })).get('null') || { paid: 0, pending: 0 };
  return summary({ ...earnings, ...held });
}

/** Balances of several stores at once (the franchise's list): Map storeId -> summary. */
export async function storeBalances(storeIds, now = new Date()) {
  const earnings = await storeEarnings(storeIds, now);
  const held = await heldBy({ kind: 'store_payout', payeeId: { $in: storeIds.map(oid) } }, 'payeeId');
  return new Map(storeIds.map((id) => {
    const k = String(id);
    return [k, summary({ ...(earnings.get(k) || {}), ...(held.get(k) || { paid: 0, pending: 0 }) })];
  }));
}

/** A franchise's balance with the platform: what all its stores are owed, minus the platform's payouts to it. */
export async function franchiseBalance(franchiseId, now = new Date()) {
  const stores = await FoodStore.find({ franchiseId: oid(franchiseId) }).select('_id').lean();
  const earnings = await storeEarnings(stores.map((s) => String(s._id)), now);
  let earned = 0; let onHold = 0;
  for (const e of earnings.values()) { earned += e.earned; onHold += e.onHold; }
  const held = (await heldBy({ kind: 'franchise_payout', payeeId: oid(franchiseId) })).get('null') || { paid: 0, pending: 0 };
  return summary({ earned, onHold, ...held });
}
