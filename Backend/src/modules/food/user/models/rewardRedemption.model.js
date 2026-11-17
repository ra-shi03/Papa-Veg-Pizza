import mongoose from 'mongoose';

/**
 * A reward the customer claimed with their points: they get a short code, show it at a store, and the store manager hands
 * over the free item. The points are taken when the code is made and given back if the code is cancelled or runs out.
 */
const rewardRedemptionSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        code: { type: String, required: true, unique: true, trim: true },
        // What the super admin's reward list said at the time (the list can change later)
        product: {
            productId: { type: String, default: '' },
            name: { type: String, required: true },
            size: { type: String, default: '' },
            crust: { type: String, default: '' },
            image: { type: String, default: '' },
            originalPrice: { type: Number, default: 0 }
        },
        points: { type: Number, required: true, min: 1 },
        status: { type: String, enum: ['PENDING', 'REDEEMED', 'CANCELLED', 'EXPIRED'], default: 'PENDING', index: true },
        expiresAt: { type: Date, required: true },
        redeemedAt: { type: Date, default: null },
        storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodStore', default: null },
        handledBy: { type: mongoose.Schema.Types.ObjectId, default: null },
        handledByName: { type: String, default: '' },
        cancelReason: { type: String, default: '' },
        // set when the reward was taken in an online order instead of at a store
        orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodOrder', default: null, index: true }
    },
    { collection: 'rewardRedemptions', timestamps: true }
);

rewardRedemptionSchema.index({ userId: 1, createdAt: -1 });

export const RewardRedemption = mongoose.models.RewardRedemption || mongoose.model('RewardRedemption', rewardRedemptionSchema);
