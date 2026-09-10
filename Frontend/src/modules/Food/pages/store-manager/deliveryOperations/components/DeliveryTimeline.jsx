import React from "react";
import { Check, Dot } from "lucide-react";

export default function DeliveryTimeline({ timeline = {}, currentStatus }) {
  const stages = [
    { key: "assigned", label: "Assigned", time: timeline.assignedAt },
    { key: "accepted", label: "Accepted", time: timeline.acceptedAt },
    { key: "picked_up", label: "Picked Up", time: timeline.pickupAt },
    { key: "out_for_delivery", label: "Out For Delivery", time: timeline.outForDeliveryAt },
    { key: "delivered", label: "Delivered", time: timeline.deliveredAt }
  ];

  // Determine current active stage index
  let activeIndex = -1;
  for (let i = stages.length - 1; i >= 0; i--) {
    if (stages[i].time) {
      activeIndex = i;
      break;
    }
  }

  // If the status from order list is different, we can align it
  const statusIndexMap = {
    "assigned": 0,
    "accepted": 1,
    "picked_up": 2,
    "out_for_delivery": 3,
    "delivered": 4
  };
  if (currentStatus && statusIndexMap[currentStatus?.toLowerCase()] !== undefined) {
    activeIndex = Math.max(activeIndex, statusIndexMap[currentStatus?.toLowerCase()]);
  }

  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    try {
      const d = new Date(timeStr);
      return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    } catch (_) {
      return "";
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-855 rounded-2xl p-4 space-y-4">
      <h4 className="text-xs font-black uppercase text-slate-400 dark:text-zinc-555 tracking-wider">Delivery Milestones</h4>
      
      <div className="relative pl-6 space-y-5 border-l-2 border-slate-200 dark:border-zinc-800/80 ml-2">
        {stages.map((stage, idx) => {
          const isCompleted = idx < activeIndex || (activeIndex === 4 && idx === 4);
          const isCurrent = idx === activeIndex && activeIndex !== 4;
          const isPending = idx > activeIndex;

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
            <div key={stage.key} className="relative select-none">
              {/* Vertical node icon */}
              <div className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full flex items-center justify-center transition-all duration-300 ${dotClass}`}>
                {isCompleted ? <Check size={10} strokeWidth={3} /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
              </div>

              <div className="space-y-0.5 text-left">
                <div className="flex justify-between items-center gap-2">
                  <span className={`text-[10px] uppercase tracking-wider ${titleClass}`}>
                    {stage.label}
                  </span>
                  {stage.time && (
                    <span className="text-[9px] font-bold text-slate-455 font-mono">
                      {formatTime(stage.time)}
                    </span>
                  )}
                </div>
                {isCurrent && (
                  <p className={`text-[9px] font-semibold leading-relaxed ${textClass}`}>
                    Order is currently active in this stage.
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
