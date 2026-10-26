import express from 'express';
import { authMiddleware } from '../../../../core/auth/auth.middleware.js';
import { requireRoles } from '../../../../core/roles/role.middleware.js';
import * as c from '../controllers/kitchenOps.controller.js';

// Kitchen Operations screens (queue, preparation board, pizza / baking / packaging stations, delayed orders)
// and the My Tasks ingredient request + quality check. Mounted at /v1/food/store/kitchen.
// Every handler scopes by the token's storeId and checks the caller's role against the order / pizza itself.
const router = express.Router();

router.use(authMiddleware);
router.use(requireRoles('STORE_MANAGER', 'KITCHEN_SUPERVISOR', 'KITCHEN_STAFF'));

// Kitchen queue
router.get('/queue', c.queue);
router.post('/orders/item-reject', c.rejectItems);
router.put('/orders/:orderId/accept', c.queueOrder);                 // confirmed -> queued
router.put('/orders/:orderId/assign-chef', c.assignChef);
router.put('/orders/:orderId/ready', c.markReady);                   // packaging: sealed -> ready for pickup

// Delayed orders (manager / supervisor)
router.get('/delayed-orders', c.delayedOrders);
router.post('/orders/:orderId/escalate', c.escalateOrder);
router.put('/orders/:orderId/reassign', c.reassignOrder);
router.post('/orders/:orderId/notify-customer', c.notifyCustomer);
router.put('/orders/:orderId/resolve-delay', c.resolveDelay);

// Preparation board
router.get('/preparation-board', c.preparationBoard);
router.put('/order-item/:itemId/stage', c.moveStage);
router.put('/order-item/:itemId/pause', c.pausePrep);
router.put('/order-item/:itemId/reassign', c.reassignChefOfItem);

// Pizza station
router.get('/pizza-station', c.pizzaStation);
router.put('/pizza-station/start', c.startAssembly);
router.put('/pizza-station/pause', c.pauseAssembly);
router.put('/pizza-station/complete', c.completeAssembly);

// Baking station, ovens, kitchen issues
router.get('/baking-station', c.bakingStation);
router.get('/ovens', c.ovens);
router.put('/baking/start', c.startBaking);
router.put('/baking/move-oven', c.moveOven);
router.put('/baking/pause', c.pauseBaking);
router.put('/baking/complete', c.completeBaking);
router.get('/kitchen-issues', c.listIssues);
router.post('/kitchen-issues', c.reportIssue);

// Packaging station
router.get('/packaging', c.packaging);
router.put('/packaging/start', c.startPackaging);
router.post('/packaging/checklist', c.packagingChecklist);
router.put('/packaging/seal', c.sealPackage);

// My Tasks modals
router.post('/inventory-requests', c.requestIngredient);
router.get('/inventory-requests', c.listIngredientRequests);
router.post('/quality-checks', c.submitQualityCheck);
router.get('/quality-checks', c.listQualityChecks);

export default router;
