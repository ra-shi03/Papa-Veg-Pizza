import React, { useState, useEffect } from "react"
import {
  TrendingUp,
  ShoppingBag,
  Truck,
  Users,
  Store,
  Percent,
  Calendar,
  Search,
  CheckCircle,
  AlertTriangle,
  Info,
  DollarSign,
  ChevronRight,
  RefreshCw,
  Sliders,
  Send,
  UserCheck,
  ChevronDown,
  Navigation,
  Sparkles,
  MapPin,
  Pizza,
  ArrowUpRight,
  ShieldAlert,
  HelpCircle,
  FileCheck,
  Smartphone,
  Trophy,
  Activity,
  HeartHandshake
} from "lucide-react"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  Cell
} from "recharts"
import Sidebar from "../layouts/Sidebar"
import Navbar from "../layouts/Navbar"

// Custom sparkline representation helper for Bento cards
const Sparkline = ({ data, stroke, className = "w-full h-8 overflow-visible opacity-40" }) => {
  return (
    <svg className={className} viewBox="0 0 100 30" preserveAspectRatio="none">
      <path
        d={`M ${data.map((val, idx) => `${(idx / (data.length - 1)) * 100} ${30 - val}`).join(" L ")}`}
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

import { useSystemTheme } from "@/shared/utils/themeSync"
import { adminAPI } from "@/services/api"
import { toast } from "sonner"

export default function SuperAdminDashboard() {
  // Navigation drawer and theme state
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeItem, setActiveItem] = useState("Dashboard")
  const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem("sa_sidebar_collapsed") === "true")

  // Real-time Dynamic Color Theme Settings
  const { themeMode, primaryColor, secondaryColor } = useSystemTheme()
  const [showThemePanel, setShowThemePanel] = useState(false)

  // Predefined theme palettes
  const colorPalettes = [
    { name: "Sunset Flame (Default)", primary: "#a43c12", secondary: "#ff7f50" },
    { name: "Forest Emerald", primary: "#047857", secondary: "#10b981" },
    { name: "Royal Velvet", primary: "#7e3866", secondary: "#b18da5" },
    { name: "Midnight Sapphire", primary: "#1d4ed8", secondary: "#3b82f6" },
    { name: "Charcoal Steel", primary: "#374151", secondary: "#6b7280" }
  ]

  // Set colors dynamically to local storage and dispatch event
  const handleColorChange = (newPrimary, newSecondary) => {
    localStorage.setItem("sa_primary", newPrimary)
    localStorage.setItem("sa_secondary", newSecondary)
    window.dispatchEvent(new Event("systemThemeChanged"))
  }

  const [isSavingTheme, setIsSavingTheme] = useState(false);
  const handleSaveThemeGlobally = async () => {
    try {
      setIsSavingTheme(true);
      await adminAPI.updateBusinessSettings({
        primaryColor: primaryColor,
        secondaryColor: secondaryColor,
        themeMode: localStorage.getItem("sa_themeMode") || "light",
      });
      // Update the cached food_business_settings with new colors.
      // This is what all other panels read from on load.
      try {
        const existing = localStorage.getItem("food_business_settings");
        const cached = existing ? JSON.parse(existing) : {};
        cached.primaryColor = primaryColor;
        cached.secondaryColor = secondaryColor;
        cached.themeMode = localStorage.getItem("sa_themeMode") || "light";
        localStorage.setItem("food_business_settings", JSON.stringify(cached));
      } catch (e) {}

      // Notify this tab's React tree to re-apply colors from the updated cache
      window.dispatchEvent(new Event("systemThemeChanged"));
      toast.success("Theme published successfully to all panels!");
    } catch (error) {
      console.error("Failed to save theme:", error);
      toast.error("Failed to publish theme.");
    } finally {
      setIsSavingTheme(false);
    }
  }

  // Handle dark mode toggle
  const handleThemeModeToggle = (mode) => {
    localStorage.setItem("sa_themeMode", mode)
    window.dispatchEvent(new Event("systemThemeChanged"))
  }

  // KPI Bento stats state
  const [kpis, setKpis] = useState([
    { title: "Net Revenue", val: "₹42.8L", growth: "+12%", up: true, icon: DollarSign, sparkData: [10, 15, 8, 22, 14, 28, 20], color: "text-[var(--primary)] bg-[var(--primary)]/10" },
    { title: "Live Orders", val: "1,204", growth: "+8%", up: true, icon: ShoppingBag, sparkData: [5, 12, 15, 10, 22, 18, 25], color: "text-[var(--primary)] bg-[var(--primary)]/10" },
    { title: "Active Riders", val: "342", growth: "-3%", up: false, icon: Truck, sparkData: [24, 22, 25, 20, 19, 18, 17], color: "text-[var(--primary)] bg-[var(--primary)]/10" },
    { title: "New Users", val: "892", growth: "+18%", up: true, icon: Users, sparkData: [12, 18, 22, 19, 25, 30, 32], color: "text-[var(--primary)] bg-[var(--primary)]/10" },
    { title: "Active Stores", val: "24", growth: "0%", up: true, icon: Store, sparkData: [24, 24, 24, 24, 24, 24, 24], color: "text-[var(--primary)] bg-[var(--primary)]/10" },
    { title: "Comm. Earned", val: "₹6.4L", growth: "+4%", up: true, icon: Percent, sparkData: [8, 10, 14, 12, 16, 18, 20], color: "text-[var(--primary)] bg-[var(--primary)]/10" }
  ])

  // Recharts interactive state: Hourly vs Daily Sales Trend
  const [chartInterval, setChartInterval] = useState("Hourly")
  const hourlyData = [
    { time: "10 AM", revenue: 8000, orders: 120 },
    { time: "12 PM", revenue: 15000, orders: 240 },
    { time: "2 PM", revenue: 12000, orders: 180 },
    { time: "4 PM", revenue: 9000, orders: 150 },
    { time: "6 PM", revenue: 22000, orders: 310 },
    { time: "8 PM", revenue: 31000, orders: 480 },
    { time: "10 PM", revenue: 18000, orders: 290 }
  ]
  const dailyData = [
    { time: "Mon", revenue: 210000, orders: 1400 },
    { time: "Tue", revenue: 230000, orders: 1560 },
    { time: "Wed", revenue: 195000, orders: 1210 },
    { time: "Thu", revenue: 260000, orders: 1800 },
    { time: "Fri", revenue: 380000, orders: 2400 },
    { time: "Sat", revenue: 490000, orders: 3200 },
    { time: "Sun", revenue: 430000, orders: 2850 }
  ]
  const currentChartData = chartInterval === "Hourly" ? hourlyData : dailyData

  // Live monitor order categories & lists
  const [orderFilter, setOrderFilter] = useState("New")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedOrder, setSelectedOrder] = useState(null)

  const liveOrders = [
    { id: "PV-9042", name: "Rohan Malhotra", items: "Paneer Tikka Pizza x1, Pepsi x1", total: "₹450", time: "08:24", status: "New", distance: "2.4 km", rating: 4.8, rider: "Pending Allocation", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100" },
    { id: "PV-9041", name: "Isha Sharma", items: "Veg Supreme Pizza x1, Garlic Bread x1", total: "₹590", time: "12:15", status: "New", distance: "1.8 km", rating: 4.5, rider: "Pending Allocation", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100" },
    { id: "PV-9039", name: "Amit Verma", items: "Margherita Pizza x2, Garlic Dips x4", total: "₹380", time: "18:40", status: "Prep", distance: "3.5 km", rating: 4.2, rider: "Karan Singh", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100" },
    { id: "PV-9038", name: "Pooja Patel", items: "Farmhouse Delight Pizza x1", total: "₹320", time: "Ready", status: "Ready", distance: "0.8 km", rating: 4.9, rider: "Vikram Rathore", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100" },
    { id: "PV-9036", name: "Deepak Rawat", items: "Tandoori Paneer Pizza x1, Choco Lava Cake x1", total: "₹520", time: "Transit", status: "Delivery", distance: "4.2 km", rating: 4.0, rider: "Rahul Dev", avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=100" }
  ]

  // Filter orders by category and query
  const filteredOrders = liveOrders.filter(order => {
    const matchesTab = order.status === orderFilter
    const matchesQuery =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesTab && matchesQuery
  })

  // Franchise stats state
  const franchises = [
    { rank: 1, name: "Indore Central", rev: "₹8.4L", growth: "+14%", rating: "92%", type: "Platinum", color: "bg-amber-500" },
    { rank: 2, name: "Bhopal Zone", rev: "₹6.2L", growth: "+9%", rating: "88%", type: "Gold", color: "bg-zinc-400" },
    { rank: 3, name: "Ujjain Branch", rev: "₹4.8L", growth: "+2%", rating: "85%", type: "Silver", color: "bg-orange-400" }
  ]

  // Dynamic inventory warnings state
  const [inventory, setInventory] = useState([
    { id: 1, name: "Processed Cheese", stock: "12%", status: "Critical", branch: "Indore Central", loading: false, resolved: false },
    { id: 2, name: "Wheat Dough", stock: "14%", status: "Low Warning", branch: "Ujjain Branch", loading: false, resolved: false }
  ])

  // Restock simulation
  const handleRestock = (id) => {
    setInventory(prev =>
      prev.map(item => (item.id === id ? { ...item, loading: true } : item))
    )

    // Simulate API delay
    setTimeout(() => {
      setInventory(prev =>
        prev.map(item =>
          item.id === id ? { ...item, stock: "85%", status: "Healthy", loading: false, resolved: true } : item
        )
      )
      // Display native alert/notification simulation
      setSystemAlerts(prev => [
        { id: Date.now(), text: `Inventory refilled: ${inventory.find(i => i.id === id).name} updated to 85% at branch.`, severity: "info", time: "Just now" },
        ...prev
      ])
    }, 1500)
  }

  // Payout Settlements state and interactive modal
  const [showPayoutModal, setShowPayoutModal] = useState(false)
  const [payoutAmount, setPayoutAmount] = useState("12,45,000")
  const [selectedBank, setSelectedBank] = useState("HDFC Corporate Bank (**** 8940)")
  const [payoutStatus, setPayoutStatus] = useState("idle") // idle, processing, success

  const handleInitiatePayout = (e) => {
    e.preventDefault()
    setPayoutStatus("processing")
    setTimeout(() => {
      setPayoutStatus("success")
      setTimeout(() => {
        setShowPayoutModal(false)
        setPayoutStatus("idle")
        setPayoutAmount("0")
        // Add log
        setSystemAlerts(prev => [
          { id: Date.now(), text: `Bank settlement of ₹12,45,000 cleared with transaction ID #TXN-88402.`, severity: "success", time: "Just now" },
          ...prev
        ])
      }, 1500)
    }, 2000)
  }

  // System alerts/logs state
  const [systemAlerts, setSystemAlerts] = useState([
    { id: 1, text: "Failed Payment Gateway: Razorpay has registered 12 failed transactions in the last 5 minutes.", severity: "severe", time: "5 min ago" },
    { id: 2, text: "Rider Complaint: Store #022 reported rider #R440 for verbal misconduct and order delays.", severity: "warning", time: "15 min ago" },
    { id: 3, text: "System Backup Successful: Daily scheduled database backup was successfully archived.", severity: "info", time: "4 hours ago" }
  ])

  const removeAlert = (id) => {
    setSystemAlerts(prev => prev.filter(alert => alert.id !== id))
  }

  // Rider tracking radar state (simulated city marker clicking)
  const [activeRiderDetails, setActiveRiderDetails] = useState(null)
  const simulatedRiders = [
    { name: "Rahul Dev", order: "#PV-9036", status: "Delivering", bike: "Activa 6G", phone: "+91 98402 12903", lat: 35, lng: 40 },
    { name: "Vikram Rathore", order: "#PV-9038", status: "At Store", bike: "Pulsar 150", phone: "+91 88401 22894", lat: 60, lng: 70 },
    { name: "Karan Singh", order: "#PV-9039", status: "Cooking Wait", bike: "Splendor Plus", phone: "+91 74029 88390", lat: 45, lng: 20 }
  ]

  return (
    <div className="superadmin-theme min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 transition-all duration-300">

      {/* Shared Navbar Layout */}
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      {/* Shared Sidebar Layout */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeItem={activeItem}
        setActiveItem={setActiveItem}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => {
          const next = !isCollapsed
          setIsCollapsed(next)
          localStorage.setItem("sa_sidebar_collapsed", next ? "true" : "false")
        }}
      />

      {/* Main Container Area */}
      <main className={`pt-16 pb-12 px-3 md:px-4 transition-all duration-300 ${isCollapsed ? "lg:ml-[72px]" : "lg:ml-[280px]"}`}>

        {/* Dynamic Navigation Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-black dark:text-white">
                {activeItem === "Dashboard" ? "SuperAdmin Dashboard" : activeItem}
              </h2>
              <span className="animate-pulse bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-emerald-500/20">
                Live Feed
              </span>
            </div>
            <p className="text-black dark:text-white text-xs font-medium mt-0.5">
              Currently monitoring 24 pizza store channels across the central region.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-1.5 w-full sm:flex sm:items-center sm:gap-2 sm:w-auto">
            {/* Quick Settings Customizer Toggle */}
            <button
              onClick={() => setShowThemePanel(!showThemePanel)}
              className="flex items-center justify-center gap-1 px-2.5 py-1.5 text-[10px] sm:text-xs font-bold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg shadow-sm transition-all text-black dark:text-white w-full whitespace-nowrap"
            >
              <Sliders size={12} className="text-[var(--primary)] shrink-0" />
              <span className="hidden sm:inline">Theme Controls</span>
              <span className="sm:hidden">Theme</span>
            </button>

            {/* Datepicker Simulation */}
            <button className="flex items-center justify-center gap-1 px-2.5 py-1.5 text-[10px] sm:text-xs font-bold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm hover:bg-zinc-50 text-[var(--primary)] dark:text-white w-full whitespace-nowrap">
              <Calendar size={12} className="shrink-0" />
              <span>Today: {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
              <ChevronDown size={10} className="opacity-60 shrink-0 hidden sm:block" />
            </button>
          </div>
        </header>

        {/* Real-time Settings Panel */}
        {showThemePanel && (
          <section className="mb-8 p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 shadow-lg animate-fade-down">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800 mb-5">
              <div className="flex items-center gap-2.5">
                <Sliders size={18} className="text-[var(--primary)]" />
                <h3 className="font-bold text-sm text-zinc-800 dark:text-zinc-100">Settings & Theme Customization</h3>
              </div>
              <span className="text-[10px] font-bold text-zinc-400">Dynamic Styles</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Advanced Color Pickers */}
              <div className="space-y-4">
                <label className="text-xs font-bold text-zinc-500 block">Advanced Custom Colors</label>
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between gap-4 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30">
                    <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Primary Color</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold w-16 text-right">{primaryColor}</span>
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => {
                          handleColorChange(e.target.value, secondaryColor);
                        }}
                        className="w-8 h-8 rounded-lg overflow-hidden border-0 cursor-pointer shrink-0"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30">
                    <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Accent Color</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold w-16 text-right">{secondaryColor}</span>
                      <input
                        type="color"
                        value={secondaryColor}
                        onChange={(e) => handleColorChange(primaryColor, e.target.value)}
                        className="w-8 h-8 rounded-lg overflow-hidden border-0 cursor-pointer shrink-0"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Theme Mode Toggle */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-zinc-500">Dark / Light Interface</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleThemeModeToggle("light")}
                    className={`p-3 rounded-xl border text-xs font-bold text-center transition-all ${themeMode === "light"
                      ? "border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)]"
                      : "border-zinc-100 dark:border-zinc-800 text-zinc-500"
                      }`}
                  >
                    🌞 Light Mode
                  </button>
                  <button
                    onClick={() => handleThemeModeToggle("dark")}
                    className={`p-3 rounded-xl border text-xs font-bold text-center transition-all ${themeMode === "dark"
                      ? "border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)]"
                      : "border-zinc-100 dark:border-zinc-800 text-zinc-500"
                      }`}
                  >
                    🌙 Dark Mode
                  </button>
                </div>
                <div className="pt-2 text-[10px] text-zinc-400 leading-normal">
                  *Colors will update layout indicators, active tags, and hover triggers dynamically via CSS root parameters.
                </div>
              </div>

              {/* Publish Globally Button */}
              <div className="pt-2">
                <button
                  onClick={handleSaveThemeGlobally}
                  disabled={isSavingTheme}
                  className="w-full py-3 rounded-xl bg-[var(--primary)] text-white font-bold text-sm shadow-md shadow-[var(--primary)]/20 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {isSavingTheme ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    <span>🌍 Publish Theme to All Panels</span>
                  )}
                </button>
                <p className="text-[9px] text-zinc-400 text-center mt-2">
                  Applies the current colors to Franchise Admin and Store Operations instantly.
                </p>
              </div>

            </div>
          </section>
        )}

        {/* KPI Bento Grid */}
        <section className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-4">
          {kpis.map((kpi, index) => {
            const Icon = kpi.icon
            return (
              <div
                key={index}
                className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-855 p-3 rounded-lg flex items-center justify-between hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-sm cursor-pointer"
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-[10px] font-bold text-black dark:text-white uppercase tracking-wider truncate">
                    {kpi.title}
                  </span>
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-lg font-black text-black dark:text-white">{kpi.val}</span>
                    <span
                      className={`text-[8px] font-extrabold px-1 py-0.2 rounded-full flex items-center gap-0.5 ${
                        kpi.growth.startsWith("-")
                          ? "text-rose-600 bg-rose-50 dark:bg-rose-950/20"
                          : kpi.growth === "0%"
                            ? "text-black bg-zinc-100 dark:bg-zinc-800 dark:text-white"
                            : "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20"
                      }`}
                    >
                      {kpi.growth}
                    </span>
                  </div>
                  <div className="w-16 mt-1 opacity-60">
                    <Sparkline data={kpi.sparkData} stroke={kpi.up ? primaryColor : "#ef4444"} className="w-full h-4 overflow-visible" />
                  </div>
                </div>

                <div className={`p-1.5 rounded-md border border-zinc-100 dark:border-zinc-800 ${kpi.color} flex items-center justify-center shrink-0`}>
                  <Icon size={14} className="stroke-[2.2]" />
                </div>
              </div>
            )
          })}
        </section>

        {/* Charts & Monitoring Columns */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

          {/* Live Monitor Order Board */}
          <div className="lg:col-span-1 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-4 rounded-xl flex flex-col shadow-sm max-h-[420px]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--primary)] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--primary)]"></span>
                </span>
                <h3 className="font-extrabold text-xs text-black dark:text-white">Live Monitor</h3>
              </div>
              <span className="text-[9px] font-bold text-black dark:text-white opacity-60">Total Live: 108</span>
            </div>

            {/* Live tabs */}
            <div className="flex gap-1 mb-3 overflow-x-auto pb-1 scrollbar-thin">
              {["New", "Prep", "Ready", "Delivery"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setOrderFilter(tab)}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold whitespace-nowrap transition-all duration-200 ${orderFilter === tab
                    ? "bg-[var(--primary)] text-white shadow-sm"
                    : "bg-zinc-50 dark:bg-zinc-950 text-black dark:text-white hover:text-zinc-800 dark:hover:text-zinc-200 opacity-70"
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Quick search input */}
            <div className="relative mb-3">
              <Search className="absolute left-2.5 top-2 text-black dark:text-white opacity-60" size={12} />
              <input
                type="text"
                placeholder="Search order ID or client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-[10px] pl-8 pr-3 py-1.5 border border-zinc-100 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-950/50 text-black dark:text-white focus:outline-none focus:border-[var(--primary)] transition-colors"
              />
            </div>

            {/* Reactive Orders List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className="group flex items-center gap-2.5 p-2 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 hover:bg-white dark:hover:bg-zinc-850 hover:shadow-md hover:border-[var(--primary)]/30 cursor-pointer transition-all duration-300"
                  >
                    <img
                      src={order.avatar}
                      alt={order.name}
                      className="w-8 h-8 rounded-lg object-cover shadow-sm group-hover:scale-105 transition-transform"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className="text-[10px] font-bold text-black dark:text-white">{order.id}</p>
                        <span className="text-[8px] font-bold text-[var(--primary)] animate-pulse">{order.time}</span>
                      </div>
                      <p className="text-[9px] text-black dark:text-white font-semibold truncate mt-0.5">{order.name}</p>
                      <p className="text-[8px] text-black dark:text-white opacity-60 font-medium truncate mt-0.5">{order.items}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <Pizza className="mx-auto text-black dark:text-white opacity-40 stroke-[1.5] mb-1.5" size={24} />
                  <p className="text-[10px] text-black dark:text-white opacity-60 font-bold">No live orders matches found</p>
                </div>
              )}
            </div>

          </div>

          {/* Interactive Recharts Chart Area */}
          <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-4 rounded-xl shadow-sm flex flex-col justify-between max-h-[420px]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div>
                <h3 className="font-extrabold text-xs text-black dark:text-white flex items-center gap-1.5">
                  <TrendingUp size={14} className="text-[var(--primary)]" />
                  Financial Revenue & Traffic Trend
                </h3>
                <p className="text-[10px] text-black dark:text-white opacity-60 font-semibold mt-0.5">Real-time dynamic sales tracking index</p>
              </div>

              {/* Intervals toggles */}
              <div className="flex bg-zinc-50 dark:bg-zinc-950 p-0.5 rounded-lg self-start sm:self-center">
                {["Hourly", "Daily"].map((interval) => (
                  <button
                    key={interval}
                    onClick={() => setChartInterval(interval)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${chartInterval === interval
                      ? "bg-[var(--primary)] text-white shadow-sm"
                      : "text-black dark:text-white opacity-60 hover:opacity-100"
                      }`}
                  >
                    {interval}
                  </button>
                ))}
              </div>
            </div>

            {/* Responsive Graph Canvas */}
            <div className="h-[230px] w-full mt-1 min-w-0 min-h-0">
              <ResponsiveContainer width="99%" height="100%" minWidth={1} minHeight={1}>
                <AreaChart data={currentChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={primaryColor} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={primaryColor} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="time"
                    stroke="#888888"
                    fontSize={9}
                    tickLine={false}
                    axisLine={false}
                    dy={5}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={9}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `₹${value >= 1000 ? `${value / 1000}k` : value}`}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      borderRadius: "8px",
                      borderColor: "rgba(0, 0, 0, 0.05)",
                      fontSize: "10px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                    }}
                    labelStyle={{ fontWeight: "bold" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue Index"
                    stroke={primaryColor}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="flex justify-between items-center border-t border-zinc-50 dark:border-zinc-800 pt-2.5 mt-2.5 text-[9px] text-black dark:text-white opacity-60 font-semibold">
              <span>*Refreshed in sync with POS systems</span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-ping" />
                Active Sales Channel
              </span>
            </div>

          </div>

        </section>

        {/* Middle Interactive Column Grid: Franchises & Radar Map */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

          {/* Top Franchises ranking leaderboard */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-4 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-xs text-black dark:text-white flex items-center gap-1.5">
                <Trophy size={14} className="text-amber-500" />
                Top Franchises Leaderboard
              </h3>
              <span className="text-[9px] font-bold text-emerald-605 bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.2 rounded-full">
                Revenue Growth Peak
              </span>
            </div>

            <div className="space-y-2.5">
              {franchises.map((branch, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2.5 bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-855 hover:border-[var(--primary)]/30 rounded-xl shadow-inner transition-all duration-300 hover:scale-[1.01]"
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-6.5 h-6.5 rounded-full ${branch.color} text-white flex items-center justify-center font-bold text-[10px] shadow-sm`}>
                      {branch.rank}
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-black dark:text-white">{branch.name}</p>
                      <p className="text-[9px] text-black dark:text-white opacity-60 font-semibold mt-0.5">Rating: {branch.rating} • {branch.type}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-[11px] font-black text-black dark:text-white">{branch.rev}</p>
                    <p className="text-[9px] font-bold text-emerald-600 mt-0.5">{branch.growth}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive fleet radar map preview */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-4 rounded-xl shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3 z-10">
              <div>
                <h3 className="font-extrabold text-xs text-black dark:text-white flex items-center gap-1.5">
                  <Navigation size={14} className="text-[var(--primary)]" />
                  Rider Radar Fleet Tracking
                </h3>
                <p className="text-[9px] text-black dark:text-white opacity-60 font-semibold mt-0.5">Click active coordinate dots to view transit status</p>
              </div>

              <div className="text-right">
                <p className="text-xs font-black text-[var(--primary)]">24 mins</p>
                <p className="text-[8px] text-black dark:text-white opacity-60 font-bold uppercase">Avg Transit time</p>
              </div>
            </div>

            {/* Radar layout preview canvas */}
            <div className="relative h-[180px] bg-zinc-950 rounded-xl overflow-hidden flex items-center justify-center shadow-inner border border-zinc-850">

              {/* Radar circles */}
              <div className="absolute w-[180px] h-[180px] rounded-full border border-zinc-800/40 animate-pulse" />
              <div className="absolute w-[120px] h-[120px] rounded-full border border-zinc-800/20" />
              <div className="absolute w-[60px] h-[60px] rounded-full border border-zinc-800/10" />
              <div className="absolute w-full h-[1px] bg-zinc-800/25" />
              <div className="absolute h-full w-[1px] bg-zinc-800/25" />

              {/* Central hub indicator */}
              <div className="absolute w-3.5 h-3.5 bg-[var(--primary)] border-2 border-white rounded-full z-20 shadow-md">
                <span className="absolute -top-6 -left-8 text-[9px] bg-white text-zinc-900 border border-zinc-200 font-black px-1 py-0.5 rounded shadow-sm">HQ HUB</span>
              </div>

              {/* Coordinates representation dots */}
              {simulatedRiders.map((rider, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveRiderDetails(rider)}
                  style={{ top: `${rider.lat}%`, left: `${rider.lng}%` }}
                  className="absolute w-3.5 h-3.5 bg-emerald-500 rounded-full border border-white shadow-lg animate-bounce z-10 transition-transform hover:scale-125 focus:outline-none"
                  title="Click to view courier info"
                />
              ))}

              {/* Rider overlay details modal */}
              {activeRiderDetails ? (
                <div className="absolute bottom-3 left-3 right-3 p-3 rounded-xl bg-zinc-900/95 border border-zinc-800 backdrop-blur-md text-white flex items-center justify-between shadow-2xl z-30 animate-fade-down">
                  <div className="min-w-0">
                    <p className="text-[11px] font-black tracking-tight">{activeRiderDetails.name}</p>
                    <p className="text-[9px] text-zinc-400 mt-0.5 font-medium">Order: {activeRiderDetails.order} • Status: {activeRiderDetails.status}</p>
                    <p className="text-[9px] text-emerald-400 font-bold mt-0.5">{activeRiderDetails.phone}</p>
                  </div>
                  <button
                    onClick={() => setActiveRiderDetails(null)}
                    className="text-[9px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-extrabold px-2 py-1 rounded"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <div className="absolute bottom-3 left-3 bg-zinc-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-zinc-800">
                  <p className="text-[9px] font-black text-white">12 Active Riders live on transit grid</p>
                </div>
              )}
            </div>

          </div>

        </section>

        {/* Inventory Critical Widget & Customer Retention Indicators */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">

          {/* Inventory warning cards */}
          {inventory.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-xl border-2 border-dashed shadow-sm flex flex-col justify-between transition-colors ${item.resolved
                ? "border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/5"
                : item.status === "Critical"
                  ? "border-rose-500/30 bg-rose-500/5 dark:bg-rose-950/5 text-black dark:text-white"
                  : "border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/5 text-black dark:text-white"
                }`}
            >
              <div className="flex items-center gap-1.5 mb-2.5">
                {item.resolved ? (
                  <CheckCircle size={14} className="text-emerald-500" />
                ) : (
                  <AlertTriangle size={14} className={item.status === "Critical" ? "text-rose-500 animate-pulse" : "text-amber-500"} />
                )}
                <p className={`font-bold text-[10px] uppercase ${item.resolved ? "text-emerald-605" : item.status === "Critical" ? "text-rose-600" : "text-amber-600"
                  }`}>
                  {item.resolved ? "Stock Healthy" : `Inventory ${item.status}`}
                </p>
              </div>

              <div>
                <p className="font-extrabold text-xs text-black dark:text-white">{item.name}</p>
                <p className="text-[10px] text-black dark:text-white opacity-60 font-semibold mt-0.5">Stock remaining: {item.stock} at {item.branch}</p>
              </div>

              <div className="mt-3">
                {item.resolved ? (
                  <div className="w-full text-center py-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg">
                    Restocked successfully
                  </div>
                ) : (
                  <button
                    disabled={item.loading}
                    onClick={() => handleRestock(item.id)}
                    className={`w-full py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all ${item.status === "Critical"
                      ? "bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/10"
                      : "bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/10"
                      }`}
                  >
                    {item.loading ? (
                      <RefreshCw size={11} className="animate-spin" />
                    ) : (
                      "Refill & Restock Now"
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Customer Retention highlight bento card */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-4 rounded-xl shadow-sm lg:col-span-2 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-xs font-black text-black dark:text-white">Customer Retention highlights</h4>
                <p className="text-[9px] text-black dark:text-white opacity-60 font-semibold mt-0.5">Real-time customer feedback sync</p>
              </div>
              <span className="text-[9px] font-bold text-[var(--primary)] px-1.5 py-0.2 bg-[var(--primary)]/10 rounded-full border border-[var(--primary)]/15">
                Active Index
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 p-3 bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-850 rounded-xl shadow-inner">
                <p className="text-[9px] text-black dark:text-white opacity-60 font-bold uppercase tracking-wider">Retention Rate</p>
                <p className="text-xl font-black text-black dark:text-white mt-0.5">64%</p>

                {/* Visual bar */}
                <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-[var(--primary)] w-2/3 rounded-full" />
                </div>
              </div>

              <div className="flex-1 p-3 bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-855 rounded-xl shadow-inner">
                <p className="text-[9px] text-black dark:text-white opacity-60 font-bold uppercase tracking-wider">Trending Product</p>
                <p className="text-xs font-bold text-black dark:text-white truncate mt-0.5">Paneer Tikka Pizza</p>
                <p className="text-[10px] text-[var(--primary)] font-bold mt-1 flex items-center gap-1">
                  <Sparkles size={10} />
                  Ordered 142 times today
                </p>
              </div>
            </div>
          </div>

        </section>

        {/* settlements wallet & Payout center */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Payout dashboard widget */}
          <div className="lg:col-span-2 relative overflow-hidden p-5 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">

            <div className="relative z-10">
              <p className="text-white/80 text-[10px] font-bold uppercase tracking-wider">Pending settlements wallet</p>
              <h2 className="text-2xl md:text-3xl font-black mt-1 tracking-tight">₹{payoutAmount}</h2>

              <div className="flex flex-wrap sm:flex-nowrap gap-2 mt-3">
                <div className="bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-md border border-white/10">
                  <p className="text-[8px] uppercase text-white/70 font-semibold">Next settlement Payout</p>
                  <p className="text-[10px] font-bold mt-0.5">Oct 26, 2023</p>
                </div>
                <div className="bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-md border border-white/10">
                  <p className="text-[8px] uppercase text-white/70 font-semibold">Taxes & GST (Accumulated)</p>
                  <p className="text-[10px] font-bold mt-0.5">₹2.2L</p>
                </div>
              </div>
            </div>

            {payoutAmount !== "0" ? (
              <button
                onClick={() => setShowPayoutModal(true)}
                className="relative z-10 w-full md:w-auto bg-white hover:bg-zinc-50 text-[var(--primary)] px-4 py-2.5 rounded-lg font-bold shadow-lg active:scale-95 transition-all text-xs text-center"
              >
                Initiate Bank Payout
              </button>
            ) : (
              <div className="relative z-10 w-full md:w-auto bg-white/10 border border-white/20 text-white/70 px-4 py-2.5 rounded-lg font-bold text-xs text-center">
                All Payouts Settled
              </div>
            )}

            {/* Background design elements */}
            <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -top-10 -left-10 w-36 h-36 bg-white/5 rounded-full blur-2xl" />
          </div>

          {/* Alerts & Logs center */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-4 rounded-xl shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-50 dark:border-zinc-800 mb-3">
              <h3 className="font-extrabold text-xs text-black dark:text-white flex items-center gap-1.5">
                <ShieldAlert size={14} className="text-rose-500" />
                Active Alerts Log Center
              </h3>
              <span className="text-[8px] font-bold text-rose-505 bg-rose-50 dark:bg-rose-950/20 px-1.5 py-0.2 rounded-full">
                {systemAlerts.length} Active
              </span>
            </div>

            <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1 scrollbar-thin">
              {systemAlerts.length > 0 ? (
                systemAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex gap-2 items-start p-2 bg-zinc-50/50 dark:bg-zinc-950/30 border border-zinc-100 dark:border-zinc-855 hover:bg-white dark:hover:bg-zinc-850 rounded-lg transition-all relative group"
                  >
                    <div className={`p-1 rounded flex-shrink-0 mt-0.5 ${alert.severity === "severe"
                      ? "bg-rose-50 dark:bg-rose-950/20 text-rose-500"
                      : alert.severity === "warning"
                        ? "bg-amber-50 dark:bg-amber-950/20 text-amber-500"
                        : "bg-blue-50 dark:bg-blue-950/20 text-blue-500"
                      }`}>
                      <Info size={11} />
                    </div>

                    <div className="flex-1 min-w-0 pr-6">
                      <p className="text-[9px] font-bold text-black dark:text-white leading-normal break-words">{alert.text}</p>
                      <span className="text-[8px] text-black dark:text-white opacity-50 font-semibold">{alert.time}</span>
                    </div>

                    <button
                      onClick={() => removeAlert(alert.id)}
                      className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 text-[8px] text-black dark:text-white opacity-60 hover:opacity-100 transition-opacity font-bold"
                      title="Clear Alert log"
                    >
                      Dismiss
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <CheckCircle size={20} className="mx-auto text-emerald-500 stroke-[1.5] mb-1" />
                  <p className="text-[10px] text-black dark:text-white opacity-60 font-bold">No active system warning alerts</p>
                </div>
              )}
            </div>
          </div>

        </section>

      </main>

      {/* Live Order details sliding drawer/modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 w-[calc(100%-2rem)] max-w-lg mx-4 rounded-2xl shadow-2xl p-6 relative animate-fade-down">

            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800 mb-5">
              <div>
                <p className="text-xs font-black text-[var(--primary)]">{selectedOrder.id}</p>
                <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-50 mt-0.5">Order Detail Summary</h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-xs bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 px-3 py-1.5 rounded-xl font-bold transition-all"
              >
                Close details
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-zinc-50/50 dark:bg-zinc-950/20 p-3 rounded-xl border border-zinc-100 dark:border-zinc-850">
                <img src={selectedOrder.avatar} alt={selectedOrder.name} className="w-12 h-12 rounded-xl object-cover" />
                <div>
                  <p className="text-xs font-bold text-zinc-800 dark:text-zinc-100">{selectedOrder.name}</p>
                  <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">Location distance: {selectedOrder.distance} • Rating: ★ {selectedOrder.rating}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Ordered items & Total</p>
                <div className="p-3 bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-850 rounded-xl">
                  <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{selectedOrder.items}</p>
                  <div className="flex justify-between items-center border-t border-zinc-150 dark:border-zinc-800 pt-2.5 mt-2.5">
                    <span className="text-xs font-bold text-zinc-400">Total Invoice (POS paid)</span>
                    <span className="text-sm font-black text-zinc-900 dark:text-zinc-50">{selectedOrder.total}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Courier / Dispatch status</p>
                <div className="p-3 bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-850 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck size={14} className="text-[var(--primary)]" />
                    <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{selectedOrder.rider}</span>
                  </div>
                  <span className="text-[10px] bg-[var(--primary)]/10 text-[var(--primary)] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {selectedOrder.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
              <button
                onClick={() => {
                  alert(`Order ${selectedOrder.id} has been force-routed to kitchen prep successfully.`)
                  setSelectedOrder(null)
                }}
                className="py-3 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-white text-xs font-bold rounded-xl active:scale-95 transition-all text-center"
              >
                Approve & Sync kitchen
              </button>
              <button
                onClick={() => {
                  alert(`Courier mapping for order ${selectedOrder.id} initiated.`)
                  setSelectedOrder(null)
                }}
                className="py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold rounded-xl active:scale-95 transition-all text-center"
              >
                Auto-assign Courier
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Payout Transfer simulation modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-850 w-[calc(100%-2rem)] max-w-md mx-4 rounded-2xl shadow-2xl p-6 relative animate-fade-down">

            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 mb-5">
              <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-50">Initiate settlement Bank transfer</h3>
              <button
                onClick={() => setShowPayoutModal(false)}
                className="text-[10px] font-bold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                Close
              </button>
            </div>

            {payoutStatus === "idle" && (
              <form onSubmit={handleInitiatePayout} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Settlement payout Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 font-bold text-zinc-400 text-sm">₹</span>
                    <input
                      type="text"
                      value={payoutAmount}
                      onChange={(e) => setPayoutAmount(e.target.value)}
                      className="w-full font-bold text-sm pl-7 pr-4 py-2 border border-zinc-100 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Receiving Corporate Bank</label>
                  <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    className="w-full text-xs p-2.5 border border-zinc-100 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100"
                  >
                    <option>HDFC Corporate Bank (**** 8940)</option>
                    <option>ICICI Commercial Bank (**** 1294)</option>
                    <option>SBI Main Vault Account (**** 4402)</option>
                  </select>
                </div>

                <div className="p-3 bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-850 rounded-xl text-[10px] text-zinc-450 leading-relaxed mt-2">
                  *Funds will clear in 2-4 hours depending on RBI settlement batch windows. Payouts require dual authentication keys.
                </div>

                <button
                  type="submit"
                  className="w-full py-3 mt-4 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold rounded-xl shadow-lg active:scale-95 transition-all text-center"
                >
                  Confirm & Transfer ₹{payoutAmount}
                </button>
              </form>
            )}

            {payoutStatus === "processing" && (
              <div className="text-center py-8 space-y-3.5">
                <RefreshCw size={36} className="mx-auto text-[var(--primary)] animate-spin" />
                <p className="text-xs text-zinc-500 font-bold">Initiating settlement security handshake...</p>
              </div>
            )}

            {payoutStatus === "success" && (
              <div className="text-center py-8 space-y-3.5">
                <CheckCircle size={36} className="mx-auto text-emerald-500" />
                <p className="text-xs text-emerald-600 dark:text-emerald-450 font-black">Payout Handshake Authorized!</p>
                <p className="text-[10px] text-zinc-400">₹12,45,000 has been routed to RBI clearing channel.</p>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Floating Action Buttons / Quick Triggers */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3.5 z-40">
        <button
          onClick={() => {
            alert("Create dynamic Coupon template dialog initiated.")
          }}
          className="w-12 h-12 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all group relative border border-zinc-850"
          title="Create New Coupon code"
        >
          <Sparkles size={16} />
          <span className="absolute right-14 bg-zinc-900 text-white text-[10px] font-bold py-1 px-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md pointer-events-none">
            Create Coupon
          </span>
        </button>

        <button
          onClick={() => {
            alert("Create dynamic Franchise application request dialog initiated.")
          }}
          className="w-12 h-12 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all group relative"
          title="Register Franchise channel"
        >
          <Store size={16} />
          <span className="absolute right-14 bg-zinc-900 text-white text-[10px] font-bold py-1 px-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md pointer-events-none">
            Add Franchise Store
          </span>
        </button>
      </div>

    </div>
  )
}
