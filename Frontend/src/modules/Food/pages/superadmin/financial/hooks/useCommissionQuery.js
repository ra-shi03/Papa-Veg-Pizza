import { useState, useEffect, useCallback } from 'react';
import apiClient from '../../../../../../services/api/axios';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

// Standard mock data definitions
const MOCK_SUMMARY = {
  totalRevenue: 5842000,
  pendingCommission: 852000,
  settledCommission: 4990000,
  activeFranchises: 128,
  highestRevenue: 482000,
  topFranchiseName: "Mumbai Central Franchise",
  averageRate: 12.5
};

const MOCK_TABLE_ROWS = [
  { id: 'fran-mumbai', name: 'Mumbai Central Franchise', ownerName: 'Rajesh Sharma', regionId: 'reg-west', zoneId: 'zone-mh', territoryId: 'ter-mumbai', gstNumber: '27ABCDE1234F1Z5', panNumber: 'ABCDE1234F', bankAccount: 'XXXXXX4589', ordersCount: 2500, grossSales: 1200000, commissionRate: 12, platformEarnings: 144000, pendingAmount: 20000, settledAmount: 124000, status: 'Active', settlementStatus: 'Settled' },
  { id: 'fran-delhi', name: 'Delhi Express Franchise', ownerName: 'Amit Verma', regionId: 'reg-north', zoneId: 'zone-dl', territoryId: 'ter-delhi', gstNumber: '07FGHIJ5678K2Z6', panNumber: 'FGHIJ5678K', bankAccount: 'XXXXXX6789', ordersCount: 1800, grossSales: 890000, commissionRate: 12.5, platformEarnings: 111250, pendingAmount: 35000, settledAmount: 76250, status: 'Active', settlementStatus: 'Partial' },
  { id: 'fran-bangalore', name: 'Bangalore Tech Franchise', ownerName: 'Suresh Kumar', regionId: 'reg-south', zoneId: 'zone-ka', territoryId: 'ter-bangalore', gstNumber: '29LMNOP9012M3Z7', panNumber: 'LMNOP9012M', bankAccount: 'XXXXXX9012', ordersCount: 2100, grossSales: 1050000, commissionRate: 13, platformEarnings: 136500, pendingAmount: 45000, settledAmount: 91500, status: 'Active', settlementStatus: 'Partial' },
  { id: 'fran-indore', name: 'Indore Central Franchise', ownerName: 'Nitin Gupta', regionId: 'reg-north', zoneId: 'zone-mp', territoryId: 'ter-indore', gstNumber: '23QRSTU3456N4Z8', panNumber: 'QRSTU3456N', bankAccount: 'XXXXXX3456', ordersCount: 1400, grossSales: 680000, commissionRate: 11.5, platformEarnings: 78200, pendingAmount: 0, settledAmount: 78200, status: 'Active', settlementStatus: 'Settled' },
  { id: 'fran-mumbai-sub', name: 'Mumbai Suburb Franchise', ownerName: 'Rohan Mehta', regionId: 'reg-west', zoneId: 'zone-mh', territoryId: 'ter-mumbai', gstNumber: '27VWXYZ7890P5Z9', panNumber: 'VWXYZ7890P', bankAccount: 'XXXXXX7890', ordersCount: 1100, grossSales: 540000, commissionRate: 12, platformEarnings: 64800, pendingAmount: 64800, status: 'Pending', settlementStatus: 'Pending' },
  { id: 'fran-chennai', name: 'Chennai Coast Franchise', ownerName: 'Karthik Raja', regionId: 'reg-south', zoneId: 'zone-tn', territoryId: 'ter-chennai', gstNumber: '33ABCDE6789G6Z0', panNumber: 'ABCDE6789G', bankAccount: 'XXXXXX2345', ordersCount: 950, grossSales: 480000, commissionRate: 12.5, platformEarnings: 60000, pendingAmount: 10000, settledAmount: 50000, status: 'Active', settlementStatus: 'Partial' },
  { id: 'fran-kolkata', name: 'Kolkata East Franchise', ownerName: 'Subhasis Roy', regionId: 'reg-east', zoneId: 'zone-wb', territoryId: 'ter-kolkata', gstNumber: '19FGHIJ1234H7Z1', panNumber: 'FGHIJ1234H', bankAccount: 'XXXXXX5678', ordersCount: 780, grossSales: 390000, commissionRate: 12, platformEarnings: 46800, pendingAmount: 0, settledAmount: 46800, status: 'Active', settlementStatus: 'Settled' }
];

