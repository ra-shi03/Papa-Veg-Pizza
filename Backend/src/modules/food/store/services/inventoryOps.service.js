import { FoodOrder } from '../../orders/models/order.model.js';
import { StoreManager } from '../../franchise/models/storeManager.model.js';
import { UserRole } from '../../../../core/roles/models/userRole.model.js';
import { Role } from '../../../../core/roles/models/role.model.js';
import { uploadImageBuffer } from '../../../../services/cloudinary.service.js';
import { StoreIngredient } from '../models/storeIngredient.model.js';
import { StockRequest } from '../models/stockRequest.model.js';
import { WasteLog } from '../models/wasteLog.model.js';
import { IngredientShortage } from '../models/ingredientShortage.model.js';
import { Recipe } from '../models/recipe.model.js';
import { KitchenItem } from '../models/kitchenItem.model.js';
import { notifyUsers } from './kitchenTasks.service.js';
import { applyStock, availableStores, stockStatus, toIngredient } from './inventory.service.js';
import {
  inventoryContext, mustManager, mustBeStoreRole, actorName, ensureIngredients, nameKeyOf, toId, isId, str, round2,
  pageOf, pagination, dateRange, escapeRegex, isAll,
} from './inventoryAccess.js';
import { NotFoundError, ValidationError } from '../../../../core/auth/errors.js';

// Stock requests, waste, shortages and recipes. Same rules as inventory.service.js: the store comes from the token,
// the manager changes things, supervisors / staff report and read, a franchise admin only reads one of its stores.

const URGENCIES = ['low', 'medium', 'high', 'critical'];
const mine = (ctx, field) => (ctx.role === 'staff' ? { [field]: toId(ctx.user.userId) } : {});

const managersOf = async (ctx) => (await StoreManager.find({ storeId: String(ctx.storeId), status: 'Active', role: /manager/i, userId: { $ne: null } }).select('userId').lean()).map((m) => m.userId);
const tellManagers = async (ctx, { title, message, taskId = null }) => {
  const ids = (await managersOf(ctx)).filter((id) => String(id) !== String(ctx.user.userId));
  await notifyUsers({ userIds: ids, storeId: ctx.storeId, taskId, type: 'task_assigned', title, message });
};

/** Name + shift + department card shown next to a request / waste report. */
async function profileOf(ctx, userId, fallbackName) {
  if (!userId && !fallbackName) return null;
  const member = userId ? await StoreManager.findOne({ userId, storeId: String(ctx.storeId) }).select('name role personalDetails').lean() : null;
  const d = member?.personalDetails || {};
  const manager = /manager/i.test(member?.role || '');
  return {
    name: member?.name || fallbackName || '',
    shift: [d.shiftType, d.startTime && d.endTime ? `(${d.startTime} - ${d.endTime})` : ''].filter(Boolean).join(' ') || (manager ? 'Store General Hours' : 'General Shift'),
    department: manager ? 'Administration' : 'Kitchen Operations',
    role: member?.role || (manager ? 'Store Manager' : 'Kitchen Staff'),
  };
}

// ---------------------------------------------------------------------------------------------
// Stock requests (kitchen -> store room)
// ---------------------------------------------------------------------------------------------

const toRequest = (r) => ({
  _id: String(r._id),
  requestNo: r.requestNo,
  storeId: String(r.storeId),
  ingredientId: r.ingredientId ? String(r.ingredientId) : '',
  ingredientName: r.ingredientName,
  unit: r.unit,
  requestedQty: r.requestedQty,
  approvedQty: r.approvedQty,
  deliveredQty: r.deliveredQty,
  urgency: r.urgency,
  reason: r.reason,
  requestedBy: r.requestedByName,
  approvedBy: r.approvedByName,
  status: r.status,
  remarks: r.remarks,
  source: r.source,
  createdAt: r.createdAt,
});

export async function listStockRequests(user, q = {}) {
  const ctx = await inventoryContext(user, q);
  const filter = { storeId: ctx.storeId, ...mine(ctx, 'requestedBy') };
  if (!isAll(q.status)) filter.status = String(q.status);
  if (!isAll(q.urgency)) filter.urgency = String(q.urgency);
  if (!isAll(q.ingredientId) && isId(q.ingredientId)) filter.ingredientId = toId(q.ingredientId);
  const search = str(q.search, 40);
  if (search) filter.requestNo = new RegExp(escapeRegex(search), 'i');
  const range = dateRange(q);
  if (range) filter.createdAt = range;
  const p = pageOf(q);
  const [rows, total] = await Promise.all([
    StockRequest.find(filter).sort({ createdAt: -1 }).skip(p.skip).limit(p.limit).lean(),
    StockRequest.countDocuments(filter),
  ]);
  return { data: rows.map(toRequest), pagination: pagination(total, p) };
}

