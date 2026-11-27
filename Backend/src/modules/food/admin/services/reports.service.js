import mongoose from 'mongoose';
import { FoodOrder } from '../../orders/models/order.model.js';
import { FoodTransaction } from '../../orders/models/foodTransaction.model.js';
import { FoodStore } from '../../store/models/store.model.js';
import { FoodZone } from '../models/zone.model.js';
import { StoreProductPrice } from '../../franchise/models/storeProductPrice.model.js';
import { ValidationError } from '../../../../core/auth/errors.js';

// Super admin > Report Management (ported from the Jharkhand Rasoi admin reports and rebuilt on Papa Veg's data).
// Every figure comes from fields Papa Veg records: the order's pricing (subtotal, tax, packaging / delivery / platform
// / handling fees, store commission, discount, total) and the order's FoodTransaction ledger row (store share, rider
// share, platform profit, tax). Jharkhand's estimates (a fixed ₹30 delivery cost, GST on it, item-level GST and TCS
// fields Papa Veg does not have) are not reproduced.

const CANCELLED = ['cancelled_by_user', 'cancelled_by_store', 'cancelled_by_admin'];
const IST = '+05:30';
const money = (n) => Math.round((Number(n) || 0) * 100) / 100;
const rupees = (n) => `₹${money(n).toFixed(2)}`;
const isId = (v) => mongoose.Types.ObjectId.isValid(String(v || '')) && /^[a-f0-9]{24}$/i.test(String(v));
const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** Paid, or paid on delivery / from the wallet: an order that is a real sale. */
const SALE_PAYMENT = { $or: [{ 'payment.method': { $in: ['cash', 'wallet', 'razorpay_qr'] } }, { 'payment.status': { $in: ['paid', 'authorized', 'captured', 'settled', 'refunded'] } }] };

/** A "Today" / "This Week" / "This Month" / "This Year" label -> a createdAt filter (Jharkhand's report filters). */
function rangeFromLabel(label) {
  const value = String(label || '').trim().toLowerCase();
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  start.setHours(0, 0, 0, 0);
  if (value === 'today') return { $gte: start, $lte: end };
  if (value === 'this week') {
    start.setDate(start.getDate() - (start.getDay() === 0 ? 6 : start.getDay() - 1)); // from Monday
    return { $gte: start, $lte: end };
  }
  if (value === 'this month') { start.setDate(1); return { $gte: start, $lte: end }; }
  if (value === 'this year') { start.setMonth(0, 1); return { $gte: start, $lte: end }; }
  return null;
}

/** fromDate / toDate (ISO), or a time label -> a createdAt filter, or null for all time. */
function dateRange(query) {
  if (!query.fromDate || !query.toDate) return rangeFromLabel(query.time);
  const from = new Date(query.fromDate);
  const to = new Date(query.toDate);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) throw new ValidationError('Invalid date range');
  return { $gte: from, $lte: to };
}

/** The stores a zone / store filter selects, or null for every store. */
async function storeIdsFor({ zone, store }) {
  if (isId(store)) return [new mongoose.Types.ObjectId(String(store))];
  if (isId(zone)) return (await FoodStore.find({ zoneId: new mongoose.Types.ObjectId(String(zone)) }).select('_id').lean()).map((s) => s._id);
  return null;
}

/** Zone and store choices for a report's filters. */
async function filterOptions() {
  const [zones, stores] = await Promise.all([
    FoodZone.find({}).select('name zoneName').sort({ name: 1 }).lean(),
    FoodStore.find({}).select('storeName zoneId').sort({ storeName: 1 }).lean(),
  ]);
  return {
    zones: zones.map((z) => ({ id: String(z._id), name: z.name || z.zoneName || 'Zone' })),
    stores: stores.map((s) => ({ id: String(s._id), name: s.storeName || 'Store', zoneId: s.zoneId ? String(s.zoneId) : '' })),
  };
}

const ledgerFor = async (orderIds) => {
  const rows = await FoodTransaction.find({ orderId: { $in: orderIds } }).select('orderId status amounts').lean();
  return new Map(rows.map((row) => [String(row.orderId), row]));
};

/**
 * The split of one order: the ledger's when it has one; otherwise what the pricing implies (the store keeps the food,
 * packaging and handling less its commission, the rider his earning, the platform the rest).
 */
