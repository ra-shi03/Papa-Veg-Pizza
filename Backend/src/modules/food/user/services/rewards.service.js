import mongoose from 'mongoose';
import { ValidationError } from '../../../../core/auth/errors.js';
import { RewardMembership } from '../models/rewardMembership.model.js';
import { RewardLedger } from '../models/rewardLedger.model.js';
import { RewardConfig } from '../../admin/models/rewardConfig.model.js';
import { FoodOrder } from '../../orders/models/order.model.js';
import { logger } from '../../../../utils/logger.js';

/**
 * Cheesy Rewards points — loyalty only, never money, never mixed with the refund wallet.
 * Earning rules come from the `rewardconfigs` document managed in Super Admin → Rewards.
 * Points change only through this service, in a MongoDB transaction with a RewardLedger row
 * keyed by a unique idempotencyKey (so an order can earn at most once).
 */

const POINTS_VALIDITY_DAYS = 365;
const DAY_MS = 24 * 60 * 60 * 1000;

const isDuplicateKeyError = (err) => err?.code === 11000;

const toObjectId = (id, label) => {
    const value = String(id || '');
    if (!mongoose.Types.ObjectId.isValid(value)) throw new ValidationError(`${label} is invalid`);
    return new mongoose.Types.ObjectId(value);
};

const toWholePoints = (value, fallback) => {
    const n = Math.floor(Number(value));
    return Number.isFinite(n) && n >= 0 ? n : fallback;
};

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

export async function getRewardRules() {
    const config = await RewardConfig.findOne()
        .select('isEnabled programName minOrderAmount pointsPerOrder defaultPointsRequired')
        .lean();
    return {
        isEnabled: config ? config.isEnabled !== false : true,
        programName: config?.programName || 'Cheesy Rewards',
        minOrderAmount: Math.max(0, Number(config?.minOrderAmount ?? 349) || 0),
        pointsPerOrder: toWholePoints(config?.pointsPerOrder, 100),
        pointsRequired: Math.max(1, toWholePoints(config?.defaultPointsRequired, 600))
    };
}

function buildSummary(membership, rules) {
    const isEnrolled = membership?.status === 'ACTIVE';
    const points = isEnrolled ? membership.pointsBalance || 0 : 0;
    const required = rules.pointsRequired;
    return {
        isProgramEnabled: rules.isEnabled,
        isEnrolled,
        status: membership?.status || 'NOT_ENROLLED',
        enrolledAt: isEnrolled ? membership.enrolledAt : null,
        points,
        lifetimeEarned: isEnrolled ? membership.lifetimeEarned || 0 : 0,
        pointsPerOrder: rules.pointsPerOrder,
        pointsRequired: required,
        minOrderAmount: rules.minOrderAmount,
        pointsToNextReward: points >= required ? 0 : required - points,
        progressPercent: Math.min(100, Math.round((points / required) * 100)),
        rewardsUnlocked: points >= required,
        availableRedemptions: Math.floor(points / required)
    };
}

export async function getRewardsSummary(userId) {
    const userOid = toObjectId(userId, 'User');
    const [membership, rules] = await Promise.all([
        RewardMembership.findOne({ userId: userOid }).lean(),
        getRewardRules()
    ]);
    return buildSummary(membership, rules);
}

export async function isRewardsMember(userId) {
    const value = String(userId || '');
    if (!mongoose.Types.ObjectId.isValid(value)) return false;
    const membership = await RewardMembership.findOne({ userId: new mongoose.Types.ObjectId(value) })
        .select('status')
        .lean();
    return membership?.status === 'ACTIVE';
}

export async function enrollMember(userId) {
    const userOid = toObjectId(userId, 'User');
    const rules = await getRewardRules();
    if (!rules.isEnabled) throw new ValidationError(`${rules.programName} is currently unavailable`);

    const existing = await RewardMembership.findOne({ userId: userOid }).lean();
    if (existing?.status === 'ACTIVE') return buildSummary(existing, rules);

    const enrol = () =>
        RewardMembership.findOneAndUpdate(
            { userId: userOid, status: { $ne: 'ACTIVE' } },
            {
                $set: { status: 'ACTIVE', enrolledAt: new Date(), quitAt: null },
                $setOnInsert: { pointsBalance: 0, lifetimeEarned: 0 }
            },
            { upsert: true, new: true, setDefaultsOnInsert: false }
        ).lean();

    let membership;
    try {
        membership = await enrol();
    } catch (err) {
        // Concurrent enrol (or already ACTIVE) hit the unique userId index — read the winner.
        if (!isDuplicateKeyError(err)) throw err;
        membership = await RewardMembership.findOne({ userId: userOid }).lean();
    }
    logger.info(`[Rewards] ENROLL user=${userOid}`);
    return buildSummary(membership, rules);
}

