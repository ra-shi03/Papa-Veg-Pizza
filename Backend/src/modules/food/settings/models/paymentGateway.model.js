import mongoose from 'mongoose';

// Providers whose settings can be stored here, and the ones the server can actually charge through. Add a provider to
// CHARGEABLE_PROVIDERS only once its API is integrated; until then its settings are saved but customers never see it.
export const SUPPORTED_PROVIDERS = ['Razorpay', 'PhonePe', 'Cashfree', 'Paytm', 'Stripe', 'PayPal'];
export const CHARGEABLE_PROVIDERS = ['Razorpay'];

const paymentGatewaySchema = new mongoose.Schema(
    {
        provider: { type: String, enum: SUPPORTED_PROVIDERS, required: true, unique: true },
        // What customers see on the payment page (defaults to the provider name)
        displayName: { type: String, trim: true, default: '' },
        merchantId: { type: String, trim: true, default: '' },
        keyId: { type: String, trim: true, required: true },
        // Encrypted at rest (see paymentGateway.service.js); never sent to any client
        secretKeyEnc: { type: String, required: true },
        webhookSecretEnc: { type: String, default: '' },
        environment: { type: String, enum: ['Sandbox', 'Production'], default: 'Sandbox' },
        status: { type: String, enum: ['Active', 'Inactive'], default: 'Active', index: true },
        defaultGateway: { type: Boolean, default: false },
        createdBy: { type: String, default: '' },
        updatedBy: { type: String, default: '' }
    },
    { collection: 'food_payment_gateways', timestamps: true }
);

export const FoodPaymentGateway = mongoose.models.FoodPaymentGateway || mongoose.model('FoodPaymentGateway', paymentGatewaySchema);

// What changed on this screen, and each connection test (the "Recent Configuration Changes" feed).
const eventSchema = new mongoose.Schema(
    {
        action: { type: String, required: true },
        desc: { type: String, default: '' },
        user: { type: String, default: '' },
        type: { type: String, enum: ['info', 'success', 'warning', 'error'], default: 'info' },
        provider: { type: String, default: '' },
        // Set on connection tests only
        ok: { type: Boolean },
        latencyMs: { type: Number }
    },
    { collection: 'food_payment_gateway_events', timestamps: { createdAt: 'at', updatedAt: false } }
);
eventSchema.index({ at: -1 });

export const FoodPaymentGatewayEvent = mongoose.models.FoodPaymentGatewayEvent || mongoose.model('FoodPaymentGatewayEvent', eventSchema);
