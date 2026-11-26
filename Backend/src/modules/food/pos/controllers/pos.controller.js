import * as settings from '../services/posIntegration.service.js';
import { handleCallback } from '../services/posCallback.service.js';
import { validatePosBody } from '../validators/pos.validator.js';
import { sendResponse } from '../../../../utils/response.js';

const handle = (message, fn, status = 200) => async (req, res, next) => {
  try {
    return sendResponse(res, status, message, await fn(req));
  } catch (err) {
    return next(err);
  }
};

// Store manager: the store's own Pet Pooja
export const getSettings = handle('Pet Pooja settings', (req) => settings.getSettings(req.user, settings.publicBase(req)));
export const saveSettings = handle('Pet Pooja settings saved', (req) => settings.saveSettings(req.user, validatePosBody('settings', req.body), settings.publicBase(req)));
export const testConnection = handle('Pet Pooja connection checked', (req) => settings.testConnection(req.user, settings.publicBase(req)));
export const rotateCallbackKey = handle('New callback link made', (req) => settings.rotateCallbackKey(req.user, settings.publicBase(req)));
export const listLogs = handle('Pet Pooja sync log', (req) => settings.listLogs(req.user, req.query));
export const retryLog = handle('Sent again', (req) => settings.retryLog(req.user, req.params.id));

// Pet Pooja -> us (no login: the key in the link is the store's secret)
export const callback = handle('Status update received', (req) => handleCallback(req.params.key, validatePosBody('callback', req.body)));
