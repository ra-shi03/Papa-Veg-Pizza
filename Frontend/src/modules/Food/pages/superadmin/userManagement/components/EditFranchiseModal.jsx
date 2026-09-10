import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, User, Mail, Phone, Store, MapPin, Layers, Save, Lock, Clock, Hash } from "lucide-react"
import apiClient from "../../../../../../services/api/axios"

// Mock geography data (as requested, representing data from franchiseManagement folder)
const MOCK_REGIONS = [
  { id: "reg-1", name: "North India" },
  { id: "reg-2", name: "West India" },
  { id: "reg-3", name: "South India" },
  { id: "reg-4", name: "Central India" }
];

const MOCK_ZONES = [
  { id: "zn-1", name: "Delhi NCR Zone", regionId: "reg-1" },
  { id: "zn-2", name: "Mumbai Zone", regionId: "reg-2" },
  { id: "zn-3", name: "Pune Zone", regionId: "reg-2" },
  { id: "zn-4", name: "Bengaluru Zone", regionId: "reg-3" },
  { id: "zn-5", name: "Indore Zone", regionId: "reg-4" },
  { id: "zn-6", name: "Bhopal Zone", regionId: "reg-4" }
];

const MOCK_TERRITORIES = [
  { id: "ter-1", name: "CP & Connaught Place", zoneId: "zn-1" },
  { id: "ter-2", name: "Bandra West Cluster", zoneId: "zn-2" },
  { id: "ter-3", name: "Koramangala", zoneId: "zn-4" },
  { id: "ter-4", name: "Vijay Nagar", zoneId: "zn-5" }
];

