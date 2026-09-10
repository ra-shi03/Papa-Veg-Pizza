import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  RefreshCw,
  Sparkles,
  DollarSign,
  ShoppingBag,
  Star,
  Activity,
  Filter,
  Calendar,
  MapPin,
  TrendingUp,
  TrendingDown,
  Percent,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Maximize2,
  Store,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';

import StoreDetailsModal from './components/StoreDetailsModal';
import CompareStoresModal from './components/CompareStoresModal';
import { Skeleton } from '../../../components/ui/skeleton';

import {
  useRegions,
  useZones,
  useTerritories,
  useFranchises,
  useStores,
  useStoreStats,
  useStoreRevenueComparison,
  useStoreOrdersVolume,
  useStoreRatingDistribution,
  useStorePrepTimeHeatmap,
  useStoreProfitComparison,
  useStoreAnalyticsTable
} from './hooks/useStoreAnalyticsQuery';

export default function StoreAnalytics() {
  // Master Filters State
  const [filters, setFilters] = useState({
    regionId: '',
    zoneId: '',
    territoryId: '',
    franchiseId: '',
    storeId: '',
    dateRange: 'Last 30 Days',
    startDate: '',
    endDate: ''
  });

  const [appliedFilters, setAppliedFilters] = useState({ ...filters });
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState({ key: 'revenue', dir: 'desc' });
  const [pagination, setPagination] = useState({ page: 1, limit: 5 });

  // Modal Dialog States
  const [selectedStoreId, setSelectedStoreId] = useState(null);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  // Debouncing Search Input by 600ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPagination(p => ({ ...p, page: 1 }));
    }, 600);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Load Filter Options
  const { data: regions } = useRegions();
  const { data: zones } = useZones(filters.regionId);
  const { data: territories } = useTerritories(filters.zoneId);
  const { data: franchises } = useFranchises();
  const { data: stores } = useStores();

  // Load Stats & Visuals (Updates when filters are applied)
  const { data: stats, loading: statsLoading, refetch: refetchStats } = useStoreStats(appliedFilters);
  const { data: revComp, loading: revCompLoading, refetch: refetchRev } = useStoreRevenueComparison(appliedFilters);
  
  const [orderInterval, setOrderInterval] = useState('monthly');
  const { data: orderVol, loading: orderVolLoading, refetch: refetchOrders } = useStoreOrdersVolume(appliedFilters, orderInterval);
  
  const { data: ratingsDist, loading: ratingsLoading, refetch: refetchRatings } = useStoreRatingDistribution(appliedFilters);
  const { data: prepHeatmap, loading: heatmapLoading, refetch: refetchHeatmap } = useStorePrepTimeHeatmap(appliedFilters);
  const { data: profitComp, loading: profitLoading, refetch: refetchProfit } = useStoreProfitComparison(appliedFilters);

  // Main Directory Table data
  const tableFilters = useMemo(() => ({
    ...appliedFilters,
    search: debouncedSearch,
    sortBy,
    status: appliedFilters.storeId ? '' : appliedFilters.status
  }), [appliedFilters, debouncedSearch, sortBy]);
  const { data: tableRows, total: tableTotal, loading: tableLoading, refetch: refetchTable } = useStoreAnalyticsTable(tableFilters, pagination);

  const totalPages = Math.max(Math.ceil(tableTotal / pagination.limit), 1);

  // Apply Filter Action
  const handleApplyFilters = () => {
    setAppliedFilters({ ...filters });
    setPagination(p => ({ ...p, page: 1 }));
    toast.success('Store analytics index updated');
  };

  // Reset Filter Action
  const handleResetFilters = () => {
    const reset = {
      regionId: '',
      zoneId: '',
      territoryId: '',
      franchiseId: '',
      storeId: '',
      dateRange: 'Last 30 Days',
      startDate: '',
      endDate: ''
    };
    setFilters(reset);
    setAppliedFilters(reset);
    setSearchQuery('');
    setDebouncedSearch('');
    setSortBy({ key: 'revenue', dir: 'desc' });
    setPagination({ page: 1, limit: 5 });
    toast.success('Filter parameters cleared');
  };

  const handleRefreshAll = () => {
    refetchStats();
    refetchRev();
    refetchOrders();
    refetchRatings();
    refetchHeatmap();
    refetchProfit();
    refetchTable();
    toast.success('Reloaded latest sales and operations feed');
  };

  const toggleSort = (key) => {
    setSortBy(prev => ({
      key,
      dir: prev.key === key && prev.dir === 'desc' ? 'asc' : 'desc'
    }));
    setPagination(p => ({ ...p, page: 1 }));
  };

  const getStatusBadge = (status) => {
    if (status?.toLowerCase() === 'active') {
      return 'bg-emerald-500/10 text-emerald-650 dark:text-emerald-450 border border-emerald-250/20';
    }
    return 'bg-rose-500/10 text-rose-650 dark:text-rose-455 border border-rose-250/20';
  };

  const formatRupee = (val) => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
    return `₹${val}`;
  };

  // Colors mapping for charts
  const primaryColor = 'var(--primary, #a43c12)';
  const secondaryColor = 'var(--secondary, #ff7f50)';
  const RATING_COLORS = ['#10b981', '#34d399', '#f59e0b', '#f97316', '#ef4444'];

  return (
    <div className="p-3 md:p-4 pb-12 max-w-[1600px] mx-auto bg-zinc-50 dark:bg-zinc-955 min-h-screen w-full space-y-4 animate-fade-in text-zinc-900 dark:text-zinc-100 font-semibold text-xs leading-normal">
      
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2.5 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-lg font-bold text-black dark:text-white flex items-center gap-2">
            <span>Store Performance Analytics</span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </h2>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5 font-bold">
            <Clock size={11.5} />
            Data updated 1m ago
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefreshAll}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-black/70 dark:text-white/70 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm cursor-pointer"
            title="Refresh All Visuals"
          >
            <RefreshCw size={14} className={tableLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* KPI Bento Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {statsLoading ? (
          Array.from({ length: 8 }).map((_, idx) => (
            <Skeleton key={idx} className="h-16 w-full rounded-xl" />
          ))
        ) : stats ? (
          [
            { title: 'Total Stores Registered', val: stats.totalStores, trend: stats.totalStoresTrend, prefix: '', suffix: ' stores', icon: Store, isLowerBest: false },
            { title: 'Active Stores', val: stats.activeStores, trend: stats.activeStoresTrend, prefix: '', suffix: ' stores', icon: CheckCircle, isLowerBest: false },
            { title: 'Closed Stores', val: stats.closedStores, trend: stats.closedStoresTrend, prefix: '', suffix: ' stores', icon: AlertTriangle, isLowerBest: true },
            { title: 'Top Store', val: stats.topPerformingStore, subVal: formatRupee(stats.topPerformingStoreRevenue), trend: stats.topPerformingStoreTrend, prefix: '', suffix: '', icon: DollarSign, isLowerBest: false },
            { title: 'Average Rating Score', val: stats.averageRating, trend: stats.averageRatingTrend, prefix: '', suffix: ' ★', icon: Star, isLowerBest: false },
            { title: 'Average Prep Time', val: stats.averagePrepTime, trend: stats.averagePrepTimeTrend, prefix: '', suffix: ' mins', icon: Clock, isLowerBest: true },
            { title: 'Cancellation Rate', val: stats.cancellationRate, trend: stats.cancellationRateTrend, prefix: '', suffix: '%', icon: Activity, isLowerBest: true },
            { title: 'Refund Rate Claims', val: stats.refundRate, trend: stats.refundRateTrend, prefix: '', suffix: '%', icon: RefreshCw, isLowerBest: true }
          ].map((k, idx) => {
            const Icon = k.icon;
            const isTrendUp = k.trend > 0;
            const isTrendPositive = k.isLowerBest ? !isTrendUp : isTrendUp;
            return (
              <div key={idx} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl shadow-sm hover:scale-[1.01] transition-transform">
                <div className="flex justify-between items-start">
                  <span className="text-[9px] font-black text-zinc-550 dark:text-zinc-450 uppercase tracking-wider leading-none">{k.title}</span>
                  <span className="p-1 bg-zinc-50 dark:bg-zinc-950 text-zinc-450 dark:text-zinc-500 rounded border border-zinc-100 dark:border-zinc-850 shrink-0"><Icon size={12} /></span>
                </div>
                <div className="mt-3 flex items-baseline gap-2 flex-wrap">
                  <h3 className="text-base font-black text-black dark:text-white leading-none">
                    {k.prefix}{k.val}{k.suffix}
                  </h3>
                  {k.subVal && (
                    <span className="text-[10px] text-zinc-500 font-extrabold">{k.subVal}</span>
                  )}
                  <span className={`text-[8.5px] font-extrabold px-1.5 py-0.2 rounded-full flex items-center gap-0.5 ${
                    isTrendPositive
                      ? 'bg-emerald-500/10 text-emerald-650 dark:text-emerald-450'
                      : 'bg-rose-500/10 text-rose-650 dark:text-rose-455'
                  }`}>
                    {isTrendUp ? <TrendingUp size={8.5} /> : <TrendingDown size={8.5} />}
                    {Math.abs(k.trend)}%
                  </span>
                </div>
                <p className="text-[8px] text-zinc-400 font-extrabold uppercase mt-1 tracking-wider">vs previous period</p>
              </div>
            );
          })
        ) : null}
      </div>

      {/* Visual Analytics Sections Grid */}
      <div className="grid grid-cols-12 gap-4">
        
        {/* Chart 1: Revenue Comparison */}
        <div className="col-span-12 lg:col-span-7 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm min-h-[300px] flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp size={14} className="text-[var(--primary)]" />
              Store Revenue Comparison
            </h3>
            <p className="text-[9px] text-zinc-400 font-semibold mt-0.5">Top performing store channels sorted by billing gross</p>
          </div>

          <div className="h-56 w-full mt-4">
            {revCompLoading ? (
              <Skeleton className="w-full h-full rounded" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revComp} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <XAxis dataKey="store" stroke="#a1a1aa" fontSize={8} tickLine={false} axisLine={false} />
                  <YAxis stroke="#a1a1aa" fontSize={8} tickLine={false} axisLine={false} tickFormatter={formatRupee} />
                  <RechartsTooltip formatter={(v, n, props) => {
                    const d = props.payload;
                    return [
                      `Revenue: ₹${d.revenue?.toLocaleString('en-IN')}`,
                      `Orders: ${d.orders}`,
                      `Profit: ₹${d.profit?.toLocaleString('en-IN')}`
                    ];
                  }} />
                  <Bar dataKey="revenue" fill="var(--primary, #a43c12)" radius={[3, 3, 0, 0]} maxBarSize={35}>
                    {revComp.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? 'var(--primary, #a43c12)' : 'var(--primary, #a43c12)cc'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 2: Order Volume Trend */}
        <div className="col-span-12 lg:col-span-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm min-h-[300px] flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h3 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingBag size={14} className="text-[var(--primary)]" />
                Order Volume Trend
              </h3>
              <p className="text-[9px] text-zinc-400 font-semibold mt-0.5">Fulfillment count metrics trend index</p>
            </div>

            <div className="flex bg-zinc-50 dark:bg-zinc-955 p-0.5 rounded-lg border border-zinc-250 dark:border-zinc-800 shrink-0">
              {['daily', 'weekly', 'monthly'].map((t) => (
                <button
                  key={t}
                  onClick={() => setOrderInterval(t)}
                  className={`px-2.5 py-1 text-[9px] font-bold rounded uppercase transition-all cursor-pointer ${
                    orderInterval === t
                      ? 'bg-white dark:bg-zinc-800 text-black dark:text-white shadow-sm font-black'
                      : 'text-zinc-500 hover:text-black dark:hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="h-56 w-full mt-4">
            {orderVolLoading ? (
              <Skeleton className="w-full h-full rounded" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={orderVol} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#a1a1aa" fontSize={8} tickLine={false} axisLine={false} />
                  <YAxis stroke="#a1a1aa" fontSize={8} tickLine={false} axisLine={false} />
                  <RechartsTooltip formatter={(v, n, props) => {
                    const d = props.payload;
                    return [
                      `Total: ${d.orders}`,
                      `Completed: ${d.completed}`,
                      `Cancelled: ${d.cancelled}`
                    ];
                  }} />
                  <Line type="monotone" dataKey="orders" stroke={primaryColor} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={1.5} strokeDasharray="3 3" dot={{ r: 1 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 3: Ratings Share */}
        <div className="col-span-12 md:col-span-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm min-h-[300px] flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Star size={14} className="text-yellow-500 fill-yellow-500/20" />
              Rating Distribution
            </h3>
            <p className="text-[9px] text-zinc-400 font-semibold mt-0.5">Guest feedback splits across active catalog</p>
          </div>

          <div className="h-44 w-full relative mt-4">
            {ratingsLoading ? (
              <Skeleton className="w-full h-full rounded-full" />
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={ratingsDist}
                      cx="50%"
                      cy="50%"
                      innerRadius={38}
                      outerRadius={58}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {ratingsDist?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={RATING_COLORS[index % RATING_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={v => `${v}%`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-sm font-black text-zinc-900 dark:text-zinc-50">Review</span>
                  <span className="text-[7px] text-zinc-450 font-bold uppercase tracking-wider">Metrics</span>
                </div>
              </>
            )}
          </div>

          <div className="w-full space-y-1 mt-2">
            {ratingsDist?.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-[9.5px] font-bold p-1 px-2 rounded bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-850/40">
                <div className="flex items-center gap-1.5 text-zinc-550 dark:text-zinc-350 truncate">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse" style={{ backgroundColor: RATING_COLORS[idx % RATING_COLORS.length] }}></span>
                  <span className="truncate">{item.name}</span>
                </div>
                <span className="text-black dark:text-white font-extrabold">{item.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 4: Preparation Time Analysis Heatmap */}
        <div className="col-span-12 md:col-span-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm min-h-[300px] flex flex-col justify-between">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div>
              <h3 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Clock size={14} className="text-[var(--primary)] animate-pulse" />
                Preparation Heatmap Analysis
              </h3>
              <p className="text-[9px] text-zinc-400 font-semibold mt-0.5">Oven-to-box duration indexes across peak timing frames</p>
            </div>

            <div className="flex items-center gap-1 text-[8.5px] text-zinc-400 font-bold bg-zinc-50 dark:bg-zinc-950 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800 shrink-0">
              <span>Fast (&lt;12m)</span>
              <div className="flex gap-0.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[var(--primary)] opacity-20"></span>
                <span className="w-2.5 h-2.5 rounded-sm bg-[var(--primary)] opacity-60"></span>
                <span className="w-2.5 h-2.5 rounded-sm bg-[var(--primary)] opacity-100"></span>
              </div>
              <span>Slow (&gt;25m)</span>
            </div>
          </div>

          <div className="h-56 w-full mt-4 overflow-x-auto scrollbar-thin">
            {heatmapLoading ? (
              <Skeleton className="w-full h-full rounded" />
            ) : (
              <div className="min-w-[560px] h-full flex flex-col justify-between pb-1.5">
                <div className="grid grid-cols-8 text-center text-[8.5px] font-black uppercase text-zinc-400 tracking-wider mb-1.5">
                  <div className="text-left pl-2">Store</div>
                  <div>10:00 AM</div>
                  <div>12:00 PM</div>
                  <div>02:00 PM</div>
                  <div>04:00 PM</div>
                  <div>06:00 PM</div>
                  <div>08:00 PM</div>
                  <div>10:00 PM</div>
                </div>

                <div className="space-y-1.5 flex-1 overflow-y-auto scrollbar-none">
                  {prepHeatmap?.map((s) => {
                    const cellHours = [
                      { key: 'h10', time: '10:00 AM' },
                      { key: 'h12', time: '12:00 PM' },
                      { key: 'h14', time: '02:00 PM' },
                      { key: 'h16', time: '04:00 PM' },
                      { key: 'h18', time: '06:00 PM' },
                      { key: 'h20', time: '08:00 PM' },
                      { key: 'h22', time: '10:00 PM' }
                    ];

                    return (
                      <div key={s.store} className="grid grid-cols-8 gap-1.5 items-center">
                        <div className="text-left font-extrabold text-[10px] text-zinc-700 dark:text-zinc-300 truncate pr-2 border-r border-zinc-200 dark:border-zinc-800 leading-tight" title={s.store}>
                          {s.store}
                        </div>
                        {cellHours.map(h => {
                          const val = s[h.key];
                          // Normalize opacity based on duration (10 to 30 mins scale)
                          const intensity = Math.min(Math.max(0.15, (val - 10) / 20), 1);
                          const isPeak = val >= 25;
                          return (
                            <div
                              key={h.key}
                              style={{ backgroundColor: `rgba(var(--primary-rgb, 164, 60, 18), ${intensity})` }}
                              className={`h-7 rounded flex items-center justify-center font-mono font-black text-white cursor-pointer transition-transform hover:scale-[1.05] relative group border border-transparent shadow-sm ${
                                isPeak ? 'border-amber-400 ring-1 ring-amber-450/40 shadow-md animate-pulse' : ''
                              }`}
                            >
                              <span>{val}m</span>
                              
                              {/* Hover Card */}
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block bg-zinc-900 border border-zinc-800 text-white text-[9px] p-2.5 rounded-lg shadow-2xl whitespace-nowrap z-20 font-bold">
                                <p className="text-[var(--primary)] font-extrabold">{s.store}</p>
                                <p className="text-zinc-350">Time Frame: {h.time}</p>
                                <p className="text-emerald-400 mt-0.5">Prep duration: {val} mins</p>
                                {isPeak && <p className="text-amber-400 flex items-center gap-0.5 mt-0.5">🔥 High Oven Load</p>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chart 5: Store-wise Profit */}
        <div className="col-span-12 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm min-h-[300px] flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign size={14} className="text-emerald-500 fill-emerald-500/10 shrink-0" />
              Store Profit Analysis
            </h3>
            <p className="text-[9px] text-zinc-400 font-semibold mt-0.5">Estimated net margins compiled across franchises</p>
          </div>

          <div className="h-56 w-full mt-4">
            {profitLoading ? (
              <Skeleton className="w-full h-full rounded" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={profitComp} layout="vertical" margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <XAxis type="number" stroke="#a1a1aa" fontSize={8} tickLine={false} axisLine={false} tickFormatter={formatRupee} />
                  <YAxis dataKey="store" type="category" stroke="#a1a1aa" fontSize={8} tickLine={false} axisLine={false} />
                  <RechartsTooltip formatter={(v, n, props) => [`₹${v.toLocaleString('en-IN')}`, `Profit Margin: ${props.payload.margin}%`]} />
                  <Bar dataKey="profit" fill="#10b981" radius={[0, 3, 3, 0]} maxBarSize={22}>
                    {profitComp.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#10b981cc'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* Sticky Filter Bar Container */}
      <div className="sticky top-[48px] z-30 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 shadow-sm space-y-2.5">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          {/* Region Dropdown */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-black text-zinc-400 uppercase tracking-wider">Region</label>
            <select
              className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 px-2 py-1 rounded-lg outline-none text-xs text-zinc-700 dark:text-zinc-300 font-extrabold cursor-pointer"
              value={filters.regionId}
              onChange={(e) => {
                setFilters(prev => ({ ...prev, regionId: e.target.value, zoneId: '', territoryId: '' }));
              }}
            >
              <option value="">All Regions</option>
              {regions?.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>

          {/* Zone Dropdown */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-black text-zinc-400 uppercase tracking-wider">Zone</label>
            <select
              className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 px-2 py-1 rounded-lg outline-none text-xs text-zinc-700 dark:text-zinc-300 font-extrabold cursor-pointer disabled:opacity-50"
              value={filters.zoneId}
              disabled={!filters.regionId}
              onChange={(e) => {
                setFilters(prev => ({ ...prev, zoneId: e.target.value, territoryId: '' }));
              }}
            >
              <option value="">All Zones</option>
              {zones?.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
            </select>
          </div>

          {/* Territory Dropdown */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-black text-zinc-400 uppercase tracking-wider">Territory</label>
            <select
              className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 px-2 py-1 rounded-lg outline-none text-xs text-zinc-700 dark:text-zinc-300 font-extrabold cursor-pointer disabled:opacity-50"
              value={filters.territoryId}
              disabled={!filters.zoneId}
              onChange={(e) => {
                setFilters(prev => ({ ...prev, territoryId: e.target.value }));
              }}
            >
              <option value="">All Territories</option>
              {territories?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          {/* Franchise Dropdown */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-black text-zinc-400 uppercase tracking-wider">Franchise</label>
            <select
              className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 px-2 py-1 rounded-lg outline-none text-xs text-zinc-700 dark:text-zinc-300 font-extrabold cursor-pointer"
              value={filters.franchiseId}
              onChange={(e) => {
                setFilters(prev => ({ ...prev, franchiseId: e.target.value }));
              }}
            >
              <option value="">All Franchises</option>
              {franchises?.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>

          {/* Store Dropdown */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-black text-zinc-400 uppercase tracking-wider">Store</label>
            <select
              className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 px-2 py-1 rounded-lg outline-none text-xs text-zinc-700 dark:text-zinc-300 font-extrabold cursor-pointer"
              value={filters.storeId}
              onChange={(e) => {
                setFilters(prev => ({ ...prev, storeId: e.target.value }));
              }}
            >
              <option value="">All Stores</option>
              {stores?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {/* Date Range Dropdown */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-black text-zinc-400 uppercase tracking-wider">Date Range</label>
            <select
              className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 px-2 py-1 rounded-lg outline-none text-xs text-zinc-700 dark:text-zinc-300 font-extrabold cursor-pointer"
              value={filters.dateRange}
              onChange={(e) => {
                setFilters(prev => ({ ...prev, dateRange: e.target.value }));
              }}
            >
              <option value="Today">Today</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="This Month">This Month</option>
              <option value="Custom">Custom</option>
            </select>
          </div>
        </div>

        {/* Custom Date Picker If Selected */}
        {filters.dateRange === 'Custom' && (
          <div className="flex items-center gap-2.5 p-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl max-w-sm animate-fade-down">
            <Calendar size={13} className="text-[var(--primary)] shrink-0" />
            <input
              type="date"
              className="bg-transparent border-none outline-none font-bold text-zinc-700 dark:text-zinc-300 w-full"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
            />
            <span className="text-zinc-400">-</span>
            <input
              type="date"
              className="bg-transparent border-none outline-none font-bold text-zinc-700 dark:text-zinc-300 w-full"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
            />
          </div>
        )}

        {/* Action Buttons Row */}
        <div className="flex justify-between items-center border-t border-zinc-200 dark:border-zinc-800 pt-2.5 flex-wrap gap-2">
          <div className="flex gap-2">
            <button
              onClick={handleResetFilters}
              className="px-3.5 py-1.5 text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 border border-zinc-250 dark:border-zinc-700 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer font-extrabold"
            >
              Reset Filters
            </button>
            <button
              onClick={handleApplyFilters}
              className="px-4 py-1.5 bg-[var(--primary)] text-white rounded-lg hover:opacity-90 transition-opacity font-extrabold shadow flex items-center gap-1 cursor-pointer"
            >
              <Filter size={12} />
              Apply Filters
            </button>
          </div>

          <button
            onClick={() => setIsCompareOpen(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-zinc-950 hover:bg-zinc-850 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white rounded-lg transition-colors cursor-pointer border border-zinc-850 shadow font-extrabold"
          >
            <Sparkles size={12} className="text-yellow-405 animate-pulse shrink-0" />
            Compare Stores
          </button>
        </div>
      </div>

      {/* Store Directory Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden flex flex-col justify-between">
        
        {/* Table Head Filters */}
        <div className="p-3.5 border-b border-zinc-150 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-950/20 flex-wrap gap-2.5">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2 text-zinc-450" size={13} />
            <input
              type="text"
              placeholder="Search store, franchise or ID..."
              className="w-full text-xs pl-8 pr-3 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-black dark:text-white focus:outline-none focus:border-[var(--primary)] font-semibold"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <span className="text-[10px] text-zinc-450 font-bold uppercase">Store index: {tableTotal} records found</span>
        </div>

        {/* Directory Table */}
        {tableLoading ? (
          <div className="p-12 space-y-3">
            <Skeleton className="h-8 w-full rounded" />
            <Skeleton className="h-8 w-full rounded" />
            <Skeleton className="h-8 w-full rounded" />
          </div>
        ) : (
          <table className="w-full text-left text-xs divide-y divide-zinc-200 dark:divide-zinc-800">
            <thead className="bg-zinc-50/20 dark:bg-zinc-950/30 text-zinc-500 font-bold uppercase tracking-wider text-[9px] select-none">
              <tr>
                <th className="px-4 py-3 cursor-pointer hover:text-black dark:hover:text-white" onClick={() => toggleSort('id')}>
                  <div className="flex items-center gap-1">Store ID <ArrowUpDown size={11} /></div>
                </th>
                <th className="px-4 py-3 cursor-pointer hover:text-black dark:hover:text-white" onClick={() => toggleSort('name')}>
                  <div className="flex items-center gap-1">Store Name <ArrowUpDown size={11} /></div>
                </th>
                <th className="px-4 py-3 cursor-pointer hover:text-black dark:hover:text-white" onClick={() => toggleSort('franchise')}>
                  <div className="flex items-center gap-1">Franchise Owner <ArrowUpDown size={11} /></div>
                </th>
                <th className="px-4 py-3 text-right cursor-pointer hover:text-black dark:hover:text-white" onClick={() => toggleSort('orders')}>
                  <div className="flex items-center justify-end gap-1">Orders Count <ArrowUpDown size={11} /></div>
                </th>
                <th className="px-4 py-3 text-right cursor-pointer hover:text-black dark:hover:text-white" onClick={() => toggleSort('revenue')}>
                  <div className="flex items-center justify-end gap-1">Gross Revenue <ArrowUpDown size={11} /></div>
                </th>
                <th className="px-4 py-3 text-center cursor-pointer hover:text-black dark:hover:text-white" onClick={() => toggleSort('rating')}>
                  <div className="flex items-center justify-center gap-1">Rating <ArrowUpDown size={11} /></div>
                </th>
                <th className="px-4 py-3 text-right cursor-pointer hover:text-black dark:hover:text-white" onClick={() => toggleSort('avgPrepTime')}>
                  <div className="flex items-center justify-end gap-1">Avg Prep Time <ArrowUpDown size={11} /></div>
                </th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850 font-semibold text-zinc-800 dark:text-zinc-200">
              {tableRows?.map((row) => (
                <tr key={row.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/10 transition-colors">
                  <td className="px-4 py-3 font-mono text-[10px] text-zinc-500 dark:text-zinc-405">{row.id}</td>
                  <td className="px-4 py-3 font-extrabold">{row.name}</td>
                  <td className="px-4 py-3 text-zinc-450">{row.franchise}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold">{row.orders.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-500">{formatRupee(row.revenue)}</td>
                  <td className="px-4 py-3 text-center text-yellow-500 font-bold">
                    <div className="flex items-center justify-center gap-1">
                      <Star size={11} className="fill-yellow-500" />
                      <span>{row.rating}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold">{row.avgPrepTime} mins</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[8.5px] font-extrabold uppercase border ${getStatusBadge(row.status)}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelectedStoreId(row.id)}
                      className="px-2.5 py-1 bg-zinc-950 dark:bg-zinc-800 hover:bg-[var(--primary)] hover:dark:bg-[var(--primary)] text-white text-[10px] rounded border border-zinc-850 hover:border-transparent uppercase font-bold transition-all flex items-center gap-1 ml-auto cursor-pointer shadow active:scale-95"
                    >
                      <Maximize2 size={11} />
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
              {(!tableRows || tableRows.length === 0) && (
                <tr>
                  <td colSpan="9" className="px-4 py-12 text-center text-zinc-400 italic">
                    <div className="max-w-md mx-auto space-y-2">
                      <p className="font-extrabold text-sm text-black dark:text-white">No Store Records Found</p>
                      <p className="text-zinc-500">No store analytics available for selected filters.</p>
                      <button
                        onClick={handleResetFilters}
                        className="px-4 py-1 bg-[var(--primary)] text-white rounded font-bold text-xs uppercase cursor-pointer"
                      >
                        Reset Filter
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {/* Paginated Footer */}
        <div className="p-3 border-t border-zinc-150 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-950/20 text-[10px] font-bold shrink-0">
          <span className="text-zinc-450">Page {pagination.page} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPagination(p => ({ ...p, page: Math.max(1, p.page - 1) }))}
              disabled={pagination.page <= 1 || tableLoading}
              className="p-1 border border-zinc-250 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setPagination(p => ({ ...p, page: Math.min(totalPages, p.page + 1) }))}
              disabled={pagination.page >= totalPages || tableLoading}
              className="p-1 border border-zinc-250 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

      </div>

      {/* MODAL DIALOG COMPONENT TRIGGERS */}
      <StoreDetailsModal
        isOpen={!!selectedStoreId}
        onClose={() => setSelectedStoreId(null)}
        storeId={selectedStoreId}
      />

      <CompareStoresModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
      />

    </div>
  );
}
