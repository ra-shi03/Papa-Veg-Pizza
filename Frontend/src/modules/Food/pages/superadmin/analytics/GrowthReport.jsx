import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  RefreshCw,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Percent,
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  Activity,
  Award,
  DollarSign,
  Compass,
  ArrowUpDown,
  Filter,
  Calendar,
  MapPin,
  Users,
  Store,
  FileText,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  Locate
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
  Cell,
  AreaChart,
  Area
} from 'recharts';

import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { Skeleton } from '../../../components/ui/skeleton';
import GenerateReportModal from './components/GenerateReportModal';
import ReportDetailsModal from './components/ReportDetailsModal';

import {
  useGrowthStats,
  useRevenueGrowth,
  useCustomerGrowth,
  useStoreExpansion,
  useFranchiseGrowth,
  useTopCities,
  useForecasting,
  useGrowthReportsList
} from './hooks/useGrowthAnalyticsQuery';

// Configure Leaflet custom pulsing marker icon
const createCityMarker = (cityName, growthRate) => {
  return L.divIcon({
    html: `
      <div class="relative flex items-center justify-center">
        <div class="absolute w-8 h-8 rounded-full bg-[var(--primary)]/20 animate-ping"></div>
        <div class="w-5 h-5 rounded-full bg-[var(--primary)] border-2 border-white flex items-center justify-center shadow-lg text-white font-black text-[7px] leading-none">
          ${growthRate}%
        </div>
      </div>
    `,
    className: 'custom-city-marker-div',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
};

export default function GrowthReport() {
  // Master Filters State
  const [filters, setFilters] = useState({
    regionId: '',
    franchiseId: '',
    reportPeriod: '',
    dateRange: 'This Month',
    startDate: '',
    endDate: ''
  });

  const [appliedFilters, setAppliedFilters] = useState({ ...filters });
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState({ key: 'generatedAt', dir: 'desc' });
  const [pagination, setPagination] = useState({ page: 1, limit: 5 });
  
  // Forecast tabs: 30 vs 90 days
  const [forecastDays, setForecastDays] = useState(30);

  // Modals States
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);

  // Debouncing Search Input by 600ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPagination(p => ({ ...p, page: 1 }));
    }, 600);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Memoized table filters to prevent infinite loops
  const tableFilters = useMemo(() => ({
    search: debouncedSearch,
    reportPeriod: appliedFilters.reportPeriod,
    sortBy
  }), [debouncedSearch, appliedFilters.reportPeriod, sortBy]);

  // Fetching Data Queries
  const { data: stats, loading: statsLoading, refetch: refetchStats } = useGrowthStats(appliedFilters);
  const { data: revenueData, loading: revLoading, refetch: refetchRevenue } = useRevenueGrowth(appliedFilters);
  const { data: customerData, loading: custLoading, refetch: refetchCustomer } = useCustomerGrowth(appliedFilters);
  const { data: storeData, loading: storeLoading, refetch: refetchStore } = useStoreExpansion(appliedFilters);
  const { data: franchiseData, loading: franLoading, refetch: refetchFranchise } = useFranchiseGrowth(appliedFilters);
  const { data: citiesData, loading: citiesLoading, refetch: refetchCities } = useTopCities(appliedFilters);
  const { data: forecastData, loading: forecastLoading, refetch: refetchForecast } = useForecasting(forecastDays);
  const { data: reportsList, total: reportsTotal, loading: reportsLoading, refetch: refetchReports } = useGrowthReportsList(tableFilters, pagination);

  const handleApplyFilters = () => {
    setAppliedFilters({ ...filters });
    setPagination(p => ({ ...p, page: 1 }));
    toast.success('BI growth analytics filters synchronized');
  };

  const handleResetFilters = () => {
    const freshFilters = {
      regionId: '',
      franchiseId: '',
      reportPeriod: '',
      dateRange: 'This Month',
      startDate: '',
      endDate: ''
    };
    setFilters(freshFilters);
    setAppliedFilters(freshFilters);
    setSearchQuery('');
    setDebouncedSearch('');
    setPagination({ page: 1, limit: 5 });
    toast.success('Growth intelligence filters reset');
  };

  const handleReloadAll = () => {
    refetchStats();
    refetchRevenue();
    refetchCustomer();
    refetchStore();
    refetchFranchise();
    refetchCities();
    refetchForecast();
    refetchReports();
    toast.success('Latest growth intelligence reports updated');
  };

  const handleSelectChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleSort = (key) => {
    setSortBy(prev => ({
      key,
      dir: prev.key === key && prev.dir === 'desc' ? 'asc' : 'desc'
    }));
    setPagination(p => ({ ...p, page: 1 }));
  };

  const formatCurrency = (val) => {
    if (val === undefined || val === null) return '₹0';
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(1)}L`;
    }
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const getTrendColor = (val, reverse = false) => {
    if (val === 0) return 'text-zinc-400';
    const isPositive = val > 0;
    const isGood = reverse ? !isPositive : isPositive;
    return isGood ? 'text-emerald-500' : 'text-rose-500';
  };

  // Indian Regions & Franchises options (simulated)
  const regionsList = [
    { id: 'reg-north', name: 'North India' },
    { id: 'reg-central', name: 'Central India' },
    { id: 'reg-west', name: 'West India' },
    { id: 'reg-south', name: 'South India' }
  ];

  const franchisesList = [
    { id: 'fran-sharma', name: 'Sharma Foodworks' },
    { id: 'fran-khanna', name: 'Khanna Retailers' },
    { id: 'fran-malwa', name: 'Malwa Food Systems' },
    { id: 'fran-deccan', name: 'Deccan Hospitality' }
  ];

  const COLORS = ['#a43c12', '#ff7f50', '#f59e0b', '#10b981', '#6366f1', '#8b5cf6'];

  return (
    <div className="p-3 md:p-4 pb-12 max-w-7xl mx-auto bg-zinc-50 dark:bg-zinc-955 min-h-screen w-full space-y-4 animate-fade-in text-zinc-900 dark:text-zinc-100 font-semibold text-xs">
      
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-lg font-black text-black dark:text-white flex items-center gap-2">
            <span>Growth & Strategic Business Reports</span>
            <span className="animate-pulse bg-[var(--primary)]/10 text-[var(--primary)] text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-[var(--primary)]/20">
              Live BI Channel
            </span>
          </h2>
          <p className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5">
            <Clock size={11} />
            Data compiled from POS & CRM settlements 1m ago
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => setIsGeneratorOpen(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-3 py-1.5 bg-[var(--primary)] hover:opacity-90 text-white rounded-lg text-xs font-black shadow-md cursor-pointer transition-opacity uppercase tracking-wider"
          >
            <Plus size={14} className="stroke-[2.5]" />
            Generate Report
          </button>
          <button
            onClick={handleReloadAll}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900 text-black/70 dark:text-white/70 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm cursor-pointer animate-fade-in"
            title="Reload BI feed"
          >
            <RefreshCw size={14} className={statsLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* 1. KPI Cards Grid - PLACED AT THE TOP */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3.5">
        {[
          { title: 'Platform Growth', val: stats?.platformGrowth, suffix: '%', icon: Activity, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/20' },
          { title: 'Revenue Growth', val: stats?.revenueGrowth, suffix: '%', icon: DollarSign, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/20' },
          { title: 'Customer Growth', val: stats?.customerGrowth, suffix: '%', icon: Users, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' },
          { title: 'Store Growth', val: stats?.storeGrowth, suffix: '%', icon: Store, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/20' },
          { title: 'Order Growth', val: stats?.orderGrowth, suffix: '%', icon: Award, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20' },
          { title: 'Franchise Growth', val: stats?.franchiseGrowth, suffix: '%', icon: Percent, color: 'text-teal-500 bg-teal-50 dark:bg-teal-950/20' },
          { title: 'Retention Rate', val: stats?.retentionRate, suffix: '%', icon: Compass, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20' },
          { title: 'Market Share', val: stats?.marketShare, suffix: '%', icon: Sparkles, color: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-950/20' }
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
                  <div className={`flex items-center gap-0.5 text-[9px] font-extrabold mt-1.5 ${getTrendColor(kpi.val)}`}>
                    {kpi.val > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    <span>{kpi.val ? `${Math.abs(kpi.val)}%` : '0%'}</span>
                    <span className="text-zinc-450 font-bold ml-1 uppercase">vs MoM</span>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* AI Assistant Banner */}
      <div className="p-3.5 bg-zinc-950 dark:bg-black text-white rounded-xl border border-zinc-850 overflow-hidden relative shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[var(--primary)]">
              <Sparkles size={14} className="fill-current animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-wider">AI Growth Forecaster Insights</span>
            </div>
            <p className="text-xs font-semibold leading-relaxed text-zinc-200">
              Platform revenues grew <span className="font-black text-emerald-400">21.6%</span> this month. Predictive algorithms suggest an additional <span className="font-black text-emerald-400">₹24.8L</span> in Q3 gross billing, driven by aggressive <span className="font-black text-emerald-400">West India</span> expansion and IPL coupon conversions.
            </p>
          </div>
          <button
            onClick={() => setIsGeneratorOpen(true)}
            className="self-start md:self-auto shrink-0 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg px-3 py-1 text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer"
          >
            Launch Forecast Generator
          </button>
        </div>
        <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-[var(--primary)] rounded-full blur-[80px] opacity-20 pointer-events-none"></div>
      </div>

      {/* 2. Growth Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Revenue Growth Line/Area Chart */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm min-h-[280px] flex flex-col justify-between">
          <div>
            <h4 className="text-[10px] font-black text-zinc-550 dark:text-zinc-450 uppercase tracking-widest">Revenue Growth Analytics</h4>
            <p className="text-[9px] text-zinc-400 mt-0.5">Correlation mapping: Gross billing vs pre-tax profits</p>
          </div>
          <div className="h-56 w-full mt-4">
            {revLoading ? (
              <Skeleton className="w-full h-full rounded" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="growthRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke="#a1a1aa" fontSize={8} tickLine={false} axisLine={false} />
                  <YAxis stroke="#a1a1aa" fontSize={8} tickLine={false} axisLine={false} tickFormatter={formatCurrency} />
                  <RechartsTooltip formatter={(v, name) => [formatCurrency(v), name === 'revenue' ? 'Revenue' : name === 'profit' ? 'Profit' : 'Orders']} />
                  <Legend wrapperStyle={{ fontSize: 9, fontWeight: 700 }} />
                  <Area type="monotone" name="Gross Revenue" dataKey="revenue" stroke="var(--primary)" strokeWidth={2.5} fillOpacity={1} fill="url(#growthRev)" />
                  <Line type="monotone" name="Realized Profit" dataKey="profit" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Customer Acquisition Line Chart */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm min-h-[280px] flex flex-col justify-between">
          <div>
            <h4 className="text-[10px] font-black text-zinc-555 dark:text-zinc-450 uppercase tracking-widest">Customer Expansion Rate</h4>
            <p className="text-[9px] text-zinc-455 mt-0.5">Week-by-week registration of new vs returning users</p>
          </div>
          <div className="h-56 w-full mt-4">
            {custLoading ? (
              <Skeleton className="w-full h-full rounded" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={customerData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <XAxis dataKey="week" stroke="#a1a1aa" fontSize={8} tickLine={false} axisLine={false} />
                  <YAxis stroke="#a1a1aa" fontSize={8} tickLine={false} axisLine={false} />
                  <RechartsTooltip />
                  <Legend wrapperStyle={{ fontSize: 9, fontWeight: 700 }} />
                  <Line type="monotone" name="New Signups" dataKey="newCustomers" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" name="Returning Users" dataKey="returningCustomers" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Store Expansion Bar Chart */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm min-h-[280px] flex flex-col justify-between">
          <div>
            <h4 className="text-[10px] font-black text-zinc-555 dark:text-zinc-450 uppercase tracking-widest">Regional Store expansion</h4>
            <p className="text-[9px] text-zinc-455 mt-0.5">Outlet count density and contributed regional revenues</p>
          </div>
          <div className="h-56 w-full mt-4">
            {storeLoading ? (
              <Skeleton className="w-full h-full rounded" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={storeData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <XAxis dataKey="region" stroke="#a1a1aa" fontSize={8} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" stroke="#a1a1aa" fontSize={8} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="right" orientation="right" stroke="#a1a1aa" fontSize={8} tickLine={false} axisLine={false} tickFormatter={formatCurrency} />
                  <RechartsTooltip />
                  <Legend wrapperStyle={{ fontSize: 9, fontWeight: 700 }} />
                  <Bar yAxisId="left" name="Outlets Count" dataKey="stores" fill="#10b981" maxBarSize={25} radius={[3, 3, 0, 0]} />
                  <Bar yAxisId="right" name="Revenue share" dataKey="revenue" fill="#6366f1" maxBarSize={25} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Franchise Revenue Leaderboard Bar Chart */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm min-h-[280px] flex flex-col justify-between">
          <div>
            <h4 className="text-[10px] font-black text-zinc-555 dark:text-zinc-450 uppercase tracking-widest">Franchise Leaderboard Growth</h4>
            <p className="text-[9px] text-zinc-455 mt-0.5">Top active commissions franchises by revenue and growth %</p>
          </div>
          <div className="h-56 w-full mt-4">
            {franLoading ? (
              <Skeleton className="w-full h-full rounded" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={franchiseData} layout="vertical" margin={{ top: 5, right: 5, left: 20, bottom: 0 }}>
                  <XAxis type="number" stroke="#a1a1aa" fontSize={8} tickLine={false} axisLine={false} tickFormatter={formatCurrency} />
                  <YAxis dataKey="franchise" type="category" stroke="#a1a1aa" fontSize={8} tickLine={false} axisLine={false} width={100} />
                  <RechartsTooltip formatter={(v, name) => [name === 'revenue' ? formatCurrency(v) : `${v}%`, name === 'revenue' ? 'Revenue' : 'Growth']} />
                  <Legend wrapperStyle={{ fontSize: 9, fontWeight: 700 }} />
                  <Bar name="Sales Contribution" dataKey="revenue" fill="var(--primary)" maxBarSize={15} radius={[0, 3, 3, 0]}>
                    {franchiseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* 3. AI Forecasting Section */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h4 className="text-[10px] font-black text-zinc-555 dark:text-zinc-450 uppercase tracking-widest flex items-center gap-1">
              <Sparkles size={13} className="text-amber-500" />
              Machine Learning Growth Projections
            </h4>
            <p className="text-[9px] text-zinc-455 mt-0.5">AI-generated estimates with 95% confidence bounds (Interval: {forecastDays} Days)</p>
          </div>
          {/* Days selector */}
          <div className="flex bg-zinc-150 dark:bg-zinc-950 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800 font-bold uppercase text-[9px] text-zinc-500">
            {[30, 90].map(days => (
              <button
                key={days}
                onClick={() => setForecastDays(days)}
                className={`px-3 py-1 rounded-md cursor-pointer transition-colors ${
                  forecastDays === days 
                    ? 'bg-white dark:bg-zinc-900 text-amber-600 font-black shadow-sm' 
                    : 'hover:text-zinc-800 dark:hover:text-white'
                }`}
              >
                Next {days} Days
              </button>
            ))}
          </div>
        </div>

        {forecastLoading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
            </div>
            <Skeleton className="h-48 w-full rounded" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Forecast Metrics Cards */}
            <div className="lg:col-span-4 grid grid-cols-2 gap-3.5 my-auto">
              {[
                { title: 'Predicted Revenue', val: formatCurrency(forecastData?.metrics.predictedRevenue), color: 'text-amber-600' },
                { title: 'Predicted Orders', val: forecastData?.metrics.predictedOrders?.toLocaleString(), color: 'text-indigo-500' },
                { title: 'Predicted Customers', val: forecastData?.metrics.predictedCustomers?.toLocaleString(), color: 'text-blue-500' },
                { title: 'Store Expansions', val: `+${forecastData?.metrics.predictedStoreGrowth} outlets`, color: 'text-emerald-500' }
              ].map((card, idx) => (
                <div key={idx} className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-xl border border-zinc-200 dark:border-zinc-850">
                  <span className="text-[8.5px] font-bold text-zinc-500 uppercase tracking-wider block">{card.title}</span>
                  <h4 className={`text-xs font-black mt-2 leading-none ${card.color}`}>{card.val}</h4>
                </div>
              ))}
              <div className="col-span-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[9px] leading-normal text-amber-700 dark:text-amber-400 font-bold uppercase">
                Model confidence score: {forecastData?.confidenceScore}% accuracy index
              </div>
            </div>

            {/* Confidence Band Line Chart */}
            <div className="lg:col-span-8 h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={forecastData?.chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="confBand" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" stroke="#a1a1aa" fontSize={8} tickLine={false} axisLine={false} />
                  <YAxis stroke="#a1a1aa" fontSize={8} tickLine={false} axisLine={false} tickFormatter={formatCurrency} />
                  <RechartsTooltip formatter={(v) => [formatCurrency(v)]} />
                  <Legend wrapperStyle={{ fontSize: 9, fontWeight: 700 }} />
                  {/* Actual revenue */}
                  <Line type="monotone" name="Actual Performance" dataKey="actualRevenue" stroke="#ef4444" strokeWidth={2} dot={{ r: 2 }} connectNulls />
                  {/* Forecast Line */}
                  <Line type="monotone" name="AI Forecast Projection" dataKey="predictedRevenue" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 2 }} />
                  {/* Confidence Interval Band */}
                  <Area name="95% Confidence Band" dataKey="confMax" stroke="none" fill="url(#confBand)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* 4. Regional Expansion map section */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-sm flex flex-col justify-between">
        <div>
          <h4 className="text-[10px] font-black text-zinc-555 dark:text-zinc-450 uppercase tracking-widest flex items-center gap-1.5">
            <MapPin size={13} className="text-[var(--primary)]" />
            Top India Cities Market Expansion
          </h4>
          <p className="text-[9px] text-zinc-455 mt-0.5">Visualizing customer acquisition, orders volume and revenue density across major Indian hubs</p>
        </div>

        {/* Leaflet Map board container */}
        <div className="h-80 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 overflow-hidden relative mt-4">
          {citiesLoading ? (
            <Skeleton className="w-full h-full rounded" />
          ) : (
            <MapContainer
              center={[21.0, 78.0]}
              zoom={4.5}
              style={{ width: '100%', height: '100%' }}
              zoomControl={true}
              scrollWheelZoom={false}
              className="z-10"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {citiesData.map((city, idx) => (
                <Marker
                  key={idx}
                  position={[city.lat, city.lng]}
                  icon={createCityMarker(city.city, city.growth)}
                >
                  <Popup className="custom-leaflet-popup font-semibold text-[10px] text-zinc-850">
                    <div className="space-y-1.5 p-0.5">
                      <p className="font-black text-xs text-[var(--primary)] border-b pb-1 border-zinc-200">{city.city} Hub Office</p>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                        <span className="text-zinc-400">Total Revenue:</span>
                        <span className="font-black text-right">{formatCurrency(city.revenue)}</span>
                        <span className="text-zinc-400">Fulfillment Count:</span>
                        <span className="font-bold text-right">{city.orders.toLocaleString()} orders</span>
                        <span className="text-zinc-400">Active Customers:</span>
                        <span className="font-bold text-right">{city.customers.toLocaleString()} users</span>
                        <span className="text-zinc-400">MoM Growth Rate:</span>
                        <span className="font-extrabold text-emerald-600 text-right">+{city.growth}%</span>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}

          {/* Map floating info */}
          <div className="absolute bottom-3 left-3 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-lg text-[9px] font-bold z-20 shadow-lg">
            <p className="text-zinc-450 uppercase tracking-wide">Pulsing markers represents</p>
            <p className="text-[var(--primary)] font-black uppercase mt-0.5">Hub growth rates</p>
          </div>
        </div>
      </div>

      {/* 5. Sticky Filter Bar - PLACED ABOVE TABLE SECTION */}
      <div className="sticky top-[48px] z-30 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 shadow-sm space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Date Range */}
          <div className="flex items-center gap-1 bg-zinc-50 dark:bg-zinc-950 px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 text-[10px] font-bold text-black/70 dark:text-white/70">
            <Calendar size={11} className="text-[var(--primary)]" />
            <select
              className="bg-transparent border-none outline-none pr-4 cursor-pointer focus:ring-0"
              value={filters.dateRange}
              onChange={(e) => handleSelectChange('dateRange', e.target.value)}
            >
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="This Month">This Month</option>
              <option value="Quarter">Quarter</option>
              <option value="Year">Year</option>
              <option value="Custom">Custom Range</option>
            </select>
          </div>

          {/* Custom Date Inputs */}
          {filters.dateRange === 'Custom' && (
            <div className="flex items-center gap-1 animate-fade-down">
              <input
                type="date"
                className="bg-zinc-50 dark:bg-zinc-950 px-2 py-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-[10px] font-bold text-zinc-700 dark:text-zinc-300 outline-none"
                value={filters.startDate}
                onChange={(e) => handleSelectChange('startDate', e.target.value)}
              />
              <span className="text-zinc-400 font-bold">-</span>
              <input
                type="date"
                className="bg-zinc-50 dark:bg-zinc-950 px-2 py-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-[10px] font-bold text-zinc-700 dark:text-zinc-300 outline-none"
                value={filters.endDate}
                onChange={(e) => handleSelectChange('endDate', e.target.value)}
              />
            </div>
          )}

          {/* Regions */}
          <div className="flex items-center gap-1 bg-white dark:bg-zinc-955 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 text-[10px] font-bold text-black/70 dark:text-white/70">
            <MapPin size={11} className="text-zinc-400" />
            <select
              className="bg-transparent border-none outline-none pr-4 cursor-pointer focus:ring-0 max-w-[110px] truncate"
              value={filters.regionId}
              onChange={(e) => handleSelectChange('regionId', e.target.value)}
            >
              <option value="">All Regions</option>
              {regionsList.map((reg) => (
                <option key={reg.id} value={reg.id}>{reg.name}</option>
              ))}
            </select>
          </div>

          {/* Franchise */}
          <div className="flex items-center gap-1 bg-white dark:bg-zinc-955 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 text-[10px] font-bold text-black/70 dark:text-white/70">
            <select
              className="bg-transparent border-none outline-none pr-4 cursor-pointer focus:ring-0 max-w-[120px] truncate"
              value={filters.franchiseId}
              onChange={(e) => handleSelectChange('franchiseId', e.target.value)}
            >
              <option value="">All Franchises</option>
              {franchisesList.map((fran) => (
                <option key={fran.id} value={fran.id}>{fran.name}</option>
              ))}
            </select>
          </div>

          {/* Report Period selector */}
          <div className="flex items-center gap-1 bg-white dark:bg-zinc-955 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 text-[10px] font-bold text-black/70 dark:text-white/70">
            <select
              className="bg-transparent border-none outline-none pr-4 cursor-pointer focus:ring-0"
              value={filters.reportPeriod}
              onChange={(e) => handleSelectChange('reportPeriod', e.target.value)}
            >
              <option value="">All Periods</option>
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Yearly">Yearly</option>
            </select>
          </div>

        </div>

        {/* Buttons Row */}
        <div className="flex justify-between items-center border-t border-zinc-200 dark:border-zinc-800 pt-2 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetFilters}
              className="px-3.5 py-1 text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white font-bold text-[10px] bg-zinc-100 dark:bg-zinc-800 rounded-lg transition-colors border border-zinc-200 dark:border-zinc-700 cursor-pointer"
            >
              Reset
            </button>
            <button
              onClick={handleApplyFilters}
              className="px-4 py-1 bg-[var(--primary)] text-white rounded-lg font-bold text-[10px] hover:opacity-90 transition-opacity shadow-md flex items-center gap-1 cursor-pointer"
            >
              <Filter size={11} />
              Apply Filters
            </button>
          </div>
          <span className="text-[10px] font-bold text-zinc-400 italic">
            Filter queries automatically refresh all charts & KPI bento widgets
          </span>
        </div>
      </div>

      {/* 6. Reports Table Section */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden flex flex-col justify-between">
        
        {/* Table header filter / search bar */}
        <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-950/20 flex-wrap gap-2">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 text-zinc-450" size={13} />
            <input
              type="text"
              placeholder="Search report ID, period or format..."
              className="w-full text-[10px] pl-8 pr-3 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-black dark:text-white focus:outline-none focus:border-[var(--primary)] font-semibold"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <span className="text-[10px] font-bold text-zinc-455">Total reports found: {reportsTotal} records</span>
        </div>

        {/* Ledger Table */}
        {reportsLoading ? (
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
                    <span className="flex items-center gap-1">Report ID <ArrowUpDown size={10} /></span>
                  </th>
                  <th className="px-4 py-2.5 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={() => toggleSort('period')}>
                    <span className="flex items-center gap-1">Periodicity <ArrowUpDown size={10} /></span>
                  </th>
                  <th className="px-4 py-2.5 text-right cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={() => toggleSort('revenueGrowth')}>
                    <span className="flex items-center justify-end gap-1">Revenue Growth <ArrowUpDown size={10} /></span>
                  </th>
                  <th className="px-4 py-2.5 text-right">Customer Growth</th>
                  <th className="px-4 py-2.5 text-right">Store Expansion</th>
                  <th className="px-4 py-2.5 text-right">Order Growth</th>
                  <th className="px-4 py-2.5 text-right">Franchise Growth</th>
                  <th className="px-4 py-2.5 text-right">Forecast Revenue</th>
                  <th className="px-4 py-2.5 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 text-center" onClick={() => toggleSort('generatedAt')}>
                    <span className="flex items-center justify-center gap-1">Generated At <ArrowUpDown size={10} /></span>
                  </th>
                  <th className="px-4 py-2.5 text-center">Format</th>
                  <th className="px-4 py-2.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850 font-semibold text-zinc-805 dark:text-zinc-200">
                {reportsList.map((row) => (
                  <tr key={row.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/10 transition-colors">
                    <td className="px-4 py-2.5 font-mono text-[10px] text-[var(--primary)] font-black">{row.id}</td>
                    <td className="px-4 py-2.5 font-extrabold">{row.period}</td>
                    <td className="px-4 py-2.5 text-right font-mono font-black text-rose-500">+{row.revenueGrowth}%</td>
                    <td className="px-4 py-2.5 text-right font-mono font-black text-blue-500">+{row.customerGrowth}%</td>
                    <td className="px-4 py-2.5 text-right font-mono font-black text-emerald-500">+{row.storeGrowth}%</td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold text-zinc-500">+{row.orderGrowth}%</td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold text-zinc-500">+{row.franchiseGrowth}%</td>
                    <td className="px-4 py-2.5 text-right font-mono font-black text-amber-500">{formatCurrency(row.predictedRevenue)}</td>
                    <td className="px-4 py-2.5 text-center font-mono text-[10px] text-zinc-550 dark:text-zinc-450">{row.generatedAt}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className="px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800">
                        {row.format}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-center whitespace-nowrap space-x-1.5">
                      <button
                        onClick={() => setSelectedReportId(row.id)}
                        className="px-2 py-1 bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-800 dark:hover:bg-zinc-700 text-white rounded text-[9px] font-black uppercase tracking-wider transition-colors cursor-pointer shadow-sm"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => {
                          toast.success(`Downloading ${row.id} as ${row.format}...`);
                        }}
                        className="px-2 py-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-750 dark:text-zinc-300 rounded text-[9px] font-black uppercase tracking-wider transition-colors cursor-pointer shadow-sm"
                      >
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
                {(!reportsList || reportsList.length === 0) && (
                  <tr>
                    <td colSpan="11" className="px-4 py-8 text-center text-zinc-450 italic bg-zinc-50/50 dark:bg-zinc-950/20">
                      <div className="flex flex-col items-center justify-center p-4 space-y-2">
                        <FileText size={32} className="text-zinc-400 stroke-[1.5]" />
                        <p className="font-extrabold text-sm">No growth reports available for selected filters.</p>
                        <p className="text-[10px] text-zinc-500">Try modifying search tags or adjusting date ranges.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Table pagination control footer */}
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-950/20 text-[10px] font-black">
          <span className="text-zinc-450">
            Page {pagination.page} of {Math.max(1, Math.ceil(reportsTotal / pagination.limit))}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPagination(p => ({ ...p, page: Math.max(1, p.page - 1) }))}
              disabled={pagination.page <= 1 || reportsLoading}
              className="p-1 border border-zinc-250 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setPagination(p => ({ ...p, page: Math.min(Math.max(1, Math.ceil(reportsTotal / pagination.limit)), p.page + 1) }))}
              disabled={pagination.page >= Math.max(1, Math.ceil(reportsTotal / pagination.limit)) || reportsLoading}
              className="p-1 border border-zinc-250 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

      </div>

      {/* REPORT GENERATION DIALOG */}
      <GenerateReportModal
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        onSuccess={(newReport) => {
          refetchReports();
        }}
      />

      {/* REPORT DETAILED METRICS EXPLORER */}
      <ReportDetailsModal
        isOpen={!!selectedReportId}
        onClose={() => setSelectedReportId(null)}
        reportId={selectedReportId}
      />

    </div>
  );
}
