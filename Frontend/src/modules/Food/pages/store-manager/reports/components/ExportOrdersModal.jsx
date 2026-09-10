import React, { useState, useEffect } from "react";
import { X, FileSpreadsheet, FileText, Download, Loader2 } from "lucide-react";
import { useExportOrders } from "../hooks/useExportOrders";

export default function ExportOrdersModal({ isOpen, onClose, storeId }) {
  const exportMutation = useExportOrders();

  const [exportType, setExportType] = useState("CSV"); // PDF | Excel | CSV
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  // Checkboxes for statuses
  const statusOptions = ["Completed", "Cancelled", "Refunded", "Pending", "Preparing", "Delivered"];
  const [statusFilters, setStatusFilters] = useState(["Completed", "Delivered"]);

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

  const handleCheckboxChange = (status) => {
    setStatusFilters(prev => {
      if (prev.includes(status)) {
        return prev.filter(s => s !== status);
      } else {
        return [...prev, status];
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    exportMutation.mutate(
      {
        storeId,
        exportType,
        startDate,
        endDate,
        statusFilters,
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
            <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center">
              <Download size={16} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                Export Orders Log
              </h2>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold mt-0.5">
                Generate offline audit reports
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Format Radio Selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
              Choose Export File Format
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { type: "PDF", icon: FileText },
                { type: "Excel", icon: FileSpreadsheet },
                { type: "CSV", icon: FileSpreadsheet }
              ].map((format) => {
                const Icon = format.icon;
                const isSelected = exportType === format.type;
                return (
                  <button
                    type="button"
                    key={format.type}
                    onClick={() => setExportType(format.type)}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? "border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)] shadow-sm"
                        : "border-zinc-200 dark:border-zinc-850 bg-neutral-50/50 dark:bg-zinc-950/30 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700"
                    }`}
                  >
                    <Icon size={18} className="mb-1" />
                    <span className="text-[11px] font-bold">{format.type}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date Picker Range */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="flex flex-col gap-1.5 text-xs font-semibold">
              <label className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500">From Date</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs font-bold px-3 py-2 bg-neutral-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-800 dark:text-white outline-none focus:border-[var(--primary)] transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5 text-xs font-semibold">
              <label className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500">To Date</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full text-xs font-bold px-3 py-2 bg-neutral-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-800 dark:text-white outline-none focus:border-[var(--primary)] transition-all"
              />
            </div>
          </div>

          {/* Checkbox Status Options */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
              Filter by Order Status
            </label>
            <div className="grid grid-cols-2 gap-3 p-3 bg-neutral-50/50 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-850 rounded-2xl">
              {statusOptions.map(option => (
                <label 
                  key={option} 
                  className="flex items-center gap-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    checked={statusFilters.includes(option)}
                    onChange={() => handleCheckboxChange(option)}
                    className="w-4 h-4 rounded text-[var(--primary)] focus:ring-[var(--primary)] accent-[var(--primary)]"
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-850 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={exportMutation.isPending}
              className="px-5 py-2.5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 font-bold rounded-full text-xs active:scale-95 transition-all cursor-pointer disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={exportMutation.isPending || statusFilters.length === 0}
              className="px-5 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold rounded-full text-xs active:scale-95 transition-all flex items-center gap-1.5 shadow-md shadow-[var(--primary)]/10 cursor-pointer disabled:opacity-75"
            >
              {exportMutation.isPending ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Download size={13} />
                  <span>Download Report</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
