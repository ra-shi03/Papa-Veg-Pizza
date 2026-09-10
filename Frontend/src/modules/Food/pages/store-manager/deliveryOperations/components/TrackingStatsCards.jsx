import React from "react";
import { Navigation, Bike, CheckCircle2, Clock } from "lucide-react";

export default function TrackingStatsCards({ deliveries = [] }) {
  const safeDeliveries = Array.isArray(deliveries) ? deliveries : [];

  // Active Deliveries (status not delivered)
  const activeCount = safeDeliveries.filter((d) => d.deliveryStatus !== "delivered").length;

  // Out for Delivery
  const outForDeliveryCount = safeDeliveries.filter((d) => d.deliveryStatus === "out_for_delivery").length;

  // Delivered Today
  const deliveredCount = safeDeliveries.filter((d) => d.deliveryStatus === "delivered").length;

  // Average ETA
  const etas = safeDeliveries
    .filter((d) => d.deliveryStatus !== "delivered" && d.eta && d.eta.includes("min"))
    .map((d) => parseInt(d.eta));
  const avgEta = etas.length > 0
    ? (etas.reduce((sum, val) => sum + val, 0) / etas.length).toFixed(0)
    : "15";

  const cards = [
    {
      title: "Active Deliveries",
      value: activeCount,
      trend: "Orders currently in transit/assigned",
      icon: Navigation,
      color: "text-amber-500 bg-amber-50 dark:bg-amber-950/10 border-amber-100 dark:border-amber-900/20"
    },
    {
      title: "Out For Delivery",
      value: outForDeliveryCount,
      trend: "Riders carrying orders to customer",
      icon: Bike,
      color: "text-orange-500 bg-orange-50 dark:bg-orange-950/10 border-orange-100 dark:border-orange-900/20"
    },
    {
      title: "Delivered Today",
      value: deliveredCount,
      trend: "Successfully completed runs",
      icon: CheckCircle2,
      color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/20"
    },
    {
      title: "Average ETA",
      value: `${avgEta} mins`,
      trend: "Estimated arrival time store average",
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