export async function stockRequestsDashboard(user, q = {}) {
  const ctx = await inventoryContext(user, q);
  const rows = await StockRequest.find({ storeId: ctx.storeId, ...mine(ctx, 'requestedBy') }).select('status urgency').lean();
  const count = (s) => rows.filter((r) => r.status === s).length;
  return {
    pendingRequests: count('pending'),
    approvedRequests: count('approved'),
    rejectedRequests: count('rejected'),
    urgentRequests: rows.filter((r) => r.urgency === 'critical' || r.urgency === 'high').length,
  };
}

const findRequest = async (ctx, id) => {
  if (!isId(id)) throw new NotFoundError('Stock request not found');
  const r = await StockRequest.findOne({ _id: toId(id), storeId: ctx.storeId, ...mine(ctx, 'requestedBy') });
  if (!r) throw new NotFoundError('Stock request not found');
  return r;
};

export async function stockRequestDetails(user, id, q = {}) {
  const ctx = await inventoryContext(user, q);
  const r = await findRequest(ctx, id);
  const ing = r.ingredientId ? await StoreIngredient.findOne({ _id: r.ingredientId, storeId: ctx.storeId }).lean() : null;
  const [requestedBy, approvedBy] = await Promise.all([profileOf(ctx, r.requestedBy, r.requestedByName), profileOf(ctx, r.approvedBy, r.approvedByName)]);
  const timeline = [{ title: 'Requested', status: 'completed', user: r.requestedByName, date: r.createdAt, remarks: r.reason }];
  if (r.status === 'approved' || r.status === 'fulfilled') timeline.push({ title: 'Approved', status: 'completed', user: r.approvedByName || 'Store Manager', date: r.approvedAt || r.updatedAt, remarks: r.remarks || 'Approved for dispatch.' });
  if (r.status === 'rejected') timeline.push({ title: 'Rejected', status: 'failed', user: r.approvedByName || 'Store Manager', date: r.approvedAt || r.updatedAt, remarks: r.remarks || 'Rejected.' });
  if (r.status === 'fulfilled') timeline.push({ title: 'Fulfilled', status: 'completed', user: r.approvedByName || 'Store Manager', date: r.fulfilledAt || r.updatedAt, remarks: 'Delivered to kitchen and verified stock update.' });
  return { request: toRequest(r.toObject()), ingredient: ing ? toIngredient(ing) : null, requestedBy, approvedBy: r.approvedBy || r.approvedByName ? approvedBy : null, timeline };
}

async function nextRequestNo(storeId) {
  const year = new Date().getFullYear();
  const count = await StockRequest.countDocuments({ storeId });
  return `SR-${year}-${String(count + 1).padStart(3, '0')}`;
}

/** Creates a request with the next number for the store (retries if two are raised at the same moment). */
async function createRequest(ctx, fields) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    try {
      const base = await nextRequestNo(ctx.storeId);
      const requestNo = attempt === 0 ? base : `${base}-${attempt + 1}`;
      return await StockRequest.create({ ...fields, storeId: ctx.storeId, requestNo, requestedBy: toId(ctx.user.userId), requestedByName: await actorName(ctx) });
    } catch (err) {
      if (err?.code !== 11000) throw err;
    }
  }
  throw new ValidationError('Could not number the request. Please try again.');
}

export async function createStockRequest(user, body = {}, q = {}) {
  const ctx = await inventoryContext(user, q);
  mustBeStoreRole(ctx);
  if (!isId(body.ingredientId)) throw new ValidationError('Choose an ingredient');
  const ing = await StoreIngredient.findOne({ _id: toId(body.ingredientId), storeId: ctx.storeId }).lean();
  if (!ing) throw new ValidationError('Invalid ingredient selection');
  const qty = round2(body.requestedQty);
  if (!Number.isFinite(qty) || qty <= 0 || qty > 1e6) throw new ValidationError('Enter a valid quantity');
  const reason = str(body.reason, 500);
  if (!reason) throw new ValidationError('A reason is required');
  const request = await createRequest(ctx, {
    ingredientId: ing._id, ingredientName: ing.ingredientName, unit: ing.unit, requestedQty: qty,
    urgency: URGENCIES.includes(body.urgency) ? body.urgency : 'medium', reason, remarks: str(body.notes, 600),
  });
  await tellManagers(ctx, { title: `Stock request ${request.requestNo}`, message: `${qty} ${ing.unit} of ${ing.ingredientName} (${request.urgency})` });
  return { message: `Request ${request.requestNo} raised successfully`, data: toRequest(request.toObject()) };
}

/**
 * The My Tasks "request ingredient" modal. It creates the same stock request as the Stock Requests screen, so
 * both lists show it. The free-text ingredient name is matched to the store's stock list when possible.
 */
