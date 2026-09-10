import React from "react";
import { Users, UserCheck, ShieldAlert, Award, Clock, ArrowRight } from "lucide-react";

export default function TeamTasksWidget({
  teamStats = {},
  loading = false,
  onReassignClick = () => {},
}) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl p-5 space-y-4 animate-pulse">
        <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
        <div className="h-20 bg-zinc-100 dark:bg-zinc-850 rounded-xl" />
        <div className="h-20 bg-zinc-100 dark:bg-zinc-850 rounded-xl" />
      </div>
    );
  }

  const staff = teamStats?.staffList || [];

  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-900/30";
      case "Break":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-450 dark:border-amber-900/30";
      case "Off-Shift":
      default:
        return "bg-zinc-150 text-slate-500 border-zinc-250 dark:bg-zinc-800 dark:text-zinc-500 dark:border-zinc-700";
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
      
      {/* HEADER */}
      <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
        <Users size={16} className="text-[var(--primary)]" />
        <h2 className="text-sm font-black tracking-tight text-slate-900 dark:text-white uppercase">
          Kitchen Team Operations
        </h2>
      </div>

      {/* TEAM OVERVIEW STATS GRID */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-850 flex flex-col justify-between">
          <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-wider block">
            Active Staff
          </span>
          <span className="text-base font-black text-slate-800 dark:text-zinc-200 mt-1">
            {teamStats?.activeStaffCount || 0} / {teamStats?.totalStaff || 0}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-850 flex flex-col justify-between">
          <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-555 uppercase tracking-wider block">
            Pending Queue
          </span>
          <span className="text-base font-black text-rose-500 mt-1">
            {teamStats?.pendingTasks || 0} items
          </span>
        </div>

        <div className="p-3 rounded-xl bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-850 flex flex-col justify-between">
          <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-wider block">
            Fulfill Score
          </span>
          <span className="text-base font-black text-emerald-500 mt-1">
            {teamStats?.completedToday || 0} Done
          </span>
        </div>
      </div>

      {/* ACTIVE STAFF LIST */}
      <div className="space-y-2">
        <span className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest block">
          Station Allocation
        </span>

        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
          {staff.map((member, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50/40 dark:bg-zinc-950/10 border border-zinc-100 dark:border-zinc-850/80 hover:bg-zinc-50 dark:hover:bg-zinc-950/20 transition-all"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-zinc-350 shadow-sm border border-zinc-200 dark:border-zinc-700">
                  {member.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                    {member.name}
                  </p>
                  <p className="text-[9px] font-semibold text-slate-450 dark:text-zinc-500 flex items-center gap-1 mt-0.5">
                    <Clock size={9} />
                    <span>Active tasks: <strong className="text-[var(--primary)]">{member.activeTasks}</strong></span>
                  </p>
                </div>
              </div>

              <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full border ${getStatusColor(member.status)}`}>
                {member.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
