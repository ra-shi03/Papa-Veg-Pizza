import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { clearModuleAuth, getModuleRefreshToken } from "@food/utils/auth"
import { Menu, Bell, Store, ChevronDown, User, LogOut, Settings as SettingsIcon, AlertCircle, X, Loader2, Save } from "lucide-react"
import Profile from "../profile/Profile"
import { adminAPI } from "@food/api"
import { toast } from "sonner"

export default function Navbar({ onToggleSidebar, isCollapsed }) {
  const navigate = useNavigate()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [selectedFranchise, setSelectedFranchise] = useState("All Franchises")
  const [showStoreDropdown, setShowStoreDropdown] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  
  const [franchises, setFranchises] = useState([])
  const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" })
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  useEffect(() => {
    const fetchFranchises = async () => {
      try {
        const response = await adminAPI.getFranchises()
        if (response?.data?.data) {
          setFranchises(response.data.data)
        }
      } catch (err) {
        console.error("Failed to fetch franchises:", err)
      }
    }
    fetchFranchises()
  }, [])

  const handleLogout = async () => {
    try {
      const token = getModuleRefreshToken("admin")
      if (token) {
        await adminAPI.logout(token).catch(() => null)
      }
    } catch (err) {
      console.error("Logout error", err)
    } finally {
      clearModuleAuth("superadmin")
      navigate("/superadmin/login", { replace: true })
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      return toast.error("Please fill in all fields")
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return toast.error("Passwords do not match")
    }
    setIsChangingPassword(true)
    try {
      await adminAPI.changeAdminPassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword
      })
      toast.success("Password updated successfully!")
      setShowSettingsModal(false)
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update password")
    } finally {
      setIsChangingPassword(false)
    }
  }
  
  const notifications = [
    { id: 1, text: "Low stock: Cheese at Indore Central", time: "5m ago", type: "error" },
    { id: 2, text: "Rider #R440 reported for misconduct", time: "12m ago", type: "warning" },
    { id: 3, text: "Failed payment gateway recovered", time: "45m ago", type: "success" }
  ]

  return (
    <header className={`fixed top-0 left-0 w-full flex justify-between lg:justify-end items-center px-4 md:px-6 h-13 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-805 z-40 shadow-sm transition-all duration-300 ${isCollapsed ? "lg:pl-[88px]" : "lg:pl-[296px]"}`}>
      
      {/* Left side: Brand + Toggle */}
      <div className="flex items-center gap-3 lg:hidden">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 -ml-1.5 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all duration-200"
          aria-label="Toggle Sidebar"
        >
          <Menu size={20} className="stroke-[2.2]" />
        </button>
        
        <h1 className="text-base md:text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
          Papa Veg Pizza
          <span className="hidden xs:inline-block text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] tracking-wide">
            SuperAdmin
          </span>
        </h1>
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-2.5 md:gap-4">
        
        {/* Store Selector */}
        <div className="relative">
          <button
            onClick={() => {
              setShowStoreDropdown(!showStoreDropdown)
              setShowProfileMenu(false)
              setShowNotifications(false)
            }}
            className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:border-zinc-200 text-[11px] font-semibold shadow-sm transition-all max-w-[150px] truncate"
          >
            <Store size={13} className="text-zinc-400 shrink-0" />
            <span className="truncate">{selectedFranchise}</span>
            <ChevronDown size={13} className={`text-zinc-400 transition-transform duration-200 shrink-0 ${showStoreDropdown ? "rotate-180" : ""}`} />
          </button>
          
          {showStoreDropdown && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-xl py-1.5 z-50 animate-fade-down max-h-64 overflow-y-auto">
              <button
                onClick={() => {
                  setSelectedFranchise("All Franchises")
                  setShowStoreDropdown(false)
                }}
                className={`w-full text-left px-4 py-2 text-xs font-medium transition-colors ${
                  selectedFranchise === "All Franchises"
                    ? "text-[var(--primary)] bg-[var(--primary)]/5 font-semibold"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                All Franchises
              </button>
              {franchises.map((f) => (
                <button
                  key={f._id}
                  onClick={() => {
                    setSelectedFranchise(f.name)
                    setShowStoreDropdown(false)
                  }}
                  className={`w-full text-left px-4 py-2 text-xs font-medium transition-colors ${
                    selectedFranchise === f.name
                      ? "text-[var(--primary)] bg-[var(--primary)]/5 font-semibold"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200"
                  }`}
                >
                  {f.name}
                  {f.regionId && <span className="text-[10px] opacity-70 ml-1">({typeof f.regionId === "object" ? f.regionId.name : f.regionId})</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications Button */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications)
              setShowProfileMenu(false)
              setShowStoreDropdown(false)
            }}
            className="relative p-1.5 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all shadow-sm bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800"
          >
            <Bell size={18} className="stroke-[2.2]" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-rose-500 rounded-full ring-2 ring-white dark:ring-zinc-950"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-xl p-3 z-50 animate-fade-down">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-50 dark:border-zinc-800 mb-3">
                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Alerts & Notifications</span>
                <span className="text-[9px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/30 px-1.5 py-0.5 rounded-full">3 NEW</span>
              </div>
              <div className="space-y-2.5 max-h-64 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className="flex gap-2.5 items-start p-1.5 rounded-xl bg-zinc-50/50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                    <AlertCircle size={14} className={`flex-shrink-0 mt-0.5 ${
                      n.type === "error" ? "text-rose-500" : n.type === "warning" ? "text-amber-500" : "text-emerald-500"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 leading-tight break-words">{n.text}</p>
                      <span className="text-[9px] text-zinc-400 font-medium">{n.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu)
              setShowNotifications(false)
              setShowStoreDropdown(false)
            }}
            className="flex items-center gap-1.5 focus:outline-none"
          >
            <div className="w-7 h-7 rounded-full border-2 border-[var(--primary)] overflow-hidden shadow-md cursor-pointer hover:opacity-90 transition-all duration-300">
              <img
                alt="Admin Avatar"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCyTJC4OO-eGJVNjjb4yu3RwW1CHmsdUnmNvzCxwh1GMYrxc2ifmYWzxNA-GaOcN1ERysPYhM8nKsd24T7DlBSABYEcaxK3S8lgQBbPtk9eZRLUzoybN2PEoeIKDNa5doorrP_NWzvgE6mNV_JhnyQqeW7FX4JVhWNGJwNX9UHFxa1PRV0WyRGZshEAFRhmaz7Arw2x2mUGbkefOsqkuDdPNuv17QRvI5X1KkTDkwjGac6bRQaDVlfVGNZ0D0GbHMMobuuzQHSR8gI"
              />
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-xl py-2 z-50 animate-fade-down">
              <div className="px-3.5 py-2 border-b border-zinc-50 dark:border-zinc-800 mb-1.5">
                <p className="text-xs font-bold text-zinc-800 dark:text-zinc-100">Global Manager</p>
                <p className="text-[10px] text-zinc-400 truncate">manager@papaveg.com</p>
              </div>
              <button 
                onClick={() => {
                  setShowProfileMenu(false)
                  setShowProfileModal(true)
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
              >
                <User size={14} className="text-zinc-400" />
                <span>My Profile</span>
              </button>
              <button 
                onClick={() => {
                  setShowProfileMenu(false)
                  setShowSettingsModal(true)
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
              >
                <SettingsIcon size={14} className="text-zinc-400" />
                <span>Settings</span>
              </button>
              <div className="border-t border-zinc-50 dark:border-zinc-800 my-1.5"></div>
              <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3.5 py-1.5 text-xs font-bold text-rose-500 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-colors">
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>

      </div>

      {showProfileModal && (
        <Profile onClose={() => setShowProfileModal(false)} />
      )}

      {showSettingsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowSettingsModal(false)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-2xl rounded-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
              <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-100">Settings</h2>
              <button onClick={() => setShowSettingsModal(false)} className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
              <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 mb-2">Change Password</h3>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Current Password</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(p => ({ ...p, currentPassword: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 focus:border-[var(--primary)] transition-all"
                  placeholder="Enter current password"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">New Password</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(p => ({ ...p, newPassword: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 focus:border-[var(--primary)] transition-all"
                  placeholder="Enter new password"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Confirm Password</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(p => ({ ...p, confirmPassword: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 focus:border-[var(--primary)] transition-all"
                  placeholder="Confirm new password"
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowSettingsModal(false)} className="flex-1 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-[0.98]">Cancel</button>
                <button type="submit" disabled={isChangingPassword} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[var(--primary)] text-white rounded-xl font-semibold shadow-lg shadow-[var(--primary)]/20 hover:bg-[var(--primary)]/90 transition-all active:scale-[0.98] disabled:opacity-70">
                  {isChangingPassword ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  )
}
