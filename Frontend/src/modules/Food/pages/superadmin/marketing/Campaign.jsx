import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Plus, Search, Filter, ArrowUpDown, ChevronDown, ChevronUp, MoreVertical, 
  Trash2, Eye, Edit, Pause, Play, Download, BarChart2, Check, AlertTriangle, 
  AlertCircle, RefreshCw, Columns, Calendar, Target, Gift, Volume2, Mail, 
  MessageSquare, Layers, HelpCircle 
} from 'lucide-react';

import { 
  apiGetCampaigns, 
  apiUpdateCampaign, 
  apiDeleteCampaign,
  apiBulkUpdateStatus,
  apiBulkDelete,
  activeCouponsMock 
} from './CampaignData';

import { mockRegions, mockFranchises, mockStores } from './CouponsData';

import CreateCampaign from './CreateCampaign';
import EditCampaign from './EditCampaign';
import CampaignDetails from './CampaignDetails';
import CampaignAnalytics from './CampaignAnalytics';

export default function Campaign() {
  // Core UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [retryTrigger, setRetryTrigger] = useState(0);
  
  // API simulator controls
  const [simulateError, setSimulateError] = useState(false);

  // Pagination & Sorting State
  const [pagination, setPagination] = useState({ page: 1, limit: 5 });
  const [sorting, setSorting] = useState({ field: 'createdAt', order: 'desc' });

  // Filters State
  const [showFilters, setShowFilters] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    type: 'All',
    status: 'All',
    customerSegment: 'All',
    startDate: '',
    endDate: '',
    regionIds: [],
    franchiseIds: [],
    storeIds: []
  });

  // Table Column Visibility
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    campaignName: true,
    type: true,
    audience: true,
    coupon: true,
    budget: true,
    startDate: true,
    endDate: true,
    status: true,
    actions: true
  });

  // Bulk Selection States
  const [selectedIds, setSelectedIds] = useState([]);
  const [showBulkDropdown, setShowBulkDropdown] = useState(false);

  // Modals & Drawer States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCampaignId, setEditingCampaignId] = useState(null);
  const [detailsCampaignId, setDetailsCampaignId] = useState(null);
  const [analyticsCampaignId, setAnalyticsCampaignId] = useState(null);

  // Row Action Menu State
  const [activeMenuRowId, setActiveMenuRowId] = useState(null);

  // Confirmation Modals State
  const [pauseConfirmId, setPauseConfirmId] = useState(null);
  const [resumeConfirmId, setResumeConfirmId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // KPI Metrics data
  const [kpiStats, setKpiStats] = useState({
    running: 0,
    scheduled: 0,
    completed: 0,
    reach: 0,
    conversionRate: 0,
    revenue: 0
  });

  // Refs for closing popups on outside click
  const menuRef = useRef(null);
  const columnDropdownRef = useRef(null);
  const bulkDropdownRef = useRef(null);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchText }));
      setPagination(prev => ({ ...prev, page: 1 }));
    }, 450);
    return () => clearTimeout(handler);
  }, [searchText]);

  // Click outside to dismiss menus
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenuRowId(null);
      }
      if (columnDropdownRef.current && !columnDropdownRef.current.contains(event.target)) {
        setShowColumnDropdown(false);
      }
      if (bulkDropdownRef.current && !bulkDropdownRef.current.contains(event.target)) {
        setShowBulkDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch campaign collection data
  const fetchCampaigns = async () => {
    setLoading(true);
    setError(null);
    try {
      if (simulateError) {
        throw new Error('500 Internal Database Connection Failure (Simulated)');
      }
      
      const result = await apiGetCampaigns(filters, pagination, sorting);
      setCampaigns(result.campaigns);
      setTotalCount(result.total);
      setTotalPages(result.totalPages);

      // Aggregate statistics for KPI cards dynamically
      // For a real app, these are fetched from aggregations, here we compute them from all mock data
      const allCamps = await apiGetCampaigns({ status: 'All' }, { page: 1, limit: 100 }, { field: 'createdAt', order: 'desc' });
      const runningCount = allCamps.campaigns.filter(c => c.status === 'Running').length;
      const scheduledCount = allCamps.campaigns.filter(c => c.status === 'Scheduled').length;
      const completedCount = allCamps.campaigns.filter(c => c.status === 'Completed').length;
      
      let totalReach = 0;
      let totalConversions = 0;
      let totalClicks = 0;
      let totalRev = 0;

      allCamps.campaigns.forEach(c => {
        totalReach += Math.round((c.impressions || 0) * 0.82);
        totalClicks += (c.clicks || 0);
        totalConversions += (c.conversions || 0);
        totalRev += (c.revenueGenerated || 0);
      });

      const convRate = totalClicks > 0 ? parseFloat(((totalConversions / totalClicks) * 100).toFixed(2)) : 0;

      setKpiStats({
        running: runningCount,
        scheduled: scheduledCount,
        completed: completedCount,
        reach: totalReach,
        conversionRate: convRate,
        revenue: totalRev
      });
      
    } catch (err) {
      setError(err.message || 'Unable to sync campaigns from MongoDB.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [filters, sorting, pagination, retryTrigger, simulateError]);

  // Bulk selectors
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(campaigns.map(c => c._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // CSV Export utility
  const handleExportCSV = () => {
    if (campaigns.length === 0) return;
    const headers = ['ID', 'Title', 'Description', 'Type', 'Target Audience', 'Start Date', 'End Date', 'Budget', 'Status', 'Impressions', 'Clicks', 'Conversions', 'Revenue', 'Redemptions', 'Created By', 'Created At'];
    const rows = campaigns.map(c => [
      c._id,
      `"${c.title.replace(/"/g, '""')}"`,
      `"${c.description.replace(/"/g, '""')}"`,
      c.type,
      c.targetAudience,
      c.startDate,
      c.endDate,
      c.budget,
      c.status,
      c.impressions || 0,
      c.clicks || 0,
      c.conversions || 0,
      c.revenueGenerated || 0,
      c.redemptionsCount || 0,
      c.createdBy,
      c.createdAt
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "papa_veg_pizza_campaigns.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setSelectedIds([]);
  };

  // Bulk modifications
  const handleBulkStatusChange = async (newStatus) => {
    setLoading(true);
    try {
      await apiBulkUpdateStatus(selectedIds, newStatus);
      setSelectedIds([]);
      setShowBulkDropdown(false);
      setRetryTrigger(prev => prev + 1);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDeleteCampaigns = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} campaigns? This cannot be undone.`)) {
      setLoading(true);
      try {
        await apiBulkDelete(selectedIds);
        setSelectedIds([]);
        setShowBulkDropdown(false);
        setRetryTrigger(prev => prev + 1);
      } catch (err) {
        alert(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  // Pause / Resume / Delete Action confirmations
  const handleConfirmPause = async () => {
    try {
      await apiUpdateCampaign(pauseConfirmId, { status: 'Paused' });
      setPauseConfirmId(null);
      setRetryTrigger(prev => prev + 1);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleConfirmResume = async () => {
    try {
      await apiUpdateCampaign(resumeConfirmId, { status: 'Running' });
      setResumeConfirmId(null);
      setRetryTrigger(prev => prev + 1);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await apiDeleteCampaign(deleteConfirmId);
      setDeleteConfirmId(null);
      setRetryTrigger(prev => prev + 1);
    } catch (err) {
      alert(err.message);
    }
  };

  // Cascading geo filters calculation for drop-downs
  const availableFranchises = useMemo(() => {
    if (filters.regionIds.length === 0) return mockFranchises;
    const zoneIds = mockZones.filter(z => filters.regionIds.includes(z.regionId)).map(z => z.id);
    const territoryIds = mockTerritories.filter(t => zoneIds.includes(t.zoneId)).map(t => t.id);
    return mockFranchises.filter(f => territoryIds.includes(f.territoryId));
  }, [filters.regionIds]);

  const availableStores = useMemo(() => {
    if (filters.franchiseIds.length === 0) {
      const allowedFranIds = availableFranchises.map(f => f.id);
      return mockStores.filter(s => allowedFranIds.includes(s.franchiseId));
    }
    return mockStores.filter(s => filters.franchiseIds.includes(s.franchiseId));
  }, [filters.franchiseIds, availableFranchises]);

  return (
    <div className="p-4 md:p-6 pb-16 max-w-[1600px] mx-auto bg-zinc-50 dark:bg-zinc-950 min-h-screen w-full space-y-6 animate-in fade-in duration-300">
      
      {/* Top Banner Header */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
            <span className="p-2 bg-[var(--primary)]/10 text-[var(--primary)] rounded-xl">
              <Target size={20} />
            </span>
            Campaigns Management
          </h2>
          <p className="text-xs font-semibold text-zinc-500 mt-1">
            Build, deploy, and analyze regional marketing and notifications campaigns.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center justify-center gap-1.5 px-4.5 py-2 bg-[var(--primary)] text-white rounded-xl text-xs font-bold hover:bg-[var(--primary)]/90 active:scale-95 transition-all shadow-md"
          >
            <Plus size={15} />
            <span>Create Campaign</span>
          </button>
        </div>
      </section>

      {/* KPI Stats Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {[
          { title: 'Running Campaigns', value: kpiStats.running, label: 'Active now', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10' },
          { title: 'Scheduled', value: kpiStats.scheduled, label: 'Ready to launch', color: 'text-blue-600 dark:text-blue-400 bg-blue-500/10' },
          { title: 'Completed', value: kpiStats.completed, label: 'Archived stats', color: 'text-purple-650 dark:text-purple-400 bg-purple-500/10' },
          { title: 'Total Reach', value: kpiStats.reach.toLocaleString(), label: 'Derived impressions', color: 'text-pink-600 dark:text-pink-400 bg-pink-500/10' },
          { title: 'Avg. Conv. Rate', value: `${kpiStats.conversionRate}%`, label: 'Order / Click ratio', color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10' },
          { title: 'Revenue Generated', value: `₹${kpiStats.revenue.toLocaleString('en-IN')}`, label: 'Driven checkout sum', color: 'text-teal-600 dark:text-teal-400 bg-teal-500/10' }
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{stat.title}</span>
            <div className="flex justify-between items-end mt-2">
              <div>
                <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 leading-none">{stat.value}</h3>
                <span className="text-[9px] text-zinc-450 mt-1 block font-semibold">{stat.label}</span>
              </div>
              <span className={`w-2 h-2 rounded-full ${stat.color.split(' ')[1]}`}></span>
            </div>
          </div>
        ))}
      </section>

      {/* Advanced Filter Bar */}
      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm space-y-4">
        
        {/* Simple Search & Action Headers */}
        <div className="flex flex-col md:flex-row gap-3 justify-between items-center">
          
          {/* Quick Search */}
          <div className="relative w-full md:max-w-md">
            <input 
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search campaigns by name or description..."
              className="w-full h-10 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-9 pr-4 text-xs font-semibold focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] outline-none text-zinc-900 dark:text-zinc-150 transition-all placeholder:text-zinc-450"
            />
            <Search size={14} className="absolute left-3.5 top-3.5 text-zinc-450" />
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 justify-end">
            
            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3.5 py-2 border rounded-xl text-xs font-bold transition-all ${
                showFilters 
                  ? 'border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)] shadow-sm' 
                  : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-650 dark:text-zinc-350'
              }`}
            >
              <Filter size={13} />
              <span>Filters</span>
              {showFilters ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>

            {/* Column toggles */}
            <div className="relative" ref={columnDropdownRef}>
              <button 
                onClick={() => setShowColumnDropdown(!showColumnDropdown)}
                className="flex items-center gap-1.5 px-3.5 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-650 dark:text-zinc-350 transition-colors"
              >
                <Columns size={13} />
                <span>Columns</span>
              </button>

              {showColumnDropdown && (
                <div className="absolute right-0 z-20 mt-1.5 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-805 rounded-xl shadow-xl p-2.5 divide-y divide-zinc-100 dark:divide-zinc-800 space-y-1">
                  <span className="text-[9px] uppercase tracking-wider text-zinc-450 font-extrabold pb-1.5 block">Toggle Columns</span>
                  <div className="space-y-1.5 pt-1.5 text-xs font-bold">
                    {Object.keys(visibleColumns).map((col) => (
                      <label key={col} className="flex items-center gap-2 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-150">
                        <input 
                          type="checkbox" 
                          checked={visibleColumns[col]} 
                          onChange={() => setVisibleColumns(prev => ({ ...prev, [col]: !prev[col] }))}
                          className="rounded text-[var(--primary)] focus:ring-[var(--primary)] w-3.5 h-3.5"
                        />
                        <span className="capitalize">{col.replace(/([A-Z])/g, ' $1')}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* CSV Export */}
            <button 
              onClick={handleExportCSV}
              disabled={campaigns.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-650 dark:text-zinc-350 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Download size={13} />
              <span>Export CSV</span>
            </button>

          </div>
        </div>

        {/* Collapsible Panel */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-3 border-t border-zinc-150 dark:border-zinc-800 animate-in fade-in slide-in-from-top-3 duration-200">
            
            {/* Type */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider">Channel Type</label>
              <select 
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value, page: 1 }))}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-800 dark:text-zinc-200 font-semibold cursor-pointer"
              >
                <option value="All">All Channels</option>
                <option value="Push Notification">Push Notification</option>
                <option value="Email">Email</option>
                <option value="SMS">SMS</option>
                <option value="Multi Channel">Multi Channel</option>
              </select>
            </div>

            {/* Status */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider">Campaign Status</label>
              <select 
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-800 dark:text-zinc-200 font-semibold cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Draft">Draft</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Running">Running</option>
                <option value="Paused">Paused</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            {/* Segment */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider">Customer Segment</label>
              <select 
                value={filters.customerSegment}
                onChange={(e) => setFilters(prev => ({ ...prev, customerSegment: e.target.value, page: 1 }))}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-800 dark:text-zinc-200 font-semibold cursor-pointer"
              >
                <option value="All">All Customer Segments</option>
                <option value="All Customers">All Customers</option>
                <option value="New Customers">New Customers</option>
                <option value="Premium Customers">Premium Customers</option>
              </select>
            </div>

            {/* Date Range Start */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider">Start Date From</label>
              <input 
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value, page: 1 }))}
                className="w-full bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-800 dark:text-zinc-200 font-semibold"
              />
            </div>

            {/* Date Range End */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider">End Date To</label>
              <input 
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value, page: 1 }))}
                className="w-full bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-800 dark:text-zinc-200 font-semibold"
              />
            </div>

            {/* Regions Multi */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider">Filter Region (Multi)</label>
              <select 
                multiple
                value={filters.regionIds}
                onChange={(e) => {
                  const vals = Array.from(e.target.selectedOptions, option => option.value);
                  setFilters(prev => ({ ...prev, regionIds: vals, franchiseIds: [], storeIds: [], page: 1 }));
                }}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-2.5 py-1 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-800 dark:text-zinc-200 font-semibold h-12"
              >
                {mockRegions.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>

            {/* Franchise Dependent Select */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider block">Filter Franchise ({availableFranchises.length})</label>
              <select 
                multiple
                value={filters.franchiseIds}
                onChange={(e) => {
                  const vals = Array.from(e.target.selectedOptions, option => option.value);
                  setFilters(prev => ({ ...prev, franchiseIds: vals, storeIds: [], page: 1 }));
                }}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-2.5 py-1 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-800 dark:text-zinc-200 font-semibold h-12"
              >
                {availableFranchises.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>

            {/* Store Dependent Select */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider block">Filter Store ({availableStores.length})</label>
              <select 
                multiple
                value={filters.storeIds}
                onChange={(e) => {
                  const vals = Array.from(e.target.selectedOptions, option => option.value);
                  setFilters(prev => ({ ...prev, storeIds: vals, page: 1 }));
                }}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-2.5 py-1 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-800 dark:text-zinc-200 font-semibold h-12"
              >
                {availableStores.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Actions Reset */}
            <div className="lg:col-span-4 flex justify-end gap-2.5 pt-2 border-t border-zinc-150 dark:border-zinc-800">
              <button 
                onClick={() => {
                  setSearchText('');
                  setFilters({
                    search: '',
                    type: 'All',
                    status: 'All',
                    customerSegment: 'All',
                    startDate: '',
                    endDate: '',
                    regionIds: [],
                    franchiseIds: [],
                    storeIds: []
                  });
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="px-4 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors"
              >
                Reset Filters
              </button>
              <button 
                onClick={fetchCampaigns}
                className="px-5 py-1.5 bg-[var(--primary)] text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all shadow-sm"
              >
                Apply Filters
              </button>
            </div>

          </div>
        )}

      </section>

      {/* Main Table Card Area */}
      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm flex flex-col">
        
        {/* Bulk Action Controls */}
        {selectedIds.length > 0 && (
          <div className="px-5 py-3 border-b border-zinc-150 dark:border-zinc-800 bg-[var(--primary)]/5 dark:bg-[var(--primary)]/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 animate-in slide-in-from-top-2 duration-200">
            <span className="text-xs font-bold text-[var(--primary)] flex items-center gap-1.5">
              <Check size={14} className="stroke-[3]" /> {selectedIds.length} campaigns selected
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto" ref={bulkDropdownRef}>
              <button 
                onClick={() => setShowBulkDropdown(!showBulkDropdown)}
                className="flex items-center justify-between gap-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3.5 py-1.5 rounded-lg text-xs font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 shadow-sm"
              >
                <span>Bulk Actions</span>
                <ChevronDown size={12} />
              </button>

              {showBulkDropdown && (
                <div className="absolute right-6 sm:right-auto z-20 mt-32 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl py-1 w-44 divide-y divide-zinc-100 dark:divide-zinc-800 text-xs font-semibold">
                  <div className="py-1">
                    <button onClick={() => handleBulkStatusChange('Running')} className="w-full text-left px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-1.5"><Play size={11} className="text-emerald-500 fill-current" /> Set as Running</button>
                    <button onClick={() => handleBulkStatusChange('Paused')} className="w-full text-left px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-1.5"><Pause size={11} className="text-amber-500 fill-current" /> Set as Paused</button>
                    <button onClick={() => handleBulkStatusChange('Completed')} className="w-full text-left px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-1.5"><CheckCircle2 size={11} className="text-purple-500" /> Set as Completed</button>
                  </div>
                  <div className="py-1">
                    <button onClick={handleBulkDeleteCampaigns} className="w-full text-left px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-650 hover:text-red-700 flex items-center gap-1.5"><Trash2 size={11} /> Delete Selected</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* LOADING STATE */}
        {loading ? (
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {/* Header skeleton */}
            <div className="h-10 bg-zinc-50 dark:bg-zinc-950 flex items-center px-4.5">
              <div className="h-4 bg-zinc-200 dark:bg-zinc-850 rounded w-1/4 animate-pulse"></div>
            </div>
            {/* Rows skeletons */}
            {[1, 2, 3, 4, 5].map((idx) => (
              <div key={idx} className="p-4 flex justify-between items-center bg-white dark:bg-zinc-900">
                <div className="space-y-2 w-1/3">
                  <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded w-5/6 animate-pulse"></div>
                  <div className="h-2.5 bg-zinc-150 dark:bg-zinc-850 rounded w-1/2 animate-pulse"></div>
                </div>
                <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-12 animate-pulse"></div>
                <div className="h-3 bg-zinc-250 dark:bg-zinc-850 rounded w-20 animate-pulse"></div>
                <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded-full w-16 animate-pulse"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          /* ERROR STATE */
          <div className="p-8 text-center bg-white dark:bg-zinc-900 flex flex-col items-center justify-center">
            <div className="p-3 bg-red-100 text-red-500 rounded-full mb-4">
              <AlertCircle size={28} />
            </div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Sync Connection Failed</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed max-w-sm">
              {error}
            </p>
            <button 
              onClick={() => {
                setSimulateError(false);
                setRetryTrigger(prev => prev + 1);
              }}
              className="mt-6 flex items-center gap-1.5 px-4.5 py-2 bg-[var(--primary)] text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all shadow-md"
            >
              <RefreshCw size={12} /> Retry Synchronization
            </button>
          </div>
        ) : campaigns.length === 0 ? (
          /* EMPTY STATE */
          <div className="p-10 text-center bg-white dark:bg-zinc-900 flex flex-col items-center justify-center">
            <div className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-full mb-4">
              <Target size={32} className="text-zinc-350" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">No Campaigns Found</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-450 mt-1 max-w-xs leading-relaxed">
              No promotions matching selected filters were found. Create a new campaign or modify filter criteria.
            </p>
            <button 
              onClick={() => setIsCreateOpen(true)}
              className="mt-6 px-4 py-2 bg-[var(--primary)] text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all shadow-md"
            >
              Get Started
            </button>
          </div>
        ) : (
          /* DATATABLE */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              
              {/* Sticky Header */}
              <thead className="bg-zinc-50 dark:bg-zinc-950/70 border-b border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-[10px] uppercase tracking-wider font-extrabold sticky top-0 z-10 shrink-0">
                <tr>
                  <th className="px-4.5 py-3.5 w-10">
                    <input 
                      type="checkbox" 
                      onChange={handleSelectAll}
                      checked={selectedIds.length === campaigns.length}
                      className="rounded text-[var(--primary)] focus:ring-[var(--primary)] w-4 h-4 cursor-pointer"
                    />
                  </th>
                  
                  {visibleColumns.campaignName && (
                    <th className="px-4.5 py-3.5 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-850/50 transition-colors"
                      onClick={() => setSorting(prev => ({ field: 'title', order: prev.field === 'title' && prev.order === 'asc' ? 'desc' : 'asc' }))}
                    >
                      <div className="flex items-center gap-1">
                        Campaign {sorting.field === 'title' && (sorting.order === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />)}
                      </div>
                    </th>
                  )}

                  {visibleColumns.type && <th className="px-4.5 py-3.5">Type</th>}
                  {visibleColumns.audience && <th className="px-4.5 py-3.5">Audience</th>}
                  {visibleColumns.coupon && <th className="px-4.5 py-3.5">Coupon</th>}
                  
                  {visibleColumns.budget && (
                    <th className="px-4.5 py-3.5 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-850/50 text-right"
                      onClick={() => setSorting(prev => ({ field: 'budget', order: prev.field === 'budget' && prev.order === 'asc' ? 'desc' : 'asc' }))}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Budget {sorting.field === 'budget' && (sorting.order === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />)}
                      </div>
                    </th>
                  )}

                  {visibleColumns.startDate && (
                    <th className="px-4.5 py-3.5 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-850/50"
                      onClick={() => setSorting(prev => ({ field: 'startDate', order: prev.field === 'startDate' && prev.order === 'asc' ? 'desc' : 'asc' }))}
                    >
                      <div className="flex items-center gap-1">
                        Start {sorting.field === 'startDate' && (sorting.order === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />)}
                      </div>
                    </th>
                  )}

                  {visibleColumns.endDate && (
                    <th className="px-4.5 py-3.5 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-850/50"
                      onClick={() => setSorting(prev => ({ field: 'endDate', order: prev.field === 'endDate' && prev.order === 'asc' ? 'desc' : 'asc' }))}
                    >
                      <div className="flex items-center gap-1">
                        End {sorting.field === 'endDate' && (sorting.order === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />)}
                      </div>
                    </th>
                  )}

                  {visibleColumns.status && <th className="px-4.5 py-3.5 text-center">Status</th>}
                  {visibleColumns.actions && <th className="px-4.5 py-3.5 text-right w-16">Actions</th>}
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-xs font-semibold">
                {campaigns.map((c) => {
                  const isSel = selectedIds.includes(c._id);
                  const isMenuOpen = activeMenuRowId === c._id;
                  
                  // Helper to map coupon preview details
                  const cpnMatch = activeCouponsMock.find(cop => cop._id === c.couponId);
                  
                  return (
                    <tr 
                      key={c._id} 
                      className={`hover:bg-zinc-50/50 dark:hover:bg-zinc-850/20 transition-colors ${
                        isSel ? 'bg-[var(--primary)]/[0.02] dark:bg-[var(--primary)]/[0.04]' : ''
                      }`}
                    >
                      <td className="px-4.5 py-3.5">
                        <input 
                          type="checkbox" 
                          checked={isSel}
                          onChange={() => handleSelectRow(c._id)}
                          className="rounded text-[var(--primary)] focus:ring-[var(--primary)] w-4 h-4 cursor-pointer"
                        />
                      </td>

                      {visibleColumns.campaignName && (
                        <td className="px-4.5 py-3.5">
                          <div className="flex items-start gap-2.5">
                            <span className="p-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-500 mt-0.5">
                              {c.type === 'Push Notification' ? <Volume2 size={13} /> :
                               c.type === 'Email' ? <Mail size={13} /> :
                               c.type === 'SMS' ? <MessageSquare size={13} /> :
                               <Layers size={13} />}
                            </span>
                            <div className="min-w-0">
                              <h4 className="text-zinc-905 dark:text-zinc-100 font-bold truncate max-w-xs">{c.title}</h4>
                              <p className="text-[10px] text-zinc-450 font-semibold truncate max-w-xs mt-0.5">{c.description}</p>
                            </div>
                          </div>
                        </td>
                      )}

                      {visibleColumns.type && (
                        <td className="px-4.5 py-3.5 text-zinc-500 dark:text-zinc-455 font-bold whitespace-nowrap">{c.type}</td>
                      )}

                      {visibleColumns.audience && (
                        <td className="px-4.5 py-3.5 text-zinc-550 dark:text-zinc-400 whitespace-nowrap">
                          {c.targetAudience}
                        </td>
                      )}

                      {visibleColumns.coupon && (
                        <td className="px-4.5 py-3.5">
                          {cpnMatch ? (
                            <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded text-[10px] font-extrabold tracking-wide uppercase">
                              {cpnMatch.code}
                            </span>
                          ) : (
                            <span className="text-zinc-400 font-semibold italic">None</span>
                          )}
                        </td>
                      )}

                      {visibleColumns.budget && (
                        <td className="px-4.5 py-3.5 text-right font-black text-zinc-900 dark:text-zinc-150">
                          ₹{c.budget.toLocaleString('en-IN')}
                        </td>
                      )}

                      {visibleColumns.startDate && (
                        <td className="px-4.5 py-3.5 text-zinc-550 dark:text-zinc-400 whitespace-nowrap">{c.startDate}</td>
                      )}

                      {visibleColumns.endDate && (
                        <td className="px-4.5 py-3.5 text-zinc-550 dark:text-zinc-400 whitespace-nowrap">{c.endDate}</td>
                      )}

                      {visibleColumns.status && (
                        <td className="px-4.5 py-3.5 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold border ${
                            c.status === 'Draft' ? 'bg-zinc-100 border-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400' :
                            c.status === 'Scheduled' ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-500/10 dark:border-blue-800/20 dark:text-blue-400' :
                            c.status === 'Running' ? 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-500/10 dark:border-emerald-800/20 dark:text-emerald-400' :
                            c.status === 'Paused' ? 'bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-500/10 dark:border-amber-800/20 dark:text-amber-400' :
                            'bg-purple-50 border-purple-200 text-purple-650 dark:bg-purple-500/10 dark:border-purple-800/20 dark:text-purple-400'
                          }`}>
                            {c.status}
                          </span>
                        </td>
                      )}

                      {visibleColumns.actions && (
                        <td className="px-4.5 py-3.5 text-right relative">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuRowId(isMenuOpen ? null : c._id);
                            }}
                            className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-all"
                          >
                            <MoreVertical size={14} className="text-zinc-450 dark:text-zinc-400" />
                          </button>

                          {/* Row Action Menu Options Dropdown */}
                          {isMenuOpen && (
                            <div 
                              ref={menuRef}
                              className="absolute right-6 z-20 mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl py-1 w-44 divide-y divide-zinc-100 dark:divide-zinc-805 text-left font-semibold"
                            >
                              <div className="py-1">
                                <button 
                                  onClick={() => {
                                    setDetailsCampaignId(c._id);
                                    setActiveMenuRowId(null);
                                  }}
                                  className="w-full text-left px-3.5 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2"
                                >
                                  <Eye size={12} className="text-zinc-400" />
                                  <span>View Details</span>
                                </button>
                                <button 
                                  onClick={() => {
                                    setAnalyticsCampaignId(c._id);
                                    setActiveMenuRowId(null);
                                  }}
                                  className="w-full text-left px-3.5 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2"
                                >
                                  <BarChart2 size={12} className="text-zinc-400" />
                                  <span>View Analytics</span>
                                </button>
                                <button 
                                  onClick={() => {
                                    setEditingCampaignId(c._id);
                                    setActiveMenuRowId(null);
                                  }}
                                  className="w-full text-left px-3.5 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2"
                                >
                                  <Edit size={12} className="text-zinc-400" />
                                  <span>Edit Campaign</span>
                                </button>
                              </div>
                              <div className="py-1">
                                {c.status === 'Running' ? (
                                  <button 
                                    onClick={() => {
                                      setPauseConfirmId(c._id);
                                      setActiveMenuRowId(null);
                                    }}
                                    className="w-full text-left px-3.5 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2"
                                  >
                                    <Pause size={12} className="text-zinc-400" />
                                    <span>Pause Campaign</span>
                                  </button>
                                ) : c.status === 'Paused' ? (
                                  <button 
                                    onClick={() => {
                                      setResumeConfirmId(c._id);
                                      setActiveMenuRowId(null);
                                    }}
                                    className="w-full text-left px-3.5 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2"
                                  >
                                    <Play size={12} className="text-zinc-400" />
                                    <span>Resume Campaign</span>
                                  </button>
                                ) : null}
                                <button 
                                  onClick={() => {
                                    setDeleteConfirmId(c._id);
                                    setActiveMenuRowId(null);
                                  }}
                                  className="w-full text-left px-3.5 py-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-650 hover:text-red-705 flex items-center gap-2"
                                >
                                  <Trash2 size={12} />
                                  <span>Delete Campaign</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>

            </table>
          </div>
        )}

        {/* Table Pagination Footer */}
        {!loading && !error && campaigns.length > 0 && (
          <div className="px-5 py-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex justify-between items-center text-xs font-bold text-zinc-500 shrink-0">
            <span className="uppercase tracking-wider text-[10px]">
              Showing {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, totalCount)} of {totalCount} campaigns
            </span>
            <div className="flex gap-1.5">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(prev.page - 1, 1) }))}
                disabled={pagination.page === 1}
                className="px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.page + 1, totalPages) }))}
                disabled={pagination.page === totalPages}
                className="px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}

      </section>

      {/* CREATE MODAL */}
      <CreateCampaign 
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCampaignCreated={() => {
          setIsCreateOpen(false);
          setRetryTrigger(prev => prev + 1);
        }}
      />

      {/* EDIT MODAL */}
      {editingCampaignId && (
        <EditCampaign 
          campaignId={editingCampaignId}
          isOpen={!!editingCampaignId}
          onClose={() => setEditingCampaignId(null)}
          onCampaignUpdated={() => {
            setEditingCampaignId(null);
            setRetryTrigger(prev => prev + 1);
          }}
        />
      )}

      {/* VIEW DRAWER */}
      {detailsCampaignId && (
        <CampaignDetails 
          campaignId={detailsCampaignId}
          isOpen={!!detailsCampaignId}
          onClose={() => setDetailsCampaignId(null)}
          onEdit={(id) => {
            setDetailsCampaignId(null);
            setEditingCampaignId(id);
          }}
        />
      )}

      {/* ANALYTICS MODAL */}
      {analyticsCampaignId && (
        <CampaignAnalytics 
          campaignId={analyticsCampaignId}
          isOpen={!!analyticsCampaignId}
          onClose={() => setAnalyticsCampaignId(null)}
        />
      )}

      {/* PAUSE CONFIRMATION DIALOG */}
      {pauseConfirmId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-full mb-4">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-xs font-extrabold uppercase tracking-wide text-zinc-900 dark:text-zinc-100">Pause Campaign?</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed font-semibold">
              Are you sure you want to pause this campaign? Distribution and tracking metrics will be temporarily suspended.
            </p>
            <div className="flex gap-3 mt-6 w-full text-xs font-bold">
              <button
                type="button"
                onClick={() => setPauseConfirmId(null)}
                className="flex-1 py-2 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPause}
                className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition-colors shadow-md"
              >
                Pause Campaign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESUME CONFIRMATION DIALOG */}
      {resumeConfirmId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-full mb-4">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="text-xs font-extrabold uppercase tracking-wide text-zinc-900 dark:text-zinc-100">Resume Campaign?</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed font-semibold">
              Resume distribution channels for this campaign? Status will shift back to Running.
            </p>
            <div className="flex gap-3 mt-6 w-full text-xs font-bold">
              <button
                type="button"
                onClick={() => setResumeConfirmId(null)}
                className="flex-1 py-2 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmResume}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors shadow-md"
              >
                Resume
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            <div className="p-3 bg-red-100 text-red-500 rounded-full mb-4">
              <Trash2 size={24} />
            </div>
            <h3 className="text-xs font-extrabold uppercase tracking-wide text-zinc-900 dark:text-zinc-100">Delete Campaign?</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed font-semibold">
              Deleting a campaign is permanent and cannot be undone. Historical analytics charts might be impacted.
            </p>
            <div className="flex gap-3 mt-6 w-full text-xs font-bold">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2 bg-red-650 hover:bg-red-700 text-white rounded-xl transition-colors shadow-md"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
