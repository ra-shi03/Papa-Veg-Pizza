import React from 'react';
import { mockRegions, mockFranchises, mockStores } from './CouponsData';

// ==========================================
// 1. DATA MODELS & DATASETS (MongoDB Mock)
// ==========================================

export const activeCouponsMock = [
  { _id: 'cpn-01', code: 'PIZZA50', title: 'Super Saver 50% Off', discount: '50% OFF', maxDiscount: 150, expiryDate: '2026-08-31', minOrder: 299 },
  { _id: 'cpn-02', code: 'BOGOFRIDAY', title: 'Friday Frenzy BOGO', discount: 'Buy 1 Get 1 Free', maxDiscount: 400, expiryDate: '2026-09-30', minOrder: 399 },
  { _id: 'cpn-03', code: 'FREEGARLIC', title: 'Free Stuffed Garlic Bread', discount: 'Free Garlic Bread', maxDiscount: 149, expiryDate: '2026-07-15', minOrder: 249 },
  { _id: 'cpn-04', code: 'LATE20', title: 'Late Night flat ₹200 Off', discount: '₹200 OFF', maxDiscount: 200, expiryDate: '2026-08-15', minOrder: 499 },
  { _id: 'cpn-05', code: 'PREMIUM25', title: 'Exclusive 25% Premium Discount', discount: '25% OFF', maxDiscount: 300, expiryDate: '2026-10-31', minOrder: 599 },
  { _id: 'cpn-06', code: 'WELCOME100', title: 'New User flat ₹100 Off', discount: '₹100 OFF', maxDiscount: 100, expiryDate: '2026-12-31', minOrder: 199 }
];

