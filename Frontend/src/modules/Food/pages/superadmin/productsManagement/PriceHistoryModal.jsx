import React from "react";
import { X, History, User, Calendar, Tag, ArrowRight } from "lucide-react";

export default function PriceHistoryModal({ isOpen, onClose, rule }) {
  if (!isOpen || !rule) return null;

  // Mock pricing history audit trail using Indian names and rupees
  const historyLogs = [
    {
      id: "H01",
      prevBasePrice: rule.basePrice,
      prevEffectivePrice: Math.round(rule.effectivePrice * 1.05),
      changedBy: "Admin Shubh",
      changedAt: "15 Jun 2026, 02:30 PM",
      reason: "Revised zone promotion margin adjustments",
      effectiveFrom: "15 Jun 2026",
      effectiveTo: "30 Jun 2026"
    },
    {
      id: "H02",
      prevBasePrice: Math.round(rule.basePrice * 0.95),
      prevEffectivePrice: Math.round(rule.effectivePrice * 0.95),
      changedBy: "Manager Amit",
      changedAt: "01 Jun 2026, 11:15 AM",
      reason: "Summer holiday season discount initiation",
      effectiveFrom: "01 Jun 2026",
      effectiveTo: "14 Jun 2026"
    },
    {
      id: "H03",
      prevBasePrice: Math.round(rule.basePrice * 0.95),
      prevEffectivePrice: Math.round(rule.basePrice * 0.95),
      changedBy: "System Setup",
      changedAt: "10 May 2026, 09:00 AM",
      reason: "Base pricing rules definition",
      effectiveFrom: "10 May 2026",
      effectiveTo: "31 May 2026"
    }
  ];

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] text-zinc-900 dark:text-zinc-100 select-none">
        
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2">
            <History size={16} className="text-[var(--primary)]" />
            <div>
              <h3 className="text-xs font-bold font-mono text-zinc-500 uppercase tracking-wider">Audit Log</h3>
              <h2 className="text-sm font-black text-black dark:text-white mt-0.5">Price Evolution History</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-150 dark:hover:bg-zinc-850 rounded-full transition-colors text-zinc-400"
          >
            <X size={16} />
          </button>
        </div>

        {/* Info Card */}
        <div className="p-4 bg-zinc-50/50 dark:bg-zinc-950/20 border-b border-zinc-150 dark:border-zinc-850 flex flex-wrap gap-4 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <div className="w-6.5 h-6.5 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center shrink-0">
              <Tag size={12} />
            </div>
            <div>
              <span className="text-[10px] text-zinc-400 block font-bold">PRODUCT & VARIANT</span>
              <span className="text-zinc-800 dark:text-zinc-200">{rule.productName} ({rule.variant})</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-6.5 h-6.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              ₹
            </div>
            <div>
              <span className="text-[10px] text-zinc-400 block font-bold">CURRENT PRICE</span>
              <span className="text-zinc-800 dark:text-zinc-200">₹{rule.effectivePrice} <span className="text-[10px] text-zinc-400 font-normal line-through">₹{rule.basePrice}</span></span>
            </div>
          </div>

          {rule.storeId && (
            <div className="flex items-center gap-2">
              <div className="w-6.5 h-6.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                🏪
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 block font-bold">SCOPE OUTLET</span>
                <span className="text-zinc-800 dark:text-zinc-200">{rule.storeId}</span>
              </div>
            </div>
          )}
        </div>

        {/* History Table */}
        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
          <div className="border border-zinc-150 dark:border-zinc-800 rounded-xl overflow-hidden shadow-inner">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-zinc-50 dark:bg-zinc-950 text-zinc-500 font-bold border-b border-zinc-200 dark:border-zinc-850">
                <tr>
                  <th className="px-3 py-2">Effective Period</th>
                  <th className="px-3 py-2 text-right">Base Price</th>
                  <th className="px-3 py-2 text-right">Override Price</th>
                  <th className="px-3 py-2">Updated By</th>
                  <th className="px-3 py-2">Reason for Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850">
                {/* Current Active State */}
                <tr className="bg-[var(--primary)]/5 font-semibold">
                  <td className="px-3 py-2.5">
                    <span className="text-[10px] font-bold text-[var(--primary)] block">Current Active</span>
                    <span className="text-[10px] text-zinc-700 dark:text-zinc-350">{rule.validFrom} <span className="font-normal opacity-60">to</span> {rule.validTo}</span>
                  </td>
                  <td className="px-3 py-2.5 text-right text-zinc-800 dark:text-zinc-200">₹{rule.basePrice}</td>
                  <td className="px-3 py-2.5 text-right text-emerald-600 dark:text-emerald-400">₹{rule.effectivePrice}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-350">
                      <User size={10} className="text-zinc-450" />
                      <span>Admin Shubh</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-zinc-650 dark:text-zinc-400 text-[10px] italic">Active default rule configuration</td>
                </tr>

                {/* Historical records */}
                {historyLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10">
                    <td className="px-3 py-2.5">
                      <span className="text-[10px] text-zinc-500 font-medium">{log.effectiveFrom} to {log.effectiveTo}</span>
                    </td>
                    <td className="px-3 py-2.5 text-right text-zinc-600 dark:text-zinc-405 font-mono">₹{log.prevBasePrice}</td>
                    <td className="px-3 py-2.5 text-right text-zinc-600 dark:text-zinc-405 font-mono">₹{log.prevEffectivePrice}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5 text-zinc-500">
                        <User size={10} className="opacity-60" />
                        <span className="text-[10px] font-semibold">{log.changedBy}</span>
                      </div>
                      <span className="text-[8px] text-zinc-400 block mt-0.5">{log.changedAt}</span>
                    </td>
                    <td className="px-3 py-2.5 text-zinc-500 text-[10px] italic leading-relaxed">{log.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-900/60 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-750 text-white font-bold text-xs rounded-lg shadow-md transition-all active:scale-95 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
