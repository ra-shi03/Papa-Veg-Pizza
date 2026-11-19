import mongoose from 'mongoose';
import { FoodSupportTicket } from '../../user/models/supportTicket.model.js';
import { FoodOrder } from '../../orders/models/order.model.js';
import { FoodStore } from '../../store/models/store.model.js';
import { User } from '../../../../core/users/models/user.model.js';
import { Profile } from '../../../../core/users/models/profile.model.js';
import { notifyOwnersSafely } from '../../orders/services/order.helpers.js';
import { NotFoundError, ValidationError } from '../../../../core/auth/errors.js';

// Customer Complaints desk of the franchise admin (and the super admin): the complaints customers raised about
// the stores of the caller's franchise, with the actions an admin can take on them.
//
// A complaint is one FoodSupportTicket. The customer and the store manager see it through their own screens;
// this desk adds notes, a resolution and "close". `storeIds` is the caller's scope
// (null = every store, for the super admin); a complaint about another franchise's store is "not found".

const toId = (v) => new mongoose.Types.ObjectId(String(v));
const isId = (v) => mongoose.Types.ObjectId.isValid(String(v || ''));
const str = (v, max) => String(v ?? '').trim().slice(0, max);
const round2 = (n) => Math.round(n * 100) / 100;
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

const PRIORITIES = ['low', 'medium', 'high', 'critical'];
const PRIORITY_RANK = { low: 1, medium: 2, high: 3, critical: 4 };
const STATUS_RANK = { Open: 1, 'In Progress': 2, Resolved: 3, Closed: 4 };

export const ticketNumberOf = (id) => `TKT-${String(id).slice(-6).toUpperCase()}`;

/** The status the desk shows. The ticket itself is open / in-progress / resolved; closed is desk-only. */
export const deskStatusOf = (t) => {
    if (t.closedAt) return 'Closed';
    if (t.status === 'resolved') return 'Resolved';
    if (t.status === 'in-progress') return 'In Progress';
    return 'Open';
};

const scopeFilter = (storeIds, extra = {}) => {
    const filter = { type: { $in: ['order', 'store'] }, storeId: { $ne: null }, ...extra };
    if (storeIds !== null) {
        const allowed = storeIds.map(String);
        const wanted = extra.storeId && isId(extra.storeId) ? String(extra.storeId) : null;
        filter.storeId = { $in: (wanted ? allowed.filter((s) => s === wanted) : allowed).map(toId) };
    } else if (extra.storeId && isId(extra.storeId)) {
        filter.storeId = toId(extra.storeId);
    }
    return filter;
};

/**
 * The customers' email addresses. A customer who signs in with a mobile number and OTP has no email on the account
 * itself: it is on their profile, and on the orders they placed. Profile first, then the latest order that has one.
 */
export async function emailsOf(userIds) {
  const ids = [...new Set((userIds || []).map(String))].map(toId);
  if (!ids.length) return new Map();
  const [profiles, orders] = await Promise.all([
    Profile.find({ userId: { $in: ids }, email: { $nin: [null, ''] } }).select('userId email').lean(),
    FoodOrder.aggregate([
      { $match: { userId: { $in: ids }, customerEmail: { $nin: [null, ''] } } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: '$userId', email: { $first: '$customerEmail' } } },
    ]),
  ]);
  const out = new Map(orders.map((o) => [String(o._id), o.email]));
  profiles.forEach((p) => out.set(String(p.userId), p.email));
  return out;
}

/** The person doing the action, for the timeline. */
async function actorOf(user) {
    const profile = user?.userId && isId(user.userId) ? await Profile.findOne({ userId: toId(user.userId) }).select('firstName lastName').lean() : null;
    const name = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ').trim();
    const role = String(user?.role || '').toUpperCase().includes('SUPER') ? 'Super Admin' : 'Franchise Admin';
    return { name: name || role, role };
}

