import React from "react";
import { X, Tag, Globe, Calendar, Clock, User, CheckCircle2 } from "lucide-react";

export default function GlobalPriceDetail({ isOpen, onClose, rule }) {
  if (!isOpen || !rule) return null;

  // Derive calculated metrics
  const difference = rule.basePrice - rule.effectivePrice;
  const discountPercent = rule.basePrice > 0 ? Math.round((difference / rule.basePrice) * 100) : 0;

  return (
    <>
      {/* Backdrop overlay */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] animate-in fade-in duration-200" onClick={onClose} />

      {/* Detail Drawer */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-zinc-955 shadow-2xl z-[80] flex flex-col transform transition-transform duration-300 animate-in slide-in-from-right-5 text-zinc-900 dark:text-zinc-100 select-none">
        
        {/* Header */}
        <div className="px-4 h-14 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-black dark:text-white">Rule Profile details</h3>
            <p className="text-[9px] text-zinc-400 font-mono font-bold mt-0.5 uppercase tracking-wider">SKU Ref: {rule.productId}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-150 dark:hover:bg-zinc-850 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-250 cursor-pointer transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin">
          
          {/* Product card banner */}
          <div className="flex items-center gap-3.5 p-3 rounded-xl border border-zinc-150 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20">
            <div className="w-16 h-16 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 shrink-0">
              <img src={rule.image || "https://images.unsplash.com/photo-1513104890138-7c749659a591?fm=webp&fit=crop&w=100&q=80"} alt={rule.productName} className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <span className="px-2 py-0.5 bg-[var(--primary)]/10 text-[var(--primary)] text-[9px] font-bold rounded uppercase tracking-wider">
                {rule.category || "Pizza Categories"}
              </span>
              <h4 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100 truncate mt-1">{rule.productName}</h4>
              <p className="text-[10px] text-zinc-400 font-semibold mt-0.5 capitalize">Variant size: {rule.variant}</p>
            </div>
          </div>

          {/* Pricing cards */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Pricing Structure</h4>
            
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 border border-zinc-150 dark:border-zinc-850 bg-white dark:bg-zinc-900/40 rounded-xl text-center shadow-inner">
                <span className="text-[9px] text-zinc-400 block font-bold uppercase tracking-wider">Base Price</span>
                <span className="text-sm font-black font-mono text-zinc-650 dark:text-zinc-400">₹{rule.basePrice}</span>
              </div>
              <div className="p-3 border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/5 rounded-xl text-center shadow-inner">
                <span className="text-[9px] text-emerald-500 block font-bold uppercase tracking-wider">Effective Override</span>
                <span className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">₹{rule.effectivePrice}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between text-xs font-semibold">
              <span className="text-zinc-450">Discount Amount / Saving:</span>
              <span className="text-emerald-600 font-bold">₹{difference} ({discountPercent}%)</span>
            </div>
          </div>

          {/* Geographic Override Level details */}
          <div className="space-y-2.5">
            <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Hierarchical Override Level</h4>
            <div className="border border-zinc-150 dark:border-zinc-800 rounded-xl overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-850 text-xs font-semibold">
              <div className="p-2.5 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-900/30">
                <span className="text-zinc-450">Region Scope:</span>
                <span className="text-zinc-800 dark:text-zinc-200">{rule.regionId || "— (Global)"}</span>
              </div>
              <div className="p-2.5 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-900/30">
                <span className="text-zinc-450">Zone Scope:</span>
                <span className="text-zinc-800 dark:text-zinc-200">{rule.zoneId || "—"}</span>
              </div>
              <div className="p-2.5 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-900/30">
                <span className="text-zinc-450">Territory Scope:</span>
                <span className="text-zinc-800 dark:text-zinc-200">{rule.territoryId || "—"}</span>
              </div>
              <div className="p-2.5 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-900/30">
                <span className="text-zinc-450">Franchise Scope:</span>
                <span className="text-zinc-805 dark:text-zinc-200 font-bold">{rule.franchiseId || "—"}</span>
              </div>
              <div className="p-2.5 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-900/30 bg-[var(--primary)]/5">
                <span className="text-zinc-450 font-bold">Outlet Store Override:</span>
                <span className="text-[var(--primary)] font-black">{rule.storeId || "— (Applies Hierarchy)"}</span>
              </div>
            </div>
          </div>

          {/* Timeline details */}
          <div className="space-y-2.5">
            <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Effective Timelines</h4>
            <div className="border border-zinc-150 dark:border-zinc-800 rounded-xl p-3 bg-zinc-50/50 dark:bg-zinc-950/20 space-y-2 text-xs font-semibold">
              <div className="flex justify-between">
                <span className="text-zinc-450">Effective From:</span>
                <span className="text-zinc-800 dark:text-zinc-200">{rule.validFrom}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-450">Effective To:</span>
                <span className="text-zinc-800 dark:text-zinc-200">{rule.validTo}</span>
              </div>
              <div className="flex justify-between items-center pt-1.5 border-t border-zinc-200 dark:border-zinc-800">
                <span className="text-zinc-450">Rule Status:</span>
                <span className={`px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold ${
                  rule.status === "active" ? "bg-green-500 text-white" :
                  rule.status === "scheduled" ? "bg-blue-500 text-white" :
                  rule.status === "draft" ? "bg-zinc-200 text-zinc-850 dark:bg-zinc-800 dark:text-zinc-300" :
                  rule.status === "expired" ? "bg-red-500 text-white" : "bg-amber-500 text-white"
                }`}>
                  {rule.status}
                </span>
              </div>
            </div>
          </div>

          {/* Audit Trail */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Audit Timeline</h4>
            <div className="border border-zinc-150 dark:border-zinc-800 rounded-xl p-3.5 space-y-4 bg-white dark:bg-zinc-900/10 text-[11px] font-semibold select-none">
              
              <div className="flex gap-2.5 relative">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] mt-1.5 z-10" />
                <div className="absolute top-2 left-0.5 w-0.5 h-9 bg-zinc-200 dark:bg-zinc-850" />
                <div>
                  <span className="text-zinc-800 dark:text-zinc-200 block">Rule modified by Admin Shubh</span>
                  <span className="text-[9px] text-zinc-450 font-normal">14 Jun 2026, 04:30 PM • Reason: Price adjustments</span>
                </div>
              </div>

              <div className="flex gap-2.5 relative">
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-400 mt-1.5 z-10" />
                <div>
                  <span className="text-zinc-500 block">Pricing rule created by Manager Amit</span>
                  <span className="text-[9px] text-zinc-450 font-normal">01 Jun 2026, 10:15 AM</span>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-900/60 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-750 text-white font-bold text-xs rounded-lg shadow-md transition-all active:scale-95 cursor-pointer"
          >
            Close Profile
          </button>
        </div>
      </div>
    </>
  );
}