const splitOf = (order, tx) => {
  const p = order.pricing || {};
  const total = Number(p.total) || 0;
  const riderShare = tx?.amounts?.riderShare ?? (Number(order.riderEarning) || 0);
  const storeShare = tx?.amounts?.storeShare ?? Math.max(0, (Number(p.subtotal) || 0) + (Number(p.packagingFee) || 0) + (Number(p.handlingFee) || 0) - (Number(p.storeCommission) || 0) - (Number(p.discount) || 0));
  const adminShare = tx?.amounts?.platformNetProfit ?? (Number(order.platformProfit) || Math.max(0, total - storeShare - riderShare));
  return { storeShare: money(storeShare), riderShare: money(riderShare), adminShare: money(adminShare) };
};

const deliveredAtOf = (order) =>
  order.deliveryState?.deliveredAt
  || [...(order.statusHistory || [])].reverse().find((h) => h.to === 'delivered')?.at
  || order.updatedAt
  || order.createdAt;

// ---------------------------------------------------------------------------------------------------------------
// Daily Sales & Cash Audit
// ---------------------------------------------------------------------------------------------------------------

/** One day's delivered orders (India time), with the money split, cash vs online, per store and per rider. */
export async function getDailySalesReport(dateRaw) {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(String(dateRaw || ''))
    ? String(dateRaw)
    : new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
  const start = new Date(`${date}T00:00:00.000${IST}`);
  const end = new Date(`${date}T23:59:59.999${IST}`);

  const orders = await FoodOrder.find({
    orderStatus: 'delivered',
    $or: [
      { 'deliveryState.deliveredAt': { $gte: start, $lte: end } },
      { 'deliveryState.deliveredAt': null, updatedAt: { $gte: start, $lte: end } },
    ],
  })
    .select('order_id storeId customerName customerPhone userId items pricing payment riderEarning platformProfit dispatch.deliveryPartnerId deliveryState.deliveredAt statusHistory createdAt updatedAt')
    .populate('storeId', 'storeName city')
    .populate('dispatch.deliveryPartnerId', 'name phone vehicleType')
    .sort({ 'deliveryState.deliveredAt': -1, updatedAt: -1 })
    .lean();
  const ledger = await ledgerFor(orders.map((o) => o._id));

  const foodOrders = [];
  const stores = new Map();
  const riders = new Map();

  for (const order of orders) {
    const p = order.pricing || {};
    const totalPaid = money(p.total);
    const { storeShare, riderShare, adminShare } = splitOf(order, ledger.get(String(order._id)));
    const method = String(order.payment?.method || 'cash').toLowerCase();
    const isCod = method === 'cash';
    const isRiderQr = method === 'razorpay_qr';
    const deliveredAt = deliveredAtOf(order);
    const minutes = order.createdAt && deliveredAt ? Math.round((new Date(deliveredAt) - new Date(order.createdAt)) / 60000) : null;
    const store = order.storeId || {};
    const rider = order.dispatch?.deliveryPartnerId || null;

    const row = {
      id: order._id,
      orderId: order.order_id || String(order._id),
      orderType: 'food',
      storeId: store._id ? String(store._id) : null,
      storeName: store.storeName || 'Store',
      customer: { id: order.userId || null, name: order.customerName || 'Customer', phone: order.customerPhone || '' },
      deliveryPartner: rider ? { id: rider._id, name: rider.name || 'Rider', phone: rider.phone || '', vehicleType: rider.vehicleType || 'Bike' } : null,
      pricing: {
        subtotal: money(p.subtotal),
        packagingFee: money(p.packagingFee),
        handlingFee: money(p.handlingFee),
        deliveryFee: money(p.deliveryFee),
        platformFee: money(p.platformFee),
        tax: money(p.tax),
        discount: money(p.discount),
        totalPaid,
        commission: money(p.storeCommission),
      },
      shares: { storeEarned: storeShare, adminEarned: adminShare, riderEarned: riderShare },
      payment: {
        method: order.payment?.method || 'cash',
        isCod,
        isRiderQr,
        isOnline: !isCod,
        status: order.payment?.status || '',
        codCollected: isCod ? totalPaid : 0,
        onlinePaid: isCod ? 0 : totalPaid,
      },
      itemCount: (order.items || []).length,
      itemsSummary: (order.items || []).slice(0, 3).map((i) => `${i.quantity || 1}x ${i.name || 'Item'}`).join(', '),
      createdAt: order.createdAt,
      deliveredAt,
      deliveryDurationMinutes: minutes !== null && minutes >= 0 ? minutes : null,
    };
    foodOrders.push(row);

    if (row.storeId) {
      const s = stores.get(row.storeId) || { storeId: row.storeId, storeName: row.storeName, area: store.city || '', ordersCount: 0, grossSales: 0, commissionDeducted: 0, netPayable: 0 };
      s.ordersCount += 1;
      s.grossSales = money(s.grossSales + totalPaid);
      s.commissionDeducted = money(s.commissionDeducted + row.pricing.commission);
      s.netPayable = money(s.netPayable + storeShare);
      stores.set(row.storeId, s);
    }

    if (rider?._id) {
      const key = String(rider._id);
      const r = riders.get(key) || {
        partnerId: key, name: rider.name || 'Rider', phone: rider.phone || '', vehicleType: rider.vehicleType || 'Bike',
        foodOrdersCount: 0, totalOrdersCount: 0, foodEarnings: 0, totalEarnings: 0,
        codCashCollected: 0, onlinePaymentsHandled: 0, qrPaymentsCollected: 0, ordersList: [],
      };
      r.foodOrdersCount += 1;
      r.totalOrdersCount += 1;
      r.foodEarnings = money(r.foodEarnings + riderShare);
      r.totalEarnings = money(r.totalEarnings + riderShare);
      if (isCod) r.codCashCollected = money(r.codCashCollected + totalPaid);
      else r.onlinePaymentsHandled = money(r.onlinePaymentsHandled + totalPaid);
      if (isRiderQr) r.qrPaymentsCollected = money(r.qrPaymentsCollected + totalPaid);
      r.ordersList.push({
        orderId: row.orderId, orderType: 'food', storeName: row.storeName, totalPaid, riderEarning: riderShare,
        paymentMethod: row.payment.method, isCod, createdAt: row.createdAt, deliveredAt, deliveryDurationMinutes: row.deliveryDurationMinutes,
      });
      riders.set(key, r);
    }
  }

  const sum = (pick) => money(foodOrders.reduce((n, o) => n + pick(o), 0));
  const timed = foodOrders.filter((o) => typeof o.deliveryDurationMinutes === 'number');
  const foodSummary = {
    totalOrders: foodOrders.length,
    totalCustomerPaid: sum((o) => o.pricing.totalPaid),
    totalSubtotal: sum((o) => o.pricing.subtotal),
    totalDeliveryFee: sum((o) => o.pricing.deliveryFee),
    totalPackagingFee: sum((o) => o.pricing.packagingFee),
    totalHandlingFee: sum((o) => o.pricing.handlingFee),
    totalPlatformFee: sum((o) => o.pricing.platformFee),
    totalTax: sum((o) => o.pricing.tax),
    totalDiscounts: sum((o) => o.pricing.discount),
    totalStoreEarned: sum((o) => o.shares.storeEarned),
    totalAdminEarned: sum((o) => o.shares.adminEarned),
    totalRiderEarned: sum((o) => o.shares.riderEarned),
    totalCodCollected: sum((o) => o.payment.codCollected),
    totalOnlinePaid: sum((o) => o.payment.onlinePaid),
    avgDeliveryTimeMinutes: timed.length ? Math.round(timed.reduce((n, o) => n + o.deliveryDurationMinutes, 0) / timed.length) : 0,
  };

  return {
    date,
    overallSummary: {
      totalOrders: foodSummary.totalOrders,
      totalCustomerPaid: foodSummary.totalCustomerPaid,
      totalStoreEarned: foodSummary.totalStoreEarned,
      totalAdminEarned: foodSummary.totalAdminEarned,
      totalRiderEarned: foodSummary.totalRiderEarned,
      totalCodCollected: foodSummary.totalCodCollected,
      totalOnlinePaid: foodSummary.totalOnlinePaid,
      avgDeliveryTimeMinutes: foodSummary.avgDeliveryTimeMinutes,
    },
    foodSummary,
    foodOrders,
    deliveryBoysSummary: [...riders.values()].sort((a, b) => b.totalOrdersCount - a.totalOrdersCount),
    storesSummary: [...stores.values()].sort((a, b) => b.grossSales - a.grossSales),
  };
}

