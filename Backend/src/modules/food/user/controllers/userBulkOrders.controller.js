import { sendResponse } from '../../../../utils/response.js';
import { listMine, getMine, cancelMine } from '../../orders/services/bulkOrderFlow.service.js';

// The signed-in customer's own bulk orders (from the verified token, never an id in the body).
export const listMyBulkOrders = async (req, res, next) => {
    try {
        return sendResponse(res, 200, 'Bulk orders', { orders: await listMine(req.user?.userId) });
    } catch (err) {
        next(err);
    }
};

export const getMyBulkOrder = async (req, res, next) => {
    try {
        return sendResponse(res, 200, 'Bulk order', { order: await getMine(req.user?.userId, req.params.id) });
    } catch (err) {
        next(err);
    }
};

export const cancelMyBulkOrder = async (req, res, next) => {
    try {
        return sendResponse(res, 200, 'Bulk order cancelled', { order: await cancelMine(req.user?.userId, req.params.id) });
    } catch (err) {
        next(err);
    }
};
