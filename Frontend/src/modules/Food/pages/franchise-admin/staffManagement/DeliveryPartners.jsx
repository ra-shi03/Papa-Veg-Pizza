import React, { useState, useEffect, useCallback } from "react"
import {
  Search, Plus, Download, Upload, RefreshCw, MoreVertical, Star,
  SlidersHorizontal, Trash2, Eye, Shield, Clock, Calendar,
  ChevronLeft, ChevronRight, TrendingUp, Users, AlertCircle,
  Building2, Truck, Wallet, Compass, CheckCircle2, ShieldAlert,
  Award, MessageSquare, FileSpreadsheet, Ban, UserCheck, AlertTriangle, Play, Pause
} from "lucide-react"

// Import subcomponents
import AddEditDeliveryPartnerModal from "./components/AddEditDeliveryPartnerModal"
import ViewDeliveryPartnerDrawer from "./components/ViewDeliveryPartnerDrawer"
import AssignStoreModal from "./components/AssignStoreModal"
import WalletModal from "./components/WalletModal"
import LiveRiderModal from "./components/LiveRiderModal"
import SuspendRiderModal from "./components/SuspendRiderModal"
import DeleteRiderModal from "./components/DeleteRiderModal"
import DocumentsModal from "./components/DocumentsModal"
import RiderPerformanceModal from "./components/RiderPerformanceModal"

// Import Mock Data
import { initialDeliveryPartners, initialStores, getDeliveryPartnerDashboardStats } from "./mockManagersData"