export default function EditFranchiseModal({ isOpen, onClose, admin, onSave }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    franchiseName: "",
    franchiseCode: "",
    regionId: "",
    zoneId: "",
    territoryId: "",
    type: "Single Store",
    totalStores: 1,
    status: "ACTIVE",
    franchiseDuration: 3,
    franchiseCost: "",
    paidAmount: "",
    dueAmount: ""
  })

  const [errors, setErrors] = useState({})

  // Derived dependent dropdowns
  const availableZones = MOCK_ZONES.filter(z => z.regionId === formData.regionId);
  const availableTerritories = MOCK_TERRITORIES.filter(t => t.zoneId === formData.zoneId);

  useEffect(() => {
    if (admin && isOpen) {
      
      // Reverse map city and state back to region/territory for editing if available
      const rId = MOCK_REGIONS.find(r => r.name === admin.state)?.id || ""
      const tId = MOCK_TERRITORIES.find(t => t.name === admin.city)?.id || ""
      const zId = MOCK_TERRITORIES.find(t => t.id === tId)?.zoneId || ""

      setFormData({
        name: admin.name || "",
        email: admin.email || "",
        phone: admin.phone || "",
        password: "",
        franchiseName: admin.franchiseName || "",
        franchiseCode: admin.franchiseCode || "",
        regionId: rId,
        zoneId: zId,
        territoryId: tId,
        type: admin.type || "Single Store",
        totalStores: admin.totalStores || 1,
        status: admin.status || "ACTIVE",
        franchiseDuration: admin.franchiseDuration || 3,
        franchiseCost: admin.franchiseCost || "",
        paidAmount: admin.paidAmount || "",
        dueAmount: admin.dueAmount || ""
      })
      setErrors({})
    }
  }, [admin, isOpen])

  const validate = () => {
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = "Name is required"
    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Invalid email format"
    }
    if (!formData.phone.trim()) newErrors.phone = "Phone is required"
    if (!formData.franchiseName.trim()) newErrors.franchiseName = "Franchise name is required"
    if (!formData.franchiseCode.trim()) newErrors.franchiseCode = "Franchise code is required"
    if (!formData.regionId) newErrors.regionId = "Region is required"
    if (!formData.zoneId) newErrors.zoneId = "Zone is required"
    if (!formData.territoryId) newErrors.territoryId = "Territory is required"
    if (formData.totalStores < 1) newErrors.totalStores = "Must have at least 1 store"
    if (!formData.franchiseDuration || Number(formData.franchiseDuration) < 1) {
      newErrors.franchiseDuration = "Duration must be at least 1 year"
    }
    if (formData.franchiseCost !== "" && Number(formData.franchiseCost) < 0) {
      newErrors.franchiseCost = "Cost cannot be negative"
    }
    if (formData.paidAmount !== "" && Number(formData.paidAmount) < 0) {
      newErrors.paidAmount = "Paid amount cannot be negative"
    }
    if (formData.dueAmount !== "" && Number(formData.dueAmount) < 0) {
      newErrors.dueAmount = "Due amount cannot be negative"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    // Resolve names for the table display if needed
    const regionName = MOCK_REGIONS.find(r => r.id === formData.regionId)?.name || ""
    const zoneName = MOCK_ZONES.find(z => z.id === formData.zoneId)?.name || ""
    const territoryName = MOCK_TERRITORIES.find(t => t.id === formData.territoryId)?.name || ""

    try {
      const response = await apiClient.patch(`/food/admin/franchises/${admin._id}`, formData);
      onSave({
        ...admin,
        ...response.data.data,
        city: territoryName,
        state: regionName,
        name: formData.name, // Since the backend stores ownerName, make sure frontend displays correctly
      })
      onClose()
    } catch (err) {
      console.error(err);
      // Ideally show toast error
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
          />

          <div className="fixed inset-0 flex items-center justify-center p-4 z-[105] overflow-y-auto pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-3.5 pointer-events-auto flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100 dark:border-zinc-800">
                <div>
                  <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-50 leading-tight">
                    Edit Franchise Admin
                  </h3>
                  <p className="text-zinc-400 dark:text-zinc-500 font-semibold text-[10px] mt-0.5">
                    Update profile details and administrative permissions.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  <X size={15} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-1 py-2.5 space-y-3 scrollbar-thin">
                <div className="space-y-3">
                  <span className="text-[9px] font-extrabold text-[var(--primary)] uppercase tracking-wider">
                    Personal Details
                  </span>
                  
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1">Full Name</label>
                    <div className="relative">
                      <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. John Doe"
                        className={`w-full text-xs pl-8.5 pr-3 py-1.5 border rounded-lg bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:bg-white transition-all ${
                          errors.name ? "border-rose-500" : "border-zinc-200 dark:border-zinc-800"
                        }`}
                      />
                    </div>
                    {errors.name && <p className="text-[9px] text-rose-500 font-bold mt-1">{errors.name}</p>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1">Email Address</label>
                      <div className="relative">
                        <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="e.g. john@example.com"
                          className={`w-full text-xs pl-8.5 pr-3 py-1.5 border rounded-lg bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:bg-white transition-all ${
                            errors.email ? "border-rose-500" : "border-zinc-200 dark:border-zinc-800"
                          }`}
                        />
                      </div>
                      {errors.email && <p className="text-[9px] text-rose-500 font-bold mt-1">{errors.email}</p>}
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1">Phone Number</label>
                      <div className="relative">
                        <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input
                          type="text"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="e.g. +1 234 567 890"
                          className={`w-full text-xs pl-8.5 pr-3 py-1.5 border rounded-lg bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:bg-white transition-all ${
                            errors.phone ? "border-rose-500" : "border-zinc-200 dark:border-zinc-800"
                          }`}
                        />
                      </div>
                      {errors.phone && <p className="text-[9px] text-rose-500 font-bold mt-1">{errors.phone}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1">Password</label>
                    <div className="relative">
                      <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Leave blank to keep unchanged"
                        className={`w-full text-xs pl-8.5 pr-3 py-1.5 border rounded-lg bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:bg-white transition-all ${
                          errors.password ? "border-rose-500" : "border-zinc-200 dark:border-zinc-800"
                        }`}
                      />
                    </div>
                    {errors.password && <p className="text-[9px] text-rose-500 font-bold mt-1">{errors.password}</p>}
                  </div>
                </div>

                <div className="space-y-3 pt-2.5">
                  <span className="text-[9px] font-extrabold text-[var(--primary)] uppercase tracking-wider">
                    Franchise Configuration
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1">Franchise / Brand Name</label>
                      <div className="relative">
                        <Store size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input
                          type="text"
                          value={formData.franchiseName}
                          onChange={(e) => setFormData({ ...formData, franchiseName: e.target.value })}
                          placeholder="e.g. Papa Veg Centro"
                          className={`w-full text-xs pl-8.5 pr-3 py-1.5 border rounded-lg bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:bg-white transition-all ${
                            errors.franchiseName ? "border-rose-500" : "border-zinc-200 dark:border-zinc-800"
                          }`}
                        />
                      </div>
                      {errors.franchiseName && <p className="text-[9px] text-rose-500 font-bold mt-1">{errors.franchiseName}</p>}
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1">Franchise Code</label>
                      <div className="relative">
                        <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input
                          type="text"
                          value={formData.franchiseCode}
                          onChange={(e) => setFormData({ ...formData, franchiseCode: e.target.value })}
                          placeholder="e.g. FRAN-123"
                          className={`w-full text-xs pl-8.5 pr-3 py-1.5 border rounded-lg bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:bg-white transition-all ${
                            errors.franchiseCode ? "border-rose-500" : "border-zinc-200 dark:border-zinc-800"
                          }`}
                        />
                      </div>
                      {errors.franchiseCode && <p className="text-[9px] text-rose-500 font-bold mt-1">{errors.franchiseCode}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {/* Region, Zone, and Territory */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1">Region</label>
                        <select
                          value={formData.regionId}
                          onChange={(e) => setFormData({ ...formData, regionId: e.target.value, zoneId: "", territoryId: "" })}
                          className={`w-full text-xs px-3 py-1.5 border rounded-lg bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:bg-white transition-all cursor-pointer ${
                            errors.regionId ? "border-rose-500" : "border-zinc-200 dark:border-zinc-800"
                          }`}
                        >
                          <option value="">Select Region...</option>
                          {MOCK_REGIONS.map((r) => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                          ))}
                        </select>
                        {errors.regionId && <p className="text-[9px] text-rose-500 font-bold mt-1">{errors.regionId}</p>}
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1">Zone</label>
                        <select
                          value={formData.zoneId}
                          disabled={!formData.regionId}
                          onChange={(e) => setFormData({ ...formData, zoneId: e.target.value, territoryId: "" })}
                          className={`w-full text-xs px-3 py-1.5 border rounded-lg bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:bg-white transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                            errors.zoneId ? "border-rose-500" : "border-zinc-200 dark:border-zinc-800"
                          }`}
                        >
                          <option value="">Select Zone...</option>
                          {availableZones.map((z) => (
                            <option key={z.id} value={z.id}>{z.name}</option>
                          ))}
                        </select>
                        {errors.zoneId && <p className="text-[9px] text-rose-500 font-bold mt-1">{errors.zoneId}</p>}
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1">Territory</label>
                        <select
                          value={formData.territoryId}
                          disabled={!formData.zoneId}
                          onChange={(e) => setFormData({ ...formData, territoryId: e.target.value })}
                          className={`w-full text-xs px-3 py-1.5 border rounded-lg bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:bg-white transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                            errors.territoryId ? "border-rose-500" : "border-zinc-200 dark:border-zinc-800"
                          }`}
                        >
                          <option value="">Select Territory...</option>
                          {availableTerritories.map((t) => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                        {errors.territoryId && <p className="text-[9px] text-rose-500 font-bold mt-1">{errors.territoryId}</p>}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1">Franchise Type</label>
                      <select
                        value={formData.type}
                        onChange={(e) => {
                          const val = e.target.value
                          setFormData({
                            ...formData,
                            type: val,
                            totalStores: val === "Single Store" ? 1 : Math.max(formData.totalStores, 2)
                          })
                        }}
                        className="w-full text-xs px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:bg-white transition-all cursor-pointer"
                      >
                        <option>Single Store</option>
                        <option>Multi Store</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1">Store Limit</label>
                      <div className="relative">
                        <Layers size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input
                          type="number"
                          min="1"
                          disabled={formData.type === "Single Store"}
                          value={formData.totalStores}
                          onChange={(e) => setFormData({ ...formData, totalStores: parseInt(e.target.value) || 1 })}
                          className={`w-full text-xs pl-8.5 pr-3 py-1.5 border rounded-lg text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:bg-white transition-all ${
                            formData.type === "Single Store"
                              ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-500 border-zinc-200 dark:border-zinc-800 cursor-not-allowed"
                              : "bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1">Account Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full text-xs px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:bg-white transition-all cursor-pointer"
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="INACTIVE">INACTIVE</option>
                        <option value="SUSPENDED">SUSPENDED</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1">Franchise Duration (Years)</label>
                      <div className="relative">
                        <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input
                          type="number"
                          min="1"
                          placeholder="e.g. 3"
                          value={formData.franchiseDuration}
                          onChange={(e) => setFormData({ ...formData, franchiseDuration: parseInt(e.target.value) || "" })}
                          className={`w-full text-xs pl-8.5 pr-3 py-1.5 border rounded-lg bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:bg-white transition-all ${
                            errors.franchiseDuration ? "border-rose-500" : "border-zinc-200 dark:border-zinc-800"
                          }`}
                        />
                      </div>
                      {errors.franchiseDuration && <p className="text-[9px] text-rose-500 font-bold mt-1">{errors.franchiseDuration}</p>}
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1">Total Franchise Cost (₹)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-400">₹</span>
                        <input
                          type="number"
                          min="0"
                          placeholder="e.g. 500000"
                          value={formData.franchiseCost}
                          onChange={(e) => {
                            const costVal = e.target.value
                            const cost = parseFloat(costVal) || 0
                            const paid = parseFloat(formData.paidAmount) || 0
                            setFormData({
                              ...formData,
                              franchiseCost: costVal,
                              dueAmount: Math.max(0, cost - paid).toString()
                            })
                          }}
                          className={`w-full text-xs pl-7 pr-3 py-1.5 border rounded-lg bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:bg-white transition-all ${
                            errors.franchiseCost ? "border-rose-500" : "border-zinc-200 dark:border-zinc-800"
                          }`}
                        />
                      </div>
                      {errors.franchiseCost && <p className="text-[9px] text-rose-500 font-bold mt-1">{errors.franchiseCost}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1">Paid Amount (₹)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-400">₹</span>
                        <input
                          type="number"
                          min="0"
                          placeholder="e.g. 300000"
                          value={formData.paidAmount}
                          onChange={(e) => {
                            const paidVal = e.target.value
                            const cost = parseFloat(formData.franchiseCost) || 0
                            const paid = parseFloat(paidVal) || 0
                            setFormData({
                              ...formData,
                              paidAmount: paidVal,
                              dueAmount: Math.max(0, cost - paid).toString()
                            })
                          }}
                          className={`w-full text-xs pl-7 pr-3 py-1.5 border rounded-lg bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:bg-white transition-all ${
                            errors.paidAmount ? "border-rose-500" : "border-zinc-200 dark:border-zinc-800"
                          }`}
                        />
                      </div>
                      {errors.paidAmount && <p className="text-[9px] text-rose-500 font-bold mt-1">{errors.paidAmount}</p>}
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1">Due Amount (₹)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-400">₹</span>
                        <input
                          type="number"
                          min="0"
                          placeholder="e.g. 200000"
                          value={formData.dueAmount}
                          onChange={(e) => setFormData({ ...formData, dueAmount: e.target.value })}
                          className={`w-full text-xs pl-7 pr-3 py-1.5 border rounded-lg bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:bg-white transition-all ${
                            errors.dueAmount ? "border-rose-500" : "border-zinc-200 dark:border-zinc-800"
                          }`}
                        />
                      </div>
                      {errors.dueAmount && <p className="text-[9px] text-rose-500 font-bold mt-1">{errors.dueAmount}</p>}
                    </div>
                  </div>
                </div>
              </form>

              <div className="flex items-center justify-end gap-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 mt-1.5 z-10">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 font-bold text-xs text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="flex items-center gap-2 px-3 py-1.5 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white rounded-lg text-xs font-bold shadow-md shadow-[var(--primary)]/20 transition-all hover:scale-[1.02] cursor-pointer"
                >
                  <Save size={12} className="stroke-[2.5]" />
                  <span>Save Profile Changes</span>
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
