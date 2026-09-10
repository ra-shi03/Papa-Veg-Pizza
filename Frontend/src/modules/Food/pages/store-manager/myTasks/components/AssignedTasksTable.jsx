import React from "react";
import { ShieldAlert, Play, MapPin, User, Clock, ArrowRight } from "lucide-react";

export default function AssignedTasksTable({ tasks = [], onStartTask = () => {} }) {
  const getPriorityBadge = (prio) => {
    switch (prio) {
      case "high":
        return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-450 dark:border-rose-900/30 animate-pulse";
      case "medium":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-450 dark:border-amber-900/30";
      case "low":
      default:
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-900/30";
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "N/A";
    const date = new Date(timeStr);
    return date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
  };

  if (tasks.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[220px]">
        <div className="w-10 h-10 bg-zinc-50 dark:bg-zinc-950 text-slate-400 dark:text-zinc-500 rounded-xl flex items-center justify-center border border-zinc-150 dark:border-zinc-800/80 mb-3 animate-bounce">
          <ShieldAlert size={20} />
        </div>
        <h3 className="text-xs font-black text-slate-800 dark:text-zinc-200 uppercase tracking-wide">
          Queue Cleared
        </h3>
        <p className="text-[10px] font-semibold text-slate-450 dark:text-zinc-500 mt-1 max-w-xs leading-normal">
          No new kitchen tasks assigned to your station. New orders will appear here automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* DESKTOP TABLE */}
      <div className="hidden md:block overflow-x-auto bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl shadow-sm">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="border-b border-zinc-150 dark:border-zinc-800 text-[10px] font-black text-slate-450 dark:text-zinc-550 uppercase tracking-wider text-left bg-zinc-50/40 dark:bg-zinc-950/10">
              <th className="py-2.5 px-4">Task ID</th>
              <th className="py-2.5 px-3">Order Number</th>
              <th className="py-2.5 px-3">Task Details</th>
              <th className="py-2.5 px-3">Station</th>
              <th className="py-2.5 px-3">Priority</th>
              <th className="py-2.5 px-3">Est. Duration</th>
              <th className="py-2.5 px-3">Assigned By</th>
              <th className="py-2.5 px-3">Assigned At</th>
              <th className="py-2.5 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr
                key={task._id}
                className="border-b border-zinc-100 dark:border-zinc-800/60 hover:bg-zinc-50/40 dark:hover:bg-zinc-950/10 text-xs text-left transition-colors"
              >
                <td className="py-2.5 px-4 font-mono font-bold text-slate-450 dark:text-zinc-550">
                  {task._id}
                </td>
                <td className="py-2.5 px-3 font-extrabold text-[var(--primary)]">
                  {task.orderId}
                </td>
                <td className="py-2.5 px-3 max-w-[200px]">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-800 dark:text-zinc-200 line-clamp-1">{task.title}</span>
                    <span className="text-[9px] font-semibold text-slate-450 dark:text-zinc-500 line-clamp-1 mt-0.5">{task.description}</span>
                  </div>
                </td>
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-1 font-semibold text-slate-650 dark:text-zinc-300">
                    <MapPin size={10} className="text-slate-400" />
                    <span>{task.station}</span>
                  </div>
                </td>
                <td className="py-2.5 px-3">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${getPriorityBadge(task.priority)}`}>
                    {task.priority}
                  </span>
                </td>
                <td className="py-2.5 px-3 font-semibold text-slate-700 dark:text-zinc-300">
                  {task.estimatedMinutes} mins
                </td>
                <td className="py-2.5 px-3 text-slate-500 dark:text-zinc-450 font-medium">
                  {task.assignedBy}
                </td>
                <td className="py-2.5 px-3 text-slate-500 dark:text-zinc-450 font-mono font-semibold">
                  {formatTime(task.createdAt)}
                </td>
                <td className="py-2.5 px-4 text-right">
                  <button
                    onClick={() => onStartTask(task)}
                    className="text-[9px] font-bold py-1 px-2.5 rounded-md bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] shadow-sm active:scale-[0.98] transition-all flex items-center gap-1.5 ml-auto cursor-pointer"
                  >
                    <Play size={10} className="fill-white stroke-none" />
                    <span>Start Work</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MOBILE LIST CARDS */}
      <div className="md:hidden space-y-2.5">
        {tasks.map((task) => (
          <div
            key={task._id}
            className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-3.5 rounded-xl shadow-sm space-y-3"
          >
            {/* Header info */}
            <div className="flex justify-between items-start gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2">
              <div className="space-y-0.5">
                <span className="text-[8px] font-black text-slate-400 dark:text-zinc-550 uppercase font-mono block">
                  Task ID: {task._id}
                </span>
                <span className="text-xs font-black text-[var(--primary)] block">
                  Order: {task.orderId}
                </span>
              </div>
              <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full border ${getPriorityBadge(task.priority)}`}>
                {task.priority}
              </span>
            </div>

            {/* Task core details */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-black text-slate-800 dark:text-zinc-200 leading-snug">
                {task.title}
              </h4>
              <p className="text-[10px] font-medium text-slate-450 dark:text-zinc-500 leading-normal">
                {task.description}
              </p>
            </div>

            {/* Timings, station, and by */}
            <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-slate-500 dark:text-zinc-400 pt-2 border-t border-zinc-50 dark:border-zinc-850/80">
              <div className="flex items-center gap-1">
                <MapPin size={10} className="text-slate-450" />
                <span>Station: <strong className="text-slate-700 dark:text-zinc-300">{task.station}</strong></span>
              </div>
              <div className="flex items-center gap-1">
                <Clock size={10} className="text-slate-450" />
                <span>Time limit: <strong className="text-slate-700 dark:text-zinc-300">{task.estimatedMinutes}m</strong></span>
              </div>
              <div className="flex items-center gap-1 col-span-2">
                <User size={10} className="text-slate-450" />
                <span>Assigned By: <strong className="text-slate-750 dark:text-zinc-350">{task.assignedBy}</strong></span>
              </div>
            </div>

            {/* Actions button */}
            <div className="pt-2 border-t border-zinc-50 dark:border-zinc-850/80 flex items-center justify-between">
              <span className="text-[9px] font-semibold text-slate-400 dark:text-zinc-500">
                Assigned at {formatTime(task.createdAt)}
              </span>
              <button
                onClick={() => onStartTask(task)}
                className="text-[9px] font-black py-1.5 px-3 rounded-lg bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] shadow-sm active:scale-[0.98] transition-all flex items-center gap-1"
              >
                <Play size={9} className="fill-white stroke-none" />
                <span>Start Task</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
