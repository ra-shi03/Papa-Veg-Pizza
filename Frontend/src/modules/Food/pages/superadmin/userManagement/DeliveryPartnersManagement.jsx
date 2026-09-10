import React, { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  MoreVertical,
  Eye,
  Edit,
  Ban,
  UserCheck,
  Trash2,
  CheckCircle,
  AlertCircle,
  Bike,
  Car,
  Plus,
  Star,
  ChevronRight,
  ChevronLeft,
  Users,
  Radio,
  PowerOff,
  Truck,
  ShieldAlert,
  ArrowUpRight,
  TrendingDown
} from "lucide-react"

// Import custom subcomponents
import DeliveryPartnersFilters from "./DeliveryPartnersFilters"
import DeliveryPartnerDetailsDrawer from "./DeliveryPartnerDetailsDrawer"
import EditDeliveryPartnerModal from "./EditDeliveryPartnerModal"
import DeliverySuspendedModal from "./DeliverySuspendedModal"

const INITIAL_RIDERS = [
  {
    id: "RP-88421",
    name: "Ravi Sharma",
    email: "r.sharma@papaveg.com",
    phone: "+91 98765 43210",
    store: "Mumbai - Andheri West",
    franchise: "Papa Veg Mumbai",
    vehicle: "Electric Bike",
    vehicleModel: "NIU N-Series",
    licenseNumber: "MH-02-1234",
    totalOrders: 450,
    completedOrders: 450,
    cancelledOrders: 5,
    rating: 4.8,
    status: "Online",
    address: "722 Link Road, Andheri West, Mumbai",
    storeManager: "Sanjay Gupta",
    priorityRouting: true,
    recentDeliveries: [
      { id: "ORD-11498", date: "Today, 02:45 PM", status: "Delivered", earnings: 12.50 },
      { id: "ORD-11495", date: "Today, 01:12 PM", status: "Delivered", earnings: 8.75 },
      { id: "ORD-11490", date: "Today, 11:30 AM", status: "Failed", earnings: 0.00 },
      { id: "ORD-11488", date: "Yesterday, 09:15 PM", status: "Delivered", earnings: 15.20 },
      { id: "ORD-11482", date: "Yesterday, 08:30 PM", status: "Delivered", earnings: 9.40 }
    ]
  },
  {
    id: "RP-88422",
    name: "Neha Singh",
    email: "n.singh@papaveg.com",
    phone: "+91 98765 43211",
    store: "Pune - Koregaon Park",
    franchise: "Papa Veg Pune",
    vehicle: "Scooter",
    vehicleModel: "Ather 450X",
    licenseNumber: "MH-12-5678",
    totalOrders: 328,
    completedOrders: 328,
    cancelledOrders: 2,
    rating: 4.9,
    status: "Busy",
    address: "415 Main Street, Koregaon Park, Pune",
    storeManager: "Rahul Verma",
    priorityRouting: false,
    recentDeliveries: [
      { id: "ORD-11488", date: "Yesterday, 09:15 PM", status: "Delivered", earnings: 15.20 },
      { id: "ORD-11482", date: "Yesterday, 08:30 PM", status: "Delivered", earnings: 9.40 }
    ]
  },
  {
    id: "RP-88423",
    name: "Amit Patel",
    email: "a.patel@papaveg.com",
    phone: "+91 98765 43212",
    store: "Delhi - Connaught Place",
    franchise: "Papa Veg Delhi",
    vehicle: "Car",
    vehicleModel: "Tata Nexon EV",
    licenseNumber: "DL-01-9012",
    totalOrders: 1102,
    completedOrders: 1102,
    cancelledOrders: 18,
    rating: 4.7,
    status: "Offline",
    address: "789 CP Inner Circle, Delhi",
    storeManager: "Suresh Kumar",
    priorityRouting: true,
    recentDeliveries: [
      { id: "ORD-11475", date: "2 days ago", status: "Delivered", earnings: 18.00 },
      { id: "ORD-11471", date: "2 days ago", status: "Delivered", earnings: 11.25 }
    ]
  },
  {
    id: "RP-88424",
    name: "Rahul Verma",
    email: "r.verma_rider@papaveg.com",
    phone: "+91 98765 43213",
    store: "Bangalore - Indiranagar",
    franchise: "Papa Veg Bangalore",
    vehicle: "Electric Bike",
    vehicleModel: "Ola S1 Pro",
    licenseNumber: "KA-01-3456",
    totalOrders: 84,
    completedOrders: 84,
    cancelledOrders: 12,
    rating: 3.2,
    status: "Suspended",
    address: "101 100ft Road, Indiranagar, Bangalore",
    storeManager: "Vikram Singh",
    priorityRouting: false,
    recentDeliveries: [
      { id: "ORD-11425", date: "3 days ago", status: "Failed", earnings: 0.00 }
    ]
  }
]

