import { FoodCoupon } from '../models/foodCoupon.model.js';

const defaultSeedCoupons = [
    {
        code: 'WELCOME50',
        title: '50% Off First Order',
        description: 'Get 50% discount up to ₹150 on your first Papa Veg Pizza order',
        couponType: 'Percentage',
        value: 50,
        discountValue: 50,
        minimumOrderAmount: 249,
        maximumDiscount: 150,
        usageLimit: 1000,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31T23:59:59.000Z'),
        status: 'active',
        isActive: true,
        showOnHome: true
    },
    {
        code: 'PAPAVEG100',
        title: 'Flat ₹100 Off - Delhi Special',
        description: 'Flat ₹100 off on delicious pizzas across Delhi branches on orders above ₹499',
        couponType: 'Flat Amount',
        value: 100,
        discountValue: 100,
        minimumOrderAmount: 499,
        maximumDiscount: 100,
        usageLimit: 500,
        startDate: new Date('2026-02-01'),
        endDate: new Date('2026-12-31T23:59:59.000Z'),
        status: 'active',
        isActive: true,
        showOnHome: true
    },
    {
        code: 'BOGOMANIA',
        title: 'Buy 1 Get 1 Free Pizza',
        description: 'Buy one medium pizza and get another pizza free of equal or lesser value',
        couponType: 'Buy One Get One',
        value: 0,
        minimumOrderAmount: 399,
        maximumDiscount: 350,
        usageLimit: 300,
        startDate: new Date('2026-03-01'),
        endDate: new Date('2026-12-31T23:59:59.000Z'),
        status: 'active',
        isActive: true,
        showOnHome: true
    },
    {
        code: 'WEEKEND20',
        title: 'Weekend Feast 20% Off',
        description: 'Enjoy 20% discount up to ₹100 on weekend orders across all outlets',
        couponType: 'Percentage',
        value: 20,
        discountValue: 20,
        minimumOrderAmount: 299,
        maximumDiscount: 100,
        usageLimit: 1500,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31T23:59:59.000Z'),
        status: 'active',
        isActive: true,
        showOnHome: true
    }
];

export const getAllCoupons = async (req, res) => {
    try {
        let count = await FoodCoupon.countDocuments();
        if (count === 0) {
            await FoodCoupon.insertMany(defaultSeedCoupons);
        }
        const coupons = await FoodCoupon.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: coupons });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getActivePublicCoupons = async (req, res) => {
    try {
        let count = await FoodCoupon.countDocuments();
        if (count === 0) {
            await FoodCoupon.insertMany(defaultSeedCoupons);
        }
        const now = new Date();
        const coupons = await FoodCoupon.find({
            isActive: { $ne: false },
            status: { $nin: ['disabled', 'Disabled', 'inactive', 'Inactive', 'expired', 'Expired'] },
            $or: [
                { endDate: { $exists: false } },
                { endDate: null },
                { endDate: { $gte: now } }
            ]
        }).sort({ createdAt: -1 });
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
