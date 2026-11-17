import express from 'express';
import { authMiddleware } from '../../../../core/auth/auth.middleware.js';
import { requireRoles } from '../../../../core/roles/role.middleware.js';
import * as c from '../controllers/storeRewards.controller.js';

// Store manager only (the service checks it again): a customer's wallet and rewards, and reward codes.
// Mounted at /v1/food/store/rewards.
const router = express.Router();
router.use(authMiddleware, requireRoles('STORE_MANAGER'));
router.get('/customers/:customerId', c.customerWalletAndRewards);
router.get('/codes/:code', c.lookupCode);
router.post('/codes/:code/confirm', c.confirmCode);
router.post('/codes/:code/cancel', c.cancelCode);
export default router;
