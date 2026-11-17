import mongoose from 'mongoose';
import crypto from 'node:crypto';
import { NotFoundError, ValidationError } from '../../../../core/auth/errors.js';
import { RewardMembership } from '../models/rewardMembership.model.js';
import { RewardLedger } from '../models/rewardLedger.model.js';
import { RewardRedemption } from '../models/rewardRedemption.model.js';
import { RewardConfig } from '../../admin/models/rewardConfig.model.js';
import { getRewardRules } from './rewards.service.js';
import { FoodUser } from '../../../../core/users/user.model.js';
import { logger } from '../../../../utils/logger.js';

// Redeeming Cheesy Rewards points for a free item (docs: Super Admin > Rewards sets the items and the points each costs).
// The customer makes a claim code, shows it at a store, and the store manager hands over the item and confirms.
// Points are taken when the code is made and given back if the code is cancelled or runs out (24 hours).

export const CODE_VALID_MS = 24 * 60 * 60 * 1000;
export const MAX_PENDING_PER_USER = 3;

const oid = (v, label) => {
    if (!mongoose.Types.ObjectId.isValid(String(v || ''))) throw new NotFoundError(`${label} not found`);
    return new mongoose.Types.ObjectId(String(v));
};

async function inTransaction(work) {
    const session = await mongoose.startSession();
    try {
        let result;
        await session.withTransaction(async () => { result = await work(session); });
        return result;
    } finally {
        await session.endSession();
    }
}

const productKey = (p) => String(p.productId || `${p.name}|${p.size || ''}|${p.crust || ''}`);

/** The reward items the super admin set up, each with its cost in points (the item's own, else the programme default). */
export async function rewardCatalogue() {
    const [config, rules] = await Promise.all([RewardConfig.findOne().select('rewardProducts').lean(), getRewardRules()]);
    return (config?.rewardProducts || [])
        .filter((p) => p?.name)
        .map((p) => ({
            productId: productKey(p),
            name: p.name,
            size: p.size || '',
            crust: p.crust || '',
            image: p.image || '',
            originalPrice: Number(p.originalPrice) || 0,
            points: Math.max(1, Math.floor(Number(p.requiredPoints)) || rules.pointsRequired),
        }));
}

const shape = (r) => ({
    id: String(r._id),
    code: r.code,
    status: r.status,
    product: r.product,
    points: r.points,
    expiresAt: r.expiresAt,
    createdAt: r.createdAt,
    redeemedAt: r.redeemedAt || null,
    storeId: r.storeId ? String(r.storeId) : null,
    handledByName: r.handledByName || '',
    cancelReason: r.cancelReason || '',
});

/** Gives the points of a redemption back (cancelled or run out). Only while the customer is still in the programme. */
async function returnPoints(redemption, description) {
    await inTransaction(async (session) => {
        const membership = await RewardMembership.findOneAndUpdate(
            { userId: redemption.userId, status: 'ACTIVE' },
            { $inc: { pointsBalance: redemption.points } },
            { new: true, session }
        );
        if (!membership) return;
        await RewardLedger.create([{
            membershipId: membership._id, userId: redemption.userId, type: 'REVERSAL', direction: 'CREDIT', points: redemption.points,
            balanceAfter: membership.pointsBalance, description, idempotencyKey: `rewards:redeem:${redemption._id}:return`,
            metadata: { redemptionId: String(redemption._id) },
        }], { session });
    });
}

/** Codes past their 24 hours: marked expired and the points returned. Safe to call often. */
export async function expireStale(userId = null) {
    const filter = { status: 'PENDING', expiresAt: { $lt: new Date() }, ...(userId ? { userId: oid(userId, 'User') } : {}) };
    for (const stale of await RewardRedemption.find(filter).limit(200).lean()) {
        const claimed = await RewardRedemption.findOneAndUpdate({ _id: stale._id, status: 'PENDING' }, { $set: { status: 'EXPIRED' } }, { new: true }).lean();
        if (claimed) await returnPoints(claimed, `Points returned: reward code ${claimed.code} expired`).catch((e) => logger.error(`[Rewards] return failed: ${e.message}`));
    }
}

const newCode = () => String(crypto.randomInt(100000, 1000000));

