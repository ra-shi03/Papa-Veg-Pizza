import * as adminService from '../services/admin.service.js';
import * as riders from '../services/franchiseRiders.service.js';
import * as tickets from '../../delivery/services/riderTickets.service.js';
import { sendResponse } from '../../../../utils/response.js';

// /food/admin/delivery/* for delivery partner approval. attachFranchiseScope has run (super admin or franchise admin):
//   franchise admin -> its own scope (franchiseRiders.service.js): join requests, verification details, approve, reject,
//                      suspend, activate; a rider outside its scope is 404
//   super admin     -> reads everything (full detail, all join requests) and may block (suspend) / unblock (activate) any rider;
//                      approve and reject stay with the franchise admin (403)
const isFranchise = (req) => req.franchiseScope?.all === false;

const handle = (fn, message) => async (req, res, next) => {
  try {
    return sendResponse(res, 200, message, await fn(req));
  } catch (err) {
    next(err);
  }
};
const write = (fn, message) => handle((req) => (isFranchise(req) ? fn(req) : riders.superAdminReadOnly()), message);

export const joinRequests = handle(
  (req) => (isFranchise(req) ? riders.franchiseJoinRequests(req.franchiseScope, req.query) : adminService.getDeliveryJoinRequests(req.query)),
  'Delivery join requests fetched successfully',
);

export const details = async (req, res, next) => {
  try {
    const delivery = isFranchise(req)
      ? await riders.franchiseRiderDetails(req.franchiseScope, req.params.id)
      : await adminService.getDeliveryPartnerById(req.params.id);
    if (!delivery) return res.status(404).json({ success: false, message: 'Delivery partner not found' });
    return sendResponse(res, 200, 'Delivery partner fetched successfully', { delivery });
  } catch (err) {
    next(err);
  }
};

export const approve = write((req) => riders.approveRider(req.franchiseScope, req.user, req.params.id), 'Delivery partner approved');
export const reject = write((req) => riders.rejectRider(req.franchiseScope, req.user, req.params.id, req.body?.reason), 'Delivery partner rejected');
export const suspend = handle((req) => riders.suspendRider(req.franchiseScope, req.user, req.params.id, req.body?.reason), 'Delivery partner blocked');
export const activate = handle((req) => riders.activateRider(req.franchiseScope, req.user, req.params.id), 'Delivery partner unblocked');

/** PATCH /food/admin/delivery/:id with { status: 'suspended' | 'approved' } (older screens): suspend / activate; nothing else is editable here. */
export const update = handle((req) => {
  const status = String(req.body?.status || '').toLowerCase();
  if (status === 'suspended') return riders.suspendRider(req.franchiseScope, req.user, req.params.id, req.body?.rejectionReason || req.body?.reason);
  if (status === 'approved' || status === 'online' || status === 'active') return riders.activateRider(req.franchiseScope, req.user, req.params.id);
  throw Object.assign(new Error('A delivery partner\'s own details are changed by the rider in the app. Here you can approve, reject, suspend or activate.'), { statusCode: 400 });
}, 'Delivery partner updated');

/** GET / PATCH /food/admin/delivery/wallet-settings: the delivery wallet minimum (franchise admin sets; super admin reads all). */
export const walletSettings = handle((req) => riders.getWalletSettings(req.franchiseScope), 'Delivery wallet settings');
export const updateWalletSettings = handle((req) => riders.updateWalletSettings(req.franchiseScope, req.body), 'Delivery wallet minimum saved');

/** Rider tickets for the franchise admin (own franchise) and the super admin (all): list, one, reply / change status. */
const ticketActor = (req) => ({ role: req.franchiseScope?.all === false ? 'FRANCHISE_ADMIN' : 'SUPER_ADMIN', userId: req.user?.userId, name: req.user?.name || req.user?.email || '' });
export const riderTickets = handle((req) => tickets.listRiderTickets(req.franchiseScope, req.query), 'Rider tickets');
export const riderTicket = handle((req) => tickets.getRiderTicket(req.franchiseScope, req.params.id), 'Rider ticket');
export const updateRiderTicket = handle((req) => tickets.updateRiderTicket(req.franchiseScope, ticketActor(req), req.params.id, req.body), 'Ticket updated');
