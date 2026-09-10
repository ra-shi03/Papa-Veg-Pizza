import React from "react";
import { X, TrendingUp, BarChart3, PieChart as PieIcon, Wallet, Info, Activity } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, BarChart, Bar } from "recharts";
import { useRefundAnalytics, useRefundChartData } from "../ordersQuery";

export default function RefundAnalysisModal({ isOpen, onClose }) {
  const { data: analyticsData, isLoading: isAnalyticsLoading } = useRefundAnalytics();
  const { data: chartData, isLoading: isChartsLoading } = useRefundChartData();

  if (!isOpen) return null;

  const isLoading = isAnalyticsLoading || isChartsLoading;

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
        <div className="relative w-full max-w-[1200px] h-[90vh] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto animate-scale-up text-xs font-semibold text-zinc-700 dark:text-zinc-350">
        
          {/* Header */}
          <header className="p-4 border-b border-zinc-150 dark:border-zinc-850 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/30">
            <div className="flex items-center gap-2">
              <BarChart3 className="text-[var(--primary)]" size={18} />
              <div>
                <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                  Refund & Settlement Analytics Audit
                </h3>
                <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">
                  Track payout summaries, gateway status codes, reason distribution, and store metrics.
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
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full py-20 space-y-3">
                <Activity className="animate-spin text-[var(--primary)]" size={32} />
                <p className="font-bold text-zinc-500">Compiling financial graphs...</p>
              </div>
            ) : (
              <div className="space-y-6 animate-fade-in">
                
                {/* 5 KPIs Row */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
                  
                  {/* KPI 1 */}
                  <div className="p-3 bg-zinc-50/50 dark:bg-zinc-900/20 border border-zinc-150 dark:border-zinc-850 rounded-xl space-y-0.5 shadow-xs">
                    <p className="text-[9px] uppercase font-bold text-zinc-400 tracking-wide">Refunds Today</p>
                    <h4 className="text-xs font-black text-zinc-850 dark:text-white mt-1">
                      ₹{(analyticsData?.refundAmountToday || 0).toFixed(2)}
                    </h4>
                    <p className="text-[8px] text-zinc-450 mt-0.5 font-bold">Cleared today</p>
                  </div>

                  {/* KPI 2 */}
                  <div className="p-3 bg-zinc-50/50 dark:bg-zinc-900/20 border border-zinc-150 dark:border-zinc-850 rounded-xl space-y-0.5 shadow-xs">
                    <p className="text-[9px] uppercase font-bold text-zinc-400 tracking-wide">Refunds (Month)</p>
                    <h4 className="text-xs font-black text-[var(--primary)] mt-1">
                      ₹{(analyticsData?.refundAmountThisMonth || 0).toFixed(2)}
                    </h4>
                    <p className="text-[8px] text-zinc-450 mt-0.5 font-bold">Current month total</p>
                  </div>

                  {/* KPI 3 */}
                  <div className="p-3 bg-zinc-50/50 dark:bg-zinc-900/20 border border-zinc-150 dark:border-zinc-850 rounded-xl space-y-0.5 shadow-xs">
                    <p className="text-[9px] uppercase font-bold text-zinc-400 tracking-wide">Avg Refund Value</p>
                    <h4 className="text-xs font-black text-purple-650 mt-1">
                      ₹{(analyticsData?.averageRefundValue || 0).toFixed(2)}
                    </h4>
                    <p className="text-[8px] text-zinc-450 mt-0.5 font-bold">Average payout claim</p>
                  </div>

                  {/* KPI 4 */}
                  <div className="p-3 bg-zinc-50/50 dark:bg-zinc-900/20 border border-zinc-150 dark:border-zinc-850 rounded-xl space-y-0.5 shadow-xs">
                    <p className="text-[9px] uppercase font-bold text-zinc-400 tracking-wide">Peak Refund Store</p>
                    <h4 className="text-xs font-black text-zinc-850 dark:text-white mt-1 truncate">
                      {analyticsData?.highestRefundStore || "N/A"}
                    </h4>
                    <p className="text-[8px] text-zinc-450 mt-0.5 font-bold">Store with highest refund claims</p>
                  </div>

                  {/* KPI 5 */}
                  <div className="p-3 bg-emerald-550/10 border border-emerald-100 dark:border-emerald-950/20 rounded-xl space-y-0.5 shadow-xs col-span-2 md:col-span-1">
                    <p className="text-[9px] uppercase font-bold text-emerald-650 dark:text-emerald-500 tracking-wide">Settle Success Rate</p>
                    <h4 className="text-xs font-black text-emerald-600 dark:text-emerald-500 mt-1">
                      {analyticsData?.refundSuccessRate || "100%"}
                    </h4>
                    <p className="text-[8px] text-emerald-650/80 dark:text-emerald-500/80 mt-0.5 font-bold">Gateway clearing SLA</p>
                  </div>

                </div>

                {/* 4 Charts Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  
                  {/* Chart 1: Refund Trend (Line / Area Chart) */}
                  <div className="bg-white dark:bg-zinc-950 p-4 border border-zinc-150 dark:border-zinc-850 rounded-xl shadow-xs space-y-3">
                    <h4 className="text-xs font-black uppercase text-zinc-450 tracking-wider flex items-center gap-1.5">
                      <TrendingUp size={13} className="text-[var(--primary)]" />
                      Refund Payout Trend (₹)
                    </h4>
                    <div className="h-[200px] w-full text-[9px]">
                      {chartData?.refundTrend ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData.refundTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorRefundModal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.01}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                            <XAxis dataKey="date" tickLine={false} axisLine={false} stroke="#888888" />
                            <YAxis tickLine={false} axisLine={false} stroke="#888888" allowDecimals={false} />
                            <Tooltip contentStyle={{ fontSize: "11px", fontWeight: "bold" }} formatter={(value) => [`₹${value}`, 'Refund Amount']} />
                            <Area type="monotone" dataKey="refundAmount" stroke="var(--primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorRefundModal)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="text-center py-10 font-bold text-zinc-400">Loading trend charts...</p>
                      )}
                    </div>
                  </div>

                  {/* Chart 2: Refund Status Distribution (Donut Chart) */}
                  <div className="bg-white dark:bg-zinc-950 p-4 border border-zinc-150 dark:border-zinc-850 rounded-xl shadow-xs space-y-3">
                    <h4 className="text-xs font-black uppercase text-zinc-455 tracking-wider flex items-center gap-1.5">
                      <Wallet size={13} className="text-blue-500" />
                      Refund Status Distribution
                    </h4>
                    <div className="h-[200px] w-full text-[9px] flex items-center justify-between">
                      {chartData?.refundStatusDistribution ? (
                        <>
                          <div className="w-[50%] h-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={chartData.refundStatusDistribution}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={45}
                                  outerRadius={68}
                                  paddingAngle={3}
                                  dataKey="value"
                                >
                                  {chartData.refundStatusDistribution.map((entry, idx) => (
                                    <Cell key={`cell-${idx}`} fill={entry.fill} />
                                  ))}
                                </Pie>
                                <Tooltip />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="w-[50%] space-y-1.5 flex flex-col justify-center">
                            {chartData.refundStatusDistribution.map((entry, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.fill }} />
                                <span className="font-bold text-zinc-650 dark:text-zinc-350 truncate">
                                  {entry.name}: {entry.value} Request{entry.value !== 1 ? 's' : ''}
                                </span>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <p className="text-center w-full py-10 font-bold text-zinc-400">Loading status distribution...</p>
                      )}
                    </div>
                  </div>

                  {/* Chart 3: Refund Reasons Distribution (Pie Chart) */}
                  <div className="bg-white dark:bg-zinc-950 p-4 border border-zinc-150 dark:border-zinc-850 rounded-xl shadow-xs space-y-3">
                    <h4 className="text-xs font-black uppercase text-zinc-455 tracking-wider flex items-center gap-1.5">
                      <PieIcon size={13} className="text-orange-500" />
                      Refund Claim Reasons Distribution
                    </h4>
                    <div className="h-[200px] w-full text-[9px] flex items-center justify-between">
                      {chartData?.refundReasonsDistribution ? (
                        <>
                          <div className="w-[50%] h-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={chartData.refundReasonsDistribution}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={0}
                                  outerRadius={68}
                                  paddingAngle={0}
                                  dataKey="value"
                                >
                                  {chartData.refundReasonsDistribution.map((entry, idx) => (
                                    <Cell key={`cell-${idx}`} fill={entry.fill} />
                                  ))}
                                </Pie>
                                <Tooltip />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="w-[50%] space-y-1.5 flex flex-col justify-center">
                            {chartData.refundReasonsDistribution.map((entry, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.fill }} />
                                <span className="font-bold text-zinc-655 dark:text-zinc-355 truncate">
                                  {entry.name}: {entry.value} Claim{entry.value !== 1 ? 's' : ''}
                                </span>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <p className="text-center w-full py-10 font-bold text-zinc-400">Loading reasons distribution...</p>
                      )}
                    </div>
                  </div>

                  {/* Chart 4: Store-wise Refund Rate Chart (Horizontal Bar Chart) */}
                  <div className="bg-white dark:bg-zinc-950 p-4 border border-zinc-150 dark:border-zinc-850 rounded-xl shadow-xs space-y-3">
                    <h4 className="text-xs font-black uppercase text-zinc-455 tracking-wider flex items-center gap-1.5">
                      <BarChart3 size={13} className="text-purple-500" />
                      Refund Rate Store-wise Comparison (%)
                    </h4>
                    <div className="h-[200px] w-full text-[9px]">
                      {chartData?.storeRefundChart ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData.storeRefundChart} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e4e4e7" />
                            <XAxis type="number" tickLine={false} axisLine={false} stroke="#888888" tickFormatter={(v) => `${v}%`} />
                            <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} stroke="#888888" width={80} style={{ fontSize: '9px', fontWeight: 'bold' }} />
                            <Tooltip contentStyle={{ fontSize: "11px", fontWeight: "bold" }} formatter={(value) => [`${value}%`, 'Refund Payout Rate']} />
                            <Bar dataKey="percentage" fill="#a855f7" radius={[0, 4, 4, 0]} barSize={10} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="text-center py-10 font-bold text-zinc-400">Loading store charts...</p>
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
