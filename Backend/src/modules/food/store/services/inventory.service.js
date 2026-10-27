import { FoodStore } from '../models/store.model.js';
import { StoreManager } from '../../franchise/models/storeManager.model.js';
import { StoreIngredient } from '../models/storeIngredient.model.js';
import { StockTransaction } from '../models/stockTransaction.model.js';
import { InventoryAlert } from '../models/inventoryAlert.model.js';
import { IngredientShortage } from '../models/ingredientShortage.model.js';
import { StockTransfer } from '../models/stockTransfer.model.js';
import { haversineKm } from '../../orders/services/order.helpers.js';
import { NotFoundError, ValidationError } from '../../../../core/auth/errors.js';
import {
  inventoryContext, mustManager, mustBeStoreRole, actorName, ensureIngredients, nameKeyOf, toId, isId, str, round2,
  pageOf, pagination, dateRange, escapeRegex, isAll,
} from './inventoryAccess.js';

// Stock levels: the ingredient list, stock changes, history, low-stock alerts and transfer requests.
// Every function takes the token's user; the store always comes from inventoryContext (see inventoryAccess.js).
//
// The screens read the raw JSON body (e.g. `response.data.data` / `.pagination`, or the object itself for
// dashboards and details), so these functions return exactly that body; the controller adds `success: true`.

export const stockStatus = (i) => (i.currentStock <= 0 ? 'out_of_stock' : i.currentStock <= i.reorderLevel ? 'low_stock' : 'available');

export const toIngredient = (i) => ({
  _id: String(i._id),
  storeId: String(i.storeId),
  ingredientName: i.ingredientName,
  category: i.category,
  unit: i.unit,
  currentStock: round2(i.currentStock),
  minimumStock: i.minimumStock,
  reorderLevel: i.reorderLevel,
  costPerUnit: i.costPerUnit,
  supplierId: i.supplierId,
  supplierName: i.supplierName,
  status: stockStatus(i),
  lastUpdatedBy: i.lastUpdatedBy,
  updatedAt: i.updatedAt,
});

const findIngredient = async (ctx, id) => {
  if (!isId(id)) throw new NotFoundError('Ingredient not found');
  const ing = await StoreIngredient.findOne({ _id: toId(id), storeId: ctx.storeId });
  if (!ing) throw new NotFoundError('Ingredient not found');
  return ing;
};

// ---------------------------------------------------------------------------------------------
// Ingredient list
// ---------------------------------------------------------------------------------------------

export async function listIngredients(user, q = {}) {
  const ctx = await inventoryContext(user, q);
  await ensureIngredients(ctx);
  const filter = { storeId: ctx.storeId };
  const and = [];
  const search = str(q.search, 80);
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ ingredientName: rx }, { supplierName: rx }];
  }
  if (!isAll(q.category)) filter.category = String(q.category);
  if (!isAll(q.unit)) filter.unit = String(q.unit);
  if (!isAll(q.supplier)) and.push({ $or: [{ supplierId: String(q.supplier) }, { supplierName: String(q.supplier) }] });
  if (!isAll(q.status)) {
    if (q.status === 'out_of_stock') filter.currentStock = { $lte: 0 };
    else if (q.status === 'low_stock') and.push({ currentStock: { $gt: 0 }, $expr: { $lte: ['$currentStock', '$reorderLevel'] } });
    else if (q.status === 'available') and.push({ $expr: { $gt: ['$currentStock', '$reorderLevel'] }, currentStock: { $gt: 0 } });
  }
  const range = dateRange(q);
  if (range) filter.updatedAt = range;
  if (and.length) filter.$and = and;

  const p = pageOf(q);
  const [rows, total] = await Promise.all([
    StoreIngredient.find(filter).sort({ category: 1, ingredientName: 1 }).skip(p.skip).limit(p.limit).lean(),
    StoreIngredient.countDocuments(filter),
  ]);
  return { data: rows.map(toIngredient), pagination: pagination(total, p) };
}

export async function inventoryDashboard(user, q = {}) {
  const ctx = await inventoryContext(user, q);
  await ensureIngredients(ctx);
  const rows = await StoreIngredient.find({ storeId: ctx.storeId }).select('currentStock reorderLevel costPerUnit').lean();
  return {
    totalIngredients: rows.length,
    availableIngredients: rows.filter((r) => stockStatus(r) === 'available').length,
    lowStockCount: rows.filter((r) => stockStatus(r) === 'low_stock').length,
    outOfStockCount: rows.filter((r) => stockStatus(r) === 'out_of_stock').length,
    inventoryValue: Math.round(rows.reduce((sum, r) => sum + r.currentStock * r.costPerUnit, 0)),
  };
}

