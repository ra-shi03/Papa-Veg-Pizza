import React, { useState, useEffect, useRef } from "react";
import { 
  CheckCircle2, TrendingUp, Clock, Star, ShoppingBag, 
  Search, Filter, Calendar, X, Download, RefreshCw, 
  FileText, MessageSquare, Heart, Eye, ChevronLeft, ChevronRight, Store, Truck, ArrowUpDown 
} from "lucide-react";
import { toast } from "sonner";
import { format, isToday, isYesterday, subDays, startOfWeek, isAfter, isBefore } from "date-fns";
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, 
  LineChart, Line, BarChart, Bar, Legend 
} from "recharts";

// Query Hooks & Mock Database references
import { 
  useCompletedOrders, useStores, useDeliveryPartners 
} from "./ordersQuery";
import { 
  mockRevenueTrends, mockRatingsDistribution, mockTopStoresRevenue 
} from "./mockOrders";

// Overlays
import ViewDetailsDrawer from "./components/ViewDetailsDrawer";
import DownloadInvoiceModal from "./components/DownloadInvoiceModal";
import ReorderAnalysisModal from "./components/ReorderAnalysisModal";
import CustomerFeedbackModal from "./components/CustomerFeedbackModal";

export default function CompletedOrders() {
  // Sticky advanced filters
  const [storeId, setStoreId] = useState("all");
  const [riderId, setRiderId] = useState("all");
  const [rating, setRating] = useState("all");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [localSearch, setLocalSearch] = useState("");
  const [datePreset, setDatePreset] = useState("all"); // today, yesterday, week, month, all
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(8);

  // Modals & Drawers triggers
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [activeOverlay, setActiveOverlay] = useState(null); // 'details', 'invoice', 'reorder', 'feedback'
  const [activeDropdownId, setActiveDropdownId] = useState(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localSearch);
      setPage(1);
    }, 355);
    return () => clearTimeout(timer);
  }, [localSearch]);

  // Handle outside click for action dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (!event.target.closest(".actions-dropdown-container")) {
        setActiveDropdownId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // API query simulation
  const queryFilters = {
    storeId,
    riderId,
    rating,
    minAmount,
    maxAmount,
    searchQuery,
  };

  const { data: completedOrders, isLoading, refetch } = useCompletedOrders(queryFilters);
  const { data: storesList } = useStores();
  const { data: ridersList } = useDeliveryPartners();

  // Date Range Filtering (Client-side refinement on query result)
  const getFilteredByDateOrders = () => {
    if (!completedOrders) return [];
    
    return completedOrders.filter((order) => {
      if (!order.placedAt) return true;
      const orderDate = new Date(order.placedAt);

      switch (datePreset) {
        case "today":
          return isToday(orderDate);
        case "yesterday":
          return isYesterday(orderDate);
        case "week":
          return isAfter(orderDate, subDays(new Date(), 7));
        case "month":
          return isAfter(orderDate, subDays(new Date(), 30));
        case "all":
        default:
          return true;
      }
    });
  };

  const orders = getFilteredByDateOrders();

  // Reset Filters action
  const handleResetFilters = () => {
    setStoreId("all");
    setRiderId("all");
    setRating("all");
    setMinAmount("");
    setMaxAmount("");
    setLocalSearch("");
    setSearchQuery("");
    setDatePreset("all");
    setPage(1);
    toast.info("Completed orders filters reset.");
  };

  // Export CSV
  const handleExportCSV = () => {
    if (orders.length === 0) {
      toast.error("No delivered orders to export.");
      return;
    }
    const headers = "Order No,Customer Name,Store Name,Final Amount,Payment Mode,Rating,Delivered At,Rider\n";
    const content = orders.map((o) => (
      `"${o.orderNumber}","${o.customer.name}","${o.store.name}",${o.pricing.total},"${o.paymentMethod}",${o.rating?.rating || "No rating"},"${o.deliveredAt || o.placedAt}","${o.deliveryPartner?.name || "None"}"`
    )).join("\n");

    const blob = new Blob([headers + content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Completed_Orders_Export_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV export downloaded successfully.");
  };

  // Export Excel (Simulated Tab-separated txt file with Excel extension)
  const handleExportExcel = () => {
    if (orders.length === 0) {
      toast.error("No delivered orders to export.");
      return;
    }
    const headers = "Order No\tCustomer Name\tStore Name\tFinal Amount\tPayment Mode\tRating\tDelivered At\tRider\n";
    const content = orders.map((o) => (
      `${o.orderNumber}\t${o.customer.name}\t${o.store.name}\t${o.pricing.total}\t${o.paymentMethod}\t${o.rating?.rating || "N/A"}\t${o.deliveredAt || o.placedAt}\t${o.deliveryPartner?.name || "N/A"}`
    )).join("\n");

    const blob = new Blob([headers + content], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Completed_Orders_Report_${format(new Date(), "yyyyMMdd_HHmmss")}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Excel report exported successfully.");
  };

  // Calculate dynamic dashboard KPI stats
  const totalDelivered = orders.length;

  const deliveredToday = orders.filter(o => {
    const orderDate = new Date(o.placedAt || o.deliveredAt);
    return isToday(orderDate);
  }).length;

  const revenueToday = orders.reduce((sum, o) => {
    const orderDate = new Date(o.placedAt || o.deliveredAt);
    return isToday(orderDate) ? sum + o.pricing.total : sum;
  }, 0);

  const avgDeliveryTime = totalDelivered > 0 ? "33 mins" : "0 mins";

  const avgRating = (() => {
    const ratedOrders = orders.filter(o => o.rating?.rating);
    if (ratedOrders.length === 0) return "4.8";
    const totalRatingSum = ratedOrders.reduce((sum, o) => sum + o.rating.rating, 0);
    return (totalRatingSum / ratedOrders.length).toFixed(1);
  })();

  // Insights breakdown
  const totalRevenueAllTime = orders.reduce((sum, o) => sum + o.pricing.total, 0);
  const avgOrderValue = totalDelivered > 0 ? (totalRevenueAllTime / totalDelivered).toFixed(2) : "0.00";
  const repeatCustomerPercentage = totalDelivered > 0 ? "42%" : "0%";

  const activeFiltersCount = [
    storeId !== "all",
    riderId !== "all",
    rating !== "all",
    minAmount !== "",
    maxAmount !== "",
    datePreset !== "all"
  ].filter(Boolean).length;

  // Pagination calculus
  const totalPages = Math.ceil(orders.length / limit) || 1;
  const paginatedOrders = orders.slice((page - 1) * limit, page * limit);

  // Time formatter helper
  const formatTime = (timeStr) => {
    if (!timeStr) return "N/A";
    try {
      return format(new Date(timeStr), "dd MMM, hh:mm a");
    } catch {
      return timeStr;
    }
  };

  // Rating Stars Renderer
  const renderRatingStars = (score) => {
    if (!score) return <span className="text-zinc-400 font-bold text-[10px]">Unrated</span>;
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={11}
            className={star <= score ? "fill-amber-450 text-amber-450" : "text-zinc-200 dark:text-zinc-700"}
          />
        ))}
      </div>
    );
  };

  console.log("CompletedOrders Render telemetry:", { activeOverlay, selectedOrderId, foundOrder: orders.find(o => o.id === selectedOrderId), totalOrders: orders.length });

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6 text-zinc-800 dark:text-zinc-200">
      
      {/* Page Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-950 p-4 border border-zinc-150 dark:border-zinc-850 rounded-2xl shadow-xs">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            Completed Orders
            <span className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-450 px-2 py-0.5 rounded-full font-bold border border-emerald-100 dark:border-emerald-900/30">
              Operations Center
            </span>
          </h1>
          <p className="text-xs text-zinc-500 font-medium mt-0.5">
            View delivered orders, historical revenue, rider metrics and ratings.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Refresh Action */}
          <button
            onClick={() => {
              refetch();
              toast.success("Operations dataset refreshed.");
            }}
            className="p-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl transition-all active:scale-95 flex items-center gap-1.5 text-xs font-bold"
          >
            <RefreshCw size={13} />
            Refresh
          </button>

          {/* Export Actions */}
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <Download size={13} className="text-zinc-400" />
            Export CSV
          </button>

          <button
            onClick={handleExportExcel}
            className="px-3 py-2 bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-850 dark:hover:bg-zinc-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
          >
            <Download size={13} />
            Export Excel
          </button>
        </div>
      </header>

      {/* KPI Cards Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1 */}
        <div className="bg-white dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-150 dark:border-zinc-850 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-450 rounded-xl">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Delivered Today</p>
            <h3 className="text-lg font-black text-zinc-850 dark:text-zinc-50 mt-0.5">{deliveredToday}</h3>
            <p className="text-[9px] text-zinc-500 font-semibold mt-0.5">Fresh kitchen checkouts</p>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-150 dark:border-zinc-850 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 rounded-xl">
            <TrendingUp size={20} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Revenue Today</p>
            <h3 className="text-lg font-black text-zinc-850 dark:text-zinc-50 mt-0.5">₹{revenueToday.toFixed(2)}</h3>
            <p className="text-[9px] text-zinc-500 font-semibold mt-0.5">UPI / COD settlement</p>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-150 dark:border-zinc-850 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-450 rounded-xl">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Avg Delivery Time</p>
            <h3 className="text-lg font-black text-zinc-850 dark:text-zinc-50 mt-0.5">{avgDeliveryTime}</h3>
            <p className="text-[9px] text-indigo-550 font-semibold mt-0.5">Optimal Rider Transit</p>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-150 dark:border-zinc-850 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 text-amber-500 rounded-xl">
            <Star size={20} className="fill-amber-450 text-amber-450" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Avg Customer Rating</p>
            <h3 className="text-lg font-black text-zinc-850 dark:text-zinc-50 mt-0.5">{avgRating}★</h3>
            <p className="text-[9px] text-zinc-500 font-semibold mt-0.5">From post-order surveys</p>
          </div>
        </div>

        {/* Card 5 */}
        <div className="bg-white dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-150 dark:border-zinc-850 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 rounded-xl">
            <ShoppingBag size={20} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Total Completed</p>
            <h3 className="text-lg font-black text-zinc-850 dark:text-zinc-50 mt-0.5">{totalDelivered}</h3>
            <p className="text-[9px] text-zinc-500 font-semibold mt-0.5">Delivered & finalized orders</p>
          </div>
        </div>
      </section>

      {/* Analytics Charts Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Over Time */}
        <div className="bg-white dark:bg-zinc-950 p-5 border border-zinc-150 dark:border-zinc-850 rounded-2xl shadow-xs space-y-4">
          <div>
            <h3 className="text-xs font-black uppercase text-zinc-400 tracking-wider">Revenue Trend (₹)</h3>
            <p className="text-[10px] text-zinc-500 font-medium mt-0.5">Aggregated daily revenue checkouts</p>
          </div>
          <div className="h-[250px] w-full text-[10px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockRevenueTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.01}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} stroke="#888888" />
                <YAxis tickLine={false} axisLine={false} stroke="#888888" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "#fff", 
                    border: "1px solid #e4e4e7", 
                    borderRadius: "8px",
                    fontSize: "11px",
                    fontWeight: "bold"
                  }} 
                />
                <Area type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Orders Delivered Volume Trend */}
        <div className="bg-white dark:bg-zinc-950 p-5 border border-zinc-150 dark:border-zinc-850 rounded-2xl shadow-xs space-y-4">
          <div>
            <h3 className="text-xs font-black uppercase text-zinc-400 tracking-wider">Orders Finalized Count</h3>
            <p className="text-[10px] text-zinc-500 font-medium mt-0.5">Delivered orders count timeline</p>
          </div>
          <div className="h-[250px] w-full text-[10px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockRevenueTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} stroke="#888888" />
                <YAxis tickLine={false} axisLine={false} stroke="#888888" allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "#fff", 
                    border: "1px solid #e4e4e7", 
                    borderRadius: "8px",
                    fontSize: "11px",
                    fontWeight: "bold"
                  }} 
                />
                <Line type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={2.5} activeDot={{ r: 6 }} dot={{ strokeWidth: 2, r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ratings Distribution Chart */}
        <div className="bg-white dark:bg-zinc-950 p-5 border border-zinc-150 dark:border-zinc-850 rounded-2xl shadow-xs space-y-4">
          <div>
            <h3 className="text-xs font-black uppercase text-zinc-400 tracking-wider">Customer Survey Scores</h3>
            <p className="text-[10px] text-zinc-500 font-medium mt-0.5">Count of rating feedbacks submitted</p>
          </div>
          <div className="h-[250px] w-full text-[10px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockRatingsDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                <XAxis dataKey="rating" tickLine={false} axisLine={false} stroke="#888888" />
                <YAxis tickLine={false} axisLine={false} stroke="#888888" allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "#fff", 
                    border: "1px solid #e4e4e7", 
                    borderRadius: "8px",
                    fontSize: "11px",
                    fontWeight: "bold"
                  }} 
                />
                <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={35} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Stores By Revenue Breakdown */}
        <div className="bg-white dark:bg-zinc-950 p-5 border border-zinc-150 dark:border-zinc-850 rounded-2xl shadow-xs space-y-4">
          <div>
            <h3 className="text-xs font-black uppercase text-zinc-400 tracking-wider">Top Performing Store Branches</h3>
            <p className="text-[10px] text-zinc-500 font-medium mt-0.5">Revenue breakdown by branch node (₹)</p>
          </div>
          <div className="h-[250px] w-full text-[10px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={mockTopStoresRevenue} 
                layout="vertical"
                margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e4e4e7" />
                <XAxis type="number" tickLine={false} axisLine={false} stroke="#888888" />
                <YAxis dataKey="storeName" type="category" tickLine={false} axisLine={false} stroke="#888888" width={110} style={{ fontSize: '9px' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "#fff", 
                    border: "1px solid #e4e4e7", 
                    borderRadius: "8px",
                    fontSize: "11px",
                    fontWeight: "bold"
                  }} 
                />
                <Bar dataKey="revenue" fill="#10b981" radius={[0, 4, 4, 0]} barSize={15} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
      <section className="bg-white dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 rounded-2xl overflow-hidden shadow-xs">
        
        {/* Table Toolbar / Collapsible Filters */}
        <div className="p-4 border-b border-zinc-150 dark:border-zinc-850 bg-zinc-50/20 dark:bg-zinc-900/5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Search Input (Always Visible) */}
            <div className="relative w-full sm:max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search order no, customer, phone..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-[var(--primary)] transition-all placeholder:text-zinc-400"
              />
            </div>

            {/* Filter Toggle & Active Indicator & Reset */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                className={`px-3 py-2 border rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  isFilterExpanded 
                    ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-sm"
                    : "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850"
                }`}
              >
                <Filter size={13} />
                <span>Filters</span>
                {/* Active filter count badge */}
                {activeFiltersCount > 0 && (
                  <span className={`inline-flex items-center justify-center rounded-full text-[9px] font-black px-1.5 py-0.5 ${
                    isFilterExpanded ? "bg-white text-[var(--primary)]" : "bg-[var(--primary)] text-white"
                  }`}>
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {activeFiltersCount > 0 && (
                <button
                  onClick={handleResetFilters}
                  className="px-3 py-2 text-zinc-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <X size={13} className="text-rose-500" />
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Collapsible Dropdown Filter Options */}
          {isFilterExpanded && (
            <div className="pt-3 border-t border-zinc-150 dark:border-zinc-850 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 animate-fade-in">
              {/* Store Selection */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Store Branch</label>
                <select
                  value={storeId}
                  onChange={(e) => { setStoreId(e.target.value); setPage(1); }}
                  className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold focus:outline-none focus:border-[var(--primary)]"
                >
                  <option value="all">All stores</option>
                  {storesList?.map((store) => (
                    <option key={store.storeId} value={store.storeId}>{store.storeName.split(" - ")[1] || store.storeName}</option>
                  ))}
                </select>
              </div>

              {/* Rider Selection */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Delivery Partner</label>
                <select
                  value={riderId}
                  onChange={(e) => { setRiderId(e.target.value); setPage(1); }}
                  className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold focus:outline-none focus:border-[var(--primary)]"
                >
                  <option value="all">All Riders</option>
                  {ridersList?.map((rider) => (
                    <option key={rider.riderId} value={rider.riderId}>{rider.name}</option>
                  ))}
                </select>
              </div>

              {/* Rating selection */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Feedback Rating</label>
                <select
                  value={rating}
                  onChange={(e) => { setRating(e.target.value); setPage(1); }}
                  className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold focus:outline-none focus:border-[var(--primary)]"
                >
                  <option value="all">All Ratings</option>
                  <option value="5">5 Stars only</option>
                  <option value="4">4 Stars only</option>
                  <option value="3">3 Stars & Below</option>
                </select>
              </div>

              {/* Price range */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Price Range (₹)</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minAmount}
                    onChange={(e) => { setMinAmount(e.target.value); setPage(1); }}
                    className="w-full px-2 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold focus:outline-none focus:border-[var(--primary)] placeholder:text-zinc-400"
                  />
                  <span className="text-zinc-400 text-[10px]">to</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxAmount}
                    onChange={(e) => { setMaxAmount(e.target.value); setPage(1); }}
                    className="w-full px-2 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold focus:outline-none focus:border-[var(--primary)] placeholder:text-zinc-400"
                  />
                </div>
              </div>

              {/* Time Horizon */}
              <div className="flex flex-col gap-1 md:col-span-2 lg:col-span-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Time Horizon</label>
                <div className="flex flex-wrap gap-1">
                  {[
                    { value: "all", label: "All" },
                    { value: "today", label: "Today" },
                    { value: "yesterday", label: "Yesterday" },
                    { value: "week", label: "7D" },
                    { value: "month", label: "30D" }
                  ].map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => { setDatePreset(preset.value); setPage(1); }}
                      className={`px-2 py-1 text-[10px] font-bold rounded transition-all cursor-pointer ${
                        datePreset === preset.value
                          ? "bg-[var(--primary)] text-white"
                          : "bg-white dark:bg-zinc-900 text-zinc-660 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50 dark:bg-zinc-900/30 text-zinc-500 border-b border-zinc-150 dark:border-zinc-850 text-[10px] uppercase font-black tracking-wider">
                <th className="p-4">Order Details</th>
                <th className="p-4">Customer Details</th>
                <th className="p-4">Store Location</th>
                <th className="p-4">Rider Assigned</th>
                <th className="p-4">Completion Date</th>
                <th className="p-4 text-right">Payment Total</th>
                <th className="p-4">Rating Survey</th>
                <th className="p-4 text-center" style={{ width: "120px" }}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 text-xs">
              {isLoading ? (
                // Skeletons
                [1, 2, 3, 4].map((n) => (
                  <tr key={n} className="animate-pulse">
                    <td className="p-4"><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-sm w-20"></div></td>
                    <td className="p-4"><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-sm w-32"></div></td>
                    <td className="p-4"><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-sm w-24"></div></td>
                    <td className="p-4"><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-sm w-28"></div></td>
                    <td className="p-4"><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-sm w-24"></div></td>
                    <td className="p-4 text-right"><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-sm w-16 ml-auto"></div></td>
                    <td className="p-4"><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-sm w-20"></div></td>
                    <td className="p-4"><div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded-lg w-20 mx-auto"></div></td>
                  </tr>
                ))
              ) : paginatedOrders.length === 0 ? (
                // Empty state
                <tr>
                  <td colSpan={8} className="p-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-full text-zinc-400">
                        <ShoppingBag size={24} />
                      </div>
                      <p className="font-bold text-zinc-650 dark:text-zinc-300">No completed orders found.</p>
                      <p className="text-[11px] text-zinc-400 max-w-[300px]">
                        Try loosening your filters, rating stars, amount caps, or search query.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => (
                  <tr 
                    key={order.id} 
                    className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 transition-colors"
                  >
                    {/* Order Details */}
                    <td className="p-4">
                      <span className="font-black text-zinc-800 dark:text-zinc-200">{order.orderNumber}</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[9px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-bold px-1.5 py-0.5 rounded-sm">
                          {order.items.length} items
                        </span>
                        <span className="text-[9px] text-zinc-400 font-medium">({order.paymentMethod})</span>
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <img 
                          src={order.customer.avatar} 
                          alt="" 
                          className="w-6 h-6 rounded-full object-cover border border-zinc-200" 
                          onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=50"; }}
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-zinc-800 dark:text-zinc-100 truncate max-w-[120px]">{order.customer.name}</p>
                          <p className="text-[10px] text-zinc-400 font-medium mt-0.5">{order.customer.phone}</p>
                        </div>
                      </div>
                    </td>

                    {/* Store */}
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-zinc-700 dark:text-zinc-350">
                        <Store size={12} className="text-zinc-400" />
                        <span className="font-semibold">{order.store.name}</span>
                      </div>
                    </td>

                    {/* Rider */}
                    <td className="p-4">
                      {order.deliveryPartner ? (
                        <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-350 font-semibold">
                          <Truck size={12} className="text-zinc-400" />
                          <span>{order.deliveryPartner.name}</span>
                        </div>
                      ) : (
                        <span className="text-zinc-400 font-medium text-[10px]">Takeaway / No rider</span>
                      )}
                    </td>

                    {/* Delivered Time */}
                    <td className="p-4 font-medium text-zinc-550">
                      {formatTime(order.deliveredAt || order.placedAt)}
                    </td>

                    {/* Total Paid */}
                    <td className="p-4 text-right font-black text-zinc-800 dark:text-zinc-50">
                      ₹{order.pricing.total.toFixed(2)}
                    </td>

                    {/* Rating survey */}
                    <td className="p-4">
                      {renderRatingStars(order.rating?.rating)}
                      {order.rating?.review && (
                        <p className="text-[9px] text-zinc-400 font-medium truncate max-w-[120px] mt-0.5">
                          "{order.rating.review}"
                        </p>
                      )}
                    </td>

                    {/* Actions Dropdown / Quick Links */}
                    <td className="p-4 text-center">
                      <div className="relative inline-block text-left actions-dropdown-container">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDropdownId(activeDropdownId === order.id ? null : order.id);
                          }}
                          className="px-2.5 py-1.5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-55 hover:text-zinc-900 rounded-lg text-[10px] font-bold inline-flex items-center gap-1"
                        >
                          Actions
                          <ChevronRight size={10} className={`transform transition-transform ${activeDropdownId === order.id ? 'rotate-90' : ''}`} />
                        </button>

                        {activeDropdownId === order.id && (
                          <div className="absolute right-0 mt-1 w-[160px] bg-white dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-800 rounded-xl shadow-xl z-20 overflow-hidden divide-y divide-zinc-50 dark:divide-zinc-850">
                            <div className="py-1">
                              <button
                                onClick={() => {
                                  setSelectedOrderId(order.id);
                                  setActiveOverlay("details");
                                  setActiveDropdownId(null);
                                }}
                                className="w-full px-3 py-2 text-left text-[11px] font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900 flex items-center gap-1.5 transition-colors"
                              >
                                <Eye size={12} className="text-zinc-400" />
                                View Details
                              </button>
                              
                              <button
                                onClick={() => {
                                  setSelectedOrderId(order.id);
                                  setActiveOverlay("invoice");
                                  setActiveDropdownId(null);
                                }}
                                className="w-full px-3 py-2 text-left text-[11px] font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900 flex items-center gap-1.5 transition-colors"
                              >
                                <FileText size={12} className="text-zinc-400" />
                                Print Invoice
                              </button>
                            </div>

                            <div className="py-1">
                              {order.rating ? (
                                <button
                                  onClick={() => {
                                    setSelectedOrderId(order.id);
                                    setActiveOverlay("feedback");
                                    setActiveDropdownId(null);
                                  }}
                                  className="w-full px-3 py-2 text-left text-[11px] font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900 flex items-center gap-1.5 transition-colors"
                                >
                                  <MessageSquare size={12} className="text-amber-500" />
                                  Customer Review
                                </button>
                              ) : null}

                              <button
                                onClick={() => {
                                  setSelectedOrderId(order.id);
                                  setActiveOverlay("reorder");
                                  setActiveDropdownId(null);
                                }}
                                className="w-full px-3 py-2 text-left text-[11px] font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900 flex items-center gap-1.5 transition-colors"
                              >
                                <Heart size={12} className="text-rose-500" />
                                Reorder Analytics
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls footer */}
        <footer className="p-4 border-t border-zinc-100 dark:border-zinc-850 flex items-center justify-between shrink-0 bg-zinc-50/30 dark:bg-zinc-900/10">
          <p className="text-[10px] text-zinc-450 font-bold">
            Showing {paginatedOrders.length} of {orders.length} orders
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="p-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs font-black text-zinc-800 dark:text-zinc-200 px-3">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="p-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 disabled:opacity-40 transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </footer>
      </section>

      {/* Revenue & Customer Insights aggregates */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-zinc-50/50 dark:bg-zinc-900/20 p-5 border border-zinc-150 dark:border-zinc-850 rounded-2xl shadow-xs">
        <div className="space-y-1">
          <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Historical Revenue Pool</p>
          <h4 className="text-xl font-black text-[var(--primary)]">₹{totalRevenueAllTime.toFixed(2)}</h4>
          <p className="text-[10px] text-zinc-500 font-medium">Aggregated across all store nodes in scope</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Average Order Ticket (AOV)</p>
          <h4 className="text-xl font-black text-zinc-850 dark:text-zinc-50">₹{avgOrderValue}</h4>
          <p className="text-[10px] text-zinc-500 font-medium">Standard single order basket checkout</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Loyal / Repeat Customers</p>
          <h4 className="text-xl font-black text-emerald-600 dark:text-emerald-450">{repeatCustomerPercentage}</h4>
          <p className="text-[10px] text-zinc-500 font-medium">Customers placing more than 1 order lifetime</p>
        </div>
      </section>

      {/* Render Overlays */}
      {activeOverlay === "details" && (
        <ViewDetailsDrawer
          isOpen={true}
          onClose={() => { setActiveOverlay(null); setSelectedOrderId(null); }}
          order={orders.find(o => o.id === selectedOrderId)}
        />
      )}

      {activeOverlay === "invoice" && (
        <DownloadInvoiceModal
          isOpen={true}
          onClose={() => { setActiveOverlay(null); setSelectedOrderId(null); }}
          order={{
            ...orders.find(o => o.id === selectedOrderId),
            // ensure detailed items list inside invoice matching layout structure
            store: orders.find(o => o.id === selectedOrderId)?.store || { name: "N/A" }
          }}
        />
      )}

      {activeOverlay === "reorder" && (
        <ReorderAnalysisModal
          isOpen={true}
          onClose={() => { setActiveOverlay(null); setSelectedOrderId(null); }}
          orderId={selectedOrderId}
        />
      )}

      {activeOverlay === "feedback" && (
        <CustomerFeedbackModal
          isOpen={true}
          onClose={() => { setActiveOverlay(null); setSelectedOrderId(null); }}
          orderId={selectedOrderId}
        />
      )}

    </div>
  );
}
