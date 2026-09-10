import React, { useState, useEffect } from 'react';
import { 
  Download, Calendar, Search, RefreshCw, ArrowUpDown, Filter, 
  ChevronLeft, ChevronRight, ChevronDown, Eye, TrendingUp, HelpCircle, 
  MoreVertical, CreditCard, SlidersHorizontal, CheckCircle2, XCircle, 
  FileSpreadsheet, FileText, Landmark, Percent, Edit, History 
} from 'lucide-react';
import { toast } from 'sonner';

import {
  useCommissionSummary,
  useCommissionTable,
  useExportCommission
} from './hooks/useCommissionQuery';

import CommissionDetails from './CommissionDetails';
import ManualAdjustmentModal from './ManualAdjustmentModal';
import AdjustmentHistoryModal from './AdjustmentHistoryModal';

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
  { id: 'ter-mumbai', name: 'Mumbai', zoneId: 'zone-mh' },
  { id: 'ter-delhi', name: 'Delhi', zoneId: 'zone-dl' },
  { id: 'ter-bangalore', name: 'Bangalore', zoneId: 'zone-ka' }
];

const FRANCHISES_FILTER_LIST = [
  { id: 'fran-mumbai', name: 'Mumbai Central Franchise' },
  { id: 'fran-delhi', name: 'Delhi Express Franchise' },
  { id: 'fran-bangalore', name: 'Bangalore Tech Franchise' },
  { id: 'fran-indore', name: 'Indore Central Franchise' }
];

