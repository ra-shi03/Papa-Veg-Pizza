import mongoose from 'mongoose';
import { FoodOrder } from '../../orders/models/order.model.js';
import { StoreManager } from '../../franchise/models/storeManager.model.js';
import { KitchenTask } from '../models/kitchenTask.model.js';
import { KitchenItem } from '../models/kitchenItem.model.js';
import { KitchenEscalation } from '../models/kitchenEscalation.model.js';
import { IngredientRequest } from '../models/ingredientRequest.model.js';
import { QualityCheck } from '../models/qualityCheck.model.js';
import {
  normalizeRole, requireStore, isOrderSupervisor, staffSlotsOf, findOrder, logStep, toObjectId, idStr, toOpsOrder,
  assignStaff, moveToStage,
} from './storeOrders.service.js';
import { notifyUsers } from './kitchenTasks.service.js';
import { ensureItems, syncOrderStage, visibleKitchenOrders, priorityLabel, isDelayed, IN_KITCHEN } from './kitchenItems.service.js';
import { notifyOwnersSafely } from '../../orders/services/order.helpers.js';
import { ForbiddenError, NotFoundError, ValidationError } from '../../../../core/auth/errors.js';

// Kitchen Queue, Delayed Orders, Packaging Station and the two My Tasks modals (ingredient request,
// quality check). Role and store scope are decided here from the token, never from the request:
//   store manager    -> everything in their store
//   kitchen supervisor -> only the orders assigned to them
//   kitchen staff    -> only their own stations / tasks

const asRole = (user) => normalizeRole(user?.role);
const isManager = (user) => asRole(user) === 'STORE_MANAGER';
const isSupervisor = (user) => asRole(user) === 'KITCHEN_SUPERVISOR';
const isStaff = (user) => asRole(user) === 'KITCHEN_STAFF';
const str = (v, max) => String(v ?? '').trim().slice(0, max);
const isId = (v) => mongoose.Types.ObjectId.isValid(String(v || ''));

/** Manager, or the supervisor of this very order. */
const mustLead = (user, order) => {
  if (isManager(user)) return;
  if (isSupervisor(user) && isOrderSupervisor(order, user.userId)) return;
  throw new ForbiddenError('Only the store manager or the order supervisor can do this.');
};
const mustBeLeadRole = (user) => {
  if (!isManager(user) && !isSupervisor(user)) throw new ForbiddenError('Only the store manager or a kitchen supervisor can do this.');
};

/** An order the caller may see at all. Others get a 404, so its existence is not revealed. */
async function findVisibleOrder(user, orderId) {
  const storeId = requireStore(user);
  if (!isId(orderId)) throw new NotFoundError('Order not found');
  const order = await findOrder(orderId, storeId);
  const seen = isManager(user) ||
    (isSupervisor(user) && isOrderSupervisor(order, user.userId)) ||
    (isStaff(user) && staffSlotsOf(order, user.userId).length > 0);
  if (!seen) throw new NotFoundError('Order not found');
  return { order, storeId };
}

// ---------------------------------------------------------------------------------------------
// Kitchen queue
// ---------------------------------------------------------------------------------------------

const queueStatus = (o) => (o.orderStatus === 'preparing' ? 'preparing' : o.kitchen?.queuedAt ? 'queued' : 'confirmed');

const pizzaChefId = (o) => idStr(o.kitchen?.staff?.pizza_chef?.userId) || null;