// ---------------------------------------------------------------------------------------------------------------
// Transaction Report
// ---------------------------------------------------------------------------------------------------------------

/** Every order's money (from the order and its ledger row), with completed / refunded totals and who earned what. */
export async function getTransactionReport(query = {}) {
  const match = {};
  const created = dateRange(query);
  if (created) match.createdAt = created;
  const storeIds = await storeIdsFor(query);
  if (storeIds) match.storeId = { $in: storeIds };
  // Both the search and "a real sale" are $or conditions: combine them with $and so neither replaces the other
  const and = [SALE_PAYMENT];
  if (String(query.search || '').trim()) {
    const regex = { $regex: escapeRegex(String(query.search).trim()), $options: 'i' };
    and.push({ $or: [{ order_id: regex }, { customerName: regex }] });
  }

  const orders = await FoodOrder.find({ ...match, $and: and })
    .select('order_id storeId customerName pricing payment orderStatus riderEarning platformProfit createdAt')
    .populate('storeId', 'storeName')
    .sort({ createdAt: -1 })
    .limit(Math.min(Math.max(parseInt(query.limit, 10) || 1000, 1), 5000))
    .lean();
  const ledger = await ledgerFor(orders.map((o) => o._id));

  const summary = { completedTransaction: 0, refundedTransaction: 0, adminEarning: 0, storeEarning: 0, deliverymanEarning: 0 };
  const transactions = orders.map((order) => {
    const p = order.pricing || {};
    const tx = ledger.get(String(order._id));
    const cancelled = CANCELLED.includes(order.orderStatus);
    const refunded = tx?.status === 'refunded' || order.payment?.status === 'refunded';
    const delivered = order.orderStatus === 'delivered';
    const total = money(p.total);

    if (delivered && !refunded) {
      const { storeShare, riderShare, adminShare } = splitOf(order, tx);
      summary.completedTransaction += total;
      summary.adminEarning += adminShare;
      summary.storeEarning += storeShare;
      summary.deliverymanEarning += riderShare;
    }
    if (refunded) summary.refundedTransaction += total;

    return {
      id: order._id,
      orderId: order.order_id || String(order._id),
      store: order.storeId?.storeName || 'N/A',
      customerName: order.customerName || 'Customer',
      totalItemAmount: money(p.subtotal),
      couponDiscount: money(p.discount),
      vatTax: money(p.tax),
      deliveryCharge: money(p.deliveryFee),
      platformFee: money(p.platformFee),
      orderAmount: total,
      status: refunded ? 'refunded' : cancelled ? 'cancelled' : delivered ? 'delivered' : (tx?.status || order.payment?.status || order.orderStatus),
      orderStatus: order.orderStatus,
    };
  });
  for (const key of Object.keys(summary)) summary[key] = money(summary[key]);

  return { transactions, summary, filters: await filterOptions() };
}

