import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  RefreshCw,
  Sparkles,
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
  Plus,
  Bike,
  AlertTriangle,
  Award,
  DollarSign,
  Compass,
  ArrowUpDown,
  UserCheck
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
  Cell,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';

import { Skeleton } from '../../../components/ui/skeleton';
import RiderDetailsModal from './components/RiderDetailsModal';
import CreateIncentiveModal from './components/CreateIncentiveModal';

import {
  useDeliveryStats,
  useDeliveryTimeTrend,
  useRiderPerformance,
  useEarningsDistribution,
  useAcceptanceRate,
  useDistanceAnalysis,
  useDeliveryTable,
  useRegions,
  useZones,
  useFranchises,
  useStores
} from './hooks/useDeliveryAnalyticsQuery';

export default function DeliveryAnalytics() {
  // Master Filters State
  const [filters, setFilters] = useState({
    regionId: '',
    zoneId: '',
    franchiseId: '',
    storeId: '',
    vehicleType: '',
    status: '',
    dateRange: 'Last 30 Days',
    startDate: '',
    endDate: ''
  });

  const [appliedFilters, setAppliedFilters] = useState({ ...filters });
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState({ key: 'orders', dir: 'desc' });
  const [pagination, setPagination] = useState({ page: 1, limit: 5 });
  const [timeTrendInterval, setTimeTrendInterval] = useState('daily');

  // Modals States
  const [selectedRiderId, setSelectedRiderId] = useState(null);
  const [isIncentiveOpen, setIsIncentiveOpen] = useState(false);

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
  const { data: franchises } = useFranchises();
  const { data: stores } = useStores();

  // Combined Filters for Table (includes search & sorting)
  const tableFilters = useMemo(() => ({
    ...appliedFilters,
    search: debouncedSearch,
    sortBy,
    vehicleType: appliedFilters.vehicleType || undefined,
    status: appliedFilters.status || undefined
  }), [appliedFilters, debouncedSearch, sortBy]);

  // Queries
  const { data: stats, loading: statsLoading, refetch: refetchStats } = useDeliveryStats(appliedFilters);
  const { data: trendData, loading: trendLoading, refetch: refetchTrend } = useDeliveryTimeTrend(appliedFilters, timeTrendInterval);
  const { data: performanceData, loading: perfLoading, refetch: refetchPerf } = useRiderPerformance(appliedFilters);
  const { data: earningsData, loading: earningsLoading, refetch: refetchEarnings } = useEarningsDistribution(appliedFilters);
  const { data: acceptanceData, loading: acceptanceLoading, refetch: refetchAcceptance } = useAcceptanceRate(appliedFilters);
  const { data: distanceData, loading: distanceLoading, refetch: refetchDistance } = useDistanceAnalysis(appliedFilters);
  const { data: tableData, total: tableTotal, loading: tableLoading, refetch: refetchTable } = useDeliveryTable(tableFilters, pagination);

  // Sync refresh trigger
  const handleApplyFilters = () => {
    setAppliedFilters({ ...filters });
    setPagination(p => ({ ...p, page: 1 }));
    toast.success('Delivery intelligence filters synchronized');
  };

  const handleResetFilters = () => {
    const freshFilters = {
      regionId: '',
      zoneId: '',
      franchiseId: '',
      storeId: '',
      vehicleType: '',
      status: '',
      dateRange: 'Last 30 Days',
      startDate: '',
      endDate: ''
    };
    setFilters(freshFilters);
    setAppliedFilters(freshFilters);
    setSearchQuery('');
    setDebouncedSearch('');
    setPagination({ page: 1, limit: 5 });
    toast.success('Delivery filter attributes reset');
  };

  const handleReloadAll = () => {
    refetchStats();
    refetchTrend();
    refetchPerf();
    refetchEarnings();
    refetchAcceptance();
    refetchDistance();
    refetchTable();
    toast.success('Reloaded latest delivery analytics metrics');
  };

  const handleSelectChange = (key, value) => {
    const updatedFilters = { ...filters, [key]: value };
    if (key === 'regionId') {
      updatedFilters.zoneId = '';
    }
    setFilters(updatedFilters);
  };

  const toggleSort = (key) => {
    setSortBy(prev => ({
      key,
      dir: prev.key === key && prev.dir === 'desc' ? 'asc' : 'desc'
    }));
    setPagination(p => ({ ...p, page: 1 }));
  };

  // Curated Sleek HSL Colors for Charts
  const COLORS = ['#a43c12', '#ff7f50', '#f59e0b', '#10b981', '#6366f1', '#8b5cf6'];

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'online':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
      case 'busy':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
      case 'offline':
        return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-zinc-200 dark:border-zinc-700';
      default:
        return 'bg-rose-500/10 text-rose-600 border border-rose-250/20';
    }
  };

  const getTrendColor = (val, reverse = false) => {
    if (val === 0) return 'text-zinc-400';
    const isPositive = val > 0;
    const isGood = reverse ? !isPositive : isPositive;
    return isGood ? 'text-emerald-500' : 'text-rose-500';
  };

  return (
    <div className="p-3 md:p-4 pb-12 max-w-7xl mx-auto bg-zinc-50 dark:bg-zinc-950 min-h-screen w-full space-y-4 animate-fade-in text-zinc-900 dark:text-zinc-100">
      
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-lg font-bold text-black dark:text-white flex items-center gap-2">
            <span>Delivery Fleet Performance Analytics</span>
            <span className="animate-pulse bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-emerald-500/20">
              Live Feed
            </span>
          </h2>
          <p className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5">
            <Clock size={11} />
            Database updated 2m ago
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => setIsIncentiveOpen(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-3 py-1.5 bg-[var(--primary)] hover:opacity-90 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer transition-opacity"
          >
            <Plus size={14} />
            Create Incentive
          </button>
          <button
            onClick={handleReloadAll}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-black/70 dark:text-white/70 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm cursor-pointer"
            title="Reload metrics"
          >
            <RefreshCw size={14} className={statsLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>



      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3.5">
        {[
          { title: 'Total Riders', val: stats?.totalRiders, trend: stats?.totalRidersTrend, suffix: '', icon: Bike, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/20' },
          { title: 'Online Riders', val: stats?.onlineRiders, trend: stats?.onlineRidersTrend, suffix: '', icon: UserCheck, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' },
          { title: 'Busy Riders', val: stats?.busyRiders, trend: stats?.busyRidersTrend, suffix: '', icon: Activity, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20' },
          { title: 'Avg Time Taken', val: stats?.averageDeliveryTime, trend: stats?.averageDeliveryTimeTrend, suffix: ' mins', reverse: true, icon: Clock, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20' },
          { title: 'Acceptance Rate', val: stats?.acceptanceRate, trend: stats?.acceptanceRateTrend, suffix: '%', icon: Percent, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20' },
          { title: 'Completion Rate', val: stats?.completionRate, trend: stats?.completionRateTrend, suffix: '%', icon: Award, color: 'text-teal-500 bg-teal-50 dark:bg-teal-950/20' },
          { title: 'Cancelled Orders', val: stats?.cancelledDeliveries, trend: stats?.cancelledDeliveriesTrend, suffix: '', reverse: true, icon: AlertTriangle, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/20' },
          { title: 'Customer Rating', val: stats?.customerRating, trend: stats?.customerRatingTrend, suffix: ' ★', icon: Star, color: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-950/20' }
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl shadow-sm hover:scale-[1.01] transition-transform">
              <div className="flex justify-between items-start">
                <span className="text-[9px] font-bold text-zinc-550 dark:text-zinc-450 uppercase tracking-wider leading-none">{kpi.title}</span>
                <span className={`p-1 rounded shrink-0 ${kpi.color}`}><Icon size={12} /></span>
              </div>
              {statsLoading ? (
                <div className="space-y-1 mt-3">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-3 w-10" />
                </div>
              ) : (
                <>
                  <h3 className="text-sm font-black text-black dark:text-white mt-3 leading-none">
                    {kpi.val !== undefined && kpi.val !== null ? `${kpi.val}${kpi.suffix}` : 'N/A'}
                  </h3>
                  <div className={`flex items-center gap-0.5 text-[9px] font-extrabold mt-1.5 ${getTrendColor(kpi.trend, kpi.reverse)}`}>
                    {kpi.trend > 0 ? <TrendingUp size={10} /> : kpi.trend < 0 ? <TrendingDown size={10} /> : null}
                    <span>{kpi.trend ? `${Math.abs(kpi.trend)}%` : '0%'}</span>
                    <span className="text-zinc-450 font-bold ml-1 uppercase">vs MoM</span>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* AI Intelligence banner */}
      <div className="p-3.5 bg-zinc-950 dark:bg-black text-white rounded-xl border border-zinc-850 overflow-hidden relative shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[var(--primary)]">
              <Sparkles size={14} className="fill-current" />
              <span className="text-[9px] font-black uppercase tracking-wider">Superadmin Delivery Optimizer</span>
            </div>
            <p className="text-xs md:text-sm font-semibold leading-relaxed text-zinc-200">
              Average delivery transit time is down by <span className="font-black text-emerald-400">8.5%</span>. Incentives active on <span className="font-black text-emerald-400">Bike</span> riders in <span className="font-black text-emerald-400">North India</span> have improved 1st-mile acceptance by <span className="font-black text-emerald-400">3.2m</span>.
            </p>
          </div>
          <button
            onClick={() => setIsIncentiveOpen(true)}
            className="self-start md:self-auto shrink-0 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg px-3 py-1 text-xs font-bold transition-colors cursor-pointer"
          >
            Manage Bonus Schemes
          </button>
        </div>
        <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-[var(--primary)] rounded-full blur-[80px] opacity-20 pointer-events-none"></div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Delivery Time & Order Trend Line Chart */}
        <div className="lg:col-span-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm min-h-[300px] flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h4 className="text-[10px] font-black text-zinc-550 dark:text-zinc-450 uppercase tracking-widest">Delivery Time & Volume Trends</h4>
              <p className="text-[9px] text-zinc-400 mt-0.5">Fulfillment volume and speed correlation</p>
            </div>
            {/* Interval Selector */}
            <div className="flex bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-[9px] font-black uppercase text-zinc-500">
              {['daily', 'weekly', 'monthly'].map(interval => (
                <button
                  key={interval}
                  onClick={() => setTimeTrendInterval(interval)}
                  className={`px-2.5 py-1 rounded-md cursor-pointer transition-colors ${
                    timeTrendInterval === interval 
                      ? 'bg-white dark:bg-zinc-900 text-[var(--primary)] font-black shadow-sm' 
                      : 'hover:text-zinc-800 dark:hover:text-white'
                  }`}
                >
                  {interval}
                </button>
              ))}
            </div>
          </div>

          <div className="h-56 w-full mt-4">
            {trendLoading ? (
              <Skeleton className="w-full h-full rounded" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#a1a1aa" fontSize={8} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" stroke="#a1a1aa" fontSize={8} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="right" orientation="right" stroke="#a1a1aa" fontSize={8} tickLine={false} axisLine={false} tickFormatter={val => `${val}m`} />
                  <RechartsTooltip formatter={(v, name) => [name === 'avgTime' ? `${v} mins` : `${v} orders`]} />
                  <Legend wrapperStyle={{ fontSize: 9, fontWeight: 700 }} />
                  <Line yAxisId="left" type="monotone" name="Deliveries Count" dataKey="deliveries" stroke="var(--secondary, #ff7f50)" strokeWidth={2} dot={{ r: 2 }} />
                  <Line yAxisId="right" type="monotone" name="Avg Transit Time" dataKey="avgTime" stroke="var(--primary, #a43c12)" strokeWidth={2} dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Rider Performance Bar Chart */}
        <div className="lg:col-span-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm min-h-[300px] flex flex-col justify-between">
          <div>
            <h4 className="text-[10px] font-black text-zinc-550 dark:text-zinc-450 uppercase tracking-widest">Top Performance Leaderboard</h4>
            <p className="text-[9px] text-zinc-400 mt-0.5">Top 5 active riders by completed trips count</p>
          </div>

          <div className="h-56 w-full mt-4">
            {perfLoading ? (
              <Skeleton className="w-full h-full rounded" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData?.slice(0, 5)} layout="vertical" margin={{ top: 5, right: 5, left: 10, bottom: 0 }}>
                  <XAxis type="number" stroke="#a1a1aa" fontSize={8} tickLine={false} axisLine={false} />
                  <YAxis dataKey="rider" type="category" stroke="#a1a1aa" fontSize={8} width={80} tickLine={false} axisLine={false} />
                  <RechartsTooltip formatter={(v) => [`${v} orders`]} />
                  <Bar dataKey="completed" fill="var(--primary, #a43c12)" radius={[0, 3, 3, 0]} maxBarSize={15}>
                    {performanceData?.slice(0, 5).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Rider Earnings Distribution Pie Chart */}
        <div className="lg:col-span-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm min-h-[280px] flex flex-col justify-between">
          <div>
            <h4 className="text-[10px] font-black text-zinc-555 dark:text-zinc-450 uppercase tracking-widest">Payout & Earnings Share</h4>
            <p className="text-[9px] text-zinc-455 mt-0.5">Rider cashflow distribution breakdown</p>
          </div>

          {earningsLoading ? (
            <Skeleton className="w-full h-48 rounded" />
          ) : (
            <div className="flex flex-row items-center justify-between gap-2 mt-2">
              <div className="h-44 w-1/2 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={earningsData}
                      cx="50%"
                      cy="50%"
                      innerRadius={38}
                      outerRadius={55}
                      paddingAngle={3}
                      dataKey="amount"
                    >
                      {earningsData?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(v) => [`₹${v.toLocaleString('en-IN')}`]} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Custom inner text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[7px] text-zinc-400 font-bold uppercase leading-none">Total Paid</span>
                  <span className="text-[10px] font-black text-black dark:text-white mt-1">
                    ₹{(earningsData?.reduce((a, b) => a + b.amount, 0) || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Chart Legend list */}
              <div className="w-1/2 space-y-1.5">
                {earningsData?.map((entry, index) => (
                  <div key={index} className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                      <span className="text-[9px] font-bold text-zinc-800 dark:text-zinc-200 truncate">{entry.name}</span>
                    </div>
                    <span className="text-[9px] font-black text-zinc-450 pl-3.5">
                      ₹{entry.amount?.toLocaleString('en-IN')} ({entry.value}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Acceptance rate counts distribution */}
        <div className="lg:col-span-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm min-h-[280px] flex flex-col justify-between">
          <div>
            <h4 className="text-[10px] font-black text-zinc-555 dark:text-zinc-450 uppercase tracking-widest">Acceptance Rate Health</h4>
            <p className="text-[9px] text-zinc-455 mt-0.5">Percentage breakdown of courier acceptance status</p>
          </div>

          {acceptanceLoading ? (
            <Skeleton className="w-full h-44 rounded" />
          ) : (
            <div className="space-y-4 my-auto">
              {[
                { label: 'Optimal (81-100% Acceptance)', value: acceptanceData?.optimal, color: 'bg-emerald-500 text-emerald-600', pct: 70 },
                { label: 'Warning (61-80% Acceptance)', value: acceptanceData?.warning, color: 'bg-amber-500 text-amber-600', pct: 22 },
                { label: 'Critical (0-60% Acceptance)', value: acceptanceData?.critical, color: 'bg-rose-500 text-rose-600', pct: 8 }
              ].map((bracket, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between items-baseline text-[9.5px]">
                    <span className="font-bold text-zinc-850 dark:text-zinc-350">{bracket.label}</span>
                    <span className="font-mono font-black">{bracket.value}% of riders</span>
                  </div>
                  <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${bracket.color.split(' ')[0]}`} style={{ width: `${bracket.value}%` }}></div>
                  </div>
                </div>
              ))}
              <div className="flex items-start gap-1.5 p-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                <Compass size={11} className="text-zinc-400 shrink-0 mt-0.5" />
                <p className="text-[8.5px] leading-relaxed text-zinc-450 font-bold uppercase">
                  Critical riders are flagged for automated retraining and are disqualified from dynamic incentive bonus pay.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Distance Analysis Scatter Chart */}
        <div className="lg:col-span-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm min-h-[280px] flex flex-col justify-between">
          <div>
            <h4 className="text-[10px] font-black text-zinc-555 dark:text-zinc-450 uppercase tracking-widest">Distance vs Time Analysis</h4>
            <p className="text-[9px] text-zinc-455 mt-0.5">Correlation mapping: Distance (km) vs Time (mins)</p>
          </div>

          <div className="h-44 w-full mt-3">
            {distanceLoading ? (
              <Skeleton className="w-full h-full rounded" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <XAxis type="number" dataKey="distance" name="Distance" unit="km" stroke="#a1a1aa" fontSize={8} tickLine={false} axisLine={false} />
                  <YAxis type="number" dataKey="time" name="Time" unit="m" stroke="#a1a1aa" fontSize={8} tickLine={false} axisLine={false} />
                  <ZAxis type="number" dataKey="earnings" range={[20, 100]} name="Earnings" unit="₹" />
                  <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} formatter={(v, name) => [`${v}`, name]} />
                  <Scatter name="Riders" data={distanceData} fill="var(--primary, #a43c12)" />
                </ScatterChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* Sticky Filter Bar */}
      <div className="sticky top-[48px] z-30 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 shadow-sm space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Date Range */}
          <div className="flex items-center gap-1 bg-zinc-50 dark:bg-zinc-950 px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-black/70 dark:text-white/70">
            <Calendar size={12} className="text-[var(--primary)]" />
            <select
              className="bg-transparent border-none outline-none pr-4 cursor-pointer focus:ring-0"
              value={filters.dateRange}
              onChange={(e) => handleSelectChange('dateRange', e.target.value)}
            >
              <option value="Today">Today</option>
              <option value="Yesterday">Yesterday</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="Custom">Custom Range</option>
            </select>
          </div>

          {/* Custom Date Inputs */}
          {filters.dateRange === 'Custom' && (
            <div className="flex items-center gap-1 animate-fade-down">
              <input
                type="date"
                className="bg-zinc-50 dark:bg-zinc-950 px-2 py-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300 outline-none"
                value={filters.startDate || ''}
                onChange={(e) => handleSelectChange('startDate', e.target.value)}
              />
              <span className="text-xs text-zinc-400 font-bold">-</span>
              <input
                type="date"
                className="bg-zinc-50 dark:bg-zinc-950 px-2 py-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300 outline-none"
                value={filters.endDate || ''}
                onChange={(e) => handleSelectChange('endDate', e.target.value)}
              />
            </div>
          )}

          {/* Regions */}
          <div className="flex items-center gap-1 bg-white dark:bg-zinc-955 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-black/70 dark:text-white/70">
            <MapPin size={11} className="text-zinc-400" />
            <select
              className="bg-transparent border-none outline-none pr-4 cursor-pointer focus:ring-0 max-w-[110px] truncate"
              value={filters.regionId}
              onChange={(e) => handleSelectChange('regionId', e.target.value)}
            >
              <option value="">All Regions</option>
              {regions?.map((reg) => (
                <option key={reg.id} value={reg.id}>{reg.name}</option>
              ))}
            </select>
          </div>

          {/* Zones Dropdown */}
          {filters.regionId && (
            <div className="flex items-center gap-1 bg-white dark:bg-zinc-955 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-black/70 dark:text-white/70 animate-fade-down">
              <select
                className="bg-transparent border-none outline-none pr-4 cursor-pointer focus:ring-0 max-w-[110px] truncate"
                value={filters.zoneId}
                onChange={(e) => handleSelectChange('zoneId', e.target.value)}
              >
                <option value="">All Zones</option>
                {zones?.map((z) => (
                  <option key={z.id} value={z.id}>{z.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Franchise */}
          <div className="flex items-center gap-1 bg-white dark:bg-zinc-955 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-black/70 dark:text-white/70">
            <select
              className="bg-transparent border-none outline-none pr-4 cursor-pointer focus:ring-0 max-w-[110px] truncate"
              value={filters.franchiseId}
              onChange={(e) => handleSelectChange('franchiseId', e.target.value)}
            >
              <option value="">All Franchises</option>
              {franchises?.map((fran) => (
                <option key={fran.id} value={fran.id}>{fran.name}</option>
              ))}
            </select>
          </div>

          {/* Store */}
          <div className="flex items-center gap-1 bg-white dark:bg-zinc-955 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-black/70 dark:text-white/70">
            <select
              className="bg-transparent border-none outline-none pr-4 cursor-pointer focus:ring-0 max-w-[130px] truncate"
              value={filters.storeId}
              onChange={(e) => handleSelectChange('storeId', e.target.value)}
            >
              <option value="">All Stores</option>
              {stores?.map((st) => (
                <option key={st.id} value={st.id}>{st.name}</option>
              ))}
            </select>
          </div>

          {/* Vehicle Type */}
          <div className="flex items-center gap-1 bg-white dark:bg-zinc-955 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-black/70 dark:text-white/70">
            <select
              className="bg-transparent border-none outline-none pr-4 cursor-pointer focus:ring-0"
              value={filters.vehicleType}
              onChange={(e) => handleSelectChange('vehicleType', e.target.value)}
            >
              <option value="">All Vehicle Types</option>
              <option value="Bike">Bike</option>
              <option value="Scooter">Scooter</option>
              <option value="Cycle">Cycle</option>
              <option value="Car">Car</option>
            </select>
          </div>

          {/* Rider Status */}
          <div className="flex items-center gap-1 bg-white dark:bg-zinc-955 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-black/70 dark:text-white/70">
            <select
              className="bg-transparent border-none outline-none pr-4 cursor-pointer focus:ring-0"
              value={filters.status}
              onChange={(e) => handleSelectChange('status', e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Online">Online</option>
              <option value="Busy">Busy</option>
              <option value="Offline">Offline</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

        </div>

        {/* Buttons Row */}
        <div className="flex justify-between items-center border-t border-zinc-200 dark:border-zinc-800 pt-2 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetFilters}
              className="px-3.5 py-1 text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white font-bold text-xs bg-zinc-100 dark:bg-zinc-800 rounded-lg transition-colors border border-zinc-200 dark:border-zinc-700 cursor-pointer"
            >
              Reset
            </button>
            <button
              onClick={handleApplyFilters}
              className="px-4 py-1 bg-[var(--primary)] text-white rounded-lg font-bold text-xs hover:opacity-90 transition-opacity shadow-md flex items-center gap-1 cursor-pointer"
            >
              <Filter size={12} />
              Apply Filters
            </button>
          </div>
          <span className="text-[10px] font-bold text-zinc-400 italic">
            Offline data simulation supported when service is down
          </span>
        </div>
      </div>

      {/* Directory Table section */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden flex flex-col justify-between">
        
        {/* Table header filter / search bar */}
        <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-950/20 flex-wrap gap-2">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2 text-zinc-450" size={13} />
            <input
              type="text"
              placeholder="Search rider ID, name or store..."
              className="w-full text-xs pl-8 pr-3 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-black dark:text-white focus:outline-none focus:border-[var(--primary)] font-semibold"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <span className="text-[10px] font-bold text-zinc-400">Total matched: {tableTotal} riders</span>
        </div>

        {/* Ledger Table */}
        {tableLoading ? (
          <div className="p-10 space-y-3">
            <Skeleton className="h-8 w-full rounded" />
            <Skeleton className="h-8 w-full rounded" />
            <Skeleton className="h-8 w-full rounded" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-zinc-200 dark:divide-zinc-800">
              <thead className="bg-zinc-50/50 dark:bg-zinc-950/30 text-zinc-550 font-bold uppercase tracking-wider text-[9px] whitespace-nowrap">
                <tr>
                  <th className="px-4 py-2.5 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={() => toggleSort('id')}>
                    <span className="flex items-center gap-1">Rider ID <ArrowUpDown size={10} /></span>
                  </th>
                  <th className="px-4 py-2.5">Name</th>
                  <th className="px-4 py-2.5">Hub Store</th>
                  <th className="px-4 py-2.5 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 text-right" onClick={() => toggleSort('orders')}>
                    <span className="flex items-center justify-end gap-1">Completed Orders <ArrowUpDown size={10} /></span>
                  </th>
                  <th className="px-4 py-2.5 text-right">Avg Distance</th>
                  <th className="px-4 py-2.5 text-right">Avg Time</th>
                  <th className="px-4 py-2.5 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 text-right" onClick={() => toggleSort('acceptance')}>
                    <span className="flex items-center justify-end gap-1">Acceptance Rate <ArrowUpDown size={10} /></span>
                  </th>
                  <th className="px-4 py-2.5 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 text-center" onClick={() => toggleSort('rating')}>
                    <span className="flex items-center justify-center gap-1">Rating <ArrowUpDown size={10} /></span>
                  </th>
                  <th className="px-4 py-2.5 text-center">Vehicle</th>
                  <th className="px-4 py-2.5 text-center">Status</th>
                  <th className="px-4 py-2.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850 font-semibold text-zinc-800 dark:text-zinc-200">
                {tableData?.map((row) => (
                  <tr key={row.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/10 transition-colors">
                    <td className="px-4 py-2.5 font-mono text-[10px] text-zinc-500 dark:text-zinc-400">{row.id}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        {row.avatar ? (
                          <img src={row.avatar} alt={row.name} className="w-6 h-6 rounded-full object-cover shadow-sm" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-[var(--primary)] text-white text-[8px] font-black flex items-center justify-center uppercase">
                            {row.name.slice(0, 2)}
                          </div>
                        )}
                        <span className="font-extrabold">{row.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 font-bold text-zinc-500 dark:text-zinc-400">{row.store}</td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold">{row.orders} orders</td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold text-zinc-500">{row.distance} km</td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold text-zinc-500">{row.avgTime} mins</td>
                    <td className="px-4 py-2.5 text-right font-mono font-black text-emerald-600 dark:text-emerald-500">{row.acceptance}%</td>
                    <td className="px-4 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-0.5 text-yellow-500 font-bold">
                        <Star size={10.5} className="fill-yellow-500 text-yellow-500" />
                        <span>{row.rating}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-center text-[10px] font-bold text-zinc-500">{row.vehicle}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded text-[8.5px] font-extrabold uppercase border ${getStatusBadge(row.status)}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <button
                        onClick={() => setSelectedRiderId(row.id)}
                        className="px-2 py-1 bg-zinc-900 dark:bg-zinc-800 text-white rounded text-[10px] font-bold tracking-wider hover:opacity-90 transition-opacity cursor-pointer shadow-sm uppercase"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
                {(!tableData || tableData.length === 0) && (
                  <tr>
                    <td colSpan="11" className="px-4 py-8 text-center text-zinc-450 italic">
                      No courier partners found matching current filter parameters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Table pagination control footer */}
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-950/20 text-[10px] font-bold">
          <span className="text-zinc-450">
            Page {pagination.page} of {Math.max(1, Math.ceil(tableTotal / pagination.limit))}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPagination(p => ({ ...p, page: Math.max(1, p.page - 1) }))}
              disabled={pagination.page <= 1 || tableLoading}
              className="p-1 border border-zinc-250 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setPagination(p => ({ ...p, page: Math.min(Math.max(1, Math.ceil(tableTotal / pagination.limit)), p.page + 1) }))}
              disabled={pagination.page >= Math.max(1, Math.ceil(tableTotal / pagination.limit)) || tableLoading}
              className="p-1 border border-zinc-250 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

      </div>

      {/* RIDER DRILL-DOWN DETAILS MODAL */}
      <RiderDetailsModal
        isOpen={!!selectedRiderId}
        onClose={() => setSelectedRiderId(null)}
        riderId={selectedRiderId}
      />

      {/* CREATE BONUS INCENTIVE FORM MODAL */}
      <CreateIncentiveModal
        isOpen={isIncentiveOpen}
        onClose={() => setIsIncentiveOpen(false)}
      />

    </div>
  );
}
