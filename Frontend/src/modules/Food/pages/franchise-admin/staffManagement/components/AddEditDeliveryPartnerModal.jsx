import React, { useState, useEffect } from "react"
import { Clock, X, User, DollarSign, Upload, AlertCircle, Sparkles, Truck, Shield } from "lucide-react"
import { initialStores } from "../mockManagersData"

const VEHICLE_OPTIONS = ["Bike", "Scooter", "Cycle", "Car"];

export default function AddEditDeliveryPartnerModal({ isOpen, onClose, onConfirm, rider }) {
  const isEditMode = !!rider

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    employeeCode: "",
    joinedDate: "",
    status: "Online",
    availability: "Available",
    storeId: "",
    vehicleType: "Bike",
    vehicleNumber: "",
    licenseNumber: "",
    aadhaarNumber: "",
    panNumber: "",
    bankName: "",
    accountNo: "",
    ifscCode: "",
    emergencyContact: "",
    salary: "",
    salaryType: "Salary",
    commissionRate: ""
  })

  const [errors, setErrors] = useState({})
  const [profilePreview, setProfilePreview] = useState("")

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && rider) {
        setFormData({
          name: rider.name || "",
          email: rider.email || "",
          phone: rider.phone || "",
          password: "••••••••",
          employeeCode: rider.employeeCode || "",
          joinedDate: rider.joinedDate || "",
          status: rider.status || "Online",
          availability: rider.availability || "Available",
          storeId: rider.storeId || "",
          vehicleType: rider.vehicleType || "Bike",
          vehicleNumber: rider.vehicleNumber || "",
          licenseNumber: rider.licenseNumber || "",
          aadhaarNumber: rider.personalDetails?.aadhaarNumber || "",
          panNumber: rider.personalDetails?.panNumber || "",
          bankName: rider.personalDetails?.bankDetails?.bankName || "",
          accountNo: rider.personalDetails?.bankDetails?.accountNo || "",
          ifscCode: rider.personalDetails?.bankDetails?.ifscCode || "",
          emergencyContact: rider.personalDetails?.emergencyContact || "",
          salary: rider.personalDetails?.salary || "",
          salaryType: rider.personalDetails?.salaryType || "Salary",
          commissionRate: rider.personalDetails?.commissionRate || ""
        })
        setProfilePreview(rider.profileImage || "")
      } else {
        // Add Mode
        const generatedCode = `PVR-${Math.floor(200 + Math.random() * 800)}`
        setFormData({
          name: "",
          email: "",
          phone: "",
          password: "",
          employeeCode: generatedCode,
          joinedDate: new Date().toISOString().split("T")[0],
          status: "Online",
          availability: "Available",
          storeId: "",
          vehicleType: "Bike",
          vehicleNumber: "",
          licenseNumber: "",
          aadhaarNumber: "",
          panNumber: "",
          bankName: "",
          accountNo: "",
          ifscCode: "",
          emergencyContact: "",
          salary: "",
          salaryType: "Salary",
          commissionRate: "10"
        })
        setProfilePreview("https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&fm=webp")
      }
      setErrors({})
    }
  }, [isOpen, rider, isEditMode])

  if (!isOpen) return null

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleRandomAvatar = () => {
    const rand = Math.floor(Math.random() * 100)
    const url = `https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?auto=format&fit=crop&q=80&w=150&fm=webp&r=${rand}`
    setProfilePreview(url)
  }

  const handleFormSubmit = (e) => {
    e.preventDefault()

    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = "Delivery partner name is required"
    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Invalid email format"
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required"
    } else if (formData.phone.length < 10) {
      newErrors.phone = "Phone must be at least 10 digits"
    }
    if (!isEditMode && !formData.password.trim()) {
      newErrors.password = "Password is required"
    }
    if (!formData.storeId) {
      newErrors.storeId = "Store assignment is required"
    }
    if (formData.vehicleType !== "Cycle" && !formData.vehicleNumber.trim()) {
      newErrors.vehicleNumber = "Vehicle number is required for motor vehicles"
    }
    if (formData.vehicleType !== "Cycle" && !formData.licenseNumber.trim()) {
      newErrors.licenseNumber = "License number is required for motor vehicles"
    }
    if (!formData.aadhaarNumber.trim()) {
      newErrors.aadhaarNumber = "Aadhaar is required"
    }
    if (!formData.panNumber.trim()) {
      newErrors.panNumber = "PAN is required"
    }
    if (!formData.salary) {
      newErrors.salary = "Salary amount is required"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      const scrollEl = document.getElementById("rider-scroll-area")
      if (scrollEl) scrollEl.scrollTop = 0
      return
    }

    const payload = {
      ...formData,
      salary: parseFloat(formData.salary),
      commissionRate: parseFloat(formData.commissionRate || 0),
      profileImage: profilePreview
    }

    onConfirm(payload)
  }

  return (
    <div className="fixed lg:left-[280px] left-0 top-[64px] right-0 bottom-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden animate-scale-up flex flex-col max-h-[85vh] z-10">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-150 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 shrink-0">
          <div className="flex items-center gap-2 text-zinc-900 dark:text-white">
            <Truck className="w-5 h-5 text-[var(--primary)]" />
            <h3 className="text-sm font-extrabold uppercase tracking-wider">
              {isEditMode ? "Edit Delivery Partner Profile" : "Register New Delivery Partner"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-255 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto" id="rider-scroll-area">
          <div className="p-6 space-y-6">
            
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

                <div className="flex items-center gap-4 p-3 bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-850 rounded-xl">
                  <img
                    src={profilePreview}
                    alt="Preview"
                    className="w-16 h-16 rounded-xl object-cover border border-zinc-200 dark:border-zinc-800 shrink-0"
                  />
                  <div className="space-y-1">
                    <span className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Photo File</span>
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

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full text-xs font-semibold px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 focus:outline-none"
                    placeholder="Enter name (e.g., Amit Sen)"
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
                    placeholder="rider@papaveg.com"
                  />
                  {errors.email && <p className="text-[9px] font-bold text-red-500">{errors.email}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Phone</label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full text-xs font-semibold px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 focus:outline-none"
                      placeholder="98260 22211"
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
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Rider ID</label>
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
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Joined Date</label>
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
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Store Hub Assignment</label>
                  <select
                    name="storeId"
                    value={formData.storeId}
                    onChange={handleInputChange}
                    className="w-full text-xs font-semibold px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 focus:outline-none"
                  >
                    <option value="">Select store outlet...</option>
                    {initialStores.map((store) => (
                      <option key={store._id} value={store._id}>
                        {store.storeName} ({store.city})
                      </option>
                    ))}
                  </select>
                  {errors.storeId && <p className="text-[9px] font-bold text-red-500">{errors.storeId}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full text-xs font-semibold px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 focus:outline-none"
                    >
                      <option value="Online">Online</option>
                      <option value="Busy">Busy</option>
                      <option value="Offline">Offline</option>
                      <option value="Suspended">Suspended</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Availability</label>
                    <select
                      name="availability"
                      value={formData.availability}
                      onChange={handleInputChange}
                      className="w-full text-xs font-semibold px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 focus:outline-none"
                    >
                      <option value="Available">Available</option>
                      <option value="Unavailable">Unavailable</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: VEHICLE & COMPENSATION DETAILS */}
              <div className="space-y-6">
                
                {/* Section 2: Vehicle details */}
                <div className="space-y-3.5">
                  <div className="border-b border-zinc-100 dark:border-zinc-800 pb-1.5">
                    <h4 className="text-[10px] font-black text-zinc-450 dark:text-zinc-500 uppercase tracking-widest">Section 2: Vehicle Specifications</h4>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-1 space-y-1">
                      <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Vehicle Type</label>
                      <select
                        name="vehicleType"
                        value={formData.vehicleType}
                        onChange={handleInputChange}
                        className="w-full text-[11px] font-semibold px-2 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 focus:outline-none"
                      >
                        {VEHICLE_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-2 space-y-1">
                      <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Vehicle Registration No.</label>
                      <input
                        type="text"
                        name="vehicleNumber"
                        disabled={formData.vehicleType === "Cycle"}
                        value={formData.vehicleType === "Cycle" ? "N/A - Bicycle" : formData.vehicleNumber}
                        onChange={handleInputChange}
                        className="w-full text-[11px] font-semibold px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 focus:outline-none disabled:opacity-60"
                        placeholder="MP-09-AB-1234"
                      />
                      {errors.vehicleNumber && <p className="text-[9px] font-bold text-red-500">{errors.vehicleNumber}</p>}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Driving License No.</label>
                    <input
                      type="text"
                      name="licenseNumber"
                      disabled={formData.vehicleType === "Cycle"}
                      value={formData.vehicleType === "Cycle" ? "N/A" : formData.licenseNumber}
                      onChange={handleInputChange}
                      className="w-full text-xs font-semibold px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 focus:outline-none disabled:opacity-60"
                      placeholder="DL-092024XXXXXX"
                    />
                    {errors.licenseNumber && <p className="text-[9px] font-bold text-red-500">{errors.licenseNumber}</p>}
                  </div>
                </div>

                {/* Section 3: Identity & Bank */}
                <div className="space-y-3.5">
                  <div className="border-b border-zinc-100 dark:border-zinc-800 pb-1.5">
                    <h4 className="text-[10px] font-black text-zinc-450 dark:text-zinc-500 uppercase tracking-widest">Section 3: Identity & Bank Info</h4>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Aadhaar (UIDAI)</label>
                      <input
                        type="text"
                        name="aadhaarNumber"
                        value={formData.aadhaarNumber}
                        onChange={handleInputChange}
                        className="w-full text-xs font-semibold px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 focus:outline-none"
                        placeholder="1234 5678 9012"
                      />
                      {errors.aadhaarNumber && <p className="text-[9px] font-bold text-red-500">{errors.aadhaarNumber}</p>}
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">PAN Number</label>
                      <input
                        type="text"
                        name="panNumber"
                        value={formData.panNumber}
                        onChange={handleInputChange}
                        className="w-full text-xs font-semibold px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-zinc-850 dark:text-zinc-100 focus:outline-none"
                        placeholder="ABCDE1234F"
                      />
                      {errors.panNumber && <p className="text-[9px] font-bold text-red-500">{errors.panNumber}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-1 space-y-1">
                      <label className="text-[9px] font-bold text-zinc-400 block">Bank Name</label>
                      <input
                        type="text"
                        name="bankName"
                        value={formData.bankName}
                        onChange={handleInputChange}
                        className="w-full text-[10px] font-semibold px-2 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 focus:outline-none"
                        placeholder="SBI"
                      />
                    </div>
                    <div className="col-span-1 space-y-1">
                      <label className="text-[9px] font-bold text-zinc-400 block">Account No</label>
                      <input
                        type="text"
                        name="accountNo"
                        value={formData.accountNo}
                        onChange={handleInputChange}
                        className="w-full text-[10px] font-semibold px-2 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 focus:outline-none"
                        placeholder="1000XXXXXXXX"
                      />
                    </div>
                    <div className="col-span-1 space-y-1">
                      <label className="text-[9px] font-bold text-zinc-400 block">IFSC Code</label>
                      <input
                        type="text"
                        name="ifscCode"
                        value={formData.ifscCode}
                        onChange={handleInputChange}
                        className="w-full text-[10px] font-semibold px-2 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 focus:outline-none"
                        placeholder="SBIN0003043"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1 col-span-2">
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
                </div>

                {/* Section 4: Compensation */}
                <div className="space-y-3.5">
                  <div className="border-b border-zinc-100 dark:border-zinc-800 pb-1.5">
                    <h4 className="text-[10px] font-black text-zinc-450 dark:text-zinc-500 uppercase tracking-widest">Section 4: Compensation Details</h4>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-1 space-y-1">
                      <label className="text-[9px] font-bold text-zinc-400 block">Salary Type</label>
                      <select
                        name="salaryType"
                        value={formData.salaryType}
                        onChange={handleInputChange}
                        className="w-full text-[11px] font-semibold px-2 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 focus:outline-none"
                      >
                        <option value="Salary">Fixed Salary</option>
                        <option value="Commission">Commission Based</option>
                      </select>
                    </div>

                    <div className="col-span-1 space-y-1">
                      <label className="text-[9px] font-bold text-zinc-400 block">Base Salary (INR)</label>
                      <div className="relative">
                        <span className="absolute left-2 top-2 text-zinc-450 text-xs">₹</span>
                        <input
                          type="text"
                          name="salary"
                          value={formData.salary}
                          onChange={handleInputChange}
                          className="w-full text-[11px] font-semibold pl-5 pr-2 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 focus:outline-none"
                          placeholder="18000"
                        />
                      </div>
                      {errors.salary && <p className="text-[9px] font-bold text-red-550">{errors.salary}</p>}
                    </div>

                    <div className="col-span-1 space-y-1">
                      <label className="text-[9px] font-bold text-zinc-400 block">Commission Rate (%)</label>
                      <div className="relative">
                        <input
                          type="text"
                          name="commissionRate"
                          disabled={formData.salaryType === "Salary"}
                          value={formData.salaryType === "Salary" ? "0" : formData.commissionRate}
                          onChange={handleInputChange}
                          className="w-full text-[11px] font-semibold px-2 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 focus:outline-none disabled:opacity-60"
                          placeholder="15"
                        />
                        <span className="absolute right-2 top-2 text-zinc-450 text-xs">%</span>
                      </div>
                    </div>
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
              className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-955 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-xl text-xs font-bold shadow-md shadow-[var(--primary)]/10 hover:shadow-lg transition-all cursor-pointer"
            >
              {isEditMode ? "Save Changes" : "Register Partner"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
