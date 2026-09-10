import React from "react";
import { Star, Eye, AlertCircle, ArrowUpRight, TrendingUp } from "lucide-react";
import { Skeleton } from "@food/components/ui/skeleton";

export default function LeaderboardTable({ leaderboard = [], isLoading, isError, onSelectStaff }) {
  const getInitials = (name = "") => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const getRankBadge = (index) => {
    if (index === 0) return <span className="text-xl">🥇</span>;
    if (index === 1) return <span className="text-xl">🥈</span>;
    if (index === 2) return <span className="text-xl">🥉</span>;
    return <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-550 ml-1">#{index + 1}</span>;
  };

  const getScoreColor = (score) => {
    if (score >= 95) return "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30";
    if (score >= 90) return "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30";
    if (score >= 85) return "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30";
    return "text-rose-600 dark:text-rose-455 bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30";
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="flex gap-4 items-center">
            <Skeleton className="w-10 h-10 rounded-full shrink-0 animate-pulse" />
            <Skeleton className="h-6 w-full rounded-md animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-12 text-center bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl space-y-4">
        <AlertCircle className="mx-auto text-rose-500" size={32} />
        <div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white">API Sync Failure</h3>
          <p className="text-xs text-zinc-400 font-semibold mt-1">Failed to fetch leaderboard data.</p>
        </div>
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <div className="p-12 text-center bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl space-y-4 flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-red-50 dark:bg-red-950/20 text-primary rounded-2xl flex items-center justify-center">
          <TrendingUp size={32} />
        </div>
        <div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white">No Performance Records</h3>
          <p className="text-xs text-zinc-450 dark:text-zinc-500 font-semibold max-w-sm mt-1">
            There are no operational data points for the selected filters.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
      {/* Desktop Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-zinc-50/70 dark:bg-zinc-950/40 border-b border-zinc-150 dark:border-zinc-850 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
              <th className="py-3 px-4 w-16 font-black text-center">Rank</th>
              <th className="py-3 px-4 font-black">Employee</th>
              <th className="py-3 px-4 font-black">Role</th>
              <th className="py-3 px-4 font-black text-center">Orders</th>
              <th className="py-3 px-4 font-black text-center">Avg Prep Speed</th>
              <th className="py-3 px-4 font-black text-center">Attendance %</th>
              <th className="py-3 px-4 font-black text-center">Delays</th>
              <th className="py-3 px-4 font-black text-center">Complaints</th>
              <th className="py-3 px-4 font-black text-center">Rating</th>
              <th className="py-3 px-4 font-black text-center">Performance Score</th>
              <th className="py-3 px-4 font-black text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 text-xs font-semibold text-slate-700 dark:text-zinc-300">
            {leaderboard.map((item, index) => (
              <tr key={item._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-950/20 transition-colors">
                {/* 1. Rank */}
                <td className="py-3 px-4 text-center">
                  {getRankBadge(index)}
                </td>

                {/* 2. Employee Info */}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900 flex items-center justify-center shrink-0 shadow-inner">
                      {item.profileImage ? (
                        <img
                          src={item.profileImage}
                          alt={item.fullName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-xs font-black text-primary">
                          {getInitials(item.fullName)}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-extrabold text-slate-900 dark:text-white truncate max-w-[130px]">
                        {item.fullName}
                      </p>
                      <p className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider mt-0.5">
                        {item.employeeCode || `EMP-${item.staffId}`}
                      </p>
                    </div>
                  </div>
                </td>

                {/* 3. Role */}
                <td className="py-3 px-4">
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-300 border border-zinc-150 dark:border-zinc-800">
                    {item.role || "Kitchen Crew"}
                  </span>
                </td>

                {/* 4. Total Orders */}
                <td className="py-3 px-4 text-center font-bold text-slate-800 dark:text-zinc-200">
                  {item.totalOrders}
                </td>

                {/* 5. Avg Prep Time */}
                <td className="py-3 px-4 text-center font-bold text-slate-800 dark:text-zinc-200">
                  {item.avgPreparationTime} min
                </td>

                {/* 6. Attendance Rate */}
                <td className="py-3 px-4 text-center">
                  <div className="flex flex-col items-center gap-1 justify-center">
                    <span className="font-bold text-slate-800 dark:text-zinc-200">
                      {item.attendancePercentage}%
                    </span>
                    <div className="w-12 h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${item.attendancePercentage}%` }}
                      />
                    </div>
                  </div>
                </td>

                {/* 7. Delayed Orders */}
                <td className="py-3 px-4 text-center">
                  <span className={`font-bold ${item.delayedOrders > 5 ? "text-rose-500" : "text-slate-800 dark:text-zinc-200"}`}>
                    {item.delayedOrders}
                  </span>
                </td>

                {/* 8. Customer Complaints */}
                <td className="py-3 px-4 text-center">
                  <span className={`font-bold ${item.customerComplaints > 0 ? "text-rose-500" : "text-slate-800 dark:text-zinc-200"}`}>
                    {item.customerComplaints}
                  </span>
                </td>

                {/* 9. Customer Rating */}
                <td className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-0.5 text-amber-500">
                    <Star size={11} fill="currentColor" />
                    <span className="font-extrabold text-slate-800 dark:text-zinc-200 text-xs">
                      {Number(item.rating || 0).toFixed(1)}
                    </span>
                  </div>
                </td>

                {/* 10. Performance Score */}
                <td className="py-3 px-4 text-center">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-black border ${getScoreColor(item.score)}`}>
                    {item.score}%
                  </span>
                </td>

                {/* 11. Actions */}
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => onSelectStaff(item.staffId)}
                    className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-850 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-primary dark:hover:text-white transition-all cursor-pointer"
                    title="View Performance Insights"
                  >
                    <Eye size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
