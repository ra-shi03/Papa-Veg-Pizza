import express from 'express';
import { requireAdmin } from '../../../../core/auth/auth.middleware.js';
import * as adminController from '../controllers/admin.controller.js';
import * as staffController from '../controllers/staff.controller.js';
import * as foodApprovalController from '../controllers/foodApproval.controller.js';
import * as addonsApprovalController from '../controllers/addonsApproval.controller.js';
import * as businessSettingsController from '../controllers/businessSettings.controller.js';
import * as feedbackExperienceController from '../controllers/feedbackExperience.controller.js';
import * as notificationBroadcastController from '../controllers/notificationBroadcast.controller.js';
import * as franchiseController from '../controllers/franchise.controller.js';
import * as geographyController from '../controllers/geography.controller.js';

import * as orderController from '../../orders/controllers/order.controller.js';
import { getAdminPageController, upsertAdminPageController } from '../controllers/pageContent.controller.js';
import { upload } from '../../../../middleware/upload.js';

const router = express.Router();

// ----- Public Business Settings (No Admin Required) -----
router.get('/business-settings/public', businessSettingsController.getBusinessSettings);

router.use(requireAdmin);

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

// ----- Customers -----
router.get('/customers', adminController.getCustomers);
router.get('/customers/:id', adminController.getCustomerById);
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

// ----- Stores -----
router.get('/stores', adminController.getStores);
router.get('/dashboard-stats', adminController.getDashboardStats);
router.get('/reports/stores', adminController.getStoreReport);
router.get('/reports/transactions', adminController.getTransactionReport);
router.get('/reports/tax', adminController.getTaxReport);
router.get('/reports/tax/:id', adminController.getTaxReportDetail);
router.get('/stores/pending', adminController.getPendingStores);
router.get('/stores/reviews', adminController.getStoreReviews);
router.get('/stores/:id/menu-pdf', adminController.getStoreMenuPdfDownloadUrl);
router.get('/stores/:id/download-menu-pdf', adminController.downloadStoreMenuPdf);
router.get('/stores/:id', adminController.getStoreById);
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
router.get('/categories', adminController.getCategories);
router.post('/categories', adminController.createCategory);
router.patch('/categories/:id', adminController.updateCategory);
router.delete('/categories/:id', adminController.deleteCategory);
router.patch('/categories/:id/toggle', adminController.toggleCategoryStatus);
router.patch('/categories/:id/approve', adminController.approveCategory);
router.patch('/categories/:id/reject', adminController.rejectCategory);
router.patch('/categories/:id/make-global', adminController.makeCategoryGlobal);

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
router.post('/foods', adminController.createFood);
router.patch('/foods/:id', adminController.updateFood);
router.delete('/foods/:id', adminController.deleteFood);

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
router.get('/regions', geographyController.getRegions);
router.post('/regions', geographyController.createRegion);
router.get('/regions/:id', geographyController.getRegionById);
router.patch('/regions/:id', geographyController.updateRegion);
router.delete('/regions/:id', geographyController.deleteRegion);

router.get('/zones', geographyController.getZones);
router.post('/zones', geographyController.createZone);
router.get('/zones/:id', geographyController.getZoneById);
router.patch('/zones/:id', geographyController.updateZone);
router.delete('/zones/:id', geographyController.deleteZone);

router.get('/territories', geographyController.getTerritories);
router.post('/territories', geographyController.createTerritory);
router.get('/territories/:id', geographyController.getTerritoryById);
router.patch('/territories/:id', geographyController.updateTerritory);
router.delete('/territories/:id', geographyController.deleteTerritory);
// ----- Orders -----
router.get('/orders', orderController.listOrdersAdminController);
router.get('/orders/:orderId', orderController.getOrderByIdAdminController);
router.delete('/orders/:orderId', orderController.deleteOrderAdminController);

// ----- CMS Pages (About + legal) -----
router.get('/pages-social-media/:key', getAdminPageController);
router.put('/pages-social-media/:key', upsertAdminPageController);

router.get('/sidebar-badges', adminController.getSidebarBadges);
// ----- Staff / RBAC Management -----
router.post('/staff', staffController.createStaff);
router.get('/staff', staffController.getStaffList);
router.put('/staff/:id', staffController.updateStaff);
router.delete('/staff/:id', staffController.deleteStaff);

export default router;
