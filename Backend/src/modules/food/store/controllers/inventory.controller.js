import * as stock from '../services/inventory.service.js';
import * as ops from '../services/inventoryOps.service.js';

// The inventory screens read the raw JSON body (`data` + `pagination` for lists, the object itself for
// dashboards and details; the available-stores picker wants a bare array), so the service result is sent as is.
const wrap = (fn, status = 200) => async (req, res, next) => {
  try {
    const result = await fn(req);
    return Array.isArray(result) ? res.status(status).json(result) : res.status(status).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const u = (req) => req.user;
const q = (req) => req.query || {};

// Stock levels
export const listIngredients = wrap((req) => stock.listIngredients(u(req), q(req)));
export const createIngredient = wrap((req) => stock.createIngredient(u(req), req.body, q(req)), 201);
export const inventoryDashboard = wrap((req) => stock.inventoryDashboard(u(req), q(req)));
export const ingredientPicker = wrap((req) => stock.ingredientPicker(u(req), q(req)));
export const ingredientDetails = wrap((req) => stock.ingredientDetails(u(req), req.params.id, q(req)));
export const ingredientHistory = wrap((req) => stock.ingredientHistory(u(req), req.params.id, q(req)));
export const updateIngredient = wrap((req) => stock.updateIngredientSettings(u(req), req.params.id, req.body, q(req)));
export const updateStock = wrap((req) => stock.updateStock(u(req), req.body, q(req)));
export const availableStores = wrap((req) => stock.availableStores(u(req), q(req)));
export const requestTransfer = wrap((req) => stock.requestTransfer(u(req), req.body, q(req)), 201);

// Alerts
export const listAlerts = wrap((req) => stock.listAlerts(u(req), q(req)));
export const alertsDashboard = wrap((req) => stock.alertsDashboard(u(req), q(req)));
export const alertDetails = wrap((req) => stock.alertDetails(u(req), req.params.id, q(req)));
export const resolveAlert = wrap((req) => stock.resolveAlert(u(req), req.body, q(req)));

// Stock requests
export const listStockRequests = wrap((req) => ops.listStockRequests(u(req), q(req)));
export const createStockRequest = wrap((req) => ops.createStockRequest(u(req), req.body, q(req)), 201);
export const stockRequestsDashboard = wrap((req) => ops.stockRequestsDashboard(u(req), q(req)));
export const stockRequestDetails = wrap((req) => ops.stockRequestDetails(u(req), req.params.id, q(req)));
export const approveStockRequest = wrap((req) => ops.approveStockRequest(u(req), req.body, q(req)));
export const rejectStockRequest = wrap((req) => ops.rejectStockRequest(u(req), req.body, q(req)));
export const fulfillStockRequest = wrap((req) => ops.fulfillStockRequest(u(req), req.body, q(req)));

// Waste
export const listWaste = wrap((req) => ops.listWaste(u(req), q(req)));
export const wasteDashboard = wrap((req) => ops.wasteDashboard(u(req), q(req)));
export const wasteDetails = wrap((req) => ops.wasteDetails(u(req), req.params.id, q(req)));
export const reportWaste = wrap((req) => ops.reportWaste(u(req), req.body, (req.files && req.files['images[]']) || [], q(req)), 201);
export const approveWaste = wrap((req) => ops.approveWaste(u(req), req.params.id, req.body, q(req)));
export const deleteWaste = wrap((req) => ops.deleteWaste(u(req), req.params.id, q(req)));

// Shortages
export const listShortages = wrap((req) => ops.listShortages(u(req), q(req)));
export const shortagesDashboard = wrap((req) => ops.shortagesDashboard(u(req), q(req)));
export const shortageDetails = wrap((req) => ops.shortageDetails(u(req), req.params.id, q(req)));
export const reportShortage = wrap((req) => ops.reportShortage(u(req), req.body, q(req)), 201);
export const resolveShortage = wrap((req) => ops.resolveShortage(u(req), req.params.id, req.body, q(req)));
export const notifyAdmin = wrap((req) => ops.notifyAdminOfShortage(u(req), req.body, q(req)));

// Recipes
export const listRecipes = wrap((req) => ops.listRecipes(u(req), q(req)));
export const createRecipe = wrap((req) => ops.createRecipe(u(req), req.body, q(req)), 201);
export const updateRecipe = wrap((req) => ops.updateRecipe(u(req), req.params.id, req.body, q(req)));
export const deleteRecipe = wrap((req) => ops.deleteRecipe(u(req), req.params.id, q(req)));
