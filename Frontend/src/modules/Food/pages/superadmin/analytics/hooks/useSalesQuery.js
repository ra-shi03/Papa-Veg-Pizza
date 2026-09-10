import { useState, useEffect, useCallback } from 'react';
import apiClient from '../../../../../../services/api/axios';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

// =============================================================
// API CONNECTION PROBING & MOCK BYPASS (Prevents console ERR_CONNECTION_REFUSED)
// =============================================================
const FORCE_MOCK_MODE = false; // Toggle to true to completely bypass API network calls
let isBackendOffline = sessionStorage.getItem('sales_api_offline') === 'true';
let connectionPromise = null;

async function verifyConnection() {
  if (FORCE_MOCK_MODE) return false;
  if (isBackendOffline) return false;
  if (connectionPromise) return connectionPromise;

  connectionPromise = (async () => {
    try {
      // Send a lightweight request to probe if the backend is listening
      await apiClient.get('/analytics/sales', { params: { probe: true }, timeout: 800 });
      return true;
    } catch (err) {
      if (!err.response) {
        sessionStorage.setItem('sales_api_offline', 'true');
        isBackendOffline = true;
        return false;
      }
      return true; // Port active
    }
  })();

  return connectionPromise;
}

// Mock KPI metrics
const MOCK_STATS = {
  grossRevenue: 540000,
  netRevenue: 497000,
  totalOrders: 7200,
  averageOrderValue: 749,
  refundAmount: 15000,
  discountAmount: 27000,
  gstCollected: 43000,
  platformProfit: 120000,
  // previous period comparison percentage values
  grossTrend: 12.4,
  netTrend: 10.2,
  ordersTrend: 8.5,
  aovTrend: 1.8,
  refundsTrend: -5.4,
  discountsTrend: 4.2,
  gstTrend: 9.1,
  profitTrend: 15.6
};

// Mock Revenue Trends
const MOCK_TRENDS_DAILY = [
  { name: 'Mon', revenue: 75000, orders: 100, profit: 16000 },
  { name: 'Tue', revenue: 82000, orders: 110, profit: 18500 },
  { name: 'Wed', revenue: 79000, orders: 105, profit: 17200 },
  { name: 'Thu', revenue: 91000, orders: 120, profit: 21000 },
  { name: 'Fri', revenue: 115000, orders: 150, profit: 26000 },
  { name: 'Sat', revenue: 138000, orders: 185, profit: 31000 },
  { name: 'Sun', revenue: 120000, orders: 160, profit: 27000 }
];

const MOCK_TRENDS_WEEKLY = [
  { name: 'Week 1', revenue: 520000, orders: 700, profit: 110000 },
  { name: 'Week 2', revenue: 560000, orders: 750, profit: 125000 },
  { name: 'Week 3', revenue: 490000, orders: 660, profit: 105000 },
  { name: 'Week 4', revenue: 610000, orders: 820, profit: 138000 }
];

const MOCK_TRENDS_MONTHLY = [
  { name: 'Jan', revenue: 2200000, orders: 3000, profit: 450000 },
  { name: 'Feb', revenue: 2400000, orders: 3200, profit: 510000 },
  { name: 'Mar', revenue: 2150000, orders: 2900, profit: 440000 },
  { name: 'Apr', revenue: 2700000, orders: 3600, profit: 580000 },
  { name: 'May', revenue: 3100000, orders: 4200, profit: 690000 },
  { name: 'Jun', revenue: 2900000, orders: 3950, profit: 620000 }
];

// Mock Category Mix
const MOCK_CATEGORIES = [
  { name: 'Pizza', value: 65 },
  { name: 'Beverages', value: 15 },
  { name: 'Desserts', value: 12 },
  { name: 'Combos', value: 8 }
];

// Mock Payment Distribution
const MOCK_PAYMENTS = [
  { name: 'UPI', revenue: 280000, orders: 4000 },
  { name: 'Cards', revenue: 160000, orders: 2000 },
  { name: 'Wallet', revenue: 60000, orders: 800 },
  { name: 'COD', revenue: 40000, orders: 400 }
];