async function decorate(tickets, storeIds) {
  const orderIds = tickets.map((t) => t.orderId).filter(Boolean);
  const userIds = [...new Set(tickets.map((t) => String(t.userId)))].map(toId);
  const storeIdList = [...new Set(tickets.map((t) => String(t.storeId)))].map(toId);
  const [orders, users, stores, names] = await Promise.all([
    FoodOrder.find({ _id: { $in: orderIds } }).select('order_id').lean(),
    User.find({ _id: { $in: userIds } }).select('mobile email').lean(),
    FoodStore.find({ _id: { $in: storeIdList } }).select('storeName').lean(),
    FoodOrder.aggregate([
      { $match: { userId: { $in: userIds }, customerName: { $nin: ['', null] } } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: '$userId', name: { $first: '$customerName' }, phone: { $first: '$customerPhone' } } },
    ]),
  ]);
  const orderBy = new Map(orders.map((o) => [String(o._id), o]));
  const userBy = new Map(users.map((u) => [String(u._id), u]));
  const storeBy = new Map(stores.map((s) => [String(s._id), s]));
  const nameBy = new Map(names.map((n) => [String(n._id), n]));
  return tickets.map((t) => {
    const u = userBy.get(String(t.userId)) || {};
    const n = nameBy.get(String(t.userId)) || {};
    const resolvedAt = t.resolution?.resolvedAt || null;
    const r = t.resolution;
    return {
      _id: String(t._id),
      ticketNumber: ticketNumberOf(t._id),
      customerId: String(t.userId),
      orderId: orderBy.get(String(t.orderId))?.order_id || '',
      storeId: String(t.storeId),
      storeName: storeBy.get(String(t.storeId))?.storeName || 'N/A',
      category: t.issueType,
      priority: cap(t.priority || 'medium'),
      description: t.description || '',
      attachments: t.images || [],
      status: deskStatusOf(t),
      resolution: r?.actionTaken || '',
      resolvedAt,
      closedAt: t.closedAt || null,
      createdAt: t.createdAt,
      customerName: n.name || 'Customer',
      customerPhone: u.mobile || n.phone || 'N/A',
      _raw: { orderMongoId: t.orderId ? String(t.orderId) : '', refundAmount: r?.refundAmount || 0 },
    };
  });
}

const dateRangeOf = (q) => {
  const from = q.fromDate ? new Date(q.fromDate) : null;
  const to = q.toDate ? new Date(q.toDate) : null;
  if (to) to.setHours(23, 59, 59, 999);
  return { from: from && !Number.isNaN(from.getTime()) ? from : null, to: to && !Number.isNaN(to.getTime()) ? to : null };
};

export async function listComplaintDesk(query = {}, { storeIds = null } = {}) {
  const base = scopeFilter(storeIds);
  const filter = scopeFilter(storeIds, query.storeId && query.storeId !== 'All' ? { storeId: query.storeId } : {});
  if (query.category && query.category !== 'All') filter.issueType = str(query.category, 100);
  if (query.priority && query.priority !== 'All' && PRIORITIES.includes(String(query.priority).toLowerCase())) filter.priority = String(query.priority).toLowerCase();
  const { from, to } = dateRangeOf(query);
  if (from || to) filter.createdAt = { ...(from ? { $gte: from } : {}), ...(to ? { $lte: to } : {}) };

  let list = await decorate(await FoodSupportTicket.find(filter).sort({ createdAt: -1 }).limit(2000).lean(), storeIds);
  if (query.status && query.status !== 'All') list = list.filter((c) => c.status === query.status);
  const search = str(query.search, 80).toLowerCase();
  if (search) {
    list = list.filter((c) => [c.ticketNumber, c.customerName, c.orderId, c.customerPhone, c.category, c.storeName, c.description]
      .some((v) => String(v || '').toLowerCase().includes(search)));
  }

  const dir = query.sortOrder === 'asc' ? 1 : -1;
  const keyOf = (c) => ({
    createdAt: new Date(c.createdAt).getTime(),
    priority: PRIORITY_RANK[String(c.priority).toLowerCase()] || 0,
    status: STATUS_RANK[c.status] || 0,
    category: String(c.category).toLowerCase(),
    ticketNumber: c.ticketNumber,
  }[query.sortBy] ?? new Date(c.createdAt).getTime());
  list.sort((a, b) => {
    const x = keyOf(a); const y = keyOf(b);
    return (typeof x === 'string' ? x.localeCompare(y) : x - y) * dir;
  });

  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 500);
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const total = list.length;
  const complaints = list.slice((page - 1) * limit, page * limit).map(({ _raw, ...c }) => c);

  // Headline numbers, over every complaint in scope whatever the table is filtered to
  const all = await decorate(await FoodSupportTicket.find(base).sort({ createdAt: -1 }).limit(2000).lean(), storeIds);
  const now = new Date();
  const resolved = all.filter((c) => c.status === 'Resolved' || c.status === 'Closed');
  const stats = {
    openComplaints: all.filter((c) => c.status === 'Open').length,
    highPriority: all.filter((c) => (c.priority === 'High' || c.priority === 'Critical') && c.status !== 'Resolved' && c.status !== 'Closed').length,
    resolvedToday: resolved.filter((c) => c.resolvedAt && new Date(c.resolvedAt).toDateString() === now.toDateString()).length,
    totalComplaintsThisMonth: all.filter((c) => new Date(c.createdAt).getMonth() === now.getMonth() && new Date(c.createdAt).getFullYear() === now.getFullYear()).length,
  };

  // The lists the filter boxes are built from
  const storeFilter = storeIds === null ? {} : { _id: { $in: storeIds.map(toId) } };
  const stores = await FoodStore.find(storeFilter).select('storeName').sort({ storeName: 1 }).lean();
  return {
    complaints,
    total,
    page,
    limit,
    stats,
    stores: stores.map((s) => ({ id: String(s._id), name: s.storeName })),
    categories: [...new Set(all.map((c) => c.category).filter(Boolean))].sort(),
  };
}

