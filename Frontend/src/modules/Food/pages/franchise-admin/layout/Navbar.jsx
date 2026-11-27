import { authKey } from "@/shared/utils/authNamespace";
import React, { useState, useEffect, useRef } from "react"
import { useNavigate, useSearchParams, useLocation } from "react-router-dom"
import {
  Menu, Store, ChevronDown, User, LogOut, Settings as SettingsIcon,
  AlertCircle, Search, Calendar, Clock, X, Trash2, Plus, Megaphone,
  BarChart3, Sun, Moon, Laptop, Shield, Activity, FileText, Check, CheckCircle2,
  AlertTriangle, ArrowRight, Smartphone
} from "lucide-react"
import { adminAPI } from "@food/api"
import { clearModuleAuth, getModuleRefreshToken } from "@food/utils/auth"
import { toast } from "sonner"
import { useSystemTheme } from "@/shared/utils/themeSync"

export default function Navbar({ onToggleSidebar }) {
  const navigate = useNavigate()
  const location = useLocation()
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
  const [customStart, setCustomStart] = useState(searchParams.get("start") || "")
  const [customEnd, setCustomEnd] = useState(searchParams.get("end") || "")
  const [showCustomRangeFields, setShowCustomRangeFields] = useState(currentDateParam === "custom")

  // Dropdown UI toggles
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [selectedStore, setSelectedStore] = useState("All Stores")
  const [showStoreDropdown, setShowStoreDropdown] = useState(false)
  const [showActionsDropdown, setShowActionsDropdown] = useState(false)

  // Theme state
  const { themeMode } = useSystemTheme()

  // Modals visibility
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [showSecurityModal, setShowSecurityModal] = useState(false)
  const [showActivityModal, setShowActivityModal] = useState(false)

  // Session Data & Logs
  const [adminData, setAdminData] = useState(null)
  const [franchiseData, setFranchiseData] = useState(null)
  const [newOrdersCount, setNewOrdersCount] = useState((0))

  const handleConfirmLogout = async () => {
    try {
      const token = getModuleRefreshToken("franchise-admin")
      if (token) {
        await adminAPI.logout(token).catch(() => null)
      }
    } catch (err) {
      console.error("Logout error", err)
    } finally {
      clearModuleAuth("franchise-admin")
      navigate("/franchise-admin/login", { replace: true })
    }
  }

  // Store List
  const [storeList, setStoreList] = useState(([]))

  // The real stores of this franchise; the sample orders, customers and products are for 
  const searchCollection = (storeList.map((s) => ({
    id: String(s._id || s.id), name: s.storeName || s.name || "", type: "stores", status: s.status || "", route: "/franchise-admin/stores",
  })))

  const dateLabels = {
    today: "Today",
    yesterday: "Yesterday",
    week: "Last 7 Days",
    month: "This Month",
    thirty: "Last 30 Days",
    custom: "Custom Range"
  }

  useEffect(() => {
    const adminUserStr = localStorage.getItem(authKey("admin", "user"))
    if (adminUserStr) {
      setAdminData(JSON.parse(adminUserStr))
    } else {
      setAdminData({ name: "", email: "" })
    }

    const fetchFranchiseData = async () => {
      try {
        const response = await adminAPI.getMyFranchise()
        if (response?.data?.data?.franchise) {
          setFranchiseData(response.data.data.franchise)
        }
      } catch (err) {
        console.error("Failed to fetch franchise data", err)
      }
    }
    fetchFranchiseData()

    const fetchStores = async () => {
      try {
        const response = await adminAPI.getStores()
        if (response?.data?.data) {
          const storesData = response.data.data.stores || (Array.isArray(response.data.data) ? response.data.data : []);
          if (storesData.length > 0) setStoreList(storesData);
        }
      } catch (err) {
        console.error("Failed to fetch stores data", err)
      }
    }
    fetchStores()

    const savedSearches = localStorage.getItem("admin_recent_searches")
    if (savedSearches) {
      setRecentSearches(JSON.parse(savedSearches))
    }

  }, [])

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowRecent(false)
      }
    }
    
    function handleKeyDown(event) {
      if ((event.ctrlKey || event.metaKey) && event.key === "k") {
        event.preventDefault()
        const inputEl = document.getElementById("global-search-input")
        if (inputEl) {
          inputEl.focus()
          setShowRecent(true)
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  // Global Search Debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const trimmed = searchVal.trim().toLowerCase()
      if (trimmed) {
        const filtered = searchCollection.filter(item => 
          item.id.toLowerCase().includes(trimmed) || 
          item.name.toLowerCase().includes(trimmed) ||
          item.type.toLowerCase().includes(trimmed)
        )
        setSearchResults(filtered)

        const params = new URLSearchParams(searchParams)
        params.set("q", trimmed)
        
        setRecentSearches(prev => {
          const filteredSearches = prev.filter(s => s !== searchVal.trim())
          const updated = [searchVal.trim(), ...filteredSearches].slice(0, 5)
          localStorage.setItem("admin_recent_searches", JSON.stringify(updated))
          return updated
        })

        if (location.pathname === "/franchise-admin/dashboard") {
          setSearchParams(params)
        }
      } else {
        setSearchResults([])
        const params = new URLSearchParams(searchParams)
        if (params.has("q")) {
          params.delete("q")
          if (location.pathname === "/franchise-admin/dashboard") {
            setSearchParams(params)
          }
        }
      }
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [searchVal])

  const handleDateSelect = (filter) => {
    setDateFilter(filter)
    setShowDateDropdown(false)
    
    const params = new URLSearchParams(searchParams)
    params.set("date", filter)
    
    if (filter !== "custom") {
      params.delete("start")
      params.delete("end")
      setShowCustomRangeFields(false)
      setSearchParams(params)
      toast.success(`Date filter updated: ${dateLabels[filter]}`)
    } else {
      setShowCustomRangeFields(true)
    }
  }

  const handleCustomRangeSubmit = (e) => {
    e.preventDefault()
    if (!customStart || !customEnd) return
    
    const params = new URLSearchParams(searchParams)
    params.set("date", "custom")
    params.set("start", customStart)
    params.set("end", customEnd)
    
    setSearchParams(params)
    setShowCustomRangeFields(false)
    toast.success(`Date filter: ${customStart} to ${customEnd}`)
  }

  const handleThemeChange = (mode) => {
    localStorage.setItem("sa_themeMode", mode)
    window.dispatchEvent(new Event("systemThemeChanged"))
    toast.success(`Theme mode switched to ${mode}`)
  }

  return (
    <>
      <header className="sticky top-0 w-full flex justify-between items-center px-4 md:px-6 h-16 bg-white dark:bg-zinc-900 border-b border-zinc-150 dark:border-zinc-800 z-40 transition-all duration-300">
        
        {/* LEFT SECTION: Minimal Logo & Inline Store Selector */}
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
              onClick={() => navigate("/franchise-admin/dashboard")}
              className="text-xs font-black tracking-wider text-zinc-900 dark:text-white uppercase cursor-pointer select-none hover:text-[var(--primary)] transition-colors truncate max-w-[150px]"
              title={franchiseData?.name || "PAPA VEG PIZZA"}
            >
              {franchiseData?.name || "PAPA VEG PIZZA"}
            </span>
            <span className="text-[10px] text-zinc-300 dark:text-zinc-700">|</span>
            
            {/* Minimal Inline Store Selector */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowStoreDropdown(!showStoreDropdown)
                  setShowDateDropdown(false)
                  setShowProfileMenu(false)
                  setShowActionsDropdown(false)
                }}
                className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              >
                <span>{selectedStore}</span>
                <ChevronDown size={10} className={`text-zinc-400 transition-transform duration-150 ${showStoreDropdown ? "rotate-180" : ""}`} />
              </button>

              {showStoreDropdown && (
                <div className="absolute left-0 mt-2 w-44 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 shadow-xl py-1.5 z-50 animate-in fade-in duration-100">
                  <button
                    onClick={() => { setSelectedStore("All Stores"); setShowStoreDropdown(false); }}
                    className={`w-full text-left px-3 py-2 text-xs font-bold transition-colors ${
                      selectedStore === "All Stores" ? "text-[var(--primary)] bg-zinc-50 dark:bg-zinc-800/50" : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    }`}
                  >
                    All Stores
                  </button>
                  {storeList.map((store) => {
                    const displayName = store.territoryId?.name || store.territory?.name || store.territoryName || store.storeName || store.name;
                    return (
                    <button
                      key={store.id || store._id}
                      onClick={() => {
                        setSelectedStore(displayName)
                        setShowStoreDropdown(false)
                      }}
                      className={`w-full text-left px-3 py-2 text-xs font-bold transition-colors ${
                        selectedStore === displayName ? "text-[var(--primary)] bg-zinc-50 dark:bg-zinc-800/50" : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                      }`}
                    >
                      {displayName}
                    </button>
                  )})}
                </div>
              )}
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse hidden xs:block" title="Store Online" />
          </div>
        </div>

        {/* MIDDLE SECTION: Clean Search Input Removed */}

        {/* RIGHT SECTION: Simple Actions & Indicators */}
        <div className="flex items-center gap-3 shrink-0 text-xs font-bold text-zinc-650 dark:text-zinc-300">
          
          {/* Minimal Inline Date Filter */}
          <div className="relative">
            <button
              onClick={() => {
                setShowDateDropdown(!showDateDropdown)
                setShowStoreDropdown(false)
                setShowProfileMenu(false)
                setShowActionsDropdown(false)
              }}
              className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            >
              <Calendar size={12} className="text-zinc-400" />
              <span>{dateLabels[dateFilter]}</span>
              <ChevronDown size={10} className={`text-zinc-400 transition-transform duration-150 ${showDateDropdown ? "rotate-180" : ""}`} />
            </button>
            
            {showDateDropdown && (
              <div className="absolute right-0 mt-2 w-44 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 shadow-xl py-1.5 z-50 animate-in fade-in duration-100">
                {["today", "yesterday", "week", "thirty", "month", "custom"].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => handleDateSelect(filter)}
                    className={`w-full text-left px-3.5 py-1.5 text-xs font-bold transition-colors ${
                      dateFilter === filter
                        ? "text-[var(--primary)] bg-zinc-50 dark:bg-zinc-800/50"
                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {dateLabels[filter]}
                  </button>
                ))}
              </div>
            )}

            {/* Custom Date Form */}
            {showCustomRangeFields && (
              <div className="absolute right-0 mt-2 p-3 w-52 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 shadow-xl z-50 animate-in fade-in duration-100">
                <form onSubmit={handleCustomRangeSubmit} className="space-y-2.5">
                  <div className="space-y-0.5">
                    <label className="text-[8px] font-bold uppercase text-zinc-400">Start Date</label>
                    <input
                      type="date"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      required
                      className="w-full p-1.5 text-[10px] bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-lg text-zinc-800 dark:text-zinc-100 outline-none"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[8px] font-bold uppercase text-zinc-400">End Date</label>
                    <input
                      type="date"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      required
                      className="w-full p-1.5 text-[10px] bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-850 rounded-lg text-zinc-800 dark:text-zinc-100 outline-none"
                    />
                  </div>
                  <div className="flex gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => { setShowCustomRangeFields(false); handleDateSelect("today"); }}
                      className="flex-1 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-[9px] font-bold rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-1.5 bg-[var(--primary)] hover:opacity-90 text-white text-[9px] font-bold rounded-lg"
                    >
                      Apply
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          <span className="text-zinc-200 dark:text-zinc-800">|</span>

          {/* Minimal Quick Actions Trigger Removed */}

          {/* Profile Section (Sleek Avatar with Minimalist Profile Menu) */}
          <div className="relative">
            <button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu)
                setShowStoreDropdown(false)
                setShowDateDropdown(false)
                setShowActionsDropdown(false)
              }}
              className="flex items-center focus:outline-none"
            >
              <div className="w-7 h-7 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-90 transition-all">
                {adminData?.profileImage ? (
                  <img
                    alt="Admin Avatar"
                    className="w-full h-full object-cover"
                    src={adminData.profileImage}
                  />
                ) : (
                  <span className="text-[10px] font-black text-zinc-700">
                    {franchiseData?.ownerName
                      ? franchiseData.ownerName.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2)
                      : (adminData?.name
                        ? adminData.name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2)
                        : "FA")}
                  </span>
                )}
              </div>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 shadow-xl py-1.5 z-50 animate-in fade-in duration-100 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800 mb-1.5">
                  <p className="text-xs font-black text-zinc-900 dark:text-white leading-tight">{franchiseData?.ownerName || adminData?.name || "Franchise Admin"}</p>
                  {(franchiseData?.email || adminData?.email) && (
                    <p className="text-[9px] text-zinc-400 truncate mt-0.5">{franchiseData?.email || adminData?.email}</p>
                  )}
                </div>
                
                {/* Theme Selector Inside Profile Dropdown */}
                <div className="px-3 py-1 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-850">
                  <span className="text-zinc-500 font-semibold text-[11px]">Theme</span>
                  <div className="flex gap-1 border border-zinc-200 dark:border-zinc-800 p-0.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 scale-90 origin-right">
                    {[
                      { id: "light", icon: <Sun size={10} /> },
                      { id: "dark", icon: <Moon size={10} /> }
                    ].map(t => (
                      <button
                        key={t.id}
                        onClick={() => handleThemeChange(t.id)}
                        className={`p-1 rounded-md transition-colors ${
                          themeMode === t.id ? "bg-[var(--primary)] text-white" : "text-zinc-405 hover:text-zinc-700 dark:hover:text-zinc-300"
                        }`}
                      >
                        {t.icon}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => { setShowProfileMenu(false); navigate("/franchise-admin/dashboard/profile"); }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-left text-zinc-650 dark:text-zinc-300"
                >
                  <User size={13} className="text-zinc-450" />
                  <span>My Profile</span>
                </button>
                {/* Settings/Security options removed per user request */}
                <div className="border-t border-zinc-100 dark:border-zinc-800 my-1"></div>
                <button
                  onClick={() => { setShowProfileMenu(false); setShowLogoutModal(true); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-[var(--primary)] hover:bg-[var(--primary)]/10 dark:hover:bg-rose-950/20"
                >
                  <LogOut size={13} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* ----------------------------------------------------
          MODALS & WORKFLOWS (Invisible in flow, loaded when active)
         ---------------------------------------------------- */}

      {/* Add Store & Broadcast modals removed per request */}

      {/* 3. LOGOUT CONFIRMATION MODAL */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-150 dark:border-zinc-800 max-w-sm w-full overflow-hidden shadow-2xl p-5 text-center animate-in zoom-in-95 duration-100">
            <div className="w-10 h-10 rounded-full bg-[var(--primary)]/10 dark:bg-[var(--primary)]/20 text-[var(--primary)] flex items-center justify-center mx-auto mb-3 border border-[var(--primary)]/20">
              <LogOut size={16} className="ml-0.5" />
            </div>
            
            <h3 className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-wider">Sign Out Panel</h3>
            <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
              Are you sure you want to log out?
            </p>

            <div className="flex gap-2.5 mt-5 text-xs font-bold">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLogout}
                className="flex-1 py-2.5 bg-[var(--primary)]/100 hover:bg-[var(--primary-hover)] text-white rounded-xl"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activity and Security Modals removed per request */}
    </>
  )
}