export const initialCampaigns = [
  {
    _id: 'camp-01',
    title: 'Supreme Summer Feast',
    description: 'Enjoy supreme weekend pizza feasts with our exclusive summer deals. High conversions and bulk family orders.',
    type: 'Multi Channel',
    startDate: '2026-06-01',
    endDate: '2026-08-31',
    targetAudience: 'Premium Customers',
    regionIds: ['reg-north', 'reg-south'],
    franchiseIds: ['fran-delhi-prime', 'fran-south-crust'],
    storeIds: ['str-cp-1', 'str-indiranagar-1'],
    customerSegment: 'Premium Customers',
    couponId: 'cpn-01',
    budget: 150000,
    impressions: 250000,
    clicks: 45000,
    conversions: 9000,
    revenueGenerated: 2700000,
    redemptionsCount: 8200,
    status: 'Running',
    createdBy: 'Aman Sharma (Super Admin)',
    createdAt: '2026-05-28T10:00:00.000Z'
  },
  {
    _id: 'camp-02',
    title: 'Night Owl Pizza Crave',
    description: 'Late night cravings satisfied! Get flat discount on pizzas ordered between 11 PM and 3 AM.',
    type: 'Push Notification',
    startDate: '2026-07-01',
    endDate: '2026-07-22',
    targetAudience: 'All Customers',
    regionIds: ['reg-north', 'reg-west'],
    franchiseIds: ['fran-delhi-prime', 'fran-west-coast'],
    storeIds: ['str-cp-1', 'str-bandra-1'],
    customerSegment: 'All Customers',
    couponId: 'cpn-04',
    budget: 80000,
    impressions: 120000,
    clicks: 18000,
    conversions: 2700,
    revenueGenerated: 1350000,
    redemptionsCount: 2200,
    status: 'Scheduled',
    createdBy: 'Aman Sharma (Super Admin)',
    createdAt: '2026-06-10T14:30:00.000Z'
  },
  {
    _id: 'camp-03',
    title: 'BOGO Friday Blitz',
    description: 'Friday frenzy pizza party! Buy one large pizza and get another medium pizza absolutely free.',
    type: 'SMS',
    startDate: '2026-03-01',
    endDate: '2026-05-31',
    targetAudience: 'New Customers',
    regionIds: ['reg-south', 'reg-east'],
    franchiseIds: ['fran-south-crust', 'fran-bengal-spiceland'],
    storeIds: ['str-indiranagar-1', 'str-saltlake-1'],
    customerSegment: 'New Customers',
    couponId: 'cpn-02',
    budget: 200000,
    impressions: 500000,
    clicks: 80000,
    conversions: 24000,
    revenueGenerated: 7200000,
    redemptionsCount: 21500,
    status: 'Completed',
    createdBy: 'Pooja Nair (Marketing Mgr)',
    createdAt: '2026-02-20T09:15:00.000Z'
  },
  {
    _id: 'camp-04',
    title: 'Monsoon Magic Pizza Deal',
    description: 'Special rainy day discounts to warm up with spicy piping-hot thin crust pizzas.',
    type: 'Email',
    startDate: '2026-06-15',
    endDate: '2026-07-31',
    targetAudience: 'All Customers',
    regionIds: ['reg-west', 'reg-east'],
    franchiseIds: ['fran-west-coast', 'fran-bengal-spiceland'],
    storeIds: ['str-bandra-1', 'str-saltlake-1'],
    customerSegment: 'All Customers',
    couponId: 'cpn-03',
    budget: 120000,
    impressions: 180000,
    clicks: 30000,
    conversions: 6000,
    revenueGenerated: 1800000,
    redemptionsCount: 5500,
    status: 'Running',
    createdBy: 'Siddharth Jamliya (Super)',
    createdAt: '2026-06-12T11:45:00.000Z'
  },
  {
    _id: 'camp-05',
    title: 'Mid-Week Special Treat',
    description: 'Boost mid-week sluggish sales. Flat ₹100 Off on orders above ₹199 on Wednesdays.',
    type: 'Multi Channel',
    startDate: '2026-05-01',
    endDate: '2026-07-31',
    targetAudience: 'New Customers',
    regionIds: ['reg-north'],
    franchiseIds: ['fran-delhi-prime'],
    storeIds: ['str-cp-1'],
    customerSegment: 'New Customers',
    couponId: 'cpn-06',
    budget: 60000,
    impressions: 90000,
    clicks: 12000,
    conversions: 2000,
    revenueGenerated: 500000,
    redemptionsCount: 1800,
    status: 'Paused',
    createdBy: 'Pooja Nair (Marketing Mgr)',
    createdAt: '2026-04-25T16:20:00.000Z'
  },
  {
    _id: 'camp-06',
    title: 'Welcome New Users Promo',
    description: 'Automated welcome email campaign with high discounts to acquire first-time users.',
    type: 'Email',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    targetAudience: 'New Customers',
    regionIds: ['reg-north', 'reg-south', 'reg-west', 'reg-east'],
    franchiseIds: ['fran-delhi-prime', 'fran-south-crust', 'fran-west-coast', 'fran-bengal-spiceland'],
    storeIds: ['str-cp-1', 'str-indiranagar-1', 'str-bandra-1', 'str-saltlake-1'],
    customerSegment: 'New Customers',
    couponId: 'cpn-06',
    budget: 300000,
    impressions: 450000,
    clicks: 72000,
    conversions: 18000,
    revenueGenerated: 4500000,
    redemptionsCount: 17200,
    status: 'Running',
    createdBy: 'Aman Sharma (Super Admin)',
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    _id: 'camp-07',
    title: 'Weekend Combo Bash',
    description: 'Promote our super saver premium paneer combos during weekends with push alerts.',
    type: 'Push Notification',
    startDate: '2026-07-10',
    endDate: '2026-08-10',
    targetAudience: 'Premium Customers',
    regionIds: ['reg-south'],
    franchiseIds: ['fran-south-crust'],
    storeIds: ['str-indiranagar-1'],
    customerSegment: 'Premium Customers',
    couponId: 'cpn-05',
    budget: 90000,
    impressions: 110000,
    clicks: 15000,
    conversions: 3000,
    revenueGenerated: 1100000,
    redemptionsCount: 2800,
    status: 'Scheduled',
    createdBy: 'Siddharth Jamliya (Super)',
    createdAt: '2026-06-15T10:00:00.000Z'
  },
  {
    _id: 'camp-08',
    title: 'IPL Final Combo Bash 2026',
    description: 'Draft campaign for the cricket season final matches. BOGO deals + free garlic bread offer.',
    type: 'SMS',
    startDate: '2026-05-15',
    endDate: '2026-05-31',
    targetAudience: 'All Customers',
    regionIds: ['reg-north', 'reg-west'],
    franchiseIds: ['fran-delhi-prime', 'fran-west-coast'],
    storeIds: ['str-cp-1', 'str-bandra-1'],
    customerSegment: 'All Customers',
    couponId: 'cpn-03',
    budget: 100000,
    impressions: 0,
    clicks: 0,
    conversions: 0,
    revenueGenerated: 0,
    redemptionsCount: 0,
    status: 'Draft',
    createdBy: 'Pooja Nair (Marketing Mgr)',
    createdAt: '2026-05-10T12:00:00.000Z'
  }
];

