import express from 'express';
import {
    getHomeLayout,
    createHomeSection,
    updateHomeSection,
    deleteHomeSection,
    toggleActiveStatus,
    reorderItems,
    uploadDynamicImage,
    getAllHomeSectionsAdmin
} from '../controllers/dynamicHome.controller.js';

import {
    validateHomeSection,
    validateReorder,
    validateToggleActive
} from '../validators/dynamicHome.validator.js';

import { authMiddleware, requireAdmin, requireSuperAdmin } from '../../../../core/auth/auth.middleware.js';
import { upload } from '../../../../middleware/upload.js';

const router = express.Router();

// ==========================================
// PUBLIC ROUTES
// ==========================================
router.get('/home-layout', getHomeLayout);

// ==========================================
// SUPERADMIN ROUTES (Protected)
// ==========================================

// Apply auth to all admin routes below
router.use(authMiddleware, requireSuperAdmin);

// Image Upload
router.post('/upload-image', upload.single('file'), uploadDynamicImage);

// Reorder & Toggle Shared
router.patch('/reorder', validateReorder, reorderItems);
router.patch('/:id/toggle-active', validateToggleActive, toggleActiveStatus);

// Admin GET ALL
router.get('/home-sections-admin', getAllHomeSectionsAdmin);

// HomeSection CRUD
router.post('/home-sections', validateHomeSection, createHomeSection);
router.put('/home-sections/:id', validateHomeSection, updateHomeSection);
router.delete('/home-sections/:id', deleteHomeSection);

export default router;

