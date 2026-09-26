import React from "react";
import { X, Calendar, Check, Leaf } from "lucide-react";

export default function ProductsDetail({ isOpen, onClose, product }) {
  if (!isOpen || !product) return null;

  const isVeg = product.vegType !== "non-veg";

  return (
    <div className="fixed inset-0 z-[70] bg-black/45 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="w-full md:w-[500px] h-full bg-white dark:bg-zinc-950 shadow-2xl flex flex-col transform transition-transform duration-300 animate-in slide-in-from-right">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between sticky top-0 bg-white dark:bg-zinc-950 z-10">
          <div className="flex flex-col min-w-0">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 truncate">
              Product Details
            </h3>
            <span className="text-zinc-500 text-[10px] font-mono mt-0.5">
              ID: {product._id || product.id}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-850 rounded-full transition-colors text-zinc-500"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700">
          
          {/* Image & Basic */}
          <div className="flex flex-col md:flex-row gap-5 items-start">
            <div className="w-full md:w-32 h-32 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shrink-0">
              {product.image ? (
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-400 text-xs">No Image</div>
              )}
            </div>
            <div className="flex flex-col gap-2 w-full">
              <div className="flex justify-between items-start w-full">
                <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100">{product.name}</h2>
                <div className={`w-4 h-4 border-2 flex items-center justify-center rounded-sm shrink-0 ${isVeg ? "border-green-600" : "border-red-600"}`}>
                  <div className={`w-2 h-2 rounded-full ${isVeg ? "bg-green-600" : "bg-red-600"}`} />
                </div>
              </div>
              <div className="flex gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  product.status === "Active" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                }`}>
                  {product.status || "Active"}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                  {product.vegType}
                </span>
              </div>
              <p className="text-xl font-black text-[var(--primary)] mt-1">₹{product.price}</p>
            </div>
          </div>

          <hr className="border-zinc-200 dark:border-zinc-800" />

          {/* Classification */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Category</p>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{product.categoryId?.label || product.category || "-"}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Section</p>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{product.sectionId?.name || product.section || "-"}</p>
            </div>
          </div>

          <hr className="border-zinc-200 dark:border-zinc-800" />

          {/* Descriptions */}
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Short Description</p>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900 p-3 rounded-lg border border-zinc-100 dark:border-zinc-850">
                {product.shortDescription || "No short description provided."}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Full Description</p>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900 p-3 rounded-lg border border-zinc-100 dark:border-zinc-850">
                {product.description || "No detailed description provided."}
              </p>
            </div>
          </div>

          <hr className="border-zinc-200 dark:border-zinc-800" />

          {/* Sizes and Pricing */}
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-3">Sizes & Pricing</p>
            {product.sizes && product.sizes.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {product.sizes.map((sz, i) => (
                  <div key={i} className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 flex flex-col justify-center bg-zinc-50 dark:bg-zinc-900">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{sz.size}</span>
                      <span className="text-sm font-black text-zinc-900 dark:text-zinc-100">₹{sz.price}</span>
                    </div>
                    {sz.description && <span className="text-[10px] text-zinc-500">{sz.description}</span>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500 italic">No custom sizes available.</p>
            )}
          </div>

          <hr className="border-zinc-200 dark:border-zinc-800" />

          {/* Availability */}
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-3">Availability</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Franchises</p>
                {product.franchiseIds && product.franchiseIds.length > 0 ? (
                  <div className="flex flex-col gap-1">
                    {product.franchiseIds.map((f, i) => {
                      const fname = typeof f === 'object' ? (f.franchiseName || f.companyName || f.name) : f;
                      return <span key={i} className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">{fname}</span>;
                    })}
                  </div>
                ) : (
                  <p className="text-[11px] text-emerald-600 font-semibold">Global (All Franchises)</p>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Stores</p>
                {product.storeIds && product.storeIds.length > 0 ? (
                  <div className="flex flex-col gap-1">
                    {product.storeIds.map((s, i) => {
                      const sname = typeof s === 'object' ? (s.storeName || s.name) : s;
                      return <span key={i} className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">{sname}</span>;
                    })}
                  </div>
                ) : (
                  <p className="text-[11px] text-emerald-600 font-semibold">All Stores</p>
                )}
              </div>
            </div>
          </div>

          <hr className="border-zinc-200 dark:border-zinc-800" />

          {/* Toppings */}
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-3">Custom Toppings</p>
            {product.toppings && product.toppings.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {product.toppings.map((t, i) => {
                  const toppingName = typeof t === 'object' ? t.name : (typeof t === 'string' && t.length === 24 ? "Topping (ID)" : t);
                  return (
                    <span key={i} className="px-2.5 py-1 text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded border border-zinc-200 dark:border-zinc-700 flex items-center gap-1.5">
                      <Check size={12} className="text-[var(--primary)]" />
                      {toppingName}
                    </span>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-zinc-500 italic">No custom toppings enabled.</p>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-between text-xs text-zinc-500 font-semibold">
          <div className="flex items-center gap-1.5">
            <Calendar size={14} />
            <span>Created: {product.createdAt ? new Date(product.createdAt).toLocaleDateString('en-GB') : "N/A"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar size={14} />
            <span>Updated: {product.updatedAt ? new Date(product.updatedAt).toLocaleDateString('en-GB') : "N/A"}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