function toQueueOrder(order, itemRows) {
  const ops = toOpsOrder(order);
  const rowByIndex = new Map(itemRows.map((r) => [r.index, r]));
  const k = order.kitchen || {};
  return {
    ...ops,
    status: queueStatus(order),
    customer: { ...ops.customer, deliveryAddress: ops.deliveryAddress },
    priority: priorityLabel(order),
    paymentMethod: ops.paymentMethod === 'COD' ? 'COD' : 'ONLINE',
    transactionId: order.payment?.razorpay?.paymentId || '',
    queueEntryTime: k.queuedAt || null,
    expectedReadyTime: k.expectedReadyAt || null,
    sla_minutes: k.estimatedPrepMinutes || 20,
    assigned_chef: pizzaChefId(order),
    specialInstructions: [order.note, k.notes].filter(Boolean).join(' | '),
    timeline: ops.timeline.map((t) => ({ status: t.status, time: t.timestamp, note: t.note })),
    items: ops.items.map((it, index) => {
      const row = rowByIndex.get(index);
      return {
        ...it,
        orderItemId: row ? String(row._id) : `${ops._id}:${index}`,
        toppings: it.customizations?.extraToppings || [],
        specialInstructions: it.customizations?.specialInstructions || '',
        rejected: !!row?.rejected,
      };
    }),
  };
}

const withItems = async (orders) => {
  await ensureItems(orders);
  const rows = await KitchenItem.find({ orderId: { $in: orders.map((o) => o._id) } }).lean();
  const byOrder = new Map();
  rows.forEach((r) => { const k = String(r.orderId); byOrder.set(k, [...(byOrder.get(k) || []), r]); });
  return byOrder;
};

export async function kitchenQueue(user, q = {}) {
  const orders = await visibleKitchenOrders(user);
  let list = orders;
  const search = String(q.search || '').trim().toLowerCase();
  if (search) {
    list = list.filter((o) => [o.order_id, o.customerName, o.customerPhone].some((v) => String(v || '').toLowerCase().includes(search)));
  }
  if (q.status && q.status !== 'All') list = list.filter((o) => queueStatus(o) === q.status);
  if (q.priority && q.priority !== 'All') list = list.filter((o) => priorityLabel(o) === String(q.priority).toUpperCase());
  if (q.paymentMethod && q.paymentMethod !== 'All') {
    list = list.filter((o) => (o.payment?.method === 'cash' ? 'COD' : 'ONLINE') === String(q.paymentMethod).toUpperCase());
  }
  if (q.assignedChef && q.assignedChef !== 'All') {
    list = list.filter((o) => (q.assignedChef === 'Unassigned' ? !pizzaChefId(o) : pizzaChefId(o) === q.assignedChef));
  }
  if (String(q.unassigned) === 'true') list = list.filter((o) => !pizzaChefId(o));
  if (String(q.delayed) === 'true') list = list.filter(isDelayed);

  const limit = Math.min(100, Math.max(1, parseInt(q.limit, 10) || 20));
  const page = Math.max(1, parseInt(q.page, 10) || 1);
  const slice = list.slice((page - 1) * limit, page * limit);
  const items = await withItems(slice);
  return {
    orders: slice.map((o) => toQueueOrder(o, items.get(String(o._id)) || [])),
    pagination: { total: list.length, page, limit, totalPages: Math.ceil(list.length / limit) || 1 },
  };
}

const queueView = async (orderId, storeId) => {
  const order = await findOrder(orderId, storeId);
  const items = await withItems([order.toObject()]);
  return toQueueOrder(order.toObject(), items.get(String(order._id)) || []);
};

/** Kitchen acknowledges a confirmed order: confirmed -> queued. */
export async function queueOrder(user, orderId) {
  const { order, storeId } = await findVisibleOrder(user, orderId);
  mustLead(user, order);
  if (order.orderStatus !== 'confirmed') throw new ValidationError('Only a confirmed order can be queued');
  if (order.kitchen.queuedAt) throw new ValidationError('This order is already in the queue');
  order.kitchen.queuedAt = new Date();
  logStep(order, user, 'Order accepted into the kitchen queue');
  await order.save();
  return queueView(order._id, storeId);
}

export async function assignChef(user, orderId, { chefId } = {}) {
  const { storeId } = await findVisibleOrder(user, orderId);
  // storeOrders.assignStaff enforces manager / that order's supervisor, active member of this store, not a supervisor.
  await assignStaff(user, orderId, { staffId: chefId, role: 'pizza_chef' });
  return queueView(orderId, storeId);
}

