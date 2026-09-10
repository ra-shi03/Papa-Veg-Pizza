import React from "react";
import { AlertCircle, AlertTriangle, CheckCircle, IndianRupee } from "lucide-react";

export default function IssueStatsCards({ issues = [] }) {
  const safeIssues = Array.isArray(issues) ? issues : [];

  // Open Issues
  const openCount = safeIssues.filter((i) => i.status === "open").length;

  // Critical Issues
  const criticalCount = safeIssues.filter((i) => i.severity === "critical" && i.status !== "resolved" && i.status !== "closed").length;

  // Resolved Issues
  const resolvedCount = safeIssues.filter((i) => i.status === "resolved").length;

  // Refund Cases
  const refundCount = safeIssues.filter((i) => i.refundAmount > 0).length;

  const cards = [
    {
      title: "Open Exceptions",
      value: openCount,
      trend: "Awaiting supervisor response",
      icon: AlertCircle,
      color: "text-amber-500 bg-amber-50 dark:bg-amber-950/10 border-amber-100 dark:border-amber-900/20"
    },
    {
      title: "Critical Issues",
      value: criticalCount,
      trend: "Require immediate escalation",
      icon: AlertTriangle,
      color: "text-rose-500 bg-rose-50 dark:bg-rose-950/10 border-rose-100 dark:border-rose-900/20",
      indicator: "bg-rose-500"
    },
    {
      title: "Resolved Issues",
      value: resolvedCount,
      trend: "Exceptions cleared successfully",
      icon: CheckCircle,
      color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/20",
      indicator: "bg-emerald-500"
    },
    {
      title: "Refund Cases",
      value: refundCount,
      trend: "Disbursed customer refunds",
      icon: IndianRupee,
      color: "text-blue-500 bg-blue-50 dark:bg-blue-950/10 border-blue-100 dark:border-blue-900/20"
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`p-3.5 rounded-2xl border flex flex-col justify-between transition-all hover:shadow-sm duration-300 relative overflow-hidden ${card.color}`}
          >
            {card.indicator && (
              <div className={`absolute top-0 right-0 w-2.5 h-2.5 rounded-bl-lg ${card.indicator} animate-pulse`} />
            )}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-455 dark:text-zinc-555">
                {card.title}
              </span>
              <Icon size={16} className="shrink-0" />
            </div>
            <div className="mt-2.5">
              <h3 className="text-xl font-black text-slate-900 dark:text-white leading-none">
                {card.value}
              </h3>
              <p className="text-[9px] font-bold text-slate-500 dark:text-zinc-400 mt-1">
                {card.trend}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
