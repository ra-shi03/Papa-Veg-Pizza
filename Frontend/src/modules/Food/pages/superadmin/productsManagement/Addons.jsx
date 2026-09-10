import React, { useState, useEffect } from "react";
import {
  Plus, ClipboardList, CheckCircle, AlertTriangle, TrendingUp, DollarSign,
  Layers, Search, Filter, RefreshCw, Download, Upload, FileDown, RotateCcw,
  ShoppingBag, HelpCircle, ShieldAlert, XCircle, Sparkles
} from "lucide-react";

// Component imports
import AddonsData from "./AddonsData";
import AddonsDetails from "./AddonsDetails";
import AddAddonsModal from "./AddAddonsModal";
import EditAddonsModal from "./EditAddonsModal";
import DuplicateAddonModal from "./DuplicateAddonModal";
import DeleteAddonModal from "./DeleteAddonModal";
import ProductMappingModal from "./ProductMappingModal";

// Predefined lists matching catalog structures
const categoriesList = ["Pizza", "Garlic Bread", "Pasta", "Combos", "Desserts", "Beverages"];

const productsList = [
  { id: "PP-V-001", name: "Paneer Tikka Supreme", category: "Pizza" },
  { id: "PP-V-002", name: "Veg Supreme Delight", category: "Pizza" },
  { id: "PP-V-003", name: "Tandoori Veggie Blast", category: "Pizza" },
  { id: "PP-V-004", name: "Cheese Burst Margherita", category: "Pizza" },
  { id: "PP-V-005", name: "Spicy Capsicum & Corn", category: "Pizza" },
  { id: "PP-V-006", name: "Garlic Breadsticks", category: "Garlic Bread" },
  { id: "PP-V-007", name: "Chocolate Lava Cake", category: "Desserts" },
  { id: "PP-V-008", name: "Cold Pepsi 500ml", category: "Beverages" }
];

