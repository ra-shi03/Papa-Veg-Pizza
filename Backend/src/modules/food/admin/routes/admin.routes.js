import express from 'express';
import { requireSuperAdmin } from '../../../../core/auth/auth.middleware.js';
import { attachFranchiseScope } from '../../shared/franchiseScope.js';
import * as adminController from '../controllers/admin.controller.js';
import * as staffController from '../controllers/staff.controller.js';
import * as foodApprovalController from '../controllers/foodApproval.controller.js';
import * as addonsApprovalController from '../controllers/addonsApproval.controller.js';
import * as businessSettingsController from '../controllers/businessSettings.controller.js';
import * as feedbackExperienceController from '../controllers/feedbackExperience.controller.js';
import * as notificationBroadcastController from '../controllers/notificationBroadcast.controller.js';
import * as franchiseController from '../controllers/franchise.controller.js';
import * as geographyController from '../controllers/geography.controller.js';
import * as categoryProductController from '../controllers/categoryProduct.controller.js';
import * as rewardConfigController from '../controllers/rewardConfig.controller.js';

import * as productController from '../controllers/product.controller.js';
import * as addonController from '../controllers/addon.controller.js';
import * as addonTypeController from '../controllers/addonType.controller.js';
import * as comboController from '../controllers/combo.controller.js';

import * as orderController from '../../orders/controllers/order.controller.js';
import * as refundAdminController from '../controllers/refundAdmin.controller.js';
import { getAdminPageController, upsertAdminPageController } from '../controllers/pageContent.controller.js';
import { upload } from '../../../../middleware/upload.js';

const router = express.Router();

// ----- Public Business Settings (No Admin Required) -----
router.get('/business-settings/public', businessSettingsController.getBusinessSettings);

// ----- Public Category Products -----
router.get('/category-products', categoryProductController.getCategoryProducts);
router.get('/category-products/categories', categoryProductController.getCategoryProducts);
router.get('/category-products/public', categoryProductController.getCategoryProducts);

// ----- Public Menu, Products & Addons -----
router.get('/products', productController.getProducts);
router.get('/products/public', productController.getPublicProducts);
router.get('/menu/public', productController.getPublicMenu);
router.get('/addons/public', addonController.getAddons);
router.get('/addons/stats/public', addonController.getAddonStats);
router.get('/addon-types/public', addonTypeController.getAddonTypes);
router.get('/combos/public', comboController.getPublicCombos);

// ----- Public Categories -----
router.get('/categories', categoryProductController.getCategoryProducts);
router.get('/categories/public', categoryProductController.getCategoryProducts);

// =============================================================================
// FRANCHISE-SCOPED: super admin and franchise admin.
// attachFranchiseScope takes the franchise from the token; every handler below filters its
// queries with it (super admin sees all, a franchise admin only its own franchise).
// =============================================================================
router.use(attachFranchiseScope);

// ----- Own franchise / profile -----
router.get('/franchises/my-franchise', franchiseController.getMyFranchise);
router.patch('/franchises/my-franchise', franchiseController.updateMyFranchise);
router.get('/profile/work', adminController.getStoreManagerProfileWork);

// ----- Geography (shared reference data, read-only) -----
router.get('/regions', geographyController.getRegions);
router.get('/regions/:id', geographyController.getRegionById);
router.get('/zones', geographyController.getZones);
router.get('/zones/:id', geographyController.getZoneById);
router.get('/territories', geographyController.getTerritories);
router.get('/territories/:id', geographyController.getTerritoryById);

// ----- Stores, orders, customers (read, scoped to the franchise) -----
router.get('/stores', adminController.getStores);
router.get('/stores/:id([0-9a-fA-F]{24})', adminController.getStoreById);
router.get('/orders', orderController.listOrdersAdminController);
router.get('/orders/:orderId', orderController.getOrderByIdAdminController);
router.get('/customers', adminController.getCustomers);
router.get('/customers/:id', adminController.getCustomerById);

// ----- Staff / RBAC Management (the controller limits roles and franchise/store itself) -----
router.post('/staff', staffController.createStaff);
router.get('/staff', staffController.getStaffList);
router.put('/staff/:id', staffController.updateStaff);
router.delete('/staff/:id', staffController.deleteStaff);

// =============================================================================
// SUPER ADMIN ONLY: everything below is platform-wide (settings, catalogue, finance,
// delivery fleet, other franchises, ...). A franchise admin gets 403.
// =============================================================================
router.use(requireSuperAdmin);

