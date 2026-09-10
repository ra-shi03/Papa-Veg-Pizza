import React, { useEffect } from "react";
import { X, AlertTriangle, Clock, ShieldAlert, CheckCircle2, Loader2 } from "lucide-react";
import { useDelayAnalysis } from "../hooks/useDelayAnalysis";

export default function DelayAnalysisModal({ isOpen, onClose, orderId }) {
  const { data, isLoading, isError } = useDelayAnalysis(orderId);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center lg:pl-[280px] overflow-x-hidden overflow-y-auto outline-none transition-all">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-zinc-900/60 dark:bg-zinc-950/80 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-md mx-3 my-6 z-50 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-fade-down duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <AlertTriangle size={16} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                Delay Incident Analysis
              </h2>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold mt-0.5">
                Root-cause log & resolutions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-50 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-650 dark:text-zinc-500 dark:hover:text-zinc-300 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2">
              <Loader2 className="animate-spin text-amber-500" size={24} />
              <span className="text-xs font-bold text-zinc-400">Loading incident data...</span>
            </div>
          ) : isError || !data ? (
            <div className="py-8 text-center text-zinc-450 dark:text-zinc-500 font-bold text-xs">
              No Delay Data found for this order.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Order and Duration Header */}
              <div className="flex justify-between items-center p-4 bg-amber-50/20 dark:bg-amber-950/10 border border-amber-100/30 dark:border-amber-900/10 rounded-2xl">
                <div>
                  <span className="text-[9px] uppercase font-extrabold text-zinc-400 dark:text-zinc-500">Order Number</span>
                  <div className="text-sm font-black text-[var(--primary)]">{data.orderId}</div>
                </div>
                <div className="text-right">
                  <span className="text-[9px] uppercase font-extrabold text-zinc-400 dark:text-zinc-500">Delay Duration</span>
                  <div className="text-sm font-black text-rose-500 flex items-center justify-end gap-1">
                    <Clock size={12} />
                    <span>{data.delayDuration} Mins</span>
                  </div>
                </div>
              </div>

              {/* Timeline UI */}
              <div className="relative pl-5 border-l-2 border-zinc-100 dark:border-zinc-800 space-y-6 py-2 ml-2">
                {/* Delay Stage */}
                <div className="relative">
                  <div className="absolute -left-[27px] top-0 w-3.5 h-3.5 rounded-full bg-rose-500 border-2 border-white dark:border-zinc-900 flex items-center justify-center shadow-sm">
                    <ShieldAlert size={8} className="text-white" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
                      Identified Bottleneck
                    </h4>
                    <p className="text-[11px] text-zinc-550 dark:text-zinc-455 font-bold mt-0.5">
                      Responsible: <span className="text-amber-600 font-extrabold">{data.responsibleStation}</span>
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed bg-neutral-50 dark:bg-zinc-950 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-850">
                      {data.reason}
                    </p>
                  </div>
                </div>

                {/* Resolution Stage */}
                <div className="relative">
                  <div className="absolute -left-[27px] top-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900 flex items-center justify-center shadow-sm">
                    <CheckCircle2 size={8} className="text-white" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
                      Action Taken & Resolution
                    </h4>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed bg-neutral-50 dark:bg-zinc-950 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-850">
                      {data.resolution}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-zinc-100 dark:border-zinc-850 bg-neutral-50/40 dark:bg-zinc-950/20">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-bold rounded-full text-xs active:scale-95 transition-all cursor-pointer"
          >
            Acknowledge
          </button>
        </div>

      </div>
    </div>
  );
}
