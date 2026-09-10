import React, { useState } from "react";
import { X, Layers, AlertTriangle, ShieldCheck, ToggleLeft, ToggleRight, FolderPlus, Trash2, Calendar, Sparkles } from "lucide-react";
import { useApplyBulkPricingAction } from "../hooks/useBulkPricing";
import { toast } from "sonner";

export default function BulkActionsModal({ isOpen, onClose, selectedCount, selectedIds }) {
  const bulkActionMutation = useApplyBulkPricingAction();
  
  const [bulkAction, setBulkAction] = useState(""); // ENABLE, DISABLE, MARK_UNAVAILABLE, ACTIVATE_PROMOTION, DELETE_RULES
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!bulkAction) return;

    if (bulkAction === "ACTIVATE_PROMOTION") {
      if (!startDate || !endDate) {
        toast.error("Please provide both start and end dates for the promotion.");
        return;
      }
      if (new Date(endDate) < new Date(startDate)) {
        toast.error("Promotion end date must be after the start date.");
        return;
      }
    }

    const payload = {
      pricingIds: selectedIds,
      action: bulkAction,
      payload: bulkAction === "ACTIVATE_PROMOTION" ? { startDate, endDate } : {}
    };

    bulkActionMutation.mutate(payload, {
      onSuccess: () => {
        toast.success("Bulk pricing rules updated successfully!");
        onClose();
        // Reset states
        setBulkAction("");
        setStartDate("");
        setEndDate("");
      },
      onError: (err) => {
        toast.error(err?.message || "Failed to update bulk pricing rules.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-45 overflow-hidden text-xs font-semibold text-zinc-700 dark:text-zinc-350">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/45 backdrop-blur-xs z-40 animate-fade-in" onClick={onClose} />

      {/* Modal Container */}
      <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-[480px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-scale-up">
          
          {/* Header */}
          <header className="p-4 border-b border-zinc-150 dark:border-zinc-850 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/30">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-primary/10 text-primary rounded-lg"><Layers size={14} /></span>
              <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white">
                Execute Bulk Rules Operations
              </h3>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400 cursor-pointer">
              <X size={15} />
            </button>
          </header>

          <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col bg-white dark:bg-zinc-950">
            {/* Body */}
            <div className="p-5 space-y-4">
              
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-150 dark:border-zinc-850 rounded-xl leading-relaxed text-zinc-650">
                <span>Targeting: </span>
                <span className="font-black text-primary text-xs">{selectedCount} store pricing overrides</span>
                <span> selected in table.</span>
              </div>

              {/* Action grid */}
              <div className="space-y-2">
                <label className="block text-zinc-500 font-bold mb-1">Select Action to Apply</label>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBulkAction("ENABLE")}
                    className={`p-3 rounded-xl border font-bold text-left flex items-center gap-2 cursor-pointer transition-all ${
                      bulkAction === "ENABLE"
                        ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500 text-emerald-700 dark:text-emerald-400"
                        : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50"
                    }`}
                  >
                    <ToggleRight size={16} className="text-emerald-500" />
                    <span>Enable Pricing</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBulkAction("DISABLE")}
                    className={`p-3 rounded-xl border font-bold text-left flex items-center gap-2 cursor-pointer transition-all ${
                      bulkAction === "DISABLE"
                        ? "bg-zinc-100 border-zinc-500 text-zinc-700 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-300"
                        : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50"
                    }`}
                  >
                    <ToggleLeft size={16} className="text-zinc-400" />
                    <span>Disable Pricing</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBulkAction("MARK_UNAVAILABLE")}
                    className={`p-3 rounded-xl border font-bold text-left flex items-center gap-2 cursor-pointer transition-all ${
                      bulkAction === "MARK_UNAVAILABLE"
                        ? "bg-rose-50 dark:bg-rose-950/20 border-rose-500 text-rose-700 dark:text-rose-400"
                        : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50"
                    }`}
                  >
                    <AlertTriangle size={16} className="text-rose-500" />
                    <span>Mark Unavailable</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBulkAction("ACTIVATE_PROMOTION")}
                    className={`p-3 rounded-xl border font-bold text-left flex items-center gap-2 cursor-pointer transition-all ${
                      bulkAction === "ACTIVATE_PROMOTION"
                        ? "bg-orange-50 dark:bg-orange-950/20 border-orange-500 text-orange-700 dark:text-orange-400"
                        : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50"
                    }`}
                  >
                    <Sparkles size={16} className="text-orange-500" />
                    <span>Promo Active</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBulkAction("DELETE_RULES")}
                    className={`p-3 rounded-xl border font-bold text-left flex items-center gap-2 cursor-pointer transition-all col-span-2 ${
                      bulkAction === "DELETE_RULES"
                        ? "bg-red-50 dark:bg-red-950/20 border-red-500 text-red-650 dark:text-red-400"
                        : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50"
                    }`}
                  >
                    <Trash2 size={16} className="text-red-500" />
                    <span>Reset Overrides (Delete Rules)</span>
                  </button>
                </div>
              </div>

              {/* Conditional Date inputs for Promo */}
              {bulkAction === "ACTIVATE_PROMOTION" && (
                <div className="space-y-2 p-3 bg-zinc-50/50 dark:bg-zinc-900/35 border border-zinc-150 dark:border-zinc-850 rounded-xl animate-fade-in font-bold text-zinc-600">
                  <p className="text-[10px] text-zinc-400 uppercase tracking-wider flex items-center gap-1"><Calendar size={11} /> Set Promotion Dates</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[8.5px] text-zinc-400">Start Date</span>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-2 py-1.5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-lg text-slate-500 text-[10px] font-semibold"
                      />
                    </div>
                    <div>
                      <span className="text-[8.5px] text-zinc-400">End Date</span>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-2 py-1.5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-lg text-slate-500 text-[10px] font-semibold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Warnings */}
              {bulkAction === "DELETE_RULES" && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/35 rounded-xl text-red-750 dark:text-red-400 font-bold flex items-start gap-2 animate-pulse">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                  <span>Warning: This resets all {selectedCount} overrides to default catalog prices. Outlets' custom rates will be deleted. This cannot be undone.</span>
                </div>
              )}

            </div>

            {/* Footer Buttons */}
            <footer className="p-4 border-t border-zinc-100 dark:border-zinc-850 flex justify-end gap-2 bg-zinc-50/30 dark:bg-zinc-900/10 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-955 rounded-xl font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!bulkAction || (bulkAction === "ACTIVATE_PROMOTION" && (!startDate || !endDate))}
                className={`px-5 py-2 text-white font-black rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer ${
                  !bulkAction || (bulkAction === "ACTIVATE_PROMOTION" && (!startDate || !endDate))
                    ? "bg-zinc-300 dark:bg-zinc-800 text-zinc-400 opacity-60 cursor-not-allowed"
                    : bulkAction === "DELETE_RULES" || bulkAction === "MARK_UNAVAILABLE"
                    ? "bg-red-650 hover:bg-red-750"
                    : "bg-primary hover:bg-primary/95"
                }`}
              >
                Apply Action
              </button>
            </footer>
          </form>

        </div>
      </div>
    </div>
  );
}
