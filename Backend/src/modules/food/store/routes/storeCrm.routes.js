import express from 'express';
import { authMiddleware } from '../../../../core/auth/auth.middleware.js';
import { requireRoles } from '../../../../core/roles/role.middleware.js';
import * as c from '../controllers/storeCrm.controller.js';
import * as riderTickets from '../../delivery/services/riderTickets.service.js';

// Store manager panel: customers, complaints, reviews. Store manager only; kitchen staff and everyone else are refused. Each router is mounted on its own path
// (/v1/food/store/customers, /complaints, /reviews) so these checks never run for other /food/store routes.
// Customers are also readable by a franchise admin (own franchise's stores) and the super admin, via ?storeId=.
const guard = [authMiddleware, requireRoles('STORE_MANAGER')];

export const customersRouter = express.Router();
customersRouter.use(authMiddleware, requireRoles('STORE_MANAGER', 'ADMIN'));
customersRouter.get('/orders', c.listCustomers);              // customers of this store + their latest order
customersRouter.get('/orders/:orderId', c.orderDetails);      // one order of this store
customersRouter.get('/:customerId', c.customerProfile);

export const complaintsRouter = express.Router();
complaintsRouter.use(...guard);
complaintsRouter.get('/', c.listComplaints);
complaintsRouter.get('/:id', c.complaintDetails);
complaintsRouter.post('/:id/respond', c.respondToComplaint);  // manager
complaintsRouter.put('/:id/resolve', c.resolveComplaint);     // manager

// Rider tickets: what the delivery partners of this store raised in the delivery app. Store manager only; the store comes from the token.
export const riderTicketsRouter = express.Router();
riderTicketsRouter.use(...guard);
const wrapTickets = (fn) => async (req, res, next) => {
  try {
    const scope = { storeId: req.user.storeId };
    const data = await fn(scope, { role: 'STORE_MANAGER', userId: req.user.userId, name: req.user.name || '' }, req);
    return res.status(200).json({ success: true, message: 'Rider tickets', data });
  } catch (err) { next(err); }
};
riderTicketsRouter.get('/', wrapTickets((scope, _a, req) => riderTickets.listRiderTickets(scope, req.query)));
riderTicketsRouter.get('/:id', wrapTickets((scope, _a, req) => riderTickets.getRiderTicket(scope, req.params.id)));
riderTicketsRouter.patch('/:id', wrapTickets((scope, actor, req) => riderTickets.updateRiderTicket(scope, actor, req.params.id, req.body)));

export const reviewsRouter = express.Router();
reviewsRouter.use(...guard);
reviewsRouter.get('/', c.listReviews);
reviewsRouter.get('/:id', c.reviewDetails);
reviewsRouter.post('/:id/reply', c.replyToReview);           // manager

// Store dashboard "Resolve" button: POST /v1/complaints/resolve { orderNumber, notes }
export const dashboardComplaintsRouter = express.Router();
dashboardComplaintsRouter.use(...guard);
dashboardComplaintsRouter.post('/resolve', c.resolveByOrderNumber);