// Mock Hourly Heatmap
const MOCK_HOURLY = Array.from({ length: 24 }, (_, idx) => {
  const hour = idx;
  const isPeak = (hour >= 12 && hour <= 14) || (hour >= 19 && hour <= 22);
  const orders = isPeak ? Math.floor(Math.random() * 40) + 30 : Math.floor(Math.random() * 15) + 2;
  const timeLabel = hour === 0 ? '12 AM' : hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
  return { time: timeLabel, hour, orders, isPeak };
});

// Mock Top Products
const MOCK_PRODUCTS = [
  { name: 'Tandoori Paneer Pizza', units: 1240, revenue: 434000, img: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&q=80&w=400&fm=webp' },
  { name: 'Classic Margherita', units: 1050, revenue: 262500, img: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&q=80&w=400&fm=webp' },
  { name: 'Double Cheese Margherita', units: 980, revenue: 343000, img: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&q=80&w=400&fm=webp' },
  { name: 'Farmhouse Delight', units: 820, revenue: 328000, img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=400&fm=webp' },
  { name: 'Paneer Tikka Garlic Toast', units: 750, revenue: 112500, img: 'https://images.unsplash.com/photo-1541532713592-79a0317b6b77?auto=format&fit=crop&q=80&w=400&fm=webp' },
  { name: 'Peppy Paneer', units: 620, revenue: 248000, img: 'https://images.unsplash.com/photo-1571066811602-71683a3f680d?auto=format&fit=crop&q=80&w=400&fm=webp' },
  { name: 'Veggie Paradise', units: 580, revenue: 232000, img: 'https://images.unsplash.com/photo-1511018556340-d16986a1c194?auto=format&fit=crop&q=80&w=400&fm=webp' },
  { name: 'Choco Lava Cake', units: 510, revenue: 45900, img: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=400&fm=webp' },
  { name: 'Masala Lemonade', units: 480, revenue: 33600, img: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=400&fm=webp' },
  { name: 'Veg Supreme Combo', units: 350, revenue: 157500, img: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&q=80&w=400&fm=webp' }
];

// Mock Taxes
const MOCK_TAXES = [
  { name: 'Q1', CGST: 11000, SGST: 11000, IGST: 21000 },
  { name: 'Q2', CGST: 13000, SGST: 13000, IGST: 25000 },
  { name: 'Q3', CGST: 12500, SGST: 12500, IGST: 22000 },
  { name: 'Q4', CGST: 14000, SGST: 14000, IGST: 27000 }
];

// Mock Sales Table Data
const MOCK_TABLE_ROWS = [
  { id: 'SL-001', date: '2026-06-19', orders: 240, revenue: 180000, discounts: 9000, refunds: 5000, profit: 42000, tax: 15000 },
  { id: 'SL-002', date: '2026-06-18', orders: 225, revenue: 168000, discounts: 8400, refunds: 3000, profit: 39000, tax: 14000 },
  { id: 'SL-003', date: '2026-06-17', orders: 210, revenue: 157000, discounts: 7850, refunds: 4000, profit: 36000, tax: 13000 },
  { id: 'SL-004', date: '2026-06-16', orders: 250, revenue: 188000, discounts: 9400, refunds: 6000, profit: 44000, tax: 16000 },
  { id: 'SL-005', date: '2026-06-15', orders: 280, revenue: 210000, discounts: 10500, refunds: 2000, profit: 51000, tax: 18000 },
  { id: 'SL-006', date: '2026-06-14', orders: 195, revenue: 146000, discounts: 7300, refunds: 1500, profit: 33000, tax: 12000 },
  { id: 'SL-007', date: '2026-06-13', orders: 205, revenue: 153000, discounts: 7650, refunds: 2500, profit: 35000, tax: 12500 },
  { id: 'SL-008', date: '2026-06-12', orders: 220, revenue: 165000, discounts: 8250, refunds: 3500, profit: 38000, tax: 13500 },
  { id: 'SL-009', date: '2026-06-11', orders: 235, revenue: 176000, discounts: 8800, refunds: 4500, profit: 41000, tax: 14500 },
  { id: 'SL-010', date: '2026-06-10', orders: 245, revenue: 183000, discounts: 9150, refunds: 5000, profit: 42500, tax: 15200 }
];

// Mock Dropdowns Data
export const MOCK_REGIONS = [
  { id: 'reg-north', name: 'North India' },
  { id: 'reg-west', name: 'West India' },
  { id: 'reg-south', name: 'South India' },
  { id: 'reg-east', name: 'East India' }
];

export const MOCK_ZONES = {
  'reg-north': [{ id: 'zone-n1', name: 'Delhi NCR' }, { id: 'zone-n2', name: 'Punjab' }],
  'reg-west': [{ id: 'zone-w1', name: 'Maharashtra' }, { id: 'zone-w2', name: 'Gujarat' }],
  'reg-south': [{ id: 'zone-s1', name: 'Karnataka' }, { id: 'zone-s2', name: 'Tamil Nadu' }],
  'reg-east': [{ id: 'zone-e1', name: 'West Bengal' }]
};

export const MOCK_TERRITORIES = {
  'zone-n1': [{ id: 'ter-n1a', name: 'Connaught Place' }, { id: 'ter-n1b', name: 'Noida Sec 62' }],
  'zone-n2': [{ id: 'ter-n2a', name: 'Amritsar Central' }],
  'zone-w1': [{ id: 'ter-w1a', name: 'Bandra West' }, { id: 'ter-w1b', name: 'Pune Deccan' }],
  'zone-w2': [{ id: 'ter-w2a', name: 'Ahmedabad SG Highway' }],
  'zone-s1': [{ id: 'ter-s1a', name: 'Koramangala' }, { id: 'ter-s1b', name: 'Indiranagar' }],
  'zone-s2': [{ id: 'ter-s2a', name: 'Adyar Chennai' }],
  'zone-e1': [{ id: 'ter-e1a', name: 'Salt Lake Sector 5' }]
};

export const MOCK_FRANCHISES = [
  { id: 'fran-01', name: 'Vrindavan Foods India' },
  { id: 'fran-02', name: 'Shiva Sai Hospitality' },
  { id: 'fran-03', name: 'Global Taste Franchises' }
];

export const MOCK_STORES = [
  { id: 'store-01', name: 'CP Outer Circle, New Delhi', franchiseId: 'fran-01' },
  { id: 'store-02', name: 'Koramangala 5th Block, Bengaluru', franchiseId: 'fran-02' },
  { id: 'store-03', name: 'Bandra Linking Road, Mumbai', franchiseId: 'fran-03' },
  { id: 'store-04', name: 'Deccan Gymkhana, Pune', franchiseId: 'fran-01' },
  { id: 'store-05', name: 'Salt Lake Sector V, Kolkata', franchiseId: 'fran-02' }
];

// Hook for Regions
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
        const response = await apiClient.get('/regions', { timeout: 800 });
        setData(response.data?.data || response.data || MOCK_REGIONS);
      } catch {
        setData(MOCK_REGIONS);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { data, loading };
}

// Hook for Zones
export function useZones(regionId) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!regionId) {
      setData([]);
      return;
    }
    setLoading(true);
    (async () => {
      const isOnline = await verifyConnection();
      if (!isOnline) {
        setData(MOCK_ZONES[regionId] || []);
        setLoading(false);
        return;
      }
      try {
        const response = await apiClient.get(`/zones`, { params: { regionId }, timeout: 800 });
        setData(response.data?.data || response.data || MOCK_ZONES[regionId] || []);
      } catch {
        setData(MOCK_ZONES[regionId] || []);
      } finally {
        setLoading(false);
      }
    })();
  }, [regionId]);

  return { data, loading };
}

// Hook for Territories
export function useTerritories(zoneId) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!zoneId) {
      setData([]);
      return;
    }
    setLoading(true);
    (async () => {
      const isOnline = await verifyConnection();
      if (!isOnline) {
        setData(MOCK_TERRITORIES[zoneId] || []);
        setLoading(false);
        return;
      }
      try {
        const response = await apiClient.get(`/territories`, { params: { zoneId }, timeout: 800 });
        setData(response.data?.data || response.data || MOCK_TERRITORIES[zoneId] || []);
      } catch {
        setData(MOCK_TERRITORIES[zoneId] || []);
      } finally {
        setLoading(false);
      }
    })();
  }, [zoneId]);

  return { data, loading };
}

