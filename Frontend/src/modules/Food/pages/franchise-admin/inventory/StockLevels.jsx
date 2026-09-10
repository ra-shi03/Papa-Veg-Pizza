import React, { useState, useEffect } from "react";
import {
  Layers, Wallet, AlertTriangle, AlertOctagon, CheckCircle, Search,
  RefreshCw, MoreVertical, ChevronLeft, ChevronRight, SlidersHorizontal,
  Eye, Edit2, History, ChevronDown, Check, Printer, FileText, Download, Trash2
} from "lucide-react";
import { toast } from "sonner";
import { useStockLevels, useStores } from "./hooks/useStock";

// Modals & Drawer components
import AdjustStockModal from "./components/AdjustStockModal";
import StockDetailsDrawer from "./components/StockDetailsDrawer";
import TransactionHistoryModal from "./components/TransactionHistoryModal";

const CATEGORIES = ["Dough", "Cheese", "Vegetables", "Sauce", "Packaging", "Seasoning", "Other"];
const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "healthy", label: "Healthy" },
  { value: "low", label: "Low Stock" },
  { value: "critical", label: "Critical Stock" },
  { value: "out_of_stock", label: "Out of Stock" }
];

export default function StockLevels() {
  // Query Filters State
  const [filters, setFilters] = useState({
    search: "",
    storeId: "", // comma separated list
    category: "ALL_CATEGORIES",
    status: "all",
    sortBy: "lastUpdated",
    sortOrder: "desc"
  });

  // Debounced search text
  const [searchTerm, setSearchTerm] = useState("");

  // Store select state (multi-select popover)
  const [selectedStores, setSelectedStores] = useState([]);
  const [showStorePopover, setShowStorePopover] = useState(false);

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Row selection state
  const [selectedRows, setSelectedRows] = useState([]);

  // Overlay states
  const [activeModal, setActiveModal] = useState(null); // 'adjust', 'history'
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedStockRecord, setSelectedStockRecord] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchTerm }));
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Sync store multi-select to query params
  const handleApplyStoresFilter = () => {
    setFilters((prev) => ({
      ...prev,
      storeId: selectedStores.join(",")
    }));
    setPage(1);
    setShowStorePopover(false);
  };

  // Query stock levels
  const queryParams = { ...filters, page, limit };
  const { data: stockResponse, isLoading, isError, refetch } = useStockLevels(queryParams);
  const stocksList = stockResponse?.data || [];
  const totalCount = stockResponse?.totalCount || 0;
  const metrics = stockResponse?.metrics || { totalStockValue: 0, lowStockCount: 0, outOfStockCount: 0, healthyStockCount: 0 };

  // Query stores for filters
  const { data: storesResponse } = useStores();
  const stores = storesResponse?.data || [];

  const handleResetFilters = () => {
    setFilters({
      search: "",
      storeId: "",
      category: "ALL_CATEGORIES",
      status: "all",
      sortBy: "lastUpdated",
      sortOrder: "desc"
    });
    setSearchTerm("");
    setSelectedStores([]);
    setPage(1);
    toast.success("Filters reset successfully");
  };

  const handleAction = (actionType, record) => {
    setActiveMenuId(null);
    setSelectedStockRecord(record);

    if (actionType === "view") {
      setIsDrawerOpen(true);
    } else if (actionType === "adjust") {
      setActiveModal("adjust");
    } else if (actionType === "history") {
      setActiveModal("history");
    }
  };

  // Row Selection logic
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(stocksList.map((s) => s._id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  // Bulk Actions
  const handleBulkExport = () => {
    const selectedData = stocksList.filter(s => selectedRows.includes(s._id));
    if (selectedData.length === 0) return;

    const headers = ["Ingredient", "Code", "Store", "Available Stock", "Reorder Level", "Ideal Stock", "Status"];
    const rows = selectedData.map(s => [
      s.ingredient?.name,
      s.ingredient?.ingredientCode,
      s.storeName,
      `${s.availableStock} ${s.ingredient?.unit}`,
      `${s.reorderLevel} ${s.ingredient?.unit}`,
      `${s.idealStock} ${s.ingredient?.unit}`,
      s.status
    ]);

    const csvContent = [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `bulk_stock_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${selectedData.length} records successfully!`);
  };

  const handleBulkPrint = () => {
    window.print();
  };

  const handleBulkDownloadPDF = () => {
    toast.success("Generating bulk stock level PDF report...");
  };

  // Toggle store in multi-select list
  const toggleStoreSelection = (storeId) => {
    setSelectedStores((prev) =>
      prev.includes(storeId) ? prev.filter((id) => id !== storeId) : [...prev, storeId]
    );
  };

  // Status badges color definitions
  const getStatusBadge = (status) => {
    switch (status) {
      case "OUT_OF_STOCK":
        return (
          <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase inline-block bg-red-650/10 text-red-650 dark:bg-red-950/20">
            Out Of Stock
          </span>
        );
      case "CRITICAL":
        return (
          <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase inline-block bg-rose-500/10 text-rose-500 dark:bg-rose-950/20">
            Critical
          </span>
        );
      case "LOW":
        return (
          <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase inline-block bg-amber-500/10 text-amber-600 dark:bg-amber-950/20">
            Low Stock
          </span>
        );
      case "HEALTHY":
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase inline-block bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950/20">
            Healthy
          </span>
        );
    }
  };

  const getRelativeTime = (isoStr) => {
    if (!isoStr) return "N/A";
    const elapsed = Date.now() - new Date(isoStr).getTime();
    const minutes = Math.floor(elapsed / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  // Skeletal loaders for Bento stats and table rows
  const renderLoadingSkeleton = () => (
    <div className="space-y-4">
      {/* Table Skeleton */}
      <div className="border border-zinc-150 dark:border-zinc-850 rounded-xl overflow-hidden bg-white dark:bg-zinc-900">
        <div className="p-4 border-b border-zinc-150 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 h-10" />
        <div className="divide-y divide-zinc-100 dark:divide-zinc-850">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 flex items-center justify-between gap-4 animate-pulse">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 w-1/3 bg-zinc-200 dark:bg-zinc-800 rounded" />
                  <div className="h-2 w-1/4 bg-zinc-100 dark:bg-zinc-850 rounded" />
                </div>
              </div>
              <div className="h-3.5 w-24 bg-zinc-150 dark:bg-zinc-800 rounded" />
              <div className="h-3.5 w-16 bg-zinc-150 dark:bg-zinc-800 rounded" />
              <div className="h-3.5 w-16 bg-zinc-150 dark:bg-zinc-800 rounded" />
              <div className="h-3.5 w-12 bg-zinc-150 dark:bg-zinc-800 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6 bg-zinc-50/40 dark:bg-zinc-950 min-h-screen text-xs font-semibold text-zinc-700 dark:text-zinc-350">

      {/* 1. Page Header Section */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2 mt-1">
            <Layers className="text-[var(--primary)] shrink-0" size={24} />
            <span>Stock Levels</span>
          </h1>
          <p className="text-[10.5px] text-zinc-400 font-bold mt-0.5">
            Monitor inventory levels across all stores in real time.
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {isLoading && (
            <span className="flex items-center gap-1 text-[10px] text-[var(--primary)] font-bold animate-pulse">
              <RefreshCw className="animate-spin" size={10} />
              Syncing inventory...
            </span>
          )}
          <button
            onClick={() => setActiveModal("history-audit")}
            className="px-3.5 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
          >
            <History size={13} className="text-zinc-400" />
            <span>Full Audit Ledger</span>
          </button>
          <button
            onClick={() => refetch()}
            className="p-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-400 hover:text-zinc-650 rounded-xl transition-all cursor-pointer shadow-sm"
            title="Refresh database"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </header>

      {/* 2. Bento KPI Cards Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Stock Value */}
        <div className="p-4 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-850 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9.5px] text-zinc-400 uppercase font-black tracking-wider block">Total Stock Value</span>
            <span className="text-lg font-black text-zinc-900 dark:text-white block">
              ₹{metrics.totalStockValue ? Math.round(metrics.totalStockValue).toLocaleString("en-IN") : "0"}
            </span>
          </div>
          <span className="p-3 bg-blue-500/10 text-blue-500 rounded-xl"><Wallet size={20} /></span>
        </div>

        {/* Low Stock Items */}
        <div className="p-4 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-850 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9.5px] text-zinc-400 uppercase font-black tracking-wider block">Low Stock Items</span>
            <span className="text-lg font-black text-zinc-900 dark:text-white block">{metrics.lowStockCount}</span>
          </div>
          <span className="p-3 bg-amber-500/10 text-amber-500 rounded-xl"><AlertTriangle size={20} /></span>
        </div>

        {/* Out Of Stock */}
        <div className="p-4 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-855 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9.5px] text-zinc-400 uppercase font-black tracking-wider block">Out Of Stock</span>
            <span className="text-lg font-black text-zinc-900 dark:text-white block">{metrics.outOfStockCount}</span>
          </div>
          <span className="p-3 bg-rose-500/10 text-rose-500 rounded-xl"><AlertOctagon size={20} /></span>
        </div>

        {/* Healthy Stock */}
        <div className="p-4 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-850 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9.5px] text-zinc-400 uppercase font-black tracking-wider block">Healthy Stock</span>
            <span className="text-lg font-black text-zinc-900 dark:text-white block">{metrics.healthyStockCount}</span>
          </div>
          <span className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl"><CheckCircle size={20} /></span>
        </div>
      </section>

      {/* 3. Filter Controls Section */}
      <section className="p-4 bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-850 rounded-2xl shadow-sm flex flex-wrap items-center gap-3 shrink-0">

        {/* Search */}
        <div className="space-y-1">
          <span className="text-[9px] uppercase text-zinc-450 font-extrabold tracking-wider block">Search Ingredient</span>
          <div className="relative">
            <input
              type="text"
              placeholder="Name, Code, SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-lg font-bold text-zinc-800 dark:text-white focus:border-[var(--primary)] outline-none min-w-[200px]"
            />
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          </div>
        </div>

        {/* Store Selection (Multi-select checkbox dropdown) */}
        <div className="space-y-1 relative">
          <span className="text-[9px] uppercase text-zinc-450 font-extrabold tracking-wider block">Filter Stores</span>
          <button
            type="button"
            onClick={() => setShowStorePopover(!showStorePopover)}
            className="px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-lg text-left text-zinc-800 dark:text-white font-bold flex items-center justify-between min-w-[150px] cursor-pointer"
          >
            <span>
              {selectedStores.length === 0
                ? "All Outlets"
                : `${selectedStores.length} Selected`}
            </span>
            <ChevronDown size={12} className="text-zinc-400" />
          </button>

          {showStorePopover && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowStorePopover(false)} />
              <div className="absolute left-0 mt-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl shadow-xl p-2 w-64 z-40 text-left font-bold text-zinc-650 dark:text-zinc-350 space-y-2">
                <p className="text-[9px] text-zinc-400 uppercase font-extrabold pb-1 border-b dark:border-zinc-850">Select Stores</p>
                <div className="max-h-[200px] overflow-y-auto space-y-1.5 scrollbar-thin">
                  {stores.map((s) => (
                    <label key={s._id} className="flex items-center gap-2 px-1 py-0.5 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded cursor-pointer text-[11px]">
                      <input
                        type="checkbox"
                        checked={selectedStores.includes(s._id)}
                        onChange={() => toggleStoreSelection(s._id)}
                        className="rounded border-zinc-300 accent-[var(--primary)]"
                      />
                      <span>{s.storeName.replace("Papa Veg Pizza - ", "")}</span>
                    </label>
                  ))}
                </div>
                <div className="flex justify-end gap-1.5 pt-1 border-t dark:border-zinc-850">
                  <button
                    onClick={() => { setSelectedStores([]); setFilters(prev => ({ ...prev, storeId: "" })); setShowStorePopover(false); }}
                    className="px-2 py-1 text-[9px] border rounded hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleApplyStoresFilter}
                    className="px-2 py-1 text-[9px] bg-[var(--primary)] text-white rounded hover:bg-[var(--primary-hover)] font-black"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Category */}
        <div className="space-y-1">
          <span className="text-[9px] uppercase text-zinc-450 font-extrabold tracking-wider block">Category</span>
          <select
            value={filters.category}
            onChange={(e) => { setFilters(prev => ({ ...prev, category: e.target.value })); setPage(1); }}
            className="px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-lg text-zinc-800 dark:text-white font-bold cursor-pointer"
          >
            <option value="ALL_CATEGORIES">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div className="space-y-1">
          <span className="text-[9px] uppercase text-zinc-450 font-extrabold tracking-wider block">Stock Status</span>
          <select
            value={filters.status}
            onChange={(e) => { setFilters(prev => ({ ...prev, status: e.target.value })); setPage(1); }}
            className="px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-lg text-zinc-800 dark:text-white font-bold cursor-pointer"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Reset Filter Button */}
        <button
          onClick={handleResetFilters}
          className="px-4 py-1.5 border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-500 rounded-lg transition-all cursor-pointer font-bold mt-4"
        >
          Reset Filters
        </button>

      </section>

      {/* 4. Table view or Empty States */}
      {isError ? (
        <div className="p-8 text-center border border-dashed border-red-200 dark:border-red-950 bg-red-50/5 text-red-650 rounded-2xl max-w-md mx-auto space-y-4 font-bold shrink-0">
          <AlertOctagon size={32} className="mx-auto text-red-500 animate-pulse" />
          <div>
            <h3 className="text-sm">Unable to load stock information</h3>
            <p className="text-[10px] text-red-400 mt-1">An error occurred while fetching real-time database stock levels.</p>
          </div>
          <button onClick={() => refetch()} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl shadow-md">
            Retry Loading
          </button>
        </div>
      ) : isLoading ? (
        renderLoadingSkeleton()
      ) : stocksList.length > 0 ? (
        <div className="border border-zinc-150 dark:border-zinc-850 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-sm relative">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-150 dark:border-zinc-800 text-[9.5px] uppercase text-zinc-400 font-extrabold sticky top-0 z-10">
                  <th className="p-3.5 pl-4 text-center w-10">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={selectedRows.length === stocksList.length && stocksList.length > 0}
                      className="accent-[var(--primary)]"
                    />
                  </th>
                  <th className="p-3.5 pl-2 font-bold">Ingredient</th>
                  <th className="p-3.5 font-bold">Store Outlet</th>
                  <th className="p-3.5 text-right font-bold">Available Stock</th>
                  <th className="p-3.5 text-right font-bold">Reorder Level</th>
                  <th className="p-3.5 text-right font-bold">Ideal Stock</th>
                  <th className="p-3.5 text-center font-bold">Status</th>
                  <th className="p-3.5 font-bold">Last Audit</th>
                  <th className="p-3.5 pr-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 text-zinc-650 dark:text-zinc-350">
                {stocksList.map((item) => (
                  <tr
                    key={item._id}
                    className={`hover:bg-zinc-50/40 dark:hover:bg-zinc-900/10 font-semibold transition-all ${selectedRows.includes(item._id) ? "bg-zinc-50 dark:bg-zinc-900/30" : ""
                      }`}
                  >
                    {/* Checkbox selection */}
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(item._id)}
                        onChange={() => handleSelectRow(item._id)}
                        className="accent-[var(--primary)]"
                      />
                    </td>

                    {/* Image & Ingredient */}
                    <td className="p-3 pl-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-100 border border-zinc-200 dark:border-zinc-800 shrink-0">
                          <img
                            src={item.ingredient?.image}
                            alt={item.ingredient?.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-extrabold text-zinc-900 dark:text-white text-xs">{item.ingredient?.name}</p>
                          <p className="text-[8.5px] text-zinc-450 font-mono mt-0.5">
                            Code: {item.ingredient?.ingredientCode} {item.ingredient?.sku && `• SKU: ${item.ingredient?.sku}`}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Store Outlet */}
                    <td className="p-3">
                      <div>
                        <p className="font-bold text-zinc-700 dark:text-zinc-200">{item.storeName.replace("Papa Veg Pizza - ", "")}</p>
                        <p className="text-[8.5px] text-zinc-400 font-mono mt-0.5">{item.storeCode}</p>
                      </div>
                    </td>

                    {/* Available Stock */}
                    <td className="p-3 text-right font-black text-sm text-zinc-900 dark:text-white">
                      {item.availableStock} <span className="text-[9.5px] font-bold text-zinc-400">{item.ingredient?.unit}</span>
                    </td>

                    {/* Reorder Level */}
                    <td className="p-3 text-right text-zinc-450 font-mono">
                      {item.reorderLevel} {item.ingredient?.unit}
                    </td>

                    {/* Ideal Stock */}
                    <td className="p-3 text-right text-zinc-400 font-mono">
                      {item.idealStock} {item.ingredient?.unit}
                    </td>

                    {/* Dynamic Status Badge */}
                    <td className="p-3 text-center">
                      {getStatusBadge(item.status)}
                    </td>

                    {/* Last Audit Time */}
                    <td className="p-3 text-zinc-400 whitespace-nowrap">
                      {getRelativeTime(item.lastUpdated)}
                    </td>

                    {/* Actions Menu */}
                    <td className="p-3 pr-4 text-right relative">
                      <button
                        onClick={() => setActiveMenuId(activeMenuId === item._id ? null : item._id)}
                        className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-650 cursor-pointer inline-block"
                      >
                        <MoreVertical size={13} />
                      </button>

                      {/* Dropdown Box overlay */}
                      {activeMenuId === item._id && (
                        <>
                          <div className="fixed inset-0 z-20" onClick={() => setActiveMenuId(null)} />
                          <div className="absolute right-4 mt-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl shadow-xl py-1.5 w-40 z-30 animate-fade-down text-left font-bold text-zinc-650 dark:text-zinc-350">
                            <button
                              onClick={() => handleAction("view", item)}
                              className="w-full px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-900 flex items-center gap-2 cursor-pointer"
                            >
                              <Eye size={12} className="text-zinc-450" />
                              <span>View Stock</span>
                            </button>
                            <button
                              onClick={() => handleAction("adjust", item)}
                              className="w-full px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-900 flex items-center gap-2 cursor-pointer text-zinc-900 dark:text-white"
                            >
                              <Edit2 size={12} className="text-zinc-450" />
                              <span>Adjust Stock</span>
                            </button>
                            <button
                              onClick={() => handleAction("history", item)}
                              className="w-full px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-900 flex items-center gap-2 cursor-pointer"
                            >
                              <History size={12} className="text-zinc-450" />
                              <span>Ledger Logs</span>
                            </button>
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <footer className="p-4 border-t border-zinc-150 dark:border-zinc-855 flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-50/50 dark:bg-zinc-950/20 text-[10px] text-zinc-450 font-bold shrink-0">
            <div className="flex items-center gap-2">
              <span>Show</span>
              <select
                value={limit}
                onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                className="px-2 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-700 dark:text-zinc-350 cursor-pointer outline-none"
              >
                <option value={5}>5 Rows</option>
                <option value={10}>10 Rows</option>
                <option value={20}>20 Rows</option>
              </select>
              <span>of {totalCount} total inventory records</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="p-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 disabled:opacity-40 transition-all cursor-pointer"
              >
                <ChevronLeft size={13} />
              </button>
              <span className="px-3 py-1 rounded bg-zinc-900 dark:bg-zinc-850 text-white font-extrabold shadow-sm">
                Page {page}
              </span>
              <button
                disabled={page * limit >= totalCount}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 disabled:opacity-40 transition-all cursor-pointer"
              >
                <ChevronRight size={13} />
              </button>
            </div>
          </footer>
        </div>
      ) : (
        /* Empty State */
        <div className="p-12 text-center border-2 border-dashed border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-2xl max-w-md mx-auto space-y-4">
          <div className="w-12 h-12 rounded-full bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center mx-auto border dark:border-zinc-800">
            <Layers size={20} className="text-zinc-400 stroke-[1.5]" />
          </div>
          <div>
            <h3 className="font-extrabold text-zinc-950 dark:text-white text-sm">No inventory records found</h3>
            <p className="text-zinc-450 mt-1 leading-relaxed">No matching stock level logs exists in this index catalog.</p>
          </div>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-black rounded-xl shadow-md active:scale-95 transition-all"
          >
            Refresh Inventory
          </button>
        </div>
      )}

      {/* 5. Sticky Floating Bulk Actions Bar */}
      {selectedRows.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-zinc-950 border border-zinc-800 text-white rounded-2xl py-3 px-5 shadow-2xl flex items-center gap-4 animate-fade-up z-30 font-bold">
          <span className="text-[10.5px] border-r border-zinc-800 pr-4">
            <span className="text-[var(--primary)] font-black">{selectedRows.length}</span> rows selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkExport}
              className="p-2 bg-zinc-900 hover:bg-zinc-855 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
            >
              <Download size={13} className="text-zinc-400" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handleBulkPrint}
              className="p-2 bg-zinc-900 hover:bg-zinc-855 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
            >
              <Printer size={13} className="text-zinc-400" />
              <span>Print Selected</span>
            </button>
            <button
              onClick={handleBulkDownloadPDF}
              className="p-2 bg-zinc-900 hover:bg-zinc-855 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
            >
              <FileText size={13} className="text-zinc-400" />
              <span>PDF Report</span>
            </button>
          </div>
          <button
            onClick={() => setSelectedRows([])}
            className="text-zinc-400 hover:text-white transition-all text-[10px]"
          >
            Deselect All
          </button>
        </div>
      )}

      {/* ==================================================== */}
      {/* OVERLAY COMPONENTS                                   */}
      {/* ==================================================== */}

      {/* Adjust Stock Level Modal */}
      <AdjustStockModal
        isOpen={activeModal === "adjust"}
        onClose={() => {
          setActiveModal(null);
          setSelectedStockRecord(null);
        }}
        stockRecord={selectedStockRecord}
      />

      {/* Stock Details Drawer */}
      <StockDetailsDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedStockRecord(null);
        }}
        stockRecord={selectedStockRecord}
        onAdjustClick={(record) => {
          setIsDrawerOpen(false);
          setSelectedStockRecord(record);
          setActiveModal("adjust");
        }}
      />

      {/* Transaction History / Audit Logs Modal */}
      <TransactionHistoryModal
        isOpen={activeModal === "history" || activeModal === "history-audit"}
        onClose={() => {
          setActiveModal(null);
          setSelectedStockRecord(null);
        }}
      />

    </div>
  );
}
