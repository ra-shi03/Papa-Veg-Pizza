import React, { useState, useEffect, useMemo } from 'react';
import { Edit, Eye, Trash2, CheckCircle2, AlertCircle, Ban } from 'lucide-react';

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
    _id: 'c-65e236b2f6b8b9c1a5b8e901',
    code: 'PIZZA50',
    title: 'Super Saver 50% Off',
    description: 'Get 50% discount on order value up to ₹150. Applicable on all classic and premium pizzas.',
    couponType: 'Percentage',
    value: 50,
    minimumOrderAmount: 299,
    maximumDiscount: 150,
    usageLimit: 1000,
    usagePerCustomer: 3,
    applicableOn: 'Category',
    productIds: [],
    categoryIds: ['cat-pizza-classic', 'cat-pizza-premium'],
    regionIds: ['reg-north', 'reg-south'],
    zoneIds: ['zone-delhi', 'zone-noida', 'zone-blr'],
    territoryIds: ['ter-cp', 'ter-dwarka', 'ter-sec62', 'ter-indiranagar'],
    franchiseIds: ['fran-delhi-prime', 'fran-dwarka-bites', 'fran-noida-corp', 'fran-south-crust'],
    storeIds: ['str-cp-1', 'str-dwarka-1', 'str-noida-62', 'str-indiranagar-1'],
    customerSegments: ['New Customers', 'Premium Users'],
    customerIds: [],
    startDate: '2026-06-01T00:00:00.000Z',
    endDate: '2026-08-31T23:59:59.000Z',
    status: 'active',
    createdBy: 'Siddharth Jamliya (Super)',
    createdAt: '2026-05-28T10:14:32.000Z',
    updatedAt: '2026-06-10T14:22:10.000Z'
  },
  {
    _id: 'c-65e236b2f6b8b9c1a5b8e902',
    code: 'FLAT100',
    title: 'Flat ₹100 Discount',
    description: 'Flat ₹100 discount on a minimum cart value of ₹499.',
    couponType: 'Flat Amount',
    value: 100,
    minimumOrderAmount: 499,
    maximumDiscount: 100,
    usageLimit: 500,
    usagePerCustomer: 1,
    applicableOn: 'All',
    productIds: [],
    categoryIds: [],
    regionIds: ['reg-north', 'reg-south', 'reg-west', 'reg-east'],
    zoneIds: [],
    territoryIds: [],
    franchiseIds: [],
    storeIds: [],
    customerSegments: ['Premium Users', 'Inactive Users'],
    customerIds: [],
    startDate: '2026-05-15T00:00:00.000Z',
    endDate: '2026-07-15T23:59:59.000Z',
    status: 'active',
    createdBy: 'Rohan Sharma (Admin)',
    createdAt: '2026-05-14T08:12:00.000Z',
    updatedAt: '2026-05-14T08:12:00.000Z'
  },
  {
    _id: 'c-65e236b2f6b8b9c1a5b8e903',
    code: 'BOGOPREMIUM',
    title: 'Buy One Get One Pizza',
    description: 'Buy one Medium Veg Pepperoni Feast and get the second Veg Pepperoni absolutely free.',
    couponType: 'Buy One Get One',
    value: 0,
    minimumOrderAmount: 389,
    maximumDiscount: 389,
    usageLimit: 200,
    usagePerCustomer: 2,
    applicableOn: 'Product',
    productIds: ['prod-pep-feast'],
    categoryIds: [],
    regionIds: ['reg-west'],
    zoneIds: ['zone-mumbai', 'zone-pune'],
    territoryIds: ['ter-bandra', 'ter-hinjewadi'],
    franchiseIds: ['fran-west-coast', 'fran-pune-tech'],
    storeIds: ['str-bandra-1', 'str-hinjewadi-1'],
    customerSegments: ['New Customers', 'Premium Users', 'Inactive Users'],
    customerIds: [],
    startDate: '2026-06-10T12:00:00.000Z',
    endDate: '2026-06-25T23:59:59.000Z',
    status: 'active',
    createdBy: 'Siddharth Jamliya (Super)',
    createdAt: '2026-06-08T09:30:15.000Z',
    updatedAt: '2026-06-08T09:30:15.000Z'
  },
  {
    _id: 'c-65e236b2f6b8b9c1a5b8e904',
    code: 'FREEBREAD',
    title: 'Free Garlic Bread Promotion',
    description: 'Get free Garlic Breadsticks on orders exceeding ₹399.',
    couponType: 'Free Product',
    value: 149, // Value of Garlic Breadsticks
    minimumOrderAmount: 399,
    maximumDiscount: 149,
    usageLimit: 300,
    usagePerCustomer: 1,
    applicableOn: 'Product',
    productIds: ['prod-garlic-bread'],
    categoryIds: [],
    regionIds: ['reg-east'],
    zoneIds: ['zone-kolkata'],
    territoryIds: ['ter-saltlake'],
    franchiseIds: ['fran-bengal-spiceland'],
    storeIds: ['str-saltlake-1'],
    customerSegments: ['Premium Users'],
    customerIds: [],
    startDate: '2026-06-01T00:00:00.000Z',
    endDate: '2026-06-18T18:00:00.000Z', // Just expired
    status: 'expired',
    createdBy: 'Deepak Sen (Promotions)',
    createdAt: '2026-05-30T11:45:00.000Z',
    updatedAt: '2026-06-18T18:00:00.000Z'
  },
  {
    _id: 'c-65e236b2f6b8b9c1a5b8e905',
    code: 'WELCOME150',
    title: 'First Order Special ₹150',
    description: 'Get ₹150 flat discount on your very first order at Papa Veg Pizza.',
    couponType: 'Flat Amount',
    value: 150,
    minimumOrderAmount: 399,
    maximumDiscount: 150,
    usageLimit: 2500,
    usagePerCustomer: 1,
    applicableOn: 'All',
    productIds: [],
    categoryIds: [],
    regionIds: ['reg-north', 'reg-south', 'reg-west', 'reg-east'],
    zoneIds: [],
    territoryIds: [],
    franchiseIds: [],
    storeIds: [],
    customerSegments: ['New Customers'],
    customerIds: [],
    startDate: '2026-01-01T00:00:00.000Z',
    endDate: '2026-12-31T23:59:59.000Z',
    status: 'active',
    createdBy: 'Siddharth Jamliya (Super)',
    createdAt: '2025-12-30T17:15:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    _id: 'c-65e236b2f6b8b9c1a5b8e906',
    code: 'TESTDISABLE',
    title: 'Temporary Disabled Offer',
    description: 'This offer is temporarily suspended for maintenance.',
    couponType: 'Percentage',
    value: 15,
    minimumOrderAmount: 199,
    maximumDiscount: 50,
    usageLimit: 100,
    usagePerCustomer: 1,
    applicableOn: 'All',
    productIds: [],
    categoryIds: [],
    regionIds: ['reg-north'],
    zoneIds: [],
    territoryIds: [],
    franchiseIds: [],
    storeIds: [],
    customerSegments: ['Premium Users', 'Inactive Users'],
    customerIds: [],
    startDate: '2026-06-01T00:00:00.000Z',
    endDate: '2026-07-31T23:59:59.000Z',
    status: 'disabled',
    createdBy: 'Rohan Sharma (Admin)',
    createdAt: '2026-05-29T10:00:00.000Z',
    updatedAt: '2026-06-15T09:00:00.000Z'
  }
];