export async function requestIngredientFromTask(user, { ingredientName, quantity, unit, reason, taskId }, ctx) {
  const key = nameKeyOf(ingredientName);
  const ing = await StoreIngredient.findOne({ storeId: ctx.storeId, nameKey: key }).lean();
  return createRequest(ctx, {
    ingredientId: ing?._id || null, ingredientName: str(ingredientName, 120), unit: ing?.unit || str(unit, 30), requestedQty: quantity,
    urgency: 'medium', reason: str(reason, 500), source: 'my_tasks', taskId: taskId || null,
  });
}

const decide = async (ctx, requestId, from, patch) => {
  if (!isId(requestId)) throw new NotFoundError('Stock request not found');
  const r = await StockRequest.findOneAndUpdate({ _id: toId(requestId), storeId: ctx.storeId, status: from }, { $set: patch }, { returnDocument: 'after' });
  if (!r) {
    const exists = await StockRequest.exists({ _id: toId(requestId), storeId: ctx.storeId });
    if (!exists) throw new NotFoundError('Stock request not found');
    throw new ValidationError(`This request is not ${from}`);
  }
  return r;
};

export async function approveStockRequest(user, body = {}, q = {}) {
  const ctx = await inventoryContext(user, q);
  mustManager(ctx);
  const current = await findRequest(ctx, body.requestId);
  const qty = round2(body.approvedQty);
  if (!Number.isFinite(qty) || qty <= 0) throw new ValidationError('Enter a valid approved quantity');
  if (qty > current.requestedQty) throw new ValidationError('Cannot approve more than was requested');
  const r = await decide(ctx, body.requestId, 'pending', {
    status: 'approved', approvedQty: qty, remarks: str(body.remarks, 600), approvedBy: toId(ctx.user.userId), approvedByName: await actorName(ctx), approvedAt: new Date(),
  });
  await notifyUsers({ userIds: [r.requestedBy], storeId: ctx.storeId, type: 'task_assigned', title: `Request ${r.requestNo} approved`, message: `${qty} ${r.unit} of ${r.ingredientName}` });
  return { message: `Request ${r.requestNo} approved successfully` };
}

export async function rejectStockRequest(user, body = {}, q = {}) {
  const ctx = await inventoryContext(user, q);
  mustManager(ctx);
  await findRequest(ctx, body.requestId);
  const remarks = str(body.remarks, 600);
  if (!remarks) throw new ValidationError('Tell the requester why it was rejected');
  const r = await decide(ctx, body.requestId, 'pending', {
    status: 'rejected', remarks, approvedBy: toId(ctx.user.userId), approvedByName: await actorName(ctx), approvedAt: new Date(),
  });
  await notifyUsers({ userIds: [r.requestedBy], storeId: ctx.storeId, type: 'task_assigned', title: `Request ${r.requestNo} rejected`, message: remarks });
  return { message: `Request ${r.requestNo} rejected` };
}

/** The manager hands the approved quantity to the kitchen: it comes out of stock. */
export async function fulfillStockRequest(user, body = {}, q = {}) {
  const ctx = await inventoryContext(user, q);
  mustManager(ctx);
  const current = await findRequest(ctx, body.requestId);
  if (current.status !== 'approved') throw new ValidationError(current.status === 'fulfilled' ? 'Request is already fulfilled' : 'Approve the request before fulfilling it');
  const qty = round2(body.deliveredQty);
  if (!Number.isFinite(qty) || qty <= 0) throw new ValidationError('Enter a valid delivered quantity');
  if (qty > current.approvedQty) throw new ValidationError('Cannot deliver more than was approved');

  let ingredientId = current.ingredientId;
  if (!ingredientId) {
    const match = await StoreIngredient.findOne({ storeId: ctx.storeId, nameKey: nameKeyOf(current.ingredientName) }).select('_id').lean();
    if (!match) throw new ValidationError('This ingredient is not in your stock list. Add it under Ingredient Stock first.');
    ingredientId = match._id;
  }

  // Claim the request first (so a double click cannot hand out stock twice), then take the stock out.
  const claimed = await decide(ctx, body.requestId, 'approved', { status: 'fulfilled', deliveredQty: qty, ingredientId, fulfilledAt: new Date(), remarks: str(body.remarks, 600) || current.remarks });
  try {
    await applyStock(ctx, ingredientId, { type: 'stock_out', quantity: qty, reason: `Stock request ${claimed.requestNo} fulfilled`, source: 'stock_request' });
  } catch (err) {
    await StockRequest.updateOne({ _id: claimed._id }, { $set: { status: 'approved', deliveredQty: 0, fulfilledAt: null } });
    throw err;
  }
  await notifyUsers({ userIds: [claimed.requestedBy], storeId: ctx.storeId, type: 'task_assigned', title: `Request ${claimed.requestNo} delivered`, message: `${qty} ${claimed.unit} of ${claimed.ingredientName}` });
  return { message: `Request ${claimed.requestNo} fulfilled. Stock updated.` };
}

