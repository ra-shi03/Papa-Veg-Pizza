import React, { useState, useEffect } from "react";
import { X, FileSpreadsheet, FileText, Download, Loader2 } from "lucide-react";
import { useExportStaffReport } from "../hooks/useExportStaffReport";

export default function ExportStaffReportModal({ isOpen, onClose, storeId }) {
  const exportMutation = useExportStaffReport();

  // Form parameters
  const [exportType, setExportType] = useState("PDF"); // PDF | Excel
  const [period, setPeriod] = useState("monthly"); // daily | weekly | monthly
  const [role, setRole] = useState("All");
  const [station, setStation] = useState("All");

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
        role,
        station
      },
      {
        onSuccess: () => {
          onClose();
        }
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
                Export Staff Performance
              </h2>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold mt-0.5">
                Generate offline productivity records
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
          {/* Format selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
              Choose Export File Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { type: "PDF", label: "PDF Document", icon: FileText },
                { type: "Excel", label: "Excel Sheet", icon: FileSpreadsheet }
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

          {/* Period selector */}
          <div className="flex flex-col gap-1.5 text-xs font-semibold">
            <label className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500">Performance Period</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full text-xs font-bold px-3 py-2 bg-neutral-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-800 dark:text-white outline-none focus:border-[var(--primary)] cursor-pointer"
            >
              <option value="daily">Daily Performance</option>
              <option value="weekly">Weekly Performance</option>
              <option value="monthly">Monthly Performance</option>
            </select>
          </div>

          {/* Filter options */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="flex flex-col gap-1.5 text-xs font-semibold">
              <label className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500">Staff Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full text-xs font-bold px-3 py-2 bg-neutral-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-800 dark:text-white outline-none focus:border-[var(--primary)] cursor-pointer"
              >
                <option value="All">All Roles</option>
                <option value="Chef">Chef</option>
                <option value="Kitchen Staff">Kitchen Staff</option>
                <option value="Cashier">Cashier</option>
                <option value="Store Manager">Store Manager</option>
                <option value="Delivery Rider">Delivery Rider</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5 text-xs font-semibold">
              <label className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500">Station</label>
              <select
                value={station}
                onChange={(e) => setStation(e.target.value)}
                className="w-full text-xs font-bold px-3 py-2 bg-neutral-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-800 dark:text-white outline-none focus:border-[var(--primary)] cursor-pointer"
              >
                <option value="All">All Stations</option>
                <option value="Pizza Station">Pizza Station</option>
                <option value="Baking Station">Baking Station</option>
                <option value="Packaging Station">Packaging Station</option>
                <option value="N/A">Not Applicable</option>
              </select>
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
              disabled={exportMutation.isPending}
              className="px-5 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold rounded-full text-xs active:scale-95 transition-all flex items-center gap-1.5 shadow-md shadow-[var(--primary)]/10 cursor-pointer disabled:opacity-70"
            >
              {exportMutation.isPending ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Generating...</span>
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
