import React, { useState, useEffect, useRef } from "react";
import { 
  ShoppingCart, ShieldAlert, Clock, RefreshCw, 
  Download, Search, Filter, MoreVertical, Eye, 
  Edit3, UserCheck, Printer, AlertTriangle, Phone, 
  Trash2, Play, Volume2, Store, Users, IndianRupee, Truck 
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow, isAfter, isBefore } from "date-fns";

// Mock Query hooks & Realtime Simulator
import { 
  useLiveOrders, useOrder, useStores, 
  useDeliveryPartners, simulateNewOrder 
} from "./ordersQuery";

// Modals
import ViewOrderDrawer from "./components/ViewOrderDrawer";
import UpdateStatusModal from "./components/UpdateStatusModal";
import AssignRiderModal from "./components/AssignRiderModal";
import CancelOrderModal from "./components/CancelOrderModal";
import PrintInvoiceModal from "./components/PrintInvoiceModal";
import ContactCustomerModal from "./components/ContactCustomerModal";

export default function LiveOrders() {
  // Filters State
  const [storeId, setStoreId] = useState("all");
  const [status, setStatus] = useState("all");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [riderId, setRiderId] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [localSearch, setLocalSearch] = useState("");
  const [dateRange, setDateRange] = useState("today"); // today, yesterday, week

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Auto Refresh & Sound state
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Active Modals & Triggers
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeModal, setActiveModal] = useState(null); // 'view', 'status', 'rider', 'cancel', 'print', 'contact'
  const [activeDropdownId, setActiveDropdownId] = useState(null);

  const dropdownRef = useRef(null);

  // Debouncing Search Query
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(localSearch);
      setPage(1); // Reset page on search
    }, 350);
    return () => clearTimeout(handler);
  }, [localSearch]);

  // Fetching Data using custom React Query emulators
  const filters = {
    storeId,
    status,
    paymentStatus,
    riderId,
    searchQuery,
  };

  const { data: orders, isLoading, refetch } = useLiveOrders(filters);
  const { data: stores } = useStores();
  const { data: riders } = useDeliveryPartners();

  // Auto Refresh timer emulation
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      refetch();
    }, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [autoRefresh, refetch]);

  // Handle clicking outside action dropdowns to close them
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdownId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Beep Audio synthesiser for real-time order notifications
  const playNotificationBeep = () => {
    if (!soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.value = 880; // A5 note
      gain.gain.value = 0.15;
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      const now = ctx.currentTime;
      osc.start(now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.stop(now + 0.6);
    } catch (e) {
      console.warn("AudioContext not supported or blocked: ", e);
    }
  };

  // Trigger Mock Order Simulation
  const handleSimulateNewOrder = () => {
    const newOrder = simulateNewOrder();
    playNotificationBeep();
    toast.success(`New Live Order received: ${newOrder.orderNumber}`, {
      description: `${newOrder.customer.name} ordered ${newOrder.items[0].productName}`,
      duration: 5000,
    });
  };

  // Reset Filters
  const handleResetFilters = () => {
    setStoreId("all");
    setStatus("all");
    setPaymentStatus("all");
    setRiderId("all");
    setLocalSearch("");
    setSearchQuery("");
    setDateRange("today");
    toast.info("Filters reset to default.");
  };

  // Export Data to CSV
  const handleExport = () => {
    if (orders.length === 0) {
      toast.error("No active orders found to export.");
      return;
    }
    const headers = "Order No,Customer,Store,Amount,Payment Method,Payment Status,Status,Rider,Placed Time\n";
    const csvContent = orders.map((o) => (
      `"${o.orderNumber}","${o.customer.name}","${o.store.name}",${o.pricing.total},"${o.paymentMethod}","${o.paymentStatus}","${o.orderStatus}","${o.deliveryPartner?.name || "Not Assigned"}","${o.placedAt}"`
    )).join("\n");
    
    const blob = new Blob([headers + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `live_orders_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Live orders export file downloaded.");
  };

  // Helper date formatting
  const format = (date, formatStr) => {
    try {
      const d = new Date(date);
      if (formatStr === "yyyyMMdd_HHmmss") {
        return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}_${String(d.getHours()).padStart(2,'0')}${String(d.getMinutes()).padStart(2,'0')}${String(d.getSeconds()).padStart(2,'0')}`;
      }
      return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    } catch {
      return "";
    }
  };

  // Calculate dynamic live KPIs
  const totalActive = orders.filter(o => o.orderStatus !== "Delivered" && o.orderStatus !== "Cancelled").length;
  const totalPreparing = orders.filter(o => o.orderStatus === "Preparing" || o.orderStatus === "Baking").length;
  const totalPacked = orders.filter(o => o.orderStatus === "Packed").length;
  const totalOutForDelivery = orders.filter(o => o.orderStatus === "Out For Delivery").length;
  
  // Avg Prep Time: fixed at 25 mins as required by specs
  const avgPrepTime = "25 mins";

  // Delayed Orders: estimatedDeliveryTime passed and order is active (not delivered/cancelled)
  const totalDelayed = orders.filter(o => {
    const isCompleted = o.orderStatus === "Delivered" || o.orderStatus === "Cancelled";
    const isOverdue = isBefore(new Date(o.estimatedDeliveryTime), new Date());
    return !isCompleted && isOverdue;
  }).length;

  // Pagination logic
  const totalPages = Math.ceil(orders.length / limit) || 1;
  const paginatedOrders = orders.slice((page - 1) * limit, page * limit);

  // Badge styles
  const getPaymentBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "paid": return "bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 border-green-200/50";
      case "pending": return "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border-amber-200/50";
      case "failed": return "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border-rose-200/50";
      default: return "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 border-zinc-200";
    }
  };

  const getOrderStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "pending": return "bg-zinc-105 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-350 border-zinc-200";
      case "confirmed": return "bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border-blue-200/30";
      case "preparing": return "bg-orange-50 text-orange-700 dark:bg-orange-950/20 dark:text-orange-400 border-orange-200/30";
      case "baking": return "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border-amber-200/30";
      case "packed": return "bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400 border-purple-200/30";
      case "ready for pickup": return "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/20 dark:text-cyan-400 border-cyan-200/30";
      case "rider assigned": return "bg-teal-50 text-teal-700 dark:bg-teal-950/20 dark:text-teal-400 border-teal-200/30";
      case "out for delivery": return "bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 border-green-200/30";
      default: return "bg-zinc-100 text-zinc-800 border-zinc-200";
    }
  };

  const isOverdue = (order) => {
    const isCompleted = order.orderStatus === "Delivered" || order.orderStatus === "Cancelled";
    return !isCompleted && isBefore(new Date(order.estimatedDeliveryTime), new Date());
  };

  const handleAction = (modalType, order) => {
    setSelectedOrder(order);
    setActiveModal(modalType);
    setActiveDropdownId(null);
  };

  return (
    <div className="space-y-4 animate-fade-in p-4 min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-850 dark:text-zinc-100">
      
      {/* Header Panel */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-150 dark:border-zinc-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
              Live Orders
            </h1>
            <span className="animate-pulse bg-[var(--primary)]/10 text-[var(--primary)] text-[9px] font-black px-2 py-0.5 rounded-full border border-[var(--primary)]/20 uppercase">
              Realtime active
            </span>
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold mt-0.5">
            Monitor, assign riders, and update active store kitchen pipelines.
          </p>
        </div>

        {/* Action controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Simulation Trigger (Extremely useful for visual demonstration) */}
          <button
            onClick={handleSimulateNewOrder}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-500/10 active:scale-95 transition-all cursor-pointer"
          >
            <Play size={13} className="shrink-0" />
            Simulate New Order
          </button>

          {/* Manual Refresh */}
          <button
            onClick={() => {
              refetch();
              playNotificationBeep();
              toast.success("Orders refreshed manually.");
            }}
            disabled={isLoading}
            className="flex items-center justify-center gap-1 px-3 py-2 bg-white dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg text-xs font-bold shadow-xs transition-all text-zinc-700 dark:text-zinc-250 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw size={13} className={`${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExport}
            className="flex items-center justify-center gap-1 px-3 py-2 bg-white dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg text-xs font-bold shadow-xs transition-all text-zinc-700 dark:text-zinc-250 cursor-pointer"
          >
            <Download size={13} />
            Export
          </button>

          {/* Auto Refresh Toggle */}
          <label className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold text-zinc-700 dark:text-zinc-250 cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 text-[var(--primary)] focus:ring-[var(--primary)]"
            />
            Auto Poll
          </label>

          {/* Sound Notification Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 border rounded-lg hover:scale-105 active:scale-95 transition-all cursor-pointer ${
              soundEnabled 
                ? "bg-[var(--primary)]/10 border-[var(--primary)]/20 text-[var(--primary)]" 
                : "bg-white dark:bg-zinc-850 border-zinc-200 dark:border-zinc-800 text-zinc-400"
            }`}
            title={soundEnabled ? "Sound Alerts Enabled" : "Sound Alerts Muted"}
          >
            <Volume2 size={15} />
          </button>
        </div>
      </header>

      {/* KPI Cards Panel */}
      <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {/* Card 1: Active Orders */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-3 rounded-xl flex items-center justify-between hover:scale-[1.01] transition-transform shadow-xs">
          <div className="min-w-0 space-y-0.5">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Active Orders</span>
            <p className="text-xl font-black text-zinc-900 dark:text-white">{isLoading ? "..." : totalActive}</p>
          </div>
          <div className="p-2 bg-blue-500/10 border border-blue-500/20 text-blue-500 rounded-lg">
            <ShoppingCart size={15} className="stroke-[2.2]" />
          </div>
        </div>

        {/* Card 2: Preparing Orders */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-3 rounded-xl flex items-center justify-between hover:scale-[1.01] transition-transform shadow-xs">
          <div className="min-w-0 space-y-0.5">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Preparing/Baking</span>
            <p className="text-xl font-black text-orange-655 dark:text-orange-400">{isLoading ? "..." : totalPreparing}</p>
          </div>
          <div className="p-2 bg-orange-500/10 border border-orange-500/20 text-orange-500 rounded-lg">
            <Clock size={15} className="stroke-[2.2]" />
          </div>
        </div>

        {/* Card 3: Packed Orders */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-3 rounded-xl flex items-center justify-between hover:scale-[1.01] transition-transform shadow-xs">
          <div className="min-w-0 space-y-0.5">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Packed Orders</span>
            <p className="text-xl font-black text-purple-650 dark:text-purple-400">{isLoading ? "..." : totalPacked}</p>
          </div>
          <div className="p-2 bg-purple-500/10 border border-purple-500/20 text-purple-500 rounded-lg">
            <ShoppingCart size={15} className="stroke-[2.2]" />
          </div>
        </div>

        {/* Card 4: Out For Delivery */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-3 rounded-xl flex items-center justify-between hover:scale-[1.01] transition-transform shadow-xs">
          <div className="min-w-0 space-y-0.5">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Out For Delivery</span>
            <p className="text-xl font-black text-green-600 dark:text-green-400">{isLoading ? "..." : totalOutForDelivery}</p>
          </div>
          <div className="p-2 bg-green-500/10 border border-green-500/20 text-green-500 rounded-lg">
            <ShoppingCart size={15} className="stroke-[2.2]" />
          </div>
        </div>

        {/* Card 5: Avg Preparation Time */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-3 rounded-xl flex items-center justify-between hover:scale-[1.01] transition-transform shadow-xs">
          <div className="min-w-0 space-y-0.5">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Avg Prep Time</span>
            <p className="text-xl font-black text-indigo-600 dark:text-indigo-400">{avgPrepTime}</p>
          </div>
          <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 rounded-lg">
            <Clock size={15} className="stroke-[2.2]" />
          </div>
        </div>

        {/* Card 6: Delayed Orders */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-3 rounded-xl flex items-center justify-between hover:scale-[1.01] transition-transform shadow-xs">
          <div className="min-w-0 space-y-0.5">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Delayed Orders</span>
            <p className="text-xl font-black text-rose-600 dark:text-rose-400">{isLoading ? "..." : totalDelayed}</p>
          </div>
          <div className="p-2 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-lg">
            <ShieldAlert size={15} className="stroke-[2.2]" />
          </div>
        </div>
      </section>

      {/* Sticky Filter Section */}
      <section className="sticky top-16 z-20 bg-white dark:bg-zinc-900 p-3.5 rounded-xl border border-zinc-150 dark:border-zinc-800 shadow-xs flex flex-wrap items-center gap-3">
        {/* Search Order Number (top search/filter) */}
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-2.5 text-zinc-400" size={13} />
          <input
            type="text"
            placeholder="Search order number or client..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
          />
        </div>

        {/* Store Dropdown */}
        <div className="flex flex-col min-w-[130px]">
          <select
            value={storeId}
            onChange={(e) => { setStoreId(e.target.value); setPage(1); }}
            className="text-xs p-2 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 rounded-xl font-bold focus:outline-none cursor-pointer"
          >
            <option value="all">All Stores</option>
            {stores?.map((s) => (
              <option key={s.storeId} value={s.storeId}>
                {s.storeName.split(" - ")[0]}
              </option>
            ))}
          </select>
        </div>

        {/* Status Dropdown */}
        <div className="flex flex-col min-w-[130px]">
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="text-xs p-2 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 rounded-xl font-bold focus:outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Preparing">Preparing</option>
            <option value="Baking">Baking</option>
            <option value="Packed">Packed</option>
            <option value="Ready For Pickup">Ready For Pickup</option>
            <option value="Rider Assigned">Rider Assigned</option>
            <option value="Out For Delivery">Out For Delivery</option>
          </select>
        </div>

        {/* Payment Status Dropdown */}
        <div className="flex flex-col min-w-[130px]">
          <select
            value={paymentStatus}
            onChange={(e) => { setPaymentStatus(e.target.value); setPage(1); }}
            className="text-xs p-2 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 rounded-xl font-bold focus:outline-none cursor-pointer"
          >
            <option value="all">All Payments</option>
            <option value="Pending">Pending</option>
            <option value="Paid">Paid</option>
            <option value="Failed">Failed</option>
          </select>
        </div>

        {/* Delivery Partner Dropdown */}
        <div className="flex flex-col min-w-[130px]">
          <select
            value={riderId}
            onChange={(e) => { setRiderId(e.target.value); setPage(1); }}
            className="text-xs p-2 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 rounded-xl font-bold focus:outline-none cursor-pointer"
          >
            <option value="all">All Riders</option>
            <option value="unassigned">Not Assigned</option>
            {riders?.map((r) => (
              <option key={r.riderId} value={r.riderId}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date presets */}
        <div className="flex items-center bg-zinc-50 dark:bg-zinc-955 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
          {["today", "yesterday", "week"].map((preset) => (
            <button
              key={preset}
              onClick={() => { setDateRange(preset); setPage(1); }}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-md capitalize transition-all ${
                dateRange === preset 
                  ? "bg-[var(--primary)] text-white shadow-xs" 
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              {preset}
            </button>
          ))}
        </div>

        {/* Reset filters button */}
        <button
          onClick={handleResetFilters}
          className="px-3.5 py-2 text-xs font-bold bg-zinc-50 dark:bg-zinc-850 hover:bg-zinc-100 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-700 dark:text-zinc-250 cursor-pointer shadow-xs transition-colors"
        >
          Reset Filters
        </button>
      </section>

      {/* Main Table View */}
      <section className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-xl shadow-xs overflow-hidden flex flex-col">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-55 dark:bg-zinc-950/20 text-zinc-500 font-bold border-b border-zinc-150 dark:border-zinc-800">
                <th className="p-3.5 text-center" style={{ width: "100px" }}>Order No</th>
                <th className="p-3.5">Customer</th>
                <th className="p-3.5">Store</th>
                <th className="p-3.5">Amount</th>
                <th className="p-3.5">Payment</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">ETA</th>
                <th className="p-3.5">Rider</th>
                <th className="p-3.5 text-center" style={{ width: "80px" }}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850">
              {isLoading ? (
                // Skeletons
                Array.from({ length: limit }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="p-4"><div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded w-16 mx-auto" /></td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-zinc-100 dark:bg-zinc-800" />
                        <div className="space-y-1">
                          <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded w-24" />
                          <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded w-16" />
                        </div>
                      </div>
                    </td>
                    <td className="p-4"><div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded w-20" /></td>
                    <td className="p-4"><div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded w-12" /></td>
                    <td className="p-4"><div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg w-16" /></td>
                    <td className="p-4"><div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg w-20" /></td>
                    <td className="p-4"><div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded w-14" /></td>
                    <td className="p-4"><div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded w-16" /></td>
                    <td className="p-4"><div className="h-7 bg-zinc-100 dark:bg-zinc-800 rounded-lg w-7 mx-auto" /></td>
                  </tr>
                ))
              ) : paginatedOrders.length > 0 ? (
                paginatedOrders.map((order) => {
                  const overdue = isOverdue(order);
                  return (
                    <tr 
                      key={order.id} 
                      className={`hover:bg-zinc-50/50 dark:hover:bg-zinc-950/20 group transition-colors ${
                        overdue ? "bg-rose-50/5 dark:bg-rose-950/5" : ""
                      }`}
                    >
                      {/* Order Number (Clickable opens Drawer) */}
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleAction("view", order)}
                          className="font-bold text-zinc-900 dark:text-zinc-150 hover:text-[var(--primary)] dark:hover:text-[var(--primary)] hover:underline focus:outline-none cursor-pointer"
                        >
                          {order.orderNumber}
                        </button>
                      </td>

                      {/* Customer details */}
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <img 
                            src={order.customer.avatar} 
                            alt={order.customer.name} 
                            className="w-7 h-7 rounded-full object-cover border border-zinc-100 dark:border-zinc-800"
                          />
                          <div className="leading-tight">
                            <p className="font-bold text-zinc-900 dark:text-zinc-105">{order.customer.name}</p>
                            <p className="text-[10px] text-zinc-400 font-semibold">{order.customer.phone}</p>
                          </div>
                        </div>
                      </td>

                      {/* Store */}
                      <td className="p-3 font-semibold text-zinc-700 dark:text-zinc-300">
                        {order.store.name.split(",")[0]}
                      </td>

                      {/* Amount */}
                      <td className="p-3 font-extrabold text-zinc-950 dark:text-white flex items-center mt-1.5">
                        <IndianRupee size={11} className="mr-0.5 shrink-0" />
                        {order.pricing.total.toFixed(2)}
                      </td>

                      {/* Payment method + badge */}
                      <td className="p-3 space-y-0.5">
                        <span className="font-bold text-[10px] text-zinc-400 block">{order.paymentMethod}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${getPaymentBadge(order.paymentStatus)}`}>
                          {order.paymentStatus}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="p-3">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${getOrderStatusBadge(order.orderStatus)}`}>
                          {order.orderStatus}
                        </span>
                      </td>

                      {/* ETA Countdown */}
                      <td className="p-3 font-semibold">
                        {order.orderStatus === "Delivered" ? (
                          <span className="text-emerald-600 font-bold text-[10px]">Delivered</span>
                        ) : order.orderStatus === "Cancelled" ? (
                          <span className="text-rose-500 font-bold text-[10px]">Cancelled</span>
                        ) : overdue ? (
                          <span className="text-rose-600 font-bold text-[10px] animate-pulse">
                            Overdue
                          </span>
                        ) : (
                          <span className="text-zinc-600 dark:text-zinc-300 text-[10px]">
                            {formatDistanceToNow(new Date(order.estimatedDeliveryTime), { addSuffix: false })}
                          </span>
                        )}
                      </td>

                      {/* Rider */}
                      <td className="p-3 font-bold text-[10px] text-zinc-800 dark:text-zinc-200">
                        {order.deliveryPartner ? (
                          <div className="flex items-center gap-1">
                            <Truck size={10} className="text-teal-500" />
                            {order.deliveryPartner.name}
                          </div>
                        ) : (
                          <span className="text-zinc-400 italic">Not Assigned</span>
                        )}
                      </td>

                      {/* Actions drop-down */}
                      <td className="p-3 text-center relative">
                        <button
                          onClick={() => setActiveDropdownId(activeDropdownId === order.id ? null : order.id)}
                          className="p-1 rounded-lg border border-zinc-200 dark:border-zinc-805 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-500 dark:text-zinc-400 cursor-pointer"
                        >
                          <MoreVertical size={14} />
                        </button>

                        {activeDropdownId === order.id && (
                          <div 
                            ref={dropdownRef}
                            className="absolute right-3 top-10 w-44 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg py-1 z-40 animate-fade-down"
                          >
                            <button
                              onClick={() => handleAction("view", order)}
                              className="w-full text-left px-3 py-1.5 text-[10px] font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-55 dark:hover:bg-zinc-900 flex items-center gap-1.5"
                            >
                              <Eye size={12} className="text-zinc-400" />
                              View Order
                            </button>
                            <button
                              onClick={() => handleAction("status", order)}
                              className="w-full text-left px-3 py-1.5 text-[10px] font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-55 dark:hover:bg-zinc-900 flex items-center gap-1.5"
                            >
                              <Edit3 size={12} className="text-zinc-400" />
                              Update Status
                            </button>
                            <button
                              onClick={() => handleAction("rider", order)}
                              className="w-full text-left px-3 py-1.5 text-[10px] font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-55 dark:hover:bg-zinc-900 flex items-center gap-1.5"
                            >
                              <UserCheck size={12} className="text-zinc-400" />
                              Assign Rider
                            </button>
                            <button
                              onClick={() => handleAction("print", order)}
                              className="w-full text-left px-3 py-1.5 text-[10px] font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-55 dark:hover:bg-zinc-900 flex items-center gap-1.5"
                            >
                              <Printer size={12} className="text-zinc-400" />
                              Print Invoice
                            </button>
                            <button
                              onClick={() => handleAction("contact", order)}
                              className="w-full text-left px-3 py-1.5 text-[10px] font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-55 dark:hover:bg-zinc-900 flex items-center gap-1.5"
                            >
                              <Phone size={12} className="text-zinc-400" />
                              Contact Customer
                            </button>
                            <div className="border-t border-zinc-100 dark:border-zinc-900 my-1" />
                            <button
                              onClick={() => handleAction("cancel", order)}
                              className="w-full text-left px-3 py-1.5 text-[10px] font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/15 flex items-center gap-1.5"
                            >
                              <Trash2 size={12} className="text-rose-500" />
                              Cancel Order
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-zinc-400">
                    <div className="space-y-2.5">
                      {/* Empty state illustration */}
                      <svg className="mx-auto h-16 w-16 text-zinc-305 dark:text-zinc-800 stroke-[1.2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <p className="text-xs font-bold text-zinc-500">No active orders match current filters.</p>
                      <p className="text-[10px] text-zinc-400">Try adjusting your filter selectors or searching a different term.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Server-Side Pagination Bar */}
        <footer className="p-3.5 border-t border-zinc-150 dark:border-zinc-800 bg-zinc-55/30 dark:bg-zinc-950/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shrink-0 font-semibold text-zinc-500">
          <div className="flex items-center gap-2">
            <span>Show rows:</span>
            <select
              value={limit}
              onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
              className="text-xs py-1 px-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-lg focus:outline-none cursor-pointer font-bold"
            >
              <option value={10}>10 rows</option>
              <option value={20}>20 rows</option>
              <option value={50}>50 rows</option>
            </select>
            <span>Showing {(page - 1) * limit + 1} - {Math.min(page * limit, orders.length)} of {orders.length} active orders</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="px-2.5 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-250 transition-colors"
            >
              Previous
            </button>
            <span className="font-bold">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="px-2.5 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-250 transition-colors"
            >
              Next
            </button>
          </div>
        </footer>
      </section>

      {/* RENDER MODALS & SLIDE DRAWERS */}
      
      {/* 1. View Order Drawer */}
      <ViewOrderDrawer
        isOpen={activeModal === "view"}
        onClose={() => { setActiveModal(null); setSelectedOrder(null); }}
        order={selectedOrder}
      />

      {/* 2. Update Status Modal */}
      <UpdateStatusModal
        isOpen={activeModal === "status"}
        onClose={() => { setActiveModal(null); setSelectedOrder(null); }}
        order={selectedOrder}
      />

      {/* 3. Assign Rider Modal */}
      <AssignRiderModal
        isOpen={activeModal === "rider"}
        onClose={() => { setActiveModal(null); setSelectedOrder(null); }}
        order={selectedOrder}
      />

      {/* 4. Cancel Order Modal */}
      <CancelOrderModal
        isOpen={activeModal === "cancel"}
        onClose={() => { setActiveModal(null); setSelectedOrder(null); }}
        order={selectedOrder}
      />

      {/* 5. Print Invoice Modal */}
      <PrintInvoiceModal
        isOpen={activeModal === "print"}
        onClose={() => { setActiveModal(null); setSelectedOrder(null); }}
        order={selectedOrder}
      />

      {/* 6. Contact Customer Modal */}
      <ContactCustomerModal
        isOpen={activeModal === "contact"}
        onClose={() => { setActiveModal(null); setSelectedOrder(null); }}
        customer={selectedOrder?.customer}
      />

    </div>
  );
}