// Helper to save campaigns to localStorage to mimic persistent DB
const getStoredCampaigns = () => {
  const data = localStorage.getItem('pvp_campaigns');
  if (!data) {
    localStorage.setItem('pvp_campaigns', JSON.stringify(initialCampaigns));
    return initialCampaigns;
  }
  return JSON.parse(data);
};

const setStoredCampaigns = (campaigns) => {
  localStorage.setItem('pvp_campaigns', JSON.stringify(campaigns));
};

// ==========================================
// 2. MOCK REST API CONTROLLERS
// ==========================================

export const apiGetCoupons = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(activeCouponsMock);
    }, 400);
  });
};

export const apiGetCampaigns = (filters = {}, pagination = { page: 1, limit: 10 }, sorting = { field: 'createdAt', order: 'desc' }) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let data = [...getStoredCampaigns()];

      // 1. Search
      if (filters.search) {
        const query = filters.search.toLowerCase();
        data = data.filter(c => 
          c.title.toLowerCase().includes(query) || 
          c.description.toLowerCase().includes(query)
        );
      }

      // 2. Type Filter
      if (filters.type && filters.type !== 'All') {
        data = data.filter(c => c.type === filters.type);
      }

      // 3. Status Filter
      if (filters.status && filters.status !== 'All') {
        data = data.filter(c => c.status === filters.status);
      }

      // 4. Customer Segment Filter
      if (filters.customerSegment && filters.customerSegment !== 'All') {
        data = data.filter(c => c.customerSegment === filters.customerSegment);
      }

      // 5. Date Range
      if (filters.startDate) {
        data = data.filter(c => new Date(c.startDate) >= new Date(filters.startDate));
      }
      if (filters.endDate) {
        data = data.filter(c => new Date(c.endDate) <= new Date(filters.endDate));
      }

      // 6. Geographic Filters (Region, Franchise, Store)
      if (filters.regionIds && filters.regionIds.length > 0) {
        data = data.filter(c => c.regionIds.some(r => filters.regionIds.includes(r)));
      }
      if (filters.franchiseIds && filters.franchiseIds.length > 0) {
        data = data.filter(c => c.franchiseIds.some(f => filters.franchiseIds.includes(f)));
      }
      if (filters.storeIds && filters.storeIds.length > 0) {
        data = data.filter(c => c.storeIds.some(s => filters.storeIds.includes(s)));
      }

      // 7. Sorting
      const { field, order } = sorting;
      data.sort((a, b) => {
        let valA = a[field];
        let valB = b[field];

        if (field === 'startDate' || field === 'endDate' || field === 'createdAt') {
          valA = new Date(valA || 0);
          valB = new Date(valB || 0);
        }

        if (typeof valA === 'string') {
          return order === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }

        return order === 'asc' ? (valA || 0) - (valB || 0) : (valB || 0) - (valA || 0);
      });

      // 8. Pagination
      const totalCount = data.length;
      const startIndex = (pagination.page - 1) * pagination.limit;
      const paginatedData = data.slice(startIndex, startIndex + pagination.limit);

      resolve({
        campaigns: paginatedData,
        total: totalCount,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(totalCount / pagination.limit)
      });
    }, 600);
  });
};

