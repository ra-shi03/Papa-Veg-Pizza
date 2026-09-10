import React, { useState, useEffect, useCallback } from "react"
import {
  Search, Plus, Download, RefreshCw, MoreVertical, Star,
  SlidersHorizontal, Trash2, Eye, Shield, Clock, Calendar,
  ChevronLeft, ChevronRight, TrendingUp, Users,
  AlertCircle, Building2, Flame, Utensils, CheckCircle2,
  CalendarDays, Zap, Phone, Award
} from "lucide-react"

// Import subcomponents
import AddEditKitchenStaffModal from "./components/AddEditKitchenStaffModal"
import ViewKitchenStaffDrawer from "./components/ViewKitchenStaffDrawer"
import AssignStoreModal from "./components/AssignStoreModal"
import KitchenAttendanceModal from "./components/KitchenAttendanceModal"
import KitchenPerformanceModal from "./components/KitchenPerformanceModal"
import SuspendKitchenStaffModal from "./components/SuspendKitchenStaffModal"
import DeleteKitchenStaffModal from "./components/DeleteKitchenStaffModal"
import ShiftScheduleModal from "./components/ShiftScheduleModal"

// Import Mock Data
import { initialKitchenStaff, initialStores, getKitchenDashboardStats } from "./mockManagersData"