export default function DeliveryPartnersManagement() {
  const [riders, setRiders] = useState(INITIAL_RIDERS)

  // Filter States
  const [searchQuery, setSearchQuery] = useState("")
  const [franchiseFilter, setFranchiseFilter] = useState("All Franchises")
  const [storeFilter, setStoreFilter] = useState("All Stores")
  const [statusFilter, setStatusFilter] = useState("All Statuses")
  const [vehicleFilter, setVehicleFilter] = useState("Vehicle Type")
  const [sortOrder, setSortOrder] = useState("asc")

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 4

  // Overlay Trigger States
  const [selectedRider, setSelectedRider] = useState(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false)
  const [activeMenuId, setActiveMenuId] = useState(null)

  // Toast notifications state
  const [toast, setToast] = useState(null)
  const showToast = (message, type = "success") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Calculate stats dynamically
  const kpiStats = useMemo(() => {
    return {
      total: riders.length,
      online: riders.filter((r) => r.status === "Online").length,
      offline: riders.filter((r) => r.status === "Offline").length,
      onDelivery: riders.filter((r) => r.status === "Busy").length,
      suspended: riders.filter((r) => r.status === "Suspended").length,
    }
  }, [riders])

  // Filter logic
  const filteredRiders = useMemo(() => {
    return riders.filter((rider) => {
      const query = searchQuery.toLowerCase()
      const matchesSearch =
        rider.name.toLowerCase().includes(query) ||
        rider.phone.includes(query) ||
        rider.id.toLowerCase().includes(query) ||
        rider.vehicle.toLowerCase().includes(query)

      const matchesFranchise =
        franchiseFilter === "All Franchises" || rider.franchise === franchiseFilter

      const matchesStore =
        storeFilter === "All Stores" || rider.store.toLowerCase().includes(storeFilter.toLowerCase())

      const matchesStatus =
        statusFilter === "All Statuses" || rider.status === statusFilter

      const matchesVehicle =
        vehicleFilter === "Vehicle Type" || rider.vehicle === vehicleFilter

      return matchesSearch && matchesFranchise && matchesStore && matchesStatus && matchesVehicle
    }).sort((a, b) => sortOrder === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name))
  }, [riders, searchQuery, franchiseFilter, storeFilter, statusFilter, vehicleFilter, sortOrder])

  // Paginated results
  const paginatedRiders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredRiders.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredRiders, currentPage])

  const totalPages = Math.ceil(filteredRiders.length / itemsPerPage)

  const handleSaveRider = (savedData) => {
    const exists = riders.some((r) => r.id === savedData.id)
    if (exists) {
      // Edit mode
      setRiders((prev) => prev.map((r) => (r.id === savedData.id ? savedData : r)))
      showToast(`Updated details for ${savedData.name}!`, "success")
    } else {
      // Add mode
      setRiders((prev) => [savedData, ...prev])
      showToast(`Successfully added delivery partner ${savedData.name}!`, "success")
    }
    setIsEditModalOpen(false)
    setSelectedRider(null)
  }

  const handleSuspendToggle = (rider) => {
    if (rider.status === "Suspended") {
      setRiders((prev) =>
        prev.map((r) => (r.id === rider.id ? { ...r, status: "Online" } : r))
      )
      showToast(`${rider.name} has been activated!`, "success")
      setActiveMenuId(null)
      setSelectedRider((prev) => (prev && prev.id === rider.id ? { ...prev, status: "Online" } : prev))
    } else {
      setIsDrawerOpen(false)
      setSelectedRider(rider)
      setIsSuspendModalOpen(true)
      setActiveMenuId(null)
    }
  }

  const handleConfirmSuspension = (rider, reason, notes) => {
    setRiders((prev) =>
      prev.map((r) => (r.id === rider.id ? { ...r, status: "Suspended" } : r))
    )
    showToast(`${rider.name} is now Suspended!`, "warning")
    setIsSuspendModalOpen(false)
    setSelectedRider(null)
  }

  const handleDeleteRider = (rider) => {
    if (window.confirm(`Are you sure you want to remove delivery partner ${rider.name}?`)) {
      setRiders((prev) => prev.filter((r) => r.id !== rider.id))
      showToast(`Removed delivery partner ${rider.name}`, "warning")
      setActiveMenuId(null)
      if (selectedRider?.id === rider.id) {
        setIsDrawerOpen(false)
        setSelectedRider(null)
      }
    }
  }

  const handleResetFilters = () => {
    setSearchQuery("")
    setFranchiseFilter("All Franchises")
    setStoreFilter("All Stores")
    setStatusFilter("All Statuses")
    setVehicleFilter("Vehicle Type")
    setSortOrder("asc")
    setCurrentPage(1)
    showToast("Filters reset successful!", "success")
  }

  const getVehicleIcon = (vehicle) => {
    switch (vehicle) {
      case "Car":
        return <Car size={16} />
      default:
        return <Bike size={16} />
    }
  }

  const getProfileImage = (name) => {
    if (name?.toLowerCase().includes("ravi")) return "/rider_alex.webp"
    if (name?.toLowerCase().includes("neha")) return "/rider_elena.webp"
    if (name?.toLowerCase().includes("amit")) return "/rider_marcus.webp"
    return "/rider_alex.webp" // Default fallback
  }

  return (
    <div className="p-3 md:p-4 pb-12 max-w-7xl mx-auto bg-zinc-50 dark:bg-zinc-950 min-h-screen w-full space-y-4">
      {/* Toast Alert Banner */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 16, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[150] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl bg-zinc-900 text-white dark:bg-zinc-800 text-xs font-bold border border-zinc-700/50"
          >
            {toast.type === "success" ? (
              <CheckCircle size={16} className="text-emerald-500" />
            ) : (
              <AlertCircle size={16} className="text-rose-500" />
            )}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Breadcrumbs & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3 pt-2">
        <div className="space-y-0.5">
          <h1 className="text-lg font-bold text-black dark:text-white leading-tight">
            Delivery Partners
          </h1>
          <p className="text-[10px] font-semibold text-black/70 dark:text-white/70 mt-0.5">
            Manage delivery riders across all stores
          </p>
        </div>

        {/* <button
          onClick={() => {
            setSelectedRider(null)
            setIsEditModalOpen(true)
          }}
          className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white px-3.5 py-1.5 rounded-lg flex items-center justify-center gap-1.5 shadow-md hover:scale-[1.02] active:scale-95 transition-all cursor-pointer font-bold text-[11px]"
        >
          <Plus size={14} className="stroke-[3]" />
          <span>Add Delivery Partner</span>
        </button> */}
      </div>

      {/* KPI Cards Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-4 select-none">
        {/* Total Riders */}
        <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[10px] font-bold text-black dark:text-white uppercase tracking-wider truncate">Total Riders</span>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <h3 className="text-lg font-black text-black dark:text-white mt-0.5">{kpiStats.total}</h3>
              <span className="text-emerald-500 font-bold text-[8px] flex items-center gap-0.5">
                <ArrowUpRight size={10} /> +12%
              </span>
            </div>
          </div>
          <div className="p-1.5 rounded-md bg-[var(--primary)]/10 text-[var(--primary)] shrink-0 border border-[var(--primary)]/20">
            <Users size={14} />
          </div>
        </div>

        {/* Online Riders */}
        <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[10px] font-bold text-black dark:text-white uppercase tracking-wider truncate">Online</span>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <h3 className="text-lg font-black text-black dark:text-white mt-0.5">{kpiStats.online}</h3>
              <span className="text-emerald-500 font-bold text-[8px] flex items-center gap-0.5">
                <ArrowUpRight size={10} /> +5%
              </span>
            </div>
          </div>
          <div className="p-1.5 rounded-md bg-green-500/10 text-green-600 shrink-0 border border-green-100 dark:border-green-900/30">
            <Radio size={14} className="animate-pulse" />
          </div>
        </div>

        {/* Offline Riders */}
        <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[10px] font-bold text-black dark:text-white uppercase tracking-wider truncate">Offline</span>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <h3 className="text-lg font-black text-black dark:text-white mt-0.5">{kpiStats.offline}</h3>
              <span className="text-rose-500 font-bold text-[8px] flex items-center gap-0.5">
                <TrendingDown size={10} /> -2%
              </span>
            </div>
          </div>
          <div className="p-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-black/50 dark:text-white/50 shrink-0 border border-zinc-200 dark:border-zinc-800">
            <PowerOff size={14} />
          </div>
        </div>

        {/* On Delivery Riders */}
        <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[10px] font-bold text-black dark:text-white uppercase tracking-wider truncate">On Delivery</span>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <h3 className="text-lg font-black text-black dark:text-white mt-0.5">{kpiStats.onDelivery}</h3>
              <span className="text-emerald-500 font-bold text-[8px] flex items-center gap-0.5">
                <ArrowUpRight size={10} /> +18%
              </span>
            </div>
          </div>
          <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-600 shrink-0 border border-amber-100 dark:border-amber-900/30">
            <Truck size={14} />
          </div>
        </div>

        {/* Suspended Riders */}
        <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[10px] font-bold text-black dark:text-white uppercase tracking-wider truncate">Suspended</span>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <h3 className="text-lg font-black text-black dark:text-white mt-0.5">{kpiStats.suspended}</h3>
              <span className="text-rose-500 font-bold text-[8px] flex items-center gap-0.5">
                <ArrowUpRight size={10} /> +3%
              </span>
            </div>
          </div>
          <div className="p-1.5 rounded-md bg-rose-500/10 text-rose-600 shrink-0 border border-rose-100 dark:border-rose-900/30">
            <ShieldAlert size={14} />
          </div>
        </div>
      </section>

      {/* Delivery Partners Filters Component */}
      <DeliveryPartnersFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        franchiseFilter={franchiseFilter}
        setFranchiseFilter={setFranchiseFilter}
        storeFilter={storeFilter}
        setStoreFilter={setStoreFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        vehicleFilter={vehicleFilter}
        setVehicleFilter={setVehicleFilter}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        onReset={handleResetFilters}
      />

      {/* Main Responsive Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm mt-4">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
                <th className="px-3 py-2 text-[9px] font-extrabold text-black/50 dark:text-white/50 uppercase tracking-wider">
                  Partner
                </th>
                <th className="px-3 py-2 text-[9px] font-extrabold text-black/50 dark:text-white/50 uppercase tracking-wider">
                  Store
                </th>
                <th className="px-3 py-2 text-[9px] font-extrabold text-black/50 dark:text-white/50 uppercase tracking-wider">
                  Vehicle
                </th>
                <th className="px-3 py-2 text-[9px] font-extrabold text-black/50 dark:text-white/50 uppercase tracking-wider text-center">
                  Orders
                </th>
                <th className="px-3 py-2 text-[9px] font-extrabold text-black/50 dark:text-white/50 uppercase tracking-wider text-center">
                  Rating
                </th>
                <th className="px-3 py-2 text-[9px] font-extrabold text-black/50 dark:text-white/50 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 py-2 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-150 dark:divide-zinc-800">
              {paginatedRiders.length > 0 ? (
                paginatedRiders.map((rider) => (
                  <tr
                    key={rider.id}
                    className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors group cursor-pointer text-xs text-black dark:text-white"
                    onClick={() => {
                      setSelectedRider(rider)
                      setIsDrawerOpen(true)
                    }}
                  >
                    {/* Partner Details */}
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-zinc-100 dark:border-zinc-800 flex-shrink-0">
                          <img
                            src={getProfileImage(rider.name)}
                            alt={rider.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-black dark:text-white group-hover:text-[var(--primary)] transition-colors">
                            {rider.name}
                          </p>
                          <p className="text-[9px] text-black/50 dark:text-white/50 font-semibold mt-0.5">{rider.phone}</p>
                        </div>
                      </div>
                    </td>

                    {/* Store */}
                    <td className="px-3 py-2 text-[10px] font-semibold text-black dark:text-white">
                      {rider.store}
                    </td>

                    {/* Vehicle */}
                    <td className="px-3 py-2 text-[10px] font-semibold text-black dark:text-white">
                      <div className="flex items-center gap-1">
                        <span className="text-black/50 dark:text-white/50">{getVehicleIcon(rider.vehicle)}</span>
                        <span>{rider.vehicle}</span>
                      </div>
                    </td>

                    {/* Total Orders */}
                    <td className="px-3 py-2 text-[10px] font-extrabold text-black dark:text-white text-center">
                      {rider.totalOrders}
                    </td>

                    {/* Rating */}
                    <td className="px-3 py-2 text-center">
                      <div className="flex items-center justify-center gap-0.5">
                        <Star size={11} className="fill-amber-400 stroke-none" />
                        <span className="text-[10px] font-bold text-black dark:text-white">{rider.rating}</span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-3 py-2">
                      <span
                        className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-full ${rider.status === "Online"
                          ? "bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-900/30"
                          : rider.status === "Busy"
                            ? "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30"
                            : rider.status === "Offline"
                              ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-zinc-200 dark:border-zinc-700/35"
                              : "bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30"
                          }`}
                      >
                        {rider.status}
                      </span>
                    </td>

                    {/* Actions Menu */}
                    <td className="px-3 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedRider(rider)
                            setIsDrawerOpen(true)
                          }}
                          className="p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-black/50 dark:text-white/50 hover:text-[var(--primary)] transition-all cursor-pointer"
                          title="View Profile"
                        >
                          <Eye size={13} />
                        </button>
                        {/* <button
                          onClick={() => {
                            setSelectedRider(rider)
                            setIsEditModalOpen(true)
                          }}
                          className="p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-black/50 dark:text-white/50 hover:text-[var(--primary)] transition-all cursor-pointer"
                          title="Edit Profile"
                        >
                          <Edit size={13} />
                        </button> */}
                        <button
                          onClick={() => handleSuspendToggle(rider)}
                          className={`p-1 rounded-lg border transition-all cursor-pointer ${rider.status === "Suspended"
                            ? "border-emerald-200 dark:border-emerald-950 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                            : "border-amber-200 dark:border-amber-950 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                            }`}
                          title={rider.status === "Suspended" ? "Activate Account" : "Suspend Rider"}
                        >
                          {rider.status === "Suspended" ? <UserCheck size={13} /> : <Ban size={13} />}
                        </button>
                        <button
                          onClick={() => handleDeleteRider(rider)}
                          className="p-1 rounded-lg border border-rose-200/40 dark:border-rose-950 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-550 dark:text-rose-455 transition-all cursor-pointer"
                          title="Delete Partner"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-3 py-8 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                        <Truck size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-black dark:text-white">No Delivery Partners Found</p>
                        <p className="text-[10px] text-black/50 dark:text-white/50 font-semibold mt-0.5">
                          Try adjusting your filtering choices or resetting the search term.
                        </p>
                      </div>
                      <button
                        onClick={handleResetFilters}
                        className="px-3 py-1.5 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white rounded-lg text-xs font-bold transition-all shadow cursor-pointer"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination Footer */}
        {filteredRiders.length > 0 && (
          <div className="px-3 py-2 bg-zinc-50 dark:bg-zinc-900/50 flex justify-between items-center border-t border-zinc-200 dark:border-zinc-800">
            <p className="text-[10px] font-semibold text-black/50 dark:text-white/50">
              Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredRiders.length)} of {filteredRiders.length} partners
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="p-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-850 disabled:opacity-40 transition-all flex items-center justify-center cursor-pointer"
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-7 h-7 flex items-center justify-center rounded-lg text-[10px] font-bold transition-all ${currentPage === i + 1
                    ? "bg-[var(--primary)] text-white shadow-md"
                    : "bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-850"
                    }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-850 disabled:opacity-40 transition-all flex items-center justify-center cursor-pointer"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Details Profile Drawer */}
      <DeliveryPartnerDetailsDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false)
          setSelectedRider(null)
        }}
        rider={selectedRider}
        onSuspend={handleSuspendToggle}
        onEdit={(rider) => {
          setIsDrawerOpen(false)
          setSelectedRider(rider)
          setIsEditModalOpen(true)
        }}
      />

      {/* Add / Edit Modal */}
      <EditDeliveryPartnerModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedRider(null)
        }}
        rider={selectedRider}
        onSave={handleSaveRider}
      />

      {/* Suspend Confirmation Modal */}
      <DeliverySuspendedModal
        isOpen={isSuspendModalOpen}
        onClose={() => {
          setIsSuspendModalOpen(false)
          setSelectedRider(null)
        }}
        rider={selectedRider}
        onConfirm={handleConfirmSuspension}
      />
    </div>
  )
}
