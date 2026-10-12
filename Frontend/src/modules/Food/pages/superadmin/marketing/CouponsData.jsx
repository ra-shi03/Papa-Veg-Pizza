import React, { useState, useEffect, useMemo } from 'react';
import { Edit, Eye, Trash2, CheckCircle2, AlertCircle, Ban } from 'lucide-react';
import { adminClient } from '../../../../../services/api/axios';

// ==========================================
// 1. DATA MODELS & DATASETS (MongoDB Mock)
// ==========================================

export const mockRegions = [
  { id: 'reg-north', name: 'North Region (Delhi-NCR)' },
  { id: 'reg-south', name: 'South Region (Karnataka & TN)' },
  { id: 'reg-west', name: 'West Region (Maharashtra & Gujarat)' },
  { id: 'reg-east', name: 'East Region (West Bengal & Odisha)' }
];

export const mockZones = [
  { id: 'zone-delhi', name: 'Delhi Zone', regionId: 'reg-north' },
  { id: 'zone-noida', name: 'Noida Zone', regionId: 'reg-north' },
  { id: 'zone-blr', name: 'Bangalore Zone', regionId: 'reg-south' },
  { id: 'zone-chennai', name: 'Chennai Zone', regionId: 'reg-south' },
  { id: 'zone-mumbai', name: 'Mumbai Zone', regionId: 'reg-west' },
  { id: 'zone-pune', name: 'Pune Zone', regionId: 'reg-west' },
  { id: 'zone-kolkata', name: 'Kolkata Zone', regionId: 'reg-east' }
];

export const mockTerritories = [
  { id: 'ter-cp', name: 'Connaught Place Territory', zoneId: 'zone-delhi' },
  { id: 'ter-dwarka', name: 'Dwarka Territory', zoneId: 'zone-delhi' },
  { id: 'ter-sec62', name: 'Noida Sector 62 Territory', zoneId: 'zone-noida' },
  { id: 'ter-indiranagar', name: 'Indiranagar Territory', zoneId: 'zone-blr' },
  { id: 'ter-koramangala', name: 'Koramangala Territory', zoneId: 'zone-blr' },
  { id: 'ter-adyar', name: 'Adyar Territory', zoneId: 'zone-chennai' },
  { id: 'ter-bandra', name: 'Bandra Territory', zoneId: 'zone-mumbai' },
  { id: 'ter-hinjewadi', name: 'Hinjewadi Territory', zoneId: 'zone-pune' },
  { id: 'ter-saltlake', name: 'Salt Lake Territory', zoneId: 'zone-kolkata' }
];

export const mockFranchises = [
  { id: 'fran-delhi-prime', name: 'Delhi Prime Foods LLP', territoryId: 'ter-cp' },
  { id: 'fran-dwarka-bites', name: 'Dwarka Pizza Bites', territoryId: 'ter-dwarka' },
  { id: 'fran-noida-corp', name: 'Noida Express Hub', territoryId: 'ter-sec62' },
  { id: 'fran-south-crust', name: 'Southern Crust Franchise', territoryId: 'ter-indiranagar' },
  { id: 'fran-garden-city', name: 'Garden City Pizzeria', territoryId: 'ter-koramangala' },
  { id: 'fran-adyar-eats', name: 'Adyar Fast Eats', territoryId: 'ter-adyar' },
  { id: 'fran-west-coast', name: 'West Coast Hospitality', territoryId: 'ter-bandra' },
  { id: 'fran-pune-tech', name: 'Pune Tech Foods', territoryId: 'ter-hinjewadi' },
  { id: 'fran-bengal-spiceland', name: 'Bengal Spiceland Ltd', territoryId: 'ter-saltlake' }
];

