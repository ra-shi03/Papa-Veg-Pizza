import React, { useState, useEffect } from "react"
import { X, Calendar, AlertTriangle, ShieldAlert, CheckCircle, Power } from "lucide-react"
import { adminAPI } from "@food/api"

export default function TemporaryClosureModal({ isOpen, onClose, store, onSaveSuccess }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Close states
  const [reason, setReason] = useState("Maintenance")
  const [customReason, setCustomReason] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [comments, setComments] = useState("")

  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    if (isOpen && store) {
      setError(null)
      setShowConfirm(false)
      setReason("Maintenance")
      setCustomReason("")
      setComments("")
      
      // Default to today
      const todayStr = new Date().toISOString().split("T")[0]
      setStartDate(todayStr)
      setEndDate("")
    }
  }, [isOpen, store])

  if (!isOpen || !store) return null

  const isStoreCurrentlyOpen = store.isOpen

  const handlePreSubmit = (e) => {
    e.preventDefault()
    setShowConfirm(true)
  }

  const handleFinalSubmit = async () => {
    setLoading(true)
    setShowConfirm(false)
    try {
      const finalReason = reason === "Other" ? customReason : reason
      const payload = isStoreCurrentlyOpen
        ? {
            status: "Closed",
            isOpen: false,
            reason: finalReason,
            startDate,
            endDate: endDate || undefined,
            comments
          }
        : {
            status: "Active",
            isOpen: true,
            reason: "Reopened"
          }

      // Pass store._id or store.storeId depending on what was populated
      const id = store._id || store.storeId
      await adminAPI.updateStoreTemporaryClosure(id, payload)
      if (onSaveSuccess) onSaveSuccess()
      onClose()
    } catch (err) {
      setError("Failed to update store status. Please retry.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 lg:left-[280px] z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="relative w-full max-w-md bg-white dark:bg-slate-950 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-2xl p-6 transition-all">
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-655 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
            {isStoreCurrentlyOpen ? "Schedule Temporary Closure" : "Reopen Store"}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-450 mb-6">
            Store Name: <span className="font-semibold text-primary">{store.storeName}</span>
          </p>

          {error && (
            <div className="p-3 mb-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-xl text-xs text-rose-650 font-semibold">
              {error}
            </div>
          )}

          {isStoreCurrentlyOpen ? (
            /* CLOSURE FORM */
            <form onSubmit={handlePreSubmit} className="space-y-4">
              
              {/* Reason Dropdown */}
              <div>
                <label className="block text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-2">
                  Closure Reason *
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all"
                >
                  <option value="Maintenance">Maintenance & Servicing</option>
                  <option value="Festival">Festival / Holiday</option>
                  <option value="Power Issue">Power / Technical Issue</option>
                  <option value="Emergency">Emergency Closure</option>
                  <option value="Other">Other Reason</option>
                </select>
              </div>

              {/* Custom Reason for "Other" */}
              {reason === "Other" && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider mb-2">
                    Specify Reason *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter custom closure reason..."
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>
              )}

              {/* Date Ranges */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-950 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider mb-2">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-955 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Comments */}
              <div>
                <label className="block text-[10px] font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider mb-2">
                  Additional Comments
                </label>
                <textarea
                  rows={2}
                  placeholder="Describe details for kitchen/delivery crew..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all placeholder:text-slate-400"
                />
              </div>

              <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-xl text-amber-700 dark:text-amber-500 text-[11px]">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  This will override standard operating hours and mark the store as "Closed".
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-655 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-hover shadow-md transition-all"
                >
                  Confirm Closure
                </button>
              </div>
            </form>
          ) : (
            /* REOPEN FORM */
            <div className="space-y-5">
              <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl text-emerald-700 dark:text-emerald-500 text-xs">
                <Power className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-500" />
                <div>
                  <h4 className="font-bold">Reopen Store</h4>
                  <p className="text-[11px] mt-0.5 text-slate-550 dark:text-slate-400">
                    Are you ready to resume operations for {store.storeName}? This will restore standard weekly timings immediately.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-655 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFinalSubmit}
                  disabled={loading}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-650 hover:bg-emerald-700 shadow-md transition-all"
                >
                  Reopen Store
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog Overlay for Closure */}
      {showConfirm && isStoreCurrentlyOpen && (
        <div className="fixed inset-0 lg:left-[280px] z-55 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xl p-5">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-500 rounded-lg">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-950 dark:text-white text-sm">Are you sure?</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Closing this store will disable online ordering and mark it as offline starting from <span className="font-bold text-slate-700 dark:text-slate-200">{startDate}</span>.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-650 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850"
              >
                Go Back
              </button>
              <button
                onClick={handleFinalSubmit}
                disabled={loading}
                className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-primary hover:bg-primary-hover shadow-md"
              >
                Yes, Shut Store
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
