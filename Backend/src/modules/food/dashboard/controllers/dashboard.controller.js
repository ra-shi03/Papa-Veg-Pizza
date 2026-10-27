import { sendResponse } from '../../../../utils/response.js';
import * as store from '../services/storeDashboard.service.js';
import * as franchise from '../services/franchiseDashboard.service.js';

const wrap = (fn) => async (req, res, next) => {
  try {
    return sendResponse(res, 200, 'OK', await fn(req.user, req.query || {}));
  } catch (err) {
    next(err);
  }
};

// Store manager dashboard, one handler per widget (path segment -> service function)
export const storeWidgets = {
  'today-sales': wrap(store.todaySales),
  'today-orders': wrap(store.todayOrders),
  'active-orders': wrap(store.activeOrders),
  'prep-time': wrap(store.prepTime),
  'pending-deliveries': wrap(store.pendingDeliveries),
  'low-stock': wrap(store.lowStock),
  'staff-duty': wrap(store.staffDuty),
  'customer-rating': wrap(store.customerRating),
  'hourly-sales': wrap(store.hourlySales),
  'order-status': wrap(store.orderStatus),
  'top-products': wrap(store.topProducts),
  'live-orders': wrap(store.liveOrders),
  'kitchen-performance': wrap(store.kitchenPerformance),
  'delivery-overview': wrap(store.deliveryOverview),
  'inventory-alerts': wrap(store.inventoryAlerts),
  'staff-overview': wrap(store.staffOverview),
  'recent-complaints': wrap(store.recentComplaints),
  'activity-logs': wrap(store.activityLogs),
};

// Franchise admin dashboard
export const summary = wrap(franchise.summary);
export const revenue = wrap(franchise.revenue);
export const liveOrders = wrap(franchise.liveOrders);
export const storePerformance = wrap(franchise.storePerformance);
export const inventoryAlerts = wrap(franchise.inventoryAlerts);
export const deliveryPerformance = wrap(franchise.deliveryPerformance);
export const customerActivity = wrap(franchise.customerActivity);
