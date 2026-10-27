import { FoodOrder } from '../../orders/models/order.model.js';
import { FoodSupportTicket } from '../../user/models/supportTicket.model.js';
import { FoodDeliveryPartner } from '../../delivery/models/deliveryPartner.model.js';
import { StoreManager } from '../../franchise/models/storeManager.model.js';
import { StoreIngredient } from '../../store/models/storeIngredient.model.js';
import { InventoryAlert } from '../../store/models/inventoryAlert.model.js';
import { StockTransaction } from '../../store/models/stockTransaction.model.js';
import { KitchenItem } from '../../store/models/kitchenItem.model.js';
import { KitchenOven } from '../../store/models/kitchenOven.model.js';
import { User } from '../../../../core/users/models/user.model.js';
import { storeScope, startOfDay, daysAgo, hourLabel, ago, round1, round2, CANCELLED, SALE } from './dashboardAccess.js';

// Store manager dashboard (/v1/store/dashboard/*). Every widget is computed from live data of ONE store, chosen by
// storeScope() from the token. Shapes are exactly what the widgets render (see the dashboard components).

const ACTIVE = ['created', 'confirmed', 'preparing', 'ready_for_pickup', 'reached_pickup'];
const OUT = ['picked_up', 'reached_drop'];
const DELIVERY_LATE_MIN = 40; // out for delivery longer than this counts as a delayed delivery

const minutesBetween = (a, b) => (new Date(b).getTime() - new Date(a).getTime()) / 60000;
const historyAt = (o, to) => (o.statusHistory || []).find((h) => h.to === to)?.at;

// ---- KPI cards --------------------------------------------------------------------------------

async function salesBetween(storeId, from, to) {
  const [r] = await FoodOrder.aggregate([
    { $match: { storeId, createdAt: { $gte: from, $lt: to }, ...SALE } },
    { $group: { _id: null, total: { $sum: { $ifNull: ['$pricing.total', 0] } } } },
  ]);
  return r?.total || 0;
}

export async function todaySales(user, q) {
  const store = await storeScope(user, q, 'today-sales');
  const today = startOfDay();
  const [now, yesterday] = await Promise.all([salesBetween(store._id, today, new Date()), salesBetween(store._id, daysAgo(1), today)]);
  return { todaySales: round2(now), percentageChange: yesterday > 0 ? Math.round(((now - yesterday) / yesterday) * 100) : 0 };
}

export async function todayOrders(user, q) {
  const store = await storeScope(user, q, 'today-orders');
  return { totalOrders: await FoodOrder.countDocuments({ storeId: store._id, createdAt: { $gte: startOfDay() } }) };
}

export async function activeOrders(user, q) {
  const store = await storeScope(user, q, 'active-orders');
  return { activeOrders: await FoodOrder.countDocuments({ storeId: store._id, orderStatus: { $in: ACTIVE } }) };
}

/** Average minutes from the kitchen accepting an order to it being ready, for orders that became ready today. */
async function avgPrepMinutes(storeId) {
  const [r] = await FoodOrder.aggregate([
    { $match: { storeId, 'kitchen.readyAt': { $gte: startOfDay() }, 'kitchen.acceptedAt': { $ne: null } } },
    { $project: { m: { $divide: [{ $subtract: ['$kitchen.readyAt', '$kitchen.acceptedAt'] }, 60000] } } },
    { $match: { m: { $gte: 0 } } },
    { $group: { _id: null, avg: { $avg: '$m' } } },
  ]);
  return r ? Math.round(r.avg) : 0;
}

export async function prepTime(user, q) {
  const store = await storeScope(user, q, 'prep-time');
  return { avgPrepTime: await avgPrepMinutes(store._id) };
}

export async function pendingDeliveries(user, q) {
  const store = await storeScope(user, q, 'pending-deliveries');
  return { pendingDeliveries: await FoodOrder.countDocuments({ storeId: store._id, orderStatus: { $in: ['ready_for_pickup', 'reached_pickup', ...OUT] } }) };
}

const lowStockFilter = (storeId) => ({ storeId, tracked: true, $expr: { $lte: ['$currentStock', '$reorderLevel'] } });

export async function lowStock(user, q) {
  const store = await storeScope(user, q, 'low-stock');
  return { lowStockItems: await StoreIngredient.countDocuments(lowStockFilter(store._id)) };
}

// No attendance module yet: "on duty" is the store's active staff (people on leave / suspended are not).
const staffOf = (storeId) => StoreManager.find({ storeId: String(storeId), userId: { $ne: null }, status: { $ne: 'DELETED' } }).select('status role').lean();

export async function staffDuty(user, q) {
  const store = await storeScope(user, q, 'staff-duty');
  return { staffOnDuty: (await staffOf(store._id)).filter((s) => s.status === 'Active').length };
}

