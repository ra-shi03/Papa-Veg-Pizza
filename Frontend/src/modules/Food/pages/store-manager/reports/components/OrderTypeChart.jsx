import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { ShoppingBag } from "lucide-react";

const TYPE_COLORS = ["#3b82f6", "#10b981", "#ff7f50"]; // Delivery, Takeaway, Dine-In (Blue, Emerald, Secondary Coral)

const formatINR = (num) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num || 0);
};

export default function OrderTypeChart({ data = [], isLoading }) {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-5 rounded-3xl h-[300px] flex items-center justify-center animate-pulse shadow-sm">
        <div className="w-8 h-8 border-4 border-zinc-200 border-t-[var(--primary)] rounded-full animate-spin" />
      </div>
    );
  }

  const totalOrders = data.reduce((sum, item) => sum + item.count, 0);

  const customTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const percent = totalOrders > 0 ? ((item.count / totalOrders) * 100).toFixed(1) : 0;
      return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-3 rounded-2xl shadow-xl text-xs font-bold text-zinc-800 dark:text-white space-y-1">
          <p className="text-zinc-500 font-extrabold text-[10px] uppercase tracking-wider">{item.type}</p>
          <p className="text-sm font-black text-[var(--primary)]">{item.count.toLocaleString()} Orders ({percent}%)</p>
          <p className="text-[10px] text-emerald-500 font-bold">Revenue: {formatINR(item.revenue)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-5 rounded-3xl shadow-sm flex flex-col justify-between h-[300px] transition-all">
      <div>
        <h3 className="font-extrabold text-xs text-zinc-800 dark:text-zinc-100 flex items-center gap-1.5 uppercase tracking-wider">
          <ShoppingBag size={13} className="text-[var(--primary)]" />
          Dining Type Breakdown
        </h3>
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold mt-0.5">Order distribution by service type</p>
      </div>

      <div className="flex-1 w-full h-[180px] flex items-center justify-center relative">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={4}
                dataKey="count"
                nameKey="type"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={TYPE_COLORS[index % TYPE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={customTooltip} />
              <Legend 
                verticalAlign="bottom" 
                height={36} 
                iconType="circle"
                iconSize={8}
                formatter={(value) => {
                  const item = data.find(d => d.type === value);
                  if (!item) return value;
                  const pct = totalOrders > 0 ? ((item.count / totalOrders) * 100).toFixed(0) : 0;
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
            No dining type records found
          </div>
        )}
      </div>
    </div>
  );
}
