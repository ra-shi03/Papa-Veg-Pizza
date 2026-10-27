import { FoodOrder } from '../../orders/models/order.model.js';
import { Product } from '../../admin/models/product.model.js';
import { CategoryProduct } from '../../admin/models/categoryProduct.model.js';
import { FoodDeliveryPartner } from '../../delivery/models/deliveryPartner.model.js';
import { StoreIngredient } from '../../store/models/storeIngredient.model.js';
import { StockTransaction } from '../../store/models/stockTransaction.model.js';
import { InventoryAlert } from '../../store/models/inventoryAlert.model.js';
import { isId, toId, startOfDay, daysAgo, round1, round2, CANCELLED } from '../../dashboard/services/dashboardAccess.js';
import { accessOf, scopedStores, scopedStore, scopedStoreList, rangeOf, storeStatus } from './storeAccess.js';
import { closureCovers, hoursByStore, ymd } from './storeHours.js';

// Store Performance screen (/v1/store-performance/*) and the store list's /v1/stores/:id/performance.
// Franchise admin: its own stores; super admin: all (?franchiseId narrows). Everything is computed from orders,
// kitchen timestamps, ratings and stock movements. Period: ?dateRange=today|last7|last30|custom&startDate&endDate.
//
// performanceScore (0-100) = 40% completion (delivered / finished) + 30% rating + 20% (100 - cancellation %)
// + 10% stock kept out of waste.

const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const PAYMENT = { cash: 'Cash on Delivery', razorpay: 'UPI / Cards (Online)', razorpay_qr: 'UPI QR', wallet: 'Wallet' };
const tz = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
const isAll = (v) => !v || v === 'All' || v === 'all';
const pct = (a, b) => (b ? round1((a / b) * 100) : 0);
const hour12 = (h) => `${((h + 11) % 12) + 1} ${h % 24 < 12 ? 'AM' : 'PM'}`;
const dayKey = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: tz() } };

const SALE = {
  $and: [
    { $not: [{ $in: ['$orderStatus', CANCELLED] }] },
    { $or: [{ $in: ['$payment.method', ['cash', 'wallet', 'razorpay_qr']] }, { $in: ['$payment.status', ['paid', 'authorized']] }] },
  ],
};
const minutesBetween = (a, b) => ({ $cond: [{ $and: [a, b] }, { $divide: [{ $subtract: [b, a] }, 60000] }, null] });
const historyAt = (to) => ({
  $arrayElemAt: [{ $map: { input: { $filter: { input: { $ifNull: ['$statusHistory', []] }, cond: { $eq: ['$$this.to', to] } } }, in: '$$this.at' } }, 0],
});

/** Last n calendar days (oldest first) as Date objects at local midnight. */
const lastDays = (n) => Array.from({ length: n }, (_, i) => daysAgo(n - 1 - i));
const daysIn = (from, to) => {
  const out = [];
  for (let d = startOfDay(from); d <= to; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) out.push(d);
  return out.slice(-90);
};
const dayLabel = (d, many) => (many ? `${String(d.getDate()).padStart(2, '0')} ${MONTH[d.getMonth()]}` : WEEKDAY[d.getDay()]);

// ---------------------------------------------------------------------------------------------
// Aggregations per store
// ---------------------------------------------------------------------------------------------

