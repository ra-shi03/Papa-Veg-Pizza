import React, { useState } from "react";
import { Modal } from "antd";
import { RefreshCw, Send, Users, AlertCircle } from "lucide-react";

export default function ResendNotificationModal({ open, onCancel, onConfirm, notification }) {
  const [option, setOption] = useState("all"); // all | failed

  if (!notification) return null;

  return (
    <Modal
      title={null}
      open={open}
      onCancel={onCancel}
      footer={null}
      width={480}
      centered
      className="font-['Poppins']"
    >
      <div className="p-2 font-['Poppins'] space-y-5">
        <div className="flex flex-col items-center text-center">
          <div className="p-3 rounded-full bg-orange-50 text-[var(--primary)] mb-3 shadow-sm">
            <RefreshCw className="h-7 w-7" />
          </div>
          
          <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wide">
            Resend Notification
          </h3>
          <p className="text-zinc-450 dark:text-zinc-500 text-[10px] font-semibold">
            Choose how you would like to dispatch this notification campaign.
          </p>
        </div>

        {/* Resend Option Selector Radio Cards */}
        <div className="grid grid-cols-1 gap-3.5 w-full">
          <div
            onClick={() => setOption("all")}
            className={`cursor-pointer border rounded-xl p-4 transition-all text-left flex flex-col items-start gap-1.5 justify-center ${
              option === "all" 
                ? "border-[var(--primary)] bg-orange-50/5 ring-1 ring-[var(--primary)]" 
                : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-zinc-350 dark:hover:border-zinc-700"
            }`}
          >
            <span className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
              <Users size={14} className={option === "all" ? "text-[var(--primary)]" : "text-zinc-500"} />
              Resend to All Recipients
            </span>
            <span className="text-[9.5px] text-zinc-450 dark:text-zinc-500 font-semibold leading-relaxed">
              Creates a brand new duplicate notification and sends it to all targets in the segment.
            </span>
          </div>

          <div
            onClick={() => setOption("failed")}
            className={`cursor-pointer border rounded-xl p-4 transition-all text-left flex flex-col items-start gap-1.5 justify-center ${
              option === "failed" 
                ? "border-[var(--primary)] bg-orange-50/5 ring-1 ring-[var(--primary)]" 
                : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-zinc-350 dark:hover:border-zinc-700"
            }`}
          >
            <span className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
              <AlertCircle size={14} className={option === "failed" ? "text-[var(--primary)]" : "text-zinc-500"} />
              Retry Failed Deliveries Only
            </span>
            <span className="text-[9.5px] text-zinc-450 dark:text-zinc-500 font-semibold leading-relaxed">
              Attempts to re-route and re-deliver notifications to customers who failed to receive it the first time.
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2 px-4 border border-zinc-250 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-extrabold uppercase rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors text-[10px] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(option)}
            className="flex-1 py-2 px-4 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-extrabold uppercase rounded-lg transition-all text-[10px] cursor-pointer shadow-md flex items-center justify-center gap-1"
          >
            <Send size={11} />
            Confirm Dispatch
          </button>
        </div>
      </div>
    </Modal>
  );
}
