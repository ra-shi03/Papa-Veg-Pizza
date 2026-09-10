import React from "react";
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, Star, Users, Trash2, Truck, ArrowUpRight } from "lucide-react";

// Helper for rendering a mini SVG sparkline
const MiniSparkline = ({ data = [], stroke = "var(--primary)", height = 18 }) => {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * 50;
    const y = height - ((val - min) / range) * height;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg className="w-14 h-5 overflow-visible opacity-50" viewBox={`0 0 50 ${height}`}>
      <polyline fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
};

export default function StoreMetricsCards({ data, isLoading }) {
  const metrics = data?.dashboard || {};

  // Formatter for Indian Rupees
  const formatINR = (val) => {
    if (val === undefined || val === null) return "₹0";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const profitMargin = metrics.revenue > 0 ? ((metrics.profit / metrics.revenue) * 100).toFixed(1) : "0";
  const wasteCost = Math.round((metrics.expenses || 0) * (metrics.foodWastePercentage || 0) / 100);

  const cardList = [
    {
      title: "Revenue",
      value: formatINR(metrics.revenue),
      subtext: `Growth: ${metrics.storeGrowthPercentage >= 0 ? "+" : ""}${metrics.storeGrowthPercentage || 0}%`,
      icon: DollarSign,
      color: "text-rose-500 bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30",
      trend: metrics.storeGrowthPercentage >= 0 ? "up" : "down",
      sparkData: [10, 14, 8, 18, 12, 22, 28],
    },
    {
      title: "Profit",
      value: formatINR(metrics.profit),
      subtext: `Margin: ${profitMargin}%`,
      icon: TrendingUp,
      color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30",
      trend: "up",
      sparkData: [12, 10, 15, 13, 18, 16, 24],
    },
    {
      title: "Orders",
      value: metrics.orderCount?.toLocaleString("en-IN") || "0",
      subtext: `Avg Value: ${formatINR(metrics.avgOrderValue)}`,
      icon: ShoppingBag,
      color: "text-amber-500 bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30",
      trend: "up",
      sparkData: [5, 12, 15, 10, 22, 18, 25],
    },
    {
      title: "Customer Satisfaction",
      value: `${metrics.customerRating || 0} / 5.0`,
      subtext: "Review count: 320+",
      icon: Star,
      color: "text-blue-500 bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30",
      isRating: true,
      stars: Math.round(metrics.customerRating || 0),
    },
    {
      title: "Staff Efficiency",
      value: `${metrics.staffEfficiency || 0}%`,
      subtext: "Attendance & speed index",
      icon: Users,
      color: "text-purple-500 bg-purple-50 dark:bg-purple-950/20 border-purple-100 dark:border-purple-900/30",
      isProgress: true,
    },
    {
      title: "Food Waste",
      value: `${metrics.foodWastePercentage || 0}%`,
      subtext: `Cost: ${formatINR(wasteCost)}`,
      icon: Trash2,
      color: "text-orange-500 bg-orange-50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900/30",
      trend: "down",
    },
    {
      title: "Delivery Success Rate",
      value: `${metrics.deliverySuccessRate || 0}%`,
      subtext: "Failed: 3 deliveries",
      icon: Truck,
      color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/30",
      trend: "up",
    },
    {
      title: "Store Growth",
      value: `${metrics.storeGrowthPercentage >= 0 ? "+" : ""}${metrics.storeGrowthPercentage || 0}%`,
      subtext: metrics.storeGrowthPercentage >= 0 ? "MoM Positive Growth" : "MoM Negative Growth",
      icon: ArrowUpRight,
      color: "text-teal-500 bg-teal-50 dark:bg-teal-950/20 border-teal-100 dark:border-teal-900/30",
      trend: metrics.storeGrowthPercentage >= 0 ? "up" : "down",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4.5">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div key={idx} className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-5 rounded-3xl animate-pulse space-y-3 shadow-sm">
            <div className="flex justify-between items-center">
              <div className="w-16 h-3 bg-zinc-200 dark:bg-zinc-800 rounded" />
              <div className="w-8 h-8 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
            </div>
            <div className="w-24 h-6 bg-zinc-200 dark:bg-zinc-800 rounded" />
            <div className="w-32 h-2.5 bg-zinc-200 dark:bg-zinc-800 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4.5">
      {cardList.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-5 rounded-3xl flex flex-col justify-between hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-sm relative group cursor-default"
          >
            {/* Card Header */}
            <div className="flex justify-between items-start gap-2">
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                {card.title}
              </span>
              <div className={`p-2 rounded-2xl border ${card.color} flex items-center justify-center shrink-0`}>
                <Icon size={14} className="stroke-[2.5]" />
              </div>
            </div>

            {/* Card Body */}
            <div className="mt-2.5">
              <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {card.value}
              </h3>
            </div>

            {/* Card Footer / Extras */}
            <div className="flex items-center justify-between gap-2 mt-3.5 pt-2.5 border-t border-zinc-50 dark:border-zinc-850">
              <span className="text-[10px] text-zinc-550 dark:text-zinc-400 font-bold flex items-center gap-1">
                {card.trend && (
                  card.trend === "up" ? (
                    <TrendingUp size={11} className="text-emerald-500 shrink-0" />
                  ) : (
                    <TrendingDown size={11} className="text-rose-500 shrink-0" />
                  )
                )}
                <span>{card.subtext}</span>
              </span>

              {/* Sparkline Indicator */}
              {card.sparkData && (
                <div className="opacity-70 group-hover:opacity-100 transition-opacity">
                  <MiniSparkline data={card.sparkData} stroke={card.trend === "up" ? "var(--sa-secondary)" : "#ef4444"} />
                </div>
              )}

              {/* Stars rendering */}
              {card.isRating && (
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, starIdx) => (
                    <Star
                      key={starIdx}
                      size={9}
                      className={
                        starIdx < card.stars
                          ? "fill-amber-400 text-amber-400"
                          : "text-zinc-200 dark:text-zinc-800"
                      }
                    />
                  ))}
                </div>
              )}

              {/* Progress bar */}
              {card.isProgress && (
                <div className="w-12 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--primary)] rounded-full"
                    style={{ width: card.value }}
                  />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
