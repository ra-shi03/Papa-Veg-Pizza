import express from 'express';
import { requireOnDuty } from '../../../../middleware/requireOnDuty.js';
import { authMiddleware } from '../../../../core/auth/auth.middleware.js';
import { requireRoles } from '../../../../core/roles/role.middleware.js';
import { sendResponse } from '../../../../utils/response.js';
import { ValidationError } from '../../../../core/auth/errors.js';
import * as service from '../services/storeOpenStatus.service.js';

// /v1/food/store/open-status : the store manager's Open / Closed switch for their own store.
const router = express.Router();
router.use(authMiddleware, requireRoles('STORE_MANAGER'), requireOnDuty);   // attendance first, then work

router.get('/', async (req, res, next) => {
  try {
    return sendResponse(res, 200, 'Store status fetched', await service.getOpenStatus(req.user));
  } catch (err) { next(err); }
});

router.put('/', async (req, res, next) => {
  try {
    const hasBoolOpen = typeof req.body?.open === 'boolean';
    const hasTimes = Boolean(req.body?.openTime && req.body?.closeTime);
    if (!hasBoolOpen && !hasTimes) {
      throw new ValidationError('open: send true (open) or false (closed), or openTime and closeTime');
    }
    const data = await service.setOpenStatus(req.user, req.body);
    const msg = hasTimes
      ? `Store hours updated to ${data.storeTiming}`
      : (data.switchOn ? 'Store is open' : 'Store is closed');
    return sendResponse(res, 200, msg, data);
  } catch (err) { next(err); }
});

export default router;
