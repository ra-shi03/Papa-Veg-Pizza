import React, { useState, useMemo, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import apiClient from "../../../../../services/api/axios"
import {
  MoreVertical,
  Eye,
  Edit,
  Ban,
  UserCheck,
  CheckCircle,
  AlertCircle,
  Building,
  MapPin,
  ChevronDown,
  Layers,
  ArrowRight,
  Trash2
} from "lucide-react"

// Reusable custom subcomponents
import FranchiseKPIs from "./FranchiseKPIs"
import FranchiseFilters from "./FranchiseFilters"
import FranchiseDetailsDrawer from "./components/FranchiseDetailsDrawer"
import AddFranchiseModal from "./components/AddFranchiseModal"
import EditFranchiseModal from "./components/EditFranchiseModal"
import SuspendFranchiseModal from "./components/SuspendFranchiseModal" // Actually a Delete Modal now



export default function FranchiseList() {
  const [franchises, setFranchises] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchFranchises = async () => {
      try {
        setIsLoading(true)
        const [franRes, regRes, zonRes] = await Promise.all([
          apiClient.get('/food/admin/franchises'),
          apiClient.get('/food/admin/regions'),
          apiClient.get('/food/admin/zones')
        ]);
        
        const regions = regRes.data.data || [];
        const zones = zonRes.data.data || [];

        const data = franRes.data.data.map(f => {
          const regionName = regions.find(r => r.id === f.regionId || r._id === f.regionId)?.name || f.regionId;
          const zoneName = zones.find(z => z.id === f.zoneId || z._id === f.zoneId)?.name || f.zoneId;

          return {
            id: f.franchiseCode,
            _id: f._id,
            name: f.ownerName || f.managerName,
            email: f.email,
            phone: f.phone,
            franchiseName: f.name,
            city: f.city,
            state: f.state,
            regionId: f.regionId,
            zoneId: f.zoneId,
            regionName,
            zoneName,
            type: f.type,
            totalStores: f.totalStores,
            status: f.isActive ? 'ACTIVE' : 'INACTIVE',
            joinedDate: new Date(f.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "2-digit",
              year: "numeric"
            }),
            franchiseDuration: f.franchiseDuration,
            gstNumber: f.gstNumber,
            address: f.address,
            franchiseCost: f.franchiseCost,
            paidAmount: f.paidAmount,
            dueAmount: f.dueAmount
          }
        })
        setFranchises(data)
      } catch (error) {
        console.error("Error fetching franchises:", error)
        showToast("Failed to fetch franchises", "error")
      } finally {
        setIsLoading(false)
      }
    }
    fetchFranchises()
  }, [])

  // Filter States
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("All Statuses")
  const [typeFilter, setTypeFilter] = useState("All Types")
  const [cityFilter, setCityFilter] = useState("")

  // Overlay Trigger States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // Selected Admin Reference
  const [selectedAdmin, setSelectedAdmin] = useState(null)

  // Custom dropdown click row selection
  const [activeMenuId, setActiveMenuId] = useState(null)

  // Toast State
  const [toast, setToast] = useState(null)

  const showToast = (message, type = "success") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Advanced filters, search, and sorting mapping
  const filteredFranchises = useMemo(() => {
    return franchises.filter((fran) => {
      // Search Box Filter
      const query = searchQuery.toLowerCase()
      const matchesSearch =
        fran.name?.toLowerCase().includes(query) ||
        fran.email?.toLowerCase().includes(query) ||
        fran.phone?.includes(query) ||
        fran.franchiseName?.toLowerCase().includes(query) ||
        fran.id?.toLowerCase().includes(query)

      // Dropdown Status Filter
      const matchesStatus =
        statusFilter === "All Statuses" || fran.status === statusFilter

      // Dropdown Type Filter
      const matchesType =
        typeFilter === "All Types" || fran.type === typeFilter

      // Input City Filter
      const matchesCity =
        !cityFilter.trim() || fran.city?.toLowerCase().includes(cityFilter.toLowerCase())

      return matchesSearch && matchesStatus && matchesType && matchesCity
    })
  }, [franchises, searchQuery, statusFilter, typeFilter, cityFilter])

  // Handle operations save triggers
  const handleSaveAdmin = (savedData) => {
    const exists = franchises.some((f) => f.id === savedData.id)
    if (exists) {
      // Modify
      setFranchises((prev) => prev.map((f) => (f.id === savedData.id ? savedData : f)))
      showToast(`Updated details for ${savedData.name}!`, "success")
    } else {
      // Add
      setFranchises((prev) => [savedData, ...prev])
      showToast(`Added new Franchise Operator ${savedData.name}!`, "success")
    }
    setIsAddModalOpen(false)
    setIsEditModalOpen(false)
    setSelectedAdmin(null)
  }

  const handleDeleteAdmin = async (id, details) => {
    const adminRef = franchises.find((f) => f.id === id)
    if (!adminRef) return;
    
    try {
      await apiClient.delete(`/food/admin/franchises/${adminRef._id}`)
      setFranchises((prev) =>
        prev.filter((f) => f.id !== id)
      )
      showToast(`${adminRef.name}'s franchise is now Deleted!`, "success")
      setIsDeleteModalOpen(false)
      setSelectedAdmin(null)
    } catch (err) {
      showToast("Failed to delete franchise", "error")
    }
  }

  const handleActivateAdmin = async (id) => {
    const adminRef = franchises.find((f) => f.id === id)
    if (!adminRef) return;

    try {
      await apiClient.patch(`/food/admin/franchises/${adminRef._id}`, { status: "ACTIVE" })
      setFranchises((prev) =>
        prev.map((f) => (f.id === id ? { ...f, status: "ACTIVE" } : f))
      )
      showToast(`${adminRef.name}'s franchise has been Activated!`, "success")
      setActiveMenuId(null)
    } catch (err) {
      showToast("Failed to activate franchise", "error")
    }
  }

  const handleResetFilters = () => {
    setSearchQuery("")
    setStatusFilter("All Statuses")
    setTypeFilter("All Types")
    setCityFilter("")
    showToast("Filters reset successful!", "success")
  }

  const handleExportCSV = () => {
    showToast("Franchise database export completed successfully!", "success")
  }

  return (
    <div className="p-3 md:p-4 pb-12 max-w-7xl mx-auto w-full">
      {/* Toast Alert Alert Banner */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 16, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[110] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl bg-zinc-900 text-white dark:bg-zinc-800 text-xs font-bold border border-zinc-700/50"
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

      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pt-1">
        <div>
          <h1 className="text-xl font-semibold text-black dark:text-white tracking-tight">
            Franchise Admins
          </h1>
          <p className="text-black dark:text-white text-xs font-medium mt-0.5">
            Manage franchise owners, store properties, and commissions.
          </p>
        </div>
      </div>

      {/* Reusable Filters row */}
      <FranchiseFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        cityFilter={cityFilter}
        setCityFilter={setCityFilter}
        onReset={handleResetFilters}
        onExport={handleExportCSV}
        onAddAdmin={() => {
          setSelectedAdmin(null)
          setIsAddModalOpen(true)
        }}
      />

      {/* Main Responsive Data Table Container */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-150 dark:border-zinc-800">
                <th className="px-3 py-2.5 text-[9px] font-extrabold text-black dark:text-white opacity-75 uppercase tracking-wider">
                  Franchise Code
                </th>
                <th className="px-3 py-2.5 text-[9px] font-extrabold text-black dark:text-white opacity-75 uppercase tracking-wider">
                  Franchise Admin
                </th>
                <th className="px-3 py-2.5 text-[9px] font-extrabold text-black dark:text-white opacity-75 uppercase tracking-wider">
                  Mobile Number
                </th>
                <th className="px-3 py-2.5 text-[9px] font-extrabold text-black dark:text-white opacity-75 uppercase tracking-wider">
                  HQ Region
                </th>
                <th className="px-3 py-2.5 text-[9px] font-extrabold text-black dark:text-white opacity-75 uppercase tracking-wider">
                  Store
                </th>
                <th className="px-3 py-2.5 text-[9px] font-extrabold text-black dark:text-white opacity-75 uppercase tracking-wider">
                  Franchise Duration
                </th>
                <th className="px-3 py-2.5 text-[9px] font-extrabold text-black dark:text-white opacity-75 uppercase tracking-wider">
                  Create Date
                </th>
                <th className="px-3 py-2.5 text-[9px] font-extrabold text-black dark:text-white opacity-75 uppercase tracking-wider text-center">
                  Status
                </th>
                <th className="px-3 py-2.5 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredFranchises.length > 0 ? (
                filteredFranchises.map((fran) => (
                  <tr
                    key={fran.id}
                    className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors group"
                  >
                    {/* Franchise Code */}
                    <td className="px-3 py-2.5">
                      <span className="text-[9px] font-mono bg-zinc-100 dark:bg-zinc-850 px-1 py-0.2 rounded text-black dark:text-white opacity-80 inline-block font-bold">
                        {fran.id}
                      </span>
                    </td>

                    {/* Operator Profile */}
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-[10px] text-black dark:text-white group-hover:scale-105 transition-transform">
                          {fran.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <div>
                          <p className="text-xs font-extrabold text-black dark:text-white group-hover:text-[var(--primary)] transition-colors">
                            {fran.name}
                          </p>
                          <p className="text-[9px] text-black dark:text-white opacity-60 font-semibold mt-0.5">{fran.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Mobile Number */}
                    <td className="px-3 py-2.5 text-xs font-semibold text-black dark:text-white opacity-75">
                      {fran.phone}
                    </td>

                    {/* HQ Region */}
                    <td className="px-3 py-2.5 text-xs font-semibold text-black dark:text-white">
                      <div className="flex items-center gap-1">
                        <MapPin size={11} className="text-black dark:text-white opacity-60" />
                        <span>
                          {fran.zoneName}, {fran.regionName}
                        </span>
                      </div>
                    </td>

                    {/* Stores */}
                    <td className="px-3 py-2.5">
                      <p className="text-xs font-bold text-black dark:text-white">
                        {fran.totalStores} {fran.totalStores === 1 ? "Store" : "Stores"}
                      </p>
                    </td>

                    {/* Franchise Duration */}
                    <td className="px-3 py-2.5 text-xs font-semibold text-black dark:text-white opacity-70">
                      {fran.franchiseDuration} {fran.franchiseDuration === 1 ? "Year" : "Years"}
                    </td>

                    {/* Create Date */}
                    <td className="px-3 py-2.5 text-xs font-semibold text-black dark:text-white opacity-70">
                      {fran.joinedDate}
                    </td>

                    {/* Status */}
                    <td className="px-3 py-2.5">
                      <div className="flex flex-col items-center gap-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          fran.status === 'ACTIVE' 
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                        }`}>
                          {fran.status}
                        </span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer"
                            checked={fran.status === "ACTIVE"}
                            onChange={async () => {
                              try {
                                const newStatus = fran.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"
                                await apiClient.patch(`/food/admin/franchises/${fran._id}`, { status: newStatus })
                                const updatedFranchises = franchises.map(f => {
                                  if (f.id === fran.id) {
                                    return { ...f, status: newStatus }
                                  }
                                  return f
                                })
                                setFranchises(updatedFranchises)
                                showToast(`Franchise ${newStatus === "ACTIVE" ? "Activated" : "Deactivated"}`, "success")
                              } catch (err) {
                                showToast("Failed to update status", "error")
                              }
                            }}
                          />
                          <div className="w-7 h-4 bg-zinc-200 dark:bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[var(--primary)]"></div>
                        </label>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedAdmin(fran)
                            setIsDrawerOpen(true)
                          }}
                          className="p-1 rounded-md bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 text-black dark:text-white opacity-70 hover:opacity-100 hover:text-[var(--primary)] transition-colors cursor-pointer"
                          title="View Profile"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedAdmin(fran)
                            setIsEditModalOpen(true)
                          }}
                          className="p-1 rounded-md bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 text-black dark:text-white opacity-70 hover:opacity-100 hover:text-blue-500 transition-colors cursor-pointer"
                          title="Edit Profile"
                        >
                          <Edit size={14} />
                        </button>
                        {fran.status === "SUSPENDED" ? (
                          <button
                            onClick={() => {}}
                            className="p-1 rounded-md bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-900/30 text-emerald-600 transition-colors cursor-pointer"
                            title="Re-Activate"
                          >
                            <UserCheck size={14} />
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedAdmin(fran)
                              setIsDeleteModalOpen(true)
                            }}
                            className="p-1 rounded-md bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-900/30 text-rose-600 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                /* Empty filter state */
                <tr>
                  <td colSpan="8" className="px-3 py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-10 h-10 rounded-full bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-black dark:text-white opacity-60">
                        <Building size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-black dark:text-white">No Franchise Admins Found</p>
                        <p className="text-[10px] text-black dark:text-white opacity-60 font-semibold mt-0.5">
                          Try adjusting your filtering choices or resetting the search term.
                        </p>
                      </div>
                      <button
                        onClick={handleResetFilters}
                        className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white rounded-lg text-xs font-bold transition-all shadow cursor-pointer"
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
      </div>

      {/* Franchise details Drawer Panel */}
      <FranchiseDetailsDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false)
          setSelectedAdmin(null)
        }}
        admin={selectedAdmin}
      />

      {/* Add Modal Popup */}
      <AddFranchiseModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
          setSelectedAdmin(null)
        }}
        onSave={handleSaveAdmin}
      />

      {/* Edit Modal Popup */}
      <EditFranchiseModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedAdmin(null)
        }}
        admin={selectedAdmin}
        onSave={handleSaveAdmin}
      />

      {/* Delete confirmation Modal Popup */}
      <SuspendFranchiseModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setSelectedAdmin(null)
        }}
        admin={selectedAdmin}
        onConfirm={handleDeleteAdmin}
      />
    </div>
  )
}
