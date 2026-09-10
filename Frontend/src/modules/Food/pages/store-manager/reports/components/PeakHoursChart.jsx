import React from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Clock } from "lucide-react";

export default function PeakHoursChart({ data = [], isLoading }) {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-5 rounded-3xl h-[300px] flex items-center justify-center animate-pulse shadow-sm">
        <div className="w-8 h-8 border-4 border-zinc-200 border-t-[var(--primary)] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-5 rounded-3xl shadow-sm flex flex-col justify-between h-[300px] transition-all">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="font-extrabold text-xs text-zinc-800 dark:text-zinc-100 flex items-center gap-1.5 uppercase tracking-wider">
            <Clock size={13} className="text-[var(--primary)]" />
            Peak Hours Analysis
          </h3>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold mt-0.5">Order distribution by hour of day</p>
        </div>
        <span className="text-[9px] font-bold text-[var(--primary)] px-2 py-0.5 bg-[var(--primary)]/10 rounded-full border border-[var(--primary)]/15">
          Hourly Index
        </span>
      </div>

      <div className="flex-1 w-full h-[180px]">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="colorOrdersCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary, #a43c12)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--primary, #a43c12)" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" className="dark:stroke-zinc-850" />
              <XAxis
                dataKey="hour"
                stroke="#888888"
                fontSize={8}
                fontWeight="bold"
                tickLine={false}
                axisLine={false}
                dy={5}
              />
              <YAxis
                stroke="#888888"
                fontSize={8}
                fontWeight="bold"
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `${val} ord`}
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
                formatter={(val) => [`${val} Orders`, "Volume"]}
              />
              <Area
                type="monotone"
                dataKey="orders"
                stroke="var(--primary, #a43c12)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorOrdersCount)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center text-xs font-bold text-zinc-400 py-12">
            No order volume history available
          </div>
        )}
      </div>
    </div>
  );
}
