import mongoose from 'mongoose';

const deliveryFeeRangeSchema = new mongoose.Schema(
    {
        min: { type: Number, required: true, min: 0 },
        max: { type: Number, required: true, min: 0 },
        fee: { type: Number, required: true, min: 0 }
    },
    { _id: false }
);

const feeSettingsSchema = new mongoose.Schema(
    {
        // No defaults here; admin must explicitly configure values.
        deliveryFee: { type: Number, min: 0 },
        deliveryFeeRanges: { type: [deliveryFeeRangeSchema], default: [] },
        freeDeliveryUpTo: { type: Number, min: 0 },
        freeDeliveryThreshold: { type: Number, min: 0 },
        platformFee: { type: Number, min: 0 },
        packagingFee: { type: Number, min: 0 },
        gstRate: { type: Number, min: 0, max: 100 },
        // Flat handling charge added to every order (taxable).
        handlingFee: { type: Number, min: 0 },
        // Flat fee kept when a customer cancels a paid order after the free window; refund = total - fee.
        cancellationFee: { type: Number, min: 0 },
        // Minutes after placing an order during which cancelling is free.
        cancellationFreeMinutes: { type: Number, min: 0 },
        // Per-field switch: false hides that charge from the customer's cart and bill and it is not applied.
        // A key that is missing counts as on.
        feeToggles: { type: mongoose.Schema.Types.Mixed, default: {} },
        isActive: { type: Boolean, default: true, index: true }
    },
    { collection: 'food_fee_settings', timestamps: true }
);

feeSettingsSchema.index({ isActive: 1, createdAt: -1 });

export const FoodFeeSettings = mongoose.model('FoodFeeSettings', feeSettingsSchema);

