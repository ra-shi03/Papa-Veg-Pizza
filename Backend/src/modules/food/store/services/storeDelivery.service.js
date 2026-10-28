import { FoodOrder } from '../../orders/models/order.model.js';
import { FoodStore } from '../models/store.model.js';
import { DeliveryIssue } from '../models/deliveryIssue.model.js';
import { FoodDeliveryPartner } from '../../delivery/models/deliveryPartner.model.js';
import { FoodZone } from '../../admin/models/zone.model.js';
import { Refund } from '../../../../core/payments/models/refund.model.js';
import { buildOrderIdentityFilter, buildDeliverySocketPayload, haversineKm, pushStatusHistory, enqueueOrderEvent } from '../../orders/services/order.helpers.js';
import { getIO, rooms } from '../../../../config/socket.js';
import { ForbiddenError, NotFoundError, ValidationError } from '../../../../core/auth/errors.js';
import { isId, toId, startOfDay, round1 } from '../../dashboard/services/dashboardAccess.js';
import {
  validateAssignDto, validateCreateIssueDto, validateResolveIssueDto, validateRefundDto, validatePickupDto } from '../validators/storeDelivery.validator.js';

// Store manager's delivery screens (/v1/store/*): riders, assign / reassign, live deliveries, tracking, timeline,
// delivery issues, and "record refund request". Who may call, from the token:
//   store manager      -> own store; read and write
//   kitchen supervisor -> own store; read only
//   franchise admin    -> one store of its own franchise (?storeId=); read only
//   super admin        -> any store (?storeId=); read only
//   kitchen staff, customers, others -> 403.     A store or order of someone else is 404.

const normalize = (role) => String(role || '').trim().replace(/-/g, '_').toUpperCase();
const LIVE = ['confirmed', 'preparing', 'ready_for_pickup', 'reached_pickup', 'picked_up', 'reached_drop'];
const ON_ROAD = ['ready_for_pickup', 'reached_pickup', 'picked_up', 'reached_drop'];
const ASSIGNABLE = ['confirmed', 'preparing', 'ready_for_pickup', 'reached_pickup'];
const CANCELLED = /^cancelled/;
const historyAt = (o, to) => (o.statusHistory || []).find((h) => h.to === to)?.at;
const mins = (a, b) => (new Date(b) - new Date(a)) / 60000;

export async function deliveryContext(user, query = {}, { write = false } = {}) {
  const role = normalize(user?.role);
  let store;
  let canWrite = false;
  if (role === 'STORE_MANAGER' || role === 'KITCHEN_SUPERVISOR') {
    if (!isId(user.storeId)) throw new ForbiddenError('No store is linked to your account.');
    store = await FoodStore.findById(toId(user.storeId)).select('_id franchiseId storeName latitude longitude address city state phone').lean();
    canWrite = role === 'STORE_MANAGER';
  } else if (role === 'FRANCHISE_ADMIN' || role === 'SUPERADMIN' || role === 'SUPER_ADMIN') {
    if (!isId(query.storeId)) throw new ValidationError('Choose a store (storeId).');
    const filter = { _id: toId(query.storeId) };
    if (role === 'FRANCHISE_ADMIN') {
      if (!isId(user.franchiseId)) throw new ForbiddenError('No franchise is linked to your account.');
      filter.franchiseId = toId(user.franchiseId);
    }
    store = await FoodStore.findOne(filter).select('_id franchiseId storeName latitude longitude address city state phone').lean();
  } else {
    throw new ForbiddenError('You do not have access to deliveries.');
  }
  if (!store) throw new NotFoundError('Store not found');
  if (write && !canWrite) throw new ForbiddenError('This account has read-only access to deliveries.');
  return { user, role, store, storeId: store._id, franchiseId: store.franchiseId, canWrite };
}

/** Riders this store may use: approved partners of the store, of its franchise (no store), or of nobody (shared fleet). */
const riderFilter = (ctx) => ({
  status: 'approved',
  $or: [{ storeId: ctx.storeId }, { storeId: null, franchiseId: ctx.franchiseId }, { storeId: null, franchiseId: null }],
});

async function findRider(ctx, riderId) {
  if (!isId(riderId)) throw new NotFoundError('Rider not found');
  const rider = await FoodDeliveryPartner.findOne({ _id: toId(riderId), ...riderFilter(ctx) }).lean();
  if (!rider) throw new NotFoundError('Rider not found');
  return rider;
}

