import mongoose from 'mongoose';
import { sendResponse } from '../../../../utils/response.js';
import { reconcileOrders, reconcileWallets, repairOrder } from '../../../../core/payments/reconciliation.service.js';
import { getLatestReport, getReportHistory, runFullReconciliation } from '../../../../core/payments/reconciliation.job.js';

// Developer > Payment Reconciliation: /food/admin/payments/reconciliation/* (super admin)

const wrap = (message, fn) => async (req, res, next) => {
  try {
    return sendResponse(res, 200, message, await fn(req, res));
  } catch (error) {
    next(error);
  }
};

// GET /payments/reconciliation: customer wallets vs their ledger
export const getWalletReconciliation = wrap('Wallet reconciliation fetched', () => reconcileWallets({}));

// GET /payments/reconciliation/orders?checkGateway=true
export const getOrderReconciliation = wrap('Order reconciliation fetched', (req) =>
  reconcileOrders({ checkGateway: String(req.query.checkGateway || '') === 'true', limit: Math.min(Number(req.query.limit) || 500, 2000) })
);

// POST /payments/reconciliation/orders/:orderId/repair
export const repairOrderFinance = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.orderId)) return res.status(400).json({ success: false, message: 'Invalid order id' });
    return sendResponse(res, 200, 'Repair finished', await repairOrder(new mongoose.Types.ObjectId(req.params.orderId)));
  } catch (error) {
    next(error);
  }
};

// GET /payments/reconciliation/report/latest?kind=full|manual
export const getLatestReconciliationReport = wrap('Latest report fetched', (req) =>
  getLatestReport(['full', 'manual'].includes(req.query.kind) ? req.query.kind : undefined)
);

// GET /payments/reconciliation/reports?limit=20
export const listReconciliationReports = wrap('Reports fetched', (req) => getReportHistory(req.query.limit));

// POST /payments/reconciliation/run
export const runReconciliationNow = async (req, res, next) => {
  try {
    const report = await runFullReconciliation('manual');
    if (!report) return res.status(409).json({ success: false, message: 'A reconciliation run is already in progress' });
    return sendResponse(res, 200, 'Reconciliation finished', report);
  } catch (error) {
    next(error);
  }
};