/** Rejects individual pizzas of an order (out of stock, can't be made). Prices are untouched; refunds are a finance matter. */
export async function rejectItems(user, { orderId, itemIds, reason, notifyCustomer } = {}) {
  const { order, storeId } = await findVisibleOrder(user, orderId);
  mustLead(user, order);
  if (!IN_KITCHEN.includes(order.orderStatus)) throw new ValidationError('This order is not in the kitchen');
  const ids = (Array.isArray(itemIds) ? itemIds : []).filter(isId);
  if (!ids.length) throw new ValidationError('Choose the items to reject');
  const why = str(reason, 300);
  if (!why) throw new ValidationError('A reason is required');

  await ensureItems([order.toObject()]);
  const all = await KitchenItem.find({ orderId: order._id });
  const chosen = all.filter((r) => ids.includes(String(r._id)));
  if (chosen.length !== new Set(ids).size) throw new ValidationError('Some items do not belong to this order');
  const remaining = all.filter((r) => !r.rejected && !chosen.includes(r));
  if (!remaining.length) throw new ValidationError('Cannot reject every item. Reject the whole order instead.');

  await KitchenItem.updateMany({ _id: { $in: chosen.map((r) => r._id) } }, { $set: { rejected: true, rejectReason: why } });
  logStep(order, user, `Items rejected: ${chosen.map((r) => r.name).join(', ')}. Reason: ${why}`);
  await order.save();
  await syncOrderStage(user, storeId, order._id);

  if (notifyCustomer) {
    await notifyOwnersSafely([{ ownerType: 'USER', ownerId: order.userId }], {
      title: 'Update on your order',
      body: `Sorry, we could not prepare ${chosen.map((r) => r.name).join(', ')} in order #${order.order_id || order._id}. ${why}`,
      data: { type: 'order_item_rejected', orderId: String(order._id) },
    });
  }
  return { orderId: String(order._id), rejected: chosen.map((r) => String(r._id)) };
}

// ---------------------------------------------------------------------------------------------
// Delayed orders (manager / supervisor only)
// ---------------------------------------------------------------------------------------------

const delayStage = (o) => {
  const s = o.kitchen?.stage;
  return s === 'baking' || s === 'packaging' || s === 'preparing' ? s : 'queued';
};

const staffOfStage = (o) => {
  const slot = { queued: 'pizza_chef', preparing: 'pizza_chef', baking: 'baking_chef', packaging: 'packaging_staff' }[delayStage(o)];
  return idStr(o.kitchen?.staff?.[slot]?.userId) || null;
};

function toDelayedOrder(order) {
  const ops = toOpsOrder(order);
  const k = order.kitchen || {};
  const late = k.expectedReadyAt ? Math.max(0, Math.round((Date.now() - new Date(k.expectedReadyAt)) / 60000)) : 0;
  return {
    _id: ops._id,
    orderNumber: ops.orderNumber,
    customer: { name: ops.customer.name, phone: ops.customer.phone },
    status: delayStage(order),
    assigned_staff: staffOfStage(order),
    createdAt: order.createdAt,
    expectedReadyTime: k.expectedReadyAt,
    sla_minutes: k.estimatedPrepMinutes || 20,
    priority: priorityLabel(order),
    grandTotal: ops.grandTotal,
    isDelayed: isDelayed(order),
    delay_duration: late,
    reason: k.delayReason || '',
    delayResolution: k.delayResolution || '',
    timeline: ops.timeline.map((t) => ({ status: t.status, time: t.timestamp, note: t.note })),
    items: ops.items.map((i) => ({ name: i.name, quantity: i.quantity, size: i.size })),
  };
}

