import express from 'express';
import { getWelcomeScreenConfig, updateWelcomeScreenConfig } from '../controllers/welcomeScreen.controller.js';
import { authMiddleware, requireSuperAdmin } from '../../../../core/auth/auth.middleware.js';

const router = express.Router();

// Public route to get welcome screen config
router.get('/welcome', getWelcomeScreenConfig);

// Protected route to update config
router.put('/welcome', authMiddleware, requireSuperAdmin, updateWelcomeScreenConfig);

export default router;
