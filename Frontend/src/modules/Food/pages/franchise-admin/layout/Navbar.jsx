import React, { useState, useEffect, useRef } from "react"
import { useNavigate, useSearchParams, useLocation } from "react-router-dom"
import {
  Menu, Bell, Store, ChevronDown, User, LogOut, Settings as SettingsIcon,
  AlertCircle, Search, Calendar, Clock, X, Trash2, Plus, Megaphone,
  BarChart3, Sun, Moon, Laptop, Shield, Activity, FileText, Check, CheckCircle2,
  AlertTriangle, ArrowRight, Smartphone
} from "lucide-react"
import { adminAPI } from "@food/api"
import { clearModuleAuth } from "@food/utils/auth"
import { toast } from "sonner"

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
  const [themeMode, setThemeMode] = useState("light")

  // Modals visibility
  const [showAddStoreModal, setShowAddStoreModal] = useState(false)
  const [showBroadcastModal, setShowBroadcastModal] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [showSecurityModal, setShowSecurityModal] = useState(false)
  const [showActivityModal, setShowActivityModal] = useState(false)

  // Session Data & Logs
  const [adminData, setAdminData] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [notificationTab, setNotificationTab] = useState("all") 
  const [newOrdersCount, setNewOrdersCount] = useState(4)

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

    const savedSearches = localStorage.getItem("admin_recent_searches")
    if (savedSearches) {
      setRecentSearches(JSON.parse(savedSearches))
    }

    const savedTheme = localStorage.getItem("sa_themeMode") || "light"
    setThemeMode(savedTheme)
    applyTheme(savedTheme)

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

    const localStores = localStorage.getItem("franchise_stores")
    if (localStores) {
      setStoreList(JSON.parse(localStores))
    } else {
      localStorage.setItem("franchise_stores", JSON.stringify(storeList))
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

  const applyTheme = (mode) => {
    if (mode === "dark") {
      document.documentElement.classList.add("dark")
    } else if (mode === "light") {
      document.documentElement.classList.remove("dark")
    } else {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      if (systemTheme === "dark") {
        document.documentElement.classList.add("dark")
      } else {
        document.documentElement.classList.remove("dark")
      }
    }
  }

  const handleThemeChange = (mode) => {
    setThemeMode(mode)
    localStorage.setItem("sa_themeMode", mode)
    applyTheme(mode)
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
              className="text-xs font-black tracking-wider text-zinc-900 dark:text-white uppercase cursor-pointer select-none hover:text-[var(--primary)] transition-colors"
            >
              PAPA VEG PIZZA
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
                <span>{selectedStore === "All Stores" ? "Bhopal & Indore" : selectedStore}</span>
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
                  {storeList.map((store) => (
                    <button
                      key={store.id}
                      onClick={() => {
                        setSelectedStore(store.name)
                        setShowStoreDropdown(false)
                      }}
                      className={`w-full text-left px-3 py-2 text-xs font-bold transition-colors ${
                        selectedStore === store.name ? "text-[var(--primary)] bg-zinc-50 dark:bg-zinc-800/50" : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                      }`}
                    >
                      {store.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse hidden xs:block" title="Store Online" />
          </div>
        </div>

        {/* MIDDLE SECTION: Clean Search Input */}
        <div ref={searchRef} className="flex-1 max-w-[280px] mx-4 relative hidden md:block z-50">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              id="global-search-input"
              type="text"
              placeholder="Search..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              onFocus={() => setShowRecent(true)}
              className="w-full pl-8.5 pr-8 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-xl text-zinc-800 dark:text-zinc-100 outline-none focus:border-zinc-300 dark:focus:border-zinc-700 transition-all font-semibold placeholder-zinc-400"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
              {searchVal ? (
                <button onClick={() => setSearchVal("")} className="text-zinc-450 hover:text-rose-500">
                  <X size={12} />
                </button>
              ) : (
                <kbd className="hidden lg:inline-block text-[8px] font-bold text-zinc-400 dark:text-zinc-500 bg-zinc-200/40 dark:bg-zinc-800 px-1 py-0.5 rounded">
                  ⌘K
                </kbd>
              )}
            </div>
          </div>

          {/* Search Dropdown */}
          {showRecent && (
            <div className="absolute top-full left-0 w-full mt-1.5 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl shadow-xl p-2.5 z-50 max-h-[300px] overflow-y-auto scrollbar-thin">
              {searchVal.trim() === "" ? (
                <div>
                  <div className="flex justify-between items-center pb-1.5 border-b border-zinc-100 dark:border-zinc-800 mb-1">
                    <span className="text-[9px] font-bold uppercase text-zinc-450 tracking-wider">Recent Searches</span>
                    {recentSearches.length > 0 && (
                      <button onClick={() => { setRecentSearches([]); localStorage.removeItem("admin_recent_searches"); }} className="text-[9px] font-bold text-rose-500 hover:underline">Clear</button>
                    )}
                  </div>
                  {recentSearches.length > 0 ? (
                    recentSearches.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => setSearchVal(item)}
                        className="flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-semibold text-zinc-650 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-850 cursor-pointer transition-colors"
                      >
                        <span className="truncate">{item}</span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            const updated = recentSearches.filter(s => s !== item)
                            setRecentSearches(updated)
                            localStorage.setItem("admin_recent_searches", JSON.stringify(updated))
                          }}
                          className="text-zinc-400 hover:text-rose-500"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-zinc-400 text-xs">No recent searches</div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="pb-1.5 border-b border-zinc-100 dark:border-zinc-800 mb-1">
                    <span className="text-[9px] font-bold uppercase text-zinc-450 tracking-wider">Results ({searchResults.length})</span>
                  </div>
                  {searchResults.length > 0 ? (
                    <div className="space-y-1">
                      {searchResults.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => {
                            setShowRecent(false)
                            navigate(item.route)
                          }}
                          className="flex items-center justify-between p-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-850/50 cursor-pointer text-xs"
                        >
                          <div className="min-w-0 pr-2">
                            <p className="font-bold text-zinc-800 dark:text-zinc-200 truncate">{item.name}</p>
                            <p className="text-[9px] text-zinc-400 uppercase font-semibold">{item.type} • {item.id}</p>
                          </div>
                          <span className="text-[9px] font-bold text-zinc-500">{item.status}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-zinc-400 text-xs">No results found</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

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

          {/* Minimal Quick Actions Trigger (Plain inline plus icon button) */}
          <div className="relative">
            <button
              onClick={() => {
                setShowActionsDropdown(!showActionsDropdown)
                setShowStoreDropdown(false)
                setShowDateDropdown(false)
                setShowNotifications(false)
                setShowProfileMenu(false)
              }}
              className="p-1 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-150 transition-colors cursor-pointer"
              title="Quick Actions"
            >
              <Plus size={18} />
            </button>

            {showActionsDropdown && (
              <div className="absolute right-0 mt-2 w-44 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 shadow-xl py-1.5 z-50 animate-in fade-in duration-100">
                <button
                  onClick={() => { setShowAddStoreModal(true); setShowActionsDropdown(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-left text-zinc-650 dark:text-zinc-300"
                >
                  <Store size={13} className="text-zinc-450" />
                  <span>Add Store</span>
                </button>
                <button
                  onClick={() => { navigate("/franchise-admin/coupons"); setShowActionsDropdown(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-left text-zinc-650 dark:text-zinc-300"
                >
                  <Megaphone size={13} className="text-zinc-450" />
                  <span>Create Coupon</span>
                </button>
                <button
                  onClick={() => { setShowBroadcastModal(true); setShowActionsDropdown(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-left text-zinc-650 dark:text-zinc-300"
                >
                  <Bell size={13} className="text-zinc-450" />
                  <span>Broadcast Alert</span>
                </button>
                <button
                  onClick={() => { navigate("/franchise-admin/reports"); setShowActionsDropdown(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-left text-zinc-650 dark:text-zinc-300 border-t border-zinc-100 dark:border-zinc-800 mt-1 pt-1"
                >
                  <BarChart3 size={13} className="text-zinc-450" />
                  <span>Generate Report</span>
                </button>
              </div>
            )}
          </div>

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
                <span className="absolute top-0 right-0 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-950"></span>
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
                          className="absolute right-1 top-1 p-0.5 text-zinc-350 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
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
                    {adminData?.name
                      ? adminData.name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2)
                      : "FA"}
                  </span>
                )}
              </div>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 shadow-xl py-1.5 z-50 animate-in fade-in duration-100 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800 mb-1.5">
                  <p className="text-xs font-black text-zinc-900 dark:text-white leading-tight">{adminData?.name || "Shubham Jamliya"}</p>
                  <p className="text-[9px] text-zinc-400 truncate mt-0.5">{adminData?.email || "shubham@papavegpizza.com"}</p>
                </div>
                
                {/* Theme Selector Inside Profile Dropdown */}
                <div className="px-3 py-1 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-850">
                  <span className="text-zinc-500 font-semibold text-[11px]">Theme</span>
                  <div className="flex gap-1 border border-zinc-200 dark:border-zinc-800 p-0.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 scale-90 origin-right">
                    {[
                      { id: "light", icon: <Sun size={10} /> },
                      { id: "dark", icon: <Moon size={10} /> },
                      { id: "system", icon: <Laptop size={10} /> }
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
                <button
                  onClick={() => { setShowProfileMenu(false); navigate("/franchise-admin/dashboard/settings"); }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-left text-zinc-650 dark:text-zinc-300"
                >
                  <SettingsIcon size={13} className="text-zinc-450" />
                  <span>Settings</span>
                </button>
                <button
                  onClick={() => { setShowProfileMenu(false); setShowSecurityModal(true); }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-left text-zinc-650 dark:text-zinc-300"
                >
                  <Shield size={13} className="text-zinc-450" />
                  <span>Security settings</span>
                </button>
                <button
                  onClick={() => { setShowProfileMenu(false); setShowActivityModal(true); }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-left text-zinc-650 dark:text-zinc-300"
                >
                  <Activity size={13} className="text-zinc-450" />
                  <span>Activity Logs</span>
                </button>
                <div className="border-t border-zinc-100 dark:border-zinc-800 my-1"></div>
                <button
                  onClick={() => { setShowProfileMenu(false); setShowLogoutModal(true); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20"
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

      {/* 1. ADD STORE MODAL */}
      {showAddStoreModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-150 dark:border-zinc-800 max-w-md w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-100 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            <div className="px-6 py-4.5 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-100 dark:border-zinc-850 flex justify-between items-center">
              <div>
                <h3 className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Store size={15} className="text-[var(--primary)]" />
                  Create Franchise Store
                </h3>
              </div>
              <button onClick={() => setShowAddStoreModal(false)} className="p-1 bg-zinc-100 dark:bg-zinc-800 rounded-full hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/20 transition-colors">
                <X size={12} />
              </button>
            </div>
            
            <form onSubmit={handleAddStoreSubmit} className="p-5 space-y-3.5">
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase text-zinc-500">Store Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Papa Veg Pizza Indore Central"
                  required
                  value={storeForm.name}
                  onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
                  className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl text-zinc-800 dark:text-zinc-105 outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase text-zinc-500">Location City</label>
                <select
                  value={storeForm.location}
                  onChange={(e) => setStoreForm({ ...storeForm, location: e.target.value })}
                  className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl text-zinc-855 dark:text-zinc-300 outline-none"
                >
                  <option value="Indore">Indore</option>
                  <option value="Bhopal">Bhopal</option>
                  <option value="Ujjain">Ujjain</option>
                  <option value="Gwalior">Gwalior</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase text-zinc-500">Full Address *</label>
                <textarea
                  placeholder="e.g. G-1, Golden Trade Center, Rajendra Nagar"
                  required
                  rows={2}
                  value={storeForm.address}
                  onChange={(e) => setStoreForm({ ...storeForm, address: e.target.value })}
                  className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl text-zinc-800 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-[var(--primary)]/20 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase text-zinc-500">Store Manager *</label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Chandra"
                  required
                  value={storeForm.manager}
                  onChange={(e) => setStoreForm({ ...storeForm, manager: e.target.value })}
                  className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-850 rounded-xl text-zinc-800 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase text-zinc-500">Operating Hours</label>
                <input
                  type="text"
                  placeholder="e.g. 11:00 AM - 11:00 PM"
                  value={storeForm.hours}
                  onChange={(e) => setStoreForm({ ...storeForm, hours: e.target.value })}
                  className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-850 rounded-xl text-zinc-800 dark:text-zinc-100 outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddStoreModal(false)}
                  className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[var(--primary)] hover:opacity-90 text-white font-bold rounded-xl"
                >
                  Create Store
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. BROADCAST MODAL */}
      {showBroadcastModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-150 dark:border-zinc-800 max-w-md w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-100 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            <div className="px-6 py-4.5 bg-zinc-50 dark:bg-zinc-955 border-b border-zinc-100 dark:border-zinc-855 flex justify-between items-center">
              <div>
                <h3 className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Megaphone size={15} className="text-[var(--primary)]" />
                  Broadcast Alert Notification
                </h3>
              </div>
              <button onClick={() => setShowBroadcastModal(false)} className="p-1 bg-zinc-100 dark:bg-zinc-800 rounded-full hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/20 transition-colors">
                <X size={12} />
              </button>
            </div>
            
            <form onSubmit={handleBroadcastSubmit} className="p-5 space-y-3.5">
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase text-zinc-500">Alert Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Critical stock delay"
                  required
                  value={broadcastForm.title}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                  className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl text-zinc-800 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase text-zinc-500">Target Stores</label>
                <select
                  value={broadcastForm.targetStore}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, targetStore: e.target.value })}
                  className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl text-zinc-855 dark:text-zinc-300 outline-none"
                >
                  <option value="All Stores">All Stores</option>
                  {storeList.map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase text-zinc-500">Broadcast message *</label>
                <textarea
                  placeholder="Type the message to broadcast to terminals..."
                  required
                  rows={3}
                  value={broadcastForm.message}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
                  className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl text-zinc-800 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-[var(--primary)]/20 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase text-zinc-500">Alert Priority</label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {["low", "medium", "high"].map((prio) => (
                    <button
                      key={prio}
                      type="button"
                      onClick={() => setBroadcastForm({ ...broadcastForm, priority: prio })}
                      className={`py-2 text-[10px] font-bold uppercase rounded-xl border text-center transition-all ${
                        broadcastForm.priority === prio
                          ? prio === "high" ? "bg-rose-50 border-rose-300 text-rose-600 dark:bg-rose-955" : 
                            prio === "medium" ? "bg-amber-50 border-amber-300 text-amber-600 dark:bg-amber-955" : 
                            "bg-emerald-50 border-emerald-300 text-emerald-600 dark:bg-emerald-955"
                          : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-500"
                      }`}
                    >
                      {prio}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[var(--primary)] hover:opacity-90 text-white font-bold rounded-xl"
                >
                  Broadcast
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. LOGOUT CONFIRMATION MODAL */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-150 dark:border-zinc-800 max-w-sm w-full overflow-hidden shadow-2xl p-5 text-center animate-in zoom-in-95 duration-100">
            <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/20 text-rose-500 flex items-center justify-center mx-auto mb-3 border border-rose-100">
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
                className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. SECURITY SETTINGS MODAL */}
      {showSecurityModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-150 dark:border-zinc-800 max-w-md w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-100 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            <div className="px-6 py-4.5 bg-zinc-50 dark:bg-zinc-955 border-b border-zinc-100 dark:border-zinc-850 flex justify-between items-center">
              <div>
                <h3 className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Shield size={15} className="text-[var(--primary)]" />
                  Security Settings
                </h3>
              </div>
              <button onClick={() => setShowSecurityModal(false)} className="p-1 bg-zinc-100 dark:bg-zinc-800 rounded-full hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/20 transition-colors">
                <X size={12} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-850 rounded-xl">
                <div>
                  <p className="font-bold text-zinc-900 dark:text-white text-xs">Two-Factor Authentication (2FA)</p>
                  <p className="text-[9px] text-zinc-400 mt-0.5 leading-relaxed">Secure your administrative login with Authenticator OTP.</p>
                </div>
                <div className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-8 h-4 bg-zinc-200 dark:bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[var(--primary)]"></div>
                </div>
              </div>

              <div>
                <p className="text-[9px] font-bold uppercase text-zinc-500 tracking-wider mb-1.5">Connected Devices</p>
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  <div className="flex items-center justify-between p-2 border border-zinc-100 dark:border-zinc-850 rounded-lg">
                    <div>
                      <p className="font-bold text-[11px] text-zinc-800 dark:text-zinc-200">iPhone 15 Pro • Indore</p>
                      <p className="text-[9px] text-zinc-400">Vite Browser client • Active now</p>
                    </div>
                    <span className="text-[8px] bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 px-1.5 py-0.5 rounded font-bold border border-emerald-100 dark:border-emerald-900/30">THIS DEVICE</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-2 border border-zinc-100 dark:border-zinc-850 rounded-lg">
                    <div>
                      <p className="font-bold text-[11px] text-zinc-800 dark:text-zinc-200">Windows PC • Bhopal</p>
                      <p className="text-[9px] text-zinc-400">Chrome Client • Last active 2 hrs ago</p>
                    </div>
                    <button className="text-[9px] font-bold text-rose-500 hover:underline">REVOKE</button>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowSecurityModal(false)}
                  className="flex-1 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl hover:bg-zinc-200 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. ACTIVITY LOGS MODAL */}
      {showActivityModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-150 dark:border-zinc-800 max-w-lg w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-100 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            <div className="px-6 py-4.5 bg-zinc-50 dark:bg-zinc-955 border-b border-zinc-100 dark:border-zinc-850 flex justify-between items-center">
              <div>
                <h3 className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Activity size={15} className="text-[var(--primary)]" />
                  Administrative Audit Logs
                </h3>
              </div>
              <button onClick={() => setShowActivityModal(false)} className="p-1 bg-zinc-100 dark:bg-zinc-800 rounded-full hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/20 transition-colors">
                <X size={12} />
              </button>
            </div>

            <div className="p-5 space-y-3.5">
              <div className="border border-zinc-100 dark:border-zinc-850 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-zinc-50 dark:bg-zinc-950 text-[9px] font-black uppercase text-zinc-400 tracking-wider border-b border-zinc-100 dark:border-zinc-850">
                    <tr>
                      <th className="px-3 py-2">Security Event</th>
                      <th className="px-3 py-2">Store Node</th>
                      <th className="px-3 py-2 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 text-zinc-650 dark:text-zinc-400 font-medium">
                    {[
                      { event: "Coupon Code Created (NEWYEAR50)", node: "Indore Central", time: "Just now" },
                      { event: "Inventory Threshold Updated (Cheese)", node: "Indore Central", time: "15 mins ago" },
                      { event: "Admin Login Approved", node: "Bhopal Zone", time: "1 hr ago" }
                    ].map((log, idx) => (
                      <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/25 transition-colors">
                        <td className="px-3 py-2 font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1">
                          <CheckCircle2 size={11} className="text-emerald-500 shrink-0" />
                          {log.event}
                        </td>
                        <td className="px-3 py-2">{log.node}</td>
                        <td className="px-3 py-2 text-right text-[9px] font-mono text-zinc-450">{log.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowActivityModal(false)}
                  className="flex-1 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl hover:bg-zinc-200 transition-all text-center"
                >
                  Close Logs
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
