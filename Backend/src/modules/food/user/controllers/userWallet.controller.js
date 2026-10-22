import { sendResponse } from '../../../../utils/response.js';
import { ValidationError } from '../../../../core/auth/errors.js';
import { getUserWallet, createWalletTopupOrder, verifyWalletTopupPayment, enrollUserInRewards, quitUserRewards } from '../services/userWallet.service.js';
import {
    getWalletSummary,
    listWalletTransactions,
    getWalletTransaction,
    reserveFunds,
    releaseReservation,
    formatWalletTransaction,
    rupeesToPaise
} from '../services/walletLedger.service.js';
import { getRewardsSummary, listRewardTransactions, enrollMember, quitMember } from '../services/rewards.service.js';
import { requestRefund, getRefundForUser, listRefundsForUser } from '../../../../core/payments/refund.service.js';
import { FoodOrder } from '../../orders/models/order.model.js';
import { payOrderWithWallet } from '../../orders/services/order.service.js';
import { buildOrderIdentityFilter } from '../../orders/services/order.helpers.js';

// Every handler scopes data to req.user.userId from the verified token — never to an id in the URL/body.

export const getUserWalletController = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const wallet = await getUserWallet(userId);
        return sendResponse(res, 200, 'Wallet fetched successfully', { wallet });
    } catch (error) {
        next(error);
    }
};

export const enrollUserInRewardsController = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const wallet = await enrollUserInRewards(userId);
        return sendResponse(res, 200, 'Enrolled in rewards successfully', { wallet, isEnrolled: true });
    } catch (error) {
        next(error);
    }
};

export const quitUserRewardsController = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const wallet = await quitUserRewards(userId);
        return sendResponse(res, 200, 'Quit rewards successfully', { wallet, isEnrolled: false });
    } catch (error) {
        next(error);
    }
};

export const createWalletTopupOrderController = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const amount = req.body?.amount;
        const data = await createWalletTopupOrder(userId, amount);
        return sendResponse(res, 200, 'Top-up order created successfully', data);
    } catch (error) {
        next(error);
    }
};

export const verifyWalletTopupPaymentController = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const data = await verifyWalletTopupPayment(userId, req.body || {});
        return sendResponse(res, 200, 'Payment verified successfully', data);
    } catch (error) {
        next(error);
    }
};

// ─── Wallet (refund balance) ───

export const getMyWalletController = async (req, res, next) => {
    try {
        const wallet = await getWalletSummary(req.user?.userId);
        return sendResponse(res, 200, 'Wallet fetched successfully', { wallet });
    } catch (error) {
        next(error);
    }
};

export const listMyWalletTransactionsController = async (req, res, next) => {
    try {
        const { page, limit, type, from, to } = req.query || {};
        const data = await listWalletTransactions(req.user?.userId, { page, limit, type, from, to });
        return sendResponse(res, 200, 'Wallet transactions fetched successfully', data);
    } catch (error) {
        next(error);
    }
};

export const getMyWalletTransactionController = async (req, res, next) => {
    try {
        const transaction = await getWalletTransaction(req.user?.userId, req.params.id);
        return sendResponse(res, 200, 'Wallet transaction fetched successfully', { transaction });
    } catch (error) {
        next(error);
    }
};

/**
 * Reserve wallet funds for one of the caller's own orders that is awaiting online payment.
 * The amount is always the order total read on the server (checkout has no split payments).
 */
export const reserveWalletPaymentController = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const identity = buildOrderIdentityFilter(req.body?.orderId);
        if (!identity) throw new ValidationError('orderId is required');
        const order = await FoodOrder.findOne({ ...identity, userId }).select('pricing payment order_id orderStatus').lean();
        if (!order) throw new ValidationError('Order not found');
        if (String(order.orderStatus).startsWith('cancelled')) throw new ValidationError('Order is cancelled');
        if (String(order.payment?.status || '') !== 'created') {
            throw new ValidationError('This order is not awaiting online payment');
        }

        const totalPaise = rupeesToPaise(order.pricing?.total || 0);
        if (!Number.isInteger(totalPaise) || totalPaise <= 0) throw new ValidationError('Invalid order amount');

        const { transaction } = await reserveFunds({
            userId,
            amountPaise: totalPaise,
            idempotencyKey: `order:${order._id}:wallet-payment`,
            orderId: order._id,
            orderRef: order.order_id || ''
        });
        return sendResponse(res, 200, 'Wallet funds reserved', { transaction: formatWalletTransaction(transaction) });
    } catch (error) {
        next(error);
    }
};

export const confirmWalletPaymentController = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const data = await payOrderWithWallet(userId, req.params.id);
        const transaction = await getWalletTransaction(userId, req.params.id);
        return sendResponse(res, 200, 'Wallet payment confirmed', { transaction, ...data });
    } catch (error) {
        next(error);
    }
};

export const releaseWalletPaymentController = async (req, res, next) => {
    try {
        const { transaction } = await releaseReservation({
            userId: req.user?.userId,
            transactionId: req.params.id,
            note: 'Released by customer checkout'
        });
        return sendResponse(res, 200, 'Wallet funds released', { transaction: formatWalletTransaction(transaction) });
    } catch (error) {
        next(error);
    }
};

// ─── Cheesy Rewards (points) ───

export const getMyRewardsController = async (req, res, next) => {
    try {
        const rewards = await getRewardsSummary(req.user?.userId);
        return sendResponse(res, 200, 'Rewards fetched successfully', { rewards });
    } catch (error) {
        next(error);
    }
};

export const listMyRewardTransactionsController = async (req, res, next) => {
    try {
        const { page, limit } = req.query || {};
        const data = await listRewardTransactions(req.user?.userId, { page, limit });
        return sendResponse(res, 200, 'Reward transactions fetched successfully', data);
    } catch (error) {
        next(error);
    }
};

export const enrollRewardsController = async (req, res, next) => {
    try {
        const rewards = await enrollMember(req.user?.userId);
        return sendResponse(res, 200, 'Enrolled in rewards successfully', { rewards });
    } catch (error) {
        next(error);
    }
};

export const quitRewardsController = async (req, res, next) => {
    try {
        const rewards = await quitMember(req.user?.userId);
        return sendResponse(res, 200, 'Quit rewards successfully', { rewards });
    } catch (error) {
        next(error);
    }
};

// ─── Refunds ───

export const requestRefundController = async (req, res, next) => {
    try {
        const { orderId, reason, destination, amount } = req.body || {};
        const refund = await requestRefund({ userId: req.user?.userId, orderId, reason, destination, amount });
        return sendResponse(res, 201, 'Refund request submitted', { refund });
    } catch (error) {
        next(error);
    }
};

export const listMyRefundsController = async (req, res, next) => {
    try {
        const { page, limit } = req.query || {};
        const data = await listRefundsForUser(req.user?.userId, { page, limit });
        return sendResponse(res, 200, 'Refunds fetched successfully', data);
    } catch (error) {
        next(error);
    }
};

export const getMyRefundController = async (req, res, next) => {
    try {
        const refund = await getRefundForUser(req.user?.userId, req.params.id);
        return sendResponse(res, 200, 'Refund fetched successfully', { refund });
    } catch (error) {
        next(error);
    }
};
