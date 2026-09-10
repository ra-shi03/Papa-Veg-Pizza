import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, ArrowUp, ArrowDown, CheckCircle, Search } from "lucide-react";

export default function ProductMappingModal({
  isOpen,
  onClose,
  addon,
  products = [],
  categories = [],
  initialMappings = [],
  onSave
}) {
  const [mappings, setMappings] = useState([]);
  const [selectedProductToAdd, setSelectedProductToAdd] = useState("");
  const [isRequiredNew, setIsRequiredNew] = useState(false);
  const [displayOrderNew, setDisplayOrderNew] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (isOpen && addon) {
      // Filter initial mappings for this addon
      const addonMappings = initialMappings.filter(m => m.addonId === addon._id);
      setMappings(addonMappings);
      setSelectedProductToAdd("");
      setIsRequiredNew(false);
      setDisplayOrderNew(1);
    }
  }, [isOpen, addon, initialMappings]);

  if (!isOpen || !addon) return null;

  const handleAddMapping = () => {
    if (!selectedProductToAdd) return;

    // Check if mapping already exists
    if (mappings.some(m => m.productId === selectedProductToAdd)) {
      alert("This product is already mapped to this add-on.");
      return;
    }

    const newMapping = {
      _id: `pa_${Date.now()}`,
      productId: selectedProductToAdd,
      addonId: addon._id,
      isRequired: isRequiredNew,
      displayOrder: parseInt(displayOrderNew) || 1
    };

    setMappings([...mappings, newMapping]);
    setSelectedProductToAdd("");
    setIsRequiredNew(false);
    setDisplayOrderNew(mappings.length + 2);
  };

  const handleRemoveMapping = (mappingId) => {
    setMappings(mappings.filter(m => m._id !== mappingId));
  };

  const handleToggleRequired = (mappingId) => {
    setMappings(
      mappings.map(m => (m._id === mappingId ? { ...m, isRequired: !m.isRequired } : m))
    );
  };

  const handleChangeDisplayOrder = (mappingId, order) => {
    setMappings(
      mappings.map(m => (m._id === mappingId ? { ...m, displayOrder: parseInt(order) || 1 } : m))
    );
  };

  const handleBulkAssign = (categoryName) => {
    const productsInCategory = products.filter(p => p.category === categoryName);
    const newMappingsList = [...mappings];

    productsInCategory.forEach(prod => {
      if (!newMappingsList.some(m => m.productId === prod.id)) {
        newMappingsList.push({
          _id: `pa_${Date.now()}_${prod.id}`,
          productId: prod.id,
          addonId: addon._id,
          isRequired: false,
          displayOrder: newMappingsList.length + 1
        });
      }
    });

    setMappings(newMappingsList);
  };

  const handleSaveMappings = () => {
    onSave?.(addon._id, mappings);
    onClose();
  };

  // Filter products that are not yet mapped
  const unmappedProducts = products.filter(
    p => !mappings.some(m => m.productId === p.id)
  );

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <span>Manage Product Mapping</span>
              <span className="text-[10px] bg-[var(--primary)]/10 text-[var(--primary)] px-2 py-0.5 rounded font-black">
                {addon.name}
              </span>
            </h3>
            <p className="text-[10px] text-zinc-500 mt-0.5">Link customizations to specific store products.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-150 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-500"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1 hide-scrollbar">
          
          {/* Mapping Builder Form */}
          <div className="p-3 bg-zinc-50 dark:bg-zinc-900/40 rounded-lg border border-zinc-150 dark:border-zinc-800 space-y-3">
            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">
              Add Product Assignment
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-end">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[9px] font-bold text-zinc-400 uppercase block">Select Product</label>
                <select
                  value={selectedProductToAdd}
                  onChange={(e) => setSelectedProductToAdd(e.target.value)}
                  className="w-full h-8 px-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs outline-none focus:border-[var(--primary)] text-zinc-900 dark:text-zinc-100 font-semibold"
                >
                  <option value="">-- Choose Product --</option>
                  {unmappedProducts.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-zinc-400 uppercase block">Display Order</label>
                <input
                  type="number"
                  min="1"
                  value={displayOrderNew}
                  onChange={(e) => setDisplayOrderNew(e.target.value)}
                  className="w-full h-8 px-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs outline-none focus:border-[var(--primary)] text-zinc-900 dark:text-zinc-100 font-semibold font-mono"
                />
              </div>

              <div className="flex items-center gap-2 h-8">
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  <input
                    type="checkbox"
                    checked={isRequiredNew}
                    onChange={(e) => setIsRequiredNew(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-300 text-[var(--primary)] focus:ring-[var(--primary)]/20 cursor-pointer"
                  />
                  <span>Required?</span>
                </label>
                <button
                  type="button"
                  onClick={handleAddMapping}
                  className="ml-auto h-8 px-3.5 bg-[var(--primary)] text-white font-bold text-xs rounded-lg shadow-sm hover:brightness-110 flex items-center justify-center gap-1 active:scale-95 transition-all"
                >
                  <Plus size={12} />
                  Add
                </button>
              </div>
            </div>

            {/* Bulk Assign Shortcut */}
            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center flex-wrap gap-2">
              <span className="text-[9px] font-bold text-zinc-400 uppercase">Bulk Assign Category:</span>
              {categories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleBulkAssign(cat)}
                  className="px-2 py-0.5 text-[9px] font-bold border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded hover:border-[var(--primary)] text-zinc-650 dark:text-zinc-300 hover:text-[var(--primary)] dark:hover:text-[var(--primary)] transition-all"
                >
                  + All {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Current Mappings Table */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">
              Current Mapped Products ({mappings.length})
            </h4>

            {mappings.length > 0 ? (
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 font-bold text-zinc-500">
                    <tr>
                      <th className="px-3 py-2">Product Name</th>
                      <th className="px-3 py-2">Category</th>
                      <th className="px-3 py-2 text-center w-24">Required</th>
                      <th className="px-3 py-2 text-center w-24">Display Order</th>
                      <th className="px-3 py-2 text-center w-16">Remove</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
                    {mappings.map((m) => {
                      const productObj = products.find(p => p.id === m.productId);
                      return (
                        <tr key={m._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
                          <td className="px-3 py-2 font-bold">{productObj?.name || m.productId}</td>
                          <td className="px-3 py-2 font-semibold text-zinc-500">{productObj?.category || "N/A"}</td>
                          <td className="px-3 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={m.isRequired}
                              onChange={() => handleToggleRequired(m._id)}
                              className="w-4 h-4 rounded border-zinc-300 text-[var(--primary)] focus:ring-[var(--primary)]/20 cursor-pointer mx-auto"
                            />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <input
                              type="number"
                              min="1"
                              value={m.displayOrder}
                              onChange={(e) => handleChangeDisplayOrder(m._id, e.target.value)}
                              className="w-14 h-7 text-center border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 rounded text-xs font-mono font-bold outline-none focus:border-[var(--primary)]"
                            />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveMapping(m._id)}
                              className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-6 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-400">
                <p className="text-xs font-semibold">No products currently assigned to this add-on.</p>
                <p className="text-[10px] mt-0.5">Use the form above to map this topping to pizza menu items.</p>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-900/60 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2 shrink-0">
          <button
            onClick={onClose}
            className="px-3 py-1.5 border border-zinc-300 dark:border-zinc-750 text-zinc-700 dark:text-zinc-300 font-bold text-xs rounded-lg hover:bg-zinc-150 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveMappings}
            className="px-4 py-1.5 bg-[var(--primary)] text-white font-bold text-xs rounded-lg shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5"
          >
            <CheckCircle size={12} />
            Save Mappings
          </button>
        </div>
      </div>
    </div>
  );
}
