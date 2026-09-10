import React, { useState, useEffect } from "react";
import { Activity, Search, Calendar, RefreshCw, LayoutGrid, List } from "lucide-react";
import { profileApi } from "@food/api";

export default function ActivityLogsTab() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("All");
  const [viewMode, setViewMode] = useState("timeline"); // 'timeline' or 'table'
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 4;

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const res = await profileApi.getActivityLogs();
        let logsArray = [];
        if (res) {
          if (Array.isArray(res)) {
            logsArray = res;
          } else if (Array.isArray(res.data)) {
            logsArray = res.data;
          } else if (res.data && Array.isArray(res.data.data)) {
            logsArray = res.data.data;
          } else if (res.data && Array.isArray(res.data.recentActivities)) {
            logsArray = res.data.recentActivities;
          } else if (Array.isArray(res.recentActivities)) {
            logsArray = res.recentActivities;
          }
        }
        setLogs(logsArray);
      } catch (err) {
        console.error("Failed to load activity logs", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  // Debouncing for search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const getModuleColor = (mod) => {
    switch (mod) {
      case "Orders":
        return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-450 dark:border-rose-900/30";
      case "Inventory":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-450 dark:border-amber-900/30";
      case "Delivery":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-450 dark:border-blue-900/30";
      case "Complaints":
        return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/20 dark:text-purple-450 dark:border-purple-900/30";
      case "Reports":
      default:
        return "bg-zinc-50 text-slate-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700/60";
    }
  };

  // Filter logs dynamically
  const filteredLogs = Array.isArray(logs) ? logs.filter((log) => {
    const matchesSearch =
      (log?.action || "").toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      (log?.description || "").toLowerCase().includes(debouncedSearch.toLowerCase());
    
    const matchesModule = moduleFilter === "All" || log?.module === moduleFilter;

    return matchesSearch && matchesModule;
  }) : [];

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / logsPerPage));
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * logsPerPage, currentPage * logsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl p-5 space-y-4 animate-pulse">
        <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
        <div className="h-10 bg-zinc-100 dark:bg-zinc-850 rounded-lg" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-zinc-50 dark:bg-zinc-950 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const modules = ["All", "Orders", "Inventory", "Delivery", "Complaints", "Reports"];

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
      
      {/* HEADER WITH TOGGLE */}
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-[var(--primary)]" />
          <h2 className="text-sm font-black tracking-tight text-slate-900 dark:text-white uppercase">
            Store Activity Logs
          </h2>
        </div>

        {/* View Toggle */}
        <div className="flex items-center bg-zinc-100/60 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850/80 p-0.5 rounded-lg shrink-0">
          <button
            onClick={() => setViewMode("timeline")}
            className={`p-1.5 rounded-md transition-all ${
              viewMode === "timeline"
                ? "bg-[var(--primary)] text-white shadow-sm"
                : "text-slate-450 dark:text-zinc-500 hover:text-slate-700"
            }`}
            title="Timeline View"
          >
            <List size={13} />
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`p-1.5 rounded-md transition-all ${
              viewMode === "table"
                ? "bg-[var(--primary)] text-white shadow-sm"
                : "text-slate-450 dark:text-zinc-500 hover:text-slate-700"
            }`}
            title="Table View"
          >
            <LayoutGrid size={13} />
          </button>
        </div>
      </div>

      {/* FILTER & SEARCH ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        
        {/* Search */}
        <div className="relative sm:col-span-2">
          <Search className="absolute left-2.5 top-2.5 text-slate-400 dark:text-zinc-500" size={13} />
          <input
            type="text"
            placeholder="Search action or log details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs font-semibold pl-8 pr-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-[var(--primary)] transition-all"
          />
          {searchQuery && (
            <span className="absolute right-2.5 top-2 text-[9px] font-black text-slate-450 dark:text-zinc-550 bg-zinc-100/60 dark:bg-zinc-850/80 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">
              Debouncing...
            </span>
          )}
        </div>

        {/* Module Filter */}
        <select
          value={moduleFilter}
          onChange={(e) => {
            setModuleFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="text-xs font-bold px-3 py-2 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-slate-700 dark:text-zinc-300 rounded-lg focus:outline-none focus:border-[var(--primary)] transition-all cursor-pointer w-full"
        >
          {modules.map((mod) => (
            <option key={mod} value={mod}>
              {mod === "All" ? "Filter: All Modules" : mod}
            </option>
          ))}
        </select>
      </div>

      {/* RENDER LOGS BASED ON VIEW MODE */}
      <div className="min-h-[220px]">
        {viewMode === "timeline" ? (
          /* TIMELINE VIEW */
          <div className="relative border-l border-zinc-200 dark:border-zinc-800 ml-3 pl-6 space-y-5 py-2">
            {paginatedLogs.length > 0 ? (
              paginatedLogs.map((log) => (
                <div key={log.id} className="relative group">
                  {/* Timeline indicator dot */}
                  <span className="absolute -left-[31px] top-1 flex h-2 w-2 rounded-full bg-[var(--primary)] border-4 border-white dark:border-zinc-900 group-hover:scale-125 transition-transform" />
                  
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[9px] font-semibold text-slate-400 dark:text-zinc-500">
                        {log.time}
                      </span>
                      <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded border uppercase tracking-wide ${getModuleColor(log.module)}`}>
                        {log.module}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                      {log.action}
                    </p>
                    <p className="text-[10px] font-medium text-slate-450 dark:text-zinc-500 leading-normal max-w-lg">
                      {log.description}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs font-semibold text-slate-450 dark:text-zinc-500 -ml-6">
                No activities logged matching search queries.
              </div>
            )}
          </div>
        ) : (
          /* TABLE VIEW */
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-zinc-150 dark:border-zinc-800 text-[10px] font-black text-slate-400 dark:text-zinc-550 uppercase tracking-wider text-left bg-zinc-50/40 dark:bg-zinc-950/10">
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">Module</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Description</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLogs.length > 0 ? (
                  paginatedLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-zinc-100 dark:border-zinc-800/60 hover:bg-zinc-50/45 dark:hover:bg-zinc-950/10 text-xs text-left transition-colors"
                    >
                      <td className="py-2.5 px-3 font-semibold text-slate-500 dark:text-zinc-500 whitespace-nowrap">
                        {log.time}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded border uppercase tracking-wide whitespace-nowrap ${getModuleColor(log.module)}`}>
                          {log.module}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-zinc-200">
                        {log.action}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 dark:text-zinc-400 font-medium leading-normal">
                        {log.description}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-xs font-semibold text-slate-450 dark:text-zinc-500">
                      No activities logged matching search queries.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PAGINATION PANEL */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-3 border-t border-zinc-50 dark:border-zinc-800/60">
          <span className="text-[10px] font-bold text-slate-450 dark:text-zinc-550">
            Showing logs { (currentPage - 1) * logsPerPage + 1 } - { Math.min(currentPage * logsPerPage, filteredLogs.length) } of { filteredLogs.length }
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="text-[10px] font-bold px-3 py-1.5 rounded-lg border border-zinc-250 dark:border-zinc-700 text-slate-600 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
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
