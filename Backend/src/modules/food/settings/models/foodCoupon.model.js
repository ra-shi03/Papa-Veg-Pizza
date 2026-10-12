import mongoose from 'mongoose';

const foodCouponSchema = new mongoose.Schema(
    {
        code: { type: String, required: true, unique: true, uppercase: true, trim: true },
        title: { type: String, required: true, trim: true },
        description: { type: String, trim: true, default: '' },
        couponType: { 
            type: String, 
            enum: ['Percentage', 'Flat Amount', 'Buy One Get One', 'Free Product'],
            default: 'Percentage'
        },
        value: { type: Number, default: 0 },
        discountValue: { type: Number, default: 0 },
        minimumOrderAmount: { type: Number, default: 0, min: 0 },
        maximumDiscount: { type: Number, default: 0 },
        maxDiscount: { type: Number, default: null },
        usageLimit: { type: Number, default: 1000 },
        usageLimitTotal: { type: Number, default: 1000 },
        usagePerCustomer: { type: Number, default: 1 },
        usageLimitPerUser: { type: Number, default: 1 },
        usageCount: { type: Number, default: 0 },
        applicableOn: { type: String, default: 'All' },
        productIds: [{ type: String }],
        categoryIds: [{ type: String }],
        regionIds: [{ type: String }],
        zoneIds: [{ type: String }],
        territoryIds: [{ type: String }],
        franchiseIds: [{ type: String }],
        storeIds: [{ type: String }],
        customerSegments: [{ type: String }],
        startDate: { type: Date, default: Date.now },
        endDate: { type: Date, required: true },
        status: { type: String, default: 'active' },
        isActive: { type: Boolean, default: true, index: true },
        showOnHome: { type: Boolean, default: false, index: true },
        createdBy: { type: String, default: 'Super Admin' }
    },
    { collection: 'food_coupons', timestamps: true, strict: false }
);

export const FoodCoupon = mongoose.models.FoodCoupon || mongoose.model('FoodCoupon', foodCouponSchema);
