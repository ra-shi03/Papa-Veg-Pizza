import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { Activity } from "lucide-react";

const STATUS_COLORS = ["#10b981", "#ef4444", "#8b5cf6"]; // Completed, Cancelled, Refunded

export default function OrderStatusChart({ data = {}, isLoading }) {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-5 rounded-3xl h-[320px] flex items-center justify-center animate-pulse shadow-sm">
        <div className="w-10 h-10 border-4 border-zinc-200 border-t-[var(--primary)] rounded-full animate-spin" />
      </div>
    );
  }

  const { completed = 0, cancelled = 0, refunded = 0 } = data || {};
  const total = completed + cancelled + refunded;

  const chartData = [
    { name: "Completed", value: completed },
    { name: "Cancelled", value: cancelled },
    { name: "Refunded", value: refunded },
  ].filter(item => item.value > 0);

  const customTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const percent = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
      return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-3 rounded-2xl shadow-xl text-xs font-bold text-zinc-800 dark:text-white">
          <p className="text-zinc-500 font-extrabold text-[10px] uppercase tracking-wider">{item.name}</p>
          <p className="text-sm font-black mt-1 text-[var(--primary)]">{item.value.toLocaleString()} Orders</p>
          <p className="text-[10px] text-emerald-500 mt-0.5">{percent}% of Total</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-5 rounded-3xl shadow-sm flex flex-col justify-between h-[320px] transition-all">
      <div>
        <h3 className="font-extrabold text-xs text-zinc-800 dark:text-zinc-100 flex items-center gap-1.5 uppercase tracking-wider">
          <Activity size={13} className="text-[var(--primary)]" />
          Order Operations Summary
        </h3>
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold mt-0.5">Order fullfilment and cancellation ratio</p>
      </div>

      <div className="flex-1 w-full h-[180px] flex items-center justify-center relative">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={4}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={customTooltip} />
              <Legend 
                verticalAlign="bottom" 
                height={36} 
                iconType="circle"
                iconSize={8}
                formatter={(value, entry) => {
                  const item = chartData.find(d => d.name === value);
                  if (!item) return value;
                  const pct = total > 0 ? ((item.value / total) * 100).toFixed(0) : 0;
                  return (
                    <span className="text-[10px] font-bold text-zinc-650 dark:text-zinc-350">
                      {value} ({pct}%)
                    </span>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center text-xs font-bold text-zinc-400">
            No order status records found
          </div>
        )}
      </div>
    </div>
  );
}
