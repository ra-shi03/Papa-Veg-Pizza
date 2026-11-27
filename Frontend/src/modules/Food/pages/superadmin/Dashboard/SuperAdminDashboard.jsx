import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
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
  const navigate = useNavigate()

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

  // Everything on this screen comes from the server (/admin/dashboard/*: the whole company for a super admin)
  const [dash, setDash] = useState({ summary: null, customers: null, revenue: [], live: [], stores: [], stock: [] })
  useEffect(() => {
    let alive = true
    const load = async () => {
      const results = await Promise.allSettled([
        adminAPI.getDashboardSummary({}), adminAPI.getDashboardCustomerActivity({}), adminAPI.getDashboardRevenue({}),
        adminAPI.getDashboardLiveOrders({}), adminAPI.getDashboardStorePerformance({ date: "month" }), adminAPI.getDashboardInventoryAlerts({}),
      ])
      if (!alive) return
      const [summary, customers, revenue, live, stores, stock] = results.map((r) => (r.status === "fulfilled" ? r.value?.data?.data : null))
      if (results.every((r) => r.status === "rejected")) toast.error("Could not load the dashboard")
      setDash({ summary, customers, revenue: revenue || [], live: live || [], stores: stores || [], stock: stock || [] })
    }
    load()
    const timer = setInterval(load, 60000)
    return () => { alive = false; clearInterval(timer) }
  }, [])

  const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`
  const fig = (v, show = (x) => x) => (v === undefined || v === null ? "—" : show(v))
  const card = (title, val, icon) => ({ title, val, growth: "", up: true, icon, sparkData: [], color: "text-[var(--primary)] bg-[var(--primary)]/10" })
  const kpis = [
    card("Revenue Today", fig(dash.summary?.revenue, money), DollarSign),
    card("Live Orders", dash.summary ? dash.live.length : "—", ShoppingBag),
    card("Riders On Orders", fig(dash.summary?.activeRiders), Truck),
    card("New Customers", fig(dash.customers?.newCustomers), Users),
    card("Active Stores", fig(dash.summary?.activeStores), Store),
    card("Comm. Today", fig(dash.summary?.commission, money), Percent),
  ]

  const currentChartData = dash.revenue.map((d) => ({ time: d.date, revenue: d.revenue }))

  // Live monitor order categories & lists
  const [orderFilter, setOrderFilter] = useState("New")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedOrder, setSelectedOrder] = useState(null)

  const TAB_OF = { confirmed: "New", preparing: "Prep", baking: "Prep", packed: "Ready", out_for_delivery: "Delivery" }
  const liveOrders = dash.live.map((o) => ({
    id: o.id, name: o.customer, time: o.time, status: TAB_OF[o.status] || "New", total: money(o.amount),
    items: (o.items || []).map((i) => `${i.quantity} x ${i.name}`).join(", "),
    rider: o.assignedStaff?.rider || "Not assigned", store: o.store,
  }))

  // Filter orders by category and query
  const filteredOrders = liveOrders.filter(order => {
    const matchesTab = order.status === orderFilter
    const q = searchQuery.toLowerCase()
    const matchesQuery = [order.id, order.name, order.items].some((v) => String(v || "").toLowerCase().includes(q))
    return matchesTab && matchesQuery
  })

  // Best selling stores of the last 30 days
  const franchises = dash.stores.slice(0, 5).map((s, i) => ({
    rank: i + 1, name: s.name, rating: s.rating || "-", type: `${s.orders} orders`, rev: money(s.revenue), growth: `${s.completion}% delivered`,
    color: i === 0 ? "bg-amber-500" : "bg-zinc-500",
  }))

  // Alerts: the stores' open low-stock alerts (dismissing only hides one on this screen)
  const [dismissed, setDismissed] = useState([])
  const systemAlerts = dash.stock
    .filter((a) => !dismissed.includes(a.id))
    .map((a) => ({ id: a.id, text: `Low stock: ${a.ingredient} at ${a.store} (${a.currentStock} ${a.unit})`, time: a.severity, severity: a.severity === "critical" ? "severe" : "warning" }))
  const removeAlert = (id) => setDismissed((prev) => [...prev, id])


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
      />

      {/* Main Container Area */}
      <main className={`pt-16 pb-12 px-3 md:px-4 transition-all duration-300 lg:ml-[280px]`}>

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
              {dash.summary ? `${dash.summary.activeStores} active stores across the company.` : "Loading the company figures..."}
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
              <span className="text-[9px] font-bold text-black dark:text-white opacity-60">Total Live: {liveOrders.length}</span>
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
                    <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center text-[10px] font-black shrink-0">{String(order.name || "?")[0]}</div>
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
                  Revenue Trend
                </h3>
                <p className="text-[10px] text-black dark:text-white opacity-60 font-semibold mt-0.5">Sales of the last 7 days</p>
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
                    name="Revenue"
                    stroke={primaryColor}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="flex justify-between items-center border-t border-zinc-50 dark:border-zinc-800 pt-2.5 mt-2.5 text-[9px] text-black dark:text-white opacity-60 font-semibold">
              <span>Refreshes every minute</span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-ping" />
                Active Sales Channel
              </span>
            </div>

          </div>

        </section>

        {/* Top franchises */}
        <section className="grid grid-cols-1 gap-4 mb-4">

          {/* Top Franchises ranking leaderboard */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-4 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-xs text-black dark:text-white flex items-center gap-1.5">
                <Trophy size={14} className="text-amber-500" />
                Top Stores (30 days)
              </h3>
              <span className="text-[9px] font-bold text-emerald-605 bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.2 rounded-full">
                By revenue
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

        </section>

        {/* Alerts */}
        <section className="grid grid-cols-1 gap-4">

          {/* Alerts & Logs center */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-4 rounded-xl shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-50 dark:border-zinc-800 mb-3">
              <h3 className="font-extrabold text-xs text-black dark:text-white flex items-center gap-1.5">
                <ShieldAlert size={14} className="text-rose-500" />
                Low Stock Alerts
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
                  <p className="text-[10px] text-black dark:text-white opacity-60 font-bold">No low-stock alerts</p>
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
                <div>
                  <p className="text-xs font-bold text-zinc-800 dark:text-zinc-100">{selectedOrder.name}</p>
                  <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">{selectedOrder.store}</p>
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

          </div>
        </div>
      )}

      {/* Floating Action Buttons / Quick Triggers */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3.5 z-40">
        <button
          onClick={() => {
            navigate("/food/superadmin/coupons")
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
            navigate("/food/superadmin/franchise-approvals")
          }}
          className="w-12 h-12 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all group relative"
          title="Franchise approvals"
        >
          <Store size={16} />
          <span className="absolute right-14 bg-zinc-900 text-white text-[10px] font-bold py-1 px-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md pointer-events-none">
            Franchise Approvals
          </span>
        </button>
      </div>

    </div>
  )
}
