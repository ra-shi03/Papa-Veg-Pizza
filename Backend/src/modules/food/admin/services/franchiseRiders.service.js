import mongoose from 'mongoose';
import { FoodStore } from '../../store/models/store.model.js';
import { FoodOrder } from '../../orders/models/order.model.js';
import { FoodDeliveryPartner } from '../../delivery/models/deliveryPartner.model.js';
import { NotFoundError, ValidationError, ForbiddenError } from '../../../../core/auth/errors.js';
import { riderScope, riderAreaOf } from '../../store/services/storeDelivery.service.js';
import { maskPhone } from '../../store/services/storeCrm.service.js';
import { storeArea, nearbyFilter } from '../../store/services/nearby.js';
import { approveDeliveryPartner, rejectDeliveryPartner } from './admin.service.js';

// GET /food/admin/delivery/partners for a franchise admin: the riders near, or working for, its own stores, read only.
// Near = the store panel's rule (store/services/nearby.js via riderScope, NEARBY_RADIUS_KM). Working for = riders who
// have an order of this franchise. The franchise comes from the token; ?storeId= narrows to one of its own stores
// (another franchise's store is 404). Only the fields below leave the server: never documents, bank details,
// Aadhaar / PAN, the email, the photo or the full phone.

const FIELDS = 'name phone vehicleType status availabilityStatus city state lastLocationAt rating totalDeliveries createdAt updatedAt franchiseId';
const MANAGEABLE = ['pending', 'approved', 'suspended'];
const conflict = (message) => Object.assign(new Error(message), { name: 'ConflictError', statusCode: 409 });

/**
 * The riders a franchise admin manages (approve, reject, suspend, activate, open the verification details):
 *   - riders this franchise claimed (approved first) or that are assigned to it or to one of its stores, anywhere;
 *   - unclaimed riders (no franchise, no store) near one of its stores: saved GPS within NEARBY_RADIUS_KM, or the same
 *     city / zone when they have no GPS (store/services/nearby.js).
 * Riders claimed by another franchise never match. The franchise comes from the token only.
 */
export async function franchiseRiderFilter(franchiseId, { stores, statuses = MANAGEABLE } = {}) {
  const own = stores || await FoodStore.find({ franchiseId }).select('_id').lean();
  const or = [{ franchiseId }];
  if (own.length) or.push({ storeId: { $in: own.map((s) => s._id) } });
  for (const s of own) {
    const area = await storeArea(s._id);
    or.push({ $and: [{ franchiseId: null, storeId: null }, nearbyFilter(area, { point: 'lastLocation', city: 'city' })] });
  }
  return { status: { $in: statuses }, $or: or };
}
const isId = (v) => mongoose.Types.ObjectId.isValid(String(v || '')) && /^[a-f0-9]{24}$/i.test(String(v));
const oid = (v) => new mongoose.Types.ObjectId(String(v));