export const initialCouponUsages = [
  // Usages for PIZZA50
  { _id: 'u-001', couponId: 'c-65e236b2f6b8b9c1a5b8e901', customerId: 'cust-101', customerName: 'Aarav Mehta', orderId: 'PVP-ORD-20412', orderAmount: 580, discountAmount: 150, usedAt: '2026-06-18T14:20:00.000Z', storeId: 'str-cp-1', regionId: 'reg-north' },
  { _id: 'u-002', couponId: 'c-65e236b2f6b8b9c1a5b8e901', customerId: 'cust-102', customerName: 'Riya Sen', orderId: 'PVP-ORD-20419', orderAmount: 320, discountAmount: 150, usedAt: '2026-06-18T15:10:00.000Z', storeId: 'str-dwarka-1', regionId: 'reg-north' },
  { _id: 'u-003', couponId: 'c-65e236b2f6b8b9c1a5b8e901', customerId: 'cust-103', customerName: 'Vikram Aditya', orderId: 'PVP-ORD-20422', orderAmount: 480, discountAmount: 150, usedAt: '2026-06-17T11:05:00.000Z', storeId: 'str-indiranagar-1', regionId: 'reg-south' },
  { _id: 'u-004', couponId: 'c-65e236b2f6b8b9c1a5b8e901', customerId: 'cust-106', customerName: 'Diya Sharma', orderId: 'PVP-ORD-20435', orderAmount: 380, discountAmount: 150, usedAt: '2026-06-16T19:45:00.000Z', storeId: 'str-noida-62', regionId: 'reg-north' },
  
  // Usages for FLAT100
  { _id: 'u-005', couponId: 'c-65e236b2f6b8b9c1a5b8e902', customerId: 'cust-103', customerName: 'Vikram Aditya', orderId: 'PVP-ORD-20401', orderAmount: 650, discountAmount: 100, usedAt: '2026-06-17T21:30:00.000Z', storeId: 'str-indiranagar-1', regionId: 'reg-south' },
  { _id: 'u-006', couponId: 'c-65e236b2f6b8b9c1a5b8e902', customerId: 'cust-104', customerName: 'Ananya Iyer', orderId: 'PVP-ORD-20410', orderAmount: 510, discountAmount: 100, usedAt: '2026-06-16T13:12:00.000Z', storeId: 'str-koramangala-1', regionId: 'reg-south' },
  { _id: 'u-007', couponId: 'c-65e236b2f6b8b9c1a5b8e902', customerId: 'cust-107', customerName: 'Rahul Dravid', orderId: 'PVP-ORD-20399', orderAmount: 800, discountAmount: 100, usedAt: '2026-06-15T20:15:00.000Z', storeId: 'str-cp-1', regionId: 'reg-north' },

  // Usages for BOGOPREMIUM
  { _id: 'u-008', couponId: 'c-65e236b2f6b8b9c1a5b8e903', customerId: 'cust-101', customerName: 'Aarav Mehta', orderId: 'PVP-ORD-20425', orderAmount: 778, discountAmount: 389, usedAt: '2026-06-18T10:15:00.000Z', storeId: 'str-bandra-1', regionId: 'reg-west' },
  { _id: 'u-009', couponId: 'c-65e236b2f6b8b9c1a5b8e903', customerId: 'cust-106', customerName: 'Diya Sharma', orderId: 'PVP-ORD-20430', orderAmount: 820, discountAmount: 389, usedAt: '2026-06-17T17:50:00.000Z', storeId: 'str-hinjewadi-1', regionId: 'reg-west' },

  // Usages for FREEBREAD
  { _id: 'u-010', couponId: 'c-65e236b2f6b8b9c1a5b8e904', customerId: 'cust-102', customerName: 'Riya Sen', orderId: 'PVP-ORD-20381', orderAmount: 420, discountAmount: 149, usedAt: '2026-06-12T19:30:00.000Z', storeId: 'str-saltlake-1', regionId: 'reg-east' },

  // Usages for WELCOME150
  { _id: 'u-011', couponId: 'c-65e236b2f6b8b9c1a5b8e905', customerId: 'cust-105', customerName: 'Kabir Kapoor', orderId: 'PVP-ORD-20405', orderAmount: 450, discountAmount: 150, usedAt: '2026-06-18T09:00:00.000Z', storeId: 'str-saltlake-1', regionId: 'reg-east' },
  { _id: 'u-012', couponId: 'c-65e236b2f6b8b9c1a5b8e905', customerId: 'cust-102', customerName: 'Riya Sen', orderId: 'PVP-ORD-20202', orderAmount: 410, discountAmount: 150, usedAt: '2026-05-18T18:40:00.000Z', storeId: 'str-cp-1', regionId: 'reg-north' }
];

