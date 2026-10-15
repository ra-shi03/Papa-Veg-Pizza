import express from 'express';
import {
    getHomeLayout,
    getActiveOffers,
    createUiOffer,
    updateUiOffer,
    deleteUiOffer,
    createHomeSection,
    updateHomeSection,
    deleteHomeSection,
    toggleActiveStatus,
    reorderItems,
    uploadDynamicImage,
    getAllUiOffersAdmin,
    getAllHomeSectionsAdmin
} from '../controllers/dynamicHome.controller.js';

import {
    validateUiOffer,
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
router.get('/offers', getActiveOffers);

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
router.get('/offers-admin', getAllUiOffersAdmin);
router.get('/home-sections-admin', getAllHomeSectionsAdmin);

// UiOffer CRUD
router.post('/offers', validateUiOffer, createUiOffer);
router.put('/offers/:id', validateUiOffer, updateUiOffer);
router.delete('/offers/:id', deleteUiOffer);

// HomeSection CRUD
router.post('/home-sections', validateHomeSection, createHomeSection);
router.put('/home-sections/:id', validateHomeSection, updateHomeSection);
router.delete('/home-sections/:id', deleteHomeSection);

export default router;