// ---- My Tasks view of the same requests ---------------------------------------------------------

const toTaskRequest = (r) => ({
  _id: String(r._id),
  requestNo: r.requestNo,
  requestedBy: String(r.requestedBy),
  ingredientName: r.ingredientName,
  quantity: r.requestedQty,
  unit: r.unit,
  reason: r.reason,
  status: r.status.charAt(0).toUpperCase() + r.status.slice(1),
  createdAt: r.createdAt,
});

export const taskRequestView = toTaskRequest;

// ---------------------------------------------------------------------------------------------
// Waste
// ---------------------------------------------------------------------------------------------

const toWaste = (w) => ({
  _id: String(w._id),
  storeId: String(w.storeId),
  ingredientId: String(w.ingredientId),
  ingredientName: w.ingredientName,
  quantity: w.quantity,
  unit: w.unit,
  wasteType: w.wasteType,
  reason: w.reason,
  reportedBy: w.reportedByName,
  approvedBy: w.approvedByName,
  estimatedLoss: w.estimatedLoss,
  remarks: w.remarks,
  status: w.status,
  images: w.images,
  timeline: w.timeline,
  createdAt: w.createdAt,
});

export async function listWaste(user, q = {}) {
  const ctx = await inventoryContext(user, q);
  const filter = { storeId: ctx.storeId, status: { $ne: 'deleted' }, ...mine(ctx, 'reportedBy') };
  if (!isAll(q.wasteType)) filter.wasteType = String(q.wasteType);
  if (!isAll(q.reportedBy)) filter.reportedByName = String(q.reportedBy);
  const search = str(q.search, 80);
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ ingredientName: rx }, { reason: rx }, { reportedByName: rx }];
  }
  const range = dateRange(q);
  if (range) filter.createdAt = range;
  const p = pageOf(q, 5);
  const [rows, total] = await Promise.all([
    WasteLog.find(filter).sort({ createdAt: -1 }).skip(p.skip).limit(p.limit).lean(),
    WasteLog.countDocuments(filter),
  ]);
  return { data: rows.map(toWaste), pagination: pagination(total, p) };
}

export async function wasteDashboard(user, q = {}) {
  const ctx = await inventoryContext(user, q);
  const logs = await WasteLog.find({ storeId: ctx.storeId, status: { $ne: 'deleted' }, ...mine(ctx, 'reportedBy') }).select('quantity estimatedLoss ingredientName createdAt').lean();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const week = new Date(Date.now() - 7 * 86400000);
  const totals = {};
  let totalWasteToday = 0; let weeklyWaste = 0; let lossAmount = 0;
  for (const l of logs) {
    if (l.createdAt >= today) totalWasteToday += l.quantity;
    if (l.createdAt >= week) weeklyWaste += l.quantity;
    lossAmount += l.estimatedLoss;
    totals[l.ingredientName] = (totals[l.ingredientName] || 0) + l.quantity;
  }
  const top = Object.entries(totals).sort((a, b) => b[1] - a[1])[0];
  return { totalWasteToday: round2(totalWasteToday), weeklyWaste: round2(weeklyWaste), lossAmount: round2(lossAmount), topWastedIngredient: top ? top[0] : 'None' };
}

const findWaste = async (ctx, id) => {
  if (!isId(id)) throw new NotFoundError('Waste log not found');
  const w = await WasteLog.findOne({ _id: toId(id), storeId: ctx.storeId, status: { $ne: 'deleted' }, ...mine(ctx, 'reportedBy') });
  if (!w) throw new NotFoundError('Waste log not found');
  return w;
};

export async function wasteDetails(user, id, q = {}) {
  const ctx = await inventoryContext(user, q);
  const w = await findWaste(ctx, id);
  const ing = await StoreIngredient.findOne({ _id: w.ingredientId, storeId: ctx.storeId }).lean();
  const [reportedBy, approvedBy] = await Promise.all([profileOf(ctx, w.reportedBy, w.reportedByName), w.approvedBy ? profileOf(ctx, w.approvedBy, w.approvedByName) : null]);
  return {
    wasteLog: toWaste(w.toObject()),
    ingredient: ing ? toIngredient(ing) : { ingredientName: w.ingredientName, category: 'Unknown', currentStock: 0, costPerUnit: round2(w.estimatedLoss / (w.quantity || 1)), unit: w.unit || 'Unit' },
    reportedBy, approvedBy, images: w.images, timeline: w.timeline,
  };
}

