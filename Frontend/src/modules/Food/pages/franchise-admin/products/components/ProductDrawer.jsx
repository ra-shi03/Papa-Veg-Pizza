import React, { useState, useEffect } from "react";
import { X, Pizza, Leaf, Flame, ShieldAlert, Sparkles, Clock, Compass, HelpCircle } from "lucide-react";
import { useProductDetails } from "../hooks/useProductDetails";
import { mockCategories, mockTaxCategories } from "../mockProducts";
import { useStores } from "@food/pages/franchise-admin/orders/ordersQuery"; // Reuse stores query from order module

export default function ProductDrawer({ isOpen, onClose, productId }) {
  const { data: product, isLoading } = useProductDetails(productId);
  const { data: storesList } = useStores();
  const [activeImage, setActiveImage] = useState("");

  // Set initial main image when product loads
  useEffect(() => {
    if (product?.image) {
      setActiveImage(product.image);
    }
  }, [product]);

  if (!isOpen) return null;

  const getCategoryName = (catId) => {
    return mockCategories.find((c) => c.id === catId)?.name || catId;
  };

  const getTaxCategoryName = (taxId) => {
    return mockTaxCategories.find((t) => t.id === taxId)?.name || taxId;
  };

  // Get pricing and availability status for a store
  const getStorePricingDetails = (storeId) => {
    if (!product) return { available: true, price: 0 };
    
    // Check if store pricing override exists
    const override = product.pricing?.find((sp) => sp.storeId === storeId);
    
    if (override) {
      return {
        available: override.status === "ACTIVE",
        price: override.price
      };
    }

    // Default to product base price
    return {
      available: true,
      price: product.basePrice
    };
  };

  return (
    <div className="fixed inset-0 z-40 overflow-hidden text-xs">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/45 backdrop-blur-xs transition-opacity z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Slide-out Panel Container */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10 z-50">
        <div className="w-screen max-w-[650px] h-full bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col animate-slide-in">
          
          {/* Header */}
          <header className="p-4 border-b border-zinc-150 dark:border-zinc-850 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/30">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[var(--primary)] text-white rounded-xl shadow-sm">
                <Pizza size={18} />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                  Product Specifications
                </h3>
                {product && (
                  <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">
                    SKU: {product.sku} • {getCategoryName(product.categoryId)}
                  </p>
                )}
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
              <p className="font-extrabold text-zinc-450">Loading product particulars...</p>
            </div>
          ) : product ? (
            <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin dark:text-zinc-350">
              
              {/* Section 1: Images Gallery Slider & Title */}
              <div className="space-y-4">
                <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <img
                    src={activeImage}
                    alt={product.name}
                    className="w-full h-full object-cover select-none"
                    onError={(e) => {
                      e.target.src = "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80";
                    }}
                  />
                  
                  {/* Status Overlay Badge */}
                  <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-[9.5px] font-black border tracking-wide uppercase shadow-sm ${
                    product.status === "ACTIVE" 
                      ? "text-emerald-700 bg-emerald-50 border-emerald-300"
                      : "text-zinc-700 bg-zinc-100 border-zinc-300 dark:bg-zinc-850"
                  }`}>
                    {product.status}
                  </span>

                  {product.isBestSeller && (
                    <span className="absolute top-3 right-3 px-3 py-1 rounded-full text-[9.5px] font-black border tracking-wide uppercase bg-orange-500 text-white border-transparent shadow-sm flex items-center gap-0.5">
                      <Sparkles size={11} className="fill-current" />
                      <span>Best Seller</span>
                    </span>
                  )}
                </div>

                {/* Thumbnails list */}
                {product.galleryImages && product.galleryImages.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {/* Include main image in list */}
                    {[product.image, ...product.galleryImages].filter(Boolean).map((imgUrl, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImage(imgUrl)}
                        className={`w-14 h-14 rounded-lg overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                          activeImage === imgUrl ? "border-[var(--primary)] scale-95" : "border-zinc-200 dark:border-zinc-800 opacity-70 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={imgUrl}
                          alt="Thumbnail"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=80&q=80";
                          }}
                        />
                      </button>
                    ))}
                  </div>
                )}

                <div>
                  <h2 className="text-base font-black text-zinc-900 dark:text-white leading-tight">
                    {product.name}
                  </h2>
                  <p className="text-zinc-500 font-bold mt-1 text-[10px] uppercase tracking-wider font-mono">
                    SKU: {product.sku}
                  </p>
                </div>

                {product.shortDescription && (
                  <div className="p-3 bg-zinc-50/50 dark:bg-zinc-900/25 border border-zinc-150 dark:border-zinc-850 rounded-xl leading-relaxed text-zinc-600 dark:text-zinc-400 font-bold">
                    {product.shortDescription}
                  </div>
                )}

                {product.description && (
                  <div className="space-y-1.5">
                    <span className="text-[9.5px] uppercase font-bold text-zinc-400">Detailed Description</span>
                    <p className="text-zinc-700 dark:text-zinc-300 font-medium leading-relaxed font-sans">
                      {product.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Section 2 & 3: Dietary Type & Base Pricing */}
              <div className="grid grid-cols-2 gap-4">
                
                {/* Dietary badge */}
                <div className="p-4 border border-zinc-150 dark:border-zinc-850 rounded-2xl space-y-2.5">
                  <span className="text-[9.5px] uppercase font-bold text-zinc-400">Dietary Classification</span>
                  <div>
                    {product.productType === "VEG" ? (
                      <span className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 font-extrabold border border-emerald-250/20 rounded-xl inline-flex items-center gap-1">
                        <Leaf size={12} className="fill-current" />
                        <span>VEGETARIAN ONLY</span>
                      </span>
                    ) : product.productType === "NON_VEG" ? (
                      <span className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 font-extrabold border border-rose-250/20 rounded-xl inline-flex items-center gap-1">
                        <Flame size={12} className="fill-current" />
                        <span>NON VEGETARIAN</span>
                      </span>
                    ) : (
                      <span className="px-3 py-1.5 bg-yellow-50 dark:bg-yellow-950/20 text-yellow-600 font-extrabold border border-yellow-250/20 rounded-xl inline-flex items-center gap-1">
                        <Pizza size={12} className="fill-current" />
                        <span>CONTAINS EGG</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Base price & GST */}
                <div className="p-4 border border-zinc-150 dark:border-zinc-850 rounded-2xl space-y-1">
                  <span className="text-[9.5px] uppercase font-bold text-zinc-400">Standard Pricing</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-black text-zinc-900 dark:text-white">
                      ₹{product.basePrice.toFixed(2)}
                    </span>
                    <span className="text-[9px] text-zinc-400 font-bold">Base Price</span>
                  </div>
                  <p className="text-[9px] text-zinc-450 font-bold">
                    Tax: {getTaxCategoryName(product.taxCategory)}
                  </p>
                </div>

              </div>

              {/* Section 4: Kitchen Information */}
              <div className="p-4 border border-zinc-150 dark:border-zinc-850 rounded-2xl space-y-4">
                <span className="text-[9.5px] uppercase font-bold text-zinc-400">Kitchen & Prep Information</span>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-2.5 bg-zinc-50 dark:bg-zinc-900 rounded-xl text-center">
                    <Clock size={14} className="mx-auto text-zinc-400 mb-1" />
                    <p className="text-[8.5px] text-zinc-400 uppercase font-semibold">Prep Time</p>
                    <p className="font-extrabold text-zinc-800 dark:text-zinc-200 mt-0.5">{product.preparationTime} Mins</p>
                  </div>
                  <div className="p-2.5 bg-zinc-50 dark:bg-zinc-900 rounded-xl text-center">
                    <Compass size={14} className="mx-auto text-zinc-400 mb-1" />
                    <p className="text-[8.5px] text-zinc-400 uppercase font-semibold">Energy</p>
                    <p className="font-extrabold text-zinc-800 dark:text-zinc-200 mt-0.5">{product.calories || "-"} Kcal</p>
                  </div>
                  <div className="p-2.5 bg-zinc-50 dark:bg-zinc-900 rounded-xl text-center">
                    <Flame size={14} className="mx-auto text-zinc-400 mb-1" />
                    <p className="text-[8.5px] text-zinc-400 uppercase font-semibold">Spice Level</p>
                    <p className="font-extrabold text-red-600 mt-0.5">{product.spiceLevel} / 5</p>
                  </div>
                </div>

                {/* Spice Slider Read-only indicator */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] text-zinc-400 font-bold">
                    <span>Mild</span>
                    <span>Fiery</span>
                  </div>
                  <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden flex">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600"
                      style={{ width: `${(product.spiceLevel / 5) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Section 5: Visibility & Configuration switches */}
              <div className="p-4 border border-zinc-150 dark:border-zinc-850 rounded-2xl space-y-3 font-bold">
                <span className="text-[9.5px] uppercase font-bold text-zinc-400">Visibility & Configuration Toggles</span>
                
                <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                  <div className={`p-2.5 rounded-xl border ${
                    product.isFeatured 
                      ? "border-emerald-250 bg-emerald-500/[0.03] text-emerald-600" 
                      : "border-zinc-200 dark:border-zinc-800 text-zinc-400"
                  }`}>
                    <p>Featured Product</p>
                    <p className="text-[9px] mt-1 font-black uppercase">{product.isFeatured ? "Yes ✔" : "No"}</p>
                  </div>

                  <div className={`p-2.5 rounded-xl border ${
                    product.isBestSeller 
                      ? "border-orange-250 bg-orange-500/[0.03] text-orange-600" 
                      : "border-zinc-200 dark:border-zinc-800 text-zinc-400"
                  }`}>
                    <p>Best Seller Tag</p>
                    <p className="text-[9px] mt-1 font-black uppercase">{product.isBestSeller ? "Yes ✔" : "No"}</p>
                  </div>

                  <div className={`p-2.5 rounded-xl border ${
                    product.isCustomizable 
                      ? "border-blue-250 bg-blue-500/[0.03] text-blue-600" 
                      : "border-zinc-200 dark:border-zinc-800 text-zinc-400"
                  }`}>
                    <p>Customizable (Addons)</p>
                    <p className="text-[9px] mt-1 font-black uppercase">{product.isCustomizable ? "Yes ✔" : "No"}</p>
                  </div>
                </div>
              </div>

              {/* Section 6: Franchise Store Availability Table */}
              <div className="space-y-2">
                <span className="text-[9.5px] uppercase font-bold text-zinc-400">Franchise Store Availability & Pricing</span>
                
                <div className="border border-zinc-150 dark:border-zinc-850 rounded-2xl overflow-hidden">
                  <table className="w-full text-left border-collapse text-[11px] font-bold">
                    <thead>
                      <tr className="bg-zinc-50/50 dark:bg-zinc-900/30 border-b border-zinc-150 dark:border-zinc-850 text-zinc-450 uppercase text-[9px] font-black tracking-wider">
                        <th className="px-4 py-2.5">Franchise Store</th>
                        <th className="px-4 py-2.5 text-center">Available</th>
                        <th className="px-4 py-2.5 text-right">Franchise Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900 text-zinc-700 dark:text-zinc-300">
                      {storesList?.map((store) => {
                        const { available, price } = getStorePricingDetails(store.storeId);
                        return (
                          <tr key={store.storeId} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                            <td className="px-4 py-2.5 font-semibold text-zinc-900 dark:text-zinc-100">
                              {store.storeName.replace("Papa Veg Pizza - ", "")}
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              {available ? (
                                <span className="inline-block text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 px-2 py-0.5 rounded font-black text-[9.5px]">
                                  Yes ✔
                                </span>
                              ) : (
                                <span className="inline-block text-zinc-400 bg-zinc-50 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 px-2 py-0.5 rounded font-bold text-[9.5px]">
                                  No ✖
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-right font-black text-zinc-900 dark:text-zinc-100">
                              ₹{price.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center space-y-2 bg-white dark:bg-zinc-950">
              <ShieldAlert size={28} className="text-zinc-350" />
              <p className="font-extrabold text-zinc-450">Unable to retrieve product details.</p>
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
