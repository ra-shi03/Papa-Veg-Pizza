import React from "react";

export default function ComplaintStatusBadge({ status }) {
  const normStatus = (status || "").toLowerCase();
  
  let styles = "bg-zinc-50 text-zinc-650 dark:bg-zinc-850 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800";
  let label = status;

  if (normStatus === "resolved") {
    styles = "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-150 dark:border-emerald-900/30";
    label = "Resolved";
  } else if (normStatus === "investigating") {
    styles = "bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-150 dark:border-blue-900/30";
    label = "Investigating";
  } else if (normStatus === "pending") {
    styles = "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-150 dark:border-amber-900/30";
    label = "Pending";
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-2xs font-extrabold tracking-wide uppercase transition-all shadow-sm ${styles}`}>
      {label}
    </span>
  );
}
