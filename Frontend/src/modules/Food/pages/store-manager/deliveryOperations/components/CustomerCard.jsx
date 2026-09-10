import React from "react";
import { User, Phone, MapPin } from "lucide-react";

export default function CustomerCard({ customer }) {
  if (!customer) return null;

  return (
    <div className="bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-855 rounded-2xl p-3.5 space-y-3">
      <div className="flex items-center gap-2 border-b border-slate-200/50 dark:border-zinc-800/50 pb-2">
        <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 flex items-center justify-center">
          <User size={14} />
        </div>
        <div>
          <h4 className="text-xs font-black uppercase text-slate-400 dark:text-zinc-555 tracking-wider leading-none">Customer</h4>
          <span className="text-[11px] font-extrabold text-slate-800 dark:text-zinc-200 mt-1 block">{customer.name}</span>
        </div>
      </div>

      <div className="space-y-2 text-[11px] font-bold text-slate-600 dark:text-zinc-400">
        <div className="flex items-center gap-2">
          <Phone size={12} className="text-slate-400" />
          <a href={`tel:${customer.phone}`} className="hover:underline text-[10px] text-slate-800 dark:text-zinc-300">
            {customer.phone}
          </a>
        </div>
        <div className="flex items-start gap-2">
          <MapPin size={12} className="text-slate-400 shrink-0 mt-0.5" />
          <span className="text-[10px] text-slate-800 dark:text-zinc-300 leading-normal">
            {customer.address}
          </span>
        </div>
      </div>
    </div>
  );
}
