import { StoreAttendance } from '../models/attendance.model.js';
import { StoreShift } from '../models/shift.model.js';
import { LeaveRequest } from '../models/leaveRequest.model.js';
import { StoreManager } from '../../franchise/models/storeManager.model.js';
import { ForbiddenError, NotFoundError, ValidationError } from '../../../../core/auth/errors.js';
import { isId, toId } from '../../dashboard/services/dashboardAccess.js';
import { escapeRegex } from '../../../../utils/helpers.js';
import { attendanceScope, assertCanWrite, kitchenStaffRecords, displayNameOf, conflict, KITCHEN_ROLE_CODES } from './attendanceAccess.js';
import { parseClock, clockOf, dateKeyOf, atClock, hoursBetween, scheduledHours, minutesLate, round2 } from './attendanceTime.js';

// Attendance of one store (/v1/store/attendance). Staff clock in and out for themselves; the store manager can also mark,
// correct and delete records. Hours, overtime and lateness are always worked out here, never taken from the request.

const PRESENT = ['present', 'half_day'];
const OPEN_SESSION_HOURS = 20;   // a clock-in older than this is not an open session any more

export const attendanceDto = (a, staff, shift) => ({
    _id: String(a._id), id: String(a._id), storeId: String(a.storeId), staffId: String(a.staffId),
    staffName: staff?.name || '', employeeCode: staff?.employeeCode || '', role: staff?.role || '',
    shiftId: a.shiftId ? String(a.shiftId) : null, shiftName: shift?.shiftName || '',
    date: a.date, checkIn: clockOf(a.checkInAt), checkOut: clockOf(a.checkOutAt),
    checkInAt: a.checkInAt || null, checkOutAt: a.checkOutAt || null,
    totalHours: a.totalHours || 0, overtimeHours: a.overtimeHours || 0, status: a.status,
    late: !!a.late, lateMinutes: a.lateMinutes || 0,
    markedBy: a.markedByName || '', source: a.source, notes: a.notes || '', createdAt: a.createdAt,
});

/** Turns records into DTOs with the staff and shift each one points at (two queries, not one per record). */
async function present(records) {
    const [staff, shifts] = await Promise.all([
        StoreManager.find({ _id: { $in: [...new Set(records.map((r) => String(r.staffId)))] } }).select('name employeeCode role profileImage').lean(),
        StoreShift.find({ _id: { $in: [...new Set(records.map((r) => r.shiftId).filter(Boolean).map(String))] } }).select('shiftName').lean(),
    ]);
    const staffBy = new Map(staff.map((s) => [String(s._id), s]));
    const shiftBy = new Map(shifts.map((s) => [String(s._id), s]));
    return records.map((r) => attendanceDto(r, staffBy.get(String(r.staffId)), shiftBy.get(String(r.shiftId))));
}

/** hours worked and overtime for a finished session against the staff member's shift */
function hoursFor(checkInAt, checkOutAt, shift) {
    if (!checkInAt || !checkOutAt) return { totalHours: 0, overtimeHours: 0 };
    const totalHours = hoursBetween(checkInAt, checkOutAt);
    const planned = scheduledHours(shift);
    return { totalHours, overtimeHours: planned > 0 ? Math.max(0, round2(totalHours - planned)) : 0 };
}

/** The "09:00 AM" strings of a request -> check-in / check-out Dates on `date` (a check-out before the check-in is the next day). */
function timesOn(date, checkIn, checkOut) {
    const inMin = checkIn ? parseClock(checkIn) : null; const outMin = checkOut ? parseClock(checkOut) : null;
    if ((checkIn && inMin === null) || (checkOut && outMin === null)) throw new ValidationError('checkIn / checkOut: must be a time like 09:00 AM');
    const checkInAt = inMin === null ? null : atClock(date, inMin);
    let checkOutAt = outMin === null ? null : atClock(date, outMin);
    if (checkInAt && checkOutAt && checkOutAt <= checkInAt) checkOutAt = new Date(checkOutAt.getTime() + 86400000);
    if (checkOutAt && !checkInAt) throw new ValidationError('checkOut: a check-in time is needed first');
    return { checkInAt, checkOutAt };
}

async function shiftInStore(storeId, shiftId) {
    if (!shiftId) return null;
    const shift = await StoreShift.findOne({ _id: toId(shiftId), storeId }).lean();
    if (!shift) throw new NotFoundError('Shift not found');
    return shift;
}
const assignedShiftOf = (storeId, staffId) => StoreShift.findOne({ storeId, assignedStaff: staffId, status: 'active' }).lean();

