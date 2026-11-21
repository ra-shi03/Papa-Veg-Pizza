import { loadMethods } from '../../settings/services/orderMethods.service.js';
import mongoose from 'mongoose';
import { FoodOrder } from '../../orders/models/order.model.js';
import { KitchenTask } from '../models/kitchenTask.model.js';
import { notifyUsers } from './kitchenTasks.service.js';
import { FoodStore } from '../../store/models/store.model.js';
import { StoreManager } from '../../franchise/models/storeManager.model.js';
import { UserRole } from '../../../../core/roles/models/userRole.model.js';
import { Role } from '../../../../core/roles/models/role.model.js';
import { updateOrderStatusStore } from '../../orders/services/order.service.js';
import { pushStatusHistory } from '../../orders/services/order.helpers.js';
import { Refund } from '../../../../core/payments/models/refund.model.js';
import { FoodDeliveryPartner } from '../../delivery/models/deliveryPartner.model.js';
import { FoodCoupon } from '../../settings/models/foodCoupon.model.js';
import { FoodOfferUsage } from '../../admin/models/offerUsage.model.js';
import { getIO, rooms } from '../../../../config/socket.js';
import { ForbiddenError, NotFoundError, ValidationError } from '../../../../core/auth/errors.js';
import { onDutyStaffIds, requirePresent } from './attendancePresence.js';

// ---------------------------------------------------------------------------------------------
// Roles & vocabulary
// ---------------------------------------------------------------------------------------------

export const normalizeRole = (role) => String(role || '').trim().replace(/-/g, '_').toUpperCase();

export const STAFF_SLOTS = ['pizza_chef', 'baking_chef', 'packaging_staff'];
const MAX_WORKLOAD = 4; // live orders one person can hold before showing as busy
export const STAGE_ORDER = ['pending', 'preparing', 'baking', 'packaging', 'ready'];
const CANCELLED = ['cancelled_by_user', 'cancelled_by_store', 'cancelled_by_admin'];

const VIEW_STATUSES = {
  incoming: ['created'],
  active: ['confirmed', 'preparing'],
  ready: ['ready_for_pickup', 'reached_pickup'],
  completed: ['picked_up', 'reached_drop', 'delivered'],
  cancelled: CANCELLED,
};

// Staff titles are free text on the staff profile; map them onto the three kitchen stations.
// 'kitchen_supervisor' is still recognised so a left-over supervisor record is refused as an assignee; the role itself is
// no longer part of the flow (docs/supervisor-removal.md).
export const uiRoleOf = (title) => {
  const t = String(title || '').toLowerCase();
  if (t.includes('supervisor')) return 'kitchen_supervisor';
  if (t.includes('manager')) return 'store_manager';
  if (t.includes('bak')) return 'baking_chef';
  if (t.includes('packag')) return 'packaging_staff';
  return 'pizza_chef';
};

// System role code per user (STORE_MANAGER / KITCHEN_STAFF; KITCHEN_SUPERVISOR for left-over records) from the roles collections.
const systemRoleCodes = async (userIds) => {
  const links = await UserRole.find({ userId: { $in: userIds } }).select('userId roleId').lean();
  const roles = await Role.find({ _id: { $in: links.map((l) => l.roleId) } }).select('code').lean();
  const codeById = new Map(roles.map((r) => [String(r._id), normalizeRole(r.code)]));
  const byUser = new Map();
  links.forEach((l) => {
    const code = codeById.get(String(l.roleId));
    if (code) byUser.set(String(l.userId), code);
  });
  return byUser;
};

const resolveUiRole = (code, title) => {
  if (code === 'KITCHEN_SUPERVISOR') return 'kitchen_supervisor';
  if (code === 'STORE_MANAGER') return 'store_manager';
  return uiRoleOf(title || (code === 'KITCHEN_STAFF' ? 'Kitchen Staff' : 'store manager'));
};

export const toObjectId = (id) => new mongoose.Types.ObjectId(String(id));
export const idStr = (v) => (v ? String(v._id || v) : '');
const maskPhone = (p) => {
  const d = String(p || '').replace(/\s+/g, '');
  return !d ? '' : d.length <= 4 ? '*'.repeat(d.length) : `${d.slice(0, 2)}${'*'.repeat(d.length - 4)}${d.slice(-2)}`;
};

// ---------------------------------------------------------------------------------------------
// Serialiser: FoodOrder -> the shape the store-operations screens already render
// ---------------------------------------------------------------------------------------------

const uiStatus = (order) => {
  const s = order.orderStatus;
  if (s === 'created') return order.payment?.status === 'paid' ? 'payment_verified' : 'awaiting_confirmation';
  if (s === 'confirmed') return 'confirmed';
  if (s === 'preparing') {
    const stage = order.kitchen?.stage;
    return stage === 'baking' || stage === 'packaging' ? stage : 'preparing';
  }
  if (s === 'ready_for_pickup' || s === 'reached_pickup') return 'ready';
  if (s === 'picked_up' || s === 'reached_drop') return 'out_for_delivery';
  if (s === 'delivered') return 'delivered';
  if (CANCELLED.includes(s)) return 'cancelled';
  return s;
};

const person = (p) => (p?.userId ? { _id: String(p.userId), name: p.name || '' } : null);

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const GATEWAY_LABEL = { razorpay: 'Razorpay', razorpay_qr: 'Razorpay QR', wallet: 'Wallet', cash: 'Cash on Delivery' };
const PAYMENT_STATUS_LABEL = {
  paid: 'Paid', refunded: 'Refunded', failed: 'Failed', created: 'Awaiting payment', authorized: 'Authorised',
  pending_qr: 'Awaiting QR payment', cod_pending: 'Cash to collect',
};

