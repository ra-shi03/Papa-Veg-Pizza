import { sendResponse } from '../../../../utils/response.js';
import * as svc from '../services/storeRewards.service.js';

const wrap = (message, fn, status = 200) => async (req, res, next) => {
  try {
    return sendResponse(res, status, message, await fn(req));
  } catch (err) {
    next(err);
  }
};

export const customerWalletAndRewards = wrap('Wallet and rewards', (req) => svc.customerWalletAndRewards(req.user, req.params.customerId));
export const lookupCode = wrap('Reward code', async (req) => ({ redemption: await svc.lookupRewardCode(req.user, req.params.code) }));
export const confirmCode = wrap('Reward handed over', async (req) => ({ redemption: await svc.confirmRewardCode(req.user, req.params.code) }));
export const cancelCode = wrap('Reward code cancelled', async (req) => ({ redemption: await svc.cancelRewardCode(req.user, req.params.code, req.body?.reason) }));