// ---------------------------------------------------------------------------------------------------------------
// Store Report
// ---------------------------------------------------------------------------------------------------------------

/** Per store: menu items it sells, delivered orders and their value, discounts, commission, tax, and ratings. */
export async function getStoreReport(query = {}) {
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 1000, 1), 5000);
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const skip = (page - 1) * limit;

  const storeFilter = {};
  const status = String(query.all || '').trim().toLowerCase();
  if (status === 'active') Object.assign(storeFilter, { approvalStatus: 'Approved', isActive: { $ne: false } });
  else if (status === 'inactive') storeFilter.$or = [{ approvalStatus: { $ne: 'Approved' } }, { isActive: false }];
  if (isId(query.zone)) storeFilter.zoneId = new mongoose.Types.ObjectId(String(query.zone));
  if (String(query.search || '').trim()) {
    const regex = { $regex: escapeRegex(String(query.search).trim()), $options: 'i' };
    storeFilter.$and = [{ $or: [{ storeName: regex }, { city: regex }, { code: regex }] }];
  }

  const [stores, total] = await Promise.all([
    FoodStore.find(storeFilter).sort({ createdAt: -1 }).skip(skip).limit(limit).select('storeName code city approvalStatus isActive zoneId').populate('zoneId', 'name zoneName').lean(),
    FoodStore.countDocuments(storeFilter),
  ]);
  const storeIds = stores.map((s) => s._id);
  if (!storeIds.length) return { stores: [], total, page, limit, filters: await filterOptions() };

  const orderMatch = { storeId: { $in: storeIds }, orderStatus: 'delivered', ...SALE_PAYMENT };
  const created = dateRange(query);
  if (created) orderMatch.createdAt = created;

  const [menu, sales, ratings] = await Promise.all([
    StoreProductPrice.aggregate([
      { $match: { storeId: { $in: storeIds }, status: 'ACTIVE' } },
      { $group: { _id: '$storeId', n: { $sum: 1 } } },
    ]),
    FoodOrder.aggregate([
      { $match: orderMatch },
      {
        $group: {
          _id: '$storeId',
          orders: { $sum: 1 },
          amount: { $sum: { $ifNull: ['$pricing.total', 0] } },
          discount: { $sum: { $ifNull: ['$pricing.discount', 0] } },
          commission: { $sum: { $ifNull: ['$pricing.storeCommission', 0] } },
          tax: { $sum: { $ifNull: ['$pricing.tax', 0] } },
        },
      },
    ]),
    FoodOrder.aggregate([
      { $match: { storeId: { $in: storeIds }, 'ratings.store.rating': { $gte: 1 } } },
      { $group: { _id: '$storeId', avg: { $avg: '$ratings.store.rating' }, n: { $sum: 1 } } },
    ]),
  ]);
  const menuOf = new Map(menu.map((m) => [String(m._id), m.n]));
  const salesOf = new Map(sales.map((s) => [String(s._id), s]));
  const ratingOf = new Map(ratings.map((r) => [String(r._id), r]));

  return {
    stores: stores.map((store, index) => {
      const key = String(store._id);
      const s = salesOf.get(key) || {};
      const r = ratingOf.get(key);
      return {
        _id: store._id,
        sl: skip + index + 1,
        storeName: store.storeName || '',
        code: store.code || '',
        city: store.city || '',
        totalFood: menuOf.get(key) || 0,
        totalOrder: s.orders || 0,
        // formatted like Jharkhand's report (the page and its exports show these strings)
        totalOrderAmount: rupees(s.amount),
        totalDiscountGiven: rupees(s.discount),
        totalAdminCommission: rupees(s.commission),
        totalVATTAX: rupees(s.tax),
        averageRatings: r ? Math.round(r.avg * 10) / 10 : 0,
        reviews: r?.n || 0,
        status: store.approvalStatus === 'Approved' && store.isActive !== false ? 'active' : String(store.approvalStatus || 'pending').toLowerCase(),
        zoneName: store.zoneId?.name || store.zoneId?.zoneName || '',
      };
    }),
    total,
    page,
    limit,
    filters: await filterOptions(),
  };
}

