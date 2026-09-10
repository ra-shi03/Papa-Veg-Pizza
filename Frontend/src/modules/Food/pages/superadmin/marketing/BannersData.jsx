import React from 'react';

// ==========================================
// 1. DATA MODELS & DATASETS (MongoDB Mock)
// ==========================================

export const initialBanners = [
  {
    _id: 'ban-01',
    title: '🍕 Weekend Feast: Buy 1 Get 1 Free',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80&fm=webp',
    bannerType: 'Homepage Banner',
    redirectType: 'Category',
    redirectId: 'cat-signature', // Signature Pizzas
    priority: 85,
    startDate: '2026-06-18T00:00:00.000Z',
    endDate: '2026-06-25T23:59:59.000Z',
    regionIds: ['reg-north', 'reg-west'],
    franchiseIds: ['fran-delhi-prime', 'fran-mumbai-delight'],
    storeIds: ['store-cp', 'store-bandra'],
    isActive: true,
    createdAt: '2026-06-15T10:00:00.000Z',
    clicks: 14200,
    impressions: 284000
  },
  {
    _id: 'ban-02',
    title: '✨ Flat 50% Off on First Order!',
    image: 'https://images.unsplash.com/photo-1590947132387-155cc02f3212?w=800&q=80&fm=webp',
    bannerType: 'Popup Banner',
    redirectType: 'Coupon',
    redirectId: 'WELCOME50',
    priority: 95,
    startDate: '2026-06-20T00:00:00.000Z',
    endDate: '2026-06-30T23:59:59.000Z',
    regionIds: [],
    franchiseIds: [],
    storeIds: [],
    isActive: true,
    createdAt: '2026-06-16T12:00:00.000Z',
    clicks: 0,
    impressions: 0
  },
  {
    _id: 'ban-03',
    title: '🌶️ Spicy Paneer Delight Combo Deal',
    image: 'https://images.unsplash.com/photo-1544982503-9f984c14501a?w=800&q=80&fm=webp',
    bannerType: 'Offer Banner',
    redirectType: 'Product',
    redirectId: 'prod-paneer-delight',
    priority: 60,
    startDate: '2026-06-01T00:00:00.000Z',
    endDate: '2026-06-15T23:59:59.000Z',
    regionIds: ['reg-north', 'reg-south'],
    franchiseIds: ['fran-delhi-prime', 'fran-blr-crust'],
    storeIds: ['store-cp', 'store-koramangala'],
    isActive: true,
    createdAt: '2026-05-28T09:00:00.000Z',
    clicks: 8500,
    impressions: 195000
  },
  {
    _id: 'ban-04',
    title: '🎉 Monsoon Banners Bonanza Offer',
    image: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&q=80&fm=webp',
    bannerType: 'Homepage Banner',
    redirectType: 'Campaign',
    redirectId: 'camp-monsoon-bogo',
    priority: 75,
    startDate: '2026-07-01T00:00:00.000Z',
    endDate: '2026-07-15T23:59:59.000Z',
    regionIds: [],
    franchiseIds: [],
    storeIds: [],
    isActive: true,
    createdAt: '2026-06-18T14:00:00.000Z',
    clicks: 0,
    impressions: 0
  },
  {
    _id: 'ban-05',
    title: '🍔 Order Gourmet Burger Sides at ₹99 Only',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80&fm=webp',
    bannerType: 'Festival Banner',
    redirectType: 'External URL',
    redirectId: 'https://papavegpizza.com/sides-deal',
    priority: 40,
    startDate: '2026-06-10T00:00:00.000Z',
    endDate: '2026-06-20T23:59:59.000Z',
    regionIds: ['reg-west'],
    franchiseIds: ['fran-mumbai-delight'],
    storeIds: ['store-bandra'],
    isActive: false,
    createdAt: '2026-06-08T11:00:00.000Z',
    clicks: 4100,
    impressions: 110000
  }
];

// Helper to save/load from localStorage
const getStoredBanners = () => {
  const data = localStorage.getItem('pvp_banners');
  if (!data) {
    localStorage.setItem('pvp_banners', JSON.stringify(initialBanners));
    return initialBanners;
  }
  return JSON.parse(data);
};

const setStoredBanners = (banners) => {
  localStorage.setItem('pvp_banners', JSON.stringify(banners));
};

