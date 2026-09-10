import React from "react";
import { CheckCircle2, Clock } from "lucide-react";

export default function TimelineStepper({ timeline = [], currentStatus }) {
  const steps = [
    { status: "Placed", label: "Order Placed" },
    { status: "Confirmed", label: "Confirmed" },
    { status: "Queue Entry", label: "Queued in Kitchen" },
    { status: "Preparation Started", label: "Preparing" },
    { status: "Ready for Pickup", label: "Ready" }
  ];

  const getTimelineEvent = (statusName) => {
    return timeline.find(
      (t) => t.status.toLowerCase() === statusName.toLowerCase()
    );
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    return new Date(timeStr).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  };

  return (
    <div className="relative border-l-2 border-slate-200 dark:border-zinc-800 ml-3 pl-6 space-y-6 py-2">
      {steps.map((step, index) => {
        const event = getTimelineEvent(step.status);
        const isActive = event || currentStatus?.toLowerCase() === step.status.toLowerCase();
        
        return (
          <div key={index} className="relative">
            {/* Stepper Dot */}
            <span className={`absolute -left-[31px] top-0.5 flex items-center justify-center w-5 h-5 rounded-full ring-4 ring-white dark:ring-zinc-950 ${
              isActive 
                ? "bg-[var(--primary)] text-white" 
                : "bg-slate-100 dark:bg-zinc-800 text-slate-300 dark:text-zinc-600"
            }`}>
              {isActive ? (
                <CheckCircle2 size={12} className="stroke-[3]" />
              ) : (
                <Clock size={12} />
              )}
            </span>

            {/* Stepper Content */}
            <div>
              <h4 className={`text-xs font-bold ${
                isActive 
                  ? "text-slate-900 dark:text-white font-extrabold" 
                  : "text-slate-400 dark:text-zinc-500"
              }`}>
                {step.label}
              </h4>
              {event ? (
                <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5">
                  Completed at {formatTime(event.time)}
                </p>
              ) : (
                <p className="text-[10px] text-slate-300 dark:text-zinc-600 mt-0.5">
                  Pending
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