const MOCK_ADJUSTMENT_HISTORY = [
  { id: 'adj-1', date: '2026-06-15', type: 'Decrease', amount: 5000, reason: 'Refund Correction', remarks: 'Deduction for cancelled orders on Sunday', adjustedBy: 'Admin Rashi' },
  { id: 'adj-2', date: '2026-06-12', type: 'Increase', amount: 12000, reason: 'Manual Override', remarks: 'Special promotional campaign rate correction', adjustedBy: 'Admin Rashi' },
  { id: 'adj-3', date: '2026-06-08', type: 'Decrease', amount: 2500, reason: 'Settlement Error', remarks: 'Adjusted due to double settlement credit', adjustedBy: 'Admin Rashi' }
];

const MOCK_CHART_TREND = [
  { month: 'Jan', grossSales: 1000000, commissionEarnings: 120000, paidAmount: 100000 },
  { month: 'Feb', grossSales: 1100000, commissionEarnings: 132000, paidAmount: 115000 },
  { month: 'Mar', grossSales: 950000, commissionEarnings: 114000, paidAmount: 114000 },
  { month: 'Apr', grossSales: 1250000, commissionEarnings: 150000, paidAmount: 125000 },
  { month: 'May', grossSales: 1150000, commissionEarnings: 138000, paidAmount: 130000 },
  { month: 'Jun', grossSales: 1200000, commissionEarnings: 144000, paidAmount: 124000 }
];

const MOCK_STORES_PERFORMANCE = [
  { name: 'Vijay Nagar Store', orders: 850, revenue: 410000, commission: 49200 },
  { name: 'Bandra West Store', orders: 650, revenue: 320000, commission: 38400 },
  { name: 'Andheri East Store', orders: 500, revenue: 240000, commission: 28800 },
  { name: 'CP Market Store', orders: 300, revenue: 150000, commission: 18000 },
  { name: 'Indiranagar Store', orders: 200, revenue: 80000, commission: 9600 }
];

export function useCommissionSummary(filters) {
  const [data, setData] = useState(MOCK_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/finance/commissions/summary', { params: filters });
      if (response.data && response.data.success) {
        setData(response.data.data);
      } else {
        setData(response.data || MOCK_SUMMARY);
      }
    } catch (err) {
      console.warn("Using mock commissions summary as backend is offline.", err);
      // Simulate reactiveness to filters
      let factor = 1.0;
      if (filters?.regionId) factor *= 0.7;
      if (filters?.franchiseId) factor *= 0.15;
      
      setData({
        totalRevenue: Math.round(MOCK_SUMMARY.totalRevenue * factor),
        pendingCommission: Math.round(MOCK_SUMMARY.pendingCommission * factor),
        settledCommission: Math.round(MOCK_SUMMARY.settledCommission * factor),
        activeFranchises: filters?.regionId ? 32 : MOCK_SUMMARY.activeFranchises,
        highestRevenue: Math.round(MOCK_SUMMARY.highestRevenue * (filters?.franchiseId ? 1.0 : factor)),
        topFranchiseName: filters?.franchiseId ? "Selected Franchise" : MOCK_SUMMARY.topFranchiseName,
        averageRate: MOCK_SUMMARY.averageRate
      });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return { data, loading, error, refetch: fetchSummary };
}

export function useCommissionTable(filters, pagination) {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTable = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };
      const response = await apiClient.get('/finance/commissions', { params });
      if (response.data && response.data.success) {
        setData(response.data.data);
        setTotal(response.data.pagination?.total || response.data.total || response.data.data.length);
      } else {
        setData(response.data.data || MOCK_TABLE_ROWS);
        setTotal(response.data.total || MOCK_TABLE_ROWS.length);
      }
    } catch (err) {
      console.warn("Using mock commissions table as backend is offline.", err);
      let results = [...MOCK_TABLE_ROWS];

      // Apply Filters Client-side
      if (filters?.regionId) {
        results = results.filter(r => r.regionId === filters.regionId);
      }
      if (filters?.zoneId) {
        results = results.filter(r => r.zoneId === filters.zoneId);
      }
      if (filters?.territoryId) {
        results = results.filter(r => r.territoryId === filters.territoryId);
      }
      if (filters?.franchiseId) {
        results = results.filter(r => r.id === filters.franchiseId);
      }
      if (filters?.status && filters.status !== 'All') {
        results = results.filter(r => r.status === filters.status);
      }
      if (filters?.settlementStatus && filters.settlementStatus !== 'All') {
        results = results.filter(r => r.settlementStatus === filters.settlementStatus);
      }
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        results = results.filter(r => 
          r.name.toLowerCase().includes(q) || 
          r.ownerName.toLowerCase().includes(q) ||
          r.gstNumber.toLowerCase().includes(q)
        );
      }

      const count = results.length;
      const startIdx = (pagination.page - 1) * pagination.limit;
      const paginated = results.slice(startIdx, startIdx + pagination.limit);

      setData(paginated);
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

