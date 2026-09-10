import React, { useState } from "react";
import { Trash2, AlertOctagon, X, AlertTriangle, CheckCircle } from "lucide-react";

export default function DeletePricingModal({ isOpen, onClose, rule, onConfirm }) {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !rule) return null;

  // Mock check if the rule has been used in historical orders (Simulated reference check)
  // Let's assume rules with active status or specific ID references have order references
  const hasHistoricalReferences = rule.id === "PR-001" || rule.id === "PR-003" || rule.effectivePrice < 350;

  const handleAction = (action) => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onConfirm?.(rule, action); // "delete" or "archive"
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-zinc-900 dark:text-zinc-100 select-none">
        
        {/* Header */}
        <div className="px-4 py-3 border-b border-zinc-205 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-500">
            <Trash2 size={16} />
            <h3 className="text-sm font-bold">Remove Pricing Override Rule</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-500"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 text-xs font-semibold">
          {hasHistoricalReferences ? (
            /* Warning State: Pricing rule has order history */
            <div className="space-y-4">
              <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-100 dark:border-red-900/30 flex gap-2.5">
                <AlertOctagon size={20} className="text-red-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-red-700 dark:text-red-400">
                    Historical References Detected
                  </h4>
                  <p className="text-[10px] text-zinc-650 dark:text-zinc-450 mt-1 leading-relaxed">
                    This pricing rule has historical references in past customer checkouts and orders. It is highly recommended to **Archive** the rule instead of permanently deleting it to preserve billing audit logs.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-zinc-150 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between">
                <span>Associated Products</span>
                <span className="font-bold text-zinc-700 dark:text-zinc-300">
                  {rule.productName} ({rule.variant})
                </span>
              </div>
            </div>
          ) : (
            /* Allowed State: Clean pricing rule */
            <div className="space-y-3">
              <div className="p-3 bg-amber-50 dark:bg-amber-955/10 rounded-lg border border-amber-100 dark:border-amber-900/30 flex gap-2.5">
                <AlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-amber-800 dark:text-amber-400">
                    Confirm Deletion
                  </h4>
                  <p className="text-[10px] text-zinc-650 dark:text-zinc-450 mt-1 leading-relaxed">
                    Are you sure you want to permanently delete the pricing override rule for <span className="font-bold text-black dark:text-white">{rule.productName} ({rule.variant})</span>? This action is irreversible.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-emerald-100 dark:border-emerald-950/20 bg-emerald-50/25 dark:bg-emerald-950/10 flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-705 dark:text-emerald-400">
                  <CheckCircle size={14} />
                  <span>No active dependencies</span>
                </div>
                <span className="text-[9px] font-bold text-emerald-650 dark:text-emerald-450 bg-emerald-100/50 dark:bg-emerald-900/20 px-2 py-0.5 rounded uppercase">
                  Clean Reference
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-900/60 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-3 py-1.5 border border-zinc-350 dark:border-zinc-750 text-zinc-750 dark:text-zinc-350 font-bold text-xs rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors bg-white dark:bg-zinc-950"
          >
            Cancel
          </button>
          
          {hasHistoricalReferences ? (
            <>
              <button
                onClick={() => handleAction("archive")}
                disabled={isProcessing}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                {isProcessing ? "Processing..." : "Archive Rule (Recommended)"}
              </button>
              <button
                onClick={() => handleAction("delete")}
                disabled={isProcessing}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all active:scale-95 disabled:opacity-50"
              >
                Force Delete
              </button>
            </>
          ) : (
            <button
              onClick={() => handleAction("delete")}
              disabled={isProcessing}
              className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              {isProcessing ? "Deleting..." : "Delete Override"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