// ----- Admin Rewards Config -----
router.get('/rewards/config', rewardConfigController.getRewardConfig);
router.put('/rewards/config', rewardConfigController.updateRewardConfig);

// ----- Broadcast Notifications -----
router.post('/notifications/broadcast', notificationBroadcastController.createBroadcastNotificationController);
router.get('/notifications/broadcast', notificationBroadcastController.getBroadcastNotificationsController);
router.delete('/notifications/broadcast/:id', notificationBroadcastController.deleteBroadcastNotificationController);

// ----- Franchises -----
router.post('/franchises', franchiseController.createFranchise);
router.get('/franchises', franchiseController.getFranchises);
router.get('/franchises/:id', franchiseController.getFranchiseById);
router.patch('/franchises/:id', franchiseController.updateFranchise);
router.delete('/franchises/:id', franchiseController.deleteFranchise);

// ----- Customers (account status is platform-wide) -----
router.patch('/customers/:id/status', adminController.updateCustomerStatus);

// ----- Safety / Emergency Reports -----
router.get('/safety-emergency-reports', adminController.getSafetyEmergencyReports);
router.put('/safety-emergency-reports/:id/status', adminController.updateSafetyEmergencyStatus);
router.put('/safety-emergency-reports/:id/priority', adminController.updateSafetyEmergencyPriority);
router.delete('/safety-emergency-reports/:id', adminController.deleteSafetyEmergencyReport);

// ----- Support Tickets (users) -----
router.get('/support-tickets', adminController.getSupportTicketsController);
router.patch('/support-tickets/:id', adminController.updateSupportTicketController);
router.get('/global-search', adminController.globalSearch);
router.get('/stores/complaints', adminController.getStoreComplaints);
router.patch('/stores/complaints/:id', adminController.updateStoreComplaint);

// ----- Stores (list + single read are in the franchise-scoped section above) -----
router.get('/dashboard-stats', adminController.getDashboardStats);
router.get('/reports/stores', adminController.getStoreReport);
router.get('/reports/transactions', adminController.getTransactionReport);
router.get('/reports/tax', adminController.getTaxReport);
router.get('/reports/tax/:id', adminController.getTaxReportDetail);
router.get('/stores/pending', adminController.getPendingStores);
router.get('/stores/reviews', adminController.getStoreReviews);
router.get('/stores/:id/menu-pdf', adminController.getStoreMenuPdfDownloadUrl);
router.get('/stores/:id/download-menu-pdf', adminController.downloadStoreMenuPdf);
router.get('/stores/:id/analytics', adminController.getStoreAnalytics);
router.get('/stores/:id/menu', adminController.getStoreMenuById);
router.get('/stores/:id/menu-pdf', adminController.getStoreMenuPdfDownloadUrl);
router.post('/stores', adminController.createStore);
router.patch('/stores/:id', adminController.updateStoreById);
router.patch('/stores/:id/status', adminController.updateStoreStatus);
router.patch('/stores/:id/location', adminController.updateStoreLocation);
router.patch('/stores/:id/menu', adminController.updateStoreMenuById);
router.patch('/stores/:id/approve', adminController.approveStore);
router.patch('/stores/:id/reject', adminController.rejectStore);
router.delete('/stores/:id', adminController.deleteStore);

// ----- Store Commission -----
router.get('/store-commissions/bootstrap', adminController.getStoreCommissionBootstrap);
router.get('/store-commissions', adminController.getStoreCommissions);
router.post('/store-commissions', adminController.createStoreCommission);
router.get('/store-commissions/:id', adminController.getStoreCommissionById);
router.patch('/store-commissions/:id', adminController.updateStoreCommission);
router.delete('/store-commissions/:id', adminController.deleteStoreCommission);
router.patch('/store-commissions/:id/toggle', adminController.toggleStoreCommissionStatus);

// ----- Categories -----
router.post('/categories', adminController.createCategory);
router.patch('/categories/:id', adminController.updateCategory);
router.delete('/categories/:id', adminController.deleteCategory);

// ----- Addons -----
router.get('/addons/stats', addonController.getAddonStats);
router.get('/addons', addonController.getAddons);
router.get('/addons/:id', addonController.getAddonById);
router.post('/addons', addonController.createAddon);
router.patch('/addons/:id', addonController.updateAddon);
router.delete('/addons/:id', addonController.deleteAddon);

