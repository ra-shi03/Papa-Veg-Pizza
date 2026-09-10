import React from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { useCategoryDetails } from "../hooks/useCategoryDetails";

export default function DeleteCategoryModal({ isOpen, onClose, onSubmit, categoryId }) {
  const { data: response, isLoading } = useCategoryDetails(categoryId);
  const category = response?.data;

  if (!isOpen) return null;

  const handleConfirmDelete = () => {
    onSubmit(categoryId);
  };

  return (
    <div className="fixed inset-0 z-40 overflow-hidden text-xs">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/45 backdrop-blur-xs z-40 animate-fade-in" onClick={onClose} />

      {/* Modal Container */}
      <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-scale-up font-semibold text-zinc-750 dark:text-zinc-350">
          
          <header className="p-3.5 border-b border-zinc-150 dark:border-zinc-850 flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white flex items-center gap-1.5">
              <AlertTriangle className="text-red-650 shrink-0 animate-pulse" size={16} />
              <span>Delete Category?</span>
            </h3>
            <button onClick={onClose} className="text-zinc-400 hover:text-zinc-650 p-1">
              <X size={14} />
            </button>
          </header>

          {isLoading ? (
            <div className="p-8 text-center">
              <div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="font-bold text-zinc-400">Loading details...</p>
            </div>
          ) : category ? (
            <div className="p-4 space-y-4">
              
              {/* Alert message box */}
              <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/35 rounded-xl text-red-750 dark:text-red-400 leading-normal">
                Deleting this category will affect all associated subcategories and pizza products configured under it. This action is irreversible.
              </div>

              {/* Category details preview */}
              <div className="p-3 border border-zinc-150 dark:border-zinc-850 bg-zinc-50/20 rounded-xl flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-zinc-100 border border-zinc-200 dark:border-zinc-800 flex-shrink-0">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=80&q=80";
                    }}
                  />
                </div>
                
                <div className="flex-1 min-w-0 space-y-0.5">
                  <p className="font-black text-zinc-900 dark:text-white truncate">{category.name}</p>
                  <p className="text-[9.5px] text-zinc-400 font-bold uppercase tracking-wider font-mono">
                    /{category.slug}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-black text-zinc-900 dark:text-zinc-200">{category.stats?.productsCount || 0} products</p>
                  <p className="text-[8.5px] text-zinc-450 font-bold uppercase">Impacted</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-900">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 bg-red-650 hover:bg-red-700 text-white font-black rounded-lg shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 size={13} />
                  <span>Delete Category</span>
                </button>
              </div>

            </div>
          ) : (
            <div className="p-8 text-center text-zinc-450">Unable to load details.</div>
          )}

        </div>
      </div>
    </div>
  );
}
