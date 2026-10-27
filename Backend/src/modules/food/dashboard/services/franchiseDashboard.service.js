import { FoodOrder } from '../../orders/models/order.model.js';
import { FoodDeliveryPartner } from '../../delivery/models/deliveryPartner.model.js';
import { InventoryAlert } from '../../store/models/inventoryAlert.model.js';
import { StoreIngredient } from '../../store/models/storeIngredient.model.js';
import { Refund } from '../../../../core/payments/models/refund.model.js';
import { adminScope, periodOf, startOfDay, daysAgo, hourLabel, round1, round2, CANCELLED, SALE } from './dashboardAccess.js';

// Franchise admin dashboard (/v1/admin/dashboard/*). A franchise admin sees its own franchise (optionally one of its
// stores with ?storeId); a super admin sees everything (optionally ?franchiseId / ?storeId). Period: ?date=today
// (default) | yesterday | week | month | custom&start&end.

const LIVE = ['created', 'confirmed', 'preparing', 'ready_for_pickup', 'reached_pickup', 'picked_up', 'reached_drop'];
const tz = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
const minutes = (a, b) => (new Date(b).getTime() - new Date(a).getTime()) / 60000;
const historyAt = (o, to) => (o.statusHistory || []).find((h) => h.to === to)?.at;

/** Riders on the scope's live orders (the fleet is shared, so "active" means working for these stores now). */
const ridersOnOrders = (match) => FoodOrder.distinct('dispatch.deliveryPartnerId', { ...match, orderStatus: { $in: LIVE }, 'dispatch.deliveryPartnerId': { $ne: null } });

async function salesSummary(match, from, to) {
  const [r] = await FoodOrder.aggregate([
    { $match: { ...match, createdAt: { $gte: from, $lte: to }, ...SALE } },
    { $group: { _id: null, revenue: { $sum: { $ifNull: ['$pricing.total', 0] } }, orders: { $sum: 1 } } },
  ]);
  return { revenue: r?.revenue || 0, orders: r?.orders || 0 };
}

async function avgRating(match, from) {
  const [r] = await FoodOrder.aggregate([
    { $match: { ...match, 'ratings.store.rating': { $gte: 1 }, ...(from ? { 'ratings.store.ratedAt': { $gte: from } } : {}) } },
    { $group: { _id: null, avg: { $avg: '$ratings.store.rating' } } },
  ]);
  return r ? round1(r.avg) : 0;
}

export async function summary(user, q) {
  const scope = await adminScope(user, q);
  const { from, to } = periodOf(q);
  const [sales, riders, refunds, lowStock, rating] = await Promise.all([
    salesSummary(scope.match, from, to),
    ridersOnOrders(scope.match),
    FoodOrder.distinct('_id', scope.match).then((ids) => Refund.countDocuments({ orderId: { $in: ids }, status: { $in: ['pending', 'processing'] } })),
    InventoryAlert.countDocuments({ storeId: { $in: scope.storeIds }, status: 'active' }),
    avgRating(scope.match, daysAgo(29)),
  ]);
  return {
    revenue: round2(sales.revenue),
    orders: sales.orders,
    activeStores: scope.stores.filter((s) => s.approvalStatus === 'Approved' && s.isActive !== false).length,
    activeRiders: riders.length,
    refunds,
    lowStock,
    avgOrderValue: sales.orders ? Math.round(sales.revenue / sales.orders) : 0,
    customerSatisfaction: rating,
  };
}

