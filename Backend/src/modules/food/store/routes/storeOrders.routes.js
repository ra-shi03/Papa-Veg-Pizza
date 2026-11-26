import express from 'express';
import { authMiddleware } from '../../../../core/auth/auth.middleware.js';
import { requireOnDuty } from '../../../../middleware/requireOnDuty.js';
import { requireRoles } from '../../../../core/roles/role.middleware.js';
import * as c from '../controllers/storeOrders.controller.js';

const router = express.Router();

router.use(authMiddleware);
router.use(requireRoles('STORE_MANAGER'));   // kitchen supervisor and kitchen staff no longer sign in (403)
router.use(requireOnDuty);   // kitchen roles: attendance first, then work (reads stay open)

router.get('/', c.listOrders);                              // ?view=incoming|active|ready|completed|cancelled
router.get('/team', c.listTeam);                            // kitchen staff of this store
router.get('/:orderId', c.getOrder);
router.patch('/:orderId/accept', c.acceptOrder);            // manager (no supervisor)
router.patch('/:orderId/reject', c.rejectOrder);            // manager
router.post('/:orderId/reorder', c.reorderOrder);          // manager: the same items again for that customer (today's prices, COD)
router.patch('/:orderId/reopen', c.reopenOrder);            // manager, within 5 minutes of the store's own cancellation
router.patch('/:orderId/assign-staff', c.assignStaff);      // manager only; the person must be active and clocked in
router.patch('/:orderId/stage', c.updateStage);             // store manager (for the station holders: kitchen staff have no login)
router.patch('/:orderId/priority', c.setPriority);          // store manager
router.patch('/:orderId/pause', c.pauseOrder);              // store manager
router.patch('/:orderId/delay', c.delayOrder);              // manager / a station holder of the order

export default router;