/** The GST the customer was charged. The rate saved on the order if there is one, otherwise worked out from the tax paid. */
const gstOf = (pricing = {}) => {
  const tax = Number(pricing.tax) || 0;
  const taxable = Math.max(0, (Number(pricing.subtotal) || 0) - (Number(pricing.discount) || 0) + (Number(pricing.handlingFee) || 0));
  const saved = Number(pricing.gstRate);
  const recorded = Number.isFinite(saved) && saved > 0;
  // An older order did not save the rate: take the usual rate (in half-percent steps) that gives the tax that was charged
  let rate = recorded ? saved : 0;
  if (!recorded && taxable > 0 && tax > 0) {
    const exact = (tax / taxable) * 100;
    const nice = Math.round(exact * 2) / 2;
    const candidates = [nice, nice - 0.5, nice + 0.5].filter((r) => r > 0 && Math.round(taxable * (r / 100)) === tax);
    rate = candidates.length ? candidates.sort((a, c) => Math.abs(a - exact) - Math.abs(c - exact))[0] : round2(exact);
  }
  return { rate, rateRecorded: recorded, taxable, total: tax, cgst: round2(tax / 2), sgst: round2(tax / 2) };
};

const ratingOf = (r) => (r?.rating ? { rating: r.rating, comment: r.comment || '', ratedAt: r.ratedAt || null } : null);

const minutesBetween = (a, b) => (a && b ? Math.max(0, Math.round((new Date(b) - new Date(a)) / 60000)) : null);

/** What the rider recorded on the way: the bill photo, the handover photo and the times. Never the OTP itself. */
export const deliveryProof = (o) => {
  const s = o.deliveryState || {};
  const v = o.deliveryVerification || {};
  return {
    billImageUrl: s.billImageUrl || '',
    billImageAt: s.billImageAt || null,
    handoverPhotoUrl: v.handoverPhotoUrl || '',
    handoverPhotoAt: v.handoverPhotoAt || null,
    dropOtpVerified: v.dropOtp?.verified === true,
    pickupConfirmedBy: s.pickupConfirmedBy || '',
    reachedPickupAt: s.reachedPickupAt || null,
    pickedUpAt: s.pickedUpAt || null,
    reachedDropAt: s.reachedDropAt || null,
    deliveredAt: s.deliveredAt || null,
  };
};

