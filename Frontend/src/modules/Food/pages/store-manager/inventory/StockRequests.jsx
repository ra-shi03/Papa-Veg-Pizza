import React, { useState } from "react";
import { useSearchParams, useOutletContext } from "react-router-dom";
import { toast } from "sonner";
import { 
  RefreshCw, 
  Download, 
  Plus, 
  ClipboardCheck, 
  Users,
  ShieldCheck
} from "lucide-react";

// Import hooks
import { useStockRequestsDashboard } from "./hooks/useStockRequestsDashboard";
import { useStockRequests } from "./hooks/useStockRequests";

// Import components
import { StockRequestsDashboardCards } from "./components/StockRequestsDashboardCards";
import { StockRequestsFilters } from "./components/StockRequestsFilters";
import { StockRequestsTable } from "./components/StockRequestsTable";
import { Pagination } from "./components/Pagination";

// Import modals
import { NewRequestModal } from "./components/NewRequestModal";
import { RequestDetailsModal } from "./components/RequestDetailsModal";
import { ApproveRequestModal } from "./components/ApproveRequestModal";
import { RejectRequestModal } from "./components/RejectRequestModal";
import { FulfillRequestModal } from "./components/FulfillRequestModal";

export default function StockRequests() {
  // Retrieve role from Outlet Context (provided by StoreOperationsLayout)
  const { role = "store_manager" } = useOutletContext();

  // Search parameters for URL persistence
  const [searchParams, setSearchParams] = useSearchParams();

  // Modal control states
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [activeDetailsId, setActiveDetailsId] = useState(null);
  const [activeApproveId, setActiveApproveId] = useState(null);
  const [activeRejectId, setActiveRejectId] = useState(null);
  const [activeFulfillId, setActiveFulfillId] = useState(null);

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
    status: searchParams.get("status") || "",
    urgency: searchParams.get("urgency") || "",
    ingredientId: searchParams.get("ingredientId") || "",
    from: searchParams.get("from") || "",
    to: searchParams.get("to") || ""
  };

  // 3. Fetch Data
  const { 
    data: dashboardData, 
    isLoading: isDashboardLoading, 
    refetch: refetchDashboard 
  } = useStockRequestsDashboard();

  const { 
    data: requestsData, 
    isLoading: isRequestsLoading, 
    refetch: refetchRequests 
  } = useStockRequests(filters, role, currentUser);

  // Consolidated Refresh Handler
  const handleRefresh = () => {
    toast.promise(
      Promise.all([refetchDashboard(), refetchRequests()]),
      {
        loading: "Syncing stock requests ledger...",
        success: "Requests ledger is up-to-date!",
        error: "Failed to reload requests."
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
    if (!requestsData?.data || requestsData.data.length === 0) {
      toast.warning("No stock requests found to export.");
      return;
    }

    try {
      const headers = ["Request No", "Ingredient", "Requested Qty", "Approved Qty", "Urgency", "Status", "Requested By", "Approved By", "Remarks", "Date Raised"];
      
      const csvRows = [
        headers.join(","),
        ...requestsData.data.map(item => [
          item.requestNo,
          `"${item.ingredientName.replace(/"/g, '""')}"`,
          item.requestedQty,
          item.approvedQty,
          item.urgency,
          item.status,
          `"${item.requestedBy}"`,
          `"${item.approvedBy || "N/A"}"`,
          `"${(item.remarks || "").replace(/"/g, '""')}"`,
          item.createdAt
        ].join(","))
      ];

      const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `PVP_Stock_Requests_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("CSV export downloaded successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate CSV download.");
    }
  };

  return (
    <div className="p-4 space-y-4 select-none bg-neutral-105 dark:bg-zinc-950 min-h-screen">
      
      {/* 1. Page Header Block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-150 dark:border-zinc-800 shadow-sm transition-all">
        <div>
          <h1 className="text-base font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
            <ClipboardCheck className="text-[var(--primary)] w-5 h-5" />
            Stock Requests
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-[11px] mt-0.5">
            Manage ingredient requests, approvals, and deliveries across operations.
          </p>
          <div className="flex items-center gap-1 mt-1.5 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-850 px-2 py-0.5 rounded-lg w-fit">
            <Users className="w-3 h-3 text-zinc-400" />
            <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 capitalize">
              Active User: {currentUser} ({role.replace("_", " ")})
            </span>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Sync Button */}
          <button
            onClick={handleRefresh}
            className="h-8 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-355 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all flex items-center gap-1 bg-white dark:bg-zinc-900 cursor-pointer"
          >
            <RefreshCw size={12} className="text-indigo-500" />
            Sync
          </button>

          {/* Export CSV (Store Manager & Kitchen Supervisor) */}
          {(role === "store_manager" || role === "kitchen_supervisor") && (
            <button
              onClick={handleExportCSV}
              className="h-8 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-355 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all flex items-center gap-1 bg-white dark:bg-zinc-900 cursor-pointer"
            >
              <Download size={12} className="text-emerald-500" />
              Export CSV
            </button>
          )}

          {/* Raise New Request (Kitchen Supervisor & Staff, and Manager for testing) */}
          {(role === "kitchen_staff" || role === "kitchen_supervisor" || role === "store_manager") && (
            <button
              onClick={() => setIsNewModalOpen(true)}
              className="h-8 px-3 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-sm shadow-[var(--primary)]/10 cursor-pointer"
            >
              <Plus size={13} className="stroke-[2.5]" />
              New Request
            </button>
          )}

        </div>
      </div>

      {/* 2. Requests summary cards */}
      <StockRequestsDashboardCards data={dashboardData} isLoading={isDashboardLoading} />

      {/* Role scopes instructions warning */}
      {role === "kitchen_staff" && (
        <div className="p-2.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/30 flex items-center gap-2 text-[11px] text-amber-800 dark:text-amber-400 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-amber-600" />
          <span>
            <strong>Staff Mode:</strong> You are viewing only requests submitted by yourself (<strong>{currentUser}</strong>).
          </span>
        </div>
      )}

      {/* 3. Search & Filters */}
      <StockRequestsFilters 
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* 4. Data Table */}
      <div className="space-y-3">
        <StockRequestsTable 
          data={requestsData?.data || []}
          isLoading={isRequestsLoading}
          role={role}
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
          sorting={sorting}
          onSortingChange={setSorting}
          columnVisibility={columnVisibility}
          onColumnVisibilityChange={setColumnVisibility}
          onViewDetails={setActiveDetailsId}
          onApprove={setActiveApproveId}
          onReject={setActiveRejectId}
          onFulfill={setActiveFulfillId}
        />

        {/* Table Pagination */}
        {requestsData?.pagination && (
          <Pagination 
            currentPage={filters.page}
            totalPages={requestsData.pagination.totalPages}
            onPageChange={(p) => handleFilterChange("page", p)}
            totalItems={requestsData.pagination.total}
            itemsPerPage={filters.limit}
          />
        )}
      </div>

      {/* 5. Modals */}
      <NewRequestModal 
        isOpen={isNewModalOpen}
        onClose={() => {
          setIsNewModalOpen(false);
          refetchRequests();
          refetchDashboard();
        }}
        currentUser={currentUser}
      />

      <RequestDetailsModal 
        isOpen={!!activeDetailsId}
        onClose={() => setActiveDetailsId(null)}
        requestId={activeDetailsId}
        role={role}
        onApprove={(id) => {
          setActiveDetailsId(null);
          setActiveApproveId(id);
        }}
        onReject={(id) => {
          setActiveDetailsId(null);
          setActiveRejectId(id);
        }}
        onFulfill={(id) => {
          setActiveDetailsId(null);
          setActiveFulfillId(id);
        }}
      />

      <ApproveRequestModal 
        isOpen={!!activeApproveId}
        onClose={() => {
          setActiveApproveId(null);
          refetchRequests();
          refetchDashboard();
        }}
        requestId={activeApproveId}
      />

      <RejectRequestModal 
        isOpen={!!activeRejectId}
        onClose={() => {
          setActiveRejectId(null);
          refetchRequests();
          refetchDashboard();
        }}
        requestId={activeRejectId}
      />

      <FulfillRequestModal 
        isOpen={!!activeFulfillId}
        onClose={() => {
          setActiveFulfillId(null);
          refetchRequests();
          refetchDashboard();
        }}
        requestId={activeFulfillId}
      />

    </div>
  );
}
