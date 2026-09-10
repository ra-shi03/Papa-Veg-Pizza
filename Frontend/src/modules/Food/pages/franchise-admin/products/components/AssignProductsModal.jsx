import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, Search, Sparkles, AlertCircle, Check } from "lucide-react";
import { useAssignedProducts } from "../hooks/useAssignedProducts";
import { mockCategories } from "../mockProducts";

export default function AssignProductsModal({ isOpen, onClose, onSubmit, addon }) {
  const { data: response, isLoading } = useAssignedProducts(addon?._id);
  const productsList = response?.data || [];

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [selectedProductIds, setSelectedProductIds] = useState([]);

  // Pre-fill selected state when data loads
  useEffect(() => {
    if (isOpen && productsList.length > 0) {
      const assignedIds = productsList.filter((p) => p.isAssigned).map((p) => p._id);
      setSelectedProductIds(assignedIds);
    }
  }, [isOpen, productsList]);

  if (!isOpen || !addon) return null;

  const handleToggleSelectAll = (checked, list) => {
    if (checked) {
      // Add all currently filtered product IDs
      const filteredIds = list.map((p) => p._id);
      setSelectedProductIds(Array.from(new Set([...selectedProductIds, ...filteredIds])));
    } else {
      // Remove all currently filtered product IDs
      const filteredIds = list.map((p) => p._id);
      setSelectedProductIds(selectedProductIds.filter((id) => !filteredIds.includes(id)));
    }
  };

  const handleToggleProduct = (productId) => {
    const isSelected = selectedProductIds.includes(productId);
    if (isSelected) {
      setSelectedProductIds(selectedProductIds.filter((id) => id !== productId));
    } else {
      setSelectedProductIds([...selectedProductIds, productId]);
    }
  };

  const handleSave = () => {
    onSubmit(addon._id, selectedProductIds);
  };

  // Filter listed products based on local search & category dropdown
  const filteredProducts = productsList.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase().trim());
    const matchesCategory = categoryId === "all" || p.categoryId === categoryId;
    return matchesSearch && matchesCategory;
  });

  const originalAssignedCount = productsList.filter((p) => p.isAssigned).length;
  const isAllChecked = filteredProducts.length > 0 && filteredProducts.every((p) => selectedProductIds.includes(p._id));

  return (
    <div className="fixed inset-0 z-40 overflow-hidden text-xs font-semibold text-zinc-700 dark:text-zinc-350">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/45 backdrop-blur-xs z-40 animate-fade-in" onClick={onClose} />

      {/* Modal Container */}
      <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-[1000px] h-[85vh] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-up">
          
          {/* Header */}
          <header className="p-4 border-b border-zinc-150 dark:border-zinc-850 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/30">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-blue-650 text-white rounded-lg"><Sparkles size={14} /></span>
              <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white">
                Assign Add-on to Products
              </h3>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400 cursor-pointer">
              <X size={15} />
            </button>
          </header>

          {/* Body Content */}
          <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12">
            
            {/* Left Column: Products Listing (8 cols) */}
            <div className="md:col-span-8 flex flex-col h-full border-r border-zinc-200 dark:border-zinc-800 p-4 space-y-4">
              
              {/* Search & Category Selector */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={13} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search signature products..."
                    className="w-full pl-8.5 pr-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[var(--primary)] text-zinc-850 dark:text-zinc-200"
                  />
                </div>

                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[var(--primary)] text-zinc-700 dark:text-zinc-350 cursor-pointer font-bold"
                >
                  <option value="all">All Categories</option>
                  {mockCategories.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Table Container */}
              <div className="flex-1 overflow-y-auto border border-zinc-150 dark:border-zinc-850 rounded-xl scrollbar-thin">
                {isLoading ? (
                  <div className="h-full flex flex-col items-center justify-center space-y-2">
                    <div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                    <p className="text-zinc-450 font-bold">Loading product catalog...</p>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-400 space-y-2 p-8 text-center">
                    <AlertCircle size={24} />
                    <span>No products found matching filters.</span>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse text-[11px] font-bold">
                    <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 text-zinc-450 uppercase text-[9px] tracking-wider font-black z-10">
                      <tr>
                        <th className="px-4 py-2.5 w-12 text-center">
                          <input
                            type="checkbox"
                            checked={isAllChecked}
                            onChange={(e) => handleToggleSelectAll(e.target.checked, filteredProducts)}
                            className="rounded border-zinc-300 dark:border-zinc-700 bg-zinc-50 w-3.5 h-3.5 text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer"
                          />
                        </th>
                        <th className="px-4 py-2.5 w-16">Image</th>
                        <th className="px-4 py-2.5">Product Name</th>
                        <th className="px-4 py-2.5">Category</th>
                        <th className="px-4 py-2.5">Mapped Add-ons</th>
                        <th className="px-4 py-2.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900 text-zinc-750 dark:text-zinc-300">
                      {filteredProducts.map((p) => {
                        const isChecked = selectedProductIds.includes(p._id);
                        return (
                          <tr
                            key={p._id}
                            onClick={() => handleToggleProduct(p._id)}
                            className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 cursor-pointer transition-colors"
                          >
                            <td className="px-4 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleProduct(p._id)}
                                className="rounded border-zinc-300 dark:border-zinc-700 bg-zinc-50 w-3.5 h-3.5 text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <div className="w-8 h-8 rounded-lg overflow-hidden bg-zinc-100 border border-zinc-200">
                                <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                              </div>
                            </td>
                            <td className="px-4 py-2 font-extrabold text-zinc-900 dark:text-white truncate max-w-[140px]">{p.name}</td>
                            <td className="px-4 py-2 text-zinc-450">{p.category}</td>
                            <td className="px-4 py-2">
                              <div className="flex flex-wrap gap-0.5 max-w-[180px]">
                                {p.currentAddons.map((ad, i) => (
                                  <span key={i} className="px-1 py-0.2 bg-zinc-105 dark:bg-zinc-800 rounded font-semibold text-[8px] text-zinc-500">
                                    {ad}
                                  </span>
                                ))}
                                {p.currentAddons.length === 0 && (
                                  <span className="text-zinc-400 italic text-[9.5px] font-medium">-</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-2 text-center">
                              <span className={`px-2 py-0.2 rounded-full text-[8.5px] border ${
                                p.status === "ACTIVE" 
                                  ? "text-emerald-700 bg-emerald-50 border-emerald-250" 
                                  : "text-zinc-500 bg-zinc-100 border-zinc-250"
                              }`}>
                                {p.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

            </div>

            {/* Right Column: Mapping Summary Panel (4 cols) */}
            <div className="md:col-span-4 bg-zinc-50 dark:bg-zinc-900/60 p-4 flex flex-col justify-between h-full font-bold">
              <div className="space-y-4">
                <span className="text-[9.5px] uppercase font-bold text-zinc-400 block text-center">Assign Details</span>
                
                <div className="bg-white dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 rounded-2xl p-4 shadow-sm space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-100 shrink-0">
                      <img src={addon.image} alt={addon.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[8.5px] text-zinc-400 uppercase font-semibold block leading-none">Mapping Option</span>
                      <h4 className="text-zinc-900 dark:text-white font-extrabold text-xs truncate mt-0.5">{addon.name}</h4>
                      <p className="text-[9.5px] text-emerald-650 font-black mt-0.5">₹{addon.price} • {addon.type}</p>
                    </div>
                  </div>

                  <div className="border-t border-zinc-100 dark:border-zinc-900 pt-3 space-y-2 text-[10.5px] leading-relaxed">
                    <div className="flex justify-between">
                      <span className="text-zinc-450 font-semibold">Previously Assigned:</span>
                      <span className="text-zinc-800 dark:text-zinc-200 font-extrabold">{originalAssignedCount} products</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-450 font-semibold">New Assignments Count:</span>
                      <span className="text-zinc-900 dark:text-white font-black">{selectedProductIds.length} products</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 rounded-2xl p-3 shadow-xs max-h-[220px] overflow-y-auto scrollbar-thin space-y-2">
                  <span className="text-[8.5px] text-zinc-400 uppercase font-semibold block">Included Products Summary</span>
                  <div className="space-y-1.5">
                    {selectedProductIds.map((pid) => {
                      const matched = productsList.find((p) => p._id === pid);
                      return matched ? (
                        <div key={pid} className="flex items-center justify-between text-[9.5px] text-zinc-850 dark:text-zinc-200 font-semibold">
                          <span className="truncate max-w-[130px]">{matched.name}</span>
                          <span className="px-1.5 py-0.2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 rounded text-[8px] font-bold border border-emerald-200">ASSIGNED</span>
                        </div>
                      ) : null;
                    })}
                    {selectedProductIds.length === 0 && (
                      <span className="text-zinc-400 italic text-[10px] font-semibold">No products assigned yet.</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 text-[10px] text-zinc-400 leading-normal">
                <div className="p-2.5 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/35 rounded-xl flex items-start gap-2">
                  <Check size={14} className="text-blue-550 shrink-0 mt-0.5" />
                  <span>Assigning this add-on to products will display it as an selectable option on their detail customization menus.</span>
                </div>
              </div>

            </div>

          </div>

          {/* Footer Buttons */}
          <footer className="p-4 border-t border-zinc-100 dark:border-zinc-850 flex justify-end gap-2 bg-zinc-50/30 dark:bg-zinc-900/10 shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-950 rounded-xl font-bold cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 bg-blue-650 hover:bg-blue-700 text-white font-black rounded-xl shadow-md cursor-pointer transition-all active:scale-[0.98]"
            >
              Assign Selected
            </button>
          </footer>

        </div>
      </div>
    </div>
  );
}
