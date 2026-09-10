import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, Lock, ChevronDown, CheckCircle, Loader2 } from "lucide-react";

export default function ChangeShiftModal({ isOpen, onClose, staff, onConfirm }) {
  const [newShift, setNewShift] = useState("");
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Default values
  const currentShift = staff?.shift || "Morning";
  
  // Format current shift
  const currentShiftText = currentShift === "Morning" ? "Morning Shift (06:00 AM - 02:00 PM)" :
                           currentShift === "Evening" ? "Evening Shift (02:00 PM - 10:00 PM)" :
                           "Night Shift (10:00 PM - 06:00 AM)";

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newShift) return;

    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      onConfirm(staff, newShift, effectiveDate, reason);
    }, 800);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-zinc-950/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-zinc-900 w-full max-w-[480px] rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden pointer-events-auto"
            >
              {/* Modal Header */}
              <div className="px-4 pt-3.5 pb-2.5 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">Change Shift</h2>
                  <button
                    onClick={onClose}
                    className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-500 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-1">
                  Update the work schedule for {staff?.name} ({staff?.id}).
                </p>
              </div>

              {/* Modal Body */}
              <div className="px-4 py-3 space-y-4">
                {/* Current Shift (Read-only) */}
                <div>
                  <label className="block text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Current Shift</label>
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-lg opacity-70 cursor-not-allowed">
                    <Clock size={15} className="text-zinc-500" />
                    <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{currentShiftText}</span>
                    <Lock size={13} className="ml-auto text-zinc-400" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* New Shift Dropdown */}
                  <div>
                    <label className="block text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">New Shift</label>
                    <div className="relative">
                      <select
                        value={newShift}
                        onChange={(e) => setNewShift(e.target.value)}
                        className="w-full appearance-none bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all cursor-pointer"
                      >
                        <option value="" disabled>Select Shift</option>
                        <option value="Morning">Morning Shift</option>
                        <option value="Evening">Evening Shift</option>
                        <option value="Night">Night Shift</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Effective Date */}
                  <div>
                    <label className="block text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Effective Date</label>
                    <div className="relative">
                      <input
                        type="date"
                        value={effectiveDate}
                        onChange={(e) => setEffectiveDate(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all cursor-text [color-scheme:light] dark:[color-scheme:dark]"
                      />
                    </div>
                  </div>
                </div>

                {/* Reason for Change */}
                <div>
                  <label className="block text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Reason for Change</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Enter administrative notes regarding this schedule adjustment..."
                    rows="2"
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-3 py-2 rounded-lg text-xs font-semibold text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all resize-none"
                  ></textarea>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-end gap-2">
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="w-full sm:w-auto px-4 py-1.5 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isLoading || !newShift}
                  className="w-full sm:w-auto px-4 py-1.5 text-xs font-bold text-white bg-[var(--primary)] hover:bg-[var(--primary)]/90 rounded-lg shadow-md shadow-[var(--primary)]/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={14} />
                      Confirm Shift Change
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
