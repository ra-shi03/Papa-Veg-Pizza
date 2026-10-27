import mongoose from 'mongoose';
import { FoodOrder } from '../../orders/models/order.model.js';
import { StoreManager } from '../../franchise/models/storeManager.model.js';
import { KitchenItem, ITEM_STAGES } from '../models/kitchenItem.model.js';
import { KitchenOven } from '../models/kitchenOven.model.js';
import { KitchenIssue } from '../models/kitchenIssue.model.js';
import {
  STAGE_ORDER, normalizeRole, requireStore, requireManager, isOrderSupervisor, staffSlotsOf, findOrder, moveToStage,
  toObjectId, idStr,
} from './storeOrders.service.js';
import { notifyUsers } from './kitchenTasks.service.js';
import { recipeIndex } from './inventoryOps.service.js';
import { ForbiddenError, NotFoundError, ValidationError } from '../../../../core/auth/errors.js';

// Station screens (preparation board, pizza station, baking station, ovens, kitchen issues).
// They are three views of one per-pizza lifecycle (KitchenItem.stage):
//
//   assigned -> dough_prep -> sauce -> toppings -> ready_for_baking -> baking -> baked
//
// Preparation board and pizza station show the first five stages, the baking station the last three.
// When pizzas move, the order's own kitchen stage follows (preparing -> baking -> packaging), so the
// Orders screens, My Tasks and the rider hand-off stay in step. Every query is scoped by the storeId in
// the token; a person only ever sees or changes what their role allows.

const IN_KITCHEN = ['confirmed', 'preparing'];
const PREP_STAGES = ['assigned', 'dough_prep', 'sauce', 'toppings', 'ready_for_baking'];
const DEFAULT_OVENS = 5;

const asRole = (user) => normalizeRole(user?.role);
const isManager = (user) => asRole(user) === 'STORE_MANAGER';
const isSupervisor = (user) => asRole(user) === 'KITCHEN_SUPERVISOR';
const isStaff = (user) => asRole(user) === 'KITCHEN_STAFF';
const str = (v, max) => String(v ?? '').trim().slice(0, max);
const isId = (v) => mongoose.Types.ObjectId.isValid(String(v || ''));

export const priorityLabel = (order) => (order?.kitchen?.priority === 'urgent' ? 'EXPRESS' : 'NORMAL');

// ---------------------------------------------------------------------------------------------
// Which orders / items the caller may see
// ---------------------------------------------------------------------------------------------

/** Orders in the kitchen that this person may see. Manager: the store. Supervisor: own orders. Staff: own stations. */
export async function visibleKitchenOrders(user, extra = {}) {
  const storeId = toObjectId(requireStore(user));
  const filter = { storeId, orderStatus: { $in: IN_KITCHEN }, ...extra };
  if (isSupervisor(user)) filter['kitchen.supervisor.userId'] = toObjectId(user.userId);
  if (isStaff(user)) {
    const me = toObjectId(user.userId);
    const ownItems = await KitchenItem.distinct('orderId', { storeId, $or: [{ chefId: me }, { bakerId: me }] });
    filter.$or = [
      { 'kitchen.staff.pizza_chef.userId': me },
      { 'kitchen.staff.baking_chef.userId': me },
      { 'kitchen.staff.packaging_staff.userId': me },
      { _id: { $in: ownItems } },
    ];
  }
  return FoodOrder.find(filter).sort({ createdAt: -1 }).limit(200).lean();
}

/** Creates the per-pizza rows of orders that entered the kitchen (idempotent). */
export async function ensureItems(orders) {
  const ops = [];
  for (const order of orders) {
    (order.items || []).forEach((it, index) => {
      ops.push({
        updateOne: {
          filter: { orderId: order._id, index },
          update: {
            $setOnInsert: {
              orderId: order._id,
              storeId: order.storeId,
              index,
              name: it.name || '',
              size: it.size || it.variantName || '',
              crust: it.crust || '',
              toppings: (it.selectedAddons || []).map((a) => a.name),
              quantity: it.quantity || 1,
            },
          },
          upsert: true,
        },
      });
    });
  }
  if (ops.length) await KitchenItem.bulkWrite(ops, { ordered: false });
}

