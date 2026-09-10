import React, { useState } from "react";
import { AlertTriangle, X, Loader2 } from "lucide-react";

export default function DelayReportModal({
  isOpen = false,
  task = {},
  onClose = () => {},
  onConfirm = () => {},
  loading = false,
}) {
  const [reason, setReason] = useState("Ingredient Shortage");
  const [delayMinutes, setDelayMinutes] = useState(10);
  const [remarks, setRemarks] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(task._id, {
      reason,
      delayMinutes,
      remarks,
    });
  };

  const reasons = [
    "Ingredient Shortage",
    "Equipment Issue",
    "Staff Shortage",
    "Complex Order",
    "Other",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-955/45 dark:bg-zinc-955/65 backdrop-blur-xs animate-fade">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl p-5 shadow-xl max-w-sm w-full space-y-4 animate-scale">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-1.5 text-slate-900 dark:text-white">
            <AlertTriangle size={15} className="text-amber-500" />
            <span className="text-xs font-black uppercase tracking-wider">Report Task Delay</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 dark:text-zinc-550 hover:bg-zinc-50 dark:hover:bg-zinc-850"
          >
            <X size={14} />
          </button>
        </div>

        {/* Task details */}
        <div className="space-y-0.5">
          <h3 className="text-xs font-black text-slate-805 dark:text-zinc-200">
            {task?.title}
          </h3>
          <p className="text-[10px] font-semibold text-slate-450 dark:text-zinc-500">
            Order ID: <strong className="text-[var(--primary)]">{task?.orderId}</strong> &bull; Station: {task?.station}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Reason Selection */}
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              Delay Category Reason
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={loading}
              className="w-full text-xs font-semibold px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all cursor-pointer"
            >
              {reasons.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Expected Delay Duration */}
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              Estimated Delay Duration (Minutes)
            </label>
            <select
              value={delayMinutes}
              onChange={(e) => setDelayMinutes(Number(e.target.value))}
              disabled={loading}
              className="w-full text-xs font-semibold px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all cursor-pointer"
            >
              <option value={5}>5 Minutes</option>
              <option value={10}>10 Minutes</option>
              <option value={15}>15 Minutes</option>
              <option value={20}>20 Minutes</option>
              <option value={30}>30+ Minutes</option>
            </select>
          </div>

          {/* Remarks */}
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              Detailed Remarks / Countermeasures
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Waiting for cheese base restock from cold storage, supervisor informed..."
              rows={2}
              required
              disabled={loading}
              className="w-full text-xs font-semibold px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all disabled:opacity-50"
            />
          </div>

          {/* Actions */}
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
              <span>Submit Delay Report</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
