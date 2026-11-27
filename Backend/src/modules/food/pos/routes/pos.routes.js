import express from 'express';
import { authMiddleware } from '../../../../core/auth/auth.middleware.js';
import { requireRoles } from '../../../../core/roles/role.middleware.js';
import * as c from '../controllers/pos.controller.js';

// Pet Pooja, one setup per store (docs/kitchen-staff-removal.md, section "Pet Pooja"; API: petpooja-api-docs.pdf).

/** /v1/food/store/pos : the store manager's own store only (the store comes from the token). */
export const storePosRouter = express.Router();
storePosRouter.use(authMiddleware, requireRoles('STORE_MANAGER'));
storePosRouter.get('/petpooja', c.getSettings);
storePosRouter.put('/petpooja', c.saveSettings);
storePosRouter.post('/petpooja/test', c.testConnection);
storePosRouter.post('/petpooja/callback-key', c.rotateCallbackKey);
storePosRouter.get('/petpooja/logs', c.listLogs);
storePosRouter.post('/petpooja/logs/:id/retry', c.retryLog);
storePosRouter.get('/petpooja/menu', c.getMenu);
storePosRouter.post('/petpooja/menu/fetch', c.fetchMenu);
storePosRouter.post('/petpooja/menu/auto-map', c.autoMap);
storePosRouter.put('/petpooja/mapping', c.saveMapping);

/** /v1/pos/petpooja/... : Pet Pooja's calls. No login. */
export const posCallbackRouter = express.Router();
// Order status updates, per store: the 64-character key names the store
posCallbackRouter.post('/petpooja/callback/:key', c.callback);
// Menu, stock and store status, one set for the whole app: the app's webhook secret is in the link (posPartnerHooks.service.js)
posCallbackRouter.post('/petpooja/hooks/:secret/pushmenu', c.pushMenu);
posCallbackRouter.post('/petpooja/hooks/:secret/item_stock', c.itemStock);
posCallbackRouter.post('/petpooja/hooks/:secret/item_stock_off', c.itemStock);
posCallbackRouter.post('/petpooja/hooks/:secret/get_store_status', c.getStoreStatus);
posCallbackRouter.post('/petpooja/hooks/:secret/update_store_status', c.updateStoreStatus);
