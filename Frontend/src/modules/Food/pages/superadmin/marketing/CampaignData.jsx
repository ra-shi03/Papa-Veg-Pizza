import React from 'react';

// ==========================================
// 1. DATA MODELS & DATASETS (MongoDB )
// ==========================================

export const activeCouponOptions = [];
export const seedCampaigns = [];

// Helper to save campaigns to localStorage to mimic persistent DB
const getStoredCampaigns = () => {
  const data = localStorage.getItem('pvp_campaigns');
  if (!data) {
    localStorage.setItem('pvp_campaigns', JSON.stringify(seedCampaigns));
    return seedCampaigns;
  }
  return JSON.parse(data);
};
const setStoredCampaigns = campaigns => {
  localStorage.setItem('pvp_campaigns', JSON.stringify(campaigns));
};

// ==========================================
// 2. Campaign actions (kept in this browser only; no server endpoint yet)
// ==========================================

export const apiGetCoupons = () => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(activeCouponOptions);
    }, 400);
  });
};
export const apiGetCampaigns = (filters = {}, pagination = {
  page: 1,
  limit: 10
}, sorting = {
  field: 'createdAt',
  order: 'desc'
}) => {
  return new Promise(resolve => {
    setTimeout(() => {
      let data = [];

      // 1. Search
      if (filters.search) {
        const query = filters.search.toLowerCase();
        data = data.filter(c => c.title.toLowerCase().includes(query) || c.description.toLowerCase().includes(query));
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
      const {
        field,
        order
      } = sorting;
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
export const apiGetCampaignById = id => {
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
export const apiCreateCampaign = campaignData => {
  return new Promise(resolve => {
    setTimeout(() => {
      const db = getStoredCampaigns();
      const newCampaign = {
        ...campaignData,
        _id: "",
        impressions: 0,
        clicks: 0,
        conversions: 0,
        revenueGenerated: 0,
        redemptionsCount: 0,
        createdBy: "",
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
export const apiDeleteCampaign = id => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const db = getStoredCampaigns();
      const filtered = db.filter(c => c._id !== id);
      if (db.length !== filtered.length) {
        setStoredCampaigns(filtered);
        resolve({
          success: true,
          id
        });
      } else {
        reject(new Error('Campaign not found'));
      }
    }, 500);
  });
};

// Bulk action simulators
export const apiBulkUpdateStatus = (ids, status) => {
  return new Promise(resolve => {
    setTimeout(() => {
      const db = getStoredCampaigns();
      const updated = db.map(c => ids.includes(c._id) ? {
        ...c,
        status
      } : c);
      setStoredCampaigns(updated);
      resolve({
        success: true,
        count: ids.length
      });
    }, 600);
  });
};
export const apiBulkDelete = ids => {
  return new Promise(resolve => {
    setTimeout(() => {
      const db = getStoredCampaigns();
      const filtered = db.filter(c => !ids.includes(c._id));
      setStoredCampaigns(filtered);
      resolve({
        success: true,
        count: ids.length
      });
    }, 650);
  });
};

// ==========================================
// 3. ANALYTICS API SIMULATION
// ==========================================

export const apiGetCampaignAnalytics = id => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const db = getStoredCampaigns();
      const campaign = db.find(c => c._id === id);
      if (!campaign) {
        reject(new Error('Campaign not found'));
        return;
      }

      // 1. KPI Cards data
      const impressions = campaign.impressions || 0;
      const clicks = campaign.clicks || 0;
      const conversions = campaign.conversions || 0;
      const revenue = campaign.revenueGenerated || 0;
      const redemptions = campaign.redemptionsCount || 0;
      const ctr = impressions > 0 ? parseFloat((clicks / impressions * 100).toFixed(2)) : 0;
      const conversionRate = clicks > 0 ? parseFloat((conversions / clicks * 100).toFixed(2)) : 0;
      const reach = Math.round(impressions * 0.82); // Simulated reach (unique users)

      // 2. Daily Traffic Chart (Line Chart Data)
      // Generates 15 data points matching duration
      const trafficData = [];

      // 3. Conversion Funnel (Funnel Data)
      const funnelData = [];

      // 4. Revenue Trend (Bar Chart Data)
      const revenueTrend = [];

      // 5. Channel Performance (Donut Chart Data)
      const channelPerformance = [];

      // 6. Coupon Usage Trend (Area Chart Data)
      const couponUsageTrend = [];

      // 7. Recent Orders linked to campaign coupons
      const recentOrders = [];
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
