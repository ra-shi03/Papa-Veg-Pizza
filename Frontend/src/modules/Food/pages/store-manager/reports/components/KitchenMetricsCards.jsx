import React from "react";
import { Clock, AlertTriangle, TrendingUp, TrendingDown, Activity, Flame, Trash2, CheckCircle2, AlertOctagon } from "lucide-react";

// Skeleton Loader component
const SkeletonCard = () => (
  <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-4.5 rounded-3xl animate-pulse space-y-3.5 shadow-sm">
    <div className="flex justify-between items-center">
      <div className="w-20 h-3 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
      <div className="w-7 h-7 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
    </div>
    <div className="w-24 h-7 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
    <div className="w-16 h-3 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
  </div>
);

export default function KitchenMetricsCards({ data, isLoading }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {Array.from({ length: 7 }).map((_, idx) => (
          <SkeletonCard key={idx} />
        ))}
      </div>
    );
  }

  const {
    avgPrepTime = 0,
    avgPrepTimeTrend = 0,
    delayedOrders = 0,
    delayedOrdersTrend = 0,
    kitchenEfficiency = 0,
    kitchenEfficiencyTrend = 0,
    pizzaCompletionRate = 0,
    pizzaCompletionRateTrend = 0,
    ingredientShortages = 0,
    ingredientShortagesTrend = 0,
    foodWastePercentage = 0,
    foodWastePercentageTrend = 0,
    kitchenUtilization = 0,
    kitchenUtilizationTrend = 0
  } = data || {};

  const metrics = [
    {
      title: "Avg Prep Time",
      value: `${avgPrepTime} min`,
      icon: Clock,
      color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20",
      trend: {
        val: `${avgPrepTimeTrend > 0 ? "+" : ""}${avgPrepTimeTrend}%`,
        isPositive: avgPrepTimeTrend < 0, // Lower prep time is good!
        subtext: "vs last week"
      }
    },
    {
      title: "Delayed Orders",
      value: delayedOrders,
      icon: AlertTriangle,
      color: "text-rose-500 bg-rose-50 dark:bg-rose-950/20",
      trend: {
        val: `${delayedOrdersTrend > 0 ? "+" : ""}${delayedOrdersTrend}%`,
        isPositive: false,
        subtext: "Needs monitoring"
      }
    },
    {
      title: "Kitchen Efficiency",
      value: `${kitchenEfficiency}%`,
      icon: Activity,
      color: "text-[var(--primary)] bg-red-50 dark:bg-red-950/20",
      trend: {
        val: `${kitchenEfficiencyTrend > 0 ? "+" : ""}${kitchenEfficiencyTrend}%`,
        isPositive: kitchenEfficiencyTrend > 0,
        subtext: "Cook completions"
      },
      showProgress: true
    },
    {
      title: "Pizza Completion",
      value: `${pizzaCompletionRate}%`,
      icon: CheckCircle2,
      color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20",
      trend: {
        val: `${pizzaCompletionRateTrend > 0 ? "+" : ""}${pizzaCompletionRateTrend}%`,
        isPositive: pizzaCompletionRateTrend > 0,
        subtext: "Target 95%"
      }
    },
    {
      title: "Shortages",
      value: ingredientShortages,
      icon: AlertOctagon,
      color: "text-amber-500 bg-amber-50 dark:bg-amber-950/20",
      trend: {
        val: `${ingredientShortagesTrend > 0 ? "+" : ""}${ingredientShortagesTrend}%`,
        isPositive: ingredientShortagesTrend < 0,
        subtext: "Out-of-stock items"
      }
    },
    {
      title: "Food Waste %",
      value: `${foodWastePercentage}%`,
      icon: Trash2,
      color: "text-teal-500 bg-teal-50 dark:bg-teal-950/20",
      trend: {
        val: `${foodWastePercentageTrend > 0 ? "+" : ""}${foodWastePercentageTrend}%`,
        isPositive: foodWastePercentageTrend < 0,
        subtext: "Total usage ratio"
      }
    },
    {
      title: "Kitchen Util.",
      value: `${kitchenUtilization}%`,
      icon: Flame,
      color: "text-purple-500 bg-purple-50 dark:bg-purple-950/20",
      trend: {
        val: `${kitchenUtilizationTrend > 0 ? "+" : ""}${kitchenUtilizationTrend}%`,
        isPositive: kitchenUtilizationTrend > 0,
        subtext: "Overall deck usage"
      }
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
      {metrics.map((m, idx) => {
        const Icon = m.icon;
        const isPos = m.trend.isPositive;
        const TrendIcon = isPos ? TrendingUp : TrendingDown;
        
        return (
          <div
            key={idx}
            className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-4.5 rounded-3xl flex flex-col justify-between hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 shadow-sm cursor-pointer"
          >
            <div className="space-y-2">
              <div className="flex justify-between items-start gap-1">
                <span className="text-[9px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider truncate">
                  {m.title}
                </span>
                <div className={`p-1.5 rounded-xl ${m.color} flex items-center justify-center shrink-0`}>
                  <Icon size={12} className="stroke-[2.5]" />
                </div>
              </div>

              <div className="flex flex-col gap-0.5">
                <span className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  {m.value}
                </span>
                {m.showProgress && (
                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1 rounded-full overflow-hidden mt-1">
                    <div 
                      className="bg-[var(--primary)] h-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, Math.max(0, parseFloat(m.value)))}%` }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-0.5 mt-3">
              <div className="flex items-center gap-1">
                <span className={`text-[8px] font-extrabold px-1 rounded-md flex items-center gap-0.5 ${
                  isPos 
                    ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20" 
                    : "text-rose-600 bg-rose-50 dark:bg-rose-950/20"
                }`}>
                  <TrendIcon size={7} />
                  {m.trend.val}
                </span>
                <span className="text-[8px] text-zinc-400 dark:text-zinc-500 font-bold">
                  {m.trend.subtext}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
