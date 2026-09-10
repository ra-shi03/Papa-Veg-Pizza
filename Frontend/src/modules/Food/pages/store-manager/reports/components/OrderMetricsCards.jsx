import React from "react";
import { ShoppingBag, CheckCircle, XCircle, Clock, Truck, RefreshCw, Tag } from "lucide-react";

// Skeletons
const SkeletonCard = () => (
  <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-4.5 rounded-3xl animate-pulse space-y-3.5 shadow-sm">
    <div className="flex justify-between items-center">
      <div className="w-16 h-3 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
      <div className="w-6 h-6 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
    </div>
    <div className="w-24 h-6 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
    <div className="w-14 h-3 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
  </div>
);

export default function OrderMetricsCards({ data, isLoading }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 7 }).map((_, idx) => (
          <SkeletonCard key={idx} />
        ))}
      </div>
    );
  }

  const {
    totalOrders = 0,
    completedOrders = 0,
    cancelledOrders = 0,
    avgPreparationTime = 0,
    avgDeliveryTime = 0,
    refundOrders = 0,
    couponUsageCount = 0,
    couponUsagePercentage = 0
  } = data || {};

  const cardConfigs = [
    {
      title: "Total Orders",
      value: totalOrders.toLocaleString("en-IN"),
      icon: ShoppingBag,
      color: "text-[var(--primary)] bg-red-50 dark:bg-red-950/20",
      subtext: "Gross order requests"
    },
    {
      title: "Completed Orders",
      value: completedOrders.toLocaleString("en-IN"),
      icon: CheckCircle,
      color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20",
      subtext: "Successful operations"
    },
    {
      title: "Cancelled Orders",
      value: cancelledOrders.toLocaleString("en-IN"),
      icon: XCircle,
      color: "text-rose-500 bg-rose-50 dark:bg-rose-950/20",
      subtext: "Bounced / Rejected"
    },
    {
      title: "Avg Prep Duration",
      value: `${avgPreparationTime} mins`,
      icon: Clock,
      color: "text-amber-500 bg-amber-50 dark:bg-amber-950/20",
      subtext: "Kitchen ticket times"
    },
    {
      title: "Avg Delivery Time",
      value: avgDeliveryTime > 0 ? `${avgDeliveryTime} mins` : "--",
      icon: Truck,
      color: "text-blue-500 bg-blue-50 dark:bg-blue-950/20",
      subtext: "Rider dispatch times"
    },
    {
      title: "Refunded Orders",
      value: refundOrders.toLocaleString("en-IN"),
      icon: RefreshCw,
      color: "text-purple-500 bg-purple-50 dark:bg-purple-950/20",
      subtext: "Reversals processed"
    },
    {
      title: "Coupon Redemptions",
      value: couponUsageCount.toLocaleString("en-IN"),
      icon: Tag,
      color: "text-teal-500 bg-teal-50 dark:bg-teal-950/20",
      subtext: `${couponUsagePercentage}% of total orders`
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cardConfigs.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-4.5 rounded-3xl flex flex-col justify-between hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 shadow-sm cursor-pointer"
          >
            <div className="flex justify-between items-start gap-2">
              <span className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider truncate">
                {card.title}
              </span>
              <div className={`p-1.5 rounded-xl ${card.color} flex items-center justify-center shrink-0`}>
                <Icon size={13} className="stroke-[2.2]" />
              </div>
            </div>

            <div className="mt-3">
              <span className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {card.value}
              </span>
            </div>

            <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-zinc-50 dark:border-zinc-850">
              <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-semibold truncate">
                {card.subtext}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
