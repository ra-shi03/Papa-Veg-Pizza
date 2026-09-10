import React, { useState, useEffect } from "react";
import { Clock, Play, CheckCircle2, AlertTriangle, AlertCircle, ShoppingCart } from "lucide-react";

export default function InProgressTaskCard({
  task = {},
  onComplete = () => {},
  onReportDelay = () => {},
  onRequestIngredients = () => {},
}) {
  const [elapsed, setElapsed] = useState("00:00");
  const [isOvertime, setIsOvertime] = useState(false);

  useEffect(() => {
    if (!task.startedAt) return;

    const start = new Date(task.startedAt).getTime();

    const updateTimer = () => {
      const diff = Date.now() - start;
      
      const min = Math.floor(diff / 60000);
      const sec = Math.floor((diff % 60000) / 1000);

      const displayMin = min < 10 ? `0${min}` : min;
      const displaySec = sec < 10 ? `0${sec}` : sec;

      setElapsed(`${displayMin}:${displaySec}`);

      if (min >= task.estimatedMinutes) {
        setIsOvertime(true);
      }
    };

    updateTimer(); // initial call
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [task.startedAt, task.estimatedMinutes]);

  const formatStartedTime = (timeStr) => {
    if (!timeStr) return "N/A";
    const date = new Date(timeStr);
    return date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
  };

  const getPriorityBorder = (prio) => {
    switch (prio) {
      case "high":
        return "border-l-4 border-l-rose-500";
      case "medium":
        return "border-l-4 border-l-amber-500";
      case "low":
      default:
        return "border-l-4 border-l-emerald-500";
    }
  };

  return (
    <div className={`bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between ${getPriorityBorder(task.priority)}`}>
      
      {/* CARD BODY */}
      <div className="p-4 space-y-3.5 flex-1">
        {/* Header */}
        <div className="flex justify-between items-start gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2">
          <div className="space-y-0.5">
            <span className="text-[8px] font-black text-slate-400 dark:text-zinc-550 uppercase font-mono block">
              Task ID: {task._id}
            </span>
            <span className="text-xs font-black text-[var(--primary)] block">
              Order: {task.orderId}
            </span>
          </div>
          
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--primary)] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--primary)]"></span>
            </span>
            <span className="text-[9px] font-bold text-slate-500 dark:text-zinc-400 uppercase">
              Prepping
            </span>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h4 className="text-xs font-black text-slate-800 dark:text-zinc-200 leading-snug">
            {task.title}
          </h4>
          <p className="text-[10px] font-medium text-slate-450 dark:text-zinc-550 leading-normal line-clamp-2">
            {task.description}
          </p>
        </div>

        {/* Timers Panel */}
        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-850/80 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[8px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
              Elapsed Duration
            </span>
            <span className={`text-base font-black font-mono flex items-center gap-1 ${isOvertime ? "text-red-500" : "text-slate-800 dark:text-zinc-200"}`}>
              <Clock size={14} className={isOvertime ? "animate-pulse" : ""} />
              <span>{elapsed}</span>
            </span>
          </div>

          <div className="text-right space-y-0.5 border-l border-zinc-200 dark:border-zinc-800 pl-4">
            <span className="text-[8px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
              Allocated Limit
            </span>
            <span className="text-xs font-bold text-slate-700 dark:text-zinc-350">
              {task.estimatedMinutes} mins
            </span>
          </div>
        </div>

        {/* Status flags */}
        <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-slate-500 dark:text-zinc-400">
          <div className="flex items-center gap-1">
            <span>Station: <strong className="text-slate-750 dark:text-zinc-300">{task.station}</strong></span>
          </div>
          <div className="flex items-center gap-1 text-right justify-end">
            <span>Started: <strong className="text-slate-750 dark:text-zinc-300 font-mono">{formatStartedTime(task.startedAt)}</strong></span>
          </div>
        </div>

        {/* Delay alert inside card if overtime */}
        {isOvertime && (
          <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 flex items-center gap-1.5 text-[9px] font-bold">
            <AlertCircle size={12} className="shrink-0" />
            <span>Time threshold exceeded! Please report a delay or complete prep.</span>
          </div>
        )}
      </div>

      {/* CARD FOOTER ACTIONS */}
      <div className="bg-zinc-50 dark:bg-zinc-950/50 border-t border-zinc-150 dark:border-zinc-850 px-4 py-3 flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onReportDelay(task)}
            className="text-[9px] font-bold px-2 py-1.5 rounded-lg border border-zinc-250 dark:border-zinc-700 text-slate-650 dark:text-zinc-350 hover:bg-white dark:hover:bg-zinc-900 hover:text-amber-500 active:scale-[0.98] transition-all cursor-pointer flex items-center gap-1"
          >
            <AlertTriangle size={10} className="text-amber-500" />
            <span>Delay</span>
          </button>
          
          <button
            onClick={() => onRequestIngredients(task)}
            className="text-[9px] font-bold px-2 py-1.5 rounded-lg border border-zinc-250 dark:border-zinc-700 text-slate-650 dark:text-zinc-350 hover:bg-white dark:hover:bg-zinc-900 hover:text-[var(--secondary)] active:scale-[0.98] transition-all cursor-pointer flex items-center gap-1"
          >
            <ShoppingCart size={10} className="text-[var(--secondary)]" />
            <span>Ingredients</span>
          </button>
        </div>

        <button
          onClick={() => onComplete(task)}
          className="text-[9px] font-black px-3.5 py-1.5 rounded-lg bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] shadow-sm active:scale-[0.98] transition-all cursor-pointer flex items-center gap-1.5"
        >
          <CheckCircle2 size={11} />
          <span>Complete</span>
        </button>
      </div>
    </div>
  );
}
