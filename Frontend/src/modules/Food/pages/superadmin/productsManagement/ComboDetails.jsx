import React from "react";
import { X, Calendar, User, ShoppingBag, Clock, FileText, CheckCircle, Tag, Layers, Percent, Store as StoreIcon, Building2 } from "lucide-react";

export default function ComboDetails({
  isOpen,
  onClose,
  combo,
  comboItems = [],
  products = []
}) {
  if (!isOpen || !combo) return null;

  // Calculate items breakdown and original prices sum
  let originalSum = 0;
  const itemsBreakdown = comboItems.map(ci => {
    const prod = products.find(p => p.id === ci.productId);
    const unitPrice = prod ? prod.price : 0;
    const subtotal = unitPrice * ci.quantity;
    originalSum += subtotal;

    return {
      ...ci,
      name: prod ? prod.name : ci.productId,
      image: prod ? prod.image : "https://images.unsplash.com/photo-1513104890138-7c749659a591?fm=webp&fit=crop&w=100&q=80",
      sku: prod ? prod.id : "N/A",
      unitPrice,
      subtotal
    };
  });

  const totalSavings = originalSum > combo.price ? originalSum - combo.price : 0;

  // Mocked audit logs timeline for this combo
  const auditTimeline = [
    {
      action: "Combo Modified",
      user: combo.updatedBy || "Admin.Rashi",
      time: combo.updatedAt ? new Date(combo.updatedAt).toLocaleString("en-IN") : "16 Jun 2026, 02:30 PM",
      detail: "Updated discount parameters and stores assignment."
    },
    {
      action: "Stores Assigned",
      user: "Admin.Rashi",
      time: "10 Jun 2026, 11:15 AM",
      detail: combo.applicabilityType === "all" ? "Assigned eligibility to All Stores." : `Mapped stores/franchises availability.`
    },
    {
      action: "Combo Profile Initialized",
      user: combo.createdBy || "Admin.Rashi",
      time: combo.createdAt ? new Date(combo.createdAt).toLocaleString("en-IN") : "01 Jun 2026, 09:00 AM",
      detail: `Created ${combo.name} package outline.`
    }
  ];

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-[70] transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Side drawer */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-zinc-950 shadow-2xl z-[80] flex flex-col transform transition-transform duration-300 animate-in slide-in-from-right-5 text-zinc-900 dark:text-zinc-100 select-none">
        
        {/* Header */}
        <div className="px-4 h-14 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1 hover:bg-zinc-150 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
            >
              <X size={16} />
            </button>
            <div>
              <h3 className="font-bold text-sm leading-none">Combo Specifications</h3>
              <p className="text-[9px] text-zinc-400 font-bold mt-1 font-mono">{combo._id}</p>
            </div>
          </div>

          <div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
              combo.status === "active" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400" :
              combo.status === "scheduled" ? "bg-blue-100 text-blue-850 dark:bg-blue-950/20 dark:text-blue-400" :
              combo.status === "draft" ? "bg-zinc-100 text-zinc-650 dark:bg-zinc-900/30 dark:text-zinc-400" :
              "bg-red-100 text-red-800 dark:bg-red-950/20 dark:text-red-400"
            }`}>
              {combo.status}
            </span>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
          
          {/* Banner Hero Display */}
          <div className="relative rounded-xl overflow-hidden aspect-video border border-zinc-200 dark:border-zinc-800 shadow-sm bg-zinc-150 dark:bg-zinc-900 shrink-0">
            <img
              src={combo.image || "https://images.unsplash.com/photo-1513104890138-7c749659a591?fm=webp&fit=crop&w=600&q=80"}
              alt={combo.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-3 text-white">
              <div className="flex items-center gap-1 mb-1">
                <span className="px-1.5 py-0.5 bg-[var(--primary)] text-white text-[8px] font-black uppercase rounded shadow">
                  {combo.comboType}
                </span>
                <span className="text-[10px] font-bold text-green-400 flex items-center gap-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  100% Veg Brand
                </span>
              </div>
              <h4 className="text-base font-black leading-tight truncate">{combo.name}</h4>
              <p className="text-xs font-semibold text-zinc-250 block mt-0.5 leading-snug line-clamp-2">
                {combo.description}
              </p>
            </div>
          </div>

          {/* Pricing Summary Card */}
          <div className="bg-zinc-50 dark:bg-zinc-900/50 p-3.5 border border-zinc-150 dark:border-zinc-800 rounded-xl shadow-inner space-y-2">
            <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pb-1 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-1.5">
              <Percent size={11} className="text-[var(--primary)]" />
              Financial Breakdown
            </h4>
            
            <div className="grid grid-cols-3 gap-2 text-center py-1.5">
              <div className="space-y-0.5">
                <span className="text-[9px] text-zinc-400 font-bold uppercase">A-la-carte sum</span>
                <p className="text-xs font-bold text-zinc-500 font-mono">₹{originalSum.toFixed(2)}</p>
              </div>
              <div className="space-y-0.5 border-x border-zinc-200 dark:border-zinc-800">
                <span className="text-[9px] text-[var(--primary)] font-bold uppercase">Combo Price</span>
                <p className="text-sm font-black text-zinc-900 dark:text-zinc-100 font-mono">₹{combo.price.toFixed(2)}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[9px] text-emerald-500 font-bold uppercase">Customer Save</span>
                <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono">₹{totalSavings.toFixed(2)}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-850 flex items-center justify-between text-[10px] font-bold text-zinc-500">
              <span>Discount Rule Applied:</span>
              <span className="text-zinc-800 dark:text-zinc-200 font-black">
                {combo.discountType === "percentage" ? `${combo.discountValue}% Percentage` : `Flat ₹${combo.discountValue} Off`}
              </span>
            </div>
          </div>

          {/* Included Products List */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
              <ShoppingBag size={11} className="text-[var(--primary)]" />
              Included Items ({itemsBreakdown.length})
            </h4>
            
            <div className="border border-zinc-150 dark:border-zinc-800 rounded-xl overflow-hidden text-[11px]">
              <table className="w-full text-left">
                <thead className="bg-zinc-50 dark:bg-zinc-950 text-zinc-400 font-bold border-b border-zinc-150 dark:border-zinc-800">
                  <tr>
                    <th className="px-3 py-1.5">Product Name</th>
                    <th className="px-2 py-1.5 text-center">Qty</th>
                    <th className="px-3 py-1.5 text-right">A-la-carte</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 bg-white dark:bg-zinc-900/30 text-zinc-700 dark:text-zinc-300 font-semibold">
                  {itemsBreakdown.map(item => (
                    <tr key={item._id}>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <img src={item.image} alt={item.name} className="w-6 h-6 rounded object-cover shrink-0 border border-zinc-150 dark:border-zinc-800" />
                          <div>
                            <span className="font-bold text-zinc-900 dark:text-zinc-100 block truncate max-w-[150px]">{item.name}</span>
                            <span className="text-[8px] text-zinc-400 font-mono block">{item.sku}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-2 text-center font-mono font-bold">{item.quantity}</td>
                      <td className="px-3 py-2 text-right font-mono">₹{item.subtotal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Validity Periods */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
              <Calendar size={11} className="text-[var(--primary)]" />
              Timeline & Range
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs font-semibold p-3 border border-zinc-150 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/20">
              <div>
                <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Valid From</p>
                <p className="text-zinc-800 dark:text-zinc-200 font-mono mt-0.5">
                  {combo.validFrom ? new Date(combo.validFrom).toLocaleString("en-IN") : "Immediate"}
                </p>
              </div>
              <div>
                <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Valid To</p>
                <p className="text-zinc-800 dark:text-zinc-200 font-mono mt-0.5">
                  {combo.validTo ? new Date(combo.validTo).toLocaleString("en-IN") : "Indefinite"}
                </p>
              </div>
            </div>
          </div>

          {/* Store Assignments */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
              <StoreIcon size={11} className="text-[var(--primary)]" />
              Availability Mapping
            </h4>
            <div className="p-3 border border-zinc-150 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/20 text-xs font-semibold space-y-2">
              <div>
                <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">Applicability Type</span>
                <span className="capitalize text-zinc-800 dark:text-zinc-200">{combo.applicabilityType} Scope</span>
              </div>
              
              {combo.applicabilityType === "franchises" && (
                <div>
                  <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">Assigned Franchises</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {combo.applicableFranchises.map(item => (
                      <span key={item} className="px-2 py-0.5 bg-zinc-150 dark:bg-zinc-800 text-[10px] rounded border border-zinc-200 dark:border-zinc-700 block">{item}</span>
                    ))}
                  </div>
                </div>
              )}

              {combo.applicabilityType === "stores" && (
                <div>
                  <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">Assigned Outlets</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {combo.applicableStores.map(item => (
                      <span key={item} className="px-2 py-0.5 bg-zinc-150 dark:bg-zinc-800 text-[10px] rounded border border-zinc-200 dark:border-zinc-700 block">{item}</span>
                    ))}
                  </div>
                </div>
              )}

              {combo.applicabilityType === "all" && (
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">This combo is enabled across all stores and franchises globally.</p>
              )}
            </div>
          </div>

          {/* Audit Timeline */}
          <div className="space-y-3 pt-2">
            <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
              <Clock size={11} className="text-[var(--primary)]" />
              Audit Log Timeline
            </h4>
            
            <div className="relative pl-4 border-l border-zinc-200 dark:border-zinc-850 space-y-4 ml-1">
              {auditTimeline.map((log, idx) => (
                <div key={idx} className="relative space-y-0.5">
                  <div className="absolute -left-[20.5px] top-0.5 w-3 h-3 rounded-full bg-white dark:bg-zinc-950 border-2 border-[var(--primary)] flex items-center justify-center shrink-0" />
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-zinc-850 dark:text-zinc-200">{log.action}</span>
                    <span className="text-zinc-400 font-mono font-semibold">{log.time}</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 font-medium leading-tight">
                    By <span className="font-bold text-zinc-700 dark:text-zinc-300">{log.user}</span>: {log.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30 flex items-center justify-end gap-2 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
          >
            Close Panel
          </button>
        </div>
      </div>
    </>
  );
}
