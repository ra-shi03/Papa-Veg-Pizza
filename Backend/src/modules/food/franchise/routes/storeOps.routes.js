import express from 'express';
import { authMiddleware } from '../../../../core/auth/auth.middleware.js';
import { requireRoles } from '../../../../core/roles/role.middleware.js';
import * as c from '../controllers/storeOps.controller.js';

// Franchise admin screens. Mounted in routes/index.js at the paths adminAPI already calls.
// Admins only, except hours and pricing which a store manager may read for its own store (checked in storeAccess.js).
const admin = [authMiddleware, requireRoles('ADMIN')];
const adminOrManager = [authMiddleware, requireRoles('ADMIN', 'STORE_MANAGER')];

// /v1/store-performance
export const storePerformanceRouter = express.Router();
storePerformanceRouter.use(...admin);
storePerformanceRouter.get('/dashboard', c.performanceDashboard);
storePerformanceRouter.get('/revenue', c.performanceRevenue);
storePerformanceRouter.get('/orders', c.performanceOrders);
storePerformanceRouter.get('/ratings', c.performanceRatings);
storePerformanceRouter.get('/comparison', c.performanceComparison);
storePerformanceRouter.get('/busy-hours', c.performanceBusyHours);
storePerformanceRouter.get('/compare', c.performanceCompare);
storePerformanceRouter.get('/export', c.performanceExport);
storePerformanceRouter.get('/', c.performanceList);
for (const [part, handler] of Object.entries(c.storePerformance)) storePerformanceRouter.get(`/:storeId/${part}`, handler);

// /v1/operating-hours
export const operatingHoursRouter = express.Router();
operatingHoursRouter.use(...adminOrManager);
operatingHoursRouter.get('/dashboard', c.hoursDashboard);
operatingHoursRouter.get('/export', c.hoursExport);
operatingHoursRouter.post('/copy', c.hoursCopy);
operatingHoursRouter.patch('/bulk-update', c.hoursBulk);
operatingHoursRouter.get('/', c.hoursList);
operatingHoursRouter.get('/:storeId', c.hoursOne);
operatingHoursRouter.patch('/:storeId', c.hoursUpdate);
operatingHoursRouter.patch('/:storeId/holidays', c.hoursHolidays);

// /v1/stores/:id/hours|status|performance (mounted before the /v1/stores router, whose guard is admin-only)
export const storeExtrasRouter = express.Router();
storeExtrasRouter.get('/:id/hours', ...adminOrManager, c.storeHoursGet);
storeExtrasRouter.patch('/:id/hours', ...adminOrManager, c.storeHoursUpdate);
storeExtrasRouter.patch('/:id/status', ...admin, c.storeStatusUpdate);
storeExtrasRouter.get('/:id/performance', ...admin, c.storePerformanceRow);

// /v1/store-pricing, /v1/bulk-price-update, /v1/copy-pricing, /v1/price-history/:productId
export const storePricingRouter = express.Router();
storePricingRouter.get('/store-pricing', ...adminOrManager, c.pricingList);
storePricingRouter.put('/store-pricing/bulk-action', ...adminOrManager, c.pricingBulkAction);
storePricingRouter.get('/store-pricing/:id', ...adminOrManager, c.pricingOne);
storePricingRouter.put('/store-pricing/:id', ...adminOrManager, c.pricingUpdate);
storePricingRouter.post('/bulk-price-update', ...adminOrManager, c.pricingBulkUpdate);
storePricingRouter.post('/copy-pricing', ...adminOrManager, c.pricingCopy);
storePricingRouter.get('/price-history/:productId', ...adminOrManager, c.pricingHistory);

// /v1/orders|inventory|reviews|users?storeId= (store details drawer)
export const storeDetailsRouter = express.Router();
storeDetailsRouter.get('/orders', ...admin, c.storeOrders);
storeDetailsRouter.get('/inventory', ...admin, c.storeInventory);
storeDetailsRouter.get('/reviews', ...admin, c.storeReviews);
storeDetailsRouter.get('/users', ...admin, c.storeUsers);
