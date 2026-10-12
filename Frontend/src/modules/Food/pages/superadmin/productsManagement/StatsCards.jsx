import React from "react";
import {
  Package,
  CheckCircle,
  FileText,
  Archive,
  Leaf,
  Sliders,
  XCircle,
  Calendar,
  TrendingUp,
  TrendingDown
} from "lucide-react";

export default function StatsCards({ stats = {}, onCardClick }) {
  const currentStats = {
    totalProducts: stats?.totalProducts ?? 0,
    activeProducts: stats?.activeProducts ?? 0,
    draftProducts: stats?.draftProducts ?? 0,
    archivedProducts: stats?.archivedProducts ?? 0,
    vegProducts: stats?.vegProducts ?? 0,
    customizableProducts: stats?.customizableProducts ?? 0,
    outOfStockProducts: stats?.outOfStockProducts ?? 0,
    addedThisMonth: stats?.addedThisMonth ?? 0,
  };

  const total = currentStats.totalProducts;
  const activePercent = total > 0 ? Math.round((currentStats.activeProducts / total) * 100) : 0;
  const vegPercent = total > 0 ? Math.round((currentStats.vegProducts / total) * 100) : 0;
  const draftPercent = total > 0 ? Math.round((currentStats.draftProducts / total) * 100) : 0;

  const cardData = [
    {
      title: "Total Products",
      value: currentStats.totalProducts,
      change: "All items",
      isPositive: true,
      isStable: true,
      icon: Package,
      color: "text-orange-500 bg-orange-50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900/30"
    },
    {
      title: "Active Products",
      value: currentStats.activeProducts,
      change: `${activePercent}%`,
      isPositive: true,
      icon: CheckCircle,
      color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30"
    },
    {
      title: "Draft Products",
      value: currentStats.draftProducts,
      change: `${draftPercent}%`,
      isPositive: currentStats.draftProducts === 0,
      isStable: currentStats.draftProducts === 0,
      icon: FileText,
      color: "text-zinc-500 bg-zinc-50 dark:bg-zinc-900/40 border-zinc-150 dark:border-zinc-800"
    },
    {
      title: "Archived Products",
      value: currentStats.archivedProducts,
      change: `${currentStats.archivedProducts} items`,
      isPositive: true,
      isStable: true,
      icon: Archive,
      color: "text-amber-500 bg-amber-50 dark:bg-amber-955/20 border-amber-100 dark:border-amber-900/30"
    },
    {
      title: "Veg Products",
      value: currentStats.vegProducts,
      change: `${vegPercent}%`,
      isPositive: true,
      icon: Leaf,
      color: "text-green-600 bg-green-50 dark:bg-green-950/20 border-green-100 dark:border-green-900/30"
    },
    {
      title: "Customizable",
      value: currentStats.customizableProducts,
      change: `${currentStats.customizableProducts} items`,
      isPositive: true,
      isStable: true,
      icon: Sliders,
      color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/30"
    },
    {
      title: "Out of Stock",
      value: currentStats.outOfStockProducts,
      change: currentStats.outOfStockProducts > 0 ? "Attention" : "All In Stock",
      isPositive: currentStats.outOfStockProducts === 0,
      isStable: currentStats.outOfStockProducts === 0,
      icon: XCircle,
      color: "text-rose-500 bg-rose-50 dark:bg-rose-955/20 border-rose-100 dark:border-rose-900/30"
    },
    {
      title: "Added This Month",
      value: currentStats.addedThisMonth,
      change: `${currentStats.addedThisMonth} new`,
      isPositive: true,
      isStable: true,
      icon: Calendar,
      color: "text-blue-500 bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30"
    }
  ];

  return (
    <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2.5 select-none">
      {cardData.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            onClick={() => onCardClick?.(card.title)}
            className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-2.5 rounded-lg flex flex-col justify-between hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 shadow-sm cursor-pointer hover:border-[var(--primary)]/40 hover:shadow-md"
            title={`Filter table by ${card.title}`}
          >
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider truncate">
                {card.title}
              </span>
              <div className={`p-1 rounded-md border ${card.color} shrink-0`}>
                <Icon size={12} className="stroke-[2.5]" />
              </div>
            </div>

            <div className="flex items-baseline justify-between mt-2 flex-wrap gap-1">
              <span className="text-sm font-black text-black dark:text-white leading-none">
                {card.value.toLocaleString("en-IN")}
              </span>
              <span
                className={`text-[8px] font-bold px-1 py-0.2 rounded-full flex items-center ${
                  card.isStable
                    ? "text-zinc-600 bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300"
                    : card.isPositive
                    ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20"
                    : "text-rose-600 bg-rose-50 dark:bg-rose-950/20"
                }`}
              >
                {!card.isStable && (card.isPositive ? <TrendingUp size={8} className="mr-0.5" /> : <TrendingDown size={8} className="mr-0.5" />)}
                {card.change}
              </span>
            </div>
          </div>
        );
      })}
    </section>
  );
}
