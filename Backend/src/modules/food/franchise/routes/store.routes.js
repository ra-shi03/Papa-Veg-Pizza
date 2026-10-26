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
import { requireRoles } from '../../../../core/roles/role.middleware.js';

const router = express.Router();

// Super admin and franchise admin only
router.use(authMiddleware, requireRoles('ADMIN'));

router.get('/dashboard-kpis', getDashboardKpis);
router.post('/', createStore);
router.get('/', getStores);
router.get('/:id', getStoreById);
router.patch('/:id', updateStore);
router.put('/:id', updateStore);
router.delete('/:id', deleteStore);

export default router;
