import React, { useState, useEffect, useCallback } from "react"
import {
  TrendingUp,
  ShoppingBag,
  Clock,
  Star,
  X,
  Search,
  Building2,
  Download,
  RefreshCw,
  MoreVertical,
  SlidersHorizontal,
  Trash2,
  Eye,
  Settings,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  User,
  Calendar,
  DollarSign,
  Activity,
  FileText,
  Layers,
  AlertCircle,
  AlertTriangle,
  Sliders
} from "lucide-react"
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, Cell, LineChart, Line, Legend } from "recharts"
import { adminAPI } from "@food/api"

// Import Custom Hooks & Overlays
import { useMockQuery } from "./components/useMockQuery"
import StorePerformanceDrawer from "./components/StorePerformanceDrawer"
import CompareStoresModal from "./components/CompareStoresModal"
import ExportReportModal from "./components/ExportReportModal"
import RevenueReportModal from "./components/RevenueReportModal"
import OrdersAnalyticsModal from "./components/OrdersAnalyticsModal"

export default function StorePerformance() {
  // Filters and Debounced Search
  const [searchVal, setSearchVal] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [storeFilter, setStoreFilter] = useState("All")
  const [statusFilter, setStatusFilter] = useState("All")
  const [typeFilter, setTypeFilter] = useState("All")
  const [cityFilter, setCityFilter] = useState("All")
  const [gradeFilter, setGradeFilter] = useState("All")
  const [dateRange, setDateRange] = useState("last7") // today, last7, last30, custom
  const [customStart, setCustomStart] = useState("")
  const [customEnd, setCustomEnd] = useState("")

  // Table State
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [sortKey, setSortKey] = useState("performanceScore")
  const [sortOrder, setSortOrder] = useState("desc") // asc, desc

  // Modals & Drawer state
  const [selectedStore, setSelectedStore] = useState(null)
  const [activeMenuId, setActiveMenuId] = useState(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [drawerDefaultTab, setDrawerDefaultTab] = useState("revenue")
  const [isCompareOpen, setIsCompareOpen] = useState(false)
  const [isExportOpen, setIsExportOpen] = useState(false)
  const [isRevenueModalOpen, setIsRevenueModalOpen] = useState(false)
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false)

  // Interactive Chart Toggles
  const [revenueInterval, setRevenueInterval] = useState("daily") // daily, weekly, monthly

  // Toast Notification State
  const [toast, setToast] = useState(null)

  const showToast = (message, type = "success") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // 1. Debounce Search (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchVal)
      setPage(1)
    }, 300)
    return () => clearTimeout(handler)
  }, [searchVal])

  // 2. Fetch KPI Summary (auto-polls every 12 seconds for live production updates)
  const {
    data: kpis,
    isLoading: loadingKpis,
    refetch: refetchKPIs
  } = useMockQuery("perf_kpis", () => adminAPI.getStorePerformanceDashboard(), {
    refetchInterval: 12000
  })

  // 3. Fetch Trend Charts
  const { data: revenueData, isLoading: loadingRevenue } = useMockQuery(
    "perf_revenue_trends", 
    () => adminAPI.getStorePerformanceRevenue()
  )
  const { data: ordersData, isLoading: loadingOrders } = useMockQuery(
    "perf_orders_trends", 
    () => adminAPI.getStorePerformanceOrders()
  )
  const { data: ratingsData, isLoading: loadingRatings } = useMockQuery(
    "perf_ratings_trends", 
    () => adminAPI.getStorePerformanceRatings()
  )
  const { data: comparisonData, isLoading: loadingComparison } = useMockQuery(
    "perf_comparison", 
    () => adminAPI.getStorePerformanceComparison()
  )
  const { data: busyHoursData, isLoading: loadingBusyHours } = useMockQuery(
    "perf_busy_hours", 
    () => adminAPI.getStorePerformanceBusyHours()
  )

  // 4. Fetch Paginated Stores List (dependent on filter states)
  const fetchStoresList = useCallback(() => {
    const params = {
      page,
      limit,
      search: debouncedSearch,
      storeId: storeFilter !== "All" ? storeFilter : undefined,
      status: statusFilter !== "All" ? statusFilter : undefined,
      type: typeFilter !== "All" ? typeFilter : undefined,
      city: cityFilter !== "All" ? cityFilter : undefined,
      sort: sortKey,
      order: sortOrder
    }
    return adminAPI.getStorePerformanceList(params)
  }, [page, limit, debouncedSearch, storeFilter, statusFilter, typeFilter, cityFilter, sortKey, sortOrder])

  const {
    data: storesList,
    isLoading: loadingStores,
    isError: hasStoresError,
    refetch: refetchStores
  } = useMockQuery(
    ["perf_list", page, limit, debouncedSearch, storeFilter, statusFilter, typeFilter, cityFilter, sortKey, sortOrder],
    fetchStoresList,
    { refetchInterval: 15000 } // Re-poll list every 15 seconds
  )

  const stores = storesList?.list || []
  const totalCount = storesList?.totalCount || 0

  // 5. Simulated Real-Time Updates (fluctuates some KPI values in the table dynamically)
  const [liveStores, setLiveStores] = useState([])
  useEffect(() => {
    if (stores.length > 0) {
      setLiveStores(stores)
    }
  }, [storesList])

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveStores(prev => 
        prev.map(s => {
          if (s.status === "Active") {
            const orderDelta = Math.random() > 0.7 ? 1 : 0
            const revenueDelta = orderDelta * (Math.floor(Math.random() * 50) + 180)
            const wasteChange = Math.random() > 0.85 ? parseFloat((Math.random() * 0.4 - 0.2).toFixed(1)) : 0
            const scoreChange = Math.random() > 0.9 ? (Math.random() > 0.5 ? 1 : -1) : 0

            return {
              ...s,
              totalOrders: (s.totalOrders || 0) + orderDelta,
              revenue: (s.revenue || 0) + revenueDelta,
              inventoryWaste: Math.max(0.5, Math.min(10, parseFloat(((s.inventoryWaste || 2) + wasteChange).toFixed(1)))),
              performanceScore: Math.max(10, Math.min(100, (s.performanceScore || 80) + scoreChange)),
              updatedAt: new Date().toISOString()
            }
          }
          return s
        })
      )
    }, 6000)

    return () => clearInterval(interval)
  }, [storesList])

  // Filter dynamic list based on performance grade filters
  const filteredLiveStores = liveStores.filter(store => {
    if (gradeFilter === "All") return true
    if (gradeFilter === "Excellent") return store.performanceScore >= 90
    if (gradeFilter === "Good") return store.performanceScore >= 75 && store.performanceScore < 90
    if (gradeFilter === "Average") return store.performanceScore >= 50 && store.performanceScore < 75
    if (gradeFilter === "Poor") return store.performanceScore < 50
    return true
  })

  // Global Refresher
  const handleGlobalRefresh = () => {
    refetchKPIs()
    refetchStores()
    showToast("Analytics data refreshed successfully.")
  }

  // Handle Sort
  const handleSort = (key) => {
    const isAsc = sortKey === key && sortOrder === "asc"
    setSortKey(key)
    setSortOrder(isAsc ? "desc" : "asc")
  }

  // Reset Filters
  const handleResetFilters = () => {
    setSearchVal("")
    setStoreFilter("All")
    setStatusFilter("All")
    setTypeFilter("All")
    setCityFilter("All")
    setGradeFilter("All")
    setDateRange("last7")
    setPage(1)
  }

  // PDF Generator Simulation
  const handleDownloadPDF = () => {
    showToast("Compiling performance PDF... Your download will begin shortly.")
    setTimeout(() => {
      const dummyPdfContent = "Papa Veg Pizza - Store Performance Report\nCompiled on: " + new Date().toLocaleString()
      const blob = new Blob([dummyPdfContent], { type: "application/pdf" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.setAttribute("href", url)
      a.setAttribute("download", `Store_Performance_Report_${Date.now()}.pdf`)
      a.click()
      showToast("PDF report downloaded successfully.")
    }, 1500)
  }

  // Currency Formatter
  const formatINR = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val)
  }

  // Performance Score Badge styling
  const getPerformanceBadge = (score) => {
    if (score >= 90) return { label: "Excellent", styles: "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-650" }
    if (score >= 75) return { label: "Good", styles: "bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400" }
    if (score >= 50) return { label: "Average", styles: "bg-amber-50 dark:bg-amber-950/20 text-amber-650" }
    return { label: "Poor", styles: "bg-red-50 dark:bg-red-950/20 text-red-650 font-bold" }
  }

  // Unique City list extracted from stores
  const cities = ["Indore", "Bhopal", "Ujjain", "Gwalior", "Jabalpur", "Dewas", "Pithampur", "Ratlam", "Sagar", "Rewa"]

  return (
    <div className="px-4 pb-4 pt-4 max-w-7xl mx-auto space-y-4 text-slate-900 dark:text-slate-100">
      
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">Store Performance</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Track revenue, operations, ratings and efficiency of all stores.</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          
          {/* Date Selector */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-semibold focus:outline-none"
          >
            <option value="today">Today</option>
            <option value="last7">Last 7 Days</option>
            <option value="last30">Last 30 Days</option>
            <option value="custom">Custom Range</option>
          </select>
          {dateRange === "custom" && (
            <div className="flex items-center gap-1">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-[10px] bg-white dark:bg-slate-950"
              />
              <span className="text-slate-400 text-xs">-</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-[10px] bg-white dark:bg-slate-950"
              />
            </div>
          )}

          <button
            onClick={() => setIsCompareOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
            Compare Stores
          </button>
          <button
            onClick={() => setIsExportOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            Export Report
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-1 px-2.5 py-1.5 text-white bg-primary hover:bg-primary/95 rounded-lg text-xs font-bold shadow-md shadow-primary/10 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Download PDF
          </button>
          <button
            onClick={handleGlobalRefresh}
            className="p-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
            title="Refresh Analytics"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      {/* KPI CARDS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Revenue Today", val: kpis ? formatINR(kpis.revenueToday) : null, sub: "All franchise channels", icon: DollarSign, color: "text-primary bg-primary/5" },
          { label: "Orders Today", val: kpis?.ordersToday?.toLocaleString("en-IN"), sub: "Fulfillment target 1.5k", icon: ShoppingBag, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20" },
          { label: "Avg Prep Time", val: kpis ? `${kpis.avgPreparationTime} min` : null, sub: "Kitchen speed", icon: Clock, color: "text-blue-650 bg-blue-50 dark:bg-blue-950/20" },
          { label: "Avg Delivery Time", val: kpis ? `${kpis.avgDeliveryTime} min` : null, sub: "Rider dispatch speed", icon: Activity, color: "text-purple-650 bg-purple-50 dark:bg-purple-950/20" },
          { label: "Customer Rating", val: kpis ? `${kpis.customerRating}★` : null, sub: "From 12k reviews", icon: Star, color: "text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20" },
          { label: "Cancellation Rate", val: kpis ? `${kpis.cancellationRate}%` : null, sub: "Fulfillment health", icon: AlertTriangle, color: "text-rose-650 bg-rose-50 dark:bg-rose-950/20" },
          { label: "Inventory Waste", val: kpis ? `${kpis.inventoryWaste}%` : null, sub: "Target limit < 5%", icon: Layers, color: "text-amber-600 bg-amber-50 dark:bg-amber-950/20" },
          { label: "Best Performing", val: kpis?.bestStore?.replace("Papa Veg Pizza - ", ""), sub: "98% Efficiency rating", icon: Building2, color: "text-indigo-650 bg-indigo-50 dark:bg-indigo-950/20" }
        ].map((card, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-xl p-3 shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[85px]">
            {loadingKpis ? (
              <div className="space-y-1.5 animate-pulse">
                <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-5 w-20 bg-slate-300 dark:bg-slate-700 rounded" />
              </div>
            ) : (
              <>
                <div>
                  <span className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">
                    {card.label}
                  </span>
                  <span className="text-base font-black text-slate-800 dark:text-white truncate block">
                    {card.val ?? "N/A"}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-50 dark:border-slate-850 text-[9px] font-semibold text-slate-400">
                  <span className="truncate max-w-[120px]">{card.sub}</span>
                  <div className={`p-1 rounded-md shrink-0 ${card.color}`}>
                    <card.icon className="w-3.5 h-3.5" />
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* ANALYTICS CHARTS SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* 1. Revenue Trend Line Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-855 rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider">Revenue Trend (₹)</h4>
            <div className="flex gap-1">
              {["daily", "weekly", "monthly"].map(int => (
                <button
                  key={int}
                  onClick={() => setRevenueInterval(int)}
                  className={`px-2 py-1 rounded text-[9px] font-bold uppercase transition-colors ${
                    revenueInterval === int
                      ? "bg-primary text-white"
                      : "bg-slate-55 dark:bg-slate-950 text-slate-400 hover:text-slate-700"
                  }`}
                >
                  {int}
                </button>
              ))}
            </div>
          </div>
          <div className="h-44">
            {loadingRevenue ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs animate-pulse">Loading revenue trends...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData?.[revenueInterval] || []} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <XAxis dataKey="time" stroke="#64748b" fontSize={8} />
                  <YAxis stroke="#64748b" fontSize={8} />
                  <Tooltip formatter={(value) => formatINR(value)} contentStyle={{ fontSize: 9 }} />
                  <Line type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={1.5} dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* 2. Orders Trend Bar Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-855 rounded-xl p-4 shadow-xs space-y-3">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider">Orders Fulfillment Trends</h4>
          <div className="h-44">
            {loadingOrders ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs animate-pulse">Loading orders trends...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ordersData} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                  <XAxis dataKey="time" stroke="#64748b" fontSize={8} />
                  <YAxis stroke="#64748b" fontSize={8} />
                  <Tooltip contentStyle={{ fontSize: 9 }} />
                  <Legend wrapperStyle={{ fontSize: 9 }} />
                  <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="cancelled" name="Cancelled" fill="#ef4444" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* 3. Ratings Trend Area Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-855 rounded-xl p-4 shadow-xs space-y-3">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider">Customer Satisfaction (Avg Rating)</h4>
          <div className="h-44">
            {loadingRatings ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs animate-pulse">Loading ratings trends...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ratingsData} margin={{ top: 5, right: 5, left: -35, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRatings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--secondary)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="var(--secondary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" stroke="#64748b" fontSize={8} />
                  <YAxis stroke="#64748b" fontSize={8} domain={[4, 5]} />
                  <Tooltip contentStyle={{ fontSize: 9 }} />
                  <Area type="monotone" dataKey="rating" stroke="var(--secondary)" strokeWidth={1.5} fillOpacity={1} fill="url(#colorRatings)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* 4. Store Comparison Grouped Bar Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-855 rounded-xl p-4 shadow-xs space-y-3 lg:col-span-2">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider">Top Outlets Revenue Comparisons</h4>
          <div className="h-44">
            {loadingComparison ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs animate-pulse">Loading store comparisons...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={8} />
                  <YAxis stroke="#64748b" fontSize={8} />
                  <Tooltip formatter={(value) => formatINR(value)} contentStyle={{ fontSize: 9 }} />
                  <Bar dataKey="revenue" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* 5. Busy Hours Heatmap Grid */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-855 rounded-xl p-4 shadow-xs space-y-3">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider">Orders Dispatch Density (Busy Hours)</h4>
          {loadingBusyHours ? (
            <div className="h-44 flex items-center justify-center text-slate-400 text-xs animate-pulse">Loading peak density...</div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-6 gap-1.5">
                {busyHoursData && busyHoursData.map((hour, idx) => {
                  let densityBg = "bg-primary/5 dark:bg-slate-950 text-slate-400"
                  if (hour.density >= 90) densityBg = "bg-primary text-white font-extrabold shadow-md shadow-primary/10"
                  else if (hour.density >= 70) densityBg = "bg-primary/75 text-white font-semibold"
                  else if (hour.density >= 50) densityBg = "bg-primary/45 text-slate-850 dark:text-slate-100"
                  else if (hour.density >= 30) densityBg = "bg-primary/20 text-slate-700 dark:text-slate-300"
                  
                  return (
                    <div
                      key={idx}
                      className={`p-1.5 rounded-lg text-center text-[9px] flex flex-col justify-between transition-all cursor-default ${densityBg}`}
                      title={`Fulfillment density: ${hour.density}%`}
                    >
                      <span className="block">{hour.hour}</span>
                      <span className="block font-bold text-[8px] mt-0.5">{hour.density}%</span>
                    </div>
                  )
                })}
              </div>
              <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider border-t border-slate-50 dark:border-slate-850 pt-2 select-none">
                <span>Low Dispatch</span>
                <div className="flex gap-1 items-center">
                  <div className="w-2.5 h-2.5 rounded bg-primary/5 border border-slate-200" />
                  <div className="w-2.5 h-2.5 rounded bg-primary/20" />
                  <div className="w-2.5 h-2.5 rounded bg-primary/45" />
                  <div className="w-2.5 h-2.5 rounded bg-primary/75" />
                  <div className="w-2.5 h-2.5 rounded bg-primary" />
                </div>
                <span>Peak Load</span>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* FILTER SECTION (Sticky & Compact) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-855 rounded-xl p-3 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Search Store Bar */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search store..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>

          {/* Store select Dropdown */}
          <div className="w-[115px]">
            <select
              value={storeFilter}
              onChange={(e) => { setStoreFilter(e.target.value); setPage(1); }}
              className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-semibold focus:outline-none"
            >
              <option value="All">Store: All</option>
              {liveStores.map(s => (
                <option key={s._id} value={s.storeId}>{s.storeName.replace("Papa Veg Pizza - ", "")}</option>
              ))}
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="w-[115px]">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-semibold focus:outline-none"
            >
              <option value="All">Status: All</option>
              <option value="Active">Active</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          {/* Store Type Dropdown */}
          <div className="w-[120px]">
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-semibold focus:outline-none"
            >
              <option value="All">Type: All</option>
              <option value="Regular">Regular</option>
              <option value="Express">Express</option>
              <option value="Cloud Kitchen">Cloud Kitchen</option>
            </select>
          </div>

          {/* City Dropdown */}
          <div className="w-[115px]">
            <select
              value={cityFilter}
              onChange={(e) => { setCityFilter(e.target.value); setPage(1); }}
              className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-semibold focus:outline-none"
            >
              <option value="All">City: All</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          {/* Grade Dropdown */}
          <div className="w-[125px]">
            <select
              value={gradeFilter}
              onChange={(e) => { setGradeFilter(e.target.value); setPage(1); }}
              className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-semibold focus:outline-none"
            >
              <option value="All">Grade: All</option>
              <option value="Excellent">Excellent</option>
              <option value="Good">Good</option>
              <option value="Average">Average</option>
              <option value="Poor">Poor</option>
            </select>
          </div>

          {/* Reset Filters */}
          <button
            onClick={handleResetFilters}
            className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Reset
          </button>

        </div>
      </div>

      {/* PERFORMANCE TABLE SECTION */}
      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-855 rounded-xl overflow-hidden shadow-xs">
        
        {loadingStores ? (
          <div className="p-4 space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex gap-4 items-center">
                <div className="h-4 w-12 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                <div className="h-4 w-1/4 bg-slate-300 dark:bg-slate-700 rounded animate-pulse" />
                <div className="h-4 w-1/6 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                <div className="h-4 w-20 bg-slate-300 dark:bg-slate-700 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : hasStoresError ? (
          <div className="py-16 text-center space-y-4">
            <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-650 rounded-full w-14 h-14 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">Failed to load performance metrics</h3>
              <p className="text-xs text-slate-400 mt-1">There was a server communication issue. Please retry.</p>
            </div>
            <button
              onClick={refetchStores}
              className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl"
            >
              Retry Connection
            </button>
          </div>
        ) : filteredLiveStores.length === 0 ? (
          <div className="py-16 text-center space-y-4">
            <div className="w-24 h-24 mx-auto bg-slate-50 dark:bg-slate-950 rounded-full flex items-center justify-center border text-primary opacity-60">
              <Building2 className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-250">No store analytics available</h3>
              <p className="text-xs text-slate-400 mt-1">There are no operational logs matching the filters.</p>
            </div>
            <button
              onClick={handleGlobalRefresh}
              className="px-4 py-2 border border-slate-200 dark:border-slate-850 hover:bg-slate-50 rounded-xl text-xs font-semibold"
            >
              Refresh Dashboard
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-55 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-850 text-[9px] font-bold text-slate-450 uppercase tracking-wider">
                  <th className="px-2.5 py-2 cursor-pointer select-none" onClick={() => handleSort("storeName")}>
                    <div className="flex items-center gap-1">
                      Store Name
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="px-2.5 py-2 cursor-pointer select-none" onClick={() => handleSort("revenue")}>
                    <div className="flex items-center gap-1">
                      Revenue
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="px-2.5 py-2 cursor-pointer select-none" onClick={() => handleSort("totalOrders")}>
                    <div className="flex items-center gap-1">
                      Orders Today
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="px-2.5 py-2 cursor-pointer select-none" onClick={() => handleSort("avgPreparationTime")}>
                    <div className="flex items-center gap-1">
                      Prep Time
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="px-2.5 py-2 cursor-pointer select-none" onClick={() => handleSort("avgDeliveryTime")}>
                    <div className="flex items-center gap-1">
                      Delivery Time
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="px-2.5 py-2 cursor-pointer select-none" onClick={() => handleSort("customerRating")}>
                    <div className="flex items-center gap-1">
                      Rating
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="px-2.5 py-2">Cancellation %</th>
                  <th className="px-2.5 py-2 cursor-pointer select-none" onClick={() => handleSort("inventoryWaste")}>
                    <div className="flex items-center gap-1">
                      Waste %
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="px-2.5 py-2 cursor-pointer select-none" onClick={() => handleSort("performanceScore")}>
                    <div className="flex items-center gap-1">
                      Score Card
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="px-2.5 py-2">Last Active</th>
                  <th className="px-2.5 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-[11px] text-slate-700 dark:text-slate-350">
                {filteredLiveStores.map(store => {
                  const scoreCard = getPerformanceBadge(store.performanceScore)
                  const cancelRate = store.totalOrders > 0 
                    ? parseFloat(((store.cancelledOrders / store.totalOrders) * 100).toFixed(1))
                    : 0
                  
                  return (
                    <tr key={store._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 group">
                      <td className="px-2.5 py-2 font-bold text-primary truncate max-w-[200px]">
                        {store.storeName.replace("Papa Veg Pizza - ", "")}
                      </td>
                      <td className="px-2.5 py-2 font-bold text-slate-900 dark:text-white">
                        {formatINR(store.revenue)}
                      </td>
                      <td className="px-2.5 py-2 font-semibold text-slate-800 dark:text-slate-200">
                        {store.totalOrders.toLocaleString("en-IN")}
                      </td>
                      <td className="px-2.5 py-2 text-slate-655 dark:text-slate-400">
                        {store.avgPreparationTime} min
                      </td>
                      <td className="px-2.5 py-2 text-slate-655 dark:text-slate-400">
                        {store.avgDeliveryTime} min
                      </td>
                      <td className="px-2.5 py-2">
                        <div className="flex items-center gap-0.5 font-bold text-slate-900 dark:text-white">
                          <Star className="w-3 h-3 fill-yellow-450 text-yellow-450" />
                          <span>{store.customerRating}</span>
                        </div>
                      </td>
                      <td className="px-2.5 py-2 text-slate-500 font-semibold">
                        {cancelRate}%
                      </td>
                      <td className="px-2.5 py-2 text-slate-500">
                        {store.inventoryWaste}%
                      </td>
                      <td className="px-2.5 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${scoreCard.styles}`}>
                          {store.performanceScore} - {scoreCard.label}
                        </span>
                      </td>
                      <td className="px-2.5 py-2 text-slate-400 text-[10px]">
                        Just now
                      </td>
                      <td className="px-4 py-3.5 text-right relative">
                        <button
                          onClick={() => setActiveMenuId(activeMenuId === store._id ? null : store._id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-655 hover:bg-slate-55 dark:hover:bg-slate-900 transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Actions floating Menu */}
                        {activeMenuId === store._id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setActiveMenuId(null)} />
                            <div className="absolute right-4 mt-1 w-44 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl shadow-xl z-20 overflow-hidden divide-y divide-slate-100 dark:divide-slate-850 text-left">
                              <div className="py-1">
                                <button
                                  onClick={() => { setSelectedStore(store); setDrawerDefaultTab("revenue"); setIsDrawerOpen(true); setActiveMenuId(null); }}
                                  className="w-full px-4 py-1.5 text-xs text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850 flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5 text-slate-450" />
                                  View Performance
                                </button>
                                <button
                                  onClick={() => { setSelectedStore(store); setIsRevenueModalOpen(true); setActiveMenuId(null); }}
                                  className="w-full px-4 py-1.5 text-xs text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850 flex items-center gap-1.5 cursor-pointer"
                                >
                                  <DollarSign className="w-3.5 h-3.5 text-slate-450" />
                                  View Revenue Report
                                </button>
                                <button
                                  onClick={() => { setSelectedStore(store); setIsOrdersModalOpen(true); setActiveMenuId(null); }}
                                  className="w-full px-4 py-1.5 text-xs text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850 flex items-center gap-1.5 cursor-pointer"
                                >
                                  <ShoppingBag className="w-3.5 h-3.5 text-slate-450" />
                                  View Orders Analytics
                                </button>
                              </div>
                              <div className="py-1">
                                <button
                                  onClick={() => { setSelectedStoreIds([store._id]); setIsCompareOpen(true); setActiveMenuId(null); }}
                                  className="w-full px-4 py-1.5 text-xs text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850 flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Sliders className="w-3.5 h-3.5 text-slate-450" />
                                  Compare Store
                                </button>
                                <button
                                  onClick={() => { setIsExportOpen(true); setActiveMenuId(null); }}
                                  className="w-full px-4 py-1.5 text-xs text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-855 flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Download className="w-3.5 h-3.5 text-slate-450" />
                                  Export Analytics
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION FOOTER */}
        {!loadingStores && filteredLiveStores.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20 text-xs text-slate-500 font-semibold select-none">
            <div className="flex items-center gap-4">
              <span>Showing {Math.min(totalCount, (page - 1) * limit + 1)} to {Math.min(totalCount, page * limit)} of {totalCount} records</span>
              
              <div className="flex items-center gap-1.5">
                <span>Rows:</span>
                <select
                  value={limit}
                  onChange={(e) => { setLimit(parseInt(e.target.value)); setPage(1); }}
                  className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:outline-none"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4.5 h-4.5" />
              </button>
              <span className="px-2">Page {page} of {Math.ceil(totalCount / limit) || 1}</span>
              <button
                onClick={() => setPage((prev) => Math.min(prev + 1, Math.ceil(totalCount / limit)))}
                disabled={page >= Math.ceil(totalCount / limit)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-855 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* VIEW PERFORMANCE DETAIL DRAWER */}
      <StorePerformanceDrawer
        isOpen={isDrawerOpen}
        onClose={() => { setIsDrawerOpen(false); setSelectedStore(null); }}
        store={selectedStore}
        defaultTab={drawerDefaultTab}
      />

      {/* COMPARE STORES MODAL */}
      <CompareStoresModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        stores={liveStores}
      />

      {/* EXPORT REPORT MODAL */}
      <ExportReportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        stores={liveStores}
        onExportSuccess={(msg) => showToast(msg, "success")}
      />

      {/* REVENUE REPORT MODAL */}
      <RevenueReportModal
        isOpen={isRevenueModalOpen}
        onClose={() => { setIsRevenueModalOpen(false); setSelectedStore(null); }}
        store={selectedStore}
      />

      {/* ORDERS ANALYTICS MODAL */}
      <OrdersAnalyticsModal
        isOpen={isOrdersModalOpen}
        onClose={() => { setIsOrdersModalOpen(false); setSelectedStore(null); }}
        store={selectedStore}
      />

      {/* Toast Notification Banner */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl border shadow-xl flex items-center gap-2 animate-bounce ${
          toast.type === "error"
            ? "bg-red-50 dark:bg-red-950/30 text-red-655 dark:text-red-400 border-red-200"
            : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-455 border-emerald-250"
        }`}>
          {toast.type === "error" ? (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          ) : (
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          )}
          <span className="text-xs font-bold">{toast.message}</span>
        </div>
      )}

    </div>
  )
}
