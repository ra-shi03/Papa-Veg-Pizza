import mongoose from 'mongoose';
import { FoodOrder } from '../../orders/models/order.model.js';
import { KitchenTask } from '../models/kitchenTask.model.js';
import { FoodStore } from '../../store/models/store.model.js';
import { StoreManager } from '../../franchise/models/storeManager.model.js';
import { UserRole } from '../../../../core/roles/models/userRole.model.js';
import { Role } from '../../../../core/roles/models/role.model.js';
import { updateOrderStatusStore } from '../../orders/services/order.service.js';
import { pushStatusHistory } from '../../orders/services/order.helpers.js';
import { ForbiddenError, NotFoundError, ValidationError } from '../../../../core/auth/errors.js';

// ---------------------------------------------------------------------------------------------
// Roles & vocabulary
// ---------------------------------------------------------------------------------------------

export const normalizeRole = (role) => String(role || '').trim().replace(/-/g, '_').toUpperCase();

const STAFF_SLOTS = ['pizza_chef', 'baking_chef', 'packaging_staff'];
const STAGE_ORDER = ['pending', 'preparing', 'baking', 'packaging', 'ready'];
const CANCELLED = ['cancelled_by_user', 'cancelled_by_store', 'cancelled_by_admin'];

const VIEW_STATUSES = {
  incoming: ['created'],
  active: ['confirmed', 'preparing'],
  ready: ['ready_for_pickup', 'reached_pickup'],
  completed: ['picked_up', 'reached_drop', 'delivered'],
  cancelled: CANCELLED,
};

// Staff titles are free text on the staff profile; map them onto the three kitchen stations.
export const uiRoleOf = (title) => {
  const t = String(title || '').toLowerCase();
  if (t.includes('supervisor')) return 'kitchen_supervisor';
  if (t.includes('manager')) return 'store_manager';
  if (t.includes('bak')) return 'baking_chef';
  if (t.includes('packag')) return 'packaging_staff';
  return 'pizza_chef';
};

// System role code per user (STORE_MANAGER / KITCHEN_SUPERVISOR / KITCHEN_STAFF) from the roles collections.
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

const toObjectId = (id) => new mongoose.Types.ObjectId(String(id));
const idStr = (v) => (v ? String(v._id || v) : '');

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
      email: user?.email || '',
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
    orderType: 'delivery',
    priority: k.priority || 'normal',
    orderSource: 'App',
    paymentStatus: payment.status === 'paid' ? 'paid' : payment.status === 'refunded' ? 'refunded' : 'pending',
    paymentMethod: payment.method === 'cash' ? 'COD' : 'Online',
    deliveryAddress: {
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
    taxes: pricing.tax || 0,
    deliveryCharges: pricing.deliveryFee || 0,
    packingCharges: pricing.packagingFee || 0,
    grandTotal: pricing.total || 0,
    kitchenSupervisor: person(k.supervisor),
    kitchenSupervisorId: k.supervisor?.userId ? String(k.supervisor.userId) : '',
    kitchenStage: k.stage || 'pending',
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
  };
};

// ---------------------------------------------------------------------------------------------
// Access control
// ---------------------------------------------------------------------------------------------

const requireStore = (user) => {
  if (!user?.storeId) throw new ForbiddenError('You are not assigned to a store.');
  return String(user.storeId);
};

const requireManager = (user) => {
  if (normalizeRole(user?.role) !== 'STORE_MANAGER') throw new ForbiddenError('Only the store manager can do this.');
};

const staffSlotsOf = (order, userId) =>
  STAFF_SLOTS.filter((slot) => idStr(order.kitchen?.staff?.[slot]?.userId) === String(userId));

const isOrderSupervisor = (order, userId) => idStr(order.kitchen?.supervisor?.userId) === String(userId);

