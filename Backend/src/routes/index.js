import express from 'express';
import authRoutes from '../core/auth/auth.routes.js';
import deliveryRoutes from '../modules/food/delivery/routes/delivery.routes.js';
import uploadRoutes from '../modules/uploads/routes/upload.routes.js';
import storeAdminRoutes from '../modules/food/admin/routes/admin.routes.js';
import userRoutes from '../modules/food/user/routes/user.routes.js';
import orderUserRoutes from '../modules/food/orders/routes/order.routes.user.js';
import paymentRoutes from '../core/payments/payment.routes.js';
import fcmRoutes from '../core/notifications/fcm.routes.js';
import notificationRoutes from '../core/notifications/notification.routes.js';
import { authMiddleware, requireSuperAdmin } from '../core/auth/auth.middleware.js';
import * as businessSettingsController from '../modules/food/admin/controllers/businessSettings.controller.js';
import * as productController from '../modules/food/admin/controllers/product.controller.js';
import * as addonController from '../modules/food/admin/controllers/addon.controller.js';
import * as comboController from '../modules/food/admin/controllers/combo.controller.js';
import * as rewardConfigController from '../modules/food/admin/controllers/rewardConfig.controller.js';
import * as categoryProductController from '../modules/food/admin/controllers/categoryProduct.controller.js';
import * as adminController from '../modules/food/admin/controllers/admin.controller.js';
import { requireRoles } from '../core/roles/role.middleware.js';
import { getQueuesController } from '../controllers/admin.controller.js';
import webhookRoutes from '../core/payments/routes/webhook.routes.js';
import searchRoutes from '../modules/food/search/routes/search.routes.js';
import franchiseStoreRoutes from '../modules/food/franchise/routes/store.routes.js';
import franchiseStoreManagerRoutes from '../modules/food/franchise/routes/storeManager.routes.js';
import franchiseStoreApprovalRoutes from '../modules/food/franchise/routes/storeApproval.routes.js';
import kitchenStaffRoutes from '../modules/food/store/routes/kitchenStaff.routes.js';
import storeOrderRoutes from '../modules/food/store/routes/storeOrders.routes.js';
import { listFranchiseOrders } from '../modules/food/store/controllers/storeOrders.controller.js';
import { resolveStoreForLocation } from '../modules/food/orders/services/order-store.service.js';
import { trackOrderPublicController, getOrderHistoryPublicController, getOrderMethodsController } from '../modules/food/orders/controllers/order.controller.js';
import {
  submitInquiryPublic,
  getConfigPublic,
  listInquiriesAdmin,
  updateInquiryStatusAdmin,
  deleteInquiryAdmin,
  updateConfigAdmin
} from '../modules/food/orders/controllers/bulkOrder.controller.js';
import settingsRoutes from '../modules/food/settings/routes/settings.routes.js';
import dynamicHomeRoutes from '../modules/food/settings/routes/dynamicHome.routes.js';
import * as appConfigController from '../modules/food/settings/controllers/appConfig.controller.js';
import { getPublicPageController } from '../modules/food/admin/controllers/pageContent.controller.js';

const router = express.Router();

router.use('/v1/stores', franchiseStoreRoutes);
router.use('/v1/store-managers', franchiseStoreManagerRoutes);
router.use('/v1/store-approvals', franchiseStoreApprovalRoutes);
router.use('/v1/food/store/staff', kitchenStaffRoutes);
router.use('/v1/food/store/orders', storeOrderRoutes);
router.get('/v1/food/franchise/orders', authMiddleware, requireRoles('ADMIN'), listFranchiseOrders);

// Public: which store serves a delivery location (nearest approved store, zone-aware)
router.get('/v1/food/stores/resolve', async (req, res, next) => {
    try {
        const lat = parseFloat(req.query.lat);
        const lng = parseFloat(req.query.lng);
        const { store, distanceKm } = await resolveStoreForLocation(lat, lng);
        res.json({
            success: true,
            data: {
                storeId: String(store._id),
                franchiseId: String(store.franchiseId),
                storeName: store.storeName,
                phone: store.phone,
                zoneId: store.zoneId ? String(store.zoneId) : null,
                distanceKm
            }
        });
    } catch (err) {
        next(err);
    }
});

router.get('/v1/health', (req, res) => {
    res.status(200).json({ status: 'UP', message: 'Server is healthy' });
});

// Mock public env routes to prevent 404 errors from frontend
router.get('/v1/food/public/env', (req, res) => res.status(200).json({ success: true, data: {} }));
router.get('/v1/env/public', (req, res) => res.status(200).json({ success: true, data: {} }));

// Public landing settings route for User App (BottomNavigation, Under250, etc.)
router.get(['/v1/food/landing/settings/public', '/v1/landing/settings/public'], (req, res) => {
    return res.status(200).json({
        success: true,
        message: 'Landing settings fetched successfully',
        data: {
            under250PriceLimit: 250,
            appName: 'Papa Veg Pizza',
            currency: '₹',
            currencySymbol: '₹'
        }
    });
});

// Food-prefixed auth routes
router.use('/v1/food/auth', authRoutes);

// Backward-compatible auth routes
router.use('/v1/auth', authRoutes);
router.use('/auth', authRoutes);

router.use('/v1/food/delivery', deliveryRoutes);
router.use('/v1/food/search', searchRoutes);
router.use('/v1/uploads', uploadRoutes);

// Mark business-settings/public as truly public
router.get('/v1/food/admin/business-settings/public', businessSettingsController.getBusinessSettings);

// Public menu route
router.get('/v1/food/admin/menu/public', productController.getPublicMenu);