async function findOrder(ctx, orderId, select) {
  const identity = buildOrderIdentityFilter(orderId);
  if (!identity) throw new NotFoundError('Order not found');
  const order = await FoodOrder.findOne({ $and: [identity, { storeId: ctx.storeId }] }).select(select || '').lean();
  if (!order) throw new NotFoundError('Order not found');
  return order;
}

// ---------------------------------------------------------------------------------------------
// Riders
// ---------------------------------------------------------------------------------------------

async function riderStats(ids) {
  if (!ids.length) return new Map();
  const since = new Date(Date.now() - 30 * 86400000);
  const today = startOfDay();
  const rows = await FoodOrder.aggregate([
    { $match: { 'dispatch.deliveryPartnerId': { $in: ids }, createdAt: { $gte: since } } },
    {
      $project: {
        partner: '$dispatch.deliveryPartnerId', order_id: 1, orderStatus: 1, updatedAt: 1,
        take: {
          $let: {
            vars: {
              p: { $arrayElemAt: [{ $map: { input: { $filter: { input: { $ifNull: ['$statusHistory', []] }, cond: { $eq: ['$$this.to', 'picked_up'] } } }, in: '$$this.at' } }, 0] },
              d: { $arrayElemAt: [{ $map: { input: { $filter: { input: { $ifNull: ['$statusHistory', []] }, cond: { $eq: ['$$this.to', 'delivered'] } } }, in: '$$this.at' } }, 0] },
            },
            in: { $cond: [{ $and: ['$$p', '$$d'] }, { $divide: [{ $subtract: ['$$d', '$$p'] }, 60000] }, null] },
          },
        },
      },
    },
    {
      $group: {
        _id: '$partner',
        total: { $sum: 1 },
        active: { $sum: { $cond: [{ $in: ['$orderStatus', LIVE] }, 1, 0] } },
        current: { $max: { $cond: [{ $in: ['$orderStatus', LIVE] }, '$order_id', null] } },
        delivered: { $sum: { $cond: [{ $eq: ['$orderStatus', 'delivered'] }, 1, 0] } },
        today: { $sum: { $cond: [{ $and: [{ $eq: ['$orderStatus', 'delivered'] }, { $gte: ['$updatedAt', today] }] }, 1, 0] } },
        cancelled: { $sum: { $cond: [{ $regexMatch: { input: '$orderStatus', regex: '^cancelled' } }, 1, 0] } },
        takeSum: { $sum: { $ifNull: ['$take', 0] } },
        takeN: { $sum: { $cond: [{ $ne: ['$take', null] }, 1, 0] } },
      },
    },
  ]);
  return new Map(rows.map((r) => [String(r._id), r]));
}

const toRider = (p, s = {}) => ({
  _id: String(p._id),
  name: p.name,
  mobile: p.phone,
  vehicleType: p.vehicleType || '',
  vehicleNumber: p.vehicleNumber || '',
  joiningDate: new Date(p.approvedAt || p.createdAt).toISOString().slice(0, 10),
  rating: p.rating || 0,
  availability: p.availabilityStatus || 'offline',
  currentStatus: s.active ? 'busy' : 'idle',
  currentOrderId: s.current || null,
  lastActive: p.lastLocationAt || p.updatedAt,
  totalDeliveries: Math.max(p.totalDeliveries || 0, s.delivered || 0),
  averageDeliveryTime: s.takeN ? Math.round(s.takeSum / s.takeN) : 0,
  cancellationRate: s.total ? round1((s.cancelled / s.total) * 100) : 0,
  customerRatings: p.rating || 0,
  todayDeliveries: s.today || 0,
  activeOrders: s.active || 0,
});

export async function listRiders(user, q = {}) {
  const ctx = await deliveryContext(user, q);
  const partners = await FoodDeliveryPartner.find(riderFilter(ctx)).select('-password -aadharNumber -panNumber -drivingLicenseNumber -bankAccountNumber -bankIfscCode -upiId').sort({ name: 1 }).limit(300).lean();
  const stats = await riderStats(partners.map((p) => p._id));
  return partners.map((p) => toRider(p, stats.get(String(p._id))));
}

export async function riderDetails(user, riderId, q = {}) {
  const ctx = await deliveryContext(user, q);
  const p = await findRider(ctx, riderId);
  return toRider(p, (await riderStats([p._id])).get(String(p._id)));
}

