import mongoose from 'mongoose';
import { FoodOrder } from '../../orders/models/order.model.js';
import { User } from '../../../../core/users/models/user.model.js';
import { Refund } from '../../../../core/payments/models/refund.model.js';
import { FoodSupportTicket } from '../../user/models/supportTicket.model.js';
import { StoreManager } from '../../franchise/models/storeManager.model.js';
import { FoodStore } from '../../store/models/store.model.js';
import { FoodFranchise } from '../../franchise/models/franchise.model.js';
import { onDutyStaffIds } from '../../store/services/attendancePresence.js';
import { Role } from '../../../../core/roles/models/role.model.js';
import { FoodDeliveryPartner } from '../../delivery/models/deliveryPartner.model.js';
import { NotFoundError } from '../../../../core/auth/errors.js';

// Extra facts the super admin screens show next to records the server already has (read only).

const CANCELLED = ['cancelled_by_user', 'cancelled_by_store', 'cancelled_by_admin'];
const round = (n) => Math.round((Number(n) || 0) * 100) / 100;
const ids = (list) => [...new Set(list.filter(Boolean).map(String))];
const oid = (v) => new mongoose.Types.ObjectId(String(v));

/** Adds the order, the customer (with their lifetime figures) and the payment to each refund. */
export async function refundsWithContext(refunds) {
  const orderIds = ids(refunds.map((r) => r.orderId));
  const userIds = ids(refunds.map((r) => r.userId));
  const [orders, users, lifetime] = await Promise.all([
    FoodOrder.find({ _id: { $in: orderIds } }).select('order_id orderStatus items pricing payment customerName customerPhone deliveryAddress createdAt').lean(),
    User.find({ _id: { $in: userIds } }).select('name phone mobile email').lean(),
    FoodOrder.aggregate([
      { $match: { userId: { $in: userIds.map(oid) }, orderStatus: { $nin: CANCELLED } } },
      { $group: { _id: '$userId', orders: { $sum: 1 }, spend: { $sum: { $ifNull: ['$pricing.total', 0] } }, last: { $max: '$createdAt' } } },
    ]),
  ]);
  const orderOf = new Map(orders.map((o) => [String(o._id), o]));
  const userOf = new Map(users.map((u) => [String(u._id), u]));
  const lifeOf = new Map(lifetime.map((l) => [String(l._id), l]));
  return refunds.map((r) => {
    const o = orderOf.get(String(r.orderId)) || {};
    const u = userOf.get(String(r.userId)) || {};
    const l = lifeOf.get(String(r.userId)) || {};
    const a = o.deliveryAddress || {};
    return {
      ...r,
      order: {
        orderNumber: o.order_id || String(r.orderId), orderStatus: o.orderStatus || '', paymentMethod: o.payment?.method || '',
        createdAt: o.createdAt || null, subtotal: o.pricing?.subtotal || 0, taxAmount: o.pricing?.tax || 0,
        deliveryFee: o.pricing?.deliveryFee || 0, discount: o.pricing?.discount || 0, grandTotal: o.pricing?.total || 0,
        couponApplied: o.pricing?.couponCode || '',
        items: (o.items || []).map((i) => ({ product: i.name, variant: [i.size, i.crust].filter(Boolean).join(', '), qty: i.quantity, price: i.price, subtotal: round(i.price * i.quantity) })),
      },
      customer: {
        name: u.name || o.customerName || 'Customer', phone: u.phone || u.mobile || o.customerPhone || '', email: u.email || '',
        address: [a.street, a.city, a.state].filter(Boolean).join(', '), lifetimeOrders: l.orders || 0, lifetimeSpend: round(l.spend), lastOrderDate: l.last || null,
      },
      payment: {
        gatewayName: o.payment?.method || '', transactionId: o.payment?.razorpay?.paymentId || o.payment?.transactionId || '',
        paymentAmount: o.pricing?.total || 0,
      },
    };
  });
}

/** One customer's orders, refunds and tickets, for the profile page. */
export async function customerHistory(customerId) {
  if (!mongoose.isValidObjectId(String(customerId))) throw new NotFoundError('Customer not found');
  const userId = oid(customerId);
  const [orders, refunds, tickets] = await Promise.all([
    FoodOrder.find({ userId }).sort({ createdAt: -1 }).limit(50).select('order_id orderStatus pricing.total payment.method storeId items.name items.quantity ratings createdAt deliveryAddress').lean(),
    Refund.find({ userId }).sort({ createdAt: -1 }).limit(20).select('amount status reason createdAt').lean(),
    FoodSupportTicket.find({ userId }).sort({ createdAt: -1 }).limit(20).select('issueType status createdAt').lean(),
  ]);
  const stores = new Map((await FoodStore.find({ _id: { $in: ids(orders.map((o) => o.storeId)) } }).select('storeName').lean()).map((s) => [String(s._id), s.storeName]));
  const addresses = [...new Set(orders.map((o) => [o.deliveryAddress?.street, o.deliveryAddress?.city, o.deliveryAddress?.state].filter(Boolean).join(', ')).filter(Boolean))].slice(0, 5);
  return {
    orders: orders.map((o) => ({
      _id: String(o._id), orderNumber: o.order_id || String(o._id), status: o.orderStatus, total: o.pricing?.total || 0, method: o.payment?.method || '',
      storeName: stores.get(String(o.storeId)) || '', items: (o.items || []).map((i) => `${i.quantity} x ${i.name}`).join(', '),
      rating: o.ratings?.store?.rating || 0, createdAt: o.createdAt,
    })),
    refunds: refunds.map((r) => ({ _id: String(r._id), amount: r.amount, status: r.status, reason: r.reason, createdAt: r.createdAt })),
    tickets: tickets.map((t) => ({ _id: String(t._id), issueType: t.issueType, status: t.status, createdAt: t.createdAt })),
    addresses,
  };
}

