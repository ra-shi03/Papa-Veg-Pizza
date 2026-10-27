import { sendResponse } from '../../../../utils/response.js';
import * as perf from '../services/storePerformance.service.js';
import * as hours from '../services/operatingHours.service.js';
import * as pricing from '../services/storePricing.service.js';
import * as details from '../services/storeDetails.service.js';

// Store performance, operating hours, store pricing and store details (franchise admin screens).
// Role and scope are decided in the services (storeAccess.js) from the token.

const handle = (fn, message = 'OK') => async (req, res, next) => {
  try {
    return sendResponse(res, 200, message, await fn(req));
  } catch (err) {
    next(err);
  }
};
const read = (fn) => handle((req) => fn(req.user, req.query || {}));
const readOne = (fn, param = 'storeId') => handle((req) => fn(req.user, req.params[param], req.query || {}));
const EXPORT_MESSAGE = 'Report export started. Your file will download automatically.';

// /v1/store-performance
export const performanceDashboard = read(perf.dashboard);
export const performanceRevenue = read(perf.revenueTrends);
export const performanceOrders = read(perf.orderTrends);
export const performanceRatings = read(perf.ratingTrends);
export const performanceComparison = read(perf.comparison);
export const performanceBusyHours = read(perf.busyHours);
export const performanceList = read(perf.list);
export const performanceCompare = read(perf.compare);
export const performanceExport = handle((req) => perf.exportReport(req.user, req.query || {}), EXPORT_MESSAGE);
export const storePerformance = {
  revenue: readOne(perf.storeRevenue),
  orders: readOne(perf.storeOrders),
  ratings: readOne(perf.storeRatings),
  inventory: readOne(perf.storeInventory),
  products: readOne(perf.storeProducts),
  staff: readOne(perf.storeStaff),
};
export const storePerformanceRow = readOne(perf.storeRow, 'id');

// /v1/operating-hours
export const hoursDashboard = read(hours.dashboard);
export const hoursList = read(hours.list);
export const hoursExport = handle((req) => hours.exportReport(req.user, req.query || {}), EXPORT_MESSAGE);
export const hoursOne = readOne(hours.getSchedule);
export const hoursUpdate = handle((req) => hours.updateWeek(req.user, req.params.storeId, req.body, req.query || {}), 'Operating hours updated');
export const hoursHolidays = handle((req) => hours.updateHolidays(req.user, req.params.storeId, req.body, req.query || {}), 'Holiday schedule updated');
export const hoursCopy = handle((req) => hours.copyWeek(req.user, req.body, req.query || {}), 'Schedule copied successfully.');
export const hoursBulk = handle((req) => hours.bulkUpdate(req.user, req.body, req.query || {}), 'Bulk update completed successfully.');

// /v1/stores/:id/hours, /v1/stores/:id/status
export const storeHoursGet = readOne(hours.getStoreHours, 'id');
export const storeHoursUpdate = handle((req) => hours.updateStoreHours(req.user, req.params.id, req.body, req.query || {}), 'Operating hours saved');
export const storeStatusUpdate = handle((req) => hours.updateStoreStatus(req.user, req.params.id, req.body, req.query || {}), 'Store status updated successfully.');

// /v1/store-pricing, /v1/bulk-price-update, /v1/copy-pricing, /v1/price-history/:productId
export const pricingList = read(pricing.list);
export const pricingOne = readOne(pricing.getOne, 'id');
export const pricingUpdate = handle((req) => pricing.update(req.user, req.params.id, req.body, req.query || {}), 'Store price updated');
export const pricingBulkAction = handle((req) => pricing.bulkAction(req.user, req.body, req.query || {}), 'Bulk pricing rules updated');
export const pricingBulkUpdate = handle((req) => pricing.bulkPriceUpdate(req.user, req.body, req.query || {}), 'Bulk price update completed');
export const pricingCopy = handle((req) => pricing.copyPricing(req.user, req.body, req.query || {}), 'Pricing copied');
export const pricingHistory = readOne(pricing.priceHistory, 'productId');

// /v1/orders|inventory|reviews|users?storeId= (store details drawer)
export const storeOrders = read(details.orders);
export const storeInventory = read(details.inventory);
export const storeReviews = read(details.reviews);
export const storeUsers = read(details.staff);
