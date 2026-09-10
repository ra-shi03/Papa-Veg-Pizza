import React, { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, Sliders, Download, RefreshCw, BarChart3, List } from "lucide-react";
import { toast } from "sonner";
import { adminAPI } from "@food/api";

// Subcomponents
import PricingStatsCards from "./components/PricingStatsCards";
import PricingFilters from "./components/PricingFilters";
import PricingTable from "./components/PricingTable";
import PricingDrawer from "./components/PricingDrawer";
import PriceHistoryDrawer from "./components/PriceHistoryDrawer";
import EditPricingModal from "./components/EditPricingModal";
import BulkPriceUpdateModal from "./components/BulkPriceUpdateModal";
import CopyPricingModal from "./components/CopyPricingModal";
import BulkActionsModal from "./components/BulkActionsModal";
import PricingAnalytics from "./components/PricingAnalytics";

// Hooks
import { useStorePricing } from "./hooks/useStorePricing";
import { useCategories } from "./hooks/useCategories";
import { useProducts } from "./hooks/useProducts";

export default function StorePricing() {
  const [activeTab, setActiveTab] = useState("table"); // 'table' | 'analytics'

  // Filter State
  const [filters, setFilters] = useState({
    search: "",
    storeId: "all",
    categoryId: "all",
    productType: "all",
    availability: "all",
    status: "all",
    page: 1,
    limit: 10,
    sortBy: "storeName",
    sortOrder: "asc"
  });

  // Table row selection state
  const [rowSelection, setRowSelection] = useState({});

  // Overlays State
  const [activeModal, setActiveModal] = useState(null); // 'edit' | 'bulk_price' | 'copy' | 'bulk_action'
  const [activeDrawer, setActiveDrawer] = useState(null); // 'view' | 'history'
  const [selectedPricing, setSelectedPricing] = useState(null);

  // Queries
  const { data: pricingData, isLoading, refetch } = useStorePricing(filters);
  const { data: categoriesData } = useCategories({ limit: 1000 });
  const { data: productsData } = useProducts({ limit: 1000 });

  // Fetch stores list
  const { data: storesList = [] } = useQuery({
    queryKey: ["stores-list"],
    queryFn: () => adminAPI.getStores({ limit: 1000 }).then((res) => res.data?.data?.stores || [])
  });

  const pricingItems = pricingData?.pricing || [];
  const totalCount = pricingData?.totalCount || 0;
  const stats = pricingData?.stats || null;
  const categoriesList = categoriesData?.categories || [];
  const productsList = productsData?.products || [];

  // Selected row IDs helper
  const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id]);

  // Sorting handler
  const handleSortingChange = (field) => {
    setFilters((prev) => {
      const isSameField = prev.sortBy === field;
      return {
        ...prev,
        sortBy: field,
        sortOrder: isSameField && prev.sortOrder === "asc" ? "desc" : "asc",
        page: 1
      };
    });
  };

  // Change individual filter keys
  const handleFilterChange = (key, val) => {
    setFilters((prev) => ({
      ...prev,
      [key]: val,
      page: 1
    }));
  };

  // Reset Filters
  const handleResetFilters = () => {
    setFilters({
      search: "",
      storeId: "all",
      categoryId: "all",
      productType: "all",
      availability: "all",
      status: "all",
      page: 1,
      limit: 10,
      sortBy: "storeName",
      sortOrder: "asc"
    });
    toast.success("Pricing overrides filters reset.");
  };

  // Handle table row action trigger
  const handleTableAction = (actionType, item) => {
    setSelectedPricing(item);
    if (actionType === "view") {
      setActiveDrawer("view");
    } else if (actionType === "edit") {
      setActiveModal("edit");
    } else if (actionType === "bulk_update") {
      setActiveModal("bulk_price");
    } else if (actionType === "copy") {
      setActiveModal("copy");
    } else if (actionType === "history") {
      setActiveDrawer("history");
    }
  };

  // Export CSV helper
  const handleExportCSV = () => {
    if (pricingItems.length === 0) {
      toast.warning("No records found to export.");
      return;
    }
    const headers = "Store Code,Store Name,Product SKU,Product Name,Category,Small Price,Medium Price,Large Price,Delivery Price,Takeaway Price,Dine-in Price,Availability,Status,Last Updated,Updated By\n";
    const rows = pricingItems.map((item) =>
      `"${item.storeCode}","${item.storeName}","${item.productSku}","${item.productName}","${item.categoryName}",${item.smallPrice},${item.mediumPrice},${item.largePrice},${item.deliveryPrice},${item.takeawayPrice},${item.dineInPrice || item.mediumPrice},"${item.availability}","${item.status}","${item.updatedAt || ''}","${item.updatedBy || 'System'}"`
    ).join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Store_Pricing_Overrides_${Date.now()}.csv`;
    link.click();
    toast.success("Pricing matrix exported to CSV.");
  };

  return (
    <div className="p-4 lg:p-6 space-y-4 bg-zinc-50/40 dark:bg-zinc-950 min-h-screen text-xs font-semibold text-zinc-700 dark:text-zinc-350">
      
      {/* Header Panel */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <DollarSign className="text-[var(--primary)] shrink-0" size={24} />
            <span>Store Pricing Engine</span>
          </h1>
          <p className="text-[10px] text-zinc-450 dark:text-zinc-550 font-extrabold uppercase tracking-wide">
            Oversee franchise store overrides, delivery fee structures, local campaigns, and audit trials.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          
          {/* Tab Selector Button Pill */}
          <div className="flex bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-0.5 rounded-xl">
            <button
              onClick={() => setActiveTab("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "table"
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs"
                  : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-650"
              }`}
            >
              <List size={13} />
              <span>Pricing Grid</span>
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "analytics"
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs"
                  : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-650"
              }`}
            >
              <BarChart3 size={13} />
              <span>Analytics Charts</span>
            </button>
          </div>

          <div className="h-6 w-[1px] bg-zinc-200 dark:bg-zinc-800 mx-1" />

          {/* Bulk Action Multi-Row Trigger */}
          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveModal("bulk_action")}
              className="px-3 py-2 bg-zinc-950 dark:bg-zinc-900 dark:border dark:border-zinc-800 hover:bg-zinc-850 text-white font-bold rounded-xl shadow-xs transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
            >
              <Sliders size={13} />
              <span>Rules Actions ({selectedIds.length})</span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-300 font-bold rounded-xl shadow-xs transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
          >
            <Download size={13} className="text-zinc-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => {
              refetch();
              toast.success("Store pricing overrides synchronized.");
            }}
            className="p-2.5 bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-400 hover:text-zinc-650 rounded-xl transition-all active:scale-[0.98] cursor-pointer"
            title="Manual Sync"
          >
            <RefreshCw size={13} className={`${isLoading ? "animate-spin" : ""}`} />
          </button>

        </div>
      </header>

      {/* Bento Statistics Grid */}
      <PricingStatsCards stats={stats} isLoading={isLoading} />

      {/* Primary Dashboard Body Tabs */}
      {activeTab === "table" ? (
        <div className="space-y-4 animate-fade-in">
          {/* Filters Row */}
          <PricingFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            storesList={storesList}
            categoriesList={categoriesList}
            onReset={handleResetFilters}
            onBulkUpdateClick={() => setActiveModal("bulk_price")}
            onCopyPricingClick={() => setActiveModal("copy")}
            onExportClick={handleExportCSV}
            onRefreshClick={refetch}
            isLoading={isLoading}
          />

          {/* Table Matrix */}
          <PricingTable
            data={pricingItems}
            isLoading={isLoading}
            sorting={filters.sortBy}
            onSortingChange={handleSortingChange}
            page={filters.page}
            limit={filters.limit}
            totalCount={totalCount}
            onPageChange={(p) => handleFilterChange("page", p)}
            onLimitChange={(l) => handleFilterChange("limit", l)}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            onAction={handleTableAction}
          />
        </div>
      ) : (
        <div className="animate-fade-in">
          {/* Recharts Analytics Panel */}
          <PricingAnalytics
            pricingData={pricingItems}
            storesList={storesList}
            categoriesList={categoriesList}
            isLoading={isLoading}
          />
        </div>
      )}

      {/* ==================================================== */}
      {/* OVERLAYS, DRAWERS & MODALS RENDER PANEL              */}
      {/* ==================================================== */}

      {/* Pricing Detail Drawer */}
      <PricingDrawer
        isOpen={activeDrawer === "view"}
        onClose={() => {
          setActiveDrawer(null);
          setSelectedPricing(null);
        }}
        pricingId={selectedPricing?._id}
      />

      {/* Price Changes Audit History Timeline Drawer */}
      <PriceHistoryDrawer
        isOpen={activeDrawer === "history"}
        onClose={() => {
          setActiveDrawer(null);
          setSelectedPricing(null);
        }}
        product={selectedPricing ? { _id: selectedPricing.productId, name: selectedPricing.productName } : null}
        storesList={storesList}
      />

      {/* Edit Single Pricing Override Modal */}
      <EditPricingModal
        isOpen={activeModal === "edit"}
        onClose={() => {
          setActiveModal(null);
          setSelectedPricing(null);
        }}
        pricing={selectedPricing}
      />

      {/* Bulk Pricing Adjustments Modal */}
      <BulkPriceUpdateModal
        isOpen={activeModal === "bulk_price"}
        onClose={() => {
          setActiveModal(null);
        }}
        storesList={storesList}
        categoriesList={categoriesList}
        productsList={productsList}
      />

      {/* Copy Pricing Config Modal */}
      <CopyPricingModal
        isOpen={activeModal === "copy"}
        onClose={() => {
          setActiveModal(null);
        }}
        storesList={storesList}
        productsList={productsList}
      />

      {/* Execute Bulk Action Status Rules Modal */}
      <BulkActionsModal
        isOpen={activeModal === "bulk_action"}
        onClose={() => {
          setActiveModal(null);
          setRowSelection({});
        }}
        selectedCount={selectedIds.length}
        selectedIds={selectedIds}
      />

    </div>
  );
}
