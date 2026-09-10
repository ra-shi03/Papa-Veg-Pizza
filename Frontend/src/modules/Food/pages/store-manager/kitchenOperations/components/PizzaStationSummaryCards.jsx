import React from "react";
import { UserCheck, FileCheck, Clock, ShieldAlert } from "lucide-react";

export default function PizzaStationSummaryCards({ items = [] }) {
  // 1. Assigned Pizzas (status === "assigned")
  const assignedCount = items.filter((i) => i.assembly_status === "assigned").length;

  // 2. Completed Pizzas (status === "assembly_completed")
  const completedCount = items.filter((i) => i.assembly_status === "assembly_completed").length;

  // 3. Delayed Pizzas (elapsed > target_time for non-completed items)
  const delayedCount = items.filter((i) => {
    if (!i.assembly_started_time || i.assembly_status === "assembly_completed") return false;
    const elapsed = Math.floor((new Date() - new Date(i.assembly_started_time)) / 60000);
    return elapsed > (i.target_time || 10);
  }).length;

  // 4. Average Prep Time (mocked static or derived from completed timeline in minutes)
  const avgPrepTime = 8; // 8 minutes average

  const cards = [
    {
      title: "Assigned Pizzas",
      value: assignedCount,
      trend: "Pizzas waiting on assemble",
      icon: UserCheck,
      color: "text-amber-500 bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30"
    },
    {
      title: "Completed Pizzas",
      value: completedCount,
      trend: "Assembled, ready for bake",
      icon: FileCheck,
      color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30"
    },
    {
      title: "Delayed Pizzas",
      value: delayedCount,
      trend: delayedCount > 0 ? "Requires Intervention" : "Within assembly targets",
      icon: ShieldAlert,
      color: delayedCount > 0
        ? "text-rose-600 bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 animate-pulse"
        : "text-slate-500 bg-slate-50 dark:bg-zinc-900 border-slate-100 dark:border-zinc-800"
    },
    {
      title: "Avg Prep Time",
      value: `${avgPrepTime} mins`,
      trend: "Target assembly speed",
      icon: Clock,
      color: "text-blue-500 bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30"
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
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-450 dark:text-zinc-550">
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
