import express from 'express';
import { authMiddleware } from '../../../../core/auth/auth.middleware.js';
import { requireRoles } from '../../../../core/roles/role.middleware.js';
import { sendResponse } from '../../../../utils/response.js';
import { listForFranchise } from '../../orders/services/bulkOrderFlow.service.js';

// Franchise admin: view the bulk orders placed at the franchise's stores (view only). Mounted at /v1/food/franchise/bulk-orders.
const router = express.Router();
router.use(authMiddleware, requireRoles('ADMIN'));
router.get('/', async (req, res, next) => {
  try {
    return sendResponse(res, 200, 'Bulk orders', { orders: await listForFranchise(req.user, req.query) });
  } catch (err) {
    next(err);
  }
});
export default router;
