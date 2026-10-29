import mongoose from 'mongoose';
import { FoodStore } from '../../store/models/store.model.js';
import { FoodOrder } from '../../orders/models/order.model.js';
import { FoodDeliveryPartner } from '../../delivery/models/deliveryPartner.model.js';
import { NotFoundError } from '../../../../core/auth/errors.js';
import { riderScope, riderAreaOf } from '../../store/services/storeDelivery.service.js';
import { maskPhone } from '../../store/services/storeCrm.service.js';

// GET /food/admin/delivery/partners for a franchise admin: the riders near, or working for, its own stores, read only.
// Near = the store panel's rule (store/services/nearby.js via riderScope, NEARBY_RADIUS_KM). Working for = riders who
// have an order of this franchise. The franchise comes from the token; ?storeId= narrows to one of its own stores
// (another franchise's store is 404). Only the fields below leave the server: never documents, bank details,
// Aadhaar / PAN, the email, the photo or the full phone.

const FIELDS = 'name phone vehicleType status availabilityStatus city state lastLocationAt rating totalDeliveries createdAt updatedAt';
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
  // riders who deliver this franchise's orders, wherever they are now
  const worked = await FoodOrder.aggregate([
    { $match: { storeId: { $in: stores.map((s) => s._id) }, 'dispatch.deliveryPartnerId': { $ne: null } } },
    { $group: { _id: { r: '$dispatch.deliveryPartnerId', s: '$storeId' } } },
  ]);
  const missing = worked.map((w) => w._id.r).filter((id) => !byRider.has(String(id)));
  if (missing.length) {
    for (const doc of await FoodDeliveryPartner.find({ _id: { $in: missing } }).select(FIELDS).lean()) byRider.set(String(doc._id), { doc, storeIds: new Set() });
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
