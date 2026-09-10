import React, { useEffect, useState } from "react";
import { X, Copy, Check, AlertCircle } from "lucide-react";
import { mockCategories } from "../mockProducts";
import { toast } from "sonner";

export default function DuplicateProductModal({ isOpen, onClose, product, onSubmit }) {
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [copyVariants, setCopyVariants] = useState(true);
  const [copyImages, setCopyImages] = useState(true);
  const [copyAddons, setCopyAddons] = useState(true);

  useEffect(() => {
    if (product) {
      setName(`Copy of ${product.name}`);
      setCategoryId(product.categoryId);
      // Auto generate new SKU
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      const cleanBaseSku = product.sku ? product.sku.split("-")[0] : "PVP";
      setSku(`${cleanBaseSku}-DUP-${randomSuffix}`);
    }
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  const handleNameChange = (e) => {
    const newName = e.target.value;
    setName(newName);
    
    // Auto update SKU base
    const cleanBaseSku = product.sku ? product.sku.split("-")[0] : "PVP";
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    setSku(`${cleanBaseSku}-DUP-${randomSuffix}`);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a duplicate name");
      return;
    }

    const payload = {
      originalProductId: product._id,
      name,
      sku,
      categoryId,
      copyVariants,
      copyImages,
      copyAddons
    };

    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-40 overflow-hidden text-xs">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/45 backdrop-blur-xs z-40 animate-fade-in" onClick={onClose} />

      {/* Modal */}
      <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-up font-semibold text-zinc-750 dark:text-zinc-350">
          
          {/* Header */}
          <header className="p-3.5 border-b border-zinc-150 dark:border-zinc-850 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/30">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-[var(--primary)] text-white rounded-lg"><Copy size={13} /></span>
              <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white">
                Duplicate Pizza Product
              </h3>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400">
              <X size={14} />
            </button>
          </header>

          <form onSubmit={handleFormSubmit} className="p-4 space-y-4">
            
            {/* Original product preview */}
            <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-xl space-y-1 text-[10.5px]">
              <p className="text-zinc-400 font-bold uppercase tracking-wider text-[8px]">Original Product Details</p>
              <p className="text-zinc-900 dark:text-zinc-100 font-extrabold">{product.name}</p>
              <p className="font-mono text-zinc-500">SKU: {product.sku || "-"}</p>
            </div>

            <div className="space-y-1">
              <label className="block text-zinc-500 font-bold">New Product Name *</label>
              <input
                type="text"
                value={name}
                onChange={handleNameChange}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[var(--primary)] text-zinc-850 dark:text-zinc-200"
                placeholder="e.g. Copy of Double Cheese Margherita"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-zinc-500 font-bold">New SKU *</label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[var(--primary)] text-zinc-850 dark:text-zinc-100 font-mono"
                placeholder="e.g. PVP-MARG-MED-DUP"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-zinc-500 font-bold">Category *</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[var(--primary)] text-zinc-800 dark:text-zinc-250 cursor-pointer"
              >
                {mockCategories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Checkboxes */}
            <div className="p-3 border border-zinc-150 dark:border-zinc-850 bg-zinc-50/20 dark:bg-zinc-950/20 rounded-2xl space-y-2.5 font-bold">
              <label className="flex items-center justify-between cursor-pointer">
                <span>Copy all Variants</span>
                <input
                  type="checkbox"
                  checked={copyVariants}
                  onChange={(e) => setCopyVariants(e.target.checked)}
                  className="rounded border-zinc-300 dark:border-zinc-700 bg-zinc-50 w-3.5 h-3.5 text-[var(--primary)] focus:ring-[var(--primary)]"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span>Copy Thumbnail & Gallery Images</span>
                <input
                  type="checkbox"
                  checked={copyImages}
                  onChange={(e) => setCopyImages(e.target.checked)}
                  className="rounded border-zinc-300 dark:border-zinc-700 bg-zinc-50 w-3.5 h-3.5 text-[var(--primary)] focus:ring-[var(--primary)]"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span>Copy associated Add-on Items</span>
                <input
                  type="checkbox"
                  checked={copyAddons}
                  onChange={(e) => setCopyAddons(e.target.checked)}
                  className="rounded border-zinc-300 dark:border-zinc-700 bg-zinc-50 w-3.5 h-3.5 text-[var(--primary)] focus:ring-[var(--primary)]"
                />
              </label>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-black rounded-lg shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Check size={13} />
                <span>Create Duplicate</span>
              </button>
            </div>

          </form>

        </div>
      </div>
    </div>
  );
}
