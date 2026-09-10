import React from "react";
import { X, TrendingUp, BarChart3, PieChart as PieIcon, Wallet, Info, Activity, ShieldAlert, Star } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, BarChart, Bar, Legend } from "recharts";
import { useIssueAnalytics, useIssueChartData } from "../ordersQuery";

export default function IssueAnalysisModal({ isOpen, onClose }) {
  const { data: analyticsData, isLoading: isAnalyticsLoading } = useIssueAnalytics();
  const { data: chartData, isLoading: isChartsLoading } = useIssueChartData();

  if (!isOpen) return null;

  const isLoading = isAnalyticsLoading || isChartsLoading;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/55 backdrop-blur-xs transition-opacity duration-300 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Positioning Container (shifted to avoid sidebar) */}
      <div className="fixed inset-0 lg:left-[280px] flex items-center justify-center p-4 z-10 pointer-events-none">
        
        {/* Modal Container */}
        <div className="relative w-full max-w-[1200px] h-[90vh] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto animate-scale-up text-xs font-semibold text-zinc-700 dark:text-zinc-350">
          
          {/* Header */}
          <header className="p-4 border-b border-zinc-150 dark:border-zinc-850 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/30">
            <div className="flex items-center gap-2">
              <BarChart3 className="text-[var(--primary)]" size={18} />
              <div>
                <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                  Operations & Order Issue Audit Analytics
                </h3>
                <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">
                  Monitor post-order complaint trends, category peaks, and dispatch resolution payouts.
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

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full py-20 space-y-3">
                <Activity className="animate-spin text-[var(--primary)]" size={32} />
                <p className="font-bold text-zinc-500">Compiling operations analytics...</p>
              </div>
            ) : (
              <div className="space-y-6 animate-fade-in">
                
                {/* 5 KPIs Bento */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
                  <div className="p-3 bg-zinc-50/50 dark:bg-zinc-900/20 border border-zinc-150 dark:border-zinc-850 rounded-xl space-y-0.5 shadow-xs">
                    <p className="text-[9px] uppercase font-bold text-zinc-400 tracking-wide">Issues Logged Today</p>
                    <h4 className="text-xs font-black text-zinc-850 dark:text-white mt-1">
                      {analyticsData?.issuesToday || 0} Tickets
                    </h4>
                    <p className="text-[8px] text-zinc-450 mt-0.5 font-bold">New incoming logs</p>
                  </div>
                  <div className="p-3 bg-zinc-50/50 dark:bg-zinc-900/20 border border-zinc-150 dark:border-zinc-850 rounded-xl space-y-0.5 shadow-xs">
                    <p className="text-[9px] uppercase font-bold text-zinc-400 tracking-wide">Avg Resolve Time</p>
                    <h4 className="text-xs font-black text-[var(--primary)] mt-1">
                      {analyticsData?.avgResolutionTime || "4.5 Hours"}
                    </h4>
                    <p className="text-[8px] text-zinc-450 mt-0.5 font-bold">SLA turnaround index</p>
                  </div>
                  <div className="p-3 bg-zinc-50/50 dark:bg-zinc-900/20 border border-zinc-150 dark:border-zinc-850 rounded-xl space-y-0.5 shadow-xs">
                    <p className="text-[9px] uppercase font-bold text-zinc-400 tracking-wide">Top Complaint Category</p>
                    <h4 className="text-xs font-black text-rose-500 mt-1 truncate">
                      {analyticsData?.topCategory || "Wrong Item"}
                    </h4>
                    <p className="text-[8px] text-rose-600/80 font-bold mt-0.5">Peak frequency tag</p>
                  </div>
                  <div className="p-3 bg-zinc-50/50 dark:bg-zinc-900/20 border border-zinc-150 dark:border-zinc-850 rounded-xl space-y-0.5 shadow-xs">
                    <p className="text-[9px] uppercase font-bold text-zinc-400 tracking-wide">Highest Dispute Store</p>
                    <h4 className="text-xs font-black text-zinc-850 dark:text-white mt-1 truncate">
                      {analyticsData?.highestComplaintStore || "N/A"}
                    </h4>
                    <p className="text-[8px] text-zinc-450 mt-0.5 font-bold">Store with highest complaints</p>
                  </div>
                  <div className="p-3 bg-emerald-550/10 border border-emerald-100 dark:border-emerald-950/20 rounded-xl space-y-0.5 shadow-xs col-span-2 md:col-span-1">
                    <p className="text-[9px] uppercase font-bold text-emerald-650 dark:text-emerald-500 tracking-wide">Compensations Paid</p>
                    <h4 className="text-xs font-black text-emerald-600 dark:text-emerald-500 mt-1">
                      ₹{(analyticsData?.compensationPaid || 0).toFixed(2)}
                    </h4>
                    <p className="text-[8px] text-emerald-650/80 dark:text-emerald-500/80 mt-0.5 font-bold">Refunds & Coupons total</p>
                  </div>
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  
                  {/* Chart 1: Issue Trend */}
                  <div className="bg-white dark:bg-zinc-950 p-4 border border-zinc-150 dark:border-zinc-850 rounded-xl shadow-xs space-y-3">
                    <h4 className="text-xs font-black uppercase text-zinc-450 tracking-wider flex items-center gap-1.5">
                      <TrendingUp size={13} className="text-[var(--primary)]" />
                      Post-Order Issue Trend Index (Count)
                    </h4>
                    <div className="h-[200px] w-full text-[9px]">
                      {chartData?.issueTrend ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData.issueTrend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorIssueModal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.01}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                            <XAxis dataKey="date" tickLine={false} axisLine={false} stroke="#888888" />
                            <YAxis tickLine={false} axisLine={false} stroke="#888888" allowDecimals={false} />
                            <Tooltip contentStyle={{ fontSize: "11px", fontWeight: "bold" }} formatter={(value) => [`${value} Tickets`, 'Issues Count']} />
                            <Area type="monotone" dataKey="issuesCount" stroke="var(--primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorIssueModal)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="text-center py-10 font-bold text-zinc-400">Loading trend charts...</p>
                      )}
                    </div>
                  </div>

                  {/* Chart 2: Priority Distribution */}
                  <div className="bg-white dark:bg-zinc-950 p-4 border border-zinc-150 dark:border-zinc-850 rounded-xl shadow-xs space-y-3">
                    <h4 className="text-xs font-black uppercase text-zinc-455 tracking-wider flex items-center gap-1.5">
                      <ShieldAlert size={13} className="text-red-500" />
                      Priority Distribution
                    </h4>
                    <div className="h-[200px] w-full text-[9px] flex items-center justify-between">
                      {chartData?.issuePriorityDistribution ? (
                        <>
                          <div className="w-[50%] h-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={chartData.issuePriorityDistribution}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={45}
                                  outerRadius={68}
                                  paddingAngle={3}
                                  dataKey="value"
                                >
                                  {chartData.issuePriorityDistribution.map((entry, idx) => (
                                    <Cell key={`cell-${idx}`} fill={entry.fill} />
                                  ))}
                                </Pie>
                                <Tooltip />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="w-[50%] space-y-1.5 flex flex-col justify-center font-bold">
                            {chartData.issuePriorityDistribution.map((entry, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.fill }} />
                                <span className="text-zinc-650 dark:text-zinc-350 truncate">
                                  {entry.name}: {entry.value} Ticket{entry.value !== 1 ? 's' : ''}
                                </span>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <p className="text-center w-full py-10 font-bold text-zinc-400">Loading priority statistics...</p>
                      )}
                    </div>
                  </div>

                  {/* Chart 3: Category Distribution */}
                  <div className="bg-white dark:bg-zinc-950 p-4 border border-zinc-150 dark:border-zinc-850 rounded-xl shadow-xs space-y-3">
                    <h4 className="text-xs font-black uppercase text-zinc-455 tracking-wider flex items-center gap-1.5">
                      <PieIcon size={13} className="text-orange-500" />
                      Complaint Categories Distribution
                    </h4>
                    <div className="h-[200px] w-full text-[9px] flex items-center justify-between">
                      {chartData?.issueCategoriesDistribution ? (
                        <>
                          <div className="w-[50%] h-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={chartData.issueCategoriesDistribution}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={0}
                                  outerRadius={68}
                                  paddingAngle={0}
                                  dataKey="value"
                                >
                                  {chartData.issueCategoriesDistribution.map((entry, idx) => (
                                    <Cell key={`cell-${idx}`} fill={entry.fill} />
                                  ))}
                                </Pie>
                                <Tooltip />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="w-[50%] space-y-1.5 flex flex-col justify-center font-bold">
                            {chartData.issueCategoriesDistribution.filter(e => e.value > 0).map((entry, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.fill }} />
                                <span className="text-zinc-655 dark:text-zinc-355 truncate">
                                  {entry.name}: {entry.value}
                                </span>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <p className="text-center w-full py-10 font-bold text-zinc-400">Loading category distributions...</p>
                      )}
                    </div>
                  </div>

                  {/* Chart 4: Resolution Types */}
                  <div className="bg-white dark:bg-zinc-950 p-4 border border-zinc-150 dark:border-zinc-850 rounded-xl shadow-xs space-y-3">
                    <h4 className="text-xs font-black uppercase text-zinc-455 tracking-wider flex items-center gap-1.5">
                      <Wallet size={13} className="text-emerald-500" />
                      Resolution Types Applied (Tickets Count)
                    </h4>
                    <div className="h-[200px] w-full text-[9px]">
                      {chartData?.resolutionTypesChart ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData.resolutionTypesChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                            <XAxis dataKey="name" tickLine={false} axisLine={false} stroke="#888888" />
                            <YAxis tickLine={false} axisLine={false} stroke="#888888" allowDecimals={false} />
                            <Tooltip contentStyle={{ fontSize: "11px", fontWeight: "bold" }} formatter={(value) => [`${value} Tickets`, 'Count']} />
                            <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} barSize={18} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="text-center py-10 font-bold text-zinc-400">Loading resolution statistics...</p>
                      )}
                    </div>
                  </div>

                  {/* Chart 5: Store-wise complaints (Horizontal Bar) */}
                  <div className="bg-white dark:bg-zinc-950 p-4 border border-zinc-150 dark:border-zinc-850 rounded-xl shadow-xs space-y-3 col-span-1 md:col-span-2">
                    <h4 className="text-xs font-black uppercase text-zinc-455 tracking-wider flex items-center gap-1.5">
                      <BarChart3 size={13} className="text-purple-500" />
                      Complaint Volume Store-wise (Count)
                    </h4>
                    <div className="h-[180px] w-full text-[9px]">
                      {chartData?.storeIssuesChart ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData.storeIssuesChart} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e4e4e7" />
                            <XAxis type="number" tickLine={false} axisLine={false} stroke="#888888" allowDecimals={false} />
                            <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} stroke="#888888" width={80} style={{ fontSize: '9px', fontWeight: 'bold' }} />
                            <Tooltip contentStyle={{ fontSize: "11px", fontWeight: "bold" }} formatter={(value) => [`${value} Complaints`, 'Count']} />
                            <Bar dataKey="count" fill="#a855f7" radius={[0, 4, 4, 0]} barSize={10} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="text-center py-10 font-bold text-zinc-400">Loading store complaint metrics...</p>
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
