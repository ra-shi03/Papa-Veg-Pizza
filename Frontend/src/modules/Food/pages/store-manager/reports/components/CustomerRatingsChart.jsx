import React from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Star } from "lucide-react";

export default function CustomerRatingsChart({ data = [], isLoading }) {
  const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#6b7280"]; // Good color distribution

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-5 rounded-3xl animate-pulse h-80 flex flex-col justify-center items-center shadow-sm">
        <div className="w-8 h-8 bg-zinc-200 dark:bg-zinc-800 rounded-full animate-spin border-2 border-[var(--primary)] border-t-transparent" />
        <p className="text-xs text-zinc-400 font-semibold mt-2">Loading Satisfaction indices...</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-5 rounded-3xl shadow-sm flex flex-col justify-between h-80 transition-all">
      <div className="flex items-center justify-between mb-4 border-b border-zinc-50 dark:border-zinc-850 pb-2.5">
        <div className="flex items-center gap-2">
          <Star size={14} className="text-amber-500 fill-amber-550" />
          <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
            Customer Rating Distribution
          </h3>
        </div>
        <span className="text-[9px] font-bold text-zinc-450 dark:text-zinc-550">
          Feedbacks Total
        </span>
      </div>

      <div className="flex-1 w-full text-[10px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="45%"
              innerRadius={50}
              outerRadius={75}
              paddingAngle={3}
              dataKey="value"
              nameKey="name"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                borderRadius: "16px",
                borderColor: "rgba(0, 0, 0, 0.05)",
                fontSize: "10px",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
              }}
              formatter={(value, name, props) => [`${value} reviews (${props.payload.percentage}%)`, name]}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              iconSize={6}
              wrapperStyle={{ fontSize: "9px", fontWeight: "bold" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
