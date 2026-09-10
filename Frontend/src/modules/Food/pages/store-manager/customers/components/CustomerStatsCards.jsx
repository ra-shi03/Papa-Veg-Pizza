import React from "react";
import { Users, UserCheck, ShoppingBag, ArrowRightLeft, CreditCard, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { Skeleton } from "@food/components/ui/skeleton";

export default function CustomerStatsCards({ stats = {}, isLoading, onCardClick, activeFilters = {} }) {
  const cards = [
    {
      id: "total",
      title: "Total Customers",
      value: stats.totalCustomers || 0,
      subtext: "+4 this month",
      trend: "up",
      trendVal: "12%",
      icon: Users,
      color: "text-rose-500 bg-rose-50 dark:bg-rose-950/20 border-rose-100/50 dark:border-rose-950/30",
      active: false
    },
    {
      id: "active",
      title: "Active Customers (30 Days)",
      value: stats.active30Days || 0,
      subtext: "Ordered recently",
      trend: "up",
      trendVal: "8%",
      icon: UserCheck,
      color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100/50 dark:border-emerald-950/30",
      active: false
    },
    {
      id: "today",
      title: "Today's Customer Orders",
      value: stats.todayOrders || 0,
      subtext: "Incoming count",
      trend: "up",
      trendVal: "24%",
      icon: ShoppingBag,
      color: "text-blue-500 bg-blue-50 dark:bg-blue-950/20 border-blue-100/50 dark:border-blue-950/30",
      active: false
    },
    {
      id: "returning",
      title: "Returning Customers",
      value: stats.returningCustomers || 0,
      subtext: "Ordered > 1 time",
      trend: "up",
      trendVal: "18%",
      icon: ArrowRightLeft,
      color: "text-purple-500 bg-purple-50 dark:bg-purple-950/20 border-purple-100/50 dark:border-purple-950/30",
      active: !!activeFilters.returning
    },
    {
      id: "aov",
      title: "Average Order Value",
      value: `₹${Math.round(stats.avgOrderValue || 0)}`,
      subtext: "Per checkout",
      trend: "up",
      trendVal: "3.5%",
      icon: CreditCard,
      color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 border-indigo-100/50 dark:border-indigo-950/30",
      active: false
    },
    {
      id: "refunds",
      title: "Refund Requests",
      value: stats.pendingRefunds || 0,
      subtext: "Pending approval",
      trend: stats.pendingRefunds > 0 ? "warning" : "stable",
      trendVal: stats.pendingRefunds > 0 ? "Requires Action" : "All Clear",
      icon: AlertTriangle,
      color: stats.pendingRefunds > 0 
        ? "text-amber-500 bg-amber-50 dark:bg-amber-950/20 border-amber-100/50 dark:border-amber-950/30 animate-pulse" 
        : "text-zinc-500 bg-zinc-50 dark:bg-zinc-800/50 border-zinc-100 dark:border-zinc-850",
      active: activeFilters.status === "refunded"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
      {cards.map((card) => {
        const IconComponent = card.icon;
        
        if (isLoading) {
          return (
            <div key={card.id} className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl p-4.5 space-y-3 shadow-sm">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-28 rounded-md" />
                <Skeleton className="h-7 w-7 rounded-lg" />
              </div>
              <Skeleton className="h-8 w-16 rounded-lg" />
              <Skeleton className="h-3 w-20 rounded-md" />
            </div>
          );
        }

        return (
          <div
            key={card.id}
            onClick={() => onCardClick?.(card.id)}
            className={`bg-white dark:bg-zinc-900 border rounded-3xl p-4.5 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-200 cursor-pointer relative overflow-hidden group ${
              card.active 
                ? "border-[var(--primary)] ring-1 ring-[var(--primary)]/30" 
                : "border-zinc-150 dark:border-zinc-800"
            }`}
          >
            {/* Background Decorative Gradient */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/0 to-zinc-50/50 dark:to-zinc-850/10 rounded-bl-full pointer-events-none" />

            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                {card.title}
              </span>
              <div className={`p-1.5 rounded-xl border ${card.color} shrink-0 transition-transform duration-300 group-hover:rotate-6`}>
                <IconComponent size={14} className="stroke-[2.5]" />
              </div>
            </div>

            <div className="flex items-baseline gap-1.5 mt-1.5">
              <span className="text-xl font-black tracking-tight text-zinc-950 dark:text-white leading-none">
                {card.value}
              </span>
              {card.trend === "up" && (
                <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                  <TrendingUp size={10} />
                  {card.trendVal}
                </span>
              )}
              {card.trend === "down" && (
                <span className="text-[9px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-0.5">
                  <TrendingDown size={10} />
                  {card.trendVal}
                </span>
              )}
            </div>

            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold mt-1 flex items-center gap-1">
              {card.trend === "warning" && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block animate-ping" />
              )}
              <span>{card.subtext}</span>
              {card.trend === "warning" && (
                <span className="text-[9px] font-bold text-amber-500 dark:text-amber-400">({card.trendVal})</span>
              )}
            </p>
          </div>
        );
      })}
    </div>
  );
}
