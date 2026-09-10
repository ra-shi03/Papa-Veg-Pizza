import React from "react";
import { Award, Zap, AlertTriangle, Star, Clock } from "lucide-react";

export default function PerformanceCard({ rider }) {
  if (!rider) return null;

  // Progress Calculations
  const deliveriesPct = Math.round(Math.min(100, ((rider.totalDeliveries || 0) / 3000) * 100));
  const avgTimePct = Math.round(Math.max(0, 100 - ((rider.averageDeliveryTime || 25) / 45) * 100));
  const cancellationPct = Math.round(Math.max(0, 100 - ((rider.cancellationRate || 0) / 5) * 100));
  const ratingPct = Math.round(((rider.customerRatings || 4.5) / 5) * 100);

  return (
    <div className="bg-slate-50 dark:bg-zinc-950 p-4 rounded-2.5xl border border-slate-100 dark:border-zinc-850 space-y-3.5 text-xs font-bold text-slate-700 dark:text-zinc-300 h-full">
      <div className="flex items-center gap-1.5 border-b border-slate-200/50 dark:border-zinc-800/80 pb-2">
        <Award size={14} className="text-[var(--primary)]" />
        <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
          Performance Analytics
        </h4>
      </div>

      <div className="space-y-4">
        {/* Total Deliveries */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-slate-500 font-extrabold flex items-center gap-1">
              <Zap size={11} className="text-amber-500" />
              Total Deliveries
            </span>
            <span className="text-slate-900 dark:text-white font-black">{rider.totalDeliveries}</span>
          </div>
          <div className="h-2 bg-slate-200 dark:bg-zinc-850 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${deliveriesPct}%` }} />
          </div>
        </div>

        {/* Avg Delivery Time */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-slate-500 font-extrabold flex items-center gap-1">
              <Clock size={11} className="text-blue-500" />
              Avg Delivery Time
            </span>
            <span className="text-slate-900 dark:text-white font-black">{rider.averageDeliveryTime} mins</span>
          </div>
          <div className="h-2 bg-slate-200 dark:bg-zinc-850 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${avgTimePct}%` }} />
          </div>
        </div>

        {/* Cancellation Rate */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-slate-500 font-extrabold flex items-center gap-1">
              <AlertTriangle size={11} className="text-rose-500" />
              Cancellation Rate
            </span>
            <span className="text-slate-900 dark:text-white font-black">{rider.cancellationRate}%</span>
          </div>
          <div className="h-2 bg-slate-200 dark:bg-zinc-850 rounded-full overflow-hidden">
            <div className="h-full bg-rose-500 rounded-full" style={{ width: `${cancellationPct}%` }} />
          </div>
        </div>

        {/* Customer Rating */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-slate-500 font-extrabold flex items-center gap-1">
              <Star size={11} className="text-emerald-500" />
              Customer Ratings
            </span>
            <span className="text-slate-900 dark:text-white font-black">{rider.customerRatings} / 5</span>
          </div>
          <div className="h-2 bg-slate-200 dark:bg-zinc-850 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${ratingPct}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
