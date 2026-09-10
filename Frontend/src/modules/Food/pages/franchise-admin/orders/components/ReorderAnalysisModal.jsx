import React from "react";
import { X, TrendingUp, RefreshCw, BarChart2, Award, Heart, ShoppingBag, ArrowRight } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useReorderAnalytics, useOrderDetails } from "../ordersQuery";

export default function ReorderAnalysisModal({ isOpen, onClose, orderId }) {
  const { data: analytics, isLoading: isAnalyticsLoading } = useReorderAnalytics(orderId);
  const { data: order, isLoading: isOrderLoading } = useOrderDetails(orderId);

  if (!isOpen) return null;

  const isLoading = isAnalyticsLoading || isOrderLoading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-[900px] h-[85vh] bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden animate-scale-up flex flex-col">
        {/* Header */}
        <header className="p-5 border-b border-zinc-100 dark:border-zinc-850 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
              <RefreshCw size={18} className="animate-spin-slow" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-50">
                Customer Reorder & Loyalty Analysis
              </h3>
              <p className="text-xs text-zinc-500 font-medium">
                Analyzing purchase behavior and upsell matching for {order?.customer?.name || "Customer"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400 hover:text-zinc-650 transition-colors"
          >
            <X size={18} />
          </button>
        </header>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-3 py-20">
              <div className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-semibold text-zinc-500">Compiling customer telemetry records...</p>
            </div>
          ) : !analytics ? (
            <div className="h-full flex flex-col items-center justify-center py-20 text-center space-y-2">
              <p className="text-sm font-bold text-zinc-500">No analytics data available for this order.</p>
            </div>
          ) : (
            <>
              {/* Top KPI Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl">
                  <div className="flex items-center justify-between mb-1.5 text-blue-600 dark:text-blue-450">
                    <span className="text-[10px] uppercase font-bold tracking-wider">Lifetime Orders</span>
                    <ShoppingBag size={14} />
                  </div>
                  <h4 className="text-xl font-black text-zinc-850 dark:text-zinc-100">{analytics.lifetimeOrders}</h4>
                  <p className="text-[10px] text-zinc-500 font-medium mt-1">
                    {analytics.previousOrderCount} previous + current
                  </p>
                </div>

                <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl">
                  <div className="flex items-center justify-between mb-1.5 text-emerald-600 dark:text-emerald-450">
                    <span className="text-[10px] uppercase font-bold tracking-wider">Average Ticket Size</span>
                    <TrendingUp size={14} />
                  </div>
                  <h4 className="text-xl font-black text-zinc-850 dark:text-zinc-100">₹{analytics.avgSpend}</h4>
                  <p className="text-[10px] text-zinc-500 font-medium mt-1">Per delivery checkout</p>
                </div>

                <div className="p-4 bg-violet-50/50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/30 rounded-xl">
                  <div className="flex items-center justify-between mb-1.5 text-violet-600 dark:text-violet-450">
                    <span className="text-[10px] uppercase font-bold tracking-wider">Order Frequency</span>
                    <RefreshCw size={14} />
                  </div>
                  <h4 className="text-base font-black text-zinc-850 dark:text-zinc-100 leading-tight">
                    {analytics.repeatFrequency}
                  </h4>
                  <p className="text-[10px] text-zinc-500 font-medium mt-1">Highly Active Loyalty Rank</p>
                </div>

                <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-xl">
                  <div className="flex items-center justify-between mb-1.5 text-amber-600 dark:text-amber-450">
                    <span className="text-[10px] uppercase font-bold tracking-wider">Favorite Category</span>
                    <Heart size={14} />
                  </div>
                  <h4 className="text-base font-black text-zinc-850 dark:text-zinc-100 leading-tight">
                    {analytics.favoriteCategory}
                  </h4>
                  <p className="text-[10px] text-zinc-500 font-medium mt-1">Preferred crusts & toppings</p>
                </div>
              </div>

              {/* Chart & Most Ordered Products */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Reorder Trend Chart */}
                <div className="lg:col-span-3 border border-zinc-100 dark:border-zinc-850 p-4 rounded-xl bg-zinc-50/30 dark:bg-zinc-900/10">
                  <div className="flex items-center gap-1.5 mb-4">
                    <BarChart2 size={15} className="text-blue-500" />
                    <h4 className="text-xs font-black text-zinc-850 dark:text-zinc-200">Monthly Order Volume</h4>
                  </div>
                  <div className="h-[220px] w-full text-[10px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                        <XAxis dataKey="month" tickLine={false} axisLine={false} stroke="#888888" />
                        <YAxis tickLine={false} axisLine={false} stroke="#888888" allowDecimals={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#fff",
                            border: "1px solid #e4e4e7",
                            borderRadius: "8px",
                            fontSize: "11px",
                            fontWeight: "bold",
                          }}
                        />
                        <Bar dataKey="orders" fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={25} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Most Ordered Products */}
                <div className="lg:col-span-2 border border-zinc-100 dark:border-zinc-850 p-4 rounded-xl flex flex-col bg-zinc-50/30 dark:bg-zinc-900/10">
                  <div className="flex items-center gap-1.5 mb-4">
                    <Award size={15} className="text-amber-500" />
                    <h4 className="text-xs font-black text-zinc-850 dark:text-zinc-200">Customer Favorites</h4>
                  </div>
                  <div className="flex-1 space-y-3">
                    {analytics.mostOrderedProducts.map((prod, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-lg flex items-center justify-between hover:shadow-xs transition-shadow"
                      >
                        <div>
                          <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{prod.name}</p>
                          <p className="text-[10px] text-zinc-500 font-medium mt-0.5">
                            Ordered <span className="text-[var(--primary)] font-bold">{prod.count} times</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-zinc-800 dark:text-zinc-250">₹{prod.spend}</p>
                          <p className="text-[9px] text-zinc-400 font-medium">Total spend</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Cross-Sell Recommendations */}
              <div className="border border-zinc-100 dark:border-zinc-850 p-4 rounded-xl">
                <div className="flex items-center gap-1.5 mb-3">
                  <ShoppingBag size={15} className="text-emerald-500" />
                  <h4 className="text-xs font-black text-zinc-850 dark:text-zinc-200">Recommended Upsell Matches</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analytics.recommendedUpsell.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-zinc-50/50 dark:bg-zinc-900/20 border border-zinc-100 dark:border-zinc-850 rounded-xl flex items-center gap-3 hover:border-[var(--primary)]/30 transition-all group"
                    >
                      <img
                        src={item.image}
                        alt={item.productName}
                        className="w-12 h-12 object-cover rounded-lg bg-zinc-150 border border-zinc-200/60"
                        onError={(e) => {
                          e.target.src = "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=100";
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-zinc-800 dark:text-zinc-250 truncate group-hover:text-[var(--primary)] transition-colors">
                          {item.productName}
                        </p>
                        <p className="text-[10px] text-zinc-500 font-bold mt-0.5">₹{item.price}</p>
                      </div>
                      <button className="p-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-350 rounded-lg group-hover:bg-[var(--primary)] group-hover:text-white group-hover:border-[var(--primary)] transition-all">
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <footer className="p-4 border-t border-zinc-100 dark:border-zinc-850 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-850 dark:hover:bg-zinc-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors active:scale-95"
          >
            Close Panel
          </button>
        </footer>
      </div>
    </div>
  );
}
