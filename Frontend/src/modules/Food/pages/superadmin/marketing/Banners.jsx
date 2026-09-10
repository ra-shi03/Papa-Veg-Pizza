import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Plus, Search, Filter, ArrowUpDown, ChevronDown, ChevronUp, MoreVertical, 
  Trash2, Eye, Edit, PauseCircle, Check, AlertTriangle, AlertCircle, RefreshCw, 
  Columns, Calendar, Image as ImageIcon, Users, DollarSign, Target, MousePointerClick,
  CheckCircle2, XCircle, Clock, ChevronRight, HelpCircle, Download
} from 'lucide-react';

import { 
  apiGetBanners, apiBulkDeleteBanners, apiBulkUpdateBannerStatus,
  apiGetCoupons, apiGetCampaigns, apiGetProducts, apiGetCategories
} from './BannersData';
import { mockRegions, mockFranchises } from './CouponsData';

import CreateEditBannerModal from './CreateEditBannerModal';
import BannersPreview from './BannersPreview';
import BannersCalendar from './BannersCalendar';
import BannerDetailsDrawer from './BannerDetailsDrawer';
import DisableBannerModal from './DisableBannerModal';
import DeleteBannerModal from './DeleteBannerModal';

export default function Banners() {
  // Core Page States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [banners, setBanners] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [retryTrigger, setRetryTrigger] = useState(0);
  
  // API simulator controls
  const [simulateError, setSimulateError] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar'

  // Pagination & Sorting State
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [sorting, setSorting] = useState({ field: 'priority', order: 'desc' });

  // Filters State
  const [showFilters, setShowFilters] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    bannerType: 'All',
    redirectType: 'All',
    status: 'All',
    startDate: '',
    endDate: '',
    regionIds: [],
    franchiseIds: []
  });

  // Table Column Visibility
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    select: true,
    banner: true,
    bannerType: true,
    redirectType: true,
    redirectValue: true,
    priority: true,
    schedule: true,
    status: true,
    actions: true
  });

  // Bulk Selection States
  const [selectedIds, setSelectedIds] = useState([]);
  const [showBulkDropdown, setShowBulkDropdown] = useState(false);

  // Modals & Drawer States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState(null);
  const [previewBanner, setPreviewBanner] = useState(null);
  const [detailsBannerId, setDetailsBannerId] = useState(null);
  const [disableConfirmId, setDisableConfirmId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // KPI Metrics data
  const [kpiStats, setKpiStats] = useState({
    active: 0,
    scheduled: 0,
    expired: 0,
    clicks: 0
  });

  // Toast / Alerts notification banner
  const [toastMessage, setToastMessage] = useState(null);

  // Refs for closing popups on outside click
  const menuRef = useRef(null);
  const columnDropdownRef = useRef(null);
  const bulkDropdownRef = useRef(null);
  const [activeMenuRowId, setActiveMenuRowId] = useState(null);

  // Trigger toast notification helper
  const triggerToast = (msg, type = 'success') => {
    setToastMessage({ text: msg, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Close menus on click outside
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

  // Fetch banners & recalculate KPIs
  useEffect(() => {
    const fetchBannersData = async () => {
      setLoading(true);
      setError(null);
      setSelectedIds([]); // reset selection

      if (simulateError) {
        setLoading(false);
        setError("API connection timed out. (Simulated superadmin system fault)");
        return;
      }

      try {
        const response = await apiGetBanners(filters, pagination, sorting);
        setBanners(response.banners);
        setTotalCount(response.total);
        setTotalPages(response.totalPages);

        // Fetch All to calculate accurate KPIs
        const allDataResponse = await apiGetBanners({}, { page: 1, limit: 1000 }, { field: 'createdAt', order: 'desc' });
        const allBanners = allDataResponse.banners;
        const now = new Date();

        let active = 0;
        let scheduled = 0;
        let expired = 0;
        let clicks = 0;

        allBanners.forEach(b => {
          const start = new Date(b.startDate);
          const end = new Date(b.endDate);
          clicks += (b.clicks || 0);

          if (!b.isActive) {
            // Disabled is not counted in scheduled or active
          } else if (now > end) {
            expired++;
          } else if (now < start) {
            scheduled++;
          } else {
            active++;
          }
        });

        setKpiStats({
          active,
          scheduled,
          expired,
          clicks
        });

        setLoading(false);
      } catch (err) {
        setError(err.message || 'System was unable to retrieve banners list.');
        setLoading(false);
      }
    };

    fetchBannersData();
  }, [filters, pagination, sorting, retryTrigger, simulateError]);

  // Debounce filter search text (450ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchText }));
      setPagination(prev => ({ ...prev, page: 1 }));
    }, 450);

    return () => clearTimeout(handler);
  }, [searchText]);

  // Handle Sort Change
  const handleSort = (field) => {
    setSorting(prev => {
      const isAsc = prev.field === field && prev.order === 'asc';
      return { field, order: isAsc ? 'desc' : 'asc' };
    });
  };

  // Row selection helpers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const pageIds = banners.map(b => b._id);
      setSelectedIds(prev => Array.from(new Set([...prev, ...pageIds])));
    } else {
      const pageIds = banners.map(b => b._id);
      setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
    }
  };

  const handleSelectRow = (e, id) => {
    if (e.target.checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(item => item !== id));
    }
  };

  // Bulk Actions
  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} banners?`)) return;
    try {
      await apiBulkDeleteBanners(selectedIds);
      triggerToast(`Successfully deleted ${selectedIds.length} banners.`);
      setSelectedIds([]);
      setRetryTrigger(prev => prev + 1);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleBulkStatusChange = async (isActive) => {
    try {
      await apiBulkUpdateBannerStatus(selectedIds, isActive);
      triggerToast(`Status updated to ${isActive ? 'Active' : 'Disabled'} for selected banners.`);
      setSelectedIds([]);
      setRetryTrigger(prev => prev + 1);
    } catch (err) {
      alert(err.message);
    }
  };

  // Filter handlers
  const handleMultiSelectFilter = (category, value) => {
    setFilters(prev => {
      const current = prev[category] || [];
      const updated = current.includes(value) 
        ? current.filter(item => item !== value)
        : [...current, value];
      return { ...prev, [category]: updated };
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setSearchText('');
    setFilters({
      search: '',
      bannerType: 'All',
      redirectType: 'All',
      status: 'All',
      startDate: '',
      endDate: '',
      regionIds: [],
      franchiseIds: []
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const hasActiveFilters = useMemo(() => {
    return filters.bannerType !== 'All' || 
           filters.redirectType !== 'All' || 
           filters.status !== 'All' || 
           filters.startDate !== '' || 
           filters.endDate !== '' || 
           filters.regionIds.length > 0 || 
           filters.franchiseIds.length > 0 ||
           searchText !== '';
  }, [filters, searchText]);

  // Export CSV helper
  const handleExportCSV = () => {
    const headers = ['ID', 'Title', 'Banner Type', 'Redirect Type', 'Redirect Value', 'Priority', 'Start Date', 'End Date', 'Clicks', 'Impressions', 'Status'];
    const rows = banners.map(b => [
      b._id, b.title, b.bannerType, b.redirectType, b.redirectId, b.priority, b.startDate, b.endDate, b.clicks, b.impressions, b.isActive ? 'Active' : 'Disabled'
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `pvp_banners_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast("Banners CSV report exported successfully.");
  };

  // Get status color helper
  const getBannerStatus = (b) => {
    if (!b.isActive) return 'Disabled';
    const now = new Date();
    const start = new Date(b.startDate);
    const end = new Date(b.endDate);
    if (now > end) return 'Expired';
    if (now < start) return 'Scheduled';
    return 'Active';
  };

  if (viewMode === 'calendar') {
    return <BannersCalendar onBack={() => setViewMode('list')} />;
  }

  return (
    <div className="p-3 md:p-5 max-w-[1600px] mx-auto space-y-5 animate-in fade-in duration-300 pb-12">
      
      {/* Toast message banner */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-[99] flex items-center gap-2.5 px-4.5 py-3 rounded-xl bg-zinc-900 dark:bg-zinc-800 text-white shadow-2xl border border-zinc-700 animate-in slide-in-from-top-4 duration-300">
          <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
          <span className="text-xs font-bold">{toastMessage.text}</span>
        </div>
      )}

      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4.5 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-lg font-black text-zinc-900 dark:text-zinc-150 flex items-center gap-2">
            <span className="p-2 bg-[var(--primary)]/10 text-[var(--primary)] rounded-xl">
              <ImageIcon size={20} />
            </span>
            Campaign Banner Management
          </h1>
          <p className="text-[11px] text-zinc-500 font-semibold mt-1">
            Design, schedule, and orchestrate visual promotions, slide-overs, and popups across territories.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto shrink-0 select-none">
          <button 
            onClick={() => setViewMode('calendar')}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl text-xs shadow-sm cursor-pointer"
          >
            <Calendar size={14} /> Schedule Calendar
          </button>
          <button 
            onClick={() => setIsCreateOpen(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4.5 py-2 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Plus size={15} /> Create Banner
          </button>
        </div>
      </div>

      {/* KPI Cards section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 select-none">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Active Banners</span>
            <h4 className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-1">{kpiStats.active}</h4>
            <p className="text-[9px] text-zinc-450 mt-0.5">Currently displaying</p>
          </div>
          <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-lg">
            <Check size={14} />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Scheduled</span>
            <h4 className="text-base font-black text-blue-650 mt-1">{kpiStats.scheduled}</h4>
            <p className="text-[9px] text-blue-500 font-bold mt-0.5">Upcoming campaigns</p>
          </div>
          <div className="p-2.5 bg-blue-500/10 text-blue-500 rounded-lg">
            <Calendar size={14} />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Expired</span>
            <h4 className="text-base font-black text-red-500 dark:text-red-450 mt-1">{kpiStats.expired}</h4>
            <p className="text-[9px] text-red-500/80 font-bold mt-0.5">Validity elapsed</p>
          </div>
          <div className="p-2.5 bg-red-500/10 text-red-500 rounded-lg">
            <XCircle size={14} />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl flex items-center justify-between shadow-sm bg-gradient-to-br from-emerald-500/5 to-teal-500/5">
          <div>
            <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider block">Total Clicks</span>
            <h4 className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-1">{kpiStats.clicks.toLocaleString()}</h4>
            <p className="text-[9px] text-zinc-455 mt-0.5">Clicks attributed</p>
          </div>
          <div className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-lg">
            <MousePointerClick size={14} />
          </div>
        </div>
      </div>

      {/* Main Table Section */}
      <div className="space-y-4">
        
        {/* Collapsible Filter & Search Panel */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4.5 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row gap-3.5 items-center justify-between">
            
            {/* Search Bar */}
            <div className="relative w-full md:w-80 select-none">
              <input 
                className="w-full pl-8 pr-3 py-2 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs focus:ring-2 focus:ring-[var(--primary)] outline-none transition-all text-zinc-850 dark:text-zinc-150 placeholder:text-zinc-400 font-semibold" 
                placeholder="Search banner name..." 
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
              <Search size={14} className="absolute left-2.5 top-2.5 text-zinc-400" />
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end select-none">
              
              {/* Column visibility dropdown */}
              <div className="relative" ref={columnDropdownRef}>
                <button 
                  onClick={() => setShowColumnDropdown(!showColumnDropdown)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-zinc-900 text-zinc-750 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm active:scale-95 cursor-pointer"
                >
                  <Columns size={13} />
                  Columns
                  <ChevronDown size={12} />
                </button>
                {showColumnDropdown && (
                  <div className="absolute right-0 mt-2.5 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-20 py-2 text-xs font-bold text-zinc-750 dark:text-zinc-350">
                    {Object.keys(visibleColumns).map((col) => (
                      <label key={col} className="flex items-center gap-2.5 px-4 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer capitalize">
                        <input 
                          type="checkbox" 
                          checked={visibleColumns[col]} 
                          onChange={() => setVisibleColumns(prev => ({ ...prev, [col]: !prev[col] }))}
                          className="rounded text-[var(--primary)] focus:ring-[var(--primary)]"
                        />
                        {col === 'bannerType' ? 'Banner Area' : col === 'redirectType' ? 'Target Type' : col === 'redirectValue' ? 'Target ID' : col}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Filters Collapse button */}
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors shadow-sm active:scale-95 cursor-pointer ${
                  hasActiveFilters 
                    ? 'bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20' 
                    : 'bg-white dark:bg-zinc-900 text-zinc-750 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                }`}
              >
                <Filter size={13} />
                Filters {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-[var(--primary)] inline-block"></span>}
                {showFilters ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>

              {/* Export Report */}
              <button 
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm active:scale-95 cursor-pointer"
              >
                <Download size={13} />
                Export CSV
              </button>

              {/* Simulated Fault Switcher */}
              <label className="flex items-center gap-2 pl-2 border-l border-zinc-200 dark:border-zinc-800 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={simulateError} 
                  onChange={() => setSimulateError(!simulateError)}
                  className="rounded text-red-500 focus:ring-red-500"
                />
                <span className="text-[10px] font-black text-red-550 dark:text-red-450 uppercase tracking-wider">Inject Fault</span>
              </label>

            </div>
          </div>

          {/* Hidden advanced filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 border-t border-zinc-100 dark:border-zinc-800 pt-4.5 animate-in fade-in slide-in-from-top-2 duration-200 select-none">
              
              {/* 1. Banner Container Area */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider block">Banner Display Area</label>
                <select 
                  value={filters.bannerType}
                  onChange={(e) => {
                    setFilters(prev => ({ ...prev, bannerType: e.target.value }));
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-750 dark:text-zinc-200 font-semibold"
                >
                  <option value="All">All Categories</option>
                  <option value="Homepage Banner">Homepage Banner</option>
                  <option value="Offer Banner">Offer Banner</option>
                  <option value="Festival Banner">Festival Banner</option>
                  <option value="Popup Banner">Popup Banner</option>
                </select>
              </div>

              {/* 2. Redirection Target Type */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-455 uppercase tracking-wider block">Redirection Target Type</label>
                <select 
                  value={filters.redirectType}
                  onChange={(e) => {
                    setFilters(prev => ({ ...prev, redirectType: e.target.value }));
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-750 dark:text-zinc-200 font-semibold"
                >
                  <option value="All">All Types</option>
                  <option value="Product">Product Details</option>
                  <option value="Category">Category List</option>
                  <option value="Coupon">Coupon Code</option>
                  <option value="Campaign">Marketing Campaign</option>
                  <option value="External URL">External Link URL</option>
                </select>
              </div>

              {/* 3. Status select */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider block">Status</label>
                <select 
                  value={filters.status}
                  onChange={(e) => {
                    setFilters(prev => ({ ...prev, status: e.target.value }));
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  className="w-full bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-750 dark:text-zinc-200 font-semibold"
                >
                  <option value="All">All statuses</option>
                  <option value="Active">Active</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Expired">Expired</option>
                  <option value="Disabled">Disabled</option>
                </select>
              </div>

              {/* 4. Date Range Filters */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider block">Schedule Active Range</label>
                <div className="grid grid-cols-2 gap-2">
                  <input 
                    type="date" 
                    value={filters.startDate}
                    onChange={(e) => {
                      setFilters(prev => ({ ...prev, startDate: e.target.value }));
                      setPagination(prev => ({ ...prev, page: 1 }));
                    }}
                    className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-2 py-1.5 text-[10.5px] outline-none text-zinc-700 dark:text-zinc-200 font-semibold"
                  />
                  <input 
                    type="date" 
                    value={filters.endDate}
                    onChange={(e) => {
                      setFilters(prev => ({ ...prev, endDate: e.target.value }));
                      setPagination(prev => ({ ...prev, page: 1 }));
                    }}
                    className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-2 py-1.5 text-[10.5px] outline-none text-zinc-700 dark:text-zinc-200 font-semibold"
                  />
                </div>
              </div>

              {/* 5. Region Multi-select */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider block">Filter by Regions Display</label>
                <div className="flex flex-wrap gap-1.5 p-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-955 max-h-24 overflow-y-auto">
                  {mockRegions.map(reg => {
                    const isChecked = filters.regionIds.includes(reg.id);
                    return (
                      <button
                        key={reg.id}
                        onClick={() => handleMultiSelectFilter('regionIds', reg.id)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                          isChecked 
                            ? 'bg-[var(--primary)] text-white border-[var(--primary)]' 
                            : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-550 dark:text-zinc-400 hover:bg-zinc-100'
                        }`}
                      >
                        {reg.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 6. Franchise Multi-select */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider block">Filter by Franchises Display</label>
                <div className="flex flex-wrap gap-1.5 p-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-955 max-h-24 overflow-y-auto">
                  {mockFranchises.map(fran => {
                    const isChecked = filters.franchiseIds.includes(fran.id);
                    return (
                      <button
                        key={fran.id}
                        onClick={() => handleMultiSelectFilter('franchiseIds', fran.id)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                          isChecked 
                            ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-sm' 
                            : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-550 dark:text-zinc-400 hover:bg-zinc-100'
                        }`}
                      >
                        {fran.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="md:col-span-4 flex justify-end">
                <button 
                  onClick={clearFilters}
                  className="px-4.5 py-1.5 border border-zinc-350 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-350 rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bulk actions banner */}
        {selectedIds.length > 0 && (
          <div className="bg-zinc-900 dark:bg-zinc-800 text-white rounded-xl px-4.5 py-3 border border-zinc-750 flex items-center justify-between shadow-lg animate-in slide-in-from-bottom-2 duration-300">
            <span className="text-xs font-bold">{selectedIds.length} banners selected for bulk processing.</span>
            <div className="flex items-center gap-2.5 select-none" ref={bulkDropdownRef}>
              <button 
                onClick={() => setShowBulkDropdown(!showBulkDropdown)}
                className="flex items-center gap-1 px-3.5 py-1.5 bg-zinc-850 dark:bg-zinc-700 border border-zinc-650 hover:bg-zinc-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Bulk Actions <ChevronDown size={13} />
              </button>
              
              {showBulkDropdown && (
                <div className="absolute mt-2.5 w-44 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl z-20 py-2 text-xs font-bold text-zinc-300 text-left">
                  <button 
                    onClick={() => handleBulkStatusChange(false)}
                    className="w-full px-4 py-2 hover:bg-zinc-800 transition-colors text-left text-zinc-300"
                  >
                    Bulk Disable Banners
                  </button>
                  <button 
                    onClick={() => handleBulkStatusChange(true)}
                    className="w-full px-4 py-2 hover:bg-zinc-800 transition-colors text-left text-zinc-300"
                  >
                    Bulk Enable Banners
                  </button>
                  <button 
                    onClick={handleBulkDelete}
                    className="w-full px-4 py-2 hover:bg-zinc-800 hover:text-red-400 transition-colors text-left text-red-550 font-bold border-t border-zinc-750"
                  >
                    Bulk Delete Selected
                  </button>
                </div>
              )}
              
              <button 
                onClick={() => setSelectedIds([])}
                className="px-3.5 py-1.5 hover:bg-zinc-850 dark:hover:bg-zinc-750 text-xs font-bold text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                Deselect All
              </button>
            </div>
          </div>
        )}

        {/* Primary Data Table */}
        {error ? (
          <div className="bg-red-50 dark:bg-red-950/10 border border-red-500/20 p-8 rounded-2xl flex flex-col items-center justify-center text-center gap-3">
            <AlertCircle size={36} className="text-red-500" />
            <p className="text-sm font-bold text-red-750 dark:text-red-450">{error}</p>
            <button 
              onClick={() => setRetryTrigger(prev => prev + 1)}
              className="px-5 py-2 bg-red-650 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95"
            >
              Retry Request
            </button>
          </div>
        ) : loading ? (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-16 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 text-[var(--primary)] animate-spin" />
            <p className="text-xs font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest">Querying Banner Database...</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1050px]">
                
                {/* Table Header */}
                <thead className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-[10px] uppercase tracking-wider font-extrabold sticky top-0 z-10 select-none">
                  <tr>
                    {visibleColumns.select && (
                      <th className="px-4 py-3.5 w-10 text-center">
                        <input 
                          type="checkbox"
                          checked={banners.length > 0 && banners.every(b => selectedIds.includes(b._id))}
                          onChange={handleSelectAll}
                          className="rounded text-[var(--primary)] focus:ring-[var(--primary)]"
                        />
                      </th>
                    )}
                    
                    {visibleColumns.banner && (
                      <th className="px-4 py-3.5 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-850" onClick={() => handleSort('title')}>
                        <span className="flex items-center gap-1.5">
                          Promotional Banner details
                          <ArrowUpDown size={12} className="text-zinc-400" />
                        </span>
                      </th>
                    )}

                    {visibleColumns.bannerType && (
                      <th className="px-4 py-3.5 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-850" onClick={() => handleSort('bannerType')}>
                        <span className="flex items-center gap-1.5">
                          Banner Area
                          <ArrowUpDown size={12} className="text-zinc-400" />
                        </span>
                      </th>
                    )}

                    {visibleColumns.redirectType && (
                      <th className="px-4 py-3.5 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-850" onClick={() => handleSort('redirectType')}>
                        <span className="flex items-center gap-1.5">
                          Target Type
                          <ArrowUpDown size={12} className="text-zinc-400" />
                        </span>
                      </th>
                    )}

                    {visibleColumns.redirectValue && (
                      <th className="px-4 py-3.5">Target Value / ID</th>
                    )}

                    {visibleColumns.priority && (
                      <th className="px-4 py-3.5 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-850 text-center" onClick={() => handleSort('priority')}>
                        <span className="flex items-center justify-center gap-1.5">
                          Priority
                          <ArrowUpDown size={12} className="text-zinc-400" />
                        </span>
                      </th>
                    )}

                    {visibleColumns.schedule && (
                      <th className="px-4 py-3.5 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-850" onClick={() => handleSort('startDate')}>
                        <span className="flex items-center gap-1.5">
                          Active Timeline
                          <ArrowUpDown size={12} className="text-zinc-400" />
                        </span>
                      </th>
                    )}

                    {visibleColumns.status && (
                      <th className="px-4 py-3.5 text-center">Status</th>
                    )}

                    {visibleColumns.actions && (
                      <th className="px-4 py-3.5 text-center w-16">Actions</th>
                    )}
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-xs font-semibold">
                  {banners.map((b) => {
                    const isSelected = selectedIds.includes(b._id);
                    const isMenuOpen = activeMenuRowId === b._id;
                    const statusStr = getBannerStatus(b);

                    return (
                      <tr 
                        key={b._id} 
                        className={`transition-colors ${
                          isSelected 
                            ? 'bg-[var(--primary)]/5 hover:bg-[var(--primary)]/10' 
                            : 'hover:bg-zinc-50/50 dark:hover:bg-zinc-850/20'
                        }`}
                      >
                        {visibleColumns.select && (
                          <td className="px-4 py-3.5 text-center">
                            <input 
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => handleSelectRow(e, b._id)}
                              className="rounded text-[var(--primary)] focus:ring-[var(--primary)]"
                            />
                          </td>
                        )}

                        {visibleColumns.banner && (
                          <td className="px-4 py-3.5 max-w-sm">
                            <div className="flex items-center gap-3">
                              <div className="w-14 h-9 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 shrink-0 bg-zinc-100 flex items-center justify-center">
                                <img src={b.image} className="w-full h-full object-cover" alt="Banner Thumbnail" />
                              </div>
                              <span className="font-bold text-zinc-900 dark:text-zinc-150 block truncate max-w-[200px]" title={b.title}>{b.title}</span>
                            </div>
                          </td>
                        )}

                        {visibleColumns.bannerType && (
                          <td className="px-4 py-3.5 text-zinc-700 dark:text-zinc-300 font-bold">{b.bannerType}</td>
                        )}

                        {visibleColumns.redirectType && (
                          <td className="px-4 py-3.5">
                            <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700 text-[9.5px] font-black text-zinc-650 dark:text-zinc-400 uppercase">
                              {b.redirectType}
                            </span>
                          </td>
                        )}

                        {visibleColumns.redirectValue && (
                          <td className="px-4 py-3.5 text-zinc-500 dark:text-zinc-450 truncate max-w-[150px]" title={b.redirectId}>{b.redirectId}</td>
                        )}

                        {visibleColumns.priority && (
                          <td className="px-4 py-3.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <span className="text-[10px] font-black text-zinc-900 dark:text-zinc-200">{b.priority}</span>
                              <div className="w-12 bg-zinc-200 dark:bg-zinc-800 h-1 rounded-full overflow-hidden relative">
                                <span className="absolute top-0 left-0 bg-[var(--primary)] h-full" style={{ width: `${b.priority}%` }}></span>
                              </div>
                            </div>
                          </td>
                        )}

                        {visibleColumns.schedule && (
                          <td className="px-4 py-3.5 text-zinc-500 dark:text-zinc-400">
                            <div className="space-y-0.5 text-[10px]">
                              <div>Start: {new Date(b.startDate).toLocaleDateString('en-IN')}</div>
                              <div className="font-bold text-zinc-400">End: {new Date(b.endDate).toLocaleDateString('en-IN')}</div>
                            </div>
                          </td>
                        )}

                        {visibleColumns.status && (
                          <td className="px-4 py-3.5 text-center select-none">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold ${
                              statusStr === 'Disabled' ? 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500' :
                              statusStr === 'Scheduled' ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10' :
                              statusStr === 'Expired' ? 'bg-red-50 text-red-700 dark:bg-red-500/10' :
                              'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10'
                            }`}>
                              {statusStr}
                            </span>
                          </td>
                        )}

                        {visibleColumns.actions && (
                          <td className="px-4 py-3.5 text-center relative">
                            <button 
                              onClick={() => setActiveMenuRowId(isMenuOpen ? null : b._id)}
                              className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-550 hover:text-zinc-850 dark:hover:text-zinc-250 rounded-lg transition-colors cursor-pointer"
                            >
                              <MoreVertical size={16} />
                            </button>

                            {/* Row Action Popup Menu */}
                            {isMenuOpen && (
                              <div 
                                ref={menuRef}
                                className="absolute right-6 mt-1.5 w-44 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-20 py-2 text-xs font-bold text-zinc-750 dark:text-zinc-350 text-left"
                              >
                                <button 
                                  onClick={() => {
                                    setPreviewBanner(b);
                                    setActiveMenuRowId(null);
                                  }}
                                  className="w-full px-4 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors flex items-center gap-1.5 text-left text-zinc-700 dark:text-zinc-350"
                                >
                                  <Eye size={13} />
                                  Preview Mockup
                                </button>
                                
                                <button 
                                  onClick={() => {
                                    setDetailsBannerId(b._id);
                                    setActiveMenuRowId(null);
                                  }}
                                  className="w-full px-4 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-855 transition-colors flex items-center gap-1.5 text-left text-[var(--primary)]"
                                >
                                  <Eye size={13} />
                                  View Details Drawer
                                </button>

                                <button 
                                  onClick={() => {
                                    setEditingBannerId(b._id);
                                    setActiveMenuRowId(null);
                                  }}
                                  className="w-full px-4 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5 text-left text-zinc-700 dark:text-zinc-300"
                                >
                                  <Edit size={13} />
                                  Edit Configuration
                                </button>

                                {b.isActive && (
                                  <button 
                                    onClick={() => {
                                      setDisableConfirmId(b._id);
                                      setActiveMenuRowId(null);
                                    }}
                                    className="w-full px-4 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5 text-left text-amber-600"
                                  >
                                    <PauseCircle size={13} />
                                    Disable Banner
                                  </button>
                                )}

                                <button 
                                  onClick={() => {
                                    setDeleteConfirmId(b._id);
                                    setActiveMenuRowId(null);
                                  }}
                                  className="w-full px-4 py-2 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-500 transition-colors flex items-center gap-1.5 text-left text-red-500 font-bold border-t border-zinc-100 dark:border-zinc-800"
                                >
                                  <Trash2 size={13} />
                                  Delete Record
                                </button>
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}

                  {banners.length === 0 && (
                    <tr>
                      <td colSpan="9" className="px-4 py-16 text-center text-zinc-450 dark:text-zinc-500 font-extrabold">
                        No banners matching the specified criteria exist.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div className="px-4.5 py-3.5 flex flex-col sm:flex-row justify-between items-center gap-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 select-none">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-550 dark:text-zinc-450">
                <span>Display Limit</span>
                <select 
                  value={pagination.limit}
                  onChange={(e) => {
                    setPagination(prev => ({ ...prev, limit: parseInt(e.target.value), page: 1 }));
                  }}
                  className="bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-lg px-2 py-1 outline-none text-zinc-700 dark:text-zinc-200"
                >
                  <option value={5}>5 entries</option>
                  <option value={10}>10 entries</option>
                  <option value={20}>20 entries</option>
                </select>
                <span>showing {totalCount === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, totalCount)} of {totalCount} banners</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(prev.page - 1, 1) }))}
                  disabled={pagination.page === 1}
                  className="px-3.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-lg text-xs font-bold text-zinc-700 dark:text-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm cursor-pointer"
                >
                  Prev
                </button>

                {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pNum) => (
                  <button
                    key={pNum}
                    onClick={() => setPagination(prev => ({ ...prev, page: pNum }))}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer ${
                      pagination.page === pNum
                        ? 'bg-[var(--primary)] text-white'
                        : 'bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 text-zinc-750 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {pNum}
                  </button>
                ))}

                <button 
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.page + 1, totalPages) }))}
                  disabled={pagination.page === totalPages}
                  className="px-3.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-lg text-xs font-bold text-zinc-700 dark:text-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* CREATE MODAL */}
      <CreateEditBannerModal 
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSaved={() => {
          triggerToast('Campaign banner created successfully.');
          setRetryTrigger(prev => prev + 1);
        }}
      />

      {/* EDIT MODAL */}
      <CreateEditBannerModal 
        bannerId={editingBannerId}
        isOpen={editingBannerId !== null}
        onClose={() => setEditingBannerId(null)}
        onSaved={() => {
          triggerToast('Banner configurations modified successfully.');
          setRetryTrigger(prev => prev + 1);
        }}
      />

      {/* PREVIEW MODAL */}
      <BannersPreview 
        banner={previewBanner}
        isOpen={previewBanner !== null}
        onClose={() => setPreviewBanner(null)}
      />

      {/* DETAILS DRAWER */}
      <BannerDetailsDrawer 
        bannerId={detailsBannerId}
        isOpen={detailsBannerId !== null}
        onClose={() => setDetailsBannerId(null)}
        onEdit={(id) => {
          setDetailsBannerId(null);
          setEditingBannerId(id);
        }}
      />

      {/* DISABLE CONFIRM MODAL */}
      <DisableBannerModal 
        bannerId={disableConfirmId}
        isOpen={disableConfirmId !== null}
        onClose={() => setDisableConfirmId(null)}
        onDisabled={() => {
          triggerToast('Banner disabled successfully.');
          setRetryTrigger(prev => prev + 1);
        }}
      />

      {/* DELETE CONFIRM MODAL */}
      <DeleteBannerModal 
        bannerId={deleteConfirmId}
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        onDeleted={() => {
          triggerToast('Banner deleted successfully.');
          setRetryTrigger(prev => prev + 1);
        }}
      />

    </div>
  );
}