export const mockStores = [
  { id: 'str-cp-1', name: 'Papa Veg Pizza - Connaught Place', franchiseId: 'fran-delhi-prime', city: 'New Delhi' },
  { id: 'str-dwarka-1', name: 'Papa Veg Pizza - Dwarka Sec 10', franchiseId: 'fran-dwarka-bites', city: 'New Delhi' },
  { id: 'str-noida-62', name: 'Papa Veg Pizza - Sector 62', franchiseId: 'fran-noida-corp', city: 'Noida' },
  { id: 'str-indiranagar-1', name: 'Papa Veg Pizza - Indiranagar Main Rd', franchiseId: 'fran-south-crust', city: 'Bangalore' },
  { id: 'str-koramangala-1', name: 'Papa Veg Pizza - Koramangala 5th Block', franchiseId: 'fran-garden-city', city: 'Bangalore' },
  { id: 'str-adyar-1', name: 'Papa Veg Pizza - Adyar Depot', franchiseId: 'fran-adyar-eats', city: 'Chennai' },
  { id: 'str-bandra-1', name: 'Papa Veg Pizza - Bandra Linking Rd', franchiseId: 'fran-west-coast', city: 'Mumbai' },
  { id: 'str-hinjewadi-1', name: 'Papa Veg Pizza - Hinjewadi Phase 1', franchiseId: 'fran-pune-tech', city: 'Pune' },
  { id: 'str-saltlake-1', name: 'Papa Veg Pizza - Salt Lake Sector V', franchiseId: 'fran-bengal-spiceland', city: 'Kolkata' }
];

export const mockCategories = [
  { id: 'cat-pizza-classic', name: 'Classic Pizzas', code: 'CAT-PIZ-CLS' },
  { id: 'cat-pizza-premium', name: 'Premium Pizzas', code: 'CAT-PIZ-PRM' },
  { id: 'cat-sides', name: 'Gourmet Sides', code: 'CAT-SIDES' },
  { id: 'cat-beverages', name: 'Chilled Drinks', code: 'CAT-BEVS' },
  { id: 'cat-desserts', name: 'Desserts & Sweets', code: 'CAT-DESS' }
];

export const mockProducts = [
  { id: 'prod-margherita', name: 'Double Cheese Margherita', sku: 'PVP-PIZ-001', categoryId: 'cat-pizza-classic', price: 299 },
  { id: 'prod-pep-feast', name: 'Veg Pepperoni Feast', sku: 'PVP-PIZ-002', categoryId: 'cat-pizza-classic', price: 389 },
  { id: 'prod-farmhouse', name: 'Farmhouse Special Pizza', sku: 'PVP-PIZ-003', categoryId: 'cat-pizza-premium', price: 449 },
  { id: 'prod-bbq-paneer', name: 'Smoky BBQ Paneer Deluxe', sku: 'PVP-PIZ-004', categoryId: 'cat-pizza-premium', price: 499 },
  { id: 'prod-garlic-bread', name: 'Stuffed Garlic Breadsticks', sku: 'PVP-SID-001', categoryId: 'cat-sides', price: 149 },
  { id: 'prod-paneer-pockets', name: 'Baked Paneer Pockets (2pc)', sku: 'PVP-SID-002', categoryId: 'cat-sides', price: 119 },
  { id: 'prod-coke', name: 'Coca Cola Zero Sugar 500ml', sku: 'PVP-BEV-001', categoryId: 'cat-beverages', price: 60 },
  { id: 'prod-water', name: 'Himalayan Mineral Water 750ml', sku: 'PVP-BEV-002', categoryId: 'cat-beverages', price: 50 },
  { id: 'prod-choco-lava', name: 'Warm Choco Lava Cake', sku: 'PVP-DES-001', categoryId: 'cat-desserts', price: 99 },
  { id: 'prod-brownie', name: 'Sizzling Chocolate Brownie', sku: 'PVP-DES-002', categoryId: 'cat-desserts', price: 129 }
];

export const mockCustomers = [
  { id: 'cust-101', name: 'Aarav Mehta', email: 'aarav.mehta@gmail.com', segment: 'Premium Users' },
  { id: 'cust-102', name: 'Riya Sen', email: 'riya.sen@yahoo.com', segment: 'New Customers' },
  { id: 'cust-103', name: 'Vikram Aditya', email: 'vikram.aditya@outlook.com', segment: 'Premium Users' },
  { id: 'cust-104', name: 'Ananya Iyer', email: 'ananya.iyer@gmail.com', segment: 'Inactive Users' },
  { id: 'cust-105', name: 'Kabir Kapoor', email: 'kabir.k@gmail.com', segment: 'New Customers' },
  { id: 'cust-106', name: 'Diya Sharma', email: 'diya.sharma@gmail.com', segment: 'Premium Users' },
  { id: 'cust-107', name: 'Rahul Dravid', email: 'rahul.d@gmail.com', segment: 'Inactive Users' }
];

