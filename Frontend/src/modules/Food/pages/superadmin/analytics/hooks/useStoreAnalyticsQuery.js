import { useState, useEffect, useCallback } from 'react';
import apiClient from '../../../../../../services/api/axios';
import { toast } from 'sonner';

// Probe backend connection
const FORCE_MOCK_MODE = false;
let isBackendOffline = sessionStorage.getItem('store_api_offline') === 'true';
let connectionPromise = null;

async function verifyConnection() {
  if (FORCE_MOCK_MODE) return false;
  if (isBackendOffline) return false;
  if (connectionPromise) return connectionPromise;

  connectionPromise = (async () => {
    try {
      await apiClient.get('/analytics/stores', { params: { probe: true }, timeout: 800 });
      return true;
    } catch (err) {
      if (!err.response) {
        sessionStorage.setItem('store_api_offline', 'true');
        isBackendOffline = true;
        return false;
      }
      return true;
    }
  })();

  return connectionPromise;
}

// =============================================================
// HIGH-FIDELITY OFFLINE MOCK DATA (India Centric)
// =============================================================

const MOCK_SUMMARY = {
  totalStores: 210,
  activeStores: 198,
  closedStores: 12,
  topPerformingStore: "Bhopal Central",
  topPerformingStoreRevenue: 840000,
  averageRating: 4.6,
  averagePrepTime: 16,
  cancellationRate: 2.8,
  refundRate: 1.4,
  // Trends compared to previous month
  totalStoresTrend: 2.3,
  activeStoresTrend: 3.1,
  closedStoresTrend: -14.2,
  topPerformingStoreTrend: 8.5,
  averageRatingTrend: 1.2,
  averagePrepTimeTrend: -5.4, // Down is good
  cancellationRateTrend: -8.2, // Down is good
  refundRateTrend: -12.5 // Down is good
};

const MOCK_REVENUE_COMPARISON = [
  { store: "Bhopal Central", revenue: 840000, orders: 1840, profit: 210000 },
  { store: "CP New Delhi", revenue: 780000, orders: 1720, profit: 195000 },
  { store: "Indore Town", revenue: 620000, orders: 1420, profit: 155000 },
  { store: "Pune Express", revenue: 540000, orders: 1100, profit: 125000 },
  { store: "Koramangala", revenue: 490000, orders: 980, profit: 110000 },
  { store: "Gwalior Fort", revenue: 410000, orders: 850, profit: 92000 },
  { store: "Ujjain Branch", revenue: 380000, orders: 790, profit: 85000 }
];

const MOCK_ORDERS_DAILY = [
  { name: 'Mon', orders: 420, completed: 410, cancelled: 10 },
  { name: 'Tue', orders: 480, completed: 468, cancelled: 12 },
  { name: 'Wed', orders: 510, completed: 498, cancelled: 12 },
  { name: 'Thu', orders: 580, completed: 565, cancelled: 15 },
  { name: 'Fri', orders: 740, completed: 720, cancelled: 20 },
  { name: 'Sat', orders: 920, completed: 898, cancelled: 22 },
  { name: 'Sun', orders: 860, completed: 835, cancelled: 25 }
];

const MOCK_ORDERS_WEEKLY = [
  { name: 'Week 1', orders: 3200, completed: 3110, cancelled: 90 },
  { name: 'Week 2', orders: 3500, completed: 3400, cancelled: 100 },
  { name: 'Week 3', orders: 3800, completed: 3705, cancelled: 95 },
  { name: 'Week 4', orders: 4400, completed: 4280, cancelled: 120 }
];

const MOCK_ORDERS_MONTHLY = [
  { name: 'Jan', orders: 14200, completed: 13800, cancelled: 400 },
  { name: 'Feb', orders: 15500, completed: 15080, cancelled: 420 },
  { name: 'Mar', orders: 16800, completed: 16350, cancelled: 450 },
  { name: 'Apr', orders: 18200, completed: 17700, cancelled: 500 },
  { name: 'May', orders: 20100, completed: 19560, cancelled: 540 },
  { name: 'Jun', orders: 19800, completed: 19280, cancelled: 520 }
];

const MOCK_RATING_DISTRIBUTION = [
  { name: '5 Stars', value: 55, percentage: 55 },
  { name: '4 Stars', value: 30, percentage: 30 },
  { name: '3 Stars', value: 10, percentage: 10 },
  { name: '2 Stars', value: 3, percentage: 3 },
  { name: '1 Star', value: 2, percentage: 2 }
];

