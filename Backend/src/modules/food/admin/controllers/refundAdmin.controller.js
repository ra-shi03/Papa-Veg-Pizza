import { sendResponse } from '../../../../utils/response.js';
import { approveRefund, rejectRefund, listRefunds } from '../../../../core/payments/refund.service.js';

import { refundsWithContext } from '../services/superAdminDesk.service.js';

// Trusted refund workflow — mounted under /v1/food/admin (authMiddleware + requireRoles('ADMIN')).

export const listRefundsAdminController = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = Math.min(100, parseInt(req.query.limit, 10) || 20);
        const data = await listRefunds({ status: req.query.status, page, limit });
        // the screen also shows the order, the customer and the payment of each refund
        return sendResponse(res, 200, 'Refunds fetched successfully', { ...data, refunds: await refundsWithContext(data.refunds) });
    } catch (error) {
        next(error);
    }
};

export const approveRefundAdminController = async (req, res, next) => {
    try {
        const refund = await approveRefund(req.params.id, { adminId: req.user?.userId });
        return sendResponse(res, 200, 'Refund processed successfully', { refund });
    } catch (error) {
        next(error);
    }
};

export const rejectRefundAdminController = async (req, res, next) => {
    try {
        const refund = await rejectRefund(req.params.id, { adminId: req.user?.userId, reason: req.body?.reason });
        return sendResponse(res, 200, 'Refund rejected', { refund });
    } catch (error) {
        next(error);
    }
};
