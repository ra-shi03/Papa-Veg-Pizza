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

export default function StatsCards({ stats = {} }) {
  const defaultStats = {
    totalProducts: 1284,
    activeProducts: 1210,
    draftProducts: 53,
    archivedProducts: 21,
    vegProducts: 1150,
    customizableProducts: 840,
    outOfStockProducts: 8,
    addedThisMonth: 74,
    ...stats
  };

  const cardData = [
    {
      title: "Total Products",
      value: defaultStats.totalProducts,
      change: "+4.2%",
      isPositive: true,
      icon: Package,
      color: "text-orange-500 bg-orange-50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900/30"
    },
    {
      title: "Active Products",
      value: defaultStats.activeProducts,
      change: "+2.1%",
      isPositive: true,
      icon: CheckCircle,
      color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30"
    },
    {
      title: "Draft Products",
      value: defaultStats.draftProducts,
      change: "-1.5%",
      isPositive: false,
      icon: FileText,
      color: "text-zinc-500 bg-zinc-50 dark:bg-zinc-900/40 border-zinc-150 dark:border-zinc-800"
    },
    {
      title: "Archived Products",
      value: defaultStats.archivedProducts,
      change: "Stable",
      isPositive: true,
      isStable: true,
      icon: Archive,
      color: "text-amber-500 bg-amber-50 dark:bg-amber-955/20 border-amber-100 dark:border-amber-900/30"
    },
    {
      title: "Veg Products",
      value: defaultStats.vegProducts,
      change: "+5.0%",
      isPositive: true,
      icon: Leaf,
      color: "text-green-600 bg-green-50 dark:bg-green-950/20 border-green-100 dark:border-green-900/30"
    },
    {
      title: "Customizable",
      value: defaultStats.customizableProducts,
      change: "+1.8%",
      isPositive: true,
      icon: Sliders,
      color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/30"
    },
    {
      title: "Out of Stock",
      value: defaultStats.outOfStockProducts,
      change: "-12%",
      isPositive: true, // drop in out of stock is good
      icon: XCircle,
      color: "text-rose-500 bg-rose-50 dark:bg-rose-955/20 border-rose-100 dark:border-rose-900/30"
    },
    {
      title: "Added This Month",
      value: defaultStats.addedThisMonth,
      change: "74 new",
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
            className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-2.5 rounded-lg flex flex-col justify-between hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 shadow-sm"
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
