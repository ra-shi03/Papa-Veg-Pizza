import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { clearModuleAuth } from "@food/utils/auth"
import { Menu, Bell, Store, ChevronDown, User, LogOut, Settings as SettingsIcon, AlertCircle } from "lucide-react"
import Profile from "../profile/Profile"

export default function Navbar({ onToggleSidebar, isCollapsed }) {
  const navigate = useNavigate()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [selectedStore, setSelectedStore] = useState("All Stores")
  const [showStoreDropdown, setShowStoreDropdown] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)

  const handleLogout = () => {
    clearModuleAuth("superadmin")
    navigate("/superadmin/login", { replace: true })
  }

  const stores = ["All Stores", "Indore Central", "Bhopal Zone", "Ujjain Branch", "Gwalior Hub"]
  
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
            className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:border-zinc-200 text-[11px] font-semibold shadow-sm transition-all"
          >
            <Store size={13} className="text-zinc-400" />
            <span>{selectedStore}</span>
            <ChevronDown size={13} className={`text-zinc-400 transition-transform duration-200 ${showStoreDropdown ? "rotate-180" : ""}`} />
          </button>
          
          {showStoreDropdown && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-xl py-1.5 z-50 animate-fade-down">
              {stores.map((store) => (
                <button
                  key={store}
                  onClick={() => {
                    setSelectedStore(store)
                    setShowStoreDropdown(false)
                  }}
                  className={`w-full text-left px-4 py-2 text-xs font-medium transition-colors ${
                    selectedStore === store
                      ? "text-[var(--primary)] bg-[var(--primary)]/5 font-semibold"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200"
                  }`}
                >
                  {store}
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
              <button className="w-full flex items-center gap-2.5 px-3.5 py-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">
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
    </header>
  )
}
