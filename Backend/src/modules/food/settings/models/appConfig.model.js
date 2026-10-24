import mongoose from 'mongoose';

const appConfigSchema = new mongoose.Schema(
  {
    customerAppVersion: {
      type: String,
      default: '2.4.2',
      trim: true
    },
    androidVersion: {
      type: String,
      default: '2.4.1',
      trim: true
    },
    iosVersion: {
      type: String,
      default: '2.4.0',
      trim: true
    },
    forceUpdate: {
      type: Boolean,
      default: false
    },
    releaseNotes: {
      type: String,
      default: "We've added UPI payment routing fixes and optimized real-time map drawing buffers for couriers. App launches will check version compatibility on bootstrap."
    },
    updateMessage: {
      type: String,
      default: "A critical patch is ready. Please update your Papa Veg Pizza app to continue ordering."
    },

    // ── Customer Features ──
    paymentOptionEnabled: {
      type: Boolean,
      default: true
    },
    walletEnabled: {
      type: Boolean,
      default: true
    },
    loyaltyEnabled: {
      type: Boolean,
      default: true
    },
    couponEnabled: {
      type: Boolean,
      default: true
    },
    referralEnabled: {
      type: Boolean,
      default: true
    },
    guestCheckoutEnabled: {
      type: Boolean,
      default: true
    },
    reviewsEnabled: {
      type: Boolean,
      default: true
    },
    wishlistEnabled: {
      type: Boolean,
      default: true
    },

    // ── Order Features ──
    liveTrackingEnabled: {
      type: Boolean,
      default: true
    },
    chatEnabled: {
      type: Boolean,
      default: true
    },
    scheduledOrdersEnabled: {
      type: Boolean,
      default: true
    },
    codEnabled: {
      type: Boolean,
      default: true
    },
    pickupEnabled: {
      type: Boolean,
      default: true
    },

    // ── Platform Features ──
    maintenanceBanner: {
      type: Boolean,
      default: false
    },
    multiStoreEnabled: {
      type: Boolean,
      default: true
    },
    aiRecommendationsEnabled: {
      type: Boolean,
      default: true
    },
    darkModeEnabled: {
      type: Boolean,
      default: false
    },
    analyticsEnabled: {
      type: Boolean,
      default: true
    },
    pushNotificationsEnabled: {
      type: Boolean,
      default: true
    },
    inventorySyncEnabled: {
      type: Boolean,
      default: true
    },

    // ── Meta / Audit ──
    updatedBy: {
      type: String,
      default: 'Super Admin'
    },
    versionHistory: [
      {
        version: { type: String, default: 'v2.4.2' },
        notes: { type: String, default: '' },
        user: { type: String, default: 'Super Admin' },
        time: { type: String, default: '' },
        date: { type: Date, default: Date.now }
      }
    ]
  },
  {
    collection: 'food_app_configurations',
    timestamps: true
  }
);

export const FoodAppConfig = mongoose.model('FoodAppConfig', appConfigSchema);

