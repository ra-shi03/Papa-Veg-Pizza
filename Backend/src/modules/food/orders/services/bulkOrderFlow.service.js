import mongoose from 'mongoose';
import crypto from 'node:crypto';
import { z } from 'zod';
import { BulkOrderInquiry } from '../models/bulkOrderInquiry.model.js';
import { Product } from '../../admin/models/product.model.js';
import { FoodStore } from '../../store/models/store.model.js';
import { ForbiddenError, NotFoundError, ValidationError } from '../../../../core/auth/errors.js';
import { priceCartItems } from './catalog-pricing.service.js';
import { FoodOrder } from '../models/order.model.js';
import { createOrderFromBulkOrder } from './order.service.js';
import { updateOrderStatusStore } from './order.service.js';
import { createRazorpayOrder, getRazorpayKeyId, isRazorpayConfigured, verifyPaymentSignature, fetchRazorpayPayment, initiateRazorpayRefund } from '../helpers/razorpay.helper.js';
import { sendEmail } from '../../../../utils/email.js';
import { getIO, rooms } from '../../../../config/socket.js';
import { logger } from '../../../../utils/logger.js';

// Bulk orders (virtual party / catering): the customer picks a nearby store and takeaway or delivery, the store manager
// confirms (with a quoted amount), prepares and hands it over. The super admin and the franchise admin only view them.
// E-Gift Voucher inquiries have no store: the super admin's corporate desk handles those.

export const STORE_FLOW = ['confirmed', 'preparing', 'ready', 'completed'];
const ID_RE = /^[a-f0-9]{24}$/i;

const text = (max) => z.string().trim().max(max);
const inquirySchema = z.object({
  name: z.string().trim().min(2, 'Enter your name').max(80),
  organisation: text(120).optional().default(''),
  phone: z.string().transform((v) => String(v).replace(/\D/g, '').slice(-10)).refine((v) => /^\d{10}$/.test(v), 'Enter a valid 10-digit contact number'),
  email: z.string().trim().toLowerCase().email('Enter a valid email address').max(120),
  location: text(200).optional().default(''),
  eventDate: text(40).optional().default(''),
  eventTime: text(20).optional().default(''),
  occasion: text(120).optional().default(''),
  partySize: text(120).optional().default(''),
  query: text(2000).optional().default(''),
  items: z.array(z.object({
    itemId: z.string().regex(ID_RE, 'Choose a valid item'),
    size: text(40).optional().default(''),
    crust: text(60).optional().default(''),
    quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1').max(500, 'That is too many of one item. Please call the store.'),
  })).max(40, 'Too many different items').optional().default([]),
  type: z.enum(['virtual_party', 'bulk_catering', 'egift_voucher']).optional().default('virtual_party'),
  fulfilment: z.enum(['takeaway', 'delivery']).optional().default('takeaway'),
  paymentMethod: z.enum(['cod', 'online']).optional().default('cod'),
  storeId: z.string().regex(ID_RE, 'Choose a store').optional(),
  address: z.object({
    street: text(200).optional().default(''),
    landmark: text(120).optional().default(''),
    city: text(80).optional().default(''),
    state: text(80).optional().default(''),
    pincode: text(10).optional().default(''),
    lat: z.coerce.number().min(-90).max(90).optional(),
    lng: z.coerce.number().min(-180).max(180).optional(),
  }).optional().default({}),
});

const STATUS_TEXT = {
  new: 'received',
  paid: 'payment received',
  confirmed: 'confirmed by the store',
  preparing: 'being prepared',
  ready: 'ready',
  out_for_delivery: 'out for delivery',
  completed: 'completed',
  rejected: 'declined by the store',
  cancelled: 'cancelled',
};

const itemLines = (inq) => (inq.items || []).map((i) => `- ${i.quantity} x ${i.name}${i.size ? ` (${i.size})` : ''}`).join('\n');
const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