export async function franchiseDeliveryPartners(scope, query = {}) {
  let stores = await FoodStore.find({ franchiseId: scope.franchiseId }).select('_id storeName franchiseId').sort({ storeName: 1 }).lean();
  if (query.storeId) {
    if (!isId(query.storeId) || !stores.some((s) => String(s._id) === String(query.storeId))) throw new NotFoundError('Store not found');
    stores = stores.filter((s) => String(s._id) === String(query.storeId));
  }
  const storeName = new Map(stores.map((s) => [String(s._id), s.storeName]));

  const byRider = new Map();          // riderId -> { doc, storeIds:Set }
  const note = (doc, storeId) => {
    const key = String(doc._id);
    if (!byRider.has(key)) byRider.set(key, { doc, storeIds: new Set() });
    byRider.get(key).storeIds.add(String(storeId));
  };
  for (const store of stores) {
    const { filter } = await riderScope(store);
    for (const doc of await FoodDeliveryPartner.find(filter).select(FIELDS).limit(300).lean()) note(doc, store._id);
  }
  // plus the riders it claimed or suspended (wherever they are now)
  for (const doc of await FoodDeliveryPartner.find(await franchiseRiderFilter(scope.franchiseId, { stores })).select(FIELDS).limit(500).lean()) {
    if (!byRider.has(String(doc._id))) byRider.set(String(doc._id), { doc, storeIds: new Set() });
  }
  // riders who deliver this franchise's orders, wherever they are now
  const worked = await FoodOrder.aggregate([
    { $match: { storeId: { $in: stores.map((s) => s._id) }, 'dispatch.deliveryPartnerId': { $ne: null } } },
    { $group: { _id: { r: '$dispatch.deliveryPartnerId', s: '$storeId' } } },
  ]);
  const missing = worked.map((w) => w._id.r).filter((id) => !byRider.has(String(id)));
  if (missing.length) {
    // never a rider another franchise has claimed
    for (const doc of await FoodDeliveryPartner.find({ _id: { $in: missing }, franchiseId: { $in: [scope.franchiseId, null] } }).select(FIELDS).lean()) byRider.set(String(doc._id), { doc, storeIds: new Set() });
  }
  for (const w of worked) byRider.get(String(w._id.r))?.storeIds.add(String(w._id.s));

  const ids = [...byRider.values()].map((r) => r.doc._id);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const [delivered, today, active] = await Promise.all([
    FoodOrder.aggregate([{ $match: { 'dispatch.deliveryPartnerId': { $in: ids }, storeId: { $in: stores.map((s) => s._id) }, orderStatus: 'delivered' } }, { $group: { _id: '$dispatch.deliveryPartnerId', n: { $sum: 1 } } }]),
    FoodOrder.aggregate([{ $match: { 'dispatch.deliveryPartnerId': { $in: ids }, storeId: { $in: stores.map((s) => s._id) }, orderStatus: 'delivered', updatedAt: { $gte: startOfToday } } }, { $group: { _id: '$dispatch.deliveryPartnerId', n: { $sum: 1 } } }]),
    FoodOrder.aggregate([{ $match: { 'dispatch.deliveryPartnerId': { $in: ids }, orderStatus: { $in: ['confirmed', 'preparing', 'ready_for_pickup', 'reached_pickup', 'picked_up', 'reached_drop'] } } }, { $group: { _id: '$dispatch.deliveryPartnerId', n: { $sum: 1 } } }]),
  ]);
  const deliveredBy = new Map(delivered.map((d) => [String(d._id), d.n]));
  const todayBy = new Map(today.map((d) => [String(d._id), d.n]));
  const activeBy = new Map(active.map((d) => [String(d._id), d.n]));

  let rows = [...byRider.values()].map(({ doc, storeIds }) => {
    const activeOrders = activeBy.get(String(doc._id)) || 0;
    return {
      _id: doc._id,
      name: doc.name || '',
      phone: maskPhone(doc.phone),
      deliveryId: `DP-${String(doc._id).slice(-8).toUpperCase()}`,
      zone: riderAreaOf(doc),
      vehicleType: doc.vehicleType || '',
      status: doc.status,
      availability: doc.availabilityStatus || 'offline',
      activeOrders,
      rating: doc.rating || 0,
      lastSeen: doc.lastLocationAt || doc.updatedAt || null,
      totalOrders: deliveredBy.get(String(doc._id)) || 0,
      ordersToday: todayBy.get(String(doc._id)) || 0,
      storeIds: [...storeIds],
      storeNames: [...storeIds].map((id) => storeName.get(id)).filter(Boolean),
      claimedByYou: String(doc.franchiseId || '') === String(scope.franchiseId),
    };
  });

  const stats = {
    total: rows.length,
    pending: rows.filter((r) => r.status === 'pending').length,
    approved: rows.filter((r) => r.status === 'approved').length,
    suspended: rows.filter((r) => r.status === 'suspended').length,
    online: rows.filter((r) => r.status === 'approved' && r.availability === 'online').length,
    offline: rows.filter((r) => r.status === 'approved' && r.availability !== 'online').length,
    busy: rows.filter((r) => r.activeOrders > 0).length,
  };

  const search = String(query.search || '').trim().toLowerCase();
  if (search) rows = rows.filter((r) => [r.name, r.zone, r.vehicleType].some((v) => String(v).toLowerCase().includes(search)));
  rows.sort((a, b) => a.name.localeCompare(b.name));

  const limitNum = Math.max(1, Math.min(1000, Number(query.limit) || 100));
  const page = Math.max(1, Number(query.page) || 1);
  const skip = (page - 1) * limitNum;
  return {
    deliveryPartners: rows.slice(skip, skip + limitNum).map((r, i) => ({ sl: skip + i + 1, ...r })),
    stats,
    stores: stores.map((s) => ({ _id: s._id, storeName: s.storeName })),
    pagination: { page, limit: limitNum, total: rows.length, pages: Math.ceil(rows.length / limitNum) || 1 },
  };
}

// ---------------------------------------------------------------------------------------------
// Approval, rejection, suspension: the franchise admin's job (the super admin only reads)
// ---------------------------------------------------------------------------------------------

