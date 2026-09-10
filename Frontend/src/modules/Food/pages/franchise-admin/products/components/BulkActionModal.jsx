import React, { useState } from "react";
import { X, Layers, AlertTriangle, ShieldCheck, Check, Trash2 } from "lucide-react";
import { mockCategories } from "../mockProducts";
import { useStores } from "@food/pages/franchise-admin/orders/ordersQuery";
import { toast } from "sonner";

export default function BulkActionModal({ isOpen, onClose, selectedCount, selectedIds, onBulkSubmit }) {
  const [action, setAction] = useState("CHANGE_CATEGORY");
  const [categoryId, setCategoryId] = useState("");
  const { data: storesList } = useStores();

  // Store checklist overrides state for ASSIGN_STORES bulk action
  const [storesAvailability, setStoresAvailability] = useState(
    storesList?.map((s) => ({ storeId: s.storeId, available: true, overridePrice: "" })) || []
  );

  if (!isOpen) return null;

  const handleStoreCheckboxChange = (storeId, field, value) => {
    setStoresAvailability((prev) =>
      prev.map((sa) => (sa.storeId === storeId ? { ...sa, [field]: value } : sa))
    );
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();

    let payload = {};
    if (action === "CHANGE_CATEGORY") {
      if (!categoryId) {
        toast.error("Please select a target category");
        return;
      }
      payload = { categoryId };
    } else if (action === "ASSIGN_STORES") {
      payload = { stores: storesAvailability };
    }

    onBulkSubmit(selectedIds, action, payload);
  };

  return (
    <div className="fixed inset-0 z-40 overflow-hidden text-xs">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/45 backdrop-blur-xs z-40 animate-fade-in" onClick={onClose} />

      {/* Modal */}
      <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-up font-semibold text-zinc-750 dark:text-zinc-350">
          
          {/* Header */}
          <header className="p-3.5 border-b border-zinc-150 dark:border-zinc-850 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/30">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-[var(--primary)] text-white rounded-lg"><Layers size={13} /></span>
              <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white">
                Bulk Action Registry ({selectedCount} Selected)
              </h3>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400">
              <X size={14} />
            </button>
          </header>

          <form onSubmit={handleFormSubmit} className="p-4 space-y-4 max-h-[75vh] overflow-y-auto scrollbar-thin">
            
            <div className="space-y-1">
              <label className="block text-zinc-500 font-bold">Select Bulk Operation</label>
              <select
                value={action}
                onChange={(e) => setAction(e.target.value)}
                className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[var(--primary)] text-zinc-800 dark:text-zinc-250 cursor-pointer"
              >
                <option value="CHANGE_CATEGORY">Move to Category</option>
                <option value="ENABLE">Enable Products (ACTIVE)</option>
                <option value="DISABLE">Disable Products (INACTIVE)</option>
                <option value="ASSIGN_STORES">Assign Store Overrides & Status</option>
                <option value="DELETE">Delete Selected Products</option>
              </select>
            </div>

            {/* Sub fields based on selected bulk action */}
            {action === "CHANGE_CATEGORY" && (
              <div className="space-y-1 animate-fade-down">
                <label className="block text-zinc-500 font-bold">Target Category *</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[var(--primary)] text-zinc-800 dark:text-zinc-250 cursor-pointer"
                >
                  <option value="">Choose category...</option>
                  {mockCategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            {action === "ASSIGN_STORES" && (
              <div className="space-y-3 animate-fade-down">
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Define Price/Status Overrides</p>
                
                <div className="space-y-2">
                  {storesAvailability.map((sa, idx) => {
                    const store = storesList?.find((s) => s.storeId === sa.storeId);
                    if (!store) return null;
                    return (
                      <div key={sa.storeId} className="p-3 border border-zinc-200 dark:border-zinc-800 bg-zinc-50/10 rounded-xl flex items-center justify-between gap-4">
                        <span className="font-bold text-zinc-900 dark:text-zinc-250 truncate">
                          {store.storeName.replace("Papa Veg Pizza - ", "")}
                        </span>
                        
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                            <span className="text-[9px] text-zinc-400">Available</span>
                            <input
                              type="checkbox"
                              checked={sa.available}
                              onChange={(e) => handleStoreCheckboxChange(sa.storeId, "available", e.target.checked)}
                              className="rounded border-zinc-300 dark:border-zinc-700 bg-zinc-50 w-3.5 h-3.5 text-[var(--primary)] focus:ring-[var(--primary)]"
                            />
                          </label>

                          <div className="flex items-center gap-1">
                            <span className="text-zinc-400 font-bold">₹</span>
                            <input
                              type="number"
                              disabled={!sa.available}
                              value={sa.overridePrice}
                              onChange={(e) => handleStoreCheckboxChange(sa.storeId, "overridePrice", e.target.value)}
                              className="w-16 px-1.5 py-1 text-center bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-lg text-[10px] font-black text-zinc-905 disabled:opacity-50"
                              placeholder="Default"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {action === "DELETE" && (
              <div className="p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/35 rounded-xl text-red-750 dark:text-red-400 flex items-start gap-2.5 shadow-sm animate-pulse">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-extrabold text-[11px]">Warning: Bulk Deletion is Permanent!</p>
                  <p className="text-[9.5px] leading-normal font-medium opacity-90">
                    Deleting these {selectedCount} products will completely clear all associated store custom overrides and size variants. This action cannot be reversed.
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
                <span>{action === "DELETE" ? "Bulk Delete" : "Apply Bulk Action"}</span>
              </button>
            </div>

          </form>

        </div>
      </div>
    </div>
  );
}