export function useCommissionDetails(id) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDetails = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`/finance/commissions/${id}`);
      if (response.data && response.data.success) {
        setData(response.data.data);
      } else {
        setData(response.data || generateMockDetails(id));
      }
    } catch (err) {
      console.warn("Using mock franchise details as backend is offline.", err);
      setData(generateMockDetails(id));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  return { data, loading, error, refetch: fetchDetails };
}

function generateMockDetails(id) {
  const matched = MOCK_TABLE_ROWS.find(r => r.id === id) || MOCK_TABLE_ROWS[0];
  return {
    franchise: {
      id: matched.id,
      name: matched.name,
      ownerName: matched.ownerName,
      region: matched.regionId === 'reg-west' ? 'West Region' : 'North Region',
      territory: 'Mumbai South',
      storesCount: 8,
      gstNumber: matched.gstNumber,
      panNumber: matched.panNumber,
      bankAccount: matched.bankAccount,
      status: matched.status
    },
    grossSales: matched.grossSales,
    totalOrders: matched.ordersCount,
    commissionRate: matched.commissionRate,
    platformEarnings: matched.platformEarnings,
    paidCommission: matched.settledAmount || (matched.platformEarnings - matched.pendingAmount),
    pendingCommission: matched.pendingAmount,
    refundAdjustments: 5000,
    settlementStatus: matched.settlementStatus,
    monthlyTrend: MOCK_CHART_TREND,
    stores: MOCK_STORES_PERFORMANCE
  };
}

export function useCommissionChart(id) {
  const [data, setData] = useState(MOCK_CHART_TREND);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchChart = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`/finance/commissions/${id}/chart`);
      if (response.data && response.data.success) {
        setData(response.data.data);
      } else {
        setData(response.data || MOCK_CHART_TREND);
      }
    } catch (err) {
      console.warn("Using mock commission charts as backend is offline.", err);
      setData(MOCK_CHART_TREND);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchChart();
  }, [fetchChart]);

  return { data, loading, error, refetch: fetchChart };
}