// Mock lists for selectors
export const mockProducts = [
  { _id: 'prod-paneer-delight', name: '🌶️ Paneer Delight Pizza', price: 299 },
  { _id: 'prod-margherita', name: '🍕 Double Cheese Margherita', price: 199 },
  { _id: 'prod-garlic-bread', name: '🥖 Stuffed Garlic Breadsticks', price: 129 },
  { _id: 'prod-farmhouse', name: '🍅 Fresh Farmhouse Pizza', price: 249 }
];

export const mockCategories = [
  { _id: 'cat-signature', name: 'Signature Pizzas' },
  { _id: 'cat-classic', name: 'Classic Range' },
  { _id: 'cat-sides', name: 'Sides & Appetizers' },
  { _id: 'cat-desserts', name: 'Desserts & Beverages' }
];

export const mockCoupons = [
  { _id: 'WELCOME50', code: 'WELCOME50', title: '50% off on first order' },
  { _id: 'BOGOFEAST', code: 'BOGOFEAST', title: 'Buy 1 Get 1 Free' },
  { _id: 'GOURMET150', code: 'GOURMET150', title: '₹150 off on sides' }
];

export const mockCampaigns = [
  { _id: 'camp-monsoon-bogo', name: 'Monsoon BOGO Blast' },
  { _id: 'camp-ipl-feast', name: 'IPL Cricket Special Deals' },
  { _id: 'camp-diwali-combo', name: 'Diwali Festive Family Combo' }
];

export const mockStores = [
  { id: 'store-cp', name: 'Connaught Place Outlet', franchiseId: 'fran-delhi-prime' },
  { id: 'store-gk', name: 'Greater Kailash Outlet', franchiseId: 'fran-delhi-prime' },
  { id: 'store-bandra', name: 'Bandra West Outlet', franchiseId: 'fran-mumbai-delight' },
  { id: 'store-andheri', name: 'Andheri East Outlet', franchiseId: 'fran-mumbai-delight' },
  { id: 'store-koramangala', name: 'Koramangala 5th Block', franchiseId: 'fran-blr-crust' },
  { id: 'store-indiranagar', name: 'Indiranagar 100ft Rd', franchiseId: 'fran-blr-crust' }
];

// ==========================================
// 2. REST API CONTROLLER SIMULATIONS
// ==========================================

export const apiGetBanners = (filters = {}, pagination = { page: 1, limit: 10 }, sorting = { field: 'priority', order: 'desc' }) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let data = [...getStoredBanners()];
      const now = new Date();

      // 1. Search by title
      if (filters.search) {
        const query = filters.search.toLowerCase();
        data = data.filter(b => b.title.toLowerCase().includes(query));
      }

      // 2. Banner Type
      if (filters.bannerType && filters.bannerType !== 'All') {
        data = data.filter(b => b.bannerType === filters.bannerType);
      }

      // 3. Redirect Type
      if (filters.redirectType && filters.redirectType !== 'All') {
        data = data.filter(b => b.redirectType === filters.redirectType);
      }

      // 4. Status Filtering
      if (filters.status && filters.status !== 'All') {
        data = data.filter(b => {
          const start = new Date(b.startDate);
          const end = new Date(b.endDate);
          const isAct = b.isActive;

          if (filters.status === 'Disabled') return !isAct;
          if (filters.status === 'Expired') return now > end;
          if (filters.status === 'Scheduled') return isAct && now < start;
          if (filters.status === 'Active') return isAct && now >= start && now <= end;
          return true;
        });
      }

      // 5. Date Ranges
      if (filters.startDate) {
        data = data.filter(b => new Date(b.startDate) >= new Date(filters.startDate));
      }
      if (filters.endDate) {
        data = data.filter(b => new Date(b.endDate) <= new Date(filters.endDate));
      }

      // 6. Geographic Scope Filters
      if (filters.regionIds && filters.regionIds.length > 0) {
        data = data.filter(b => b.regionIds.length === 0 || b.regionIds.some(r => filters.regionIds.includes(r)));
      }
      if (filters.franchiseIds && filters.franchiseIds.length > 0) {
        data = data.filter(b => b.franchiseIds.length === 0 || b.franchiseIds.some(f => filters.franchiseIds.includes(f)));
      }
      if (filters.storeIds && filters.storeIds.length > 0) {
        data = data.filter(b => b.storeIds.length === 0 || b.storeIds.some(s => filters.storeIds.includes(s)));
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
        banners: paginatedData,
        total: totalCount,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(totalCount / pagination.limit)
      });
    }, 500);
  });
};

