import React from "react";
import { CheckCircle2, Circle, Clock, Info } from "lucide-react";

export default function ResolutionTimeline({ status, createdAt, updatedAt, resolution }) {
  const normStatus = (status || "").toLowerCase();

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const steps = [
    {
      key: "created",
      title: "Complaint Lodged",
      desc: "Customer reported issue regarding order delivery/food items.",
      time: formatDate(createdAt),
      done: true,
      active: normStatus === "pending"
    },
    {
      key: "investigating",
      title: "Under Investigation",
      desc: normStatus === "resolved" || normStatus === "investigating" 
        ? "Assigned to kitchen/delivery supervisor to assess validation."
        : "Pending assignment to operational staff.",
      time: normStatus === "resolved" || normStatus === "investigating" ? formatDate(createdAt) : "",
      done: normStatus === "resolved" || normStatus === "investigating",
      active: normStatus === "investigating"
    },
    {
      key: "resolved",
      title: "Issue Resolved",
      desc: normStatus === "resolved" 
        ? (resolution?.actionTaken || "Resolution notes filed and closed.")
        : "Awaiting final settlement / refund dispatch.",
      time: normStatus === "resolved" ? formatDate(resolution?.resolvedAt || updatedAt) : "",
      done: normStatus === "resolved",
      active: false
    }
  ];

  return (
    <div className="bg-slate-50 dark:bg-zinc-950 p-5 rounded-3xl border border-zinc-150 dark:border-zinc-800 space-y-4 text-xs font-semibold">
      <h4 className="text-sm font-black text-slate-800 dark:text-zinc-200 flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-850 pb-2">
        <Clock size={15} className="text-[var(--primary)]" />
        Resolution Timeline
      </h4>

      <div className="relative pl-5 space-y-6 before:absolute before:left-[9px] before:top-2 before:bottom-2 before:w-[2px] before:bg-zinc-200 dark:before:bg-zinc-800">
        {steps.map((step, idx) => (
          <div key={step.key} className="relative flex flex-col gap-1">
            {/* Dot indicator */}
            <div className="absolute -left-[21px] top-0.5 z-10 bg-slate-50 dark:bg-zinc-950 p-0.5 rounded-full">
              {step.done ? (
                <CheckCircle2 size={16} className="text-emerald-500 fill-emerald-50 dark:fill-zinc-900" />
              ) : step.active ? (
                <CheckCircle2 size={16} className="text-blue-500 fill-blue-50 dark:fill-zinc-900 animate-pulse" />
              ) : (
                <Circle size={16} className="text-zinc-300 dark:text-zinc-700 bg-white dark:bg-zinc-900 rounded-full" />
              )}
            </div>

            {/* Step content */}
            <div className="flex justify-between items-start gap-4">
              <div>
                <h5 className={`font-extrabold text-xs ${
                  step.done 
                    ? "text-zinc-800 dark:text-zinc-200" 
                    : step.active 
                      ? "text-blue-600 dark:text-blue-400" 
                      : "text-zinc-400 dark:text-zinc-650"
                }`}>
                  {step.title}
                </h5>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-550 leading-relaxed font-semibold mt-0.5">{step.desc}</p>
              </div>
              {step.time && (
                <span className="text-[9px] text-zinc-450 dark:text-zinc-500 font-mono whitespace-nowrap bg-zinc-200/50 dark:bg-zinc-850 px-1.5 py-0.5 rounded-md h-fit">
                  {step.time}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
