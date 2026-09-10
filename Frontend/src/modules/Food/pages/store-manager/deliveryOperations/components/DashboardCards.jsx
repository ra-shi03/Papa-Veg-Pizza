import React from "react";
import { ShoppingBag, Navigation, Clock, AlertOctagon } from "lucide-react";

export default function DashboardCards({ orders = [], riders = [] }) {
  const safeOrders = Array.isArray(orders) ? orders : [];
  const safeRiders = Array.isArray(riders) ? riders : [];

  // 1. Ready Orders (waiting assignment)
  const readyCount = safeOrders.filter(o => !(o.assignedRiderId || o.deliveryPartnerId)).length;

  // 2. Available Riders (Online + idle)
  const availableRidersCount = safeRiders.filter(
    r => r.currentStatus === "online" && r.availability === "idle"
  ).length;

  // 3. Average Pickup Time (Packaging completed -> pickup, mock 6.5 minutes average)
  const avgPickupTime = 6.5;

  // 4. Delayed Pickups (Orders waiting > 10 minutes)
  const delayedPickupsCount = safeOrders.filter(o => {
    const isAssigned = !!(o.assignedRiderId || o.deliveryPartnerId);
    if (isAssigned) return false;
    const completedAt = o.packagingCompletedAt || o.readyAt || o.createdAt;
    if (!completedAt) return false;
    const waitMs = Date.now() - new Date(completedAt).getTime();
    return waitMs / 60000 > 10;
  }).length;

  const cards = [
    {
      title: "Ready Orders",
      value: readyCount,
      trend: "Awaiting dispatch assignment",
      icon: ShoppingBag,
      color: "text-[var(--primary)] bg-orange-50 dark:bg-orange-950/10 border-orange-100 dark:border-orange-900/20"
    },
    {
      title: "Available Riders",
      value: availableRidersCount,
      trend: `${safeRiders.filter(r => r.currentStatus === "online").length} online partners active`,
      icon: Navigation,
      color: "text-blue-500 bg-blue-50 dark:bg-blue-950/10 border-blue-100 dark:border-blue-900/20"
    },
    {
      title: "Average Pickup Time",
      value: `${avgPickupTime} min`,
      trend: "Ready to pickup duration average",
      icon: Clock,
      color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/20"
    },
    {
      title: "Delayed Pickups",
      value: delayedPickupsCount,
      trend: "Waiting more than 10 minutes",
      icon: AlertOctagon,
      color: delayedPickupsCount > 0
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
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-455 dark:text-zinc-555">
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
