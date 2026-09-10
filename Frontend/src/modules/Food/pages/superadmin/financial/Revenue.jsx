import React, { useState, useEffect, useMemo } from 'react';
import {
  Download, Calendar, Map, Store, Search, RefreshCw,
  ArrowUpDown, Filter, ChevronLeft, ChevronRight, ChevronDown, Eye,
  TrendingUp, TrendingDown, HelpCircle, MoreVertical, CreditCard,
  SlidersHorizontal, CheckCircle2, XCircle, FileSpreadsheet, FileText,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, PieChart, Pie, Cell } from 'recharts';

import {
  useRevenueSummary,
  useRevenueChart,
  useRevenueTable,
  useExportRevenue
} from './hooks/useRevenueQuery';

import RevenueDetails from './RevenueDetails';
import apiClient from '../../../../../services/api/axios';

// Static lists for filters mapping
const REGIONS = [
  { id: 'reg-north', name: 'North India' },
  { id: 'reg-south', name: 'South India' },
  { id: 'reg-east', name: 'East India' },
  { id: 'reg-west', name: 'West India' }
];

const ZONES = [
  { id: 'zone-mp', name: 'Madhya Pradesh', regionId: 'reg-north' },
  { id: 'zone-mh', name: 'Maharashtra', regionId: 'reg-west' },
  { id: 'zone-dl', name: 'Delhi NCR', regionId: 'reg-north' },
  { id: 'zone-ka', name: 'Karnataka', regionId: 'reg-south' }
];

const TERRITORIES = [
  { id: 'ter-indore', name: 'Indore', zoneId: 'zone-mp' },
  { id: 'ter-bhopal', name: 'Bhopal', zoneId: 'zone-mp' },
  { id: 'ter-mumbai', name: 'Mumbai', zoneId: 'zone-mh' },
  { id: 'ter-delhi', name: 'Delhi', zoneId: 'zone-dl' },
  { id: 'ter-bangalore', name: 'Bangalore', zoneId: 'zone-ka' }
];

const FRANCHISES = [
  { id: 'fran-indore', name: 'Indore Central', territoryId: 'ter-indore' },
  { id: 'fran-mumbai', name: 'Mumbai Premium', territoryId: 'ter-mumbai' },
  { id: 'fran-delhi', name: 'Delhi Express', territoryId: 'ter-delhi' },
  { id: 'fran-bangalore', name: 'Bangalore Tech', territoryId: 'ter-bangalore' }
];

const STORES = [
  { id: 'store-vijay', name: 'Vijay Nagar Store', franchiseId: 'fran-indore' },
  { id: 'store-bandra', name: 'Bandra West Store', franchiseId: 'fran-mumbai' },
  { id: 'store-cp', name: 'CP Market Store', franchiseId: 'fran-delhi' },
  { id: 'store-indira', name: 'Indiranagar Store', franchiseId: 'fran-bangalore' }
];

