import React, { useState, useEffect, useRef } from 'react';
import { 
  Download, Calendar, Search, RefreshCw, Filter, 
  ChevronLeft, ChevronRight, Eye, MoreVertical, SlidersHorizontal, 
  CheckCircle2, FileSpreadsheet, FileText, Plus, Clock, AlertTriangle, 
  Shield, ArrowUpDown, ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';

import {
  useTaxSummary,
  useTaxReports,
  useExportTaxReports
} from './hooks/useTaxQuery';

// Modals
import GenerateTaxReportModal from './components/GenerateTaxReportModal';
import ViewTaxReportModal from './components/ViewTaxReportModal';
import { AuditLogModal } from './components/TaxReportWorkflowModals';

export default function TaxReports() {
  // Collapsible Filters Panel
  const [showFiltersPanel, setShowFiltersPanel] = useState(true);

  // Filters state
  const [filters, setFilters] = useState({
    financialYear: '',
    quarter: 'All',
    month: 'All',
    state: '',
    search: ''
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
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  
  // Selected report ID for modal actions
  const [selectedReportId, setSelectedReportId] = useState(null);

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
  const { data: summary, loading: summaryLoading, refetch: refetchSummary } = useTaxSummary(filters);
  const { data: reports, total: reportsTotalCount, loading: tableLoading, refetch: refetchTable } = useTaxReports(filters, pagination);
  const { exportReport, exportLoading } = useExportTaxReports();

  // Synchronize entire page data
  const handleRefreshData = () => {
    refetchSummary();
    refetchTable();
    toast.success('Tax compliance ledger synchronized');
  };

  // Reset filter values
  const handleResetFilters = () => {
    setFilters({
      financialYear: '',
      quarter: 'All',
      month: 'All',
      state: '',
      search: ''
    });
    setSearchTerm('');
    setPagination({ page: 1, limit: 5 });
    toast.success('Filing filters reset successfully');
  };

  // Format amount to lakh/crore Indian format
  const formatCurrency = (val) => {
    if (val === undefined || val === null) return '₹0';
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  // Helper for trend styles
  const getTrendColor = (trend) => {
    if (!trend) return 'text-zinc-400';
    return trend > 0 ? 'text-emerald-500' : 'text-rose-500';
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-zinc-50 dark:bg-zinc-955 min-h-screen text-zinc-850 dark:text-zinc-100 transition-colors duration-300">
      
      {/* Top Header Block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5 shrink-0">
        <div>
          <h1 className="text-xl font-black text-black dark:text-white flex items-center gap-2">
            <Shield size={22} className="text-[var(--primary)]" />
            Tax Reports & GST Compliance
          </h1>
          <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mt-1">
            Generate state-wise SGST, CGST, and IGST compliance statements, GSTR ledgers, and regulatory audit trails.
          </p>
        </div>

        {/* Master Action Panel */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button 
            onClick={() => exportReport('excel')}
            disabled={exportLoading || tableLoading}
            className="h-9 px-3 border border-zinc-250 dark:border-zinc-805 bg-white dark:bg-zinc-900 text-zinc-750 dark:text-zinc-300 text-xs font-bold rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
          >
            <FileSpreadsheet size={14} className="text-emerald-650" />
            Export GSTR CSV
          </button>

          <button 
            onClick={() => setShowAuditModal(true)}
            className="h-9 px-3 border border-zinc-250 dark:border-zinc-805 bg-white dark:bg-zinc-900 text-zinc-750 dark:text-zinc-300 text-xs font-bold rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Shield size={14} className="text-amber-500" />
            Compliance Audits
          </button>

          <button 
            onClick={handleRefreshData}
            className="p-2 border border-zinc-250 dark:border-zinc-805 bg-white dark:bg-zinc-900 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-650 dark:text-zinc-400 transition-colors cursor-pointer"
            title="Reload compliance data"
          >
            <RefreshCw size={14} className={summaryLoading || tableLoading ? 'animate-spin' : ''} />
          </button>

          <button 
            onClick={() => setShowGenerateModal(true)}
            className="h-9 px-4 bg-[var(--primary)] hover:brightness-110 text-white text-xs font-bold rounded-lg shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={15} />
            Compile GST Report
          </button>
        </div>
      </div>

      {/* KPI 6 Stats Summary Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Card 1: Total GST Collected */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between h-[105px]">
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest leading-none">Total GST Tax</span>
            <span className="p-1 rounded-md bg-[var(--primary)]/10 text-[var(--primary)] text-[10px] font-bold"><Shield size={11} /></span>
          </div>
          <div className="mt-2">
            <h3 className="text-sm font-black text-black dark:text-white font-mono truncate" title={summary?.totalTaxCollected?.toLocaleString('en-IN')}>
              {formatCurrency(summary?.totalTaxCollected)}
            </h3>
            <p className="text-[9px] font-bold mt-1 flex items-center gap-1">
              <span className={getTrendColor(summary?.totalTrend)}>
                {summary?.totalTrend > 0 ? `+${summary.totalTrend}%` : `${summary?.totalTrend}%`}
              </span>
              <span className="text-zinc-400 font-semibold">vs past quarter</span>
            </p>
          </div>
        </div>

        {/* Card 2: CGST Collected */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between h-[105px]">
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest leading-none">CGST (Central)</span>
            <span className="p-1 rounded-md bg-amber-500/10 text-amber-500 text-[10px] font-bold"><Shield size={11} /></span>
          </div>
          <div className="mt-2">
            <h3 className="text-sm font-black text-black dark:text-white font-mono truncate" title={summary?.cgst?.toLocaleString('en-IN')}>
              {formatCurrency(summary?.cgst)}
            </h3>
            <p className="text-[9px] font-bold mt-1 flex items-center gap-1">
              <span className={getTrendColor(summary?.cgstTrend)}>
                {summary?.cgstTrend > 0 ? `+${summary.cgstTrend}%` : `${summary?.cgstTrend}%`}
              </span>
              <span className="text-zinc-400 font-semibold">central liability</span>
            </p>
          </div>
        </div>

        {/* Card 3: SGST Collected */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between h-[105px]">
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest leading-none">SGST (State)</span>
            <span className="p-1 rounded-md bg-emerald-500/10 text-emerald-500 text-[10px] font-bold"><Shield size={11} /></span>
          </div>
          <div className="mt-2">
            <h3 className="text-sm font-black text-black dark:text-white font-mono truncate" title={summary?.sgst?.toLocaleString('en-IN')}>
              {formatCurrency(summary?.sgst)}
            </h3>
            <p className="text-[9px] font-bold mt-1 flex items-center gap-1">
              <span className={getTrendColor(summary?.sgstTrend)}>
                {summary?.sgstTrend > 0 ? `+${summary.sgstTrend}%` : `${summary?.sgstTrend}%`}
              </span>
              <span className="text-zinc-400 font-semibold">state share split</span>
            </p>
          </div>
        </div>

        {/* Card 4: IGST Collected */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between h-[105px]">
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest leading-none">IGST (Interstate)</span>
            <span className="p-1 rounded-md bg-blue-500/10 text-blue-500 text-[10px] font-bold"><Shield size={11} /></span>
          </div>
          <div className="mt-2">
            <h3 className="text-sm font-black text-black dark:text-white font-mono truncate" title={summary?.igst?.toLocaleString('en-IN')}>
              {formatCurrency(summary?.igst)}
            </h3>
            <p className="text-[9px] font-bold mt-1 flex items-center gap-1">
              <span className={getTrendColor(summary?.igstTrend)}>
                {summary?.igstTrend > 0 ? `+${summary.igstTrend}%` : `${summary?.igstTrend}%`}
              </span>
              <span className="text-zinc-400 font-semibold">interstate trade</span>
            </p>
          </div>
        </div>

        {/* Card 5: Taxable Net Sales */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between h-[105px]">
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest leading-none">Taxable Sales</span>
            <span className="p-1 rounded-md bg-purple-550/10 text-purple-600 text-[10px] font-bold"><Calendar size={11} /></span>
          </div>
          <div className="mt-2">
            <h3 className="text-sm font-black text-black dark:text-white font-mono truncate" title={summary?.taxableSales?.toLocaleString('en-IN')}>
              {formatCurrency(summary?.taxableSales)}
            </h3>
            <p className="text-[9px] font-bold mt-1 flex items-center gap-1">
              <span className={getTrendColor(summary?.salesTrend)}>
                {summary?.salesTrend > 0 ? `+${summary.salesTrend}%` : `${summary?.salesTrend}%`}
              </span>
              <span className="text-zinc-400 font-semibold">net taxable base</span>
            </p>
          </div>
        </div>

        {/* Card 6: Pending Filings */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between h-[105px]">
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest leading-none">Pending Filings</span>
            <span className="p-1 rounded-md bg-amber-500/10 text-amber-600 text-[10px] font-bold"><Clock size={11} /></span>
          </div>
          <div className="mt-2">
            <h3 className="text-sm font-black text-black dark:text-white font-mono truncate">
              {summary?.pendingFilings || 0} Nodes
            </h3>
            <p className="text-[9px] font-bold mt-1 flex items-center gap-1">
              <span className="text-emerald-500">{summary?.pendingTrend}%</span>
              <span className="text-zinc-400 font-semibold">overdue returns</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Filter panel with cascading controls */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden transition-all duration-300">
        
        {/* Toggle Title Bar */}
        <div className="px-5 py-3.5 border-b border-zinc-150 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-950/20 shrink-0">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={14} className="text-[var(--primary)]" />
            <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
              Compliance Filings & Presets Filters
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
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 border-b border-zinc-150 dark:border-zinc-800 animate-slide-down shrink-0">
            
            {/* Search Input bar */}
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-widest">Search compliance log</label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search by report ID, state, month (600ms debounce)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 bg-zinc-50 dark:bg-zinc-955 border border-zinc-205 dark:border-zinc-800 rounded-lg text-xs font-bold focus:ring-2 focus:ring-[var(--primary)] outline-none text-black dark:text-white"
                />
              </div>
            </div>

            {/* Financial Year */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-widest">Financial Year</label>
              <select
                value={filters.financialYear}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, financialYear: e.target.value }));
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="w-full h-9 px-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-205 dark:border-zinc-800 rounded-lg text-xs font-bold focus:ring-2 focus:ring-[var(--primary)] outline-none text-black dark:text-white"
              >
                <option value="">All Years</option>
                <option value="2026-27">FY 2026-27</option>
                <option value="2025-26">FY 2025-26</option>
              </select>
            </div>

            {/* Quarter Filter */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-widest">Quarter Preset</label>
              <select
                value={filters.quarter}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, quarter: e.target.value, month: 'All' }));
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="w-full h-9 px-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-205 dark:border-zinc-800 rounded-lg text-xs font-bold focus:ring-2 focus:ring-[var(--primary)] outline-none text-black dark:text-white"
              >
                <option value="All">All Quarters</option>
                <option value="Q1">Q1 (Apr - Jun)</option>
                <option value="Q2">Q2 (Jul - Sep)</option>
                <option value="Q3">Q3 (Oct - Dec)</option>
                <option value="Q4">Q4 (Jan - Mar)</option>
              </select>
            </div>

            {/* GST Filing State */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-widest">Filing State</label>
              <select
                value={filters.state}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, state: e.target.value }));
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="w-full h-9 px-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-205 dark:border-zinc-800 rounded-lg text-xs font-bold focus:ring-2 focus:ring-[var(--primary)] outline-none text-black dark:text-white"
              >
                <option value="">All States</option>
                <option value="Madhya Pradesh">Madhya Pradesh</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Delhi NCR">Delhi NCR</option>
              </select>
            </div>

          </div>
        )}

        {/* Master Reports Table */}
        <div className="overflow-x-auto min-h-[200px]">
          <table className="w-full text-left text-xs divide-y divide-zinc-200 dark:divide-zinc-850">
            <thead className="bg-zinc-50 dark:bg-zinc-950/40 text-zinc-450 dark:text-zinc-500 uppercase tracking-wider text-[9px] font-bold sticky top-0">
              <tr>
                <th className="px-5 py-3">Report ID</th>
                <th className="px-5 py-3">Filing Period</th>
                <th className="px-5 py-3">Gross Sales</th>
                <th className="px-5 py-3">Taxable Amt</th>
                <th className="px-5 py-3">CGST / SGST</th>
                <th className="px-5 py-3">IGST / Cess</th>
                <th className="px-5 py-3">Total Tax</th>
                <th className="px-5 py-3">Invoices</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850 bg-white dark:bg-zinc-900/40 text-black dark:text-white font-semibold">
              {tableLoading ? (
                // Skeleton UI loader
                [1, 2, 3, 4].map((row) => (
                  <tr key={row} className="animate-pulse">
                    <td className="px-5 py-4"><div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-14"></div></td>
                    <td className="px-5 py-4"><div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-16"></div></td>
                    <td className="px-5 py-4"><div className="h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded w-20"></div></td>
                    <td className="px-5 py-4"><div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-18"></div></td>
                    <td className="px-5 py-4">
                      <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-14 mb-1"></div>
                      <div className="h-2.5 bg-zinc-150 dark:bg-zinc-850 rounded w-10"></div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-14 mb-1"></div>
                      <div className="h-2.5 bg-zinc-150 dark:bg-zinc-850 rounded w-10"></div>
                    </td>
                    <td className="px-5 py-4"><div className="h-3.5 bg-[var(--primary)]/20 rounded w-20 font-bold"></div></td>
                    <td className="px-5 py-4"><div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-14"></div></td>
                    <td className="px-5 py-4"><div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded-full w-16"></div></td>
                    <td className="px-5 py-4"><div className="h-7 bg-zinc-200 dark:bg-zinc-800 rounded w-8 ml-auto"></div></td>
                  </tr>
                ))
              ) : reports.length > 0 ? (
                reports.map((report) => (
                  <tr key={report.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10 group transition-colors">
                    
                    {/* Report ID */}
                    <td className="px-5 py-3.5 font-mono text-[10px] text-zinc-500 dark:text-zinc-400 font-extrabold">{report.id}</td>
                    
                    {/* Period details */}
                    <td className="px-5 py-3.5">
                      <p className="font-extrabold text-zinc-900 dark:text-white truncate">{report.period}</p>
                      <span className="text-[8px] text-zinc-400 dark:text-zinc-500 font-bold uppercase block mt-0.5">
                        {report.quarter} • {report.financialYear}
                      </span>
                    </td>
                    
                    {/* Gross Sales */}
                    <td className="px-5 py-3.5 text-zinc-800 dark:text-zinc-200 font-bold">
                      ₹{report.totalSales?.toLocaleString('en-IN')}
                    </td>
                    
                    {/* Taxable sales amount */}
                    <td className="px-5 py-3.5 text-zinc-500 dark:text-zinc-400 font-bold">
                      ₹{report.taxableAmount?.toLocaleString('en-IN')}
                    </td>
                    
                    {/* CGST / SGST split */}
                    <td className="px-5 py-3.5 text-[10px]">
                      <div className="font-bold text-zinc-705 dark:text-zinc-300">C: ₹{report.cgst?.toLocaleString('en-IN')}</div>
                      <div className="text-zinc-450 mt-0.5">S: ₹{report.sgst?.toLocaleString('en-IN')}</div>
                    </td>

                    {/* IGST / Cess split */}
                    <td className="px-5 py-3.5 text-[10px]">
                      <div className="font-bold text-zinc-705 dark:text-zinc-300">I: ₹{report.igst?.toLocaleString('en-IN')}</div>
                      <div className="text-zinc-450 mt-0.5">Cess: ₹{report.cess?.toLocaleString('en-IN')}</div>
                    </td>
                    
                    {/* Total Tax collected */}
                    <td className="px-5 py-3.5 font-mono font-black text-[var(--primary)] text-xs">
                      ₹{report.totalTax?.toLocaleString('en-IN')}
                    </td>
                    
                    {/* Invoices */}
                    <td className="px-5 py-3.5 text-[10px] text-zinc-500 dark:text-zinc-450 font-bold">
                      {report.invoiceCount?.toLocaleString()} Bills
                    </td>

                    {/* Status Pill */}
                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15">
                        {report.status}
                      </span>
                    </td>
                    
                    {/* Actions Menu */}
                    <td className="px-5 py-3.5 text-right relative">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuRowId(activeMenuRowId === report.id ? null : report.id);
                          setSelectedReportId(report.id);
                        }}
                        className="p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-500 hover:text-black dark:hover:text-white transition-colors cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-850"
                      >
                        <MoreVertical size={13} />
                      </button>

                      {/* Dropdown Action Menu Box */}
                      {activeMenuRowId === report.id && (
                        <div 
                          ref={menuRef}
                          className="absolute right-6 top-10 w-44 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-855 rounded-lg shadow-xl py-1 z-30 divide-y divide-zinc-100 dark:divide-zinc-850 text-left"
                        >
                          <div className="py-0.5">
                            <button
                              onClick={() => { setShowViewModal(true); setActiveMenuRowId(null); }}
                              className="w-full px-3 py-1.5 text-[11px] font-bold text-zinc-700 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 flex items-center gap-2 cursor-pointer"
                            >
                              <Eye size={12} className="text-[var(--primary)]" />
                              View Audit Ledger
                            </button>
                          </div>

                          <div className="py-0.5">
                            <button
                              onClick={() => { exportReport('pdf', report.id); setActiveMenuRowId(null); }}
                              disabled={exportLoading}
                              className="w-full px-3 py-1.5 text-[11px] font-bold text-zinc-700 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 flex items-center gap-2 cursor-pointer disabled:opacity-40"
                            >
                              <FileText size={12} className="text-rose-600" />
                              Download PDF
                            </button>
                            <button
                              onClick={() => { exportReport('excel', report.id); setActiveMenuRowId(null); }}
                              disabled={exportLoading}
                              className="w-full px-3 py-1.5 text-[11px] font-bold text-zinc-700 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 flex items-center gap-2 cursor-pointer disabled:opacity-40"
                            >
                              <FileSpreadsheet size={12} className="text-emerald-600" />
                              Export GSTR CSV
                            </button>
                          </div>
                        </div>
                      )}
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="px-5 py-12 text-center text-zinc-400 italic font-medium">
                    <AlertTriangle size={24} className="mx-auto text-zinc-355 mb-2" />
                    No compliance GSTR logs found matching the selected query preset filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Server-Side Pagination Bar */}
        {reportsTotalCount > 0 && (
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
                Showing {Math.min((pagination.page - 1) * pagination.limit + 1, reportsTotalCount)} to {Math.min(pagination.page * pagination.limit, reportsTotalCount)} of {reportsTotalCount} entries
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
                {pagination.page} / {Math.ceil(reportsTotalCount / pagination.limit) || 1}
              </span>

              <button
                onClick={() => setPagination(p => ({ ...p, page: Math.min(Math.ceil(reportsTotalCount / pagination.limit), p.page + 1) }))}
                disabled={pagination.page >= Math.ceil(reportsTotalCount / pagination.limit)}
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
      
      {/* 1. Generate Tax Report Modal */}
      <GenerateTaxReportModal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        onSuccess={handleRefreshData}
      />

      {/* 2. View Audit Details Modal */}
      <ViewTaxReportModal
        isOpen={showViewModal}
        onClose={() => { setShowViewModal(false); setSelectedReportId(null); }}
        reportId={selectedReportId}
      />

      {/* 3. Overall Audit Log Modal */}
      <AuditLogModal
        isOpen={showAuditModal}
        onClose={() => setShowAuditModal(false)}
      />

    </div>
  );
}