// ----- Addon Types -----
router.get('/addon-types', addonTypeController.getAddonTypes);
router.get('/addon-types/:id', addonTypeController.getAddonTypeById);
router.post('/addon-types', addonTypeController.createAddonType);
router.patch('/addon-types/:id', addonTypeController.updateAddonType);
router.delete('/addon-types/:id', addonTypeController.deleteAddonType);
router.patch('/categories/:id/toggle', adminController.toggleCategoryStatus);
router.patch('/categories/:id/approve', adminController.approveCategory);
router.patch('/categories/:id/reject', adminController.rejectCategory);
router.patch('/categories/:id/make-global', adminController.makeCategoryGlobal);

// ----- Category Products -----
router.get('/category-products', categoryProductController.getCategoryProducts);
router.get('/category-products/stats', categoryProductController.getCategoryStats);
router.get('/category-products/:id', categoryProductController.getCategoryProductById);
router.post('/category-products', categoryProductController.createCategoryProduct);
router.patch('/category-products/:id', categoryProductController.updateCategoryProduct);
router.delete('/category-products/:id', categoryProductController.deleteCategoryProduct);




// ----- Store Add-ons Approval -----
router.get('/addons', addonsApprovalController.getStoreAddons);
router.patch('/addons/:id', addonsApprovalController.updateStoreAddon);
router.patch('/addons/:id/approve', addonsApprovalController.approveStoreAddon);
router.patch('/addons/:id/reject', addonsApprovalController.rejectStoreAddon);

// ----- Foods -----
// Food approval queue (pending items created by stores)
router.get('/foods/pending-approvals', foodApprovalController.getPendingFoodApprovals);
router.patch('/foods/bulk-approve', foodApprovalController.bulkApproveFoodItemsController);
router.patch('/foods/:id/approve', foodApprovalController.approveFoodItemController);
router.patch('/foods/:id/reject', foodApprovalController.rejectFoodItemController);

router.get('/foods', adminController.getFoods);
router.get('/foods/:id', adminController.getFoodById);
router.post('/foods', adminController.createFood);
router.patch('/foods/:id', adminController.updateFood);
router.delete('/foods/:id', adminController.deleteFood);

// NEW Schema endpoints
router.get('/products', productController.getProducts);
router.get('/products/stats', productController.getProductStats);
router.get('/products/:id', productController.getProductById);
router.post('/products', productController.createProduct);
router.patch('/products/:id', productController.updateProduct);
router.put('/products/:id', productController.updateProduct);
router.delete('/products/:id', productController.deleteProduct);

// ----- Combos & Deals (Meal for 1 / 2 / 4 bundles) -----
router.get('/combos', comboController.getCombos);
router.get('/combos/stats', comboController.getComboStats);
router.patch('/combos/bulk', comboController.bulkUpdateCombos);
router.get('/combos/:id', comboController.getComboById);
router.post('/combos', comboController.createCombo);
router.patch('/combos/:id', comboController.updateCombo);
router.put('/combos/:id', comboController.updateCombo);
router.patch('/combos/:id/status', comboController.updateComboStatus);
router.delete('/combos/:id', comboController.deleteCombo);

// ----- Offers & Coupons -----
router.get('/offers', adminController.getAllOffers);
router.post('/offers', adminController.createAdminOffer);
router.patch('/offers/:id/cart-visibility', adminController.updateAdminOfferCartVisibility);
router.delete('/offers/:id', adminController.deleteAdminOffer);

// ----- Feedback Experience (Admin) -----
router.get('/feedback-experiences', feedbackExperienceController.getFeedbackExperiences);
router.delete('/feedback-experiences/:id', feedbackExperienceController.deleteFeedbackExperience);

// ----- Fee Settings -----
router.get('/fee-settings', adminController.getFeeSettings);
router.put('/fee-settings', adminController.createOrUpdateFeeSettings);

// ----- Referral Settings -----
router.get('/referral-settings', adminController.getReferralSettings);
router.put('/referral-settings', adminController.createOrUpdateReferralSettings);

// ----- Business Settings -----
router.get('/business-settings/public', businessSettingsController.getBusinessSettings); // Public endpoint
router.get('/business-settings', businessSettingsController.getBusinessSettings);
router.patch('/business-settings', upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'favicon', maxCount: 1 }
]), businessSettingsController.updateBusinessSettings);

// ----- Delivery Cash Limit -----
router.get('/delivery-cash-limit', adminController.getDeliveryCashLimit);
router.patch('/delivery-cash-limit', adminController.updateDeliveryCashLimit);

