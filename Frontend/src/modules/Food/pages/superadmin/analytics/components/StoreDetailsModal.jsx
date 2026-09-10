import React, { useState, useEffect } from 'react';
import {
  X,
  Store,
  MapPin,
  TrendingUp,
  ShoppingBag,
  Clock,
  Star,
  Users,
  Package,
  Heart,
  DollarSign,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Search,
  CheckCircle,
  Truck,
  UserCheck,
  RefreshCw,
  PieChart as LucidePieChart,
  Percent,
  Calendar,
  Sparkles,
  Inbox
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line
} from 'recharts';
import { Skeleton } from '../../../../components/ui/skeleton';
import {
  useStoreDetails,
  useStoreRevenue,
  useStoreOrders,
  useStoreStaff,
  useStoreInventory,
  useStoreRatings,
  useStoreRefunds,
  useStorePerformanceTrend
} from '../hooks/useStoreAnalyticsQuery';

export default function StoreDetailsModal({ isOpen, onClose, storeId }) {
  const [activeTab, setActiveTab] = useState('overview');

  // Load store profile header
  const { profile, loading: profileLoading } = useStoreDetails(storeId);

  useEffect(() => {
    if (!isOpen) {
      setActiveTab('overview');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatCurrency = (val) => {
    if (val === undefined || val === null) return '₹0';
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const getStatusBadge = (status) => {
    if (status?.toLowerCase() === 'active') {
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-250/20';
    }
    return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-250/20';
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Store },
    { id: 'revenue', name: 'Revenue', icon: DollarSign },
    { id: 'orders', name: 'Orders Ledger', icon: ShoppingBag },
    { id: 'staff', name: 'Staff Management', icon: Users },
    { id: 'inventory', name: 'Inventory Health', icon: Package },
    { id: 'ratings', name: 'Ratings & Reviews', icon: Star },
    { id: 'refunds', name: 'Refunds Hub', icon: RefreshCw },
    { id: 'performance', name: 'Performance Trends', icon: TrendingUp }
  ];

  return (
    <div className="fixed inset-0 lg:left-[280px] z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="w-full max-w-[1500px] bg-zinc-50 dark:bg-zinc-950 rounded-2xl shadow-2xl flex flex-col relative border border-zinc-200 dark:border-zinc-800 max-h-[94vh] overflow-hidden my-auto font-semibold text-xs text-zinc-800 dark:text-zinc-200">
        
        {/* Modal Header */}
        <header className="px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sticky top-0 bg-white dark:bg-zinc-900 z-20 rounded-t-2xl shadow-sm">
          {profileLoading ? (
            <div className="flex items-center gap-3">
              <Skeleton className="w-12 h-12 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-56" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative">
                {profile?.logo ? (
                  <img
                    src={profile.logo}
                    alt={profile.name}
                    className="w-12 h-12 rounded-xl border border-zinc-200 dark:border-zinc-700 object-cover shadow-sm shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-[var(--primary)] text-white flex items-center justify-center font-black text-sm uppercase shrink-0">
                    {profile?.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                )}
                <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-zinc-900 ${profile?.status?.toLowerCase() === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-black text-black dark:text-white truncate">
                    {profile?.name}
                  </h2>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border ${getStatusBadge(profile?.status)}`}>
                    {profile?.status}
                  </span>
                  <span className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-450 border border-yellow-500/20 text-[9px] font-extrabold px-1.5 py-0.2 rounded flex items-center gap-0.5">
                    <Star size={10} className="fill-yellow-500" />
                    {profile?.averageRating} Rating
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3.5 gap-y-0.5 mt-1 text-[10px] font-bold text-zinc-450 dark:text-zinc-400">
                  <span className="flex items-center gap-1"><Store size={11} className="text-zinc-400" />Franchise: {profile?.franchise}</span>
                  <span className="flex items-center gap-1"><MapPin size={11} className="text-zinc-400" />Region: {profile?.region}</span>
                  <span className="flex items-center gap-1"><MapPin size={11} className="text-zinc-400" />Territory: {profile?.territory}</span>
                  <span className="font-mono text-[9px] bg-zinc-100 dark:bg-zinc-800 text-zinc-550 dark:text-zinc-450 px-1.5 py-0.2 rounded border border-zinc-200/40 dark:border-zinc-700/40">ID: {profile?.id}</span>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-150 dark:hover:bg-zinc-800 text-zinc-500 cursor-pointer shrink-0 transition-colors"
          >
            <X size={16} />
          </button>
        </header>

        {/* Tab Selection */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0 overflow-x-auto scrollbar-none shadow-inner">
          {tabs.map((t) => {
            const TabIcon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-5 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  isActive
                    ? 'border-[var(--primary)] text-[var(--primary)] bg-[var(--primary)]/[0.02] font-black'
                    : 'border-transparent text-zinc-500 hover:text-zinc-850 dark:hover:text-zinc-200'
                }`}
              >
                <TabIcon size={12.5} className={isActive ? 'text-[var(--primary)]' : 'text-zinc-400'} />
                {t.name}
              </button>
            );
          })}
        </div>

        {/* Modal Scrollable Box */}
        <main className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <OverviewTabContent storeId={storeId} profile={profile} formatCurrency={formatCurrency} />
          )}

          {/* TAB 2: REVENUE */}
          {activeTab === 'revenue' && (
            <RevenueTabContent storeId={storeId} formatCurrency={formatCurrency} />
          )}

          {/* TAB 3: ORDERS LEDGER */}
          {activeTab === 'orders' && (
            <OrdersTabContent storeId={storeId} formatCurrency={formatCurrency} />
          )}

          {/* TAB 4: STAFF */}
          {activeTab === 'staff' && (
            <StaffTabContent storeId={storeId} />
          )}

          {/* TAB 5: INVENTORY */}
          {activeTab === 'inventory' && (
            <InventoryTabContent storeId={storeId} />
          )}

          {/* TAB 6: RATINGS */}
          {activeTab === 'ratings' && (
            <RatingsTabContent storeId={storeId} />
          )}

          {/* TAB 7: REFUNDS */}
          {activeTab === 'refunds' && (
            <RefundsTabContent storeId={storeId} formatCurrency={formatCurrency} />
          )}

          {/* TAB 8: PERFORMANCE TRENDS */}
          {activeTab === 'performance' && (
            <PerformanceTabContent storeId={storeId} formatCurrency={formatCurrency} />
          )}

        </main>

        {/* Modal Footer */}
        <footer className="p-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50 rounded-b-2xl shrink-0 shadow-inner">
          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest hidden sm:inline">
            Papa Veg Pizza Intelligence Console
          </span>
          <button
            onClick={onClose}
            className="px-5 py-1.5 bg-zinc-900 dark:bg-zinc-800 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:opacity-95 transition-opacity cursor-pointer shadow"
          >
            Dismiss Details
          </button>
        </footer>

      </div>
    </div>
  );
}

