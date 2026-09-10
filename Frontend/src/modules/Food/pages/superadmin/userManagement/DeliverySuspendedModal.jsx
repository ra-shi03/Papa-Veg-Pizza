import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, AlertTriangle, ChevronDown } from "lucide-react"

export default function DeliverySuspendedModal({ isOpen, onClose, rider, onConfirm }) {
  const [reason, setReason] = useState("")
  const [notes, setNotes] = useState("")

  // Reset form when modal opens/closes or rider changes
  useEffect(() => {
    if (isOpen) {
      setReason("")
      setNotes("")
    }
  }, [isOpen, rider])

  if (!rider) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!reason) {
      alert("Please select a reason for suspension.")
      return
    }
    onConfirm(rider, reason, notes)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[130]"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative w-full max-w-[400px] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden z-[131]"
          >
            <form onSubmit={handleSubmit}>
              {/* Modal Header & Icon */}
              <div className="p-4 text-center flex flex-col items-center space-y-2.5">
                <div className="w-12 h-12 bg-rose-500/10 dark:bg-rose-500/20 rounded-full flex items-center justify-center mb-1 shadow-sm">
                  <AlertTriangle className="text-rose-600 dark:text-rose-500" size={20} />
                </div>
                <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-50">
                  Suspend Delivery Partner
                </h3>
                <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 max-w-[280px] leading-relaxed">
                  You are about to suspend <span className="font-bold text-zinc-800 dark:text-zinc-100">{rider.name} (ID: {rider.id})</span>. This will immediately restrict their access to the delivery queue.
                </p>
              </div>

              {/* Form Content */}
              <div className="px-4 pb-4 space-y-3">
                {/* Reason Dropdown */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider" htmlFor="reason">
                    Reason for Suspension
                  </label>
                  <div className="relative">
                    <select
                      id="reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 font-semibold text-xs text-zinc-700 dark:text-zinc-300 focus:ring-2 focus:ring-[var(--primary)] outline-none appearance-none transition-all cursor-pointer"
                    >
                      <option value="" disabled>Select a reason...</option>
                      <option value="misconduct">Misconduct</option>
                      <option value="fraud">Fraud</option>
                      <option value="delays">Persistent Delays</option>
                      <option value="complaints">Customer Complaints</option>
                      <option value="policy">Policy Violation</option>
                    </select>
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                      <ChevronDown size={14} />
                    </span>
                  </div>
                </div>

                {/* Notes Textarea */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider" htmlFor="notes">
                    Internal Notes & Justification
                  </label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Provide detailed context for administrative review..."
                    rows="3"
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 font-medium text-xs text-zinc-800 dark:text-zinc-150 focus:ring-2 focus:ring-[var(--primary)] outline-none transition-all resize-none"
                  />
                </div>

                {/* Footer Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg font-bold text-xs text-zinc-700 dark:text-zinc-355 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-center order-2 sm:order-1 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-3 py-1.5 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white rounded-lg font-bold text-xs shadow-md shadow-[var(--primary)]/10 active:scale-[0.98] transition-all text-center order-1 sm:order-2 cursor-pointer"
                  >
                    Confirm Suspension
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
