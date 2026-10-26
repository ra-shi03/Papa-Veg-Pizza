import { sendResponse } from '../../utils/response.js';
import { getPaymentsByOrder } from './payment.service.js';
import { getTransactionsByOrder } from './transaction.service.js';
import { getWalletBalance, getWalletWithTransactions } from './wallet.service.js';
import { getWalletSummary, listWalletTransactions } from '../../modules/food/user/services/walletLedger.service.js';
import { getRefundsByOrder, listRefunds } from './refund.service.js';
import { createSettlement, processSettlement, listSettlements } from './settlement.service.js';
import { logger } from '../../utils/logger.js';
import mongoose from 'mongoose';
import { FoodOrder } from '../../modules/food/orders/models/order.model.js';
import { NotFoundError } from '../auth/errors.js';
import { assertStoreInScope, scopedStoreIds } from '../../modules/food/shared/franchiseScope.js';

const roleOf = (req) => String(req.user?.role || '').trim().replace(/_/g, '-').toUpperCase();

// Records outside the caller's reach answer 404, so their existence is not revealed.
// An order is reachable by the customer who placed it, or by an admin whose scope (set by
// scopeIfAdmin on the route) includes the order's store. Super admin: any order.
const assertOrderAccess = async (req, orderId) => {
    if (!mongoose.isValidObjectId(orderId)) throw new NotFoundError('Order not found');
    const order = await FoodOrder.findById(orderId).select('userId storeId').lean();
    if (!order) throw new NotFoundError('Order not found');
    if (roleOf(req) === 'USER' || roleOf(req) === 'CUSTOMER') {
        if (String(order.userId) !== String(req.user.userId)) throw new NotFoundError('Order not found');
        return;
    }
    const storeIds = await scopedStoreIds(req);
    if (storeIds && !storeIds.some((id) => String(id) === String(order.storeId))) throw new NotFoundError('Order not found');
};

// ─── User Endpoints ───

export const getPaymentHistoryController = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        await assertOrderAccess(req, orderId);
        const payments = await getPaymentsByOrder(orderId);
        return sendResponse(res, 200, 'Payment history fetched', { payments });
    } catch (err) {
        next(err);
    }
};

export const getOrderTransactionsController = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        await assertOrderAccess(req, orderId);
        const transactions = await getTransactionsByOrder(orderId);
        return sendResponse(res, 200, 'Transactions fetched', { transactions });
    } catch (err) {
        next(err);
    }
};

export const getUserWalletBalanceController = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const data = await getWalletSummary(userId);
        return sendResponse(res, 200, 'Balance fetched', data);
    } catch (err) {
        next(err);
    }
};

export const getUserWalletTransactionsController = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const data = await listWalletTransactions(userId, { page, limit });
        return sendResponse(res, 200, 'Wallet transactions fetched', data);
    } catch (err) {
        next(err);
    }
};

// ─── Store Endpoints ───

export const getStoreWalletController = async (req, res, next) => {
    try {
        // A store manager can only open its own store's wallet; an admin only a store in its franchise
        let storeId;
        if (roleOf(req) === 'STORE-MANAGER') {
            storeId = req.user.storeId;
            if (!storeId || String(req.params.storeId) !== String(storeId)) throw new NotFoundError('Store not found');
        } else {
            storeId = (await assertStoreInScope(req, req.params.storeId))._id;
        }
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const data = await getWalletWithTransactions('store', storeId, { page, limit });
        return sendResponse(res, 200, 'Store wallet fetched', data);
    } catch (err) {
        next(err);
    }
};

// ─── Delivery Partner Endpoints ───

export const getDeliveryWalletController = async (req, res, next) => {
    try {
        // A delivery partner can only open its own wallet (its id is the token's userId); super admin any
        const deliveryPartnerId = roleOf(req) === 'DELIVERY-PARTNER' ? req.user.userId : req.params.deliveryPartnerId;
        if (roleOf(req) === 'DELIVERY-PARTNER' && String(req.params.deliveryPartnerId) !== String(req.user.userId)) {
            throw new NotFoundError('Delivery partner not found');
        }
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const data = await getWalletWithTransactions('deliveryBoy', deliveryPartnerId, { page, limit });
        return sendResponse(res, 200, 'Delivery wallet fetched', data);
    } catch (err) {
        next(err);
    }
};

// ─── Admin Endpoints ───

export const getAdminWalletController = async (req, res, next) => {
    try {
        const data = await getWalletBalance('admin', 'platform');
        return sendResponse(res, 200, 'Admin wallet fetched', data);
    } catch (err) {
        next(err);
    }
};

export const getAdminFinanceSummaryController = async (req, res, next) => {
    try {
        const { FoodAdminWallet } = await import('../../modules/food/admin/models/adminWallet.model.js');
        const adminWallet = await FoodAdminWallet.findOne({ key: 'platform' }).lean();
        const pendingSettlements = await listSettlements({ status: 'pending', limit: 100 });
        const pendingRefunds = await listRefunds({ status: 'pending', limit: 100 });

        return sendResponse(res, 200, 'Finance summary', {
            platform: {
                balance: adminWallet?.balance || 0,
                totalRevenue: adminWallet?.totalRevenue || 0,
                totalPayouts: adminWallet?.totalPayouts || 0,
                totalRefunds: adminWallet?.totalRefunds || 0
            },
            pendingSettlements: {
                count: pendingSettlements.total,
                totalAmount: pendingSettlements.settlements.reduce((s, v) => s + (v.amount || 0), 0)
            },
            pendingRefunds: {
                count: pendingRefunds.total,
                totalAmount: pendingRefunds.refunds.reduce((s, v) => s + (v.amount || 0), 0)
            }
        });
    } catch (err) {
        next(err);
    }
};

export const listSettlementsController = async (req, res, next) => {
    try {
        const { entityType, entityId, status } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const data = await listSettlements({ entityType, entityId, status, page, limit });
        return sendResponse(res, 200, 'Settlements fetched', data);
    } catch (err) {
        next(err);
    }
};

export const createSettlementController = async (req, res, next) => {
    try {
        const { entityType, entityId, amount, notes, periodStart, periodEnd } = req.body;
        const settlement = await createSettlement({ entityType, entityId, amount, notes, periodStart, periodEnd });
        return sendResponse(res, 201, 'Settlement created', { settlement });
    } catch (err) {
        next(err);
    }
};

export const processSettlementController = async (req, res, next) => {
    try {
        const { id } = req.params;
        const adminId = req.user?.userId;
        const { payoutRef } = req.body;
        const settlement = await processSettlement(id, { processedBy: adminId, payoutRef });
        return sendResponse(res, 200, 'Settlement processed', { settlement });
    } catch (err) {
        next(err);
    }
};

export const listRefundsController = async (req, res, next) => {
    try {
        const { status } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const data = await listRefunds({ status, page, limit });
        return sendResponse(res, 200, 'Refunds fetched', data);
    } catch (err) {
        next(err);
    }
};

export const getRefundsByOrderController = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        await assertOrderAccess(req, orderId);
        const refunds = await getRefundsByOrder(orderId);
        return sendResponse(res, 200, 'Refunds fetched', { refunds });
    } catch (err) {
        next(err);
    }
};