const WASTE_TYPES = ['expired', 'burnt', 'damaged', 'spillage'];
const MAX_WASTE_IMAGES = 5;

/** Report waste (multipart: fields + images[] files). The quantity leaves stock immediately. */
export async function reportWaste(user, body = {}, files = [], q = {}) {
  const ctx = await inventoryContext(user, q);
  mustBeStoreRole(ctx);
  if (!isId(body.ingredientId)) throw new ValidationError('Choose an ingredient');
  const ing = await StoreIngredient.findOne({ _id: toId(body.ingredientId), storeId: ctx.storeId });
  if (!ing) throw new NotFoundError('Ingredient not found');
  const qty = round2(body.quantity);
  if (!Number.isFinite(qty) || qty <= 0) throw new ValidationError('Enter a valid quantity');
  if (!WASTE_TYPES.includes(body.wasteType)) throw new ValidationError('Choose a waste type');
  const reason = str(body.reason, 600);
  if (!reason) throw new ValidationError('A reason is required');
  if (qty > ing.currentStock) throw new ValidationError(`Cannot report waste: quantity exceeds current stock (${round2(ing.currentStock)} ${ing.unit})`);
  if (files.length > MAX_WASTE_IMAGES) throw new ValidationError(`At most ${MAX_WASTE_IMAGES} photos`);

  // Photos go to a folder chosen here (never by the client). Upload first, so a failed upload changes nothing.
  const images = [];
  for (const file of files) images.push(await uploadImageBuffer(file.buffer, `stores/${ctx.storeId}/waste`));

  const name = await actorName(ctx);
  await applyStock(ctx, ing._id, { type: 'stock_out', quantity: qty, reason: `Ingredient Waste (${body.wasteType}): ${reason}`, source: 'waste' });
  const log = await WasteLog.create({
    storeId: ctx.storeId, ingredientId: ing._id, ingredientName: ing.ingredientName, unit: ing.unit, quantity: qty, wasteType: body.wasteType, reason,
    remarks: str(body.remarks, 600), estimatedLoss: round2(qty * ing.costPerUnit), images, reportedBy: toId(ctx.user.userId), reportedByName: name,
    timeline: [{ user: name, action: 'reported', remarks: reason, createdAt: new Date() }],
  });
  await tellManagers(ctx, { title: 'Waste reported', message: `${qty} ${ing.unit} of ${ing.ingredientName} (${body.wasteType})` });
  return { message: 'Waste reported successfully', data: toWaste(log.toObject()) };
}

export async function approveWaste(user, id, body = {}, q = {}) {
  const ctx = await inventoryContext(user, q);
  mustManager(ctx);
  const w = await findWaste(ctx, id);
  if (w.status === 'approved') throw new ValidationError('Waste record is already approved');
  const name = await actorName(ctx);
  const remarks = str(body.remarks, 600);
  w.status = 'approved'; w.approvedBy = toId(ctx.user.userId); w.approvedByName = name;
  if (remarks) w.remarks = remarks;
  w.timeline.push({ user: name, action: 'approved', remarks: remarks || 'Approved by store manager', createdAt: new Date() });
  await w.save();
  return { message: 'Waste record approved successfully' };
}

/** Removes a report. A report that was never approved is withdrawn, so its quantity goes back into stock. */
export async function deleteWaste(user, id, q = {}) {
  const ctx = await inventoryContext(user, q);
  mustManager(ctx);
  const w = await findWaste(ctx, id);
  const wasPending = w.status === 'pending';
  const claimed = await WasteLog.findOneAndUpdate({ _id: w._id, storeId: ctx.storeId, status: { $ne: 'deleted' } }, { $set: { status: 'deleted' } });
  if (!claimed) throw new NotFoundError('Waste log not found');
  if (wasPending) await applyStock(ctx, w.ingredientId, { type: 'stock_in', quantity: w.quantity, reason: 'Waste report withdrawn', source: 'waste' }).catch(() => {});
  return { message: 'Waste record deleted successfully' };
}

// ---------------------------------------------------------------------------------------------
// Recipes
// ---------------------------------------------------------------------------------------------

const toRecipe = (r) => ({
  _id: String(r._id),
  name: r.name,
  image: r.image,
  prepTime: r.prepTime,
  difficulty: r.difficulty,
  recipeCode: r.recipeCode,
  ingredients: (r.ingredients || []).map((i) => ({ ingredientId: i.ingredientId ? String(i.ingredientId) : '', name: i.name, quantity: i.quantity, unit: i.unit })),
  instructions: r.instructions || [],
});

export async function listRecipes(user, q = {}) {
  const ctx = await inventoryContext(user, q);
  const rows = await Recipe.find({ storeId: ctx.storeId }).sort({ name: 1 }).lean();
  return { data: rows.map(toRecipe) };
}