export default function Addons() {
  const getStoredAddons = () => {
    const data = localStorage.getItem("pvp_addons");
    const defaultAddons = [
      {
        _id: "add_001",
        name: "Tandoori Paneer Tikka",
        type: "topping",
        price: 60,
        category: "Pizza",
        isVeg: true,
        isVegan: false,
        maxQuantity: 3,
        defaultQuantity: 0,
        status: "active",
        image: "https://images.unsplash.com/photo-1571066811602-71683a3f680d?fm=webp&fit=crop&w=100&q=80",
        description: "Spiced paneer chunks grilled in a traditional clay oven.",
        createdAt: "2026-06-01T10:00:00Z",
        updatedAt: "2026-06-14T16:30:00Z"
      },
      {
        _id: "add_002",
        name: "Extra Cheese Burst",
        type: "extra cheese",
        price: 90,
        category: "Pizza",
        isVeg: true,
        isVegan: false,
        maxQuantity: 2,
        defaultQuantity: 0,
        status: "active",
        image: "https://images.unsplash.com/photo-1544982503-9f984c14501a?fm=webp&fit=crop&w=100&q=80",
        description: "Liquid Cheddar cheese burst filling directly inside the crust.",
        createdAt: "2026-06-02T10:00:00Z",
        updatedAt: "2026-06-15T12:00:00Z"
      },
      {
        _id: "add_003",
        name: "Spicy Garlic Mayo Dip",
        type: "dip",
        price: 25,
        category: "Garlic Bread",
        isVeg: true,
        isVegan: true,
        maxQuantity: 4,
        defaultQuantity: 0,
        status: "active",
        image: "https://images.unsplash.com/photo-1544982503-9f984c14501a?fm=webp&fit=crop&w=100&q=80",
        description: "Rich vegan mayonnaise infused with fresh roasted garlic and chili.",
        createdAt: "2026-06-03T10:00:00Z",
        updatedAt: "2026-06-12T14:15:00Z"
      },
      {
        _id: "add_004",
        name: "Hari Mirch & Capsicum Crunch",
        type: "topping",
        price: 45,
        category: "Pizza",
        isVeg: true,
        isVegan: true,
        maxQuantity: 3,
        defaultQuantity: 0,
        status: "active",
        image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?fm=webp&fit=crop&w=100&q=80",
        description: "Hottest green chilies paired with crunchy green bell pepper strips.",
        createdAt: "2026-06-04T10:00:00Z",
        updatedAt: "2026-06-13T10:20:00Z"
      },
      {
        _id: "add_005",
        name: "Tandoori Gravy Dip",
        type: "dip",
        price: 35,
        category: "Garlic Bread",
        isVeg: true,
        isVegan: false,
        maxQuantity: 4,
        defaultQuantity: 0,
        status: "inactive",
        image: "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?fm=webp&fit=crop&w=100&q=80",
        description: "Premium smoked gravy dipping sauce made with traditional spices.",
        createdAt: "2026-06-05T10:00:00Z",
        updatedAt: "2026-06-10T11:00:00Z"
      },
      {
        _id: "add_006",
        name: "Spicy Grilled Mushrooms",
        type: "topping",
        price: 55,
        category: "Pizza",
        isVeg: true,
        isVegan: true,
        maxQuantity: 3,
        defaultQuantity: 0,
        status: "active",
        image: "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?fm=webp&fit=crop&w=100&q=80",
        description: "Button mushrooms sautéed in spicy Indian herbs.",
        createdAt: "2026-06-06T10:00:00Z",
        updatedAt: "2026-06-16T15:10:00Z"
      }
    ];
    if (!data) {
      localStorage.setItem("pvp_addons", JSON.stringify(defaultAddons));
      return defaultAddons;
    }
    try {
      return JSON.parse(data);
    } catch (e) {
      return defaultAddons;
    }
  };

  const getStoredProductAddons = () => {
    const data = localStorage.getItem("pvp_product_addons");
    const defaultMappings = [
      { _id: "pa_1", productId: "PP-V-001", addonId: "add_001", isRequired: false, displayOrder: 1 },
      { _id: "pa_2", productId: "PP-V-001", addonId: "add_002", isRequired: true, displayOrder: 2 },
      { _id: "pa_3", productId: "PP-V-003", addonId: "add_001", isRequired: false, displayOrder: 1 },
      { _id: "pa_4", productId: "PP-V-002", addonId: "add_003", isRequired: false, displayOrder: 1 },
      { _id: "pa_5", productId: "PP-V-006", addonId: "add_003", isRequired: false, displayOrder: 2 },
      { _id: "pa_6", productId: "PP-V-006", addonId: "add_005", isRequired: false, displayOrder: 3 }
    ];
    if (!data) {
      localStorage.setItem("pvp_product_addons", JSON.stringify(defaultMappings));
      return defaultMappings;
    }
    try {
      return JSON.parse(data);
    } catch (e) {
      return defaultMappings;
    }
  };

  const [addons, setAddons] = useState(getStoredAddons);
  const [productAddons, setProductAddons] = useState(getStoredProductAddons);

  useEffect(() => {
    localStorage.setItem("pvp_addons", JSON.stringify(addons));
    window.dispatchEvent(new Event("pvp_addons_changed"));
  }, [addons]);

  useEffect(() => {
    localStorage.setItem("pvp_product_addons", JSON.stringify(productAddons));
    window.dispatchEvent(new Event("pvp_product_addons_changed"));
  }, [productAddons]);

  // UI Control States
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);

  // Active items for drawer and modals
  const [selectedAddon, setSelectedAddon] = useState(null);

  // Modals Visibility
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isMappingModalOpen, setIsMappingModalOpen] = useState(false);

  // Filters State
  const [filterType, setFilterType] = useState("");
  const [filterVeg, setFilterVeg] = useState("all");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterProduct, setFilterProduct] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  // Sorting State
  const [sortConfig, setSortConfig] = useState({ key: "name", direction: "asc" });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Debouncing Search (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset pagination on filter adjustments
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, filterType, filterVeg, filterStatus, filterCategory, filterProduct, dateRange]);

  // Calculate live stats summary cards
  const stats = {
    totalAddons: addons.length,
    activeAddons: addons.filter(a => a.status === "active").length,
    inactiveAddons: addons.filter(a => a.status === "inactive").length,
    vegAddons: addons.filter(a => a.isVeg && !a.isVegan).length,
    veganAddons: addons.filter(a => a.isVegan).length,
    totalMappings: productAddons.length,
    mostUsed: "Tandoori Paneer Tikka",
    newThisMonth: addons.filter(a => {
      const created = new Date(a.createdAt);
      const now = new Date();
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    }).length
  };

  // Reset all filters helper
  const handleResetFilters = () => {
    setSearchTerm("");
    setFilterType("");
    setFilterVeg("all");
    setFilterStatus("");
    setFilterCategory("");
    setFilterProduct("");
    setDateRange({ start: "", end: "" });
  };

  // Sorting logic
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Filter & Sort core processor
  const processedAddons = addons.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchesType = filterType ? item.type === filterType : true;

    let matchesVeg = true;
    if (filterVeg === "veg") matchesVeg = item.isVeg === true && !item.isVegan;
    if (filterVeg === "vegan") matchesVeg = item.isVegan === true;

    const matchesStatus = filterStatus ? item.status === filterStatus : true;
    const matchesCategory = filterCategory ? item.category === filterCategory : true;

    // Check mapping compatibility for product filter
    let matchesProduct = true;
    if (filterProduct) {
      matchesProduct = productAddons.some(pa => pa.addonId === item._id && pa.productId === filterProduct);
    }

    // Date range filter
    let matchesDate = true;
    if (dateRange.start && dateRange.end) {
      const itemDate = new Date(item.updatedAt || item.createdAt);
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      matchesDate = itemDate >= startDate && itemDate <= endDate;
    }

    return matchesSearch && matchesType && matchesVeg && matchesStatus && matchesCategory && matchesProduct && matchesDate;
  });

  const sortedAddons = [...processedAddons].sort((a, b) => {
    let aVal = a[sortConfig.key];
    let bVal = b[sortConfig.key];

    if (sortConfig.key === "price") {
      aVal = Number(aVal) || 0;
      bVal = Number(bVal) || 0;
    }

    if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  // Pagination bounds
  const totalPages = Math.ceil(sortedAddons.length / rowsPerPage) || 1;
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const paginatedAddons = sortedAddons.slice(indexOfFirstRow, indexOfLastRow);

  // Row Selection logic
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(paginatedAddons.map(item => item._id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedRows(prev =>
      prev.includes(id) ? prev.filter(rId => rId !== id) : [...prev, id]
    );
  };

  // Inline Row actions
  const handleViewDetails = (addon) => {
    setSelectedAddon(addon);
    setIsDetailOpen(true);
  };

  const handleEditAddon = (addon) => {
    setSelectedAddon(addon);
    setIsEditModalOpen(true);
  };

  const handleDuplicateAddon = (addon) => {
    setSelectedAddon(addon);
    setIsDuplicateModalOpen(true);
  };

  const handleDeleteAddon = (addon) => {
    setSelectedAddon(addon);
    setIsDeleteModalOpen(true);
  };

  const handleManageMapping = (addon) => {
    setSelectedAddon(addon);
    setIsMappingModalOpen(true);
  };

  // Status quick update trigger
  const handleStatusChange = (addonId, newStatus) => {
    setAddons(addons.map(a => (a._id === addonId ? { ...a, status: newStatus, updatedAt: new Date().toISOString() } : a)));
    alert(`Add-on status successfully updated to "${newStatus}"!`);
  };

  // API handler simulations
  const handleSaveNewAddon = (payload) => {
    const newId = `add_${Date.now()}`;
    const newRecord = {
      _id: newId,
      name: payload.name,
      type: payload.type,
      price: payload.price,
      category: payload.selectedCategories[0] || "Pizza",
      isVeg: payload.isVeg,
      maxQuantity: payload.maxQuantity,
      defaultQuantity: payload.defaultQuantity,
      status: payload.status,
      image: payload.image,
      description: payload.description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setAddons([newRecord, ...addons]);

    // Create product mappings
    if (payload.selectedProducts && payload.selectedProducts.length > 0) {
      const newMappings = payload.selectedProducts.map((pId, index) => ({
        _id: `pa_${Date.now()}_${index}`,
        productId: pId,
        addonId: newId,
        isRequired: payload.isRequired,
        displayOrder: index + 1
      }));
      setProductAddons(prev => [...prev, ...newMappings]);
    }

    alert(`Successfully created new add-on "${payload.name}"!`);
  };

  const handleSaveEditAddon = (payload) => {
    setAddons(addons.map(a => (a._id === payload._id ? {
      ...a,
      name: payload.name,
      type: payload.type,
      price: payload.price,
      isVeg: payload.isVeg,
      maxQuantity: payload.maxQuantity,
      defaultQuantity: payload.defaultQuantity,
      status: payload.status,
      image: payload.image,
      description: payload.description,
      category: payload.selectedCategories[0] || a.category,
      updatedAt: new Date().toISOString()
    } : a)));

    // Rebuild product mappings
    const mappingsFiltered = productAddons.filter(m => m.addonId !== payload._id);
    const updatedMappings = payload.selectedProducts.map((pId, idx) => ({
      _id: `pa_${Date.now()}_${idx}`,
      productId: pId,
      addonId: payload._id,
      isRequired: payload.isRequired,
      displayOrder: idx + 1
    }));

    setProductAddons([...mappingsFiltered, ...updatedMappings]);
    alert(`Add-on "${payload.name}" modifications saved successfully!`);
  };

  const handleConfirmDuplicate = (originalAddon, newName, options) => {
    const newId = `add_${Date.now()}`;
    const duplicateRecord = {
      ...originalAddon,
      _id: newId,
      name: newName,
      price: options.pricing ? originalAddon.price : 0,
      image: options.image ? originalAddon.image : "https://images.unsplash.com/photo-1513104890138-7c749659a591?fm=webp&fit=crop&w=100&q=80",
      category: options.categoryMappings ? originalAddon.category : "Pizza",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setAddons([duplicateRecord, ...addons]);

    if (options.productMappings) {
      const originalMappings = productAddons.filter(m => m.addonId === originalAddon._id);
      const copiedMappings = originalMappings.map((m, idx) => ({
        _id: `pa_${Date.now()}_${idx}`,
        productId: m.productId,
        addonId: newId,
        isRequired: m.isRequired,
        displayOrder: m.displayOrder
      }));
      setProductAddons(prev => [...prev, ...copiedMappings]);
    }

    alert(`Duplicated "${originalAddon.name}" as "${newName}" successfully!`);
  };

  const handleConfirmDelete = (addonId, actionType) => {
    if (actionType === "archive") {
      setAddons(addons.map(a => (a._id === addonId ? { ...a, status: "archived", updatedAt: new Date().toISOString() } : a)));
      alert("Add-on marked as archived.");
    } else {
      setAddons(addons.filter(a => a._id !== addonId));
      setProductAddons(productAddons.filter(m => m.addonId !== addonId));
      alert("Add-on permanently deleted.");
    }
    setSelectedRows([]);
  };

  const handleSaveProductMappings = (addonId, newMappings) => {
    const mappingsFiltered = productAddons.filter(m => m.addonId !== addonId);
    setProductAddons([...mappingsFiltered, ...newMappings]);
    alert("Product mappings updated successfully!");
  };

  // Bulk actions processor
  const handleBulkAction = (action) => {
    if (selectedRows.length === 0) return;

    if (action === "activate") {
      setAddons(addons.map(a => (selectedRows.includes(a._id) ? { ...a, status: "active" } : a)));
      alert(`Bulk activated ${selectedRows.length} add-ons!`);
    } else if (action === "deactivate") {
      setAddons(addons.map(a => (selectedRows.includes(a._id) ? { ...a, status: "inactive" } : a)));
      alert(`Bulk deactivated ${selectedRows.length} add-ons!`);
    } else if (action === "archive") {
      setAddons(addons.map(a => (selectedRows.includes(a._id) ? { ...a, status: "archived" } : a)));
      alert(`Bulk archived ${selectedRows.length} add-ons!`);
    } else if (action === "delete") {
      setAddons(addons.filter(a => !selectedRows.includes(a._id)));
      setProductAddons(productAddons.filter(m => !selectedRows.includes(m.addonId)));
      alert(`Bulk deleted selected eligible records!`);
    } else if (action === "export") {
      handleDownloadCSV(processedAddons.filter(a => selectedRows.includes(a._id)));
    }

    setSelectedRows([]);
  };

  // Download CSV helper
  const handleDownloadCSV = (dataset = processedAddons) => {
    const headers = "ID,Name,Type,Price,isVeg,MaxQuantity,Category,Status,UpdatedAt\n";
    const rows = dataset.map(a =>
      `"${a._id}","${a.name}","${a.type}",${a.price},${a.isVeg},${a.maxQuantity},"${a.category}","${a.status}","${a.updatedAt || ""}"`
    ).join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `addons_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-3 md:p-4 pb-12 max-w-7xl mx-auto bg-zinc-50 dark:bg-zinc-950 min-h-screen w-full space-y-4 text-zinc-900 dark:text-zinc-100">

      {/* Breadcrumb & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3 pt-2">
        <div className="space-y-0.5">

          <h1 className="text-lg font-bold text-black dark:text-white leading-tight mt-1">
            Toppings & Add-ons Module
          </h1>
          <p className="text-[10px] font-semibold text-zinc-400 mt-0.5">
            Configure extra side options, custom cheese crust toppings, and ingredient limits.
          </p>
        </div>

        {/* Toolbar Buttons */}
        <div className="flex items-center gap-1.5 self-end sm:self-center">
          <button
            onClick={() => handleDownloadCSV()}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white rounded-lg font-bold text-[11px] hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors bg-white dark:bg-zinc-950 shadow-sm"
          >
            <FileDown size={14} />
            Export CSV
          </button>

          <button
            onClick={() => {
              setSelectedAddon(null);
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white rounded-lg font-bold text-[11px] shadow-md hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
          >
            <Plus size={14} />
            Add New Add-on
          </button>
        </div>
      </div>

      {/* KPI Bento summary grid */}
      <section className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 select-none">

        {/* Total Add-ons */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider truncate">Total Add-ons</span>
            <h3 className="text-base font-black text-black dark:text-white mt-0.5">{stats.totalAddons}</h3>
          </div>
          <div className="p-1 rounded-md bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 shrink-0">
            <ClipboardList size={14} />
          </div>
        </div>

        {/* Active Add-ons */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider truncate">Active Add-ons</span>
            <h3 className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{stats.activeAddons}</h3>
          </div>
          <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-100 dark:border-emerald-900/35 shrink-0">
            <CheckCircle size={14} />
          </div>
        </div>

        {/* Inactive Add-ons */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider truncate">Inactive Add-ons</span>
            <h3 className="text-base font-black text-zinc-500 mt-0.5">{stats.inactiveAddons}</h3>
          </div>
          <div className="p-1 rounded-md bg-zinc-100 text-zinc-500 border border-zinc-200 dark:border-zinc-850 shrink-0">
            <XCircle size={14} />
          </div>
        </div>

        {/* Veg Add-ons */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider truncate">Veg Add-ons</span>
            <h3 className="text-base font-black text-green-600 dark:text-green-400 mt-0.5">{stats.vegAddons}</h3>
          </div>
          <div className="p-1.5 border-2 border-green-600 rounded-sm bg-white shrink-0">
            <div className="w-1 h-1 rounded-full bg-green-600" />
          </div>
        </div>

        {/* Vegan Add-ons */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider truncate">Vegan Add-ons</span>
            <h3 className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{stats.veganAddons}</h3>
          </div>
          <div className="p-1 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-100 dark:border-emerald-900/35 shrink-0 flex items-center justify-center font-bold text-[10px]">
            🌱
          </div>
        </div>

        {/* Total Mappings */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider truncate">Total Mappings</span>
            <h3 className="text-base font-black text-blue-500 mt-0.5">{stats.totalMappings}</h3>
          </div>
          <div className="p-1 rounded-md bg-blue-500/10 text-blue-600 border border-blue-100 dark:border-blue-900/35 shrink-0">
            <Layers size={14} />
          </div>
        </div>

        {/* Most Used Addon */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl flex items-center justify-between shadow-sm hover:shadow-md transition-shadow col-span-1">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider truncate">Most Used</span>
            <p className="text-[10px] font-black text-zinc-850 dark:text-zinc-200 mt-1 truncate">{stats.mostUsed}</p>
          </div>
          <div className="p-1 rounded-md bg-orange-500/10 text-orange-500 border border-orange-100 dark:border-orange-900/35 shrink-0">
            <TrendingUp size={14} />
          </div>
        </div>

        {/* Newly Created */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl flex items-center justify-between shadow-sm hover:shadow-md transition-shadow col-span-1">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider truncate">New This Month</span>
            <h3 className="text-base font-black text-purple-600 dark:text-purple-400 mt-0.5">{stats.newThisMonth}</h3>
          </div>
          <div className="p-1 rounded-md bg-purple-500/10 text-purple-500 border border-purple-100 dark:border-purple-900/35 shrink-0">
            <Sparkles size={14} />
          </div>
        </div>

      </section>

      {/* Top Filter and Search Toolbar */}
      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl shadow-sm space-y-3">

        {/* Main Search and Trigger Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
            <input
              type="text"
              placeholder="Search add-on name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-8 pl-8 pr-3 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs font-semibold rounded-lg focus:outline-none focus:border-[var(--primary)] text-zinc-900 dark:text-zinc-100"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${showFilters
                  ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                  : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 text-zinc-650 dark:text-zinc-350"
                }`}
            >
              <Filter size={12} />
              Filters
            </button>
            <button
              onClick={() => {
                alert("Bulk Import trigger: upload CSV catalog.");
              }}
              className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-550 border border-zinc-200 dark:border-zinc-800"
              title="Bulk Import CSV"
            >
              <Upload size={14} />
            </button>
            <button
              onClick={() => handleResetFilters()}
              className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-550 border border-zinc-200 dark:border-zinc-800"
              title="Reset All Filters"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>

        {/* Detailed Filters Panel */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-3 border-t border-zinc-250 dark:border-zinc-850 animate-in slide-in-from-top-1.5 duration-200">

            {/* Type */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-zinc-550 uppercase block">Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full h-8 px-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs outline-none focus:border-[var(--primary)] text-black dark:text-white font-semibold"
              >
                <option value="">All Types</option>
                <option value="topping">Topping</option>
                <option value="extra cheese">Extra Cheese</option>
                <option value="sauce">Sauce</option>
                <option value="dip">Dip</option>
                <option value="crust">Crust</option>
                <option value="seasoning">Seasoning</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Veg / Vegan */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-zinc-555 uppercase block">Veg Type</label>
              <select
                value={filterVeg}
                onChange={(e) => setFilterVeg(e.target.value)}
                className="w-full h-8 px-2 bg-white dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs outline-none focus:border-[var(--primary)] text-black dark:text-white font-semibold"
              >
                <option value="all">All</option>
                <option value="veg">Veg Only</option>
                <option value="vegan">Vegan Only</option>
              </select>
            </div>

            {/* Status */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-zinc-555 uppercase block">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full h-8 px-2 bg-white dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs outline-none focus:border-[var(--primary)] text-black dark:text-white font-semibold"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {/* Compatible Category */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-zinc-555 uppercase block">Category</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full h-8 px-2 bg-white dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs outline-none focus:border-[var(--primary)] text-black dark:text-white font-semibold"
              >
                <option value="">All Categories</option>
                {categoriesList.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Assigned Product */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-zinc-555 uppercase block">Assigned Product</label>
              <select
                value={filterProduct}
                onChange={(e) => setFilterProduct(e.target.value)}
                className="w-full h-8 px-2 bg-white dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs outline-none focus:border-[var(--primary)] text-black dark:text-white font-semibold"
              >
                <option value="">All Products</option>
                {productsList.map(prod => (
                  <option key={prod.id} value={prod.id}>{prod.name}</option>
                ))}
              </select>
            </div>

            {/* Date range picker simulation */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-zinc-555 uppercase block">Date Range</label>
              <div className="flex gap-1">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="w-1/2 h-8 px-1 text-[10px] rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 font-semibold text-zinc-650"
                />
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="w-1/2 h-8 px-1 text-[10px] rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 font-semibold text-zinc-650"
                />
              </div>
            </div>

          </div>
        )}
      </section>

      {/* Floating Bulk Actions Bar */}
      {selectedRows.length > 0 && (
        <div className="bg-zinc-900 text-white rounded-lg p-2.5 px-4 flex items-center justify-between shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-300 border border-zinc-800 select-none z-50">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-ping" />
            <span className="text-xs font-bold">{selectedRows.length} items checked</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => handleBulkAction("activate")}
              className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-[10px] font-black"
            >
              Activate
            </button>
            <button
              onClick={() => handleBulkAction("deactivate")}
              className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-[10px] font-black"
            >
              Deactivate
            </button>
            <button
              onClick={() => handleBulkAction("archive")}
              className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-[10px] font-black"
            >
              Archive
            </button>
            <button
              onClick={() => handleBulkAction("export")}
              className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-[10px] font-black"
            >
              Export Checked
            </button>
            <button
              onClick={() => handleBulkAction("delete")}
              className="px-2.5 py-1 bg-red-650 hover:bg-red-700 text-white rounded text-[10px] font-black shadow-sm"
            >
              Delete Checked
            </button>
          </div>
        </div>
      )}

      {/* Main Data Table */}
      <AddonsData
        addons={paginatedAddons}
        mappings={productAddons}
        selectedRows={selectedRows}
        onSelectRow={handleSelectRow}
        onSelectAll={handleSelectAll}
        onView={handleViewDetails}
        onEdit={handleEditAddon}
        onDuplicate={handleDuplicateAddon}
        onStatusChange={handleStatusChange}
        onDelete={handleDeleteAddon}
        onManageMapping={handleManageMapping}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={setRowsPerPage}
        sortConfig={sortConfig}
        onSort={handleSort}
      />

      {/* Details drawer (View drawer) */}
      <AddonsDetails
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        addon={selectedAddon}
        products={productsList}
        mappings={productAddons}
        onEdit={handleEditAddon}
      />

      {/* Add Wizard Modal */}
      <AddAddonsModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        products={productsList}
        categories={categoriesList}
        onSave={handleSaveNewAddon}
      />

      {/* Edit Wizard Modal */}
      <EditAddonsModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        addon={selectedAddon}
        products={productsList}
        categories={categoriesList}
        mappings={productAddons}
        onSave={handleSaveEditAddon}
      />

      {/* Duplicate Modal */}
      <DuplicateAddonModal
        isOpen={isDuplicateModalOpen}
        onClose={() => setIsDuplicateModalOpen(false)}
        addon={selectedAddon}
        onConfirm={handleConfirmDuplicate}
      />

      {/* Delete / Archive check Modal */}
      <DeleteAddonModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        addon={selectedAddon}
        mappings={productAddons}
        onConfirm={handleConfirmDelete}
      />

      {/* Product Mapping Manager Modal */}
      <ProductMappingModal
        isOpen={isMappingModalOpen}
        onClose={() => setIsMappingModalOpen(false)}
        addon={selectedAddon}
        products={productsList}
        categories={categoriesList}
        initialMappings={productAddons}
        onSave={handleSaveProductMappings}
      />

    </div>
  );
}
