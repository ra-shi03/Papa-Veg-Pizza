import React, { useState, useEffect } from "react";
import { Search, RotateCcw, Calendar, SlidersHorizontal } from "lucide-react";

export default function ComplaintFilters({ filters = {}, onFilterChange }) {
  const [localSearch, setLocalSearch] = useState(filters.search || "");
  const [localComplaintType, setLocalComplaintType] = useState(filters.complaintType || "All");
  const [localPriority, setLocalPriority] = useState(filters.priority || "All");
  const [localStatus, setLocalStatus] = useState(filters.status || "All");
  const [localStart, setLocalStart] = useState(filters.startDate || "");
  const [localEnd, setLocalEnd] = useState(filters.endDate || "");

  // Debounce search query
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (filters.search !== localSearch) {
        onFilterChange({ ...filters, search: localSearch, page: 1 });
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [localSearch]);

  // Synchronize local states when parent changes (e.g. from reset or stats card click)
  useEffect(() => {
    setLocalSearch(filters.search || "");
    setLocalComplaintType(filters.complaintType || "All");
    setLocalPriority(filters.priority || "All");
    setLocalStatus(filters.status || "All");
    setLocalStart(filters.startDate || "");
    setLocalEnd(filters.endDate || "");
  }, [filters]);

  const handleApply = () => {
    onFilterChange({
      ...filters,
      complaintType: localComplaintType,
      priority: localPriority,
      status: localStatus,
      startDate: localStart,
      endDate: localEnd,
      page: 1 // Reset pagination on apply
    });
  };

  const handleReset = () => {
    setLocalSearch("");
    setLocalComplaintType("All");
    setLocalPriority("All");
    setLocalStatus("All");
    setLocalStart("");
    setLocalEnd("");
    onFilterChange({
      search: "",
      complaintType: "All",
      priority: "All",
      status: "All",
      startDate: "",
      endDate: "",
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

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 items-end">
        {/* Search Input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            Search
          </label>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="ID, customer, issue or order..."
              className="w-full text-xs font-semibold pl-9 pr-3.5 py-2 bg-neutral-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-800 dark:text-white placeholder-zinc-400 outline-none focus:border-[var(--primary)] transition-all"
            />
          </div>
        </div>

        {/* Complaint Type */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            Issue Type
          </label>
          <select
            value={localComplaintType}
            onChange={(e) => setLocalComplaintType(e.target.value)}
            className="w-full text-xs font-semibold px-3 py-2 bg-neutral-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-800 dark:text-white outline-none focus:border-[var(--primary)] transition-all cursor-pointer"
          >
            <option value="All">All Types</option>
            <option value="missing_items">Missing Items</option>
            <option value="late_delivery">Late Delivery</option>
            <option value="food_quality">Food Quality</option>
            <option value="wrong_order">Wrong Order</option>
            <option value="rider_behavior">Rider Behavior</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Priority */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            Priority
          </label>
          <select
            value={localPriority}
            onChange={(e) => setLocalPriority(e.target.value)}
            className="w-full text-xs font-semibold px-3 py-2 bg-neutral-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-800 dark:text-white outline-none focus:border-[var(--primary)] transition-all cursor-pointer"
          >
            <option value="All">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        {/* Status */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            Resolution Status
          </label>
          <select
            value={localStatus}
            onChange={(e) => setLocalStatus(e.target.value)}
            className="w-full text-xs font-semibold px-3 py-2 bg-neutral-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-800 dark:text-white outline-none focus:border-[var(--primary)] transition-all cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        {/* Date Start - Wrapped inside div */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1">
            <Calendar size={10} />
            <span>From Date</span>
          </label>
          <div className="relative w-full">
            <input
              type="date"
              value={localStart}
              onChange={(e) => setLocalStart(e.target.value)}
              className="w-full text-xs font-semibold px-3.5 py-2 bg-neutral-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-800 dark:text-white outline-none focus:border-[var(--primary)] transition-all cursor-pointer"
            />
          </div>
        </div>

        {/* Date End - Wrapped inside div */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1">
            <Calendar size={10} />
            <span>To Date</span>
          </label>
          <div className="relative w-full">
            <input
              type="date"
              value={localEnd}
              onChange={(e) => setLocalEnd(e.target.value)}
              className="w-full text-xs font-semibold px-3.5 py-2 bg-neutral-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-800 dark:text-white outline-none focus:border-[var(--primary)] transition-all cursor-pointer"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 mt-auto">
          <button
            onClick={handleApply}
            className="flex-1 py-2 px-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold rounded-2xl transition-all cursor-pointer shadow-sm shadow-[var(--primary)]/10"
          >
            Apply
          </button>
          <button
            onClick={handleReset}
            className="py-2 px-3.5 bg-neutral-50 dark:bg-zinc-850 hover:bg-neutral-100 dark:hover:bg-zinc-800 text-zinc-650 dark:text-zinc-300 text-xs font-bold rounded-2xl border border-zinc-200 dark:border-zinc-800 transition-all cursor-pointer flex items-center justify-center"
            title="Reset Filters"
          >
            <RotateCcw size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
