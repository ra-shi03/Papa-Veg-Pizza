import React, { useMemo } from "react";
import { X, Calendar, Clock, Award, Activity, ShieldAlert, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@food/components/ui/dialog";
import { useStaffList } from "../hooks/useStaff";
import { useAttendanceList } from "../hooks/useAttendance";

export default function AttendanceDetailsModal({ isOpen, onClose, attendanceRecord }) {
  const { data: staffList = [] } = useStaffList();
  // Fetch all attendance logs to compute historical stats and build the heatmap
  const { data: allLogs = [], isLoading: isLoadingLogs } = useAttendanceList();

  const staff = useMemo(() => {
    if (!attendanceRecord) return null;
    return staffList.find((s) => s._id === attendanceRecord.staffId);
  }, [attendanceRecord, staffList]);

  // Filter logs specifically for this employee
  const employeeLogs = useMemo(() => {
    if (!attendanceRecord) return [];
    return allLogs.filter((log) => log.staffId === attendanceRecord.staffId);
  }, [attendanceRecord, allLogs]);

  // Compute 30-day history dates (working backwards from today or log date)
  const last35Days = useMemo(() => {
    const dates = [];
    const baseDate = attendanceRecord ? new Date(attendanceRecord.date) : new Date();
    
    for (let i = 29; i >= 0; i--) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() - i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const dateStr = `${yyyy}-${mm}-${dd}`;
      
      // Find matching log for this date
      const matchingLog = employeeLogs.find((l) => l.date === dateStr);
      dates.push({
        date: dateStr,
        displayDate: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        status: matchingLog ? matchingLog.status : "none",
        log: matchingLog || null
      });
    }
    return dates;
  }, [attendanceRecord, employeeLogs]);

  // Compute performance KPIs based on the employee's history
  const kpis = useMemo(() => {
    if (employeeLogs.length === 0) {
      return { attendanceRate: 100, lateCount: 0, totalHours: 0, totalOvertime: 0 };
    }

    const presentCount = employeeLogs.filter(l => l.status === "present" || l.status === "half_day").length;
    const leaveCount = employeeLogs.filter(l => l.status === "leave").length;
    
    // Attendance rate = (present + leaves) / total logged days
    const rate = Math.round(((presentCount + leaveCount) / employeeLogs.length) * 100);
    
    // Calculate late check-ins
    let lateCount = 0;
    employeeLogs.forEach((r) => {
      if (r.status !== "present" && r.status !== "half_day") return;
      if (!r.checkIn) return;

      const parts = r.checkIn.split(" ");
      if (parts.length < 2) return;
      const hm = parts[0].split(":");
      if (hm.length < 2) return;

      const hour = parseInt(hm[0], 10);
      const min = parseInt(hm[1], 10);
      const period = parts[1].toUpperCase();

      if (r.shiftId === "Morning") {
        if (period === "AM" && (hour > 9 || (hour === 9 && min > 0))) lateCount++;
        else if (period === "PM") lateCount++;
      } else if (r.shiftId === "Afternoon") {
        if (period === "PM" && (hour > 4 && hour < 12) && (hour > 4 || min > 0)) lateCount++;
        else if (period === "AM") lateCount++;
      } else if (r.shiftId === "Night") {
        if (period === "PM" && hour === 11 && min > 0) lateCount++;
        else if (period === "AM" && (hour < 7 || (hour === 7 && min === 0))) lateCount++;
      }
    });

    const totalHours = employeeLogs.reduce((sum, l) => sum + Number(l.totalHours || 0), 0).toFixed(1);
    const totalOvertime = employeeLogs.reduce((sum, l) => sum + Number(l.overtimeHours || 0), 0).toFixed(1);

    return {
      attendanceRate: isNaN(rate) ? 100 : rate,
      lateCount,
      totalHours,
      totalOvertime
    };
  }, [employeeLogs]);

  if (!attendanceRecord) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-[95vw] bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl p-5 shadow-xl">
        <DialogHeader className="flex flex-row items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <DialogTitle className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-zinc-200">
            Attendance Record Detail
          </DialogTitle>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all cursor-pointer outline-none"
          >
            <X size={15} className="text-zinc-400" />
          </button>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mt-4 text-xs font-semibold text-slate-700 dark:text-zinc-300">
          {/* Left Panel: Employee Identity */}
          <div className="md:col-span-5 flex flex-col items-center text-center p-4 bg-zinc-50/50 dark:bg-zinc-950/40 rounded-2xl border border-zinc-150 dark:border-zinc-850">
            <img
              src={staff?.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${staff?.fullName || "Employee"}`}
              alt={staff?.fullName}
              className="w-20 h-20 rounded-full border-2 border-primary/20 object-cover bg-zinc-100 mb-3 shadow"
            />
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5 justify-center">
              {staff?.fullName || "Loading Employee..."}
            </h3>
            <span className="text-[9px] font-black uppercase text-zinc-450 tracking-wider bg-zinc-205 dark:bg-zinc-800 px-2.5 py-0.5 rounded-full mt-1">
              {staff?.employeeCode || "---"}
            </span>

            <div className="w-full mt-4 space-y-2.5 border-t border-zinc-150 dark:border-zinc-800 pt-4 text-left">
              <div className="flex justify-between">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">Role</span>
                <span className="text-slate-800 dark:text-zinc-200 font-extrabold">{staff?.role || "---"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">Shift</span>
                <span className="text-slate-800 dark:text-zinc-200 font-extrabold">{attendanceRecord.shiftId} Shift</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">Salary Mode</span>
                <span className="text-slate-800 dark:text-zinc-200 font-extrabold">{staff?.salaryType || "Monthly"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">Log Date</span>
                <span className="text-slate-800 dark:text-zinc-250 font-extrabold">
                  {new Date(attendanceRecord.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                </span>
              </div>
            </div>
          </div>

          {/* Right Panel: Logs, Heatmap, KPIs */}
          <div className="md:col-span-7 space-y-4">
            {/* KPI Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="bg-zinc-50/40 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-850 p-2.5 rounded-xl text-center">
                <span className="block text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Attendance</span>
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{kpis.attendanceRate}%</span>
              </div>
              <div className="bg-zinc-50/40 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-850 p-2.5 rounded-xl text-center">
                <span className="block text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Late Arrivals</span>
                <span className="text-sm font-black text-rose-500">{kpis.lateCount} Days</span>
              </div>
              <div className="bg-zinc-50/40 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-850 p-2.5 rounded-xl text-center">
                <span className="block text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Hours Logged</span>
                <span className="text-sm font-black text-slate-800 dark:text-zinc-200">{kpis.totalHours}h</span>
              </div>
              <div className="bg-zinc-50/40 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-850 p-2.5 rounded-xl text-center">
                <span className="block text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Overtime</span>
                <span className="text-sm font-black text-primary">{kpis.totalOvertime}h</span>
              </div>
            </div>

            {/* Current Log Stats */}
            <div className="bg-zinc-50/20 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-800/80 p-3 rounded-2xl space-y-2">
              <h4 className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest">Log details</h4>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex gap-2 items-center">
                  <Clock size={13} className="text-zinc-400" />
                  <div>
                    <span className="text-zinc-450 block font-bold text-[9px] uppercase">Check In</span>
                    <span className="font-extrabold text-slate-850">{attendanceRecord.checkIn || "---"}</span>
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <Clock size={13} className="text-zinc-400" />
                  <div>
                    <span className="text-zinc-450 block font-bold text-[9px] uppercase">Check Out</span>
                    <span className="font-extrabold text-slate-850">{attendanceRecord.checkOut || "---"}</span>
                  </div>
                </div>
              </div>

              {attendanceRecord.notes && (
                <div className="bg-zinc-100/60 dark:bg-zinc-900/60 border border-zinc-200/50 dark:border-zinc-800 p-2 rounded-xl text-[10px] mt-2 flex gap-1.5">
                  <ShieldAlert size={12} className="text-zinc-450 shrink-0 mt-0.5" />
                  <p className="text-zinc-600 dark:text-zinc-400 font-bold italic">"{attendanceRecord.notes}"</p>
                </div>
              )}

              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 text-[9px] text-zinc-400 flex justify-between font-bold">
                <span>Marked By: {attendanceRecord.markedBy}</span>
                <span>Logged at: {new Date(attendanceRecord.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            </div>

            {/* 30-Day Heatmap Grid */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest pl-0.5">30-Day Attendance Heatmap</h4>
              {isLoadingLogs ? (
                <div className="h-20 flex items-center justify-center text-zinc-400 text-xs">Loading heatmap...</div>
              ) : (
                <div className="p-3 bg-zinc-50/30 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-850 rounded-2xl">
                  {/* Grid of 30 blocks */}
                  <div className="grid grid-cols-10 gap-1.5 justify-items-center">
                    {last35Days.map((d, index) => {
                      let color = "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500"; // None
                      if (d.status === "present") color = "bg-emerald-500 text-white hover:scale-110 shadow-sm shadow-emerald-400/20";
                      if (d.status === "absent") color = "bg-rose-500 text-white hover:scale-110 shadow-sm shadow-rose-450/20";
                      if (d.status === "half_day") color = "bg-amber-500 text-white hover:scale-110 shadow-sm shadow-amber-400/20";
                      if (d.status === "leave") color = "bg-blue-500 text-white hover:scale-110 shadow-sm shadow-blue-400/20";

                      return (
                        <div
                          key={index}
                          title={`${d.displayDate}: ${d.status === "none" ? "Day Off/No Log" : d.status.replace("_", " ").toUpperCase()}`}
                          className={`w-6 h-6 rounded-md cursor-pointer transition-all duration-150 flex items-center justify-center text-[8px] font-black ${color}`}
                        >
                          {index + 1}
                        </div>
                      );
                    })}
                  </div>

                  {/* Heatmap Legend */}
                  <div className="flex flex-wrap items-center justify-center gap-3 mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-[8px] font-black uppercase text-zinc-450 tracking-wider">
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded bg-emerald-500"></span> Present
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded bg-rose-500"></span> Absent
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded bg-amber-500"></span> Half Day
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded bg-blue-500"></span> Leave
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded bg-zinc-200 dark:bg-zinc-800"></span> Day Off
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