export default function FranchiseCommission() {
  const [showFiltersPanel, setShowFiltersPanel] = useState(true);
  const [selectedDateFilter, setSelectedDateFilter] = useState('Month');

  // Query and sorting states
  const [filters, setFilters] = useState({
    regionId: '',
    zoneId: '',
    territoryId: '',
    franchiseId: '',
    status: 'All', // Commission Status (Active, Pending, Paid, Overdue)
    settlementStatus: 'All', // Settlement Status (Settled, Pending, Partial)
    search: '',
    startDate: '',
    endDate: ''
  });

  const [searchTerm, setSearchTerm] = useState('');
  useEffect(() => {
    const handler = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchTerm }));
      setPagination(prev => ({ ...prev, page: 1 }));
    }, 600);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const [pagination, setPagination] = useState({ page: 1, limit: 5 });
  const [sortField, setSortField] = useState('franchise');
  const [sortOrder, setSortOrder] = useState('asc');

  // Modals state
  const [selectedFranchiseId, setSelectedFranchiseId] = useState(null);
  const [selectedFranchiseName, setSelectedFranchiseName] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Popover menu tracking
  const [activeMenuRowId, setActiveMenuRowId] = useState(null);

  // Queries
  const { data: summary, loading: summaryLoading, error: summaryError, refetch: refetchSummary } = useCommissionSummary(filters);
  const { data: tableData, total: tableTotalCount, loading: tableLoading, error: tableError, refetch: refetchTable } = useCommissionTable(filters, pagination);
  const { exportCommission, exportLoading } = useExportCommission();

  const handleRefresh = () => {
    refetchSummary();
    refetchTable();
    toast.success("Commissions ledger synced in real-time");
  };

  const handleResetFilters = () => {
    setFilters({
      regionId: '',
      zoneId: '',
      territoryId: '',
      franchiseId: '',
      status: 'All',
      settlementStatus: 'All',
      search: '',
      startDate: '',
      endDate: ''
    });
    setSearchTerm('');
    setSelectedDateFilter('Month');
    setPagination({ page: 1, limit: 5 });
    toast.success("Filters reset successfully");
  };

  const formatCurrency = (val) => {
    if (val === undefined || val === null) return '₹0';
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  // Date Presets Handler
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

  const handleRowAction = (action, row) => {
    setSelectedFranchiseId(row.id);
    setSelectedFranchiseName(row.name);
    setActiveMenuRowId(null);

    if (action === 'details') {
      setShowDetailsModal(true);
    } else if (action === 'adjustment') {
      setShowAdjustmentModal(true);
    } else if (action === 'pdf') {
      exportCommission('pdf', { franchiseId: row.id });
    } else if (action === 'excel') {
      exportCommission('excel', { franchiseId: row.id });
    }
  };

  return (
    <div className="p-3 md:p-4 pb-12 max-w-7xl mx-auto w-full space-y-4 min-h-screen bg-zinc-50 dark:bg-zinc-955 animate-fade-in relative select-none">
      
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-lg font-bold text-black dark:text-white flex items-center gap-2">
            Franchise Commission Analytics
            <span className="animate-pulse bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-emerald-500/20">
              Live Feed
            </span>
          </h2>
          <p className="text-[10px] font-semibold text-black/60 dark:text-white/60 mt-0.5">
            Audit franchise commission splits, settlement statuses, and manual ledger overrides
          </p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
          <button
            onClick={() => { setSelectedFranchiseId(''); setSelectedFranchiseName('All Entities'); setShowHistoryModal(true); }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] font-bold px-3.5 py-1.8 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-sm cursor-pointer text-black dark:text-white"
          >
            <History size={13} className="text-zinc-500" />
            Adjustment Logs
          </button>
          <button
            onClick={() => exportCommission('excel', filters)}
            disabled={exportLoading}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] font-bold px-3.5 py-1.8 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-sm cursor-pointer disabled:opacity-50 text-black dark:text-white"
          >
            <FileSpreadsheet size={13} className="text-emerald-600" />
            Export Excel
          </button>
          <button
            onClick={() => exportCommission('pdf', filters)}
            disabled={exportLoading}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] font-bold px-3.5 py-1.8 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-sm cursor-pointer disabled:opacity-50 text-black dark:text-white"
          >
            <FileText size={13} className="text-rose-500" />
            Download PDF
          </button>
          <button
            onClick={handleRefresh}
            className="p-1.8 border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 transition-colors shadow-sm cursor-pointer"
            title="Refresh database"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {summaryLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl animate-pulse"></div>
          ))
        ) : summary ? (
          <>
            <div className="bg-white dark:bg-zinc-900 p-3 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm flex flex-col justify-between hover:border-[var(--primary)]/30 transition-all cursor-pointer relative group" title="Aggregated Platform Commission Earnings">
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Total Commission Revenue</span>
              <span className="text-base font-black text-black dark:text-white mt-1.5 font-mono">{formatCurrency(summary.totalRevenue)}</span>
              <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-1 py-0.2 rounded w-fit mt-1 flex items-center gap-0.5">
                <TrendingUp size={9} /> +12.4%
              </span>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-3 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm flex flex-col justify-between hover:border-amber-500/30 transition-all cursor-pointer relative group border-t-2 border-t-amber-500" title="Commissions currently pending settlement cycles">
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Pending Commission</span>
              <span className="text-base font-black text-amber-600 mt-1.5 font-mono">{formatCurrency(summary.pendingCommission)}</span>
              <span className="text-[8px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-955/20 px-1 py-0.2 rounded w-fit mt-1">Needs Settlement</span>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-3 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm flex flex-col justify-between hover:border-emerald-500/30 transition-all cursor-pointer relative group border-t-2 border-t-emerald-500" title="Commissions settled in bank accounts">
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Settled Commission</span>
              <span className="text-base font-black text-emerald-605 mt-1.5 font-mono">{formatCurrency(summary.settledCommission)}</span>
              <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-955/25 px-1 py-0.2 rounded w-fit mt-1">↑ 8.5%</span>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-3 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm flex flex-col justify-between hover:border-[var(--primary)]/30 transition-all cursor-pointer relative group" title="Total active verified franchise entities">
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Active Franchise Count</span>
              <span className="text-base font-black text-black dark:text-white mt-1.5 font-mono">{summary.activeFranchises}</span>
              <span className="text-[8px] font-bold text-zinc-550 bg-zinc-100 dark:bg-zinc-800 px-1 py-0.2 rounded w-fit mt-1">Verified Nodes</span>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-3 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm flex flex-col justify-between hover:border-[var(--primary)]/30 transition-all cursor-pointer relative group" title="Highest Commission Revenue from a single franchise">
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Highest Franchise Revenue</span>
              <span className="text-base font-black text-black dark:text-white mt-1.5 font-mono">{formatCurrency(summary.highestRevenue)}</span>
              <span className="text-[8px] font-bold text-zinc-500 truncate mt-1 max-w-[130px]" title={summary.topFranchiseName}>
                {summary.topFranchiseName}
              </span>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-3 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm flex flex-col justify-between hover:border-[var(--primary)]/30 transition-all cursor-pointer relative group border-t-2 border-t-[var(--primary)]" title="Average platform commission commission share rate">
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Average Commission %</span>
              <span className="text-base font-black text-[var(--primary)] mt-1.5 font-mono">{summary.averageRate}%</span>
              <span className="text-[8px] font-bold text-[var(--primary)] bg-[var(--primary)]/5 px-1 py-0.2 rounded w-fit mt-1">Contract Standard</span>
            </div>
          </>
        ) : null}
      </section>

      {/* Query Filters */}
      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 shadow-sm space-y-3">
        <div 
          onClick={() => setShowFiltersPanel(!showFiltersPanel)}
          className="flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={13} className="text-[var(--primary)]" />
            <span className="text-xs font-bold text-black dark:text-white">Query Filters Configuration</span>
          </div>
          <ChevronDown 
            size={14}
            className={`text-zinc-550 transition-transform duration-200 ${showFiltersPanel ? 'rotate-180' : ''}`}
          />
        </div>

        {showFiltersPanel && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-3 border-t border-zinc-150 dark:border-zinc-800 animate-in fade-in duration-200">
            
            {/* Timeframe */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Date range</label>
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
              <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Region</label>
              <select
                value={filters.regionId}
                onChange={(e) => setFilters(prev => ({ ...prev, regionId: e.target.value, zoneId: '', territoryId: '' }))}
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
              <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Zone</label>
              <select
                value={filters.zoneId}
                disabled={!filters.regionId}
                onChange={(e) => setFilters(prev => ({ ...prev, zoneId: e.target.value, territoryId: '' }))}
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

            {/* Territory */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Territory</label>
              <select
                value={filters.territoryId}
                disabled={!filters.zoneId}
                onChange={(e) => setFilters(prev => ({ ...prev, territoryId: e.target.value }))}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg h-9 px-2 text-xs text-zinc-800 dark:text-zinc-200 focus:ring-2 focus:ring-[var(--primary)] outline-none font-bold disabled:opacity-50"
              >
                <option value="">All Territories</option>
                {TERRITORIES
                  .filter(t => t.zoneId === filters.zoneId)
                  .map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))
                }
              </select>
            </div>

            {/* Commission Status */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Node Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg h-9 px-2 text-xs text-zinc-800 dark:text-zinc-200 focus:ring-2 focus:ring-[var(--primary)] outline-none font-bold"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>

            {/* Settlement Status */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Settlement Status</label>
              <select
                value={filters.settlementStatus}
                onChange={(e) => setFilters(prev => ({ ...prev, settlementStatus: e.target.value }))}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg h-9 px-2 text-xs text-zinc-800 dark:text-zinc-200 focus:ring-2 focus:ring-[var(--primary)] outline-none font-bold"
              >
                <option value="All">All Settlements</option>
                <option value="Settled">Settled</option>
                <option value="Pending">Pending</option>
                <option value="Partial">Partial</option>
              </select>
            </div>

            {/* Custom range dates */}
            {selectedDateFilter === 'Custom' && (
              <>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Start Date</label>
                  <input 
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg h-9 px-2 text-xs text-zinc-850 dark:text-zinc-200 focus:ring-2 focus:ring-[var(--primary)] outline-none font-semibold"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">End Date</label>
                  <input 
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg h-9 px-2 text-xs text-zinc-850 dark:text-zinc-200 focus:ring-2 focus:ring-[var(--primary)] outline-none font-semibold"
                  />
                </div>
              </>
            )}

            {/* Trigger buttons */}
            <div className="flex items-end gap-2 col-span-full justify-end pt-1">
              <button
                onClick={handleResetFilters}
                className="h-8.5 px-4 border border-zinc-250 dark:border-zinc-850 text-zinc-700 dark:text-zinc-350 text-xs font-bold rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Reset
              </button>
            </div>

          </div>
        )}
      </section>

      {/* Main Commission aggregated Table */}
      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
        {/* Table Controls */}
        <div className="p-3.5 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-xs text-black dark:text-white">Franchise Commissions Ledger</h3>
            <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-850 px-2 py-0.5 rounded-full border border-zinc-150 dark:border-zinc-800">
              Server-side Paginated
            </span>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" size={13} />
            <input 
              type="text"
              placeholder="Search by franchise, owner, GST..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 h-8.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-zinc-850 dark:text-zinc-200 focus:ring-2 focus:ring-[var(--primary)] outline-none w-full transition-all font-semibold"
            />
          </div>
        </div>

        {/* Chips preview */}
        {Object.values(filters).some(v => v !== '' && v !== 'All') && (
          <div className="px-3.5 py-2 bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-850 flex flex-wrap gap-1.5 items-center">
            <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider mr-1">Active filter chips:</span>
            {filters.regionId && <span className="bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 px-2 py-0.5 rounded text-[9px] font-bold">Region: {filters.regionId}</span>}
            {filters.status !== 'All' && <span className="bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 px-2 py-0.5 rounded text-[9px] font-bold">Status: {filters.status}</span>}
            {filters.settlementStatus !== 'All' && <span className="bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 px-2 py-0.5 rounded text-[9px] font-bold">Settlement: {filters.settlementStatus}</span>}
            <button onClick={handleResetFilters} className="text-[9px] font-black hover:underline text-[var(--primary)] cursor-pointer ml-auto">Clear All</button>
          </div>
        )}

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="bg-zinc-50 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800 sticky top-0">
              <tr>
                <th className="px-4 py-2.5 font-bold text-[9px] text-zinc-455 uppercase tracking-widest w-48">Franchise</th>
                <th className="px-4 py-2.5 font-bold text-[9px] text-zinc-455 uppercase tracking-widest text-center w-20">Orders</th>
                <th className="px-4 py-2.5 font-bold text-[9px] text-zinc-455 uppercase tracking-widest text-right w-28">Gross Revenue</th>
                <th className="px-4 py-2.5 font-bold text-[9px] text-zinc-455 uppercase tracking-widest text-center w-24">Commission %</th>
                <th className="px-4 py-2.5 font-bold text-[9px] text-zinc-455 uppercase tracking-widest text-right w-28">Platform Earnings</th>
                <th className="px-4 py-2.5 font-bold text-[9px] text-zinc-455 uppercase tracking-widest text-right w-28">Pending</th>
                <th className="px-4 py-2.5 font-bold text-[9px] text-zinc-455 uppercase tracking-widest text-right w-28">Settled</th>
                <th className="px-4 py-2.5 font-bold text-[9px] text-zinc-455 uppercase tracking-widest text-center w-28">Settlement Status</th>
                <th className="px-4 py-2.5 font-bold text-[9px] text-zinc-455 uppercase tracking-widest text-center w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {tableLoading ? (
                Array.from({ length: pagination.limit }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-2.5"><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-36"></div></td>
                    <td className="px-4 py-2.5"><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-10 mx-auto"></div></td>
                    <td className="px-4 py-2.5"><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-18 ml-auto"></div></td>
                    <td className="px-4 py-2.5"><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-10 mx-auto"></div></td>
                    <td className="px-4 py-2.5"><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-18 ml-auto"></div></td>
                    <td className="px-4 py-2.5"><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-16 ml-auto"></div></td>
                    <td className="px-4 py-2.5"><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-16 ml-auto"></div></td>
                    <td className="px-4 py-2.5"><div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded w-16 mx-auto"></div></td>
                    <td className="px-4 py-2.5"><div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded w-8 mx-auto"></div></td>
                  </tr>
                ))
              ) : tableError ? (
                <tr>
                  <td colSpan="9" className="px-4 py-12 text-center text-rose-500 font-bold text-xs">
                    Failed to load table records. Click Refresh to reload.
                  </td>
                </tr>
              ) : tableData.length > 0 ? (
                tableData.map((row) => (
                  <tr key={row.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors group text-xs">
                    <td className="px-4 py-2.5 font-bold text-zinc-900 dark:text-zinc-100">
                      <div>{row.name}</div>
                      <span className="text-[10px] text-zinc-400 font-semibold">{row.ownerName}</span>
                    </td>
                    <td className="px-4 py-2.5 text-center font-mono font-semibold">{row.ordersCount}</td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold text-zinc-900 dark:text-zinc-50">{formatCurrency(row.grossSales)}</td>
                    <td className="px-4 py-2.5 text-center font-mono">
                      <span className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-1.5 py-0.5 rounded font-bold">{row.commissionRate}%</span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-black text-[var(--primary)]">{formatCurrency(row.platformEarnings)}</td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold text-amber-600 dark:text-amber-500">{formatCurrency(row.pendingAmount)}</td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-500">{formatCurrency(row.settledAmount)}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                        row.settlementStatus === 'Settled' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-605 border-emerald-200' :
                        row.settlementStatus === 'Partial' ? 'bg-amber-50 dark:bg-amber-955/20 text-amber-600 border-amber-200' :
                        'bg-rose-50 dark:bg-rose-955/20 text-rose-500 border-rose-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          row.settlementStatus === 'Settled' ? 'bg-emerald-500' :
                          row.settlementStatus === 'Partial' ? 'bg-amber-500' :
                          'bg-rose-500'
                        }`}></span>
                        {row.settlementStatus}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-center relative">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleRowAction('details', row)}
                          className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors text-zinc-500 hover:text-[var(--primary)] cursor-pointer"
                          title="View Details"
                        >
                          <Eye size={13} />
                        </button>

                        <div className="relative">
                          <button
                            onClick={() => setActiveMenuRowId(prev => prev === row.id ? null : row.id)}
                            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors text-zinc-450 cursor-pointer"
                          >
                            <MoreVertical size={13} />
                          </button>

                          {activeMenuRowId === row.id && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setActiveMenuRowId(null)}></div>
                              <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl z-50 py-1 text-left">
                                <button
                                  onClick={() => handleRowAction('details', row)}
                                  className="w-full px-3 py-1.5 text-[10px] font-bold text-zinc-700 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-1.5"
                                >
                                  <Eye size={12} className="text-[var(--primary)]" />
                                  <span>View Details</span>
                                </button>
                                <button
                                  onClick={() => handleRowAction('adjustment', row)}
                                  className="w-full px-3 py-1.5 text-[10px] font-bold text-zinc-700 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-1.5"
                                >
                                  <Edit size={12} className="text-amber-500" />
                                  <span>Manual Adjustment</span>
                                </button>
                                <button
                                  onClick={() => handleRowAction('pdf', row)}
                                  className="w-full px-3 py-1.5 text-[10px] font-bold text-zinc-700 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-1.5"
                                >
                                  <FileText size={12} className="text-rose-500" />
                                  <span>Download PDF</span>
                                </button>
                                <button
                                  onClick={() => handleRowAction('excel', row)}
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
                <tr>
                  <td colSpan="9" className="px-4 py-8 text-center text-zinc-400 font-semibold text-xs">
                    No matching franchise commission logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/60 flex flex-col sm:flex-row justify-between items-center gap-3">
          <span className="text-[10px] text-zinc-500 font-bold">
            Showing Page {pagination.page} of {Math.ceil(tableTotalCount / pagination.limit) || 1} ({tableTotalCount} records)
          </span>

          <div className="flex gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              className="px-3 py-1 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-[10px] font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-40 shadow-sm text-black dark:text-white"
            >
              Previous
            </button>
            <button
              disabled={pagination.page >= Math.ceil(tableTotalCount / pagination.limit)}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              className="px-3 py-1 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-[10px] font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-40 shadow-sm text-black dark:text-white"
            >
              Next
            </button>
          </div>
        </div>
      </section>



      {/* Commission Details Modal */}
      <CommissionDetails
        isOpen={showDetailsModal}
        onClose={() => { setShowDetailsModal(false); setSelectedFranchiseId(null); }}
        id={selectedFranchiseId}
      />

      {/* Manual Override Form Modal */}
      <ManualAdjustmentModal
        isOpen={showAdjustmentModal}
        onClose={() => { setShowAdjustmentModal(false); setSelectedFranchiseId(null); }}
        franchiseId={selectedFranchiseId}
        franchiseName={selectedFranchiseName}
        onAdjustmentSuccess={handleRefresh}
      />

      {/* Override History Logs Modal */}
      <AdjustmentHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        franchiseId={selectedFranchiseId}
        franchiseName={selectedFranchiseName}
      />

    </div>
  );
}
