import React from "react";
import { ShoppingBag, CreditCard, Clock } from "lucide-react";

export default function OrderCard({ order }) {
  if (!order) return null;

  const formatTime = (timeStr) => {
    if (!timeStr) return "Not Picked Up";
    try {
      const d = new Date(timeStr);
      return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    } catch (_) {
      return timeStr;
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-855 rounded-2xl p-3.5 space-y-3">
      <div className="flex items-center gap-2 border-b border-slate-200/50 dark:border-zinc-800/50 pb-2">
        <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-blue-600 flex items-center justify-center">
          <ShoppingBag size={14} />
        </div>
        <div>
          <h4 className="text-xs font-black uppercase text-slate-400 dark:text-zinc-555 tracking-wider leading-none">Order</h4>
          <span className="text-[11px] font-extrabold text-slate-800 dark:text-zinc-200 mt-1 block">ID: {order.orderId}</span>
        </div>
      </div>

      <div className="space-y-2 text-[11px] font-bold text-slate-600 dark:text-zinc-400">
        {/* Items List */}
        <div className="space-y-1">
          <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider block">Items Summary</span>
          <div className="max-h-20 overflow-y-auto space-y-1 divide-y divide-slate-150/30 dark:divide-zinc-800/40 pr-1 select-none">
            {order.items?.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-[10px] py-1 first:pt-0">
                <span className="text-slate-800 dark:text-zinc-300">
                  {item.name} <span className="text-slate-400 font-semibold text-[9px]">({item.size})</span>
                </span>
                <span className="text-slate-900 dark:text-white font-extrabold font-mono">x{item.quantity}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing and Pickup */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/40 dark:border-zinc-800/40 text-[10px]">
          <div className="flex items-center gap-1.5">
            <CreditCard size={12} className="text-slate-400" />
            <span className="font-extrabold text-slate-900 dark:text-white font-mono">₹{order.amount}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={12} className="text-slate-400" />
            <span className="text-[9px] text-slate-800 dark:text-zinc-300 font-bold">
              {formatTime(order.pickupTime)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
