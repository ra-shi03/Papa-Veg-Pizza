import { sendResponse } from '../../../../utils/response.js';
import { listMine, getMine, cancelMine, startOnlinePayment } from '../../orders/services/bulkOrderFlow.service.js';

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

// Pay online for a confirmed bulk order: returns the Razorpay order to open; the app then calls the usual verify-payment
// with `orderMongoId` and the Razorpay answer.
export const payMyBulkOrder = async (req, res, next) => {
    try {
        return sendResponse(res, 200, 'Payment started', await startOnlinePayment(req.user?.userId, req.params.id));
    } catch (err) {
        next(err);
    }
};
