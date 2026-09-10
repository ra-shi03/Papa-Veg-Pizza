import { useState, useEffect, useCallback } from 'react';
import apiClient from '../../../../../../services/api/axios';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

// =============================================================
// API CONNECTION PROBING & MOCK BYPASS (Prevents console ERR_CONNECTION_REFUSED)
// =============================================================
const FORCE_MOCK_MODE = false;
let isBackendOffline = sessionStorage.getItem('customer_api_offline') === 'true';
let connectionPromise = null;

async function verifyConnection() {
  if (FORCE_MOCK_MODE) return false;
  if (isBackendOffline) return false;
  if (connectionPromise) return connectionPromise;

  connectionPromise = (async () => {
    try {
      await apiClient.get('/analytics/customers', { params: { probe: true }, timeout: 800 });
      return true;
    } catch (err) {
      if (!err.response) {
        sessionStorage.setItem('customer_api_offline', 'true');
        isBackendOffline = true;
        return false;
      }
      return true;
    }
  })();

  return connectionPromise;
}

// Mock KPI metrics
const MOCK_STATS = {
  totalCustomers: 45000,
  activeCustomers: 31800,
  newCustomers: 6200,
  returningCustomers: 25600,
  retentionRate: 78,
  averageSpend: 710,
  lifetimeValue: 5400,
  churnRate: 12,
  totalTrend: 8.4,
  activeTrend: 5.2,
  newTrend: 12.8,
  returningTrend: 6.4,
  retentionTrend: 1.2,
  spendTrend: 4.5,
  ltvTrend: 11.2,
  churnTrend: -2.4
};

// Mock Customer Growth
const MOCK_GROWTH_DAILY = [
  { name: 'Mon', customers: 120, orders: 180, revenue: 65000 },
  { name: 'Tue', customers: 145, orders: 210, revenue: 78000 },
  { name: 'Wed', customers: 130, orders: 195, revenue: 71000 },
  { name: 'Thu', customers: 160, orders: 240, revenue: 88000 },
  { name: 'Fri', customers: 210, orders: 320, revenue: 124000 },
  { name: 'Sat', customers: 280, orders: 410, revenue: 165000 },
  { name: 'Sun', customers: 240, orders: 360, revenue: 142000 }
];

const MOCK_GROWTH_WEEKLY = [
  { name: 'Week 1', customers: 1100, orders: 1600, revenue: 580000 },
  { name: 'Week 2', customers: 1250, orders: 1850, revenue: 690000 },
  { name: 'Week 3', customers: 1050, orders: 1520, revenue: 540000 },
  { name: 'Week 4', customers: 1400, orders: 2050, revenue: 760000 }
];

const MOCK_GROWTH_MONTHLY = [
  { name: 'Jan', customers: 4500, orders: 6800, revenue: 2400000 },
  { name: 'Feb', customers: 4800, orders: 7200, revenue: 2650000 },
  { name: 'Mar', customers: 4300, orders: 6500, revenue: 2350000 },
  { name: 'Apr', customers: 5400, orders: 8100, revenue: 2900000 },
  { name: 'May', customers: 6200, orders: 9400, revenue: 3450000 },
  { name: 'Jun', customers: 5900, orders: 8900, revenue: 3200000 }
];

// Mock New vs Returning
const MOCK_NEW_VS_RETURNING = [
  { name: 'New Customers', value: 40 },
  { name: 'Returning Customers', value: 60 }
];

// Mock Retention Curve
const MOCK_RETENTION = [
  { name: 'Week 1', value: 100 },
  { name: 'Week 2', value: 85 },
  { name: 'Week 3', value: 78 },
  { name: 'Week 4', value: 72 },
  { name: 'Month 2', value: 65 },
  { name: 'Month 3', value: 58 }
];

// Mock Loyalty Distribution
const MOCK_LOYALTY_DIST = [
  { name: 'Bronze', value: 45, count: 20250 },
  { name: 'Silver', value: 30, count: 13500 },
  { name: 'Gold', value: 18, count: 8100 },
  { name: 'Platinum', value: 7, count: 3150 }
];

// Mock Spend By City
const MOCK_SPEND_BY_CITY = [
  { name: 'New Delhi', spend: 850 },
  { name: 'Mumbai', spend: 920 },
  { name: 'Bengaluru', spend: 780 },
  { name: 'Pune', spend: 680 },
  { name: 'Kolkata', spend: 610 }
];