export async function customerRating(user, q) {
  const store = await storeScope(user, q, 'customer-rating');
  const [r] = await FoodOrder.aggregate([
    { $match: { storeId: store._id, 'ratings.store.rating': { $gte: 1 }, 'ratings.store.ratedAt': { $gte: daysAgo(29) } } },
    { $group: { _id: null, avg: { $avg: '$ratings.store.rating' } } },
  ]);
  return { rating: r ? round1(r.avg) : 0 };
}

// ---- Charts and lists -------------------------------------------------------------------------

/** ?filter=daily (today by hour) | weekly (last 7 days) | monthly (last 6 months) -> [{ hour, sales }] */
export async function hourlySales(user, q) {
  const store = await storeScope(user, q, 'hourly-sales');
  const filter = ['weekly', 'monthly'].includes(q.filter) ? q.filter : 'daily';
  if (filter === 'daily') {
    const rows = await FoodOrder.aggregate([
      { $match: { storeId: store._id, createdAt: { $gte: startOfDay() }, ...SALE } },
      { $project: { h: { $hour: { date: '$createdAt', timezone: tz() } }, t: { $ifNull: ['$pricing.total', 0] } } },
      { $group: { _id: '$h', sales: { $sum: '$t' } } },
    ]);
    const byHour = new Map(rows.map((r) => [r._id, r.sales]));
    const hours = rows.length ? [Math.min(10, ...rows.map((r) => r._id)), Math.max(23, ...rows.map((r) => r._id))] : [10, 23];
    return Array.from({ length: hours[1] - hours[0] + 1 }, (_, i) => hours[0] + i).map((h) => ({ hour: hourLabel(h), sales: round2(byHour.get(h) || 0) }));
  }
  if (filter === 'weekly') {
    const rows = await FoodOrder.aggregate([
      { $match: { storeId: store._id, createdAt: { $gte: daysAgo(6) }, ...SALE } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: tz() } }, sales: { $sum: { $ifNull: ['$pricing.total', 0] } } } },
    ]);
    const byDay = new Map(rows.map((r) => [r._id, r.sales]));
    return Array.from({ length: 7 }, (_, i) => daysAgo(6 - i)).map((d) => ({ hour: d.toLocaleDateString('en-US', { weekday: 'short' }), sales: round2(byDay.get(isoDay(d)) || 0) }));
  }
  const from = new Date(); from.setMonth(from.getMonth() - 5, 1); from.setHours(0, 0, 0, 0);
  const rows = await FoodOrder.aggregate([
    { $match: { storeId: store._id, createdAt: { $gte: from }, ...SALE } },
    { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt', timezone: tz() } }, sales: { $sum: { $ifNull: ['$pricing.total', 0] } } } },
  ]);
  const byMonth = new Map(rows.map((r) => [r._id, r.sales]));
  return Array.from({ length: 6 }, (_, i) => { const d = new Date(from); d.setMonth(from.getMonth() + i); return d; })
    .map((d) => ({ hour: d.toLocaleDateString('en-US', { month: 'short' }), sales: round2(byMonth.get(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`) || 0) }));
}

const tz = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
const isoDay = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Today's orders by where they are: incoming / preparing / baking / packaging / ready / delivered / cancelled. */
export async function orderStatus(user, q) {
  const store = await storeScope(user, q, 'order-status');
  const rows = await FoodOrder.aggregate([
    { $match: { storeId: store._id, createdAt: { $gte: startOfDay() } } },
    { $group: { _id: { s: '$orderStatus', k: '$kitchen.stage' }, n: { $sum: 1 } } },
  ]);
  const out = { incoming: 0, preparing: 0, baking: 0, packaging: 0, ready: 0, delivered: 0, cancelled: 0 };
  for (const { _id: { s, k }, n } of rows) {
    if (s === 'created') out.incoming += n;
    else if (s === 'confirmed') out.preparing += n;
    else if (s === 'preparing') out[k === 'baking' ? 'baking' : k === 'packaging' ? 'packaging' : 'preparing'] += n;
    else if (s === 'ready_for_pickup' || s === 'reached_pickup' || OUT.includes(s)) out.ready += n; // left the kitchen (incl. with the rider)
    else if (s === 'delivered') out.delivered += n;
    else if (CANCELLED.includes(s)) out.cancelled += n;
  }
  return out;
}

/** Pizzas sold in the last 30 days (top 5 by quantity). */
export async function topProducts(user, q) {
  const store = await storeScope(user, q, 'top-products');
  const rows = await FoodOrder.aggregate([
    { $match: { storeId: store._id, createdAt: { $gte: daysAgo(29) }, ...SALE } },
    { $unwind: '$items' },
    { $match: { 'items.isLimitedOffer': { $ne: true } } },
    { $group: { _id: '$items.name', sold: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
    { $sort: { sold: -1, revenue: -1 } },
    { $limit: 5 },
  ]);
  return rows.map((r) => ({ productName: r._id, sold: r.sold, revenue: round2(r.revenue) }));
}

/** Orders on the floor right now, by column. */
export async function liveOrders(user, q) {
  const store = await storeScope(user, q, 'live-orders');
  const orders = await FoodOrder.find({ storeId: store._id, orderStatus: { $in: [...ACTIVE, ...OUT] } })
    .select('order_id customerName pricing.total orderStatus kitchen.expectedReadyAt createdAt').sort({ createdAt: 1 }).limit(200).lean();
  const out = { incoming: [], preparing: [], ready: [], delivery: [] };
  for (const o of orders) {
    const col = o.orderStatus === 'created' ? 'incoming' : ['confirmed', 'preparing'].includes(o.orderStatus) ? 'preparing' : OUT.includes(o.orderStatus) ? 'delivery' : 'ready';
    const left = o.kitchen?.expectedReadyAt ? Math.max(0, Math.round(minutesBetween(new Date(), o.kitchen.expectedReadyAt))) : 0;
    out[col].push({
      orderNumber: o.order_id || String(o._id), customer: o.customerName || 'Customer', amount: round2(o.pricing?.total),
      eta: `${col === 'ready' ? 0 : left}m`, status: { incoming: 'Incoming', preparing: 'Preparing', ready: 'Ready', delivery: 'Out For Delivery' }[col],
    });
  }
  return out;
}

/** Kitchen load: average prep time, delayed orders, and how busy each station is (0-100). */
export async function kitchenPerformance(user, q) {
  const store = await storeScope(user, q, 'kitchen-performance');
  const [avg, delayed, staff, items, ovens, packing] = await Promise.all([
    avgPrepMinutes(store._id),
    FoodOrder.countDocuments({ storeId: store._id, orderStatus: { $in: ['confirmed', 'preparing'] }, 'kitchen.expectedReadyAt': { $lt: new Date() }, 'kitchen.delayResolvedAt': null }),
    staffOf(store._id),
    KitchenItem.find({ storeId: store._id, rejected: false, stage: { $in: ['dough_prep', 'sauce', 'toppings', 'baking'] }, paused: false }).select('stage ovenId').lean(),
    KitchenOven.find({ storeId: store._id, state: 'active' }).select('_id').lean(),
    FoodOrder.countDocuments({ storeId: store._id, orderStatus: 'preparing', 'kitchen.packaging.status': { $in: ['packaging_started', 'quality_checked'] } }),
  ]);
  const titles = staff.filter((s) => s.status === 'Active').map((s) => String(s.role || '').toLowerCase());
  const chefs = titles.filter((t) => !/supervisor|manager|bak|packag/.test(t)).length;
  const packers = titles.filter((t) => /packag/.test(t)).length;
  const pct = (busy, capacity) => (capacity > 0 ? Math.min(100, Math.round((busy / capacity) * 100)) : 0);
  const baking = items.filter((i) => i.stage === 'baking');
  return {
    avgPrepTime: avg,
    delayedOrders: delayed,
    pizzaStation: pct(items.length - baking.length, chefs * 2),        // two pizzas in hand per chef = full
    bakingStation: pct(new Set(baking.map((b) => String(b.ovenId))).size, ovens.length),
    packagingStation: pct(packing, packers),
  };
}

/** Riders: free online riders (the fleet is shared), riders on this store's orders, and late deliveries. */
export async function deliveryOverview(user, q) {
  const store = await storeScope(user, q, 'delivery-overview');
  const [onOrders, allBusy, out] = await Promise.all([
    FoodOrder.distinct('dispatch.deliveryPartnerId', { storeId: store._id, orderStatus: { $in: ['ready_for_pickup', 'reached_pickup', ...OUT] }, 'dispatch.deliveryPartnerId': { $ne: null } }),
    FoodOrder.distinct('dispatch.deliveryPartnerId', { orderStatus: { $in: ['ready_for_pickup', 'reached_pickup', ...OUT] }, 'dispatch.deliveryPartnerId': { $ne: null } }),
    FoodOrder.find({ storeId: store._id, orderStatus: { $in: OUT } }).select('statusHistory updatedAt').lean(),
  ]);
  const available = await FoodDeliveryPartner.countDocuments({ status: 'approved', availabilityStatus: 'online', _id: { $nin: allBusy } });
  const late = out.filter((o) => minutesBetween(historyAt(o, 'picked_up') || o.updatedAt, new Date()) > DELIVERY_LATE_MIN).length;
  return { availableRiders: available, assignedRiders: onOrders.length, delayedDeliveries: late };
}

const SEVERITY_LABEL = { critical: 'Critical', high: 'Warning', medium: 'Normal', low: 'Normal' };

export async function inventoryAlerts(user, q) {
  const store = await storeScope(user, q, 'inventory-alerts');
  const alerts = await InventoryAlert.find({ storeId: store._id, status: 'active' }).sort({ severity: 1, createdAt: -1 }).limit(20).lean();
  const ings = await StoreIngredient.find({ _id: { $in: alerts.map((a) => a.ingredientId) } }).select('unit reorderLevel supplierName').lean();
  const byId = new Map(ings.map((i) => [String(i._id), i]));
  const order = { critical: 0, high: 1, medium: 2, low: 3 };
  return {
    lowStock: alerts.sort((a, b) => order[a.severity] - order[b.severity]).map((a) => {
      const i = byId.get(String(a.ingredientId)) || {};
      return { ingredient: a.ingredientName, availableQty: round2(a.currentStock), minQty: a.minimumStock, reorderLevel: i.reorderLevel || 0, unit: i.unit || '', supplier: i.supplierName || '', severity: SEVERITY_LABEL[a.severity] || 'Normal' };
    }),
  };
}

/** No attendance module yet: present = active staff, absent = on leave, late is not tracked (0). */
export async function staffOverview(user, q) {
  const store = await storeScope(user, q, 'staff-overview');
  const staff = await staffOf(store._id);
  return { present: staff.filter((s) => s.status === 'Active').length, late: 0, absent: staff.filter((s) => s.status === 'On Leave').length };
}

const TICKET_STATUS = { open: 'Open', 'in-progress': 'In Progress', resolved: 'Resolved' };
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

export async function recentComplaints(user, q) {
  const store = await storeScope(user, q, 'recent-complaints');
  const tickets = await FoodSupportTicket.find({ storeId: store._id }).sort({ createdAt: -1 }).limit(10).lean();
  const [orders, users] = await Promise.all([
    FoodOrder.find({ _id: { $in: tickets.map((t) => t.orderId).filter(Boolean) } }).select('order_id customerName customerPhone').lean(),
    User.find({ _id: { $in: tickets.map((t) => t.userId) } }).select('mobile').lean(),
  ]);
  const orderById = new Map(orders.map((o) => [String(o._id), o]));
  const userById = new Map(users.map((u) => [String(u._id), u]));
  return tickets.map((t) => {
    const o = orderById.get(String(t.orderId)) || {};
    return {
      orderNumber: o.order_id || '', customer: o.customerName || 'Customer', issueType: t.issueType, priority: cap(t.priority || 'medium'),
      status: TICKET_STATUS[t.status] || 'Open', phone: userById.get(String(t.userId))?.mobile || o.customerPhone || '', time: ago(t.createdAt),
    };
  });
}

/** The latest things that happened in the store: order steps, stock changes, new alerts. */
export async function activityLogs(user, q) {
  const store = await storeScope(user, q, 'activity-logs');
  const since = daysAgo(1);
  const [orders, txns, alerts] = await Promise.all([
    FoodOrder.find({ storeId: store._id, updatedAt: { $gte: since } }).select('order_id statusHistory').sort({ updatedAt: -1 }).limit(50).lean(),
    StockTransaction.find({ storeId: store._id, createdAt: { $gte: since } }).sort({ createdAt: -1 }).limit(20).lean(),
    InventoryAlert.find({ storeId: store._id, createdAt: { $gte: since } }).sort({ createdAt: -1 }).limit(10).lean(),
  ]);
  const role = (r) => ({ STORE_MANAGER: 'Manager', KITCHEN_SUPERVISOR: 'Supervisor', KITCHEN_STAFF: 'Kitchen', DELIVERY_PARTNER: 'Rider', SYSTEM: 'System', USER: 'Customer' }[String(r || '').toUpperCase()] || 'System');
  const events = [];
  for (const o of orders) {
    for (const h of o.statusHistory || []) {
      if (h.at < since) continue;
      const kitchen = /Kitchen stage|assigned as|supervisor/i.test(h.note || '');
      const delivery = ['picked_up', 'reached_drop', 'delivered', 'reached_pickup'].includes(h.to);
      events.push({ at: h.at, action: `Order ${o.order_id || o._id}: ${h.note || h.to.replace(/_/g, ' ')}`, user: role(h.byRole), type: delivery ? 'delivery' : kitchen ? 'kitchen' : 'order' });
    }
  }
  for (const t of txns) events.push({ at: t.createdAt, action: `${t.type.replace('_', ' ')} ${t.quantity}: ${t.reason}`.trim(), user: t.createdBy || 'Staff', type: 'inventory' });
  for (const a of alerts) events.push({ at: a.createdAt, action: `Low stock alert: ${a.ingredientName}`, user: 'System', type: 'inventory' });
  return events.sort((a, b) => b.at - a.at).slice(0, 20).map((e, i) => ({ id: i + 1, action: e.action, user: e.user, type: e.type, timestamp: ago(e.at) }));
}