function mailFor(inq, store, event) {
  const where = inq.fulfilment === 'delivery'
    ? `Delivery to: ${[inq.address?.street, inq.address?.landmark, inq.address?.city, inq.address?.pincode].filter(Boolean).join(', ')}`
    : `Collect from: ${store?.storeName || 'the store'}${store?.address ? `, ${store.address}` : ''}`;
  const head = `Hi ${inq.name},`;
  const ref = `Reference: ${inq.reference}`;
  const lines = {
    new: [head, '', `We have received your bulk order request at ${store?.storeName || 'our store'}. The store will review it and confirm shortly.`, ref, where, itemLines(inq), inq.estimatedTotal != null ? `Estimated total: ${money(inq.estimatedTotal)}` : '', inq.eventDate ? `Date: ${inq.eventDate}${inq.eventTime ? ` ${inq.eventTime}` : ''}` : ''],
    confirmed: [head, '', `${store?.storeName || 'The store'} has confirmed your bulk order.`, ref, inq.quotedAmount != null ? (inq.paymentMethod === 'online' ? `Amount: ${money(inq.quotedAmount)}. Please pay online from My Orders in the app so the store can start preparing.` : `Amount: ${money(inq.quotedAmount)} (pay by cash or UPI when you ${inq.fulfilment === 'delivery' ? 'receive' : 'collect'} the order)`) : '', inq.storeNote ? `Note from the store: ${inq.storeNote}` : '', where],
    preparing: [head, '', 'Your bulk order is being prepared.', ref, where],
    paid: [head, '', `We received your online payment of ${money(inq.payment?.amount)}. The store will review your request and confirm.`, ref],
    out_for_delivery: [head, '', 'Your bulk order is on its way to you.', ref, where],
    ready: [head, '', inq.fulfilment === 'delivery' ? 'Your bulk order is ready and will be delivered to you shortly.' : 'Your bulk order is ready. You can collect it now.', ref, where],
    completed: [head, '', inq.fulfilment === 'delivery' ? 'Your bulk order has been delivered. Enjoy!' : 'Your bulk order has been handed over. Enjoy!', ref],
    rejected: [head, '', 'Sorry, the store could not take your bulk order.', inq.reasonText ? `Reason: ${inq.reasonText}` : '', ref, 'You can place the request again at another store.'],
    cancelled: [head, '', 'Your bulk order has been cancelled.', inq.reasonText ? `Reason: ${inq.reasonText}` : '', ref],
  };
  return { subject: `Bulk order ${inq.reference}: ${STATUS_TEXT[event] || event}`, text: (lines[event] || [head, '', `Your bulk order is ${STATUS_TEXT[event] || event}.`, ref]).filter((l) => l !== '').join('\n') };
}

/** Email the customer about this step. Never blocks or fails the request. */
async function notifyCustomer(inq, event) {
  try {
    const store = inq.storeId ? await FoodStore.findById(inq.storeId).select('storeName address').lean() : null;
    const mail = mailFor(inq, store, event);
    const sent = await sendEmail({ to: inq.email, ...mail });
    if (!sent) logger.warn(`[BulkOrder] email not sent for ${inq.reference} (${event})`);
  } catch (err) {
    logger.error(`[BulkOrder] email failed for ${inq.reference}: ${err.message}`);
  }
  try {
    const io = getIO();
    const payload = { id: String(inq._id), reference: inq.reference, status: inq.status };
    if (inq.userId) io?.to(rooms.user(String(inq.userId))).emit('bulk_order_update', payload);
    if (inq.storeId) io?.to(rooms.store(String(inq.storeId))).emit('bulk_order_update', payload);
  } catch (_) { /* a socket problem never blocks the order */ }
}

const referenceNumber = () => `BO-${crypto.randomInt(100000, 1000000)}`;

