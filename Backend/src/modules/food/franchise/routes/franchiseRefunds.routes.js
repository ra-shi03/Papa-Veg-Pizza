import express from 'express';
import { authMiddleware } from '../../../../core/auth/auth.middleware.js';
import { requireRoles } from '../../../../core/roles/role.middleware.js';
import { sendResponse } from '../../../../utils/response.js';
import * as svc from '../services/franchiseRefunds.service.js';

// Franchise admin: wallet refunds the franchise's store managers asked for. Mounted at /v1/food/franchise/refunds.
const router = express.Router();
router.use(authMiddleware, requireRoles('ADMIN'));
const wrap = (message, fn) => async (req, res, next) => {
  try {
    return sendResponse(res, 200, message, await fn(req));
  } catch (err) {
    next(err);
  }
};
router.get('/', wrap('Refund requests', async (req) => ({ refunds: await svc.listStoreRefunds(req.user, req.query) })));
router.post('/:id/approve', wrap('Refund approved and credited to the wallet', async (req) => ({ refund: await svc.approveStoreRefund(req.user, req.params.id) })));
router.post('/:id/reject', wrap('Refund rejected', async (req) => ({ refund: await svc.rejectStoreRefund(req.user, req.params.id, req.body?.reason) })));
export default router;