const findOrder = async (orderId, storeId) => {
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
  return { member, uiRole };
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

  if (role === 'KITCHEN_SUPERVISOR') filter['kitchen.supervisor.userId'] = toObjectId(user.userId);
  if (role === 'KITCHEN_STAFF') {
    const me = toObjectId(user.userId);
    filter.$and = [...(filter.$and || []), {
      $or: STAFF_SLOTS.map((slot) => ({ [`kitchen.staff.${slot}.userId`]: me })),
    }];
  }

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
  return docs.map(toOpsOrder);
}

export async function getStoreOrder(user, orderId) {
  const storeId = requireStore(user);
  const order = await findOrder(orderId, storeId);
  return toOpsOrder(order);
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
    bump(o.kitchen?.supervisor?.userId);
    STAFF_SLOTS.forEach((slot) => bump(o.kitchen?.staff?.[slot]?.userId));
  });

  const codes = await systemRoleCodes(members.map((m) => m.userId));
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
      avatar: m.profileImage && !m.profileImage.startsWith('data:') ? m.profileImage : '',
    }))
    .filter((m) => m.role !== 'store_manager')
    .filter((m) => !wanted || wanted === 'all' || m.role === wanted)
    .filter((m) => !needle || m.name.toLowerCase().includes(needle) || String(m.employeeId || '').toLowerCase().includes(needle));
}

// ---------------------------------------------------------------------------------------------
// Workflow: manager -> supervisor -> staff
// ---------------------------------------------------------------------------------------------

const logStep = (order, user, note) => {
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

  const { member } = await findStaffMember(payload.kitchenSupervisorId, storeId, 'kitchen_supervisor');
  const prepMinutes = Math.max(0, Number(payload.estimatedPreparationTime) || 20);

  // Notifies the customer and starts rider dispatch, exactly like any other status change.
  await updateOrderStatusStore(String(order._id), storeId, 'confirmed', payload.notes || 'Accepted by store manager');

  const fresh = await findOrder(order._id, storeId);
  const now = new Date();
  fresh.kitchen = {
    ...(fresh.kitchen?.toObject?.() || {}),
    stage: 'pending',
    supervisor: { userId: member.userId, name: member.name, assignedAt: now },
    priority: payload.priority === 'urgent' ? 'urgent' : 'normal',
    notes: payload.notes || '',
    estimatedPrepMinutes: prepMinutes,
    acceptedAt: now,
    expectedReadyAt: new Date(now.getTime() + prepMinutes * 60000),
  };
  logStep(fresh, user, `Assigned to kitchen supervisor ${member.name}`);
  await fresh.save();

  await KitchenTask.create({
    orderId: fresh._id,
    storeId: toObjectId(storeId),
    assignedTo: member.userId,
    assignedBy: toObjectId(user.userId),
    notes: payload.notes || '',
  });
  return toOpsOrder(await reload(order._id, storeId));
}

export async function rejectOrder(user, orderId, payload = {}) {
  requireManager(user);
  const storeId = requireStore(user);
  const order = await findOrder(orderId, storeId);
  if (order.orderStatus !== 'created') throw new ValidationError('Only new orders can be rejected here');
  const reason = String(payload.cancelReason || payload.reason || 'Rejected by store').trim();

  await updateOrderStatusStore(String(order._id), storeId, 'cancelled_by_store', reason);

  const fresh = await findOrder(order._id, storeId);
  if (payload.initiateRefund && fresh.payment?.status === 'paid') {
    fresh.payment.refund = { ...(fresh.payment.refund?.toObject?.() || {}), status: 'pending', amount: fresh.pricing?.total || 0 };
    await fresh.save();
  }
  return toOpsOrder(await reload(order._id, storeId));
}

