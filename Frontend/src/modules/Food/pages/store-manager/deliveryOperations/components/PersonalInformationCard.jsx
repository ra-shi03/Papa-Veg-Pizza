import React from "react";
import { User, Smartphone, Info, Star, Calendar } from "lucide-react";

export default function PersonalInformationCard({ rider }) {
  if (!rider) return null;

  return (
    <div className="bg-slate-50 dark:bg-zinc-950 p-4 rounded-2.5xl border border-slate-100 dark:border-zinc-850 space-y-3.5 text-xs font-bold text-slate-700 dark:text-zinc-300 h-full">
      <div className="flex items-center gap-1.5 border-b border-slate-200/50 dark:border-zinc-800/80 pb-2">
        <User size={14} className="text-[var(--primary)]" />
        <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
          Personal Profile
        </h4>
      </div>

      <div className="space-y-3">
        <div>
          <span className="text-[8px] text-slate-400 uppercase tracking-widest block font-black">Rider Name</span>
          <span className="font-extrabold text-sm text-slate-900 dark:text-white mt-0.5 block">{rider.name}</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-[8px] text-slate-400 uppercase tracking-widest block font-black">Contact Mobile</span>
            <span className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1 mt-0.5">
              <Smartphone size={12} className="text-slate-455" />
              {rider.mobile}
            </span>
          </div>

          <div>
            <span className="text-[8px] text-slate-400 uppercase tracking-widest block font-black">Vehicle Details</span>
            <span className="font-extrabold text-slate-900 dark:text-white mt-0.5 block">
              {rider.vehicleType} ({rider.vehicleNumber || "N/A"})
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-slate-200/40 dark:border-zinc-800/40 pt-2.5">
          <div>
            <span className="text-[8px] text-slate-400 uppercase tracking-widest block font-black">Joining Date</span>
            <span className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1 mt-0.5">
              <Calendar size={12} className="text-slate-455" />
              {rider.joiningDate ? new Date(rider.joiningDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "N/A"}
            </span>
          </div>

          <div>
            <span className="text-[8px] text-slate-400 uppercase tracking-widest block font-black">Average Rating</span>
            <span className="font-extrabold text-amber-500 flex items-center gap-0.5 mt-0.5">
              <Star size={12} fill="currentColor" className="stroke-[2.5]" />
              <span className="font-black text-xs">{rider.rating || "N/A"}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