const findTicket = async (id, storeIds) => {
  if (!isId(id)) throw new NotFoundError('Complaint not found');
  const t = await FoodSupportTicket.findOne(scopeFilter(storeIds, { _id: toId(id) }));
  if (!t) throw new NotFoundError('Complaint not found');
  return t;
};

const track = (t, actor, action, oldValue = '', newValue = '') => {
  t.activity.push({ action, oldValue: str(oldValue, 200), newValue: str(newValue, 300), byName: actor.name, at: new Date() });
};

export async function complaintDeskDetails(id, { storeIds = null } = {}) {
  const t = await findTicket(id, storeIds);
  const raw = t.toObject();
  const [item] = await decorate([raw], storeIds);
  const { _raw, ...complaint } = item;

  const orderScope = storeIds === null ? {} : { storeId: { $in: storeIds.map(toId) } };
  const [user, emails, order, spend] = await Promise.all([
    User.findById(t.userId).select('mobile email').lean(),
    emailsOf([t.userId]),
    t.orderId ? FoodOrder.findOne({ _id: t.orderId, storeId: t.storeId }).lean() : null,
    FoodOrder.aggregate([
      { $match: { userId: t.userId, ...orderScope, orderStatus: { $not: /^cancelled/ } } },
      { $group: { _id: null, orders: { $sum: 1 }, spent: { $sum: { $cond: [{ $eq: ['$orderStatus', 'delivered'] }, { $ifNull: ['$pricing.total', 0] }, 0] } }, delivered: { $sum: { $cond: [{ $eq: ['$orderStatus', 'delivered'] }, 1, 0] } } } },
    ]),
  ]);
  const s = spend[0] || { orders: 0, spent: 0, delivered: 0 };
  const customer = {
    _id: complaint.customerId,
    userId: complaint.customerId,
    fullName: complaint.customerName,
    mobile: user?.mobile || complaint.customerPhone,
    email: user?.email || emails.get(String(t.userId)) || '',
    totalOrders: s.orders,
    totalSpent: round2(s.spent),
    avgOrderValue: s.delivered ? round2(s.spent / s.delivered) : 0,
  };

  const a = order?.deliveryAddress || {};
  const orderView = order ? {
    _id: String(order._id),
    orderNumber: order.order_id || String(order._id),
    date: order.createdAt,
    orderStatus: order.orderStatus,
    paymentMethod: order.payment?.method || '',
    deliveryType: order.orderMethod || 'delivery',
    amount: order.pricing?.total || 0,
    discount: order.pricing?.discount || 0,
    taxes: order.pricing?.tax || 0,
    items: (order.items || []).map((i) => ({ name: i.name, quantity: i.quantity, price: i.price })),
    deliveryAddress: {
      recipientName: a.fullName || a.name || order.customerName || '',
      phone: a.phone || order.customerPhone || '',
      houseNo: a.additionalDetails || '',
      street: a.street || '',
      city: a.city || '',
      state: a.state || '',
      pincode: a.zipCode || '',
      landmark: '',
    },
  } : null;

  // One timeline: what the customer wrote, what the store did, what the desk did
  const logs = [
    { _id: `${raw._id}-created`, action: 'Complaint Created', oldValue: '', newValue: 'Open', performedBy: complaint.customerName, timestamp: raw.createdAt },
    ...(raw.responses || []).map((r, i) => ({ _id: `${raw._id}-reply-${i}`, action: 'Store Replied', oldValue: '', newValue: str(r.message, 120), performedBy: r.byName || 'Store Manager', timestamp: r.at })),
    ...(raw.activity || []).map((x, i) => ({ _id: `${raw._id}-act-${i}`, action: x.action, oldValue: x.oldValue, newValue: x.newValue, performedBy: x.byName, timestamp: x.at })),
  ];
  const resolvedByStore = raw.resolution?.resolvedAt && !(raw.activity || []).some((x) => x.action === 'Resolved');
  if (resolvedByStore) logs.push({ _id: `${raw._id}-resolved`, action: 'Resolved', oldValue: '', newValue: 'Resolved', performedBy: raw.resolution.resolvedBy || 'Store', timestamp: raw.resolution.resolvedAt });
  logs.sort((x, y) => new Date(y.timestamp) - new Date(x.timestamp));

  return {
    ...complaint,
    customer,
    order: orderView,
    logs,
    notes: (raw.notes || []).map((n) => ({ _id: String(n._id), note: n.note, createdBy: n.byName, createdAt: n.at })).reverse(),
  };
}

