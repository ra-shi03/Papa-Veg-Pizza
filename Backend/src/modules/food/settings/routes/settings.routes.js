import express from 'express';
import { getWelcomeScreenConfig, updateWelcomeScreenConfig } from '../controllers/welcomeScreen.controller.js';
import { getHomePageConfig, createOrUpdateHomePageConfig, updateHomePageConfig, uploadHomePageBanner, deleteHomePageBanner } from '../controllers/homePage.controller.js';
import { authMiddleware, requireSuperAdmin } from '../../../../core/auth/auth.middleware.js';
import { upload } from '../../../../middleware/upload.js';

const router = express.Router();

// Public route to get welcome screen config
router.get('/welcome', getWelcomeScreenConfig);

// Protected route to update config
router.put('/welcome', authMiddleware, requireSuperAdmin, updateWelcomeScreenConfig);

// Home page configuration routes
router.get('/home-page', getHomePageConfig);
router.post('/home-page', authMiddleware, requireSuperAdmin, createOrUpdateHomePageConfig);
router.put('/home-page', authMiddleware, requireSuperAdmin, updateHomePageConfig);
router.patch('/home-page', authMiddleware, requireSuperAdmin, updateHomePageConfig);
router.post('/home-page/banner', authMiddleware, requireSuperAdmin, upload.single('file'), uploadHomePageBanner);
router.delete('/home-page/banner/:publicId', authMiddleware, requireSuperAdmin, deleteHomePageBanner);

export default router;

