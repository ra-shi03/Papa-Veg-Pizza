import React, { useState } from "react";
import { Play, X, Clock, MapPin, Loader2 } from "lucide-react";

export default function StartTaskModal({
  isOpen = false,
  task = {},
  onClose = () => {},
  onConfirm = () => {},
  loading = false,
}) {
  const [specialNotes, setSpecialNotes] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(task._id, specialNotes);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-955/45 dark:bg-zinc-955/65 backdrop-blur-xs animate-fade">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl p-5 shadow-xl max-w-sm w-full space-y-4 animate-scale">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-1.5 text-slate-900 dark:text-white">
            <Play size={15} className="text-[var(--primary)] fill-[var(--primary)] stroke-none" />
            <span className="text-xs font-black uppercase tracking-wider">Start Kitchen Task</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 dark:text-zinc-550 hover:bg-zinc-50 dark:hover:bg-zinc-850"
          >
            <X size={14} />
          </button>
        </div>

        {/* Task Details Overview */}
        <div className="space-y-2">
          <h3 className="text-xs font-black text-slate-800 dark:text-zinc-200">
            {task?.title || "Fulfillment Action"}
          </h3>
          <p className="text-[10px] font-medium text-slate-450 dark:text-zinc-500 leading-relaxed">
            {task?.description || "Prepare food item matching orders specifications."}
          </p>

          <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-slate-500 dark:text-zinc-400 pt-1">
            <div className="flex items-center gap-1.5">
              <MapPin size={11} className="text-[var(--primary)]" />
              <span>Station: <strong className="text-slate-850 dark:text-zinc-200">{task?.station}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={11} className="text-[var(--secondary)]" />
              <span>Target: <strong className="text-slate-850 dark:text-zinc-200">{task?.estimatedMinutes}m</strong></span>
            </div>
          </div>
        </div>

        {/* Input Notes Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              Special Prep Notes (Optional)
            </label>
            <textarea
              value={specialNotes}
              onChange={(e) => setSpecialNotes(e.target.value)}
              placeholder="e.g. Extra toppings set, starting crust knead..."
              rows={2}
              disabled={loading}
              className="w-full text-xs font-semibold px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 dark:focus:ring-offset-zinc-900 transition-all disabled:opacity-50"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-50 dark:border-zinc-800/60">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="text-[10px] font-bold px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-850 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="text-[10px] font-bold px-4 py-2 rounded-lg bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] active:scale-[0.98] transition-all shadow-sm flex items-center gap-1 disabled:opacity-50 cursor-pointer"
            >
              {loading && <Loader2 size={12} className="animate-spin" />}
              <span>Start Working</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