export const initialCoupons = [
  {
    _id: 'coupon-seed-001',
    code: 'WELCOME50',
    title: '50% Off First Order',
    description: 'Get 50% discount up to ₹150 on your first Papa Veg Pizza order',
    couponType: 'Percentage',
    value: 50,
    discountValue: 50,
    minimumOrderAmount: 249,
    maximumDiscount: 150,
    maxDiscount: 150,
    usageLimit: 1000,
    usageLimitTotal: 1000,
    usagePerCustomer: 1,
    usageLimitPerUser: 1,
    usageCount: 0,
    revenueGenerated: 0,
    applicableOn: 'All',
    productIds: [],
    categoryIds: [],
    regionIds: [],
    zoneIds: [],
    territoryIds: [],
    franchiseIds: [],
    storeIds: [],
    customerSegments: ['New Customers'],
    customerIds: [],
    startDate: '2026-01-01T00:00:00.000Z',
    endDate: '2026-12-31T23:59:59.000Z',
    status: 'active',
    isActive: true,
    showOnHome: true,
    createdBy: 'Super Admin',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    _id: 'coupon-seed-002',
    code: 'PAPAVEG100',
    title: 'Flat ₹100 Off - Delhi Special',
    description: 'Flat ₹100 off on delicious pizzas across Delhi branches on orders above ₹499',
    couponType: 'Flat Amount',
    value: 100,
    discountValue: 100,
    minimumOrderAmount: 499,
    maximumDiscount: 100,
    maxDiscount: 100,
    usageLimit: 500,
    usageLimitTotal: 500,
    usagePerCustomer: 2,
    usageLimitPerUser: 2,
    usageCount: 0,
    revenueGenerated: 0,
    applicableOn: 'All',
    productIds: [],
    categoryIds: [],
    regionIds: ['6a48d7b89d94a658760493ba'],
    zoneIds: ['6a48e8179d94a658760495c6'],
    territoryIds: ['6a48f75f9d94a65876049aaf'],
    franchiseIds: ['6a48f8179d94a65876049b75'],
    storeIds: ['6aab7536c8d0f85c32b340f8'],
    customerSegments: ['All Customers'],
    customerIds: [],
    startDate: '2026-02-01T00:00:00.000Z',
    endDate: '2026-11-30T23:59:59.000Z',
    status: 'active',
    isActive: true,
    showOnHome: true,
    createdBy: 'Super Admin',
    createdAt: '2026-02-01T00:00:00.000Z',
    updatedAt: '2026-02-01T00:00:00.000Z'
  },
  {
    _id: 'coupon-seed-003',
    code: 'BOGOMANIA',
    title: 'Buy 1 Get 1 Free Pizza',
    description: 'Buy one medium pizza and get another pizza free of equal or lesser value',
    couponType: 'Buy One Get One',
    value: 0,
    discountValue: 0,
    minimumOrderAmount: 399,
    maximumDiscount: 350,
    maxDiscount: 350,
    usageLimit: 300,
    usageLimitTotal: 300,
    usagePerCustomer: 2,
    usageLimitPerUser: 2,
    usageCount: 0,
    revenueGenerated: 0,
    applicableOn: 'Category',
    productIds: [],
    categoryIds: ['cat-pizza-classic', 'cat-pizza-premium'],
    regionIds: ['6a48d4fd9d94a65876049371', '6a48d7b89d94a658760493ba'],
    zoneIds: ['6a48e7199d94a658760495c0', '6a48e8179d94a658760495c6'],
    territoryIds: ['6a48f2299d94a658760499c6', '6a48f75f9d94a65876049aaf'],
    franchiseIds: ['6a48f8179d94a65876049b75'],
    storeIds: ['6aab7536c8d0f85c32b340f8'],
    customerSegments: ['All Customers'],
    customerIds: [],
    startDate: '2026-03-01T00:00:00.000Z',
    endDate: '2026-10-31T23:59:59.000Z',
    status: 'active',
    isActive: true,
    showOnHome: false,
    createdBy: 'Super Admin',
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z'
  },
  {
    _id: 'coupon-seed-004',
    code: 'FREEBREAD',
    title: 'Free Stuffed Garlic Bread',
    description: 'Complimentary freshly baked Stuffed Garlic Breadsticks on orders above ₹349',
    couponType: 'Free Product',
    value: 149,
    discountValue: 149,
    minimumOrderAmount: 349,
    maximumDiscount: 149,
    maxDiscount: 149,
    usageLimit: 400,
    usageLimitTotal: 400,
    usagePerCustomer: 3,
    usageLimitPerUser: 3,
    usageCount: 0,
    revenueGenerated: 0,
    applicableOn: 'Product',
    productIds: ['prod-garlic-bread'],
    categoryIds: [],
    regionIds: ['6a48d7b89d94a658760493ba'],
    zoneIds: ['6a48e8179d94a658760495c6'],
    territoryIds: ['6a48f75f9d94a65876049aaf'],
    franchiseIds: ['6a48f8179d94a65876049b75'],
    storeIds: ['6aab7536c8d0f85c32b340f8'],
    customerSegments: ['All Customers'],
    customerIds: [],
    startDate: '2026-01-15T00:00:00.000Z',
    endDate: '2026-09-30T23:59:59.000Z',
    status: 'active',
    isActive: true,
    showOnHome: false,
    createdBy: 'Super Admin',
    createdAt: '2026-01-15T00:00:00.000Z',
    updatedAt: '2026-01-15T00:00:00.000Z'
  },
  {
    _id: 'coupon-seed-005',
    code: 'WEEKEND20',
    title: 'Weekend Feast 20% Off',
    description: 'Enjoy 20% discount up to ₹100 on weekend orders across all outlets',
    couponType: 'Percentage',
    value: 20,
    discountValue: 20,
    minimumOrderAmount: 299,
    maximumDiscount: 100,
    maxDiscount: 100,
    usageLimit: 1500,
    usageLimitTotal: 1500,
    usagePerCustomer: 5,
    usageLimitPerUser: 5,
    usageCount: 0,
    revenueGenerated: 0,
    applicableOn: 'All',
    productIds: [],
    categoryIds: [],
    regionIds: [],
    zoneIds: [],
    territoryIds: [],
    franchiseIds: [],
    storeIds: [],
    customerSegments: ['All Customers'],
    customerIds: [],
    startDate: '2026-01-01T00:00:00.000Z',
    endDate: '2026-12-31T23:59:59.000Z',
    status: 'active',
    isActive: true,
    showOnHome: true,
    createdBy: 'Super Admin',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  }
];

