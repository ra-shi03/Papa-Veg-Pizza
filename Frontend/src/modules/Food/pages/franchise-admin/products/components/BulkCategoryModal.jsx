import React, { useState } from "react";
import { X, Layers, AlertTriangle, Check, Trash2 } from "lucide-react";

export default function BulkCategoryModal({ isOpen, onClose, selectedCount, selectedIds, onBulkSubmit }) {
  const [action, setAction] = useState("ENABLE");

  if (!isOpen) return null;

  const handleFormSubmit = (e) => {
    e.preventDefault();
    onBulkSubmit(selectedIds, action);
  };

  return (
    <div className="fixed inset-0 z-40 overflow-hidden text-xs">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/45 backdrop-blur-xs z-40 animate-fade-in" onClick={onClose} />

      {/* Modal */}
      <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-up font-semibold text-zinc-755 dark:text-zinc-350">
          
          {/* Header */}
          <header className="p-3.5 border-b border-zinc-150 dark:border-zinc-850 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/30">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-[var(--primary)] text-white rounded-lg"><Layers size={13} /></span>
              <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white">
                Bulk Category Operations ({selectedCount} Selected)
              </h3>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400">
              <X size={14} />
            </button>
          </header>

          <form onSubmit={handleFormSubmit} className="p-4 space-y-4">
            
            <div className="space-y-1">
              <label className="block text-zinc-500 font-bold">Select Bulk Action</label>
              <select
                value={action}
                onChange={(e) => setAction(e.target.value)}
                className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[var(--primary)] text-zinc-800 dark:text-zinc-250 cursor-pointer"
              >
                <option value="ENABLE">Enable Categories (ACTIVE)</option>
                <option value="DISABLE">Disable Categories (INACTIVE)</option>
                <option value="MARK_FEATURED">Mark as Featured</option>
                <option value="REMOVE_FEATURED">Remove from Featured</option>
                <option value="DELETE">Delete Selected Categories</option>
              </select>
            </div>

            {action === "DELETE" && (
              <div className="p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/35 rounded-xl text-red-750 dark:text-red-400 flex items-start gap-2.5 shadow-sm animate-pulse">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-extrabold text-[11px]">Warning: Permanent Deletion</p>
                  <p className="text-[9.5px] leading-normal font-medium opacity-90">
                    Deleting these {selectedCount} categories will remove them permanently and set all associated products to uncategorized.
                  </p>
                </div>
              </div>
            )}

            {action === "DISABLE" && (
              <div className="p-3.5 bg-amber-50 dark:bg-amber-955/20 border border-amber-250/20 rounded-xl text-amber-750 dark:text-amber-400 flex items-start gap-2.5 shadow-sm">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-extrabold text-[11px]">Warning: Cascade Inactivity</p>
                  <p className="text-[9.5px] leading-normal font-medium opacity-90">
                    Disabling these categories will hide all their products from mobile customer menus.
                  </p>
                </div>
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-900">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-4 py-2 text-white font-black rounded-lg shadow-md cursor-pointer flex items-center gap-1.5 ${
                  action === "DELETE" 
                    ? "bg-red-650 hover:bg-red-700" 
                    : "bg-[var(--primary)] hover:bg-[var(--primary-hover)]"
                }`}
              >
                {action === "DELETE" ? <Trash2 size={13} /> : <Check size={13} />}
                <span>{action === "DELETE" ? "Bulk Delete" : "Apply Action"}</span>
              </button>
            </div>

          </form>

        </div>
      </div>
    </div>
  );
}
