import React, { useState, useEffect } from "react"
import { AlertCircle, ShieldAlert, X } from "lucide-react"

export default function StatusModal({ isOpen, onClose, onConfirm, store }) {
  const [status, setStatus] = useState("Active")
  const [reason, setReason] = useState("")
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    if (store) {
      setStatus(store.status || "Active")
      setReason("")
      setShowConfirm(false)
    }
  }, [store, isOpen])

  if (!isOpen || !store) return null

  const handlePreSubmit = (e) => {
    e.preventDefault()
    if (!reason.trim()) {
      alert("Please provide a reason for changing the status.")
      return
    }
    setShowConfirm(true)
  }

  const handleFinalSubmit = () => {
    onConfirm(store._id, status, reason)
    setShowConfirm(false)
  }

  return (
    <>
      {/* Main Status Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="relative w-full max-w-md bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xl p-6 transition-all">
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Change Status</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
            Update operational status for <span className="font-semibold">{store.storeName}</span>
          </p>

          <form onSubmit={handlePreSubmit} className="space-y-5">
            {/* Status Radio Buttons */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                Select Status
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: "Active", label: "Active", color: "border-emerald-500 text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20" },
                  { value: "Inactive", label: "Inactive", color: "border-amber-500 text-amber-600 bg-amber-50/50 dark:bg-amber-950/20" },
                  { value: "Closed", label: "Closed", color: "border-red-500 text-red-600 bg-red-50/50 dark:bg-red-950/20" }
                ].map((item) => {
                  const isChecked = status === item.value
                  return (
                    <label
                      key={item.value}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center cursor-pointer transition-all ${
                        isChecked
                          ? `${item.color} border-2 shadow-sm ring-1 ring-offset-0 ring-opacity-25`
                          : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      <input
                        type="radio"
                        name="storeStatus"
                        value={item.value}
                        checked={isChecked}
                        onChange={() => setStatus(item.value)}
                        className="sr-only"
                      />
                      <span className="text-sm font-semibold">{item.label}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Reason Textarea */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Reason for Change *
              </label>
              <textarea
                required
                rows={3}
                placeholder="Please enter the operational reason for this status change..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white transition-all shadow-md"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Confirmation Dialog Overlay */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xl p-5">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-500 rounded-lg">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-950 dark:text-white">Are you sure?</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Changing status to <span className="font-semibold text-slate-800 dark:text-slate-200">"{status}"</span> will take effect immediately.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850"
              >
                Go Back
              </button>
              <button
                onClick={handleFinalSubmit}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 shadow-md shadow-amber-500/10"
              >
                Yes, Update Status
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
