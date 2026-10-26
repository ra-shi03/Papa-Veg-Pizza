import mongoose from 'mongoose';

/** Permanent points history. Rows are never edited; reversals are new REVERSAL rows. */
const rewardLedgerSchema = new mongoose.Schema(
    {
        membershipId: { type: mongoose.Schema.Types.ObjectId, ref: 'RewardMembership', required: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodOrder', default: null },
        type: { type: String, enum: ['EARN', 'REDEEM', 'REVERSAL', 'EXPIRE', 'FORFEIT'], required: true },
        direction: { type: String, enum: ['CREDIT', 'DEBIT'], required: true },
        points: {
            type: Number,
            required: true,
            min: 1,
            validate: { validator: Number.isInteger, message: 'points must be an integer' }
        },
        balanceAfter: { type: Number, required: true, min: 0 },
        description: { type: String, default: '', trim: true },
        idempotencyKey: { type: String, required: true, unique: true, trim: true },
        expiresAt: { type: Date, default: null },
        metadata: { type: mongoose.Schema.Types.Mixed, default: undefined }
    },
    { collection: 'rewardLedger', timestamps: { createdAt: true, updatedAt: false } }
);

rewardLedgerSchema.index({ userId: 1, createdAt: -1 });
rewardLedgerSchema.index({ orderId: 1, type: 1 });

export const RewardLedger = mongoose.models.RewardLedger || mongoose.model('RewardLedger', rewardLedgerSchema);
