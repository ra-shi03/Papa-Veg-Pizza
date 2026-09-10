import React, { useState, useEffect } from "react";
import { Search, RefreshCcw, Download, Plus, Boxes, Layers } from "lucide-react";

export default function AddonFilters({
  filters,
  onFilterChange,
  addonGroups = [],
  onReset,
  onAddClick,
  onCreateGroupClick,
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
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 space-y-4 shadow-sm text-xs font-semibold">
      <div className="flex flex-col lg:flex-row items-start justify-between gap-4">
        
        {/* Search & Selectors */}
        <div className="flex flex-1 flex-wrap items-start gap-3 w-full">
          <div className="relative flex-1 min-w-[200px] lg:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search add-on name..."
              className="w-full pl-9.5 pr-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[var(--primary)] text-zinc-850 dark:text-zinc-200"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => onFilterChange("status", e.target.value)}
            className="px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[var(--primary)] text-zinc-700 dark:text-zinc-350 font-bold cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
          </select>

          {/* Type Filter */}
          <select
            value={filters.type}
            onChange={(e) => onFilterChange("type", e.target.value)}
            className="px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[var(--primary)] text-zinc-700 dark:text-zinc-350 font-bold cursor-pointer"
          >
            <option value="all">All Types</option>
            <option value="TOPPING">Topping</option>
            <option value="CHEESE">Cheese</option>
            <option value="SAUCE">Sauce</option>
            <option value="EXTRA">Extra</option>
          </select>

          {/* Group Filter */}
          <select
            value={filters.groupId}
            onChange={(e) => onFilterChange("groupId", e.target.value)}
            className="px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[var(--primary)] text-zinc-700 dark:text-zinc-350 font-bold cursor-pointer"
          >
            <option value="all">All Groups</option>
            {addonGroups.map((g) => (
              <option key={g._id} value={g._id}>
                {g.name}
              </option>
            ))}
          </select>

          {/* Inventory Mapping Filter */}
          <select
            value={filters.inventoryItemId}
            onChange={(e) => onFilterChange("inventoryItemId", e.target.value)}
            className="px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[var(--primary)] text-zinc-700 dark:text-zinc-350 font-bold cursor-pointer"
          >
            <option value="all">All Inventory Settings</option>
            <option value="MAPPED">Mapped To Inventory</option>
            <option value="UNMAPPED">Not Mapped</option>
          </select>

          {/* Reset button */}
          <button
            onClick={handleClear}
            className="p-2 border border-zinc-200 dark:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-955 rounded-xl text-zinc-400 hover:text-zinc-650 cursor-pointer flex items-center justify-center gap-1.5"
            title="Reset filters"
          >
            <RefreshCcw size={13} />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>

        {/* Buttons */}
        <div className="flex items-start gap-2 w-full lg:w-auto shrink-0 justify-end">
          {selectedCount > 0 && (
            <button
              onClick={onBulkClick}
              className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Layers size={13} />
              <span>Bulk ({selectedCount})</span>
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
            onClick={onCreateGroupClick}
            className="px-3.5 py-2 bg-[var(--secondary)] text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Boxes size={13} />
            <span>+ Create Group</span>
          </button>

          <button
            onClick={onAddClick}
            className="px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-xl font-extrabold flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Plus size={14} />
            <span>+ Add Add-on</span>
          </button>
        </div>

      </div>
    </div>
  );
}
