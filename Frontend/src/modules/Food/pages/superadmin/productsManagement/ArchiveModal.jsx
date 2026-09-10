import React, { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

export default function ArchiveModal({ isOpen, onClose, product, onConfirm }) {
  const [isArchiving, setIsArchiving] = useState(false);

  if (!isOpen || !product) return null;

  const handleArchive = () => {
    setIsArchiving(true);
    setTimeout(() => {
      setIsArchiving(false);
      onConfirm?.(product);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Close button */}
        <div className="flex justify-end p-2 pb-0">
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-500"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 pb-5 text-center flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-955/20 border border-amber-250 dark:border-amber-900/35 flex items-center justify-center text-amber-500 mb-3 animate-bounce">
            <AlertTriangle size={20} />
          </div>
          
          <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100">
            Archive Product?
          </h3>
          
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
            You are about to archive <span className="font-bold text-black dark:text-white">{product.name}</span>.
          </p>

          <p className="text-[10px] text-zinc-500 dark:text-zinc-500 bg-zinc-50 dark:bg-zinc-900/50 p-2 rounded-lg border border-zinc-100 dark:border-zinc-850 mt-3 max-w-xs">
            ⚠️ <strong>Warning:</strong> Archived products cannot be ordered by customers and will be hidden from all store menus.
          </p>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-900/60 border-t border-zinc-250 dark:border-zinc-800 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={isArchiving}
            className="px-3 py-1.5 border border-zinc-300 dark:border-zinc-750 text-zinc-700 dark:text-zinc-300 font-bold text-xs rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleArchive}
            disabled={isArchiving}
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-lg shadow-md transition-all active:scale-95 disabled:opacity-70"
          >
            {isArchiving ? "Archiving..." : "Archive Product"}
          </button>
        </div>
      </div>
    </div>
  );
}
