import express from 'express';
import {
    getHomeLayout,
    getActiveOffers,
    getActiveCampaigns,
    getCampaignBySlug,
    createUiOffer,
    updateUiOffer,
    deleteUiOffer,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    createHomeSection,
    updateHomeSection,
    deleteHomeSection,
    toggleActiveStatus,
    reorderItems,
    uploadDynamicImage,
    getAllUiOffersAdmin,
    getAllCampaignsAdmin,
    getAllHomeSectionsAdmin
} from '../controllers/dynamicHome.controller.js';

import {
    validateUiOffer,
    validateCampaign,
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
router.get('/campaigns', getActiveCampaigns);
router.get('/campaigns/:slug', getCampaignBySlug);

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
router.get('/campaigns-admin', getAllCampaignsAdmin);
router.get('/home-sections-admin', getAllHomeSectionsAdmin);

// UiOffer CRUD
router.post('/offers', validateUiOffer, createUiOffer);
router.put('/offers/:id', validateUiOffer, updateUiOffer);
router.delete('/offers/:id', deleteUiOffer);

// Campaign CRUD
router.post('/campaigns', validateCampaign, createCampaign);
router.put('/campaigns/:id', validateCampaign, updateCampaign);
router.delete('/campaigns/:id', deleteCampaign);

// HomeSection CRUD
router.post('/home-sections', validateHomeSection, createHomeSection);
router.put('/home-sections/:id', validateHomeSection, updateHomeSection);
router.delete('/home-sections/:id', deleteHomeSection);

export default router;