const ownerOf = (item, order, kind) => {
  if (kind === 'baker') {
    const slot = order?.kitchen?.staff?.baking_chef;
    return item.bakerId ? { id: idStr(item.bakerId), name: item.bakerName } : slot?.userId ? { id: idStr(slot.userId), name: slot.name } : null;
  }
  const slot = order?.kitchen?.staff?.pizza_chef;
  return item.chefId ? { id: idStr(item.chefId), name: item.chefName } : slot?.userId ? { id: idStr(slot.userId), name: slot.name } : null;
};

/** Does this person own this pizza's current station? Leads always may; staff only their own. */
function canWorkOnItem(user, item, order, station) {
  if (isManager(user)) return true;
  if (isSupervisor(user)) return isOrderSupervisor(order, user.userId);
  if (isStaff(user)) {
    const owner = ownerOf(item, order, station === 'bake' ? 'baker' : 'chef');
    return !!owner && owner.id === String(user.userId);
  }
  return false;
}

// ---------------------------------------------------------------------------------------------
// Serialisers: the shapes the station screens render
// ---------------------------------------------------------------------------------------------

const base = (item, order) => ({
  _id: String(item._id),
  orderItemId: String(item._id),
  orderId: String(order._id),
  orderNumber: order.order_id || String(order._id),
  name: item.name,
  size: item.size,
  crust: item.crust,
  quantity: item.quantity,
  priority: priorityLabel(order),
});

const estimatedPrep = (order) => order?.kitchen?.estimatedPrepMinutes || 12;

const toPrepItem = (item, order, recipeId = null) => ({
  ...base(item, order),
  assigned_chef: ownerOf(item, order, 'chef')?.id || null,
  current_stage: item.stage,
  started_time: item.prepStartedAt,
  estimated_time: estimatedPrep(order),
  paused: !!item.paused,
  pauseReason: item.pauseReason,
  recipeId,
});

const assemblyStatus = (item) => {
  if (ITEM_STAGES.indexOf(item.stage) >= ITEM_STAGES.indexOf('ready_for_baking')) return 'assembly_completed';
  if (item.stage === 'assigned') return 'assigned';
  return item.paused ? 'assembly_paused' : 'assembly_started';
};

const toPizzaItem = (item, order, recipeId = null) => ({
  ...base(item, order),
  pizzaId: `PIZ-${String(item._id).slice(-4).toUpperCase()}`,
  assigned_chef: ownerOf(item, order, 'chef')?.id || null,
  assembly_status: assemblyStatus(item),
  assembly_started_time: item.prepStartedAt,
  completed_time: item.assemblyCompletedAt,
  target_time: estimatedPrep(order),
  toppings: item.toppings,
  paused: !!item.paused,
  pauseReason: item.pauseReason,
  pauseNotes: item.pauseNotes,
  recipeId,
});

const bakingStatus = (item) => {
  if (item.stage === 'baked') return 'baking_completed';
  if (item.stage === 'baking') return item.paused ? 'baking_paused' : 'baking_started';
  return 'ready_for_baking';
};

const toBakingItem = (item, order) => ({
  ...base(item, order),
  assigned_oven: item.ovenId ? String(item.ovenId) : null,
  assigned_staff: ownerOf(item, order, 'baker')?.id || null,
  baking_status: bakingStatus(item),
  started_time: item.bakeStartedAt,
  completed_time: item.bakeCompletedAt,
  target_time: item.expectedDuration,
  temperature: item.temperature,
  expectedDuration: item.expectedDuration,
  paused: !!item.paused,
  pauseReason: item.pauseReason,
  pauseNotes: item.pauseNotes,
  remarks: item.remarks,
});

const matches = (text, ...fields) => {
  const q = String(text || '').trim().toLowerCase();
  return !q || fields.some((f) => String(f || '').toLowerCase().includes(q));
};
const priorityMatches = (filter, order) => !filter || filter === 'All' || priorityLabel(order) === String(filter).toUpperCase();

