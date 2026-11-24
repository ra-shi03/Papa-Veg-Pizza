import { sendResponse } from '../../../../utils/response.js';
import * as shifts from '../services/storeShifts.service.js';
import * as attendance from '../services/attendance.service.js';
import * as leave from '../services/leaveRequests.service.js';
import * as performance from '../services/staffPerformance.service.js';
import {
    validateCreateShift, validateUpdateShift, validateAssignStaff,
    validateAttendanceQuery, validateMarkAttendance,
} from '../validators/attendance.validator.js';

// Thin handlers: parse the request, call the service, answer { success, message, data }. The caller's store, role and
// user id come from req.user (the token) inside the services; only an optional ?storeId= is read from the query, and it
// has to name the caller's own store (or, for admins, one of their stores).

// A client mistake (400 / 403 / 404 / 409) is answered { success, message, error }: the screens show `message`, and the
// shared error handler's `error` stays for the callers that read it. Anything else goes to the central error handler.
const wrap = (message, status, fn) => async (req, res, next) => {
    try {
        return sendResponse(res, status, message, await fn(req));
    } catch (err) {
        if (err?.statusCode >= 400 && err.statusCode < 500) return res.status(err.statusCode).json({ success: false, message: err.message, error: err.message });
        return next(err);
    }
};
const storeQuery = (req) => ({ storeId: req.query.storeId });

// ---- shifts ----
export const listShifts = wrap('Shifts fetched', 200, (req) => shifts.listShifts(req.user, req.query));
export const getShift = wrap('Shift fetched', 200, (req) => shifts.getShift(req.user, req.params.id, storeQuery(req)));
export const createShift = wrap('Shift created', 201, (req) => shifts.createShift(req.user, validateCreateShift(req.body), storeQuery(req)));
export const updateShift = wrap('Shift updated', 200, (req) => shifts.updateShift(req.user, req.params.id, validateUpdateShift(req.body), storeQuery(req)));
export const deleteShift = wrap('Shift deleted', 200, (req) => shifts.deleteShift(req.user, req.params.id, storeQuery(req)));
export const assignStaff = wrap('Shift assignments updated', 200, (req) => shifts.assignStaff(req.user, req.params.id, validateAssignStaff(req.body), storeQuery(req)));

// ---- staff performance (store manager; franchise admin / super admin with ?storeId=) ----
export const listPerformance = wrap('Performance fetched', 200, (req) => performance.listPerformance(req.user, req.query));
export const staffPerformance = wrap('Performance fetched', 200, (req) => performance.staffPerformance(req.user, req.params.id, req.query));

// ---- attendance ----
export const listAttendance = wrap('Attendance fetched', 200, (req) => attendance.listAttendance(req.user, { ...validateAttendanceQuery(req.query), ...storeQuery(req) }));
export const getAttendance = wrap('Attendance fetched', 200, (req) => attendance.getAttendance(req.user, req.params.id, storeQuery(req)));
// ---- leave requests (kitchen staff ask, the store manager decides) ----
export const requestLeave = wrap('Leave requested', 201, (req) => leave.createLeaveRequest(req.user, req.body));
export const myLeaveRequests = wrap('Leave requests fetched', 200, (req) => leave.listMyLeaveRequests(req.user));
export const cancelLeaveRequest = wrap('Leave request cancelled', 200, (req) => leave.cancelLeaveRequest(req.user, req.params.id));
export const listLeaveRequests = wrap('Leave requests fetched', 200, (req) => leave.listLeaveRequests(req.user, req.query));
export const approveLeaveRequest = wrap('Leave approved', 200, (req) => leave.approveLeaveRequest(req.user, req.params.id, storeQuery(req)));
export const rejectLeaveRequest = wrap('Leave rejected', 200, (req) => leave.rejectLeaveRequest(req.user, req.params.id, req.body?.reason, storeQuery(req)));
export const attendancePeople = wrap('Store team fetched', 200, (req) => attendance.attendancePeople(req.user, storeQuery(req)));
export const markAttendance = wrap('Attendance marked', 201, (req) => attendance.markAttendance(req.user, validateMarkAttendance(req.body), storeQuery(req)));
export const markLeave = wrap('Leave marked', 201, (req) => attendance.markLeaveRange(req.user, req.body, storeQuery(req)));
export const deleteAttendance = wrap('Attendance deleted', 200, (req) => attendance.deleteAttendance(req.user, req.params.id, storeQuery(req)));
export const clockIn = wrap('Clocked in', 201, (req) => attendance.clockIn(req.user));
export const clockOut = wrap('Clocked out', 200, (req) => attendance.clockOut(req.user));
export const todayStatus = wrap('Today fetched', 200, (req) => attendance.todayStatus(req.user));
export const myHistory = wrap('Attendance history fetched', 200, (req) => attendance.myHistory(req.user, validateAttendanceQuery(req.query)));
