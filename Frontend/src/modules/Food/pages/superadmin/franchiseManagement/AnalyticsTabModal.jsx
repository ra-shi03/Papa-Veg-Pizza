import React, { useState } from "react";
import { X, LineChart, BarChart2, TrendingUp, Calendar, ShoppingBag, CreditCard, Users, Clock, Award } from "lucide-react";

export default function AnalyticsTabModal({ isOpen, onClose, store }) {
  const [timeRange, setTimeRange] = useState("7 Days");

  if (!isOpen) return null;

  const storeName = store?.name || "Connaught Place Central";

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-3 lg:pl-[280px]">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-4xl h-[85vh] md:h-[600px] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95">
        
        {/* Header */}
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-55 dark:bg-zinc-950 shrink-0">
          <div>
            <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-1.5">
              <BarChart2 size={14} className="text-red-650" />
              Store Analytics: {storeName}
            </h3>
            <p className="text-zinc-500 text-[10px] font-semibold mt-0.5">
              Detailed performance metrics, operational efficiency, and transaction trends.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full text-zinc-500 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Time Filters Sub-bar */}
        <div className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <span className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-wider">Historical Timeframe</span>
          <div className="inline-flex p-0.5 bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-750 rounded-lg text-[10px] font-bold">
            {["Today", "7 Days", "30 Days", "Custom Range"].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded transition-all ${
                  timeRange === range
                    ? "bg-red-650 text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-350"
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Analytics Dashboard Grid */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50 dark:bg-zinc-950 scrollbar-thin">
          
          {/* Key Metrics Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <p className="text-[9px] font-bold text-zinc-500 uppercase">Gross Revenue</p>
              <h4 className="text-base font-black text-zinc-900 dark:text-zinc-100 mt-1">₹ 2,45,800</h4>
              <span className="text-emerald-500 text-[8px] font-bold">+12.4% vs last period</span>
            </div>
            <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <p className="text-[9px] font-bold text-zinc-500 uppercase">Average Order Value</p>
              <h4 className="text-base font-black text-zinc-900 dark:text-zinc-100 mt-1">₹ 652.00</h4>
              <span className="text-emerald-500 text-[8px] font-bold">+3.2% vs last period</span>
            </div>
            <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <p className="text-[9px] font-bold text-zinc-500 uppercase">Completed Orders</p>
              <h4 className="text-base font-black text-zinc-900 dark:text-zinc-100 mt-1">376</h4>
              <span className="text-red-500 text-[8px] font-bold">-1.5% vs last period</span>
            </div>
            <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <p className="text-[9px] font-bold text-zinc-500 uppercase">Preparation Speed</p>
              <h4 className="text-base font-black text-zinc-900 dark:text-zinc-100 mt-1">14.2 min</h4>
              <span className="text-emerald-500 text-[8px] font-bold">Fastest 5% in Region</span>
            </div>
          </div>

          {/* Charts Row 1: Revenue & Orders Trends */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Revenue Trend Chart */}
            <div className="bg-white dark:bg-zinc-900 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 mb-3 uppercase tracking-wider flex items-center gap-1">
                <CreditCard size={12} className="text-red-650" />
                Revenue Trend (₹)
              </h4>
              <div className="h-32 flex items-end gap-1.5 border-b border-l border-zinc-200 dark:border-zinc-800 px-2 pb-1.5">
                {[30, 45, 38, 55, 62, 70, 65, 80, 78, 92, 85, 100].map((h, i) => (
                  <div key={i} className="flex-1 bg-red-650/20 hover:bg-red-650 rounded-t transition-all cursor-pointer group relative" style={{ height: `${h}%` }}>
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[8px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap shadow font-bold">
                      ₹ {(h * 150).toLocaleString("en-IN")}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[8px] font-bold text-zinc-500 mt-1 uppercase px-1">
                <span>01 Jun</span><span>10 Jun</span><span>20 Jun</span><span>30 Jun</span>
              </div>
            </div>

            {/* Orders Trend Chart */}
            <div className="bg-white dark:bg-zinc-900 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 mb-3 uppercase tracking-wider flex items-center gap-1">
                <ShoppingBag size={12} className="text-red-650" />
                Orders Volume Trend
              </h4>
              <div className="h-32 flex items-end gap-1.5 border-b border-l border-zinc-200 dark:border-zinc-800 px-2 pb-1.5">
                {[45, 50, 40, 60, 58, 65, 75, 70, 85, 80, 95, 90].map((h, i) => (
                  <div key={i} className="flex-1 bg-emerald-500/20 hover:bg-emerald-500 rounded-t transition-all cursor-pointer group relative" style={{ height: `${h}%` }}>
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[8px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap shadow font-bold">
                      {Math.round(h * 1.5)} Orders
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[8px] font-bold text-zinc-500 mt-1 uppercase px-1">
                <span>01 Jun</span><span>10 Jun</span><span>20 Jun</span><span>30 Jun</span>
              </div>
            </div>

          </div>

          {/* Charts Row 2: Hourly Sales, Status, Top Items */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Hourly Sales */}
            <div className="bg-white dark:bg-zinc-900 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 mb-3 uppercase tracking-wider flex items-center gap-1">
                <Clock size={12} className="text-red-650" />
                Hourly Sales (Peak)
              </h4>
              <div className="space-y-2 text-xs">
                {[
                  { hour: "12 PM - 2 PM (Lunch)", pct: "75%", color: "bg-red-650" },
                  { hour: "4 PM - 6 PM (Snack)", pct: "30%", color: "bg-zinc-400" },
                  { hour: "7 PM - 10 PM (Dinner)", pct: "95%", color: "bg-red-650" },
                  { hour: "10 PM - 12 AM (Late)", pct: "40%", color: "bg-zinc-400" }
                ].map((item, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="flex justify-between text-[9px] font-semibold text-zinc-500">
                      <span>{item.hour}</span>
                      <span className="font-bold text-zinc-800 dark:text-zinc-200">{item.pct} Peak</span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full`} style={{ width: item.pct }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Status Distribution */}
            <div className="bg-white dark:bg-zinc-900 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 mb-3 uppercase tracking-wider flex items-center gap-1">
                <Users size={12} className="text-red-650" />
                Order Distribution
              </h4>
              <div className="space-y-2.5 text-xs pt-1">
                <div className="flex justify-between items-center py-1 border-b border-zinc-100 dark:border-zinc-850">
                  <span className="flex items-center gap-1.5 font-semibold text-zinc-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Delivered
                  </span>
                  <span className="font-bold text-zinc-850 dark:text-zinc-200">92.5%</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-zinc-100 dark:border-zinc-850">
                  <span className="flex items-center gap-1.5 font-semibold text-zinc-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                    Cancelled
                  </span>
                  <span className="font-bold text-zinc-850 dark:text-zinc-200">3.8%</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-zinc-100 dark:border-zinc-850">
                  <span className="flex items-center gap-1.5 font-semibold text-zinc-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    Refunded
                  </span>
                  <span className="font-bold text-zinc-850 dark:text-zinc-200">2.1%</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-zinc-100 dark:border-zinc-850">
                  <span className="flex items-center gap-1.5 font-semibold text-zinc-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
                    Failed / Void
                  </span>
                  <span className="font-bold text-zinc-850 dark:text-zinc-200">1.6%</span>
                </div>
              </div>
            </div>

            {/* Top Selling Items */}
            <div className="bg-white dark:bg-zinc-900 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 mb-3 uppercase tracking-wider flex items-center gap-1">
                <Award size={12} className="text-red-650" />
                Top Items (Volume)
              </h4>
              <div className="space-y-2 text-xs">
                {[
                  { name: "Double Cheese Margherita", vol: 245, pct: "90%" },
                  { name: "Peppy Paneer Classic", vol: 180, pct: "70%" },
                  { name: "Farmhouse Fresh Veggie", vol: 154, pct: "60%" },
                  { name: "Spicy Capsicum & Onion", vol: 92, pct: "35%" }
                ].map((item, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="flex justify-between text-[9px] font-semibold text-zinc-500">
                      <span className="truncate max-w-[150px]">{item.name}</span>
                      <span className="font-bold text-zinc-800 dark:text-zinc-200">{item.vol} Sold</span>
                    </div>
                    <div className="h-1 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: item.pct }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-55 dark:bg-zinc-950 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 h-8.5 bg-zinc-850 dark:bg-zinc-750 text-white font-bold text-xs hover:opacity-90 transition-all rounded-lg"
          >
            Close Dashboard
          </button>
        </div>

      </div>
    </div>
  );
}
