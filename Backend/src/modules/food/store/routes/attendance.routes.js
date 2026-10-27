import express from 'express';
import { authMiddleware } from '../../../../core/auth/auth.middleware.js';
import { requireRoles } from '../../../../core/roles/role.middleware.js';
import * as c from '../controllers/attendance.controller.js';

// Shifts and attendance, at the paths the staff screens already call (/v1/store/shifts, /v1/store/attendance).
// Guards are PER ROUTE on purpose: this router shares the /v1/store prefix with the store-manager delivery router, whose
// router-wide guard would turn kitchen staff away before they reach their own clock-in. Mount this one first.
// Which store, and who may write, is decided in attendanceAccess.js from the token.
export const storeAttendanceRouter = express.Router();

const readers = [authMiddleware, requireRoles('STORE_MANAGER', 'KITCHEN_SUPERVISOR', 'KITCHEN_STAFF', 'ADMIN')];
const manager = [authMiddleware, requireRoles('STORE_MANAGER')];
const kitchen = [authMiddleware, requireRoles('KITCHEN_SUPERVISOR', 'KITCHEN_STAFF')];

// shifts: everyone in the store reads (kitchen staff only the shift they are on), the store manager writes
storeAttendanceRouter.get('/shifts', ...readers, c.listShifts);
storeAttendanceRouter.post('/shifts', ...manager, c.createShift);
storeAttendanceRouter.get('/shifts/:id', ...readers, c.getShift);
storeAttendanceRouter.put('/shifts/:id', ...manager, c.updateShift);
storeAttendanceRouter.delete('/shifts/:id', ...manager, c.deleteShift);
storeAttendanceRouter.post('/shifts/:id/assign', ...manager, c.assignStaff);

// attendance: the fixed paths come before /:id
storeAttendanceRouter.get('/attendance/today', ...kitchen, c.todayStatus);
storeAttendanceRouter.get('/attendance/me', ...kitchen, c.myHistory);
storeAttendanceRouter.post('/attendance/clock-in', ...kitchen, c.clockIn);
storeAttendanceRouter.post('/attendance/clock-out', ...kitchen, c.clockOut);
storeAttendanceRouter.post('/attendance/bulk', ...manager, c.bulkMarkAttendance);
storeAttendanceRouter.get('/attendance', ...readers, c.listAttendance);
storeAttendanceRouter.post('/attendance', ...manager, c.markAttendance);
storeAttendanceRouter.get('/attendance/:id', ...readers, c.getAttendance);
storeAttendanceRouter.put('/attendance/:id', ...manager, c.updateAttendance);
storeAttendanceRouter.delete('/attendance/:id', ...manager, c.deleteAttendance);
