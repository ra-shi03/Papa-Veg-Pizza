import React, { useState, useEffect, useRef } from 'react';
import { 
  Download, Calendar, Search, RefreshCw, Filter, 
  ChevronLeft, ChevronRight, ChevronDown, Eye, HelpCircle, 
  MoreVertical, CreditCard, SlidersHorizontal, CheckCircle2, XCircle, 
  FileSpreadsheet, FileText, Landmark, Plus, Clock, AlertTriangle, 
  CornerDownRight, CheckCircle, RefreshCw as LoopIcon
} from 'lucide-react';
import { toast } from 'sonner';

import {
  usePayoutSummary,
  usePayoutTable,
  useExportPayouts,
  useUpdatePayout
} from './hooks/usePayoutQuery';

// Subcomponents & Modals
import CreatePayoutModal from './components/CreatePayoutModal';
import ViewPayoutModal from './components/ViewPayoutModal';
import { ApproveModal, RejectModal, FailedPayoutModal } from './components/PayoutWorkflowModals';

export default function Payouts() {
  // Collapsible Filters Panel
  const [showFiltersPanel, setShowFiltersPanel] = useState(true);
  const [selectedDateFilter, setSelectedDateFilter] = useState('Month');

  // Query parameters mapping
  const [filters, setFilters] = useState({
    beneficiaryType: '', // '', 'franchise', 'store', 'deliveryPartner', 'vendor'
    status: 'All', // 'All', 'Pending Approval', 'Processing', 'Completed', 'Failed', 'Rejected'
    paymentMethod: 'All', // 'All', 'Bank Transfer', 'UPI', 'IMPS', 'NEFT', 'RTGS'
    search: '',
    startDate: '',
    endDate: ''
  });

  // Search input with 600ms debouncing
  const [searchTerm, setSearchTerm] = useState('');
  useEffect(() => {
    const handler = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchTerm }));
      setPagination(prev => ({ ...prev, page: 1 }));
    }, 600);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Pagination states
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 5
  });

  // Action Menu dropdown mapping
  const [activeMenuRowId, setActiveMenuRowId] = useState(null);
  const menuRef = useRef(null);

  // Modal display states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showFailedModal, setShowFailedModal] = useState(false);
  
  // Selected payout data for modal actions
  const [selectedPayoutId, setSelectedPayoutId] = useState(null);
  const [selectedPayoutAmount, setSelectedPayoutAmount] = useState(0);
  const [selectedPayoutBeneficiary, setSelectedPayoutBeneficiary] = useState('');

  // Close menus on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenuRowId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch Queries
  const { data: summary, loading: summaryLoading, error: summaryError, refetch: refetchSummary } = usePayoutSummary(filters);
  const { data: tableData, total: tableTotalCount, loading: tableLoading, error: tableError, refetch: refetchTable } = usePayoutTable(filters, pagination);
  const { exportPayouts, exportLoading } = useExportPayouts();
  const { updatePayoutStatus, loading: updateLoading } = useUpdatePayout();

  // Synchronize entire page data
  const handleRefreshData = () => {
    refetchSummary();
    refetchTable();
    toast.success('Payout statistics and ledger synchronized');
  };

  // Reset filter values
  const handleResetFilters = () => {
    setFilters({
      beneficiaryType: '',
      status: 'All',
      paymentMethod: 'All',
      search: '',
      startDate: '',
      endDate: ''
    });
    setSearchTerm('');
    setSelectedDateFilter('Month');
    setPagination({ page: 1, limit: 5 });
    toast.success('Filters cleared successfully');
  };

  // Date Preset calculation mapping
  useEffect(() => {
    const today = new Date();
    let start = '';
    let end = today.toISOString().split('T')[0];

    if (selectedDateFilter === 'Today') {
      start = end;
    } else if (selectedDateFilter === 'Week') {
      const pastWeek = new Date(today);
      pastWeek.setDate(today.getDate() - 7);
      start = pastWeek.toISOString().split('T')[0];
    } else if (selectedDateFilter === 'Month') {
      const pastMonth = new Date(today);
      pastMonth.setMonth(today.getMonth() - 1);
      start = pastMonth.toISOString().split('T')[0];
    } else if (selectedDateFilter === 'Year') {
      const pastYear = new Date(today);
      pastYear.setFullYear(today.getFullYear() - 1);
      start = pastYear.toISOString().split('T')[0];
    }

    if (selectedDateFilter !== 'Custom') {
      setFilters(prev => ({ ...prev, startDate: start, endDate: end }));
    }
  }, [selectedDateFilter]);

  // Format amount to lakh/crore Indian format
  const formatCurrency = (val) => {
    if (val === undefined || val === null) return '₹0';
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  // Handle manual complete status update
  const handleMarkAsCompleted = async (id) => {
    const randomUtr = `UTR${Math.floor(100000 + Math.random() * 900000)}`;
    const randomTxn = `TXN${Math.floor(1000 + Math.random() * 9000)}`;
    const success = await updatePayoutStatus(id, 'Completed', {
      utrNumber: randomUtr,
      transactionId: randomTxn,
      remarks: 'Settled manually by administrator override'
    });
    if (success) {
      handleRefreshData();
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15';
      case 'Processing':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/15';
      case 'Pending Approval':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/15';
      case 'Failed':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/15';
      case 'Rejected':
        return 'bg-zinc-550/10 text-zinc-650 dark:text-zinc-400 border border-zinc-500/15';
      default:
        return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-350 border border-zinc-200 dark:border-zinc-700';
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-zinc-50 dark:bg-zinc-955 min-h-screen text-zinc-850 dark:text-zinc-100 transition-colors duration-300">
      
      {/* Top Header Block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5 shrink-0">
        <div>
          <h1 className="text-xl font-black text-black dark:text-white flex items-center gap-2">
            <Landmark size={22} className="text-[var(--primary)]" />
            Payouts Ledger Management
          </h1>
          <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mt-1">
            Dispatch, track, approve, and settle outbound cash balances for franchises, retail stores, riders, and suppliers.
          </p>
        </div>

        {/* Master Action Panel */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button 
            onClick={() => exportPayouts('excel', filters)}
            disabled={exportLoading || tableLoading}
            className="h-9 px-3 border border-zinc-250 dark:border-zinc-805 bg-white dark:bg-zinc-900 text-zinc-750 dark:text-zinc-300 text-xs font-bold rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
          >
            <FileSpreadsheet size={14} className="text-emerald-600" />
            Excel Ledger
          </button>
          
          <button 
            onClick={() => exportPayouts('pdf', filters)}
            disabled={exportLoading || tableLoading}
            className="h-9 px-3 border border-zinc-250 dark:border-zinc-805 bg-white dark:bg-zinc-900 text-zinc-750 dark:text-zinc-300 text-xs font-bold rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
          >
            <FileText size={14} className="text-rose-600" />
            PDF Statement
          </button>

          <button 
            onClick={handleRefreshData}
            className="p-2 border border-zinc-250 dark:border-zinc-805 bg-white dark:bg-zinc-900 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-600 dark:text-zinc-400 transition-colors cursor-pointer"
            title="Reload statistics data"
          >
            <RefreshCw size={14} className={summaryLoading || tableLoading ? 'animate-spin' : ''} />
          </button>

          <button 
            onClick={() => setShowCreateModal(true)}
            className="h-9 px-4 bg-[var(--primary)] hover:brightness-110 text-white text-xs font-bold rounded-lg shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={15} />
            Initiate Payout
          </button>
        </div>
      </div>

      {/* KPI 6 Stats Summary Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Card 1: Pending Settlements */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between h-[105px]">
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest leading-none">Pending Approvals</span>
            <span className="p-1 rounded-md bg-amber-500/10 text-amber-500 text-[10px] font-bold"><Clock size={11} /></span>
          </div>
          <div className="mt-2">
            <h3 className="text-sm font-black text-black dark:text-white font-mono truncate" title={summary?.pendingPayouts?.toLocaleString('en-IN')}>
              {formatCurrency(summary?.pendingPayouts)}
            </h3>
            <p className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 mt-1">
              Awaiting officer verification
            </p>
          </div>
        </div>

        {/* Card 2: Completed Settlements */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between h-[105px]">
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest leading-none">Completed Settlement</span>
            <span className="p-1 rounded-md bg-emerald-500/10 text-emerald-500 text-[10px] font-bold"><CheckCircle2 size={11} /></span>
          </div>
          <div className="mt-2">
            <h3 className="text-sm font-black text-black dark:text-white font-mono truncate" title={summary?.completedPayouts?.toLocaleString('en-IN')}>
              {formatCurrency(summary?.completedPayouts)}
            </h3>
            <p className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-0.5">
              Successfully cleared nodes
            </p>
          </div>
        </div>

        {/* Card 3: Failed Settlements */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between h-[105px]">
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest leading-none">Failed Payments</span>
            <span className="p-1 rounded-md bg-rose-500/10 text-rose-550 text-[10px] font-bold"><XCircle size={11} /></span>
          </div>
          <div className="mt-2">
            <h3 className="text-sm font-black text-black dark:text-white font-mono truncate animate-pulse" title={summary?.failedPayouts?.toLocaleString('en-IN')}>
              {formatCurrency(summary?.failedPayouts)}
            </h3>
            <p className="text-[9px] font-bold text-rose-550 mt-1">
              Requires immediate action
            </p>
          </div>
        </div>

        {/* Card 4: Today Payout */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between h-[105px]">
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest leading-none">Today's Transferred</span>
            <span className="p-1 rounded-md bg-blue-500/10 text-blue-500 text-[10px] font-bold"><Landmark size={11} /></span>
          </div>
          <div className="mt-2">
            <h3 className="text-sm font-black text-black dark:text-white font-mono truncate" title={summary?.todayPayout?.toLocaleString('en-IN')}>
              {formatCurrency(summary?.todayPayout)}
            </h3>
            <p className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 mt-1">
              Clearing cycles dispatched
            </p>
          </div>
        </div>

        {/* Card 5: Monthly Transferred */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between h-[105px]">
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest leading-none">Monthly Clearance</span>
            <span className="p-1 rounded-md bg-[var(--primary)]/10 text-[var(--primary)] text-[10px] font-bold"><Landmark size={11} /></span>
          </div>
          <div className="mt-2">
            <h3 className="text-sm font-black text-black dark:text-white font-mono truncate" title={summary?.monthlyPayout?.toLocaleString('en-IN')}>
              {formatCurrency(summary?.monthlyPayout)}
            </h3>
            <p className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 mt-1">
              Accumulated billing splits
            </p>
          </div>
        </div>

        {/* Card 6: Total Beneficiaries */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between h-[105px]">
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest leading-none">Active Beneficiaries</span>
            <span className="p-1 rounded-md bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 text-[10px] font-bold"><CreditCard size={11} /></span>
          </div>
          <div className="mt-2">
            <h3 className="text-sm font-black text-black dark:text-white font-mono">
              {summary?.totalBeneficiaries || 0}
            </h3>
            <p className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 mt-1">
              Registered bank routing nodes
            </p>
          </div>
        </div>
      </div>

      {/* Main Filter panel with cascading controls */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden transition-all duration-300">
        
        {/* Toggle Title Bar */}
        <div className="px-5 py-3.5 border-b border-zinc-150 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-950/20">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={14} className="text-[var(--primary)]" />
            <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
              Ledger Query & Presets Filters
            </h4>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowFiltersPanel(!showFiltersPanel)}
              className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Filter size={13} />
              {showFiltersPanel ? "Hide Presets" : "Show Presets"}
            </button>
            <button 
              onClick={handleResetFilters}
              className="text-xs font-bold text-rose-550 hover:brightness-95 transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Cascading Filter Controls Box */}
        {showFiltersPanel && (
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 border-b border-zinc-150 dark:border-zinc-800 animate-slide-down">
            
            {/* Search Input bar */}
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-widest">Search Ledger ID / Name</label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search payouts, beneficiary names, UTR..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-205 dark:border-zinc-800 rounded-lg text-xs font-bold focus:ring-2 focus:ring-[var(--primary)] outline-none text-black dark:text-white"
                />
              </div>
            </div>

            {/* Beneficiary Type */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-widest">Beneficiary Node</label>
              <select
                value={filters.beneficiaryType}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, beneficiaryType: e.target.value }));
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="w-full h-9 px-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-205 dark:border-zinc-800 rounded-lg text-xs font-bold focus:ring-2 focus:ring-[var(--primary)] outline-none text-black dark:text-white"
              >
                <option value="">All Categories</option>
                <option value="franchise">Franchise Owners</option>
                <option value="store">Store Outlets</option>
                <option value="deliveryPartner">Delivery Riders</option>
                <option value="vendor">External Suppliers</option>
              </select>
            </div>

            {/* Status Type */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-widest">Payout Status</label>
              <select
                value={filters.status}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, status: e.target.value }));
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="w-full h-9 px-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-205 dark:border-zinc-800 rounded-lg text-xs font-bold focus:ring-2 focus:ring-[var(--primary)] outline-none text-black dark:text-white"
              >
                <option value="All">All Statuses</option>
                <option value="Pending Approval">Pending Approval</option>
                <option value="Processing">Processing</option>
                <option value="Completed">Completed</option>
                <option value="Failed">Failed</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            {/* Payout Clearance Method */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-widest">Clearance Method</label>
              <select
                value={filters.paymentMethod}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, paymentMethod: e.target.value }));
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="w-full h-9 px-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-205 dark:border-zinc-800 rounded-lg text-xs font-bold focus:ring-2 focus:ring-[var(--primary)] outline-none text-black dark:text-white"
              >
                <option value="All">All Methods</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="UPI">UPI</option>
                <option value="IMPS">IMPS</option>
                <option value="NEFT">NEFT</option>
                <option value="RTGS">RTGS</option>
              </select>
            </div>

            {/* Date Preset */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-widest">Date Preset</label>
              <select
                value={selectedDateFilter}
                onChange={(e) => setSelectedDateFilter(e.target.value)}
                className="w-full h-9 px-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-205 dark:border-zinc-800 rounded-lg text-xs font-bold focus:ring-2 focus:ring-[var(--primary)] outline-none text-black dark:text-white"
              >
                <option value="Today">Today Only</option>
                <option value="Week">Past 7 Days</option>
                <option value="Month">Past Month</option>
                <option value="Year">Past Year</option>
                <option value="Custom">Custom Range</option>
              </select>
            </div>

          </div>
        )}

        {/* Custom date picker expansion */}
        {selectedDateFilter === 'Custom' && (
          <div className="px-5 py-3 bg-zinc-50/50 dark:bg-zinc-950/20 border-b border-zinc-150 dark:border-zinc-800 flex flex-wrap gap-4 items-end animate-fade-in">
            <div className="flex flex-col gap-1 text-xs">
              <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Start Date</span>
              <div className="relative">
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => {
                    setFilters(prev => ({ ...prev, startDate: e.target.value }));
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  className="h-8 px-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-[11px] font-bold text-black dark:text-white"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1 text-xs">
              <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">End Date</span>
              <div className="relative">
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => {
                    setFilters(prev => ({ ...prev, endDate: e.target.value }));
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  className="h-8 px-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-[11px] font-bold text-black dark:text-white"
                />
              </div>
            </div>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold mb-2">
              Showing payouts initiated within selected calendar slots
            </p>
          </div>
        )}

        {/* Payouts Ledger Table */}
        <div className="overflow-x-auto min-h-[200px]">
          <table className="w-full text-left text-xs divide-y divide-zinc-200 dark:divide-zinc-850">
            <thead className="bg-zinc-50 dark:bg-zinc-950/40 text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-[9px] font-bold">
              <tr>
                <th className="px-5 py-3">Payout ID</th>
                <th className="px-5 py-3">Beneficiary</th>
                <th className="px-5 py-3">Routing Mode</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Clearance ID (UTR)</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Created Date</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850 bg-white dark:bg-zinc-900/40 text-black dark:text-white font-semibold">
              {tableLoading ? (
                // Table Rows skeleton
                [1, 2, 3, 4, 5].map((row) => (
                  <tr key={row} className="animate-pulse">
                    <td className="px-5 py-4"><div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-16"></div></td>
                    <td className="px-5 py-4">
                      <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded w-28 mb-1"></div>
                      <div className="h-2.5 bg-zinc-150 dark:bg-zinc-850 rounded w-16"></div>
                    </td>
                    <td className="px-5 py-4"><div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-14"></div></td>
                    <td className="px-5 py-4"><div className="h-3.5 bg-zinc-250 dark:bg-zinc-805 rounded w-16 font-bold"></div></td>
                    <td className="px-5 py-4"><div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-20"></div></td>
                    <td className="px-5 py-4"><div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded-full w-20"></div></td>
                    <td className="px-5 py-4"><div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-24"></div></td>
                    <td className="px-5 py-4"><div className="h-7 bg-zinc-200 dark:bg-zinc-800 rounded w-8 ml-auto"></div></td>
                  </tr>
                ))
              ) : tableData.length > 0 ? (
                tableData.map((payout) => (
                  <tr key={payout.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10 group transition-colors">
                    
                    {/* ID */}
                    <td className="px-5 py-3.5 font-mono text-[10px] text-zinc-500 dark:text-zinc-400 font-extrabold">{payout.payoutId}</td>
                    
                    {/* Beneficiary details */}
                    <td className="px-5 py-3.5">
                      <p className="font-extrabold text-zinc-900 dark:text-white truncate max-w-[170px]">{payout.beneficiaryName}</p>
                      <span className="inline-block mt-0.5 text-[8.5px] font-extrabold text-[var(--primary)] bg-[var(--primary)]/5 px-1.5 py-0.2 border border-[var(--primary)]/10 rounded capitalize">
                        {payout.beneficiaryType === 'deliveryPartner' ? 'rider' : payout.beneficiaryType}
                      </span>
                    </td>
                    
                    {/* Payment clearance method */}
                    <td className="px-5 py-3.5 text-zinc-500 dark:text-zinc-400 font-bold">{payout.payoutMethod || 'Bank NEFT'}</td>
                    
                    {/* Amount */}
                    <td className="px-5 py-3.5 font-mono font-black text-zinc-900 dark:text-white text-xs">
                      ₹{payout.amount?.toLocaleString('en-IN')}
                    </td>
                    
                    {/* UTR / Transaction Clearance */}
                    <td className="px-5 py-3.5">
                      {payout.utrNumber ? (
                        <span className="font-mono text-[10px] text-zinc-700 dark:text-zinc-350 border border-zinc-200 dark:border-zinc-800 px-2 py-0.5 bg-zinc-50 dark:bg-zinc-950 rounded font-bold">{payout.utrNumber}</span>
                      ) : (
                        <span className="text-[10px] text-zinc-400 italic">Clearance Awaiting</span>
                      )}
                    </td>
                    
                    {/* Status Badge */}
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9.5px] font-extrabold ${getStatusBadge(payout.status)}`}>
                        {payout.status}
                      </span>
                    </td>
                    
                    {/* Created date */}
                    <td className="px-5 py-3.5 text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold">{payout.createdAt}</td>
                    
                    {/* Action menu */}
                    <td className="px-5 py-3.5 text-right relative">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuRowId(activeMenuRowId === payout.id ? null : payout.id);
                          setSelectedPayoutId(payout.payoutId);
                          setSelectedPayoutAmount(payout.amount);
                          setSelectedPayoutBeneficiary(payout.beneficiaryName);
                        }}
                        className="p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-500 hover:text-black dark:hover:text-white transition-colors cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-850"
                      >
                        <MoreVertical size={13} />
                      </button>

                      {/* Dropdown Action Menu Box */}
                      {activeMenuRowId === payout.id && (
                        <div 
                          ref={menuRef}
                          className="absolute right-6 top-10 w-44 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-lg shadow-xl py-1 z-30 divide-y divide-zinc-100 dark:divide-zinc-850 text-left"
                        >
                          <div className="py-0.5">
                            <button
                              onClick={() => { setShowViewModal(true); setActiveMenuRowId(null); }}
                              className="w-full px-3 py-1.5 text-[11px] font-bold text-zinc-700 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 flex items-center gap-2 cursor-pointer"
                            >
                              <Eye size={12} className="text-[var(--primary)]" />
                              View Voucher
                            </button>
                          </div>

                          {payout.status === 'Pending Approval' && (
                            <div className="py-0.5">
                              <button
                                onClick={() => { setShowApproveModal(true); setActiveMenuRowId(null); }}
                                className="w-full px-3 py-1.5 text-[11px] font-bold text-emerald-600 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 flex items-center gap-2 cursor-pointer"
                              >
                                <CheckCircle size={12} />
                                Approve Clearance
                              </button>
                              <button
                                onClick={() => { setShowRejectModal(true); setActiveMenuRowId(null); }}
                                className="w-full px-3 py-1.5 text-[11px] font-bold text-rose-550 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 flex items-center gap-2 cursor-pointer"
                              >
                                <XCircle size={12} />
                                Reject Payout
                              </button>
                            </div>
                          )}

                          {payout.status === 'Processing' && (
                            <div className="py-0.5">
                              <button
                                onClick={() => { handleMarkAsCompleted(payout.payoutId); setActiveMenuRowId(null); }}
                                disabled={updateLoading}
                                className="w-full px-3 py-1.5 text-[11px] font-bold text-blue-600 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 flex items-center gap-2 cursor-pointer disabled:opacity-40"
                              >
                                <CheckCircle size={12} />
                                Complete Settlement
                              </button>
                            </div>
                          )}

                          {payout.status === 'Failed' && (
                            <div className="py-0.5">
                              <button
                                onClick={() => { setShowFailedModal(true); setActiveMenuRowId(null); }}
                                className="w-full px-3 py-1.5 text-[11px] font-bold text-amber-600 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 flex items-center gap-2 cursor-pointer"
                              >
                                <LoopIcon size={11} className="animate-spin" />
                                Re-initiate Retry
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-5 py-12 text-center text-zinc-400 italic font-medium">
                    <AlertTriangle size={24} className="mx-auto text-zinc-350 mb-2" />
                    No outgoing payout clearance logs found matching the selected query preset.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Server-Side Pagination Bar */}
        {tableTotalCount > 0 && (
          <div className="px-5 py-3 border-t border-zinc-150 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-950/20 text-xs font-bold shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-zinc-500">Page limit:</span>
              <select
                value={pagination.limit}
                onChange={(e) => {
                  setPagination({ page: 1, limit: Number(e.target.value) });
                }}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 px-2 py-0.5 rounded text-[11px] font-bold outline-none text-black dark:text-white"
              >
                <option value={5}>5 records</option>
                <option value={10}>10 records</option>
                <option value={20}>20 records</option>
              </select>
              <span className="text-zinc-400 font-normal ml-2">
                Showing {Math.min((pagination.page - 1) * pagination.limit + 1, tableTotalCount)} to {Math.min(pagination.page * pagination.limit, tableTotalCount)} of {tableTotalCount} entries
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination(p => ({ ...p, page: Math.max(1, p.page - 1) }))}
                disabled={pagination.page === 1}
                className="px-2.5 py-1 border border-zinc-250 dark:border-zinc-805 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 rounded hover:bg-zinc-50 dark:hover:bg-zinc-850 disabled:opacity-40 flex items-center gap-0.5 cursor-pointer"
              >
                <ChevronLeft size={13} />
                Prev
              </button>
              
              <span className="text-zinc-500 font-extrabold px-1">
                {pagination.page} / {Math.ceil(tableTotalCount / pagination.limit) || 1}
              </span>

              <button
                onClick={() => setPagination(p => ({ ...p, page: Math.min(Math.ceil(tableTotalCount / pagination.limit), p.page + 1) }))}
                disabled={pagination.page >= Math.ceil(tableTotalCount / pagination.limit)}
                className="px-2.5 py-1 border border-zinc-250 dark:border-zinc-805 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 rounded hover:bg-zinc-50 dark:hover:bg-zinc-850 disabled:opacity-40 flex items-center gap-0.5 cursor-pointer"
              >
                Next
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODALS INTEGRATION */}
      {/* ------------------------------------------------------------- */}
      
      {/* 1. Create Payout Modal */}
      <CreatePayoutModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleRefreshData}
      />

      {/* 2. View Details Modal */}
      <ViewPayoutModal
        isOpen={showViewModal}
        onClose={() => { setShowViewModal(false); setSelectedPayoutId(null); }}
        id={selectedPayoutId}
      />

      {/* 3. Approve Payout Modal */}
      <ApproveModal
        isOpen={showApproveModal}
        onClose={() => { setShowApproveModal(false); setSelectedPayoutId(null); }}
        id={selectedPayoutId}
        amount={selectedPayoutAmount}
        beneficiaryName={selectedPayoutBeneficiary}
        onSuccess={handleRefreshData}
      />

      {/* 4. Reject Payout Modal */}
      <RejectModal
        isOpen={showRejectModal}
        onClose={() => { setShowRejectModal(false); setSelectedPayoutId(null); }}
        id={selectedPayoutId}
        amount={selectedPayoutAmount}
        beneficiaryName={selectedPayoutBeneficiary}
        onSuccess={handleRefreshData}
      />

      {/* 5. Failed Retry Payout Modal */}
      <FailedPayoutModal
        isOpen={showFailedModal}
        onClose={() => { setShowFailedModal(false); setSelectedPayoutId(null); }}
        id={selectedPayoutId}
        amount={selectedPayoutAmount}
        beneficiaryName={selectedPayoutBeneficiary}
        onSuccess={handleRefreshData}
      />

    </div>
  );
}