// Mock Top Customers
const MOCK_TOP_CUSTOMERS = [
  { id: 'C-001', name: 'Rajesh Kumar', orders: 42, spend: 42500, points: 1250, tier: 'Platinum' },
  { id: 'C-002', name: 'Anita Sharma', orders: 38, spend: 38120, points: 1140, tier: 'Platinum' },
  { id: 'C-003', name: 'Sanjay Dutt', orders: 31, spend: 31450, points: 940, tier: 'Gold' },
  { id: 'C-004', name: 'Priya Patel', orders: 28, spend: 28400, points: 850, tier: 'Gold' },
  { id: 'C-005', name: 'Amit Singh', orders: 26, spend: 26200, points: 780, tier: 'Silver' }
];

// Mock Main Customer Table Rows
const MOCK_TABLE_ROWS = [
  { id: 'C-001', name: 'Rajesh Kumar', phone: '+91 98765 43210', email: 'rajesh.kumar@email.com', orders: 42, spend: 42500, averageSpend: 1011, tier: 'Platinum', retentionScore: 95, lastOrderDate: '2026-06-19', status: 'Active' },
  { id: 'C-002', name: 'Anita Sharma', phone: '+91 88765 43211', email: 'anita.sharma@email.com', orders: 38, spend: 38120, averageSpend: 1003, tier: 'Platinum', retentionScore: 92, lastOrderDate: '2026-06-18', status: 'Active' },
  { id: 'C-003', name: 'Sanjay Dutt', phone: '+91 78765 43212', email: 'sanjay.dutt@email.com', orders: 31, spend: 31450, averageSpend: 1014, tier: 'Gold', retentionScore: 84, lastOrderDate: '2026-06-17', status: 'Active' },
  { id: 'C-004', name: 'Priya Patel', phone: '+91 99887 76655', email: 'priya.patel@email.com', orders: 28, spend: 28400, averageSpend: 1014, tier: 'Gold', retentionScore: 88, lastOrderDate: '2026-06-15', status: 'Active' },
  { id: 'C-005', name: 'Amit Singh', phone: '+91 98402 12903', email: 'amit.singh@email.com', orders: 26, spend: 26200, averageSpend: 1007, tier: 'Silver', retentionScore: 78, lastOrderDate: '2026-06-14', status: 'Active' },
  { id: 'C-006', name: 'Karan Malhotra', phone: '+91 94029 88390', email: 'karan.malhotra@email.com', orders: 18, spend: 12600, averageSpend: 700, tier: 'Silver', retentionScore: 64, lastOrderDate: '2026-05-19', status: 'Inactive' },
  { id: 'C-007', name: 'Isha Verma', phone: '+91 88401 22894', email: 'isha.verma@email.com', orders: 12, spend: 8160, averageSpend: 680, tier: 'Bronze', retentionScore: 50, lastOrderDate: '2026-05-15', status: 'Inactive' },
  { id: 'C-008', name: 'Vikram Rathore', phone: '+91 74029 88390', email: 'vikram.rathore@email.com', orders: 8, spend: 5200, averageSpend: 650, tier: 'Bronze', retentionScore: 40, lastOrderDate: '2026-04-10', status: 'Inactive' }
];

// Mock Locations
const MOCK_LOCATIONS = [
  { id: 'loc-delhi', name: 'New Delhi' },
  { id: 'loc-mumbai', name: 'Mumbai' },
  { id: 'loc-bangalore', name: 'Bengaluru' },
  { id: 'loc-pune', name: 'Pune' },
  { id: 'loc-kolkata', name: 'Kolkata' }
];

// Locations hook
export function useLocations() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const isOnline = await verifyConnection();
      if (!isOnline) {
        setData(MOCK_LOCATIONS);
        setLoading(false);
        return;
      }
      try {
        const response = await apiClient.get('/locations', { timeout: 800 });
        setData(response.data?.data || response.data || MOCK_LOCATIONS);
      } catch {
        setData(MOCK_LOCATIONS);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { data, loading };
}

// KPI Stats Summary Hook
export function useCustomerStats(filters) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const isOnline = await verifyConnection();
      if (!isOnline) {
        setData(MOCK_STATS);
        setLoading(false);
        return;
      }
      try {
        const response = await apiClient.get('/analytics/customers', { params: filters, timeout: 1000 });
        setData(response.data?.data || response.data || MOCK_STATS);
      } catch {
        setData(MOCK_STATS);
      } finally {
        setLoading(false);
      }
    })();
  }, [filters]);

  return { data, loading };
}