export const initialCouponUsages = [];

// ==========================================
// 2. MOCK REST API CONTROLLERS
// ==========================================

export const getStoredCoupons = () => {
  try {
    const data = localStorage.getItem('pvp_coupons');
    if (!data) {
      localStorage.setItem('pvp_coupons', JSON.stringify(initialCoupons));
      return initialCoupons;
    }
    const parsed = JSON.parse(data);
    // If cache has stale mock codes or non-zero mock usages, reset to clean seed
    const hasStale = Array.isArray(parsed) && parsed.some(c => 
      c.code === 'PIZZA50' || c.code === 'TESTDISABLE' || c._id?.startsWith('c-65e') || (c.usageCount && c.usageCount > 0)
    );
    if (hasStale || !Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem('pvp_coupons', JSON.stringify(initialCoupons));
      return initialCoupons;
    }
    return parsed;
  } catch (e) {
    return initialCoupons;
  }
};

export const saveStoredCoupons = (data) => {
  localStorage.setItem('pvp_coupons', JSON.stringify(data));
  window.dispatchEvent(new Event("pvp_coupons_changed"));
};

// Simulated in-memory database
let couponsDatabase = getStoredCoupons();
let usagesDatabase = [...initialCouponUsages];

// Helper to calculate usage statistics
export const getAggregateStats = (couponsList) => {
  const coupons = couponsList && couponsList.length > 0 ? couponsList : getStoredCoupons();
  const activeCount = coupons.filter(c => (c.status === 'active' || c.isActive) && new Date(c.endDate) > new Date()).length;
  const expiredCount = coupons.filter(c => c.status === 'expired' || new Date(c.endDate) <= new Date()).length;
  const disabledCount = coupons.filter(c => c.status === 'disabled' || c.isActive === false).length;
  
  const totalUsages = coupons.reduce((sum, c) => sum + (c.usageCount || 0), 0);
  const totalDiscountGiven = coupons.reduce((sum, c) => sum + ((c.usageCount || 0) * (c.value || c.discountValue || 0)), 0);
  const totalRevenueGenerated = coupons.reduce((sum, c) => sum + (c.revenueGenerated || 0), 0);
  const averageDiscount = totalUsages > 0 ? Math.round(totalDiscountGiven / totalUsages) : 0;

  return {
    activeCoupons: activeCount,
    expiredCoupons: expiredCount,
    totalRedemptions: totalUsages,
    revenueGenerated: totalRevenueGenerated,
    averageDiscount: averageDiscount,
    disabledCoupons: disabledCount
  };
};

