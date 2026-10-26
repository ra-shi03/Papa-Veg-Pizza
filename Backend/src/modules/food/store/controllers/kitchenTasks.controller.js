import { sendResponse } from '../../../../utils/response.js';
import * as tasks from '../services/kitchenTasks.service.js';

const wrap = (message, fn) => async (req, res, next) => {
  try {
    return sendResponse(res, 200, message, await fn(req));
  } catch (err) {
    next(err);
  }
};

export const listMyTasks = wrap('Tasks fetched', (req) => tasks.listMyTasks(req.user));
export const myStats = wrap('Task stats fetched', (req) => tasks.myTaskStats(req.user));
export const teamTasks = wrap('Team tasks fetched', (req) => tasks.teamTasks(req.user));
export const startTask = wrap('Task started', (req) => tasks.startTask(req.user, req.params.id, req.body));
export const completeTask = wrap('Task completed', (req) => tasks.completeTask(req.user, req.params.id, req.body));
export const reportDelay = wrap('Delay reported', (req) => tasks.reportDelay(req.user, req.params.id, req.body));
export const requestReassign = wrap('Handoff requested', (req) => tasks.requestReassign(req.user, req.params.id, req.body));
export const reassignTask = wrap('Task reassigned', (req) => tasks.reassignTask(req.user, req.params.id, req.body));
export const listNotifications = wrap('Notifications fetched', (req) => tasks.listNotifications(req.user));
export const markNotificationRead = wrap('Notification updated', (req) => tasks.markNotificationRead(req.user, req.params.id));