/** name -> recipe id for one store, used to link pizzas on the kitchen screens to their recipe. */
export async function recipeIndex(storeId) {
  const rows = await Recipe.find({ storeId }).select('nameKey').lean();
  return (itemName) => {
    const n = nameKeyOf(itemName);
    const hit = rows.find((r) => n === r.nameKey || n.startsWith(`${r.nameKey} `) || n.includes(r.nameKey));
    return hit ? String(hit._id) : null;
  };
}

async function recipeFields(ctx, body) {
  const name = str(body.name, 120);
  if (!name) throw new ValidationError('Recipe name is required');
  const lines = Array.isArray(body.ingredients) ? body.ingredients.slice(0, 40) : [];
  const ingredients = [];
  for (const line of lines) {
    const qty = Number(line.quantity);
    if (!Number.isFinite(qty) || qty < 0) throw new ValidationError('Ingredient quantities must be zero or more');
    let ingredientId = null;
    let lineName = str(line.name, 120);
    if (isId(line.ingredientId)) {
      const ing = await StoreIngredient.findOne({ _id: toId(line.ingredientId), storeId: ctx.storeId }).select('ingredientName').lean();
      if (!ing) throw new ValidationError('An ingredient in this recipe is not in your stock list');
      ingredientId = ing._id; lineName = lineName || ing.ingredientName;
    }
    if (!lineName) throw new ValidationError('Every ingredient line needs a name');
    ingredients.push({ ingredientId, name: lineName, quantity: qty, unit: str(line.unit, 30) });
  }
  return {
    name, nameKey: nameKeyOf(name), recipeCode: str(body.recipeCode, 40), image: /^https:\/\//.test(String(body.image || '')) ? String(body.image).slice(0, 2000) : '',
    prepTime: Math.min(240, Math.max(0, Number(body.prepTime) || 10)), difficulty: ['Easy', 'Medium', 'Hard'].includes(body.difficulty) ? body.difficulty : 'Easy',
    ingredients, instructions: (Array.isArray(body.instructions) ? body.instructions : []).map((s) => str(s, 400)).filter(Boolean).slice(0, 30),
  };
}

export async function createRecipe(user, body = {}, q = {}) {
  const ctx = await inventoryContext(user, q);
  mustManager(ctx);
  try {
    const r = await Recipe.create({ ...(await recipeFields(ctx, body)), storeId: ctx.storeId });
    return { message: 'Recipe saved', data: toRecipe(r.toObject()) };
  } catch (err) {
    if (err?.code === 11000) throw new ValidationError('A recipe with this name already exists');
    throw err;
  }
}

export async function updateRecipe(user, id, body = {}, q = {}) {
  const ctx = await inventoryContext(user, q);
  mustManager(ctx);
  if (!isId(id)) throw new NotFoundError('Recipe not found');
  // Look it up first, so a recipe of another store is "not found" whatever the body contains
  if (!(await Recipe.exists({ _id: toId(id), storeId: ctx.storeId }))) throw new NotFoundError('Recipe not found');
  try {
    const r = await Recipe.findOneAndUpdate({ _id: toId(id), storeId: ctx.storeId }, { $set: await recipeFields(ctx, body) }, { returnDocument: 'after' });
    if (!r) throw new NotFoundError('Recipe not found');
    return { message: 'Recipe updated', data: toRecipe(r.toObject()) };
  } catch (err) {
    if (err?.code === 11000) throw new ValidationError('A recipe with this name already exists');
    throw err;
  }
}

export async function deleteRecipe(user, id, q = {}) {
  const ctx = await inventoryContext(user, q);
  mustManager(ctx);
  if (!isId(id)) throw new NotFoundError('Recipe not found');
  const r = await Recipe.findOneAndDelete({ _id: toId(id), storeId: ctx.storeId });
  if (!r) throw new NotFoundError('Recipe not found');
  return { message: 'Recipe deleted' };
}

// ---------------------------------------------------------------------------------------------
// Shortages
// ---------------------------------------------------------------------------------------------

/** Live orders in the store's kitchen that need this ingredient (through their recipes). */
async function affectedOrdersOf(ctx, ingredientIds) {
  const recipes = await Recipe.find({ storeId: ctx.storeId, 'ingredients.ingredientId': { $in: ingredientIds } }).select('nameKey ingredients.ingredientId').lean();
  if (!recipes.length) return new Map();
  const orders = await FoodOrder.find({ storeId: ctx.storeId, orderStatus: { $in: ['confirmed', 'preparing'] } })
    .select('order_id customerName items orderStatus kitchen.expectedReadyAt').lean();
  const out = new Map(ingredientIds.map((id) => [String(id), []]));
  for (const order of orders) {
    for (const item of order.items || []) {
      const n = nameKeyOf(item.name);
      for (const recipe of recipes) {
        if (!(n === recipe.nameKey || n.includes(recipe.nameKey))) continue;
        for (const line of recipe.ingredients) {
          const key = String(line.ingredientId || '');
          if (out.has(key)) out.get(key).push({ order, item });
        }
      }
    }
  }
  return out;
}

