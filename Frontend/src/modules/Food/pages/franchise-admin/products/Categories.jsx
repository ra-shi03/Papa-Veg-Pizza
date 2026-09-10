import React, { useState } from "react";
import { Grid, Plus, Download, Sliders, RefreshCw, ChevronRight, AlertCircle, Layers } from "lucide-react";
import { toast } from "sonner";

// Components
import CategoryStatsCards from "./components/CategoryStatsCards";
import CategoryFilters from "./components/CategoryFilters";
import CategoriesTable from "./components/CategoriesTable";
import CategoryDrawer from "./components/CategoryDrawer";
import AddCategoryModal from "./components/AddCategoryModal";
import EditCategoryModal from "./components/EditCategoryModal";
import DeleteCategoryModal from "./components/DeleteCategoryModal";
import EnableDisableCategoryModal from "./components/EnableDisableCategoryModal";
import BulkCategoryModal from "./components/BulkCategoryModal";
import CategoryAnalytics from "./components/CategoryAnalytics";

// Hooks
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useBulkCategoryAction
} from "./hooks/useCategories";

export default function Categories() {
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    isFeatured: "",
    parentCategory: "",
    sortBy: "displayOrder",
    sortOrder: "asc"
  });

  const [selectedIds, setSelectedIds] = useState([]);
  const [activeModal, setActiveModal] = useState(null); // 'add', 'edit', 'delete', 'toggle-status', 'bulk'
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [selectedCategoryStatus, setSelectedCategoryStatus] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Queries
  const { data: categoriesResponse, isLoading, refetch } = useCategories(filters);
  const categoriesList = categoriesResponse?.data || [];

  // Mutations
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();
  const bulkMutation = useBulkCategoryAction();

  // Extract root/parent categories for dropdowns
  const parentCategories = categoriesList.filter((c) => !c.parentCategory);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSortChange = (column) => {
    setFilters((prev) => {
      const isAsc = prev.sortBy === column && prev.sortOrder === "asc";
      return {
        ...prev,
        sortBy: column,
        sortOrder: isAsc ? "desc" : "asc"
      };
    });
  };

  const handleResetFilters = () => {
    setFilters({
      search: "",
      status: "",
      isFeatured: "",
      parentCategory: "",
      sortBy: "displayOrder",
      sortOrder: "asc"
    });
  };

  // Modal Handlers
  const handleOpenAddModal = () => {
    setActiveModal("add");
  };

  const handleOpenEditModal = (id) => {
    setSelectedCategoryId(id);
    setActiveModal("edit");
  };

  const handleOpenDeleteModal = (id) => {
    setSelectedCategoryId(id);
    setActiveModal("delete");
  };

  const handleOpenToggleStatusModal = (id, currentStatus) => {
    setSelectedCategoryId(id);
    setSelectedCategoryStatus(currentStatus);
    setActiveModal("toggle-status");
  };

  const handleOpenDrawer = (id) => {
    setSelectedCategoryId(id);
    setIsDrawerOpen(true);
  };

  const handleAddSubmit = async (data) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        setActiveModal(null);
      }
    });
  };

  const handleEditSubmit = async (id, data) => {
    updateMutation.mutate(
      { id, data },
      {
        onSuccess: () => {
          setActiveModal(null);
          setSelectedCategoryId(null);
        }
      }
    );
  };

  const handleDeleteSubmit = async (id) => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        setActiveModal(null);
        setSelectedCategoryId(null);
        // Clear selection if deleted
        setSelectedIds((prev) => prev.filter((sid) => sid !== id));
      }
    });
  };

  const handleToggleStatusSubmit = async (id, targetStatus) => {
    updateMutation.mutate(
      { id, data: { status: targetStatus } },
      {
        onSuccess: () => {
          setActiveModal(null);
          setSelectedCategoryId(null);
        }
      }
    );
  };

  const handleBulkSubmit = async (ids, action) => {
    bulkMutation.mutate(
      { ids, action },
      {
        onSuccess: () => {
          setActiveModal(null);
          setSelectedIds([]);
        }
      }
    );
  };

  // CSV/Excel Export Handler
  const handleExportCSV = () => {
    if (categoriesList.length === 0) {
      toast.error("No categories available to export");
      return;
    }
    const headers = "Category ID,Name,Slug,Description,Parent Category,Display Order,Featured,Status,Created Date\n";
    const rows = categoriesList.map((c) =>
      `"${c._id}","${c.name}","${c.slug || ""}","${c.description || ""}","${c.parentCategory || "None"}",${c.displayOrder},${c.isFeatured},"${c.status}","${c.createdAt}"`
    ).join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `pizza_franchise_categories_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV Export initialized!");
  };

  return (
    <div className="p-4 lg:p-6 space-y-4 bg-zinc-50/40 dark:bg-zinc-950 min-h-screen text-xs font-semibold text-zinc-700 dark:text-zinc-350">
      
      {/* Page Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Grid className="text-[var(--primary)] shrink-0" size={24} />
            <span>Categories</span>
          </h1>
          <p className="text-[10px] text-zinc-400 font-bold mt-0.5">
            Configure menu category architecture, parent groupings, display metrics, and visibility parameters.
          </p>
        </div>

        {/* Sync Indicator */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          {isLoading && (
            <span className="flex items-center gap-1 text-[10px] text-[var(--primary)] font-bold animate-pulse">
              <RefreshCw className="animate-spin" size={10} />
              Saving sync state...
            </span>
          )}
        </div>
      </header>

      {/* Dashboard Overview Cards */}
      <CategoryStatsCards categoriesList={categoriesList} isLoading={isLoading} />

      {/* Filter Options */}
      <CategoryFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        parentCategories={parentCategories}
        onReset={handleResetFilters}
        onAddClick={handleOpenAddModal}
        onExportClick={handleExportCSV}
        onBulkClick={() => setActiveModal("bulk")}
        selectedCount={selectedIds.length}
      />

      {/* Categories TanStack Table */}
      <CategoriesTable
        categoriesList={categoriesList}
        isLoading={isLoading}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onSortChange={handleSortChange}
        sortBy={filters.sortBy}
        sortOrder={filters.sortOrder}
        onViewClick={handleOpenDrawer}
        onEditClick={handleOpenEditModal}
        onToggleStatusClick={handleOpenToggleStatusModal}
        onDeleteClick={handleOpenDeleteModal}
        onAddClick={handleOpenAddModal}
      />

      {/* Bottom Analytics Cards */}
      <CategoryAnalytics categoriesList={categoriesList} isLoading={isLoading} />

      {/* Modals & Slide-over Drawer Wrapper */}
      
      {/* Add Modal */}
      <AddCategoryModal
        isOpen={activeModal === "add"}
        onClose={() => setActiveModal(null)}
        onSubmit={handleAddSubmit}
        parentCategories={parentCategories}
      />

      {/* Edit Modal */}
      <EditCategoryModal
        isOpen={activeModal === "edit"}
        onClose={() => {
          setActiveModal(null);
          setSelectedCategoryId(null);
        }}
        onSubmit={handleEditSubmit}
        categoryId={selectedCategoryId}
        parentCategories={parentCategories}
      />

      {/* Delete Modal */}
      <DeleteCategoryModal
        isOpen={activeModal === "delete"}
        onClose={() => {
          setActiveModal(null);
          setSelectedCategoryId(null);
        }}
        onSubmit={handleDeleteSubmit}
        categoryId={selectedCategoryId}
      />

      {/* Enable/Disable status Modal */}
      <EnableDisableCategoryModal
        isOpen={activeModal === "toggle-status"}
        onClose={() => {
          setActiveModal(null);
          setSelectedCategoryId(null);
        }}
        onConfirm={handleToggleStatusSubmit}
        categoryId={selectedCategoryId}
        currentStatus={selectedCategoryStatus}
      />

      {/* Bulk actions Modal */}
      <BulkCategoryModal
        isOpen={activeModal === "bulk"}
        onClose={() => setActiveModal(null)}
        selectedCount={selectedIds.length}
        selectedIds={selectedIds}
        onBulkSubmit={handleBulkSubmit}
      />

      {/* Right side Detail Drawer */}
      <CategoryDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedCategoryId(null);
        }}
        categoryId={selectedCategoryId}
        parentCategories={parentCategories}
      />

    </div>
  );
}