export async function assignStaff(user, orderId, payload = {}) {
  const storeId = requireStore(user);
  const role = normalizeRole(user.role);
  if (role !== 'STORE_MANAGER' && role !== 'KITCHEN_SUPERVISOR') {
    throw new ForbiddenError('Only the store manager or kitchen supervisor can assign staff.');
  }
  const order = await findOrder(orderId, storeId);
  if (!['confirmed', 'preparing'].includes(order.orderStatus)) {
    throw new ValidationError('Staff can only be assigned to orders in the kitchen');
  }
  if (role === 'KITCHEN_SUPERVISOR' && !isOrderSupervisor(order, user.userId)) {
    throw new ForbiddenError('This order is assigned to another supervisor.');
  }

  const { member, uiRole } = await findStaffMember(payload.staffId, storeId);
  if (uiRole === 'kitchen_supervisor') throw new ValidationError('Choose a kitchen staff member');
  const slot = STAFF_SLOTS.includes(payload.role) ? payload.role : uiRole;

  order.kitchen.staff = order.kitchen.staff || {};
  order.kitchen.staff[slot] = { userId: member.userId, name: member.name, assignedAt: new Date() };
  order.markModified('kitchen');
  logStep(order, user, `${member.name} assigned as ${slot.replace(/_/g, ' ')}`);
  await order.save();

  await KitchenTask.findOneAndUpdate(
    { orderId: order._id, assignedTo: member.userId },
    { $setOnInsert: { storeId: toObjectId(storeId), assignedBy: toObjectId(user.userId), status: 'pending' } },
    { upsert: true },
  );
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

  const allowed =
    role === 'STORE_MANAGER' ||
    (role === 'KITCHEN_SUPERVISOR' && isOrderSupervisor(order, user.userId)) ||
    (role === 'KITCHEN_STAFF' && staffSlotsOf(order, user.userId).length > 0);
  if (!allowed) throw new ForbiddenError('This order is not assigned to you.');

  const current = order.kitchen?.stage || 'pending';
  if (STAGE_ORDER.indexOf(stage) <= STAGE_ORDER.indexOf(current)) {
    throw new ValidationError(`Order is already at '${current}'`);
  }

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

  const taskUpdate = stage === 'ready'
    ? { status: 'completed', completedAt: new Date() }
    : { status: 'in_progress', startedAt: new Date() };
  await KitchenTask.updateMany({ orderId: fresh._id }, { $set: taskUpdate });
  return toOpsOrder(await reload(order._id, storeId));
}

export async function setPriority(user, orderId, priority) {
  const storeId = requireStore(user);
  const role = normalizeRole(user.role);
  if (role === 'KITCHEN_STAFF') throw new ForbiddenError('Not allowed.');
  const order = await findOrder(orderId, storeId);
  order.kitchen.priority = priority === 'urgent' ? 'urgent' : 'normal';
  logStep(order, user, `Priority set to ${order.kitchen.priority}`);
  await order.save();
  return toOpsOrder(await reload(order._id, storeId));
}

export async function setPaused(user, orderId, { isPaused, reason } = {}) {
  const storeId = requireStore(user);
  const order = await findOrder(orderId, storeId);
  const allowed = normalizeRole(user.role) === 'STORE_MANAGER' || isOrderSupervisor(order, user.userId);
  if (!allowed) throw new ForbiddenError('Only the store manager or the order supervisor can pause an order.');
  order.kitchen.isPaused = !!isPaused;
  order.kitchen.pauseReason = isPaused ? String(reason || '') : '';
  logStep(order, user, isPaused ? `Order paused. Reason: ${reason || 'N/A'}` : 'Order resumed');
  await order.save();
  return toOpsOrder(order);
}

export async function logDelay(user, orderId, { minutes, reason } = {}) {
  const storeId = requireStore(user);
  const order = await findOrder(orderId, storeId);
  const allowed = normalizeRole(user.role) === 'STORE_MANAGER' || isOrderSupervisor(order, user.userId);
  if (!allowed) throw new ForbiddenError('Only the store manager or the order supervisor can log a delay.');
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
  return docs.map((d) => ({ ...toOpsOrder(d), storeName: names.get(String(d.storeId)) || '' }));
}
