import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, User, Phone, Navigation, Award, DollarSign, Star, 
  Clock, CheckCircle, AlertTriangle, ShieldAlert, Heart, 
  MapPin, ShoppingBag, Search, ChevronLeft, ChevronRight, 
  Play, Pause, RotateCcw, Compass, Activity 
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  LineChart,
  Line,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { Skeleton } from '../../../../components/ui/skeleton';
import {
  useRiderDetails,
  useRiderDeliveries,
  useRiderEarnings,
  useRiderRatings,
  useRiderReviews,
  useRiderLocationLogs
} from '../hooks/useDeliveryAnalyticsQuery';

export default function RiderDetailsModal({ isOpen, onClose, riderId }) {
  const [activeTab, setActiveTab] = useState('overview');

  // Load rider details profile
  const { profile, loading: profileLoading } = useRiderDetails(riderId);

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
    switch (status?.toLowerCase()) {
      case 'online':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border border-emerald-250/20';
      case 'busy':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-450 border border-amber-250/20';
      case 'offline':
        return 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 border border-zinc-300 dark:border-zinc-700';
      default:
        return 'bg-rose-500/10 text-rose-600 border border-rose-250/20';
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: User },
    { id: 'deliveries', name: 'Deliveries', icon: ShoppingBag },
    { id: 'earnings', name: 'Earnings', icon: DollarSign },
    { id: 'reviews', name: 'Reviews', icon: Heart },
    { id: 'ratings', name: 'Ratings', icon: Star },
    { id: 'location', name: 'Location Logs', icon: Navigation }
  ];

  return (
    <div className="fixed inset-0 lg:left-[280px] z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="w-full max-w-[1500px] bg-zinc-50 dark:bg-zinc-950 rounded-2xl shadow-2xl flex flex-col relative border border-zinc-200 dark:border-zinc-800 max-h-[94vh] overflow-hidden my-auto font-semibold text-xs text-zinc-800 dark:text-zinc-200">
        
        {/* Modal Header */}
        <header className="px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white dark:bg-zinc-900 z-20 rounded-t-2xl shadow-sm">
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
                {profile?.avatar ? (
                  <img
                    src={profile.avatar}
                    alt={profile.name}
                    className="w-12 h-12 rounded-xl border border-zinc-200 dark:border-zinc-700 object-cover shadow-sm shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-[var(--primary)] text-white flex items-center justify-center font-black text-sm uppercase shrink-0">
                    {profile?.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                )}
                <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-zinc-900 ${
                  profile?.status?.toLowerCase() === 'online' ? 'bg-emerald-500' : profile?.status?.toLowerCase() === 'busy' ? 'bg-amber-500' : 'bg-zinc-400'
                }`} />
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
                    <Star size={10} className="fill-yellow-500 text-yellow-500" />
                    {profile?.rating} Rating
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3.5 gap-y-0.5 mt-1 text-[10px] font-bold text-zinc-400 dark:text-zinc-400">
                  <span className="flex items-center gap-1"><Phone size={11} className="text-zinc-400" />{profile?.phone}</span>
                  <span className="flex items-center gap-1"><Compass size={11} className="text-zinc-400" />Vehicle: {profile?.vehicle}</span>
                  <span className="flex items-center gap-1"><MapPin size={11} className="text-zinc-400" />Hub Store: {profile?.store}</span>
                  <span className="font-mono text-[9px] bg-zinc-100 dark:bg-zinc-800 text-zinc-550 dark:text-zinc-450 px-1.5 py-0.2 rounded border border-zinc-200/40 dark:border-zinc-700/40">RIDER ID: {profile?.id}</span>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-105 dark:hover:bg-zinc-800 text-zinc-500 cursor-pointer shrink-0 transition-colors"
          >
            <X size={15} />
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
          {activeTab === 'overview' && <OverviewTab riderId={riderId} profile={profile} formatCurrency={formatCurrency} />}
          {activeTab === 'deliveries' && <DeliveriesTab riderId={riderId} formatCurrency={formatCurrency} />}
          {activeTab === 'earnings' && <EarningsTab riderId={riderId} formatCurrency={formatCurrency} />}
          {activeTab === 'reviews' && <ReviewsTab riderId={riderId} />}
          {activeTab === 'ratings' && <RatingsTab riderId={riderId} />}
          {activeTab === 'location' && <LocationTab riderId={riderId} />}
        </main>

        {/* Modal Footer */}
        <footer className="p-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50 rounded-b-2xl shrink-0 shadow-inner">
          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest hidden sm:inline">
            Papa Veg Pizza Rider Performance Console
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

function OverviewTab({ riderId, profile, formatCurrency }) {
  const o = profile?.overview;

  if (!o) return <div className="py-8 text-center text-zinc-400">Loading rider profile...</div>;

  return (
    <div className="space-y-4 animate-fade-in text-xs">
      
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {[
          { title: 'Total Deliveries', val: o.deliveries?.toLocaleString(), desc: 'Completed orders', icon: ShoppingBag, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/20' },
          { title: 'Avg Time Taken', val: `${o.avgTime} mins`, desc: 'Average delivery duration', icon: Clock, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20' },
          { title: 'Acceptance Rate', val: `${o.acceptance}%`, desc: 'Task acceptance percentage', icon: CheckCircle, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' },
          { title: 'Completion Rate', val: `${o.completion}%`, desc: 'Fulfillment index', icon: Award, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20' },
          { title: 'Total Earnings', val: formatCurrency(o.earnings), desc: 'Includes base & tips', icon: DollarSign, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20' },
          { title: 'Customer Rating', val: `${o.rating} ★`, desc: 'Guest satisfaction', icon: Star, color: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-950/20' }
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
              <p className="text-[8.5px] text-zinc-400 font-bold mt-1.5 uppercase tracking-wide">{kpi.desc}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Daily Deliveries Chart */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm min-h-[240px] flex flex-col justify-between">
          <div>
            <h4 className="text-[9.5px] font-black text-zinc-500 uppercase tracking-widest">Daily Deliveries Volume</h4>
            <p className="text-[9px] text-zinc-400 mt-0.5">Couriers deliveries distribution across this week</p>
          </div>
          <div className="h-44 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={o.dailyDeliveries} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <XAxis dataKey="day" stroke="#a1a1aa" fontSize={8} tickLine={false} axisLine={false} />
                <YAxis stroke="#a1a1aa" fontSize={8} tickLine={false} axisLine={false} />
                <RechartsTooltip formatter={(v) => [`${v} deliveries`]} />
                <Bar dataKey="count" fill="var(--primary, #a43c12)" radius={[3, 3, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Earnings Trend */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm min-h-[240px] flex flex-col justify-between">
          <div>
            <h4 className="text-[9.5px] font-black text-zinc-500 uppercase tracking-widest">Weekly Earnings Summary</h4>
            <p className="text-[9px] text-zinc-400 mt-0.5">Realized income split over the previous 4 weeks</p>
          </div>
          <div className="h-44 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={o.weeklyEarnings} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#a1a1aa" fontSize={8} tickLine={false} axisLine={false} />
                <YAxis stroke="#a1a1aa" fontSize={8} tickLine={false} axisLine={false} tickFormatter={val => `₹${val}`} />
                <RechartsTooltip formatter={(v) => [`₹${v}`]} />
                <Line type="monotone" dataKey="amount" stroke="var(--primary, #a43c12)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}

function DeliveriesTab({ riderId, formatCurrency }) {
  const [filters, setFilters] = useState({ search: '' });
  const [pagination, setPagination] = useState({ page: 1, limit: 5 });

  const { data, total, loading } = useRiderDeliveries(riderId, filters, pagination);
  const totalPages = Math.max(Math.ceil(total / pagination.limit), 1);

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border border-emerald-250/20';
      case 'cancelled':
        return 'bg-rose-500/10 text-rose-600 border border-rose-250/20';
      default:
        return 'bg-amber-500/10 text-amber-600 border border-amber-250/20';
    }
  };

  return (
    <div className="space-y-4 animate-fade-in text-xs">
      
      {/* Deliveries summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block leading-none">Completed Deliveries</span>
            <h4 className="text-sm font-black text-emerald-600 dark:text-emerald-500 mt-2.5 leading-none">{total} trips</h4>
          </div>
          <span className="p-1 rounded bg-emerald-500/10 text-emerald-600"><CheckCircle size={14} /></span>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block leading-none">Cancelled Trips</span>
            <h4 className="text-sm font-black text-rose-600 dark:text-rose-500 mt-2.5 leading-none">1 trip</h4>
          </div>
          <span className="p-1 rounded bg-rose-500/10 text-rose-600"><AlertTriangle size={14} /></span>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block leading-none">Late Deliveries</span>
            <h4 className="text-sm font-black text-amber-600 dark:text-amber-500 mt-2.5 leading-none">0 trips</h4>
          </div>
          <span className="p-1 rounded bg-amber-500/10 text-amber-600"><Clock size={14} /></span>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden flex flex-col justify-between">
        
        {/* Search header bar */}
        <div className="p-3 border-b border-zinc-150 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-950/20 flex-wrap gap-2">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2 text-zinc-450" size={13} />
            <input
              type="text"
              placeholder="Search customer or order ID..."
              className="w-full text-xs pl-8 pr-3 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-black dark:text-white focus:outline-none focus:border-[var(--primary)] font-semibold"
              value={filters.search}
              onChange={(e) => {
                setFilters({ search: e.target.value });
                setPagination(p => ({ ...p, page: 1 }));
              }}
            />
          </div>
          <span className="text-[10px] font-bold text-zinc-400">Rider ledger: {total} records</span>
        </div>

        {loading ? (
          <div className="p-10 space-y-3">
            <Skeleton className="h-8 w-full rounded" />
            <Skeleton className="h-8 w-full rounded" />
            <Skeleton className="h-8 w-full rounded" />
          </div>
        ) : (
          <table className="w-full text-left text-xs divide-y divide-zinc-200 dark:divide-zinc-800">
            <thead className="bg-zinc-50/50 dark:bg-zinc-950/30 text-zinc-550 font-bold uppercase tracking-wider text-[9px]">
              <tr>
                <th className="px-4 py-2.5">Order ID</th>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5">Customer Name</th>
                <th className="px-4 py-2.5 text-right">Distance (km)</th>
                <th className="px-4 py-2.5 text-right">Time Taken</th>
                <th className="px-4 py-2.5 text-center">Status</th>
                <th className="px-4 py-2.5 text-right">Earnings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850 font-semibold text-zinc-800 dark:text-zinc-200">
              {data?.map((row) => (
                <tr key={row.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/10 transition-colors">
                  <td className="px-4 py-2.5 font-mono text-[10px] text-zinc-500 dark:text-zinc-400">{row.id}</td>
                  <td className="px-4 py-2.5 font-mono text-[10px]">{row.date}</td>
                  <td className="px-4 py-2.5 font-extrabold">{row.customer}</td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold">{row.distance} km</td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold">{row.time} mins</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`px-2 py-0.5 rounded text-[8.5px] font-extrabold uppercase border ${getStatusBadge(row.status)}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-black text-emerald-600 dark:text-emerald-500">
                    {row.amount > 0 ? formatCurrency(row.amount) : '₹0'}
                  </td>
                </tr>
              ))}
              {(!data || data.length === 0) && (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-zinc-400 italic">No delivery records matching parameters.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {/* Paginated Footer */}
        <div className="p-3 border-t border-zinc-150 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-950/20 text-[10px] font-bold">
          <span className="text-zinc-450">Page {pagination.page} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPagination(p => ({ ...p, page: Math.max(1, p.page - 1) }))}
              disabled={pagination.page <= 1 || loading}
              className="p-1 border border-zinc-250 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setPagination(p => ({ ...p, page: Math.min(totalPages, p.page + 1) }))}
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

function EarningsTab({ riderId, formatCurrency }) {
  const { data, loading } = useRiderEarnings(riderId);

  if (loading) return <Skeleton className="h-64 w-full rounded-xl" />;
  if (!data) return <div className="py-8 text-center text-zinc-400">No earnings data loaded.</div>;

  return (
    <div className="space-y-4 animate-fade-in text-xs font-semibold">
      
      {/* Earnings Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        {[
          { title: "Today's Earnings", val: formatCurrency(data.today), desc: 'Realtime total', color: 'text-emerald-600 dark:text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' },
          { title: "Weekly Earnings", val: formatCurrency(data.weekly), desc: 'Previous 7 days', color: 'text-emerald-505 bg-emerald-50 dark:bg-emerald-950/20' },
          { title: "Monthly Earnings", val: formatCurrency(data.monthly), desc: 'Current calendar month', color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/20' },
          { title: "Accrued Bonuses", val: formatCurrency(data.bonuses), desc: 'Target incentives rewards', color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20' },
          { title: "Guest Tips Paid", val: formatCurrency(data.tips), desc: '100% tipped to rider', color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/20' }
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl shadow-sm">
            <span className="text-[9px] font-black text-zinc-550 dark:text-zinc-450 uppercase tracking-wider">{kpi.title}</span>
            <h3 className={`text-base font-black mt-2 leading-none ${kpi.color.split(' ')[0]}`}>{kpi.val}</h3>
            <p className="text-[8.5px] text-zinc-400 font-bold mt-1.5 uppercase tracking-wide">{kpi.desc}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Earnings chart */}
        <div className="lg:col-span-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm min-h-[260px] flex flex-col justify-between">
          <div>
            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Daily Earnings Trend</h4>
            <p className="text-[9px] text-zinc-450 mt-0.5">Tracking income details across current cycle</p>
          </div>

          <div className="h-52 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.dailyTrend} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#a1a1aa" fontSize={8} tickLine={false} axisLine={false} />
                <YAxis stroke="#a1a1aa" fontSize={8} tickLine={false} axisLine={false} tickFormatter={val => `₹${val}`} />
                <RechartsTooltip formatter={(v) => [`₹${v}`]} />
                <Line type="monotone" dataKey="amount" stroke="var(--primary, #a43c12)" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="lg:col-span-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden flex flex-col justify-between">
          <table className="w-full text-left text-xs divide-y divide-zinc-200 dark:divide-zinc-800">
            <thead className="bg-zinc-50 dark:bg-zinc-950 text-zinc-550 dark:text-zinc-450 font-bold uppercase tracking-wider text-[9px]">
              <tr>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5 text-right">Base</th>
                <th className="px-4 py-2.5 text-right">Tips/Bonus</th>
                <th className="px-4 py-2.5 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850 font-semibold text-zinc-805 dark:text-zinc-200">
              {data.ledger?.map((item, idx) => (
                <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/10 transition-colors">
                  <td className="px-4 py-2.5 font-bold font-mono">{item.date}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-zinc-500">{formatCurrency(item.base)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-zinc-500">{formatCurrency(item.bonus + item.tips)}</td>
                  <td className="px-4 py-2.5 text-right font-mono font-black text-emerald-600 dark:text-emerald-500">{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}

function ReviewsTab({ riderId }) {
  const { data, loading } = useRiderReviews(riderId);

  if (loading) return <Skeleton className="h-64 w-full rounded-xl" />;
  if (!data) return <div className="py-8 text-center text-zinc-400">No review logs found.</div>;

  const getSentimentBadge = (sentiment) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive':
        return 'bg-emerald-500/10 text-emerald-650 dark:text-emerald-450 border border-emerald-250/20';
      case 'negative':
        return 'bg-rose-500/10 text-rose-650 dark:text-rose-455 border border-rose-250/20 animate-pulse';
      default:
        return 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 border border-zinc-300 dark:border-zinc-700';
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden animate-fade-in text-xs font-semibold">
      <table className="w-full text-left divide-y divide-zinc-200 dark:divide-zinc-800 font-semibold">
        <thead className="bg-zinc-50 dark:bg-zinc-950 text-zinc-550 dark:text-zinc-450 font-bold uppercase tracking-wider text-[9px]">
          <tr>
            <th className="px-4 py-3">Customer</th>
            <th className="px-4 py-3">Order ID</th>
            <th className="px-4 py-3">Comment / Guest Feedback</th>
            <th className="px-4 py-3 text-center">Sentiment</th>
            <th className="px-4 py-3 text-right">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850 font-semibold text-zinc-800 dark:text-zinc-200">
          {data?.map((rev, idx) => (
            <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/10 transition-colors">
              <td className="px-4 py-3 font-extrabold">{rev.customer}</td>
              <td className="px-4 py-3 font-mono text-[10px] text-zinc-400">{rev.orderId}</td>
              <td className="px-4 py-3 leading-relaxed text-zinc-750 dark:text-zinc-300 max-w-sm font-bold">{rev.comment}</td>
              <td className="px-4 py-3 text-center">
                <span className={`px-2 py-0.5 rounded text-[8.5px] font-extrabold uppercase border ${getSentimentBadge(rev.sentiment)}`}>
                  {rev.sentiment}
                </span>
              </td>
              <td className="px-4 py-3 text-right font-mono text-[10px] text-zinc-450">{rev.date}</td>
            </tr>
          ))}
          {(!data || data.length === 0) && (
            <tr>
              <td colSpan="5" className="px-4 py-8 text-center text-zinc-400 italic">No customer reviews logs logged.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function RatingsTab({ riderId }) {
  const { data, loading } = useRiderRatings(riderId);

  if (loading) return <Skeleton className="h-64 w-full rounded-xl" />;
  if (!data) return <div className="py-8 text-center text-zinc-400">No ratings records found.</div>;

  const totalReviews = data.fiveStar + data.fourStar + data.threeStar + data.twoStar + data.oneStar;
  const ratingSplits = [
    { stars: 5, count: data.fiveStar },
    { stars: 4, count: data.fourStar },
    { stars: 3, count: data.threeStar },
    { stars: 2, count: data.twoStar },
    { stars: 1, count: data.oneStar }
  ];

  return (
    <div className="space-y-4 animate-fade-in text-xs font-semibold">
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        
        {/* Rating Split Metrics */}
        <div className="md:col-span-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="text-center py-4">
            <h3 className="text-3xl font-black text-black dark:text-white leading-none">{data.averageRating}</h3>
            <div className="flex justify-center mt-2.5 gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={15} className={`fill-yellow-500 ${i < Math.floor(data.averageRating) ? 'text-yellow-500' : 'text-zinc-200'}`} />
              ))}
            </div>
            <p className="text-[9px] text-zinc-400 font-bold uppercase mt-2">Based on {totalReviews} reviews</p>
          </div>

          <div className="space-y-1.5 mt-2 border-t border-zinc-100 dark:border-zinc-800 pt-3">
            {ratingSplits.map(split => {
              const pct = totalReviews > 0 ? Math.round((split.count / totalReviews) * 100) : 0;
              return (
                <div key={split.stars} className="flex items-center gap-2 text-[9.5px]">
                  <span className="w-10 font-bold text-zinc-450 uppercase shrink-0">{split.stars} Stars</span>
                  <div className="flex-1 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${pct}%` }}></div>
                  </div>
                  <span className="w-8 text-right font-mono font-bold text-zinc-500">{split.count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ratings ledger list */}
        <div className="md:col-span-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden flex flex-col justify-between">
          <table className="w-full text-left text-xs divide-y divide-zinc-200 dark:divide-zinc-800">
            <thead className="bg-zinc-50 dark:bg-zinc-950 text-zinc-550 dark:text-zinc-450 font-bold uppercase tracking-wider text-[9px]">
              <tr>
                <th className="px-4 py-2.5">Order ID</th>
                <th className="px-4 py-2.5">Customer</th>
                <th className="px-4 py-2.5 text-center">Score</th>
                <th className="px-4 py-2.5">Review / Comments</th>
                <th className="px-4 py-2.5 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850 font-semibold text-zinc-805 dark:text-zinc-200">
              {data.ledger?.map((item, idx) => (
                <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/10 transition-colors">
                  <td className="px-4 py-2.5 font-mono text-[10px] text-zinc-500">{item.orderId}</td>
                  <td className="px-4 py-2.5 font-bold">{item.customer}</td>
                  <td className="px-4 py-2.5 text-center text-yellow-500 font-bold">
                    <div className="flex items-center justify-center gap-0.5">
                      <Star size={11} className="fill-yellow-500 text-yellow-500" />
                      <span>{item.rating}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-zinc-550 dark:text-zinc-350 truncate max-w-[200px]" title={item.review}>{item.review}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-[10px] text-zinc-400">{item.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}

function LocationTab({ riderId }) {
  const { data, loading } = useRiderLocationLogs(riderId);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // multiplier

  useEffect(() => {
    if (!data || !isPlaying) return;

    const intervalTime = 1500 / playbackSpeed;
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= data.logs.length - 1) {
          setIsPlaying(false);
          return 0; // reset
        }
        return prev + 1;
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }, [isPlaying, data, playbackSpeed]);

  if (loading) return <Skeleton className="h-96 w-full rounded-xl" />;
  if (!data) return <div className="py-8 text-center text-zinc-400">No location logs available.</div>;

  const currentLog = data.logs[currentStep];

  // Helper to build a responsive visual SVG map representation
  // We can represent coordinates dynamically inside an SVG container
  // Find min/max boundaries of coordinates to scale between 10% and 90%
  const coordinates = data.routeCoordinates;
  const lats = coordinates.map(c => c[0]);
  const lngs = coordinates.map(c => c[1]);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latRange = maxLat - minLat || 1;
  const lngRange = maxLng - minLng || 1;

  const scaleCoord = (lat, lng) => {
    // scale coordinates to fits in 350x240 view box
    const x = 30 + ((lng - minLng) / lngRange) * 290;
    const y = 210 - ((lat - minLat) / latRange) * 180; // invert Y since SVG starts from top
    return { x, y };
  };

  const svgRoutePoints = coordinates.map(c => scaleCoord(c[0], c[1]));
  const pathD = `M ${svgRoutePoints.map(p => `${p.x} ${p.y}`).join(' L ')}`;

  const currentScaled = svgRoutePoints[currentStep];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 animate-fade-in text-xs font-semibold">
      
      {/* Playback Map Canvas */}
      <div className="lg:col-span-8 bg-zinc-950 rounded-2xl p-4 border border-zinc-850 flex flex-col justify-between text-white min-h-[380px] shadow-lg">
        
        <div className="flex justify-between items-center z-10">
          <div>
            <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Route GPS Playback</h4>
            <p className="text-[8.5px] text-zinc-500 font-bold mt-0.5">Route: Hub Store to Client destination</p>
          </div>
          <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
            <Activity size={10} className="animate-pulse" />
            Live Speed: {currentLog?.speed} km/h
          </span>
        </div>

        {/* SVG Map Board */}
        <div className="flex-1 relative flex items-center justify-center my-4 border border-zinc-900 bg-zinc-950/40 rounded-xl min-h-[220px]">
          <svg className="w-full max-w-[500px] h-[220px] overflow-visible">
            
            {/* Grid overlay */}
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#222" strokeWidth="0.5" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Glowing route line */}
            <path
              d={pathD}
              fill="none"
              stroke="#e43c12"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-20"
            />
            <path
              d={pathD}
              fill="none"
              stroke="#ff7f50"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="4 4"
            />

            {/* Hub marker (first node) */}
            {svgRoutePoints.length > 0 && (
              <g transform={`translate(${svgRoutePoints[0].x}, ${svgRoutePoints[0].y})`}>
                <circle r="6" fill="#a43c12" className="animate-ping" />
                <circle r="4" fill="#a43c12" stroke="white" strokeWidth="1" />
              </g>
            )}

            {/* Destination marker (last node) */}
            {svgRoutePoints.length > 0 && (
              <g transform={`translate(${svgRoutePoints[svgRoutePoints.length - 1].x}, ${svgRoutePoints[svgRoutePoints.length - 1].y})`}>
                <circle r="6" fill="#10b981" className="animate-pulse" />
                <circle r="4.5" fill="#10b981" stroke="white" strokeWidth="1" />
              </g>
            )}

            {/* Active Moving Courier Pin */}
            {currentScaled && (
              <g transform={`translate(${currentScaled.x}, ${currentScaled.y})`}>
                <circle r="10" fill="var(--primary, #a43c12)" fillOpacity="0.25" className="animate-ping" />
                <circle r="6.5" fill="var(--primary, #a43c12)" stroke="white" strokeWidth="1.5" className="shadow-lg" />
              </g>
            )}

          </svg>

          {/* Floating UI status details */}
          <div className="absolute bottom-3 left-3 bg-zinc-900/90 border border-zinc-800 p-2.5 rounded-lg text-[9.5px]">
            <p className="text-zinc-400 font-extrabold uppercase tracking-wide">Current coordinate status</p>
            <p className="font-mono mt-1 text-white">Lat: {currentLog?.lat.toFixed(4)} • Lng: {currentLog?.lng.toFixed(4)}</p>
            <p className="text-emerald-400 mt-0.5 truncate max-w-[200px]" title={currentLog?.address}>{currentLog?.address}</p>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex justify-between items-center border-t border-zinc-900 pt-3">
          <div className="flex gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow active:scale-95"
            >
              {isPlaying ? <Pause size={12} /> : <Play size={12} />}
              <span>{isPlaying ? 'Pause' : 'Play Route'}</span>
            </button>
            <button
              onClick={() => {
                setIsPlaying(false);
                setCurrentStep(0);
              }}
              className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-lg cursor-pointer transition-colors active:scale-95"
              title="Reset route"
            >
              <RotateCcw size={12.5} />
            </button>
          </div>

          {/* Speed selectors */}
          <div className="flex bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 text-[9.5px] font-black uppercase text-zinc-400">
            {[1, 2, 4].map(speed => (
              <button
                key={speed}
                onClick={() => setPlaybackSpeed(speed)}
                className={`px-2 py-0.5 rounded cursor-pointer ${
                  playbackSpeed === speed 
                    ? 'bg-zinc-800 text-white font-black' 
                    : 'hover:text-white'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Timeline Steps side table */}
      <div className="lg:col-span-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm flex flex-col justify-between max-h-[380px]">
        <div>
          <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3.5">GPS Logs timeline</h4>
          <div className="space-y-4 relative pl-3.5 border-l border-zinc-200 dark:border-zinc-800 overflow-y-auto max-h-[300px] pr-1 scrollbar-thin">
            {data.logs.map((log, index) => {
              const isActive = index === currentStep;
              return (
                <div
                  key={index}
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentStep(index);
                  }}
                  className={`relative space-y-0.5 cursor-pointer p-1.5 rounded transition-all border ${
                    isActive 
                      ? 'bg-[var(--primary)]/5 border-[var(--primary)] text-zinc-900 dark:text-white font-black shadow-inner' 
                      : 'border-transparent text-zinc-550 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-950/40'
                  }`}
                >
                  <span className={`absolute -left-[18.5px] top-2 w-2 h-2 rounded-full border-2 border-white dark:border-zinc-900 shadow-sm ${
                    isActive ? 'bg-[var(--primary)] scale-110 animate-ping' : 'bg-zinc-300 dark:bg-zinc-700'
                  }`} />
                  <div className="flex justify-between items-baseline">
                    <span className="text-[10px]">{log.timestamp.split(' ')[1]}</span>
                    <span className="text-[8.5px] text-zinc-400 font-mono">{log.speed} km/h</span>
                  </div>
                  <p className="text-[10px] leading-tight mt-0.5 truncate">{log.address}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
}
