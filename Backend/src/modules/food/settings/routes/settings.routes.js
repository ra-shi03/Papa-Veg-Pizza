import express from 'express';
import { getWelcomeScreenConfig, updateWelcomeScreenConfig } from '../controllers/welcomeScreen.controller.js';
import { getHomePageConfig, createOrUpdateHomePageConfig, updateHomePageConfig, uploadHomePageBanner, updateHomePageBanner, deleteHomePageBanner } from '../controllers/homePage.controller.js';
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
router.patch('/home-page/banner/:publicId', authMiddleware, requireSuperAdmin, updateHomePageBanner);
router.put('/home-page/banner/:publicId', authMiddleware, requireSuperAdmin, updateHomePageBanner);
router.delete('/home-page/banner/:publicId', authMiddleware, requireSuperAdmin, deleteHomePageBanner);

import * as foodCouponController from '../controllers/foodCoupon.controller.js';
import * as promiseCampaignController from '../controllers/promiseCampaign.controller.js';

// Coupon management routes
router.get('/coupons/public', foodCouponController.getActivePublicCoupons);
router.get('/coupons', authMiddleware, requireSuperAdmin, foodCouponController.getAllCoupons);
router.get('/coupons/analytics', authMiddleware, requireSuperAdmin, foodCouponController.getCouponAnalytics);
router.post('/coupons', authMiddleware, requireSuperAdmin, foodCouponController.createCoupon);
router.get('/coupons/:id', authMiddleware, requireSuperAdmin, foodCouponController.getCouponById);
router.put('/coupons/:id', authMiddleware, requireSuperAdmin, foodCouponController.updateCoupon);
router.delete('/coupons/:id', authMiddleware, requireSuperAdmin, foodCouponController.deleteCoupon);

// Promise Campaign routes
router.get('/promise-campaign', promiseCampaignController.getPromiseCampaign);
router.put('/promise-campaign', authMiddleware, requireSuperAdmin, promiseCampaignController.updatePromiseCampaign);
router.post('/promise-campaign/item', authMiddleware, requireSuperAdmin, promiseCampaignController.addPromiseItem);
router.put('/promise-campaign/item/:itemId', authMiddleware, requireSuperAdmin, promiseCampaignController.updatePromiseItem);
router.delete('/promise-campaign/item/:itemId', authMiddleware, requireSuperAdmin, promiseCampaignController.deletePromiseItem);

import * as showcaseSectionController from '../controllers/showcaseSection.controller.js';

// Dynamic Showcase Sections routes (Paneer Max, 6 in 1, Combo Bonanza, etc.)
router.get('/showcase-sections', showcaseSectionController.getPublicShowcaseSections);
router.get('/showcase-sections/admin', authMiddleware, requireSuperAdmin, showcaseSectionController.getAllShowcaseSectionsAdmin);
router.post('/showcase-sections', authMiddleware, requireSuperAdmin, showcaseSectionController.createShowcaseSection);
router.patch('/showcase-sections/reorder', authMiddleware, requireSuperAdmin, showcaseSectionController.reorderShowcaseSections);
router.get('/showcase-sections/:id', authMiddleware, requireSuperAdmin, showcaseSectionController.getShowcaseSectionById);
router.put('/showcase-sections/:id', authMiddleware, requireSuperAdmin, showcaseSectionController.updateShowcaseSection);
router.delete('/showcase-sections/:id', authMiddleware, requireSuperAdmin, showcaseSectionController.deleteShowcaseSection);
router.patch('/showcase-sections/:id/toggle', authMiddleware, requireSuperAdmin, showcaseSectionController.toggleShowcaseSectionStatus);

import * as searchPageConfigController from '../controllers/searchPageConfig.controller.js';

// Search Page Configuration routes
router.get('/search-config/public', searchPageConfigController.getPublicSearchConfig);
router.get('/search-config/admin', authMiddleware, requireSuperAdmin, searchPageConfigController.getAdminSearchConfig);
router.put('/search-config', authMiddleware, requireSuperAdmin, searchPageConfigController.updateSearchConfig);

// Popular Searches CRUD & Sort
router.post('/search-config/popular', authMiddleware, requireSuperAdmin, searchPageConfigController.createPopularSearch);
router.put('/search-config/popular/:id', authMiddleware, requireSuperAdmin, searchPageConfigController.updatePopularSearch);
router.delete('/search-config/popular/:id', authMiddleware, requireSuperAdmin, searchPageConfigController.deletePopularSearch);
router.patch('/search-config/popular/reorder', authMiddleware, requireSuperAdmin, searchPageConfigController.reorderPopularSearches);

// New Launches CRUD & Sort
router.post('/search-config/new-launches', authMiddleware, requireSuperAdmin, searchPageConfigController.createNewLaunch);
router.put('/search-config/new-launches/:id', authMiddleware, requireSuperAdmin, searchPageConfigController.updateNewLaunch);
router.delete('/search-config/new-launches/:id', authMiddleware, requireSuperAdmin, searchPageConfigController.deleteNewLaunch);
router.patch('/search-config/new-launches/reorder', authMiddleware, requireSuperAdmin, searchPageConfigController.reorderNewLaunches);

// Search By Tabs CRUD & Sync
router.post('/search-config/sync-addons', authMiddleware, requireSuperAdmin, searchPageConfigController.syncRealAddonsToSearchConfig);
router.post('/search-config/tabs', authMiddleware, requireSuperAdmin, searchPageConfigController.createSearchByTab);
router.put('/search-config/tabs/:id', authMiddleware, requireSuperAdmin, searchPageConfigController.updateSearchByTab);
router.delete('/search-config/tabs/:id', authMiddleware, requireSuperAdmin, searchPageConfigController.deleteSearchByTab);

import * as faqController from '../controllers/faq.controller.js';

// FAQ Routes
router.get('/faqs/public', faqController.getPublicFaqs);
router.get('/faqs/admin', authMiddleware, requireSuperAdmin, faqController.getAdminFaqs);
router.post('/faqs', authMiddleware, requireSuperAdmin, faqController.createFaq);
router.put('/faqs/:id', authMiddleware, requireSuperAdmin, faqController.updateFaq);
router.delete('/faqs/:id', authMiddleware, requireSuperAdmin, faqController.deleteFaq);
router.patch('/faqs/:id/toggle', authMiddleware, requireSuperAdmin, faqController.toggleFaqStatus);

export default router;

