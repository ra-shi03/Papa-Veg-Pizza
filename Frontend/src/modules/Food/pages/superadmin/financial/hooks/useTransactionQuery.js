import { useState, useEffect, useCallback } from 'react';
import apiClient from '../../../../../../services/api/axios';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

// Mock summary metrics
const MOCK_SUMMARY = {
  totalTransactions: 24842550,
  successfulTransactions: 23700000,
  failedTransactions: 540000,
  refundedTransactions: 320000,
  pendingTransactions: 182000,
  successRate: 95.4,
  totalTrend: +12.4,
  successTrend: +14.2,
  failedTrend: -4.8,
  refundTrend: +1.5,
  pendingTrend: -8.3
};

// Mock Master Transactions Table Data
const MOCK_TRANSACTIONS = [
  { id: 'TXN100145', transactionId: 'TXN100145', type: 'Order Payment', orderId: 'ORD100145', customerId: 'cust-101', customerName: 'Rahul Verma', customerPhone: '9827011234', franchiseId: 'fran-bhopal', franchiseName: 'Bhopal Central', storeId: 'store-mpnagar', storeName: 'MP Nagar Store', amount: 650, gateway: 'Razorpay', paymentMethod: 'UPI', status: 'Completed', referenceId: 'REF785421', gatewayTransactionId: 'pay_MN785462', createdAt: '2026-06-18 10:22' },
  { id: 'TXN100146', transactionId: 'TXN100146', type: 'Refund', orderId: 'ORD100140', customerId: 'cust-102', customerName: 'Neha Sharma', customerPhone: '9981044321', franchiseId: 'fran-indore', franchiseName: 'Indore Central', storeId: 'store-vijaynagar', storeName: 'Vijay Nagar Store', amount: 350, gateway: 'Paytm', paymentMethod: 'Wallet', status: 'Refunded', referenceId: 'REF785422', gatewayTransactionId: 'pay_PT993214', createdAt: '2026-06-18 09:15' },
  { id: 'TXN100147', transactionId: 'TXN100147', type: 'Order Payment', orderId: 'ORD100146', customerId: 'cust-103', customerName: 'Amit Patel', customerPhone: '9752011987', franchiseId: 'fran-mumbai', franchiseName: 'Mumbai Premium', storeId: 'store-bandrawest', storeName: 'Bandra West Store', amount: 1250, gateway: 'Stripe', paymentMethod: 'Card', status: 'Failed', referenceId: 'REF785423', gatewayTransactionId: 'ch_ST389145', createdAt: '2026-06-18 08:40', errorMessage: 'Stripe Error: card_declined. The card has insufficient funds.' },
  { id: 'TXN100148', transactionId: 'TXN100148', type: 'Wallet', orderId: 'ORD-WL-990', customerId: 'cust-104', customerName: 'Vikram Singh', customerPhone: '9425022334', franchiseId: '', franchiseName: 'Direct Platform', storeId: '', storeName: 'Online App Wallet', amount: 500, gateway: 'CashFree', paymentMethod: 'Net Banking', status: 'Completed', referenceId: 'REF785424', gatewayTransactionId: 'cf_TXN990142', createdAt: '2026-06-17 18:30' },
  { id: 'TXN100149', transactionId: 'TXN100149', type: 'Franchise Payment', orderId: 'SET-FR-42', customerId: '', customerName: 'Nitin Gupta (Indore)', customerPhone: '9893011445', franchiseId: 'fran-indore', franchiseName: 'Indore Central Franchise', storeId: '', storeName: 'Corporate settlement Node', amount: 45000, gateway: 'Razorpay', paymentMethod: 'Net Banking', status: 'Completed', referenceId: 'REF785425', gatewayTransactionId: 'pay_RZ980145', createdAt: '2026-06-17 14:10' },
  { id: 'TXN100150', transactionId: 'TXN100150', type: 'Payout', orderId: 'PAY-1049', customerId: '', customerName: 'Ramesh Kumar (Rider)', customerPhone: '9765088210', franchiseId: '', franchiseName: 'Rider Incentive Pool', storeId: '', storeName: 'Clearance Node', amount: 12500, gateway: 'CashFree', paymentMethod: 'UPI', status: 'Pending', referenceId: 'REF785426', gatewayTransactionId: '', createdAt: '2026-06-17 11:00' },
  { id: 'TXN100151', transactionId: 'TXN100151', type: 'Coupon Adjustment', orderId: 'ORD100139', customerId: 'cust-105', customerName: 'Sanjay Dutt', customerPhone: '9300055443', franchiseId: 'fran-bhopal', franchiseName: 'Bhopal Central', storeId: 'store-mpnagar', storeName: 'MP Nagar Store', amount: 150, gateway: 'Razorpay', paymentMethod: 'UPI', status: 'Completed', referenceId: 'REF785427', gatewayTransactionId: 'pay_RZ987456', createdAt: '2026-06-16 19:20' },
  { id: 'TXN100152', transactionId: 'TXN100152', type: 'Order Payment', orderId: 'ORD100147', customerId: 'cust-106', customerName: 'Karan Johar', customerPhone: '9923891024', franchiseId: 'fran-mumbai', franchiseName: 'Mumbai Premium', storeId: 'store-bandrawest', storeName: 'Bandra West Store', amount: 840, gateway: 'Paytm', paymentMethod: 'UPI', status: 'Authorized', referenceId: 'REF785428', gatewayTransactionId: 'pay_PT778942', createdAt: '2026-06-18 10:45' }
];

