import { FoodOrder } from '../models/order.model.js';
import { buildOrderIdentityFilter } from './order.helpers.js';

// Who may follow an order's live tracking, and who may push the rider's location for it.
// Everything is decided from the order record in the DB and the signed token, never from the socket payload.

const normalizeRole = (role) => String(role || '').trim().replace(/_/g, '-').toUpperCase();
const SUPER_ADMIN_ROLES = new Set(['SUPERADMIN', 'SUPER-ADMIN']);
const CUSTOMER_ROLES = new Set(['USER', 'CUSTOMER']);
const STORE_STAFF_ROLES = new Set(['STORE-MANAGER', 'KITCHEN-SUPERVISOR']);
const FINISHED = /^(delivered|cancelled)/;

const same = (a, b) => a != null && b != null && String(a) === String(b);
const partnerOf = (order) => order?.dispatch?.deliveryPartnerId?._id ?? order?.dispatch?.deliveryPartnerId;

/** The order behind a tracking id (Mongo _id or the public order number), or null. */
export async function findOrderForTracking(orderId) {
  const filter = buildOrderIdentityFilter(orderId);
  if (!filter) return null;
  return FoodOrder.findOne(filter)
    .select('userId storeId franchiseId dispatch.deliveryPartnerId orderStatus order_id orderId')
    .lean();
}

/** Customer who placed it, its assigned rider, its store (legacy STORE login, manager, supervisor), its franchise admin, or a super admin. */
export function canWatchOrder(user, order) {
  if (!user || !order) return false;
  const role = normalizeRole(user.role);
  if (SUPER_ADMIN_ROLES.has(role)) return true;
  if (CUSTOMER_ROLES.has(role)) return same(order.userId, user.userId);
  if (role === 'DELIVERY-PARTNER') return same(partnerOf(order), user.userId);
  if (role === 'STORE') return same(order.storeId, user.userId);
  if (STORE_STAFF_ROLES.has(role)) return same(order.storeId, user.storeId);
  if (role === 'FRANCHISE-ADMIN') return same(order.franchiseId, user.franchiseId);
  return false;
}

/** Only the rider assigned to the order, and only while it is still in progress. */
export function canPushLocation(user, order) {
  if (!user || !order) return false;
  if (normalizeRole(user.role) !== 'DELIVERY-PARTNER') return false;
  if (FINISHED.test(String(order.orderStatus || ''))) return false;
  return same(partnerOf(order), user.userId);
}

/** Every tracking room name a client may have joined for this order (by _id or by order number). */
export function trackingIdsOf(order) {
  return [...new Set([order?._id, order?.order_id, order?.orderId].filter(Boolean).map(String))];
}