export async function createBulkOrder(body, userId = null) {
  const parsed = inquirySchema.safeParse(body || {});
  if (!parsed.success) throw new ValidationError(parsed.error.issues[0]?.message || 'Check the form and try again');
  const d = parsed.data;
  const signedIn = userId && mongoose.Types.ObjectId.isValid(String(userId));

  let store = null;
  if (d.type !== 'egift_voucher') {
    // a bulk order at a store becomes a real order (payment, rider, proof of delivery), which needs a customer account
    if (!signedIn) throw new ValidationError('Please sign in to place a bulk order.');
    if (!d.storeId) throw new ValidationError('Choose a store near you');
    store = await FoodStore.findOne({ _id: d.storeId, isActive: true, approvalStatus: { $in: ['Approved', 'approved'] } }).select('storeName address franchiseId').lean();
    if (!store) throw new ValidationError('This store is not taking orders right now. Please choose another.');
    if (d.fulfilment === 'delivery' && (!d.address.street || !d.address.city)) throw new ValidationError('Enter the delivery address (street and city)');
    if (d.items.length === 0) throw new ValidationError('Choose at least one item');
  }

  // The items are priced here, at the chosen store's prices; the client's prices are never used
  let pricedItems = [];
  let estimatedTotal = null;
  if (store && d.items.length) {
    const merged = new Map();
    for (const it of d.items) {
      const key = `${it.itemId}|${it.size}|${it.crust}`;
      merged.set(key, merged.has(key) ? { ...it, quantity: merged.get(key).quantity + it.quantity } : it);
    }
    const priced = await priceCartItems(null, [...merged.values()].map((it) => ({ ...it, name: '', price: 0, kind: 'product' })), { storeId: store._id });
    const names = new Map((await Product.find({ _id: { $in: priced.items.map((it) => it.itemId) } }).select('name').lean()).map((pr) => [String(pr._id), pr.name]));
    pricedItems = priced.items.map((it) => ({ itemId: String(it.itemId), name: names.get(String(it.itemId)) || it.name, size: it.size || '', crust: it.crust || '', price: it.price, quantity: it.quantity }));
    estimatedTotal = priced.subtotal;
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const inq = await BulkOrderInquiry.create({
        name: d.name, organisation: d.organisation, phone: d.phone, email: d.email, location: d.location,
        eventDate: d.eventDate, eventTime: d.eventTime, occasion: d.occasion || d.partySize || d.eventDate || 'Date Selected', partySize: d.partySize,
        query: d.query, items: pricedItems, estimatedTotal, type: d.type, status: 'new', reference: referenceNumber(),
        userId: signedIn ? userId : null,
        ...(store ? { storeId: store._id, franchiseId: store.franchiseId, fulfilment: d.fulfilment, paymentMethod: d.paymentMethod, address: d.fulfilment === 'delivery' ? { ...d.address, lat: d.address.lat ?? null, lng: d.address.lng ?? null } : {} } : {}),
        history: [{ status: 'new', byRole: 'CUSTOMER', note: 'Request placed' }],
      });
      notifyCustomer(inq, 'new');
      if (inq.storeId) {
        try { getIO()?.to(rooms.store(String(inq.storeId))).emit('bulk_order_new', { id: String(inq._id), reference: inq.reference }); } catch (_) { /* ignore */ }
      }
      return (await hydrate([inq.toObject()]))[0];
    } catch (err) {
      if (err?.code === 11000 && /reference/.test(String(err.message))) continue;
      throw err;
    }
  }
  throw new ValidationError('Could not place the request. Please try again.');
}

// ---------------------------------------------------------------------------------------------
// The real order behind a confirmed bulk order: its status, rider and payment are what the screens show.
// ---------------------------------------------------------------------------------------------
const PAID = ['paid', 'captured', 'authorized'];
const FROM_ORDER = {
  confirmed: 'confirmed',
  preparing: 'preparing',
  ready_for_pickup: 'ready',
  reached_pickup: 'ready',
  picked_up: 'out_for_delivery',
  reached_drop: 'out_for_delivery',
  delivered: 'completed',
  cancelled_by_user: 'cancelled',
  cancelled_by_store: 'cancelled',
  cancelled_by_admin: 'cancelled',
};
const TERMINAL = ['completed', 'cancelled', 'rejected'];

/** What the linked order says, applied to the bulk order (once per change, with an email). */
async function syncFromOrder(row, linked) {
  if (!linked || TERMINAL.includes(row.status)) return row;
  const next = FROM_ORDER[linked.orderStatus];
  if (!next || next === row.status) return row;
  const note = next === 'completed' ? (row.fulfilment === 'delivery' ? 'Delivered to the customer' : 'Handed over to the customer') : '';
  const updated = await BulkOrderInquiry.findOneAndUpdate(
    { _id: row._id, status: row.status },
    { $set: { status: next }, $push: { history: { status: next, at: new Date(), byRole: 'SYSTEM', byId: '', note } } },
    { new: true }
  );
  if (!updated) return row; // another request got there first
  notifyCustomer(updated, next);
  return updated.toObject();
}

