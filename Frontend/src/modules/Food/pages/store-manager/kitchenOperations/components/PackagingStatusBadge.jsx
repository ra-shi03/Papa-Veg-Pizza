import React from "react";

export default function PackagingStatusBadge({ status }) {
  let label = "";
  let classes = "";

  switch (status) {
    case "ready_for_packaging":
      label = "Ready For Packaging";
      classes = "bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30";
      break;
    case "packaging_started":
      label = "Packaging Started";
      classes = "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30 animate-pulse";
      break;
    case "quality_checked":
      label = "Quality Checked";
      classes = "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30";
      break;
    case "sealed":
      label = "Sealed";
      classes = "bg-emerald-55 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900/30";
      break;
    case "ready_for_pickup":
      label = "Ready For Pickup";
      classes = "bg-emerald-600 text-white dark:bg-emerald-700 border border-emerald-500 shadow-sm";
      break;
    default:
      label = status || "Unknown";
      classes = "bg-slate-50 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700";
  }

  return (
    <span className={`inline-flex items-center text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${classes}`}>
      {label}
    </span>
  );
}