/** Revenue per day across the period (at least the last 7 days). */
export async function revenue(user, q) {
  const scope = await adminScope(user, q);
  const period = periodOf(q);
  const from = period.from < daysAgo(6) ? period.from : daysAgo(6);
  const rows = await FoodOrder.aggregate([
    { $match: { ...scope.match, createdAt: { $gte: from, $lte: period.to }, ...SALE } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: tz() } }, revenue: { $sum: { $ifNull: ['$pricing.total', 0] } } } },
  ]);
  const byDay = new Map(rows.map((r) => [r._id, r.revenue]));
  const days = [];
  for (let d = startOfDay(from); d <= period.to; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) days.push(new Date(d));
  return days.slice(-90).map((d) => ({
    date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    revenue: round2(byDay.get(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`) || 0),
  }));
}

const liveStatus = (o) => {
  if (o.orderStatus === 'created' || o.orderStatus === 'confirmed') return 'confirmed';
  if (o.orderStatus === 'preparing') return o.kitchen?.stage === 'baking' ? 'baking' : o.kitchen?.stage === 'packaging' ? 'packed' : 'preparing';
  if (o.orderStatus === 'ready_for_pickup' || o.orderStatus === 'reached_pickup') return 'packed';
  return 'out_for_delivery';
};

export async function liveOrders(user, q) {
  const scope = await adminScope(user, q);
  const orders = await FoodOrder.find({ ...scope.match, orderStatus: { $in: LIVE } })
    .select('order_id storeId customerName orderStatus kitchen pricing.total items createdAt dispatch.deliveryPartnerId')
    .sort({ createdAt: -1 }).limit(50).lean();
  const names = new Map(scope.stores.map((s) => [String(s._id), s.storeName]));
  const riders = await FoodDeliveryPartner.find({ _id: { $in: orders.map((o) => o.dispatch?.deliveryPartnerId).filter(Boolean) } }).select('name').lean();
  const riderName = new Map(riders.map((r) => [String(r._id), r.name]));
  return orders.map((o) => ({
    id: o.order_id || String(o._id),
    store: names.get(String(o.storeId)) || '',
    customer: o.customerName || 'Customer',
    status: liveStatus(o),
    time: new Date(o.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    amount: round2(o.pricing?.total),
    items: (o.items || []).map((i) => ({ name: i.name, quantity: i.quantity, price: i.price })),
    assignedStaff: {
      chef: o.kitchen?.staff?.pizza_chef?.name || o.kitchen?.supervisor?.name || '',
      rider: riderName.get(String(o.dispatch?.deliveryPartnerId)) || '',
    },
  }));
}

/** Per store: orders and revenue in the period, rating, and how many of its orders were delivered. */
export async function storePerformance(user, q) {
  const scope = await adminScope(user, q);
  const { from, to } = periodOf(q);
  const rows = await FoodOrder.aggregate([
    { $match: { ...scope.match, createdAt: { $gte: from, $lte: to } } },
    {
      $group: {
        _id: '$storeId',
        orders: { $sum: 1 },
        revenue: {
          $sum: {
            $cond: [{
              $and: [
                { $not: [{ $in: ['$orderStatus', CANCELLED] }] },
                { $or: [{ $in: ['$payment.method', ['cash', 'wallet', 'razorpay_qr']] }, { $in: ['$payment.status', ['paid', 'authorized']] }] },
              ],
            }, { $ifNull: ['$pricing.total', 0] }, 0],
          },
        },
        delivered: { $sum: { $cond: [{ $eq: ['$orderStatus', 'delivered'] }, 1, 0] } },
      },
    },
  ]);
  const ratings = await FoodOrder.aggregate([
    { $match: { ...scope.match, 'ratings.store.rating': { $gte: 1 } } },
    { $group: { _id: '$storeId', avg: { $avg: '$ratings.store.rating' } } },
  ]);
  const byStore = new Map(rows.map((r) => [String(r._id), r]));
  const ratingOf = new Map(ratings.map((r) => [String(r._id), round1(r.avg)]));
  return scope.stores
    .map((s) => {
      const r = byStore.get(String(s._id)) || { orders: 0, revenue: 0, delivered: 0 };
      return { id: String(s._id), name: s.storeName, orders: r.orders, revenue: round2(r.revenue), rating: ratingOf.get(String(s._id)) || 0, completion: r.orders ? Math.round((r.delivered / r.orders) * 100) : 0 };
    })
    .sort((a, b) => b.revenue - a.revenue || b.orders - a.orders);
}

export async function inventoryAlerts(user, q) {
  const scope = await adminScope(user, q);
  const alerts = await InventoryAlert.find({ storeId: { $in: scope.storeIds }, status: 'active' }).sort({ createdAt: -1 }).limit(50).lean();
  const ings = await StoreIngredient.find({ _id: { $in: alerts.map((a) => a.ingredientId) } }).select('unit reorderLevel').lean();
  const ing = new Map(ings.map((i) => [String(i._id), i]));
  const names = new Map(scope.stores.map((s) => [String(s._id), s.storeName]));
  return alerts.map((a) => ({
    id: String(a._id), ingredient: a.ingredientName, store: names.get(String(a.storeId)) || '', currentStock: round2(a.currentStock),
    reorderLevel: ing.get(String(a.ingredientId))?.reorderLevel || 0, unit: ing.get(String(a.ingredientId))?.unit || '', severity: a.severity,
  }));
}

/** Deliveries in the period: count, average minutes from pickup to door, failed after pickup, and per hour. */
export async function deliveryPerformance(user, q) {
  const scope = await adminScope(user, q);
  const { from, to } = periodOf(q);
  const [riders, done] = await Promise.all([
    ridersOnOrders(scope.match),
    FoodOrder.find({ ...scope.match, createdAt: { $gte: from, $lte: to }, orderStatus: { $in: ['delivered', ...CANCELLED] } }).select('orderStatus statusHistory').lean(),
  ]);
  const delivered = done.filter((o) => o.orderStatus === 'delivered');
  const times = delivered.map((o) => [historyAt(o, 'picked_up'), historyAt(o, 'delivered')]).filter(([a, b]) => a && b).map(([a, b]) => minutes(a, b)).filter((m) => m >= 0);
  const failed = done.filter((o) => CANCELLED.includes(o.orderStatus) && historyAt(o, 'picked_up')).length;
  const perHour = new Map();
  for (const o of delivered) {
    const at = historyAt(o, 'delivered');
    if (at) perHour.set(new Date(at).getHours(), (perHour.get(new Date(at).getHours()) || 0) + 1);
  }
  const hours = [...perHour.keys()];
  const range = hours.length ? [Math.min(10, ...hours), Math.max(23, ...hours)] : [10, 23];
  return {
    metrics: {
      activeRiders: riders.length,
      deliveredOrders: delivered.length,
      avgDeliveryTime: times.length ? Math.round(times.reduce((n, m) => n + m, 0) / times.length) : 0,
      failedDeliveries: failed,
    },
    hourlyChart: Array.from({ length: range[1] - range[0] + 1 }, (_, i) => range[0] + i).map((h) => ({ hour: hourLabel(h), deliveries: perHour.get(h) || 0 })),
  };
}

/** New customers (first order in this scope during the period), repeat customers (more than one order here). */
export async function customerActivity(user, q) {
  const scope = await adminScope(user, q);
  const { from, to } = periodOf(q);
  const rows = await FoodOrder.aggregate([
    { $match: scope.match },
    { $group: { _id: '$userId', first: { $min: '$createdAt' }, orders: { $sum: 1 } } },
  ]);
  return {
    newCustomers: rows.filter((r) => r.first >= from && r.first <= to).length,
    repeatCustomers: rows.filter((r) => r.orders > 1).length,
    loyaltyMembers: 0, // rewards are on the deferred list: no loyalty programme data yet
  };
}
