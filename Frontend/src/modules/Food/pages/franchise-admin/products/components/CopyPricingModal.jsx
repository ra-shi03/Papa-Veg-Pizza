import React, { useState, useEffect } from "react";
import { X, Copy, AlertTriangle, Check, CheckSquare, Square, Building2, Pizza, ChevronRight } from "lucide-react";
import { useCopyPricing } from "../hooks/useBulkPricing";
import { toast } from "sonner";

export default function CopyPricingModal({ isOpen, onClose, storesList = [], productsList = [] }) {
  const copyPricingMutation = useCopyPricing();

  const [sourceStoreId, setSourceStoreId] = useState("");
  const [destinationStoreIds, setDestinationStoreIds] = useState([]);
  const [copyAllProducts, setCopyAllProducts] = useState(true);
  const [selectedProductIds, setSelectedProductIds] = useState([]);

  // Auto select all products by default if copyAll is checked
  useEffect(() => {
    if (copyAllProducts) {
      setSelectedProductIds(productsList.map(p => p._id));
    }
  }, [copyAllProducts, productsList, isOpen]);

  // Reset states on open
  useEffect(() => {
    if (isOpen) {
      setSourceStoreId("");
      setDestinationStoreIds([]);
      setCopyAllProducts(true);
      setSelectedProductIds([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSourceChange = (e) => {
    const val = e.target.value;
    setSourceStoreId(val);
    // Clear destination if it matches the new source
    setDestinationStoreIds(prev => prev.filter(id => id !== val));
  };

  const handleDestToggle = (storeId) => {
    setDestinationStoreIds(prev => 
      prev.includes(storeId) ? prev.filter(id => id !== storeId) : [...prev, storeId]
    );
  };

  const handleProductToggle = (prodId) => {
    setSelectedProductIds(prev => 
      prev.includes(prodId) ? prev.filter(id => id !== prodId) : [...prev, prodId]
    );
  };

  const handleSelectAllDest = () => {
    const activeDestStores = storesList
      .filter(s => s.status === "Active" && s._id !== sourceStoreId)
      .map(s => s._id);

    if (destinationStoreIds.length === activeDestStores.length) {
      setDestinationStoreIds([]);
    } else {
      setDestinationStoreIds(activeDestStores);
    }
  };

  const handleSelectAllProducts = () => {
    if (selectedProductIds.length === productsList.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(productsList.map(p => p._id));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!sourceStoreId) {
      toast.error("Please select a source store.");
      return;
    }

    if (destinationStoreIds.length === 0) {
      toast.error("Please select at least one destination store.");
      return;
    }

    if (!copyAllProducts && selectedProductIds.length === 0) {
      toast.error("Please select at least one product to copy.");
      return;
    }

    const payload = {
      sourceStoreId,
      destinationStoreIds,
      copyAllProducts,
      selectedProductIds: copyAllProducts ? productsList.map(p => p._id) : selectedProductIds
    };

    copyPricingMutation.mutate(payload, {
      onSuccess: (res) => {
        toast.success(`Pricing copied successfully! Mirrored ${res.affectedProductsCount} products across ${res.affectedStoresCount} stores.`);
        onClose();
      },
      onError: (err) => {
        toast.error(err?.message || "Failed to copy pricing configuration.");
      }
    });
  };

  // Preview computations
  const totalAffected = destinationStoreIds.length * (copyAllProducts ? productsList.length : selectedProductIds.length);

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
              <Copy size={16} className="text-primary" />
              <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white">
                Copy Pricing Rules
              </h3>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400">
              <X size={15} />
            </button>
          </header>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 grid grid-cols-1 lg:grid-cols-3 gap-5 scrollbar-thin">
            
            {/* Form Fields: 2 Columns */}
            <div className="lg:col-span-2 space-y-4">
              
              {/* Source Store Selection */}
              <div className="p-4 border border-zinc-150 dark:border-zinc-850 rounded-xl space-y-3">
                <p className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">Source Store Outlet</p>
                <div className="space-y-1">
                  <label className="block text-zinc-500 font-bold">Copy from store:</label>
                  <select
                    value={sourceStoreId}
                    onChange={handleSourceChange}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-lg text-[11px]"
                  >
                    <option value="">-- Choose Source Store --</option>
                    {storesList
                      .filter(s => s.status === "Active")
                      .map(s => (
                        <option key={s._id} value={s._id}>{s.storeName}</option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Destination Stores Selection */}
              <div className="p-4 border border-zinc-150 dark:border-zinc-850 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">Destination Store Outlets</p>
                  {sourceStoreId && (
                    <button
                      type="button"
                      onClick={handleSelectAllDest}
                      className="text-primary hover:underline font-bold text-[10px]"
                    >
                      {destinationStoreIds.length === storesList.filter(s => s.status === "Active" && s._id !== sourceStoreId).length ? "Deselect All" : "Select All Destination"}
                    </button>
                  )}
                </div>

                {!sourceStoreId ? (
                  <div className="p-4 text-center bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-900 rounded-lg text-zinc-400">
                    Please select a source store first to choose destination outlets.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[120px] overflow-y-auto p-1 border border-zinc-100 dark:border-zinc-900 rounded-lg scrollbar-thin animate-fade-in">
                    {storesList
                      .filter(s => s.status === "Active" && s._id !== sourceStoreId)
                      .map(store => (
                        <label
                          key={store._id}
                          className={`flex items-center gap-2 p-2 rounded-lg border text-left cursor-pointer transition-all select-none ${
                            destinationStoreIds.includes(store._id)
                              ? "bg-primary/5 border-primary text-zinc-900 dark:text-white"
                              : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={destinationStoreIds.includes(store._id)}
                            onChange={() => handleDestToggle(store._id)}
                            className="sr-only"
                          />
                          {destinationStoreIds.includes(store._id) ? (
                            <CheckSquare size={13} className="text-primary" />
                          ) : (
                            <Square size={13} className="text-zinc-350" />
                          )}
                          <span className="truncate leading-none text-[10px]">{store.storeName.replace("Papa Veg Pizza - ", "")}</span>
                        </label>
                      ))}
                  </div>
                )}
              </div>

              {/* Product Selection */}
              <div className="p-4 border border-zinc-150 dark:border-zinc-850 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">Catalog Products</p>
                  <div className="flex bg-zinc-50 dark:bg-zinc-950 p-0.5 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setCopyAllProducts(true)}
                      className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
                        copyAllProducts ? "bg-white dark:bg-zinc-850 shadow-sm text-zinc-900 dark:text-white" : "text-zinc-400"
                      }`}
                    >
                      Copy All
                    </button>
                    <button
                      type="button"
                      onClick={() => setCopyAllProducts(false)}
                      className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
                        !copyAllProducts ? "bg-white dark:bg-zinc-850 shadow-sm text-zinc-900 dark:text-white" : "text-zinc-400"
                      }`}
                    >
                      Select Products
                    </button>
                  </div>
                </div>

                {!copyAllProducts && (
                  <div className="space-y-2 animate-fade-in">
                    <div className="flex justify-between items-center text-[10px] text-zinc-450">
                      <span>Select products to mirror overrides:</span>
                      <button
                        type="button"
                        onClick={handleSelectAllProducts}
                        className="text-primary hover:underline font-bold"
                      >
                        {selectedProductIds.length === productsList.length ? "Deselect All" : "Select All Products"}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[150px] overflow-y-auto p-1 border border-zinc-100 dark:border-zinc-900 rounded-lg scrollbar-thin">
                      {productsList.map(prod => (
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
                            <p className="text-[8.5px] text-zinc-450 leading-none mt-0.5 font-mono">₹{prod.basePrice}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Preview Column */}
            <div className="lg:col-span-1 space-y-4">
              <div className="p-4 bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-4 sticky top-0">
                <div className="flex items-center gap-1.5 text-[9.5px] uppercase font-bold text-zinc-400">
                  <Check size={14} className="text-emerald-500" />
                  <span>Copy Configuration Summary</span>
                </div>

                {/* Arrow visual */}
                <div className="p-3.5 bg-white dark:bg-zinc-950 rounded-xl border border-zinc-100 dark:border-zinc-850 flex items-center justify-between font-bold">
                  <div>
                    <span className="text-[8px] text-zinc-400 uppercase font-semibold">Source Store</span>
                    <p className="text-zinc-900 dark:text-white mt-0.5">{sourceStoreId ? storesList.find(s => s._id === sourceStoreId)?.storeName.replace("Papa Veg Pizza - ", "") : "None Selected"}</p>
                  </div>
                  <ChevronRight size={16} className="text-primary animate-pulse" />
                  <div className="text-right">
                    <span className="text-[8px] text-zinc-400 uppercase font-semibold">Dest. Stores</span>
                    <p className="text-zinc-900 dark:text-white mt-0.5">{destinationStoreIds.length} Stores</p>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-2 text-center font-bold">
                  <div className="p-2 bg-white dark:bg-zinc-950 rounded-xl border border-zinc-100 dark:border-zinc-850">
                    <span className="text-[8px] text-zinc-400 uppercase font-semibold">Products</span>
                    <p className="text-zinc-950 dark:text-white text-base font-black mt-0.5">
                      {copyAllProducts ? productsList.length : selectedProductIds.length}
                    </p>
                  </div>
                  <div className="p-2 bg-white dark:bg-zinc-950 rounded-xl border border-zinc-100 dark:border-zinc-850">
                    <span className="text-[8px] text-zinc-400 uppercase font-semibold">Overwrites</span>
                    <p className="text-zinc-950 dark:text-white text-base font-black mt-0.5">{totalAffected}</p>
                  </div>
                </div>

                {/* Warning panel */}
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/35 rounded-xl flex items-start gap-2 text-amber-750 dark:text-amber-400 text-[10px] leading-relaxed">
                  <AlertTriangle size={15} className="shrink-0 mt-0.5 text-amber-500 animate-pulse" />
                  <span>
                    Warning: Executing "Copy Prices" will completely mirror all overrides, delivery parameters, and special promo dates of the source store onto selected destinations. Existing values will be overridden.
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
              disabled={copyPricingMutation.isLoading || !sourceStoreId || destinationStoreIds.length === 0 || (!copyAllProducts && selectedProductIds.length === 0)}
              className={`px-5 py-2 text-white font-black rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 ${
                !sourceStoreId || destinationStoreIds.length === 0 || (!copyAllProducts && selectedProductIds.length === 0)
                  ? "bg-zinc-300 dark:bg-zinc-800 text-zinc-400 opacity-60 cursor-not-allowed"
                  : "bg-primary hover:bg-primary/95 shadow-primary/10"
              }`}
            >
              Copy Prices
            </button>
          </footer>

        </div>
      </div>
    </div>
  );
}
