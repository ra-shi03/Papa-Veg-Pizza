import React from "react";
import { Shield, Clock, ExternalLink, Activity } from "lucide-react";

export default function CurrentStatusCard({ rider }) {
  if (!rider) return null;

  const isOnline = rider.availability === "online";
  const isIdle = rider.currentStatus === "idle";

  const getRelativeTime = (timeStr) => {
    if (!timeStr) return "N/A";
    const diffMs = Date.now() - new Date(timeStr).getTime();
    const diffMins = Math.max(0, Math.floor(diffMs / 60000));
    if (diffMins === 0) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    return `${diffHrs}h ago`;
  };

  const availabilityBadge = isOnline
    ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/15 dark:text-emerald-400 dark:border-emerald-900/30"
    : "bg-slate-50 text-slate-700 border-slate-100 dark:bg-zinc-850 dark:text-zinc-400 dark:border-zinc-850";

  const statusBadge = isIdle
    ? "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/15 dark:text-blue-400 dark:border-blue-900/30"
    : "bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-950/10 dark:text-orange-400 dark:border-orange-900/20";

  return (
    <div className="bg-slate-50 dark:bg-zinc-950 p-4 rounded-2.5xl border border-slate-100 dark:border-zinc-850 space-y-3.5 text-xs font-bold text-slate-700 dark:text-zinc-300 h-full">
      <div className="flex items-center gap-1.5 border-b border-slate-200/50 dark:border-zinc-800/80 pb-2">
        <Activity size={14} className="text-[var(--primary)]" />
        <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
          Active Status
        </h4>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-[8px] text-slate-400 uppercase tracking-widest block font-black mb-1">Availability</span>
            <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md border inline-block ${availabilityBadge}`}>
              {rider.availability || "Offline"}
            </span>
          </div>

          <div>
            <span className="text-[8px] text-slate-400 uppercase tracking-widest block font-black mb-1">Duty Status</span>
            <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md border inline-block ${statusBadge}`}>
              {rider.currentStatus || "Idle"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-slate-200/40 dark:border-zinc-800/40 pt-2.5">
          <div>
            <span className="text-[8px] text-slate-400 uppercase tracking-widest block font-black">Current Order</span>
            {rider.currentOrderId ? (
              <span className="text-slate-900 dark:text-white font-extrabold flex items-center gap-0.5 mt-0.5">
                <span className="text-[var(--primary)]">#{rider.currentOrderId}</span>
                <ExternalLink size={9} className="text-slate-450" />
              </span>
            ) : (
              <span className="text-slate-400 font-medium mt-0.5 block">-</span>
            )}
          </div>

          <div>
            <span className="text-[8px] text-slate-400 uppercase tracking-widest block font-black">Last Active</span>
            <span className="font-extrabold text-slate-800 dark:text-zinc-200 flex items-center gap-1 mt-0.5">
              <Clock size={11} className="text-slate-400" />
              {getRelativeTime(rider.lastActive)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
