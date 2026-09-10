import React, { useMemo } from "react";
import { Trophy, Clock, Zap, Calendar, TrendingDown } from "lucide-react";
import { Skeleton } from "@food/components/ui/skeleton";

export default function PerformanceStatsCards({ leaderboard = [], isLoading }) {
  const stats = useMemo(() => {
    if (!leaderboard || leaderboard.length === 0) {
      return {
        topPerformer: null,
        avgScore: 0,
        fastestMaker: null,
        bestAttendance: null,
        lowestDelay: null
      };
    }

    // 1. Top Performer (sorted by score descending, first item)
    const topPerformer = leaderboard[0];

    // 2. Average Score
    const totalScore = leaderboard.reduce((sum, item) => sum + Number(item.score || 0), 0);
    const avgScore = (totalScore / leaderboard.length).toFixed(1);

    // 3. Fastest Pizza Maker (lowest avgPreparationTime > 0)
    const validMakers = leaderboard.filter((item) => Number(item.avgPreparationTime) > 0);
    const fastestMaker = validMakers.length > 0 
      ? [...validMakers].sort((a, b) => a.avgPreparationTime - b.avgPreparationTime)[0] 
      : null;

    // 4. Best Attendance (highest attendancePercentage)
    const bestAttendance = [...leaderboard].sort((a, b) => b.attendancePercentage - a.attendancePercentage)[0];

    // 5. Lowest Delay Rate (delayedOrders / totalOrders)
    const validDelays = leaderboard.filter((item) => Number(item.totalOrders) > 0);
    const lowestDelay = validDelays.length > 0
      ? [...validDelays].sort((a, b) => {
          const rateA = a.delayedOrders / a.totalOrders;
          const rateB = b.delayedOrders / b.totalOrders;
          return rateA - rateB;
        })[0]
      : null;

    return { topPerformer, avgScore, fastestMaker, bestAttendance, lowestDelay };
  }, [leaderboard]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div key={idx} className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-4 rounded-2xl space-y-2 animate-pulse shadow-sm">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-6 w-12 rounded-md" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 text-xs font-semibold">
      {/* 1. Top Performer */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50/30 dark:from-zinc-900 dark:to-zinc-900 border border-amber-100 dark:border-zinc-800 p-4 rounded-2xl flex items-center justify-between shadow-sm relative overflow-hidden col-span-2 lg:col-span-1">
        <div className="space-y-1 relative z-10">
          <span className="text-[9px] font-bold text-amber-600 dark:text-amber-450 uppercase tracking-widest block flex items-center gap-1">
            <Trophy size={10} /> Top Performer
          </span>
          {stats.topPerformer ? (
            <div>
              <p className="font-extrabold text-slate-900 dark:text-white truncate max-w-[110px]">
                {stats.topPerformer.fullName}
              </p>
              <p className="text-[10px] text-amber-700 dark:text-amber-400 font-black">
                {stats.topPerformer.score}% Score
              </p>
            </div>
          ) : (
            <p className="text-zinc-400">---</p>
          )}
        </div>
        <div className="shrink-0 relative z-10">
          {stats.topPerformer?.profileImage ? (
            <img
              src={stats.topPerformer.profileImage}
              alt={stats.topPerformer.fullName}
              className="w-10 h-10 rounded-full border-2 border-amber-400 object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full border border-amber-200 bg-amber-100/50 flex items-center justify-center text-amber-550 font-black">
              👑
            </div>
          )}
        </div>
      </div>

      {/* 2. Average Score */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-4 rounded-2xl flex items-center justify-between shadow-sm">
        <div className="space-y-0.5">
          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Average Score</span>
          <span className="text-xl font-black text-slate-800 dark:text-zinc-200">
            {stats.avgScore}%
          </span>
        </div>
        <div className="p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-xl">
          <Zap size={16} className="text-primary" />
        </div>
      </div>

      {/* 3. Fastest Maker */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-4 rounded-2xl flex items-center justify-between shadow-sm">
        <div className="space-y-0.5">
          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Fastest Maker</span>
          {stats.fastestMaker ? (
            <div>
              <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                {stats.fastestMaker.avgPreparationTime} Mins
              </p>
              <p className="text-[9px] text-zinc-450 font-bold truncate max-w-[110px]">{stats.fastestMaker.fullName}</p>
            </div>
          ) : (
            <span className="text-xl font-black text-zinc-550">--</span>
          )}
        </div>
        <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl">
          <Clock size={16} className="text-emerald-550" />
        </div>
      </div>

      {/* 4. Best Attendance */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-4 rounded-2xl flex items-center justify-between shadow-sm">
        <div className="space-y-0.5">
          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Best Attendance</span>
          {stats.bestAttendance ? (
            <div>
              <p className="text-sm font-black text-blue-600 dark:text-blue-400">
                {stats.bestAttendance.attendancePercentage}%
              </p>
              <p className="text-[9px] text-zinc-450 font-bold truncate max-w-[110px]">{stats.bestAttendance.fullName}</p>
            </div>
          ) : (
            <span className="text-xl font-black text-zinc-550">--</span>
          )}
        </div>
        <div className="p-2.5 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl">
          <Calendar size={16} className="text-blue-550" />
        </div>
      </div>

      {/* 5. Lowest Delay Rate */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-4 rounded-2xl flex items-center justify-between shadow-sm">
        <div className="space-y-0.5">
          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Lowest Delay Rate</span>
          {stats.lowestDelay ? (
            <div>
              <p className="text-sm font-black text-rose-600 dark:text-rose-455">
                {((stats.lowestDelay.delayedOrders / stats.lowestDelay.totalOrders) * 100).toFixed(1)}%
              </p>
              <p className="text-[9px] text-zinc-450 font-bold truncate max-w-[110px]">{stats.lowestDelay.fullName}</p>
            </div>
          ) : (
            <span className="text-xl font-black text-zinc-550">--</span>
          )}
        </div>
        <div className="p-2.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-xl">
          <TrendingDown size={16} className="text-rose-550" />
        </div>
      </div>
    </div>
  );
}
