import React from "react";
import { AlertCircle, ShieldAlert, CheckCircle, ArrowRightLeft, Clock, Smile, TrendingUp, TrendingDown } from "lucide-react";
import { Skeleton } from "@food/components/ui/skeleton";

export default function ComplaintStatsCards({ stats = {}, isLoading, onCardClick, activeFilters = {} }) {
  const cards = [
    {
      id: "open",
      title: "Open Complaints",
      value: stats.openComplaints || 0,
      subtext: "Awaiting review",
      trend: stats.openComplaints > 0 ? "warning" : "stable",
      trendVal: stats.openComplaints > 0 ? "Action Required" : "All Settled",
      icon: AlertCircle,
      color: stats.openComplaints > 0 
        ? "text-amber-500 bg-amber-50 dark:bg-amber-950/20 border-amber-100/50 dark:border-amber-950/30 animate-pulse"
        : "text-zinc-550 bg-zinc-50 dark:bg-zinc-800/50 border-zinc-150 dark:border-zinc-800",
      active: activeFilters.status === "pending" || activeFilters.status === "investigating"
    },
    {
      id: "critical",
      title: "Critical Priority",
      value: stats.criticalComplaints || 0,
      subtext: "Urgent escalations",
      trend: stats.criticalComplaints > 0 ? "warning" : "stable",
      trendVal: stats.criticalComplaints > 0 ? "Immediate Action" : "No Critical Issues",
      icon: ShieldAlert,
      color: stats.criticalComplaints > 0 
        ? "text-rose-500 bg-rose-50 dark:bg-rose-950/20 border-rose-100/50 dark:border-rose-950/30 animate-bounce"
        : "text-zinc-550 bg-zinc-50 dark:bg-zinc-800/50 border-zinc-150 dark:border-zinc-800",
      active: activeFilters.priority === "critical"
    },
    {
      id: "resolvedToday",
      title: "Resolved Today",
      value: stats.resolvedToday || 0,
      subtext: "Closed actions",
      trend: "up",
      trendVal: "100%",
      icon: CheckCircle,
      color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100/50 dark:border-emerald-950/30",
      active: activeFilters.status === "resolved"
    },
    {
      id: "refunds",
      title: "Pending Refunds",
      value: stats.pendingRefunds || 0,
      subtext: "Payout approvals",
      trend: stats.pendingRefunds > 0 ? "warning" : "stable",
      trendVal: stats.pendingRefunds > 0 ? "Under Review" : "Processed",
      icon: ArrowRightLeft,
      color: "text-purple-500 bg-purple-50 dark:bg-purple-950/20 border-purple-100/50 dark:border-purple-950/30",
      active: activeFilters.complaintType === "refund"
    },
    {
      id: "avgTime",
      title: "Avg Resolution Time",
      value: stats.avgResolutionTime || "2.4h",
      subtext: "Target < 4.0 hours",
      trend: "up",
      trendVal: "15% faster",
      icon: Clock,
      color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 border-indigo-100/50 dark:border-indigo-950/30",
      active: false
    },
    {
      id: "satisfaction",
      title: "CSAT (Complaints)",
      value: stats.satisfactionScore || "92%",
      subtext: "Target > 90%",
      trend: "up",
      trendVal: "2.1%",
      icon: Smile,
      color: "text-pink-500 bg-pink-50 dark:bg-pink-950/20 border-pink-100/50 dark:border-pink-950/30",
      active: false
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
