import React from "react";
import { X, Sparkles, AlertCircle, Check, ShieldAlert, Boxes, Package, LayoutGrid, DollarSign } from "lucide-react";
import { useAddonDetails } from "../hooks/useAddons";

export default function AddonDrawer({ isOpen, onClose, addonId }) {
  const { data: response, isLoading } = useAddonDetails(addonId);
  const addon = response?.data;

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
                  Add-on Specifications
                </h3>
                <p className="text-[10px] text-zinc-400 font-bold mt-0.5">
                  Analyze basic metadata, pricing model, inventory mapping, and product links.
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
              <p className="font-extrabold text-zinc-450">Loading specifications...</p>
            </div>
          ) : addon ? (
            <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin dark:text-zinc-350">
              
              {/* Section 1: Basic Information */}
              <div className="space-y-4">
                <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <img
                    src={addon.image}
                    alt={addon.name}
                    className="w-full h-full object-cover select-none"
                    onError={(e) => {
                      e.target.src = "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80";
                    }}
                  />
                  
                  {/* Status Badge Overlay */}
                  <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-[9.5px] font-black border tracking-wide uppercase shadow-sm ${
                    addon.status === "ACTIVE" 
                      ? "text-emerald-700 bg-emerald-50 border-emerald-300"
                      : addon.status === "INACTIVE"
                      ? "text-zinc-700 bg-zinc-100 border-zinc-300 dark:bg-zinc-850"
                      : "text-red-700 bg-red-50 border-red-300"
                  }`}>
                    {addon.status.replace(/_/g, " ")}
                  </span>

                  <span className="absolute top-3 right-3 px-3 py-1 rounded-full text-[9.5px] font-black tracking-wide uppercase bg-black/60 backdrop-blur-xs text-white border border-white/10 shadow-sm">
                    {addon.type}
                  </span>
                </div>

                <div className="space-y-2">
                  <h2 className="text-base font-black text-zinc-900 dark:text-white leading-tight">
                    {addon.name}
                  </h2>
                  <p className="text-[10px] text-zinc-450 font-bold uppercase tracking-wider font-mono">
                    Add-on Price: <span className="text-zinc-900 dark:text-zinc-100 font-extrabold text-xs">₹{addon.price}</span> • Created: {new Date(addon.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>

                <div className="p-3.5 bg-zinc-50/50 dark:bg-zinc-900/25 border border-zinc-150 dark:border-zinc-850 rounded-xl leading-relaxed text-zinc-650 dark:text-zinc-400 font-bold">
                  <span className="text-[9.5px] uppercase font-bold text-zinc-400 block mb-1">Description</span>
                  {addon.description || "No description provided for this add-on."}
                </div>
              </div>

              {/* Section 2: Inventory Details */}
              <div className="p-4 border border-zinc-150 dark:border-zinc-850 rounded-2xl space-y-3">
                <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-zinc-400">
                  <Package size={13} />
                  <span>Inventory Mapping & Details</span>
                </div>
                
                {addon.inventory ? (
                  <div className="space-y-3 font-bold text-zinc-650 dark:text-zinc-300">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[8.5px] text-zinc-400 uppercase font-semibold">Inventory Item Name</span>
                        <p className="text-zinc-900 dark:text-zinc-150 font-extrabold">{addon.inventory.name}</p>
                      </div>
                      <div>
                        <span className="text-[8.5px] text-zinc-400 uppercase font-semibold">Unit Type</span>
                        <p className="text-zinc-900 dark:text-zinc-150 font-extrabold">{addon.inventory.unit}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-900">
                      <div className="space-y-0.5">
                        <span className="text-[8.5px] text-zinc-400 uppercase font-semibold">Current Stock</span>
                        <p className={`text-sm font-black ${
                          addon.inventory.currentStock === 0 
                            ? "text-red-650" 
                            : addon.inventory.currentStock <= addon.inventory.lowStockWarning 
                            ? "text-amber-600" 
                            : "text-zinc-800 dark:text-zinc-200"
                        }`}>
                          {addon.inventory.currentStock} {addon.inventory.unit}
                        </p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[8.5px] text-zinc-400 uppercase font-semibold">Low Stock Threshold</span>
                        <p className="text-zinc-850 dark:text-zinc-200 text-sm font-black">
                          {addon.inventory.lowStockWarning} {addon.inventory.unit}
                        </p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[8.5px] text-zinc-400 uppercase font-semibold">Cost Price</span>
                        <p className="text-zinc-850 dark:text-zinc-200 text-sm font-black text-emerald-650">
                          ₹{addon.inventory.costPrice}
                        </p>
                      </div>
                    </div>

                    {addon.inventory.currentStock <= addon.inventory.lowStockWarning && (
                      <div className="mt-2 p-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/35 rounded-xl flex items-center gap-2 text-amber-750 dark:text-amber-400 text-[10px]">
                        <ShieldAlert size={14} className="shrink-0" />
                        <span>Warning: This inventory item is in low stock condition! Reorder immediately.</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-900/40 rounded-xl text-center text-zinc-400 flex flex-col items-center gap-1.5 border border-dashed border-zinc-200 dark:border-zinc-800">
                    <AlertCircle size={16} />
                    <span>No inventory item mapped. This add-on does not track real-time ingredients levels.</span>
                  </div>
                )}
              </div>

              {/* Section 3: Group Information */}
              <div className="p-4 border border-zinc-150 dark:border-zinc-850 rounded-2xl space-y-3">
                <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-zinc-400">
                  <Boxes size={13} />
                  <span>Associated Add-on Groups</span>
                </div>

                {addon.groups && addon.groups.length > 0 ? (
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-900 space-y-3 font-semibold text-zinc-650 dark:text-zinc-350">
                    {addon.groups.map((grp) => (
                      <div key={grp._id} className="pt-3 first:pt-0 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-extrabold text-zinc-900 dark:text-white text-xs">{grp.name}</span>
                          {grp.isRequired ? (
                            <span className="px-2 py-0.5 bg-red-100 dark:bg-red-950/30 text-red-650 dark:text-red-400 rounded text-[8px] font-black uppercase">Required</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-450 rounded text-[8px] font-black uppercase">Optional</span>
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-400">
                          Selection: {grp.selectionType} Selection (Min: {grp.minSelection} • Max: {grp.maxSelection})
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-900/40 rounded-xl text-center text-zinc-400 flex flex-col items-center gap-1.5 border border-dashed border-zinc-200 dark:border-zinc-800">
                    <AlertCircle size={16} />
                    <span>Not associated with any add-on groups. Customers will not see this option during customization checkout.</span>
                  </div>
                )}
              </div>

              {/* Section 4: Assigned Products */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-zinc-400">
                  <LayoutGrid size={13} />
                  <span>Assigned Signature Products ({addon.assignedProducts?.length || 0})</span>
                </div>

                {addon.assignedProducts && addon.assignedProducts.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {addon.assignedProducts.map((p) => (
                      <div 
                        key={p._id}
                        className="border border-zinc-150 dark:border-zinc-850 rounded-xl overflow-hidden bg-white dark:bg-zinc-900/50 flex items-center p-2 gap-3"
                      >
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-100 shrink-0">
                          <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0 font-bold">
                          <p className="text-[11px] text-zinc-900 dark:text-white truncate leading-tight">{p.name}</p>
                          <p className="text-[9.5px] text-zinc-450 mt-0.5">{p.category}</p>
                          <p className="text-[8px] text-zinc-400 font-mono mt-0.5">Linked: {new Date(p.assignedDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-400 flex flex-col items-center justify-center gap-1.5">
                    <AlertCircle size={18} />
                    <span>No products currently linked to this add-on. Use row action options to assign pizzas.</span>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center space-y-2 bg-white dark:bg-zinc-950">
              <AlertCircle size={28} className="text-zinc-350" />
              <p className="font-extrabold text-zinc-450">Unable to retrieve add-on details.</p>
            </div>
          )}

          {/* Footer */}
          <footer className="p-4 border-t border-zinc-100 dark:border-zinc-850 flex justify-end bg-zinc-50/30 dark:bg-zinc-900/10 shrink-0">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-zinc-950 dark:bg-zinc-850 hover:bg-zinc-850 dark:hover:bg-zinc-700 text-white font-bold rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer text-xs"
            >
              Close Details
            </button>
          </footer>

        </div>
      </div>
    </div>
  );
}
