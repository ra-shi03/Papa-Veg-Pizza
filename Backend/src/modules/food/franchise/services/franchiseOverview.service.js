import { FoodStore } from '../../store/models/store.model.js';
import { StoreIngredient } from '../../store/models/storeIngredient.model.js';
import { InventoryAlert } from '../../store/models/inventoryAlert.model.js';
import { IngredientShortage } from '../../store/models/ingredientShortage.model.js';
import { DeliveryIssue } from '../../store/models/deliveryIssue.model.js';
import { KitchenIssue } from '../../store/models/kitchenIssue.model.js';
import { FoodOrder } from '../../orders/models/order.model.js';
import { User } from '../../../../core/users/models/user.model.js';
import { storeManagerUserIds } from '../../../../core/notifications/firebase.service.js';
import { notifyUsers } from '../../store/services/kitchenTasks.service.js';
import { stockStatus } from '../../store/services/inventory.service.js';
import { ForbiddenError, NotFoundError, ValidationError } from '../../../../core/auth/errors.js';
import { conflict } from '../../store/services/attendanceAccess.js';
import { isId, toId } from '../../dashboard/services/dashboardAccess.js';

// What the franchise admin sees across ALL of its stores: stock, low-stock alerts, restock requests, customers, reviews
// and order issues. Everything is read-only except the answer to a restock request; stock itself is only changed by the
// store. The franchise always comes from the token; ?storeId narrows to one of its own stores (another one is 404).

const role = (u) => String(u?.role || '').trim().replace(/-/g, '_').toUpperCase();
const round = (n) => Math.round((Number(n) || 0) * 100) / 100;
const CANCELLED = ['cancelled_by_user', 'cancelled_by_store', 'cancelled_by_admin'];
const LIMIT = 500;

async function scope(user, query = {}) {
  if (role(user) !== 'FRANCHISE_ADMIN') throw new ForbiddenError('Only a franchise admin can see this.');
  if (!isId(user.franchiseId)) throw new ForbiddenError('No franchise is linked to your account.');
  const stores = await FoodStore.find({ franchiseId: toId(user.franchiseId) }).select('storeName').sort({ storeName: 1 }).lean();
  let picked = stores;
  if (query.storeId && query.storeId !== 'all') {
    picked = stores.filter((s) => String(s._id) === String(query.storeId));
    if (!picked.length) throw new NotFoundError('Store not found');
  }
  const names = new Map(stores.map((s) => [String(s._id), s.storeName || 'Store']));
  return {
    ids: picked.map((s) => s._id),
    nameOf: (id) => names.get(String(id)) || '',
    stores: stores.map((s) => ({ _id: String(s._id), storeName: s.storeName || 'Store' })),
  };
}

export async function stock(user, query = {}) {
  const s = await scope(user, query);
  const rows = (await StoreIngredient.find({ storeId: { $in: s.ids } }).sort({ ingredientName: 1 }).lean()).map((i) => ({
    _id: String(i._id), storeId: String(i.storeId), storeName: s.nameOf(i.storeId), ingredientName: i.ingredientName,
    category: i.category, unit: i.unit, currentStock: round(i.currentStock), reorderLevel: i.reorderLevel, minimumStock: i.minimumStock,
    costPerUnit: i.costPerUnit, supplierName: i.supplierName, updatedAt: i.updatedAt,
    // a store that never counted an ingredient has no stock figure yet: not "out of stock"
    status: i.tracked ? stockStatus(i) : 'not_counted',
  }));
  return { stores: s.stores, rows };
}

export async function alerts(user, query = {}) {
  const s = await scope(user, query);
  const filter = { storeId: { $in: s.ids } };
  if (['active', 'resolved'].includes(query.status)) filter.status = query.status;
  const rows = (await InventoryAlert.find(filter).sort({ createdAt: -1 }).limit(LIMIT).lean()).map((a) => ({
    _id: String(a._id), storeName: s.nameOf(a.storeId), ingredientName: a.ingredientName, currentStock: round(a.currentStock),
    minimumStock: a.minimumStock, severity: a.severity, status: a.status, createdAt: a.createdAt, resolvedBy: a.resolvedBy,
  }));
  return { stores: s.stores, rows };
}

