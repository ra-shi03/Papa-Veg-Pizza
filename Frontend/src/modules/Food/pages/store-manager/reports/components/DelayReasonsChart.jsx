import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { AlertCircle } from "lucide-react";

export default function DelayReasonsChart({ data = [], isLoading }) {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-5 rounded-3xl h-[300px] flex items-center justify-center animate-pulse shadow-sm">
        <div className="w-10 h-10 border-4 border-zinc-200 border-t-[var(--primary)] rounded-full animate-spin" />
      </div>
    );
  }

  // Curated color scheme
  const COLORS = ["#a43c12", "#ff7f50", "#fbbf24", "#3b82f6"];

  const renderCustomLegend = (value, entry) => {
    const { payload } = entry;
    return (
      <span className="text-[10px] font-bold text-zinc-650 dark:text-zinc-400">
        {value} ({payload.percentage}%)
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-5 rounded-3xl shadow-sm flex flex-col justify-between h-[300px] transition-all duration-300">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h3 className="font-extrabold text-xs text-zinc-800 dark:text-zinc-100 flex items-center gap-1.5 uppercase tracking-wider">
            <AlertCircle size={13} className="text-[var(--primary)]" />
            Delay Reasons
          </h3>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold mt-0.5">Primary bottlenecks in preparation</p>
        </div>
      </div>

      <div className="flex-1 w-full h-[180px] flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={70}
              paddingAngle={4}
              dataKey="value"
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
                fontWeight: "bold",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
              }}
              formatter={(value, name, props) => [`${value} Orders (${props.payload.percentage}%)`, name]}
            />
            <Legend
              verticalAlign="bottom"
              iconSize={8}
              iconType="circle"
              formatter={renderCustomLegend}
              wrapperStyle={{ bottom: -5 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