export const toOpsOrder = (order) => {
  const o = order.toObject ? order.toObject() : order;
  const user = o.userId && typeof o.userId === 'object' && o.userId._id ? o.userId : null;
  const addr = o.deliveryAddress || {};
  const [lng, lat] = addr.location?.coordinates || [];
  const k = o.kitchen || {};
  const pricing = o.pricing || {};
  const payment = o.payment || {};

  return {
    _id: String(o._id),
    orderNumber: o.order_id || String(o._id),
    customerId: idStr(o.userId),
    customer: {
      name: o.customerName || user?.name || 'Customer',
      phone: o.customerPhone || user?.phone || user?.mobile || '',
      email: o.customerEmail || user?.email || '',
      loyaltyPoints: 0,
      previousOrdersCount: 0,
    },
    storeId: idStr(o.storeId),
    franchiseId: idStr(o.franchiseId),
    status: uiStatus(o),
    orderStatus: o.orderStatus,
    createdAt: o.createdAt,
    acceptedAt: k.acceptedAt || null,
    expectedReadyAt: k.expectedReadyAt || null,
    readyAt: k.readyAt || null,
    // an order the customer collects (takeaway, in-car, dine-in, ...) has no rider; the store hands it over
    orderType: o.isPickup === true ? 'pickup' : 'delivery',
    orderMethod: o.orderMethod || 'delivery',
    isPickup: o.isPickup === true,
    priority: k.priority || 'normal',
    orderSource: 'App',
    paymentStatus: payment.status === 'paid' ? 'paid' : payment.status === 'refunded' ? 'refunded' : 'pending',
    paymentMethod: payment.method === 'cash' ? 'COD' : 'Online',
    paymentGateway: GATEWAY_LABEL[payment.method] || '',
    paymentStatusLabel: PAYMENT_STATUS_LABEL[payment.status] || '',
    transactionId: payment.razorpay?.paymentId || o.transactionId || '',
    gatewayOrderId: payment.razorpay?.orderId || '',
    amountPaid: payment.status === 'paid' ? pricing.total || 0 : 0,
    refundAmount: payment.refund?.amount || 0,
    refundTransactionId: payment.refund?.refundId || '',
    refundProcessedAt: payment.refund?.processedAt || null,
    deliveredAt: o.deliveryState?.deliveredAt || (o.statusHistory || []).find((h) => h.to === 'delivered')?.at || null,
    // Whole order, from the customer placing it to it being delivered
    totalDuration: o.orderStatus === 'delivered'
      ? minutesBetween(o.createdAt, o.deliveryState?.deliveredAt || (o.statusHistory || []).find((h) => h.to === 'delivered')?.at)
      : null,
    couponCode: pricing.couponCode || '',
    gst: gstOf(pricing),
    feedback: {
      store: ratingOf(o.ratings?.store),
      deliveryPartner: ratingOf(o.ratings?.deliveryPartner),
      storeReply: o.ratings?.storeReply?.text ? { text: o.ratings.storeReply.text, repliedBy: o.ratings.storeReply.repliedBy || '', repliedAt: o.ratings.storeReply.repliedAt || null } : null,
    },
    sendCutlery: o.sendCutlery !== false,
    scheduledTime: o.scheduledAt || null,
    deliveryAddress: {
      label: addr.label || '',
      recipient: addr.fullName || addr.name || '',
      phone: addr.phone || '',
      state: addr.state || '',
      houseNumber: addr.street || '',
      street: '',
      landmark: addr.additionalDetails || '',
      city: addr.city || '',
      pincode: addr.zipCode || '',
      notes: o.note || '',
      googleMapsLink: Number.isFinite(lat) && Number.isFinite(lng) ? `https://maps.google.com/?q=${lat},${lng}` : '',
    },
    items: (o.items || []).map((i) => ({
      productId: i.itemId,
      name: i.name,
      image: i.image || '',
      quantity: i.quantity,
      size: i.size || i.variantName || '',
      variant: i.crust || i.variantName || '',
      unitPrice: i.price,
      subtotal: i.price * i.quantity,
      isLimitedOffer: !!i.isLimitedOffer,
      // a combo: what is inside it (the pizzas the kitchen makes, and the dips / drinks that are packed)
      comboType: i.comboType || '',
      components: (i.components || []).map((c) => ({ label: c.label || '', name: c.name, size: c.size || '', crust: c.crust || '', quantity: c.quantity || 1, kitchen: !!c.kitchen })),
      customizations: {
        crustType: i.crust || '',
        cheeseLevel: '',
        extraToppings: (i.selectedAddons || []).map((a) => a.name),
        removeIngredients: [],
        specialInstructions: i.notes || '',
      },
    })),
    subtotal: pricing.subtotal || 0,
    discountAmount: pricing.discount || 0,
    couponId: pricing.couponCode || '',
    platformFee: pricing.platformFee || 0,
    handlingFee: pricing.handlingFee || 0,
    taxes: pricing.tax || 0,
    deliveryCharges: pricing.deliveryFee || 0,
    packingCharges: pricing.packagingFee || 0,
    grandTotal: pricing.total || 0,
    kitchenSupervisor: person(k.supervisor),
    kitchenSupervisorId: k.supervisor?.userId ? String(k.supervisor.userId) : '',
    kitchenStage: k.stage || 'pending',
    queuedAt: k.queuedAt || null,
    kitchenNote: k.notes || '',
    isPaused: !!k.isPaused,
    pauseReason: k.pauseReason || '',
    assignedStaff: {
      pizza_chef: person(k.staff?.pizza_chef),
      baking_chef: person(k.staff?.baking_chef),
      packaging_staff: person(k.staff?.packaging_staff),
    },
    timeline: (o.statusHistory || []).map((h) => ({ status: h.to, timestamp: h.at, note: h.note || '' })),
    cancelReason: CANCELLED.includes(o.orderStatus)
      ? [...(o.statusHistory || [])].reverse().find((h) => CANCELLED.includes(h.to))?.note || ''
      : '',
    refundStatus: payment.refund?.status || 'none',
    deliveryPartnerId: o.dispatch?.deliveryPartnerId ? String(o.dispatch.deliveryPartnerId) : '',
    delivery: deliveryProof(o),
    train: o.train?.trainNo ? { trainNo: o.train.trainNo, coach: o.train.coach || '', seat: o.train.seat || '', station: o.train.stationName || o.train.stationCode || '' } : null,
  };
};

/**
 * Adds what needs another collection: the rider (safe fields only, the phone for the store manager), the coupon's campaign
 * name, and how many orders the customer has placed with this store. One query each, for a whole list.
 */
