import React, { useState, useEffect } from "react";
import { Search, RotateCcw, Calendar, Check, SlidersHorizontal } from "lucide-react";

export default function CustomerFilters({ filters = {}, onFilterChange }) {
  const [localSearch, setLocalSearch] = useState(filters.search || "");
  const [localOrderNum, setLocalOrderNum] = useState(filters.orderNumber || "");
  const [localStatus, setLocalStatus] = useState(filters.status || "All");
  const [localPayment, setLocalPayment] = useState(filters.paymentStatus || "All");
  const [localStart, setLocalStart] = useState(filters.startDate || "");
  const [localEnd, setLocalEnd] = useState(filters.endDate || "");
  const [localReturning, setLocalReturning] = useState(!!filters.returning);
  const [localHighValue, setLocalHighValue] = useState(!!filters.highValue);

  // Debounce search query
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (filters.search !== localSearch) {
        onFilterChange({ ...filters, search: localSearch });
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [localSearch]);

  // Synchronize local states when parent changes (e.g. from reset or stats card click)
  useEffect(() => {
    setLocalSearch(filters.search || "");
    setLocalOrderNum(filters.orderNumber || "");
    setLocalStatus(filters.status || "All");
    setLocalPayment(filters.paymentStatus || "All");
    setLocalStart(filters.startDate || "");
    setLocalEnd(filters.endDate || "");
    setLocalReturning(!!filters.returning);
    setLocalHighValue(!!filters.highValue);
  }, [filters]);

  const handleApply = () => {
    onFilterChange({
      ...filters,
      orderNumber: localOrderNum,
      status: localStatus,
      paymentStatus: localPayment,
      startDate: localStart,
      endDate: localEnd,
      returning: localReturning,
      highValue: localHighValue,
      page: 1 // Reset pagination on apply
    });
  };

  const handleReset = () => {
    setLocalSearch("");
    setLocalOrderNum("");
    setLocalStatus("All");
    setLocalPayment("All");
    setLocalStart("");
    setLocalEnd("");
    setLocalReturning(false);
    setLocalHighValue(false);
    onFilterChange({
      search: "",
      orderNumber: "",
      status: "All",
      paymentStatus: "All",
      startDate: "",
      endDate: "",
      returning: false,
      highValue: false,
      page: 1
    });
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl p-5 shadow-sm space-y-4">
      {/* Filter title / header */}
      <div className="flex items-center gap-2 pb-2.5 border-b border-zinc-100 dark:border-zinc-850">
        <SlidersHorizontal size={14} className="text-[var(--primary)]" />
        <span className="text-xs font-black tracking-wider text-zinc-800 dark:text-zinc-200 uppercase">
          Search & Filter Console
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {/* Search Input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            Search Customer
          </label>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Name, email or mobile..."
              className="w-full text-xs font-semibold pl-9 pr-3.5 py-2 bg-neutral-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-800 dark:text-white placeholder-zinc-400 outline-none focus:border-[var(--primary)] transition-all"
            />
          </div>
        </div>

        {/* Order Number Input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            Order Number
          </label>
          <input
            type="text"
            value={localOrderNum}
            onChange={(e) => setLocalOrderNum(e.target.value)}
            placeholder="e.g. PVP-9081"
            className="w-full text-xs font-semibold px-3.5 py-2 bg-neutral-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-800 dark:text-white placeholder-zinc-400 outline-none focus:border-[var(--primary)] transition-all"
          />
        </div>

        {/* Order Status */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            Order Status
          </label>
          <select
            value={localStatus}
            onChange={(e) => setLocalStatus(e.target.value)}
            className="w-full text-xs font-semibold px-3 py-2 bg-neutral-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-800 dark:text-white outline-none focus:border-[var(--primary)] transition-all cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="preparing">Preparing</option>
            <option value="ready">Ready</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        {/* Payment Status */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            Payment Status
          </label>
          <select
            value={localPayment}
            onChange={(e) => setLocalPayment(e.target.value)}
            className="w-full text-xs font-semibold px-3 py-2 bg-neutral-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-800 dark:text-white outline-none focus:border-[var(--primary)] transition-all cursor-pointer"
          >
            <option value="All">All Payments</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        {/* Date Range Fields */}
        <div className="flex flex-col gap-1.5 sm:col-span-2 md:col-span-2 lg:col-span-2">
          <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            Last Order Date Range
          </label>
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <input
                type="date"
                value={localStart}
                onChange={(e) => setLocalStart(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 bg-neutral-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-800 dark:text-white outline-none focus:border-[var(--primary)] transition-all cursor-pointer"
              />
            </div>
            <span className="text-zinc-400 dark:text-zinc-650 text-xs font-bold font-poppins">to</span>
            <div className="relative flex-1">
              <input
                type="date"
                value={localEnd}
                onChange={(e) => setLocalEnd(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 bg-neutral-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-800 dark:text-white outline-none focus:border-[var(--primary)] transition-all cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Toggles & Filter Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
        {/* Toggle Switches */}
        <div className="flex flex-wrap items-center gap-6">
          {/* Returning Customers Only */}
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <input
              type="checkbox"
              checked={localReturning}
              onChange={(e) => setLocalReturning(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-8 h-4.5 bg-zinc-200 dark:bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-[var(--primary)] relative"></div>
            <span className="text-xs font-bold text-zinc-600 dark:text-zinc-450 group-hover:text-zinc-800 dark:group-hover:text-zinc-350 select-none">
              Returning Only
            </span>
          </label>

          {/* High Value Customers Only */}
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <input
              type="checkbox"
              checked={localHighValue}
              onChange={(e) => setLocalHighValue(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-8 h-4.5 bg-zinc-200 dark:bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-[var(--primary)] relative"></div>
            <span className="text-xs font-bold text-zinc-600 dark:text-zinc-450 group-hover:text-zinc-800 dark:group-hover:text-zinc-350 select-none">
              High Value (₹5K+)
            </span>
          </label>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2.5 justify-end">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-4 py-2 bg-neutral-100 dark:bg-zinc-800 hover:bg-neutral-200 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-350 font-bold rounded-2xl text-xs transition-all cursor-pointer border border-transparent"
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
          
          <button
            onClick={handleApply}
            className="flex items-center gap-1.5 px-5 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold rounded-2xl text-xs transition-all cursor-pointer shadow-sm shadow-[var(--primary)]/10"
          >
            <Check size={13} className="stroke-[3]" />
            <span>Apply Filters</span>
          </button>
        </div>
      </div>
    </div>
  );
}
