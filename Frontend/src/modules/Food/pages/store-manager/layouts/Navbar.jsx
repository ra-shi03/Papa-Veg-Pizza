import React, { useState, useEffect, useRef } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import {
  Menu, Bell, Store, ChevronDown, User, LogOut, Settings as SettingsIcon,
  AlertCircle, Search, Calendar, Clock, X, Trash2, Plus, Megaphone,
  BarChart3, Sun, Moon, Laptop, Shield, Activity, FileText, Check, CheckCircle2,
  AlertTriangle, ArrowRight, ClipboardList, ShieldAlert, Star
} from "lucide-react"
import { toast } from "sonner"
import { useSystemTheme } from "@/shared/utils/themeSync"

export default function Navbar({ onToggleSidebar, role, onRoleChange }) {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  // ----------------------------------------------------
  // States & Refs
  // ----------------------------------------------------
  const [searchVal, setSearchVal] = useState(searchParams.get("q") || "")
  const [recentSearches, setRecentSearches] = useState([])
  const [showRecent, setShowRecent] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const searchRef = useRef(null)

  // Date states
  const currentDateParam = searchParams.get("date") || "today"
  const [dateFilter, setDateFilter] = useState(currentDateParam)
  const [showDateDropdown, setShowDateDropdown] = useState(false)

  // Dropdown UI toggles
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [selectedStore, setSelectedStore] = useState("Store #104 (Vijay Nagar)")
  const [showStoreDropdown, setShowStoreDropdown] = useState(false)
  const [showRoleDropdown, setShowRoleDropdown] = useState(false)
  const [showActionsDropdown, setShowActionsDropdown] = useState(false)

  // Theme state
  const { themeMode } = useSystemTheme()

  // Session Data & Alerts
  const [userData, setUserData] = useState({ name: "Shubham Jamliya", email: "shubham.j@papaveg.com" })
  const [notifications, setNotifications] = useState([
    { id: 1, title: "Order PV-729 Delayed", message: "Cheese Veg Pizza is in preparation for over 18 mins", time: "2m ago", type: "order", unread: true },
    { id: 2, title: "Low Ingredient Stock", message: "Capsicum inventory is below 2.5kg threshold", time: "10m ago", type: "inventory", unread: true },
    { id: 3, title: "Rider Unassigned", message: "Order PV-732 ready for delivery but no rider assigned", time: "25m ago", type: "delivery", unread: true },
    { id: 4, title: "New Stock Request Approved", message: "10kg Paneer request approved by Franchise Admin", time: "1h ago", type: "inventory", unread: false }
  ])

  const storeList = [
    { id: 104, name: "Vijay Nagar", location: "Indore" },
    { id: 105, name: "Palasia Hub", location: "Indore" },
    { id: 201, name: "Arera Colony", location: "Bhopal" }
  ]

  const dateLabels = {
    today: "Today",
    yesterday: "Yesterday",
    week: "Last 7 Days",
    month: "This Month"
  }

  const roleLabels = {
    store_manager: "Store Manager",
    kitchen_supervisor: "Kitchen Supervisor",
    kitchen_staff: "Kitchen Staff",
    assistant_manager: "Assistant Manager",
    store_owner: "Store Owner"
  }

  useEffect(() => {
    // Load local storage searches
    const savedSearches = localStorage.getItem("store_recent_searches")
    if (savedSearches) {
      setRecentSearches(JSON.parse(savedSearches))
    }

    // Read user from localStorage if it exists
    const localUser = localStorage.getItem("store_user")
    if (localUser) {
      try {
        setUserData(JSON.parse(localUser))
      } catch (_) {}
    }
  }, [])

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowRecent(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleDateSelect = (filter) => {
    setDateFilter(filter)
    setShowDateDropdown(false)
    toast.success(`Date filter: ${dateLabels[filter]}`)
  }

  const toggleTheme = () => {
    const nextTheme = themeMode === "light" ? "dark" : "light"
    localStorage.setItem("sa_themeMode", nextTheme)
    window.dispatchEvent(new Event("systemThemeChanged"))
    toast.success(`Theme mode: ${nextTheme}`)
  }

  const handleLogout = () => {
    localStorage.removeItem("store_accessToken")
    localStorage.removeItem("store_authenticated")
    localStorage.removeItem("store_user")
    localStorage.removeItem("store_role")
    navigate("/store-operation/login", { replace: true })
  }

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })))
    toast.success("All alerts marked as read")
  }

  const handleRoleChange = (newRole) => {
    onRoleChange(newRole)
    setShowRoleDropdown(false)
    toast.success(`Role switched to ${roleLabels[newRole]}`)
  }

  const unreadCount = notifications.filter(n => n.unread).length

  return (
    <>
      <header className="sticky top-0 w-full flex justify-between items-center px-4 md:px-6 h-16 bg-white dark:bg-zinc-900 border-b border-zinc-150 dark:border-zinc-800 z-40 transition-all duration-300">
        
        {/* LEFT SECTION: Hamburger & Store Selector */}
        <div className="flex items-center gap-4 shrink-0">
          <button
            onClick={onToggleSidebar}
            className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg transition-all lg:hidden"
            aria-label="Toggle Sidebar"
          >
            <Menu size={18} />
          </button>
          
          <div className="flex items-center gap-3">
            <span 
              onClick={() => navigate("/store-operations/dashboard")}
              className="text-xs font-black tracking-wider text-zinc-900 dark:text-white uppercase cursor-pointer select-none hover:text-[var(--primary)] transition-colors hidden sm:inline"
            >
              PAPA VEG OPS
            </span>
            <span className="text-zinc-300 dark:text-zinc-700 hidden sm:inline">|</span>
            
            {/* Store Selector */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowStoreDropdown(!showStoreDropdown)
                  setShowDateDropdown(false)
                  setShowNotifications(false)
                  setShowProfileMenu(false)
                  setShowActionsDropdown(false)
                  setShowRoleDropdown(false)
                }}
                className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              >
                <span>{selectedStore}</span>
                <ChevronDown size={10} className={`text-zinc-400 transition-transform duration-150 ${showStoreDropdown ? "rotate-180" : ""}`} />
              </button>

              {showStoreDropdown && (
                <div className="absolute left-0 mt-2 w-52 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 shadow-xl py-1.5 z-50 animate-in fade-in duration-100">
                  {storeList.map((store) => (
                    <button
                      key={store.id}
                      onClick={() => {
                        setSelectedStore(`Store #${store.id} (${store.name})`)
                        setShowStoreDropdown(false)
                        toast.success(`Connected to Store #${store.id}`)
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-bold text-zinc-650 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                      Store #{store.id} - {store.name} ({store.location})
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MIDDLE SECTION: Search Bar */}
        <div ref={searchRef} className="flex-1 max-w-[240px] mx-4 relative hidden md:block z-50">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search active orders..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              onFocus={() => setShowRecent(true)}
              className="w-full pl-8.5 pr-8 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-xl text-zinc-800 dark:text-zinc-100 outline-none focus:border-zinc-300 dark:focus:border-zinc-700 transition-all font-semibold placeholder-zinc-400"
            />
            {searchVal && (
              <button onClick={() => setSearchVal("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-405 hover:text-[var(--primary)]">
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* RIGHT SECTION: Quick Actions, Role Switcher, Alerts & User Profile */}
        <div className="flex items-center gap-3 shrink-0 text-xs font-bold text-zinc-650 dark:text-zinc-300">
          
          {/* PREMIUM DEMO ROLE SWITCHER */}
          <div className="relative">
            <button
              onClick={() => {
                setShowRoleDropdown(!showRoleDropdown)
                setShowStoreDropdown(false)
                setShowDateDropdown(false)
                setShowNotifications(false)
                setShowProfileMenu(false)
                setShowActionsDropdown(false)
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-[var(--primary)]/200/50 dark:border-amber-900/30 rounded-full text-[10px] font-extrabold shadow-sm hover:opacity-90 transition-all cursor-pointer"
            >
              <Shield size={11} className="stroke-[2.5]" />
              <span>Role: {roleLabels[role]}</span>
              <ChevronDown size={8} />
            </button>

            {showRoleDropdown && (
              <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 shadow-xl py-1.5 z-50 animate-in fade-in duration-100 text-xs">
                <div className="px-3 py-1 text-[8px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800 mb-1">
                  Switch Demo Role
                </div>
                {Object.keys(roleLabels).map((rKey) => (
                  <button
                    key={rKey}
                    onClick={() => handleRoleChange(rKey)}
                    className={`w-full text-left px-3 py-2 font-bold transition-colors flex items-center justify-between ${
                      role === rKey
                        ? "text-[var(--primary)] bg-[var(--primary)]/10/50 dark:bg-[var(--primary)]/20"
                        : "text-zinc-650 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <span>{roleLabels[rKey]}</span>
                    {role === rKey && <Check size={12} className="stroke-[3]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions (only for manager & supervisor) */}
          {role !== "kitchen_staff" && (
            <div className="relative">
              <button
                onClick={() => {
                  setShowActionsDropdown(!showActionsDropdown)
                  setShowStoreDropdown(false)
                  setShowDateDropdown(false)
                  setShowNotifications(false)
                  setShowProfileMenu(false)
                  setShowRoleDropdown(false)
                }}
                className="p-1 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors cursor-pointer"
                title="Quick Action"
              >
                <Plus size={18} />
              </button>

              {showActionsDropdown && (
                <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 shadow-xl py-1.5 z-50 animate-in fade-in duration-100">
                  <button
                    onClick={() => { setShowActionsDropdown(false); toast.success("Stock request initiated"); }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-left text-zinc-650 dark:text-zinc-350"
                  >
                    <ClipboardList size={13} className="text-zinc-450" />
                    <span>New Stock Request</span>
                  </button>
                  <button
                    onClick={() => { setShowActionsDropdown(false); toast.success("Shortage report raised"); }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-left text-zinc-650 dark:text-zinc-350"
                  >
                    <ShieldAlert size={13} className="text-zinc-450" />
                    <span>Report Shortage</span>
                  </button>
                  <button
                    onClick={() => { setShowActionsDropdown(false); toast.success("Waste logged"); }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-left text-zinc-650 dark:text-zinc-350"
                  >
                    <Trash2 size={13} className="text-zinc-450" />
                    <span>Log Waste Item</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-1 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors cursor-pointer"
          >
            {themeMode === "light" ? <Moon size={16} /> : <Sun size={16} />}
          </button>

          {/* Date Filter */}
          <div className="relative">
            <button
              onClick={() => {
                setShowDateDropdown(!showDateDropdown)
                setShowStoreDropdown(false)
                setShowNotifications(false)
                setShowProfileMenu(false)
                setShowRoleDropdown(false)
                setShowActionsDropdown(false)
              }}
              className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            >
              <Calendar size={12} className="text-zinc-400" />
              <span className="hidden sm:inline">{dateLabels[dateFilter]}</span>
              <ChevronDown size={10} className={`text-zinc-400 transition-transform duration-150 ${showDateDropdown ? "rotate-180" : ""}`} />
            </button>
            
            {showDateDropdown && (
              <div className="absolute right-0 mt-2 w-36 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 shadow-xl py-1.5 z-50 animate-in fade-in duration-100">
                {Object.keys(dateLabels).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => handleDateSelect(filter)}
                    className={`w-full text-left px-3.5 py-1.5 text-xs font-bold transition-colors ${
                      dateFilter === filter
                        ? "text-[var(--primary)] bg-zinc-50 dark:bg-zinc-800/50"
                        : "text-zinc-650 dark:text-zinc-450 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {dateLabels[filter]}
                  </button>
                ))}
              </div>
            )}
          </div>

          <span className="text-zinc-200 dark:text-zinc-800">|</span>

          {/* Alerts Bell */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications)
                setShowStoreDropdown(false)
                setShowDateDropdown(false)
                setShowProfileMenu(false)
                setShowRoleDropdown(false)
                setShowActionsDropdown(false)
              }}
              className="p-1 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors cursor-pointer relative animate-none"
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-2 h-2 bg-[var(--primary)] rounded-full ring-2 ring-white dark:ring-slate-950"></span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2.5 w-[320px] sm:w-[350px] rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 shadow-xl p-3.5 z-50 animate-in fade-in duration-100">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800 mb-2">
                  <span className="text-xs font-black text-zinc-900 dark:text-white">Active Alerts ({unreadCount})</span>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-[10px] font-bold text-[var(--primary)] hover:underline">Mark all read</button>
                  )}
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin">
                  {notifications.map((n) => (
                    <div 
                      key={n.id} 
                      onClick={() => {
                        setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, unread: false } : item))
                      }}
                      className={`p-2.5 rounded-xl border relative transition-colors cursor-pointer ${
                        n.unread ? "bg-[var(--primary)]/10/10 dark:bg-red-950/5 border-red-100/40 dark:border-red-950/20" : "bg-zinc-50/50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {n.type === "order" && <Clock size={12} className="text-amber-500 mt-0.5 shrink-0" />}
                        {n.type === "inventory" && <AlertTriangle size={12} className="text-[var(--primary)] mt-0.5 shrink-0" />}
                        {n.type === "delivery" && <Activity size={12} className="text-blue-500 mt-0.5 shrink-0" />}
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-black text-zinc-800 dark:text-zinc-200 leading-tight">{n.title}</span>
                            {n.unread && <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] shrink-0" />}
                          </div>
                          <p className="text-[9px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-normal">{n.message}</p>
                          <span className="text-[8px] text-zinc-400 mt-1 block font-semibold">{n.time}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <span className="text-zinc-200 dark:text-zinc-800">|</span>

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu)
                setShowNotifications(false)
                setShowStoreDropdown(false)
                setShowDateDropdown(false)
                setShowRoleDropdown(false)
                setShowActionsDropdown(false)
              }}
              className="flex items-center focus:outline-none"
            >
              <div className="w-7 h-7 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-150 flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-90 transition-all">
                <span className="text-[10px] font-black text-zinc-700 dark:text-zinc-350">
                  {userData.name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2)}
                </span>
              </div>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 shadow-xl py-1.5 z-50 animate-in fade-in duration-100 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800 mb-1.5">
                  <p className="font-extrabold text-zinc-800 dark:text-white truncate">{userData.name}</p>
                  <p className="text-[9px] text-zinc-400 font-semibold truncate mt-0.5">{userData.email}</p>
                </div>
                <button
                  onClick={() => { setShowProfileMenu(false); navigate("/store-operations/profile"); }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-left transition-colors"
                >
                  <User size={13} className="text-zinc-400" />
                  <span>My Profile</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-left text-[var(--primary)] transition-colors border-t border-zinc-100 dark:border-zinc-800 mt-1 pt-2"
                >
                  <LogOut size={13} className="text-[var(--primary)]" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </header>
    </>
  )
}