async function orderStats(storeIds, from, to) {
  const rows = await FoodOrder.aggregate([
    { $match: { storeId: { $in: storeIds }, createdAt: { $gte: from, $lte: to } } },
    {
      $project: {
        storeId: 1, orderStatus: 1, total: { $ifNull: ['$pricing.total', 0] }, sale: SALE,
        prep: minutesBetween('$kitchen.acceptedAt', '$kitchen.readyAt'),
        delivery: { $let: { vars: { p: historyAt('picked_up'), d: historyAt('delivered') }, in: minutesBetween('$$p', '$$d') } },
      },
    },
    {
      $group: {
        _id: '$storeId',
        orders: { $sum: 1 },
        delivered: { $sum: { $cond: [{ $eq: ['$orderStatus', 'delivered'] }, 1, 0] } },
        cancelled: { $sum: { $cond: [{ $in: ['$orderStatus', CANCELLED] }, 1, 0] } },
        revenue: { $sum: { $cond: ['$sale', '$total', 0] } },
        sales: { $sum: { $cond: ['$sale', 1, 0] } },
        prepSum: { $sum: { $ifNull: ['$prep', 0] } },
        prepN: { $sum: { $cond: [{ $ne: ['$prep', null] }, 1, 0] } },
        delSum: { $sum: { $ifNull: ['$delivery', 0] } },
        delN: { $sum: { $cond: [{ $ne: ['$delivery', null] }, 1, 0] } },
      },
    },
  ]);
  return new Map(rows.map((r) => [String(r._id), r]));
}

async function ratingStats(storeIds, from) {
  const rows = await FoodOrder.aggregate([
    { $match: { storeId: { $in: storeIds }, 'ratings.store.rating': { $gte: 1 }, 'ratings.store.ratedAt': { $gte: from } } },
    { $group: { _id: '$storeId', sum: { $sum: '$ratings.store.rating' }, n: { $sum: 1 } } },
  ]);
  return new Map(rows.map((r) => [String(r._id), r]));
}

/** Stock used vs stock wasted (by value, by quantity when no costs are entered), per store. */
async function wasteStats(storeIds, from) {
  const rows = await StockTransaction.aggregate([
    { $match: { storeId: { $in: storeIds }, type: 'stock_out', createdAt: { $gte: from } } },
    { $lookup: { from: StoreIngredient.collection.name, localField: 'ingredientId', foreignField: '_id', as: 'ing' } },
    { $project: { storeId: 1, quantity: 1, waste: { $eq: ['$source', 'waste'] }, value: { $multiply: ['$quantity', { $ifNull: [{ $arrayElemAt: ['$ing.costPerUnit', 0] }, 0] }] } } },
    {
      $group: {
        _id: '$storeId',
        outValue: { $sum: '$value' }, wasteValue: { $sum: { $cond: ['$waste', '$value', 0] } },
        outQty: { $sum: '$quantity' }, wasteQty: { $sum: { $cond: ['$waste', '$quantity', 0] } },
      },
    },
  ]);
  return new Map(rows.map((r) => [String(r._id), r]));
}
const wastePct = (w) => (!w ? 0 : w.outValue > 0 ? pct(w.wasteValue, w.outValue) : pct(w.wasteQty, w.outQty));

function score(s, rating, waste) {
  if (!s.orders && !rating) return 0;
  const finished = s.delivered + s.cancelled;
  const completion = finished ? (s.delivered / finished) * 100 : 0;
  const cancellation = s.orders ? (s.cancelled / s.orders) * 100 : 0;
  return Math.round(0.4 * completion + 0.3 * ((rating || 0) / 5) * 100 + 0.2 * (100 - cancellation) + 0.1 * Math.max(0, 100 - waste * 10));
}

const EMPTY = { orders: 0, delivered: 0, cancelled: 0, revenue: 0, sales: 0, prepSum: 0, prepN: 0, delSum: 0, delN: 0 };

/** One performance row per store in `stores` for the period. */
async function performanceRows(stores, q, fallback = 'last7') {
  const { from, to } = rangeOf(q, fallback);
  const ids = stores.map((s) => s._id);
  const slowFrom = from < daysAgo(29) ? from : daysAgo(29); // ratings and waste: at least the last 30 days
  const [stats, ratings, waste, hours] = await Promise.all([orderStats(ids, from, to), ratingStats(ids, slowFrom), wasteStats(ids, slowFrom), hoursByStore(ids)]);
  const now = new Date();
  const rows = stores.map((store) => {
    const id = String(store._id);
    const s = stats.get(id) || EMPTY;
    const r = ratings.get(id);
    const rating = r ? round1(r.sum / r.n) : 0;
    const w = wastePct(waste.get(id));
    return {
      _id: id,
      storeId: id,
      storeName: store.storeName,
      storeCode: store.code,
      date: ymd(to),
      totalOrders: s.orders,
      completedOrders: s.delivered,
      cancelledOrders: s.cancelled,
      revenue: round2(s.revenue),
      avgOrderValue: s.sales ? Math.round(s.revenue / s.sales) : 0,
      avgPreparationTime: s.prepN ? Math.round(s.prepSum / s.prepN) : 0,
      avgDeliveryTime: s.delN ? Math.round(s.delSum / s.delN) : 0,
      customerRating: rating,
      inventoryWaste: w,
      performanceScore: score(s, rating, w),
      status: storeStatus(store, closureCovers(hours.get(id)?.closure, now)),
      storeType: store.storeType,
      city: store.city || '',
      createdAt: store.createdAt,
    };
  });
  return { rows, stats, ratings, waste };
}

