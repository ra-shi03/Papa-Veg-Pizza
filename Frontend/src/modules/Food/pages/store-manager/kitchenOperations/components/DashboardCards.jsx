import React from "react";
import { Clock, AlertTriangle, AlertCircle, ShoppingBag, Flame } from "lucide-react";

export default function DashboardCards({ orders = [] }) {
  // 1. Orders Waiting (status === "queued")
  const queuedOrders = orders.filter((o) => o.status === "queued");
  const queuedCount = queuedOrders.length;

  // 2. Avg Waiting Time (currentTime - queueEntryTime) in minutes for queued orders
  let avgWaitingTime = 0;
  if (queuedCount > 0) {
    const totalWaiting = queuedOrders.reduce((acc, curr) => {
      if (!curr.queueEntryTime) return acc;
      const waiting = Math.floor((new Date() - new Date(curr.queueEntryTime)) / 60000);
      return acc + Math.max(0, waiting);
    }, 0);
    avgWaitingTime = Math.round(totalWaiting / queuedCount);
  }

  // 3. High Priority Orders (VIP or EXPRESS) in active queue
  const highPriorityCount = orders.filter(
    (o) => o.priority === "VIP" || o.priority === "EXPRESS"
  ).length;

  // 4. Delayed Queue Orders (waiting_time > sla_minutes)
  const delayedCount = orders.filter((o) => {
    if (o.status !== "queued" || !o.queueEntryTime) return false;
    const waiting = Math.floor((new Date() - new Date(o.queueEntryTime)) / 60000);
    const sla = o.sla_minutes || 20;
    return waiting > sla;
  }).length;

  const cards = [
    {
      title: "Orders Waiting",
      value: queuedCount,
      trend: "+12% vs last hour",
      description: "Queued kitchen intake",
      icon: ShoppingBag,
      color: "text-amber-500 bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30"
    },
    {
      title: "Avg Waiting Time",
      value: `${avgWaitingTime} mins`,
      trend: "Optimal preparation SLA",
      description: "From queue entry to cook",
      icon: Clock,
      color: "text-blue-500 bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30"
    },
    {
      title: "High Priority",
      value: highPriorityCount,
      trend: "VIP / Express orders",
      description: "Requires instant prep",
      icon: Flame,
      color: "text-purple-500 bg-purple-50 dark:bg-purple-950/20 border-purple-100 dark:border-purple-900/30"
    },
    {
      title: "Delayed Queue Orders",
      value: delayedCount,
      trend: delayedCount > 0 ? "Requires Intervention" : "All within SLA limits",
      description: "Exceeding kitchen SLA",
      icon: AlertCircle,
      color: delayedCount > 0
        ? "text-rose-600 bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 animate-pulse"
        : "text-slate-500 bg-slate-50 dark:bg-zinc-900 border-slate-100 dark:border-zinc-800"
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
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
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
