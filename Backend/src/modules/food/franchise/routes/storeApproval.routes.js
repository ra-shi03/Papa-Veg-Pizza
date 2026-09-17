import { Router } from 'express';
import { authMiddleware } from '../../../../core/auth/auth.middleware.js';
import { 
    getStoreApprovals, 
    getStoreApprovalsDashboard, 
    submitStoreApproval 
} from '../controllers/storeApproval.controller.js';

const router = Router();

// Franchise admin must be authenticated
router.use(authMiddleware);

// Store Approvals routes
router.get('/', getStoreApprovals);
router.get('/dashboard', getStoreApprovalsDashboard);
router.post('/:id/submit', submitStoreApproval);

export default router;
