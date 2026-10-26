import express from 'express';
import { authMiddleware } from '../../../../core/auth/auth.middleware.js';
import { requireRoles } from '../../../../core/roles/role.middleware.js';
import * as c from '../controllers/storeOrders.controller.js';

const router = express.Router();

router.use(authMiddleware);
router.use(requireRoles('STORE_MANAGER', 'KITCHEN_SUPERVISOR', 'KITCHEN_STAFF'));

router.get('/', c.listOrders);                              // ?view=incoming|active|ready|completed|cancelled
router.get('/team', c.listTeam);                            // supervisors + kitchen staff of this store
router.get('/:orderId', c.getOrder);
router.patch('/:orderId/accept', c.acceptOrder);            // manager -> picks the kitchen supervisor
router.patch('/:orderId/reject', c.rejectOrder);            // manager
router.patch('/:orderId/assign-staff', c.assignStaff);      // manager / that order's supervisor
router.patch('/:orderId/stage', c.updateStage);             // assigned staff / supervisor / manager
router.patch('/:orderId/priority', c.setPriority);          // manager / supervisor
router.patch('/:orderId/pause', c.pauseOrder);              // manager / that order's supervisor
router.patch('/:orderId/delay', c.delayOrder);              // manager / that order's supervisor

export default router;
