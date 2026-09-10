import React from "react"
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts"
import { Truck, CheckCircle2, Clock, XCircle, TrendingUp } from "lucide-react"

export default function DeliveryPerformance({ deliveryData, loading }) {
  const metrics = deliveryData?.metrics || {
    activeRiders: 0,
    deliveredOrders: 0,
    avgDeliveryTime: 0,
    failedDeliveries: 0
  }

  const chartData = deliveryData?.hourlyChart || []

  const stats = [
    { label: "Active Riders", value: metrics.activeRiders, icon: Truck, color: "text-blue-500 bg-blue-50 dark:bg-blue-950/20" },
    { label: "Delivered", value: metrics.deliveredOrders, icon: CheckCircle2, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20" },
    { label: "Avg Speed", value: `${metrics.avgDeliveryTime}m`, icon: Clock, color: "text-purple-500 bg-purple-50 dark:bg-purple-950/20" },
    { label: "Failed", value: metrics.failedDeliveries, icon: XCircle, color: "text-rose-500 bg-rose-50 dark:bg-rose-950/20" }
  ]

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-4 rounded-3xl animate-pulse h-[320px]" />
    )
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-850 p-4 rounded-3xl shadow-sm flex flex-col justify-between h-[320px]">
      <div className="shrink-0 mb-3">
        <h3 className="text-xs font-black text-zinc-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wide">
          <Truck size={14} className="text-[var(--primary)]" />
          Delivery Metrics
        </h3>
        <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">Rider fleet operational efficiency tracking</p>
      </div>

      {/* Mini stats cards */}
      <div className="grid grid-cols-4 gap-2 mb-3 shrink-0">
        {stats.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <div key={idx} className="p-2 bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-850 rounded-xl flex items-center gap-2">
              <div className={`p-1.5 rounded-lg shrink-0 ${stat.color}`}>
                <Icon size={12} />
              </div>
              <div className="min-w-0">
                <p className="text-[8px] text-zinc-400 font-bold uppercase truncate">{stat.label}</p>
                <p className="text-xs font-black text-zinc-900 dark:text-white mt-0.5 truncate">{stat.value}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Hourly delivery line chart */}
      <div className="flex-1 h-[120px] w-full mt-1">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
              <defs>
                <linearGradient id="deliveryFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="hour" stroke="#888888" fontSize={8} tickLine={false} axisLine={false} />
              <YAxis stroke="#888888" fontSize={8} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  borderRadius: "8px",
                  borderColor: "rgba(0,0,0,0.05)",
                  fontSize: "9px"
                }}
              />
              <Area
                type="monotone"
                dataKey="deliveries"
                name="Deliveries"
                stroke="#10b981"
                strokeWidth={1.5}
                fillOpacity={1}
                fill="url(#deliveryFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-6 text-xs text-zinc-400">No chart data</div>
        )}
      </div>
    </div>
  )
}