/** Quitting forfeits the remaining balance (as stated in the quit confirmation copy). */
export async function quitMember(userId) {
    const userOid = toObjectId(userId, 'User');
    const rules = await getRewardRules();

    const membership = await runInTransaction(async (session) => {
        const current = await RewardMembership.findOne({ userId: userOid }).session(session);
        if (!current || current.status !== 'ACTIVE') return current ? current.toObject() : null;

        const forfeited = current.pointsBalance || 0;
        const quitAt = new Date();
        const updated = await RewardMembership.findOneAndUpdate(
            { _id: current._id, status: 'ACTIVE', pointsBalance: forfeited },
            { $set: { status: 'QUIT', quitAt, pointsBalance: 0 } },
            { new: true, session }
        ).lean();
        if (!updated) throw new ValidationError('Your rewards balance changed, please try again');

        if (forfeited > 0) {
            await RewardLedger.create(
                [
                    {
                        membershipId: current._id,
                        userId: userOid,
                        type: 'FORFEIT',
                        direction: 'DEBIT',
                        points: forfeited,
                        balanceAfter: 0,
                        description: 'Points removed on leaving the program',
                        idempotencyKey: `rewards:${current._id}:forfeit:${quitAt.getTime()}`
                    }
                ],
                { session }
            );
        }
        return updated;
    });

    logger.info(`[Rewards] QUIT user=${userOid}`);
    return buildSummary(membership, rules);
}

/**
 * Award points for a delivered order. Safe to call any number of times: the ledger key
 * `rewards:order:<id>:earn` guarantees a single award. Eligibility is re-checked here from
 * trusted data (order in DB + rewardconfigs), never from client input.
 */
export async function awardOrderPoints(orderId) {
    const orderOid = toObjectId(orderId, 'Order');
    const idempotencyKey = `rewards:order:${orderOid}:earn`;

    const already = await RewardLedger.findOne({ idempotencyKey }).lean();
    if (already) return { awarded: false, reason: 'already_awarded', entry: already };

    const order = await FoodOrder.findById(orderOid).select('userId orderStatus pricing order_id createdAt').lean();
    if (!order || !order.userId) return { awarded: false, reason: 'order_not_found' };
    if (order.orderStatus !== 'delivered') return { awarded: false, reason: 'not_delivered' };

    const rules = await getRewardRules();
    if (!rules.isEnabled) return { awarded: false, reason: 'program_disabled' };
    if (rules.pointsPerOrder <= 0) return { awarded: false, reason: 'no_points_configured' };

    const foodSubtotal = Number(order.pricing?.subtotal) || 0;
    if (foodSubtotal < rules.minOrderAmount) return { awarded: false, reason: 'below_minimum_subtotal' };

    const membership = await RewardMembership.findOne({ userId: order.userId }).lean();
    if (!membership || membership.status !== 'ACTIVE') return { awarded: false, reason: 'not_enrolled' };
    if (membership.enrolledAt && new Date(order.createdAt) < new Date(membership.enrolledAt)) {
        return { awarded: false, reason: 'placed_before_enrollment' };
    }

    const points = rules.pointsPerOrder;
    try {
        const entry = await runInTransaction(async (session) => {
            const updated = await RewardMembership.findOneAndUpdate(
                { _id: membership._id, status: 'ACTIVE' },
                { $inc: { pointsBalance: points, lifetimeEarned: points } },
                { new: true, session }
            );
            if (!updated) throw new ValidationError('Membership is no longer active');

            const [row] = await RewardLedger.create(
                [
                    {
                        membershipId: updated._id,
                        userId: order.userId,
                        orderId: orderOid,
                        type: 'EARN',
                        direction: 'CREDIT',
                        points,
                        balanceAfter: updated.pointsBalance,
                        description: `Earned on order #${order.order_id || orderOid}`,
                        idempotencyKey,
                        expiresAt: new Date(Date.now() + POINTS_VALIDITY_DAYS * DAY_MS),
                        metadata: { foodSubtotal, minOrderAmount: rules.minOrderAmount }
                    }
                ],
                { session }
            );
            return row.toObject();
        });
        logger.info(`[Rewards] EARN ${points} user=${order.userId} order=${orderOid}`);
        return { awarded: true, entry };
    } catch (err) {
        if (isDuplicateKeyError(err)) return { awarded: false, reason: 'already_awarded' };
        if (err instanceof ValidationError) return { awarded: false, reason: 'not_enrolled' };
        throw err;
    }
}