/** Simple list for the kitchen's "report a shortage" picker and recipe lines. */
export async function ingredientPicker(user, q = {}) {
  const ctx = await inventoryContext(user, q);
  await ensureIngredients(ctx);
  const rows = await StoreIngredient.find({ storeId: ctx.storeId }).sort({ ingredientName: 1 }).lean();
  const label = { available: 'In Stock', low_stock: 'Low Stock', out_of_stock: 'Out of Stock' };
  return {
    data: rows.map((i) => ({ _id: String(i._id), name: i.ingredientName, currentStock: round2(i.currentStock), unit: i.unit, availability: label[stockStatus(i)] })),
  };
}

// ---------------------------------------------------------------------------------------------
// Consumption, details, history
// ---------------------------------------------------------------------------------------------

async function consumptionOf(storeId, ingredientId) {
  const since = new Date(Date.now() - 30 * 86400000);
  const outs = await StockTransaction.find({ storeId, ingredientId, type: 'stock_out', createdAt: { $gte: since } }).select('quantity createdAt').lean();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const week = new Date(Date.now() - 7 * 86400000);
  const sum = (from) => round2(outs.filter((t) => t.createdAt >= from).reduce((n, t) => n + t.quantity, 0));
  const month = sum(since);
  return { today: sum(today), week: sum(week), month, averageDaily: round2(month / 30) };
}

export async function ingredientDetails(user, id, q = {}) {
  const ctx = await inventoryContext(user, q);
  const ing = await findIngredient(ctx, id);
  const [consumption, recent] = await Promise.all([
    consumptionOf(ctx.storeId, ing._id),
    StockTransaction.find({ storeId: ctx.storeId, ingredientId: ing._id }).sort({ createdAt: -1 }).limit(5).lean(),
  ]);
  return { ingredient: toIngredient(ing), consumption, recentTransactions: recent.map(toTransaction) };
}

const toTransaction = (t) => ({
  _id: String(t._id),
  ingredientId: String(t.ingredientId),
  storeId: String(t.storeId),
  type: t.type,
  quantity: t.quantity,
  previousStock: round2(t.previousStock),
  newStock: round2(t.newStock),
  reason: t.reason,
  createdBy: t.createdBy,
  createdAt: t.createdAt,
});

export async function ingredientHistory(user, id, q = {}) {
  const ctx = await inventoryContext(user, q);
  const ing = await findIngredient(ctx, id);
  const filter = { storeId: ctx.storeId, ingredientId: ing._id };
  if (!isAll(q.type)) filter.type = String(q.type);
  const search = str(q.search, 80);
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ reason: rx }, { createdBy: rx }];
  }
  const p = pageOf(q, 5);
  const [rows, total] = await Promise.all([
    StockTransaction.find(filter).sort({ createdAt: -1 }).skip(p.skip).limit(p.limit).lean(),
    StockTransaction.countDocuments(filter),
  ]);
  return { data: rows.map(toTransaction), pagination: pagination(total, p) };
}

// ---------------------------------------------------------------------------------------------
// Changing stock (the one place stock numbers move)
// ---------------------------------------------------------------------------------------------

/**
 * Applies a stock change atomically and records it. A stock-out can never take stock below zero.
 * Raises / clears the low-stock alert and the out-of-stock shortage for that ingredient afterwards.
 */
export async function applyStock(ctx, ingredientId, { type, quantity, reason = '', source = 'manual' }) {
  const qty = round2(quantity);
  if (!['stock_in', 'stock_out', 'adjustment'].includes(type)) throw new ValidationError('Invalid stock update type');
  if (!Number.isFinite(qty) || qty < 0 || (type !== 'adjustment' && qty <= 0)) throw new ValidationError('Enter a valid quantity');
  if (qty > 1e7) throw new ValidationError('Quantity is too large');
  const name = await actorName(ctx);

  const filter = { _id: ingredientId, storeId: ctx.storeId };
  let update;
  if (type === 'stock_in') update = { $inc: { currentStock: qty }, $set: { tracked: true, lastUpdatedBy: name } };
  else if (type === 'stock_out') { filter.currentStock = { $gte: qty }; update = { $inc: { currentStock: -qty }, $set: { lastUpdatedBy: name } }; }
  else update = { $set: { currentStock: qty, tracked: true, lastUpdatedBy: name } };

  const before = await StoreIngredient.findOneAndUpdate(filter, update, { returnDocument: 'before' });
  if (!before) {
    const exists = await StoreIngredient.findOne({ _id: ingredientId, storeId: ctx.storeId }).select('currentStock unit').lean();
    if (!exists) throw new NotFoundError('Ingredient not found');
    throw new ValidationError(`Insufficient stock. Current stock is ${round2(exists.currentStock)} ${exists.unit}, cannot take out ${qty} ${exists.unit}.`);
  }
  const previous = before.currentStock;
  const next = type === 'stock_in' ? previous + qty : type === 'stock_out' ? previous - qty : qty;
  await StockTransaction.create({
    storeId: ctx.storeId, ingredientId, type, quantity: qty, previousStock: Math.max(0, previous), newStock: Math.max(0, next),
    reason: str(reason, 600), source, createdBy: name, createdById: toId(ctx.user.userId),
  });
  const after = await StoreIngredient.findById(ingredientId).lean();
  await syncStockSignals(ctx.storeId, after);
  return after;
}

