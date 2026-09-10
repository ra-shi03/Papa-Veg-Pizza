import React from "react";
import { Clock, AlertTriangle, AlertOctagon, IndianRupee } from "lucide-react";

export default function DelayedSummaryCards({ orders = [] }) {
  const safeOrders = Array.isArray(orders) ? orders : [];
  
  // 1. Delayed Orders count (currently active delayed orders)
  const delayedCount = safeOrders.filter(o => o.isDelayed).length;

  // 2. Average Delay Duration (in minutes)
  const delayedItems = safeOrders.filter(o => o.isDelayed && o.delay_duration);
  let avgDelay = 0;
  if (delayedItems.length > 0) {
    const totalDelay = delayedItems.reduce((acc, o) => acc + (o.delay_duration || 0), 0);
    avgDelay = Math.round(totalDelay / delayedItems.length);
  }

  // 3. Critical Delays Count (>20 minutes)
  const criticalCount = safeOrders.filter(o => o.isDelayed && o.delay_duration > 20).length;

  // 4. Affected Revenue
  const affectedRevenue = safeOrders
    .filter(o => o.isDelayed)
    .reduce((acc, o) => acc + (o.grandTotal || 0), 0);

  const formatRevenue = (value) => {
    return new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 0
    }).format(value);
  };

  const cards = [
    {
      title: "Delayed Orders",
      value: delayedCount,
      trend: "Violating service SLA thresholds",
      icon: Clock,
      color: "text-[var(--primary)] bg-orange-50 dark:bg-orange-950/10 border-orange-100 dark:border-orange-900/20"
    },
    {
      title: "Average Delay",
      value: `${avgDelay} min`,
      trend: "Exceeded prep/bake duration SLA",
      icon: AlertTriangle,
      color: "text-amber-500 bg-amber-50 dark:bg-amber-950/10 border-amber-100 dark:border-amber-900/20"
    },
    {
      title: "Critical Delays",
      value: criticalCount,
      trend: "Delayed more than 20 minutes",
      icon: AlertOctagon,
      color: criticalCount > 0
        ? "text-rose-500 bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 animate-pulse font-extrabold"
        : "text-rose-600 bg-rose-50 dark:bg-rose-950/10 border-rose-100 dark:border-rose-900/20"
    },
    {
      title: "Affected Revenue",
      value: `₹${formatRevenue(affectedRevenue)}`,
      trend: "Total value of delayed orders",
      icon: IndianRupee,
      color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30"
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`p-3.5 rounded-2xl border flex flex-col justify-between transition-all hover:shadow-sm duration-300 ${card.color}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-450 dark:text-zinc-555">
                {card.title}
              </span>
              <Icon size={16} className="shrink-0" />
            </div>
            <div className="mt-2.5">
              <h3 className="text-xl font-black text-slate-900 dark:text-white leading-none">
                {card.value}
              </h3>
              <p className="text-[9px] font-bold text-slate-500 dark:text-zinc-400 mt-1">
                {card.trend}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
