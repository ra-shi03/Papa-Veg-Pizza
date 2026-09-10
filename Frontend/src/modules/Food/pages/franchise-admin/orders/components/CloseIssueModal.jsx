import React, { useState, useEffect } from "react";
import { X, CheckSquare, Info, AlertTriangle } from "lucide-react";
import { useCloseIssue } from "../ordersQuery";

export default function CloseIssueModal({ isOpen, onClose, issue }) {
  const { mutateAsync: closeIssue, isLoading } = useCloseIssue();

  const [closureRemarks, setClosureRemarks] = useState("");
  const [resolutionVerified, setResolutionVerified] = useState(true);
  const [customerConfirmed, setCustomerConfirmed] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (issue) {
      setClosureRemarks("");
      setResolutionVerified(true);
      setCustomerConfirmed(true);
      setError("");
    }
  }, [issue, isOpen]);

  if (!isOpen || !issue) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!closureRemarks.trim()) {
      setError("Please provide final closure notes to close the ticket");
      return;
    }

    if (!resolutionVerified) {
      setError("You must verify that the resolution has been successfully processed");
      return;
    }

    try {
      await closeIssue({
        issueId: issue.issueNumber,
        closureRemarks,
        resolutionVerified,
        customerConfirmed,
      });
      onClose();
    } catch (err) {
      setError(err.message || "Failed to close ticket");
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/55 backdrop-blur-xs transition-opacity duration-300 animate-fade-in"
        onClick={onClose}
      />

      {/* Center Wrapper shifted to prevent sidebar overlap */}
      <div className="fixed inset-0 lg:left-[280px] flex items-center justify-center p-4 z-10 pointer-events-none">
        
        {/* Modal Container: 600px Max Width */}
        <form 
          onSubmit={handleSubmit}
          className="relative w-full max-w-[600px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto animate-scale-up text-xs font-medium text-zinc-700 dark:text-zinc-300"
        >
          {/* Header */}
          <header className="p-4 border-b border-zinc-150 dark:border-zinc-850 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/30">
            <div className="flex items-center gap-2">
              <CheckSquare className="text-zinc-900 dark:text-white" size={18} />
              <div>
                <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                  Close Dispute / Archive Ticket
                </h3>
                <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">
                  Confirm absolute completion parameters for issue {issue.issueNumber}
                </p>
              </div>
            </div>
            <button 
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </header>

          {/* Form Content */}
          <div className="p-5 space-y-4 overflow-y-auto max-h-[70vh] scrollbar-thin">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 rounded-xl text-red-600 text-[11px] font-bold flex items-start gap-2">
                <Info size={14} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Quick Context Summary */}
            <div className="p-3 bg-amber-50/20 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/20 rounded-xl space-y-2 text-amber-705 dark:text-amber-400">
              <div className="flex gap-2">
                <AlertTriangle size={15} className="shrink-0 mt-0.5 text-amber-500" />
                <div className="space-y-0.5 font-bold">
                  <p>Checklist before archiving ticket:</p>
                  <p className="text-[9.5px] font-medium leading-relaxed">
                    Once marked Closed, the ticket becomes read-only and is moved to historical archives. Ensure refund settlements or discount coupon codes have been successfully transmitted.
                  </p>
                </div>
              </div>
            </div>

            {/* Closure Remarks */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wide block">
                Archival Closure remarks
              </label>
              <textarea
                value={closureRemarks}
                onChange={(e) => setClosureRemarks(e.target.value)}
                rows={3.5}
                className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-800 dark:text-zinc-250 placeholder-zinc-450 focus:outline-none focus:border-[var(--primary)] transition-all font-semibold"
                placeholder="State final review notes, customer feedback response, or fleet operations check results..."
                required
              />
            </div>

            {/* Verification Checkboxes */}
            <div className="space-y-2.5">
              
              {/* Check 1 */}
              <label className="flex items-start gap-3 p-3 bg-zinc-50/50 dark:bg-zinc-900/20 border border-zinc-150 dark:border-zinc-850 rounded-xl cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={resolutionVerified}
                  onChange={(e) => setResolutionVerified(e.target.checked)}
                  className="mt-0.5 text-[var(--primary)] focus:ring-[var(--primary)] rounded border-zinc-300 w-4 h-4 cursor-pointer"
                />
                <div className="space-y-0.5">
                  <p className="font-extrabold text-[10px] text-zinc-850 dark:text-zinc-200">Resolution Verified</p>
                  <p className="text-[9px] text-zinc-450 font-semibold">I verify that compensation payouts or replacements have been dispatched correctly.</p>
                </div>
              </label>

              {/* Check 2 */}
              <label className="flex items-start gap-3 p-3 bg-zinc-50/50 dark:bg-zinc-900/20 border border-zinc-150 dark:border-zinc-850 rounded-xl cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={customerConfirmed}
                  onChange={(e) => setCustomerConfirmed(e.target.checked)}
                  className="mt-0.5 text-[var(--primary)] focus:ring-[var(--primary)] rounded border-zinc-300 w-4 h-4 cursor-pointer"
                />
                <div className="space-y-0.5">
                  <p className="font-extrabold text-[10px] text-zinc-855 dark:text-zinc-200">Customer Communication Complete</p>
                  <p className="text-[9px] text-zinc-450 font-semibold">Customer has been notified of dispute resolution terms and ticket closure.</p>
                </div>
              </label>

            </div>
          </div>

          {/* Footer Actions */}
          <footer className="p-4 border-t border-zinc-100 dark:border-zinc-850 flex justify-end gap-3 bg-zinc-50/30 dark:bg-zinc-900/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl transition-all active:scale-95 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 bg-zinc-900 hover:bg-zinc-850 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? "Processing..." : "Close Ticket"}
            </button>
          </footer>
        </form>

      </div>
    </div>
  );
}