async function staffInStore(storeId, staffId) {
    if (!isId(staffId)) throw new NotFoundError('Staff member not found');
    const [staff] = await kitchenStaffRecords(storeId, { _id: toId(staffId) });
    if (!staff) throw new NotFoundError('Staff member not found');
    return staff;
}

// ---- read -------------------------------------------------------------------------------------

export async function listAttendance(user, query = {}) {
    const scope = await attendanceScope(user, query);
    const filter = { storeId: scope.store._id };
    if (query.date) filter.date = query.date;
    else if (query.from || query.to) filter.date = { ...(query.from ? { $gte: query.from } : {}), ...(query.to ? { $lte: query.to } : {}) };
    if (query.shiftId) filter.shiftId = toId(query.shiftId);
    if (query.status) filter.status = query.status;
    if (scope.ownOnly) filter.staffId = scope.me._id;   // kitchen staff: only their own, whatever the query says
    else if (query.search || (query.role && query.role !== 'All')) {
        const staffFilter = {};
        if (query.search) { const rx = { $regex: escapeRegex(query.search), $options: 'i' }; staffFilter.$or = [{ name: rx }, { employeeCode: rx }]; }
        if (query.role && query.role !== 'All') staffFilter.role = query.role;
        const ids = await kitchenStaffRecords(scope.store._id, staffFilter);
        filter.staffId = { $in: ids.map((s) => s._id) };
    }
    const records = await StoreAttendance.find(filter).sort({ date: -1, checkInAt: -1, createdAt: -1 }).limit(Number(query.limit) || 500).lean();
    return withLeaveDetails(await present(records));
}

/** A leave day carries the approved request behind it: category, the whole range, the reason and who approved it. */
async function withLeaveDetails(rows) {
    const leaveRows = rows.filter((r) => r.status === 'leave');
    if (!leaveRows.length) return rows;
    const dates = leaveRows.map((r) => r.date).sort();
    const requests = await LeaveRequest.find({
        status: 'approved', staffId: { $in: [...new Set(leaveRows.map((r) => r.staffId))].map(toId) },
        startDate: { $lte: dates[dates.length - 1] }, endDate: { $gte: dates[0] },
    }).lean();
    return rows.map((r) => {
        if (r.status !== 'leave') return r;
        const req = requests.find((q) => String(q.staffId) === r.staffId && q.startDate <= r.date && q.endDate >= r.date);
        return req
            ? { ...r, leave: { category: req.category, reason: req.reason, startDate: req.startDate, endDate: req.endDate, days: req.days, requestedAt: req.createdAt, approvedBy: req.decidedByName, approvedAt: req.decidedAt } }
            : r;
    });
}

export async function getAttendance(user, id, query = {}) {
    const scope = await attendanceScope(user, query);
    if (!isId(id)) throw new NotFoundError('Attendance record not found');
    const filter = { _id: toId(id), storeId: scope.store._id };
    if (scope.ownOnly) filter.staffId = scope.me._id;
    const rec = await StoreAttendance.findOne(filter).lean();
    if (!rec) throw new NotFoundError('Attendance record not found');
    return (await present([rec]))[0];
}

// ---- store manager writes ---------------------------------------------------------------------

// Check in and check out are the staff member's own. The store manager's one write on attendance is leave.
const onlyLeave = () => new ForbiddenError('Attendance is marked by staff themselves (check in and check out). The store manager only marks leave.');

const MAX_LEAVE_DAYS = 31;
const dayAdd = (key, n) => { const d = new Date(`${key}T00:00:00`); d.setDate(d.getDate() + n); return dateKeyOf(d); };

/**
 * POST /store/attendance/leave { staffId, from, to, reason } : the store manager puts a staff member on leave
 * for a range of days, with a reason. Each day becomes a 'leave' record they and the franchise admin can see. A day the
 * person already worked is left alone.
 */