// Mock Webhooks List
const MOCK_WEBHOOKS = {
  'TXN100145': [
    { id: 'w-1', event: 'payment.authorized', timestamp: '2026-06-18 10:22:05', response: '{"status":200,"message":"Event processed"}' },
    { id: 'w-2', event: 'payment.captured', timestamp: '2026-06-18 10:22:15', response: '{"status":200,"message":"Ledger updated"}' }
  ],
  'TXN100146': [
    { id: 'w-1', event: 'refund.processed', timestamp: '2026-06-18 09:15:30', response: '{"status":200,"message":"Refund ledger synchronized"}' }
  ],
  'TXN100147': [
    { id: 'w-1', event: 'payment.failed', timestamp: '2026-06-18 08:40:12', response: '{"status":200,"message":"Notification dispatched to customer"}' }
  ]
};

// Mock Retries List
const MOCK_RETRIES = {
  'TXN100147': [
    { id: 'r-1', retryCount: 1, retryReason: 'Network Timeout (Secondary Gate)', createdAt: '2026-06-18 08:42:00' },
    { id: 'r-2', retryCount: 2, retryReason: 'Card Declined - Insufficient balance', createdAt: '2026-06-18 08:45:00' }
  ]
};

// Fetch Summary aggregate metrics
export function useTransactionSummary(filters) {
  const [data, setData] = useState(MOCK_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/finance/transactions/summary', { params: filters });
      if (response.data && response.data.success) {
        setData(response.data.data);
      } else {
        setData(response.data || MOCK_SUMMARY);
      }
    } catch (err) {
      console.warn("Using mock transaction summary as backend is offline.", err);
      let factor = 1.0;
      if (filters?.gateway) factor *= 0.45;
      if (filters?.type) factor *= 0.25;

      setData({
        totalTransactions: Math.round(MOCK_SUMMARY.totalTransactions * factor),
        successfulTransactions: Math.round(MOCK_SUMMARY.successfulTransactions * factor),
        failedTransactions: Math.round(MOCK_SUMMARY.failedTransactions * factor),
        refundedTransactions: Math.round(MOCK_SUMMARY.refundedTransactions * factor),
        pendingTransactions: Math.round(MOCK_SUMMARY.pendingTransactions * factor),
        successRate: filters?.gateway === 'Razorpay' ? 97.2 : MOCK_SUMMARY.successRate,
        totalTrend: MOCK_SUMMARY.totalTrend,
        successTrend: MOCK_SUMMARY.successTrend,
        failedTrend: MOCK_SUMMARY.failedTrend,
        refundTrend: MOCK_SUMMARY.refundTrend,
        pendingTrend: MOCK_SUMMARY.pendingTrend
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

// Fetch Paginated Transactions Table list
export function useTransactions(filters, pagination) {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };
      const response = await apiClient.get('/finance/transactions', { params });
      if (response.data && response.data.success) {
        setData(response.data.data);
        setTotal(response.data.pagination?.total || response.data.total || response.data.data.length);
      } else {
        setData(response.data.data || MOCK_TRANSACTIONS);
        setTotal(response.data.total || MOCK_TRANSACTIONS.length);
      }
    } catch (err) {
      console.warn("Using mock transactions table ledger as backend is offline.", err);
      let results = [...MOCK_TRANSACTIONS];

      // Filtering criteria mapping
      if (filters?.gateway && filters.gateway !== 'All') {
        results = results.filter(r => r.gateway === filters.gateway);
      }
      if (filters?.paymentMethod && filters.paymentMethod !== 'All') {
        results = results.filter(r => r.paymentMethod === filters.paymentMethod);
      }
      if (filters?.type && filters.type !== 'All') {
        results = results.filter(r => r.type === filters.type);
      }
      if (filters?.status && filters.status !== 'All') {
        results = results.filter(r => r.status === filters.status);
      }
      if (filters?.franchiseId) {
        results = results.filter(r => r.franchiseId === filters.franchiseId);
      }
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        results = results.filter(r => 
          r.transactionId.toLowerCase().includes(q) ||
          r.orderId.toLowerCase().includes(q) ||
          r.customerName.toLowerCase().includes(q) ||
          r.referenceId.toLowerCase().includes(q)
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
    fetchTransactions();
  }, [fetchTransactions]);

  return { data, total, loading, error, refetch: fetchTransactions };
}

// Fetch Detailed Transaction ledger trace details
export function useTransactionDetails(id) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDetails = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`/finance/transactions/${id}`);
      if (response.data && response.data.success) {
        setData(response.data.data);
      } else {
        setData(response.data || generateMockTransactionDetails(id));
      }
    } catch (err) {
      console.warn("Using mock transaction details as backend is offline.", err);
      setData(generateMockTransactionDetails(id));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  return { data, loading, error, refetch: fetchDetails };
}

