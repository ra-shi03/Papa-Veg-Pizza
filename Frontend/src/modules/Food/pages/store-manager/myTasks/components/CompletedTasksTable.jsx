import React, { useState, useEffect } from "react";
import { Search, ShieldCheck, ChevronLeft, ChevronRight, MessageSquare, Clock, Paperclip } from "lucide-react";

export default function CompletedTasksTable({ tasks = [], role = "kitchen_staff", onQualityCheck = () => {} }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Search debouncing (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const filteredTasks = tasks.filter((task) => {
    const term = debouncedSearch.toLowerCase();
    return (
      (task.title || "").toLowerCase().includes(term) ||
      (task.orderId || "").toLowerCase().includes(term) ||
      (task._id || "").toLowerCase().includes(term) ||
      (task.notes || "").toLowerCase().includes(term)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / itemsPerPage));
  const paginatedTasks = filteredTasks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getPerformanceBadge = (actual, est) => {
    if (actual <= est) return "bg-emerald-50 text-emerald-700 border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-900/30";
    if (actual <= est + 2) return "bg-amber-50 text-amber-700 border-amber-250 dark:bg-amber-950/20 dark:text-amber-450 dark:border-amber-900/30";
    return "bg-rose-50 text-rose-700 border-rose-250 dark:bg-rose-950/20 dark:text-rose-450 dark:border-rose-900/30";
  };

  const getPerformanceLabel = (actual, est) => {
    if (actual <= est) return "Excellent (On-Time)";
    if (actual <= est + 2) return "Satisfactory";
    return "Delayed Prep";
  };

  const formatDateTime = (timeStr) => {
    if (!timeStr) return "N/A";
    const date = new Date(timeStr);
    return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" }) + " " + date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
  };

  const isSupervisor = role === "kitchen_supervisor" || role === "store_manager";

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
      
      {/* SEARCH AND CAPTIONS HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="text-xs font-black text-slate-805 dark:text-zinc-200 uppercase tracking-tight flex items-center gap-1.5">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span>Fulfillment Logs</span>
        </h3>
        
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 text-slate-400 dark:text-zinc-555" size={13} />
          <input
            type="text"
            placeholder="Search task title, order..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs font-semibold pl-8 pr-3 py-2 border border-zinc-250 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-[var(--primary)] transition-all"
          />
          {searchQuery !== debouncedSearch && (
            <span className="absolute right-2.5 top-2 text-[8px] font-bold text-slate-400 dark:text-zinc-555 bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">
              Typing...
            </span>
          )}
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b border-zinc-150 dark:border-zinc-800 text-[10px] font-black text-slate-450 dark:text-zinc-555 uppercase tracking-wider text-left bg-zinc-50/40 dark:bg-zinc-950/10">
              <th className="py-2.5 px-3">Completed Task</th>
              <th className="py-2.5 px-3">Order</th>
              <th className="py-2.5 px-3">Completion Time</th>
              <th className="py-2.5 px-3">Target vs Actual</th>
              <th className="py-2.5 px-3">Performance Status</th>
              <th className="py-2.5 px-3">Notes & Photo</th>
              {isSupervisor && <th className="py-2.5 px-3 text-right">QC Check</th>}
            </tr>
          </thead>
          <tbody>
            {paginatedTasks.length > 0 ? (
              paginatedTasks.map((task) => (
                <tr
                  key={task._id}
                  className="border-b border-zinc-100 dark:border-zinc-800/60 hover:bg-zinc-50/40 dark:hover:bg-zinc-950/10 text-xs text-left transition-colors"
                >
                  <td className="py-2.5 px-3 max-w-[200px]">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-850 dark:text-zinc-200">{task.title}</span>
                      <span className="text-[9px] font-semibold text-slate-450 dark:text-zinc-500 line-clamp-1 mt-0.5">{task.description}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 font-extrabold text-[var(--primary)]">
                    {task.orderId}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 dark:text-zinc-450 font-mono font-semibold">
                    {formatDateTime(task.completedAt)}
                  </td>
                  <td className="py-2.5 px-3 text-slate-700 dark:text-zinc-350">
                    <div className="flex items-center gap-1 font-semibold">
                      <Clock size={11} className="text-slate-400" />
                      <span>{task.estimatedMinutes}m / <strong className="text-[var(--primary)]">{task.actualMinutes || "N/A"}m</strong></span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full border ${getPerformanceBadge(task.actualMinutes, task.estimatedMinutes)}`}>
                      {getPerformanceLabel(task.actualMinutes, task.estimatedMinutes)}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 dark:text-zinc-400">
                    <div className="flex flex-col gap-0.5">
                      {task.notes ? (
                        <span className="flex items-center gap-1 text-[10px] font-semibold italic text-slate-600 dark:text-zinc-350">
                          <MessageSquare size={9} className="shrink-0" />
                          <span className="line-clamp-1">{task.notes}</span>
                        </span>
                      ) : (
                        <span className="text-[9px] font-semibold text-slate-400">No notes</span>
                      )}
                      
                      {task.attachments && task.attachments.length > 0 && (
                        <a
                          href={task.attachments[0]}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-[9px] font-bold text-[var(--primary)] hover:underline mt-0.5"
                        >
                          <Paperclip size={9} />
                          <span>View Photo Attachment</span>
                        </a>
                      )}
                    </div>
                  </td>
                  {isSupervisor && (
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => onQualityCheck(task)}
                        className="text-[9px] font-bold py-1 px-2.5 rounded-md bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm active:scale-[0.98] transition-all cursor-pointer inline-flex items-center gap-1"
                      >
                        <span>Run QC</span>
                      </button>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={isSupervisor ? 7 : 6} className="py-8 text-center text-xs font-semibold text-slate-455 dark:text-zinc-550">
                  No completed tasks found matching searches.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION PANEL */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-3 border-t border-zinc-55 dark:border-zinc-800/60">
          <span className="text-[10px] font-bold text-slate-450 dark:text-zinc-500">
            Page {currentPage} of {totalPages} &bull; {filteredTasks.length} logs found
          </span>
          
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-1 rounded-lg border border-zinc-250 dark:border-zinc-700 text-slate-600 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
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