const MOCK_PREP_TIME_HEATMAP = [
  { store: "Bhopal Central", h10: 12, h12: 18, h14: 16, h16: 11, h18: 22, h20: 25, h22: 15 },
  { store: "CP New Delhi", h10: 15, h12: 22, h14: 19, h16: 13, h18: 26, h20: 28, h22: 18 },
  { store: "Indore Town", h10: 10, h12: 15, h14: 14, h16: 12, h18: 19, h20: 22, h22: 14 },
  { store: "Pune Express", h10: 14, h12: 19, h14: 18, h16: 11, h18: 24, h20: 26, h22: 17 },
  { store: "Koramangala", h10: 13, h12: 20, h14: 17, h16: 12, h18: 25, h20: 27, h22: 16 },
  { store: "Gwalior Fort", h10: 11, h12: 14, h14: 13, h16: 10, h18: 18, h20: 20, h22: 12 },
  { store: "Ujjain Branch", h10: 12, h12: 13, h14: 12, h16: 11, h18: 17, h20: 19, h22: 13 }
];

const MOCK_PROFIT_COMPARISON = [
  { store: "Bhopal Central", profit: 210000, margin: 25 },
  { store: "CP New Delhi", profit: 195000, margin: 25 },
  { store: "Indore Town", profit: 155000, margin: 25 },
  { store: "Pune Express", profit: 125000, margin: 23.1 },
  { store: "Koramangala", profit: 110000, margin: 22.4 },
  { store: "Gwalior Fort", profit: 92000, margin: 22.4 },
  { store: "Ujjain Branch", profit: 85000, margin: 22.3 }
];

const MOCK_TABLE_ROWS = [
  { id: 'ST-001', name: 'Bhopal Central', franchise: 'Sharma Foodworks', orders: 1840, revenue: 840000, rating: 4.8, avgPrepTime: 14, status: 'Active' },
  { id: 'ST-002', name: 'CP New Delhi', franchise: 'Khanna Retailers', orders: 1720, revenue: 780000, rating: 4.7, avgPrepTime: 16, status: 'Active' },
  { id: 'ST-003', name: 'Indore Town', franchise: 'Malwa Food Systems', orders: 1420, revenue: 620000, rating: 4.6, avgPrepTime: 15, status: 'Active' },
  { id: 'ST-004', name: 'Pune Express', franchise: 'Deccan Hospitality', orders: 1100, revenue: 540000, rating: 4.4, avgPrepTime: 17, status: 'Active' },
  { id: 'ST-005', name: 'Koramangala', franchise: 'South Crust Corp', orders: 980, revenue: 490000, rating: 4.5, avgPrepTime: 16, status: 'Active' },
  { id: 'ST-006', name: 'Gwalior Fort', franchise: 'Scindia Enterprises', orders: 850, revenue: 410000, rating: 4.3, avgPrepTime: 18, status: 'Active' },
  { id: 'ST-007', name: 'Ujjain Branch', franchise: 'Mahakal Eateries', orders: 790, revenue: 380000, rating: 4.4, avgPrepTime: 15, status: 'Closed' }
];

// Dropdown Options
const MOCK_REGIONS = [
  { id: 'reg-north', name: 'North India' },
  { id: 'reg-central', name: 'Central India' },
  { id: 'reg-west', name: 'West India' },
  { id: 'reg-south', name: 'South India' }
];

const MOCK_ZONES = {
  'reg-north': [{ id: 'zone-delhi', name: 'Delhi NCR' }, { id: 'zone-up', name: 'Uttar Pradesh' }],
  'reg-central': [{ id: 'zone-mp', name: 'Madhya Pradesh' }, { id: 'zone-cg', name: 'Chhattisgarh' }],
  'reg-west': [{ id: 'zone-mh', name: 'Maharashtra' }, { id: 'zone-gj', name: 'Gujarat' }],
  'reg-south': [{ id: 'zone-kar', name: 'Karnataka' }, { id: 'zone-tn', name: 'Tamil Nadu' }]
};

const MOCK_TERRITORIES = {
  'zone-delhi': [{ id: 'terr-nd', name: 'New Delhi' }, { id: 'terr-gur', name: 'Gurugram' }],
  'zone-mp': [{ id: 'terr-bho', name: 'Bhopal' }, { id: 'terr-ind', name: 'Indore' }],
  'zone-kar': [{ id: 'terr-blr', name: 'Bengaluru' }],
  'zone-mh': [{ id: 'terr-pun', name: 'Pune' }, { id: 'terr-mum', name: 'Mumbai' }]
};

const MOCK_FRANCHISES = [
  { id: 'fran-sharma', name: 'Sharma Foodworks' },
  { id: 'fran-khanna', name: 'Khanna Retailers' },
  { id: 'fran-malwa', name: 'Malwa Food Systems' },
  { id: 'fran-deccan', name: 'Deccan Hospitality' },
  { id: 'fran-south', name: 'South Crust Corp' }
];

