import express from 'express';
import {
  createStore,
  getStores,
  getStoreById,
  updateStore,
  deleteStore,
  getDashboardKpis
} from '../controllers/store.controller.js';
import { authMiddleware } from '../../../../core/auth/auth.middleware.js';

const router = express.Router();

// Optional: Add authMiddleware if needed, but keeping it open or matching existing for now
// Usually franchise admin routes require authentication
router.get('/dashboard-kpis', getDashboardKpis);
router.post('/', authMiddleware, createStore);
router.get('/', getStores);
router.get('/:id', getStoreById);
router.patch('/:id', updateStore);
router.put('/:id', updateStore);
router.delete('/:id', deleteStore);

export default router;