// ---------------------------------------------------------------------------------------------------------------
// Order Report
// ---------------------------------------------------------------------------------------------------------------

/** The order report's status buckets (the page's status cards). */
const displayStatusOf = (order) => {
  if (order.payment?.status === 'refunded' || order.payment?.refund?.status === 'processed') return 'Refunded';
  if (order.payment?.status === 'failed') return 'Payment Failed';
  const s = order.orderStatus;
  if (CANCELLED.includes(s)) return 'Canceled';
  if (s === 'delivered') return 'Delivered';
  if (['picked_up', 'reached_drop'].includes(s)) return 'Food On The Way';
  if (['preparing', 'ready_for_pickup', 'reached_pickup'].includes(s)) return order.kitchen?.acceptedAt && s === 'preparing' && !order.kitchen?.stage ? 'Accepted' : 'Processing';
  if (order.scheduledAt && new Date(order.scheduledAt) > new Date()) return 'Scheduled';
  return 'Pending';
};

/** Orders in the period, mapped to the report's rows; filter choices come from the orders themselves. */
export async function getOrderReport(query = {}) {
  const match = {};
  const created = dateRange(query);
  if (created) match.createdAt = created;
  const storeIds = await storeIdsFor(query);
  if (storeIds) match.storeId = { $in: storeIds };
  if (isId(query.customer)) match.userId = new mongoose.Types.ObjectId(String(query.customer));

  const orders = await FoodOrder.find(match)
    .select('order_id storeId userId customerName zoneId pricing payment orderStatus kitchen.acceptedAt kitchen.stage scheduledAt createdAt')
    .populate('storeId', 'storeName zoneId')
    .sort({ createdAt: -1 })
    .limit(Math.min(Math.max(parseInt(query.limit, 10) || 5000, 1), 10000))
    .lean();

  const customers = new Map();
  const rows = orders.map((order) => {
    const p = order.pricing || {};
    const customerId = order.userId ? String(order.userId) : '';
    if (customerId && !customers.has(customerId)) customers.set(customerId, order.customerName || 'Customer');
    return {
      id: order._id,
      orderId: order.order_id || String(order._id),
      storeId: order.storeId?._id ? String(order.storeId._id) : '',
      store: order.storeId?.storeName || '',
      customerId,
      customerName: order.customerName || 'Customer',
      zoneId: String(order.zoneId || order.storeId?.zoneId || ''),
      totalItemAmount: money(p.subtotal),
      couponDiscount: money(p.discount),
      vatTax: money(p.tax),
      deliveryCharge: money(p.deliveryFee),
      platformFee: money(p.platformFee),
      totalAmount: money(p.total),
      orderStatus: displayStatusOf(order),
      createdAt: order.createdAt,
    };
  });

  const options = await filterOptions();
  return {
    orders: rows,
    filters: {
      ...options,
      customers: [...customers.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name)),
    },
  };
}
