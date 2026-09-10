import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle, ChevronDown, Loader2 } from "lucide-react"

export default function SuspendCustomerModal({ isOpen, onClose, customer, onSuspend }) {
  const [reason, setReason] = useState("")
  const [notes, setNotes] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  if (!isOpen || !customer) return null

  const handleSuspend = async () => {
    if (!reason) {
      alert("Please select a reason for suspension.")
      return
    }

    setIsProcessing(true)
    
    // Simulate API call delay
    setTimeout(() => {
      onSuspend(customer.id, reason, notes)
      setIsProcessing(false)
      onClose()
      setReason("")
      setNotes("")
    }, 1500)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Modal Scrim Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!isProcessing ? onClose : undefined}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[150] transition-opacity"
          />

          {/* Bottom Sheet Modal */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="fixed bottom-0 left-0 right-0 max-w-[400px] mx-auto bg-white dark:bg-zinc-900 rounded-t-2xl shadow-2xl z-[160] flex flex-col border-x border-t border-zinc-200 dark:border-zinc-800"
          >
            {/* Grab Handle */}
            <div className="w-10 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full mx-auto mt-2.5 mb-1.5" />

            <div className="px-4 pb-4 pt-1">
              {/* Header */}
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-lg bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center text-rose-600">
                  <AlertTriangle size={18} className="fill-rose-100 dark:fill-rose-900/50" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-rose-600 dark:text-rose-500">Suspend Account</h3>
                  <p className="text-[10px] font-semibold text-zinc-500">High-stakes admin action</p>
                </div>
              </div>

              {/* Warning Content */}
              <div className="bg-rose-50/50 dark:bg-rose-950/20 p-2.5 rounded-lg border border-rose-100 dark:border-rose-900/30 mb-4">
                <p className="text-xs font-medium text-zinc-850 dark:text-zinc-250 leading-relaxed">
                  Are you sure you want to suspend <strong className="text-zinc-900 dark:text-zinc-50">{customer.name}'s</strong> account? The customer will <strong className="text-rose-600">no longer be able to place orders</strong> or access their loyalty rewards.
                </p>
              </div>

              {/* Form */}
              <div className="space-y-3">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="reason" className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">
                    Reason for Suspension
                  </label>
                  <div className="relative">
                    <select
                      id="reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      disabled={isProcessing}
                      className="w-full h-8.5 pl-3 pr-8 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-lg appearance-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-xs font-medium text-zinc-900 dark:text-zinc-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option disabled value="">Select a reason...</option>
                      <option value="fraud">Fraudulent Activity</option>
                      <option value="cancellations">Repeated Cancellations</option>
                      <option value="tos">Terms of Service Violation</option>
                      <option value="other">Other</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400" />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="notes" className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">
                    Internal Admin Notes
                  </label>
                  <textarea
                    id="notes"
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={isProcessing}
                    placeholder="Provide additional context for the audit trail..."
                    className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-xs font-medium text-zinc-900 dark:text-zinc-50 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Footer Actions */}
              <div className="grid grid-cols-1 gap-2 mt-4">
                <button
                  onClick={handleSuspend}
                  disabled={isProcessing}
                  className="w-full h-8.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-extrabold active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-80 disabled:cursor-wait"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={14} />
                      Confirm Suspension
                    </>
                  )}
                </button>
                
                <button
                  onClick={onClose}
                  disabled={isProcessing}
                  className="w-full h-8.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-305 rounded-lg text-xs font-extrabold active:scale-[0.98] transition-all border border-zinc-200 dark:border-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
