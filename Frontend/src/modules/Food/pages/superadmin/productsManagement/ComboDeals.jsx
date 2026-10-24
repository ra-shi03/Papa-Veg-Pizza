import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, ClipboardList, CheckCircle, XCircle, AlertTriangle, TrendingUp, RefreshCw, X, Gift, Calendar, Clock, Sparkles } from "lucide-react";
import { adminClient } from "@/services/api/axios";

// Component imports
import ComboDealsData from "./ComboDealsData";
import ComboDetails from "./ComboDetails";
import CreateComboModal from "./CreateComboModal";
import EditComboModal from "./EditComboModal";
import DeleteComboModal from "./DeleteComboModal";

const idOf = (v) => (v && typeof v === "object" ? String(v._id || v.id || "") : v ? String(v) : "");

// Flatten API combo into the shape the table / drawer / modals already use
const normalizeCombo = (c) => ({
  ...c,
  _id: String(c._id),
  price: Number(c.price) || 0,
  originalPrice: Number(c.originalPrice) || 0,
  discountValue: Number(c.discountValue) || 0,
  categoryId: idOf(c.categoryId),
  categoryLabel: c.categoryId && typeof c.categoryId === "object" ? c.categoryId.label || "" : "",
  applicableFranchises: (c.applicableFranchises || []).map(idOf),
  applicableStores: (c.applicableStores || []).map(idOf),
  items: (c.items || []).map(it => ({
    ...it,
    _id: String(it._id || ""),
    productId: idOf(it.productId) || null,
    addonId: idOf(it.addonId) || null,
    choices: (it.choices || []).map(ch => ({ ...ch, _id: String(ch._id || ""), productId: idOf(ch.productId) || null, addonId: idOf(ch.addonId) || null }))
  }))
});

// Backend errorHandler responds with { success: false, error }, controllers with { message }
const getErrorMessage = (err, fallback) =>
  err?.response?.data?.error || err?.response?.data?.message || err?.message || fallback;

