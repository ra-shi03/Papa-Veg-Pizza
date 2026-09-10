import React from "react";
import { Clock, Activity, CheckCircle, AlertTriangle, Zap, Trophy } from "lucide-react";

export default function TaskStatsCards({ stats = {}, loading = false }) {
  const cards = [
    {
      title: "Pending Tasks",
      value: stats?.pendingTasks ?? 0,
      subtext: "Waiting to start",
      icon: Clock,
      color: "text-blue-500 bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30",
    },
    {
      title: "In Progress",
      value: stats?.inProgressTasks ?? 0,
      subtext: "Currently prepping",
      icon: Activity,
      color: "text-rose-500 bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30",
    },
    {
      title: "Completed Today",
      value: stats?.completedToday ?? 0,
      subtext: "Tasks cleared today",
      icon: CheckCircle,
      color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30",
    },
    {
      title: "Delayed Tasks",
      value: stats?.delayedTasks ?? 0,
      subtext: "Attention required",
      icon: AlertTriangle,
      color: "text-amber-500 bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30",
    },
    {
      title: "Avg Completion Time",
      value: stats?.avgCompletionTime || "N/A",
      subtext: "Shift speed index",
      icon: Zap,
      color: "text-purple-500 bg-purple-50 dark:bg-purple-950/20 border-purple-100 dark:border-purple-900/30",
    },
    {
      title: "Performance Score",
      value: stats?.performanceScore || "N/A",
      subtext: "Quality & speed rating",
      icon: Trophy,
      color: "text-[var(--primary)] bg-[var(--primary)]/5 border-[var(--primary)]/10",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-3 rounded-xl shadow-sm animate-pulse flex flex-col justify-between h-[85px]"
          >
            <div className="flex items-center justify-between">
              <div className="h-2 w-16 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
              <div className="w-5 h-5 rounded bg-zinc-200 dark:bg-zinc-800" />
            </div>
            <div className="space-y-1">
              <div className="h-4 w-10 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
              <div className="h-2 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-3 rounded-xl flex flex-col justify-between shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 h-[85px] group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                {card.title}
              </span>
              <div className={`p-1 rounded border ${card.color} shrink-0 flex items-center justify-center`}>
                <Icon size={11} className="stroke-[2.5]" />
              </div>
            </div>
            <div className="flex flex-col gap-0.5 mt-1">
              <span className="text-base font-black text-slate-800 dark:text-zinc-200">
                {card.value}
              </span>
              <span className="text-[8px] font-semibold text-slate-450 dark:text-zinc-550 block truncate">
                {card.subtext}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
