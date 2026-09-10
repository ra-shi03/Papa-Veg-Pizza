import React, { useState, useEffect } from "react";
import { Search, SlidersHorizontal, RefreshCcw, Download, Plus, Layers } from "lucide-react";

export default function CategoryFilters({
  filters,
  onFilterChange,
  parentCategories = [],
  onReset,
  onAddClick,
  onExportClick,
  onBulkClick,
  selectedCount
}) {
  const [searchTerm, setSearchTerm] = useState(filters.search || "");

  // Debounce search input by 355ms
  useEffect(() => {
    const timer = setTimeout(() => {
      onFilterChange("search", searchTerm);
    }, 355);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleClear = () => {
    setSearchTerm("");
    onReset();
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 space-y-4 shadow-sm">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
        
        {/* Search & Sliders */}
        <div className="flex flex-1 flex-wrap items-center gap-3 w-full">
          <div className="relative flex-1 min-w-[200px] lg:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search category name or slug..."
              className="w-full pl-9.5 pr-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[var(--primary)] text-zinc-800 dark:text-zinc-200"
            />
          </div>

          {/* Status Dropdown */}
          <select
            value={filters.status}
            onChange={(e) => onFilterChange("status", e.target.value)}
            className="px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[var(--primary)] text-zinc-700 dark:text-zinc-350 font-bold cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>

          {/* Featured Dropdown */}
          <select
            value={filters.isFeatured}
            onChange={(e) => onFilterChange("isFeatured", e.target.value)}
            className="px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[var(--primary)] text-zinc-700 dark:text-zinc-350 font-bold cursor-pointer"
          >
            <option value="">All Features</option>
            <option value="true">Featured Only</option>
            <option value="false">Standard Only</option>
          </select>

          {/* Parent Category Dropdown */}
          <select
            value={filters.parentCategory}
            onChange={(e) => onFilterChange("parentCategory", e.target.value)}
            className="px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[var(--primary)] text-zinc-700 dark:text-zinc-350 font-bold cursor-pointer"
          >
            <option value="">All Category Levels</option>
            <option value="none">Root Categories Only</option>
            {parentCategories.map((c) => (
              <option key={c._id} value={c._id}>
                Under {c.name}
              </option>
            ))}
          </select>

          {/* Reset button */}
          <button
            onClick={handleClear}
            className="p-2 border border-zinc-200 dark:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-950 rounded-xl text-zinc-400 hover:text-zinc-650 cursor-pointer flex items-center justify-center gap-1.5"
            title="Reset filters"
          >
            <RefreshCcw size={13} />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 w-full lg:w-auto shrink-0 justify-end">
          {selectedCount > 0 && (
            <button
              onClick={onBulkClick}
              className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-sm animate-bounce"
            >
              <Layers size={13} />
              <span>Bulk Actions ({selectedCount})</span>
            </button>
          )}

          <button
            onClick={onExportClick}
            className="px-3.5 py-2 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-950 text-zinc-650 dark:text-zinc-300 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Download size={13} />
            <span>Export</span>
          </button>

          <button
            onClick={onAddClick}
            className="px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-xl font-extrabold flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Plus size={14} />
            <span>Add Category</span>
          </button>
        </div>

      </div>
    </div>
  );
}
