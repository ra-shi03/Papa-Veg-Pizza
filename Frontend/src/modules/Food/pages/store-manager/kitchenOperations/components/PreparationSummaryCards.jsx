import React from "react";
import { ChefHat, Flame, Clock, ShieldAlert } from "lucide-react";

export default function PreparationSummaryCards({ items = [] }) {
  // 1. Active Pizzas (any pizza that is not ready_for_baking or is in active preparation)
  const activeCount = items.length;

  // 2. Ready For Baking (current_stage === "ready_for_baking")
  const readyBakingCount = items.filter(
    (i) => i.current_stage === "ready_for_baking"
  ).length;

  // 3. Delayed Items (elapsed > estimated_time)
  const delayedCount = items.filter((i) => {
    if (!i.started_time) return false;
    const elapsed = Math.floor((new Date() - new Date(i.started_time)) / 60000);
    return elapsed > (i.estimated_time || 12);
  }).length;

  // 4. Average Preparation Time (mocked static or derived from completed timeline)
  const avgPrepTime = 11; // 11 minutes average

  const cards = [
    {
      title: "Active Pizzas",
      value: activeCount,
      trend: "Pizzas in preparation line",
      icon: ChefHat,
      color: "text-amber-500 bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30"
    },
    {
      title: "Ready For Baking",
      value: readyBakingCount,
      trend: "Waiting for oven slot",
      icon: Flame,
      color: "text-blue-500 bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30"
    },
    {
      title: "Delayed Items",
      value: delayedCount,
      trend: delayedCount > 0 ? "Requires Intervention" : "Within estimated times",
      icon: ShieldAlert,
      color: delayedCount > 0
        ? "text-rose-600 bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 animate-pulse"
        : "text-slate-500 bg-slate-50 dark:bg-zinc-900 border-slate-100 dark:border-zinc-850"
    },
    {
      title: "Avg Prep Time",
      value: `${avgPrepTime} mins`,
      trend: "Optimized SLA target",
      icon: Clock,
      color: "text-purple-500 bg-purple-50 dark:bg-purple-950/20 border-purple-100 dark:border-purple-900/30"
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
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-450 dark:text-zinc-500">
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
