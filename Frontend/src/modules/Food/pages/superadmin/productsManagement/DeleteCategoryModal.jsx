import React, { useState } from "react";
import { Trash2, AlertOctagon, X, AlertTriangle, CheckCircle, Package } from "lucide-react";

export default function DeleteCategoryModal({ isOpen, onClose, category, onConfirm }) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !category) return null;

  const hasLinkedProducts = (category.productsCount || 0) > 0;

  const handleDelete = () => {
    if (hasLinkedProducts) return;

    setIsDeleting(true);
    setTimeout(() => {
      setIsDeleting(false);
      onConfirm?.(category);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-4 py-3 border-b border-zinc-205 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-500">
            <Trash2 size={16} />
            <h3 className="text-sm font-bold">Delete Category</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-500"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          
          {hasLinkedProducts ? (
            /* BLOCKED STATE: Category has linked products */
            <div className="space-y-4">
              <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-100 dark:border-red-900/30 flex gap-2.5">
                <AlertOctagon size={20} className="text-red-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-red-700 dark:text-red-400">
                    Deletion Blocked: Active Dependencies Detected
                  </h4>
                  <p className="text-[10px] text-zinc-650 dark:text-zinc-450 mt-1 leading-relaxed">
                    This category is currently linked to existing products and cannot be deleted until all related products are reassigned or removed.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-zinc-150 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-350">
                  <Package size={14} className="text-zinc-450" />
                  <span>Linked Active Products</span>
                </div>
                <span className="text-xs font-black text-red-500 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded">
                  {category.productsCount} products
                </span>
              </div>

              <p className="text-[10px] text-zinc-500 text-center italic">
                Please visit the Products Catalog to reassign these items before deleting the category.
              </p>
            </div>
          ) : (
            /* ALLOWED STATE: Category is clean */
            <div className="space-y-3">
              <div className="p-3 bg-amber-50 dark:bg-amber-955/10 rounded-lg border border-amber-100 dark:border-amber-900/30 flex gap-2.5">
                <AlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-800 dark:text-amber-400">
                    Confirm Soft Deletion
                  </h4>
                  <p className="text-[10px] text-zinc-650 dark:text-zinc-450 mt-1 leading-relaxed">
                    Are you sure you want to delete <span className="font-bold text-black dark:text-white">{category.name}</span>? This category will be marked as inactive and soft-deleted from the menu panel.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-emerald-100 dark:border-emerald-950/20 bg-emerald-50/20 dark:bg-emerald-950/10 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  <CheckCircle size={14} />
                  <span>No products linked</span>
                </div>
                <span className="text-[9px] font-bold text-emerald-650 dark:text-emerald-400 bg-emerald-100/50 dark:bg-emerald-900/20 px-2 py-0.5 rounded uppercase">
                  Safe to Delete
                </span>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-900/60 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2.5">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-3 py-1.5 border border-zinc-300 dark:border-zinc-750 text-zinc-700 dark:text-zinc-300 font-bold text-xs rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors bg-white dark:bg-zinc-950"
          >
            {hasLinkedProducts ? "Close" : "Cancel"}
          </button>
          {!hasLinkedProducts && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-4 py-1.5 bg-red-500 hover:bg-red-600 text-white font-bold text-xs rounded-lg shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              {isDeleting ? "Deleting..." : "Delete Category"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
