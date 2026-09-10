import React, { useState } from "react";
import { Sparkles, Plus, Download, RefreshCw, LayoutGrid, Layers, Boxes } from "lucide-react";
import { toast } from "sonner";

// UI Components
import AddonStatsCards from "./components/AddonStatsCards";
import AddonFilters from "./components/AddonFilters";
import AddonsTable from "./components/AddonsTable";
import AddonDrawer from "./components/AddonDrawer";
import AddAddonModal from "./components/AddAddonModal";
import EditAddonModal from "./components/EditAddonModal";
import AddonGroupModal from "./components/AddonGroupModal";
import AssignProductsModal from "./components/AssignProductsModal";
import DeleteAddonModal from "./components/DeleteAddonModal";
import BulkAddonModal from "./components/BulkAddonModal";
import AddonAnalytics from "./components/AddonAnalytics";

// Hooks
import {
  useAddons,
  useCreateAddon,
  useUpdateAddon,
  useDeleteAddon,
  useBulkAddonAction
} from "./hooks/useAddons";
import { useAddonGroups, useCreateAddonGroup } from "./hooks/useAddonGroups";
import { useAssignProductsToAddon } from "./hooks/useAssignedProducts";

export default function Addons() {
  // Query Filters State
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    type: "all",
    groupId: "all",
    inventoryItemId: "all",
    sortBy: "name",
    sortOrder: "asc"
  });

  // Table pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Modal / Overlay States
  const [activeModal, setActiveModal] = useState(null); // 'add', 'edit', 'group', 'assign', 'delete', 'bulk'
  const [selectedAddon, setSelectedAddon] = useState(null);
  const [rowSelection, setRowSelection] = useState({});
  const [selectedAddonIdForDrawer, setSelectedAddonIdForDrawer] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Queries
  const queryFilters = {
    ...filters,
    page,
    limit
  };
  const { data: addonsResponse, isLoading, refetch } = useAddons(queryFilters);
  const addonsList = addonsResponse?.addons || [];
  const totalCount = addonsResponse?.totalCount || 0;

  const { data: groupsResponse } = useAddonGroups();
  const groupsList = groupsResponse?.data || [];

  // Mutations
  const createAddonMutation = useCreateAddon();
  const updateAddonMutation = useUpdateAddon();
  const deleteAddonMutation = useDeleteAddon();
  const bulkActionMutation = useBulkAddonAction();
  const createGroupMutation = useCreateAddonGroup();
  const assignProductsMutation = useAssignProductsToAddon();

  // Selection Helper
  const selectedIds = Object.keys(rowSelection)
    .map((index) => addonsList[index]?._id)
    .filter(Boolean);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value
    }));
    setPage(1);
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
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilters({
      search: "",
      status: "all",
      type: "all",
      groupId: "all",
      inventoryItemId: "all",
      sortBy: "name",
      sortOrder: "asc"
    });
    setPage(1);
    toast.success("Add-ons filters reset successfully");
  };

  // Action Click Route
  const handleTableAction = (actionType, addon) => {
    setSelectedAddon(addon);
    if (actionType === "view") {
      setSelectedAddonIdForDrawer(addon._id);
      setIsDrawerOpen(true);
    } else if (actionType === "edit") {
      setActiveModal("edit");
    } else if (actionType === "assign") {
      setActiveModal("assign");
    } else if (actionType === "delete") {
      setActiveModal("delete");
    } else if (actionType === "toggle_status") {
      const targetStatus = addon.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      updateAddonMutation.mutate(
        { id: addon._id, data: { ...addon, status: targetStatus } },
        {
          onSuccess: () => {
            toast.success(`Add-on ${addon.name} status updated to ${targetStatus}`);
          }
        }
      );
    }
  };

  // Submit Handlers
  const handleAddSubmit = (formData) => {
    createAddonMutation.mutate(formData, {
      onSuccess: () => {
        setActiveModal(null);
      }
    });
  };

  const handleEditSubmit = (id, formData) => {
    updateAddonMutation.mutate(
      { id, data: formData },
      {
        onSuccess: () => {
          setActiveModal(null);
          setSelectedAddon(null);
        }
      }
    );
  };

  const handleDeleteConfirm = (id) => {
    deleteAddonMutation.mutate(id, {
      onSuccess: () => {
        setActiveModal(null);
        setSelectedAddon(null);
        setRowSelection({});
      }
    });
  };

  const handleCreateGroupSubmit = (groupData) => {
    createGroupMutation.mutate(groupData, {
      onSuccess: () => {
        setActiveModal(null);
      }
    });
  };

  const handleAssignProductsSubmit = (addonId, productIds) => {
    assignProductsMutation.mutate(
      { addonId, productIds },
      {
        onSuccess: () => {
          setActiveModal(null);
          setSelectedAddon(null);
        }
      }
    );
  };

  const handleBulkSubmit = (ids, action, payload) => {
    bulkActionMutation.mutate(
      { ids, action, payload },
      {
        onSuccess: () => {
          setActiveModal(null);
          setRowSelection({});
        }
      }
    );
  };

  const handleExportCSV = () => {
    if (addonsList.length === 0) {
      toast.error("No add-ons available to export");
      return;
    }
    const headers = "Addon ID,Name,Type,Price,Inventory ID,Status,Created Date\n";
    const rows = addonsList
      .map(
        (a) =>
          `"${a._id}","${a.name}","${a.type}",${a.price},"${a.inventoryItemId || "None"}","${a.status}","${a.createdAt}"`
      )
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `pizza_franchise_addons_${Date.now()}.csv`);
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
            <Sparkles className="text-[var(--primary)] shrink-0" size={24} />
            <span>Add-ons</span>
          </h1>
          <p className="text-[10px] text-zinc-400 font-bold mt-0.5">
            Configure pizza customization extras, toppings, cheeses, crust choices, and link inventory tracks.
          </p>
        </div>

        {/* Sync Status Info */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          {isLoading && (
            <span className="flex items-center gap-1 text-[10px] text-[var(--primary)] font-bold animate-pulse">
              <RefreshCw className="animate-spin" size={10} />
              Syncing add-ons database...
            </span>
          )}
          <button
            onClick={() => refetch()}
            className="p-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-400 hover:text-zinc-650 rounded-xl transition-all cursor-pointer"
            title="Manual sync"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </header>

      {/* Dashboard Overview Cards */}
      <AddonStatsCards addonsList={addonsList} groupsList={groupsList} isLoading={isLoading} />

      {/* Filters & Actions Control Bar */}
      <AddonFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        addonGroups={groupsList}
        onReset={handleResetFilters}
        onAddClick={() => setActiveModal("add")}
        onCreateGroupClick={() => setActiveModal("group")}
        onExportClick={handleExportCSV}
        onBulkClick={() => setActiveModal("bulk")}
        selectedCount={selectedIds.length}
      />

      {/* Main Table */}
      <AddonsTable
        data={addonsList}
        isLoading={isLoading}
        sorting={filters.sortBy}
        onSortingChange={handleSortChange}
        page={page}
        limit={limit}
        totalCount={totalCount}
        onPageChange={setPage}
        onLimitChange={setLimit}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        onAction={handleTableAction}
      />

      {/* Lower Analytics Section */}
      <AddonAnalytics addonsList={addonsList} isLoading={isLoading} />

      {/* ==================================================== */}
      {/* MODALS & DRAWERS DEFINITIONS                         */}
      {/* ==================================================== */}

      {/* View Add-on drawer specs */}
      <AddonDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedAddonIdForDrawer(null);
        }}
        addonId={selectedAddonIdForDrawer}
      />

      {/* Add Add-on Form Modal */}
      <AddAddonModal
        isOpen={activeModal === "add"}
        onClose={() => setActiveModal(null)}
        onSubmit={handleAddSubmit}
      />

      {/* Edit Add-on Form Modal */}
      <EditAddonModal
        isOpen={activeModal === "edit"}
        onClose={() => {
          setActiveModal(null);
          setSelectedAddon(null);
        }}
        onSubmit={handleEditSubmit}
        addon={selectedAddon}
      />

      {/* Create Addon Group Modal */}
      <AddonGroupModal
        isOpen={activeModal === "group"}
        onClose={() => setActiveModal(null)}
        onSubmit={handleCreateGroupSubmit}
      />

      {/* Assign Addon to Products Modal */}
      <AssignProductsModal
        isOpen={activeModal === "assign"}
        onClose={() => {
          setActiveModal(null);
          setSelectedAddon(null);
        }}
        onSubmit={handleAssignProductsSubmit}
        addon={selectedAddon}
      />

      {/* Delete Add-on warning dialog */}
      <DeleteAddonModal
        isOpen={activeModal === "delete"}
        onClose={() => {
          setActiveModal(null);
          setSelectedAddon(null);
        }}
        onConfirm={handleDeleteConfirm}
        addon={selectedAddon}
      />

      {/* Bulk Action modal options */}
      <BulkAddonModal
        isOpen={activeModal === "bulk"}
        onClose={() => setActiveModal(null)}
        selectedCount={selectedIds.length}
        selectedIds={selectedIds}
        onBulkSubmit={handleBulkSubmit}
      />

    </div>
  );
}
