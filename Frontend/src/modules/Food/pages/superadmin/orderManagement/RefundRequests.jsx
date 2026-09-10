import React, { useState, useEffect } from 'react';
import { 
  CreditCard, Search, Bell, Clock, AlertTriangle, Filter, Download, 
  MoreVertical, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Eye, 
  ArrowUpDown, RefreshCw, ShieldCheck, DollarSign, Calendar, HelpCircle, History
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  getRefundRequests, mockActivityLogs, useDebounce 
} from './RefundRequestsData';
import RefundDetailsDrawer from './components/RefundDetailsDrawer';
import ApproveRefundModal from './components/ApproveRefundModal';
import RejectRefundModal from './components/RejectRefundModal';
import RefundHistoryModal from './components/RefundHistoryModal';
import ExportRefundsModal from './components/ExportRefundsModal';

export default function RefundRequests() {
  // Database States
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter States
  const [searchRefund, setSearchRefund] = useState('');
  const [searchOrder, setSearchOrder] = useState('');
  const [searchCustomer, setSearchCustomer] = useState('');
  const [gatewayFilter, setGatewayFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Date states
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Active filters applied to the server call
  const [appliedFilters, setAppliedFilters] = useState({
    refundId: '',
    orderId: '',
    customer: '',
    gateway: 'All',
    status: 'All',
    fromDate: '',
    toDate: ''
  });

  // Table Configuration States
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(5);

  // Debounced Values for search inputs
  const debouncedRefund = useDebounce(searchRefund, 300);
  const debouncedOrder = useDebounce(searchOrder, 300);
  const debouncedCustomer = useDebounce(searchCustomer, 300);

  // Selected Action Targets
  const [activeRefund, setActiveRefund] = useState(null);
  const [dropdownOpenId, setDropdownOpenId] = useState(null);
  
  // Modals & Drawers Visibility
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  // Initial Data Fetch
  useEffect(() => {
    fetchRefunds();
  }, []);

  const fetchRefunds = async () => {
    setLoading(true);
    try {
      const data = await getRefundRequests();
      setRefunds(data);
    } catch (err) {
      toast.error('Failed to load refund requests');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await getRefundRequests();
      setRefunds(data);
      toast.success('Refund request records refreshed');
    } catch (err) {
      toast.error('Refresh failed');
    } finally {
      setRefreshing(false);
    }
  };

  // Sync debounced search fields with applied filters
  useEffect(() => {
    setAppliedFilters(prev => ({
      ...prev,
      refundId: debouncedRefund,
      orderId: debouncedOrder,
      customer: debouncedCustomer
    }));
    setCurrentPage(1);
  }, [debouncedRefund, debouncedOrder, debouncedCustomer]);

  const handleApplyDropdownFilters = () => {
    setAppliedFilters(prev => ({
      ...prev,
      gateway: gatewayFilter,
      status: statusFilter,
      fromDate: fromDate,
      toDate: toDate
    }));
    setCurrentPage(1);
    toast.info('Applied search filter metrics');
  };

  const handleResetFilters = () => {
    setSearchRefund('');
    setSearchOrder('');
    setSearchCustomer('');
    setGatewayFilter('All');
    setStatusFilter('All');
    setFromDate('');
    setToDate('');
    setAppliedFilters({
      refundId: '',
      orderId: '',
      customer: '',
      gateway: 'All',
      status: 'All',
      fromDate: '',
      toDate: ''
    });
    setCurrentPage(1);
    toast.info('Filters reset to default configurations');
  };

  // KPI calculations
  const getKpis = () => {
    if (loading) {
      return { pending: 0, approved: 0, rejected: 0, totalAmount: 0, processing: 0, completed: 0 };
    }
    const pending = refunds.filter(r => r.status === 'requested').length;
    const approved = refunds.filter(r => r.status === 'approved').length;
    const rejected = refunds.filter(r => r.status === 'rejected').length;
    const processing = refunds.filter(r => r.status === 'processing').length;
    const completed = refunds.filter(r => r.status === 'completed').length;
    
    // Sum amount of approved, processing, and completed
    const totalAmount = refunds
      .filter(r => ['approved', 'processing', 'completed'].includes(r.status))
      .reduce((sum, r) => sum + r.refundAmount, 0);

    return { pending, approved, rejected, totalAmount, processing, completed };
  };

  const kpis = getKpis();

  // Sorting Handler
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  // Filtered and Sorted Refunds list
  const getProcessedRefunds = () => {
    // 1. Filtering
    let result = refunds.map(refund => {
      // Find original customer & payment name for filters/search
      // In real code these are populated or fetched from DB
      const custName = refund.customerId === 'CUST-001' ? 'Rajesh Kumar' : 
                       refund.customerId === 'CUST-002' ? 'Priya Patel' : 
                       refund.customerId === 'CUST-003' ? 'Aarav Mehta' : 
                       refund.customerId === 'CUST-004' ? 'Sunita Gupta' : 
                       refund.customerId === 'CUST-005' ? 'Vikram Singh' : 
                       refund.customerId === 'CUST-006' ? 'Anjali Sharma' : 
                       refund.customerId === 'CUST-007' ? 'Rohan Deshmukh' : 'Kabir Sengupta';

      const gateName = refund.paymentId === 'PAY-001' ? 'Razorpay' : 
                       refund.paymentId === 'PAY-002' ? 'Stripe' : 
                       refund.paymentId === 'PAY-003' ? 'Paytm' : 
                       refund.paymentId === 'PAY-004' ? 'Cashfree' : 'PhonePe';

      const ordNumber = refund.orderId === 'ORD-98421' ? 'PV-98421' : 
                        refund.orderId === 'ORD-98422' ? 'PV-98422' : 
                        refund.orderId === 'ORD-98423' ? 'PV-98423' : 
                        refund.orderId === 'ORD-98424' ? 'PV-98424' : 
                        refund.orderId === 'ORD-98425' ? 'PV-98425' : 
                        refund.orderId === 'ORD-98426' ? 'PV-98426' : 
                        refund.orderId === 'ORD-98427' ? 'PV-98427' : 'PV-98428';

      return {
        ...refund,
        customerName: custName,
        gatewayName: gateName,
        orderNumber: ordNumber
      };
    });

    if (appliedFilters.refundId) {
      result = result.filter(r => r.refundNumber.toLowerCase().includes(appliedFilters.refundId.toLowerCase()));
    }
    if (appliedFilters.orderId) {
      result = result.filter(r => r.orderNumber.toLowerCase().includes(appliedFilters.orderId.toLowerCase()));
    }
    if (appliedFilters.customer) {
      result = result.filter(r => r.customerName.toLowerCase().includes(appliedFilters.customer.toLowerCase()));
    }
    if (appliedFilters.gateway !== 'All') {
      result = result.filter(r => r.gatewayName === appliedFilters.gateway);
    }
    if (appliedFilters.status !== 'All') {
      result = result.filter(r => r.status === appliedFilters.status);
    }
    if (appliedFilters.fromDate) {
      result = result.filter(r => new Date(r.createdAt) >= new Date(appliedFilters.fromDate));
    }
    if (appliedFilters.toDate) {
      // Add one day to toDate to make it inclusive
      const endLimit = new Date(appliedFilters.toDate);
      endLimit.setDate(endLimit.getDate() + 1);
      result = result.filter(r => new Date(r.createdAt) <= endLimit);
    }

    // 2. Sorting
    result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === 'createdAt') {
        aVal = new Date(a.createdAt).getTime();
        bVal = new Date(b.createdAt).getTime();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  };

  const processedRefunds = getProcessedRefunds();

  // Pagination bounds
  const totalPages = Math.ceil(processedRefunds.length / rowsPerPage) || 1;
  const paginatedRefunds = processedRefunds.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Success actions from modals
  const handleMutationSuccess = (updatedRefund) => {
    setRefunds(prev => prev.map(r => r._id === updatedRefund._id ? updatedRefund : r));
    setDropdownOpenId(null);
  };

  const getStatusChipStyle = (status) => {
    switch (status) {
      case 'requested': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-750 dark:text-yellow-400 border border-yellow-200/50';
      case 'under_review': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-755 dark:text-orange-400 border border-orange-200/50';
      case 'approved': return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-755 dark:text-emerald-400 border border-emerald-200/50';
      case 'processing': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-755 dark:text-blue-400 border border-blue-200/50';
      case 'completed': return 'bg-green-100 dark:bg-green-900/30 text-green-755 dark:text-green-400 border border-green-200/50';
      case 'rejected': return 'bg-red-100 dark:bg-red-900/30 text-red-755 dark:text-red-400 border border-red-200/50';
      default: return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-550 border border-zinc-200';
    }
  };

  const getGatewayBadgeStyle = (gateway) => {
    switch (gateway) {
      case 'Razorpay': return 'bg-blue-500/10 text-blue-600 border border-blue-500/20';
      case 'Stripe': return 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/20';
      case 'Paytm': return 'bg-cyan-500/10 text-cyan-600 border border-cyan-500/20';
      case 'Cashfree': return 'bg-teal-500/10 text-teal-600 border border-teal-500/20';
      case 'PhonePe': return 'bg-purple-500/10 text-purple-600 border border-purple-500/20';
      default: return 'bg-zinc-500/10 text-zinc-600 border border-zinc-500/20';
    }
  };

  return (
    <div className="p-3 md:p-4 pb-12 max-w-7xl mx-auto bg-zinc-50 dark:bg-zinc-955 min-h-screen w-full space-y-4">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3 pt-2">
        <div className="space-y-0.5">
          <h1 className="text-lg font-bold text-black dark:text-white leading-tight flex items-center gap-2">
            <CreditCard className="text-[var(--primary)] shrink-0" size={20} />
            <span>Refund Claims Central Panel</span>
          </h1>
          <p className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">
            Monitor, approve, and audit customer cashbacks across Razorpay, Stripe, and Paytm integrations.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto sm:justify-end">
          <button 
            onClick={handleRefresh}
            disabled={loading || refreshing}
            className="p-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-black dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-805 transition-colors relative shrink-0 disabled:opacity-50 cursor-pointer"
            title="Refresh Table Data"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={() => setExportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--primary)] text-white border border-transparent rounded-lg hover:opacity-90 active:scale-95 transition-all text-xs font-bold shadow-md cursor-pointer"
          >
            <Download size={13} />
            <span>Configure Export</span>
          </button>
        </div>
      </div>

      {/* 6 Bento KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* KPI 1: Pending (requested) */}
        <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all hover:shadow-md border-l-4 border-l-yellow-500">
          {loading ? (
            <div className="animate-pulse space-y-2">
              <div className="h-3 bg-zinc-200 dark:bg-zinc-850 rounded w-2/3"></div>
              <div className="h-6 bg-zinc-200 dark:bg-zinc-850 rounded w-1/3"></div>
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Requested / Review</span>
              <div className="flex justify-between items-end mt-1">
                <span className="text-lg font-black text-yellow-600 dark:text-yellow-400">{kpis.pending}</span>
                <Clock size={14} className="text-yellow-500 mb-0.5" />
              </div>
            </div>
          )}
        </div>

        {/* KPI 2: Approved */}
        <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all hover:shadow-md border-l-4 border-l-emerald-500">
          {loading ? (
            <div className="animate-pulse space-y-2">
              <div className="h-3 bg-zinc-200 dark:bg-zinc-850 rounded w-2/3"></div>
              <div className="h-6 bg-zinc-200 dark:bg-zinc-850 rounded w-1/3"></div>
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Approved Releases</span>
              <div className="flex justify-between items-end mt-1">
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">{kpis.approved}</span>
                <CheckCircle2 size={14} className="text-emerald-500 mb-0.5" />
              </div>
            </div>
          )}
        </div>

        {/* KPI 3: Rejected */}
        <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all hover:shadow-md border-l-4 border-l-red-500">
          {loading ? (
            <div className="animate-pulse space-y-2">
              <div className="h-3 bg-zinc-200 dark:bg-zinc-850 rounded w-2/3"></div>
              <div className="h-6 bg-zinc-200 dark:bg-zinc-850 rounded w-1/3"></div>
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Rejected Claims</span>
              <div className="flex justify-between items-end mt-1">
                <span className="text-lg font-black text-red-600 dark:text-red-400">{kpis.rejected}</span>
                <XCircle size={14} className="text-red-500 mb-0.5" />
              </div>
            </div>
          )}
        </div>

        {/* KPI 4: Processing */}
        <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all hover:shadow-md border-l-4 border-l-orange-500">
          {loading ? (
            <div className="animate-pulse space-y-2">
              <div className="h-3 bg-zinc-200 dark:bg-zinc-850 rounded w-2/3"></div>
              <div className="h-6 bg-zinc-200 dark:bg-zinc-850 rounded w-1/3"></div>
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">In-Gateway Processing</span>
              <div className="flex justify-between items-end mt-1">
                <span className="text-lg font-black text-orange-600 dark:text-orange-400">{kpis.processing}</span>
                <RefreshCw size={14} className="text-orange-500 mb-0.5 animate-spin-slow" />
              </div>
            </div>
          )}
        </div>

        {/* KPI 5: Completed */}
        <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all hover:shadow-md border-l-4 border-l-green-650">
          {loading ? (
            <div className="animate-pulse space-y-2">
              <div className="h-3 bg-zinc-200 dark:bg-zinc-850 rounded w-2/3"></div>
              <div className="h-6 bg-zinc-200 dark:bg-zinc-850 rounded w-1/3"></div>
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Settled Completed</span>
              <div className="flex justify-between items-end mt-1">
                <span className="text-lg font-black text-green-600 dark:text-green-500">{kpis.completed}</span>
                <ShieldCheck size={14} className="text-green-600 mb-0.5" />
              </div>
            </div>
          )}
        </div>

        {/* KPI 6: Total release amount */}
        <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all hover:shadow-md border-l-4 border-l-blue-500">
          {loading ? (
            <div className="animate-pulse space-y-2">
              <div className="h-3 bg-zinc-200 dark:bg-zinc-850 rounded w-2/3"></div>
              <div className="h-6 bg-zinc-200 dark:bg-zinc-850 rounded w-1/3"></div>
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Total Release (INR)</span>
              <div className="flex justify-between items-end mt-1">
                <span className="text-base font-black text-blue-600 dark:text-blue-400 font-mono">₹{kpis.totalAmount.toFixed(0)}</span>
                <DollarSign size={14} className="text-blue-500 mb-0.5" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Filters Section */}
      <div className="sticky top-0 z-30 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 p-3 rounded-xl shadow-sm space-y-3">
        <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
          <Filter size={11} /> Filters and Search Parameters
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-semibold">
          {/* Search inputs */}
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400"><Search size={13} /></span>
            <input 
              type="text" 
              placeholder="Search Refund ID..."
              value={searchRefund}
              onChange={(e) => setSearchRefund(e.target.value)}
              className="w-full h-8 pl-8 pr-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg outline-none focus:ring-2 focus:ring-[var(--primary)] placeholder-zinc-500"
            />
          </div>

          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400"><Search size={13} /></span>
            <input 
              type="text" 
              placeholder="Search Order Number..."
              value={searchOrder}
              onChange={(e) => setSearchOrder(e.target.value)}
              className="w-full h-8 pl-8 pr-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg outline-none focus:ring-2 focus:ring-[var(--primary)] placeholder-zinc-500"
            />
          </div>

          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400"><Search size={13} /></span>
            <input 
              type="text" 
              placeholder="Search Customer..."
              value={searchCustomer}
              onChange={(e) => setSearchCustomer(e.target.value)}
              className="w-full h-8 pl-8 pr-3 bg-zinc-50 dark:bg-zinc-955 border border-zinc-250 dark:border-zinc-800 rounded-lg outline-none focus:ring-2 focus:ring-[var(--primary)] placeholder-zinc-500"
            />
          </div>

          {/* Gateway Filter */}
          <div className="flex gap-2">
            <select 
              value={gatewayFilter}
              onChange={(e) => setGatewayFilter(e.target.value)}
              className="flex-1 h-8 px-2.5 bg-zinc-50 dark:bg-zinc-955 border border-zinc-250 dark:border-zinc-800 rounded-lg text-zinc-700 dark:text-zinc-350 outline-none"
            >
              <option value="All">All Gateways</option>
              <option value="Razorpay">Razorpay</option>
              <option value="Stripe">Stripe</option>
              <option value="Paytm">Paytm</option>
              <option value="Cashfree">Cashfree</option>
              <option value="PhonePe">PhonePe</option>
            </select>

            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 h-8 px-2.5 bg-zinc-50 dark:bg-zinc-955 border border-zinc-250 dark:border-zinc-800 rounded-lg text-zinc-700 dark:text-zinc-350 outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="requested">Requested</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Extended filters (Date range and buttons) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          {/* Date range picker */}
          <div className="flex items-center gap-2 w-full sm:w-auto text-xs">
            <span className="text-zinc-400 shrink-0 font-bold uppercase text-[9px]">Date From:</span>
            <input 
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-8 px-2 bg-zinc-50 dark:bg-zinc-955 border border-zinc-250 dark:border-zinc-800 rounded-lg text-zinc-650"
            />
            <span className="text-zinc-400 shrink-0 font-bold uppercase text-[9px]">To:</span>
            <input 
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-8 px-2 bg-zinc-50 dark:bg-zinc-955 border border-zinc-250 dark:border-zinc-800 rounded-lg text-zinc-650"
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 w-full sm:w-auto shrink-0 justify-end">
            <button 
              onClick={handleResetFilters}
              className="h-8 px-4 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-755 dark:text-zinc-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              Reset Filters
            </button>
            <button 
              onClick={handleApplyDropdownFilters}
              className="h-8 px-4 bg-[var(--primary)] text-white hover:opacity-90 active:scale-95 rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              Apply Filter Metrics
            </button>
          </div>
        </div>
      </div>

      {/* Request Table Panel */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[950px] text-xs font-semibold">
            <thead className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
              <tr>
                <th className="px-4 py-2.5 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100" onClick={() => handleSort('refundNumber')}>
                  <div className="flex items-center gap-1.5">
                    <span>Refund ID</span>
                    <ArrowUpDown size={11} />
                  </div>
                </th>
                <th className="px-4 py-2.5">Order Number</th>
                <th className="px-4 py-2.5">Customer</th>
                <th className="px-4 py-2.5 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100" onClick={() => handleSort('refundAmount')}>
                  <div className="flex items-center gap-1.5">
                    <span>Amount</span>
                    <ArrowUpDown size={11} />
                  </div>
                </th>
                <th className="px-4 py-2.5 max-w-[200px]">Reason Preview</th>
                <th className="px-4 py-2.5">Gateway</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100" onClick={() => handleSort('createdAt')}>
                  <div className="flex items-center gap-1.5">
                    <span>Requested On</span>
                    <ArrowUpDown size={11} />
                  </div>
                </th>
                <th className="px-4 py-2.5 w-10 text-center"></th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-805">
              {loading ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-4 py-4"><div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4"></div></td>
                    <td className="px-4 py-4"><div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2"></div></td>
                    <td className="px-4 py-4"><div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-2/3"></div></td>
                    <td className="px-4 py-4"><div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3"></div></td>
                    <td className="px-4 py-4"><div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4"></div></td>
                    <td className="px-4 py-4"><div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-12"></div></td>
                    <td className="px-4 py-4"><div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-16"></div></td>
                    <td className="px-4 py-4"><div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-2/3"></div></td>
                    <td className="px-4 py-4"><div className="w-4 h-4 bg-zinc-200 dark:bg-zinc-800 rounded-full"></div></td>
                  </tr>
                ))
              ) : paginatedRefunds.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-4 py-12 text-center text-zinc-550 dark:text-zinc-400 font-bold uppercase tracking-wide">
                    No matching refund requests found.
                  </td>
                </tr>
              ) : (
                paginatedRefunds.map((refund) => (
                  <tr 
                    key={refund._id}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-850/20 transition-all select-none border-l-2 border-l-transparent hover:border-l-[var(--primary)]"
                  >
                    {/* Refund Number */}
                    <td className="px-4 py-3.5 font-bold font-mono tracking-tight text-[var(--primary)]">
                      <button 
                        onClick={() => {
                          setActiveRefund(refund);
                          setDrawerOpen(true);
                        }}
                        className="hover:underline text-left cursor-pointer"
                      >
                        {refund.refundNumber}
                      </button>
                    </td>

                    {/* Order Number */}
                    <td className="px-4 py-3.5 font-mono text-zinc-550 dark:text-zinc-400">{refund.orderNumber}</td>

                    {/* Customer */}
                    <td className="px-4 py-3.5 font-bold text-zinc-800 dark:text-zinc-200">{refund.customerName}</td>

                    {/* Amount */}
                    <td className="px-4 py-3.5 font-bold text-zinc-950 dark:text-zinc-50 font-mono">₹{refund.refundAmount.toFixed(2)}</td>

                    {/* Reason */}
                    <td className="px-4 py-3.5 max-w-[200px] truncate text-zinc-550 dark:text-zinc-450 font-medium group relative" title={refund.reason}>
                      {refund.reason}
                    </td>

                    {/* Gateway */}
                    <td className="px-4 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${getGatewayBadgeStyle(refund.gatewayName)}`}>
                        {refund.gatewayName}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${getStatusChipStyle(refund.status)}`}>
                        {refund.status}
                      </span>
                    </td>

                    {/* Requested Date */}
                    <td className="px-4 py-3.5 text-zinc-500 font-mono text-[10px]">
                      {new Date(refund.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>

                    {/* Actions Context Menu */}
                    <td className="px-4 py-3.5 text-center relative">
                      <button 
                        onClick={() => setDropdownOpenId(prev => prev === refund._id ? null : refund._id)}
                        className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 rounded-lg cursor-pointer transition-colors"
                      >
                        <MoreVertical size={14} />
                      </button>

                      {dropdownOpenId === refund._id && (
                        <>
                          {/* Close dropdown overlay */}
                          <div className="fixed inset-0 z-40" onClick={() => setDropdownOpenId(null)} />
                          
                          {/* Menu Box */}
                          <div className="absolute right-4 mt-1 w-36 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-750 shadow-xl rounded-xl z-50 py-1.5 text-left animate-in fade-in slide-in-from-top-1 duration-150">
                            <button 
                              onClick={() => {
                                setActiveRefund(refund);
                                setDrawerOpen(true);
                                setDropdownOpenId(null);
                              }}
                              className="w-full px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-750/50 flex items-center gap-1.5 cursor-pointer text-zinc-700 dark:text-zinc-300 font-bold"
                            >
                              <Eye size={12} />
                              <span>View details</span>
                            </button>

                            {(refund.status === 'requested' || refund.status === 'under_review') && (
                              <>
                                <button 
                                  onClick={() => {
                                    setActiveRefund(refund);
                                    setApproveModalOpen(true);
                                    setDropdownOpenId(null);
                                  }}
                                  className="w-full px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-750/50 flex items-center gap-1.5 cursor-pointer text-emerald-600 dark:text-emerald-400 font-bold"
                                >
                                  <CheckCircle2 size={12} />
                                  <span>Approve Release</span>
                                </button>
                                <button 
                                  onClick={() => {
                                    setActiveRefund(refund);
                                    setRejectModalOpen(true);
                                    setDropdownOpenId(null);
                                  }}
                                  className="w-full px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-750/50 flex items-center gap-1.5 cursor-pointer text-red-650 dark:text-red-400 font-bold"
                                >
                                  <XCircle size={12} />
                                  <span>Reject Claim</span>
                                </button>
                              </>
                            )}

                            <button 
                              onClick={() => {
                                setActiveRefund(refund);
                                setHistoryModalOpen(true);
                                setDropdownOpenId(null);
                              }}
                              className="w-full px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-750/50 flex items-center gap-1.5 cursor-pointer text-zinc-700 dark:text-zinc-300 font-bold border-t border-zinc-100 dark:border-zinc-750/50 mt-1"
                            >
                              <History size={12} />
                              <span>Audit History</span>
                            </button>
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination footer */}
        <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-3 bg-zinc-50 dark:bg-zinc-900/50">
          <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
            Showing {paginatedRefunds.length} of {processedRefunds.length} filtered requests
          </span>
          
          <div className="flex items-center gap-1.5">
            <button 
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-805 text-zinc-700 dark:text-zinc-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft size={13} />
            </button>
            
            {Array.from({ length: totalPages }).map((_, idx) => {
              const p = idx + 1;
              const isActive = currentPage === p;
              return (
                <button 
                  key={p}
                  onClick={() => handlePageChange(p)}
                  className={`w-7 h-7 flex items-center justify-center rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-[var(--primary)] text-white shadow-sm' 
                      : 'border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-805 bg-transparent text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  {p}
                </button>
              );
            })}

            <button 
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-805 text-zinc-700 dark:text-zinc-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Audit Log Activity Feed Panel */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm space-y-3">
        <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-850 pb-1.5 flex items-center gap-1.5">
          <History size={12} className="text-zinc-400" />
          <span>Superadmin Security Audit Log (refund_activity_logs)</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[11px] font-semibold text-zinc-650 dark:text-zinc-400">
            <thead className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider border-b border-zinc-100 dark:border-zinc-850">
              <tr>
                <th className="py-2">Security Action</th>
                <th className="py-2">Operator (Role)</th>
                <th className="py-2">Remarks Details</th>
                <th className="py-2">IP Address</th>
                <th className="py-2 text-right">Activity Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850">
              {mockActivityLogs.map((log, idx) => (
                <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/10">
                  <td className="py-2.5 font-bold font-mono tracking-tight text-[var(--primary)]">{log.action}</td>
                  <td className="py-2.5 text-zinc-800 dark:text-zinc-200 font-bold">{log.user} ({log.role})</td>
                  <td className="py-2.5">{log.remarks}</td>
                  <td className="py-2.5 font-mono text-[10px]">{log.ipAddress}</td>
                  <td className="py-2.5 text-right font-mono text-[10px]">{new Date(log.timestamp).toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-out Drawer */}
      <RefundDetailsDrawer 
        isOpen={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setActiveRefund(null);
        }}
        refundId={activeRefund?._id}
        onApprove={(ref) => {
          setActiveRefund(ref);
          setApproveModalOpen(true);
        }}
        onReject={(ref) => {
          setActiveRefund(ref);
          setRejectModalOpen(true);
        }}
      />

      {/* Modals */}
      <ApproveRefundModal 
        isOpen={approveModalOpen}
        onClose={() => {
          setApproveModalOpen(false);
          setActiveRefund(null);
        }}
        refund={activeRefund}
        onSuccess={handleMutationSuccess}
      />

      <RejectRefundModal 
        isOpen={rejectModalOpen}
        onClose={() => {
          setRejectModalOpen(false);
          setActiveRefund(null);
        }}
        refund={activeRefund}
        onSuccess={handleMutationSuccess}
      />

      <RefundHistoryModal 
        isOpen={historyModalOpen}
        onClose={() => {
          setHistoryModalOpen(false);
          setActiveRefund(null);
        }}
        refund={activeRefund}
      />

      <ExportRefundsModal 
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        activeFilters={appliedFilters}
      />

    </div>
  );
}
