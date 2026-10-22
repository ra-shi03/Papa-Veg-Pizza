import mongoose from 'mongoose';
import { ValidationError, NotFoundError } from '../../../../core/auth/errors.js';
import { WalletAccount } from '../models/walletAccount.model.js';
import { WalletTransaction } from '../models/walletTransaction.model.js';
import { logger } from '../../../../utils/logger.js';

/**
 * Customer refund wallet — the ONLY code path that changes WalletAccount balances.
 *
 * Rules:
 * - Amounts are integer paise.
 * - Every balance change and its ledger row are written in one MongoDB transaction.
 * - Every write carries a unique idempotencyKey, so retries never double-credit or double-debit.
 * - availableBalancePaise can never go below zero (conditional $inc + schema min).
 * - COMPLETED rows are never edited; a reversal is a new compensating row.
 */

const CURRENCY = 'INR';
const RESERVATION_TTL_MS = 15 * 60 * 1000;

export const rupeesToPaise = (amount) => {
    const n = Number(amount);
    if (!Number.isFinite(n)) return NaN;
    return Math.round(n * 100);
};

export const paiseToRupees = (paise) => Math.round(Number(paise) || 0) / 100;

const toObjectId = (id, label) => {
    const value = String(id || '');
    if (!mongoose.Types.ObjectId.isValid(value)) throw new ValidationError(`${label} is invalid`);
    return new mongoose.Types.ObjectId(value);
};

const optionalObjectId = (id) => {
    const value = String(id || '');
    return mongoose.Types.ObjectId.isValid(value) ? new mongoose.Types.ObjectId(value) : null;
};

const assertAmountPaise = (amountPaise) => {
    if (!Number.isInteger(amountPaise) || amountPaise <= 0) {
        throw new ValidationError('Amount must be greater than 0');
    }
};

const assertKey = (idempotencyKey) => {
    if (!idempotencyKey || typeof idempotencyKey !== 'string') {
        throw new ValidationError('idempotencyKey is required');
    }
};

const isDuplicateKeyError = (err) => err?.code === 11000;

async function runInTransaction(work) {
    const session = await mongoose.startSession();
    try {
        let result;
        await session.withTransaction(async () => {
            result = await work(session);
        });
        return result;
    } finally {
        await session.endSession();
    }
}

function findAccount(userOid, session = null) {
    return WalletAccount.findOne({ userId: userOid, currency: CURRENCY }).session(session);
}

/** Get-or-create the customer's wallet (unique per user + currency). Safe under concurrency. */
async function ensureAccount(userOid) {
    const upsert = () =>
        WalletAccount.findOneAndUpdate(
            { userId: userOid, currency: CURRENCY },
            { $setOnInsert: { availableBalancePaise: 0, reservedBalancePaise: 0, status: 'ACTIVE' } },
            { upsert: true, new: true, setDefaultsOnInsert: false }
        );
    try {
        return await upsert();
    } catch (err) {
        // Two first-time requests raced on the unique { userId, currency } index — the other one won.
        if (isDuplicateKeyError(err)) return findAccount(userOid);
        throw err;
    }
}

/** Return the already-applied row for this key, or null. Guards against a key reused for another user. */
async function findByKey(idempotencyKey, userOid) {
    const existing = await WalletTransaction.findOne({ idempotencyKey }).lean();
    if (existing && String(existing.userId) !== String(userOid)) {
        throw new ValidationError('Idempotency key already used for a different wallet');
    }
    return existing;
}

/** Run a write; if a concurrent request already applied the same key, return that row instead. */
async function withIdempotency(idempotencyKey, userOid, write) {
    try {
        return await write();
    } catch (err) {
        if (isDuplicateKeyError(err)) {
            const existing = await findByKey(idempotencyKey, userOid);
            if (existing) return { transaction: existing, duplicate: true };
        }
        throw err;
    }
}

/**
 * Credit the wallet. Internal/trusted callers only (refund workflow, referral, verified top-up) —
 * never exposed as a customer-facing endpoint.
 *
 * @param {number} [maxOrderRefundPaise] For ORDER_REFUND: total refunds credited for this order may not exceed this.
 */
