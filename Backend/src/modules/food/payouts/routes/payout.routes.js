import express from 'express';
import { requireOnDuty } from '../../../../middleware/requireOnDuty.js';
import { authMiddleware } from '../../../../core/auth/auth.middleware.js';
import { requireRoles } from '../../../../core/roles/role.middleware.js';
import * as c from '../controllers/payout.controller.js';

// Payouts (see models/payout.model.js). One router per panel, each mounted on its own path in routes/index.js;
// the role is checked here and the scope (own store / franchise / rider) in the service, from the token only.

/** /v1/food/delivery/payouts : the rider's balance per store, requests, "not received". */
export const riderPayoutsRouter = express.Router();
riderPayoutsRouter.use(authMiddleware, requireRoles('DELIVERY_PARTNER'));
riderPayoutsRouter.get('/', c.riderDesk);
riderPayoutsRouter.post('/', c.riderRequest);
riderPayoutsRouter.post('/:id/not-received', c.notReceived);

/** /v1/food/store/payouts : store manager. */
export const storePayoutsRouter = express.Router();
storePayoutsRouter.use(authMiddleware, requireRoles('STORE_MANAGER'), requireOnDuty);
storePayoutsRouter.get('/', c.storeDesk);
storePayoutsRouter.get('/staff', c.storeStaff);
storePayoutsRouter.post('/request', c.storeRequest);
storePayoutsRouter.put('/account', c.storeAccount);
storePayoutsRouter.post('/salaries', c.recordSalary);
storePayoutsRouter.put('/staff/:staffId/account', c.staffAccount);   // kitchen staff have no login: the manager keeps their bank / UPI details
storePayoutsRouter.post('/:id/pay', c.pay);
storePayoutsRouter.post('/:id/reject', c.reject);
storePayoutsRouter.post('/:id/not-received', c.notReceived);

/**
 * /v1/food/store/my-salary : retired (410). Kitchen staff have no login since 2026-11-26 (docs/kitchen-staff-removal.md):
 * the store manager records their salary and keeps their payout details (/v1/food/store/payouts).
 */
export const mySalaryRouter = express.Router();
mySalaryRouter.use((req, res) => res.status(410).json({
  success: false,
  error: 'Kitchen staff no longer sign in. The store manager records salaries and payout details.',
  message: 'Kitchen staff no longer sign in. The store manager records salaries and payout details.',
}));

/** /v1/food/franchise/payouts : franchise admin (the service refuses the super admin here). */
export const franchisePayoutsRouter = express.Router();
franchisePayoutsRouter.use(authMiddleware, requireRoles('FRANCHISE_ADMIN'));
franchisePayoutsRouter.get('/', c.franchiseDesk);
franchisePayoutsRouter.post('/request', c.franchiseRequest);
franchisePayoutsRouter.put('/account', c.franchiseAccount);
franchisePayoutsRouter.post('/:id/pay', c.pay);
franchisePayoutsRouter.post('/:id/reject', c.reject);
franchisePayoutsRouter.post('/:id/not-received', c.notReceived);
franchisePayoutsRouter.post('/:id/resolve-dispute', c.resolveDispute);

/** /v1/food/admin/payouts : super admin. */
export const platformPayoutsRouter = express.Router();
platformPayoutsRouter.use(authMiddleware, requireRoles('SUPERADMIN'));
platformPayoutsRouter.get('/', c.platformDesk);
platformPayoutsRouter.post('/:id/pay', c.pay);
platformPayoutsRouter.post('/:id/reject', c.reject);
platformPayoutsRouter.post('/:id/resolve-dispute', c.resolveDispute);