// ----- Delivery Emergency Help -----
router.get('/delivery-emergency-help', adminController.getEmergencyHelp);
router.put('/delivery-emergency-help', adminController.createOrUpdateEmergencyHelp);

// ----- Withdrawals (admin) -----
router.get('/withdrawals', adminController.getWithdrawals);
router.patch('/withdrawals/:id', adminController.updateWithdrawalStatus);
router.get('/delivery/withdrawals', adminController.getDeliveryWithdrawals);
router.patch('/delivery/withdrawals/:id', adminController.updateDeliveryWithdrawalStatus);
router.get('/delivery/cash-limit-settlements', adminController.getCashLimitSettlements);

// ----- Delivery partners & general -----
router.get('/delivery/join-requests', adminController.getDeliveryJoinRequests);
router.get('/delivery/wallets', adminController.getDeliveryWallets);
router.get('/delivery/bonus-transactions', adminController.getDeliveryPartnerBonusTransactions);
router.get('/delivery/earnings', adminController.getDeliveryEarnings);
router.post('/delivery/bonus', adminController.addDeliveryPartnerBonus);
router.get('/delivery/commission-rules', adminController.getDeliveryCommissionRules);
router.post('/delivery/commission-rules', adminController.createDeliveryCommissionRule);
router.patch('/delivery/commission-rules/:id', adminController.updateDeliveryCommissionRule);
router.delete('/delivery/commission-rules/:id', adminController.deleteDeliveryCommissionRule);
router.patch('/delivery/commission-rules/:id/status', adminController.toggleDeliveryCommissionRuleStatus);
router.get('/delivery/reviews', adminController.getDeliverymanReviews);
router.get('/contact-messages', adminController.getContactMessages);
router.get('/delivery/earning-addons', adminController.getEarningAddons);
router.post('/delivery/earning-addons', adminController.createEarningAddon);
router.patch('/delivery/earning-addons/:id', adminController.updateEarningAddon);
router.delete('/delivery/earning-addons/:id', adminController.deleteEarningAddon);
router.patch('/delivery/earning-addons/:id/status', adminController.toggleEarningAddonStatus);
router.get('/delivery/earning-addon-history', adminController.getEarningAddonHistory);
router.post('/delivery/earning-addon-history/:id/credit', adminController.creditEarningToWallet);
router.post('/delivery/earning-addon-history/:id/cancel', adminController.cancelEarningAddonHistory);
router.post('/delivery/earning-addon-completions/check', adminController.checkEarningAddonCompletions);
router.get('/delivery/support-tickets/stats', adminController.getSupportTicketStats);
router.get('/delivery/support-tickets', adminController.getSupportTickets);
router.patch('/delivery/support-tickets/:id', adminController.updateSupportTicket);
router.get('/delivery/partners', adminController.getDeliveryPartners);
router.get('/delivery/:id', adminController.getDeliveryPartnerById);
router.patch('/delivery/:id', adminController.updateDeliveryPartner);
router.patch('/delivery/:id/approve', adminController.approveDeliveryPartner);
router.patch('/delivery/:id/reject', adminController.rejectDeliveryPartner);

// ----- Regions, Zones, Territories -----
router.post('/regions', geographyController.createRegion);
router.patch('/regions/:id', geographyController.updateRegion);
router.delete('/regions/:id', geographyController.deleteRegion);

router.post('/zones', geographyController.createZone);
router.patch('/zones/:id', geographyController.updateZone);
router.delete('/zones/:id', geographyController.deleteZone);

router.post('/territories', geographyController.createTerritory);
router.patch('/territories/:id', geographyController.updateTerritory);
router.delete('/territories/:id', geographyController.deleteTerritory);
// ----- Orders -----
router.delete('/orders/:orderId', orderController.deleteOrderAdminController);

// ----- Refunds (Super Admin only: approval credits the wallet or refunds the original payment method) -----
router.get('/refunds', requireSuperAdmin, refundAdminController.listRefundsAdminController);
router.post('/refunds/:id/approve', requireSuperAdmin, refundAdminController.approveRefundAdminController);
router.post('/refunds/:id/reject', requireSuperAdmin, refundAdminController.rejectRefundAdminController);

// ----- CMS Pages (About + legal) -----
router.get('/pages-social-media/:key', getAdminPageController);
router.put('/pages-social-media/:key', upsertAdminPageController);

router.get('/sidebar-badges', adminController.getSidebarBadges);

export default router;
