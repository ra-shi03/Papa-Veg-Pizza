import mongoose from 'mongoose';

/** Cheesy Rewards enrolment + points balance. Loyalty points only — never money. */
const rewardMembershipSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodUser', required: true, unique: true },
        status: { type: String, enum: ['ACTIVE', 'QUIT'], default: 'ACTIVE' },
        pointsBalance: {
            type: Number,
            default: 0,
            min: 0,
            validate: { validator: Number.isInteger, message: 'pointsBalance must be an integer' }
        },
        lifetimeEarned: { type: Number, default: 0, min: 0 },
        enrolledAt: { type: Date, default: null },
        quitAt: { type: Date, default: null }
    },
    { collection: 'rewardMemberships', timestamps: true }
);

export const RewardMembership =
    mongoose.models.RewardMembership || mongoose.model('RewardMembership', rewardMembershipSchema);