/** The linked orders (status, payment, rider) for a list of bulk orders. */
export async function hydrate(rows) {
  const ids = rows.filter((r) => r.orderId).map((r) => r.orderId);
  const orders = ids.length
    ? await FoodOrder.find({ _id: { $in: ids } }).select('orderStatus payment dispatch order_id deliveryState').populate('dispatch.deliveryPartnerId', 'name phone').lean()
    : [];
  const byId = new Map(orders.map((o) => [String(o._id), o]));
  const out = [];
  for (const raw of rows) {
    const linked = raw.orderId ? byId.get(String(raw.orderId)) : null;
    const row = await syncFromOrder(raw, linked);
    out.push(shape(row, null, linked));
  }
  return out;
}
/** The fields screens show. `linked` is the real order behind a confirmed bulk order (its payment and rider). */
export function shape(inq, store = null, linked = null) {
  const s = store || (inq.storeId && typeof inq.storeId === 'object' && inq.storeId.storeName ? inq.storeId : null);
  const partner = linked?.dispatch?.deliveryPartnerId && typeof linked.dispatch.deliveryPartnerId === 'object' ? linked.dispatch.deliveryPartnerId : null;
  const online = inq.paymentMethod === 'online';
  const paid = linked ? PAID.includes(String(linked.payment?.status || '').toLowerCase()) : false;
  return {
    id: String(inq._id),
    _id: String(inq._id),
    reference: inq.reference || '',
    type: inq.type,
    status: inq.status,
    name: inq.name,
    organisation: inq.organisation || '',
    phone: inq.phone,
    email: inq.email,
    location: inq.location || '',
    eventDate: inq.eventDate || '',
    eventTime: inq.eventTime || '',
    partySize: inq.partySize || '',
    occasion: inq.occasion || '',
    query: inq.query || '',
    fulfilment: inq.fulfilment || 'takeaway',
    address: inq.address || {},
    storeId: inq.storeId ? String(inq.storeId._id || inq.storeId) : null,
    storeName: s?.storeName || '',
    storeAddress: s?.address || '',
    storePhone: s?.phone || '',
    items: (inq.items || []).map((i) => ({ itemId: i.itemId, name: i.name, size: i.size || '', crust: i.crust || '', price: i.price, quantity: i.quantity, lineTotal: Math.round(i.price * i.quantity * 100) / 100 })),
    estimatedTotal: inq.estimatedTotal ?? null,
    quotedAmount: inq.quotedAmount ?? null,
    storeNote: inq.storeNote || '',
    reasonText: inq.reasonText || '',
    adminNotes: inq.adminNotes || '',
    paymentMethod: inq.paymentMethod || 'cod',
    // paid when the customer paid online, or when the rider / store recorded the cash; otherwise still to pay
    paymentStatus: inq.type === 'egift_voucher' ? '' : (inq.payment?.status === 'refunded' ? 'refunded' : (paid || inq.payment?.status === 'paid') ? 'paid' : 'pending'),
    canPayOnline: online && inq.status === 'new' && inq.payment?.status !== 'paid',
    paidOnline: inq.payment?.status === 'paid' ? { amount: inq.payment.amount, at: inq.payment.paidAt } : null,
    orderId: inq.orderId ? String(inq.orderId) : null,
    rider: partner ? { name: partner.name || '', phone: partner.phone || '', status: linked.dispatch?.status || '' } : null,
    history: (inq.history || []).map((h) => ({ status: h.status, at: h.at, byRole: h.byRole, note: h.note || '' })),
    createdAt: inq.createdAt,
    updatedAt: inq.updatedAt,
  };
}

const oid = (id) => {
  if (!mongoose.Types.ObjectId.isValid(String(id || ''))) throw new NotFoundError('Bulk order not found');
  return new mongoose.Types.ObjectId(String(id));
};

const populateStore = (q) => q.populate('storeId', 'storeName address phone');

// ---- customer
export async function listMine(userId) {
  const rows = await populateStore(BulkOrderInquiry.find({ userId: oid(userId) }).sort({ createdAt: -1 }).limit(50)).lean();
  return hydrate(rows);
}

