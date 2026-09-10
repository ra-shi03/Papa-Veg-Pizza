import React, { useState } from "react";
import { 
  DollarSign, 
  ShoppingBag, 
  RotateCcw, 
  Percent, 
  BarChart3, 
  TrendingUp, 
  CreditCard, 
  Pizza, 
  Download, 
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
  Trash2, 
  AlertCircle
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
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
  useSalesDashboard, 
  useSalesTrend, 
  useStorePerformance, 
  usePaymentDistribution, 
  useTopProducts, 
  useGeneratedReports, 
  useStoresDropdown, 
  useDebounce 
} from "./hooks/useSalesReport";

import GenerateReportModal from "./components/GenerateReportModal";
import ViewReportModal from "./components/ViewReportModal";
import DeleteConfirmationModal from "./components/DeleteConfirmationModal";
import { toast } from "sonner";

export default function SalesReport() {
  // Filters state
  const [dateRange, setDateRange] = useState("This Month");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [selectedStore, setSelectedStore] = useState("all");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("All");
  const [selectedOrderType, setSelectedOrderType] = useState("All");
  const [filtersOpen, setFiltersOpen] = useState(true);

  // Active filters passed to APIs
  const [activeFilters, setActiveFilters] = useState({
    startDate: "",
    endDate: "",
    storeId: "all",
    paymentMethod: "All",
    orderType: "All"
  });

  // Table search & pagination state (Report Logs Table)
  const [reportSearch, setReportSearch] = useState("");
  const debouncedReportSearch = useDebounce(reportSearch, 400);
  const [reportPage, setReportPage] = useState(1);
  const [reportSortField, setReportSortField] = useState("createdAt");
  const [reportSortOrder, setReportSortOrder] = useState("desc");
  const [selectedReportRows, setSelectedReportRows] = useState([]);

  // Table search & pagination state (Top Products Table)
  const [productSearch, setProductSearch] = useState("");
  const [productPage, setProductPage] = useState(1);
  const [productSortField, setProductSortField] = useState("quantitySold");
  const [productSortOrder, setProductSortOrder] = useState("desc");

  // Chart Modes (daily, weekly, monthly, yearly)
  const [trendMode, setTrendMode] = useState("daily");

  // Modals state
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [viewReportId, setViewReportId] = useState(null);
  const [deleteReportId, setDeleteReportId] = useState(null);

  // API Queries
  const { data: storesList } = useStoresDropdown();
  const { data: dashboardData, isLoading: isDashboardLoading, isError: isDashboardError, refetch: refetchDashboard } = useSalesDashboard(activeFilters);
  const { data: trendData, isLoading: isTrendLoading, isError: isTrendError, refetch: refetchTrend } = useSalesTrend(activeFilters, trendMode);
  const { data: performanceData, isLoading: isPerformanceLoading, isError: isPerformanceError, refetch: refetchPerformance } = useStorePerformance(activeFilters);
  const { data: distributionData, isLoading: isDistributionLoading, isError: isDistributionError, refetch: refetchDistribution } = usePaymentDistribution(activeFilters);
  const { data: productsData, isLoading: isProductsLoading, isError: isProductsError, refetch: refetchProducts } = useTopProducts(activeFilters);
  
  // Generated Reports Logs Query
  const reportsLimit = 5;
  const { data: reportsData, isLoading: isReportsLoading, isError: isReportsError, refetch: refetchReports } = useGeneratedReports({
    search: debouncedReportSearch,
    page: reportPage,
    limit: reportsLimit,
    sortBy: reportSortField,
    sortOrder: reportSortOrder
  });

  // Apply filters
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
      paymentMethod: selectedPaymentMethod,
      orderType: selectedOrderType
    });
    toast.success("Filters applied successfully!");
  };

  // Reset filters
  const handleResetFilters = () => {
    setDateRange("This Month");
    setCustomStartDate("");
    setCustomEndDate("");
    setSelectedStore("all");
    setSelectedPaymentMethod("All");
    setSelectedOrderType("All");
    
    setActiveFilters({
      startDate: "",
      endDate: "",
      storeId: "all",
      paymentMethod: "All",
      orderType: "All"
    });
    toast.info("Filters reset to default");
  };

  // Global manual refresh
  const handleRefreshAll = () => {
    refetchDashboard();
    refetchTrend();
    refetchPerformance();
    refetchDistribution();
    refetchProducts();
    refetchReports();
    toast.success("Sales data refreshed");
  };

  // Row selection helper (Report Table)
  const handleSelectAllRows = (e) => {
    if (e.target.checked && reportsData?.reports) {
      setSelectedReportRows(reportsData.reports.map(r => r.id));
    } else {
      setSelectedReportRows([]);
    }
  };

  const handleSelectRow = (id, checked) => {
    if (checked) {
      setSelectedReportRows(prev => [...prev, id]);
    } else {
      setSelectedReportRows(prev => prev.filter(rowId => rowId !== id));
    }
  };

  const handleBulkDelete = () => {
    if (selectedReportRows.length === 0) return;
    // For demo, we just trigger toast or open delete dialog with the first selected ID
    toast.warning(`Bulk delete requested for ${selectedReportRows.length} reports.`);
    setDeleteReportId(selectedReportRows[0]);
    setSelectedReportRows([]);
  };

  const handleExportData = (type) => {
    toast.success(`Exporting summary metrics as ${type}...`);
    const csvContent = "data:text/csv;charset=utf-8,Metric,Value\n" +
      `Total Revenue,₹${dashboardData?.totalRevenue?.toLocaleString("en-IN")}\n` +
      `Total Orders,${dashboardData?.totalOrders}\n` +
      `Avg Order Value,₹${dashboardData?.avgOrderValue}\n` +
      `Refunds,₹${dashboardData?.refundAmount}\n` +
      `Taxes,₹${dashboardData?.taxCollected}\n` +
      `Net Revenue,₹${dashboardData?.netRevenue}\n` +
      `Growth,${dashboardData?.growthPercentage}%\n`;
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `franchise-sales-summary.${type.toLowerCase() === "pdf" ? "pdf" : "csv"}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Pie chart variables
  const PIE_COLORS = ["var(--primary)", "var(--sa-secondary)", "#10b981", "#f59e0b"];

  // Helper sorting and searching (Stores performance client-side)
  const filteredStoresPerformance = (performanceData || [])
    .filter(sp => {
      // Filter out stores not matching the dropdown storeId if we are in single store filter mode
      if (activeFilters.storeId !== "all" && sp.storeId !== activeFilters.storeId) return false;
      return true;
    });

  // Top products filtering & pagination
  const filteredProducts = (productsData || [])
    .filter(p => p.productName.toLowerCase().includes(productSearch.toLowerCase()))
    .sort((a, b) => {
      let valA = a[productSortField];
      let valB = b[productSortField];
      return productSortOrder === "asc" ? valA - valB : valB - valA;
    });

  const productsPageLimit = 3;
  const productsTotalPages = Math.ceil(filteredProducts.length / productsPageLimit);
  const paginatedProducts = filteredProducts.slice(
    (productPage - 1) * productsPageLimit,
    productPage * productsPageLimit
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-150 transition-all duration-300 text-xs">
      
      {/* Modals */}
      <GenerateReportModal isOpen={isGenerateOpen} onClose={() => setIsGenerateOpen(false)} />
      <ViewReportModal isOpen={viewReportId !== null} reportId={viewReportId} onClose={() => setViewReportId(null)} />
      <DeleteConfirmationModal isOpen={deleteReportId !== null} reportId={deleteReportId} onClose={() => setDeleteReportId(null)} />

      {/* Main Wrapper */}
      <div className="p-3 md:p-5 space-y-4">
        
        {/* Page Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-150 dark:border-zinc-850 shadow-xs">
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
              Sales Reports
            </h1>
            <p className="text-[10px] text-zinc-400 font-bold mt-0.5">
              Track revenue, orders, taxes, refunds, and store performance across the franchise.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-center">
            <button
              onClick={() => setIsGenerateOpen(true)}
              className="px-3.5 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-black rounded-lg shadow-md flex items-center gap-1 cursor-pointer transition-colors"
            >
              <FileText size={13} />
              <span>Generate Report</span>
            </button>
            <button 
              onClick={() => handleExportData("PDF")}
              className="px-2.5 py-2 border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 font-bold rounded-lg shadow-sm flex items-center gap-1 cursor-pointer text-slate-800 dark:text-zinc-200"
            >
              <FileText size={12} className="text-rose-500" />
              <span className="hidden sm:inline">Export PDF</span>
            </button>
            <button 
              onClick={() => handleExportData("Excel")}
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

        {/* Filters Card */}
        <section className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 rounded-xl shadow-xs overflow-hidden">
          <div 
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="p-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/30 cursor-pointer"
          >
            <div className="flex items-center gap-1.5">
              <Filter size={13} className="text-[var(--primary)]" />
              <h2 className="font-extrabold text-slate-900 dark:text-white">Filters Panel</h2>
            </div>
            {filtersOpen ? <ChevronUp size={14} className="opacity-60" /> : <ChevronDown size={14} className="opacity-60" />}
          </div>

          {filtersOpen && (
            <div className="p-4 space-y-4 animate-fade-down">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {/* Date range selection */}
                <div className="space-y-1">
                  <label className="block text-zinc-400 font-bold">Date Range</label>
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="w-full px-2.5 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-slate-800 dark:text-zinc-250 cursor-pointer"
                  >
                    <option value="Today">Today</option>
                    <option value="Yesterday">Yesterday</option>
                    <option value="This Week">This Week</option>
                    <option value="This Month">This Month</option>
                    <option value="Custom">Custom Range</option>
                  </select>
                </div>

                {/* Custom date pickers */}
                {dateRange === "Custom" && (
                  <>
                    <div className="space-y-1">
                      <label className="block text-zinc-400 font-bold">Start Date</label>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-slate-800 dark:text-zinc-250"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-zinc-400 font-bold">End Date</label>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-slate-800 dark:text-zinc-250"
                      />
                    </div>
                  </>
                )}

                {/* Store filter */}
                <div className="space-y-1">
                  <label className="block text-zinc-400 font-bold">Store Location</label>
                  <select
                    value={selectedStore}
                    onChange={(e) => setSelectedStore(e.target.value)}
                    className="w-full px-2.5 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-slate-800 dark:text-zinc-250 cursor-pointer"
                  >
                    <option value="all">All Stores</option>
                    {storesList?.map((s) => (
                      <option key={s.storeId} value={s.storeId}>{s.storeName}</option>
                    ))}
                  </select>
                </div>

                {/* Payment Method */}
                <div className="space-y-1">
                  <label className="block text-zinc-400 font-bold">Payment Method</label>
                  <select
                    value={selectedPaymentMethod}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                    className="w-full px-2.5 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-slate-800 dark:text-zinc-250 cursor-pointer"
                  >
                    <option value="All">All Payments</option>
                    <option value="UPI">UPI</option>
                    <option value="Card">Card</option>
                    <option value="Cash">Cash</option>
                    <option value="Wallet">Wallet</option>
                  </select>
                </div>

                {/* Order Type */}
                <div className="space-y-1">
                  <label className="block text-zinc-400 font-bold">Order Type</label>
                  <select
                    value={selectedOrderType}
                    onChange={(e) => setSelectedOrderType(e.target.value)}
                    className="w-full px-2.5 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-slate-800 dark:text-zinc-250 cursor-pointer"
                  >
                    <option value="All">All Types</option>
                    <option value="Delivery">Delivery</option>
                    <option value="Takeaway">Takeaway</option>
                    <option value="Dine-In">Dine-In</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800 pt-3">
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 font-bold rounded-lg cursor-pointer text-slate-850 dark:text-zinc-250"
                >
                  Reset
                </button>
                <button
                  onClick={handleApplyFilters}
                  className="px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-black rounded-lg cursor-pointer"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Dashboard Summary Cards Grid */}
        <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {isDashboardLoading ? (
            /* Skeletons */
            [...Array(8)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-3.5 rounded-lg space-y-1.5 animate-pulse shadow-xs">
                <div className="h-2 w-12 bg-zinc-200 dark:bg-zinc-850 rounded" />
                <div className="h-5 w-20 bg-zinc-250 dark:bg-zinc-800 rounded" />
                <div className="h-1.5 w-10 bg-zinc-150 dark:bg-zinc-850 rounded" />
              </div>
            ))
          ) : isDashboardError ? (
            /* Error */
            <div className="col-span-full py-4 text-center text-red-500 font-bold">
              Failed to load dashboard metrics. <button onClick={refetchDashboard} className="underline">Retry</button>
            </div>
          ) : (
            /* Content */
            <>
              {/* Total Revenue */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-3 rounded-lg flex flex-col justify-between shadow-xs hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer">
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Total Revenue</span>
                <p className="text-base font-black text-slate-900 dark:text-white mt-0.5">₹{dashboardData.totalRevenue.toLocaleString("en-IN")}</p>
                <span className="text-[8px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-0.5">
                  +{dashboardData.growthPercentage}% vs prev
                </span>
              </div>

              {/* Total Orders */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-3 rounded-lg flex flex-col justify-between shadow-xs hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer">
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Total Orders</span>
                <p className="text-base font-black text-slate-900 dark:text-white mt-0.5">{dashboardData.totalOrders.toLocaleString()}</p>
                <span className="text-[8px] font-bold text-zinc-400 mt-1">Orders processed</span>
              </div>

              {/* Average Order Value */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-3 rounded-lg flex flex-col justify-between shadow-xs hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer">
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Avg Order Value</span>
                <p className="text-base font-black text-slate-900 dark:text-white mt-0.5">₹{Math.floor(dashboardData.avgOrderValue).toLocaleString("en-IN")}</p>
                <span className="text-[8px] font-bold text-zinc-400 mt-1">Revenue / Orders</span>
              </div>

              {/* Refund Amount */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-3 rounded-lg flex flex-col justify-between shadow-xs hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer">
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Refund Amount</span>
                <p className="text-base font-black text-slate-900 dark:text-white mt-0.5">₹{dashboardData.refundAmount.toLocaleString("en-IN")}</p>
                <span className="text-[8px] font-bold text-zinc-400 mt-1">Issued refunds</span>
              </div>

              {/* Taxes Collected */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-3 rounded-lg flex flex-col justify-between shadow-xs hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer">
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Taxes Collected</span>
                <p className="text-base font-black text-slate-900 dark:text-white mt-0.5">₹{dashboardData.taxCollected.toLocaleString("en-IN")}</p>
                <span className="text-[8px] font-bold text-zinc-400 mt-1">GST collected (5%)</span>
              </div>

              {/* Net Revenue */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-3 rounded-lg flex flex-col justify-between shadow-xs hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer">
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Net Revenue</span>
                <p className="text-base font-black text-slate-900 dark:text-white mt-0.5">₹{dashboardData.netRevenue.toLocaleString("en-IN")}</p>
                <span className="text-[8px] font-bold text-zinc-400 mt-1">Rev - Tax - Refund</span>
              </div>

              {/* Growth % */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-3 rounded-lg flex flex-col justify-between shadow-xs hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer">
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Growth %</span>
                <p className="text-base font-black text-slate-900 dark:text-white mt-0.5">{dashboardData.growthPercentage}%</p>
                <span className="text-[8px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">Monthly trend</span>
              </div>

              {/* Top Performing Store */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-3 rounded-lg flex flex-col justify-between shadow-xs hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer">
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Top Store</span>
                <p className="text-[10px] font-black text-slate-900 dark:text-white mt-0.5 truncate">{dashboardData.topStore.storeName.replace("Papa Veg Pizza - ", "")}</p>
                <span className="text-[8px] font-black text-[var(--primary)] mt-1 flex items-center gap-0.5">
                  ₹{(dashboardData.topStore.revenue / 100000).toFixed(1)}L ({dashboardData.topStore.orders} ord)
                </span>
              </div>
            </>
          )}
        </section>

        {/* Charts Section: Revenue Trend & Payment Distribution */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* Revenue Trend Line Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-4 rounded-xl shadow-xs flex flex-col justify-between min-h-[320px]">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1">
                  <TrendingUp size={14} className="text-[var(--primary)]" />
                  Revenue Trend
                </h3>
                <p className="text-[9px] text-zinc-400 font-semibold mt-0.5">Real-time daily sales tracking</p>
              </div>

              {/* Trend mode select */}
              <div className="flex bg-zinc-150 dark:bg-zinc-800 p-0.5 rounded-lg">
                {["daily", "weekly", "monthly", "yearly"].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setTrendMode(mode)}
                    className={`px-2 py-0.5 rounded-md text-[9px] font-bold capitalize transition-all cursor-pointer ${
                      trendMode === mode
                        ? "bg-[var(--primary)] text-white shadow-sm font-black"
                        : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {isTrendLoading ? (
              <div className="flex-1 flex items-center justify-center h-48">
                <RefreshCw size={24} className="animate-spin text-[var(--primary)]" />
              </div>
            ) : isTrendError ? (
              <div className="flex-1 flex flex-col items-center justify-center py-6 text-red-500">
                <span>Failed to load trends.</span>
                <button onClick={refetchTrend} className="underline text-xs mt-1 cursor-pointer">Retry</button>
              </div>
            ) : (
              <div className="w-full h-[230px] overflow-x-auto scrollbar-thin">
                <div className="w-[600px] h-[220px]">
                  <LineChart width={600} height={220} data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="date" stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}`} />
                    <RechartsTooltip contentStyle={{ fontSize: "10px", borderRadius: "8px" }} />
                    <Line type="monotone" dataKey="revenue" name="Sales Index" stroke="var(--primary)" strokeWidth={2.2} activeDot={{ r: 5 }} />
                  </LineChart>
                </div>
              </div>
            )}
          </div>

          {/* Payment Distribution Pie Chart */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-4 rounded-xl shadow-xs flex flex-col justify-between min-h-[320px]">
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1">
                <CreditCard size={14} className="text-[var(--primary)]" />
                Payment Distribution
              </h3>
              <p className="text-[9px] text-zinc-400 font-semibold mt-0.5">Share of sales channels</p>
            </div>

            {isDistributionLoading ? (
              <div className="flex-1 flex items-center justify-center h-48">
                <RefreshCw size={24} className="animate-spin text-[var(--primary)]" />
              </div>
            ) : isDistributionError ? (
              <div className="flex-1 flex flex-col items-center justify-center py-6 text-red-500">
                <span>Failed to load split.</span>
                <button onClick={refetchDistribution} className="underline text-xs mt-1 cursor-pointer">Retry</button>
              </div>
            ) : (
              <>
                <div className="w-full h-[180px] flex items-center justify-center">
                  <div className="w-[180px] h-[180px]">
                    <PieChart width={180} height={180}>
                      <Pie
                        data={[
                          { name: "UPI", value: distributionData.upi, color: PIE_COLORS[0] },
                          { name: "Card", value: distributionData.card, color: PIE_COLORS[1] },
                          { name: "Cash", value: distributionData.cash, color: PIE_COLORS[2] },
                          { name: "Wallet", value: distributionData.wallet, color: PIE_COLORS[3] }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {[0, 1, 2, 3].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(val) => `${val}%`} contentStyle={{ fontSize: "9px" }} />
                    </PieChart>
                  </div>
                </div>
                
                {/* Labels and values */}
                <div className="grid grid-cols-2 gap-1.5 text-[9px] font-bold">
                  {[
                    { name: "UPI", val: distributionData.upi, color: PIE_COLORS[0] },
                    { name: "Card", val: distributionData.card, color: PIE_COLORS[1] },
                    { name: "Cash", val: distributionData.cash, color: PIE_COLORS[2] },
                    { name: "Wallet", val: distributionData.wallet, color: PIE_COLORS[3] }
                  ].map((x) => (
                    <div key={x.name} className="flex justify-between items-center p-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-850 rounded">
                      <span className="flex items-center gap-1 text-zinc-500">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: x.color }} />
                        {x.name}
                      </span>
                      <span className="text-slate-900 dark:text-white">{x.val}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>

        {/* Store Performance Breakdown & Top Products Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* Store Performance list (Interactive Table / Bar Chart) */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-4 rounded-xl shadow-xs space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1">
                  <BarChart3 size={14} className="text-[var(--primary)]" />
                  Revenue By Store
                </h3>
                <p className="text-[9px] text-zinc-400 font-semibold mt-0.5">Store sales, orders & growth rates</p>
              </div>
            </div>

            {isPerformanceLoading ? (
              <div className="py-12 flex justify-center animate-pulse">
                <div className="h-6 w-full bg-zinc-100 dark:bg-zinc-800 rounded" />
              </div>
            ) : isPerformanceError ? (
              <div className="text-center py-6 text-red-500">
                Failed to load store rankings. <button onClick={refetchPerformance} className="underline cursor-pointer">Retry</button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[10px] text-left border-collapse border border-zinc-100 dark:border-zinc-800">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider">
                      <th className="p-2">Store Name</th>
                      <th className="p-2 text-right">Orders</th>
                      <th className="p-2 text-right">Revenue</th>
                      <th className="p-2 text-right">AOV</th>
                      <th className="p-2 text-right">Growth %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 font-semibold text-slate-800 dark:text-zinc-300">
                    {filteredStoresPerformance.map((sp) => (
                      <tr key={sp.storeId} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                        <td className="p-2 font-bold">{sp.storeName.replace("Papa Veg Pizza - ", "")}</td>
                        <td className="p-2 text-right">{sp.orders.toLocaleString()}</td>
                        <td className="p-2 text-right font-black">₹{sp.revenue.toLocaleString("en-IN")}</td>
                        <td className="p-2 text-right">₹{Math.floor(sp.avgOrderValue)}</td>
                        <td className={`p-2 text-right font-bold ${sp.growthPercentage >= 0 ? "text-emerald-600" : "text-rose-605"}`}>
                          {sp.growthPercentage >= 0 ? `+${sp.growthPercentage}` : sp.growthPercentage}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Top Selling Products List Table */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-4 rounded-xl shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1">
                  <Pizza size={14} className="text-[var(--primary)]" />
                  Top Selling Products
                </h3>
                <p className="text-[9px] text-zinc-400 font-semibold mt-0.5">Top performing items by volume</p>
              </div>

              {/* Product search */}
              <div className="relative">
                <Search size={11} className="absolute left-2.5 top-2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Filter products..."
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    setProductPage(1);
                  }}
                  className="pl-7 pr-2.5 py-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none focus:border-[var(--primary)] text-[9px] w-full sm:w-36"
                />
              </div>
            </div>

            {isProductsLoading ? (
              <div className="py-12 flex justify-center animate-pulse">
                <div className="h-6 w-full bg-zinc-100 dark:bg-zinc-800 rounded" />
              </div>
            ) : isProductsError ? (
              <div className="text-center py-6 text-red-500">
                Failed to load products. <button onClick={refetchProducts} className="underline cursor-pointer">Retry</button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-[10px] text-left border-collapse border border-zinc-100 dark:border-zinc-800">
                    <thead>
                      <tr className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider">
                        <th className="p-2">Product Name</th>
                        <th 
                          className="p-2 text-right cursor-pointer hover:text-zinc-650"
                          onClick={() => {
                            setProductSortField("quantitySold");
                            setProductSortOrder(prev => prev === "desc" ? "asc" : "desc");
                          }}
                        >
                          Qty Sold {productSortField === "quantitySold" && (productSortOrder === "desc" ? "↓" : "↑")}
                        </th>
                        <th 
                          className="p-2 text-right cursor-pointer hover:text-zinc-650"
                          onClick={() => {
                            setProductSortField("revenue");
                            setProductSortOrder(prev => prev === "desc" ? "asc" : "desc");
                          }}
                        >
                          Revenue {productSortField === "revenue" && (productSortOrder === "desc" ? "↓" : "↑")}
                        </th>
                        <th className="p-2 text-right">Contr %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 font-semibold text-slate-800 dark:text-zinc-300">
                      {paginatedProducts.map((p) => (
                        <tr key={p.productId} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                          <td className="p-2 flex items-center gap-2">
                            <img src={p.image} alt={p.productName} className="w-6 h-6 rounded-md object-cover border border-zinc-150 dark:border-zinc-800" />
                            <span>{p.productName}</span>
                          </td>
                          <td className="p-2 text-right">{p.quantitySold.toLocaleString()}</td>
                          <td className="p-2 text-right font-black">₹{p.revenue.toLocaleString("en-IN")}</td>
                          <td className="p-2 text-right">{p.contributionPercentage}%</td>
                        </tr>
                      ))}
                      {paginatedProducts.length === 0 && (
                        <tr>
                          <td colSpan={4} className="text-center py-6 text-zinc-400">No products match search queries</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Products pagination */}
                {productsTotalPages > 1 && (
                  <div className="flex justify-between items-center border-t border-zinc-100 dark:border-zinc-800 pt-2 text-[9px] font-bold text-zinc-400">
                    <span>Page {productPage} of {productsTotalPages}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setProductPage(prev => Math.max(1, prev - 1))}
                        disabled={productPage === 1}
                        className="p-1 border border-zinc-200 dark:border-zinc-800 rounded bg-zinc-50 dark:bg-zinc-950 disabled:opacity-50 cursor-pointer text-slate-800 dark:text-zinc-200"
                      >
                        <ChevronLeft size={10} />
                      </button>
                      <button
                        onClick={() => setProductPage(prev => Math.min(productsTotalPages, prev + 1))}
                        disabled={productPage === productsTotalPages}
                        className="p-1 border border-zinc-200 dark:border-zinc-800 rounded bg-zinc-50 dark:bg-zinc-950 disabled:opacity-50 cursor-pointer text-slate-800 dark:text-zinc-200"
                      >
                        <ChevronRight size={10} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* Sales Report Table Section */}
        <section className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-4 rounded-xl shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1">
                <FileText size={14} className="text-[var(--primary)]" />
                Report Registry & Logs
              </h3>
              <p className="text-[9px] text-zinc-400 font-semibold mt-0.5">List of generated and processing reports</p>
            </div>

            {/* Actions & Search */}
            <div className="flex items-center gap-2 self-end sm:self-center">
              {selectedReportRows.length > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="px-2.5 py-1 bg-red-500 hover:bg-red-600 text-white font-black rounded flex items-center gap-1.5 cursor-pointer animate-fade-in"
                >
                  <Trash2 size={11} />
                  <span>Bulk Delete ({selectedReportRows.length})</span>
                </button>
              )}

              {/* Report Search */}
              <div className="relative">
                <Search size={12} className="absolute left-2.5 top-2.5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search report ID, type..."
                  value={reportSearch}
                  onChange={(e) => {
                    setReportSearch(e.target.value);
                    setReportPage(1);
                  }}
                  className="pl-8 pr-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:border-[var(--primary)] text-[10px] w-full sm:w-44"
                />
              </div>
            </div>
          </div>

          {/* Table Container */}
          {isReportsLoading ? (
            /* Table Loader Skeleton */
            <div className="space-y-2.5 animate-pulse">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-8 w-full bg-zinc-100 dark:bg-zinc-800 rounded" />
              ))}
            </div>
          ) : isReportsError ? (
            <div className="text-center py-8 text-red-500">
              Failed to load generated report logs. <button onClick={refetchReports} className="underline cursor-pointer">Retry</button>
            </div>
          ) : (
            <div className="overflow-x-auto border border-zinc-150 dark:border-zinc-850 rounded-lg">
              <table className="w-full text-[10px] text-left border-collapse sticky-header">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-850 text-zinc-400 font-bold uppercase tracking-wider">
                    <th className="p-3 w-8">
                      <input 
                        type="checkbox"
                        checked={reportsData?.reports?.length > 0 && selectedReportRows.length === reportsData?.reports?.length}
                        onChange={handleSelectAllRows}
                        className="rounded border-zinc-350 dark:border-zinc-700 bg-zinc-50 w-3.5 h-3.5 text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer"
                      />
                    </th>
                    <th 
                      className="p-3 cursor-pointer hover:text-zinc-650"
                      onClick={() => {
                        setReportSortField("id");
                        setReportSortOrder(prev => prev === "desc" ? "asc" : "desc");
                      }}
                    >
                      Report ID {reportSortField === "id" && (reportSortOrder === "desc" ? "↓" : "↑")}
                    </th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Start Date</th>
                    <th className="p-3">End Date</th>
                    <th className="p-3 text-right">Revenue</th>
                    <th className="p-3 text-right">Orders</th>
                    <th className="p-3 text-right">Refunds</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Generated By</th>
                    <th className="p-3">Created At</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-150 dark:divide-zinc-800 font-semibold text-slate-800 dark:text-zinc-300">
                  {reportsData?.reports?.map((r) => (
                    <tr 
                      key={r.id} 
                      className={`hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 ${
                        selectedReportRows.includes(r.id) ? "bg-[var(--primary)]/5" : ""
                      }`}
                    >
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selectedReportRows.includes(r.id)}
                          onChange={(e) => handleSelectRow(r.id, e.target.checked)}
                          className="rounded border-zinc-350 dark:border-zinc-700 bg-zinc-50 w-3.5 h-3.5 text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer"
                        />
                      </td>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{r.id}</td>
                      <td className="p-3">
                        <span className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 rounded font-black text-[9px]">
                          {r.reportType}
                        </span>
                      </td>
                      <td className="p-3">{r.startDate}</td>
                      <td className="p-3">{r.endDate}</td>
                      <td className="p-3 text-right font-black">₹{r.revenue.toLocaleString("en-IN")}</td>
                      <td className="p-3 text-right">{r.orders.toLocaleString()}</td>
                      <td className="p-3 text-right text-zinc-400">₹{r.refundAmount.toLocaleString("en-IN")}</td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-black border ${
                          r.status === "Completed"
                            ? "bg-emerald-50 text-emerald-600 border-emerald-500/10"
                            : "bg-amber-50 text-amber-600 border-amber-500/10 animate-pulse"
                        }`}>
                          <span className={`w-1 h-1 rounded-full ${r.status === "Completed" ? "bg-emerald-500" : "bg-amber-500 animate-ping"}`} />
                          {r.status}
                        </span>
                      </td>
                      <td className="p-3 text-zinc-400">{r.generatedBy}</td>
                      <td className="p-3 text-[9px] text-zinc-400">{new Date(r.createdAt).toLocaleString()}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setViewReportId(r.id)}
                            className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-300 cursor-pointer"
                            title="View report details"
                          >
                            <Eye size={12} />
                          </button>
                          <button
                            onClick={() => handleExportData("CSV")}
                            className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-300 cursor-pointer"
                            title="Download CSV"
                          >
                            <Download size={12} />
                          </button>
                          <button
                            onClick={() => setDeleteReportId(r.id)}
                            className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-rose-500 cursor-pointer"
                            title="Delete report"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {reportsData?.reports?.length === 0 && (
                    <tr>
                      <td colSpan={12} className="text-center py-10 bg-white dark:bg-zinc-900 text-zinc-400">
                        <AlertCircle className="mx-auto text-zinc-300 stroke-[1.5] mb-2" size={30} />
                        <p className="font-bold text-xs">No reports generated yet</p>
                        <p className="text-[10px] mt-0.5 text-zinc-400">Click "Generate Report" above to compile a new sales report.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Table Pagination */}
          {!isReportsLoading && reportsData?.totalPages > 1 && (
            <div className="flex justify-between items-center pt-2 text-[10px] text-zinc-400 font-bold">
              <span>Showing Page {reportsData.page} of {reportsData.totalPages} ({reportsData.totalCount} total logs)</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setReportPage(prev => Math.max(1, prev - 1))}
                  disabled={reportPage === 1}
                  className="p-1.5 border border-zinc-250 dark:border-zinc-800 rounded bg-zinc-50 dark:bg-zinc-950 disabled:opacity-50 cursor-pointer text-slate-800 dark:text-zinc-200"
                >
                  <ChevronLeft size={11} />
                </button>
                <button
                  onClick={() => setReportPage(prev => Math.min(reportsData.totalPages, prev + 1))}
                  disabled={reportPage === reportsData.totalPages}
                  className="p-1.5 border border-zinc-250 dark:border-zinc-800 rounded bg-zinc-50 dark:bg-zinc-950 disabled:opacity-50 cursor-pointer text-slate-800 dark:text-zinc-200"
                >
                  <ChevronRight size={11} />
                </button>
              </div>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
