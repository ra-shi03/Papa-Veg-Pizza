import React, { useState, useEffect } from "react";
import { AlertTriangle, Trash2, Archive, X, CheckSquare, Square } from "lucide-react";

export default function DeleteAddonModal({ isOpen, onClose, addon, mappings = [], onConfirm }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [hasReferences, setHasReferences] = useState(false);
  const [refCount, setRefCount] = useState({ products: 0, carts: 0, orders: 0 });

  useEffect(() => {
    if (isOpen && addon) {
      setAgreed(false);
      setIsProcessing(false);
      
      // Calculate how many products are linked
      const linkedProductsCount = mappings.filter(m => m.addonId === addon._id).length;
      
      // Simulate check for carts and historical orders (e.g. random or name-based simulation)
      // High references for classic toppings like Extra Cheese, low/none for rare items
      const isPopular = ["Extra Cheese", "Paneer Tikka", "Onion Crunch", "Mozzarella"].some(name => 
        addon.name.toLowerCase().includes(name.toLowerCase())
      );
      
      const cartsCount = isPopular ? 14 : 0;
      const ordersCount = isPopular ? 152 : 0;
      const hasRefs = linkedProductsCount > 0 || cartsCount > 0 || ordersCount > 0;
      
      setRefCount({
        products: linkedProductsCount,
        carts: cartsCount,
        orders: ordersCount
      });
      setHasReferences(hasRefs);
    }
  }, [isOpen, addon, mappings]);

  if (!isOpen || !addon) return null;

  const handleDelete = () => {
    if (hasReferences && !agreed) {
      alert("Please check the acknowledgement before attempting deletion.");
      return;
    }
    
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onConfirm?.(addon._id, "delete");
      onClose();
    }, 800);
  };

  const handleArchive = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onConfirm?.(addon._id, "archive");
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2 text-red-500">
            <Trash2 size={16} />
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Confirm Action: Deleting Add-on
            </h3>
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
          
          {hasReferences ? (
            /* Warning state: item is linked */
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-900/30 flex gap-2.5">
                <AlertTriangle size={20} className="text-amber-500 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
                    Linked References Found
                  </p>
                  <p className="text-[10px] text-zinc-600 dark:text-zinc-400 mt-0.5 leading-relaxed">
                    This add-on is currently referenced and should be <strong>archived</strong> instead of permanently deleted to preserve system consistency.
                  </p>
                </div>
              </div>

              {/* Linked stats details */}
              <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-150 dark:border-zinc-850 rounded-lg p-3 space-y-2 text-xs font-semibold">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">
                  Reference Connections Checklist:
                </p>
                <div className="flex justify-between items-center text-zinc-700 dark:text-zinc-300">
                  <span>Linked Active Products</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${refCount.products > 0 ? "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400" : "bg-zinc-200 dark:bg-zinc-800"}`}>
                    {refCount.products} Products
                  </span>
                </div>
                <div className="flex justify-between items-center text-zinc-700 dark:text-zinc-300">
                  <span>Present in Customer Carts</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${refCount.carts > 0 ? "bg-amber-100 text-amber-750 dark:bg-amber-950/30 dark:text-amber-400" : "bg-zinc-200 dark:bg-zinc-800"}`}>
                    {refCount.carts} Active Carts
                  </span>
                </div>
                <div className="flex justify-between items-center text-zinc-700 dark:text-zinc-300">
                  <span>Linked to Historical Orders</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${refCount.orders > 0 ? "bg-amber-100 text-amber-750 dark:bg-amber-950/30 dark:text-amber-400" : "bg-zinc-200 dark:bg-zinc-800"}`}>
                    {refCount.orders} Orders
                  </span>
                </div>
              </div>

              {/* Force deletion acknowledge */}
              <label className="flex items-start cursor-pointer select-none group text-zinc-650 dark:text-zinc-300">
                <button
                  type="button"
                  onClick={() => setAgreed(!agreed)}
                  className="mt-0.5 shrink-0 text-zinc-400 hover:text-[var(--primary)] transition-colors"
                >
                  {agreed ? (
                    <CheckSquare size={16} className="text-[var(--primary)]" fill="var(--primary)" color="white" />
                  ) : (
                    <Square size={16} />
                  )}
                </button>
                <span className="ml-2 text-xs font-semibold leading-normal group-hover:text-black dark:group-hover:text-white transition-colors">
                  I understand that force-deleting may cause errors in checkout carts or display empty names in old order details.
                </span>
              </label>
            </div>
          ) : (
            /* Safe state: item has no links */
            <div className="space-y-2">
              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Are you sure you want to delete <span className="font-bold text-[var(--primary)]">{addon.name}</span>?
              </p>
              <p className="text-[10px] text-zinc-500 leading-normal">
                This item is not mapped to any active products or customer carts. This action is irreversible.
              </p>
            </div>
          )}

        </div>

        {/* Actions */}
        <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-900/60 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2 text-xs font-bold">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-3 py-1.5 border border-zinc-300 dark:border-zinc-750 text-zinc-750 dark:text-zinc-300 rounded-lg hover:bg-zinc-150 dark:hover:bg-zinc-850 transition-colors"
          >
            Cancel
          </button>
          
          <button
            onClick={handleArchive}
            disabled={isProcessing}
            className="px-3.5 py-1.5 bg-amber-500 text-white rounded-lg shadow-sm hover:bg-amber-600 active:scale-95 transition-all flex items-center gap-1"
          >
            <Archive size={12} />
            Archive Item
          </button>

          {/* Delete Action (restricted if has references unless checked) */}
          <button
            onClick={handleDelete}
            disabled={isProcessing || (hasReferences && !agreed)}
            className="px-3.5 py-1.5 bg-red-600 text-white rounded-lg shadow-sm hover:bg-red-750 active:scale-95 transition-all flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 size={12} />
            {hasReferences ? "Force Delete" : "Delete Permanent"}
          </button>
        </div>
      </div>
    </div>
  );
}
