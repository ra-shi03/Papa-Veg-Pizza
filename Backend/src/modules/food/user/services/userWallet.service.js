import mongoose from 'mongoose';
import { ValidationError } from '../../../../core/auth/errors.js';
import {
    createRazorpayOrder,
    getRazorpayInstance,
    getRazorpayKeyId,
    isRazorpayConfigured,
    verifyPaymentSignature
} from '../../orders/helpers/razorpay.helper.js';
import {
    creditWallet,
    getReferralEarningsPaise,
    getWalletSummary,
    listWalletTransactions,
    paiseToRupees,
    rupeesToPaise
} from './walletLedger.service.js';
import { enrollMember, getRewardsSummary, quitMember } from './rewards.service.js';

/**
 * Customer wallet + rewards facade used by the /food/user/wallet routes.
 * Money lives in walletAccounts/walletTransactions (walletLedger.service), points in
 * rewardMemberships/rewardLedger (rewards.service). The legacy food_user_wallets document is no
 * longer read or written.
 */

const assertUserId = (userId) => {
    const id = String(userId || '');
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        throw new ValidationError('User not found');
    }
    return id;
};

/** Legacy type names still understood by older clients. */
const legacyType = (tx) => {
    if (tx.type === 'DEBIT') return 'deduction';
    return tx.reason === 'ORDER_REFUND' ? 'refund' : 'addition';
};

/**
 * Backward-compatible GET /food/user/wallet payload: refund balance + rewards enrolment/points.
 * The wallet balance and the points balance are reported separately and never mixed.
 */
export const getUserWallet = async (userId) => {
    const id = assertUserId(userId);
    const [wallet, rewards, history, referralPaise] = await Promise.all([
        getWalletSummary(id),
        getRewardsSummary(id),
        listWalletTransactions(id, { page: 1, limit: 50 }),
        getReferralEarningsPaise(id)
    ]);

    return {
        balance: wallet.balance,
        availableBalancePaise: wallet.availableBalancePaise,
        reservedBalance: wallet.reservedBalance,
        currency: wallet.currency,
        status: wallet.status,
        referralEarnings: paiseToRupees(referralPaise),
        isEnrolled: rewards.isEnrolled,
        enrolledAt: rewards.enrolledAt,
        points: rewards.points,
        rewards,
        transactions: history.transactions.map((tx) => ({
            ...tx,
            _id: tx.id,
            legacyType: legacyType(tx),
            date: tx.createdAt
        }))
    };
};

export const enrollUserInRewards = async (userId) => {
    await enrollMember(assertUserId(userId));
    return getUserWallet(userId);
};

export const quitUserRewards = async (userId) => {
    await quitMember(assertUserId(userId));
    return getUserWallet(userId);
};

/**
 * Credit a referral reward. Trusted server-side callers only.
 * @param {string} referralKey unique per referral event (e.g. the referral log id) — makes the credit idempotent.
 */
export const creditReferralReward = async (userId, amountInr, metadata = {}, referralKey) => {
    const id = assertUserId(userId);
    const amountPaise = rupeesToPaise(amountInr);
    if (!Number.isInteger(amountPaise) || amountPaise <= 0) {
        return { wallet: await getUserWallet(id) };
    }
    const key = referralKey || metadata?.referralLogId || metadata?.referralId;
    if (!key) throw new ValidationError('referralKey is required to credit a referral reward');

    await creditWallet({
        userId: id,
        amountPaise,
        reason: 'REFERRAL_REWARD',
        idempotencyKey: `referral:${key}:wallet-credit`,
        description: 'Referral reward',
        metadata: { source: 'referral_reward', ...(metadata || {}) }
    });
    return { wallet: await getUserWallet(id) };
};

export const createWalletTopupOrder = async (userId, amountInr) => {
    assertUserId(userId);
    const amount = Number(amountInr);
    if (!Number.isFinite(amount) || amount <= 0) {
        throw new ValidationError('Amount must be greater than 0');
    }
    if (amount > 50000) {
        throw new ValidationError('Maximum amount is 50,000');
    }

    const amountPaise = Math.round(amount * 100);

    if (!isRazorpayConfigured()) {
        // Dev fallback: return a compatible shape without writing to DB.
        const orderId = `order_dev_${Date.now()}`;
        return {
            razorpay: {
                key: getRazorpayKeyId() || 'rzp_test_dummy',
                orderId,
                amount: amountPaise,
                currency: 'INR'
            }
        };
    }

    const receipt = `wallet_topup_${String(userId).slice(-8)}_${Date.now()}`;
    const order = await createRazorpayOrder(amountPaise, 'INR', receipt);

    return {
        razorpay: {
            key: getRazorpayKeyId(),
            orderId: String(order.id),
            amount: Number(order.amount) || amountPaise,
            currency: order.currency || 'INR'
        }
    };
};

/**
 * Credit a verified top-up. The credited amount is taken from the gateway order, never from the
 * client body, and the Razorpay order id is the idempotency key (one credit per payment).
 */
export const verifyWalletTopupPayment = async (userId, payload) => {
    const id = assertUserId(userId);
    const orderId = String(payload?.razorpayOrderId || '').trim();
    const paymentId = String(payload?.razorpayPaymentId || '').trim();
    const signature = String(payload?.razorpaySignature || '').trim();

    if (!orderId) throw new ValidationError('razorpayOrderId is required');
    if (!paymentId) throw new ValidationError('razorpayPaymentId is required');
    if (!signature) throw new ValidationError('razorpaySignature is required');

    let amountPaise;
    if (isRazorpayConfigured()) {
        if (!verifyPaymentSignature(orderId, paymentId, signature)) {
            throw new ValidationError('Payment verification failed');
        }
        const gatewayOrder = await getRazorpayInstance().orders.fetch(orderId);
        if (!String(gatewayOrder?.receipt || '').startsWith(`wallet_topup_${id.slice(-8)}_`)) {
            throw new ValidationError('Payment does not belong to this wallet');
        }
        amountPaise = Number(gatewayOrder?.amount_paid) || 0;
    } else {
        // Dev only: no gateway to verify against.
        amountPaise = rupeesToPaise(payload?.amount);
    }
    if (!Number.isInteger(amountPaise) || amountPaise <= 0) {
        throw new ValidationError('Payment amount not received');
    }

    await creditWallet({
        userId: id,
        amountPaise,
        reason: 'TOPUP',
        idempotencyKey: `topup:${orderId}:wallet-credit`,
        description: isRazorpayConfigured() ? 'Wallet top-up' : 'Wallet top-up (dev)',
        providerRef: paymentId,
        metadata: { source: 'wallet_topup', mode: isRazorpayConfigured() ? 'razorpay' : 'dev', razorpayOrderId: orderId }
    });

    return { wallet: await getUserWallet(id) };
};
