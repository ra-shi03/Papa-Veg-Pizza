import express from 'express';
import { authMiddleware } from '../../../../core/auth/auth.middleware.js';
import { requireRoles } from '../../../../core/roles/role.middleware.js';
import * as c from '../controllers/kitchenTasks.controller.js';

const router = express.Router();

router.use(authMiddleware);
router.use(requireRoles('STORE_MANAGER', 'KITCHEN_SUPERVISOR', 'KITCHEN_STAFF'));

router.get('/', c.listMyTasks);                                // tasks assigned to me
router.get('/stats', c.myStats);                               // my counters
router.get('/team', c.teamTasks);                              // manager / supervisor: store-wide
router.get('/notifications', c.listNotifications);
router.patch('/notifications/:id/read', c.markNotificationRead);
router.patch('/:id/start', c.startTask);                       // assignee
router.patch('/:id/complete', c.completeTask);                 // assignee
router.patch('/:id/delay', c.reportDelay);                     // assignee
router.patch('/:id/request-reassign', c.requestReassign);      // assignee
router.patch('/:id/reassign', c.reassignTask);                 // manager / that order's supervisor

export default router;
