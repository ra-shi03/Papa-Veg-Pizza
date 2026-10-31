import React from "react";
import { Award, Zap, AlertTriangle, Star, Clock, Package, CalendarCheck } from "lucide-react";

// Real figures from the rider's orders; a dash where there is nothing to measure yet (no made-up targets or bars).
const dash = <span className="text-slate-400 font-semibold">—</span>;

function Stat({ icon: Icon, color, label, children }) {
  return (
    <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-850">
      <span className="text-[9px] text-slate-500 font-extrabold flex items-center gap-1 uppercase tracking-wider">
        <Icon size={11} className={color} />
        {label}
      </span>
      <div className="mt-1 text-lg font-black text-slate-900 dark:text-white leading-none">{children}</div>
    </div>
  );
}

export default function PerformanceCard({ rider }) {
  if (!rider) return null;
  const hasTime = rider.averageDeliveryTime != null;
  const hasCancel = rider.cancellationRate != null;
  const hasRating = Number(rider.ratingCount) > 0 || Number(rider.customerRatings) > 0;

  return (
    <div className="bg-white dark:bg-zinc-950 p-4 rounded-2xl border border-slate-200/70 dark:border-zinc-850 text-xs font-bold text-slate-700 dark:text-zinc-300 h-full shadow-sm">
      <div className="flex items-center gap-1.5 border-b border-slate-200/60 dark:border-zinc-800/80 pb-2 mb-3">
        <Award size={14} className="text-[var(--primary)]" />
        <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Performance</h4>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <Stat icon={Zap} color="text-amber-500" label="Deliveries">{rider.totalDeliveries ?? 0}</Stat>
        <Stat icon={CalendarCheck} color="text-emerald-500" label="Today">{rider.todayDeliveries ?? 0}</Stat>
        <Stat icon={Package} color="text-orange-500" label="Active orders">{rider.activeOrders ?? 0}</Stat>
        <Stat icon={Clock} color="text-blue-500" label="Avg time">
          {hasTime ? <>{rider.averageDeliveryTime}<span className="text-[11px] font-bold text-slate-400"> min</span></> : dash}
        </Stat>
        <Stat icon={AlertTriangle} color="text-rose-500" label="Cancelled">
          {hasCancel ? <>{rider.cancellationRate}<span className="text-[11px] font-bold text-slate-400">%</span></> : dash}
        </Stat>
        <Stat icon={Star} color="text-yellow-500" label="Rating">
          {hasRating ? <>{Number(rider.customerRatings).toFixed(1)}<span className="text-[11px] font-bold text-slate-400"> / 5</span></> : dash}
        </Stat>
      </div>
      <p className="text-[9px] font-semibold text-slate-400 mt-3">Counted from this rider's orders at this store in the last 30 days.</p>
    </div>
  );
}