export async function getMine(userId, id) {
  const row = await populateStore(BulkOrderInquiry.findOne({ _id: oid(id), userId: oid(userId) })).lean();
  if (!row) throw new NotFoundError('Bulk order not found');
  return (await hydrate([row]))[0];
}

async function moveTo(filter, next, { byRole, byId, note = '', set = {} }) {
  const inq = await BulkOrderInquiry.findOneAndUpdate(
    filter,
    { $set: { status: next, ...set }, $push: { history: { status: next, at: new Date(), byRole, byId: String(byId || ''), note } } },
    { new: true }
  );
  return inq;
}

export async function cancelMine(userId, id) {
  const inq = await moveTo({ _id: oid(id), userId: oid(userId), status: 'new' }, 'cancelled', { byRole: 'CUSTOMER', byId: userId, note: 'Cancelled by the customer', set: { reasonText: 'Cancelled by the customer' } });
  if (!inq) throw new ValidationError('Only a request the store has not confirmed yet can be cancelled.');
  await refundOnlinePayment(inq);
  notifyCustomer(inq, 'cancelled');
  return getMine(userId, id);
}

/**
 * Pay online: a Razorpay order for the estimated total, made when the customer places the request (or later from My
 * Orders). The customer then sends the Razorpay answer to verifyOnlinePayment.
 */
export async function startOnlinePayment(userId, id) {
  const row = await BulkOrderInquiry.findOne({ _id: oid(id), userId: oid(userId) }).lean();
  if (!row) throw new NotFoundError('Bulk order not found');
  if (row.paymentMethod !== 'online') throw new ValidationError('This order is paid in cash.');
  if (row.status !== 'new') throw new ValidationError('This order can no longer be paid.');
  if (row.payment?.status === 'paid') throw new ValidationError('This order is already paid.');
  if (!isRazorpayConfigured()) throw new ValidationError('Online payment is not available right now.');
  const amount = Math.round((Number(row.estimatedTotal) || 0) * 100) / 100;
  const amountPaise = Math.round(amount * 100);
  if (amountPaise < 100) throw new ValidationError('Amount too low for online payment');
  let rz;
  try {
    rz = await createRazorpayOrder(amountPaise, 'INR', `bulk_${row.reference}`);
  } catch (err) {
    throw new ValidationError(err?.message || 'Payment gateway error');
  }
  await BulkOrderInquiry.updateOne({ _id: row._id, 'payment.status': { $ne: 'paid' } }, { $set: { 'payment.status': 'created', 'payment.razorpayOrderId': rz.id, 'payment.amount': amount } });
  return { razorpay: { key: getRazorpayKeyId(), orderId: rz.id, amount: rz.amount, currency: rz.currency || 'INR' } };
}

/** The customer paid: check the proof with Razorpay (right order, right amount, captured) and mark it paid, once. */
export async function verifyOnlinePayment(userId, id, dto = {}) {
  const row = await BulkOrderInquiry.findOne({ _id: oid(id), userId: oid(userId) }).lean();
  if (!row) throw new NotFoundError('Bulk order not found');
  const expected = String(row.payment?.razorpayOrderId || '');
  if (row.payment?.status === 'paid') {
    if (expected && dto.razorpayOrderId === expected && dto.razorpayPaymentId === row.payment.paymentId) return getMine(userId, id);
    throw new ValidationError('This order is already paid.');
  }
  if (!expected || row.paymentMethod !== 'online') throw new ValidationError('This order is not waiting for an online payment.');
  if (['cancelled', 'rejected'].includes(row.status)) throw new ValidationError('This order can no longer be paid.');
  if (dto.razorpayOrderId !== expected) throw new ValidationError('Payment verification failed');
  if (!verifyPaymentSignature(expected, dto.razorpayPaymentId, dto.razorpaySignature)) throw new ValidationError('Payment verification failed');
  let rz;
  try {
    rz = await fetchRazorpayPayment(dto.razorpayPaymentId);
  } catch {
    throw new ValidationError('Could not confirm the payment with the gateway. Please try again.');
  }
  const paise = Math.round(Number(row.payment.amount) * 100);
  if (!rz || String(rz.order_id || '') !== expected || !['captured', 'authorized'].includes(String(rz.status || '')) || Number(rz.amount) !== paise || String(rz.currency || 'INR').toUpperCase() !== 'INR') {
    throw new ValidationError('Payment verification failed');
  }
  const claimed = await BulkOrderInquiry.findOneAndUpdate(
    { _id: row._id, 'payment.status': { $ne: 'paid' } },
    { $set: { 'payment.status': 'paid', 'payment.paymentId': dto.razorpayPaymentId, 'payment.paidAt': new Date() }, $push: { history: { status: row.status, at: new Date(), byRole: 'CUSTOMER', byId: String(userId), note: `Paid ₹${row.payment.amount} online` } } },
    { new: true }
  );
  if (claimed) {
    notifyCustomer(claimed, 'paid');
    try { getIO()?.to(rooms.store(String(claimed.storeId))).emit('bulk_order_new', { id: String(claimed._id), reference: claimed.reference }); } catch (_) { /* ignore */ }
  }
  return getMine(userId, id);
}

