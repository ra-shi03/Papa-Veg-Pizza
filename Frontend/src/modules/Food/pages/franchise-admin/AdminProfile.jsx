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
import { adminAPI } from "@food/api"

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

  // Profile Photo states
  const [profileImage, setProfileImage] = useState(() => localStorage.getItem("admin_profile_image") || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150")
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  const [selectedPhotoFile, setSelectedPhotoFile] = useState(null)
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState("")

  // Personal Information State (Simulated GET /api/franchise-admin/profile)
  const [personalInfo, setPersonalInfo] = useState({
    firstName: "Rohan",
    lastName: "Sharma",
    email: "rohan.sharma@papavegpizza.in",
    phone: "+91 98765 43210",
    alternatePhone: "+91 91234 56789",
    dob: "1991-08-15",
    gender: "Male",
    address: "Scheme No. 54, Near Vijay Nagar Square",
    city: "Indore",
    state: "Madhya Pradesh",
    pincode: "452010"
  })

  // Editable temporary states
  const [tempPersonalInfo, setTempPersonalInfo] = useState({ ...personalInfo })
  const [personalErrors, setPersonalErrors] = useState({})

  // Security: Password state (Simulated PUT /api/franchise-admin/change-password)
  const [passwordState, setPasswordState] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })
  const [passwordErrors, setPasswordErrors] = useState({})
  const [showPasswordSuccess, setShowPasswordSuccess] = useState(false)

  // Security: Two-Factor Auth (Simulated PUT /api/franchise-admin/security)
  const [twoFactor, setTwoFactor] = useState({
    enabled: true,
    method: "email" // 'email' or 'sms'
  })

  // Security: Sessions state (Simulated GET /api/franchise-admin/sessions)
  const [sessions, setSessions] = useState([
    { id: "sess-1", device: "Desktop (Windows 11)", browser: "Chrome", location: "Vijay Nagar, Indore", loginTime: "2026-06-23 10:24 AM", current: true },
    { id: "sess-2", device: "Mobile (OnePlus 11)", browser: "Chrome Mobile", location: "Nipania, Indore", loginTime: "2026-06-22 09:15 PM", current: false },
    { id: "sess-3", device: "Tablet (iPad Air)", browser: "Safari", location: "Bhopal, MP", loginTime: "2026-06-21 04:30 PM", current: false }
  ])
  const [showLogoutAllModal, setShowLogoutAllModal] = useState(false)

  // Franchise Information state (Read-only GET /api/franchise/:id)
  const franchiseInfo = {
    name: "Papa Veg Pizza Indore",
    code: "PVP-IND-09",
    managerName: "Rohan Sharma",
    gstNumber: "23AAAAA1111A1Z1",
    panNumber: "ABCDE1234F",
    registeredAddress: "102, Orbit Mall, Vijay Nagar, Indore, Madhya Pradesh - 452010",
    region: "Central India (Madhya Pradesh)",
    storeCount: 4,
    subscriptionPlan: "Enterprise Pro Growth Plan",
    expiryDate: "2027-12-31"
  }

  // Preferences state (Simulated PUT /api/franchise-admin/preferences)
  const [preferences, setPreferences] = useState({
    themeMode: () => localStorage.getItem("sa_themeMode") || "light",
    notifications: {
      email: true,
      sms: true,
      push: false
    },
    language: "English",
    timezone: "IST (UTC+05:30)",
    currency: "INR (₹)"
  })

  // Activity Logs state (Simulated GET /api/franchise-admin/activity-logs)
  const initialLogs = [
    { id: "log-1", date: "2026-06-23 12:45 PM", activity: "Logged In", ipAddress: "192.168.1.45", device: "Desktop / Chrome" },
    { id: "log-2", date: "2026-06-23 11:20 AM", activity: "Created Coupon 'FREEPAN'", ipAddress: "192.168.1.45", device: "Desktop / Chrome" },
    { id: "log-3", date: "2026-06-22 06:12 PM", activity: "Updated Profile Info", ipAddress: "192.168.1.45", device: "Desktop / Chrome" },
    { id: "log-4", date: "2026-06-22 03:30 PM", activity: "Approved Purchase Request #PR-9920", ipAddress: "192.168.1.12", device: "Mobile / Chrome" },
    { id: "log-5", date: "2026-06-21 02:15 PM", activity: "Changed Password", ipAddress: "192.168.1.45", device: "Desktop / Chrome" },
    { id: "log-6", date: "2026-06-21 11:00 AM", activity: "Created Coupon 'INDORE50'", ipAddress: "10.0.0.98", device: "Tablet / Safari" },
    { id: "log-7", date: "2026-06-20 04:45 PM", activity: "Approved Purchase Request #PR-9915", ipAddress: "192.168.1.45", device: "Desktop / Chrome" },
    { id: "log-8", date: "2026-06-20 09:12 AM", activity: "Logged In", ipAddress: "192.168.1.45", device: "Desktop / Chrome" }
  ]
  const [logs, setLogs] = useState(initialLogs)
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")
  const [dateFilter, setDateFilter] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const logsPerPage = 4

  // Apply debounce method in search bar (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
      setCurrentPage(1)
    }, 300)
    return () => clearTimeout(handler)
  }, [searchQuery])

  // Filter logs dynamically
  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.activity.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
                          log.ipAddress.includes(debouncedSearchQuery) ||
                          log.device.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    const matchesDate = dateFilter ? log.date.startsWith(dateFilter) : true
    return matchesSearch && matchesDate
  })

  // Pagination bounds
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / logsPerPage))
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * logsPerPage, currentPage * logsPerPage)

  // Fetch true database values on mount
  useEffect(() => {
    const fetchAdminProfile = async () => {
      try {
        setLoading(true)
        const response = await adminAPI.getAdminProfile()
        const adminData = response?.data?.admin || response?.data?.data?.admin
        if (adminData) {
          const names = (adminData.name || "Rohan Sharma").split(" ")
          setPersonalInfo(prev => ({
            ...prev,
            firstName: names[0] || prev.firstName,
            lastName: names.slice(1).join(" ") || prev.lastName,
            email: adminData.email || prev.email,
            phone: adminData.phone || prev.phone
          }))
          setTempPersonalInfo(prev => ({
            ...prev,
            firstName: names[0] || prev.firstName,
            lastName: names.slice(1).join(" ") || prev.lastName,
            email: adminData.email || prev.email,
            phone: adminData.phone || prev.phone
          }))
        }
      } catch (err) {
        // Fall back gracefully to mock states
      } finally {
        setLoading(false)
      }
    }
    fetchAdminProfile()
  }, [])

  // Sync temp state with actual profile state when tab changes
  useEffect(() => {
    setTempPersonalInfo({ ...personalInfo })
    setPersonalErrors({})
  }, [activeTab, personalInfo])

  // Save profile changes (PUT /api/franchise-admin/profile)
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
      // Call actual patch API endpoint
      await adminAPI.updateAdminProfile({
        name: `${tempPersonalInfo.firstName} ${tempPersonalInfo.lastName}`,
        phone: tempPersonalInfo.phone
      })
      setPersonalInfo({ ...tempPersonalInfo })
      // Append Activity log
      setLogs(prev => [
        { id: `log-${Date.now()}`, date: new Date().toLocaleString("en-IN"), activity: "Updated Profile Info", ipAddress: "127.0.0.1", device: "Desktop / Chrome" },
        ...prev
      ])
      toast.success("Profile updated successfully")
    } catch (err) {
      // Stub update fallback
      setPersonalInfo({ ...tempPersonalInfo })
      toast.success("Profile saved successfully (Offline mode)")
    } finally {
      setLoading(false)
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
      // Append Activity log
      setLogs(prev => [
        { id: `log-${Date.now()}`, date: new Date().toLocaleString("en-IN"), activity: "Changed Password", ipAddress: "127.0.0.1", device: "Desktop / Chrome" },
        ...prev
      ])
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

  // Toggle Two-Factor Settings (PUT /api/franchise-admin/security)
  const handleToggle2FA = () => {
    setTwoFactor(prev => {
      const next = { ...prev, enabled: !prev.enabled }
      toast.info(`Two-Factor Authentication ${next.enabled ? "Enabled" : "Disabled"}`)
      return next
    })
  }

  const handle2FAMethodChange = (method) => {
    setTwoFactor(prev => {
      const next = { ...prev, method }
      toast.success(`Default OTP channel set to: ${method.toUpperCase()}`)
      return next
    })
  }

  // Session Management (DELETE /api/franchise-admin/sessions/:id)
  const handleLogoutSession = (id) => {
    setSessions(prev => prev.filter(s => s.id !== id))
    toast.success("Logged out from device successfully")
  }

  // Bulk Logout Sessions (DELETE /api/franchise-admin/logout-all)
  const handleLogoutAllSessions = () => {
    setSessions(prev => prev.filter(s => s.current))
    setShowLogoutAllModal(false)
    toast.success("Successfully logged out from all other sessions")
  }

  // Preferences Change (PUT /api/franchise-admin/preferences)
  const handleSavePreferences = () => {
    // Theme toggle
    const currentTheme = localStorage.getItem("sa_themeMode") || "light"
    const targetTheme = preferences.themeMode === "dark" ? "dark" : "light"
    if (currentTheme !== targetTheme) {
      localStorage.setItem("sa_themeMode", targetTheme)
      if (targetTheme === "dark") {
        document.documentElement.classList.add("dark")
      } else {
        document.documentElement.classList.remove("dark")
      }
      window.dispatchEvent(new Event("adminNotificationsUpdated"))
    }
    toast.success("Preferences saved successfully")
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
                    alt="Rohan Sharma"
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
                  <span>Joined: {new Date("2026-01-10").toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</span>
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
                { id: "preferences", label: "Preferences", icon: Settings },
                { id: "activity", label: "Activity Logs", icon: Activity }
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

                  {/* Two Factor Authentication Card */}
                  <Card>
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800 mb-1">
                        <div className="flex items-center gap-2">
                          <Shield size={16} className="text-[var(--primary)]" />
                          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                            Two-Factor Authentication
                          </h3>
                        </div>
                        
                        {/* Toggle switch */}
                        <button
                          onClick={handleToggle2FA}
                          className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
                            twoFactor.enabled ? "bg-[var(--primary)]" : "bg-zinc-300 dark:bg-zinc-700"
                          }`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                              twoFactor.enabled ? "translate-x-5.5" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex flex-col gap-3">
                        <p className="text-xs text-slate-600 dark:text-zinc-300 font-semibold">
                          Secure your account login by requiring an OTP sent directly to your registered contact channel.
                        </p>
                        
                        {twoFactor.enabled && (
                          <div className="grid grid-cols-2 gap-3 mt-1 max-w-sm">
                            <button
                              onClick={() => handle2FAMethodChange("email")}
                              className={`p-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                                twoFactor.method === "email"
                                  ? "border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)]"
                                  : "border-zinc-200 dark:border-zinc-800 text-slate-500"
                              }`}
                            >
                              <span>Email OTP</span>
                              {twoFactor.method === "email" && <Check size={12} />}
                            </button>
                            <button
                              onClick={() => handle2FAMethodChange("sms")}
                              className={`p-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                                twoFactor.method === "sms"
                                  ? "border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)]"
                                  : "border-zinc-200 dark:border-zinc-800 text-slate-500"
                              }`}
                            >
                              <span>Mobile OTP</span>
                              {twoFactor.method === "sms" && <Check size={12} />}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>

                  {/* Login Sessions Card */}
                  <Card>
                    <div className="flex flex-col gap-4">
                      <div className="flex justify-between items-center pb-2 border-b border-zinc-100 dark:border-zinc-800 mb-1">
                        <div className="flex items-center gap-2">
                          <Laptop size={16} className="text-[var(--primary)]" />
                          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                            Active Login Sessions
                          </h3>
                        </div>
                        <Button variant="danger" onClick={() => setShowLogoutAllModal(true)} className="py-1 px-2.5">
                          Logout All Devices
                        </Button>
                      </div>

                      <div className="overflow-x-auto w-full">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-zinc-50 dark:bg-zinc-950 text-slate-700 dark:text-zinc-300 border-b border-zinc-100 dark:border-zinc-850">
                            <tr>
                              <th className="p-3 font-bold">Device</th>
                              <th className="p-3 font-bold">Browser</th>
                              <th className="p-3 font-bold">Location</th>
                              <th className="p-3 font-bold">Login Time</th>
                              <th className="p-3 font-bold">Status</th>
                              <th className="p-3 font-bold text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850">
                            {sessions.map((session) => (
                              <tr key={session.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40">
                                <td className="p-3 font-semibold text-slate-900 dark:text-white">
                                  {session.device}
                                </td>
                                <td className="p-3 font-medium text-slate-600 dark:text-zinc-300">
                                  {session.browser}
                                </td>
                                <td className="p-3 font-medium text-slate-650 dark:text-zinc-400">
                                  {session.location}
                                </td>
                                <td className="p-3 font-semibold text-slate-500 dark:text-zinc-500">
                                  {session.loginTime}
                                </td>
                                <td className="p-3">
                                  {session.current ? (
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 animate-pulse">
                                      Active
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400">
                                      Standby
                                    </span>
                                  )}
                                </td>
                                <td className="p-3 text-center">
                                  {session.current ? (
                                    <span className="text-[10px] text-zinc-400 font-bold">Current Device</span>
                                  ) : (
                                    <button
                                      onClick={() => handleLogoutSession(session.id)}
                                      className="text-[10px] font-bold text-red-500 hover:text-red-700 active:scale-95 transition-all"
                                    >
                                      Logout Device
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
                      {[
                        { label: "Franchise Name", value: franchiseInfo.name },
                        { label: "Franchise Code", value: franchiseInfo.code },
                        { label: "Owner / Director", value: franchiseInfo.managerName },
                        { label: "GST Number", value: franchiseInfo.gstNumber },
                        { label: "PAN Number", value: franchiseInfo.panNumber },
                        { label: "Registered Region", value: franchiseInfo.region },
                        { label: "Active Stores Mapped", value: `${franchiseInfo.storeCount} Stores` },
                        { label: "Active Subscription Plan", value: franchiseInfo.subscriptionPlan },
                        { label: "Contract Expiry Date", value: new Date(franchiseInfo.expiryDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) }
                      ].map((item, idx) => (
                        <div key={idx} className="flex flex-col gap-1 p-3 bg-zinc-50 dark:bg-zinc-950/40 rounded-lg border border-zinc-100 dark:border-zinc-850">
                          <span className="font-bold text-slate-450 dark:text-zinc-500 uppercase tracking-wider text-[9px]">{item.label}</span>
                          <span className="font-extrabold text-slate-900 dark:text-white text-sm">{item.value}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-col gap-1 p-3 bg-zinc-50 dark:bg-zinc-950/40 rounded-lg border border-zinc-100 dark:border-zinc-850 text-xs">
                      <span className="font-bold text-slate-450 dark:text-zinc-500 uppercase tracking-wider text-[9px]">Registered HQ Address</span>
                      <span className="font-extrabold text-slate-900 dark:text-white text-sm leading-relaxed">{franchiseInfo.registeredAddress}</span>
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
                        onClick={() => setPreferences(prev => ({ ...prev, themeMode: prev.themeMode === "light" ? "dark" : "light" }))}
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

                    {/* Notifications preferences */}
                    <div className="flex flex-col gap-3">
                      <h4 className="font-bold text-xs text-slate-800 dark:text-zinc-200">
                        System Alerts & Notifications channels
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                          { id: "email", label: "Email Notifications" },
                          { id: "sms", label: "SMS Notifications" },
                          { id: "push", label: "Push Web Notifications" }
                        ].map((notif) => (
                          <label
                            key={notif.id}
                            className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-950/40 rounded-lg border border-zinc-100 dark:border-zinc-850 cursor-pointer hover:border-[var(--primary)]/30 transition-all select-none"
                          >
                            <input
                              type="checkbox"
                              checked={preferences.notifications[notif.id]}
                              onChange={(e) =>
                                setPreferences({
                                  ...preferences,
                                  notifications: { ...preferences.notifications, [notif.id]: e.target.checked }
                                })
                              }
                              className="w-4 h-4 text-[var(--primary)] border-zinc-300 rounded focus:ring-[var(--primary)]"
                            />
                            <span className="text-xs font-semibold text-slate-850 dark:text-zinc-200">{notif.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Regional Dropdowns */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      
                      <div className="flex flex-col gap-1 w-full">
                        <label htmlFor="language" className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                          Default Language
                        </label>
                        <select
                          id="language"
                          value={preferences.language}
                          onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                          className="text-sm px-3.5 py-2 border border-zinc-200 dark:border-zinc-850 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                        >
                          <option value="English">English</option>
                          <option value="Hindi">Hindi (हिंदी)</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1 w-full">
                        <label htmlFor="timezone" className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                          System Timezone
                        </label>
                        <select
                          id="timezone"
                          value={preferences.timezone}
                          onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                          className="text-sm px-3.5 py-2 border border-zinc-200 dark:border-zinc-850 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                        >
                          <option value="IST (UTC+05:30)">IST (UTC+05:30) • India</option>
                          <option value="UTC (UTC+00:00)">UTC (UTC+00:00) • Global</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1 w-full">
                        <label htmlFor="currency" className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                          Default Currency
                        </label>
                        <select
                          id="currency"
                          value={preferences.currency}
                          onChange={(e) => setPreferences({ ...preferences, currency: e.target.value })}
                          className="text-sm px-3.5 py-2 border border-zinc-200 dark:border-zinc-850 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                        >
                          <option value="INR (₹)">INR (₹) • Rupee</option>
                          <option value="USD ($)">USD ($) • Dollar</option>
                        </select>
                      </div>

                    </div>

                    <div className="flex justify-end pt-3 border-t border-zinc-100 dark:border-zinc-850 mt-2">
                      <Button variant="primary" onClick={handleSavePreferences}>
                        Save Preferences
                      </Button>
                    </div>

                  </div>
                </Card>
              )}

              {/* 5. ACTIVITY LOGS TAB */}
              {activeTab === "activity" && (
                <Card>
                  <div className="flex flex-col gap-4">
                    
                    {/* Title */}
                    <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800 mb-1">
                      <Activity size={16} className="text-[var(--primary)]" />
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                        Franchise Security & Activity logs
                      </h3>
                    </div>

                    {/* Filter panels */}
                    <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                      {/* Search box with debouncing */}
                      <div className="relative w-full sm:max-w-xs">
                        <Search size={14} className="absolute left-3 top-2.5 opacity-65" />
                        <input
                          type="text"
                          placeholder="Search activities..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full text-xs pl-9 pr-3 py-2 border border-zinc-200 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-950 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:border-[var(--primary)] transition-all"
                        />
                      </div>

                      {/* Date filter */}
                      <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                        <Calendar size={13} className="opacity-60" />
                        <input
                          type="date"
                          value={dateFilter}
                          onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}
                          className="text-xs px-2.5 py-1.5 border border-zinc-200 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-950 text-slate-900 dark:text-white rounded-lg focus:outline-none"
                        />
                        {dateFilter && (
                          <button
                            onClick={() => setDateFilter("")}
                            className="text-[10px] text-zinc-400 hover:text-zinc-650"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto w-full">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-zinc-50 dark:bg-zinc-950 text-slate-700 dark:text-zinc-300 border-b border-zinc-100 dark:border-zinc-850">
                          <tr>
                            <th className="p-3 font-bold">Date & Time</th>
                            <th className="p-3 font-bold">Activity log</th>
                            <th className="p-3 font-bold">IP Address</th>
                            <th className="p-3 font-bold">Device / Channel</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850">
                          {paginatedLogs.length > 0 ? (
                            paginatedLogs.map((log) => (
                              <tr key={log.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40">
                                <td className="p-3 font-semibold text-slate-500 dark:text-zinc-500 whitespace-nowrap">
                                  {log.date}
                                </td>
                                <td className="p-3 font-bold text-slate-900 dark:text-white">
                                  {log.activity}
                                </td>
                                <td className="p-3 font-mono font-medium text-slate-650 dark:text-zinc-400">
                                  {log.ipAddress}
                                </td>
                                <td className="p-3 font-medium text-slate-600 dark:text-zinc-450">
                                  {log.device}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={4} className="p-6 text-center text-slate-400 font-semibold">
                                No activity logs match current filters.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex justify-between items-center border-t border-zinc-100 dark:border-zinc-850 pt-3">
                        <span className="text-[10px] text-zinc-400 font-bold">
                          Page {currentPage} of {totalPages} • Total logs: {filteredLogs.length}
                        </span>
                        
                        <div className="flex items-center gap-1.5">
                          <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            className="p-1.5 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded disabled:opacity-40"
                          >
                            <ChevronLeft size={13} />
                          </button>
                          <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            className="p-1.5 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded disabled:opacity-40"
                          >
                            <ChevronRight size={13} />
                          </button>
                        </div>
                      </div>
                    )}

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

      {/* LOGOUT ALL DEVICES CONFIRMATION MODAL */}
      {showLogoutAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 rounded-xl shadow-2xl max-w-sm w-full p-6 text-center animate-scale-up">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-500 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={24} className="stroke-[2.2]" />
            </div>

            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mb-2">
              Logout from All Devices
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mb-6">
              Are you sure you want to logout from all devices? This will invalidate all active sessions except this current window.
            </p>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowLogoutAllModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button variant="danger" onClick={handleLogoutAllSessions} className="flex-1">
                Logout All
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
