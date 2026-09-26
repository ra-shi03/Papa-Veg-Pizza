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
  MapPin,
  TrendingUp,
  Download,
  Upload,
  RefreshCw,
  Sliders,
  DollarSign
} from "lucide-react";
import { adminClient } from "@/services/api/axios";

export default function ProductsData({
  onViewProduct,
  onEditProduct,
  onCloneProduct,
  onArchiveProduct,
  onDeleteProduct,
  onBulkAction
}) {
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [sectionFilter, setSectionFilter] = useState("All Sections");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  // Sorting
  const [sortConfig, setSortConfig] = useState({ key: "name", direction: "asc" });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await adminClient.get("/food/admin/products");
      if (res?.data?.data) {
        // Backend might return products in res.data.data.foods or just res.data.data
        const fetchedProducts = Array.isArray(res.data.data) ? res.data.data : (res.data.data.foods || []);
        
        // Map _id to id for the table rendering and filter logic
        const normalizedProducts = fetchedProducts.map(p => ({
          ...p,
          id: p._id || p.id,
          lastUpdated: p.lastUpdated || (p.updatedAt ? new Date(p.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "N/A"),
          price: p.price != null ? String(p.price) : "0", // ensure price is a string for the sort function
          status: p.status || "Active",
          availability: p.availability || "In Stock",
        }));
        setProducts(normalizedProducts);
      }
    } catch (err) {
      console.error("Failed to fetch products", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    const handleSync = () => {
      fetchProducts();
    };
    window.addEventListener("pvp_products_changed_v2", handleSync);
    return () => window.removeEventListener("pvp_products_changed_v2", handleSync);
  }, []);

  // Debouncing search term inputs (500ms delay)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);



  // Handle outside click to close active row action menus
  useEffect(() => {
    const handleOutsideClick = () => setActiveDropdown(null);
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    debouncedSearch,
    categoryFilter,
    sectionFilter,
    statusFilter,
    dateRange
  ]);

  // Filter logic
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(debouncedSearch.toLowerCase());
    
    const catName = p.categoryId?.label || p.category || '-';
    const matchesCategory = categoryFilter === "All Categories" || catName === categoryFilter;
    
    const secName = p.sectionId?.name || p.section || '-';
    const matchesSection = sectionFilter === "All Sections" || secName === sectionFilter;

    const matchesStatus = statusFilter === "All" || p.status === statusFilter;

    // Date range picker simulation
    let matchesDate = true;
    if (dateRange.start && dateRange.end) {
      const pDate = new Date(p.lastUpdated);
      const sDate = new Date(dateRange.start);
      const eDate = new Date(dateRange.end);
      matchesDate = pDate >= sDate && pDate <= eDate;
    }

    return (
      matchesSearch &&
      matchesCategory &&
      matchesSection &&
      matchesStatus &&
      matchesDate
    );
  });

  const uniqueCategories = [...new Set(products.map(p => p.categoryId?.label || p.category || '-').filter(c => c !== '-'))];
  const uniqueSections = [...new Set(products.map(p => p.sectionId?.name || p.section || '-').filter(s => s !== '-'))];

  // Sort logic
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    let aVal = a[sortConfig.key];
    let bVal = b[sortConfig.key];

    // Clean price for sorting
    if (sortConfig.key === "price") {
      aVal = parseFloat(aVal.replace(/[^\d.]/g, "")) || 0;
      bVal = parseFloat(bVal.replace(/[^\d.]/g, "")) || 0;
    }

    if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  // Pagination logic
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = sortedProducts.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(sortedProducts.length / rowsPerPage) || 1;

  // Row selection helpers
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

  // Availability status badge helper
  const getAvailabilityBadge = (av) => {
    if (av === "In Stock") {
      return (
        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 text-[9px] uppercase tracking-wider font-bold rounded">
          In Stock
        </span>
      );
    }
    if (av === "Low Stock") {
      return (
        <span className="px-2 py-0.5 bg-orange-100 text-orange-850 dark:bg-orange-900/30 dark:text-orange-400 text-[9px] uppercase tracking-wider font-bold rounded">
          Low Stock
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 text-[9px] uppercase tracking-wider font-bold rounded">
        Out Of Stock
      </span>
    );
  };

  // Status badges helper
  const getStatusBadge = (st) => {
    if (st === "Active") {
      return (
        <span className="px-2 py-0.5 bg-green-500 text-white text-[9px] uppercase tracking-wider font-bold rounded">
          Active
        </span>
      );
    }
    if (st === "Draft") {
      return (
        <span className="px-2 py-0.5 bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-350 text-[9px] uppercase tracking-wider font-bold rounded">
          Draft
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 bg-amber-500 text-white text-[9px] uppercase tracking-wider font-bold rounded">
        Archived
      </span>
    );
  };

  return (
    <>
      {/* Search Toolbar & Filter Panel */}
      <section className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-3 space-y-3">
        
        {/* Main search and action row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 select-none">
          <div className="flex items-center gap-2 flex-1 w-full">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
              <input
                type="text"
                placeholder="Search by Product Name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-8 pl-8 pr-3 border border-zinc-200 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-950 text-xs font-semibold rounded-lg focus:outline-none focus:border-[var(--primary)] transition-all text-black dark:text-white"
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1.5 text-xs font-bold text-[var(--primary)] hover:bg-[var(--primary)]/10 px-3 py-1.5 rounded-lg transition-all border border-zinc-200 dark:border-zinc-800 shrink-0"
            >
              <Filter size={12} />
              <span>Filters</span>
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
            <button className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-550 dark:text-zinc-400 transition-colors border border-zinc-200 dark:border-zinc-800" title="Bulk Import">
              <Upload size={14} />
            </button>
            <button className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-550 dark:text-zinc-400 transition-colors border border-zinc-200 dark:border-zinc-800" title="Bulk Export">
              <Download size={14} />
            </button>
            <button className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-550 dark:text-zinc-400 transition-colors border border-zinc-200 dark:border-zinc-800" title="Refresh list">
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* Expandable detailed Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5 pt-3 border-t border-zinc-200 dark:border-zinc-800 animate-in slide-in-from-top-2 duration-250 select-none">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full h-8 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-semibold outline-none focus:border-[var(--primary)] transition-all text-black dark:text-white"
              >
                <option>All Categories</option>
                {uniqueCategories.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Section</label>
              <select
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value)}
                className="w-full h-8 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-semibold outline-none focus:border-[var(--primary)] transition-all text-black dark:text-white"
              >
                <option>All Sections</option>
                {uniqueSections.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Publish Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-8 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-955 text-xs font-semibold outline-none focus:border-[var(--primary)] transition-all text-black dark:text-white"
              >
                <option>All</option>
                <option>Active</option>
                <option>Draft</option>
                <option>Archived</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Updated Date</label>
                <button
                  type="button"
                  onClick={() => {
                    setCategoryFilter("All Categories");
                    setSectionFilter("All Sections");
                    setStatusFilter("All");
                    setSearchTerm("");
                    setDateRange({ start: "", end: "" });
                  }}
                  className="flex items-center gap-1 text-[10px] font-bold text-[var(--primary)] hover:opacity-80 transition-colors"
                >
                  <RefreshCw size={10} /> Reset
                </button>
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="w-1/2 h-8 px-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-[10px] font-semibold outline-none focus:border-[var(--primary)] text-black dark:text-white"
                />
                <span className="text-zinc-400 text-xs">-</span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="w-1/2 h-8 px-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-[10px] font-semibold outline-none focus:border-[var(--primary)] text-black dark:text-white"
                />
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
            <span className="text-xs font-bold">{selectedRows.length} items selected</span>
          </div>
          <div className="flex gap-2">
            {["Activate", "Deactivate", "Archive", "Delete"].map((action) => (
              <button
                key={action}
                onClick={() => {
                  onBulkAction?.(action, selectedRows);
                  setSelectedRows([]);
                }}
                className={`px-3 py-1 rounded text-[10px] font-black transition-colors ${
                  action === "Delete"
                    ? "bg-red-600 hover:bg-red-700"
                    : action === "Archive"
                    ? "bg-amber-600 hover:bg-amber-700"
                    : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                }`}
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Products Table */}
      <section className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden select-none">
        <div className="overflow-x-auto w-full relative">
          <table className="w-full border-collapse text-left text-xs min-w-[900px]">
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
                <th className="px-3 py-2.5 w-16 text-center">Image</th>
                <th className="px-3 py-2.5 cursor-pointer hover:text-[var(--primary)]" onClick={() => handleSort("name")}>
                  Product Name
                </th>
                <th className="px-3 py-2.5 cursor-pointer hover:text-[var(--primary)]" onClick={() => handleSort("category")}>
                  Category
                </th>
                <th className="px-3 py-2.5 cursor-pointer hover:text-[var(--primary)]" onClick={() => handleSort("section")}>
                  Section
                </th>
                <th className="px-3 py-2.5">
                  Prices
                </th>
                <th className="px-3 py-2.5 text-center">Status</th>
                <th className="px-3 py-2.5 text-center cursor-pointer hover:text-[var(--primary)]" onClick={() => handleSort("createdAt")}>
                  Created Date
                </th>
                <th className="px-3 py-2.5 text-right sticky right-0 bg-zinc-50 dark:bg-zinc-950 shadow-l z-30 w-24">Actions</th>
              </tr>
            </thead>
            
            {/* Table Body */}
            <tbody className="divide-y divide-zinc-150 dark:divide-zinc-800">
              {currentRows.map((p) => {
                const isChecked = selectedRows.includes(p.id);
                const isVeg = p.vegType !== "non-veg";

                return (
                  <tr
                    key={p.id}
                    className={`hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors ${
                      isChecked ? "bg-[var(--primary)]/5" : ""
                    }`}
                  >
                    <td className="px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleSelectRow(p.id)}
                        className="w-4 h-4 rounded border-zinc-300 text-[var(--primary)] focus:ring-[var(--primary)]/20 cursor-pointer"
                      />
                    </td>
                    <td className="px-3 py-2 flex justify-center">
                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 shrink-0">
                        <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2 min-w-[180px]">
                        <div className={`w-3.5 h-3.5 border-2 flex items-center justify-center rounded-sm bg-white shrink-0 ${isVeg ? "border-green-600" : "border-red-600"}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${isVeg ? "bg-green-600" : "bg-red-600"}`} />
                        </div>
                        <span className="font-bold text-zinc-900 dark:text-zinc-100 truncate">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-zinc-650 dark:text-zinc-300 font-semibold">{p.categoryId?.label || p.category || '-'}</td>
                    <td className="px-3 py-2 text-zinc-650 dark:text-zinc-300 font-semibold">{p.sectionId?.name || p.section || '-'}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-col gap-0.5">
                        {(p.sizes || []).map((sz, i) => (
                          <span key={i} className="text-[10px] text-zinc-600 dark:text-zinc-400 font-medium">
                            {sz.size}: <span className="font-bold text-zinc-900 dark:text-zinc-100">₹{sz.price}</span>
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center">{getStatusBadge(p.status)}</td>
                    <td className="px-3 py-2 text-center text-zinc-500 font-medium text-[10px]">
                      {p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-GB') : p.lastUpdated}
                    </td>
                    
                    {/* Row Actions */}
                    <td className="px-3 py-2 text-right sticky right-0 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 shadow-l transition-colors z-10">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onViewProduct?.(p)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => onEditProduct?.(p)}
                          className="p-1.5 text-zinc-500 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                          title="Edit Product"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => onDeleteProduct?.(p)}
                          className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title="Delete Product"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {sortedProducts.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-zinc-500 font-bold text-xs">
                    No products found matching the criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Sticky Table Footer (Pagination) */}
        <div className="px-4 py-3 bg-zinc-55 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-850 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-semibold select-none">
          <div className="flex items-center gap-2">
            <span className="text-zinc-500">Rows per page:</span>
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
              Showing {indexOfFirstRow + 1} to {Math.min(indexOfLastRow, sortedProducts.length)} of {sortedProducts.length} entries
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
