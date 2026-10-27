import { FoodStore } from '../../store/models/store.model.js';
import { ForbiddenError, NotFoundError } from '../../../../core/auth/errors.js';
import { isId, toId, periodOf } from '../../dashboard/services/dashboardAccess.js';

// Which stores a franchise-admin screen call may touch, decided from the token:
//   super admin      -> every store (?franchiseId narrows)
//   franchise admin  -> the stores of its own franchise; read and write
//   store manager    -> its own store, and only where the caller allows it (hours, pricing); read only
//   anyone else      -> 403.   A store outside the scope is "not found" (404).

const normalize = (role) => String(role || '').trim().replace(/-/g, '_').toUpperCase();

/**
 * @param {{ write?: boolean, manager?: boolean }} opts  write: the call changes data; manager: store managers may read it
 * @returns {{ role, isSuper, storeFilter, actor }}
 */
export function accessOf(user, query = {}, { write = false, manager = false } = {}) {
  const role = normalize(user?.role);
  if (role === 'SUPERADMIN' || role === 'SUPER_ADMIN') {
    return { role, isSuper: true, storeFilter: isId(query.franchiseId) ? { franchiseId: toId(query.franchiseId) } : {}, actor: 'Super Admin' };
  }
  if (role === 'FRANCHISE_ADMIN') {
    if (!isId(user.franchiseId)) throw new ForbiddenError('No franchise is linked to your account.');
    return { role, isSuper: false, storeFilter: { franchiseId: toId(user.franchiseId) }, actor: 'Franchise Admin' };
  }
  if (role === 'STORE_MANAGER' && manager) {
    if (write) throw new ForbiddenError('Store managers have read-only access here.');
    if (!isId(user.storeId)) throw new ForbiddenError('No store is linked to your account.');
    return { role, isSuper: false, storeFilter: { _id: toId(user.storeId) }, actor: 'Store Manager' };
  }
  throw new ForbiddenError('You do not have access to this page.');
}

/** Every store in scope (lean). */
export const scopedStores = (access, extra = {}, select = '_id franchiseId storeName code city storeType isActive approvalStatus createdAt') =>
  FoodStore.find({ $and: [access.storeFilter, extra] }).select(select).sort({ storeName: 1 }).lean();

/** One store in scope, or 404. */
export async function scopedStore(access, storeId, select = '_id franchiseId storeName code city storeType isActive approvalStatus createdAt') {
  if (!isId(storeId)) throw new NotFoundError('Store not found');
  const store = await FoodStore.findOne({ $and: [access.storeFilter, { _id: toId(storeId) }] }).select(select).lean();
  if (!store) throw new NotFoundError('Store not found');
  return store;
}

/** Several stores in scope; 404 if any of them is not. */
export async function scopedStoreList(access, ids, select) {
  const list = [...new Set((Array.isArray(ids) ? ids : String(ids || '').split(',')).map((s) => String(s).trim()).filter(Boolean))];
  if (!list.length || list.some((id) => !isId(id))) throw new NotFoundError('Store not found');
  const stores = await FoodStore.find({ $and: [access.storeFilter, { _id: { $in: list.map(toId) } }] }).select(select || '_id franchiseId storeName code').lean();
  if (stores.length !== list.length) throw new NotFoundError('Store not found');
  return stores;
}

// The screens send ?dateRange=today|last7|last30|custom (&startDate&endDate); the dashboards' ?date= also works.
const RANGE = { last7: 'week', last30: 'month', week: 'week', month: 'month', today: 'today', yesterday: 'yesterday', custom: 'custom' };
export function rangeOf(query = {}, fallback = 'today') {
  const key = String(query.dateRange || query.range || query.date || fallback).toLowerCase();
  return periodOf({ ...query, date: RANGE[key] || RANGE[fallback] });
}

/** Store status as the franchise screens show it. */
export function storeStatus(store, closed = false) {
  if (store.isActive === false) return 'Inactive';
  if (store.approvalStatus && store.approvalStatus !== 'Approved') return 'Pending';
  return closed ? 'Closed' : 'Active';
}