export const api = {
  getCoupons: async (filters = {}, sorting = {}, pagination = { page: 1, pageSize: 10 }) => {
    try {
      const res = await adminClient.get('/settings/coupons');
      let items = res.data?.data || [];
      
      const processed = items.map(c => {
        const isExpired = new Date(c.endDate) < new Date();
        const usageCount = c.usageCount || 0;
        const revenueGenerated = c.revenueGenerated || 0;
        return {
          ...c,
          usageCount,
          revenueGenerated,
          status: !c.isActive ? 'disabled' : (isExpired ? 'expired' : (c.status || 'active'))
        };
      });

      // Update localStorage cache
      localStorage.setItem('pvp_coupons', JSON.stringify(processed));

      return { 
        data: processed, 
        totalCount: processed.length, 
        totalPages: Math.max(1, Math.ceil(processed.length / (pagination?.pageSize || 10))) 
      };
    } catch (e) {
      console.warn("Falling back to cached coupons:", e);
      const local = getStoredCoupons();
      return {
        data: local,
        totalCount: local.length,
        totalPages: Math.max(1, Math.ceil(local.length / (pagination?.pageSize || 10)))
      };
    }
  },
  getCouponAnalytics: async () => {
    try {
      const res = await adminClient.get('/settings/coupons/analytics');
      return res.data?.data || res.data;
    } catch (e) {
      console.warn("Analytics API fallback:", e);
      const coupons = getStoredCoupons();
      const stats = getAggregateStats(coupons);
      return {
        totalUses: stats.totalRedemptions,
        revenue: stats.revenueGenerated,
        discountGiven: 0,
        aov: 0,
        activeCoupons: stats.activeCoupons,
        expiredCoupons: stats.expiredCoupons,
        disabledCoupons: stats.disabledCoupons,
        dailyUsage: [
          { day: 'Mon', height: 0, uses: 0 },
          { day: 'Tue', height: 0, uses: 0 },
          { day: 'Wed', height: 0, uses: 0 },
          { day: 'Thu', height: 0, uses: 0 },
          { day: 'Fri', height: 0, uses: 0 },
          { day: 'Sat', height: 0, uses: 0 },
          { day: 'Sun', height: 0, uses: 0 }
        ],
        recentUsageHistory: []
      };
    }
  },
  getCouponById: async (id) => {
    const res = await adminClient.get(`/settings/coupons/${id}`);
    return res.data.data;
  },
  createCoupon: async (payload) => {
    const res = await adminClient.post('/settings/coupons', payload);
    return res.data.data;
  },
  updateCoupon: async (id, payload) => {
    const res = await adminClient.put(`/settings/coupons/${id}`, payload);
    return res.data.data;
  },
  deleteCoupon: async (id) => {
    await adminClient.delete(`/settings/coupons/${id}`);
    return true;
  },
  toggleCouponStatus: async (id, isActive) => {
    const res = await adminClient.put(`/settings/coupons/${id}`, { isActive });
    return res.data.data;
  }
};

