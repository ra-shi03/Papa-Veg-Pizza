import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function AttendanceTable({
  logs = [],
  currentPage = 1,
  totalPages = 1,
  onPageChange = () => {},
}) {
  const getStatusBadge = (status) => {
    switch (status) {
      case "Present":
        return "bg-emerald-50 text-emerald-700 border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-900/30";
      case "Absent":
        return "bg-red-50 text-red-700 border-red-250 dark:bg-red-950/20 dark:text-red-450 dark:border-red-900/30";
      case "Late":
        return "bg-amber-50 text-amber-600 border-amber-250 dark:bg-amber-950/20 dark:text-amber-450 dark:border-amber-900/30";
      default:
        return "bg-zinc-50 text-slate-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-450 dark:border-zinc-700/60";
    }
  };

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[500px]">
          <thead>
            <tr className="border-b border-zinc-150 dark:border-zinc-800 text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider text-left bg-zinc-50/40 dark:bg-zinc-950/10">
              <th className="py-2.5 px-3">Date</th>
              <th className="py-2.5 px-3">Shift</th>
              <th className="py-2.5 px-3">Check In</th>
              <th className="py-2.5 px-3">Check Out</th>
              <th className="py-2.5 px-3">Hours</th>
              <th className="py-2.5 px-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {logs.length > 0 ? (
              logs.map((log) => (
                <tr
                  key={log.id}
                  className="border-b border-zinc-100 dark:border-zinc-800/60 hover:bg-zinc-50/40 dark:hover:bg-zinc-950/10 text-xs text-left transition-colors"
                >
                  <td className="py-2.5 px-3 font-semibold text-slate-750 dark:text-zinc-300">
                    {log.date}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 dark:text-zinc-400 font-medium">
                    {log.shift}
                  </td>
                  <td className="py-2.5 px-3 text-slate-750 dark:text-zinc-350 font-mono font-bold">
                    {log.checkIn}
                  </td>
                  <td className="py-2.5 px-3 text-slate-750 dark:text-zinc-350 font-mono font-bold">
                    {log.checkOut}
                  </td>
                  <td className="py-2.5 px-3 text-slate-750 dark:text-zinc-350 font-semibold">
                    {log.hours}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(log.status)}`}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-8 text-center text-xs font-semibold text-slate-450 dark:text-zinc-500">
                  No attendance logs found matching filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION PANEL */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-3 border-t border-zinc-50 dark:border-zinc-800/60">
          <span className="text-[10px] font-bold text-slate-450 dark:text-zinc-500">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-1 rounded-lg border border-zinc-250 dark:border-zinc-700 text-slate-600 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-1 rounded-lg border border-zinc-250 dark:border-zinc-700 text-slate-600 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
