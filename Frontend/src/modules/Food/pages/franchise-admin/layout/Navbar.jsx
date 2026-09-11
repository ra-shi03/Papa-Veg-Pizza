import React, { useState, useEffect, useRef } from "react"
import { useNavigate, useSearchParams, useLocation } from "react-router-dom"
import {
  Menu, Bell, Store, ChevronDown, User, LogOut, Settings as SettingsIcon,
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
  const [showNotifications, setShowNotifications] = useState(false)
  const [selectedStore, setSelectedStore] = useState("All Stores")
  const [showStoreDropdown, setShowStoreDropdown] = useState(false)
  const [showActionsDropdown, setShowActionsDropdown] = useState(false)

  // Theme state
  const { themeMode } = useSystemTheme()

  // Modals visibility
  const [showAddStoreModal, setShowAddStoreModal] = useState(false)
  const [showBroadcastModal, setShowBroadcastModal] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [showSecurityModal, setShowSecurityModal] = useState(false)
  const [showActivityModal, setShowActivityModal] = useState(false)

  // Session Data & Logs
  const [adminData, setAdminData] = useState(null)
  const [franchiseData, setFranchiseData] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [notificationTab, setNotificationTab] = useState("all") 
  const [newOrdersCount, setNewOrdersCount] = useState(4)

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
  const [storeList, setStoreList] = useState([
    { id: 1, name: "Indore Central", address: "Vijay Nagar, Indore", location: "Indore", manager: "Rohan Sharma", hours: "11:00 AM - 11:00 PM" },
    { id: 2, name: "Bhopal Zone", address: "Arera Colony, Bhopal", location: "Bhopal", manager: "Vikram Singh", hours: "10:30 AM - 11:30 PM" },
    { id: 3, name: "Ujjain Branch", address: "Nanakheda, Ujjain", location: "Ujjain", manager: "Amit Mishra", hours: "11:00 AM - 10:00 PM" },
    { id: 4, name: "Gwalior Hub", address: "Deen Dayal Nagar, Gwalior", location: "Gwalior", manager: "Rajesh Gupta", hours: "12:00 PM - 11:00 PM" }
  ])

  // Modals form state
  const [storeForm, setStoreForm] = useState({ name: "", address: "", location: "Indore", manager: "", hours: "11:00 AM - 11:00 PM" })
  const [broadcastForm, setBroadcastForm] = useState({ title: "", message: "", targetStore: "All Stores", priority: "medium" })

  const searchCollection = [
    { id: "ORD-98421", name: "Rajesh Kumar - Cheese Burst Pizza", type: "orders", status: "preparing", route: "/franchise-admin/live-orders?q=ORD-98421" },
    { id: "ORD-98425", name: "Aarav Mehta - Veg Supreme Meal", type: "orders", status: "delivered", route: "/franchise-admin/live-orders?q=ORD-98425" },
    { id: "ORD-98426", name: "Sunita Gupta - Capsicum Feast", type: "orders", status: "accepted", route: "/franchise-admin/live-orders?q=ORD-98426" },
    { id: "CUST-001", name: "Rajesh Kumar", type: "customers", status: "Active", route: "/franchise-admin/customers-list?userId=cust-01" },
    { id: "CUST-002", name: "Priya Patel", type: "customers", status: "Active", route: "/franchise-admin/customers-list?userId=cust-02" },
    { id: "STORE-01", name: "Indore Central", type: "stores", status: "Online", route: "/franchise-admin/stores" },
    { id: "STORE-02", name: "Bhopal Zone", type: "stores", status: "Online", route: "/franchise-admin/stores" },
    { id: "PROD-101", name: "Double Cheese Margherita", type: "products", status: "Available", route: "/franchise-admin/products" },
    { id: "PROD-102", name: "Paneer Tikka Pizza", type: "products", status: "Available", route: "/franchise-admin/products" },
    { id: "RIDER-909", name: "Kabir Sengupta", type: "delivery partners", status: "On Duty", route: "/franchise-admin/dashboard/delivery-partners" }
  ]

  const dateLabels = {
    today: "Today",
    yesterday: "Yesterday",
    week: "Last 7 Days",
    month: "This Month",
    thirty: "Last 30 Days",
    custom: "Custom Range"
  }

  useEffect(() => {
    const adminUserStr = localStorage.getItem("admin_user")
    if (adminUserStr) {
      setAdminData(JSON.parse(adminUserStr))
    } else {
      setAdminData({ name: "Shubham Jamliya", email: "shubham@papavegpizza.com" })
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
          setStoreList(response.data.data)
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

    const defaultNotifications = [
      { id: 1, title: "Low Stock Alert", message: "Mozzarella Cheese is below 5kg threshold at Indore Central", time: "5m ago", type: "inventory", unread: true },
      { id: 2, title: "New Complaint", message: "Order PV-98421: Client complaints of delayed delivery and cold pizza", time: "15m ago", type: "complaints", unread: true },
      { id: 3, title: "Refund Requested", message: "Aarav Mehta requested refund of ₹450 for Order PV-98422", time: "1h ago", type: "orders", unread: true },
      { id: 4, title: "Delivery Delay Detected", message: "Rider Kabir Sengupta delayed by 14 mins on Indore Node", time: "2h ago", type: "delivery", unread: false },
      { id: 5, title: "Store Offline Signal", message: "POS Terminal disconnected at Gwalior Hub", time: "4h ago", type: "complaints", unread: false }
    ]
    const localNotifs = localStorage.getItem("franchise_notifications")
    if (localNotifs) {
      setNotifications(JSON.parse(localNotifs))
    } else {
      setNotifications(defaultNotifications)
      localStorage.setItem("franchise_notifications", JSON.stringify(defaultNotifications))
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

  // Simulated Socket Events
  useEffect(() => {
    const socketInterval = setInterval(() => {
      const events = [
        { event: "notificationCreated", title: "Low stock alert", message: "Paneer inventory under 3kg threshold at Bhopal Zone", type: "inventory" },
        { event: "orderCreated", title: "New order received", message: "Order PV-98432 placed by Sneha Patel (₹580.00)", type: "orders" },
        { event: "complaintRaised", title: "Critical complaint raised", message: "Store Bhopal Zone reported wrong items delivered on Order PV-98418", type: "complaints" }
      ]

      const randomEvent = events[Math.floor(Math.random() * events.length)]
      
      if (randomEvent.event === "orderCreated") {
        setNewOrdersCount(prev => prev + 1)
        toast.info(`[Socket: orderCreated] ${randomEvent.title}`, {
          description: randomEvent.message,
          action: {
            label: "View Orders",
            onClick: () => navigate("/franchise-admin/live-orders")
          }
        })
      } else {
        const newNotif = {
          id: Date.now(),
          title: randomEvent.title,
          message: randomEvent.message,
          time: "Just now",
          type: randomEvent.type,
          unread: true
        }

        setNotifications(prev => {
          const updated = [newNotif, ...prev]
          localStorage.setItem("franchise_notifications", JSON.stringify(updated))
          return updated
        })

        toast.success(`[Socket: ${randomEvent.event}] ${randomEvent.title}`, {
          description: randomEvent.message
        })
      }
    }, 50000)

    return () => clearInterval(socketInterval)
  }, [navigate])

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

  const handleAddStoreSubmit = (e) => {
    e.preventDefault()
    if (!storeForm.name || !storeForm.address || !storeForm.manager) {
      toast.error("Please fill in all required fields")
      return
    }

    const newStore = {
      id: Date.now(),
      name: storeForm.name,
      address: storeForm.address,
      location: storeForm.location,
      manager: storeForm.manager,
      hours: storeForm.hours
    }

    const updatedStores = [...storeList, newStore]
    setStoreList(updatedStores)
    localStorage.setItem("franchise_stores", JSON.stringify(updatedStores))

    setStoreForm({ name: "", address: "", location: "Indore", manager: "", hours: "11:00 AM - 11:00 PM" })
    setShowAddStoreModal(false)
    toast.success(`Store '${newStore.name}' created!`)
  }

  const handleBroadcastSubmit = (e) => {
    e.preventDefault()
    if (!broadcastForm.title || !broadcastForm.message) {
      toast.error("Title and message are required")
      return
    }

    const newBroadcast = {
      id: Date.now(),
      title: `Broadcast: ${broadcastForm.title}`,
      message: `${broadcastForm.message} (${broadcastForm.targetStore})`,
      time: "Just now",
      type: "complaints", 
      unread: true
    }

    const updatedNotifs = [newBroadcast, ...notifications]
    setNotifications(updatedNotifs)
    localStorage.setItem("franchise_notifications", JSON.stringify(updatedNotifs))

    setBroadcastForm({ title: "", message: "", targetStore: "All Stores", priority: "medium" })
    setShowBroadcastModal(false)
    toast.success("Broadcast sent successfully!")
  }

  const markAsRead = (id) => {
    const updated = notifications.map(n => n.id === id ? { ...n, unread: false } : n)
    setNotifications(updated)
    localStorage.setItem("franchise_notifications", JSON.stringify(updated))
  }

  const markAllRead = () => {
    const updated = notifications.map(n => ({ ...n, unread: false }))
    setNotifications(updated)
    localStorage.setItem("franchise_notifications", JSON.stringify(updated))
    toast.success("All alerts marked as read")
  }

  const clearNotification = (id) => {
    const updated = notifications.filter(n => n.id !== id)
    setNotifications(updated)
    localStorage.setItem("franchise_notifications", JSON.stringify(updated))
  }

  const getFilteredNotifications = () => {
    if (notificationTab === "unread") return notifications.filter(n => n.unread)
    if (notificationTab === "all") return notifications
    return notifications.filter(n => n.type === notificationTab)
  }

  const unreadCount = notifications.filter(n => n.unread).length

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
                  setShowNotifications(false)
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
                    const displayName = store.territoryId?.name || store.territory?.name || store.territoryName || store.name;
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
                setShowNotifications(false)
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

          {/* Notifications Trigger */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications)
                setShowStoreDropdown(false)
                setShowDateDropdown(false)
                setShowProfileMenu(false)
                setShowActionsDropdown(false)
              }}
              className="p-1 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-150 transition-colors cursor-pointer relative"
            >
              <Bell size={17} />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-2 h-2 bg-[var(--primary)]/100 rounded-full ring-2 ring-white dark:ring-slate-950"></span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2.5 w-[360px] rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 shadow-xl p-3 z-50 animate-in fade-in duration-100">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
                  <span className="text-xs font-bold text-zinc-900 dark:text-white">System Alerts</span>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-[10px] font-bold text-[var(--primary)] hover:underline">Mark all read</button>
                  )}
                </div>

                <div className="flex gap-1 border-b border-zinc-100 dark:border-zinc-800 mt-1.5 pb-1 overflow-x-auto scrollbar-none">
                  {[
                    { id: "all", label: "All" },
                    { id: "unread", label: "Unread" },
                    { id: "orders", label: "Orders" },
                    { id: "inventory", label: "Inventory" },
                    { id: "complaints", label: "Complaints" }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setNotificationTab(tab.id)}
                      className={`px-2 py-0.5 text-[9px] font-bold rounded transition-all ${
                        notificationTab === tab.id
                          ? "bg-zinc-100 dark:bg-zinc-800 text-[var(--primary)]"
                          : "text-zinc-450 hover:text-zinc-650"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-1.5 mt-2.5 max-h-56 overflow-y-auto scrollbar-thin">
                  {/* Dynamic Notification and Simulated Socket updates */}
                  {newOrdersCount > 0 && (
                    <div 
                      onClick={() => { setNewOrdersCount(0); navigate("/franchise-admin/live-orders"); setShowNotifications(false); }}
                      className="p-2 bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/10 rounded-xl flex items-center justify-between cursor-pointer animate-pulse text-[11px]"
                    >
                      <span className="font-bold text-blue-600 dark:text-blue-400">Incoming Orders Active: {newOrdersCount}</span>
                      <ArrowRight size={12} className="text-blue-500" />
                    </div>
                  )}

                  {getFilteredNotifications().length > 0 ? (
                    getFilteredNotifications().map((n) => (
                      <div 
                        key={n.id} 
                        onClick={() => markAsRead(n.id)}
                        className={`group flex gap-2.5 items-start p-2.5 rounded-xl border relative transition-colors ${
                          n.unread ? "bg-[var(--primary)]/[0.02] border-[var(--primary)]/5" : "bg-zinc-50/30 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-850"
                        }`}
                      >
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-black text-zinc-900 dark:text-white leading-tight">{n.title}</span>
                            {n.unread && <span className="w-1 h-1 rounded-full bg-[var(--primary)]" />}
                          </div>
                          <p className="text-[9px] text-zinc-500 dark:text-zinc-450 mt-0.5 break-words">{n.message}</p>
                          <span className="text-[8px] text-zinc-400 mt-1 block font-bold">{n.time}</span>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); clearNotification(n.id); }}
                          className="absolute right-1 top-1 p-0.5 text-zinc-350 hover:text-[var(--primary)] opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-zinc-400 text-[10px]">No alerts</div>
                  )}
                </div>
              </div>
            )}
          </div>

          <span className="text-zinc-200 dark:text-zinc-800">|</span>

          {/* Profile Section (Sleek Avatar with Minimalist Profile Menu) */}
          <div className="relative">
            <button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu)
                setShowNotifications(false)
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
                  <p className="text-xs font-black text-zinc-900 dark:text-white leading-tight">{franchiseData?.ownerName || adminData?.name || "Shubham Jamliya"}</p>
                  <p className="text-[9px] text-zinc-400 truncate mt-0.5">{franchiseData?.email || adminData?.email || "shubham@papavegpizza.com"}</p>
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
