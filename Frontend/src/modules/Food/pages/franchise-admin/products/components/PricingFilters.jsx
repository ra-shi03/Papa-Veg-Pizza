import React, { useState, useEffect } from "react";
import { Search, RefreshCw, Download, Layers, Sparkles, Copy, SlidersHorizontal } from "lucide-react";

export default function PricingFilters({
  filters,
  onFilterChange,
  storesList = [],
  categoriesList = [],
  onReset,
  onBulkUpdateClick,
  onCopyPricingClick,
  onExportClick,
  onRefreshClick,
  isLoading
}) {
  const [searchTerm, setSearchTerm] = useState(filters.search || "");

  // Debounce search input by 350ms
  useEffect(() => {
    const timer = setTimeout(() => {
      onFilterChange("search", searchTerm);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleClear = () => {
    setSearchTerm("");
    onReset();
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 shadow-xs space-y-3 text-xs font-semibold">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        
        {/* Filter Selection Panel */}
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          {/* Search bar */}
          <div className="relative flex-1 min-w-[200px] lg:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={13} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search product, SKU, store..."
              className="w-full pl-8.5 pr-3 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:border-[var(--primary)] text-zinc-800 dark:text-zinc-200 text-xs"
            />
          </div>

          {/* Store Outlet Selector */}
          <select
            value={filters.storeId || "all"}
            onChange={(e) => onFilterChange("storeId", e.target.value)}
            className="px-2 py-1.5 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:border-[var(--primary)] text-zinc-700 dark:text-zinc-350 cursor-pointer"
          >
            <option value="all">All Stores</option>
            {storesList
              .filter(s => s.status === "Active")
              .map((s) => (
                <option key={s._id} value={s._id}>
                  {s.storeName}
                </option>
              ))}
          </select>

          {/* Category Selector */}
          <select
            value={filters.categoryId || "all"}
            onChange={(e) => onFilterChange("categoryId", e.target.value)}
            className="px-2 py-1.5 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:border-[var(--primary)] text-zinc-700 dark:text-zinc-350 cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categoriesList.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Product Type Filter */}
          <select
            value={filters.productType || "all"}
            onChange={(e) => onFilterChange("productType", e.target.value)}
            className="px-2 py-1.5 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:border-[var(--primary)] text-zinc-700 dark:text-zinc-350 cursor-pointer"
          >
            <option value="all">All Types</option>
            <option value="VEG">Veg Only</option>
            <option value="NON_VEG">Non-Veg</option>
            <option value="EGG">Egg Dishes</option>
          </select>

          {/* Availability Status Filter */}
          <select
            value={filters.availability || "all"}
            onChange={(e) => onFilterChange("availability", e.target.value)}
            className="px-2 py-1.5 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:border-[var(--primary)] text-zinc-700 dark:text-zinc-350 cursor-pointer"
          >
            <option value="all">All Availability</option>
            <option value="AVAILABLE">Available</option>
            <option value="UNAVAILABLE">Unavailable</option>
            <option value="PROMOTION ACTIVE">Promotion Active</option>
          </select>

          {/* Status Filter */}
          <select
            value={filters.status || "all"}
            onChange={(e) => onFilterChange("status", e.target.value)}
            className="px-2 py-1.5 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:border-[var(--primary)] text-zinc-700 dark:text-zinc-350 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="ACTIVE">Active Rule</option>
            <option value="INACTIVE">Inactive Rule</option>
          </select>

          {/* Reset button */}
          <button
            onClick={handleClear}
            className="px-2 py-1.5 border border-zinc-200 dark:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-955 rounded-lg text-zinc-400 hover:text-zinc-650 cursor-pointer flex items-center justify-center gap-1.5"
            title="Reset Filters"
          >
            Reset
          </button>
        </div>

        {/* Action Buttons Panel */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onBulkUpdateClick}
            className="flex items-center gap-1 px-2.5 py-1.5 text-white bg-primary hover:bg-primary/95 rounded-lg text-xs font-semibold shadow-md shadow-primary/10 transition-all cursor-pointer"
          >
            <SlidersHorizontal size={13} />
            Bulk Update
          </button>
          
          <button
            onClick={onCopyPricingClick}
            className="flex items-center gap-1 px-2.5 py-1.5 text-zinc-700 dark:text-zinc-300 border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-850 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            <Copy size={13} className="text-zinc-400" />
            Copy Pricing
          </button>

          <button
            onClick={onExportClick}
            className="flex items-center gap-1 px-2.5 py-1.5 border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-850 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            title="Export CSV"
          >
            <Download size={13} className="text-zinc-400" />
            Export
          </button>

          <button
            onClick={onRefreshClick}
            disabled={isLoading}
            className="p-1.5 border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-850 rounded-lg transition-colors cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw size={13} className={`text-zinc-400 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>

      </div>
    </div>
  );
}