const MOCK_STORES = [
  { id: 'ST-001', name: 'Bhopal Central' },
  { id: 'ST-002', name: 'CP New Delhi' },
  { id: 'ST-003', name: 'Indore Town' },
  { id: 'ST-004', name: 'Pune Express' },
  { id: 'ST-005', name: 'Koramangala' },
  { id: 'ST-006', name: 'Gwalior Fort' },
  { id: 'ST-007', name: 'Ujjain Branch' }
];

// =============================================================
// REACT HOOK IMPLEMENTATIONS
// =============================================================

// Dynamic Option Loading Hooks
export function useRegions() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const isOnline = await verifyConnection();
      if (!isOnline) {
        setData(MOCK_REGIONS);
        setLoading(false);
        return;
      }
      try {
        const res = await apiClient.get('/regions', { timeout: 800 });
        setData(res.data?.data || res.data || MOCK_REGIONS);
      } catch {
        setData(MOCK_REGIONS);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { data, loading };
}

export function useZones(regionId) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!regionId) {
      setData(prev => (prev.length === 0 ? prev : []));
      return;
    }
    (async () => {
      setLoading(true);
      const isOnline = await verifyConnection();
      if (!isOnline) {
        setData(MOCK_ZONES[regionId] || []);
        setLoading(false);
        return;
      }
      try {
        const res = await apiClient.get(`/zones`, { params: { regionId }, timeout: 800 });
        setData(res.data?.data || res.data || MOCK_ZONES[regionId] || []);
      } catch {
        setData(MOCK_ZONES[regionId] || []);
      } finally {
        setLoading(false);
      }
    })();
  }, [regionId]);

  return { data, loading };
}

export function useTerritories(zoneId) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!zoneId) {
      setData(prev => (prev.length === 0 ? prev : []));
      return;
    }
    (async () => {
      setLoading(true);
      const isOnline = await verifyConnection();
      if (!isOnline) {
        setData(MOCK_TERRITORIES[zoneId] || []);
        setLoading(false);
        return;
      }
      try {
        const res = await apiClient.get(`/territories`, { params: { zoneId }, timeout: 800 });
        setData(res.data?.data || res.data || MOCK_TERRITORIES[zoneId] || []);
      } catch {
        setData(MOCK_TERRITORIES[zoneId] || []);
      } finally {
        setLoading(false);
      }
    })();
  }, [zoneId]);

  return { data, loading };
}

export function useFranchises() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const isOnline = await verifyConnection();
      if (!isOnline) {
        setData(MOCK_FRANCHISES);
        setLoading(false);
        return;
      }
      try {
        const res = await apiClient.get('/franchises', { timeout: 800 });
        setData(res.data?.data || res.data || MOCK_FRANCHISES);
      } catch {
        setData(MOCK_FRANCHISES);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { data, loading };
}

export function useStores() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const isOnline = await verifyConnection();
      if (!isOnline) {
        setData(MOCK_STORES);
        setLoading(false);
        return;
      }
      try {
        const res = await apiClient.get('/stores', { timeout: 800 });
        setData(res.data?.data || res.data || MOCK_STORES);
      } catch {
        setData(MOCK_STORES);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { data, loading };
}

// KPI Dashboard Stats Hook
export function useStoreStats(filters) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    const isOnline = await verifyConnection();
    if (!isOnline) {
      setData(MOCK_SUMMARY);
      setLoading(false);
      return;
    }
    try {
      const res = await apiClient.get('/analytics/stores', { params: filters, timeout: 1000 });
      setData(res.data?.data || res.data || MOCK_SUMMARY);
    } catch {
      setData(MOCK_SUMMARY);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { data, loading, refetch: fetchStats };
}

// Revenue Comparison Chart Hook
export function useStoreRevenueComparison(filters) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRevenue = useCallback(async () => {
    setLoading(true);
    const isOnline = await verifyConnection();
    if (!isOnline) {
      setData(MOCK_REVENUE_COMPARISON);
      setLoading(false);
      return;
    }
    try {
      const res = await apiClient.get('/analytics/stores/revenue', { params: filters, timeout: 1000 });
      setData(res.data?.data || res.data || MOCK_REVENUE_COMPARISON);
    } catch {
      setData(MOCK_REVENUE_COMPARISON);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchRevenue();
  }, [fetchRevenue]);

  return { data, loading, refetch: fetchRevenue };
}