export const apiGetCampaignById = (id) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const data = getStoredCampaigns();
      const campaign = data.find(c => c._id === id);
      if (campaign) {
        resolve(campaign);
      } else {
        reject(new Error('Campaign not found'));
      }
    }, 300);
  });
};

export const apiCreateCampaign = (campaignData) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const db = getStoredCampaigns();
      const newCampaign = {
        ...campaignData,
        _id: `camp-${Date.now()}`,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        revenueGenerated: 0,
        redemptionsCount: 0,
        createdBy: 'Siddharth Jamliya (Super)',
        createdAt: new Date().toISOString()
      };
      db.push(newCampaign);
      setStoredCampaigns(db);
      resolve(newCampaign);
    }, 700);
  });
};

export const apiUpdateCampaign = (id, updatedFields) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const db = getStoredCampaigns();
      const index = db.findIndex(c => c._id === id);
      if (index !== -1) {
        db[index] = {
          ...db[index],
          ...updatedFields,
          updatedAt: new Date().toISOString()
        };
        setStoredCampaigns(db);
        resolve(db[index]);
      } else {
        reject(new Error('Campaign not found'));
      }
    }, 600);
  });
};

export const apiDeleteCampaign = (id) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const db = getStoredCampaigns();
      const filtered = db.filter(c => c._id !== id);
      if (db.length !== filtered.length) {
        setStoredCampaigns(filtered);
        resolve({ success: true, id });
      } else {
        reject(new Error('Campaign not found'));
      }
    }, 500);
  });
};

// Bulk action simulators
export const apiBulkUpdateStatus = (ids, status) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const db = getStoredCampaigns();
      const updated = db.map(c => ids.includes(c._id) ? { ...c, status } : c);
      setStoredCampaigns(updated);
      resolve({ success: true, count: ids.length });
    }, 600);
  });
};

export const apiBulkDelete = (ids) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const db = getStoredCampaigns();
      const filtered = db.filter(c => !ids.includes(c._id));
      setStoredCampaigns(filtered);
      resolve({ success: true, count: ids.length });
    }, 650);
  });
};

// ==========================================
// 3. ANALYTICS API SIMULATION
// ==========================================

