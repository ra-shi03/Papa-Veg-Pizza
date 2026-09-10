import React, { useState, useEffect } from "react";
import {
  Package,
  Activity,
  AlertTriangle,
  AlertOctagon,
  Search,
  Plus,
  RefreshCw,
  MoreVertical,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit2,
  History,
  Trash2,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import {
  useIngredients,
  useCreateIngredient,
  useUpdateIngredient,
  useUpdateIngredientStatus,
  useSuppliers
} from "./hooks/useIngredients";

// Modals & Drawers
import AddIngredientModal from "./components/AddIngredientModal";
import EditIngredientModal from "./components/EditIngredientModal";
import IngredientDetailsDrawer from "./components/IngredientDetailsDrawer";
import StockHistoryModal from "./components/StockHistoryModal";

const CATEGORIES = ["Dough", "Cheese", "Vegetables", "Sauce", "Packaging", "Seasoning", "Other"];

export default function Ingredients() {
  // Query Filters State
  const [filters, setFilters] = useState({
    search: "",
    category: "ALL_CATEGORIES",
    supplierId: "all",
    status: "all",
    expiryTracking: "all",
    sortBy: "createdAt",
    sortOrder: "desc"
  });

  // Debounced search state
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Overlay states
  const [activeModal, setActiveModal] = useState(null); // 'add', 'edit', 'history', 'disable'
  const [selectedIngredientId, setSelectedIngredientId] = useState(null);
  const [selectedIngredientName, setSelectedIngredientName] = useState("");
  const [selectedIngredientStatus, setSelectedIngredientStatus] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchTerm }));
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Query ingredients
  const queryParams = { ...filters, page, limit };
  const { data: ingredientsResponse, isLoading, isError, refetch } = useIngredients(queryParams);
  const ingredientsList = ingredientsResponse?.ingredients || [];
  const totalCount = ingredientsResponse?.totalCount || 0;

  // Query suppliers for dropdown
  const { data: suppliersResponse } = useSuppliers();
  const suppliers = suppliersResponse?.data || [];

  // Mutations
  const createMutation = useCreateIngredient();
  const updateMutation = useUpdateIngredient();
  const statusMutation = useUpdateIngredientStatus();

  // Metric summaries (computed from total loaded dataset or query params)
  const totalItems = totalCount;
  const activeCount = ingredientsList.filter((i) => i.status === "ACTIVE").length;
  const lowStockCount = ingredientsList.filter((i) => i.belowReorderCount > 0).length;
  const expiringSoonCount = ingredientsList.filter((i) => i.soonExpiringCount > 0).length;

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value
    }));
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilters({
      search: "",
      category: "ALL_CATEGORIES",
      supplierId: "all",
      status: "all",
      expiryTracking: "all",
      sortBy: "createdAt",
      sortOrder: "desc"
    });
    setSearchTerm("");
    setPage(1);
    toast.success("Filters reset successfully");
  };

  const handleAction = (actionType, ingredient) => {
    setActiveMenuId(null);
    setSelectedIngredientId(ingredient._id);
    setSelectedIngredientName(ingredient.name);
    setSelectedIngredientStatus(ingredient.status);

    if (actionType === "view") {
      setIsDrawerOpen(true);
    } else if (actionType === "edit") {
      setActiveModal("edit");
    } else if (actionType === "history") {
      setActiveModal("history");
    } else if (actionType === "toggle_status") {
      setActiveModal("status-confirm");
    }
  };

  const handleAddSubmit = (formData) => {
    createMutation.mutate(formData, {
      onSuccess: () => {
        setActiveModal(null);
      }
    });
  };

  const handleEditSubmit = (id, formData) => {
    updateMutation.mutate(
      { id, data: formData },
      {
        onSuccess: () => {
          setActiveModal(null);
          setSelectedIngredientId(null);
        }
      }
    );
  };

  const handleStatusConfirm = () => {
    const nextStatus = selectedIngredientStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    statusMutation.mutate(
      { id: selectedIngredientId, status: nextStatus },
      {
        onSuccess: () => {
          setActiveModal(null);
          setSelectedIngredientId(null);
        }
      }
    );
  };

  // Render Category Colored Badges
  const getCategoryColor = (cat) => {
    switch (cat?.toLowerCase()) {
      case "dough":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20";
      case "cheese":
        return "bg-yellow-50 text-yellow-700 border-yellow-250 dark:bg-yellow-950/20";
      case "vegetables":
        return "bg-emerald-50 text-emerald-700 border-emerald-250 dark:bg-emerald-950/20";
      case "sauce":
        return "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20";
      case "packaging":
        return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/20";
      case "seasoning":
        return "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/20";
      default:
        return "bg-zinc-50 text-zinc-650 border-zinc-200 dark:bg-zinc-900";
    }
  };

  // Loading Skeleton rendering
  const renderLoadingSkeleton = () => (
    <div className="space-y-4">
      {/* Table Skeleton Rows */}
      <div className="border border-zinc-150 dark:border-zinc-850 rounded-xl overflow-hidden bg-white dark:bg-zinc-900">
        <div className="p-4 border-b border-zinc-150 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 h-10" />
        <div className="divide-y divide-zinc-100 dark:divide-zinc-850">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 flex items-center justify-between gap-4 animate-pulse">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-9 h-9 rounded-full bg-zinc-200 dark:bg-zinc-800 shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 w-1/3 bg-zinc-200 dark:bg-zinc-800 rounded" />
                  <div className="h-2 w-1/4 bg-zinc-100 dark:bg-zinc-850 rounded" />
                </div>
              </div>
              <div className="h-3.5 w-16 bg-zinc-150 dark:bg-zinc-800 rounded" />
              <div className="h-3.5 w-12 bg-zinc-150 dark:bg-zinc-800 rounded" />
              <div className="h-3.5 w-20 bg-zinc-150 dark:bg-zinc-800 rounded" />
              <div className="h-3.5 w-8 bg-zinc-150 dark:bg-zinc-800 rounded" />
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
            <Package className="text-[var(--primary)] shrink-0" size={24} />
            <span>Ingredients</span>
          </h1>
          <p className="text-[10.5px] text-zinc-400 font-bold mt-0.5">
            Manage all raw materials used across franchise stores.
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {isLoading && (
            <span className="flex items-center gap-1 text-[10px] text-[var(--primary)] font-bold animate-pulse">
              <RefreshCw className="animate-spin" size={10} />
              Loading database...
            </span>
          )}
          <button
            onClick={() => refetch()}
            className="p-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-400 hover:text-zinc-650 rounded-xl transition-all cursor-pointer shadow-sm"
            title="Force refresh"
          >
            <RefreshCw size={13} />
          </button>
          <button
            onClick={() => setActiveModal("add")}
            className="px-4 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-black rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
          >
            <Plus size={14} className="stroke-[2.5]" />
            <span>Add Ingredient</span>
          </button>
        </div>
      </header>

      {/* 2. Bento Summary Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Card 1: Total Ingredients */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-4 rounded-xl flex items-center justify-between hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-sm">
          <div className="space-y-0.5 min-w-0">
            <span className="text-[9.5px] font-bold text-zinc-400 uppercase tracking-wider block">Total Ingredients</span>
            <span className="text-xl font-black text-zinc-900 dark:text-white block">{totalItems}</span>
          </div>
          <div className="p-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-lg text-zinc-400">
            <Package size={16} />
          </div>
        </div>

        {/* Card 2: Active Ingredients (Green) */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-4 rounded-xl flex items-center justify-between hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-sm border-l-4 border-l-emerald-500">
          <div className="space-y-0.5 min-w-0">
            <span className="text-[9.5px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Active Ingredients</span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 block">{activeCount}</span>
          </div>
          <div className="p-2 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-lg text-emerald-500">
            <Activity size={16} />
          </div>
        </div>

        {/* Card 3: Low Stock Items (Orange) */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-4 rounded-xl flex items-center justify-between hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-sm border-l-4 border-l-amber-500">
          <div className="space-y-0.5 min-w-0">
            <span className="text-[9.5px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">Low Stock Items</span>
            <span className="text-xl font-black text-amber-600 dark:text-amber-400 block">{lowStockCount}</span>
          </div>
          <div className="p-2 bg-amber-50/50 dark:bg-amber-950/20 rounded-lg text-amber-500">
            <AlertTriangle size={16} />
          </div>
        </div>

        {/* Card 4: Expiring Soon (Red) */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-4 rounded-xl flex items-center justify-between hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-sm border-l-4 border-l-red-500">
          <div className="space-y-0.5 min-w-0">
            <span className="text-[9.5px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider block">Expiring Soon (7d)</span>
            <span className="text-xl font-black text-red-600 dark:text-red-400 block">{expiringSoonCount}</span>
          </div>
          <div className="p-2 bg-red-50/50 dark:bg-red-950/20 rounded-lg text-red-500">
            <AlertOctagon size={16} />
          </div>
        </div>

      </section>

      {/* 3. Dynamic Filter Section Bar */}
      <section className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-4 rounded-xl shadow-sm space-y-3 sticky top-16 z-20">
        <div className="flex flex-wrap items-center gap-3">

          {/* Search Input (Debounced) */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 text-zinc-400" size={13} />
            <input
              type="text"
              placeholder="Search ingredient name, code or SKU"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[var(--primary)] text-zinc-850 dark:text-zinc-200 placeholder-zinc-400 font-medium"
            />
          </div>

          {/* Category Filter */}
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange("category", e.target.value)}
            className="px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-700 dark:text-zinc-350 cursor-pointer min-w-[140px]"
          >
            <option value="ALL_CATEGORIES">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Supplier Filter */}
          <select
            value={filters.supplierId}
            onChange={(e) => handleFilterChange("supplierId", e.target.value)}
            className="px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-700 dark:text-zinc-350 cursor-pointer min-w-[150px]"
          >
            <option value="all">All Suppliers</option>
            {suppliers.map((s) => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            className="px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-700 dark:text-zinc-350 cursor-pointer min-w-[120px]"
          >
            <option value="all">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>

          {/* Expiry Tracking Filter */}
          <select
            value={filters.expiryTracking}
            onChange={(e) => handleFilterChange("expiryTracking", e.target.value)}
            className="px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-700 dark:text-zinc-350 cursor-pointer min-w-[130px]"
          >
            <option value="all">Expiry Tracking</option>
            <option value="enabled">Enabled</option>
            <option value="disabled">Disabled</option>
          </select>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-950 rounded-xl font-bold cursor-pointer transition-colors text-zinc-500"
            >
              Reset Filters
            </button>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-800 text-white font-black rounded-xl shadow-md cursor-pointer transition-all active:scale-[0.98]"
            >
              Apply Filters
            </button>
          </div>

        </div>
      </section>

      {/* 4. Ingredients Table or States */}
      {isError ? (
        <div className="p-8 border border-red-200 dark:border-red-950 bg-red-500/5 text-center rounded-xl space-y-4 max-w-lg mx-auto">
          <AlertCircle size={28} className="text-red-500 mx-auto" />
          <div>
            <h3 className="font-extrabold text-zinc-900 dark:text-white text-sm">Unable to load ingredients</h3>
            <p className="text-zinc-450 mt-1">A database network latency occurred. Please try sync indexing again.</p>
          </div>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-[var(--primary)] text-white font-black rounded-xl shadow-md hover:bg-[var(--primary-hover)] active:scale-95 transition-all"
          >
            Retry Loading
          </button>
        </div>
      ) : isLoading ? (
        renderLoadingSkeleton()
      ) : ingredientsList.length > 0 ? (
        <div className="border border-zinc-150 dark:border-zinc-850 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-150 dark:border-zinc-800 text-[9.5px] uppercase text-zinc-400 font-extrabold sticky top-0 z-10">
                  <th className="p-3.5 pl-4 font-bold">Image</th>
                  <th className="p-3.5 font-bold">Ingredient</th>
                  <th className="p-3.5 font-bold">Category</th>
                  <th className="p-3.5 font-bold">Unit</th>
                  <th className="p-3.5 font-bold text-right">Cost Per Unit</th>
                  <th className="p-3.5 font-bold text-right">Reorder Level</th>
                  <th className="p-3.5 font-bold">Supplier</th>
                  <th className="p-3.5 font-bold text-center">Status</th>
                  <th className="p-3.5 pr-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 text-zinc-650 dark:text-zinc-350">
                {ingredientsList.map((item) => (
                  <tr
                    key={item._id}
                    className={`hover:bg-zinc-50/40 dark:hover:bg-zinc-900/10 font-semibold transition-all ${item.belowReorderCount > 0 ? "bg-red-500/2 dark:bg-red-950/2" : ""
                      }`}
                  >
                    {/* Image */}
                    <td className="p-3 pl-4">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=100&q=80";
                          }}
                        />
                      </div>
                    </td>

                    {/* Ingredient */}
                    <td className="p-3">
                      <div>
                        <p className="font-extrabold text-zinc-900 dark:text-white text-xs">{item.name}</p>
                        <p className="text-[9px] text-zinc-400 font-mono mt-0.5">
                          Code: {item.ingredientCode} {item.sku && `• SKU: ${item.sku}`}
                        </p>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="p-3">
                      <span className={`px-2 py-0.5 border rounded-md text-[8.5px] font-black uppercase ${getCategoryColor(item.category)}`}>
                        {item.category}
                      </span>
                    </td>

                    {/* Unit */}
                    <td className="p-3">{item.unit}</td>

                    {/* Cost */}
                    <td className="p-3 text-right text-emerald-650 font-bold">₹{item.costPerUnit}</td>

                    {/* Reorder Level */}
                    <td className="p-3 text-right">
                      <span className={item.belowReorderCount > 0 ? "text-rose-600 font-bold animate-pulse" : "text-zinc-650 dark:text-zinc-350"}>
                        {item.reorderLevel} {item.unit}
                      </span>
                    </td>

                    {/* Supplier */}
                    <td className="p-3 text-zinc-400 font-medium">{item.supplierName}</td>

                    {/* Status */}
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase inline-block ${item.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30"
                          : "bg-zinc-150 text-zinc-500 dark:bg-zinc-800"
                        }`}>
                        {item.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-3 pr-4 text-right relative">
                      <button
                        onClick={() => setActiveMenuId(activeMenuId === item._id ? null : item._id)}
                        className="p-1.5 rounded-lg hover:bg-zinc-105 dark:hover:bg-zinc-850 text-zinc-400 hover:text-zinc-600 cursor-pointer inline-block"
                      >
                        <MoreVertical size={13} />
                      </button>

                      {/* Dropdown Menu */}
                      {activeMenuId === item._id && (
                        <>
                          <div className="fixed inset-0 z-20" onClick={() => setActiveMenuId(null)} />
                          <div className="absolute right-4 mt-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl shadow-xl py-1.5 w-36 z-30 animate-fade-down text-left font-bold text-zinc-650 dark:text-zinc-350">
                            <button
                              onClick={() => handleAction("view", item)}
                              className="w-full px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-900 flex items-center gap-2 cursor-pointer"
                            >
                              <Eye size={12} className="text-zinc-400" />
                              <span>View Specs</span>
                            </button>
                            <button
                              onClick={() => handleAction("edit", item)}
                              className="w-full px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-900 flex items-center gap-2 cursor-pointer"
                            >
                              <Edit2 size={12} className="text-zinc-400" />
                              <span>Edit details</span>
                            </button>
                            <button
                              onClick={() => handleAction("history", item)}
                              className="w-full px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-900 flex items-center gap-2 cursor-pointer"
                            >
                              <History size={12} className="text-zinc-400" />
                              <span>Stock History</span>
                            </button>
                            <div className="border-t border-zinc-100 dark:border-zinc-900 my-1" />
                            <button
                              onClick={() => handleAction("toggle_status", item)}
                              className={`w-full px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-900 flex items-center gap-2 cursor-pointer ${item.status === "ACTIVE" ? "text-red-650" : "text-emerald-650"
                                }`}
                            >
                              <Trash2 size={12} className="opacity-70" />
                              <span>{item.status === "ACTIVE" ? "Disable" : "Enable"}</span>
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

          {/* Server-side Pagination Footer */}
          <footer className="p-4 border-t border-zinc-150 dark:border-zinc-855 flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-50/50 dark:bg-zinc-950/20 text-[10px] text-zinc-450 font-bold shrink-0">
            <div className="flex items-center gap-2">
              <span>Show</span>
              <select
                value={limit}
                onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                className="px-2 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-700 dark:text-zinc-350 cursor-pointer"
              >
                <option value={5}>5 Rows</option>
                <option value={10}>10 Rows</option>
                <option value={20}>20 Rows</option>
              </select>
              <span>of {totalCount} total ingredients</span>
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
            <Package size={20} className="text-zinc-400 stroke-[1.5]" />
          </div>
          <div>
            <h3 className="font-extrabold text-zinc-950 dark:text-white text-sm">No ingredients found</h3>
            <p className="text-zinc-450 mt-1 leading-relaxed">No matching raw material items exists in this catalog index.</p>
          </div>
          <button
            onClick={() => setActiveModal("add")}
            className="px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-black rounded-xl shadow-md active:scale-95 transition-all"
          >
            Add Ingredient
          </button>
        </div>
      )}

      {/* ==================================================== */}
      {/* OVERLAY COMPONENTS                                   */}
      {/* ==================================================== */}

      {/* Add Modal */}
      <AddIngredientModal
        isOpen={activeModal === "add"}
        onClose={() => setActiveModal(null)}
        onSubmit={handleAddSubmit}
      />

      {/* Edit Modal */}
      <EditIngredientModal
        isOpen={activeModal === "edit"}
        onClose={() => {
          setActiveModal(null);
          setSelectedIngredientId(null);
        }}
        onSubmit={handleEditSubmit}
        ingredientId={selectedIngredientId}
      />

      {/* Details Drawer */}
      <IngredientDetailsDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedIngredientId(null);
        }}
        ingredientId={selectedIngredientId}
        onEditClick={(id) => {
          setSelectedIngredientId(id);
          setActiveModal("edit");
        }}
      />

      {/* Stock Transactions Ledger Modal */}
      <StockHistoryModal
        isOpen={activeModal === "history"}
        onClose={() => {
          setActiveModal(null);
          setSelectedIngredientId(null);
        }}
        ingredientId={selectedIngredientId}
      />

      {/* Enable / Disable Status Change Confirmation Dialog */}
      {activeModal === "status-confirm" && (
        <div className="fixed inset-y-0 right-0 left-0 lg:left-[280px] z-50 overflow-hidden text-xs">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setActiveModal(null)} />
          {/* Box */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl shadow-2xl max-w-sm w-full space-y-4 font-semibold">
              <div className="flex gap-3">
                <span className="p-2 bg-red-500/10 text-red-650 rounded-xl shrink-0"><AlertCircle size={18} /></span>
                <div>
                  <h3 className="text-zinc-900 dark:text-white font-extrabold text-sm">
                    {selectedIngredientStatus === "ACTIVE" ? "Disable" : "Enable"} Ingredient?
                  </h3>
                  <p className="text-zinc-400 mt-1 leading-normal">
                    Are you sure you want to change the status of <span className="text-zinc-900 dark:text-white font-extrabold">{selectedIngredientName}</span>?
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setActiveModal(null)}
                  className="px-3.5 py-2 border border-zinc-250 dark:border-zinc-800 rounded-xl font-bold hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-500 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStatusConfirm}
                  className="px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-black rounded-xl shadow-md cursor-pointer"
                >
                  Confirm Change
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
