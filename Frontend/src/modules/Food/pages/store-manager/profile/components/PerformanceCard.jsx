import React from "react";

export default function PerformanceCard({
  title = "",
  value = "",
  subtext = "",
  icon: Icon,
  colorClass = "text-amber-500 bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30",
}) {
  return (
    <div className="bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-850 p-4 rounded-xl shadow-sm flex items-center justify-between group hover:scale-[1.01] transition-all">
      <div className="space-y-1.5 min-w-0">
        <span className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
          {title}
        </span>
        <h3 className="text-base font-black text-slate-800 dark:text-zinc-200 truncate">
          {value}
        </h3>
        <p className="text-[9px] font-medium text-slate-450 dark:text-zinc-500 truncate">
          {subtext}
        </p>
      </div>

      {Icon && (
        <div className={`p-2 rounded-lg border shrink-0 flex items-center justify-center ${colorClass}`}>
          <Icon size={14} className="stroke-[2.2]" />
        </div>
      )}
    </div>
  );
}