export default function Revenue() {
  const [showFiltersPanel, setShowFiltersPanel] = useState(true);
  const [selectedDateFilter, setSelectedDateFilter] = useState('Month'); // Today, Week, Month, Year, Custom
  const [chartInterval, setChartInterval] = useState('Daily'); // Daily, Weekly, Monthly

  // Filter criteria states
  const [filters, setFilters] = useState({
    regionId: '',
    zoneId: '',
    territoryId: '',
    franchiseId: '',
    storeId: '',
    paymentMethod: 'All',
    status: 'Paid',
    search: '',
    startDate: '',
    endDate: ''
  });

  // Debouncing search
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

  // Sorting states
  const [sortField, setSortField] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modal drill-down state
  const [drillDownDate, setDrillDownDate] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Row action menu dropdown tracking
  const [activeMenuRowId, setActiveMenuRowId] = useState(null);

  // Column width resize simulation widths
  const [colWidths, setColWidths] = useState({
    date: 'w-24',
    orders: 'w-20',
    gross: 'w-28',
    discounts: 'w-24',
    refunds: 'w-24',
    tax: 'w-24',
    net: 'w-28',
    actions: 'w-20'
  });

  // Query Hooks
  const { data: summary, loading: summaryLoading, error: summaryError, refetch: refetchSummary } = useRevenueSummary(filters);
  const { data: chartData, loading: chartLoading, error: chartError, refetch: refetchChart } = useRevenueChart(filters);
  const { data: tableData, total: tableTotalCount, loading: tableLoading, error: tableError, refetch: refetchTable } = useRevenueTable(filters, pagination);
  const { exportRevenue, exportLoading } = useExportRevenue();

  // Handle manual refetch
  const handleRefreshData = () => {
    refetchSummary();
    refetchChart();
    refetchTable();
    toast.success('Revenue reports synchronized in real-time');
  };

  // Filter values reset
  const handleResetFilters = () => {
    setFilters({
      regionId: '',
      zoneId: '',
      territoryId: '',
      franchiseId: '',
      storeId: '',
      paymentMethod: 'All',
      status: 'Paid',
      search: '',
      startDate: '',
      endDate: ''
    });
    setSearchTerm('');
    setSelectedDateFilter('Month');
    setPagination({ page: 1, limit: 5 });
    toast.success('Analytics filters reset');
  };

  // Indian Rupee custom formatter
  const formatCurrency = (val) => {
    if (val === undefined || val === null) return '₹0';
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  // Custom date presets mapper
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

  // Chart data source selection
  const currentChartSource = useMemo(() => {
    if (!chartData) return [];
    if (chartInterval === 'Weekly') return chartData.weeklyRevenue || [];
    if (chartInterval === 'Monthly') return chartData.monthlyRevenue || [];
    return chartData.dailyRevenue || [];
  }, [chartData, chartInterval]);

  // Pie chart segments conversion
  const pieData = useMemo(() => {
    if (!chartData || !chartData.breakdown) return [];
    const { foodRevenue, deliveryRevenue, taxRevenue, platformFee } = chartData.breakdown;
    return [
      { name: 'Food Revenue', value: foodRevenue, color: '#3b82f6' },
      { name: 'Delivery Charges', value: deliveryRevenue, color: '#10b981' },
      { name: 'Tax Revenue', value: taxRevenue, color: '#f97316' },
      { name: 'Platform Fees', value: platformFee, color: '#a855f7' }
    ];
  }, [chartData]);

  const totalBreakdownVal = useMemo(() => {
    return pieData.reduce((acc, curr) => acc + curr.value, 0);
  }, [pieData]);

  // Render Table Columns list helper
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Row Action triggers
  const handleRowView = (dateStr) => {
    setDrillDownDate(dateStr);
    setShowDetailsModal(true);
    setActiveMenuRowId(null);
  };

  return (
    <div className="p-3 md:p-4 pb-12 max-w-7xl mx-auto w-full space-y-4 min-h-screen bg-zinc-50 dark:bg-zinc-955 animate-fade-in relative select-none">
      {/* Header Section */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-lg font-bold text-black dark:text-white flex items-center gap-2">
            Revenue Analytics
            <span className="animate-pulse bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-emerald-500/20">
              Live Feed
            </span>
          </h2>
          <p className="text-[10px] font-semibold text-black/60 dark:text-white/60 mt-0.5">
            Enterprise central financial ledger reporting and region-wise overrides
          </p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => exportRevenue('excel', filters)}
            disabled={exportLoading}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] font-bold px-3.5 py-1.8 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors shadow-sm cursor-pointer disabled:opacity-50 text-black dark:text-white"
          >
            <FileSpreadsheet size={13} className="text-emerald-600" />
            Export Excel
          </button>
          <button
            onClick={() => exportRevenue('pdf', filters)}
            disabled={exportLoading}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] font-bold px-3.5 py-1.8 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors shadow-sm cursor-pointer disabled:opacity-50 text-black dark:text-white"
          >
            <FileText size={13} className="text-rose-500" />
            Download PDF
          </button>
          <button
            onClick={handleRefreshData}
            className="p-1.8 border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 transition-colors shadow-sm cursor-pointer"
            title="Refresh Central Database"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </header>

      {/* FILTER BAR PANEL */}
      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 shadow-sm space-y-3">
        <div
          onClick={() => setShowFiltersPanel(!showFiltersPanel)}
          className="flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={13} className="text-[var(--primary)]" />
            <span className="text-xs font-bold text-black dark:text-white">Query Filter Settings</span>
          </div>
          <ChevronDown
            size={14}
            className={`text-zinc-500 transition-transform duration-200 ${showFiltersPanel ? 'rotate-180' : ''}`}
          />
        </div>

        {showFiltersPanel && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-3 border-t border-zinc-150 dark:border-zinc-800 animate-in fade-in duration-200">

            {/* Date Preset */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Timeframe</label>
              <select
                value={selectedDateFilter}
                onChange={(e) => setSelectedDateFilter(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg h-9 px-2 text-xs text-zinc-800 dark:text-zinc-200 focus:ring-2 focus:ring-[var(--primary)] outline-none font-bold"
              >
                <option value="Today">Today</option>
                <option value="Week">This Week</option>
                <option value="Month">This Month</option>
                <option value="Year">This Year</option>
                <option value="Custom">Custom Range</option>
              </select>
            </div>

            {/* Region */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Region</label>
              <select
                value={filters.regionId}
                onChange={(e) => setFilters(prev => ({ ...prev, regionId: e.target.value, zoneId: '', territoryId: '', franchiseId: '', storeId: '' }))}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg h-9 px-2 text-xs text-zinc-800 dark:text-zinc-200 focus:ring-2 focus:ring-[var(--primary)] outline-none font-bold"
              >
                <option value="">All Regions</option>
                {REGIONS.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>

            {/* Zone */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Zone</label>
              <select
                value={filters.zoneId}
                disabled={!filters.regionId}
                onChange={(e) => setFilters(prev => ({ ...prev, zoneId: e.target.value, territoryId: '', franchiseId: '', storeId: '' }))}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg h-9 px-2 text-xs text-zinc-800 dark:text-zinc-200 focus:ring-2 focus:ring-[var(--primary)] outline-none font-bold disabled:opacity-50"
              >
                <option value="">All Zones</option>
                {ZONES
                  .filter(z => z.regionId === filters.regionId)
                  .map(z => (
                    <option key={z.id} value={z.id}>{z.name}</option>
                  ))
                }
              </select>
            </div>

            {/* Franchise */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Franchise</label>
              <select
                value={filters.franchiseId}
                onChange={(e) => setFilters(prev => ({ ...prev, franchiseId: e.target.value, storeId: '' }))}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg h-9 px-2 text-xs text-zinc-800 dark:text-zinc-200 focus:ring-2 focus:ring-[var(--primary)] outline-none font-bold"
              >
                <option value="">All Franchises</option>
                {FRANCHISES.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>

            {/* Store */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Store Outlet</label>
              <select
                value={filters.storeId}
                disabled={!filters.franchiseId}
                onChange={(e) => setFilters(prev => ({ ...prev, storeId: e.target.value }))}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg h-9 px-2 text-xs text-zinc-800 dark:text-zinc-200 focus:ring-2 focus:ring-[var(--primary)] outline-none font-bold disabled:opacity-50"
              >
                <option value="">All Stores</option>
                {STORES
                  .filter(s => s.franchiseId === filters.franchiseId)
                  .map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))
                }
              </select>
            </div>

            {/* Payment Method */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Payment</label>
              <select
                value={filters.paymentMethod}
                onChange={(e) => setFilters(prev => ({ ...prev, paymentMethod: e.target.value }))}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg h-9 px-2 text-xs text-zinc-800 dark:text-zinc-200 focus:ring-2 focus:ring-[var(--primary)] outline-none font-bold"
              >
                <option value="All">All Methods</option>
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
                <option value="Cash">Cash</option>
                <option value="Wallet">Wallet</option>
              </select>
            </div>

            {/* Custom Dates Inputs */}
            {selectedDateFilter === 'Custom' && (
              <>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Start Date</label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg h-9 px-2.5 text-xs text-zinc-800 dark:text-zinc-200 focus:ring-2 focus:ring-[var(--primary)] outline-none font-bold"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">End Date</label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg h-9 px-2.5 text-xs text-zinc-800 dark:text-zinc-200 focus:ring-2 focus:ring-[var(--primary)] outline-none font-bold"
                  />
                </div>
              </>
            )}

            {/* Action buttons */}
            <div className="flex items-end gap-2 col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-6 justify-end pt-1">
              <button
                onClick={handleResetFilters}
                className="h-8.5 px-4 border border-zinc-250 dark:border-zinc-800 text-zinc-700 dark:text-zinc-350 text-xs font-bold rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Reset
              </button>
            </div>

          </div>
        )}
      </section>

      {/* KPI STATS CARDS */}
      <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {summaryLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-16 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl animate-pulse"></div>
          ))
        ) : summaryError ? (
          <div className="col-span-full p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 rounded-xl flex items-center justify-between text-rose-800 dark:text-rose-455">
            <span className="text-xs font-bold flex items-center gap-1.5">
              <XCircle size={15} /> Error loading summary metrics.
            </span>
            <button onClick={refetchSummary} className="text-[10px] font-black underline">Retry</button>
          </div>
        ) : summary ? (
          <>
            {/* Gross Revenue */}
            <div className="bg-white dark:bg-zinc-900 p-3 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm flex flex-col justify-between hover:border-[var(--primary)]/30 hover:shadow-md cursor-pointer transition-all duration-300 relative group" title="Sum of all transaction totals before refund adjustments">
              <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Gross Revenue</span>
              <span className="text-base font-black text-black dark:text-white mt-1.5 font-mono">{formatCurrency(summary.grossRevenue)}</span>
              <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-1 py-0.2 rounded w-fit mt-1 flex items-center gap-0.5">
                <TrendingUp size={9} /> +12%
              </span>
            </div>

            {/* Net Revenue */}
            <div className="bg-white dark:bg-zinc-900 p-3 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm flex flex-col justify-between hover:border-emerald-500/30 hover:shadow-md cursor-pointer transition-all duration-300 relative group border-t-2 border-t-emerald-500" title="Final profit after discounts and refund deductions">
              <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Net Revenue</span>
              <span className="text-base font-black text-emerald-605 dark:text-emerald-400 mt-1.5 font-mono">{formatCurrency(summary.netRevenue)}</span>
              <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-1 py-0.2 rounded w-fit mt-1 flex items-center gap-0.5">
                <TrendingUp size={9} /> +8%
              </span>
            </div>

            {/* Orders Revenue */}
            <div className="bg-white dark:bg-zinc-900 p-3 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm flex flex-col justify-between hover:border-[var(--primary)]/30 hover:shadow-md cursor-pointer transition-all duration-300 relative group" title="Aggregated orders subtotal">
              <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Food Revenue</span>
              <span className="text-base font-black text-black dark:text-white mt-1.5 font-mono">{formatCurrency(summary.ordersRevenue)}</span>
              <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-1 py-0.2 rounded w-fit mt-1 flex items-center gap-0.5">
                <TrendingUp size={9} /> +15%
              </span>
            </div>

            {/* Delivery Fee */}
            <div className="bg-white dark:bg-zinc-900 p-3 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm flex flex-col justify-between hover:border-[var(--primary)]/30 hover:shadow-md cursor-pointer transition-all duration-300 relative group" title="Charges accumulated for third-party courier dispatch">
              <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Delivery Fees</span>
              <span className="text-base font-black text-black dark:text-white mt-1.5 font-mono">{formatCurrency(summary.deliveryRevenue)}</span>
              <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-1 py-0.2 rounded w-fit mt-1 flex items-center gap-0.5">
                <TrendingUp size={9} /> +5%
              </span>
            </div>

            {/* Tax Collected */}
            <div className="bg-white dark:bg-zinc-900 p-3 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm flex flex-col justify-between hover:border-[var(--primary)]/30 hover:shadow-md cursor-pointer transition-all duration-300 relative group" title="Aggregated central GST (9% + 9%)">
              <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Tax Collected</span>
              <span className="text-base font-black text-black dark:text-white mt-1.5 font-mono">{formatCurrency(summary.taxCollected)}</span>
              <span className="text-[8px] font-bold text-zinc-500 bg-zinc-50 dark:bg-zinc-800 px-1 py-0.2 rounded w-fit mt-1">Neutral</span>
            </div>

            {/* Refund Amount */}
            <div className="bg-white dark:bg-zinc-900 p-3 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm flex flex-col justify-between hover:border-rose-500/30 hover:shadow-md cursor-pointer transition-all duration-300 relative group border-t-2 border-t-rose-500" title="Returned values for cancelled/disputed orders">
              <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Refund Amount</span>
              <span className="text-base font-black text-rose-600 dark:text-rose-455 mt-1.5 font-mono">{formatCurrency(summary.refundAmount)}</span>
              <span className="text-[8px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-955/20 px-1 py-0.2 rounded w-fit mt-1 flex items-center gap-0.5">
                <TrendingDown size={9} /> -2%
              </span>
            </div>

            {/* Average Ticket Size */}
            <div className="bg-white dark:bg-zinc-900 p-3 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm flex flex-col justify-between hover:border-[var(--primary)]/30 hover:shadow-md cursor-pointer transition-all duration-300 relative group" title="Average spend size per transaction index">
              <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Avg Order Value</span>
              <span className="text-base font-black text-black dark:text-white mt-1.5 font-mono">{formatCurrency(summary.avgOrderValue)}</span>
              <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-1 py-0.2 rounded w-fit mt-1 flex items-center gap-0.5">
                <TrendingUp size={9} /> +4%
              </span>
            </div>

            {/* Growth */}
            <div className="bg-white dark:bg-zinc-900 p-3 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm flex flex-col justify-between hover:border-[var(--primary)]/30 hover:shadow-md cursor-pointer transition-all duration-300 relative group border-t-2 border-t-[var(--primary)]" title="Growth percentile index relative to previous period">
              <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Revenue Growth</span>
              <span className="text-base font-black text-[var(--primary)] mt-1.5 font-mono">+{summary.revenueGrowth}%</span>
              <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-1 py-0.2 rounded w-fit mt-1">Accelerated</span>
            </div>
          </>
        ) : null}
      </section>

      {/* CHARTS CONTAINER */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Line Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm flex flex-col justify-between h-[300px]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="font-bold text-xs text-black dark:text-white flex items-center gap-1.5">
                <TrendingUp size={14} className="text-[var(--primary)]" />
                Revenue Trend Chart
              </h3>
              <p className="text-[9px] font-semibold text-zinc-400 dark:text-zinc-500 mt-0.5">
                Gross sales index mapped dynamically across timeline parameters
              </p>
            </div>

            <div className="flex bg-zinc-100 dark:bg-zinc-800/80 p-0.5 rounded-lg">
              {['Daily', 'Weekly', 'Monthly'].map((interval) => (
                <button
                  key={interval}
                  onClick={() => setChartInterval(interval)}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${chartInterval === interval ? 'bg-white dark:bg-zinc-900 text-[var(--primary)] shadow-sm' : 'text-zinc-550 dark:text-zinc-400 hover:text-[var(--primary)]'}`}
                >
                  {interval}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 w-full h-[180px] mt-3">
            {chartLoading ? (
              <div className="w-full h-full bg-zinc-50 dark:bg-zinc-950 border border-dashed rounded-lg animate-pulse flex items-center justify-center text-[10px] text-zinc-400">Loading chart canvas...</div>
            ) : chartError ? (
              <div className="w-full h-full bg-rose-500/5 border border-dashed border-rose-500/20 rounded-lg flex items-center justify-center text-xs text-rose-500">Error loading trend chart.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={currentChartSource} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenueTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#888888" fontSize={9} tickLine={false} axisLine={false} dy={5} />
                  <YAxis stroke="#888888" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val >= 10000000 ? `${(val / 10000000).toFixed(1)}Cr` : val >= 100000 ? `${(val / 100000).toFixed(1)}L` : val}`} />
                  <RechartsTooltip
                    formatter={(value) => [formatCurrency(value), 'Revenue']}
                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e4e4e7', fontSize: '10px', borderRadius: '8px' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenueTrend)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm flex flex-col justify-between h-[300px]">
          <h3 className="font-bold text-xs text-black dark:text-white mb-2">Revenue Breakdown</h3>

          <div className="flex-1 flex items-center justify-center relative">
            {chartLoading ? (
              <div className="w-24 h-24 rounded-full border border-dashed animate-pulse"></div>
            ) : (
              <div className="relative w-36 h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={60}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(value) => [formatCurrency(value), 'Amount']}
                      contentStyle={{ fontSize: '9px', borderRadius: '4px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center select-none pointer-events-none">
                  <span className="text-xs font-black text-black dark:text-white">{formatCurrency(totalBreakdownVal)}</span>
                  <span className="text-[7px] font-bold text-zinc-450 uppercase tracking-widest mt-0.5">Total Share</span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5 mt-2">
            {pieData.map((item, idx) => {
              const pct = totalBreakdownVal > 0 ? Math.round((item.value / totalBreakdownVal) * 100) : 0;
              return (
                <div key={idx} className="flex justify-between items-center text-[10px] font-bold">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                    <span className="text-zinc-600 dark:text-zinc-400 truncate">{item.name}</span>
                  </div>
                  <span className="text-zinc-950 dark:text-white font-black">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>

      </section>

      {/* REVENUE aggregated table */}
      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
        {/* Table Header Controls */}
        <div className="p-3.5 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-xs text-black dark:text-white">Daily Revenue Aggregations</h3>
            <span className="text-[9px] font-bold text-zinc-550 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-850 px-2 py-0.5 rounded-full border border-zinc-150 dark:border-zinc-800">
              Server-side Resolved
            </span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" size={13} />
            <input
              type="text"
              placeholder="Search date (e.g. 18-Jun)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 h-8.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-zinc-800 dark:text-zinc-200 focus:ring-2 focus:ring-[var(--primary)] outline-none w-full transition-all font-semibold"
            />
          </div>
        </div>

        {/* Filters chips preview */}
        {Object.values(filters).some(x => x !== '' && x !== 'All' && x !== 'Paid') && (
          <div className="px-3.5 py-2 bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-850 flex flex-wrap gap-1.5 items-center">
            <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider mr-1">Active filter chips:</span>
            {filters.regionId && <span className="bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 px-2 py-0.5 rounded text-[9px] font-bold">Region: {filters.regionId}</span>}
            {filters.franchiseId && <span className="bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 px-2 py-0.5 rounded text-[9px] font-bold">Franchise: {filters.franchiseId}</span>}
            {filters.paymentMethod !== 'All' && <span className="bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 px-2 py-0.5 rounded text-[9px] font-bold">Method: {filters.paymentMethod}</span>}
            <button onClick={handleResetFilters} className="text-[9px] font-black hover:underline text-[var(--primary)] cursor-pointer ml-auto">Clear All</button>
          </div>
        )}

        {/* Database table canvas */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead className="bg-zinc-50 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800 sticky top-0">
              <tr>
                <th className={`px-4 py-2.5 font-bold text-[9px] text-zinc-450 uppercase tracking-widest ${colWidths.date}`}>
                  <button onClick={() => handleSort('date')} className="flex items-center gap-1 hover:text-zinc-800 dark:hover:text-white cursor-pointer">
                    Date {sortField === 'date' && <ArrowUpDown size={10} />}
                  </button>
                </th>
                <th className={`px-4 py-2.5 font-bold text-[9px] text-zinc-450 uppercase tracking-widest text-center ${colWidths.orders}`}>
                  <button onClick={() => handleSort('totalOrders')} className="flex items-center gap-1 hover:text-zinc-800 dark:hover:text-white cursor-pointer mx-auto">
                    Orders {sortField === 'totalOrders' && <ArrowUpDown size={10} />}
                  </button>
                </th>
                <th className={`px-4 py-2.5 font-bold text-[9px] text-zinc-450 uppercase tracking-widest text-right ${colWidths.gross}`}>
                  <button onClick={() => handleSort('grossRevenue')} className="flex items-center gap-1 hover:text-zinc-800 dark:hover:text-white cursor-pointer ml-auto">
                    Gross Revenue {sortField === 'grossRevenue' && <ArrowUpDown size={10} />}
                  </button>
                </th>
                <th className={`px-4 py-2.5 font-bold text-[9px] text-zinc-450 uppercase tracking-widest text-right ${colWidths.discounts}`}>
                  Discounts
                </th>
                <th className={`px-4 py-2.5 font-bold text-[9px] text-zinc-450 uppercase tracking-widest text-right ${colWidths.refunds}`}>
                  Refunds
                </th>
                <th className={`px-4 py-2.5 font-bold text-[9px] text-zinc-450 uppercase tracking-widest text-right ${colWidths.tax}`}>
                  Tax (GST)
                </th>
                <th className={`px-4 py-2.5 font-bold text-[9px] text-zinc-450 uppercase tracking-widest text-right ${colWidths.net}`}>
                  <button onClick={() => handleSort('netRevenue')} className="flex items-center gap-1 hover:text-zinc-800 dark:hover:text-white cursor-pointer ml-auto">
                    Net Revenue {sortField === 'netRevenue' && <ArrowUpDown size={10} />}
                  </button>
                </th>
                <th className={`px-4 py-2.5 font-bold text-[9px] text-zinc-455 uppercase tracking-widest text-center ${colWidths.actions}`}>
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {tableLoading ? (
                Array.from({ length: pagination.limit }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-4 py-2.5"><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-14"></div></td>
                    <td className="px-4 py-2.5"><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-10 mx-auto"></div></td>
                    <td className="px-4 py-2.5"><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-18 ml-auto"></div></td>
                    <td className="px-4 py-2.5"><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-16 ml-auto"></div></td>
                    <td className="px-4 py-2.5"><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-14 ml-auto"></div></td>
                    <td className="px-4 py-2.5"><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-16 ml-auto"></div></td>
                    <td className="px-4 py-2.5"><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-18 ml-auto"></div></td>
                    <td className="px-4 py-2.5"><div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded w-10 mx-auto"></div></td>
                  </tr>
                ))
              ) : tableError ? (
                <tr>
                  <td colSpan="8" className="px-4 py-12 text-center text-rose-500 font-bold text-xs">
                    Failed to load table records. Click Refresh to reload.
                  </td>
                </tr>
              ) : tableData.length > 0 ? (
                tableData.map((row) => (
                  <tr key={row.date} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors group">
                    <td className="px-4 py-2.5 font-bold text-xs text-zinc-900 dark:text-zinc-100 whitespace-nowrap">{row.date}</td>
                    <td className="px-4 py-2.5 font-mono text-xs font-semibold text-center">{row.totalOrders}</td>
                    <td className="px-4 py-2.5 font-mono text-xs font-bold text-zinc-900 dark:text-zinc-50 text-right">{formatCurrency(row.grossRevenue)}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-zinc-550 dark:text-zinc-400 text-right">{formatCurrency(row.discountAmount)}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-rose-600 dark:text-rose-455 text-right">{formatCurrency(row.refundAmount)}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-zinc-550 dark:text-zinc-400 text-right">{formatCurrency(row.taxCollected)}</td>
                    <td className="px-4 py-2.5 font-mono text-xs font-black text-emerald-600 dark:text-emerald-400 text-right">{formatCurrency(row.netRevenue)}</td>
                    <td className="px-4 py-2.5 text-center relative">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleRowView(row.date)}
                          className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors text-zinc-500 hover:text-[var(--primary)] cursor-pointer"
                          title="Detailed Breakdown View"
                        >
                          <Eye size={13} />
                        </button>

                        <div className="relative">
                          <button
                            onClick={() => setActiveMenuRowId(prev => prev === row.date ? null : row.date)}
                            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors text-zinc-450 cursor-pointer"
                          >
                            <MoreVertical size={13} />
                          </button>

                          {activeMenuRowId === row.date && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setActiveMenuRowId(null)}></div>
                              <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl z-50 py-1 text-left">
                                <button
                                  onClick={() => handleRowView(row.date)}
                                  className="w-full px-3 py-1.5 text-[10px] font-bold text-zinc-700 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-1.5"
                                >
                                  <Eye size={12} className="text-[var(--primary)]" />
                                  <span>View Revenue</span>
                                </button>
                                <button
                                  onClick={() => { exportRevenue('pdf', { date: row.date }); setActiveMenuRowId(null); }}
                                  className="w-full px-3 py-1.5 text-[10px] font-bold text-zinc-700 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-1.5"
                                >
                                  <FileText size={12} className="text-rose-500" />
                                  <span>Download PDF</span>
                                </button>
                                <button
                                  onClick={() => { exportRevenue('excel', { date: row.date }); setActiveMenuRowId(null); }}
                                  className="w-full px-3 py-1.5 text-[10px] font-bold text-zinc-700 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-1.5"
                                >
                                  <FileSpreadsheet size={12} className="text-emerald-600" />
                                  <span>Export Excel</span>
                                </button>
                              </div>
                            </>
                          )}
                        </div>

                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                /* Empty state */
                <tr>
                  <td colSpan="8" className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-zinc-400">
                      <HelpCircle size={32} className="text-zinc-300 stroke-[1.5]" />
                      <p className="text-xs font-extrabold">No Revenue Records Found</p>
                      <p className="text-[10px] text-zinc-500 leading-relaxed max-w-[280px]">
                        No aggregated revenue summarization data found matching the selected filters.
                      </p>
                      <button
                        onClick={handleResetFilters}
                        className="mt-2 text-[10px] font-bold px-3 py-1.5 bg-[var(--primary)] text-white rounded-lg shadow cursor-pointer hover:opacity-90 active:scale-95 transition-all"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Server-side Pagination Toolbar */}
        {tableData.length > 0 && (
          <div className="px-3.5 py-2.5 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-center gap-3 bg-zinc-50 dark:bg-zinc-900/50 text-[11px] font-semibold text-zinc-500">
            <span>Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, tableTotalCount)} of {tableTotalCount} daily summaries</span>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span>Rows:</span>
                <select
                  value={pagination.limit}
                  onChange={(e) => { setPagination(prev => ({ ...prev, limit: parseInt(e.target.value), page: 1 })); }}
                  className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded px-1.5 py-0.5 text-xs text-zinc-700 dark:text-zinc-200 font-bold focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
              </div>

              <div className="flex items-center gap-1 ml-2">
                <button
                  disabled={pagination.page === 1}
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(prev.page - 1, 1) }))}
                  className="w-6.5 h-6.5 flex items-center justify-center rounded border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-150 dark:hover:bg-zinc-900 text-zinc-705 dark:text-zinc-300 disabled:opacity-50 cursor-pointer"
                >
                  <ChevronLeft size={13} />
                </button>
                <span className="text-zinc-850 dark:text-zinc-200 font-bold px-1">Page {pagination.page} of {Math.max(1, Math.ceil(tableTotalCount / pagination.limit))}</span>
                <button
                  disabled={pagination.page >= Math.ceil(tableTotalCount / pagination.limit)}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  className="w-6.5 h-6.5 flex items-center justify-center rounded border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-150 dark:hover:bg-zinc-900 text-zinc-705 dark:text-zinc-300 disabled:opacity-50 cursor-pointer"
                >
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* View Details modal popup */}
      <RevenueDetails
        isOpen={showDetailsModal}
        onClose={() => { setShowDetailsModal(false); setDrillDownDate(null); }}
        date={drillDownDate}
      />

    </div>
  );
}
