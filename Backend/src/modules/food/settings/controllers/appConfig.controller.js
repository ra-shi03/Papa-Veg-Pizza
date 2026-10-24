import { FoodAppConfig } from '../models/appConfig.model.js';
import { sendResponse, sendError } from '../../../../utils/response.js';

const DEFAULT_CONFIG_DATA = {
  customerAppVersion: '2.4.2',
  androidVersion: '2.4.1',
  iosVersion: '2.4.0',
  forceUpdate: false,
  releaseNotes: "We've added UPI payment routing fixes and optimized real-time map drawing buffers for couriers. App launches will check version compatibility on bootstrap.",
  updateMessage: "A critical patch is ready. Please update your Papa Veg Pizza app to continue ordering.",
  paymentOptionEnabled: true,
  walletEnabled: true,
  loyaltyEnabled: true,
  couponEnabled: true,
  referralEnabled: true,
  guestCheckoutEnabled: true,
  reviewsEnabled: true,
  wishlistEnabled: true,
  liveTrackingEnabled: true,
  chatEnabled: true,
  scheduledOrdersEnabled: true,
  codEnabled: true,
  pickupEnabled: true,
  maintenanceBanner: false,
  multiStoreEnabled: true,
  aiRecommendationsEnabled: true,
  darkModeEnabled: false,
  analyticsEnabled: true,
  pushNotificationsEnabled: true,
  inventorySyncEnabled: true,
  updatedBy: 'Rohan Sharma (Super Admin)',
  versionHistory: [
    { version: 'v2.4.2', notes: 'Patch: Payment option & UPI auto-routing updates', user: 'Rohan Sharma', time: 'Just now', date: new Date() },
    { version: 'v2.4.1', notes: 'Minor: Referral program activation', user: 'Rohan Sharma', time: '2 hours ago', date: new Date(Date.now() - 7200000) },
    { version: 'v2.4.0', notes: 'Feature: Multi-store regional routing', user: 'Aman Verma', time: '1 day ago', date: new Date(Date.now() - 86400000) },
    { version: 'v2.3.9', notes: 'Fix: Invoice sequence prefix alignment', user: 'Sarah D.', time: '3 days ago', date: new Date(Date.now() - 259200000) }
  ]
};

/**
 * Public: Get app configuration (used by User storefront & mobile apps)
 */
export async function getAppConfigPublic(req, res, next) {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    let config = await FoodAppConfig.findOne().lean();
    if (!config) {
      config = await FoodAppConfig.create(DEFAULT_CONFIG_DATA);
      config = config.toObject ? config.toObject() : config;
    }
    return sendResponse(res, 200, 'Public app configuration retrieved successfully', config);
  } catch (err) {
    next(err);
  }
}

/**
 * Super Admin: Get full app configuration
 */
export async function getAppConfigAdmin(req, res, next) {
  try {
    let config = await FoodAppConfig.findOne().lean();
    if (!config) {
      config = await FoodAppConfig.create(DEFAULT_CONFIG_DATA);
      config = config.toObject ? config.toObject() : config;
    }
    return sendResponse(res, 200, 'App configuration retrieved successfully', config);
  } catch (err) {
    next(err);
  }
}

/**
 * Super Admin: Update full app configuration
 */
export async function updateAppConfigAdmin(req, res, next) {
  try {
    const payload = req.body || {};
    const adminUser = req.user?.name || req.user?.email || payload.updatedBy || 'Super Admin';

    let config = await FoodAppConfig.findOne();
    if (!config) {
      config = new FoodAppConfig(DEFAULT_CONFIG_DATA);
    }

    const versionChanged = payload.customerAppVersion && payload.customerAppVersion !== config.customerAppVersion;
    if (versionChanged) {
      const historyItem = {
        version: `v${payload.customerAppVersion}`,
        notes: payload.releaseNotes || 'Version build update',
        user: adminUser,
        time: 'Just now',
        date: new Date()
      };
      config.versionHistory = [historyItem, ...(config.versionHistory || [])].slice(0, 20);
    }

    // Apply allowed keys
    const allowedKeys = [
      'customerAppVersion',
      'androidVersion',
      'iosVersion',
      'forceUpdate',
      'releaseNotes',
      'updateMessage',
      'paymentOptionEnabled',
      'walletEnabled',
      'loyaltyEnabled',
      'couponEnabled',
      'referralEnabled',
      'guestCheckoutEnabled',
      'reviewsEnabled',
      'wishlistEnabled',
      'liveTrackingEnabled',
      'chatEnabled',
      'scheduledOrdersEnabled',
      'codEnabled',
      'pickupEnabled',
      'maintenanceBanner',
      'multiStoreEnabled',
      'aiRecommendationsEnabled',
      'darkModeEnabled',
      'analyticsEnabled',
      'pushNotificationsEnabled',
      'inventorySyncEnabled'
    ];

    allowedKeys.forEach(key => {
      if (payload[key] !== undefined) {
        config[key] = payload[key];
      }
    });

    config.updatedBy = adminUser;
    await config.save();

    return sendResponse(res, 200, 'App configuration updated successfully', config);
  } catch (err) {
    next(err);
  }
}

/**
 * Super Admin: Update a single feature flag toggle
 */
export async function updateFeatureToggleAdmin(req, res, next) {
  try {
    const { key, enabled, name, description } = req.body || {};
    if (!key) {
      return sendError(res, 400, 'Feature key is required');
    }

    const adminUser = req.user?.name || req.user?.email || 'Super Admin';

    let config = await FoodAppConfig.findOne();
    if (!config) {
      config = new FoodAppConfig(DEFAULT_CONFIG_DATA);
    }

    config[key] = Boolean(enabled);
    config.updatedBy = adminUser;

    // Optional history note for feature flag changes
    if (name) {
      const historyItem = {
        version: `v${config.customerAppVersion}`,
        notes: `Feature: ${name} ${enabled ? 'Enabled' : 'Disabled'}`,
        user: adminUser,
        time: 'Just now',
        date: new Date()
      };
      config.versionHistory = [historyItem, ...(config.versionHistory || [])].slice(0, 20);
    }

    await config.save();

    return sendResponse(res, 200, `Feature ${key} updated successfully`, config);
  } catch (err) {
    next(err);
  }
}

