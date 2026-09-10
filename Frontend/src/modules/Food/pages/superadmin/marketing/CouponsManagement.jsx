import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Plus, CheckCircle2, TimerOff, Gift, CircleDollarSign, Percent, 
  Star, TrendingUp, Filter, ChevronDown, ChevronLeft, ChevronRight, Download, Table, LayoutGrid, 
  AlertTriangle, RefreshCw, MoreVertical, Trash2, Eye, Edit, Copy, 
  Check, Info, EyeOff, ShieldAlert, WifiOff, Columns
} from 'lucide-react';
import { 
  mockRegions, mockZones, mockTerritories, mockFranchises, mockStores, 
  api, getAggregateStats, CouponList 
} from './CouponsData';
import CreateCoupon from './CreateCoupon';
import EditCoupon from './EditCoupon';
import CloneCoupon from './CloneCoupon';
import CouponDetails from './CouponDetails';
import CouponAnalysis from './CouponAnalysis';
import { toast } from 'sonner';

export default function CouponsManagement() {
  const [activeTab, setActiveTab] = useState('management');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryTrigger, setRetryTrigger] = useState(0);

  // Simulated API error state to demonstrate error resilience
  const [simulateError, setSimulateError] = useState(false);

  // Coupons Database Ledger State
  const [coupons, setCoupons] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Statistics State
  const [stats, setStats] = useState({
    activeCoupons: 0,
    expiredCoupons: 0,
    totalRedemptions: 0,
    revenueGenerated: 0,
    averageDiscount: 0,
    disabledCoupons: 0
  });

  // Table Filters State
  const [filters, setFilters] = useState({
    search: '',
    type: 'All',
    status: 'All',
    startDate: '',
    endDate: '',
    regionIds: [],
    zoneIds: [],
    territoryIds: [],
    franchiseIds: [],
    storeIds: [],
    customerSegments: []
  });

  // Sorting and Pagination State
  const [sorting, setSorting] = useState({ field: 'createdAt', direction: 'desc' });
  const [pagination, setPagination] = useState({ page: 1, limit: 5 });

  // Column Visibility State
  const [columnVisibility, setColumnVisibility] = useState({
    code: true,
    title: true,
    type: true,
    discount: true,
    usage: true,
    revenue: true,
    expiry: true,
    status: true,
    actions: true
  });

  // Selection state
  const [selectedRowIds, setSelectedRowIds] = useState([]);

  // Action Menu / Dropdown anchors
  const [activeMenuRowId, setActiveMenuRowId] = useState(null);
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  const [showBulkDropdown, setShowBulkDropdown] = useState(false);
  
  const menuRef = useRef(null);
  const columnRef = useRef(null);
  const bulkRef = useRef(null);

  // Modals & Drawer state
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCloneOpen, setIsCloneOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDisableConfirmOpen, setIsDisableConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Debounced search text
  const [searchText, setSearchText] = useState('');
  useEffect(() => {
    const handler = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchText }));
      setPagination(prev => ({ ...prev, page: 1 }));
    }, 450);
    return () => clearTimeout(handler);
  }, [searchText]);

  // Click outside menus handlers
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenuRowId(null);
      }
      if (columnRef.current && !columnRef.current.contains(event.target)) {
        setShowColumnDropdown(false);
      }
      if (bulkRef.current && !bulkRef.current.contains(event.target)) {
        setShowBulkDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch Ledger data
  useEffect(() => {
    fetchCouponsData();
  }, [filters, sorting, pagination, retryTrigger, simulateError]);

  const fetchCouponsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryFilters = {
        ...filters,
        triggerError: simulateError
      };
      
      const result = await api.getCoupons(queryFilters, sorting, pagination);
      setCoupons(result.data);
      setTotalCount(result.totalCount);
      setTotalPages(result.totalPages);
      
      // Load real time derived statistics
      const aggregateStats = getAggregateStats();
      setStats(aggregateStats);
    } catch (err) {
      setError(err.message || 'Unable to connect to coupons collection.');
      toast.error('API Ledger synchronization failed.');
    } finally {
      setLoading(false);
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setFilters({
      search: '',
      type: 'All',
      status: 'All',
      startDate: '',
      endDate: '',
      regionIds: [],
      zoneIds: [],
      territoryIds: [],
      franchiseIds: [],
      storeIds: [],
      customerSegments: []
    });
    setSearchText('');
    setPagination({ page: 1, limit: 5 });
    toast.success('Filters cleared.');
  };

  // Dynamic cascading region options
  const filterZones = useMemo(() => {
    if (filters.regionIds.length === 0) return mockZones;
    return mockZones.filter(z => filters.regionIds.includes(z.regionId));
  }, [filters.regionIds]);

  const filterStores = useMemo(() => {
    if (filters.regionIds.length === 0) return mockStores;
    // get zones
    const zones = mockZones.filter(z => filters.regionIds.includes(z.regionId)).map(z => z.id);
    const territories = mockTerritories.filter(t => zones.includes(t.zoneId)).map(t => t.id);
    const franchises = mockFranchises.filter(f => territories.includes(f.territoryId)).map(f => f.id);
    return mockStores.filter(s => franchises.includes(s.franchiseId));
  }, [filters.regionIds]);

  // Handle Sort Change
  const handleSortChange = (field) => {
    setSorting(prev => {
      const direction = prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc';
      return { field, direction };
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Export Coupons CSV
  const handleExportCSV = async () => {
    try {
      // Get all coupons matching current filters without pagination page bounds
      const result = await api.getCoupons(filters, sorting, { page: 1, limit: 10000 });
      const records = result.data;
      
      if (records.length === 0) {
        toast.error('No coupon records found to export.');
        return;
      }

      const headers = ['Coupon Code', 'Campaign Title', 'Discount Type', 'Value', 'Min Order (INR)', 'Max Discount (INR)', 'Total Limit', 'Status', 'Expiry Date', 'Created By'];
      const rows = records.map(c => [
        c.code,
        `"${c.title.replace(/"/g, '""')}"`,
        c.couponType,
        c.value,
        c.minimumOrderAmount,
        c.maximumDiscount,
        c.usageLimit,
        c.status.toUpperCase(),
        new Date(c.endDate).toLocaleDateString('en-IN'),
        c.createdBy
      ]);

      const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `PapaVegPizza_CouponsLedger_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`${records.length} Coupon records exported successfully!`);
    } catch (err) {
      toast.error('Failed to generate export file.');
    }
  };

  // Bulk selections helper
  const handleSelectRow = (id) => {
    setSelectedRowIds(prev => 
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  const handleSelectAllRows = () => {
    const visibleIds = coupons.map(c => c._id);
    const allSelected = visibleIds.every(id => selectedRowIds.includes(id));
    
    if (allSelected) {
      setSelectedRowIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setSelectedRowIds(prev => {
        const combined = [...prev];
        visibleIds.forEach(id => {
          if (!combined.includes(id)) combined.push(id);
        });
        return combined;
      });
    }
  };

  // Bulk operations
  const handleBulkDisable = async () => {
    if (selectedRowIds.length === 0) return;
    setLoading(true);
    try {
      await Promise.all(selectedRowIds.map(id => api.updateCoupon(id, { status: 'disabled' })));
      toast.success(`${selectedRowIds.length} Coupons disabled successfully.`);
      setSelectedRowIds([]);
      setRetryTrigger(r => r + 1);
    } catch (err) {
      toast.error('Bulk disable failed.');
    } finally {
      setLoading(false);
      setShowBulkDropdown(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRowIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to permanently delete ${selectedRowIds.length} coupons? This action is irreversible.`)) {
      setShowBulkDropdown(false);
      return;
    }
    setLoading(true);
    try {
      await Promise.all(selectedRowIds.map(id => api.deleteCoupon(id)));
      toast.success(`${selectedRowIds.length} Coupons deleted successfully.`);
      setSelectedRowIds([]);
      setRetryTrigger(r => r + 1);
    } catch (err) {
      toast.error('Bulk deletion failed.');
    } finally {
      setLoading(false);
      setShowBulkDropdown(false);
    }
  };

  // Single operations handlers
  const handleDisableCoupon = async () => {
    if (!selectedCoupon) return;
    setLoading(true);
    try {
      await api.updateCoupon(selectedCoupon._id, { status: 'disabled' });
      toast.success(`Coupon ${selectedCoupon.code} disabled.`);
      setIsDisableConfirmOpen(false);
      setRetryTrigger(r => r + 1);
    } catch (err) {
      toast.error('Failed to disable coupon.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCoupon = async () => {
    if (!selectedCoupon) return;
    setLoading(true);
    try {
      await api.deleteCoupon(selectedCoupon._id);
      toast.success(`Coupon ${selectedCoupon.code} deleted permanently.`);
      setIsDeleteConfirmOpen(false);
      setRetryTrigger(r => r + 1);
    } catch (err) {
      toast.error('Failed to delete coupon.');
    } finally {
      setLoading(false);
    }
  };

  const getSortIcon = (field) => {
    if (sorting.field !== field) return null;
    return (
      <span className="text-[var(--primary)] text-[10px] font-bold">
        {sorting.direction === 'asc' ? ' ▴' : ' ▾'}
      </span>
    );
  };

  // Format statistics numbers
  const formatCurrency = (val) => {
    return `₹${val.toLocaleString('en-IN')}`;
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-zinc-50 dark:bg-zinc-955 min-h-screen text-zinc-850 dark:text-zinc-100 transition-colors duration-300 w-full max-w-7xl mx-auto">
      
      {/* Top Header Block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-zinc-200 dark:border-zinc-805 pb-5">
        <div>
          <h1 className="text-xl font-black text-black dark:text-white flex items-center gap-2">
            <Gift size={22} className="text-[var(--primary)]" />
            Coupons &amp; Rewards Panel
          </h1>
          <p className="text-[11px] font-semibold text-zinc-555 dark:text-zinc-400 mt-1">
            Super Administrator ledger to create, target, and monitor performance parameters of franchise discount vouchers.
          </p>
        </div>

        {/* Master Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto shrink-0 select-none">


          <button
            onClick={() => setIsCreateOpen(true)}
            className="h-9 px-3.5 bg-[var(--primary)] text-white text-xs font-extrabold rounded-lg hover:bg-[var(--primary)]/90 shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus size={14} />
            Create Coupon
          </button>
        </div>
      </div>

      {/* Pages Tabs */}
      <div className="flex gap-5 border-b border-zinc-200 dark:border-zinc-800 shrink-0 select-none">
        <button 
          onClick={() => setActiveTab('management')} 
          className={`pb-3 text-xs font-black transition-all relative ${activeTab === 'management' ? 'text-[var(--primary)]' : 'text-zinc-500 hover:text-black dark:hover:text-zinc-300'}`}
        >
          Coupons Ledger
          {activeTab === 'management' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--primary)] rounded-t-full"></div>}
        </button>
        <button 
          onClick={() => setActiveTab('performance')} 
          className={`pb-3 text-xs font-black transition-all relative ${activeTab === 'performance' ? 'text-[var(--primary)]' : 'text-zinc-500 hover:text-black dark:hover:text-zinc-300'}`}
        >
          Global Performance
          {activeTab === 'performance' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--primary)] rounded-t-full"></div>}
        </button>
      </div>

      {activeTab === 'management' ? (
        <>
          {/* 6 KPI Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 select-none">
            
            {/* Card 1: Active Coupons */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-808 p-3.5 rounded-2xl shadow-sm flex items-center justify-between h-[85px] hover:shadow-md transition-shadow">
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider leading-none">Active Coupons</span>
                <h3 className="text-lg font-black text-zinc-900 dark:text-white font-mono mt-1.5">
                  {loading && !error ? '...' : stats.activeCoupons}
                </h3>
              </div>
              <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl shrink-0">
                <CheckCircle2 size={16} />
              </div>
            </div>

            {/* Card 2: Expired Coupons */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-808 p-3.5 rounded-2xl shadow-sm flex items-center justify-between h-[85px] hover:shadow-md transition-shadow">
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider leading-none">Expired Coupons</span>
                <h3 className="text-lg font-black text-zinc-900 dark:text-white font-mono mt-1.5">
                  {loading && !error ? '...' : stats.expiredCoupons}
                </h3>
              </div>
              <div className="p-2 bg-rose-500/10 text-rose-500 rounded-xl shrink-0">
                <TimerOff size={16} />
              </div>
            </div>

            {/* Card 3: Total Redemptions */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-808 p-3.5 rounded-2xl shadow-sm flex items-center justify-between h-[85px] hover:shadow-md transition-shadow">
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider leading-none">Total Redemptions</span>
                <h3 className="text-lg font-black text-zinc-900 dark:text-white font-mono mt-1.5">
                  {loading && !error ? '...' : stats.totalRedemptions}
                </h3>
              </div>
              <div className="p-2 bg-[var(--primary)]/10 text-[var(--primary)] rounded-xl shrink-0">
                <Gift size={16} />
              </div>
            </div>

            {/* Card 4: Revenue Generated */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-808 p-3.5 rounded-2xl shadow-sm flex items-center justify-between h-[85px] hover:shadow-md transition-shadow">
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider leading-none">Revenue Generated</span>
                <h3 className="text-sm font-black text-zinc-900 dark:text-white font-mono mt-1.5 truncate" title={formatCurrency(stats.revenueGenerated)}>
                  {loading && !error ? '...' : formatCurrency(stats.revenueGenerated)}
                </h3>
              </div>
              <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl shrink-0">
                <CircleDollarSign size={16} />
              </div>
            </div>

            {/* Card 5: Average Discount */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-808 p-3.5 rounded-2xl shadow-sm flex items-center justify-between h-[85px] hover:shadow-md transition-shadow">
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider leading-none">Average Discount</span>
                <h3 className="text-sm font-black text-zinc-900 dark:text-white font-mono mt-1.5">
                  {loading && !error ? '...' : formatCurrency(stats.averageDiscount)}
                </h3>
              </div>
              <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl shrink-0">
                <Percent size={16} />
              </div>
            </div>

            {/* Card 6: Disabled Coupons */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-808 p-3.5 rounded-2xl shadow-sm flex items-center justify-between h-[85px] hover:shadow-md transition-shadow">
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider leading-none">Disabled Coupons</span>
                <h3 className="text-lg font-black text-zinc-900 dark:text-white font-mono mt-1.5">
                  {loading && !error ? '...' : stats.disabledCoupons}
                </h3>
              </div>
              <div className="p-2 bg-zinc-500/10 text-zinc-500 rounded-xl shrink-0">
                <EyeOff size={16} />
              </div>
            </div>

          </div>

          {/* Filtering & Table Panel Card */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden flex flex-col transition-all">
            
            {/* Filter Toggle Header bar */}
            <div className="p-4 border-b border-zinc-150 dark:border-zinc-800 flex flex-wrap justify-between items-center bg-zinc-50/50 dark:bg-zinc-950/20 gap-3 shrink-0 select-none">
              
              {/* Left View Toggles */}
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  className="flex items-center gap-1.5 text-xs font-bold text-[var(--primary)] hover:brightness-95 transition-all cursor-pointer"
                >
                  <Filter size={14} />
                  {filtersOpen ? 'Hide Filters' : 'Advanced Filters'}
                  <ChevronDown size={12} className={`transition-transform duration-250 ${filtersOpen ? 'rotate-180' : ''}`} />
                </button>

                <div className="h-4 w-[1px] bg-zinc-250 dark:bg-zinc-800"></div>

                {/* Display mode buttons */}
                <div className="flex bg-zinc-100 dark:bg-zinc-950 p-0.5 border border-zinc-205 dark:border-zinc-800 rounded-lg">
                  <button 
                    onClick={() => setViewMode('table')}
                    className={`p-1 rounded transition-all cursor-pointer ${viewMode === 'table' ? 'bg-white dark:bg-zinc-850 text-[var(--primary)] shadow-sm' : 'text-zinc-500 hover:text-zinc-800'}`}
                    title="Table View"
                  >
                    <Table size={13} />
                  </button>
                  <button 
                    onClick={() => setViewMode('cards')}
                    className={`p-1 rounded transition-all cursor-pointer ${viewMode === 'cards' ? 'bg-white dark:bg-zinc-850 text-[var(--primary)] shadow-sm' : 'text-zinc-500 hover:text-zinc-800'}`}
                    title="Cards View"
                  >
                    <LayoutGrid size={13} />
                  </button>
                </div>
              </div>

              {/* Right ledger actions */}
              <div className="flex items-center gap-2">
                
                {/* Column Visibility Popover */}
                {viewMode === 'table' && (
                  <div className="relative" ref={columnRef}>
                    <button 
                      onClick={() => setShowColumnDropdown(!showColumnDropdown)}
                      className="h-8 px-2.5 border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg text-[11px] font-bold text-zinc-700 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Columns size={12} />
                      Columns
                    </button>
                    {showColumnDropdown && (
                      <div className="absolute right-0 top-9 w-44 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-xl shadow-xl py-2 z-30 divide-y divide-zinc-100 dark:divide-zinc-850 animate-in fade-in duration-100 text-left text-[11px] font-bold">
                        <span className="block px-3 py-1 text-[9px] uppercase tracking-wider text-zinc-450 dark:text-zinc-500 select-none">Show/Hide Columns</span>
                        <div className="p-1 space-y-0.5">
                          {Object.entries(columnVisibility).map(([col, visible]) => (
                            <label key={col} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-zinc-50 dark:hover:bg-zinc-850 cursor-pointer">
                              <input 
                                type="checkbox"
                                checked={visible}
                                onChange={() => setColumnVisibility(prev => ({ ...prev, [col]: !prev[col] }))}
                                className="w-3 h-3 text-[var(--primary)] focus:ring-[var(--primary)] rounded cursor-pointer"
                              />
                              <span className="capitalize">{col === 'code' ? 'Coupon Code' : col === 'expiry' ? 'Expiry Date' : col}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Bulk Actions Button */}
                {selectedRowIds.length > 0 && (
                  <div className="relative" ref={bulkRef}>
                    <button
                      onClick={() => setShowBulkDropdown(!showBulkDropdown)}
                      className="h-8 px-2.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-lg text-[11px] font-black hover:bg-rose-500/20 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      Bulk Actions ({selectedRowIds.length})
                      <ChevronDown size={11} />
                    </button>
                    {showBulkDropdown && (
                      <div className="absolute right-0 top-9 w-44 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-xl shadow-xl py-1 z-30 divide-y divide-zinc-100 dark:divide-zinc-850 animate-in fade-in duration-100 text-left text-[11px] font-bold">
                        <button 
                          onClick={handleBulkDisable}
                          className="w-full px-3 py-2 text-zinc-700 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-850 flex items-center gap-2 cursor-pointer"
                        >
                          <EyeOff size={12} className="text-zinc-450" />
                          Disable Selected
                        </button>
                        <button 
                          onClick={handleBulkDelete}
                          className="w-full px-3 py-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 flex items-center gap-2 cursor-pointer"
                        >
                          <Trash2 size={12} />
                          Delete Selected
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* CSV Export */}
                <button
                  onClick={handleExportCSV}
                  className="h-8 px-2.5 border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg text-[11px] font-bold text-zinc-700 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Download size={12} />
                  Export CSV
                </button>
              </div>
            </div>

            {/* Collapsible Advanced Filters Section */}
            {filtersOpen && (
              <div className="p-5 border-b border-zinc-150 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-900/10 grid grid-cols-1 md:grid-cols-4 gap-4 animate-slide-down text-xs font-semibold select-none">
                
                {/* Search query */}
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-[10px] font-black text-zinc-450 uppercase tracking-widest">Search Coupon</label>
                  <input 
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Search by code, title, or description..."
                    className="w-full h-8.5 px-3 bg-white dark:bg-zinc-950 border border-zinc-205 dark:border-zinc-800 rounded-lg text-xs outline-none focus:border-[var(--primary)] text-black dark:text-white"
                  />
                </div>

                {/* Coupon Type */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-zinc-450 uppercase tracking-widest">Discount Type</label>
                  <select
                    value={filters.type}
                    onChange={(e) => {
                      setFilters(prev => ({ ...prev, type: e.target.value }));
                      setPagination(prev => ({ ...prev, page: 1 }));
                    }}
                    className="w-full h-8.5 px-2 bg-white dark:bg-zinc-955 border border-zinc-205 dark:border-zinc-800 rounded-lg text-xs outline-none focus:border-[var(--primary)] text-black dark:text-white cursor-pointer"
                  >
                    <option value="All">All Types</option>
                    <option value="Percentage">Percentage</option>
                    <option value="Flat Amount">Flat Amount</option>
                    <option value="Buy One Get One">BOGO</option>
                    <option value="Free Product">Free Product</option>
                  </select>
                </div>

                {/* Status */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-zinc-450 uppercase tracking-widest">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => {
                      setFilters(prev => ({ ...prev, status: e.target.value }));
                      setPagination(prev => ({ ...prev, page: 1 }));
                    }}
                    className="w-full h-8.5 px-2 bg-white dark:bg-zinc-955 border border-zinc-205 dark:border-zinc-800 rounded-lg text-xs outline-none focus:border-[var(--primary)] text-black dark:text-white cursor-pointer"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Disabled">Disabled</option>
                    <option value="Expired">Expired</option>
                  </select>
                </div>

                {/* Dates */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-zinc-450 uppercase tracking-widest">Start Date</label>
                  <input 
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => {
                      setFilters(prev => ({ ...prev, startDate: e.target.value }));
                      setPagination(prev => ({ ...prev, page: 1 }));
                    }}
                    className="w-full h-8.5 px-3 bg-white dark:bg-zinc-950 border border-zinc-205 dark:border-zinc-800 rounded-lg text-xs outline-none focus:border-[var(--primary)] text-black dark:text-white"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-zinc-450 uppercase tracking-widest">End Date</label>
                  <input 
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => {
                      setFilters(prev => ({ ...prev, endDate: e.target.value }));
                      setPagination(prev => ({ ...prev, page: 1 }));
                    }}
                    className="w-full h-8.5 px-3 bg-white dark:bg-zinc-955 border border-zinc-205 dark:border-zinc-800 rounded-lg text-xs outline-none focus:border-[var(--primary)] text-black dark:text-white"
                  />
                </div>

                {/* Region Multi-select block */}
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-[10px] font-black text-zinc-450 uppercase tracking-widest">Regions Targeting</label>
                  <div className="p-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 flex flex-wrap gap-3 max-h-[85px] overflow-y-auto">
                    {mockRegions.map(reg => {
                      const isChecked = filters.regionIds.includes(reg.id);
                      return (
                        <label key={reg.id} className="flex items-center gap-1.5 text-[10px] cursor-pointer">
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setFilters(prev => {
                                const list = prev.regionIds.includes(reg.id) 
                                  ? prev.regionIds.filter(id => id !== reg.id) 
                                  : [...prev.regionIds, reg.id];
                                return { ...prev, regionIds: list, zoneIds: [], storeIds: [] };
                              });
                              setPagination(prev => ({ ...prev, page: 1 }));
                            }}
                            className="w-3.5 h-3.5 text-[var(--primary)] rounded cursor-pointer"
                          />
                          <span>{reg.name.split(' (')[0]}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Zones Targeting */}
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-[10px] font-black text-zinc-450 uppercase tracking-widest">Zones ({filterZones.length} available)</label>
                  <div className="p-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 flex flex-wrap gap-3 max-h-[85px] overflow-y-auto">
                    {filterZones.map(zone => {
                      const isChecked = filters.zoneIds.includes(zone.id);
                      return (
                        <label key={zone.id} className="flex items-center gap-1.5 text-[10px] cursor-pointer">
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setFilters(prev => {
                                const list = prev.zoneIds.includes(zone.id) 
                                  ? prev.zoneIds.filter(id => id !== zone.id) 
                                  : [...prev.zoneIds, zone.id];
                                return { ...prev, zoneIds: list, storeIds: [] };
                              });
                              setPagination(prev => ({ ...prev, page: 1 }));
                            }}
                            className="w-3.5 h-3.5 text-[var(--primary)] rounded cursor-pointer"
                          />
                          <span>{zone.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Customer Segment Targeting */}
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-[10px] font-black text-zinc-450 uppercase tracking-widest">Customer Segment Targeting</label>
                  <div className="p-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 flex flex-wrap gap-4">
                    {['New Customers', 'Premium Users', 'Inactive Users'].map(seg => {
                      const isChecked = filters.customerSegments.includes(seg);
                      return (
                        <label key={seg} className="flex items-center gap-1.5 text-[10px] cursor-pointer">
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setFilters(prev => {
                                const list = prev.customerSegments.includes(seg) 
                                  ? prev.customerSegments.filter(item => item !== seg) 
                                  : [...prev, customerSegments, seg];
                                return { ...prev, customerSegments: list };
                              });
                              setPagination(prev => ({ ...prev, page: 1 }));
                            }}
                            className="w-3.5 h-3.5 text-[var(--primary)] rounded cursor-pointer"
                          />
                          <span>{seg}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex items-end justify-end md:col-span-2 gap-2 pb-0.5">
                  <button 
                    onClick={handleResetFilters}
                    className="text-zinc-500 hover:text-black dark:hover:text-white font-black text-xs px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                  >
                    Reset Filters
                  </button>
                  <button 
                    onClick={() => {
                      setFiltersOpen(false);
                      toast.success('Filters applied successfully.');
                    }}
                    className="bg-[var(--primary)] text-white font-extrabold text-xs px-4 py-1.5 rounded-lg shadow hover:bg-[var(--primary)]/90 transition-colors cursor-pointer"
                  >
                    Apply Filters
                  </button>
                </div>

              </div>
            )}

            {/* Error simulation banner */}
            {error && (
              <div className="p-8 text-center bg-rose-50 dark:bg-rose-950/20 border-b border-rose-100 dark:border-rose-900/30 flex flex-col items-center justify-center gap-3">
                <ShieldAlert size={32} className="text-rose-500 animate-bounce" />
                <h4 className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-wider">Coupons API ledger sync error</h4>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 max-w-sm leading-relaxed">{error}</p>
                <div className="flex gap-3 mt-2">
                  <button 
                    onClick={() => setSimulateError(false)} 
                    className="h-8.5 px-3 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 text-xs font-bold rounded-lg hover:bg-zinc-100 cursor-pointer"
                  >
                    Disable Test Error
                  </button>
                  <button 
                    onClick={() => setRetryTrigger(r => r + 1)} 
                    className="h-8.5 px-4 bg-[var(--primary)] text-white text-xs font-bold rounded-lg shadow hover:bg-[var(--primary)]/95 flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw size={13} />
                    Retry Sync
                  </button>
                </div>
              </div>
            )}

            {/* Loading Skeleton Ledger */}
            {loading && !error && (
              <div className="p-4 space-y-3">
                <div className="h-10 bg-zinc-100 dark:bg-zinc-800 rounded-xl w-full animate-pulse"></div>
                {[1, 2, 3, 4].map(row => (
                  <div key={row} className="flex justify-between items-center py-4 px-3 border-b border-zinc-100 dark:border-zinc-800 animate-pulse">
                    <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded w-20"></div>
                    <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded w-40"></div>
                    <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded w-16"></div>
                    <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded w-24"></div>
                    <div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded-full w-14"></div>
                    <div className="h-7 bg-zinc-200 dark:bg-zinc-800 rounded-lg w-7"></div>
                  </div>
                ))}
              </div>
            )}

            {/* Main view canvas */}
            {!loading && !error && (
              <div className="overflow-x-auto min-h-[220px]">
                {viewMode === 'table' ? (
                  <table className="w-full text-left text-xs divide-y divide-zinc-200 dark:divide-zinc-850">
                    <thead className="bg-zinc-50 dark:bg-zinc-950/40 text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest select-none sticky top-0 z-10">
                      <tr>
                        {/* Checkbox column */}
                        <th className="px-5 py-3 w-10">
                          <input 
                            type="checkbox"
                            checked={coupons.length > 0 && coupons.every(c => selectedRowIds.includes(c._id))}
                            onChange={handleSelectAllRows}
                            className="w-3.5 h-3.5 text-[var(--primary)] focus:ring-[var(--primary)] rounded cursor-pointer transition-all"
                          />
                        </th>
                        
                        {columnVisibility.code && (
                          <th className="px-5 py-3 cursor-pointer hover:text-[var(--primary)]" onClick={() => handleSortChange('code')}>
                            Coupon Code {getSortIcon('code')}
                          </th>
                        )}
                        {columnVisibility.title && (
                          <th className="px-5 py-3 cursor-pointer hover:text-[var(--primary)]" onClick={() => handleSortChange('title')}>
                            Title {getSortIcon('title')}
                          </th>
                        )}
                        {columnVisibility.type && (
                          <th className="px-5 py-3 cursor-pointer hover:text-[var(--primary)]" onClick={() => handleSortChange('couponType')}>
                            Type {getSortIcon('couponType')}
                          </th>
                        )}
                        {columnVisibility.discount && (
                          <th className="px-5 py-3 cursor-pointer hover:text-[var(--primary)] text-right" onClick={() => handleSortChange('value')}>
                            Discount {getSortIcon('value')}
                          </th>
                        )}
                        {columnVisibility.usage && (
                          <th className="px-5 py-3 cursor-pointer hover:text-[var(--primary)] text-right" onClick={() => handleSortChange('usageCount')}>
                            Usage {getSortIcon('usageCount')}
                          </th>
                        )}
                        {columnVisibility.revenue && (
                          <th className="px-5 py-3 cursor-pointer hover:text-[var(--primary)] text-right" onClick={() => handleSortChange('revenueGenerated')}>
                            Revenue Generated {getSortIcon('revenueGenerated')}
                          </th>
                        )}
                        {columnVisibility.expiry && (
                          <th className="px-5 py-3 cursor-pointer hover:text-[var(--primary)]" onClick={() => handleSortChange('endDate')}>
                            Expiry Date {getSortIcon('endDate')}
                          </th>
                        )}
                        {columnVisibility.status && (
                          <th className="px-5 py-3 cursor-pointer hover:text-[var(--primary)]" onClick={() => handleSortChange('status')}>
                            Status {getSortIcon('status')}
                          </th>
                        )}
                        {columnVisibility.actions && <th className="px-5 py-3 text-right">Actions</th>}
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850 bg-white dark:bg-zinc-900/40 text-black dark:text-white font-semibold">
                      {coupons.map((c) => {
                        const isSelected = selectedRowIds.includes(c._id);
                        const isExpired = new Date(c.endDate) < new Date();
                        
                        return (
                          <tr key={c._id} className={`hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10 group transition-all duration-150 ${isSelected ? 'bg-zinc-550/5 dark:bg-zinc-800/20' : ''}`}>
                            {/* Checkbox */}
                            <td className="px-5 py-3">
                              <input 
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleSelectRow(c._id)}
                                className="w-3.5 h-3.5 text-[var(--primary)] focus:ring-[var(--primary)] rounded cursor-pointer transition-all"
                              />
                            </td>

                            {/* Code */}
                            {columnVisibility.code && (
                              <td className="px-5 py-3.5 font-mono text-[10px] text-zinc-500 dark:text-zinc-400 font-extrabold uppercase select-all">
                                <span className="border border-zinc-200 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-950 px-2 py-0.5 rounded font-black tracking-wider">
                                  {c.code}
                                </span>
                              </td>
                            )}

                            {/* Title */}
                            {columnVisibility.title && (
                              <td className="px-5 py-3.5 text-zinc-900 dark:text-white font-extrabold max-w-[180px] truncate" title={c.title}>
                                {c.title}
                              </td>
                            )}

                            {/* Type */}
                            {columnVisibility.type && (
                              <td className="px-5 py-3.5">
                                <span className="text-[9.5px] font-bold text-zinc-550 dark:text-zinc-400">
                                  {c.couponType}
                                </span>
                              </td>
                            )}

                            {/* Discount */}
                            {columnVisibility.discount && (
                              <td className="px-5 py-3.5 text-right font-mono text-zinc-900 dark:text-white font-bold">
                                {c.couponType === 'Percentage' ? `${c.value}%` :
                                 c.couponType === 'Flat Amount' ? `₹${c.value}` : 
                                 c.couponType === 'Buy One Get One' ? 'BOGO' : `₹${c.value}`}
                              </td>
                            )}

                            {/* Usage */}
                            {columnVisibility.usage && (
                              <td className="px-5 py-3.5 text-right font-mono text-zinc-650 dark:text-zinc-400">
                                {c.usageCount} / <span className="text-zinc-400 font-normal">{c.usageLimit}</span>
                              </td>
                            )}

                            {/* Revenue */}
                            {columnVisibility.revenue && (
                              <td className="px-5 py-3.5 text-right font-mono text-zinc-900 dark:text-white font-black">
                                {formatCurrency(c.revenueGenerated)}
                              </td>
                            )}

                            {/* Expiry */}
                            {columnVisibility.expiry && (
                              <td className="px-5 py-3.5 text-[10.5px] text-zinc-400 dark:text-zinc-500 font-medium whitespace-nowrap">
                                {new Date(c.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </td>
                            )}

                            {/* Status */}
                            {columnVisibility.status && (
                              <td className="px-5 py-3.5">
                                <span className={`px-2.5 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider ${
                                  c.status === 'disabled' ? 'bg-zinc-100 text-zinc-650 dark:bg-zinc-800 dark:text-zinc-450 border border-zinc-200 dark:border-zinc-700' :
                                  isExpired || c.status === 'expired' ? 'bg-rose-500/10 text-rose-650 dark:text-rose-455 border border-rose-500/15' :
                                  'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15'
                                }`}>
                                  {isExpired && c.status !== 'disabled' ? 'Expired' : c.status}
                                </span>
                              </td>
                            )}

                            {/* Actions menu */}
                            {columnVisibility.actions && (
                              <td className="px-5 py-3.5 text-right relative">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMenuRowId(activeMenuRowId === c._id ? null : c._id);
                                    setSelectedCoupon(c);
                                  }}
                                  className="p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-500 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-850 cursor-pointer transition-colors"
                                >
                                  <MoreVertical size={13} />
                                </button>

                                {/* Dropdown Menu */}
                                {activeMenuRowId === c._id && (
                                  <div
                                    ref={menuRef}
                                    className="absolute right-6 top-10 w-40 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-xl shadow-xl py-1.5 z-30 divide-y divide-zinc-100 dark:divide-zinc-850 text-left text-[11px] font-bold"
                                  >
                                    <div className="py-0.5">
                                      <button 
                                        onClick={() => { setIsViewOpen(true); setActiveMenuRowId(null); }}
                                        className="w-full px-3 py-1.5 text-zinc-700 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2 cursor-pointer"
                                      >
                                        <Eye size={12} className="text-[var(--primary)]" />
                                        View Drawer
                                      </button>
                                      <button 
                                        onClick={() => { setIsEditOpen(true); setActiveMenuRowId(null); }}
                                        className="w-full px-3 py-1.5 text-zinc-700 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2 cursor-pointer"
                                      >
                                        <Edit size={12} className="text-zinc-500" />
                                        Edit Details
                                      </button>
                                      <button 
                                        onClick={() => { setIsCloneOpen(true); setActiveMenuRowId(null); }}
                                        className="w-full px-3 py-1.5 text-zinc-700 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2 cursor-pointer"
                                      >
                                        <Copy size={11} className="text-zinc-500" />
                                        Clone Coupon
                                      </button>
                                    </div>
                                    <div className="py-0.5">
                                      {c.status !== 'disabled' && (
                                        <button 
                                          onClick={() => { setIsDisableConfirmOpen(true); setActiveMenuRowId(null); }}
                                          className="w-full px-3 py-1.5 text-zinc-650 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 flex items-center gap-2 cursor-pointer"
                                        >
                                          <EyeOff size={11} className="text-zinc-450" />
                                          Disable Offer
                                        </button>
                                      )}
                                      <button 
                                        onClick={() => { setIsDeleteConfirmOpen(true); setActiveMenuRowId(null); }}
                                        className="w-full px-3 py-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 flex items-center gap-2 cursor-pointer"
                                      >
                                        <Trash2 size={12} />
                                        Delete Coupon
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </td>
                            )}
                          </tr>
                        );
                      })}

                      {coupons.length === 0 && (
                        <tr>
                          <td colSpan="10" className="px-5 py-12 text-center text-zinc-450 italic">
                            <AlertTriangle size={24} className="mx-auto text-zinc-350 mb-2" />
                            No coupons match your filter specifications.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                ) : (
                  // Cards View Layout
                  <div className="p-5">
                    <CouponList 
                      coupons={coupons}
                      onView={(c) => { setSelectedCoupon(c); setIsViewOpen(true); }}
                      onEdit={(c) => { setSelectedCoupon(c); setIsEditOpen(true); }}
                      onDelete={(c) => { setSelectedCoupon(c); setIsDeleteConfirmOpen(true); }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Server-Side Pagination Controller bar */}
            {!loading && !error && totalCount > 0 && (
              <div className="px-5 py-3.5 border-t border-zinc-150 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 text-xs font-bold flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0 select-none">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500">Page Limit:</span>
                  <select
                    value={pagination.limit}
                    onChange={(e) => {
                      setPagination({ page: 1, limit: Number(e.target.value) });
                      setSelectedRowIds([]);
                    }}
                    className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 px-2 py-0.5 rounded text-[11px] font-bold outline-none text-black dark:text-white cursor-pointer"
                  >
                    <option value={5}>5 records</option>
                    <option value={10}>10 records</option>
                    <option value={20}>20 records</option>
                  </select>
                  <span className="text-zinc-400 font-normal ml-2 font-mono">
                    Showing {Math.min((pagination.page - 1) * pagination.limit + 1, totalCount)} to {Math.min(pagination.page * pagination.limit, totalCount)} of {totalCount} coupons
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setPagination(p => ({ ...p, page: Math.max(1, p.page - 1) }));
                      setSelectedRowIds([]);
                    }}
                    disabled={pagination.page === 1}
                    className="px-2.5 py-1 border border-zinc-250 dark:border-zinc-805 bg-white dark:bg-zinc-900 text-zinc-750 dark:text-zinc-305 rounded hover:bg-zinc-50 dark:hover:bg-zinc-850 disabled:opacity-40 transition-colors flex items-center gap-0.5 cursor-pointer"
                  >
                    <ChevronLeft size={13} />
                    Prev
                  </button>

                  <span className="text-zinc-550 font-extrabold px-1 font-mono">
                    {pagination.page} / {totalPages}
                  </span>

                  <button
                    onClick={() => {
                      setPagination(p => ({ ...p, page: Math.min(totalPages, p.page + 1) }));
                      setSelectedRowIds([]);
                    }}
                    disabled={pagination.page >= totalPages}
                    className="px-2.5 py-1 border border-zinc-250 dark:border-zinc-805 bg-white dark:bg-zinc-900 text-zinc-750 dark:text-zinc-305 rounded hover:bg-zinc-50 dark:hover:bg-zinc-850 disabled:opacity-40 transition-colors flex items-center gap-0.5 cursor-pointer"
                  >
                    Next
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            )}

          </div>
        </>
      ) : (
        // Coupon Analysis View Tab
        <CouponAnalysis />
      )}

      {/* ============================================================= */}
      {/* MODALS & DRAWERS ATTACHMENTS */}
      {/* ============================================================= */}

      {/* 1. Create Coupon Modal */}
      <CreateCoupon
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => setRetryTrigger(r => r + 1)}
      />

      {/* 2. Edit Coupon Modal */}
      <EditCoupon
        isOpen={isEditOpen}
        onClose={() => { setIsEditOpen(false); setSelectedCoupon(null); }}
        coupon={selectedCoupon}
        onSuccess={() => setRetryTrigger(r => r + 1)}
      />

      {/* 3. Clone Coupon Modal */}
      <CloneCoupon
        isOpen={isCloneOpen}
        onClose={() => { setIsCloneOpen(false); setSelectedCoupon(null); }}
        coupon={selectedCoupon}
        onSuccess={() => setRetryTrigger(r => r + 1)}
      />

      {/* 4. View Drawer */}
      <CouponDetails
        isOpen={isViewOpen}
        onClose={() => { setIsViewOpen(false); setSelectedCoupon(null); }}
        coupon={selectedCoupon}
      />

      {/* 5. Disable Coupon Confirmation Dialog */}
      {isDisableConfirmOpen && selectedCoupon && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center lg:pl-[280px] p-4">
          <div className="bg-white dark:bg-zinc-950 w-full max-w-sm rounded-xl p-5 border border-zinc-250 dark:border-zinc-800 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-amber-500 mb-3 select-none">
              <EyeOff size={22} className="shrink-0" />
              <h4 className="text-sm font-black text-zinc-900 dark:text-white">Disable Coupon Offer</h4>
            </div>
            <p className="text-xs text-zinc-555 dark:text-zinc-400 font-semibold leading-relaxed">
              Are you sure you want to disable the coupon code <span className="font-mono font-black text-zinc-905 dark:text-white">"{selectedCoupon.code}"</span>? 
              This will suspend redemptions at POS and client apps immediately.
            </p>
            <div className="flex justify-end gap-2 mt-5 select-none">
              <button
                type="button"
                onClick={() => { setIsDisableConfirmOpen(false); setSelectedCoupon(null); }}
                className="h-8.5 px-3 border border-zinc-250 dark:border-zinc-805 bg-white dark:bg-zinc-900 text-zinc-750 dark:text-zinc-300 text-xs font-bold rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-850 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDisableCoupon}
                className="h-8.5 px-4 bg-zinc-500 hover:bg-zinc-600 text-white text-xs font-bold rounded-lg shadow transition-colors cursor-pointer"
              >
                Disable Coupon
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Delete Coupon Confirmation Danger Dialog */}
      {isDeleteConfirmOpen && selectedCoupon && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center lg:pl-[280px] p-4">
          <div className="bg-white dark:bg-zinc-955 w-full max-w-sm rounded-xl p-5 border border-zinc-250 dark:border-zinc-800 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-500 mb-3 select-none">
              <Trash2 size={22} className="shrink-0 animate-pulse" />
              <h4 className="text-sm font-black text-zinc-900 dark:text-white">Delete Coupon (Irreversible)</h4>
            </div>
            <p className="text-xs text-zinc-555 dark:text-zinc-400 font-semibold leading-relaxed">
              Deleting a coupon cannot be undone. This will permanently erase coupon code <span className="font-mono font-black text-zinc-900 dark:text-white">"{selectedCoupon.code}"</span> and its usages history logs from the database.
            </p>
            <div className="flex justify-end gap-2 mt-5 select-none">
              <button
                type="button"
                onClick={() => { setIsDeleteConfirmOpen(false); setSelectedCoupon(null); }}
                className="h-8.5 px-3 border border-zinc-250 dark:border-zinc-805 bg-white dark:bg-zinc-900 text-zinc-750 dark:text-zinc-300 text-xs font-bold rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-850 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteCoupon}
                className="h-8.5 px-4 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-lg shadow transition-colors cursor-pointer"
              >
                Delete Coupon
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
