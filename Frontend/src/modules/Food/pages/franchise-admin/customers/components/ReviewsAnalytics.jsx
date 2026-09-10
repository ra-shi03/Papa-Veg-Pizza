import React, { useState } from "react";
import { 
  Star, ClipboardList, CheckCircle2, AlertTriangle, Send, 
  TrendingUp, UserCheck, Clock, BarChart3, PieChart as PieIcon, LineChart as LineIcon
} from "lucide-react";
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, PieChart, Pie, Cell, BarChart, Bar 
} from "recharts";

const PIE_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#f97316", "#ef4444"];

export default function ReviewsAnalytics({ stats, analytics }) {
  const [activeChartTab, setActiveChartTab] = useState("trend"); // trend | star | store

  // Render Star Badge Helper
  const getRatingStars = (r) => {
    return (
      <div className="flex items-center gap-0.5 text-amber-500">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={10} fill={i < r ? "currentColor" : "none"} />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* KPI Bento Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        
        {/* Card 1: Total Reviews */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl shadow-xs flex items-center justify-between hover:scale-[1.01] transition-all">
          <div className="space-y-1">
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Total Reviews</p>
            <p className="text-lg font-black text-zinc-900 dark:text-white">{stats.totalReviews}</p>
          </div>
          <div className="p-2 rounded-lg bg-zinc-500/10 border border-zinc-500/20 text-zinc-500">
            <ClipboardList size={16} />
          </div>
        </div>

        {/* Card 2: Average Rating */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl shadow-xs flex items-center justify-between hover:scale-[1.01] transition-all">
          <div className="space-y-1">
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Average Rating</p>
            <div className="flex items-center gap-1">
              <p className="text-lg font-black text-amber-500">{stats.avgRating}</p>
              <Star size={14} fill="#f59e0b" className="text-amber-500" />
            </div>
          </div>
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500">
            <Star size={16} fill="currentColor" />
          </div>
        </div>

        {/* Card 3: 5 Star Reviews */}
        <div className="bg-white dark:bg-zinc-900 border border-emerald-500/20 p-3.5 rounded-xl shadow-xs flex items-center justify-between hover:scale-[1.01] transition-all">
          <div className="space-y-1">
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">5 Star Reviews</p>
            <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">{stats.fiveStarCount}</p>
          </div>
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
            <CheckCircle2 size={16} />
          </div>
        </div>

        {/* Card 4: Hidden Reviews */}
        <div className="bg-white dark:bg-zinc-900 border border-orange-500/20 p-3.5 rounded-xl shadow-xs flex items-center justify-between hover:scale-[1.01] transition-all">
          <div className="space-y-1">
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Hidden Reviews</p>
            <p className="text-lg font-black text-orange-500">{stats.hiddenCount}</p>
          </div>
          <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-500">
            <AlertTriangle size={16} />
          </div>
        </div>

        {/* Card 5: Reviews Awaiting Reply */}
        <div className="bg-white dark:bg-zinc-900 border border-rose-500/20 p-3.5 rounded-xl shadow-xs flex items-center justify-between hover:scale-[1.01] transition-all">
          <div className="space-y-1">
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Awaiting Reply</p>
            <div className="flex items-center gap-1.5">
              <p className="text-lg font-black text-rose-600 dark:text-rose-400">{stats.awaitingReplyCount}</p>
              {stats.awaitingReplyCount > 0 && <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500">
            <Send size={16} />
          </div>
        </div>

        {/* Card 6: Store Reputation Score */}
        <div className="bg-white dark:bg-zinc-900 border border-purple-500/20 p-3.5 rounded-xl shadow-xs flex items-center justify-between hover:scale-[1.01] transition-all">
          <div className="space-y-1">
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Reputation Index</p>
            <p className="text-lg font-black text-purple-600 dark:text-purple-400">{stats.reputationScore} / 100</p>
          </div>
          <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-500">
            <TrendingUp size={16} />
          </div>
        </div>

      </section>

      {/* Analytics Chart Section */}
      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-zinc-150 dark:border-zinc-850 mb-4">
          <h3 className="font-extrabold uppercase text-[10px] text-zinc-855 dark:text-white tracking-wider flex items-center gap-1.5">
            <TrendingUp size={14} className="text-[var(--primary)]" />
            Reputation Feedback Analytics
          </h3>
          
          <div className="flex gap-1.5 bg-zinc-50 dark:bg-zinc-950 p-1 rounded-lg border border-zinc-200 dark:border-zinc-850 self-end sm:self-auto">
            <button
              onClick={() => setActiveChartTab("trend")}
              className={`px-3 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                activeChartTab === "trend"
                  ? "bg-white dark:bg-zinc-900 text-[var(--primary)] shadow-xs"
                  : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              }`}
            >
              <LineIcon size={12} />
              Ratings Trend
            </button>
            <button
              onClick={() => setActiveChartTab("star")}
              className={`px-3 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                activeChartTab === "star"
                  ? "bg-white dark:bg-zinc-900 text-[var(--primary)] shadow-xs"
                  : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              }`}
            >
              <PieIcon size={12} />
              Star Distribution
            </button>
            <button
              onClick={() => setActiveChartTab("store")}
              className={`px-3 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                activeChartTab === "store"
                  ? "bg-white dark:bg-zinc-900 text-[var(--primary)] shadow-xs"
                  : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              }`}
            >
              <BarChart3 size={12} />
              Store Comparison
            </button>
          </div>
        </div>

        <div className="h-56 w-full text-[10px]">
          {activeChartTab === "trend" && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.ratingTrend} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" vertical={false} />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={9} />
                <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} stroke="#9ca3af" fontSize={9} />
                <Tooltip />
                <Line type="monotone" dataKey="avgRating" name="Daily Avg Rating" stroke="var(--primary)" strokeWidth={2.5} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          )}

          {activeChartTab === "star" && (
            <div className="grid grid-cols-1 md:grid-cols-2 h-full items-center">
              <div className="h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.starDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {analytics.starDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-3 pl-0 md:pl-5">
                {analytics.starDistribution.map((item, idx) => (
                  <div key={item.name} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 rounded-lg">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                    <div>
                      <span className="font-bold text-zinc-700 dark:text-zinc-200 block text-[11px]">{item.name} ({item.value})</span>
                      <span className="text-zinc-400 text-[9px] block font-medium mt-0.5">{item.percentage}% Share</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeChartTab === "store" && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.storeRatings} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" vertical={false} />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={9} />
                <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} stroke="#9ca3af" fontSize={9} />
                <Tooltip />
                <Bar dataKey="avgRating" name="Avg Rating" radius={[4, 4, 0, 0]}>
                  {analytics.storeRatings.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="var(--primary)" opacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>
    </div>
  );
}
