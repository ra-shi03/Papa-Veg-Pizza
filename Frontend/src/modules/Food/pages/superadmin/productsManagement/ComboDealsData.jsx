import React, { useState, useEffect } from "react";
import {
  ChevronDown, MoreVertical, Eye, Edit, Copy, Archive, Trash2, CheckCircle,
  XCircle, ArrowUpDown, Calendar, HelpCircle, ShoppingBag, ExternalLink, RefreshCw,
  Search, Filter, RotateCcw, FileDown
} from "lucide-react";

export default function ComboDealsData({
  combos = [],
  comboItems = [],
  products = [],
  onView,
  onEdit,
  onDuplicate,
  onDelete,
  onStatusChange,
  onBulkAction,
  onRefresh,
  onDownloadCSV
}) {
  // Local UI States for search, filtering, and pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);

  // Filters State
  const [filterType, setFilterType] = useState("");
  const [filterDiscount, setFilterDiscount] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterFranchise, setFilterFranchise] = useState("");
  const [filterStore, setFilterStore] = useState("");
  const [filterValidity, setFilterValidity] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  // Sorting and Pagination State
  const [sortConfig, setSortConfig] = useState({ key: "name", direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [activeDropdown, setActiveDropdown] = useState(null);

  const franchisesList = [
    "Franchise North India",
    "Franchise South India",
    "Franchise West India",
    "Franchise East India"
  ];

  const storesList = [
    "Store Delhi-Connaught Place",
    "Store Mumbai-Andheri",
    "Store Bangalore-Indiranagar",
    "Store Chennai-Adyar",
    "Store Pune-Kothrud"
  ];

  // Close dropdown on click outside
  useEffect(() => {
    const handleClose = () => setActiveDropdown(null);
    document.addEventListener("click", handleClose);
    return () => document.removeEventListener("click", handleClose);
  }, []);

  // Debouncing Search (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset page to 1 on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, filterType, filterDiscount, filterStatus, filterFranchise, filterStore, filterValidity, dateRange]);

  const handleResetFilters = () => {
    setSearchTerm("");
    setFilterType("");
    setFilterDiscount("");
    setFilterStatus("");
    setFilterFranchise("");
    setFilterStore("");
    setFilterValidity("");
    setDateRange({ start: "", end: "" });
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key === key) {
      return <span className="text-[var(--primary)] ml-1 font-bold">▲</span>;
    }
    return <ArrowUpDown size={11} className="ml-1 opacity-40 inline shrink-0" />;
  };

  // Process filters
  const now = new Date();
  const processedCombos = combos.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
                          (item.description && item.description.toLowerCase().includes(debouncedSearch.toLowerCase()));
    
    const matchesType = filterType ? item.comboType === filterType : true;
    const matchesDiscount = filterDiscount ? item.discountType === filterDiscount : true;
    const matchesStatus = filterStatus ? item.status === filterStatus : true;

    let matchesFranchise = true;
    if (filterFranchise) {
      matchesFranchise = item.applicabilityType === "all" || 
                         (item.applicabilityType === "franchises" && item.applicableFranchises.includes(filterFranchise));
    }

    let matchesStore = true;
    if (filterStore) {
      matchesStore = item.applicabilityType === "all" || 
                     (item.applicabilityType === "stores" && item.applicableStores.includes(filterStore));
    }

    let matchesValidity = true;
    const fromTime = item.validFrom ? new Date(item.validFrom) : null;
    const toTime = item.validTo ? new Date(item.validTo) : null;
    if (filterValidity === "active") {
      matchesValidity = (!fromTime || fromTime <= now) && (!toTime || toTime >= now) && item.status === "active";
    } else if (filterValidity === "upcoming") {
      matchesValidity = fromTime && fromTime > now && item.status !== "archived";
    } else if (filterValidity === "expired") {
      matchesValidity = toTime && toTime < now;
    }

    let matchesDateRange = true;
    if (dateRange.start && dateRange.end) {
      const itemStart = fromTime ? fromTime : new Date(item.createdAt);
      const selStart = new Date(dateRange.start);
      const selEnd = new Date(dateRange.end);
      matchesDateRange = itemStart >= selStart && itemStart <= selEnd;
    }

    return matchesSearch && matchesType && matchesDiscount && matchesStatus && matchesFranchise && matchesStore && matchesValidity && matchesDateRange;
  });

  // Sorting
  const sortedCombos = [...processedCombos].sort((a, b) => {
    let aVal = a[sortConfig.key];
    let bVal = b[sortConfig.key];

    if (sortConfig.key === "price" || sortConfig.key === "discountValue") {
      aVal = Number(aVal) || 0;
      bVal = Number(bVal) || 0;
    }

    if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  // Pagination bounds
  const totalPages = Math.ceil(sortedCombos.length / rowsPerPage) || 1;
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const paginatedCombos = sortedCombos.slice(indexOfFirstRow, indexOfLastRow);

  // Row Selection logic
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(paginatedCombos.map(item => item._id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedRows(prev =>
      prev.includes(id) ? prev.filter(rId => rId !== id) : [...prev, id]
    );
  };

  const handleLocalBulkAction = (action) => {
    onBulkAction(action, selectedRows);
    setSelectedRows([]);
  };

  return (
    <div className="space-y-4">
      
      {/* Toolbar - Search, Filters, and Reset */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 text-zinc-400" size={14} />
            <input
              type="text"
              placeholder="Search combos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs bg-zinc-55 dark:bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-[var(--primary)] text-zinc-800 dark:text-zinc-200"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-2.5 text-xs text-zinc-400 hover:text-zinc-650"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <button
              onClick={() => onDownloadCSV(processedCombos)}
              className="flex items-center gap-1.5 px-3 py-2 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white rounded-lg font-bold text-[11px] hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors bg-white dark:bg-zinc-950 shadow-sm cursor-pointer"
            >
              <FileDown size={13} />
              Export Filtered
            </button>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-2 border rounded-lg text-xs font-bold transition-colors shadow-sm cursor-pointer ${showFilters ? "border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)]" : "border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}
            >
              <Filter size={13} />
              Filters
              {(filterType || filterDiscount || filterStatus || filterFranchise || filterStore || filterValidity || dateRange.start) && (
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
              )}
            </button>

            <button
              onClick={onRefresh}
              className="p-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 shadow-sm cursor-pointer"
              title="Refresh"
            >
              <RefreshCw size={13} />
            </button>

            {(filterType || filterDiscount || filterStatus || filterFranchise || filterStore || filterValidity || dateRange.start || searchTerm) && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1 px-2.5 py-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-100 text-xs font-bold cursor-pointer"
              >
                <RotateCcw size={12} />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Dropdown Filters Expandable Area */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-850 animate-fadeIn">
            {/* Combo Type */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Combo Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-2.5 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-[var(--primary)] text-zinc-800 dark:text-zinc-200"
              >
                <option value="">All Types</option>
                <option value="fixed">Fixed Bundle</option>
                <option value="bogo">Buy One Get One (BOGO)</option>
                <option value="meal">Meal Deal</option>
                <option value="seasonal">Seasonal Offer</option>
                <option value="custom">Custom Bundle</option>
              </select>
            </div>

            {/* Discount Type */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Discount Type</label>
              <select
                value={filterDiscount}
                onChange={(e) => setFilterDiscount(e.target.value)}
                className="px-2.5 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-955 focus:outline-none focus:ring-1 focus:ring-[var(--primary)] text-zinc-800 dark:text-zinc-200"
              >
                <option value="">All discounts</option>
                <option value="percentage">Percentage Discount</option>
                <option value="flat">Flat Discount</option>
                <option value="fixed_price">Fixed Price</option>
              </select>
            </div>

            {/* Status */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-2.5 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-[var(--primary)] text-zinc-800 dark:text-zinc-200"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="expired">Expired</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {/* Validity state */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Validity Period</label>
              <select
                value={filterValidity}
                onChange={(e) => setFilterValidity(e.target.value)}
                className="px-2.5 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-[var(--primary)] text-zinc-800 dark:text-zinc-200"
              >
                <option value="">All Timelines</option>
                <option value="active">Currently Active</option>
                <option value="upcoming">Upcoming Specials</option>
                <option value="expired">Past / Expired</option>
              </select>
            </div>

            {/* Applicable Franchise */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Applicable Franchise</label>
              <select
                value={filterFranchise}
                onChange={(e) => setFilterFranchise(e.target.value)}
                className="px-2.5 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-[var(--primary)] text-zinc-800 dark:text-zinc-200"
              >
                <option value="">All Franchises</option>
                {franchisesList.map(item => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>

            {/* Applicable Store */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Applicable Store</label>
              <select
                value={filterStore}
                onChange={(e) => setFilterStore(e.target.value)}
                className="px-2.5 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-[var(--primary)] text-zinc-800 dark:text-zinc-200"
              >
                <option value="">All Stores</option>
                {storesList.map(item => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>

            {/* Date range picker */}
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Start Date Range</label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="w-full px-2.5 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs bg-zinc-55 dark:bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-[var(--primary)] text-zinc-700 dark:text-zinc-300"
                />
                <span className="text-zinc-400 text-xs">to</span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="w-full px-2.5 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs bg-zinc-55 dark:bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-[var(--primary)] text-zinc-700 dark:text-zinc-300"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Grid Table Container */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col relative select-none">
        {/* Scrollable Table Area */}
        <div className="overflow-x-auto w-full relative max-h-[600px] scrollbar-thin">
          <table className="w-full border-collapse text-left text-xs min-w-[1300px]">
            
            {/* Sticky Header */}
            <thead className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-850 text-zinc-500 font-bold uppercase sticky top-0 z-30">
              <tr>
                <th className="px-3 py-2.5 w-10 text-center">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={paginatedCombos.length > 0 && selectedRows.length === paginatedCombos.length}
                    className="w-4 h-4 rounded border-zinc-300 text-[var(--primary)] focus:ring-[var(--primary)]/20 cursor-pointer"
                  />
                </th>
                <th className="px-3 py-2.5 w-14 text-center">Banner</th>
                
                <th className="px-3 py-2.5 cursor-pointer hover:text-[var(--primary)]" onClick={() => handleSort("name")}>
                  Combo Name {getSortIcon("name")}
                </th>
                
                <th className="px-3 py-2.5">Included Products</th>
                
                <th className="px-3 py-2.5 cursor-pointer hover:text-[var(--primary)] text-center" onClick={() => handleSort("comboType")}>
                  Combo Type {getSortIcon("comboType")}
                </th>
                
                <th className="px-3 py-2.5 text-right cursor-pointer hover:text-[var(--primary)]" onClick={() => handleSort("price")}>
                  Combo Price {getSortIcon("price")}
                </th>
                
                <th className="px-3 py-2.5 text-center cursor-pointer hover:text-[var(--primary)]" onClick={() => handleSort("discountValue")}>
                  Discount {getSortIcon("discountValue")}
                </th>
                
                <th className="px-3 py-2.5 text-center">Validity Range</th>
                
                <th className="px-3 py-2.5">Applicability</th>
                
                <th className="px-3 py-2.5 text-center cursor-pointer hover:text-[var(--primary)]" onClick={() => handleSort("status")}>
                  Status {getSortIcon("status")}
                </th>
                
                <th className="px-3 py-2.5 text-center cursor-pointer hover:text-[var(--primary)]" onClick={() => handleSort("updatedAt")}>
                  Last Updated {getSortIcon("updatedAt")}
                </th>
                
                <th className="px-3 py-2.5 text-right sticky right-0 bg-zinc-50 dark:bg-zinc-950 shadow-l z-30 w-24">Actions</th>
              </tr>
            </thead>
            
            {/* Table Body */}
            <tbody className="divide-y divide-zinc-150 dark:divide-zinc-800 bg-white dark:bg-zinc-900/40 text-zinc-750 dark:text-zinc-300">
              {paginatedCombos.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-zinc-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ShoppingBag size={32} className="opacity-30 stroke-[1.5]" />
                      <p className="text-sm font-semibold">No combos or deals found matching filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedCombos.map((item) => {
                  const isChecked = selectedRows.includes(item._id);
                  const linkedItems = comboItems.filter(ci => ci.comboId === item._id);
                  
                  return (
                    <tr
                      key={item._id}
                      className={`hover:bg-zinc-50/50 dark:hover:bg-zinc-800/35 transition-colors ${isChecked ? "bg-[var(--primary)]/5" : ""}`}
                    >
                      {/* Checkbox */}
                      <td className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleSelectRow(item._id)}
                          className="w-4 h-4 rounded border-zinc-300 text-[var(--primary)] focus:ring-[var(--primary)]/20 cursor-pointer"
                        />
                      </td>

                      {/* Banner Thumbnail (WebP format expected) */}
                      <td className="px-3 py-2">
                        <div className="w-10 h-7 rounded overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-55 shrink-0 mx-auto">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                      </td>

                      {/* Combo Name & Short Desc */}
                      <td className="px-3 py-2">
                        <div className="max-w-[180px]">
                          <span className="font-bold text-zinc-900 dark:text-zinc-100 block truncate" title={item.name}>
                            {item.name}
                          </span>
                          <span className="text-[10px] text-zinc-400 block truncate" title={item.description}>
                            {item.description}
                          </span>
                        </div>
                      </td>

                      {/* Included Products Pills */}
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-1 max-w-[280px]">
                          {linkedItems.length === 0 ? (
                            <span className="text-[10px] text-zinc-400 italic">None selected</span>
                          ) : (
                            linkedItems.map(ci => {
                              const prod = products.find(p => p.id === ci.productId);
                              return (
                                <span key={ci._id} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded font-bold text-[9px]">
                                  {prod ? prod.name : ci.productId}
                                  <span className="text-[var(--primary)]">x{ci.quantity}</span>
                                </span>
                              );
                            })
                          )}
                        </div>
                      </td>

                      {/* Combo Type */}
                      <td className="px-3 py-2 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                          item.comboType === "fixed" ? "bg-blue-50 text-blue-700 dark:bg-blue-955/20 dark:text-blue-400" :
                          item.comboType === "bogo" ? "bg-purple-50 text-purple-700 dark:bg-purple-955/20 dark:text-purple-400" :
                          item.comboType === "meal" ? "bg-amber-50 text-amber-700 dark:bg-amber-955/20 dark:text-amber-400" :
                          item.comboType === "seasonal" ? "bg-pink-55 text-pink-700 dark:bg-pink-955/20 dark:text-pink-400" :
                          "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                        }`}>
                          {item.comboType}
                        </span>
                      </td>

                      {/* Combo Selling Price */}
                      <td className="px-3 py-2 text-right font-black text-zinc-900 dark:text-zinc-100 font-mono">
                        ₹{item.price.toFixed(2)}
                      </td>

                      {/* Discount Details */}
                      <td className="px-3 py-2 text-center">
                        <div className="flex flex-col items-center">
                          <span className="font-bold text-zinc-800 dark:text-zinc-200">
                            {item.discountType === "percentage" ? `${item.discountValue}%` : `₹${item.discountValue}`}
                          </span>
                          <span className="text-[8px] text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-black">
                            {item.discountType === "percentage" ? "Percentage" : "Flat Discount"}
                          </span>
                        </div>
                      </td>

                      {/* Validity Period */}
                      <td className="px-3 py-2 text-center">
                        <div className="flex flex-col items-center font-mono text-[9px] text-zinc-555 font-semibold leading-normal">
                          <span>F: {item.validFrom ? new Date(item.validFrom).toLocaleDateString("en-IN") : "Immediate"}</span>
                          <span>T: {item.validTo ? new Date(item.validTo).toLocaleDateString("en-IN") : "Indefinite"}</span>
                        </div>
                      </td>

                      {/* Applicability Stores/Franchises */}
                      <td className="px-3 py-2">
                        <div className="max-w-[120px]">
                          {item.applicabilityType === "all" && (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">All Stores</span>
                          )}
                          {item.applicabilityType === "franchises" && (
                            <span className="text-[9px] font-bold text-zinc-500 block truncate" title={item.applicableFranchises.join(", ")}>
                              Franchises ({item.applicableFranchises.length})
                            </span>
                          )}
                          {item.applicabilityType === "stores" && (
                            <span className="text-[9px] font-bold text-zinc-500 block truncate" title={item.applicableStores.join(", ")}>
                              Stores ({item.applicableStores.length})
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="px-3 py-2 text-center">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                          item.status === "active" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-955/20 dark:text-emerald-450" :
                          item.status === "scheduled" ? "bg-blue-100 text-blue-800 dark:bg-blue-955/20 dark:text-blue-400" :
                          item.status === "draft" ? "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400" :
                          item.status === "expired" ? "bg-red-100 text-red-850 dark:bg-red-955/20 dark:text-red-400" :
                          "bg-zinc-200 text-zinc-500 dark:bg-zinc-850 dark:text-zinc-500" // Archived
                        }`}>
                          {item.status}
                        </span>
                      </td>

                      {/* Last Updated */}
                      <td className="px-3 py-2 text-center text-zinc-555 font-semibold font-mono">
                        {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString("en-IN") : "16 Jun 2026"}
                      </td>

                      {/* Actions Sticky Row Actions */}
                      <td className={`px-3 py-2 text-right sticky right-0 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 shadow-l transition-colors ${
                        activeDropdown === item._id ? "z-40" : "z-20"
                      }`}>
                        <div className="relative inline-block text-left">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDropdown(prev => (prev === item._id ? null : item._id));
                            }}
                            className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-black dark:hover:text-white transition-all cursor-pointer"
                          >
                            <MoreVertical size={14} />
                          </button>

                          {activeDropdown === item._id && (
                            <div className="absolute right-0 bottom-full md:bottom-auto md:top-full mt-1 w-48 bg-white dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl z-50 overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-855 animate-in fade-in slide-in-from-top-1 text-zinc-700 dark:text-zinc-300">
                              <div className="py-0.5">
                                {/* View Action */}
                                <button
                                  type="button"
                                  onClick={() => onView(item)}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-105 dark:hover:bg-zinc-900 text-left cursor-pointer text-xs"
                                >
                                  <Eye size={12} />
                                  View Details
                                </button>
                                
                                {/* Edit Action */}
                                <button
                                  type="button"
                                  onClick={() => onEdit(item)}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-105 dark:hover:bg-zinc-900 text-left cursor-pointer text-xs"
                                >
                                  <Edit size={12} />
                                  Edit Combo
                                </button>
                                
                                {/* Duplicate Action */}
                                <button
                                  type="button"
                                  onClick={() => onDuplicate(item)}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-105 dark:hover:bg-zinc-900 text-left cursor-pointer text-xs"
                                >
                                  <Copy size={12} />
                                  Duplicate
                                </button>
                              </div>

                              <div className="py-0.5">
                                {/* Status Toggle Activations */}
                                {item.status !== "active" && (
                                  <button
                                    type="button"
                                    onClick={() => onStatusChange(item._id, "active")}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-105 dark:hover:bg-zinc-900 text-left text-emerald-650 dark:text-emerald-400 cursor-pointer text-xs"
                                  >
                                    <CheckCircle size={12} />
                                    Activate
                                  </button>
                                )}
                                
                                {item.status === "active" && (
                                  <button
                                    type="button"
                                    onClick={() => onStatusChange(item._id, "inactive")}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-105 dark:hover:bg-zinc-900 text-left text-zinc-550 cursor-pointer text-xs"
                                  >
                                    <XCircle size={12} />
                                    Deactivate
                                  </button>
                                )}
                                
                                {item.status !== "scheduled" && (
                                  <button
                                    type="button"
                                    onClick={() => onStatusChange(item._id, "scheduled")}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-105 dark:hover:bg-zinc-900 text-left text-blue-500 cursor-pointer text-xs"
                                  >
                                    <Calendar size={12} />
                                    Schedule
                                  </button>
                                )}

                                {item.status !== "archived" && (
                                  <button
                                    type="button"
                                    onClick={() => onStatusChange(item._id, "archived")}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-105 dark:hover:bg-zinc-900 text-left text-zinc-400 cursor-pointer text-xs"
                                  >
                                    <Archive size={12} />
                                    Archive
                                  </button>
                                )}
                              </div>

                              {/* Customer View Preview trigger */}
                              <div className="py-0.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    alert(`Customer Mobile View Mockup:\n-------------------------\nCombo Offer: ${item.name}\nPrice: ₹${item.price}\nIncludes: ${item.description}`);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-105 dark:hover:bg-zinc-900 text-left text-amber-650 dark:text-amber-400 cursor-pointer text-xs"
                                >
                                  <ExternalLink size={12} />
                                  Customer Preview
                                </button>
                              </div>

                              {/* Delete Action */}
                              <div className="py-0.5">
                                <button
                                  type="button"
                                  onClick={() => onDelete(item)}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-red-50 hover:text-red-650 dark:hover:bg-red-950/20 dark:hover:text-red-400 text-left cursor-pointer font-bold text-red-500 text-xs"
                                >
                                  <Trash2 size={12} />
                                  Delete Record
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <footer className="bg-zinc-50 dark:bg-zinc-950 px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500 font-semibold">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span>Show</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-1.5 py-1 border border-zinc-200 dark:border-zinc-850 rounded bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 focus:outline-none"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span>entries</span>
            </div>
            <span>
              Page <span className="font-bold text-zinc-800 dark:text-zinc-200">{currentPage}</span> of <span className="font-bold text-zinc-800 dark:text-zinc-200">{totalPages}</span>
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 border border-zinc-200 dark:border-zinc-800 rounded hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              Previous
            </button>
            
            {[...Array(totalPages)].map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentPage(idx + 1)}
                className={`px-2.5 py-1 border rounded transition-colors cursor-pointer ${
                  currentPage === idx + 1
                    ? "bg-[var(--primary)] text-white border-[var(--primary)] font-bold shadow-sm"
                    : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
                }`}
              >
                {idx + 1}
              </button>
            ))}
            
            <button
              onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 border border-zinc-200 dark:border-zinc-800 rounded hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              Next
            </button>
          </div>
        </footer>

        {/* Floating Bulk Actions Panel */}
        {selectedRows.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-zinc-900 text-white px-4 py-2.5 rounded-xl border border-zinc-800 shadow-2xl flex items-center gap-4 z-[99] animate-in slide-in-from-bottom-5 duration-300">
            <span className="text-[11px] font-bold tracking-wide">
              {selectedRows.length} {selectedRows.length === 1 ? "combo" : "combos"} selected
            </span>
            <div className="h-4 w-px bg-zinc-800" />
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleLocalBulkAction("activate")}
                className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 rounded text-[10px] font-bold text-white transition-colors cursor-pointer"
              >
                <CheckCircle size={10} />
                Activate
              </button>
              <button
                onClick={() => handleLocalBulkAction("deactivate")}
                className="flex items-center gap-1 px-2.5 py-1 bg-zinc-750 hover:bg-zinc-700 rounded text-[10px] font-bold text-zinc-300 transition-colors cursor-pointer"
              >
                <XCircle size={10} />
                Deactivate
              </button>
              <button
                onClick={() => handleLocalBulkAction("archive")}
                className="flex items-center gap-1 px-2.5 py-1 bg-zinc-750 hover:bg-zinc-700 rounded text-[10px] font-bold text-zinc-300 transition-colors cursor-pointer"
              >
                <Archive size={10} />
                Archive
              </button>
              <button
                onClick={() => handleLocalBulkAction("delete")}
                className="flex items-center gap-1 px-2.5 py-1 bg-red-650 hover:bg-red-500 rounded text-[10px] font-bold text-white transition-colors cursor-pointer"
              >
                <Trash2 size={10} />
                Delete
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
