import React, { useState, useEffect } from "react";
import { X, Download, RefreshCw, Calendar, FileText } from "lucide-react";
import { useExportStoreReport } from "../hooks/useExportStoreReport";

export default function ExportStoreReportModal({ isOpen, onClose, storeId }) {
  const exportMutation = useExportStoreReport();

  const [exportType, setExportType] = useState("PDF");
  const [period, setPeriod] = useState("monthly");

  // Default dates
  const today = new Date().toISOString().split("T")[0];
  const defaultStart = new Date();
  defaultStart.setMonth(defaultStart.getMonth() - 1);
  const startStr = defaultStart.toISOString().split("T")[0];

  const [startDate, setStartDate] = useState(startStr);
  const [endDate, setEndDate] = useState(today);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    exportMutation.mutate(
      {
        storeId,
        exportType,
        period,
        startDate,
        endDate,
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center lg:pl-[280px] overflow-x-hidden overflow-y-auto outline-none transition-all">
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-zinc-900/60 dark:bg-zinc-950/80 backdrop-blur-sm transition-opacity"
      />

      <div className="relative w-full max-w-md mx-3 my-6 z-50 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-fade-down duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center">
              <Download size={16} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                Export Store Report
              </h2>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-555 font-bold mt-0.5">
                Generate and download operations dataset
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
          
          {/* Export Type Selection */}
          <div className="flex flex-col gap-1.5 text-xs font-semibold">
            <label className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500">File Format</label>
            <div className="grid grid-cols-3 gap-2">
              {["PDF", "Excel", "CSV"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setExportType(type)}
                  className={`py-2 px-3 border rounded-2xl text-xs font-bold transition-all cursor-pointer text-center ${
                    exportType === type
                      ? "border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)]"
                      : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Period Selection */}
          <div className="flex flex-col gap-1.5 text-xs font-semibold">
            <label className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500">Aggregation Period</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full text-xs font-bold px-3.5 py-2.5 bg-neutral-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-800 dark:text-white placeholder-zinc-450 outline-none focus:border-[var(--primary)] cursor-pointer"
            >
              <option value="monthly">Monthly Summary</option>
              <option value="quarterly">Quarterly Summary</option>
              <option value="yearly">Yearly Summary</option>
            </select>
          </div>

          {/* Date range picker */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5 text-xs font-semibold">
              <label className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-550 flex items-center gap-1">
                <Calendar size={10} />
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs font-bold px-3 py-2 bg-neutral-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-850 dark:text-white outline-none focus:border-[var(--primary)] transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5 text-xs font-semibold">
              <label className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-555 flex items-center gap-1">
                <Calendar size={10} />
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full text-xs font-bold px-3 py-2 bg-neutral-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-850 dark:text-white outline-none focus:border-[var(--primary)] transition-all"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={exportMutation.isPending || !startDate || !endDate}
              className="w-full py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] disabled:bg-zinc-300 dark:disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-bold rounded-2xl text-xs transition-all shadow-md shadow-[var(--primary)]/10 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 disabled:scale-100"
            >
              {exportMutation.isPending ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  <span>Compiling Export...</span>
                </>
              ) : (
                <>
                  <FileText size={13} />
                  <span>Generate & Download</span>
                </>
              )}
            </button>
          </div>

        </form>

        {/* Footer */}
        <div className="p-5 border-t border-zinc-100 dark:border-zinc-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-neutral-100 hover:bg-neutral-250 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-bold rounded-2xl text-xs transition-all cursor-pointer active:scale-95"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
}
