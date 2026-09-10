import React, { useState, useEffect } from "react";
import { X, SlidersHorizontal, AlertTriangle, Check, CheckSquare, Square, Building2, Pizza } from "lucide-react";
import { useBulkPriceUpdate } from "../hooks/useBulkPricing";
import { toast } from "sonner";

export default function BulkPriceUpdateModal({ isOpen, onClose, storesList = [], categoriesList = [], productsList = [] }) {
  const bulkUpdateMutation = useBulkPriceUpdate();

  // Form State
  const [categoryId, setCategoryId] = useState("all");
  const [increaseType, setIncreaseType] = useState("PERCENTAGE"); // PERCENTAGE | FIXED
  const [value, setValue] = useState("5");
  const [applyTo, setApplyTo] = useState("ALL_STORES"); // ALL_STORES | SELECTED_STORES
  
  const [selectedStoreIds, setSelectedStoreIds] = useState([]);
  const [selectedProductIds, setSelectedProductIds] = useState([]);

  // Automatically select products belonging to the selected category
  useEffect(() => {
    if (categoryId === "all") {
      setSelectedProductIds(productsList.map(p => p._id));
    } else {
      setSelectedProductIds(productsList.filter(p => p.categoryId === categoryId).map(p => p._id));
    }
  }, [categoryId, productsList, isOpen]);

  // Automatically select all stores by default
  useEffect(() => {
    setSelectedStoreIds(storesList.filter(s => s.status === "Active").map(s => s._id));
  }, [storesList, isOpen]);

  if (!isOpen) return null;

  const handleStoreToggle = (storeId) => {
    setSelectedStoreIds(prev => 
      prev.includes(storeId) ? prev.filter(id => id !== storeId) : [...prev, storeId]
    );
  };

  const handleProductToggle = (prodId) => {
    setSelectedProductIds(prev => 
      prev.includes(prodId) ? prev.filter(id => id !== prodId) : [...prev, prodId]
    );
  };

  const handleSelectAllStores = () => {
    const activeStores = storesList.filter(s => s.status === "Active").map(s => s._id);
    if (selectedStoreIds.length === activeStores.length) {
      setSelectedStoreIds([]);
    } else {
      setSelectedStoreIds(activeStores);
    }
  };

  const handleSelectAllProducts = () => {
    const filteredProds = categoryId === "all" 
      ? productsList.map(p => p._id)
      : productsList.filter(p => p.categoryId === categoryId).map(p => p._id);

    if (selectedProductIds.length === filteredProds.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(filteredProds);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const updateVal = Number(value);
    
    if (isNaN(updateVal) || updateVal <= 0) {
      toast.error("Please enter a valid positive number for adjustment value.");
      return;
    }

    if (applyTo === "SELECTED_STORES" && selectedStoreIds.length === 0) {
      toast.error("Please select at least one store.");
      return;
    }

    if (selectedProductIds.length === 0) {
      toast.error("Please select at least one product.");
      return;
    }

    const payload = {
      categoryId,
      increaseType,
      value: updateVal,
      applyTo,
      selectedStoreIds: applyTo === "ALL_STORES" ? storesList.map(s => s._id) : selectedStoreIds,
      selectedProductIds
    };

    bulkUpdateMutation.mutate(payload, {
      onSuccess: (res) => {
        toast.success(`Bulk price update completed! Affected ${res.affectedCount} pricing rules.`);
        onClose();
      },
      onError: (err) => {
        toast.error(err?.message || "Failed to complete bulk update.");
      }
    });
  };

  // Preview computations
  const currentExamplePrice = 299;
  const val = Number(value) || 0;
  const newExamplePrice = increaseType === "PERCENTAGE" 
    ? Math.round(currentExamplePrice * (1 + val / 100))
    : currentExamplePrice + val;

  const targetStoresCount = applyTo === "ALL_STORES" 
    ? storesList.filter(s => s.status === "Active").length
    : selectedStoreIds.length;

  const affectedRulesCount = targetStoresCount * selectedProductIds.length;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden text-xs font-semibold text-zinc-700 dark:text-zinc-350">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-xs z-40 animate-fade-in" onClick={onClose} />

      {/* Modal Container */}
      <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-scale-up max-h-[90vh]">
          
          {/* Header */}
          <header className="p-4 border-b border-zinc-150 dark:border-zinc-850 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/30 shrink-0">
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={16} className="text-primary" />
              <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white">
                Bulk Price Adjustment
              </h3>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400">
              <X size={15} />
            </button>
          </header>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 grid grid-cols-1 lg:grid-cols-3 gap-5 scrollbar-thin">
            
            {/* Form Fields Column */}
            <div className="lg:col-span-2 space-y-4">
              
              {/* Parameters Setup */}
              <div className="p-4 border border-zinc-150 dark:border-zinc-850 rounded-xl space-y-3">
                <p className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">Adjustment Parameters</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Category select */}
                  <div className="space-y-1">
                    <label className="block text-zinc-550 font-bold">Menu Category</label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full px-2 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-[11px]"
                    >
                      <option value="all">All Categories</option>
                      {categoriesList.map(c => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Increase Type selection */}
                  <div className="space-y-1">
                    <label className="block text-zinc-555 font-bold">Adjustment Type</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setIncreaseType("PERCENTAGE")}
                        className={`py-1.5 rounded-lg border text-center font-bold transition-all ${
                          increaseType === "PERCENTAGE"
                            ? "bg-[var(--primary)] text-white border-transparent"
                            : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                        }`}
                      >
                        Percent (%)
                      </button>
                      <button
                        type="button"
                        onClick={() => setIncreaseType("FIXED")}
                        className={`py-1.5 rounded-lg border text-center font-bold transition-all ${
                          increaseType === "FIXED"
                            ? "bg-[var(--primary)] text-white border-transparent"
                            : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                        }`}
                      >
                        Fixed (₹)
                      </button>
                    </div>
                  </div>

                  {/* Value Input */}
                  <div className="space-y-1">
                    <label className="block text-zinc-555 font-bold">Adjustment Value</label>
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg font-black text-center text-xs focus:outline-none"
                      placeholder="e.g. 10"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* Apply Scope Selector */}
              <div className="p-4 border border-zinc-150 dark:border-zinc-850 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">Target Outlets</p>
                  <div className="flex bg-zinc-50 dark:bg-zinc-950 p-0.5 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setApplyTo("ALL_STORES")}
                      className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
                        applyTo === "ALL_STORES" ? "bg-white dark:bg-zinc-850 shadow-sm text-zinc-900 dark:text-white" : "text-zinc-400"
                      }`}
                    >
                      All Outlets
                    </button>
                    <button
                      type="button"
                      onClick={() => setApplyTo("SELECTED_STORES")}
                      className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
                        applyTo === "SELECTED_STORES" ? "bg-white dark:bg-zinc-850 shadow-sm text-zinc-900 dark:text-white" : "text-zinc-400"
                      }`}
                    >
                      Specific Outlets
                    </button>
                  </div>
                </div>

                {applyTo === "SELECTED_STORES" && (
                  <div className="space-y-2 animate-fade-in">
                    <div className="flex justify-between items-center text-[10px] text-zinc-450">
                      <span>Select target stores:</span>
                      <button
                        type="button"
                        onClick={handleSelectAllStores}
                        className="text-primary hover:underline font-bold"
                      >
                        {selectedStoreIds.length === storesList.filter(s => s.status === "Active").length ? "Deselect All" : "Select All Active"}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[120px] overflow-y-auto p-1 border border-zinc-100 dark:border-zinc-900 rounded-lg scrollbar-thin">
                      {storesList
                        .filter(s => s.status === "Active")
                        .map(store => (
                          <label
                            key={store._id}
                            className={`flex items-center gap-2 p-2 rounded-lg border text-left cursor-pointer transition-all select-none ${
                              selectedStoreIds.includes(store._id)
                                ? "bg-primary/5 border-primary text-zinc-900 dark:text-white"
                                : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedStoreIds.includes(store._id)}
                              onChange={() => handleStoreToggle(store._id)}
                              className="sr-only"
                            />
                            {selectedStoreIds.includes(store._id) ? (
                              <CheckSquare size={13} className="text-primary" />
                            ) : (
                              <Square size={13} className="text-zinc-350" />
                            )}
                            <span className="truncate leading-none text-[10px]">{store.storeName.replace("Papa Veg Pizza - ", "")}</span>
                          </label>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Product Selector Grid */}
              <div className="p-4 border border-zinc-150 dark:border-zinc-850 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">Target Products</p>
                  <button
                    type="button"
                    onClick={handleSelectAllProducts}
                    className="text-primary hover:underline font-bold text-[10px]"
                  >
                    {selectedProductIds.length === (categoryId === "all" ? productsList.length : productsList.filter(p => p.categoryId === categoryId).length) ? "Deselect All" : "Select All Products"}
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[200px] overflow-y-auto p-1.5 border border-zinc-100 dark:border-zinc-900 rounded-lg scrollbar-thin">
                  {productsList
                    .filter(p => categoryId === "all" || p.categoryId === categoryId)
                    .map(prod => (
                      <label
                        key={prod._id}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-left cursor-pointer transition-all select-none ${
                          selectedProductIds.includes(prod._id)
                            ? "bg-primary/5 border-primary text-zinc-900 dark:text-white"
                            : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedProductIds.includes(prod._id)}
                          onChange={() => handleProductToggle(prod._id)}
                          className="sr-only"
                        />
                        <div className="w-8 h-8 rounded bg-zinc-100 overflow-hidden shrink-0 border border-zinc-200">
                          <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0 font-bold">
                          <p className="truncate leading-tight text-[10px]">{prod.name}</p>
                          <p className="text-[8.5px] text-zinc-400 mt-0.5 leading-none font-mono font-extrabold">₹{prod.basePrice}</p>
                        </div>
                      </label>
                    ))}
                </div>
              </div>

            </div>

            {/* Preview Column */}
            <div className="lg:col-span-1 space-y-4">
              <div className="p-4 bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-4 sticky top-0">
                <div className="flex items-center gap-1.5 text-[9.5px] uppercase font-bold text-zinc-400">
                  <Check size={14} className="text-emerald-500" />
                  <span>Adjustment Summary</span>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2.5 bg-white dark:bg-zinc-950 rounded-xl border border-zinc-100 dark:border-zinc-850">
                    <span className="text-[8px] text-zinc-400 uppercase font-semibold">Stores</span>
                    <p className="text-zinc-900 dark:text-white text-base font-black mt-0.5">{targetStoresCount}</p>
                  </div>
                  <div className="p-2.5 bg-white dark:bg-zinc-950 rounded-xl border border-zinc-100 dark:border-zinc-850">
                    <span className="text-[8px] text-zinc-400 uppercase font-semibold">Products</span>
                    <p className="text-zinc-900 dark:text-white text-base font-black mt-0.5">{selectedProductIds.length}</p>
                  </div>
                </div>

                {/* Example card */}
                <div className="p-3 bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-855 rounded-xl space-y-2">
                  <p className="text-[8.5px] text-zinc-450 uppercase font-bold tracking-wider">Example Override</p>
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-zinc-500">Medium Price</span>
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-400 line-through">₹{currentExamplePrice}</span>
                      <span className="text-zinc-900 dark:text-white text-sm font-black">₹{newExamplePrice}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-[9.5px] font-bold border-t border-zinc-100 dark:border-zinc-900 pt-1.5 mt-1.5 text-emerald-600">
                    <span>Average price diff</span>
                    <span>+{increaseType === "PERCENTAGE" ? `${val}%` : `₹${val}`}</span>
                  </div>
                </div>

                {/* Warning message */}
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/35 rounded-xl flex items-start gap-2 text-amber-750 dark:text-amber-400 text-[10px] leading-relaxed">
                  <AlertTriangle size={15} className="shrink-0 mt-0.5 text-amber-500 animate-pulse" />
                  <span>
                    Warning: Clicking "Apply Changes" will overwrite the small, medium, large, takeaway and delivery pricing overrides for <strong>{affectedRulesCount}</strong> catalog records.
                  </span>
                </div>
              </div>
            </div>

          </form>

          {/* Footer Actions */}
          <footer className="p-4 border-t border-zinc-150 dark:border-zinc-850 flex justify-end gap-2 bg-zinc-50/50 dark:bg-zinc-900/30 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-xl font-bold cursor-pointer transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={bulkUpdateMutation.isLoading || selectedProductIds.length === 0 || (applyTo === "SELECTED_STORES" && selectedStoreIds.length === 0)}
              className={`px-5 py-2 text-white font-black rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 ${
                selectedProductIds.length === 0 || (applyTo === "SELECTED_STORES" && selectedStoreIds.length === 0)
                  ? "bg-zinc-300 dark:bg-zinc-800 text-zinc-400 opacity-60 cursor-not-allowed"
                  : "bg-primary hover:bg-primary/95 shadow-primary/10"
              }`}
            >
              Apply Changes
            </button>
          </footer>

        </div>
      </div>
    </div>
  );
}
