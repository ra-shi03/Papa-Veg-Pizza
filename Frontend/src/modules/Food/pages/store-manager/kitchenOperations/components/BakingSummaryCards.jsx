import React from "react";
import { Flame, Inbox, Clock, ShieldAlert } from "lucide-react";

export default function BakingSummaryCards({ items = [], ovens = [], issues = [] }) {
  const safeItems = Array.isArray(items) ? items : [];
  const safeOvens = Array.isArray(ovens) ? ovens : [];
  const safeIssues = Array.isArray(issues) ? issues : [];

  // 1. Pizzas Baking: status === "baking_started"
  const bakingCount = safeItems.filter((i) => i.baking_status === "baking_started" && !i.paused).length;

  // 2. Available Ovens: status === "available"
  const availableOvensCount = safeOvens.filter((o) => o.status === "available").length;

  // 3. Average Bake Time: completed_time - started_time (in minutes)
  const completedPizzas = safeItems.filter(
    (i) => i.baking_status === "baking_completed" && i.started_time && i.completed_time
  );
  
  let avgBakeTime = 8; // default 8 minutes
  if (completedPizzas.length > 0) {
    const totalDiffMs = completedPizzas.reduce((acc, curr) => {
      const diff = new Date(curr.completed_time) - new Date(curr.started_time);
      return acc + diff;
    }, 0);
    const avgMin = Math.round((totalDiffMs / completedPizzas.length) / 60000);
    if (avgMin > 0) avgBakeTime = avgMin;
  }

  // 4. Overcooked Alerts: issueType === "Overcooked"
  const overcookedCount = safeIssues.filter((iss) => iss.issueType === "Overcooked").length;

  const cards = [
    {
      title: "Pizzas Baking",
      value: bakingCount,
      trend: "Currently inside active deck",
      icon: Flame,
      color: "text-amber-500 bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30"
    },
    {
      title: "Available Ovens",
      value: availableOvensCount,
      trend: `${ovens.length - availableOvensCount} / ${ovens.length} decks occupied`,
      icon: Inbox,
      color: "text-blue-500 bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30"
    },
    {
      title: "Average Bake Time",
      value: `${avgBakeTime} min`,
      trend: "Based on active logs",
      icon: Clock,
      color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30"
    },
    {
      title: "Overcooked Alerts",
      value: overcookedCount,
      trend: overcookedCount > 0 ? "Requires Temperature Calibration" : "Zero high temperature warnings",
      icon: ShieldAlert,
      color: overcookedCount > 0
        ? "text-rose-500 bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 animate-pulse font-extrabold"
        : "text-rose-600 bg-rose-50 dark:bg-rose-950/10 border-rose-100 dark:border-rose-900/20"
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