function generateMockTransactionDetails(id) {
  const matched = MOCK_TRANSACTIONS.find(t => t.transactionId === id) || MOCK_TRANSACTIONS[0];
  
  // Custom timeline based on status
  const timeline = [
    { step: 'Created', done: true, date: '18-Jun 10:00 AM', user: 'System Customer Node' },
    { step: 'Authorized', done: matched.status !== 'Failed', date: matched.status !== 'Failed' ? '18-Jun 10:10 AM' : '', user: matched.gateway }
  ];

  if (matched.status === 'Completed' || matched.status === 'Refunded') {
    timeline.push({ step: 'Captured', done: true, date: '18-Jun 10:15 AM', user: 'Gateway Webhook' });
    timeline.push({ step: 'Completed', done: true, date: matched.createdAt, user: 'Settlement Service' });
  } else if (matched.status === 'Failed') {
    timeline.push({ step: 'Failed', done: true, date: matched.createdAt, user: matched.gateway + ' API' });
  } else if (matched.status === 'Refunded') {
    timeline.push({ step: 'Refunded', done: true, date: matched.createdAt, user: 'Finance Admin' });
  }

  // Predefined payloads
  const requestPayload = {
    amount: matched.amount,
    currency: 'INR',
    method: matched.paymentMethod.toLowerCase(),
    email: `${matched.customerName.toLowerCase().replace(' ', '')}@example.com`,
    contact: matched.customerPhone,
    order_id: matched.orderId,
    notes: {
      franchise: matched.franchiseName,
      store: matched.storeName
    }
  };

  const responsePayload = {
    id: matched.gatewayTransactionId || 'pay_ERR998124',
    entity: 'payment',
    amount: matched.amount * 100,
    currency: 'INR',
    status: matched.status.toLowerCase() === 'completed' ? 'captured' : matched.status.toLowerCase(),
    order_id: matched.orderId,
    invoice_id: null,
    international: false,
    method: matched.paymentMethod.toLowerCase(),
    amount_refunded: matched.status === 'Refunded' ? matched.amount * 100 : 0,
    refund_status: matched.status === 'Refunded' ? 'full' : null,
    captured: matched.status === 'Completed',
    description: `Purchase of Pizza Order: ${matched.orderId}`,
    card_id: matched.paymentMethod === 'Card' ? 'card_88120412' : null,
    bank: matched.paymentMethod === 'Net Banking' ? 'HDFC' : null,
    wallet: matched.paymentMethod === 'Wallet' ? 'paytm' : null,
    vpa: matched.paymentMethod === 'UPI' ? `${matched.customerPhone}@okaxis` : null,
    error_code: matched.errorMessage ? 'BAD_REQUEST_ERROR' : null,
    error_description: matched.errorMessage || null
  };

  return {
    transactionInfo: {
      transactionId: matched.transactionId,
      gatewayTransactionId: matched.gatewayTransactionId || 'pay_AWAITING',
      referenceId: matched.referenceId,
      amount: matched.amount,
      gateway: matched.gateway,
      paymentMethod: matched.paymentMethod,
      status: matched.status,
      createdAt: matched.createdAt,
      errorMessage: matched.errorMessage
    },
    orderInfo: {
      orderNumber: matched.orderId,
      customerId: matched.customerId,
      customerName: matched.customerName,
      franchiseName: matched.franchiseName || 'Direct Outlet',
      storeName: matched.storeName || 'Online App'
    },
    customerInfo: {
      name: matched.customerName,
      phone: matched.customerPhone
    },
    gatewayResponse: responsePayload,
    requestPayload,
    responsePayload,
    webhookLogs: MOCK_WEBHOOKS[id] || [],
    retryHistory: MOCK_RETRIES[id] || [],
    timeline
  };
}