export async function enrichOpsOrders(user, ops, raw) {
  if (!ops.length) return ops;
  // The method's name as the super admin set it (Takeaway, In-Car, Delivery on Train, a created one...). A method deleted since
  // keeps a readable name made from its id.
  const methods = await loadMethods();
  for (const o of ops) {
    const id = o.orderMethod || 'delivery';
    o.orderMethodLabel = methods.find((m) => m.id === id)?.label || id.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
  // The store's own name, address and phone, for the receipts
  const storeDoc = await FoodStore.findById(requireStore(user)).select('storeName address city state pincode phone').lean();
  const storeAddress = [storeDoc?.address, storeDoc?.city, storeDoc?.state, storeDoc?.pincode].map((v) => String(v || '').trim()).filter(Boolean).join(', ');
  for (const o of ops) { o.storeName = storeDoc?.storeName || ''; o.storeAddress = storeAddress; o.storePhone = storeDoc?.phone || ''; }
  const isManager = normalizeRole(user.role) === 'STORE_MANAGER';
  const riderIds = [...new Set(ops.map((o) => o.deliveryPartnerId).filter(Boolean))];
  const codes = [...new Set(ops.map((o) => o.couponCode).filter(Boolean))];
  const userIds = [...new Set(raw.map((o) => idStr(o.userId)).filter(Boolean))];
  const storeId = toObjectId(requireStore(user));

  // Orders placed before the coupon code was saved on the order: the customer's coupon usage was still recorded at the
  // time (FoodOfferUsage.lastUsedAt), so a usage within a few minutes of the order identifies the coupon that was used.
  const RECOVER_WINDOW_MS = 3 * 60000;
  const toRecover = ops.filter((o) => o.discountAmount > 0 && !o.couponCode);
  const usages = toRecover.length
    ? await FoodOfferUsage.find({
      userId: { $in: [...new Set(toRecover.map((o) => o.customerId).filter(Boolean))].map(toObjectId) },
      lastUsedAt: {
        $gte: new Date(Math.min(...toRecover.map((o) => +new Date(o.createdAt))) - RECOVER_WINDOW_MS),
        $lte: new Date(Math.max(...toRecover.map((o) => +new Date(o.createdAt))) + RECOVER_WINDOW_MS),
      },
    }).lean()
    : [];
  const recoveredOffer = new Map();
  toRecover.forEach((o) => {
    const hit = usages.find((u) => String(u.userId) === o.customerId && Math.abs(+new Date(u.lastUsedAt) - +new Date(o.createdAt)) <= RECOVER_WINDOW_MS);
    if (hit) recoveredOffer.set(o._id, String(hit.offerId));
  });

  const [riders, coupons, counts] = await Promise.all([
    riderIds.length ? FoodDeliveryPartner.find({ _id: { $in: riderIds.map(toObjectId) } }).select('name phone vehicleType vehicleName vehicleNumber profilePhoto rating totalDeliveries').lean() : [],
    codes.length || recoveredOffer.size
      ? FoodCoupon.find({ $or: [{ code: { $in: codes } }, { _id: { $in: [...new Set(recoveredOffer.values())].map(toObjectId) } }] }).lean()
      : [],
    userIds.length ? FoodOrder.aggregate([
      { $match: { storeId, userId: { $in: userIds.map(toObjectId) }, orderStatus: { $nin: CANCELLED } } },
      { $group: { _id: '$userId', n: { $sum: 1 } } },
    ]) : [],
  ]);
  const riderById = new Map(riders.map((r) => [String(r._id), r]));
  const couponByCode = new Map(coupons.map((c) => [c.code, c]));
  const couponById = new Map(coupons.map((c) => [String(c._id), c]));
  const countByUser = new Map(counts.map((c) => [String(c._id), c.n]));

  // What the offer was: "20% off up to Rs 100", "Rs 50 off" ... from the coupon as set up by the super admin
  const offerText = (c) => {
    const v = Number(c.value || c.discountValue) || 0;
    const cap = Number(c.maxDiscount || c.maximumDiscount) || 0;
    if (c.couponType === 'Percentage') return `${v}% off${cap ? `, up to Rs ${cap}` : ''}`;
    if (c.couponType === 'Flat Amount') return `Rs ${v} off`;
    return c.couponType || '';
  };

  return ops.map((o) => {
    const r = riderById.get(o.deliveryPartnerId);
    const recovered = !o.couponCode && recoveredOffer.has(o._id) ? couponById.get(recoveredOffer.get(o._id)) : null;
    const c = o.couponCode ? couponByCode.get(o.couponCode) : recovered;
    const code = o.couponCode || recovered?.code || '';
    return {
      ...o,
      couponCode: code,
      couponCampaignName: c?.title || '',
      coupon: code ? {
        code,
        title: c?.title || '',
        description: c?.description || '',
        offer: c ? offerText(c) : '',
        minimumOrderAmount: Number(c?.minimumOrderAmount) || 0,
        discountAmount: o.discountAmount,
        orderSubtotal: o.subtotal,
        savedPercent: o.subtotal > 0 ? Math.round((o.discountAmount / o.subtotal) * 1000) / 10 : 0,
        // true when the code was matched from the customer's coupon usage because the order itself did not store it
        matchedFromUsage: !o.couponCode,
      } : null,
      customer: { ...o.customer, totalOrdersWithStore: countByUser.get(o.customerId) || 0, previousOrdersCount: Math.max(0, (countByUser.get(o.customerId) || 0) - 1) },
      deliveryPartner: r ? {
        _id: String(r._id), name: r.name, phone: isManager ? r.phone || '' : '', vehicleType: r.vehicleType || '',
        vehicleName: r.vehicleName || '', vehicleNumber: r.vehicleNumber || '', photo: r.profilePhoto || '',
        rating: r.rating || 0, totalDeliveries: r.totalDeliveries || 0,
      } : null,
    };
  });
}

// ---------------------------------------------------------------------------------------------
// Access control
// ---------------------------------------------------------------------------------------------

export const requireStore = (user) => {
  if (!user?.storeId) throw new ForbiddenError('You are not assigned to a store.');
  return String(user.storeId);
};

export const requireManager = (user) => {
  if (normalizeRole(user?.role) !== 'STORE_MANAGER') throw new ForbiddenError('Only the store manager can do this.');
};

export const staffSlotsOf = (order, userId) =>
  STAFF_SLOTS.filter((slot) => idStr(order.kitchen?.staff?.[slot]?.userId) === String(userId));

/** Does this person hold a station of the order (pizza chef, baker or packer)? */
export const holdsStation = (order, userId) => staffSlotsOf(order, userId).length > 0;

/** Does this person hold the packaging station of the order? Only they (or the manager) check quality and mark it ready. */
export const holdsPackaging = (order, userId) => staffSlotsOf(order, userId).includes('packaging_staff');

/**
 * The store manager, or a person holding a station of this order. Used for priority, pause and delay.
 * `kitchen.supervisor` on older orders is information only and never a permission.
 */
export const mustManagerOrStation = (user, order, what) => {
  if (normalizeRole(user?.role) === 'STORE_MANAGER') return;
  if (normalizeRole(user?.role) === 'KITCHEN_STAFF' && holdsStation(order, user.userId)) return;
  throw new ForbiddenError(`Only the store manager or the staff working on this order can ${what}.`);
};

/** The store manager, or the person holding the packaging station of this order: quality check and mark ready. */
export const mustManagerOrPacker = (user, order) => {
  if (normalizeRole(user?.role) === 'STORE_MANAGER') return;
  if (normalizeRole(user?.role) === 'KITCHEN_STAFF' && holdsPackaging(order, user.userId)) return;
  throw new ForbiddenError('Only the store manager or the staff member at the packaging station of this order can do this.');
};

export const findOrder = async (orderId, storeId) => {
  const filter = mongoose.Types.ObjectId.isValid(orderId)
    ? { _id: toObjectId(orderId) }
    : { order_id: String(orderId) };
  const order = await FoodOrder.findOne({ ...filter, storeId: toObjectId(storeId) });
  if (!order) throw new NotFoundError('Order not found');
  return order;
};

const findStaffMember = async (userId, storeId, expectRole) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) throw new ValidationError('Invalid staff member');
  const member = await StoreManager.findOne({ userId: toObjectId(userId), storeId: String(storeId), status: 'Active' }).lean();
  if (!member) throw new ValidationError('Staff member not found in this store, or is not active');
  const codes = await systemRoleCodes([member.userId]);
  const uiRole = resolveUiRole(codes.get(String(member.userId)), member.role);
  if (expectRole && uiRole !== expectRole) throw new ValidationError(`Selected person is not a ${expectRole.replace(/_/g, ' ')}`);
  await requirePresent(storeId, member); // attendance is mandatory: only people who have clocked in can be given work
  return { member, uiRole };
};

