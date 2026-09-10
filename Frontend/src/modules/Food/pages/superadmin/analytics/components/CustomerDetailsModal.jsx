import React, { useState } from 'react';
import {
  X,
  User,
  ShoppingBag,
  Star,
  Award,
  MapPin,
  Calendar,
  Mail,
  Phone,
  ArrowUpRight,
  TrendingUp,
  Tag,
  Users,
  Percent,
  Heart,
  ExternalLink
} from 'lucide-react';
import { Skeleton } from '../../../../components/ui/skeleton';
import { useCustomerDetail } from '../hooks/useCustomerQuery';

export default function CustomerDetailsModal({ isOpen, onClose, customerId }) {
  const [activeTab, setActiveTab] = useState('overview');
  const { profile, orders, reviews, loyalty, addresses, loading } = useCustomerDetail(customerId);

  if (!isOpen) return null;

  const formatCurrency = (val) => {
    if (val === undefined || val === null) return '₹0';
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const getTierColor = (tier) => {
    switch (tier?.toLowerCase()) {
      case 'platinum':
        return 'text-sky-600 bg-sky-50 dark:bg-sky-950/20 border-sky-200 dark:border-sky-850';
      case 'gold':
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-250 dark:border-yellow-850';
      case 'silver':
        return 'text-slate-650 bg-slate-50 dark:bg-slate-950/20 border-slate-200 dark:border-slate-800';
      default:
        return 'text-amber-700 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800';
    }
  };

  const getStatusColor = (status) => {
    if (status?.toLowerCase() === 'active') {
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200/30';
    }
    return 'bg-rose-500/10 text-rose-600 dark:text-rose-455 border border-rose-200/30';
  };

  const tabs = [
    { id: 'overview', name: 'Overview Profile', icon: User },
    { id: 'orders', name: 'Order Ledger', icon: ShoppingBag },
    { id: 'reviews', name: 'Product Feedback', icon: Star },
    { id: 'loyalty', name: 'Loyalty Account', icon: Award },
    { id: 'addresses', name: 'Saved Addresses', icon: MapPin }
  ];

  return (
    <div className="fixed inset-0 lg:left-[280px] z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="w-full max-w-[1400px] bg-zinc-50 dark:bg-zinc-950 rounded-2xl shadow-2xl flex flex-col relative border border-zinc-200 dark:border-zinc-800 max-h-[92vh] overflow-hidden my-auto">
        
        {/* Modal Header */}
        <header className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sticky top-0 bg-zinc-50 dark:bg-zinc-950 z-20 rounded-t-2xl">
          {loading ? (
            <div className="flex items-center gap-3">
              <Skeleton className="w-12 h-12 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative">
                {profile?.avatar ? (
                  <img
                    src={profile.avatar}
                    alt={profile.name}
                    className="w-12 h-12 rounded-full border-2 border-[var(--primary)] object-cover shadow-sm shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[var(--primary)] text-white flex items-center justify-center font-black text-sm uppercase shrink-0">
                    {profile?.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                )}
                <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-zinc-950 ${profile?.status?.toLowerCase() === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-black text-zinc-900 dark:text-zinc-50 truncate">
                    {profile?.name}
                  </h2>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border uppercase tracking-wider ${getTierColor(profile?.tier)}`}>
                    {profile?.tier}
                  </span>
                  <span className={`px-2 py-0.2 rounded text-[9px] font-extrabold uppercase ${getStatusColor(profile?.status)}`}>
                    {profile?.status}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-[10px] font-bold text-zinc-450 dark:text-zinc-400">
                  <span className="flex items-center gap-1"><Mail size={11} className="text-zinc-400" />{profile?.email}</span>
                  <span className="flex items-center gap-1"><Phone size={11} className="text-zinc-400" />{profile?.phone}</span>
                  <span className="flex items-center gap-1"><Calendar size={11} className="text-zinc-400" />Joined {profile?.joinedDate}</span>
                  <span className="font-mono text-[9px] bg-zinc-200 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-350 px-1.5 py-0.2 rounded">ID: {profile?.id}</span>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-250 dark:hover:bg-zinc-800 transition-colors text-zinc-500 shrink-0 self-end sm:self-auto cursor-pointer"
          >
            <X size={16} />
          </button>
        </header>

        {/* Custom Navigation Tab bar */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  isActive
                    ? 'border-[var(--primary)] text-[var(--primary)] bg-[var(--primary)]/[0.02]'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                <TabIcon size={12} className={isActive ? 'text-[var(--primary)]' : 'text-zinc-400'} />
                {tab.name}
              </button>
            );
          })}
        </div>

        {/* Modal Content Scrollbox */}
        <main className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <Skeleton key={idx} className="h-16 w-full rounded-xl" />
                ))}
              </div>
              <Skeleton className="h-40 w-full rounded-xl" />
            </div>
          ) : (
            <div className="animate-fade-in text-xs">
              
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  {/* Primary KPI Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { title: 'Total OrdersPlaced', val: profile?.overview?.totalOrders?.toLocaleString(), desc: 'Transactions volume', icon: ShoppingBag, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/20' },
                      { title: 'Lifetime Contribution', val: formatCurrency(profile?.overview?.totalRevenue), desc: 'Total wallet spend', icon: TrendingUp, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' },
                      { title: 'Average Order Basket', val: formatCurrency(profile?.overview?.averageSpend), desc: 'Average ticket size', icon: Award, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/20' },
                      { title: 'Customer Health Score', val: `${profile?.overview?.retentionScore || 0}%`, desc: 'Based on recurrence rate', icon: Heart, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/20' }
                    ].map((kpi, idx) => {
                      const Icon = kpi.icon;
                      return (
                        <div key={idx} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl shadow-sm hover:scale-[1.01] transition-transform">
                          <div className="flex justify-between items-start">
                            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest leading-none">{kpi.title}</span>
                            <span className={`p-1 rounded shrink-0 ${kpi.color}`}><Icon size={11} /></span>
                          </div>
                          <h3 className="text-sm font-black text-black dark:text-white mt-3 leading-none">
                            {kpi.val}
                          </h3>
                          <p className="text-[8px] text-zinc-400 font-bold mt-1 uppercase tracking-wide">{kpi.desc}</p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Secondary/Enrichment Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Retention Card */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 shadow-sm space-y-2">
                      <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Enrichment Metrics</h4>
                      <div className="divide-y divide-zinc-100 dark:divide-zinc-800 font-bold">
                        <div className="flex justify-between py-2 text-zinc-650 dark:text-zinc-350">
                          <span>Referral Signups generated:</span>
                          <span className="text-black dark:text-white font-extrabold">{profile?.overview?.referralCount || 0} users</span>
                        </div>
                        <div className="flex justify-between py-2 text-zinc-650 dark:text-zinc-350">
                          <span>Redeemed Coupons count:</span>
                          <span className="text-black dark:text-white font-extrabold">{profile?.overview?.couponUsage || 0} checkouts</span>
                        </div>
                        <div className="flex justify-between py-2 text-zinc-650 dark:text-zinc-350">
                          <span>Wishlist watchlist size:</span>
                          <span className="text-black dark:text-white font-extrabold">{profile?.overview?.wishlistItems || 0} products</span>
                        </div>
                        <div className="flex justify-between py-2 text-zinc-650 dark:text-zinc-350">
                          <span>Last checkout logged:</span>
                          <span className="text-black dark:text-white font-extrabold">{profile?.overview?.lastOrderDate || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Spend Trend Placeholder */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 shadow-sm md:col-span-2 flex flex-col justify-between">
                      <div>
                        <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Engagement Spark-line</h4>
                        <p className="text-[9px] text-zinc-400 font-semibold mt-0.5">Order amount fluctuation over last 5 active logs</p>
                      </div>
                      
                      <div className="h-28 w-full mt-4 flex items-end justify-between gap-2 px-2">
                        {[220, 480, 320, 590, 450].map((amt, idx) => {
                          const heightPct = (amt / 700) * 100;
                          return (
                            <div key={idx} className="flex-1 flex flex-col items-center group">
                              <span className="text-[8px] font-black text-[var(--primary)] opacity-0 group-hover:opacity-100 transition-opacity mb-1">
                                ₹{amt}
                              </span>
                              <div
                                className="w-full bg-[var(--primary)] bg-opacity-30 group-hover:bg-opacity-80 transition-all rounded-t cursor-pointer"
                                style={{ height: `${heightPct}px` }}
                              />
                              <span className="text-[8px] font-bold text-zinc-450 dark:text-zinc-450 mt-1 uppercase">
                                Log #{idx + 1}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: ORDER HISTORY */}
              {activeTab === 'orders' && (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs divide-y divide-zinc-200 dark:divide-zinc-800">
                    <thead className="bg-zinc-50 dark:bg-zinc-950/45 text-zinc-500 font-bold uppercase tracking-wider text-[9px]">
                      <tr>
                        <th className="px-4 py-2.5">Order ID</th>
                        <th className="px-4 py-2.5">Date</th>
                        <th className="px-4 py-2.5">Store Branch</th>
                        <th className="px-4 py-2.5">Items Purchased</th>
                        <th className="px-4 py-2.5 text-right">Amount</th>
                        <th className="px-4 py-2.5 text-center">Payment</th>
                        <th className="px-4 py-2.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850 font-semibold text-zinc-800 dark:text-zinc-200">
                      {orders?.map((ord, index) => (
                        <tr key={index} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/10 transition-colors">
                          <td className="px-4 py-2.5 font-mono text-[10px] text-zinc-500 dark:text-zinc-400">{ord.id}</td>
                          <td className="px-4 py-2.5 font-mono text-[10px]">{ord.date}</td>
                          <td className="px-4 py-2.5 truncate max-w-[150px]">{ord.store}</td>
                          <td className="px-4 py-2.5 truncate max-w-[240px]" title={ord.items}>{ord.items}</td>
                          <td className="px-4 py-2.5 text-right font-black text-emerald-600 dark:text-emerald-500">{formatCurrency(ord.amount)}</td>
                          <td className="px-4 py-2.5 text-center">
                            <span className="px-1.5 py-0.2 bg-zinc-100 dark:bg-zinc-800 rounded text-[9px] font-bold border border-zinc-200 dark:border-zinc-700">
                              {ord.paymentMethod}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-emerald-500/10 text-emerald-650 dark:text-emerald-400`}>
                              {ord.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {(!orders || orders.length === 0) && (
                        <tr>
                          <td colSpan="7" className="px-4 py-8 text-center text-zinc-400 italic">No checkout records logged for this user.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 3: REVIEWS */}
              {activeTab === 'reviews' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Summary Metric Card */}
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 shadow-sm flex flex-col justify-center items-center h-fit">
                    <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center mb-2 w-full">Feedback Summary</h4>
                    <div className="text-4xl font-black text-[var(--primary)] flex items-center gap-1.5">
                      4.5
                      <Star className="fill-current text-yellow-500 text-3xl" size={24} />
                    </div>
                    <p className="text-[9px] text-zinc-400 font-bold mt-1 uppercase tracking-wide">Average Rating score</p>
                    <div className="w-full border-t border-zinc-100 dark:border-zinc-800 mt-4 pt-3 flex justify-between text-[10px] font-bold text-zinc-500">
                      <span>Total reviews posted:</span>
                      <span className="text-black dark:text-white font-extrabold">{reviews?.length || 0} reviews</span>
                    </div>
                  </div>

                  {/* List of Reviews */}
                  <div className="md:col-span-2 space-y-2">
                    {reviews?.map((rev, index) => (
                      <div key={index} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 shadow-sm hover:border-zinc-350 dark:hover:border-zinc-700 transition-colors">
                        <div className="flex justify-between items-start gap-2 flex-wrap">
                          <span className="font-extrabold text-black dark:text-white truncate">{rev.product}</span>
                          <div className="flex items-center gap-1 font-mono text-[10px] text-zinc-500">
                            <span className="flex text-yellow-500">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} size={11} className={i < rev.rating ? 'fill-current' : 'opacity-20'} />
                              ))}
                            </span>
                            <span className="font-bold border-l border-zinc-200 dark:border-zinc-700 pl-1.5 ml-1">{rev.createdDate}</span>
                          </div>
                        </div>
                        <p className="text-zinc-650 dark:text-zinc-350 text-[11px] mt-2 italic font-semibold leading-relaxed border-l-2 border-[var(--primary)] pl-2">
                          "{rev.comment}"
                        </p>
                      </div>
                    ))}
                    {(!reviews || reviews.length === 0) && (
                      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 text-center text-zinc-400 italic">
                        No product reviews shared by this user.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: LOYALTY */}
              {activeTab === 'loyalty' && (
                <div className="space-y-4 animate-fade-in">
                  {/* Points Ledger statistics */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl shadow-sm">
                      <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block leading-none">Available Points Balance</span>
                      <h4 className="text-lg font-black text-[var(--primary)] mt-3 leading-none">{loyalty?.availablePoints?.toLocaleString()} pts</h4>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl shadow-sm">
                      <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block leading-none">Redeemed Wallet points</span>
                      <h4 className="text-lg font-black text-zinc-650 dark:text-zinc-350 mt-3 leading-none">{loyalty?.redeemedPoints?.toLocaleString()} pts</h4>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl shadow-sm">
                      <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block leading-none">Lifetime Earned Ledger</span>
                      <h4 className="text-lg font-black text-emerald-600 dark:text-emerald-500 mt-3 leading-none">{loyalty?.lifetimePoints?.toLocaleString()} pts</h4>
                    </div>
                  </div>

                  {/* Loyalty Progress Tracker */}
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-sm">
                    <div className="flex justify-between items-center mb-2 font-bold">
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Loyalty Progress Roadmap</span>
                      <span className="text-[10px] text-[var(--primary)] font-extrabold">{loyalty?.nextTierProgress}% to Next Tier</span>
                    </div>

                    {/* Progress slider bar */}
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2.5 overflow-hidden border border-zinc-200/50 dark:border-zinc-700/50">
                      <div className="bg-[var(--primary)] h-full transition-all duration-500" style={{ width: `${loyalty?.nextTierProgress || 0}%` }} />
                    </div>

                    {/* Tiers Markers */}
                    <div className="grid grid-cols-4 mt-2.5 text-[9px] font-black uppercase text-center text-zinc-400">
                      <div className="flex flex-col items-start border-l border-zinc-200 dark:border-zinc-800 pl-1">
                        <span className={loyalty?.currentTier?.toLowerCase() === 'bronze' ? 'text-[var(--primary)] font-extrabold' : ''}>Bronze</span>
                        <span className="text-[8px] font-semibold">Base tier</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className={loyalty?.currentTier?.toLowerCase() === 'silver' ? 'text-[var(--primary)] font-extrabold' : ''}>Silver</span>
                        <span className="text-[8px] font-semibold">1k pts requirement</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className={loyalty?.currentTier?.toLowerCase() === 'gold' ? 'text-[var(--primary)] font-extrabold' : ''}>Gold</span>
                        <span className="text-[8px] font-semibold">2.5k pts requirement</span>
                      </div>
                      <div className="flex flex-col items-end border-r border-zinc-200 dark:border-zinc-800 pr-1">
                        <span className={loyalty?.currentTier?.toLowerCase() === 'platinum' ? 'text-[var(--primary)] font-extrabold' : ''}>Platinum</span>
                        <span className="text-[8px] font-semibold">5k pts requirement</span>
                      </div>
                    </div>
                  </div>

                  {/* Ledger Details Table */}
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                    <div className="p-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 font-bold uppercase tracking-wider text-[9px] text-zinc-550">
                      Points Ledger transactions logs
                    </div>
                    <table className="w-full text-left text-xs divide-y divide-zinc-200 dark:divide-zinc-800">
                      <thead className="bg-zinc-50/20 dark:bg-zinc-950/30 text-zinc-550 font-bold uppercase tracking-wider text-[9px]">
                        <tr>
                          <th className="px-4 py-2.5">Date</th>
                          <th className="px-4 py-2.5">Source Description</th>
                          <th className="px-4 py-2.5 text-right">Points Earned</th>
                          <th className="px-4 py-2.5 text-right">Points Redeemed</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850 font-semibold text-zinc-800 dark:text-zinc-250">
                        {loyalty?.transactions?.map((t, index) => (
                          <tr key={index} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/10 transition-colors">
                            <td className="px-4 py-2.5 font-mono text-[10px] text-zinc-500 dark:text-zinc-450">{t.date}</td>
                            <td className="px-4 py-2.5">{t.source}</td>
                            <td className="px-4 py-2.5 text-right text-emerald-600 font-extrabold">{t.earned > 0 ? `+${t.earned}` : '-'}</td>
                            <td className="px-4 py-2.5 text-right text-rose-600 font-extrabold">{t.redeemed > 0 ? `-${t.redeemed}` : '-'}</td>
                          </tr>
                        ))}
                        {(!loyalty?.transactions || loyalty?.transactions?.length === 0) && (
                          <tr>
                            <td colSpan="4" className="px-4 py-8 text-center text-zinc-400 italic">No points ledger transactions recorded.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 5: ADDRESSES */}
              {activeTab === 'addresses' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses?.map((addr) => (
                    <div
                      key={addr.id}
                      className={`bg-white dark:bg-zinc-900 border rounded-xl p-4 shadow-sm relative transition-all group flex flex-col justify-between ${
                        addr.isDefault
                          ? 'border-[var(--primary)] ring-1 ring-[var(--primary)]/30'
                          : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-350 dark:hover:border-zinc-700'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <span className="font-extrabold text-xs text-black dark:text-white uppercase flex items-center gap-1">
                            <MapPin size={13} className="text-[var(--primary)]" />
                            {addr.type} Address
                          </span>
                          {addr.isDefault && (
                            <span className="bg-[var(--primary)]/10 text-[var(--primary)] text-[8px] font-black uppercase px-2 py-0.5 rounded tracking-wide border border-[var(--primary)]/20 shadow-sm">
                              DEFAULT SHIPMENT
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] font-semibold text-zinc-650 dark:text-zinc-300 leading-relaxed pt-1">
                          {addr.address}
                        </p>
                      </div>

                      <div className="border-t border-zinc-100 dark:border-zinc-800 mt-4 pt-3 grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] font-bold text-zinc-450 dark:text-zinc-450">
                        <div>City: <span className="text-black dark:text-white font-extrabold">{addr.city}</span></div>
                        <div>State: <span className="text-black dark:text-white font-extrabold">{addr.state}</span></div>
                        <div>Pincode: <span className="text-black dark:text-white font-mono font-extrabold">{addr.pincode}</span></div>
                        <div className="col-span-2 truncate">Landmark: <span className="text-black dark:text-white font-extrabold">{addr.landmark || 'None'}</span></div>
                      </div>
                    </div>
                  ))}
                  {(!addresses || addresses.length === 0) && (
                    <div className="col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 text-center text-zinc-400 italic">
                      No shipping/billing addresses cataloged.
                    </div>
                  )}
                </div>
              )}

            </div>
          )}
        </main>

        {/* Modal Footer */}
        <footer className="p-3 border-t border-zinc-200 dark:border-zinc-800 shrink-0 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50 rounded-b-2xl">
          <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-wide hidden sm:block">
            SaaS Audit Protocol Verified
          </div>
          <button
            onClick={onClose}
            className="px-5 py-1.5 bg-zinc-900 dark:bg-zinc-800 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:opacity-95 transition-opacity cursor-pointer shadow"
          >
            Close Profile
          </button>
        </footer>

      </div>
    </div>
  );
}
