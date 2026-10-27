import { StoreShift } from '../models/shift.model.js';
import { StoreAttendance } from '../models/attendance.model.js';
import { StoreManager } from '../../franchise/models/storeManager.model.js';
import { NotFoundError, ValidationError } from '../../../../core/auth/errors.js';
import { isId, toId } from '../../dashboard/services/dashboardAccess.js';
import { escapeRegex } from '../../../../utils/helpers.js';
import { attendanceScope, assertCanWrite, kitchenStaffRecords, displayNameOf, conflict } from './attendanceAccess.js';
import { parseClock, formatClock } from './attendanceTime.js';

// Shifts of one store (/v1/store/shifts). Shapes are what the shift screens render and send.

export const shiftDto = (s) => ({
    _id: String(s._id), id: String(s._id), storeId: String(s.storeId), shiftName: s.shiftName, startTime: s.startTime, endTime: s.endTime,
    breakMinutes: s.breakMinutes, maxStaff: s.maxStaff, assignedStaff: (s.assignedStaff || []).map(String), status: s.status,
    description: s.description || '', createdBy: s.createdByName || '', createdAt: s.createdAt,
});

const timesOf = (startTime, endTime) => {
    const startMinutes = parseClock(startTime); const endMinutes = parseClock(endTime);
    if (startMinutes === null || endMinutes === null) throw new ValidationError('startTime / endTime: must be a time like 09:00 AM');
    return { startTime: formatClock(startMinutes), endTime: formatClock(endMinutes), startMinutes, endMinutes };
};

async function loadShift(scope, id) {
    if (!isId(id)) throw new NotFoundError('Shift not found');
    const shift = await StoreShift.findOne({ _id: toId(id), storeId: scope.store._id });
    // kitchen staff only see the shift they are on
    if (!shift || (scope.ownOnly && !(shift.assignedStaff || []).some((s) => String(s) === String(scope.me._id)))) throw new NotFoundError('Shift not found');
    return shift;
}

/** Keeps the staff records' shift fields (shown on the staff screens) in step with the shift. */
const syncStaffShiftFields = (shift, staffIds) =>
    staffIds.length
        ? StoreManager.updateMany({ _id: { $in: staffIds } }, { $set: { 'personalDetails.shiftType': shift.shiftName, 'personalDetails.startTime': shift.startTime, 'personalDetails.endTime': shift.endTime } })
        : null;
const clearStaffShiftFields = (shiftName, staffIds) =>
    staffIds.length
        ? StoreManager.updateMany({ _id: { $in: staffIds }, 'personalDetails.shiftType': shiftName }, { $unset: { 'personalDetails.shiftType': '', 'personalDetails.startTime': '', 'personalDetails.endTime': '' } })
        : null;

export async function listShifts(user, query = {}) {
    const scope = await attendanceScope(user, query);
    const filter = { storeId: scope.store._id };
    if (scope.ownOnly) filter.assignedStaff = scope.me._id;
    if (['active', 'inactive'].includes(String(query.status))) filter.status = String(query.status);
    if (query.search) filter.shiftName = { $regex: escapeRegex(String(query.search).slice(0, 60)), $options: 'i' };
    const shifts = await StoreShift.find(filter).sort({ startMinutes: 1, shiftName: 1 }).lean();
    return shifts.map(shiftDto);
}

export async function getShift(user, id, query = {}) {
    const scope = await attendanceScope(user, query);
    return shiftDto(await loadShift(scope, id));
}

export async function createShift(user, body, query = {}) {
    const scope = await attendanceScope(user, query);
    assertCanWrite(scope);
    const times = timesOf(body.startTime, body.endTime);
    try {
        const shift = await StoreShift.create({
            storeId: scope.store._id, franchiseId: scope.store.franchiseId || null, shiftName: body.shiftName, nameKey: body.shiftName.toLowerCase(),
            ...times, breakMinutes: body.breakMinutes, maxStaff: body.maxStaff, description: body.description,
            createdBy: toId(user.userId), createdByName: await displayNameOf(user),
        });
        return shiftDto(shift);
    } catch (err) {
        if (err?.code === 11000) throw conflict('A shift with this name already exists in your store.');
        throw err;
    }
}

export async function updateShift(user, id, body, query = {}) {
    const scope = await attendanceScope(user, query);
    assertCanWrite(scope);
    const shift = await loadShift(scope, id);
    const oldName = shift.shiftName;
    if (body.shiftName !== undefined) { shift.shiftName = body.shiftName; shift.nameKey = body.shiftName.toLowerCase(); }
    if (body.startTime !== undefined || body.endTime !== undefined) Object.assign(shift, timesOf(body.startTime ?? shift.startTime, body.endTime ?? shift.endTime));
    for (const k of ['breakMinutes', 'maxStaff', 'description', 'status']) if (body[k] !== undefined) shift[k] = body[k];
    if (shift.assignedStaff.length > shift.maxStaff) throw new ValidationError(`maxStaff: ${shift.assignedStaff.length} staff are already assigned to this shift`);
    try {
        await shift.save();
    } catch (err) {
        if (err?.code === 11000) throw conflict('A shift with this name already exists in your store.');
        throw err;
    }
    // renamed or re-timed: the people on it carry the new name and hours
    if (shift.assignedStaff.length && (shift.shiftName !== oldName || body.startTime !== undefined || body.endTime !== undefined)) {
        await syncStaffShiftFields(shift, shift.assignedStaff);
    }
    return shiftDto(shift);
}

export async function deleteShift(user, id, query = {}) {
    const scope = await attendanceScope(user, query);
    assertCanWrite(scope);
    const shift = await loadShift(scope, id);
    await clearStaffShiftFields(shift.shiftName, shift.assignedStaff);
    await StoreAttendance.updateMany({ storeId: scope.store._id, shiftId: shift._id }, { $set: { shiftId: null } });   // history stays
    await shift.deleteOne();
    return { id: String(shift._id) };
}

/** POST /store/shifts/:id/assign { staffIds } : the list replaces who is on the shift; a person is on one shift at a time. */
export async function assignStaff(user, id, body, query = {}) {
    const scope = await attendanceScope(user, query);
    assertCanWrite(scope);
    const shift = await loadShift(scope, id);
    const ids = [...new Set(body.staffIds)];
    if (ids.length > shift.maxStaff) throw new ValidationError(`staffIds: this shift allows at most ${shift.maxStaff} staff`);
    // only the kitchen staff of this store; anyone else (other store, manager, unknown) is "not found"
    const staff = ids.length ? await kitchenStaffRecords(scope.store._id, { _id: { $in: ids.map(toId) } }) : [];
    if (staff.length !== ids.length) throw new NotFoundError('Staff member not found');

    const before = (shift.assignedStaff || []).map(String);
    shift.assignedStaff = ids.map(toId);
    await shift.save();
    if (ids.length) await StoreShift.updateMany({ storeId: scope.store._id, _id: { $ne: shift._id } }, { $pull: { assignedStaff: { $in: ids.map(toId) } } });
    await syncStaffShiftFields(shift, ids.map(toId));
    await clearStaffShiftFields(shift.shiftName, before.filter((s) => !ids.includes(s)).map(toId));
    return shiftDto(shift);
}
