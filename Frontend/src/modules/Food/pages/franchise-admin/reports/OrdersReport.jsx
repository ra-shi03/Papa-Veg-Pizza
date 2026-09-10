import React, { useState } from "react";
import { 
  ShoppingBag, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Truck, 
  DollarSign, 
  RefreshCw, 
  Filter, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  ChevronLeft, 
  ChevronRight, 
  FileSpreadsheet, 
  FileText, 
  Eye, 
  Receipt,
  TrendingUp,
  Store,
  Calendar,
  AlertCircle
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
  Cell
} from "recharts";

import { 
  useOrderDashboard,
  useOrderStatusDistribution,
  useOrderHourlyHeatmap,
  useOrderTypeDistribution,
  useOrderStorePerformance,
  useDetailedOrderReports,
  useDebounce
} from "./hooks/useOrdersReport";
import { useStoresDropdown } from "./hooks/useSalesReport";

import GenerateOrderReportModal from "./components/GenerateOrderReportModal";
import OrderDetailModal from "./components/OrderDetailModal";
import ExportInvoiceModal from "./components/ExportInvoiceModal";
import { toast } from "sonner";

export default function OrdersReport() {
  // Filter States
  const [dateRange, setDateRange] = useState("This Month");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [selectedStore, setSelectedStore] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedOrderType, setSelectedOrderType] = useState("All");
  const [filtersOpen, setFiltersOpen] = useState(true);

  // Active filters passed to APIs
  const [activeFilters, setActiveFilters] = useState({
    startDate: "",
    endDate: "",
    storeId: "all",
    status: "All",
    orderType: "All"
  });

  // Table Search and Sorting/Pagination States
  const [orderSearch, setOrderSearch] = useState("");
  const debouncedOrderSearch = useDebounce(orderSearch, 400);
  const [orderPage, setOrderPage] = useState(1);
  const [orderSortField, setOrderSortField] = useState("createdAt");
  const [orderSortOrder, setOrderSortOrder] = useState("desc");

  // Modals state
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [detailOrderId, setDetailOrderId] = useState(null);
  const [invoiceOrderId, setInvoiceOrderId] = useState(null);

  // API Queries
  const { data: storesList } = useStoresDropdown();
  const { data: dashboardData, isLoading: isDashboardLoading, isError: isDashboardError, refetch: refetchDashboard } = useOrderDashboard(activeFilters);
  const { data: statusDistribution, isLoading: isStatusLoading, isError: isStatusError, refetch: refetchStatus } = useOrderStatusDistribution(activeFilters);
  const { data: hourlyHeatmap, isLoading: isHourlyLoading, isError: isHourlyError, refetch: refetchHourly } = useOrderHourlyHeatmap(activeFilters);
  const { data: typeDistribution, isLoading: isTypeLoading, isError: isTypeError, refetch: refetchType } = useOrderTypeDistribution(activeFilters);
  const { data: storePerformance, isLoading: isStorePerformanceLoading, isError: isStorePerformanceError, refetch: refetchStorePerformance } = useOrderStorePerformance(activeFilters);
  
  const ordersLimit = 5;
  const { data: ordersListData, isLoading: isOrdersListLoading, isError: isOrdersListError, refetch: refetchOrdersList } = useDetailedOrderReports({
    search: debouncedOrderSearch,
    page: orderPage,
    limit: ordersLimit,
    sortBy: orderSortField,
    sortOrder: orderSortOrder,
    status: activeFilters.status,
    orderType: activeFilters.orderType,
    storeId: activeFilters.storeId
  });

  // Apply filters handler
  const handleApplyFilters = () => {
    let start = "";
    let end = "";
    const today = new Date().toISOString().split("T")[0];

    if (dateRange === "Today") {
      start = today;
      end = today;
    } else if (dateRange === "Yesterday") {
      const yest = new Date();
      yest.setDate(yest.getDate() - 1);
      start = yest.toISOString().split("T")[0];
      end = yest.toISOString().split("T")[0];
    } else if (dateRange === "This Week") {
      const prevWeek = new Date();
      prevWeek.setDate(prevWeek.getDate() - 7);
      start = prevWeek.toISOString().split("T")[0];
      end = today;
    } else if (dateRange === "This Month") {
      const prevMonth = new Date();
      prevMonth.setMonth(prevMonth.getMonth() - 1);
      start = prevMonth.toISOString().split("T")[0];
      end = today;
    } else {
      start = customStartDate;
      end = customEndDate;
    }

    setActiveFilters({
      startDate: start,
      endDate: end,
      storeId: selectedStore,
      status: selectedStatus,
      orderType: selectedOrderType
    });
    setOrderPage(1);
    toast.success("Filters applied successfully.");
  };

  // Reset Filters
  const handleResetFilters = () => {
    setDateRange("This Month");
    setCustomStartDate("");
    setCustomEndDate("");
    setSelectedStore("all");
    setSelectedStatus("All");
    setSelectedOrderType("All");
    setActiveFilters({
      startDate: "",
      endDate: "",
      storeId: "all",
      status: "All",
      orderType: "All"
    });
    setOrderPage(1);
    toast.success("Filters reset to default.");
  };

  // Refresh All API Data
  const handleRefreshAll = () => {
    refetchDashboard();
    refetchStatus();
    refetchHourly();
    refetchType();
    refetchStorePerformance();
    refetchOrdersList();
    toast.success("Refreshing dashboard data...");
  };

  // Export actions on page level
  const handlePageExport = (type) => {
    if (!ordersListData?.orders || ordersListData.orders.length === 0) {
      toast.error("No orders data available to export");
      return;
    }
    toast.success(`Exporting order logs as ${type}...`);
    
    let content = "";
    if (type === "Excel") {
      content = "Order Number,Customer Name,Store Name,Amount,Order Type,Status,Delivery Time (mins),Created At\n" +
        ordersListData.orders.map(o => `"${o.orderNumber}","${o.customerName}","${o.storeName}",₹${o.amount},"${o.orderType}","${o.status}",${o.deliveryTime},"${o.createdAt}"`).join("\n");
      const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `order-report-logs.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      content = `
Papa Veg Pizza Order Report Log
Generated At: ${new Date().toLocaleString()}
------------------------------------------------------
${ordersListData.orders.map(o => `
Order Number: ${o.orderNumber}
Customer: ${o.customerName}
Store: ${o.storeName}
Amount: ₹${o.amount} | Type: ${o.orderType}
Status: ${o.status} | Delivery Duration: ${o.deliveryTime} mins
Placed Date: ${new Date(o.createdAt).toLocaleString()}
`).join("\n------------------------------------------------------\n")}
`;
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `order-report-logs.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Sort handler
  const handleSort = (field) => {
    if (orderSortField === field) {
      setOrderSortOrder(orderSortOrder === "asc" ? "desc" : "asc");
    } else {
      setOrderSortField(field);
      setOrderSortOrder("desc");
    }
    setOrderPage(1);
  };

  // Heatmap matrix details
  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const HOURS = [11, 12, 13, 14, 18, 19, 20, 21];

  // Helper to lookup orders in hourly Heatmap
  const getOrdersForSlot = (day, hour) => {
    if (!hourlyHeatmap) return 0;
    const match = hourlyHeatmap.find(item => item.day === day && item.hour === hour);
    return match ? match.totalOrders : 0;
  };

  const maxHeatmapValue = hourlyHeatmap ? Math.max(...hourlyHeatmap.map(h => h.totalOrders), 1) : 1;

  // Chart Color Schemes
  const PIE_COLORS = ["var(--primary)", "var(--sa-secondary, #3b82f6)", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#6b7280"];
  const BAR_COLORS = ["var(--primary)", "var(--sa-secondary, #3b82f6)", "#10b981"];

  // Helper status badge styles
  const getStatusBadge = (status) => {
    const s = status.toLowerCase();
    if (s === "delivered") {
      return "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400";
    }
    if (s === "cancelled" || s === "refunded") {
      return "bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400";
    }
    if (s === "preparing" || s === "baking" || s === "packed") {
      return "bg-orange-50 text-orange-600 dark:bg-orange-950/20 dark:text-orange-400";
    }
    return "bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400";
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-850 dark:text-zinc-250 transition-all duration-300 text-xs">
      
      {/* Modal overlays */}
      <GenerateOrderReportModal isOpen={isGenerateOpen} onClose={() => setIsGenerateOpen(false)} />
      
      {detailOrderId && (
        <OrderDetailModal 
          isOpen={!!detailOrderId} 
          orderId={detailOrderId} 
          onClose={() => setDetailOrderId(null)} 
          onExportInvoice={(id) => {
            setDetailOrderId(null);
            setInvoiceOrderId(id);
          }}
        />
      )}

      {invoiceOrderId && (
        <ExportInvoiceModal
          isOpen={!!invoiceOrderId}
          orderId={invoiceOrderId}
          onClose={() => setInvoiceOrderId(null)}
        />
      )}

      {/* Page Content Wrapper */}
      <div className="p-3 md:p-5 space-y-4">
        
        {/* Page Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-150 dark:border-zinc-850 shadow-xs">
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
              Order Reports
            </h1>
            <p className="text-[10px] text-zinc-400 font-bold mt-0.5">
              Analyze order operations, delivery efficiency, and customer ordering patterns.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-center">
            <button
              onClick={() => setIsGenerateOpen(true)}
              className="px-3.5 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-black rounded-lg shadow-md flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <FileText size={13} />
              <span>Generate Report</span>
            </button>
            <button 
              onClick={() => handlePageExport("PDF")}
              className="px-2.5 py-2 border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 font-bold rounded-lg shadow-sm flex items-center gap-1 cursor-pointer text-slate-800 dark:text-zinc-200"
            >
              <FileText size={12} className="text-rose-500" />
              <span className="hidden sm:inline">Export PDF</span>
            </button>
            <button 
              onClick={() => handlePageExport("Excel")}
              className="px-2.5 py-2 border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 font-bold rounded-lg shadow-sm flex items-center gap-1 cursor-pointer text-slate-800 dark:text-zinc-200"
            >
              <FileSpreadsheet size={12} className="text-emerald-500" />
              <span className="hidden sm:inline">Export Excel</span>
            </button>
            <button
              onClick={handleRefreshAll}
              className="p-2 border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg shadow-sm cursor-pointer text-zinc-500 dark:text-zinc-400"
              title="Refresh Data"
            >
              <RefreshCw size={13} />
            </button>
          </div>
        </header>

        {/* Filters Panel */}
        <section className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 rounded-xl shadow-xs overflow-hidden">
          <div 
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="p-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/30 cursor-pointer select-none"
          >
            <div className="flex items-center gap-1.5">
              <Filter size={13} className="text-[var(--primary)]" />
              <h2 className="font-extrabold text-slate-900 dark:text-white">Filters Panel</h2>
            </div>
            {filtersOpen ? <ChevronUp size={14} className="opacity-60" /> : <ChevronDown size={14} className="opacity-60" />}
          </div>

          {filtersOpen && (
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                {/* Date range picker */}
                <div className="space-y-1">
                  <label className="block text-zinc-400 font-bold">Date Range</label>
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="w-full px-2.5 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-lg text-slate-800 dark:text-zinc-250 cursor-pointer"
                  >
                    <option value="Today">Today</option>
                    <option value="Yesterday">Yesterday</option>
                    <option value="This Week">This Week</option>
                    <option value="This Month">This Month</option>
                    <option value="Custom">Custom Range</option>
                  </select>
                </div>

                {/* Custom Start/End Dates */}
                {dateRange === "Custom" && (
                  <>
                    <div className="space-y-1">
                      <label className="block text-zinc-400 font-bold">Start Date</label>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="w-full px-2.5 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-lg text-slate-800 dark:text-zinc-250 focus:outline-none focus:border-[var(--primary)]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-zinc-400 font-bold">End Date</label>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="w-full px-2.5 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-lg text-slate-800 dark:text-zinc-250 focus:outline-none focus:border-[var(--primary)]"
                      />
                    </div>
                  </>
                )}

                {/* Target Store filter */}
                <div className="space-y-1">
                  <label className="block text-zinc-400 font-bold">Store Location</label>
                  <select
                    value={selectedStore}
                    onChange={(e) => setSelectedStore(e.target.value)}
                    className="w-full px-2.5 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-lg text-slate-800 dark:text-zinc-250 cursor-pointer"
                  >
                    <option value="all">All Stores</option>
                    {storesList?.map(s => (
                      <option key={s.storeId} value={s.storeId}>{s.storeName}</option>
                    ))}
                  </select>
                </div>

                {/* Order Status filter */}
                <div className="space-y-1">
                  <label className="block text-zinc-400 font-bold">Order Status</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-2.5 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-lg text-slate-800 dark:text-zinc-250 cursor-pointer"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Preparing">Preparing</option>
                    <option value="Baking">Baking</option>
                    <option value="Packed">Packed</option>
                    <option value="Out For Delivery">Out For Delivery</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Refunded">Refunded</option>
                  </select>
                </div>

                {/* Order Type filter */}
                <div className="space-y-1">
                  <label className="block text-zinc-400 font-bold">Order Type</label>
                  <select
                    value={selectedOrderType}
                    onChange={(e) => setSelectedOrderType(e.target.value)}
                    className="w-full px-2.5 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-lg text-slate-800 dark:text-zinc-250 cursor-pointer"
                  >
                    <option value="All">All Types</option>
                    <option value="Delivery">Delivery</option>
                    <option value="Takeaway">Takeaway</option>
                    <option value="Dine-In">Dine-In</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-855">
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg font-bold cursor-pointer text-zinc-800 dark:text-zinc-200"
                >
                  Reset Defaults
                </button>
                <button
                  onClick={handleApplyFilters}
                  className="px-4 py-2 text-white font-black rounded-lg shadow-md bg-[var(--primary)] hover:bg-[var(--primary-hover)] cursor-pointer"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Dashboard KPI Summary Cards */}
        {isDashboardLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-850 rounded-xl animate-pulse space-y-2">
                <div className="h-3 w-16 bg-zinc-150 dark:bg-zinc-800 rounded" />
                <div className="h-6 w-24 bg-zinc-200 dark:bg-zinc-750 rounded" />
              </div>
            ))}
          </div>
        ) : isDashboardError ? (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-4 rounded-xl flex items-center gap-2 text-red-600">
            <AlertCircle size={16} />
            <span className="font-bold">Failed to load dashboard metrics.</span>
            <button onClick={refetchDashboard} className="underline font-black ml-auto cursor-pointer">Retry</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            
            {/* Total Orders Card */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-4 rounded-xl shadow-xs flex flex-col justify-between">
              <span className="text-[10px] text-zinc-400 font-extrabold uppercase">Total Orders</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-lg font-black text-slate-900 dark:text-white">{dashboardData.totalOrders?.toLocaleString()}</span>
                <span className="p-1 rounded-md bg-zinc-100 dark:bg-zinc-800">
                  <ShoppingBag size={12} className="text-[var(--primary)]" />
                </span>
              </div>
            </div>

            {/* Completed Orders Card */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-4 rounded-xl shadow-xs flex flex-col justify-between">
              <span className="text-[10px] text-zinc-400 font-extrabold uppercase">Completed</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-lg font-black text-slate-900 dark:text-white">{dashboardData.completedOrders?.toLocaleString()}</span>
                <span className="p-1 rounded-md bg-zinc-100 dark:bg-zinc-800">
                  <CheckCircle2 size={12} className="text-emerald-500" />
                </span>
              </div>
            </div>

            {/* Cancelled/Refunded Card */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-4 rounded-xl shadow-xs flex flex-col justify-between">
              <span className="text-[10px] text-zinc-400 font-extrabold uppercase">Cancelled / Refunded</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-lg font-black text-slate-900 dark:text-white">{(dashboardData.cancelledOrders + dashboardData.refundedOrders)?.toLocaleString()}</span>
                <span className="p-1 rounded-md bg-zinc-100 dark:bg-zinc-800">
                  <XCircle size={12} className="text-rose-500" />
                </span>
              </div>
            </div>

            {/* Prep Time Card */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-4 rounded-xl shadow-xs flex flex-col justify-between">
              <span className="text-[10px] text-zinc-400 font-extrabold uppercase">Avg preparation time</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-lg font-black text-slate-900 dark:text-white">{dashboardData.averagePreparationTime}m</span>
                <span className="p-1 rounded-md bg-zinc-100 dark:bg-zinc-800">
                  <Clock size={12} className="text-amber-500" />
                </span>
              </div>
            </div>

            {/* Delivery Time Card */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-4 rounded-xl shadow-xs flex flex-col justify-between">
              <span className="text-[10px] text-zinc-400 font-extrabold uppercase">Avg delivery time</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-lg font-black text-slate-900 dark:text-white">{dashboardData.averageDeliveryTime}m</span>
                <span className="p-1 rounded-md bg-zinc-100 dark:bg-zinc-800">
                  <Truck size={12} className="text-blue-500" />
                </span>
              </div>
            </div>

            {/* Average Order Value Card */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-4 rounded-xl shadow-xs flex flex-col justify-between">
              <span className="text-[10px] text-zinc-400 font-extrabold uppercase">Avg order value (AOV)</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-lg font-black text-slate-900 dark:text-white">₹{dashboardData.averageOrderValue?.toFixed(2)}</span>
                <span className="p-1 rounded-md bg-zinc-100 dark:bg-zinc-800">
                  <DollarSign size={12} className="text-purple-500" />
                </span>
              </div>
            </div>

          </div>
        )}

        {/* Charts: Status Split, Type Split */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* Order Status Distribution (Pie Chart) */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-4 rounded-xl shadow-xs flex flex-col justify-between min-h-[320px]">
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1">
                <TrendingUp size={14} className="text-[var(--primary)]" />
                Order Status Distribution
              </h3>
              <p className="text-[9px] text-zinc-400 font-semibold mt-0.5">Summary of order stages</p>
            </div>

            {isStatusLoading ? (
              <div className="flex-grow flex items-center justify-center h-48">
                <RefreshCw size={24} className="animate-spin text-[var(--primary)]" />
              </div>
            ) : isStatusError ? (
              <div className="flex-grow flex flex-col items-center justify-center py-6 text-red-500">
                <span>Failed to load status distribution.</span>
                <button onClick={refetchStatus} className="underline text-xs mt-1 cursor-pointer">Retry</button>
              </div>
            ) : (
              <>
                <div className="w-full h-[185px] flex items-center justify-center">
                  <div className="w-[180px] h-[180px]">
                    <PieChart width={180} height={180}>
                      <Pie
                        data={[
                          { name: "Delivered", value: statusDistribution.delivered },
                          { name: "Cancelled", value: statusDistribution.cancelled },
                          { name: "Refunded", value: statusDistribution.refunded },
                          { name: "Preparing", value: statusDistribution.preparing },
                          { name: "Baking", value: statusDistribution.baking },
                          { name: "Out for Delivery", value: statusDistribution.outForDelivery },
                          { name: "Pending / Confirm", value: statusDistribution.pending + statusDistribution.confirmed }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {[0, 1, 2, 3, 4, 5, 6].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(val) => `${val} Orders`} contentStyle={{ fontSize: "9px" }} />
                    </PieChart>
                  </div>
                </div>

                {/* Status Breakdown Legend Grid */}
                <div className="grid grid-cols-3 gap-1.5 text-[9px] font-bold">
                  {[
                    { name: "Delivered", val: statusDistribution.delivered, color: PIE_COLORS[0] },
                    { name: "Cancelled", val: statusDistribution.cancelled, color: PIE_COLORS[1] },
                    { name: "Refunded", val: statusDistribution.refunded, color: PIE_COLORS[2] },
                    { name: "Preparing", val: statusDistribution.preparing, color: PIE_COLORS[3] },
                    { name: "Baking", val: statusDistribution.baking, color: PIE_COLORS[4] },
                    { name: "Pending", val: statusDistribution.pending + statusDistribution.confirmed, color: PIE_COLORS[6] }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-zinc-500 dark:text-zinc-400 truncate">{item.name}:</span>
                      <span className="text-slate-900 dark:text-white font-black">{item.val}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Order Type Distribution (Bar Chart) */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-4 rounded-xl shadow-xs flex flex-col justify-between min-h-[320px]">
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1">
                <ShoppingBag size={14} className="text-[var(--primary)]" />
                Order Type Distribution
              </h3>
              <p className="text-[9px] text-zinc-400 font-semibold mt-0.5">Breakdown of delivery, takeaway, and dine-in</p>
            </div>

            {isTypeLoading ? (
              <div className="flex-grow flex items-center justify-center h-48">
                <RefreshCw size={24} className="animate-spin text-[var(--primary)]" />
              </div>
            ) : isTypeError ? (
              <div className="flex-grow flex flex-col items-center justify-center py-6 text-red-500">
                <span>Failed to load order type split.</span>
                <button onClick={refetchType} className="underline text-xs mt-1 cursor-pointer">Retry</button>
              </div>
            ) : (
              <div className="w-full h-[220px] overflow-x-auto scrollbar-thin">
                <div className="w-[450px] h-[210px]">
                  <BarChart
                    width={450}
                    height={210}
                    data={[
                      { name: "Delivery", orders: typeDistribution.delivery },
                      { name: "Takeaway", orders: typeDistribution.takeaway },
                      { name: "Dine-In", orders: typeDistribution.dineIn }
                    ]}
                    margin={{ top: 15, right: 10, left: -25, bottom: 0 }}
                    barSize={40}
                  >
                    <XAxis dataKey="name" stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                    <RechartsTooltip contentStyle={{ fontSize: "9px" }} />
                    <Bar dataKey="orders" name="Orders" radius={[6, 6, 0, 0]}>
                      {[0, 1, 2].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Heat-Intensity Peak Hours Matrix */}
        <section className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-4 rounded-xl shadow-xs space-y-3">
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Clock size={14} className="text-[var(--primary)]" />
              <span>Peak Hours Ordering Pattern</span>
            </h3>
            <p className="text-[9px] text-zinc-400 font-semibold mt-0.5">2D heatmap matrix mapping days of week and hours of operation</p>
          </div>

          {isHourlyLoading ? (
            <div className="h-48 flex items-center justify-center">
              <RefreshCw size={24} className="animate-spin text-[var(--primary)]" />
            </div>
          ) : isHourlyError ? (
            <div className="text-red-500 py-6 text-center">
              Failed to load peak hours. <button onClick={refetchHourly} className="underline font-bold cursor-pointer">Retry</button>
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-thin">
              <div className="min-w-[640px]">
                <table className="w-full text-center border-collapse">
                  <thead>
                    <tr>
                      <th className="p-2 text-left font-bold text-zinc-400 w-16 uppercase">Day</th>
                      {HOURS.map(hr => (
                        <th key={hr} className="p-2 font-bold text-zinc-400 text-[10px] uppercase">
                          {hr}:00
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {DAYS.map(day => (
                      <tr key={day} className="hover:bg-zinc-50/30 dark:hover:bg-zinc-900/30">
                        <td className="p-2 text-left font-black text-slate-900 dark:text-white">{day}</td>
                        {HOURS.map(hour => {
                          const count = getOrdersForSlot(day, hour);
                          const opacity = count > 0 ? 0.05 + 0.9 * (count / maxHeatmapValue) : 0.02;
                          return (
                            <td key={hour} className="p-1.5">
                              <div className="relative p-2.5 rounded-lg border border-zinc-100 dark:border-zinc-800/80 flex flex-col items-center justify-center overflow-hidden min-h-[42px]">
                                <div 
                                  className="absolute inset-0 bg-[var(--primary)] transition-all duration-300"
                                  style={{ opacity }}
                                />
                                <span className="relative z-10 font-black text-slate-900 dark:text-white text-[10px]">{count}</span>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* Store Performance Grid Table */}
        <section className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-zinc-100 dark:border-zinc-850 bg-zinc-50/20 dark:bg-zinc-900/10 flex justify-between items-center">
            <h3 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Store size={14} className="text-[var(--primary)]" />
              <span>Store Operations Performance</span>
            </h3>
          </div>

          {isStorePerformanceLoading ? (
            <div className="p-8 flex items-center justify-center">
              <RefreshCw size={24} className="animate-spin text-[var(--primary)]" />
            </div>
          ) : isStorePerformanceError ? (
            <div className="text-red-500 py-6 text-center">
              Failed to load store performance. <button onClick={refetchStorePerformance} className="underline font-bold cursor-pointer">Retry</button>
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-left border-collapse font-semibold text-zinc-700 dark:text-zinc-300">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-900/30 text-[10px] text-zinc-400 uppercase">
                    <th className="p-3">Store Name</th>
                    <th className="p-3 text-center">Total Orders</th>
                    <th className="p-3 text-center">Completed</th>
                    <th className="p-3 text-center">Cancelled</th>
                    <th className="p-3 text-center">Avg Delivery</th>
                    <th className="p-3 text-right">Revenue Contrib</th>
                    <th className="p-3 text-right">Growth Index</th>
                  </tr>
                </thead>
                <tbody>
                  {storePerformance?.map(store => (
                    <tr key={store.storeId} className="border-b border-zinc-100 dark:border-zinc-850 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20">
                      <td className="p-3 font-bold text-zinc-900 dark:text-white">{store.storeName}</td>
                      <td className="p-3 text-center font-bold">{store.orders?.toLocaleString()}</td>
                      <td className="p-3 text-center text-emerald-500 font-bold">{store.completedOrders?.toLocaleString()}</td>
                      <td className="p-3 text-center text-rose-500 font-bold">{store.cancelledOrders?.toLocaleString()}</td>
                      <td className="p-3 text-center font-mono">{store.avgDeliveryTime} mins</td>
                      <td className="p-3 text-right font-bold text-slate-900 dark:text-white">₹{store.revenue?.toLocaleString("en-IN")}</td>
                      <td className={`p-3 text-right font-bold ${store.growthPercentage >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                        {store.growthPercentage >= 0 ? "+" : ""}{store.growthPercentage}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Detailed Order Logs Table */}
        <section className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 rounded-xl shadow-xs overflow-hidden">
          
          {/* Header Actions Table */}
          <div className="p-4 border-b border-zinc-100 dark:border-zinc-850 bg-zinc-50/20 dark:bg-zinc-900/10 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white">
                Detailed Order Audit Logs
              </h3>
              <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">Filter, sort, search, and export order invoices</p>
            </div>
            
            {/* Search inputs */}
            <div className="flex items-center gap-2 max-w-sm w-full">
              <div className="relative flex-1">
                <Search size={13} className="absolute left-3 top-2.5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search number, customer, store..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl focus:outline-none focus:border-[var(--primary)] text-zinc-800 dark:text-zinc-250 font-bold"
                />
              </div>
            </div>
          </div>

          {/* Table Area */}
          {isOrdersListLoading ? (
            <div className="p-8 flex items-center justify-center">
              <RefreshCw size={24} className="animate-spin text-[var(--primary)]" />
            </div>
          ) : isOrdersListError ? (
            <div className="text-red-500 py-6 text-center">
              Failed to load order logs. <button onClick={refetchOrdersList} className="underline font-bold cursor-pointer">Retry</button>
            </div>
          ) : (
            <div className="flex flex-col">
              
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-left border-collapse font-semibold text-zinc-700 dark:text-zinc-300">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-900/30 text-[10px] text-zinc-400 uppercase select-none">
                      <th className="p-3 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/50" onClick={() => handleSort("orderNumber")}>
                        Order Num {orderSortField === "orderNumber" && (orderSortOrder === "asc" ? "▲" : "▼")}
                      </th>
                      <th className="p-3 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/50" onClick={() => handleSort("customerName")}>
                        Customer {orderSortField === "customerName" && (orderSortOrder === "asc" ? "▲" : "▼")}
                      </th>
                      <th className="p-3 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/50" onClick={() => handleSort("storeName")}>
                        Store {orderSortField === "storeName" && (orderSortOrder === "asc" ? "▲" : "▼")}
                      </th>
                      <th className="p-3 text-right cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/50" onClick={() => handleSort("amount")}>
                        Amount {orderSortField === "amount" && (orderSortOrder === "asc" ? "▲" : "▼")}
                      </th>
                      <th className="p-3 text-center cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/50" onClick={() => handleSort("orderType")}>
                        Type {orderSortField === "orderType" && (orderSortOrder === "asc" ? "▲" : "▼")}
                      </th>
                      <th className="p-3 text-center cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/50" onClick={() => handleSort("status")}>
                        Status {orderSortField === "status" && (orderSortOrder === "asc" ? "▲" : "▼")}
                      </th>
                      <th className="p-3 text-center cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/50" onClick={() => handleSort("deliveryTime")}>
                        Delivery Time {orderSortField === "deliveryTime" && (orderSortOrder === "asc" ? "▲" : "▼")}
                      </th>
                      <th className="p-3 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/50" onClick={() => handleSort("createdAt")}>
                        Date Placed {orderSortField === "createdAt" && (orderSortOrder === "asc" ? "▲" : "▼")}
                      </th>
                      <th className="p-3 text-center w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordersListData.orders && ordersListData.orders.length > 0 ? (
                      ordersListData.orders.map(order => (
                        <tr key={order.orderId} className="border-b border-zinc-100 dark:border-zinc-850 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20">
                          <td className="p-3 font-bold text-zinc-900 dark:text-white">{order.orderNumber}</td>
                          <td className="p-3 font-bold">{order.customerName}</td>
                          <td className="p-3 text-zinc-500 dark:text-zinc-400">{order.storeName}</td>
                          <td className="p-3 text-right font-black text-slate-900 dark:text-white">₹{order.amount?.toFixed(2)}</td>
                          <td className="p-3 text-center">
                            <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 font-bold uppercase text-[9px]">
                              {order.orderType}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded-md font-bold uppercase text-[9px] ${getStatusBadge(order.status)}`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="p-3 text-center font-mono">
                            {order.deliveryTime > 0 ? `${order.deliveryTime} mins` : "—"}
                          </td>
                          <td className="p-3 text-zinc-400 font-bold">
                            {new Date(order.createdAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => setDetailOrderId(order.orderId)}
                                className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
                                title="View Details"
                              >
                                <Eye size={12} />
                              </button>
                              <button
                                onClick={() => setInvoiceOrderId(order.orderId)}
                                className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-[var(--primary)] transition-colors cursor-pointer"
                                title="Export Invoice"
                              >
                                <Receipt size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-zinc-400 font-bold">
                          No matching orders found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
              {ordersListData.totalPages > 1 && (
                <div className="p-3 border-t border-zinc-100 dark:border-zinc-850 flex items-center justify-between bg-zinc-50/20 dark:bg-zinc-900/10">
                  <span className="text-[10px] text-zinc-400 font-bold">
                    Page {orderPage} of {ordersListData.totalPages} • Total {ordersListData.totalCount} orders
                  </span>
                  
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setOrderPage(p => Math.max(p - 1, 1))}
                      disabled={orderPage === 1}
                      className="p-1.5 border border-zinc-250 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 cursor-pointer text-zinc-600 dark:text-zinc-300"
                    >
                      <ChevronLeft size={13} />
                    </button>
                    {[...Array(ordersListData.totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setOrderPage(i + 1)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black cursor-pointer ${
                          orderPage === i + 1
                            ? "bg-[var(--primary)] text-white"
                            : "border border-zinc-250 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-850"
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => setOrderPage(p => Math.min(p + 1, ordersListData.totalPages))}
                      disabled={orderPage === ordersListData.totalPages}
                      className="p-1.5 border border-zinc-250 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 cursor-pointer text-zinc-600 dark:text-zinc-300"
                    >
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

        </section>

      </div>
    </div>
  );
}
