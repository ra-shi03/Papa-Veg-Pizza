import express from 'express';
import { authMiddleware } from '../../../../core/auth/auth.middleware.js';
import { requireRoles } from '../../../../core/roles/role.middleware.js';
import { sendResponse } from '../../../../utils/response.js';
import * as overview from '../services/franchiseOverview.service.js';

// Franchise admin, across its own stores. Mounted at /v1/food/franchise/overview.
const router = express.Router();
router.use(authMiddleware, requireRoles('FRANCHISE_ADMIN'));

const send = (fn, message = 'OK') => async (req, res, next) => {
  try {
    return sendResponse(res, 200, message, await fn(req));
  } catch (err) {
    next(err);
  }
};

router.get('/stock', send((req) => overview.stock(req.user, req.query)));
router.get('/alerts', send((req) => overview.alerts(req.user, req.query)));
router.get('/restock-requests', send((req) => overview.restockRequests(req.user, req.query)));
router.patch('/restock-requests/:id', send((req) => overview.decideRestock(req.user, req.params.id, req.body), 'Restock request answered'));
router.get('/customers', send((req) => overview.customers(req.user, req.query)));
router.get('/loyalty', send((req) => overview.loyalty(req.user, req.query)));
router.get('/reviews', send((req) => overview.reviews(req.user, req.query)));
router.get('/order-issues', send((req) => overview.orderIssues(req.user, req.query)));

export default router;
