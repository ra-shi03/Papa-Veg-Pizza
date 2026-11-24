import express from 'express';
import {
    requestUserOtpController,
    verifyUserOtpController,
    verifyTruecallerController,
    adminLoginController,
    superAdminLoginController,
    franchiseAdminLoginController,
    storeLoginController,
    refreshTokenController,

    requestDeliveryOtpController,
    verifyDeliveryOtpController,
    logoutController,
    getMeController,
    updateAdminProfileController,
    changeAdminPasswordController,
    requestAdminForgotPasswordOtpController,
    resetAdminPasswordWithOtpController,
    updatePersonalProfileController
} from './auth.controller.js';
import { authMiddleware, requireAdmin } from './auth.middleware.js';
import { authRateLimiter, loginAccountLimiter, otpVerifyAccountLimiter, forgotRequestAccountLimiter, forgotResetAccountLimiter } from '../../middleware/rateLimit.js';

const router = express.Router();

// router.use(authRateLimiter); // Removed global application to avoid rate-limiting /me or /refresh-token too strictly

// User OTP login
router.post('/user/request-otp', authRateLimiter, requestUserOtpController);
router.post('/user/send-otp', authRateLimiter, requestUserOtpController);
router.post('/user/verify-otp', authRateLimiter, otpVerifyAccountLimiter, verifyUserOtpController);
router.post('/user/verify-truecaller', authRateLimiter, verifyTruecallerController);


// Delivery partner OTP login
router.post('/delivery/request-otp', authRateLimiter, requestDeliveryOtpController);
router.post('/delivery/send-otp', authRateLimiter, requestDeliveryOtpController);
router.post('/delivery/verify-otp', authRateLimiter, otpVerifyAccountLimiter, verifyDeliveryOtpController);

// Unified login for all admin panel roles: superadmin, franchise-admin, store-manager, kitchen-staff
router.post('/login', authRateLimiter, loginAccountLimiter, adminLoginController);

// Role-restricted login endpoints
router.post('/admin/login', authRateLimiter, loginAccountLimiter, superAdminLoginController);
router.post('/franchise/login', authRateLimiter, loginAccountLimiter, franchiseAdminLoginController);
router.post('/store/login', authRateLimiter, loginAccountLimiter, storeLoginController);

// Admin forgot password (no auth required)
router.post('/admin/forgot-password/request-otp', authRateLimiter, forgotRequestAccountLimiter, requestAdminForgotPasswordOtpController);
router.post('/admin/forgot-password/reset', authRateLimiter, forgotResetAccountLimiter, resetAdminPasswordWithOtpController);

// Refresh token
router.post('/refresh-token', refreshTokenController);

import { getStoreManagerProfileWork } from '../../modules/food/admin/controllers/admin.controller.js';

// Logout (invalidates refresh token)
router.post('/logout', logoutController);

// Authenticated user profile (requires Bearer token)
router.get('/me', authMiddleware, getMeController);
router.put('/profile/personal', authMiddleware, updatePersonalProfileController);

// Admin-only: profile update & change password (Bearer + ADMIN role)
router.patch('/admin/profile', authMiddleware, requireAdmin, updateAdminProfileController);
router.patch('/admin/change-password', authMiddleware, requireAdmin, changeAdminPasswordController);

export default router;