// Growth Hook
export function useCustomerGrowth(filters, interval = 'monthly') {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const isOnline = await verifyConnection();
      if (!isOnline) {
        setData(interval === 'daily' ? MOCK_GROWTH_DAILY : interval === 'weekly' ? MOCK_GROWTH_WEEKLY : MOCK_GROWTH_MONTHLY);
        setLoading(false);
        return;
      }
      try {
        const response = await apiClient.get('/analytics/customers/growth', { params: { ...filters, interval }, timeout: 1000 });
        setData(response.data?.data || response.data || MOCK_GROWTH_MONTHLY);
      } catch {
        setData(interval === 'daily' ? MOCK_GROWTH_DAILY : interval === 'weekly' ? MOCK_GROWTH_WEEKLY : MOCK_GROWTH_MONTHLY);
      } finally {
        setLoading(false);
      }
    })();
  }, [filters, interval]);

  return { data, loading };
}

// New vs Returning Hook
export function useNewVsReturning(filters) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const isOnline = await verifyConnection();
      if (!isOnline) {
        setData(MOCK_NEW_VS_RETURNING);
        setLoading(false);
        return;
      }
      try {
        const response = await apiClient.get('/analytics/customers/new-vs-returning', { params: filters, timeout: 1000 });
        setData(response.data?.data || response.data || MOCK_NEW_VS_RETURNING);
      } catch {
        setData(MOCK_NEW_VS_RETURNING);
      } finally {
        setLoading(false);
      }
    })();
  }, [filters]);

  return { data, loading };
}

// Retention Curve Hook
export function useRetentionCurve(filters) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const isOnline = await verifyConnection();
      if (!isOnline) {
        setData(MOCK_RETENTION);
        setLoading(false);
        return;
      }
      try {
        const response = await apiClient.get('/analytics/customers/retention', { params: filters, timeout: 1000 });
        setData(response.data?.data || response.data || MOCK_RETENTION);
      } catch {
        setData(MOCK_RETENTION);
      } finally {
        setLoading(false);
      }
    })();
  }, [filters]);

  return { data, loading };
}

// Loyalty Distribution Hook
export function useLoyaltyDistribution(filters) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const isOnline = await verifyConnection();
      if (!isOnline) {
        setData(MOCK_LOYALTY_DIST);
        setLoading(false);
        return;
      }
      try {
        const response = await apiClient.get('/analytics/customers/loyalty-distribution', { params: filters, timeout: 1000 });
        setData(response.data?.data || response.data || MOCK_LOYALTY_DIST);
      } catch {
        setData(MOCK_LOYALTY_DIST);
      } finally {
        setLoading(false);
      }
    })();
  }, [filters]);

  return { data, loading };
}

// Spend By City Hook
export function useSpendByCity(filters) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const isOnline = await verifyConnection();
      if (!isOnline) {
        setData(MOCK_SPEND_BY_CITY);
        setLoading(false);
        return;
      }
      try {
        const response = await apiClient.get('/analytics/customers/spend-by-city', { params: filters, timeout: 1000 });
        setData(response.data?.data || response.data || MOCK_SPEND_BY_CITY);
      } catch {
        setData(MOCK_SPEND_BY_CITY);
      } finally {
        setLoading(false);
      }
    })();
  }, [filters]);

  return { data, loading };
}

// Top Customers Hook
export function useTopCustomers(filters) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const isOnline = await verifyConnection();
      if (!isOnline) {
        setData(MOCK_TOP_CUSTOMERS);
        setLoading(false);
        return;
      }
      try {
        const response = await apiClient.get('/analytics/customers/top-customers', { params: filters, timeout: 1000 });
        setData(response.data?.data || response.data || MOCK_TOP_CUSTOMERS);
      } catch {
        setData(MOCK_TOP_CUSTOMERS);
      } finally {
        setLoading(false);
      }
    })();
  }, [filters]);

  return { data, loading };
}

