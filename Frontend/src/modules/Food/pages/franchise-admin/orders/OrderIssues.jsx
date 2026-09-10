import React, { useState, useEffect } from "react";
import { 
  AlertCircle, AlertTriangle, BadgeCheck, Clock3, Star, Search, Filter, 
  X, Download, RefreshCw, BarChart3, ChevronLeft, ChevronRight, MoreVertical, 
  Eye, UserPlus, CheckCircle, Ban, Zap, Sliders, Calendar, User, ShieldAlert
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

// Queries and Mutations
import { 
  useOrderIssues, useStores, useIssueStaff, useIssueAnalytics, 
  simulateNewOrderIssue, useAssignIssue, useResolveIssue, useCloseIssue 
} from "./ordersQuery";

// Overlays
import IssueDetailsDrawer from "./components/IssueDetailsDrawer";
import AssignIssueModal from "./components/AssignIssueModal";
import ResolveIssueModal from "./components/ResolveIssueModal";
import CloseIssueModal from "./components/CloseIssueModal";
import IssueAnalysisModal from "./components/IssueAnalysisModal";

export default function OrderIssues() {
  // Filters state
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [category, setCategory] = useState("all");
  const [storeId, setStoreId] = useState("all");
  const [staffId, setStaffId] = useState("all");
  const [datePreset, setDatePreset] = useState("all"); // today, week, month, all
  const [localSearch, setLocalSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Overlays state
  const [selectedIssueNumber, setSelectedIssueNumber] = useState(null);
  const [activeOverlay, setActiveOverlay] = useState(null); // 'details', 'assign', 'resolve', 'close', 'analysis'
  const [activeDropdownId, setActiveDropdownId] = useState(null);

  // Search Debouncing (355ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localSearch);
      setPage(1);
    }, 355);
    return () => clearTimeout(timer);
  }, [localSearch]);

  // Click outside for dropdowns
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
    priority: priority === "all" ? "" : priority,
    category: category === "all" ? "" : category,
    storeId,
    staffId,
    datePreset,
    searchQuery,
    page,
    limit,
  };

  const { data: orderIssues, totalCount, isLoading, refetch } = useOrderIssues(queryFilters);
  const { data: storesList } = useStores();
  const { data: staffList } = useIssueStaff();
  const { data: analyticsData } = useIssueAnalytics();

  // Reset Filters
  const handleResetFilters = () => {
    setStatus("all");
    setPriority("all");
    setCategory("all");
    setStoreId("all");
    setStaffId("all");
    setDatePreset("all");
    setLocalSearch("");
    setSearchQuery("");
    setPage(1);
    toast.success("Filters reset successfully.");
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!orderIssues || orderIssues.length === 0) {
      toast.warning("No issues to export.");
      return;
    }
    const headers = "Issue ID,Order Number,Category,Priority,Assigned To,Status,Created Date\n";
    const rows = orderIssues.map(i => 
      `"${i.issueNumber}","${i.orderNumber}","${i.category}","${i.priority}","${i.assignedTo?.name || 'Unassigned'}","${i.status}","${i.createdAt}"`
    ).join("\n");
    
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Order_Issues_Export_${Date.now()}.csv`;
    link.click();
    toast.success("CSV report exported successfully.");
  };

  // Export Excel (Simulated)
  const handleExportExcel = () => {
    toast.info("Generating Excel sheet...", {
      description: "Formatting data grids, loading operator signatures, and resolution summaries.",
    });
    setTimeout(() => {
      handleExportCSV();
    }, 800);
  };

  // Helper Badge Styling
  const getStatusBadgeClass = (s) => {
    switch (s) {
      case "Open":
        return "text-red-600 bg-red-55/15 border-red-200 dark:border-red-900/35";
      case "Assigned":
        return "text-blue-600 bg-blue-55/15 border-blue-200 dark:border-blue-900/35";
      case "Investigating":
        return "text-orange-600 bg-orange-55/15 border-orange-200 dark:border-orange-900/35";
      case "Resolved":
        return "text-emerald-600 bg-emerald-55/15 border-emerald-200 dark:border-emerald-900/35";
      case "Closed":
        return "text-zinc-550 bg-zinc-100 border-zinc-200 dark:bg-zinc-900/40 dark:border-zinc-800 text-zinc-400";
      default:
        return "text-zinc-600 bg-zinc-50 border-zinc-200";
    }
  };

  const getPriorityBadgeClass = (p) => {
    switch (p) {
      case "Critical":
        return "text-red-700 bg-red-100 border-red-300 dark:bg-red-950/45 dark:border-red-900 font-extrabold";
      case "High":
        return "text-orange-700 bg-orange-100 border-orange-300 dark:bg-orange-950/45 dark:border-orange-900 font-bold";
      case "Medium":
        return "text-blue-700 bg-blue-100 border-blue-300 dark:bg-blue-950/45 dark:border-blue-900 font-bold";
      default:
        return "text-zinc-600 bg-zinc-100 border-zinc-200";
    }
  };

  const getCategoryBadgeClass = (c) => {
    switch (c) {
      case "Wrong Item": return "text-red-650 bg-red-50 dark:bg-red-955/10 border-red-200 dark:border-red-900/30";
      case "Missing Item": return "text-orange-650 bg-orange-50 dark:bg-orange-955/10 border-orange-200 dark:border-orange-900/30";
      case "Late Delivery": return "text-blue-650 bg-blue-50 dark:bg-blue-955/10 border-blue-200 dark:border-blue-900/30";
      case "Cold Pizza": return "text-yellow-650 bg-yellow-50 dark:bg-yellow-955/10 border-yellow-200 dark:border-yellow-900/30";
      case "Damaged Package": return "text-purple-650 bg-purple-50 dark:bg-purple-955/10 border-purple-200 dark:border-purple-900/30";
      case "Rider Misbehavior": return "text-indigo-650 bg-indigo-50 dark:bg-indigo-955/10 border-indigo-200 dark:border-indigo-900/30";
      default: return "text-zinc-650 bg-zinc-50 border-zinc-200";
    }
  };

  const selectedIssue = orderIssues?.find(i => i.issueNumber === selectedIssueNumber);
  const totalPages = Math.ceil((totalCount || 0) / limit);

  // Dynamic alert notifications
  const hasCriticalIssues = orderIssues?.some(i => i.status === "Open" && i.priority === "Critical");
  const hasUnassignedIssues = orderIssues?.some(i => i.status === "Open" && !i.assignedTo);
  const highComplaintVolume = (analyticsData?.openIssuesCount || 0) >= 3;

  return (
    <div className="p-4 lg:p-6 space-y-6 bg-zinc-50/40 dark:bg-zinc-950 min-h-screen text-xs font-semibold text-zinc-700 dark:text-zinc-350">
      
      {/* Dynamic Alerts Banner */}
      <div className="space-y-2.5">
        {hasCriticalIssues && (
          <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl text-red-750 dark:text-red-400 font-bold flex items-start gap-2.5 shadow-sm animate-pulse">
            <ShieldAlert size={16} className="shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p>Risk Alert: Critical Unresolved Tickets Detected</p>
              <p className="text-[10px] text-red-600/90 dark:text-red-400/80 font-medium">
                One or more post-order complaints are marked Critical. Immediate operator review is required to verify customer safety or payment disputes.
              </p>
            </div>
          </div>
        )}

        {hasUnassignedIssues && (
          <div className="p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/30 rounded-xl text-orange-750 dark:text-orange-400 font-bold flex items-start gap-2.5 shadow-sm">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p>Action Required: Unassigned Operational Disputes Exist</p>
              <p className="text-[10px] text-orange-600/90 dark:text-orange-400/80 font-medium">
                New incoming order issues are currently sitting in the unassigned queue. Assign operators to start investigations.
              </p>
            </div>
          </div>
        )}

        {highComplaintVolume && (
          <div className="p-3 bg-amber-50/20 dark:bg-amber-955/5 border border-amber-200 dark:border-amber-900/30 rounded-xl text-amber-700 dark:text-amber-400 font-bold flex items-start gap-2.5 shadow-sm">
            <Info size={16} className="shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p>Performance Warning: Open Ticket Volume High</p>
              <p className="text-[10px] text-amber-600/90 dark:text-amber-400/80 font-medium">
                The open complaint volume is currently at {analyticsData?.openIssuesCount}. Average resolution time SLA may drift if tickets are not resolved promptly.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Page Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <AlertCircle className="text-[var(--primary)] shrink-0" size={24} />
            <span>Order Issues</span>
          </h1>
          <p className="text-[10px] text-zinc-400 font-bold mt-0.5">
            Monitor failed deliveries, cold food complaints, and rider misbehavior tickets.
          </p>
        </div>

        {/* Actions Controls */}
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
            className="p-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-400 hover:text-zinc-650 rounded-xl transition-all active:scale-95 cursor-pointer"
            title="Manual Sync"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </header>

      {/* 5 KPI Cards Bento */}
      <section className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* KPI 1: Open */}
        <div className="bg-white dark:bg-zinc-950 p-4 border border-zinc-150 dark:border-zinc-850 rounded-2xl flex items-center gap-3.5 shadow-xs relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-350" />
          <div className="p-2.5 bg-red-50 text-red-600 dark:bg-red-950/20 rounded-xl shrink-0">
            <AlertCircle size={18} />
          </div>
          <div>
            <p className="text-[9.5px] uppercase font-bold text-zinc-400 tracking-wider">Open Issues</p>
            <h3 className="text-lg font-black text-red-650 mt-1">
              {analyticsData?.openIssuesCount || 0}
            </h3>
          </div>
        </div>

        {/* KPI 2: High Priority */}
        <div className="bg-white dark:bg-zinc-950 p-4 border border-zinc-150 dark:border-zinc-850 rounded-2xl flex items-center gap-3.5 shadow-xs relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-350" />
          <div className="p-2.5 bg-orange-50 text-orange-600 dark:bg-orange-950/20 rounded-xl shrink-0">
            <AlertTriangle size={18} />
          </div>
          <div>
            <p className="text-[9.5px] uppercase font-bold text-zinc-400 tracking-wider">High Priority</p>
            <h3 className="text-lg font-black text-orange-600 mt-1">
              {analyticsData?.highPriorityCount || 0}
            </h3>
          </div>
        </div>

        {/* KPI 3: Resolved Today */}
        <div className="bg-white dark:bg-zinc-950 p-4 border border-zinc-150 dark:border-zinc-850 rounded-2xl flex items-center gap-3.5 shadow-xs relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-350" />
          <div className="p-2.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 rounded-xl shrink-0">
            <BadgeCheck size={18} />
          </div>
          <div>
            <p className="text-[9.5px] uppercase font-bold text-zinc-400 tracking-wider">Resolved Today</p>
            <h3 className="text-lg font-black text-emerald-600 mt-1">
              {analyticsData?.resolvedTodayCount || 0}
            </h3>
          </div>
        </div>

        {/* KPI 4: Avg Resolution Time */}
        <div className="bg-white dark:bg-zinc-950 p-4 border border-zinc-150 dark:border-zinc-850 rounded-2xl flex items-center gap-3.5 shadow-xs relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-350" />
          <div className="p-2.5 bg-blue-55/10 text-blue-550 rounded-xl shrink-0">
            <Clock3 size={18} />
          </div>
          <div>
            <p className="text-[9.5px] uppercase font-bold text-zinc-400 tracking-wider">Avg Resolve Time</p>
            <h3 className="text-lg font-black text-zinc-900 dark:text-white mt-1">
              {analyticsData?.avgResolutionTime || "4.5 Hours"}
            </h3>
          </div>
        </div>

        {/* KPI 5: Customer Satisfaction */}
        <div className="bg-white dark:bg-zinc-950 p-4 border border-zinc-150 dark:border-zinc-850 rounded-2xl flex items-center gap-3.5 shadow-xs relative overflow-hidden group col-span-2 lg:col-span-1">
          <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/5 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-350" />
          <div className="p-2.5 bg-yellow-55/10 text-yellow-550 rounded-xl shrink-0">
            <Star size={18} />
          </div>
          <div>
            <p className="text-[9.5px] uppercase font-bold text-zinc-400 tracking-wider">CSAT Score</p>
            <h3 className="text-lg font-black text-zinc-900 dark:text-white mt-1">
              {analyticsData?.customerSatisfaction || "4.7★"}
            </h3>
          </div>
        </div>

      </section>

      {/* WebSocket Simulator Banner */}
      <div className="p-3 bg-zinc-900 dark:bg-zinc-900 border border-zinc-805 rounded-2xl text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-450 animate-ping shrink-0" />
          <div>
            <p className="font-extrabold text-[10.5px]">Real-time Order Dispute Simulator Node</p>
            <p className="text-[9.5px] text-zinc-400">Generate simulated post-order disputes instantly to evaluate SLA counters and assignment tools.</p>
          </div>
        </div>
        <button
          onClick={() => {
            simulateNewOrderIssue();
          }}
          className="px-3.5 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 shrink-0 self-start sm:self-center font-sans"
        >
          <Zap size={13} className="text-yellow-350 fill-current" />
          <span>Simulate Dispute Ticket</span>
        </button>
      </div>

      {/* Sticky Filters & Search Section */}
      <section className="bg-white dark:bg-zinc-950 p-4 border border-zinc-150 dark:border-zinc-850 rounded-2xl shadow-xs space-y-4">
        
        {/* Core row */}
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          
          {/* Search box */}
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={15} />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none focus:border-[var(--primary)] transition-colors"
              placeholder="Search issue ID, order number, customer name..."
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            
            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[9.5px] uppercase font-bold text-zinc-400 tracking-wider">Status:</span>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold text-zinc-805 dark:text-zinc-200 focus:outline-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="Open">Open</option>
                <option value="Assigned">Assigned</option>
                <option value="Investigating">Investigating</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
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
            >
              <Sliders size={14} />
              <span className="font-bold">Filters</span>
            </button>

            {/* Reset Filters */}
            <button
              onClick={handleResetFilters}
              className="p-2.5 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 rounded-xl transition-all active:scale-95 cursor-pointer text-zinc-555 dark:text-zinc-355"
              title="Reset Filters"
            >
              <X size={14} />
            </button>

          </div>

        </div>

        {/* Collapsible Row: Advanced filters */}
        {isFilterExpanded && (
          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-900 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 animate-slide-down">
            
            {/* Priority Filter */}
            <div className="space-y-1.5">
              <label className="text-[9.5px] uppercase font-bold text-zinc-400 tracking-wider block">Priority</label>
              <select
                value={priority}
                onChange={(e) => {
                  setPriority(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold text-zinc-850 dark:text-zinc-200 focus:outline-none cursor-pointer"
              >
                <option value="all">All Priorities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            {/* Category Filter */}
            <div className="space-y-1.5">
              <label className="text-[9.5px] uppercase font-bold text-zinc-400 tracking-wider block">Dispute Category</label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold text-zinc-850 dark:text-zinc-200 focus:outline-none cursor-pointer"
              >
                <option value="all">All Categories</option>
                <option value="Wrong Item">Wrong Item</option>
                <option value="Missing Item">Missing Item</option>
                <option value="Late Delivery">Late Delivery</option>
                <option value="Cold Pizza">Cold Pizza</option>
                <option value="Damaged Package">Damaged Package</option>
                <option value="Rider Misbehavior">Rider Misbehavior</option>
                <option value="Payment Problem">Payment Problem</option>
              </select>
            </div>

            {/* Store Filter */}
            <div className="space-y-1.5">
              <label className="text-[9.5px] uppercase font-bold text-zinc-400 tracking-wider block">Franchise Store</label>
              <select
                value={storeId}
                onChange={(e) => {
                  setStoreId(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold text-zinc-855 dark:text-zinc-200 focus:outline-none cursor-pointer"
              >
                <option value="all">All Stores</option>
                {storesList?.map(store => (
                  <option key={store.storeId} value={store.storeId}>{store.storeName}</option>
                ))}
              </select>
            </div>

            {/* Assigned Staff Filter */}
            <div className="space-y-1.5">
              <label className="text-[9.5px] uppercase font-bold text-zinc-400 tracking-wider block">Assigned Staff</label>
              <select
                value={staffId}
                onChange={(e) => {
                  setStaffId(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold text-zinc-855 dark:text-zinc-200 focus:outline-none cursor-pointer"
              >
                <option value="all">All Operators</option>
                <option value="unassigned">Unassigned</option>
                {staffList?.map(staff => (
                  <option key={staff.id} value={staff.id}>{staff.name} ({staff.department})</option>
                ))}
              </select>
            </div>

            {/* Date Preset */}
            <div className="space-y-1.5">
              <label className="text-[9.5px] uppercase font-bold text-zinc-400 tracking-wider block">Creation Preset</label>
              <select
                value={datePreset}
                onChange={(e) => {
                  setDatePreset(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold text-zinc-855 dark:text-zinc-200 focus:outline-none cursor-pointer"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>

          </div>
        )}

      </section>

      {/* Main Issue Table Section */}
      <section className="bg-white dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 rounded-2xl shadow-xs overflow-hidden flex flex-col">
        
        {/* Table wrapper */}
        <div className="overflow-x-auto scrollbar-thin scrollbar-track-zinc-100 scrollbar-thumb-zinc-300">
          <table className="w-full min-w-[1000px] text-left border-collapse">
            
            {/* Headers */}
            <thead>
              <tr className="bg-zinc-50/50 dark:bg-zinc-900/30 border-b border-zinc-150 dark:border-zinc-850 text-zinc-450 uppercase text-[9px] font-black tracking-wider">
                <th className="px-5 py-3">Issue ID</th>
                <th className="px-4 py-3">Order No</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-center">Priority</th>
                <th className="px-4 py-3">Assigned To</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3">Created Date</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>

            {/* Body */}
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900 font-semibold text-zinc-800 dark:text-zinc-250">
              {isLoading ? (
                // Loading Skeletons
                Array.from({ length: limit }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-5 py-4"><div className="w-16 h-3 bg-zinc-200 dark:bg-zinc-800 rounded" /></td>
                    <td className="px-4 py-4"><div className="w-20 h-3 bg-zinc-200 dark:bg-zinc-800 rounded" /></td>
                    <td className="px-4 py-4"><div className="w-24 h-4 bg-zinc-200 dark:bg-zinc-800 rounded" /></td>
                    <td className="px-4 py-4 text-center"><div className="w-14 h-5 bg-zinc-200 dark:bg-zinc-800 rounded-full mx-auto" /></td>
                    <td className="px-4 py-4 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                      <div className="w-20 h-3 bg-zinc-200 dark:bg-zinc-800 rounded" />
                    </td>
                    <td className="px-4 py-4 text-center"><div className="w-14 h-5 bg-zinc-200 dark:bg-zinc-800 rounded-full mx-auto" /></td>
                    <td className="px-4 py-4"><div className="w-16 h-3 bg-zinc-200 dark:bg-zinc-800 rounded" /></td>
                    <td className="px-5 py-4 text-right"><div className="w-6 h-6 bg-zinc-200 dark:bg-zinc-800 rounded mx-auto" /></td>
                  </tr>
                ))
              ) : !orderIssues || orderIssues.length === 0 ? (
                // Empty state
                <tr>
                  <td colSpan={8} className="py-20 text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center mx-auto text-zinc-300 dark:text-zinc-700">
                      <ShieldAlert size={32} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">No Order Issues Found</h4>
                      <p className="text-[10px] text-zinc-400 font-semibold mt-1">Try resetting filter selectors, searching other orders, or adding simulated disputes.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                // Table Rows
                orderIssues.map((i) => (
                  <tr key={i.issueNumber} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 transition-colors">
                    
                    {/* Issue ID */}
                    <td className="px-5 py-3">
                      <button
                        onClick={() => {
                          setSelectedIssueNumber(i.issueNumber);
                          setActiveOverlay("details");
                        }}
                        className="font-black font-mono text-[var(--primary)] hover:underline cursor-pointer focus:outline-none"
                      >
                        {i.issueNumber}
                      </button>
                    </td>

                    {/* Order No */}
                    <td className="px-4 py-3 font-mono font-bold text-zinc-500">{i.orderNumber}</td>

                    {/* Category */}
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-0.5 border rounded-lg font-bold text-[9.5px] ${getCategoryBadgeClass(i.category)}`}>
                        {i.category}
                      </span>
                    </td>

                    {/* Priority */}
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2.5 py-0.5 border rounded-full text-[9px] ${getPriorityBadgeClass(i.priority)}`}>
                        {i.priority}
                      </span>
                    </td>

                    {/* Assigned To */}
                    <td className="px-4 py-3">
                      {i.assignedTo ? (
                        <div className="flex items-center gap-2">
                          <img
                            src={i.assignedTo.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=50&q=80"}
                            alt={i.assignedTo.name}
                            className="w-5 h-5 rounded-full border border-zinc-200 dark:border-zinc-800 object-cover bg-zinc-100 shrink-0"
                          />
                          <div className="space-y-0.5 min-w-0">
                            <p className="font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-[120px]">{i.assignedTo.name}</p>
                            <p className="text-[8.5px] text-zinc-400 font-bold">{i.assignedTo.department}</p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-[10px] text-zinc-400 font-bold italic">Unassigned</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2.5 py-0.5 border rounded-full font-bold inline-flex items-center gap-1 text-[9.5px] ${getStatusBadgeClass(i.status)}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {i.status}
                      </span>
                    </td>

                    {/* Created Date */}
                    <td className="px-4 py-3 text-zinc-505 font-bold text-[10px]">
                      {i.createdAt ? formatDistanceToNow(new Date(i.createdAt), { addSuffix: true }) : "N/A"}
                    </td>

                    {/* Actions Menu */}
                    <td className="px-5 py-3 text-right">
                      <div className="relative inline-block text-left actions-dropdown-container">
                        <button
                          onClick={() => setActiveDropdownId(activeDropdownId === i.issueNumber ? null : i.issueNumber)}
                          className="p-1.5 rounded-lg text-zinc-450 hover:text-zinc-650 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors focus:outline-none cursor-pointer"
                        >
                          <MoreVertical size={14} />
                        </button>
                        
                        {activeDropdownId === i.issueNumber && (
                          <div className="absolute right-0 mt-1.5 w-40 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-20 overflow-hidden py-1 animate-scale-up font-semibold">
                            
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedIssueNumber(i.issueNumber);
                                setActiveDropdownId(null);
                                setActiveOverlay("details");
                              }}
                              className="w-full px-3.5 py-2 text-left hover:bg-zinc-50 dark:hover:bg-zinc-900/50 flex items-center gap-2 cursor-pointer"
                            >
                              <Eye size={12} className="text-zinc-400" />
                              <span>View Issue</span>
                            </button>

                            {i.status !== "Closed" && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedIssueNumber(i.issueNumber);
                                  setActiveDropdownId(null);
                                  setActiveOverlay("assign");
                                }}
                                className="w-full px-3.5 py-2 text-left hover:bg-zinc-50 dark:hover:bg-zinc-900/50 flex items-center gap-2 cursor-pointer text-blue-600"
                              >
                                <UserPlus size={12} />
                                <span>Assign Staff</span>
                              </button>
                            )}

                            {(i.status === "Open" || i.status === "Assigned" || i.status === "Investigating") && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedIssueNumber(i.issueNumber);
                                  setActiveDropdownId(null);
                                  setActiveOverlay("resolve");
                                }}
                                className="w-full px-3.5 py-2 text-left hover:bg-zinc-50 dark:hover:bg-zinc-900/50 flex items-center gap-2 cursor-pointer text-emerald-600"
                              >
                                <CheckCircle size={12} />
                                <span>Resolve Issue</span>
                              </button>
                            )}

                            {i.status === "Resolved" && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedIssueNumber(i.issueNumber);
                                  setActiveDropdownId(null);
                                  setActiveOverlay("close");
                                }}
                                className="w-full px-3.5 py-2 text-left hover:bg-zinc-50 dark:hover:bg-zinc-900/50 flex items-center gap-2 cursor-pointer text-zinc-900 dark:text-white"
                              >
                                <Ban size={12} />
                                <span>Close Ticket</span>
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
              <span className="text-zinc-450 ml-2">Showing {Math.min((page - 1) * limit + 1, totalCount)}-{Math.min(page * limit, totalCount)} of {totalCount} tickets</span>
            </div>

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
                        : "border border-zinc-200 dark:border-zinc-800 text-zinc-550 dark:text-zinc-355 hover:bg-zinc-50 dark:hover:bg-zinc-900"
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
      {/* OVERLAY TRIGGERS                                     */}
      {/* ==================================================== */}

      {/* Drawer */}
      <IssueDetailsDrawer
        isOpen={activeOverlay === "details"}
        onClose={() => {
          setActiveOverlay(null);
          setSelectedIssueNumber(null);
        }}
        issueNumber={selectedIssueNumber}
      />

      {/* Assign Modal */}
      <AssignIssueModal
        isOpen={activeOverlay === "assign"}
        onClose={() => {
          setActiveOverlay(null);
          setSelectedIssueNumber(null);
        }}
        issue={selectedIssue}
      />

      {/* Resolve Modal */}
      <ResolveIssueModal
        isOpen={activeOverlay === "resolve"}
        onClose={() => {
          setActiveOverlay(null);
          setSelectedIssueNumber(null);
        }}
        issue={selectedIssue}
      />

      {/* Close Modal */}
      <CloseIssueModal
        isOpen={activeOverlay === "close"}
        onClose={() => {
          setActiveOverlay(null);
          setSelectedIssueNumber(null);
        }}
        issue={selectedIssue}
      />

      {/* Analysis Modal */}
      <IssueAnalysisModal
        isOpen={activeOverlay === "analysis"}
        onClose={() => setActiveOverlay(null)}
      />

    </div>
  );
}