export async function creditWallet({
    userId,
    amountPaise,
    reason,
    idempotencyKey,
    orderId = null,
    orderRef = '',
    refundId = null,
    description = '',
    providerRef = '',
    metadata,
    maxOrderRefundPaise = null
}) {
    assertAmountPaise(amountPaise);
    assertKey(idempotencyKey);
    const userOid = toObjectId(userId, 'User');
    const orderOid = optionalObjectId(orderId);

    const existing = await findByKey(idempotencyKey, userOid);
    if (existing) return { transaction: existing, duplicate: true };

    const account = await ensureAccount(userOid);

    return withIdempotency(idempotencyKey, userOid, () =>
        runInTransaction(async (session) => {
            if (reason === 'ORDER_REFUND' && orderOid && Number.isInteger(maxOrderRefundPaise)) {
                const [agg] = await WalletTransaction.aggregate([
                    { $match: { orderId: orderOid, reason: 'ORDER_REFUND', type: 'CREDIT', status: 'COMPLETED' } },
                    { $group: { _id: null, total: { $sum: '$amountPaise' } } }
                ]).session(session);
                const alreadyRefunded = agg?.total || 0;
                if (alreadyRefunded + amountPaise > maxOrderRefundPaise) {
                    throw new ValidationError('Refund exceeds the refundable amount for this order');
                }
            }

            const updated = await WalletAccount.findOneAndUpdate(
                { _id: account._id, status: { $ne: 'CLOSED' } },
                { $inc: { availableBalancePaise: amountPaise } },
                { new: true, session }
            );
            if (!updated) throw new ValidationError('Wallet is closed');

            const [transaction] = await WalletTransaction.create(
                [
                    {
                        walletId: updated._id,
                        userId: userOid,
                        orderId: orderOid,
                        orderRef: String(orderRef || ''),
                        refundId: optionalObjectId(refundId),
                        type: 'CREDIT',
                        reason,
                        amountPaise,
                        currency: CURRENCY,
                        balanceAfterPaise: updated.availableBalancePaise,
                        idempotencyKey,
                        status: 'COMPLETED',
                        description,
                        providerRef: String(providerRef || ''),
                        metadata,
                        completedAt: new Date()
                    }
                ],
                { session }
            );
            logger.info(`[Wallet] CREDIT ${amountPaise}p ${reason} user=${userOid} key=${idempotencyKey}`);
            return { transaction: transaction.toObject(), duplicate: false };
        })
    );
}

/**
 * Hold funds for checkout: moves amount from available → reserved and writes a PENDING DEBIT row.
 * Must be followed by confirmReservation (order placed) or releaseReservation (checkout failed).
 */
export async function reserveFunds({
    userId,
    amountPaise,
    idempotencyKey,
    orderId = null,
    orderRef = '',
    description = 'Wallet used for order',
    ttlMs = RESERVATION_TTL_MS
}) {
    assertAmountPaise(amountPaise);
    assertKey(idempotencyKey);
    const userOid = toObjectId(userId, 'User');

    const existing = await findByKey(idempotencyKey, userOid);
    if (existing) {
        if (existing.status === 'RELEASED') throw new ValidationError('This wallet payment was already released');
        if (existing.amountPaise !== amountPaise) throw new ValidationError('Idempotency key reused with a different amount');
        return { transaction: existing, duplicate: true };
    }

    await releaseExpiredReservations(userOid);
    const account = await findAccount(userOid);
    if (!account) throw new ValidationError('Insufficient wallet balance');

    return withIdempotency(idempotencyKey, userOid, () =>
        runInTransaction(async (session) => {
            const updated = await WalletAccount.findOneAndUpdate(
                { _id: account._id, status: 'ACTIVE', availableBalancePaise: { $gte: amountPaise } },
                { $inc: { availableBalancePaise: -amountPaise, reservedBalancePaise: amountPaise } },
                { new: true, session }
            );
            if (!updated) {
                throw new ValidationError(
                    account.status !== 'ACTIVE' ? 'Wallet is not active' : 'Insufficient wallet balance'
                );
            }

            const [transaction] = await WalletTransaction.create(
                [
                    {
                        walletId: updated._id,
                        userId: userOid,
                        orderId: optionalObjectId(orderId),
                        orderRef: String(orderRef || ''),
                        type: 'DEBIT',
                        reason: 'ORDER_PAYMENT',
                        amountPaise,
                        currency: CURRENCY,
                        balanceAfterPaise: updated.availableBalancePaise,
                        idempotencyKey,
                        status: 'PENDING',
                        description,
                        expiresAt: new Date(Date.now() + ttlMs)
                    }
                ],
                { session }
            );
            logger.info(`[Wallet] RESERVE ${amountPaise}p user=${userOid} key=${idempotencyKey}`);
            return { transaction: transaction.toObject(), duplicate: false };
        })
    );
}

