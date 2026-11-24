import { sendResponse } from '../../../../utils/response.js';
import * as ops from '../services/storeOrders.service.js';
import { reorderForCustomer } from '../services/storeReorder.service.js';

const wrap = (fn) => async (req, res, next) => {
  try {
    const result = await fn(req);
    return sendResponse(res, 200, 'OK', result);
  } catch (err) {
    next(err);
  }
};

export const listOrders = wrap((req) => ops.listStoreOrders(req.user, req.query));
export const getOrder = wrap((req) => ops.getStoreOrder(req.user, req.params.orderId));
export const listTeam = wrap((req) => ops.listTeam(req.user, req.query));
export const acceptOrder = wrap((req) => ops.acceptOrder(req.user, req.params.orderId, req.body));
export const rejectOrder = wrap((req) => ops.rejectOrder(req.user, req.params.orderId, req.body));
// Completed Orders -> Reorder: the same items again for the same customer, today's prices, cash on delivery (manager only)
export const reorderOrder = async (req, res, next) => {
  try {
    const { message, order } = await reorderForCustomer(req.user, req.params.orderId, req.body);
    return sendResponse(res, 201, message, order);
  } catch (err) {
    next(err);
  }
};
export const reopenOrder = wrap((req) => ops.reopenOrder(req.user, req.params.orderId, req.body));
export const assignStaff = wrap((req) => ops.assignStaff(req.user, req.params.orderId, req.body));
export const updateStage = wrap((req) => ops.updateKitchenStage(req.user, req.params.orderId, req.body));
export const pauseOrder = wrap((req) => ops.setPaused(req.user, req.params.orderId, req.body));
export const delayOrder = wrap((req) => ops.logDelay(req.user, req.params.orderId, req.body));
export const setPriority = wrap((req) => ops.setPriority(req.user, req.params.orderId, req.body?.priority));

// Franchise admin: read-only view of every order across their stores (superadmin may pass ?franchiseId=).
export const listFranchiseOrders = wrap((req) => {
  const isSuper = ['SUPERADMIN', 'SUPER_ADMIN'].includes(ops.normalizeRole(req.user?.role));
  const user = isSuper && req.query.franchiseId ? { ...req.user, franchiseId: req.query.franchiseId } : req.user;
  return ops.listFranchiseOrders(user, req.query);
});
