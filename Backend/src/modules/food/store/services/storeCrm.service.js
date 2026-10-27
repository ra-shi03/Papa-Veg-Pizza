import mongoose from 'mongoose';
import { FoodOrder } from '../../orders/models/order.model.js';
import { FoodSupportTicket } from '../../user/models/supportTicket.model.js';
import { FoodStore } from '../models/store.model.js';
import { StoreManager } from '../../franchise/models/storeManager.model.js';
import { User } from '../../../../core/users/models/user.model.js';
import { Profile } from '../../../../core/users/models/profile.model.js';
import { Refund } from '../../../../core/payments/models/refund.model.js';
import { notifyOwnersSafely } from '../../orders/services/order.helpers.js';
import { config } from '../../../../config/env.js';
import { ForbiddenError, NotFoundError, ValidationError } from '../../../../core/auth/errors.js';

// Store manager panel: Customers & Orders, Complaints, Reviews.
//
//   store manager      -> own store; can reply to reviews and respond to / resolve complaints
//   kitchen supervisor -> own store, read only, with the customer's phone and email masked
//   everyone else      -> 403 (routes);  another store's customer / order / complaint / review -> 404
//
// Customers are the people who ordered from this store (derived from orders). Complaints are the support tickets
// customers raise about this store / its orders; reviews are the store ratings customers leave on orders.

const normalize = (role) => String(role || '').trim().replace(/-/g, '_').toUpperCase();
const toId = (v) => new mongoose.Types.ObjectId(String(v));
const isId = (v) => mongoose.Types.ObjectId.isValid(String(v || ''));
const str = (v, max) => String(v ?? '').trim().slice(0, max);
const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const CANCELLED = ['cancelled_by_user', 'cancelled_by_store', 'cancelled_by_admin'];
const HIGH_VALUE = 5000;

function context(user) {
  const role = normalize(user?.role);
  if (role !== 'STORE_MANAGER' && role !== 'KITCHEN_SUPERVISOR') throw new ForbiddenError('You do not have access to customers.');
  if (!isId(user.storeId)) throw new ForbiddenError('No store is linked to your account.');
  return { user, storeId: toId(user.storeId), isManager: role === 'STORE_MANAGER' };
}
const mustManager = (ctx) => {
  if (!ctx.isManager) throw new ForbiddenError('Only the store manager can do this.');
};

// ---------------------------------------------------------------------------------------------
// Contact details: only the store manager sees them in full
// ---------------------------------------------------------------------------------------------

export const maskPhone = (p) => {
  const d = String(p || '').replace(/\s+/g, '');
  if (!d) return '';
  return d.length <= 4 ? '*'.repeat(d.length) : `${d.slice(0, 2)}${'*'.repeat(d.length - 4)}${d.slice(-2)}`;
};
export const maskEmail = (e) => {
  const [local, domain] = String(e || '').split('@');
  if (!local || !domain) return e ? '***' : '';
  return `${local[0]}***@${domain}`;
};
const contact = (ctx, { mobile = '', email = '' }) => (ctx.isManager ? { mobile, email } : { mobile: maskPhone(mobile), email: maskEmail(email) });

const pagination = (total, page, limit) => ({ total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) });
const pageOf = (q, d = 10) => ({ page: Math.max(1, parseInt(q.page, 10) || 1), limit: Math.min(100, Math.max(1, parseInt(q.limit, 10) || d)) });
const isAll = (v) => !v || v === 'All' || v === 'all';
const inRange = (date, q) => {
  if (!q.startDate || !q.endDate) return true;
  const t = new Date(date).getTime();
  return t >= new Date(q.startDate).getTime() && t <= new Date(q.endDate).getTime() + 86399999;
};
const sorter = (q, keyOf, defaults = { by: 'createdAt', order: 'desc' }) => {
  const order = (q.sortOrder || defaults.order) === 'asc' ? 1 : -1;
  return (a, b) => {
    const x = keyOf(a, q.sortBy || defaults.by);
    const y = keyOf(b, q.sortBy || defaults.by);
    if (typeof x === 'string' || typeof y === 'string') return String(x ?? '').localeCompare(String(y ?? '')) * order;
    return ((x ?? 0) - (y ?? 0)) * order;
  };
};