export async function updateStock(user, body = {}, q = {}) {
  const ctx = await inventoryContext(user, q);
  mustManager(ctx);
  const ing = await findIngredient(ctx, body.ingredientId);
  const notes = str(body.notes, 300);
  const reason = str(body.reason, 300);
  if (!reason) throw new ValidationError('A reason is required');
  await applyStock(ctx, ing._id, { type: body.type, quantity: body.quantity, reason: notes ? `${reason} (Notes: ${notes})` : reason });
  return { message: 'Stock updated successfully' };
}

export async function createIngredient(user, body = {}, q = {}) {
  const ctx = await inventoryContext(user, q);
  mustManager(ctx);
  const name = str(body.ingredientName, 120);
  if (!name) throw new ValidationError('Ingredient name is required');
  const num = (v) => { const n = Number(v ?? 0); if (!Number.isFinite(n) || n < 0 || n > 1e7) throw new ValidationError('Numbers must be zero or more'); return n; };
  try {
    const ing = await StoreIngredient.create({
      storeId: ctx.storeId, ingredientName: name, nameKey: nameKeyOf(name), category: str(body.category, 60) || 'Other', unit: str(body.unit, 30) || 'KG',
      minimumStock: num(body.minimumStock), reorderLevel: num(body.reorderLevel), costPerUnit: num(body.costPerUnit),
      supplierName: str(body.supplierName, 120), supplierId: str(body.supplierId, 60), lastUpdatedBy: await actorName(ctx),
    });
    return { message: 'Ingredient added', data: toIngredient(ing.toObject()) };
  } catch (err) {
    if (err?.code === 11000) throw new ValidationError('This ingredient already exists');
    throw err;
  }
}

export async function updateIngredientSettings(user, id, body = {}, q = {}) {
  const ctx = await inventoryContext(user, q);
  mustManager(ctx);
  const ing = await findIngredient(ctx, id);
  const num = (v) => { const n = Number(v); if (!Number.isFinite(n) || n < 0 || n > 1e7) throw new ValidationError('Numbers must be zero or more'); return n; };
  for (const key of ['minimumStock', 'reorderLevel', 'costPerUnit']) if (body[key] !== undefined) ing[key] = num(body[key]);
  for (const [key, max] of [['category', 60], ['unit', 30], ['supplierName', 120], ['supplierId', 60]]) if (body[key] !== undefined) ing[key] = str(body[key], max);
  ing.lastUpdatedBy = await actorName(ctx);
  await ing.save();
  await syncStockSignals(ctx.storeId, ing.toObject()); // thresholds may have moved
  return { message: 'Ingredient updated', data: toIngredient(ing.toObject()) };
}

// ---------------------------------------------------------------------------------------------
// Alerts: raised and cleared from the numbers
// ---------------------------------------------------------------------------------------------

const alertSeverity = (ing) => (ing.currentStock <= 0 ? 'critical' : ing.currentStock <= ing.minimumStock * 0.5 ? 'high' : 'medium');

