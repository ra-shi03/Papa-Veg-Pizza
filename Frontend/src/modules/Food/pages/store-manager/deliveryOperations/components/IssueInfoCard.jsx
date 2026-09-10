import React from "react";
import { AlertCircle, Clock, ShieldAlert, Check } from "lucide-react";

export default function IssueInfoCard({ issue = {} }) {
  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case "low":
        return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
      case "medium":
        return "text-amber-500 bg-amber-500/10 border-amber-500/20";
      case "critical":
        return "text-rose-500 bg-rose-500/10 border-rose-500/20 animate-pulse";
      default:
        return "text-slate-500 bg-slate-500/10 border-slate-500/20";
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "open":
        return "text-slate-600 bg-slate-100 border-slate-200 dark:bg-zinc-800 dark:text-zinc-300";
      case "in_progress":
        return "text-blue-600 bg-blue-100 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400";
      case "resolved":
        return "text-emerald-600 bg-emerald-100 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400";
      case "escalated":
        return "text-orange-600 bg-orange-100 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400";
      case "closed":
        return "text-zinc-500 bg-zinc-100 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-500";
      default:
        return "text-slate-655 bg-slate-100 border-slate-200";
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "N/A";
    try {
      const d = new Date(timeStr);
      return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) + " (" + d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) + ")";
    } catch (_) {
      return timeStr;
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-855 rounded-2xl p-4 space-y-3.5 h-full select-none">
      <div className="flex items-center gap-2 border-b border-slate-200/50 dark:border-zinc-800/50 pb-2">
        <div className="w-7 h-7 rounded-lg bg-orange-50 dark:bg-orange-950/20 text-orange-600 flex items-center justify-center">
          <AlertCircle size={14} />
        </div>
        <div className="text-left">
          <h4 className="text-xs font-black uppercase text-slate-400 dark:text-zinc-555 tracking-wider leading-none">Ticket Information</h4>
          <span className="text-[11px] font-extrabold text-slate-800 dark:text-zinc-200 mt-1 block">ID: {issue._id || "N/A"}</span>
        </div>
      </div>

      <div className="space-y-3.5 text-left text-[11px] font-bold text-slate-600 dark:text-zinc-400">
        
        {/* Type & Severity */}
        <div className="grid grid-cols-2 gap-2 border-b border-slate-150/40 dark:border-zinc-800/40 pb-3">
          <div className="space-y-1">
            <span className="text-[8px] uppercase tracking-wider text-slate-400 dark:text-zinc-555 block font-black">Issue Exception</span>
            <span className="text-slate-900 dark:text-white font-extrabold text-[10px]">{issue.issueType}</span>
          </div>
          <div className="space-y-1">
            <span className="text-[8px] uppercase tracking-wider text-slate-400 dark:text-zinc-555 block font-black">Severity</span>
            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border inline-block ${getSeverityColor(issue.severity)}`}>
              {issue.severity}
            </span>
          </div>
        </div>

        {/* Status & Timing */}
        <div className="grid grid-cols-2 gap-2 border-b border-slate-150/40 dark:border-zinc-800/40 pb-3">
          <div className="space-y-1">
            <span className="text-[8px] uppercase tracking-wider text-slate-400 dark:text-zinc-555 block font-black">Ticket Status</span>
            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border inline-block ${getStatusColor(issue.status)}`}>
              {issue.status ? issue.status.replace(/_/g, " ") : "open"}
            </span>
          </div>
          <div className="space-y-1">
            <span className="text-[8px] uppercase tracking-wider text-slate-400 dark:text-zinc-555 block font-black">Reported At</span>
            <span className="text-slate-850 dark:text-zinc-300 font-extrabold text-[9px]">{formatTime(issue.createdAt)}</span>
          </div>
        </div>

        {/* Reported By */}
        <div className="border-b border-slate-150/40 dark:border-zinc-800/40 pb-3 space-y-1">
          <span className="text-[8px] uppercase tracking-wider text-slate-400 dark:text-zinc-555 block font-black">Reported By</span>
          <span className="text-slate-900 dark:text-white font-extrabold text-[10px]">{issue.reportedBy}</span>
        </div>

        {/* Description text block */}
        <div className="space-y-1">
          <span className="text-[8px] uppercase tracking-wider text-slate-400 dark:text-zinc-555 block font-black">Description notes</span>
          <p className="text-[10px] text-slate-800 dark:text-zinc-300 leading-relaxed font-semibold bg-slate-100/60 dark:bg-zinc-900 border border-slate-150/20 dark:border-zinc-800/80 p-2.5 rounded-xl">
            {issue.description || "No description provided."}
          </p>
        </div>

        {/* Resolution notes if resolved */}
        {issue.status === "resolved" && issue.resolution && (
          <div className="space-y-1 border-t border-slate-200/40 dark:border-zinc-800/40 pt-3 select-none">
            <div className="flex items-center gap-1 text-[8px] uppercase tracking-wider text-emerald-500 font-black">
              <Check size={10} strokeWidth={3} />
              <span>Resolution comment</span>
            </div>
            <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-500/5 border border-emerald-500/10 p-2.5 rounded-xl">
              {issue.resolution}
            </p>
            {issue.refundAmount > 0 && (
              <div className="flex justify-between items-center text-[9px] pt-1">
                <span className="text-slate-400 font-bold">Refund amount:</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">₹{issue.refundAmount}</span>
              </div>
            )}
            {issue.penaltyAmount > 0 && (
              <div className="flex justify-between items-center text-[9px] pt-0.5">
                <span className="text-slate-400 font-bold">Driver penalty:</span>
                <span className="font-extrabold text-rose-600 dark:text-rose-400 font-mono">₹{issue.penaltyAmount}</span>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