const mustBeOpenTicket = (t) => {
  if (t.closedAt) throw new ValidationError('This complaint is closed');
  if (t.status === 'resolved') throw new ValidationError('This complaint is already resolved');
};

const done = async (t, storeIds) => complaintDeskDetails(String(t._id), { storeIds });

const tellCustomer = (t, title, body) =>
  notifyOwnersSafely([{ ownerType: 'USER', ownerId: t.userId }], { title, body, data: { type: 'complaint_update', ticketId: String(t._id) } });

/** Resolves the complaint. A refund is the amount promised to the customer; the money is paid out by the refund flow, never from here. */
export async function resolveComplaint(id, body = {}, { storeIds = null, user } = {}) {
  const t = await findTicket(id, storeIds);
  mustBeOpenTicket(t);
  const type = str(body.resolutionType, 60) || 'Apology & Closure';
  const remarks = str(body.remarks, 400);
  if (!remarks) throw new ValidationError('Describe how it was resolved');
  const refundAmount = type === 'Refund' && body.refundAmount !== undefined && body.refundAmount !== '' ? Number(body.refundAmount) : 0;
  if (!Number.isFinite(refundAmount) || refundAmount < 0) throw new ValidationError('Refund amount must be zero or more');
  if (refundAmount > 0) {
    const order = t.orderId ? await FoodOrder.findOne({ _id: t.orderId, storeId: t.storeId }).select('pricing.total').lean() : null;
    if (!order) throw new ValidationError('A refund needs the complaint to be about an order');
    if (refundAmount > (order.pricing?.total || 0)) throw new ValidationError('Refund cannot be more than the order total');
  }
  const coupon = type === 'Coupon Compensation' ? str(body.couponCode, 40) : '';
  const actor = await actorOf(user);
  const before = deskStatusOf(t);
  const resolvedAt = new Date();
  t.status = 'resolved';
  t.resolution = {
    actionTaken: `${type}: ${remarks}`.slice(0, 500),
    resolvedBy: `${actor.name} (${actor.role})`,
    resolvedById: isId(user?.userId) ? toId(user.userId) : null,
    refundAmount: round2(refundAmount),
    replacementOrderId: '',
    couponIssued: coupon,
    evidenceImage: '',
    resolvedAt,
  };
  track(t, actor, 'Resolved', before, type);
  if (refundAmount > 0) track(t, actor, 'Refund Promised', '', `₹${round2(refundAmount)}`);
  if (coupon) track(t, actor, 'Coupon Issued', '', coupon);
  await t.save();
  await tellCustomer(t, 'Your complaint has been resolved', t.resolution.actionTaken);
  return done(t, storeIds);
}

export async function closeComplaint(id, body = {}, { storeIds = null, user } = {}) {
  const t = await findTicket(id, storeIds);
  if (t.closedAt) throw new ValidationError('This complaint is already closed');
  if (t.status !== 'resolved') throw new ValidationError('Resolve the complaint before closing it');
  const actor = await actorOf(user);
  t.closedAt = new Date();
  track(t, actor, 'Closed', 'Resolved', str(body.closingRemarks, 300) || 'Closed');
  await t.save();
  return done(t, storeIds);
}

export async function addComplaintNote(id, body = {}, { storeIds = null, user } = {}) {
  const t = await findTicket(id, storeIds);
  const note = str(body.note, 1000);
  if (!note) throw new ValidationError('A note is required');
  const actor = await actorOf(user);
  t.notes.push({ note, byName: actor.name, at: new Date() });
  await t.save();
  return done(t, storeIds);
}

export async function deleteComplaintNote(id, noteId, { storeIds = null } = {}) {
  const t = await findTicket(id, storeIds);
  const note = isId(noteId) ? t.notes.id(noteId) : null;
  if (!note) throw new NotFoundError('Note not found');
  note.deleteOne();
  await t.save();
  return done(t, storeIds);
}
