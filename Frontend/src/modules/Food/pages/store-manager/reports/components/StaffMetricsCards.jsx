import React from "react";
import { UserCheck, Calendar, Clock, AlertTriangle, AlertOctagon, Activity, Star, TrendingUp, TrendingDown } from "lucide-react";

const SkeletonCard = () => (
  <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-4.5 rounded-3xl animate-pulse space-y-3 shadow-sm">
    <div className="flex justify-between items-center">
      <div className="w-16 h-3 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
      <div className="w-7 h-7 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
    </div>
    <div className="w-20 h-6 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
    <div className="w-12 h-3 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
  </div>
);

export default function StaffMetricsCards({ data, isLoading }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 animate-pulse">
        {Array.from({ length: 6 }).map((_, idx) => (
          <SkeletonCard key={idx} />
        ))}
      </div>
    );
  }

  const {
    topPerformer = {},
    avgAttendance = 0,
    avgAttendanceTrend = 0,
    avgPrepTime = 0,
    customerComplaints = 0,
    customerComplaintsTrend = 0,
    delayedTasks = 0,
    staffEfficiency = 0
  } = data || {};

  const isAttendancePos = avgAttendanceTrend >= 0;
  const isComplaintsPos = customerComplaintsTrend < 0; // Lower complaints is good

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      
      {/* 1. Top Performer Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-4.5 rounded-3xl flex flex-col justify-between shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all duration-300">
        <div className="flex justify-between items-start gap-1">
          <span className="text-[9px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            Top Performer
          </span>
          <div className="p-1 rounded-full bg-emerald-500/10 text-emerald-500">
            <UserCheck size={12} className="stroke-[2.5]" />
          </div>
        </div>

        {topPerformer.name ? (
          <div className="flex items-center gap-2.5 my-2">
            <img 
              src={topPerformer.avatar} 
              alt={topPerformer.name} 
              className="w-9 h-9 rounded-full object-cover border border-emerald-500/30"
              onError={(e) => {
                e.target.src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80&q=80";
              }}
            />
            <div className="min-w-0">
              <div className="text-xs font-black text-slate-900 dark:text-white truncate">{topPerformer.name}</div>
              <div className="text-[9px] text-zinc-400 font-bold">{topPerformer.role}</div>
            </div>
          </div>
        ) : (
          <div className="text-xs text-zinc-400 py-3">No Performer Listed</div>
        )}

        <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500 border-t border-zinc-50 dark:border-zinc-850 pt-2 shrink-0">
          <span className="text-emerald-500 font-black">{topPerformer.efficiency}% Eff.</span>
          <span className="flex items-center gap-0.5 text-amber-500">
            <Star size={9} className="fill-amber-500" />
            {topPerformer.rating}
          </span>
        </div>
      </div>

      {/* 2. Average Attendance */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-4.5 rounded-3xl flex flex-col justify-between shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all duration-300">
        <div className="flex justify-between items-start gap-1">
          <span className="text-[9px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            Avg Attendance
          </span>
          <div className="p-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500">
            <Calendar size={12} className="stroke-[2.5]" />
          </div>
        </div>

        <div className="text-lg font-black text-slate-900 dark:text-white tracking-tight my-2">
          {avgAttendance}%
        </div>

        <div className="flex items-center gap-1">
          <span className={`text-[8px] font-extrabold px-1 rounded-md flex items-center gap-0.5 ${
            isAttendancePos 
              ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20" 
              : "text-rose-600 bg-rose-50 dark:bg-rose-950/20"
          }`}>
            {isAttendancePos ? <TrendingUp size={7} /> : <TrendingDown size={7} />}
            {isAttendancePos ? `+${avgAttendanceTrend}%` : `${avgAttendanceTrend}%`}
          </span>
          <span className="text-[8px] text-zinc-400 dark:text-zinc-500 font-bold">vs last week</span>
        </div>
      </div>

      {/* 3. Average Prep Time */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-4.5 rounded-3xl flex flex-col justify-between shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all duration-300">
        <div className="flex justify-between items-start gap-1">
          <span className="text-[9px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            Avg Prep Time
          </span>
          <div className="p-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-500">
            <Clock size={12} className="stroke-[2.5]" />
          </div>
        </div>

        <div className="text-lg font-black text-slate-900 dark:text-white tracking-tight my-2">
          {avgPrepTime} mins
        </div>

        <div className="text-[8px] font-bold text-zinc-400 dark:text-zinc-500">
          Average kitchen task speed
        </div>
      </div>

      {/* 4. Customer Complaints */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-4.5 rounded-3xl flex flex-col justify-between shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all duration-300">
        <div className="flex justify-between items-start gap-1">
          <span className="text-[9px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            Complaints
          </span>
          <div className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-500">
            <AlertTriangle size={12} className="stroke-[2.5]" />
          </div>
        </div>

        <div className="text-lg font-black text-slate-900 dark:text-white tracking-tight my-2">
          {customerComplaints}
        </div>

        <div className="flex items-center gap-1">
          <span className={`text-[8px] font-extrabold px-1 rounded-md flex items-center gap-0.5 ${
            isComplaintsPos 
              ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20" 
              : "text-rose-600 bg-rose-50 dark:bg-rose-950/20"
          }`}>
            {isComplaintsPos ? <TrendingDown size={7} /> : <TrendingUp size={7} />}
            {customerComplaintsTrend} complaints
          </span>
          <span className="text-[8px] text-zinc-400 dark:text-zinc-500 font-bold">vs last week</span>
        </div>
      </div>

      {/* 5. Delayed Tasks */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-4.5 rounded-3xl flex flex-col justify-between shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all duration-300">
        <div className="flex justify-between items-start gap-1">
          <span className="text-[9px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            Delayed Tasks
          </span>
          <div className="p-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-500">
            <AlertOctagon size={12} className="stroke-[2.5]" />
          </div>
        </div>

        <div className="text-lg font-black text-slate-900 dark:text-white tracking-tight my-2">
          {delayedTasks}
        </div>

        <div className="text-[8px] font-bold text-rose-500">
          Late prep logs
        </div>
      </div>

      {/* 6. Staff Efficiency */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-4.5 rounded-3xl flex flex-col justify-between shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all duration-300">
        <div className="flex justify-between items-start gap-1">
          <span className="text-[9px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            Overall Efficiency
          </span>
          <div className="p-1.5 rounded-xl bg-red-50 dark:bg-red-950/20 text-[var(--primary)]">
            <Activity size={12} className="stroke-[2.5]" />
          </div>
        </div>

        <div className="flex flex-col gap-0.5 my-2">
          <span className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
            {staffEfficiency}%
          </span>
          <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-1.5">
            <div 
              className="bg-[var(--primary)] h-full transition-all duration-550" 
              style={{ width: `${staffEfficiency}%` }}
            />
          </div>
        </div>

        <div className="text-[8px] font-bold text-zinc-400 dark:text-zinc-500">
          Completed vs assigned jobs
        </div>
      </div>

    </div>
  );
}
