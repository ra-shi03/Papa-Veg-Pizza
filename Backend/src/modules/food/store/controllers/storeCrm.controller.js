import { sendResponse } from '../../../../utils/response.js';
import * as crm from '../services/storeCrm.service.js';

const wrap = (message, fn) => async (req, res, next) => {
  try {
    return sendResponse(res, 200, message, await fn(req));
  } catch (err) {
    next(err);
  }
};

// Customers & orders
export const listCustomers = wrap('Customers fetched', (req) => crm.listCustomers(req.user, req.query));
export const customerProfile = wrap('Customer fetched', (req) => crm.customerProfile(req.user, req.params.customerId));
export const orderDetails = wrap('Order fetched', (req) => crm.orderDetails(req.user, req.params.orderId));

// Complaints
export const listComplaints = wrap('Complaints fetched', (req) => crm.listComplaints(req.user, req.query));
export const complaintDetails = wrap('Complaint fetched', (req) => crm.complaintDetails(req.user, req.params.id));
export const respondToComplaint = wrap('Response sent', (req) => crm.respondToComplaint(req.user, req.params.id, req.body));
export const resolveComplaint = wrap('Complaint resolved', (req) => crm.resolveComplaint(req.user, req.params.id, req.body));

// Reviews
export const listReviews = wrap('Reviews fetched', (req) => crm.listReviews(req.user, req.query));
export const reviewDetails = wrap('Review fetched', (req) => crm.reviewDetails(req.user, req.params.id));
export const replyToReview = wrap('Reply published', (req) => crm.replyToReview(req.user, req.params.id, req.body));
