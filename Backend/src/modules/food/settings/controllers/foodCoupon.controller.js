import { FoodCoupon } from '../models/foodCoupon.model.js';

export const getAllCoupons = async (req, res) => {
    try {
        const coupons = await FoodCoupon.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: coupons });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getCouponById = async (req, res) => {
    try {
        const coupon = await FoodCoupon.findById(req.params.id);
        if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
        res.status(200).json({ success: true, data: coupon });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createCoupon = async (req, res) => {
    try {
        const coupon = await FoodCoupon.create(req.body);
        res.status(201).json({ success: true, data: coupon });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Coupon code already exists' });
        }
        res.status(400).json({ success: false, message: error.message });
    }
};

export const updateCoupon = async (req, res) => {
    try {
        const coupon = await FoodCoupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
        res.status(200).json({ success: true, data: coupon });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Coupon code already exists' });
        }
        res.status(400).json({ success: false, message: error.message });
    }
};

export const deleteCoupon = async (req, res) => {
    try {
        const coupon = await FoodCoupon.findByIdAndDelete(req.params.id);
        if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
        res.status(200).json({ success: true, message: 'Coupon deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getCouponAnalytics = async (req, res) => {
    try {
        const coupons = await FoodCoupon.find();
        const totalUses = coupons.reduce((sum, c) => sum + (c.usageCount || 0), 0);
        const revenue = coupons.reduce((sum, c) => sum + (c.revenueGenerated || 0), 0);
        const discountGiven = coupons.reduce((sum, c) => sum + ((c.usageCount || 0) * (c.value || c.discountValue || 0)), 0);
        const aov = totalUses > 0 ? Math.round(revenue / totalUses) : 0;

        const now = new Date();
        const activeCoupons = coupons.filter(c => c.isActive && new Date(c.endDate) > now).length;
        const expiredCoupons = coupons.filter(c => new Date(c.endDate) <= now).length;
        const disabledCoupons = coupons.filter(c => !c.isActive).length;

        // Clean daily breakdown & recent redemption logs
        const dailyUsage = [
            { day: 'Mon', height: 0, uses: 0 },
            { day: 'Tue', height: 0, uses: 0 },
            { day: 'Wed', height: 0, uses: 0 },
            { day: 'Thu', height: 0, uses: 0 },
            { day: 'Fri', height: 0, uses: 0 },
            { day: 'Sat', height: 0, uses: 0 },
            { day: 'Sun', height: 0, uses: 0 }
        ];

        res.status(200).json({
            success: true,
            data: {
                totalUses,
                revenue,
                discountGiven,
                aov,
                activeCoupons,
                expiredCoupons,
                disabledCoupons,
                dailyUsage,
                recentUsageHistory: []
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
