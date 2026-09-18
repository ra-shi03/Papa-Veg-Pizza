import React from "react"
import { X, AlertTriangle, FileText, Calendar } from "lucide-react"

export default function ViewFeedbackModal({ isOpen, onClose, approval }) {
  if (!isOpen || !approval) return null

  const isRejected = approval.status === "Rejected";
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden scale-in duration-200">
        
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-850 ${isRejected ? 'bg-rose-50/50 dark:bg-rose-950/10' : 'bg-purple-50/50 dark:bg-purple-950/10'}`}>
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${isRejected ? 'bg-red-100 dark:bg-red-950/30 text-red-650' : 'bg-purple-100 dark:bg-purple-950/30 text-purple-650'}`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {isRejected ? "Rejection Details" : "Changes Requested"}
              </h3>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">Request: {approval._id}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-605 transition-colors"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          
          {isRejected ? (
            <>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider mb-1">
                  Reason for Rejection
                </label>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-900 dark:text-white">
                  {approval.rejectionReason || "Not provided"}
                </div>
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider mb-1">
                  Detailed Notes
                </label>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-700 dark:text-slate-300 min-h-[80px]">
                  {approval.rejectionNotes || "No additional comments."}
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Instructions
                </label>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-700 dark:text-slate-300 min-h-[80px]">
                  {approval.changesInstructions || "No instructions provided."}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Internal Log Note
                </label>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-700 dark:text-slate-300 min-h-[80px]">
                  {approval.changesNotes || "No internal notes provided."}
                </div>
              </div>

              {approval.changesDeadline && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Deadline
                  </label>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-900 dark:text-white">
                    {new Date(approval.changesDeadline).toLocaleDateString()}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Buttons Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-50 dark:border-slate-850">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 rounded-xl shadow-md transition-all"
            >
              Close
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