export async function markLeaveRange(user, body = {}, query = {}) {
    const scope = await attendanceScope(user, query);
    assertCanWrite(scope);
    const from = String(body.from || body.date || '');
    const to = String(body.to || from);
    const reason = String(body.reason || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) throw new ValidationError('from / to: use a date like 2026-11-20');
    if (to < from) throw new ValidationError('to: the last day cannot be before the first day');
    if (reason.length < 3) throw new ValidationError('reason: please say why they are on leave');
    if (reason.length > 300) throw new ValidationError('reason: keep it under 300 characters');
    const days = [];
    for (let d = from; d <= to && days.length <= MAX_LEAVE_DAYS; d = dayAdd(d, 1)) days.push(d);
    if (days.length > MAX_LEAVE_DAYS) throw new ValidationError(`Leave can cover at most ${MAX_LEAVE_DAYS} days at a time`);
    if (from < dayAdd(dateKeyOf(), -7)) throw new ValidationError('from: leave can only be marked from the last 7 days onwards');

    const staff = await staffInStore(scope.store._id, body.staffId);
    const by = await displayNameOf(user);
    const written = [];
    const skipped = [];
    for (const date of days) {
        const existing = await StoreAttendance.findOne({ storeId: scope.store._id, staffId: staff._id, date });
        if (existing && PRESENT.includes(existing.status)) { skipped.push(date); continue; }
        const set = {
            status: 'leave', notes: reason, shiftId: null, checkInAt: null, checkOutAt: null, totalHours: 0, overtimeHours: 0,
            late: false, lateMinutes: 0, source: 'manager', markedBy: toId(user.userId), markedByName: by,
        };
        const rec = existing
            ? await StoreAttendance.findOneAndUpdate({ _id: existing._id }, { $set: set }, { new: true })
            : await StoreAttendance.create({ storeId: scope.store._id, franchiseId: scope.store.franchiseId || null, staffId: staff._id, userId: staff.userId || null, date, ...set });
        written.push(rec.toObject());
    }
    return { days: written.length, skipped, records: await present(written) };
}

/** POST /store/attendance { staffId, date, status: 'leave', notes } : one day of leave (the leave endpoint takes a range). */
export async function markAttendance(user, body, query = {}) {
    const scope = await attendanceScope(user, query);
    assertCanWrite(scope);
    if (body.status !== 'leave') throw onlyLeave();
    return (await markLeaveRange(user, { staffId: body.staffId, from: body.date, to: body.date, reason: body.notes }, query)).records[0];
}

/** POST /store/attendance/bulk { date, shiftId, attendances:[{staffId,status}] } : one status per person for the day (replaces what was there). */
/** Kept so old callers get a clear answer: check ins are the staff's own, so there is nothing to mark in bulk. */
export async function bulkMarkAttendance(user, body, query = {}) {
    const scope = await attendanceScope(user, query);
    assertCanWrite(scope);
    throw onlyLeave();
}

export async function updateAttendance(user, id, body, query = {}) {
    const scope = await attendanceScope(user, query);
    assertCanWrite(scope);
    if (!isId(id)) throw new NotFoundError('Attendance record not found');
    const rec = await StoreAttendance.findOne({ _id: toId(id), storeId: scope.store._id });
    if (!rec) throw new NotFoundError('Attendance record not found');
    // A worked day (check in / check out) is the staff member's own record; only a leave record can be changed
    if (rec.status !== 'leave' || (body.status !== undefined && body.status !== 'leave')) throw onlyLeave();

    if (body.date !== undefined) { rec.date = body.date; }
    if (body.status !== undefined) rec.status = body.status;
    if (body.notes !== undefined) rec.notes = body.notes;
    if (body.shiftId !== undefined) rec.shiftId = (await shiftInStore(scope.store._id, body.shiftId))?._id || null;
    const off = rec.status === 'absent' || rec.status === 'leave';
    if (off) {
        Object.assign(rec, { checkInAt: null, checkOutAt: null, totalHours: 0, overtimeHours: 0, late: false, lateMinutes: 0 });
    } else if (body.checkIn !== undefined || body.checkOut !== undefined || body.date !== undefined) {
        // times are re-read on the (possibly new) date; whatever the request leaves out keeps its clock time
        const keep = (d) => (d ? clockOf(d) : null);
        const { checkInAt, checkOutAt } = timesOn(rec.date, body.checkIn !== undefined ? body.checkIn : keep(rec.checkInAt), body.checkOut !== undefined ? body.checkOut : keep(rec.checkOutAt));
        rec.checkInAt = checkInAt; rec.checkOutAt = checkOutAt;
    }
    const shift = rec.shiftId ? await StoreShift.findById(rec.shiftId).lean() : null;
    Object.assign(rec, hoursFor(rec.checkInAt, rec.checkOutAt, shift));
    const late = rec.checkInAt ? minutesLate(rec.checkInAt, shift) : 0;
    rec.late = late > 0; rec.lateMinutes = late;
    rec.markedBy = toId(user.userId); rec.markedByName = await displayNameOf(user);
    try {
        await rec.save();
    } catch (err) {
        if (err?.code === 11000) throw conflict('Attendance for this person and day is already recorded.');
        throw err;
    }
    return (await present([rec.toObject()]))[0];
}