const isDelayed = (order) => !!order.kitchen?.expectedReadyAt && new Date(order.kitchen.expectedReadyAt) < new Date() && !order.kitchen?.delayResolvedAt;

async function loadItems(user, stages, station, extraOrderFilter = {}) {
  const orders = await visibleKitchenOrders(user, extraOrderFilter);
  await ensureItems(orders);
  const items = await KitchenItem.find({ orderId: { $in: orders.map((o) => o._id) }, rejected: false, stage: { $in: stages } })
    .sort({ createdAt: 1, index: 1 }).lean();
  const byOrder = new Map(orders.map((o) => [String(o._id), o]));
  // Staff only see the pizzas that are theirs, not every pizza of an order they hold a station on.
  const visible = isStaff(user)
    ? items.filter((it) => canWorkOnItem(user, it, byOrder.get(String(it.orderId)), station))
    : items;
  return { items: visible, byOrder, recipeFor: await recipeIndex(toObjectId(requireStore(user))) };
}

// ---------------------------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------------------------

export async function preparationBoard(user, q = {}) {
  const { items, byOrder, recipeFor } = await loadItems(user, PREP_STAGES, 'prep');
  return items
    .map((it) => ({ it, order: byOrder.get(String(it.orderId)) }))
    .filter(({ it, order }) => matches(q.search, order.order_id, it.name))
    .filter(({ order }) => priorityMatches(q.priority, order))
    .filter(({ it, order }) => !q.chef || q.chef === 'All' || ownerOf(it, order, 'chef')?.id === q.chef)
    .filter(({ it }) => !q.size || q.size === 'All' || it.size === q.size)
    .filter(({ order }) => String(q.delayed) !== 'true' || isDelayed(order))
    .filter(({ it, order }) => String(q.onlyUnassigned) !== 'true' || !ownerOf(it, order, 'chef'))
    .map(({ it, order }) => toPrepItem(it, order, recipeFor(it.name)));
}

export async function pizzaStation(user, q = {}) {
  const { items, byOrder, recipeFor } = await loadItems(user, [...PREP_STAGES, 'baking', 'baked'], 'prep');
  return items
    .map((it) => ({ it, order: byOrder.get(String(it.orderId)) }))
    .filter(({ it, order }) => matches(q.search, order.order_id, it.name))
    .filter(({ it }) => !q.status || q.status === 'All' || assemblyStatus(it) === q.status)
    .filter(({ order }) => priorityMatches(q.priority, order))
    .filter(({ it, order }) => !q.chef || q.chef === 'All' || ownerOf(it, order, 'chef')?.id === q.chef)
    .filter(({ it }) => !q.size || q.size === 'All' || it.size === q.size)
    .filter(({ it }) => !q.crust || q.crust === 'All' || it.crust === q.crust)
    .filter(({ order }) => String(q.delayed) !== 'true' || isDelayed(order))
    .map(({ it, order }) => toPizzaItem(it, order, recipeFor(it.name)));
}

export async function bakingStation(user, q = {}) {
  const { items, byOrder } = await loadItems(user, ['ready_for_baking', 'baking', 'baked'], 'bake');
  return items
    .map((it) => ({ it, order: byOrder.get(String(it.orderId)) }))
    .filter(({ it, order }) => matches(q.search, order.order_id, it.name))
    .filter(({ it }) => !q.status || q.status === 'All' || bakingStatus(it) === q.status)
    .filter(({ it }) => !q.oven || q.oven === 'All' || idStr(it.ovenId) === q.oven)
    .filter(({ it, order }) => !q.staff || q.staff === 'All' || ownerOf(it, order, 'baker')?.id === q.staff)
    .filter(({ order }) => priorityMatches(q.priority, order))
    .filter(({ it }) => {
      if (String(q.delayed) !== 'true') return true;
      return it.stage === 'baking' && it.bakeStartedAt && (Date.now() - new Date(it.bakeStartedAt)) / 60000 > it.expectedDuration;
    })
    .map(({ it, order }) => toBakingItem(it, order));
}

