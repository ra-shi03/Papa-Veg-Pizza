import * as settings from '../services/posIntegration.service.js';
import * as menu from '../services/posMenu.service.js';
import * as hooks from '../services/posPartnerHooks.service.js';
import { handleCallback } from '../services/posCallback.service.js';
import { validatePosBody } from '../validators/pos.validator.js';
import { sendResponse } from '../../../../utils/response.js';
import { logger } from '../../../../utils/logger.js';

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

// Store manager: Pet Pooja menu and item mapping
export const getMenu = handle('Pet Pooja menu and mapping', (req) => menu.getMenu(req.user));
export const fetchMenu = handle('Pet Pooja menu fetched', (req) => menu.fetchMenu(req.user));
export const autoMap = handle('Items mapped by name', (req) => menu.autoMap(req.user));
export const saveMapping = handle('Item mapping saved', (req) => menu.saveMapping(req.user, validatePosBody('mapping', req.body).entries));

// Pet Pooja -> us (no login: the key in the link is the store's secret)
export const callback = handle('Status update received', (req) => handleCallback(req.params.key, validatePosBody('callback', req.body)));

// Pet Pooja -> us: menu, stock, store status (the store's secret key in the link). Answers in Pet Pooja's shapes.
const hook = (fn) => async (req, res, next) => {
  let scope;
  try {
    scope = await hooks.resolveHookKey(req.params.secret);
  } catch (err) {
    return next(err);
  }
  try {
    const out = await fn(req.body || {}, scope);
    return res.status(out.code).json(out.body);
  } catch (err) {
    logger.error(`Pet Pooja hook ${req.path.split('/').pop()} failed: ${err.message}`);
    return res.status(500).json({ success: '0', status: 'failed', message: 'Could not process the request' });
  }
};
export const pushMenu = hook(hooks.pushMenu);
export const itemStock = hook(hooks.itemStock);
export const getStoreStatus = hook(hooks.getStoreStatus);
export const updateStoreStatus = hook(hooks.updateStoreStatus);