export async function deleteAttendance(user, id, query = {}) {
    const scope = await attendanceScope(user, query);
    assertCanWrite(scope);
    if (!isId(id)) throw new NotFoundError('Attendance record not found');
    // Cancelling a leave is allowed; a worked day cannot be deleted
    const rec = await StoreAttendance.findOneAndDelete({ _id: toId(id), storeId: scope.store._id, status: 'leave' });
    if (!rec) {
        if (await StoreAttendance.exists({ _id: toId(id), storeId: scope.store._id })) throw onlyLeave();
        throw new NotFoundError('Attendance record not found');
    }
    return { id: String(rec._id) };
}

// ---- self service: clock in / out, today, history ---------------------------------------------

/** Kitchen staff clock themselves; the staff record comes from the token, never from the request. */
async function kitchenSelf(user) {
    const scope = await attendanceScope(user, {});
    if (!KITCHEN_ROLE_CODES.includes(scope.role)) throw new ForbiddenError('Only kitchen staff clock in and out.');
    return scope;
}

const openSession = (storeId, staffId, now) =>
    StoreAttendance.findOne({ storeId, staffId, checkInAt: { $gte: new Date(now.getTime() - OPEN_SESSION_HOURS * 3600000) }, checkOutAt: null, status: { $in: PRESENT } }).sort({ checkInAt: -1 });

export async function clockIn(user) {
    const scope = await kitchenSelf(user);
    const { me, store } = scope;
    if (me.status !== 'Active') throw new ForbiddenError(`Your account is ${me.status}. You cannot clock in.`);
    const now = new Date();
    if (await openSession(store._id, me._id, now)) throw conflict('You are already clocked in.');
    const date = dateKeyOf(now);
    const today = await StoreAttendance.findOne({ storeId: store._id, staffId: me._id, date }).lean();
    if (today?.status === 'leave') throw conflict(`You are on leave today${today.notes ? `: ${today.notes}` : ''}.`);
    if (today) throw conflict(today.checkOutAt ? 'You have already worked today.' : 'Your attendance for today was already marked by the store manager.');

    const shift = await assignedShiftOf(store._id, me._id);
    const late = minutesLate(now, shift);
    try {
        const rec = await StoreAttendance.create({
            storeId: store._id, franchiseId: store.franchiseId || null, staffId: me._id, userId: toId(user.userId), shiftId: shift?._id || null,
            date, checkInAt: now, status: 'present', late: late > 0, lateMinutes: late, source: 'self', markedBy: toId(user.userId), markedByName: me.name,
        });
        return (await present([rec.toObject()]))[0];
    } catch (err) {
        if (err?.code === 11000) throw conflict('You are already clocked in.');
        throw err;
    }
}

export async function clockOut(user) {
    const scope = await kitchenSelf(user);
    const now = new Date();
    const rec = await openSession(scope.store._id, scope.me._id, now);
    if (!rec) throw conflict('You are not clocked in.');
    const shift = rec.shiftId ? await StoreShift.findById(rec.shiftId).lean() : null;
    rec.checkOutAt = now;
    Object.assign(rec, hoursFor(rec.checkInAt, now, shift));
    await rec.save();
    return (await present([rec.toObject()]))[0];
}

/** GET /store/attendance/today : where the caller stands right now. */
export async function todayStatus(user) {
    const scope = await kitchenSelf(user);
    const now = new Date();
    const open = await openSession(scope.store._id, scope.me._id, now);
    const rec = open || (await StoreAttendance.findOne({ storeId: scope.store._id, staffId: scope.me._id, date: dateKeyOf(now) }).lean());
    const shift = await assignedShiftOf(scope.store._id, scope.me._id);
    return {
        state: open ? 'clocked_in' : rec?.status === 'leave' ? 'on_leave' : rec?.checkOutAt ? 'clocked_out' : rec ? 'marked' : 'not_clocked_in',
        clockedIn: !!open,
        record: rec ? (await present([rec.toObject ? rec.toObject() : rec]))[0] : null,
        shift: shift ? { _id: String(shift._id), shiftName: shift.shiftName, startTime: shift.startTime, endTime: shift.endTime } : null,
    };
}

/** GET /store/attendance/me?from=&to=&limit= : the caller's own history. */
export async function myHistory(user, query = {}) {
    const scope = await kitchenSelf(user);
    const filter = { storeId: scope.store._id, staffId: scope.me._id };   // always the caller's own
    if (query.date) filter.date = query.date;
    else if (query.from || query.to) filter.date = { ...(query.from ? { $gte: query.from } : {}), ...(query.to ? { $lte: query.to } : {}) };
    if (query.status) filter.status = query.status;
    const records = await StoreAttendance.find(filter).sort({ date: -1, checkInAt: -1 }).limit(Number(query.limit) || 100).lean();
    return present(records);
}