// ---------------------------------------------------------------------------------------------
// Ovens
// ---------------------------------------------------------------------------------------------

async function ensureOvens(storeId) {
  if (await KitchenOven.exists({ storeId })) return;
  const rows = Array.from({ length: DEFAULT_OVENS }, (_, i) => ({ storeId, number: `OVEN-${String(i + 1).padStart(2, '0')}` }));
  try { await KitchenOven.insertMany(rows, { ordered: false }); } catch (err) { if (err?.code !== 11000 && !err?.writeErrors) throw err; }
}

export async function listOvens(user, q = {}) {
  const storeId = toObjectId(requireStore(user));
  await ensureOvens(storeId);
  const [ovens, baking] = await Promise.all([
    KitchenOven.find({ storeId }).sort({ number: 1 }).lean(),
    KitchenItem.find({ storeId, stage: 'baking', rejected: false }).lean(),
  ]);
  const byOven = new Map(baking.filter((b) => b.ovenId).map((b) => [String(b.ovenId), b]));
  const rows = ovens.map((o) => {
    const busy = byOven.get(String(o._id));
    const status = o.state !== 'active' ? o.state : busy ? 'busy' : 'available';
    const remaining = busy?.bakeStartedAt && !busy.paused
      ? Math.max(0, Math.round(busy.expectedDuration * 60 - (Date.now() - new Date(busy.bakeStartedAt)) / 1000))
      : busy ? busy.expectedDuration * 60 : null;
    return {
      _id: String(o._id),
      oven_number: o.number,
      status,
      temperature: busy?.temperature || o.temperature,
      current_pizza: busy?.name || null,
      remaining_time: busy ? remaining : null,
      expectedDuration: busy?.expectedDuration || null,
    };
  });
  return q.status ? rows.filter((r) => r.status === q.status) : rows;
}

// ---------------------------------------------------------------------------------------------
// Item actions
// ---------------------------------------------------------------------------------------------

async function loadItemForAction(user, itemId) {
  const storeId = requireStore(user);
  if (!isId(itemId)) throw new NotFoundError('Pizza not found');
  const item = await KitchenItem.findOne({ _id: toObjectId(itemId), storeId: toObjectId(storeId) });
  if (!item) throw new NotFoundError('Pizza not found');
  const order = await findOrder(item.orderId, storeId).catch(() => null);
  if (!order || !IN_KITCHEN.includes(order.orderStatus)) throw new ValidationError('This order is not in the kitchen');
  // A person who may not see the order cannot learn that the pizza exists.
  const seen = isManager(user) || (isSupervisor(user) && isOrderSupervisor(order, user.userId)) ||
    (isStaff(user) && (staffSlotsOf(order, user.userId).length > 0 || [idStr(item.chefId), idStr(item.bakerId)].includes(String(user.userId))));
  if (!seen) throw new NotFoundError('Pizza not found');
  if (item.rejected) throw new ValidationError('This item was rejected');
  return { item, order, storeId };
}

const mustWork = (user, item, order, station) => {
  if (!canWorkOnItem(user, item, order, station)) throw new ForbiddenError('This pizza is not assigned to you.');
};

/** After pizzas move, bring the order's own kitchen stage in line. Never moves an order backwards. */
export async function syncOrderStage(user, storeId, orderId) {
  const [order, items] = await Promise.all([
    findOrder(orderId, storeId),
    KitchenItem.find({ orderId: toObjectId(orderId), rejected: false }).lean(),
  ]);
  if (!items.length || !IN_KITCHEN.includes(order.orderStatus)) return order;
  const idx = (it) => ITEM_STAGES.indexOf(it.stage);
  let target = 'pending';
  if (items.every((it) => it.stage === 'baked')) target = 'packaging';
  else if (items.some((it) => it.stage === 'baking' || it.stage === 'baked') || items.every((it) => idx(it) >= ITEM_STAGES.indexOf('ready_for_baking'))) target = 'baking';
  else if (items.some((it) => it.stage !== 'assigned')) target = 'preparing';

  const current = order.kitchen?.stage || 'pending';
  if (STAGE_ORDER.indexOf(target) <= STAGE_ORDER.indexOf(current)) return order;
  const moved = await moveToStage(user, storeId, order, target);
  if (target === 'packaging' && !moved.kitchen.packaging) {
    moved.kitchen.packaging = { status: 'ready_for_packaging' };
    moved.markModified('kitchen');
    await moved.save();
  }
  return moved;
}

