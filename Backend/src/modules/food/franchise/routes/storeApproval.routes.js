import { Router } from 'express';
import { authMiddleware, requireSuperAdmin } from '../../../../core/auth/auth.middleware.js';
import { requireRoles } from '../../../../core/roles/role.middleware.js';
import { attachFranchiseScope } from '../../shared/franchiseScope.js';
import {
    getStoreApprovals, 
    getStoreApprovalsDashboard, 
    submitStoreApproval,
    uploadStoreDocuments,
    approveStoreApproval,
    rejectStoreApproval,
    requestChangesStoreApproval,
    verifyDocument
} from '../controllers/storeApproval.controller.js';
import { upload } from '../../../../middleware/upload.js';

const router = Router();

// Super admin and franchise admin only; queries are limited to the caller's franchise
router.use(authMiddleware, requireRoles('ADMIN'), attachFranchiseScope);

// Store Approvals routes
router.get('/', getStoreApprovals);
router.get('/dashboard', getStoreApprovalsDashboard);
router.post('/:id/submit', submitStoreApproval);
router.post('/:id/documents', upload.any(), uploadStoreDocuments);
// Decisions on an application are the super admin's: a franchise admin cannot approve its own stores
router.patch('/:id/approve', requireSuperAdmin, approveStoreApproval);
router.patch('/:id/reject', requireSuperAdmin, rejectStoreApproval);
router.patch('/:id/request-changes', requireSuperAdmin, requestChangesStoreApproval);
router.patch('/:id/documents/:docId/verify', requireSuperAdmin, verifyDocument);

export default router;