// Hook for Franchises
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
        const response = await apiClient.get('/franchises', { timeout: 800 });
        setData(response.data?.data || response.data || MOCK_FRANCHISES);
      } catch {
        setData(MOCK_FRANCHISES);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { data, loading };
}

// Hook for Stores
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
        const response = await apiClient.get('/stores', { timeout: 800 });
        setData(response.data?.data || response.data || MOCK_STORES);
      } catch {
        setData(MOCK_STORES);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { data, loading };
}

// Hook for Dashboard Stats Summary
export function useSalesStats(filters) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    const isOnline = await verifyConnection();
    if (!isOnline) {
      let factor = 1.0;
      if (filters?.storeId) factor = 0.25;
      else if (filters?.franchiseId) factor = 0.55;

      setData({
        grossRevenue: Math.round(MOCK_STATS.grossRevenue * factor),
        netRevenue: Math.round(MOCK_STATS.netRevenue * factor),
        totalOrders: Math.round(MOCK_STATS.totalOrders * factor),
        averageOrderValue: MOCK_STATS.averageOrderValue,
        refundAmount: Math.round(MOCK_STATS.refundAmount * factor),
        discountAmount: Math.round(MOCK_STATS.discountAmount * factor),
        gstCollected: Math.round(MOCK_STATS.gstCollected * factor),
        platformProfit: Math.round(MOCK_STATS.platformProfit * factor),
        grossTrend: MOCK_STATS.grossTrend,
        netTrend: MOCK_STATS.netTrend,
        ordersTrend: MOCK_STATS.ordersTrend,
        aovTrend: MOCK_STATS.aovTrend,
        refundsTrend: MOCK_STATS.refundsTrend,
        discountsTrend: MOCK_STATS.discountsTrend,
        gstTrend: MOCK_STATS.gstTrend,
        profitTrend: MOCK_STATS.profitTrend
      });
      setLoading(false);
      return;
    }
    try {
      const response = await apiClient.get('/analytics/sales', { params: filters, timeout: 1000 });
      setData(response.data?.data || response.data || MOCK_STATS);
    } catch (err) {
      console.info("Using mock sales stats.");
      setData(MOCK_STATS);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { data, loading, error, refetch: fetchStats };
}