const storeIdsOf = async (access) => (await scopedStores(access, {}, '_id')).map((s) => s._id);

// ---------------------------------------------------------------------------------------------
// Network-wide (all stores in scope)
// ---------------------------------------------------------------------------------------------

export async function dashboard(user, q = {}) {
  const access = accessOf(user, q);
  const stores = await scopedStores(access);
  const { rows, stats, ratings, waste } = await performanceRows(stores, q, 'today');
  const sum = (key, map = stats) => [...map.values()].reduce((n, r) => n + (r[key] || 0), 0);
  const best = [...rows].filter((r) => r.performanceScore > 0).sort((a, b) => b.performanceScore - a.performanceScore)[0];
  const outValue = sum('outValue', waste);
  return {
    revenueToday: round2(sum('revenue')),
    ordersToday: sum('orders'),
    avgPreparationTime: sum('prepN') ? Math.round(sum('prepSum') / sum('prepN')) : 0,
    avgDeliveryTime: sum('delN') ? Math.round(sum('delSum') / sum('delN')) : 0,
    customerRating: sum('n', ratings) ? round1(sum('sum', ratings) / sum('n', ratings)) : 0,
    cancellationRate: pct(sum('cancelled'), sum('orders')),
    inventoryWaste: outValue > 0 ? pct(sum('wasteValue', waste), outValue) : pct(sum('wasteQty', waste), sum('outQty', waste)),
    bestStore: best?.storeName || null,
  };
}

async function salesByDay(storeIds, from) {
  const rows = await FoodOrder.aggregate([
    { $match: { storeId: { $in: storeIds }, createdAt: { $gte: from } } },
    {
      $group: {
        _id: dayKey,
        revenue: { $sum: { $cond: [SALE, { $ifNull: ['$pricing.total', 0] }, 0] } },
        sales: { $sum: { $cond: [SALE, 1, 0] } },
        delivered: { $sum: { $cond: [{ $eq: ['$orderStatus', 'delivered'] }, 1, 0] } },
        cancelled: { $sum: { $cond: [{ $in: ['$orderStatus', CANCELLED] }, 1, 0] } },
        orders: { $sum: 1 },
      },
    },
  ]);
  return new Map(rows.map((r) => [r._id, r]));
}

