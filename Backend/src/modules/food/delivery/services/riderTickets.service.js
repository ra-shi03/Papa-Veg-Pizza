import mongoose from 'mongoose';
import { DeliverySupportTicket } from '../models/supportTicket.model.js';
import { FoodDeliveryPartner } from '../models/deliveryPartner.model.js';
import { FoodOrder } from '../../orders/models/order.model.js';
import { FoodStore } from '../../store/models/store.model.js';
import { ForbiddenError, NotFoundError, ValidationError } from '../../../../core/auth/errors.js';
import { notifyOwnersSafely } from '../../../../core/notifications/firebase.service.js';
import { createInboxNotifications } from '../../../../core/notifications/notification.service.js';
import { logger } from '../../../../utils/logger.js';

// Tickets riders raise in the delivery app, handled by the people who run the rider:
//   store manager   -> tickets of riders working for its own store
//   franchise admin -> tickets of riders working for any store of its franchise
//   super admin     -> every ticket (its own desk, admin.service.js)
// A ticket is stamped with the rider's store and franchise when it is raised (rider.storeId / franchiseId, else the store of the
// rider's latest order). Older, unstamped tickets are matched through the rider's own store / franchise.
// Both desks can reply and move the status; a ticket the franchise admin closed stays closed for the store manager.

const STATUSES = ['open', 'in_progress', 'resolved', 'closed'];
const isId = (v) => mongoose.Types.ObjectId.isValid(String(v || '')) && /^[a-f0-9]{24}$/i.test(String(v));
const oid = (v) => new mongoose.Types.ObjectId(String(v));

/** Where a new ticket belongs: the rider's own store / franchise, else where they last delivered. */
export async function routeForRider(riderId) {
  const rider = await FoodDeliveryPartner.findById(riderId).select('storeId franchiseId').lean();
  let storeId = rider?.storeId || null;
  let franchiseId = rider?.franchiseId || null;
  if (!storeId) {
    const last = await FoodOrder.findOne({ 'dispatch.deliveryPartnerId': oid(riderId) }).sort({ createdAt: -1 }).select('storeId franchiseId').lean();
    storeId = last?.storeId || null;
    franchiseId = franchiseId || last?.franchiseId || null;
  }
  if (storeId && !franchiseId) franchiseId = (await FoodStore.findById(storeId).select('franchiseId').lean())?.franchiseId || null;
  return { storeId, franchiseId };
}

/**
 * The riders a desk answers for when a ticket carries no store / franchise stamp (older tickets, or a rider with no orders yet):
 * the same riders the store sees in its own list (its own, plus those of its franchise or the shared fleet near it), and for a
 * franchise admin the riders in its scope (claimed by it, or unclaimed and near one of its stores).
 */
async function ridersOf(scope) {
  if (scope.storeId) {
    const { riderScope } = await import('../../store/services/storeDelivery.service.js');
    const store = await FoodStore.findById(oid(scope.storeId)).select('_id franchiseId latitude longitude city state zoneId').lean();
    if (!store) return [];
    const { filter } = await riderScope(store);
    return (await FoodDeliveryPartner.find(filter).select('_id').limit(2000).lean()).map((r) => r._id);
  }
  const { franchiseRiderFilter } = await import('../../admin/services/franchiseRiders.service.js');
  const filter = await franchiseRiderFilter(oid(scope.franchiseId), { statuses: ['pending', 'approved', 'suspended', 'rejected'] });
  return (await FoodDeliveryPartner.find(filter).select('_id').limit(2000).lean()).map((r) => r._id);
}

async function scopeFilter(scope) {
  if (scope.all) return {};
  if (!scope.storeId && !scope.franchiseId) throw new ForbiddenError('No store or franchise is linked to your account.');
  const riderIds = await ridersOf(scope);
  const stamp = scope.storeId ? { storeId: oid(scope.storeId) } : { franchiseId: oid(scope.franchiseId) };
  const unstamped = scope.storeId ? { storeId: null } : { franchiseId: null };
  return { $or: [stamp, { ...unstamped, deliveryPartnerId: { $in: riderIds } }] };
}

const shape = (t, withRider = true) => ({
  _id: t._id,
  ticketId: t.ticketId,
  subject: t.subject,
  description: t.description,
  category: t.category,
  priority: t.priority,
  status: t.status,
  adminResponse: t.adminResponse || '',
  respondedAt: t.respondedAt || null,
  handledBy: t.handledBy?.role ? t.handledBy : null,
  activity: (t.activity || []).map((a) => ({ at: a.at, byRole: a.byRole, byName: a.byName || '', status: a.status || '', note: a.note || '' })),
  createdAt: t.createdAt,
  updatedAt: t.updatedAt,
  storeName: t.storeId?.storeName || '',
  deliveryPartner: withRider && t.deliveryPartnerId
    ? { _id: t.deliveryPartnerId._id, name: t.deliveryPartnerId.name || '', phone: t.deliveryPartnerId.phone || '', vehicleType: t.deliveryPartnerId.vehicleType || '' }
    : null,
});