// Reconcile retry transaction
export function useRetryTransaction() {
  const [loading, setLoading] = useState(false);

  const retryTransaction = async (id, reason, remarks = '') => {
    setLoading(true);
    try {
      const response = await apiClient.patch(`/finance/transactions/${id}/retry`, { reason, remarks });
      if (response.data && response.data.success) {
        toast.success("Transaction reconciliation triggered successfully!");
        return true;
      }
      return true;
    } catch (err) {
      console.warn("Reconcile API offline. Simulating offline adjustment.", err);
      const matched = MOCK_TRANSACTIONS.find(t => t.transactionId === id);
      if (matched) {
        matched.status = 'Completed';
        matched.gatewayTransactionId = `pay_RETRY_${Math.floor(100000 + Math.random()*900000)}`;
        matched.createdAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
        
        // Add retry log
        if (!MOCK_RETRIES[id]) MOCK_RETRIES[id] = [];
        MOCK_RETRIES[id].push({
          id: `r-${Date.now()}`,
          retryCount: MOCK_RETRIES[id].length + 1,
          retryReason: reason + '. Remarks: ' + remarks,
          createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
        });
      }
      toast.success("Manual retry reconciliation ledger cleared (Simulation)!");
      return true;
    } finally {
      setLoading(false);
    }
  };

  return { retryTransaction, loading };
}

// Export Transactions ledger statements
export function useExportTransactions() {
  const [exportLoading, setExportLoading] = useState(false);

  const exportTransactions = async (format, filters = {}) => {
    setExportLoading(true);
    try {
      const response = await apiClient.get('/finance/transactions/export', {
        params: { format, ...filters },
        responseType: 'blob'
      });
      const blob = new Blob([response.data], {
        type: format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const filename = `transactions_ledger.${format === 'excel' ? 'csv' : 'pdf'}`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Transaction reports exported successfully");
      return true;
    } catch (err) {
      console.warn("Transaction export API offline. Triggering client-side export.", err);
      let results = [...MOCK_TRANSACTIONS];
      if (filters.gateway && filters.gateway !== 'All') {
        results = results.filter(r => r.gateway === filters.gateway);
      }
      if (filters.status && filters.status !== 'All') {
        results = results.filter(r => r.status === filters.status);
      }

      if (format === 'excel' || format === 'csv') {
        const headers = ["Txn ID", "Type", "Order ID", "Customer", "Amount (INR)", "Gateway", "Payment Method", "Status", "Date Created"];
        const rows = results.map(r => [
          r.transactionId,
          r.type,
          r.orderId,
          r.customerName,
          r.amount,
          r.gateway,
          r.paymentMethod,
          r.status,
          r.createdAt
        ]);

        const csvContent = [headers.join(","), ...rows.map(row => row.map(cell => `"${cell}"`).join(","))].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const filename = `transactions_ledger_${new Date().toISOString().split('T')[0]}.csv`;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success("CSV transactions downloaded successfully");
      } else {
        const doc = new jsPDF();
        
        doc.setFillColor(164, 60, 18);
        doc.rect(0, 0, 210, 40, 'F');
        
        doc.setFontSize(22);
        doc.setTextColor(255, 255, 255);
        doc.text("PAPA VEG PIZZA", 14, 18);
        
        doc.setFontSize(10);
        doc.text("Super Admin central transactions ledger", 14, 28);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 130, 28);
        
        doc.setFontSize(12);
        doc.setTextColor(50, 50, 50);
        doc.text("Transaction Records Ledger Statement", 14, 52);
        
        autoTable(doc, {
          startY: 58,
          head: [['Txn ID', 'Type', 'Order ID', 'Customer', 'Amount', 'Gateway', 'Method', 'Status']],
          body: results.map(r => [
            r.transactionId,
            r.type,
            r.orderId,
            r.customerName,
            `Rs. ${r.amount.toLocaleString('en-IN')}`,
            r.gateway,
            r.paymentMethod,
            r.status
          ]),
          headStyles: { fillColor: [164, 60, 18] },
          theme: 'striped',
          margin: { top: 10 }
        });

        const filename = `transactions_statement_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(filename);
        toast.success("Transactions statement PDF downloaded successfully");
      }
      return true;
    } finally {
      setExportLoading(false);
    }
  };

  return { exportTransactions, exportLoading };
}
