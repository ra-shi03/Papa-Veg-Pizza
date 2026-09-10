import React, { useState, useEffect } from "react";
import { useSearchParams, useOutletContext } from "react-router-dom";
import { toast } from "sonner";
import { 
  RefreshCw, 
  Download, 
  AlertTriangle, 
  ShieldCheck, 
  Activity,
  CheckCircle2,
  Megaphone
} from "lucide-react";

// Import hooks
import { useShortagesDashboard } from "./hooks/useShortagesDashboard";
import { useIngredientShortages } from "./hooks/useIngredientShortages";

// Import components
import { ShortagesDashboardCards } from "./components/ShortagesDashboardCards";
import { ShortageFilters } from "./components/ShortageFilters";
import { ShortagesTable } from "./components/ShortagesTable";
import { Pagination } from "./components/Pagination";

// Import modals
import { ShortageDetailsModal } from "./components/ShortageDetailsModal";
import { TransferStockModal } from "./components/TransferStockModal";
import { ResolveShortageModal } from "./components/ResolveShortageModal";
import { NotifyAdminModal } from "./components/NotifyAdminModal";
import { mockAffectedOrders } from "./mockData";

export default function IngredientShortages() {
  // Retrieve role from Outlet Context
  const { role = "store_manager" } = useOutletContext();

  // Search parameters for URL persistence
  const [searchParams, setSearchParams] = useSearchParams();

  // Modal control states
  const [activeDetailsId, setActiveDetailsId] = useState(null);
  const [selectedTransferShortage, setSelectedTransferShortage] = useState(null);
  const [selectedResolveShortage, setSelectedResolveShortage] = useState(null);
  const [selectedNotifyShortage, setSelectedNotifyShortage] = useState(null);

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
    storeId: searchParams.get("storeId") || "All",
    from: searchParams.get("from") || "",
    to: searchParams.get("to") || ""
  };

  // 3. Fetch Data (Tanstack Queries)
  const { 
    data: dashboardData, 
    isLoading: isDashboardLoading, 
    refetch: refetchDashboard 
  } = useShortagesDashboard();

  const { 
    data: shortagesData, 
    isLoading: isShortagesLoading, 
    refetch: refetchShortages 
  } = useIngredientShortages(filters, {
    refetchInterval: autoRefresh ? 30000 : false
  });

  // Consolidated Refresh Handler
  const handleRefresh = () => {
    toast.promise(
      Promise.all([refetchDashboard(), refetchShortages()]),
      {
        loading: "Syncing shortages ledger...",
        success: "Shortages ledger is up-to-date!",
        error: "Failed to reload shortages."
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
    if (!shortagesData?.data || shortagesData.data.length === 0) {
      toast.warning("No shortage logs found to export.");
      return;
    }

    try {
      const headers = ["Shortage ID", "Ingredient SKU ID", "Ingredient Name", "Shortage Quantity", "Affected Orders", "Severity", "Status", "Action Taken", "Detected Date", "Resolved By", "Resolution Date", "Notes"];
      
      const csvRows = [
        headers.join(","),
        ...shortagesData.data.map(item => [
          item._id,
          item.ingredientId,
          `"${item.ingredientName.replace(/"/g, '""')}"`,
          item.shortageQty,
          item.affectedOrders,
          item.severity,
          item.status,
          `"${item.actionTaken || ""}"`,
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
      link.setAttribute("download", `pvp_shortages_report_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("CSV shortage report downloaded successfully.");
    } catch (err) {
      toast.error("Failed to export shortages report.");
    }
  };

  // Emergency Notify Handler
  const handleEmergencyNotification = () => {
    const activeShortagesList = shortagesData?.data?.filter(s => s.status === "active") || [];
    if (activeShortagesList.length > 0) {
      // Find the most critical shortage
      const criticalShortage = activeShortagesList.find(s => s.severity === "critical") || activeShortagesList[0];
      setSelectedNotifyShortage(criticalShortage);
    } else {
      toast.info("No active shortages require emergency alerts. Inventory is currently healthy.");
    }
  };

  const isManager = role === "store_manager";
  const hasNoActiveShortages = dashboardData?.activeShortages === 0;

  return (
    <div className="p-4 md:p-5 space-y-6 select-none font-sans">
      
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-zinc-150 dark:border-zinc-800 shadow-sm transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-red-50 dark:bg-red-955/20 text-red-500 flex items-center justify-center border border-red-100 dark:border-red-900/30 shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
              Ingredient Shortages
            </h1>
            <p className="text-zinc-505 dark:text-zinc-400 text-[10px] mt-0.5 font-bold">
              Manage critical inventory shortages affecting active customer orders.
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

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            className="h-8 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all flex items-center justify-center bg-white dark:bg-zinc-900 cursor-pointer"
            title="Reload Ledger"
          >
            <RefreshCw size={13} className="text-zinc-650 dark:text-zinc-400" />
          </button>

          {/* Export CSV Button */}
          {isManager && (
            <button
              onClick={handleExportCSV}
              className="h-8 px-3 rounded-lg border border-zinc-200 dark:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-800 font-bold text-xs text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 bg-white dark:bg-zinc-900 transition-all cursor-pointer shadow-sm"
            >
              <Download size={13} />
              Export CSV
            </button>
          )}

          {/* Emergency Alert Button */}
          {isManager && (
            <button
              onClick={handleEmergencyNotification}
              className="h-8 px-3.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <Megaphone size={13} className="animate-bounce" />
              Emergency Notification
            </button>
          )}
        </div>
      </div>

      {/* 2. Dashboard Cards */}
      <ShortagesDashboardCards data={dashboardData} isLoading={isDashboardLoading} />

      {/* 3. Optimal Stock Healthy Illustration */}
      {hasNoActiveShortages && !isDashboardLoading && (
        <div className="bg-emerald-50/20 dark:bg-emerald-950/10 border border-emerald-150/50 dark:border-emerald-900/20 rounded-3xl p-6 md:p-8 flex flex-col items-center justify-center text-center shadow-sm max-w-2xl mx-auto space-y-4 select-none">
          <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/30 text-emerald-500 dark:text-emerald-405 rounded-full flex items-center justify-center border border-emerald-200/50 dark:border-emerald-900/30 animate-pulse">
            <CheckCircle2 size={32} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">
              No Active Shortages
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm font-semibold leading-relaxed">
              All ingredients are safely in stock. Active orders are being processed smoothly without delay.
            </p>
          </div>
        </div>
      )}

      {/* 4. Filter Panel */}
      <ShortageFilters 
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* 5. Main Table Ledger */}
      <div className="space-y-3.5 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl p-4 shadow-sm">
        <div className="flex items-center gap-1.5 pb-2 border-b border-zinc-100 dark:border-zinc-800">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span className="text-[10px] font-black text-slate-800 dark:text-zinc-200 uppercase tracking-wider">Audited Shortages Ledger</span>
        </div>

        <ShortagesTable 
          data={shortagesData?.data}
          isLoading={isShortagesLoading}
          role={role}
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
          sorting={sorting}
          onSortingChange={setSorting}
          columnVisibility={columnVisibility}
          onColumnVisibilityChange={setColumnVisibility}
          onViewDetails={setActiveDetailsId}
          onTransfer={setSelectedTransferShortage}
          onResolve={setSelectedResolveShortage}
          onNotifyAdmin={setSelectedNotifyShortage}
        />

        {/* 6. Pagination */}
        {shortagesData?.pagination && shortagesData.pagination.totalPages > 1 && (
          <div className="pt-2">
            <Pagination 
              page={filters.page}
              totalPages={shortagesData.pagination.totalPages}
              onPageChange={(p) => handleFilterChange("page", p.toString())}
            />
          </div>
        )}
      </div>

      {/* Modals and Dialogs */}
      {activeDetailsId && (
        <ShortageDetailsModal 
          isOpen={!!activeDetailsId}
          onClose={() => setActiveDetailsId(null)}
          shortageId={activeDetailsId}
          role={role}
          onTransfer={setSelectedTransferShortage}
          onResolve={setSelectedResolveShortage}
          onNotifyAdmin={setSelectedNotifyShortage}
        />
      )}

      {selectedTransferShortage && (
        <TransferStockModal 
          isOpen={!!selectedTransferShortage}
          onClose={() => setSelectedTransferShortage(null)}
          shortage={selectedTransferShortage}
        />
      )}

      {selectedResolveShortage && (
        <ResolveShortageModal 
          isOpen={!!selectedResolveShortage}
          onClose={() => setSelectedResolveShortage(null)}
          shortage={selectedResolveShortage}
        />
      )}

      {selectedNotifyShortage && (
        <NotifyAdminModal 
          isOpen={!!selectedNotifyShortage}
          onClose={() => setSelectedNotifyShortage(null)}
          shortage={selectedNotifyShortage}
          estimatedRevenueLoss={
            // Find estimated revenue loss of selected alert
            mockAffectedOrders[selectedNotifyShortage.ingredientId]?.reduce((sum, o) => sum + (o.revenue || 0), 0) || 
            (selectedNotifyShortage.affectedOrders || 0) * 450
          }
        />
      )}

    </div>
  );
}
