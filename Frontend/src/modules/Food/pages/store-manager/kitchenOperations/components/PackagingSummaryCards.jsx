import React from "react";
import { Package, CheckSquare, Clock, ArrowUpRight } from "lucide-react";

export default function PackagingSummaryCards({ orders = [] }) {
  const safeOrders = Array.isArray(orders) ? orders : [];

  // 1. Ready For Packaging: packaging_status === "ready_for_packaging"
  const readyCount = safeOrders.filter((o) => o.packaging_status === "ready_for_packaging").length;

  // 2. Packed Orders: packaging_status === "sealed"
  const packedCount = safeOrders.filter((o) => o.packaging_status === "sealed").length;

  // 3. Pending Pickup: status === "ready_for_pickup"
  const pendingPickupCount = safeOrders.filter((o) => o.status === "ready_for_pickup").length;

  // 4. Packaging Time: Average (end_time - start_time) in minutes
  const completedOrders = safeOrders.filter(
    (o) => o.packaging_start_time && o.packaging_end_time
  );

  let avgPackagingTime = 5; // default 5 minutes
  if (completedOrders.length > 0) {
    const totalDiffMs = completedOrders.reduce((acc, curr) => {
      const diff = new Date(curr.packaging_end_time) - new Date(curr.packaging_start_time);
      return acc + diff;
    }, 0);
    const avgMin = Math.round((totalDiffMs / completedOrders.length) / 60000);
    if (avgMin > 0) avgPackagingTime = avgMin;
  }

  const cards = [
    {
      title: "Ready For Packaging",
      value: readyCount,
      trend: "Orders waiting at slicer table",
      icon: Package,
      color: "text-blue-500 bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30"
    },
    {
      title: "Packed Orders",
      value: packedCount,
      trend: "Sealed, waiting for ready check",
      icon: CheckSquare,
      color: "text-amber-500 bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30"
    },
    {
      title: "Avg Packaging Time",
      value: `${avgPackagingTime} min`,
      trend: "Target: under 5 minutes",
      icon: Clock,
      color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30"
    },
    {
      title: "Pending Pickup",
      value: pendingPickupCount,
      trend: "Placed on pickup counters",
      icon: ArrowUpRight,
      color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/30"
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