/** Online riders, idle ones first, then nearest to the store. */
export async function availableRiders(user, q = {}) {
  const ctx = await deliveryContext(user, q);
  const partners = await FoodDeliveryPartner.find({ ...riderFilter(ctx), availabilityStatus: 'online' }).select('name phone vehicleType rating lastLat lastLng').lean();
  const stats = await riderStats(partners.map((p) => p._id));
  const { latitude, longitude } = ctx.store;
  const out = partners.map((p) => {
    const active = stats.get(String(p._id))?.active || 0;
    const known = Number.isFinite(latitude) && Number.isFinite(longitude) && Number.isFinite(p.lastLat) && Number.isFinite(p.lastLng);
    return {
      _id: String(p._id), name: p.name, mobile: p.phone, vehicleType: p.vehicleType || '', currentStatus: 'online',
      activeOrders: active, availability: active ? 'busy' : 'idle', rating: p.rating || 0,
      distanceFromStore: known ? round1(haversineKm(latitude, longitude, p.lastLat, p.lastLng)) : 0, _known: known,
    };
  });
  out.sort((a, b) => (a.activeOrders ? 1 : 0) - (b.activeOrders ? 1 : 0) || (b._known - a._known) || a.distanceFromStore - b.distanceFromStore);
  return out.map(({ _known, ...r }) => r);
}

// ---------------------------------------------------------------------------------------------
// Orders waiting for / on the road with a rider
// ---------------------------------------------------------------------------------------------

const deliveryStatusOf = (o) => {
  if (o.orderStatus === 'delivered') return 'delivered';
  if (o.orderStatus === 'reached_drop') return 'out_for_delivery';
  if (o.orderStatus === 'picked_up') return 'picked_up';
  if (o.dispatch?.deliveryPartnerId && o.dispatch.status === 'accepted') return 'accepted';
  if (o.dispatch?.deliveryPartnerId && o.dispatch.status === 'assigned') return 'assigned';
  return 'waiting';
};
const addressText = (a = {}) => [a.street, a.additionalDetails, a.city, a.state, a.zipCode].map((v) => String(v || '').trim()).filter(Boolean).join(', ');
const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export async function readyOrders(user, q = {}) {
  const ctx = await deliveryContext(user, q);
  const filter = { storeId: ctx.storeId, orderStatus: { $in: ['ready_for_pickup', 'reached_pickup'] } };
  const search = String(q.search || '').trim().slice(0, 60);
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ order_id: rx }, { customerName: rx }];
  }
  const docs = await FoodOrder.find(filter).select('order_id customerName customerPhone userId pricing.total orderStatus kitchen.readyAt dispatch deliveryAddress items updatedAt').sort({ updatedAt: 1 }).limit(100).lean();
  let rows = docs.map((o) => ({
    _id: String(o._id),
    orderNumber: o.order_id || String(o._id),
    customerId: o.userId ? String(o.userId) : '',
    customerName: o.customerName || o.deliveryAddress?.name || '',
    customerPhone: o.customerPhone || o.deliveryAddress?.phone || '',
    totalAmount: o.pricing?.total || 0,
    orderStatus: o.orderStatus,
    deliveryStatus: deliveryStatusOf(o),
    packagingCompletedAt: o.kitchen?.readyAt || o.updatedAt,
    assignedRiderId: o.dispatch?.deliveryPartnerId ? String(o.dispatch.deliveryPartnerId) : null,
    deliveryAddress: addressText(o.deliveryAddress),
    items: (o.items || []).map((i) => ({ name: i.name, quantity: i.quantity, size: i.size || '' })),
  }));
  if (q.status && q.status !== 'All') rows = rows.filter((r) => r.deliveryStatus === String(q.status).toLowerCase());
  return rows;
}

