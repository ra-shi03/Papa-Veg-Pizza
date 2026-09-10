import React from "react";
import { Eye, Clock, User, ShieldAlert } from "lucide-react";

export default function IssueTable({ issues = [], isLoading, onViewIssue }) {
  const safeIssues = Array.isArray(issues) ? issues : [];

  const getSeverityBadge = (severity) => {
    switch (severity?.toLowerCase()) {
      case "low":
        return "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/15 dark:text-emerald-400 dark:border-emerald-900/30";
      case "medium":
        return "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/15 dark:text-amber-400 dark:border-amber-900/30";
      case "critical":
        return "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/20 dark:text-rose-450 dark:border-rose-900/30 animate-pulse";
      default:
        return "bg-slate-50 text-slate-600 border-slate-100 dark:bg-zinc-800 dark:text-zinc-400";
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "open":
        return "bg-slate-50 text-slate-700 border-slate-150 dark:bg-zinc-850 dark:text-zinc-300 dark:border-zinc-800";
      case "in_progress":
        return "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/15 dark:text-blue-400 dark:border-blue-900/30";
      case "resolved":
        return "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/15 dark:text-emerald-400 dark:border-emerald-900/30";
      case "escalated":
        return "bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-950/10 dark:text-orange-400 dark:border-orange-900/20 ring-1 ring-orange-400";
      case "closed":
        return "bg-zinc-100 text-zinc-650 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-500 dark:border-zinc-850";
      default:
        return "bg-slate-50 text-slate-600 border-slate-100 dark:bg-zinc-800 dark:text-zinc-400";
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "--:--";
    try {
      const d = new Date(timeStr);
      return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }) + " (" + d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) + ")";
    } catch (_) {
      return timeStr;
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm transition-all duration-300 w-full">
      {/* Desktop/Tablet Table */}
      <div className="hidden md:block overflow-x-auto w-full">
        <table className="w-full border-collapse text-left text-xs table-auto">
          <thead>
            <tr className="bg-slate-50 dark:bg-zinc-950 text-slate-400 dark:text-zinc-555 border-b border-slate-100 dark:border-zinc-855 font-black uppercase tracking-widest text-[9px]">
              <th className="py-3.5 px-4">Ticket ID</th>
              <th className="py-3.5 px-4">Order ID</th>
              <th className="py-3.5 px-4">Rider</th>
              <th className="py-3.5 px-4">Issue Type</th>
              <th className="py-3.5 px-4">Reported By</th>
              <th className="py-3.5 px-4">Severity</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">Created At</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-zinc-850">
            {isLoading ? (
              [1, 2, 3].map((n) => (
                <tr key={n} className="animate-pulse">
                  <td className="py-4 px-4"><div className="h-3.5 bg-slate-200 dark:bg-zinc-850 rounded w-16" /></td>
                  <td className="py-4 px-4"><div className="h-3.5 bg-slate-200 dark:bg-zinc-850 rounded w-16" /></td>
                  <td className="py-4 px-4"><div className="h-3.5 bg-slate-200 dark:bg-zinc-850 rounded w-24" /></td>
                  <td className="py-4 px-4"><div className="h-3.5 bg-slate-200 dark:bg-zinc-850 rounded w-24" /></td>
                  <td className="py-4 px-4"><div className="h-3.5 bg-slate-200 dark:bg-zinc-850 rounded w-16" /></td>
                  <td className="py-4 px-4"><div className="h-5 bg-slate-200 dark:bg-zinc-850 rounded-md w-16" /></td>
                  <td className="py-4 px-4"><div className="h-5 bg-slate-200 dark:bg-zinc-850 rounded-md w-16" /></td>
                  <td className="py-4 px-4"><div className="h-3.5 bg-slate-200 dark:bg-zinc-850 rounded w-24" /></td>
                  <td className="py-4 px-4 text-right"><div className="h-8 bg-slate-200 dark:bg-zinc-850 rounded w-16 ml-auto" /></td>
                </tr>
              ))
            ) : safeIssues.length === 0 ? (
              <tr>
                <td colSpan="9" className="py-12 text-center text-slate-400 dark:text-zinc-550 font-black text-sm">
                  No exception tickets found.
                </td>
              </tr>
            ) : (
              safeIssues.map((issue) => (
                <tr
                  key={issue._id}
                  className="hover:bg-slate-50/50 dark:hover:bg-zinc-950/20 font-bold transition-all text-slate-800 dark:text-zinc-300"
                >
                  <td className="py-3 px-4 font-black text-slate-900 dark:text-white">
                    {issue._id}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-655 dark:text-zinc-350">
                    {issue.orderId}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1 text-slate-700 dark:text-zinc-300">
                      <User size={12} className="text-slate-400" />
                      <span>{issue.riderName || "Unassigned"}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-extrabold text-slate-900 dark:text-white">
                    {issue.issueType}
                  </td>
                  <td className="py-3 px-4 text-slate-500 font-semibold">
                    {issue.reportedBy}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${getSeverityBadge(issue.severity)}`}>
                      {issue.severity}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${getStatusBadge(issue.status)}`}>
                      {issue.status ? issue.status.replace(/_/g, " ") : "open"}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-500">
                    {formatTime(issue.createdAt)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onViewIssue(issue._id)}
                      style={{ backgroundColor: "var(--primary)" }}
                      className="h-8 px-3 rounded-xl text-[10px] uppercase font-black tracking-wider transition-all shadow-sm cursor-pointer text-white hover:opacity-90 flex items-center gap-1 ml-auto"
                    >
                      <Eye size={12} />
                      <span>View</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout */}
      <div className="md:hidden divide-y divide-slate-100 dark:divide-zinc-850 p-1">
        {isLoading ? (
          [1, 2].map((n) => (
            <div key={n} className="p-4 space-y-3 animate-pulse">
              <div className="flex justify-between">
                <div className="h-4 bg-slate-200 dark:bg-zinc-850 rounded w-20" />
                <div className="h-4 bg-slate-200 dark:bg-zinc-850 rounded w-16" />
              </div>
              <div className="h-3.5 bg-slate-200 dark:bg-zinc-850 rounded w-32" />
              <div className="h-8 bg-slate-200 dark:bg-zinc-850 rounded w-full" />
            </div>
          ))
        ) : safeIssues.length === 0 ? (
          <div className="py-12 text-center text-slate-455 dark:text-zinc-550 font-black text-xs">
            No exception tickets found.
          </div>
        ) : (
          safeIssues.map((issue) => (
            <div key={issue._id} className="p-4 space-y-3 font-bold text-xs">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-900 dark:text-white font-extrabold text-sm block">
                      {issue._id}
                    </span>
                    <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md border ${getSeverityBadge(issue.severity)}`}>
                      {issue.severity}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold mt-0.5 block">
                    Order: {issue.orderId} | Reported by: {issue.reportedBy}
                  </span>
                </div>
                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${getStatusBadge(issue.status)}`}>
                  {issue.status ? issue.status.replace(/_/g, " ") : "open"}
                </span>
              </div>

              <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-normal border-l-2 border-slate-200 dark:border-zinc-800 pl-2">
                <strong>{issue.issueType}:</strong> {issue.description}
              </p>

              <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-50 dark:bg-zinc-950 p-2.5 rounded-xl border border-slate-100 dark:border-zinc-855 text-slate-600 dark:text-zinc-400">
                <div>
                  <span className="text-slate-400 block uppercase text-[8px] font-black">Rider:</span>
                  <span className="font-bold text-slate-800 dark:text-white">{issue.riderName || "Unassigned"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase text-[8px] font-black">Created:</span>
                  <span className="font-bold text-slate-800 dark:text-white flex items-center gap-0.5">
                    <Clock size={10} />
                    {formatTime(issue.createdAt)}
                  </span>
                </div>
              </div>

              <button
                onClick={() => onViewIssue(issue._id)}
                style={{ backgroundColor: "var(--primary)" }}
                className="w-full h-9 rounded-xl text-[10px] uppercase font-black tracking-wider transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer text-white hover:opacity-90"
              >
                <Eye size={12} />
                <span>View Details</span>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
