import React, { useState, useEffect } from 'react';
import {
  X,
  TrendingUp,
  Users,
  Store,
  Bike,
  Megaphone,
  Sparkles,
  DollarSign,
  Activity,
  Award,
  Clock,
  Star,
  CheckCircle,
  Percent,
  Calendar,
  Compass
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { Skeleton } from '../../../../components/ui/skeleton';
import { useGrowthReportDetails } from '../hooks/useGrowthAnalyticsQuery';

export default function ReportDetailsModal({ isOpen, onClose, reportId }) {
  const [activeTab, setActiveTab] = useState('revenue');
  const { data, loading } = useGrowthReportDetails(reportId);

  useEffect(() => {
    if (isOpen) {
      setActiveTab('revenue');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatCurrency = (val) => {
    if (val === undefined || val === null) return '₹0';
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(1)}L`;
    }
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const getTabColor = (tabId) => {
    switch (tabId) {
      case 'revenue': return 'text-rose-500 border-rose-500';
      case 'customer': return 'text-blue-500 border-blue-500';
      case 'store': return 'text-emerald-500 border-emerald-500';
      case 'delivery': return 'text-indigo-500 border-indigo-500';
      case 'marketing': return 'text-purple-500 border-purple-500';
      case 'forecast': return 'text-amber-500 border-amber-500';
      default: return 'text-[var(--primary)] border-[var(--primary)]';
    }
  };

  const tabs = [
    { id: 'revenue', name: 'Revenue Growth', icon: DollarSign },
    { id: 'customer', name: 'Customer Growth', icon: Users },
    { id: 'store', name: 'Store Growth', icon: Store },
    { id: 'delivery', name: 'Delivery Growth', icon: Bike },
    { id: 'marketing', name: 'Marketing Impact', icon: Megaphone },
    { id: 'forecast', name: 'AI Forecasting', icon: Sparkles }
  ];

  const COLORS = ['#a43c12', '#ff7f50', '#f59e0b', '#10b981', '#6366f1', '#8b5cf6'];

  return (
    <div className="fixed inset-0 lg:left-[280px] z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="w-full max-w-[1400px] bg-zinc-50 dark:bg-zinc-950 rounded-2xl shadow-2xl flex flex-col relative border border-zinc-200 dark:border-zinc-800 max-h-[94vh] overflow-hidden my-auto font-semibold text-xs text-zinc-800 dark:text-zinc-200">
        
        {/* Modal Header */}
        <header className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white dark:bg-zinc-900 z-20 rounded-t-2xl shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-black">
              <TrendingUp size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-black dark:text-white uppercase tracking-wider">
                Growth report detail explorer
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px] font-bold text-zinc-400">
                <span>Report ID: <strong className="text-zinc-700 dark:text-zinc-300">{reportId}</strong></span>
                <span>•</span>
                <span>Period: <strong className="text-zinc-700 dark:text-zinc-300">{data?.period || 'Loading...'}</strong></span>
                <span>•</span>
                <span>Generated At: <strong className="text-zinc-700 dark:text-zinc-300">{data?.generatedAt}</strong></span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 cursor-pointer shrink-0 transition-colors"
          >
            <X size={16} />
          </button>
        </header>

        {/* Tab Selection */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0 overflow-x-auto scrollbar-none shadow-inner z-10">
          {tabs.map((t) => {
            const TabIcon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-5 py-3.5 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  isActive
                    ? `bg-[var(--primary)]/[0.02] font-black ${getTabColor(t.id)}`
                    : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                <TabIcon size={13} className={isActive ? '' : 'text-zinc-400'} />
                {t.name}
              </button>
            );
          })}
        </div>

        {/* Modal Scrollable Box */}
        <main className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="p-10 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-xl" />
                ))}
              </div>
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
          ) : (
            <>
              {/* Tab 1: Revenue Growth */}
              {activeTab === 'revenue' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
                    {[
                      { title: 'Total Revenue', val: formatCurrency(data.revenue?.cards.revenue), desc: 'Aggregated gross sales', color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/20' },
                      { title: 'Net Profit', val: formatCurrency(data.revenue?.cards.profit), desc: 'Pre-tax localized earnings', color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' },
                      { title: 'Taxes Collected', val: formatCurrency(data.revenue?.cards.taxes), desc: '5% GST/SGST component', color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20' },
                      { title: 'Refund Settlements', val: formatCurrency(data.revenue?.cards.refunds), desc: 'Disputed chargebacks', color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/20' },
                      { title: 'Net Growth %', val: `+${data.revenue?.cards.netGrowth}%`, desc: 'Month-on-Month gain', color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/20' }
                    ].map((card, idx) => (
                      <div key={idx} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl shadow-sm">
                        <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">{card.title}</span>
                        <h3 className={`text-base font-black mt-2 leading-none ${card.color.split(' ')[0]}`}>{card.val}</h3>
                        <p className="text-[8.5px] text-zinc-400 font-bold mt-1.5 uppercase tracking-wide">{card.desc}</p>
                      </div>
                    ))}
                  </div>

                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-sm min-h-[300px] flex flex-col justify-between">
                    <div>
                      <h4 className="text-[10px] font-black text-zinc-550 dark:text-zinc-450 uppercase tracking-widest">Fulfillment Revenue & Profits Breakdown</h4>
                      <p className="text-[9px] text-zinc-400 mt-0.5">Correlation mapping: Total billing vs realized margins</p>
                    </div>
                    <div className="h-64 w-full mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.revenue?.chart} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="detRevenue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="name" stroke="#a1a1aa" fontSize={8} tickLine={false} axisLine={false} />
                          <YAxis stroke="#a1a1aa" fontSize={8} tickLine={false} axisLine={false} tickFormatter={formatCurrency} />
                          <RechartsTooltip formatter={(v) => [formatCurrency(v)]} />
                          <Legend wrapperStyle={{ fontSize: 9, fontWeight: 700 }} />
                          <Area type="monotone" name="Gross Revenue" dataKey="revenue" stroke="#ef4444" strokeWidth={2.5} fillOpacity={1} fill="url(#detRevenue)" />
                          <Line type="monotone" name="Net Profit Margins" dataKey="profit" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Customer Growth */}
              {activeTab === 'customer' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                    {[
                      { title: 'New Customer Signups', val: data.customer?.cards.newCustomers, desc: 'Registered new user tokens', color: 'text-blue-505 bg-blue-50 dark:bg-blue-950/20' },
                      { title: 'User Retention Rate', val: `${data.customer?.cards.retentionRate}%`, desc: 'Repeat orders percentage', color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' },
                      { title: 'Cohort Churn Rate', val: `${data.customer?.cards.churnRate}%`, desc: 'Inactive users index', color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/20' },
                      { title: 'Customer Lifetime Value', val: formatCurrency(data.customer?.cards.lifetimeValue), desc: 'Est. individual wallet share', color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/20' }
                    ].map((card, idx) => (
                      <div key={idx} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl shadow-sm">
                        <span className="text-[9px] font-bold text-zinc-550 dark:text-zinc-450 uppercase tracking-wider block">{card.title}</span>
                        <h3 className="text-base font-black text-black dark:text-white mt-2 leading-none">{card.val}</h3>
                        <p className="text-[8.5px] text-zinc-400 font-bold mt-1.5 uppercase tracking-wide">{card.desc}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-sm flex flex-col justify-between">
                      <div>
                        <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">New vs Returning Customers</h4>
                        <p className="text-[9px] text-zinc-400 mt-0.5">Fulfillment split of customer retention</p>
                      </div>
                      <div className="h-60 w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={data.customer?.acquisitionChart} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                            <XAxis dataKey="name" stroke="#a1a1aa" fontSize={8} tickLine={false} axisLine={false} />
                            <YAxis stroke="#a1a1aa" fontSize={8} tickLine={false} axisLine={false} />
                            <RechartsTooltip />
                            <Legend wrapperStyle={{ fontSize: 9, fontWeight: 700 }} />
                            <Bar name="New Signups" dataKey="new" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                            <Bar name="Returning Users" dataKey="returning" fill="#10b981" radius={[3, 3, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-sm flex flex-col justify-between">
                      <div>
                        <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Cohort Retention Curve</h4>
                        <p className="text-[9px] text-zinc-400 mt-0.5">Aggregated percentage of active accounts over 6 months</p>
                      </div>
                      <div className="h-60 w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={data.customer?.retentionCurve} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                            <defs>
                              <linearGradient id="curveColor" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="name" stroke="#a1a1aa" fontSize={8} tickLine={false} axisLine={false} />
                            <YAxis stroke="#a1a1aa" fontSize={8} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
                            <RechartsTooltip formatter={(v) => [`${v}%`]} />
                            <Area type="monotone" name="Retention %" dataKey="retention" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#curveColor)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Store Growth */}
              {activeTab === 'store' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                    {[
                      { title: 'New Store Openings', val: data.store?.cards.newStores, desc: 'Added during period', color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' },
                      { title: 'Decommissioned Outlets', val: data.store?.cards.closedStores, desc: 'Closed during period', color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/20' },
                      { title: 'Avg Store Billing', val: formatCurrency(data.store?.cards.avgStoreRevenue), desc: 'Average ticket size per outlet', color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/20' },
                      { title: 'Top Performing Store', val: data.store?.cards.topStore, desc: 'Highest grossing channel', color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20' }
                    ].map((card, idx) => (
                      <div key={idx} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl shadow-sm">
                        <span className="text-[9px] font-bold text-zinc-550 dark:text-zinc-450 uppercase tracking-wider block">{card.title}</span>
                        <h3 className="text-base font-black text-black dark:text-white mt-2 leading-none">{card.val}</h3>
                        <p className="text-[8.5px] text-zinc-400 font-bold mt-1.5 uppercase tracking-wide">{card.desc}</p>
                      </div>
                    ))}
                  </div>

                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-sm flex flex-col justify-between">
                    <div>
                      <h4 className="text-[10px] font-black text-zinc-550 dark:text-zinc-450 uppercase tracking-widest">Regional Store Counts & Revenues</h4>
                      <p className="text-[9px] text-zinc-400 mt-0.5">Geographic expansion performance index</p>
                    </div>
                    <div className="h-64 w-full mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.store?.regionalChart} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                          <XAxis dataKey="region" stroke="#a1a1aa" fontSize={8} tickLine={false} axisLine={false} />
                          <YAxis yAxisId="left" stroke="#a1a1aa" fontSize={8} tickLine={false} axisLine={false} />
                          <YAxis yAxisId="right" orientation="right" stroke="#a1a1aa" fontSize={8} tickLine={false} axisLine={false} tickFormatter={formatCurrency} />
                          <RechartsTooltip />
                          <Legend wrapperStyle={{ fontSize: 9, fontWeight: 700 }} />
                          <Bar yAxisId="left" name="Store Count" dataKey="count" fill="#10b981" maxBarSize={30} radius={[3, 3, 0, 0]} />
                          <Bar yAxisId="right" name="Revenue Contributed" dataKey="revenue" fill="#6366f1" maxBarSize={30} radius={[3, 3, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Delivery Growth */}
              {activeTab === 'delivery' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                    {[
                      { title: 'Total Riders Enlisted', val: data.delivery?.cards.totalRiders, desc: 'Enlisted active couriers', color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20' },
                      { title: 'Avg Order Transit Time', val: `${data.delivery?.cards.avgDeliveryTime} mins`, desc: 'Average fulfillment latency', color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20' },
                      { title: 'Completion Index', val: `${data.delivery?.cards.completionRate}%`, desc: 'Dispatched vs completed orders', color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' },
                      { title: 'Guest Review Ratings', val: `${data.delivery?.cards.customerRating} ★`, desc: 'Customer courier feedback rating', color: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-950/20' }
                    ].map((card, idx) => (
                      <div key={idx} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl shadow-sm">
                        <span className="text-[9px] font-bold text-zinc-550 dark:text-zinc-450 uppercase tracking-wider block">{card.title}</span>
                        <h3 className="text-base font-black text-black dark:text-white mt-2 leading-none">{card.val}</h3>
                        <p className="text-[8.5px] text-zinc-400 font-bold mt-1.5 uppercase tracking-wide">{card.desc}</p>
                      </div>
                    ))}
                  </div>

                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-sm flex flex-col justify-between">
                    <div>
                      <h4 className="text-[10px] font-black text-zinc-555 dark:text-zinc-450 uppercase tracking-widest">Rider Fleet Expansion & Speed Performance</h4>
                      <p className="text-[9px] text-zinc-455 mt-0.5">Tracking enforcements latency index</p>
                    </div>
                    <div className="h-64 w-full mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data.delivery?.trendChart} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                          <XAxis dataKey="name" stroke="#a1a1aa" fontSize={8} tickLine={false} axisLine={false} />
                          <YAxis yAxisId="left" stroke="#a1a1aa" fontSize={8} tickLine={false} axisLine={false} />
                          <YAxis yAxisId="right" orientation="right" stroke="#a1a1aa" fontSize={8} tickLine={false} axisLine={false} tickFormatter={v => `${v}m`} />
                          <RechartsTooltip />
                          <Legend wrapperStyle={{ fontSize: 9, fontWeight: 700 }} />
                          <Line yAxisId="left" type="monotone" name="Active Couriers" dataKey="riders" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3 }} />
                          <Line yAxisId="right" type="monotone" name="Avg Transit Time" dataKey="time" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 5: Marketing Impact */}
              {activeTab === 'marketing' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                    {[
                      { title: 'Campaigns Total Revenue', val: formatCurrency(data.marketing?.cards.campaignRevenue), desc: 'Revenues linked to promotions', color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/20' },
                      { title: 'Coupon Claims Count', val: data.marketing?.cards.couponUsage?.toLocaleString(), desc: 'Claimed discount code instances', color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/20' },
                      { title: 'Marketing ROI Index', val: `${data.marketing?.cards.roi}%`, desc: 'Net return on ad spends', color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' },
                      { title: 'Conversion Rate', val: `${data.marketing?.cards.conversionRate}%`, desc: 'Banner click-to-orders index', color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20' }
                    ].map((card, idx) => (
                      <div key={idx} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl shadow-sm">
                        <span className="text-[9px] font-bold text-zinc-550 dark:text-zinc-450 uppercase tracking-wider block">{card.title}</span>
                        <h3 className="text-base font-black text-black dark:text-white mt-2 leading-none">{card.val}</h3>
                        <p className="text-[8.5px] text-zinc-400 font-bold mt-1.5 uppercase tracking-wide">{card.desc}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-sm flex flex-col justify-between">
                      <div>
                        <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Campaign Performance Index</h4>
                        <p className="text-[9px] text-zinc-400 mt-0.5">Comparing spendings against realized margins</p>
                      </div>
                      <div className="h-60 w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={data.marketing?.campaignChart} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                            <XAxis dataKey="campaign" stroke="#a1a1aa" fontSize={8} tickLine={false} axisLine={false} />
                            <YAxis stroke="#a1a1aa" fontSize={8} tickLine={false} axisLine={false} tickFormatter={formatCurrency} />
                            <RechartsTooltip formatter={(v) => [formatCurrency(v)]} />
                            <Legend wrapperStyle={{ fontSize: 9, fontWeight: 700 }} />
                            <Bar name="Ad Spend" dataKey="spend" fill="#a43c12" radius={[3, 3, 0, 0]} />
                            <Bar name="Sales Return" dataKey="returnVal" fill="#10b981" radius={[3, 3, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-sm flex flex-col justify-between">
                      <div>
                        <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Promo Coupon Impact Ledger</h4>
                        <p className="text-[9px] text-zinc-400 mt-0.5">Top promo discount code usage split</p>
                      </div>
                      <div className="h-60 w-full mt-4 overflow-y-auto">
                        <table className="w-full text-left text-xs divide-y divide-zinc-200 dark:divide-zinc-800">
                          <thead className="bg-zinc-550/5 text-zinc-550 font-bold uppercase tracking-wider text-[8.5px]">
                            <tr>
                              <th className="px-3 py-2">Coupon ID</th>
                              <th className="px-3 py-2 text-right">Redeemed Count</th>
                              <th className="px-3 py-2 text-right">Discount Absorb</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850 font-semibold text-zinc-800 dark:text-zinc-200">
                            {data.marketing?.couponImpact.map((item, idx) => (
                              <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/10">
                                <td className="px-3 py-2 font-mono text-[9.5px] text-[var(--primary)] font-black">{item.coupon}</td>
                                <td className="px-3 py-2 text-right font-mono font-bold">{item.count.toLocaleString()} claims</td>
                                <td className="px-3 py-2 text-right font-mono font-black text-rose-500">{formatCurrency(item.discount)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 6: AI Forecasting */}
              {activeTab === 'forecast' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                    {[
                      { title: 'Predicted Total Revenue', val: formatCurrency(data.forecast?.cards.predictedRevenue), desc: 'Est. next 30 days margins', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/20' },
                      { title: 'Predicted Order Inflow', val: `${data.forecast?.cards.predictedOrders?.toLocaleString()} orders`, desc: 'Estimated order density', color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20' },
                      { title: 'Predicted Customers Acq.', val: `${data.forecast?.cards.predictedCustomers?.toLocaleString()} users`, desc: 'Expected customer inflow', color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/20' },
                      { title: 'Model Accuracy Score', val: `${data.forecast?.cards.confidenceScore}%`, desc: 'ML models confidence rating', color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' }
                    ].map((card, idx) => (
                      <div key={idx} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl shadow-sm">
                        <span className="text-[9px] font-bold text-zinc-550 dark:text-zinc-450 uppercase tracking-wider block">{card.title}</span>
                        <h3 className="text-base font-black text-black dark:text-white mt-2 leading-none">{card.val}</h3>
                        <p className="text-[8.5px] text-zinc-400 font-bold mt-1.5 uppercase tracking-wide">{card.desc}</p>
                      </div>
                    ))}
                  </div>

                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-sm min-h-[300px] flex flex-col justify-between">
                    <div>
                      <h4 className="text-[10px] font-black text-zinc-550 dark:text-zinc-450 uppercase tracking-widest">Actual vs Predicted Growth Projections</h4>
                      <p className="text-[9px] text-zinc-400 mt-0.5">Model forecasts mapping against historical timelines</p>
                    </div>
                    <div className="h-64 w-full mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data.forecast?.chart} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                          <XAxis dataKey="name" stroke="#a1a1aa" fontSize={8} tickLine={false} axisLine={false} />
                          <YAxis stroke="#a1a1aa" fontSize={8} tickLine={false} axisLine={false} tickFormatter={formatCurrency} />
                          <RechartsTooltip formatter={(v) => [formatCurrency(v)]} />
                          <Legend wrapperStyle={{ fontSize: 9, fontWeight: 700 }} />
                          <Line type="monotone" name="Actual Performance" dataKey="actual" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
                          <Line type="monotone" name="AI Predicted Path" dataKey="predicted" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>

        {/* Modal Footer */}
        <footer className="p-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50 rounded-b-2xl shrink-0 shadow-inner">
          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest hidden sm:inline">
            Papa Veg Pizza Growth Reports Analytics Terminal
          </span>
          <button
            onClick={onClose}
            className="px-5 py-1.5 bg-zinc-900 dark:bg-zinc-800 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:opacity-95 transition-opacity cursor-pointer shadow"
          >
            Close Details
          </button>
        </footer>

      </div>
    </div>
  );
}
