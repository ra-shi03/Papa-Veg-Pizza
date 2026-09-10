import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Trash2 } from "lucide-react";

export default function WasteAnalysisChart({ data = [], isLoading }) {
  const formatINR = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-5 rounded-3xl animate-pulse h-80 flex flex-col justify-center items-center shadow-sm">
        <div className="w-8 h-8 bg-zinc-200 dark:bg-zinc-800 rounded-full animate-spin border-2 border-[var(--primary)] border-t-transparent" />
        <p className="text-xs text-zinc-400 font-semibold mt-2">Loading Waste analysis...</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-855 p-5 rounded-3xl shadow-sm flex flex-col justify-between h-80 transition-all">
      <div className="flex items-center justify-between mb-4 border-b border-zinc-50 dark:border-zinc-850 pb-2.5">
        <div className="flex items-center gap-2">
          <Trash2 size={14} className="text-orange-555" />
          <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
            Ingredient Waste Cost (INR)
          </h3>
        </div>
        <span className="text-[9px] font-bold text-orange-600 bg-orange-50 dark:bg-orange-950/20 px-1.5 py-0.5 rounded-full border border-orange-100 dark:border-orange-900/30">
          Top Wasted Assets
        </span>
      </div>

      <div className="flex-1 w-full text-[10px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" className="dark:stroke-zinc-800/40" />
            <XAxis
              dataKey="ingredient"
              stroke="#888888"
              fontSize={8.5}
              tickLine={false}
              axisLine={false}
              dy={6}
            />
            <YAxis
              stroke="#888888"
              fontSize={9}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `₹${value >= 1000 ? `${value / 1000}k` : value}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                borderRadius: "16px",
                borderColor: "rgba(0, 0, 0, 0.05)",
                fontSize: "10px",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
              }}
              formatter={(value, name, props) => [formatINR(value), `Waste Cost (${props.payload.qty})`]}
              labelStyle={{ fontWeight: "bold" }}
            />
            <Bar dataKey="cost" radius={[10, 10, 0, 0]} maxBarSize={35}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index === 0 ? "var(--sa-primary)" : "var(--sa-secondary)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