export async function delayedOrders(user, q = {}) {
  mustBeLeadRole(user);
  const orders = await visibleKitchenOrders(user);
  const resolvedView = String(q.resolved) === 'true';
  let list = orders.filter((o) => (resolvedView ? !!o.kitchen?.delayResolvedAt : isDelayed(o)));
  const search = String(q.search || '').trim().toLowerCase();
  if (search) list = list.filter((o) => [o.order_id, o.customerName, o.customerPhone].some((v) => String(v || '').toLowerCase().includes(search)));
  if (q.stage && q.stage !== 'All') list = list.filter((o) => delayStage(o) === String(q.stage).toLowerCase());
  if (q.priority && q.priority !== 'All') list = list.filter((o) => priorityLabel(o) === String(q.priority).toUpperCase());
  if (q.staffId && q.staffId !== 'All') list = list.filter((o) => staffOfStage(o) === q.staffId);
  if (q.issueType && q.issueType !== 'All') list = list.filter((o) => o.kitchen?.delayReason === q.issueType);
  const rows = list.map(toDelayedOrder);
  return String(q.criticalOnly) === 'true' ? rows.filter((r) => r.delay_duration > 20) : rows;
}

const SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];

export async function escalateOrder(user, orderId, { severity, reason, assignedTo, notes } = {}) {
  const { order, storeId } = await findVisibleOrder(user, orderId);
  mustLead(user, order);
  const why = str(reason, 500);
  if (!why) throw new ValidationError('A reason is required');
  let assignee = null;
  if (assignedTo) {
    if (!isId(assignedTo)) throw new ValidationError('Choose who to escalate to');
    assignee = await StoreManager.findOne({ userId: toObjectId(assignedTo), storeId: String(storeId), status: 'Active' }).select('userId name').lean();
    if (!assignee) throw new ValidationError('That person is not an active member of this store');
  }
  const esc = await KitchenEscalation.create({
    storeId: toObjectId(storeId),
    orderId: order._id,
    severity: SEVERITIES.includes(severity) ? severity : 'Medium',
    reason: why,
    assignedTo: assignee?.userId || null,
    notes: str(notes, 1000),
    createdBy: toObjectId(user.userId),
  });
  if (!order.kitchen.delayReason) order.kitchen.delayReason = str(why, 80);
  logStep(order, user, `Escalated (${esc.severity}): ${why}`);
  await order.save();
  if (assignee) {
    await notifyUsers({
      userIds: [assignee.userId], storeId, type: 'task_delayed', title: `Escalation: order ${order.order_id || order._id}`,
      message: `${esc.severity}: ${why}`,
    });
  }
  return { _id: String(esc._id), orderId: String(order._id), severity: esc.severity, reason: esc.reason, assignedTo: assignee ? String(assignee.userId) : null, notes: esc.notes, createdAt: esc.createdAt };
}

export async function reassignOrderStaff(user, orderId, { staffId } = {}) {
  const { order } = await findVisibleOrder(user, orderId);
  mustLead(user, order);
  await assignStaff(user, orderId, { staffId });
  return { orderId: String(order._id), staffId: String(staffId) };
}

export async function notifyCustomer(user, orderId, { channels, message } = {}) {
  const { order } = await findVisibleOrder(user, orderId);
  mustLead(user, order);
  const text = str(message, 500);
  if (!text) throw new ValidationError('A message is required');
  const used = (Array.isArray(channels) ? channels : []).map((c) => str(c, 20)).filter(Boolean);
  // The customer is reached through the app's push notification; sms / whatsapp are recorded as requested.
  await notifyOwnersSafely([{ ownerType: 'USER', ownerId: order.userId }], {
    title: `Update on order #${order.order_id || order._id}`,
    body: text,
    data: { type: 'order_delay_notice', orderId: String(order._id) },
  });
  logStep(order, user, `Customer notified (${used.join(', ') || 'push'}): ${text}`);
  await order.save();
  return { orderId: String(order._id), channels: used, message: text };
}

export async function resolveDelay(user, orderId, { resolutionNotes } = {}) {
  const { order } = await findVisibleOrder(user, orderId);
  mustLead(user, order);
  if (!isDelayed(order)) throw new ValidationError('This order is not delayed');
  order.kitchen.delayResolvedAt = new Date();
  order.kitchen.delayResolution = str(resolutionNotes, 500);
  logStep(order, user, `Delay resolved. ${order.kitchen.delayResolution}`.trim());
  await order.save();
  return { orderId: String(order._id), isDelayed: false };
}

