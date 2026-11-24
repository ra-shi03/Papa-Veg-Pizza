import { FoodOrder } from '../../orders/models/order.model.js';
import { FoodSupportTicket } from '../../user/models/supportTicket.model.js';
import { StoreAttendance } from '../models/attendance.model.js';
import { StoreShift } from '../models/shift.model.js';
import { NotFoundError } from '../../../../core/auth/errors.js';
import { isId, toId } from '../../dashboard/services/dashboardAccess.js';
import { escapeRegex } from '../../../../utils/helpers.js';
import { attendanceScope, kitchenStaffRecords } from './attendanceAccess.js';
import { dateKeyOf, round2 } from './attendanceTime.js';

// Staff performance (/v1/store/performance), worked out from what really happened in the period:
//   totalOrders          orders the person held a station on (pizza / baking / packaging) that the kitchen finished
//   avgPreparationTime   minutes from accepting the order to "ready", over those orders
//   delayedOrders        of those, orders marked delayed or finished after their expected ready time
//   attendancePercentage days worked / (days worked + days absent); leave does not count against them
//   customerComplaints   order complaints customers raised about those orders
//   rating               the customers' average store rating on those orders (0 = no ratings)
//   score                40% orders (against the busiest person in the store), 30% attendance, 20% speed (against the
//                        store's average), 10% customer feedback (rating, minus 2 points per complaint)
// The store manager reads their own store; the franchise admin (?storeId=) and super admin any store they can see.

const STATIONS = ['pizza_chef', 'baking_chef', 'packaging_staff'];
const PERIOD_DAYS = { daily: 1, weekly: 7, monthly: 30 };

function periodRange(period) {
  const days = PERIOD_DAYS[period] || PERIOD_DAYS.monthly;
  const to = new Date();
  const from = new Date(to);
  from.setHours(0, 0, 0, 0);
  from.setDate(from.getDate() - (days - 1));
  return { from, to, fromKey: dateKeyOf(from), toKey: dateKeyOf(to) };
}

const minutesBetween = (a, b) => (a && b ? Math.max(0, (new Date(b) - new Date(a)) / 60000) : null);

/** Per staff user id: { orders: [order], prep: [minutes], delayed: n } over finished kitchen orders of the period. */
async function orderFacts(storeId, from, to) {
  const orders = await FoodOrder.find({
    storeId: toId(storeId),
    'kitchen.readyAt': { $gte: from, $lte: to },
  }).select('order_id kitchen.staff kitchen.acceptedAt kitchen.readyAt kitchen.expectedReadyAt kitchen.delayReason ratings.store.rating createdAt').lean();
  const byUser = new Map();
  for (const o of orders) {
    const k = o.kitchen || {};
    const users = new Set(STATIONS.map((s) => k.staff?.[s]?.userId).filter(Boolean).map(String));
    const prep = minutesBetween(k.acceptedAt || o.createdAt, k.readyAt);
    const delayed = Boolean(k.delayReason) || (k.expectedReadyAt && k.readyAt && new Date(k.readyAt) > new Date(k.expectedReadyAt));
    for (const u of users) {
      if (!byUser.has(u)) byUser.set(u, { orders: [], prep: [], delayed: 0, stations: {} });
      const row = byUser.get(u);
      row.orders.push(o);
      if (prep !== null) row.prep.push(prep);
      if (delayed) row.delayed += 1;
      for (const s of STATIONS) if (String(k.staff?.[s]?.userId || '') === u) row.stations[s] = (row.stations[s] || 0) + 1;
    }
  }
  return byUser;
}

async function attendanceFacts(storeId, staffIds, fromKey, toKey) {
  const rows = await StoreAttendance.find({ storeId: toId(storeId), staffId: { $in: staffIds }, date: { $gte: fromKey, $lte: toKey } })
    .select('staffId status late').lean();
  const by = new Map();
  for (const r of rows) {
    const k = String(r.staffId);
    if (!by.has(k)) by.set(k, { worked: 0, absent: 0, late: 0 });
    const a = by.get(k);
    if (r.status === 'present' || r.status === 'half_day') { a.worked += 1; if (r.late) a.late += 1; } else if (r.status === 'absent') a.absent += 1;
  }
  return by;
}

async function complaintCounts(orderIds) {
  if (!orderIds.length) return new Map();
  const rows = await FoodSupportTicket.aggregate([
    { $match: { type: 'order', orderId: { $in: orderIds } } },
    { $group: { _id: '$orderId', n: { $sum: 1 } } },
  ]);
  return new Map(rows.map((r) => [String(r._id), r.n]));
}

