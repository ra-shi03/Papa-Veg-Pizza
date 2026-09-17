import React, { useState, useEffect, useCallback } from "react"
import {
  Search, Plus, Download, RefreshCw, MoreVertical, Star,
  SlidersHorizontal, Trash2, Eye, Shield, Clock, Calendar, Edit,
  ChevronLeft, ChevronRight, TrendingUp, ShoppingBag, Users,
  AlertCircle, Building2, ArrowUpRight, UserCheck, CalendarDays
} from "lucide-react"
import { adminAPI } from "../../../../../services/api"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

// Import subcomponents
import AddEditManagerModal from "./components/AddEditManagerModal"
import ViewManagerDrawer from "./components/ViewManagerDrawer"
import AssignStoreModal from "./components/AssignStoreModal"
import AttendanceModal from "./components/AttendanceModal"
import PerformanceModal from "./components/PerformanceModal"
import PermissionsModal from "./components/PermissionsModal"
import SuspendManagerModal from "./components/SuspendManagerModal"
import DeleteManagerModal from "./components/DeleteManagerModal"

// Removed initialStores import since we are fetching from backend

export default function StoreManagers() {
  // Main Data States
  const [managers, setManagers] = useState([])
  const [stores, setStores] = useState([])
  const [kpis, setKpis] = useState({
    totalManagers: 0,
    activeManagers: 0,
    onLeaveManagers: 0,
    suspendedManagers: 0
  })
  
  // Table state
  const [filteredManagers, setFilteredManagers] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  
  // Filter States
  const [searchVal, setSearchVal] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [storeFilter, setStoreFilter] = useState("All")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  
  // Pagination & Sorting
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [sortKey, setSortKey] = useState("name")
  const [sortOrder, setSortOrder] = useState("asc") // "asc" | "desc"
  
  // Modals & Drawers Control
  const [selectedManager, setSelectedManager] = useState(null)
  const [activeMenuId, setActiveMenuId] = useState(null)
  
  const [isAddEditOpen, setIsAddEditOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isAssignStoreOpen, setIsAssignStoreOpen] = useState(false)
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false)
  const [isPerformanceOpen, setIsPerformanceOpen] = useState(false)
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false)
  const [isSuspendOpen, setIsSuspendOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [drawerTab, setDrawerTab] = useState("profile")
  
  // Toast notifications
  const [toast, setToast] = useState(null)

  const showToast = (message, type = "success") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  // 1. Debouncing logic for Search Bar (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchVal)
      setPage(1)
    }, 300)
    return () => clearTimeout(handler)
  }, [searchVal])

  // Filter and Sort Processing
  const processData = useCallback(() => {
    setLoading(true)
    let list = [...managers]
    
    // Soft-delete filter
    list = list.filter((m) => m.status !== "DELETED")

    // 1. Search Query (debounced)
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase()
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          m.phone.includes(q) ||
          m.employeeCode.toLowerCase().includes(q)
      )
    }

    // 2. Status Filter
    if (statusFilter !== "All") {
      list = list.filter((m) => m.status === statusFilter)
    }

    // 3. Store Filter
    if (storeFilter !== "All") {
      list = list.filter((m) => m.storeId === storeFilter)
    }

    // 5. Date Joined Filter
    if (startDate) {
      list = list.filter((m) => m.joinedDate >= startDate)
    }
    if (endDate) {
      list = list.filter((m) => m.joinedDate <= endDate)
    }

    // Sorting
    list.sort((a, b) => {
      let valA = a[sortKey]
      let valB = b[sortKey]

      if (sortKey === "name") {
        return sortOrder === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA)
      }

      if (sortKey === "store") {
        const storeA = stores.find((s) => s._id === a.storeId)?.storeName || ""
        const storeB = stores.find((s) => s._id === b.storeId)?.storeName || ""
        return sortOrder === "asc"
          ? storeA.localeCompare(storeB)
          : storeB.localeCompare(storeA)
      }

      return 0
    })

    // Pagination
    setTotalCount(list.length)
    const startIndex = (page - 1) * limit
    const paginatedList = list.slice(startIndex, startIndex + limit)

    setFilteredManagers(paginatedList)
    setKpis({
      totalManagers: managers.length,
      activeManagers: managers.filter(m => m.status === 'Active' || m.status === 'ACTIVE').length,
      onLeaveManagers: managers.filter(m => m.status === 'On Leave' || m.status === 'ON_LEAVE').length,
      suspendedManagers: managers.filter(m => m.status === 'Suspended' || m.status === 'SUSPENDED').length
    })
    setLoading(false)
  }, [managers, debouncedSearch, statusFilter, storeFilter, startDate, endDate, sortKey, sortOrder, page, limit, stores])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [mgrRes, storeRes] = await Promise.all([
        adminAPI.getStoreManagers(),
        adminAPI.getStores()
      ])
      if (mgrRes?.data?.success) {
        setManagers(mgrRes.data.data.map(m => ({ ...m, id: m._id })))
      }
      if (storeRes?.data?.success) {
        let storesArray = []
        const sData = storeRes.data.data
        if (Array.isArray(sData)) storesArray = sData
        else if (sData && Array.isArray(sData.stores)) storesArray = sData.stores
        else if (Array.isArray(storeRes.data)) storesArray = storeRes.data
        setStores(storesArray)
      }
    } catch (error) {
      console.error("Failed to fetch data:", error)
      showToast("Failed to fetch data", "error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    processData()
  }, [processData])

  // Real-time WebSocket Simulator (Interval updates) - Removed

  // Sort helper
  const handleSort = (key) => {
    const isAsc = sortKey === key && sortOrder === "asc"
    setSortKey(key)
    setSortOrder(isAsc ? "desc" : "asc")
  }

  // Export PDF
  const handleExportPDF = () => {
    const doc = new jsPDF()
    doc.text("Store Managers Report", 14, 15)
    
    const tableColumn = ["Employee ID", "Name", "Email", "Phone", "Store", "Joined", "Status", "Salary"]
    const tableRows = []

    managers
      .filter((m) => m.status !== "DELETED")
      .forEach((m) => {
        const store = stores.find((s) => s._id === m.storeId)?.storeName || "Not Assigned"
        
        // Safe extraction
        const salary = m.salary || m.personalDetails?.salary || 0
        const dateStr = m.joinedDate ? new Date(m.joinedDate).toLocaleDateString() : "N/A"

        const rowData = [
          m.employeeCode || "N/A",
          m.name || "N/A",
          m.email || "N/A",
          m.phone || "N/A",
          store,
          dateStr,
          m.status || "Unknown",
          `Rs ${salary}`
        ]
        tableRows.push(rowData)
      })

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      theme: 'grid',
      styles: { fontSize: 8 }
    })

    doc.save(`Store_Managers_${new Date().toISOString().split("T")[0]}.pdf`)
    showToast("PDF report exported successfully.")
  }

  const handleResetFilters = () => {
    setSearchVal("")
    setStatusFilter("All")
    setStoreFilter("All")
    setStartDate("")
    setEndDate("")
    setPage(1)
  }

  // MODAL/DRAWER CALLBACK IMPLEMENTATIONS

  // Add / Edit manager submit
  const handleAddEditConfirm = async (payload) => {
    try {
      if (selectedManager) {
        // Edit mode
        const res = await adminAPI.updateStoreManager(selectedManager.id, payload)
        if (res?.data?.success) {
          showToast("Store Manager Profile Updated Successfully")
          fetchData()
        }
      } else {
        // Add mode
        const res = await adminAPI.createStoreManager(payload)
        if (res?.data?.success) {
          showToast("Store Manager Created Successfully")
          fetchData()
        }
      }
      setIsAddEditOpen(false)
      setSelectedManager(null)
    } catch (error) {
      console.error("Error saving manager:", error)
      let errorMsg = error.response?.data?.message || error.message || "Failed to save manager"
      
      // Provide user-friendly duplicate key errors
      if (errorMsg.includes("E11000 duplicate key error")) {
        if (errorMsg.includes("mobile")) errorMsg = "This phone number is already registered.";
        else if (errorMsg.includes("email")) errorMsg = "This email is already registered.";
        else if (errorMsg.includes("employeeCode")) errorMsg = "This Employee ID is already in use.";
        else errorMsg = "A manager with these details already exists.";
      }
      
      showToast(errorMsg, "warning")
    }
  }

  // Assign store transfer submit
  const handleAssignStoreConfirm = async (managerId, newStoreId, reason) => {
    try {
      const res = await adminAPI.updateStoreManager(managerId, { storeId: newStoreId })
      if (res?.data?.success) {
        showToast("Store assignment transfer completed successfully")
        fetchData()
      }
    } catch (error) {
      showToast("Failed to assign store", "warning")
    } finally {
      setIsAssignStoreOpen(false)
      setSelectedManager(null)
    }
  }

  // Permissions credentials update
  const handlePermissionsConfirm = async (managerId, updatedPermissions) => {
    try {
      const res = await adminAPI.updateStoreManager(managerId, { permissions: updatedPermissions })
      if (res?.data?.success) {
        showToast("Manager credentials updated successfully")
        fetchData()
      }
    } catch (error) {
      showToast("Failed to update credentials", "warning")
    } finally {
      setIsPermissionsOpen(false)
      setSelectedManager(null)
    }
  }

  // Suspension submit
  const handleSuspendConfirm = async (managerId, details) => {
    try {
      const res = await adminAPI.updateStoreManager(managerId, { status: "Suspended" })
      if (res?.data?.success) {
        showToast("Manager profile suspended immediately")
        fetchData()
      }
    } catch (error) {
      showToast("Failed to suspend manager", "warning")
    } finally {
      setIsSuspendOpen(false)
      setSelectedManager(null)
    }
  }

  // Soft Delete confirm
  const handleDeleteConfirm = async (managerId) => {
    try {
      const res = await adminAPI.deleteStoreManager(managerId)
      if (res?.data?.success) {
        showToast("Store Manager profile deleted", "warning")
        fetchData()
      }
    } catch (error) {
      showToast("Failed to delete manager", "warning")
    } finally {
      setIsDeleteOpen(false)
      setSelectedManager(null)
    }
  }

  return (
    <div className="px-4 pb-4 pt-4 max-w-7xl mx-auto space-y-4 text-zinc-900 dark:text-zinc-100">
      
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">Store Managers</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Manage store managers, assignments, credentials, attendance, and metrics logs.</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => { setSelectedManager(null); setIsAddEditOpen(true); }}
            className="flex items-center gap-1 px-3 py-2 text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-xl text-xs font-bold shadow-md shadow-[var(--primary)]/10 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            Add Manager
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1 px-3 py-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-950 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export PDF
          </button>
          <button
            onClick={fetchData}
            className="p-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-950 rounded-xl transition-colors cursor-pointer"
            title="Refresh Grid"
          >
            <RefreshCw className="w-4 h-4 text-zinc-500" />
          </button>
        </div>
      </div>

      {/* KPI CARDS SECTION */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Managers", val: kpis.totalManagers, sub: "Registered", icon: Users, color: "text-[var(--primary)] bg-[var(--primary)]/5" },
          { label: "Active Managers", val: kpis.activeManagers, sub: "Currently active", icon: UserCheck, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20" },
          { label: "On Leave", val: kpis.onLeaveManagers, sub: "On approved leave", icon: CalendarDays, color: "text-amber-600 bg-amber-50 dark:bg-amber-950/20" },
          { label: "Suspended", val: kpis.suspendedManagers, sub: "Profiles suspended", icon: Shield, color: "text-rose-600 bg-rose-50 dark:bg-rose-950/20" }
        ].map((card, i) => (
          <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 rounded-xl p-3 shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[85px] hover:scale-[1.02] transition-transform duration-300">
            <div>
              <span className="block text-[8px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-0.5">
                {card.label}
              </span>
              <span className="text-base font-black text-zinc-900 dark:text-white">
                {card.val}
              </span>
            </div>
            <div className="flex items-center justify-between mt-1 pt-1 border-t border-zinc-50 dark:border-zinc-850/50 text-[9px] font-bold text-zinc-400">
              <span>{card.sub}</span>
              <div className={`p-1 rounded ${card.color}`}>
                <card.icon className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* FILTER BAR */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 rounded-xl p-3 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Search bar */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search manager name, email, phone, employee code..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[var(--primary)] transition-all placeholder-zinc-400"
            />
          </div>

          {/* Status Dropdown */}
          <div className="w-[120px]">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-bold focus:outline-none"
            >
              <option value="All">Status: All</option>
              <option value="Active">Active</option>
              <option value="On Leave">On Leave</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>

          {/* Store Dropdown */}
          <div className="w-[160px]">
            <select
              value={storeFilter}
              onChange={(e) => { setStoreFilter(e.target.value); setPage(1); }}
              className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-bold focus:outline-none"
            >
              <option value="All">Store Outlet: All</option>
              {stores.map((s) => (
                <option key={s._id} value={s._id}>{s.storeName}</option>
              ))}
            </select>
          </div>

          {/* Date Picker Input */}
          <div className="flex items-center gap-1">
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-[10px] font-bold focus:outline-none text-zinc-500"
              title="Joined Start Date"
            />
            <span className="text-zinc-400 text-xs">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-[10px] font-bold focus:outline-none text-zinc-500"
              title="Joined End Date"
            />
          </div>

          <button
            onClick={handleResetFilters}
            className="px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-50 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            Reset Filters
          </button>

        </div>
      </div>

      {/* MANAGERS TABLE */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 rounded-xl overflow-hidden shadow-xs">
        
        {loading ? (
          /* Table Loader Skeleton */
          <div className="p-6 space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex gap-4 items-center">
                <div className="h-7 w-7 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                <div className="h-4 w-1/4 bg-zinc-300 dark:bg-zinc-700 rounded animate-pulse" />
                <div className="h-4 w-1/6 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                <div className="h-4 w-16 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                <div className="h-4 w-20 bg-zinc-300 dark:bg-zinc-700 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : filteredManagers.length === 0 ? (
          /* EMPTY STATE */
          <div className="py-16 text-center space-y-4">
            <div className="w-20 h-20 mx-auto bg-zinc-50 dark:bg-zinc-950 rounded-full flex items-center justify-center border text-[var(--primary)] opacity-70">
              <Users className="w-9 h-9" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-zinc-850 dark:text-zinc-200 uppercase tracking-wider">No Store Managers Found</h3>
              <p className="text-xs text-zinc-450 dark:text-zinc-550 mt-1">There are no store managers fitting your current filter constraints.</p>
            </div>
            <button
              onClick={() => { setSelectedManager(null); setIsAddEditOpen(true); }}
              className="px-4 py-2 bg-[var(--primary)] text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
            >
              Add Store Manager
            </button>
          </div>
        ) : (
          /* TABLE */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-950/50 border-b border-zinc-100 dark:border-zinc-850 text-[9px] font-bold text-zinc-450 dark:text-zinc-400 uppercase tracking-widest">
                  <th className="px-3 py-2.5">Profile</th>
                  <th className="px-3 py-2.5 cursor-pointer select-none" onClick={() => handleSort("employeeCode")}>Employee ID</th>
                  <th className="px-3 py-2.5 cursor-pointer select-none" onClick={() => handleSort("name")}>Manager Name</th>
                  <th className="px-3 py-2.5">Email</th>
                  <th className="px-3 py-2.5">Phone</th>
                  <th className="px-3 py-2.5 cursor-pointer select-none" onClick={() => handleSort("store")}>Assigned Store</th>
                  <th className="px-3 py-2.5">Joined Date</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 text-[11px] text-zinc-700 dark:text-zinc-350">
                {filteredManagers.map((mgr) => {
                  const store = stores.find((s) => s._id === mgr.storeId)
                  const dateStr = mgr.joinedDate ? new Date(mgr.joinedDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "N/A"

                  return (
                    <tr key={mgr.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/25 group">
                      <td className="px-3 py-2">
                        <img
                          src={mgr.profileImage || "https://via.placeholder.com/150"}
                          alt={mgr.name}
                          className="w-7 h-7 rounded-lg object-cover border border-zinc-200 dark:border-zinc-800"
                        />
                      </td>
                      <td className="px-3 py-2 font-bold text-zinc-900 dark:text-white">{mgr.employeeCode}</td>
                      <td className="px-3 py-2 font-black text-[var(--primary)] cursor-pointer hover:underline" onClick={() => { setSelectedManager(mgr); setDrawerTab("profile"); setIsViewOpen(true); }}>
                        {mgr.name}
                      </td>
                      <td className="px-3 py-2 font-semibold">{mgr.email}</td>
                      <td className="px-3 py-2 font-semibold">{mgr.phone}</td>
                      <td className="px-3 py-2 font-semibold">{store ? store.storeName : <span className="text-zinc-400 italic">Not Assigned</span>}</td>
                      <td className="px-3 py-2 font-semibold text-zinc-500">{dateStr}</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          (mgr.status === "Active" || mgr.status === "ACTIVE")
                            ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-650"
                            : (mgr.status === "On Leave" || mgr.status === "ON_LEAVE")
                              ? "bg-amber-50 dark:bg-amber-950/20 text-amber-650"
                              : "bg-red-50 dark:bg-red-950/20 text-red-650"
                        }`}>
                          {mgr.status}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => { setSelectedManager(mgr); setDrawerTab("profile"); setIsViewOpen(true); }}
                            className="p-1.5 rounded-md text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors cursor-pointer"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setSelectedManager(mgr); setIsAddEditOpen(true); }}
                            className="p-1.5 rounded-md text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setSelectedManager(mgr); setIsDeleteOpen(true); }}
                            className="p-1.5 rounded-md text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION FOOTER */}
        {!loading && filteredManagers.length > 0 && (
          <div className="flex items-center justify-between px-3 py-2.5 border-t border-zinc-100 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-950/25 text-xs text-zinc-500 font-bold select-none">
            <div className="flex items-center gap-4">
              <span>Showing {Math.min(totalCount, (page - 1) * limit + 1)} to {Math.min(totalCount, page * limit)} of {totalCount} records</span>
              <div className="flex items-center gap-1.5">
                <span>Rows per page:</span>
                <select
                  value={limit}
                  onChange={(e) => { setLimit(parseInt(e.target.value)); setPage(1); }}
                  className="px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 font-bold focus:outline-none"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="p-1 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-950 disabled:opacity-40 disabled:cursor-not-allowed transition-colors rounded-lg cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span>Page {page} of {Math.ceil(totalCount / limit) || 1}</span>
              <button
                onClick={() => setPage((prev) => Math.min(prev + 1, Math.ceil(totalCount / limit)))}
                disabled={page >= Math.ceil(totalCount / limit)}
                className="p-1 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-950 disabled:opacity-40 disabled:cursor-not-allowed transition-colors rounded-lg cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* DETAILED MODALS & DRAWERS */}

      <AddEditManagerModal
        isOpen={isAddEditOpen}
        onClose={() => { setIsAddEditOpen(false); setSelectedManager(null); }}
        onConfirm={handleAddEditConfirm}
        manager={selectedManager}
      />

      <ViewManagerDrawer
        isOpen={isViewOpen}
        onClose={() => { setIsViewOpen(false); setSelectedManager(null); }}
        manager={selectedManager}
        defaultTab={drawerTab}
        stores={stores}
      />

      <AssignStoreModal
        isOpen={isAssignStoreOpen}
        onClose={() => { setIsAssignStoreOpen(false); setSelectedManager(null); }}
        onConfirm={handleAssignStoreConfirm}
        manager={selectedManager}
        stores={stores}
      />

      <AttendanceModal
        isOpen={isAttendanceOpen}
        onClose={() => { setIsAttendanceOpen(false); setSelectedManager(null); }}
        manager={selectedManager}
      />

      <PerformanceModal
        isOpen={isPerformanceOpen}
        onClose={() => { setIsPerformanceOpen(false); setSelectedManager(null); }}
        manager={selectedManager}
      />

      <PermissionsModal
        isOpen={isPermissionsOpen}
        onClose={() => { setIsPermissionsOpen(false); setSelectedManager(null); }}
        onConfirm={handlePermissionsConfirm}
        manager={selectedManager}
      />

      <SuspendManagerModal
        isOpen={isSuspendOpen}
        onClose={() => { setIsSuspendOpen(false); setSelectedManager(null); }}
        onConfirm={handleSuspendConfirm}
        manager={selectedManager}
      />

      <DeleteManagerModal
        isOpen={isDeleteOpen}
        onClose={() => { setIsDeleteOpen(false); setSelectedManager(null); }}
        onConfirm={handleDeleteConfirm}
        manager={selectedManager}
      />

      {/* Floating Success Toast Alerts */}
      {toast && (
        <div className={`fixed bottom-4 right-4 z-50 px-5 py-3 rounded-2xl border shadow-2xl flex items-center gap-2 animate-slide-in-right ${
          toast.type === "warning"
            ? "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-250"
            : toast.type === "info"
              ? "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-250 animate-pulse"
              : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-650 dark:text-emerald-400 border-emerald-250"
        }`}>
          <span className="text-xs font-bold">{toast.message}</span>
        </div>
      )}

    </div>
  )
}