// Orders Trend Volume Hook
export function useStoreOrdersVolume(filters, interval) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const isOnline = await verifyConnection();
    if (!isOnline) {
      setData(interval === 'daily' ? MOCK_ORDERS_DAILY : interval === 'weekly' ? MOCK_ORDERS_WEEKLY : MOCK_ORDERS_MONTHLY);
      setLoading(false);
      return;
    }
    try {
      const res = await apiClient.get('/analytics/stores/orders', { params: { ...filters, interval }, timeout: 1000 });
      setData(res.data?.data || res.data || (interval === 'daily' ? MOCK_ORDERS_DAILY : interval === 'weekly' ? MOCK_ORDERS_WEEKLY : MOCK_ORDERS_MONTHLY));
    } catch {
      setData(interval === 'daily' ? MOCK_ORDERS_DAILY : interval === 'weekly' ? MOCK_ORDERS_WEEKLY : MOCK_ORDERS_MONTHLY);
    } finally {
      setLoading(false);
    }
  }, [filters, interval]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { data, loading, refetch: fetchOrders };
}

// Ratings Share Hook
export function useStoreRatingDistribution(filters) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRatings = useCallback(async () => {
    setLoading(true);
    const isOnline = await verifyConnection();
    if (!isOnline) {
      setData(MOCK_RATING_DISTRIBUTION);
      setLoading(false);
      return;
    }
    try {
      const res = await apiClient.get('/analytics/stores/rating-distribution', { params: filters, timeout: 1000 });
      setData(res.data?.data || res.data || MOCK_RATING_DISTRIBUTION);
    } catch {
      setData(MOCK_RATING_DISTRIBUTION);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchRatings();
  }, [fetchRatings]);

  return { data, loading, refetch: fetchRatings };
}

// Prep Time Heatmap Hook
export function useStorePrepTimeHeatmap(filters) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHeatmap = useCallback(async () => {
    setLoading(true);
    const isOnline = await verifyConnection();
    if (!isOnline) {
      setData(MOCK_PREP_TIME_HEATMAP);
      setLoading(false);
      return;
    }
    try {
      const res = await apiClient.get('/analytics/stores/prep-time', { params: filters, timeout: 1000 });
      setData(res.data?.data || res.data || MOCK_PREP_TIME_HEATMAP);
    } catch {
      setData(MOCK_PREP_TIME_HEATMAP);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchHeatmap();
  }, [fetchHeatmap]);

  return { data, loading, refetch: fetchHeatmap };
}

// Profit Comparison Hook
export function useStoreProfitComparison(filters) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProfit = useCallback(async () => {
    setLoading(true);
    const isOnline = await verifyConnection();
    if (!isOnline) {
      setData(MOCK_PROFIT_COMPARISON);
      setLoading(false);
      return;
    }
    try {
      const res = await apiClient.get('/analytics/stores/profit', { params: filters, timeout: 1000 });
      setData(res.data?.data || res.data || MOCK_PROFIT_COMPARISON);
    } catch {
      setData(MOCK_PROFIT_COMPARISON);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProfit();
  }, [fetchProfit]);

  return { data, loading, refetch: fetchProfit };
}

// Store Table Hook (supports searching, sorting, filters, server-side simulation)
export function useStoreAnalyticsTable(filters, pagination) {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchTable = useCallback(async () => {
    setLoading(true);
    const isOnline = await verifyConnection();
    if (!isOnline) {
      let filtered = [...MOCK_TABLE_ROWS];
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        filtered = filtered.filter(row => row.name.toLowerCase().includes(q) || row.franchise.toLowerCase().includes(q) || row.id.toLowerCase().includes(q));
      }
      if (filters?.storeId) {
        filtered = filtered.filter(row => row.id === filters.storeId);
      }
      if (filters?.franchiseId) {
        // Mock matching franchise names based on filter ID
        const selectedFran = MOCK_FRANCHISES.find(f => f.id === filters.franchiseId)?.name;
        if (selectedFran) {
          filtered = filtered.filter(row => row.franchise === selectedFran);
        }
      }
      if (filters?.status) {
        filtered = filtered.filter(row => row.status === filters.status);
      }
      if (filters?.sortBy) {
        const key = filters.sortBy.key;
        const dir = filters.sortBy.dir === 'asc' ? 1 : -1;
        filtered.sort((a, b) => {
          if (a[key] < b[key]) return -1 * dir;
          if (a[key] > b[key]) return 1 * dir;
          return 0;
        });
      }
      
      const count = filtered.length;
      const start = (pagination.page - 1) * pagination.limit;
      setData(filtered.slice(start, start + pagination.limit));
      setTotal(count);
      setLoading(false);
      return;
    }
    try {
      const res = await apiClient.get('/analytics/stores/table', {
        params: { ...filters, page: pagination.page, limit: pagination.limit },
        timeout: 1000
      });
      setData(res.data?.data || res.data?.rows || MOCK_TABLE_ROWS);
      setTotal(res.data?.pagination?.total || res.data?.total || MOCK_TABLE_ROWS.length);
    } catch {
      setData(MOCK_TABLE_ROWS);
      setTotal(MOCK_TABLE_ROWS.length);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchTable();
  }, [fetchTable]);

  return { data, total, loading, refetch: fetchTable };
}

