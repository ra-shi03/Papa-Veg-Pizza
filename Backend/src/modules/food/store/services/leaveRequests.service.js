import { LeaveRequest, LEAVE_CATEGORIES } from '../models/leaveRequest.model.js';
import { StoreManager } from '../../franchise/models/storeManager.model.js';
import { ForbiddenError, NotFoundError, ValidationError } from '../../../../core/auth/errors.js';
import { isId, toId } from '../../dashboard/services/dashboardAccess.js';
import { attendanceScope, conflict, KITCHEN_ROLE_CODES } from './attendanceAccess.js';
import { markLeaveRange } from './attendance.service.js';
import { dateKeyOf } from './attendanceTime.js';
import { notifyUsers } from './kitchenTasks.service.js';
import { franchiseAdminUserIds } from '../../../../core/notifications/firebase.service.js';

const MAX_DAYS = 31;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const dayAdd = (key, n) => { const d = new Date(`${key}T00:00:00`); d.setDate(d.getDate() + n); return dateKeyOf(d); };
const daysBetween = (from, to) => Math.round((new Date(`${to}T00:00:00`) - new Date(`${from}T00:00:00`)) / 86400000) + 1;

const dto = (r) => ({
    _id: String(r._id), id: String(r._id), staffId: String(r.staffId), staffName: r.staffName, role: r.role,
    category: r.category, startDate: r.startDate, endDate: r.endDate, days: r.days, reason: r.reason, status: r.status,
    decidedByName: r.decidedByName || '', decidedAt: r.decidedAt || null, rejectionReason: r.rejectionReason || '',
    skippedDays: r.skippedDays || [], createdAt: r.createdAt,
});

// Kitchen staff and the store manager ask for leave (their own record, from the token)
async function kitchenSelf(user) {
    const scope = await attendanceScope(user, {});
    if (!KITCHEN_ROLE_CODES.includes(scope.role) && scope.role !== 'STORE_MANAGER') throw new ForbiddenError('Only the store team requests leave.');
    if (!scope.me) throw new ForbiddenError('Your staff record was not found.');
    return scope;
}
// The store manager decides staff requests; the franchise admin (?storeId=) decides any, including the manager's own
async function deciderScope(user, query = {}) {
    const scope = await attendanceScope(user, query);
    if (scope.role !== 'STORE_MANAGER' && !scope.isAdmin) throw new ForbiddenError('Only the store manager or the franchise admin decides on leave requests.');
    return scope;
}
const isManagerRole = (role) => /manager/i.test(String(role || ''));
const managersOf = async (storeId) =>
    (await StoreManager.find({ storeId: String(storeId), status: 'Active', role: /manager/i, userId: { $ne: null } }).select('userId').lean()).map((m) => m.userId);
const franchiseAdminsOf = async (franchiseId) => (franchiseId ? (await franchiseAdminUserIds(String(franchiseId))).map(String) : []);

/** POST /store/leave-requests { category, startDate, endDate, reason } */
export async function createLeaveRequest(user, body = {}) {
    const { me, store } = await kitchenSelf(user);
    if (me.status !== 'Active') throw new ForbiddenError(`Your account is ${me.status}. You cannot request leave.`);
    const category = String(body.category || '');
    const startDate = String(body.startDate || '');
    const endDate = String(body.endDate || startDate);
    const reason = String(body.reason || '').trim();
    if (!LEAVE_CATEGORIES.includes(category)) throw new ValidationError(`category: choose one of ${LEAVE_CATEGORIES.join(', ')}`);
    if (!DATE.test(startDate) || !DATE.test(endDate)) throw new ValidationError('startDate / endDate: use a date like 2026-11-20');
    if (startDate < dateKeyOf()) throw new ValidationError('startDate: leave cannot start in the past');
    if (endDate < startDate) throw new ValidationError('endDate: the last day cannot be before the first day');
    const days = daysBetween(startDate, endDate);
    if (days > MAX_DAYS) throw new ValidationError(`Leave can cover at most ${MAX_DAYS} days at a time`);
    if (reason.length < 3) throw new ValidationError('reason: please say why you need leave');
    if (reason.length > 300) throw new ValidationError('reason: keep it under 300 characters');

    const overlap = await LeaveRequest.findOne({ staffId: me._id, status: { $in: ['pending', 'approved'] }, startDate: { $lte: endDate }, endDate: { $gte: startDate } }).lean();
    if (overlap) throw conflict(`You already have a ${overlap.status} leave request for ${overlap.startDate === overlap.endDate ? overlap.startDate : `${overlap.startDate} to ${overlap.endDate}`}.`);

    const created = await LeaveRequest.create({
        storeId: store._id, franchiseId: store.franchiseId || null, staffId: me._id, userId: toId(user.userId),
        staffName: me.name, role: me.role, category, startDate, endDate, days, reason,
    });
    // a store manager's own request goes to the franchise admin; staff requests go to the store manager
    const deciders = isManagerRole(me.role) ? await franchiseAdminsOf(store.franchiseId) : await managersOf(store._id);
    await notifyUsers({
        userIds: deciders, storeId: store._id, type: 'leave_requested',
        title: `${me.name} asked for leave`, message: `${category} leave, ${startDate}${endDate !== startDate ? ` to ${endDate}` : ''}. ${reason}`,
    }).catch(() => {});
    return dto(created);
}

