import React, { useEffect } from "react";
import { X, Trash2, ShieldAlert, User, DollarSign, Calendar, Loader2 } from "lucide-react";
import { useWasteAnalysis } from "../hooks/useWasteAnalysis";

const formatINR = (num) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
};

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

export default function WasteAnalysisModal({ isOpen, onClose, wasteId }) {
  const { data, isLoading, isError } = useWasteAnalysis(wasteId);

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
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <Trash2 size={16} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                Food Waste Analysis
              </h2>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold mt-0.5">
                Ingredients waste audit
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
        <div className="p-6 space-y-4">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2">
              <Loader2 className="animate-spin text-rose-500" size={24} />
              <span className="text-xs font-bold text-zinc-400">Loading waste audit...</span>
            </div>
          ) : isError || !data ? (
            <div className="py-8 text-center text-zinc-450 dark:text-zinc-500 font-bold text-xs">
              No Waste Audit Data found.
            </div>
          ) : (
            <div className="space-y-4.5">
              {/* Ingredient and Cost Card */}
              <div className="p-4 bg-rose-50/20 dark:bg-rose-950/10 border border-rose-100/30 dark:border-rose-900/10 rounded-2xl flex justify-between items-center">
                <div>
                  <span className="text-[9px] uppercase font-extrabold text-zinc-400 dark:text-zinc-500">Ingredient Wasted</span>
                  <div className="text-sm font-black text-zinc-800 dark:text-white">{data.ingredient}</div>
                </div>
                <div className="text-right">
                  <span className="text-[9px] uppercase font-extrabold text-zinc-400 dark:text-zinc-500">Waste Cost</span>
                  <div className="text-sm font-black text-rose-500">{formatINR(data.cost)}</div>
                </div>
              </div>

              {/* Log Details */}
              <div className="space-y-3.5 text-xs font-semibold">
                {/* Quantity */}
                <div className="flex justify-between items-center py-2 border-b border-zinc-50 dark:border-zinc-850">
                  <span className="text-zinc-400 dark:text-zinc-500 font-bold">Quantity Discarded</span>
                  <span className="text-zinc-800 dark:text-white font-extrabold">{data.quantityWasted}</span>
                </div>

                {/* Responsible Staff Profile Badge */}
                <div className="flex justify-between items-center py-2 border-b border-zinc-50 dark:border-zinc-850">
                  <span className="text-zinc-400 dark:text-zinc-500 font-bold">Responsible Staff</span>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-55 bg-neutral-50 dark:bg-zinc-850 border rounded-full">
                    <User size={11} className="text-[var(--primary)]" />
                    <span className="text-[11px] font-black text-zinc-800 dark:text-white">{data.responsibleStaff}</span>
                  </div>
                </div>

                {/* Logged Date */}
                <div className="flex justify-between items-center py-2 border-b border-zinc-50 dark:border-zinc-850">
                  <span className="text-zinc-400 dark:text-zinc-500 font-bold">Logged Date & Time</span>
                  <span className="text-zinc-500 flex items-center gap-1">
                    <Calendar size={11} />
                    <span>{formatDate(data.createdAt)}</span>
                  </span>
                </div>

                {/* Reason description */}
                <div className="flex flex-col gap-1.5 pt-1">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500">Reason for Waste</span>
                  <p className="text-zinc-600 dark:text-zinc-400 bg-neutral-55/30 dark:bg-zinc-950/20 p-3 rounded-2xl border border-zinc-100 dark:border-zinc-850 leading-relaxed">
                    {data.reason}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-zinc-100 dark:border-zinc-850 shrink-0 bg-neutral-50/40 dark:bg-zinc-950/20">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-bold rounded-full text-xs active:scale-95 transition-all cursor-pointer"
          >
            Close Audit
          </button>
        </div>

      </div>
    </div>
  );
}
