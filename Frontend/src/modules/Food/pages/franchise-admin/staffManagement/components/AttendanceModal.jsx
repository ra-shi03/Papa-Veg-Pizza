import React from "react"
import { Calendar as CalendarIcon, CheckCircle2, Clock, CalendarDays, AlertTriangle, X } from "lucide-react"
import { getManagerAttendance } from "../mockManagersData"

export default function AttendanceModal({ isOpen, onClose, manager }) {
  if (!isOpen || !manager) return null

  const data = getManagerAttendance(manager.id)

  // Status Styles mapping
  const statusStyles = {
    Present: "bg-emerald-500 hover:bg-emerald-600 text-white",
    Late: "bg-amber-500 hover:bg-amber-600 text-white",
    Leave: "bg-blue-500 hover:bg-blue-600 text-white",
    Absent: "bg-rose-500 hover:bg-rose-600 text-white"
  }

  // Format date helper
  const formatDate = (dateStr) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
  }

  return (
    <div className="fixed lg:left-[280px] left-0 top-[64px] right-0 bottom-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden animate-scale-up z-10">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-150 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20">
          <div className="flex items-center gap-2 text-zinc-900 dark:text-white">
            <CalendarIcon className="w-5 h-5 text-[var(--primary)]" />
            <h3 className="text-sm font-extrabold uppercase tracking-wider">Attendance Ledger</h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-250 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-850 rounded-xl">
            <img
              src={manager.profileImage}
              alt={manager.name}
              className="w-10 h-10 rounded-xl object-cover border border-zinc-200 dark:border-zinc-800"
            />
            <div>
              <p className="text-[11px] font-black text-zinc-800 dark:text-zinc-250 leading-none">{manager.name}</p>
              <p className="text-[9px] text-zinc-500 font-semibold mt-1">Code: {manager.employeeCode} • Assignment: Manager</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Attendance %", val: `${data.attendanceRate}%`, icon: CheckCircle2, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20" },
              { label: "Late Days", val: data.lateCount, icon: Clock, color: "text-amber-500 bg-amber-50 dark:bg-amber-950/20" },
              { label: "Leaves Taken", val: data.leavesTaken, icon: CalendarDays, color: "text-blue-500 bg-blue-50 dark:bg-blue-950/20" },
              { label: "Absents", val: data.absentCount, icon: AlertTriangle, color: "text-rose-500 bg-rose-50 dark:bg-rose-950/20" }
            ].map((stat, idx) => (
              <div key={idx} className="bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-850 rounded-xl p-2 text-center flex flex-col justify-between min-h-[65px]">
                <span className="block text-[8px] font-bold text-zinc-400 uppercase tracking-wider truncate">{stat.label}</span>
                <span className="block text-xs font-black text-zinc-800 dark:text-white mt-0.5">{stat.val}</span>
                <div className="flex justify-center mt-1">
                  <div className={`p-0.5 rounded ${stat.color}`}>
                    <stat.icon size={10} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Heatmap Grid */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
              <span>Last 30 Days Tracking Grid</span>
              <span className="text-zinc-500">Left (Oldest) → Right (Today)</span>
            </div>

            <div className="grid grid-cols-10 gap-1.5 p-3.5 border border-zinc-150 dark:border-zinc-850 rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/30">
              {data.calendarLogs.map((log, idx) => (
                <div
                  key={idx}
                  className={`aspect-square rounded-md flex items-center justify-center text-[9px] font-extrabold cursor-pointer transition-all duration-300 ${
                    statusStyles[log.status] || "bg-zinc-200"
                  }`}
                  title={`${formatDate(log.date)}: ${log.status}`}
                >
                  {idx + 1}
                </div>
              ))}
            </div>

            {/* Heatmap Key */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-[9px] font-bold text-zinc-500 pt-2">
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500" />
                <span>Present</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-amber-500" />
                <span>Late</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-blue-500" />
                <span>Leave</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-rose-500" />
                <span>Absent</span>
              </div>
            </div>
          </div>

          {/* Footer close */}
          <div className="flex justify-end border-t border-zinc-100 dark:border-zinc-800 pt-4 mt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-250 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Close Ledger
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
