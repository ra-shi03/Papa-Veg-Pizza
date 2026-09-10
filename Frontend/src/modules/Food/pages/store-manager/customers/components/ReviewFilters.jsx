import React, { useState, useEffect } from "react";
import { Search, RotateCcw, Filter, Calendar } from "lucide-react";

export default function ReviewFilters({ filters, onFilterChange }) {
  const [localSearch, setLocalSearch] = useState(filters.search || "");

  // Debounced Customer Search (400ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== filters.search) {
        onFilterChange({ ...filters, search: localSearch, page: 1 });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [localSearch, filters, onFilterChange]);

  const handleChange = (field, val) => {
    onFilterChange({ ...filters, [field]: val, page: 1 });
  };

  const handleReset = () => {
    setLocalSearch("");
    onFilterChange({
      search: "",
      rating: "All",
      sentiment: "All",
      replyStatus: "All",
      startDate: "",
      endDate: "",
      page: 1,
      limit: 10,
      sortBy: "createdAt",
      sortOrder: "desc"
    });
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl p-5 shadow-sm space-y-4">
      {/* Header filter indicator */}
      <div className="flex items-center gap-1.5 text-zinc-400 dark:text-zinc-500 font-extrabold text-[10px] uppercase tracking-wider pb-1 border-b border-zinc-50 dark:border-zinc-850">
        <Filter size={11} />
        <span>Reviews Filter Console</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
        {/* Search */}
        <div className="flex flex-col gap-1.5 text-xs font-semibold">
          <label className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500">Customer Search</label>
          <div className="relative">
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search by name, email, phone..."
              className="w-full text-xs font-bold pl-8.5 pr-3 py-2 bg-neutral-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-800 dark:text-white placeholder-zinc-400 outline-none focus:border-[var(--primary)] transition-all"
            />
            <Search className="absolute left-3 top-2.5 text-zinc-400" size={13} />
          </div>
        </div>

        {/* Rating */}
        <div className="flex flex-col gap-1.5 text-xs font-semibold">
          <label className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500">Rating Tier</label>
          <select
            value={filters.rating}
            onChange={(e) => handleChange("rating", e.target.value)}
            className="w-full text-xs font-bold px-3 py-2 bg-neutral-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-800 dark:text-white outline-none focus:border-[var(--primary)] cursor-pointer transition-all"
          >
            <option value="All">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>

        {/* Sentiment */}
        <div className="flex flex-col gap-1.5 text-xs font-semibold">
          <label className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500">AI Sentiment</label>
          <select
            value={filters.sentiment}
            onChange={(e) => handleChange("sentiment", e.target.value)}
            className="w-full text-xs font-bold px-3 py-2 bg-neutral-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-800 dark:text-white outline-none focus:border-[var(--primary)] cursor-pointer transition-all"
          >
            <option value="All">All Sentiments</option>
            <option value="Positive">Positive</option>
            <option value="Neutral">Neutral</option>
            <option value="Negative">Negative</option>
          </select>
        </div>

        {/* Reply Status */}
        <div className="flex flex-col gap-1.5 text-xs font-semibold">
          <label className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500">Reply Status</label>
          <select
            value={filters.replyStatus}
            onChange={(e) => handleChange("replyStatus", e.target.value)}
            className="w-full text-xs font-bold px-3 py-2 bg-neutral-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-800 dark:text-white outline-none focus:border-[var(--primary)] cursor-pointer transition-all"
          >
            <option value="All">All Statuses</option>
            <option value="replied">Replied</option>
            <option value="pending">Pending Reply</option>
          </select>
        </div>

        {/* Date Inputs - REQUIRED: MUST be placed inside div wrappers for grid consistency */}
        <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500">Start Date</label>
            <div className="relative">
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleChange("startDate", e.target.value)}
                className="w-full text-xs font-bold px-3 py-2 bg-neutral-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-800 dark:text-white outline-none focus:border-[var(--primary)] transition-all"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500">End Date</label>
            <div className="relative">
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleChange("endDate", e.target.value)}
                className="w-full text-xs font-bold px-3 py-2 bg-neutral-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-800 dark:text-white outline-none focus:border-[var(--primary)] transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer controls */}
      <div className="flex justify-between items-center pt-2 border-t border-zinc-50 dark:border-zinc-850">
        <button
          onClick={handleReset}
          className="flex items-center gap-1 px-4.5 py-2.5 bg-neutral-50 hover:bg-neutral-100 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-zinc-650 dark:text-zinc-300 font-bold rounded-2xl text-xs border border-zinc-200 dark:border-zinc-800 transition-all cursor-pointer shadow-sm"
        >
          <RotateCcw size={11} className="text-zinc-400" />
          <span>Reset Filters</span>
        </button>
      </div>
    </div>
  );
}