/** GET /store/leave-requests/mine : the caller's own requests, newest first. */
export async function listMyLeaveRequests(user) {
    const { me } = await kitchenSelf(user);
    return (await LeaveRequest.find({ staffId: me._id }).sort({ createdAt: -1 }).limit(100).lean()).map(dto);
}

/** PATCH /store/leave-requests/:id/cancel : the requester withdraws a request that is still waiting. */
export async function cancelLeaveRequest(user, id) {
    const { me } = await kitchenSelf(user);
    if (!isId(id)) throw new NotFoundError('Leave request not found');
    const rec = await LeaveRequest.findOne({ _id: toId(id), staffId: me._id });
    if (!rec) throw new NotFoundError('Leave request not found');
    if (rec.status !== 'pending') throw conflict(`This request is already ${rec.status}.`);
    rec.status = 'cancelled';
    await rec.save();
    return dto(rec);
}

/** GET /store/leave-requests?status=pending|approved|rejected|all : the store manager's queue and history. */
export async function listLeaveRequests(user, query = {}) {
    const { store, isAdmin } = await deciderScope(user, query);
    // the store manager sees kitchen staff requests only: their own (and other managers') go to the franchise admin
    const base = { storeId: store._id, ...(isAdmin ? {} : { role: { $not: /manager/i } }) };
    const status = ['pending', 'approved', 'rejected'].includes(query.status) ? query.status : query.status === 'all' ? null : 'pending';
    const filter = status ? { ...base, status } : { ...base, status: { $ne: 'cancelled' } };
    if (query.search) {
        const rx = new RegExp(String(query.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        filter.staffName = rx;
    }
    const [rows, pending, approved, rejected] = await Promise.all([
        LeaveRequest.find(filter).sort({ status: 1, createdAt: -1 }).limit(200).lean(),
        LeaveRequest.countDocuments({ ...base, status: 'pending' }),
        LeaveRequest.countDocuments({ ...base, status: 'approved' }),
        LeaveRequest.countDocuments({ ...base, status: 'rejected' }),
    ]);
    return { requests: rows.map(dto), counts: { pending, approved, rejected } };
}

async function decide(user, id, approve, reason, query = {}) {
    const { store, isAdmin } = await deciderScope(user, query);
    if (!isId(id)) throw new NotFoundError('Leave request not found');
    const rec = await LeaveRequest.findOne({ _id: toId(id), storeId: store._id });
    if (!rec) throw new NotFoundError('Leave request not found');
    if (!isAdmin && isManagerRole(rec.role)) throw new ForbiddenError('A store manager\'s leave is decided by the franchise admin.');
    if (rec.status !== 'pending') throw conflict(`This request is already ${rec.status}.`);
    const note = String(reason || '').trim().slice(0, 300);
    if (!approve && !note) throw new ValidationError('reason: please say why the leave is rejected');

    let skipped = [];
    if (approve) {
        // each day becomes a leave record (days the person already worked are left alone); a start date a little in the past is still fine
        const result = await markLeaveRange(user, { staffId: String(rec.staffId), from: rec.startDate, to: rec.endDate, reason: `${rec.category}: ${rec.reason}` }, query);
        skipped = result.skipped;
    }
    const by = (await StoreManager.findOne({ userId: toId(user.userId) }).select('name').lean())?.name || (isAdmin ? 'Franchise admin' : 'Store Manager');
    Object.assign(rec, { status: approve ? 'approved' : 'rejected', decidedBy: toId(user.userId), decidedByName: by, decidedAt: new Date(), rejectionReason: approve ? '' : note, skippedDays: skipped });
    await rec.save();
    await notifyUsers({
        userIds: [rec.userId], storeId: store._id, type: approve ? 'leave_approved' : 'leave_rejected',
        title: approve ? 'Your leave was approved' : 'Your leave was rejected',
        message: approve ? `${rec.startDate}${rec.endDate !== rec.startDate ? ` to ${rec.endDate}` : ''}` : note,
    }).catch(() => {});
    return dto(rec);
}

export const approveLeaveRequest = (user, id, query) => decide(user, id, true, '', query);
export const rejectLeaveRequest = (user, id, reason, query) => decide(user, id, false, reason, query);
