import React, { useState, useEffect, useRef } from "react";
import { 
  Users, UserCheck, UserPlus, Trophy, DollarSign, Percent, 
  Search, Download, RefreshCw, Plus, Filter, RotateCcw, 
  ChevronLeft, ChevronRight, Eye, Edit, ShieldAlert, ShieldCheck, 
  Trash2, Mail, Phone, Calendar, ArrowUpDown, MoreVertical, PlusCircle,
  Package, MapPin, ClipboardList, AlertTriangle
} from "lucide-react";
import { useCustomers } from "./hooks/useCustomers";
import { useSearchParams } from "react-router-dom";
import CustomerDrawer from "./components/CustomerDrawer";
import { 
  EditCustomerModal, 
  BlockCustomerModal, 
  UnblockCustomerModal, 
  ExportCustomersModal,
  AddNoteModal 
} from "./components/Modals";
import { mockStores } from "./mockData";

export default function CustomersList() {
  const useCustomersHook = useCustomers();
  const {
    customers,
    loading,
    totalCount,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    search,
    setSearch,
    customerType,
    setCustomerType,
    status,
    setStatus,
    storeId,
    setStoreId,
    orderCountFilter,
    setOrderCountFilter,
    dateFilter,
    setDateFilter,
    customDateRange,
    setCustomDateRange,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    stats,
    blockCustomer,
    unblockCustomer,
    updateCustomer,
    deleteCustomer,
    exportCustomers,
    addNote,
    refetch
  } = useCustomersHook;

  // Local Search Input with Debounce
  const [localSearch, setLocalSearch] = useState(search);
  const [searchParams, setSearchParams] = useSearchParams();
  const userIdFromUrl = searchParams.get("userId");
  
  // Auto-open drawer when userId query parameter is present in the URL
  useEffect(() => {
    if (userIdFromUrl && customers.length > 0) {
      const customer = customers.find(c => c._id === userIdFromUrl || c.userId === userIdFromUrl);
      if (customer) {
        setActiveCustomer(customer);
        setShowDrawer(true);
        // Clear query parameter after opening
        const params = new URLSearchParams(searchParams);
        params.delete("userId");
        setSearchParams(params, { replace: true });
      }
    }
  }, [userIdFromUrl, customers, searchParams, setSearchParams]);
  
  // Modals visibility states
  const [showExport, setShowExport] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showBlock, setShowBlock] = useState(false);
  const [showUnblock, setShowUnblock] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Drawer visibility state
  const [showDrawer, setShowDrawer] = useState(false);

  // Active customer context for modals
  const [activeCustomer, setActiveCustomer] = useState(null);

  // Active action menu row index
  const [activeMenuIndex, setActiveMenuIndex] = useState(null);
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
        setActiveMenuIndex(null);
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

  const handleActionClick = (customer, action) => {
    setActiveCustomer(customer);
    setActiveMenuIndex(null);
    
    if (action === "view") {
      setShowDrawer(true);
    } else if (action === "edit") {
      setShowEdit(true);
    } else if (action === "block") {
      setShowBlock(true);
    } else if (action === "unblock") {
      setShowUnblock(true);
    } else if (action === "delete") {
      setShowDeleteConfirm(true);
    } else if (action === "add-note") {
      setShowAddNote(true);
    }
  };

  // Total pages calculation
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="p-3 md:p-5 max-w-7xl mx-auto space-y-4 text-xs bg-slate-50 dark:bg-zinc-950 min-h-screen text-zinc-700 dark:text-zinc-300">
      
      {/* Top Header Section */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-4 rounded-xl shadow-xs shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
              Customer List
            </h1>
            <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[8px] font-bold px-1.5 py-0.2 rounded-full border border-emerald-500/20">
              Live DB
            </span>
          </div>
          <p className="text-zinc-450 dark:text-zinc-400 mt-0.5 text-[10px] font-medium">
            Manage customers, order history, loyalty and spending insights.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={() => setShowExport(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg shadow-sm font-bold text-zinc-700 dark:text-zinc-200 transition-all cursor-pointer"
          >
            <Download size={13} className="text-[var(--primary)]" />
            <span>Export database</span>
          </button>
          
          <button 
            onClick={() => {
              if (customers.length > 0) {
                handleActionClick(customers[0], "add-note");
              } else {
                alert("No customers in database to attach notes to");
              }
            }}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg shadow-sm font-bold text-zinc-700 dark:text-zinc-200 transition-all cursor-pointer"
          >
            <PlusCircle size={13} className="text-[var(--primary)]" />
            <span>Quick note</span>
          </button>

          <button 
            onClick={() => { refetch(); }}
            className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-750 rounded-lg transition-all text-zinc-600 dark:text-zinc-300"
            title="Refresh database"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </header>

      {/* KPI Bento Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        
        {/* Card 1: Total Customers */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-3.5 rounded-xl shadow-xs flex items-center justify-between hover:scale-[1.01] transition-all">
          <div className="space-y-1">
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Total Customers</p>
            <p className="text-lg font-black text-zinc-900 dark:text-white">{stats.totalCustomers}</p>
          </div>
          <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-500">
            <Users size={16} />
          </div>
        </div>

        {/* Card 2: Active Customers */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-3.5 rounded-xl shadow-xs flex items-center justify-between hover:scale-[1.01] transition-all">
          <div className="space-y-1">
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Active Customers</p>
            <div className="flex items-center gap-1.5">
              <p className="text-lg font-black text-emerald-600 dark:text-emerald-450">{stats.activeCustomers}</p>
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            </div>
          </div>
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
            <UserCheck size={16} />
          </div>
        </div>

        {/* Card 3: New Customers This Month */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-3.5 rounded-xl shadow-xs flex items-center justify-between hover:scale-[1.01] transition-all">
          <div className="space-y-1">
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">New This Month</p>
            <p className="text-lg font-black text-blue-600 dark:text-blue-400">{stats.newCustomersThisMonth}</p>
          </div>
          <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-500">
            <UserPlus size={16} />
          </div>
        </div>

        {/* Card 4: VIP Customers */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-3.5 rounded-xl shadow-xs flex items-center justify-between hover:scale-[1.01] transition-all">
          <div className="space-y-1">
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">VIP Members</p>
            <p className="text-lg font-black text-purple-600 dark:text-purple-400">{stats.vipCustomers}</p>
          </div>
          <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-500">
            <Trophy size={16} />
          </div>
        </div>

        {/* Card 5: Average Order Value */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-3.5 rounded-xl shadow-xs flex items-center justify-between hover:scale-[1.01] transition-all">
          <div className="space-y-1">
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Avg Order Value</p>
            <p className="text-lg font-black text-orange-500">₹{stats.avgOrderValue.toFixed(0)}</p>
          </div>
          <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-500">
            <Percent size={16} />
          </div>
        </div>

        {/* Card 6: Lifetime Revenue */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-3.5 rounded-xl shadow-xs flex items-center justify-between hover:scale-[1.01] transition-all">
          <div className="space-y-1">
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Lifetime Spend</p>
            <p className="text-lg font-black text-emerald-600 dark:text-emerald-500">₹{stats.lifetimeRevenue.toLocaleString('en-IN')}</p>
          </div>
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
            <DollarSign size={16} />
          </div>
        </div>

      </section>

      {/* Filter Section (Sticky/Collapsible) */}
      <section className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-4 rounded-xl shadow-xs space-y-3 sticky top-16 z-30">
        
        {/* Row 1: Search and Dropdowns */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          
          {/* Debounced Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search Name, Email, Mobile..."
              value={localSearch}
              onChange={e => setLocalSearch(e.target.value)}
              className="pl-9 pr-4 py-2 w-full text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:outline-none focus:border-[var(--primary)] transition-all font-semibold"
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={customerType}
              onChange={e => { setCustomerType(e.target.value); setCurrentPage(1); }}
              className="w-full p-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:outline-none font-semibold text-zinc-700 dark:text-zinc-300"
            >
              <option value="All">All Customer Types</option>
              <option value="New">New Members</option>
              <option value="Regular">Regular Members</option>
              <option value="VIP">VIP Members</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={status}
              onChange={e => { setStatus(e.target.value); setCurrentPage(1); }}
              className="w-full p-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:outline-none font-semibold text-zinc-700 dark:text-zinc-300"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active Profile</option>
              <option value="Blocked">Blocked Profile</option>
            </select>
          </div>

          {/* Store Outlet Filter */}
          <div>
            <select
              value={storeId}
              onChange={e => { setStoreId(e.target.value); setCurrentPage(1); }}
              className="w-full p-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:outline-none font-semibold text-zinc-700 dark:text-zinc-300"
            >
              <option value="All">All Stores Outlets</option>
              {mockStores.map(store => (
                <option key={store.id} value={store.id}>{store.name}</option>
              ))}
            </select>
          </div>

          {/* Order Count Filter */}
          <div>
            <select
              value={orderCountFilter}
              onChange={e => { setOrderCountFilter(e.target.value); setCurrentPage(1); }}
              className="w-full p-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:outline-none font-semibold text-zinc-700 dark:text-zinc-300"
            >
              <option value="All">All Orders Volumes</option>
              <option value="1-5">Low Orders (1-5)</option>
              <option value="5-10">Medium Orders (5-10)</option>
              <option value="10+">High Orders (10+)</option>
            </select>
          </div>

        </div>

        {/* Row 2: Date Filters & Action buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase text-zinc-400">Date Joined:</span>
            <div className="flex gap-1">
              {["All", "Today", "This Week", "This Month", "Custom Range"].map(opt => (
                <button
                  key={opt}
                  onClick={() => {
                    setDateFilter(opt);
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all ${dateFilter === opt ? "border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)]" : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-550 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"}`}
                >
                  {opt}
                </button>
              ))}
            </div>

            {/* Custom Range Date inputs */}
            {dateFilter === "Custom Range" && (
              <div className="flex items-center gap-1.5 ml-2 animate-fade-down">
                <input
                  type="date"
                  value={customDateRange.start}
                  onChange={e => setCustomDateRange({ ...customDateRange, start: e.target.value })}
                  className="p-1 text-[10px] border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 rounded text-zinc-800 dark:text-zinc-200 outline-none"
                />
                <span className="text-zinc-400 font-bold">-</span>
                <input
                  type="date"
                  value={customDateRange.end}
                  onChange={e => setCustomDateRange({ ...customDateRange, end: e.target.value })}
                  className="p-1 text-[10px] border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 rounded text-zinc-800 dark:text-zinc-200 outline-none"
                />
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setLocalSearch("");
                setSearch("");
                setCustomerType("All");
                setStatus("All");
                setStoreId("All");
                setOrderCountFilter("All");
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

      {/* Customer Database Table */}
      <section className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs">
        
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[1000px]">
            <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-150 dark:border-zinc-800 text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
              <tr>
                <th className="px-4 py-3 text-center">Avatar</th>
                <th className="px-4 py-3 cursor-pointer select-none" onClick={() => handleSort("fullName")}>
                  <div className="flex items-center gap-1 hover:text-zinc-700 dark:hover:text-zinc-250">
                    Name
                    <ArrowUpDown size={11} />
                  </div>
                </th>
                <th className="px-4 py-3">Mobile</th>
                <th className="px-4 py-3">Email Address</th>
                <th className="px-4 py-3 cursor-pointer select-none" onClick={() => handleSort("customerType")}>
                  <div className="flex items-center gap-1 hover:text-zinc-700 dark:hover:text-zinc-250">
                    Type
                    <ArrowUpDown size={11} />
                  </div>
                </th>
                <th className="px-4 py-3 cursor-pointer select-none text-right" onClick={() => handleSort("totalOrders")}>
                  <div className="flex items-center gap-1 justify-end hover:text-zinc-700 dark:hover:text-zinc-250">
                    Total Orders
                    <ArrowUpDown size={11} />
                  </div>
                </th>
                <th className="px-4 py-3 cursor-pointer select-none text-right" onClick={() => handleSort("totalSpent")}>
                  <div className="flex items-center gap-1 justify-end hover:text-zinc-700 dark:hover:text-zinc-250">
                    Spend (INR)
                    <ArrowUpDown size={11} />
                  </div>
                </th>
                <th className="px-4 py-3 cursor-pointer select-none text-right" onClick={() => handleSort("loyaltyPoints")}>
                  <div className="flex items-center gap-1 justify-end hover:text-zinc-700 dark:hover:text-zinc-250">
                    Points
                    <ArrowUpDown size={11} />
                  </div>
                </th>
                <th className="px-4 py-3">Last Order</th>
                <th className="px-4 py-3 cursor-pointer select-none" onClick={() => handleSort("status")}>
                  <div className="flex items-center gap-1 hover:text-zinc-700 dark:hover:text-zinc-250">
                    Status
                    <ArrowUpDown size={11} />
                  </div>
                </th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={11} className="text-center py-16">
                    <div className="flex items-center justify-center flex-col gap-2">
                      <div className="w-6 h-6 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
                      <p className="text-zinc-400 font-semibold">Updating ledger view...</p>
                    </div>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-16 text-zinc-400 font-semibold italic">
                    No customers found matching current filter matrix.
                  </td>
                </tr>
              ) : (
                customers.map((c, index) => (
                  <tr key={c._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-950/10 transition-colors">
                    
                    {/* Profile Image / initials */}
                    <td className="px-4 py-3 text-center shrink-0">
                      <div 
                        onClick={() => handleActionClick(c, "view")}
                        className="w-8 h-8 mx-auto rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center overflow-hidden cursor-pointer font-bold text-zinc-700 dark:text-zinc-300"
                      >
                        {c.profileImage ? (
                          <img src={c.profileImage} alt={c.fullName} className="w-full h-full object-cover" />
                        ) : (
                          <span>
                            {c.fullName
                              ? c.fullName.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2)
                              : "CU"}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Name */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span 
                          onClick={() => handleActionClick(c, "view")}
                          className="font-bold text-zinc-900 dark:text-white hover:text-[var(--primary)] cursor-pointer transition-colors"
                        >
                          {c.fullName}
                        </span>
                        {c.customerType === "VIP" && (
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping" title="VIP Status" />
                        )}
                      </div>
                    </td>

                    {/* Mobile */}
                    <td className="px-4 py-3 font-semibold text-zinc-550 dark:text-zinc-400">{c.mobile}</td>

                    {/* Email */}
                    <td className="px-4 py-3 text-zinc-500 font-medium truncate max-w-[150px]">{c.email || "N/A"}</td>

                    {/* Type Badge */}
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${c.customerType === "VIP" ? "bg-purple-100 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400" : c.customerType === "New" ? "bg-blue-100 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400" : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"}`}>
                        {c.customerType}
                      </span>
                    </td>

                    {/* Total orders */}
                    <td className="px-4 py-3 text-right font-bold text-zinc-800 dark:text-zinc-200">{c.totalOrders || 0}</td>

                    {/* Lifetime Spent */}
                    <td className="px-4 py-3 text-right font-black text-zinc-900 dark:text-white">₹{(c.totalSpent || 0).toLocaleString('en-IN')}</td>

                    {/* Loyalty Points */}
                    <td className="px-4 py-3 text-right font-black text-amber-600 dark:text-amber-500">{c.loyaltyPoints || 0}</td>

                    {/* Last order date */}
                    <td className="px-4 py-3 font-medium text-zinc-450">{formatDate(c.lastOrderDate)}</td>

                    {/* Status Toggle Switch */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          if (c.status === "Blocked") {
                            handleActionClick(c, "unblock");
                          } else {
                            handleActionClick(c, "block");
                          }
                        }}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${c.status === "Active" ? "bg-emerald-550" : "bg-rose-500"}`}
                      >
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${c.status === "Active" ? "translate-x-4.5" : "translate-x-1"}`} />
                      </button>
                    </td>

                    {/* Action dropdown menu trigger */}
                    <td className="px-4 py-3 text-center relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuIndex(activeMenuIndex === index ? null : index);
                          setActiveCustomer(c);
                        }}
                        className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-250 cursor-pointer"
                      >
                        <MoreVertical size={14} />
                      </button>

                      {/* Dropdown Box */}
                      {activeMenuIndex === index && (
                        <div 
                          ref={menuRef} 
                          className="absolute right-4 mt-1 w-44 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 shadow-xl py-1.5 z-40 text-left font-semibold text-zinc-650 dark:text-zinc-350 animate-in fade-in duration-100"
                        >
                          <button
                            onClick={() => handleActionClick(c, "view")}
                            className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-850"
                          >
                            <Eye size={12} className="text-zinc-400" />
                            <span>View Customer</span>
                          </button>
                          <button
                            onClick={() => handleActionClick(c, "edit")}
                            className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-850"
                          >
                            <Edit size={12} className="text-zinc-400" />
                            <span>Edit Customer</span>
                          </button>
                          <button
                            onClick={() => {
                              setActiveCustomer(c);
                              setShowDrawer(true);
                              // set timeout to switch tabs after drawer renders
                              setTimeout(() => {
                                const drawerTabBtns = document.querySelectorAll('[role="tab"], button[class*="border-b-2"]');
                                if (drawerTabBtns && drawerTabBtns[1]) {
                                  (drawerTabBtns[1]).click();
                                }
                              }, 150);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-850"
                          >
                            <Package size={12} className="text-zinc-400" />
                            <span>Order History</span>
                          </button>
                          <button
                            onClick={() => {
                              setActiveCustomer(c);
                              setShowDrawer(true);
                              setTimeout(() => {
                                const drawerTabBtns = document.querySelectorAll('[role="tab"], button[class*="border-b-2"]');
                                if (drawerTabBtns && drawerTabBtns[2]) {
                                  (drawerTabBtns[2]).click();
                                }
                              }, 150);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-850"
                          >
                            <MapPin size={12} className="text-zinc-400" />
                            <span>Manage Addresses</span>
                          </button>
                          <button
                            onClick={() => {
                              setActiveCustomer(c);
                              setShowDrawer(true);
                              setTimeout(() => {
                                const drawerTabBtns = document.querySelectorAll('[role="tab"], button[class*="border-b-2"]');
                                if (drawerTabBtns && drawerTabBtns[6]) {
                                  (drawerTabBtns[6]).click();
                                }
                              }, 150);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-850 border-b border-zinc-100 dark:border-zinc-800 pb-1.5 mb-1.5"
                          >
                            <ClipboardList size={12} className="text-zinc-400" />
                            <span>Internal Notes</span>
                          </button>

                          {c.status === "Blocked" ? (
                            <button
                              onClick={() => handleActionClick(c, "unblock")}
                              className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-emerald-500/5 text-emerald-600 dark:text-emerald-400"
                            >
                              <ShieldCheck size={12} />
                              <span>Unblock Customer</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleActionClick(c, "block")}
                              className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-rose-500/5 text-rose-500"
                            >
                              <ShieldAlert size={12} />
                              <span>Block Customer</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleActionClick(c, "delete")}
                            className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-rose-500/5 text-rose-500 mt-1 border-t border-zinc-100 dark:border-zinc-800 pt-1.5"
                          >
                            <Trash2 size={12} />
                            <span>Delete Customer</span>
                          </button>
                        </div>
                      )}
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Server Side Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-150 dark:border-zinc-800 flex items-center justify-between flex-col sm:flex-row gap-3 text-[10px] font-bold text-zinc-450 tracking-wider">
            <div className="flex items-center gap-2">
              <span>Showing</span>
              <select
                value={pageSize}
                onChange={e => { setPageSize(parseInt(e.target.value)); setCurrentPage(1); }}
                className="p-1 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 rounded text-zinc-800 dark:text-zinc-200 outline-none text-[10px]"
              >
                <option value={5}>5 Rows</option>
                <option value={10}>10 Rows</option>
                <option value={20}>20 Rows</option>
              </select>
              <span>per page (Total records: {totalCount})</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="px-2.5 py-1.5 rounded-lg border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 disabled:opacity-50 text-zinc-700 dark:text-zinc-300 transition-all flex items-center gap-1"
              >
                <ChevronLeft size={12} />
                <span>Prev</span>
              </button>

              <span>Page {currentPage} of {totalPages}</span>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="px-2.5 py-1.5 rounded-lg border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 disabled:opacity-50 text-zinc-700 dark:text-zinc-300 transition-all flex items-center gap-1"
              >
                <span>Next</span>
                <ChevronRight size={12} />
              </button>
            </div>
          </div>
        )}

      </section>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && activeCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setShowDeleteConfirm(false)} />
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-150 dark:border-zinc-800 shadow-2xl max-w-sm w-full relative z-10 space-y-4 text-center">
            <AlertTriangle className="mx-auto text-rose-500 animate-bounce" size={36} />
            <div>
              <p className="font-extrabold text-sm uppercase text-zinc-800 dark:text-zinc-100">Permanently delete customer?</p>
              <p className="text-[10px] text-zinc-400 mt-1">This will permanently remove {activeCustomer.fullName}'s account profile, transaction ledger, points, and notes from database collections.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 border border-zinc-200 dark:border-zinc-800 font-bold rounded-lg text-zinc-700 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteCustomer(activeCustomer._id);
                  setShowDeleteConfirm(false);
                }}
                className="flex-1 py-2 bg-rose-500 hover:bg-rose-600 font-bold rounded-lg text-white transition-all"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popovers / Modals Wrapper */}
      <ExportCustomersModal
        isOpen={showExport}
        onClose={() => setShowExport(false)}
        onExport={exportCustomers}
      />

      <EditCustomerModal
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        customer={activeCustomer}
        onSave={updateCustomer}
      />

      <BlockCustomerModal
        isOpen={showBlock}
        onClose={() => setShowBlock(false)}
        customer={activeCustomer}
        onBlock={blockCustomer}
      />

      <UnblockCustomerModal
        isOpen={showUnblock}
        onClose={() => setShowUnblock(false)}
        customer={activeCustomer}
        onUnblock={unblockCustomer}
      />

      <AddNoteModal
        isOpen={showAddNote}
        onClose={() => setShowAddNote(false)}
        customerId={activeCustomer?._id}
        onAdd={addNote}
      />

      {/* Drawer Overlay populating Tabs detailed view */}
      <CustomerDrawer
        isOpen={showDrawer}
        onClose={() => setShowDrawer(false)}
        customerId={activeCustomer?._id}
        useCustomersHook={useCustomersHook}
      />

    </div>
  );
}
