import React, { useState, useEffect } from "react"
import { Search, X, RotateCcw, Plus, ArrowDownAZ, ArrowUpZA } from "lucide-react"

export default function DeliveryPartnersFilters({
  searchQuery,
  setSearchQuery,
  franchiseFilter,
  setFranchiseFilter,
  storeFilter,
  setStoreFilter,
  statusFilter,
  setStatusFilter,
  vehicleFilter,
  setVehicleFilter,
  sortOrder,
  setSortOrder,
  onReset,
  onAddPartner
}) {
  // Local state for search to achieve responsive typing and debouncing
  const [localSearch, setLocalSearch] = useState(searchQuery)

  // Sync local search with parent query changes (e.g., on reset)
  useEffect(() => {
    setLocalSearch(searchQuery)
  }, [searchQuery])

  // Debounce effect: update search query after 300ms of inactivity
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localSearch)
    }, 300)
    return () => clearTimeout(timer)
  }, [localSearch, setSearchQuery])

  const franchises = ["All Franchises", "Papa Veg Mumbai", "Papa Veg Pune", "Papa Veg Delhi", "Papa Veg Bangalore"]
  const stores = ["All Stores", "Mumbai - Andheri West", "Pune - Koregaon Park", "Delhi - Connaught Place", "Bangalore - Indiranagar"]
  const statuses = ["All Statuses", "Online", "Offline", "Busy", "Suspended"]
  const vehicles = ["Vehicle Type", "Electric Bike", "Scooter", "Car"]

  return (
    <section className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-2 shadow-sm w-full overflow-x-auto">
      {/* Search Bar */}
      <div className="flex-1 min-w-[240px]">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black/50 dark:text-white/50 group-focus-within:text-[var(--primary)] transition-colors" size={14} />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search by Name, Phone, or Vehicle..."
            className="w-full pl-9 pr-8 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-1 focus:ring-[var(--primary)] focus:border-transparent font-medium text-xs text-black dark:text-white outline-none transition-all"
          />
          {localSearch && (
            <button
              onClick={() => setLocalSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-black/50 hover:text-black dark:text-white/50 dark:hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Franchise Filter */}
      <div className="flex-shrink-0">
        <select
          value={franchiseFilter}
          onChange={(e) => setFranchiseFilter(e.target.value)}
          className="w-full px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold text-black dark:text-white focus:ring-1 focus:ring-[var(--primary)] outline-none cursor-pointer"
        >
          {franchises.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      {/* Store Filter */}
      <div className="flex-shrink-0">
        <select
          value={storeFilter}
          onChange={(e) => setStoreFilter(e.target.value)}
          className="w-full px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold text-black dark:text-white focus:ring-1 focus:ring-[var(--primary)] outline-none cursor-pointer"
        >
          {stores.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      {/* Status Filter */}
      <div className="flex-shrink-0">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold text-black dark:text-white focus:ring-1 focus:ring-[var(--primary)] outline-none cursor-pointer"
        >
          {statuses.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      {/* Vehicle Filter */}
      <div className="flex-shrink-0">
        <select
          value={vehicleFilter}
          onChange={(e) => setVehicleFilter(e.target.value)}
          className="w-full px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold text-black dark:text-white focus:ring-1 focus:ring-[var(--primary)] outline-none cursor-pointer"
        >
          {vehicles.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Reset Button */}
        <button
          onClick={onReset}
          title="Reset Filters"
          className="p-1.5 bg-zinc-150 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-black/70 dark:text-white/70 rounded-lg transition-all shadow-sm flex items-center justify-center cursor-pointer"
        >
          <RotateCcw size={14} />
        </button>

        {/* Sort Button */}
        <button
          onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
          title={`Sort Name: ${sortOrder === "asc" ? "A-Z" : "Z-A"}`}
          className="p-1.5 bg-zinc-150 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-black/70 dark:text-white/70 rounded-lg transition-all shadow-sm flex items-center justify-center cursor-pointer"
        >
          {sortOrder === "asc" ? <ArrowDownAZ size={14} /> : <ArrowUpZA size={14} />}
        </button>
      </div>
    </section>
  )
}
