import express from 'express';
import { authMiddleware } from '../../../../core/auth/auth.middleware.js';
import { requireRoles } from '../../../../core/roles/role.middleware.js';
import * as c from '../controllers/attendance.controller.js';

// Shifts and attendance, at the paths the staff screens already call (/v1/store/shifts, /v1/store/attendance).
// Guards are PER ROUTE on purpose: this router shares the /v1/store prefix with the store-manager delivery router, whose
// router-wide guard would turn kitchen staff away before they reach their own clock-in. Mount this one first.
// Which store, and who may write, is decided in attendanceAccess.js from the token.
export const storeAttendanceRouter = express.Router();

const readers = [authMiddleware, requireRoles('STORE_MANAGER', 'KITCHEN_STAFF', 'ADMIN')];
const manager = [authMiddleware, requireRoles('STORE_MANAGER')];
const markers = [authMiddleware, requireRoles('STORE_MANAGER', 'FRANCHISE_ADMIN')];   // the franchise admin steps in when the manager is away
const team = [authMiddleware, requireRoles('STORE_MANAGER', 'KITCHEN_STAFF')];       // everyone who clocks in

// shifts: everyone in the store reads (kitchen staff only the shift they are on), the store manager writes
storeAttendanceRouter.get('/shifts', ...readers, c.listShifts);
storeAttendanceRouter.post('/shifts', ...manager, c.createShift);
storeAttendanceRouter.get('/shifts/:id', ...readers, c.getShift);
storeAttendanceRouter.put('/shifts/:id', ...manager, c.updateShift);
storeAttendanceRouter.delete('/shifts/:id', ...manager, c.deleteShift);
storeAttendanceRouter.post('/shifts/:id/assign', ...manager, c.assignStaff);

// leave requests: kitchen staff ask, the store manager accepts or rejects (with a reason)
// (the store manager asks the franchise admin; kitchen staff ask the store manager, or the franchise admin when the manager is away)
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
storeAttendanceRouter.get('/attendance/people', ...markers, c.attendancePeople);
storeAttendanceRouter.get('/attendance', ...readers, c.listAttendance);
storeAttendanceRouter.get('/attendance/:id', ...readers, c.getAttendance);
// marks made by the manager / franchise admin (leave, absent, present on behalf); a clock-in is always the person's own
storeAttendanceRouter.post('/attendance', ...markers, c.markAttendance);
storeAttendanceRouter.post('/attendance/leave', ...markers, c.markLeave);
storeAttendanceRouter.delete('/attendance/:id', ...markers, c.deleteAttendance);
