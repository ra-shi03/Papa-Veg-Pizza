import React from "react";
import { TrendingUp, TrendingDown, ShoppingBag, CreditCard, XOctagon, RefreshCcw, Landmark, Percent } from "lucide-react";

// Format numbers to Indian currency style
const formatINR = (num) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
};

// Skeleton Loader component
const SkeletonCard = () => (
  <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-4.5 rounded-3xl animate-pulse space-y-3.5 shadow-sm">
    <div className="flex justify-between items-center">
      <div className="w-20 h-3 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
      <div className="w-7 h-7 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
    </div>
    <div className="w-28 h-7 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
    <div className="w-16 h-3 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
  </div>
);

export default function RevenueCards({ data, isLoading }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, idx) => (
          <SkeletonCard key={idx} />
        ))}
      </div>
    );
  }

  const {
    revenue = 0,
    totalOrders = 0,
    avgOrderValue = 0,
    cashSales = 0,
    onlineSales = 0,
    cancelledRevenue = 0,
    refundAmount = 0,
    salesGrowth = 0,
  } = data || {};

  const isGrowthPositive = salesGrowth >= 0;

  const cardConfigs = [
    {
      title: "Today's Revenue",
      value: formatINR(revenue),
      icon: Landmark,
      color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20",
      trend: (
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${
          isGrowthPositive 
            ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20" 
            : "text-rose-600 bg-rose-50 dark:bg-rose-950/20"
        }`}>
          {isGrowthPositive ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
          {isGrowthPositive ? `+${salesGrowth}%` : `${salesGrowth}%`}
        </span>
      ),
      subtext: "Compared to last period",
    },
    {
      title: "Total Orders",
      value: totalOrders.toLocaleString("en-IN"),
      icon: ShoppingBag,
      color: "text-[var(--primary)] bg-red-50 dark:bg-red-950/20",
      trend: (
        <span className="text-[9px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
          Active POS
        </span>
      ),
      subtext: "Total orders processed",
    },
    {
      title: "Average Order Value",
      value: formatINR(avgOrderValue),
      icon: Percent,
      color: "text-blue-500 bg-blue-50 dark:bg-blue-950/20",
      trend: null,
      subtext: "Total revenue / Orders",
    },
    {
      title: "Cash Sales",
      value: formatINR(cashSales),
      icon: Landmark,
      color: "text-amber-500 bg-amber-50 dark:bg-amber-950/20",
      trend: (
        <span className="text-[9px] font-bold text-zinc-400">
          {((cashSales / (revenue || 1)) * 100).toFixed(0)}% of total
        </span>
      ),
      subtext: "Total cash collected",
    },
    {
      title: "Online Sales",
      value: formatINR(onlineSales),
      icon: CreditCard,
      color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20",
      trend: (
        <span className="text-[9px] font-bold text-zinc-455">
          {((onlineSales / (revenue || 1)) * 100).toFixed(0)}% of total
        </span>
      ),
      subtext: "UPI, Cards, and Wallets",
    },
    {
      title: "Cancelled Revenue",
      value: formatINR(cancelledRevenue),
      icon: XOctagon,
      color: "text-rose-500 bg-rose-50 dark:bg-rose-950/20",
      trend: null,
      subtext: "Value of cancelled orders",
    },
    {
      title: "Refund Amount",
      value: formatINR(refundAmount),
      icon: RefreshCcw,
      color: "text-purple-500 bg-purple-50 dark:bg-purple-950/20",
      trend: null,
      subtext: "Total refunds processed",
    },
    {
      title: "Sales Growth Rate",
      value: `${isGrowthPositive ? "+" : ""}${salesGrowth}%`,
      icon: TrendingUp,
      color: "text-teal-500 bg-teal-50 dark:bg-teal-950/20",
      trend: null,
      subtext: "Growth compared to yesterday",
    },
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
              <span className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight animate-fade-in">
                {card.value}
              </span>
            </div>

            <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-zinc-50 dark:border-zinc-850">
              <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-semibold truncate">
                {card.subtext}
              </span>
              {card.trend}
            </div>
          </div>
        );
      })}
    </div>
  );
}
