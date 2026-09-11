import React, { useState, useEffect, useCallback, useRef } from "react"
import {
  User,
  Shield,
  Landmark,
  Settings,
  Activity,
  Camera,
  Loader2,
  Key,
  Bell,
  Check,
  Globe,
  Clock,
  IndianRupee,
  Laptop,
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Upload,
  AlertTriangle,
  Smartphone,
  CheckCircle2
} from "lucide-react"
import { toast } from "sonner"
import { adminAPI, userAPI } from "@food/api"
import { useAuthStore } from "@/core/auth/auth.store"

// Custom reusable components for clean UI architecture
const Card = ({ children, className = "" }) => (
  <div className={`bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-xl shadow-sm p-5 ${className}`}>
    {children}
  </div>
)

const InputField = ({ label, id, type = "text", value, onChange, placeholder, disabled = false, error }) => (
  <div className="flex flex-col gap-1 w-full">
    <label htmlFor={id} className="text-xs font-bold text-slate-700 dark:text-zinc-300">
      {label}
    </label>
    <input
      type={type}
      id={id}
      value={value || ""}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={`text-sm px-3.5 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all ${
        disabled
          ? "opacity-60 cursor-not-allowed"
          : error
          ? "border-red-500 focus:ring-red-500"
          : "border-zinc-200 dark:border-zinc-850"
      }`}
    />
    {error && <p className="text-[10px] text-red-500 font-semibold">{error}</p>}
  </div>
)

