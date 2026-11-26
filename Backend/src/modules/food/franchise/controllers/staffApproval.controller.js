import mongoose from 'mongoose';
import { kitchenStaffFilter } from '../../store/services/kitchenStaffDirectory.js';
import { StoreManager } from '../models/storeManager.model.js';
import { FoodStore } from '../../store/models/store.model.js';
import { StoreAttendance } from '../../store/models/attendance.model.js';
import { dateKeyOf } from '../../store/services/attendanceTime.js';
import { scopedStoreIds } from '../../shared/franchiseScope.js';
import { sendError, sendResponse } from '../../../../utils/response.js';

// Kitchen staff added by a store manager wait here for the franchise admin (or the super admin).
// The scope comes from the token: a franchise admin only ever sees and decides on the staff of its own franchise's stores.
// Kitchen staff are staff records with no login (docs/kitchen-staff-removal.md): approving one lets the store manager put
// the person on stations; it never switches an account on. The kitchen supervisor role is no longer used: never approved.

const isId = (v) => mongoose.Types.ObjectId.isValid(String(v || ''));

// A staff record inside the caller's scope, or null (reported as 404 so another franchise's staff is not revealed)
async function findScopedStaff(req, id) {
    if (!isId(id)) return null;
    const storeIds = await scopedStoreIds(req);
    const staff = await StoreManager.findOne({ $and: [{ _id: new mongoose.Types.ObjectId(String(id)) }, await kitchenStaffFilter(storeIds)] });
    if (!staff) return null;
    if (storeIds && !storeIds.some((s) => String(s) === String(staff.storeId))) return null;
    return staff;
}

const escapeRx = (v) => String(v).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const rowOf = (r, storeName) => ({
    _id: String(r._id),
    name: r.name,
    email: r.email,
    phone: r.phone,
    role: r.role,
    employeeCode: r.employeeCode,
    status: r.status,
    storeId: r.storeId,
    storeName: storeName.get(String(r.storeId)) || r.storeName || '',
    addedBy: r.reportingManager || '',
    shiftType: r.personalDetails?.shiftType || '',
    shiftStart: r.personalDetails?.startTime || '',
    shiftEnd: r.personalDetails?.endTime || '',
    experience: r.personalDetails?.experience || 0,
    skills: r.personalDetails?.skills || [],
    address: r.personalDetails?.address || '',
    emergencyContact: r.personalDetails?.emergencyContact || '',
    salary: r.personalDetails?.salary || 0,
    salaryType: r.personalDetails?.salaryType || '',
    weeklyWorkingDays: r.personalDetails?.weeklyWorkingDays || [],
    joinedDate: r.joinedDate,
    profileImage: r.profileImage || '',
    createdAt: r.createdAt,
    rejectionReason: r.approval?.rejectionReason || '',
    decidedAt: r.approval?.decidedAt || null,
    decidedByName: r.approval?.decidedByName || '',
});

async function storeNamesOf(rows) {
    const stores = await FoodStore.find({ _id: { $in: rows.map((r) => r.storeId).filter(isId) } }).select('storeName').lean();
    return new Map(stores.map((s) => [String(s._id), s.storeName]));
}

// the caller's kitchen people, narrowed by ?storeId= (inside the scope) and ?search=
async function baseFilter(req) {
    const storeIds = await scopedStoreIds(req);
    const kitchen = await kitchenStaffFilter(storeIds);
    const filter = {};
    let allowed = storeIds ? storeIds.map(String) : null;
    const wanted = req.query.storeId && req.query.storeId !== 'All' ? String(req.query.storeId) : null;
    if (wanted) allowed = allowed ? allowed.filter((id) => id === wanted) : [wanted];
    if (allowed) filter.storeId = { $in: allowed };
    const search = String(req.query.search || '').trim();
    if (search) {
        const rx = { $regex: escapeRx(search), $options: 'i' };
        filter.$or = [{ name: rx }, { email: rx }, { phone: rx }, { employeeCode: rx }];
    }
    return { $and: [kitchen, filter] };
}
const and = (base, ...more) => ({ $and: [base, ...more] });

const DECISION_FILTER = {
    'Pending Approval': { status: 'Pending Approval' },
    Rejected: { status: 'Rejected' },
    // approved by a franchise admin (decision recorded) and not since removed or sent back
    Approved: { 'approval.decidedAt': { $ne: null }, status: { $nin: ['Rejected', 'Pending Approval', 'DELETED'] } },
};