const done = async (user, storeId, item) => {
  await syncOrderStage(user, storeId, item.orderId);
  const order = await findOrder(item.orderId, storeId);
  return { item, order };
};

// ---- Preparation board ----------------------------------------------------------------------

export async function moveItemStage(user, itemId, stage) {
  if (!PREP_STAGES.includes(stage)) throw new ValidationError('Invalid preparation stage');
  const { item, order, storeId } = await loadItemForAction(user, itemId);
  mustWork(user, item, order, 'prep');
  if (ITEM_STAGES.indexOf(item.stage) >= ITEM_STAGES.indexOf('baking')) throw new ValidationError('This pizza has already gone to baking');
  if (ITEM_STAGES.indexOf(stage) <= ITEM_STAGES.indexOf(item.stage)) throw new ValidationError(`Pizza is already at '${item.stage}'`);
  if (item.paused) throw new ValidationError('Resume the pizza before moving it');
  if (!item.prepStartedAt) item.prepStartedAt = new Date();
  if (stage === 'ready_for_baking') item.assemblyCompletedAt = new Date();
  item.stage = stage;
  await item.save();
  const out = await done(user, storeId, item);
  return toPrepItem(out.item, out.order.toObject());
}

export async function pauseItem(user, itemId, { reason, notes } = {}, station = 'prep', { toggle = false } = {}) {
  const { item, order, storeId } = await loadItemForAction(user, itemId);
  mustWork(user, item, order, station);
  // The preparation board has a single pause button: pressing it on a paused pizza resumes it.
  if (toggle && item.paused) {
    item.paused = false; item.pauseReason = ''; item.pauseNotes = '';
    await item.save();
    return { item, order, storeId };
  }
  const stageOk = station === 'bake' ? item.stage === 'baking' : ITEM_STAGES.indexOf(item.stage) > 0 && ITEM_STAGES.indexOf(item.stage) < ITEM_STAGES.indexOf('ready_for_baking');
  if (!stageOk) throw new ValidationError(station === 'bake' ? 'Only a pizza in the oven can be paused' : 'Start the pizza before pausing it');
  if (item.paused) throw new ValidationError('Already paused');
  const why = str(reason, 200);
  if (!why) throw new ValidationError('A pause reason is required');
  item.paused = true;
  item.pauseReason = why;
  item.pauseNotes = str(notes, 500);
  await item.save();
  return { item, order, storeId };
}

export async function reassignItemChef(user, itemId, chefId) {
  const { item, order, storeId } = await loadItemForAction(user, itemId);
  if (!isManager(user) && !(isSupervisor(user) && isOrderSupervisor(order, user.userId))) {
    throw new ForbiddenError('Only the store manager or the order supervisor can reassign a pizza.');
  }
  if (ITEM_STAGES.indexOf(item.stage) >= ITEM_STAGES.indexOf('baking')) throw new ValidationError('This pizza has already gone to baking');
  if (!isId(chefId)) throw new ValidationError('Choose a chef');
  const chef = await StoreManager.findOne({ userId: toObjectId(chefId), storeId: String(storeId), status: 'Active' }).lean();
  if (!chef) throw new ValidationError('That person is not an active member of this store');
  item.chefId = chef.userId;
  item.chefName = chef.name;
  await item.save();
  await notifyUsers({
    userIds: [chef.userId], storeId, type: 'task_assigned', title: 'Pizza Reassigned To You',
    message: `${item.name} (order ${order.order_id || order._id}) is now yours.`,
  });
  return toPrepItem(item.toObject(), order.toObject());
}

// ---- Pizza station --------------------------------------------------------------------------

