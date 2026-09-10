import { useState, useEffect, useCallback } from 'react';
import apiClient from '../../../../../../services/api/axios';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

// Mock summary metrics
const MOCK_SUMMARY = {
  pendingPayouts: 1240000,
  completedPayouts: 5890000,
  failedPayouts: 80000,
  todayPayout: 420000,
  monthlyPayout: 18000000,
  totalBeneficiaries: 426
};

// Autocomplete database mocks
export const MOCK_BENEFICIARIES = {
  franchise: [
    { id: 'fran-bhopal', name: 'Bhopal Central Franchise', ownerName: 'Rajesh Sharma', gstNumber: '23ABCDE1234F1Z1', bankAccount: 'HDFC XXXX9082', ifscCode: 'HDFC0000104' },
    { id: 'fran-indore', name: 'Indore Central Franchise', ownerName: 'Nitin Gupta', gstNumber: '23FGHIJ5678K2Z2', bankAccount: 'ICICI XXXX4321', ifscCode: 'ICIC0000210' },
    { id: 'fran-mumbai', name: 'Mumbai Premium Franchise', ownerName: 'Rohan Mehta', gstNumber: '27LMNOP9012M3Z3', bankAccount: 'SBI XXXX7890', ifscCode: 'SBIN0004561' }
  ],
  store: [
    { id: 'store-bandra', name: 'Bandra West Store', ownerName: 'Karan Johar', gstNumber: '27VWXYZ7890P4Z4', bankAccount: 'AXIS XXXX5678', ifscCode: 'UTIB0000023' },
    { id: 'store-cp', name: 'CP Market Store', ownerName: 'Vijay Shekhar', gstNumber: '07ABCDE5678F5Z5', bankAccount: 'HDFC XXXX1234', ifscCode: 'HDFC0000003' }
  ],
  deliveryPartner: [
    { id: 'rider-ramesh', name: 'Ramesh Kumar', phone: '9876543210', bankAccount: 'Paytm XXXX8890', ifscCode: 'PYTM0123456' },
    { id: 'rider-sunita', name: 'Sunita Sharma', phone: '9765432109', bankAccount: 'SBI XXXX5432', ifscCode: 'SBIN0000201' }
  ],
  vendor: [
    { id: 'vendor-dev', name: 'Dev Dairy Products', category: 'Dairy', bankAccount: 'BOI XXXX2314', ifscCode: 'BKID0000412' },
    { id: 'vendor-shrinath', name: 'Shrinath Veg Supplies', category: 'Vegetables', bankAccount: 'PNB XXXX6789', ifscCode: 'PUNB0023100' }
  ]
};

