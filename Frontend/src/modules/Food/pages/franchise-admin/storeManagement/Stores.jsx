import React, { useState, useEffect, useCallback } from "react"
import {
  Search,
  Plus,
  Download,
  RefreshCw,
  MoreVertical,
  Star,
  SlidersHorizontal,
  Trash2,
  Eye,
  Settings,
  Clock,
  ArrowUpDown,
  User,
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  ShoppingBag,
  Users,
  AlertCircle,
  Building2,
  ArrowUpRight
} from "lucide-react"
import { adminAPI } from "@food/api"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"

// Import Sub-components
import StoreDetailsDrawer from "./components/StoreDetailsDrawer"
import StoreModal from "./components/StoreModal"
import StatusModal from "./components/StatusModal"
import HoursModal from "./components/HoursModal"
import DeleteModal from "./components/DeleteModal"

export default function Stores() {
  // Lists & Loading State
  const [stores, setStores] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // KPI Stats
  const [kpis, setKpis] = useState(null)
  const [loadingKpis, setLoadingKpis] = useState(true)


  // Filters State
  const [searchVal, setSearchVal] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [typeFilter, setTypeFilter] = useState("All")
  const [openFilter, setOpenFilter] = useState("") // "" | "true" | "false"
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  // Table Pagination & Sorting
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [sortKey, setSortKey] = useState("storeName")
  const [sortOrder, setSortOrder] = useState("asc") // "asc" | "desc"

  // Dropdowns/Active Row state
  const [activeMenuId, setActiveMenuId] = useState(null)

  // Modal and Drawer Controls
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isStatusOpen, setIsStatusOpen] = useState(false)
  const [isHoursOpen, setIsHoursOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [selectedStore, setSelectedStore] = useState(null)
  const [drawerTab, setDrawerTab] = useState("overview")

  // Toast Notification Simulation State
  const [toast, setToast] = useState(null)

  const showToast = (message, type = "success") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // 1. Debouncing logic for search (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchVal)
      setPage(1) // Reset page on search change
    }, 300)
    return () => clearTimeout(handler)
  }, [searchVal])

  // Fetch KPI statistics
  const fetchKPIs = async () => {
    try {
      setLoadingKpis(true)
      const [totalRes, activeRes, inactiveRes] = await Promise.all([
        adminAPI.getStores({ limit: 1 }),
        adminAPI.getStores({ limit: 1, status: "Active" }),
        adminAPI.getStores({ limit: 1, status: "Inactive" })
      ])
      
      setKpis({
        totalStores: totalRes?.data?.data?.totalCount || 0,
        activeStoresCount: activeRes?.data?.data?.totalCount || 0,
        inactiveStoresCount: inactiveRes?.data?.data?.totalCount || 0
      })
    } catch (_) {
      setError("Failed to fetch dashboard metrics.")
    } finally {
      setLoadingKpis(false)
    }
  }

  // Fetch Main Stores Table
  const fetchStores = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = {
        page,
        limit,
        search: debouncedSearch,
        status: statusFilter,
        type: typeFilter,
        sort: sortKey,
        order: sortOrder
      }

      const res = await adminAPI.getStores(params)
      const data = res?.data?.data
      setStores(data?.stores || [])
      setTotalCount(data?.totalCount || 0)
    } catch (err) {
      setError("Failed to load stores network. Please retry.")
    } finally {
      setLoading(false)
    }
  }, [page, limit, debouncedSearch, statusFilter, typeFilter, sortKey, sortOrder])

  // Initial and reactive fetch
  useEffect(() => {
    fetchStores()
  }, [fetchStores])

  useEffect(() => {
    fetchKPIs()
  }, [])



  // Handle Sort Toggle
  const handleSort = (key) => {
    const isAsc = sortKey === key && sortOrder === "asc"
    setSortKey(key)
    setSortOrder(isAsc ? "desc" : "asc")
  }

  // Handle Export Stores
  const handleExport = () => {
    const doc = new jsPDF()
    doc.text("Stores Report", 14, 15)

    const tableColumn = ["Store Code", "Store Name", "Type", "City", "Status"]
    const tableRows = []

    stores.forEach((store) => {
      const storeData = [
        store.code || "N/A",
        store.storeName || "N/A",
        store.storeType || "N/A",
        store.regionId?.name || store.city || "N/A",
        store.isActive ? "Active" : "Inactive",
      ]
      tableRows.push(storeData)
    })

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    })

    doc.save(`Stores_Report_${new Date().toISOString().split("T")[0]}.pdf`)
    showToast("PDF report exported successfully.")
  }

  // Reset all Filters
  const handleResetFilters = () => {
    setSearchVal("")
    setStatusFilter("All")
    setTypeFilter("All")
    setPage(1)
  }

  // Modal Save/Confirm callbacks
  const handleAddStore = async (payload) => {
    try {
      await adminAPI.createStore(payload)
      showToast("Store created successfully!")
      setIsAddOpen(false)
      fetchStores()
      fetchKPIs()
    } catch (_) {
      showToast("Failed to create store.", "error")
    }
  }

  const handleEditStore = async (payload) => {
    try {
      await adminAPI.updateStore(selectedStore._id, payload)
      showToast("Store configurations updated successfully!")
      setIsEditOpen(false)
      fetchStores()
      fetchKPIs()
    } catch (_) {
      showToast("Failed to save changes.", "error")
    }
  }

  const handleStatusChange = async (id, status, reason) => {
    try {
      await adminAPI.updateStoreStatus(id, status, reason)
      showToast(`Store status changed to ${status}!`)
      setIsStatusOpen(false)
      fetchStores()
      fetchKPIs()
    } catch (_) {
      showToast("Failed to change store status.", "error")
    }
  }

  const handleHoursChange = async (id, hours) => {
    try {
      await adminAPI.updateStoreHours(id, hours)
      showToast("Operating hours updated successfully!")
      setIsHoursOpen(false)
      fetchStores()
    } catch (_) {
      showToast("Failed to save schedule.", "error")
    }
  }

  const handleDeleteStore = async (id) => {
    try {
      await adminAPI.deleteStore(id)
      showToast("Store archived successfully!")
      setIsDeleteOpen(false)
      fetchStores()
      fetchKPIs()
    } catch (_) {
      showToast("Failed to delete store.", "error")
    }
  }

  // Relative time helper
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

  return (
    <div className="px-4 pb-4 pt-4 max-w-7xl mx-auto space-y-4 text-slate-900 dark:text-slate-100">

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">Stores</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Manage all stores under this franchise.</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 text-white bg-primary hover:bg-primary/95 rounded-lg text-xs font-semibold shadow-md shadow-primary/10 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Store
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-55 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export Stores
          </button>
          <button
            onClick={() => { fetchStores(); fetchKPIs(); }}
            className="p-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-55 rounded-lg transition-colors cursor-pointer"
            title="Refresh Grid"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      {/* KPI DASHBOARD SECTION */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          { label: "Total Stores", val: kpis?.totalStores, sub: `${kpis?.totalStores ?? 0} Stores`, icon: Building2, color: "text-primary bg-primary/5" },
          { label: "Active Stores", val: kpis?.activeStoresCount, sub: `${kpis?.activeStoresCount ?? 0} Active`, icon: Users, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20" },
          { label: "Inactive Stores", val: (kpis?.totalStores ?? 0) - (kpis?.activeStoresCount ?? 0), sub: `${(kpis?.totalStores ?? 0) - (kpis?.activeStoresCount ?? 0)} Inactive`, icon: Trash2, color: "text-red-600 bg-red-50 dark:bg-red-950/20" }
        ].map((card, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-xl p-3 shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[85px]">
            {loadingKpis ? (
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
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search store name, code, region..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>

          {/* Status Dropdown */}
          <div className="w-[115px]">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-semibold focus:outline-none"
            >
              <option value="All">Status: All</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Store Type Dropdown */}
          <div className="w-[140px]">
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-semibold focus:outline-none"
            >
              <option value="All">Type: All</option>
              <option value="DELIVERY_CARRYOUT">Delivery & Carryout</option>
              <option value="DINE_IN">Dine-In</option>
              <option value="EXPRESS">Express</option>
              <option value="KIOSK">Kiosk</option>
            </select>
          </div>

          <button
            onClick={handleResetFilters}
            className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-55 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Reset Filters
          </button>

        </div>
      </div>

      {/* ERROR BANNER */}
      {error && !loading && (
        <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-650 shrink-0" />
          <div className="flex-1 text-xs text-red-700 dark:text-red-400 font-semibold">{error}</div>
          <button
            onClick={fetchStores}
            className="px-3 py-1 bg-red-655 hover:bg-red-750 text-white rounded-lg text-xs font-bold transition-colors"
          >
            Retry Fetch
          </button>
        </div>
      )}

      {/* TABLE SECTION */}
      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-xl overflow-hidden shadow-xs">
        
        {loading ? (
          /* SKELETON TABLE ROWS */
          <div className="p-6 space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex gap-4 items-center">
                <div className="h-4 w-12 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                <div className="h-4 w-1/4 bg-slate-300 dark:bg-slate-700 rounded animate-pulse" />
                <div className="h-4 w-1/6 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                <div className="h-4 w-20 bg-slate-300 dark:bg-slate-700 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : stores.length === 0 ? (
          /* EMPTY STATES */
          <div className="py-16 text-center space-y-4">
            <div className="w-24 h-24 mx-auto bg-slate-50 dark:bg-slate-950 rounded-full flex items-center justify-center border text-primary opacity-70">
              <Building2 className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-850 dark:text-slate-200">No stores found</h3>
              <p className="text-sm text-slate-455 dark:text-slate-400 mt-1">There are no stores fitting your current filters.</p>
            </div>
            <button
              onClick={() => setIsAddOpen(true)}
              className="px-5 py-2.5 bg-primary text-white font-bold rounded-xl text-sm shadow-md"
            >
              Add First Store
            </button>
          </div>
        ) : (
          /* COMPACT STORES TABLE */
          <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-850 text-[9px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider">
                  <th className="px-2.5 py-2 cursor-pointer select-none" onClick={() => handleSort("storeCode")}>
                    <div className="flex items-center gap-1">
                      Store ID
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="px-2.5 py-2 cursor-pointer select-none" onClick={() => handleSort("storeName")}>
                    <div className="flex items-center gap-1">
                      Store Name
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="px-2.5 py-2">Region</th>
                  <th className="px-2.5 py-2">Zone</th>
                  <th className="px-2.5 py-2">Territory</th>
                  <th className="px-2.5 py-2">Type</th>
                  <th className="px-2.5 py-2">Status</th>
                  <th className="px-2.5 py-2">Last Updated</th>
                  <th className="px-2.5 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-[11px] text-slate-700 dark:text-slate-350">
                {stores.map((store) => (
                  <tr key={store._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 group">
                    <td className="px-2.5 py-2 font-semibold text-slate-900 dark:text-white">{store.code}</td>
                    <td className="px-2.5 py-2 font-bold text-primary">{store.storeName}</td>
                    <td className="px-2.5 py-2 font-semibold">{store.regionId?.name || store.city || "N/A"}</td>
                    <td className="px-2.5 py-2 text-slate-500">{store.zoneId?.name || store.state || "N/A"}</td>
                    <td className="px-2.5 py-2 text-slate-500">{store.territoryId?.name || "N/A"}</td>
                    <td className="px-2.5 py-2 text-slate-500">{store.storeType}</td>
                    <td className="px-2.5 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        store.isActive
                          ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-650"
                          : "bg-red-50 dark:bg-red-950/20 text-red-650"
                      }`}>
                        {store.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-2.5 py-2 text-slate-400">
                      {getRelativeTime(store.updatedAt || store.createdAt)}
                    </td>
                    <td className="px-2.5 py-2 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => { setSelectedStore(store); setDrawerTab("overview"); setIsDrawerOpen(true); }}
                          className="p-1.5 text-blue-600 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-md transition-colors"
                          title="View"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { setSelectedStore(store); setIsEditOpen(true); }}
                          className="p-1.5 text-amber-600 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-md transition-colors"
                          title="Edit"
                        >
                          <Settings className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { setSelectedStore(store); setIsDeleteOpen(true); }}
                          className="p-1.5 text-red-600 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-md transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION FOOTER */}
        {!loading && stores.length > 0 && (
          <div className="flex items-center justify-between px-3 py-2 border-t border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20 text-xs text-slate-500 font-semibold select-none">
            <div className="flex items-center gap-4">
              <span>Showing {Math.min(totalCount, (page - 1) * limit + 1)} to {Math.min(totalCount, page * limit)} of {totalCount} stores</span>
              
              <div className="flex items-center gap-1.5">
                <span>Rows per page:</span>
                <select
                  value={limit}
                  onChange={(e) => { setLimit(parseInt(e.target.value)); setPage(1); }}
                  className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:outline-none"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-55 dark:hover:bg-slate-855 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4.5 h-4.5" />
              </button>
              <span className="px-2">Page {page} of {Math.ceil(totalCount / limit) || 1}</span>
              <button
                onClick={() => setPage((prev) => Math.min(prev + 1, Math.ceil(totalCount / limit)))}
                disabled={page >= Math.ceil(totalCount / limit)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-55 dark:hover:bg-slate-855 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* DETAILED VIEW DRAWER */}
      <StoreDetailsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        store={selectedStore}
        defaultTab={drawerTab}
      />

      {/* ADD/EDIT STORE MODAL */}
      <StoreModal
        isOpen={isAddOpen || isEditOpen}
        onClose={() => { setIsAddOpen(false); setIsEditOpen(false); setSelectedStore(null); }}
        onConfirm={isAddOpen ? handleAddStore : handleEditStore}
        store={isEditOpen ? selectedStore : null}
      />

      {/* CHANGE STATUS MODAL */}
      <StatusModal
        isOpen={isStatusOpen}
        onClose={() => { setIsStatusOpen(false); setSelectedStore(null); }}
        onConfirm={handleStatusChange}
        store={selectedStore}
      />

      {/* OPERATING HOURS MODAL */}
      <HoursModal
        isOpen={isHoursOpen}
        onClose={() => { setIsHoursOpen(false); setSelectedStore(null); }}
        onConfirm={handleHoursChange}
        store={selectedStore}
      />

      {/* DELETE CONFIRM MODAL */}
      <DeleteModal
        isOpen={isDeleteOpen}
        onClose={() => { setIsDeleteOpen(false); setSelectedStore(null); }}
        onConfirm={handleDeleteStore}
        store={selectedStore}
      />

      {/* Toast Notification Banner */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl border shadow-xl flex items-center gap-2 animate-bounce ${
          toast.type === "error"
            ? "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200"
            : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200"
        }`}>
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}
    </div>
  )
}
