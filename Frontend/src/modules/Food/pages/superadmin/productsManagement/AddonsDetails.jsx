import React from "react";
import { X, Calendar, User, ShoppingBag, Clock, FileText, CheckCircle, Tag, Layers } from "lucide-react";

export default function AddonsDetails({
  isOpen,
  onClose,
  addon,
  products = [],
  mappings = [],
  onEdit
}) {
  if (!isOpen || !addon) return null;

  // Find linked product list
  const linkedProductIds = mappings
    .filter(m => m.addonId === addon._id)
    .map(m => m.productId);
  const mappedProducts = products.filter(p => linkedProductIds.includes(p.id));

  // Simulated audit logs
  const auditTimeline = [
    {
      action: "Status Updated",
      user: "Admin Shubh",
      time: "14 Jun 2026, 04:30 PM",
      detail: `Changed status to "${addon.status}"`
    },
    {
      action: "Price Modified",
      user: "Admin Shubh",
      time: "10 Jun 2026, 11:15 AM",
      detail: `Set price to ₹${addon.price}`
    },
    {
      action: "Add-on Registered",
      user: "Manager Amit",
      time: addon.createdAt || "01 Jun 2026, 09:00 AM",
      detail: "Created initial catalog profile"
    }
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-[70] transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Side drawer container */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-zinc-950 shadow-2xl z-[80] flex flex-col transform transition-transform duration-300 animate-in slide-in-from-right-5 text-zinc-900 dark:text-zinc-100">
        
        {/* Header */}
        <div className="px-4 h-14 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1 hover:bg-zinc-150 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-550 dark:text-zinc-400"
            >
              <X size={16} />
            </button>
            <div>
              <h3 className="font-bold text-sm leading-none">Quick View Profile</h3>
              <p className="text-[9px] text-zinc-400 font-bold mt-1 font-mono">{addon._id}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
              addon.status === "active"
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400"
                : addon.status === "inactive"
                ? "bg-zinc-100 text-zinc-650 dark:bg-zinc-900/30 dark:text-zinc-400"
                : "bg-amber-100 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400"
            }`}>
              {addon.status}
            </span>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 hide-scrollbar">
          
          {/* Main Hero Card (WebP image) */}
          <div className="relative rounded-xl overflow-hidden aspect-video border border-zinc-200 dark:border-zinc-800 shadow-sm bg-zinc-100 dark:bg-zinc-900">
            <img
              src={addon.image || "https://images.unsplash.com/photo-1513104890138-7c749659a591?fm=webp&fit=crop&w=600&q=80"}
              alt={addon.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent flex flex-col justify-end p-3 text-white">
              <div className="flex items-center gap-1.5 mb-1">
                {addon.isVegan ? (
                  <span className="px-1.5 py-0.5 bg-emerald-500 text-white text-[9px] font-black uppercase rounded shadow-sm">
                    🌱 Vegan
                  </span>
                ) : (
                  <>
                    <div className="w-3 h-3 border flex items-center justify-center rounded-sm bg-white border-green-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-600" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider">
                      Veg Add-on
                    </span>
                  </>
                )}
              </div>
              <h4 className="text-base font-black leading-tight">{addon.name}</h4>
              <p className="text-xs font-black text-amber-400 mt-0.5">₹{addon.price.toFixed(2)}</p>
            </div>
          </div>

          {/* Details fields */}
          <div className="grid grid-cols-2 gap-3.5 bg-zinc-50 dark:bg-zinc-900/50 p-3.5 border border-zinc-150 dark:border-zinc-800 rounded-xl shadow-inner text-xs font-semibold">
            <div>
              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Add-on Type</p>
              <p className="text-zinc-850 dark:text-zinc-200 mt-0.5 capitalize">{addon.type}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Max Quantity Allowed</p>
              <p className="text-zinc-850 dark:text-zinc-200 mt-0.5 font-mono">{addon.maxQuantity} portions</p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Display Order</p>
              <p className="text-zinc-850 dark:text-zinc-200 mt-0.5 font-mono">#{addon.displayOrder || 1}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Default Quantity</p>
              <p className="text-zinc-850 dark:text-zinc-200 mt-0.5 font-mono">{addon.defaultQuantity || 0} unit</p>
            </div>
            {addon.description && (
              <div className="col-span-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Description</p>
                <p className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mt-0.5 leading-relaxed">
                  {addon.description}
                </p>
              </div>
            )}
          </div>

          {/* Compatible Categories */}
          <div className="space-y-1.5">
            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-wider flex items-center gap-1">
              <Layers size={11} className="text-[var(--primary)]" />
              Compatible Categories
            </h4>
            <div className="flex flex-wrap gap-1">
              {addon.category ? (
                <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-750 dark:text-zinc-300 font-bold text-[10px] px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 shadow-sm">
                  {addon.category}
                </span>
              ) : (
                <span className="text-[10px] text-zinc-400 italic">No category linkages declared</span>
              )}
            </div>
          </div>

          {/* Assigned Products mapping */}
          <div className="space-y-1.5">
            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-wider flex items-center gap-1">
              <ShoppingBag size={11} className="text-[var(--primary)]" />
              Assigned Products ({mappedProducts.length})
            </h4>
            {mappedProducts.length > 0 ? (
              <div className="max-h-[140px] overflow-y-auto border border-zinc-200 dark:border-zinc-800 rounded-lg divide-y divide-zinc-150 dark:divide-zinc-850 bg-white dark:bg-zinc-900 scrollbar-thin">
                {mappedProducts.map(p => (
                  <div key={p.id} className="p-2 flex items-center justify-between text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                    <span className="font-bold">{p.name}</span>
                    <span className="text-[9px] bg-zinc-100 dark:bg-zinc-850 px-1.5 py-0.5 text-zinc-500 rounded font-semibold">
                      {p.category}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-zinc-400 italic">This add-on is currently reusable but not assigned to products.</p>
            )}
          </div>

          {/* Meta dates info */}
          <div className="bg-zinc-50 dark:bg-zinc-900/30 p-3 rounded-lg border border-zinc-150 dark:border-zinc-800 text-[10px] text-zinc-500 space-y-1 font-semibold">
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1"><Calendar size={10} /> Created</span>
              <span className="font-mono text-zinc-700 dark:text-zinc-300">{addon.createdAt ? new Date(addon.createdAt).toLocaleDateString() : "01 Jun 2026"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1"><Clock size={10} /> Last Updated</span>
              <span className="font-mono text-zinc-700 dark:text-zinc-300">{addon.updatedAt ? new Date(addon.updatedAt).toLocaleString() : "14 Jun 2026, 04:30 PM"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1"><User size={10} /> Created By</span>
              <span className="text-zinc-700 dark:text-zinc-300">Admin Shubh</span>
            </div>
          </div>

          {/* Audit Timeline */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-wider flex items-center gap-1">
              <FileText size={11} className="text-[var(--primary)]" />
              Audit Timeline
            </h4>
            <div className="relative pl-4 border-l border-zinc-200 dark:border-zinc-800 space-y-4">
              {auditTimeline.map((item, idx) => (
                <div key={idx} className="relative text-xs">
                  <span className="absolute -left-[20.5px] top-1 w-2.5 h-2.5 rounded-full bg-white dark:bg-zinc-950 border-2 border-[var(--primary)] shrink-0" />
                  <div className="flex justify-between font-bold text-zinc-800 dark:text-zinc-200">
                    <span>{item.action}</span>
                    <span className="text-[9px] text-zinc-400 font-medium font-mono">{item.time}</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-0.5 font-semibold">By {item.user} • {item.detail}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex gap-2.5 justify-end shrink-0 z-10">
          <button
            onClick={() => {
              onClose();
              if (onEdit) onEdit(addon);
            }}
            className="w-full py-2 bg-[var(--primary)] text-white font-bold text-xs rounded-lg hover:brightness-110 active:scale-95 transition-all shadow-md flex items-center justify-center gap-1.5"
          >
            Edit Add-on
          </button>
        </div>
      </div>
    </>
  );
}
