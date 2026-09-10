import React from "react";

export default function BakingStatusBadge({ status }) {
  let label = "";
  let classes = "";

  switch (status) {
    case "ready_for_baking":
      label = "Ready For Baking";
      classes = "bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30";
      break;
    case "baking_started":
      label = "Baking Started";
      classes = "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30 animate-pulse";
      break;
    case "baking_paused":
      label = "Paused";
      classes = "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-455 border border-rose-100 dark:border-rose-900/30";
      break;
    case "baking_completed":
      label = "Completed";
      classes = "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30";
      break;
    case "packaging":
      label = "Packaging";
      classes = "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30";
      break;
    default:
      label = status || "Unknown";
      classes = "bg-slate-50 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700";
  }

  return (
    <span className={`inline-flex items-center text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${classes}`}>
      {label}
    </span>
  );
}
