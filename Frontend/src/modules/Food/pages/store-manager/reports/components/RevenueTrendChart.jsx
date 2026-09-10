import React from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { TrendingUp } from "lucide-react";

export default function RevenueTrendChart({ data = [], isLoading }) {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-5 rounded-3xl h-[320px] flex items-center justify-center animate-pulse shadow-sm">
        <div className="w-10 h-10 border-4 border-zinc-200 border-t-[var(--primary)] rounded-full animate-spin" />
      </div>
    );
  }

  // Fallback if data is empty
  const chartData = data.length > 0 ? data : [
    { time: "10:00", revenue: 0 },
    { time: "12:00", revenue: 0 },
    { time: "14:00", revenue: 0 },
    { time: "16:00", revenue: 0 },
    { time: "18:00", revenue: 0 },
    { time: "20:00", revenue: 0 },
    { time: "22:00", revenue: 0 },
  ];

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-5 rounded-3xl shadow-sm flex flex-col justify-between h-[320px] transition-all">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="font-extrabold text-xs text-zinc-800 dark:text-zinc-100 flex items-center gap-1.5 uppercase tracking-wider">
            <TrendingUp size={13} className="text-[var(--primary)]" />
            Hourly Revenue Trend
          </h3>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold mt-0.5">Average revenue hourly index</p>
        </div>
        <span className="text-[9px] font-bold text-[var(--primary)] px-2 py-0.5 bg-[var(--primary)]/10 rounded-full border border-[var(--primary)]/15">
          Live POS Feed
        </span>
      </div>

      <div className="flex-1 w-full h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSalesRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--primary, #a43c12)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--primary, #a43c12)" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" className="dark:stroke-zinc-800/40" />
            <XAxis
              dataKey="time"
              stroke="#888888"
              fontSize={9}
              fontWeight="bold"
              tickLine={false}
              axisLine={false}
              dy={5}
            />
            <YAxis
              stroke="#888888"
              fontSize={9}
              fontWeight="bold"
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `₹${value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                borderRadius: "16px",
                borderColor: "rgba(0, 0, 0, 0.05)",
                fontSize: "10px",
                fontWeight: "bold",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
              }}
              className="dark:!bg-zinc-900 dark:!border-zinc-800 dark:!text-white"
              labelStyle={{ fontWeight: "black", color: "#6b7280" }}
              formatter={(value) => [`₹${value.toLocaleString("en-IN")}`, "Revenue"]}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="var(--primary, #a43c12)"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorSalesRevenue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
