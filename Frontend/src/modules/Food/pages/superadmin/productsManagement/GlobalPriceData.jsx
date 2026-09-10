import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Eye,
  Edit,
  Copy,
  Archive,
  Trash2,
  Check,
  X,
  Play,
  Pause,
  Download,
  Upload,
  RefreshCw,
  History,
  AlertTriangle
} from "lucide-react";

export default function GlobalPriceData({
  pricingRules = [],
  onViewRule,
  onEditRule,
  onDuplicateRule,
  onStatusChange,
  onDeleteRule,
  onHistoryRule,
  onCreateRule,
  onBulkUpdate,
  onImportPrices,
  onExportPrices
}) {
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Filter fields states
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [variantFilter, setVariantFilter] = useState("All");
  const [regionFilter, setRegionFilter] = useState("All");
  const [zoneFilter, setZoneFilter] = useState("All");
  const [territoryFilter, setTerritoryFilter] = useState("All");
  const [franchiseFilter, setFranchiseFilter] = useState("All");
  const [storeFilter, setStoreFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  // Sorting
  const [sortConfig, setSortConfig] = useState({ key: "productName", direction: "asc" });

  // Pagination simulator
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Debounce search term (500ms delay)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [
    debouncedSearch,
    categoryFilter,
    variantFilter,
    regionFilter,
    zoneFilter,
    territoryFilter,
    franchiseFilter,
    storeFilter,
    statusFilter,
    dateRange
  ]);

  // Handle outside click to close menus
  useEffect(() => {
    const handleOutsideClick = () => setActiveDropdown(null);
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  // Filter Rules
  const filteredRules = pricingRules.filter((r) => {
    const matchesSearch =
      r.productName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      r.productId.toLowerCase().includes(debouncedSearch.toLowerCase());
    
    const matchesCategory = categoryFilter === "All" || r.category === categoryFilter;
    const matchesVariant = variantFilter === "All" || r.variant === variantFilter;
    const matchesRegion = regionFilter === "All" || r.regionId === regionFilter;
    const matchesZone = zoneFilter === "All" || r.zoneId === zoneFilter;
    const matchesTerritory = territoryFilter === "All" || r.territoryId === territoryFilter;
    const matchesFranchise = franchiseFilter === "All" || r.franchiseId === franchiseFilter;
    const matchesStore = storeFilter === "All" || r.storeId === storeFilter;
    const matchesStatus = statusFilter === "All" || r.status === statusFilter;

    let matchesDates = true;
    if (dateRange.start && dateRange.end) {
      const fromD = new Date(r.validFrom);
      const startD = new Date(dateRange.start);
      const endD = new Date(dateRange.end);
      matchesDates = fromD >= startD && fromD <= endD;
    }

    return (
      matchesSearch &&
      matchesCategory &&
      matchesVariant &&
      matchesRegion &&
      matchesZone &&
      matchesTerritory &&
      matchesFranchise &&
      matchesStore &&
      matchesStatus &&
      matchesDates
    );
  });

  // Sort Rules
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedRules = [...filteredRules].sort((a, b) => {
    let aVal = a[sortConfig.key] || "";
    let bVal = b[sortConfig.key] || "";

    if (sortConfig.key === "basePrice" || sortConfig.key === "effectivePrice") {
      aVal = parseFloat(aVal) || 0;
      bVal = parseFloat(bVal) || 0;
    }

    if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  // Pagination
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = sortedRules.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(sortedRules.length / rowsPerPage) || 1;

  // Selection callbacks
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(currentRows.map((r) => r.id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  const handleBulkAction = (action) => {
    selectedRows.forEach(id => {
      const rule = pricingRules.find(r => r.id === id);
      if (rule) {
        if (action === "delete") {
          onDeleteRule?.(rule, "delete");
        } else if (action === "archive") {
          onStatusChange?.(rule, "archived");
        } else if (action === "activate") {
          onStatusChange?.(rule, "active");
        } else if (action === "deactivate") {
          onStatusChange?.(rule, "draft");
        }
      }
    });
    setSelectedRows([]);
  };

  return (
    <>
      {/* Search Toolbar & Filter Panel */}
      <section className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-3 space-y-3">
        
        {/* Search, filters toggle, and actions */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 select-none">
          <div className="flex items-center gap-2 flex-1 w-full">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
              <input
                type="text"
                placeholder="Search by Product Name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-8 pl-8 pr-3 border border-zinc-200 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-950 text-xs font-semibold rounded-lg focus:outline-none focus:border-[var(--primary)] transition-all text-black dark:text-white"
              />
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1.5 text-xs font-bold text-[var(--primary)] hover:bg-[var(--primary)]/10 px-3 py-1.5 rounded-lg transition-all border border-zinc-200 dark:border-zinc-800 shrink-0 cursor-pointer"
            >
              <Filter size={12} />
              <span>Filters</span>
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
            <button
              onClick={onCreateRule}
              className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white px-3 h-8 rounded-lg flex items-center justify-center gap-1 shadow-md hover:scale-[1.02] active:scale-95 transition-all cursor-pointer font-bold text-[10px] uppercase tracking-wider shrink-0"
            >
              Add Pricing Rule
            </button>
            <button
              onClick={onBulkUpdate}
              className="border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-950 px-3 h-8 rounded-lg flex items-center justify-center gap-1 cursor-pointer font-bold text-[10px] uppercase tracking-wider shrink-0 text-zinc-650 dark:text-zinc-350"
            >
              Bulk Action
            </button>
            <button
              onClick={onImportPrices}
              className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-850 rounded-lg text-zinc-500 hover:text-[var(--primary)] transition-colors border border-zinc-200 dark:border-zinc-800 cursor-pointer"
              title="Import CSV"
            >
              <Upload size={14} />
            </button>
            <button
              onClick={onExportPrices}
              className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-850 rounded-lg text-zinc-500 hover:text-[var(--primary)] transition-colors border border-zinc-200 dark:border-zinc-800 cursor-pointer"
              title="Export CSV"
            >
              <Download size={14} />
            </button>
          </div>
        </div>

        {/* Detailed Filters Panel */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-800 animate-in slide-in-from-top-2 duration-250 select-none text-xs font-semibold">
            {/* Category */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full h-8 px-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-black dark:text-white"
              >
                <option value="All">All Categories</option>
                <option value="Signature Pizzas">Signature Pizzas</option>
                <option value="Classic Pizzas">Classic Pizzas</option>
                <option value="Sides & Bread">Sides & Bread</option>
                <option value="Desserts & Sweets">Desserts & Sweets</option>
                <option value="Beverages">Beverages</option>
              </select>
            </div>

            {/* Variant */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Variant Size</label>
              <select
                value={variantFilter}
                onChange={(e) => setVariantFilter(e.target.value)}
                className="w-full h-8 px-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-955 text-black dark:text-white"
              >
                <option value="All">All Sizes</option>
                <option value="Regular">Regular</option>
                <option value="Medium">Medium</option>
                <option value="Large">Large</option>
              </select>
            </div>

            {/* Region & Zone */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Region & Zone</label>
              <div className="flex gap-1.5">
                <select
                  value={regionFilter}
                  onChange={(e) => setRegionFilter(e.target.value)}
                  className="w-1/2 h-8 px-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-[10px] text-black dark:text-white"
                >
                  <option value="All">All Regions</option>
                  <option value="Central India">Central India</option>
                  <option value="West India">West India</option>
                  <option value="North India">North India</option>
                  <option value="South India">South India</option>
                </select>
                <select
                  value={zoneFilter}
                  onChange={(e) => setZoneFilter(e.target.value)}
                  className="w-1/2 h-8 px-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-[10px] text-black dark:text-white"
                >
                  <option value="All">All Zones</option>
                  <option value="Madhya Pradesh">Madhya Pradesh</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Delhi NCR">Delhi NCR</option>
                  <option value="Gujarat">Gujarat</option>
                </select>
              </div>
            </div>

            {/* Franchise & Store */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Franchise & Store</label>
              <div className="flex gap-1.5">
                <select
                  value={franchiseFilter}
                  onChange={(e) => setFranchiseFilter(e.target.value)}
                  className="w-1/2 h-8 px-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-[10px] text-black dark:text-white"
                >
                  <option value="All">All Franchises</option>
                  <option value="Indore Central">Indore Central</option>
                  <option value="Bhopal Zone">Bhopal Zone</option>
                  <option value="Mumbai Premium">Mumbai Premium</option>
                  <option value="Delhi Express">Delhi Express</option>
                </select>
                <select
                  value={storeFilter}
                  onChange={(e) => setStoreFilter(e.target.value)}
                  className="w-1/2 h-8 px-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-[10px] text-black dark:text-white"
                >
                  <option value="All">All Stores</option>
                  <option value="Vijay Nagar">Vijay Nagar</option>
                  <option value="Scheme 54">Scheme 54</option>
                  <option value="MP Nagar">MP Nagar</option>
                  <option value="Arera Colony">Arera Colony</option>
                  <option value="Bandra West">Bandra West</option>
                </select>
              </div>
            </div>

            {/* Status & Reset */}
            <div className="flex gap-2">
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full h-8 px-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-955 text-black dark:text-white"
                >
                  <option value="All">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="draft">Draft</option>
                  <option value="expired">Expired</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => {
                    setCategoryFilter("All");
                    setVariantFilter("All");
                    setRegionFilter("All");
                    setZoneFilter("All");
                    setTerritoryFilter("All");
                    setFranchiseFilter("All");
                    setStoreFilter("All");
                    setStatusFilter("All");
                    setSearchTerm("");
                    setDateRange({ start: "", end: "" });
                  }}
                  className="h-8 px-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-[10px] font-bold rounded-lg transition-colors text-zinc-650 dark:text-zinc-300 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <RotateCcw size={10} /> Reset
                </button>
              </div>
            </div>

          </div>
        )}
      </section>

      {/* Bulk actions Floating Bar */}
      {selectedRows.length > 0 && (
        <div className="bg-zinc-900 text-white rounded-lg p-2.5 px-4 flex items-center justify-between shadow-xl animate-fade-in border border-zinc-800 select-none">
          <div className="flex items-center gap-3">
            <Check size={14} className="text-[var(--primary)] animate-pulse" />
            <span className="text-xs font-bold">{selectedRows.length} pricing rules selected</span>
          </div>
          <div className="flex gap-2">
            {["Activate", "Deactivate", "Archive", "Delete"].map((action) => (
              <button
                key={action}
                onClick={() => handleBulkAction(action.toLowerCase())}
                className={`px-3 py-1 rounded text-[10px] font-black transition-colors cursor-pointer ${
                  action === "Delete"
                    ? "bg-red-600 hover:bg-red-700"
                    : action === "Archive"
                    ? "bg-amber-600 hover:bg-amber-700"
                    : "bg-zinc-850 hover:bg-zinc-800 text-zinc-250"
                }`}
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Pricing Rules Table */}
      <section className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden select-none">
        <div className="overflow-x-auto w-full relative">
          <table className="w-full border-collapse text-left text-xs min-w-[1500px]">
            {/* Sticky Header */}
            <thead className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-850 text-zinc-500 font-bold uppercase sticky top-0 z-30">
              <tr>
                <th className="px-3 py-2.5 w-10 text-center">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={selectedRows.length === currentRows.length && currentRows.length > 0}
                    className="w-4 h-4 rounded border-zinc-300 text-[var(--primary)] focus:ring-[var(--primary)]/20 cursor-pointer"
                  />
                </th>
                <th className="px-3 py-2.5 cursor-pointer hover:text-[var(--primary)]" onClick={() => handleSort("productName")}>
                  Product Name
                </th>
                <th className="px-3 py-2.5 cursor-pointer hover:text-[var(--primary)]" onClick={() => handleSort("variant")}>
                  Variant
                </th>
                <th className="px-3 py-2.5 cursor-pointer hover:text-[var(--primary)] text-right" onClick={() => handleSort("basePrice")}>
                  Base Price
                </th>
                <th className="px-3 py-2.5 cursor-pointer hover:text-[var(--primary)] text-right" onClick={() => handleSort("effectivePrice")}>
                  Effective Price
                </th>
                <th className="px-3 py-2.5">Currency</th>
                <th className="px-3 py-2.5">Region</th>
                <th className="px-3 py-2.5">Zone</th>
                <th className="px-3 py-2.5">Territory</th>
                <th className="px-3 py-2.5">Franchise</th>
                <th className="px-3 py-2.5">Store</th>
                <th className="px-3 py-2.5">Effective From</th>
                <th className="px-3 py-2.5">Effective To</th>
                <th className="px-3 py-2.5 text-center">Status</th>
                <th className="px-3 py-2.5 text-center">Last Updated</th>
                <th className="px-3 py-2.5 text-right sticky right-0 bg-zinc-50 dark:bg-zinc-950 z-30 w-24">Actions</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-zinc-150 dark:divide-zinc-800">
              {currentRows.map((r) => {
                const isChecked = selectedRows.includes(r.id);
                return (
                  <tr
                    key={r.id}
                    className={`hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors ${
                      isChecked ? "bg-[var(--primary)]/5" : ""
                    }`}
                  >
                    <td className="px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleSelectRow(r.id)}
                        className="w-4 h-4 rounded border-zinc-300 text-[var(--primary)] focus:ring-[var(--primary)]/20 cursor-pointer"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded overflow-hidden border border-zinc-200 dark:border-zinc-800 shrink-0">
                          <img src={r.image} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <span className="font-bold text-zinc-900 dark:text-zinc-100 block">{r.productName}</span>
                          <span className="text-[9px] text-zinc-400 font-mono block">SKU: {r.productId}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-350 font-bold px-1.5 py-0.5 rounded capitalize">
                        {r.variant}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right font-black font-mono text-zinc-500">₹{r.basePrice}</td>
                    <td className="px-3 py-2 text-right font-black font-mono text-emerald-600 dark:text-emerald-450">₹{r.effectivePrice}</td>
                    <td className="px-3 py-2 font-mono text-zinc-500">{r.currency}</td>
                    <td className="px-3 py-2 text-zinc-650 dark:text-zinc-350 font-semibold">{r.regionId || "— (Global)"}</td>
                    <td className="px-3 py-2 text-zinc-605 dark:text-zinc-400">{r.zoneId || "—"}</td>
                    <td className="px-3 py-2 text-zinc-605 dark:text-zinc-405">{r.territoryId || "—"}</td>
                    <td className="px-3 py-2 text-zinc-800 dark:text-zinc-200 font-semibold">{r.franchiseId || "—"}</td>
                    <td className="px-3 py-2 text-[var(--primary)] font-bold">{r.storeId || "—"}</td>
                    <td className="px-3 py-2 text-zinc-500 font-medium">{r.validFrom}</td>
                    <td className="px-3 py-2 text-zinc-500 font-medium">{r.validTo}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-bold ${
                        r.status === "active" ? "bg-green-500 text-white" :
                        r.status === "scheduled" ? "bg-blue-500 text-white" :
                        r.status === "draft" ? "bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-350" :
                        r.status === "expired" ? "bg-red-500 text-white" : "bg-amber-500 text-white"
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center text-zinc-450 font-mono">{r.lastUpdated}</td>
                    
                    {/* Row Actions Menu */}
                    <td className={`px-3 py-2 text-right sticky right-0 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 shadow-l transition-colors ${
                      activeDropdown === r.id ? "z-20" : "z-10"
                    }`}>
                      <div className="relative inline-block text-left">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDropdown((prev) => (prev === r.id ? null : r.id));
                          }}
                          className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                        >
                          <MoreVertical size={14} />
                        </button>

                        {activeDropdown === r.id && (
                          <div className="absolute right-0 bottom-full md:bottom-auto md:top-full mt-1 w-44 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl z-50 overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-850 animate-in fade-in slide-in-from-top-1 text-left">
                            <div className="py-1">
                              <button
                                onClick={() => onViewRule?.(r)}
                                className="w-full text-left px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2 transition-colors cursor-pointer"
                              >
                                <Eye size={12} className="text-zinc-400" /> View Details
                              </button>
                              <button
                                onClick={() => onEditRule?.(r)}
                                className="w-full text-left px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2 transition-colors cursor-pointer"
                              >
                                <Edit size={12} className="text-zinc-400" /> Edit Rule
                              </button>
                              <button
                                onClick={() => onDuplicateRule?.(r)}
                                className="w-full text-left px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2 transition-colors cursor-pointer"
                              >
                                <Copy size={12} className="text-zinc-400" /> Duplicate Rule
                              </button>
                            </div>
                            <div className="py-1">
                              {r.status === "active" ? (
                                <button
                                  onClick={() => onStatusChange?.(r, "draft")}
                                  className="w-full text-left px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2 transition-colors cursor-pointer"
                                >
                                  <Pause size={12} className="text-zinc-400" /> Deactivate
                                </button>
                              ) : (
                                <button
                                  onClick={() => onStatusChange?.(r, "active")}
                                  className="w-full text-left px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2 transition-colors cursor-pointer"
                                >
                                  <Play size={12} className="text-zinc-400" /> Activate
                                </button>
                              )}
                              <button
                                onClick={() => onStatusChange?.(r, "archived")}
                                className="w-full text-left px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2 transition-colors cursor-pointer"
                              >
                                <Archive size={12} className="text-zinc-400" /> Archive
                              </button>
                              <button
                                onClick={() => onHistoryRule?.(r)}
                                className="w-full text-left px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-350 flex items-center gap-2 transition-colors cursor-pointer"
                              >
                                <History size={12} className="text-zinc-400" /> Price History
                              </button>
                            </div>
                            <div className="py-1">
                              <button
                                onClick={() => onDeleteRule?.(r)}
                                className="w-full text-left px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold text-red-500 flex items-center gap-2 transition-colors cursor-pointer"
                              >
                                <Trash2 size={12} className="text-red-400" /> Soft Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {sortedRules.length === 0 && (
                <tr>
                  <td colSpan={16} className="py-8 text-center text-zinc-500 font-bold text-xs">
                    No pricing override rules found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-850 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-semibold select-none">
          <div className="flex items-center gap-2">
            <span className="text-zinc-550">Rows per page:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(parseInt(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded px-1.5 py-0.5"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span className="text-zinc-500 ml-2">
              Showing {indexOfFirstRow + 1} to {Math.min(indexOfLastRow, sortedRules.length)} of {sortedRules.length} entries
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-7 h-7 flex items-center justify-center rounded border border-zinc-205 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            
            {Array.from({ length: totalPages }).map((_, idx) => {
              const pNum = idx + 1;
              return (
                <button
                  key={pNum}
                  onClick={() => setCurrentPage(pNum)}
                  className={`w-7 h-7 flex items-center justify-center rounded border text-xs font-bold transition-all ${
                    currentPage === pNum
                      ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-sm"
                      : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-350"
                  }`}
                >
                  {pNum}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-7 h-7 flex items-center justify-center rounded border border-zinc-205 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
