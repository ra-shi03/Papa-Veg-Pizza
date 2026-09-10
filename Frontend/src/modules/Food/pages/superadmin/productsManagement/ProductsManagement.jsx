import React, { useState } from "react";
import { Plus, Package, CheckCircle, AlertTriangle, Ban, TrendingUp, RefreshCw, X } from "lucide-react";
import StatsCards from "./StatsCards";
import ProductsData from "./ProductsData";
import ProductsDetail from "./ProductsDetail";
import AddProducts from "./AddProducts";
import CloneModal from "./CloneModal";
import ArchiveModal from "./ArchiveModal";
import DeleteModal from "./DeleteModal";

export default function ProductsManagement() {
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Modal states
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("add"); // "add", "edit", "clone"

  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Toast / Alert banner state
  const [alert, setAlert] = useState(null);

  // Statistical counters (reactive simulation)
  const [stats, setStats] = useState({
    totalProducts: 1284,
    activeProducts: 1210,
    draftProducts: 53,
    archivedProducts: 21,
    vegProducts: 1150,
    customizableProducts: 840,
    outOfStockProducts: 8,
    addedThisMonth: 74
  });

  const triggerAlert = (message, type = "success") => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 4000);
  };

  // Row operation handlers
  const handleViewProduct = (product) => {
    setSelectedProduct(product);
    setIsDetailOpen(true);
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setFormMode("edit");
    setIsFormOpen(true);
  };

  const handleCloneRequest = (product) => {
    setSelectedProduct(product);
    setIsCloneModalOpen(true);
  };

  const handleArchiveRequest = (product) => {
    setSelectedProduct(product);
    setIsArchiveModalOpen(true);
  };

  const handleDeleteRequest = (product) => {
    setSelectedProduct(product);
    setIsDeleteModalOpen(true);
  };

  // Confirmations
  const handleConfirmClone = (product, cloneOptions) => {
    // Open the Form drawer prefilled in clone mode
    setFormMode("clone");
    setIsFormOpen(true);
    triggerAlert(`Cloned specifications loaded for ${product.name}!`, "success");
  };

  const handleConfirmArchive = (product) => {
    try {
      const stored = localStorage.getItem("pvp_products");
      let list = stored ? JSON.parse(stored) : [];
      list = list.map(p => p.id === product.id ? { ...p, status: "Archived" } : p);
      localStorage.setItem("pvp_products", JSON.stringify(list));
      window.dispatchEvent(new Event("pvp_products_changed"));
    } catch (e) {}
    // Update local stats and status
    triggerAlert(`Product "${product.name}" has been successfully archived.`, "warning");
    setStats((prev) => ({
      ...prev,
      activeProducts: prev.activeProducts - 1,
      archivedProducts: prev.archivedProducts + 1
    }));
  };

  const handleConfirmDelete = (product) => {
    try {
      const stored = localStorage.getItem("pvp_products");
      let list = stored ? JSON.parse(stored) : [];
      list = list.filter(p => p.id !== product.id);
      localStorage.setItem("pvp_products", JSON.stringify(list));
      window.dispatchEvent(new Event("pvp_products_changed"));
    } catch (e) {}
    triggerAlert(`Product "${product.name}" (SKU: ${product.id}) soft-deleted successfully.`, "error");
    setStats((prev) => ({
      ...prev,
      totalProducts: prev.totalProducts - 1,
      activeProducts: product.status === "Active" ? prev.activeProducts - 1 : prev.activeProducts,
      draftProducts: product.status === "Draft" ? prev.draftProducts - 1 : prev.draftProducts,
      archivedProducts: product.status === "Archived" ? prev.archivedProducts - 1 : prev.archivedProducts
    }));
  };

  const handleSaveProduct = (formData, mode) => {
    try {
      const stored = localStorage.getItem("pvp_products");
      let list = stored ? JSON.parse(stored) : [];
      if (mode === "add" || mode === "clone") {
        const newProd = {
          ...formData,
          id: formData.id || `PP-V-${Math.floor(Math.random() * 900) + 100}`,
          lastUpdated: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          createdBy: "Admin Shubh"
        };
        list.push(newProd);
        triggerAlert(`New product "${formData.name}" added to catalog successfully!`, "success");
        setStats((prev) => ({
          ...prev,
          totalProducts: prev.totalProducts + 1,
          activeProducts: formData.status === "Active" ? prev.activeProducts + 1 : prev.activeProducts,
          draftProducts: formData.status === "Draft" ? prev.draftProducts + 1 : prev.draftProducts,
          addedThisMonth: prev.addedThisMonth + 1
        }));
      } else if (mode === "edit") {
        list = list.map(p => p.id === formData.id ? { ...p, ...formData, lastUpdated: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) } : p);
        triggerAlert(`Product configurations updated for "${formData.name}".`, "success");
      }
      localStorage.setItem("pvp_products", JSON.stringify(list));
      window.dispatchEvent(new Event("pvp_products_changed"));
    } catch (e) {}
  };

  // Bulk operation actions
  const handleBulkAction = (action, productIds) => {
    triggerAlert(`Bulk action "${action}" completed successfully on ${productIds.length} items.`, "success");
  };

  const refreshCatalog = () => {
    triggerAlert("POS catalog channels synchronized and refreshed.", "success");
  };

  return (
    <div className="p-3 md:p-4 pb-12 max-w-7xl mx-auto bg-zinc-50 dark:bg-zinc-950 min-h-screen w-full space-y-4">

      {/* Toast Alert Banner */}
      {alert && (
        <div className={`fixed top-4 right-4 z-[90] p-3 rounded-lg border shadow-xl flex items-center justify-between gap-3 text-xs font-bold animate-in fade-in slide-in-from-top-4 duration-300 ${alert.type === "success"
            ? "bg-emerald-50 dark:bg-emerald-950/90 text-emerald-800 dark:text-emerald-400 border-emerald-500/20"
            : alert.type === "warning"
              ? "bg-amber-50 dark:bg-amber-955/90 text-amber-800 dark:text-amber-450 border-amber-500/20"
              : "bg-rose-50 dark:bg-rose-955/90 text-rose-800 dark:text-rose-400 border-rose-500/20"
          }`}>
          <div className="flex items-center gap-2">
            {alert.type === "success" ? (
              <CheckCircle size={14} className="text-emerald-500" />
            ) : (
              <AlertTriangle size={14} className={alert.type === "warning" ? "text-amber-500" : "text-rose-500"} />
            )}
            <span>{alert.message}</span>
          </div>
          <button onClick={() => setAlert(null)} className="p-0.5 hover:bg-black/5 dark:hover:bg-white/10 rounded">
            <X size={12} />
          </button>
        </div>
      )}

      {/* Header and Breadcrumb Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3 pt-2 select-none">
        <div className="space-y-0.5">

          <h1 className="text-base md:text-lg font-bold text-black dark:text-white leading-tight">
            Products Catalog
          </h1>
          <p className="text-[10px] font-semibold text-zinc-550 dark:text-zinc-400">
            Manage stores, size variants, custom toppings, pricing strategy, and publish status.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            onClick={refreshCatalog}
            className="p-2 border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg text-zinc-550 dark:text-zinc-400 transition-colors shadow-sm"
            title="Refresh Catalog"
          >
            <RefreshCw size={12} />
          </button>

          <button
            onClick={() => {
              setSelectedProduct(null);
              setFormMode("add");
              setIsFormOpen(true);
            }}
            className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white px-3.5 py-1.5 rounded-lg flex items-center justify-center gap-1.5 shadow-md hover:scale-[1.02] active:scale-95 transition-all cursor-pointer font-bold text-[11px]"
          >
            <Plus size={14} className="stroke-[3]" />
            <span>ADD PRODUCT</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <StatsCards stats={stats} />

      {/* Products Table and Filtering */}
      <ProductsData
        onViewProduct={handleViewProduct}
        onEditProduct={handleEditProduct}
        onCloneProduct={handleCloneRequest}
        onArchiveProduct={handleArchiveRequest}
        onDeleteProduct={handleDeleteRequest}
        onBulkAction={handleBulkAction}
      />

      {/* Product Details Side Drawer */}
      <ProductsDetail
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
      />

      {/* Add / Edit / Clone Multi-step Form Drawer */}
      <AddProducts
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
        mode={formMode}
        onSave={handleSaveProduct}
      />

      {/* Confirmations modals */}
      <CloneModal
        isOpen={isCloneModalOpen}
        onClose={() => {
          setIsCloneModalOpen(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
        onConfirm={handleConfirmClone}
      />

      <ArchiveModal
        isOpen={isArchiveModalOpen}
        onClose={() => {
          setIsArchiveModalOpen(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
        onConfirm={handleConfirmArchive}
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
        onConfirm={handleConfirmDelete}
      />

    </div>
  );
}
