import React from "react";
import { AlertTriangle, Play, RefreshCw, XCircle, Clock } from "lucide-react";

export default function DelayedTasksTable({
  tasks = [],
  role = "kitchen_staff",
  onResume = () => {},
  onRequestReassign = () => {},
  onReassign = () => {},
  onCancel = () => {},
}) {
  if (tasks.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[220px]">
        <div className="w-10 h-10 bg-zinc-50 dark:bg-zinc-950 text-emerald-500 rounded-xl flex items-center justify-center border border-zinc-150 dark:border-zinc-800/80 mb-3">
          <Play size={18} className="fill-emerald-500 stroke-none ml-0.5" />
        </div>
        <h3 className="text-xs font-black text-slate-800 dark:text-zinc-200 uppercase tracking-wide">
          No Delayed Tasks
        </h3>
        <p className="text-[10px] font-semibold text-slate-450 dark:text-zinc-555 mt-1 max-w-xs leading-normal">
          All tasks are running on schedule. No delay reports filed at your station.
        </p>
      </div>
    );
  }

  const isSupervisor = role === "kitchen_supervisor";

  return (
    <div className="overflow-x-auto bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl shadow-sm">
      <table className="w-full min-w-[750px]">
        <thead>
          <tr className="border-b border-zinc-150 dark:border-zinc-800 text-[10px] font-black text-slate-455 dark:text-zinc-555 uppercase tracking-wider text-left bg-zinc-50/40 dark:bg-zinc-950/10">
            <th className="py-2.5 px-4">Task Name</th>
            <th className="py-2.5 px-3">Order Number</th>
            <th className="py-2.5 px-3">Delay Reason</th>
            <th className="py-2.5 px-3">Remarks</th>
            <th className="py-2.5 px-3">Status</th>
            <th className="py-2.5 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr
              key={task._id}
              className="border-b border-zinc-100 dark:border-zinc-800/60 hover:bg-zinc-50/40 dark:hover:bg-zinc-950/10 text-xs text-left transition-colors"
            >
              <td className="py-2.5 px-4 max-w-[200px]">
                <div className="flex flex-col">
                  <span className="font-bold text-slate-800 dark:text-zinc-200">{task.title}</span>
                  <span className="text-[9px] font-semibold text-slate-400 dark:text-zinc-500 mt-0.5">{task.station}</span>
                </div>
              </td>
              <td className="py-2.5 px-3 font-extrabold text-[var(--primary)]">
                {task.orderId}
              </td>
              <td className="py-2.5 px-3">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded border border-amber-100 dark:border-amber-900/30">
                  <AlertTriangle size={9} />
                  <span>{task.delayReason || "Other Issue"}</span>
                </span>
              </td>
              <td className="py-2.5 px-3 text-slate-500 dark:text-zinc-400 font-semibold italic max-w-[220px] truncate">
                {task.delayRemarks || "No delay remarks logged."}
              </td>
              <td className="py-2.5 px-3">
                <span className="animate-pulse inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30">
                  <Clock size={9} />
                  <span>Delayed</span>
                </span>
              </td>
              <td className="py-2.5 px-4 text-right">
                <div className="flex items-center justify-end gap-1.5 ml-auto">
                  {/* RESUME BUTTON */}
                  <button
                    onClick={() => onResume(task)}
                    className="text-[9px] font-bold py-1.5 px-2.5 rounded-lg bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] shadow-sm active:scale-[0.98] transition-all flex items-center gap-1 cursor-pointer"
                    title="Resume Work"
                  >
                    <Play size={10} className="fill-white stroke-none" />
                    <span>Resume</span>
                  </button>

                  {/* REASSIGN BUTTON */}
                  {isSupervisor ? (
                    <button
                      onClick={() => onReassign(task)}
                      className="text-[9px] font-bold py-1.5 px-2.5 rounded-lg border border-zinc-250 dark:border-zinc-700 text-slate-650 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all flex items-center gap-1 cursor-pointer"
                      title="Reassign Task"
                    >
                      <RefreshCw size={10} className="text-[var(--secondary)]" />
                      <span>Reassign</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onRequestReassign(task)}
                      className="text-[9px] font-bold py-1.5 px-2.5 rounded-lg border border-zinc-250 dark:border-zinc-700 text-slate-650 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all flex items-center gap-1 cursor-pointer"
                      title="Request Reassignment"
                    >
                      <RefreshCw size={10} className="text-[var(--secondary)]" />
                      <span>Request Reassign</span>
                    </button>
                  )}

                  {/* CANCEL BUTTON */}
                  <button
                    onClick={() => onCancel(task)}
                    className="p-1.5 rounded-lg border border-zinc-250 dark:border-zinc-700 text-slate-500 hover:text-red-650 hover:border-red-200 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/15 transition-all cursor-pointer"
                    title="Cancel Task"
                  >
                    <XCircle size={11} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
