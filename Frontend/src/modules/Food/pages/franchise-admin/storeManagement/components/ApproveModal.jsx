import React, { useState } from "react"
import { X, Check, Building2, User, FileText, Download, Eye, AlertCircle } from "lucide-react"
import DocViewerModal from "./DocViewerModal"

export default function ApproveModal({ isOpen, onClose, onConfirm, approval }) {
  if (!isOpen || !approval) return null

  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState(null)

  const handleSubmit = async () => {
    try {
      setSubmitting(true)
      await onConfirm(notes.trim())
      setNotes("")
      setShowConfirm(false)
    } catch (_) {
      // Toast handles error
    } finally {
      setSubmitting(false)
    }
  }

  const handleDownloadDoc = (doc, e) => {
    e.stopPropagation()
    const link = document.createElement ? document.createElement("a") : window.document.createElement("a")
    link.href = doc.url
    link.download = doc.name || "document"
    link.target = "_blank"
    window.document.body.appendChild(link)
    link.click()
    window.document.body.removeChild(link)
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="relative w-full max-w-2xl bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden scale-in duration-200 flex flex-col max-h-[90vh]">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-850 bg-emerald-50/50 dark:bg-emerald-950/10">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-100 dark:bg-emerald-950/30 text-emerald-650 rounded-lg">
                <Check className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Approve Store Application</h3>
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

          {/* Form Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            
            {/* Section 1: Store Details */}
            <div className="space-y-2.5">
              <h4 className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                <Building2 className="w-4 h-4 text-primary" />
                Store Details
              </h4>
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl text-xs">
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Store Name</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{approval.storeName}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Store Code</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{approval.storeCode}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Store Type</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{approval.storeType}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Address</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block" title={`${approval.address?.line1}, ${approval.address?.city}`}>
                    {approval.address?.line1}, {approval.address?.city}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 2: Manager Details */}
            <div className="space-y-2.5">
              <h4 className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                <User className="w-4 h-4 text-primary" />
                Manager Details
              </h4>
              <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl text-xs">
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Manager Name</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{approval.managerName}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Phone</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{approval.phone}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Email</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">{approval.email}</span>
                </div>
              </div>
            </div>

            {/* Section 3: Uploaded Documents */}
            <div className="space-y-2.5">
              <h4 className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                <FileText className="w-4 h-4 text-primary" />
                Uploaded Documents
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {approval.documents?.map((doc, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border border-slate-150 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 hover:border-primary/45 transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-1.5 bg-slate-50 dark:bg-slate-850 rounded-lg text-slate-500">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{doc.type}</span>
                        <span className="block text-[9px] text-slate-400 truncate">{doc.name || "Document"}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setSelectedDoc(doc)}
                        className="p-1.5 text-slate-400 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="Preview File"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDownloadDoc(doc, e)}
                        className="p-1.5 text-slate-400 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="Download File"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 4: Approval Notes */}
            <div className="space-y-2.5">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Approval Notes (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Add audit notes, internal remarks, or configurations guidelines..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none animate-in fade-in"
              />
            </div>

          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-855 shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-850 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => setShowConfirm(true)}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all"
            >
              Approve Store
            </button>
          </div>

        </div>
      </div>

      {/* CONFIRMATION OVERLAY DIALOG */}
      {showConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xl p-6 space-y-4 scale-in duration-150">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 dark:bg-amber-950/20 text-amber-550 rounded-xl">
                <AlertCircle className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Confirm Approval</h4>
                <p className="text-xs text-slate-500 mt-0.5">Are you sure you want to approve this store?</p>
              </div>
            </div>
            <p className="text-xs text-slate-450 leading-relaxed bg-slate-50 dark:bg-slate-900/30 p-2.5 rounded-lg border border-slate-100 dark:border-slate-850">
              Approving this request will activate the store outlet configs. The store will immediately go live.
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-55 dark:hover:bg-slate-900 rounded-lg"
                disabled={submitting}
              >
                No, Back
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
                disabled={submitting}
              >
                {submitting ? "Approving..." : "Yes, Approve"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENT LIGHTBOX PREVIEW */}
      <DocViewerModal
        isOpen={!!selectedDoc}
        onClose={() => setSelectedDoc(null)}
        document={selectedDoc}
      />
    </>
  )
}
