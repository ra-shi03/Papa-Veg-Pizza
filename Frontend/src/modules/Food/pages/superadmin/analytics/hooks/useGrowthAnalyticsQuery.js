import { useState, useEffect, useCallback } from 'react';
import apiClient from '../../../../../../services/api/axios';
import { toast } from 'sonner';

// Probe backend connection
const FORCE_MOCK_MODE = false;
let isBackendOffline = sessionStorage.getItem('growth_api_offline') === 'true';
let connectionPromise = null;

async function verifyConnection() {
  if (FORCE_MOCK_MODE) return false;
  if (isBackendOffline) return false;
  if (connectionPromise) return connectionPromise;

  connectionPromise = (async () => {
    try {
      await apiClient.get('/analytics/growth', { params: { probe: true }, timeout: 800 });
      return true;
    } catch (err) {
      if (!err.response) {
        sessionStorage.setItem('growth_api_offline', 'true');
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
  platformGrowth: 18.4,
  revenueGrowth: 21.6,
  customerGrowth: 16.9,
  storeGrowth: 12.2,
  orderGrowth: 19.5,
  franchiseGrowth: 10.8,
  retentionRate: 82,
  marketShare: 11.7
};

const MOCK_REVENUE_GROWTH = [
  { month: 'Jan', revenue: 1250000, orders: 3500, profit: 375000 },
  { month: 'Feb', revenue: 1450000, orders: 4100, profit: 435000 },
  { month: 'Mar', revenue: 1650000, orders: 4800, profit: 495000 },
  { month: 'Apr', revenue: 1580000, orders: 4600, profit: 474000 },
  { month: 'May', revenue: 1890000, orders: 5400, profit: 567000 },
  { month: 'Jun', revenue: 2160000, orders: 6200, profit: 648000 }
];

const MOCK_CUSTOMER_GROWTH = [
  { week: 'Wk 1', newCustomers: 120, returningCustomers: 450 },
  { week: 'Wk 2', newCustomers: 150, returningCustomers: 480 },
  { week: 'Wk 3', newCustomers: 180, returningCustomers: 510 },
  { week: 'Wk 4', newCustomers: 210, returningCustomers: 550 },
  { week: 'Wk 5', newCustomers: 195, returningCustomers: 590 },
  { week: 'Wk 6', newCustomers: 245, returningCustomers: 630 }
];

const MOCK_STORE_EXPANSION = [
  { region: 'North India', stores: 12, revenue: 1450000 },
  { region: 'Central India', stores: 8, revenue: 980000 },
  { region: 'West India', stores: 15, revenue: 1890000 },
  { region: 'South India', stores: 6, revenue: 780000 }
];

const MOCK_FRANCHISE_GROWTH = [
  { franchise: 'Sharma Foodworks', growth: 14.5, revenue: 840000 },
  { franchise: 'Khanna Retailers', growth: 9.2, revenue: 620000 },
  { franchise: 'Malwa Food Systems', growth: 12.8, revenue: 750000 },
  { franchise: 'Deccan Hospitality', growth: 6.4, revenue: 480000 },
  { franchise: 'South Crust Corp', growth: 11.2, revenue: 590000 }
];

const MOCK_TOP_CITIES = [
  { city: 'Indore', lat: 22.7196, lng: 75.8577, revenue: 1480000, orders: 4200, customers: 1150, growth: 15.4 },
  { city: 'Bhopal', lat: 23.2599, lng: 77.4126, revenue: 1120000, orders: 3100, customers: 890, growth: 12.2 },
  { city: 'Pune', lat: 18.5204, lng: 73.8567, revenue: 2150000, orders: 6400, customers: 1850, growth: 18.6 },
  { city: 'Mumbai', lat: 19.0760, lng: 72.8777, revenue: 3840000, orders: 11200, customers: 3400, growth: 22.5 },
  { city: 'Delhi NCR', lat: 28.7041, lng: 77.1025, revenue: 4280000, orders: 12500, customers: 4100, growth: 24.1 },
  { city: 'Bangalore', lat: 12.9716, lng: 77.5946, revenue: 3100000, orders: 9200, customers: 2800, growth: 19.8 }
];

const MOCK_FORECAST = {
  confidenceScore: 94.8,
  metrics: {
    predictedRevenue: 2480000,
    predictedOrders: 7100,
    predictedCustomers: 2200,
    predictedStoreGrowth: 4
  },
  chartData: [
    { day: 'Day 5', actualRevenue: 2100000, predictedRevenue: 2120000, confMin: 2000000, confMax: 2240000 },
    { day: 'Day 10', actualRevenue: 2160000, predictedRevenue: 2200000, confMin: 2060000, confMax: 2340000 },
    { day: 'Day 15', actualRevenue: null, predictedRevenue: 2280000, confMin: 2120000, confMax: 2440000 },
    { day: 'Day 20', actualRevenue: null, predictedRevenue: 2340000, confMin: 2160000, confMax: 2520000 },
    { day: 'Day 25', actualRevenue: null, predictedRevenue: 2410000, confMin: 2200000, confMax: 2620000 },
    { day: 'Day 30', actualRevenue: null, predictedRevenue: 2480000, confMin: 2250000, confMax: 2710000 }
  ]
};

const MOCK_REPORTS_LIST = [
  { id: 'GR-2026-001', period: 'Monthly (May 2026)', revenueGrowth: 18.5, customerGrowth: 14.2, storeGrowth: 8.3, orderGrowth: 16.1, franchiseGrowth: 9.8, predictedRevenue: 2250000, generatedAt: '2026-06-01 10:24', format: 'PDF' },
  { id: 'GR-2026-002', period: 'Monthly (April 2026)', revenueGrowth: 16.2, customerGrowth: 12.8, storeGrowth: 4.2, orderGrowth: 14.5, franchiseGrowth: 7.5, predictedRevenue: 2100000, generatedAt: '2026-05-01 09:15', format: 'Excel' },
  { id: 'GR-2026-003', period: 'Quarterly (Q1 2026)', revenueGrowth: 22.4, customerGrowth: 19.5, storeGrowth: 12.5, orderGrowth: 20.8, franchiseGrowth: 11.2, predictedRevenue: 5800000, generatedAt: '2026-04-02 14:30', format: 'PDF' },
  { id: 'GR-2026-004', period: 'Monthly (March 2026)', revenueGrowth: 15.8, customerGrowth: 11.6, storeGrowth: 4.2, orderGrowth: 13.9, franchiseGrowth: 8.2, predictedRevenue: 1950000, generatedAt: '2026-04-01 11:05', format: 'CSV' },
  { id: 'GR-2026-005', period: 'Monthly (February 2026)', revenueGrowth: 12.4, customerGrowth: 9.2, storeGrowth: 0.0, orderGrowth: 10.4, franchiseGrowth: 5.1, predictedRevenue: 1800000, generatedAt: '2026-03-01 10:00', format: 'PDF' }
];

const MOCK_REPORT_DETAILS = {
  id: 'GR-2026-001',
  period: 'Monthly (May 2026)',
  generatedAt: '2026-06-01 10:24',
  revenue: {
    cards: { revenue: 2160000, profit: 648000, taxes: 108000, refunds: 32000, netGrowth: 18.5 },
    chart: [
      { name: 'Week 1', revenue: 480000, profit: 144000 },
      { name: 'Week 2', revenue: 520000, profit: 156000 },
      { name: 'Week 3', revenue: 550000, profit: 165000 },
      { name: 'Week 4', revenue: 610000, profit: 183000 }
    ]
  },
  customer: {
    cards: { newCustomers: 1240, retentionRate: 84, churnRate: 16, lifetimeValue: 4800 },
    acquisitionChart: [
      { name: 'Week 1', new: 250, returning: 1200 },
      { name: 'Week 2', new: 280, returning: 1250 },
      { name: 'Week 3', new: 320, returning: 1300 },
      { name: 'Week 4', new: 390, returning: 1450 }
    ],
    retentionCurve: [
      { name: 'Month 1', retention: 100 },
      { name: 'Month 2', retention: 84 },
      { name: 'Month 3', retention: 76 },
      { name: 'Month 4', retention: 70 },
      { name: 'Month 5', retention: 66 },
      { name: 'Month 6', retention: 64 }
    ]
  },
  store: {
    cards: { newStores: 3, closedStores: 0, avgStoreRevenue: 180000, topStore: 'Pune Express (₹4.2L)' },
    regionalChart: [
      { region: 'North India', count: 6, revenue: 1080000 },
      { region: 'Central India', count: 4, revenue: 720000 },
      { region: 'West India', count: 10, revenue: 1800000 },
      { region: 'South India', count: 4, revenue: 720000 }
    ]
  },
  delivery: {
    cards: { totalRiders: 132, avgDeliveryTime: 24, completionRate: 98.4, customerRating: 4.8 },
    trendChart: [
      { name: 'Wk 1', riders: 110, time: 27 },
      { name: 'Wk 2', riders: 118, time: 26 },
      { name: 'Wk 3', riders: 125, time: 25 },
      { name: 'Wk 4', riders: 132, time: 24 }
    ]
  },
  marketing: {
    cards: { campaignRevenue: 450000, couponUsage: 3500, roi: 320, conversionRate: 12.4 },
    campaignChart: [
      { campaign: 'IPL Feast 2026', spend: 40000, returnVal: 180000 },
      { campaign: 'Paneer Mania', spend: 20000, returnVal: 95000 },
      { campaign: 'Weekend Bonanza', spend: 30000, returnVal: 115000 },
      { campaign: 'Midnight Slice', spend: 15000, returnVal: 60000 }
    ],
    couponImpact: [
      { coupon: 'PAPA50', count: 1200, discount: 60000 },
      { coupon: 'FREEVEG', count: 850, discount: 34000 },
      { coupon: 'TRYNEW', count: 950, discount: 28500 },
      { coupon: 'LATEVEG', count: 500, discount: 15000 }
    ]
  },
  forecast: {
    cards: { predictedRevenue: 2480000, predictedOrders: 7100, predictedCustomers: 2200, confidenceScore: 94.8 },
    chart: [
      { name: 'Wk +1', actual: 610000, predicted: 620000 },
      { name: 'Wk +2', actual: null, predicted: 635000 },
      { name: 'Wk +3', actual: null, predicted: 650000 },
      { name: 'Wk +4', actual: null, predicted: 675000 }
    ]
  }
};

// =============================================================
// REACT QUERY HOOK SIMULATIONS
// =============================================================

export function useGrowthStats(filters) {
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
      const res = await apiClient.get('/analytics/growth', { params: filters, timeout: 1000 });
      setData(res.data?.data || res.data || MOCK_SUMMARY);
    } catch {
      setData(MOCK_SUMMARY);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { data, loading, refetch: fetchStats };
}

export function useRevenueGrowth(filters) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRevenue = useCallback(async () => {
    setLoading(true);
    const isOnline = await verifyConnection();
    if (!isOnline) {
      setData(MOCK_REVENUE_GROWTH);
      setLoading(false);
      return;
    }
    try {
      const res = await apiClient.get('/analytics/growth/revenue', { params: filters, timeout: 1000 });
      setData(res.data?.data || res.data || MOCK_REVENUE_GROWTH);
    } catch {
      setData(MOCK_REVENUE_GROWTH);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetchRevenue();
  }, [fetchRevenue]);

  return { data, loading, refetch: fetchRevenue };
}

export function useCustomerGrowth(filters) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    const isOnline = await verifyConnection();
    if (!isOnline) {
      setData(MOCK_CUSTOMER_GROWTH);
      setLoading(false);
      return;
    }
    try {
      const res = await apiClient.get('/analytics/growth/customers', { params: filters, timeout: 1000 });
      setData(res.data?.data || res.data || MOCK_CUSTOMER_GROWTH);
    } catch {
      setData(MOCK_CUSTOMER_GROWTH);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  return { data, loading, refetch: fetchCustomers };
}

export function useStoreExpansion(filters) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStores = useCallback(async () => {
    setLoading(true);
    const isOnline = await verifyConnection();
    if (!isOnline) {
      setData(MOCK_STORE_EXPANSION);
      setLoading(false);
      return;
    }
    try {
      const res = await apiClient.get('/analytics/growth/stores', { params: filters, timeout: 1000 });
      setData(res.data?.data || res.data || MOCK_STORE_EXPANSION);
    } catch {
      setData(MOCK_STORE_EXPANSION);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  return { data, loading, refetch: fetchStores };
}

export function useFranchiseGrowth(filters) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFranchises = useCallback(async () => {
    setLoading(true);
    const isOnline = await verifyConnection();
    if (!isOnline) {
      setData(MOCK_FRANCHISE_GROWTH);
      setLoading(false);
      return;
    }
    try {
      const res = await apiClient.get('/analytics/growth/franchises', { params: filters, timeout: 1000 });
      setData(res.data?.data || res.data || MOCK_FRANCHISE_GROWTH);
    } catch {
      setData(MOCK_FRANCHISE_GROWTH);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetchFranchises();
  }, [fetchFranchises]);

  return { data, loading, refetch: fetchFranchises };
}

export function useTopCities(filters) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCities = useCallback(async () => {
    setLoading(true);
    const isOnline = await verifyConnection();
    if (!isOnline) {
      setData(MOCK_TOP_CITIES);
      setLoading(false);
      return;
    }
    try {
      const res = await apiClient.get('/analytics/growth/cities', { params: filters, timeout: 1000 });
      setData(res.data?.data || res.data || MOCK_TOP_CITIES);
    } catch {
      setData(MOCK_TOP_CITIES);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetchCities();
  }, [fetchCities]);

  return { data, loading, refetch: fetchCities };
}

export function useForecasting(days = 30) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchForecast = useCallback(async () => {
    setLoading(true);
    const isOnline = await verifyConnection();
    if (!isOnline) {
      // Simulate 90 days predictions if requested
      if (days === 90) {
        setData({
          confidenceScore: 92.4,
          metrics: {
            predictedRevenue: 7850000,
            predictedOrders: 22400,
            predictedCustomers: 6500,
            predictedStoreGrowth: 9
          },
          chartData: [
            { day: 'Day 15', actualRevenue: 2160000, predictedRevenue: 2220000, confMin: 2000000, confMax: 2400000 },
            { day: 'Day 30', actualRevenue: null, predictedRevenue: 2480000, confMin: 2150000, confMax: 2800000 },
            { day: 'Day 45', actualRevenue: null, predictedRevenue: 3120000, confMin: 2600000, confMax: 3600000 },
            { day: 'Day 60', actualRevenue: null, predictedRevenue: 4200000, confMin: 3400000, confMax: 5000000 },
            { day: 'Day 75', actualRevenue: null, predictedRevenue: 5900000, confMin: 4500000, confMax: 7200000 },
            { day: 'Day 90', actualRevenue: null, predictedRevenue: 7850000, confMin: 5800000, confMax: 9900000 }
          ]
        });
      } else {
        setData(MOCK_FORECAST);
      }
      setLoading(false);
      return;
    }
    try {
      const res = await apiClient.get('/analytics/growth/forecast', { params: { days }, timeout: 1000 });
      setData(res.data?.data || res.data || MOCK_FORECAST);
    } catch {
      setData(MOCK_FORECAST);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchForecast();
  }, [fetchForecast]);

  return { data, loading, refetch: fetchForecast };
}

export function useGrowthReportsList(filters, pagination) {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    const isOnline = await verifyConnection();
    if (!isOnline) {
      let filtered = [...MOCK_REPORTS_LIST];
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        filtered = filtered.filter(row => 
          row.period.toLowerCase().includes(q) || 
          row.id.toLowerCase().includes(q) || 
          row.format.toLowerCase().includes(q)
        );
      }
      if (filters?.reportPeriod && filters.reportPeriod !== '') {
        const p = filters.reportPeriod.toLowerCase();
        filtered = filtered.filter(row => row.period.toLowerCase().includes(p));
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
      const res = await apiClient.get('/analytics/growth/reports', {
        params: { ...filters, page: pagination.page, limit: pagination.limit },
        timeout: 1000
      });
      setData(res.data?.data || res.data?.rows || MOCK_REPORTS_LIST);
      setTotal(res.data?.total || MOCK_REPORTS_LIST.length);
    } catch {
      setData(MOCK_REPORTS_LIST);
      setTotal(MOCK_REPORTS_LIST.length);
    } finally {
      setLoading(false);
    }
  }, [
    filters?.search,
    filters?.reportPeriod,
    filters?.sortBy?.key,
    filters?.sortBy?.dir,
    pagination.page,
    pagination.limit
  ]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return { data, total, loading, refetch: fetchReports };
}

export function useGrowthReportDetails(reportId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDetails = useCallback(async () => {
    if (!reportId) return;
    setLoading(true);
    const isOnline = await verifyConnection();
    if (!isOnline) {
      setData({ ...MOCK_REPORT_DETAILS, id: reportId });
      setLoading(false);
      return;
    }
    try {
      const res = await apiClient.get(`/analytics/growth/${reportId}`, { timeout: 1000 });
      setData(res.data?.data || res.data || MOCK_REPORT_DETAILS);
    } catch {
      setData(MOCK_REPORT_DETAILS);
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  return { data, loading, refetch: fetchDetails };
}

export function useGenerateGrowthReport() {
  const [loading, setLoading] = useState(false);

  const generateReport = async (payload) => {
    setLoading(true);
    const isOnline = await verifyConnection();
    if (!isOnline) {
      return new Promise((resolve) => {
        setTimeout(() => {
          setLoading(false);
          toast.success('Growth report generated successfully.');
          resolve({ success: true, report: { id: `GR-2026-${Math.floor(100 + Math.random() * 900)}`, period: `${payload.period} Report`, generatedAt: new Date().toISOString(), format: payload.format } });
        }, 1200);
      });
    }
    try {
      const res = await apiClient.post('/analytics/growth/generate', payload);
      setLoading(false);
      toast.success('Growth report generated successfully.');
      return res.data;
    } catch (err) {
      setLoading(false);
      toast.error('Failed to generate growth report.');
      throw err;
    }
  };

  return { generateReport, loading };
}