export const apiGetCampaignAnalytics = (id) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const db = getStoredCampaigns();
      const campaign = db.find(c => c._id === id);
      if (!campaign) {
        reject(new Error('Campaign not found'));
        return;
      }

      // 1. KPI Cards data
      const impressions = campaign.impressions || 150000;
      const clicks = campaign.clicks || 25000;
      const conversions = campaign.conversions || 5000;
      const revenue = campaign.revenueGenerated || 1500000;
      const redemptions = campaign.redemptionsCount || 4200;

      const ctr = impressions > 0 ? parseFloat(((clicks / impressions) * 100).toFixed(2)) : 0;
      const conversionRate = clicks > 0 ? parseFloat(((conversions / clicks) * 100).toFixed(2)) : 0;
      const reach = Math.round(impressions * 0.82); // Simulated reach (unique users)

      // 2. Daily Traffic Chart (Line Chart Data)
      // Generates 15 data points matching duration
      const trafficData = [
        { date: '06-01', visitors: 1200 },
        { date: '06-03', visitors: 1800 },
        { date: '06-05', visitors: 2400 },
        { date: '06-07', visitors: 2200 },
        { date: '06-09', visitors: 3100 },
        { date: '06-11', visitors: 2900 },
        { date: '06-13', visitors: 3500 },
        { date: '06-15', visitors: 4200 },
        { date: '06-17', visitors: 3800 },
        { date: '06-19', visitors: 4900 },
        { date: '06-21', visitors: 5200 },
        { date: '06-23', visitors: 4600 },
        { date: '06-25', visitors: 5800 },
        { date: '06-27', visitors: 6400 },
        { date: '06-29', visitors: 7100 }
      ];

      // 3. Conversion Funnel (Funnel Data)
      const funnelData = [
        { stage: 'Impressions', value: impressions, percent: 100 },
        { stage: 'Clicks', value: clicks, percent: Math.round((clicks / impressions) * 100) },
        { stage: 'Orders (Conversions)', value: conversions, percent: Math.round((conversions / impressions) * 100) },
        { stage: 'Coupon Redemptions', value: redemptions, percent: Math.round((redemptions / impressions) * 100) },
        { stage: 'Revenue (₹)', value: revenue, percent: null }
      ];

      // 4. Revenue Trend (Bar Chart Data)
      const revenueTrend = [
        { day: 'Mon', revenue: 45000 },
        { day: 'Tue', revenue: 52000 },
        { day: 'Wed', revenue: 68000 },
        { day: 'Thu', revenue: 59000 },
        { day: 'Fri', revenue: 110000 },
        { day: 'Sat', revenue: 145000 },
        { day: 'Sun', revenue: 130000 }
      ];

      // 5. Channel Performance (Donut Chart Data)
      const channelPerformance = [
        { channel: 'Push Alert', value: 35, color: '#3b82f6' },
        { channel: 'Email Campaign', value: 25, color: '#a855f7' },
        { channel: 'SMS Marketing', value: 20, color: '#f97316' },
        { channel: 'Multi Channel Promo', value: 20, color: '#10b981' }
      ];

      // 6. Coupon Usage Trend (Area Chart Data)
      const couponUsageTrend = [
        { date: '06-01', redemptions: 80 },
        { date: '06-03', redemptions: 110 },
        { date: '06-05', redemptions: 150 },
        { date: '06-07', redemptions: 140 },
        { date: '06-09', redemptions: 210 },
        { date: '06-11', redemptions: 190 },
        { date: '06-13', redemptions: 260 },
        { date: '06-15', redemptions: 310 },
        { date: '06-17', redemptions: 280 },
        { date: '06-19', redemptions: 380 },
        { date: '06-21', redemptions: 420 },
        { date: '06-23', redemptions: 390 },
        { date: '06-25', redemptions: 490 },
        { date: '06-27', redemptions: 530 },
        { date: '06-29', redemptions: 600 }
      ];

      // 7. Recent Orders linked to campaign coupons
      const recentOrders = [
        { orderId: 'ORD-98421', customer: 'Rohan Sharma', couponUsed: 'PIZZA50', store: 'Connaught Place', amount: 450, date: '2026-06-18 21:30', status: 'Delivered' },
        { orderId: 'ORD-98415', customer: 'Priya Patel', couponUsed: 'PIZZA50', store: 'Indiranagar Main Rd', amount: 590, date: '2026-06-18 20:45', status: 'Delivered' },
        { orderId: 'ORD-98390', customer: 'Aditya Sen', couponUsed: 'PIZZA50', store: 'Connaught Place', amount: 350, date: '2026-06-18 19:15', status: 'Delivered' },
        { orderId: 'ORD-98380', customer: 'Meera Rao', couponUsed: 'PIZZA50', store: 'Bandra Linking Rd', amount: 720, date: '2026-06-18 18:00', status: 'Delivered' },
        { orderId: 'ORD-98356', customer: 'Vikram Joshi', couponUsed: 'PIZZA50', store: 'Salt Lake Sector V', amount: 299, date: '2026-06-18 16:30', status: 'Delivered' },
        { orderId: 'ORD-98320', customer: 'Sneha Gupta', couponUsed: 'PIZZA50', store: 'Connaught Place', amount: 510, date: '2026-06-18 14:10', status: 'Cancelled' },
        { orderId: 'ORD-98310', customer: 'Aman Gupta', couponUsed: 'PIZZA50', store: 'Sector 62 Noida', amount: 440, date: '2026-06-18 13:05', status: 'Delivered' },
        { orderId: 'ORD-98289', customer: 'Divya Nair', couponUsed: 'PIZZA50', store: 'Indiranagar Main Rd', amount: 680, date: '2026-06-18 11:20', status: 'Delivered' }
      ];

      resolve({
        campaignId: id,
        campaignTitle: campaign.title,
        kpi: {
          reach,
          impressions,
          ctr,
          orders: conversions,
          revenue,
          redemptions
        },
        charts: {
          trafficData,
          funnelData,
          revenueTrend,
          channelPerformance,
          couponUsageTrend
        },
        recentOrders
      });
    }, 800);
  });
};
