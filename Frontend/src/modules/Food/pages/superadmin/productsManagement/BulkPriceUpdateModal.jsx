import React, { useState, useEffect } from "react";
import { X, Search, Settings, AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";

export default function BulkPriceUpdateModal({ isOpen, onClose, productsList = [], onConfirm }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [selectedVariants, setSelectedVariants] = useState(["Regular", "Medium", "Large"]);
  
  // Update action state
  const [actionType, setActionType] = useState("percent_increase"); // percent_increase, percent_decrease, fixed_increase, fixed_decrease, replace
  const [value, setValue] = useState(0);
  const [validFrom, setValidFrom] = useState("");
  const [validTo, setValidTo] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Validation errors
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setSelectedProductIds([]);
      setSearchTerm("");
      setValue(0);
      setValidFrom("");
      setValidTo("");
      setShowPreview(false);
      setIsUpdating(false);
      setErrors({});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filtered products list
  const filteredProducts = productsList.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectProduct = (id) => {
    setSelectedProductIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedProductIds(filteredProducts.map(p => p.id));
    } else {
      setSelectedProductIds([]);
    }
  };

  const handleToggleVariant = (variant) => {
    setSelectedVariants(prev =>
      prev.includes(variant) ? prev.filter(v => v !== variant) : [...prev, variant]
    );
  };

  // Helper to calculate the mock after-price
  const calculateAfterPrice = (beforePrice) => {
    const val = parseFloat(value) || 0;
    let finalPrice = beforePrice;
    switch (actionType) {
      case "percent_increase":
        finalPrice = beforePrice + (beforePrice * (val / 100));
        break;
      case "percent_decrease":
        finalPrice = beforePrice - (beforePrice * (val / 100));
        break;
      case "fixed_increase":
        finalPrice = beforePrice + val;
        break;
      case "fixed_decrease":
        finalPrice = beforePrice - val;
        break;
      case "replace":
        finalPrice = val;
        break;
      default:
        break;
    }
    return Math.max(0, Math.round(finalPrice));
  };

  const validate = () => {
    const newErrors = {};
    if (selectedProductIds.length === 0) {
      newErrors.products = "Select at least one product to update.";
    }
    if (selectedVariants.length === 0) {
      newErrors.variants = "Select at least one variant size.";
    }
    if (value <= 0) {
      newErrors.value = "Amount or percentage value must be greater than 0.";
    }
    if (validFrom && validTo) {
      if (new Date(validTo) <= new Date(validFrom)) {
        newErrors.validTo = "End date must be strictly after the start date.";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePreviewSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      setShowPreview(true);
    }
  };

  const handleApply = () => {
    setIsUpdating(true);
    setTimeout(() => {
      setIsUpdating(false);
      onConfirm?.({
        productIds: selectedProductIds,
        variants: selectedVariants,
        actionType,
        value,
        validFrom,
        validTo
      });
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-white dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] text-zinc-900 dark:text-zinc-100 select-none">
        
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-zinc-205 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2">
            <Settings size={16} className="text-[var(--primary)]" />
            <div>
              <h3 className="text-xs font-bold font-mono text-zinc-500 uppercase tracking-wider">Bulk Catalog Actions</h3>
              <h2 className="text-sm font-black text-black dark:text-white mt-0.5">Bulk Price Update Strategy</h2>
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
        {!showPreview ? (
          <form onSubmit={handlePreviewSubmit} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            {/* Step 1: Select products */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Select Products ({selectedProductIds.length} Selected)</label>
                {errors.products && <span className="text-[9px] font-bold text-red-500">{errors.products}</span>}
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 text-zinc-400" size={13} />
                <input
                  type="text"
                  placeholder="Search catalog products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-900/40 focus:outline-none"
                />
              </div>

              {/* Selector List */}
              <div className="border border-zinc-150 dark:border-zinc-800 rounded-lg max-h-[140px] overflow-y-auto p-2 bg-zinc-50/50 dark:bg-zinc-950/20 divide-y divide-zinc-100 dark:divide-zinc-850 scrollbar-thin">
                <div className="flex items-center gap-2 p-1 text-xs font-bold text-zinc-500 bg-zinc-100/50 dark:bg-zinc-900/40 rounded px-2 mb-1">
                  <input
                    type="checkbox"
                    checked={selectedProductIds.length === filteredProducts.length && filteredProducts.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-zinc-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                  />
                  <span>Select All Filtered ({filteredProducts.length} Items)</span>
                </div>
                {filteredProducts.map(p => {
                  const isChecked = selectedProductIds.includes(p.id);
                  return (
                    <div
                      key={p.id}
                      onClick={() => handleSelectProduct(p.id)}
                      className="flex items-center justify-between p-1.5 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // Controlled by row div click
                          className="w-3.5 h-3.5 rounded border-zinc-300 text-[var(--primary)]"
                        />
                        <span className="font-bold text-zinc-800 dark:text-zinc-200">{p.name}</span>
                      </div>
                      <span className="text-[10px] text-zinc-400 font-mono">{p.id}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Variants size selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Select Variant Size Overrides</label>
                {errors.variants && <span className="text-[9px] font-bold text-red-500">{errors.variants}</span>}
              </div>
              <div className="flex gap-2">
                {["Regular", "Medium", "Large"].map(variant => {
                  const active = selectedVariants.includes(variant);
                  return (
                    <button
                      key={variant}
                      type="button"
                      onClick={() => handleToggleVariant(variant)}
                      className={`flex-1 py-1.5 border text-xs font-bold rounded-lg transition-colors cursor-pointer ${active ? "border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)]" : "border-zinc-205 dark:border-zinc-800 hover:bg-zinc-50"}`}
                    >
                      {variant} Size
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Action Type and value input */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Pricing Formula *</label>
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value)}
                  className="px-2.5 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-900 outline-none text-zinc-700 dark:text-zinc-300 font-semibold"
                >
                  <option value="percent_increase">Increase by Percentage (%)</option>
                  <option value="percent_decrease">Decrease by Percentage (%)</option>
                  <option value="fixed_increase">Increase by Fixed Price Amount (₹)</option>
                  <option value="fixed_decrease">Decrease by Fixed Price Amount (₹)</option>
                  <option value="replace">Replace with Fixed Price (₹)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Adjustment Value *</label>
                  {errors.value && <span className="text-[9px] font-bold text-red-500">{errors.value}</span>}
                </div>
                <input
                  type="number"
                  min={0}
                  value={value}
                  onChange={(e) => setValue(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-bold font-mono focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                />
              </div>
            </div>

            {/* Step 4: Dates scope */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Effective From (Optional)</label>
                <input
                  type="datetime-local"
                  value={validFrom}
                  onChange={(e) => setValidFrom(e.target.value)}
                  className="px-2.5 py-1.5 border border-zinc-205 dark:border-zinc-800 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
                />
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Effective To (Optional)</label>
                  {errors.validTo && <span className="text-[9px] font-bold text-red-500">{errors.validTo}</span>}
                </div>
                <input
                  type="datetime-local"
                  value={validTo}
                  onChange={(e) => setValidTo(e.target.value)}
                  className="px-2.5 py-1.5 border border-zinc-205 dark:border-zinc-800 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
                />
              </div>
            </div>
          </form>
        ) : (
          /* Step 5: Preview list showing before & after pricing shifts */
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            <div className="p-3 bg-amber-50 dark:bg-amber-955/10 rounded-lg border border-amber-100 dark:border-amber-900/30 flex gap-2.5 text-xs">
              <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-amber-800 dark:text-amber-400">Review Pricing Updates Before Publishing</h4>
                <p className="text-[10px] text-zinc-650 dark:text-zinc-450 mt-1">
                  You are about to modify the overrides of <span className="font-bold text-black dark:text-white">{selectedProductIds.length} products</span> across selected variants. Review the price projections below:
                </p>
              </div>
            </div>

            <div className="border border-zinc-150 dark:border-zinc-800 rounded-xl overflow-hidden shadow-inner">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-950 text-zinc-500 font-bold border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="px-3 py-2">Product Name</th>
                    <th className="px-3 py-2">SKU</th>
                    <th className="px-3 py-2 text-right">Current Price</th>
                    <th className="px-3 py-2 text-center w-12">Shift</th>
                    <th className="px-3 py-2 text-right">Updated Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850">
                  {selectedProductIds.map(id => {
                    const p = productsList.find(item => item.id === id);
                    if (!p) return null;
                    const basePriceNum = parseFloat((p.price || "₹0").replace(/[^\d.]/g, "")) || 0;
                    const nextPriceNum = calculateAfterPrice(basePriceNum);
                    
                    return (
                      <tr key={id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20">
                        <td className="px-3 py-2.5 font-bold text-zinc-900 dark:text-zinc-200">{p.name}</td>
                        <td className="px-3 py-2.5 font-mono text-[10px] text-zinc-400">{p.id}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-zinc-650 dark:text-zinc-400">₹{basePriceNum}</td>
                        <td className="px-3 py-2.5 text-center">
                          <ArrowRight size={12} className="inline text-zinc-400" />
                        </td>
                        <td className="px-3 py-2.5 text-right font-bold font-mono text-emerald-600 dark:text-emerald-400">
                          ₹{nextPriceNum}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-2 gap-3.5 bg-zinc-55 dark:bg-zinc-900/30 p-3 rounded-lg border border-zinc-150 dark:border-zinc-800 text-[10px] font-semibold text-zinc-550 dark:text-zinc-400">
              <div>
                <span className="block font-bold text-zinc-450 uppercase">Update Rule Type</span>
                <span className="text-zinc-800 dark:text-zinc-250 font-bold capitalize mt-0.5 inline-block">{actionType.replace("_", " ")} ({value})</span>
              </div>
              <div>
                <span className="block font-bold text-zinc-450 uppercase">Effective Timelines</span>
                <span className="text-zinc-800 dark:text-zinc-250 font-bold mt-0.5 inline-block">
                  {validFrom ? new Date(validFrom).toLocaleDateString() : "Immediate"} - {validTo ? new Date(validTo).toLocaleDateString() : "Permanent"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-900/60 border-t border-zinc-200 dark:border-zinc-800 flex justify-between gap-2">
          {showPreview ? (
            <>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                disabled={isUpdating}
                className="px-3 py-1.5 border border-zinc-300 dark:border-zinc-750 text-zinc-750 dark:text-zinc-300 font-bold text-xs rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors bg-white dark:bg-zinc-950"
              >
                Back to Edit
              </button>
              <button
                type="button"
                onClick={handleApply}
                disabled={isUpdating}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
              >
                {isUpdating ? "Applying Changes..." : "Publish Bulk Update"}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 border border-zinc-300 dark:border-zinc-750 text-zinc-750 dark:text-zinc-300 font-bold text-xs rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors bg-white dark:bg-zinc-950"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handlePreviewSubmit}
                className="px-4 py-1.5 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white font-bold text-xs rounded-lg shadow-md transition-all active:scale-95 flex items-center gap-1"
              >
                Next: Review Updates <ArrowRight size={12} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