export async function startAssembly(user, itemId) {
  const { item, order, storeId } = await loadItemForAction(user, itemId);
  mustWork(user, item, order, 'prep');
  if (item.paused) {
    item.paused = false; item.pauseReason = ''; item.pauseNotes = '';
  } else if (item.stage === 'assigned') {
    item.stage = 'dough_prep';
    item.prepStartedAt = new Date();
  } else {
    throw new ValidationError('Assembly has already started');
  }
  await item.save();
  const out = await done(user, storeId, item);
  return toPizzaItem(out.item, out.order.toObject());
}

export async function pauseAssembly(user, itemId, payload) {
  const { item, order } = await pauseItem(user, itemId, payload, 'prep');
  return toPizzaItem(item.toObject(), order.toObject());
}

/** Preparation board pause button (pause / resume). */
export async function togglePausePrep(user, itemId, payload) {
  const { item, order } = await pauseItem(user, itemId, payload, 'prep', { toggle: true });
  return toPrepItem(item.toObject(), order.toObject());
}

export async function completeAssembly(user, itemId, { notes } = {}) {
  const { item, order, storeId } = await loadItemForAction(user, itemId);
  mustWork(user, item, order, 'prep');
  if (item.stage === 'assigned') throw new ValidationError('Start the assembly first');
  if (ITEM_STAGES.indexOf(item.stage) >= ITEM_STAGES.indexOf('ready_for_baking')) throw new ValidationError('Assembly is already complete');
  if (item.paused) throw new ValidationError('Resume the pizza before completing it');
  item.stage = 'ready_for_baking';
  item.assemblyCompletedAt = new Date();
  if (notes) item.remarks = str(notes, 500);
  await item.save();
  const out = await done(user, storeId, item);
  return toPizzaItem(out.item, out.order.toObject());
}

// ---- Baking station -------------------------------------------------------------------------

async function ovenFor(storeId, ovenId, exceptItemId = null) {
  if (!isId(ovenId)) throw new ValidationError('Choose an oven');
  const oven = await KitchenOven.findOne({ _id: toObjectId(ovenId), storeId: toObjectId(storeId) });
  if (!oven) throw new ValidationError('Oven not found in this store');
  if (oven.state !== 'active') throw new ValidationError(`${oven.number} is ${oven.state} and cannot be used`);
  const taken = await KitchenItem.exists({
    storeId: toObjectId(storeId), ovenId: oven._id, stage: 'baking', rejected: false,
    ...(exceptItemId ? { _id: { $ne: exceptItemId } } : {}),
  });
  if (taken) throw new ValidationError(`${oven.number} is busy`);
  return oven;
}

export async function startBaking(user, { orderItemId, ovenId, temperature, expectedDuration, remarks } = {}) {
  const { item, order, storeId } = await loadItemForAction(user, orderItemId);
  mustWork(user, item, order, 'bake');
  if (item.stage === 'baking' && item.paused) {
    item.paused = false; item.pauseReason = ''; item.pauseNotes = '';
    await item.save();
  } else if (item.stage === 'ready_for_baking') {
    const oven = await ovenFor(storeId, ovenId, item._id);
    item.ovenId = oven._id;
    item.temperature = Math.min(600, Math.max(0, Number(temperature) || 250));
    item.expectedDuration = Math.min(120, Math.max(1, Number(expectedDuration) || 8));
    item.bakeStartedAt = new Date();
    item.stage = 'baking';
    if (remarks) item.remarks = str(remarks, 500);
    if (isStaff(user)) { item.bakerId = toObjectId(user.userId); item.bakerName = (await myName(user, storeId)) || item.bakerName; }
    await item.save();
  } else {
    throw new ValidationError(item.stage === 'baking' ? 'Baking has already started' : 'This pizza is not ready for baking yet');
  }
  const out = await done(user, storeId, item);
  return toBakingItem(out.item, out.order.toObject());
}