const paymentStatusOf = (o) => {
  const s = String(o.payment?.status || '');
  if (s === 'paid') return 'paid';
  if (s === 'refunded') return 'refunded';
  if (s === 'failed') return 'failed';
  return 'pending';
};
const paymentMethodOf = (o) => ({ cash: 'Cash on Delivery', razorpay: 'Online', razorpay_qr: 'UPI QR', wallet: 'Wallet' }[o.payment?.method] || o.payment?.method || '');
const orderSummary = (o) => ({
  _id: String(o._id),
  orderNumber: o.order_id || String(o._id),
  customerId: String(o.userId),
  storeId: String(o.storeId),
  orderStatus: o.orderStatus,
  paymentStatus: paymentStatusOf(o),
  paymentMethod: paymentMethodOf(o),
  totalAmount: round2(o.pricing?.total),
  deliveryType: 'delivery',
  createdAt: o.createdAt,
});

// ---------------------------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------------------------

/** Every customer of this store with their totals here and their latest order here. */
async function storeCustomers(ctx) {
  const rows = await FoodOrder.aggregate([
    { $match: { storeId: ctx.storeId } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: '$userId',
        totalOrders: { $sum: 1 },
        totalSpent: { $sum: { $cond: [{ $in: ['$orderStatus', CANCELLED] }, 0, { $ifNull: ['$pricing.total', 0] }] } },
        lastOrderDate: { $first: '$createdAt' },
        lastOrder: { $first: '$$ROOT' },
      },
    },
    { $limit: 5000 },
  ]);
  const ids = rows.map((r) => r._id).filter(Boolean);
  const [users, profiles] = await Promise.all([
    User.find({ _id: { $in: ids } }).select('mobile email createdAt').lean(),
    Profile.find({ userId: { $in: ids } }).select('userId firstName lastName email').lean(),
  ]);
  const userById = new Map(users.map((u) => [String(u._id), u]));
  const profileById = new Map(profiles.map((p) => [String(p.userId), p]));
  return rows.filter((r) => r._id).map((r) => {
    const u = userById.get(String(r._id)) || {};
    const p = profileById.get(String(r._id)) || {};
    const profileName = [p.firstName, p.lastName].filter(Boolean).join(' ');
    return {
      _id: String(r._id),
      name: r.lastOrder.customerName || profileName || 'Customer',
      mobile: u.mobile || r.lastOrder.customerPhone || '',
      email: p.email || u.email || '',
      totalOrders: r.totalOrders,
      totalSpent: round2(r.totalSpent),
      loyaltyPoints: 0,
      lastOrderDate: r.lastOrderDate,
      createdAt: u.createdAt || r.lastOrderDate,
      recentOrder: (({ _id, orderNumber, createdAt, totalAmount, paymentStatus, deliveryType, orderStatus }) => ({ _id, orderNumber, createdAt, totalAmount, paymentStatus, deliveryType, orderStatus }))(orderSummary(r.lastOrder)),
    };
  });
}

const masked = (ctx, c) => ({ ...c, ...contact(ctx, c) });

export async function listCustomers(user, q = {}) {
  const ctx = context(user);
  let list = await storeCustomers(ctx);
  const search = str(q.search, 80).toLowerCase();
  if (search) list = list.filter((c) => [c.name, c.email, c.mobile].some((v) => String(v).toLowerCase().includes(search)));
  if (String(q.returning) === 'true') list = list.filter((c) => c.totalOrders > 1);
  if (String(q.highValue) === 'true') list = list.filter((c) => c.totalSpent >= HIGH_VALUE);
  if (!isAll(q.status)) list = list.filter((c) => c.recentOrder?.orderStatus?.toLowerCase() === String(q.status).toLowerCase());
  if (!isAll(q.paymentStatus)) list = list.filter((c) => c.recentOrder?.paymentStatus === String(q.paymentStatus).toLowerCase());
  list = list.filter((c) => inRange(c.lastOrderDate, q));
  const keyOf = (c, by) => ({
    name: c.name, mobile: c.mobile, orderNumber: c.recentOrder?.orderNumber || '', lastOrderDate: new Date(c.lastOrderDate).getTime(),
    orderDate: new Date(c.lastOrderDate).getTime(), totalSpent: c.recentOrder?.totalAmount || 0, orderAmount: c.recentOrder?.totalAmount || 0,
    totalAmount: c.recentOrder?.totalAmount || 0, totalOrders: c.totalOrders,
  }[by] ?? c.name);
  list.sort(sorter(q, keyOf, { by: 'name', order: 'asc' }));
  const { page, limit } = pageOf(q);
  return { customers: list.slice((page - 1) * limit, page * limit).map((c) => masked(ctx, c)), pagination: pagination(list.length, page, limit) };
}

