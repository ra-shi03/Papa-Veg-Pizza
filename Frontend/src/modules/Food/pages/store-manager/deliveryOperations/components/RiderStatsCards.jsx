import React from "react";
import { UserCheck, UserX, ShoppingBag, Clock } from "lucide-react";

export default function RiderStatsCards({ riders = [] }) {
  const safeRiders = Array.isArray(riders) ? riders : [];

  // 1. Online Riders
  const onlineCount = safeRiders.filter((r) => r.availability === "online").length;

  // 2. Offline Riders
  const offlineCount = safeRiders.filter((r) => r.availability === "offline").length;

  // 3. Busy Riders
  const busyCount = safeRiders.filter((r) => r.currentStatus === "busy").length;

  // 4. Average Delivery Time
  const activeRidersWithTime = safeRiders.filter((r) => r.averageDeliveryTime > 0);
  const avgTime = activeRidersWithTime.length > 0
    ? (activeRidersWithTime.reduce((sum, r) => sum + r.averageDeliveryTime, 0) / activeRidersWithTime.length).toFixed(1)
    : "0.0";

  const cards = [
    {
      title: "Online Riders",
      value: onlineCount,
      trend: "Available for delivery assignment",
      icon: UserCheck,
      color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/20"
    },
    {
      title: "Offline Riders",
      value: offlineCount,
      trend: "Currently off shift duty",
      icon: UserX,
      color: "text-slate-500 bg-slate-50 dark:bg-zinc-800 dark:border-zinc-850 border-slate-100 dark:text-zinc-400"
    },
    {
      title: "Busy Riders",
      value: busyCount,
      trend: "Actively delivering orders",
      icon: ShoppingBag,
      color: "text-orange-500 bg-orange-50 dark:bg-orange-950/10 border-orange-100 dark:border-orange-900/20"
    },
    {
      title: "Avg Delivery Time",
      value: `${avgTime} mins`,
      trend: "Store-wide dispatch SLA avg",
      icon: Clock,
      color: "text-blue-500 bg-blue-50 dark:bg-blue-950/10 border-blue-100 dark:border-blue-900/20"
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
