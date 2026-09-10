import mongoose from 'mongoose';

const foodCouponSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true
        },
        discountType: {
            type: String,
            enum: ['percentage', 'flat'],
            default: 'percentage'
        },
        value: {
            type: Number,
            required: true,
            min: 0
        },
        minimumOrderAmount: {
            type: Number,
            default: 0,
            min: 0
        },
        maxUsage: {
            type: Number,
            default: null, // null means unlimited
            min: 1
        },
        startDate: {
            type: Date,
            default: Date.now
        },
        endDate: {
            type: Date,
            required: true
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true
        }
    },
    {
        collection: 'food_coupons',
        timestamps: true
    }
);

export const FoodCoupon = mongoose.model('FoodCoupon', foodCouponSchema);