export async function liveDeliveries(user, q = {}) {
  const ctx = await deliveryContext(user, q);
  const docs = await FoodOrder.find({
    storeId: ctx.storeId,
    'dispatch.deliveryPartnerId': { $ne: null },
    $or: [{ orderStatus: { $in: ON_ROAD } }, { orderStatus: 'delivered', updatedAt: { $gte: startOfDay() } }],
  }).select('order_id customerName deliveryAddress.name orderStatus dispatch statusHistory').sort({ updatedAt: -1 }).limit(200).lean();
  const riders = await FoodDeliveryPartner.find({ _id: { $in: docs.map((o) => o.dispatch.deliveryPartnerId) } }).select('name').lean();
  const name = new Map(riders.map((r) => [String(r._id), r.name]));
  return docs.map((o) => {
    const pickup = historyAt(o, 'picked_up');
    const since = pickup || o.dispatch.assignedAt || new Date();
    // ETA is an estimate: 30 minutes from pickup (or assignment), not a routing result
    const left = Math.max(1, Math.round(30 - mins(since, new Date())));
    return {
      _id: String(o._id),
      orderId: o.order_id || String(o._id),
      customerName: o.customerName || o.deliveryAddress?.name || '',
      riderName: name.get(String(o.dispatch.deliveryPartnerId)) || '',
      pickupTime: pickup || '',
      eta: o.orderStatus === 'delivered' ? 'Delivered' : `${left} mins`,
      deliveryStatus: deliveryStatusOf(o),
    };
  });
}

export async function tracking(user, orderId, q = {}) {
  const ctx = await deliveryContext(user, q);
  const order = await findOrder(ctx, orderId, 'order_id customerName customerPhone deliveryAddress pricing.total items orderStatus dispatch statusHistory lastRiderLocation');
  const partner = order.dispatch?.deliveryPartnerId
    ? await FoodDeliveryPartner.findById(order.dispatch.deliveryPartnerId).select('name phone vehicleNumber lastLat lastLng').lean()
    : null;
  const live = order.lastRiderLocation?.coordinates;
  const dest = order.deliveryAddress?.location?.coordinates;
  const pickup = historyAt(order, 'picked_up');
  return {
    customer: {
      name: order.customerName || order.deliveryAddress?.name || '', phone: order.customerPhone || order.deliveryAddress?.phone || '',
      address: addressText(order.deliveryAddress), latitude: dest?.[1] ?? null, longitude: dest?.[0] ?? null,
    },
    rider: partner ? {
      name: partner.name, mobile: partner.phone, vehicleNumber: partner.vehicleNumber || '',
      latitude: live?.[1] ?? partner.lastLat ?? null, longitude: live?.[0] ?? partner.lastLng ?? null, speed: 0,
    } : null,
    order: {
      orderId: order.order_id || String(order._id), amount: order.pricing?.total || 0, status: deliveryStatusOf(order),
      items: (order.items || []).map((i) => ({ name: i.name, quantity: i.quantity, size: i.size || '' })), pickupTime: pickup || '',
    },
    store: { latitude: ctx.store.latitude ?? null, longitude: ctx.store.longitude ?? null },
    timeline: {
      assignedAt: order.dispatch?.assignedAt || '', acceptedAt: order.dispatch?.acceptedAt || '', pickupAt: pickup || '',
      outForDeliveryAt: historyAt(order, 'reached_drop') || '', deliveredAt: historyAt(order, 'delivered') || '',
    },
  };
}

export async function timeline(user, orderId, q = {}) {
  const ctx = await deliveryContext(user, q);
  const order = await findOrder(ctx, orderId, 'statusHistory');
  return (order.statusHistory || []).map((h) => ({
    status: h.to, updatedBy: [h.byRole, h.note].filter(Boolean).join(' - ') || 'System', timestamp: h.at,
  }));
}

// ---------------------------------------------------------------------------------------------
// Assign / reassign
// ---------------------------------------------------------------------------------------------

function notifyAssignment(ctx, order, rider, previousRiderId) {
  const io = getIO();
  if (!io) return;
  io.to(rooms.delivery(rider._id)).emit('new_order_available', buildDeliverySocketPayload(order, {
    storeName: ctx.store.storeName, phone: ctx.store.phone, city: ctx.store.city, state: ctx.store.state, addressLine1: ctx.store.address,
    location: { latitude: ctx.store.latitude, longitude: ctx.store.longitude },
  }));
  if (previousRiderId && String(previousRiderId) !== String(rider._id)) {
    io.to(rooms.delivery(previousRiderId)).emit('order_reassigned_elsewhere', { orderMongoId: String(order._id), orderId: order.order_id });
  }
  io.to(rooms.store(ctx.storeId)).emit('store:assignment-success', { orderId: order.order_id || String(order._id), riderId: String(rider._id) });
}