/** Keeps the low-stock alert and the automatic out-of-stock shortage of one ingredient in line with its stock. */
export async function syncStockSignals(storeId, ing) {
  if (!ing?.tracked) return;
  const low = ing.minimumStock > 0 ? ing.currentStock <= ing.minimumStock : ing.currentStock <= 0;
  const active = await InventoryAlert.findOne({ storeId, ingredientId: ing._id, status: 'active' });
  if (low) {
    if (active) {
      active.currentStock = round2(ing.currentStock); active.minimumStock = ing.minimumStock; active.severity = alertSeverity(ing);
      await active.save();
    } else {
      await InventoryAlert.create({
        storeId, ingredientId: ing._id, ingredientName: ing.ingredientName, currentStock: round2(ing.currentStock),
        minimumStock: ing.minimumStock, severity: alertSeverity(ing),
      });
    }
  } else if (active) {
    active.status = 'resolved'; active.resolvedBy = 'System'; active.resolvedAt = new Date(); active.resolutionNote = 'Stock is back above the minimum level';
    await active.save();
  }

  if (ing.currentStock <= 0) {
    const open = await IngredientShortage.exists({ storeId, ingredientId: ing._id, status: 'active' });
    if (!open) {
      await IngredientShortage.create({
        storeId, ingredientId: ing._id, ingredientName: ing.ingredientName, shortageQty: ing.reorderLevel || ing.minimumStock || 1,
        severity: 'critical', system: true, createdBy: 'System Auto-Detection',
        timeline: [{ user: 'System Auto-Detection', action: 'detected', remarks: `${ing.ingredientName} ran out of stock` }],
      });
    }
  } else if (!low) {
    const open = await IngredientShortage.find({ storeId, ingredientId: ing._id, status: 'active', system: true });
    for (const s of open) {
      s.status = 'resolved'; s.resolvedBy = 'System'; s.resolvedAt = new Date(); s.resolutionNote = 'Stock replenished'; s.actionTaken = 'Restocked';
      s.timeline.push({ user: 'System', action: 'resolved', remarks: 'Stock replenished' });
      await s.save();
    }
  }
}

const toAlert = (a) => ({
  _id: String(a._id),
  storeId: String(a.storeId),
  ingredientId: String(a.ingredientId),
  ingredientName: a.ingredientName,
  alertType: a.alertType,
  currentStock: round2(a.currentStock),
  minimumStock: a.minimumStock,
  severity: a.severity,
  status: a.status,
  createdAt: a.createdAt,
  resolvedBy: a.resolvedBy,
  resolvedAt: a.resolvedAt || '',
  resolutionNote: a.resolutionNote,
});

export async function listAlerts(user, q = {}) {
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
    InventoryAlert.find(filter).sort({ createdAt: -1 }).skip(p.skip).limit(p.limit).lean(),
    InventoryAlert.countDocuments(filter),
  ]);
  return { data: rows.map(toAlert), pagination: pagination(total, p) };
}

export async function alertsDashboard(user, q = {}) {
  const ctx = await inventoryContext(user, q);
  const rows = await InventoryAlert.find({ storeId: ctx.storeId }).select('status severity ingredientId').lean();
  const active = rows.filter((r) => r.status === 'active');
  return {
    activeAlerts: active.length,
    criticalAlerts: active.filter((r) => r.severity === 'critical').length,
    resolvedAlerts: rows.filter((r) => r.status === 'resolved').length,
    ingredientsAffected: new Set(active.map((r) => String(r.ingredientId))).size,
  };
}

const findAlert = async (ctx, id) => {
  if (!isId(id)) throw new NotFoundError('Alert not found');
  const alert = await InventoryAlert.findOne({ _id: toId(id), storeId: ctx.storeId });
  if (!alert) throw new NotFoundError('Alert not found');
  return alert;
};

export async function alertDetails(user, id, q = {}) {
  const ctx = await inventoryContext(user, q);
  const alert = await findAlert(ctx, id);
  const ing = await StoreIngredient.findOne({ _id: alert.ingredientId, storeId: ctx.storeId }).lean();
  const consumption = await consumptionOf(ctx.storeId, alert.ingredientId);
  let depletionEstimation = 'No daily consumption data available';
  if (alert.currentStock === 0) depletionEstimation = 'Out of Stock / Depleted';
  else if (consumption.averageDaily > 0) depletionEstimation = `${(alert.currentStock / consumption.averageDaily).toFixed(1)} days remaining`;
  return {
    ...toAlert(alert.toObject()),
    category: ing?.category || 'Unknown',
    unit: ing?.unit || 'Unit',
    costPerUnit: ing?.costPerUnit || 0,
    reorderLevel: ing?.reorderLevel || 0,
    supplierName: ing?.supplierName || 'Default Supplier',
    consumption,
    depletionEstimation,
  };
}

