import express from 'express';
import {
  createStoreManager,
  getStoreManagers,
  getStoreManagerById,
  updateStoreManager,
  deleteStoreManager
} from '../controllers/storeManager.controller.js';
import { upload } from '../../../../middleware/upload.js';

const router = express.Router();

router.post('/', upload.single('profileImageFile'), createStoreManager);
router.get('/', getStoreManagers);
router.get('/:id', getStoreManagerById);
router.patch('/:id', upload.single('profileImageFile'), updateStoreManager);
router.delete('/:id', deleteStoreManager);

export default router;
