import { StoreAttendance } from '../models/attendance.model.js';
import { ValidationError } from '../../../../core/auth/errors.js';
import { dateKeyOf } from './attendanceTime.js';

// "Present" = clocked in (or marked present by the store manager) and not clocked out yet. The same rule as the
// requireOnDuty middleware, so nobody can be given work that they could not themselves act on.
const ON_DUTY = ['present', 'half_day'];
const OPEN_SESSION_HOURS = 20;

/** Set of StoreManager _id (as strings) that are on duty right now, among `staffIds`. */
export async function onDutyStaffIds(storeId, staffIds, now = new Date()) {
  if (!staffIds?.length) return new Set();
  const rows = await StoreAttendance.find({
    storeId,
    staffId: { $in: staffIds },
    status: { $in: ON_DUTY },
    checkOutAt: null,
    $or: [{ date: dateKeyOf(now) }, { checkInAt: { $gte: new Date(now.getTime() - OPEN_SESSION_HOURS * 3600000) } }],
  }).select('staffId').lean();
  return new Set(rows.map((r) => String(r.staffId)));
}

/** Throws unless the StoreManager record `member` is on duty. Absent, on leave, not clocked in or clocked out all fail. */
export async function requirePresent(storeId, member) {
  const on = await onDutyStaffIds(storeId, [member._id]);
  if (!on.has(String(member._id))) {
    throw new ValidationError(`${member.name} is not present today. Only staff who have clocked in can be assigned.`);
  }
}