export async function createRedemption(userId, productId) {
    const userOid = oid(userId, 'User');
    const rules = await getRewardRules();
    if (!rules.isEnabled) throw new ValidationError('The rewards programme is not running right now.');
    await expireStale(userId);
    const item = (await rewardCatalogue()).find((p) => p.productId === String(productId || ''));
    if (!item) throw new ValidationError('This reward is not available.');
    const pending = await RewardRedemption.countDocuments({ userId: userOid, status: 'PENDING' });
    if (pending >= MAX_PENDING_PER_USER) throw new ValidationError('You already have unused reward codes. Use or wait for them to expire first.');

    for (let attempt = 0; attempt < 5; attempt += 1) {
        try {
            return shape(await inTransaction(async (session) => {
                const membership = await RewardMembership.findOneAndUpdate(
                    { userId: userOid, status: 'ACTIVE', pointsBalance: { $gte: item.points } },
                    { $inc: { pointsBalance: -item.points } },
                    { new: true, session }
                );
                if (!membership) throw new ValidationError(`You need ${item.points} points for this reward.`);
                const [row] = await RewardRedemption.create([{
                    userId: userOid, code: newCode(), points: item.points, expiresAt: new Date(Date.now() + CODE_VALID_MS),
                    product: { productId: item.productId, name: item.name, size: item.size, crust: item.crust, image: item.image, originalPrice: item.originalPrice },
                }], { session });
                await RewardLedger.create([{
                    membershipId: membership._id, userId: userOid, type: 'REDEEM', direction: 'DEBIT', points: item.points,
                    balanceAfter: membership.pointsBalance, description: `Redeemed for ${item.name}`,
                    idempotencyKey: `rewards:redeem:${row._id}:debit`, metadata: { redemptionId: String(row._id), code: row.code },
                }], { session });
                return row.toObject();
            }));
        } catch (err) {
            if (err?.code === 11000 && /code/.test(String(err.message))) continue; // that code exists: make another
            throw err;
        }
    }
    throw new ValidationError('Could not make a code. Please try again.');
}

export async function listMyRedemptions(userId) {
    const userOid = oid(userId, 'User');
    await expireStale(userId);
    const rows = await RewardRedemption.find({ userId: userOid }).sort({ createdAt: -1 }).limit(30).lean();
    return rows.map(shape);
}

const CODE_RE = /^\d{6}$/;

/** What the store manager sees when a customer shows a code: who, what, and whether it can still be used. */
export async function lookupByCode(code) {
    if (!CODE_RE.test(String(code || ''))) throw new ValidationError('Enter the 6-digit code.');
    await expireStale();
    const row = await RewardRedemption.findOne({ code: String(code) }).lean();
    if (!row) throw new NotFoundError('This code was not found.');
    const user = await FoodUser.findById(row.userId).select('name mobile phone').lean();
    return { ...shape(row), customer: { id: String(row.userId), name: user?.name || '', phone: user?.mobile || user?.phone || '' } };
}

/** The store hands over the item: the code is used once. */
export async function confirmRedemption(code, { storeId, actorId, actorName }) {
    if (!CODE_RE.test(String(code || ''))) throw new ValidationError('Enter the 6-digit code.');
    await expireStale();
    const row = await RewardRedemption.findOneAndUpdate(
        { code: String(code), status: 'PENDING', expiresAt: { $gt: new Date() } },
        { $set: { status: 'REDEEMED', redeemedAt: new Date(), storeId: oid(storeId, 'Store'), handledBy: actorId && mongoose.Types.ObjectId.isValid(String(actorId)) ? new mongoose.Types.ObjectId(String(actorId)) : null, handledByName: String(actorName || '').slice(0, 80) } },
        { new: true }
    ).lean();
    if (!row) {
        const existing = await RewardRedemption.findOne({ code: String(code) }).lean();
        if (!existing) throw new NotFoundError('This code was not found.');
        throw new ValidationError(existing.status === 'REDEEMED' ? 'This code was already used.' : existing.status === 'PENDING' ? 'This code has expired.' : `This code is ${existing.status.toLowerCase()}.`);
    }
    logger.info(`[Rewards] REDEEMED ${row.code} store=${row.storeId}`);
    return shape(row);
}

/** A code that was not used and is cancelled (by the store manager, or the customer): the points go back. */
export async function cancelRedemption({ code, id, userId = null, reason = '' }) {
    const match = code ? { code: String(code) } : { _id: oid(id, 'Reward code') };
    if (userId) match.userId = oid(userId, 'User');
    const row = await RewardRedemption.findOneAndUpdate(
        { ...match, status: 'PENDING' },
        { $set: { status: 'CANCELLED', cancelReason: String(reason || '').slice(0, 200) } },
        { new: true }
    ).lean();
    if (!row) throw new ValidationError('Only an unused code can be cancelled.');
    await returnPoints(row, `Points returned: reward code ${row.code} cancelled`);
    return shape(row);
}