async function assign(ctx, order, rider) {
  if (!ASSIGNABLE.includes(order.orderStatus)) throw new ValidationError('A rider can only be assigned before the order is picked up.');
  const previous = order.dispatch?.deliveryPartnerId;
  if (previous && String(previous) === String(rider._id) && ['assigned', 'accepted'].includes(order.dispatch.status)) {
    throw new ValidationError('This rider is already assigned to the order.');
  }
  const updated = await FoodOrder.findOneAndUpdate(
    { _id: order._id, storeId: ctx.storeId, orderStatus: { $in: ASSIGNABLE } },
    {
      $set: { 'dispatch.status': 'assigned', 'dispatch.deliveryPartnerId': rider._id, 'dispatch.assignedAt': new Date() },
      $unset: { 'dispatch.acceptedAt': '', 'dispatch.dispatchingAt': '' },
      $push: {
        statusHistory: {
          at: new Date(), byRole: ctx.role === 'STORE_MANAGER' ? 'STORE_MANAGER' : 'ADMIN',
          byId: isId(ctx.user.userId) ? toId(ctx.user.userId) : undefined, from: order.dispatch?.status || 'unassigned', to: 'rider_assigned',
          note: `Rider ${rider.name} assigned by the store`,
        },
      },
    },
    { new: true },
  ).lean();
  if (!updated) throw new ValidationError('The order changed while assigning. Please refresh and try again.');
  notifyAssignment(ctx, updated, rider, previous);
  return { success: true, message: 'Rider assigned successfully.', orderId: updated.order_id || String(updated._id), riderId: String(rider._id), deliveryStatus: 'assigned' };
}

export async function assignRider(user, body = {}, q = {}) {
  const ctx = await deliveryContext(user, q, { write: true });
  const dto = validateAssignDto(body);
  const order = await findOrder(ctx, dto.orderId, 'order_id orderStatus dispatch items pricing payment deliveryAddress customerName customerPhone note storeId userId');
  return assign(ctx, order, await findRider(ctx, dto.riderId));
}

/**
 * PATCH /store/orders/:orderId/pickup : the store hands a ready order to its assigned rider. Same transition the rider
 * confirms in the delivery app (ready -> picked up, out for delivery); the rider's app is told over its socket.
 * The store manager only; the store comes from the token.
 */
export async function confirmPickup(user, orderId, body = {}, q = {}) {
  const ctx = await deliveryContext(user, q, { write: true });
  const { notes } = validatePickupDto(body);
  const identity = buildOrderIdentityFilter(orderId);
  if (!identity) throw new NotFoundError('Order not found');
  const order = await FoodOrder.findOne({ $and: [identity, { storeId: ctx.storeId }] });
  if (!order) throw new NotFoundError('Order not found');
  if (!['ready_for_pickup', 'reached_pickup'].includes(order.orderStatus)) {
    throw new ValidationError('Only an order that is ready for pickup can be handed to the rider.');
  }
  const riderId = order.dispatch?.deliveryPartnerId;
  if (!riderId) throw new ValidationError('Assign a rider before confirming the pickup.');
  const from = order.orderStatus;
  const pickedUpAt = new Date();
  order.orderStatus = 'picked_up';
  order.deliveryState = { ...(order.deliveryState?.toObject?.() || order.deliveryState || {}), currentPhase: 'en_route_to_delivery', status: 'picked_up', pickedUpAt };
  pushStatusHistory(order, { byRole: 'STORE_MANAGER', byId: ctx.user.userId, from, to: 'picked_up', note: `Pickup confirmed by the store${notes ? `: ${notes}` : ''}` });
  await order.save();
  getIO()?.to(rooms.delivery(String(riderId))).emit('order_status_update', {
    orderMongoId: String(order._id), orderId: String(order._id), orderStatus: order.orderStatus, deliveryState: order.deliveryState,
  });
  enqueueOrderEvent('picked_up', { orderMongoId: String(order._id), orderId: String(order._id), deliveryPartnerId: String(riderId) });
  return { orderId: String(order._id), orderNumber: order.order_id || String(order._id), orderStatus: order.orderStatus, pickedUpAt };
}

// ---------------------------------------------------------------------------------------------
// Refund request (record only: nothing is paid out here)
// ---------------------------------------------------------------------------------------------

