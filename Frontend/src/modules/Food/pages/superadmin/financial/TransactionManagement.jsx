import React, { useState, useEffect, useRef } from 'react';
import {
  Download, Calendar, Search, RefreshCw, Filter,
  ChevronLeft, ChevronRight, ChevronDown, Eye, HelpCircle,
  MoreVertical, CreditCard, SlidersHorizontal, CheckCircle2, XCircle,
  FileSpreadsheet, FileText, Landmark, Clock, AlertTriangle,
  RefreshCw as LoopIcon, History, Copy
} from 'lucide-react';
import { toast } from 'sonner';

import {
  useTransactionSummary,
  useTransactions,
  useExportTransactions
} from './hooks/useTransactionQuery';

// Subcomponents & Modals
import TransactionDetails from './TransactionDetails';
import { RetryModal, AuditLogsModal, ExportModal } from './components/TransactionWorkflowModals';

export default function TransactionManagement() {
  const [showFiltersPanel, setShowFiltersPanel] = useState(true);
  const [selectedDateFilter, setSelectedDateFilter] = useState('Month');

  // Query filters criteria
  const [filters, setFilters] = useState({
    gateway: 'All', // 'All', 'Razorpay', 'Stripe', 'Paytm', 'CashFree'
    paymentMethod: 'All', // 'All', 'UPI', 'Card', 'Wallet', 'Cash', 'Net Banking'
    type: 'All', // 'All', 'Order Payment', 'Refund', 'Wallet', 'Coupon Adjustment', 'Franchise Payment', 'Payout'
    status: 'All', // 'All', 'Created', 'Authorized', 'Captured', 'Completed', 'Failed', 'Pending', 'Refunded'
    search: '',
    startDate: '',
    endDate: ''
  });

  // Debounced search term
  const [searchTerm, setSearchTerm] = useState('');
  useEffect(() => {
    const handler = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchTerm }));
      setPagination(prev => ({ ...prev, page: 1 }));
    }, 600);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 5
  });

  // Action Menu dropdown mapping
  const [activeMenuRowId, setActiveMenuRowId] = useState(null);
  const menuRef = useRef(null);

  // Modals display triggers
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRetryModal, setShowRetryModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Selected Row records mapping
  const [selectedTxnId, setSelectedTxnId] = useState(null);
  const [selectedTxnAmount, setSelectedTxnAmount] = useState(0);
  const [selectedTxnCustomer, setSelectedTxnCustomer] = useState('');

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

  // Fetch API Queries
  const { data: summary, loading: summaryLoading, error: summaryError, refetch: refetchSummary } = useTransactionSummary(filters);
  const { data: tableData, total: tableTotalCount, loading: tableLoading, error: tableError, refetch: refetchTable } = useTransactions(filters, pagination);
  const { exportTransactions, exportLoading } = useExportTransactions();

  // Reload statistics data
  const handleRefreshData = () => {
    refetchSummary();
    refetchTable();
    toast.success('Central transaction ledger synchronized');
  };

  // Reset filter values
  const handleResetFilters = () => {
    setFilters({
      gateway: 'All',
      paymentMethod: 'All',
      type: 'All',
      status: 'All',
      search: '',
      startDate: '',
      endDate: ''
    });
    setSearchTerm('');
    setSelectedDateFilter('Month');
    setPagination({ page: 1, limit: 5 });
    toast.success('Filters cleared successfully');
  };

  // Date Preset timelines mapping
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

  // Format currency into Lakh / Crore
  const formatCurrency = (val) => {
    if (val === undefined || val === null) return '₹0';
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
      case 'Captured':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15';
      case 'Authorized':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/15';
      case 'Pending':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/15';
      case 'Failed':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-455 border border-rose-500/15';
      case 'Refunded':
        return 'bg-zinc-550/10 text-zinc-650 dark:text-zinc-400 border border-zinc-500/15';
      default:
        return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-350 border border-zinc-200 dark:border-zinc-700';
    }
  };

  const handleCopyTxnId = (txnId) => {
    navigator.clipboard.writeText(txnId);
    toast.success(`Transaction ID ${txnId} copied to clipboard`);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-zinc-50 dark:bg-zinc-955 min-h-screen text-zinc-850 dark:text-zinc-100 transition-colors duration-300">
      {/* Top Header Block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200 dark:border-zinc-805 pb-5 shrink-0">
        <div>
          <h1 className="text-xl font-black text-black dark:text-white flex items-center gap-2">
            <Landmark size={22} className="text-[var(--primary)]" />
            Transaction Management
          </h1>
          <p className="text-[11px] font-semibold text-zinc-550 dark:text-zinc-400 mt-1">
            Real-time central ledger logs monitoring webhooks, retry failures, request payloads, and reconciliation balances.
          </p>
        </div>

        {/* Master Action Panel */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setShowAuditModal(true)}
            className="h-9 px-3 border border-zinc-250 dark:border-zinc-805 bg-white dark:bg-zinc-900 text-zinc-750 dark:text-zinc-300 text-xs font-bold rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <History size={14} className="text-[var(--primary)]" />
            Audit History
          </button>

          <button
            onClick={() => setShowExportModal(true)}
            className="h-9 px-3 border border-zinc-250 dark:border-zinc-805 bg-white dark:bg-zinc-900 text-zinc-750 dark:text-zinc-300 text-xs font-bold rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet size={14} className="text-emerald-600" />
            Export Config
          </button>

          <button
            onClick={() => exportTransactions('pdf', filters)}
            disabled={exportLoading || tableLoading}
            className="h-9 px-3 border border-zinc-250 dark:border-zinc-805 bg-white dark:bg-zinc-900 text-zinc-750 dark:text-zinc-300 text-xs font-bold rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
          >
            <FileText size={14} className="text-rose-600" />
            Download PDF
          </button>

          <button
            onClick={handleRefreshData}
            className="p-2 border border-zinc-250 dark:border-zinc-805 bg-white dark:bg-zinc-900 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-650 dark:text-zinc-400 transition-colors cursor-pointer"
            title="Reload statistics data"
          >
            <RefreshCw size={14} className={summaryLoading || tableLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* KPI Bento Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Card 1: Total Transactions */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-808 rounded-2xl p-4 shadow-sm flex flex-col justify-between h-[105px] relative group overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest leading-none">Total Transactions</span>
            <span className="p-1 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold text-zinc-555"><Landmark size={11} /></span>
          </div>
          <div className="mt-2">
            <h3 className="text-sm font-black text-zinc-900 dark:text-white font-mono truncate" title={summary?.totalTransactions?.toLocaleString('en-IN')}>
              {summaryLoading ? '...' : formatCurrency(summary?.totalTransactions)}
            </h3>
            <span className="text-[8.5px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 mt-0.5">
              {summary?.totalTrend >= 0 ? `+${summary.totalTrend}%` : `${summary.totalTrend}%`} from past week
            </span>
          </div>
        </div>

        {/* Card 2: Successful Transactions */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-808 rounded-2xl p-4 shadow-sm flex flex-col justify-between h-[105px] relative group overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest leading-none">Successful</span>
            <span className="p-1 rounded bg-emerald-500/10 text-emerald-500 text-[10px] font-bold"><CheckCircle2 size={11} /></span>
          </div>
          <div className="mt-2">
            <h3 className="text-sm font-black text-zinc-900 dark:text-white font-mono truncate" title={summary?.successfulTransactions?.toLocaleString('en-IN')}>
              {summaryLoading ? '...' : formatCurrency(summary?.successfulTransactions)}
            </h3>
            <span className="text-[8.5px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 mt-0.5">
              {summary?.successTrend >= 0 ? `+${summary.successTrend}%` : `${summary.successTrend}%`} growth velocity
            </span>
          </div>
        </div>

        {/* Card 3: Failed Transactions */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-808 rounded-2xl p-4 shadow-sm flex flex-col justify-between h-[105px] relative group overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest leading-none">Failed Payments</span>
            <span className="p-1 rounded bg-rose-500/10 text-rose-500 text-[10px] font-bold"><XCircle size={11} /></span>
          </div>
          <div className="mt-2">
            <h3 className="text-sm font-black text-zinc-900 dark:text-white font-mono truncate" title={summary?.failedTransactions?.toLocaleString('en-IN')}>
              {summaryLoading ? '...' : formatCurrency(summary?.failedTransactions)}
            </h3>
            <span className="text-[8.5px] font-bold text-rose-500 flex items-center gap-0.5 mt-0.5 animate-pulse">
              {summary?.failedTrend >= 0 ? `+${summary.failedTrend}%` : `${summary.failedTrend}%`} retry clearance
            </span>
          </div>
        </div>

        {/* Card 4: Refunded Transactions */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-808 rounded-2xl p-4 shadow-sm flex flex-col justify-between h-[105px] relative group overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest leading-none">Refunded</span>
            <span className="p-1 rounded bg-zinc-200 dark:bg-zinc-800 text-[10px] font-bold text-zinc-650"><AlertTriangle size={11} /></span>
          </div>
          <div className="mt-2">
            <h3 className="text-sm font-black text-zinc-900 dark:text-white font-mono truncate" title={summary?.refundedTransactions?.toLocaleString('en-IN')}>
              {summaryLoading ? '...' : formatCurrency(summary?.refundedTransactions)}
            </h3>
            <span className="text-[8.5px] font-bold text-zinc-400 dark:text-zinc-500 flex items-center gap-0.5 mt-0.5">
              {summary?.refundTrend >= 0 ? `+${summary.refundTrend}%` : `${summary.refundTrend}%`} payout splits
            </span>
          </div>
        </div>

        {/* Card 5: Pending Transactions */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-808 rounded-2xl p-4 shadow-sm flex flex-col justify-between h-[105px] relative group overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest leading-none">Pending</span>
            <span className="p-1 rounded bg-amber-500/10 text-amber-500 text-[10px] font-bold"><Clock size={11} /></span>
          </div>
          <div className="mt-2">
            <h3 className="text-sm font-black text-zinc-900 dark:text-white font-mono truncate" title={summary?.pendingTransactions?.toLocaleString('en-IN')}>
              {summaryLoading ? '...' : formatCurrency(summary?.pendingTransactions)}
            </h3>
            <span className="text-[8.5px] font-bold text-zinc-400 dark:text-zinc-500 flex items-center gap-0.5 mt-0.5">
              {summary?.pendingTrend >= 0 ? `+${summary.pendingTrend}%` : `${summary.pendingTrend}%`} cycle settlements
            </span>
          </div>
        </div>

        {/* Card 6: Success Rate */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-808 rounded-2xl p-4 shadow-sm flex flex-col justify-between h-[105px] relative group overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest leading-none">Success Rate</span>
            <span className="p-1 rounded bg-blue-500/10 text-blue-500 text-[10px] font-bold"><CheckCircle2 size={11} /></span>
          </div>
          <div className="mt-2">
            <h3 className="text-sm font-black text-zinc-900 dark:text-white font-mono">
              {summaryLoading ? '...' : `${summary?.successRate}%`}
            </h3>
            <span className="text-[8.5px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 mt-0.5">
              +0.8% threshold stability
            </span>
          </div>
        </div>
      </div>

      {/* Query Filters Card panel */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden transition-all duration-300">

        {/* Toggle Title Bar */}
        <div className="px-5 py-3.5 border-b border-zinc-150 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-950/20">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="text-[var(--primary)]" size={14} />
            <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
              Ledger Query & Preset Filters
            </h4>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFiltersPanel(!showFiltersPanel)}
              className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Filter size={13} />
              {showFiltersPanel ? "Hide Filters" : "Show Filters"}
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
              <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-widest">Search ledger fields</label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-450" />
                <input
                  type="text"
                  placeholder="Search Txn ID, Order ID, Customer name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-205 dark:border-zinc-800 rounded-lg text-xs font-bold focus:ring-2 focus:ring-[var(--primary)] outline-none text-black dark:text-white"
                />
              </div>
            </div>

            {/* Gateway */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-widest">Gateway</label>
              <select
                value={filters.gateway}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, gateway: e.target.value }));
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="w-full h-9 px-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-205 dark:border-zinc-800 rounded-lg text-xs font-bold focus:ring-2 focus:ring-[var(--primary)] outline-none text-black dark:text-white"
              >
                <option value="All">All Gateways</option>
                <option value="Razorpay">Razorpay</option>
                <option value="Stripe">Stripe</option>
                <option value="Paytm">Paytm</option>
                <option value="CashFree">CashFree</option>
              </select>
            </div>

            {/* Payment Method */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-widest">Payment Method</label>
              <select
                value={filters.paymentMethod}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, paymentMethod: e.target.value }));
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="w-full h-9 px-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-205 dark:border-zinc-800 rounded-lg text-xs font-bold focus:ring-2 focus:ring-[var(--primary)] outline-none text-black dark:text-white"
              >
                <option value="All">All Methods</option>
                <option value="UPI">UPI</option>
                <option value="Card">Card / Debit</option>
                <option value="Wallet">Wallet Transfer</option>
                <option value="Cash">Cash on Delivery</option>
                <option value="Net Banking">Net Banking</option>
              </select>
            </div>

            {/* Transaction Type */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-widest">Transaction Type</label>
              <select
                value={filters.type}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, type: e.target.value }));
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="w-full h-9 px-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-205 dark:border-zinc-800 rounded-lg text-xs font-bold focus:ring-2 focus:ring-[var(--primary)] outline-none text-black dark:text-white"
              >
                <option value="All">All Types</option>
                <option value="Order Payment">Order Payment</option>
                <option value="Refund">Refund Entry</option>
                <option value="Wallet">Wallet Credit</option>
                <option value="Coupon Adjustment">Coupon adjustment</option>
                <option value="Franchise Payment">Franchise payment</option>
                <option value="Payout">Payout balance</option>
              </select>
            </div>

            {/* Status */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-widest">Transaction Status</label>
              <select
                value={filters.status}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, status: e.target.value }));
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="w-full h-9 px-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-205 dark:border-zinc-800 rounded-lg text-xs font-bold focus:ring-2 focus:ring-[var(--primary)] outline-none text-black dark:text-white"
              >
                <option value="All">All Statuses</option>
                <option value="Created">Created</option>
                <option value="Authorized">Authorized</option>
                <option value="Captured">Captured / Settled</option>
                <option value="Completed">Completed</option>
                <option value="Failed">Failed</option>
                <option value="Pending">Pending</option>
                <option value="Refunded">Refunded</option>
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

        {/* Custom date range expansion */}
        {selectedDateFilter === 'Custom' && (
          <div className="px-5 py-3 bg-zinc-50/50 dark:bg-zinc-950/20 border-b border-zinc-150 dark:border-zinc-805 flex flex-wrap gap-4 items-end animate-fade-in">
            <div className="flex flex-col gap-1 text-xs">
              <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Start Date</span>
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
            <div className="flex flex-col gap-1 text-xs">
              <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">End Date</span>
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
        )}

        {/* Transactions Table view */}
        <div className="overflow-x-auto min-h-[200px]">
          <table className="w-full text-left text-xs divide-y divide-zinc-200 dark:divide-zinc-850">
            <thead className="bg-zinc-50 dark:bg-zinc-950/40 text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-[9px] font-bold">
              <tr>
                <th className="px-5 py-3">Txn ID</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Order ID</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3 text-right">Amount</th>
                <th className="px-5 py-3">Gateway</th>
                <th className="px-5 py-3">Method</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Created Date</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850 bg-white dark:bg-zinc-900/40 text-black dark:text-white font-semibold">
              {tableLoading ? (
                [1, 2, 3, 4, 5].map((row) => (
                  <tr key={row} className="animate-pulse">
                    <td className="px-5 py-4"><div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-16"></div></td>
                    <td className="px-5 py-4"><div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-20"></div></td>
                    <td className="px-5 py-4"><div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-16"></div></td>
                    <td className="px-5 py-4"><div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-24"></div></td>
                    <td className="px-5 py-4 text-right"><div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-14 ml-auto"></div></td>
                    <td className="px-5 py-4"><div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-16"></div></td>
                    <td className="px-5 py-4"><div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-12"></div></td>
                    <td className="px-5 py-4"><div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded-full w-20"></div></td>
                    <td className="px-5 py-4"><div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-24"></div></td>
                    <td className="px-5 py-4"><div className="h-7 bg-zinc-200 dark:bg-zinc-800 rounded w-8 ml-auto"></div></td>
                  </tr>
                ))
              ) : tableData.length > 0 ? (
                tableData.map((tx) => (
                  <tr key={tx.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10 group transition-colors">

                    {/* Txn ID */}
                    <td className="px-5 py-3.5 font-mono text-[10px] text-zinc-500 dark:text-zinc-400 font-extrabold">{tx.transactionId}</td>

                    {/* Type */}
                    <td className="px-5 py-3.5">
                      <span className="text-[9px] font-bold text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-2 py-0.5 rounded uppercase tracking-wider font-mono">
                        {tx.type}
                      </span>
                    </td>

                    {/* Order ID */}
                    <td className="px-5 py-3.5 font-mono text-[10px] text-zinc-800 dark:text-zinc-300 font-bold">{tx.orderId}</td>

                    {/* Customer */}
                    <td className="px-5 py-3.5 text-zinc-900 dark:text-white font-extrabold truncate max-w-[140px]">{tx.customerName || 'Walk-in'}</td>

                    {/* Amount */}
                    <td className="px-5 py-3.5 text-right font-mono font-black text-zinc-900 dark:text-white text-xs">
                      ₹{tx.amount?.toLocaleString('en-IN')}
                    </td>

                    {/* Gateway */}
                    <td className="px-5 py-3.5 font-mono text-[10px] text-zinc-650 dark:text-zinc-300">{tx.gateway}</td>

                    {/* Method */}
                    <td className="px-5 py-3.5 text-zinc-500 dark:text-zinc-400 font-bold">{tx.paymentMethod}</td>

                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold ${getStatusBadge(tx.status)}`}>
                        {tx.status}
                      </span>
                    </td>

                    {/* Created Date */}
                    <td className="px-5 py-3.5 text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold whitespace-nowrap">{tx.createdAt}</td>

                    {/* Actions Menu */}
                    <td className="px-5 py-3.5 text-right relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuRowId(activeMenuRowId === tx.id ? null : tx.id);
                          setSelectedTxnId(tx.transactionId);
                          setSelectedTxnAmount(tx.amount);
                          setSelectedTxnCustomer(tx.customerName);
                        }}
                        className="p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-500 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-850 cursor-pointer transition-colors"
                      >
                        <MoreVertical size={13} />
                      </button>

                      {/* Dropdown Menu */}
                      {activeMenuRowId === tx.id && (
                        <div
                          ref={menuRef}
                          className="absolute right-6 top-10 w-44 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-lg shadow-xl py-1 z-30 divide-y divide-zinc-100 dark:divide-zinc-850 text-left"
                        >
                          <div className="py-0.5">
                            <button
                              onClick={() => { setShowDetailsModal(true); setActiveMenuRowId(null); }}
                              className="w-full px-3 py-1.5 text-[11px] font-bold text-zinc-700 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 flex items-center gap-2 cursor-pointer"
                            >
                              <Eye size={12} className="text-[var(--primary)]" />
                              View Transaction
                            </button>

                            <button
                              onClick={() => { handleCopyTxnId(tx.transactionId); setActiveMenuRowId(null); }}
                              className="w-full px-3 py-1.5 text-[11px] font-bold text-zinc-700 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 flex items-center gap-2 cursor-pointer"
                            >
                              <Copy size={11} />
                              Copy Transaction ID
                            </button>
                          </div>

                          <div className="py-0.5">
                            <button
                              onClick={() => { exportTransactions('pdf', { transactionId: tx.transactionId }); setActiveMenuRowId(null); }}
                              className="w-full px-3 py-1.5 text-[11px] font-bold text-zinc-700 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 flex items-center gap-2 cursor-pointer"
                            >
                              <FileText size={12} className="text-rose-600" />
                              Download PDF
                            </button>
                          </div>

                          {tx.status === 'Failed' && (
                            <div className="py-0.5">
                              <button
                                onClick={() => { setShowRetryModal(true); setActiveMenuRowId(null); }}
                                className="w-full px-3 py-1.5 text-[11px] font-bold text-amber-600 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 flex items-center gap-2 cursor-pointer"
                              >
                                <LoopIcon size={11} className="animate-spin-slow" />
                                Retry Payment
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
                  <td colSpan="10" className="px-5 py-12 text-center text-zinc-400 italic">
                    <AlertTriangle size={24} className="mx-auto text-zinc-300 mb-2" />
                    No transactions found matching the ledger search filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Server-Side Pagination Controller */}
        {tableTotalCount > 0 && (
          <div className="px-5 py-3 border-t border-zinc-150 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 text-xs font-bold flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-zinc-500">Page limit:</span>
              <select
                value={pagination.limit}
                onChange={(e) => setPagination({ page: 1, limit: Number(e.target.value) })}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 px-2 py-0.5 rounded text-[11px] font-bold outline-none text-black dark:text-white"
              >
                <option value={5}>5 records</option>
                <option value={10}>10 records</option>
                <option value={20}>20 records</option>
              </select>
              <span className="text-zinc-400 font-normal ml-2 font-mono">
                Showing {Math.min((pagination.page - 1) * pagination.limit + 1, tableTotalCount)} to {Math.min(pagination.page * pagination.limit, tableTotalCount)} of {tableTotalCount} logs
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination(p => ({ ...p, page: Math.max(1, p.page - 1) }))}
                disabled={pagination.page === 1}
                className="px-2.5 py-1 border border-zinc-250 dark:border-zinc-805 bg-white dark:bg-zinc-900 text-zinc-750 dark:text-zinc-305 rounded hover:bg-zinc-50 dark:hover:bg-zinc-850 disabled:opacity-40 flex items-center gap-0.5 cursor-pointer"
              >
                <ChevronLeft size={13} />
                Prev
              </button>

              <span className="text-zinc-550 font-extrabold px-1">
                {pagination.page} / {Math.ceil(tableTotalCount / pagination.limit) || 1}
              </span>

              <button
                onClick={() => setPagination(p => ({ ...p, page: Math.min(Math.ceil(tableTotalCount / pagination.limit), p.page + 1) }))}
                disabled={pagination.page >= Math.ceil(tableTotalCount / pagination.limit)}
                className="px-2.5 py-1 border border-zinc-250 dark:border-zinc-805 bg-white dark:bg-zinc-900 text-zinc-750 dark:text-zinc-305 rounded hover:bg-zinc-50 dark:hover:bg-zinc-850 disabled:opacity-40 flex items-center gap-0.5 cursor-pointer"
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

      {/* 1. View Details Modal */}
      <TransactionDetails
        isOpen={showDetailsModal}
        onClose={() => { setShowDetailsModal(false); setSelectedTxnId(null); }}
        id={selectedTxnId}
      />

      {/* 2. Retry Confirmation Modal */}
      <RetryModal
        isOpen={showRetryModal}
        onClose={() => { setShowRetryModal(false); setSelectedTxnId(null); }}
        id={selectedTxnId}
        amount={selectedTxnAmount}
        customerName={selectedTxnCustomer}
        onSuccess={handleRefreshData}
      />

      {/* 3. Audit logs history Modal */}
      <AuditLogsModal
        isOpen={showAuditModal}
        onClose={() => setShowAuditModal(false)}
      />

      {/* 4. Export Config Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        filters={filters}
      />

    </div>
  );
}