/** daily (7 days, by weekday), weekly (last 4 weeks), monthly (last 6 months). */
function revenueSeries(byDay) {
  const rev = (d) => byDay.get(ymd(d))?.revenue || 0;
  const daily = lastDays(7).map((d) => ({ time: WEEKDAY[d.getDay()], revenue: round2(rev(d)) }));
  const days28 = lastDays(28);
  const weekly = [0, 1, 2, 3].map((w) => ({ time: `Week ${w + 1}`, revenue: round2(days28.slice(w * 7, w * 7 + 7).reduce((n, d) => n + rev(d), 0)) }));
  const monthly = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const prefix = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`;
    const total = [...byDay.entries()].filter(([k]) => k.startsWith(prefix)).reduce((n, [, r]) => n + r.revenue, 0);
    monthly.push({ time: MONTH[m.getMonth()], revenue: round2(total) });
  }
  return { daily, weekly, monthly };
}

export async function revenueTrends(user, q = {}) {
  const access = accessOf(user, q);
  const now = new Date();
  const from = new Date(Math.min(daysAgo(27).getTime(), new Date(now.getFullYear(), now.getMonth() - 5, 1).getTime()));
  return revenueSeries(await salesByDay(await storeIdsOf(access), from));
}

export async function orderTrends(user, q = {}) {
  const access = accessOf(user, q);
  const byDay = await salesByDay(await storeIdsOf(access), daysAgo(6));
  return lastDays(7).map((d) => ({ time: WEEKDAY[d.getDay()], completed: byDay.get(ymd(d))?.delivered || 0, cancelled: byDay.get(ymd(d))?.cancelled || 0 }));
}

export async function ratingTrends(user, q = {}) {
  const access = accessOf(user, q);
  const rows = await FoodOrder.aggregate([
    { $match: { storeId: { $in: await storeIdsOf(access) }, 'ratings.store.rating': { $gte: 1 }, 'ratings.store.ratedAt': { $gte: daysAgo(6) } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$ratings.store.ratedAt', timezone: tz() } }, avg: { $avg: '$ratings.store.rating' } } },
  ]);
  const byDay = new Map(rows.map((r) => [r._id, r.avg]));
  return lastDays(7).map((d) => ({ time: WEEKDAY[d.getDay()], rating: round1(byDay.get(ymd(d)) || 0) }));
}

export async function comparison(user, q = {}) {
  const access = accessOf(user, q);
  const { rows } = await performanceRows(await scopedStores(access), q, 'last7');
  return rows.sort((a, b) => b.revenue - a.revenue).slice(0, 5).map((r) => ({
    name: r.storeName, revenue: r.revenue, orders: r.totalOrders, rating: r.customerRating, cancellation: pct(r.cancelledOrders, r.totalOrders),
  }));
}

/** Orders per hour of day over the last 30 days, as a % of the busiest hour. */
export async function busyHours(user, q = {}) {
  const access = accessOf(user, q);
  const rows = await FoodOrder.aggregate([
    { $match: { storeId: { $in: await storeIdsOf(access) }, createdAt: { $gte: daysAgo(29) } } },
    { $group: { _id: { $hour: { date: '$createdAt', timezone: tz() } }, count: { $sum: 1 } } },
  ]);
  const byHour = new Map(rows.map((r) => [r._id, r.count]));
  const peak = Math.max(0, ...byHour.values());
  const hours = [...byHour.keys()];
  const first = Math.min(11, ...hours);
  const last = Math.max(23, ...hours);
  return Array.from({ length: last - first + 1 }, (_, i) => first + i).map((h) => ({ hour: hour12(h), density: peak ? Math.round(((byHour.get(h) || 0) / peak) * 100) : 0 }));
}

export async function list(user, q = {}) {
  const access = accessOf(user, q);
  let stores = await scopedStores(access);
  if (!isAll(q.storeId)) stores = stores.filter((s) => String(s._id) === String(q.storeId));
  if (!isAll(q.type)) stores = stores.filter((s) => s.storeType === q.type);
  if (!isAll(q.city)) stores = stores.filter((s) => String(s.city || '').toLowerCase() === String(q.city).toLowerCase());
  const search = String(q.search || '').trim().toLowerCase();
  if (search) stores = stores.filter((s) => [s.storeName, s.code, String(s._id)].some((v) => String(v || '').toLowerCase().includes(search)));
  let { rows } = await performanceRows(stores, q, 'last7');
  if (!isAll(q.status)) rows = rows.filter((r) => r.status === q.status);
  const key = q.sort && rows[0] && q.sort in rows[0] ? q.sort : 'performanceScore';
  const dir = (q.order || (key === 'performanceScore' ? 'desc' : 'asc')) === 'desc' ? -1 : 1;
  rows.sort((a, b) => (typeof a[key] === 'number' ? a[key] - b[key] : String(a[key] ?? '').localeCompare(String(b[key] ?? ''))) * dir);
  const page = Math.max(1, parseInt(q.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(q.limit, 10) || 10));
  return { list: rows.slice((page - 1) * limit, page * limit), totalCount: rows.length, page, limit };
}

export async function compare(user, q = {}) {
  const access = accessOf(user, q);
  const stores = await scopedStoreList(access, q.storeIds, '_id franchiseId storeName code city storeType isActive approvalStatus createdAt');
  return (await performanceRows(stores, q, 'last7')).rows;
}

export async function exportReport(user, q = {}) {
  const access = accessOf(user, q);
  const stores = isAll(q.storeIds) ? await scopedStores(access) : await scopedStoreList(access, q.storeIds, '_id franchiseId storeName code city storeType isActive approvalStatus createdAt');
  const { rows } = await performanceRows(stores, q, 'last7');
  return { fileName: `Store_Performance_Report.${q.format === 'pdf' ? 'pdf' : q.format === 'excel' ? 'xlsx' : 'csv'}`, rows };
}

// ---------------------------------------------------------------------------------------------
// One store (performance drawer, revenue / orders modals, store list)
// ---------------------------------------------------------------------------------------------

const oneStore = async (user, storeId, q) => scopedStore(accessOf(user, q), storeId);

export async function storeRow(user, storeId, q = {}) {
  const store = await oneStore(user, storeId, q);
  return (await performanceRows([store], q, 'last7')).rows[0];
}

export async function storeRevenue(user, storeId, q = {}) {
  const store = await oneStore(user, storeId, q);
  const ids = [store._id];
  const since = daysAgo(29);
  const [byDay, methods, lines] = await Promise.all([
    salesByDay(ids, since),
    FoodOrder.aggregate([
      { $match: { storeId: store._id, createdAt: { $gte: since } } },
      { $match: { $expr: SALE } },
      { $group: { _id: '$payment.method', n: { $sum: 1 } } },
    ]),
    FoodOrder.aggregate([
      { $match: { storeId: store._id, createdAt: { $gte: since } } },
      { $match: { $expr: SALE } },
      { $unwind: '$items' },
      { $group: { _id: '$items.itemId', revenue: { $sum: { $multiply: [{ $ifNull: ['$items.price', 0] }, { $ifNull: ['$items.quantity', 1] }] } } } },
    ]),
  ]);
  const days = [...byDay.values()];
  const revenue = (list) => list.reduce((n, r) => n + r.revenue, 0);
  const week = lastDays(7).map((d) => byDay.get(ymd(d)) || { revenue: 0, sales: 0 });
  const sales = days.reduce((n, r) => n + r.sales, 0);
  const totalPaid = methods.reduce((n, m) => n + m.n, 0);

  const productIds = lines.map((l) => l._id).filter(isId);
  const products = await Product.find({ _id: { $in: productIds.map(toId) } }).select('categoryId').lean();
  const cats = await CategoryProduct.find({ _id: { $in: products.map((p) => p.categoryId).filter(Boolean) } }).select('label').lean();
  const catOf = new Map(products.map((p) => [String(p._id), cats.find((c) => String(c._id) === String(p.categoryId))?.label || 'Other']));
  const byCat = new Map();
  for (const l of lines) byCat.set(catOf.get(String(l._id)) || 'Other', (byCat.get(catOf.get(String(l._id)) || 'Other') || 0) + l.revenue);
  const lineTotal = [...byCat.values()].reduce((n, v) => n + v, 0);

  return {
    todayRevenue: round2(byDay.get(ymd(new Date()))?.revenue || 0),
    weeklyRevenue: round2(revenue(week)),
    monthlyRevenue: round2(revenue(days)),
    avgOrderValue: sales ? Math.round(revenue(days) / sales) : 0,
    trend: lastDays(7).map((d) => ({ time: WEEKDAY[d.getDay()], revenue: round2(byDay.get(ymd(d))?.revenue || 0) })),
    paymentMethods: methods.sort((a, b) => b.n - a.n).map((m) => ({ name: PAYMENT[m._id] || String(m._id || 'Other'), value: pct(m.n, totalPaid) })),
    distribution: [...byCat.entries()].sort((a, b) => b[1] - a[1]).map(([category, v]) => ({ category, value: pct(v, lineTotal) })),
  };
}

const PEAKS = [[0, 12, 'Before 12 PM'], [12, 14, '12 PM - 2 PM'], [14, 18, '2 PM - 6 PM'], [18, 21, '6 PM - 9 PM'], [21, 24, '9 PM - 12 AM']];

export async function storeOrders(user, storeId, q = {}) {
  const store = await oneStore(user, storeId, q);
  const { from, to } = rangeOf(q, 'last7');
  const [r] = await FoodOrder.aggregate([
    { $match: { storeId: store._id, createdAt: { $gte: from, $lte: to } } },
    {
      $facet: {
        byDay: [{ $group: { _id: dayKey, delivered: { $sum: { $cond: [{ $eq: ['$orderStatus', 'delivered'] }, 1, 0] } }, cancelled: { $sum: { $cond: [{ $in: ['$orderStatus', CANCELLED] }, 1, 0] } }, orders: { $sum: 1 } } }],
        byHour: [{ $group: { _id: { d: dayKey, h: { $hour: { date: '$createdAt', timezone: tz() } } }, n: { $sum: 1 } } }],
      },
    },
  ]);
  const byDay = new Map(r.byDay.map((x) => [x._id, x]));
  const total = r.byDay.reduce((n, x) => n + x.orders, 0);
  const delivered = r.byDay.reduce((n, x) => n + x.delivered, 0);
  const cancelled = r.byDay.reduce((n, x) => n + x.cancelled, 0);
  const days = daysIn(from, to);
  const perHour = new Map();
  for (const x of r.byHour) perHour.set(x._id.h, (perHour.get(x._id.h) || 0) + x.n);
  return {
    totalOrders: total,
    completedOrders: delivered,
    cancelledOrders: cancelled,
    completionRate: pct(delivered, total),
    avgOrdersPerHour: r.byHour.length ? round1(total / r.byHour.length) : 0,
    dailyOrders: days.map((d) => ({ time: dayLabel(d, days.length > 7), completed: byDay.get(ymd(d))?.delivered || 0, cancelled: byDay.get(ymd(d))?.cancelled || 0 })),
    statusDistribution: [
      { name: 'Delivered', value: pct(delivered, total) },
      { name: 'Cancelled', value: pct(cancelled, total) },
      { name: 'In Progress', value: total ? round1(100 - pct(delivered, total) - pct(cancelled, total)) : 0 },
    ],
    peakHours: PEAKS.map(([a, b, hour]) => ({ hour, count: [...perHour.entries()].filter(([h]) => h >= a && h < b).reduce((n, [, c]) => n + c, 0) }))
      .filter((p, i) => i > 0 || p.count > 0),
  };
}

export async function storeRatings(user, storeId, q = {}) {
  const store = await oneStore(user, storeId, q);
  const now = new Date();
  const sixMonths = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const [r] = await FoodOrder.aggregate([
    { $match: { storeId: store._id, 'ratings.store.rating': { $gte: 1 } } },
    {
      $facet: {
        stats: [{ $group: { _id: null, avg: { $avg: '$ratings.store.rating' }, n: { $sum: 1 }, pos: { $sum: { $cond: [{ $gte: ['$ratings.store.rating', 4] }, 1, 0] } }, neg: { $sum: { $cond: [{ $lte: ['$ratings.store.rating', 2] }, 1, 0] } } } }],
        dist: [{ $group: { _id: '$ratings.store.rating', n: { $sum: 1 } } }],
        trend: [
          { $match: { 'ratings.store.ratedAt': { $gte: sixMonths } } },
          { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$ratings.store.ratedAt', timezone: tz() } }, avg: { $avg: '$ratings.store.rating' } } },
        ],
        recent: [{ $sort: { 'ratings.store.ratedAt': -1 } }, { $limit: 5 }, { $project: { customerName: 1, 'ratings.store': 1 } }],
      },
    },
  ]);
  const s = r.stats[0] || { avg: 0, n: 0, pos: 0, neg: 0 };
  const dist = new Map(r.dist.map((d) => [Math.round(d._id), d.n]));
  const trend = new Map(r.trend.map((t) => [t._id, t.avg]));
  const months = Array.from({ length: 6 }, (_, i) => new Date(now.getFullYear(), now.getMonth() - 5 + i, 1));
  return {
    avgRating: round1(s.avg),
    totalReviews: s.n,
    positiveReviews: s.pos,
    negativeReviews: s.neg,
    distribution: [5, 4, 3, 2, 1].map((k) => ({ rating: `${k} Star`, count: dist.get(k) || 0 })),
    trend: months.map((m) => ({ time: MONTH[m.getMonth()], rating: round1(trend.get(`${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`) || 0) })),
    recentReviews: r.recent.map((o) => ({ customer: o.customerName || 'Customer', rating: o.ratings.store.rating, comment: o.ratings.store.comment || '', date: o.ratings.store.ratedAt ? ymd(new Date(o.ratings.store.ratedAt)) : '' })),
  };
}

export async function storeInventory(user, storeId, q = {}) {
  const store = await oneStore(user, storeId, q);
  const since = daysAgo(29);
  const [ingredients, alerts, moves] = await Promise.all([
    StoreIngredient.find({ storeId: store._id }).select('ingredientName currentStock reorderLevel costPerUnit tracked').lean(),
    InventoryAlert.countDocuments({ storeId: store._id, status: 'active' }),
    StockTransaction.aggregate([
      { $match: { storeId: store._id, type: 'stock_out', createdAt: { $gte: since } } },
      { $group: { _id: { ing: '$ingredientId', day: dayKey, waste: { $eq: ['$source', 'waste'] } }, qty: { $sum: '$quantity' } } },
    ]),
  ]);
  const ing = new Map(ingredients.map((i) => [String(i._id), i]));
  const cost = (id) => Number(ing.get(String(id))?.costPerUnit) || 0;
  const valued = moves.some((m) => cost(m._id.ing) > 0);
  const amount = (m) => (valued ? m.qty * cost(m._id.ing) : m.qty);
  const share = (list) => {
    const out = list.reduce((n, m) => n + amount(m), 0);
    return out ? pct(list.filter((m) => m._id.waste).reduce((n, m) => n + amount(m), 0), out) : 0;
  };
  const used = new Map();
  for (const m of moves) used.set(String(m._id.ing), (used.get(String(m._id.ing)) || 0) + m.qty);
  const stockValue = ingredients.reduce((n, i) => n + (Number(i.currentStock) || 0) * (Number(i.costPerUnit) || 0), 0);
  const usedValue = moves.reduce((n, m) => n + m.qty * cost(m._id.ing), 0);
  return {
    wastePercent: share(moves),
    outOfStockItems: ingredients.filter((i) => i.tracked && i.currentStock <= 0).length,
    stockTurnover: stockValue > 0 ? round1(usedValue / stockValue) : 0,
    lowStockAlerts: alerts,
    wasteTrend: lastDays(7).map((d) => ({ time: WEEKDAY[d.getDay()], waste: share(moves.filter((m) => m._id.day === ymd(d))) })),
    consumption: [...used.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([id, qty]) => {
      const i = ing.get(id) || {};
      const left = Math.max(0, Number(i.currentStock) || 0);
      return { ingredient: i.ingredientName || 'Ingredient', consumed: Math.round((qty / (qty + left || 1)) * 100), reorder: !!i.tracked && left <= (Number(i.reorderLevel) || 0) };
    }),
  };
}

export async function storeProducts(user, storeId, q = {}) {
  const store = await oneStore(user, storeId, q);
  const rows = await FoodOrder.aggregate([
    { $match: { storeId: store._id, createdAt: { $gte: daysAgo(29) } } },
    { $match: { $expr: SALE } },
    { $unwind: '$items' },
    { $match: { 'items.isLimitedOffer': { $ne: true } } },
    {
      $group: {
        _id: '$items.name', sold: { $sum: { $ifNull: ['$items.quantity', 1] } },
        revenue: { $sum: { $multiply: [{ $ifNull: ['$items.price', 0] }, { $ifNull: ['$items.quantity', 1] }] } },
        rating: { $avg: '$ratings.store.rating' },
      },
    },
    { $sort: { sold: -1, revenue: -1 } },
    { $limit: 5 },
  ]);
  const top = rows[0]?.sold || 0;
  return {
    list: rows.map((r) => ({ product: r._id, sold: r.sold, revenue: round2(r.revenue), rating: round1(r.rating || 0), popularity: top ? Math.round((r.sold / top) * 100) : 0 })),
    chart: rows.map((r) => ({ name: r._id, sold: r.sold })),
  };
}

const STATION = { pizza_chef: 'Kitchen', baking_chef: 'Oven', packaging_staff: 'Packaging' };
const WINDOWS = [[11, 15, '11 AM - 3 PM'], [15, 19, '3 PM - 7 PM'], [19, 23, '7 PM - 11 PM']];

export async function storeStaff(user, storeId, q = {}) {
  const store = await oneStore(user, storeId, q);
  const orders = await FoodOrder.find({ storeId: store._id, createdAt: { $gte: daysAgo(29) } })
    .select('orderStatus kitchen.staff kitchen.acceptedAt kitchen.readyAt kitchen.expectedReadyAt ratings.store.rating ratings.deliveryPartner.rating dispatch.deliveryPartnerId')
    .limit(5000).lean();
  const ready = orders.filter((o) => o.kitchen?.readyAt);
  const prep = ready.filter((o) => o.kitchen.acceptedAt).map((o) => (new Date(o.kitchen.readyAt) - new Date(o.kitchen.acceptedAt)) / 60000);
  const timed = ready.filter((o) => o.kitchen.expectedReadyAt);
  const onTime = (list) => list.filter((o) => new Date(o.kitchen.readyAt) <= new Date(o.kitchen.expectedReadyAt)).length;

  const people = new Map();
  const credit = (key, name, rating) => {
    const p = people.get(key) || { name, orders: 0, sum: 0, n: 0 };
    p.orders += 1;
    if (rating) { p.sum += rating; p.n += 1; }
    people.set(key, p);
  };
  for (const o of orders) {
    for (const [slot, label] of Object.entries(STATION)) {
      const person = o.kitchen?.staff?.[slot];
      if (person?.name) credit(`${slot}:${person.userId || person.name}`, `${person.name} (${label})`, o.ratings?.store?.rating);
    }
  }
  const delivered = orders.filter((o) => o.orderStatus === 'delivered' && o.dispatch?.deliveryPartnerId);
  const riders = await FoodDeliveryPartner.find({ _id: { $in: delivered.map((o) => o.dispatch.deliveryPartnerId) } }).select('name').lean();
  const riderName = new Map(riders.map((r) => [String(r._id), r.name]));
  for (const o of delivered) {
    const id = String(o.dispatch.deliveryPartnerId);
    credit(`rider:${id}`, `${riderName.get(id) || 'Rider'} (Delivery)`, o.ratings?.deliveryPartner?.rating);
  }

  return {
    ordersProcessed: ready.length,
    avgPrepTime: prep.length ? Math.round(prep.reduce((n, m) => n + m, 0) / prep.length) : 0,
    efficiencyScore: timed.length ? Math.round((onTime(timed) / timed.length) * 100) : 0,
    performance: [...people.values()].sort((a, b) => b.orders - a.orders).slice(0, 10).map((p) => ({ name: p.name, orders: p.orders, rating: p.n ? round1(p.sum / p.n) : 0 })),
    productivity: WINDOWS.map(([a, b, hour]) => {
      const inWindow = timed.filter((o) => { const h = new Date(o.kitchen.readyAt).getHours(); return h >= a && h < b; });
      return { hour, speed: inWindow.length ? Math.round((onTime(inWindow) / inWindow.length) * 100) : 0 };
    }),
  };
}
