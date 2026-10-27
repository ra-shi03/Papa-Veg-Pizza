import mongoose from 'mongoose';
import { FoodStore } from '../../store/models/store.model.js';
import { ForbiddenError, NotFoundError, ValidationError } from '../../../../core/auth/errors.js';

// Who may see which dashboard, decided from the token:
//   store manager      -> own store (a ?storeId of another store is 404)
//   kitchen supervisor -> own store, kitchen and order widgets only (others 403)
//   kitchen staff      -> no access (403)
//   franchise admin    -> own franchise; may drill into ONE of its stores with ?storeId (another franchise's store 404)
//   super admin        -> everything; ?storeId / ?franchiseId to narrow

const normalize = (role) => String(role || '').trim().replace(/-/g, '_').toUpperCase();
export const toId = (v) => new mongoose.Types.ObjectId(String(v));
export const isId = (v) => mongoose.Types.ObjectId.isValid(String(v || '')) && /^[a-f0-9]{24}$/i.test(String(v));
const isSuper = (role) => role === 'SUPERADMIN' || role === 'SUPER_ADMIN';

/** Widgets a kitchen supervisor may open on the store dashboard. */
export const SUPERVISOR_WIDGETS = new Set([
  'today-orders', 'active-orders', 'prep-time', 'pending-deliveries', 'live-orders', 'order-status', 'kitchen-performance', 'delivery-overview',
]);

/** The one store a store-dashboard call is about. */
export async function storeScope(user, query = {}, widget) {
  const role = normalize(user?.role);
  if (role === 'STORE_MANAGER' || role === 'KITCHEN_SUPERVISOR') {
    if (!isId(user.storeId)) throw new ForbiddenError('No store is linked to your account.');
    if (role === 'KITCHEN_SUPERVISOR' && !SUPERVISOR_WIDGETS.has(widget)) throw new ForbiddenError('This widget is for the store manager.');
    // The screen sends the store it remembers; anything that is not a real id means "my store".
    if (isId(query.storeId) && String(query.storeId) !== String(user.storeId)) throw new NotFoundError('Store not found');
    const store = await FoodStore.findById(toId(user.storeId)).select('_id franchiseId storeName').lean();
    if (!store) throw new NotFoundError('Store not found');
    return store;
  }
  if (role === 'FRANCHISE_ADMIN' || isSuper(role)) {
    if (!isId(query.storeId)) throw new ValidationError('Choose a store (storeId).');
    const filter = { _id: toId(query.storeId) };
    if (!isSuper(role)) {
      if (!isId(user.franchiseId)) throw new ForbiddenError('No franchise is linked to your account.');
      filter.franchiseId = toId(user.franchiseId);
    }
    const store = await FoodStore.findOne(filter).select('_id franchiseId storeName').lean();
    if (!store) throw new NotFoundError('Store not found');
    return store;
  }
  throw new ForbiddenError('You do not have access to this dashboard.');
}

/** The order / store filter for a franchise-dashboard call: { match, storeFilter, storeIds }. */
export async function adminScope(user, query = {}) {
  const role = normalize(user?.role);
  const storeFilter = {};
  if (isSuper(role)) {
    if (isId(query.franchiseId)) storeFilter.franchiseId = toId(query.franchiseId);
  } else if (role === 'FRANCHISE_ADMIN') {
    if (!isId(user.franchiseId)) throw new ForbiddenError('No franchise is linked to your account.');
    storeFilter.franchiseId = toId(user.franchiseId);
  } else {
    throw new ForbiddenError('Admin access required');
  }
  if (query.storeId !== undefined && query.storeId !== '' && query.storeId !== 'All') {
    if (!isId(query.storeId)) throw new NotFoundError('Store not found');
    const one = await FoodStore.findOne({ ...storeFilter, _id: toId(query.storeId) }).select('_id').lean();
    if (!one) throw new NotFoundError('Store not found');
    storeFilter._id = one._id;
  }
  const stores = await FoodStore.find(storeFilter).select('_id storeName approvalStatus isActive').lean();
  const storeIds = stores.map((s) => s._id);
  return { stores, storeIds, match: { storeId: { $in: storeIds } } };
}

// ---------------------------------------------------------------------------------------------
// Time helpers (server local time)
// ---------------------------------------------------------------------------------------------

export const startOfDay = (d = new Date()) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
export const daysAgo = (n) => { const x = startOfDay(); x.setDate(x.getDate() - n); return x; };

/** ?date=today|yesterday|week|month|custom (&start=&end=) -> { from, to }. Default today. */
export function periodOf(query = {}) {
  const now = new Date();
  switch (String(query.date || query.period || 'today').toLowerCase()) {
    case 'yesterday': return { from: daysAgo(1), to: startOfDay() };
    case 'week': return { from: daysAgo(6), to: now };
    case 'month': return { from: daysAgo(29), to: now };
    case 'custom': {
      const from = new Date(query.start || query.startDate);
      const to = new Date(query.end || query.endDate);
      if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) throw new ValidationError('Invalid date range');
      to.setHours(23, 59, 59, 999);
      return { from: startOfDay(from), to };
    }
    default: return { from: startOfDay(), to: now };
  }
}

export const hourLabel = (h) => `${String(((h + 11) % 12) + 1).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
export const ago = (date) => {
  const m = Math.max(0, Math.round((Date.now() - new Date(date).getTime()) / 60000));
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h}h ago` : `${Math.round(h / 24)}d ago`;
};
export const round1 = (n) => Math.round((Number(n) || 0) * 10) / 10;
export const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

export const CANCELLED = ['cancelled_by_user', 'cancelled_by_store', 'cancelled_by_admin'];
/** Orders that count as sales: not cancelled, and either pay-on-delivery / wallet or actually paid online. */
export const SALE = {
  orderStatus: { $nin: CANCELLED },
  $or: [{ 'payment.method': { $in: ['cash', 'wallet', 'razorpay_qr'] } }, { 'payment.status': { $in: ['paid', 'authorized'] } }],
};
