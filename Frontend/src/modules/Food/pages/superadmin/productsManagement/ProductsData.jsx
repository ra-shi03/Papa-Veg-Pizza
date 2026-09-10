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
  const [skuSearch, setSkuSearch] = useState("");
  const [debouncedSku, setDebouncedSku] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [vegFilter, setVegFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [availabilityFilter, setAvailabilityFilter] = useState("All");
  const [franchiseFilter, setFranchiseFilter] = useState("All Franchises");
  const [storeFilter, setStoreFilter] = useState("All Stores");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  // Sorting
  const [sortConfig, setSortConfig] = useState({ key: "name", direction: "asc" });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Mock Products list mapped to MongoDB collection schema
  const getStoredProducts = () => {
    const data = localStorage.getItem("pvp_products");
    const defaultProds = [
      {
        id: "PP-V-001",
        name: "Paneer Tikka Supreme",
        category: "Signature Pizzas",
        price: "₹399",
        stock: 45,
        vegType: "veg",
        productType: "variants",
        preparationTime: 15,
        calories: 340,
        sizes: ["Regular", "Medium", "Large"],
        availability: "In Stock",
        status: "Active",
        lastUpdated: "14 Jun 2026",
        createdBy: "Admin Shubh",
        image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?fm=webp&fit=crop&w=100&q=80"
      },
      {
        id: "PP-V-002",
        name: "Veg Supreme Delight",
        category: "Classic Pizzas",
        price: "₹299",
        stock: 120,
        vegType: "veg",
        productType: "variants",
        preparationTime: 12,
        calories: 310,
        sizes: ["Regular", "Medium", "Large"],
        availability: "In Stock",
        status: "Active",
        lastUpdated: "12 Jun 2026",
        createdBy: "Admin Shubh",
        image: "https://images.unsplash.com/photo-1571066811602-71683a3f680d?fm=webp&fit=crop&w=100&q=80"
      },
      {
        id: "PP-V-003",
        name: "Tandoori Veggie Blast",
        category: "Signature Pizzas",
        price: "₹449",
        stock: 5,
        vegType: "veg",
        productType: "variants",
        preparationTime: 18,
        calories: 380,
        sizes: ["Regular", "Medium", "Large"],
        availability: "Low Stock",
        status: "Active",
        lastUpdated: "15 Jun 2026",
        createdBy: "Manager Amit",
        image: "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?fm=webp&fit=crop&w=100&q=80"
      },
      {
        id: "PP-V-004",
        name: "Cheese Burst Margherita",
        category: "Classic Pizzas",
        price: "₹349",
        stock: 65,
        vegType: "veg",
        productType: "variants",
        preparationTime: 10,
        calories: 410,
        sizes: ["Regular", "Medium", "Large"],
        availability: "In Stock",
        status: "Active",
        lastUpdated: "11 Jun 2026",
        createdBy: "Admin Shubh",
        image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?fm=webp&fit=crop&w=100&q=80"
      },
      {
        id: "PP-V-005",
        name: "Spicy Capsicum & Corn",
        category: "Classic Pizzas",
        price: "₹249",
        stock: 0,
        vegType: "veg",
        productType: "simple",
        preparationTime: 12,
        calories: 280,
        sizes: ["Regular"],
        availability: "Out of Stock",
        status: "Draft",
        lastUpdated: "10 Jun 2026",
        createdBy: "Admin Shubh",
        image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?fm=webp&fit=crop&w=100&q=80"
      },
      {
        id: "PP-V-006",
        name: "Garlic Breadsticks",
        category: "Sides & Bread",
        price: "₹149",
        stock: 140,
        vegType: "veg",
        productType: "simple",
        preparationTime: 8,
        calories: 220,
        sizes: ["Regular"],
        availability: "In Stock",
        status: "Active",
        lastUpdated: "08 Jun 2026",
        createdBy: "Admin Shubh",
        image: "https://images.unsplash.com/photo-1544982503-9f984c14501a?fm=webp&fit=crop&w=100&q=80"
      },
      {
        id: "PP-V-007",
        name: "Chocolate Lava Cake",
        category: "Desserts & Sweets",
        price: "₹99",
        stock: 180,
        vegType: "vegan",
        productType: "simple",
        preparationTime: 5,
        calories: 290,
        sizes: ["Regular"],
        availability: "In Stock",
        status: "Active",
        lastUpdated: "05 Jun 2026",
        createdBy: "Manager Amit",
        image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?fm=webp&fit=crop&w=100&q=80"
      },
      {
        id: "PP-V-008",
        name: "Cold Pepsi 500ml",
        category: "Beverages",
        price: "₹60",
        stock: 22,
        vegType: "vegan",
        productType: "simple",
        preparationTime: 2,
        calories: 150,
        sizes: ["500ml"],
        availability: "In Stock",
        status: "Archived",
        lastUpdated: "01 Jun 2026",
        createdBy: "Admin Shubh",
        image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?fm=webp&fit=crop&w=100&q=80"
      }
    ];
    if (!data) {
      localStorage.setItem("pvp_products", JSON.stringify(defaultProds));
      return defaultProds;
    }
    try {
      return JSON.parse(data);
    } catch (e) {
      return defaultProds;
    }
  };

  const [products, setProducts] = useState(getStoredProducts);

  // Sync state whenever localStorage changes outside this component
  useEffect(() => {
    const handleSync = () => {
      setProducts(getStoredProducts());
    };
    window.addEventListener("pvp_products_changed", handleSync);
    return () => window.removeEventListener("pvp_products_changed", handleSync);
  }, []);

  // Write changes to localStorage and dispatch event
  useEffect(() => {
    localStorage.setItem("pvp_products", JSON.stringify(products));
    window.dispatchEvent(new Event("pvp_products_changed"));
  }, [products]);

  // Debouncing search term inputs (500ms delay)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSku(skuSearch);
    }, 500);
    return () => clearTimeout(handler);
  }, [skuSearch]);

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
    debouncedSku,
    categoryFilter,
    vegFilter,
    statusFilter,
    availabilityFilter,
    franchiseFilter,
    storeFilter,
    dateRange
  ]);

  // Filter logic
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchesSku = p.id.toLowerCase().includes(debouncedSku.toLowerCase());
    const matchesCategory = categoryFilter === "All Categories" || p.category === categoryFilter;
    
    let matchesVeg = true;
    if (vegFilter === "Veg") matchesVeg = p.vegType === "veg";
    else if (vegFilter === "Vegan") matchesVeg = p.vegType === "vegan";
    else if (vegFilter === "Non-Veg") matchesVeg = p.vegType === "non-veg";

    const matchesStatus = statusFilter === "All" || p.status === statusFilter;
    const matchesAvailability = availabilityFilter === "All" || p.availability === availabilityFilter;

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
      matchesSku &&
      matchesCategory &&
      matchesVeg &&
      matchesStatus &&
      matchesAvailability &&
      matchesDate
    );
  });

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
            
            <div className="relative w-44">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
              <input
                type="text"
                placeholder="SKU..."
                value={skuSearch}
                onChange={(e) => setSkuSearch(e.target.value)}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3.5 pt-3 border-t border-zinc-200 dark:border-zinc-800 animate-in slide-in-from-top-2 duration-250 select-none">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full h-8 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-semibold outline-none focus:border-[var(--primary)] transition-all text-black dark:text-white"
              >
                <option>All Categories</option>
                <option>Signature Pizzas</option>
                <option>Classic Pizzas</option>
                <option>Sides & Bread</option>
                <option>Beverages</option>
                <option>Desserts & Sweets</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Veg Classification</label>
              <select
                value={vegFilter}
                onChange={(e) => setVegFilter(e.target.value)}
                className="w-full h-8 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-semibold outline-none focus:border-[var(--primary)] transition-all text-black dark:text-white"
              >
                <option>All</option>
                <option>Veg</option>
                <option>Vegan</option>
                <option>Non-Veg</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Availability</label>
              <select
                value={availabilityFilter}
                onChange={(e) => setAvailabilityFilter(e.target.value)}
                className="w-full h-8 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-semibold outline-none focus:border-[var(--primary)] transition-all text-black dark:text-white"
              >
                <option>All</option>
                <option>In Stock</option>
                <option>Low Stock</option>
                <option>Out of Stock</option>
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
              <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Franchise & Stores</label>
              <div className="flex gap-1.5">
                <select
                  value={franchiseFilter}
                  onChange={(e) => setFranchiseFilter(e.target.value)}
                  className="w-1/2 h-8 px-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-[10px] font-semibold outline-none focus:border-[var(--primary)] text-black dark:text-white"
                >
                  <option>All Franchises</option>
                  <option>Indore Central</option>
                  <option>Bhopal Zone</option>
                  <option>Ujjain Branch</option>
                </select>
                <select
                  value={storeFilter}
                  onChange={(e) => setStoreFilter(e.target.value)}
                  className="w-1/2 h-8 px-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-[10px] font-semibold outline-none focus:border-[var(--primary)] text-black dark:text-white"
                >
                  <option>All Stores</option>
                  <option>Scheme 54</option>
                  <option>Vijay Nagar</option>
                  <option>MP Nagar</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1 justify-end">
              <div className="flex items-center gap-1.5 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setCategoryFilter("All Categories");
                    setVegFilter("All");
                    setStatusFilter("All");
                    setAvailabilityFilter("All");
                    setFranchiseFilter("All Franchises");
                    setStoreFilter("All Stores");
                    setSearchTerm("");
                    setSkuSearch("");
                    setDateRange({ start: "", end: "" });
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 h-8 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-[10px] font-bold rounded-lg transition-colors text-zinc-650 dark:text-zinc-300"
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
          <table className="w-full border-collapse text-left text-xs min-w-[1200px]">
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
                <th className="px-3 py-2.5 w-16">Image</th>
                <th className="px-3 py-2.5 cursor-pointer hover:text-[var(--primary)]" onClick={() => handleSort("name")}>
                  Product Name
                </th>
                <th className="px-3 py-2.5 cursor-pointer hover:text-[var(--primary)] font-mono" onClick={() => handleSort("id")}>
                  SKU
                </th>
                <th className="px-3 py-2.5 cursor-pointer hover:text-[var(--primary)]" onClick={() => handleSort("category")}>
                  Category
                </th>
                <th className="px-3 py-2.5 text-right cursor-pointer hover:text-[var(--primary)]" onClick={() => handleSort("price")}>
                  Base Price
                </th>
                <th className="px-3 py-2.5">Sizes</th>
                <th className="px-3 py-2.5 text-center cursor-pointer hover:text-[var(--primary)]" onClick={() => handleSort("preparationTime")}>
                  Prep Time
                </th>
                <th className="px-3 py-2.5 text-center cursor-pointer hover:text-[var(--primary)]" onClick={() => handleSort("calories")}>
                  Calories
                </th>
                <th className="px-3 py-2.5 text-center">Veg Type</th>
                <th className="px-3 py-2.5 text-center">Availability</th>
                <th className="px-3 py-2.5 text-center">Status</th>
                <th className="px-3 py-2.5 cursor-pointer hover:text-[var(--primary)] text-center" onClick={() => handleSort("lastUpdated")}>
                  Last Updated
                </th>
                <th className="px-3 py-2.5">Created By</th>
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
                    <td className="px-3 py-2">
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
                    <td className="px-3 py-2 font-mono text-[10px] text-zinc-500">{p.id}</td>
                    <td className="px-3 py-2 text-zinc-650 dark:text-zinc-300 font-semibold">{p.category}</td>
                    <td className="px-3 py-2 text-right font-black text-zinc-900 dark:text-zinc-100">{p.price}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1 w-[110px]">
                        {p.sizes.map((sz, i) => (
                          <span key={i} className="text-[8px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-1 py-0.2 rounded font-bold">
                            {sz}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center text-zinc-700 dark:text-zinc-300 font-semibold">{p.preparationTime}m</td>
                    <td className="px-3 py-2 text-center text-zinc-550 dark:text-zinc-400">{p.calories}</td>
                    <td className="px-3 py-2 text-center font-bold uppercase text-[9px] text-zinc-500">{p.vegType}</td>
                    <td className="px-3 py-2 text-center">{getAvailabilityBadge(p.availability)}</td>
                    <td className="px-3 py-2 text-center">{getStatusBadge(p.status)}</td>
                    <td className="px-3 py-2 text-center text-zinc-500 font-medium">{p.lastUpdated}</td>
                    <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400 font-semibold">{p.createdBy}</td>
                    
                    {/* Row Actions Menu */}
                    <td className={`px-3 py-2 text-right sticky right-0 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 shadow-l transition-colors ${
                      activeDropdown === p.id ? "z-20" : "z-10"
                    }`}>
                      <div className="relative inline-block text-left">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDropdown((prev) => (prev === p.id ? null : p.id));
                          }}
                          className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-black dark:hover:text-white transition-colors"
                        >
                          <MoreVertical size={14} />
                        </button>

                        {activeDropdown === p.id && (
                          <div className="absolute right-0 bottom-full md:bottom-auto md:top-full mt-1 w-44 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl z-50 overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-850 animate-in fade-in slide-in-from-top-1">
                            <div className="py-1">
                              <button
                                onClick={() => onViewProduct?.(p)}
                                className="w-full text-left px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2 transition-colors"
                              >
                                <Eye size={12} className="text-zinc-400" /> View details
                              </button>
                              <button
                                onClick={() => onEditProduct?.(p)}
                                className="w-full text-left px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2 transition-colors"
                              >
                                <Edit size={12} className="text-zinc-400" /> Edit Product
                              </button>
                              <button
                                onClick={() => onCloneProduct?.(p)}
                                className="w-full text-left px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2 transition-colors"
                              >
                                <Copy size={12} className="text-zinc-400" /> Clone Product
                              </button>
                            </div>
                            <div className="py-1">
                              <button
                                onClick={() => onArchiveProduct?.(p)}
                                className="w-full text-left px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2 transition-colors"
                              >
                                <Archive size={12} className="text-zinc-400" /> Archive
                              </button>
                              <button
                                onClick={() => onDeleteProduct?.(p)}
                                className="w-full text-left px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold text-red-500 flex items-center gap-2 transition-colors"
                              >
                                <Trash2 size={12} className="text-red-400" /> Delete Soft
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {sortedProducts.length === 0 && (
                <tr>
                  <td colSpan={15} className="py-8 text-center text-zinc-500 font-bold text-xs">
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
