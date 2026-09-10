import React, { useState } from "react"
import { X, AlertTriangle, ShieldAlert } from "lucide-react"

const REJECTION_REASONS = [
  "Incomplete Documents",
  "Invalid Information",
  "Manager Verification Failed",
  "Address Mismatch",
  "Other"
]

export default function RejectModal({ isOpen, onClose, onConfirm, approval }) {
  if (!isOpen || !approval) return null

  const [reason, setReason] = useState(REJECTION_REASONS[0])
  const [comments, setComments] = useState("")
  const [confirmed, setConfirmed] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const charLimit = 250

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!confirmed) {
      alert("Please check the confirmation box to proceed.")
      return
    }
    if (!comments.trim()) {
      alert("Comments are required for rejection.")
      return
    }

    try {
      setSubmitting(true)
      await onConfirm({
        reason,
        comments: comments.trim()
      })
      // Clear form
      setComments("")
      setConfirmed(false)
    } catch (_) {
      // Handled by parent toast
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden scale-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-850 bg-rose-50/50 dark:bg-rose-950/10">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-red-100 dark:bg-red-950/30 text-red-650 rounded-lg">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Reject Application</h3>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">Request: {approval._id}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-605 transition-colors"
            disabled={submitting}
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Info Banner */}
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 rounded-xl flex gap-2.5 text-xs text-amber-800 dark:text-amber-400">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              You are rejecting the store application for <strong>{approval.storeName}</strong>. This status will notify the submitter.
            </span>
          </div>

          {/* Reason Selection */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider mb-2">
              Rejection Reason *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              disabled={submitting}
            >
              {REJECTION_REASONS.map((r, i) => (
                <option key={i} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Detailed Comments Textarea */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">
                Detailed Comments *
              </label>
              <span className={`text-[10px] font-bold ${comments.length > charLimit ? "text-red-500" : "text-slate-400"}`}>
                {comments.length} / {charLimit}
              </span>
            </div>
            <textarea
              required
              rows={4}
              maxLength={charLimit}
              placeholder="Provide context or instructions on what details need correction..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all resize-none"
              disabled={submitting}
            />
          </div>

          {/* Confirmation Checkbox */}
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-red-650 focus:ring-red-500 cursor-pointer"
              disabled={submitting}
            />
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              I understand this action is final and cannot be undone.
            </span>
          </label>

          {/* Buttons Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-50 dark:border-slate-850">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl transition-colors"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !confirmed || !comments.trim()}
              className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {submitting ? "Rejecting..." : "Reject Store"}
            </button>
          </div>

        </form>

      </div>
    </div>
  )
}