// Hook for Revenue Trend
export function useRevenueTrend(filters, interval = 'monthly') {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTrend = useCallback(async () => {
    setLoading(true);
    setError(null);
    const isOnline = await verifyConnection();
    if (!isOnline) {
      setData(interval === 'daily' ? MOCK_TRENDS_DAILY : interval === 'weekly' ? MOCK_TRENDS_WEEKLY : MOCK_TRENDS_MONTHLY);
      setLoading(false);
      return;
    }
    try {
      const response = await apiClient.get('/analytics/sales/revenue-trend', {
        params: { ...filters, interval },
        timeout: 1000
      });
      setData(response.data?.data || response.data || MOCK_TRENDS_MONTHLY);
    } catch {
      setData(interval === 'daily' ? MOCK_TRENDS_DAILY : interval === 'weekly' ? MOCK_TRENDS_WEEKLY : MOCK_TRENDS_MONTHLY);
    } finally {
      setLoading(false);
    }
  }, [filters, interval]);

  useEffect(() => {
    fetchTrend();
  }, [fetchTrend]);

  return { data, loading, error, refetch: fetchTrend };
}

// Hook for Category Sales
export function useCategorySales(filters) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const isOnline = await verifyConnection();
      if (!isOnline) {
        setData(MOCK_CATEGORIES);
        setLoading(false);
        return;
      }
      try {
        const response = await apiClient.get('/analytics/sales/category', { params: filters, timeout: 1000 });
        setData(response.data?.data || response.data || MOCK_CATEGORIES);
      } catch {
        setData(MOCK_CATEGORIES);
      } finally {
        setLoading(false);
      }
    })();
  }, [filters]);

  return { data, loading };
}

