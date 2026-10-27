import express from 'express';
import { authMiddleware } from '../../../../core/auth/auth.middleware.js';
import { requireRoles } from '../../../../core/roles/role.middleware.js';
import { safeUpload } from '../../../../middleware/safeUpload.js';
import * as c from '../controllers/inventory.controller.js';

// Store inventory (stock levels, alerts, stock requests, waste, shortages, recipes). Mounted at /v1/food/store/inventory.
// Store roles work on their own store (from the token); a franchise admin may only read, one of its stores at a time
// (?storeId=). What each role may change is decided in the services, next to the data.
const router = express.Router();

router.use(authMiddleware);
router.use(requireRoles('STORE_MANAGER', 'KITCHEN_SUPERVISOR', 'KITCHEN_STAFF', 'FRANCHISE_ADMIN'));

// Stock levels (static paths first, then /:id)
router.get('/', c.listIngredients);
router.post('/', c.createIngredient);
router.get('/dashboard', c.inventoryDashboard);
router.get('/ingredients', c.ingredientPicker);
router.get('/available-stores', c.availableStores);
router.post('/update-stock', c.updateStock);
router.post('/transfer', c.requestTransfer);

// Alerts
router.get('/alerts', c.listAlerts);
router.get('/alerts/dashboard', c.alertsDashboard);
router.patch('/alerts/resolve', c.resolveAlert);
router.get('/alerts/:id', c.alertDetails);

// Stock requests
router.get('/stock-requests', c.listStockRequests);
router.post('/stock-requests', c.createStockRequest);
router.get('/stock-requests/dashboard', c.stockRequestsDashboard);
router.patch('/stock-requests/approve', c.approveStockRequest);
router.patch('/stock-requests/reject', c.rejectStockRequest);
router.patch('/stock-requests/fulfill', c.fulfillStockRequest);
router.get('/stock-requests/:id', c.stockRequestDetails);

// Waste (reports are multipart: fields + up to 5 photos named images[])
router.get('/waste', c.listWaste);
router.get('/waste/dashboard', c.wasteDashboard);
router.post('/waste/report', safeUpload('image', [{ name: 'images[]', maxCount: 5 }]), c.reportWaste);
router.get('/waste/:id', c.wasteDetails);
router.patch('/waste/:id/approve', c.approveWaste);
router.delete('/waste/:id', c.deleteWaste);

// Shortages
router.get('/ingredient-shortages', c.listShortages);
router.post('/ingredient-shortages', c.reportShortage);
router.get('/ingredient-shortages/dashboard', c.shortagesDashboard);
router.get('/ingredient-shortages/:id', c.shortageDetails);
router.patch('/ingredient-shortages/:id/resolve', c.resolveShortage);
router.post('/notifications/admin', c.notifyAdmin);

// Recipes
router.get('/recipes', c.listRecipes);
router.post('/recipes', c.createRecipe);
router.put('/recipes/:id', c.updateRecipe);
router.delete('/recipes/:id', c.deleteRecipe);

// One ingredient (last: a bare /:id would otherwise swallow the paths above)
router.get('/:id/history', c.ingredientHistory);
router.get('/:id', c.ingredientDetails);
router.patch('/:id', c.updateIngredient);

export default router;
