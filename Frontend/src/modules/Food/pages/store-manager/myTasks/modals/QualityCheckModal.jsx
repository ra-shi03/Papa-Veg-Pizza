import React, { useState } from "react";
import { ShieldCheck, X, Star, Thermometer, CheckCircle, Loader2 } from "lucide-react";

export default function QualityCheckModal({
  isOpen = false,
  task = {},
  onClose = () => {},
  onConfirm = () => {},
  loading = false,
}) {
  const [rating, setRating] = useState(5);
  const [temperature, setTemperature] = useState("72");
  const [toppingsCorrect, setToppingsCorrect] = useState(true);
  const [crustCorrect, setCrustCorrect] = useState(true);
  const [remarks, setRemarks] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm({
      taskId: task._id,
      orderId: task.orderId || "PVP-Unknown",
      rating,
      temperature,
      toppingsCorrect,
      crustCorrect,
      remarks,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-955/45 dark:bg-zinc-955/65 backdrop-blur-xs animate-fade">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl p-5 shadow-xl max-w-sm w-full space-y-4 animate-scale">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-1.5 text-slate-900 dark:text-white">
            <ShieldCheck size={15} className="text-emerald-500" />
            <span className="text-xs font-black uppercase tracking-wider">Submit Quality Check</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 dark:text-zinc-550 hover:bg-zinc-50 dark:hover:bg-zinc-850"
          >
            <X size={14} />
          </button>
        </div>

        {/* Task Name */}
        <div className="space-y-0.5">
          <h3 className="text-xs font-black text-slate-805 dark:text-zinc-200">
            {task?.title}
          </h3>
          <p className="text-[10px] font-semibold text-slate-400 dark:text-zinc-555">
            Order ID: <strong className="text-[var(--primary)]">{task?.orderId}</strong> &bull; Completed by: {task?.assignedTo}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Visual Rating Selector */}
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
              Quality Rating
            </label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform active:scale-90"
                >
                  <Star
                    size={20}
                    className={
                      star <= rating
                        ? "text-amber-400 fill-amber-400"
                        : "text-zinc-300 dark:text-zinc-700"
                    }
                  />
                </button>
              ))}
              <span className="ml-2 text-xs font-black text-slate-700 dark:text-zinc-300">
                {rating} / 5
              </span>
            </div>
          </div>

          {/* Temperature & Toggles Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                <Thermometer size={10} className="text-[var(--primary)]" />
                Temp (°C)
              </label>
              <input
                type="number"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                placeholder="e.g. 70"
                required
                disabled={loading}
                className="w-full text-xs font-semibold px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-slate-850 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all"
              />
            </div>

            <div className="space-y-1.5 flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer select-none text-[10px] font-bold text-slate-700 dark:text-zinc-350">
                <input
                  type="checkbox"
                  checked={toppingsCorrect}
                  onChange={(e) => setToppingsCorrect(e.target.checked)}
                  className="rounded border-zinc-300 dark:border-zinc-700 text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer"
                />
                Toppings Approved
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none text-[10px] font-bold text-slate-700 dark:text-zinc-350">
                <input
                  type="checkbox"
                  checked={crustCorrect}
                  onChange={(e) => setCrustCorrect(e.target.checked)}
                  className="rounded border-zinc-300 dark:border-zinc-700 text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer"
                />
                Crust Bake Approved
              </label>
            </div>
          </div>

          {/* Remarks */}
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              Verification Remarks
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Perfect crust thickness and even topping distribution..."
              rows={2}
              required
              disabled={loading}
              className="w-full text-xs font-semibold px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-slate-855 dark:text-zinc-205 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all disabled:opacity-50"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-50 dark:border-zinc-800/60">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="text-[10px] font-bold px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-855 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="text-[10px] font-bold px-4 py-2 rounded-lg bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] active:scale-[0.98] transition-all shadow-sm flex items-center gap-1 disabled:opacity-50 cursor-pointer"
            >
              {loading && <Loader2 size={12} className="animate-spin" />}
              <span>Approve Quality</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
