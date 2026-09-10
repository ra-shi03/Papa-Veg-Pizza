import React from "react";
import { X, Trash2, AlertTriangle, ShieldAlert } from "lucide-react";

export default function DeleteComboModal({
  isOpen,
  onClose,
  combo,
  hasOrders = false,
  onConfirm
}) {
  if (!isOpen || !combo) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70]" onClick={onClose} />

      {/* Dialog container */}
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:left-1/2 md:-translate-x-1/2 max-w-sm w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-5 z-[80] space-y-4 animate-in fade-in zoom-in-95 text-zinc-900 dark:text-zinc-100 select-none">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-zinc-150 dark:border-zinc-850">
          <div className="flex items-center gap-1.5 text-red-500">
            {hasOrders ? (
              <ShieldAlert size={16} className="stroke-[2.5]" />
            ) : (
              <Trash2 size={16} className="stroke-[2.5]" />
            )}
            <h4 className="font-black text-sm">
              {hasOrders ? "Deletion Restricted" : "Confirm Delete Request"}
            </h4>
          </div>
          <button onClick={onClose} className="p-0.5 hover:bg-zinc-150 dark:hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer">
            <X size={15} />
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-3 text-xs leading-relaxed font-semibold">
          
          {hasOrders ? (
            /* Warning if referencing orders */
            <div className="space-y-3">
              <div className="p-3 border border-amber-200 dark:border-amber-950/20 bg-amber-500/5 text-amber-800 dark:text-amber-400 rounded-xl flex items-start gap-2.5">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <p className="text-[11px] leading-normal font-semibold">
                  This combo has been purchased in historical customer orders. Deleting it will corrupt invoice records and transaction history.
                </p>
              </div>

              <p className="text-zinc-500 dark:text-zinc-400">
                You cannot permanently delete <span className="font-bold text-zinc-900 dark:text-zinc-100">"{combo.name}"</span>. Consider changing its status to <span className="font-bold text-zinc-850 dark:text-zinc-200">Archived</span> instead, which hides the package from the customer app while preserving order integrity.
              </p>
            </div>
          ) : (
            /* Normal deletion warning */
            <div className="space-y-2">
              <p className="text-zinc-500 dark:text-zinc-400">
                Are you sure you want to permanently delete combo deal <span className="font-bold text-zinc-900 dark:text-zinc-100">"{combo.name}"</span>?
              </p>
              <p className="text-[10px] text-red-500 leading-normal font-bold">
                ⚠️ Warning: This action is destructive and will remove the combo definition and all item relationships from the database immediately.
              </p>
            </div>
          )}

        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-zinc-150 dark:border-zinc-855 text-xs font-bold">
          
          {hasOrders ? (
            /* Restriction Actions: Cancel vs Archive */
            <>
              <button
                onClick={onClose}
                className="py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                Go Back
              </button>
              <button
                onClick={() => onConfirm("archive")}
                className="py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg shadow-md cursor-pointer"
              >
                Archive instead
              </button>
            </>
          ) : (
            /* Normal Deletion Actions: Cancel, Archive, Delete */
            <div className="col-span-2 grid grid-cols-3 gap-2">
              <button
                onClick={onClose}
                className="py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-850 cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                onClick={() => onConfirm("archive")}
                className="py-1.5 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 rounded-lg text-zinc-650 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer text-center"
              >
                Archive
              </button>
              <button
                onClick={() => onConfirm("delete")}
                className="py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg shadow-md cursor-pointer text-center"
              >
                Delete
              </button>
            </div>
          )}

        </div>

      </div>
    </>
  );
}
