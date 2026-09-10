import React, { useState, useEffect, useCallback } from "react"
import {
  Search,
  Download,
  RefreshCw,
  MoreVertical,
  Clock,
  ArrowUpDown,
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Building2,
  AlertCircle,
  Eye,
  Settings,
  Power,
  Copy,
  Lock,
  Compass,
  Star,
  CheckCircle,
  Users
} from "lucide-react"
import { adminAPI } from "@food/api"

// Sub-components
import ViewScheduleDrawer from "./components/ViewScheduleDrawer"
import EditHoursModal from "./components/EditHoursModal"
import TemporaryClosureModal from "./components/TemporaryClosureModal"
import HolidaySettingsModal from "./components/HolidaySettingsModal"
import CopyTimingsModal from "./components/CopyTimingsModal"
import BulkUpdateHoursModal from "./components/BulkUpdateHoursModal"
import ExportScheduleModal from "./components/ExportScheduleModal"

export default function OperatingHours() {
  // Page Listing and States
  const [schedules, setSchedules] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // KPI Dashboard States
  const [kpiStats, setKpiStats] = useState(null)
  const [loadingKPIs, setLoadingKPIs] = useState(true)

  // Filters State
  const [searchVal, setSearchVal] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [typeFilter, setTypeFilter] = useState("All")
  const [cityFilter, setCityFilter] = useState("All")
  const [sortKey, setSortKey] = useState("storeName")
  const [sortOrder, setSortOrder] = useState("asc") // "asc" | "desc"

  // Pagination
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  // Dropdown overlay / active menu state
  const [activeMenuId, setActiveMenuId] = useState(null)

  // Modal / Drawer control states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isClosureOpen, setIsClosureOpen] = useState(false)
  const [isHolidayOpen, setIsHolidayOpen] = useState(false)
  const [isCopyOpen, setIsCopyOpen] = useState(false)
  const [isBulkOpen, setIsBulkOpen] = useState(false)
  const [isExportOpen, setIsExportOpen] = useState(false)
  const [selectedStore, setSelectedStore] = useState(null)

  // Toast simulations
  const [toast, setToast] = useState(null)
  const showToast = (message, type = "success") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // 1. Debounce search input (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchVal)
      setPage(1)
    }, 300)
    return () => clearTimeout(handler)
  }, [searchVal])

  // Fetch KPI Stats
  const fetchKPIStats = async () => {
    try {
      setLoadingKPIs(true)
      const res = await adminAPI.getOperatingHoursDashboard()
      setKpiStats(res?.data?.data || null)
    } catch (_) {
      setError("Failed to fetch KPIs.")
    } finally {
      setLoadingKPIs(false)
    }
  }

  // Fetch Listing Schedule
  const fetchSchedules = async () => {
    try {
      setLoading(true)
      const params = {
        search: debouncedSearch,
        status: statusFilter,
        type: typeFilter,
        city: cityFilter,
        sort: sortKey,
        order: sortOrder,
        page,
        limit
      }
      const res = await adminAPI.getOperatingHours(params)
      setSchedules(res?.data?.data?.list || [])
      setTotalCount(res?.data?.data?.totalCount || 0)
    } catch (err) {
      setError("Failed to retrieve operating hour schedules.")
    } finally {
      setLoading(false)
    }
  }

  // Combined fetch trigger
  const triggerRefresh = () => {
    fetchKPIStats()
    fetchSchedules()
  }

  // Sync real-time updates using local event listeners
  useEffect(() => {
    fetchKPIStats()
    fetchSchedules()

    const handleUpdateEvent = () => {
      fetchSchedules()
      fetchKPIStats()
    }
    window.addEventListener("OPERATING_HOURS_UPDATED", handleUpdateEvent)
    return () => window.removeEventListener("OPERATING_HOURS_UPDATED", handleUpdateEvent)
  }, [debouncedSearch, statusFilter, typeFilter, cityFilter, sortKey, sortOrder, page, limit])

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortOrder(prev => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortOrder("asc")
    }
    setPage(1)
  }

  const handleResetFilters = () => {
    setSearchVal("")
    setStatusFilter("All")
    setTypeFilter("All")
    setCityFilter("All")
    setPage(1)
  }

  const getRelativeTime = (timeString) => {
    if (!timeString) return "N/A"
    const diffMs = Date.now() - new Date(timeString).getTime()
    const mins = Math.floor(diffMs / 60000)
    if (mins < 1) return "Just now"
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    return `${days}d ago`
  }

  const renderWeeklyPreview = (schedule) => {
    if (!schedule) return null
    const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    const dayLetters = ["M", "T", "W", "T", "F", "S", "S"]
    return (
      <div className="flex items-center gap-1">
        {days.map((day, i) => {
          const dayData = schedule[day]
          const isClosed = !dayData || dayData.isClosed
          const is24h = dayData && dayData.open === "12:00 AM" && dayData.close === "12:00 AM"
          return (
            <span
              key={day}
              title={`${day.charAt(0).toUpperCase() + day.slice(1)}: ${isClosed ? "Closed" : is24h ? "24 Hours" : `${dayData.open} - ${dayData.close}`}`}
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black tracking-tighter border transition-all ${
                isClosed
                  ? "bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-850"
                  : is24h
                    ? "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-650 dark:text-indigo-400 border-indigo-200/50 dark:border-indigo-900/30"
                    : "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-650 dark:text-emerald-400 border-emerald-250/50 dark:border-emerald-900/30"
              }`}
            >
              {dayLetters[i]}
            </span>
          )
        })}
      </div>
    )
  }

  const getTodayTiming = (schedule) => {
    if (!schedule) return "Closed"
    const todayName = new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase()
    const dayData = schedule[todayName]
    if (!dayData || dayData.isClosed) return <span className="text-slate-400">Closed Today</span>
    if (dayData.open === "12:00 AM" && dayData.close === "12:00 AM") return <span className="text-indigo-600 dark:text-indigo-400 font-bold">Open 24 Hours</span>
    return <span>{dayData.open} - {dayData.close}</span>
  }

  // Predefined unique city helper (or extract from stores)
  const cityOptions = ["All", "Indore", "Bhopal", "Dewas", "Ujjain"]

  return (
    <div className="px-4 pb-4 pt-4 max-w-7xl mx-auto space-y-4 text-slate-900 dark:text-slate-100">
      
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">Operating Hours</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
            Manage store opening, closing schedules, holiday dates and temporary closures.
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsBulkOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 text-white bg-primary hover:bg-primary/95 rounded-lg text-xs font-semibold shadow-md shadow-primary/10 transition-all cursor-pointer"
          >
            Bulk Update Hours
          </button>
          <button
            onClick={() => setIsExportOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export Schedule
          </button>
          <button
            onClick={triggerRefresh}
            className="p-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
            title="Refresh Schedules"
          >
            <RefreshCw className={`w-4 h-4 text-slate-550 ${loading ? "animate-spin text-primary" : ""}`} />
          </button>
        </div>
      </div>

      {/* KPI DASHBOARD CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: "Stores Open Now", val: kpiStats?.storesOpenNow, sub: "Serving Now", icon: Clock, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20" },
          { label: "Stores Closed", val: kpiStats?.storesClosed, sub: "Offline", icon: Lock, color: "text-rose-650 bg-rose-50 dark:bg-rose-950/20" },
          { label: "24x7 Stores", val: kpiStats?.stores24x7, sub: "Always Open", icon: Compass, color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20" },
          { label: "Holiday Closures", val: kpiStats?.holidayClosures, sub: "Custom schedules", icon: Calendar, color: "text-amber-600 bg-amber-50 dark:bg-amber-950/20" },
          { label: "Upcoming changes", val: kpiStats?.upcomingChanges, sub: "Pending audit queue", icon: TrendingUp, color: "text-purple-650 bg-purple-50 dark:bg-purple-950/20" }
        ].map((card, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-xl p-3 shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[85px]">
            {loadingKPIs ? (
              <div className="space-y-1.5 animate-pulse">
                <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-5 w-20 bg-slate-300 dark:bg-slate-700 rounded" />
              </div>
            ) : (
              <>
                <div>
                  <span className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">
                    {card.label}
                  </span>
                  <span className="text-base font-black text-slate-900 dark:text-white">
                    {card.val ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-50 dark:border-slate-850 text-[9px] font-semibold text-slate-400">
                  <span>{card.sub}</span>
                  <div className={`p-1 rounded-md ${card.color}`}>
                    <card.icon className="w-3.5 h-3.5" />
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* FILTER BAR SECTION */}
      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-xl p-3 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Search Store Bar */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search store name, code..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-805 dark:text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>

          {/* Status Dropdown */}
          <div className="w-[115px]">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-semibold focus:outline-none text-slate-700 dark:text-slate-300"
            >
              <option value="All">Status: All</option>
              <option value="Open">Open Now</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          {/* Store Type Dropdown */}
          <div className="w-[120px]">
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-semibold focus:outline-none text-slate-700 dark:text-slate-300"
            >
              <option value="All">Type: All</option>
              <option value="Regular">Regular</option>
              <option value="Express">Express</option>
              <option value="Cloud Kitchen">Cloud Kitchen</option>
            </select>
          </div>

          {/* City Dropdown */}
          <div className="w-[120px]">
            <select
              value={cityFilter}
              onChange={(e) => { setCityFilter(e.target.value); setPage(1); }}
              className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-semibold focus:outline-none text-slate-700 dark:text-slate-300"
            >
              <option value="All">City: All</option>
              {cityOptions.filter(c => c !== "All").map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          {/* Reset Filters */}
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white font-semibold transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* SCHEDULE TABLE SECTION */}
      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[...Array(5)].map((_, idx) => (
              <div key={idx} className="h-9 bg-slate-50 dark:bg-slate-950 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : error && schedules.length === 0 ? (
          <div className="p-8 text-center text-rose-650 bg-rose-50/20 border border-rose-100 rounded-xl m-4 text-xs font-semibold">
            {error}
          </div>
        ) : schedules.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-16 h-16 mx-auto bg-slate-50 dark:bg-slate-950 rounded-full flex items-center justify-center border text-primary opacity-60">
              <Clock className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-250">No schedules found</h3>
              <p className="text-xs text-slate-500 mt-0.5">There are no stores matching your current filter filters.</p>
            </div>
            <button
              onClick={handleResetFilters}
              className="px-4 py-1.5 bg-primary text-white font-bold rounded-lg text-xs shadow-md shadow-primary/10 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-850 text-[9px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider">
                  <th className="px-3 py-2.5 cursor-pointer select-none" onClick={() => handleSort("storeName")}>
                    <div className="flex items-center gap-1">
                      Store Name
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="px-3 py-2.5">Type</th>
                  <th className="px-3 py-2.5">City</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">Today's Hours</th>
                  <th className="px-3 py-2.5">Weekly Schedule</th>
                  <th className="px-3 py-2.5 cursor-pointer select-none" onClick={() => handleSort("lastUpdated")}>
                    <div className="flex items-center gap-1">
                      Last Updated
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="px-3 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-[11px] text-slate-700 dark:text-slate-300">
                {schedules.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors group">
                    
                    {/* Store Name and Code */}
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded text-slate-450 shrink-0">
                          <Building2 className="w-4 h-4 text-slate-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors">
                            {item.storeName}
                          </p>
                          <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold">Code: {item.storeCode || item.storeId}</p>
                        </div>
                      </div>
                    </td>

                    {/* Store Type */}
                    <td className="px-3 py-2.5">
                      <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-655 dark:text-slate-400">
                        {item.storeType}
                      </span>
                    </td>

                    {/* City */}
                    <td className="px-3 py-2.5 font-semibold text-slate-800 dark:text-slate-250">
                      {item.city}
                    </td>

                    {/* Status */}
                    <td className="px-3 py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1 w-fit ${
                        item.isOpen
                          ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-650"
                          : "bg-rose-50 dark:bg-rose-950/20 text-rose-650"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${item.isOpen ? "bg-emerald-500 animate-ping" : "bg-rose-555"}`} />
                        {item.isOpen ? "Open Now" : "Closed"}
                      </span>
                    </td>

                    {/* Today's Timing */}
                    <td className="px-3 py-2.5 font-bold text-slate-900 dark:text-white">
                      {getTodayTiming(item.schedule)}
                    </td>

                    {/* Weekly preview circles */}
                    <td className="px-3 py-2.5">
                      {renderWeeklyPreview(item.schedule)}
                    </td>

                    {/* Last Updated */}
                    <td className="px-3 py-2.5">
                      <div className="text-slate-450 dark:text-slate-500">
                        <span className="font-bold text-slate-800 dark:text-slate-200 block">
                          {getRelativeTime(item.lastUpdated)}
                        </span>
                        <span className="text-[9px] font-semibold text-slate-400">By {item.schedule?.updatedBy || "System"}</span>
                      </div>
                    </td>

                    {/* Actions Menu */}
                    <td className="px-3 py-2.5 text-right relative">
                      <button
                        onClick={() => setActiveMenuId(activeMenuId === item._id ? null : item._id)}
                        className="p-1 rounded-md text-slate-400 hover:text-slate-655 hover:bg-slate-55 dark:hover:bg-slate-800 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {/* Dropdown Menu */}
                      {activeMenuId === item._id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setActiveMenuId(null)} />
                          <div className="absolute right-4 mt-1 w-44 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl shadow-xl z-20 overflow-hidden divide-y divide-slate-100 dark:divide-slate-850 text-left">
                            <div className="py-1">
                              <button
                                onClick={() => { setSelectedStore(item); setIsDrawerOpen(true); setActiveMenuId(null); }}
                                className="w-full px-4 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 flex items-center gap-1.5"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-400" />
                                View Schedule
                              </button>
                              <button
                                onClick={() => { setSelectedStore(item); setIsEditOpen(true); setActiveMenuId(null); }}
                                className="w-full px-4 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 flex items-center gap-1.5"
                              >
                                <Settings className="w-3.5 h-3.5 text-slate-400" />
                                Edit Timings
                              </button>
                              <button
                                onClick={() => { setSelectedStore(item); setIsClosureOpen(true); setActiveMenuId(null); }}
                                className="w-full px-4 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 flex items-center gap-1.5"
                              >
                                <Power className="w-3.5 h-3.5 text-slate-400" />
                                {item.isOpen ? "Temporary Close" : "Reopen Store"}
                              </button>
                              <button
                                onClick={() => { setSelectedStore(item); setIsHolidayOpen(true); setActiveMenuId(null); }}
                                className="w-full px-4 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 flex items-center gap-1.5"
                              >
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                Holiday Settings
                              </button>
                              <button
                                onClick={() => { setSelectedStore(item); setIsCopyOpen(true); setActiveMenuId(null); }}
                                className="w-full px-4 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 flex items-center gap-1.5"
                              >
                                <Copy className="w-3.5 h-3.5 text-slate-400" />
                                Copy Timings
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION CONTROLS */}
        {!loading && schedules.length > 0 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between text-xs font-semibold text-slate-500 bg-slate-50/50 dark:bg-slate-950/20">
            <div>
              Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, totalCount)} of {totalCount} stores
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="p-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span>Page {page} of {Math.ceil(totalCount / limit)}</span>
              <button
                disabled={page * limit >= totalCount}
                onClick={() => setPage(p => p + 1)}
                className="p-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* DRAWER & MODAL INSTANCES */}
      <ViewScheduleDrawer
        isOpen={isDrawerOpen}
        onClose={() => { setIsDrawerOpen(false); setSelectedStore(null); }}
        store={selectedStore}
      />

      <EditHoursModal
        isOpen={isEditOpen}
        onClose={() => { setIsEditOpen(false); setSelectedStore(null); }}
        store={selectedStore}
        onSaveSuccess={() => {
          showToast("Standard weekly operating hours saved successfully!")
          window.dispatchEvent(new CustomEvent("OPERATING_HOURS_UPDATED"))
        }}
      />

      <TemporaryClosureModal
        isOpen={isClosureOpen}
        onClose={() => { setIsClosureOpen(false); setSelectedStore(null); }}
        store={selectedStore}
        onSaveSuccess={() => {
          showToast(selectedStore?.isOpen ? "Store closed temporarily." : "Store status updated to active.")
          window.dispatchEvent(new CustomEvent("OPERATING_HOURS_UPDATED"))
        }}
      />

      <HolidaySettingsModal
        isOpen={isHolidayOpen}
        onClose={() => { setIsHolidayOpen(false); setSelectedStore(null); }}
        store={selectedStore}
        onSaveSuccess={() => {
          showToast("Holiday schedule configured successfully!")
          window.dispatchEvent(new CustomEvent("OPERATING_HOURS_UPDATED"))
        }}
      />

      <CopyTimingsModal
        isOpen={isCopyOpen}
        onClose={() => { setIsCopyOpen(false); setSelectedStore(null); }}
        store={selectedStore}
        stores={schedules}
        onSaveSuccess={() => {
          showToast("Operating hours copied successfully!")
          window.dispatchEvent(new CustomEvent("OPERATING_HOURS_UPDATED"))
        }}
      />

      <BulkUpdateHoursModal
        isOpen={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        stores={schedules}
        onSaveSuccess={() => {
          showToast("Bulk timing update successfully applied!")
          window.dispatchEvent(new CustomEvent("OPERATING_HOURS_UPDATED"))
        }}
      />

      <ExportScheduleModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />

      {/* Custom Toast Notifications */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl border shadow-xl flex items-center gap-2 animate-bounce ${
          toast.type === "error"
            ? "bg-red-50 dark:bg-red-950/30 text-red-655 dark:text-red-400 border-red-200"
            : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-650 dark:text-emerald-400 border-emerald-205"
        }`}>
          <span className="text-xs font-bold">{toast.message}</span>
        </div>
      )}

    </div>
  )
}
