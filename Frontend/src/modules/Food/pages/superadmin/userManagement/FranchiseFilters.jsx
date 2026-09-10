import React, { useState, useEffect } from "react"
import { Search, ListFilter, X, ChevronDown, Plus, Download, RotateCcw } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export default function FranchiseFilters({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  typeFilter,
  setTypeFilter,
  cityFilter,
  setCityFilter,
  onReset,
  onExport,
  onAddAdmin
}) {
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [showTypeDropdown, setShowTypeDropdown] = useState(false)

  // Local state for instant UI typing responsiveness
  const [localSearch, setLocalSearch] = useState(searchQuery)

  // Sync local search state with parent updates (e.g., when resetting filters)
  useEffect(() => {
    setLocalSearch(searchQuery)
  }, [searchQuery])

  // Debounce the search query updates back to the parent component
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localSearch)
    }, 300)

    return () => clearTimeout(timer)
  }, [localSearch, setSearchQuery])

  const statusOptions = ["All Statuses", "ACTIVE", "INACTIVE", "SUSPENDED"]
  const typeOptions = ["All Types", "Single Store", "Multi Store"]


  return (
    <section className="grid grid-cols-1 xl:grid-cols-12 gap-3 items-center justify-between mb-4">
      {/* Search Input Box */}
      <div className="relative xl:col-span-4 w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black dark:text-white opacity-60" size={14} />
        <input
          type="text"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder="Search by name, email, phone or franchise..."
          className="w-full text-xs pl-9 pr-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-[var(--primary)] focus:border-transparent transition-all shadow-sm"
        />
        {localSearch && (
          <button
            onClick={() => setLocalSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-black dark:text-white opacity-60 hover:opacity-100 transition-colors"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Filter Options Row */}
      <div className="xl:col-span-8 flex flex-wrap xl:flex-nowrap items-center gap-2 w-full justify-start xl:justify-end select-none">
        {/* City Filter Input */}
        <div className="relative flex-shrink-0 w-32">
          <input
            type="text"
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            placeholder="Filter by city..."
            className="w-full text-xs px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-[var(--primary)] transition-all shadow-sm"
          />
          {cityFilter && (
            <button
              onClick={() => setCityFilter("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-black dark:text-white opacity-60 hover:opacity-100"
            >
              <X size={10} />
            </button>
          )}
        </div>

        {/* Status Dropdown Filter */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => {
              setShowStatusDropdown(!showStatusDropdown)
              setShowTypeDropdown(false)
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg text-xs font-semibold text-black dark:text-white shadow-sm transition-colors cursor-pointer"
          >
            <span>{statusFilter === "All Statuses" ? "Status: All" : `Status: ${statusFilter}`}</span>
            <ChevronDown size={12} className={`opacity-60 transition-transform duration-200 ${showStatusDropdown ? "rotate-180" : ""}`} />
          </button>
          <AnimatePresence>
            {showStatusDropdown && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowStatusDropdown(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 4, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute left-0 sm:right-0 sm:left-auto top-full mt-1 w-40 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 shadow-xl z-40 p-1"
                >
                  {statusOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => {
                        setStatusFilter(opt)
                        setShowStatusDropdown(false)
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors ${statusFilter === opt ? "text-[var(--primary)] font-bold bg-[var(--primary)]/5" : "text-black dark:text-white opacity-85"
                        }`}
                    >
                      {opt === "All Statuses" ? "All Statuses" : opt}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Type Dropdown Filter */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => {
              setShowTypeDropdown(!showTypeDropdown)
              setShowStatusDropdown(false)
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg text-xs font-semibold text-black dark:text-white shadow-sm transition-colors cursor-pointer"
          >
            <span>{typeFilter === "All Types" ? "Type: All" : `Type: ${typeFilter}`}</span>
            <ChevronDown size={12} className={`opacity-60 transition-transform duration-200 ${showTypeDropdown ? "rotate-180" : ""}`} />
          </button>
          <AnimatePresence>
            {showTypeDropdown && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowTypeDropdown(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 4, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute left-0 sm:right-0 sm:left-auto top-full mt-1 w-40 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 shadow-xl z-40 p-1"
                >
                  {typeOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => {
                        setTypeFilter(opt)
                        setShowTypeDropdown(false)
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors ${typeFilter === opt ? "text-[var(--primary)] font-bold bg-[var(--primary)]/5" : "text-black dark:text-white opacity-85"
                        }`}
                    >
                      {opt}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Divider line on desktop */}
        <div className="hidden lg:block w-px h-5 bg-zinc-200 dark:bg-zinc-800" />

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          {/* Reset Filters button */}
          <button
            onClick={onReset}
            title="Reset Filters"
            className="p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-black dark:text-white opacity-70 hover:opacity-100 rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            <RotateCcw size={12} className="stroke-[2.2]" />
          </button>

          {/* Export Data button */}
          <button
            onClick={onExport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-black dark:text-white font-semibold rounded-lg text-xs shadow-sm transition-colors cursor-pointer"
          >
            <Download size={12} className="stroke-[2.2]" />
            <span className="hidden sm:inline">Export</span>
          </button>

          {/* Add Franchise Admin button */}
          <button
            onClick={onAddAdmin}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white rounded-lg text-xs font-bold shadow-md shadow-[var(--primary)]/20 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <Plus size={12} className="stroke-[3]" />
            <span>Add Admin</span>
          </button>
        </div>
      </div>
    </section>
  )
}