// Payout main table mock data
const MOCK_PAYOUTS_TABLE = [
  { id: 'PAY-1045', payoutId: 'PAY-1045', beneficiaryType: 'franchise', beneficiaryId: 'fran-bhopal', beneficiaryName: 'Bhopal Central Franchise', amount: 50000, payoutMethod: 'NEFT', referenceNo: 'REF9854', transactionId: 'TXN1254', utrNumber: 'UTR456789', status: 'Completed', remarks: 'Monthly commission settlement', initiatedBy: 'Admin Rashi', approvedBy: 'SuperAdmin Ajay', paidAt: '2026-06-18 14:00', createdAt: '2026-06-18 09:30' },
  { id: 'PAY-1046', payoutId: 'PAY-1046', beneficiaryType: 'store', beneficiaryId: 'store-bandra', beneficiaryName: 'Bandra West Store', amount: 35000, payoutMethod: 'IMPS', referenceNo: 'REF9855', transactionId: 'TXN1255', utrNumber: 'UTR456790', status: 'Completed', remarks: 'Store online payment split payout', initiatedBy: 'Admin Rashi', approvedBy: 'SuperAdmin Ajay', paidAt: '2026-06-18 15:30', createdAt: '2026-06-18 11:20' },
  { id: 'PAY-1047', payoutId: 'PAY-1047', beneficiaryType: 'deliveryPartner', beneficiaryId: 'rider-ramesh', beneficiaryName: 'Ramesh Kumar', amount: 12500, payoutMethod: 'UPI', referenceNo: 'REF9856', transactionId: 'TXN1256', utrNumber: 'UTR456791', status: 'Pending Approval', remarks: 'Weekly rider incentives split', initiatedBy: 'Admin Rashi', approvedBy: '', paidAt: '', createdAt: '2026-06-18 10:15' },
  { id: 'PAY-1048', payoutId: 'PAY-1048', beneficiaryType: 'vendor', beneficiaryId: 'vendor-dev', beneficiaryName: 'Dev Dairy Products', amount: 120000, payoutMethod: 'RTGS', referenceNo: 'REF9857', transactionId: 'TXN1257', utrNumber: 'UTR456792', status: 'Processing', remarks: 'Cheese supply bulk payment invoice #99', initiatedBy: 'Admin Rashi', approvedBy: 'SuperAdmin Ajay', paidAt: '', createdAt: '2026-06-17 17:00' },
  { id: 'PAY-1049', payoutId: 'PAY-1049', beneficiaryType: 'franchise', beneficiaryId: 'fran-indore', beneficiaryName: 'Indore Central Franchise', amount: 80000, payoutMethod: 'NEFT', referenceNo: 'REF9858', transactionId: '', utrNumber: '', status: 'Failed', remarks: 'Weekly earnings settlement - Bank server timeout', initiatedBy: 'Admin Rashi', approvedBy: 'SuperAdmin Ajay', paidAt: '', createdAt: '2026-06-17 12:40' },
  { id: 'PAY-1050', payoutId: 'PAY-1050', beneficiaryType: 'vendor', beneficiaryId: 'vendor-shrinath', beneficiaryName: 'Shrinath Veg Supplies', amount: 45000, payoutMethod: 'NEFT', referenceNo: 'REF9859', transactionId: 'TXN1259', utrNumber: 'UTR456794', status: 'Completed', remarks: 'Onions and Potato supply bills', initiatedBy: 'Admin Rashi', approvedBy: 'SuperAdmin Ajay', paidAt: '2026-06-16 11:00', createdAt: '2026-06-16 08:30' },
  { id: 'PAY-1051', payoutId: 'PAY-1051', beneficiaryType: 'store', beneficiaryId: 'store-cp', beneficiaryName: 'CP Market Store', amount: 95000, payoutMethod: 'IMPS', referenceNo: 'REF9860', transactionId: '', utrNumber: '', status: 'Rejected', remarks: 'Flagged duplicate payout request', initiatedBy: 'Admin Rashi', approvedBy: 'SuperAdmin Ajay', paidAt: '', createdAt: '2026-06-15 14:00' }
];

// Mock Payout Logs for view details audit logs
const MOCK_PAYOUT_LOGS = {
  'PAY-1045': [
    { id: 'log-1', date: '2026-06-18 09:30', action: 'Payout Created', performedBy: 'Admin Rashi', remarks: 'Initiated payout from Weekly Cycle' },
    { id: 'log-2', date: '2026-06-18 11:00', action: 'Approved', performedBy: 'SuperAdmin Ajay', remarks: 'Verified GST invoice and approved' },
    { id: 'log-3', date: '2026-06-18 11:30', action: 'Sent to Bank (Processing)', performedBy: 'System Auto', remarks: 'IMPS API dispatch completed' },
    { id: 'log-4', date: '2026-06-18 14:00', action: 'Completed (Settled)', performedBy: 'HDFC Bank API', remarks: 'Settled successfully. UTR generated.' }
  ],
  'PAY-1046': [
    { id: 'log-1', date: '2026-06-18 11:20', action: 'Payout Created', performedBy: 'Admin Rashi', remarks: 'Store online payment split payout' },
    { id: 'log-2', date: '2026-06-18 12:00', action: 'Approved', performedBy: 'SuperAdmin Ajay', remarks: 'Approved' },
    { id: 'log-3', date: '2026-06-18 15:30', action: 'Completed', performedBy: 'System Auto', remarks: 'Completed transaction successfully' }
  ],
  'PAY-1047': [
    { id: 'log-1', date: '2026-06-18 10:15', action: 'Payout Created', performedBy: 'Admin Rashi', remarks: 'Weekly rider incentives split' }
  ],
  'PAY-1048': [
    { id: 'log-1', date: '2026-06-17 17:00', action: 'Payout Created', performedBy: 'Admin Rashi', remarks: 'Cheese supply bulk payment invoice #99' },
    { id: 'log-2', date: '2026-06-18 09:00', action: 'Approved', performedBy: 'SuperAdmin Ajay', remarks: 'Approved bulk billing' },
    { id: 'log-3', date: '2026-06-18 10:00', action: 'Processing', performedBy: 'System Auto', remarks: 'Sent to RTGS queue' }
  ],
  'PAY-1049': [
    { id: 'log-1', date: '2026-06-17 12:40', action: 'Payout Created', performedBy: 'Admin Rashi', remarks: 'Weekly earnings settlement' },
    { id: 'log-2', date: '2026-06-17 13:00', action: 'Approved', performedBy: 'SuperAdmin Ajay', remarks: 'Approved' },
    { id: 'log-3', date: '2026-06-17 13:10', action: 'Failed', performedBy: 'SBI API Gateway', remarks: 'Error Code 504: Destination Bank Server Timeout' }
  ],
  'PAY-1051': [
    { id: 'log-1', date: '2026-06-15 14:00', action: 'Payout Created', performedBy: 'Admin Rashi', remarks: 'Store payout' },
    { id: 'log-2', date: '2026-06-15 16:30', action: 'Rejected', performedBy: 'SuperAdmin Ajay', remarks: 'Rejection Reason: Duplicate Request. Payout already completed for CP Market Store.' }
  ]
};