// ---- dashboard --------------------------------------------------------------------------------

/**
 * Today's numbers for the store dashboard widgets, from real clock-in data (not the count of active staff):
 *   staffOnDuty  clocked in right now (no clock-out yet)
 *   present      worked today (present or half day)
 *   late         of those, arrived after the shift start + grace period
 *   absent       marked absent or on leave today, plus staff whose account status is On Leave and who did not turn up
 * The people counted are the store's kitchen staff.
 */
export async function todaySummary(storeId, now = new Date()) {
    const staff = await kitchenStaffRecords(storeId);
    const ids = staff.map((s) => s._id);
    const records = await StoreAttendance.find({ storeId, date: dateKeyOf(now), staffId: { $in: ids } }).select('staffId status late checkInAt checkOutAt').lean();
    const worked = records.filter((r) => PRESENT.includes(r.status));
    const workedIds = new Set(worked.map((r) => String(r.staffId)));
    const off = new Set(records.filter((r) => !PRESENT.includes(r.status)).map((r) => String(r.staffId)));
    for (const s of staff) if (s.status === 'On Leave' && !workedIds.has(String(s._id))) off.add(String(s._id));
    return {
        staffOnDuty: worked.filter((r) => r.checkInAt && !r.checkOutAt).length,
        present: worked.length,
        late: worked.filter((r) => r.late).length,
        absent: off.size,
    };
}

/**
 * Today's kitchen team for the dashboard roster: { employee, role, shift, status } with status
 * Present / Late (worked today), Absent (marked absent or on leave, or an account on leave), or Not clocked in.
 */
export async function todayRoster(storeId, now = new Date()) {
    const staff = await kitchenStaffRecords(storeId);
    const [records, shifts] = await Promise.all([
        StoreAttendance.find({ storeId, date: dateKeyOf(now), staffId: { $in: staff.map((s) => s._id) } }).select('staffId status late').lean(),
        StoreShift.find({ storeId, status: 'active' }).select('shiftName assignedStaff').lean(),
    ]);
    const recordOf = new Map(records.map((r) => [String(r.staffId), r]));
    const shiftOf = (id) => shifts.find((sh) => (sh.assignedStaff || []).some((a) => String(a) === String(id)))?.shiftName || '-';
    return staff.map((s) => {
        const r = recordOf.get(String(s._id));
        const status = r && PRESENT.includes(r.status) ? (r.late ? 'Late' : 'Present')
            : (r || s.status === 'On Leave') ? 'Absent' : 'Not clocked in';
        return { employee: s.name, role: s.role || '', shift: shiftOf(s._id), status };
    });
}

/** Own attendance for the profile screen: { summary, logs } over the last 30 days. */
export async function profileAttendance(user) {
    const role = String(user?.role || '').replace(/-/g, '_').toUpperCase();
    if (!KITCHEN_ROLE_CODES.includes(role)) return { summary: { attendanceRate: 0, presentDays: 0, absentDays: 0, totalHours: 0, lateEntries: 0 }, logs: [] };
    const scope = await attendanceScope(user, {});
    const from = new Date(); from.setDate(from.getDate() - 29);
    const records = await StoreAttendance.find({ storeId: scope.store._id, staffId: scope.me._id, date: { $gte: dateKeyOf(from) } }).sort({ date: -1 }).lean();
    const shifts = await StoreShift.find({ _id: { $in: records.map((r) => r.shiftId).filter(Boolean) } }).select('shiftName startTime endTime').lean();
    const shiftBy = new Map(shifts.map((s) => [String(s._id), s]));
    const label = { present: 'Present', absent: 'Absent', half_day: 'Half Day', leave: 'On Leave' };
    const worked = records.filter((r) => PRESENT.includes(r.status));
    const absentDays = records.filter((r) => r.status === 'absent').length;
    const counted = worked.length + absentDays;
    return {
        summary: {
            attendanceRate: counted ? round2((worked.length / counted) * 100) : 0,
            presentDays: worked.length, absentDays,
            totalHours: round2(worked.reduce((n, r) => n + (r.totalHours || 0), 0)),
            lateEntries: worked.filter((r) => r.late).length,
        },
        logs: records.map((r) => {
            const s = shiftBy.get(String(r.shiftId));
            return {
                id: String(r._id), date: r.date, shift: s ? `${s.shiftName} (${s.startTime} - ${s.endTime})` : '-',
                checkIn: clockOf(r.checkInAt) || '-', checkOut: clockOf(r.checkOutAt) || '-', hours: `${r.totalHours || 0} hrs`,
                status: r.late && r.status === 'present' ? 'Late' : label[r.status] || r.status,
            };
        }),
    };
}