/** Finalise a PENDING hold: reserved funds are spent and the row becomes an immutable COMPLETED debit. */
export async function confirmReservation({ userId, transactionId, orderId = null, orderRef = '' }) {
    const userOid = toObjectId(userId, 'User');
    const txOid = toObjectId(transactionId, 'Wallet payment');

    return runInTransaction(async (session) => {
        const pending = await WalletTransaction.findOne({ _id: txOid, userId: userOid }).session(session);
        if (!pending) throw new NotFoundError('Wallet payment not found');
        if (pending.status === 'COMPLETED') return { transaction: pending.toObject(), duplicate: true };
        if (pending.status !== 'PENDING') throw new ValidationError('This wallet payment was already released');

        const account = await WalletAccount.findOneAndUpdate(
            { _id: pending.walletId, reservedBalancePaise: { $gte: pending.amountPaise } },
            { $inc: { reservedBalancePaise: -pending.amountPaise } },
            { new: true, session }
        );
        if (!account) throw new ValidationError('Reserved wallet funds not found');

        const set = {
            status: 'COMPLETED',
            completedAt: new Date(),
            expiresAt: null,
            balanceAfterPaise: account.availableBalancePaise
        };
        const orderOid = optionalObjectId(orderId);
        if (orderOid) set.orderId = orderOid;
        if (orderRef) set.orderRef = String(orderRef);

        const transaction = await WalletTransaction.findOneAndUpdate(
            { _id: pending._id, status: 'PENDING' },
            { $set: set },
            { new: true, session }
        ).lean();
        if (!transaction) throw new ValidationError('Wallet payment state changed, please retry');
        logger.info(`[Wallet] CONFIRM ${pending.amountPaise}p user=${userOid} tx=${pending._id}`);
        return { transaction, duplicate: false };
    });
}

/** Return a PENDING hold to the available balance (checkout failed or abandoned). */
export async function releaseReservation({ userId, transactionId, note = '' }) {
    const userOid = toObjectId(userId, 'User');
    const txOid = toObjectId(transactionId, 'Wallet payment');

    return runInTransaction(async (session) => {
        const pending = await WalletTransaction.findOne({ _id: txOid, userId: userOid }).session(session);
        if (!pending) throw new NotFoundError('Wallet payment not found');
        if (pending.status === 'RELEASED') return { transaction: pending.toObject(), duplicate: true };
        if (pending.status !== 'PENDING') {
            throw new ValidationError('Wallet payment is already completed; a refund must be requested instead');
        }

        const account = await WalletAccount.findOneAndUpdate(
            { _id: pending.walletId, reservedBalancePaise: { $gte: pending.amountPaise } },
            { $inc: { reservedBalancePaise: -pending.amountPaise, availableBalancePaise: pending.amountPaise } },
            { new: true, session }
        );
        if (!account) throw new ValidationError('Reserved wallet funds not found');

        const transaction = await WalletTransaction.findOneAndUpdate(
            { _id: pending._id, status: 'PENDING' },
            {
                $set: {
                    status: 'RELEASED',
                    expiresAt: null,
                    balanceAfterPaise: account.availableBalancePaise,
                    ...(note ? { 'metadata.releaseNote': note } : {})
                }
            },
            { new: true, session }
        ).lean();
        if (!transaction) throw new ValidationError('Wallet payment state changed, please retry');
        logger.info(`[Wallet] RELEASE ${pending.amountPaise}p user=${userOid} tx=${pending._id}`);
        return { transaction, duplicate: false };
    });
}

/** Release holds whose checkout never confirmed. Called lazily before balance reads and new holds. */
export async function releaseExpiredReservations(userId) {
    const userOid = optionalObjectId(userId);
    if (!userOid) return 0;
    const stale = await WalletTransaction.find({
        userId: userOid,
        status: 'PENDING',
        expiresAt: { $ne: null, $lte: new Date() }
    })
        .select('_id')
        .lean();

    let released = 0;
    for (const row of stale) {
        try {
            await releaseReservation({ userId: userOid, transactionId: row._id, note: 'Reservation expired' });
            released += 1;
        } catch (err) {
            logger.warn(`[Wallet] Could not release expired hold ${row._id}: ${err.message}`);
        }
    }
    return released;
}

