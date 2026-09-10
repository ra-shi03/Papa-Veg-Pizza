import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, Search, Filter, Download, MoreVertical, 
  ChevronLeft, ChevronRight, CheckCircle2, XCircle, Eye, 
  ArrowUpDown, RefreshCw, ShieldCheck, DollarSign, Calendar, Clock, User, UserCheck,
  History
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  getDisputes, mockDisputeActivityLogs, mockSupportAgents, 
  mockStores, mockFranchises, useDebounce 
} from './DisputesData';

import ViewDisputeDrawer from './components/ViewDisputeDrawer';
import AssignDisputeModal from './components/AssignDisputeModal';
import ResolveDisputeModal from './components/ResolveDisputeModal';
import EscalateDisputeModal from './components/EscalateDisputeModal';
import CloseDisputeModal from './components/CloseDisputeModal';

export default function Disputes() {
  // Database States
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search/Filter Inputs
  const [searchDispute, setSearchDispute] = useState('');
  const [searchOrder, setSearchOrder] = useState('');
  const [searchCustomer, setSearchCustomer] = useState('');
  const [storeFilter, setStoreFilter] = useState('All');
  const [franchiseFilter, setFranchiseFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Applied filter state (synced on search debounce or Apply button click)
  const [appliedFilters, setAppliedFilters] = useState({
    disputeId: '',
    orderId: '',
    customer: '',
    store: 'All',
    franchise: 'All',
    priority: 'All',
    status: 'All',
    type: 'All',
    fromDate: '',
    toDate: ''
  });

  // Debouncing search fields
  const debouncedDispute = useDebounce(searchDispute, 300);
  const debouncedOrder = useDebounce(searchOrder, 300);
  const debouncedCustomer = useDebounce(searchCustomer, 300);

  // Pagination & Sorting Configuration
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(5);

  // Selected Dispute Targets
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [actionMenuOpenId, setActionMenuOpenId] = useState(null);

  // Modal Visibility Toggles
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [escalateOpen, setEscalateOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);

  // Fetch initial disputes
  useEffect(() => {
    fetchDisputesData();
  }, []);

  const fetchDisputesData = async () => {
    setLoading(true);
    try {
      const data = await getDisputes();
      setDisputes(data);
    } catch (err) {
      toast.error('Failed to load disputes catalog');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await getDisputes();
      setDisputes(data);
      toast.success('Dispute ticket catalog refreshed');
    } catch (err) {
      toast.error('Refresh failed');
    } finally {
      setRefreshing(false);
    }
  };

  // Sync debounced search values to applied filters
  useEffect(() => {
    setAppliedFilters(prev => ({
      ...prev,
      disputeId: debouncedDispute,
      orderId: debouncedOrder,
      customer: debouncedCustomer
    }));
    setCurrentPage(1);
  }, [debouncedDispute, debouncedOrder, debouncedCustomer]);

  const handleApplyFilters = () => {
    setAppliedFilters(prev => ({
      ...prev,
      store: storeFilter,
      franchise: franchiseFilter,
      priority: priorityFilter,
      status: statusFilter,
      type: typeFilter,
      fromDate: fromDate,
      toDate: toDate
    }));
    setCurrentPage(1);
    toast.info('Applied custom filter metrics');
  };

  const handleResetFilters = () => {
    setSearchDispute('');
    setSearchOrder('');
    setSearchCustomer('');
    setStoreFilter('All');
    setFranchiseFilter('All');
    setPriorityFilter('All');
    setStatusFilter('All');
    setTypeFilter('All');
    setFromDate('');
    setToDate('');
    setAppliedFilters({
      disputeId: '',
      orderId: '',
      customer: '',
      store: 'All',
      franchise: 'All',
      priority: 'All',
      status: 'All',
      type: 'All',
      fromDate: '',
      toDate: ''
    });
    setCurrentPage(1);
    toast.info('Search filters reset successfully');
  };

  // KPI Calculations
  const getKpis = () => {
    if (loading) {
      return { open: 0, resolved: 0, escalated: 0, investigating: 0, avgTime: '1.5 Days', highPriority: 0 };
    }
    const open = disputes.filter(d => d.status === 'open').length;
    const resolved = disputes.filter(d => d.status === 'resolved').length;
    const escalated = disputes.filter(d => d.status === 'escalated').length;
    const investigating = disputes.filter(d => d.status === 'investigating').length;
    const highPriority = disputes.filter(d => d.priority === 'High' || d.priority === 'Critical').length;
    
    return { open, resolved, escalated, investigating, avgTime: '3.4 Hours', highPriority };
  };

  const kpis = getKpis();

  // Sorting Logic
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  // Filtered and Sorted list
  const getProcessedDisputes = () => {
    let result = disputes.map(dispute => {
      // Mock mappings to include customerNames, etc. for filters
      const custName = dispute.raisedById === 'CUST-001' ? 'Rajesh Kumar' : 
                       dispute.raisedById === 'CUST-002' ? 'Priya Patel' : 'Aarav Mehta';
      
      const ordNumber = dispute.orderId === 'ORD-101' ? 'PV-101' : 
                        dispute.orderId === 'ORD-102' ? 'PV-102' : 'PV-103';

      return {
        ...dispute,
        customerName: custName,
        orderNumber: ordNumber
      };
    });

    // Apply Filter Criteria
    if (appliedFilters.disputeId) {
      result = result.filter(d => d.disputeNumber.toLowerCase().includes(appliedFilters.disputeId.toLowerCase()));
    }
    if (appliedFilters.orderId) {
      result = result.filter(d => d.orderNumber.toLowerCase().includes(appliedFilters.orderId.toLowerCase()));
    }
    if (appliedFilters.customer) {
      result = result.filter(d => d.customerName.toLowerCase().includes(appliedFilters.customer.toLowerCase()));
    }
    if (appliedFilters.priority !== 'All') {
      result = result.filter(d => d.priority === appliedFilters.priority);
    }
    if (appliedFilters.status !== 'All') {
      result = result.filter(d => d.status === appliedFilters.status);
    }
    if (appliedFilters.type !== 'All') {
      result = result.filter(d => d.type === appliedFilters.type);
    }
    if (appliedFilters.fromDate) {
      result = result.filter(d => new Date(d.createdAt) >= new Date(appliedFilters.fromDate));
    }
    if (appliedFilters.toDate) {
      const endLimit = new Date(appliedFilters.toDate);
      endLimit.setDate(endLimit.getDate() + 1);
      result = result.filter(d => new Date(d.createdAt) <= endLimit);
    }

    // Sort result
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

  const processedDisputes = getProcessedDisputes();

  // Pagination Math
  const totalPages = Math.ceil(processedDisputes.length / rowsPerPage) || 1;
  const paginatedDisputes = processedDisputes.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleMutationSuccess = (updatedDispute) => {
    setDisputes(prev => prev.map(d => d._id === updatedDispute._id ? updatedDispute : d));
    setActionMenuOpenId(null);
  };

  const getPriorityBadgeStyle = (prio) => {
    switch (prio) {
      case 'Low': return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-350 border border-zinc-200';
      case 'Medium': return 'bg-blue-500/10 text-blue-600 border border-blue-500/20';
      case 'High': return 'bg-orange-500/10 text-orange-600 border border-orange-500/20';
      case 'Critical': return 'bg-red-500/10 text-red-650 dark:text-red-400 border border-red-500/20 animate-pulse';
      default: return 'bg-zinc-100 text-zinc-700 border border-zinc-200';
    }
  };

  const getStatusChipStyle = (status) => {
    switch (status) {
      case 'open': return 'bg-red-100 dark:bg-red-900/30 text-red-755 dark:text-red-400 border border-red-200/50';
      case 'assigned': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-755 dark:text-blue-400 border border-blue-200/50';
      case 'investigating': return 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-755 dark:text-indigo-400 border border-indigo-200/50';
      case 'escalated': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-755 dark:text-orange-400 border border-orange-200/50 animate-pulse';
      case 'resolved': return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-755 dark:text-emerald-400 border border-emerald-200/50';
      case 'closed': return 'bg-zinc-150 dark:bg-zinc-805 text-zinc-550 dark:text-zinc-400 border border-zinc-250';
      default: return 'bg-zinc-100 text-zinc-550 border border-zinc-200';
    }
  };

  return (
    <div className="p-3 md:p-4 pb-12 max-w-7xl mx-auto bg-zinc-50 dark:bg-zinc-955 min-h-screen w-full space-y-4">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3 pt-2">
        <div className="space-y-0.5">
          <h1 className="text-lg font-bold text-black dark:text-white leading-tight flex items-center gap-2">
            <AlertTriangle className="text-[var(--primary)] shrink-0 animate-bounce-slow" size={20} />
            <span>Disputes Support Desk</span>
          </h1>
          <p className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">
            Audit customer refunds, rider behavioral incidents, damaged delivery orders, and SLA breaches.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto sm:justify-end">
          <button 
            onClick={handleRefresh}
            disabled={loading || refreshing}
            className="p-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-black dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-805 transition-colors relative shrink-0 disabled:opacity-50 cursor-pointer"
            title="Refresh Dispute Data"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={() => toast.success('Simulating CSV reports export...')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--primary)] text-white border border-transparent rounded-lg hover:opacity-90 active:scale-95 transition-all text-xs font-bold shadow-md cursor-pointer"
          >
            <Download size={13} />
            <span>Export Disputes</span>
          </button>
        </div>
      </div>

      {/* 6 Bento KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Card 1: Open */}
        <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all hover:shadow-md border-l-4 border-l-red-500">
          {loading ? (
            <div className="animate-pulse space-y-2">
              <div className="h-3 bg-zinc-200 dark:bg-zinc-850 rounded w-2/3"></div>
              <div className="h-6 bg-zinc-200 dark:bg-zinc-850 rounded w-1/3"></div>
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Open Disputes</span>
              <div className="flex justify-between items-end mt-1">
                <span className="text-lg font-black text-red-650 dark:text-red-400">{kpis.open}</span>
                <Clock size={14} className="text-red-500 mb-0.5 animate-pulse" />
              </div>
            </div>
          )}
        </div>

        {/* Card 2: Investigating */}
        <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all hover:shadow-md border-l-4 border-l-blue-500">
          {loading ? (
            <div className="animate-pulse space-y-2">
              <div className="h-3 bg-zinc-200 dark:bg-zinc-850 rounded w-2/3"></div>
              <div className="h-6 bg-zinc-200 dark:bg-zinc-850 rounded w-1/3"></div>
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Under Investigation</span>
              <div className="flex justify-between items-end mt-1">
                <span className="text-lg font-black text-blue-600 dark:text-blue-400">{kpis.investigating}</span>
                <RefreshCw size={14} className="text-blue-550 mb-0.5" />
              </div>
            </div>
          )}
        </div>

        {/* Card 3: Escalated */}
        <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all hover:shadow-md border-l-4 border-l-orange-500">
          {loading ? (
            <div className="animate-pulse space-y-2">
              <div className="h-3 bg-zinc-200 dark:bg-zinc-850 rounded w-2/3"></div>
              <div className="h-6 bg-zinc-200 dark:bg-zinc-850 rounded w-1/3"></div>
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Escalated Cases</span>
              <div className="flex justify-between items-end mt-1">
                <span className="text-lg font-black text-orange-600 dark:text-orange-400">{kpis.escalated}</span>
                <AlertTriangle size={14} className="text-orange-555 mb-0.5 animate-bounce-slow" />
              </div>
            </div>
          )}
        </div>

        {/* Card 4: Resolved */}
        <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all hover:shadow-md border-l-4 border-l-emerald-500">
          {loading ? (
            <div className="animate-pulse space-y-2">
              <div className="h-3 bg-zinc-200 dark:bg-zinc-850 rounded w-2/3"></div>
              <div className="h-6 bg-zinc-200 dark:bg-zinc-850 rounded w-1/3"></div>
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Resolved conflicts</span>
              <div className="flex justify-between items-end mt-1">
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">{kpis.resolved}</span>
                <CheckCircle2 size={14} className="text-emerald-555 mb-0.5" />
              </div>
            </div>
          )}
        </div>

        {/* Card 5: High priority */}
        <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all hover:shadow-md border-l-4 border-l-red-650">
          {loading ? (
            <div className="animate-pulse space-y-2">
              <div className="h-3 bg-zinc-200 dark:bg-zinc-850 rounded w-2/3"></div>
              <div className="h-6 bg-zinc-200 dark:bg-zinc-850 rounded w-1/3"></div>
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">High / Critical Cases</span>
              <div className="flex justify-between items-end mt-1">
                <span className="text-lg font-black text-red-650 dark:text-red-400 flex items-center gap-1.5">
                  <span>{kpis.highPriority}</span>
                  {kpis.highPriority > 0 && <span className="text-[8px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-bold animate-pulse">SLA Warn</span>}
                </span>
                <AlertTriangle size={14} className="text-red-500 mb-0.5" />
              </div>
            </div>
          )}
        </div>

        {/* Card 6: Average Resolution Time */}
        <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all hover:shadow-md border-l-4 border-l-blue-500">
          {loading ? (
            <div className="animate-pulse space-y-2">
              <div className="h-3 bg-zinc-200 dark:bg-zinc-850 rounded w-2/3"></div>
              <div className="h-6 bg-zinc-200 dark:bg-zinc-850 rounded w-1/3"></div>
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Avg Resolution SLA</span>
              <div className="flex justify-between items-end mt-1">
                <span className="text-sm font-black text-blue-600 dark:text-blue-400">{kpis.avgTime}</span>
                <Clock size={14} className="text-blue-500 mb-0.5" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Filters Section */}
      <div className="sticky top-0 z-30 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 p-3 rounded-xl shadow-sm space-y-3">
        <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
          <Filter size={11} /> Configured Diagnostic Filters
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-semibold">
          {/* Dispute ID Search */}
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400"><Search size={13} /></span>
            <input 
              type="text" 
              placeholder="Search Dispute ID..."
              value={searchDispute}
              onChange={(e) => setSearchDispute(e.target.value)}
              className="w-full h-8 pl-8 pr-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg outline-none focus:ring-2 focus:ring-[var(--primary)] placeholder-zinc-500 text-zinc-800 dark:text-zinc-200 font-semibold"
            />
          </div>

          {/* Order ID Search */}
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400"><Search size={13} /></span>
            <input 
              type="text" 
              placeholder="Search Order ID..."
              value={searchOrder}
              onChange={(e) => setSearchOrder(e.target.value)}
              className="w-full h-8 pl-8 pr-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg outline-none focus:ring-2 focus:ring-[var(--primary)] placeholder-zinc-500 text-zinc-800 dark:text-zinc-200 font-semibold"
            />
          </div>

          {/* Customer Search */}
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400"><Search size={13} /></span>
            <input 
              type="text" 
              placeholder="Search Customer Name..."
              value={searchCustomer}
              onChange={(e) => setSearchCustomer(e.target.value)}
              className="w-full h-8 pl-8 pr-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg outline-none focus:ring-2 focus:ring-[var(--primary)] placeholder-zinc-500 text-zinc-800 dark:text-zinc-200 font-semibold"
            />
          </div>

          {/* Priority dropdown */}
          <div className="flex gap-2">
            <select 
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="flex-1 h-8 px-2 bg-zinc-50 dark:bg-zinc-955 border border-zinc-250 dark:border-zinc-800 rounded-lg text-zinc-700 dark:text-zinc-350 outline-none"
            >
              <option value="All">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>

            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 h-8 px-2 bg-zinc-50 dark:bg-zinc-955 border border-zinc-250 dark:border-zinc-800 rounded-lg text-zinc-700 dark:text-zinc-350 outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="open">Open</option>
              <option value="assigned">Assigned</option>
              <option value="investigating">Investigating</option>
              <option value="escalated">Escalated</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        {/* Extended Filter row (dates & buttons) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          {/* Dispute Type dropdown & Dates */}
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-400 font-bold uppercase text-[9px]">Type:</span>
              <select 
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="h-8 px-2.5 bg-zinc-50 dark:bg-zinc-955 border border-zinc-250 dark:border-zinc-800 rounded-lg text-zinc-700 dark:text-zinc-350 outline-none"
              >
                <option value="All">All Categories</option>
                <option value="Missing Items">Missing Items</option>
                <option value="Wrong Pizza Delivered">Wrong Pizza Delivered</option>
                <option value="Damaged Order">Damaged Order</option>
                <option value="Late Delivery">Late Delivery</option>
                <option value="Payment Issue">Payment Issue</option>
                <option value="Rider Behavior">Rider Behavior</option>
                <option value="Store Complaint">Store Complaint</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-zinc-400 font-bold uppercase text-[9px]">From:</span>
              <input 
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="h-8 px-2 bg-zinc-50 dark:bg-zinc-955 border border-zinc-250 dark:border-zinc-800 rounded-lg text-zinc-650"
              />
              <span className="text-zinc-400 font-bold uppercase text-[9px]">To:</span>
              <input 
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="h-8 px-2 bg-zinc-50 dark:bg-zinc-955 border border-zinc-250 dark:border-zinc-800 rounded-lg text-zinc-650"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 w-full sm:w-auto shrink-0 justify-end">
            <button 
              onClick={handleResetFilters}
              className="h-8 px-4 bg-zinc-105 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-755 dark:text-zinc-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              Reset Filters
            </button>
            <button 
              onClick={handleApplyFilters}
              className="h-8 px-4 bg-[var(--primary)] text-white hover:opacity-90 active:scale-95 rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              Apply Filter metrics
            </button>
          </div>
        </div>
      </div>

      {/* Disputes list Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[950px] text-xs font-semibold">
            <thead className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
              <tr>
                <th className="px-4 py-2.5 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100" onClick={() => handleSort('disputeNumber')}>
                  <div className="flex items-center gap-1.5">
                    <span>Dispute ID</span>
                    <ArrowUpDown size={11} />
                  </div>
                </th>
                <th className="px-4 py-2.5">Order ID</th>
                <th className="px-4 py-2.5">Raised By</th>
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100" onClick={() => handleSort('priority')}>
                  <div className="flex items-center gap-1.5">
                    <span>Priority</span>
                    <ArrowUpDown size={11} />
                  </div>
                </th>
                <th className="px-4 py-2.5">Assigned Agent</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100" onClick={() => handleSort('createdAt')}>
                  <div className="flex items-center gap-1.5">
                    <span>Raised On</span>
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
                    <td className="px-4 py-4"><div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-12"></div></td>
                    <td className="px-4 py-4"><div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2"></div></td>
                    <td className="px-4 py-4"><div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-16"></div></td>
                    <td className="px-4 py-4"><div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-2/3"></div></td>
                    <td className="px-4 py-4"><div className="w-4 h-4 bg-zinc-200 dark:bg-zinc-800 rounded-full"></div></td>
                  </tr>
                ))
              ) : paginatedDisputes.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-4 py-12 text-center text-zinc-550 dark:text-zinc-400 font-bold uppercase tracking-wide">
                    No disputes match the applied filters.
                  </td>
                </tr>
              ) : (
                paginatedDisputes.map((dispute) => (
                  <tr 
                    key={dispute._id}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-850/20 transition-all select-none border-l-2 border-l-transparent hover:border-l-[var(--primary)]"
                  >
                    {/* ID */}
                    <td className="px-4 py-3.5 font-bold font-mono tracking-tight text-[var(--primary)]">
                      <button 
                        onClick={() => {
                          setSelectedDispute(dispute);
                          setDrawerOpen(true);
                        }}
                        className="hover:underline text-left cursor-pointer"
                      >
                        {dispute.disputeNumber}
                      </button>
                    </td>

                    {/* Order ID */}
                    <td className="px-4 py-3.5 font-mono text-zinc-550 dark:text-zinc-400">{dispute.orderNumber}</td>

                    {/* Raised By */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-[8px] font-bold text-zinc-800 dark:text-zinc-250 shrink-0">
                          {dispute.customerName.charAt(0)}
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-zinc-900 dark:text-zinc-100">{dispute.customerName}</span>
                          <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider">({dispute.raisedByRole})</span>
                        </div>
                      </div>
                    </td>

                    {/* Dispute Type */}
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-750 text-[10px] font-semibold">
                        {dispute.type}
                      </span>
                    </td>

                    {/* Priority */}
                    <td className="px-4 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${getPriorityBadgeStyle(dispute.priority)}`}>
                        {dispute.priority}
                      </span>
                    </td>

                    {/* Assigned agent */}
                    <td className="px-4 py-3.5 text-zinc-650 dark:text-zinc-350">{dispute.assignedTo || <span className="text-zinc-400 italic">Unassigned</span>}</td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${getStatusChipStyle(dispute.status)}`}>
                        {dispute.status}
                      </span>
                    </td>

                    {/* Created Date */}
                    <td className="px-4 py-3.5 text-zinc-500 font-mono text-[10px]">
                      {new Date(dispute.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>

                    {/* Actions Context menu */}
                    <td className="px-4 py-3.5 text-center relative">
                      <button 
                        onClick={() => setActionMenuOpenId(prev => prev === dispute._id ? null : dispute._id)}
                        className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 rounded-lg cursor-pointer transition-colors"
                      >
                        <MoreVertical size={14} />
                      </button>

                      {actionMenuOpenId === dispute._id && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setActionMenuOpenId(null)} />
                          
                          <div className="absolute right-4 mt-1 w-36 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-750 shadow-xl rounded-xl z-50 py-1.5 text-left animate-in fade-in slide-in-from-top-1 duration-150 text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                            <button 
                              onClick={() => {
                                setSelectedDispute(dispute);
                                setDrawerOpen(true);
                                setActionMenuOpenId(null);
                              }}
                              className="w-full px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-750/50 flex items-center gap-1.5 cursor-pointer"
                            >
                              <Eye size={12} />
                              <span>Diagnosis Drawer</span>
                            </button>

                            {dispute.status !== 'closed' && dispute.status !== 'resolved' && (
                              <>
                                <button 
                                  onClick={() => {
                                    setSelectedDispute(dispute);
                                    setAssignOpen(true);
                                    setActionMenuOpenId(null);
                                  }}
                                  className="w-full px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-750/50 flex items-center gap-1.5 cursor-pointer text-blue-600 dark:text-blue-400"
                                >
                                  <UserCheck size={12} />
                                  <span>Assign Agent</span>
                                </button>
                                <button 
                                  onClick={() => {
                                    setSelectedDispute(dispute);
                                    setEscalateOpen(true);
                                    setActionMenuOpenId(null);
                                  }}
                                  className="w-full px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-750/50 flex items-center gap-1.5 cursor-pointer text-orange-600 dark:text-orange-400 border-t border-zinc-100 dark:border-zinc-750/50 mt-1 pt-1.5"
                                >
                                  <AlertTriangle size={12} />
                                  <span>Escalate Incident</span>
                                </button>
                                <button 
                                  onClick={() => {
                                    setSelectedDispute(dispute);
                                    setResolveOpen(true);
                                    setActionMenuOpenId(null);
                                  }}
                                  className="w-full px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-750/50 flex items-center gap-1.5 cursor-pointer text-emerald-600 dark:text-emerald-400"
                                >
                                  <CheckCircle2 size={12} />
                                  <span>Resolve Dispute</span>
                                </button>
                              </>
                            )}

                            {dispute.status === 'resolved' && (
                              <button 
                                onClick={() => {
                                  setSelectedDispute(dispute);
                                  setCloseOpen(true);
                                  setActionMenuOpenId(null);
                                }}
                                className="w-full px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-750/50 flex items-center gap-1.5 cursor-pointer text-zinc-800 dark:text-zinc-200 border-t border-zinc-100 dark:border-zinc-750/50 mt-1 pt-1.5"
                              >
                                <ShieldCheck size={12} />
                                <span>Close Dispute</span>
                              </button>
                            )}
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
            Showing {paginatedDisputes.length} of {processedDisputes.length} filtered disputes
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

      {/* Disputes Security Audit Log Panel */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm space-y-3">
        <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-850 pb-1.5 flex items-center gap-1.5">
          <History size={12} className="text-zinc-400 animate-spin-slow" />
          <span>Superadmin Security Audit Log (dispute_logs)</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[11px] font-semibold text-zinc-650 dark:text-zinc-400">
            <thead className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider border-b border-zinc-100 dark:border-zinc-850">
              <tr>
                <th className="py-2">Audit Action</th>
                <th className="py-2">Operator (Role)</th>
                <th className="py-2">Remarks Details</th>
                <th className="py-2">IP Address</th>
                <th className="py-2 text-right">Activity Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850">
              {mockDisputeActivityLogs.map((log, idx) => (
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

      {/* View Details Drawer */}
      <ViewDisputeDrawer 
        isOpen={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedDispute(null);
        }}
        disputeId={selectedDispute?._id}
        onAssign={(disp) => {
          setSelectedDispute(disp);
          setAssignOpen(true);
        }}
        onEscalate={(disp) => {
          setSelectedDispute(disp);
          setEscalateOpen(true);
        }}
        onResolve={(disp) => {
          setSelectedDispute(disp);
          setResolveOpen(true);
        }}
        onCloseDispute={(disp) => {
          setSelectedDispute(disp);
          setCloseOpen(true);
        }}
      />

      {/* Action Modals */}
      <AssignDisputeModal 
        isOpen={assignOpen}
        onClose={() => {
          setAssignOpen(false);
          setSelectedDispute(null);
        }}
        dispute={selectedDispute}
        onSuccess={handleMutationSuccess}
      />

      <ResolveDisputeModal 
        isOpen={resolveOpen}
        onClose={() => {
          setResolveOpen(false);
          setSelectedDispute(null);
        }}
        dispute={selectedDispute}
        onSuccess={handleMutationSuccess}
      />

      <EscalateDisputeModal 
        isOpen={escalateOpen}
        onClose={() => {
          setEscalateOpen(false);
          setSelectedDispute(null);
        }}
        dispute={selectedDispute}
        onSuccess={handleMutationSuccess}
      />

      <CloseDisputeModal 
        isOpen={closeOpen}
        onClose={() => {
          setCloseOpen(false);
          setSelectedDispute(null);
        }}
        dispute={selectedDispute}
        onSuccess={handleMutationSuccess}
      />

    </div>
  );
}
