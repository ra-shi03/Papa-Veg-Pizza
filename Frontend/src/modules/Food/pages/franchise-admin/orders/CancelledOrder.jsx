import React, { useState, useEffect } from "react";
import { 
  CircleX, UserX, Store, Wallet, Percent, Search, Filter, 
  Calendar, X, Download, RefreshCw, ChevronLeft, ChevronRight, 
  Eye, HelpCircle, ShieldAlert, ArrowUpDown, AlertTriangle, Info,
  TrendingUp, BarChart3, PieChart as PieIcon
} from "lucide-react";
import { toast } from "sonner";
import { format, isToday, isYesterday, subDays, isAfter } from "date-fns";
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, 
  PieChart, Pie, Cell, BarChart, Bar, Legend 
} from "recharts";

// Query Hooks & Mock References
import { 
  useCancelledOrders, 
  useStores, 
  useCancellationAnalytics,
  useRefundData 
} from "./ordersQuery";

// Connected Modals & Drawers
import CancellationDetailsDrawer from "./components/CancellationDetailsDrawer";
import InitiateRefundModal from "./components/InitiateRefundModal";
import ReopenInvestigationModal from "./components/ReopenInvestigationModal";
import CancellationAnalysisModal from "./components/CancellationAnalysisModal";

export default function CancelledOrder() {
  // Sticky advanced filters state
  const [cancellationType, setCancellationType] = useState("all");
  const [storeId, setStoreId] = useState("all");
  const [refundStatus, setRefundStatus] = useState("all");
  const [datePreset, setDatePreset] = useState("all"); // today, yesterday, week, month, all
  const [localSearch, setLocalSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10); // 10 / 20 / 50 rows

  // Sort State
  const [sortField, setSortField] = useState("placedAt");
  const [sortDirection, setSortDirection] = useState("desc"); // asc / desc

  // Modals & Drawers triggers
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [activeOverlay, setActiveOverlay] = useState(null); // 'details', 'refund', 'reopen'
  const [activeDropdownId, setActiveDropdownId] = useState(null);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);

  // Debounce search query (355ms)
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
    cancellationType,
    storeId,
    refundStatus,
    searchQuery,
  };

  const { data: cancelledOrders = [], isLoading, refetch } = useCancelledOrders(queryFilters);
  const { data: storesList = [] } = useStores();
  const { data: analyticsData, isLoading: isAnalyticsLoading } = useCancellationAnalytics();
  const { data: refundSummary } = useRefundData();

  // Date Range Filtering (Client-side refinement on query result)
  const getFilteredByDateOrders = () => {
    if (!cancelledOrders) return [];
    
    return cancelledOrders.filter((order) => {
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

  const filteredOrders = getFilteredByDateOrders();

  // Client-side sorting
  const getSortedOrders = () => {
    const sorted = [...filteredOrders];
    sorted.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      // Handle nested values
      if (sortField === "orderNumber") {
        return sortDirection === "asc" 
          ? a.orderNumber.localeCompare(b.orderNumber)
          : b.orderNumber.localeCompare(a.orderNumber);
      }
      if (sortField === "customer") {
        return sortDirection === "asc"
          ? a.customer.name.localeCompare(b.customer.name)
          : b.customer.name.localeCompare(a.customer.name);
      }
      if (sortField === "amount") {
        return sortDirection === "asc"
          ? a.pricing.total - b.pricing.total
          : b.pricing.total - a.pricing.total;
      }
      if (sortField === "reason") {
        const reasonA = a.cancellation?.reason || "";
        const reasonB = b.cancellation?.reason || "";
        return sortDirection === "asc"
          ? reasonA.localeCompare(reasonB)
          : reasonB.localeCompare(reasonA);
      }

      // Default date sorting
      const dateA = new Date(valA || a.placedAt);
      const dateB = new Date(valB || b.placedAt);
      return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
    });
    return sorted;
  };

  const sortedOrders = getSortedOrders();

  // Pagination calculus
  const totalPages = Math.ceil(sortedOrders.length / limit) || 1;
  const paginatedOrders = sortedOrders.slice((page - 1) * limit, page * limit);

  // Sorting handler
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
    setPage(1);
  };

  // Reset Filters action
  const handleResetFilters = () => {
    setCancellationType("all");
    setStoreId("all");
    setRefundStatus("all");
    setLocalSearch("");
    setSearchQuery("");
    setDatePreset("all");
    setPage(1);
    toast.info("Cancellations filters reset.");
  };

  // Export CSV
  const handleExportCSV = () => {
    if (sortedOrders.length === 0) {
      toast.error("No cancelled orders to export.");
      return;
    }
    const headers = "Order No,Customer Name,Customer Phone,Store,Amount,Cancellation Reason,Refund Status,Cancelled Date\n";
    const content = sortedOrders.map((o) => (
      `"${o.orderNumber}","${o.customer.name}","${o.customer.phone}","${o.store.name}",${o.pricing.total},"${o.cancellation?.reason || "System Failure"}","${o.cancellation?.refundStatus || "N/A"}","${o.cancellation?.createdAt || o.placedAt}"`
    )).join("\n");

    const blob = new Blob([headers + content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Cancelled_Orders_Export_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV export downloaded successfully.");
  };

  // Export Excel
  const handleExportExcel = () => {
    if (sortedOrders.length === 0) {
      toast.error("No cancelled orders to export.");
      return;
    }
    const headers = "Order No\tCustomer Name\tCustomer Phone\tStore\tAmount\tCancellation Reason\tRefund Status\tCancelled Date\n";
    const content = sortedOrders.map((o) => (
      `${o.orderNumber}\t${o.customer.name}\t${o.customer.phone}\t${o.store.name}\t${o.pricing.total}\t${o.cancellation?.reason || "System Failure"}\t${o.cancellation?.refundStatus || "N/A"}\t${o.cancellation?.createdAt || o.placedAt}`
    )).join("\n");

    const blob = new Blob([headers + content], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Cancelled_Orders_Report_${format(new Date(), "yyyyMMdd_HHmmss")}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Excel report exported successfully.");
  };

  // Time formatter helper
  const formatTime = (timeStr) => {
    if (!timeStr) return "N/A";
    try {
      return format(new Date(timeStr), "dd MMM, hh:mm a");
    } catch {
      return timeStr;
    }
  };

  const getReasonBadgeColor = (reason) => {
    switch (reason) {
      case "Customer Request": return "bg-orange-50 text-orange-700 dark:bg-orange-950/20 dark:text-orange-400 border-orange-200/50";
      case "Out Of Stock": return "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-405 border-rose-200/50";
      case "Kitchen Issue": return "bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400 border-purple-200/50";
      case "Payment Failure": return "bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border-blue-200/50";
      case "System Failure": return "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-350 border-zinc-200";
      default: return "bg-zinc-50 text-zinc-550 border-zinc-200";
    }
  };

  const getRefundBadgeColor = (status) => {
    switch (status) {
      case "Completed": return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-250";
      case "Initiated": return "bg-amber-50 text-amber-705 dark:bg-amber-950/20 dark:text-amber-450 border-amber-200/50";
      case "Pending": return "bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-450 border-blue-200/50";
      case "Rejected": return "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border-rose-200/50";
      default: return "bg-zinc-50 text-zinc-450 border-zinc-200";
    }
  };

  // Active filters count
  const activeFiltersCount = [
    cancellationType !== "all",
    storeId !== "all",
    refundStatus !== "all",
    datePreset !== "all"
  ].filter(Boolean).length;

  const selectedOrder = cancelledOrders.find(o => o.id === selectedOrderId);

  // Banner checks
  const kpis = analyticsData?.kpis || {};
  const pendingRefundsThreshold = 2; // threshold for alerts
  const cancellationRateThreshold = 4.0; // threshold for %

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6 text-zinc-800 dark:text-zinc-200">
      
      {/* Page Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-950 p-4 border border-zinc-150 dark:border-zinc-850 rounded-2xl shadow-xs">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            Cancelled Orders
            <span className="text-[10px] bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-450 px-2 py-0.5 rounded-full font-bold border border-rose-100 dark:border-rose-900/30">
              Ops Control
            </span>
          </h1>
          <p className="text-xs text-zinc-500 font-medium mt-0.5">
            Manage failed orders, cancellation reasons, and refund eligibility.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Analysis Trigger Action */}
          <button
            onClick={() => setIsAnalysisOpen(true)}
            className="p-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-55 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-350 rounded-xl transition-all active:scale-95 flex items-center gap-1.5 text-xs font-bold cursor-pointer"
          >
            <BarChart3 size={13} className="text-[var(--primary)]" />
            Cancellation Analysis
          </button>

          {/* Refresh Action */}
          <button
            onClick={() => {
              refetch();
              toast.success("Dataset refreshed.");
            }}
            className="p-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-350 rounded-xl transition-all active:scale-95 flex items-center gap-1.5 text-xs font-bold"
          >
            <RefreshCw size={13} />
            Refresh
          </button>

          {/* Export Actions */}
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-350 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Download size={13} className="text-zinc-400" />
            Export CSV
          </button>

          <button
            onClick={handleExportExcel}
            className="px-3 py-2 bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-850 dark:hover:bg-zinc-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Download size={13} />
            Export Excel
          </button>
        </div>
      </header>

      {/* Notification Banners */}
      {kpis.refundPending > pendingRefundsThreshold && (
        <div className="p-3 bg-blue-50 text-blue-750 dark:bg-blue-955/10 dark:text-blue-400 border border-blue-150 dark:border-blue-900/30 rounded-xl flex items-start gap-2.5 animate-bounce-short">
          <AlertTriangle size={15} className="shrink-0 mt-0.5 text-blue-600 dark:text-blue-450" />
          <div className="text-[11px] leading-relaxed">
            <span className="font-bold">Attention required:</span> There are currently <span className="font-extrabold">{kpis.refundPending} pending refunds</span> awaiting admin authorization. Prompt settlements avoid dispute resolution escalations.
          </div>
        </div>
      )}

      {parseFloat(kpis.cancellationPercentage) > cancellationRateThreshold && (
        <div className="p-3 bg-rose-50 text-rose-750 dark:bg-rose-955/10 dark:text-rose-400 border border-rose-150 dark:border-rose-900/30 rounded-xl flex items-start gap-2.5">
          <AlertTriangle size={15} className="shrink-0 mt-0.5 text-rose-600 dark:text-rose-450" />
          <div className="text-[11px] leading-relaxed">
            <span className="font-bold">High Cancellation Alert:</span> The current overall cancellation index is <span className="font-extrabold">{kpis.cancellationPercentage}</span>, which exceeds the target threshold of 4.0%. Check the store-wise distribution to identify problematic kitchen operations.
          </div>
        </div>
      )}

      {/* 5 KPI Cards Section */}
      <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5">
        
        {/* Card 1: Cancelled Today */}
        <div className="bg-white dark:bg-zinc-950 p-3.5 rounded-2xl border border-zinc-150 dark:border-zinc-850 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 rounded-xl">
            <CircleX size={18} />
          </div>
          <div>
            <p className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Cancelled Today</p>
            <h3 className="text-base font-black text-zinc-850 dark:text-zinc-50 mt-0.5">
              {isAnalyticsLoading ? "..." : kpis.cancelledToday || 0}
            </h3>
            <p className="text-[8px] text-zinc-500 font-semibold mt-0.5">Failed store checks</p>
          </div>
        </div>

        {/* Card 2: Customer Cancellations */}
        <div className="bg-white dark:bg-zinc-950 p-3.5 rounded-2xl border border-zinc-150 dark:border-zinc-850 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-orange-50 text-orange-600 dark:bg-orange-950/20 dark:text-orange-400 rounded-xl">
            <UserX size={18} />
          </div>
          <div>
            <p className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Customer Cancels</p>
            <h3 className="text-base font-black text-zinc-850 dark:text-zinc-50 mt-0.5">
              {isAnalyticsLoading ? "..." : kpis.customerCancellations || 0}
            </h3>
            <p className="text-[8px] text-zinc-500 font-semibold mt-0.5">Initiated by client app</p>
          </div>
        </div>

        {/* Card 3: Store Cancellations */}
        <div className="bg-white dark:bg-zinc-950 p-3.5 rounded-2xl border border-zinc-150 dark:border-zinc-850 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-450 rounded-xl">
            <Store size={18} />
          </div>
          <div>
            <p className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Store Cancellations</p>
            <h3 className="text-base font-black text-zinc-850 dark:text-zinc-50 mt-0.5">
              {isAnalyticsLoading ? "..." : kpis.storeCancellations || 0}
            </h3>
            <p className="text-[8px] text-zinc-500 font-semibold mt-0.5">Kitchen/Stock issues</p>
          </div>
        </div>

        {/* Card 4: Refund Pending */}
        <div className="bg-white dark:bg-zinc-950 p-3.5 rounded-2xl border border-zinc-150 dark:border-zinc-850 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-450 rounded-xl">
            <Wallet size={18} />
          </div>
          <div>
            <p className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Refund Pending</p>
            <h3 className="text-base font-black text-zinc-850 dark:text-zinc-50 mt-0.5">
              {isAnalyticsLoading ? "..." : kpis.refundPending || 0}
            </h3>
            <p className="text-[8px] text-zinc-500 font-semibold mt-0.5">Awaiting manual release</p>
          </div>
        </div>

        {/* Card 5: Cancellation % */}
        <div className="bg-white dark:bg-zinc-950 p-3.5 rounded-2xl border border-zinc-150 dark:border-zinc-850 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-purple-50 text-purple-650 dark:bg-purple-950/20 dark:text-purple-400 rounded-xl">
            <Percent size={18} />
          </div>
          <div>
            <p className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Cancellation %</p>
            <h3 className="text-base font-black text-zinc-850 dark:text-zinc-50 mt-0.5">
              {isAnalyticsLoading ? "..." : kpis.cancellationPercentage || "0%"}
            </h3>
            <p className="text-[8px] text-zinc-500 font-semibold mt-0.5">Index of total checkouts</p>
          </div>
        </div>

      </section>

      {/* Main Cancelled Orders Table Panel */}
      <section className="bg-white dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 rounded-2xl overflow-hidden shadow-xs">
        
        {/* Table Toolbar / Collapsible Filters */}
        <div className="p-4 border-b border-zinc-150 dark:border-zinc-850 bg-zinc-50/20 dark:bg-zinc-900/5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Search Input (Debounced) */}
            <div className="relative w-full sm:max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-450" />
              <input
                type="text"
                placeholder="Search order number..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-[var(--primary)] transition-all placeholder:text-zinc-400"
              />
            </div>

            {/* Filter Toggle & Active count & Reset */}
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

          {/* Sticky filter dropdown configs */}
          {isFilterExpanded && (
            <div className="pt-3 border-t border-zinc-150 dark:border-zinc-850 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 animate-fade-in">
              
              {/* Cancellation Type */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wide">Cancellation Type</label>
                <select
                  value={cancellationType}
                  onChange={(e) => { setCancellationType(e.target.value); setPage(1); }}
                  className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold focus:outline-none focus:border-[var(--primary)]"
                >
                  <option value="all">All Types</option>
                  <option value="Cancelled By Customer">Cancelled By Customer</option>
                  <option value="Cancelled By Store">Cancelled By Store</option>
                  <option value="Cancelled By System">Cancelled By System</option>
                  <option value="Payment Failure">Payment Failure</option>
                </select>
              </div>

              {/* Store Dropdown */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wide">Store Branch</label>
                <select
                  value={storeId}
                  onChange={(e) => { setStoreId(e.target.value); setPage(1); }}
                  className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold focus:outline-none focus:border-[var(--primary)]"
                >
                  <option value="all">All Stores</option>
                  {storesList.map((store) => (
                    <option key={store.storeId} value={store.storeId}>
                      {store.storeName.split(" - ")[1] || store.storeName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Refund Status */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wide">Refund Status</label>
                <select
                  value={refundStatus}
                  onChange={(e) => { setRefundStatus(e.target.value); setPage(1); }}
                  className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold focus:outline-none focus:border-[var(--primary)]"
                >
                  <option value="all">All Refund Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Initiated">Initiated</option>
                  <option value="Completed">Completed</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              {/* Date Presets Picker */}
              <div className="flex flex-col gap-1 md:col-span-2 lg:col-span-2">
                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wide">Date Range Horizon</label>
                <div className="flex flex-wrap gap-1">
                  {[
                    { value: "all", label: "All Time" },
                    { value: "today", label: "Today" },
                    { value: "yesterday", label: "Yesterday" },
                    { value: "week", label: "7 Days" },
                    { value: "month", label: "30 Days" }
                  ].map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => { setDatePreset(preset.value); setPage(1); }}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded transition-all cursor-pointer ${
                        datePreset === preset.value
                          ? "bg-[var(--primary)] text-white"
                          : "bg-white dark:bg-zinc-900 text-zinc-550 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50"
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

        {/* Cancelled Orders Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50 dark:bg-zinc-900/30 text-zinc-500 border-b border-zinc-150 dark:border-zinc-850 text-[10px] uppercase font-black tracking-wider">
                <th className="p-4 cursor-pointer select-none hover:text-zinc-800" onClick={() => handleSort("orderNumber")}>
                  <div className="flex items-center gap-1.5">
                    Order No
                    <ArrowUpDown size={10} />
                  </div>
                </th>
                <th className="p-4 cursor-pointer select-none hover:text-zinc-800" onClick={() => handleSort("customer")}>
                  <div className="flex items-center gap-1.5">
                    Customer Details
                    <ArrowUpDown size={10} />
                  </div>
                </th>
                <th className="p-4">Store Location</th>
                <th className="p-4 text-right cursor-pointer select-none hover:text-zinc-800" onClick={() => handleSort("amount")}>
                  <div className="flex items-center justify-end gap-1.5">
                    Total Amount
                    <ArrowUpDown size={10} />
                  </div>
                </th>
                <th className="p-4 cursor-pointer select-none hover:text-zinc-800" onClick={() => handleSort("reason")}>
                  <div className="flex items-center gap-1.5">
                    Cancellation Reason
                    <ArrowUpDown size={10} />
                  </div>
                </th>
                <th className="p-4">Refund Status</th>
                <th className="p-4 cursor-pointer select-none hover:text-zinc-800" onClick={() => handleSort("placedAt")}>
                  <div className="flex items-center gap-1.5">
                    Cancelled Date
                    <ArrowUpDown size={10} />
                  </div>
                </th>
                <th className="p-4 text-center" style={{ width: "120px" }}>Actions</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              {isLoading ? (
                // Skeletons
                [1, 2, 3, 4, 5].map((n) => (
                  <tr key={n} className="animate-pulse">
                    <td className="p-4"><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-sm w-20"></div></td>
                    <td className="p-4"><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-sm w-32"></div></td>
                    <td className="p-4"><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-sm w-24"></div></td>
                    <td className="p-4 text-right"><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-sm w-16 ml-auto"></div></td>
                    <td className="p-4"><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-sm w-28"></div></td>
                    <td className="p-4"><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-sm w-20"></div></td>
                    <td className="p-4"><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-sm w-24"></div></td>
                    <td className="p-4"><div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded-lg w-20 mx-auto"></div></td>
                  </tr>
                ))
              ) : paginatedOrders.length === 0 ? (
                // Empty state
                <tr>
                  <td colSpan={8} className="p-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="p-3 bg-rose-50 text-rose-500 dark:bg-rose-950/20 rounded-full">
                        <CircleX size={30} />
                      </div>
                      <p className="font-extrabold text-zinc-850 dark:text-zinc-200">No Cancelled Orders Found</p>
                      <p className="text-[10px] text-zinc-450 max-w-[300px] leading-relaxed mx-auto">
                        No orders matched the selected filter presets, date horizon, or search parameters. Try resetting details.
                      </p>
                      <button
                        onClick={handleResetFilters}
                        className="px-3.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-705 font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => (
                  <tr 
                    key={order.id} 
                    className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 transition-colors"
                  >
                    {/* Order No - clickable */}
                    <td className="p-4">
                      <button
                        onClick={() => {
                          setSelectedOrderId(order.id);
                          setActiveOverlay("details");
                        }}
                        className="font-black text-[var(--primary)] hover:underline cursor-pointer focus:outline-none"
                      >
                        {order.orderNumber}
                      </button>
                    </td>

                    {/* Customer Info */}
                    <td className="p-4">
                      <div className="flex items-center gap-2.5">
                        <img 
                          src={order.customer.avatar} 
                          alt="" 
                          className="w-6.5 h-6.5 rounded-full object-cover border border-zinc-200 shadow-inner" 
                          onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=50"; }}
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-zinc-850 dark:text-zinc-100 truncate max-w-[120px]">{order.customer.name}</p>
                          <p className="text-[9.5px] text-zinc-405 font-semibold mt-0.5">{order.customer.phone}</p>
                        </div>
                      </div>
                    </td>

                    {/* Store Location */}
                    <td className="p-4">
                      <span className="font-semibold">{order.store.name.split(",")[0] || order.store.name}</span>
                    </td>

                    {/* Total Amount Paid */}
                    <td className="p-4 text-right font-black text-zinc-850 dark:text-zinc-50">
                      ₹{order.pricing.total.toFixed(2)}
                    </td>

                    {/* Cancellation Reason */}
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded border text-[10px] font-black inline-block ${getReasonBadgeColor(order.cancellation?.reason || "System Failure")}`}>
                        {order.cancellation?.reason || "System Failure"}
                      </span>
                    </td>

                    {/* Refund Status */}
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block border ${getRefundBadgeColor(order.cancellation?.refundStatus)}`}>
                        {order.cancellation?.refundStatus || "N/A"}
                      </span>
                    </td>

                    {/* Cancelled Date relative/formatted */}
                    <td className="p-4 font-semibold text-zinc-500">
                      {formatTime(order.cancellation?.createdAt || order.placedAt)}
                    </td>

                    {/* Actions Dropdown */}
                    <td className="p-4 text-center">
                      <div className="relative inline-block text-left actions-dropdown-container">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDropdownId(activeDropdownId === order.id ? null : order.id);
                          }}
                          className="px-2.5 py-1.5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 hover:text-zinc-905 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          Actions
                          <ChevronRight size={10} className={`transform transition-transform ${activeDropdownId === order.id ? 'rotate-90' : ''}`} />
                        </button>

                        {activeDropdownId === order.id && (
                          <div className="absolute right-0 mt-1 w-[170px] bg-white dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-800 rounded-xl shadow-xl z-20 overflow-hidden divide-y divide-zinc-50 dark:divide-zinc-850">
                            <div className="py-1">
                              <button
                                onClick={() => {
                                  setSelectedOrderId(order.id);
                                  setActiveOverlay("details");
                                  setActiveDropdownId(null);
                                }}
                                className="w-full px-3 py-2 text-left text-[11px] font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900 flex items-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <Eye size={12} className="text-zinc-400" />
                                View Details
                              </button>
                            </div>

                            <div className="py-1">
                              <button
                                disabled={order.cancellation?.refundStatus === "Completed" || order.cancellation?.refundRequired === false}
                                onClick={() => {
                                  setSelectedOrderId(order.id);
                                  setActiveOverlay("refund");
                                  setActiveDropdownId(null);
                                }}
                                className="w-full px-3 py-2 text-left text-[11px] font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900 disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <Wallet size={12} className="text-emerald-500" />
                                Initiate Refund
                              </button>

                              <button
                                onClick={() => {
                                  setSelectedOrderId(order.id);
                                  setActiveOverlay("reopen");
                                  setActiveDropdownId(null);
                                }}
                                className="w-full px-3 py-2 text-left text-[11px] font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900 flex items-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <ShieldAlert size={12} className="text-rose-500" />
                                Reopen Investigation
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

        {/* Server-Side Pagination Footer */}
        <footer className="p-4 border-t border-zinc-150 dark:border-zinc-850 flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-50/30 dark:bg-zinc-900/10">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-450 font-bold">Rows per page:</span>
            <select
              value={limit}
              onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
              className="px-2 py-1 border border-zinc-200 dark:border-zinc-800 rounded-lg text-[10px] bg-white dark:bg-zinc-900 font-bold focus:outline-none"
            >
              <option value={5}>5 rows</option>
              <option value={10}>10 rows</option>
              <option value={20}>20 rows</option>
              <option value={50}>50 rows</option>
            </select>
            <p className="text-[10px] text-zinc-450 font-bold border-l border-zinc-200 dark:border-zinc-800 pl-3">
              Showing {paginatedOrders.length} of {sortedOrders.length} cancellations
            </p>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="p-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs font-black text-zinc-800 dark:text-zinc-200 px-3">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="p-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </footer>
      </section>      {/* Render Modals and Drawers */}
      {activeOverlay === "details" && (
        <CancellationDetailsDrawer
          isOpen={true}
          onClose={() => { setActiveOverlay(null); setSelectedOrderId(null); }}
          order={selectedOrder}
        />
      )}

      {activeOverlay === "refund" && (
        <InitiateRefundModal
          isOpen={true}
          onClose={() => { setActiveOverlay(null); setSelectedOrderId(null); }}
          order={selectedOrder}
        />
      )}

      {activeOverlay === "reopen" && (
        <ReopenInvestigationModal
          isOpen={true}
          onClose={() => { setActiveOverlay(null); setSelectedOrderId(null); }}
          order={selectedOrder}
        />
      )}

      {isAnalysisOpen && (
        <CancellationAnalysisModal
          isOpen={true}
          onClose={() => setIsAnalysisOpen(false)}
        />
      )}

    </div>
  );
}
