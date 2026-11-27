import { sendResponse } from '../../../../utils/response.js';
import * as reports from '../services/reports.service.js';

// Super admin > Report Management: /food/admin/reports/*

const wrap = (message, fn) => async (req, res, next) => {
  try {
    return sendResponse(res, 200, message, await fn(req));
  } catch (error) {
    next(error);
  }
};

export const dailySales = wrap('Daily sales fetched', (req) => reports.getDailySalesReport(req.query?.date));
export const transactions = wrap('Transaction report fetched', (req) => reports.getTransactionReport(req.query || {}));
export const stores = wrap('Store report fetched', (req) => reports.getStoreReport(req.query || {}));
export const orders = wrap('Order report fetched', (req) => reports.getOrderReport(req.query || {}));
