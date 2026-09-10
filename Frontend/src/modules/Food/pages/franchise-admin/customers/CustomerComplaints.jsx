import React, { useState, useEffect, useRef } from "react";
import { 
  ShieldAlert, Search, Download, RefreshCw, Plus, Filter, 
  RotateCcw, ChevronLeft, ChevronRight, Eye, Trash2, 
  Mail, Phone, Calendar, ArrowUpDown, MoreVertical, PlusCircle, 
  Package, MapPin, ClipboardList, AlertTriangle, CheckCircle2, 
  UserPlus, Check, TrendingUp, UserCheck, Clock, ShieldCheck, LifeBuoy
} from "lucide-react";
import { useComplaints } from "./hooks/useComplaints";
import ComplaintDrawer from "./components/ComplaintDrawer";
import { 
  CreateComplaintModal, 
  AssignComplaintModal, 
  EscalateComplaintModal, 
  ExportComplaintsModal
} from "./components/ComplaintModals";
import {
  ResolveComplaintModal,
  CloseTicketModal,
  AddComplaintNoteModal
} from "./components/ComplaintDetailModals";
import { mockStores } from "./mockData";

export default function CustomerComplaints() {
  const useComplaintsHook = useComplaints();
  const {
    complaints,
    loading,
    totalCount,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    search,
    setSearch,
    storeId,
    setStoreId,
    category,
    setCategory,
    priority,
    setPriority,
    status,
    setStatus,
    assignedTo,
    setAssignedTo,
    dateFilter,
    setDateFilter,
    customDateRange,
    setCustomDateRange,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    stats,
    complaintDetails,
    fetchComplaintDetails,
    createComplaint,
    assignComplaint,
    escalateComplaint,
    resolveComplaint,
    closeTicket,
    deleteComplaint,
    addComplaintNote,
    deleteComplaintNote,
    exportComplaints,
    refetch
  } = useComplaintsHook;

  // Local Search Input with Debounce
  const [localSearch, setLocalSearch] = useState(search);
  
  // Modals visibility states
  const [showCreate, setShowCreate] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [showEscalate, setShowEscalate] = useState(false);
  const [showResolve, setShowResolve] = useState(false);
  const [showClose, setShowClose] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  
  // Drawer visibility state
  const [showDrawer, setShowDrawer] = useState(false);

  // Active complaint context for modals
  const [activeComplaint, setActiveComplaint] = useState(null);

  // Active action menu row ID
  const [activeMenuId, setActiveMenuId] = useState(null);
  const menuRef = useRef(null);

  // Debouncing Search Input
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(localSearch);
      setCurrentPage(1);
    }, 400);

    return () => clearTimeout(handler);
  }, [localSearch, setSearch, setCurrentPage]);

  // Click outside listener for actions menu dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle Sort Change
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
    setCurrentPage(1);
  };

  // Format date nicely
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
    } catch {
      return dateStr;
    }
  };

  const handleActionClick = (complaint, action) => {
    setActiveComplaint(complaint);
    setActiveMenuId(null);
    
    if (action === "view") {
      setShowDrawer(true);
    } else if (action === "assign") {
      setShowAssign(true);
    } else if (action === "escalate") {
      setShowEscalate(true);
    } else if (action === "resolve") {
      setShowResolve(true);
    } else if (action === "close") {
      setShowClose(true);
    } else if (action === "add-note") {
      setShowAddNote(true);
    } else if (action === "delete") {
      if (window.confirm("Are you sure you want to permanently delete this complaint ticket?")) {
        deleteComplaint(complaint._id);
      }
    }
  };

  // Total pages calculation
  const totalPages = Math.ceil(totalCount / pageSize);

  const getPriorityBadgeClass = (p) => {
    switch (p) {
      case "Low": return "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 border-slate-350";
      case "Medium": return "bg-amber-100 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border-amber-300/40";
      case "High": return "bg-orange-100 text-orange-700 dark:bg-orange-950/20 dark:text-orange-400 border-orange-300/40";
      case "Critical": return "bg-rose-100 text-rose-700 dark:bg-rose-950/20 dark:text-rose-450 border-rose-300/40";
      default: return "bg-zinc-100 text-zinc-700 border-zinc-300";
    }
  };

  const getStatusBadgeClass = (s) => {
    switch (s) {
      case "Open": return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
      case "In Progress": return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
      case "Escalated": return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20";
      case "Resolved": return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      case "Closed": return "bg-zinc-550/10 text-zinc-500 dark:text-zinc-400 border-zinc-550/20";
      default: return "bg-slate-500/10 text-slate-650 border-slate-500/20";
    }
  };

  return (
    <div className="p-3 md:p-5 max-w-7xl mx-auto space-y-4 text-xs bg-slate-50 dark:bg-zinc-950 min-h-screen text-zinc-700 dark:text-zinc-300">
      
      {/* Top Header Section */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-xs shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
              Customer Complaints Desk
            </h1>
            <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[8px] font-bold px-1.5 py-0.2 rounded-full border border-emerald-500/20">
              Live DB
            </span>
          </div>
          <p className="text-zinc-450 dark:text-zinc-400 mt-0.5 text-[10px] font-medium font-semibold">
            Track support tickets, assign representatives, trigger refund dispatch, and monitor SLAs.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={() => setShowExport(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg shadow-sm font-bold text-zinc-750 dark:text-zinc-200 transition-all cursor-pointer"
          >
            <Download size={13} className="text-[var(--primary)]" />
            <span>Export database</span>
          </button>
          
          <button 
            onClick={() => setShowCreate(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-[var(--primary)] text-white hover:opacity-95 rounded-lg shadow-sm font-bold uppercase transition-all cursor-pointer"
          >
            <Plus size={13} />
            <span>New Ticket</span>
          </button>
          
          <button 
            onClick={() => { refetch(); }}
            className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-750 rounded-lg transition-all text-zinc-600 dark:text-zinc-300 cursor-pointer"
            title="Refresh database"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </header>

      {/* KPI Bento Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        
        {/* Card 1: Open Complaints */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl shadow-xs flex items-center justify-between hover:scale-[1.01] transition-all">
          <div className="space-y-1">
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Open Tickets</p>
            <p className="text-lg font-black text-blue-600 dark:text-blue-400">{stats.openComplaints}</p>
          </div>
          <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-500">
            <ShieldAlert size={16} />
          </div>
        </div>

        {/* Card 2: High & Critical Priority */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl shadow-xs flex items-center justify-between hover:scale-[1.01] transition-all">
          <div className="space-y-1">
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">High & Critical</p>
            <div className="flex items-center gap-1.5">
              <p className="text-lg font-black text-rose-600 dark:text-rose-450">{stats.highPriority}</p>
              {stats.highPriority > 0 && <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500">
            <AlertTriangle size={16} />
          </div>
        </div>

        {/* Card 3: Escalated Tickets */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl shadow-xs flex items-center justify-between hover:scale-[1.01] transition-all">
          <div className="space-y-1">
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Escalated</p>
            <p className="text-lg font-black text-orange-600 dark:text-orange-400">{stats.escalated}</p>
          </div>
          <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-500">
            <LifeBuoy size={16} />
          </div>
        </div>

        {/* Card 4: Resolved Today */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl shadow-xs flex items-center justify-between hover:scale-[1.01] transition-all">
          <div className="space-y-1">
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Resolved Today</p>
            <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">{stats.resolvedToday}</p>
          </div>
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
            <UserCheck size={16} />
          </div>
        </div>

        {/* Card 5: Avg Handling Time */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl shadow-xs flex items-center justify-between hover:scale-[1.01] transition-all">
          <div className="space-y-1">
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Avg Handling Time</p>
            <p className="text-lg font-black text-amber-600 dark:text-amber-500">{stats.avgResolutionTimeHours} Hrs</p>
          </div>
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500">
            <Clock size={16} />
          </div>
        </div>

        {/* Card 6: Month's Total */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl shadow-xs flex items-center justify-between hover:scale-[1.01] transition-all">
          <div className="space-y-1">
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">This Month Total</p>
            <p className="text-lg font-black text-zinc-800 dark:text-white">{stats.totalComplaintsThisMonth}</p>
          </div>
          <div className="p-2 rounded-lg bg-zinc-500/10 border border-zinc-500/20 text-zinc-500">
            <ClipboardList size={16} />
          </div>
        </div>

      </section>

      {/* Filter Section (Sticky) */}
      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-xs space-y-3 sticky top-16 z-20">
        
        {/* Row 1: Search and Dropdowns */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          
          {/* Debounced Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search Ticket, Customer, Order..."
              value={localSearch}
              onChange={e => setLocalSearch(e.target.value)}
              className="pl-9 pr-4 py-2 w-full text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:border-[var(--primary)] transition-all font-semibold"
            />
          </div>

          {/* Store Filter */}
          <div>
            <select
              value={storeId}
              onChange={e => { setStoreId(e.target.value); setCurrentPage(1); }}
              className="w-full p-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:outline-none font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer"
            >
              <option value="All">All Store Branches</option>
              {mockStores.map(store => (
                <option key={store.id} value={store.id}>{store.name}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={category}
              onChange={e => { setCategory(e.target.value); setCurrentPage(1); }}
              className="w-full p-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:outline-none font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer"
            >
              <option value="All">All Categories</option>
              <option value="Food Quality">Food Quality</option>
              <option value="Delivery">Delivery</option>
              <option value="Payment">Payment</option>
              <option value="Missing Item">Missing Item</option>
              <option value="App Issue">App Issue</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={priority}
              onChange={e => { setPriority(e.target.value); setCurrentPage(1); }}
              className="w-full p-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:outline-none font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer"
            >
              <option value="All">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={status}
              onChange={e => { setStatus(e.target.value); setCurrentPage(1); }}
              className="w-full p-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:outline-none font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Escalated">Escalated</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

        </div>

        {/* Row 2: Date Filters & Reset */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase text-zinc-450">Date Registered:</span>
            <div className="flex gap-1">
              {["All", "Today", "This Week", "This Month", "Custom Range"].map(opt => (
                <button
                  key={opt}
                  onClick={() => {
                    setDateFilter(opt);
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                    dateFilter === opt 
                      ? "border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)]" 
                      : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-550 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>

            {/* Custom Range Inputs */}
            {dateFilter === "Custom Range" && (
              <div className="flex items-center gap-1.5 ml-2 animate-fade-down">
                <input
                  type="date"
                  value={customDateRange.start}
                  onChange={e => setCustomDateRange({ ...customDateRange, start: e.target.value })}
                  className="p-1 text-[10px] border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 rounded outline-none"
                />
                <span className="text-zinc-400 font-bold">-</span>
                <input
                  type="date"
                  value={customDateRange.end}
                  onChange={e => setCustomDateRange({ ...customDateRange, end: e.target.value })}
                  className="p-1 text-[10px] border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 rounded outline-none"
                />
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setLocalSearch("");
                setSearch("");
                setStoreId("All");
                setCategory("All");
                setPriority("All");
                setStatus("All");
                setAssignedTo("All");
                setDateFilter("All");
                setCustomDateRange({ start: "", end: "" });
                setSortBy("createdAt");
                setSortOrder("desc");
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 rounded-lg border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 font-bold transition-all text-zinc-650 dark:text-zinc-300 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw size={12} />
              Reset Filters
            </button>
          </div>
        </div>

      </section>

      {/* Complaints Database Table */}
      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs">
        
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[1000px]">
            <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-850 text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
              <tr>
                <th className="px-4 py-3 cursor-pointer select-none" onClick={() => handleSort("ticketNumber")}>
                  <div className="flex items-center gap-1 hover:text-zinc-700 dark:hover:text-zinc-250">
                    Ticket ID
                    <ArrowUpDown size={11} />
                  </div>
                </th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Related Order</th>
                <th className="px-4 py-3">Store Branch</th>
                <th className="px-4 py-3 cursor-pointer select-none" onClick={() => handleSort("category")}>
                  <div className="flex items-center gap-1 hover:text-zinc-700 dark:hover:text-zinc-250">
                    Category
                    <ArrowUpDown size={11} />
                  </div>
                </th>
                <th className="px-4 py-3 cursor-pointer select-none" onClick={() => handleSort("priority")}>
                  <div className="flex items-center gap-1 hover:text-zinc-700 dark:hover:text-zinc-250">
                    Priority
                    <ArrowUpDown size={11} />
                  </div>
                </th>
                <th className="px-4 py-3 cursor-pointer select-none" onClick={() => handleSort("status")}>
                  <div className="flex items-center gap-1 hover:text-zinc-700 dark:hover:text-zinc-250">
                    Status
                    <ArrowUpDown size={11} />
                  </div>
                </th>
                <th className="px-4 py-3">Representative</th>
                <th className="px-4 py-3 cursor-pointer select-none" onClick={() => handleSort("createdAt")}>
                  <div className="flex items-center gap-1 hover:text-zinc-700 dark:hover:text-zinc-250">
                    Registered
                    <ArrowUpDown size={11} />
                  </div>
                </th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-zinc-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
                      <span className="font-semibold text-xs">Querying MongoDB Collections...</span>
                    </div>
                  </td>
                </tr>
              ) : complaints.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-zinc-400 font-semibold">
                    No complaints matching current filters found.
                  </td>
                </tr>
              ) : (
                complaints.map((comp) => (
                  <tr key={comp._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40 text-zinc-750 dark:text-zinc-350 transition-colors">
                    {/* Ticket ID */}
                    <td className="px-4 py-3 font-bold text-zinc-900 dark:text-white">
                      <span className="bg-zinc-100 dark:bg-zinc-850 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800 text-[10px]">
                        {comp.ticketNumber}
                      </span>
                    </td>
                    
                    {/* Customer */}
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-bold text-zinc-850 dark:text-zinc-200">{comp.customerName}</div>
                        <div className="text-[9px] text-zinc-400 font-semibold flex items-center gap-1 mt-0.5">
                          <Phone size={9} />
                          {comp.customerPhone}
                        </div>
                      </div>
                    </td>

                    {/* Order ID */}
                    <td className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">
                      {comp.orderId ? (
                        <span className="font-bold text-[10px]">{comp.orderId}</span>
                      ) : (
                        <span className="text-[10px] text-zinc-400 italic">None</span>
                      )}
                    </td>

                    {/* Store Branch */}
                    <td className="px-4 py-3 font-bold text-zinc-700 dark:text-zinc-300">
                      {comp.storeName}
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3 font-bold text-zinc-650 dark:text-zinc-350">
                      {comp.category}
                    </td>

                    {/* Priority Badge */}
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded border text-[9px] font-extrabold uppercase ${getPriorityBadgeClass(comp.priority)}`}>
                        {comp.priority}
                      </span>
                    </td>

                    {/* Status badge */}
                    <td className="px-4 py-3">
                      <span className={`px-1.5 py-0.5 rounded-full border text-[8px] font-black uppercase ${getStatusBadgeClass(comp.status)}`}>
                        {comp.status}
                      </span>
                    </td>

                    {/* Assigned To */}
                    <td className="px-4 py-3 text-xs">
                      {comp.assignedTo ? (
                        <span className="font-bold text-zinc-700 dark:text-zinc-200">{comp.assignedTo}</span>
                      ) : (
                        <span className="text-red-500 font-extrabold uppercase text-[9px]">Unassigned</span>
                      )}
                    </td>

                    {/* Registered Date */}
                    <td className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">
                      {formatDate(comp.createdAt)}
                    </td>

                    {/* Actions Menu */}
                    <td className="px-4 py-3 text-right relative">
                      <div className="flex justify-end items-center gap-1.5">
                        
                        {/* Eye details button */}
                        <button
                          onClick={() => handleActionClick(comp, "view")}
                          className="p-1 text-zinc-400 hover:text-[var(--primary)] hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                          title="View Details Drawer"
                        >
                          <Eye size={14} />
                        </button>

                        <div className="relative">
                          <button
                            onClick={() => setActiveMenuId(activeMenuId === comp._id ? null : comp._id)}
                            className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                          >
                            <MoreVertical size={14} />
                          </button>

                          {activeMenuId === comp._id && (
                            <div 
                              ref={menuRef} 
                              className="absolute right-0 mt-1 w-36 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg z-50 overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800/80 animate-fade-down duration-100"
                            >
                              <div className="py-1">
                                <button
                                  onClick={() => handleActionClick(comp, "view")}
                                  className="w-full text-left px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-850 flex items-center gap-1.5 text-zinc-650 dark:text-zinc-350 cursor-pointer font-semibold"
                                >
                                  <Eye size={12} />
                                  <span>View Drawer</span>
                                </button>
                                
                                <button
                                  onClick={() => handleActionClick(comp, "assign")}
                                  disabled={comp.status === "Closed"}
                                  className="w-full text-left px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-850 flex items-center gap-1.5 text-zinc-650 dark:text-zinc-350 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed font-semibold"
                                >
                                  <UserPlus size={12} />
                                  <span>Assign Agent</span>
                                </button>

                                <button
                                  onClick={() => handleActionClick(comp, "escalate")}
                                  disabled={comp.status === "Closed"}
                                  className="w-full text-left px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-850 flex items-center gap-1.5 text-zinc-650 dark:text-zinc-350 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed font-semibold"
                                >
                                  <AlertTriangle size={12} />
                                  <span>Escalate SLA</span>
                                </button>
                              </div>

                              <div className="py-1">
                                <button
                                  onClick={() => handleActionClick(comp, "resolve")}
                                  disabled={comp.status === "Closed" || comp.status === "Resolved"}
                                  className="w-full text-left px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-850 flex items-center gap-1.5 text-zinc-650 dark:text-zinc-350 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed font-semibold"
                                >
                                  <Check size={12} className="text-emerald-500" />
                                  <span>Resolve case</span>
                                </button>

                                <button
                                  onClick={() => handleActionClick(comp, "close")}
                                  disabled={comp.status === "Closed" || comp.status !== "Resolved"}
                                  className="w-full text-left px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-850 flex items-center gap-1.5 text-zinc-650 dark:text-zinc-350 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed font-semibold"
                                >
                                  <CheckCircle2 size={12} />
                                  <span>Close Ticket</span>
                                </button>
                              </div>

                              <div className="py-1 bg-rose-500/5">
                                <button
                                  onClick={() => handleActionClick(comp, "delete")}
                                  className="w-full text-left px-3 py-1.5 hover:bg-rose-500/10 flex items-center gap-1.5 text-rose-600 cursor-pointer font-semibold"
                                >
                                  <Trash2 size={12} />
                                  <span>Delete Ticket</span>
                                </button>
                              </div>
                            </div>
                          )}

                        </div>

                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Section */}
        {totalPages > 0 && (
          <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-zinc-450 dark:text-zinc-400 font-semibold select-none">
            
            <div className="flex items-center gap-2 text-[10px]">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                className="p-1 rounded border border-zinc-250 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 outline-none text-[10px] font-bold cursor-pointer"
              >
                {[5, 10, 20, 50].map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
              <span>Showing {Math.min(totalCount, (currentPage - 1) * pageSize + 1)}-{Math.min(totalCount, currentPage * pageSize)} of {totalCount} records</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
              >
                <ChevronLeft size={13} />
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-6 h-6 rounded-lg text-[10px] font-extrabold flex items-center justify-center border transition-all cursor-pointer ${
                      currentPage === page
                        ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-xs"
                        : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-850"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
              >
                <ChevronRight size={13} />
              </button>
            </div>

          </div>
        )}

      </section>

      {/* Slideout Detail Drawer */}
      <ComplaintDrawer
        isOpen={showDrawer}
        onClose={() => setShowDrawer(false)}
        complaintId={activeComplaint?._id}
        useComplaintsHook={useComplaintsHook}
        onAssignClick={(c) => handleActionClick(c, "assign")}
        onEscalateClick={(c) => handleActionClick(c, "escalate")}
        onResolveClick={(c) => handleActionClick(c, "resolve")}
        onCloseClick={(c) => handleActionClick(c, "close")}
        onDeleteClick={(id) => {
          if (window.confirm("Are you sure you want to delete this ticket?")) {
            deleteComplaint(id);
            setShowDrawer(false);
          }
        }}
      />

      {/* Actions Modals */}
      <CreateComplaintModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={createComplaint}
      />

      <AssignComplaintModal
        isOpen={showAssign}
        onClose={() => setShowAssign(false)}
        complaint={activeComplaint}
        onAssign={assignComplaint}
      />

      <EscalateComplaintModal
        isOpen={showEscalate}
        onClose={() => setShowEscalate(false)}
        complaint={activeComplaint}
        onEscalate={escalateComplaint}
      />

      <ResolveComplaintModal
        isOpen={showResolve}
        onClose={() => setShowResolve(false)}
        complaint={activeComplaint}
        onResolve={resolveComplaint}
      />

      <CloseTicketModal
        isOpen={showClose}
        onClose={() => setShowClose(false)}
        complaint={activeComplaint}
        onCloseTicket={closeTicket}
      />

      <ExportComplaintsModal
        isOpen={showExport}
        onClose={() => setShowExport(false)}
        onExport={exportComplaints}
      />

    </div>
  );
}
