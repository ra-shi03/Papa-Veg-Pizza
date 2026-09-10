import React, { useState } from "react";
import { Plus, FolderTree, CheckCircle, Ban, Eye, EyeOff, Folder, AlertTriangle, RefreshCw, X } from "lucide-react";
import CategoriesData from "./CategoriesData";
import CategoriesDetail from "./CategoriesDetail";
import AddCategory from "./AddCategory";
import DuplicateCategoryModal from "./DuplicateCategoryModal";
import DeleteCategoryModal from "./DeleteCategoryModal";

export default function CategoriesManagement() {
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Drawer / Modals visibility states
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("add"); // "add", "edit"

  const [isDuplicateOpen, setIsDuplicateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Toast notifications
  const [alert, setAlert] = useState(null);

  // Dynamic Categories Stats counter
  const [stats, setStats] = useState({
    totalCategories: 24,
    activeCategories: 18,
    inactiveCategories: 6,
    visibleCategories: 20,
    hiddenCategories: 4,
    parentCategories: 5,
    subCategories: 19,
    emptyCategories: 2 // Categories with no products
  });

  const triggerAlert = (message, type = "success") => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 4000);
  };

  // Row operations callbacks
  const handleViewCategory = (category) => {
    setSelectedCategory(category);
    setIsDetailOpen(true);
  };

  const handleEditCategory = (category) => {
    setSelectedCategory(category);
    setFormMode("edit");
    setIsFormOpen(true);
  };

  const handleDuplicateRequest = (category) => {
    setSelectedCategory(category);
    setIsDuplicateOpen(true);
  };

  const handleDeleteRequest = (category) => {
    setSelectedCategory(category);
    setIsDeleteOpen(true);
  };

  // Confirmation Handlers
  const handleConfirmDuplicate = (category, options) => {
    try {
      const stored = localStorage.getItem("pvp_categories");
      const list = stored ? JSON.parse(stored) : [];
      const newCat = {
        ...category,
        id: `CAT-${Math.floor(Math.random() * 900) + 100}`,
        name: `${category.name} (Copy)`,
        slug: `${category.slug}-copy`,
        lastUpdated: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      };
      list.push(newCat);
      localStorage.setItem("pvp_categories", JSON.stringify(list));
      window.dispatchEvent(new Event("pvp_categories_changed"));
    } catch (e) {}

    triggerAlert(`Category "${category.name}" replicated successfully!`, "success");
    setStats((prev) => ({
      ...prev,
      totalCategories: prev.totalCategories + 1,
      subCategories: category.parent !== "—" ? prev.subCategories + 1 : prev.subCategories,
      parentCategories: category.parent === "—" ? prev.parentCategories + 1 : prev.parentCategories
    }));
  };

  const handleConfirmDelete = (category) => {
    try {
      const stored = localStorage.getItem("pvp_categories");
      let list = stored ? JSON.parse(stored) : [];
      list = list.filter(c => c.id !== category.id);
      localStorage.setItem("pvp_categories", JSON.stringify(list));
      window.dispatchEvent(new Event("pvp_categories_changed"));
    } catch (e) {}

    triggerAlert(`Category "${category.name}" soft-deleted from catalog.`, "error");
    setStats((prev) => ({
      ...prev,
      totalCategories: prev.totalCategories - 1,
      activeCategories: category.status === "Active" ? prev.activeCategories - 1 : prev.activeCategories,
      inactiveCategories: category.status === "Inactive" ? prev.inactiveCategories - 1 : prev.inactiveCategories,
      visibleCategories: category.isVisible ? prev.visibleCategories - 1 : prev.visibleCategories,
      hiddenCategories: !category.isVisible ? prev.hiddenCategories - 1 : prev.hiddenCategories
    }));
  };

  const handleSaveCategory = (formData, mode) => {
    try {
      const stored = localStorage.getItem("pvp_categories");
      let list = stored ? JSON.parse(stored) : [];
      if (mode === "add") {
        const newCat = {
          ...formData,
          id: formData.id || `CAT-${Math.floor(Math.random() * 900) + 100}`,
          productsCount: 0,
          lastUpdated: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        };
        list.push(newCat);
        triggerAlert(`Category "${formData.name}" added successfully!`, "success");
        setStats((prev) => ({
          ...prev,
          totalCategories: prev.totalCategories + 1,
          activeCategories: formData.status === "Active" ? prev.activeCategories + 1 : prev.activeCategories,
          inactiveCategories: formData.status === "Inactive" ? prev.inactiveCategories + 1 : prev.inactiveCategories,
          visibleCategories: formData.isVisible ? prev.visibleCategories + 1 : prev.visibleCategories,
          hiddenCategories: !formData.isVisible ? prev.hiddenCategories + 1 : prev.hiddenCategories
        }));
      } else if (mode === "edit") {
        list = list.map(c => c.id === formData.id ? { ...c, ...formData, lastUpdated: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) } : c);
        triggerAlert(`Category configurations updated for "${formData.name}".`, "success");
      }
      localStorage.setItem("pvp_categories", JSON.stringify(list));
      window.dispatchEvent(new Event("pvp_categories_changed"));
    } catch (e) {}
  };

  // Bulk actions operations
  const handleBulkAction = (action, categoryIds) => {
    triggerAlert(`Bulk action "${action}" completed successfully on ${categoryIds.length} categories.`, "success");
  };

  const refreshCatalog = () => {
    triggerAlert("Catalog channel structures synchronized.", "success");
  };

  // Stats Card template structure
  const statsList = [
    { title: "Total Categories", value: stats.totalCategories, icon: FolderTree, color: "text-orange-500 bg-orange-50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900/30" },
    { title: "Active Categories", value: stats.activeCategories, icon: CheckCircle, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30" },
    { title: "Inactive Categories", value: stats.inactiveCategories, icon: Ban, color: "text-red-500 bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30" },
    { title: "Visible in App", value: stats.visibleCategories, icon: Eye, color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/30" },
    { title: "Hidden in App", value: stats.hiddenCategories, icon: EyeOff, color: "text-zinc-550 bg-zinc-50 dark:bg-zinc-900/40 border-zinc-150 dark:border-zinc-800" },
    { title: "Parent Categories", value: stats.parentCategories, icon: Folder, color: "text-blue-500 bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30" },
    { title: "Subcategories", value: stats.subCategories, icon: FolderTree, color: "text-purple-500 bg-purple-50 dark:bg-purple-950/20 border-purple-100 dark:border-purple-900/30" },
    { title: "No Products", value: stats.emptyCategories, icon: AlertTriangle, color: "text-amber-500 bg-amber-50 dark:bg-amber-955/20 border-amber-105 dark:border-amber-900/30" }
  ];

  return (
    <div className="p-3 md:p-4 pb-12 max-w-7xl mx-auto bg-zinc-50 dark:bg-zinc-950 min-h-screen w-full space-y-4">
      
      {/* Toast Alert Banner */}
      {alert && (
        <div className={`fixed top-4 right-4 z-[90] p-3 rounded-lg border shadow-xl flex items-center justify-between gap-3 text-xs font-bold animate-in fade-in slide-in-from-top-4 duration-300 ${
          alert.type === "success"
            ? "bg-emerald-50 dark:bg-emerald-950/90 text-emerald-800 dark:text-emerald-450 border-emerald-500/20"
            : "bg-rose-50 dark:bg-rose-955/90 text-rose-800 dark:text-rose-400 border-rose-500/20"
        }`}>
          <div className="flex items-center gap-2">
            {alert.type === "success" ? (
              <CheckCircle size={14} className="text-emerald-500" />
            ) : (
              <AlertTriangle size={14} className="text-rose-500" />
            )}
            <span>{alert.message}</span>
          </div>
          <button onClick={() => setAlert(null)} className="p-0.5 hover:bg-black/5 dark:hover:bg-white/10 rounded">
            <X size={12} />
          </button>
        </div>
      )}

      {/* Header and Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3 pt-2 select-none">
        <div className="space-y-0.5">
          <h1 className="text-base md:text-lg font-bold text-black dark:text-white leading-tight">
            Categories Directory
          </h1>
          <p className="text-[10px] font-semibold text-zinc-550 dark:text-zinc-400">
            Define menu levels, parent-child linkages, app priority display values, and SEO listings.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            onClick={refreshCatalog}
            className="p-2 border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg text-zinc-550 dark:text-zinc-400 transition-colors shadow-sm"
            title="Refresh Directory"
          >
            <RefreshCw size={12} />
          </button>

          <button
            onClick={() => {
              setSelectedCategory(null);
              setFormMode("add");
              setIsFormOpen(true);
            }}
            className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white px-3.5 py-1.5 rounded-lg flex items-center justify-center gap-1.5 shadow-md hover:scale-[1.02] active:scale-95 transition-all cursor-pointer font-bold text-[11px]"
          >
            <Plus size={14} className="stroke-[3]" />
            <span>ADD CATEGORY</span>
          </button>
        </div>
      </div>

      {/* 8 Statistics Cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2.5 select-none">
        {statsList.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-2.5 rounded-lg flex flex-col justify-between hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 shadow-sm"
            >
              <div className="flex items-center justify-between gap-1.5">
                <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider truncate">
                  {card.title}
                </span>
                <div className={`p-1 rounded-md border ${card.color} shrink-0`}>
                  <Icon size={12} className="stroke-[2.5]" />
                </div>
              </div>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-sm font-black text-black dark:text-white leading-none">
                  {card.value}
                </span>
              </div>
            </div>
          );
        })}
      </section>

      {/* Categories Data Table & Toolbar */}
      <CategoriesData
        onViewCategory={handleViewCategory}
        onEditCategory={handleEditCategory}
        onDuplicateCategory={handleDuplicateRequest}
        onDeleteCategory={handleDeleteRequest}
        onBulkAction={handleBulkAction}
      />

      {/* Category Details Drawer */}
      <CategoriesDetail
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedCategory(null);
        }}
        category={selectedCategory}
        onEditClick={handleEditCategory}
      />

      {/* Add / Edit Form Drawer */}
      <AddCategory
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedCategory(null);
        }}
        category={selectedCategory}
        mode={formMode}
        onSave={handleSaveCategory}
      />

      {/* Duplication Confirmation Modal */}
      <DuplicateCategoryModal
        isOpen={isDuplicateOpen}
        onClose={() => {
          setIsDuplicateOpen(false);
          setSelectedCategory(null);
        }}
        category={selectedCategory}
        onConfirm={handleConfirmDuplicate}
      />

      {/* Delete / Dependency Warning Modal */}
      <DeleteCategoryModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setSelectedCategory(null);
        }}
        category={selectedCategory}
        onConfirm={handleConfirmDelete}
      />

    </div>
  );
}
