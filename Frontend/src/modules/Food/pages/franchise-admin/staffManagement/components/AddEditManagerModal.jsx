import React, { useState, useEffect } from "react"
import { Shield, X, User, DollarSign, Upload, AlertCircle } from "lucide-react"
import { initialStores } from "../mockManagersData"

const PERMISSION_OPTIONS = [
  { key: "view_orders", label: "View Orders" },
  { key: "manage_kitchen", label: "Manage Kitchen" },
  { key: "inventory_access", label: "Inventory Access" },
  { key: "staff_management", label: "Staff Management" },
  { key: "reports_access", label: "Reports Access" },
  { key: "promotions_access", label: "Promotions Access" },
  { key: "refund_approval", label: "Refund Approval" }
];

export default function AddEditManagerModal({ isOpen, onClose, onConfirm, manager }) {
  const isEditMode = !!manager

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    employeeCode: "",
    joinedDate: "",
    status: "Active",
    storeId: "",
    permissions: [],
    address: "",
    emergencyContact: "",
    salary: ""
  })

  const [errors, setErrors] = useState({})
  const [profilePreview, setProfilePreview] = useState("")

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && manager) {
        setFormData({
          name: manager.name || "",
          email: manager.email || "",
          phone: manager.phone || "",
          password: "••••••••", // Hidden for edit
          employeeCode: manager.employeeCode || "",
          joinedDate: manager.joinedDate || "",
          status: manager.status || "Active",
          storeId: manager.storeId || "",
          permissions: manager.permissions || [],
          address: manager.personalDetails?.address || "",
          emergencyContact: manager.personalDetails?.emergencyContact || "",
          salary: manager.personalDetails?.salary || ""
        })
        setProfilePreview(manager.profileImage || "")
      } else {
        // Add Mode
        const generatedCode = `PVM-${Math.floor(100 + Math.random() * 900)}`
        setFormData({
          name: "",
          email: "",
          phone: "",
          password: "",
          employeeCode: generatedCode,
          joinedDate: new Date().toISOString().split("T")[0],
          status: "Active",
          storeId: "",
          permissions: ["view_orders", "manage_kitchen"],
          address: "",
          emergencyContact: "",
          salary: ""
        })
        setProfilePreview("https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150&fm=webp")
      }
      setErrors({})
    }
  }, [isOpen, manager, isEditMode])

  if (!isOpen) return null

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handlePermissionToggle = (key) => {
    setFormData((prev) => {
      const current = prev.permissions
      const updated = current.includes(key)
        ? current.filter((p) => p !== key)
        : [...current, key]
      return { ...prev, permissions: updated }
    })
  }

  const handleRandomAvatar = () => {
    // Generate a random webp profile photo for demo purposes
    const rand = Math.floor(Math.random() * 100)
    const url = `https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150&fm=webp&r=${rand}`
    setProfilePreview(url)
  }

  const handleFormSubmit = (e) => {
    e.preventDefault()

    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = "Manager name is required"
    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Invalid email format"
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required"
    } else if (formData.phone.length < 10) {
      newErrors.phone = "Phone number must be 10 digits"
    }
    if (!isEditMode && !formData.password.trim()) {
      newErrors.password = "Password is required"
    }
    if (!formData.storeId) {
      newErrors.storeId = "Store assignment is required"
    }
    if (!formData.salary) {
      newErrors.salary = "Salary amount is required"
    } else if (isNaN(formData.salary) || parseFloat(formData.salary) <= 0) {
      newErrors.salary = "Enter a valid positive salary amount"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      // Scroll form to top
      const scrollEl = document.getElementById("modal-scroll-area")
      if (scrollEl) scrollEl.scrollTop = 0
      return
    }

    const payload = {
      ...formData,
      salary: parseFloat(formData.salary),
      profileImage: profilePreview
    }

    onConfirm(payload)
  }

  return (
    <div className="fixed lg:left-[280px] left-0 top-[64px] right-0 bottom-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden animate-scale-up flex flex-col max-h-[85vh] z-10">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-150 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 shrink-0">
          <div className="flex items-center gap-2 text-zinc-900 dark:text-white">
            <User className="w-5 h-5 text-[var(--primary)]" />
            <h3 className="text-sm font-extrabold uppercase tracking-wider">
              {isEditMode ? "Edit Store Manager Profile" : "Register New Store Manager"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-250 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto" id="modal-scroll-area">
          <div className="p-6 space-y-6">
            
            {/* Display validation summary alert */}
            {Object.keys(errors).length > 0 && (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-xl flex gap-3 text-rose-700 dark:text-rose-455 text-xs font-semibold leading-normal animate-fade-down">
                <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-rose-650" />
                <div>
                  <p className="font-extrabold uppercase tracking-wide">Validation Error</p>
                  <p className="mt-0.5 font-medium">Please correct the highlighted fields in the form below before submitting.</p>
                </div>
              </div>
            )}

            {/* TWO-COLUMN GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* LEFT COLUMN: BASIC INFORMATION */}
              <div className="space-y-4">
                <div className="border-b border-zinc-100 dark:border-zinc-800 pb-1.5 mb-2">
                  <h4 className="text-[10px] font-black text-zinc-450 dark:text-zinc-500 uppercase tracking-widest">Section 1: Basic Information</h4>
                </div>

                {/* Profile Avatar Upload Mock */}
                <div className="flex items-center gap-4 p-3 bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-850 rounded-xl">
                  <img
                    src={profilePreview}
                    alt="Preview"
                    className="w-16 h-16 rounded-xl object-cover border border-zinc-200 dark:border-zinc-800 shrink-0"
                  />
                  <div className="space-y-1">
                    <span className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Profile Image</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleRandomAvatar}
                        className="px-2.5 py-1.5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-lg text-[10px] font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Upload size={10} />
                        Randomize webP
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full text-xs font-semibold px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 focus:outline-none"
                    placeholder="Enter name (e.g., Rajesh Sharma)"
                  />
                  {errors.name && <p className="text-[9px] font-bold text-red-500">{errors.name}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full text-xs font-semibold px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 focus:outline-none"
                    placeholder="name@papaveg.com"
                  />
                  {errors.email && <p className="text-[9px] font-bold text-red-500">{errors.email}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Phone Number</label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full text-xs font-semibold px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 focus:outline-none"
                      placeholder="98765 43210"
                    />
                    {errors.phone && <p className="text-[9px] font-bold text-red-500">{errors.phone}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Password</label>
                    <input
                      type="password"
                      name="password"
                      disabled={isEditMode}
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full text-xs font-semibold px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 focus:outline-none disabled:opacity-60"
                      placeholder={isEditMode ? "Hidden for edit" : "••••••••"}
                    />
                    {errors.password && <p className="text-[9px] font-bold text-red-500">{errors.password}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Employee ID</label>
                    <input
                      type="text"
                      name="employeeCode"
                      value={formData.employeeCode}
                      onChange={handleInputChange}
                      className="w-full text-xs font-semibold px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-zinc-500 cursor-not-allowed focus:outline-none"
                      readOnly
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Joining Date</label>
                    <input
                      type="date"
                      name="joinedDate"
                      value={formData.joinedDate}
                      onChange={handleInputChange}
                      className="w-full text-xs font-semibold px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Active Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full text-xs font-semibold px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 focus:outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>

              </div>

              {/* RIGHT COLUMN: STORE ASSIGNMENT & PERMISSIONS */}
              <div className="space-y-6">
                
                {/* Section 2: Store Assignment */}
                <div className="space-y-4">
                  <div className="border-b border-zinc-100 dark:border-zinc-800 pb-1.5 mb-2">
                    <h4 className="text-[10px] font-black text-zinc-450 dark:text-zinc-500 uppercase tracking-widest">Section 2: Store Assignment</h4>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Assigned Store Outlet</label>
                    <select
                      name="storeId"
                      value={formData.storeId}
                      onChange={handleInputChange}
                      className="w-full text-xs font-semibold px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 focus:outline-none"
                    >
                      <option value="">Choose store...</option>
                      {initialStores.map((store) => (
                        <option key={store._id} value={store._id}>
                          {store.storeName} ({store.city})
                        </option>
                      ))}
                    </select>
                    {errors.storeId && <p className="text-[9px] font-bold text-red-500">{errors.storeId}</p>}
                  </div>
                </div>

                {/* Section 3: Permissions */}
                <div className="space-y-3">
                  <div className="border-b border-zinc-100 dark:border-zinc-800 pb-1.5">
                    <h4 className="text-[10px] font-black text-zinc-450 dark:text-zinc-500 uppercase tracking-widest">Section 3: Permissions Matrix</h4>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-850 p-3.5 rounded-2xl max-h-[170px] overflow-y-auto scrollbar-thin">
                    {PERMISSION_OPTIONS.map((opt) => {
                      const isChecked = formData.permissions.includes(opt.key)
                      return (
                        <label
                          key={opt.key}
                          className="flex items-center gap-2 text-[10px] font-bold text-zinc-650 dark:text-zinc-350 cursor-pointer select-none py-1"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handlePermissionToggle(opt.key)}
                            className="w-3.5 h-3.5 accent-[var(--primary)] border-zinc-300 rounded"
                          />
                          <span>{opt.label}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>

                {/* Section 4: Personal & Financial */}
                <div className="space-y-3.5">
                  <div className="border-b border-zinc-100 dark:border-zinc-800 pb-1.5">
                    <h4 className="text-[10px] font-black text-zinc-450 dark:text-zinc-500 uppercase tracking-widest">Section 4: Personal Details</h4>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Monthly Salary (INR)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-zinc-450 font-bold text-xs">₹</span>
                        <input
                          type="text"
                          name="salary"
                          value={formData.salary}
                          onChange={handleInputChange}
                          className="w-full text-xs font-semibold pl-7 pr-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 focus:outline-none"
                          placeholder="e.g., 45000"
                        />
                      </div>
                      {errors.salary && <p className="text-[9px] font-bold text-red-500">{errors.salary}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Emergency Contact</label>
                      <input
                        type="text"
                        name="emergencyContact"
                        value={formData.emergencyContact}
                        onChange={handleInputChange}
                        className="w-full text-xs font-semibold px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 focus:outline-none"
                        placeholder="Name (Relation) - Phone"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Residential Address</label>
                    <textarea
                      name="address"
                      rows="2"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full text-xs font-semibold px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 focus:outline-none"
                      placeholder="Street, City, Pincode"
                    />
                  </div>
                </div>

              </div>

            </div>

          </div>

          {/* Buttons Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800 p-4 bg-zinc-50/50 dark:bg-zinc-950/20 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-950 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-xl text-xs font-bold shadow-md shadow-[var(--primary)]/10 hover:shadow-lg transition-all cursor-pointer"
            >
              {isEditMode ? "Save Changes" : "Create Store Manager"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
