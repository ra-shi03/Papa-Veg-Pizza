import mongoose from 'mongoose';
import { FoodDeliveryPartner } from '../models/deliveryPartner.model.js';
import { FoodDeliveryCashDeposit } from '../models/foodDeliveryCashDeposit.model.js';
import { FoodOrder } from '../../orders/models/order.model.js';
import { FoodFranchise } from '../../franchise/models/franchise.model.js';

// What a delivery partner needs before taking orders:
//   1. payout details: bank account (holder, number, IFSC) and a UPI id. Needed to go online and to accept an order.
//   2. the delivery wallet: money the rider adds (recharges, and the older COD cash deposits) minus the COD cash the
//      rider has collected on delivered orders. It goes below zero as the rider collects cash; the rider recharges.
//      To accept an order the balance must be at least the minimum set by that order's franchise admin
//      (FoodFranchise.riderWalletMinBalance, ₹0 when not set).

const toId = (v) => new mongoose.Types.ObjectId(String(v));
const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

/** An error the app can act on: `code` tells it which screen to open, `data` carries the numbers. */
export const readinessError = (message, code, data = {}) =>
  Object.assign(new Error(message), { name: 'ValidationError', statusCode: 400, publicCode: code, publicData: data });

const PAYOUT_FIELDS = [
  ['bankAccountHolderName', 'account holder name'],
  ['bankAccountNumber', 'account number'],
  ['bankIfscCode', 'IFSC code'],
  ['upiId', 'UPI id'],
];

/** The payout details still missing on a rider record (empty when complete). */
export const missingPayoutDetails = (partner = {}) =>
  PAYOUT_FIELDS.filter(([key]) => !String(partner?.[key] || '').trim()).map(([, label]) => label);

export const PAYOUT_SELECT = PAYOUT_FIELDS.map(([k]) => k).join(' ');

export function assertPayoutDetails(partner) {
  const missing = missingPayoutDetails(partner);
  if (missing.length) {
    throw readinessError(
      `Add your bank and payment details first (missing: ${missing.join(', ')}). Then you can go online and deliver orders.`,
      'PAYOUT_DETAILS_REQUIRED',
      { missing },
    );
  }
}

/** Delivery wallet balances for many riders at once: Map(riderId -> { paidIn, codCollected, balance }). */
export async function walletBalances(riderIds = []) {
  const ids = [...new Set(riderIds.map(String))].filter((v) => mongoose.Types.ObjectId.isValid(v)).map(toId);
  const out = new Map(ids.map((id) => [String(id), { paidIn: 0, recharged: 0, codCollected: 0, balance: 0 }]));
  if (!ids.length) return out;
  const [paid, cod] = await Promise.all([
    FoodDeliveryCashDeposit.aggregate([
      { $match: { deliveryPartnerId: { $in: ids }, status: 'Completed' } },
      {
        $group: {
          _id: '$deliveryPartnerId',
          paidIn: { $sum: { $ifNull: ['$amount', 0] } },
          recharged: { $sum: { $cond: [{ $eq: ['$purpose', 'wallet_recharge'] }, { $ifNull: ['$amount', 0] }, 0] } },
        },
      },
    ]),
    FoodOrder.aggregate([
      { $match: { 'dispatch.deliveryPartnerId': { $in: ids }, orderStatus: 'delivered', 'payment.method': 'cash' } },
      { $group: { _id: '$dispatch.deliveryPartnerId', cod: { $sum: { $ifNull: ['$pricing.total', 0] } } } },
    ]),
  ]);
  for (const p of paid) Object.assign(out.get(String(p._id)), { paidIn: round2(p.paidIn), recharged: round2(p.recharged) });
  for (const c of cod) out.get(String(c._id)).codCollected = round2(c.cod);
  for (const v of out.values()) v.balance = round2(v.paidIn - v.codCollected);
  return out;
}

export async function franchiseMinBalance(franchiseId) {
  if (!franchiseId || !mongoose.Types.ObjectId.isValid(String(franchiseId))) return 0;
  const f = await FoodFranchise.findById(franchiseId).select('riderWalletMinBalance').lean();
  return Math.max(0, Number(f?.riderWalletMinBalance) || 0);
}

/** The rider's wallet with the rule for one franchise: what the app shows and what accept checks. */
export async function riderWalletStatus(riderId, franchiseId = null) {
  const w = (await walletBalances([riderId])).get(String(riderId)) || { paidIn: 0, recharged: 0, codCollected: 0, balance: 0 };
  const minBalance = await franchiseMinBalance(franchiseId);
  const shortBy = round2(Math.max(0, minBalance - w.balance));
  return { ...w, minBalance, shortBy, canAccept: w.balance >= minBalance };
}

/** Before a rider takes an order: payout details complete and wallet balance at least that franchise's minimum. */
export async function assertCanTakeOrder(riderId, franchiseId) {
  const partner = await FoodDeliveryPartner.findById(riderId).select(PAYOUT_SELECT).lean();
  assertPayoutDetails(partner);
  const wallet = await riderWalletStatus(riderId, franchiseId);
  if (!wallet.canAccept) {
    throw readinessError(
      `Recharge your wallet to accept orders. Balance ₹${wallet.balance.toFixed(2)}, minimum ₹${wallet.minBalance.toFixed(2)}: add at least ₹${wallet.shortBy.toFixed(2)}.`,
      'WALLET_RECHARGE_REQUIRED',
      wallet,
    );
  }
  return wallet;
}

/** Of these riders, the ones who may take an order of this franchise now (payout details + wallet). */
export async function readyRiderIds(riderIds = [], franchiseId = null) {
  if (!riderIds.length) return new Set();
  const [partners, balances, minBalance] = await Promise.all([
    FoodDeliveryPartner.find({ _id: { $in: riderIds.map(toId) } }).select(PAYOUT_SELECT).lean(),
    walletBalances(riderIds),
    franchiseMinBalance(franchiseId),
  ]);
  return new Set(
    partners
      .filter((p) => !missingPayoutDetails(p).length && (balances.get(String(p._id))?.balance ?? 0) >= minBalance)
      .map((p) => String(p._id)),
  );
}
