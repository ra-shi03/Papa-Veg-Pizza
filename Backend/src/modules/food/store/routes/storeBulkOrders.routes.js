import express from 'express';
import { authMiddleware } from '../../../../core/auth/auth.middleware.js';
import { requireRoles } from '../../../../core/roles/role.middleware.js';
import { sendResponse } from '../../../../utils/response.js';
import * as svc from '../../orders/services/bulkOrderFlow.service.js';

// Store manager: the bulk orders placed at their own store. Mounted at /v1/food/store/bulk-orders.
const router = express.Router();
router.use(authMiddleware, requireRoles('STORE_MANAGER'));
const wrap = (message, fn, status = 200) => async (req, res, next) => {
  try {
    return sendResponse(res, status, message, await fn(req));
  } catch (err) {
    next(err);
  }
};
router.get('/', wrap('Bulk orders', (req) => svc.listForStore(req.user, req.query)));
router.get('/:id', wrap('Bulk order', async (req) => ({ order: await svc.getForStore(req.user, req.params.id) })));
router.post('/:id/confirm', wrap('Bulk order confirmed', async (req) => ({ order: await svc.storeConfirm(req.user, req.params.id, req.body) })));
router.post('/:id/reject', wrap('Bulk order declined', async (req) => ({ order: await svc.storeReject(req.user, req.params.id, req.body?.reason) })));
router.post('/:id/status', wrap('Bulk order updated', async (req) => ({ order: await svc.storeAdvance(req.user, req.params.id, req.body?.status) })));
router.get('/:id/riders', wrap('Delivery partners', async (req) => ({ riders: await svc.ridersForBulk(req.user, req.params.id) })));
router.post('/:id/assign-rider', wrap('Delivery partner assigned', async (req) => ({ order: await svc.assignRiderToBulk(req.user, req.params.id, req.body?.riderId) })));
router.post('/:id/cancel', wrap('Bulk order cancelled', async (req) => ({ order: await svc.storeCancel(req.user, req.params.id, req.body?.reason) })));
export default router;
