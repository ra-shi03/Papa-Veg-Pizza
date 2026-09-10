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
  Plus,
  TrendingUp,
  Download,
  Upload,
  RefreshCw,
  FolderOpen,
  CornerDownRight,
  Layers,
  CheckSquare,
  Square,
  HelpCircle,
  Clock,
  MapPin
} from "lucide-react";

export default function CategoriesData({
  onViewCategory,
  onEditCategory,
  onDuplicateCategory,
  onDeleteCategory,
  onBulkAction
}) {
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [slugSearch, setSlugSearch] = useState("");
  const [debouncedSlug, setDebouncedSlug] = useState("");
  const [parentFilter, setParentFilter] = useState("All Parents");
  const [statusFilter, setStatusFilter] = useState("All");
  const [visibilityFilter, setVisibilityFilter] = useState("All");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  // Sorting
  const [sortConfig, setSortConfig] = useState({ key: "displayOrder", direction: "asc" });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Mock Categories mapped to MongoDB categories collection structure
  const getStoredCategories = () => {
    const data = localStorage.getItem("pvp_categories");
    const defaultCats = [
      {
        id: "CAT-001",
        name: "Signature Pizzas",
        slug: "signature-pizzas",
        parent: "—",
        parentId: null,
        productsCount: 42,
        displayOrder: 1,
        isVisible: true,
        status: "Active",
        lastUpdated: "14 Jun 2026",
        image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?fm=webp&fit=crop&w=120&q=80",
        icon: "https://images.unsplash.com/photo-1513104890138-7c749659a591?fm=webp&fit=crop&w=60&h=60&q=80"
      },
      {
        id: "CAT-002",
        name: "Classic Pizzas",
        slug: "classic-pizzas",
        parent: "—",
        parentId: null,
        productsCount: 38,
        displayOrder: 2,
        isVisible: true,
        status: "Active",
        lastUpdated: "12 Jun 2026",
        image: "https://images.unsplash.com/photo-1571066811602-71683a3f680d?fm=webp&fit=crop&w=120&q=80",
        icon: "https://images.unsplash.com/photo-1571066811602-71683a3f680d?fm=webp&fit=crop&w=60&h=60&q=80"
      },
      {
        id: "CAT-003",
        name: "Veg Sides",
        slug: "veg-sides",
        parent: "Sides & Bread",
        parentId: "CAT-006",
        productsCount: 15,
        displayOrder: 3,
        isVisible: true,
        status: "Active",
        lastUpdated: "15 Jun 2026",
        image: "https://images.unsplash.com/photo-1544982503-9f984c14501a?fm=webp&fit=crop&w=120&q=80",
        icon: "https://images.unsplash.com/photo-1544982503-9f984c14501a?fm=webp&fit=crop&w=60&h=60&q=80"
      },
      {
        id: "CAT-004",
        name: "Beverages",
        slug: "beverages",
        parent: "—",
        parentId: null,
        productsCount: 22,
        displayOrder: 4,
        isVisible: true,
        status: "Active",
        lastUpdated: "11 Jun 2026",
        image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?fm=webp&fit=crop&w=120&q=80",
        icon: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?fm=webp&fit=crop&w=60&h=60&q=80"
      },
      {
        id: "CAT-005",
        name: "Desserts & Sweets",
        slug: "desserts-sweets",
        parent: "—",
        parentId: null,
        productsCount: 18,
        displayOrder: 5,
        isVisible: false,
        status: "Active",
        lastUpdated: "10 Jun 2026",
        image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?fm=webp&fit=crop&w=120&q=80",
        icon: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?fm=webp&fit=crop&w=60&h=60&q=80"
      },
      {
        id: "CAT-006",
        name: "Sides & Bread",
        slug: "sides-bread",
        parent: "—",
        parentId: null,
        productsCount: 12,
        displayOrder: 6,
        isVisible: true,
        status: "Active",
        lastUpdated: "08 Jun 2026",
        image: "https://images.unsplash.com/photo-1544982503-9f984c14501a?fm=webp&fit=crop&w=120&q=80",
        icon: "https://images.unsplash.com/photo-1544982503-9f984c14501a?fm=webp&fit=crop&w=60&h=60&q=80"
      },
      {
        id: "CAT-007",
        name: "Gluten Free Pizzas",
        slug: "gluten-free-pizzas",
        parent: "Signature Pizzas",
        parentId: "CAT-001",
        productsCount: 0,
        displayOrder: 7,
        isVisible: true,
        status: "Inactive",
        lastUpdated: "05 Jun 2026",
        image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?fm=webp&fit=crop&w=120&q=80",
        icon: "https://images.unsplash.com/photo-1513104890138-7c749659a591?fm=webp&fit=crop&w=60&h=60&q=80"
      }
    ];
    if (!data) {
      localStorage.setItem("pvp_categories", JSON.stringify(defaultCats));
      return defaultCats;
    }
    try {
      return JSON.parse(data);
    } catch (e) {
      return defaultCats;
    }
  };

  const [categories, setCategories] = useState(getStoredCategories);

  // Sync state whenever localStorage changes outside this component
  useEffect(() => {
    const handleSync = () => {
      setCategories(getStoredCategories());
    };
    window.addEventListener("pvp_categories_changed", handleSync);
    return () => window.removeEventListener("pvp_categories_changed", handleSync);
  }, []);

  // Write changes to localStorage and dispatch event
  useEffect(() => {
    localStorage.setItem("pvp_categories", JSON.stringify(categories));
    window.dispatchEvent(new Event("pvp_categories_changed"));
  }, [categories]);

  // Debouncing search term inputs (500ms delay)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSlug(slugSearch);
    }, 500);
    return () => clearTimeout(handler);
  }, [slugSearch]);

  // Handle outside click to close dropdown menus
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
    debouncedSlug,
    parentFilter,
    statusFilter,
    visibilityFilter,
    dateRange
  ]);

  // Filter logic
  const filteredCategories = categories.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchesSlug = c.slug.toLowerCase().includes(debouncedSlug.toLowerCase());
    
    let matchesParent = true;
    if (parentFilter !== "All Parents") {
      if (parentFilter === "None (Top Level)") {
        matchesParent = c.parent === "—";
      } else {
        matchesParent = c.parent === parentFilter;
      }
    }

    const matchesStatus = statusFilter === "All" || c.status === statusFilter;
    
    let matchesVisibility = true;
    if (visibilityFilter === "Visible") matchesVisibility = c.isVisible === true;
    else if (visibilityFilter === "Hidden") matchesVisibility = c.isVisible === false;

    // Date picker range simulation
    let matchesDate = true;
    if (dateRange.start && dateRange.end) {
      const pDate = new Date(c.lastUpdated);
      const sDate = new Date(dateRange.start);
      const eDate = new Date(dateRange.end);
      matchesDate = pDate >= sDate && pDate <= eDate;
    }

    return matchesSearch && matchesSlug && matchesParent && matchesStatus && matchesVisibility && matchesDate;
  });

  // Sort logic
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedCategories = [...filteredCategories].sort((a, b) => {
    let aVal = a[sortConfig.key];
    let bVal = b[sortConfig.key];

    if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  // Pagination logic
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = sortedCategories.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(sortedCategories.length / rowsPerPage) || 1;

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

  // Toggle Visibility in App state inline
  const handleToggleVisibility = (id) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isVisible: !c.isVisible } : c))
    );
  };

  // Toggle Status inline
  const handleToggleStatus = (id) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: c.status === "Active" ? "Inactive" : "Active" } : c))
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
                placeholder="Search by Category Name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-8 pl-8 pr-3 border border-zinc-200 dark:border-zinc-850 bg-zinc-55 dark:bg-zinc-950 text-xs font-semibold rounded-lg focus:outline-none focus:border-[var(--primary)] transition-all text-black dark:text-white"
              />
            </div>
            
            <div className="relative w-44">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
              <input
                type="text"
                placeholder="Slug..."
                value={slugSearch}
                onChange={(e) => setSlugSearch(e.target.value)}
                className="w-full h-8 pl-8 pr-3 border border-zinc-200 dark:border-zinc-850 bg-zinc-55 dark:bg-zinc-950 text-xs font-semibold rounded-lg focus:outline-none focus:border-[var(--primary)] transition-all text-black dark:text-white"
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
            <button className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-black dark:hover:text-white transition-colors border border-zinc-200 dark:border-zinc-800" title="Bulk Import">
              <Upload size={14} />
            </button>
            <button className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-black dark:hover:text-white transition-colors border border-zinc-200 dark:border-zinc-800" title="Bulk Export">
              <Download size={14} />
            </button>
            <button className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-black dark:hover:text-white transition-colors border border-zinc-200 dark:border-zinc-800" title="Refresh list">
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* Detailed Filters Panel */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5 pt-3 border-t border-zinc-200 dark:border-zinc-800 animate-in slide-in-from-top-2 duration-250 select-none">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Parent Category</label>
              <select
                value={parentFilter}
                onChange={(e) => setParentFilter(e.target.value)}
                className="w-full h-8 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-semibold outline-none focus:border-[var(--primary)] transition-all text-black dark:text-white"
              >
                <option>All Parents</option>
                <option>None (Top Level)</option>
                <option>Signature Pizzas</option>
                <option>Sides & Bread</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Visibility status</label>
              <select
                value={visibilityFilter}
                onChange={(e) => setVisibilityFilter(e.target.value)}
                className="w-full h-8 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-955 text-xs font-semibold outline-none focus:border-[var(--primary)] transition-all text-black dark:text-white"
              >
                <option>All</option>
                <option>Visible</option>
                <option>Hidden</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Publish Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-8 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-950 text-xs font-semibold outline-none focus:border-[var(--primary)] transition-all text-black dark:text-white"
              >
                <option>All</option>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>

            <div className="flex flex-col gap-1 justify-end">
              <button
                type="button"
                onClick={() => {
                  setParentFilter("All Parents");
                  setSearchTerm("");
                  setSlugSearch("");
                  setStatusFilter("All");
                  setVisibilityFilter("All");
                  setDateRange({ start: "", end: "" });
                }}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 h-8 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-[10px] font-bold rounded-lg transition-colors text-zinc-650 dark:text-zinc-300 w-full sm:w-28 self-end"
              >
                <RotateCcw size={10} /> Reset Filters
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Bulk actions Floating Bar */}
      {selectedRows.length > 0 && (
        <div className="bg-zinc-900 text-white rounded-lg p-2.5 px-4 flex items-center justify-between shadow-xl animate-fade-in border border-zinc-800 select-none">
          <div className="flex items-center gap-3">
            <Check size={14} className="text-[var(--primary)] animate-pulse" />
            <span className="text-xs font-bold">{selectedRows.length} categories selected</span>
          </div>
          <div className="flex gap-2">
            {["Activate", "Deactivate", "Show in App", "Hide from App", "Delete"].map((action) => (
              <button
                key={action}
                onClick={() => {
                  onBulkAction?.(action, selectedRows);
                  setSelectedRows([]);
                }}
                className={`px-3 py-1 rounded text-[10px] font-black transition-colors ${
                  action === "Delete"
                    ? "bg-red-650 hover:bg-red-700"
                    : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                }`}
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Categories Table */}
      <section className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden select-none">
        <div className="overflow-x-auto w-full relative">
          <table className="w-full border-collapse text-left text-xs min-w-[1000px]">
            {/* Sticky Header */}
            <thead className="bg-zinc-55 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-850 text-zinc-500 font-bold uppercase sticky top-0 z-30">
              <tr>
                <th className="px-3 py-2.5 w-10 text-center">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={selectedRows.length === currentRows.length && currentRows.length > 0}
                    className="w-4 h-4 rounded border-zinc-300 text-[var(--primary)] focus:ring-[var(--primary)]/20 cursor-pointer"
                  />
                </th>
                <th className="px-3 py-2.5 w-16">Image</th>
                <th className="px-3 py-2.5 cursor-pointer hover:text-[var(--primary)]" onClick={() => handleSort("name")}>
                  Category Name
                </th>
                <th className="px-3 py-2.5 cursor-pointer hover:text-[var(--primary)] font-mono" onClick={() => handleSort("slug")}>
                  Slug
                </th>
                <th className="px-3 py-2.5 cursor-pointer hover:text-[var(--primary)]" onClick={() => handleSort("parent")}>
                  Parent Category
                </th>
                <th className="px-3 py-2.5 text-center cursor-pointer hover:text-[var(--primary)]" onClick={() => handleSort("productsCount")}>
                  Products
                </th>
                <th className="px-3 py-2.5 text-center cursor-pointer hover:text-[var(--primary)]" onClick={() => handleSort("displayOrder")}>
                  Sort Order
                </th>
                <th className="px-3 py-2.5 text-center">Visible in App</th>
                <th className="px-3 py-2.5 text-center">Status</th>
                <th className="px-3 py-2.5 text-center cursor-pointer hover:text-[var(--primary)]" onClick={() => handleSort("lastUpdated")}>
                  Last Updated
                </th>
                <th className="px-3 py-2.5 text-right sticky right-0 bg-zinc-50 dark:bg-zinc-950 shadow-l z-30 w-24">Actions</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-zinc-150 dark:divide-zinc-800">
              {currentRows.map((category) => {
                const isChecked = selectedRows.includes(category.id);
                return (
                  <tr
                    key={category.id}
                    className={`hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors ${
                      isChecked ? "bg-[var(--primary)]/5" : ""
                    }`}
                  >
                    <td className="px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleSelectRow(category.id)}
                        className="w-4 h-4 rounded border-zinc-300 text-[var(--primary)] focus:ring-[var(--primary)]/20 cursor-pointer"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <div className="w-9 h-9 rounded bg-zinc-100 dark:bg-zinc-800 overflow-hidden shrink-0 border border-zinc-150 dark:border-zinc-800">
                        <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
                      </div>
                    </td>
                    <td className="px-3 py-2 font-bold text-zinc-900 dark:text-zinc-100">{category.name}</td>
                    <td className="px-3 py-2 font-mono text-[10px] text-zinc-550">/cat/{category.slug}</td>
                    <td className="px-3 py-2 text-zinc-650 dark:text-zinc-350 font-semibold">{category.parent}</td>
                    <td className="px-3 py-2 text-center font-bold text-zinc-900 dark:text-zinc-150">{category.productsCount} Items</td>
                    <td className="px-3 py-2 text-center text-zinc-700 dark:text-zinc-300 font-bold">{category.displayOrder}</td>
                    
                    {/* Visibility Switch */}
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={() => handleToggleVisibility(category.id)}
                        className={`px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold transition-all shadow-sm ${
                          category.isVisible
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-450"
                            : "bg-zinc-150 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                        }`}
                      >
                        {category.isVisible ? "Visible" : "Hidden"}
                      </button>
                    </td>

                    {/* Status Toggle Badge */}
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={() => handleToggleStatus(category.id)}
                        className={`px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold transition-all ${
                          category.status === "Active"
                            ? "bg-green-500 text-white"
                            : "bg-red-500 text-white"
                        }`}
                      >
                        {category.status}
                      </button>
                    </td>

                    <td className="px-3 py-2 text-center text-zinc-500 font-semibold">{category.lastUpdated}</td>
                    
                    {/* Row Action Actions */}
                    <td className={`px-3 py-2 text-right sticky right-0 bg-white dark:bg-zinc-900 hover:bg-zinc-55 dark:hover:bg-zinc-850 shadow-l transition-colors ${
                      activeDropdown === category.id ? "z-20" : "z-10"
                    }`}>
                      <div className="relative inline-block text-left">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDropdown((prev) => (prev === category.id ? null : category.id));
                          }}
                          className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-black dark:hover:text-white transition-colors"
                        >
                          <MoreVertical size={14} />
                        </button>

                        {activeDropdown === category.id && (
                          <div className="absolute right-0 bottom-full md:bottom-auto md:top-full mt-1 w-44 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl z-50 overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-850 animate-in fade-in slide-in-from-top-1">
                            <div className="py-1">
                              <button
                                onClick={() => onViewCategory?.(category)}
                                className="w-full text-left px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2 transition-colors"
                              >
                                <Eye size={12} className="text-zinc-400" /> View Details
                              </button>
                              <button
                                onClick={() => onEditCategory?.(category)}
                                className="w-full text-left px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2 transition-colors"
                              >
                                <Edit size={12} className="text-zinc-400" /> Edit Category
                              </button>
                              <button
                                onClick={() => onDuplicateCategory?.(category)}
                                className="w-full text-left px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2 transition-colors"
                              >
                                <Copy size={12} className="text-zinc-400" /> Duplicate
                              </button>
                            </div>
                            <div className="py-1">
                              <button
                                onClick={() => handleToggleVisibility(category.id)}
                                className="w-full text-left px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2 transition-colors"
                              >
                                <Check size={12} className="text-zinc-400" /> Show / Hide
                              </button>
                              <button
                                onClick={() => handleToggleStatus(category.id)}
                                className="w-full text-left px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2 transition-colors"
                              >
                                <RefreshCw size={12} className="text-zinc-400" /> Activate / Deact
                              </button>
                              <button
                                onClick={() => onDeleteCategory?.(category)}
                                className="w-full text-left px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold text-red-500 flex items-center gap-2 transition-colors"
                              >
                                <Trash2 size={12} className="text-red-400" /> Delete Category
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {sortedCategories.length === 0 && (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-zinc-500 font-bold text-xs">
                    No categories found matching your criteria.
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
            </select>
            <span className="text-zinc-500 ml-2">
              Showing {indexOfFirstRow + 1} to {Math.min(indexOfLastRow, sortedCategories.length)} of {sortedCategories.length} entries
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

      {/* Category Hierarchy Tree */}
      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 shadow-sm select-none">
        <h5 className="text-xs font-bold text-zinc-900 dark:text-zinc-150 mb-3 flex items-center gap-2">
          <FolderOpen size={14} className="text-[var(--primary)]" />
          <span>Category Parent-Child Tree View</span>
        </h5>
        <div className="space-y-3 pl-1">
          {categories
            .filter((c) => !c.parentId)
            .map((parent) => {
              const children = categories.filter((c) => c.parentId === parent.id);
              return (
                <div key={parent.id} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-bold text-[9px]">
                      {parent.name?.substring(0, 2).toUpperCase()}
                    </div>
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{parent.name}</span>
                    <span className="text-[9px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-1 rounded">{parent.productsCount} products</span>
                  </div>
                  {children.length > 0 && (
                    <div className="ml-3.5 border-l border-zinc-200 dark:border-zinc-800 pl-4 space-y-2">
                      {children.map((child) => (
                        <div key={child.id} className="flex items-center gap-2 relative">
                          <span className="absolute -left-4 top-1/2 w-3 h-[1px] bg-zinc-200 dark:bg-zinc-800" />
                          <span className="text-xs font-semibold text-zinc-650 dark:text-zinc-350">{child.name}</span>
                          <span className="text-[8px] bg-zinc-100 dark:bg-zinc-800 text-zinc-400 px-1.5 rounded">{child.productsCount} products</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </section>
    </>
  );
}