export async function moveOven(user, { orderItemId, newOvenId, remarks } = {}) {
  const { item, order, storeId } = await loadItemForAction(user, orderItemId);
  mustWork(user, item, order, 'bake');
  if (item.stage !== 'baking') throw new ValidationError('Only a pizza in the oven can be moved');
  if (idStr(item.ovenId) === String(newOvenId)) throw new ValidationError('The pizza is already in this oven');
  const oven = await ovenFor(storeId, newOvenId, item._id);
  item.ovenId = oven._id;
  if (remarks) item.remarks = str(remarks, 500);
  await item.save();
  return toBakingItem(item.toObject(), order.toObject());
}

export async function pauseBaking(user, payload) {
  const { item, order } = await pauseItem(user, payload?.orderItemId, payload, 'bake');
  return toBakingItem(item.toObject(), order.toObject());
}

export async function completeBaking(user, { orderItemId, remarks } = {}) {
  const { item, order, storeId } = await loadItemForAction(user, orderItemId);
  mustWork(user, item, order, 'bake');
  if (item.stage !== 'baking') throw new ValidationError('This pizza is not in the oven');
  if (item.paused) throw new ValidationError('Resume baking before completing it');
  item.stage = 'baked';
  item.bakeCompletedAt = new Date();
  if (remarks) item.remarks = str(remarks, 500);
  await item.save();
  const out = await done(user, storeId, item);
  return toBakingItem(out.item, out.order.toObject());
}

const myName = async (user, storeId) =>
  (await StoreManager.findOne({ userId: toObjectId(user.userId), storeId: String(storeId) }).select('name').lean())?.name || '';

// ---- Kitchen issues -------------------------------------------------------------------------

const SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];

export async function reportIssue(user, { orderItemId, issueType, severity, remarks, image, notifyManager } = {}) {
  const storeId = requireStore(user);
  const type = str(issueType, 80);
  if (!type) throw new ValidationError('Issue type is required');
  let item = null;
  let order = null;
  if (orderItemId) {
    ({ item, order } = await loadItemForAction(user, orderItemId));
    // Reporting a problem is allowed on any pizza the person can see; it does not change the pizza.
  }
  const issue = await KitchenIssue.create({
    storeId: toObjectId(storeId),
    orderId: order?._id || null,
    itemId: item?._id || null,
    issueType: type,
    severity: SEVERITIES.includes(severity) ? severity : 'Medium',
    remarks: str(remarks, 1000),
    image: /^https:\/\/res\.cloudinary\.com\//.test(String(image || '')) ? String(image) : '',
    notifyManager: !!notifyManager,
    reportedBy: toObjectId(user.userId),
  });
  if (issue.notifyManager) {
    const managers = await StoreManager.find({ storeId: String(storeId), status: 'Active', role: /manager/i, userId: { $ne: null } }).select('userId').lean();
    await notifyUsers({
      userIds: managers.map((m) => m.userId).filter((id) => String(id) !== String(user.userId)), storeId, type: 'task_delayed',
      title: `Kitchen issue: ${type}`, message: `${item?.name || 'Kitchen'} (${issue.severity}). ${issue.remarks}`.trim(),
    });
  }
  return toIssue(issue.toObject());
}

const toIssue = (i) => ({
  _id: String(i._id),
  orderItemId: i.itemId ? String(i.itemId) : null,
  issueType: i.issueType,
  severity: i.severity,
  remarks: i.remarks,
  image: i.image,
  notifyManager: i.notifyManager,
  createdAt: i.createdAt,
});

// Manager: every issue of the store. Supervisor: their own and those on their orders. Staff: their own.
export async function listIssues(user) {
  const storeId = toObjectId(requireStore(user));
  const filter = { storeId };
  if (isSupervisor(user)) {
    const mine = await visibleKitchenOrders(user);
    filter.$or = [{ reportedBy: toObjectId(user.userId) }, { orderId: { $in: mine.map((o) => o._id) } }];
  } else if (!isManager(user)) {
    filter.reportedBy = toObjectId(user.userId);
  }
  const rows = await KitchenIssue.find(filter).sort({ createdAt: -1 }).limit(200).lean();
  return rows.map(toIssue);
}

export { PREP_STAGES, IN_KITCHEN, isDelayed, ownerOf, requireManager };
