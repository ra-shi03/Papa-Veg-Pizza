import { sendResponse } from '../../../../utils/response.js';
import * as svc from '../services/storeDelivery.service.js';

const handle = (fn, message = 'OK', status = 200) => async (req, res, next) => {
  try {
    return sendResponse(res, status, message, await fn(req));
  } catch (err) {
    next(err);
  }
};
const q = (req) => req.query || {};

export const riders = handle((req) => svc.listRiders(req.user, q(req)));
export const rider = handle((req) => svc.riderDetails(req.user, req.params.id, q(req)));
export const availableRiders = handle((req) => svc.availableRiders(req.user, q(req)));
export const readyOrders = handle((req) => svc.readyOrders(req.user, q(req)));
export const liveDeliveries = handle((req) => svc.liveDeliveries(req.user, q(req)));
export const tracking = handle((req) => svc.tracking(req.user, req.params.orderId, q(req)));
export const timeline = handle((req) => svc.timeline(req.user, req.params.orderId, q(req)));
export const assign = handle((req) => svc.assignRider(req.user, req.body, q(req)), 'Rider assigned successfully.');
export const requestRefund = handle((req) => svc.requestOrderRefund(req.user, req.params.orderId, req.body, q(req)), 'Refund request recorded', 201);
export const issues = handle((req) => svc.listIssues(req.user, q(req)));
export const createIssue = handle((req) => svc.createIssue(req.user, req.body, q(req)), 'Issue reported', 201);
export const updateIssue = handle((req) => svc.updateIssue(req.user, req.params.id, req.body, q(req)), 'Issue updated');
export const nearbyZones = handle((req) => svc.nearbyZones(q(req)));
