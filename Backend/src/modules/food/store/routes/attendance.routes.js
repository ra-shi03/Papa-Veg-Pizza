import express from 'express';
import { authMiddleware } from '../../../../core/auth/auth.middleware.js';
import { requireRoles } from '../../../../core/roles/role.middleware.js';
import * as c from '../controllers/attendance.controller.js';

// Shifts and attendance, at the paths the staff screens already call (/v1/store/shifts, /v1/store/attendance).
// Guards are PER ROUTE on purpose: this router shares the /v1/store prefix with the store-manager delivery router, and
// the franchise admin also reads / marks here. Mount this one first. Kitchen staff have no login: the store manager
// clocks them in and out (docs/kitchen-staff-removal.md). Which store, and who may write, is decided in
// attendanceAccess.js from the token.
export const storeAttendanceRouter = express.Router();

const readers = [authMiddleware, requireRoles('STORE_MANAGER', 'ADMIN')];
const manager = [authMiddleware, requireRoles('STORE_MANAGER')];
const markers = [authMiddleware, requireRoles('STORE_MANAGER', 'FRANCHISE_ADMIN')];   // the franchise admin steps in when the manager is away
const team = [authMiddleware, requireRoles('STORE_MANAGER')];                        // the store manager's own clock-in and leave

// shifts: the store manager (and the franchise / super admin) read, the store manager writes
storeAttendanceRouter.get('/shifts', ...readers, c.listShifts);
storeAttendanceRouter.post('/shifts', ...manager, c.createShift);
storeAttendanceRouter.get('/shifts/:id', ...readers, c.getShift);
storeAttendanceRouter.put('/shifts/:id', ...manager, c.updateShift);
storeAttendanceRouter.delete('/shifts/:id', ...manager, c.deleteShift);
storeAttendanceRouter.post('/shifts/:id/assign', ...manager, c.assignStaff);

// leave requests: the store manager asks the franchise admin for their own leave. Kitchen staff have no login: the store
// manager records their leave (POST /attendance/leave). Requests kitchen staff made before that are still decided here.
storeAttendanceRouter.post('/leave-requests', ...team, c.requestLeave);
storeAttendanceRouter.get('/leave-requests/mine', ...team, c.myLeaveRequests);
storeAttendanceRouter.patch('/leave-requests/:id/cancel', ...team, c.cancelLeaveRequest);
storeAttendanceRouter.get('/leave-requests', ...markers, c.listLeaveRequests);
storeAttendanceRouter.patch('/leave-requests/:id/approve', ...markers, c.approveLeaveRequest);
storeAttendanceRouter.patch('/leave-requests/:id/reject', ...markers, c.rejectLeaveRequest);

// staff performance: worked out from finished kitchen orders, attendance, complaints and ratings
storeAttendanceRouter.get('/performance', authMiddleware, requireRoles('STORE_MANAGER', 'ADMIN'), c.listPerformance);
storeAttendanceRouter.get('/performance/:id', authMiddleware, requireRoles('STORE_MANAGER', 'ADMIN'), c.staffPerformance);

// attendance: the fixed paths come before /:id
storeAttendanceRouter.get('/attendance/today', ...team, c.todayStatus);
storeAttendanceRouter.get('/attendance/me', ...team, c.myHistory);
storeAttendanceRouter.post('/attendance/clock-in', ...team, c.clockIn);
storeAttendanceRouter.post('/attendance/clock-out', ...team, c.clockOut);
storeAttendanceRouter.post('/attendance/staff/:staffId/clock-in', ...manager, c.clockInStaff);    // a kitchen staff member starts work
storeAttendanceRouter.post('/attendance/staff/:staffId/clock-out', ...manager, c.clockOutStaff);  // ...and stops
storeAttendanceRouter.get('/attendance/people', ...markers, c.attendancePeople);
storeAttendanceRouter.get('/attendance', ...readers, c.listAttendance);
storeAttendanceRouter.get('/attendance/:id', ...readers, c.getAttendance);
// marks made by the manager / franchise admin (leave, absent, present on behalf); a clock-in is always the person's own
storeAttendanceRouter.post('/attendance', ...markers, c.markAttendance);
storeAttendanceRouter.post('/attendance/leave', ...markers, c.markLeave);
storeAttendanceRouter.delete('/attendance/:id', ...markers, c.deleteAttendance);