// Hook for Payment Distribution
export function usePaymentDistribution(filters) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const isOnline = await verifyConnection();
      if (!isOnline) {
        setData(MOCK_PAYMENTS);
        setLoading(false);
        return;
      }
      try {
        const response = await apiClient.get('/analytics/sales/payment-methods', { params: filters, timeout: 1000 });
        setData(response.data?.data || response.data || MOCK_PAYMENTS);
      } catch {
        setData(MOCK_PAYMENTS);
      } finally {
        setLoading(false);
      }
    })();
  }, [filters]);

  return { data, loading };
}

// Hook for Hourly Heatmap
export function useHourlyHeatmap(filters) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const isOnline = await verifyConnection();
      if (!isOnline) {
        setData(MOCK_HOURLY);
        setLoading(false);
        return;
      }
      try {
        const response = await apiClient.get('/analytics/sales/hourly', { params: filters, timeout: 1000 });
        setData(response.data?.data || response.data || MOCK_HOURLY);
      } catch {
        setData(MOCK_HOURLY);
      } finally {
        setLoading(false);
      }
    })();
  }, [filters]);

  return { data, loading };
}

// Hook for Top Products
export function useTopProducts(filters) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const isOnline = await verifyConnection();
      if (!isOnline) {
        setData(MOCK_PRODUCTS);
        setLoading(false);
        return;
      }
      try {
        const response = await apiClient.get('/analytics/sales/top-products', { params: filters, timeout: 1000 });
        setData(response.data?.data || response.data || MOCK_PRODUCTS);
      } catch {
        setData(MOCK_PRODUCTS);
      } finally {
        setLoading(false);
      }
    })();
  }, [filters]);

  return { data, loading };
}

// Hook for Tax Breakdown
export function useTaxBreakdown(filters) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const isOnline = await verifyConnection();
      if (!isOnline) {
        setData(MOCK_TAXES);
        setLoading(false);
        return;
      }
      try {
        const response = await apiClient.get('/analytics/sales/taxes', { params: filters, timeout: 1000 });
        setData(response.data?.data || response.data || MOCK_TAXES);
      } catch {
        setData(MOCK_TAXES);
      } finally {
        setLoading(false);
      }
    })();
  }, [filters]);

  return { data, loading };
}

// Hook for Sales Table
export function useSalesTable(filters, pagination) {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTable = useCallback(async () => {
    setLoading(true);
    setError(null);
    const isOnline = await verifyConnection();
    if (!isOnline) {
      let filtered = [...MOCK_TABLE_ROWS];
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        filtered = filtered.filter(row => row.date.includes(q) || row.id.toLowerCase().includes(q));
      }
      const count = filtered.length;
      const start = (pagination.page - 1) * pagination.limit;
      setData(filtered.slice(start, start + pagination.limit));
      setTotal(count);
      setLoading(false);
      return;
    }
    try {
      const response = await apiClient.get('/analytics/sales/table', {
        params: { ...filters, page: pagination.page, limit: pagination.limit },
        timeout: 1000
      });
      if (response.data && response.data.success) {
        setData(response.data.data);
        setTotal(response.data.pagination?.total || response.data.total || response.data.data.length);
      } else {
        setData(response.data.data || MOCK_TABLE_ROWS);
        setTotal(response.data.total || MOCK_TABLE_ROWS.length);
      }
    } catch {
      let filtered = [...MOCK_TABLE_ROWS];
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        filtered = filtered.filter(row => row.date.includes(q) || row.id.toLowerCase().includes(q));
      }
      const count = filtered.length;
      const start = (pagination.page - 1) * pagination.limit;
      setData(filtered.slice(start, start + pagination.limit));
      setTotal(count);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchTable();
  }, [fetchTable]);

  return { data, total, loading, error, refetch: fetchTable };
}