async function recordRefundRequest(ctx, order, { amount, reason }) {
  if (!(order.orderStatus === 'delivered' || CANCELLED.test(String(order.orderStatus)))) {
    throw new ValidationError('A refund can be requested once the order is delivered or cancelled.');
  }
  const total = Number(order.pricing?.total) || 0;
  const value = amount ?? total;
  if (!(value > 0)) throw new ValidationError('There is nothing to refund on this order.');
  if (value > total) throw new ValidationError(`Refund cannot exceed the order total of ₹${total}.`);
  if (await Refund.exists({ orderId: order._id, status: { $in: ['pending', 'processing'] } })) {
    throw new ValidationError('A refund request for this order is already in progress.');
  }
  const refund = await Refund.create({
    orderId: order._id, userId: order.userId, amount: value, reason: String(reason || 'Raised by the store').slice(0, 500),
    status: 'pending', refundTo: 'wallet', requestedBy: 'ADMIN',
    metadata: { source: 'store', storeId: String(ctx.storeId), requestedBy: String(ctx.user.userId) },
  });
  return refund;
}

export async function requestOrderRefund(user, orderId, body = {}, q = {}) {
  const ctx = await deliveryContext(user, q, { write: true });
  const dto = validateRefundDto(body);
  const order = await findOrder(ctx, orderId, 'order_id orderStatus pricing.total userId');
  const r = await recordRefundRequest(ctx, order, dto);
  return {
    _id: String(r._id), orderId: String(order._id), orderNumber: order.order_id || String(order._id), reason: r.reason,
    amount: r.amount, status: r.status, approvedBy: '--', createdAt: r.createdAt,
  };
}

/** GET /store/orders/:orderId/refunds : the refund records of one of this store's orders (Refund History). */
export async function orderRefunds(user, orderId, q = {}) {
  const ctx = await deliveryContext(user, q);
  const order = await findOrder(ctx, orderId, '_id');
  const refunds = await Refund.find({ orderId: order._id }).sort({ createdAt: -1 }).lean();
  const by = { USER: 'Customer', SYSTEM: 'System', ADMIN: 'Admin' };
  return refunds.map((r) => ({
    _id: String(r._id), orderId: String(r.orderId), amount: r.amount, status: r.status, reason: r.reason,
    refundMethod: r.refundTo === 'gateway' ? 'Original payment method' : 'Wallet',
    referenceNumber: r.gatewayRefundId || `REF-${String(r._id).slice(-8).toUpperCase()}`,
    processedBy: r.metadata?.source === 'store' ? 'Store' : by[r.requestedBy] || 'System',
    createdAt: r.createdAt,
  }));
}

// ---------------------------------------------------------------------------------------------
// Delivery issues
// ---------------------------------------------------------------------------------------------

const toIssue = (i) => ({
  _id: String(i._id), orderId: i.orderRef, riderId: i.riderId ? String(i.riderId) : '', riderName: i.riderName || 'Not Assigned',
  issueType: i.issueType, description: i.description, reportedBy: i.reportedBy, severity: i.severity, status: i.status,
  resolution: i.resolution, refundAmount: i.refundAmount, penaltyAmount: i.penaltyAmount, createdAt: i.createdAt,
});
const emitToStore = (ctx, event, payload) => getIO()?.to(rooms.store(ctx.storeId)).emit(event, payload);

export async function listIssues(user, q = {}) {
  const ctx = await deliveryContext(user, q);
  return (await DeliveryIssue.find({ storeId: ctx.storeId }).sort({ createdAt: -1 }).limit(200).lean()).map(toIssue);
}

export async function createIssue(user, body = {}, q = {}) {
  const ctx = await deliveryContext(user, q, { write: true });
  const dto = validateCreateIssueDto(body);
  const order = await findOrder(ctx, dto.orderId, 'order_id');
  const rider = dto.riderId ? await findRider(ctx, dto.riderId) : null;
  const issue = await DeliveryIssue.create({
    storeId: ctx.storeId, franchiseId: ctx.franchiseId, orderId: order._id, orderRef: order.order_id || String(order._id),
    riderId: rider?._id || null, riderName: rider?.name || '', issueType: dto.issueType, description: dto.description,
    reportedBy: dto.reportedBy || 'Store Manager', severity: dto.severity, createdById: isId(user.userId) ? toId(user.userId) : null,
  });
  const out = toIssue(issue.toObject());
  emitToStore(ctx, 'delivery:issue-created', { issue: out });
  return out;
}

