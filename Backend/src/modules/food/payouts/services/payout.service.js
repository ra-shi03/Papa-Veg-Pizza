import mongoose from 'mongoose';
import { FoodPayout } from '../models/payout.model.js';
import { FoodStore } from '../../store/models/store.model.js';
import { FoodFranchise } from '../../franchise/models/franchise.model.js';
import { StoreManager } from '../../franchise/models/storeManager.model.js';
import { FoodDeliveryPartner } from '../../delivery/models/deliveryPartner.model.js';
import { getDeliveryCashLimitSettings } from '../../admin/services/admin.service.js';
import { ForbiddenError, NotFoundError, ValidationError } from '../../../../core/auth/errors.js';
import { riderBalances, storeBalance, storeBalances, franchiseBalance, HOLD_HOURS } from './payoutBalance.service.js';
import { notifyPayout } from './payoutNotify.service.js';

// Requests, payments, rejections and "not received" disputes for every level (see models/payout.model.js).
// Every list and action is scoped from the signed-in token: a store manager only sees and pays its own store's riders and
// staff, a franchise admin only its own stores, the super admin pays franchises. A record outside the caller's scope is 404.

export const BANK_CHANGE_HOLD_HOURS = 24;
export const DISPUTE_DAYS = 7;
export const SALARY_DUE_DAY = 7;        // a month's salary is due by the 7th of the next month; after that staff can ask for it

const isId = (v) => mongoose.Types.ObjectId.isValid(String(v || '')) && /^[a-f0-9]{24}$/i.test(String(v));
const oid = (v) => new mongoose.Types.ObjectId(String(v));
const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const roleOf = (u) => String(u?.role || '').trim().replace(/-/g, '_').toUpperCase();
const isSuper = (u) => ['SUPERADMIN', 'SUPER_ADMIN'].includes(roleOf(u));
const actorOf = (user, name = '') => ({ role: roleOf(user), userId: isId(user?.userId) ? oid(user.userId) : null, name: name || user?.name || '', at: new Date() });
const conflict = (message) => Object.assign(new ValidationError(message), { statusCode: 409 });
const ymNow = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

// ----- what a viewer may see of a payout ----------------------------------------------------------------------------

const maskAccount = (v) => (v ? `${'•'.repeat(Math.max(0, String(v).length - 4))}${String(v).slice(-4)}` : '');

/**
 * The payout as the caller sees it. The payer (who sends the money) and the levels above see the full bank details; the
 * payee sees their own details masked.
 */
