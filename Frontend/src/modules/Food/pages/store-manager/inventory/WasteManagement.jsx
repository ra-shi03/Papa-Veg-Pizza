import React, { useState } from "react";
import { useSearchParams, useOutletContext } from "react-router-dom";
import { toast } from "sonner";
import { 
  RefreshCw, 
  Download, 
  Plus, 
  AlertCircle, 
  ShieldCheck 
} from "lucide-react";

// Import hooks
import { useWasteDashboard } from "./hooks/useWasteDashboard";
import { useWasteLogs } from "./hooks/useWasteLogs";

// Import components
import { WasteDashboardCards } from "./components/WasteDashboardCards";
import { WasteFilters } from "./components/WasteFilters";
import { WasteTable } from "./components/WasteTable";
import { Pagination } from "./components/Pagination";

// Import modals
import { ReportWasteModal } from "./components/ReportWasteModal";
import { WasteDetailsModal } from "./components/WasteDetailsModal";
import { ApproveWasteModal } from "./components/ApproveWasteModal";
import { DeleteWasteDialog } from "./components/DeleteWasteDialog";

export default function WasteManagement() {
  // Retrieve role from Outlet Context
  const { role = "store_manager" } = useOutletContext();

  // Search parameters for URL persistence
  const [searchParams, setSearchParams] = useSearchParams();

  // Modal control states
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [activeDetailsId, setActiveDetailsId] = useState(null);
  const [activeApproveId, setActiveApproveId] = useState(null);
  const [activeDeleteId, setActiveDeleteId] = useState(null);

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
    wasteType: searchParams.get("wasteType") || "All",
    reportedBy: searchParams.get("reportedBy") || "All",
    from: searchParams.get("from") || "",
    to: searchParams.get("to") || ""
  };

  // 3. Fetch Data
  const { 
    data: dashboardData, 
    isLoading: isDashboardLoading, 
    refetch: refetchDashboard 
  } = useWasteDashboard();

  const { 
    data: wasteData, 
    isLoading: isLogsLoading, 
    refetch: refetchLogs 
  } = useWasteLogs(filters, role, currentUser);

  // Consolidated Refresh Handler
  const handleRefresh = () => {
    toast.promise(
      Promise.all([refetchDashboard(), refetchLogs()]),
      {
        loading: "Syncing waste logs ledger...",
        success: "Waste ledger is up-to-date!",
        error: "Failed to reload waste logs."
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
    if (!wasteData?.data || wasteData.data.length === 0) {
      toast.warning("No waste logs found to export.");
      return;
    }

    try {
      const headers = ["Ingredient SKU ID", "Ingredient Name", "Quantity", "Waste Type", "Loss (INR)", "Reported By", "Approved By", "Reason", "Remarks", "Date Reported"];
      
      const csvRows = [
        headers.join(","),
        ...wasteData.data.map(item => [
          item.ingredientId,
          `"${item.ingredientName.replace(/"/g, '""')}"`,
          item.quantity,
          item.wasteType,
          item.estimatedLoss,
          `"${item.reportedBy}"`,
          `"${item.approvedBy || "N/A"}"`,
          `"${item.reason.replace(/"/g, '""')}"`,
          `"${(item.remarks || "").replace(/"/g, '""')}"`,
          item.createdAt
        ].join(","))
      ];

      const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `pvp_waste_report_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("CSV report downloaded successfully.");
    } catch (err) {
      toast.error("Failed to export report.");
    }
  };

  const isManager = role === "store_manager";

  return (
    <div className="p-4 md:p-5 space-y-4 select-none">
      
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-150 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-500 flex items-center justify-center border border-rose-100 dark:border-rose-900/30">
            <AlertCircle size={18} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
              Waste Management
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-[10px] mt-0.5 font-semibold">
              Monitor ingredient wastage, financial losses, and spoilage audit logs.
            </p>
          </div>
        </div>

        {/* Top Right Actions */}
        <div className="flex flex-wrap items-center gap-2 select-none">
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

          <button
            onClick={() => setIsReportModalOpen(true)}
            className="h-8 px-3.5 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <Plus size={14} className="stroke-[2.5]" />
            Report Waste
          </button>
        </div>
      </div>

      {/* 2. Dashboard Cards */}
      <WasteDashboardCards data={dashboardData} isLoading={isDashboardLoading} />

      {/* 3. Filters Component */}
      <WasteFilters 
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        role={role}
      />

      {/* 4. Table Component */}
      <div className="space-y-3.5 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-1.5 pb-2 border-b border-zinc-100 dark:border-zinc-800">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span className="text-[10px] font-black text-slate-800 dark:text-zinc-200 uppercase tracking-wider">Audited Loss Logs</span>
        </div>

        <WasteTable 
          data={wasteData?.data}
          isLoading={isLogsLoading}
          role={role}
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
          sorting={sorting}
          onSortingChange={setSorting}
          columnVisibility={columnVisibility}
          onColumnVisibilityChange={setColumnVisibility}
          onViewDetails={setActiveDetailsId}
          onApprove={setActiveApproveId}
          onDelete={setActiveDeleteId}
        />

        {/* 5. Pagination */}
        {wasteData?.pagination && wasteData.pagination.totalPages > 1 && (
          <div className="pt-2">
            <Pagination 
              page={filters.page}
              totalPages={wasteData.pagination.totalPages}
              onPageChange={(p) => handleFilterChange("page", p.toString())}
            />
          </div>
        )}
      </div>

      {/* Report Waste Modal */}
      {isReportModalOpen && (
        <ReportWasteModal 
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          currentUser={currentUser}
        />
      )}

      {/* Waste Details Modal */}
      {activeDetailsId && (
        <WasteDetailsModal 
          isOpen={!!activeDetailsId}
          onClose={() => setActiveDetailsId(null)}
          wasteId={activeDetailsId}
          role={role}
          onApprove={(id) => {
            setActiveDetailsId(null);
            setActiveApproveId(id);
          }}
          onDelete={(id) => {
            setActiveDetailsId(null);
            setActiveDeleteId(id);
          }}
        />
      )}

      {/* Approve Waste Modal */}
      {activeApproveId && (
        <ApproveWasteModal 
          isOpen={!!activeApproveId}
          onClose={() => setActiveApproveId(null)}
          wasteId={activeApproveId}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {activeDeleteId && (
        <DeleteWasteDialog 
          isOpen={!!activeDeleteId}
          onClose={() => setActiveDeleteId(null)}
          wasteId={activeDeleteId}
        />
      )}

    </div>
  );
}
