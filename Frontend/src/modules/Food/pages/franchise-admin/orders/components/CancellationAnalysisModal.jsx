import React from "react";
import { 
  X, TrendingUp, BarChart3, PieChart as PieIcon, Wallet, 
  Info, AlertTriangle, Activity 
} from "lucide-react";
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, 
  PieChart, Pie, Cell, BarChart, Bar 
} from "recharts";
import { useCancellationAnalytics } from "../ordersQuery";

export default function CancellationAnalysisModal({ isOpen, onClose }) {
  const { data: analyticsData, isLoading } = useCancellationAnalytics();

  if (!isOpen) return null;

  const kpis = analyticsData?.kpis || {};

  const getPriorityColor = (p) => {
    switch (p) {
      case "High": return "text-rose-600 bg-rose-50 dark:bg-rose-950/20 font-black";
      case "Medium": return "text-amber-600 bg-amber-50 dark:bg-amber-950/20 font-bold";
      default: return "text-blue-600 bg-blue-50 dark:bg-blue-950/20 font-semibold";
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Full screen backdrop */}
      <div 
        className="fixed inset-0 bg-black/55 backdrop-blur-xs transition-opacity duration-300 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Positioning Container (shifted to avoid sidebar) */}
      <div className="fixed inset-0 lg:left-[280px] flex items-center justify-center p-4 z-10 pointer-events-none">
        
        {/* Modal Container (1200px Max Width) */}
        <div className="relative w-full max-w-[1200px] h-[90vh] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto animate-scale-up">
        
        {/* Header */}
        <header className="p-4 border-b border-zinc-150 dark:border-zinc-850 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/30">
          <div className="flex items-center gap-2">
            <BarChart3 className="text-[var(--primary)]" size={18} />
            <div>
              <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                Cancellation & Refund Audit Analytics
              </h3>
              <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">
                Monitor failed order metrics, store cancellation rates, and gateway payouts.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </header>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin text-xs">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full py-20 space-y-3">
              <Activity className="animate-spin text-[var(--primary)]" size={32} />
              <p className="font-bold text-zinc-500">Compiling charts & analytics...</p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Bento Grid: 4 KPIs */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-3.5 bg-zinc-50/50 dark:bg-zinc-900/20 border border-zinc-150 dark:border-zinc-850 rounded-xl space-y-0.5 shadow-xs">
                  <p className="text-[9px] uppercase font-bold text-zinc-400 tracking-wide">Most Common Reason</p>
                  <h4 className="text-xs font-black text-zinc-850 dark:text-white mt-1">
                    {kpis.mostCommonReason || "Customer Request"}
                  </h4>
                  <p className="text-[8.5px] text-zinc-450 mt-0.5">Index count peak</p>
                </div>
                <div className="p-3.5 bg-zinc-50/50 dark:bg-zinc-900/20 border border-zinc-150 dark:border-zinc-850 rounded-xl space-y-0.5 shadow-xs">
                  <p className="text-[9px] uppercase font-bold text-zinc-400 tracking-wide">Refunds Issued (Month)</p>
                  <h4 className="text-xs font-black text-[var(--primary)] mt-1">
                    ₹{(kpis.refundAmountThisMonth || 0).toFixed(2)}
                  </h4>
                  <p className="text-[8.5px] text-zinc-450 mt-0.5">Cleared gateway settlements</p>
                </div>
                <div className="p-3.5 bg-zinc-50/50 dark:bg-zinc-900/20 border border-zinc-150 dark:border-zinc-850 rounded-xl space-y-0.5 shadow-xs">
                  <p className="text-[9px] uppercase font-bold text-zinc-400 tracking-wide">Cancelled Revenue Lost</p>
                  <h4 className="text-xs font-black text-rose-500 mt-1">
                    ₹{(kpis.cancelledRevenue || 0).toFixed(2)}
                  </h4>
                  <p className="text-[8.5px] text-zinc-455 mt-0.5">Gross order cancellations pool</p>
                </div>
                <div className="p-3.5 bg-zinc-50/50 dark:bg-zinc-900/20 border border-zinc-150 dark:border-zinc-850 rounded-xl space-y-0.5 shadow-xs">
                  <p className="text-[9px] uppercase font-bold text-zinc-400 tracking-wide">Highest Cancel Store Branch</p>
                  <h4 className="text-xs font-black text-zinc-850 dark:text-white mt-1 truncate">
                    {kpis.highestCancellationStore || "N/A"}
                  </h4>
                  <p className="text-[8.5px] text-rose-600 font-bold mt-0.5">Rate: {kpis.highestCancellationStorePercentage || "0%"}</p>
                </div>
              </div>

              {/* 4 Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                
                {/* Chart 1: Cancellation Trend (Line Chart) */}
                <div className="bg-white dark:bg-zinc-950 p-4 border border-zinc-150 dark:border-zinc-850 rounded-xl shadow-xs space-y-3">
                  <h4 className="text-xs font-black uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
                    <TrendingUp size={13} className="text-[var(--primary)]" />
                    Cancellation Trend Index
                  </h4>
                  <div className="h-[200px] w-full text-[9px]">
                    {analyticsData?.cancellationTrend ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analyticsData.cancellationTrend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorCancelModal" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.01}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                          <XAxis dataKey="date" tickLine={false} axisLine={false} stroke="#888888" />
                          <YAxis tickLine={false} axisLine={false} stroke="#888888" allowDecimals={false} />
                          <Tooltip contentStyle={{ fontSize: "11px", fontWeight: "bold" }} />
                          <Area type="monotone" dataKey="cancelledOrders" stroke="var(--primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorCancelModal)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-center py-10 font-bold text-zinc-400">Loading trend charts...</p>
                    )}
                  </div>
                </div>

                {/* Chart 2: Cancellation Reasons Distribution (Pie Chart) */}
                <div className="bg-white dark:bg-zinc-950 p-4 border border-zinc-150 dark:border-zinc-850 rounded-xl shadow-xs space-y-3">
                  <h4 className="text-xs font-black uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
                    <PieIcon size={13} className="text-orange-500" />
                    Cancellation Reasons Distribution
                  </h4>
                  <div className="h-[200px] w-full text-[9px] flex items-center justify-between">
                    {analyticsData?.cancellationReasons ? (
                      <>
                        <div className="w-[50%] h-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={analyticsData.cancellationReasons}
                                cx="50%"
                                cy="50%"
                                innerRadius={0}
                                outerRadius={68}
                                paddingAngle={0}
                                dataKey="value"
                              >
                                {analyticsData.cancellationReasons.map((entry, idx) => (
                                  <Cell key={`cell-${idx}`} fill={entry.fill} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="w-[50%] space-y-1.5 flex flex-col justify-center">
                          {analyticsData.cancellationReasons.map((entry, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.fill }} />
                              <span className="font-bold text-zinc-650 dark:text-zinc-350 truncate">{entry.name}: {entry.value}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="text-center w-full py-10 font-bold text-zinc-400">Loading reasons distribution...</p>
                    )}
                  </div>
                </div>

                {/* Chart 3: Store-wise Cancellations (Horizontal Bar Chart) */}
                <div className="bg-white dark:bg-zinc-950 p-4 border border-zinc-150 dark:border-zinc-850 rounded-xl shadow-xs space-y-3">
                  <h4 className="text-xs font-black uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
                    <BarChart3 size={13} className="text-purple-500" />
                    Highest Cancel Rate Store Branches (%)
                  </h4>
                  <div className="h-[200px] w-full text-[9px]">
                    {analyticsData?.storeCancellations ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analyticsData.storeCancellations} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e4e4e7" />
                          <XAxis type="number" tickLine={false} axisLine={false} stroke="#888888" tickFormatter={(v) => `${v}%`} />
                          <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} stroke="#888888" width={80} style={{ fontSize: '9px', fontWeight: 'bold' }} />
                          <Tooltip contentStyle={{ fontSize: "11px", fontWeight: "bold" }} formatter={(value) => [`${value}%`, 'Cancel Rate']} />
                          <Bar dataKey="percentage" fill="#a855f7" radius={[0, 4, 4, 0]} barSize={10} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-center py-10 font-bold text-zinc-400">Loading store analysis charts...</p>
                    )}
                  </div>
                </div>

                {/* Chart 4: Refund Status Distribution (Donut Chart) */}
                <div className="bg-white dark:bg-zinc-950 p-4 border border-zinc-150 dark:border-zinc-850 rounded-xl shadow-xs space-y-3">
                  <h4 className="text-xs font-black uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
                    <Wallet size={13} className="text-blue-500" />
                    Refund Payout Status Distribution
                  </h4>
                  <div className="h-[200px] w-full text-[9px] flex items-center justify-between">
                    {analyticsData?.refundStatusDistribution ? (
                      <>
                        <div className="w-[50%] h-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={analyticsData.refundStatusDistribution}
                                cx="50%"
                                cy="50%"
                                innerRadius={42}
                                outerRadius={68}
                                paddingAngle={3}
                                dataKey="value"
                              >
                                {analyticsData.refundStatusDistribution.map((entry, idx) => (
                                  <Cell key={`cell-${idx}`} fill={entry.fill} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="w-[50%] space-y-1.5 flex flex-col justify-center">
                          {analyticsData.refundStatusDistribution.map((entry, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.fill }} />
                              <span className="font-bold text-zinc-655 dark:text-zinc-355 truncate">{entry.name}: {entry.value}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="text-center w-full py-10 font-bold text-zinc-400">Loading refund distribution...</p>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="p-4 border-t border-zinc-100 dark:border-zinc-850 flex justify-end bg-zinc-50/30 dark:bg-zinc-900/10">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-zinc-900 hover:bg-zinc-850 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white font-bold rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            Close Analysis
          </button>
        </footer>

      </div>
    </div>
  </div>
  );
}
