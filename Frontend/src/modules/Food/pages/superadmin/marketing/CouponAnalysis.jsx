import React, { useState, useEffect } from 'react';
import { 
  Calendar, ChevronDown, Download, Zap, Ticket, TrendingUp, 
  Banknote, Gift, TrendingDown, ShoppingBasket, MoreVertical, User,
  RefreshCw, Inbox
} from 'lucide-react';
import { api } from './CouponsData';
import { toast } from 'sonner';

export default function CouponAnalysis() {
  const [hoveredBar, setHoveredBar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('Last 30 Days');
  const [analytics, setAnalytics] = useState({
    totalUses: 0,
    revenue: 0,
    discountGiven: 0,
    aov: 0,
    activeCoupons: 0,
    expiredCoupons: 0,
    disabledCoupons: 0,
    dailyUsage: [
      { day: 'Mon', uses: 0, height: 0 },
      { day: 'Tue', uses: 0, height: 0 },
      { day: 'Wed', uses: 0, height: 0 },
      { day: 'Thu', uses: 0, height: 0 },
      { day: 'Fri', uses: 0, height: 0 },
      { day: 'Sat', uses: 0, height: 0 },
      { day: 'Sun', uses: 0, height: 0 }
    ],
    recentUsageHistory: []
  });

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const data = await api.getCouponAnalytics();
      if (data) {
        setAnalytics(prev => ({
          ...prev,
          ...data,
          dailyUsage: data.dailyUsage || prev.dailyUsage,
          recentUsageHistory: data.recentUsageHistory || []
        }));
      }
    } catch (err) {
      console.error("Error fetching coupon analytics:", err);
      toast.error('Failed to load performance analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const dailyBars = analytics.dailyUsage && analytics.dailyUsage.length > 0 
    ? analytics.dailyUsage 
    : [
        { day: 'Mon', uses: 0, height: 0 },
        { day: 'Tue', uses: 0, height: 0 },
        { day: 'Wed', uses: 0, height: 0 },
        { day: 'Thu', uses: 0, height: 0 },
        { day: 'Fri', uses: 0, height: 0 },
        { day: 'Sat', uses: 0, height: 0 },
        { day: 'Sun', uses: 0, height: 0 }
      ];

  const maxUses = Math.max(...dailyBars.map(b => b.uses || 0), 0);

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* Quick Filters & Bulk Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white dark:bg-zinc-900 p-3 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-850 p-1.5 rounded-lg transition-colors border border-zinc-200 dark:border-zinc-800">
            <Calendar size={14} className="text-zinc-500 dark:text-zinc-400" />
            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{timeRange}</span>
            <ChevronDown size={12} className="text-zinc-500 dark:text-zinc-400" />
          </div>
          <button 
            onClick={fetchAnalytics}
            disabled={loading}
            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors cursor-pointer"
            title="Refresh Analytics"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={() => toast.info('Exporting coupon analytics data...')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all cursor-pointer"
          >
            <Download size={12} /> Export Report
          </button>
        </div>
      </div>

      {/* KPI Cards Grid (Bento Style) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Uses */}
        <div className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Total Uses</span>
            <h3 className="text-lg font-black text-black dark:text-white font-mono">
              {loading ? '-' : (analytics.totalUses || 0).toLocaleString('en-IN')}
            </h3>
            <p className="text-[10px] font-semibold flex items-center gap-0.5 text-zinc-400 mt-0.5">
              Across live campaigns
            </p>
          </div>
          <div className="p-1.5 bg-[var(--primary)]/10 text-[var(--primary)] rounded-lg shrink-0">
            <Ticket size={14} />
          </div>
        </div>

        {/* Revenue */}
        <div className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Revenue</span>
            <h3 className="text-lg font-black text-black dark:text-white font-mono">
              {loading ? '-' : `₹${(analytics.revenue || 0).toLocaleString('en-IN')}`}
            </h3>
            <p className="text-[10px] font-semibold flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 mt-0.5">
              <TrendingUp size={12} /> ROI return
            </p>
          </div>
          <div className="p-1.5 bg-[var(--primary)]/10 text-[var(--primary)] rounded-lg shrink-0">
            <Banknote size={14} />
          </div>
        </div>

        {/* Discount Given */}
        <div className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Discount Given</span>
            <h3 className="text-lg font-black text-black dark:text-white font-mono">
              {loading ? '-' : `₹${(analytics.discountGiven || 0).toLocaleString('en-IN')}`}
            </h3>
            <p className="text-[10px] font-semibold flex items-center gap-0.5 text-rose-500 mt-0.5">
              Out of promo budget
            </p>
          </div>
          <div className="p-1.5 bg-[var(--primary)]/10 text-[var(--primary)] rounded-lg shrink-0">
            <Gift size={14} />
          </div>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">AOV</span>
            <h3 className="text-lg font-black text-black dark:text-white font-mono">
              {loading ? '-' : `₹${(analytics.aov || 0).toLocaleString('en-IN')}`}
            </h3>
            <p className="text-[10px] font-semibold flex items-center gap-0.5 text-zinc-400 mt-0.5">
              Per redemptions
            </p>
          </div>
          <div className="p-1.5 bg-[var(--primary)]/10 text-[var(--primary)] rounded-lg shrink-0">
            <ShoppingBasket size={14} />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Daily Usage Chart */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="text-xs font-bold text-black dark:text-white">Daily Coupon Usage</h4>
              <p className="text-[10px] text-zinc-400 mt-0.5">Redemption trajectory over the past week</p>
            </div>
          </div>
          
          <div className="h-36 relative flex items-end gap-2 px-2 border-b border-zinc-150 dark:border-zinc-800 pb-1">
            {dailyBars.map((bar, i) => {
              const barHeightPct = maxUses > 0 ? Math.max(8, Math.round((bar.uses / maxUses) * 100)) : 8;
              return (
                <div 
                  key={i}
                  onMouseEnter={() => setHoveredBar(i)}
                  onMouseLeave={() => setHoveredBar(null)}
                  className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer"
                >
                  <div 
                    className={`w-full rounded-t transition-all ${
                      hoveredBar === i ? 'bg-[var(--primary)]' : 
                      bar.uses > 0 ? 'bg-[var(--primary)]/70' : 
                      'bg-zinc-200 dark:bg-zinc-800'
                    }`}
                    style={{ height: `${barHeightPct}%` }}
                  ></div>
                  
                  {/* Tooltip */}
                  {hoveredBar === i && (
                    <div className="absolute -top-7 bg-zinc-900 text-white text-[9px] px-2 py-0.5 rounded shadow-lg whitespace-nowrap z-10 pointer-events-none">
                      {bar.day}: {bar.uses || 0} uses
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-3 text-[9px] text-black/50 dark:text-white/50 font-bold uppercase tracking-widest px-2">
            {dailyBars.map(b => (
              <span key={b.day}>{b.day}</span>
            ))}
          </div>
        </div>

        {/* Revenue vs Customer Acquisition */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="text-xs font-bold text-black dark:text-white">New Customers Acquired</h4>
              <p className="text-[10px] text-zinc-400 mt-0.5">Promo impact on new user acquisition</p>
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]"></div>
                <span className="text-[9px] text-black/50 dark:text-white/50 font-bold uppercase">REVENUE</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-500"></div>
                <span className="text-[9px] text-black/50 dark:text-white/50 font-bold uppercase">CUSTOMERS</span>
              </div>
            </div>
          </div>
          <div className="h-36 flex items-center justify-center relative">
            <svg className="w-full h-full" viewBox="0 0 400 150" preserveAspectRatio="none">
              <path d="M0 135 Q 100 130, 200 120 T 400 110" fill="none" stroke="var(--primary, #b41e15)" strokeWidth="2.5"></path>
              <path d="M0 145 Q 100 140, 200 135 T 400 125" fill="none" stroke="#71717a" strokeDasharray="4" strokeWidth="1.5"></path>
              <path d="M0 135 Q 100 130, 200 120 T 400 110 V 150 H 0 Z" fill="rgba(180, 30, 21, 0.04)"></path>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-[10px] text-zinc-400 font-semibold bg-white/80 dark:bg-zinc-900/80 px-2 py-1 rounded border border-zinc-150 dark:border-zinc-800 backdrop-blur-xs">
                Awaiting initial transaction volumes
              </span>
            </div>
          </div>
          <div className="flex justify-between mt-3 text-[9px] text-black/50 dark:text-white/50 font-bold uppercase tracking-widest px-1">
            <span>Week 1</span><span>Week 2</span><span>Week 3</span><span>Week 4</span>
          </div>
        </div>
      </div>

      {/* Usage History (Real Ledger List) */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50">
          <div>
            <h4 className="text-xs font-bold text-black dark:text-white">Recent Usage History</h4>
            <p className="text-[10px] text-zinc-400 mt-0.5">Live transactions with applied coupons</p>
          </div>
          <span className="text-[10px] font-bold text-zinc-400 font-mono">
            {analytics.recentUsageHistory?.length || 0} Records
          </span>
        </div>
        
        {analytics.recentUsageHistory && analytics.recentUsageHistory.length > 0 ? (
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {analytics.recentUsageHistory.map((item, idx) => (
              <div key={idx} className="px-3 py-2 flex justify-between items-center hover:bg-zinc-50 dark:hover:bg-zinc-850/30 transition-colors group">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-850 flex items-center justify-center border border-zinc-200 dark:border-zinc-700 shrink-0">
                    <User size={14} className="text-zinc-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-black dark:text-white">{item.customerName || 'Customer'}</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      Order <span className="font-mono">{item.orderId || '#ORD'}</span> • Store: {item.storeName || 'Store'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="inline-block px-1.5 py-0.5 rounded bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-[var(--primary)] text-[9px] font-bold mb-0.5">
                    {item.couponCode || 'PROMO'}
                  </div>
                  <p className="text-xs font-bold text-red-600 dark:text-red-400 font-mono">-₹{item.discountAmount || 0}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 px-4 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mb-2.5">
              <Inbox size={22} />
            </div>
            <h5 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">No coupon redemptions recorded yet</h5>
            <p className="text-[10.5px] text-zinc-500 max-w-sm mt-1 leading-relaxed">
              When customers redeem coupons during checkout, their verified orders, discount amounts, and outlet metrics will populate here automatically.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