export async function updateIssue(user, issueId, body = {}, q = {}) {
  const ctx = await deliveryContext(user, q, { write: true });
  const dto = validateResolveIssueDto(body);
  const issue = isId(issueId) ? await DeliveryIssue.findOne({ _id: toId(issueId), storeId: ctx.storeId }) : null;
  if (!issue) throw new NotFoundError('Issue ticket not found');

  // Validate everything before changing anything
  if (dto.reassignRiderId && dto.refundAmount > 0) throw new ValidationError('Choose either a refund request or a new rider for this issue.');
  const rider = dto.reassignRiderId ? await findRider(ctx, dto.reassignRiderId) : null;
  const order = await FoodOrder.findOne({ _id: issue.orderId, storeId: ctx.storeId }).select('order_id orderStatus dispatch items pricing payment deliveryAddress customerName customerPhone note storeId userId').lean();
  if (rider && !order) throw new NotFoundError('Order not found');
  if (dto.refundAmount > 0 && !order) throw new NotFoundError('Order not found');

  if (dto.refundAmount > 0) {
    const refund = await recordRefundRequest(ctx, order, { amount: dto.refundAmount, reason: `Delivery issue: ${issue.issueType}` });
    issue.refundRequestId = refund._id;
    issue.refundAmount = dto.refundAmount;
  }
  if (rider) {
    await assign(ctx, order, rider);
    issue.riderId = rider._id;
    issue.riderName = rider.name;
  }
  if (dto.penaltyAmount !== undefined) issue.penaltyAmount = dto.penaltyAmount; // a note on the issue: nothing is deducted here
  if (dto.resolution !== undefined) issue.resolution = dto.resolution;
  if (dto.status) {
    issue.status = dto.status;
    if (dto.status === 'resolved' || dto.status === 'closed') issue.resolvedAt = new Date();
  }
  await issue.save();
  const out = toIssue(issue.toObject());
  emitToStore(ctx, 'delivery:issue-updated', { issueId: out._id, status: out.status });
  if (out.status === 'resolved') emitToStore(ctx, 'delivery:issue-resolved', { issueId: out._id, resolution: out.resolution });
  return out;
}

// ---------------------------------------------------------------------------------------------
// Zones near a rider (delivery app): GET /v1/food/zones/nearby?lat&lng&radius (km)
// ---------------------------------------------------------------------------------------------

const inside = (lat, lng, polygon = []) => {
  let c = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i];
    const b = polygon[j];
    if ((a.longitude > lng) !== (b.longitude > lng) && lat < ((b.latitude - a.latitude) * (lng - a.longitude)) / (b.longitude - a.longitude) + a.latitude) c = !c;
  }
  return c;
};

/** Distance from a point to the nearest edge of a polygon, in km (flat approximation, fine at city scale). */
function edgeDistanceKm(lat, lng, polygon) {
  const kx = 111.32 * Math.cos((lat * Math.PI) / 180);
  const ky = 110.57;
  const pt = (c) => [(c.longitude - lng) * kx, (c.latitude - lat) * ky];
  let best = Infinity;
  for (let i = 0; i < polygon.length; i++) {
    const [ax, ay] = pt(polygon[i]);
    const [bx, by] = pt(polygon[(i + 1) % polygon.length]);
    const dx = bx - ax;
    const dy = by - ay;
    const t = dx || dy ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / (dx * dx + dy * dy))) : 0;
    best = Math.min(best, Math.hypot(ax + t * dx, ay + t * dy));
  }
  return best;
}

export async function nearbyZones(q = {}) {
  const lat = parseFloat(q.lat);
  const lng = parseFloat(q.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) throw new ValidationError('lat and lng are required');
  const radius = Math.min(200, Math.max(0.1, parseFloat(q.radius) || 10));
  const zones = await FoodZone.find({ isActive: true }).select('name zoneName serviceLocation coordinates unit').lean();
  return zones.map((z) => {
    const contains = inside(lat, lng, z.coordinates);
    const distanceKm = contains ? 0 : edgeDistanceKm(lat, lng, z.coordinates);
    return { _id: String(z._id), name: z.zoneName || z.name, serviceLocation: z.serviceLocation || '', contains, distanceKm: round1(distanceKm), coordinates: z.coordinates.map((c) => ({ latitude: c.latitude, longitude: c.longitude })) };
  }).filter((z) => z.contains || z.distanceKm <= radius).sort((a, b) => a.distanceKm - b.distanceKm);
}