const VERIFY_FIELDS = 'name phone email address city state vehicleType vehicleName vehicleNumber drivingLicenseNumber panNumber aadharNumber ' +
  'profilePhoto aadharPhoto panPhoto drivingLicensePhoto status availabilityStatus lastLocationAt rating franchiseId storeId ' +
  'approvedAt approvedBy rejectionReason rejectedAt suspendedAt suspensionReason approvalHistory createdAt updatedAt';

/** "XXXXXXXX9876": only the last 4 characters of an Aadhaar, PAN or licence number. */
export const maskLast4 = (v) => {
  const t = String(v || '').replace(/\s+/g, '');
  return t ? `${'X'.repeat(Math.max(0, t.length - 4))}${t.slice(-4)}` : '';
};

/** The rider, if this franchise may manage it; 404 otherwise (another franchise's or a far rider). */
async function findManaged(franchiseId, riderId, select = VERIFY_FIELDS) {
  if (!isId(riderId)) throw new NotFoundError('Delivery partner not found');
  const rider = await FoodDeliveryPartner.findOne({ _id: oid(riderId), ...(await franchiseRiderFilter(franchiseId)) }).select(select).lean();
  if (!rider) throw new NotFoundError('Delivery partner not found');
  return rider;
}

/** GET /food/admin/delivery/join-requests for a franchise admin: pending signups in its scope (same shape as the super admin's). */
export async function franchiseJoinRequests(scope, query = {}) {
  const filter = await franchiseRiderFilter(scope.franchiseId, { statuses: ['pending'] });
  const search = String(query.search || '').trim().toLowerCase();
  let list = await FoodDeliveryPartner.find(filter).select('name phone email city state address vehicleType status createdAt profilePhoto').sort({ createdAt: -1 }).limit(500).lean();
  if (search) list = list.filter((d) => [d.name, d.phone, d.city].some((v) => String(v || '').toLowerCase().includes(search)));
  return {
    requests: list.map((d, i) => ({
      _id: d._id, sl: i + 1, name: d.name || '', email: d.email || '', phone: d.phone || '', zone: d.city || d.state || d.address || '',
      vehicleType: d.vehicleType || '', status: d.status, createdAt: d.createdAt, profilePhoto: d.profilePhoto || null,
    })),
  };
}

/**
 * GET /food/admin/delivery/:id for a franchise admin: what is needed to verify the rider. Aadhaar, PAN and licence
 * numbers show only their last 4 characters; bank details, UPI and push tokens are never selected.
 */
export async function franchiseRiderDetails(scope, riderId) {
  const r = await findManaged(scope.franchiseId, riderId);
  const docs = {
    aadhar: { number: maskLast4(r.aadharNumber), document: r.aadharPhoto || null },
    pan: { number: maskLast4(r.panNumber), document: r.panPhoto || null },
    drivingLicense: { number: maskLast4(r.drivingLicenseNumber), document: r.drivingLicensePhoto || null },
    selfie: { document: r.profilePhoto || null },
  };
  return {
    _id: r._id,
    deliveryId: `DP-${String(r._id).slice(-8).toUpperCase()}`,
    name: r.name || '', phone: r.phone || '', email: r.email || '',
    address: r.address || '', city: r.city || '', state: r.state || '',
    vehicleType: r.vehicleType || '', vehicleName: r.vehicleName || '', vehicleNumber: r.vehicleNumber || '',
    drivingLicenseNumber: docs.drivingLicense.number, aadharNumber: docs.aadhar.number, panNumber: docs.pan.number,
    profilePhoto: r.profilePhoto || null, aadharPhoto: r.aadharPhoto || null, panPhoto: r.panPhoto || null, drivingLicensePhoto: r.drivingLicensePhoto || null,
    documents: docs,
    status: r.status, approvalStatus: r.status, availabilityStatus: r.availabilityStatus || 'offline',
    lastLocationAt: r.lastLocationAt || null, rating: r.rating || 0,
    claimedByYou: String(r.franchiseId || '') === String(scope.franchiseId),
    approvedAt: r.approvedAt || null, rejectionReason: r.rejectionReason || '', suspendedAt: r.suspendedAt || null, suspensionReason: r.suspensionReason || '',
    approvalHistory: (r.approvalHistory || []).filter((h) => !h.franchiseId || String(h.franchiseId) === String(scope.franchiseId)),
    createdAt: r.createdAt,
  };
}

