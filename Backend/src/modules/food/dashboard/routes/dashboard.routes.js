import express from 'express';
import { authMiddleware } from '../../../../core/auth/auth.middleware.js';
import { requireRoles } from '../../../../core/roles/role.middleware.js';
import * as c from '../controllers/dashboard.controller.js';

// Mounted at the paths the dashboards already call: /v1/store/dashboard/* and /v1/admin/dashboard/*.
// Which store / franchise a call may see is decided in dashboardAccess.js from the token.

// Store dashboard: store manager, kitchen supervisor (kitchen + order widgets), franchise / super admin (?storeId=)
export const storeDashboardRouter = express.Router();
storeDashboardRouter.use(authMiddleware, requireRoles('STORE_MANAGER', 'KITCHEN_SUPERVISOR', 'ADMIN'));
for (const [widget, handler] of Object.entries(c.storeWidgets)) storeDashboardRouter.get(`/${widget}`, handler);

// Franchise dashboard: franchise admin (own franchise) and super admin
export const adminDashboardRouter = express.Router();
adminDashboardRouter.use(authMiddleware, requireRoles('ADMIN'));
adminDashboardRouter.get('/', c.summary);
adminDashboardRouter.get('/revenue', c.revenue);
adminDashboardRouter.get('/live-orders', c.liveOrders);
adminDashboardRouter.get('/store-performance', c.storePerformance);
adminDashboardRouter.get('/inventory-alerts', c.inventoryAlerts);
adminDashboardRouter.get('/delivery-performance', c.deliveryPerformance);
adminDashboardRouter.get('/customer-activity', c.customerActivity);
