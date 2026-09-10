import React from "react";
import { Store, Pizza, Sparkles, Tag, AlertOctagon } from "lucide-react";

export default function PricingStatsCards({ stats, isLoading }) {
  const cardConfig = [
    {
      title: "Stores",
      value: stats?.totalStoresCount || 0,
      subtext: "Total store outlets",
      icon: Store,
      color: "text-blue-500",
      bg: "bg-blue-500/10 dark:bg-blue-500/20",
      border: "border-blue-100 dark:border-blue-900/30"
    },
    {
      title: "Products",
      value: stats?.totalProductsCount || 0,
      subtext: "Global catalog size",
      icon: Pizza,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10 dark:bg-emerald-500/20",
      border: "border-emerald-100 dark:border-emerald-900/30"
    },
    {
      title: "Custom Pricing",
      value: stats?.customPricingCount || 0,
      subtext: "Overrides active",
      icon: Sparkles,
      color: "text-purple-500",
      bg: "bg-purple-500/10 dark:bg-purple-500/20",
      border: "border-purple-100 dark:border-purple-900/30"
    },
    {
      title: "Promotional Pricing",
      value: stats?.promotionalPricingCount || 0,
      subtext: "Active campaigns",
      icon: Tag,
      color: "text-orange-500",
      bg: "bg-orange-500/10 dark:bg-orange-500/20",
      border: "border-orange-100 dark:border-orange-900/30"
    },
    {
      title: "Unavailable Products",
      value: stats?.unavailableProductsCount || 0,
      subtext: "Out of stock / Hidden",
      icon: AlertOctagon,
      color: "text-rose-500",
      bg: "bg-rose-500/10 dark:bg-rose-500/20",
      border: "border-rose-100 dark:border-rose-900/30"
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div
            key={idx}
            className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-between animate-pulse min-h-[85px]"
          >
            <div className="space-y-2">
              <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-800 rounded" />
              <div className="h-5 w-12 bg-zinc-300 dark:bg-zinc-700 rounded" />
            </div>
            <div className="w-9 h-9 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {cardConfig.map((card, idx) => {
        const IconComponent = card.icon;
        return (
          <div
            key={idx}
            className={`p-3 bg-white dark:bg-zinc-900 border ${card.border} rounded-xl flex items-center justify-between shadow-xs transition-all hover:translate-y-[-2px] hover:shadow-sm`}
          >
            <div className="space-y-0.5">
              <p className="text-[9px] text-zinc-400 font-extrabold uppercase tracking-wider">{card.title}</p>
              <p className="text-lg lg:text-xl font-black text-zinc-900 dark:text-white leading-none mb-0.5">
                {card.value}
              </p>
              <p className="text-[9px] text-zinc-400 dark:text-zinc-500 font-medium">{card.subtext}</p>
            </div>
            <div className={`p-2 rounded-lg ${card.bg} ${card.color} flex items-center justify-center shrink-0`}>
              <IconComponent size={16} className="stroke-[2.2]" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
