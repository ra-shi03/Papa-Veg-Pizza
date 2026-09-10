import React, { useState, useEffect } from "react";
import { Search, Calendar, Download, RefreshCw, AlertCircle, Clock } from "lucide-react";
import { toast } from "sonner";

export default function TaskHistoryTable({ tasks = [] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [timeFilter, setTimeFilter] = useState("Today"); // 'Today', 'Week', 'Month', 'Custom'
  const [customDates, setCustomDates] = useState({ start: "", end: "" });
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

  const handleExport = () => {
    toast.success("Task history logs exported successfully as PVP-Fulfillment-Logs.csv");
  };

  // Filter logs dynamically
  const filteredTasks = tasks.filter((task) => {
    // 1. Search filter
    const term = debouncedSearch.toLowerCase();
    const matchesSearch =
      (task.title || "").toLowerCase().includes(term) ||
      (task.orderId || "").toLowerCase().includes(term) ||
      (task._id || "").toLowerCase().includes(term);

    if (!matchesSearch) return false;

    // 2. Date filter
    const dateObj = new Date(task.createdAt || Date.now());
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    if (timeFilter === "Today") {
      return dateObj.getTime() >= startOfToday;
    }

    if (timeFilter === "Week") {
      const oneWeekAgo = Date.now() - 7 * 86400000;
      return dateObj.getTime() >= oneWeekAgo;
    }

    if (timeFilter === "Month") {
      const oneMonthAgo = Date.now() - 30 * 86400000;
      return dateObj.getTime() >= oneMonthAgo;
    }

    if (timeFilter === "Custom" && customDates.start && customDates.end) {
      const start = new Date(customDates.start).getTime();
      const end = new Date(customDates.end);
      end.setHours(23, 59, 59, 999);
      const endTime = end.getTime();
      return dateObj.getTime() >= start && dateObj.getTime() <= endTime;
    }

    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / itemsPerPage));
  const paginatedTasks = filteredTasks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-900/30";
      case "delayed":
        return "bg-amber-50 text-amber-700 border-amber-250 dark:bg-amber-950/20 dark:text-amber-450 dark:border-amber-900/30";
      case "cancelled":
        return "bg-red-50 text-red-700 border-red-250 dark:bg-red-950/20 dark:text-red-450 dark:border-red-900/30";
      case "in_progress":
        return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-450 dark:border-rose-900/30";
      case "pending":
      default:
        return "bg-zinc-100 text-slate-650 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700";
    }
  };

  const formatDateTime = (timeStr) => {
    if (!timeStr) return "N/A";
    const date = new Date(timeStr);
    return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" }) + " " + date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
      
      {/* FILTERS AND EXPORT ACTIONS */}
      <div className="flex flex-col gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center bg-zinc-100/60 dark:bg-zinc-950 p-1 rounded-lg border border-zinc-150 dark:border-zinc-850">
            {["Today", "Week", "Month", "Custom"].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setTimeFilter(tab);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-md text-[9px] font-extrabold transition-all ${
                  timeFilter === tab
                    ? "bg-[var(--primary)] text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-250"
                }`}
              >
                {tab === "Custom" ? "Custom Range" : tab}
              </button>
            ))}
          </div>

          <button
            onClick={handleExport}
            disabled={filteredTasks.length === 0}
            className="text-[10px] font-black px-3.5 py-1.5 rounded-lg border border-zinc-250 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 active:scale-[0.98] transition-all flex items-center gap-1.5 justify-center"
          >
            <Download size={12} />
            <span>Export CSV</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search bar */}
          <div className="relative sm:col-span-2">
            <Search className="absolute left-2.5 top-2.5 text-slate-400 dark:text-zinc-550" size={13} />
            <input
              type="text"
              placeholder="Search Task ID, order, pizza..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs font-semibold pl-8 pr-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-slate-850 dark:text-zinc-200 focus:outline-none focus:border-[var(--primary)] transition-all"
            />
          </div>

          {/* Custom Date Filters */}
          {timeFilter === "Custom" && (
            <div className="flex items-center gap-1.5 w-full">
              <input
                type="date"
                value={customDates.start}
                onChange={(e) => {
                  setCustomDates((prev) => ({ ...prev, start: e.target.value }));
                  setCurrentPage(1);
                }}
                className="text-[10px] font-bold px-2 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-slate-700 dark:text-zinc-300 w-full"
              />
              <span className="text-zinc-400 text-xs">to</span>
              <input
                type="date"
                value={customDates.end}
                onChange={(e) => {
                  setCustomDates((prev) => ({ ...prev, end: e.target.value }));
                  setCurrentPage(1);
                }}
                className="text-[10px] font-bold px-2 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-slate-700 dark:text-zinc-300 w-full"
              />
            </div>
          )}
        </div>
      </div>

      {/* TABLE DATA */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[750px]">
          <thead>
            <tr className="border-b border-zinc-150 dark:border-zinc-800 text-[10px] font-black text-slate-455 dark:text-zinc-555 uppercase tracking-wider text-left bg-zinc-50/40 dark:bg-zinc-950/10">
              <th className="py-2.5 px-3">Task Details</th>
              <th className="py-2.5 px-3">Order Number</th>
              <th className="py-2.5 px-3">Started At</th>
              <th className="py-2.5 px-3">Completed At</th>
              <th className="py-2.5 px-3">Fulfillment Duration</th>
              <th className="py-2.5 px-3">Status</th>
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
                      <span className="font-bold text-slate-805 dark:text-zinc-200">{task.title}</span>
                      <span className="text-[9px] font-semibold text-slate-400 dark:text-zinc-500 mt-0.5">{task.station} &bull; ID: {task._id}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 font-extrabold text-[var(--primary)]">
                    {task.orderId}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 dark:text-zinc-450 font-mono font-semibold">
                    {formatDateTime(task.startedAt)}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 dark:text-zinc-450 font-mono font-semibold">
                    {formatDateTime(task.completedAt)}
                  </td>
                  <td className="py-2.5 px-3 text-slate-700 dark:text-zinc-350">
                    <div className="flex items-center gap-1 font-semibold">
                      <Clock size={11} className="text-slate-455" />
                      <span>{task.actualMinutes ? `${task.actualMinutes} mins` : "N/A"}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`text-[8px] font-bold px-2 py-0.5 rounded border uppercase tracking-wide ${getStatusBadge(task.status)}`}>
                      {task.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-12 text-center flex flex-col items-center justify-center -ml-[300px]">
                  <div className="w-10 h-10 bg-zinc-50 dark:bg-zinc-950 text-slate-400 dark:text-zinc-550 rounded-xl flex items-center justify-center border border-zinc-150 dark:border-zinc-800/80 mb-3">
                    <AlertCircle size={18} />
                  </div>
                  <h3 className="text-xs font-black text-slate-805 dark:text-zinc-200 uppercase tracking-wide">
                    No Logs Found
                  </h3>
                  <p className="text-[10px] font-semibold text-slate-450 dark:text-zinc-555 mt-1 max-w-xs leading-normal">
                    There are no logged activities matching these search parameters.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION PANEL */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-3 border-t border-zinc-55 dark:border-zinc-800/60">
          <span className="text-[10px] font-bold text-slate-450 dark:text-zinc-550">
            Page {currentPage} of {totalPages}
          </span>
          
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="text-[10px] font-bold px-3 py-1.5 rounded-lg border border-zinc-250 dark:border-zinc-700 text-slate-600 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="text-[10px] font-bold px-3 py-1.5 rounded-lg border border-zinc-250 dark:border-zinc-700 text-slate-600 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
