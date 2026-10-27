import express from 'express';
import { authMiddleware } from '../../../../core/auth/auth.middleware.js';
import { requireRoles } from '../../../../core/roles/role.middleware.js';
import * as c from '../controllers/storeDelivery.controller.js';

// Store manager delivery screens, at the paths they already call (/v1/store/...). Which store, and who may write,
// is decided in storeDelivery.service.js from the token.
export const storeDeliveryRouter = express.Router();
storeDeliveryRouter.use(authMiddleware, requireRoles('STORE_MANAGER', 'KITCHEN_SUPERVISOR', 'ADMIN'));
storeDeliveryRouter.get('/riders', c.riders);
storeDeliveryRouter.get('/rider/:id', c.rider);
storeDeliveryRouter.get('/orders/ready', c.readyOrders);
storeDeliveryRouter.post('/orders/:orderId/refund', c.requestRefund);
storeDeliveryRouter.get('/tracking/:orderId', c.tracking);
storeDeliveryRouter.get('/delivery/live', c.liveDeliveries);
storeDeliveryRouter.get('/delivery/available-riders', c.availableRiders);
storeDeliveryRouter.post('/delivery/assign', c.assign);
storeDeliveryRouter.get('/delivery/timeline/:orderId', c.timeline);
storeDeliveryRouter.get('/delivery/issues', c.issues);
storeDeliveryRouter.post('/delivery/issues', c.createIssue);
storeDeliveryRouter.patch('/delivery/issues/:id', c.updateIssue);

// Delivery app: service zones around the rider (GET /v1/food/zones/nearby)
export const zonesRouter = express.Router();
zonesRouter.get('/nearby', authMiddleware, requireRoles('DELIVERY_PARTNER'), c.nearbyZones);