// =============================================================
// SUB-TAB CONTENT COMPONENTS
// =============================================================

function OverviewTabContent({ storeId, profile, formatCurrency }) {
  const o = profile?.overview;

  if (!o) return <div className="py-8 text-center text-zinc-400">Loading profile data...</div>;

  return (
    <div className="space-y-4 animate-fade-in text-xs">
      
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {[
          { title: 'Total Orders', val: o.orders?.toLocaleString(), desc: 'Transactions volume', icon: ShoppingBag, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/20' },
          { title: 'Gross Revenue', val: formatCurrency(o.revenue), desc: 'Total gross sales', icon: TrendingUp, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' },
          { title: 'Estimated Profit', val: formatCurrency(o.profit), desc: 'Calculated margin (25%)', icon: DollarSign, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/20' },
          { title: 'Average Prep Time', val: `${o.avgPrepTime} mins`, desc: 'Average cooking time', icon: Clock, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20' },
          { title: 'Refund Rate', val: `${o.refundRate}%`, desc: 'Approved return claims', icon: RefreshCw, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/20' },
          { title: 'Cancellation Rate', val: `${o.cancellationRate}%`, desc: 'Unfulfilled orders index', icon: AlertTriangle, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/20' },
          { title: 'Customer Satisfaction', val: `${profile.averageRating >= 4.5 ? 94 : 88}%`, desc: 'CSAT percentage index', icon: Heart, color: 'text-pink-500 bg-pink-50 dark:bg-pink-950/20' },
          { title: 'Inventory Health', val: o.inventoryHealth, desc: 'Stock level index', icon: Package, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20' }
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl shadow-sm hover:scale-[1.01] transition-transform">
              <div className="flex justify-between items-start">
                <span className="text-[9px] font-bold text-zinc-550 dark:text-zinc-450 uppercase tracking-wider leading-none">{kpi.title}</span>
                <span className={`p-1 rounded shrink-0 ${kpi.color}`}><Icon size={12} /></span>
              </div>
              <h3 className="text-sm font-black text-black dark:text-white mt-3 leading-none">
                {kpi.val}
              </h3>
              <p className="text-[8px] text-zinc-400 font-bold mt-1.5 uppercase tracking-wide">{kpi.desc}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Timeline activity log */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">Live Activity Log</h4>
            <div className="space-y-4 relative pl-3.5 border-l border-zinc-200 dark:border-zinc-800">
              {o.recentActivity?.map((act, index) => (
                <div key={index} className="relative space-y-0.5">
                  <span className="absolute -left-[19.5px] top-0.5 w-2.5 h-2.5 rounded-full bg-[var(--primary)] border-2 border-white dark:border-zinc-900 shadow-sm" />
                  <div className="flex justify-between items-baseline font-bold">
                    <span className="text-black dark:text-white">{act.title}</span>
                    <span className="text-[8.5px] text-zinc-400 font-mono">{act.time}</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 leading-relaxed font-semibold">{act.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mini revenue chart */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm md:col-span-2 flex flex-col justify-between min-h-[220px]">
          <div>
            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Revenue Flow Log</h4>
            <p className="text-[9px] text-zinc-400 font-semibold mt-0.5">Estimated gross performance index for the current week</p>
          </div>

          <div className="h-44 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[
                { day: 'Mon', revenue: Math.round(o.revenue * 0.12) },
                { day: 'Tue', revenue: Math.round(o.revenue * 0.14) },
                { day: 'Wed', revenue: Math.round(o.revenue * 0.13) },
                { day: 'Thu', revenue: Math.round(o.revenue * 0.16) },
                { day: 'Fri', revenue: Math.round(o.revenue * 0.20) },
                { day: 'Sat', revenue: Math.round(o.revenue * 0.25) },
                { day: 'Sun', revenue: Math.round(o.revenue * 0.22) }
              ]} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMiniRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary, #a43c12)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--primary, #a43c12)" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#a1a1aa" fontSize={8} tickLine={false} axisLine={false} />
                <YAxis stroke="#a1a1aa" fontSize={8} tickLine={false} axisLine={false} tickFormatter={val => `₹${val/1000}k`} />
                <RechartsTooltip formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="var(--primary, #a43c12)" strokeWidth={2} fillOpacity={1} fill="url(#colorMiniRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}

function RevenueTabContent({ storeId, formatCurrency }) {
  const { data, loading } = useStoreRevenue(storeId);

  if (loading) return <Skeleton className="h-64 w-full rounded-xl" />;
  if (!data) return <div className="py-8 text-center text-zinc-400">No revenue data found.</div>;

  return (
    <div className="space-y-4 animate-fade-in text-xs">
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        {[
          { title: 'Gross Revenue', val: formatCurrency(data.grossRevenue), desc: 'Total billings value', color: 'text-emerald-600 dark:text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' },
          { title: 'Net Revenue', val: formatCurrency(data.netRevenue), desc: 'Sales after tax & refunds', color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' },
          { title: 'Discounts Applied', val: formatCurrency(data.discounts), desc: 'Promo & coupon values', color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20' },
          { title: 'GST Taxes Paid', val: formatCurrency(data.taxes), desc: 'Indirect taxes index', color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/20' },
          { title: 'Refund Claims Paid', val: formatCurrency(data.refundAmount), desc: 'Total reversal sum', color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/20' }
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl shadow-sm">
            <span className="text-[9px] font-black text-zinc-550 dark:text-zinc-450 uppercase tracking-wider">{kpi.title}</span>
            <h3 className={`text-base font-black mt-2 leading-none ${kpi.color.split(' ')[0]}`}>{kpi.val}</h3>
            <p className="text-[8px] text-zinc-400 font-bold mt-1.5 uppercase tracking-wide">{kpi.desc}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        
        {/* Recharts Bar Chart */}
        <div className="md:col-span-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm min-h-[300px] flex flex-col justify-between">
          <div>
            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Monthly Gross vs Net Revenue</h4>
            <p className="text-[9px] text-zinc-450 mt-0.5">Tracking billing vs actual realized cash earnings</p>
          </div>

          <div className="h-56 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthlyData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <XAxis dataKey="month" stroke="#a1a1aa" fontSize={8} tickLine={false} axisLine={false} />
                <YAxis stroke="#a1a1aa" fontSize={8} tickLine={false} axisLine={false} tickFormatter={val => `₹${val/1000}k`} />
                <RechartsTooltip formatter={(v) => [`₹${v.toLocaleString('en-IN')}`]} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '9px', fontWeight: 'bold' }} />
                <Bar dataKey="gross" name="Gross Revenue" fill="var(--primary, #a43c12)" radius={[3, 3, 0, 0]} />
                <Bar dataKey="net" name="Net Revenue" fill="#10b981" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Breakdown Table */}
        <div className="md:col-span-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden flex flex-col justify-between">
          <table className="w-full text-left text-xs divide-y divide-zinc-200 dark:divide-zinc-800">
            <thead className="bg-zinc-50 dark:bg-zinc-950 text-zinc-550 dark:text-zinc-450 font-bold uppercase tracking-wider text-[9px]">
              <tr>
                <th className="px-4 py-2.5">Month</th>
                <th className="px-4 py-2.5 text-right">Gross</th>
                <th className="px-4 py-2.5 text-right">Net</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850 font-semibold text-zinc-805 dark:text-zinc-200">
              {data.monthlyData?.map((item, idx) => (
                <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/10 transition-colors">
                  <td className="px-4 py-2.5 font-bold">{item.month}</td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold">{formatCurrency(item.gross)}</td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-500">{formatCurrency(item.net)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}

function OrdersTabContent({ storeId, formatCurrency }) {
  const [filters, setFilters] = useState({ search: '' });
  const [pagination, setPagination] = useState({ page: 1, limit: 5 });

  const { data, total, stats, loading } = useStoreOrders(storeId, filters, pagination);

  const totalPages = Math.max(Math.ceil(total / pagination.limit), 1);

  const handlePrevPage = () => {
    if (pagination.page > 1) {
      setPagination(p => ({ ...p, page: p.page - 1 }));
    }
  };

  const handleNextPage = () => {
    if (pagination.page < totalPages) {
      setPagination(p => ({ ...p, page: p.page + 1 }));
    }
  };

  const getOrderStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200/20';
      case 'cancelled':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200/20';
      default:
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200/20';
    }
  };

  return (
    <div className="space-y-4 animate-fade-in text-xs font-semibold">
      
      {/* KPI stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block leading-none">Completed checkouts</span>
            <h4 className="text-base font-black text-emerald-600 dark:text-emerald-500 mt-2.5 leading-none">{stats?.completed || 0} orders</h4>
          </div>
          <span className="p-1 rounded bg-emerald-500/10 text-emerald-600 shrink-0"><CheckCircle size={14} /></span>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block leading-none">Cancelled checkouts</span>
            <h4 className="text-base font-black text-rose-600 dark:text-rose-500 mt-2.5 leading-none">{stats?.cancelled || 0} orders</h4>
          </div>
          <span className="p-1 rounded bg-rose-500/10 text-rose-600 shrink-0"><AlertTriangle size={14} /></span>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block leading-none">Active Queue Orders</span>
            <h4 className="text-base font-black text-amber-600 dark:text-amber-500 mt-2.5 leading-none">{stats?.pending || 0} orders</h4>
          </div>
          <span className="p-1 rounded bg-amber-500/10 text-amber-600 shrink-0"><Clock size={14} /></span>
        </div>
      </div>

      {/* Filter and Table Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden flex flex-col justify-between">
        
        {/* Search header bar */}
        <div className="p-3.5 border-b border-zinc-150 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-950/20 flex-wrap gap-2">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2 text-zinc-450" size={13} />
            <input
              type="text"
              placeholder="Search customer, ID, or items..."
              className="w-full text-xs pl-8 pr-3 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-black dark:text-white focus:outline-none focus:border-[var(--primary)] font-semibold"
              value={filters.search}
              onChange={(e) => {
                setFilters({ search: e.target.value });
                setPagination(p => ({ ...p, page: 1 }));
              }}
            />
          </div>
          <span className="text-[10px] font-bold text-zinc-400">Server logs: {total} entries</span>
        </div>

        {/* Data list */}
        {loading ? (
          <div className="p-12 space-y-3">
            <Skeleton className="h-8 w-full rounded" />
            <Skeleton className="h-8 w-full rounded" />
            <Skeleton className="h-8 w-full rounded" />
          </div>
        ) : (
          <table className="w-full text-left text-xs divide-y divide-zinc-250 dark:divide-zinc-800">
            <thead className="bg-zinc-50/50 dark:bg-zinc-950/30 text-zinc-500 font-bold uppercase tracking-wider text-[9px]">
              <tr>
                <th className="px-4 py-2.5">Order ID</th>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5">Customer Name</th>
                <th className="px-4 py-2.5">Items Ordered</th>
                <th className="px-4 py-2.5 text-right">Amount</th>
                <th className="px-4 py-2.5 text-center">Fulfillment</th>
                <th className="px-4 py-2.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-150 dark:divide-zinc-855 font-semibold text-zinc-800 dark:text-zinc-200">
              {data?.map((ord, idx) => (
                <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/10 transition-colors">
                  <td className="px-4 py-2.5 font-mono text-[10px] text-zinc-500 dark:text-zinc-400">{ord.id}</td>
                  <td className="px-4 py-2.5 font-mono text-[10px]">{ord.date}</td>
                  <td className="px-4 py-2.5 font-extrabold">{ord.customer}</td>
                  <td className="px-4 py-2.5 truncate max-w-[200px]" title={ord.items}>{ord.items}</td>
                  <td className="px-4 py-2.5 text-right font-black text-emerald-600 dark:text-emerald-500">{formatCurrency(ord.amount)}</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className="px-1.5 py-0.2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-[9px] font-bold">
                      {ord.deliveryType}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${getOrderStatusBadge(ord.status)}`}>
                      {ord.status}
                    </span>
                  </td>
                </tr>
              ))}
              {(!data || data.length === 0) && (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center text-zinc-450 italic">
                    <Inbox className="mx-auto text-zinc-300 dark:text-zinc-700 stroke-[1.5] mb-2" size={28} />
                    No store checkouts match the current parameters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {/* Server side simulated paginator */}
        <div className="p-3 border-t border-zinc-150 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-950/20 text-[10px] font-bold shrink-0">
          <span className="text-zinc-450">Page {pagination.page} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              onClick={handlePrevPage}
              disabled={pagination.page <= 1 || loading}
              className="p-1 border border-zinc-250 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={handleNextPage}
              disabled={pagination.page >= totalPages || loading}
              className="p-1 border border-zinc-250 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}

function StaffTabContent({ storeId }) {
  const { data, loading } = useStoreStaff(storeId);

  if (loading) return <Skeleton className="h-64 w-full rounded-xl" />;
  if (!data) return <div className="py-8 text-center text-zinc-400">No staff registry available.</div>;

  return (
    <div className="space-y-4 animate-fade-in text-xs">
      
      {/* Managers Section */}
      <div className="space-y-2">
        <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
          <UserCheck size={14} className="text-[var(--primary)]" />
          Store Managers Registry
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.managers?.map((man, idx) => (
            <div key={idx} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl shadow-sm flex items-center gap-4">
              <img
                src={man.photo}
                alt={man.name}
                className="w-12 h-12 rounded-xl object-cover shadow-sm border border-zinc-200 dark:border-zinc-700 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-black dark:text-white truncate">{man.name}</p>
                <p className="text-[10px] text-zinc-500 font-bold mt-0.5">{man.phone}</p>
                <div className="flex justify-between mt-3 text-[9px] font-bold text-zinc-450 border-t border-zinc-100 dark:border-zinc-800 pt-2">
                  <span>Shift: <span className="text-zinc-750 dark:text-zinc-300 font-extrabold">{man.shift}</span></span>
                  <span>Exp: <span className="text-zinc-750 dark:text-zinc-300 font-extrabold">{man.experience}</span></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Kitchen Staff & Riders Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Kitchen Staff Table */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="p-3.5 border-b border-zinc-150 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 font-black uppercase tracking-wider text-[9px] text-zinc-550 flex items-center gap-1.5">
            <span>Kitchen Chef & Prep Staff</span>
          </div>

          <table className="w-full text-left text-xs divide-y divide-zinc-250 dark:divide-zinc-800">
            <thead className="bg-zinc-50/20 dark:bg-zinc-950/30 text-zinc-500 font-bold uppercase tracking-wider text-[9px]">
              <tr>
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Role</th>
                <th className="px-4 py-2.5 text-center">Shift</th>
                <th className="px-4 py-2.5 text-right">Orders</th>
                <th className="px-4 py-2.5 text-right">Efficiency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850 font-semibold text-zinc-800 dark:text-zinc-200">
              {data.kitchenStaff?.map((s, idx) => (
                <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/10 transition-colors">
                  <td className="px-4 py-2.5 font-bold">{s.name}</td>
                  <td className="px-4 py-2.5 text-zinc-450">{s.role}</td>
                  <td className="px-4 py-2.5 text-center font-bold">{s.shift}</td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold">{s.ordersHandled.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-emerald-600 dark:text-emerald-500 font-black">
                    <div className="flex items-center justify-end gap-1.5">
                      <div className="w-12 h-1.5 bg-zinc-200 dark:bg-zinc-850 rounded-full overflow-hidden hidden sm:block">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${s.efficiencyScore}%` }}></div>
                      </div>
                      <span>{s.efficiencyScore}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Delivery Staff Table */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="p-3.5 border-b border-zinc-150 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 font-black uppercase tracking-wider text-[9px] text-zinc-550 flex items-center gap-1.5">
            <span>Riders & Logistics Partners</span>
          </div>

          <table className="w-full text-left text-xs divide-y divide-zinc-250 dark:divide-zinc-800">
            <thead className="bg-zinc-50/20 dark:bg-zinc-950/30 text-zinc-550 font-bold uppercase tracking-wider text-[9px]">
              <tr>
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5 text-right">Delivered</th>
                <th className="px-4 py-2.5 text-center">Avg Rating</th>
                <th className="px-4 py-2.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850 font-semibold text-zinc-800 dark:text-zinc-200">
              {data.deliveryStaff?.map((d, idx) => (
                <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/10 transition-colors">
                  <td className="px-4 py-2.5 font-bold">{d.name}</td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold">{d.ordersDelivered.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-center text-yellow-500 font-bold">
                    <div className="flex items-center justify-center gap-1">
                      <Star size={11} className="fill-yellow-500" />
                      <span>{d.rating}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`px-2 py-0.5 rounded text-[8.5px] font-extrabold uppercase ${
                      d.availability === 'Active'
                        ? 'bg-emerald-500/10 text-emerald-650 dark:text-emerald-450'
                        : d.availability === 'On Break'
                          ? 'bg-amber-500/10 text-amber-650 dark:text-amber-450'
                          : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                    }`}>
                      {d.availability}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}

function InventoryTabContent({ storeId }) {
  const { data, loading } = useStoreInventory(storeId);
  const [filter, setFilter] = useState('All');

  if (loading) return <Skeleton className="h-64 w-full rounded-xl" />;
  if (!data) return <div className="py-8 text-center text-zinc-400">No stock reports loaded.</div>;

  const filteredItems = data.items?.filter(item => {
    if (filter === 'All') return true;
    if (filter === 'Healthy') return item.status === 'Healthy';
    if (filter === 'Low') return item.status === 'Low';
    if (filter === 'Critical') return item.status === 'Critical';
    if (filter === 'Out of Stock') return item.status === 'Out of Stock';
    return true;
  }) || [];

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'healthy':
        return 'bg-emerald-500/10 text-emerald-650 dark:text-emerald-400 border border-emerald-200/20';
      case 'low':
        return 'bg-amber-500/10 text-amber-650 dark:text-amber-400 border border-amber-250/20';
      case 'critical':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-250/20 animate-pulse';
      default:
        return 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200/40 dark:border-zinc-700/40';
    }
  };

  return (
    <div className="space-y-4 animate-fade-in text-xs font-semibold">
      
      {/* Inventory KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {[
          { title: 'Healthy Stock Items', val: data.healthyStock, color: 'text-emerald-600 dark:text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' },
          { title: 'Low Warning Stock', val: data.lowStock, color: 'text-amber-550 dark:text-amber-450 bg-amber-50 dark:bg-amber-950/20' },
          { title: 'Critical / Out of Stock', val: data.outOfStock, color: 'text-rose-600 dark:text-rose-455 bg-rose-50 dark:bg-rose-950/20 animate-pulse' },
          { title: 'Expired items discarded', val: data.expiredItems, color: 'text-zinc-650 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900/30' }
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl shadow-sm">
            <span className="text-[9px] font-black text-zinc-550 dark:text-zinc-450 uppercase tracking-wider">{kpi.title}</span>
            <h3 className={`text-base font-black mt-2.5 leading-none ${kpi.color.split(' ')[0]}`}>{kpi.val} items</h3>
          </div>
        ))}
      </div>

      {/* Main inventory table and filters */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden flex flex-col justify-between">
        
        {/* Toggle headers */}
        <div className="p-3 border-b border-zinc-150 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-950/20 flex justify-between items-center flex-wrap gap-2.5">
          <div className="flex bg-white dark:bg-zinc-955 p-0.5 rounded-lg border border-zinc-250 dark:border-zinc-800 self-start">
            {['All', 'Healthy', 'Low', 'Critical', 'Out of Stock'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 text-[9px] font-bold rounded uppercase transition-all cursor-pointer ${
                  filter === f
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white shadow-sm'
                    : 'text-zinc-550 hover:text-black dark:hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <span className="text-[10px] text-zinc-400 font-bold uppercase">Filtered count: {filteredItems.length} categories</span>
        </div>

        <table className="w-full text-left text-xs divide-y divide-zinc-200 dark:divide-zinc-800">
          <thead className="bg-zinc-50/20 dark:bg-zinc-950/30 text-zinc-550 font-bold uppercase tracking-wider text-[9px]">
            <tr>
              <th className="px-4 py-2.5">Raw Supply Item</th>
              <th className="px-4 py-2.5 text-right">Available Qty</th>
              <th className="px-4 py-2.5 text-right">Min Buffer Qty</th>
              <th className="px-4 py-2.5 text-center">Status</th>
              <th className="px-4 py-2.5 text-right">Last Scanned</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850 font-semibold text-zinc-805 dark:text-zinc-200">
            {filteredItems.map((item, idx) => (
              <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/10 transition-colors">
                <td className="px-4 py-2.5 font-bold">{item.item}</td>
                <td className="px-4 py-2.5 text-right font-mono font-bold text-black dark:text-white">{item.qty}</td>
                <td className="px-4 py-2.5 text-right font-mono text-zinc-450">{item.minQty}</td>
                <td className="px-4 py-2.5 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right text-zinc-400 font-mono text-[10px]">{item.lastUpdated}</td>
              </tr>
            ))}
            {filteredItems.length === 0 && (
              <tr>
                <td colSpan="5" className="px-4 py-10 text-center text-zinc-400 italic">No supply items found under selected status filter.</td>
              </tr>
            )}
          </tbody>
        </table>

      </div>

    </div>
  );
}

function RatingsTabContent({ storeId }) {
  const { data, loading } = useStoreRatings(storeId);

  if (loading) return <Skeleton className="h-64 w-full rounded-xl" />;
  if (!data) return <div className="py-8 text-center text-zinc-400">No review logs compiled.</div>;

  const getSentimentBadge = (sentiment) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive':
        return 'bg-emerald-500/10 text-emerald-650 dark:text-emerald-450 border border-emerald-250/20';
      case 'negative':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-455 border border-rose-250/20 animate-pulse';
      default:
        return 'bg-zinc-100 dark:bg-zinc-850 text-zinc-550 dark:text-zinc-450 border border-zinc-200/40 dark:border-zinc-700/40';
    }
  };

  return (
    <div className="space-y-4 animate-fade-in text-xs font-semibold">
      
      {/* Ratings details cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* CSAT dashboard */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm flex flex-col justify-center items-center">
          <h4 className="text-[10px] font-black text-zinc-550 uppercase tracking-widest text-center mb-3">Core Store Score</h4>
          <div className="text-4xl font-black text-[var(--primary)] flex items-center gap-1.5">
            {data.averageRating}
            <Star className="fill-current text-yellow-500 text-3xl shrink-0" size={24} />
          </div>
          <p className="text-[9px] text-zinc-400 font-bold mt-1.5 uppercase tracking-wide">Average Rating metric</p>
          <div className="w-full border-t border-zinc-100 dark:border-zinc-800/80 mt-4 pt-3 flex justify-between text-[10px] text-zinc-500 font-bold">
            <span>Satisfied Customer Base:</span>
            <span className="text-black dark:text-white font-extrabold">92.4%</span>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl shadow-sm flex flex-col justify-between">
          <span className="text-[9px] font-black text-zinc-550 uppercase tracking-widest block leading-none">Perfect 5-Star Reviews</span>
          <h3 className="text-lg font-black text-emerald-600 dark:text-emerald-500 mt-3 leading-none">{data.fiveStarCount} tickets</h3>
          <p className="text-[8px] text-zinc-400 font-bold mt-1.5 uppercase tracking-wide">Top tier customer approvals</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl shadow-sm flex flex-col justify-between">
          <span className="text-[9px] font-black text-zinc-550 uppercase tracking-widest block leading-none">Negative Reviews Logged</span>
          <h3 className="text-lg font-black text-rose-600 dark:text-rose-500 mt-3 leading-none">{data.negativeReviews} reviews</h3>
          <p className="text-[8px] text-rose-500 font-bold mt-1.5 uppercase tracking-wide animate-pulse">Critical follow-up required</p>
        </div>

      </div>

      {/* Review Logs Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden flex flex-col justify-between">
        <div className="p-3.5 border-b border-zinc-150 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 font-black uppercase tracking-wider text-[9px] text-zinc-550 flex justify-between">
          <span>Detailed Guest Feedback ledger</span>
        </div>

        <table className="w-full text-left text-xs divide-y divide-zinc-200 dark:divide-zinc-800">
          <thead className="bg-zinc-50/20 dark:bg-zinc-950/30 text-zinc-550 font-bold uppercase tracking-wider text-[9px]">
            <tr>
              <th className="px-4 py-2.5">Customer</th>
              <th className="px-4 py-2.5">Order</th>
              <th className="px-4 py-2.5 text-center">Score</th>
              <th className="px-4 py-2.5">Written Feedback</th>
              <th className="px-4 py-2.5 text-center">Sentiment</th>
              <th className="px-4 py-2.5 text-right">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850 font-semibold text-zinc-805 dark:text-zinc-200">
            {data.reviews?.map((r, idx) => (
              <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/10 transition-colors">
                <td className="px-4 py-2.5 font-bold">{r.customer}</td>
                <td className="px-4 py-2.5 font-mono text-[10px] text-zinc-450">{r.order}</td>
                <td className="px-4 py-2.5 text-center text-yellow-500 font-bold">
                  <div className="flex items-center justify-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={10} className={i < r.rating ? 'fill-current' : 'opacity-20'} />
                    ))}
                  </div>
                </td>
                <td className="px-4 py-2.5 max-w-sm truncate italic" title={r.review}>"{r.review}"</td>
                <td className="px-4 py-2.5 text-center">
                  <span className={`px-2 py-0.5 rounded text-[8.5px] font-extrabold uppercase border ${getSentimentBadge(r.sentiment)}`}>
                    {r.sentiment}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right text-zinc-400 font-mono text-[10px]">{r.createdDate}</td>
              </tr>
            ))}
          </tbody>
        </table>

      </div>

    </div>
  );
}

function RefundsTabContent({ storeId, formatCurrency }) {
  const { data, loading } = useStoreRefunds(storeId);

  if (loading) return <Skeleton className="h-64 w-full rounded-xl" />;
  if (!data) return <div className="py-8 text-center text-zinc-400">No refund statements found.</div>;

  const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981'];

  return (
    <div className="space-y-4 animate-fade-in text-xs font-semibold">
      
      {/* KPI stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[9px] font-black text-zinc-550 uppercase tracking-widest block leading-none">Refund amount reversed</span>
            <h4 className="text-base font-black text-rose-600 dark:text-rose-500 mt-2.5 leading-none">{formatCurrency(data.refundAmount)}</h4>
          </div>
          <span className="p-1 rounded bg-rose-500/10 text-rose-600 shrink-0"><DollarSign size={14} /></span>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[9px] font-black text-zinc-550 uppercase tracking-widest block leading-none">Reversed claims count</span>
            <h4 className="text-base font-black text-rose-600 dark:text-rose-500 mt-2.5 leading-none">{data.refundCount} approvals</h4>
          </div>
          <span className="p-1 rounded bg-rose-500/10 text-rose-600 shrink-0"><RefreshCw size={14} /></span>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[9px] font-black text-zinc-550 uppercase tracking-widest block leading-none">Net refund rate</span>
            <h4 className="text-base font-black text-zinc-650 dark:text-zinc-350 mt-2.5 leading-none">{data.refundRate}%</h4>
          </div>
          <span className="p-1 rounded bg-zinc-100 dark:bg-zinc-850 text-zinc-500 shrink-0"><Percent size={14} /></span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        
        {/* Refunds list table */}
        <div className="md:col-span-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden flex flex-col justify-between min-h-[300px]">
          <div className="p-3 border-b border-zinc-150 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 font-black uppercase tracking-wider text-[9px] text-zinc-550 flex justify-between">
            <span>Reversed transactions register</span>
          </div>

          <table className="w-full text-left text-xs divide-y divide-zinc-200 dark:divide-zinc-800">
            <thead className="bg-zinc-50/20 dark:bg-zinc-950/30 text-zinc-550 font-bold uppercase tracking-wider text-[9px]">
              <tr>
                <th className="px-4 py-2.5">Order ID</th>
                <th className="px-4 py-2.5">Customer</th>
                <th className="px-4 py-2.5 text-right">Amount</th>
                <th className="px-4 py-2.5">Reason for claim</th>
                <th className="px-4 py-2.5 text-center">Status</th>
                <th className="px-4 py-2.5 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850 font-semibold text-zinc-805 dark:text-zinc-200">
              {data.refunds?.map((r, idx) => (
                <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/10 transition-colors">
                  <td className="px-4 py-2.5 font-mono text-[10px] text-zinc-500">{r.orderId}</td>
                  <td className="px-4 py-2.5 font-bold">{r.customer}</td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold text-rose-500">{formatCurrency(r.amount)}</td>
                  <td className="px-4 py-2.5 font-bold text-zinc-500">{r.reason}</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className="px-1.5 py-0.2 bg-rose-500/10 text-rose-600 border border-rose-200/20 rounded text-[9.5px] font-black uppercase">
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right text-zinc-400 font-mono text-[10px]">{r.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Reason share pie chart */}
        <div className="md:col-span-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm flex flex-col justify-between min-h-[300px]">
          <div>
            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
              <LucidePieChart size={13} className="text-[var(--primary)]" />
              Reversion Reasons Share
            </h4>
            <p className="text-[9px] text-zinc-450 mt-0.5">Top dispute categories by volume share</p>
          </div>

          <div className="h-44 w-full relative mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.reasonData}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={55}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {data.reasonData?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={v => `${v}%`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-base font-black text-zinc-900 dark:text-zinc-50">Dispute</span>
              <span className="text-[7px] text-zinc-400 font-bold uppercase tracking-wider">Claims</span>
            </div>
          </div>

          <div className="w-full space-y-1 pt-2">
            {data.reasonData?.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-[9px] font-bold p-0.5 px-1.5 rounded bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-850/40">
                <div className="flex items-center gap-1 text-zinc-550 dark:text-zinc-350 truncate">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                  <span className="truncate">{item.name}</span>
                </div>
                <span className="text-black dark:text-white font-extrabold">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}

function PerformanceTabContent({ storeId, formatCurrency }) {
  const [interval, setInterval] = useState('monthly');
  const [metric, setMetric] = useState('revenue');

  const { data, loading } = useStorePerformanceTrend(storeId, interval);

  if (loading) return <Skeleton className="h-64 w-full rounded-xl" />;
  if (!data || data.length === 0) return <div className="py-8 text-center text-zinc-400">No performance records parsed.</div>;

  const metricConfig = {
    revenue: { label: 'Revenue (₹)', dataKey: 'revenue', stroke: 'var(--primary, #a43c12)', format: v => formatCurrency(v) },
    orders: { label: 'Orders Count', dataKey: 'orders', stroke: '#38bdf8', format: v => v.toLocaleString() },
    rating: { label: 'Average Rating Score', dataKey: 'rating', stroke: '#eab308', format: v => `${v} ★` },
    refunds: { label: 'Refund Losses (₹)', dataKey: 'refunds', stroke: '#ef4444', format: v => formatCurrency(v) },
    prepTime: { label: 'Prep Time Duration (mins)', dataKey: 'prepTime', stroke: '#10b981', format: v => `${v} mins` }
  };

  const current = metricConfig[metric];

  return (
    <div className="space-y-4 animate-fade-in text-xs font-semibold">
      
      {/* Controls Bar */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3.5">
        
        {/* Metric Selector Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider">Metrics:</span>
          <select
            className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-3 py-1 rounded-lg text-xs font-extrabold focus:outline-none focus:border-[var(--primary)] cursor-pointer text-zinc-800 dark:text-zinc-200"
            value={metric}
            onChange={(e) => setMetric(e.target.value)}
          >
            <option value="revenue">Revenue Chart</option>
            <option value="orders">Orders Volume Chart</option>
            <option value="rating">Ratings Chart</option>
            <option value="refunds">Refund Losses Chart</option>
            <option value="prepTime">Preparation Time Chart</option>
          </select>
        </div>

        {/* Time Interval Selector */}
        <div className="flex bg-zinc-50 dark:bg-zinc-955 p-0.5 rounded-lg border border-zinc-255 dark:border-zinc-800 shrink-0">
          {['monthly', 'quarterly', 'yearly'].map((t) => (
            <button
              key={t}
              onClick={() => setInterval(t)}
              className={`px-3 py-1 text-[9px] font-bold rounded uppercase transition-all cursor-pointer ${
                interval === t
                  ? 'bg-white dark:bg-zinc-800 text-black dark:text-white shadow-sm font-black'
                  : 'text-zinc-500 hover:text-black dark:hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

      </div>

      {/* Main interactive Recharts graph box */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm flex flex-col justify-between min-h-[300px]">
        <div>
          <h4 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp size={14} className="text-[var(--primary)]" />
            {current.label} Trend Graph
          </h4>
          <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">Scale represents {interval} aggregates</p>
        </div>

        <div className="h-64 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={current.stroke} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={current.stroke} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="#a1a1aa" fontSize={8.5} tickLine={false} axisLine={false} dy={5} />
              <YAxis stroke="#a1a1aa" fontSize={8.5} tickLine={false} axisLine={false} tickFormatter={val => val >= 1000 ? `₹${val/1000}k` : val} />
              <RechartsTooltip formatter={(v) => [current.format(v), current.label]} />
              <Area type="monotone" dataKey={current.dataKey} stroke={current.stroke} strokeWidth={2.5} fillOpacity={1} fill="url(#colorMetric)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
