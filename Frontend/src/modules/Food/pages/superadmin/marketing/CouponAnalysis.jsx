import React, { useState } from 'react';
import { 
  Calendar, ChevronDown, Download, Zap, Ticket, TrendingUp, 
  Banknote, Gift, TrendingDown, ShoppingBasket, MoreVertical, User
} from 'lucide-react';

export default function CouponAnalysis() {
  const [hoveredBar, setHoveredBar] = useState(null);

  // Mock data for chart
  const bars = [40, 60, 45, 75, 95, 55, 85, 35, 50, 65];

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* Quick Filters & Bulk Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white dark:bg-zinc-900 p-3 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm">
        <div className="flex items-center gap-1.5 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-850 p-1.5 rounded-lg transition-colors">
          <Calendar size={14} className="text-black/50 dark:text-white/50" />
          <span className="text-xs font-bold text-black dark:text-white">Last 30 Days</span>
          <ChevronDown size={12} className="text-black/50 dark:text-white/50" />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs font-bold text-black/70 dark:text-white/70 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all">
            <Download size={12} /> Export
          </button>
        </div>
      </div>

      {/* KPI Cards Grid (Bento Style) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[10px] font-bold text-black dark:text-white uppercase tracking-wider">Total Uses</span>
            <h3 className="text-lg font-black text-black dark:text-white">12,842</h3>
            <p className="text-[10px] font-semibold flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 mt-0.5">
              <TrendingUp size={12} /> +14.2%
            </p>
          </div>
          <div className="p-1.5 bg-[var(--primary)]/10 text-[var(--primary)] rounded-lg shrink-0">
            <Ticket size={14} />
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[10px] font-bold text-black dark:text-white uppercase tracking-wider">Revenue</span>
            <h3 className="text-lg font-black text-black dark:text-white">₹84.2k</h3>
            <p className="text-[10px] font-semibold flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 mt-0.5">
              <TrendingUp size={12} /> +8.5%
            </p>
          </div>
          <div className="p-1.5 bg-[var(--primary)]/10 text-[var(--primary)] rounded-lg shrink-0">
            <Banknote size={14} />
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[10px] font-bold text-black dark:text-white uppercase tracking-wider">Discount Given</span>
            <h3 className="text-lg font-black text-black dark:text-white">₹12.4k</h3>
            <p className="text-[10px] font-semibold flex items-center gap-0.5 text-red-600 dark:text-red-400 mt-0.5">
              <TrendingDown size={12} /> -2.1%
            </p>
          </div>
          <div className="p-1.5 bg-[var(--primary)]/10 text-[var(--primary)] rounded-lg shrink-0">
            <Gift size={14} />
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[10px] font-bold text-black dark:text-white uppercase tracking-wider">AOV</span>
            <h3 className="text-lg font-black text-black dark:text-white">₹28.40</h3>
            <p className="text-[10px] font-semibold flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 mt-0.5">
              <TrendingUp size={12} /> +5.4%
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
            <h4 className="text-xs font-bold text-black dark:text-white">Daily Coupon Usage</h4>
            <button className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
              <MoreVertical size={14} className="text-black/50 dark:text-white/50" />
            </button>
          </div>
          <div className="h-36 relative flex items-end gap-1.5 px-1">
            {bars.map((height, i) => (
              <div 
                key={i}
                onMouseEnter={() => setHoveredBar(i)}
                onMouseLeave={() => setHoveredBar(null)}
                className={`flex-1 rounded-t transition-colors cursor-pointer ${
                  hoveredBar === i ? 'bg-[var(--primary)]' : 
                  height > 80 ? 'bg-[var(--primary)]' : 
                  'bg-[var(--primary)]/20 dark:bg-[var(--primary)]/40'
                }`}
                style={{ height: `${height}%` }}
              ></div>
            ))}
            
            {/* Chart Tooltip Simulation */}
            <div className={`absolute top-2 left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-[9px] px-1.5 py-0.5 rounded transition-opacity pointer-events-none shadow-lg ${hoveredBar !== null ? 'opacity-100' : 'opacity-0'}`}>
              Peak: 842 uses
            </div>
          </div>
          <div className="flex justify-between mt-3 text-[9px] text-black/50 dark:text-white/50 font-bold uppercase tracking-widest px-1">
            <span>Mon</span><span>Wed</span><span>Fri</span><span>Sun</span>
          </div>
        </div>

        {/* Revenue vs Customer Acquisition */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-xs font-bold text-black dark:text-white">New Customers Acquired</h4>
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
              <path d="M0 120 Q 50 100, 100 110 T 200 60 T 300 80 T 400 40" fill="none" stroke="var(--primary, #b41e15)" strokeWidth="3"></path>
              <path d="M0 140 Q 50 130, 100 135 T 200 110 T 300 120 T 400 90" fill="none" stroke="#71717a" strokeDasharray="4" strokeWidth="2"></path>
              <path d="M0 120 Q 50 100, 100 110 T 200 60 T 300 80 T 400 40 V 150 H 0 Z" fill="rgba(180, 30, 21, 0.05)"></path>
            </svg>
          </div>
          <div className="flex justify-between mt-3 text-[9px] text-black/50 dark:text-white/50 font-bold uppercase tracking-widest px-1">
            <span>Week 1</span><span>Week 2</span><span>Week 3</span><span>Week 4</span>
          </div>
        </div>
      </div>

      {/* Usage History (Dense Mobile List) */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50">
          <h4 className="text-xs font-bold text-black dark:text-white">Recent Usage History</h4>
          <button className="text-[var(--primary)] font-bold text-[10px] uppercase hover:underline">View All</button>
        </div>
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {[
            { name: "Marcus Holloway", order: "#PZ-2938", store: "Brooklyn", code: "PIZZA50", discount: "-₹14.50" },
            { name: "Sarah Connor", order: "#PZ-2940", store: "Manhattan", code: "FIRST10", discount: "-₹8.20" },
            { name: "James Wilson", order: "#PZ-2945", store: "Queens", code: "BOGO_MON", discount: "-₹22.00" },
            { name: "Elena Rodriguez", order: "#PZ-2948", store: "Bronx", code: "WEEKEND20", discount: "-₹12.00" }
          ].map((item, idx) => (
            <div key={idx} className="px-3 py-2 flex justify-between items-center hover:bg-zinc-50 dark:hover:bg-zinc-850/30 transition-colors group cursor-pointer">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-850 flex items-center justify-center border border-zinc-200 dark:border-zinc-700 shrink-0">
                  <User size={14} className="text-black/50 dark:text-white/50" />
                </div>
                <div>
                  <p className="text-xs font-bold text-black dark:text-white">{item.name}</p>
                  <p className="text-[10px] text-black/70 dark:text-white/70 mt-0.5">
                    Order <span className="font-mono">{item.order}</span> • Store: {item.store}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="inline-block px-1.5 py-0.5 rounded bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-[var(--primary)] text-[9px] font-bold mb-0.5">
                  {item.code}
                </div>
                <p className="text-xs font-bold text-red-600 dark:text-red-400">{item.discount}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="p-2.5 text-center">
          <button className="text-black/60 dark:text-white/60 text-[10px] font-bold opacity-60 hover:opacity-100 flex items-center justify-center w-full gap-1 transition-opacity">
            Load More <ChevronDown size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
