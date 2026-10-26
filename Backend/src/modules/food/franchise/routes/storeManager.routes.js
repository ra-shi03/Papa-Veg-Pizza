import express from 'express';
import {
  createStoreManager,
  getStoreManagers,
  getStoreManagerById,
  updateStoreManager,
  deleteStoreManager
} from '../controllers/storeManager.controller.js';
import { upload } from '../../../../middleware/upload.js';
import { authMiddleware } from '../../../../core/auth/auth.middleware.js';
import { requireRoles } from '../../../../core/roles/role.middleware.js';
import { attachFranchiseScope } from '../../shared/franchiseScope.js';

const router = express.Router();

// Super admin and franchise admin only; queries are limited to the caller's franchise (auth runs before the multipart parser)
router.use(authMiddleware, requireRoles('ADMIN'), attachFranchiseScope);

router.post('/', upload.single('profileImageFile'), createStoreManager);
router.get('/', getStoreManagers);
router.get('/:id', getStoreManagerById);
router.patch('/:id', upload.single('profileImageFile'), updateStoreManager);
router.delete('/:id', deleteStoreManager);

export default router;
