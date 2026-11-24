import { sendResponse } from '../../../../utils/response.js';
import { validatePayoutBody as body } from '../validators/payout.validator.js';
import * as svc from '../services/payout.service.js';

const handle = (message, fn, status = 200) => async (req, res, next) => {
  try {
    return sendResponse(res, status, message, await fn(req));
  } catch (err) {
    next(err);
  }
};

// Rider (delivery app)
export const riderDesk = handle('Payouts', (req) => svc.riderPayouts(req.user.userId));
export const riderRequest = handle('Withdrawal requested', async (req) => ({ requests: await svc.requestRiderWithdrawals(req.user.userId, body('riderRequest', req.body)) }), 201);

// Store manager
export const storeDesk = handle('Payouts', (req) => svc.storePayoutDesk(req.user, req.query));
export const storeStaff = handle('Staff salaries', async (req) => ({ staff: await svc.storeStaffSalaries(req.user) }));
export const storeRequest = handle('Payout requested from the franchise', async (req) => ({ payout: await svc.requestStorePayout(req.user, body('request', req.body)) }), 201);
export const storeAccount = handle('Payout account saved', async (req) => ({ account: await svc.saveStoreAccount(req.user, body('account', req.body)) }));
export const recordSalary = handle('Salary recorded as paid', async (req) => ({ payout: await svc.recordStaffSalary(req.user, body('salary', req.body)) }), 201);

// Kitchen staff
export const myDesk = handle('My salary', (req) => svc.mySalary(req.user));
export const myAccount = handle('Payout account saved', async (req) => ({ account: await svc.saveMyStaffAccount(req.user, body('account', req.body)) }));
export const myRequest = handle('Salary requested', async (req) => ({ payout: await svc.requestMySalary(req.user, body('staffRequest', req.body)) }), 201);

// Franchise admin
export const franchiseDesk = handle('Payouts', (req) => svc.franchisePayoutDesk(req.user, req.query));
export const franchiseRequest = handle('Payout requested from the platform', async (req) => ({ payout: await svc.requestFranchisePayout(req.user, body('request', req.body)) }), 201);
export const franchiseAccount = handle('Payout account saved', async (req) => ({ account: await svc.saveFranchiseAccount(req.user, body('account', req.body)) }));

// Super admin
export const platformDesk = handle('Payouts', (req) => svc.platformPayoutDesk(req.user, req.query));

// Shared actions (each checks the caller's role and scope)
export const pay = handle('Marked as paid', async (req) => ({ payout: await svc.payPayout(req.user, req.params.id, body('pay', req.body)) }));
export const reject = handle('Request rejected', async (req) => ({ payout: await svc.rejectPayout(req.user, req.params.id, body('reject', req.body)) }));
export const notReceived = handle('Reported as not received', async (req) => ({ payout: await svc.reportNotReceived(req.user, req.params.id, body('notReceived', req.body)) }));
export const resolveDispute = handle('Report decided', async (req) => ({ payout: await svc.resolveDispute(req.user, req.params.id, body('resolve', req.body)) }));