// ---------------------------------------------------------------------------------------------
// Packaging station
// ---------------------------------------------------------------------------------------------

const packStatus = (o) => o.kitchen?.packaging?.status || 'ready_for_packaging';

function toPackagingOrder(order) {
  const ops = toOpsOrder(order);
  const p = order.kitchen?.packaging || {};
  return {
    _id: ops._id,
    orderNumber: ops.orderNumber,
    customer: {
      name: ops.customer.name,
      phone: ops.customer.phone,
      deliveryAddress: { street: ops.deliveryAddress.houseNumber, area: ops.deliveryAddress.landmark, city: ops.deliveryAddress.city, zipcode: ops.deliveryAddress.pincode },
    },
    items: ops.items.map((i) => ({ name: i.name, quantity: i.quantity, size: i.size })),
    deliveryType: 'Delivery',
    packaging_status: packStatus(order),
    status: order.orderStatus === 'ready_for_pickup' ? 'ready' : 'preparing',
    assigned_staff: idStr(p.staff?.userId || order.kitchen?.staff?.packaging_staff?.userId) || null,
    packaging_start_time: p.startedAt || null,
    packaging_end_time: p.sealedAt || null,
    pickup_number: `P-${String(order.order_id || order._id).replace(/\D/g, '').slice(-3) || String(order._id).slice(-3)}`,
    createdAt: order.createdAt,
  };
}

export async function packagingOrders(user, q = {}) {
  const storeId = toObjectId(requireStore(user));
  // Orders waiting to be packed, plus the ones handed to the rider in the last 6 hours.
  const recent = new Date(Date.now() - 6 * 3600 * 1000);
  const filter = {
    storeId,
    $or: [
      { orderStatus: { $in: IN_KITCHEN }, 'kitchen.stage': 'packaging' },
      { orderStatus: 'ready_for_pickup', 'kitchen.packaging.status': 'ready_for_pickup', updatedAt: { $gte: recent } },
    ],
  };
  if (isSupervisor(user)) filter['kitchen.supervisor.userId'] = toObjectId(user.userId);
  if (isStaff(user)) filter['kitchen.staff.packaging_staff.userId'] = toObjectId(user.userId);
  let list = await FoodOrder.find(filter).sort({ createdAt: 1 }).limit(200).lean();

  const search = String(q.search || '').trim().toLowerCase();
  if (search) list = list.filter((o) => [o.order_id, o.customerName, o.customerPhone].some((v) => String(v || '').toLowerCase().includes(search)));
  if (q.status && q.status !== 'All') list = list.filter((o) => packStatus(o) === q.status);
  if (q.staff && q.staff !== 'All') list = list.filter((o) => idStr(o.kitchen?.packaging?.staff?.userId || o.kitchen?.staff?.packaging_staff?.userId) === q.staff);
  if (String(q.readyForPickup) === 'true') list = list.filter((o) => packStatus(o) === 'ready_for_pickup');
  if (String(q.pendingPackaging) === 'true') list = list.filter((o) => packStatus(o) === 'ready_for_packaging');
  return list.map(toPackagingOrder);
}

/** The order at the packaging station that the caller may work on: manager, its supervisor, or its packaging staff. */
async function packagingOrder(user, orderId) {
  const { order, storeId } = await findVisibleOrder(user, orderId);
  const allowed = isManager(user) || (isSupervisor(user) && isOrderSupervisor(order, user.userId)) ||
    (isStaff(user) && staffSlotsOf(order, user.userId).includes('packaging_staff'));
  if (!allowed) throw new ForbiddenError('This order is not assigned to you for packaging.');
  if (!IN_KITCHEN.includes(order.orderStatus) || order.kitchen.stage !== 'packaging') {
    throw new ValidationError('This order is not at the packaging station');
  }
  if (!order.kitchen.packaging) order.kitchen.packaging = { status: 'ready_for_packaging' };
  return { order, storeId };
}

