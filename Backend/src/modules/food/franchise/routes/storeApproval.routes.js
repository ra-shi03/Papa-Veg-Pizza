import { Router } from 'express';
import { authMiddleware } from '../../../../core/auth/auth.middleware.js';
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

// Franchise admin must be authenticated
router.use(authMiddleware);

// Store Approvals routes
router.get('/', getStoreApprovals);
router.get('/dashboard', getStoreApprovalsDashboard);
router.post('/:id/submit', submitStoreApproval);
router.post('/:id/documents', upload.any(), uploadStoreDocuments);
router.patch('/:id/approve', approveStoreApproval);
router.patch('/:id/reject', rejectStoreApproval);
router.patch('/:id/request-changes', requestChangesStoreApproval);
router.patch('/:id/documents/:docId/verify', verifyDocument);

export default router;
