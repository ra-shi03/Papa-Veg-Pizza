import express from 'express';
import {
    getPaymentHistoryController,
    getOrderTransactionsController,
    getUserWalletBalanceController,
    getUserWalletTransactionsController,
    getStoreWalletController,
    getDeliveryWalletController,
    getAdminWalletController,
    getAdminFinanceSummaryController,
    listSettlementsController,
    createSettlementController,
    processSettlementController,
    listRefundsController,
    getRefundsByOrderController
} from './payment.controller.js';
import { requireSuperAdmin } from '../auth/auth.middleware.js';
import { requireRoles } from '../roles/role.middleware.js';
import { scopeIfAdmin } from '../../modules/food/shared/franchiseScope.js';

const router = express.Router();

// authMiddleware is applied where this router is mounted; each group below adds its role gate.

// ─── Payment history for an order (user sees their payment trail) ───
router.get('/orders/:orderId/payments', requireRoles('USER', 'ADMIN'), scopeIfAdmin, getPaymentHistoryController);
router.get('/orders/:orderId/transactions', requireRoles('USER', 'ADMIN'), scopeIfAdmin, getOrderTransactionsController);
router.get('/orders/:orderId/refunds', requireRoles('USER', 'ADMIN'), scopeIfAdmin, getRefundsByOrderController);

// ─── User wallet (new transaction-based endpoints) ───
router.get('/wallet/balance', requireRoles('USER'), getUserWalletBalanceController);
router.get('/wallet/transactions', requireRoles('USER'), getUserWalletTransactionsController);

// ─── Store wallet ───
router.get('/store/:storeId/wallet', requireRoles('STORE-MANAGER', 'ADMIN'), scopeIfAdmin, getStoreWalletController);

// ─── Delivery partner wallet ───
router.get('/delivery/:deliveryPartnerId/wallet', requireRoles('DELIVERY_PARTNER', 'SUPERADMIN', 'SUPER_ADMIN'), getDeliveryWalletController);

// ─── Admin / Finance (super admin only) ───
router.use('/admin', requireSuperAdmin);
router.get('/admin/wallet', getAdminWalletController);
router.get('/admin/finance/summary', getAdminFinanceSummaryController);
router.get('/admin/settlements', listSettlementsController);
router.post('/admin/settlements', createSettlementController);
router.post('/admin/settlements/:id/process', processSettlementController);
router.get('/admin/refunds', listRefundsController);

export default router;
