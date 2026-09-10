import React, { useState } from "react";
import { Copy, X, CheckSquare, Square, RefreshCw } from "lucide-react";

export default function CloneModal({ isOpen, onClose, product, onConfirm }) {
  const [options, setOptions] = useState({
    variants: true,
    images: true,
    pricing: true,
    availability: true,
    generateSku: true,
    generateSlug: true
  });
  const [isCloning, setIsCloning] = useState(false);

  if (!isOpen || !product) return null;

  const handleToggle = (key) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleClone = () => {
    setIsCloning(true);
    setTimeout(() => {
      setIsCloning(false);
      onConfirm?.(product, options);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Copy size={16} className="text-[var(--primary)]" />
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Clone Product
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
          <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-150 dark:border-zinc-800">
            <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              You are cloning: <span className="font-bold text-[var(--primary)]">{product.name}</span>
            </p>
            <p className="text-[10px] text-zinc-500 mt-1">
              Select which attributes you want to copy to the new product.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {Object.entries({
              variants: "Clone Variants",
              images: "Clone Images",
              pricing: "Clone Pricing Rules",
              availability: "Clone Availability",
              generateSku: "Generate New SKU",
              generateSlug: "Generate New Slug"
            }).map(([key, label]) => (
              <button
                key={key}
                onClick={() => handleToggle(key)}
                className="flex items-center gap-2 p-2 rounded-lg border border-zinc-150 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 text-left transition-all"
              >
                {options[key] ? (
                  <CheckSquare size={16} className="text-[var(--primary)] shrink-0" />
                ) : (
                  <Square size={16} className="text-zinc-400 dark:text-zinc-600 shrink-0" />
                )}
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-900/60 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2.5">
          <button
            onClick={onClose}
            disabled={isCloning}
            className="px-3 py-1.5 border border-zinc-300 dark:border-zinc-750 text-zinc-700 dark:text-zinc-300 font-bold text-xs rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleClone}
            disabled={isCloning}
            className="px-4 py-1.5 bg-[var(--primary)] text-white font-bold text-xs rounded-lg shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-70"
          >
            {isCloning ? (
              <>
                <RefreshCw size={12} className="animate-spin" />
                <span>Cloning...</span>
              </>
            ) : (
              <span>Clone Product</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