/** An online payment that has to go back (the request was declined or cancelled before an order was made). */
async function refundOnlinePayment(inq) {
  if (inq.payment?.status !== 'paid' || !inq.payment.paymentId) return;
  try {
    const res = await initiateRazorpayRefund(inq.payment.paymentId, inq.payment.amount);
    await BulkOrderInquiry.updateOne({ _id: inq._id }, { $set: { 'payment.status': res?.success ? 'refunded' : 'refund_failed', 'payment.refundId': res?.refundId || '' } });
    if (!res?.success) logger.error(`[BulkOrder] refund failed for ${inq.reference}: ${res?.error || 'unknown'}`);
  } catch (err) {
    await BulkOrderInquiry.updateOne({ _id: inq._id }, { $set: { 'payment.status': 'refund_failed' } });
    logger.error(`[BulkOrder] refund failed for ${inq.reference}: ${err.message}`);
  }
}

/** Called when the linked order changes (rider steps, handover): brings the bulk order up to date and emails the customer. */
export async function syncBulkForOrder(orderId) {
  if (!mongoose.Types.ObjectId.isValid(String(orderId || ''))) return;
  const row = await BulkOrderInquiry.findOne({ orderId: oid(orderId) }).lean();
  if (!row) return;
  const linked = await FoodOrder.findById(orderId).select('orderStatus payment dispatch').lean();
  await syncFromOrder(row, linked);
}
export const syncBulkForOrderSafely = (orderId) => syncBulkForOrder(orderId).catch((e) => logger.error(`[BulkOrder] sync failed for order ${orderId}: ${e.message}`));

// ---- store manager
const role = (u) => String(u?.role || '').trim().replace(/-/g, '_').toUpperCase();
function managerStore(user) {
  if (role(user) !== 'STORE_MANAGER') throw new ForbiddenError('Only the store manager can do this.');
  if (!mongoose.Types.ObjectId.isValid(String(user.storeId || ''))) throw new ForbiddenError('No store is linked to your account.');
  return oid(user.storeId);
}

