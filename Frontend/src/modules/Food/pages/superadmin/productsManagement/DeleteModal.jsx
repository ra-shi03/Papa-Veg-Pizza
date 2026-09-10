import React, { useState, useEffect } from "react";
import { Trash2, AlertOctagon, X, Layers, ShoppingBag, ShieldAlert } from "lucide-react";

export default function DeleteModal({ isOpen, onClose, product, onConfirm }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmSku, setConfirmSku] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");

  // Reset states when modal is opened/closed
  useEffect(() => {
    if (isOpen) {
      setConfirmSku("");
      setAgreed(false);
      setError("");
    }
  }, [isOpen]);

  if (!isOpen || !product) return null;

  const handleDelete = () => {
    if (!agreed) {
      setError("Please check the agreement box before proceeding.");
      return;
    }
    if (confirmSku !== product.id) {
      setError(`SKU does not match. Please enter: ${product.id}`);
      return;
    }

    setError("");
    setIsDeleting(true);
    setTimeout(() => {
      setIsDeleting(false);
      onConfirm?.(product);
      onClose();
    }, 1000);
  };

  // Simulated dependencies based on product name/id
  const dependencies = {
    orders: 14,
    combos: ["Double Delight Combo", "Paneer Feast Meal"],
    pricingRules: ["BOGO Wednesday", "Weekend Pizza Carnival"]
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-500">
            <Trash2 size={16} />
            <h3 className="text-sm font-bold">Delete Product (Soft Delete)</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-500"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-100 dark:border-red-900/30 flex gap-2.5">
            <AlertOctagon size={20} className="text-red-500 shrink-0" />
            <div>
              <p className="text-xs font-bold text-red-700 dark:text-red-400">
                Warning: Soft-deleting will hide product from the system.
              </p>
              <p className="text-[10px] text-zinc-650 dark:text-zinc-400 mt-0.5 leading-relaxed">
                This action is reversible by admins but will disrupt storefront availability and active menus immediately.
              </p>
            </div>
          </div>

          {/* Dependencies checklist */}
          <div className="space-y-2.5">
            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">
              Active Catalog Dependencies:
            </h4>
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-zinc-100 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-900/50">
                <div className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-350">
                  <ShoppingBag size={14} className="text-zinc-400" />
                  <span>Linked Active Orders</span>
                </div>
                <span className="text-xs font-black text-red-500 bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5 rounded">
                  {dependencies.orders} orders
                </span>
              </div>
              <div className="flex items-start gap-2 p-2.5 rounded-lg border border-zinc-100 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-900/50">
                <Layers size={14} className="text-zinc-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-350">
                    Combo Meal Inclusions
                  </p>
                  <p className="text-[9px] text-zinc-500 truncate mt-0.5">
                    {dependencies.combos.join(", ")}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-2.5 rounded-lg border border-zinc-100 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-900/50">
                <ShieldAlert size={14} className="text-zinc-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-350">
                    Linked Pricing Rules & Deals
                  </p>
                  <p className="text-[9px] text-zinc-500 truncate mt-0.5">
                    {dependencies.pricingRules.join(", ")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Confirm via checkbox & SKU */}
          <div className="space-y-3 pt-2">
            <label className="flex items-start cursor-pointer select-none group">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-zinc-300 dark:border-zinc-650 text-red-500 focus:ring-red-500/20 cursor-pointer"
              />
              <span className="ml-2.5 text-xs text-zinc-650 dark:text-zinc-350 font-semibold group-hover:text-black dark:group-hover:text-white transition-colors">
                I understand this will mark the product as inactive and disrupt the dependencies listed above.
              </span>
            </label>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                Type SKU to confirm (<span className="font-mono font-bold text-red-500 select-all">{product.id}</span>)
              </label>
              <input
                type="text"
                value={confirmSku}
                onChange={(e) => setConfirmSku(e.target.value)}
                placeholder="e.g. PP-V-001"
                className="w-full h-9 px-3 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-white dark:bg-zinc-900 text-sm font-semibold outline-none transition-all placeholder-zinc-400"
              />
            </div>

            {error && (
              <p className="text-[10px] font-bold text-red-500 mt-1">
                {error}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-900/60 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-3 py-1.5 border border-zinc-300 dark:border-zinc-750 text-zinc-700 dark:text-zinc-300 font-bold text-xs rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting || !agreed || confirmSku !== product.id}
            className="px-4 py-1.5 bg-red-500 hover:bg-red-655 text-white font-bold text-xs rounded-lg shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? "Deleting..." : "Soft Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
