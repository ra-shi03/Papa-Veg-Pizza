import React, { useMemo } from "react";
import { UserCheck, UserX, Clock, Award, Activity } from "lucide-react";
import { Skeleton } from "@food/components/ui/skeleton";

export default function AttendanceStatsCards({ records = [], isLoading }) {
  const stats = useMemo(() => {
    if (!records || records.length === 0) {
      return { present: 0, absent: 0, late: 0, overtime: 0, avgHours: 0 };
    }

    const present = records.filter((r) => r.status === "present").length;
    const absent = records.filter((r) => r.status === "absent").length;
    const overtime = records.filter((r) => Number(r.overtimeHours) > 0).length;

    // Helper to determine if a check-in is late
    // Morning starts 09:00 AM, Afternoon 04:00 PM, Night 11:00 PM
    let late = 0;
    records.forEach((r) => {
      if (r.status !== "present" && r.status !== "half_day") return;
      if (!r.checkIn) return;

      const timeStr = r.checkIn; // "09:05 AM"
      const parts = timeStr.split(" ");
      if (parts.length < 2) return;

      const hm = parts[0].split(":");
      if (hm.length < 2) return;

      const hour = parseInt(hm[0], 10);
      const min = parseInt(hm[1], 10);
      const period = parts[1].toUpperCase();

      if (r.shiftId === "Morning") {
        // Late if check-in > 09:00 AM
        if (period === "AM" && (hour > 9 || (hour === 9 && min > 0))) {
          late++;
        } else if (period === "PM") {
          late++;
        }
      } else if (r.shiftId === "Afternoon") {
        // Late if check-in > 04:00 PM
        if (period === "PM" && (hour > 4 && hour < 12) && (hour > 4 || min > 0)) {
          late++;
        } else if (period === "AM") {
          late++; // past midnight
        }
      } else if (r.shiftId === "Night") {
        // Late if check-in > 11:00 PM
        if (period === "PM" && hour === 11 && min > 0) {
          late++;
        } else if (period === "AM") {
          // between 12:00 AM and 07:00 AM
          if (hour < 7 || (hour === 7 && min === 0)) {
            late++;
          }
        }
      }
    });

    // Average Working Hours
    const presentRecords = records.filter((r) => r.status === "present" || r.status === "half_day");
    const totalHours = presentRecords.reduce((sum, r) => sum + Number(r.totalHours || 0), 0);
    const avgHours = presentRecords.length > 0 ? (totalHours / presentRecords.length).toFixed(1) : "0.0";

    return { present, absent, late, overtime, avgHours };
  }, [records]);

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
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      {/* 1. Present Today */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-4 rounded-2xl flex items-center justify-between shadow-sm">
        <div className="space-y-0.5">
          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Present Today</span>
          <span className="text-xl font-black text-emerald-650 dark:text-emerald-400">{stats.present}</span>
        </div>
        <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl">
          <UserCheck size={16} className="text-emerald-550" />
        </div>
      </div>

      {/* 2. Absent Today */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-4 rounded-2xl flex items-center justify-between shadow-sm">
        <div className="space-y-0.5">
          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Absent Today</span>
          <span className="text-xl font-black text-rose-600 dark:text-rose-450">{stats.absent}</span>
        </div>
        <div className="p-2.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-xl">
          <UserX size={16} className="text-rose-550" />
        </div>
      </div>

      {/* 3. Late Arrivals */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-4 rounded-2xl flex items-center justify-between shadow-sm">
        <div className="space-y-0.5">
          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Late Arrivals</span>
          <span className="text-xl font-black text-amber-600 dark:text-amber-400">{stats.late}</span>
        </div>
        <div className="p-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-xl">
          <Clock size={16} className="text-amber-550" />
        </div>
      </div>

      {/* 4. Overtime Staff */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-4 rounded-2xl flex items-center justify-between shadow-sm">
        <div className="space-y-0.5">
          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Overtime Staff</span>
          <span className="text-xl font-black text-primary">{stats.overtime}</span>
        </div>
        <div className="p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-xl">
          <Award size={16} className="text-primary" />
        </div>
      </div>

      {/* 5. Avg Working Hours */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-4 rounded-2xl flex items-center justify-between shadow-sm">
        <div className="space-y-0.5">
          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Avg Working Hours</span>
          <span className="text-xl font-black text-slate-800 dark:text-zinc-200">{stats.avgHours} Hours</span>
        </div>
        <div className="p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-xl">
          <Activity size={16} className="text-zinc-500" />
        </div>
      </div>
    </div>
  );
}
