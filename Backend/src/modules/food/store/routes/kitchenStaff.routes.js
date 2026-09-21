import express from 'express';
import { authMiddleware } from '../../../../core/auth/auth.middleware.js';
import { requireRoles } from '../../../../core/roles/role.middleware.js';
import {
  createKitchenStaff,
  getKitchenStaff,
  getKitchenStaffById,
  updateKitchenStaff,
  updateStaffStatus,
  assignShift,
  markLeave,
  deleteKitchenStaff,
} from '../controllers/kitchenStaff.controller.js';

const router = express.Router();

router.use(authMiddleware);
router.use(requireRoles('STORE_MANAGER', 'STORE-MANAGER'));

router.post('/',               createKitchenStaff);    // Add staff
router.get('/',                getKitchenStaff);       // List staff
router.get('/:id',             getKitchenStaffById);   // View profile
router.patch('/:id',           updateKitchenStaff);    // Edit profile
router.patch('/:id/status',    updateStaffStatus);     // Activate / Deactivate
router.patch('/:id/shift',     assignShift);           // Assign shift
router.patch('/:id/leave',     markLeave);             // Mark leave
router.delete('/:id',          deleteKitchenStaff);    // Delete staff

export default router;
