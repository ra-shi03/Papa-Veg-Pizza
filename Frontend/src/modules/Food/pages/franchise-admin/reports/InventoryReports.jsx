import React, { useState } from "react";
import { 
  ShoppingBag, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
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
  AlertCircle,
  AlertTriangle,
  Layers,
  Settings,
  Warehouse
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
  useInventoryDashboard,
  useConsumptionTrend,
  useLowStockLevels,
  useIngredientUsage,
  usePurchaseRequestsAnalytics,
  useInventoryReportsList,
  useDeleteInventoryReport,
  useDebounce
} from "./hooks/useInventoryReport";
import { useStoresDropdown } from "./hooks/useSalesReport";
import {
  mockInventorySummary,
  mockConsumptionTrend,
  mockLowStockList,
  mockIngredientUsage,
  mockPurchaseRequestsAnalytics,
  initialGeneratedInventoryReports
} from "./mockData";

import GenerateInventoryReportModal from "./components/GenerateInventoryReportModal";
import InventoryDetailModal from "./components/InventoryDetailModal";
import { toast } from "sonner";

export default function InventoryReports() {
  // Filter States
  const [dateRange, setDateRange] = useState("This Month");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [selectedStore, setSelectedStore] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStockStatus, setSelectedStockStatus] = useState("All");
  const [filtersOpen, setFiltersOpen] = useState(true);

  // Active filters passed to APIs
  const [activeFilters, setActiveFilters] = useState({
    startDate: "",
    endDate: "",
    storeId: "all",
    category: "All",
    stockStatus: "All"
  });

  // Table Search and pagination state (Generated Reports Table)
  const [reportSearch, setReportSearch] = useState("");
  const debouncedReportSearch = useDebounce(reportSearch, 400);
  const [reportPage, setReportPage] = useState(1);
  const [reportSortField, setReportSortField] = useState("createdAt");
  const [reportSortOrder, setReportSortOrder] = useState("desc");

  // Ingredient Usage local search/pagination states
  const [ingredientSearch, setIngredientSearch] = useState("");
  const [ingredientPage, setIngredientPage] = useState(1);
  const ingredientLimit = 5;

  // Modals state
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [detailReportId, setDetailReportId] = useState(null);

  // API Queries
  const { data: storesList } = useStoresDropdown();
  const { data: dashboardDataRaw, isLoading: isDashboardLoading, isError: isDashboardError, refetch: refetchDashboard } = useInventoryDashboard(activeFilters);
  const { data: consumptionTrendRaw, isLoading: isTrendLoading, isError: isTrendError, refetch: refetchTrend } = useConsumptionTrend(activeFilters);
  const { data: lowStockListRaw, isLoading: isLowStockLoading, isError: isLowStockError, refetch: refetchLowStock } = useLowStockLevels(activeFilters);
  const { data: ingredientUsageRaw, isLoading: isUsageLoading, isError: isUsageError, refetch: refetchUsage } = useIngredientUsage(activeFilters);
  const { data: purchaseAnalyticsRaw, isLoading: isPurchaseLoading, isError: isPurchaseError, refetch: refetchPurchase } = usePurchaseRequestsAnalytics(activeFilters);
  
  const reportLimit = 5;
  const { data: reportsListDataRaw, isLoading: isReportsLoading, isError: isReportsError, refetch: refetchReports } = useInventoryReportsList({
    search: debouncedReportSearch,
    page: reportPage,
    limit: reportLimit,
    sortBy: reportSortField,
    sortOrder: reportSortOrder
  });

  // Client-side fallbacks to ensure mock data is displayed if API client has network latency or mock intercept falls through
  const dashboardData = dashboardDataRaw || mockInventorySummary;
  const consumptionTrend = consumptionTrendRaw || mockConsumptionTrend;
  const lowStockList = lowStockListRaw || mockLowStockList;
  const ingredientUsage = ingredientUsageRaw || mockIngredientUsage;
  const purchaseAnalytics = purchaseAnalyticsRaw || mockPurchaseRequestsAnalytics;
  const reportsListData = reportsListDataRaw || {
    reports: initialGeneratedInventoryReports,
    totalCount: initialGeneratedInventoryReports.length,
    page: 1,
    limit: reportLimit,
    totalPages: Math.ceil(initialGeneratedInventoryReports.length / reportLimit)
  };

  const deleteReportMutation = useDeleteInventoryReport();

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
      category: selectedCategory,
      stockStatus: selectedStockStatus
    });
    setReportPage(1);
    setIngredientPage(1);
    toast.success("Filters applied successfully.");
  };

  // Reset Filters
  const handleResetFilters = () => {
    setDateRange("This Month");
    setCustomStartDate("");
    setCustomEndDate("");
    setSelectedStore("all");
    setSelectedCategory("All");
    setSelectedStockStatus("All");
    setActiveFilters({
      startDate: "",
      endDate: "",
      storeId: "all",
      category: "All",
      stockStatus: "All"
    });
    setReportPage(1);
    setIngredientPage(1);
    toast.success("Filters reset to default.");
  };

  // Refresh All API Data
  const handleRefreshAll = () => {
    refetchDashboard();
    refetchTrend();
    refetchLowStock();
    refetchUsage();
    refetchPurchase();
    refetchReports();
    toast.success("Refreshing inventory dashboard data...");
  };

  // Delete generated report log
  const handleDeleteReport = async (id) => {
    if (confirm("Are you sure you want to delete this generated report record?")) {
      try {
        await deleteReportMutation.mutateAsync(id);
        toast.success("Inventory report record deleted successfully.");
        refetchReports();
      } catch (err) {
        toast.error("Failed to delete inventory report.");
      }
    }
  };

  // Export actions on page level
  const handlePageExport = (type) => {
    if (!reportsListData?.reports || reportsListData.reports.length === 0) {
      toast.error("No reports log data available to export");
      return;
    }
    toast.success(`Exporting inventory report logs as ${type}...`);
    
    let content = "Report ID,Store Location,Items Consumed,Valuation,Generated By,Status,Created At\n" +
      reportsListData.reports.map(r => `"${r.id}","${r.storeName}",${r.itemsConsumed},₹${r.stockValue},"${r.generatedBy}","${r.status}","${r.createdAt}"`).join("\n");
      
    const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `inventory-reports-audit.${type.toLowerCase() === "pdf" ? "txt" : "csv"}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Sort handler
  const handleSort = (field) => {
    if (reportSortField === field) {
      setReportSortOrder(reportSortOrder === "asc" ? "desc" : "asc");
    } else {
      setReportSortField(field);
      setReportSortOrder("desc");
    }
    setReportPage(1);
  };

  // Filtering ingredient usage client side
  const filteredIngredients = (ingredientUsage || [])
    .filter(i => {
      if (!i) return false;
      const name = i.name || "";
      const category = i.category || "";
      const matchSearch = name.toLowerCase().includes(ingredientSearch.toLowerCase());
      if (activeFilters.category !== "All" && category !== activeFilters.category) return false;
      return matchSearch;
    });

  const paginatedIngredients = filteredIngredients.slice(
    (ingredientPage - 1) * ingredientLimit,
    ingredientPage * ingredientLimit
  );
  const ingredientTotalPages = Math.ceil(filteredIngredients.length / ingredientLimit);

  // Chart Colors
  const DONUT_COLORS = ["var(--sa-secondary, #3b82f6)", "var(--primary)", "#10b981", "#ef4444"];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-955 text-zinc-855 dark:text-zinc-255 transition-all duration-300 text-xs select-none">
      
      {/* Modals */}
      <GenerateInventoryReportModal isOpen={isGenerateOpen} onClose={() => {
        setIsGenerateOpen(false);
        refetchReports();
      }} />

      {detailReportId && (
        <InventoryDetailModal
          isOpen={!!detailReportId}
          reportId={detailReportId}
          onClose={() => setDetailReportId(null)}
        />
      )}

      {/* Page Content Wrapper */}
      <div className="p-3 md:p-5 space-y-4">
        
        {/* Page Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-150 dark:border-zinc-850 shadow-xs">
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
              Inventory Reports
            </h1>
            <p className="text-[10px] text-zinc-400 font-bold mt-0.5">
              Monitor stock consumption, procurement, wastage, and inventory movement across all stores.
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

        {/* Filters Card */}
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
                
                {/* Date range selection */}
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

                {/* Custom Dates */}
                {dateRange === "Custom" && (
                  <>
                    <div className="space-y-1">
                      <label className="block text-zinc-400 font-bold">Start Date</label>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="w-full px-2.5 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-lg text-slate-800 dark:text-zinc-250 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-zinc-400 font-bold">End Date</label>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="w-full px-2.5 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-lg text-slate-800 dark:text-zinc-250 focus:outline-none"
                      />
                    </div>
                  </>
                )}

                {/* Store selection filter */}
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

                {/* Category filter */}
                <div className="space-y-1">
                  <label className="block text-zinc-400 font-bold">Ingredient Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-2.5 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-lg text-slate-800 dark:text-zinc-250 cursor-pointer"
                  >
                    <option value="All">All Categories</option>
                    <option value="Cheese">Cheese</option>
                    <option value="Sauces">Sauces</option>
                    <option value="Dough">Dough</option>
                    <option value="Vegetables">Vegetables</option>
                    <option value="Packaging">Packaging</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Others">Others</option>
                  </select>
                </div>

                {/* Stock Status filter */}
                <div className="space-y-1">
                  <label className="block text-zinc-400 font-bold">Stock Status</label>
                  <select
                    value={selectedStockStatus}
                    onChange={(e) => setSelectedStockStatus(e.target.value)}
                    className="w-full px-2.5 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-lg text-slate-800 dark:text-zinc-250 cursor-pointer"
                  >
                    <option value="All">All</option>
                    <option value="Normal">Normal</option>
                    <option value="Low Stock">Low Stock</option>
                    <option value="Critical">Critical</option>
                    <option value="Out Of Stock">Out Of Stock</option>
                  </select>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-850">
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

        {/* Dashboard KPI summary cards */}
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
          <div className="bg-red-50 dark:bg-red-955/20 border border-red-200 dark:border-red-800 p-4 rounded-xl flex items-center gap-2 text-red-600">
            <AlertCircle size={16} />
            <span className="font-bold">Failed to load inventory summary.</span>
            <button onClick={refetchDashboard} className="underline font-black ml-auto cursor-pointer">Retry</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            
            {/* Total Ingredients */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-4 rounded-xl shadow-xs flex flex-col justify-between">
              <span className="text-[10px] text-zinc-400 font-extrabold uppercase">Total Ingredients</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-lg font-black text-slate-900 dark:text-white">{dashboardData.totalIngredients} items</span>
                <span className="p-1 rounded-md bg-zinc-100 dark:bg-zinc-800">
                  <Warehouse size={12} className="text-[var(--primary)]" />
                </span>
              </div>
            </div>

            {/* Total Stock Value */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-4 rounded-xl shadow-xs flex flex-col justify-between">
              <span className="text-[10px] text-zinc-400 font-extrabold uppercase">Valuation (Total Stock Value)</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-lg font-black text-slate-900 dark:text-white">₹{dashboardData.stockValue?.toLocaleString("en-IN")}</span>
                <span className="p-1 rounded-md bg-zinc-100 dark:bg-zinc-800">
                  <Layers size={12} className="text-emerald-500" />
                </span>
              </div>
            </div>

            {/* Low Stock Items */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-4 rounded-xl shadow-xs flex flex-col justify-between">
              <span className="text-[10px] text-zinc-400 font-extrabold uppercase">Low Stock alerts</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-lg font-black text-rose-500">{dashboardData.lowStockItems} items</span>
                <span className="p-1 rounded-md bg-rose-50 dark:bg-rose-955/20">
                  <AlertTriangle size={12} className="text-rose-500" />
                </span>
              </div>
            </div>

            {/* Wastage Percentage */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-4 rounded-xl shadow-xs flex flex-col justify-between">
              <span className="text-[10px] text-zinc-400 font-extrabold uppercase">Spillage & Wastage %</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-lg font-black text-amber-500">{dashboardData.wastagePercentage}%</span>
                <span className="p-1 rounded-md bg-zinc-100 dark:bg-zinc-800">
                  <RefreshCw size={12} className="text-amber-500" />
                </span>
              </div>
            </div>

            {/* Pending Purchase Requests */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-4 rounded-xl shadow-xs flex flex-col justify-between">
              <span className="text-[10px] text-zinc-400 font-extrabold uppercase">Pending Purchases</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-lg font-black text-slate-900 dark:text-white">{dashboardData.pendingPurchaseRequests} PRs</span>
                <span className="p-1 rounded-md bg-zinc-100 dark:bg-zinc-800">
                  <ShoppingBag size={12} className="text-purple-500" />
                </span>
              </div>
            </div>

            {/* Inventory Turnover Ratio */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-855 p-4 rounded-xl shadow-xs flex flex-col justify-between">
              <span className="text-[10px] text-zinc-400 font-extrabold uppercase">Turnover Ratio</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-lg font-black text-slate-900 dark:text-white">{dashboardData.inventoryTurnoverRatio}x</span>
                <span className="p-1 rounded-md bg-zinc-100 dark:bg-zinc-800">
                  <TrendingUp size={12} className="text-pink-500" />
                </span>
              </div>
            </div>

          </div>
        )}

        {/* Consumption Trend & Low Stock Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* Stock Consumption Trend (Line Chart) */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-4 rounded-xl shadow-xs flex flex-col justify-between min-h-[320px]">
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                <TrendingUp size={14} className="text-[var(--primary)]" />
                Stock Consumption Trend
              </h3>
              <p className="text-[9px] text-zinc-400 font-semibold mt-0.5">Weekly comparison of stock movements</p>
            </div>

            {isTrendLoading ? (
              <div className="flex-grow flex items-center justify-center h-48">
                <RefreshCw size={24} className="animate-spin text-[var(--primary)]" />
              </div>
            ) : isTrendError ? (
              <div className="text-red-500 text-center py-6">
                Failed to load trend. <button onClick={refetchTrend} className="underline text-[10px] cursor-pointer">Retry</button>
              </div>
            ) : (
              <div className="w-full h-[220px] overflow-x-auto scrollbar-thin">
                <div className="w-[450px] h-[210px]">
                  <LineChart width={450} height={210} data={consumptionTrend} margin={{ top: 15, right: 10, left: -25, bottom: 0 }}>
                    <XAxis dataKey="date" stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                    <RechartsTooltip contentStyle={{ fontSize: "9px" }} />
                    <Line type="monotone" dataKey="consumed" name="Consumed" stroke="var(--primary)" strokeWidth={2} />
                    <Line type="monotone" dataKey="purchased" name="Purchased" stroke="#10b981" strokeWidth={2} />
                    <Line type="monotone" dataKey="wastage" name="Wastage" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="3 3" />
                  </LineChart>
                </div>
              </div>
            )}
          </div>

          {/* Low Stock Horizontal Bar Chart */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-4 rounded-xl shadow-xs flex flex-col justify-between min-h-[320px]">
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-rose-500" />
                Critical Inventory Levels
              </h3>
              <p className="text-[9px] text-zinc-400 font-semibold mt-0.5">Ingredients currently approaching critical levels</p>
            </div>

            {isLowStockLoading ? (
              <div className="flex-grow flex items-center justify-center h-48">
                <RefreshCw size={24} className="animate-spin text-[var(--primary)]" />
              </div>
            ) : isLowStockError ? (
              <div className="text-red-500 text-center py-6">
                Failed to load stock alerts. <button onClick={refetchLowStock} className="underline text-[10px] cursor-pointer">Retry</button>
              </div>
            ) : (
              <div className="w-full h-[220px] overflow-x-auto scrollbar-thin">
                <div className="w-[450px] h-[210px]">
                  <BarChart
                    width={450}
                    height={210}
                    layout="vertical"
                    data={lowStockList}
                    margin={{ top: 15, right: 10, left: -5, bottom: 0 }}
                    barSize={10}
                  >
                    <XAxis type="number" stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="name" stroke="#888888" fontSize={8} width={90} tickLine={false} axisLine={false} />
                    <RechartsTooltip contentStyle={{ fontSize: "9px" }} />
                    <Bar dataKey="currentStock" name="Current Stock" fill="var(--primary)" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="minimumStock" name="Min Limit" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Purchase Analytics Donut and Usage Table Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* Purchase Request Donut Chart Summary */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-4 rounded-xl shadow-xs flex flex-col justify-between min-h-[300px]">
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                <ShoppingBag size={13} className="text-purple-500" />
                Purchase Request Summary
              </h3>
              <p className="text-[9px] text-zinc-400 font-semibold mt-0.5">Procurement request status metrics</p>
            </div>

            {isPurchaseLoading ? (
              <div className="flex-grow flex items-center justify-center">
                <RefreshCw size={20} className="animate-spin text-[var(--primary)]" />
              </div>
            ) : isPurchaseError ? (
              <div className="text-red-500 text-center py-4">Failed to load procurement status.</div>
            ) : (
              <>
                <div className="w-full h-[140px] flex items-center justify-center">
                  <div className="w-[130px] h-[130px]">
                    <PieChart width={130} height={130}>
                      <Pie
                        data={[
                          { name: "Pending", value: purchaseAnalytics.pending },
                          { name: "Approved", value: purchaseAnalytics.approved },
                          { name: "Ordered", value: purchaseAnalytics.ordered },
                          { name: "Rejected", value: purchaseAnalytics.rejected }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={55}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {[0, 1, 2, 3].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(val) => `${val} Requests`} contentStyle={{ fontSize: "9px" }} />
                    </PieChart>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-[9px] font-bold">
                  {[
                    { name: "Pending", val: purchaseAnalytics.pending, color: DONUT_COLORS[0] },
                    { name: "Approved", val: purchaseAnalytics.approved, color: DONUT_COLORS[1] },
                    { name: "Ordered", val: purchaseAnalytics.ordered, color: DONUT_COLORS[2] },
                    { name: "Rejected", val: purchaseAnalytics.rejected, color: DONUT_COLORS[3] }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-zinc-500 dark:text-zinc-400">{item.name}:</span>
                      <span className="text-slate-900 dark:text-white font-black">{item.val}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Ingredient Usage Table Card */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-4 rounded-xl shadow-xs overflow-hidden lg:col-span-2 flex flex-col justify-between min-h-[300px]">
            <div>
              <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-2">
                <h3 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Warehouse size={13} className="text-emerald-500" />
                  Ingredient Consumption Detail
                </h3>
                <input
                  type="text"
                  placeholder="Search ingredient..."
                  value={ingredientSearch}
                  onChange={(e) => { setIngredientSearch(e.target.value); setIngredientPage(1); }}
                  className="px-2.5 py-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-lg focus:outline-none w-36 font-bold"
                />
              </div>

              {isUsageLoading ? (
                <div className="p-8 text-center text-zinc-400">Loading ingredient details...</div>
              ) : paginatedIngredients.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse mt-2 font-semibold text-zinc-700 dark:text-zinc-300">
                    <thead>
                      <tr className="border-b border-zinc-250 dark:border-zinc-850 text-[9px] text-zinc-400 uppercase">
                        <th className="py-2">Ingredient</th>
                        <th className="py-2 text-center">Opening</th>
                        <th className="py-2 text-center">Consumed</th>
                        <th className="py-2 text-center">Purchased</th>
                        <th className="py-2 text-center">Closing</th>
                        <th className="py-2 text-center">Wastage</th>
                        <th className="py-2 text-right">Wastage %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedIngredients.map((item, idx) => (
                        <tr key={idx} className="border-b border-zinc-100 dark:border-zinc-850 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20">
                          <td className="py-2.5 font-bold text-zinc-900 dark:text-white">{item.name}</td>
                          <td className="py-2.5 text-center">{item.openingStock} {item.unit}</td>
                          <td className="py-2.5 text-center font-bold text-[var(--primary)]">{item.consumed} {item.unit}</td>
                          <td className="py-2.5 text-center text-emerald-500">{item.purchased} {item.unit}</td>
                          <td className="py-2.5 text-center font-bold">{item.closingStock} {item.unit}</td>
                          <td className="py-2.5 text-center text-rose-500">{item.wastage} {item.unit}</td>
                          <td className="py-2.5 text-right font-black text-rose-500">{item.wastagePercentage}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-zinc-400 font-bold">No ingredient details found.</div>
              )}
            </div>

            {/* Pagination */}
            {ingredientTotalPages > 1 && (
              <div className="flex justify-between items-center border-t border-zinc-100 dark:border-zinc-800 pt-2 bg-white dark:bg-zinc-900">
                <span className="text-[9px] text-zinc-400 font-bold">Page {ingredientPage} of {ingredientTotalPages}</span>
                <div className="flex gap-1">
                  <button disabled={ingredientPage === 1} onClick={() => setIngredientPage(p => Math.max(p - 1, 1))} className="px-2.5 py-0.5 border border-zinc-250 dark:border-zinc-800 rounded hover:bg-zinc-50 disabled:opacity-40 cursor-pointer">Prev</button>
                  <button disabled={ingredientPage === ingredientTotalPages} onClick={() => setIngredientPage(p => Math.min(p + 1, ingredientTotalPages))} className="px-2.5 py-0.5 border border-zinc-250 dark:border-zinc-800 rounded hover:bg-zinc-50 disabled:opacity-40 cursor-pointer">Next</button>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Generated Inventory Reports Log Table */}
        <section className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 rounded-xl shadow-xs overflow-hidden">
          
          <div className="p-4 border-b border-zinc-100 dark:border-zinc-850 bg-zinc-50/20 dark:bg-zinc-900/10 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white">
                Generated Inventory Reports Logs
              </h3>
              <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">Historical logs list archives</p>
            </div>
            
            {/* Search Input */}
            <div className="flex items-center gap-2 max-w-sm w-full">
              <div className="relative flex-1">
                <Search size={13} className="absolute left-3 top-2.5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search report ID, store..."
                  value={reportSearch}
                  onChange={(e) => setReportSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-855 rounded-xl focus:outline-none focus:border-[var(--primary)] text-zinc-800 dark:text-zinc-250 font-bold"
                />
              </div>
            </div>
          </div>

          {/* Table Container */}
          {isReportsLoading ? (
            <div className="p-8 flex items-center justify-center">
              <RefreshCw size={24} className="animate-spin text-[var(--primary)]" />
            </div>
          ) : isReportsError ? (
            <div className="text-red-500 py-6 text-center">
              Failed to load reports. <button onClick={refetchReports} className="underline font-bold cursor-pointer">Retry</button>
            </div>
          ) : (
            <div className="flex flex-col">
              
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-left border-collapse font-semibold text-zinc-700 dark:text-zinc-300">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-900/30 text-[10px] text-zinc-400 uppercase select-none">
                      <th className="p-3 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/50" onClick={() => handleSort("id")}>
                        Report ID {reportSortField === "id" && (reportSortOrder === "asc" ? "▲" : "▼")}
                      </th>
                      <th className="p-3">Store Location</th>
                      <th className="p-3 text-center">Period Start</th>
                      <th className="p-3 text-center">Period End</th>
                      <th className="p-3 text-center">Consumed</th>
                      <th className="p-3 text-right">valuation</th>
                      <th className="p-3">Generated By</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-center">Created At</th>
                      <th className="p-3 text-center w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportsListData.reports && reportsListData.reports.length > 0 ? (
                      reportsListData.reports.map(rep => (
                        <tr key={rep.id} className="border-b border-zinc-100 dark:border-zinc-850 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20">
                          <td className="p-3 font-bold text-zinc-900 dark:text-white">{rep.id}</td>
                          <td className="p-3 font-bold">{rep.storeName}</td>
                          <td className="p-3 text-center font-mono">{rep.startDate}</td>
                          <td className="p-3 text-center font-mono">{rep.endDate}</td>
                          <td className="p-3 text-center font-bold text-[var(--primary)]">{rep.itemsConsumed} units</td>
                          <td className="p-3 text-right font-black text-slate-900 dark:text-white">₹{rep.stockValue?.toLocaleString("en-IN")}</td>
                          <td className="p-3 text-zinc-400 font-bold">{rep.generatedBy}</td>
                          <td className="p-3 text-center">
                            <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 font-bold text-[9px] uppercase">
                              {rep.status}
                            </span>
                          </td>
                          <td className="p-3 text-center text-zinc-400 font-bold">
                            {new Date(rep.createdAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric"
                            })}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => setDetailReportId(rep.id)}
                                className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-650 dark:text-zinc-300 cursor-pointer"
                                title="View Details"
                              >
                                <Eye size={12} />
                              </button>
                              <button
                                onClick={() => handleDeleteReport(rep.id)}
                                className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-rose-505 cursor-pointer"
                                title="Delete Log"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={10} className="p-8 text-center text-zinc-400 font-bold">
                          No generated inventory reports found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {reportsListData.totalPages > 1 && (
                <div className="p-3 border-t border-zinc-100 dark:border-zinc-850 flex items-center justify-between bg-zinc-50/20 dark:bg-zinc-900/10">
                  <span className="text-[10px] text-zinc-400 font-bold">
                    Page {reportPage} of {reportsListData.totalPages} • Total {reportsListData.totalCount} reports logs
                  </span>
                  
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setReportPage(p => Math.max(p - 1, 1))}
                      disabled={reportPage === 1}
                      className="p-1.5 border border-zinc-250 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 cursor-pointer text-zinc-650 dark:text-zinc-300"
                    >
                      <ChevronLeft size={13} />
                    </button>
                    {[...Array(reportsListData.totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setReportPage(i + 1)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black cursor-pointer ${
                          reportPage === i + 1
                            ? "bg-[var(--primary)] text-white"
                            : "border border-zinc-250 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-850"
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => setReportPage(p => Math.min(p + 1, reportsListData.totalPages))}
                      disabled={reportPage === reportsListData.totalPages}
                      className="p-1.5 border border-zinc-250 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 cursor-pointer text-zinc-650 dark:text-zinc-300"
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