export async function resolveAlert(user, body = {}, q = {}) {
  const ctx = await inventoryContext(user, q);
  mustManager(ctx);
  const alert = await findAlert(ctx, body.alertId);
  if (alert.status === 'resolved') throw new ValidationError('This alert is already resolved');
  const note = str(body.resolutionNote, 600);
  if (!note) throw new ValidationError('A resolution note is required');
  alert.status = 'resolved'; alert.resolvedBy = await actorName(ctx); alert.resolvedAt = new Date(); alert.resolutionNote = note;
  await alert.save();
  return { message: 'Alert resolved successfully' };
}

// ---------------------------------------------------------------------------------------------
// Transfers between stores of the same franchise
// ---------------------------------------------------------------------------------------------

/** Sister stores of the caller's franchise that hold the same ingredient, nearest first. */
export async function availableStores(user, q = {}) {
  const ctx = await inventoryContext(user, q);
  const ing = await findIngredient(ctx, q.ingredientId);
  if (!ctx.franchiseId) return [];
  const [me, sisters] = await Promise.all([
    FoodStore.findById(ctx.storeId).select('latitude longitude').lean(),
    FoodStore.find({ franchiseId: ctx.franchiseId, _id: { $ne: ctx.storeId }, approvalStatus: 'Approved', isActive: { $ne: false } }).select('storeName latitude longitude').lean(),
  ]);
  if (!sisters.length) return [];
  const [stock, managers] = await Promise.all([
    StoreIngredient.find({ storeId: { $in: sisters.map((s) => s._id) }, nameKey: ing.nameKey, currentStock: { $gt: 0 } }).select('storeId currentStock').lean(),
    StoreManager.find({ storeId: { $in: sisters.map((s) => String(s._id)) }, status: 'Active', role: /manager/i }).select('storeId name').lean(),
  ]);
  const qty = new Map(stock.map((s) => [String(s.storeId), s.currentStock]));
  const manager = new Map(managers.map((m) => [String(m.storeId), m.name]));
  return sisters
    .filter((s) => qty.has(String(s._id)))
    .map((s) => {
      const km = [me?.latitude, me?.longitude, s.latitude, s.longitude].every(Number.isFinite) ? haversineKm(me.latitude, me.longitude, s.latitude, s.longitude) : null;
      return { storeId: String(s._id), name: s.storeName, distance: km === null ? null : round2(km), availableQty: round2(qty.get(String(s._id))), managerName: manager.get(String(s._id)) || '' };
    })
    .sort((a, b) => (a.distance ?? 1e9) - (b.distance ?? 1e9));
}

/** Asks a sister store for stock. The destination is always the caller's own store. Waits for approval. */
export async function requestTransfer(user, body = {}, q = {}) {
  const ctx = await inventoryContext(user, q);
  mustManager(ctx);
  const mine = await findIngredient(ctx, body.ingredientId);
  if (!isId(body.fromStoreId)) throw new ValidationError('Choose the store to take stock from');
  if (String(body.fromStoreId) === String(ctx.storeId)) throw new ValidationError('Choose a different store');
  const source = await FoodStore.findOne({ _id: toId(body.fromStoreId), franchiseId: ctx.franchiseId }).select('_id').lean();
  if (!source) throw new NotFoundError('Store not found');
  const theirs = await StoreIngredient.findOne({ storeId: source._id, nameKey: mine.nameKey });
  const qty = round2(body.quantity);
  if (!Number.isFinite(qty) || qty <= 0) throw new ValidationError('Enter a valid quantity');
  if (!theirs || theirs.currentStock < qty) throw new ValidationError('That store does not have enough stock');
  const reason = str(body.reason, 500);
  if (!reason) throw new ValidationError('A reason is required');

  const name = await actorName(ctx);
  const transfer = await StockTransfer.create({
    fromStoreId: source._id, toStoreId: ctx.storeId, franchiseId: ctx.franchiseId, ingredientName: mine.ingredientName,
    fromIngredientId: theirs._id, toIngredientId: mine._id, unit: mine.unit, quantity: qty, reason, remarks: str(body.remarks, 500),
    shortageId: isId(body.shortageId) ? toId(body.shortageId) : null, requestedBy: toId(ctx.user.userId), requestedByName: name,
  });
  if (transfer.shortageId) {
    await IngredientShortage.updateOne(
      { _id: transfer.shortageId, storeId: ctx.storeId },
      { $push: { timeline: { user: name, action: 'transfer_initiated', remarks: `Requested ${qty} ${mine.unit} from a sister store`, createdAt: new Date() } } },
    );
  }
  return { message: 'Transfer request submitted successfully. Awaiting administrator approval.', data: { _id: String(transfer._id), status: transfer.status } };
}