/** The leaderboard rows (best score first) for the people in `staff`. */
async function rowsFor(store, staff, period) {
  const { from, to, fromKey, toKey } = periodRange(period);
  const facts = await orderFacts(store._id, from, to);
  const attendance = await attendanceFacts(store._id, staff.map((s) => s._id), fromKey, toKey);
  const allOrderIds = [...new Set([...facts.values()].flatMap((f) => f.orders.map((o) => o._id)))];
  const complaints = await complaintCounts(allOrderIds);

  const maxOrders = Math.max(0, ...staff.map((s) => facts.get(String(s.userId))?.orders.length || 0));
  const allPrep = [...facts.values()].flatMap((f) => f.prep);
  const storeAvgPrep = allPrep.length ? allPrep.reduce((a, b) => a + b, 0) / allPrep.length : 0;

  const rows = staff.map((s) => {
    const f = facts.get(String(s.userId)) || { orders: [], prep: [], delayed: 0, stations: {} };
    const a = attendance.get(String(s._id)) || { worked: 0, absent: 0, late: 0 };
    const totalOrders = f.orders.length;
    const avgPrep = f.prep.length ? f.prep.reduce((x, y) => x + y, 0) / f.prep.length : 0;
    const counted = a.worked + a.absent;
    const attendancePercentage = counted ? Math.round((a.worked / counted) * 100) : 0;
    const customerComplaints = f.orders.reduce((n, o) => n + (complaints.get(String(o._id)) || 0), 0);
    const ratings = f.orders.map((o) => o.ratings?.store?.rating).filter((r) => Number.isFinite(r));
    const rating = ratings.length ? round2(ratings.reduce((x, y) => x + y, 0) / ratings.length) : 0;

    const ordersPart = maxOrders ? (totalOrders / maxOrders) * 40 : 0;
    const attendancePart = (attendancePercentage / 100) * 30;
    const speedPart = totalOrders && avgPrep > 0 && storeAvgPrep > 0 ? Math.min(1, storeAvgPrep / avgPrep) * 20 : 0;
    const feedbackBase = totalOrders ? (ratings.length ? rating / 5 : 1) * 10 : 0;
    const feedbackPart = Math.max(0, feedbackBase - customerComplaints * 2);
    const score = Math.round(Math.min(100, ordersPart + attendancePart + speedPart + feedbackPart));

    return {
      _id: String(s._id), staffId: String(s._id), userId: s.userId ? String(s.userId) : null,
      fullName: s.name || '', employeeCode: s.employeeCode || '', role: s.role || '', profileImage: s.profileImage || '',
      totalOrders, avgPreparationTime: Math.round(avgPrep), delayedOrders: f.delayed,
      attendancePercentage, daysWorked: a.worked, daysAbsent: a.absent, lateDays: a.late,
      customerComplaints, rating, score, stations: f.stations,
      _orders: f.orders,
    };
  });
  rows.sort((x, y) => y.score - x.score || y.totalOrders - x.totalOrders || x.fullName.localeCompare(y.fullName));
  return rows;
}

const strip = ({ _orders, ...row }) => row;

/** GET /store/performance?period=daily|weekly|monthly&role=&search= */
export async function listPerformance(user, query = {}) {
  const scope = await attendanceScope(user, query);
  const extra = {};
  if (query.role && query.role !== 'All') extra.role = String(query.role);
  if (query.search) {
    const rx = { $regex: escapeRegex(String(query.search).slice(0, 60)), $options: 'i' };
    extra.$or = [{ name: rx }, { employeeCode: rx }];
  }
  const staff = await kitchenStaffRecords(scope.store._id, extra);
  return (await rowsFor(scope.store, staff, query.period)).map(strip);
}

/** GET /store/performance/:staffId?period= : one person's numbers, profile and latest finished orders. */
export async function staffPerformance(user, staffId, query = {}) {
  const scope = await attendanceScope(user, query);
  if (!isId(staffId)) throw new NotFoundError('Staff member not found');
  const staff = await kitchenStaffRecords(scope.store._id);
  const person = staff.find((s) => String(s._id) === String(staffId));
  if (!person) throw new NotFoundError('Staff member not found');
  const rows = await rowsFor(scope.store, staff, query.period);
  const row = rows.find((r) => r.staffId === String(person._id));
  const shift = await StoreShift.findOne({ storeId: scope.store._id, assignedStaff: person._id, status: 'active' }).select('shiftName').lean();
  const label = { pizza_chef: 'Pizza', baking_chef: 'Baking', packaging_staff: 'Packaging' };
  const activities = [...row._orders]
    .sort((a, b) => new Date(b.kitchen?.readyAt || 0) - new Date(a.kitchen?.readyAt || 0))
    .slice(0, 10)
    .map((o) => {
      const mine = STATIONS.filter((s) => String(o.kitchen?.staff?.[s]?.userId || '') === String(person.userId)).map((s) => label[s]).join(', ');
      const late = Boolean(o.kitchen?.delayReason);
      return {
        id: String(o._id),
        type: late ? 'delay' : 'order',
        title: `Order ${o.order_id || String(o._id).slice(-6)} ready${mine ? ` (${mine})` : ''}${late ? `, delayed: ${o.kitchen.delayReason}` : ''}`,
        time: o.kitchen?.readyAt || o.createdAt,
      };
    });
  return {
    ...strip(row),
    rank: rows.findIndex((r) => r.staffId === row.staffId) + 1,
    staff: {
      fullName: person.name || '', employeeCode: person.employeeCode || '', role: person.role || '', profileImage: person.profileImage || '',
      joiningDate: person.joinedDate ? dateKeyOf(new Date(person.joinedDate)) : '', shiftId: shift?.shiftName || '',
      activities,
    },
  };
}
