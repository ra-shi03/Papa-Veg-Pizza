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
  RefreshCw,
  Sliders,
  DollarSign,
  XCircle
} from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";
import { adminClient } from "@/services/api/axios";

const CategorySearchDropdown = ({ value, onChange, options }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const dropdownRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = ["All Categories", ...options].filter(opt => opt.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-8 px-2.5 flex items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-semibold cursor-pointer text-black dark:text-white"
      >
        <span className="truncate">{value}</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b border-zinc-100 dark:border-zinc-800">
            <div className="relative">
              <Search className="absolute left-2 top-1.5 w-3 h-3 text-zinc-400" />
              <input
                type="text"
                autoFocus
                placeholder="Search category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-6 pr-2 py-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-md text-xs focus:outline-none dark:text-white"
              />
            </div>
          </div>
          <div className="max-h-40 overflow-y-auto">
            {filteredOptions.length > 0 ? filteredOptions.map(opt => (
              <div
                key={opt}
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                  setSearch("");
                }}
                className={`px-3 py-2 text-xs cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:text-zinc-300 ${value === opt ? 'bg-zinc-50 dark:bg-zinc-800 font-bold' : ''}`}
              >
                {opt}
              </div>
            )) : (
              <div className="px-3 py-2 text-xs text-zinc-500 text-center">No categories found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default function ProductsData({
  onViewProduct,
  onEditProduct,
  onCloneProduct,
  onArchiveProduct,
  onDeleteProduct,
  onBulkAction,
  onFilterChange,
  externalStatusFilter,
  onClearExternalStatus
}) {
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  // Handle filter selection directly from KPI cards
  useEffect(() => {
    if (externalStatusFilter) {
      setStatusFilter(externalStatusFilter);
      setCurrentPage(1);
      onClearExternalStatus?.();
    }
  }, [externalStatusFilter]);

  // Notify parent of filter change to sync KPI cards
  useEffect(() => {
    onFilterChange?.({
      search: debouncedSearch,
      category: categoryFilter,
      status: statusFilter
    });
  }, [debouncedSearch, categoryFilter, statusFilter]);

  // Sorting
  const [sortConfig, setSortConfig] = useState({ key: "name", direction: "asc" });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [products, setProducts] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch unique categories from backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await adminClient.get("/food/admin/category-products");
        if (res?.data?.data) {
          const cats = res.data.data
            .map(c => c.label || c.name)
            .filter(Boolean)
            .map(c => c.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
          setCategoriesList([...new Set(cats)]);
        }
      } catch (err) {
        console.warn("Could not fetch categories list", err);
      }
    };
    fetchCategories();
  }, []);

  const fetchProducts = async (page = currentPage, limit = rowsPerPage) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit
      };

      if (debouncedSearch && debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }
      if (categoryFilter && categoryFilter !== "All Categories" && categoryFilter !== "All") {
        params.category = categoryFilter;
      }
      if (statusFilter && statusFilter !== "All") {
        params.status = statusFilter;
      }

      const res = await adminClient.get("/food/admin/products", { params });
      if (res?.data?.data) {
        const fetchedProducts = Array.isArray(res.data.data) ? res.data.data : (res.data.data.foods || []);
        
        const normalizedProducts = fetchedProducts.map(p => {
          let categoryLabel = p.categoryId?.label || p.categoryId?.name || p.category || '-';
          if (categoryLabel !== '-') {
            categoryLabel = categoryLabel.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          }
          const updatedP = { ...p };
          if (updatedP.categoryId && typeof updatedP.categoryId === 'object') {
             updatedP.categoryId.label = categoryLabel;
          } else {
             updatedP.category = categoryLabel;
          }
          
          return {
            ...updatedP,
            id: updatedP._id || updatedP.id,
            category: categoryLabel,
            lastUpdated: updatedP.lastUpdated || (updatedP.updatedAt ? new Date(updatedP.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "N/A"),
            price: updatedP.price != null ? String(updatedP.price) : "0",
            status: updatedP.status || "Active",
            availability: updatedP.availability || "In Stock",
          };
        });
        setProducts(normalizedProducts);

        if (res.data.pagination) {
          setTotalCount(res.data.pagination.totalCount ?? 0);
          setTotalPages(res.data.pagination.totalPages ?? 1);
        } else {
          const count = res.data.totalCount ?? normalizedProducts.length;
          setTotalCount(count);
          setTotalPages(Math.max(1, Math.ceil(count / limit)));
        }
      }
    } catch (err) {
      console.error("Failed to fetch products", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(currentPage, rowsPerPage);
    const handleSync = () => {
      fetchProducts(currentPage, rowsPerPage);
    };
    window.addEventListener("pvp_products_changed_v2", handleSync);
    return () => window.removeEventListener("pvp_products_changed_v2", handleSync);
  }, [currentPage, rowsPerPage, debouncedSearch, categoryFilter, statusFilter]);

  // Debouncing search term inputs (500ms delay)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Handle outside click to close active row action menus
  useEffect(() => {
    const handleOutsideClick = () => setActiveDropdown(null);
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  const uniqueCategories = [
    ...new Set([
      ...categoriesList,
      ...products.map(p => p.categoryId?.label || p.category || '-').filter(c => c !== '-')
    ])
  ];

  // PDF Export
  const handleExportPDF = async () => {
    try {
      toast.info("Generating PDF report...");
      let exportList = products;
      try {
        const params = { limit: 1000 };
        if (debouncedSearch && debouncedSearch.trim()) params.search = debouncedSearch.trim();
        if (categoryFilter && categoryFilter !== "All Categories" && categoryFilter !== "All") params.category = categoryFilter;
        if (statusFilter && statusFilter !== "All") params.status = statusFilter;

        const res = await adminClient.get("/food/admin/products", { params });
        if (res?.data?.data) {
          const fullData = Array.isArray(res.data.data) ? res.data.data : (res.data.data.foods || []);
          if (fullData.length > 0) {
            exportList = fullData.map(p => ({
              id: p._id || p.id,
              name: p.name || "N/A",
              category: p.categoryId?.label || p.categoryId?.name || p.category || "-",
              price: `₹${p.price ?? 0}`,
              vegType: p.vegType || "veg",
              status: p.status || "Active",
              availability: p.availability || "In Stock",
              lastUpdated: p.updatedAt ? new Date(p.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "N/A"
            }));
          }
        }
      } catch (err) {
        console.warn("Using current page items for export", err);
      }

      if (!exportList || exportList.length === 0) {
        toast.error("No products available to export.");
        return;
      }

      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

      // Header Banner
      doc.setFillColor(180, 30, 21); // Brand red
      doc.rect(0, 0, 297, 18, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("PAPA VEG PIZZA - PRODUCTS CATALOG REPORT", 14, 12);

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      const timestamp = new Date().toLocaleString("en-IN");
      doc.text(`Generated: ${timestamp} | Total Records: ${exportList.length}`, 190, 12);

      const tableHeaders = [
        ["#", "SKU / ID", "Product Name", "Category", "Price", "Veg / Type", "Status", "Availability", "Last Updated"]
      ];

      const tableBody = exportList.map((p, idx) => [
        idx + 1,
        p.id ? String(p.id).slice(-8).toUpperCase() : "N/A",
        p.name || "-",
        p.category || "-",
        typeof p.price === 'string' && p.price.startsWith('₹') ? p.price : `₹${p.price || 0}`,
        p.vegType || "Veg",
        p.status || "Active",
        p.availability || "In Stock",
        p.lastUpdated || "-"
      ]);

      autoTable(doc, {
        head: tableHeaders,
        body: tableBody,
        startY: 24,
        theme: "grid",
        styles: { fontSize: 8, cellPadding: 2, fontStyle: "normal" },
        headStyles: { fillColor: [180, 30, 21], textColor: [255, 255, 255], fontStyle: "bold" },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 14, right: 14 }
      });

      doc.save(`Papa_Veg_Pizza_Products_${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success("Products catalog PDF downloaded successfully!");
    } catch (err) {
      console.error("Failed to generate PDF:", err);
      toast.error("Failed to download PDF report");
    }
  };

  // Sort logic (client sort on currently fetched page)
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedProducts = [...products].sort((a, b) => {
    let aVal = a[sortConfig.key];
    let bVal = b[sortConfig.key];

    // Clean price for sorting
    if (sortConfig.key === "price") {
      aVal = parseFloat(String(aVal).replace(/[^\d.]/g, "")) || 0;
      bVal = parseFloat(String(bVal).replace(/[^\d.]/g, "")) || 0;
    }

    if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const currentRows = sortedProducts;

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

  // Out of stock toggle handler
  const handleToggleStock = async (product) => {
    const isCurrentlyOut = product.availability === "Out Of Stock" || product.status === "Out Of Stock";
    const nextAvailability = isCurrentlyOut ? "In Stock" : "Out Of Stock";
    const nextStatus = isCurrentlyOut ? "Active" : "Out Of Stock";

    // Optimistically update products table
    setProducts((prev) =>
      prev.map((item) =>
        item.id === product.id
          ? {
              ...item,
              availability: nextAvailability,
              status: nextAvailability === "Out Of Stock" ? "Out Of Stock" : (item.status === "Out Of Stock" ? "Active" : item.status)
            }
          : item
      )
    );

    try {
      const id = product._id || product.id;
      if (id && !String(id).startsWith("PP-V-")) {
        await adminClient.patch(`/food/admin/products/${id}`, {
          availability: nextAvailability,
          status: nextStatus
        });
      }

      // Also sync to localStorage if stored
      try {
        const stored = localStorage.getItem("pvp_products_v2");
        if (stored) {
          let list = JSON.parse(stored);
          list = list.map((p) =>
            p.id === product.id || p._id === product.id
              ? {
                  ...p,
                  availability: nextAvailability,
                  status: nextStatus
                }
              : p
          );
          localStorage.setItem("pvp_products_v2", JSON.stringify(list));
        }
      } catch (_) {}

      // Dispatch event to update KPI cards in ProductsManagement
      window.dispatchEvent(new Event("pvp_products_changed_v2"));

      if (isCurrentlyOut) {
        toast.success(`"${product.name}" marked as In Stock.`);
      } else {
        toast.error(`"${product.name}" marked as Out of Stock.`);
      }
    } catch (err) {
      console.error("Failed to update stock status:", err);
      toast.error("Failed to update stock status");
      fetchProducts();
    }
  };

  // Status badges helper
  const getStatusBadge = (st, av) => {
    if (av === "Out Of Stock" || st === "Out Of Stock") {
      return (
        <span className="px-2 py-0.5 bg-rose-600 text-white text-[9px] uppercase tracking-wider font-bold rounded">
          Out Of Stock
        </span>
      );
    }
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
            <button 
              onClick={handleExportPDF}
              className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-550 dark:text-zinc-400 transition-colors border border-zinc-200 dark:border-zinc-800 hover:text-[var(--primary)]" 
              title="Download PDF Catalog Report"
            >
              <Download size={14} />
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-550 dark:text-zinc-400 transition-colors border border-zinc-200 dark:border-zinc-800 hover:text-black dark:hover:text-white" 
              title="Refresh Page"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* Expandable detailed Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 pt-3 border-t border-zinc-200 dark:border-zinc-800 animate-in slide-in-from-top-2 duration-250 select-none">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Category</label>
              <CategorySearchDropdown 
                value={categoryFilter} 
                onChange={(val) => setCategoryFilter(val)} 
                options={uniqueCategories} 
              />
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
            {["Activate", "Deactivate", "Out of Stock", "In Stock", "Archive", "Delete"].map((action) => (
              <button
                key={action}
                onClick={() => {
                  onBulkAction?.(action, selectedRows);
                  setSelectedRows([]);
                }}
                className={`px-3 py-1 rounded text-[10px] font-black transition-colors ${
                  action === "Delete"
                    ? "bg-red-600 hover:bg-red-700"
                    : action === "Out of Stock"
                    ? "bg-rose-700 hover:bg-rose-800 text-white"
                    : action === "In Stock"
                    ? "bg-emerald-700 hover:bg-emerald-800 text-white"
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
                <th className="px-3 py-2.5">
                  Prices
                </th>
                <th className="px-3 py-2.5 text-center">Status</th>
                <th className="px-3 py-2.5 text-center cursor-pointer hover:text-[var(--primary)]" onClick={() => handleSort("createdAt")}>
                  Created Date
                </th>
                <th className="px-3 py-2.5 text-right sticky right-0 bg-zinc-50 dark:bg-zinc-950 shadow-l z-30 w-32 min-w-[130px]">Actions</th>
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
                    <td className="px-3 py-2">
                      <div className="flex flex-col gap-0.5">
                        {(p.sizes || []).map((sz, i) => (
                          <span key={i} className="text-[10px] text-zinc-600 dark:text-zinc-400 font-medium">
                            {sz.size}: <span className="font-bold text-zinc-900 dark:text-zinc-100">₹{sz.price}</span>
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center">{getStatusBadge(p.status, p.availability)}</td>
                    <td className="px-3 py-2 text-center text-zinc-500 font-medium text-[10px]">
                      {p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-GB') : p.lastUpdated}
                    </td>
                    
                    {/* Row Actions */}
                    <td className="px-3 py-2 text-right sticky right-0 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 shadow-l transition-colors z-10 w-32 min-w-[130px]">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Out of Stock Toggle */}
                        <button
                          onClick={() => handleToggleStock(p)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            p.availability === "Out Of Stock" || p.status === "Out Of Stock"
                              ? "text-rose-600 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50"
                              : "text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                          }`}
                          title={
                            p.availability === "Out Of Stock" || p.status === "Out Of Stock"
                              ? "Mark as In Stock"
                              : "Mark as Out of Stock"
                          }
                        >
                          <XCircle size={16} />
                        </button>
                        <button
                          onClick={() => onViewProduct?.(p)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => onEditProduct?.(p)}
                          className="p-1.5 text-zinc-500 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                          title="Edit Product"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => onDeleteProduct?.(p)}
                          className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors cursor-pointer"
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
                  <td colSpan={8} className="py-8 text-center text-zinc-500 font-bold text-xs">
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
              className="bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded px-1.5 py-0.5 text-black dark:text-white"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span className="text-zinc-500 ml-2">
              Showing {totalCount === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, totalCount)} of {totalCount} entries
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || loading}
              className="w-7 h-7 flex items-center justify-center rounded border border-zinc-205 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 transition-colors"
              title="Previous Page"
            >
              <ChevronLeft size={14} />
            </button>
            
            {Array.from({ length: totalPages }).map((_, idx) => {
              const pNum = idx + 1;
              if (
                totalPages > 7 &&
                pNum !== 1 &&
                pNum !== totalPages &&
                Math.abs(pNum - currentPage) > 1
              ) {
                if (pNum === 2 || pNum === totalPages - 1) {
                  return <span key={pNum} className="px-1 text-zinc-400">...</span>;
                }
                return null;
              }
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
              disabled={currentPage >= totalPages || loading}
              className="w-7 h-7 flex items-center justify-center rounded border border-zinc-205 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 transition-colors"
              title="Next Page"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

      </section>
    </>
  );
}