/** An active, clocked-in kitchen staff member of this store (never a manager or a left-over supervisor record). */
export const findKitchenStaff = async (userId, storeId) => {
  const found = await findStaffMember(userId, storeId);
  if (found.uiRole === 'kitchen_supervisor' || found.uiRole === 'store_manager') throw new ValidationError('Choose a kitchen staff member');
  return found;
};

// ---------------------------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------------------------

const dayRange = (label) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  if (label === 'Yesterday') {
    const from = new Date(start);
    from.setDate(from.getDate() - 1);
    return { $gte: from, $lt: start };
  }
  if (label === 'Today') return { $gte: start };
  return null;
};

export async function listStoreOrders(user, query = {}) {
  const storeId = requireStore(user);
  const role = normalizeRole(user.role);
  const view = VIEW_STATUSES[query.view] ? query.view : 'active';

  if (view === 'incoming' && role !== 'STORE_MANAGER') return [];

  const filter = { storeId: toObjectId(storeId), orderStatus: { $in: VIEW_STATUSES[view] } };

  // Online orders only reach the store once payment is settled; cash orders arrive straight away.
  if (view === 'incoming') {
    filter.$or = [
      { 'payment.method': { $in: ['cash', 'wallet'] } },
      { 'payment.status': { $in: ['paid', 'authorized'] } },
    ];
  }

  if (role === 'KITCHEN_STAFF') {
    const me = toObjectId(user.userId);
    filter.$and = [...(filter.$and || []), {
      $or: STAFF_SLOTS.map((slot) => ({ [`kitchen.staff.${slot}.userId`]: me })),
    }];
  }

  // order type: collected at the store or delivered; method: the exact order method
  if (query.orderType === 'pickup') filter.isPickup = true;
  else if (query.orderType === 'delivery') filter.isPickup = { $ne: true };
  if (query.orderMethod && /^[a-z][a-z0-9_]{1,29}$/.test(String(query.orderMethod))) filter.orderMethod = String(query.orderMethod);

  if (query.priority && query.priority !== 'All') filter['kitchen.priority'] = String(query.priority).toLowerCase();
  if (query.paymentMethod && query.paymentMethod !== 'All') {
    filter['payment.method'] = query.paymentMethod === 'COD' ? 'cash' : { $ne: 'cash' };
  }
  const range = dayRange(query.dateRange);
  if (range) filter.createdAt = range;
  if (view === 'active' && query.kitchenStage && query.kitchenStage !== 'All') {
    filter['kitchen.stage'] = query.kitchenStage === 'preparing' ? { $in: ['pending', 'preparing'] } : query.kitchenStage;
  }
  if (query.assignedStaff && query.assignedStaff !== 'All' && mongoose.Types.ObjectId.isValid(query.assignedStaff)) {
    const who = toObjectId(query.assignedStaff);
    filter.$and = [...(filter.$and || []), {
      $or: STAFF_SLOTS.map((slot) => ({ [`kitchen.staff.${slot}.userId`]: who })),
    }];
  }
  if (String(query.delayedOnly) === 'true') filter['kitchen.expectedReadyAt'] = { $lt: new Date() };

  const search = String(query.search || '').trim();
  if (search) {
    const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$and = [...(filter.$and || []), {
      $or: [{ order_id: rx }, { customerName: rx }, { customerPhone: rx }],
    }];
  }

  const limit = Math.min(200, Math.max(1, Number(query.limit) || 100));
  const docs = await FoodOrder.find(filter)
    .sort({ createdAt: view === 'incoming' ? 1 : -1 })
    .limit(limit)
    .lean();
  return enrichOpsOrders(user, docs.map(toOpsOrder), docs);
}

