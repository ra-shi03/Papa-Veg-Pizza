import React from "react";
import { ShoppingCart, MapPin, Clock, CreditCard, User } from "lucide-react";

export default function OrderDetailsCard({ order }) {
  if (!order) return null;

  const formatTime = (timeStr) => {
    if (!timeStr) return "-";
    try {
      return new Date(timeStr).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
    } catch (e) {
      return "-";
    }
  };

  const formatAddress = (addr) => {
    if (!addr) return "Address details missing";
    if (typeof addr === "string") return addr;
    const parts = [
      addr.houseNumber,
      addr.street,
      addr.landmark,
      addr.city,
      addr.pincode
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "Address details missing";
  };

  return (
    <div className="bg-slate-50 dark:bg-zinc-950 p-4 rounded-2.5xl border border-slate-100 dark:border-zinc-850 space-y-4 text-xs font-bold text-slate-700 dark:text-zinc-300">
      
      {/* Header with Order ID & Status */}
      <div className="flex justify-between items-center border-b border-slate-200/50 dark:border-zinc-800/80 pb-3">
        <div>
          <span className="text-[9px] text-slate-400 block uppercase tracking-wider">Active Fulfillment</span>
          <h4 className="text-sm font-black text-slate-900 dark:text-white">
            Order ID: <span className="text-[var(--primary)] font-black">#{order.orderNumber}</span>
          </h4>
        </div>
        <span className="text-[9px] font-black uppercase bg-orange-50 text-orange-700 border border-orange-100 px-2 py-0.5 rounded-md">
          {order.deliveryStatus || order.status || "Waiting"}
        </span>
      </div>

      {/* Customer Info */}
      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <User size={14} className="text-slate-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="text-[8px] text-slate-400 uppercase tracking-widest block font-black">Customer Details</span>
            <div className="font-extrabold text-slate-900 dark:text-white text-xs">
              {order.customerName || order.customer?.name || "Customer"}
            </div>
            <div className="text-slate-500">
              {order.customerPhone || order.customer?.phone || "-"}
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="flex items-start gap-2 border-t border-slate-150/50 dark:border-zinc-900/50 pt-2.5">
          <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="text-[8px] text-slate-400 uppercase tracking-widest block font-black">Delivery Location</span>
            <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed font-bold">
              {formatAddress(order.deliveryAddress)}
            </p>
          </div>
        </div>
      </div>

      {/* Items list */}
      <div className="border-t border-slate-150/50 dark:border-zinc-900/50 pt-2.5 space-y-2">
        <div className="flex items-center gap-1.5 text-slate-400">
          <ShoppingCart size={13} />
          <span className="text-[8px] uppercase tracking-widest font-black">Order Contents</span>
        </div>

        <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
          {Array.isArray(order.items) && order.items.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 p-2 rounded-xl">
              <div>
                <span className="font-extrabold text-slate-900 dark:text-white">{item.name}</span>
                {item.size && (
                  <span className="text-[9px] text-slate-455 dark:text-zinc-555 block font-bold mt-0.5">
                    Size: {item.size} {item.crust ? `• ${item.crust}` : ""}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-black text-slate-455 shrink-0">
                Qty {item.quantity}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Timings & Cost details */}
      <div className="border-t border-slate-150/50 dark:border-zinc-900/50 pt-2.5 grid grid-cols-2 gap-3">
        <div className="space-y-0.5">
          <span className="text-[8px] text-slate-400 uppercase tracking-widest block font-black flex items-center gap-1">
            <Clock size={10} /> Packaging Ready
          </span>
          <span className="font-extrabold text-slate-800 dark:text-zinc-200">
            {formatTime(order.packagingCompletedAt || order.readyAt || order.createdAt)}
          </span>
        </div>

        <div className="space-y-0.5 text-right">
          <span className="text-[8px] text-slate-400 uppercase tracking-widest block font-black flex items-center gap-1 justify-end">
            <CreditCard size={10} /> Total Value
          </span>
          <span className="font-black text-slate-900 dark:text-white text-sm">
            ₹{order.totalAmount || order.grandTotal || 0}
          </span>
        </div>
      </div>
    </div>
  );
}
