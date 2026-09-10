import React from "react";
import { Bike, Phone, Star } from "lucide-react";

export default function RiderCard({ rider }) {
  if (!rider) return null;

  return (
    <div className="bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-855 rounded-2xl p-3.5 space-y-3">
      <div className="flex items-center gap-2 border-b border-slate-200/50 dark:border-zinc-800/50 pb-2">
        <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-600 flex items-center justify-center">
          <Bike size={14} />
        </div>
        <div>
          <h4 className="text-xs font-black uppercase text-slate-400 dark:text-zinc-555 tracking-wider leading-none">Rider</h4>
          <span className="text-[11px] font-extrabold text-slate-800 dark:text-zinc-200 mt-1 block">{rider.name}</span>
        </div>
      </div>

      <div className="space-y-2 text-[11px] font-bold text-slate-600 dark:text-zinc-400">
        <div className="flex items-center gap-2">
          <Phone size={12} className="text-slate-400" />
          <a href={`tel:${rider.mobile}`} className="hover:underline text-[10px] text-slate-800 dark:text-zinc-300">
            {rider.mobile}
          </a>
        </div>
        <div className="flex items-center justify-between text-[10px]">
          <div className="flex items-center gap-1">
            <span className="text-slate-400 uppercase text-[8px] font-black">Vehicle:</span>
            <span className="text-slate-800 dark:text-zinc-300">{rider.vehicleNumber || "N/A"}</span>
          </div>
          {rider.rating && (
            <div className="flex items-center gap-0.5 text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-md font-black text-[9px]">
              <Star size={8} fill="currentColor" />
              <span>{rider.rating}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
