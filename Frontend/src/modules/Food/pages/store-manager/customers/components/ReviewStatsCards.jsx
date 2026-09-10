import React from "react";
import { Star, Award, TrendingUp, TrendingDown, MessageSquare, AlertTriangle, Calendar } from "lucide-react";
import { Skeleton } from "@food/components/ui/skeleton";

export default function ReviewStatsCards({ stats = {}, isLoading, onCardClick, activeFilters = {} }) {
  const cards = [
    {
      id: "avgRating",
      title: "Average Rating",
      value: stats.averageRating ? `${stats.averageRating} ★` : "4.8 ★",
      subtext: "From customer checkout",
      trend: "up",
      trendVal: "0.2 pts",
      icon: Star,
      color: "text-amber-500 bg-amber-50 dark:bg-amber-950/20 border-amber-100/50 dark:border-amber-950/30",
      active: false
    },
    {
      id: "fiveStar",
      title: "5 Star Reviews",
      value: stats.fiveStarCount || 0,
      subtext: "Highest rating logs",
      trend: "up",
      trendVal: "+15%",
      icon: Award,
      color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100/50 dark:border-emerald-950/30",
      active: activeFilters.rating === "5"
    },
    {
      id: "negative",
      title: "Negative Reviews",
      value: stats.negativeCount || 0,
      subtext: "Sentiment: Negative",
      trend: stats.negativeCount > 0 ? "warning" : "stable",
      trendVal: stats.negativeCount > 0 ? "Action Required" : "All Clear",
      icon: AlertTriangle,
      color: stats.negativeCount > 0
        ? "text-rose-500 bg-rose-50 dark:bg-rose-950/20 border-rose-100/50 dark:border-rose-950/30 animate-pulse"
        : "text-zinc-550 bg-zinc-550/10 dark:bg-zinc-800/50 border-zinc-150 dark:border-zinc-800",
      active: activeFilters.sentiment === "Negative"
    },
    {
      id: "thisMonth",
      title: "Reviews This Month",
      value: stats.monthCount || 0,
      subtext: "June 2026 logs",
      trend: "up",
      trendVal: "+8.5%",
      icon: Calendar,
      color: "text-blue-500 bg-blue-50 dark:bg-blue-950/20 border-blue-100/50 dark:border-blue-950/30",
      active: false
    },
    {
      id: "replied",
      title: "Replied Reviews",
      value: stats.repliedCount || 0,
      subtext: "Responses dispatched",
      trend: "up",
      trendVal: "100%",
      icon: MessageSquare,
      color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 border-indigo-100/50 dark:border-indigo-950/30",
      active: activeFilters.replyStatus === "replied"
    },
    {
      id: "pendingReply",
      title: "Pending Replies",
      value: stats.pendingReplyCount || 0,
      subtext: "Awaiting response",
      trend: stats.pendingReplyCount > 0 ? "warning" : "stable",
      trendVal: stats.pendingReplyCount > 0 ? "Pending action" : "All Done",
      icon: AlertTriangle,
      color: stats.pendingReplyCount > 0
        ? "text-purple-500 bg-purple-50 dark:bg-purple-950/20 border-purple-100/50 dark:border-purple-950/30"
        : "text-zinc-550 bg-zinc-550/10 dark:bg-zinc-800/50 border-zinc-150 dark:border-zinc-800",
      active: activeFilters.replyStatus === "pending" || activeFilters.replyStatus === "pending_reply"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
      {cards.map((card) => {
        const IconComponent = card.icon;
        
        if (isLoading) {
          return (
            <div key={card.id} className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl p-4.5 space-y-3 shadow-sm animate-pulse">
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
                : "border-zinc-150 dark:border-zinc-850"
            }`}
          >
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