export async function getStoreOrder(user, orderId) {
  const storeId = requireStore(user);
  const order = await findOrder(orderId, storeId);
  // Kitchen roles open only the orders they are on, the same rule as the lists.
  const role = normalizeRole(user.role);
  if (role === 'KITCHEN_STAFF' && staffSlotsOf(order, user.userId).length === 0) throw new NotFoundError('Order not found');
  const [enriched] = await enrichOpsOrders(user, [toOpsOrder(order)], [order.toObject ? order.toObject() : order]);
  return enriched;
}

// Kitchen team of the caller's store, with how many live orders each person holds.
export async function listTeam(user, { role, q } = {}) {
  const storeId = requireStore(user);
  const members = await StoreManager.find({
    storeId,
    status: 'Active',
    userId: { $ne: null },
  }).lean();

  const live = await FoodOrder.find({
    storeId: toObjectId(storeId),
    orderStatus: { $in: ['confirmed', 'preparing'] },
  }).select('kitchen').lean();

  const load = new Map();
  const bump = (id) => id && load.set(String(id), (load.get(String(id)) || 0) + 1);
  live.forEach((o) => {
    STAFF_SLOTS.forEach((slot) => bump(o.kitchen?.staff?.[slot]?.userId));
  });

  const codes = await systemRoleCodes(members.map((m) => m.userId));
  const onDuty = await onDutyStaffIds(toObjectId(storeId), members.map((m) => m._id));
  const wanted = String(role || '').toLowerCase();
  const needle = String(q || '').trim().toLowerCase();
  return members
    .map((m) => ({
      _id: String(m.userId),
      employeeId: m.employeeCode,
      name: m.name,
      role: resolveUiRole(codes.get(String(m.userId)), m.role),
      title: m.role,
      status: 'active',
      currentActiveOrders: load.get(String(m.userId)) || 0,
      // The chef / baker / packer pickers show load against capacity
      currentWorkload: load.get(String(m.userId)) || 0,
      maxWorkload: MAX_WORKLOAD,
      present: onDuty.has(String(m._id)),
      attendance: onDuty.has(String(m._id)) ? 'present' : 'absent',
      availability: !onDuty.has(String(m._id)) ? 'absent' : (load.get(String(m.userId)) || 0) >= MAX_WORKLOAD ? 'busy' : 'available',
      avatar: m.profileImage && !m.profileImage.startsWith('data:') ? m.profileImage : '',
    }))
    // the store manager, and left-over kitchen supervisor records, are not kitchen staff to pick
    .filter((m) => m.role !== 'store_manager' && m.role !== 'kitchen_supervisor')
    .filter((m) => !wanted || wanted === 'all' || m.role === wanted)
    // The pickers (a role is always asked for) list only people who are in; the unfiltered team still shows everyone, flagged
    .filter((m) => !wanted || wanted === 'all' || m.present)
    .filter((m) => !needle || m.name.toLowerCase().includes(needle) || String(m.employeeId || '').toLowerCase().includes(needle));
}

// ---------------------------------------------------------------------------------------------
// Workflow: manager accepts -> manager assigns staff to stations -> staff prepare -> packer checks and marks ready
// ---------------------------------------------------------------------------------------------

export const logStep = (order, user, note) => {
  const status = order.orderStatus;
  pushStatusHistory(order, {
    byRole: normalizeRole(user.role),
    byId: toObjectId(user.userId),
    from: status,
    to: status,
    note,
  });
};

const reload = async (orderId, storeId) => {
  const order = await findOrder(orderId, storeId);
  return order;
};

export async function acceptOrder(user, orderId, payload = {}) {
  requireManager(user);
  const storeId = requireStore(user);
  const order = await findOrder(orderId, storeId);
  if (order.orderStatus !== 'created') throw new ValidationError('This order has already been handled');

  // No supervisor: the store manager runs the kitchen. A `kitchenSupervisorId` sent by an older app is ignored.
  const prepMinutes = Math.max(0, Number(payload.estimatedPreparationTime) || 20);

  // Notifies the customer and starts rider dispatch, exactly like any other status change.
  await updateOrderStatusStore(String(order._id), storeId, 'confirmed', payload.notes || 'Accepted by store manager');

  const fresh = await findOrder(order._id, storeId);
  const now = new Date();
  fresh.kitchen = {
    ...(fresh.kitchen?.toObject?.() || {}),
    stage: 'pending',
    priority: payload.priority === 'urgent' ? 'urgent' : 'normal',
    notes: payload.notes || '',
    estimatedPrepMinutes: prepMinutes,
    acceptedAt: now,
    expectedReadyAt: new Date(now.getTime() + prepMinutes * 60000),
  };
  logStep(fresh, user, 'Accepted into the kitchen. The store manager assigns the stations.');
  await fresh.save();
  return toOpsOrder(await reload(order._id, storeId));
}

export async function rejectOrder(user, orderId, payload = {}) {
  requireManager(user);
  const storeId = requireStore(user);
  const order = await findOrder(orderId, storeId);
  if (order.orderStatus !== 'created') throw new ValidationError('Only new orders can be rejected here');
  const reason = String(payload.cancelReason || payload.reason || 'Rejected by store').trim();

  await updateOrderStatusStore(String(order._id), storeId, 'cancelled_by_store', reason, { customerMessage: payload.customerMessage });

  const fresh = await findOrder(order._id, storeId);
  if (payload.initiateRefund && fresh.payment?.status === 'paid') {
    fresh.payment.refund = { ...(fresh.payment.refund?.toObject?.() || {}), status: 'pending', amount: fresh.pricing?.total || 0 };
    await fresh.save();
  }
  return toOpsOrder(await reload(order._id, storeId));
}

