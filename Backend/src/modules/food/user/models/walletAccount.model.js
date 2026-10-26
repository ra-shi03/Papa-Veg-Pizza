import mongoose from 'mongoose';

/**
 * Monetary (refund) wallet — one per customer and currency.
 * Amounts are integer paise. Kept separate from reward points (see rewardMembership.model.js).
 */
const walletAccountSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        currency: { type: String, default: 'INR', uppercase: true, trim: true },
        availableBalancePaise: {
            type: Number,
            default: 0,
            min: 0,
            validate: { validator: Number.isInteger, message: 'availableBalancePaise must be an integer' }
        },
        reservedBalancePaise: {
            type: Number,
            default: 0,
            min: 0,
            validate: { validator: Number.isInteger, message: 'reservedBalancePaise must be an integer' }
        },
        status: { type: String, enum: ['ACTIVE', 'SUSPENDED', 'CLOSED'], default: 'ACTIVE' }
    },
    { collection: 'walletAccounts', timestamps: true }
);

walletAccountSchema.index({ userId: 1, currency: 1 }, { unique: true });

export const WalletAccount = mongoose.models.WalletAccount || mongoose.model('WalletAccount', walletAccountSchema);
