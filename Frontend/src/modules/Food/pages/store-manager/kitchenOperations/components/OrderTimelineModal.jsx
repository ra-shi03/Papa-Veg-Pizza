import React from "react";
import { Drawer } from "antd";
import { Clock, CheckCircle2, AlertTriangle, Calendar } from "lucide-react";

export default function OrderTimelineModal({ visible, onClose, order }) {
  if (!order) return null;

  const steps = [
    { status: "Placed", label: "Order Placed", key: "placed" },
    { status: "Confirmed", label: "Confirmed", key: "confirmed" },
    { status: "Queued", label: "Queued in Kitchen", key: "queued" },
    { status: "Preparing", label: "Preparation Stage", key: "preparing", delayLimit: 10 },
    { status: "Baking", label: "Baking in Oven", key: "baking", delayLimit: 15 },
    { status: "Packaging", label: "Quality Check & Sealing", key: "packaging", delayLimit: 5 },
    { status: "Ready", label: "Ready for Pickup/Delivery", key: "ready" }
  ];

  // Helper to format time
  const formatTime = (timeStr) => {
    if (!timeStr) return "-";
    return new Date(timeStr).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  };

  // Helper to get matching step event in timeline
  const getTimelineEvent = (statusName) => {
    if (!order.timeline) return null;
    return order.timeline.find(
      (t) => t.status.toLowerCase() === statusName.toLowerCase()
    );
  };

  // Calculate if a specific stage has exceeded SLA
  const getStageDelay = (step) => {
    const event = getTimelineEvent(step.status);
    if (!event) return null;
    if (event.delay) return event.delay;
    
    // Fallback if delay is on the main order object for that status
    if (order.status.toLowerCase() === step.status.toLowerCase() && order.isDelayed) {
      return order.delay_duration;
    }
    return null;
  };

  // Calculate actual time, expected time, and total delay
  const orderPlacedTime = getTimelineEvent("Placed")?.time || order.createdAt;
  const expectedReadyTime = order.expectedReadyTime;
  const actualReadyTime = getTimelineEvent("Ready")?.time;

  return (
    <Drawer
      title={
        <div className="flex items-center gap-2.5 pb-2">
          <div className="p-1.5 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-xl">
            <Clock size={18} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Order Timeline #{order.orderNumber}</h3>
            <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-550 mt-0.5">
              SLA tracking and kitchen station bottlenecks
            </p>
          </div>
        </div>
      }
      open={visible}
      onClose={onClose}
      width={460}
      className="dark:bg-zinc-900"
    >
      <div className="space-y-5 text-xs text-slate-800 dark:text-zinc-200">
        {/* Delay Details Card */}
        <div className="bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-950/30 p-4 rounded-2.5xl space-y-2.5">
          <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-black">
            <AlertTriangle size={14} />
            <span className="uppercase tracking-wider text-[10px]">SLA Violation Alert</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-bold text-slate-700 dark:text-zinc-300">
            <div className="bg-white dark:bg-zinc-950 p-2.5 rounded-xl border border-slate-100 dark:border-zinc-850">
              <span className="text-[9px] text-slate-400 dark:text-zinc-555 block mb-0.5 uppercase">Expected Ready</span>
              <span className="font-extrabold">{formatTime(expectedReadyTime)}</span>
            </div>
            <div className="bg-white dark:bg-zinc-950 p-2.5 rounded-xl border border-slate-100 dark:border-zinc-850">
              <span className="text-[9px] text-slate-400 dark:text-zinc-555 block mb-0.5 uppercase">Total Delay</span>
              <span className="font-extrabold text-rose-500">{order.delay_duration} minutes</span>
            </div>
          </div>
          {order.reason && (
            <div className="bg-white dark:bg-zinc-950 p-2.5 rounded-xl border border-slate-100 dark:border-zinc-850 text-[11px]">
              <span className="text-[9px] text-slate-400 dark:text-zinc-555 block mb-0.5 uppercase font-bold">Primary Reason</span>
              <span className="font-extrabold text-rose-500">{order.reason}</span>
            </div>
          )}
        </div>

        {/* Stepper timeline */}
        <div className="relative border-l-2 border-slate-100 dark:border-zinc-800 ml-4 pl-6 space-y-6 py-2">
          {steps.map((step) => {
            const event = getTimelineEvent(step.status);
            const isCurrent = order.status.toLowerCase() === step.key;
            const isCompleted = event !== null && event !== undefined;
            const isFuture = !isCompleted && !isCurrent;
            const delayVal = getStageDelay(step);
            const isDelayed = delayVal !== null && (step.delayLimit ? delayVal > step.delayLimit : true);

            let dotColor = "bg-slate-100 dark:bg-zinc-800 text-slate-300 dark:text-zinc-600";
            if (isDelayed) {
              dotColor = "bg-rose-500 text-white ring-4 ring-rose-500/20";
            } else if (isCompleted) {
              dotColor = "bg-[var(--primary)] text-white";
            } else if (isCurrent) {
              dotColor = "bg-[var(--secondary)] text-white animate-pulse";
            }

            return (
              <div key={step.status} className="relative">
                {/* Stepper Dot */}
                <span className={`absolute -left-[32px] top-0.5 flex items-center justify-center w-5.5 h-5.5 rounded-full ring-4 ring-white dark:ring-zinc-900 transition-all duration-300 ${dotColor}`}>
                  {isDelayed ? (
                    <AlertTriangle size={11} className="stroke-[3]" />
                  ) : isCompleted ? (
                    <CheckCircle2 size={11} className="stroke-[3]" />
                  ) : (
                    <Clock size={11} />
                  )}
                </span>

                {/* Stepper Content */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className={`text-xs font-black tracking-tight ${
                      isDelayed
                        ? "text-rose-500"
                        : isCompleted
                        ? "text-slate-900 dark:text-white"
                        : isCurrent
                        ? "text-[var(--secondary)]"
                        : "text-slate-400 dark:text-zinc-550"
                    }`}>
                      {step.label}
                    </h4>

                    {isDelayed && (
                      <span className="text-[9px] font-black bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 px-2 py-0.5 rounded-md border border-rose-100 dark:border-rose-900/30">
                        {delayVal} MIN DELAY
                      </span>
                    )}
                  </div>

                  {event ? (
                    <div className="text-[10px] text-slate-500 dark:text-zinc-400 font-bold space-y-0.5">
                      <p>Reached at {formatTime(event.time)}</p>
                      {step.delayLimit && (
                        <p className="text-[9px] text-slate-400">
                          SLA threshold: {step.delayLimit} min
                        </p>
                      )}
                    </div>
                  ) : isCurrent ? (
                    <div className="text-[10px] text-amber-500 font-bold">
                      Currently at this station
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-300 dark:text-zinc-650 font-bold">
                      Pending
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Summary card */}
        <div className="bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-850 p-3 rounded-2xl flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-zinc-400">
          <div className="flex items-center gap-1.5">
            <Calendar size={12} className="text-slate-400" />
            <span>Order Placed: {formatTime(orderPlacedTime)}</span>
          </div>
          <div>
            <span>Value: <strong className="text-[var(--primary)] text-xs">₹{order.grandTotal}</strong></span>
          </div>
        </div>
      </div>
    </Drawer>
  );
}