const REOPEN_WINDOW_MIN = 5;

/**
 * PATCH /food/store/orders/:orderId/reopen : undo the store's own cancellation within 5 minutes; the order goes back to
 * Incoming. Store manager only. Only orders the STORE cancelled (not the customer or an admin), and never one that was
 * paid online or has a refund started, so no money is handled twice.
 */
export async function reopenOrder(user, orderId, payload = {}) {
  requireManager(user);
  const storeId = requireStore(user);
  const order = await findOrder(orderId, storeId);
  if (order.orderStatus !== 'cancelled_by_store') throw new ValidationError('Only an order the store cancelled can be reopened.');
  const cancelledAt = [...(order.statusHistory || [])].reverse().find((h) => h.to === 'cancelled_by_store')?.at || order.updatedAt;
  if (Date.now() - new Date(cancelledAt).getTime() > REOPEN_WINDOW_MIN * 60000) {
    throw new ValidationError(`Cannot reopen order: Reopening window of ${REOPEN_WINDOW_MIN} minutes has expired.`);
  }
  const pay = order.payment || {};
  const refundStarted = pay.refund?.status && pay.refund.status !== 'none';   // the schema default is 'none'
  if (['paid', 'refunded', 'authorized'].includes(pay.status) || refundStarted || (await Refund.exists({ orderId: order._id }))) {
    throw new ValidationError('An order that was paid online or has a refund started cannot be reopened.');
  }
  const message = String(payload.customerMessage || '').trim().slice(0, 300);
  pushStatusHistory(order, { byRole: 'STORE_MANAGER', byId: user.userId, from: 'cancelled_by_store', to: 'created', note: `Reopened by the store${message ? `: ${message}` : ''}` });
  order.orderStatus = 'created';
  await order.save();
  return toOpsOrder(await reload(order._id, storeId));
}

export async function assignStaff(user, orderId, payload = {}) {
  const storeId = requireStore(user);
  // Only the store manager puts people on stations (kitchen staff never assign, not even themselves).
  requireManager(user);
  const order = await findOrder(orderId, storeId);
  if (!['confirmed', 'preparing'].includes(order.orderStatus)) {
    throw new ValidationError('Staff can only be assigned to orders in the kitchen');
  }

  // Active in this store and clocked in (findStaffMember -> requirePresent), and a kitchen staff member
  const { member, uiRole } = await findKitchenStaff(payload.staffId, storeId);
  const slot = STAFF_SLOTS.includes(payload.role) ? payload.role : uiRole;

  order.kitchen.staff = order.kitchen.staff || {};
  order.kitchen.staff[slot] = { userId: member.userId, name: member.name, assignedAt: new Date() };
  order.markModified('kitchen');
  logStep(order, user, `${member.name} assigned as ${slot.replace(/_/g, ' ')}`);
  await order.save();

  // Someone else's unstarted task for this station is withdrawn when the station changes hands
  await KitchenTask.deleteMany({ orderId: order._id, kind: 'staff', slot, status: 'pending', assignedTo: { $ne: member.userId } });
  if (!(await KitchenTask.exists({ orderId: order._id, assignedTo: member.userId }))) {
    const task = await KitchenTask.create({
      orderId: order._id,
      storeId: toObjectId(storeId),
      assignedTo: member.userId,
      assignedBy: toObjectId(user.userId),
      kind: 'staff',
      slot,
    });
    await notifyUsers({
      userIds: [member.userId], storeId, taskId: task._id, type: 'task_assigned',
      title: 'New Task Assigned', message: `Order ${order.order_id || order._id} was assigned to your station.`,
    });
  }
  return toOpsOrder(await reload(order._id, storeId));
}

export async function updateKitchenStage(user, orderId, payload = {}) {
  const storeId = requireStore(user);
  const role = normalizeRole(user.role);
  const stage = String(payload.stage || '');
  if (!STAGE_ORDER.includes(stage) || stage === 'pending') throw new ValidationError('Invalid kitchen stage');

  const order = await findOrder(orderId, storeId);
  if (!['confirmed', 'preparing'].includes(order.orderStatus)) {
    throw new ValidationError('This order is not in the kitchen');
  }

  const allowed = role === 'STORE_MANAGER' || (role === 'KITCHEN_STAFF' && holdsStation(order, user.userId));
  if (!allowed) throw new ForbiddenError('This order is not assigned to you.');
  // Ready closes the kitchen: the quality check and hand-off belong to the packer of this order (or the manager)
  if (stage === 'ready') mustManagerOrPacker(user, order);

  const current = order.kitchen?.stage || 'pending';
  if (STAGE_ORDER.indexOf(stage) <= STAGE_ORDER.indexOf(current)) {
    throw new ValidationError(`Order is already at '${current}'`);
  }

  await moveToStage(user, storeId, order, stage);
  return toOpsOrder(await reload(order._id, storeId));
}

/**
 * Moves an order that is in the kitchen to a later stage: updates the order status (preparing / ready for pickup,
 * which also notifies the customer and starts rider dispatch), the kitchen stage, the history and the staff tasks.
 * Callers have already checked that the caller may do this.
 */