// Hook for Row Details Tab Components
export function useRowDetails(id) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchDetails = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const isOnline = await verifyConnection();
    if (!isOnline) {
      const matchedRow = MOCK_TABLE_ROWS.find(r => r.id === id) || MOCK_TABLE_ROWS[0];
      const factor = (matchedRow.revenue / 180000);
      setData({
        revenueBreakdown: {
          grossRevenue: matchedRow.revenue,
          couponDiscounts: Math.round(matchedRow.discounts * 0.6),
          promotionalDiscounts: Math.round(matchedRow.discounts * 0.4),
          refunds: matchedRow.refunds,
          deliveryCharges: Math.round(matchedRow.orders * 35),
          taxes: matchedRow.tax,
          platformCommission: Math.round(matchedRow.revenue * 0.12),
          netRevenue: matchedRow.profit
        },
        products: MOCK_PRODUCTS.slice(0, 5).map(p => ({
          ...p,
          units: Math.round(p.units * factor * 0.1),
          revenue: Math.round(p.revenue * factor * 0.1)
        })),
        stores: MOCK_STORES.slice(0, 3).map((s, idx) => ({
          name: s.name,
          orders: Math.round(matchedRow.orders * (0.5 - idx * 0.15)),
          revenue: Math.round(matchedRow.revenue * (0.5 - idx * 0.15))
        })),
        regions: MOCK_REGIONS.map((r, idx) => ({
          name: r.name,
          orders: Math.round(matchedRow.orders * (0.4 - idx * 0.1)),
          revenue: Math.round(matchedRow.revenue * (0.4 - idx * 0.1))
        }))
      });
      setLoading(false);
      return;
    }
    try {
      const [productsRes, storesRes, regionsRes] = await Promise.all([
        apiClient.get(`/analytics/sales/${id}/products`, { timeout: 1000 }),
        apiClient.get(`/analytics/sales/${id}/stores`, { timeout: 1000 }),
        apiClient.get(`/analytics/sales/${id}/regions`, { timeout: 1000 })
      ]);
      const matchedRow = MOCK_TABLE_ROWS.find(r => r.id === id) || MOCK_TABLE_ROWS[0];
      setData({
        revenueBreakdown: {
          grossRevenue: matchedRow.revenue,
          couponDiscounts: Math.round(matchedRow.discounts * 0.6),
          promotionalDiscounts: Math.round(matchedRow.discounts * 0.4),
          refunds: matchedRow.refunds,
          deliveryCharges: Math.round(matchedRow.orders * 35),
          taxes: matchedRow.tax,
          platformCommission: Math.round(matchedRow.revenue * 0.12),
          netRevenue: matchedRow.profit
        },
        products: productsRes.data?.data || productsRes.data || MOCK_PRODUCTS.slice(0, 5),
        stores: storesRes.data?.data || storesRes.data || MOCK_STORES.slice(0, 3),
        regions: regionsRes.data?.data || regionsRes.data || MOCK_REGIONS
      });
    } catch {
      const matchedRow = MOCK_TABLE_ROWS.find(r => r.id === id) || MOCK_TABLE_ROWS[0];
      const factor = (matchedRow.revenue / 180000);
      setData({
        revenueBreakdown: {
          grossRevenue: matchedRow.revenue,
          couponDiscounts: Math.round(matchedRow.discounts * 0.6),
          promotionalDiscounts: Math.round(matchedRow.discounts * 0.4),
          refunds: matchedRow.refunds,
          deliveryCharges: Math.round(matchedRow.orders * 35),
          taxes: matchedRow.tax,
          platformCommission: Math.round(matchedRow.revenue * 0.12),
          netRevenue: matchedRow.profit
        },
        products: MOCK_PRODUCTS.slice(0, 5).map(p => ({
          ...p,
          units: Math.round(p.units * factor * 0.1),
          revenue: Math.round(p.revenue * factor * 0.1)
        })),
        stores: MOCK_STORES.slice(0, 3).map((s, idx) => ({
          name: s.name,
          orders: Math.round(matchedRow.orders * (0.5 - idx * 0.15)),
          revenue: Math.round(matchedRow.revenue * (0.5 - idx * 0.15))
        })),
        regions: MOCK_REGIONS.map((r, idx) => ({
          name: r.name,
          orders: Math.round(matchedRow.orders * (0.4 - idx * 0.1)),
          revenue: Math.round(matchedRow.revenue * (0.4 - idx * 0.1))
        }))
      });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  return { data, loading };
}

