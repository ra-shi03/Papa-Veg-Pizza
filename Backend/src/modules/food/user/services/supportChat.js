import { getIO, rooms } from '../../../../config/socket.js';

// The order chat is the complaint ticket's conversation, delivered live: a message goes to the customer's own room and
// to the order's store room (the store manager's screens), never anywhere else.
export function emitSupportMessage(ticket, message) {
    const io = getIO();
    if (!io || !ticket) return;
    const payload = {
        ticketId: String(ticket._id),
        orderId: ticket.orderId ? String(ticket.orderId) : '',
        message: { message: message.message, byRole: message.byRole, at: message.at },
        status: ticket.status,
    };
    io.to(rooms.user(ticket.userId)).emit('support_message', payload);
    if (ticket.storeId) io.to(rooms.store(ticket.storeId)).emit('support_message', payload);
}

export const MAX_CUSTOMER_MESSAGES = 50;
export const REPORT_WINDOW_MS = 24 * 60 * 60 * 1000; // a delivered order can be reported for 24 hours
export const MAX_TICKETS_PER_ORDER = 3;
