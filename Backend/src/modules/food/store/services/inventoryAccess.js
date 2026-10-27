import mongoose from 'mongoose';
import { FoodStore } from '../models/store.model.js';
import { StoreManager } from '../../franchise/models/storeManager.model.js';
import { StoreIngredient } from '../models/storeIngredient.model.js';
import { ForbiddenError, NotFoundError, ValidationError } from '../../../../core/auth/errors.js';

// Who is calling, and which store they are looking at. Everything comes from the token:
//   store manager      -> their store, full access
//   kitchen supervisor -> their store: read stock / shortages, file waste + shortage reports + stock requests
//   kitchen staff      -> same, but only their own waste reports and stock requests
//   franchise admin    -> read-only, for ONE store of their own franchise (?storeId=...)
//   anyone else        -> 403.   A record of another store / franchise is simply not found (404).

const normalize = (role) => String(role || '').trim().replace(/-/g, '_').toUpperCase();
const ROLE = {
  STORE_MANAGER: 'manager',
  KITCHEN_SUPERVISOR: 'supervisor',
  KITCHEN_STAFF: 'staff',
  FRANCHISE_ADMIN: 'franchise_admin',
};

export const toId = (v) => new mongoose.Types.ObjectId(String(v));
export const isId = (v) => mongoose.Types.ObjectId.isValid(String(v || ''));
export const str = (v, max) => String(v ?? '').trim().slice(0, max);
export const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

export async function inventoryContext(user, query = {}) {
  const role = ROLE[normalize(user?.role)];
  if (!role) throw new ForbiddenError('You do not have access to inventory.');

  if (role === 'franchise_admin') {
    if (!user.franchiseId) throw new ForbiddenError('No franchise is linked to your account.');
    if (!isId(query.storeId)) throw new ValidationError('Choose a store (storeId).');
    const store = await FoodStore.findOne({ _id: toId(query.storeId), franchiseId: toId(user.franchiseId) }).select('_id franchiseId').lean();
    if (!store) throw new NotFoundError('Store not found');
    return { user, role, storeId: store._id, franchiseId: store.franchiseId, readOnly: true };
  }

  if (!user.storeId || !isId(user.storeId)) throw new ForbiddenError('No store is linked to your account.');
  const store = await FoodStore.findById(toId(user.storeId)).select('_id franchiseId').lean();
  if (!store) throw new NotFoundError('Store not found');
  return { user, role, storeId: store._id, franchiseId: store.franchiseId, readOnly: false };
}

export const isManager = (ctx) => ctx.role === 'manager';
export const mustManager = (ctx) => {
  if (!isManager(ctx)) throw new ForbiddenError('Only the store manager can do this.');
};
/** Manager, supervisor or staff of the store (not the read-only franchise admin). */
export const mustBeStoreRole = (ctx) => {
  if (ctx.readOnly) throw new ForbiddenError('This account has read-only access to inventory.');
};

const nameCache = new Map();
/** The caller's display name (shown in history, waste and request lists). */
export async function actorName(ctx) {
  const key = `${ctx.storeId}:${ctx.user.userId}`;
  if (nameCache.has(key)) return nameCache.get(key);
  const member = await StoreManager.findOne({ userId: toId(ctx.user.userId), storeId: String(ctx.storeId) }).select('name').lean();
  const name = member?.name || 'Staff';
  nameCache.set(key, name);
  return name;
}

// ---------------------------------------------------------------------------------------------
// Default ingredient list. No screen creates ingredients, so a store starts with this master list at zero
// stock ("not counted yet"): the manager enters real counts with Update Stock. Nothing is invented about
// quantities or prices.
// ---------------------------------------------------------------------------------------------

const SEED = [
  ['Premium Mozzarella Cheese', 'Cheese', 'KG', 15, 25],
  ['Fresh Paneer Cubes', 'Cheese', 'KG', 5, 10],
  ['Classic Tomato Pizza Sauce', 'Sauce', 'Litre', 10, 20],
  ['Garlic Mayo Dip', 'Sauce', 'Litre', 5, 10],
  ['Capsicum', 'Veggie & Toppings', 'KG', 5, 8],
  ['Onion', 'Veggie & Toppings', 'KG', 8, 15],
  ['Sweet Corn', 'Veggie & Toppings', 'KG', 4, 8],
  ['Black Olives', 'Veggie & Toppings', 'KG', 3, 5],
  ['Sliced Jalapenos', 'Veggie & Toppings', 'KG', 3, 5],
  ['Mushrooms', 'Veggie & Toppings', 'KG', 3, 6],
  ['Tomato', 'Veggie & Toppings', 'KG', 5, 10],
  ['Dough Flour (Premium Maida)', 'Flour & Dough', 'KG', 40, 60],
  ['Pizza Dough Balls (Medium)', 'Flour & Dough', 'Pcs', 30, 60],
  ['Medium Pizza Box', 'Packaging & Addons', 'Pcs', 100, 200],
  ['Large Pizza Box', 'Packaging & Addons', 'Pcs', 100, 200],
  ['Oregano Sachets', 'Packaging & Addons', 'Pcs', 200, 400],
  ['Chilli Flakes Sachets', 'Packaging & Addons', 'Pcs', 200, 400],
];

export const nameKeyOf = (name) => String(name || '').trim().toLowerCase().replace(/\s+/g, ' ');

/** Creates the default ingredient list the first time a store's own staff open inventory. */
export async function ensureIngredients(ctx) {
  if (ctx.readOnly) return;
  if (await StoreIngredient.exists({ storeId: ctx.storeId })) return;
  const rows = SEED.map(([ingredientName, category, unit, minimumStock, reorderLevel]) => ({
    storeId: ctx.storeId, ingredientName, nameKey: nameKeyOf(ingredientName), category, unit, minimumStock, reorderLevel,
  }));
  try {
    await StoreIngredient.insertMany(rows, { ordered: false });
  } catch (err) {
    // two screens opening at once: the other one already created them
    if (err?.code !== 11000 && !err?.writeErrors) throw err;
  }
}

// ---------------------------------------------------------------------------------------------
// Shared list helpers
// ---------------------------------------------------------------------------------------------

export const pageOf = (q, defaultLimit = 10) => {
  const limit = Math.min(100, Math.max(1, parseInt(q.limit, 10) || defaultLimit));
  const page = Math.max(1, parseInt(q.page, 10) || 1);
  return { page, limit, skip: (page - 1) * limit };
};

export const pagination = (total, { page, limit }) => ({ total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) });

/** from / to (dates, inclusive of the whole last day) -> a Mongo range on `field`, or null. */
export const dateRange = (q) => {
  const range = {};
  if (q.from) { const d = new Date(q.from); if (!Number.isNaN(d.getTime())) range.$gte = d; }
  if (q.to) { const d = new Date(q.to); if (!Number.isNaN(d.getTime())) { d.setHours(23, 59, 59, 999); range.$lte = d; } }
  return Object.keys(range).length ? range : null;
};

export const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export const isAll = (v) => !v || v === 'All';
