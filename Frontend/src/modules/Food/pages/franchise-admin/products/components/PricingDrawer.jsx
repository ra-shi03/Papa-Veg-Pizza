import React from "react";
import { X, Pizza, Sparkles, AlertCircle, ShoppingBag, Landmark, Info, Tag, Calendar, User, Clock } from "lucide-react";
import { useStorePricingDetails } from "../hooks/useStorePricing";

export default function PricingDrawer({ isOpen, onClose, pricingId }) {
  const { data: pricing, isLoading } = useStorePricingDetails(pricingId);

  if (!isOpen) return null;

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
                <Sparkles size={18} />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                  Store Pricing Details
                </h3>
                <p className="text-[10px] text-zinc-400 font-bold mt-0.5">
                  Analyze store-specific pricing overrides and promotional availability configurations.
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
              <p className="font-extrabold text-zinc-450">Loading store overrides...</p>
            </div>
          ) : pricing ? (
            <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin dark:text-zinc-350">
              
              {/* Section 1: Product Information */}
              <div className="p-4 bg-zinc-50/50 dark:bg-zinc-900/10 border border-zinc-150 dark:border-zinc-850 rounded-2xl space-y-4">
                <div className="flex gap-4">
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 shrink-0">
                    <img
                      src={pricing.productImage}
                      alt={pricing.productName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=100&q=80";
                      }}
                    />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1.5 font-semibold">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider ${
                        pricing.status === "ACTIVE" 
                          ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-650"
                          : "bg-zinc-100 dark:bg-zinc-850 text-zinc-450"
                      }`}>
                        Rule: {pricing.status}
                      </span>
                      <span className="inline-block text-[8.5px] bg-purple-50 dark:bg-purple-950/20 text-purple-650 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-900/35 uppercase font-bold tracking-tight">
                        {pricing.categoryName}
                      </span>
                    </div>
                    <h2 className="text-sm font-black text-zinc-900 dark:text-white leading-tight">
                      {pricing.productName}
                    </h2>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-mono">
                      Store: <span className="text-zinc-900 dark:text-zinc-150 font-extrabold">{pricing.storeName} ({pricing.storeCode})</span>
                    </p>
                    <p className="text-[9.5px] text-zinc-400 font-bold font-mono">
                      SKU Code: <span className="text-zinc-700 dark:text-zinc-300 font-extrabold">{pricing.productSku}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 2: Variant Pricing */}
              <div className="p-4 border border-zinc-150 dark:border-zinc-850 rounded-2xl space-y-3">
                <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-zinc-400">
                  <Pizza size={13} />
                  <span>Variant Pricing Overrides</span>
                </div>
                <div className="grid grid-cols-3 gap-3 font-bold text-center">
                  <div className="p-3 bg-zinc-50/50 dark:bg-zinc-900/20 rounded-xl border border-zinc-100 dark:border-zinc-850">
                    <span className="text-[8.5px] text-zinc-400 uppercase font-semibold">Small Size</span>
                    <p className="text-zinc-900 dark:text-white text-base font-black mt-1">₹{pricing.smallPrice}</p>
                  </div>
                  <div className="p-3 bg-zinc-50/50 dark:bg-zinc-900/20 rounded-xl border border-zinc-100 dark:border-zinc-850">
                    <span className="text-[8.5px] text-zinc-400 uppercase font-semibold">Medium Size</span>
                    <p className="text-zinc-900 dark:text-white text-base font-black mt-1">₹{pricing.mediumPrice}</p>
                  </div>
                  <div className="p-3 bg-zinc-50/50 dark:bg-zinc-900/20 rounded-xl border border-zinc-100 dark:border-zinc-850">
                    <span className="text-[8.5px] text-zinc-400 uppercase font-semibold">Large Size</span>
                    <p className="text-zinc-900 dark:text-white text-base font-black mt-1">₹{pricing.largePrice}</p>
                  </div>
                </div>
              </div>

              {/* Section 3: Order Type Pricing */}
              <div className="p-4 border border-zinc-150 dark:border-zinc-850 rounded-2xl space-y-3">
                <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-zinc-400">
                  <ShoppingBag size={13} />
                  <span>Order Type Pricing Overrides</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-bold text-center">
                  <div className="p-2.5 bg-zinc-50/50 dark:bg-zinc-900/20 rounded-xl border border-zinc-100 dark:border-zinc-855">
                    <span className="text-[8px] text-zinc-400 uppercase font-semibold">Delivery</span>
                    <p className="text-zinc-900 dark:text-white text-sm font-black mt-0.5">₹{pricing.deliveryPrice}</p>
                  </div>
                  <div className="p-2.5 bg-zinc-50/50 dark:bg-zinc-900/20 rounded-xl border border-zinc-100 dark:border-zinc-855">
                    <span className="text-[8px] text-zinc-400 uppercase font-semibold">Takeaway</span>
                    <p className="text-zinc-900 dark:text-white text-sm font-black mt-0.5">₹{pricing.takeawayPrice}</p>
                  </div>
                  <div className="p-2.5 bg-zinc-50/50 dark:bg-zinc-900/20 rounded-xl border border-zinc-100 dark:border-zinc-855">
                    <span className="text-[8px] text-zinc-400 uppercase font-semibold">Dine-in</span>
                    <p className="text-zinc-900 dark:text-white text-sm font-black mt-0.5">₹{pricing.dineInPrice || pricing.mediumPrice}</p>
                  </div>
                  <div className="p-2.5 bg-zinc-50/50 dark:bg-zinc-900/20 rounded-xl border border-zinc-100 dark:border-zinc-855">
                    <span className="text-[8px] text-zinc-400 uppercase font-semibold">Special Price</span>
                    <p className="text-primary text-sm font-black mt-0.5">₹{pricing.specialPrice || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Section 4: Availability */}
              <div className="p-4 border border-zinc-150 dark:border-zinc-850 rounded-2xl space-y-3.5">
                <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-zinc-400">
                  <Tag size={13} />
                  <span>Availability & Promotion Rules</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-zinc-50/30 dark:bg-zinc-900/20 rounded-xl border border-zinc-100 dark:border-zinc-850">
                  <div className="space-y-1 font-semibold">
                    <span className="text-[8.5px] text-zinc-400 uppercase font-semibold">Status Indicator</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`w-2 h-2 rounded-full ${
                        pricing.availability === "AVAILABLE"
                          ? "bg-emerald-500"
                          : pricing.availability === "UNAVAILABLE"
                          ? "bg-red-500"
                          : "bg-orange-500 animate-ping"
                      }`} />
                      <p className="text-zinc-850 dark:text-zinc-200 font-extrabold uppercase">{pricing.availability}</p>
                    </div>
                  </div>

                  {pricing.availability === "PROMOTION ACTIVE" && (
                    <div className="text-right space-y-0.5 font-bold font-mono">
                      <span className="text-[8.5px] text-zinc-400 uppercase font-semibold flex items-center gap-1 justify-end">
                        <Calendar size={11} /> Campaign Validity
                      </span>
                      <p className="text-zinc-850 dark:text-zinc-200">
                        {pricing.startDate} to {pricing.endDate}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 5: Last Updated */}
              <div className="p-4 border border-zinc-150 dark:border-zinc-850 rounded-2xl space-y-3 font-semibold text-zinc-650 dark:text-zinc-350">
                <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-zinc-400">
                  <Clock size={13} />
                  <span>Audit Logs & Edits Details</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2.5 p-2 bg-zinc-50/50 dark:bg-zinc-900/20 rounded-xl border border-zinc-100 dark:border-zinc-855">
                    <User size={14} className="text-zinc-400" />
                    <div>
                      <span className="text-[8.5px] text-zinc-400 uppercase font-semibold block leading-none">Modified By</span>
                      <p className="text-zinc-900 dark:text-white font-extrabold mt-1 leading-none">{pricing.updatedBy || "System"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 p-2 bg-zinc-50/50 dark:bg-zinc-900/20 rounded-xl border border-zinc-100 dark:border-zinc-855">
                    <Calendar size={14} className="text-zinc-400" />
                    <div>
                      <span className="text-[8.5px] text-zinc-400 uppercase font-semibold block leading-none">Last Modified Date</span>
                      <p className="text-zinc-900 dark:text-white font-extrabold mt-1 leading-none font-mono">
                        {new Date(pricing.updatedAt || pricing.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center space-y-2 bg-white dark:bg-zinc-950">
              <AlertCircle size={28} className="text-zinc-350" />
              <p className="font-extrabold text-zinc-450">Unable to retrieve store overrides.</p>
            </div>
          )}

          {/* Footer */}
          <footer className="p-4 border-t border-zinc-100 dark:border-zinc-850 flex justify-end bg-zinc-50/30 dark:bg-zinc-900/10 shrink-0">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-zinc-950 dark:bg-zinc-850 hover:bg-zinc-850 dark:hover:bg-zinc-700 text-white font-bold rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer text-xs"
            >
              Close Specifications
            </button>
          </footer>

        </div>
      </div>
    </div>
  );
}