// Removed mock ledger logic

// ==========================================
// ==========================================
// 3. DEBOUNCE HOOK & COMPATIBILITY VIEWS
// ==========================================

export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

// Card View List component for backward-compatibility & alternate view toggles
export const CouponList = ({ 
  filters, 
  coupons = [], 
  onEdit, 
  onView, 
  onClone,
  onDisable,
  onDelete
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {coupons.map((coupon) => (
        <div key={coupon._id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col gap-3.5 hover:shadow-md transition-shadow relative overflow-hidden group">
          {/* Status strip */}
          <div className={`absolute top-0 left-0 w-1.5 h-full ${
            coupon.status === 'active' ? 'bg-emerald-500' :
            coupon.status === 'disabled' ? 'bg-zinc-400' :
            'bg-rose-500'
          }`}></div>
          
          <div className="flex items-start justify-between pl-1">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wide border bg-zinc-550/10 text-zinc-850 dark:text-zinc-300 dark:bg-zinc-800 border-zinc-350 dark:border-zinc-700 uppercase">
                  {coupon.code}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                  coupon.status === 'active' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' :
                  coupon.status === 'disabled' ? 'bg-zinc-150 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400' :
                  'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-455'
                }`}>
                  {coupon.status}
                </span>
              </div>
              <h3 className="text-xs font-black mt-2 text-black dark:text-white leading-tight">{coupon.title}</h3>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">{coupon.description}</p>
            </div>
            
            <div className="flex items-center gap-0.5 shrink-0 opacity-80 group-hover:opacity-100">
              <button 
                onClick={() => onView && onView(coupon)}
                className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-500 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                title="View Details"
              >
                <Eye size={13} />
              </button>
              <button 
                onClick={() => onEdit && onEdit(coupon)}
                className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-500 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                title="Edit Coupon"
              >
                <Edit size={13} />
              </button>
              <button 
                onClick={() => onDelete && onDelete(coupon)}
                className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-855 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
                title="Delete Coupon"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 border-t border-zinc-150 dark:border-zinc-800 pt-3 mt-1 pl-1">
            <div>
              <p className="text-[8.5px] text-zinc-450 dark:text-zinc-550 uppercase font-black tracking-widest">Redemptions</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full h-1 overflow-hidden">
                  <div 
                    className={`${coupon.status === 'active' ? 'bg-emerald-500' : 'bg-zinc-400'} h-full transition-all`} 
                    style={{ width: `${Math.min(100, ((coupon.usageCount || 0) / coupon.usageLimit) * 100)}%` }}
                  ></div>
                </div>
                <span className="text-[9.5px] font-bold text-zinc-700 dark:text-zinc-400 font-mono">
                  {coupon.usageCount}/{coupon.usageLimit}
                </span>
              </div>
            </div>
            <div>
              <p className="text-[8.5px] text-zinc-450 dark:text-zinc-555 uppercase font-black tracking-widest">Type / Value</p>
              <p className="text-[10px] font-extrabold mt-1 text-zinc-800 dark:text-zinc-350">
                {coupon.couponType === 'Percentage' ? `${coupon.value}% Discount` :
                 coupon.couponType === 'Flat Amount' ? `₹${coupon.value} Off` :
                 coupon.couponType === 'Buy One Get One' ? 'BOGO Offer' :
                 'Free Product'}
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center text-[9px] text-zinc-450 dark:text-zinc-500 pl-1">
            <span>By: {coupon.createdBy.split(' ')[0]}</span>
            <span className="font-mono">Expires: {new Date(coupon.endDate).toLocaleDateString('en-IN', {month:'short', day:'numeric'})}</span>
          </div>
        </div>
      ))}
      
      {coupons.length === 0 && (
         <div className="col-span-full py-12 text-center text-zinc-400 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold">
            <Ban size={28} className="mx-auto text-zinc-300 mb-2" />
            No coupons match your filters.
         </div>
      )}
    </div>
  );
};
