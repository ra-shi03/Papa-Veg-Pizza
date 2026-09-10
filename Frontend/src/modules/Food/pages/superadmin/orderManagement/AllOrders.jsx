// AllOrders.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Download, RefreshCw, ShoppingCart, Calendar, CheckCircle2, 
  XCircle, CreditCard, IndianRupee, Hourglass, Filter, 
  ChevronDown, Search, Eye, ChevronLeft, ChevronRight, 
  ArrowRight, Landmark, Store, MapPin, Truck, HelpCircle, ArrowUpDown
} from 'lucide-react';
import { toast } from 'sonner';

// Data and simulated APIs
import { 
  getKpiData, 
  getOrders, 
  mockFranchises, 
  mockStores,
  useDebounce 
} from './AllOrdersData';

// Submodal components
import ViewOrderDrawer from './components/ViewOrderDrawer';
import TrackOrderModal from './components/TrackOrderModal';
import CancelOrderModal from './components/CancelOrderModal';
import InitiateRefundModal from './components/InitiateRefundModal';
import PrintInvoiceModal from './components/PrintInvoiceModal';
import ExportModal from './components/ExportModal';

export default function AllOrders() {
  // UI states
  const [showFilters, setShowFilters] = useState(false);
  const [kpiData, setKpiData] = useState({
    totalOrders: 0, todayOrders: 0, completedOrders: 0, 
    pendingOrders: 0, cancelledOrders: 0, refundedOrders: 0, 
    aov: 0, totalRevenue: 0
  });
  const [kpisLoading, setKpisLoading] = useState(true);

  // Table states
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [tableLoading, setTableLoading] = useState(true);

  // Filter fields
  const [filters, setFilters] = useState({
    search: '',
    franchise: 'All',
    store: 'All',
    city: 'All',
    orderType: 'All',
    paymentMethod: 'All',
    paymentStatus: 'All',
    orderStatus: 'All',
    fromDate: '',
    toDate: ''
  });
  const [tempSearch, setTempSearch] = useState('');

  // Debouncing for search field
  const debouncedSearch = useDebounce(tempSearch, 500);

  // Modals state
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isTrackOpen, setIsTrackOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isRefundOpen, setIsRefundOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Sync debounced search with filters state
  useEffect(() => {
    setFilters(prev => ({ ...prev, search: debouncedSearch }));
    setPage(1); // Reset page on search
  }, [debouncedSearch]);

  // Load KPI stats and orders
  useEffect(() => {
    loadKpiStats();
  }, []);

  useEffect(() => {
    loadOrdersList();
  }, [filters, page, limit, sortBy, sortOrder]);

  const loadKpiStats = async () => {
    setKpisLoading(true);
    try {
      const data = await getKpiData();
      setKpiData(data);
    } catch (err) {
      toast.error('Failed to load KPI stats');
    } finally {
      setKpisLoading(false);
    }
  };

  const loadOrdersList = async () => {
    setTableLoading(true);
    try {
      const result = await getOrders(filters, page, limit, sortBy, sortOrder);
      setOrders(result.orders);
      setTotal(result.total);
    } catch (err) {
      toast.error('Failed to fetch orders list');
    } finally {
      setTableLoading(false);
    }
  };

  const handleRefreshAll = () => {
    loadKpiStats();
    loadOrdersList();
    toast.success('Dashboard metrics refreshed');
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      franchise: 'All',
      store: 'All',
      city: 'All',
      orderType: 'All',
      paymentMethod: 'All',
      paymentStatus: 'All',
      orderStatus: 'All',
      fromDate: '',
      toDate: ''
    });
    setTempSearch('');
    setPage(1);
    toast.success('Filters reset successfully');
  };

  // Callback on successful action execution (cancelling/refunding)
  const handleActionSuccess = (message) => {
    toast.success(message);
    loadKpiStats();
    loadOrdersList();
    if (isDrawerOpen && selectedOrder) {
      // Re-fetch drawer details if active
      setSelectedOrder({ ...selectedOrder }); 
    }
  };

  // Helper for status chips in Table
  const getOrderStatusChip = (status) => {
    const chipStyles = {
      Placed: 'bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700',
      Confirmed: 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-900/30',
      Preparing: 'bg-orange-50 text-orange-705 border-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-900/30',
      Baking: 'bg-amber-50 text-amber-705 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/30',
      Packed: 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-900/30',
      Assigned: 'bg-teal-50 text-teal-700 border-teal-100 dark:bg-teal-900/20 dark:text-teal-400 dark:border-teal-900/30',
      'Out For Delivery': 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30',
      Delivered: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30',
      Cancelled: 'bg-red-50 text-red-700 border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30'
    };

    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold ${chipStyles[status] || ''}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${
          status === 'Delivered' ? 'bg-emerald-500' :
          status === 'Cancelled' ? 'bg-red-500' :
          status === 'Out For Delivery' || status === 'Preparing' ? 'bg-orange-500 animate-pulse' : 'bg-zinc-400'
        }`}></span>
        {status}
      </span>
    );
  };

  const getPaymentStatusBadge = (status) => {
    const badgeColors = {
      Paid: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30',
      Pending: 'bg-yellow-50 text-yellow-750 border-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900/30',
      Failed: 'bg-red-50 text-red-700 border-red-100 dark:bg-red-950/20 dark:text-red-450 dark:border-red-900/30',
      Refunded: 'bg-blue-50 text-blue-705 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30'
    };
    return (
      <span className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[9px] font-extrabold uppercase tracking-wide ${badgeColors[status] || ''}`}>
        {status}
      </span>
    );
  };

  // Helper lists derived from static configs
  const cities = useMemo(() => {
    const c = new Set(mockFranchises.map(f => f.city));
    return ['All', ...Array.from(c)];
  }, []);

  return (
    <div className="p-3 md:p-4 pb-12 max-w-7xl mx-auto bg-zinc-50 dark:bg-zinc-955 min-h-screen w-full space-y-4 select-none">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3 pt-2">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-extrabold text-black dark:text-white leading-tight">All Platform Orders</h2>
            <button 
              onClick={handleRefreshAll}
              title="Refresh Page Metrics"
              className="p-1 hover:bg-zinc-150 dark:hover:bg-zinc-800 rounded-full text-zinc-500 cursor-pointer transition-colors"
            >
              <RefreshCw size={13} />
            </button>
          </div>
          <p className="text-[10px] font-semibold text-zinc-500 mt-0.5">Central Hub: Monitor, filter, and settle orders across stores in real-time.</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button 
            onClick={() => setIsExportOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 text-[11px] font-bold px-3 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors shadow-sm cursor-pointer"
          >
            <Download size={14} /> <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3 mb-4">
        {/* KPI 1: Total Orders */}
        <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-205 dark:border-zinc-800 shadow-sm flex items-center justify-between transition-shadow hover:shadow-md">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest truncate">Total Orders</span>
            {kpisLoading ? (
              <div className="h-5 w-12 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse mt-1"></div>
            ) : (
              <h3 className="text-base font-black text-zinc-900 dark:text-white mt-0.5">{kpiData.totalOrders}</h3>
            )}
          </div>
          <div className="p-1.5 rounded-md bg-[var(--primary)]/10 text-[var(--primary)] shrink-0 border border-[var(--primary)]/20">
            <ShoppingCart size={13} />
          </div>
        </div>

        {/* KPI 2: Today's Orders */}
        <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-205 dark:border-zinc-800 shadow-sm flex items-center justify-between transition-shadow hover:shadow-md">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest truncate">Today's Orders</span>
            {kpisLoading ? (
              <div className="h-5 w-12 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse mt-1"></div>
            ) : (
              <h3 className="text-base font-black text-zinc-900 dark:text-white mt-0.5">{kpiData.todayOrders}</h3>
            )}
          </div>
          <div className="p-1.5 rounded-md bg-[var(--primary)]/10 text-[var(--primary)] shrink-0 border border-[var(--primary)]/20">
            <Calendar size={13} />
          </div>
        </div>

        {/* KPI 3: Completed Orders */}
        <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-205 dark:border-zinc-800 shadow-sm flex items-center justify-between transition-shadow hover:shadow-md border-t-2 border-t-emerald-500">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest truncate">Completed</span>
            {kpisLoading ? (
              <div className="h-5 w-12 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse mt-1"></div>
            ) : (
              <h3 className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{kpiData.completedOrders}</h3>
            )}
          </div>
          <div className="p-1.5 rounded-md bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 shrink-0 border border-emerald-100 dark:border-emerald-900/20">
            <CheckCircle2 size={13} />
          </div>
        </div>

        {/* KPI 4: Pending Orders */}
        <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-205 dark:border-zinc-800 shadow-sm flex items-center justify-between transition-shadow hover:shadow-md border-t-2 border-t-amber-500">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest truncate">Pending</span>
            {kpisLoading ? (
              <div className="h-5 w-12 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse mt-1"></div>
            ) : (
              <h3 className="text-base font-black text-amber-550 dark:text-amber-400 mt-0.5">{kpiData.pendingOrders}</h3>
            )}
          </div>
          <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0 border border-amber-100 dark:border-amber-900/30">
            <Hourglass size={13} className="animate-pulse" />
          </div>
        </div>

        {/* KPI 5: Cancelled Orders */}
        <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-205 dark:border-zinc-800 shadow-sm flex items-center justify-between transition-shadow hover:shadow-md border-t-2 border-t-red-500">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest truncate">Cancelled</span>
            {kpisLoading ? (
              <div className="h-5 w-12 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse mt-1"></div>
            ) : (
              <h3 className="text-base font-black text-red-650 dark:text-red-400 mt-0.5">{kpiData.cancelledOrders}</h3>
            )}
          </div>
          <div className="p-1.5 rounded-md bg-red-500/10 text-red-600 shrink-0 border border-red-100 dark:border-red-900/30">
            <XCircle size={13} />
          </div>
        </div>

        {/* KPI 6: Refunded Orders */}
        <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-205 dark:border-zinc-800 shadow-sm flex items-center justify-between transition-shadow hover:shadow-md border-t-2 border-t-blue-500">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest truncate">Refunded</span>
            {kpisLoading ? (
              <div className="h-5 w-12 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse mt-1"></div>
            ) : (
              <h3 className="text-base font-black text-blue-600 dark:text-blue-400 mt-0.5">{kpiData.refundedOrders}</h3>
            )}
          </div>
          <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-605 shrink-0 border border-blue-100 dark:border-blue-900/30">
            <CreditCard size={13} />
          </div>
        </div>

        {/* KPI 7: Average Order Value */}
        <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-205 dark:border-zinc-800 shadow-sm flex items-center justify-between transition-shadow hover:shadow-md">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest truncate">Avg Order Val</span>
            {kpisLoading ? (
              <div className="h-5 w-16 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse mt-1"></div>
            ) : (
              <h3 className="text-base font-black text-zinc-900 dark:text-white mt-0.5 font-mono">₹{kpiData.aov}</h3>
            )}
          </div>
          <div className="p-1.5 rounded-md bg-[var(--primary)]/10 text-[var(--primary)] shrink-0 border border-[var(--primary)]/20">
            <IndianRupee size={13} />
          </div>
        </div>

        {/* KPI 8: Total Revenue */}
        <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-205 dark:border-zinc-800 shadow-sm flex items-center justify-between transition-shadow hover:shadow-md border-t-2 border-t-[var(--primary)]">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest truncate">Total Revenue</span>
            {kpisLoading ? (
              <div className="h-5 w-20 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse mt-1"></div>
            ) : (
              <h3 className="text-base font-black text-[var(--primary)] mt-0.5 font-mono">₹{kpiData.totalRevenue.toLocaleString('en-IN')}</h3>
            )}
          </div>
          <div className="p-1.5 rounded-md bg-[var(--primary)]/10 text-[var(--primary)] shrink-0 border border-[var(--primary)]/20">
            <IndianRupee size={13} />
          </div>
        </div>
      </section>

      {/* STICKY FILTER SECTION */}
      <section className="bg-white dark:bg-zinc-900 p-3.5 rounded-xl border border-zinc-205 dark:border-zinc-800 shadow-sm sticky top-14 z-30 space-y-3">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setShowFilters(!showFilters)}
        >
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-[var(--primary)]" />
            <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-50">Filter Controls</h3>
            {/* Active filters badge */}
            <span className="px-2 py-0.2 bg-zinc-100 dark:bg-zinc-850 text-[9px] rounded-full text-zinc-500 font-bold">
              Toggle Panel
            </span>
          </div>
          <ChevronDown 
            size={14} 
            className={`text-zinc-450 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} 
          />
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 pt-3 border-t border-zinc-150 dark:border-zinc-800 animate-in fade-in duration-200 select-none">
            
            {/* Franchise */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Franchise Group</label>
              <select
                value={filters.franchise}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, franchise: e.target.value, store: 'All' }));
                  setPage(1);
                }}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg h-9 px-2.5 text-xs text-zinc-800 dark:text-zinc-200 focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none font-bold"
              >
                <option value="All">All Franchises</option>
                {mockFranchises.map(f => (
                  <option key={f._id} value={f._id}>{f.name}</option>
                ))}
              </select>
            </div>

            {/* Store */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Pizza Store Outlet</label>
              <select
                value={filters.store}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, store: e.target.value }));
                  setPage(1);
                }}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg h-9 px-2.5 text-xs text-zinc-800 dark:text-zinc-200 focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none font-bold"
              >
                <option value="All">All Stores</option>
                {mockStores
                  .filter(s => filters.franchise === 'All' || s.franchiseId === filters.franchise)
                  .map(s => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))
                }
              </select>
            </div>

            {/* City */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">City Scope</label>
              <select
                value={filters.city}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, city: e.target.value }));
                  setPage(1);
                }}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg h-9 px-2.5 text-xs text-zinc-800 dark:text-zinc-200 focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none font-bold"
              >
                {cities.map(city => (
                  <option key={city} value={city}>{city === 'All' ? 'All Cities' : city}</option>
                ))}
              </select>
            </div>

            {/* Order Type */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Order Type</label>
              <select
                value={filters.orderType}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, orderType: e.target.value }));
                  setPage(1);
                }}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg h-9 px-2.5 text-xs text-zinc-800 dark:text-zinc-200 focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none font-bold"
              >
                <option value="All">All Types</option>
                <option value="Delivery">Delivery</option>
                <option value="Pickup">Pickup / Takeaway</option>
              </select>
            </div>

            {/* Payment Method */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Payment Method</label>
              <select
                value={filters.paymentMethod}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, paymentMethod: e.target.value }));
                  setPage(1);
                }}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg h-9 px-2.5 text-xs text-zinc-800 dark:text-zinc-200 focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none font-bold"
              >
                <option value="All">All Methods</option>
                <option value="UPI">UPI Payment</option>
                <option value="Card">Credit/Debit Card</option>
                <option value="Cash">Cash On Delivery</option>
                <option value="Wallet">Digital Wallet</option>
              </select>
            </div>

            {/* Payment Status */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Payment Status</label>
              <select
                value={filters.paymentStatus}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, paymentStatus: e.target.value }));
                  setPage(1);
                }}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg h-9 px-2.5 text-xs text-zinc-800 dark:text-zinc-200 focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none font-bold"
              >
                <option value="All">All Payment Statuses</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Failed">Failed</option>
                <option value="Refunded">Refunded</option>
              </select>
            </div>

            {/* Order Status */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Order Status</label>
              <select
                value={filters.orderStatus}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, orderStatus: e.target.value }));
                  setPage(1);
                }}
                className="w-full bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-lg h-9 px-2.5 text-xs text-zinc-800 dark:text-zinc-200 focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none font-bold"
              >
                <option value="All">All Order Statuses</option>
                <option value="Placed">Placed</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Preparing">Preparing</option>
                <option value="Baking">Baking</option>
                <option value="Packed">Packed</option>
                <option value="Assigned">Assigned</option>
                <option value="Out For Delivery">Out For Delivery</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            {/* Date Range: From */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">From Date</label>
              <input
                type="date"
                value={filters.fromDate}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, fromDate: e.target.value }));
                  setPage(1);
                }}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg h-9 px-2.5 text-xs text-zinc-800 dark:text-zinc-200 focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none font-bold"
              />
            </div>

            {/* Date Range: To */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">To Date</label>
              <input
                type="date"
                value={filters.toDate}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, toDate: e.target.value }));
                  setPage(1);
                }}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg h-9 px-2.5 text-xs text-zinc-800 dark:text-zinc-200 focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none font-bold"
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-end gap-2 sm:col-span-2 md:col-span-3 lg:col-span-1">
              <button
                type="button"
                onClick={handleResetFilters}
                className="w-full h-9 border border-zinc-250 dark:border-zinc-805 text-zinc-750 dark:text-zinc-300 text-xs font-bold rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            </div>

          </div>
        )}
      </section>

      {/* Main Table Card */}
      <section className="bg-white dark:bg-zinc-900 border border-zinc-205 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
        {/* Table Toolbar */}
        <div className="p-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-zinc-200 dark:border-zinc-800">
          <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-50">Order Database Records</h3>
          
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" size={13} />
            <input 
              type="text"
              placeholder="Search ID, Client or Phone..."
              value={tempSearch}
              onChange={(e) => setTempSearch(e.target.value)}
              className="pl-8 pr-3 h-8.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-zinc-800 dark:text-zinc-200 focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none w-full transition-all font-semibold"
            />
          </div>
        </div>

        {/* Server-side Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="bg-zinc-50 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800 sticky top-0">
              <tr>
                <th className="px-3 py-2 font-bold text-[9px] text-zinc-450 uppercase tracking-widest">
                  <button 
                    onClick={() => handleSort('orderNumber')}
                    className="flex items-center gap-1.5 hover:text-zinc-850 cursor-pointer"
                  >
                    Order ID <ArrowUpDown size={11} />
                  </button>
                </th>
                <th className="px-3 py-2 font-bold text-[9px] text-zinc-455 uppercase tracking-widest">
                  <button 
                    onClick={() => handleSort('createdAt')}
                    className="flex items-center gap-1.5 hover:text-zinc-850 cursor-pointer"
                  >
                    Date & Time <ArrowUpDown size={11} />
                  </button>
                </th>
                <th className="px-3 py-2 font-bold text-[9px] text-zinc-455 uppercase tracking-widest">
                  <button 
                    onClick={() => handleSort('customerName')}
                    className="flex items-center gap-1.5 hover:text-zinc-850 cursor-pointer"
                  >
                    Customer <ArrowUpDown size={11} />
                  </button>
                </th>
                <th className="px-3 py-2 font-bold text-[9px] text-zinc-455 uppercase tracking-widest">Phone</th>
                <th className="px-3 py-2 font-bold text-[9px] text-zinc-455 uppercase tracking-widest">
                  <button 
                    onClick={() => handleSort('storeName')}
                    className="flex items-center gap-1.5 hover:text-zinc-850 cursor-pointer"
                  >
                    Store Outlet <ArrowUpDown size={11} />
                  </button>
                </th>
                <th className="px-3 py-2 font-bold text-[9px] text-zinc-455 uppercase tracking-widest">Franchise</th>
                <th className="px-3 py-2 font-bold text-[9px] text-zinc-455 uppercase tracking-widest text-center">Items</th>
                <th className="px-3 py-2 font-bold text-[9px] text-zinc-455 uppercase tracking-widest text-right">Grand Total</th>
                <th className="px-3 py-2 font-bold text-[9px] text-zinc-455 uppercase tracking-widest text-center">Payment Status</th>
                <th className="px-3 py-2 font-bold text-[9px] text-zinc-455 uppercase tracking-widest text-center">Order Status</th>
                <th className="px-3 py-2 font-bold text-[9px] text-zinc-455 uppercase tracking-widest">Rider Courier</th>
                <th className="px-3 py-2 font-bold text-[9px] text-zinc-455 uppercase tracking-widest">ETA</th>
                <th className="px-3 py-2 font-bold text-[9px] text-zinc-455 uppercase tracking-widest text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {tableLoading ? (
                /* Skeleton rows */
                Array.from({ length: limit }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-3 py-2"><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-14"></div></td>
                    <td className="px-3 py-2"><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-20"></div></td>
                    <td className="px-3 py-2"><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-24"></div></td>
                    <td className="px-3 py-2"><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-18"></div></td>
                    <td className="px-3 py-2"><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-24"></div></td>
                    <td className="px-3 py-2"><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-20"></div></td>
                    <td className="px-3 py-2 text-center"><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-6 mx-auto"></div></td>
                    <td className="px-3 py-2 text-right"><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-12 ml-auto"></div></td>
                    <td className="px-3 py-2 text-center"><div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded w-16 mx-auto"></div></td>
                    <td className="px-3 py-2 text-center"><div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded w-20 mx-auto"></div></td>
                    <td className="px-3 py-2"><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-16"></div></td>
                    <td className="px-3 py-2"><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-12"></div></td>
                    <td className="px-3 py-2 text-center"><div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded w-8 mx-auto"></div></td>
                  </tr>
                ))
              ) : orders.length > 0 ? (
                orders.map((order) => (
                  <tr key={order._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors group">
                    {/* Order ID */}
                    <td className="px-3 py-2 font-mono text-xs font-bold">
                      <button 
                        onClick={() => { setSelectedOrder(order); setIsDrawerOpen(true); }}
                        className="text-[var(--primary)] hover:underline cursor-pointer"
                      >
                        {order.orderNumber}
                      </button>
                    </td>
                    
                    {/* Date & Time */}
                    <td className="px-3 py-2 text-xs text-zinc-550 dark:text-zinc-400 font-semibold whitespace-nowrap">
                      {new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </td>

                    {/* Customer */}
                    <td className="px-3 py-2 text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      {order.customer?.name}
                    </td>

                    {/* Phone */}
                    <td className="px-3 py-2 text-xs text-zinc-500 font-semibold font-mono">
                      {order.customer?.phone}
                    </td>

                    {/* Store Outlet */}
                    <td className="px-3 py-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200 whitespace-nowrap">
                      {order.store?.name}
                    </td>

                    {/* Franchise */}
                    <td className="px-3 py-2 text-xs text-zinc-500 font-semibold">
                      {order.franchise?.name}
                    </td>

                    {/* Items Count */}
                    <td className="px-3 py-2 text-xs font-mono font-bold text-center">
                      {order.itemsCount}
                    </td>

                    {/* Grand Total */}
                    <td className="px-3 py-2 text-xs font-mono font-bold text-zinc-900 dark:text-zinc-50 text-right">
                      ₹{order.grandTotal.toFixed(2)}
                    </td>

                    {/* Payment Status */}
                    <td className="px-3 py-2 text-center">
                      {getPaymentStatusBadge(order.paymentStatus)}
                    </td>

                    {/* Order Status */}
                    <td className="px-3 py-2 text-center">
                      {getOrderStatusChip(order.orderStatus)}
                    </td>

                    {/* Rider Partner */}
                    <td className="px-3 py-2 text-xs text-zinc-550 dark:text-zinc-400 font-semibold">
                      {order.deliveryPartner?.name || (order.orderType === 'Pickup' ? 'Takeaway' : 'Unassigned')}
                    </td>

                    {/* ETA */}
                    <td className="px-3 py-2 text-xs text-orange-500 font-bold font-mono">
                      {order.orderStatus === 'Delivered' ? 'Delivered' : order.orderStatus === 'Cancelled' ? 'N/A' : order.eta}
                    </td>

                    {/* Actions dropdown quick triggers */}
                    <td className="px-3 py-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button 
                          onClick={() => { setSelectedOrder(order); setIsDrawerOpen(true); }}
                          title="View Complete Details"
                          className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors text-zinc-450 hover:text-[var(--primary)] cursor-pointer"
                        >
                          <Eye size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                /* Empty state */
                <tr>
                  <td colSpan="13" className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-zinc-400 select-none">
                      <HelpCircle size={32} className="text-zinc-300 stroke-[1.5]" />
                      <p className="text-xs font-extrabold">No Orders Found</p>
                      <p className="text-[10px] text-zinc-450 leading-relaxed max-w-[280px]">
                        No platform records match the active query parameters or search phrases.
                      </p>
                      <button 
                        onClick={handleResetFilters}
                        className="mt-2 text-[10px] font-bold px-3 py-1.5 bg-[var(--primary)] text-white rounded-lg shadow cursor-pointer hover:opacity-90 active:scale-95 transition-all"
                      >
                        Reset Search Filters
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination */}
        <div className="px-3.5 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-[11px] font-semibold text-zinc-500">
          <span>Showing {orders.length > 0 ? (page - 1) * limit + 1 : 0} to {Math.min(page * limit, total)} of {total} orders</span>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span>Rows per page:</span>
              <select 
                value={limit} 
                onChange={(e) => { setLimit(parseInt(e.target.value)); setPage(1); }}
                className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded px-1.5 py-0.5 text-xs text-zinc-700 dark:text-zinc-200 font-bold focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 ml-2">
              <button 
                disabled={page === 1}
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                className="w-6.5 h-6.5 flex items-center justify-center rounded border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-150 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <ChevronLeft size={13} />
              </button>
              <span className="text-zinc-800 dark:text-zinc-200 font-bold px-1">Page {page} of {Math.max(1, Math.ceil(total / limit))}</span>
              <button 
                disabled={page >= Math.ceil(total / limit)}
                onClick={() => setPage(prev => Math.min(prev + 1, Math.ceil(total / limit)))}
                className="w-6.5 h-6.5 flex items-center justify-center rounded border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-150 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* RENDER VIEW DRAWER */}
      <ViewOrderDrawer 
        isOpen={isDrawerOpen}
        onClose={() => { setIsDrawerOpen(false); setSelectedOrder(null); }}
        orderId={selectedOrder?._id}
        onCancelClick={(order) => { setIsCancelOpen(true); }}
        onRefundClick={(order) => { setIsRefundOpen(true); }}
        onTrackClick={(order) => { setIsTrackOpen(true); }}
        onPrintClick={(order) => { setIsPrintOpen(true); }}
      />

      {/* RENDER SUBMODALS */}
      {/* 1. Track Order Modal */}
      <TrackOrderModal 
        isOpen={isTrackOpen}
        onClose={() => setIsTrackOpen(false)}
        orderId={selectedOrder?._id}
      />

      {/* 2. Cancel Order Modal */}
      <CancelOrderModal 
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        order={selectedOrder}
        onSuccess={handleActionSuccess}
      />

      {/* 3. Initiate Refund Modal */}
      <InitiateRefundModal 
        isOpen={isRefundOpen}
        onClose={() => setIsRefundOpen(false)}
        order={selectedOrder}
        onSuccess={handleActionSuccess}
      />

      {/* 4. Print Invoice Preview Modal */}
      <PrintInvoiceModal 
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        order={selectedOrder}
      />

      {/* 5. Export Report Modal */}
      <ExportModal 
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        activeFilters={filters}
      />

    </div>
  );
}