export default function KitchenStaff() {
  // Main Data States
  const [staffList, setStaffList] = useState(initialKitchenStaff)
  const [kpis, setKpis] = useState(getKitchenDashboardStats(initialKitchenStaff))

  // Table state
  const [filteredStaff, setFilteredStaff] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)

  // Filter States
  const [searchVal, setSearchVal] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [storeFilter, setStoreFilter] = useState("All")
  const [shiftFilter, setShiftFilter] = useState("All")
  const [experienceFilter, setExperienceFilter] = useState("All")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  // Pagination & Sorting
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [sortKey, setSortKey] = useState("name")
  const [sortOrder, setSortOrder] = useState("asc") // "asc" | "desc"

  // Modals & Drawers Control
  const [selectedStaff, setSelectedStaff] = useState(null)
  const [activeMenuId, setActiveMenuId] = useState(null)

  const [isAddEditOpen, setIsAddEditOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isAssignStoreOpen, setIsAssignStoreOpen] = useState(false)
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false)
  const [isPerformanceOpen, setIsPerformanceOpen] = useState(false)
  const [isSuspendOpen, setIsSuspendOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isShiftScheduleOpen, setIsShiftScheduleOpen] = useState(false)
  const [drawerTab, setDrawerTab] = useState("profile")

  // Toast notifications
  const [toast, setToast] = useState(null)

  const showToast = (message, type = "success") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
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
    let list = [...staffList]

    // Soft-delete filter
    list = list.filter((s) => s.status !== "DELETED")

    // 1. Search Query (debounced)
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase()
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.phone.includes(q) ||
          s.employeeCode.toLowerCase().includes(q)
      )
    }

    // 2. Status Filter
    if (statusFilter !== "All") {
      list = list.filter((s) => s.status === statusFilter)
    }

    // 3. Store Filter
    if (storeFilter !== "All") {
      list = list.filter((s) => s.storeId === storeFilter)
    }

    // 4. Shift Filter
    if (shiftFilter !== "All") {
      list = list.filter((s) => s.shiftType === shiftFilter)
    }

    // 5. Experience Filter
    if (experienceFilter !== "All") {
      list = list.filter((s) => {
        const expNum = parseFloat(s.experience.split(" ")[0])
        if (experienceFilter === "0-1 years") return expNum <= 1
        if (experienceFilter === "1-3 years") return expNum > 1 && expNum <= 3
        if (experienceFilter === "3-5 years") return expNum > 3 && expNum <= 5
        if (experienceFilter === "5+ years") return expNum > 5
        return true
      })
    }

    // 6. Date Joined Filter
    if (startDate) {
      list = list.filter((s) => s.joinedDate >= startDate)
    }
    if (endDate) {
      list = list.filter((s) => s.joinedDate <= endDate)
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

      if (sortKey === "employeeCode") {
        return sortOrder === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA)
      }

      if (sortKey === "store") {
        const storeA = initialStores.find((s) => s._id === a.storeId)?.storeName || ""
        const storeB = initialStores.find((s) => s._id === b.storeId)?.storeName || ""
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

    setFilteredStaff(paginatedList)
    setKpis(getKitchenDashboardStats(staffList))
    setLoading(false)
  }, [staffList, debouncedSearch, statusFilter, storeFilter, shiftFilter, experienceFilter, startDate, endDate, sortKey, sortOrder, page, limit])

  useEffect(() => {
    processData()
  }, [processData])

  // Real-time WebSocket Simulator (Interval updates)
  useEffect(() => {
    const timer = setInterval(() => {
      const activeList = staffList.filter((s) => s.status === "Active")
      if (activeList.length === 0) return

      const randomIndex = Math.floor(Math.random() * activeList.length)
      const randomStaff = activeList[randomIndex]

      const events = [
        `WebSocket: ${randomStaff.name} prepared 12" Cheese Overloaded Pizza in 9.2 mins (Quality: 98%)`,
        `WebSocket: KDS Sync - Shift timers verified for ${randomStaff.name}`,
        `WebSocket: Inventory usage audit completed by ${randomStaff.name} at Oven Station`,
        `WebSocket: Temperature threshold alert resolved by ${randomStaff.name}`
      ]

      const randomEvent = events[Math.floor(Math.random() * events.length)]
      showToast(randomEvent, "info")
    }, 15000)

    return () => clearInterval(timer)
  }, [staffList])

  // Sort helper
  const handleSort = (key) => {
    const isAsc = sortKey === key && sortOrder === "asc"
    setSortKey(key)
    setSortOrder(isAsc ? "desc" : "asc")
  }

  // Export CSV
  const handleExportCSV = () => {
    const headers = "Employee Code,Name,Email,Phone,Store Assignment,Joined Date,Status,Experience,Shift Type,Monthly Salary\n"
    const rows = staffList
      .filter((s) => s.status !== "DELETED")
      .map((s) => {
        const store = initialStores.find((st) => st._id === s.storeId)?.storeName || "N/A"
        return `"${s.employeeCode}","${s.name}","${s.email}","${s.phone}","${store}","${s.joinedDate}","${s.status}","${s.experience}","${s.shiftType}","₹${s.personalDetails?.salary || 0}"`
      })
      .join("\n")

    const blob = new Blob([headers + rows], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.setAttribute("href", url)
    a.setAttribute("download", `Kitchen_Staff_${new Date().toISOString().split("T")[0]}.csv`)
    a.click()
    showToast("CSV report exported successfully.")
  }

  const handleResetFilters = () => {
    setSearchVal("")
    setStatusFilter("All")
    setStoreFilter("All")
    setShiftFilter("All")
    setExperienceFilter("All")
    setStartDate("")
    setEndDate("")
    setPage(1)
  }

  // MODAL/DRAWER CALLBACK IMPLEMENTATIONS

  // Add / Edit staff submit
  const handleAddEditConfirm = (payload) => {
    if (selectedStaff) {
      // Edit mode
      setStaffList((prev) =>
        prev.map((s) =>
          s.id === selectedStaff.id
            ? {
              ...s,
              ...payload,
              personalDetails: {
                ...s.personalDetails,
                address: payload.address,
                emergencyContact: payload.emergencyContact,
                salary: payload.salary
              }
            }
            : s
        )
      )
      showToast("Kitchen Staff Profile Updated Successfully")
    } else {
      // Add mode
      const newStaff = {
        id: `kit-${Date.now()}`,
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        employeeCode: payload.employeeCode,
        joinedDate: payload.joinedDate,
        status: payload.status,
        experience: "1.0 years", // Default start
        storeId: payload.storeId,
        shiftType: payload.shiftType,
        weeklyDays: payload.weeklyDays,
        profileImage: payload.profileImage,
        personalDetails: {
          address: payload.address,
          emergencyContact: payload.emergencyContact,
          salary: payload.salary
        }
      }
      setStaffList((prev) => [newStaff, ...prev])
      showToast("Kitchen Staff Registered & Onboarded Successfully")
    }
    setIsAddEditOpen(false)
    setSelectedStaff(null)
  }

  // Assign store transfer submit
  const handleAssignStoreConfirm = (staffId, newStoreId, reason) => {
    setStaffList((prev) =>
      prev.map((s) => (s.id === staffId ? { ...s, storeId: newStoreId } : s))
    )
    showToast("Store assignment transfer completed successfully")
    setIsAssignStoreOpen(false)
    setSelectedStaff(null)
  }

  // Shift schedule update
  const handleShiftConfirm = (staffId, updatedShift) => {
    setStaffList((prev) =>
      prev.map((s) => (s.id === staffId ? { ...s, ...updatedShift } : s))
    )
    showToast("Shift schedule updated and synchronised with KDS terminals")
    setIsShiftScheduleOpen(false)
    setSelectedStaff(null)
  }

  // Suspension submit
  const handleSuspendConfirm = (staffId, details) => {
    setStaffList((prev) =>
      prev.map((s) => (s.id === staffId ? { ...s, status: "Suspended" } : s))
    )
    showToast("Kitchen Staff account suspended immediately")
    setIsSuspendOpen(false)
    setSelectedStaff(null)
  }

  // Soft Delete confirm
  const handleDeleteConfirm = (staffId) => {
    setStaffList((prev) =>
      prev.map((s) => (s.id === staffId ? { ...s, status: "DELETED" } : s))
    )
    showToast("Kitchen Staff profile deleted", "warning")
    setIsDeleteOpen(false)
    setSelectedStaff(null)
  }

  return (
    <div className="px-4 pb-4 pt-4 max-w-7xl mx-auto space-y-4 text-zinc-900 dark:text-zinc-100">

      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">Kitchen Staff</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Manage kitchen employees, shifts schedule, performance metrics, and compliance audits.</p>
        </div>
        <div className="flex items-center gap-1.5">
          {/* <button
            onClick={() => { setSelectedStaff(null); setIsAddEditOpen(true); }}
            className="flex items-center gap-1 px-3 py-2 text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-xl text-xs font-bold shadow-md shadow-[var(--primary)]/10 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            Add Staff
          </button> */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1 px-3 py-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-950 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            onClick={processData}
            className="p-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-950 rounded-xl transition-colors cursor-pointer"
            title="Refresh Grid"
          >
            <RefreshCw className="w-4 h-4 text-zinc-500" />
          </button>
        </div>
      </div>

      {/* KPI CARDS SECTION */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {[
          { label: "Total Staff", val: kpis.totalStaff, sub: `${kpis.totalStaff} registered`, icon: Users, color: "text-[var(--primary)] bg-[var(--primary)]/5" },
          { label: "Active Staff", val: kpis.activeStaff, sub: "Currently active", icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20" },
          { label: "Morning Shift", val: kpis.onShift, sub: "🌅 In kitchen", icon: Flame, color: "text-amber-600 bg-amber-50 dark:bg-amber-950/20" },
          { label: "Avg Prep Speed", val: `${kpis.avgCookingTime}m`, sub: "Target: < 12 mins", icon: Clock, color: "text-blue-600 bg-blue-50 dark:bg-blue-950/20" },
          { label: "Pizzas Today", val: kpis.pizzasPreparedToday, sub: "Across all hubs", icon: Utensils, color: "text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20" },
          { label: "Attendance MTD", val: `${kpis.attendancePercentage}%`, sub: "Average ledger rate", icon: TrendingUp, color: "text-purple-650 bg-purple-50 dark:bg-purple-950/20" }
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
              placeholder="Search staff name, email, phone, employee code..."
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
              {initialStores.map((s) => (
                <option key={s._id} value={s._id}>{s.storeName}</option>
              ))}
            </select>
          </div>

          {/* Shift Dropdown */}
          <div className="w-[120px]">
            <select
              value={shiftFilter}
              onChange={(e) => { setShiftFilter(e.target.value); setPage(1); }}
              className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-bold focus:outline-none"
            >
              <option value="All">Shift: All</option>
              <option value="Morning">Morning</option>
              <option value="Afternoon">Afternoon</option>
              <option value="Night">Night</option>
            </select>
          </div>

          {/* Experience Filter */}
          <div className="w-[130px]">
            <select
              value={experienceFilter}
              onChange={(e) => { setExperienceFilter(e.target.value); setPage(1); }}
              className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-bold focus:outline-none"
            >
              <option value="All">Experience: All</option>
              <option value="0-1 years">0-1 years</option>
              <option value="1-3 years">1-3 years</option>
              <option value="3-5 years">3-5 years</option>
              <option value="5+ years">5+ years</option>
            </select>
          </div>

          {/* Date Picker Input */}
          <div className="flex items-center gap-1">
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-[10px] font-bold focus:outline-none text-zinc-505"
              title="Joined Start Date"
            />
            <span className="text-zinc-400 text-xs">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-[10px] font-bold focus:outline-none text-zinc-550"
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

      {/* KITCHEN STAFF TABLE */}
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
        ) : filteredStaff.length === 0 ? (
          /* EMPTY STATE */
          <div className="py-16 text-center space-y-4">
            <div className="w-20 h-20 mx-auto bg-zinc-50 dark:bg-zinc-950 rounded-full flex items-center justify-center border text-[var(--primary)] opacity-70">
              <Utensils className="w-9 h-9" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-zinc-850 dark:text-zinc-200 uppercase tracking-wider">No Kitchen Staff Found</h3>
              <p className="text-xs text-zinc-450 dark:text-zinc-550 mt-1">There are no kitchen employees fitting your current filter constraints.</p>
            </div>
            <button
              onClick={() => { setSelectedStaff(null); setIsAddEditOpen(true); }}
              className="px-4 py-2 bg-[var(--primary)] text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
            >
              Add Kitchen Staff
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
                  <th className="px-3 py-2.5 cursor-pointer select-none" onClick={() => handleSort("name")}>Staff Name</th>
                  <th className="px-3 py-2.5 cursor-pointer select-none" onClick={() => handleSort("store")}>Assigned Store</th>
                  <th className="px-3 py-2.5">Shift</th>
                  <th className="px-3 py-2.5 text-center">Avg Prep Speed</th>
                  <th className="px-3 py-2.5 text-center">Quality Rating</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 text-[11px] text-zinc-700 dark:text-zinc-350">
                {filteredStaff.map((staff) => {
                  const store = initialStores.find((s) => s._id === staff.storeId)

                  // Mock speed and rating for display from employee seed
                  const seed = parseInt(staff.id.split("-")[1] || 1)
                  const displaySpeed = (8.5 + (seed % 6) * 0.7).toFixed(1)
                  const displayQuality = 90 + (seed % 9)

                  return (
                    <tr key={staff.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/25 group">
                      <td className="px-3 py-2">
                        <img
                          src={staff.profileImage}
                          alt={staff.name}
                          className="w-7 h-7 rounded-lg object-cover border border-zinc-200 dark:border-zinc-800"
                        />
                      </td>
                      <td className="px-3 py-2 font-bold text-zinc-900 dark:text-white">{staff.employeeCode}</td>
                      <td className="px-3 py-2 font-black text-[var(--primary)] cursor-pointer hover:underline" onClick={() => { setSelectedStaff(staff); setDrawerTab("profile"); setIsViewOpen(true); }}>
                        {staff.name}
                      </td>
                      <td className="px-3 py-2 font-semibold">{store ? store.storeName : <span className="text-zinc-400 italic">Not Assigned</span>}</td>
                      <td className="px-3 py-2 font-semibold">{staff.shiftType} Shift</td>
                      <td className="px-3 py-2 text-center font-bold text-zinc-800 dark:text-zinc-250">
                        {displaySpeed} mins
                      </td>
                      <td className="px-3 py-2 text-center">
                        <div className="flex items-center justify-center gap-0.5 font-black text-emerald-600">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          <span>{displayQuality}%</span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${staff.status === "Active"
                            ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-650"
                            : staff.status === "On Leave"
                              ? "bg-amber-50 dark:bg-amber-950/20 text-amber-650"
                              : "bg-red-50 dark:bg-red-950/20 text-red-650"
                          }`}>
                          {staff.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right relative">
                        <button
                          onClick={() => setActiveMenuId(activeMenuId === staff.id ? null : staff.id)}
                          className="p-1 rounded-md text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Floating actions */}
                        {activeMenuId === staff.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setActiveMenuId(null)} />
                            <div className="absolute right-4 mt-1 w-44 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-xl shadow-xl z-20 overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-850 text-left">
                              <div className="py-1">
                                <button
                                  onClick={() => { setSelectedStaff(staff); setDrawerTab("profile"); setIsViewOpen(true); setActiveMenuId(null); }}
                                  className="w-full px-4 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-850 flex items-center gap-1.5"
                                >
                                  <Eye className="w-3.5 h-3.5 text-zinc-400" />
                                  View Details
                                </button>
                                <button
                                  onClick={() => { setSelectedStaff(staff); setIsAddEditOpen(true); setActiveMenuId(null); }}
                                  className="w-full px-4 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-850 flex items-center gap-1.5"
                                >
                                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                                  Edit Profile
                                </button>
                                <button
                                  onClick={() => { setSelectedStaff(staff); setIsAssignStoreOpen(true); setActiveMenuId(null); }}
                                  className="w-full px-4 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-850 flex items-center gap-1.5"
                                >
                                  <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                                  Assign Store
                                </button>
                              </div>
                              <div className="py-1">
                                <button
                                  onClick={() => { setSelectedStaff(staff); setIsShiftScheduleOpen(true); setActiveMenuId(null); }}
                                  className="w-full px-4 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-855 flex items-center gap-1.5"
                                >
                                  <CalendarDays className="w-3.5 h-3.5 text-zinc-400" />
                                  Shift Schedule
                                </button>
                                <button
                                  onClick={() => { setSelectedStaff(staff); setIsAttendanceOpen(true); setActiveMenuId(null); }}
                                  className="w-full px-4 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-850 flex items-center gap-1.5"
                                >
                                  <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                                  Attendance Ledger
                                </button>
                                <button
                                  onClick={() => { setSelectedStaff(staff); setIsPerformanceOpen(true); setActiveMenuId(null); }}
                                  className="w-full px-4 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-850 flex items-center gap-1.5"
                                >
                                  <TrendingUp className="w-3.5 h-3.5 text-zinc-400" />
                                  Performance Stats
                                </button>
                              </div>
                              <div className="py-1">
                                <button
                                  onClick={() => { setSelectedStaff(staff); setIsSuspendOpen(true); setActiveMenuId(null); }}
                                  className="w-full px-4 py-1.5 text-xs text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-955/20 flex items-center gap-1.5 font-semibold"
                                >
                                  <Shield className="w-3.5 h-3.5 text-amber-500" />
                                  Suspend Staff
                                </button>
                                <button
                                  onClick={() => { setSelectedStaff(staff); setIsDeleteOpen(true); setActiveMenuId(null); }}
                                  className="w-full px-4 py-1.5 text-xs text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center gap-1.5 font-semibold"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                  Delete Profile
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION FOOTER */}
        {!loading && filteredStaff.length > 0 && (
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

      <AddEditKitchenStaffModal
        isOpen={isAddEditOpen}
        onClose={() => { setIsAddEditOpen(false); setSelectedStaff(null); }}
        onConfirm={handleAddEditConfirm}
        staff={selectedStaff}
      />

      <ViewKitchenStaffDrawer
        isOpen={isViewOpen}
        onClose={() => { setIsViewOpen(false); setSelectedStaff(null); }}
        staff={selectedStaff}
        defaultTab={drawerTab}
      />

      {/* Reusing AssignStoreModal since the interfaces for staff & manager store assignment match */}
      <AssignStoreModal
        isOpen={isAssignStoreOpen}
        onClose={() => { setIsAssignStoreOpen(false); setSelectedStaff(null); }}
        onConfirm={handleAssignStoreConfirm}
        manager={selectedStaff}
      />

      <ShiftScheduleModal
        isOpen={isShiftScheduleOpen}
        onClose={() => { setIsShiftScheduleOpen(false); setSelectedStaff(null); }}
        onConfirm={handleShiftConfirm}
        staff={selectedStaff}
      />

      <KitchenAttendanceModal
        isOpen={isAttendanceOpen}
        onClose={() => { setIsAttendanceOpen(false); setSelectedStaff(null); }}
        staff={selectedStaff}
      />

      <KitchenPerformanceModal
        isOpen={isPerformanceOpen}
        onClose={() => { setIsPerformanceOpen(false); setSelectedStaff(null); }}
        staff={selectedStaff}
      />

      <SuspendKitchenStaffModal
        isOpen={isSuspendOpen}
        onClose={() => { setIsSuspendOpen(false); setSelectedStaff(null); }}
        onConfirm={handleSuspendConfirm}
        staff={selectedStaff}
      />

      <DeleteKitchenStaffModal
        isOpen={isDeleteOpen}
        onClose={() => { setIsDeleteOpen(false); setSelectedStaff(null); }}
        onConfirm={handleDeleteConfirm}
        staff={selectedStaff}
      />

      {/* Floating Success/Info Toast Alerts */}
      {toast && (
        <div className={`fixed bottom-4 right-4 z-50 px-5 py-3 rounded-2xl border shadow-2xl flex items-center gap-2 animate-slide-in-right ${toast.type === "warning"
            ? "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-250"
            : toast.type === "info"
              ? "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-250"
              : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-650 dark:text-emerald-400 border-emerald-250"
          }`}>
          <span className="text-xs font-bold">{toast.message}</span>
        </div>
      )}

    </div>
  )
}
