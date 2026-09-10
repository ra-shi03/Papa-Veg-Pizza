import React from "react"
import { Calendar as CalendarIcon, CheckCircle2, Clock, CalendarDays, AlertTriangle, X, ShieldAlert } from "lucide-react"
import { getKitchenAttendance } from "../mockManagersData"

export default function KitchenAttendanceModal({ isOpen, onClose, staff }) {
  if (!isOpen || !staff) return null

  const data = getKitchenAttendance(staff.id)

  const statusStyles = {
    Present: "bg-emerald-500 hover:bg-emerald-600 text-white",
    Late: "bg-amber-500 hover:bg-amber-600 text-white",
    Leave: "bg-blue-500 hover:bg-blue-600 text-white",
    Absent: "bg-rose-500 hover:bg-rose-600 text-white"
  }

  const formatDate = (dateStr) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })
  }

  return (
    <div className="fixed lg:left-[280px] left-0 top-[64px] right-0 bottom-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop restricted to content area */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden animate-scale-up z-10">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-150 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20">
          <div className="flex items-center gap-2 text-zinc-900 dark:text-white">
            <CalendarIcon className="w-5 h-5 text-[var(--primary)]" />
            <h3 className="text-sm font-extrabold uppercase tracking-wider">Kitchen Attendance Ledger</h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-250 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto scrollbar-thin">
          <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-850 rounded-xl">
            <img
              src={staff.profileImage}
              alt={staff.name}
              className="w-10 h-10 rounded-xl object-cover border border-zinc-200 dark:border-zinc-800 shrink-0"
            />
            <div>
              <p className="text-[11px] font-black text-zinc-800 dark:text-zinc-250 leading-none">{staff.name}</p>
              <p className="text-[9px] text-zinc-500 font-semibold mt-1">Code: {staff.employeeCode} • Role: Kitchen Cook</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Attendance %", val: `${data.attendanceRate}%`, icon: CheckCircle2, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20" },
              { label: "Late Counts", val: data.lateCount, icon: Clock, color: "text-amber-500 bg-amber-50 dark:bg-amber-950/20" },
              { label: "Leaves taken", val: data.leavesTaken, icon: CalendarDays, color: "text-blue-500 bg-blue-50 dark:bg-blue-950/20" },
              { label: "Overtime Hours", val: `${data.overtimeHours} hrs`, icon: ShieldAlert, color: "text-purple-600 bg-purple-50 dark:bg-purple-950/20" }
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
              <span>Attendance Calendar Matrix</span>
              <span className="text-zinc-500">Left (Oldest) → Right (Today)</span>
            </div>

            <div className="grid grid-cols-10 gap-1.5 p-3.5 border border-zinc-150 dark:border-zinc-850 rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/30">
              {data.calendarLogs.map((log, idx) => (
                <div
                  key={idx}
                  className={`aspect-square rounded-md flex flex-col items-center justify-center text-[9px] font-black cursor-pointer transition-all duration-300 ${
                    statusStyles[log.status] || "bg-zinc-200"
                  }`}
                  title={`${formatDate(log.date)}: ${log.status} (In: ${log.checkIn}, Out: ${log.checkOut})`}
                >
                  <span>{idx + 1}</span>
                  {log.overtimeHours > 0 && <span className="text-[6px] text-zinc-100 font-extrabold leading-none mt-0.2">+OT</span>}
                </div>
              ))}
            </div>

            {/* Heatmap Key */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-[9px] font-bold text-zinc-500 pt-1">
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

          {/* Table representing Shift Checkins */}
          <div className="space-y-1.5">
            <span className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Recent Punch Logs</span>
            <div className="border border-zinc-150 dark:border-zinc-850 rounded-xl overflow-hidden text-[10px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-950/50 border-b border-zinc-100 dark:border-zinc-850 font-bold text-zinc-450 uppercase tracking-wider">
                    <th className="px-3 py-1.5">Date</th>
                    <th className="px-3 py-1.5">Status</th>
                    <th className="px-3 py-1.5">Punch-In</th>
                    <th className="px-3 py-1.5">Punch-Out</th>
                    <th className="px-3 py-1.5 text-right">Overtime</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 text-zinc-700 dark:text-zinc-350">
                  {data.calendarLogs.slice(-5).reverse().map((log, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-950/20">
                      <td className="px-3 py-1.5 font-bold">{formatDate(log.date)}</td>
                      <td className="px-3 py-1.5">
                        <span className={`px-1.5 py-0.2 rounded-full text-[8px] font-black uppercase tracking-wider ${
                          log.status === "Present"
                            ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-650"
                            : log.status === "Late"
                              ? "bg-amber-50 dark:bg-amber-950/20 text-amber-650"
                              : "bg-red-50 dark:bg-red-950/20 text-red-650"
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-3 py-1.5 font-semibold">{log.checkIn}</td>
                      <td className="px-3 py-1.5 font-semibold">{log.checkOut}</td>
                      <td className="px-3 py-1.5 text-right font-black text-purple-650">{log.overtimeHours > 0 ? `+${log.overtimeHours} hrs` : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer close */}
          <div className="flex justify-end border-t border-zinc-100 dark:border-zinc-800 pt-4">
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
