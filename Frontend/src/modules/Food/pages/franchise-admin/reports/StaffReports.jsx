import React, { useState } from "react";
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  Truck, 
  Pizza, 
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
  Star,
  Award,
  Calendar,
  AlertCircle
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
  Cell
} from "recharts";

import { 
  useStaffDashboard,
  useStaffRoleDistribution,
  useStaffAttendanceTrend,
  useDeliveryPerformance,
  useKitchenPerformance,
  useManagerPerformance,
  useStaffDetailedList,
  useStaffReportsList,
  useDeleteStaffReport,
  useDebounce
} from "./hooks/useStaffReport";
import { useStoresDropdown } from "./hooks/useSalesReport";

import GenerateStaffReportModal from "./components/GenerateStaffReportModal";
import StaffDetailModal from "./components/StaffDetailModal";
import ExportStaffReportModal from "./components/ExportStaffReportModal";
import { toast } from "sonner";

export default function StaffReports() {
  // Filter States
  const [dateRange, setDateRange] = useState("This Month");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [selectedStore, setSelectedStore] = useState("all");
  const [selectedRole, setSelectedRole] = useState("All Roles");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [filtersOpen, setFiltersOpen] = useState(true);

  // Active filters passed to APIs
  const [activeFilters, setActiveFilters] = useState({
    startDate: "",
    endDate: "",
    storeId: "all",
    role: "All Roles",
    status: "All"
  });

  // Table searches and paginations
  const [staffSearch, setStaffSearch] = useState("");
  const debouncedStaffSearch = useDebounce(staffSearch, 400);
  const [staffPage, setStaffPage] = useState(1);
  const [staffSortField, setStaffSortField] = useState("joiningDate");
  const [staffSortOrder, setStaffSortOrder] = useState("desc");

  // Performance Tables local searches/paginations
  const [riderSearch, setRiderSearch] = useState("");
  const [kitchenSearch, setKitchenSearch] = useState("");
  const [managerSearch, setManagerSearch] = useState("");

  const [riderPage, setRiderPage] = useState(1);
  const [kitchenPage, setKitchenPage] = useState(1);
  const [managerPage, setManagerPage] = useState(1);
  const perfLimit = 3;

  // Modals state
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [detailStaffId, setDetailStaffId] = useState(null);
  const [exportReportId, setExportReportId] = useState(null);

  // API Queries
  const { data: storesList } = useStoresDropdown();
  const { data: dashboardData, isLoading: isDashboardLoading, isError: isDashboardError, refetch: refetchDashboard } = useStaffDashboard(activeFilters);
  const { data: roleDistribution, isLoading: isRoleLoading, isError: isRoleError, refetch: refetchRole } = useStaffRoleDistribution(activeFilters);
  const { data: attendanceTrend, isLoading: isAttendanceLoading, isError: isAttendanceError, refetch: refetchAttendance } = useStaffAttendanceTrend(activeFilters);
  const { data: deliveryPerformance, isLoading: isDeliveryLoading, isError: isDeliveryError, refetch: refetchDelivery } = useDeliveryPerformance(activeFilters);
  const { data: kitchenPerformance, isLoading: isKitchenLoading, isError: isKitchenError, refetch: refetchKitchen } = useKitchenPerformance(activeFilters);
  const { data: managerPerformance, isLoading: isManagerLoading, isError: isManagerError, refetch: refetchManager } = useManagerPerformance(activeFilters);
  
  const staffLimit = 5;
  const { data: staffListData, isLoading: isStaffListLoading, isError: isStaffListError, refetch: refetchStaffList } = useStaffDetailedList({
    search: debouncedStaffSearch,
    page: staffPage,
    limit: staffLimit,
    sortBy: staffSortField,
    sortOrder: staffSortOrder,
    role: activeFilters.role,
    status: activeFilters.status,
    storeId: activeFilters.storeId
  });

  const { data: generatedReports, isLoading: isReportsLoading, isError: isReportsError, refetch: refetchReports } = useStaffReportsList();
  const deleteReportMutation = useDeleteStaffReport();

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
      role: selectedRole,
      status: selectedStatus
    });
    setStaffPage(1);
    toast.success("Filters applied successfully.");
  };

  // Reset Filters
  const handleResetFilters = () => {
    setDateRange("This Month");
    setCustomStartDate("");
    setCustomEndDate("");
    setSelectedStore("all");
    setSelectedRole("All Roles");
    setSelectedStatus("All");
    setActiveFilters({
      startDate: "",
      endDate: "",
      storeId: "all",
      role: "All Roles",
      status: "All"
    });
    setStaffPage(1);
    toast.success("Filters reset to default.");
  };

  // Refresh All API Data
  const handleRefreshAll = () => {
    refetchDashboard();
    refetchRole();
    refetchAttendance();
    refetchDelivery();
    refetchKitchen();
    refetchManager();
    refetchStaffList();
    refetchReports();
    toast.success("Refreshing staff dashboard data...");
  };

  // Delete generated staff report log
  const handleDeleteReport = async (id) => {
    if (confirm("Are you sure you want to delete this generated report record?")) {
      try {
        await deleteReportMutation.mutateAsync(id);
        toast.success("Report log deleted successfully.");
        refetchReports();
      } catch (err) {
        toast.error("Failed to delete report log.");
      }
    }
  };

  // Export actions on page level
  const handlePageExport = (type) => {
    if (!staffListData?.staff || staffListData.staff.length === 0) {
      toast.error("No staff data available to export");
      return;
    }
    toast.success(`Exporting staff directory as ${type}...`);
    
    let content = "Employee ID,Name,Role,Store,Attendance %,Performance Score,Status,Joining Date\n" +
      staffListData.staff.map(s => `"${s.id}","${s.name}","${s.role}","${s.store}",${s.attendancePercentage}%,${s.performanceScore}/100,"${s.status}","${s.joiningDate}"`).join("\n");
      
    const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `staff-performance-audit.${type.toLowerCase() === "pdf" ? "txt" : "csv"}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Sort handler
  const handleSort = (field) => {
    if (staffSortField === field) {
      setStaffSortOrder(staffSortOrder === "asc" ? "desc" : "asc");
    } else {
      setStaffSortField(field);
      setStaffSortOrder("desc");
    }
    setStaffPage(1);
  };

  // Filtering sub-performance tables client side
  const filteredRiders = (deliveryPerformance || [])
    .filter(r => r.name.toLowerCase().includes(riderSearch.toLowerCase()));
  const paginatedRiders = filteredRiders.slice((riderPage - 1) * perfLimit, riderPage * perfLimit);
  const riderTotalPages = Math.ceil(filteredRiders.length / perfLimit);

  const filteredKitchen = (kitchenPerformance || [])
    .filter(k => k.name.toLowerCase().includes(kitchenSearch.toLowerCase()));
  const paginatedKitchen = filteredKitchen.slice((kitchenPage - 1) * perfLimit, kitchenPage * perfLimit);
  const kitchenTotalPages = Math.ceil(filteredKitchen.length / perfLimit);

  const filteredManagers = (managerPerformance || [])
    .filter(m => m.name.toLowerCase().includes(managerSearch.toLowerCase()));
  const paginatedManagers = filteredManagers.slice((managerPage - 1) * perfLimit, managerPage * perfLimit);
  const managerTotalPages = Math.ceil(filteredManagers.length / perfLimit);

  // Chart Colors
  const PIE_COLORS = ["var(--primary)", "var(--sa-secondary, #3b82f6)", "#10b981"];

  const getStatusBadge = (status) => {
    const s = status.toLowerCase();
    if (s === "active") return "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400";
    if (s === "suspended") return "bg-rose-50 text-rose-600 dark:bg-rose-955/20 dark:text-rose-400";
    return "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-955 text-zinc-850 dark:text-zinc-250 transition-all duration-300 text-xs select-none">
      
      {/* Modals */}
      <GenerateStaffReportModal isOpen={isGenerateOpen} onClose={() => {
        setIsGenerateOpen(false);
        refetchReports();
      }} />
      
      {detailStaffId && (
        <StaffDetailModal 
          isOpen={!!detailStaffId} 
          staffId={detailStaffId} 
          onClose={() => setDetailStaffId(null)} 
        />
      )}

      {exportReportId && (
        <ExportStaffReportModal
          isOpen={!!exportReportId}
          reportId={exportReportId}
          onClose={() => setExportReportId(null)}
        />
      )}

      {/* Main Page Layout */}
      <div className="p-3 md:p-5 space-y-4">
        
        {/* Page Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-150 dark:border-zinc-850 shadow-xs">
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
              Staff Reports
            </h1>
            <p className="text-[10px] text-zinc-400 font-bold mt-0.5">
              Monitor employee productivity and operational performance across all stores.
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
                
                {/* Date Range Selection */}
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

                {/* Store location filter */}
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

                {/* Role filter */}
                <div className="space-y-1">
                  <label className="block text-zinc-400 font-bold">Employee Role</label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full px-2.5 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-lg text-slate-800 dark:text-zinc-250 cursor-pointer"
                  >
                    <option value="All Roles">All Roles</option>
                    <option value="Store Manager">Store Manager</option>
                    <option value="Kitchen Staff">Kitchen Staff</option>
                    <option value="Delivery Partner">Delivery Partner</option>
                  </select>
                </div>

                {/* Employee Status filter */}
                <div className="space-y-1">
                  <label className="block text-zinc-400 font-bold">Status</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-2.5 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-lg text-slate-800 dark:text-zinc-250 cursor-pointer"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Suspended">Suspended</option>
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

        {/* Dashboard KPI cards */}
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
            
            {/* Total Employees */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-4 rounded-xl shadow-xs flex flex-col justify-between">
              <span className="text-[10px] text-zinc-400 font-extrabold uppercase">Total Employees</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-lg font-black text-slate-900 dark:text-white">{dashboardData.totalEmployees}</span>
                <span className="p-1 rounded-md bg-zinc-100 dark:bg-zinc-800">
                  <Users size={12} className="text-[var(--primary)]" />
                </span>
              </div>
            </div>

            {/* Active Employees */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-4 rounded-xl shadow-xs flex flex-col justify-between">
              <span className="text-[10px] text-zinc-400 font-extrabold uppercase">Active Now</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-lg font-black text-slate-900 dark:text-white">{dashboardData.activeEmployees}</span>
                <span className="p-1 rounded-md bg-zinc-100 dark:bg-zinc-800">
                  <CheckCircle2 size={12} className="text-emerald-500" />
                </span>
              </div>
            </div>

            {/* Attendance Percentage */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-4 rounded-xl shadow-xs flex flex-col justify-between">
              <span className="text-[10px] text-zinc-400 font-extrabold uppercase">Attendance Avg</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-lg font-black text-slate-900 dark:text-white">{dashboardData.attendancePercentage}%</span>
                <span className="p-1 rounded-md bg-zinc-100 dark:bg-zinc-800">
                  <TrendingUp size={12} className="text-blue-500" />
                </span>
              </div>
            </div>

            {/* Average Working Hours */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-4 rounded-xl shadow-xs flex flex-col justify-between">
              <span className="text-[10px] text-zinc-400 font-extrabold uppercase">Avg shift hours</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-lg font-black text-slate-900 dark:text-white">{dashboardData.averageWorkingHours} hrs</span>
                <span className="p-1 rounded-md bg-zinc-100 dark:bg-zinc-800">
                  <Clock size={12} className="text-amber-500" />
                </span>
              </div>
            </div>

            {/* Completed Deliveries */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-4 rounded-xl shadow-xs flex flex-col justify-between">
              <span className="text-[10px] text-zinc-400 font-extrabold uppercase">Completed Deliveries</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-lg font-black text-slate-900 dark:text-white">{dashboardData.completedDeliveries?.toLocaleString()}</span>
                <span className="p-1 rounded-md bg-zinc-100 dark:bg-zinc-800">
                  <Truck size={12} className="text-purple-500" />
                </span>
              </div>
            </div>

            {/* Kitchen Productivity */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-4 rounded-xl shadow-xs flex flex-col justify-between">
              <span className="text-[10px] text-zinc-400 font-extrabold uppercase">Kitchen productivity</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-lg font-black text-slate-900 dark:text-white">{dashboardData.kitchenProductivity} / staff</span>
                <span className="p-1 rounded-md bg-zinc-100 dark:bg-zinc-800">
                  <Pizza size={12} className="text-pink-500" />
                </span>
              </div>
            </div>

          </div>
        )}

        {/* Visual Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* Employee Distribution Pie Chart */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-4 rounded-xl shadow-xs flex flex-col justify-between min-h-[320px]">
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Users size={14} className="text-[var(--primary)]" />
                Employee Role Distribution
              </h3>
              <p className="text-[9px] text-zinc-400 font-semibold mt-0.5">Staff allocation split</p>
            </div>

            {isRoleLoading ? (
              <div className="flex-grow flex items-center justify-center h-48">
                <RefreshCw size={24} className="animate-spin text-[var(--primary)]" />
              </div>
            ) : isRoleError ? (
              <div className="text-red-500 text-center py-6">
                Failed to load distribution. <button onClick={refetchRole} className="underline text-[10px] cursor-pointer">Retry</button>
              </div>
            ) : (
              <>
                <div className="w-full h-[180px] flex items-center justify-center">
                  <div className="w-[180px] h-[180px]">
                    <PieChart width={180} height={180}>
                      <Pie
                        data={[
                          { name: "Store Managers", value: roleDistribution.managers },
                          { name: "Kitchen Staff", value: roleDistribution.kitchenStaff },
                          { name: "Delivery Partners", value: roleDistribution.deliveryPartners }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {[0, 1, 2].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(val) => `${val} Employees`} contentStyle={{ fontSize: "9px" }} />
                    </PieChart>
                  </div>
                </div>

                {/* Legend labels */}
                <div className="grid grid-cols-3 gap-1.5 text-[9px] font-bold text-center">
                  {[
                    { name: "Managers", val: roleDistribution.managers, color: PIE_COLORS[0] },
                    { name: "Kitchen Staff", val: roleDistribution.kitchenStaff, color: PIE_COLORS[1] },
                    { name: "Riders", val: roleDistribution.deliveryPartners, color: PIE_COLORS[2] }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-zinc-500 dark:text-zinc-400 truncate">{item.name}:</span>
                      <span className="text-slate-900 dark:text-white font-black">{item.val}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Attendance Trend Line Chart */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-4 rounded-xl shadow-xs flex flex-col justify-between min-h-[320px]">
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-500" />
                Attendance Trend
              </h3>
              <p className="text-[9px] text-zinc-400 font-semibold mt-0.5">Average weekly attendance timeline</p>
            </div>

            {isAttendanceLoading ? (
              <div className="flex-grow flex items-center justify-center h-48">
                <RefreshCw size={24} className="animate-spin text-[var(--primary)]" />
              </div>
            ) : isAttendanceError ? (
              <div className="text-red-500 text-center py-6">
                Failed to load trend. <button onClick={refetchAttendance} className="underline text-[10px] cursor-pointer">Retry</button>
              </div>
            ) : (
              <div className="w-full h-[220px] overflow-x-auto scrollbar-thin">
                <div className="w-[450px] h-[210px]">
                  <LineChart width={450} height={210} data={attendanceTrend} margin={{ top: 15, right: 10, left: -25, bottom: 0 }}>
                    <XAxis dataKey="date" stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} />
                    <RechartsTooltip contentStyle={{ fontSize: "9px" }} formatter={(val) => `${val}%`} />
                    <Line type="monotone" dataKey="attendancePercentage" name="Attendance Rate" stroke="var(--primary)" strokeWidth={2} activeDot={{ r: 4 }} />
                  </LineChart>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Sub Performance Section: Delivery Riders, Kitchen, Managers */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          
          {/* Delivery Rider Performance Table */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-4 rounded-xl shadow-xs overflow-hidden flex flex-col justify-between min-h-[300px]">
            <div>
              <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-2">
                <h3 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1">
                  <Truck size={13} className="text-blue-500" />
                  Rider Leaderboard
                </h3>
                <input
                  type="text"
                  placeholder="Search rider..."
                  value={riderSearch}
                  onChange={(e) => { setRiderSearch(e.target.value); setRiderPage(1); }}
                  className="px-2 py-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-lg focus:outline-none w-28 text-[10px]"
                />
              </div>

              {isDeliveryLoading ? (
                <div className="p-6 text-center text-zinc-400">Loading riders...</div>
              ) : paginatedRiders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse mt-2 font-semibold text-zinc-700 dark:text-zinc-300">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-850 text-[9px] text-zinc-400 uppercase">
                        <th className="py-2">Rider</th>
                        <th className="py-2 text-center">Done</th>
                        <th className="py-2 text-center">AOV Speed</th>
                        <th className="py-2 text-right">Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedRiders.map(rider => (
                        <tr key={rider.id} className="border-b border-zinc-100 dark:border-zinc-850 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20">
                          <td className="py-2.5 font-bold text-zinc-900 dark:text-white">{rider.name}</td>
                          <td className="py-2.5 text-center font-bold">{rider.completedDeliveries}</td>
                          <td className="py-2.5 text-center text-zinc-400">{rider.avgDeliveryTime}m</td>
                          <td className="py-2.5 text-right font-black text-emerald-500">{rider.performanceScore}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-zinc-400 font-bold">No riders found.</div>
              )}
            </div>

            {/* Pagination */}
            {riderTotalPages > 1 && (
              <div className="flex justify-between items-center border-t border-zinc-100 dark:border-zinc-800 pt-2 bg-white dark:bg-zinc-900">
                <span className="text-[9px] text-zinc-400 font-bold">Page {riderPage} / {riderTotalPages}</span>
                <div className="flex gap-1">
                  <button disabled={riderPage === 1} onClick={() => setRiderPage(p => Math.max(p - 1, 1))} className="px-2 py-0.5 border border-zinc-250 dark:border-zinc-800 rounded hover:bg-zinc-50 disabled:opacity-40 cursor-pointer">Prev</button>
                  <button disabled={riderPage === riderTotalPages} onClick={() => setRiderPage(p => Math.min(p + 1, riderTotalPages))} className="px-2 py-0.5 border border-zinc-250 dark:border-zinc-800 rounded hover:bg-zinc-50 disabled:opacity-40 cursor-pointer">Next</button>
                </div>
              </div>
            )}
          </div>

          {/* Kitchen Staff Performance Table */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-4 rounded-xl shadow-xs overflow-hidden flex flex-col justify-between min-h-[300px]">
            <div>
              <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-2">
                <h3 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1">
                  <Pizza size={13} className="text-amber-500" />
                  Kitchen Productivity
                </h3>
                <input
                  type="text"
                  placeholder="Search staff..."
                  value={kitchenSearch}
                  onChange={(e) => { setKitchenSearch(e.target.value); setKitchenPage(1); }}
                  className="px-2 py-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-lg focus:outline-none w-28 text-[10px]"
                />
              </div>

              {isKitchenLoading ? (
                <div className="p-6 text-center text-zinc-400">Loading kitchen...</div>
              ) : paginatedKitchen.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse mt-2 font-semibold text-zinc-700 dark:text-zinc-300">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-850 text-[9px] text-zinc-400 uppercase">
                        <th className="py-2">Chef</th>
                        <th className="py-2 text-center">Prepared</th>
                        <th className="py-2 text-center">Speed</th>
                        <th className="py-2 text-right">Efficiency</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedKitchen.map(chef => (
                        <tr key={chef.id} className="border-b border-zinc-100 dark:border-zinc-850 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20">
                          <td className="py-2.5 font-bold text-zinc-900 dark:text-white">{chef.name}</td>
                          <td className="py-2.5 text-center font-bold">{chef.ordersPrepared}</td>
                          <td className="py-2.5 text-center text-zinc-400">{chef.avgPrepTime}m</td>
                          <td className="py-2.5 text-right font-black text-emerald-500">{chef.efficiencyPercentage}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-zinc-400 font-bold">No kitchen staff found.</div>
              )}
            </div>

            {/* Pagination */}
            {kitchenTotalPages > 1 && (
              <div className="flex justify-between items-center border-t border-zinc-100 dark:border-zinc-800 pt-2 bg-white dark:bg-zinc-900">
                <span className="text-[9px] text-zinc-400 font-bold">Page {kitchenPage} / {kitchenTotalPages}</span>
                <div className="flex gap-1">
                  <button disabled={kitchenPage === 1} onClick={() => setKitchenPage(p => Math.max(p - 1, 1))} className="px-2 py-0.5 border border-zinc-250 dark:border-zinc-800 rounded hover:bg-zinc-50 disabled:opacity-40 cursor-pointer">Prev</button>
                  <button disabled={kitchenPage === kitchenTotalPages} onClick={() => setKitchenPage(p => Math.min(p + 1, kitchenTotalPages))} className="px-2 py-0.5 border border-zinc-250 dark:border-zinc-800 rounded hover:bg-zinc-50 disabled:opacity-40 cursor-pointer">Next</button>
                </div>
              </div>
            )}
          </div>

          {/* Store Managers Performance Table */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-4 rounded-xl shadow-xs overflow-hidden flex flex-col justify-between min-h-[300px]">
            <div>
              <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-2">
                <h3 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1">
                  <Award size={13} className="text-purple-500" />
                  Manager Performance
                </h3>
                <input
                  type="text"
                  placeholder="Search manager..."
                  value={managerSearch}
                  onChange={(e) => { setManagerSearch(e.target.value); setManagerPage(1); }}
                  className="px-2 py-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-855 rounded-lg focus:outline-none w-28 text-[10px]"
                />
              </div>

              {isManagerLoading ? (
                <div className="p-6 text-center text-zinc-400">Loading managers...</div>
              ) : paginatedManagers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse mt-2 font-semibold text-zinc-700 dark:text-zinc-300">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-850 text-[9px] text-zinc-400 uppercase">
                        <th className="py-2">Manager</th>
                        <th className="py-2 text-center">Managed</th>
                        <th className="py-2 text-right">Revenue</th>
                        <th className="py-2 text-right">Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedManagers.map(mgr => (
                        <tr key={mgr.id} className="border-b border-zinc-100 dark:border-zinc-855 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20">
                          <td className="py-2.5 font-bold text-zinc-900 dark:text-white">{mgr.name}</td>
                          <td className="py-2.5 text-center font-bold">{mgr.ordersManaged}</td>
                          <td className="py-2.5 text-right text-zinc-400">₹{(mgr.revenue / 1000).toFixed(0)}k</td>
                          <td className="py-2.5 text-right font-black text-emerald-500">{mgr.performanceScore}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-zinc-400 font-bold">No managers found.</div>
              )}
            </div>

            {/* Pagination */}
            {managerTotalPages > 1 && (
              <div className="flex justify-between items-center border-t border-zinc-100 dark:border-zinc-800 pt-2 bg-white dark:bg-zinc-900">
                <span className="text-[9px] text-zinc-400 font-bold">Page {managerPage} / {managerTotalPages}</span>
                <div className="flex gap-1">
                  <button disabled={managerPage === 1} onClick={() => setManagerPage(p => Math.max(p - 1, 1))} className="px-2 py-0.5 border border-zinc-250 dark:border-zinc-800 rounded hover:bg-zinc-50 disabled:opacity-40 cursor-pointer">Prev</button>
                  <button disabled={managerPage === managerTotalPages} onClick={() => setManagerPage(p => Math.min(p + 1, managerTotalPages))} className="px-2 py-0.5 border border-zinc-250 dark:border-zinc-800 rounded hover:bg-zinc-50 disabled:opacity-40 cursor-pointer">Next</button>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Detailed Staff list Table */}
        <section className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 rounded-xl shadow-xs overflow-hidden">
          
          <div className="p-4 border-b border-zinc-100 dark:border-zinc-850 bg-zinc-50/20 dark:bg-zinc-900/10 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white">
                Employee Performance Audit Log
              </h3>
              <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">Filter, sort, search, and audit employee shift timings</p>
            </div>
            
            {/* Search input */}
            <div className="flex items-center gap-2 max-w-sm w-full">
              <div className="relative flex-1">
                <Search size={13} className="absolute left-3 top-2.5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search staff, store, role..."
                  value={staffSearch}
                  onChange={(e) => setStaffSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl focus:outline-none focus:border-[var(--primary)] text-zinc-800 dark:text-zinc-250 font-bold"
                />
              </div>
            </div>
          </div>

          {/* Table Container */}
          {isStaffListLoading ? (
            <div className="p-8 flex items-center justify-center">
              <RefreshCw size={24} className="animate-spin text-[var(--primary)]" />
            </div>
          ) : isStaffListError ? (
            <div className="text-red-500 py-6 text-center">
              Failed to load employee list. <button onClick={refetchStaffList} className="underline font-bold cursor-pointer">Retry</button>
            </div>
          ) : (
            <div className="flex flex-col">
              
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-left border-collapse font-semibold text-zinc-700 dark:text-zinc-300">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-900/30 text-[10px] text-zinc-400 uppercase select-none">
                      <th className="p-3 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/50" onClick={() => handleSort("id")}>
                        ID {staffSortField === "id" && (staffSortOrder === "asc" ? "▲" : "▼")}
                      </th>
                      <th className="p-3">Photo</th>
                      <th className="p-3 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/50" onClick={() => handleSort("name")}>
                        Name {staffSortField === "name" && (staffSortOrder === "asc" ? "▲" : "▼")}
                      </th>
                      <th className="p-3 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/50" onClick={() => handleSort("role")}>
                        Role {staffSortField === "role" && (staffSortOrder === "asc" ? "▲" : "▼")}
                      </th>
                      <th className="p-3 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/50" onClick={() => handleSort("store")}>
                        Store {staffSortField === "store" && (staffSortOrder === "asc" ? "▲" : "▼")}
                      </th>
                      <th className="p-3 text-center cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/50" onClick={() => handleSort("attendancePercentage")}>
                        Attendance % {staffSortField === "attendancePercentage" && (staffSortOrder === "asc" ? "▲" : "▼")}
                      </th>
                      <th className="p-3 text-center cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/50" onClick={() => handleSort("performanceScore")}>
                        Perf Score {staffSortField === "performanceScore" && (staffSortOrder === "asc" ? "▲" : "▼")}
                      </th>
                      <th className="p-3 text-center cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/50" onClick={() => handleSort("status")}>
                        Status {staffSortField === "status" && (staffSortOrder === "asc" ? "▲" : "▼")}
                      </th>
                      <th className="p-3 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/50" onClick={() => handleSort("joiningDate")}>
                        Joining Date {staffSortField === "joiningDate" && (staffSortOrder === "asc" ? "▲" : "▼")}
                      </th>
                      <th className="p-3 text-center w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffListData.staff && staffListData.staff.length > 0 ? (
                      staffListData.staff.map(member => (
                        <tr key={member.id} className="border-b border-zinc-100 dark:border-zinc-850 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20">
                          <td className="p-3 font-bold text-zinc-900 dark:text-white">{member.id}</td>
                          <td className="p-3">
                            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-zinc-150 dark:border-zinc-800 shrink-0">
                              <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                            </div>
                          </td>
                          <td className="p-3 font-bold">{member.name}</td>
                          <td className="p-3 font-bold text-slate-800 dark:text-zinc-200">
                            <span className="px-2 py-0.5 rounded-md bg-zinc-50 dark:bg-zinc-800 text-[10px]">
                              {member.role}
                            </span>
                          </td>
                          <td className="p-3 text-zinc-500 dark:text-zinc-400">{member.store}</td>
                          <td className="p-3 text-center font-bold text-emerald-500">{member.attendancePercentage}%</td>
                          <td className="p-3 text-center font-black text-slate-900 dark:text-white">{member.performanceScore}/100</td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded-md font-bold uppercase text-[9px] ${getStatusBadge(member.status)}`}>
                              {member.status}
                            </span>
                          </td>
                          <td className="p-3 text-zinc-400 font-bold">
                            {new Date(member.joiningDate).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric"
                            })}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => setDetailStaffId(member.id)}
                                className="px-2.5 py-1 text-[10px] font-black text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-lg shadow-sm cursor-pointer"
                              >
                                View Details
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={10} className="p-8 text-center text-zinc-400 font-bold">
                          No matching staff members found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
              {staffListData.totalPages > 1 && (
                <div className="p-3 border-t border-zinc-100 dark:border-zinc-850 flex items-center justify-between bg-zinc-50/20 dark:bg-zinc-900/10">
                  <span className="text-[10px] text-zinc-400 font-bold">
                    Page {staffPage} of {staffListData.totalPages} • Total {staffListData.totalCount} employees
                  </span>
                  
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setStaffPage(p => Math.max(p - 1, 1))}
                      disabled={staffPage === 1}
                      className="p-1.5 border border-zinc-250 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 cursor-pointer text-zinc-650 dark:text-zinc-300"
                    >
                      <ChevronLeft size={13} />
                    </button>
                    {[...Array(staffListData.totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setStaffPage(i + 1)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black cursor-pointer ${
                          staffPage === i + 1
                            ? "bg-[var(--primary)] text-white"
                            : "border border-zinc-250 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-850"
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => setStaffPage(p => Math.min(p + 1, staffListData.totalPages))}
                      disabled={staffPage === staffListData.totalPages}
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

        {/* Generated Staff Reports History log */}
        <section className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-855 rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-zinc-100 dark:border-zinc-850 bg-zinc-50/20 dark:bg-zinc-900/10">
            <h3 className="font-extrabold text-slate-900 dark:text-white">
              Generated Reports Audit Logs
            </h3>
            <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">Summary reports history logs database</p>
          </div>

          {isReportsLoading ? (
            <div className="p-6 text-center text-zinc-400">Loading logs...</div>
          ) : generatedReports && generatedReports.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-semibold text-zinc-700 dark:text-zinc-300">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-900/30 text-[10px] text-zinc-400 uppercase">
                    <th className="p-3">Report Number</th>
                    <th className="p-3">Role Scope</th>
                    <th className="p-3">Store Location</th>
                    <th className="p-3 text-center">Period Start</th>
                    <th className="p-3 text-center">Period End</th>
                    <th className="p-3">Compiled By</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Created At</th>
                    <th className="p-3 text-center w-24">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {generatedReports.map(rep => (
                    <tr key={rep.id} className="border-b border-zinc-100 dark:border-zinc-850 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20">
                      <td className="p-3 font-bold text-zinc-900 dark:text-white">{rep.id}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 font-bold uppercase text-[9px]">
                          {rep.role}
                        </span>
                      </td>
                      <td className="p-3 text-zinc-500 dark:text-zinc-400 truncate max-w-[120px]">{rep.storeName}</td>
                      <td className="p-3 text-center font-mono">{rep.startDate}</td>
                      <td className="p-3 text-center font-mono">{rep.endDate}</td>
                      <td className="p-3">{rep.generatedBy}</td>
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
                            onClick={() => setExportReportId(rep.id)}
                            className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-650 dark:text-zinc-300 cursor-pointer"
                            title="Export Options"
                          >
                            <Eye size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteReport(rep.id)}
                            className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-rose-500 cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-zinc-400 font-bold">No generated reports logs found.</div>
          )}
        </section>

      </div>
    </div>
  );
}
