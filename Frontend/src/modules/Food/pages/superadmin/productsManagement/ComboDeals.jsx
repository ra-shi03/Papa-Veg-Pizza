import React, { useState } from "react";
import { Plus, ClipboardList, CheckCircle, XCircle, AlertTriangle, TrendingUp, RefreshCw, X, Gift, Calendar, Clock, Sparkles } from "lucide-react";

// Component imports
import ComboDealsData from "./ComboDealsData";
import ComboDetails from "./ComboDetails";
import CreateComboModal from "./CreateComboModal";
import EditComboModal from "./EditComboModal";
import DuplicateComboModal from "./DuplicateComboModal";
import DeleteComboModal from "./DeleteComboModal";

// Predefined list of mock products (100% Pure Veg)
const productsList = [
  { id: "PP-V-001", name: "Paneer Tikka Supreme", category: "Pizza", price: 349, image: "https://images.unsplash.com/photo-1571066811602-71683a3f680d?fm=webp&fit=crop&w=100&q=80" },
  { id: "PP-V-002", name: "Veg Supreme Delight", category: "Pizza", price: 299, image: "https://images.unsplash.com/photo-1590947132387-155cc02f3212?fm=webp&fit=crop&w=100&q=80" },
  { id: "PP-V-003", name: "Tandoori Veggie Blast", category: "Pizza", price: 329, image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?fm=webp&fit=crop&w=100&q=80" },
  { id: "PP-V-004", name: "Cheese Burst Margherita", category: "Pizza", price: 249, image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?fm=webp&fit=crop&w=100&q=80" },
  { id: "PP-V-005", name: "Spicy Capsicum & Corn", category: "Pizza", price: 219, image: "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?fm=webp&fit=crop&w=100&q=80" },
  { id: "PP-V-006", name: "Garlic Breadsticks", category: "Garlic Bread", price: 99, image: "https://images.unsplash.com/photo-1544982503-9f984c14501a?fm=webp&fit=crop&w=100&q=80" },
  { id: "PP-V-007", name: "Chocolate Lava Cake", category: "Desserts", price: 89, image: "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?fm=webp&fit=crop&w=100&q=80" },
  { id: "PP-V-008", name: "Cold Pepsi 500ml", category: "Beverages", price: 40, image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?fm=webp&fit=crop&w=100&q=80" }
];

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

export default function ComboDeals() {
  // Main Data States mapping combos & combo_items
  const [combos, setCombos] = useState([
    {
      _id: "combo_001",
      name: "Solo Classic Treat",
      description: "1 Personal Margherita Pizza + 1 Garlic Breadsticks + 1 Coke",
      image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?fm=webp&fit=crop&w=300&q=80",
      comboType: "fixed",
      price: 299,
      discountType: "percentage",
      discountValue: 20,
      validFrom: "2026-06-01T00:00:00Z",
      validTo: "2026-08-31T23:59:59Z",
      status: "active",
      applicabilityType: "all", // all, franchises, stores
      applicableFranchises: [],
      applicableStores: [],
      createdBy: "Admin.Rashi",
      updatedBy: "Admin.Rashi",
      createdAt: "2026-06-01T10:00:00Z",
      updatedAt: "2026-06-15T10:00:00Z"
    },
    {
      _id: "combo_002",
      name: "Family Veg Feast",
      description: "2 Medium Veg Supreme Pizzas + 1 Garlic Breadsticks + 1 Choco Lava Cake + 2 Pepsi 500ml",
      image: "https://images.unsplash.com/photo-1590947132387-155cc02f3212?fm=webp&fit=crop&w=300&q=80",
      comboType: "meal",
      price: 749,
      discountType: "flat",
      discountValue: 150,
      validFrom: "2026-06-10T00:00:00Z",
      validTo: "2026-07-10T23:59:59Z",
      status: "active",
      applicabilityType: "stores",
      applicableFranchises: [],
      applicableStores: ["Store Delhi-Connaught Place", "Store Mumbai-Andheri"],
      createdBy: "Admin.Rashi",
      updatedBy: "Admin.Rashi",
      createdAt: "2026-06-08T12:00:00Z",
      updatedAt: "2026-06-16T14:30:00Z"
    },
    {
      _id: "combo_003",
      name: "BOGO Friday Delight",
      description: "Buy One Paneer Tikka Pizza, Get One Margherita Pizza (Equal size) at 50% discount",
      image: "https://images.unsplash.com/photo-1571066811602-71683a3f680d?fm=webp&fit=crop&w=300&q=80",
      comboType: "bogo",
      price: 499,
      discountType: "percentage",
      discountValue: 50,
      validFrom: "2026-06-25T00:00:00Z",
      validTo: "2026-09-30T23:59:59Z",
      status: "scheduled",
      applicabilityType: "franchises",
      applicableFranchises: ["Franchise West India", "Franchise North India"],
      applicableStores: [],
      createdBy: "Admin.Rashi",
      updatedBy: "Admin.Rashi",
      createdAt: "2026-06-12T15:00:00Z",
      updatedAt: "2026-06-12T15:00:00Z"
    },
    {
      _id: "combo_004",
      name: "Student Hangout Offer",
      description: "4 Personal Pizzas + 2 Garlic Breadsticks + 4 Pepsi 500ml",
      image: "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?fm=webp&fit=crop&w=300&q=80",
      comboType: "custom",
      price: 649,
      discountType: "flat",
      discountValue: 180,
      validFrom: "2026-06-15T00:00:00Z",
      validTo: "2026-12-31T23:59:59Z",
      status: "draft",
      applicabilityType: "all",
      applicableFranchises: [],
      applicableStores: [],
      createdBy: "Admin.Rashi",
      updatedBy: "Admin.Rashi",
      createdAt: "2026-06-15T11:20:00Z",
      updatedAt: "2026-06-15T11:20:00Z"
    },
    {
      _id: "combo_005",
      name: "Mango Summer Sundae Special",
      description: "1 Medium Farmhouse Pizza + 2 Choco Lava Cakes (Seasonal Mango Puree variant)",
      image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?fm=webp&fit=crop&w=300&q=80",
      comboType: "seasonal",
      price: 380,
      discountType: "percentage",
      discountValue: 15,
      validFrom: "2026-04-01T00:00:00Z",
      validTo: "2026-06-15T23:59:59Z",
      status: "expired",
      applicabilityType: "all",
      applicableFranchises: [],
      applicableStores: [],
      createdBy: "Admin.Rashi",
      updatedBy: "Admin.Rashi",
      createdAt: "2023-03-25T09:00:00Z",
      updatedAt: "2026-06-16T00:00:00Z"
    }
  ]);

  const [comboItems, setComboItems] = useState([
    { _id: "ci_1", comboId: "combo_001", productId: "PP-V-004", quantity: 1 },
    { _id: "ci_2", comboId: "combo_001", productId: "PP-V-006", quantity: 1 },
    { _id: "ci_3", comboId: "combo_001", productId: "PP-V-008", quantity: 1 },
    { _id: "ci_4", comboId: "combo_002", productId: "PP-V-002", quantity: 2 },
    { _id: "ci_5", comboId: "combo_002", productId: "PP-V-006", quantity: 1 },
    { _id: "ci_6", comboId: "combo_002", productId: "PP-V-007", quantity: 1 },
    { _id: "ci_7", comboId: "combo_002", productId: "PP-V-008", quantity: 2 },
    { _id: "ci_8", comboId: "combo_003", productId: "PP-V-001", quantity: 1 },
    { _id: "ci_9", comboId: "combo_003", productId: "PP-V-004", quantity: 1 }
  ]);

  // Order references for delete constraint checking
  const [orderComboReferences, setOrderComboReferences] = useState([
    "combo_001",
    "combo_002"
  ]);

  // Toast / Alert banner state
  const [alert, setAlert] = useState(null);

  // Modals Visibility
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [selectedCombo, setSelectedCombo] = useState(null);

  // Trigger alert banner helper
  const triggerAlert = (message, type = "success") => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 4000);
  };

  // Live Stats calculations
  const now = new Date();
  const stats = {
    totalCombos: combos.length,
    activeCombos: combos.filter(c => c.status === "active").length,
    scheduledCombos: combos.filter(c => c.status === "scheduled").length,
    expiredCombos: combos.filter(c => c.status === "expired" || (c.validTo && new Date(c.validTo) < now)).length,
    draftCombos: combos.filter(c => c.status === "draft").length,
    totalRevenue: 284500, // INR
    mostPurchased: "Family Veg Feast",
    expiringSoon: combos.filter(c => {
      if (c.status !== "active" || !c.validTo) return false;
      const expiry = new Date(c.validTo);
      const diffTime = expiry - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 && diffDays <= 7;
    }).length
  };

  // Row Action Dispatchers
  const handleView = (combo) => {
    setSelectedCombo(combo);
    setIsDetailOpen(true);
  };

  const handleEdit = (combo) => {
    setSelectedCombo(combo);
    setIsEditModalOpen(true);
  };

  const handleDuplicate = (combo) => {
    setSelectedCombo(combo);
    setIsDuplicateModalOpen(true);
  };

  const handleDelete = (combo) => {
    setSelectedCombo(combo);
    setIsDeleteModalOpen(true);
  };

  const handleStatusChange = (comboId, newStatus) => {
    setCombos(prev =>
      prev.map(c => (c._id === comboId ? { ...c, status: newStatus, updatedAt: new Date().toISOString() } : c))
    );
    const target = combos.find(c => c._id === comboId);
    triggerAlert(`Combo "${target ? target.name : 'Offer'}" status successfully updated to "${newStatus}"!`, "success");
  };

  // Form submit saves
  const handleCreateSave = (newComboPayload, newItemsPayload) => {
    const newComboId = `combo_${Date.now()}`;
    const comboRecord = {
      _id: newComboId,
      ...newComboPayload,
      createdBy: "Admin.Rashi",
      updatedBy: "Admin.Rashi",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const itemRecords = newItemsPayload.map((item, idx) => ({
      _id: `ci_${Date.now()}_${idx}`,
      comboId: newComboId,
      productId: item.productId,
      quantity: item.quantity
    }));

    setCombos(prev => [comboRecord, ...prev]);
    setComboItems(prev => [...prev, ...itemRecords]);
    setIsAddModalOpen(false);
    triggerAlert(`Successfully created new combo deal "${comboRecord.name}"!`, "success");
  };

  const handleEditSave = (comboId, updatedComboPayload, updatedItemsPayload) => {
    setCombos(prev =>
      prev.map(c => (c._id === comboId ? {
        ...c,
        ...updatedComboPayload,
        updatedBy: "Admin.Rashi",
        updatedAt: new Date().toISOString()
      } : c))
    );

    setComboItems(prev => {
      const filtered = prev.filter(item => item.comboId !== comboId);
      const newItems = updatedItemsPayload.map((item, idx) => ({
        _id: item._id || `ci_${Date.now()}_${idx}`,
        comboId: comboId,
        productId: item.productId,
        quantity: item.quantity
      }));
      return [...filtered, ...newItems];
    });

    setIsEditModalOpen(false);
    triggerAlert(`Modifications saved for "${updatedComboPayload.name}"!`, "success");
  };

  const handleDuplicateConfirm = (originalId, newName, options) => {
    const originalCombo = combos.find(c => c._id === originalId);
    if (!originalCombo) return;

    const newComboId = `combo_${Date.now()}`;
    const comboRecord = {
      ...originalCombo,
      _id: newComboId,
      name: newName,
      image: options.copyBanner ? originalCombo.image : "https://images.unsplash.com/photo-1513104890138-7c749659a591?fm=webp&fit=crop&w=300&q=80",
      validFrom: options.copyValidity ? originalCombo.validFrom : new Date().toISOString(),
      validTo: options.copyValidity ? originalCombo.validTo : "",
      applicabilityType: options.copyStores ? originalCombo.applicabilityType : "all",
      applicableFranchises: options.copyStores ? originalCombo.applicableFranchises : [],
      applicableStores: options.copyStores ? originalCombo.applicableStores : [],
      status: "draft",
      createdBy: "Admin.Rashi",
      updatedBy: "Admin.Rashi",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (options.copyProducts) {
      const originalItems = comboItems.filter(item => item.comboId === originalId);
      const newItems = originalItems.map((item, idx) => ({
        _id: `ci_${Date.now()}_${idx}`,
        comboId: newComboId,
        productId: item.productId,
        quantity: item.quantity
      }));
      setComboItems(prev => [...prev, ...newItems]);
    }

    setCombos(prev => [comboRecord, ...prev]);
    setIsDuplicateModalOpen(false);
    triggerAlert(`Duplicated "${originalCombo.name}" as "${newName}"!`, "success");
  };

  const handleDeleteConfirm = (comboId, actionType) => {
    const target = combos.find(c => c._id === comboId);
    const name = target ? target.name : "Offer";

    if (actionType === "archive") {
      setCombos(prev =>
        prev.map(c => (c._id === comboId ? { ...c, status: "archived", updatedAt: new Date().toISOString() } : c))
      );
      triggerAlert(`Combo "${name}" has been archived successfully.`, "warning");
    } else {
      setCombos(prev => prev.filter(c => c._id !== comboId));
      setComboItems(prev => prev.filter(item => item.comboId !== comboId));
      triggerAlert(`Combo "${name}" deleted from catalog.`, "error");
    }
    setIsDeleteModalOpen(false);
  };

  // Bulk operation actions
  const handleBulkAction = (action, selectedIds) => {
    if (action === "activate") {
      setCombos(prev => prev.map(c => selectedIds.includes(c._id) ? { ...c, status: "active", updatedAt: new Date().toISOString() } : c));
      triggerAlert(`Bulk activated ${selectedIds.length} combos!`, "success");
    } else if (action === "deactivate") {
      setCombos(prev => prev.map(c => selectedIds.includes(c._id) ? { ...c, status: "inactive", updatedAt: new Date().toISOString() } : c));
      triggerAlert(`Bulk deactivated ${selectedIds.length} combos!`, "success");
    } else if (action === "archive") {
      setCombos(prev => prev.map(c => selectedIds.includes(c._id) ? { ...c, status: "archived", updatedAt: new Date().toISOString() } : c));
      triggerAlert(`Bulk archived ${selectedIds.length} combos!`, "warning");
    } else if (action === "delete") {
      const eligible = selectedIds.filter(id => !orderComboReferences.includes(id));
      const ineligibles = selectedIds.filter(id => orderComboReferences.includes(id));

      if (eligible.length > 0) {
        setCombos(prev => prev.filter(c => !eligible.includes(c._id)));
        setComboItems(prev => prev.filter(item => !eligible.includes(item.comboId)));
      }

      if (ineligibles.length > 0) {
        triggerAlert(`Deleted ${eligible.length} eligible records. ${ineligibles.length} combos retained due to historical orders linkage.`, "warning");
      } else {
        triggerAlert(`Bulk deleted ${eligible.length} combos successfully.`, "error");
      }
    }
  };

  // CSV Exporter
  const handleDownloadCSV = (dataset) => {
    const headers = "ID,Name,Type,Price,DiscountType,DiscountValue,ValidFrom,ValidTo,Status,UpdatedAt\n";
    const rows = dataset.map(c =>
      `"${c._id}","${c.name}","${c.comboType}",${c.price},"${c.discountType}",${c.discountValue},"${c.validFrom || ""}","${c.validTo || ""}","${c.status}","${c.updatedAt || ""}"`
    ).join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `combos_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const triggerRefresh = () => {
    triggerAlert("POS catalog combos synchronized and refreshed.", "success");
  };

  return (
    <div className="p-3 md:p-4 pb-12 max-w-7xl mx-auto bg-zinc-50 dark:bg-zinc-950 min-h-screen w-full space-y-4 text-zinc-900 dark:text-zinc-100 select-none">

      {/* Toast Alert Banner */}
      {alert && (
        <div className={`fixed top-4 right-4 z-[99] p-3 rounded-lg border shadow-xl flex items-center justify-between gap-3 text-xs font-bold animate-in fade-in slide-in-from-top-4 duration-300 ${alert.type === "success" ? "bg-emerald-50 dark:bg-emerald-950/90 text-emerald-800 dark:text-emerald-450 border-emerald-500/20" :
            alert.type === "warning" ? "bg-amber-50 dark:bg-amber-955/90 text-amber-800 dark:text-amber-450 border-amber-500/20" :
              "bg-rose-50 dark:bg-rose-955/90 text-rose-800 dark:text-rose-400 border-rose-500/20"
          }`}>
          <div className="flex items-center gap-2">
            <CheckCircle size={14} className={alert.type === "success" ? "text-emerald-500" : "text-amber-500"} />
            <span>{alert.message}</span>
          </div>
          <button onClick={() => setAlert(null)} className="p-0.5 hover:bg-black/5 dark:hover:bg-white/10 rounded cursor-pointer">
            <X size={12} />
          </button>
        </div>
      )}

      {/* Header and Breadcrumb Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3 pt-2">
        <div className="space-y-0.5">
          <h1 className="text-lg font-bold text-black dark:text-white leading-tight mt-1">
            Combos & Deals Management
          </h1>
          <p className="text-[10px] font-semibold text-zinc-400 mt-0.5">
            Configure meal bundles, BOGO deals, discount rules, and schedule promotional offers.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            onClick={triggerRefresh}
            className="p-2 border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg text-zinc-550 dark:text-zinc-400 transition-colors shadow-sm cursor-pointer"
            title="Refresh Catalog"
          >
            <RefreshCw size={12} />
          </button>

          <button
            onClick={() => {
              setSelectedCombo(null);
              setIsAddModalOpen(true);
            }}
            className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white px-3.5 py-1.5 rounded-lg flex items-center justify-center gap-1.5 shadow-md hover:scale-[1.02] active:scale-95 transition-all cursor-pointer font-bold text-[11px]"
          >
            <Plus size={14} className="stroke-[3]" />
            <span>CREATE COMBO</span>
          </button>
        </div>
      </div>

      {/* KPI Bento summary grid */}
      <section className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* Total Combos */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider truncate">Total Combos</span>
            <h3 className="text-base font-black text-black dark:text-white mt-0.5">{stats.totalCombos}</h3>
          </div>
          <div className="p-1 rounded-md bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 shrink-0">
            <ClipboardList size={14} />
          </div>
        </div>

        {/* Active Combos */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider truncate">Active Deals</span>
            <h3 className="text-base font-black text-emerald-600 dark:text-emerald-450 mt-0.5">{stats.activeCombos}</h3>
          </div>
          <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-100 dark:border-emerald-900/35 shrink-0">
            <CheckCircle size={14} />
          </div>
        </div>

        {/* Scheduled Combos */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider truncate">Scheduled</span>
            <h3 className="text-base font-black text-blue-500 mt-0.5">{stats.scheduledCombos}</h3>
          </div>
          <div className="p-1 rounded-md bg-blue-500/10 text-blue-500 border border-blue-100 dark:border-blue-900/35 shrink-0">
            <Calendar size={14} />
          </div>
        </div>

        {/* Expired Combos */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider truncate">Expired</span>
            <h3 className="text-base font-black text-red-500 mt-0.5">{stats.expiredCombos}</h3>
          </div>
          <div className="p-1 rounded-md bg-red-500/10 text-red-500 border border-red-100 dark:border-red-900/35 shrink-0">
            <XCircle size={14} />
          </div>
        </div>

        {/* Draft Combos */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider truncate">Draft Deals</span>
            <h3 className="text-base font-black text-zinc-500 mt-0.5">{stats.draftCombos}</h3>
          </div>
          <div className="p-1 rounded-md bg-zinc-100 text-zinc-500 border border-zinc-200 dark:border-zinc-850 shrink-0">
            <Gift size={14} />
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider truncate">Total Revenue</span>
            <h3 className="text-base font-black text-amber-600 dark:text-amber-405 mt-0.5">₹{stats.totalRevenue.toLocaleString("en-IN")}</h3>
          </div>
          <div className="p-1 rounded-md bg-amber-500/10 text-amber-600 border border-amber-100 dark:border-amber-900/35 shrink-0">
            <TrendingUp size={14} />
          </div>
        </div>

        {/* Most Purchased */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl flex items-center justify-between shadow-sm hover:shadow-md transition-shadow col-span-1">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider truncate">Best Seller</span>
            <p className="text-[10px] font-black text-zinc-800 dark:text-zinc-200 mt-1 truncate">{stats.mostPurchased}</p>
          </div>
          <div className="p-1 rounded-md bg-purple-500/10 text-purple-500 border border-purple-100 dark:border-purple-900/35 shrink-0">
            <Sparkles size={14} />
          </div>
        </div>

        {/* Expiring Soon */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl flex items-center justify-between shadow-sm hover:shadow-md transition-shadow col-span-1">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider truncate">Expiring (7d)</span>
            <h3 className="text-base font-black text-orange-600 dark:text-orange-400 mt-0.5">{stats.expiringSoon}</h3>
          </div>
          <div className="p-1 rounded-md bg-orange-500/10 text-orange-500 border border-orange-100 dark:border-orange-900/35 shrink-0">
            <Clock size={14} />
          </div>
        </div>
      </section>

      {/* Main Table, Toolbar, Search, Filters component wrapper */}
      <ComboDealsData
        combos={combos}
        comboItems={comboItems}
        products={productsList}
        onView={handleView}
        onEdit={handleEdit}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        onStatusChange={handleStatusChange}
        onBulkAction={handleBulkAction}
        onRefresh={triggerRefresh}
        onDownloadCSV={handleDownloadCSV}
      />

      {/* View Quick Preview Drawer */}
      {isDetailOpen && selectedCombo && (
        <ComboDetails
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          combo={selectedCombo}
          comboItems={comboItems.filter(item => item.comboId === selectedCombo._id)}
          products={productsList}
        />
      )}

      {/* Create Combo modal */}
      {isAddModalOpen && (
        <CreateComboModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSave={handleCreateSave}
          products={productsList}
          franchises={franchisesList}
          stores={storesList}
        />
      )}

      {/* Edit Combo Modal */}
      {isEditModalOpen && selectedCombo && (
        <EditComboModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          combo={selectedCombo}
          comboItems={comboItems.filter(item => item.comboId === selectedCombo._id)}
          onSave={(payloadCombo, payloadItems) => handleEditSave(selectedCombo._id, payloadCombo, payloadItems)}
          products={productsList}
          franchises={franchisesList}
          stores={storesList}
        />
      )}

      {/* Duplicate Combo Modal */}
      {isDuplicateModalOpen && selectedCombo && (
        <DuplicateComboModal
          isOpen={isDuplicateModalOpen}
          onClose={() => setIsDuplicateModalOpen(false)}
          combo={selectedCombo}
          onConfirm={(newName, options) => handleDuplicateConfirm(selectedCombo._id, newName, options)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedCombo && (
        <DeleteComboModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          combo={selectedCombo}
          hasOrders={orderComboReferences.includes(selectedCombo._id)}
          onConfirm={(actionType) => handleDeleteConfirm(selectedCombo._id, actionType)}
        />
      )}
    </div>
  );
}
