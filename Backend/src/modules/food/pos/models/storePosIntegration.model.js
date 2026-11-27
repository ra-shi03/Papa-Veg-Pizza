import mongoose from 'mongoose';

// One store's connection to its own POS (Pet Pooja). Every store has its own Pet Pooja account, so every store has its
// own record: restaurant id, keys and switches. Only the store manager of that store reads or changes it
// (services/posIntegration.service.js). The keys are stored encrypted and are never sent back to a screen.
//
// What the switches mean (all off until the store manager turns Pet Pooja on):
//   enabled              the integration is on for this store
//   pushOrders           each new order of the store is sent to Pet Pooja (where the manager runs it with the Zomato /
//                        Swiggy orders)
//   acceptStatusUpdates  Pet Pooja's status updates (accepted, food ready, cancelled) move the order here, so the customer
//                        and the rider see them. The rider flow (assignment, pickup, delivery) always stays in this app.
//   syncMenu             Pet Pooja may push its menu here (the manager can always fetch it): used to map items
//   syncStock            Pet Pooja's item in / out of stock switches the item on / off in this store's menu
//   syncStoreStatus      Pet Pooja's store on / off opens / closes this store for online orders
const secretSchema = new mongoose.Schema(
    {
        value: { type: String, default: '' },   // AES-256-GCM, see services/posSecrets.js
        last4: { type: String, default: '' },
        updatedAt: { type: Date, default: null },
    },
    { _id: false },
);

const storePosIntegrationSchema = new mongoose.Schema(
    {
        storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodStore', required: true },
        franchiseId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodFranchise', default: null, index: true },
        provider: { type: String, enum: ['petpooja'], default: 'petpooja' },

        enabled: { type: Boolean, default: false },
        pushOrders: { type: Boolean, default: true },
        acceptStatusUpdates: { type: Boolean, default: true },
        syncMenu: { type: Boolean, default: false },
        syncStock: { type: Boolean, default: false },
        syncStoreStatus: { type: Boolean, default: false },

        restaurantId: { type: String, trim: true, default: '', maxlength: 60 },   // Pet Pooja restID (the outlet)
        // Which Pet Pooja server this store talks to: staging (the docs' URLs) or production (the address Pet Pooja gives).
        // '' = not chosen (the server's environment decides, see petpooja.adapter.js endpointUrl)
        apiEnv: { type: String, enum: ['', 'staging', 'production'], default: '' },
        apiBaseUrl: { type: String, trim: true, default: '', maxlength: 300 },
        // This server's public address as Pet Pooja must reach it (for the links below); '' = as the panel reached it
        publicUrl: { type: String, trim: true, default: '', maxlength: 300 },
        appKey: { type: secretSchema, default: () => ({}) },
        appSecret: { type: secretSchema, default: () => ({}) },
        accessToken: { type: secretSchema, default: () => ({}) },
        // Our item -> Pet Pooja item, for the order lines (services/posMenu.service.js; key / value format in petpooja.adapter.js)
        itemMap: { type: Map, of: String, default: () => new Map() },
        // Items Pet Pooja switched off until a set time, and a store closure with a reopening time (released by the outbox sweep)
        stockHolds: {
            type: [{ _id: false, productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, until: Date }],
            default: [],
        },
        storeHold: { until: { type: Date, default: null } },

        // The secret part of this store's links: status callback (/v1/pos/petpooja/callback/<key>) and menu / stock / store
        // status (/v1/pos/petpooja/hooks/<key>/...). Unguessable, can be rotated.
        callbackKey: { type: String, required: true },
        // this server's public address as the store manager's panel reached it (used for the callback link that goes out
        // with each order when PUBLIC_API_URL is not set)
        callbackBase: { type: String, default: '', trim: true, maxlength: 300 },

        lastTest: {
            at: { type: Date, default: null },
            ok: { type: Boolean, default: null },
            message: { type: String, default: '', maxlength: 300 },
        },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        updatedByName: { type: String, default: '', trim: true },
    },
    { timestamps: true, collection: 'food_store_pos_integrations' },
);

storePosIntegrationSchema.index({ storeId: 1, provider: 1 }, { unique: true });
storePosIntegrationSchema.index({ callbackKey: 1 }, { unique: true });
// Pet Pooja's own calls (menu, stock, store status) name the outlet only by its restaurant ID
storePosIntegrationSchema.index({ restaurantId: 1 });
storePosIntegrationSchema.index({ 'stockHolds.until': 1 });
storePosIntegrationSchema.index({ 'storeHold.until': 1 });

export const StorePosIntegration = mongoose.models.StorePosIntegration
    || mongoose.model('StorePosIntegration', storePosIntegrationSchema);