/** Shape a ledger row for API responses. Amounts in rupees for display plus exact paise. */
export function formatWalletTransaction(tx) {
    return {
        id: String(tx._id),
        type: tx.type,
        reason: tx.reason,
        amount: paiseToRupees(tx.amountPaise),
        amountPaise: tx.amountPaise,
        currency: tx.currency || CURRENCY,
        balanceAfter: paiseToRupees(tx.balanceAfterPaise),
        balanceAfterPaise: tx.balanceAfterPaise,
        status: tx.status,
        description: tx.description || '',
        orderId: tx.orderId ? String(tx.orderId) : null,
        orderRef: tx.orderRef || '',
        refundId: tx.refundId ? String(tx.refundId) : null,
        createdAt: tx.createdAt,
        completedAt: tx.completedAt || null
    };
}

export async function getWalletSummary(userId) {
    const userOid = toObjectId(userId, 'User');
    await releaseExpiredReservations(userOid);
    const account = await findAccount(userOid).lean();
    const available = account?.availableBalancePaise || 0;
    const reserved = account?.reservedBalancePaise || 0;
    return {
        id: account ? String(account._id) : null,
        currency: account?.currency || CURRENCY,
        status: account?.status || 'ACTIVE',
        balance: paiseToRupees(available),
        availableBalancePaise: available,
        reservedBalance: paiseToRupees(reserved),
        reservedBalancePaise: reserved,
        updatedAt: account?.updatedAt || null
    };
}

/** History for the caller's own wallet only. Released holds never happened, so they are hidden. */
export async function listWalletTransactions(userId, { page = 1, limit = 20, type, from, to } = {}) {
    const userOid = toObjectId(userId, 'User');
    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    const filter = { userId: userOid, status: { $in: ['COMPLETED', 'PENDING'] } };
    const normalizedType = String(type || '').toUpperCase();
    if (normalizedType === 'CREDIT' || normalizedType === 'DEBIT') filter.type = normalizedType;
    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(to) : null;
    if ((fromDate && !Number.isNaN(fromDate.getTime())) || (toDate && !Number.isNaN(toDate.getTime()))) {
        filter.createdAt = {};
        if (fromDate && !Number.isNaN(fromDate.getTime())) filter.createdAt.$gte = fromDate;
        if (toDate && !Number.isNaN(toDate.getTime())) filter.createdAt.$lte = toDate;
    }

    const [rows, total] = await Promise.all([
        WalletTransaction.find(filter)
            .sort({ createdAt: -1, _id: -1 })
            .skip((safePage - 1) * safeLimit)
            .limit(safeLimit)
            .lean(),
        WalletTransaction.countDocuments(filter)
    ]);

    return {
        transactions: rows.map(formatWalletTransaction),
        pagination: {
            page: safePage,
            limit: safeLimit,
            total,
            totalPages: Math.ceil(total / safeLimit),
            hasMore: safePage * safeLimit < total
        }
    };
}

export async function getWalletTransaction(userId, transactionId) {
    const userOid = toObjectId(userId, 'User');
    const txOid = toObjectId(transactionId, 'Transaction');
    const tx = await WalletTransaction.findOne({ _id: txOid, userId: userOid }).lean();
    if (!tx) throw new NotFoundError('Transaction not found');
    return formatWalletTransaction(tx);
}

export async function getReferralEarningsPaise(userId) {
    const userOid = optionalObjectId(userId);
    if (!userOid) return 0;
    const [agg] = await WalletTransaction.aggregate([
        { $match: { userId: userOid, reason: 'REFERRAL_REWARD', type: 'CREDIT', status: 'COMPLETED' } },
        { $group: { _id: null, total: { $sum: '$amountPaise' } } }
    ]);
    return agg?.total || 0;
}

/** Total wallet refunds already credited for an order (used to cap further refunds). */
export async function getOrderWalletRefundedPaise(orderId) {
    const orderOid = optionalObjectId(orderId);
    if (!orderOid) return 0;
    const [agg] = await WalletTransaction.aggregate([
        { $match: { orderId: orderOid, reason: 'ORDER_REFUND', type: 'CREDIT', status: 'COMPLETED' } },
        { $group: { _id: null, total: { $sum: '$amountPaise' } } }
    ]);
    return agg?.total || 0;
}
