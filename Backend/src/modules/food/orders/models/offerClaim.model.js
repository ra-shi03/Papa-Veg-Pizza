import mongoose from 'mongoose';

// One row per limited-time-offer token that has been spent on an order. The unique jti makes
// "one use per token" atomic; the TTL index drops rows once the token could no longer verify anyway.
const offerClaimSchema = new mongoose.Schema(
    {
        jti: { type: String, required: true, unique: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodOrder', required: true },
        expiresAt: { type: Date, required: true }
    },
    { collection: 'food_offer_claims', timestamps: true }
);

offerClaimSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 3600 });

export const FoodOfferClaim = mongoose.model('FoodOfferClaim', offerClaimSchema);
