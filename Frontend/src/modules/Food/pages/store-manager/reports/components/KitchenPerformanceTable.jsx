import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, ChevronLeft, ChevronRight, Eye, AlertTriangle, Trash2, ArrowUpDown } from "lucide-react";

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default function KitchenPerformanceTable({
  data = [],
  pagination = {},
  isLoading,
  onViewDayDetails,
  onViewDelayAnalysis,
  onViewWasteAnalysis
}) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Local Search Input State
  const [localSearch, setLocalSearch] = useState(searchParams.get("search") || "");

  // URL state variables
  const page = Number(searchParams.get("page")) || 1;
  const sortBy = searchParams.get("sortBy") || "date";
  const sortOrder = searchParams.get("sortOrder") || "desc";

  // Debouncing search value (400ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (localSearch) {
        params.set("search", localSearch);
      } else {
        params.delete("search");
      }
      params.set("page", "1"); // Reset pagination on search
      setSearchParams(params);
    }, 400);

    return () => clearTimeout(handler);
  }, [localSearch]);

  const handleSort = (field) => {
    const params = new URLSearchParams(searchParams);
    const isAsc = sortBy === field && sortOrder === "asc";
    params.set("sortBy", field);
    params.set("sortOrder", isAsc ? "desc" : "asc");
    params.set("page", "1");
    setSearchParams(params);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= (pagination.pages || 1)) {
      const params = new URLSearchParams(searchParams);
      params.set("page", String(newPage));
      setSearchParams(params);
    }
  };

  const SortHeader = ({ field, label }) => (
    <th
      onClick={() => handleSort(field)}
      className="px-4 py-3.5 text-left text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 cursor-pointer hover:text-[var(--primary)] transition-colors select-none"
    >
      <div className="flex items-center gap-1.5">
        <span>{label}</span>
        <ArrowUpDown size={11} className="opacity-70" />
      </div>
    </th>
  );

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl p-5 shadow-sm space-y-4 transition-all duration-300">
      {/* Search and Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-extrabold text-sm text-zinc-800 dark:text-zinc-100 uppercase tracking-wider">
            Kitchen Performance Ledger
          </h3>
          <p className="text-[10px] text-zinc-450 dark:text-zinc-500 font-medium">Daily cooking efficiency and delay logs</p>
        </div>

        {/* Debounced Search */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search dates or metrics..."
            className="w-full text-xs font-bold pl-8.5 pr-3.5 py-2 bg-neutral-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-800 dark:text-white placeholder-zinc-400 outline-none focus:border-[var(--primary)] transition-all shadow-inner"
          />
          <Search className="absolute left-3 top-2.5 text-zinc-400" size={13} />
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto border border-zinc-100 dark:border-zinc-850 rounded-2xl scrollbar-thin">
        <table className="min-w-full divide-y divide-zinc-100 dark:divide-zinc-850 border-collapse table-auto">
          <thead className="bg-zinc-50/70 dark:bg-zinc-950/30 sticky top-0">
            <tr>
              <SortHeader field="date" label="Date" />
              <SortHeader field="orders" label="Orders" />
              <SortHeader field="avgPrepTime" label="Avg Prep Time" />
              <SortHeader field="delayedOrders" label="Delayed Orders" />
              <SortHeader field="wastePercentage" label="Waste %" />
              <SortHeader field="efficiency" label="Efficiency" />
              <SortHeader field="shortages" label="Shortages" />
              <th className="px-4 py-3.5 text-right text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 text-xs font-bold text-zinc-800 dark:text-zinc-200">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  {Array.from({ length: 8 }).map((_, cIdx) => (
                    <td key={cIdx} className="px-4 py-4.5">
                      <div className="h-3.5 bg-zinc-100 dark:bg-zinc-800 rounded-full w-full" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-10 text-zinc-400 dark:text-zinc-500">
                  No kitchen performance logs match the filter criteria.
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={row.date}
                  className="hover:bg-neutral-55/30 dark:hover:bg-zinc-950/20 transition-all group"
                >
                  <td className="px-4 py-3.5 font-bold text-zinc-900 dark:text-white">
                    {formatDate(row.date)}
                  </td>
                  <td className="px-4 py-3.5">{row.orders}</td>
                  <td className="px-4 py-3.5">{row.avgPrepTime} mins</td>
                  <td className="px-4 py-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                      row.delayedOrders > 8
                        ? "text-rose-600 bg-rose-50 dark:bg-rose-950/20"
                        : "text-amber-600 bg-amber-50 dark:bg-amber-950/20"
                    }`}>
                      {row.delayedOrders} delayed
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-rose-500">{row.wastePercentage}%</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-12 bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden shrink-0">
                        <div
                          className="bg-emerald-500 h-full"
                          style={{ width: `${row.efficiency}%` }}
                        />
                      </div>
                      <span>{row.efficiency}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    {row.shortages > 0 ? (
                      <span className="text-red-500 font-extrabold">{row.shortages} shortages</span>
                    ) : (
                      <span className="text-emerald-500">0 active</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* View Day Details - Secondary style (Sunset Orange borders) */}
                      <button
                        onClick={() => onViewDayDetails(row.date)}
                        title="View Day Details"
                        className="p-1.5 border border-zinc-200 dark:border-zinc-800 hover:border-[var(--primary)] text-zinc-650 dark:text-zinc-400 hover:text-[var(--primary)] bg-white dark:bg-zinc-900 hover:bg-red-50/20 dark:hover:bg-red-950/10 rounded-lg cursor-pointer active:scale-95 transition-all shadow-sm"
                      >
                        <Eye size={12} />
                      </button>

                      {/* View Delay Details */}
                      <button
                        onClick={() => onViewDelayAnalysis(row.sampleOrderId)}
                        title="Delay Analysis"
                        className="p-1.5 border border-zinc-200 dark:border-zinc-800 hover:border-amber-500 text-zinc-650 dark:text-zinc-400 hover:text-amber-500 bg-white dark:bg-zinc-900 hover:bg-amber-50/20 dark:hover:bg-amber-950/10 rounded-lg cursor-pointer active:scale-95 transition-all shadow-sm"
                      >
                        <AlertTriangle size={12} />
                      </button>

                      {/* View Waste Details */}
                      <button
                        onClick={() => onViewWasteAnalysis(row.sampleWasteId)}
                        title="Waste Analysis"
                        className="p-1.5 border border-zinc-200 dark:border-zinc-800 hover:border-rose-500 text-zinc-650 dark:text-zinc-400 hover:text-rose-500 bg-white dark:bg-zinc-900 hover:bg-rose-50/20 dark:hover:bg-rose-950/10 rounded-lg cursor-pointer active:scale-95 transition-all shadow-sm"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {!isLoading && data.length > 0 && (
        <div className="flex justify-between items-center shrink-0 pt-2">
          <span className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500">
            Page {page} of {pagination.pages || 1} ({pagination.total || 0} total logs)
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              className="p-2 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-neutral-50 dark:hover:bg-zinc-850 rounded-xl cursor-pointer disabled:opacity-45 disabled:pointer-events-none transition-all active:scale-90"
            >
              <ChevronLeft size={13} />
            </button>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= (pagination.pages || 1)}
              className="p-2 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-neutral-50 dark:hover:bg-zinc-850 rounded-xl cursor-pointer disabled:opacity-45 disabled:pointer-events-none transition-all active:scale-90"
            >
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