const toAffected = ({ order, item }) => ({
  _id: order.order_id || String(order._id),
  customer: order.customerName || 'Customer',
  pizzaName: item.name,
  quantity: item.quantity,
  status: order.orderStatus === 'preparing' ? 'preparing' : 'pending',
  expectedDelivery: order.kitchen?.expectedReadyAt ? new Date(order.kitchen.expectedReadyAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '',
  revenue: round2(item.price * item.quantity),
});

const toShortage = (s, affectedCount = 0) => ({
  _id: String(s._id),
  storeId: String(s.storeId),
  ingredientId: String(s.ingredientId),
  ingredientName: s.ingredientName,
  shortageQty: s.shortageQty,
  affectedOrders: affectedCount,
  severity: s.severity,
  status: s.status,
  actionTaken: s.actionTaken,
  createdBy: s.createdBy,
  createdAt: s.createdAt,
  resolvedBy: s.resolvedBy,
  resolvedAt: s.resolvedAt || '',
  resolutionNote: s.resolutionNote,
});

export async function listShortages(user, q = {}) {
  const ctx = await inventoryContext(user, q);
  const filter = { storeId: ctx.storeId };
  if (!isAll(q.severity)) filter.severity = String(q.severity);
  if (!isAll(q.status)) filter.status = String(q.status);
  const search = str(q.search, 80);
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ ingredientName: rx }, ...(isId(search) ? [{ _id: toId(search) }] : [])];
  }
  const range = dateRange(q);
  if (range) filter.createdAt = range;
  const p = pageOf(q);
  const [rows, total] = await Promise.all([
    IngredientShortage.find(filter).sort({ createdAt: -1 }).skip(p.skip).limit(p.limit).lean(),
    IngredientShortage.countDocuments(filter),
  ]);
  const affected = await affectedOrdersOf(ctx, rows.map((r) => r.ingredientId));
  return { data: rows.map((r) => toShortage(r, (affected.get(String(r.ingredientId)) || []).length)), pagination: pagination(total, p) };
}

export async function shortagesDashboard(user, q = {}) {
  const ctx = await inventoryContext(user, q);
  const active = await IngredientShortage.find({ storeId: ctx.storeId, status: 'active' }).select('severity ingredientId').lean();
  const affected = await affectedOrdersOf(ctx, active.map((s) => s.ingredientId));
  const hits = [...new Set(active.map((s) => String(s.ingredientId)))].flatMap((id) => affected.get(id) || []);
  return {
    activeShortages: active.length,
    criticalShortages: active.filter((s) => s.severity === 'critical').length,
    affectedOrders: hits.length,
    estimatedRevenueLoss: round2(hits.reduce((n, h) => n + h.item.price * h.item.quantity, 0)),
  };
}

const findShortage = async (ctx, id) => {
  if (!isId(id)) throw new NotFoundError('Shortage record not found');
  const s = await IngredientShortage.findOne({ _id: toId(id), storeId: ctx.storeId });
  if (!s) throw new NotFoundError('Shortage record not found');
  return s;
};

export async function shortageDetails(user, id, q = {}) {
  const ctx = await inventoryContext(user, q);
  const s = await findShortage(ctx, id);
  const ing = await StoreIngredient.findOne({ _id: s.ingredientId, storeId: ctx.storeId }).lean();
  const hits = (await affectedOrdersOf(ctx, [s.ingredientId])).get(String(s.ingredientId)) || [];
  const affectedOrders = hits.map(toAffected);
  const alternatives = ing
    ? (await StoreIngredient.find({ storeId: ctx.storeId, category: ing.category, _id: { $ne: ing._id }, tracked: true, $expr: { $gt: ['$currentStock', '$minimumStock'] } }).limit(5).lean())
        .map((i) => ({ name: i.ingredientName, stock: `${round2(i.currentStock)} ${i.unit}`, status: 'available' }))
    : [];
  const stores = ing ? await availableStores(ctx.user, { ...q, ingredientId: String(ing._id) }) : [];
  return {
    shortage: toShortage(s.toObject(), affectedOrders.length),
    ingredient: { ...(ing ? toIngredient(ing) : {}), requiredStock: (ing?.minimumStock || 10) + s.shortageQty, missingQty: s.shortageQty },
    affectedOrders,
    analytics: {
      revenueLoss: round2(affectedOrders.reduce((n, o) => n + o.revenue, 0)),
      delayedOrders: affectedOrders.length,
      alternatives: alternatives.length ? alternatives : [{ name: 'No direct alternative available', stock: 'N/A', status: 'none' }],
      stores,
    },
    timeline: s.timeline,
  };
}