const historyEntry = (user, scope, action, reason = '') => ({
  action, byUserId: isId(user?.userId) ? oid(user.userId) : null, byRole: 'FRANCHISE_ADMIN', franchiseId: scope.franchiseId, reason, at: new Date(),
});

/**
 * Approve a pending rider. The first franchise to approve claims it (franchiseId, approvedBy, approvedAt); from then on
 * only that franchise sees and manages it. Already approved (here or by another franchise) -> 409.
 */
export async function approveRider(scope, user, riderId) {
  const rider = await findManaged(scope.franchiseId, riderId, 'status franchiseId');
  if (rider.status !== 'pending') throw conflict(`This delivery partner is already ${rider.status}.`);
  const now = new Date();
  const res = await FoodDeliveryPartner.updateOne(
    { _id: rider._id, status: 'pending', franchiseId: { $in: [scope.franchiseId, null] } },
    {
      $set: { status: 'approved', franchiseId: scope.franchiseId, approvedBy: historyEntry(user, scope).byUserId, approvedAt: now, rejectionReason: null, rejectedAt: null, rejectedBy: null },
      $push: { approvalHistory: historyEntry(user, scope, 'approved') },
    },
  );
  if (res.modifiedCount !== 1) throw conflict('This delivery partner was just approved by someone else.');
  // the existing approval path: welcome notification to the rider and the referral credit
  await approveDeliveryPartner(String(rider._id));
  return franchiseRiderDetails(scope, rider._id);
}

/** Reject a pending rider; the reason is required and sent to the rider. */
export async function rejectRider(scope, user, riderId, reason) {
  const why = String(reason || '').trim();
  if (!why) throw new ValidationError('Give a reason for the rejection; the rider sees it.');
  const rider = await findManaged(scope.franchiseId, riderId, 'status');
  if (rider.status !== 'pending') throw conflict(`Only a pending signup can be rejected; this delivery partner is ${rider.status}. Suspend it instead.`);
  const res = await FoodDeliveryPartner.updateOne(
    { _id: rider._id, status: 'pending' },
    { $set: { rejectedBy: historyEntry(user, scope).byUserId }, $push: { approvalHistory: historyEntry(user, scope, 'rejected', why.slice(0, 500)) } },
  );
  if (res.modifiedCount !== 1) throw conflict('This delivery partner changed meanwhile. Refresh and try again.');
  // the existing rejection path: status, reason, rejectedAt, and the notification to the rider
  await rejectDeliveryPartner(String(rider._id), why.slice(0, 500));
  return { _id: rider._id, status: 'rejected', rejectionReason: why.slice(0, 500) };
}

/** Suspend an approved rider (they are signed out of the app at once: a non-approved token is refused). */
export async function suspendRider(scope, user, riderId, reason = '') {
  const rider = await findManaged(scope.franchiseId, riderId, 'status');
  if (rider.status !== 'approved') throw conflict(`Only an approved delivery partner can be suspended; this one is ${rider.status}.`);
  const why = String(reason || '').trim().slice(0, 500);
  const res = await FoodDeliveryPartner.updateOne(
    { _id: rider._id, status: 'approved' },
    {
      $set: { status: 'suspended', availabilityStatus: 'offline', suspendedAt: new Date(), suspendedBy: historyEntry(user, scope).byUserId, suspensionReason: why },
      $push: { approvalHistory: historyEntry(user, scope, 'suspended', why) },
    },
  );
  if (res.modifiedCount !== 1) throw conflict('This delivery partner changed meanwhile. Refresh and try again.');
  return franchiseRiderDetails(scope, rider._id);
}

/** Activate a suspended rider again. */
export async function activateRider(scope, user, riderId) {
  const rider = await findManaged(scope.franchiseId, riderId, 'status');
  if (rider.status !== 'suspended') throw conflict(`Only a suspended delivery partner can be activated; this one is ${rider.status}.`);
  const res = await FoodDeliveryPartner.updateOne(
    { _id: rider._id, status: 'suspended' },
    { $set: { status: 'approved', suspendedAt: null, suspendedBy: null, suspensionReason: '' }, $push: { approvalHistory: historyEntry(user, scope, 'activated') } },
  );
  if (res.modifiedCount !== 1) throw conflict('This delivery partner changed meanwhile. Refresh and try again.');
  return franchiseRiderDetails(scope, rider._id);
}

export const superAdminReadOnly = () => {
  throw new ForbiddenError('Delivery partners are approved, rejected and suspended by the franchise admin. The super admin can view them only.');
};
