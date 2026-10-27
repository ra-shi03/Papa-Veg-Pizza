import express from 'express';
import { authMiddleware } from '../../../../core/auth/auth.middleware.js';
import { requireRoles } from '../../../../core/roles/role.middleware.js';
import * as c from '../controllers/storeCrm.controller.js';

// Store manager panel: customers, complaints, reviews. Store manager and kitchen supervisor (read only, contact
// details masked); kitchen staff and everyone else are refused. Each router is mounted on its own path
// (/v1/food/store/customers, /complaints, /reviews) so these checks never run for other /food/store routes.
const guard = [authMiddleware, requireRoles('STORE_MANAGER', 'KITCHEN_SUPERVISOR')];

export const customersRouter = express.Router();
customersRouter.use(...guard);
customersRouter.get('/orders', c.listCustomers);              // customers of this store + their latest order
customersRouter.get('/orders/:orderId', c.orderDetails);      // one order of this store
customersRouter.get('/:customerId', c.customerProfile);

export const complaintsRouter = express.Router();
complaintsRouter.use(...guard);
complaintsRouter.get('/', c.listComplaints);
complaintsRouter.get('/:id', c.complaintDetails);
complaintsRouter.post('/:id/respond', c.respondToComplaint);  // manager
complaintsRouter.put('/:id/resolve', c.resolveComplaint);     // manager

export const reviewsRouter = express.Router();
reviewsRouter.use(...guard);
reviewsRouter.get('/', c.listReviews);
reviewsRouter.get('/:id', c.reviewDetails);
reviewsRouter.post('/:id/reply', c.replyToReview);           // manager

// Store dashboard "Resolve" button: POST /v1/complaints/resolve { orderNumber, notes }
export const dashboardComplaintsRouter = express.Router();
dashboardComplaintsRouter.use(...guard);
dashboardComplaintsRouter.post('/resolve', c.resolveByOrderNumber);