export async function startPackaging(user, { orderId } = {}) {
  const { order } = await packagingOrder(user, orderId);
  const p = order.kitchen.packaging;
  if (p.status !== 'ready_for_packaging') throw new ValidationError('Packaging has already started');
  p.status = 'packaging_started';
  p.startedAt = new Date();
  if (isStaff(user)) {
    const slot = order.kitchen.staff.packaging_staff;
    p.staff = { userId: toObjectId(user.userId), name: slot?.name || '', assignedAt: new Date() };
  }
  order.markModified('kitchen');
  logStep(order, user, 'Packaging started');
  await order.save();
  return toPackagingOrder(order.toObject());
}

const CHECKS = ['pizzaCountVerified', 'saucesIncluded', 'cutleryIncluded', 'billAttached', 'qualityVerified', 'packagingSealed'];

export async function packagingChecklist(user, payload = {}) {
  const { order } = await packagingOrder(user, payload.orderId);
  const p = order.kitchen.packaging;
  if (p.status !== 'packaging_started') throw new ValidationError(p.status === 'ready_for_packaging' ? 'Start packaging first' : 'The checklist is already done');
  const missing = CHECKS.filter((c) => payload[c] !== true);
  if (missing.length) throw new ValidationError('Tick every item on the packaging checklist');
  p.checklist = { ...Object.fromEntries(CHECKS.map((c) => [c, true])), notes: str(payload.notes, 1000) };
  p.status = 'quality_checked';
  order.markModified('kitchen');
  logStep(order, user, 'Packaging checklist verified');
  await order.save();
  return toPackagingOrder(order.toObject());
}

export async function sealPackage(user, { orderId, remarks } = {}) {
  const { order } = await packagingOrder(user, orderId);
  const p = order.kitchen.packaging;
  if (p.status !== 'quality_checked') throw new ValidationError('Complete the packaging checklist before sealing');
  p.status = 'sealed';
  p.sealedAt = new Date();
  p.sealRemarks = str(remarks, 500);
  order.markModified('kitchen');
  logStep(order, user, 'Package sealed');
  await order.save();
  return toPackagingOrder(order.toObject());
}

/** Sealed package handed over: the order becomes ready for pickup, which notifies the customer and the rider. */
export async function markReady(user, orderId) {
  const { order, storeId } = await packagingOrder(user, orderId);
  const p = order.kitchen.packaging;
  if (p.status !== 'sealed') throw new ValidationError('Seal the package before marking it ready');
  p.status = 'ready_for_pickup';
  order.markModified('kitchen');
  await order.save();
  const moved = await moveToStage(user, storeId, order, 'ready');
  return toPackagingOrder(moved.toObject());
}

// ---------------------------------------------------------------------------------------------
// My Tasks: ingredient request + quality check
// ---------------------------------------------------------------------------------------------

/** A task of the caller's own store; staff may only use their own tasks, leads any task of an order they lead. */
async function findScopedTask(user, taskId, storeId) {
  if (!isId(taskId)) throw new NotFoundError('Task not found');
  const task = await KitchenTask.findOne({ _id: toObjectId(taskId), storeId: toObjectId(storeId) }).lean();
  if (!task) throw new NotFoundError('Task not found');
  if (isStaff(user) && String(task.assignedTo) !== String(user.userId)) throw new NotFoundError('Task not found');
  if (isSupervisor(user)) {
    const order = await FoodOrder.findOne({ _id: task.orderId, storeId: toObjectId(storeId) }).select('kitchen').lean();
    if (!order || !isOrderSupervisor(order, user.userId)) throw new NotFoundError('Task not found');
  }
  return task;
}

