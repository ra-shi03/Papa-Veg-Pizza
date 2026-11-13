import * as service from '../services/paymentGateway.service.js';
import { sendResponse } from '../../../../utils/response.js';

const actorOf = (req) => String(req.user?.email || req.user?.name || req.user?.userId || 'super admin');

const handler = (fn, message, status = 200) => async (req, res, next) => {
    try {
        return sendResponse(res, status, message, await fn(req));
    } catch (err) {
        next(err);
    }
};

export const listGateways = handler(() => service.listGateways(), 'Payment gateways');
export const listPublicGateways = handler(() => service.listPublicGateways(), 'Payment methods');
export const createGateway = handler((req) => service.createGateway(req.body || {}, actorOf(req)), 'Gateway saved', 201);
export const updateGateway = handler((req) => service.updateGateway(req.params.id, req.body || {}, actorOf(req)), 'Gateway updated');
export const setStatus = handler((req) => service.setGatewayStatus(req.params.id, req.body?.status, actorOf(req)), 'Gateway status updated');
export const makeDefault = handler((req) => service.makeDefault(req.params.id, actorOf(req)), 'Default gateway updated');
export const deleteGateway = handler((req) => service.deleteGateway(req.params.id, actorOf(req)), 'Gateway removed');
export const testGateway = handler((req) => service.testGateway(req.params.id, actorOf(req)), 'Connection test');
export const listEvents = handler((req) => service.listEvents(req.query.limit), 'Recent changes');
export const listLogs = handler((req) => service.listLogs(req.query), 'Payment logs');
export const resyncLog = handler((req) => service.resyncLog(req.params.id), 'Provider check');
