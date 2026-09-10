import React from "react";
import { X, Grid, TrendingUp, Info, ShoppingBag, Store, Heart, Star, Check, AlertCircle } from "lucide-react";
import { useCategoryDetails } from "../hooks/useCategoryDetails";
import * as Icons from "lucide-react";

export default function CategoryDrawer({ isOpen, onClose, categoryId, parentCategories = [] }) {
  const { data: response, isLoading } = useCategoryDetails(categoryId);
  const category = response?.data;

  if (!isOpen) return null;

  const renderCategoryIcon = (iconName) => {
    const LucideIcon = Icons[iconName] || Grid;
    return <LucideIcon size={16} className="text-zinc-550 shrink-0" />;
  };

  const getParentName = (parentId) => {
    if (!parentId) return "None";
    return parentCategories.find((c) => c._id === parentId)?.name || parentId;
  };

  return (
    <div className="fixed inset-0 z-40 overflow-hidden text-xs">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/45 backdrop-blur-xs transition-opacity z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Slide-out Panel Container */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10 z-50 animate-slide-in">
        <div className="w-screen max-w-[650px] h-full bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col overflow-hidden">
          
          {/* Header */}
          <header className="p-4 border-b border-zinc-150 dark:border-zinc-850 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/30">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[var(--primary)] text-white rounded-xl shadow-sm">
                <Grid size={18} />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                  Category Particulars
                </h3>
                <p className="text-[10px] text-zinc-400 font-bold mt-0.5">
                  Analyze metadata, subcategories, store overrides, and top-selling items.
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </header>

          {/* Body Content */}
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-3 bg-white dark:bg-zinc-950">
              <div className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
              <p className="font-extrabold text-zinc-450">Loading category specifications...</p>
            </div>
          ) : category ? (
            <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin dark:text-zinc-350">
              
              {/* Section 1: Visual Assets & Category Information */}
              <div className="space-y-4">
                <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover select-none"
                    onError={(e) => {
                      e.target.src = "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80";
                    }}
                  />
                  
                  {/* Overlays */}
                  <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-[9.5px] font-black border tracking-wide uppercase shadow-sm ${
                    category.status === "ACTIVE" 
                      ? "text-emerald-700 bg-emerald-50 border-emerald-300"
                      : "text-zinc-700 bg-zinc-100 border-zinc-300 dark:bg-zinc-850"
                  }`}>
                    {category.status}
                  </span>

                  {category.isFeatured && (
                    <span className="absolute top-3 right-3 px-3 py-1 rounded-full text-[9.5px] font-black border tracking-wide uppercase bg-purple-500 text-white border-transparent shadow-sm flex items-center gap-0.5">
                      <Star size={11} className="fill-current" />
                      <span>Featured</span>
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {renderCategoryIcon(category.icon)}
                    <h2 className="text-base font-black text-zinc-900 dark:text-white leading-tight">
                      {category.name}
                    </h2>
                  </div>
                  <p className="text-[10px] text-zinc-450 font-bold uppercase tracking-wider font-mono">
                    Slug ID: /{category.slug} • Order Index: #{category.displayOrder}
                  </p>
                </div>

                <div className="p-3.5 bg-zinc-50/50 dark:bg-zinc-900/25 border border-zinc-150 dark:border-zinc-850 rounded-xl leading-relaxed text-zinc-650 dark:text-zinc-400 font-bold">
                  <span className="text-[9.5px] uppercase font-bold text-zinc-400 block mb-1">Description</span>
                  {category.description || "No description provided for this category."}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 border border-zinc-150 dark:border-zinc-850 rounded-2xl flex flex-col justify-center">
                    <span className="text-[9.5px] uppercase font-bold text-zinc-400">Parent Category</span>
                    <span className="font-extrabold text-zinc-900 dark:text-white mt-1">
                      {getParentName(category.parentCategory)}
                    </span>
                  </div>
                  <div className="p-3 border border-zinc-150 dark:border-zinc-850 rounded-2xl flex flex-col justify-center">
                    <span className="text-[9.5px] uppercase font-bold text-zinc-400">Created Date</span>
                    <span className="font-extrabold text-zinc-900 dark:text-white mt-1">
                      {new Date(category.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric"
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 2: Statistics */}
              <div className="p-4 border border-zinc-150 dark:border-zinc-850 rounded-2xl space-y-4">
                <span className="text-[9.5px] uppercase font-bold text-zinc-400 block">Performance & Metrics</span>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-2.5 bg-zinc-50 dark:bg-zinc-900 rounded-xl text-center space-y-0.5">
                    <ShoppingBag size={14} className="mx-auto text-zinc-400" />
                    <p className="text-[8.5px] text-zinc-450 uppercase font-semibold">Total Products</p>
                    <p className="font-black text-zinc-800 dark:text-zinc-200 text-sm">
                      {category.stats?.productsCount || 0}
                    </p>
                  </div>
                  <div className="p-2.5 bg-zinc-50 dark:bg-zinc-900 rounded-xl text-center space-y-0.5">
                    <Grid size={14} className="mx-auto text-zinc-400" />
                    <p className="text-[8.5px] text-zinc-450 uppercase font-semibold">Subcategories</p>
                    <p className="font-black text-zinc-800 dark:text-zinc-200 text-sm">
                      {category.stats?.subcategoriesCount || 0}
                    </p>
                  </div>
                  <div className="p-2.5 bg-zinc-50 dark:bg-zinc-900 rounded-xl text-center space-y-0.5">
                    <TrendingUp size={14} className="mx-auto text-zinc-400" />
                    <p className="text-[8.5px] text-zinc-450 uppercase font-semibold">Total Sales</p>
                    <p className="font-black text-zinc-800 dark:text-zinc-200 text-sm">
                      {category.stats?.topProducts?.reduce((sum, p) => sum + p.salesCount, 0) || 0}
                    </p>
                  </div>
                  <div className="p-2.5 bg-zinc-50 dark:bg-zinc-900 rounded-xl text-center space-y-0.5">
                    <TrendingUp size={14} className="mx-auto text-zinc-400" />
                    <p className="text-[8.5px] text-zinc-450 uppercase font-semibold">Total Revenue</p>
                    <p className="font-black text-emerald-650 text-sm">
                      ₹{category.stats?.revenueGenerated || 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 3: Store Availability Overrides */}
              <div className="space-y-2">
                <span className="text-[9.5px] uppercase font-bold text-zinc-400 block">Franchise Store Availability</span>
                
                <div className="border border-zinc-150 dark:border-zinc-850 rounded-2xl overflow-hidden">
                  <table className="w-full text-left border-collapse text-[11px] font-bold">
                    <thead>
                      <tr className="bg-zinc-50/50 dark:bg-zinc-900/30 border-b border-zinc-150 dark:border-zinc-850 text-zinc-450 uppercase text-[9px] font-black tracking-wider">
                        <th className="px-4 py-2.5">Franchise Store</th>
                        <th className="px-4 py-2.5 text-center">Products Loaded</th>
                        <th className="px-4 py-2.5 text-right">Revenue (₹)</th>
                        <th className="px-4 py-2.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900 text-zinc-700 dark:text-zinc-300">
                      {category.stats?.storeAvailability?.map((sa) => (
                        <tr key={sa.storeId} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                          <td className="px-4 py-2.5 font-semibold text-zinc-900 dark:text-zinc-100">
                            {sa.storeName.replace("Papa Veg Pizza - ", "")}
                          </td>
                          <td className="px-4 py-2.5 text-center text-zinc-900 dark:text-zinc-200">
                            {sa.products} items
                          </td>
                          <td className="px-4 py-2.5 text-right font-black text-zinc-900 dark:text-zinc-100">
                            ₹{sa.revenue.toFixed(2)}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            {sa.available ? (
                              <span className="inline-flex p-1 bg-emerald-500/10 text-emerald-600 rounded-full"><Check size={11} /></span>
                            ) : (
                              <span className="inline-flex p-1 bg-red-500/10 text-red-650 rounded-full"><X size={11} /></span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 4: Top Products Cards */}
              <div className="space-y-3">
                <span className="text-[9.5px] uppercase font-bold text-zinc-400 block">Top Selling Products in Category</span>
                
                <div className="grid grid-cols-3 gap-3">
                  {category.stats?.topProducts?.map((p) => (
                    <div 
                      key={p._id}
                      className="border border-zinc-150 dark:border-zinc-850 rounded-xl overflow-hidden bg-white dark:bg-zinc-900/50 flex flex-col font-bold"
                    >
                      <div className="aspect-[4/3] bg-zinc-100 relative overflow-hidden">
                        <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-2 space-y-1.5 flex-1 flex flex-col justify-between">
                        <p className="text-[10px] text-zinc-900 dark:text-white truncate leading-tight">{p.name}</p>
                        
                        <div className="flex justify-between items-baseline pt-0.5">
                          <span className="text-[8.5px] text-zinc-450">{p.salesCount} sold</span>
                          <span className="text-[9.5px] font-black text-zinc-900 dark:text-zinc-105">₹{p.revenue}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!category.stats?.topProducts || category.stats.topProducts.length === 0) && (
                    <div className="col-span-3 p-6 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-400">
                      <AlertCircle size={14} className="mx-auto mb-1" />
                      <span>No products associated with this category.</span>
                    </div>
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center space-y-2 bg-white dark:bg-zinc-950">
              <AlertCircle size={28} className="text-zinc-350" />
              <p className="font-extrabold text-zinc-450">Unable to retrieve category details.</p>
            </div>
          )}

          {/* Footer */}
          <footer className="p-4 border-t border-zinc-100 dark:border-zinc-850 flex justify-end bg-zinc-50/30 dark:bg-zinc-900/10 shrink-0">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-zinc-950 dark:bg-zinc-800 hover:bg-zinc-850 dark:hover:bg-zinc-700 text-white font-bold rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer text-xs"
            >
              Close Details
            </button>
          </footer>

        </div>
      </div>
    </div>
  );
}
