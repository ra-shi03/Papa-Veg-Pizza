import React, { useState, useEffect } from "react";
import { Search, ChevronLeft, ChevronRight, Eye, ArrowUpDown, PieChart, TrendingDown } from "lucide-react";

const formatINR = (num) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
};

export default function StorePerformanceTable({
  data = [],
  isLoading,
  onViewDetails,
  onViewRevenueBreakdown,
  onViewExpenseBreakdown,
}) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Sorting
  const [sortField, setSortField] = useState("month");
  const [sortDirection, setSortDirection] = useState("desc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Debouncing (400ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  const handleSort = (field) => {
    const isAsc = sortField === field && sortDirection === "asc";
    setSortDirection(isAsc ? "desc" : "asc");
    setSortField(field);
    setCurrentPage(1);
  };

  const filteredData = data.filter((item) => {
    const query = debouncedSearch.toLowerCase();
    return (
      item.month.toLowerCase().includes(query) ||
      item.revenue.toString().includes(query) ||
      item.expenses.toString().includes(query) ||
      item.profit.toString().includes(query) ||
      item.orders.toString().includes(query)
    );
  });

  const sortedData = [...filteredData].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (sortField === "month") {
      // Custom month-year parsing "Jun 2026", "May 2026"
      const parseMonth = (str) => {
        const parts = str.split(" ");
        const monthNames = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun"];
        return new Date(parts[1], monthNames.indexOf(parts[0]), 1).getTime();
      };
      valA = parseMonth(a.month);
      valB = parseMonth(b.month);
    }

    if (typeof valA === "string") {
      return sortDirection === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }

    return sortDirection === "asc" ? (valA || 0) - (valB || 0) : (valB || 0) - (valA || 0);
  });

  const totalPages = Math.ceil(sortedData.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);

  const SortHeader = ({ field, label }) => (
    <th
      onClick={() => handleSort(field)}
      className="px-4 py-3.5 text-left text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 cursor-pointer hover:text-[var(--primary)] transition-colors select-none"
    >
      <div className="flex items-center gap-1">
        <span>{label}</span>
        <ArrowUpDown size={10} className="opacity-70 shrink-0" />
      </div>
    </th>
  );

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl p-5 shadow-sm space-y-4 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-extrabold text-sm text-zinc-800 dark:text-zinc-100 uppercase tracking-wider">
            Store Performance Ledger
          </h3>
          <p className="text-[10px] text-zinc-450 dark:text-zinc-500 font-medium">Monthly store audits and margins</p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search month or metrics..."
            className="w-full text-xs font-bold pl-8.5 pr-3.5 py-2 bg-neutral-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-800 dark:text-white placeholder-zinc-400 outline-none focus:border-[var(--primary)] transition-all shadow-inner"
          />
          <Search className="absolute left-3 top-2.5 text-zinc-400" size={12} />
        </div>
      </div>

      {/* Table Canvas */}
      <div className="overflow-x-auto border border-zinc-100 dark:border-zinc-850 rounded-2xl scrollbar-thin">
        <table className="min-w-full divide-y divide-zinc-100 dark:divide-zinc-850 border-collapse table-auto">
          <thead className="bg-zinc-50/70 dark:bg-zinc-950/30 sticky top-0">
            <tr>
              <SortHeader field="month" label="Month" />
              <SortHeader field="revenue" label="Revenue" />
              <SortHeader field="expenses" label="Expenses" />
              <SortHeader field="profit" label="Profit" />
              <SortHeader field="orders" label="Orders" />
              <SortHeader field="rating" label="Ratings" />
              <SortHeader field="deliveryRate" label="Delivery Success" />
              <SortHeader field="wastePercentage" label="Food Waste" />
              <SortHeader field="growth" label="Growth MoM" />
              <th className="px-4 py-3.5 text-right text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 text-xs font-bold text-zinc-800 dark:text-zinc-200">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  {Array.from({ length: 10 }).map((_, cIdx) => (
                    <td key={cIdx} className="px-4 py-4">
                      <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded w-full" />
                    </td>
                  ))}
                </tr>
              ))
            ) : paginatedData.length > 0 ? (
              paginatedData.map((row) => (
                <tr key={row.month} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-950/20 transition-colors">
                  <td className="px-4 py-4 whitespace-nowrap text-zinc-900 dark:text-white">
                    {row.month}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-emerald-600 dark:text-emerald-400">
                    {formatINR(row.revenue)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-rose-500">
                    {formatINR(row.expenses)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-zinc-900 dark:text-white">
                    {formatINR(row.profit)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-zinc-550 dark:text-zinc-400">
                    {row.orders}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-amber-500">
                    ⭐ {row.rating}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-zinc-500">
                    {row.deliveryRate}%
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-zinc-500">
                    {row.wastePercentage}%
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span
                      className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                        row.growth >= 0
                          ? "text-emerald-605 bg-emerald-50 dark:bg-emerald-950/20"
                          : "text-rose-600 bg-rose-50 dark:bg-rose-950/20"
                      }`}
                    >
                      {row.growth >= 0 ? `+${row.growth}%` : `${row.growth}%`}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right">
                    <div className="inline-flex gap-1.5 justify-end">
                      {/* View details */}
                      <button
                        onClick={() => onViewDetails(row.month)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-neutral-50 hover:bg-neutral-100 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 rounded-xl transition-all cursor-pointer shadow-sm text-[10px]"
                        title="View Monthly Details"
                      >
                        <Eye size={11} className="text-[var(--primary)]" />
                        <span>Details</span>
                      </button>

                      {/* Revenue breakdown */}
                      <button
                        onClick={() => onViewRevenueBreakdown(row.month)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-neutral-50 hover:bg-neutral-100 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 rounded-xl transition-all cursor-pointer shadow-sm text-[10px]"
                        title="Revenue Breakdown"
                      >
                        <PieChart size={11} className="text-[var(--primary)]" />
                        <span>Revenue</span>
                      </button>

                      {/* Expense breakdown */}
                      <button
                        onClick={() => onViewExpenseBreakdown(row.month)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-neutral-50 hover:bg-neutral-100 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 rounded-xl transition-all cursor-pointer shadow-sm text-[10px]"
                        title="Expense Breakdown"
                      >
                        <TrendingDown size={11} className="text-rose-500" />
                        <span>Expenses</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-zinc-400 dark:text-zinc-500 font-bold">
                  No monthly store records matching search criteria
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!isLoading && sortedData.length > 0 && (
        <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-850">
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold">
            Showing {startIndex + 1} - {Math.min(startIndex + itemsPerPage, sortedData.length)} of {sortedData.length} entries
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 bg-neutral-50 hover:bg-neutral-100 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-zinc-650 dark:text-zinc-300 rounded-xl border border-zinc-200 dark:border-zinc-800 disabled:opacity-40 transition-all cursor-pointer shadow-sm"
            >
              <ChevronLeft size={13} />
            </button>
            <span className="text-[11px] font-black text-zinc-800 dark:text-white px-1">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 bg-neutral-50 hover:bg-neutral-100 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-zinc-650 dark:text-zinc-300 rounded-xl border border-zinc-200 dark:border-zinc-800 disabled:opacity-40 transition-all cursor-pointer shadow-sm"
            >
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