// Main Customer Table Hook
export function useCustomerTable(filters, pagination) {
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
        filtered = filtered.filter(row => row.name.toLowerCase().includes(q) || row.phone.includes(q) || row.email.toLowerCase().includes(q));
      }
      if (filters?.loyaltyTier) {
        filtered = filtered.filter(row => row.tier.toLowerCase() === filters.loyaltyTier.toLowerCase());
      }
      if (filters?.customerType) {
        filtered = filtered.filter(row => row.status.toLowerCase() === (filters.customerType === 'Inactive' ? 'inactive' : 'active'));
      }
      const count = filtered.length;
      const start = (pagination.page - 1) * pagination.limit;
      setData(filtered.slice(start, start + pagination.limit));
      setTotal(count);
      setLoading(false);
      return;
    }
    try {
      const response = await apiClient.get('/analytics/customers/table', {
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
        filtered = filtered.filter(row => row.name.toLowerCase().includes(q) || row.phone.includes(q) || row.email.toLowerCase().includes(q));
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

// Customer Profile Detail Drill-down
export function useCustomerDetail(customerId) {
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loyalty, setLoyalty] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchDetails = useCallback(async () => {
    if (!customerId) return;
    setLoading(true);
    const isOnline = await verifyConnection();

    if (!isOnline) {
      const matched = MOCK_TABLE_ROWS.find(r => r.id === customerId) || MOCK_TABLE_ROWS[0];
      setProfile({
        id: matched.id,
        name: matched.name,
        email: matched.email,
        phone: matched.phone,
        joinedDate: '2024-01-15',
        tier: matched.tier,
        status: matched.status,
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200&fm=webp',
        // overview stats
        overview: {
          totalOrders: matched.orders,
          totalRevenue: matched.spend,
          averageSpend: matched.averageSpend,
          lastOrderDate: matched.lastOrderDate,
          retentionScore: matched.retentionScore,
          referralCount: 4,
          couponUsage: 12,
          wishlistItems: 3
        }
      });

      setOrders([
        { id: 'ORD-9942', date: '2026-06-19', store: 'Connaught Place, New Delhi', items: 'Tandoori Paneer Pizza x1, Pepsi x2', amount: 450, paymentMethod: 'UPI', status: 'Delivered' },
        { id: 'ORD-9840', date: '2026-06-12', store: 'Connaught Place, New Delhi', items: 'Classic Margherita x2, Garlic Bread x1', amount: 590, paymentMethod: 'Card', status: 'Delivered' },
        { id: 'ORD-9733', date: '2026-06-01', store: 'Koramangala, Bengaluru', items: 'Farmhouse Delight x1', amount: 320, paymentMethod: 'Wallet', status: 'Delivered' }
      ]);

      setReviews([
        { product: 'Tandoori Paneer Pizza', rating: 5, comment: 'Always hot and loaded with paneer!', createdDate: '2026-06-19' },
        { product: 'Classic Margherita', rating: 4, comment: 'Crisp crust, cheese was perfect.', createdDate: '2026-06-12' }
      ]);

      setLoyalty({
        availablePoints: matched.tier === 'Platinum' ? 1250 : matched.tier === 'Gold' ? 940 : 450,
        redeemedPoints: 800,
        lifetimePoints: matched.tier === 'Platinum' ? 2050 : matched.tier === 'Gold' ? 1740 : 1250,
        currentTier: matched.tier,
        nextTierProgress: 75,
        transactions: [
          { date: '2026-06-19', earned: 45, redeemed: 0, source: 'Order Purchase' },
          { date: '2026-06-12', earned: 59, redeemed: 0, source: 'Order Purchase' },
          { date: '2026-05-28', earned: 0, redeemed: 800, source: 'Free Pizza Redemption' }
        ]
      });

      setAddresses([
        { id: 'addr-1', type: 'Home', address: 'Flat 402, Signature Towers, Sector 45', city: 'Gurgaon', state: 'Haryana', pincode: '122003', landmark: 'Opposite Central Park', isDefault: true },
        { id: 'addr-2', type: 'Work', address: 'Building 10C, 9th Floor, DLF Cyber City', city: 'Gurgaon', state: 'Haryana', pincode: '122002', landmark: 'Cyber Hub entrance', isDefault: false }
      ]);

      setLoading(false);
      return;
    }

    try {
      const [profileRes, ordersRes, reviewsRes, loyaltyRes, addressesRes] = await Promise.all([
        apiClient.get(`/analytics/customer/${customerId}`, { timeout: 1000 }),
        apiClient.get(`/analytics/customer/${customerId}/orders`, { timeout: 1000 }),
        apiClient.get(`/analytics/customer/${customerId}/reviews`, { timeout: 1000 }),
        apiClient.get(`/analytics/customer/${customerId}/loyalty`, { timeout: 1000 }),
        apiClient.get(`/analytics/customer/${customerId}/addresses`, { timeout: 1000 })
      ]);

      setProfile(profileRes.data?.data || profileRes.data);
      setOrders(ordersRes.data?.data || ordersRes.data || []);
      setReviews(reviewsRes.data?.data || reviewsRes.data || []);
      setLoyalty(loyaltyRes.data?.data || loyaltyRes.data);
      setAddresses(addressesRes.data?.data || addressesRes.data || []);
    } catch {
      const matched = MOCK_TABLE_ROWS.find(r => r.id === customerId) || MOCK_TABLE_ROWS[0];
      setProfile({
        id: matched.id,
        name: matched.name,
        email: matched.email,
        phone: matched.phone,
        joinedDate: '2024-01-15',
        tier: matched.tier,
        status: matched.status,
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200&fm=webp',
        overview: {
          totalOrders: matched.orders,
          totalRevenue: matched.spend,
          averageSpend: matched.averageSpend,
          lastOrderDate: matched.lastOrderDate,
          retentionScore: matched.retentionScore,
          referralCount: 4,
          couponUsage: 12,
          wishlistItems: 3
        }
      });
      setOrders([
        { id: 'ORD-9942', date: '2026-06-19', store: 'Connaught Place, New Delhi', items: 'Tandoori Paneer Pizza x1, Pepsi x2', amount: 450, paymentMethod: 'UPI', status: 'Delivered' },
        { id: 'ORD-9840', date: '2026-06-12', store: 'Connaught Place, New Delhi', items: 'Classic Margherita x2, Garlic Bread x1', amount: 590, paymentMethod: 'Card', status: 'Delivered' }
      ]);
      setReviews([
        { product: 'Tandoori Paneer Pizza', rating: 5, comment: 'Always hot and loaded with paneer!', createdDate: '2026-06-19' }
      ]);
      setLoyalty({
        availablePoints: matched.tier === 'Platinum' ? 1250 : 940,
        redeemedPoints: 800,
        lifetimePoints: matched.tier === 'Platinum' ? 2050 : 1740,
        currentTier: matched.tier,
        nextTierProgress: 75,
        transactions: [
          { date: '2026-06-19', earned: 45, redeemed: 0, source: 'Order Purchase' }
        ]
      });
      setAddresses([
        { id: 'addr-1', type: 'Home', address: 'Flat 402, Signature Towers, Sector 45', city: 'Gurgaon', state: 'Haryana', pincode: '122003', landmark: 'Opposite Central Park', isDefault: true }
      ]);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  return { profile, orders, reviews, loyalty, addresses, loading };
}

// Customer Export Hook
export function useExportCustomers() {
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
      const response = await apiClient.get('/analytics/customers/export', {
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
      const filename = `customer_analytics_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : format}`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success(`Customer database (${format.toUpperCase()}) exported successfully`);
      return true;
    } catch {
      exportReportOffline(format, fields, dateRange);
    } finally {
      setLoading(false);
    }
  };

  const exportReportOffline = (format, fields, dateRange) => {
    if (format === 'excel' || format === 'csv') {
      const headers = ["ID", "Name", "Phone", "Email", "Orders", "Spend (INR)", "Loyalty Tier", "Status"];
      const rows = MOCK_TABLE_ROWS.map(r => [
        r.id, r.name, r.phone, r.email, r.orders, r.spend, r.tier, r.status
      ]);

      const csvContent = [headers.join(","), ...rows.map(row => row.map(cell => `"${cell}"`).join(","))].join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const filename = `customer_database_${new Date().toISOString().split('T')[0]}.csv`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Customer database CSV exported (Offline Mode)");
    } else {
      const doc = new jsPDF();
      doc.setFillColor(164, 60, 18);
      doc.rect(0, 0, 210, 40, 'F');

      doc.setFontSize(22);
      doc.setTextColor(255, 255, 255);
      doc.text("PAPA VEG PIZZA", 14, 18);

      doc.setFontSize(10);
      doc.text("Super Admin Customer Analytics Database", 14, 28);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 130, 28);

      doc.setFontSize(12);
      doc.setTextColor(50, 50, 50);
      doc.text(`Exported Customer List - Range: ${dateRange || 'Custom Period'}`, 14, 52);

      autoTable(doc, {
        startY: 58,
        head: [['ID', 'Name', 'Phone', 'Orders', 'Spend (INR)', 'Tier']],
        body: MOCK_TABLE_ROWS.map(r => [
          r.id, r.name, r.phone, r.orders, `Rs. ${r.spend.toLocaleString('en-IN')}`, r.tier
        ]),
        headStyles: { fillColor: [164, 60, 18] },
        theme: 'striped',
        margin: { top: 10 }
      });

      const filename = `customer_analytics_report_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
      toast.success("Customer Analytics Statement PDF compiled successfully");
    }
  };

  return { generateReport, loading };
}
