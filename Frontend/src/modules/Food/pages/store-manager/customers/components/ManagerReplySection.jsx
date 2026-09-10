import React from "react";
import { MessageSquare, Calendar, UserCheck } from "lucide-react";

export default function ManagerReplySection({ reply = null, onReplyTrigger, isReadOnly = false }) {
  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="bg-slate-50 dark:bg-zinc-950 p-5 rounded-3xl border border-zinc-150 dark:border-zinc-800 space-y-4 text-xs font-semibold">
      <h4 className="text-sm font-black text-slate-800 dark:text-zinc-200 flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-850 pb-2">
        <MessageSquare size={15} className="text-[var(--primary)]" />
        Manager Official Response
      </h4>

      {reply ? (
        <div className="space-y-3">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-850 p-4 rounded-2xl text-zinc-750 dark:text-zinc-350 leading-relaxed font-bold">
            "{reply.text}"
          </div>
          
          <div className="flex justify-between items-center text-[10px] text-zinc-400">
            <span className="flex items-center gap-1">
              <UserCheck size={11} className="text-emerald-500" />
              <span>By: {reply.repliedBy || "Store Manager"}</span>
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={11} />
              <span>Published: {formatDate(reply.repliedAt)}</span>
            </span>
          </div>
        </div>
      ) : (
        <div className="text-center py-6 space-y-3">
          <p className="text-[10px] text-zinc-400 font-bold leading-normal">
            No official response has been dispatched for this review yet.
          </p>
          {!isReadOnly && (
            <button
              onClick={onReplyTrigger}
              className="px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-sm shadow-[var(--primary)]/10"
            >
              Reply to Review
            </button>
          )}
        </div>
      )}
    </div>
  );
}