// Store Details Drill-down Hook (Loads subtabs details)
export function useStoreDetails(storeId) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!storeId) return;
    (async () => {
      setLoading(true);
      const isOnline = await verifyConnection();
      if (!isOnline) {
        const storeObj = MOCK_TABLE_ROWS.find(s => s.id === storeId) || MOCK_TABLE_ROWS[0];
        setProfile({
          id: storeObj.id,
          name: storeObj.name,
          logo: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=150&fm=webp',
          franchise: storeObj.franchise,
          region: 'Central India',
          territory: 'Bhopal',
          status: storeObj.status,
          averageRating: storeObj.rating,
          overview: {
            orders: storeObj.orders,
            revenue: storeObj.revenue,
            profit: Math.round(storeObj.revenue * 0.25),
            avgPrepTime: storeObj.avgPrepTime,
            cancellationRate: 2.5,
            refundRate: 1.2,
            inventoryHealth: 'Healthy',
            recentActivity: [
              { time: '10 mins ago', title: 'Bulk Order Completed', desc: 'Order #ORD-8820 containing 8 pizzas delivered successfully.' },
              { time: '1 hour ago', title: 'Inventory Alert Resolved', desc: 'Paneer cheese restocked from regional warehouse.' },
              { time: '2 hours ago', title: 'New Rider Allocated', desc: 'Rider Ramesh Kumar onboarded to shift.' },
              { time: '4 hours ago', title: 'Kitchen Shift Changed', desc: 'Chef Suresh took charge of Oven A.' }
            ]
          }
        });
        setLoading(false);
        return;
      }
      try {
        const res = await apiClient.get(`/analytics/store/${storeId}`, { timeout: 1000 });
        setProfile(res.data?.data || res.data);
      } catch {
        const storeObj = MOCK_TABLE_ROWS.find(s => s.id === storeId) || MOCK_TABLE_ROWS[0];
        setProfile({
          id: storeObj.id,
          name: storeObj.name,
          logo: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=150&fm=webp',
          franchise: storeObj.franchise,
          region: 'Central India',
          territory: 'Bhopal',
          status: storeObj.status,
          averageRating: storeObj.rating,
          overview: {
            orders: storeObj.orders,
            revenue: storeObj.revenue,
            profit: Math.round(storeObj.revenue * 0.25),
            avgPrepTime: storeObj.avgPrepTime,
            cancellationRate: 2.5,
            refundRate: 1.2,
            inventoryHealth: 'Healthy',
            recentActivity: [
              { time: '10 mins ago', title: 'Bulk Order Completed', desc: 'Order #ORD-8820 containing 8 pizzas delivered successfully.' }
            ]
          }
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [storeId]);

  return { profile, loading };
}

// 1. Revenue Tab Hook
export function useStoreRevenue(storeId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!storeId) return;
    (async () => {
      setLoading(true);
      const isOnline = await verifyConnection();
      if (!isOnline) {
        const storeObj = MOCK_TABLE_ROWS.find(s => s.id === storeId) || MOCK_TABLE_ROWS[0];
        setData({
          grossRevenue: storeObj.revenue,
          netRevenue: Math.round(storeObj.revenue * 0.88),
          discounts: Math.round(storeObj.revenue * 0.05),
          taxes: Math.round(storeObj.revenue * 0.07),
          refundAmount: Math.round(storeObj.revenue * 0.012),
          monthlyData: [
            { month: 'Jan', gross: Math.round(storeObj.revenue * 0.75), net: Math.round(storeObj.revenue * 0.66) },
            { month: 'Feb', gross: Math.round(storeObj.revenue * 0.8), net: Math.round(storeObj.revenue * 0.7) },
            { month: 'Mar', gross: Math.round(storeObj.revenue * 0.85), net: Math.round(storeObj.revenue * 0.75) },
            { month: 'Apr', gross: Math.round(storeObj.revenue * 0.9), net: Math.round(storeObj.revenue * 0.79) },
            { month: 'May', gross: Math.round(storeObj.revenue * 1.05), net: Math.round(storeObj.revenue * 0.92) },
            { month: 'Jun', gross: storeObj.revenue, net: Math.round(storeObj.revenue * 0.88) }
          ]
        });
        setLoading(false);
        return;
      }
      try {
        const res = await apiClient.get(`/analytics/store/${storeId}/revenue`, { timeout: 1000 });
        setData(res.data?.data || res.data);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [storeId]);

  return { data, loading };
}

// 2. Orders Tab Hook
export function useStoreOrders(storeId, filters, pagination) {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    const isOnline = await verifyConnection();
    if (!isOnline) {
      const mockOrders = [
        { id: 'ORD-9022', date: '2026-06-19', customer: 'Rakesh Patel', amount: 590, items: 'Cheese Burst Pizza x1, Garlic Dips x2', deliveryType: 'Delivery', status: 'Delivered' },
        { id: 'ORD-9018', date: '2026-06-19', customer: 'Neha Sharma', amount: 450, items: 'Tandoori Paneer Pizza x1, Pepsi x1', deliveryType: 'Delivery', status: 'Delivered' },
        { id: 'ORD-9015', date: '2026-06-18', customer: 'Anil Deshmukh', amount: 720, items: 'Veg Supreme Pizza x1, Margherita Pizza x1', deliveryType: 'Takeaway', status: 'Delivered' },
        { id: 'ORD-8994', date: '2026-06-18', customer: 'Sita Verma', amount: 320, items: 'Farmhouse Delight Pizza x1', deliveryType: 'Delivery', status: 'Cancelled' },
        { id: 'ORD-8980', date: '2026-06-17', customer: 'Vijay Nair', amount: 1150, items: 'Double Cheese Margherita x2, Choco Lava x3', deliveryType: 'Delivery', status: 'Delivered' }
      ];
      setStats({
        completed: 142,
        cancelled: 4,
        pending: 3
      });
      let filtered = [...mockOrders];
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        filtered = filtered.filter(o => o.customer.toLowerCase().includes(q) || o.id.toLowerCase().includes(q) || o.items.toLowerCase().includes(q));
      }
      setTotal(filtered.length);
      const start = (pagination.page - 1) * pagination.limit;
      setData(filtered.slice(start, start + pagination.limit));
      setLoading(false);
      return;
    }
    try {
      const res = await apiClient.get(`/analytics/store/${storeId}/orders`, {
        params: { ...filters, page: pagination.page, limit: pagination.limit },
        timeout: 1000
      });
      setData(res.data?.data || res.data?.rows || []);
      setTotal(res.data?.total || 5);
      setStats(res.data?.stats || { completed: 142, cancelled: 4, pending: 3 });
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [storeId, filters, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { data, total, stats, loading, refetch: fetchOrders };
}

// 3. Staff Tab Hook
export function useStoreStaff(storeId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!storeId) return;
    (async () => {
      setLoading(true);
      const isOnline = await verifyConnection();
      if (!isOnline) {
        setData({
          managers: [
            { photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100&fm=webp', name: 'Alok Gupta', phone: '+91 94029 88390', shift: 'Morning (09:00 - 18:00)', experience: '4.5 Years' },
            { photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=100&fm=webp', name: 'Pooja Rawat', phone: '+91 88401 22894', shift: 'Evening (16:00 - 01:00)', experience: '3 Years' }
          ],
          kitchenStaff: [
            { name: 'Karan Malhotra', role: 'Head Pizza Chef', shift: 'Morning', ordersHandled: 1240, efficiencyScore: 94 },
            { name: 'Sunil Verma', role: 'Kitchen Helper', shift: 'Morning', ordersHandled: 890, efficiencyScore: 88 },
            { name: 'Irfan Khan', role: 'Oven Specialist', shift: 'Evening', ordersHandled: 1540, efficiencyScore: 96 },
            { name: 'Deepak Jha', role: 'Prep Chef', shift: 'Evening', ordersHandled: 910, efficiencyScore: 85 }
          ],
          deliveryStaff: [
            { name: 'Ramesh Singh', ordersDelivered: 420, rating: 4.8, availability: 'Active' },
            { name: 'Sanjay Dutt', ordersDelivered: 380, rating: 4.6, availability: 'Active' },
            { name: 'Vijay Kadam', ordersDelivered: 290, rating: 4.2, availability: 'On Break' },
            { name: 'Rider Ashish', ordersDelivered: 150, rating: 3.9, availability: 'Inactive' }
          ]
        });
        setLoading(false);
        return;
      }
      try {
        const res = await apiClient.get(`/analytics/store/${storeId}/staff`, { timeout: 1000 });
        setData(res.data?.data || res.data);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [storeId]);

  return { data, loading };
}

// 4. Inventory Tab Hook
export function useStoreInventory(storeId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!storeId) return;
    (async () => {
      setLoading(true);
      const isOnline = await verifyConnection();
      if (!isOnline) {
        setData({
          healthyStock: 48,
          lowStock: 6,
          outOfStock: 2,
          expiredItems: 1,
          items: [
            { item: 'Processed Mozzarella Cheese', qty: '14.2 kg', minQty: '25 kg', status: 'Low', lastUpdated: 'Today, 09:30 AM' },
            { item: 'Pizza Wheat Flour Bags', qty: '210 kg', minQty: '100 kg', status: 'Healthy', lastUpdated: 'Today, 08:00 AM' },
            { item: 'Sweet Corn Kernels Cans', qty: '0 cans', minQty: '15 cans', status: 'Out of Stock', lastUpdated: 'Yesterday' },
            { item: 'Tandoori Pizza Sauce', qty: '8 kg', minQty: '20 kg', status: 'Critical', lastUpdated: 'Today, 10:15 AM' },
            { item: 'Fresh Capsicum Caps', qty: '18 kg', minQty: '12 kg', status: 'Healthy', lastUpdated: 'Today, 08:30 AM' }
          ]
        });
        setLoading(false);
        return;
      }
      try {
        const res = await apiClient.get(`/analytics/store/${storeId}/inventory`, { timeout: 1000 });
        setData(res.data?.data || res.data);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [storeId]);

  return { data, loading };
}

// 5. Ratings Tab Hook
export function useStoreRatings(storeId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!storeId) return;
    (async () => {
      setLoading(true);
      const isOnline = await verifyConnection();
      if (!isOnline) {
        setData({
          averageRating: 4.6,
          fiveStarCount: 108,
          negativeReviews: 4,
          reviews: [
            { customer: 'Rohan Malhotra', order: '#ORD-9022', rating: 5, review: 'Absolutely loaded with toppings! Delivered piping hot.', createdDate: '2026-06-19', sentiment: 'Positive' },
            { customer: 'Amit Verma', order: '#ORD-9018', rating: 4, review: 'Paneer was fresh and soft. Prep was slightly slow but taste made up for it.', createdDate: '2026-06-19', sentiment: 'Positive' },
            { customer: 'Pooja Patel', order: '#ORD-8994', rating: 1, review: 'Order cancelled after 40 minutes wait. Highly disappointed with the service.', createdDate: '2026-06-18', sentiment: 'Negative' },
            { customer: 'Isha Sharma', order: '#ORD-8980', rating: 5, review: 'Cheese Burst base was perfect. Best pizza in town!', createdDate: '2026-06-17', sentiment: 'Positive' }
          ]
        });
        setLoading(false);
        return;
      }
      try {
        const res = await apiClient.get(`/analytics/store/${storeId}/ratings`, { timeout: 1000 });
        setData(res.data?.data || res.data);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [storeId]);

  return { data, loading };
}

// 6. Refunds Tab Hook
export function useStoreRefunds(storeId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!storeId) return;
    (async () => {
      setLoading(true);
      const isOnline = await verifyConnection();
      if (!isOnline) {
        setData({
          refundAmount: 1850,
          refundCount: 4,
          refundRate: 1.2,
          reasonData: [
            { name: 'Late Delivery', value: 40 },
            { name: 'Missing Toppings', value: 25 },
            { name: 'Burnt Crust', value: 20 },
            { name: 'Wrong Order', value: 15 }
          ],
          refunds: [
            { orderId: 'ORD-8994', customer: 'Pooja Patel', amount: 320, reason: 'Late Delivery (> 45m)', status: 'Approved', date: '2026-06-18' },
            { orderId: 'ORD-8715', customer: 'Vijay Shah', amount: 590, reason: 'Wrong Crust Type Sent', status: 'Approved', date: '2026-06-12' },
            { orderId: 'ORD-8620', customer: 'Divya Rao', amount: 480, reason: 'Burnt Cheese/Crust', status: 'Approved', date: '2026-06-08' },
            { orderId: 'ORD-8452', customer: 'Rahul Joshi', amount: 460, reason: 'Missing Dips & Pepsi', status: 'Processed', date: '2026-06-03' }
          ]
        });
        setLoading(false);
        return;
      }
      try {
        const res = await apiClient.get(`/analytics/store/${storeId}/refunds`, { timeout: 1000 });
        setData(res.data?.data || res.data);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [storeId]);

  return { data, loading };
}

// 7. Performance Trend Tab Hook
export function useStorePerformanceTrend(storeId, interval) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!storeId) return;
    (async () => {
      setLoading(true);
      const isOnline = await verifyConnection();
      if (!isOnline) {
        const monthlyData = [
          { name: 'Jan', revenue: 650000, orders: 1300, rating: 4.4, refunds: 12000, prepTime: 18 },
          { name: 'Feb', rounded: 710000, revenue: 710000, orders: 1450, rating: 4.5, refunds: 9800, prepTime: 17 },
          { name: 'Mar', revenue: 740000, orders: 1510, rating: 4.6, refunds: 15000, prepTime: 16 },
          { name: 'Apr', revenue: 780000, orders: 1600, rating: 4.5, refunds: 11000, prepTime: 16 },
          { name: 'May', revenue: 860000, orders: 1850, rating: 4.7, refunds: 8500, prepTime: 15 },
          { name: 'Jun', revenue: 840000, orders: 1840, rating: 4.8, refunds: 10080, prepTime: 14 }
        ];
        const quarterlyData = [
          { name: 'Q1-2026', revenue: 2100000, orders: 4260, rating: 4.5, refunds: 36800, prepTime: 17 },
          { name: 'Q2-2026', revenue: 2480000, orders: 5290, rating: 4.7, refunds: 29580, prepTime: 15 }
        ];
        const yearlyData = [
          { name: '2025', revenue: 7800000, orders: 16200, rating: 4.4, refunds: 124000, prepTime: 19 },
          { name: '2026 YTD', revenue: 4580000, orders: 9550, rating: 4.6, refunds: 66380, prepTime: 16 }
        ];
        setData(interval === 'monthly' ? monthlyData : interval === 'quarterly' ? quarterlyData : yearlyData);
        setLoading(false);
        return;
      }
      try {
        const res = await apiClient.get(`/analytics/store/${storeId}/performance`, { params: { interval }, timeout: 1000 });
        setData(res.data?.data || res.data || []);
      } catch {
        setData([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [storeId, interval]);

  return { data, loading };
}

// Compare Stores execution hook
export function useCompareStores() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const compare = useCallback(async (storeIds) => {
    if (!storeIds || storeIds.length === 0) return [];
    setLoading(true);
    const isOnline = await verifyConnection();
    if (!isOnline) {
      // Simulate comparison metrics matching request format
      // Metrics: Revenue, Orders, Average Rating, Preparation Time, Refund %, Customer Satisfaction, Profit, Cancellation Rate, Inventory Health
      const mockStoreData = {
        'ST-001': { id: 'ST-001', name: 'Bhopal Central', revenue: 840000, orders: 1840, rating: 4.8, prepTime: 14, refundPct: 1.2, csat: 95, profit: 210000, cancelRate: 2.5, inventoryHealth: 92 },
        'ST-002': { id: 'ST-002', name: 'CP New Delhi', revenue: 780000, orders: 1720, rating: 4.7, prepTime: 16, refundPct: 1.4, csat: 93, profit: 195000, cancelRate: 2.7, inventoryHealth: 95 },
        'ST-003': { id: 'ST-003', name: 'Indore Town', revenue: 620000, orders: 1420, rating: 4.6, prepTime: 15, refundPct: 1.1, csat: 92, profit: 155000, cancelRate: 2.4, inventoryHealth: 88 },
        'ST-004': { id: 'ST-004', name: 'Pune Express', revenue: 540000, orders: 1100, rating: 4.4, prepTime: 17, refundPct: 1.5, csat: 89, profit: 125000, cancelRate: 3.1, inventoryHealth: 90 },
        'ST-005': { id: 'ST-005', name: 'Koramangala', revenue: 490000, orders: 980, rating: 4.5, prepTime: 16, refundPct: 1.3, csat: 91, profit: 110000, cancelRate: 2.6, inventoryHealth: 85 },
        'ST-006': { id: 'ST-006', name: 'Gwalior Fort', revenue: 410000, orders: 850, rating: 4.3, prepTime: 18, refundPct: 1.6, csat: 86, profit: 92000, cancelRate: 3.5, inventoryHealth: 81 },
        'ST-007': { id: 'ST-007', name: 'Ujjain Branch', revenue: 380000, orders: 790, rating: 4.4, prepTime: 15, refundPct: 1.2, csat: 88, profit: 85000, cancelRate: 2.8, inventoryHealth: 80 }
      };

      const results = storeIds.map(id => mockStoreData[id] || {
        id, name: `Store ${id}`, revenue: 300000, orders: 600, rating: 4.0, prepTime: 20, refundPct: 2.0, csat: 80, profit: 60000, cancelRate: 4.0, inventoryHealth: 75
      });
      setData(results);
      setLoading(false);
      return results;
    }
    try {
      const res = await apiClient.post('/analytics/stores/compare', { storeIds }, { timeout: 1500 });
      setData(res.data?.data || res.data || []);
      return res.data?.data || res.data || [];
    } catch {
      setData([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return { compare, data, loading };
}