/**
 * Reverse points earned on an order (e.g. it is later cancelled/refunded). Writes a compensating
 * REVERSAL row; never deletes the EARN row. Only reverses what is still in the balance.
 */
export async function reverseOrderPoints(orderId, reason = 'Order cancelled') {
    const orderOid = toObjectId(orderId, 'Order');
    const earn = await RewardLedger.findOne({ orderId: orderOid, type: 'EARN' }).lean();
    if (!earn) return { reversed: false, reason: 'nothing_earned' };

    const idempotencyKey = `rewards:order:${orderOid}:reversal`;
    if (await RewardLedger.exists({ idempotencyKey })) return { reversed: false, reason: 'already_reversed' };

    try {
        return await runInTransaction(async (session) => {
            const membership = await RewardMembership.findById(earn.membershipId).session(session);
            const deduct = Math.min(earn.points, membership?.pointsBalance || 0);
            if (!membership || deduct <= 0) return { reversed: false, reason: 'no_balance' };

            const updated = await RewardMembership.findOneAndUpdate(
                { _id: membership._id, pointsBalance: { $gte: deduct } },
                { $inc: { pointsBalance: -deduct } },
                { new: true, session }
            );
            if (!updated) throw new ValidationError('Points balance changed, please retry');

            await RewardLedger.create(
                [
                    {
                        membershipId: membership._id,
                        userId: membership.userId,
                        orderId: orderOid,
                        type: 'REVERSAL',
                        direction: 'DEBIT',
                        points: deduct,
                        balanceAfter: updated.pointsBalance,
                        description: reason,
                        idempotencyKey
                    }
                ],
                { session }
            );
            logger.info(`[Rewards] REVERSAL ${deduct} user=${membership.userId} order=${orderOid}`);
            return { reversed: true, points: deduct };
        });
    } catch (err) {
        if (isDuplicateKeyError(err)) return { reversed: false, reason: 'already_reversed' };
        throw err;
    }
}

export async function listRewardTransactions(userId, { page = 1, limit = 20 } = {}) {
    const userOid = toObjectId(userId, 'User');
    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const filter = { userId: userOid };

    const [rows, total] = await Promise.all([
        RewardLedger.find(filter)
            .sort({ createdAt: -1, _id: -1 })
            .skip((safePage - 1) * safeLimit)
            .limit(safeLimit)
            .lean(),
        RewardLedger.countDocuments(filter)
    ]);

    return {
        transactions: rows.map((row) => ({
            id: String(row._id),
            type: row.type,
            direction: row.direction,
            points: row.points,
            balanceAfter: row.balanceAfter,
            description: row.description || '',
            orderId: row.orderId ? String(row.orderId) : null,
            expiresAt: row.expiresAt || null,
            createdAt: row.createdAt
        })),
        pagination: {
            page: safePage,
            limit: safeLimit,
            total,
            totalPages: Math.ceil(total / safeLimit),
            hasMore: safePage * safeLimit < total
        }
    };
}

/** Fire-and-forget wrappers for order lifecycle hooks — a rewards failure must never break the order flow. */
export function awardOrderPointsSafely(orderId) {
    awardOrderPoints(orderId).catch((err) =>
        logger.error(`[Rewards] award failed for order ${orderId}: ${err.message}`)
    );
}

export function reverseOrderPointsSafely(orderId, reason) {
    reverseOrderPoints(orderId, reason).catch((err) =>
        logger.error(`[Rewards] reversal failed for order ${orderId}: ${err.message}`)
    );
}