export async function customerProfile(user, customerId) {
  const ctx = context(user);
  if (!isId(customerId)) throw new NotFoundError('Customer not found');
  const orders = await FoodOrder.find({ storeId: ctx.storeId, userId: toId(customerId) }).sort({ createdAt: -1 }).limit(50).lean();
  if (!orders.length) throw new NotFoundError('Customer not found'); // never ordered here: not this store's customer
  const customer = (await storeCustomers(ctx)).find((c) => c._id === String(customerId));
  const [complaints, reviews] = await Promise.all([
    complaintsOf(ctx, { userId: toId(customerId) }),
    Promise.resolve(orders.filter((o) => o.ratings?.store?.rating).map((o) => toReview(ctx, o, customer))),
  ]);
  const { recentOrder, ...profile } = customer;
  return { customerProfile: masked(ctx, profile), recentOrders: orders.map(orderSummary), complaints, reviews };
}

/** Order details for the customer screens (items, payment, tracking, refunds). */
export async function orderDetails(user, orderId) {
  const ctx = context(user);
  if (!isId(orderId)) throw new NotFoundError('Order not found');
  const order = await FoodOrder.findOne({ _id: toId(orderId), storeId: ctx.storeId }).lean();
  if (!order) throw new NotFoundError('Order not found');
  const [store, u, refunds] = await Promise.all([
    FoodStore.findById(ctx.storeId).select('storeName').lean(),
    User.findById(order.userId).select('mobile email').lean(),
    Refund.find({ orderId: order._id }).sort({ createdAt: -1 }).lean(),
  ]);
  const who = contact(ctx, { mobile: order.customerPhone || u?.mobile || '', email: u?.email || '' });
  return {
    order: { ...orderSummary(order), customerName: order.customerName || 'Customer', customerMobile: who.mobile, customerEmail: who.email, storeName: store?.storeName || '' },
    items: (order.items || []).map((i) => ({
      name: i.name, quantity: i.quantity, price: i.price, subtotal: round2(i.price * i.quantity),
      customizations: [i.size && `Size: ${i.size}`, i.crust && `Crust: ${i.crust}`, ...(i.selectedAddons || []).map((a) => a.name)].filter(Boolean).join(', ') || 'None',
    })),
    payments: [{
      _id: `pay-${order._id}`, orderId: String(order._id), transactionId: order.payment?.razorpay?.paymentId || '', amount: round2(order.pricing?.total),
      method: paymentMethodOf(order), status: paymentStatusOf(order) === 'paid' ? 'success' : paymentStatusOf(order), createdAt: order.createdAt,
    }],
    deliveryTracking: (order.statusHistory || []).map((h) => ({ status: h.to, timestamp: h.at })),
    refunds: refunds.map((r) => ({ _id: String(r._id), orderId: String(r.orderId), orderNumber: order.order_id || '', reason: r.reason, amount: r.amount, status: r.status, createdAt: r.createdAt })),
  };
}

// ---------------------------------------------------------------------------------------------
// Complaints (support tickets about this store)
// ---------------------------------------------------------------------------------------------

