import React from "react";
import { AlertCircle, X, Check } from "lucide-react";

export default function EnableDisableCategoryModal({ isOpen, onClose, onConfirm, categoryId, currentStatus }) {
  if (!isOpen) return null;

  const targetStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";

  const handleConfirm = () => {
    onConfirm(categoryId, targetStatus);
  };

  return (
    <div className="fixed inset-0 z-40 overflow-hidden text-xs">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/45 backdrop-blur-xs z-40 animate-fade-in" onClick={onClose} />

      {/* Modal Container */}
      <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-scale-up font-semibold text-zinc-750 dark:text-zinc-350">
          
          <header className="p-3.5 border-b border-zinc-150 dark:border-zinc-850 flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white flex items-center gap-1.5">
              <AlertCircle className="text-amber-500 shrink-0" size={16} />
              <span>Confirm Status Override</span>
            </h3>
            <button onClick={onClose} className="text-zinc-400 hover:text-zinc-650 p-1">
              <X size={14} />
            </button>
          </header>

          <div className="p-4 space-y-4">
            
            <p className="text-zinc-700 dark:text-zinc-300 font-bold leading-normal">
              Are you sure you want to {currentStatus === "ACTIVE" ? "disable" : "enable"} this category?
            </p>

            {currentStatus === "ACTIVE" && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/35 rounded-xl text-amber-750 dark:text-amber-400 text-[10px] leading-normal font-medium">
                Warning: Disabling this category will cause all associated pizza products to become unavailable on customer-facing mobile applications.
              </div>
            )}

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
                onClick={handleConfirm}
                className="px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-black rounded-lg shadow-md cursor-pointer flex items-center gap-1"
              >
                <Check size={13} />
                <span>Confirm Override</span>
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