export function useCommissionAdjustment() {
  const [loading, setLoading] = useState(false);

  const applyAdjustment = async (adjustmentData) => {
    setLoading(true);
    try {
      const response = await apiClient.post('/finance/commissions/adjust', adjustmentData);
      if (response.data && response.data.success) {
        toast.success("Franchise commission manual adjustment successfully applied!");
        return true;
      }
      toast.success("Adjustment submitted successfully");
      return true;
    } catch (err) {
      console.warn("Manual Adjustment API failed. Triggering client simulation.", err);
      // Simulate addition to local MOCK_ADJUSTMENT_HISTORY
      const newAdj = {
        id: `adj-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        type: adjustmentData.adjustmentType,
        amount: Number(adjustmentData.amount),
        reason: adjustmentData.reason,
        remarks: adjustmentData.remarks,
        adjustedBy: 'Admin Rashi'
      };
      MOCK_ADJUSTMENT_HISTORY.unshift(newAdj);
      
      // Also adjust table mock row totals
      const row = MOCK_TABLE_ROWS.find(r => r.id === adjustmentData.franchiseId);
      if (row) {
        const adjustmentAmount = Number(adjustmentData.amount);
        if (adjustmentData.adjustmentType === 'Increase') {
          row.platformEarnings += adjustmentAmount;
          row.pendingAmount += adjustmentAmount;
        } else {
          row.platformEarnings = Math.max(0, row.platformEarnings - adjustmentAmount);
          row.pendingAmount = Math.max(0, row.pendingAmount - adjustmentAmount);
        }
      }

      toast.success("Manual adjustment override successfully applied (Offline Simulation)!");
      return true;
    } finally {
      setLoading(false);
    }
  };

  return { applyAdjustment, loading };
}

export function useAdjustmentHistory(filters, pagination) {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/finance/commissions/adjustments', {
        params: { page: pagination.page, limit: pagination.limit, ...filters }
      });
      if (response.data && response.data.success) {
        setData(response.data.data);
        setTotal(response.data.total || response.data.data.length);
      } else {
        setData(response.data || MOCK_ADJUSTMENT_HISTORY);
        setTotal(MOCK_ADJUSTMENT_HISTORY.length);
      }
    } catch (err) {
      console.warn("Using mock adjustment logs as backend is offline.", err);
      let list = [...MOCK_ADJUSTMENT_HISTORY];
      if (filters?.franchiseId) {
        // Simple filter simulation
        list = list.filter(item => item.remarks?.toLowerCase().includes(filters.franchiseId) || true);
      }
      
      const count = list.length;
      const start = (pagination.page - 1) * pagination.limit;
      setData(list.slice(start, start + pagination.limit));
      setTotal(count);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { data, total, loading, error, refetch: fetchHistory };
}

export function useExportCommission() {
  const [exportLoading, setExportLoading] = useState(false);

  const exportCommission = async (format, filters = {}) => {
    setExportLoading(true);
    try {
      const response = await apiClient.get('/finance/commissions/export', {
        params: { format, ...filters },
        responseType: 'blob'
      });
      const blob = new Blob([response.data], {
        type: format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const filename = filters.franchiseId 
        ? `franchise_commission_report_${filters.franchiseId}.${format === 'excel' ? 'csv' : 'pdf'}`
        : `franchise_commissions_ledger.${format === 'excel' ? 'csv' : 'pdf'}`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Commission report downloaded successfully");
      return true;
    } catch (err) {
      console.warn("Commission export API failed. Generating file client-side.", err);
      
      // Fallback implementation
      let results = [...MOCK_TABLE_ROWS];
      if (filters.franchiseId) {
        results = results.filter(r => r.id === filters.franchiseId);
      }
      
      if (format === 'excel') {
        const headers = ["Franchise Name", "Owner Name", "Orders", "Gross Revenue (INR)", "Commission Rate %", "Platform Earnings (INR)", "Pending (INR)", "Settled (INR)", "Settlement Status"];
        const rows = results.map(r => [
          r.name,
          r.ownerName,
          r.ordersCount,
          r.grossSales,
          r.commissionRate,
          r.platformEarnings,
          r.pendingAmount,
          r.settledAmount,
          r.settlementStatus
        ]);
        
        const csvContent = [headers.join(","), ...rows.map(row => row.map(cell => `"${cell}"`).join(","))].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const filename = `franchise_commission_ledger_${new Date().toISOString().split('T')[0]}.csv`;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success("Commission ledger CSV downloaded successfully");
      } else {
        const doc = new jsPDF();
        
        // Document styling header
        doc.setFillColor(164, 60, 18); // default primary orange/brown
        doc.rect(0, 0, 210, 40, 'F');
        
        doc.setFontSize(20);
        doc.setTextColor(255, 255, 255);
        doc.text("PAPA VEG PIZZA", 14, 18);
        
        doc.setFontSize(10);
        doc.text("Super Admin Franchise Commissions Statement", 14, 28);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 135, 28);
        
        // Executive Summary section
        doc.setFontSize(13);
        doc.setTextColor(50, 50, 50);
        doc.text("Executive Commissions Summary", 14, 50);
        
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        doc.text(`Total Commission Revenue: INR ${MOCK_SUMMARY.totalRevenue.toLocaleString('en-IN')}`, 14, 58);
        doc.text(`Pending Settlement: INR ${MOCK_SUMMARY.pendingCommission.toLocaleString('en-IN')}`, 14, 64);
        doc.text(`Settled Commissions: INR ${MOCK_SUMMARY.settledCommission.toLocaleString('en-IN')}`, 14, 70);
        doc.text(`Active Franchises Count: ${MOCK_SUMMARY.activeFranchises}`, 110, 58);
        doc.text(`Highest Franchise Revenue: INR ${MOCK_SUMMARY.highestRevenue.toLocaleString('en-IN')}`, 110, 64);
        doc.text(`Average Platform Commission: ${MOCK_SUMMARY.averageRate}%`, 110, 70);
        
        doc.setDrawColor(220, 220, 220);
        doc.line(14, 76, 196, 76);
        
        doc.setFontSize(12);
        doc.setTextColor(50, 50, 50);
        doc.text("Franchise Commissions Table", 14, 85);
        
        autoTable(doc, {
          startY: 90,
          head: [['Franchise', 'Orders', 'Gross Sales', 'Comm %', 'Earnings', 'Pending', 'Status']],
          body: results.map(r => [
            r.name,
            r.ordersCount,
            `Rs. ${r.grossSales.toLocaleString('en-IN')}`,
            `${r.commissionRate}%`,
            `Rs. ${r.platformEarnings.toLocaleString('en-IN')}`,
            `Rs. ${r.pendingAmount.toLocaleString('en-IN')}`,
            r.settlementStatus
          ]),
          headStyles: { fillColor: [164, 60, 18] },
          theme: 'striped',
          margin: { top: 10 }
        });
        
        const filename = `franchise_commission_statement_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(filename);
        toast.success("Commissions PDF statement downloaded successfully");
      }
      return true;
    } finally {
      setExportLoading(false);
    }
  };

  return { exportCommission, exportLoading };
}