const UI_STATUS = { open: 'pending', 'in-progress': 'investigating', resolved: 'resolved' };
const DB_STATUS = { pending: 'open', investigating: 'in-progress', resolved: 'resolved' };
const PRIORITY_RANK = { low: 1, medium: 2, high: 3, critical: 4 };
export const complaintTypeOf = (issueType) => String(issueType || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

async function complaintsOf(ctx, extra = {}) {
  const tickets = await FoodSupportTicket.find({ storeId: ctx.storeId, ...extra }).sort({ createdAt: -1 }).limit(2000).lean();
  return decorate(ctx, tickets);
}

async function decorate(ctx, tickets) {
  const orderIds = tickets.map((t) => t.orderId).filter(Boolean);
  const userIds = [...new Set(tickets.map((t) => String(t.userId)))].map(toId);
  const [orders, users, latest] = await Promise.all([
    FoodOrder.find({ _id: { $in: orderIds }, storeId: ctx.storeId }).select('order_id').lean(),
    User.find({ _id: { $in: userIds } }).select('mobile email').lean(),
    FoodOrder.aggregate([{ $match: { storeId: ctx.storeId, userId: { $in: userIds } } }, { $sort: { createdAt: -1 } }, { $group: { _id: '$userId', name: { $first: '$customerName' }, phone: { $first: '$customerPhone' } } }]),
  ]);
  const orderById = new Map(orders.map((o) => [String(o._id), o]));
  const userById = new Map(users.map((u) => [String(u._id), u]));
  const nameById = new Map(latest.map((l) => [String(l._id), l]));
  return tickets.map((t) => {
    const u = userById.get(String(t.userId)) || {};
    const who = contact(ctx, { mobile: u.mobile || nameById.get(String(t.userId))?.phone || '', email: u.email || '' });
    return toComplaint(t, {
      customerName: nameById.get(String(t.userId))?.name || 'Customer',
      customerMobile: who.mobile,
      customerEmail: who.email,
      orderNumber: orderById.get(String(t.orderId))?.order_id || 'N/A',
    });
  });
}

const toComplaint = (t, extra = {}) => ({
  _id: String(t._id),
  storeId: String(t.storeId),
  customerId: String(t.userId),
  orderId: t.orderId ? String(t.orderId) : '',
  complaintType: complaintTypeOf(t.issueType),
  priority: t.priority || 'medium',
  description: t.description,
  images: t.images || [],
  status: UI_STATUS[t.status] || 'pending',
  resolution: t.resolution || null,
  resolvedBy: t.resolution?.resolvedBy || '',
  responses: (t.responses || []).map((r) => ({ message: r.message, byName: r.byName, byRole: r.byRole, at: r.at })),
  createdAt: t.createdAt,
  updatedAt: t.updatedAt,
  ...extra,
});

export async function listComplaints(user, q = {}) {
  const ctx = context(user);
  const filter = {};
  if (!isAll(q.status) && DB_STATUS[String(q.status).toLowerCase()]) filter.status = DB_STATUS[String(q.status).toLowerCase()];
  if (!isAll(q.priority)) filter.priority = String(q.priority).toLowerCase();
  let list = await complaintsOf(ctx, filter);
  if (!isAll(q.complaintType)) list = list.filter((c) => c.complaintType === complaintTypeOf(q.complaintType));
  const search = str(q.search, 80).toLowerCase();
  if (search) list = list.filter((c) => [c._id, c.description, c.complaintType, c.customerName, c.customerEmail, c.customerMobile, c.orderNumber].some((v) => String(v).toLowerCase().includes(search)));
  list = list.filter((c) => inRange(c.createdAt, q));
  const keyOf = (c, by) => ({
    createdAt: new Date(c.createdAt).getTime(), priority: PRIORITY_RANK[c.priority] || 0, status: c.status, complaintType: c.complaintType, customerName: c.customerName,
  }[by] ?? new Date(c.createdAt).getTime());
  list.sort(sorter(q, keyOf));
  const { page, limit } = pageOf(q);
  return { complaints: list.slice((page - 1) * limit, page * limit), pagination: pagination(list.length, page, limit) };
}

const findTicket = async (ctx, id) => {
  if (!isId(id)) throw new NotFoundError('Complaint not found');
  const t = await FoodSupportTicket.findOne({ _id: toId(id), storeId: ctx.storeId });
  if (!t) throw new NotFoundError('Complaint not found');
  return t;
};

export async function complaintDetails(user, id) {
  const ctx = context(user);
  const t = await findTicket(ctx, id);
  const [complaint] = await decorate(ctx, [t.toObject()]);
  const customer = (await storeCustomers(ctx)).find((c) => c._id === String(t.userId)) || null;
  const order = t.orderId ? await FoodOrder.findOne({ _id: t.orderId, storeId: ctx.storeId }).lean() : null;
  return {
    ...complaint,
    customer: customer ? masked(ctx, (({ recentOrder, ...c }) => c)(customer)) : null,
    order: order ? { ...orderSummary(order), items: (order.items || []).map((i, n) => ({ _id: `${order._id}-${n}`, orderId: String(order._id), name: i.name, price: i.price, quantity: i.quantity, customizations: i.size || '' })) } : null,
  };
}

const managerName = async (ctx) =>
  (await StoreManager.findOne({ userId: toId(ctx.user.userId), storeId: String(ctx.storeId) }).select('name').lean())?.name || 'Store Manager';

const tellCustomer = (ticket, title, body) =>
  notifyOwnersSafely([{ ownerType: 'USER', ownerId: ticket.userId }], { title, body, data: { type: 'complaint_update', ticketId: String(ticket._id) } });

/** The manager answers the customer without closing the complaint (pending -> investigating). */
export async function respondToComplaint(user, id, body = {}) {
  const ctx = context(user);
  mustManager(ctx);
  const t = await findTicket(ctx, id);
  if (t.status === 'resolved') throw new ValidationError('This complaint is already resolved');
  const message = str(body.message, 1000);
  if (!message) throw new ValidationError('A message is required');
  t.responses.push({ message, byName: await managerName(ctx), byRole: 'Store Manager', at: new Date() });
  if (t.status === 'open') t.status = 'in-progress';
  await t.save();
  await tellCustomer(t, 'Update on your complaint', message);
  const [complaint] = await decorate(ctx, [t.toObject()]);
  return complaint;
}

// Only images we uploaded ourselves can be shown as evidence (same rule as kitchen-task proofs).
const ourImage = (v) => {
  try {
    const url = new URL(String(v || ''));
    return url.protocol === 'https:' && url.hostname === 'res.cloudinary.com' && config.cloudinaryCloudName && url.pathname.startsWith(`/${config.cloudinaryCloudName}/image/upload/`) ? url.toString() : '';
  } catch {
    return '';
  }
};

/**
 * Resolves a complaint. A refund amount is recorded as what was promised to the customer; the money itself is
 * paid out through the refund flow, never from here.
 */
export async function resolveComplaint(user, id, body = {}) {
  const ctx = context(user);
  mustManager(ctx);
  const t = await findTicket(ctx, id);
  if (t.status === 'resolved') throw new ValidationError('This complaint is already resolved');
  const actionTaken = str(body.actionTaken, 500);
  if (!actionTaken) throw new ValidationError('Describe the action taken');
  const refundAmount = body.refundAmount === undefined || body.refundAmount === '' ? 0 : Number(body.refundAmount);
  if (!Number.isFinite(refundAmount) || refundAmount < 0) throw new ValidationError('Refund amount must be zero or more');
  if (refundAmount > 0) {
    const order = t.orderId ? await FoodOrder.findOne({ _id: t.orderId, storeId: ctx.storeId }).select('pricing.total').lean() : null;
    if (!order) throw new ValidationError('A refund needs the complaint to be about an order');
    if (refundAmount > (order.pricing?.total || 0)) throw new ValidationError('Refund cannot be more than the order total');
  }
  const name = await managerName(ctx);
  t.status = 'resolved';
  t.resolution = {
    actionTaken, resolvedBy: name, resolvedById: toId(ctx.user.userId), refundAmount: round2(refundAmount),
    replacementOrderId: str(body.replacementOrderId, 60), couponIssued: str(body.couponIssued, 40), evidenceImage: ourImage(body.evidenceImage), resolvedAt: new Date(),
  };
  await t.save();
  await tellCustomer(t, 'Your complaint has been resolved', actionTaken);
  const [complaint] = await decorate(ctx, [t.toObject()]);
  return complaint;
}

// ---------------------------------------------------------------------------------------------
// Reviews (store ratings on orders)
// ---------------------------------------------------------------------------------------------

const sentimentOf = (rating) => (rating >= 4 ? 'Positive' : rating === 3 ? 'Neutral' : 'Negative');

function toReview(ctx, o, customer) {
  const s = o.ratings?.store || {};
  const reply = o.ratings?.storeReply;
  const who = contact(ctx, { mobile: customer?.mobile || o.customerPhone || '', email: customer?.email || '' });
  return {
    _id: String(o._id),
    storeId: String(o.storeId),
    customerId: String(o.userId),
    orderId: String(o._id),
    rating: s.rating,
    reviewText: s.comment || '',
    images: [],
    sentiment: sentimentOf(s.rating),
    reply: reply ? { text: reply.text, repliedBy: reply.repliedBy, repliedAt: reply.repliedAt } : undefined,
    createdAt: s.ratedAt || o.updatedAt,
    customerName: customer?.name || o.customerName || 'Customer',
    customerMobile: who.mobile,
    customerEmail: who.email,
    orderNumber: o.order_id || String(o._id),
  };
}

async function storeReviews(ctx) {
  const orders = await FoodOrder.find({ storeId: ctx.storeId, 'ratings.store.rating': { $gte: 1 } })
    .select('order_id userId storeId customerName customerPhone ratings updatedAt').sort({ 'ratings.store.ratedAt': -1 }).limit(2000).lean();
  const customers = new Map((await storeCustomers(ctx)).map((c) => [c._id, c]));
  return orders.map((o) => toReview(ctx, o, customers.get(String(o.userId))));
}

export async function listReviews(user, q = {}) {
  const ctx = context(user);
  let list = await storeReviews(ctx);
  const stars = Number(String(q.rating || '').replace(/[^0-9]/g, ''));
  if (!isAll(q.rating) && stars) list = list.filter((r) => r.rating === stars);
  if (!isAll(q.sentiment)) list = list.filter((r) => r.sentiment.toLowerCase() === String(q.sentiment).toLowerCase());
  const reply = String(q.replyStatus || '').toLowerCase();
  if (reply === 'replied') list = list.filter((r) => r.reply);
  else if (reply === 'pending' || reply === 'pending_reply') list = list.filter((r) => !r.reply);
  const search = str(q.search, 80).toLowerCase();
  if (search) list = list.filter((r) => [r.reviewText, r.customerName, r.customerEmail, r.customerMobile, r.orderNumber].some((v) => String(v).toLowerCase().includes(search)));
  list = list.filter((r) => inRange(r.createdAt, q));
  const keyOf = (r, by) => ({ createdAt: new Date(r.createdAt).getTime(), rating: r.rating, sentiment: r.sentiment, customerName: r.customerName }[by] ?? new Date(r.createdAt).getTime());
  list.sort(sorter(q, keyOf));
  const { page, limit } = pageOf(q);
  return { reviews: list.slice((page - 1) * limit, page * limit), pagination: pagination(list.length, page, limit) };
}

const findRatedOrder = async (ctx, id) => {
  if (!isId(id)) throw new NotFoundError('Review not found');
  const o = await FoodOrder.findOne({ _id: toId(id), storeId: ctx.storeId, 'ratings.store.rating': { $gte: 1 } });
  if (!o) throw new NotFoundError('Review not found');
  return o;
};

export async function reviewDetails(user, id) {
  const ctx = context(user);
  const o = (await findRatedOrder(ctx, id)).toObject();
  const customer = (await storeCustomers(ctx)).find((c) => c._id === String(o.userId)) || null;
  const theirs = await FoodOrder.find({ storeId: ctx.storeId, userId: o.userId, 'ratings.store.rating': { $gte: 1 } }).select('ratings.store.rating').lean();
  const avg = theirs.length ? theirs.reduce((n, x) => n + x.ratings.store.rating, 0) / theirs.length : 0;
  return {
    review: toReview(ctx, o, customer),
    customer: customer ? masked(ctx, (({ recentOrder, ...c }) => c)(customer)) : null,
    order: orderSummary(o),
    orderItems: (o.items || []).map((i, n) => ({ _id: `${o._id}-${n}`, orderId: String(o._id), name: i.name, price: i.price, quantity: i.quantity, customizations: i.size || '' })),
    customerStatistics: {
      totalOrders: customer?.totalOrders || 0,
      totalSpent: customer?.totalSpent || 0,
      loyaltyPoints: 0,
      averageRatingGiven: avg ? avg.toFixed(1) : 0,
    },
  };
}

export async function replyToReview(user, id, body = {}) {
  const ctx = context(user);
  mustManager(ctx);
  const o = await findRatedOrder(ctx, id);
  const text = str(body.text, 1000);
  if (!text) throw new ValidationError('A reply is required');
  o.ratings.storeReply = { text, repliedBy: `Store Manager (${await managerName(ctx)})`, repliedById: toId(ctx.user.userId), repliedAt: new Date() };
  o.markModified('ratings');
  await o.save();
  const customer = (await storeCustomers(ctx)).find((c) => c._id === String(o.userId));
  return toReview(ctx, o.toObject(), customer);
}
