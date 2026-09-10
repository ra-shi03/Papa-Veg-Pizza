import React from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";

export default function DeleteAddonModal({ isOpen, onClose, onConfirm, addon }) {
  if (!isOpen || !addon) return null;

  return (
    <div className="fixed inset-0 z-40 overflow-hidden text-xs font-semibold text-zinc-700 dark:text-zinc-350">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/45 backdrop-blur-xs z-40 animate-fade-in" onClick={onClose} />

      {/* Modal Container */}
      <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-[450px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-up">
          
          {/* Header */}
          <header className="p-4 border-b border-zinc-150 dark:border-zinc-850 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/30">
            <div className="flex items-center gap-2 text-red-650">
              <AlertTriangle size={16} />
              <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white">
                Delete Add-on Option?
              </h3>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400 cursor-pointer">
              <X size={15} />
            </button>
          </header>

          {/* Body Content */}
          <div className="p-5 space-y-4">
            
            {/* Warning Message */}
            <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/35 rounded-xl text-red-750 dark:text-red-400 font-bold flex items-start gap-2.5">
              <AlertTriangle size={18} className="shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Warning: Deleting this add-on option is a destructive action. This will permanently remove it from all customized menus, addon groups, and active customer items!
              </p>
            </div>

            {/* Target Details Card */}
            <div className="p-3.5 border border-zinc-150 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-900/35 rounded-2xl flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg overflow-hidden bg-zinc-100 border border-zinc-200 shrink-0">
                <img src={addon.image} alt={addon.name} className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-zinc-900 dark:text-white font-extrabold text-[12px] truncate">{addon.name}</h4>
                <p className="text-[10px] text-zinc-450 mt-0.5">{addon.type} • Price: ₹{addon.price}</p>
                <div className="flex gap-2 text-[8px] font-bold mt-1 text-zinc-400">
                  <span>Groups: {addon.groupNames?.join(", ") || "None"}</span>
                  <span>•</span>
                  <span>Assigned Products: {addon.assignedCount || 0}</span>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-zinc-400 leading-normal font-medium">
              Are you sure you want to proceed? This change cannot be undone.
            </p>
          </div>

          {/* Footer Buttons */}
          <footer className="p-4 border-t border-zinc-100 dark:border-zinc-850 flex justify-end gap-2 bg-zinc-50/30 dark:bg-zinc-900/10 shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-955 rounded-xl font-bold cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(addon._id)}
              className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl shadow-md cursor-pointer transition-all active:scale-[0.98] flex items-center gap-1.5"
            >
              <Trash2 size={13} />
              <span>Delete Add-on</span>
            </button>
          </footer>

        </div>
      </div>
    </div>
  );
}
