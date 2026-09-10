import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, ChevronLeft, ChevronRight, Eye, RefreshCw, ArrowUpDown, Star, Users } from "lucide-react";

export default function StaffPerformanceTable({
  data = [],
  pagination = {},
  isLoading,
  onViewDetails,
  onCompare
}) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Search input state
  const [localSearch, setLocalSearch] = useState(searchParams.get("search") || "");

  const page = Number(searchParams.get("page")) || 1;
  const sortBy = searchParams.get("sortBy") || "efficiency";
  const sortOrder = searchParams.get("sortOrder") || "desc";

  // Debouncing search by 400ms
  useEffect(() => {
    const handler = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (localSearch) {
        params.set("search", localSearch);
      } else {
        params.delete("search");
      }
      params.set("page", "1"); // Reset pagination
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
      {/* Header with search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-extrabold text-sm text-zinc-800 dark:text-zinc-100 uppercase tracking-wider">
            Staff Efficiency Ledger
          </h3>
          <p className="text-[10px] text-zinc-450 dark:text-zinc-500 font-medium">Audited metrics of active operational staff</p>
        </div>

        {/* Debounced Search Bar */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search employee or role..."
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
              <th className="px-4 py-3.5 text-left text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Staff Member</th>
              <SortHeader field="role" label="Role" />
              <SortHeader field="attendance" label="Attendance" />
              <SortHeader field="orders" label="Orders Handled" />
              <SortHeader field="avgPrepTime" label="Avg Prep Time" />
              <SortHeader field="complaints" label="Complaints" />
              <SortHeader field="efficiency" label="Efficiency" />
              <SortHeader field="rating" label="Rating" />
              <th className="px-4 py-3.5 text-right text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 text-xs font-bold text-zinc-800 dark:text-zinc-200">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  {Array.from({ length: 9 }).map((_, cIdx) => (
                    <td key={cIdx} className="px-4 py-4">
                      <div className="h-3.5 bg-zinc-100 dark:bg-zinc-800 rounded-full w-full" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-10 text-zinc-400 dark:text-zinc-500">
                  No staff members match the selected filters.
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={row._id}
                  className="hover:bg-neutral-55/30 dark:hover:bg-zinc-950/20 transition-all"
                >
                  <td className="px-4 py-3 text-zinc-900 dark:text-white">
                    <div className="flex items-center gap-2.5">
                      <img 
                        src={row.profileImage} 
                        alt={row.name} 
                        className="w-8 h-8 rounded-full object-cover border border-zinc-100 dark:border-zinc-850"
                        onError={(e) => {
                          e.target.src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80&q=80";
                        }}
                      />
                      <div className="truncate max-w-[130px] font-extrabold">
                        {row.name}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-455 font-bold">{row.role}</td>
                  <td className="px-4 py-3">{row.attendance}%</td>
                  <td className="px-4 py-3 text-center">{row.orders} jobs</td>
                  <td className="px-4 py-3 text-emerald-500">{row.avgPrepTime} mins</td>
                  <td className="px-4 py-3">
                    {row.complaints > 0 ? (
                      <span className="text-rose-500 font-extrabold">{row.complaints} complaints</span>
                    ) : (
                      <span className="text-emerald-500 font-bold">0 issues</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-12 bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden shrink-0">
                        <div
                          className="bg-[var(--primary)] h-full"
                          style={{ width: `${row.efficiency}%` }}
                        />
                      </div>
                      <span>{row.efficiency}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-0.5 text-amber-500">
                      <Star size={11} className="fill-amber-500" />
                      <span>{row.rating}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* View details - Secondary style */}
                      <button
                        onClick={() => onViewDetails(row._id)}
                        title="View Performance Profile"
                        className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-zinc-700 hover:text-[var(--primary)] bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-350 dark:hover:text-[var(--primary)] rounded-full transition-all active:scale-95 cursor-pointer shadow-sm"
                      >
                        Details
                      </button>

                      {/* Compare - Primary Style (Sunset Flame) */}
                      <button
                        onClick={() => onCompare(row._id)}
                        title="Compare with another employee"
                        className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-full transition-all active:scale-95 cursor-pointer shadow-md shadow-[var(--primary)]/10"
                      >
                        Compare
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      {!isLoading && data.length > 0 && (
        <div className="flex justify-between items-center shrink-0 pt-2">
          <span className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500">
            Page {page} of {pagination.pages || 1} ({pagination.total || 0} total employees)
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              className="p-2 border border-zinc-200 dark:border-zinc-800 text-zinc-650 dark:text-zinc-400 hover:bg-neutral-50 dark:hover:bg-zinc-850 rounded-xl cursor-pointer disabled:opacity-45 disabled:pointer-events-none transition-all active:scale-90"
            >
              <ChevronLeft size={13} />
            </button>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= (pagination.pages || 1)}
              className="p-2 border border-zinc-200 dark:border-zinc-800 text-zinc-650 dark:text-zinc-400 hover:bg-neutral-50 dark:hover:bg-zinc-850 rounded-xl cursor-pointer disabled:opacity-45 disabled:pointer-events-none transition-all active:scale-90"
            >
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
