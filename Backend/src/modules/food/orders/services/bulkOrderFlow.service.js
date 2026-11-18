import mongoose from 'mongoose';
import crypto from 'node:crypto';
import { z } from 'zod';
import { BulkOrderInquiry } from '../models/bulkOrderInquiry.model.js';
import { Product } from '../../admin/models/product.model.js';
import { FoodStore } from '../../store/models/store.model.js';
import { ForbiddenError, NotFoundError, ValidationError } from '../../../../core/auth/errors.js';
import { priceCartItems } from './catalog-pricing.service.js';
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
  storeId: z.string().regex(ID_RE, 'Choose a store').optional(),
  address: z.object({
    street: text(200).optional().default(''),
    landmark: text(120).optional().default(''),
    city: text(80).optional().default(''),
    state: text(80).optional().default(''),
    pincode: text(10).optional().default(''),
  }).optional().default({}),
});

const STATUS_TEXT = {
  new: 'received',
  confirmed: 'confirmed by the store',
  preparing: 'being prepared',
  ready: 'ready',
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
    confirmed: [head, '', `${store?.storeName || 'The store'} has confirmed your bulk order.`, ref, inq.quotedAmount != null ? `Amount: ${money(inq.quotedAmount)} (pay when you ${inq.fulfilment === 'delivery' ? 'receive' : 'collect'} the order)` : '', inq.storeNote ? `Note from the store: ${inq.storeNote}` : '', where],
    preparing: [head, '', 'Your bulk order is being prepared.', ref, where],
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

  let store = null;
  if (d.type !== 'egift_voucher') {
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
        userId: userId && mongoose.Types.ObjectId.isValid(String(userId)) ? userId : null,
        ...(store ? { storeId: store._id, franchiseId: store.franchiseId, fulfilment: d.fulfilment, address: d.fulfilment === 'delivery' ? d.address : {} } : {}),
        history: [{ status: 'new', byRole: 'CUSTOMER', note: 'Request placed' }],
      });
      notifyCustomer(inq, 'new');
      if (inq.storeId) {
        try { getIO()?.to(rooms.store(String(inq.storeId))).emit('bulk_order_new', { id: String(inq._id), reference: inq.reference }); } catch (_) { /* ignore */ }
      }
      return shape(inq.toObject(), store);
    } catch (err) {
      if (err?.code === 11000 && /reference/.test(String(err.message))) continue;
      throw err;
    }
  }
  throw new ValidationError('Could not place the request. Please try again.');
}

/** The fields screens show. */
export function shape(inq, store = null) {
  const s = store || (inq.storeId && typeof inq.storeId === 'object' && inq.storeId.storeName ? inq.storeId : null);
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
  return rows.map((r) => shape(r));
}

export async function getMine(userId, id) {
  const row = await populateStore(BulkOrderInquiry.findOne({ _id: oid(id), userId: oid(userId) })).lean();
  if (!row) throw new NotFoundError('Bulk order not found');
  return shape(row);
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
  notifyCustomer(inq, 'cancelled');
  return getMine(userId, id);
}

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
  if (status && status !== 'all') filter.status = String(status);
  const s = String(search || '').trim().slice(0, 60);
  if (s) { const rx = new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'); filter.$or = [{ name: rx }, { reference: rx }, { phone: rx }, { organisation: rx }]; }
  const [rows, counts] = await Promise.all([
    populateStore(BulkOrderInquiry.find(filter).sort({ createdAt: -1 }).limit(200)).lean(),
    BulkOrderInquiry.aggregate([{ $match: { storeId } }, { $group: { _id: '$status', n: { $sum: 1 } } }]),
  ]);
  return { orders: rows.map((r) => shape(r)), counts: Object.fromEntries(counts.map((c) => [c._id, c.n])) };
}

export async function getForStore(user, id) {
  const storeId = managerStore(user);
  const row = await populateStore(BulkOrderInquiry.findOne({ _id: oid(id), storeId })).lean();
  if (!row) throw new NotFoundError('Bulk order not found');
  return shape(row);
}

const actor = (user) => ({ byRole: 'STORE_MANAGER', byId: user.userId });

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
  const inq = await moveTo({ _id: oid(id), storeId, status: 'new' }, 'confirmed', { ...actor(user), note: String(note || '').slice(0, 300), set: { quotedAmount: amount, storeNote: String(note || '').trim().slice(0, 300) } });
  if (!inq) throw new ValidationError('Only a new request can be confirmed.');
  notifyCustomer(inq, 'confirmed');
  return getForStore(user, id);
}

export async function storeReject(user, id, reason) {
  const storeId = managerStore(user);
  const why = String(reason || '').trim();
  if (!why) throw new ValidationError('Give a reason so the customer knows why.');
  const inq = await moveTo({ _id: oid(id), storeId, status: 'new' }, 'rejected', { ...actor(user), note: why.slice(0, 300), set: { reasonText: why.slice(0, 300) } });
  if (!inq) throw new ValidationError('Only a new request can be declined.');
  notifyCustomer(inq, 'rejected');
  return getForStore(user, id);
}

const NEXT = { confirmed: 'preparing', preparing: 'ready', ready: 'completed' };
export async function storeAdvance(user, id, to) {
  const storeId = managerStore(user);
  const from = Object.keys(NEXT).find((k) => NEXT[k] === to);
  if (!from) throw new ValidationError('That is not a valid next step.');
  const inq = await moveTo({ _id: oid(id), storeId, status: from }, to, actor(user));
  if (!inq) throw new ValidationError(`This order has to be ${STATUS_TEXT[from]} before it can be marked ${to}.`);
  notifyCustomer(inq, to);
  return getForStore(user, id);
}

export async function storeCancel(user, id, reason) {
  const storeId = managerStore(user);
  const why = String(reason || '').trim();
  if (!why) throw new ValidationError('Give a reason so the customer knows why.');
  const inq = await BulkOrderInquiry.findOneAndUpdate(
    { _id: oid(id), storeId, status: { $in: ['confirmed', 'preparing', 'ready'] } },
    { $set: { status: 'cancelled', reasonText: why.slice(0, 300) }, $push: { history: { status: 'cancelled', at: new Date(), ...actor(user), byId: String(user.userId), note: why.slice(0, 300) } } },
    { new: true }
  );
  if (!inq) throw new ValidationError('Only a confirmed order can be cancelled by the store.');
  notifyCustomer(inq, 'cancelled');
  return getForStore(user, id);
}

// ---- franchise admin: view only
export async function listForFranchise(user, { status, storeId } = {}) {
  if (role(user) !== 'FRANCHISE_ADMIN') throw new ForbiddenError('Only a franchise admin can do this.');
  if (!mongoose.Types.ObjectId.isValid(String(user.franchiseId || ''))) throw new ForbiddenError('No franchise is linked to your account.');
  const filter = { franchiseId: oid(user.franchiseId) };
  if (status && status !== 'all') filter.status = String(status);
  if (storeId && mongoose.Types.ObjectId.isValid(String(storeId))) filter.storeId = oid(storeId);
  const rows = await populateStore(BulkOrderInquiry.find(filter).sort({ createdAt: -1 }).limit(200)).lean();
  return rows.map((r) => shape(r));
}