export default function ComboDeals() {
  const [combos, setCombos] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [addons, setAddons] = useState([]);
  const [franchises, setFranchises] = useState([]);
  const [stores, setStores] = useState([]);
  const [serverStats, setServerStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Toast / Alert banner state
  const [alert, setAlert] = useState(null);

  // Modals Visibility
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [selectedCombo, setSelectedCombo] = useState(null);

  // Trigger alert banner helper
  const triggerAlert = (message, type = "success") => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 4000);
  };

  const fetchCombos = useCallback(async () => {
    try {
      const [listRes, statsRes] = await Promise.all([
        adminClient.get("/food/admin/combos"),
        adminClient.get("/food/admin/combos/stats")
      ]);
      setCombos((listRes?.data?.data || []).map(normalizeCombo));
      setServerStats(statsRes?.data?.data || null);
    } catch (err) {
      triggerAlert(getErrorMessage(err, "Failed to load combos"), "error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Catalog lookups used by the create / edit form
  const fetchLookups = useCallback(async () => {
    const [prodRes, catRes, franRes, storeRes, addonRes] = await Promise.allSettled([
      adminClient.get("/food/admin/products"),
      adminClient.get("/food/admin/category-products?sort=sort_asc"),
      adminClient.get("/food/admin/franchises"),
      adminClient.get("/food/admin/stores"),
      adminClient.get("/food/admin/addons")
    ]);

    if (prodRes.status === "fulfilled") {
      const raw = prodRes.value?.data?.data;
      const list = Array.isArray(raw) ? raw : raw?.foods || [];
      setProducts(list.map(p => ({
        id: String(p._id || p.id),
        name: p.name || "",
        category: (p.categoryId && typeof p.categoryId === "object" ? p.categoryId.label : "") || p.category || "",
        categoryId: idOf(p.categoryId),
        price: Number(p.sizes?.[0]?.price ?? p.price) || 0,
        image: p.image || "",
        sizes: (p.sizes || []).map(s => ({ size: s.size || s.name, price: Number(s.price) || 0 }))
      })));
    }
    if (catRes.status === "fulfilled") {
      setCategories((catRes.value?.data?.data || [])
        .filter(c => c.type === "Category" || !c.type)
        .map(c => ({ id: String(c._id), label: c.label || c.name || "" })));
    }
    if (addonRes.status === "fulfilled") {
      const raw = addonRes.value?.data?.data;
      const list = Array.isArray(raw) ? raw : raw?.addons || [];
      setAddons(list
        .filter(a => (a.status || "Active").toLowerCase() === "active")
        .map(a => ({
          id: String(a._id || a.id),
          name: a.name || "",
          category: a.type || "Add-on",
          image: a.image || "",
          price: Number(a.prices?.[0]?.price ?? a.price) || 0,
          sizes: (a.prices || []).map(pr => ({ size: pr.size, price: Number(pr.price) || 0 }))
        })));
    }
    if (franRes.status === "fulfilled") {
      setFranchises((franRes.value?.data?.data || []).map(f => ({
        id: String(f._id || f.id),
        name: f.franchiseName || f.name || f.companyName || "Franchise"
      })));
    }
    if (storeRes.status === "fulfilled") {
      const raw = storeRes.value?.data?.data;
      const list = Array.isArray(raw) ? raw : raw?.stores || [];
      setStores(list.map(s => ({ id: String(s._id || s.id), name: s.storeName || s.name || "Store" })));
    }
  }, []);

  useEffect(() => {
    fetchCombos();
    fetchLookups();
  }, [fetchCombos, fetchLookups]);

  // Combo items flattened (comboId -> items) for table pills & detail drawer
  const comboItems = useMemo(
    () => combos.flatMap(c => c.items.map(it => ({ ...it, comboId: c._id }))),
    [combos]
  );

  // Live Stats calculations
  const now = new Date();
  const stats = {
    totalCombos: serverStats?.totalCombos ?? combos.length,
    activeCombos: serverStats?.activeCombos ?? combos.filter(c => c.status === "active").length,
    scheduledCombos: serverStats?.scheduledCombos ?? combos.filter(c => c.status === "scheduled").length,
    expiredCombos: serverStats?.expiredCombos ?? combos.filter(c => c.status === "expired" || (c.validTo && new Date(c.validTo) < now)).length,
    draftCombos: serverStats?.draftCombos ?? combos.filter(c => c.status === "draft").length,
    totalRevenue: serverStats?.totalRevenue ?? 0, // INR
    mostPurchased: serverStats?.mostPurchased || "—",
    expiringSoon: serverStats?.expiringSoon ?? 0
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

  const handleDelete = (combo) => {
    setSelectedCombo(combo);
    setIsDeleteModalOpen(true);
  };

  const handleStatusChange = async (comboId, newStatus) => {
    const target = combos.find(c => c._id === comboId);
    try {
      await adminClient.patch(`/food/admin/combos/${comboId}/status`, { status: newStatus });
      triggerAlert(`Combo "${target ? target.name : 'Offer'}" status successfully updated to "${newStatus}"!`, "success");
      fetchCombos();
    } catch (err) {
      triggerAlert(getErrorMessage(err, "Failed to update status"), "error");
    }
  };

  // Form submit saves
  const handleCreateSave = async (payload) => {
    try {
      await adminClient.post("/food/admin/combos", payload);
      setIsAddModalOpen(false);
      triggerAlert(`Successfully ${payload.status === "draft" ? "saved draft of" : "created new combo deal"} "${payload.name}"!`, "success");
      fetchCombos();
    } catch (err) {
      triggerAlert(getErrorMessage(err, "Failed to create combo"), "error");
    }
  };

  const handleEditSave = async (comboId, payload) => {
    try {
      await adminClient.patch(`/food/admin/combos/${comboId}`, payload);
      setIsEditModalOpen(false);
      triggerAlert(`Modifications saved for "${payload.name}"!`, "success");
      fetchCombos();
    } catch (err) {
      triggerAlert(getErrorMessage(err, "Failed to save combo"), "error");
    }
  };

  const handleDeleteConfirm = async (comboId, actionType) => {
    const target = combos.find(c => c._id === comboId);
    const name = target ? target.name : "Offer";

    try {
      if (actionType === "archive") {
        await adminClient.patch(`/food/admin/combos/${comboId}/status`, { status: "archived" });
        triggerAlert(`Combo "${name}" has been archived successfully.`, "warning");
      } else {
        await adminClient.delete(`/food/admin/combos/${comboId}`);
        triggerAlert(`Combo "${name}" deleted from catalog.`, "error");
      }
      setIsDeleteModalOpen(false);
      fetchCombos();
    } catch (err) {
      triggerAlert(getErrorMessage(err, "Failed to remove combo"), "error");
    }
  };

  // Bulk operation actions
  const handleBulkAction = async (action, selectedIds) => {
    try {
      const res = await adminClient.patch("/food/admin/combos/bulk", { ids: selectedIds, action });
      const result = res?.data?.data || {};
      if (action === "delete") {
        if (result.retained > 0) {
          triggerAlert(`Deleted ${result.deleted} eligible records. ${result.retained} combos retained due to historical orders linkage.`, "warning");
        } else {
          triggerAlert(`Bulk deleted ${result.deleted} combos successfully.`, "error");
        }
      } else {
        const verb = action === "activate" ? "activated" : action === "deactivate" ? "deactivated" : "archived";
        if (result.skipped > 0) {
          triggerAlert(`Bulk ${verb} ${result.updated} combos. ${result.skipped} skipped because their validity has ended.`, "warning");
        } else {
          triggerAlert(`Bulk ${verb} ${selectedIds.length} combos!`, action === "archive" ? "warning" : "success");
        }
      }
      fetchCombos();
    } catch (err) {
      triggerAlert(getErrorMessage(err, "Bulk action failed"), "error");
    }
  };

  // CSV Exporter
  const handleDownloadCSV = (dataset) => {
    const headers = "ID,Name,Menu Section,Type,Price,MRP,DiscountType,DiscountValue,ValidFrom,ValidTo,Status,UpdatedAt\n";
    const rows = dataset.map(c =>
      `"${c._id}","${c.name}","${c.categoryLabel || ""}","${c.comboType}",${c.price},${c.originalPrice || 0},"${c.discountType}",${c.discountValue},"${c.validFrom || ""}","${c.validTo || ""}","${c.status}","${c.updatedAt || ""}"`
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

  const triggerRefresh = async () => {
    await Promise.all([fetchCombos(), fetchLookups()]);
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
            <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} />
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
        products={products}
        franchises={franchises}
        stores={stores}
        onView={handleView}
        onEdit={handleEdit}
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
          products={products}
          franchises={franchises}
          stores={stores}
        />
      )}

      {/* Create Combo modal */}
      {isAddModalOpen && (
        <CreateComboModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSave={handleCreateSave}
          products={products}
          addons={addons}
          categories={categories}
          franchises={franchises}
          stores={stores}
        />
      )}

      {/* Edit Combo Modal */}
      {isEditModalOpen && selectedCombo && (
        <EditComboModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          combo={selectedCombo}
          onSave={(payload) => handleEditSave(selectedCombo._id, payload)}
          products={products}
          addons={addons}
          categories={categories}
          franchises={franchises}
          stores={stores}
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedCombo && (
        <DeleteComboModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          combo={selectedCombo}
          hasOrders={selectedCombo.orderCount > 0}
          onConfirm={(actionType) => handleDeleteConfirm(selectedCombo._id, actionType)}
        />
      )}
    </div>
  );
}
