import mongoose from 'mongoose';
import { FoodSupportTicket } from '../models/supportTicket.model.js';
import { sendResponse, sendError } from '../../../../utils/response.js';
import { emitSupportMessage, MAX_CUSTOMER_MESSAGES, REPORT_WINDOW_MS, MAX_TICKETS_PER_ORDER } from '../services/supportChat.js';
import { cleanProofImages } from '../services/complaintProof.js';

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
            description,
            // Proof photos (order complaints): only our own uploads are kept
            images: type === 'order' ? cleanProofImages(body.images) : []
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
            const order = await FoodOrder.findOne({ _id: orderMongoId, userId: doc.userId }).select('storeId orderStatus updatedAt deliveryState').lean();
            if (!order) return sendError(res, 404, 'Order not found');
            // How a pizza app handles "something is wrong with my order":
            //  - a cancelled order has nothing to report (a prepaid cancellation is refunded automatically);
            //  - a delivered order can be reported for 24 hours after delivery;
            //  - an order still on its way can be reported too (late, wrong address, ...);
            //  - one open report per order, and at most three in all, so the store is not flooded.
            if (String(order.orderStatus).startsWith('cancelled')) return sendError(res, 400, 'This order was cancelled, so there is nothing to report.');
            if (order.orderStatus === 'delivered') {
                const deliveredAt = new Date(order.deliveryState?.deliveredAt || order.updatedAt || Date.now()).getTime();
                if (Date.now() - deliveredAt > REPORT_WINDOW_MS) return sendError(res, 400, 'Problems can be reported within 24 hours of delivery. Please contact support.');
            }
            const earlier = await FoodSupportTicket.find({ userId: doc.userId, orderId: orderMongoId, type: 'order' }).select('status').lean();
            const open = earlier.find((t) => t.status !== 'resolved');
            if (open) return res.status(409).json({ success: false, message: 'You already have an open report for this order. Continue it in the chat.', data: { ticketId: String(open._id) } });
            if (earlier.length >= MAX_TICKETS_PER_ORDER) return sendError(res, 400, 'This order has reached the limit of reports. Please contact support.');
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
        if (type === 'order' && description) {
            // The first message of the chat is the problem as the customer described it
            emitSupportMessage(created, { message: description, byRole: 'Customer', at: created.createdAt });
        }
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
    images: t.images || [],
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
        const filter = { userId: new mongoose.Types.ObjectId(userId) };
        if (req.query?.orderId && mongoose.Types.ObjectId.isValid(String(req.query.orderId))) filter.orderId = new mongoose.Types.ObjectId(String(req.query.orderId));
        const [tickets, total] = await Promise.all([
            FoodSupportTicket.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            FoodSupportTicket.countDocuments(filter)
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

/** POST /food/user/support/ticket/:ticketId/messages { message } : the customer writes in the chat of their own report. */
export async function addCustomerMessageController(req, res, next) {
    try {
        const { ticketId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(ticketId)) return sendError(res, 404, 'Report not found');
        const message = String(req.body?.message || '').trim().slice(0, 1000);
        if (!message) return sendError(res, 400, 'Write a message first');
        // Only the owner's own ticket: anyone else's is 404
        const ticket = await FoodSupportTicket.findOne({ _id: ticketId, userId: new mongoose.Types.ObjectId(req.user.userId) });
        if (!ticket) return sendError(res, 404, 'Report not found');
        if (ticket.status === 'resolved') return sendError(res, 409, 'This report is resolved. Report a new problem if you still need help.');
        const fromCustomer = (ticket.responses || []).filter((r) => r.byRole === 'Customer').length;
        if (fromCustomer >= MAX_CUSTOMER_MESSAGES) return sendError(res, 429, 'Message limit reached for this report.');
        const entry = { message, byName: 'Customer', byRole: 'Customer', at: new Date() };
        ticket.responses.push(entry);
        await ticket.save();
        emitSupportMessage(ticket, entry);
        return sendResponse(res, 201, 'Message sent', { message: { message: entry.message, byRole: entry.byRole, at: entry.at } });
    } catch (e) {
        next(e);
    }
}