// ==========================================
// 2. MOCK REST API CONTROLLERS
// ==========================================

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const getStoredCoupons = () => {
  const data = localStorage.getItem('pvp_coupons');
  if (!data) {
    localStorage.setItem('pvp_coupons', JSON.stringify(initialCoupons));
    return initialCoupons;
  }
  try {
    return JSON.parse(data);
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
export const getAggregateStats = () => {
  couponsDatabase = getStoredCoupons();
  const activeCount = couponsDatabase.filter(c => c.status === 'active' && new Date(c.endDate) > new Date()).length;
  const expiredCount = couponsDatabase.filter(c => c.status === 'expired' || new Date(c.endDate) <= new Date()).length;
  const disabledCount = couponsDatabase.filter(c => c.status === 'disabled').length;
  
  const totalUsages = usagesDatabase.length;
  const totalDiscountGiven = usagesDatabase.reduce((sum, u) => sum + u.discountAmount, 0);
  const totalRevenueGenerated = usagesDatabase.reduce((sum, u) => sum + u.orderAmount, 0);
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
  // GET /coupons
  getCoupons: async (filters = {}, sorting = {}, pagination = {}) => {
    await wait(600); // simulate network latency
    
    // Check error testing state
    if (filters.triggerError) {
      throw new Error('API request failed due to connection timeout. Database query failed.');
    }

    couponsDatabase = getStoredCoupons();
    let result = [...couponsDatabase];

    // Filter by code / search
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(c => 
        c.code.toLowerCase().includes(q) || 
        c.title.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
      );
    }

    // Filter by type
    if (filters.type && filters.type !== 'Any Type' && filters.type !== 'All') {
      result = result.filter(c => c.couponType === filters.type);
    }

    // Filter by status
    if (filters.status && filters.status !== 'All Statuses' && filters.status !== 'All') {
      const now = new Date();
      result = result.filter(c => {
        if (filters.status.toLowerCase() === 'active') {
          return c.status === 'active' && new Date(c.endDate) > now;
        }
        if (filters.status.toLowerCase() === 'expired') {
          return c.status === 'expired' || new Date(c.endDate) <= now;
        }
        if (filters.status.toLowerCase() === 'disabled') {
          return c.status === 'disabled';
        }
        return c.status === filters.status.toLowerCase();
      });
    }

    // Filter by Date Range
    if (filters.startDate) {
      const start = new Date(filters.startDate);
      result = result.filter(c => new Date(c.startDate) >= start);
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      result = result.filter(c => new Date(c.endDate) <= end);
    }

    // Filter by Region
    if (filters.regionIds && filters.regionIds.length > 0) {
      result = result.filter(c => 
        c.regionIds.some(id => filters.regionIds.includes(id)) || c.regionIds.length === 0
      );
    }

    // Filter by Zone
    if (filters.zoneIds && filters.zoneIds.length > 0) {
      result = result.filter(c => 
        c.zoneIds.some(id => filters.zoneIds.includes(id)) || c.zoneIds.length === 0
      );
    }

    // Filter by Territory
    if (filters.territoryIds && filters.territoryIds.length > 0) {
      result = result.filter(c => 
        c.territoryIds.some(id => filters.territoryIds.includes(id)) || c.territoryIds.length === 0
      );
    }

    // Filter by Franchise
    if (filters.franchiseIds && filters.franchiseIds.length > 0) {
      result = result.filter(c => 
        c.franchiseIds.some(id => filters.franchiseIds.includes(id)) || c.franchiseIds.length === 0
      );
    }

    // Filter by Store
    if (filters.storeIds && filters.storeIds.length > 0) {
      result = result.filter(c => 
        c.storeIds.some(id => filters.storeIds.includes(id)) || c.storeIds.length === 0
      );
    }

    // Filter by Customer Segment
    if (filters.customerSegments && filters.customerSegments.length > 0) {
      result = result.filter(c => 
        c.customerSegments.some(seg => filters.customerSegments.includes(seg)) || c.customerSegments.length === 0
      );
    }

    // Calculate dynamic usage/revenue stats per coupon
    result = result.map(c => {
      const couponUsages = usagesDatabase.filter(u => u.couponId === c._id);
      const usageCount = couponUsages.length;
      const revenueGenerated = couponUsages.reduce((sum, u) => sum + u.orderAmount, 0);
      return {
        ...c,
        usageCount,
        revenueGenerated
      };
    });

    // Apply Sorting
    if (sorting.field) {
      const field = sorting.field;
      const desc = sorting.direction === 'desc';
      result.sort((a, b) => {
        let valA = a[field];
        let valB = b[field];
        
        // Handle dates
        if (field === 'startDate' || field === 'endDate' || field === 'createdAt' || field === 'updatedAt') {
          valA = new Date(valA || 0).getTime();
          valB = new Date(valB || 0).getTime();
        }

        if (valA === undefined || valA === null) return desc ? 1 : -1;
        if (valB === undefined || valB === null) return desc ? -1 : 1;

        if (typeof valA === 'string') {
          return desc 
            ? valB.localeCompare(valA)
            : valA.localeCompare(valB);
        }
        return desc ? valB - valA : valA - valB;
      });
    }

    // Pagination
    const totalCount = result.length;
    const page = pagination.page || 1;
    const limit = pagination.limit || 5;
    const startIndex = (page - 1) * limit;
    const paginatedResult = result.slice(startIndex, startIndex + limit);

    return {
      data: paginatedResult,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    };
  },

  // POST /coupons
  createCoupon: async (couponData) => {
    await wait(800);
    couponsDatabase = getStoredCoupons();
    const newCoupon = {
      ...couponData,
      _id: 'c-' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'Siddharth Jamliya (Super)',
      productIds: couponData.productIds || [],
      categoryIds: couponData.categoryIds || [],
      regionIds: couponData.regionIds || [],
      zoneIds: couponData.zoneIds || [],
      territoryIds: couponData.territoryIds || [],
      franchiseIds: couponData.franchiseIds || [],
      storeIds: couponData.storeIds || [],
      customerSegments: couponData.customerSegments || [],
      customerIds: couponData.customerIds || []
    };
    couponsDatabase.unshift(newCoupon);
    saveStoredCoupons(couponsDatabase);
    return newCoupon;
  },

  // PUT /coupons/:id
  updateCoupon: async (id, updatedFields) => {
    await wait(800);
    couponsDatabase = getStoredCoupons();
    const index = couponsDatabase.findIndex(c => c._id === id);
    if (index === -1) {
      throw new Error(`Coupon with ID ${id} not found`);
    }
    
    couponsDatabase[index] = {
      ...couponsDatabase[index],
      ...updatedFields,
      updatedAt: new Date().toISOString()
    };
    saveStoredCoupons(couponsDatabase);
    return couponsDatabase[index];
  },

  // DELETE /coupons/:id
  deleteCoupon: async (id) => {
    await wait(600);
    couponsDatabase = getStoredCoupons();
    const index = couponsDatabase.findIndex(c => c._id === id);
    if (index === -1) {
      throw new Error(`Coupon with ID ${id} not found`);
    }
    const deleted = couponsDatabase[index];
    couponsDatabase.splice(index, 1);
    saveStoredCoupons(couponsDatabase);
    
    // Also cleanup usages
    usagesDatabase = usagesDatabase.filter(u => u.couponId !== id);
    return deleted;
  },

  // GET /coupon-usages
  getCouponUsages: async (couponId, pagination = {}) => {
    await wait(400);
    const filteredUsages = usagesDatabase.filter(u => u.couponId === couponId);
    
    const page = pagination.page || 1;
    const limit = pagination.limit || 5;
    const startIndex = (page - 1) * limit;
    const paginated = filteredUsages.slice(startIndex, startIndex + limit);

    return {
      data: paginated,
      totalCount: filteredUsages.length,
      page,
      limit,
      totalPages: Math.ceil(filteredUsages.length / limit)
    };
  },

  // POST /coupons/validate
  validateCoupon: async (code, customerId, storeId, orderAmount) => {
    await wait(500);
    const coupon = couponsDatabase.find(c => c.code.toUpperCase() === code.toUpperCase());
    if (!coupon) {
      return { valid: false, message: 'Invalid coupon code.' };
    }
    if (coupon.status !== 'active') {
      return { valid: false, message: 'Coupon is not active.' };
    }
    if (new Date(coupon.endDate) < new Date()) {
      return { valid: false, message: 'Coupon has expired.' };
    }
    if (orderAmount < coupon.minimumOrderAmount) {
      return { valid: false, message: `Minimum order value required is ₹${coupon.minimumOrderAmount}.` };
    }

    // Check usage limits
    const usagesForThisCoupon = usagesDatabase.filter(u => u.couponId === coupon._id);
    if (usagesForThisCoupon.length >= coupon.usageLimit) {
      return { valid: false, message: 'Coupon maximum usage limit reached.' };
    }

    // Check user limits
    const userUsages = usagesForThisCoupon.filter(u => u.customerId === customerId);
    if (userUsages.length >= coupon.usagePerCustomer) {
      return { valid: false, message: 'You have reached the maximum redemptions limit for this coupon.' };
    }

    // Check location eligibility
    if (coupon.storeIds.length > 0 && !coupon.storeIds.includes(storeId)) {
      return { valid: false, message: 'Coupon is not applicable at this store location.' };
    }

    // Valid
    let discountAmount = 0;
    if (coupon.couponType === 'Percentage') {
      discountAmount = Math.min((orderAmount * coupon.value) / 100, coupon.maximumDiscount);
    } else if (coupon.couponType === 'Flat Amount') {
      discountAmount = Math.min(coupon.value, coupon.maximumDiscount);
    } else {
      discountAmount = coupon.value || 0; // standard value
    }

    return {
      valid: true,
      coupon,
      discountAmount,
      message: 'Coupon code applied successfully!'
    };
  }
};

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