export async function listForStore(user, { status, search } = {}) {
  const storeId = managerStore(user);
  const filter = { storeId };
  const s = String(search || '').trim().slice(0, 60);
  if (s) { const rx = new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'); filter.$or = [{ name: rx }, { reference: rx }, { phone: rx }, { organisation: rx }]; }
  const rows = await populateStore(BulkOrderInquiry.find(filter).sort({ createdAt: -1 }).limit(200)).lean();
  // statuses follow the real order, so the list is brought up to date before it is filtered and counted
  const all = await hydrate(rows);
  const counts = {};
  for (const o of all) counts[o.status] = (counts[o.status] || 0) + 1;
  return { orders: status && status !== 'all' ? all.filter((o) => o.status === String(status)) : all, counts };
}

export async function getForStore(user, id) {
  const storeId = managerStore(user);
  const row = await populateStore(BulkOrderInquiry.findOne({ _id: oid(id), storeId })).lean();
  if (!row) throw new NotFoundError('Bulk order not found');
  return (await hydrate([row]))[0];
}

const actor = (user) => ({ byRole: 'STORE_MANAGER', byId: user.userId });

async function ownRow(user, id) {
  const storeId = managerStore(user);
  const row = await BulkOrderInquiry.findOne({ _id: oid(id), storeId }).lean();
  if (!row) throw new NotFoundError('Bulk order not found');
  return { storeId, row };
}

export async function storeConfirm(user, id, { quotedAmount, note } = {}) {
  const storeId = managerStore(user);
  let amount = null;
  if (quotedAmount !== undefined && quotedAmount !== null && quotedAmount !== '') {
    amount = Number(quotedAmount);
    if (!Number.isFinite(amount) || amount < 0 || amount > 10000000) throw new ValidationError('Enter a valid amount.');
  }
  if (amount === null) {
    const current = await BulkOrderInquiry.findOne({ _id: oid(id), storeId }).select('estimatedTotal').lean();
    if (current?.estimatedTotal != null) amount = current.estimatedTotal; // the amount from the items, unless the store names another
  }
  // An online order is confirmed only once the customer has paid, and for exactly what they paid
  const own = await BulkOrderInquiry.findOne({ _id: oid(id), storeId }).select('paymentMethod payment').lean();
  if (own?.paymentMethod === 'online') {
    if (own.payment?.status !== 'paid') throw new ValidationError("The customer chose to pay online. Wait for their payment before confirming.");
    amount = own.payment.amount;
  }
  if (amount === null) throw new ValidationError('Enter the amount the customer has to pay.');
  const inq = await moveTo({ _id: oid(id), storeId, status: 'new' }, 'confirmed', { ...actor(user), note: String(note || '').slice(0, 300), set: { quotedAmount: amount, storeNote: String(note || '').trim().slice(0, 300) } });
  if (!inq) throw new ValidationError('Only a new request can be confirmed.');

  // The real order: the kitchen, rider, payment and proof of delivery all run on it
  try {
    const store = await FoodStore.findById(storeId).lean();
    const order = await createOrderFromBulkOrder(inq.toObject(), store);
    await BulkOrderInquiry.updateOne({ _id: inq._id }, { $set: { orderId: order._id } });
    inq.orderId = order._id;
  } catch (err) {
    // no order was made: the request goes back to new so it can be confirmed again
    await BulkOrderInquiry.updateOne({ _id: inq._id }, { $set: { status: 'new', quotedAmount: null, storeNote: '' }, $pop: { history: 1 } });
    throw err;
  }
  notifyCustomer(inq, 'confirmed');
  return getForStore(user, id);
}

export async function storeReject(user, id, reason) {
  const storeId = managerStore(user);
  const why = String(reason || '').trim();
  if (!why) throw new ValidationError('Give a reason so the customer knows why.');
  const inq = await moveTo({ _id: oid(id), storeId, status: 'new' }, 'rejected', { ...actor(user), note: why.slice(0, 300), set: { reasonText: why.slice(0, 300) } });
  if (!inq) throw new ValidationError('Only a new request can be declined.');
  await refundOnlinePayment(inq);
  notifyCustomer(inq, 'rejected');
  return getForStore(user, id);
}

/** preparing -> ready: the steps run on the linked order (a delivery needs a rider assigned before it is ready). */
export async function storeAdvance(user, id, to) {
  const { storeId, row } = await ownRow(user, id);
  if (!['preparing', 'ready', 'completed'].includes(to)) throw new ValidationError('That is not a valid next step.');
  if (!row.orderId) throw new ValidationError('Confirm the order first.');
  const linked = await FoodOrder.findById(row.orderId).select('orderStatus payment dispatch isPickup').lean();
  if (!linked) throw new NotFoundError('The order behind this bulk order was not found.');

  if (to === 'preparing') {
    if (row.status !== 'confirmed') throw new ValidationError('This order has to be confirmed before it can be prepared.');
    if (row.paymentMethod === 'online' && !PAID.includes(String(linked.payment?.status || '').toLowerCase())) {
      throw new ValidationError('The customer has chosen to pay online. Wait for the payment before preparing.');
    }
    await updateOrderStatusStore(String(row.orderId), String(storeId), 'preparing', 'Bulk order: preparing');
  } else if (to === 'ready') {
    if (row.status !== 'preparing') throw new ValidationError('This order has to be prepared before it can be marked ready.');
    if (row.fulfilment === 'delivery' && !linked.dispatch?.deliveryPartnerId) {
      throw new ValidationError('Assign a delivery partner before marking a delivery order ready.');
    }
    await updateOrderStatusStore(String(row.orderId), String(storeId), 'ready_for_pickup', 'Bulk order: ready');
  } else {
    if (row.status !== 'ready') throw new ValidationError('This order has to be ready before it is handed over.');
    if (row.fulfilment === 'delivery') throw new ValidationError('A delivery is completed by the delivery partner with the customer\'s code and a handover photo.');
    // takeaway: the store hands it over (cash is recorded as collected at the counter)
    const { confirmPickup } = await import('../../store/services/storeDelivery.service.js');
    await confirmPickup(user, String(row.orderId), {});
  }
  await syncBulkForOrder(row.orderId);
  return getForStore(user, id);
}

/** Cancel an order the store cannot make. Allowed until the rider has picked it up; an online payment goes back to the customer's wallet. */
export async function storeCancel(user, id, reason) {
  const { storeId, row } = await ownRow(user, id);
  const why = String(reason || '').trim();
  if (!why) throw new ValidationError('Give a reason so the customer knows why.');
  if (!['confirmed', 'preparing', 'ready'].includes(row.status)) throw new ValidationError('Only a confirmed order that has not left the store can be cancelled.');
  if (row.orderId) {
    await updateOrderStatusStore(String(row.orderId), String(storeId), 'cancelled_by_store', why.slice(0, 300));
    const linked = await FoodOrder.findById(row.orderId).lean();
    if (linked && PAID.includes(String(linked.payment?.status || '').toLowerCase()) && String(linked.payment?.method) !== 'cash') {
      const { refundCancelledOrderToWallet } = await import('../../../../core/payments/refund.service.js');
      await refundCancelledOrderToWallet(linked, { description: `Refund for cancelled bulk order ${row.reference}`, reason: why });
    }
  }
  const inq = await BulkOrderInquiry.findOneAndUpdate(
    { _id: row._id, status: { $in: ['confirmed', 'preparing', 'ready', 'cancelled'] } },
    { $set: { status: 'cancelled', reasonText: why.slice(0, 300) }, $push: { history: { status: 'cancelled', at: new Date(), ...actor(user), note: why.slice(0, 300) } } },
    { new: true }
  );
  if (inq && row.status !== 'cancelled') notifyCustomer(inq, 'cancelled');
  return getForStore(user, id);
}

/** Delivery partners the store can assign to this bulk order's delivery. */
export async function ridersForBulk(user, id) {
  const { row } = await ownRow(user, id);
  if (row.fulfilment !== 'delivery' || !row.orderId) throw new ValidationError('This order has no delivery to assign.');
  const { availableRiders } = await import('../../store/services/storeDelivery.service.js');
  return availableRiders(user, {});
}

export async function assignRiderToBulk(user, id, riderId) {
  const { row } = await ownRow(user, id);
  if (row.fulfilment !== 'delivery' || !row.orderId) throw new ValidationError('This order has no delivery to assign.');
  if (!['confirmed', 'preparing', 'ready'].includes(row.status)) throw new ValidationError('A rider can only be assigned before the order is picked up.');
  const { assignRider } = await import('../../store/services/storeDelivery.service.js');
  await assignRider(user, { orderId: String(row.orderId), riderId: String(riderId || '') }, {});
  return getForStore(user, id);
}

// ---- franchise admin: view only
export async function listForFranchise(user, { status, storeId } = {}) {
  if (role(user) !== 'FRANCHISE_ADMIN') throw new ForbiddenError('Only a franchise admin can do this.');
  if (!mongoose.Types.ObjectId.isValid(String(user.franchiseId || ''))) throw new ForbiddenError('No franchise is linked to your account.');
  const filter = { franchiseId: oid(user.franchiseId) };
  if (storeId && mongoose.Types.ObjectId.isValid(String(storeId))) filter.storeId = oid(storeId);
  const rows = await populateStore(BulkOrderInquiry.find(filter).sort({ createdAt: -1 }).limit(200)).lean();
  const all = await hydrate(rows);
  return status && status !== 'all' ? all.filter((o) => o.status === String(status)) : all;
}
