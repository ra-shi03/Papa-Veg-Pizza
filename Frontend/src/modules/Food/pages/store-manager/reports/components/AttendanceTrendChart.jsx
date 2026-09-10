import React from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Calendar } from "lucide-react";

export default function AttendanceTrendChart({ data = [], isLoading }) {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-5 rounded-3xl h-[300px] flex items-center justify-center animate-pulse shadow-sm">
        <div className="w-10 h-10 border-4 border-zinc-200 border-t-[var(--primary)] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-5 rounded-3xl shadow-sm flex flex-col justify-between h-[300px] transition-all duration-300">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="font-extrabold text-xs text-zinc-800 dark:text-zinc-100 flex items-center gap-1.5 uppercase tracking-wider">
            <Calendar size={13} className="text-[var(--primary)]" />
            Monthly Attendance Trend
          </h3>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold mt-0.5">Overall check-in trend index</p>
        </div>
      </div>

      <div className="flex-1 w-full h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" className="dark:stroke-zinc-800/40" />
            <XAxis
              dataKey="month"
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
              tickFormatter={(value) => `${value}%`}
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
              labelStyle={{ fontWeight: "black", color: "#6b7280" }}
              formatter={(value) => [`${value}% Attendance`, "Monthly Avg"]}
            />
            <Line
              type="monotone"
              dataKey="attendance"
              stroke="var(--primary, #a43c12)"
              strokeWidth={3}
              dot={{ r: 3, stroke: "var(--primary)", strokeWidth: 1.5, fill: "#fff" }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
