import express from 'express';
import { searchController, listAdminCategoriesController, checkServiceabilityController, getNearbyStoresController } from '../controllers/search.controller.js';

const router = express.Router();

/**
 * Unified Search Endpoint
 * GET /api/v1/food/search/unified
 */
router.get('/unified', searchController);

/**
 * Admin Categories Only Endpoint (to avoid store-created ones as requested)
 * GET /api/v1/food/search/categories/admin
 */
router.get('/categories/admin', listAdminCategoriesController);

/**
 * Check if a location is serviceable
 * GET /api/v1/food/search/serviceability?lat=...&lng=...
 */
router.get('/serviceability', checkServiceabilityController);

/**
 * Fetch nearby stores
 * GET /api/v1/food/search/nearby-stores?lat=...&lng=...
 */
router.get('/nearby-stores', getNearbyStoresController);

export default router;
