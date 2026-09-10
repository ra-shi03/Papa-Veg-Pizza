import React from "react";
import { X, AlertTriangle } from "lucide-react";

export default function DeleteProductModal({ isOpen, onClose, product, onConfirm }) {
  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-40 overflow-hidden text-xs">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/45 backdrop-blur-xs z-40 animate-fade-in" onClick={onClose} />

      {/* Modal */}
      <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-up font-semibold text-zinc-750 dark:text-zinc-350">
          
          {/* Header */}
          <header className="p-3.5 border-b border-zinc-150 dark:border-zinc-850 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/30">
            <h4 className="font-extrabold text-sm text-zinc-900 dark:text-white flex items-center gap-1.5">
              <AlertTriangle size={15} className="text-red-500" />
              <span>Delete Product?</span>
            </h4>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400">
              <X size={14} />
            </button>
          </header>

          <div className="p-4 space-y-4">
            
            <p className="text-zinc-600 dark:text-zinc-350 leading-relaxed font-bold">
              Are you sure you want to delete <span className="text-zinc-900 dark:text-white font-black">"{product.name}"</span>?
            </p>

            <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/35 rounded-xl text-red-700 dark:text-red-400 text-[10px] leading-normal font-bold">
              ⚠️ Deleting this product will cascade delete its variants, images, and any custom pricing settings established across franchise stores.
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => onConfirm(product._id)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-black rounded-lg shadow-md cursor-pointer"
              >
                Delete Product
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
