import React, { useMemo } from "react";
import { Clock, ShieldAlert, CheckCircle2, Moon, Sun, Sunrise, Users } from "lucide-react";
import { Skeleton } from "@food/components/ui/skeleton";

export default function ShiftStatsCards({ shifts = [], staff = [], isLoading }) {
  const stats = useMemo(() => {
    if (!shifts || !staff) {
      return { activeShifts: 0, morningStaff: 0, eveningStaff: 0, nightStaff: 0, unassignedStaff: 0 };
    }

    const activeShifts = shifts.filter((s) => s.status === "active").length;
    
    // We count staff members assigned to each shift
    const morningStaff = staff.filter((s) => s.shiftId === "Morning" && s.status === "active").length;
    const eveningStaff = staff.filter((s) => s.shiftId === "Afternoon" && s.status === "active").length;
    const nightStaff = staff.filter((s) => s.shiftId === "Night" && s.status === "active").length;
    const unassignedStaff = staff.filter((s) => !s.shiftId && s.status === "active").length;

    return { activeShifts, morningStaff, eveningStaff, nightStaff, unassignedStaff };
  }, [shifts, staff]);

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

  const isUnassignedHigh = stats.unassignedStaff > 1;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 text-xs font-semibold">
      {/* 1. Active Shifts */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-4 rounded-2xl flex items-center justify-between shadow-sm">
        <div className="space-y-0.5">
          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Active Shifts</span>
          <span className="text-xl font-black text-emerald-650 dark:text-emerald-400">{stats.activeShifts}</span>
        </div>
        <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl">
          <CheckCircle2 size={16} className="text-emerald-550" />
        </div>
      </div>

      {/* 2. Morning Staff */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-4 rounded-2xl flex items-center justify-between shadow-sm">
        <div className="space-y-0.5">
          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Morning Staff</span>
          <span className="text-xl font-black text-amber-600 dark:text-amber-400">
            {stats.morningStaff} <span className="text-[10px] text-zinc-400 font-bold">on duty</span>
          </span>
        </div>
        <div className="p-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-xl">
          <Sunrise size={16} className="text-amber-550" />
        </div>
      </div>

      {/* 3. Evening Staff */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-4 rounded-2xl flex items-center justify-between shadow-sm">
        <div className="space-y-0.5">
          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Evening Staff</span>
          <span className="text-xl font-black text-primary">
            {stats.eveningStaff} <span className="text-[10px] text-zinc-400 font-bold">on duty</span>
          </span>
        </div>
        <div className="p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-xl">
          <Sun size={16} className="text-primary" />
        </div>
      </div>

      {/* 4. Night Staff */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-4 rounded-2xl flex items-center justify-between shadow-sm">
        <div className="space-y-0.5">
          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Night Staff</span>
          <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">
            {stats.nightStaff} <span className="text-[10px] text-zinc-400 font-bold">on duty</span>
          </span>
        </div>
        <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-xl">
          <Moon size={16} className="text-indigo-550" />
        </div>
      </div>

      {/* 5. Unassigned Staff */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-4 rounded-2xl flex items-center justify-between shadow-sm col-span-2 lg:col-span-1">
        <div className="space-y-0.5">
          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Unassigned Staff</span>
          <div className="flex items-center gap-1.5">
            <span className={`text-xl font-black ${stats.unassignedStaff > 0 ? "text-rose-600 dark:text-rose-455" : "text-zinc-500"}`}>
              {stats.unassignedStaff}
            </span>
            {stats.unassignedStaff > 0 && (
              <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full border flex items-center gap-0.5 animate-pulse ${
                isUnassignedHigh
                  ? "bg-rose-50 border-rose-100 text-rose-600 dark:bg-rose-955/20 dark:border-rose-900/40"
                  : "bg-amber-50 border-amber-100 text-amber-600 dark:bg-amber-955/20 dark:border-amber-900/40"
              }`}>
                <ShieldAlert size={8} />
                <span>{isUnassignedHigh ? "Action Req" : "Warning"}</span>
              </span>
            )}
          </div>
        </div>
        <div className={`p-2.5 rounded-xl border ${
          stats.unassignedStaff > 0
            ? "bg-rose-50 border-rose-100 dark:bg-rose-955/20 dark:border-rose-900/30 text-rose-550"
            : "bg-zinc-50 border-zinc-100 dark:bg-zinc-950 dark:border-zinc-800 text-zinc-450"
        }`}>
          <Users size={16} />
        </div>
      </div>
    </div>
  );
}
