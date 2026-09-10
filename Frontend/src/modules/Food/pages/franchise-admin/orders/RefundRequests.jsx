import React, { useState, useEffect, useRef } from "react";
import { 
  Clock3, BadgeCheck, WalletCards, IndianRupee, Timer, Search, Filter, 
  Calendar, X, Download, RefreshCw, BarChart3, ChevronLeft, ChevronRight, 
  MoreVertical, Eye, CheckCircle, Ban, CreditCard, AlertCircle, Bell, Zap, Sliders
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

// Queries and Mutations
import { 
  useRefundRequests, useStores, useRefundAnalytics, 
  simulateNewRefundRequest, useApproveRefund, useRejectRefund, useProcessRefund 
} from "./ordersQuery";

// Overlays
import RefundDetailsDrawer from "./components/RefundDetailsDrawer";
import ApproveRefundModal from "./components/ApproveRefundModal";
import RejectRefundModal from "./components/RejectRefundModal";
import ProcessRefundModal from "./components/ProcessRefundModal";
import RefundAnalysisModal from "./components/RefundAnalysisModal";

export default function RefundRequests() {
  // Sticky advanced filters state
  const [status, setStatus] = useState("all");
  const [storeId, setStoreId] = useState("all");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [localSearch, setLocalSearch] = useState("");
  const [datePreset, setDatePreset] = useState("all"); // today, yesterday, week, month, all
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Overlays state
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [activeOverlay, setActiveOverlay] = useState(null); // 'details', 'approve', 'reject', 'process', 'analysis'
  const [activeDropdownId, setActiveDropdownId] = useState(null);
  const [hoveredReasonId, setHoveredReasonId] = useState(null);

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

  // API Queries
  const queryFilters = {
    status: status === "all" ? "" : status,
    storeId,
    minAmount,
    maxAmount,
    searchQuery,
    datePreset,
    page,
    limit,
  };

  const { data: refundRequests, totalCount, isLoading, refetch } = useRefundRequests(queryFilters);
  const { data: storesList } = useStores();
  const { data: analyticsData } = useRefundAnalytics();

  // Reset Filters
  const handleResetFilters = () => {
    setStatus("all");
    setStoreId("all");
    setMinAmount("");
    setMaxAmount("");
    setLocalSearch("");
    setSearchQuery("");
    setDatePreset("all");
    setPage(1);
    toast.success("Filters reset successfully.");
  };

  // Export CSV Action
  const handleExportCSV = () => {
    if (!refundRequests || refundRequests.length === 0) {
      toast.warning("No refund requests to export.");
      return;
    }
    const headers = "Request ID,Order Number,Customer Name,Customer Phone,Amount,Reason,Status,Requested Date\n";
    const rows = refundRequests.map(r => 
      `"${r.requestId}","${r.orderNumber}","${r.customer?.name}","${r.customer?.phone}",₹${r.refundAmount},"${r.reason}","${r.refundStatus}","${r.requestedAt}"`
    ).join("\n");
    
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Refund_Requests_Export_${Date.now()}.csv`;
    link.click();
    toast.success("CSV report exported successfully.");
  };

  // Export Excel Action (Simulated)
  const handleExportExcel = () => {
    toast.info("Generating Excel sheet...", {
      description: "Processing formatting schema rules & multi-tab metadata columns.",
    });
    setTimeout(() => {
      handleExportCSV();
    }, 800);
  };

  // Helper: Status Badges Colors
  const getStatusBadgeClass = (s) => {
    switch (s) {
      case "Pending":
        return "text-orange-600 bg-orange-55/15 border-orange-200 dark:border-orange-900/35";
      case "Approved":
        return "text-blue-600 bg-blue-55/15 border-blue-200 dark:border-blue-900/35";
      case "Rejected":
        return "text-red-600 bg-red-55/15 border-red-200 dark:border-red-900/35";
      case "Processed":
        return "text-emerald-600 bg-emerald-55/15 border-emerald-200 dark:border-emerald-900/35";
      default:
        return "text-zinc-600 bg-zinc-100 border-zinc-200";
    }
  };

  const selectedRequest = refundRequests?.find(r => r.requestId === selectedRequestId);
  const totalPages = Math.ceil((totalCount || 0) / limit);

  // Dynamic alerts check
  const showPendingAlert = (analyticsData?.pendingCount || 0) >= 3;
  const hasHighValueRequest = refundRequests?.some(r => r.refundStatus === "Pending" && r.refundAmount >= 1000);

  return (
    <div className="p-4 lg:p-6 space-y-6 bg-zinc-50/40 dark:bg-zinc-950 min-h-screen text-xs font-semibold text-zinc-700 dark:text-zinc-350">
      
      {/* Alert Banners Column */}
      <div className="space-y-2.5">
        {showPendingAlert && (
          <div className="p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/30 rounded-xl text-orange-700 dark:text-orange-400 font-bold flex items-start gap-2.5 shadow-sm animate-pulse">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p>Action Required: Pending Refund Volume Threshold Exceeded</p>
              <p className="text-[10px] text-orange-600/90 dark:text-orange-400/80 font-medium">
                There are currently {analyticsData?.pendingCount} requests awaiting audit approval. Clear pending queue to avoid customer SLA penalties.
              </p>
            </div>
          </div>
        )}
        
        {hasHighValueRequest && (
          <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl text-red-700 dark:text-red-400 font-bold flex items-start gap-2.5 shadow-sm">
            <Bell size={16} className="shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p>Risk Warning: High-Value Pending Claims Detected</p>
              <p className="text-[10px] text-red-650/90 dark:text-red-400/80 font-medium">
                One or more pending refund requests exceeds ₹1,000. Double check attachment proof and delivery logs before authorizing payout.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Page Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <WalletCards className="text-[var(--primary)] shrink-0" size={24} />
            <span>Refund Requests</span>
          </h1>
          <p className="text-[10px] text-zinc-400 font-bold mt-0.5">
            Audit customer refund claims, log dispute resolution status, and process gateway settlements.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveOverlay("analysis")}
            className="px-3.5 py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-900 dark:border dark:border-zinc-800 text-white dark:text-zinc-200 font-bold rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <BarChart3 size={14} />
            <span>View Analytics</span>
          </button>
          
          <div className="h-6 w-[1px] bg-zinc-200 dark:bg-zinc-800 mx-1 hidden sm:block" />

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-350 font-bold rounded-xl transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <Download size={14} className="text-zinc-400" />
            <span>CSV</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-350 font-bold rounded-xl transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <Download size={14} className="text-zinc-400" />
            <span>Excel</span>
          </button>
          <button
            onClick={refetch}
            className="p-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-400 hover:text-zinc-600 rounded-xl transition-all active:scale-95 cursor-pointer"
            title="Manual Sync"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </header>

      {/* 5 KPI Cards Row */}
      <section className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* KPI 1: Pending */}
        <div className="bg-white dark:bg-zinc-950 p-4 border border-zinc-150 dark:border-zinc-850 rounded-2xl flex items-center gap-3.5 shadow-xs relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-350" />
          <div className="p-2.5 bg-orange-55/10 text-orange-550 rounded-xl shrink-0">
            <Clock3 size={18} />
          </div>
          <div>
            <p className="text-[9.5px] uppercase font-bold text-zinc-400 tracking-wider">Pending Refunds</p>
            <h3 className="text-lg font-black text-zinc-900 dark:text-white mt-1">
              {analyticsData?.pendingCount || 0}
            </h3>
          </div>
        </div>

        {/* KPI 2: Approved */}
        <div className="bg-white dark:bg-zinc-950 p-4 border border-zinc-150 dark:border-zinc-850 rounded-2xl flex items-center gap-3.5 shadow-xs relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-350" />
          <div className="p-2.5 bg-blue-55/10 text-blue-550 rounded-xl shrink-0">
            <BadgeCheck size={18} />
          </div>
          <div>
            <p className="text-[9.5px] uppercase font-bold text-zinc-400 tracking-wider">Approved Refunds</p>
            <h3 className="text-lg font-black text-zinc-900 dark:text-white mt-1">
              {analyticsData?.approvedCount || 0}
            </h3>
          </div>
        </div>

        {/* KPI 3: Processed */}
        <div className="bg-white dark:bg-zinc-950 p-4 border border-zinc-150 dark:border-zinc-850 rounded-2xl flex items-center gap-3.5 shadow-xs relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-350" />
          <div className="p-2.5 bg-emerald-55/10 text-emerald-550 rounded-xl shrink-0">
            <WalletCards size={18} />
          </div>
          <div>
            <p className="text-[9.5px] uppercase font-bold text-zinc-400 tracking-wider">Processed Refunds</p>
            <h3 className="text-lg font-black text-zinc-900 dark:text-white mt-1">
              {analyticsData?.processedCount || 0}
            </h3>
          </div>
        </div>

        {/* KPI 4: Refund Amount */}
        <div className="bg-white dark:bg-zinc-950 p-4 border border-zinc-150 dark:border-zinc-850 rounded-2xl flex items-center gap-3.5 shadow-xs relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-350" />
          <div className="p-2.5 bg-purple-55/10 text-purple-550 rounded-xl shrink-0">
            <IndianRupee size={18} />
          </div>
          <div>
            <p className="text-[9.5px] uppercase font-bold text-zinc-400 tracking-wider">Refund Amount</p>
            <h3 className="text-lg font-black text-zinc-900 dark:text-white mt-1 truncate">
              ₹{(analyticsData?.totalRefundAmount || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            </h3>
          </div>
        </div>

        {/* KPI 5: Resolution Time */}
        <div className="bg-white dark:bg-zinc-950 p-4 border border-zinc-150 dark:border-zinc-850 rounded-2xl flex items-center gap-3.5 shadow-xs relative overflow-hidden group col-span-2 lg:col-span-1">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-350" />
          <div className="p-2.5 bg-amber-55/10 text-amber-550 rounded-xl shrink-0">
            <Timer size={18} />
          </div>
          <div>
            <p className="text-[9.5px] uppercase font-bold text-zinc-400 tracking-wider">Avg Resolution</p>
            <h3 className="text-lg font-black text-zinc-900 dark:text-white mt-1">
              {analyticsData?.avgResolutionTime || "3.2 Days"}
            </h3>
          </div>
        </div>

      </section>

      {/* WebSocket Simulator Banner */}
      <div className="p-3 bg-zinc-900 dark:bg-zinc-900 border border-zinc-800 rounded-2xl text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-450 animate-ping shrink-0" />
          <div>
            <p className="font-extrabold text-[10.5px]">Real-time WebSocket Simulator Node</p>
            <p className="text-[9.5px] text-zinc-400">Add random incoming customer refund requests instantly to test reactive updates.</p>
          </div>
        </div>
        <button
          onClick={() => {
            simulateNewRefundRequest();
          }}
          className="px-3.5 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 shrink-0 self-start sm:self-center"
        >
          <Zap size={13} className="text-yellow-350 fill-current" />
          <span>Simulate Refund Request</span>
        </button>
      </div>

      {/* Sticky Filters & Search Section */}
      <section className="bg-white dark:bg-zinc-950 p-4 border border-zinc-150 dark:border-zinc-850 rounded-2xl shadow-xs space-y-4">
        
        {/* Core row: Search + Status dropdown + toggle */}
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          
          {/* Search box */}
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={15} />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none focus:border-[var(--primary)] transition-colors"
              placeholder="Search request ID, order number, or customer name..."
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            
            {/* Status Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-[9.5px] uppercase font-bold text-zinc-400 tracking-wider">Status:</span>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold text-zinc-800 dark:text-zinc-200 focus:outline-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Processed">Processed</option>
              </select>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setIsFilterExpanded(!isFilterExpanded)}
              className={`p-2.5 rounded-xl border transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 ${
                isFilterExpanded 
                  ? "bg-zinc-905 border-transparent text-white dark:bg-zinc-800" 
                  : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 text-zinc-500"
              }`}
              title="Toggle Advanced Filters"
            >
              <Sliders size={14} />
              <span className="font-bold">Filters</span>
            </button>

            {/* Reset Filters */}
            <button
              onClick={handleResetFilters}
              className="p-2.5 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 rounded-xl transition-all active:scale-95 cursor-pointer text-zinc-550 dark:text-zinc-350"
              title="Reset Filters"
            >
              <X size={14} />
            </button>

          </div>

        </div>

        {/* Collapsible Row: Advanced filters */}
        {isFilterExpanded && (
          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-900 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 animate-slide-down">
            
            {/* Store Dropdown */}
            <div className="space-y-1.5">
              <label className="text-[9.5px] uppercase font-bold text-zinc-400 tracking-wider block">Franchise Store</label>
              <select
                value={storeId}
                onChange={(e) => {
                  setStoreId(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold text-zinc-850 dark:text-zinc-200 focus:outline-none cursor-pointer"
              >
                <option value="all">All Stores</option>
                {storesList?.map(store => (
                  <option key={store.storeId} value={store.storeId}>{store.storeName}</option>
                ))}
              </select>
            </div>

            {/* Date Range Presets */}
            <div className="space-y-1.5">
              <label className="text-[9.5px] uppercase font-bold text-zinc-400 tracking-wider block">Requested Date Preset</label>
              <select
                value={datePreset}
                onChange={(e) => {
                  setDatePreset(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold text-zinc-850 dark:text-zinc-200 focus:outline-none cursor-pointer"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>

            {/* Minimum Amount */}
            <div className="space-y-1.5">
              <label className="text-[9.5px] uppercase font-bold text-zinc-400 tracking-wider block">Minimum Amount (₹)</label>
              <input
                type="number"
                value={minAmount}
                onChange={(e) => {
                  setMinAmount(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3.5 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none"
                placeholder="₹ Min"
              />
            </div>

            {/* Maximum Amount */}
            <div className="space-y-1.5">
              <label className="text-[9.5px] uppercase font-bold text-zinc-400 tracking-wider block">Maximum Amount (₹)</label>
              <input
                type="number"
                value={maxAmount}
                onChange={(e) => {
                  setMaxAmount(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3.5 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none"
                placeholder="₹ Max"
              />
            </div>

          </div>
        )}

      </section>

      {/* Main Refund Requests Table Card */}
      <section className="bg-white dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 rounded-2xl shadow-xs overflow-hidden flex flex-col">
        
        {/* Table wrapper */}
        <div className="overflow-x-auto scrollbar-thin scrollbar-track-zinc-100 scrollbar-thumb-zinc-300">
          <table className="w-full min-w-[1000px] text-left border-collapse">
            
            {/* Table Header */}
            <thead>
              <tr className="bg-zinc-50/50 dark:bg-zinc-900/30 border-b border-zinc-150 dark:border-zinc-850 text-zinc-450 uppercase text-[9px] font-black tracking-wider">
                <th className="px-5 py-3">Request ID</th>
                <th className="px-4 py-3">Order No</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3">Requested Date</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900 font-semibold text-zinc-800 dark:text-zinc-250">
              {isLoading ? (
                // Skeleton loading rows
                Array.from({ length: limit }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-5 py-4"><div className="w-16 h-3 bg-zinc-200 dark:bg-zinc-800 rounded" /></td>
                    <td className="px-4 py-4"><div className="w-20 h-3 bg-zinc-200 dark:bg-zinc-800 rounded" /></td>
                    <td className="px-4 py-4 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                      <div className="space-y-1">
                        <div className="w-24 h-2.5 bg-zinc-200 dark:bg-zinc-800 rounded" />
                        <div className="w-16 h-2 bg-zinc-200 dark:bg-zinc-800 rounded" />
                      </div>
                    </td>
                    <td className="px-4 py-4"><div className="w-12 h-3 bg-zinc-200 dark:bg-zinc-800 rounded" /></td>
                    <td className="px-4 py-4"><div className="w-24 h-3 bg-zinc-200 dark:bg-zinc-800 rounded" /></td>
                    <td className="px-4 py-4 text-center"><div className="w-14 h-5 bg-zinc-200 dark:bg-zinc-800 rounded-full mx-auto" /></td>
                    <td className="px-4 py-4"><div className="w-20 h-3 bg-zinc-200 dark:bg-zinc-800 rounded" /></td>
                    <td className="px-5 py-4 text-right"><div className="w-6 h-6 bg-zinc-200 dark:bg-zinc-800 rounded mx-auto" /></td>
                  </tr>
                ))
              ) : !refundRequests || refundRequests.length === 0 ? (
                // Empty state
                <tr>
                  <td colSpan={8} className="py-20 text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center mx-auto text-zinc-300 dark:text-zinc-700">
                      <WalletCards size={32} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">No Refund Requests Found</h4>
                      <p className="text-[10px] text-zinc-400 font-semibold mt-1">Try modifying filter ranges, resetting date presets, or adding mock datasets.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                // Data rows
                refundRequests.map((r) => (
                  <tr key={r.requestId} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 transition-colors">
                    
                    {/* Request ID */}
                    <td className="px-5 py-3">
                      <button
                        onClick={() => {
                          setSelectedRequestId(r.requestId);
                          setActiveOverlay("details");
                        }}
                        className="font-black font-mono text-[var(--primary)] hover:underline cursor-pointer focus:outline-none"
                      >
                        {r.requestId}
                      </button>
                    </td>

                    {/* Order Number */}
                    <td className="px-4 py-3 font-mono font-bold text-zinc-500">{r.orderNumber}</td>

                    {/* Customer */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <img
                          src={r.customer?.avatar}
                          alt={r.customer?.name}
                          className="w-7 h-7 rounded-full border border-zinc-200 dark:border-zinc-800 object-cover bg-zinc-50 shrink-0 select-none"
                        />
                        <div className="space-y-0.5 min-w-0">
                          <p className="font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-[120px]">{r.customer?.name}</p>
                          <p className="text-[9px] text-zinc-400 font-semibold">{r.customer?.phone}</p>
                        </div>
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-3 font-extrabold text-zinc-900 dark:text-white">
                      ₹{r.refundAmount.toFixed(2)}
                    </td>

                    {/* Reason with tooltip overlay */}
                    <td className="px-4 py-3 relative">
                      <div 
                        onMouseEnter={() => setHoveredReasonId(r.requestId)}
                        onMouseLeave={() => setHoveredReasonId(null)}
                        className="truncate max-w-[150px] font-semibold text-zinc-550 dark:text-zinc-400 cursor-help"
                      >
                        {r.reason}
                        {hoveredReasonId === r.requestId && (
                          <div className="absolute left-4 bottom-8 z-30 p-2.5 max-w-[240px] bg-zinc-900 text-white rounded-lg shadow-xl text-[10px] font-medium leading-relaxed border border-zinc-800 pointer-events-none animate-fade-in font-sans">
                            <span className="font-bold uppercase tracking-wider block text-[8px] text-zinc-400 mb-0.5">Customer Claim Notes</span>
                            {r.description || "No full explanation provided."}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2.5 py-0.5 border rounded-full font-bold inline-flex items-center gap-1 text-[9.5px] ${getStatusBadgeClass(r.refundStatus)}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {r.refundStatus}
                      </span>
                    </td>

                    {/* Requested Date */}
                    <td className="px-4 py-3 text-zinc-505 font-bold text-[10px]">
                      {r.requestedAt ? formatDistanceToNow(new Date(r.requestedAt), { addSuffix: true }) : "N/A"}
                    </td>

                    {/* Actions Dropdown */}
                    <td className="px-5 py-3 text-right">
                      <div className="relative inline-block text-left actions-dropdown-container">
                        <button
                          onClick={() => setActiveDropdownId(activeDropdownId === r.requestId ? null : r.requestId)}
                          className="p-1.5 rounded-lg text-zinc-450 hover:text-zinc-650 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors focus:outline-none cursor-pointer"
                        >
                          <MoreVertical size={14} />
                        </button>
                        
                        {activeDropdownId === r.requestId && (
                          <div className="absolute right-0 mt-1.5 w-40 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-20 overflow-hidden py-1 animate-scale-up font-semibold">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedRequestId(r.requestId);
                                setActiveDropdownId(null);
                                setActiveOverlay("details");
                              }}
                              className="w-full px-3.5 py-2 text-left hover:bg-zinc-50 dark:hover:bg-zinc-900/50 flex items-center gap-2 cursor-pointer"
                            >
                              <Eye size={12} className="text-zinc-400" />
                              <span>View Details</span>
                            </button>

                            {r.refundStatus === "Pending" && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedRequestId(r.requestId);
                                    setActiveDropdownId(null);
                                    setActiveOverlay("approve");
                                  }}
                                  className="w-full px-3.5 py-2 text-left hover:bg-blue-50/55 dark:hover:bg-blue-950/20 text-blue-600 flex items-center gap-2 cursor-pointer"
                                >
                                  <CheckCircle size={12} />
                                  <span>Approve</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedRequestId(r.requestId);
                                    setActiveDropdownId(null);
                                    setActiveOverlay("reject");
                                  }}
                                  className="w-full px-3.5 py-2 text-left hover:bg-red-50/55 dark:hover:bg-red-950/20 text-red-600 flex items-center gap-2 cursor-pointer"
                                >
                                  <Ban size={12} />
                                  <span>Reject</span>
                                </button>
                              </>
                            )}

                            {r.refundStatus === "Approved" && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedRequestId(r.requestId);
                                  setActiveDropdownId(null);
                                  setActiveOverlay("process");
                                }}
                                className="w-full px-3.5 py-2 text-left hover:bg-emerald-50/55 dark:hover:bg-emerald-950/20 text-emerald-600 flex items-center gap-2 cursor-pointer"
                              >
                                <CreditCard size={12} />
                                <span>Process Refund</span>
                              </button>
                            )}
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

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <footer className="p-4 border-t border-zinc-100 dark:border-zinc-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-50/20 dark:bg-zinc-900/10 font-bold">
            
            {/* Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-400 font-semibold">Rows per page:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="px-2 py-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-700 dark:text-zinc-300 font-bold focus:outline-none cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span className="text-zinc-450 ml-2">Showing {Math.min((page - 1) * limit + 1, totalCount)}-{Math.min(page * limit, totalCount)} of {totalCount} requests</span>
            </div>

            {/* Stepper buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="p-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg disabled:opacity-40 hover:bg-zinc-50 dark:hover:bg-zinc-900 active:scale-95 transition-all cursor-pointer"
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: totalPages }).map((_, i) => {
                const pNum = i + 1;
                const active = page === pNum;
                return (
                  <button
                    key={pNum}
                    onClick={() => setPage(pNum)}
                    className={`w-7 h-7 font-bold rounded-lg transition-all text-center flex items-center justify-center cursor-pointer ${
                      active
                        ? "bg-[var(--primary)] text-white shadow-xs"
                        : "border border-zinc-200 dark:border-zinc-800 text-zinc-550 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                    }`}
                  >
                    {pNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="p-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg disabled:opacity-40 hover:bg-zinc-50 dark:hover:bg-zinc-900 active:scale-95 transition-all cursor-pointer"
              >
                <ChevronRight size={14} />
              </button>
            </div>

          </footer>
        )}

      </section>

      {/* ==================================================== */}
      {/* OVERLAY WRAPPERS AND RENDER CONTROLS                  */}
      {/* ==================================================== */}

      {/* 1. Details drawer */}
      <RefundDetailsDrawer
        isOpen={activeOverlay === "details"}
        onClose={() => {
          setActiveOverlay(null);
          setSelectedRequestId(null);
        }}
        requestId={selectedRequestId}
      />

      {/* 2. Approve modal */}
      <ApproveRefundModal
        isOpen={activeOverlay === "approve"}
        onClose={() => {
          setActiveOverlay(null);
          setSelectedRequestId(null);
        }}
        request={selectedRequest}
      />

      {/* 3. Reject modal */}
      <RejectRefundModal
        isOpen={activeOverlay === "reject"}
        onClose={() => {
          setActiveOverlay(null);
          setSelectedRequestId(null);
        }}
        request={selectedRequest}
      />

      {/* 4. Process Payout modal */}
      <ProcessRefundModal
        isOpen={activeOverlay === "process"}
        onClose={() => {
          setActiveOverlay(null);
          setSelectedRequestId(null);
        }}
        request={selectedRequest}
      />

      {/* 5. Charts / Analysis Dashboard modal */}
      <RefundAnalysisModal
        isOpen={activeOverlay === "analysis"}
        onClose={() => setActiveOverlay(null)}
      />

    </div>
  );
}