export default function DeliveryPartners() {
  // Main Data States
  const [riders, setRiders] = useState(initialDeliveryPartners)
  const [kpis, setKpis] = useState(getDeliveryPartnerDashboardStats(initialDeliveryPartners))
  const [filteredRiders, setFilteredRiders] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  
  // Debounced search and filters
  const [searchVal, setSearchVal] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [storeFilter, setStoreFilter] = useState("All")
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState("All")
  const [statusFilter, setStatusFilter] = useState("All")
  const [availabilityFilter, setAvailabilityFilter] = useState("All")
  const [ratingFilter, setRatingFilter] = useState("All")
  
  // Pagination & Sorting
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [sortKey, setSortKey] = useState("name")
  const [sortOrder, setSortOrder] = useState("asc") // "asc" | "desc"
  
  // Selection states (Bulk actions)
  const [selectedRiderIds, setSelectedRiderIds] = useState([])
  
  // Modals & Drawers Control
  const [selectedRider, setSelectedRider] = useState(null)
  const [activeMenuId, setActiveMenuId] = useState(null)
  
  const [isAddEditOpen, setIsAddEditOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isAssignStoreOpen, setIsAssignStoreOpen] = useState(false)
  const [isWalletOpen, setIsWalletOpen] = useState(false)
  const [isLiveOpen, setIsLiveOpen] = useState(false)
  const [isSuspendOpen, setIsSuspendOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isDocumentsOpen, setIsDocumentsOpen] = useState(false)
  const [isPerformanceOpen, setIsPerformanceOpen] = useState(false)
  
  const [drawerTab, setDrawerTab] = useState("profile")
  
  // Socket.IO simulator control
  const [socketRunning, setSocketRunning] = useState(true)

  // Toast notifications
  const [toast, setToast] = useState(null)

  const showToast = (message, type = "success") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4500)
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
    let list = [...riders]
    
    // Soft-delete filter
    list = list.filter((r) => r.status !== "DELETED")

    // 1. Search Query (debounced)
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase()
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          r.phone.includes(q) ||
          r.employeeCode.toLowerCase().includes(q) ||
          (r.vehicleNumber && r.vehicleNumber.toLowerCase().includes(q))
      )
    }

    // 2. Store Filter
    if (storeFilter !== "All") {
      list = list.filter((r) => r.storeId === storeFilter)
    }

    // 3. Vehicle Type Filter
    if (vehicleTypeFilter !== "All") {
      list = list.filter((r) => r.vehicleType === vehicleTypeFilter)
    }

    // 4. Status Filter
    if (statusFilter !== "All") {
      list = list.filter((r) => r.status === statusFilter)
    }

    // 5. Availability Filter
    if (availabilityFilter !== "All") {
      list = list.filter((r) => r.availability === availabilityFilter)
    }

    // 6. Rating Filter
    if (ratingFilter !== "All") {
      const ratingNum = parseInt(ratingFilter)
      list = list.filter((r) => Math.floor(r.rating) === ratingNum)
    }

    // Sorting
    list.sort((a, b) => {
      let valA = a[sortKey]
      let valB = b[sortKey]

      if (sortKey === "name" || sortKey === "employeeCode") {
        return sortOrder === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA)
      }

      if (sortKey === "rating" || sortKey === "ordersToday") {
        return sortOrder === "asc" ? valA - valB : valB - valA
      }

      return 0
    })

    // Pagination
    setTotalCount(list.length)
    const startIndex = (page - 1) * limit
    const paginatedList = list.slice(startIndex, startIndex + limit)

    setFilteredRiders(paginatedList)
    setKpis(getDeliveryPartnerDashboardStats(riders.filter(r => r.status !== "DELETED")))
    setLoading(false)
  }, [riders, debouncedSearch, storeFilter, vehicleTypeFilter, statusFilter, availabilityFilter, ratingFilter, sortKey, sortOrder, page, limit])

  useEffect(() => {
    processData()
  }, [processData])

  // Real-time WebSocket Simulator (Interval updates)
  useEffect(() => {
    if (!socketRunning) return

    const timer = setInterval(() => {
      const activeList = riders.filter((r) => r.status !== "DELETED" && r.status !== "Suspended")
      if (activeList.length === 0) return

      const randomIndex = Math.floor(Math.random() * activeList.length)
      const rider = activeList[randomIndex]

      const events = [
        {
          msg: `delivery_completed: ${rider.name} delivered order #ORD-${Math.floor(1000 + Math.random() * 9000)} successfully.`,
          type: "success",
          action: () => {
            setRiders(prev => prev.map(r => r.id === rider.id ? { ...r, ordersToday: r.ordersToday + 1 } : r))
          }
        },
        {
          msg: `delivery_partner_location_changed: ${rider.name} is moving along Palasia main road.`,
          type: "info",
          action: null
        },
        {
          msg: `wallet_updated: ₹45 credited to ${rider.name}'s wallet account.`,
          type: "success",
          action: null
        },
        {
          msg: `delivery_partner_offline: ${rider.name} is now Offline (Shift Finished).`,
          type: "warning",
          action: () => {
            setRiders(prev => prev.map(r => r.id === rider.id ? { ...r, status: "Offline", availability: "Unavailable" } : r))
          }
        },
        {
          msg: `delivery_partner_online: ${rider.name} is now Online (Available).`,
          type: "success",
          action: () => {
            // Find an offline rider to set online
            const offline = riders.find(r => r.status === "Offline")
            if (offline) {
              setRiders(prev => prev.map(r => r.id === offline.id ? { ...r, status: "Online", availability: "Available" } : r))
            }
          }
        }
      ]

      const randomEvent = events[Math.floor(Math.random() * events.length)]
      showToast(`[Socket] ${randomEvent.msg}`, randomEvent.type)
      if (randomEvent.action) {
        randomEvent.action()
      }
    }, 18000)

    return () => clearInterval(timer)
  }, [riders, socketRunning])

  const handleSort = (key) => {
    const isAsc = sortKey === key && sortOrder === "asc"
    setSortKey(key)
    setSortOrder(isAsc ? "desc" : "asc")
  }

  // Reset Filters
  const handleResetFilters = () => {
    setSearchVal("")
    setStoreFilter("All")
    setVehicleTypeFilter("All")
    setStatusFilter("All")
    setAvailabilityFilter("All")
    setRatingFilter("All")
    setPage(1)
    showToast("Filters reset successfully.")
  }

  // Export CSV
  const handleExportCSV = () => {
    const headers = "Rider ID,Name,Email,Phone,Store Assignment,Vehicle Type,Vehicle Number,Status,Availability,Rating,Orders Today,Monthly Salary\n"
    const rows = riders
      .filter((r) => r.status !== "DELETED")
      .map((r) => {
        const store = initialStores.find((s) => s._id === r.storeId)?.storeName || "N/A"
        return `"${r.employeeCode}","${r.name}","${r.email}","${r.phone}","${store}","${r.vehicleType}","${r.vehicleNumber}","${r.status}","${r.availability}","${r.rating}","${r.ordersToday}","₹${r.personalDetails?.salary || 0}"`
      })
      .join("\n")

    const blob = new Blob([headers + rows], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.setAttribute("href", url)
    a.setAttribute("download", `Delivery_Partners_${new Date().toISOString().split("T")[0]}.csv`)
    a.click()
    showToast("CSV report exported successfully.")
  }

  const handleImportCSV = () => {
    showToast("CSV Import Dialog Triggered. Parse complete (0 new riders onboarded).", "info")
  }

  // Bulk actions handlers
  const handleBulkSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRiderIds(filteredRiders.map((r) => r.id))
    } else {
      setSelectedRiderIds([])
    }
  }

  const handleRowSelect = (e, riderId) => {
    if (e.target.checked) {
      setSelectedRiderIds((prev) => [...prev, riderId])
    } else {
      setSelectedRiderIds((prev) => prev.filter((id) => id !== riderId))
    }
  }

  const handleBulkActivate = () => {
    if (selectedRiderIds.length === 0) return
    setRiders((prev) =>
      prev.map((r) => (selectedRiderIds.includes(r.id) ? { ...r, status: "Online", availability: "Available" } : r))
    )
    showToast(`Bulk activated ${selectedRiderIds.length} delivery partners.`)
    setSelectedRiderIds([])
  }

  const handleBulkSuspend = () => {
    if (selectedRiderIds.length === 0) return
    setRiders((prev) =>
      prev.map((r) => (selectedRiderIds.includes(r.id) ? { ...r, status: "Suspended", availability: "Unavailable" } : r))
    )
    showToast(`Bulk suspended ${selectedRiderIds.length} riders.`, "warning")
    setSelectedRiderIds([])
  }

  const handleBulkDelete = () => {
    if (selectedRiderIds.length === 0) return
    setRiders((prev) =>
      prev.map((r) => (selectedRiderIds.includes(r.id) ? { ...r, status: "DELETED" } : r))
    )
    showToast(`Soft deleted ${selectedRiderIds.length} delivery partners.`, "warning")
    setSelectedRiderIds([])
  }

  const handleBulkAssignStore = () => {
    if (selectedRiderIds.length === 0) return
    // Pick the first rider in selection to mock-trigger store assignment
    const firstRider = riders.find((r) => r.id === selectedRiderIds[0])
    setSelectedRider(firstRider)
    setIsAssignStoreOpen(true)
  }

  const handleBulkNotify = () => {
    if (selectedRiderIds.length === 0) return
    showToast(`Broadcasting notifications to ${selectedRiderIds.length} riders.`, "info")
    setSelectedRiderIds([])
  }

  const handleBulkReport = () => {
    if (selectedRiderIds.length === 0) return
    showToast(`Generating combined performance reports for ${selectedRiderIds.length} selected riders.`, "info")
    setSelectedRiderIds([])
  }

  // CALLBACK IMPLEMENTATIONS FOR MODALS

  // Onboard / Edit submit
  const handleAddEditConfirm = (payload) => {
    if (selectedRider) {
      // Edit
      setRiders((prev) =>
        prev.map((r) =>
          r.id === selectedRider.id
            ? {
                ...r,
                ...payload,
                personalDetails: {
                  ...r.personalDetails,
                  aadhaarNumber: payload.aadhaarNumber,
                  panNumber: payload.panNumber,
                  bankDetails: {
                    bankName: payload.bankName,
                    accountNo: payload.accountNo,
                    ifscCode: payload.ifscCode
                  },
                  emergencyContact: payload.emergencyContact,
                  salary: payload.salary,
                  salaryType: payload.salaryType,
                  commissionRate: payload.commissionRate
                }
              }
            : r
        )
      )
      showToast("Delivery Partner Profile Updated Successfully")
    } else {
      // Add
      const newRider = {
        id: `rider-${Date.now()}`,
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        employeeCode: payload.employeeCode,
        joinedDate: payload.joinedDate,
        status: payload.status,
        availability: payload.availability,
        experience: "0.1 years",
        storeId: payload.storeId,
        vehicleType: payload.vehicleType,
        vehicleNumber: payload.vehicleNumber,
        licenseNumber: payload.licenseNumber,
        profileImage: payload.profileImage,
        rating: 5.0,
        ordersToday: 0,
        personalDetails: {
          address: "Indore Store Area",
          emergencyContact: payload.emergencyContact,
          salary: payload.salary,
          salaryType: payload.salaryType,
          commissionRate: payload.commissionRate,
          aadhaarNumber: payload.aadhaarNumber,
          panNumber: payload.panNumber,
          bankDetails: {
            bankName: payload.bankName,
            accountNo: payload.accountNo,
            ifscCode: payload.ifscCode
          }
        },
        documents: {
          drivingLicense: payload.vehicleType === "Cycle" ? "N/A" : "Verified",
          vehicleRC: payload.vehicleType === "Cycle" ? "N/A" : "Verified",
          insurance: payload.vehicleType === "Cycle" ? "N/A" : "Verified",
          aadhaar: "Verified",
          panCard: "Verified",
          bankProof: "Verified"
        }
      }
      setRiders((prev) => [newRider, ...prev])
      showToast("Delivery Partner Onboarded Successfully")
    }
    setIsAddEditOpen(false)
    setSelectedRider(null)
  }

  // Assign store transfer
  const handleAssignStoreConfirm = (riderId, newStoreId, reason) => {
    setRiders((prev) =>
      prev.map((r) => (r.id === riderId ? { ...r, storeId: newStoreId } : r))
    )
    showToast("Store hub assignment updated successfully")
    setIsAssignStoreOpen(false)
    setSelectedRider(null)
    setSelectedRiderIds([])
  }

  // Documents verify callback
  const handleDocumentsConfirm = (riderId, payload) => {
    setRiders((prev) =>
      prev.map((r) => (r.id === riderId ? { ...r, documents: payload.documents } : r))
    )
    showToast("Rider documents verification statuses synced successfully")
    setIsDocumentsOpen(false)
    setSelectedRider(null)
  }

  // Suspend callback
  const handleSuspendConfirm = (riderId, details) => {
    setRiders((prev) =>
      prev.map((r) => (r.id === riderId ? { ...r, status: "Suspended", availability: "Unavailable" } : r))
    )
    showToast("Rider profile suspended and mobile app logins revoked", "warning")
    setIsSuspendOpen(false)
    setSelectedRider(null)
  }

  // Soft Delete callback
  const handleDeleteConfirm = (riderId) => {
    setRiders((prev) =>
      prev.map((r) => (r.id === riderId ? { ...r, status: "DELETED", availability: "Unavailable" } : r))
    )
    showToast("Rider profile soft deleted", "warning")
    setIsDeleteOpen(false)
    setSelectedRider(null)
  }



  return (
    <div className="px-4 pb-4 pt-4 max-w-7xl mx-auto space-y-4 text-zinc-900 dark:text-zinc-100">
      
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Truck className="w-5 h-5 text-[var(--primary)]" />
            Delivery Partners
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Manage riders, deliveries, real-time tracking, compliance documents, payouts, and performance metrics.
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-nowrap overflow-x-auto whitespace-nowrap scrollbar-none py-1">
          
          {/* Socket.IO status toggle */}
          <button
            onClick={() => setSocketRunning(!socketRunning)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer shrink-0 ${
              socketRunning 
                ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-650 border-emerald-200"
                : "bg-zinc-50 dark:bg-zinc-950 text-zinc-500 border-zinc-200 dark:border-zinc-800"
            }`}
            title={socketRunning ? "Click to Pause Socket Simulator" : "Click to Resume Socket Simulator"}
          >
            {socketRunning ? (
              <>
                <Play className="w-3 h-3 fill-emerald-600 stroke-[3]" /> Live Socket ON
              </>
            ) : (
              <>
                <Pause className="w-3 h-3 fill-zinc-500 stroke-[3]" /> Socket Off
              </>
            )}
          </button>



          <button
            onClick={() => { setSelectedRider(null); setIsAddEditOpen(true); }}
            className="flex items-center gap-1 px-3 py-2 text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-xl text-xs font-bold shadow-md shadow-[var(--primary)]/10 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            Add Delivery Partner
          </button>

          <button
            onClick={handleImportCSV}
            className="flex items-center gap-1 px-3 py-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-950 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
          >
            <Upload className="w-3.5 h-3.5" />
            Import CSV
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1 px-3 py-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-950 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>

          <button
            onClick={processData}
            className="p-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-950 rounded-xl transition-colors cursor-pointer shrink-0"
            title="Refresh Grid"
          >
            <RefreshCw className="w-4 h-4 text-zinc-500" />
          </button>
        </div>
      </div>

      <>
          {/* KPI CARDS SECTION */}
          <div className="grid grid-cols-2 lg:grid-cols-8 gap-2.5">
            {[
              { label: "Total Riders", val: kpis.totalRiders, sub: "Registered", icon: Users, color: "text-[var(--primary)] bg-[var(--primary)]/5" },
              { label: "Online Riders", val: kpis.onlineRiders, sub: "App Active", icon: UserCheck, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20" },
              { label: "Busy Riders", val: kpis.busyRiders, sub: "Delivering", icon: Truck, color: "text-blue-600 bg-blue-50 dark:bg-blue-950/20" },
              { label: "Today Orders", val: kpis.deliveredToday, sub: "Delivered MTD", icon: CheckCircle2, color: "text-purple-650 bg-purple-50 dark:bg-purple-950/20" },
              { label: "Avg Speed/Time", val: `${kpis.avgDeliveryTime}m`, sub: "Target < 25m", icon: Clock, color: "text-amber-600 bg-amber-50 dark:bg-amber-950/20" },
              { label: "Average Rating", val: `${kpis.avgRating} ★`, sub: "Based on orders", icon: Star, color: "text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20" },
              { label: "Today Earnings", val: `₹${kpis.todayEarnings.toLocaleString("en-IN")}`, sub: "Rider Payouts", icon: Wallet, color: "text-teal-600 bg-teal-50 dark:bg-teal-950/20" },
              { label: "Cancelled", val: kpis.cancelledDeliveries, sub: "High Risk", icon: ShieldAlert, color: "text-rose-650 bg-rose-50 dark:bg-rose-950/20" }
            ].map((card, i) => (
              <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 rounded-xl p-2.5 shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[82px] hover:scale-[1.02] transition-transform duration-300">
                <div>
                  <span className="block text-[7px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-0.5">
                    {card.label}
                  </span>
                  <span className="text-sm font-black text-zinc-900 dark:text-white">
                    {card.val}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1 pt-1 border-t border-zinc-50 dark:border-zinc-850/50 text-[8px] font-bold text-zinc-400">
                  <span className="truncate max-w-[55px]">{card.sub}</span>
                  <div className={`p-1 rounded ${card.color}`}>
                    <card.icon className="w-3 h-3" />
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
                  placeholder="Search name, phone, email, vehicle no, rider ID..."
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-850 dark:text-zinc-100 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[var(--primary)] transition-all placeholder-zinc-400"
                />
              </div>

              {/* Store Filter */}
              <div className="w-[140px]">
                <select
                  value={storeFilter}
                  onChange={(e) => { setStoreFilter(e.target.value); setPage(1); }}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-bold focus:outline-none"
                >
                  <option value="All">Hub Store: All</option>
                  {initialStores.map((s) => (
                    <option key={s._id} value={s._id}>{s.storeName}</option>
                  ))}
                </select>
              </div>

              {/* Vehicle Type Filter */}
              <div className="w-[125px]">
                <select
                  value={vehicleTypeFilter}
                  onChange={(e) => { setVehicleTypeFilter(e.target.value); setPage(1); }}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-bold focus:outline-none"
                >
                  <option value="All">Vehicle: All</option>
                  <option value="Bike">Bike</option>
                  <option value="Scooter">Scooter</option>
                  <option value="Cycle">Cycle</option>
                  <option value="Car">Car</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="w-[120px]">
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-bold focus:outline-none"
                >
                  <option value="All">Status: All</option>
                  <option value="Online">Online</option>
                  <option value="Offline">Offline</option>
                  <option value="Busy">Busy</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>

              {/* Availability Filter */}
              <div className="w-[130px]">
                <select
                  value={availabilityFilter}
                  onChange={(e) => { setAvailabilityFilter(e.target.value); setPage(1); }}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-bold focus:outline-none"
                >
                  <option value="All">Availability: All</option>
                  <option value="Available">Available</option>
                  <option value="Unavailable">Unavailable</option>
                </select>
              </div>

              {/* Rating Filter */}
              <div className="w-[110px]">
                <select
                  value={ratingFilter}
                  onChange={(e) => { setRatingFilter(e.target.value); setPage(1); }}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-bold focus:outline-none"
                >
                  <option value="All">Rating: All</option>
                  <option value="5">5 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="2">2 Stars</option>
                  <option value="1">1 Star</option>
                </select>
              </div>

              <button
                onClick={handleResetFilters}
                className="px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-50 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Reset Filters
              </button>

            </div>
          </div>

          {/* BULK ACTIONS TOOLBAR */}
          {selectedRiderIds.length > 0 && (
            <div className="p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl flex flex-wrap items-center justify-between gap-3 animate-fade-down">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--primary)] animate-pulse" />
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Selected <span className="text-[var(--primary)]">{selectedRiderIds.length}</span> delivery partners
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={handleBulkActivate}
                  className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold shadow-sm transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-3 h-3" /> Bulk Activate
                </button>
                <button
                  onClick={handleBulkSuspend}
                  className="flex items-center gap-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-bold shadow-sm transition-all cursor-pointer"
                >
                  <Ban className="w-3 h-3" /> Bulk Suspend
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center gap-1 px-2.5 py-1 bg-red-650 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold shadow-sm transition-all cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" /> Bulk Delete
                </button>
                <button
                  onClick={handleBulkAssignStore}
                  className="flex items-center gap-1 px-2.5 py-1 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 rounded-lg text-[10px] font-bold hover:bg-zinc-50 dark:hover:bg-zinc-950 transition-all cursor-pointer"
                >
                  <Building2 className="w-3 h-3" /> Assign Store
                </button>
                <button
                  onClick={handleBulkNotify}
                  className="flex items-center gap-1 px-2.5 py-1 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 rounded-lg text-[10px] font-bold hover:bg-zinc-50 dark:hover:bg-zinc-950 transition-all cursor-pointer"
                >
                  <MessageSquare className="w-3 h-3" /> Notify
                </button>
                <button
                  onClick={handleBulkReport}
                  className="flex items-center gap-1 px-2.5 py-1 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 rounded-lg text-[10px] font-bold hover:bg-zinc-50 dark:hover:bg-zinc-950 transition-all cursor-pointer"
                >
                  <FileSpreadsheet className="w-3 h-3" /> Generate Reports
                </button>
                <button
                  onClick={() => setSelectedRiderIds([])}
                  className="px-2 py-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-250 text-[10px] font-bold cursor-pointer"
                >
                  Deselect All
                </button>
              </div>
            </div>
          )}

          {/* RIDERS LIST TABLE / MOBILE CARDS */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 rounded-xl overflow-hidden shadow-xs">
            
            {loading ? (
              /* Loading Skeletons */
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
            ) : filteredRiders.length === 0 ? (
              /* EMPTY STATE */
              <div className="py-16 text-center space-y-4">
                <div className="w-20 h-20 mx-auto bg-zinc-50 dark:bg-zinc-950 rounded-full flex items-center justify-center border text-[var(--primary)] opacity-70">
                  <Truck className="w-9 h-9" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-zinc-850 dark:text-zinc-200 uppercase tracking-wider">No Delivery Partners Found</h3>
                  <p className="text-xs text-zinc-450 dark:text-zinc-550 mt-1">There are no riders registered or active matching your search criteria.</p>
                </div>
                <button
                  onClick={() => { setSelectedRider(null); setIsAddEditOpen(true); }}
                  className="px-4 py-2 bg-[var(--primary)] text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Add Delivery Partner
                </button>
              </div>
            ) : (
              <>
                {/* TABLE (Visible on Desktop / Tablet) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-zinc-50 dark:bg-zinc-950/50 border-b border-zinc-100 dark:border-zinc-850 text-[9px] font-bold text-zinc-450 dark:text-zinc-400 uppercase tracking-widest select-none">
                        <th className="w-10 px-3 py-2.5 text-center">
                          <input
                            type="checkbox"
                            className="rounded border-zinc-300 dark:border-zinc-700 text-[var(--primary)] focus:ring-[var(--primary)]"
                            onChange={handleBulkSelectAll}
                            checked={filteredRiders.length > 0 && selectedRiderIds.length === filteredRiders.length}
                          />
                        </th>
                        <th className="px-3 py-2.5">Photo</th>
                        <th className="px-3 py-2.5 cursor-pointer" onClick={() => handleSort("employeeCode")}>Rider ID</th>
                        <th className="px-3 py-2.5 cursor-pointer" onClick={() => handleSort("name")}>Name</th>
                        <th className="px-3 py-2.5">Vehicle</th>
                        <th className="px-3 py-2.5">Store Hub</th>
                        <th className="px-3 py-2.5 cursor-pointer text-center" onClick={() => handleSort("rating")}>Rating</th>
                        <th className="px-3 py-2.5 cursor-pointer text-center" onClick={() => handleSort("ordersToday")}>Orders Today</th>
                        <th className="px-3 py-2.5">Status</th>
                        <th className="px-3 py-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 text-[11px] text-zinc-700 dark:text-zinc-350">
                      {filteredRiders.map((rider) => {
                        const store = initialStores.find((s) => s._id === rider.storeId)
                        const isSelected = selectedRiderIds.includes(rider.id)
                        
                        return (
                          <tr 
                            key={rider.id} 
                            className={`hover:bg-zinc-50/50 dark:hover:bg-zinc-900/25 transition-colors group ${
                              isSelected ? "bg-[var(--primary)]/5 dark:bg-[var(--primary)]/5" : ""
                            }`}
                          >
                            <td className="px-3 py-2 text-center">
                              <input
                                type="checkbox"
                                className="rounded border-zinc-300 dark:border-zinc-700 text-[var(--primary)] focus:ring-[var(--primary)]"
                                checked={isSelected}
                                onChange={(e) => handleRowSelect(e, rider.id)}
                              />
                            </td>
                            <td className="px-3 py-2">
                              <img
                                src={rider.profileImage}
                                alt={rider.name}
                                className="w-7 h-7 rounded-lg object-cover border border-zinc-200 dark:border-zinc-800"
                              />
                            </td>
                            <td className="px-3 py-2 font-bold text-zinc-900 dark:text-white">{rider.employeeCode}</td>
                            <td 
                              className="px-3 py-2 font-black text-[var(--primary)] cursor-pointer hover:underline"
                              onClick={() => { setSelectedRider(rider); setDrawerTab("profile"); setIsViewOpen(true); }}
                            >
                              {rider.name}
                            </td>
                            <td className="px-3 py-2 font-semibold">
                              <div className="flex flex-col">
                                <span>{rider.vehicleType}</span>
                                <span className="text-[9px] font-bold text-zinc-400">{rider.vehicleNumber}</span>
                              </div>
                            </td>
                            <td className="px-3 py-2 font-semibold">
                              {store ? (
                                <div className="flex items-center gap-1">
                                  <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                                  <span>{store.storeName}</span>
                                </div>
                              ) : (
                                <span className="text-zinc-400 italic">Unassigned</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <div className="flex items-center justify-center gap-0.5 font-bold text-yellow-600">
                                <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                                <span>{rider.rating}</span>
                              </div>
                            </td>
                            <td className="px-3 py-2 text-center font-black text-zinc-800 dark:text-zinc-200">
                              {rider.ordersToday}
                            </td>
                            <td className="px-3 py-2">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                rider.status === "Online"
                                  ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-650"
                                  : rider.status === "Busy"
                                  ? "bg-blue-50 dark:bg-blue-950/20 text-blue-650"
                                  : rider.status === "Suspended"
                                  ? "bg-red-50 dark:bg-red-950/20 text-red-650"
                                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                              }`}>
                                {rider.status}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-right relative">
                              <button
                                onClick={() => setActiveMenuId(activeMenuId === rider.id ? null : rider.id)}
                                className="p-1 rounded-md text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>

                              {activeMenuId === rider.id && (
                                <>
                                  <div className="fixed inset-0 z-10" onClick={() => setActiveMenuId(null)} />
                                  <div className="absolute right-4 mt-1 w-44 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-xl shadow-xl z-20 overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-850 text-left">
                                    <div className="py-1">
                                      <button
                                        onClick={() => { setSelectedRider(rider); setDrawerTab("profile"); setIsViewOpen(true); setActiveMenuId(null); }}
                                        className="w-full px-4 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-850 flex items-center gap-1.5"
                                      >
                                        <Eye className="w-3.5 h-3.5 text-zinc-400" />
                                        View Drawer
                                      </button>
                                      <button
                                        onClick={() => { setSelectedRider(rider); setIsAddEditOpen(true); setActiveMenuId(null); }}
                                        className="w-full px-4 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-850 flex items-center gap-1.5"
                                      >
                                        <Clock className="w-3.5 h-3.5 text-zinc-400" />
                                        Edit Profile
                                      </button>
                                      <button
                                        onClick={() => { setSelectedRider(rider); setIsDocumentsOpen(true); setActiveMenuId(null); }}
                                        className="w-full px-4 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-850 flex items-center gap-1.5"
                                      >
                                        <Shield className="w-3.5 h-3.5 text-zinc-400" />
                                        Verify Documents
                                      </button>
                                    </div>
                                    
                                    <div className="py-1">
                                      <button
                                        onClick={() => { setSelectedRider(rider); setIsPerformanceOpen(true); setActiveMenuId(null); }}
                                        className="w-full px-4 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-850 flex items-center gap-1.5"
                                      >
                                        <TrendingUp className="w-3.5 h-3.5 text-zinc-400" />
                                        Performance Charts
                                      </button>
                                      <button
                                        onClick={() => { setSelectedRider(rider); setDrawerTab("attendance"); setIsViewOpen(true); setActiveMenuId(null); }}
                                        className="w-full px-4 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-850 flex items-center gap-1.5"
                                      >
                                        <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                                        Attendance Logs
                                      </button>
                                      <button
                                        onClick={() => { setSelectedRider(rider); setIsWalletOpen(true); setActiveMenuId(null); }}
                                        className="w-full px-4 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-850 flex items-center gap-1.5"
                                      >
                                        <Wallet className="w-3.5 h-3.5 text-zinc-400" />
                                        Wallet Payouts
                                      </button>
                                      <button
                                        onClick={() => { setSelectedRider(rider); setIsLiveOpen(true); setActiveMenuId(null); }}
                                        className="w-full px-4 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-850 flex items-center gap-1.5"
                                      >
                                        <Compass className="w-3.5 h-3.5 text-zinc-400" />
                                        Live GPS Tracking
                                      </button>
                                    </div>

                                    <div className="py-1">
                                      <button
                                        onClick={() => { setSelectedRider(rider); setIsSuspendOpen(true); setActiveMenuId(null); }}
                                        className="w-full px-4 py-1.5 text-xs text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-955/20 flex items-center gap-1.5 font-bold"
                                      >
                                        <Ban className="w-3.5 h-3.5 text-amber-500" />
                                        Suspend Rider
                                      </button>
                                      <button
                                        onClick={() => { setSelectedRider(rider); setIsDeleteOpen(true); setActiveMenuId(null); }}
                                        className="w-full px-4 py-1.5 text-xs text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center gap-1.5 font-bold"
                                      >
                                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                        Delete Rider
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

                {/* CARDS LAYOUT (Visible on Mobile View) */}
                <div className="block md:hidden divide-y divide-zinc-100 dark:divide-zinc-850">
                  {filteredRiders.map((rider) => {
                    const store = initialStores.find((s) => s._id === rider.storeId)
                    return (
                      <div key={rider.id} className="p-4 space-y-3 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <img
                              src={rider.profileImage}
                              alt={rider.name}
                              className="w-10 h-10 rounded-xl object-cover border border-zinc-200 dark:border-zinc-800"
                            />
                            <div>
                              <h3 
                                className="text-xs font-black text-[var(--primary)] hover:underline cursor-pointer"
                                onClick={() => { setSelectedRider(rider); setDrawerTab("profile"); setIsViewOpen(true); }}
                              >
                                {rider.name}
                              </h3>
                              <p className="text-[10px] text-zinc-400 font-bold">Rider ID: {rider.employeeCode}</p>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                            rider.status === "Online"
                              ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-650"
                              : rider.status === "Busy"
                              ? "bg-blue-50 dark:bg-blue-950/20 text-blue-650"
                              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                          }`}>
                            {rider.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-zinc-500">
                          <div>
                            <span className="block text-[8px] text-zinc-400 uppercase tracking-wider">Vehicle</span>
                            <span className="text-zinc-800 dark:text-zinc-200 font-extrabold">{rider.vehicleType}</span>
                          </div>
                          <div>
                            <span className="block text-[8px] text-zinc-400 uppercase tracking-wider">Rating</span>
                            <span className="text-yellow-600 flex items-center gap-0.5">
                              ★ {rider.rating}
                            </span>
                          </div>
                          <div className="col-span-2">
                            <span className="block text-[8px] text-zinc-400 uppercase tracking-wider">Store</span>
                            <span className="text-zinc-800 dark:text-zinc-200 font-semibold truncate block">
                              {store ? store.storeName : "Unassigned"}
                            </span>
                          </div>
                        </div>

                        {/* Bottom sheet triggers on mobile */}
                        <div className="flex items-center gap-1 pt-1">
                          <button
                            onClick={() => { setSelectedRider(rider); setDrawerTab("profile"); setIsViewOpen(true); }}
                            className="flex-1 py-1 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-lg text-[9px] font-black text-zinc-700 dark:text-zinc-300 text-center hover:bg-zinc-50 cursor-pointer"
                          >
                            Details
                          </button>
                          <button
                            onClick={() => { setSelectedRider(rider); setIsLiveOpen(true); }}
                            className="flex-1 py-1 bg-[var(--primary)] text-white rounded-lg text-[9px] font-black text-center hover:bg-[var(--primary-hover)] cursor-pointer"
                          >
                            GPS Track
                          </button>
                          <button
                            onClick={() => { setSelectedRider(rider); setIsWalletOpen(true); }}
                            className="px-2 py-1 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-500 rounded-lg cursor-pointer"
                            title="Wallet Payouts"
                          >
                            <Wallet className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => { setSelectedRider(rider); setIsAddEditOpen(true); }}
                            className="px-2 py-1 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-500 rounded-lg cursor-pointer"
                            title="Edit"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            {/* STICKY PAGINATION FOOTER */}
            {!loading && filteredRiders.length > 0 && (
              <div className="sticky bottom-0 z-10 flex items-center justify-between px-3 py-2.5 border-t border-zinc-150 dark:border-zinc-850 bg-zinc-50/95 dark:bg-zinc-950/95 backdrop-blur-xs text-xs text-zinc-500 font-bold select-none">
                <div className="flex items-center gap-4">
                  <span className="hidden sm:inline">Showing {Math.min(totalCount, (page - 1) * limit + 1)} to {Math.min(totalCount, page * limit)} of {totalCount} records</span>
                  <div className="flex items-center gap-1.5">
                    <span>Rows:</span>
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
        </>

      {/* DETAILED DRAWERS AND MODALS */}

      <AddEditDeliveryPartnerModal
        isOpen={isAddEditOpen}
        onClose={() => { setIsAddEditOpen(false); setSelectedRider(null); }}
        onConfirm={handleAddEditConfirm}
        rider={selectedRider}
      />

      <ViewDeliveryPartnerDrawer
        isOpen={isViewOpen}
        onClose={() => { setIsViewOpen(false); setSelectedRider(null); }}
        rider={selectedRider}
        defaultTab={drawerTab}
      />

      <AssignStoreModal
        isOpen={isAssignStoreOpen}
        onClose={() => { setIsAssignStoreOpen(false); setSelectedRider(null); }}
        onConfirm={handleAssignStoreConfirm}
        manager={selectedRider} // Reused Manager Store Transfer Interface
      />

      <WalletModal
        isOpen={isWalletOpen}
        onClose={() => { setIsWalletOpen(false); setSelectedRider(null); }}
        rider={selectedRider}
      />

      <LiveRiderModal
        isOpen={isLiveOpen}
        onClose={() => { setIsLiveOpen(false); setSelectedRider(null); }}
        rider={selectedRider}
      />

      <SuspendRiderModal
        isOpen={isSuspendOpen}
        onClose={() => { setIsSuspendOpen(false); setSelectedRider(null); }}
        onConfirm={handleSuspendConfirm}
        rider={selectedRider}
      />

      <DeleteRiderModal
        isOpen={isDeleteOpen}
        onClose={() => { setIsDeleteOpen(false); setSelectedRider(null); }}
        onConfirm={handleDeleteConfirm}
        rider={selectedRider}
      />

      <DocumentsModal
        isOpen={isDocumentsOpen}
        onClose={() => { setIsDocumentsOpen(false); setSelectedRider(null); }}
        onConfirm={handleDocumentsConfirm}
        rider={selectedRider}
      />

      <RiderPerformanceModal
        isOpen={isPerformanceOpen}
        onClose={() => { setIsPerformanceOpen(false); setSelectedRider(null); }}
        rider={selectedRider}
      />

      {/* Floating Success/Info Toast Alerts */}
      {toast && (
        <div className={`fixed bottom-4 right-4 z-50 px-5 py-3 rounded-2xl border shadow-2xl flex items-center gap-2 animate-slide-in-right ${
          toast.type === "warning"
            ? "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-455 border-rose-250"
            : toast.type === "info"
              ? "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-455 border-blue-250"
              : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-650 dark:text-emerald-455 border-emerald-250"
        }`}>
          <span className="text-xs font-bold">{toast.message}</span>
        </div>
      )}

    </div>
  )
}