/** Kitchen reports an ingredient it cannot get (pizza station / preparation board). One open shortage per ingredient. */
export async function reportShortage(user, body = {}, q = {}) {
  const ctx = await inventoryContext(user, q);
  mustBeStoreRole(ctx);
  if (!isId(body.ingredientId)) throw new ValidationError('Choose an ingredient');
  const ing = await StoreIngredient.findOne({ _id: toId(body.ingredientId), storeId: ctx.storeId }).lean();
  if (!ing) throw new NotFoundError('Ingredient not found');
  const qty = round2(body.missingQuantity);
  if (!Number.isFinite(qty) || qty <= 0 || qty > 1e6) throw new ValidationError('Enter the missing quantity');
  let item = null;
  if (body.orderItemId) {
    if (!isId(body.orderItemId)) throw new NotFoundError('Pizza not found');
    item = await KitchenItem.findOne({ _id: toId(body.orderItemId), storeId: ctx.storeId }).select('_id name').lean();
    if (!item) throw new NotFoundError('Pizza not found');
  }
  const severity = URGENCIES.includes(body.urgency) ? body.urgency : 'medium';
  const name = await actorName(ctx);
  const remarks = str(body.remarks, 600);
  const note = `${qty} ${ing.unit} missing${item ? ` for ${item.name}` : ''}${remarks ? `. ${remarks}` : ''}`;

  let shortage = await IngredientShortage.findOne({ storeId: ctx.storeId, ingredientId: ing._id, status: 'active' });
  if (shortage) {
    if (URGENCIES.indexOf(severity) > URGENCIES.indexOf(shortage.severity)) shortage.severity = severity;
    shortage.shortageQty = Math.max(shortage.shortageQty, qty);
    shortage.timeline.push({ user: name, action: 'reported', remarks: note, createdAt: new Date() });
    await shortage.save();
  } else {
    shortage = await IngredientShortage.create({
      storeId: ctx.storeId, ingredientId: ing._id, ingredientName: ing.ingredientName, shortageQty: qty, severity, remarks,
      kitchenItemId: item?._id || null, notifyManager: !!body.notifyManager, createdBy: name, createdById: toId(ctx.user.userId),
      timeline: [{ user: name, action: 'reported', remarks: note, createdAt: new Date() }],
    });
  }
  if (body.notifyManager) await tellManagers(ctx, { title: `Shortage: ${ing.ingredientName}`, message: note });
  return { message: 'Ingredient shortage reported successfully.', data: { _id: String(shortage._id), status: shortage.status } };
}

export async function resolveShortage(user, id, body = {}, q = {}) {
  const ctx = await inventoryContext(user, q);
  mustManager(ctx);
  const s = await findShortage(ctx, id);
  if (s.status === 'resolved') throw new ValidationError('This shortage is already resolved');
  const action = str(body.actionTaken, 200);
  if (!action) throw new ValidationError('Say what was done');
  const name = await actorName(ctx);
  const notes = str(body.notes, 600);
  s.status = 'resolved'; s.actionTaken = action; s.resolvedBy = name; s.resolvedAt = new Date(); s.resolutionNote = notes;
  s.timeline.push({ user: name, action: 'resolved', remarks: notes || `Resolved shortage: ${action}`, createdAt: new Date() });
  await s.save();
  return { message: 'Shortage marked as resolved successfully' };
}

/** Tells the franchise admins of this store's franchise about a shortage, and records it on the shortage. */
export async function notifyAdminOfShortage(user, body = {}, q = {}) {
  const ctx = await inventoryContext(user, q);
  mustManager(ctx);
  const s = await findShortage(ctx, body.shortageId);
  const message = str(body.message, 600);
  if (!message) throw new ValidationError('A message is required');
  const name = await actorName(ctx);
  s.timeline.push({ user: name, action: 'admin_notified', remarks: `${str(body.type, 40) || 'update'} (${str(body.priority, 20) || 'normal'}): ${message}`, createdAt: new Date() });
  await s.save();

  const adminRoles = await Role.find({ code: 'FRANCHISE_ADMIN' }).select('_id').lean();
  const admins = ctx.franchiseId
    ? await UserRole.find({ roleId: { $in: adminRoles.map((r) => r._id) }, franchiseId: ctx.franchiseId, status: 'ACTIVE' }).select('userId').lean()
    : [];
  await notifyUsers({ userIds: admins.map((a) => a.userId), storeId: ctx.storeId, type: 'task_delayed', title: `Shortage: ${s.ingredientName}`, message });
  return { message: 'Admin notified' };
}

export { stockStatus };