export const apiGetBannerById = (id) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const data = getStoredBanners();
      const banner = data.find(b => b._id === id);
      if (banner) resolve(banner);
      else reject(new Error('Banner not found'));
    }, 250);
  });
};

export const apiCreateBanner = (payload) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const db = getStoredBanners();
      const newBanner = {
        _id: `ban-${Date.now()}`,
        title: payload.title,
        image: payload.image || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80&fm=webp',
        bannerType: payload.bannerType || 'Homepage Banner',
        redirectType: payload.redirectType || 'External URL',
        redirectId: payload.redirectId || '',
        priority: parseInt(payload.priority || 50),
        startDate: payload.startDate || new Date().toISOString(),
        endDate: payload.endDate || new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
        regionIds: payload.regionIds || [],
        franchiseIds: payload.franchiseIds || [],
        storeIds: payload.storeIds || [],
        isActive: payload.isActive !== undefined ? payload.isActive : true,
        createdAt: new Date().toISOString(),
        clicks: 0,
        impressions: 0
      };

      db.push(newBanner);
      setStoredBanners(db);
      resolve(newBanner);
    }, 700);
  });
};

export const apiUpdateBanner = (id, updatedFields) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const db = getStoredBanners();
      const idx = db.findIndex(b => b._id === id);
      if (idx !== -1) {
        db[idx] = {
          ...db[idx],
          ...updatedFields,
          priority: updatedFields.priority !== undefined ? parseInt(updatedFields.priority) : db[idx].priority,
          updatedAt: new Date().toISOString()
        };
        setStoredBanners(db);
        resolve(db[idx]);
      } else {
        reject(new Error('Banner not found'));
      }
    }, 600);
  });
};

export const apiDeleteBanner = (id) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const db = getStoredBanners();
      const filtered = db.filter(b => b._id !== id);
      if (db.length !== filtered.length) {
        setStoredBanners(filtered);
        resolve({ success: true, id });
      } else {
        reject(new Error('Banner not found'));
      }
    }, 500);
  });
};

export const apiBulkDeleteBanners = (ids) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const db = getStoredBanners();
      const filtered = db.filter(b => !ids.includes(b._id));
      setStoredBanners(filtered);
      resolve({ success: true, count: ids.length });
    }, 600);
  });
};

export const apiBulkUpdateBannerStatus = (ids, isActive) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const db = getStoredBanners();
      const updated = db.map(b => ids.includes(b._id) ? { ...b, isActive } : b);
      setStoredBanners(updated);
      resolve({ success: true, count: ids.length });
    }, 550);
  });
};

// Fetches for selector popups
export const apiGetCoupons = () => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockCoupons), 200);
  });
};

export const apiGetCampaigns = () => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockCampaigns), 200);
  });
};

export const apiGetProducts = () => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockProducts), 200);
  });
};

export const apiGetCategories = () => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockCategories), 200);
  });
};

// Analytics reports fetch
export const apiGetBannerAnalytics = (id) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        bannerId: id,
        impressions: 480000,
        clicks: 22400,
        ctr: 4.67,
        conversionRate: 8.2,
        revenueGenerated: 184500, // INR
        charts: {
          impressionsTrend: [
            { date: '06-12', value: 45000 },
            { date: '06-13', value: 58000 },
            { date: '06-14', value: 72000 },
            { date: '06-15', value: 64000 },
            { date: '06-16', value: 80000 },
            { date: '06-17', value: 78000 },
            { date: '06-18', value: 83000 }
          ],
          clicksTrend: [
            { date: '06-12', value: 1800 },
            { date: '06-13', value: 2400 },
            { date: '06-14', value: 3400 },
            { date: '06-15', value: 2800 },
            { date: '06-16', value: 3900 },
            { date: '06-17', value: 3800 },
            { date: '06-18', value: 4300 }
          ],
          ctrTrend: [
            { date: '06-12', rate: 4.0 },
            { date: '06-13', rate: 4.14 },
            { date: '06-14', rate: 4.72 },
            { date: '06-15', rate: 4.38 },
            { date: '06-16', rate: 4.88 },
            { date: '06-17', rate: 4.87 },
            { date: '06-18', rate: 5.18 }
          ]
        }
      });
    }, 400);
  });
};
