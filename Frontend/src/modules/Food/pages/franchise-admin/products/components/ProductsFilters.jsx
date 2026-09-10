import React from "react";
import { Search, Sliders, X } from "lucide-react";
import { mockCategories } from "../mockProducts";

export default function ProductsFilters({
  localSearch,
  setLocalSearch,
  categoryId,
  setCategoryId,
  status,
  setStatus,
  productType,
  setProductType,
  isExpanded,
  setIsExpanded,
  onReset
}) {
  return (
    <section className="bg-white dark:bg-zinc-950 p-4 border border-zinc-150 dark:border-zinc-850 rounded-2xl shadow-xs space-y-4">
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        
        {/* Search box */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={15} />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold text-zinc-805 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none focus:border-[var(--primary)] transition-colors text-xs"
            placeholder="Search by product name, SKU..."
          />
        </div>

        {/* Filters toggle controls */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end text-xs">
          
          {/* Quick Category Filter (Desktop compact) */}
          <div className="flex items-center gap-1.5">
            <span className="text-[9.5px] uppercase font-bold text-zinc-400 tracking-wider">Category:</span>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold text-zinc-805 dark:text-zinc-250 focus:outline-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              {mockCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* More Filters Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-2.5 rounded-xl border transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 font-bold ${
              isExpanded 
                ? "bg-zinc-900 border-transparent text-white dark:bg-zinc-800" 
                : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 text-zinc-500"
            }`}
          >
            <Sliders size={14} />
            <span>Filters</span>
          </button>

          {/* Reset Filters */}
          <button
            onClick={onReset}
            className="p-2.5 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 rounded-xl transition-all active:scale-95 cursor-pointer text-zinc-550 dark:text-zinc-350"
            title="Reset Filters"
          >
            <X size={14} />
          </button>

        </div>
      </div>

      {/* Advanced filters dropdown */}
      {isExpanded && (
        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-900 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 animate-slide-down text-xs font-bold">
          
          {/* Status Filter */}
          <div className="space-y-1.5">
            <label className="text-[9.5px] uppercase font-bold text-zinc-400 tracking-wider block">Visibility Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold text-zinc-805 dark:text-zinc-250 focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>

          {/* Veg/Non-Veg Filter */}
          <div className="space-y-1.5">
            <label className="text-[9.5px] uppercase font-bold text-zinc-400 tracking-wider block">Food Dietary Type</label>
            <select
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold text-zinc-805 dark:text-zinc-250 focus:outline-none cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="VEG">VEG (Veggie special)</option>
              <option value="NON_VEG">NON_VEG (Meat items)</option>
              <option value="EGG">EGG (Egg-infused)</option>
            </select>
          </div>

          {/* Quick Tips Info */}
          <div className="p-3 bg-zinc-50/50 dark:bg-zinc-900/40 rounded-xl border border-zinc-150 dark:border-zinc-800 flex items-center justify-center text-[10px] text-zinc-400 font-semibold leading-normal">
            ⚙️ Type is dynamically categorized for quick checkout routing. Best Seller and Featured overrides are managed in edit forms.
          </div>

        </div>
      )}
    </section>
  );
}
