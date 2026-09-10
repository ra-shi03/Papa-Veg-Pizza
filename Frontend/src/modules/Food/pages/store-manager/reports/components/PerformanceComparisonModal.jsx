import React, { useState, useEffect } from "react";
import { X, Award, GitCompare, ChevronRight, Loader2 } from "lucide-react";
import { useStaffComparison } from "../hooks/useStaffComparison";
import { mockStaffPerformance } from "../mockData";

export default function PerformanceComparisonModal({ isOpen, onClose, defaultStaffId }) {
  // Set initial selected staff IDs
  const [staffAId, setStaffAId] = useState(defaultStaffId || "staff-1");
  const [staffBId, setStaffBId] = useState("staff-2");

  // Sync default selection if modal re-opens
  useEffect(() => {
    if (defaultStaffId) {
      setStaffAId(defaultStaffId);
      // Pick a different default for staff B
      const available = mockStaffPerformance.filter(s => s._id !== defaultStaffId);
      if (available.length > 0) {
        setStaffBId(available[0]._id);
      }
    }
  }, [defaultStaffId, isOpen]);

  // Fetch comparison data
  const { data, isLoading, isError } = useStaffComparison(staffAId, staffBId);

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
      <div className="relative w-full max-w-2xl mx-3 my-6 z-50 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-fade-down duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center">
              <GitCompare size={16} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                Staff Performance Matchup
              </h2>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold mt-0.5">
                Compare side-by-side employee metrics
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
        <div className="p-6 space-y-6">
          {/* Staff Selection Dropdowns */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5 text-xs font-semibold">
              <label className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500">Select Employee A</label>
              <select
                value={staffAId}
                onChange={(e) => setStaffAId(e.target.value)}
                className="w-full text-xs font-bold px-3 py-2 bg-neutral-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-800 dark:text-white outline-none focus:border-[var(--primary)] cursor-pointer"
              >
                {mockStaffPerformance.map(s => (
                  <option key={s._id} value={s._id} disabled={s._id === staffBId}>{s.name} ({s.role})</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5 text-xs font-semibold">
              <label className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500">Select Employee B</label>
              <select
                value={staffBId}
                onChange={(e) => setStaffBId(e.target.value)}
                className="w-full text-xs font-bold px-3 py-2 bg-neutral-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-800 dark:text-white outline-none focus:border-[var(--primary)] cursor-pointer"
              >
                {mockStaffPerformance.map(s => (
                  <option key={s._id} value={s._id} disabled={s._id === staffAId}>{s.name} ({s.role})</option>
                ))}
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2">
              <Loader2 className="animate-spin text-[var(--primary)]" size={28} />
              <span className="text-xs font-bold text-zinc-450">Calculating operational matchup...</span>
            </div>
          ) : isError || !data ? (
            <div className="py-12 text-center text-rose-500 font-bold text-xs">
              Failed to load performance matchup. Please select different employees.
            </div>
          ) : (
            <div className="space-y-5">
              {/* Matchup Header */}
              <div className="flex items-center justify-between p-4 bg-neutral-50/50 dark:bg-zinc-950/20 border rounded-2xl shrink-0">
                <div className="flex items-center gap-2.5 w-5/12 min-w-0">
                  <img 
                    src={data.staffA?.avatar} 
                    alt={data.staffA?.name} 
                    className="w-9 h-9 rounded-full object-cover"
                    onError={(e) => e.target.src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80&q=80"}
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-black text-slate-800 dark:text-white truncate">{data.staffA?.name}</div>
                    <div className="text-[9px] text-zinc-400 font-bold">{data.staffA?.role}</div>
                  </div>
                </div>

                <div className="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-550 border rounded-full px-2.5 py-0.5 shrink-0 bg-white dark:bg-zinc-900 shadow-sm">
                  VS
                </div>

                <div className="flex items-center justify-end gap-2.5 w-5/12 min-w-0 text-right">
                  <div className="min-w-0">
                    <div className="text-xs font-black text-slate-800 dark:text-white truncate">{data.staffB?.name}</div>
                    <div className="text-[9px] text-zinc-400 font-bold">{data.staffB?.role}</div>
                  </div>
                  <img 
                    src={data.staffB?.avatar} 
                    alt={data.staffB?.name} 
                    className="w-9 h-9 rounded-full object-cover"
                    onError={(e) => e.target.src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80&q=80"}
                  />
                </div>
              </div>

              {/* Comparison Ledger */}
              <div className="border border-zinc-150 dark:border-zinc-800 rounded-2xl overflow-hidden">
                <table className="min-w-full divide-y divide-zinc-100 dark:divide-zinc-800">
                  <thead className="bg-zinc-50/50 dark:bg-zinc-950/20 text-[9px] font-black uppercase text-zinc-400">
                    <tr>
                      <th className="px-4 py-2.5 text-left w-4/12">Performance Metric</th>
                      <th className="px-4 py-2.5 text-center w-4/12">Employee A</th>
                      <th className="px-4 py-2.5 text-center w-4/12">Employee B</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs font-extrabold text-zinc-800 dark:text-zinc-200">
                    {data.comparison?.map((row, idx) => {
                      const isWinnerA = row.winner === "staffA";
                      const isWinnerB = row.winner === "staffB";
                      return (
                        <tr key={idx} className="hover:bg-neutral-50/20 dark:hover:bg-zinc-950/10">
                          <td className="px-4 py-3 text-zinc-500 font-bold">{row.metric}</td>
                          <td className={`px-4 py-3 text-center transition-colors ${
                            isWinnerA ? "text-emerald-500 font-black bg-emerald-50/10" : ""
                          }`}>
                            <div className="flex items-center justify-center gap-1">
                              <span>{row.valA}</span>
                              {isWinnerA && <Award size={11} className="text-emerald-500 fill-emerald-500/20" />}
                            </div>
                          </td>
                          <td className={`px-4 py-3 text-center transition-colors ${
                            isWinnerB ? "text-emerald-500 font-black bg-emerald-50/10" : ""
                          }`}>
                            <div className="flex items-center justify-center gap-1">
                              <span>{row.valB}</span>
                              {isWinnerB && <Award size={11} className="text-emerald-500 fill-emerald-500/20" />}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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
            Done Comparing
          </button>
        </div>

      </div>
    </div>
  );
}
