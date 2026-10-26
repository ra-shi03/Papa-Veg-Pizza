import { sendResponse } from '../../../../utils/response.js';
import * as items from '../services/kitchenItems.service.js';
import * as ops from '../services/kitchenOps.service.js';

const wrap = (message, fn, status = 200) => async (req, res, next) => {
  try {
    return sendResponse(res, status, message, await fn(req));
  } catch (err) {
    next(err);
  }
};

// Kitchen queue
export const queue = wrap('Kitchen queue fetched', (req) => ops.kitchenQueue(req.user, req.query));
export const queueOrder = wrap('Order queued', (req) => ops.queueOrder(req.user, req.params.orderId));
export const assignChef = wrap('Chef assigned', (req) => ops.assignChef(req.user, req.params.orderId, req.body));
export const rejectItems = wrap('Items rejected', (req) => ops.rejectItems(req.user, req.body));

// Delayed orders
export const delayedOrders = wrap('Delayed orders fetched', (req) => ops.delayedOrders(req.user, req.query));
export const escalateOrder = wrap('Escalation created', (req) => ops.escalateOrder(req.user, req.params.orderId, req.body), 201);
export const reassignOrder = wrap('Staff reassigned', (req) => ops.reassignOrderStaff(req.user, req.params.orderId, req.body));
export const notifyCustomer = wrap('Customer notified', (req) => ops.notifyCustomer(req.user, req.params.orderId, req.body));
export const resolveDelay = wrap('Delay resolved', (req) => ops.resolveDelay(req.user, req.params.orderId, req.body));

// Preparation board
export const preparationBoard = wrap('Preparation board fetched', (req) => items.preparationBoard(req.user, req.query));
export const moveStage = wrap('Stage updated', (req) => items.moveItemStage(req.user, req.params.itemId, req.body?.stage));
export const pausePrep = wrap('Preparation updated', (req) => items.togglePausePrep(req.user, req.params.itemId, req.body));
export const reassignChefOfItem = wrap('Chef reassigned', (req) => items.reassignItemChef(req.user, req.params.itemId, req.body?.chefId));

// Pizza station
export const pizzaStation = wrap('Pizza station fetched', (req) => items.pizzaStation(req.user, req.query));
export const startAssembly = wrap('Assembly started', (req) => items.startAssembly(req.user, req.body?.orderItemId));
export const pauseAssembly = wrap('Assembly paused', (req) => items.pauseAssembly(req.user, req.body?.orderItemId, req.body));
export const completeAssembly = wrap('Assembly completed', (req) => items.completeAssembly(req.user, req.body?.orderItemId, req.body));

// Baking station, ovens, issues
export const bakingStation = wrap('Baking station fetched', (req) => items.bakingStation(req.user, req.query));
export const ovens = wrap('Ovens fetched', (req) => items.listOvens(req.user, req.query));
export const startBaking = wrap('Baking started', (req) => items.startBaking(req.user, req.body));
export const moveOven = wrap('Oven changed', (req) => items.moveOven(req.user, req.body));
export const pauseBaking = wrap('Baking paused', (req) => items.pauseBaking(req.user, req.body));
export const completeBaking = wrap('Baking completed', (req) => items.completeBaking(req.user, req.body));
export const listIssues = wrap('Kitchen issues fetched', (req) => items.listIssues(req.user));
export const reportIssue = wrap('Issue reported', (req) => items.reportIssue(req.user, req.body), 201);

// Packaging station
export const packaging = wrap('Packaging orders fetched', (req) => ops.packagingOrders(req.user, req.query));
export const startPackaging = wrap('Packaging started', (req) => ops.startPackaging(req.user, req.body));
export const packagingChecklist = wrap('Checklist saved', (req) => ops.packagingChecklist(req.user, req.body));
export const sealPackage = wrap('Package sealed', (req) => ops.sealPackage(req.user, req.body));
export const markReady = wrap('Order ready for pickup', (req) => ops.markReady(req.user, req.params.orderId));

// My Tasks
export const requestIngredient = wrap('Ingredient request submitted.', (req) => ops.requestIngredient(req.user, req.body), 201);
export const listIngredientRequests = wrap('Ingredient requests fetched', (req) => ops.listIngredientRequests(req.user));
export const submitQualityCheck = wrap('Quality check approved and submitted.', (req) => ops.submitQualityCheck(req.user, req.body), 201);
export const listQualityChecks = wrap('Quality checks fetched', (req) => ops.listQualityChecks(req.user));
