import mongoose from 'mongoose';
import { KitchenTask } from '../models/kitchenTask.model.js';
import { TaskNotification } from '../models/taskNotification.model.js';
import { FoodOrder } from '../../orders/models/order.model.js';
import { StoreManager } from '../../franchise/models/storeManager.model.js';
import { ForbiddenError, NotFoundError, ValidationError } from '../../../../core/auth/errors.js';
import { config } from '../../../../config/env.js';

// My Tasks: the work items behind an order in the kitchen. A task is created when the store manager
// hands an order to a supervisor (kind 'supervisor') and when a supervisor assigns a station
// (kind 'staff', one per slot). Everything is scoped by the storeId and userId in the token.

const normalizeRole = (role) => String(role || '').trim().replace(/-/g, '_').toUpperCase();
const STAFF_SLOTS = ['pizza_chef', 'baking_chef', 'packaging_staff'];
const IN_KITCHEN = ['confirmed', 'preparing'];

const SLOT_INFO = {
  pizza_chef: { type: 'prep', verb: 'Prepare', station: 'Pizza Station' },
  baking_chef: { type: 'bake', verb: 'Bake', station: 'Baking Station' },
  packaging_staff: { type: 'pack', verb: 'Pack', station: 'Packaging Station' },
};
const SUPERVISOR_INFO = { type: 'oversee', verb: 'Oversee', station: 'Kitchen Supervision' };

const toId = (v) => new mongoose.Types.ObjectId(String(v));
const idStr = (v) => (v ? String(v._id || v) : '');
const str = (v, max) => String(v ?? '').trim().slice(0, max);

const requireStore = (user) => {
  if (!user?.storeId) throw new ForbiddenError('No store is linked to your account.');
  return String(user.storeId);
};
const isManagerRole = (user) => normalizeRole(user.role) === 'STORE_MANAGER';
const isSupervisorRole = (user) => normalizeRole(user.role) === 'KITCHEN_SUPERVISOR';
const requireLead = (user) => {
  if (!isManagerRole(user) && !isSupervisorRole(user)) {
    throw new ForbiddenError('Only the store manager or a kitchen supervisor can do this.');
  }
};

// ---------------------------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------------------------

export const notifyUsers = async ({ userIds, storeId, taskId = null, type, title, message = '' }) => {
  const unique = [...new Set((userIds || []).filter(Boolean).map(String))];
  if (!unique.length) return;
  await TaskNotification.insertMany(
    unique.map((userId) => ({ userId, storeId: toId(storeId), taskId, type, title, message })),
  );
};

// The people who must hear about delays and handoff requests: the order's supervisor + the store's managers
const leadsOf = async (storeId, order, exceptUserId) => {
  const managers = await StoreManager.find({ storeId: String(storeId), status: 'Active', role: /manager/i, userId: { $ne: null } })
    .select('userId').lean();
  const ids = [order?.kitchen?.supervisor?.userId, ...managers.map((m) => m.userId)].filter(Boolean).map(String);
  return ids.filter((id) => id !== String(exceptUserId));
};

// ---------------------------------------------------------------------------------------------
// Serialiser: KitchenTask (+ its order) -> the shape the My Tasks screens render
// ---------------------------------------------------------------------------------------------

const itemsSummary = (items = []) => {
  const text = items
    .map((i) => `${i.name}${i.size ? ` (${i.size})` : ''}${i.quantity > 1 ? ` x${i.quantity}` : ''}`)
    .join(', ');
  return text.length > 110 ? `${text.slice(0, 107)}...` : text;
};