/** GET /staff-approvals?status=Pending Approval|Approved|Rejected|All&storeId=&search= : the approval queue and its history. */
export const listStaffApprovals = async (req, res, next) => {
    try {
        const base = await baseFilter(req);
        const status = String(req.query.status || 'Pending Approval');
        const filter = status === 'All'
            ? and(base, { $or: [{ status: { $in: ['Pending Approval', 'Rejected'] } }, { 'approval.decidedAt': { $ne: null } }] }, { status: { $ne: 'DELETED' } })
            : and(base, DECISION_FILTER[status] || DECISION_FILTER['Pending Approval']);
        const rows = await StoreManager.find(filter).sort({ createdAt: -1 }).limit(300).lean();
        const names = await storeNamesOf(rows);
        const count = (extra) => StoreManager.countDocuments(and(base, extra));
        const [pending, approved, rejected] = await Promise.all([count(DECISION_FILTER['Pending Approval']), count(DECISION_FILTER.Approved), count(DECISION_FILTER.Rejected)]);
        return sendResponse(res, 200, 'Staff approvals', { staff: rows.map((r) => rowOf(r, names)), counts: { pending, approved, rejected } });
    } catch (err) {
        return next(err);
    }
};

/** GET /staff-approvals/staff : every approved kitchen staff member of the franchise, with today's attendance. */
export const listKitchenStaff = async (req, res, next) => {
    try {
        const base = await baseFilter(req);
        const extra = { status: { $nin: ['Pending Approval', 'Rejected', 'DELETED'] } };
        if (req.query.status && req.query.status !== 'All') extra.status = String(req.query.status);
        if (req.query.role && req.query.role !== 'All') extra.role = String(req.query.role);
        const rows = await StoreManager.find(and(base, extra)).sort({ createdAt: -1 }).limit(500).lean();
        const names = await storeNamesOf(rows);
        const today = await StoreAttendance.find({ date: dateKeyOf(), staffId: { $in: rows.map((r) => r._id) } }).select('staffId status checkInAt checkOutAt').lean();
        const todayBy = new Map(today.map((a) => [String(a.staffId), a]));
        const all = await StoreManager.find(and(base, { status: { $nin: ['Pending Approval', 'Rejected', 'DELETED'] } })).select('status').lean();
        return sendResponse(res, 200, 'Kitchen staff', {
            staff: rows.map((r) => {
                const a = todayBy.get(String(r._id));
                return { ...rowOf(r, names), today: a ? (a.status === 'leave' ? 'On leave' : a.checkOutAt ? 'Checked out' : a.checkInAt ? 'Checked in' : 'Present') : 'Not checked in' };
            }),
            counts: {
                total: all.length,
                active: all.filter((r) => r.status === 'Active').length,
                onLeave: all.filter((r) => r.status === 'On Leave').length,
                suspended: all.filter((r) => r.status === 'Suspended').length,
            },
        });
    } catch (err) {
        return next(err);
    }
};

async function decide(req, res, next, approve) {
    try {
        const staff = await findScopedStaff(req, req.params.id);
        if (!staff) return sendError(res, 404, 'Staff member not found');
        if (staff.status !== 'Pending Approval') return sendError(res, 409, `This request is already ${staff.status.toLowerCase()}.`);
        const reason = String(req.body?.reason || '').trim().slice(0, 300);
        if (!approve && !reason) return sendError(res, 400, 'Please give a reason for rejecting.');

        staff.status = approve ? 'Active' : 'Rejected';
        staff.approval = {
            decidedBy: isId(req.user?.userId) ? req.user.userId : null,
            decidedByName: String(req.user?.name || req.user?.email || ''),
            decidedAt: new Date(),
            rejectionReason: approve ? '' : reason,
        };
        await staff.save();
        // (no account to switch on: kitchen staff have no login; the store manager can now put them on stations)
        return sendResponse(res, 200, approve ? 'Staff member approved' : 'Staff request rejected', { id: String(staff._id), status: staff.status });
    } catch (err) {
        return next(err);
    }
}

export const approveStaff = (req, res, next) => decide(req, res, next, true);
export const rejectStaff = (req, res, next) => decide(req, res, next, false);