const Button = ({ children, onClick, type = "button", variant = "primary", disabled = false, className = "" }) => {
  const baseStyle = "text-xs font-bold px-4 py-2 rounded-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
  const variants = {
    primary: "bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white shadow-sm",
    secondary: "bg-[var(--secondary)] hover:bg-[var(--secondary-hover)] text-white shadow-sm",
    outline: "border border-zinc-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800",
    danger: "bg-red-600 hover:bg-red-700 text-white shadow-sm"
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${className}`}>
      {children}
    </button>
  )
}

export default function AdminProfile() {
  // Tab states: 'personal', 'security', 'franchise', 'preferences', 'activity'
  const [activeTab, setActiveTab] = useState("personal")
  const [loading, setLoading] = useState(false)

  const { user } = useAuthStore()
  // Profile Photo states
  const [profileImage, setProfileImage] = useState(() => localStorage.getItem("admin_profile_image") || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150")
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  const [selectedPhotoFile, setSelectedPhotoFile] = useState(null)
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState("")

  // Personal Information State
  const [personalInfo, setPersonalInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    alternatePhone: "",
    dob: "",
    gender: "",
    address: "",
    city: "",
    state: "",
    pincode: ""
  })

  // Editable temporary states
  const [tempPersonalInfo, setTempPersonalInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    alternatePhone: "",
    dob: "",
    gender: "",
    address: "",
    city: "",
    state: "",
    pincode: ""
  })
  const [personalErrors, setPersonalErrors] = useState({})

  // Security: Password state (Simulated PUT /api/franchise-admin/change-password)
  const [passwordState, setPasswordState] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })
  const [passwordErrors, setPasswordErrors] = useState({})
  const [showPasswordSuccess, setShowPasswordSuccess] = useState(false)


  // Franchise Information state — superadmin-controlled fields (read-only)
  const [franchiseInfo, setFranchiseInfo] = useState({
    // From franchise document (set by superadmin)
    name: "",
    ownerName: "",
    code: "",
    gstNumber: "",
    panNumber: "",
    type: "",
    totalStores: 0,
    franchiseDuration: "",
    franchiseCost: 0,
    paidAmount: 0,
    dueAmount: 0,
    region: "",
    isActive: true,
    // Editable by franchise admin
    city: "",
    state: "",
    pincode: "",
    registeredAddress: "",
    subscriptionPlan: "",
    expiryDate: ""
  })

  // Editable franchise fields state (only city, state, pincode, address)
  const [tempFranchiseFields, setTempFranchiseFields] = useState({
    city: "",
    state: "",
    pincode: "",
    address: ""
  })
  const [franchiseFieldsLoading, setFranchiseFieldsLoading] = useState(false)

  // Preferences state
  const [preferences, setPreferences] = useState({
    themeMode: "light"
  })



  // Fetch profile data from real API on mount
  useEffect(() => {
    const fetchAdminProfile = async () => {
      try {
        setLoading(true)

        // Call both APIs in parallel: admin profile (personal info) and franchise data
        const [profileRes, franchiseRes] = await Promise.all([
          adminAPI.getAdminProfile(),
          adminAPI.getMyFranchise().catch(() => null) // franchise admin only
        ])

        // ── Personal Info from user/profile ──
        const adminData = profileRes?.data?.admin || profileRes?.data?.data?.admin || profileRes?.data?.user
        if (adminData) {
          const names = (adminData.name || "").split(" ")
          const personalData = {
            firstName: adminData.firstName || names[0] || "",
            lastName: adminData.lastName || names.slice(1).join(" ") || "",
            email: adminData.email || "",
            phone: adminData.mobile || adminData.phone || "",
            alternatePhone: adminData.alternatePhone || "",
            dob: adminData.dob ? new Date(adminData.dob).toISOString().split('T')[0] : "",
            gender: adminData.gender ? adminData.gender.charAt(0).toUpperCase() + adminData.gender.slice(1).toLowerCase() : "",
            address: adminData.addressLine1 || adminData.address || "",
            city: adminData.city || "",
            state: adminData.state || "",
            pincode: adminData.pincode || "",
            createdAt: adminData.createdAt || ""
          }
          setPersonalInfo(personalData)
          setTempPersonalInfo(personalData)

          if (adminData.profileImage || adminData.profilePhoto) {
            setProfileImage(adminData.profileImage || adminData.profilePhoto)
          }

          if (adminData.preferences?.theme) {
            const t = adminData.preferences.theme.toLowerCase()
            setPreferences({ themeMode: t })
            localStorage.setItem("sa_themeMode", t)
            if (t === "dark") {
              document.documentElement.classList.add("dark")
            } else {
              document.documentElement.classList.remove("dark")
            }
          }
        }

        // ── Franchise Info from FoodFranchise document ──
        const fRes = franchiseRes?.data?.data || franchiseRes?.data
        const fData = fRes?.franchise
        if (fData) {
          const merged = {
            name: fData.name || "",
            ownerName: fData.ownerName || "",
            code: fData.franchiseCode || "",
            gstNumber: fData.gstNumber || "",
            panNumber: fData.panNumber || "",
            type: fData.type || "Single Store",
            totalStores: fData.totalStores ?? 0,
            franchiseDuration: fData.franchiseDuration ? `${fData.franchiseDuration} Years` : "",
            franchiseCost: fData.franchiseCost ?? 0,
            paidAmount: fData.paidAmount ?? 0,
            dueAmount: fData.dueAmount ?? 0,
            region: [fData.regionName, fData.zoneName, fData.territoryName].filter(Boolean).join(" / ") || fData.regionId || "",
            isActive: fData.isActive ?? true,
            // Editable fields — stored directly on franchise document
            city: fData.city || "",
            state: fData.state || "",
            pincode: fData.pincode || "",
            registeredAddress: fData.address || "",
            subscriptionPlan: fData.subscriptionPlan || "Standard",
            expiryDate: fData.expiryDate || ""
          }
          setFranchiseInfo(merged)
          setTempFranchiseFields({
            city: fData.city || "",
            state: fData.state || "",
            pincode: fData.pincode || "",
            address: fData.address || ""
          })
          
          setPersonalInfo(prev => ({
            ...prev,
            city: prev.city || fData.city || "",
            state: prev.state || fData.state || "",
            pincode: prev.pincode || fData.pincode || "",
            address: prev.address || fData.address || ""
          }))
          setTempPersonalInfo(prev => ({
            ...prev,
            city: prev.city || fData.city || "",
            state: prev.state || fData.state || "",
            pincode: prev.pincode || fData.pincode || "",
            address: prev.address || fData.address || ""
          }))
        }

      } catch (err) {
        console.error('Profile fetch error:', err)
        toast.error("Failed to fetch profile details")
      } finally {
        setLoading(false)
      }
    }
    fetchAdminProfile()
  }, [])

  // Save personal profile changes (PATCH /auth/admin/profile)
  const handleSaveProfile = async (e) => {
    e.preventDefault()
    const errors = {}
    if (!tempPersonalInfo.firstName.trim()) errors.firstName = "First Name is required"
    if (!tempPersonalInfo.lastName.trim()) errors.lastName = "Last Name is required"
    if (!tempPersonalInfo.email.trim()) errors.email = "Email Address is required"
    if (!tempPersonalInfo.phone.trim()) errors.phone = "Phone Number is required"

    if (Object.keys(errors).length > 0) {
      setPersonalErrors(errors)
      toast.error("Please fill in all required fields")
      return
    }

    try {
      setLoading(true)
      const payload = {
        name: `${tempPersonalInfo.firstName} ${tempPersonalInfo.lastName}`,
        phone: tempPersonalInfo.phone,
        alternatePhone: tempPersonalInfo.alternatePhone,
        dateOfBirth: tempPersonalInfo.dob,
        gender: tempPersonalInfo.gender,
        addressLine1: tempPersonalInfo.address,
        city: tempPersonalInfo.city,
        state: tempPersonalInfo.state,
        pincode: tempPersonalInfo.pincode
      }
      await adminAPI.updateAdminProfile(payload)
      setPersonalInfo({ ...tempPersonalInfo })
      toast.success("Profile updated successfully")
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile")
    } finally {
      setLoading(false)
    }
  }

  // Save editable franchise fields (city, state, pincode, address)
  const handleSaveFranchiseFields = async () => {
    try {
      setFranchiseFieldsLoading(true)
      await adminAPI.updateMyFranchise(tempFranchiseFields)
      setFranchiseInfo(prev => ({
        ...prev,
        city: tempFranchiseFields.city,
        state: tempFranchiseFields.state,
        pincode: tempFranchiseFields.pincode,
        registeredAddress: tempFranchiseFields.address
      }))
      toast.success("Franchise location details updated successfully")
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update franchise details")
    } finally {
      setFranchiseFieldsLoading(false)
    }
  }

  // Update Password (PUT /api/franchise-admin/change-password)
  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    const errors = {}
    if (!passwordState.currentPassword) errors.currentPassword = "Current password is required"
    if (!passwordState.newPassword) errors.newPassword = "New password is required"
    if (passwordState.newPassword.length < 6) errors.newPassword = "Password must be at least 6 characters"
    if (passwordState.newPassword !== passwordState.confirmPassword) errors.confirmPassword = "Passwords do not match"

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors)
      return
    }

    try {
      setLoading(true)
      await adminAPI.changePassword(passwordState.currentPassword, passwordState.newPassword)
      setShowPasswordSuccess(true)
      setPasswordState({ currentPassword: "", newPassword: "", confirmPassword: "" })
      setPasswordErrors({})
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update password. Check current password.")
    } finally {
      setLoading(false)
    }
  }

  // Handle Photo upload (POST /api/franchise-admin/profile-photo)
  const handlePhotoSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedPhotoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreviewUrl(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUploadPhoto = () => {
    if (!photoPreviewUrl) return
    setProfileImage(photoPreviewUrl)
    localStorage.setItem("admin_profile_image", photoPreviewUrl)
    setShowPhotoModal(false)
    setSelectedPhotoFile(null)
    setPhotoPreviewUrl("")
    toast.success("Profile photo updated successfully")
  }

  const handleRemovePhoto = () => {
    const fallbackImage = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"
    setProfileImage(fallbackImage)
    localStorage.removeItem("admin_profile_image")
    toast.success("Profile photo removed")
  }

  // Toggle Theme (Immediately updates DOM, localStorage, and Backend)
  const handleThemeToggle = async () => {
    const newTheme = preferences.themeMode === "light" ? "dark" : "light";
    
    // 1. Optimistic UI update
    setPreferences(prev => ({ ...prev, themeMode: newTheme }));
    localStorage.setItem("sa_themeMode", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    window.dispatchEvent(new Event("adminNotificationsUpdated"));

    // 2. Persist to backend
    try {
      const payload = {
        preferences: {
          theme: newTheme.toUpperCase()
        }
      }
      await adminAPI.updateAdminProfile(payload)
      toast.success("Theme preference saved")
    } catch (err) {
      toast.error("Failed to save theme preference")
    }
  }

  return (
    <div className="p-4 lg:p-6 bg-slate-50 dark:bg-zinc-950 min-h-screen text-slate-800 dark:text-zinc-100">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        
        {/* Header section */}
        <header className="flex flex-col gap-1.5">
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
            Profile Settings
          </h1>
          <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
            Manage your personal data, secure your credentials, and inspect franchise properties.
          </p>
        </header>

        {/* Outer Layout wrapper */}
        <div className="grid grid-cols-1 md:grid-cols-10 gap-6 items-start">
          
          {/* LEFT 30% SECTION: Profile Card */}
          <div className="md:col-span-3 flex flex-col gap-6">
            <Card className="flex flex-col items-center text-center">
              <div className="relative group mb-4">
                {/* Profile circular webp/image */}
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-zinc-100 dark:border-zinc-800 shadow-md">
                  <img
                    src={profileImage}
                    alt={`${personalInfo.firstName || "Admin"} ${personalInfo.lastName || ""}`.trim()}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  onClick={() => setShowPhotoModal(true)}
                  className="absolute bottom-0 right-0 p-1.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-full shadow-md transition-all scale-95 hover:scale-105"
                  aria-label="Upload Photo"
                >
                  <Camera size={14} />
                </button>
              </div>

              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                {personalInfo.firstName} {personalInfo.lastName}
              </h2>
              <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400 mt-0.5">
                {franchiseInfo.name}
              </p>

              {/* Badges */}
              <div className="flex gap-1.5 items-center justify-center mt-3 flex-wrap">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] dark:bg-[var(--primary)]/20">
                  Franchise Admin
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                  Active
                </span>
              </div>

              {/* Quick Details List */}
              <div className="w-full border-t border-zinc-100 dark:border-zinc-800 pt-4 mt-4 flex flex-col gap-2.5 text-left">
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-zinc-300">
                  <User size={13} className="opacity-60" />
                  <span className="truncate">{personalInfo.email}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-zinc-300">
                  <Clock size={13} className="opacity-60" />
                  <span>Joined: {personalInfo.createdAt ? new Date(personalInfo.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : "-"}</span>
                </div>
              </div>

              {/* Photo Action buttons */}
              <div className="flex gap-2 w-full mt-5">
                <Button variant="primary" onClick={() => setShowPhotoModal(true)} className="flex-1">
                  Change Photo
                </Button>
                <Button variant="outline" onClick={handleRemovePhoto} className="flex-1">
                  Remove
                </Button>
              </div>
            </Card>
          </div>

          {/* RIGHT 70% SECTION: tab selector & forms */}
          <div className="md:col-span-7 flex flex-col gap-6">
            
            {/* Horizontal Tabs Header Bar */}
            <div className="flex bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-1.5 rounded-xl shadow-sm overflow-x-auto scrollbar-none gap-1">
              {[
                { id: "personal", label: "Personal Information", icon: User },
                { id: "security", label: "Security & Credentials", icon: Shield },
                { id: "franchise", label: "Franchise Properties", icon: Landmark },
                { id: "preferences", label: "", icon: Settings, iconOnly: true }
              ].map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                      activeTab === tab.id
                        ? "bg-[var(--primary)] text-white shadow-sm"
                        : "text-slate-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <Icon size={14} className="shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>

            {/* TAB CONTENTS CONTAINER */}
            <div className="flex flex-col gap-6">

              {/* 1. PERSONAL INFORMATION TAB */}
              {activeTab === "personal" && (
                <Card>
                  <form onSubmit={handleSaveProfile} className="flex flex-col gap-5">
                    <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-3 mb-1">
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                        Personal Information
                      </h3>
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold">Editable Fields</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <InputField
                        label="First Name *"
                        id="firstName"
                        value={tempPersonalInfo.firstName}
                        onChange={(e) => setTempPersonalInfo({ ...tempPersonalInfo, firstName: e.target.value })}
                        error={personalErrors.firstName}
                      />
                      <InputField
                        label="Last Name *"
                        id="lastName"
                        value={tempPersonalInfo.lastName}
                        onChange={(e) => setTempPersonalInfo({ ...tempPersonalInfo, lastName: e.target.value })}
                        error={personalErrors.lastName}
                      />
                      <InputField
                        label="Email Address *"
                        id="email"
                        type="email"
                        value={tempPersonalInfo.email}
                        onChange={(e) => setTempPersonalInfo({ ...tempPersonalInfo, email: e.target.value })}
                        error={personalErrors.email}
                      />
                      <InputField
                        label="Phone Number *"
                        id="phone"
                        value={tempPersonalInfo.phone}
                        onChange={(e) => setTempPersonalInfo({ ...tempPersonalInfo, phone: e.target.value })}
                        error={personalErrors.phone}
                      />
                      <InputField
                        label="Alternate Number"
                        id="alternatePhone"
                        value={tempPersonalInfo.alternatePhone}
                        onChange={(e) => setTempPersonalInfo({ ...tempPersonalInfo, alternatePhone: e.target.value })}
                      />
                      <InputField
                        label="Date of Birth"
                        id="dob"
                        type="date"
                        value={tempPersonalInfo.dob}
                        onChange={(e) => setTempPersonalInfo({ ...tempPersonalInfo, dob: e.target.value })}
                      />
                      
                      <div className="flex flex-col gap-1 w-full">
                        <label htmlFor="gender" className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                          Gender
                        </label>
                        <select
                          id="gender"
                          value={tempPersonalInfo.gender}
                          onChange={(e) => setTempPersonalInfo({ ...tempPersonalInfo, gender: e.target.value })}
                          className="text-sm px-3.5 py-2 border border-zinc-200 dark:border-zinc-850 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <InputField
                        label="Pincode"
                        id="pincode"
                        value={tempPersonalInfo.pincode}
                        onChange={(e) => setTempPersonalInfo({ ...tempPersonalInfo, pincode: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2">
                        <InputField
                          label="Address"
                          id="address"
                          value={tempPersonalInfo.address}
                          onChange={(e) => setTempPersonalInfo({ ...tempPersonalInfo, address: e.target.value })}
                        />
                      </div>
                      <InputField
                        label="City"
                        id="city"
                        value={tempPersonalInfo.city}
                        onChange={(e) => setTempPersonalInfo({ ...tempPersonalInfo, city: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <InputField
                        label="State"
                        id="state"
                        value={tempPersonalInfo.state}
                        onChange={(e) => setTempPersonalInfo({ ...tempPersonalInfo, state: e.target.value })}
                      />
                    </div>

                    <div className="flex justify-end gap-3 border-t border-zinc-100 dark:border-zinc-850 pt-4 mt-2">
                      <Button variant="outline" onClick={() => setTempPersonalInfo({ ...personalInfo })}>
                        Cancel
                      </Button>
                      <Button type="submit" variant="primary" disabled={loading}>
                        {loading ? <Loader2 size={12} className="animate-spin" /> : "Save Changes"}
                      </Button>
                    </div>
                  </form>
                </Card>
              )}

              {/* 2. SECURITY & CREDENTIALS TAB */}
              {activeTab === "security" && (
                <div className="flex flex-col gap-6">
                  
                  {/* Change Password Card */}
                  <Card>
                    <form onSubmit={handleUpdatePassword} className="flex flex-col gap-4">
                      <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800 mb-1">
                        <Key size={16} className="text-[var(--primary)]" />
                        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                          Change Password
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <InputField
                          label="Current Password *"
                          id="currentPassword"
                          type="password"
                          value={passwordState.currentPassword}
                          onChange={(e) => setPasswordState({ ...passwordState, currentPassword: e.target.value })}
                          error={passwordErrors.currentPassword}
                        />
                        <InputField
                          label="New Password *"
                          id="newPassword"
                          type="password"
                          value={passwordState.newPassword}
                          onChange={(e) => setPasswordState({ ...passwordState, newPassword: e.target.value })}
                          error={passwordErrors.newPassword}
                        />
                        <InputField
                          label="Confirm Password *"
                          id="confirmPassword"
                          type="password"
                          value={passwordState.confirmPassword}
                          onChange={(e) => setPasswordState({ ...passwordState, confirmPassword: e.target.value })}
                          error={passwordErrors.confirmPassword}
                        />
                      </div>

                      <div className="flex justify-end pt-2">
                        <Button type="submit" variant="secondary" disabled={loading}>
                          {loading ? <Loader2 size={12} className="animate-spin" /> : "Update Password"}
                        </Button>
                      </div>
                    </form>
                  </Card>




                </div>
              )}

              {/* 3. FRANCHISE PROPERTIES TAB (Read Only) */}
              {activeTab === "franchise" && (
                <Card>
                  <div className="flex flex-col gap-5">
                    <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800 mb-1">
                      <Landmark size={16} className="text-[var(--primary)]" />
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                        Franchise Details & Registration
                      </h3>
                    </div>

                    {/* Read-only section: set by SuperAdmin */}
                    <div className="mb-2">
                      <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-3">
                        Set by Super Admin — Read Only
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        {[
                          { label: "Franchise Name", value: franchiseInfo.name || "—" },
                          { label: "Franchise Code", value: franchiseInfo.code || "—" },
                          { label: "Owner / Director", value: franchiseInfo.ownerName || "—" },
                          { label: "GST Number", value: franchiseInfo.gstNumber || "—" },
                          { label: "PAN Number", value: franchiseInfo.panNumber || "—" },
                          { label: "Franchise Type", value: franchiseInfo.type || "—" },
                          { label: "Registered Region / Zone / Territory", value: franchiseInfo.region || "—" },
                          { label: "Total Stores Mapped", value: `${franchiseInfo.totalStores ?? 0} Store(s)` },
                          { label: "Franchise Duration", value: franchiseInfo.franchiseDuration || "—" },
                          { label: "Franchise Cost", value: franchiseInfo.franchiseCost ? `₹${Number(franchiseInfo.franchiseCost).toLocaleString("en-IN")}` : "—" },
                          { label: "Amount Paid", value: franchiseInfo.paidAmount ? `₹${Number(franchiseInfo.paidAmount).toLocaleString("en-IN")}` : "—" },
                          { label: "Due Amount", value: franchiseInfo.dueAmount ? `₹${Number(franchiseInfo.dueAmount).toLocaleString("en-IN")}` : "₹0" },
                        ].map((item, idx) => (
                          <div key={idx} className="flex flex-col gap-1 p-3 bg-zinc-50 dark:bg-zinc-950/40 rounded-lg border border-zinc-100 dark:border-zinc-850">
                            <span className="font-bold text-slate-450 dark:text-zinc-500 uppercase tracking-wider text-[9px]">{item.label}</span>
                            <span className={`font-normal text-sm ${item.value === "—" ? "text-slate-400 dark:text-zinc-600" : "text-slate-900 dark:text-white"}`}>{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>


                  </div>
                </Card>
              )}



              {/* 4. PREFERENCES TAB */}
              {activeTab === "preferences" && (
                <Card>
                  <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800 mb-1">
                      <Settings size={16} className="text-[var(--primary)]" />
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                        System Preferences
                      </h3>
                    </div>

                    {/* Theme Preference Toggle */}
                    <div className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-950/40 rounded-lg border border-zinc-100 dark:border-zinc-850 text-xs">
                      <div>
                        <p className="font-extrabold text-slate-900 dark:text-white text-sm">Theme Settings</p>
                        <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">Toggle light or dark interface styling across all page panels</p>
                      </div>
                      
                      <button
                        onClick={handleThemeToggle}
                        className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
                          preferences.themeMode === "dark" ? "bg-[var(--primary)]" : "bg-zinc-300 dark:bg-zinc-700"
                        }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                            preferences.themeMode === "dark" ? "translate-x-5.5" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>

                  </div>
                </Card>
              )}



            </div>

          </div>

        </div>

      </div>

      {/* CHANGE PROFILE PICTURE MODAL */}
      {showPhotoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 rounded-xl shadow-2xl max-w-md w-full p-6 animate-scale-up">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mb-4">
              Change Profile Picture
            </h3>

            <div className="flex flex-col items-center gap-4 py-4 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950/40">
              {photoPreviewUrl ? (
                <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-[var(--primary)] shadow-md">
                  <img src={photoPreviewUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-zinc-200 dark:border-zinc-800 bg-zinc-150 dark:bg-zinc-900 flex items-center justify-center text-zinc-400">
                  <Upload size={32} />
                </div>
              )}

              <div className="flex flex-col items-center gap-1.5">
                <label className="cursor-pointer bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow transition-all active:scale-95">
                  Choose Image File
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                </label>
                <span className="text-[9px] text-zinc-400 font-semibold">Supports JPEG, PNG or WebP formats</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPhotoModal(false)
                  setSelectedPhotoFile(null)
                  setPhotoPreviewUrl("")
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleUploadPhoto}
                disabled={!photoPreviewUrl}
              >
                Upload Photo
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CHANGE PASSWORD SUCCESS MODAL */}
      {showPasswordSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 rounded-xl shadow-2xl max-w-sm w-full p-6 text-center animate-scale-up">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={24} />
            </div>
            
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mb-2">
              Password Updated Successfully
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mb-6">
              Your login credentials have been changed. Use your new password to sign in next time.
            </p>

            <Button variant="primary" onClick={() => setShowPasswordSuccess(false)} className="w-full">
              Done
            </Button>
          </div>
        </div>
      )}



    </div>
  )
}
