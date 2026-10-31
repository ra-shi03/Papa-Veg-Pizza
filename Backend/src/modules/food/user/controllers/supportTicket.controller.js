import mongoose from 'mongoose';
import { FoodSupportTicket } from '../models/supportTicket.model.js';
import { sendResponse, sendError } from '../../../../utils/response.js';

export async function createSupportTicketController(req, res, next) {
    try {
        const userId = req.user?.userId;
        const body = req.body || {};
        const type = String(body.type || '').trim();
        const issueType = String(body.issueType || '').trim().slice(0, 100);
        const description = String(body.description || '').trim().slice(0, 2000);
        if (!['order', 'store', 'other'].includes(type)) {
            return sendError(res, 400, 'Invalid ticket type');
        }
        if (!issueType) return sendError(res, 400, 'issueType required');
        const doc = {
            userId: new mongoose.Types.ObjectId(userId),
            type,
            issueType,
            description
        };
        if (type === 'order') {
            if (!body.orderId || !mongoose.Types.ObjectId.isValid(body.orderId)) {
                return sendError(res, 400, 'orderId required');
            }
            const orderMongoId = new mongoose.Types.ObjectId(body.orderId);
            doc.orderId = orderMongoId;
            // Also try to link storeId automatically if possible
            // A customer complains only about their own order
            const { FoodOrder } = await import('../../../food/orders/models/order.model.js');
            const order = await FoodOrder.findOne({ _id: orderMongoId, userId: doc.userId }).select('storeId').lean();
            if (!order) return sendError(res, 404, 'Order not found');
            if (order.storeId) {
                doc.storeId = order.storeId;
            }
        }
        if (type === 'store') {
            if (!body.storeId || !mongoose.Types.ObjectId.isValid(body.storeId)) {
                return sendError(res, 400, 'storeId required');
            }
            doc.storeId = new mongoose.Types.ObjectId(body.storeId);
        }
        const created = await FoodSupportTicket.create(doc);
        return sendResponse(res, 201, 'Ticket created', { ticket: created.toObject() });
    } catch (e) {
        next(e);
    }
}

// What the customer sees of a ticket: the replies and the outcome, not the store's internal fields.
const toCustomerTicket = (t, orderNumbers, storeNames) => ({
    _id: String(t._id),
    type: t.type,
    orderId: t.orderId ? String(t.orderId) : '',
    orderNumber: orderNumbers.get(String(t.orderId)) || '',
    storeName: storeNames.get(String(t.storeId)) || '',
    issueType: t.issueType,
    description: t.description,
    status: t.status,
    adminResponse: t.adminResponse || '',
    responses: (t.responses || []).map((r) => ({ message: r.message, byRole: r.byRole, at: r.at })),
    resolution: t.resolution?.resolvedAt
        ? {
            actionTaken: t.resolution.actionTaken || '',
            refundAmount: t.resolution.refundAmount || 0,
            replacementOrderId: t.resolution.replacementOrderId || '',
            couponIssued: t.resolution.couponIssued || '',
            resolvedAt: t.resolution.resolvedAt
        }
        : null,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt
});

export async function listMySupportTicketsController(req, res, next) {
    try {
        const userId = req.user?.userId;
        const limit = Math.min(Math.max(parseInt(req.query?.limit, 10) || 20, 1), 50);
        const page = Math.max(parseInt(req.query?.page, 10) || 1, 1);
        const skip = (page - 1) * limit;
        const [tickets, total] = await Promise.all([
            FoodSupportTicket.find({ userId: new mongoose.Types.ObjectId(userId) })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            FoodSupportTicket.countDocuments({ userId: new mongoose.Types.ObjectId(userId) })
        ]);
        const { FoodOrder } = await import('../../../food/orders/models/order.model.js');
        const { FoodStore } = await import('../../store/models/store.model.js');
        const [orders, stores] = await Promise.all([
            FoodOrder.find({ _id: { $in: tickets.map((t) => t.orderId).filter(Boolean) } }).select('order_id').lean(),
            FoodStore.find({ _id: { $in: tickets.map((t) => t.storeId).filter(Boolean) } }).select('storeName').lean()
        ]);
        const orderNumbers = new Map(orders.map((o) => [String(o._id), o.order_id]));
        const storeNames = new Map(stores.map((s) => [String(s._id), s.storeName]));
        return sendResponse(res, 200, 'Tickets fetched', {
            tickets: tickets.map((t) => toCustomerTicket(t, orderNumbers, storeNames)),
            total,
            page,
            limit
        });
    } catch (e) {
        next(e);
    }
}