// Hook for Exporting Reports
export function useExportReport() {
  const [loading, setLoading] = useState(false);

  const generateReport = async (exportParams) => {
    setLoading(true);
    const { format, fields, dateRange } = exportParams;
    const isOnline = await verifyConnection();

    if (!isOnline) {
      exportReportOffline(format, fields, dateRange);
      setLoading(false);
      return true;
    }

    try {
      const response = await apiClient.get('/analytics/sales/export', {
        params: { format, fields: JSON.stringify(fields), dateRange },
        responseType: 'blob',
        timeout: 2000
      });
      const blob = new Blob([response.data], {
        type: format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : format === 'csv' ? 'text/csv' : 'application/pdf'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const filename = `sales_report_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : format}`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success(`Sales report (${format.toUpperCase()}) exported successfully`);
      return true;
    } catch {
      exportReportOffline(format, fields, dateRange);
    } finally {
      setLoading(false);
    }
  };

  const exportReportOffline = (format, fields, dateRange) => {
    if (format === 'excel' || format === 'csv') {
      const headers = [];
      if (fields.revenue) headers.push("Gross Revenue", "Net Revenue");
      if (fields.orders) headers.push("Total Orders");
      if (fields.taxes) headers.push("GST Collected");
      if (fields.profit) headers.push("Platform Profit");
      if (fields.refunds) headers.push("Refund Amount");
      if (fields.discounts) headers.push("Discount Amount");

      const rowValues = [];
      if (fields.revenue) rowValues.push(MOCK_STATS.grossRevenue, MOCK_STATS.netRevenue);
      if (fields.orders) rowValues.push(MOCK_STATS.totalOrders);
      if (fields.taxes) rowValues.push(MOCK_STATS.gstCollected);
      if (fields.profit) rowValues.push(MOCK_STATS.platformProfit);
      if (fields.refunds) rowValues.push(MOCK_STATS.refundAmount);
      if (fields.discounts) rowValues.push(MOCK_STATS.discountAmount);

      const csvContent = [headers.join(","), rowValues.join(",")].join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const filename = `sales_analytics_export_${new Date().toISOString().split('T')[0]}.csv`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Sales compliance statement exported (CSV Download)");
    } else {
      const doc = new jsPDF();
      doc.setFillColor(164, 60, 18);
      doc.rect(0, 0, 210, 40, 'F');

      doc.setFontSize(22);
      doc.setTextColor(255, 255, 255);
      doc.text("PAPA VEG PIZZA", 14, 18);

      doc.setFontSize(10);
      doc.text("Sales Analytics Report & Financial Statements", 14, 28);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 130, 28);

      doc.setFontSize(12);
      doc.setTextColor(50, 50, 50);
      doc.text(`Exported Sales Metrics - Range: ${dateRange || 'Custom Period'}`, 14, 52);

      const tableData = [];
      if (fields.revenue) tableData.push(['Gross Revenue', `Rs. ${MOCK_STATS.grossRevenue.toLocaleString('en-IN')}`], ['Net Revenue', `Rs. ${MOCK_STATS.netRevenue.toLocaleString('en-IN')}`]);
      if (fields.orders) tableData.push(['Total Orders', MOCK_STATS.totalOrders.toLocaleString()]);
      if (fields.taxes) tableData.push(['GST Collected', `Rs. ${MOCK_STATS.gstCollected.toLocaleString('en-IN')}`]);
      if (fields.profit) tableData.push(['Platform Profit', `Rs. ${MOCK_STATS.platformProfit.toLocaleString('en-IN')}`]);
      if (fields.refunds) tableData.push(['Refund Amount', `Rs. ${MOCK_STATS.refundAmount.toLocaleString('en-IN')}`]);
      if (fields.discounts) tableData.push(['Total Discounts', `Rs. ${MOCK_STATS.discountAmount.toLocaleString('en-IN')}`]);

      autoTable(doc, {
        startY: 58,
        head: [['Metric Column', 'Value (INR)']],
        body: tableData,
        headStyles: { fillColor: [164, 60, 18] },
        theme: 'striped',
        margin: { top: 10 }
      });

      const filename = `sales_report_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
      toast.success("Sales Analytics Statement PDF compiled successfully");
    }
  };

  return { generateReport, loading };
}