export async function listRiderTickets(scope, query = {}) {
  const and = [await scopeFilter(scope)];
  if (STATUSES.includes(String(query.status))) and.push({ status: String(query.status) });
  if (['low', 'medium', 'high', 'urgent'].includes(String(query.priority))) and.push({ priority: String(query.priority) });
  if (isId(query.storeId) && !scope.storeId) and.push({ storeId: oid(query.storeId) });
  const term = String(query.search || '').trim();
  if (term) {
    const esc = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    and.push({ $or: [{ subject: { $regex: esc, $options: 'i' } }, { description: { $regex: esc, $options: 'i' } }, { ticketId: { $regex: esc, $options: 'i' } }] });
  }
  const limit = Math.max(1, Math.min(200, Number(query.limit) || 100));
  const filter = { $and: and };
  const [list, total, counts] = await Promise.all([
    DeliverySupportTicket.find(filter).populate('deliveryPartnerId', 'name phone vehicleType').populate('storeId', 'storeName').sort({ createdAt: -1 }).limit(limit).lean(),
    DeliverySupportTicket.countDocuments(filter),
    DeliverySupportTicket.aggregate([{ $match: { $and: [await scopeFilter(scope)] } }, { $group: { _id: '$status', n: { $sum: 1 } } }]),
  ]);
  const by = Object.fromEntries(counts.map((c) => [c._id, c.n]));
  return {
    tickets: list.map((t) => shape(t)),
    total,
    stats: { open: by.open || 0, in_progress: by.in_progress || 0, resolved: by.resolved || 0, closed: by.closed || 0 },
  };
}

async function findInScope(scope, id) {
  if (!isId(id)) throw new NotFoundError('Ticket not found');
  const t = await DeliverySupportTicket.findOne({ $and: [{ _id: oid(id) }, await scopeFilter(scope)] });
  if (!t) throw new NotFoundError('Ticket not found');
  return t;
}

export async function getRiderTicket(scope, id) {
  await findInScope(scope, id);
  const t = await DeliverySupportTicket.findById(id).populate('deliveryPartnerId', 'name phone vehicleType').populate('storeId', 'storeName').lean();
  return shape(t);
}

const WHO = { STORE_MANAGER: 'Store', FRANCHISE_ADMIN: 'Franchise', SUPER_ADMIN: 'Support' };
const STATUS_TEXT = { open: 'reopened', in_progress: 'being worked on', resolved: 'resolved', closed: 'closed' };

/**
 * Tells the rider their ticket was answered or moved: a push to their phone and an entry in the delivery app's
 * Notifications, both opening the ticket. Never throws (a failed notification must not undo the reply).
 */
export async function notifyRiderOfTicketUpdate(ticket, { role, reply = '', statusChanged = false } = {}) {
  try {
    if (!ticket?.deliveryPartnerId || (!reply && !statusChanged)) return;
    const riderId = String(ticket.deliveryPartnerId?._id || ticket.deliveryPartnerId);
    const who = WHO[role] || 'Support';
    const ref = ticket.ticketId ? `#${ticket.ticketId}` : `"${String(ticket.subject || '').slice(0, 40)}"`;
    const title = reply ? `${who} replied to your ticket ${ref}` : `Your ticket ${ref} is ${STATUS_TEXT[ticket.status] || ticket.status}`;
    const message = reply ? reply.slice(0, 180) : `${who} marked it ${STATUS_TEXT[ticket.status] || ticket.status}.`;
    const link = `/food/delivery/help/tickets/${ticket._id}`;
    await Promise.all([
      notifyOwnersSafely([{ ownerType: 'DELIVERY_PARTNER', ownerId: riderId }], {
        title,
        body: message,
        data: { type: 'support_ticket_update', ticketId: String(ticket._id), status: String(ticket.status), link, targetUrl: link },
      }),
      createInboxNotifications({
        notifications: [{ ownerType: 'DELIVERY_PARTNER', ownerId: riderId, title, message, link, category: 'support_ticket', metadata: { ticketId: String(ticket._id), status: String(ticket.status) } }],
      }),
    ]);
  } catch (err) {
    logger.warn(`Rider ticket notification failed: ${err.message}`);
  }
}

/** Reply to the rider and / or move the status. `actor` = { role: 'STORE_MANAGER' | 'FRANCHISE_ADMIN' | 'SUPER_ADMIN', userId, name }. */
export async function updateRiderTicket(scope, actor, id, body = {}) {
  const t = await findInScope(scope, id);
  const reply = typeof body.adminResponse === 'string' ? body.adminResponse.trim().slice(0, 1000) : undefined;
  const status = body.status === undefined ? undefined : String(body.status);
  if (status !== undefined && !STATUSES.includes(status)) throw new ValidationError('Status must be open, in_progress, resolved or closed.');
  if (reply === undefined && status === undefined) throw new ValidationError('Send a reply or a new status.');
  // a ticket the franchise admin (or super admin) closed is theirs to reopen
  if (t.status === 'closed' && actor.role === 'STORE_MANAGER') throw Object.assign(new ValidationError('This ticket was closed by the franchise. Ask the franchise admin to reopen it.'), { statusCode: 409 });
  if (status === 'closed' && actor.role === 'STORE_MANAGER') throw new ForbiddenError('Only the franchise admin can close a ticket. Mark it resolved instead.');
  if (reply === '' && status === undefined) throw new ValidationError('Write a reply first.');

  const now = new Date();
  const statusBefore = t.status;
  if (reply) { t.adminResponse = reply; t.respondedAt = now; }
  if (status !== undefined) t.status = status;
  else if (reply && t.status === 'open') t.status = 'in_progress';
  t.handledBy = { role: actor.role, userId: isId(actor.userId) ? oid(actor.userId) : null, name: actor.name || '', at: now };
  t.activity.push({ at: now, byRole: actor.role, byName: actor.name || '', status: t.status, note: reply || '' });
  await t.save();
  await notifyRiderOfTicketUpdate(t, { role: actor.role, reply: reply || '', statusChanged: t.status !== statusBefore });
  return getRiderTicket(scope, t._id);
}