// A restock request is a shortage the store sent to the franchise ("admin_notified" on its timeline)
const ASKED = { 'timeline.action': 'admin_notified' };
const requestStatus = (r) => r.franchiseDecision || (r.status === 'resolved' ? 'closed' : 'pending');
const toRequest = (r, s, units) => ({
  _id: String(r._id), storeId: String(r.storeId), storeName: s.nameOf(r.storeId), ingredientName: r.ingredientName,
  quantity: r.shortageQty, unit: units.get(String(r.ingredientId)) || '', severity: r.severity, requestedBy: r.createdBy,
  message: [...(r.timeline || [])].reverse().find((t) => t.action === 'admin_notified')?.remarks.replace(/^[\w ]+\([\w ]+\): /, '') || '', createdAt: r.createdAt,
  status: requestStatus(r), note: r.franchiseNote || '', decidedBy: r.franchiseDecidedBy || '', decidedAt: r.franchiseDecidedAt,
});

export async function restockRequests(user, query = {}) {
  const s = await scope(user, query);
  const docs = await IngredientShortage.find({ storeId: { $in: s.ids }, ...ASKED }).sort({ createdAt: -1 }).limit(LIMIT).lean();
  const units = new Map((await StoreIngredient.find({ _id: { $in: docs.map((d) => d.ingredientId) } }).select('unit').lean()).map((i) => [String(i._id), i.unit]));
  let rows = docs.map((d) => toRequest(d, s, units));
  if (query.status && query.status !== 'all') rows = rows.filter((r) => r.status === query.status);
  return { stores: s.stores, rows };
}

export async function decideRestock(user, id, body = {}) {
  const s = await scope(user);
  const decision = String(body.decision || '');
  const note = String(body.note || '').trim().slice(0, 300);
  if (!['approved', 'rejected'].includes(decision)) throw new ValidationError('Approve or reject the request.');
  if (decision === 'rejected' && note.length < 5) throw new ValidationError('Give a reason for the rejection; the store sees it.');
  if (!isId(id)) throw new NotFoundError('Restock request not found');
  const own = { _id: toId(id), storeId: { $in: s.ids }, ...ASKED };
  const admin = await User.findById(user.userId).select('name').lean();
  const name = admin?.name || 'Franchise admin';
  const patch = { franchiseDecision: decision, franchiseNote: note, franchiseDecidedBy: name, franchiseDecidedAt: new Date() };
  // a rejected request is closed; an approved one stays open until the stock arrives and the store books it in
  if (decision === 'rejected') Object.assign(patch, { status: 'resolved', resolvedBy: name, resolvedAt: new Date(), resolutionNote: note, actionTaken: 'Rejected by the franchise' });
  const doc = await IngredientShortage.findOneAndUpdate(
    { ...own, status: 'active', franchiseDecision: { $in: ['', null] } },
    { $set: patch, $push: { timeline: { user: name, action: `franchise_${decision}`, remarks: note, createdAt: new Date() } } },
    { returnDocument: 'after' },
  ).lean();
  if (!doc) {
    if (await IngredientShortage.exists(own)) throw conflict('This request is already answered or closed.');
    throw new NotFoundError('Restock request not found');
  }
  await notifyUsers({
    userIds: await storeManagerUserIds(String(doc.storeId)), storeId: doc.storeId, type: 'task_assigned',
    title: `Restock ${decision}: ${doc.ingredientName}`,
    message: decision === 'approved' ? `The franchise approved your request.${note ? ` ${note}` : ''}` : `The franchise rejected your request: ${note}`,
  });
  return toRequest(doc, s, new Map());
}

