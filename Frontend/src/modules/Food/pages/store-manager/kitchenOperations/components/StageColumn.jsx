import React from "react";
import PizzaCard from "./PizzaCard";

export default function StageColumn({
  title,
  icon: Icon,
  items = [],
  isLoading,
  chefs = [],
  badgeColor = "bg-slate-100 text-slate-700",
  onOpenMoveStage,
  onOpenPause,
  onOpenReassign,
  onOpenRecipe,
  onOpenIssue
}) {
  return (
    <div className="flex flex-col h-full bg-slate-50/50 dark:bg-zinc-950/40 border border-slate-100 dark:border-zinc-850 rounded-3xl p-3 space-y-3 min-h-[500px] w-64 shrink-0">
      {/* Column Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          {Icon && <Icon size={15} className="text-slate-550 dark:text-zinc-400 shrink-0" />}
          <h3 className="text-[10px] font-black text-slate-800 dark:text-zinc-300 uppercase tracking-widest truncate">
            {title}
          </h3>
        </div>
        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${badgeColor}`}>
          {isLoading ? "..." : items.length}
        </span>
      </div>

      {/* Column Cards List */}
      <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[520px] pr-1 scrollbar-thin">
        {isLoading ? (
          [1, 2].map((n) => (
            <div key={n} className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-850 rounded-2.5xl p-3.5 space-y-3 animate-pulse">
              <div className="flex justify-between">
                <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded w-16" />
                <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded w-10" />
              </div>
              <div className="h-3.5 bg-slate-250 dark:bg-zinc-800 rounded w-full pt-1" />
              <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded w-2/3" />
            </div>
          ))
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-8 bg-white/40 dark:bg-zinc-900/30 border border-dashed border-slate-200 dark:border-zinc-800 rounded-2.5xl min-h-[150px]">
            <p className="text-[9px] font-bold text-slate-400 dark:text-zinc-550 max-w-[120px]">
              No pizzas in this stage.
            </p>
          </div>
        ) : (
          items.map((item) => (
            <PizzaCard
              key={item._id}
              item={item}
              chefs={chefs}
              onOpenMoveStage={onOpenMoveStage}
              onOpenPause={onOpenPause}
              onOpenReassign={onOpenReassign}
              onOpenRecipe={onOpenRecipe}
              onOpenIssue={onOpenIssue}
            />
          ))
        )}
      </div>
    </div>
  );
}
