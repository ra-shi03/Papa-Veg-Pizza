import React, { useState, useEffect } from "react"
import { X, Copy, ArrowRight, Clock, AlertTriangle, ShieldCheck, Check } from "lucide-react"
import { adminAPI } from "@food/api"

const daysOfWeek = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

export default function CopyTimingsModal({ isOpen, onClose, store, stores = [], onSaveSuccess }) {
  const [sourceStoreId, setSourceStoreId] = useState("")
  const [sourceSchedule, setSourceSchedule] = useState(null)
  const [destSchedule, setDestSchedule] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  // Filter out the current destination store from the source options
  const sourceOptions = stores.filter(s => (s._id || s.storeId) !== (store?._id || store?.storeId))

  useEffect(() => {
    if (isOpen && store) {
      setSourceStoreId("")
      setSourceSchedule(null)
      setDestSchedule(null)
      setError(null)
      setSuccess(false)
      
      // Load destination store schedule
      const destId = store.storeId || store._id
      adminAPI.getStoreOperatingHours(destId)
        .then(res => {
          setDestSchedule(res?.data?.data || null)
        })
        .catch(() => {})
    }
  }, [isOpen, store])

  // Fetch source schedule when selected
  useEffect(() => {
    if (sourceStoreId) {
      setLoading(true)
      setError(null)
      adminAPI.getStoreOperatingHours(sourceStoreId)
        .then(res => {
          setSourceSchedule(res?.data?.data || null)
        })
        .catch(() => {
          setError("Failed to fetch source store operating hours.")
          setSourceSchedule(null)
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      setSourceSchedule(null)
    }
  }, [sourceStoreId])

  if (!isOpen || !store) return null

  const handleCopy = async () => {
    if (!sourceStoreId) return
    setLoading(true)
    setError(null)
    try {
      const destId = store.storeId || store._id
      await adminAPI.copyStoreOperatingHours({
        sourceStoreId: sourceStoreId,
        destStoreId: destId
      })
      setSuccess(true)
      setTimeout(() => {
        if (onSaveSuccess) onSaveSuccess()
        onClose()
      }, 1000)
    } catch (err) {
      setError("Failed to copy operating hours. Please retry.")
    } finally {
      setLoading(false)
    }
  }

  const renderDaySchedule = (dayData) => {
    if (!dayData) return "N/A"
    if (dayData.isClosed) return <span className="text-slate-400 dark:text-slate-500 font-medium">Closed</span>
    if (dayData.open === "12:00 AM" && dayData.close === "12:00 AM") return <span className="text-emerald-600 dark:text-emerald-500 font-bold">24 Hours</span>
    return <span>{dayData.open} - {dayData.close}</span>
  }

  return (
    <div className="fixed inset-0 lg:left-[280px] z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-950 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden transition-all scale-in duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-655 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-850">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Copy Operating Hours</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Replicate weekly timings from another store to <span className="font-semibold text-primary">{store.storeName}</span>
          </p>
        </div>

        {/* Form Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-xl text-xs text-rose-650 font-semibold">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl text-xs text-emerald-650 font-bold flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Timings copied successfully! Refreshing...</span>
            </div>
          )}

          {/* Select Source Dropdown */}
          <div className="max-w-md">
            <label className="block text-[10px] font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider mb-2">
              Select Source Store (Copy From)
            </label>
            <select
              value={sourceStoreId}
              onChange={(e) => setSourceStoreId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all"
            >
              <option value="">-- Choose Store --</option>
              {sourceOptions.map((s) => (
                <option key={s._id} value={s.storeId || s._id}>
                  {s.storeName} ({s.storeCode || s.storeId})
                </option>
              ))}
            </select>
          </div>

          {/* Side-by-Side Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Source Store Preview */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-850 rounded-xl">
              <h4 className="text-[10px] uppercase font-bold tracking-wider text-slate-450 dark:text-slate-500 mb-3">
                Source Store {sourceStoreId ? "" : "(Select Above)"}
              </h4>
              
              {loading && (
                <div className="text-center py-10 text-xs text-slate-400">Fetching timings...</div>
              )}

              {!loading && !sourceSchedule && (
                <div className="text-center py-10 text-xs text-slate-400 italic">
                  Select a store to preview schedule
                </div>
              )}

              {!loading && sourceSchedule && (
                <div className="space-y-2.5 text-xs">
                  {daysOfWeek.map(day => (
                    <div key={day} className="flex justify-between border-b border-slate-100 dark:border-slate-850/50 pb-1.5 last:border-0 last:pb-0">
                      <span className="capitalize text-slate-550 dark:text-slate-450">{day}</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {renderDaySchedule(sourceSchedule[day])}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Destination Store Preview */}
            <div className="p-4 bg-amber-500/[0.02] dark:bg-amber-500/[0.02] border border-primary/20 rounded-xl">
              <h4 className="text-[10px] uppercase font-bold tracking-wider text-primary mb-3">
                Destination Store (Current Timings)
              </h4>

              {destSchedule ? (
                <div className="space-y-2.5 text-xs">
                  {daysOfWeek.map(day => (
                    <div key={day} className="flex justify-between border-b border-slate-100 dark:border-slate-850/50 pb-1.5 last:border-0 last:pb-0">
                      <span className="capitalize text-slate-550 dark:text-slate-450">{day}</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {renderDaySchedule(destSchedule[day])}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-xs text-slate-400">Loading current timings...</div>
              )}
            </div>

          </div>

          <div className="flex gap-2.5 p-3.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-xl text-amber-700 dark:text-amber-500 text-[11px]">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Important Notice:</span>
              <p className="mt-0.5">
                Copying will overwrite all existing weekly opening and closing schedules. Holiday schedules and temporary closures will NOT be copied.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-850 bg-slate-50 dark:bg-slate-950/10 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-655 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleCopy}
            disabled={loading || !sourceStoreId || success}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-hover shadow-lg transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <Copy className="w-3.5 h-3.5" />
            Copy and Overwrite
          </button>
        </div>
      </div>
    </div>
  )
}
