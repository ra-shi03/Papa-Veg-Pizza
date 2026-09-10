import React, { useState, useEffect } from "react";
import {
  Clock,
  User,
  AlertTriangle,
  Play,
  Pause,
  Shuffle,
  BookOpen,
  AlertOctagon,
  ArrowRight,
  UserCheck
} from "lucide-react";
import { Tooltip, Tag } from "antd";

export default function PizzaCard({
  item,
  chefs = [],
  onOpenMoveStage,
  onOpenPause,
  onOpenReassign,
  onOpenRecipe,
  onOpenIssue
}) {
  const [elapsed, setElapsed] = useState(0);

  // Compute elapsed time dynamically
  useEffect(() => {
    const updateTime = () => {
      if (!item.started_time) return;
      const start = new Date(item.started_time);
      const diff = Math.floor((new Date() - start) / 60000);
      setElapsed(Math.max(0, diff));
    };
    updateTime();
    const interval = setInterval(updateTime, 30000); // update every 30s
    return () => clearInterval(interval);
  }, [item.started_time, item.paused]);

  const estimated = item.estimated_time || 12;
  const isDelayed = elapsed > estimated && item.current_stage !== "ready_for_baking";
  const remaining = Math.max(0, estimated - elapsed);
  const progressPct = Math.min((elapsed / estimated) * 100, 100);

  const getPriorityColor = (priority) => {
    switch (priority?.toUpperCase()) {
      case "VIP":
        return "orange";
      case "EXPRESS":
        return "red";
      default:
        return "blue";
    }
  };

  const getStageLabel = (stage) => {
    switch (stage) {
      case "assigned":
        return "Assigned";
      case "dough_prep":
        return "Dough Prep";
      case "sauce":
        return "Saucing";
      case "toppings":
        return "Toppings";
      case "ready_for_baking":
        return "Ready to Bake";
      default:
        return stage;
    }
  };

  const assignedChef = chefs.find((c) => c._id === item.assigned_chef);

  return (
    <div className={`group bg-white dark:bg-zinc-900 border rounded-2.5xl p-3 space-y-2.5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-slate-300 dark:hover:border-zinc-700 relative overflow-hidden ${
      isDelayed ? "border-l-4 border-l-rose-500" : ""
    } ${item.paused ? "bg-amber-50/10 dark:bg-amber-950/5 border-amber-200 dark:border-amber-900/30" : ""}`}>
      
      {/* Top Row: Order ID, Priority, Paused Tag */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-black text-slate-800 dark:text-zinc-200">
            #{item.orderNumber}
          </span>
          {item.paused && (
            <span className="text-[8px] font-black bg-amber-500 text-white px-1.5 py-0.2 rounded uppercase tracking-wider animate-pulse">
              Paused
            </span>
          )}
        </div>
        <Tag color={getPriorityColor(item.priority)} className="text-[9px] font-black border-0 px-2 py-0.5 rounded-full">
          {item.priority || "NORMAL"}
        </Tag>
      </div>

      {/* Pizza info */}
      <div>
        <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight">
          {item.name}
        </h4>
        <p className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 mt-0.5">
          {item.size} • {item.crust} • Qty {item.quantity}
        </p>
      </div>

      {/* Time Tracking Section */}
      {!item.paused ? (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[9px] font-bold text-slate-450">
            <span className={`flex items-center gap-1 ${isDelayed ? "text-rose-500 font-extrabold" : ""}`}>
              <Clock size={10} />
              Elapsed: {elapsed} min
            </span>
            <span>
              {isDelayed ? "Overdue" : `${remaining} min left`}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isDelayed ? "bg-rose-500" : "bg-[var(--primary)]"
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="bg-amber-100/50 dark:bg-amber-950/20 p-2 rounded-xl border border-amber-200/40 text-[9px] text-amber-800 dark:text-amber-400 font-bold flex gap-1 items-start">
          <AlertTriangle size={11} className="shrink-0 mt-0.5" />
          <div>
            <span>Interrupted: {item.pauseReason}</span>
            {item.pauseNotes && <p className="font-medium text-[8px] mt-0.5 text-amber-600 dark:text-amber-500">{item.pauseNotes}</p>}
          </div>
        </div>
      )}

      {/* Assigned Chef */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-50 dark:border-zinc-850">
        <div className="flex items-center gap-1.5">
          {assignedChef ? (
            <>
              <img
                src={assignedChef.avatar}
                alt={assignedChef.name}
                className="w-5 h-5 rounded-full object-cover border border-slate-200 dark:border-zinc-850"
              />
              <span className="text-[9px] font-extrabold text-slate-700 dark:text-zinc-350">
                {assignedChef.name.split(" ").slice(-1)[0]}
              </span>
            </>
          ) : (
            <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-550 flex items-center gap-1">
              <User size={10} />
              Unassigned
            </span>
          )}
        </div>

        {/* Recipe link */}
        <button
          onClick={() => onOpenRecipe(item)}
          className="text-[9px] font-black text-slate-450 hover:text-[var(--primary)] flex items-center gap-0.5 cursor-pointer"
        >
          <BookOpen size={9} />
          Recipe
        </button>
      </div>

      {/* Card Actions */}
      <div className="flex gap-1 pt-1.5 border-t border-slate-50 dark:border-zinc-850">
        {/* Chef reassign */}
        <button
          onClick={() => onOpenReassign(item)}
          className="p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800/80 dark:hover:bg-zinc-750 text-slate-600 dark:text-zinc-350 rounded-lg flex items-center justify-center transition-all cursor-pointer"
          title="Reassign Chef"
        >
          <Shuffle size={10} />
        </button>

        {/* Pause toggle */}
        {!item.paused ? (
          <button
            onClick={() => onOpenPause(item)}
            className="p-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/20 dark:hover:bg-amber-900/30 text-amber-600 dark:text-amber-500 rounded-lg flex items-center justify-center transition-all cursor-pointer"
            title="Pause Prep"
          >
            <Pause size={10} />
          </button>
        ) : (
          <button
            onClick={() => onOpenMoveStage(item)} // can resume directly by advancing or confirming stage
            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-500 rounded-lg flex items-center justify-center transition-all cursor-pointer"
            title="Resume Prep"
          >
            <Play size={10} />
          </button>
        )}

        {/* Shortage Issue */}
        <button
          onClick={() => onOpenIssue(item)}
          className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-900/35 text-rose-600 dark:text-rose-450 rounded-lg flex items-center justify-center transition-all cursor-pointer"
          title="Report Shortage"
        >
          <AlertOctagon size={10} />
        </button>

        {/* Move Stage CTA */}
        {item.current_stage !== "ready_for_baking" && (
          <button
            onClick={() => onOpenMoveStage(item)}
            disabled={item.paused}
            className={`flex-1 py-1.5 text-white font-black rounded-lg text-[9px] transition-all flex items-center justify-center gap-0.5 ${
              item.paused
                ? "bg-slate-200 dark:bg-zinc-800 text-slate-400 dark:text-zinc-650 cursor-not-allowed"
                : "bg-[var(--primary)] hover:bg-[var(--sa-primary-hover)] cursor-pointer"
            }`}
          >
            <span>Next</span>
            <ArrowRight size={10} />
          </button>
        )}
      </div>
    </div>
  );
}
