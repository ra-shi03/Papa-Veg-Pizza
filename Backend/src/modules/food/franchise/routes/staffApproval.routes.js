import { Router } from 'express';
import { authMiddleware } from '../../../../core/auth/auth.middleware.js';
import { requireRoles } from '../../../../core/roles/role.middleware.js';
import { attachFranchiseScope } from '../../shared/franchiseScope.js';
import { listStaffApprovals, approveStaff, rejectStaff } from '../controllers/staffApproval.controller.js';

const router = Router();

// Franchise admin (own franchise only) and super admin
router.use(authMiddleware, requireRoles('ADMIN'), attachFranchiseScope);
router.get('/', listStaffApprovals);
router.patch('/:id/approve', approveStaff);
router.patch('/:id/reject', rejectStaff);

export default router;