// Public products routes
router.get('/v1/food/admin/products', productController.getProducts);
router.get('/v1/food/admin/products/public', productController.getPublicProducts);
router.get('/v1/food/products/public', productController.getPublicProducts);

// Public combos (Meal for 1 / 2 / 4) route
router.get(['/v1/food/combos/public', '/v1/food/admin/combos/public'], comboController.getPublicCombos);

// Public addons route
router.get('/v1/food/admin/addons/public', addonController.getAddons);
router.get('/v1/food/admin/addons/stats', addonController.getAddonStats);
router.get('/v1/food/admin/addons/stats/public', addonController.getAddonStats);

// Public rewards config route
router.get('/v1/food/admin/rewards/public', rewardConfigController.getPublicRewardConfig);

// Public FAQs route
import * as faqController from '../modules/food/settings/controllers/faq.controller.js';
router.get('/v1/food/faqs/public', faqController.getPublicFaqs);

// Public category-products routes
router.get('/v1/food/admin/category-products', categoryProductController.getCategoryProducts);
router.get('/v1/food/admin/category-products/public', categoryProductController.getCategoryProducts);
router.get('/v1/food/admin/category-products/categories', categoryProductController.getCategoryProducts);

// Public categories routes (No Auth Required - serves categories from CategoryProduct)
router.get('/v1/food/admin/categories', categoryProductController.getCategoryProducts);
router.get('/v1/food/admin/categories/public', categoryProductController.getCategoryProducts);
router.get('/v1/food/categories/public', categoryProductController.getCategoryProducts);
router.get('/v1/food/categories', categoryProductController.getCategoryProducts);

// Public Order Tracking route (No Auth Required)
router.post(['/v1/food/orders/track', '/v1/orders/track', '/v1/food/orders/track-public'], trackOrderPublicController);
router.get(['/v1/food/orders/track', '/v1/orders/track', '/v1/food/orders/track-public'], trackOrderPublicController);

// Public Order History route (No Auth Required)
router.post(['/v1/food/orders/history', '/v1/orders/history', '/v1/food/orders/history-lookup', '/v1/orders/history-lookup'], getOrderHistoryPublicController);
router.get(['/v1/food/orders/history', '/v1/orders/history', '/v1/food/orders/history-lookup', '/v1/orders/history-lookup'], getOrderHistoryPublicController);

// Public Order Methods route (No Auth Required)
router.get(['/v1/food/orders/methods', '/v1/orders/methods', '/v1/food/order-methods', '/v1/order-methods'], getOrderMethodsController);

// Public Bulk Order routes (No Auth Required)
router.post(['/v1/food/bulk-order/inquiry', '/v1/bulk-order/inquiry'], submitInquiryPublic);
router.get(['/v1/food/bulk-order/config', '/v1/bulk-order/config'], getConfigPublic);

// Admin Bulk Order routes (platform-wide: super admin only; requireRoles('ADMIN') would also let franchise admins in)
router.get(['/v1/food/admin/bulk-orders', '/v1/admin/bulk-orders'], authMiddleware, requireSuperAdmin, listInquiriesAdmin);
router.patch(['/v1/food/admin/bulk-orders/:id/status', '/v1/admin/bulk-orders/:id/status'], authMiddleware, requireSuperAdmin, updateInquiryStatusAdmin);
router.delete(['/v1/food/admin/bulk-orders/:id', '/v1/admin/bulk-orders/:id'], authMiddleware, requireSuperAdmin, deleteInquiryAdmin);
router.get(['/v1/food/admin/bulk-orders/config', '/v1/admin/bulk-orders/config'], authMiddleware, requireSuperAdmin, getConfigPublic);
router.put(['/v1/food/admin/bulk-orders/config', '/v1/admin/bulk-orders/config'], authMiddleware, requireSuperAdmin, updateConfigAdmin);

router.use('/v1/food/admin', authMiddleware, requireRoles('ADMIN'), storeAdminRoutes);
router.use('/v1/food/user', authMiddleware, requireRoles('USER'), userRoutes);
router.use('/v1/food/notifications', authMiddleware, requireRoles('USER', 'STORE', 'DELIVERY_PARTNER'), notificationRoutes);
router.use('/v1/food/orders', authMiddleware, requireRoles('USER'), orderUserRoutes);
router.use('/v1/food/payments', authMiddleware, paymentRoutes);
router.use('/v1/payments/webhook', webhookRoutes);

router.use('/v1/fcm-tokens', fcmRoutes);
router.use('/fcm-tokens', fcmRoutes);

router.get('/v1/admin/queues', authMiddleware, requireSuperAdmin, getQueuesController);

// App Configuration public & admin aliases
router.get(['/v1/food/app-config/public', '/v1/app-config/public'], appConfigController.getAppConfigPublic);
router.get(['/v1/food/admin/app-config', '/v1/admin/app-config'], authMiddleware, requireSuperAdmin, appConfigController.getAppConfigAdmin);
router.put(['/v1/food/admin/app-config', '/v1/admin/app-config'], authMiddleware, requireSuperAdmin, appConfigController.updateAppConfigAdmin);
router.patch(['/v1/food/admin/app-config/feature', '/v1/admin/app-config/feature'], authMiddleware, requireSuperAdmin, appConfigController.updateFeatureToggleAdmin);

// Public CMS Pages (About, Terms, Privacy, Refund, Shipping, Cancellation)
router.get(['/v1/food/pages/:key', '/v1/pages/:key', '/food/pages/:key', '/pages/:key'], getPublicPageController);

router.use('/v1/settings', settingsRoutes);
router.use('/v1/dynamic-home', dynamicHomeRoutes);

export default router;