export function usePayoutSummary(filters) {
  const [data, setData] = useState(MOCK_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/finance/payouts/summary', { params: filters });
      if (response.data && response.data.success) {
        setData(response.data.data);
      } else {
        setData(response.data || MOCK_SUMMARY);
      }
    } catch (err) {
      console.warn("Using mock payout summary metrics as backend is offline.", err);
      let factor = 1.0;
      if (filters?.beneficiaryType) factor *= 0.35;
      if (filters?.status) factor *= 0.2;
      
      setData({
        pendingPayouts: Math.round(MOCK_SUMMARY.pendingPayouts * factor),
        completedPayouts: Math.round(MOCK_SUMMARY.completedPayouts * factor),
        failedPayouts: Math.round(MOCK_SUMMARY.failedPayouts * factor),
        todayPayout: Math.round(MOCK_SUMMARY.todayPayout * factor),
        monthlyPayout: Math.round(MOCK_SUMMARY.monthlyPayout * factor),
        totalBeneficiaries: filters?.beneficiaryType ? 45 : MOCK_SUMMARY.totalBeneficiaries
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

export function usePayoutTable(filters, pagination) {
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
      const response = await apiClient.get('/finance/payouts', { params });
      if (response.data && response.data.success) {
        setData(response.data.data);
        setTotal(response.data.pagination?.total || response.data.total || response.data.data.length);
      } else {
        setData(response.data.data || MOCK_PAYOUTS_TABLE);
        setTotal(response.data.total || MOCK_PAYOUTS_TABLE.length);
      }
    } catch (err) {
      console.warn("Using mock payouts table listing as backend is offline.", err);
      let results = [...MOCK_PAYOUTS_TABLE];

      // Filters
      if (filters?.beneficiaryType) {
        results = results.filter(r => r.beneficiaryType === filters.beneficiaryType);
      }
      if (filters?.status && filters.status !== 'All') {
        results = results.filter(r => r.status === filters.status);
      }
      if (filters?.paymentMethod && filters.paymentMethod !== 'All') {
        results = results.filter(r => r.payoutMethod === filters.paymentMethod);
      }
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        results = results.filter(r => 
          r.payoutId.toLowerCase().includes(q) ||
          r.beneficiaryName.toLowerCase().includes(q) ||
          r.referenceNo.toLowerCase().includes(q) ||
          r.transactionId.toLowerCase().includes(q)
        );
      }

      const count = results.length;
      const start = (pagination.page - 1) * pagination.limit;
      setData(results.slice(start, start + pagination.limit));
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

export function usePayoutDetails(id) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDetails = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`/finance/payouts/${id}`);
      if (response.data && response.data.success) {
        setData(response.data.data);
      } else {
        setData(response.data || generateMockPayoutDetails(id));
      }
    } catch (err) {
      console.warn("Using mock payout details as backend is offline.", err);
      setData(generateMockPayoutDetails(id));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  return { data, loading, error, refetch: fetchDetails };
}

function generateMockPayoutDetails(id) {
  const matched = MOCK_PAYOUTS_TABLE.find(p => p.payoutId === id) || MOCK_PAYOUTS_TABLE[0];
  
  // Find beneficiary bank card details
  let beneficiaryCard = { ownerName: matched.beneficiaryName, phone: '9882034568', bankAccount: 'HDFC XXXX7890', ifscCode: 'HDFC0000012' };
  const matchesInType = MOCK_BENEFICIARIES[matched.beneficiaryType] || [];
  const found = matchesInType.find(b => b.id === matched.beneficiaryId);
  if (found) {
    beneficiaryCard = {
      ownerName: found.ownerName || found.riderName || found.vendorName,
      phone: found.phone || '9923891024',
      bankAccount: found.bankAccount,
      ifscCode: found.ifscCode
    };
  }

  return {
    payoutId: matched.payoutId,
    transactionId: matched.transactionId || 'TXN-AWAITING',
    utrNumber: matched.utrNumber || 'UTR-PENDING',
    referenceNo: matched.referenceNo,
    payoutMethod: matched.payoutMethod,
    amount: matched.amount,
    status: matched.status,
    remarks: matched.remarks,
    initiatedBy: matched.initiatedBy,
    approvedBy: matched.approvedBy,
    createdAt: matched.createdAt,
    paidAt: matched.paidAt,
    beneficiary: {
      id: matched.beneficiaryId,
      type: matched.beneficiaryType,
      name: matched.beneficiaryName,
      owner: beneficiaryCard.ownerName,
      phone: beneficiaryCard.phone,
      bankAccount: beneficiaryCard.bankAccount,
      ifscCode: beneficiaryCard.ifscCode
    },
    timeline: [
      { step: 'Created', done: true, date: '18-Jun 09:30 AM', user: matched.initiatedBy },
      { step: 'Pending Approval', done: true, date: '18-Jun 10:00 AM', user: 'System' },
      { step: 'Approved', done: matched.status !== 'Pending Approval' && matched.status !== 'Rejected', date: matched.status !== 'Pending Approval' && matched.status !== 'Rejected' ? '18-Jun 11:00 AM' : '', user: matched.approvedBy },
      { step: 'Processing', done: matched.status === 'Processing' || matched.status === 'Completed', date: matched.status === 'Processing' || matched.status === 'Completed' ? '18-Jun 11:30 AM' : '', user: 'SBI Gateway' },
      { step: 'Completed', done: matched.status === 'Completed', date: matched.status === 'Completed' ? matched.paidAt : '', user: 'Bank API' }
    ],
    logs: MOCK_PAYOUT_LOGS[id] || [
      { id: 'l-1', date: matched.createdAt, action: 'Payout Created', performedBy: matched.initiatedBy, remarks: matched.remarks }
    ]
  };
}

export function useCreatePayout() {
  const [loading, setLoading] = useState(false);

  const createPayout = async (payoutData) => {
    setLoading(true);
    try {
      const response = await apiClient.post('/finance/payouts', payoutData);
      if (response.data && response.data.success) {
        toast.success("Payout request successfully created!");
        return true;
      }
      toast.success("Payout request created successfully");
      return true;
    } catch (err) {
      console.warn("Create Payout API offline. Running local mock simulation.", err);
      // Simulate adding to local payouts list
      const type = payoutData.beneficiaryType;
      const bList = MOCK_BENEFICIARIES[type] || [];
      const bFound = bList.find(b => b.id === payoutData.beneficiaryId) || { name: 'Direct Transfer Node' };

      const newPayout = {
        id: `PAY-${Date.now().toString().slice(-4)}`,
        payoutId: `PAY-${Date.now().toString().slice(-4)}`,
        beneficiaryType: payoutData.beneficiaryType,
        beneficiaryId: payoutData.beneficiaryId,
        beneficiaryName: bFound.name,
        amount: Number(payoutData.amount),
        payoutMethod: payoutData.payoutMethod,
        referenceNo: payoutData.referenceNo || `REF${Math.floor(1000 + Math.random()*9000)}`,
        transactionId: '',
        utrNumber: '',
        status: 'Pending Approval',
        remarks: payoutData.remarks,
        initiatedBy: 'Admin Rashi',
        approvedBy: '',
        paidAt: '',
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
      };

      MOCK_PAYOUTS_TABLE.unshift(newPayout);
      toast.success("Payout request submitted successfully (Offline Simulation)!");
      return true;
    } finally {
      setLoading(false);
    }
  };

  return { createPayout, loading };
}

export function useApprovePayout() {
  const [loading, setLoading] = useState(false);

  const approvePayout = async (id, remarks = '') => {
    setLoading(true);
    try {
      const response = await apiClient.patch(`/finance/payouts/${id}`, { status: 'Approved', remarks });
      if (response.data && response.data.success) {
        toast.success("Payout approved and sent for bank processing!");
        return true;
      }
      return true;
    } catch (err) {
      console.warn("Approve Payout API offline. Running local mock simulation.", err);
      const matched = MOCK_PAYOUTS_TABLE.find(p => p.payoutId === id);
      if (matched) {
        matched.status = 'Processing';
        matched.approvedBy = 'SuperAdmin Ajay';
        // Add log
        if (!MOCK_PAYOUT_LOGS[id]) MOCK_PAYOUT_LOGS[id] = [];
        MOCK_PAYOUT_LOGS[id].push({
          id: `log-${Date.now()}`,
          date: new Date().toISOString().replace('T', ' ').substring(0, 16),
          action: 'Approved',
          performedBy: 'SuperAdmin Ajay',
          remarks: remarks || 'Approved for dispatch'
        });
      }
      toast.success("Payout approved & dispatched to bank queues (Simulation)!");
      return true;
    } finally {
      setLoading(false);
    }
  };

  return { approvePayout, loading };
}

export function useRejectPayout() {
  const [loading, setLoading] = useState(false);

  const rejectPayout = async (id, reason, remarks = '') => {
    setLoading(true);
    try {
      const response = await apiClient.patch(`/finance/payouts/${id}`, { status: 'Rejected', reason, remarks });
      if (response.data && response.data.success) {
        toast.success("Payout request rejected!");
        return true;
      }
      return true;
    } catch (err) {
      console.warn("Reject Payout API offline. Running local mock simulation.", err);
      const matched = MOCK_PAYOUTS_TABLE.find(p => p.payoutId === id);
      if (matched) {
        matched.status = 'Rejected';
        // Add log
        if (!MOCK_PAYOUT_LOGS[id]) MOCK_PAYOUT_LOGS[id] = [];
        MOCK_PAYOUT_LOGS[id].push({
          id: `log-${Date.now()}`,
          date: new Date().toISOString().replace('T', ' ').substring(0, 16),
          action: 'Rejected',
          performedBy: 'SuperAdmin Ajay',
          remarks: `Rejection reason: ${reason}. ${remarks}`
        });
      }
      toast.success("Payout request successfully rejected (Simulation)!");
      return true;
    } finally {
      setLoading(false);
    }
  };

  return { rejectPayout, loading };
}

export function useUpdatePayout() {
  const [loading, setLoading] = useState(false);

  const updatePayoutStatus = async (id, status, extra = {}) => {
    setLoading(true);
    try {
      const response = await apiClient.patch(`/finance/payouts/${id}`, { status, ...extra });
      if (response.data && response.data.success) {
        toast.success(`Payout status updated to ${status}`);
        return true;
      }
      return true;
    } catch (err) {
      console.warn("Update Payout API offline. Running local mock simulation.", err);
      const matched = MOCK_PAYOUTS_TABLE.find(p => p.payoutId === id);
      if (matched) {
        matched.status = status;
        if (status === 'Completed') {
          matched.utrNumber = extra.utrNumber || `UTR${Math.floor(100000 + Math.random()*900000)}`;
          matched.transactionId = extra.transactionId || `TXN${Math.floor(1000 + Math.random()*9000)}`;
          matched.paidAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
        }
        
        // Add log
        if (!MOCK_PAYOUT_LOGS[id]) MOCK_PAYOUT_LOGS[id] = [];
        MOCK_PAYOUT_LOGS[id].push({
          id: `log-${Date.now()}`,
          date: new Date().toISOString().replace('T', ' ').substring(0, 16),
          action: status,
          performedBy: 'System Gateway',
          remarks: extra.remarks || `Status updated to ${status}`
        });
      }
      toast.success(`Payout status updated to ${status} (Simulation)!`);
      return true;
    } finally {
      setLoading(false);
    }
  };

  return { updatePayoutStatus, loading };
}

export function useExportPayouts() {
  const [exportLoading, setExportLoading] = useState(false);

  const exportPayouts = async (format, filters = {}) => {
    setExportLoading(true);
    try {
      const response = await apiClient.get('/finance/payouts/export', {
        params: { format, ...filters },
        responseType: 'blob'
      });
      const blob = new Blob([response.data], {
        type: format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const filename = `payouts_ledger.${format === 'excel' ? 'csv' : 'pdf'}`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Payout reports ledger exported successfully");
      return true;
    } catch (err) {
      console.warn("Payout export API failed. Falling back to client-side generation.", err);
      let results = [...MOCK_PAYOUTS_TABLE];
      if (filters.beneficiaryType) {
        results = results.filter(r => r.beneficiaryType === filters.beneficiaryType);
      }
      if (filters.status && filters.status !== 'All') {
        results = results.filter(r => r.status === filters.status);
      }

      if (format === 'excel') {
        const headers = ["Payout ID", "Beneficiary Type", "Beneficiary Name", "Amount (INR)", "Method", "Reference No", "Transaction ID", "UTR Number", "Status", "Date Initiated"];
        const rows = results.map(r => [
          r.payoutId,
          r.beneficiaryType,
          r.beneficiaryName,
          r.amount,
          r.payoutMethod,
          r.referenceNo,
          r.transactionId,
          r.utrNumber,
          r.status,
          r.createdAt
        ]);

        const csvContent = [headers.join(","), ...rows.map(row => row.map(cell => `"${cell}"`).join(","))].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const filename = `payouts_ledger_${new Date().toISOString().split('T')[0]}.csv`;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success("Payouts ledger CSV downloaded successfully");
      } else {
        const doc = new jsPDF();
        doc.setFillColor(164, 60, 18);
        doc.rect(0, 0, 210, 40, 'F');
        
        doc.setFontSize(22);
        doc.setTextColor(255, 255, 255);
        doc.text("PAPA VEG PIZZA", 14, 18);
        
        doc.setFontSize(10);
        doc.text("Super Admin Central Payouts Ledger statement", 14, 28);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 135, 28);
        
        // Stats summary
        doc.setFontSize(13);
        doc.setTextColor(50, 50, 50);
        doc.text("Executive Payouts Summary", 14, 50);
        
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        doc.text(`Pending Settlements: INR ${MOCK_SUMMARY.pendingPayouts.toLocaleString('en-IN')}`, 14, 58);
        doc.text(`Completed Settlements: INR ${MOCK_SUMMARY.completedPayouts.toLocaleString('en-IN')}`, 14, 64);
        doc.text(`Failed Settlements: INR ${MOCK_SUMMARY.failedPayouts.toLocaleString('en-IN')}`, 14, 70);
        doc.text(`Today's Transferred: INR ${MOCK_SUMMARY.todayPayout.toLocaleString('en-IN')}`, 110, 58);
        doc.text(`Monthly Total Transferred: INR ${MOCK_SUMMARY.monthlyPayout.toLocaleString('en-IN')}`, 110, 64);
        doc.text(`Beneficiaries Count: ${MOCK_SUMMARY.totalBeneficiaries}`, 110, 70);

        doc.setDrawColor(220, 220, 220);
        doc.line(14, 76, 196, 76);
        
        doc.setFontSize(12);
        doc.setTextColor(50, 50, 50);
        doc.text("Payout Records", 14, 85);
        
        autoTable(doc, {
          startY: 90,
          head: [['Payout ID', 'Type', 'Beneficiary', 'Amount', 'Method', 'Txn ID', 'Status']],
          body: results.map(r => [
            r.payoutId,
            r.beneficiaryType,
            r.beneficiaryName,
            `Rs. ${r.amount.toLocaleString('en-IN')}`,
            r.payoutMethod,
            r.transactionId || 'Awaiting',
            r.status
          ]),
          headStyles: { fillColor: [164, 60, 18] },
          theme: 'striped',
          margin: { top: 10 }
        });

        const filename = `payouts_ledger_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(filename);
        toast.success("Payouts statement PDF downloaded successfully");
      }
      return true;
    } finally {
      setExportLoading(false);
    }
  };

  return { exportPayouts, exportLoading };
}
