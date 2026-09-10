import React from "react";
import { User, Phone, MapPin, ShoppingBag } from "lucide-react";

export default function IssueOrderCard({ order = {}, customer = {} }) {
  return (
    <div className="bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-855 rounded-2xl p-4 space-y-3.5 h-full">
      <div className="flex items-center gap-2 border-b border-slate-200/50 dark:border-zinc-800/50 pb-2">
        <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-blue-600 flex items-center justify-center">
          <ShoppingBag size={14} />
        </div>
        <div className="text-left">
          <h4 className="text-xs font-black uppercase text-slate-400 dark:text-zinc-555 tracking-wider leading-none">Order Details</h4>
          <span className="text-[11px] font-extrabold text-slate-800 dark:text-zinc-200 mt-1 block">ID: {order.orderId || "N/A"}</span>
        </div>
      </div>

      <div className="space-y-3 text-[11px] font-bold text-slate-600 dark:text-zinc-400">
        
        {/* Customer info */}
        <div className="space-y-1.5 border-b border-slate-150/40 dark:border-zinc-800/40 pb-2.5">
          <div className="flex items-center gap-1.5 text-slate-900 dark:text-white font-extrabold">
            <User size={12} className="text-slate-400" />
            <span>{customer.name || "Customer Not Loaded"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Phone size={12} className="text-slate-400" />
            <a href={`tel:${customer.phone}`} className="hover:underline text-[10px] text-slate-850 dark:text-zinc-300">
              {customer.phone || "No phone"}
            </a>
          </div>
          <div className="flex items-start gap-1.5">
            <MapPin size={12} className="text-slate-400 shrink-0 mt-0.5" />
            <span className="text-[10px] text-slate-800 dark:text-zinc-300 leading-normal text-left">
              {customer.address || "Address Not Available"}
            </span>
          </div>
        </div>

        {/* Pizza Items */}
        <div className="space-y-1">
          <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider block text-left">Items List</span>
          <div className="max-h-24 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-150/20 dark:divide-zinc-800/30">
            {order.items?.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-[10px] py-1 first:pt-0">
                <span className="text-slate-850 dark:text-zinc-300 text-left">
                  {item.name} <span className="text-slate-400 font-semibold text-[8px]">({item.size})</span>
                </span>
                <span className="text-slate-900 dark:text-white font-extrabold font-mono">x{item.quantity}</span>
              </div>
            ))}
            {(!order.items || order.items.length === 0) && (
              <div className="text-[10px] text-slate-400 text-left py-1">No items found</div>
            )}
          </div>
        </div>

        {/* Total Amount */}
        <div className="flex justify-between items-center pt-2 border-t border-slate-200/40 dark:border-zinc-800/40 text-[10px]">
          <span className="text-slate-400 uppercase text-[8px] font-black">Grand Total</span>
          <span className="font-extrabold text-slate-900 dark:text-white font-mono">₹{order.amount || 0}</span>
        </div>

      </div>
    </div>
  );
}
