import express from 'express';
import { authMiddleware } from '../../../../core/auth/auth.middleware.js';
import { requireRoles } from '../../../../core/roles/role.middleware.js';
import * as c from '../controllers/pos.controller.js';

// Pet Pooja, one setup per store (docs/kitchen-staff-removal.md, section "Pet Pooja").

/** /v1/food/store/pos : the store manager's own store only (the store comes from the token). */
export const storePosRouter = express.Router();
storePosRouter.use(authMiddleware, requireRoles('STORE_MANAGER'));
storePosRouter.get('/petpooja', c.getSettings);
storePosRouter.put('/petpooja', c.saveSettings);
storePosRouter.post('/petpooja/test', c.testConnection);
storePosRouter.post('/petpooja/callback-key', c.rotateCallbackKey);
storePosRouter.get('/petpooja/logs', c.listLogs);
storePosRouter.post('/petpooja/logs/:id/retry', c.retryLog);

/** /v1/pos/petpooja/callback/:key : Pet Pooja's status updates. No login: the 64-character key names the store. */
export const posCallbackRouter = express.Router();
posCallbackRouter.post('/petpooja/callback/:key', c.callback);
