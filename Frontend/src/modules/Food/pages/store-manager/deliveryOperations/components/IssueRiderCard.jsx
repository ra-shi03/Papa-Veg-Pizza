import React from "react";
import { Bike, Phone, MapPin, Star, Clock } from "lucide-react";

export default function IssueRiderCard({ rider = {} }) {
  const formatTime = (timeStr) => {
    if (!timeStr) return "N/A";
    try {
      const d = new Date(timeStr);
      return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    } catch (_) {
      return timeStr;
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-855 rounded-2xl p-4 space-y-3.5 h-full">
      <div className="flex items-center gap-2 border-b border-slate-200/50 dark:border-zinc-800/50 pb-2">
        <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-600 flex items-center justify-center">
          <Bike size={14} />
        </div>
        <div className="text-left">
          <h4 className="text-xs font-black uppercase text-slate-400 dark:text-zinc-555 tracking-wider leading-none">Rider Details</h4>
          <span className="text-[11px] font-extrabold text-slate-800 dark:text-zinc-200 mt-1 block">{rider.name || "Rider Not Assigned"}</span>
        </div>
      </div>

      <div className="space-y-3 text-[11px] font-bold text-slate-600 dark:text-zinc-400">
        
        {/* Contact */}
        <div className="flex items-center gap-1.5 border-b border-slate-150/40 dark:border-zinc-800/40 pb-2.5">
          <Phone size={12} className="text-slate-400" />
          <a href={`tel:${rider.mobile}`} className="hover:underline text-[10px] text-slate-850 dark:text-zinc-300">
            {rider.mobile || "No phone number"}
          </a>
        </div>

        {/* Vehicle & Rating details */}
        <div className="space-y-2 border-b border-slate-150/40 dark:border-zinc-800/40 pb-2.5 text-left">
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-slate-400 uppercase text-[8px] font-black">Vehicle Number</span>
            <span className="text-slate-850 dark:text-zinc-300 font-extrabold">{rider.vehicleNumber || "N/A"}</span>
          </div>
          {rider.rating && (
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-slate-400 uppercase text-[8px] font-black">Rider Rating</span>
              <div className="flex items-center gap-0.5 text-amber-500 font-extrabold text-[9px]">
                <Star size={9} fill="currentColor" />
                <span>{rider.rating}</span>
              </div>
            </div>
          )}
        </div>

        {/* Live location status HUD */}
        <div className="bg-slate-100 dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800 rounded-xl p-2.5 space-y-1.5 text-left">
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[8px] font-black uppercase text-slate-400 dark:text-zinc-555 tracking-wider">Live Position Status</span>
          </div>
          
          <div className="space-y-1 text-[9px] text-slate-500 dark:text-zinc-400 font-extrabold">
            <div className="flex items-center gap-1">
              <MapPin size={10} className="text-slate-455" />
              <span>Coords: {rider.latitude?.toFixed(4) || "22.74"}, {rider.longitude?.toFixed(4) || "75.89"}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock size={10} className="text-slate-455" />
              <span>Last Track: {formatTime(rider.lastUpdated || new Date().toISOString())}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