export async function customers(user, query = {}) {
  const s = await scope(user, query);
  const grouped = await FoodOrder.aggregate([
    { $match: { storeId: { $in: s.ids }, userId: { $ne: null } } },
    { $sort: { createdAt: -1 } },
    { $group: {
      _id: '$userId', totalOrders: { $sum: 1 }, lastOrderDate: { $first: '$createdAt' }, lastStoreId: { $first: '$storeId' },
      name: { $first: '$customerName' }, phone: { $first: '$customerPhone' },
      totalSpent: { $sum: { $cond: [{ $in: ['$orderStatus', CANCELLED] }, 0, { $ifNull: ['$pricing.total', 0] }] } },
    } },
    { $sort: { lastOrderDate: -1 } },
    { $limit: LIMIT },
  ]);
  const users = new Map((await User.find({ _id: { $in: grouped.map((g) => g._id) } }).select('name phone mobile email').lean()).map((u) => [String(u._id), u]));
  const search = String(query.search || '').trim().toLowerCase();
  let rows = grouped.map((g) => {
    const u = users.get(String(g._id)) || {};
    return {
      _id: String(g._id), name: u.name || g.name || 'Customer', phone: u.phone || u.mobile || g.phone || '', email: u.email || '',
      totalOrders: g.totalOrders, totalSpent: round(g.totalSpent), lastOrderDate: g.lastOrderDate, storeName: s.nameOf(g.lastStoreId),
    };
  });
  if (search) rows = rows.filter((r) => [r.name, r.phone, r.email].some((v) => String(v).toLowerCase().includes(search)));
  return { stores: s.stores, rows };
}

export async function reviews(user, query = {}) {
  const s = await scope(user, query);
  const docs = await FoodOrder.find({ storeId: { $in: s.ids }, 'ratings.store.rating': { $gte: 1 } })
    .select('order_id storeId customerName ratings.store ratings.storeReply createdAt').sort({ 'ratings.store.ratedAt': -1, createdAt: -1 }).limit(LIMIT).lean();
  const rows = docs.map((o) => ({
    _id: String(o._id), orderNumber: o.order_id || String(o._id), storeName: s.nameOf(o.storeId), customerName: o.customerName || 'Customer',
    rating: o.ratings.store.rating, comment: o.ratings.store.comment || '', reply: o.ratings.storeReply?.text || '',
    createdAt: o.ratings.store.ratedAt || o.createdAt,
  }));
  const average = rows.length ? Math.round((rows.reduce((n, r) => n + r.rating, 0) / rows.length) * 10) / 10 : 0;
  return { stores: s.stores, rows, average };
}

/** Delivery issues the store managers logged and kitchen issues the stations reported, newest first. */
export async function orderIssues(user, query = {}) {
  const s = await scope(user, query);
  const [delivery, kitchen] = await Promise.all([
    DeliveryIssue.find({ storeId: { $in: s.ids } }).sort({ createdAt: -1 }).limit(LIMIT).lean(),
    KitchenIssue.find({ storeId: { $in: s.ids } }).sort({ createdAt: -1 }).limit(LIMIT).lean(),
  ]);
  const orders = await FoodOrder.find({ _id: { $in: kitchen.map((k) => k.orderId).filter(Boolean) } }).select('order_id').lean();
  const refs = new Map(orders.map((o) => [String(o._id), o.order_id]));
  let rows = [
    ...delivery.map((d) => ({
      _id: String(d._id), source: 'delivery', storeName: s.nameOf(d.storeId), orderNumber: d.orderRef, issueType: d.issueType,
      severity: d.severity, status: d.status, description: d.description, image: d.imageUrl || '', resolution: d.resolution, createdAt: d.createdAt,
    })),
    ...kitchen.map((k) => ({
      _id: String(k._id), source: 'kitchen', storeName: s.nameOf(k.storeId), orderNumber: refs.get(String(k.orderId)) || '', issueType: k.issueType,
      severity: String(k.severity).toLowerCase(), status: 'reported', description: k.remarks, image: k.image || '', resolution: '', createdAt: k.createdAt,
    })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (['delivery', 'kitchen'].includes(query.source)) rows = rows.filter((r) => r.source === query.source);
  return { stores: s.stores, rows };
}