const STAGE_MESSAGES = {
  pending: 'Your order is in the kitchen queue',
  preparing: 'Our chefs are preparing your pizza',
  baking: 'Your pizza is baking in the oven',
  packaging: 'Your order is being packed',
  ready: 'Your order is ready',
};

// Tells the customer's tracking page (and the store panels) the kitchen moved on, so nothing needs a refresh.
function emitKitchenStage(order, stage) {
  try {
    const io = getIO();
    if (!io) return;
    const payload = {
      orderMongoId: String(order._id),
      orderId: order.orderId,
      orderStatus: order.orderStatus,
      kitchenStage: stage,
      title: 'Order update',
      message: STAGE_MESSAGES[stage] || 'Your order status changed',
    };
    if (order.userId) io.to(rooms.user(order.userId)).emit('order_status_update', payload);
    io.to(rooms.store(order.storeId)).emit('order_status_update', payload);
  } catch { /* realtime is best-effort */ }
}

export async function moveToStage(user, storeId, order, stage) {
  if (stage === 'ready') {
    await updateOrderStatusStore(String(order._id), storeId, 'ready_for_pickup', 'Packed and ready for pickup');
  } else if (order.orderStatus === 'confirmed') {
    await updateOrderStatusStore(String(order._id), storeId, 'preparing', 'Kitchen started preparing');
  }

  const fresh = await findOrder(order._id, storeId);
  fresh.kitchen.stage = stage;
  if (stage === 'ready') fresh.kitchen.readyAt = new Date();
  logStep(fresh, user, `Kitchen stage: ${stage}`);
  await fresh.save();
  emitKitchenStage(fresh, stage);

  // The order being ready completes every task (including a supervisor task left on an order accepted before the
  // supervisor was removed). Before that each station's task moves with that station's own work (syncStaffTasks).
  if (stage === 'ready') {
    await KitchenTask.updateMany({ orderId: fresh._id, status: { $ne: 'completed' } }, { $set: { status: 'completed', completedAt: new Date() } });
  }
  return fresh;
}

export async function setPriority(user, orderId, priority) {
  const storeId = requireStore(user);
  const order = await findOrder(orderId, storeId);
  mustManagerOrStation(user, order, 'change the priority');
  order.kitchen.priority = priority === 'urgent' ? 'urgent' : 'normal';
  logStep(order, user, `Priority set to ${order.kitchen.priority}`);
  await order.save();
  return toOpsOrder(await reload(order._id, storeId));
}

export async function setPaused(user, orderId, { isPaused, reason } = {}) {
  const storeId = requireStore(user);
  const order = await findOrder(orderId, storeId);
  mustManagerOrStation(user, order, 'pause this order');
  order.kitchen.isPaused = !!isPaused;
  order.kitchen.pauseReason = isPaused ? String(reason || '') : '';
  logStep(order, user, isPaused ? `Order paused. Reason: ${reason || 'N/A'}` : 'Order resumed');
  await order.save();
  return toOpsOrder(order);
}

export async function logDelay(user, orderId, { minutes, reason } = {}) {
  const storeId = requireStore(user);
  const order = await findOrder(orderId, storeId);
  mustManagerOrStation(user, order, 'log a delay');
  const extra = Math.max(1, Math.min(240, parseInt(minutes, 10) || 0));
  const base = order.kitchen.expectedReadyAt || order.createdAt;
  order.kitchen.expectedReadyAt = new Date(new Date(base).getTime() + extra * 60000);
  logStep(order, user, `Delayed by ${extra} minutes. Reason: ${reason || 'N/A'}`);
  await order.save();
  return toOpsOrder(order);
}

// Franchise admins see every order of their stores, read-only.
export async function listFranchiseOrders(user, query = {}) {
  const franchiseId = user?.franchiseId;
  if (!franchiseId) throw new ForbiddenError('No franchise on this account.');
  const filter = { franchiseId: toObjectId(franchiseId) };
  if (query.storeId && mongoose.Types.ObjectId.isValid(query.storeId)) filter.storeId = toObjectId(query.storeId);
  if (query.view && VIEW_STATUSES[query.view]) filter.orderStatus = { $in: VIEW_STATUSES[query.view] };
  const limit = Math.min(200, Math.max(1, Number(query.limit) || 100));
  const docs = await FoodOrder.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  const stores = await FoodStore.find({ franchiseId: toObjectId(franchiseId) }).select('storeName').lean();
  const names = new Map(stores.map((st) => [String(st._id), st.storeName]));
  // the rider of each order: name, vehicle and a masked phone (the franchise admin sees the same as in its rider list)
  const riderIds = [...new Set(docs.map((d) => idStr(d.dispatch?.deliveryPartnerId)).filter(Boolean))];
  const riders = riderIds.length ? await FoodDeliveryPartner.find({ _id: { $in: riderIds.map(toObjectId) } }).select('name phone vehicleType vehicleName').lean() : [];
  const riderBy = new Map(riders.map((r) => [String(r._id), r]));
  return docs.map((d) => {
    const r = riderBy.get(idStr(d.dispatch?.deliveryPartnerId));
    return {
      ...toOpsOrder(d),
      storeName: names.get(String(d.storeId)) || '',
      deliveryPartner: r ? { _id: String(r._id), name: r.name || '', phone: maskPhone(r.phone), vehicleType: r.vehicleType || '', vehicleName: r.vehicleName || '' } : null,
    };
  });
}
