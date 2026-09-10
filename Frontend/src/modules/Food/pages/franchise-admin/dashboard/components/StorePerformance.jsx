import React from "react"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts"
import { BarChart3, Star, CheckCircle2, ChevronRight } from "lucide-react"
import { toast } from "sonner"

export default function StorePerformance({ stores, loading }) {
  const topStores = stores?.slice(0, 10) || []

  // Recharts payload
  const chartData = topStores.map(store => ({
    name: store.name,
    orders: store.orders,
    revenue: store.revenue / 1000 // Display in thousands
  }))

  const handleViewStore = (storeName) => {
    toast.success(`Opening detailed performance analytics page for ${storeName}`)
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-4 rounded-3xl animate-pulse h-[400px]" />
    )
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-850 p-4 rounded-3xl shadow-sm flex flex-col justify-between h-[400px]">
      <div className="shrink-0 mb-3">
        <h3 className="text-xs font-black text-zinc-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wide">
          <BarChart3 size={14} className="text-[var(--primary)]" />
          Store Performance Index
        </h3>
        <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">Top performing franchise locations in this region</p>
      </div>

      {/* Bar Chart representing Revenue (thousands) */}
      <div className="h-[120px] w-full mt-1 shrink-0">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <XAxis dataKey="name" stroke="#888888" fontSize={7} tickLine={false} axisLine={false} />
              <YAxis stroke="#888888" fontSize={8} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}k`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  borderRadius: "8px",
                  borderColor: "rgba(0,0,0,0.05)",
                  fontSize: "9px"
                }}
              />
              <Bar dataKey="revenue" fill="var(--primary)" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? "var(--primary)" : "var(--primary-hover)"} fillOpacity={0.8 - (index * 0.05)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-6 text-xs text-zinc-400">No performance data</div>
        )}
      </div>

      {/* Store Leaderboard Cards */}
      <div className="flex-1 overflow-y-auto space-y-2 mt-3 pr-1 scrollbar-thin">
        {topStores.map((store, index) => (
          <div
            key={index}
            className="p-2 bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-850 rounded-2xl flex items-center justify-between hover:border-[var(--primary)]/30 hover:bg-white dark:hover:bg-zinc-850/50 hover:shadow-sm cursor-pointer transition-all duration-300"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] text-white shrink-0 ${
                index === 0 ? "bg-amber-500" : index === 1 ? "bg-zinc-400" : index === 2 ? "bg-orange-400" : "bg-zinc-300 dark:bg-zinc-700"
              }`}>
                {index + 1}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-zinc-900 dark:text-white truncate">{store.name}</p>
                <div className="flex items-center gap-2 mt-0.5 text-[8px] text-zinc-450 dark:text-zinc-500 font-bold">
                  <span className="flex items-center gap-0.5 text-amber-500"><Star size={8} className="fill-amber-500" /> {store.rating}</span>
                  <span className="flex items-center gap-0.5 text-emerald-500"><CheckCircle2 size={8} /> {store.completion}% completion</span>
                </div>
              </div>
            </div>

            <div className="text-right flex items-center gap-2 shrink-0">
              <div>
                <p className="text-[10px] font-black text-zinc-900 dark:text-white">₹{Number(store.revenue).toLocaleString("en-IN")}</p>
                <p className="text-[8px] font-bold text-zinc-405 dark:text-zinc-500 mt-0.5">{store.orders} Orders</p>
              </div>
              <button
                onClick={() => handleViewStore(store.name)}
                className="p-1 text-zinc-400 hover:text-[var(--primary)] hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-all cursor-pointer"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
