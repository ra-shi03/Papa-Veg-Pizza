import React, { useState } from "react"
import { TrendingUp, ShoppingBag, Clock, Star, Target, X, CheckCircle2 } from "lucide-react"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line
} from "recharts"
import { getKitchenPerformance } from "../mockManagersData"

export default function KitchenPerformanceModal({ isOpen, onClose, staff }) {
  const [timeframe, setTimeframe] = useState("daily") // daily | weekly | monthly

  if (!isOpen || !staff) return null

  const data = getKitchenPerformance(staff.id)

  const activeChartData = timeframe === "daily" 
    ? data.trends.daily 
    : timeframe === "weekly"
      ? data.trends.weekly
      : data.trends.monthly

  const getXAxisKey = () => {
    return timeframe === "daily" ? "day" : "label"
  }

  return (
    <div className="fixed lg:left-[280px] left-0 top-[64px] right-0 bottom-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop restricted to content area */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden animate-scale-up z-10">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-150 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20">
          <div className="flex items-center gap-2 text-zinc-900 dark:text-white">
            <TrendingUp className="w-5 h-5 text-[var(--primary)]" />
            <h3 className="text-sm font-extrabold uppercase tracking-wider">Kitchen Staff Analytics</h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-250 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto scrollbar-thin">
          <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-850 rounded-xl">
            <img
              src={staff.profileImage}
              alt={staff.name}
              className="w-10 h-10 rounded-xl object-cover border border-zinc-200 dark:border-zinc-800 shrink-0"
            />
            <div>
              <p className="text-[11px] font-black text-zinc-800 dark:text-zinc-250 leading-none">{staff.name}</p>
              <p className="text-[9px] text-zinc-500 font-semibold mt-1">Code: {staff.employeeCode} • Station: Main Pizza Oven</p>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
            {[
              { label: "Pizzas Prepared", val: data.pizzasPrepared, sub: "Total count", icon: ShoppingBag, color: "text-blue-500 bg-blue-50 dark:bg-blue-950/20" },
              { label: "Avg Prep Time", val: `${data.avgCookingTime} mins`, sub: "Target: <10m", icon: Clock, color: "text-amber-500 bg-amber-50 dark:bg-amber-950/20" },
              { label: "Quality Score", val: `${data.qualityScore}%`, sub: "Audited rating", icon: Target, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20" },
              { label: "Cancelled Orders", val: data.cancelledOrders, sub: "Errors today", icon: X, color: "text-rose-500 bg-rose-50 dark:bg-rose-950/20" },
              { label: "Attendance %", val: `${data.attendanceRate}%`, sub: "Logs rate", icon: CheckCircle2, color: "text-purple-650 bg-purple-50 dark:bg-purple-950/20" }
            ].map((stat, idx) => (
              <div key={idx} className="bg-zinc-50 dark:bg-zinc-950/25 border border-zinc-100 dark:border-zinc-850 rounded-xl p-2.5 shadow-xs relative flex flex-col justify-between min-h-[75px]">
                <div>
                  <span className="block text-[8px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-0.5">{stat.label}</span>
                  <span className="text-xs font-black text-zinc-800 dark:text-white">{stat.val}</span>
                </div>
                <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-850/50 mt-1 pt-1 text-[8px] font-bold text-zinc-400">
                  <span className="truncate">{stat.sub}</span>
                  <div className={`p-0.5 rounded shrink-0 ${stat.color}`}>
                    <stat.icon size={10} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* Prepared pizzas Trend */}
            <div className="border border-zinc-150 dark:border-zinc-855 bg-white dark:bg-zinc-900 rounded-2xl p-4 flex flex-col justify-between">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Pizzas Prepared Trend</span>
                <div className="flex bg-zinc-100 dark:bg-zinc-950 p-0.5 rounded-lg">
                  {["daily", "weekly", "monthly"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setTimeframe(tab)}
                      className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold capitalize transition-all cursor-pointer ${
                        timeframe === tab
                          ? "bg-[var(--primary)] text-white"
                          : "text-zinc-500 hover:text-zinc-700"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="h-[140px] w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activeChartData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPizzas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey={getXAxisKey()} fontSize={8} tickLine={false} axisLine={false} />
                    <YAxis fontSize={8} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ fontSize: 9 }} />
                    <Area type="monotone" dataKey="pizzas" stroke="var(--primary)" fillOpacity={1} fill="url(#colorPizzas)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Cooking Time Trend */}
            <div className="border border-zinc-150 dark:border-zinc-855 bg-white dark:bg-zinc-900 rounded-2xl p-4 flex flex-col justify-between">
              <div className="mb-3">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Average Cooking Time (mins)</span>
              </div>

              <div className="h-[140px] w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.trends.cooking} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                    <XAxis dataKey="label" fontSize={8} tickLine={false} axisLine={false} />
                    <YAxis domain={[5.0, 15.0]} fontSize={8} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ fontSize: 9 }} />
                    <Line type="monotone" dataKey="mins" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-2 border-t border-zinc-150 dark:border-zinc-850 pt-4 mt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-250 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Close Analytics
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