const toUiTask = (t, order, names) => {
  const info = t.kind === 'supervisor' ? SUPERVISOR_INFO : SLOT_INFO[t.slot] || SLOT_INFO.pizza_chef;
  const orderNumber = order?.order_id || idStr(t.orderId);
  const minutes = t.startedAt && t.completedAt ? Math.round(((t.completedAt - t.startedAt) / 60000) * 10) / 10 : 0;
  return {
    _id: String(t._id),
    storeId: idStr(t.storeId),
    orderId: orderNumber,
    orderRef: idStr(t.orderId),
    taskType: info.type,
    title: `${info.verb} ${itemsSummary(order?.items) || `order ${orderNumber}`}`,
    description: [`Order ${orderNumber}`, order?.note ? `Note: ${order.note}` : ''].filter(Boolean).join(' · '),
    assignedTo: names.get(idStr(t.assignedTo)) || '',
    assignedToId: idStr(t.assignedTo),
    assignedBy: names.get(idStr(t.assignedBy)) || '',
    station: info.station,
    priority: order?.kitchen?.priority === 'urgent' ? 'high' : 'medium',
    status: t.status,
    estimatedMinutes: order?.kitchen?.estimatedPrepMinutes || 15,
    actualMinutes: minutes,
    startedAt: t.startedAt,
    completedAt: t.completedAt,
    notes: t.notes || '',
    completionNotes: t.completionNotes || '',
    attachments: t.proofImage ? [t.proofImage] : [],
    delayReason: t.delay?.reason || '',
    delayRemarks: t.delay?.remarks || '',
    delayMinutes: t.delay?.minutes || 0,
    reassignRequested: !!t.reassignRequest?.requested,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
};

const serialise = async (tasks) => {
  if (!tasks.length) return [];
  const orders = await FoodOrder.find({ _id: { $in: tasks.map((t) => t.orderId) } })
    .select('order_id items note kitchen').lean();
  const orderById = new Map(orders.map((o) => [String(o._id), o]));
  const userIds = [...new Set(tasks.flatMap((t) => [idStr(t.assignedTo), idStr(t.assignedBy)]).filter(Boolean))];
  const people = await StoreManager.find({ userId: { $in: userIds } }).select('userId name').lean();
  const names = new Map(people.map((p) => [String(p.userId), p.name]));
  return tasks.map((t) => toUiTask(t, orderById.get(idStr(t.orderId)), names));
};

// ---------------------------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------------------------

export async function listMyTasks(user) {
  const storeId = requireStore(user);
  const tasks = await KitchenTask.find({ storeId: toId(storeId), assignedTo: toId(user.userId) })
    .sort({ createdAt: -1 }).limit(300).lean();
  return serialise(tasks);
}

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const taskStats = (tasks, since) => {
  const count = (s) => tasks.filter((t) => t.status === s).length;
  const done = tasks.filter((t) => t.status === 'completed' && t.startedAt && t.completedAt);
  const avgMin = done.length ? done.reduce((n, t) => n + (t.completedAt - t.startedAt) / 60000, 0) / done.length : null;
  return {
    pendingTasks: count('pending'),
    inProgressTasks: count('in_progress'),
    delayedTasks: count('delayed'),
    completedToday: tasks.filter((t) => t.status === 'completed' && t.completedAt >= since).length,
    avgCompletionTime: avgMin === null ? 'N/A' : `${avgMin.toFixed(1)} mins`,
    done,
  };
};

export async function myTaskStats(user) {
  const storeId = requireStore(user);
  const week = new Date(Date.now() - 7 * 86400000);
  const tasks = await KitchenTask.find({
    storeId: toId(storeId),
    assignedTo: toId(user.userId),
    $or: [{ status: { $ne: 'completed' } }, { completedAt: { $gte: week } }],
  }).lean();
  const s = taskStats(tasks, startOfToday());

  // On time = finished within the order's estimated prep time
  let performanceScore = 'N/A';
  if (s.done.length) {
    const orders = await FoodOrder.find({ _id: { $in: s.done.map((t) => t.orderId) } }).select('kitchen').lean();
    const est = new Map(orders.map((o) => [String(o._id), o.kitchen?.estimatedPrepMinutes || 15]));
    const onTime = s.done.filter((t) => (t.completedAt - t.startedAt) / 60000 <= (est.get(String(t.orderId)) || 15)).length;
    performanceScore = `${((onTime / s.done.length) * 100).toFixed(1)}%`;
  }
  const { done, ...rest } = s;
  return { ...rest, performanceScore };
}

export async function teamTasks(user) {
  requireLead(user);
  const storeId = requireStore(user);
  const week = new Date(Date.now() - 7 * 86400000);
  const [tasks, staff] = await Promise.all([
    KitchenTask.find({
      storeId: toId(storeId),
      $or: [{ status: { $ne: 'completed' } }, { completedAt: { $gte: week } }],
    }).lean(),
    StoreManager.find({ storeId, status: 'Active', userId: { $ne: null }, role: { $not: /manager/i } })
      .select('userId name').lean(),
  ]);
  const s = taskStats(tasks, startOfToday());
  const staffList = staff.map((m) => {
    const active = tasks.filter((t) => idStr(t.assignedTo) === String(m.userId) && ['pending', 'in_progress'].includes(t.status)).length;
    return { _id: String(m.userId), name: m.name, activeTasks: active, status: active ? 'Active' : 'Idle' };
  });
  return {
    activeStaffCount: staffList.filter((m) => m.activeTasks > 0).length,
    totalStaff: staffList.length,
    pendingTasks: s.pendingTasks,
    delayedTasks: s.delayedTasks,
    completedToday: s.completedToday,
    staffList,
  };
}

// ---------------------------------------------------------------------------------------------
// Task actions. A task outside the caller's reach is a 404 (its existence is not revealed).
// ---------------------------------------------------------------------------------------------

const findTask = async (id, query) => {
  if (!mongoose.isValidObjectId(id)) throw new NotFoundError('Task not found');
  const task = await KitchenTask.findOne({ _id: id, ...query });
  if (!task) throw new NotFoundError('Task not found');
  return task;
};

// The assignee's own task
const findMyTask = (user, id) =>
  findTask(id, { storeId: toId(requireStore(user)), assignedTo: toId(user.userId) });

const view = async (task) => (await serialise([task.toObject()]))[0];

export async function startTask(user, id, payload = {}) {
  const task = await findMyTask(user, id);
  if (!['pending', 'delayed'].includes(task.status)) throw new ValidationError(`Task is already ${task.status.replace('_', ' ')}`);
  task.status = 'in_progress';
  task.startedAt = task.startedAt || new Date();
  if (payload.notes) task.notes = str(payload.notes, 1000);
  await task.save();
  return view(task);
}

// Proof must be an image we uploaded: https://res.cloudinary.com/<our cloud>/(image|video)/upload/... Any other
// link (tracking pixels, other hosts, base64 previews) is dropped, because supervisors' browsers load it.
const proofUrl = (v) => {
  const raw = String(v || '');
  const cloud = config.cloudinaryCloudName;
  if (!cloud || raw.length > 2000) return '';
  let url;
  try { url = new URL(raw); } catch { return ''; }
  const ours = url.protocol === 'https:' && url.hostname === 'res.cloudinary.com' && !url.port && !url.username && !url.password;
  return ours && url.pathname.startsWith(`/${cloud}/image/upload/`) ? raw : '';
};

export async function completeTask(user, id, payload = {}) {
  const task = await findMyTask(user, id);
  if (task.status !== 'in_progress') throw new ValidationError('Start the task before completing it');
  task.status = 'completed';
  task.completedAt = new Date();
  task.completionNotes = str(payload.notes, 1000);
  task.proofImage = proofUrl(payload.image);
  await task.save();
  return view(task);
}

export async function reportDelay(user, id, payload = {}) {
  const task = await findMyTask(user, id);
  if (!['pending', 'in_progress'].includes(task.status)) throw new ValidationError('Only an open task can be reported as delayed');
  const reason = str(payload.reason, 200);
  if (!reason) throw new ValidationError('A delay reason is required');
  task.status = 'delayed';
  task.delay = {
    reason,
    remarks: str(payload.remarks, 1000),
    minutes: Math.max(0, Math.min(Number(payload.delayMinutes) || 0, 600)),
    reportedAt: new Date(),
  };
  await task.save();

  const order = await FoodOrder.findById(task.orderId).select('order_id kitchen').lean();
  await notifyUsers({
    userIds: await leadsOf(task.storeId, order, user.userId),
    storeId: task.storeId,
    taskId: task._id,
    type: 'task_delayed',
    title: 'Task Delayed',
    message: `Order ${order?.order_id || idStr(task.orderId)} is delayed: ${reason}.`,
  });
  return view(task);
}

export async function requestReassign(user, id, payload = {}) {
  const task = await findMyTask(user, id);
  if (task.status === 'completed') throw new ValidationError('A completed task cannot be handed off');
  task.reassignRequest = {
    requested: true,
    reason: str(payload.reason, 500),
    preferredStaff: str(payload.preferredStaff, 120),
    requestedAt: new Date(),
  };
  await task.save();

  const order = await FoodOrder.findById(task.orderId).select('order_id kitchen').lean();
  await notifyUsers({
    userIds: await leadsOf(task.storeId, order, user.userId),
    storeId: task.storeId,
    taskId: task._id,
    type: 'reassign_requested',
    title: 'Handoff Requested',
    message: `A handoff was requested for order ${order?.order_id || idStr(task.orderId)}${task.reassignRequest.reason ? `: ${task.reassignRequest.reason}` : '.'}`,
  });
  return view(task);
}

// A staff member of this store (never the manager or a supervisor), matched by id or by name
const findStaffTarget = async (storeId, who) => {
  const key = str(who, 120);
  if (!key) throw new ValidationError('Choose who the task goes to');
  const filter = { storeId: String(storeId), status: 'Active', userId: { $ne: null }, role: { $not: /manager|supervisor/i } };
  const members = await StoreManager.find(filter).select('userId name').lean();
  const match = members.find((m) => String(m.userId) === key) || members.find((m) => m.name.toLowerCase() === key.toLowerCase());
  if (!match) throw new ValidationError('That person is not an active kitchen staff member of this store');
  return match;
};

export async function reassignTask(user, id, payload = {}) {
  requireLead(user);
  const storeId = requireStore(user);
  const task = await findTask(id, { storeId: toId(storeId) });
  if (task.status === 'completed') throw new ValidationError('A completed task cannot be reassigned');
  if (task.kind === 'supervisor') throw new ValidationError('Supervisor tasks cannot be reassigned here');

  const order = await FoodOrder.findOne({ _id: task.orderId, storeId: toId(storeId) }).select('order_id orderStatus kitchen').lean();
  if (!order) throw new NotFoundError('Task not found');
  if (isSupervisorRole(user) && idStr(order.kitchen?.supervisor?.userId) !== String(user.userId)) {
    throw new ForbiddenError('This order is assigned to another supervisor.');
  }

  const target = await findStaffTarget(storeId, payload.assignedTo ?? payload.staffId);
  const previous = idStr(task.assignedTo);
  if (previous === String(target.userId)) throw new ValidationError('The task is already assigned to that person');

  task.assignedTo = target.userId;
  task.assignedBy = toId(user.userId);
  task.status = task.status === 'delayed' ? 'pending' : task.status;
  task.reassignRequest = { requested: false, reason: '', preferredStaff: '', requestedAt: null };
  await task.save();

  // Keep the order's station slot in step, so the new person can move the order along
  if (IN_KITCHEN.includes(order.orderStatus) && STAFF_SLOTS.includes(task.slot)) {
    await FoodOrder.updateOne(
      { _id: order._id, [`kitchen.staff.${task.slot}.userId`]: toId(previous) },
      { $set: { [`kitchen.staff.${task.slot}`]: { userId: target.userId, name: target.name, assignedAt: new Date() } } },
    );
  }

  const label = `order ${order.order_id || idStr(order._id)}`;
  await notifyUsers({ userIds: [target.userId], storeId, taskId: task._id, type: 'task_reassigned', title: 'Task Reassigned To You', message: `You were given ${label}.` });
  await notifyUsers({ userIds: [previous], storeId, taskId: task._id, type: 'task_reassigned', title: 'Task Reassigned', message: `${label} was moved to ${target.name}.` });
  return view(task);
}

// ---------------------------------------------------------------------------------------------
// Notifications (own only)
// ---------------------------------------------------------------------------------------------

export async function listNotifications(user) {
  const rows = await TaskNotification.find({ userId: toId(user.userId), storeId: toId(requireStore(user)) })
    .sort({ createdAt: -1 }).limit(50).lean();
  return rows.map((n) => ({ id: String(n._id), _id: String(n._id), type: n.type, title: n.title, message: n.message, isRead: n.isRead, createdAt: n.createdAt }));
}

export async function markNotificationRead(user, id) {
  if (!mongoose.isValidObjectId(id)) throw new NotFoundError('Notification not found');
  const res = await TaskNotification.updateOne({ _id: id, userId: toId(user.userId) }, { $set: { isRead: true } });
  if (!res.matchedCount) throw new NotFoundError('Notification not found');
  return { id: String(id), isRead: true };
}
