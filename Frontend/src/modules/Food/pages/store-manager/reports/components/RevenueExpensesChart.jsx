import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Activity } from "lucide-react";

export default function RevenueExpensesChart({ data = [], isLoading }) {
  // Formatter for Indian Rupees
  const formatINR = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-5 rounded-3xl animate-pulse space-y-3 shadow-sm h-80 flex flex-col justify-center items-center">
        <div className="w-8 h-8 bg-zinc-200 dark:bg-zinc-800 rounded-full animate-spin border-2 border-[var(--primary)] border-t-transparent" />
        <p className="text-xs text-zinc-400 font-semibold">Loading Revenue vs Expenses trend...</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-5 rounded-3xl shadow-sm flex flex-col justify-between h-80 transition-all">
      <div className="flex items-center justify-between mb-4 border-b border-zinc-50 dark:border-zinc-850 pb-2.5">
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-[var(--primary)]" />
          <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
            Monthly Revenue vs Expenses
          </h3>
        </div>
        <span className="text-[9px] font-bold text-zinc-450 dark:text-zinc-550">
          Last 12 Months
        </span>
      </div>

      <div className="flex-1 w-full text-[10px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" className="dark:stroke-zinc-800/40" />
            <XAxis
              dataKey="month"
              stroke="#888888"
              fontSize={9}
              tickLine={false}
              axisLine={false}
              dy={6}
            />
            <YAxis
              stroke="#888888"
              fontSize={9}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `₹${value >= 100000 ? `${(value / 100000).toFixed(1)}L` : value}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                borderRadius: "16px",
                borderColor: "rgba(0, 0, 0, 0.05)",
                fontSize: "10px",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
              }}
              formatter={(value) => [formatINR(value), null]}
              labelStyle={{ fontWeight: "bold" }}
            />
            <Legend
              verticalAlign="top"
              height={30}
              iconType="circle"
              iconSize={6}
              wrapperStyle={{ fontSize: "9px", fontWeight: "bold" }}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              name="Revenue (INR)"
              stroke="var(--sa-primary)"
              strokeWidth={2.5}
              activeDot={{ r: 6 }}
              dot={{ r: 3, strokeWidth: 1 }}
            />
            <Line
              type="monotone"
              dataKey="expenses"
              name="Expenses (INR)"
              stroke="var(--sa-secondary)"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={{ r: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
