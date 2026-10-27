import { StoreManager } from '../models/storeManager.model.js';
import { listFranchiseOrders } from '../../store/services/storeOrders.service.js';
import { listIngredients } from '../../store/services/inventory.service.js';
import { listReviews } from '../../store/services/storeCrm.service.js';
import { ValidationError } from '../../../../core/auth/errors.js';
import { isId } from '../../dashboard/services/dashboardAccess.js';
import { accessOf, scopedStore } from './storeAccess.js';

// Store details drawer (franchise admin): GET /v1/orders|inventory|reviews|users?storeId=. The store must be in
// the caller's scope (else 404); the lists come from the existing store services, called as that store's
// franchise admin / manager would see them.

async function storeOf(user, q) {
  if (!isId(q.storeId)) throw new ValidationError('Choose a store (storeId).');
  return scopedStore(accessOf(user, q), q.storeId);
}

export async function orders(user, q = {}) {
  const store = await storeOf(user, q);
  return listFranchiseOrders({ franchiseId: String(store.franchiseId) }, { ...q, storeId: String(store._id) });
}

export async function inventory(user, q = {}) {
  const store = await storeOf(user, q);
  return listIngredients({ role: 'FRANCHISE_ADMIN', franchiseId: String(store.franchiseId), userId: user.userId }, { ...q, storeId: String(store._id) });
}

export async function reviews(user, q = {}) {
  const store = await storeOf(user, q);
  return listReviews({ role: 'STORE_MANAGER', storeId: String(store._id), userId: user.userId }, q);
}

export async function staff(user, q = {}) {
  const store = await storeOf(user, q);
  const rows = await StoreManager.find({ storeId: String(store._id), status: { $ne: 'DELETED' } })
    .select('userId name email phone role status employeeCode personalDetails.shiftType createdAt').sort({ createdAt: -1 }).lean();
  return rows.map((r) => ({
    _id: String(r._id), userId: r.userId ? String(r.userId) : null, name: r.name, email: r.email, phone: r.phone,
    role: r.role || 'Store Manager', status: r.status, employeeCode: r.employeeCode || '', shiftType: r.personalDetails?.shiftType || '', createdAt: r.createdAt,
  }));
}
