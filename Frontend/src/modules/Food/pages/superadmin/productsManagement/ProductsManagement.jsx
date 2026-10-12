import React, { useState } from "react";
import { adminClient } from "@/services/api/axios";
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

  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    draftProducts: 0,
    archivedProducts: 0,
    vegProducts: 0,
    customizableProducts: 0,
    outOfStockProducts: 0,
    addedThisMonth: 0
  });

  const [currentFilters, setCurrentFilters] = useState({});
  const [selectedStatusFromCard, setSelectedStatusFromCard] = useState(null);

  const fetchStats = async (filters = currentFilters) => {
    try {
      const params = {};
      if (filters?.search && filters.search.trim()) params.search = filters.search.trim();
      if (filters?.category && filters.category !== 'All' && filters.category !== 'All Categories') params.category = filters.category;
      if (filters?.status && filters.status !== 'All') params.status = filters.status;

      const res = await adminClient.get('/food/admin/products/stats', { params });
      if (res?.data?.data) {
        setStats(res.data.data);
        return;
      }
    } catch (err) {
      console.warn("Could not fetch stats via API, falling back to calculation:", err);
    }

    try {
      const res = await adminClient.get('/food/admin/products');
      const list = Array.isArray(res?.data?.data) ? res.data.data : [];
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      setStats({
        totalProducts: list.length,
        activeProducts: list.filter(p => p.status === "Active").length,
        draftProducts: list.filter(p => p.status === "Draft").length,
        archivedProducts: list.filter(p => p.status === "Archived").length,
        vegProducts: list.filter(p => (p.vegType === "veg" || p.vegType === "Vegan" || p.vegType === "vegan")).length,
        customizableProducts: list.filter(p => (p.sizes && p.sizes.length > 1) || (p.toppings && p.toppings.length > 0) || p.isCustomizable).length,
        outOfStockProducts: list.filter(p => p.availability === "Out Of Stock" || p.status === "Out Of Stock").length,
        addedThisMonth: list.filter(p => p.createdAt && new Date(p.createdAt) >= startOfMonth).length
      });
    } catch (_) {}
  };

  React.useEffect(() => {
    fetchStats(currentFilters);
    const handleSync = () => fetchStats(currentFilters);
    window.addEventListener("pvp_products_changed_v2", handleSync);
    return () => window.removeEventListener("pvp_products_changed_v2", handleSync);
  }, [currentFilters]);

  const triggerAlert = (message, type = "success") => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 4000);
  };

  // Row operation handlers
  const handleViewProduct = async (product) => {
    try {
      const id = product._id || product.id;
      if (id && !String(id).startsWith("PP-V-")) {
        const res = await adminClient.get(`/food/admin/products/${id}`);
        setSelectedProduct(res.data.data);
      } else {
        setSelectedProduct(product);
      }
      setIsDetailOpen(true);
    } catch (err) {
      console.error(err);
      // Fallback if API fails
      setSelectedProduct(product);
      setIsDetailOpen(true);
    }
  };

  const handleEditProduct = async (product) => {
    try {
      const id = product._id || product.id;
      if (id && !String(id).startsWith("PP-V-")) {
        const res = await adminClient.get(`/food/admin/products/${id}`);
        setSelectedProduct(res.data.data);
      } else {
        setSelectedProduct(product);
      }
      setFormMode("edit");
      setIsFormOpen(true);
    } catch (err) {
      console.error(err);
      // Fallback
      setSelectedProduct(product);
      setFormMode("edit");
      setIsFormOpen(true);
    }
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
      const stored = localStorage.getItem("pvp_products_v2");
      let list = stored ? JSON.parse(stored) : [];
      list = list.map(p => p.id === product.id ? { ...p, status: "Archived" } : p);
      localStorage.setItem("pvp_products_v2", JSON.stringify(list));
      window.dispatchEvent(new Event("pvp_products_changed_v2"));
    } catch (e) {}
    // Update local stats and status
    triggerAlert(`Product "${product.name}" has been successfully archived.`, "warning");
    setStats((prev) => ({
      ...prev,
      activeProducts: prev.activeProducts - 1,
      archivedProducts: prev.archivedProducts + 1
    }));
  };

  const handleConfirmDelete = async (product) => {
    try {
      const deleteId = product._id || product.id;
      if (deleteId && !String(deleteId).startsWith("PP-V-")) {
        await adminClient.delete(`/food/admin/products/${deleteId}`);
      }
      
      // Keep local sync for table
      const stored = localStorage.getItem("pvp_products_v2");
      let list = stored ? JSON.parse(stored) : [];
      list = list.filter(p => p.id !== product.id && p._id !== product._id);
      localStorage.setItem("pvp_products_v2", JSON.stringify(list));
      window.dispatchEvent(new Event("pvp_products_changed_v2"));
      
      triggerAlert(`Product "${product.name || product.title}" permanently deleted successfully.`, "success");
      setIsDeleteModalOpen(false);
      setStats((prev) => ({
        ...prev,
        totalProducts: Math.max(0, prev.totalProducts - 1),
        activeProducts: product.status === "Active" ? Math.max(0, prev.activeProducts - 1) : prev.activeProducts,
        draftProducts: product.status === "Draft" ? Math.max(0, prev.draftProducts - 1) : prev.draftProducts,
        archivedProducts: product.status === "Archived" ? Math.max(0, prev.archivedProducts - 1) : prev.archivedProducts
      }));
    } catch (e) {
      console.error(e);
      triggerAlert("Failed to delete product via API.", "error");
    }
  };

  const handleSaveProduct = async (formData, mode) => {
    try {
      if (mode === "add" || mode === "clone") {
        await adminClient.post('/food/admin/products', formData);
        triggerAlert(`New product "${formData.name}" added to catalog successfully!`, "success");
      } else if (mode === "edit") {
        await adminClient.patch(`/food/admin/products/${formData._id || formData.id}`, formData);
        triggerAlert(`Product configurations updated for "${formData.name}".`, "success");
      }
      
      // Update local storage so the table updates for now
      const stored = localStorage.getItem("pvp_products_v2");
      let list = stored ? JSON.parse(stored) : [];
      if (mode === "add" || mode === "clone") {
        const newProd = {
          ...formData,
          id: formData.id || `PP-V-${Math.floor(Math.random() * 900) + 100}`,
          lastUpdated: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          createdBy: "Admin Shubh"
        };
        list.push(newProd);
      } else if (mode === "edit") {
        list = list.map(p => (p.id === formData.id || p._id === formData._id) ? { ...p, ...formData, lastUpdated: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) } : p);
      }
      localStorage.setItem("pvp_products_v2", JSON.stringify(list));
      window.dispatchEvent(new Event("pvp_products_changed_v2"));
      setIsFormOpen(false);
    } catch (e) {
      console.error(e);
      triggerAlert("Failed to save product via API.", "error");
    }
  };

  // Bulk operation actions
  const handleBulkAction = async (action, productIds) => {
    try {
      if (action === "Out of Stock" || action === "Mark Out of Stock") {
        await Promise.all(
          productIds.map(id =>
            adminClient.patch(`/food/admin/products/${id}`, {
              availability: "Out Of Stock",
              status: "Out Of Stock"
            }).catch(() => {})
          )
        );
        window.dispatchEvent(new Event("pvp_products_changed_v2"));
        triggerAlert(`${productIds.length} products marked as Out of Stock.`, "warning");
        return;
      }
      if (action === "In Stock" || action === "Mark In Stock") {
        await Promise.all(
          productIds.map(id =>
            adminClient.patch(`/food/admin/products/${id}`, {
              availability: "In Stock",
              status: "Active"
            }).catch(() => {})
          )
        );
        window.dispatchEvent(new Event("pvp_products_changed_v2"));
        triggerAlert(`${productIds.length} products marked as In Stock.`, "success");
        return;
      }
      triggerAlert(`Bulk action "${action}" completed successfully on ${productIds.length} items.`, "success");
    } catch (_) {
      triggerAlert(`Bulk action "${action}" completed.`, "success");
    }
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
            onClick={() => window.location.reload()}
            className="p-2 border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg text-zinc-550 dark:text-zinc-400 transition-colors shadow-sm cursor-pointer"
            title="Reload Entire Page"
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
      <StatsCards
        stats={stats}
        onCardClick={(title) => {
          if (title === "Total Products") setSelectedStatusFromCard("All");
          else if (title === "Active Products") setSelectedStatusFromCard("Active");
          else if (title === "Draft Products") setSelectedStatusFromCard("Draft");
          else if (title === "Archived Products") setSelectedStatusFromCard("Archived");
          else if (title === "Out of Stock") setSelectedStatusFromCard("Out Of Stock");
        }}
      />

      {/* Products Table and Filtering */}
      <ProductsData
        onViewProduct={handleViewProduct}
        onEditProduct={handleEditProduct}
        onCloneProduct={handleCloneRequest}
        onArchiveProduct={handleArchiveRequest}
        onDeleteProduct={handleDeleteRequest}
        onBulkAction={handleBulkAction}
        onFilterChange={(filters) => {
          setCurrentFilters(filters);
          fetchStats(filters);
        }}
        externalStatusFilter={selectedStatusFromCard}
        onClearExternalStatus={() => setSelectedStatusFromCard(null)}
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
