import React, { useState, useEffect } from "react";
import { Copy, X, Search, Check, AlertTriangle } from "lucide-react";

export default function DuplicatePricingModal({ isOpen, onClose, rule, productsList = [], onConfirm }) {
  const [copyScope, setCopyScope] = useState(true);
  const [copyDates, setCopyDates] = useState(true);
  const [copyPrices, setCopyPrices] = useState(true);

  // Target selection
  const [targetProductId, setTargetProductId] = useState("");
  const [targetVariant, setTargetVariant] = useState("Medium");
  const [productSearch, setProductSearch] = useState("");

  const [errors, setErrors] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen && rule) {
      setCopyScope(true);
      setCopyDates(true);
      setCopyPrices(true);
      setTargetProductId(rule.productId || "");
      setTargetVariant(rule.variant || "Medium");
      setProductSearch("");
      setErrors({});
      setIsProcessing(false);
    }
  }, [isOpen, rule]);

  if (!isOpen || !rule) return null;

  // Filtered products
  const filteredProducts = productsList.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.id.toLowerCase().includes(productSearch.toLowerCase())
  );

  const selectedProduct = productsList.find(p => p.id === targetProductId);

  const validate = () => {
    const newErrors = {};
    if (!targetProductId) {
      newErrors.productId = "Target product selection is required.";
    }
    if (!targetVariant) {
      newErrors.variant = "Target variant size is required.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      setIsProcessing(true);
      setTimeout(() => {
        setIsProcessing(false);
        onConfirm?.({
          sourceRule: rule,
          targetProductId,
          targetVariant,
          copyScope,
          copyDates,
          copyPrices
        });
        onClose();
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] text-zinc-900 dark:text-zinc-100 select-none">
        
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-zinc-205 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2">
            <Copy size={16} className="text-[var(--primary)]" />
            <div>
              <h3 className="text-xs font-bold font-mono text-zinc-500 uppercase tracking-wider">Replicate Configurations</h3>
              <h2 className="text-sm font-black text-black dark:text-white mt-0.5">Duplicate Pricing Override Rule</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-150 dark:hover:bg-zinc-850 rounded-full transition-colors text-zinc-400"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
          
          {/* Target selection */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Select Target Product *</label>
              {errors.productId && <span className="text-[9px] font-bold text-red-500">{errors.productId}</span>}
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 text-zinc-400" size={13} />
              <input
                type="text"
                placeholder="Search products by SKU or title..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-zinc-200 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-900/40 rounded-lg text-xs"
              />
            </div>

            {/* Dropdown Select Area */}
            <div className="border border-zinc-150 dark:border-zinc-850 rounded-lg max-h-[120px] overflow-y-auto p-1.5 bg-zinc-50/50 dark:bg-zinc-950/25 divide-y divide-zinc-100 dark:divide-zinc-850 scrollbar-thin">
              {filteredProducts.map(p => {
                const isSelected = targetProductId === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      setTargetProductId(p.id);
                      setProductSearch("");
                    }}
                    className={`flex items-center justify-between p-1.5 rounded text-xs cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900 ${isSelected ? 'bg-[var(--primary)]/5 font-semibold text-[var(--primary)]' : ''}`}
                  >
                    <span>{p.name} ({p.id})</span>
                    {isSelected && <Check size={12} className="text-[var(--primary)]" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Target Variant */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Target Variant Size *</label>
            <div className="grid grid-cols-3 gap-2">
              {["Regular", "Medium", "Large"].map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setTargetVariant(v)}
                  className={`py-1.5 border text-xs font-bold rounded-lg cursor-pointer transition-colors ${targetVariant === v ? 'border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)]' : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50'}`}
                >
                  {v} Size
                </button>
              ))}
            </div>
          </div>

          {/* Copy toggles */}
          <div className="space-y-3.5 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Replication Rules</label>
            <div className="space-y-2.5">
              <label className="flex items-center gap-3 text-xs font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={copyScope}
                  onChange={(e) => setCopyScope(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                />
                <div>
                  <span className="text-zinc-800 dark:text-zinc-200 block">Copy Geographic Scope Override Hierarchy</span>
                  <span className="text-[9px] text-zinc-450 block font-normal leading-normal">
                    Inherits region, zone, territory, franchise and store constraints (e.g. {rule.storeId || rule.franchiseId || "Global Base"}).
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-3 text-xs font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={copyDates}
                  onChange={(e) => setCopyDates(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                />
                <div>
                  <span className="text-zinc-800 dark:text-zinc-200 block">Copy Effective Timeline Ranges</span>
                  <span className="text-[9px] text-zinc-450 block font-normal leading-normal">
                    Apply identical start and end validity ranges: {rule.validFrom} to {rule.validTo}.
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-3 text-xs font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={copyPrices}
                  onChange={(e) => setCopyPrices(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                />
                <div>
                  <span className="text-zinc-800 dark:text-zinc-200 block">Copy Base and Effective Pricing Settings</span>
                  <span className="text-[9px] text-zinc-450 block font-normal leading-normal">
                    Prefills identical prices: Base ₹{rule.basePrice} | Effective ₹{rule.effectivePrice}.
                  </span>
                </div>
              </label>
            </div>
          </div>

        </form>

        {/* Footer */}
        <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-900/60 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-3 py-1.5 border border-zinc-300 dark:border-zinc-750 text-zinc-750 dark:text-zinc-300 font-bold text-xs rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors bg-white dark:bg-zinc-950"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isProcessing}
            className="px-4 py-1.5 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white font-bold text-xs rounded-lg shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
          >
            {isProcessing ? "Replicating..." : "Duplicate Rule"}
          </button>
        </div>
      </div>
    </div>
  );
}
