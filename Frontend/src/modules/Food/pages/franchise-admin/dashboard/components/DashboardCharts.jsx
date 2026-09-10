import React, { useState } from "react"
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from "recharts"
import { TrendingUp, PieChart as PieIcon, Calendar } from "lucide-react"

export default function DashboardCharts({ revenueData, orderStatusData, loading }) {
  const [range, setRange] = useState("7days")

  const COLORS = {
    confirmed: "#3b82f6",     // Blue
    preparing: "#f59e0b",     // Amber
    baking: "#ea580c",        // Orange
    packed: "#a855f7",        // Purple
    out_for_delivery: "#06b6d4", // Cyan
    delivered: "#10b981",     // Emerald
    cancelled: "#ef4444"      // Red
  }

  const STATUS_LABELS = {
    confirmed: "Confirmed",
    preparing: "Preparing",
    baking: "Baking",
    packed: "Packed",
    out_for_delivery: "Out for Delivery",
    delivered: "Delivered",
    cancelled: "Cancelled"
  }

  // Format data for Pie chart
  const pieData = Object.entries(orderStatusData || {}).map(([key, value]) => ({
    name: STATUS_LABELS[key] || key,
    value: Number(value || 0),
    color: COLORS[key] || "#6b7280"
  })).filter(item => item.value > 0)

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-4 rounded-3xl animate-pulse h-80" />
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-4 rounded-3xl animate-pulse h-80" />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Revenue Trend Area Chart */}
      <div className="lg:col-span-8 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-850 p-4 rounded-3xl shadow-sm flex flex-col justify-between h-80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <h3 className="text-xs font-black text-zinc-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wide">
              <TrendingUp size={14} className="text-[var(--primary)]" />
              Revenue Trend
            </h3>
            <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">Gross revenue trajectory and order volume</p>
          </div>

          <div className="flex bg-zinc-55 dark:bg-zinc-950 p-0.5 rounded-lg border border-zinc-100 dark:border-zinc-800 self-start sm:self-center">
            {[
              { label: "7 Days", value: "7days" },
              { label: "30 Days", value: "30days" },
              { label: "6 Months", value: "6months" }
            ].map((item) => (
              <button
                key={item.value}
                onClick={() => setRange(item.value)}
                className={`px-2 py-0.5 rounded-md text-[9px] font-bold transition-all cursor-pointer ${range === item.value
                  ? "bg-[var(--primary)] text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                  }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="h-[190px] w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData || []} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="#888888" fontSize={9} tickLine={false} axisLine={false} dy={5} />
              <YAxis
                stroke="#888888"
                fontSize={9}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `₹${val >= 1000 ? `${val / 1000}k` : val}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  borderRadius: "12px",
                  borderColor: "rgba(0,0,0,0.05)",
                  fontSize: "10px",
                  boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)"
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke="var(--primary)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#revenueFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Order Status Donut Chart */}
      <div className="lg:col-span-4 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-850 p-4 rounded-3xl shadow-sm flex flex-col justify-between h-80">
        <div>
          <h3 className="text-xs font-black text-zinc-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wide">
            <PieIcon size={14} className="text-amber-500" />
            Order mix
          </h3>
          <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">Order distribution by status</p>
        </div>

        <div className="h-[150px] w-full relative flex items-center justify-center">
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={3}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    borderRadius: "12px",
                    borderColor: "rgba(0,0,0,0.05)",
                    fontSize: "10px"
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-4 text-xs text-zinc-400">No active orders</div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-1.5 overflow-y-auto max-h-[75px] scrollbar-thin">
          {pieData.map((item) => (
            <div key={item.name} className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-zinc-50 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-950/20">
              <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-[9px] text-zinc-650 dark:text-zinc-400 font-bold truncate">{item.name}</span>
              <span className="text-[9px] font-black ml-auto">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
