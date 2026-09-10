import React, { useState, useEffect } from "react";
import { useSearchParams, useOutletContext } from "react-router-dom";
import { toast } from "sonner";
import { 
  RefreshCw, 
  Download, 
  AlertCircle, 
  ShieldCheck, 
  Activity,
  CheckCircle2
} from "lucide-react";

// Import hooks
import { useAlertsDashboard } from "./hooks/useAlertsDashboard";
import { useInventoryAlerts } from "./hooks/useInventoryAlerts";

// Import components
import { AlertsDashboardCards } from "./components/AlertsDashboardCards";
import { AlertsFilters } from "./components/AlertsFilters";
import { AlertsTable } from "./components/AlertsTable";
import { Pagination } from "./components/Pagination";

// Import modals
import { AlertDetailsModal } from "./components/AlertDetailsModal";
import { ResolveAlertModal } from "./components/ResolveAlertModal";
import { AlertCreateRequestModal } from "./components/AlertCreateRequestModal";

export default function LowStockAlerts() {
  // Retrieve role from Outlet Context
  const { role = "store_manager" } = useOutletContext();

  // Search parameters for URL persistence
  const [searchParams, setSearchParams] = useSearchParams();

  // Modal control states
  const [activeDetailsId, setActiveDetailsId] = useState(null);
  const [activeResolveAlert, setActiveResolveAlert] = useState(null);
  const [selectedRequestAlert, setSelectedRequestAlert] = useState(null);

  // Auto-refresh state (default to true)
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Table State
  const [rowSelection, setRowSelection] = useState({});
  const [sorting, setSorting] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});

  // 1. Resolve Current User Name based on active role
  const getCurrentUser = () => {
    switch (role) {
      case "kitchen_staff":
        return "Aman Verma";
      case "kitchen_supervisor":
        return "Vijay Saxena";
      case "store_manager":
      default:
        return "Shubham Jamliya";
    }
  };

  const currentUser = getCurrentUser();

  // 2. Parse Filters from URL
  const filters = {
    page: Number(searchParams.get("page")) || 1,
    limit: Number(searchParams.get("limit")) || 10,
    search: searchParams.get("search") || "",
    severity: searchParams.get("severity") || "All",
    status: searchParams.get("status") || "All",
    from: searchParams.get("from") || "",
    to: searchParams.get("to") || ""
  };

  // 3. Fetch Data (Tanstack Queries)
  const { 
    data: dashboardData, 
    isLoading: isDashboardLoading, 
    refetch: refetchDashboard 
  } = useAlertsDashboard();

  const { 
    data: alertsData, 
    isLoading: isAlertsLoading, 
    refetch: refetchAlerts 
  } = useInventoryAlerts(filters, {
    refetchInterval: autoRefresh ? 30000 : false
  });

  // Consolidated Refresh Handler
  const handleRefresh = () => {
    toast.promise(
      Promise.all([refetchDashboard(), refetchAlerts()]),
      {
        loading: "Syncing inventory alerts ledger...",
        success: "Alerts ledger is up-to-date!",
        error: "Failed to reload inventory alerts."
      }
    );
  };

  // URL state modification handlers
  const handleFilterChange = (key, value) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value && value !== "All") {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      if (key !== "page") {
        next.set("page", "1");
      }
      return next;
    });
  };

  const handleResetFilters = () => {
    setSearchParams(new URLSearchParams({ page: "1", limit: "10" }));
    toast.success("Filters reset to default.");
  };

  // Client-side CSV Exporter
  const handleExportCSV = () => {
    if (!alertsData?.data || alertsData.data.length === 0) {
      toast.warning("No alerts found to export.");
      return;
    }

    try {
      const headers = ["Alert ID", "Ingredient SKU ID", "Ingredient Name", "Alert Type", "Current Stock", "Minimum Stock", "Severity", "Status", "Date Generated", "Resolved By", "Resolution Date", "Notes"];
      
      const csvRows = [
        headers.join(","),
        ...alertsData.data.map(item => [
          item._id,
          item.ingredientId,
          `"${item.ingredientName.replace(/"/g, '""')}"`,
          item.alertType,
          item.currentStock,
          item.minimumStock,
          item.severity,
          item.status,
          item.createdAt,
          `"${item.resolvedBy || "N/A"}"`,
          item.resolvedAt || "N/A",
          `"${(item.resolutionNote || "").replace(/"/g, '""')}"`
        ].join(","))
      ];

      const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `pvp_inventory_alerts_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("CSV alerts report downloaded successfully.");
    } catch (err) {
      toast.error("Failed to export alerts report.");
    }
  };

  const isManager = role === "store_manager";
  const hasNoActiveAlerts = dashboardData?.activeAlerts === 0;

  return (
    <div className="p-4 md:p-5 space-y-6 select-none font-sans">
      
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-zinc-150 dark:border-zinc-800 shadow-sm transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-955/20 text-amber-500 flex items-center justify-center border border-amber-100 dark:border-amber-900/30 shrink-0">
            <AlertCircle size={20} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
              Low Stock Alerts
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-[10px] mt-0.5 font-bold">
              Monitor inventory stock exceptions and trigger automatic stock request workflows.
            </p>
          </div>
        </div>

        {/* Top Right Actions */}
        <div className="flex flex-wrap items-center gap-2 select-none">
          {/* Auto Refresh Toggle */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-850 bg-slate-50/50 dark:bg-zinc-950/20 text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
            <Activity size={12} className={autoRefresh ? "text-emerald-500 animate-pulse" : "text-zinc-405"} />
            <label className="cursor-pointer flex items-center gap-1">
              <input 
                type="checkbox" 
                checked={autoRefresh} 
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded text-[var(--primary)] focus:ring-[var(--primary)] w-3.5 h-3.5 border-zinc-300 cursor-pointer"
              />
              Auto-sync (30s)
            </label>
          </div>

          <button
            onClick={handleRefresh}
            className="h-8 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all flex items-center justify-center bg-white dark:bg-zinc-900 cursor-pointer"
            title="Reload Ledger"
          >
            <RefreshCw size={13} className="text-zinc-600 dark:text-zinc-400" />
          </button>

          {isManager && (
            <button
              onClick={handleExportCSV}
              className="h-8 px-3 rounded-lg border border-zinc-200 dark:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-800 font-bold text-xs text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 bg-white dark:bg-zinc-900 transition-all cursor-pointer shadow-sm"
            >
              <Download size={13} />
              Export CSV
            </button>
          )}
        </div>
      </div>

      {/* 2. Dashboard Cards */}
      <AlertsDashboardCards data={dashboardData} isLoading={isDashboardLoading} />

      {/* 3. Success Illustration (when stock is fully optimal) */}
      {hasNoActiveAlerts && !isDashboardLoading && (
        <div className="bg-emerald-50/20 dark:bg-emerald-950/10 border border-emerald-150/50 dark:border-emerald-900/20 rounded-3xl p-6 md:p-8 flex flex-col items-center justify-center text-center shadow-sm max-w-2xl mx-auto space-y-4">
          <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/30 text-emerald-500 dark:text-emerald-400 rounded-full flex items-center justify-center border border-emerald-200/50 dark:border-emerald-900/30 animate-pulse">
            <CheckCircle2 size={32} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">
              All Stock Levels Optimal
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm font-semibold leading-relaxed">
              Every single kitchen ingredient is stocked safely above its minimum threshold. No active low stock alerts detected.
            </p>
          </div>
        </div>
      )}

      {/* 4. Filters Component */}
      <AlertsFilters 
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* 5. Table Component */}
      <div className="space-y-3.5 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl p-4 shadow-sm">
        <div className="flex items-center gap-1.5 pb-2 border-b border-zinc-100 dark:border-zinc-800">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span className="text-[10px] font-black text-slate-800 dark:text-zinc-200 uppercase tracking-wider">Low Stock Audit Ledger</span>
        </div>

        <AlertsTable 
          data={alertsData?.data}
          isLoading={isAlertsLoading}
          role={role}
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
          sorting={sorting}
          onSortingChange={setSorting}
          columnVisibility={columnVisibility}
          onColumnVisibilityChange={setColumnVisibility}
          onViewDetails={setActiveDetailsId}
          onResolve={setActiveResolveAlert}
          onCreateRequest={setSelectedRequestAlert}
        />

        {/* 6. Pagination */}
        {alertsData?.pagination && alertsData.pagination.totalPages > 1 && (
          <div className="pt-2">
            <Pagination 
              page={filters.page}
              totalPages={alertsData.pagination.totalPages}
              onPageChange={(p) => handleFilterChange("page", p.toString())}
            />
          </div>
        )}
      </div>

      {/* Modals and Dialogs */}
      {activeDetailsId && (
        <AlertDetailsModal 
          isOpen={!!activeDetailsId}
          onClose={() => setActiveDetailsId(null)}
          alertId={activeDetailsId}
          role={role}
          onResolve={setActiveResolveAlert}
          onCreateRequest={setSelectedRequestAlert}
        />
      )}

      {activeResolveAlert && (
        <ResolveAlertModal 
          isOpen={!!activeResolveAlert}
          onClose={() => setActiveResolveAlert(null)}
          alert={activeResolveAlert}
        />
      )}

      {selectedRequestAlert && (
        <AlertCreateRequestModal 
          isOpen={!!selectedRequestAlert}
          onClose={() => setSelectedRequestAlert(null)}
          alert={selectedRequestAlert}
          currentUser={currentUser}
        />
      )}

    </div>
  );
}
