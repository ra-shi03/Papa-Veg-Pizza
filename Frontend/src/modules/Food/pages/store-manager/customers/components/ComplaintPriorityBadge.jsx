import React from "react";

export default function ComplaintPriorityBadge({ priority }) {
  const normPriority = (priority || "").toLowerCase();

  let styles = "bg-zinc-50 text-zinc-650 dark:bg-zinc-850 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800";
  let label = priority;

  if (normPriority === "low") {
    styles = "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700";
    label = "Low";
  } else if (normPriority === "medium") {
    styles = "bg-orange-50 text-orange-700 dark:bg-orange-950/20 dark:text-orange-400 border border-orange-150 dark:border-orange-900/30";
    label = "Medium";
  } else if (normPriority === "high") {
    styles = "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-150 dark:border-rose-900/30";
    label = "High";
  } else if (normPriority === "critical") {
    styles = "bg-red-500 text-white border-transparent shadow-red-500/20 animate-pulse font-black";
    label = "Critical";
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-2xs font-extrabold tracking-wide uppercase transition-all shadow-sm ${styles}`}>
      {label}
    </span>
  );
}
