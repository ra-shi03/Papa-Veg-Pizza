import { useState, useEffect, useCallback } from 'react';
import apiClient from '../../../../../../services/api/axios';
import { toast } from 'sonner';

// Probe backend connection
const FORCE_MOCK_MODE = false;
let isBackendOffline = sessionStorage.getItem('delivery_api_offline') === 'true';
let connectionPromise = null;

async function verifyConnection() {
  if (FORCE_MOCK_MODE) return false;
  if (isBackendOffline) return false;
  if (connectionPromise) return connectionPromise;

  connectionPromise = (async () => {
    try {
      await apiClient.get('/analytics/delivery', { params: { probe: true }, timeout: 800 });
      return true;
    } catch (err) {
      if (!err.response) {
        sessionStorage.setItem('delivery_api_offline', 'true');
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
  totalRiders: 480,
  onlineRiders: 132,
  busyRiders: 64,
  averageDeliveryTime: 27,
  acceptanceRate: 91,
  completionRate: 96,
  cancelledDeliveries: 83,
  customerRating: 4.7,
  // Trends compared to previous month
  totalRidersTrend: 4.2,
  onlineRidersTrend: 6.8,
  busyRidersTrend: -2.3,
  averageDeliveryTimeTrend: -8.5, // Down is good
  acceptanceRateTrend: 1.5,
  completionRateTrend: 2.1,
  cancelledDeliveriesTrend: -12.4, // Down is good
  customerRatingTrend: 0.8
};

const MOCK_TIME_TREND_DAILY = [
  { name: 'Mon', deliveries: 210, avgTime: 29, completed: 202 },
  { name: 'Tue', deliveries: 240, avgTime: 28, completed: 231 },
  { name: 'Wed', deliveries: 225, avgTime: 27, completed: 218 },
  { name: 'Thu', deliveries: 260, avgTime: 26, completed: 250 },
  { name: 'Fri', deliveries: 340, avgTime: 29, completed: 326 },
  { name: 'Sat', deliveries: 410, avgTime: 31, completed: 395 },
  { name: 'Sun', deliveries: 380, avgTime: 30, completed: 366 }
];

const MOCK_TIME_TREND_WEEKLY = [
  { name: 'Week 1', deliveries: 1650, avgTime: 28.5, completed: 1590 },
  { name: 'Week 2', deliveries: 1780, avgTime: 27.2, completed: 1710 },
  { name: 'Week 3', deliveries: 1890, avgTime: 26.8, completed: 1820 },
  { name: 'Week 4', deliveries: 2100, avgTime: 25.5, completed: 2025 }
];

const MOCK_TIME_TREND_MONTHLY = [
  { name: 'Jan', deliveries: 7200, avgTime: 29.8, completed: 6920 },
  { name: 'Feb', deliveries: 7800, avgTime: 28.6, completed: 7490 },
  { name: 'Mar', deliveries: 8400, avgTime: 27.4, completed: 8080 },
  { name: 'Apr', deliveries: 9100, avgTime: 26.5, completed: 8740 }
];

const MOCK_PERFORMANCE = [
  { rider: "Rohan Malhotra", completed: 142 },
  { rider: "Karan Singh", completed: 138 },
  { rider: "Rahul Dev", completed: 132 },
  { rider: "Amit Verma", completed: 128 },
  { rider: "Suresh Kumar", completed: 125 },
  { rider: "Pooja Patel", completed: 121 },
  { rider: "Ramesh Kumar", completed: 118 },
  { rider: "Vikram Rathore", completed: 115 },
  { rider: "Sanjay Dutt", completed: 112 },
  { rider: "Alok Gupta", completed: 108 }
];

const MOCK_EARNINGS = [
  { name: "Base Earnings", value: 65, amount: 245000 },
  { name: "Tips", value: 15, amount: 56500 },
  { name: "Bonuses", value: 12, amount: 45200 },
  { name: "Incentives", value: 8, amount: 30100 }
];

const MOCK_ACCEPTANCE_RATE = {
  optimal: 70,    // 81-100%
  warning: 22,    // 61-80%
  critical: 8     // 0-60%
};

const MOCK_DISTANCE_ANALYSIS = [
  { distance: 1.2, time: 14, earnings: 40, rider: "Rahul Dev" },
  { distance: 2.5, time: 22, earnings: 60, rider: "Vikram Rathore" },
  { distance: 3.8, time: 29, earnings: 85, rider: "Karan Singh" },
  { distance: 4.5, time: 35, earnings: 110, rider: "Rohan Malhotra" },
  { distance: 5.2, time: 42, earnings: 130, rider: "Sanjay Dutt" },
  { distance: 2.1, time: 18, earnings: 50, rider: "Amit Verma" },
  { distance: 3.0, time: 25, earnings: 75, rider: "Pooja Patel" },
  { distance: 6.0, time: 50, earnings: 160, rider: "Suresh Kumar" },
  { distance: 1.8, time: 16, earnings: 45, rider: "Alok Gupta" },
  { distance: 4.0, time: 32, earnings: 100, rider: "Ramesh Kumar" }
];

const MOCK_TABLE_ROWS = [
  { id: 'RD-001', name: 'Rohan Malhotra', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100', store: 'Bhopal Central', orders: 142, distance: 4.2, avgTime: 26, acceptance: 96, rating: 4.8, status: 'Online', vehicle: 'Bike' },
  { id: 'RD-002', name: 'Karan Singh', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100', store: 'CP New Delhi', orders: 138, distance: 3.8, avgTime: 24, acceptance: 94, rating: 4.7, status: 'Busy', vehicle: 'Scooter' },
  { id: 'RD-003', name: 'Rahul Dev', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100', store: 'Indore Town', orders: 132, distance: 3.5, avgTime: 25, acceptance: 92, rating: 4.6, status: 'Online', vehicle: 'Bike' },
  { id: 'RD-004', name: 'Amit Verma', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=100', store: 'Pune Express', orders: 128, distance: 4.0, avgTime: 28, acceptance: 91, rating: 4.5, status: 'Online', vehicle: 'Car' },
  { id: 'RD-005', name: 'Suresh Kumar', avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=100', store: 'Koramangala', orders: 125, distance: 4.8, avgTime: 29, acceptance: 89, rating: 4.4, status: 'Offline', vehicle: 'Scooter' },
  { id: 'RD-006', name: 'Pooja Patel', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100', store: 'Gwalior Fort', orders: 121, distance: 3.6, avgTime: 23, acceptance: 93, rating: 4.9, status: 'Online', vehicle: 'Cycle' },
  { id: 'RD-007', name: 'Ramesh Kumar', avatar: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&q=80&w=100', store: 'Ujjain Branch', orders: 118, distance: 3.2, avgTime: 22, acceptance: 95, rating: 4.7, status: 'Inactive', vehicle: 'Bike' }
];

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
// REACT QUERY HOOK SIMULATIONS
// =============================================================

export function useDeliveryStats(filters) {
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
      const res = await apiClient.get('/analytics/delivery', { params: filters, timeout: 1000 });
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

export function useDeliveryTimeTrend(filters, interval) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTrend = useCallback(async () => {
    setLoading(true);
    const isOnline = await verifyConnection();
    if (!isOnline) {
      setData(interval === 'daily' ? MOCK_TIME_TREND_DAILY : interval === 'weekly' ? MOCK_TIME_TREND_WEEKLY : MOCK_TIME_TREND_MONTHLY);
      setLoading(false);
      return;
    }
    try {
      const res = await apiClient.get('/analytics/delivery/time-trend', { params: { ...filters, interval }, timeout: 1000 });
      setData(res.data?.data || res.data || (interval === 'daily' ? MOCK_TIME_TREND_DAILY : interval === 'weekly' ? MOCK_TIME_TREND_WEEKLY : MOCK_TIME_TREND_MONTHLY));
    } catch {
      setData(interval === 'daily' ? MOCK_TIME_TREND_DAILY : interval === 'weekly' ? MOCK_TIME_TREND_WEEKLY : MOCK_TIME_TREND_MONTHLY);
    } finally {
      setLoading(false);
    }
  }, [filters, interval]);

  useEffect(() => {
    fetchTrend();
  }, [fetchTrend]);

  return { data, loading, refetch: fetchTrend };
}

export function useRiderPerformance(filters) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPerformance = useCallback(async () => {
    setLoading(true);
    const isOnline = await verifyConnection();
    if (!isOnline) {
      setData(MOCK_PERFORMANCE);
      setLoading(false);
      return;
    }
    try {
      const res = await apiClient.get('/analytics/delivery/performance', { params: filters, timeout: 1000 });
      setData(res.data?.data || res.data || MOCK_PERFORMANCE);
    } catch {
      setData(MOCK_PERFORMANCE);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchPerformance();
  }, [fetchPerformance]);

  return { data, loading, refetch: fetchPerformance };
}

export function useEarningsDistribution(filters) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEarnings = useCallback(async () => {
    setLoading(true);
    const isOnline = await verifyConnection();
    if (!isOnline) {
      setData(MOCK_EARNINGS);
      setLoading(false);
      return;
    }
    try {
      const res = await apiClient.get('/analytics/delivery/earnings', { params: filters, timeout: 1000 });
      setData(res.data?.data || res.data || MOCK_EARNINGS);
    } catch {
      setData(MOCK_EARNINGS);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  return { data, loading, refetch: fetchEarnings };
}

export function useAcceptanceRate(filters) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAcceptance = useCallback(async () => {
    setLoading(true);
    const isOnline = await verifyConnection();
    if (!isOnline) {
      setData(MOCK_ACCEPTANCE_RATE);
      setLoading(false);
      return;
    }
    try {
      const res = await apiClient.get('/analytics/delivery/acceptance-rate', { params: filters, timeout: 1000 });
      setData(res.data?.data || res.data || MOCK_ACCEPTANCE_RATE);
    } catch {
      setData(MOCK_ACCEPTANCE_RATE);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchAcceptance();
  }, [fetchAcceptance]);

  return { data, loading, refetch: fetchAcceptance };
}

export function useDistanceAnalysis(filters) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDistance = useCallback(async () => {
    setLoading(true);
    const isOnline = await verifyConnection();
    if (!isOnline) {
      setData(MOCK_DISTANCE_ANALYSIS);
      setLoading(false);
      return;
    }
    try {
      const res = await apiClient.get('/analytics/delivery/distance-analysis', { params: filters, timeout: 1000 });
      setData(res.data?.data || res.data || MOCK_DISTANCE_ANALYSIS);
    } catch {
      setData(MOCK_DISTANCE_ANALYSIS);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchDistance();
  }, [fetchDistance]);

  return { data, loading, refetch: fetchDistance };
}

export function useDeliveryTable(filters, pagination) {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Destructure filters to depend on primitive values in the useCallback dependency array
  const search = filters?.search;
  const vehicleType = filters?.vehicleType;
  const status = filters?.status;
  const storeId = filters?.storeId;
  const sortByKey = filters?.sortBy?.key;
  const sortByDir = filters?.sortBy?.dir;
  const regionId = filters?.regionId;
  const zoneId = filters?.zoneId;
  const franchiseId = filters?.franchiseId;
  const dateRange = filters?.dateRange;
  const startDate = filters?.startDate;
  const endDate = filters?.endDate;

  const fetchTable = useCallback(async () => {
    setLoading(true);
    const isOnline = await verifyConnection();
    if (!isOnline) {
      let filtered = [...MOCK_TABLE_ROWS];
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(row => row.name.toLowerCase().includes(q) || row.store.toLowerCase().includes(q) || row.id.toLowerCase().includes(q));
      }
      if (vehicleType) {
        filtered = filtered.filter(row => row.vehicle === vehicleType);
      }
      if (status) {
        filtered = filtered.filter(row => row.status === status);
      }
      if (storeId) {
        // Find store name from stores list
        const storeName = MOCK_STORES.find(s => s.id === storeId)?.name;
        if (storeName) {
          filtered = filtered.filter(row => row.store === storeName);
        }
      }
      if (sortByKey) {
        const dir = sortByDir === 'asc' ? 1 : -1;
        filtered.sort((a, b) => {
          if (a[sortByKey] < b[sortByKey]) return -1 * dir;
          if (a[sortByKey] > b[sortByKey]) return 1 * dir;
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
      const res = await apiClient.get('/analytics/delivery/table', {
        params: {
          regionId,
          zoneId,
          franchiseId,
          storeId,
          vehicleType,
          status,
          dateRange,
          startDate,
          endDate,
          search,
          sortBy: sortByKey ? { key: sortByKey, dir: sortByDir } : undefined,
          page: pagination.page,
          limit: pagination.limit
        },
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
  }, [
    regionId,
    zoneId,
    franchiseId,
    storeId,
    vehicleType,
    status,
    dateRange,
    startDate,
    endDate,
    search,
    sortByKey,
    sortByDir,
    pagination.page,
    pagination.limit
  ]);

  useEffect(() => {
    fetchTable();
  }, [fetchTable]);

  return { data, total, loading, refetch: fetchTable };
}

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

// Rider Details Tab 1: Overview
export function useRiderDetails(riderId) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!riderId) return;
    (async () => {
      setLoading(true);
      const isOnline = await verifyConnection();
      if (!isOnline) {
        const riderObj = MOCK_TABLE_ROWS.find(r => r.id === riderId) || MOCK_TABLE_ROWS[0];
        setProfile({
          id: riderObj.id,
          name: riderObj.name,
          avatar: riderObj.avatar,
          phone: '+91 98402 12903',
          vehicle: riderObj.vehicle,
          status: riderObj.status,
          store: riderObj.store,
          rating: riderObj.rating,
          overview: {
            deliveries: riderObj.orders,
            avgTime: riderObj.avgTime,
            acceptance: riderObj.acceptance,
            completion: 98,
            earnings: riderObj.orders * 45 + 1500,
            rating: riderObj.rating,
            dailyDeliveries: [
              { day: 'Mon', count: 12 },
              { day: 'Tue', count: 15 },
              { day: 'Wed', count: 14 },
              { day: 'Thu', count: 18 },
              { day: 'Fri', count: 22 },
              { day: 'Sat', count: 25 },
              { day: 'Sun', count: 20 }
            ],
            weeklyEarnings: [
              { name: 'Week 1', amount: 3500 },
              { name: 'Week 2', amount: 4200 },
              { name: 'Week 3', amount: 3800 },
              { name: 'Week 4', amount: 4800 }
            ]
          }
        });
        setLoading(false);
        return;
      }
      try {
        const res = await apiClient.get(`/analytics/rider/${riderId}`, { timeout: 1000 });
        setProfile(res.data?.data || res.data);
      } catch {
        const riderObj = MOCK_TABLE_ROWS.find(r => r.id === riderId) || MOCK_TABLE_ROWS[0];
        setProfile({
          id: riderObj.id,
          name: riderObj.name,
          avatar: riderObj.avatar,
          phone: '+91 98402 12903',
          vehicle: riderObj.vehicle,
          status: riderObj.status,
          store: riderObj.store,
          rating: riderObj.rating,
          overview: {
            deliveries: riderObj.orders,
            avgTime: riderObj.avgTime,
            acceptance: riderObj.acceptance,
            completion: 98,
            earnings: riderObj.orders * 45 + 1500,
            rating: riderObj.rating,
            dailyDeliveries: [
              { day: 'Mon', count: 12 },
              { day: 'Tue', count: 15 }
            ],
            weeklyEarnings: [
              { name: 'Week 1', amount: 3500 }
            ]
          }
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [riderId]);

  return { profile, loading };
}

// Rider Details Tab 2: Deliveries List
export function useRiderDeliveries(riderId, filters, pagination) {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchDeliveries = useCallback(async () => {
    if (!riderId) return;
    setLoading(true);
    const isOnline = await verifyConnection();
    if (!isOnline) {
      const mockDeliveries = [
        { id: 'ORD-89402', date: '2026-06-19', customer: 'Sanjay Deshmukh', distance: 3.4, time: 22, status: 'Delivered', amount: 45 },
        { id: 'ORD-89391', date: '2026-06-19', customer: 'Preeti Sharma', distance: 2.1, time: 15, status: 'Delivered', amount: 45 },
        { id: 'ORD-89312', date: '2026-06-18', customer: 'Amit Gupta', distance: 5.0, time: 34, status: 'Delivered', amount: 65 },
        { id: 'ORD-89201', date: '2026-06-18', customer: 'Vikram Singh', distance: 4.2, time: 28, status: 'Delivered', amount: 55 },
        { id: 'ORD-89104', date: '2026-06-17', customer: 'Komal Rao', distance: 1.5, time: 12, status: 'Cancelled', amount: 0 }
      ];
      let filtered = [...mockDeliveries];
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        filtered = filtered.filter(d => d.customer.toLowerCase().includes(q) || d.id.toLowerCase().includes(q));
      }
      setTotal(filtered.length);
      const start = (pagination.page - 1) * pagination.limit;
      setData(filtered.slice(start, start + pagination.limit));
      setLoading(false);
      return;
    }
    try {
      const res = await apiClient.get(`/analytics/rider/${riderId}/deliveries`, {
        params: { ...filters, page: pagination.page, limit: pagination.limit },
        timeout: 1000
      });
      setData(res.data?.data || res.data?.rows || []);
      setTotal(res.data?.total || 5);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [riderId, filters, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  return { data, total, loading, refetch: fetchDeliveries };
}

// Rider Details Tab 3: Earnings
export function useRiderEarnings(riderId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!riderId) return;
    (async () => {
      setLoading(true);
      const isOnline = await verifyConnection();
      if (!isOnline) {
        setData({
          today: 540,
          weekly: 3600,
          monthly: 14800,
          bonuses: 1800,
          tips: 1200,
          dailyTrend: [
            { name: 'Mon', amount: 480 },
            { name: 'Tue', amount: 520 },
            { name: 'Wed', amount: 490 },
            { name: 'Thu', amount: 600 },
            { name: 'Fri', amount: 720 },
            { name: 'Sat', amount: 800 },
            { name: 'Sun', amount: 650 }
          ],
          ledger: [
            { date: '2026-06-19', base: 360, bonus: 100, tips: 80, total: 540 },
            { date: '2026-06-18', base: 420, bonus: 50, tips: 50, total: 520 },
            { date: '2026-06-17', base: 380, bonus: 50, tips: 60, total: 490 },
            { date: '2026-06-16', base: 450, bonus: 100, tips: 50, total: 600 },
            { date: '2026-06-15', base: 500, bonus: 150, tips: 70, total: 720 }
          ]
        });
        setLoading(false);
        return;
      }
      try {
        const res = await apiClient.get(`/analytics/rider/${riderId}/earnings`, { timeout: 1000 });
        setData(res.data?.data || res.data);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [riderId]);

  return { data, loading };
}

// Rider Details Tab 4: Reviews (Sentiment)
export function useRiderReviews(riderId) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!riderId) return;
    (async () => {
      setLoading(true);
      const isOnline = await verifyConnection();
      if (!isOnline) {
        setData([
          { customer: 'Rohan Malhotra', orderId: 'ORD-89402', comment: 'Delivered extremely fast and pizza was piping hot! Great service.', date: '2026-06-19', sentiment: 'Positive' },
          { customer: 'Preeti Sharma', orderId: 'ORD-89391', comment: 'Rider was polite and followed delivery instructions perfectly.', date: '2026-06-19', sentiment: 'Positive' },
          { customer: 'Amit Gupta', orderId: 'ORD-89312', comment: 'Delivery was slightly delayed due to heavy rain. Rider kept me updated.', date: '2026-06-18', sentiment: 'Neutral' },
          { customer: 'Komal Rao', orderId: 'ORD-89104', comment: 'Pizza crust was completely crushed. Disappointed.', date: '2026-06-17', sentiment: 'Negative' }
        ]);
        setLoading(false);
        return;
      }
      try {
        const res = await apiClient.get(`/analytics/rider/${riderId}/reviews`, { timeout: 1000 });
        setData(res.data?.data || res.data || []);
      } catch {
        setData([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [riderId]);

  return { data, loading };
}

// Rider Details Tab 5: Ratings
export function useRiderRatings(riderId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!riderId) return;
    (async () => {
      setLoading(true);
      const isOnline = await verifyConnection();
      if (!isOnline) {
        setData({
          averageRating: 4.7,
          fiveStar: 86,
          fourStar: 28,
          threeStar: 8,
          twoStar: 2,
          oneStar: 1,
          ledger: [
            { orderId: 'ORD-89402', customer: 'Sanjay Deshmukh', rating: 5, review: 'Super fast delivery!', date: '2026-06-19' },
            { orderId: 'ORD-89391', customer: 'Preeti Sharma', rating: 5, review: 'Polite behaviour.', date: '2026-06-19' },
            { orderId: 'ORD-89312', customer: 'Amit Gupta', rating: 4, review: 'Good but rain caused minor delay.', date: '2026-06-18' }
          ]
        });
        setLoading(false);
        return;
      }
      try {
        const res = await apiClient.get(`/analytics/rider/${riderId}/ratings`, { timeout: 1000 });
        setData(res.data?.data || res.data);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [riderId]);

  return { data, loading };
}

// Rider Details Tab 6: Location Logs
export function useRiderLocationLogs(riderId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!riderId) return;
    (async () => {
      setLoading(true);
      const isOnline = await verifyConnection();
      if (!isOnline) {
        setData({
          logs: [
            { timestamp: '2026-06-19 14:30:15', lat: 23.2501, lng: 77.4022, address: 'Bhopal Central Hub, MP Nagar', speed: 0 },
            { timestamp: '2026-06-19 14:32:45', lat: 23.2532, lng: 77.4054, address: 'Near Chetak Bridge, MP Nagar', speed: 45 },
            { timestamp: '2026-06-19 14:35:10', lat: 23.2584, lng: 77.4110, address: 'DB Mall Crossing, Arera Hills', speed: 38 },
            { timestamp: '2026-06-19 14:38:20', lat: 23.2625, lng: 77.4182, address: 'Arera Colony Link Road', speed: 42 },
            { timestamp: '2026-06-19 14:41:05', lat: 23.2668, lng: 77.4244, address: 'E-7 Sector, Arera Colony (Client Address)', speed: 12 }
          ],
          routeCoordinates: [
            [23.2501, 77.4022],
            [23.2532, 77.4054],
            [23.2584, 77.4110],
            [23.2625, 77.4182],
            [23.2668, 77.4244]
          ]
        });
        setLoading(false);
        return;
      }
      try {
        const res = await apiClient.get(`/analytics/rider/${riderId}/location-logs`, { timeout: 1000 });
        setData(res.data?.data || res.data);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [riderId]);

  return { data, loading };
}

// Incentive Creation Mutation Hook
export function useCreateIncentive() {
  const [submitting, setSubmitting] = useState(false);

  const create = useCallback(async (payload) => {
    setSubmitting(true);
    const isOnline = await verifyConnection();
    if (!isOnline) {
      return new Promise((resolve) => {
        setTimeout(() => {
          setSubmitting(false);
          toast.success('Incentive created successfully (Offline Simulation Mode)');
          resolve(true);
        }, 1200);
      });
    }
    try {
      await apiClient.post('/delivery/incentive', payload, { timeout: 2000 });
      toast.success('Incentive created successfully.');
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create incentive.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return { create, submitting };
}
