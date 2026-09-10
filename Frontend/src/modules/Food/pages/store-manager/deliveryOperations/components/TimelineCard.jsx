import React from "react";
import { Check, Clock } from "lucide-react";

export default function TimelineCard({ timeline = [] }) {
  const defaultMilestones = [
    { key: "ready_for_pickup", label: "Ready For Pickup" },
    { key: "rider_assigned", label: "Rider Assigned" },
    { key: "accepted", label: "Accepted by Rider" },
    { key: "picked_up", label: "Picked Up" },
    { key: "out_for_delivery", label: "Out For Delivery" },
    { key: "delivered", label: "Delivered" }
  ];

  // Find exact time from the timeline array matching the milestone key
  const getMilestoneEvent = (key) => {
    return timeline.find(t => t.status === key);
  };

  // Determine active/completed indices
  let lastCompletedIndex = -1;
  defaultMilestones.forEach((ms, idx) => {
    if (getMilestoneEvent(ms.key)) {
      lastCompletedIndex = idx;
    }
  });

  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    try {
      const d = new Date(timeStr);
      return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    } catch (_) {
      return "";
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-855 rounded-2xl p-4 space-y-3.5 select-none">
      <h4 className="text-xs font-black uppercase text-slate-400 dark:text-zinc-555 tracking-wider text-left">Delivery Milestone Log</h4>

      <div className="relative pl-6 space-y-4 border-l-2 border-slate-200 dark:border-zinc-800 ml-2 text-left">
        {defaultMilestones.map((ms, idx) => {
          const event = getMilestoneEvent(ms.key);
          const isCompleted = idx < lastCompletedIndex || (lastCompletedIndex === 5 && idx === 5);
          const isCurrent = idx === lastCompletedIndex && lastCompletedIndex !== 5;

          let dotClass = "bg-slate-200 dark:bg-zinc-850 text-slate-400";
          let textClass = "text-slate-400 dark:text-zinc-500";
          let titleClass = "text-slate-550 dark:text-zinc-400";

          if (isCompleted) {
            dotClass = "bg-emerald-500 text-white ring-4 ring-emerald-100 dark:ring-emerald-950/40";
            textClass = "text-slate-500 dark:text-zinc-400";
            titleClass = "text-emerald-600 dark:text-emerald-400 font-extrabold";
          } else if (isCurrent) {
            dotClass = "bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-950/40 animate-pulse";
            textClass = "text-slate-900 dark:text-white";
            titleClass = "text-blue-600 dark:text-blue-400 font-black";
          }

          return (
            <div key={ms.key} className="relative">
              {/* Node Dot */}
              <div className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full flex items-center justify-center transition-all duration-300 ${dotClass}`}>
                {isCompleted ? <Check size={10} strokeWidth={3} /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
              </div>

              <div className="space-y-0.5">
                <div className="flex justify-between items-center gap-2">
                  <span className={`text-[10px] uppercase tracking-wider ${titleClass}`}>
                    {ms.label}
                  </span>
                  {event?.timestamp && (
                    <span className="text-[9px] font-bold text-slate-455 font-mono">
                      {formatTime(event.timestamp)}
                    </span>
                  )}
                </div>
                {event?.updatedBy && (
                  <p className={`text-[9px] font-semibold leading-relaxed ${textClass}`}>
                    Updated by {event.updatedBy}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