export function shapePayout(p, { fullBank = false } = {}) {
  const bank = p.bank || {};
  const paidAt = p.payment?.paidAt || null;
  const disputeOpenUntil = paidAt ? new Date(new Date(paidAt).getTime() + DISPUTE_DAYS * 86400000) : null;
  return {
    id: String(p._id),
    kind: p.kind,
    status: p.status,
    amount: p.amount,
    payee: { type: p.payeeType, id: String(p.payeeId), name: p.payeeName || '' },
    payer: { type: p.payerType, id: p.payerId ? String(p.payerId) : null },
    storeId: p.storeId ? String(p.storeId) : null,
    franchiseId: p.franchiseId ? String(p.franchiseId) : null,
    period: p.period || '',
    origin: p.origin,
    note: p.note || '',
    bank: fullBank ? { ...bank } : { ...bank, accountNumber: maskAccount(bank.accountNumber) },
    requestedBy: p.requestedBy || {},
    payment: { method: p.payment?.method || '', reference: p.payment?.reference || '', proofUrl: p.payment?.proofUrl || '', paidAt, paidBy: p.payment?.paidBy || {} },
    rejection: p.rejection?.reason ? { reason: p.rejection.reason, at: p.rejection.at, by: p.rejection.by } : null,
    dispute: p.dispute?.status && p.dispute.status !== 'none' ? p.dispute : null,
    canReportNotReceived: p.status === 'paid' && (!p.dispute || p.dispute.status === 'none') && disputeOpenUntil && disputeOpenUntil > new Date(),
    activity: p.activity || [],
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

// ----- bank details -------------------------------------------------------------------------------------------------

const ACCOUNT_RE = /^\d{9,18}$/;
const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const UPI_RE = /^[\w.-]{2,256}@[a-zA-Z]{2,64}$/;

/** Checks and normalises a payout account form; it must hold a bank account (number + IFSC) or a UPI ID. */
export function normalizeAccount(body = {}) {
  const a = {
    accountHolderName: String(body.accountHolderName || '').trim().slice(0, 100),
    accountNumber: String(body.accountNumber || '').replace(/\s/g, ''),
    ifscCode: String(body.ifscCode || '').trim().toUpperCase(),
    bankName: String(body.bankName || '').trim().slice(0, 100),
    upiId: String(body.upiId || '').trim(),
  };
  if (a.accountNumber && !ACCOUNT_RE.test(a.accountNumber)) throw new ValidationError('Account number must be 9 to 18 digits.');
  if (a.ifscCode && !IFSC_RE.test(a.ifscCode)) throw new ValidationError('IFSC code looks wrong (for example HDFC0001234).');
  if (a.upiId && !UPI_RE.test(a.upiId)) throw new ValidationError('UPI ID looks wrong (for example name@okhdfc).');
  if (Boolean(a.accountNumber) !== Boolean(a.ifscCode)) throw new ValidationError('Give both the account number and the IFSC code.');
  if (!a.accountNumber && !a.upiId) throw new ValidationError('Add a bank account or a UPI ID.');
  if (a.accountNumber && !a.accountHolderName) throw new ValidationError('Give the account holder name.');
  return a;
}

const hasAccount = (a) => Boolean((a?.accountNumber && a?.ifscCode) || a?.upiId);
const snapshot = (a = {}) => ({
  accountHolderName: a.accountHolderName || '', accountNumber: a.accountNumber || '', ifscCode: a.ifscCode || '', bankName: a.bankName || '', upiId: a.upiId || '',
});
const accountView = (a) => (a ? {
  accountHolderName: a.accountHolderName || '', accountNumber: maskAccount(a.accountNumber), ifscCode: a.ifscCode || '', bankName: a.bankName || '',
  upiId: a.upiId || '', changedAt: a.changedAt || null, holdUntil: holdUntil(a.changedAt),
} : null);
const holdUntil = (changedAt) => (changedAt ? new Date(new Date(changedAt).getTime() + BANK_CHANGE_HOLD_HOURS * 3600000) : null);
function assertNoBankHold(changedAt) {
  const until = holdUntil(changedAt);
  if (until && until > new Date()) {
    throw conflict(`Payout details were changed recently. For your safety, payouts can be requested after ${until.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}.`);
  }
}

/** Saves a payout account on a store / franchise / staff record; stamps changedAt when an existing account changes. */
async function saveAccount(collectionModel, id, body) {
  const next = normalizeAccount(body);
  const doc = await collectionModel.findById(id).select('+payoutAccount').lean();
  if (!doc) throw new NotFoundError('Not found');
  const prev = doc.payoutAccount || {};
  const changed = hasAccount(prev) && ['accountNumber', 'ifscCode', 'upiId'].some((k) => String(prev[k] || '') !== String(next[k] || ''));
  const account = { ...next, changedAt: changed ? new Date() : prev.changedAt || null, updatedAt: new Date() };
  await collectionModel.updateOne({ _id: id }, { $set: { payoutAccount: account } });
  return accountView(account);
}

// ----- scope ----------------------------------------------------------------------------------------------------------

async function managerStore(user) {
  if (roleOf(user) !== 'STORE_MANAGER') throw new ForbiddenError('Only the store manager can do this.');
  let storeId = user.storeId;
  if (!isId(storeId) && isId(user.userId)) storeId = (await StoreManager.findOne({ userId: user.userId }).select('storeId').lean())?.storeId;
  if (!isId(storeId)) throw new ForbiddenError('No store is linked to your account.');
  const store = await FoodStore.findById(storeId).select('storeName franchiseId +payoutAccount').lean();
  if (!store) throw new NotFoundError('Store not found');
  return store;
}

async function franchiseOf(user) {
  if (roleOf(user) !== 'FRANCHISE_ADMIN') throw new ForbiddenError('Only the franchise admin can do this.');
  if (!isId(user.franchiseId)) throw new ForbiddenError('No franchise is linked to your account.');
  const franchise = await FoodFranchise.findById(user.franchiseId).select('name companyName +payoutAccount').lean();
  if (!franchise) throw new NotFoundError('Franchise not found');
  return franchise;
}

const STAFF_MANAGER_ROLES = ['STORE_MANAGER', 'store-manager', 'Store Manager'];
async function myStaffRecord(user) {
  if (roleOf(user) !== 'KITCHEN_STAFF') throw new ForbiddenError('Only kitchen staff can do this.');
  const staff = await StoreManager.findOne({ userId: user.userId, status: { $ne: 'DELETED' } }).select('+payoutAccount').lean();
  if (!staff || !isId(staff.storeId)) throw new ForbiddenError('No store is linked to your account.');
  return staff;
}

const franchiseName = (f) => f?.name || f?.companyName || 'Franchise';

// ----- creating requests ---------------------------------------------------------------------------------------------

async function createPending(doc) {
  try {
    return await FoodPayout.create(doc);
  } catch (err) {
    if (err?.code === 11000) throw conflict('A payout request is already waiting. Wait for it to be paid or rejected first.');
    throw err;
  }
}

/**
 * The rider's "Withdraw" button: one request to each store that owes the rider something, together at least the minimum
 * withdrawal. A store that already has a waiting request from this rider is skipped.
 */
export async function requestRiderWithdrawals(riderId, { storeId } = {}) {
  const rider = await FoodDeliveryPartner.findById(riderId).select('name status bankAccountHolderName bankAccountNumber bankIfscCode bankName upiId payoutDetailsChangedAt').lean();
  if (!rider) throw new NotFoundError('Delivery partner not found');
  if (rider.status !== 'approved') throw new ForbiddenError('Your account is not active.');
  const bank = { accountHolderName: rider.bankAccountHolderName, accountNumber: rider.bankAccountNumber, ifscCode: rider.bankIfscCode, bankName: rider.bankName, upiId: rider.upiId };
  if (!hasAccount(bank)) throw new ValidationError('Add your bank account or UPI ID in Profile > Bank & Payments first.');
  assertNoBankHold(rider.payoutDetailsChangedAt);

  const balances = (await riderBalances(riderId)).filter((b) => b.available > 0 && (!storeId || b.storeId === String(storeId)));
  const waiting = new Set((await FoodPayout.find({ kind: 'rider_withdrawal', payeeId: oid(riderId), status: 'pending' }).select('storeId').lean()).map((p) => String(p.storeId)));
  const toAsk = balances.filter((b) => !waiting.has(b.storeId));
  const total = toAsk.reduce((n, b) => n + b.available, 0);
  const { deliveryWithdrawalLimit } = await getDeliveryCashLimitSettings();
  const minimum = Number(deliveryWithdrawalLimit) || 100;
  if (total <= 0) {
    if (waiting.size) throw conflict('Your withdrawal request is already waiting with the store.');
    throw new ValidationError('You have nothing to withdraw yet.');
  }
  if (total < minimum) throw new ValidationError(`Minimum withdrawal amount is ₹${minimum}.`);

  const created = [];
  for (const b of toAsk) {
    try {
      created.push(await createPending({
        kind: 'rider_withdrawal', payeeType: 'rider', payeeId: oid(riderId), payeeName: rider.name || '',
        payerType: 'store', payerId: oid(b.storeId), storeId: oid(b.storeId), franchiseId: b.franchiseId ? oid(b.franchiseId) : null,
        amount: r2(b.available), bank: snapshot(bank),
        requestedBy: { role: 'DELIVERY_PARTNER', userId: oid(riderId), name: rider.name || '', at: new Date() },
        activity: [{ action: 'requested', byRole: 'DELIVERY_PARTNER', byName: rider.name || '', note: `₹${r2(b.available)} from ${b.storeName}` }],
        activeKey: `rider:${riderId}:store:${b.storeId}`,
      }));
    } catch (err) {
      if (err?.statusCode !== 409) throw err;   // a request sent at the same moment won; skip that store
    }
  }
  if (!created.length) throw conflict('Your withdrawal request is already waiting with the store.');
  for (const p of created) await notifyPayout(p, 'requested');
  return created.map((p) => shapePayout(p.toObject()));
}

/** The store manager asks the franchise for what the store is owed (all of it, or `amount`). */
export async function requestStorePayout(user, { amount, note } = {}) {
  const store = await managerStore(user);
  if (!isId(store.franchiseId)) throw new ValidationError('This store is not linked to a franchise.');
  if (!hasAccount(store.payoutAccount)) throw new ValidationError('Add the store\'s bank account or UPI ID first.');
  assertNoBankHold(store.payoutAccount?.changedAt);
  if (await FoodPayout.exists({ kind: 'store_payout', payeeId: store._id, status: 'pending' })) throw conflict('A payout request is already waiting with the franchise.');
  const balance = await storeBalance(store._id);
  const ask = amount === undefined || amount === null || amount === '' ? balance.available : r2(amount);
  if (!(ask >= 1)) throw new ValidationError(balance.available >= 1 ? 'Enter an amount of at least ₹1.' : 'The store has nothing to request yet.');
  if (ask > balance.available) throw new ValidationError(`You can request at most ₹${balance.available}.`);
  const p = await createPending({
    kind: 'store_payout', payeeType: 'store', payeeId: store._id, payeeName: store.storeName || '',
    payerType: 'franchise', payerId: oid(store.franchiseId), storeId: store._id, franchiseId: oid(store.franchiseId),
    amount: ask, bank: snapshot(store.payoutAccount), note: String(note || '').slice(0, 500),
    requestedBy: actorOf(user),
    activity: [{ action: 'requested', byRole: 'STORE_MANAGER', byName: user.name || '', note: String(note || '') }],
    activeKey: `store:${store._id}:franchise:${store.franchiseId}`,
  });
  await notifyPayout(p, 'requested');
  return shapePayout(p.toObject());
}

/** The franchise admin asks the platform (super admin) for what the franchise's stores are owed. */
export async function requestFranchisePayout(user, { amount, note } = {}) {
  const franchise = await franchiseOf(user);
  if (!hasAccount(franchise.payoutAccount)) throw new ValidationError('Add the franchise\'s bank account or UPI ID first.');
  assertNoBankHold(franchise.payoutAccount?.changedAt);
  if (await FoodPayout.exists({ kind: 'franchise_payout', payeeId: franchise._id, status: 'pending' })) throw conflict('A payout request is already waiting with the super admin.');
  const balance = await franchiseBalance(franchise._id);
  const ask = amount === undefined || amount === null || amount === '' ? balance.available : r2(amount);
  if (!(ask >= 1)) throw new ValidationError(balance.available >= 1 ? 'Enter an amount of at least ₹1.' : 'The franchise has nothing to request yet.');
  if (ask > balance.available) throw new ValidationError(`You can request at most ₹${balance.available}.`);
  const p = await createPending({
    kind: 'franchise_payout', payeeType: 'franchise', payeeId: franchise._id, payeeName: franchiseName(franchise),
    payerType: 'platform', payerId: null, franchiseId: franchise._id,
    amount: ask, bank: snapshot(franchise.payoutAccount), note: String(note || '').slice(0, 500),
    requestedBy: actorOf(user),
    activity: [{ action: 'requested', byRole: 'FRANCHISE_ADMIN', byName: user.name || '', note: String(note || '') }],
    activeKey: `franchise:${franchise._id}:platform`,
  });
  await notifyPayout(p, 'requested');
  return shapePayout(p.toObject());
}

// ----- staff salaries ------------------------------------------------------------------------------------------------

const PERIOD_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const monthStart = (period) => new Date(`${period}-01T00:00:00`);
const dueDate = (period) => { const d = monthStart(period); d.setMonth(d.getMonth() + 1); d.setDate(SALARY_DUE_DAY); return d; };
const salaryKey = (staffId, period) => `salary:${staffId}:${period}`;
const isStaffRole = (role) => !STAFF_MANAGER_ROLES.includes(String(role || ''));

/** The months a staff member can be paid for (from the joining month up to this month), newest first, at most 12. */
function salaryMonths(staff, now = new Date()) {
  const joined = staff.joinedDate ? new Date(staff.joinedDate) : new Date(staff.createdAt || now);
  const out = [];
  const d = new Date(now.getFullYear(), now.getMonth(), 1);
  const first = new Date(joined.getFullYear(), joined.getMonth(), 1);
  while (d >= first && out.length < 12) {
    out.push(ymNow(d));
    d.setMonth(d.getMonth() - 1);
  }
  return out;
}

/** Store manager: every kitchen staff member with their salary and each month's state (paid / waiting / due / overdue). */
export async function storeStaffSalaries(user) {
  const store = await managerStore(user);
  const staff = (await StoreManager.find({ storeId: String(store._id), status: { $nin: ['DELETED', 'Rejected', 'Pending Approval'] } })
    .select('name role employeeCode personalDetails.salary personalDetails.salaryType joinedDate createdAt userId status').lean())
    .filter((s) => isStaffRole(s.role));
  const payouts = await FoodPayout.find({ kind: 'staff_salary', storeId: store._id }).sort({ createdAt: -1 }).lean();
  const now = new Date();
  return staff.map((s) => {
    const mine = payouts.filter((p) => String(p.payeeId) === String(s._id));
    const months = salaryMonths(s, now).map((period) => {
      const live = mine.find((p) => p.period === period && ['pending', 'paid'].includes(p.status));
      const overdue = !live && now >= dueDate(period);
      return { period, state: live ? live.status : overdue ? 'overdue' : now >= monthStart(period) ? 'due' : 'upcoming', payoutId: live ? String(live._id) : null, dueBy: dueDate(period) };
    });
    return {
      staffId: String(s._id), name: s.name, role: s.role, employeeCode: s.employeeCode, status: s.status,
      salary: Number(s.personalDetails?.salary) || 0, salaryType: s.personalDetails?.salaryType || 'Monthly',
      months, payouts: mine.map((p) => shapePayout(p, { fullBank: true })),
    };
  });
}

/** Store manager records a salary as paid (the month must not be in the future and not already paid). */
export async function recordStaffSalary(user, { staffId, period, amount, method, reference, proofUrl, note } = {}) {
  const store = await managerStore(user);
  if (!isId(staffId)) throw new NotFoundError('Staff member not found');
  const staff = await StoreManager.findOne({ _id: staffId, storeId: String(store._id), status: { $ne: 'DELETED' } }).select('name role userId +payoutAccount').lean();
  if (!staff || !isStaffRole(staff.role)) throw new NotFoundError('Staff member not found');
  if (!PERIOD_RE.test(String(period || ''))) throw new ValidationError('Choose the month the salary is for.');
  if (String(period) > ymNow()) throw new ValidationError('You cannot pay a salary for a month that has not started.');
  const pay = paymentOf({ method, reference, proofUrl });
  const value = r2(amount);
  if (!(value >= 1) || value > 1000000) throw new ValidationError('Enter the salary amount paid (₹1 to ₹10,00,000).');
  const now = new Date();
  let p;
  try {
    p = await FoodPayout.create({
      kind: 'staff_salary', payeeType: 'staff', payeeId: staff._id, payeeName: staff.name || '', staffUserId: staff.userId || null,
      payerType: 'store', payerId: store._id, storeId: store._id, franchiseId: store.franchiseId || null, period: String(period),
      amount: value, status: 'paid', origin: 'recorded', note: String(note || '').slice(0, 500), bank: snapshot(staff.payoutAccount),
      requestedBy: actorOf(user),
      payment: { ...pay, paidAt: now, paidBy: actorOf(user) },
      activity: [{ action: 'paid', byRole: 'STORE_MANAGER', byName: user.name || '', note: `Salary for ${period} · ${pay.reference}` }],
      activeKey: salaryKey(staff._id, period),
    });
  } catch (err) {
    if (err?.code === 11000) {
      if (String(err.message).includes('activeKey')) throw conflict(`The salary for ${period} is already paid or waiting. Pay the waiting request instead.`);
      throw conflict('This payment reference is already used for another payout.');
    }
    throw err;
  }
  await notifyPayout(p, 'paid');
  return shapePayout(p.toObject(), { fullBank: true });
}

/** Kitchen staff: their salary months and payouts. */
export async function mySalary(user) {
  const staff = await myStaffRecord(user);
  const payouts = await FoodPayout.find({ kind: 'staff_salary', payeeId: staff._id }).sort({ createdAt: -1 }).lean();
  const now = new Date();
  const months = salaryMonths(staff, now).map((period) => {
    const live = payouts.find((p) => p.period === period && ['pending', 'paid'].includes(p.status));
    const overdue = !live && now >= dueDate(period);
    return { period, state: live ? live.status : overdue ? 'overdue' : 'not_due', canRequest: overdue, dueBy: dueDate(period) };
  });
  return {
    salary: Number(staff.personalDetails?.salary) || 0, salaryType: staff.personalDetails?.salaryType || 'Monthly',
    account: accountView(staff.payoutAccount), months, payouts: payouts.map((p) => shapePayout(p)),
    rules: { dueDay: SALARY_DUE_DAY, bankChangeHoldHours: BANK_CHANGE_HOLD_HOURS, disputeDays: DISPUTE_DAYS },
  };
}

/** Kitchen staff ask for a month's salary once it is overdue (not paid by the due day of the next month). */
export async function requestMySalary(user, { period, note } = {}) {
  const staff = await myStaffRecord(user);
  if (!PERIOD_RE.test(String(period || ''))) throw new ValidationError('Choose the month.');
  if (!salaryMonths(staff).includes(String(period))) throw new ValidationError('You can only ask for a month you worked in (the last 12 months).');
  if (new Date() < dueDate(period)) throw new ValidationError(`The salary for ${period} is due by ${dueDate(period).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}. You can ask after that date if it is not paid.`);
  assertNoBankHold(staff.payoutAccount?.changedAt);
  const store = await FoodStore.findById(staff.storeId).select('franchiseId').lean();
  const monthly = (staff.personalDetails?.salaryType || 'Monthly') === 'Monthly' ? Number(staff.personalDetails?.salary) || 0 : 0;
  let p;
  try {
    p = await FoodPayout.create({
      kind: 'staff_salary', payeeType: 'staff', payeeId: staff._id, payeeName: staff.name || '', staffUserId: staff.userId || null,
      payerType: 'store', payerId: oid(staff.storeId), storeId: oid(staff.storeId), franchiseId: store?.franchiseId || null, period: String(period),
      amount: monthly, status: 'pending', origin: 'request', note: String(note || '').slice(0, 500), bank: snapshot(staff.payoutAccount),
      requestedBy: actorOf(user, staff.name),
      activity: [{ action: 'requested', byRole: 'KITCHEN_STAFF', byName: staff.name || '', note: `Salary for ${period}${note ? ` · ${note}` : ''}` }],
      activeKey: salaryKey(staff._id, period),
    });
  } catch (err) {
    if (err?.code === 11000) throw conflict(`The salary for ${period} is already paid or requested.`);
    throw err;
  }
  await notifyPayout(p, 'requested');
  return shapePayout(p.toObject());
}

// ----- paying and rejecting ------------------------------------------------------------------------------------------

const REF_RE = /^[A-Za-z0-9][A-Za-z0-9 \-/]{3,39}$/;
function paymentOf({ method, reference, proofUrl } = {}) {
  const m = String(method || '').trim();
  if (!['bank_transfer', 'upi', 'cash'].includes(m)) throw new ValidationError('Choose how it was paid: bank transfer, UPI or cash.');
  const ref = String(reference || '').trim();
  if (!REF_RE.test(ref)) throw new ValidationError(m === 'cash' ? 'Enter the cash receipt number (4 to 40 letters or digits).' : 'Enter the UTR / transaction reference (4 to 40 letters or digits).');
  const proof = String(proofUrl || '').trim();
  if (proof && (!/^https:\/\/[^\s]+$/i.test(proof) || proof.length > 500)) throw new ValidationError('The payment screenshot link is not valid.');
  return { method: m, reference: ref, referenceKey: `${m}:${ref.replace(/[\s\-/]/g, '').toUpperCase()}`, proofUrl: proof };
}

/** The filter a payer may act on: a pending payout of the right kind addressed to the caller. */
async function payerScope(user, kinds) {
  if (isSuper(user)) return { kind: { $in: kinds.filter((k) => k === 'franchise_payout') }, payerType: 'platform' };
  if (roleOf(user) === 'FRANCHISE_ADMIN') {
    const f = await franchiseOf(user);
    return { kind: { $in: kinds.filter((k) => k === 'store_payout') }, payerType: 'franchise', payerId: f._id };
  }
  if (roleOf(user) === 'STORE_MANAGER') {
    const s = await managerStore(user);
    return { kind: { $in: kinds.filter((k) => k === 'rider_withdrawal' || k === 'staff_salary') }, payerType: 'store', payerId: s._id };
  }
  throw new ForbiddenError('You cannot pay payouts.');
}
const ALL_KINDS = ['franchise_payout', 'store_payout', 'rider_withdrawal', 'staff_salary'];

/**
 * Marks a waiting payout paid. One atomic update on "still pending and addressed to you": two clicks (or two admins) can
 * never pay it twice. A salary request's amount may be set here (a deduction needs a note).
 */
export async function payPayout(user, id, body = {}) {
  if (!isId(id)) throw new NotFoundError('Payout not found');
  const scope = await payerScope(user, ALL_KINDS);
  const current = await FoodPayout.findOne({ _id: id, ...scope }).lean();
  if (!current) throw new NotFoundError('Payout not found');
  if (current.status !== 'pending') throw conflict(`This payout is already ${current.status}.`);
  const pay = paymentOf(body);
  let amount = current.amount;
  let note = '';
  if (current.kind === 'staff_salary' && body.amount !== undefined && body.amount !== null && body.amount !== '') {
    amount = r2(body.amount);
    if (!(amount >= 1) || amount > 1000000) throw new ValidationError('Enter the salary amount paid (₹1 to ₹10,00,000).');
    note = String(body.note || '').trim();
    if (current.amount > 0 && amount !== current.amount && note.length < 5) throw new ValidationError('Explain why the amount differs from the salary (for example: 2 days leave).');
  }
  if (!(amount >= 1)) throw new ValidationError('Enter the amount paid.');
  const actor = actorOf(user);
  const unset = current.kind === 'staff_salary' ? {} : { activeKey: '' };   // a paid salary keeps its month taken
  let updated;
  try {
    updated = await FoodPayout.findOneAndUpdate(
      { _id: id, ...scope, status: 'pending' },
      {
        $set: { status: 'paid', amount, payment: { ...pay, paidAt: new Date(), paidBy: actor } },
        ...(Object.keys(unset).length ? { $unset: unset } : {}),
        $push: { activity: { at: new Date(), action: 'paid', byRole: actor.role, byName: actor.name, note: `${pay.method === 'cash' ? 'Receipt' : 'UTR'} ${pay.reference}${note ? ` · ${note}` : ''}` } },
      },
      { new: true }
    ).lean();
  } catch (err) {
    if (err?.code === 11000) throw conflict('This payment reference is already used for another payout. Enter the reference of this payment.');
    throw err;
  }
  if (!updated) throw conflict('This payout was just paid or rejected by someone else.');
  await notifyPayout(updated, 'paid');
  return shapePayout(updated, { fullBank: true });
}

/** Rejects a waiting payout with a reason the requester sees; the amount goes back to their balance. */
export async function rejectPayout(user, id, { reason } = {}) {
  if (!isId(id)) throw new NotFoundError('Payout not found');
  const why = String(reason || '').trim();
  if (why.length < 5 || why.length > 300) throw new ValidationError('Give a reason for rejecting (5 to 300 characters).');
  const scope = await payerScope(user, ALL_KINDS);
  const actor = actorOf(user);
  const updated = await FoodPayout.findOneAndUpdate(
    { _id: id, ...scope, status: 'pending' },
    {
      $set: { status: 'rejected', rejection: { reason: why, at: new Date(), by: actor } },
      $unset: { activeKey: '' },
      $push: { activity: { at: new Date(), action: 'rejected', byRole: actor.role, byName: actor.name, note: why } },
    },
    { new: true }
  ).lean();
  if (!updated) {
    const exists = await FoodPayout.findOne({ _id: id, ...scope }).select('status').lean();
    if (!exists) throw new NotFoundError('Payout not found');
    throw conflict(`This payout is already ${exists.status}.`);
  }
  await notifyPayout(updated, 'rejected');
  return shapePayout(updated, { fullBank: true });
}

// ----- "not received" disputes ---------------------------------------------------------------------------------------

/** The filter for payouts the caller received (as rider, staff, store manager or franchise admin). */
async function payeeScope(user) {
  const role = roleOf(user);
  if (role === 'DELIVERY_PARTNER') return { kind: 'rider_withdrawal', payeeId: oid(user.userId) };
  if (role === 'KITCHEN_STAFF') return { kind: 'staff_salary', payeeId: (await myStaffRecord(user))._id };
  if (role === 'STORE_MANAGER') return { kind: 'store_payout', payeeId: (await managerStore(user))._id };
  if (role === 'FRANCHISE_ADMIN') return { kind: 'franchise_payout', payeeId: (await franchiseOf(user))._id };
  throw new ForbiddenError('You do not receive payouts.');
}

/** The payee says a payout marked paid never arrived (within DISPUTE_DAYS of it being marked paid). */
export async function reportNotReceived(user, id, { note } = {}) {
  if (!isId(id)) throw new NotFoundError('Payout not found');
  const text = String(note || '').trim();
  if (text.length < 10 || text.length > 500) throw new ValidationError('Tell us what happened (10 to 500 characters), for example which account you checked.');
  const scope = await payeeScope(user);
  const since = new Date(Date.now() - DISPUTE_DAYS * 86400000);
  const updated = await FoodPayout.findOneAndUpdate(
    { _id: id, ...scope, status: 'paid', 'dispute.status': 'none', 'payment.paidAt': { $gte: since } },
    {
      $set: { 'dispute.status': 'open', 'dispute.note': text, 'dispute.raisedAt': new Date() },
      $push: { activity: { at: new Date(), action: 'not_received', byRole: roleOf(user), byName: user.name || '', note: text } },
    },
    { new: true }
  ).lean();
  if (!updated) {
    const p = await FoodPayout.findOne({ _id: id, ...scope }).lean();
    if (!p) throw new NotFoundError('Payout not found');
    if (p.status !== 'paid') throw conflict('Only a payout marked paid can be reported.');
    if (p.dispute?.status && p.dispute.status !== 'none') throw conflict('You already reported this payout.');
    throw conflict(`A payout can be reported within ${DISPUTE_DAYS} days of being marked paid.`);
  }
  await notifyPayout(updated, 'disputed');
  return shapePayout(updated);
}

/** Who decides a dispute: the franchise admin for rider and staff payouts of its stores; the super admin for the rest (and any). */
async function resolverScope(user) {
  if (isSuper(user)) return {};
  if (roleOf(user) === 'FRANCHISE_ADMIN') {
    const f = await franchiseOf(user);
    return { kind: { $in: ['rider_withdrawal', 'staff_salary'] }, franchiseId: f._id };
  }
  throw new ForbiddenError('Only the franchise admin or super admin decides a dispute.');
}

/**
 * Decides a "not received" report. paid_confirmed: the payment was made (keeps it paid). not_paid: the payout is
 * reversed, the amount goes back to the payee's balance and can be requested (or, for a salary, paid) again.
 */
export async function resolveDispute(user, id, { outcome, resolution } = {}) {
  if (!isId(id)) throw new NotFoundError('Payout not found');
  if (!['paid_confirmed', 'not_paid'].includes(String(outcome))) throw new ValidationError('Choose: payment confirmed, or not paid.');
  const text = String(resolution || '').trim();
  if (text.length < 5 || text.length > 500) throw new ValidationError('Write what you checked (5 to 500 characters).');
  const scope = await resolverScope(user);
  const actor = actorOf(user);
  const set = { 'dispute.status': 'resolved', 'dispute.outcome': outcome, 'dispute.resolution': text, 'dispute.resolvedAt': new Date(), 'dispute.resolvedBy': actor };
  if (outcome === 'not_paid') set.status = 'reversed';
  const updated = await FoodPayout.findOneAndUpdate(
    { _id: id, ...scope, status: 'paid', 'dispute.status': 'open' },
    {
      $set: set,
      ...(outcome === 'not_paid' ? { $unset: { activeKey: '' } } : {}),
      $push: { activity: { at: new Date(), action: outcome === 'not_paid' ? 'reversed' : 'confirmed', byRole: actor.role, byName: actor.name, note: text } },
    },
    { new: true }
  ).lean();
  if (!updated) {
    const p = await FoodPayout.findOne({ _id: id, ...scope }).select('dispute.status').lean();
    if (!p) throw new NotFoundError('Payout not found');
    throw conflict('This report was already decided.');
  }
  await notifyPayout(updated, outcome === 'not_paid' ? 'reversed' : 'confirmed');
  return shapePayout(updated, { fullBank: true });
}

// ----- lists -----------------------------------------------------------------------------------------------------------

const listFilter = (q = {}) => {
  const f = {};
  if (q.status && ['pending', 'paid', 'rejected', 'reversed'].includes(String(q.status))) f.status = String(q.status);
  if (q.dispute === 'open') f['dispute.status'] = 'open';
  return f;
};
const find = (filter, limit = 300) => FoodPayout.find(filter).sort({ createdAt: -1 }).limit(limit).lean();

/** Rider: balance per store, totals and their requests. */
export async function riderPayouts(riderId) {
  const [balances, payouts, rider] = await Promise.all([
    riderBalances(riderId),
    find({ kind: 'rider_withdrawal', payeeId: oid(riderId) }, 100),
    FoodDeliveryPartner.findById(riderId).select('payoutDetailsChangedAt').lean(),
  ]);
  const { deliveryWithdrawalLimit } = await getDeliveryCashLimitSettings();
  const total = (k) => r2(balances.reduce((n, b) => n + b[k], 0));
  return {
    stores: balances,
    totals: { earned: total('earned'), onHold: total('onHold'), paid: total('paid'), pending: total('pending'), available: total('available') },
    minimum: Number(deliveryWithdrawalLimit) || 100,
    bankHoldUntil: holdUntil(rider?.payoutDetailsChangedAt) > new Date() ? holdUntil(rider.payoutDetailsChangedAt) : null,
    holdHours: HOLD_HOURS,
    payouts: payouts.map((p) => shapePayout(p)),
  };
}

/** Store manager: the store's balance with the franchise, its payout account, its requests, and what riders / staff asked for. */
export async function storePayoutDesk(user, q = {}) {
  const store = await managerStore(user);
  const [balance, mine, incoming] = await Promise.all([
    storeBalance(store._id),
    find({ kind: 'store_payout', payeeId: store._id }, 100),
    find({ kind: { $in: ['rider_withdrawal', 'staff_salary'] }, payerType: 'store', payerId: store._id, ...listFilter(q) }),
  ]);
  return {
    store: { id: String(store._id), name: store.storeName },
    balance, holdHours: HOLD_HOURS,
    account: accountView(store.payoutAccount),
    myRequests: mine.map((p) => shapePayout(p)),
    incoming: incoming.map((p) => shapePayout(p, { fullBank: true })),
  };
}

/** Franchise admin: its balance with the platform, its account, its requests, its stores' requests and open disputes. */
export async function franchisePayoutDesk(user, q = {}) {
  const franchise = await franchiseOf(user);
  const stores = await FoodStore.find({ franchiseId: franchise._id }).select('storeName').lean();
  const [balance, mine, incoming, disputes, balances] = await Promise.all([
    franchiseBalance(franchise._id),
    find({ kind: 'franchise_payout', payeeId: franchise._id }, 100),
    find({ kind: 'store_payout', payerType: 'franchise', payerId: franchise._id, ...listFilter(q) }),
    find({ kind: { $in: ['rider_withdrawal', 'staff_salary'] }, franchiseId: franchise._id, 'dispute.status': { $in: ['open', 'resolved'] } }, 200),
    storeBalances(stores.map((s) => String(s._id))),
  ]);
  return {
    franchise: { id: String(franchise._id), name: franchiseName(franchise) },
    balance, holdHours: HOLD_HOURS,
    account: accountView(franchise.payoutAccount),
    myRequests: mine.map((p) => shapePayout(p)),
    incoming: incoming.map((p) => shapePayout(p, { fullBank: true })),
    disputes: disputes.map((p) => shapePayout(p, { fullBank: true })),
    stores: stores.map((s) => ({ id: String(s._id), name: s.storeName, balance: balances.get(String(s._id)) })),
  };
}

/** Super admin: franchise requests to pay, every dispute, and every payout (read-only) with filters. */
export async function platformPayoutDesk(user, q = {}) {
  if (!isSuper(user)) throw new ForbiddenError('Only the super admin can do this.');
  const all = {};
  if (q.kind && ALL_KINDS.includes(String(q.kind))) all.kind = String(q.kind);
  if (isId(q.franchiseId)) all.franchiseId = oid(q.franchiseId);
  if (isId(q.storeId)) all.storeId = oid(q.storeId);
  const [incoming, disputes, everything] = await Promise.all([
    find({ kind: 'franchise_payout', payerType: 'platform', ...listFilter(q) }),
    find({ 'dispute.status': { $in: ['open', 'resolved'] } }, 200),
    find({ ...all, ...listFilter(q) }, 500),
  ]);
  const totals = await FoodPayout.aggregate([{ $group: { _id: { kind: '$kind', status: '$status' }, amount: { $sum: '$amount' }, count: { $sum: 1 } } }]);
  return {
    incoming: incoming.map((p) => shapePayout(p, { fullBank: true })),
    disputes: disputes.map((p) => shapePayout(p, { fullBank: true })),
    all: everything.map((p) => shapePayout(p, { fullBank: true })),
    totals: totals.map((t) => ({ kind: t._id.kind, status: t._id.status, amount: r2(t.amount), count: t.count })),
    holdHours: HOLD_HOURS,
  };
}

// ----- payout accounts --------------------------------------------------------------------------------------------------

export async function saveStoreAccount(user, body) {
  const store = await managerStore(user);
  return saveAccount(FoodStore, store._id, body);
}
export async function saveFranchiseAccount(user, body) {
  const franchise = await franchiseOf(user);
  return saveAccount(FoodFranchise, franchise._id, body);
}
export async function saveMyStaffAccount(user, body) {
  const staff = await myStaffRecord(user);
  return saveAccount(StoreManager, staff._id, body);
}

