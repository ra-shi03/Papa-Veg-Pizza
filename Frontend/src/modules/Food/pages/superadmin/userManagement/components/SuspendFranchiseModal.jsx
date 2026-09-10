import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Trash2 } from "lucide-react"

export default function SuspendFranchiseModal({ isOpen, onClose, admin, onConfirm }) {
  const [reason, setReason] = useState("Violation of terms")
  const [notes, setNotes] = useState("")

  const reasons = [
    "Violation of terms",
    "Closed permanently",
    "Contract terminated",
    "Data cleanup",
    "Other"
  ]

  const handleConfirm = () => {
    onConfirm(admin.id, { reason, notes })
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && admin && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
          />

          <div className="fixed inset-0 flex items-center justify-center p-4 z-[105]">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.35 }}
              className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-3.5 pointer-events-auto relative"
            >
              <div className="w-9 h-9 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mb-3">
                <Trash2 size={16} className="stroke-[2.5]" />
              </div>

              <div className="mb-4">
                <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-50 leading-tight">
                  Delete Franchise Account
                </h3>
                <p className="text-zinc-400 dark:text-zinc-500 font-semibold text-[10px] mt-1 leading-normal">
                  Are you sure you want to permanently delete <strong className="text-zinc-800 dark:text-zinc-200">{admin.name}</strong> ({admin.franchiseName})? This operation will remove all data associated with this franchise and cannot be undone.
                </p>
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1">Primary Reason</label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full text-xs px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all cursor-pointer"
                  >
                    {reasons.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1">Additional Notes (Internal)</label>
                  <textarea
                    rows="2"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Provide specific notes regarding why the account is deleted..."
                    className="w-full text-xs p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  onClick={onClose}
                  className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 font-bold text-xs text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex items-center gap-2 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold shadow-md shadow-rose-600/20 transition-all hover:scale-[1.02] cursor-pointer"
                >
                  <Trash2 size={12} className="stroke-[2.5]" />
                  <span>Delete Account</span>
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
