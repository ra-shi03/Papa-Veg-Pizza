import React from "react";
import { Badge } from "@food/components/ui/badge";

export function UrgencyBadge({ urgency }) {
  switch (urgency) {
    case "low":
      return (
        <Badge className="bg-slate-50 hover:bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 rounded-xl px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider select-none">
          Low
        </Badge>
      );
    case "medium":
      return (
        <Badge className="bg-blue-50 hover:bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30 rounded-xl px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider select-none">
          Medium
        </Badge>
      );
    case "high":
      return (
        <Badge className="bg-amber-50 hover:bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30 rounded-xl px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider select-none animate-pulse">
          High
        </Badge>
      );
    case "critical":
      return (
        <Badge className="bg-rose-50 hover:bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 rounded-xl px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider select-none animate-bounce">
          Critical
        </Badge>
      );
    default:
      return (
        <Badge className="bg-slate-50 hover:bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 rounded-xl px-2.5 py-0.5 text-[10px] select-none capitalize">
          {urgency}
        </Badge>
      );
  }
}
