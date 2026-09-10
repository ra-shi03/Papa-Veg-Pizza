// OrderTracking.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Truck, Radio, RefreshCw, ShoppingBag, Calendar, CheckCircle2, 
  XCircle, Clock, AlertTriangle, Filter, ChevronDown, Search, 
  Eye, ChevronLeft, ChevronRight, Compass, ShieldAlert, Landmark, 
  Store, User, ArrowUpDown
} from 'lucide-react';
import { toast } from 'sonner';

// Mock collections and APIs
import { 
  getKpiData, 
  getLiveOrders, 
  mockFranchises, 
  mockStores,
  mockDeliveryPartners,
  useDebounce 
} from './AllOrdersData';

// Reusable subcomponents
import TrackOrderDrawer from './components/TrackOrderDrawer';
import DelayAlertModal from './components/DelayAlertModal';
import RiderDetailsModal from './components/RiderDetailsModal';
import CustomerDetailsModal from './components/CustomerDetailsModal';
import PrintInvoiceModal from './components/PrintInvoiceModal';
import ViewOrderDrawer from './components/ViewOrderDrawer';

export default function OrderTracking() {
  // KPI stats state
  const [liveKpis, setLiveKpis] = useState({
    activeCount: 0, preparingCount: 0, packedCount: 0, 
    assignedCount: 0, transitCount: 0, delayedCount: 0
  });
  const [kpisLoading, setKpisLoading] = useState(true);

  // Table lists and pagination
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [tableLoading, setTableLoading] = useState(true);

  // Advanced filters state
  const [filters, setFilters] = useState({
    search: '',
    franchise: 'All',
    store: 'All',
    rider: 'All',
    orderStatus: 'All',
    delayedOnly: false
  });
  const [tempSearch, setTempSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Debouncing for search bar
  const debouncedSearch = useDebounce(tempSearch, 500);

  // Modals / Drawer visibility
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isTrackDrawerOpen, setIsTrackDrawerOpen] = useState(false);
  const [isDelayModalOpen, setIsDelayModalOpen] = useState(false);
  const [isRiderModalOpen, setIsRiderModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isFullDrawerOpen, setIsFullDrawerOpen] = useState(false);

  const [selectedRiderId, setSelectedRiderId] = useState(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);

  // Sync debounced search with filter parameters
  useEffect(() => {
    setFilters(prev => ({ ...prev, search: debouncedSearch }));
    setPage(1);
  }, [debouncedSearch]);

  // Load metrics and order dispatch logs
  useEffect(() => {
    loadLiveKpiStats();
  }, []);

  useEffect(() => {
    loadLiveOrdersTable();
  }, [filters, page, limit, sortBy, sortOrder]);

  // Simulated Delay Warning Auto-popup (Triggered once when delayed orders are loaded)
  useEffect(() => {
    if (orders.length > 0) {
      const delayedOrder = orders.find(o => o.delayMinutes > 10);
      if (delayedOrder) {
        const timer = setTimeout(() => {
          setSelectedOrder(delayedOrder);
          setIsDelayModalOpen(true);
          toast.warning(`CRITICAL DISPATCH DELAY: Order ${delayedOrder.orderNumber} is running late!`);
        }, 1500); // Popup after 1.5 seconds for visual effect
        return () => clearTimeout(timer);
      }
    }
  }, [orders]);

  const loadLiveKpiStats = async () => {
    setKpisLoading(true);
    try {
      const data = await getKpiData();
      // Calculate live preparation & delivery breakdown
      setLiveKpis({
        activeCount: data.pendingOrders, // Orders not completed/cancelled
        preparingCount: 2, // Mock preparing + baking
        packedCount: 1, // Mock packed count
        assignedCount: 1, // Mock assigned count
        transitCount: 1, // Mock out for delivery count
        delayedCount: 1  // Mock delayed order (ord-1001)
      });
    } catch (err) {
      toast.error('Failed to load live tracking statistics');
    } finally {
      setKpisLoading(false);
    }
  };

  const loadLiveOrdersTable = async () => {
    setTableLoading(true);
    try {
      const result = await getLiveOrders(filters, page, limit, sortBy, sortOrder);
      setOrders(result.orders);
      setTotal(result.total);
    } catch (err) {
      toast.error('Failed to load live tracking logs');
    } finally {
      setTableLoading(false);
    }
  };

  const handleRefresh = () => {
    loadLiveKpiStats();
    loadLiveOrdersTable();
    toast.success('Live tracking data refreshed via Socket.IO');
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      franchise: 'All',
      store: 'All',
      rider: 'All',
      orderStatus: 'All',
      delayedOnly: false
    });
    setTempSearch('');
    setPage(1);
    toast.success('Filters cleared successfully');
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

  // Helper status chips
  const getStatusStageChip = (status) => {
    const statusColors = {
      Placed: 'bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700',
      Confirmed: 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-900/30',
      Preparing: 'bg-orange-50 text-orange-705 border-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-900/30',
      Baking: 'bg-amber-50 text-amber-705 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/30',
      Packed: 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-900/30',
      Assigned: 'bg-teal-50 text-teal-700 border-teal-100 dark:bg-teal-900/20 dark:text-teal-400 dark:border-teal-900/30',
      'Out For Delivery': 'bg-blue-50 text-blue-705 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30',
      Delivered: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30',
      Cancelled: 'bg-red-50 text-red-700 border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30'
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${statusColors[status] || 'bg-zinc-100'}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${
          status === 'Out For Delivery' || status === 'Preparing' ? 'bg-orange-500 animate-pulse' :
          status === 'Delivered' ? 'bg-emerald-500' : 'bg-zinc-400'
        }`}></span>
        {status}
      </span>
    );
  };

  // Helper ETA color-coding
  const getEtaBadge = (order) => {
    let color = 'text-emerald-600 dark:text-emerald-400';
    if (order.delayMinutes > 10) {
      color = 'text-red-650 dark:text-red-400 font-extrabold';
    } else if (order.delayMinutes > 0) {
      color = 'text-amber-500 font-bold';
    }
    return (
      <span className={`font-mono text-xs font-bold ${color}`}>
        {order.eta || 'N/A'}
      </span>
    );
  };

  return (
    <div className="p-3 md:p-4 pb-12 max-w-7xl mx-auto bg-zinc-50 dark:bg-zinc-955 min-h-screen w-full space-y-4 select-none">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3 pt-2">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-extrabold text-black dark:text-white leading-tight">Live Dispatch Tracking Radar</h2>
            <span className="animate-pulse bg-red-500/10 text-red-655 text-[9px] font-black px-2 py-0.5 rounded-full border border-red-500/20 flex items-center gap-1">
              <Radio size={11} className="text-red-500" /> LIVE RADAR
            </span>
          </div>
          <p className="text-[10px] font-semibold text-zinc-500 mt-0.5">Real-time coordinates tracking, delay alert triggers, and logistics fleet cockpit.</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button 
            onClick={handleRefresh}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-[var(--primary)] text-white text-[11px] font-bold px-3 py-1.5 rounded-lg hover:opacity-90 shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <RefreshCw size={14} /> <span>Refresh Radar</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
        {/* KPI 1: Active Orders */}
        <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-205 dark:border-zinc-800 shadow-sm flex items-center justify-between hover:shadow-md transition-all">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] font-bold text-zinc-450 uppercase tracking-widest truncate">Active Tracks</span>
            {kpisLoading ? (
              <div className="h-5 w-8 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse mt-1"></div>
            ) : (
              <h3 className="text-base font-black text-zinc-900 dark:text-white mt-0.5">{liveKpis.activeCount}</h3>
            )}
          </div>
          <div className="p-1.5 rounded-md bg-[var(--primary)]/10 text-[var(--primary)] shrink-0 border border-[var(--primary)]/20">
            <ShoppingBag size={13} />
          </div>
        </div>

        {/* KPI 2: Preparing */}
        <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-205 dark:border-zinc-800 shadow-sm flex items-center justify-between hover:shadow-md transition-all">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] font-bold text-zinc-450 uppercase tracking-widest truncate">Preparing / Baking</span>
            {kpisLoading ? (
              <div className="h-5 w-8 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse mt-1"></div>
            ) : (
              <h3 className="text-base font-black text-zinc-900 dark:text-white mt-0.5 text-orange-500">{liveKpis.preparingCount}</h3>
            )}
          </div>
          <div className="p-1.5 rounded-md bg-orange-500/10 text-orange-600 shrink-0 border border-orange-500/20">
            <Calendar size={13} />
          </div>
        </div>

        {/* KPI 3: Packed */}
        <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-205 dark:border-zinc-800 shadow-sm flex items-center justify-between hover:shadow-md transition-all">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] font-bold text-zinc-450 uppercase tracking-widest truncate">Packed Orders</span>
            {kpisLoading ? (
              <div className="h-5 w-8 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse mt-1"></div>
            ) : (
              <h3 className="text-base font-black text-zinc-900 dark:text-white mt-0.5 text-purple-650">{liveKpis.packedCount}</h3>
            )}
          </div>
          <div className="p-1.5 rounded-md bg-purple-500/10 text-purple-600 shrink-0 border border-purple-500/20">
            <CheckCircle2 size={13} />
          </div>
        </div>

        {/* KPI 4: Assigned */}
        <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-205 dark:border-zinc-800 shadow-sm flex items-center justify-between hover:shadow-md transition-all">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] font-bold text-zinc-450 uppercase tracking-widest truncate">Rider Allocated</span>
            {kpisLoading ? (
              <div className="h-5 w-8 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse mt-1"></div>
            ) : (
              <h3 className="text-base font-black text-zinc-900 dark:text-white mt-0.5 text-teal-650">{liveKpis.assignedCount}</h3>
            )}
          </div>
          <div className="p-1.5 rounded-md bg-teal-500/10 text-teal-600 shrink-0 border border-teal-500/20">
            <Truck size={13} />
          </div>
        </div>

        {/* KPI 5: Out For Delivery */}
        <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-205 dark:border-zinc-800 shadow-sm flex items-center justify-between hover:shadow-md transition-all border-t-2 border-t-blue-500">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] font-bold text-zinc-450 uppercase tracking-widest truncate">Out for Delivery</span>
            {kpisLoading ? (
              <div className="h-5 w-8 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse mt-1"></div>
            ) : (
              <h3 className="text-base font-black text-blue-650 dark:text-blue-550 mt-0.5">{liveKpis.transitCount}</h3>
            )}
          </div>
          <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-600 shrink-0 border border-blue-500/20">
            <Compass size={13} />
          </div>
        </div>

        {/* KPI 6: Delayed Orders */}
        <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border-red-500/30 dark:border-red-900/50 shadow-sm flex items-center justify-between hover:shadow-md transition-all border-t-2 border-t-red-500 bg-red-500/5 dark:bg-red-950/10">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] font-bold text-red-500 uppercase tracking-widest truncate">Delayed Runs</span>
            {kpisLoading ? (
              <div className="h-5 w-8 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse mt-1"></div>
            ) : (
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-black text-red-650 dark:text-red-400 mt-0.5">{liveKpis.delayedCount}</h3>
                <span className="px-1 py-0.2 bg-red-600 text-white rounded text-[8px] font-bold animate-pulse">Late</span>
              </div>
            )}
          </div>
          <div className="p-1.5 rounded-md bg-red-600 text-white shrink-0 shadow shadow-red-500/20">
            <ShieldAlert size={13} />
          </div>
        </div>
      </section>

      {/* STICKY FILTER PANEL */}
      <section className="bg-white dark:bg-zinc-900 p-3.5 rounded-xl border border-zinc-205 dark:border-zinc-800 shadow-sm sticky top-14 z-30 space-y-3">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setShowFilters(!showFilters)}
        >
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-[var(--primary)]" />
            <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-50">Logistics Filter Console</h3>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-3 border-t border-zinc-150 dark:border-zinc-800 animate-in fade-in duration-200 select-none">
            
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
              <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Store Outlet</label>
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

            {/* Rider */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Allocated Rider</label>
              <select
                value={filters.rider}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, rider: e.target.value }));
                  setPage(1);
                }}
                className="w-full bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-lg h-9 px-2.5 text-xs text-zinc-800 dark:text-zinc-200 focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none font-bold"
              >
                <option value="All">All Riders</option>
                {mockDeliveryPartners.map(r => (
                  <option key={r._id} value={r._id}>{r.name}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Tracking Status</label>
              <select
                value={filters.orderStatus}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, orderStatus: e.target.value }));
                  setPage(1);
                }}
                className="w-full bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-lg h-9 px-2.5 text-xs text-zinc-800 dark:text-zinc-200 focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none font-bold"
              >
                <option value="All">All Statuses</option>
                <option value="Placed">Placed</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Preparing">Preparing</option>
                <option value="Baking">Baking</option>
                <option value="Packed">Packed</option>
                <option value="Assigned">Assigned</option>
                <option value="Out For Delivery">Out For Delivery</option>
              </select>
            </div>

            {/* Delayed Only */}
            <div className="flex flex-col gap-1 select-none">
              <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Telemetry Filter</label>
              <div className="flex items-center gap-2 h-9">
                <input 
                  type="checkbox"
                  id="delaySwitch"
                  checked={filters.delayedOnly}
                  onChange={(e) => {
                    setFilters(prev => ({ ...prev, delayedOnly: e.target.checked }));
                    setPage(1);
                  }}
                  className="w-4.5 h-4.5 rounded border-zinc-300 dark:border-zinc-705 text-[var(--primary)] focus:ring-[var(--primary)]"
                />
                <label htmlFor="delaySwitch" className="text-xs font-bold text-red-650 cursor-pointer">
                  Delayed Orders Only
                </label>
              </div>
            </div>

            {/* Action controls */}
            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={handleResetFilters}
                className="w-full h-9 border border-zinc-250 dark:border-zinc-805 text-zinc-750 dark:text-zinc-300 text-xs font-bold rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer"
              >
                Reset Search
              </button>
            </div>

          </div>
        )}
      </section>

      {/* Main Tracking List Table Card */}
      <section className="bg-white dark:bg-zinc-900 border border-zinc-205 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
        {/* Table header toolbar */}
        <div className="p-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-zinc-200 dark:border-zinc-800">
          <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-50">Active Deliveries cockpit</h3>
          
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" size={13} />
            <input 
              type="text"
              placeholder="Search active orders..."
              value={tempSearch}
              onChange={(e) => setTempSearch(e.target.value)}
              className="pl-8 pr-3 h-8.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-zinc-800 dark:text-zinc-200 focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none w-full transition-all font-semibold"
            />
          </div>
        </div>

        {/* Live Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead className="bg-zinc-50 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-3 py-2 font-bold text-[9px] text-zinc-455 uppercase tracking-widest">
                  <button 
                    onClick={() => handleSort('orderNumber')}
                    className="flex items-center gap-1.5 hover:text-zinc-850 cursor-pointer"
                  >
                    Order ID <ArrowUpDown size={11} />
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
                <th className="px-3 py-2 font-bold text-[9px] text-zinc-455 uppercase tracking-widest font-semibold">Store Outlet</th>
                <th className="px-3 py-2 font-bold text-[9px] text-zinc-455 uppercase tracking-widest text-center">Current Stage</th>
                <th className="px-3 py-2 font-bold text-[9px] text-zinc-455 uppercase tracking-widest">Allocated Rider</th>
                <th className="px-3 py-2 font-bold text-[9px] text-zinc-455 uppercase tracking-widest text-center">Live ETA</th>
                <th className="px-3 py-2 font-bold text-[9px] text-zinc-455 uppercase tracking-widest">Last Update</th>
                <th className="px-3 py-2 font-bold text-[9px] text-zinc-455 uppercase tracking-widest">Delay duration</th>
                <th className="px-3 py-2 font-bold text-[9px] text-zinc-455 uppercase tracking-widest text-center">Live Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {tableLoading ? (
                Array.from({ length: limit }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-3 py-2.5"><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-16"></div></td>
                    <td className="px-3 py-2.5"><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-24"></div></td>
                    <td className="px-3 py-2.5"><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-24"></div></td>
                    <td className="px-3 py-2.5 text-center"><div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded w-20 mx-auto"></div></td>
                    <td className="px-3 py-2.5"><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-20"></div></td>
                    <td className="px-3 py-2.5 text-center"><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-10 mx-auto"></div></td>
                    <td className="px-3 py-2.5"><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-16"></div></td>
                    <td className="px-3 py-2.5"><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-16"></div></td>
                    <td className="px-3 py-2.5 text-center"><div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded w-16 mx-auto"></div></td>
                  </tr>
                ))
              ) : orders.length > 0 ? (
                orders.map((order) => (
                  <tr key={order._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                    {/* Order ID */}
                    <td className="px-3 py-2.5 font-mono text-xs font-bold text-[var(--primary)]">
                      {order.orderNumber}
                    </td>

                    {/* Customer */}
                    <td className="px-3 py-2.5 text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      {order.customer?.name}
                    </td>

                    {/* Store Outlet */}
                    <td className="px-3 py-2.5 text-xs font-semibold text-zinc-805 dark:text-zinc-200">
                      {order.store?.name}
                    </td>

                    {/* Stage */}
                    <td className="px-3 py-2.5 text-center">
                      {getStatusStageChip(order.orderStatus)}
                    </td>

                    {/* Rider */}
                    <td className="px-3 py-2.5 text-xs font-bold text-zinc-800 dark:text-zinc-250">
                      {order.deliveryPartner?.name || 'Unassigned Rider'}
                    </td>

                    {/* ETA */}
                    <td className="px-3 py-2.5 text-center">
                      {getEtaBadge(order)}
                    </td>

                    {/* Last Update */}
                    <td className="px-3 py-2.5 text-xs text-zinc-450 font-semibold font-mono">
                      {new Date(order.gps?.timestamp || order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}
                    </td>

                    {/* Delay */}
                    <td className="px-3 py-2.5 text-xs">
                      {order.delayMinutes > 0 ? (
                        <span className="text-red-600 font-extrabold flex items-center gap-1">
                          <AlertTriangle size={12} /> {order.delayText}
                        </span>
                      ) : (
                        <span className="text-zinc-400 font-semibold">No Delay</span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="px-3 py-2.5 text-center">
                      <button 
                        onClick={() => { setSelectedOrder(order); setIsTrackDrawerOpen(true); }}
                        className="bg-[var(--primary)] text-white text-[10px] font-bold px-3 py-1 rounded shadow-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                      >
                        Track Live
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                /* Empty States */
                <tr>
                  <td colSpan="9" className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-zinc-400 select-none">
                      <Truck size={32} className="text-zinc-300 stroke-[1.5]" />
                      <p className="text-xs font-extrabold">No Active Dispatch Runs</p>
                      <p className="text-[10px] text-zinc-450 leading-relaxed max-w-[280px]">
                        There are currently no orders in preparation or delivery stages matching active filters.
                      </p>
                      <button 
                        onClick={handleResetFilters}
                        className="mt-2 text-[10px] font-bold px-3 py-1.5 bg-[var(--primary)] text-white rounded-lg shadow cursor-pointer"
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
          <span>Showing {orders.length > 0 ? (page - 1) * limit + 1 : 0} to {Math.min(page * limit, total)} of {total} tracking records</span>
          
          <div className="flex items-center gap-2">
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

      {/* TRACKING DRAWER (80% width) */}
      <TrackOrderDrawer 
        isOpen={isTrackDrawerOpen}
        onClose={() => { setIsTrackDrawerOpen(false); setSelectedOrder(null); }}
        orderId={selectedOrder?._id}
        onViewCustomer={(id) => { setSelectedCustomerId(id); setIsCustomerModalOpen(true); }}
        onViewRider={(id) => { setSelectedRiderId(id); setIsRiderModalOpen(true); }}
        onPrintInvoice={(order) => { setIsPrintModalOpen(true); }}
        onOpenDetails={(order) => { setIsFullDrawerOpen(true); }}
      />

      {/* DELAY ALERT MODAL */}
      <DelayAlertModal 
        isOpen={isDelayModalOpen}
        onClose={() => setIsDelayModalOpen(false)}
        order={selectedOrder}
        onActionComplete={handleRefresh}
      />

      {/* RIDER DETAILS MODAL */}
      <RiderDetailsModal 
        isOpen={isRiderModalOpen}
        onClose={() => { setIsRiderModalOpen(false); setSelectedRiderId(null); }}
        riderId={selectedRiderId}
      />

      {/* CUSTOMER DETAILS MODAL */}
      <CustomerDetailsModal 
        isOpen={isCustomerModalOpen}
        onClose={() => { setIsCustomerModalOpen(false); setSelectedCustomerId(null); }}
        customerId={selectedCustomerId}
      />

      {/* INVOICE PREVIEW MODAL */}
      <PrintInvoiceModal 
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        order={selectedOrder}
      />

      {/* VIEW ORDER PROFILE DRAWER (Reused All Orders Detail Drawer) */}
      <ViewOrderDrawer 
        isOpen={isFullDrawerOpen}
        onClose={() => setIsFullDrawerOpen(false)}
        orderId={selectedOrder?._id}
        onCancelClick={() => toast.info('Cancellation must be triggered from All Orders panel.')}
        onRefundClick={() => toast.info('Refunds must be triggered from All Orders panel.')}
        onTrackClick={() => setIsTrackDrawerOpen(true)}
        onPrintClick={() => setIsPrintModalOpen(true)}
      />

    </div>
  );
}