/** Kitchen staff of every store (the store manager creates them; the franchise admin approves them). */
export async function kitchenStaffList() {
  const people = await StoreManager.find({ role: { $not: /manager|supervisor/i }, status: { $ne: 'Deleted' } })
    .select('userId name email phone employeeCode role status storeId joinedDate personalDetails.shiftType profileImage').sort({ createdAt: -1 }).limit(2000).lean();
  const stores = await FoodStore.find({ _id: { $in: ids(people.map((p) => p.storeId)).filter((s) => mongoose.isValidObjectId(s)) } }).select('storeName franchiseId').lean();
  const franchises = await FoodFranchise.find({ _id: { $in: ids(stores.map((s) => s.franchiseId)) } }).select('name franchiseName').lean();
  const storeOf = new Map(stores.map((s) => [String(s._id), s]));
  const franchiseOf = new Map(franchises.map((f) => [String(f._id), f.franchiseName || f.name]));
  const [handled, onDuty] = await Promise.all([
    FoodOrder.aggregate([
      { $match: { orderStatus: 'delivered' } },
      { $project: { who: [ '$kitchen.staff.pizza_chef.userId', '$kitchen.staff.baking_chef.userId', '$kitchen.staff.packaging_staff.userId' ] } },
      { $unwind: '$who' }, { $match: { who: { $ne: null } } }, { $group: { _id: { order: '$_id', who: '$who' } } },
      { $group: { _id: '$_id.who', n: { $sum: 1 } } },
    ]),
    Promise.all(stores.map((s) => onDutyStaffIds(s._id, people.filter((p) => String(p.storeId) === String(s._id)).map((p) => p._id)))),
  ]);
  const orderCount = new Map(handled.map((h) => [String(h._id), h.n]));
  const present = new Set(onDuty.flatMap((set) => [...set]));
  return {
    staff: people.map((p) => {
      const store = storeOf.get(String(p.storeId));
      return {
        _id: String(p._id), name: p.name, email: p.email, phone: p.phone, employeeCode: p.employeeCode, role: p.role, status: p.status,
        storeName: store?.storeName || '', franchiseName: franchiseOf.get(String(store?.franchiseId)) || '',
        shift: p.personalDetails?.shiftType || '', joinedDate: p.joinedDate || null, ordersDelivered: orderCount.get(String(p.userId)) || 0,
        onDuty: present.has(String(p._id)),
      };
    }),
  };
}

// What each role may do. The permissions themselves are fixed in the server's route guards; this describes them.
const ROLES = [
  ['SUPER_ADMIN', 'Super Admin', 'The whole company: menu, prices, franchises, payouts, refunds, customers and app content.'],
  ['FRANCHISE_ADMIN', 'Franchise Admin', 'Its own franchise only: stores, store managers, staff approvals and attendance, riders, store pricing, complaints and payouts.'],
  ['STORE_MANAGER', 'Store Manager', 'One store: accepting orders, stations, delivery, inventory, kitchen staff, attendance and payouts.'],
  ['KITCHEN_STAFF', 'Kitchen Staff', 'Only the orders where they hold a station, their tasks, attendance and salary.'],
  ['DELIVERY_PARTNER', 'Delivery Partner', 'The delivery app: their own offers, deliveries, wallet and payouts.'],
  ['CUSTOMER', 'Customer', 'The user app: their own cart, orders, addresses, wallet and support requests.'],
];

/** The real roles and how many accounts hold each (riders are counted from their own records). */
export async function rolesSummary() {
  const roles = await Role.find({ code: { $in: ROLES.map((r) => r[0]) } }).select('code').lean();
  const idOf = new Map(roles.map((r) => [r.code, r._id]));
  return {
    roles: await Promise.all(ROLES.map(async ([code, name, can]) => {
      let people = 0;
      let active = 0;
      if (code === 'DELIVERY_PARTNER') {
        [people, active] = await Promise.all([FoodDeliveryPartner.countDocuments({}), FoodDeliveryPartner.countDocuments({ status: 'approved' })]);
      } else if (idOf.has(code)) {
        const filter = { primaryRole: idOf.get(code), isDeleted: { $ne: true } };
        [people, active] = await Promise.all([User.countDocuments(filter), User.countDocuments({ ...filter, isActive: { $ne: false } })]);
      }
      return { _id: code, code, name, can, people, active };
    })),
  };
}
