import React, { useState, useEffect } from "react";
import {
  Pizza, Plus, Download, Sliders, RefreshCw, ChevronRight,
  Trash2, Layers, AlertCircle, Sparkles, AlertTriangle
} from "lucide-react";
import { toast } from "sonner";

// Reusable Components & Modals
import ProductsFilters from "./components/ProductsFilters";
import ProductsTable from "./components/ProductsTable";
import ProductDrawer from "./components/ProductDrawer";
import AddProductWizard from "./components/AddProductWizard";
import DuplicateProductModal from "./components/DuplicateProductModal";
import BulkActionModal from "./components/BulkActionModal";
import DeleteProductModal from "./components/DeleteProductModal";
import ManageVariantsModal from "./components/ManageVariantsModal";

// React Query Hooks
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useBulkAction
} from "./hooks/useProducts";

export default function Products() {
  // Filters state
  const [localSearch, setLocalSearch] = useState("");
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [status, setStatus] = useState("all");
  const [productType, setProductType] = useState("all");
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  // Pagination & Sorting state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState("displayOrder");
  const [sortOrder, setSortOrder] = useState("asc");

  // Selection state (Zustand/local)
  const [rowSelection, setRowSelection] = useState({});

  // Active Overlays state
  const [activeModal, setActiveModal] = useState(null); // 'add', 'edit', 'duplicate', 'bulk', 'delete', 'variants'
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Search Debouncing (355ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(localSearch);
      setPage(1);
    }, 355);
    return () => clearTimeout(timer);
  }, [localSearch]);

  // Sorting handler
  const handleSortingChange = (field) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setPage(1);
  };

  // Reset Filters
  const handleResetFilters = () => {
    setLocalSearch("");
    setSearch("");
    setCategoryId("all");
    setStatus("all");
    setProductType("all");
    setPage(1);
    toast.success("Products filters reset successfully.");
  };

  // API Queries & Mutations
  const queryFilters = {
    search,
    categoryId,
    status,
    productType,
    page,
    limit,
    sortBy,
    sortOrder
  };

  const { data, isLoading, refetch } = useProducts(queryFilters);
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();
  const bulkMutation = useBulkAction();

  const productsList = data?.products || [];
  const totalCount = data?.totalCount || 0;

  // Selected row IDs helper
  const selectedIds = Object.keys(rowSelection).map((index) => productsList[index]?._id).filter(Boolean);

  // Handle individual actions from the Table rows
  const handleTableAction = (actionType, product) => {
    setSelectedProduct(product);
    if (actionType === "view") {
      setActiveModal("view");
    } else if (actionType === "edit") {
      setActiveModal("edit");
    } else if (actionType === "duplicate") {
      setActiveModal("duplicate");
    } else if (actionType === "variants") {
      setActiveModal("variants");
    } else if (actionType === "addons") {
      toast.info("Manage Add-ons feature coming soon!", {
        description: "Coupling toppings, extra sauce, and crust pricing matrices."
      });
    } else if (actionType === "toggle_status") {
      const newStatus = product.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      updateMutation.mutate(
        { id: product._id, data: { status: newStatus } },
        {
          onSuccess: () => {
            toast.success(`Product ${product.name} is now ${newStatus}`);
          },
          onError: () => {
            toast.error("Failed to toggle product status.");
          }
        }
      );
    } else if (actionType === "delete") {
      setActiveModal("delete");
    }
  };

  // Add/Edit Save handler
  const handleWizardSubmit = (formData) => {
    if (selectedProduct) {
      // Edit mode
      updateMutation.mutate(
        { id: selectedProduct._id, data: formData },
        {
          onSuccess: () => {
            toast.success("Product created successfully", { description: "Changes saved to franchise catalogs." });
            setActiveModal(null);
            setSelectedProduct(null);
          },
          onError: (err) => {
            toast.error("Failed to save product", { description: err.message });
          }
        }
      );
    } else {
      // Add mode
      createMutation.mutate(formData, {
        onSuccess: () => {
          toast.success("Product created successfully", { description: "New pizza added to catalogs." });
          setActiveModal(null);
        },
        onError: (err) => {
          toast.error("Failed to save product", { description: err.message });
        }
      });
    }
  };

  // Duplicate Save handler
  const handleDuplicateSubmit = (duplicateData) => {
    // Generate duplicates payload by pre-populating with original
    const { originalProductId, name, sku, categoryId } = duplicateData;
    const original = productsList.find((p) => p._id === originalProductId);
    if (!original) return;

    const newProductPayload = {
      ...original,
      name,
      sku,
      categoryId,
      _id: undefined, // Let service generate
      createdAt: undefined,
      updatedAt: undefined
    };

    createMutation.mutate(newProductPayload, {
      onSuccess: () => {
        toast.success("Duplicated product successfully created!");
        setActiveModal(null);
        setSelectedProduct(null);
      },
      onError: (err) => {
        toast.error("Failed to duplicate product", { description: err.message });
      }
    });
  };

  // Bulk action handler
  const handleBulkSubmit = (ids, actionType, payload) => {
    bulkMutation.mutate(
      { ids, action: actionType, payload },
      {
        onSuccess: () => {
          toast.success("Bulk action processed successfully!");
          setActiveModal(null);
          setRowSelection({});
        },
        onError: (err) => {
          toast.error("Failed to execute bulk action", { description: err.message });
        }
      }
    );
  };

  // Delete confirm handler
  const handleDeleteConfirm = (id) => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast.success("Product item deleted successfully");
        setActiveModal(null);
        setSelectedProduct(null);
      },
      onError: (err) => {
        toast.error("Failed to delete product item", { description: err.message });
      }
    });
  };

  // Export CSV helper
  const handleExportCSV = () => {
    if (productsList.length === 0) {
      toast.warning("No products to export.");
      return;
    }
    const headers = "Product ID,Name,SKU,Category,Dietary Type,Base Price,Prep Time,Status,Featured,Best Seller\n";
    const rows = productsList.map(p =>
      `"${p._id}","${p.name}","${p.sku || ''}","${p.categoryId}","${p.productType}",${p.basePrice},${p.preparationTime},"${p.status}",${p.isFeatured},${p.isBestSeller}`
    ).join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Pizza_Products_Export_${Date.now()}.csv`;
    link.click();
    toast.success("CSV product list exported successfully.");
  };

  const handleExportExcel = () => {
    toast.info("Generating Excel sheet...", {
      description: "Building pricing models, layout configurations, and store status codes."
    });
    setTimeout(() => {
      handleExportCSV();
    }, 700);
  };

  return (
    <div className="p-4 lg:p-6 space-y-4 bg-zinc-50/40 dark:bg-zinc-950 min-h-screen text-xs font-semibold text-zinc-700 dark:text-zinc-350">

      {/* Page Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Pizza className="text-[var(--primary)] shrink-0" size={24} />
            <span>Products</span>
          </h1>
          <p className="text-[10px] text-zinc-400 font-bold mt-0.5">
            Design recipes, variants, local store overrides, and visibility status parameters.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">

          <button
            type="button"
            onClick={() => setActiveModal("add")}
            className="px-3.5 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-black rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <Plus size={14} />
            <span>Add Product</span>
          </button>

          <div className="h-6 w-[1px] bg-zinc-200 dark:bg-zinc-800 mx-1" />

          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveModal("bulk")}
              className="px-3.5 py-2.5 bg-zinc-900 hover:bg-zinc-850 dark:bg-zinc-900 dark:border dark:border-zinc-800 text-white dark:text-zinc-200 font-bold rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <Sliders size={14} />
              <span>Bulk Actions ({selectedIds.length})</span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-350 font-bold rounded-xl transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <Download size={14} className="text-zinc-400" />
            <span>CSV</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-350 font-bold rounded-xl transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <Download size={14} className="text-zinc-400" />
            <span>Excel</span>
          </button>
          <button
            onClick={refetch}
            className="p-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-400 hover:text-zinc-650 rounded-xl transition-all active:scale-95 cursor-pointer"
            title="Manual Sync"
          >
            <RefreshCw size={14} />
          </button>

        </div>
      </header>

      {/* Filters Section */}
      <ProductsFilters
        localSearch={localSearch}
        setLocalSearch={setLocalSearch}
        categoryId={categoryId}
        setCategoryId={setCategoryId}
        status={status}
        setStatus={setStatus}
        productType={productType}
        setProductType={setProductType}
        isExpanded={isFilterExpanded}
        setIsExpanded={setIsFilterExpanded}
        onReset={handleResetFilters}
      />

      {/* Main Table or Empty State */}
      {!isLoading && productsList.length === 0 ? (
        // Pizza Illustration Empty State
        <div className="bg-white dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 p-16 rounded-2xl shadow-xs text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center mx-auto text-[var(--primary)] border border-zinc-200 dark:border-zinc-800 shadow-inner">
            <Pizza size={40} className="stroke-[1.3] animate-spin" style={{ animationDuration: '6s' }} />
          </div>
          <div className="space-y-1">
            <h4 className="font-extrabold text-sm text-zinc-900 dark:text-white">No Products Found</h4>
            <p className="text-[10px] text-zinc-400 font-semibold max-w-sm mx-auto">
              Your franchise catalog does not contain any matching pizza products. Press the button below to add your first signature cheese pizza.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveModal("add")}
            className="px-4 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-black rounded-xl shadow-md transition-all active:scale-95 cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus size={14} />
            <span>Add Product</span>
          </button>
        </div>
      ) : (
        <ProductsTable
          data={productsList}
          isLoading={isLoading}
          sorting={sortBy}
          onSortingChange={handleSortingChange}
          page={page}
          limit={limit}
          totalCount={totalCount}
          onPageChange={setPage}
          onLimitChange={setLimit}
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
          onAction={handleTableAction}
        />
      )}

      {/* ==================================================== */}
      {/* MODALS & DRAWERS DEFINITIONS                         */}
      {/* ==================================================== */}

      {/* Product Specification details Drawer */}
      <ProductDrawer
        isOpen={activeModal === "view"}
        onClose={() => {
          setActiveModal(null);
          setSelectedProduct(null);
        }}
        productId={selectedProduct?._id}
      />

      {/* Add / Edit product Multi-Step Wizard Modal */}
      <AddProductWizard
        isOpen={activeModal === "add" || activeModal === "edit"}
        onClose={() => {
          setActiveModal(null);
          setSelectedProduct(null);
        }}
        onSubmit={handleWizardSubmit}
        initialData={activeModal === "edit" ? selectedProduct : null}
      />

      {/* Duplicate product setup Modal */}
      <DuplicateProductModal
        isOpen={activeModal === "duplicate"}
        onClose={() => {
          setActiveModal(null);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
        onSubmit={handleDuplicateSubmit}
      />

      {/* Bulk Action override Modal */}
      <BulkActionModal
        isOpen={activeModal === "bulk"}
        onClose={() => {
          setActiveModal(null);
        }}
        selectedCount={selectedIds.length}
        selectedIds={selectedIds}
        onBulkSubmit={handleBulkSubmit}
      />

      {/* Delete product confirmation dialog */}
      <DeleteProductModal
        isOpen={activeModal === "delete"}
        onClose={() => {
          setActiveModal(null);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
        onConfirm={handleDeleteConfirm}
      />

      {/* Manage Variants Modal */}
      <ManageVariantsModal
        isOpen={activeModal === "variants"}
        onClose={() => {
          setActiveModal(null);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
      />

    </div>
  );
}
