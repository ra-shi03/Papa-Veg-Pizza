import React, { useState } from "react";
import { useSearchParams, useOutletContext } from "react-router-dom";
import { toast } from "sonner";
import { 
  RefreshCw, 
  Download, 
  Plus, 
  SlidersHorizontal,
  ChevronDown,
  Info,
  ShieldCheck,
  ClipboardList
} from "lucide-react";

// Import modular hooks
import { useInventoryDashboard } from "./hooks/useInventoryDashboard";
import { useIngredients } from "./hooks/useIngredients";

// Import modular components
import { DashboardCards } from "./components/DashboardCards";
import { InventoryFilters } from "./components/InventoryFilters";
import { IngredientsTable } from "./components/IngredientsTable";
import { Pagination } from "./components/Pagination";

// Import modals
import { IngredientDetailsModal } from "./components/IngredientDetailsModal";
import { UpdateStockModal } from "./components/UpdateStockModal";
import { HistoryModal } from "./components/HistoryModal";

export default function IngredientStock() {
  // Retrieve current user role from Outlet Context (provided by StoreOperationsLayout)
  const { role = "store_manager" } = useOutletContext();

  // Search parameters for URL persistence
  const [searchParams, setSearchParams] = useSearchParams();

  // Selected Ingredient IDs for modal triggers
  const [activeDetailsId, setActiveDetailsId] = useState(null);
  const [activeUpdateId, setActiveUpdateId] = useState(null);
  const [activeHistoryId, setActiveHistoryId] = useState(null);

  // Table State
  const [rowSelection, setRowSelection] = useState({});
  const [sorting, setSorting] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});

  // 1. Parse Filters from URL
  const filters = {
    page: Number(searchParams.get("page")) || 1,
    limit: Number(searchParams.get("limit")) || 10,
    search: searchParams.get("search") || "",
    category: searchParams.get("category") || "",
    status: searchParams.get("status") || "",
    supplier: searchParams.get("supplier") || "",
    unit: searchParams.get("unit") || "",
    from: searchParams.get("from") || "",
    to: searchParams.get("to") || ""
  };

  // 2. Fetch Data from queries
  const { 
    data: dashboardData, 
    isLoading: isDashboardLoading, 
    refetch: refetchDashboard 
  } = useInventoryDashboard();

  const { 
    data: ingredientsData, 
    isLoading: isIngredientsLoading, 
    refetch: refetchIngredients 
  } = useIngredients(filters);

  // Consolidated Refresh Handler
  const handleRefresh = () => {
    toast.promise(
      Promise.all([refetchDashboard(), refetchIngredients()]),
      {
        loading: "Syncing inventory ledger...",
        success: "Inventory database is up-to-date!",
        error: "Failed to reload inventory."
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
      // Reset back to page 1 on filter alteration
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
    if (!ingredientsData?.data || ingredientsData.data.length === 0) {
      toast.warning("No ingredients found to export.");
      return;
    }

    try {
      const headers = ["Ingredient ID", "Name", "Category", "Current Stock", "Unit", "Min Stock", "Reorder Level", "Cost Per Unit", "Status", "Supplier", "Last Updated By", "Last Updated At"];
      
      const csvRows = [
        headers.join(","), // Header row
        ...ingredientsData.data.map(item => [
          item._id,
          `"${item.ingredientName.replace(/"/g, '""')}"`,
          item.category,
          item.currentStock,
          item.unit,
          item.minimumStock,
          item.reorderLevel,
          item.costPerUnit,
          item.status,
          `"${item.supplierName?.replace(/"/g, '""') || "N/A"}"`,
          item.lastUpdatedBy,
          item.updatedAt
        ].join(","))
      ];

      const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `PVP_Inventory_Stock_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("CSV export downloaded successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate CSV download.");
    }
  };

  // Global top bar update stock action (uses selected rows)
  const handleGlobalUpdateStock = () => {
    const selectedKeys = Object.keys(rowSelection);
    if (selectedKeys.length !== 1) {
      toast.warning("Please select exactly one ingredient row in the table to modify its stock levels.");
      return;
    }
    
    // Find the matching row index
    const index = Number(selectedKeys[0]);
    const item = ingredientsData?.data[index];
    if (item) {
      setActiveUpdateId(item._id);
    }
  };

  return (
    <div className="p-4 space-y-4 select-none bg-neutral-105 dark:bg-zinc-950 min-h-screen">
      
      {/* 1. Page Header Block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-150 dark:border-zinc-800 shadow-sm transition-all">
        <div>
          <h1 className="text-base font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
            <ClipboardList className="text-[var(--primary)] w-5 h-5" />
            Ingredient Stock
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-[11px] mt-0.5">
            Monitor, edit, and audit ingredient inventory, stock transactions, and value indexes.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Refresh Action */}
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

          {/* Quick Update Stock (Store Manager only) */}
          {role === "store_manager" && (
            <button
              onClick={handleGlobalUpdateStock}
              className="h-8 px-3 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-sm shadow-[var(--primary)]/10 cursor-pointer"
            >
              <Plus size={13} className="stroke-[2.5]" />
              Update Stock
            </button>
          )}

        </div>
      </div>

      {/* 2. Inventory summary Bento-styled Cards */}
      <DashboardCards data={dashboardData} isLoading={isDashboardLoading} />

      {/* 3. Filters Command bar */}
      <InventoryFilters 
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* 4. Table view Container */}
      <div className="space-y-3">
        <IngredientsTable 
          data={ingredientsData?.data || []}
          isLoading={isIngredientsLoading}
          role={role}
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
          sorting={sorting}
          onSortingChange={setSorting}
          columnVisibility={columnVisibility}
          onColumnVisibilityChange={setColumnVisibility}
          onViewDetails={setActiveDetailsId}
          onUpdateStock={setActiveUpdateId}
          onViewHistory={setActiveHistoryId}
        />

        {/* Table Pagination */}
        {ingredientsData?.pagination && (
          <Pagination 
            currentPage={filters.page}
            totalPages={ingredientsData.pagination.totalPages}
            onPageChange={(p) => handleFilterChange("page", p)}
            totalItems={ingredientsData.pagination.total}
            itemsPerPage={filters.limit}
          />
        )}
      </div>

      {/* 5. Connected Auditor Dialog Modals */}
      <IngredientDetailsModal 
        isOpen={!!activeDetailsId}
        onClose={() => setActiveDetailsId(null)}
        ingredientId={activeDetailsId}
      />

      <UpdateStockModal 
        isOpen={!!activeUpdateId}
        onClose={() => {
          setActiveUpdateId(null);
          setRowSelection({}); // Reset selections on success/cancel
        }}
        ingredientId={activeUpdateId}
      />

      <HistoryModal 
        isOpen={!!activeHistoryId}
        onClose={() => setActiveHistoryId(null)}
        ingredientId={activeHistoryId}
      />

    </div>
  );
}
