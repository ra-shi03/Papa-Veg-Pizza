import express from 'express';
import { authMiddleware } from '../../../../core/auth/auth.middleware.js';
import { requireRoles } from '../../../../core/roles/role.middleware.js';
import { safeUpload } from '../../../../middleware/safeUpload.js';
import * as c from '../controllers/storeProfile.controller.js';

// /v1/profile/* : the store manager, kitchen supervisor and kitchen staff reading and editing their OWN profile.
export const storeProfileRouter = express.Router();
storeProfileRouter.use(authMiddleware, requireRoles('STORE_MANAGER', 'KITCHEN_SUPERVISOR', 'KITCHEN_STAFF'));

storeProfileRouter.get('/', c.getProfile);
storeProfileRouter.put('/personal', c.updatePersonal);
storeProfileRouter.put('/change-password', c.changePassword);
storeProfileRouter.post('/photo', safeUpload('image', 'file'), c.uploadPhoto);   // images only: 5 MB, checked against the file signature
storeProfileRouter.get('/permissions', c.getPermissions);
storeProfileRouter.get('/performance', c.getPerformance);
storeProfileRouter.get('/attendance', c.getAttendance);
storeProfileRouter.put('/notifications', c.updateNotifications);
storeProfileRouter.get('/activity-logs', c.getActivityLogs);
storeProfileRouter.delete('/sessions', c.deleteSessions);       // ?scope=other|all
storeProfileRouter.delete('/sessions/:id', c.deleteSession);