export async function requestIngredient(user, { ingredientName, quantity, unit, reason, taskId } = {}) {
  const storeId = requireStore(user);
  const name = str(ingredientName, 120);
  const qty = Number(quantity);
  const un = str(unit, 20);
  if (!name) throw new ValidationError('Ingredient name is required');
  if (!Number.isFinite(qty) || qty <= 0 || qty > 100000) throw new ValidationError('Enter a valid quantity');
  if (!un) throw new ValidationError('Unit is required');
  const task = taskId ? await findScopedTask(user, taskId, storeId) : null;

  const request = await IngredientRequest.create({
    storeId: toObjectId(storeId),
    requestedBy: toObjectId(user.userId),
    taskId: task?._id || null,
    ingredientName: name,
    quantity: qty,
    unit: un,
    reason: str(reason, 500),
  });
  const managers = await StoreManager.find({ storeId: String(storeId), status: 'Active', role: /manager/i, userId: { $ne: null } }).select('userId').lean();
  await notifyUsers({
    userIds: managers.map((m) => m.userId).filter((id) => String(id) !== String(user.userId)),
    storeId, taskId: task?._id || null, type: 'task_assigned', title: 'Ingredient request',
    message: `${qty} ${un} of ${name}${request.reason ? ` - ${request.reason}` : ''}`,
  });
  return { _id: String(request._id), ingredientName: name, quantity: qty, unit: un, reason: request.reason, status: request.status, createdAt: request.createdAt };
}

export async function listIngredientRequests(user) {
  const storeId = toObjectId(requireStore(user));
  const filter = { storeId };
  if (!isManager(user)) filter.requestedBy = toObjectId(user.userId);
  const rows = await IngredientRequest.find(filter).sort({ createdAt: -1 }).limit(200).lean();
  return rows.map((r) => ({
    _id: String(r._id), requestedBy: String(r.requestedBy), ingredientName: r.ingredientName, quantity: r.quantity,
    unit: r.unit, reason: r.reason, status: r.status, createdAt: r.createdAt,
  }));
}

export async function submitQualityCheck(user, payload = {}) {
  const storeId = requireStore(user);
  mustBeLeadRole(user);
  const rating = Number(payload.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new ValidationError('Rating must be 1 to 5');

  let task = null;
  let order = null;
  if (payload.taskId) {
    task = await findScopedTask(user, payload.taskId, storeId);
    order = await FoodOrder.findOne({ _id: task.orderId, storeId: toObjectId(storeId) });
  } else {
    // Without a task, the order is looked up by its number inside the caller's own store.
    order = await FoodOrder.findOne({ storeId: toObjectId(storeId), order_id: str(payload.orderId, 60) });
  }
  if (!order) throw new NotFoundError('Order not found');
  if (isSupervisor(user) && !isOrderSupervisor(order, user.userId)) throw new NotFoundError('Order not found');
  // A task can only vouch for its own order.
  if (task && payload.orderId && String(payload.orderId) !== String(order.order_id) && String(payload.orderId) !== String(order._id)) {
    throw new ValidationError('That order does not belong to this task');
  }

  const temperature = payload.temperature === undefined || payload.temperature === '' ? null : Number(payload.temperature);
  if (temperature !== null && (!Number.isFinite(temperature) || temperature < 0 || temperature > 400)) throw new ValidationError('Enter a valid temperature');

  const check = await QualityCheck.create({
    storeId: toObjectId(storeId),
    orderId: order._id,
    taskId: task?._id || null,
    checkedBy: toObjectId(user.userId),
    rating,
    temperature,
    toppingsCorrect: payload.toppingsCorrect !== false,
    crustCorrect: payload.crustCorrect !== false,
    remarks: str(payload.remarks, 1000),
  });
  logStep(order, user, `Quality check: ${rating}/5${check.remarks ? ` - ${check.remarks}` : ''}`);
  await order.save();
  return { _id: String(check._id), orderId: order.order_id || String(order._id), rating, createdAt: check.createdAt };
}

export async function listQualityChecks(user) {
  const storeId = toObjectId(requireStore(user));
  mustBeLeadRole(user);
  const filter = { storeId };
  if (isSupervisor(user)) filter.checkedBy = toObjectId(user.userId);
  const rows = await QualityCheck.find(filter).sort({ createdAt: -1 }).limit(200).lean();
  return rows.map((r) => ({
    _id: String(r._id), orderId: String(r.orderId), rating: r.rating, temperature: r.temperature,
    toppingsCorrect: r.toppingsCorrect, crustCorrect: r.crustCorrect, remarks: r.remarks, createdAt: r.createdAt,
  }));
}
