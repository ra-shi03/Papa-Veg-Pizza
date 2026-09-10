import React, { useState } from "react";
import { 
  Users, Trophy, CheckCircle2, UserCheck, TrendingUp, 
  Sparkles, PieChart as PieIcon, LineChart as LineIcon, BarChart3
} from "lucide-react";
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, PieChart, Pie, Cell, BarChart, Bar 
} from "recharts";

const TIER_COLORS = ["#d97706", "#94a3b8", "#eab308", "#a855f7"]; // Bronze, Silver, Gold, Platinum HSL matching

export default function LoyaltyAnalytics({ stats, analytics }) {
  const [activeChartTab, setActiveChartTab] = useState("growth"); // growth | tier | points

  return (
    <div className="space-y-4">
      {/* KPI Bento Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
        
        {/* Card 1: Total Members */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl shadow-xs flex items-center justify-between hover:scale-[1.01] transition-all">
          <div className="space-y-1">
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Total Members</p>
            <p className="text-base font-black text-zinc-900 dark:text-white">{stats.totalMembers}</p>
          </div>
          <div className="p-2 rounded-lg bg-zinc-500/10 border border-zinc-500/20 text-zinc-550 dark:text-zinc-400">
            <Users size={14} />
          </div>
        </div>

        {/* Card 2: Bronze Members */}
        <div className="bg-white dark:bg-zinc-900 border border-amber-600/20 p-3 rounded-xl shadow-xs flex items-center justify-between hover:scale-[1.01] transition-all">
          <div className="space-y-1">
            <p className="text-[9px] font-bold text-amber-600/80 uppercase tracking-wider">Bronze</p>
            <p className="text-base font-black text-amber-700 dark:text-amber-500">{stats.bronzeCount}</p>
          </div>
          <div className="p-2 rounded-lg bg-amber-600/10 border border-amber-600/25 text-amber-600">
            <Trophy size={14} />
          </div>
        </div>

        {/* Card 3: Silver Members */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-400/20 p-3 rounded-xl shadow-xs flex items-center justify-between hover:scale-[1.01] transition-all">
          <div className="space-y-1">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Silver</p>
            <p className="text-base font-black text-slate-500 dark:text-slate-450">{stats.silverCount}</p>
          </div>
          <div className="p-2 rounded-lg bg-slate-400/10 border border-slate-400/25 text-slate-400">
            <Trophy size={14} />
          </div>
        </div>

        {/* Card 4: Gold Members */}
        <div className="bg-white dark:bg-zinc-900 border border-yellow-500/20 p-3 rounded-xl shadow-xs flex items-center justify-between hover:scale-[1.01] transition-all">
          <div className="space-y-1">
            <p className="text-[9px] font-bold text-yellow-600/85 uppercase tracking-wider">Gold</p>
            <p className="text-base font-black text-yellow-500">{stats.goldCount}</p>
          </div>
          <div className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-500">
            <Trophy size={14} fill="currentColor" />
          </div>
        </div>

        {/* Card 5: Platinum Members */}
        <div className="bg-white dark:bg-zinc-900 border border-purple-500/20 p-3 rounded-xl shadow-xs flex items-center justify-between hover:scale-[1.01] transition-all">
          <div className="space-y-1">
            <p className="text-[9px] font-bold text-purple-500 uppercase tracking-wider">Platinum</p>
            <p className="text-base font-black text-purple-600 dark:text-purple-400">{stats.platinumCount}</p>
          </div>
          <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-500">
            <Trophy size={14} fill="currentColor" />
          </div>
        </div>

        {/* Card 6: Points Redeemed */}
        <div className="bg-white dark:bg-zinc-900 border border-emerald-500/20 p-3 rounded-xl shadow-xs flex items-center justify-between hover:scale-[1.01] transition-all">
          <div className="space-y-1">
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider font-semibold">Pts Redeemed</p>
            <p className="text-base font-black text-emerald-600 dark:text-emerald-400">{stats.redeemedPoints}</p>
          </div>
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
            <Sparkles size={14} />
          </div>
        </div>

        {/* Card 7: Active Members */}
        <div className="bg-white dark:bg-zinc-900 border border-blue-500/20 p-3 rounded-xl shadow-xs flex items-center justify-between hover:scale-[1.01] transition-all">
          <div className="space-y-1">
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Active Members</p>
            <p className="text-base font-black text-blue-600 dark:text-blue-400">{stats.activeCount}</p>
          </div>
          <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-500">
            <UserCheck size={14} />
          </div>
        </div>

      </section>

      {/* Analytics Chart Section */}
      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-zinc-150 dark:border-zinc-855 mb-4">
          <h3 className="font-extrabold uppercase text-[10px] text-zinc-855 dark:text-white tracking-wider flex items-center gap-1.5">
            <TrendingUp size={14} className="text-[var(--primary)]" />
            Loyalty Program Insights
          </h3>
          
          <div className="flex gap-1.5 bg-zinc-50 dark:bg-zinc-950 p-1 rounded-lg border border-zinc-200 dark:border-zinc-850 self-end sm:self-auto">
            <button
              onClick={() => setActiveChartTab("growth")}
              className={`px-3 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                activeChartTab === "growth"
                  ? "bg-white dark:bg-zinc-900 text-[var(--primary)] shadow-xs"
                  : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              }`}
            >
              <LineIcon size={12} />
              Membership Growth
            </button>
            <button
              onClick={() => setActiveChartTab("tier")}
              className={`px-3 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                activeChartTab === "tier"
                  ? "bg-white dark:bg-zinc-900 text-[var(--primary)] shadow-xs"
                  : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              }`}
            >
              <PieIcon size={12} />
              Tier Distribution
            </button>
            <button
              onClick={() => setActiveChartTab("points")}
              className={`px-3 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                activeChartTab === "points"
                  ? "bg-white dark:bg-zinc-900 text-[var(--primary)] shadow-xs"
                  : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              }`}
            >
              <BarChart3 size={12} />
              Points Activity
            </button>
          </div>
        </div>

        <div className="h-56 w-full text-[10px]">
          {activeChartTab === "growth" && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.memberGrowth} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" vertical={false} />
                <XAxis dataKey="month" stroke="#9ca3af" fontSize={9} />
                <YAxis stroke="#9ca3af" fontSize={9} />
                <Tooltip />
                <Line type="monotone" dataKey="members" name="Total Members" stroke="var(--primary)" strokeWidth={2.5} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          )}

          {activeChartTab === "tier" && (
            <div className="grid grid-cols-1 md:grid-cols-2 h-full items-center">
              <div className="h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.tierDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {analytics.tierDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={TIER_COLORS[index % TIER_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-3 pl-0 md:pl-5">
                {analytics.tierDistribution.map((item, idx) => (
                  <div key={item.name} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 rounded-lg">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: TIER_COLORS[idx % TIER_COLORS.length] }} />
                    <div>
                      <span className="font-bold text-zinc-700 dark:text-zinc-200 block text-[11px]">{item.name} ({item.value})</span>
                      <span className="text-zinc-400 text-[9px] block font-medium mt-0.5">
                        {stats.totalMembers > 0 ? Math.round((item.value / stats.totalMembers) * 100) : 0}% Share
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeChartTab === "points" && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.pointsActivity} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" vertical={false} />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={9} />
                <YAxis stroke="#9ca3af" fontSize={9} />
                <Tooltip />
                <Bar dataKey="points" name="Loyalty Points" radius={[4, 4, 0, 0]}>
                  {analytics.pointsActivity.map((entry, index) => {
                    const colors = ["#10b981", "#3b82f6", "#ef4444"];
                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} opacity={0.85} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>
    </div>
  );
}
