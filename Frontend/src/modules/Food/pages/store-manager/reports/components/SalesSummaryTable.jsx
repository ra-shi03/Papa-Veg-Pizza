import React, { useState, useEffect } from "react";
import { Search, ChevronLeft, ChevronRight, Eye, ArrowUpDown } from "lucide-react";

const formatINR = (num) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
};

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default function SalesSummaryTable({ data = [], isLoading, onViewDetails }) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  // Sort State
  const [sortField, setSortField] = useState("date");
  const [sortDirection, setSortDirection] = useState("desc"); // asc or desc
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  // Debouncing Search (400ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1); // Reset to page 1 on search
    }, 400);

    return () => clearTimeout(handler);
  }, [search]);

  // Handle Sort
  const handleSort = (field) => {
    const isAsc = sortField === field && sortDirection === "asc";
    setSortDirection(isAsc ? "desc" : "asc");
    setSortField(field);
    setCurrentPage(1);
  };

  // Filter Data
  const filteredData = data.filter((item) => {
    const dateFormatted = formatDate(item.date).toLowerCase();
    const query = debouncedSearch.toLowerCase();
    return (
      item.date.includes(query) ||
      dateFormatted.includes(query) ||
      item.orders.toString().includes(query) ||
      item.revenue.toString().includes(query)
    );
  });

  // Sort Data
  const sortedData = [...filteredData].sort((a, b) => {
    let valueA = a[sortField];
    let valueB = b[sortField];

    if (sortField === "date") {
      valueA = new Date(a.date).getTime();
      valueB = new Date(b.date).getTime();
    }

    if (typeof valueA === "string") {
      return sortDirection === "asc"
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA);
    }

    return sortDirection === "asc"
      ? (valueA || 0) - (valueB || 0)
      : (valueB || 0) - (valueA || 0);
  });

  // Paginated Data
  const totalPages = Math.ceil(sortedData.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);

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
    <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl p-5 shadow-sm space-y-4 transition-all">
      {/* Table Title and Search bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-extrabold text-sm text-zinc-800 dark:text-zinc-100 uppercase tracking-wider">
            Sales Summary Ledger
          </h3>
          <p className="text-[10px] text-zinc-450 dark:text-zinc-500 font-medium">Daily financial audit indices</p>
        </div>

        {/* Debounced Search Bar */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
              <SortHeader field="revenue" label="Gross Revenue" />
              <SortHeader field="discounts" label="Discounts" />
              <SortHeader field="taxes" label="Taxes" />
              <SortHeader field="refunds" label="Refunds" />
              <SortHeader field="netSales" label="Net Sales" />
              <SortHeader field="growth" label="Growth %" />
              <th className="px-4 py-3.5 text-right text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 text-xs font-bold text-zinc-800 dark:text-zinc-200">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  {Array.from({ length: 9 }).map((_, cIdx) => (
                    <td key={cIdx} className="px-4 py-4.5">
                      <div className="h-3.5 bg-zinc-100 dark:bg-zinc-800 rounded-full w-full" />
                    </td>
                  ))}
                </tr>
              ))
            ) : paginatedData.length > 0 ? (
              paginatedData.map((row) => (
                <tr
                  key={row.date}
                  className="hover:bg-zinc-50/50 dark:hover:bg-zinc-950/20 transition-colors"
                >
                  <td className="px-4 py-4 whitespace-nowrap text-zinc-900 dark:text-white">
                    {formatDate(row.date)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-zinc-505 dark:text-zinc-400">
                    {row.orders}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-emerald-600 dark:text-emerald-400">
                    {formatINR(row.revenue)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-rose-500">
                    {row.discounts > 0 ? `-${formatINR(row.discounts)}` : "₹0"}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-zinc-500">
                    {formatINR(row.taxes)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-amber-600">
                    {row.refunds > 0 ? `-${formatINR(row.refunds)}` : "₹0"}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-zinc-900 dark:text-white">
                    {formatINR(row.netSales)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span
                      className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                        row.growth >= 0
                          ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20"
                          : "text-rose-600 bg-rose-50 dark:bg-rose-950/20"
                      }`}
                    >
                      {row.growth >= 0 ? `+${row.growth}%` : `${row.growth}%`}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => onViewDetails(row.date)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-50 hover:bg-neutral-100 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 rounded-xl transition-all cursor-pointer shadow-sm text-[11px]"
                    >
                      <Eye size={12} className="text-[var(--primary)]" />
                      <span>View Details</span>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-zinc-400 dark:text-zinc-500 font-bold">
                  No sales ledger logs found matching criteria
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
            Showing {startIndex + 1} - {Math.min(startIndex + itemsPerPage, sortedData.length)} of {sortedData.length} records
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 bg-neutral-50 hover:bg-neutral-100 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl border border-zinc-200 dark:border-zinc-800 disabled:opacity-40 transition-all cursor-pointer shadow-sm"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs font-black text-zinc-800 dark:text-white px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 bg-neutral-50 hover:bg-neutral-100 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl border border-zinc-200 dark:border-zinc-800 disabled:opacity-40 transition-all cursor-pointer shadow-sm"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
