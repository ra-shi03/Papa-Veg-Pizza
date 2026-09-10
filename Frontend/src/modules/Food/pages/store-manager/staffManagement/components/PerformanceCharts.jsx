import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";
import { BarChart3, Clock, CalendarCheck, Heart } from "lucide-react";

export default function PerformanceCharts({ leaderboard = [] }) {
  // Sort data for specific charts if needed, or use the leaderboard sorting
  const chartData = [...leaderboard].reverse(); // reverse so highest ranks appear last/first depending on read direction

  // Light/Dark mode styling helper (standard values for CSS vars / fallbacks)
  const isDark = document.documentElement.classList.contains("dark");
  const strokeColor = isDark ? "#27272a" : "#e4e4e7"; // zinc-800 / zinc-200
  const textColor = isDark ? "#a1a1aa" : "#71717a"; // zinc-400 / zinc-500

  const CustomTooltip = ({ active, payload, label, suffix = "" }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-2xl shadow-xl text-[10px] font-bold">
          <p className="text-slate-800 dark:text-zinc-200 mb-1">{label}</p>
          <p className="text-primary font-black">
            {payload[0].value}
            {suffix}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Performance Distribution */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-5 rounded-3xl shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 rounded-xl text-orange-550">
            <BarChart3 size={15} />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-800 dark:text-zinc-200">
              Performance Distribution
            </h4>
            <p className="text-[9px] text-zinc-400 font-semibold uppercase tracking-wider">
              Overall Employee Scores Comparison
            </p>
          </div>
        </div>
        <div className="h-[200px] w-full text-[10px] font-bold">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={strokeColor} />
              <XAxis dataKey="fullName" stroke={textColor} tickLine={false} />
              <YAxis stroke={textColor} domain={[0, 100]} tickLine={false} />
              <Tooltip content={<CustomTooltip suffix="%" />} />
              <Bar dataKey="score" fill="var(--primary, #a43c12)" radius={[6, 6, 0, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Attendance Rates */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-5 rounded-3xl shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl text-blue-550">
            <CalendarCheck size={15} />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-800 dark:text-zinc-200">
              Attendance Comparison
            </h4>
            <p className="text-[9px] text-zinc-400 font-semibold uppercase tracking-wider">
              Staff Attendance Percentages
            </p>
          </div>
        </div>
        <div className="h-[200px] w-full text-[10px] font-bold">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={strokeColor} />
              <XAxis dataKey="fullName" stroke={textColor} tickLine={false} />
              <YAxis stroke={textColor} domain={[50, 100]} tickLine={false} />
              <Tooltip content={<CustomTooltip suffix="%" />} />
              <Bar dataKey="attendancePercentage" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Prep Speeds */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-5 rounded-3xl shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl text-emerald-550">
            <Clock size={15} />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-800 dark:text-zinc-200">
              Preparation Speeds
            </h4>
            <p className="text-[9px] text-zinc-450 font-bold uppercase tracking-wider">
              Avg Order Completion Times (Lower is Better)
            </p>
          </div>
        </div>
        <div className="h-[200px] w-full text-[10px] font-bold">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={strokeColor} />
              <XAxis dataKey="fullName" stroke={textColor} tickLine={false} />
              <YAxis stroke={textColor} tickLine={false} />
              <Tooltip content={<CustomTooltip suffix=" Mins" />} />
              <Line
                type="monotone"
                dataKey="avgPreparationTime"
                stroke="#10b981"
                strokeWidth={3}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Customer Satisfaction */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-5 rounded-3xl shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-xl text-rose-550">
            <Heart size={15} />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-800 dark:text-zinc-200">
              Customer Satisfaction
            </h4>
            <p className="text-[9px] text-zinc-450 font-bold uppercase tracking-wider">
              Average Feedback Ratings
            </p>
          </div>
        </div>
        <div className="h-[200px] w-full text-[10px] font-bold">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRating" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={strokeColor} />
              <XAxis dataKey="fullName" stroke={textColor} tickLine={false} />
              <YAxis stroke={textColor} domain={[1, 5]} tickLine={false} />
              <Tooltip content={<CustomTooltip suffix=" / 5.0" />} />
              <Area
                type="monotone"
                dataKey="rating"
                stroke="#f43f5e"
                fillOpacity={1}
                fill="url(#colorRating)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
