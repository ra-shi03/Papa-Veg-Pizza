import React, { useState, useEffect } from "react"
import { X, Clock, HelpCircle, Save, Calendar, CheckSquare, ShieldAlert } from "lucide-react"
import { adminAPI } from "@food/api"

const timeIntervals = [
  "12:00 AM", "12:30 AM", "01:00 AM", "01:30 AM", "02:00 AM", "02:30 AM",
  "03:00 AM", "03:30 AM", "04:00 AM", "04:30 AM", "05:00 AM", "05:30 AM",
  "06:00 AM", "06:30 AM", "07:00 AM", "07:30 AM", "08:00 AM", "08:30 AM",
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM",
  "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM",
  "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM", "08:00 PM", "08:30 PM",
  "09:00 PM", "09:30 PM", "10:00 PM", "10:30 PM", "11:00 PM", "11:30 PM"
]

const daysOfWeek = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

export default function EditHoursModal({ isOpen, onClose, store, onSaveSuccess }) {
  const [hours, setHours] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showConfirm, setShowConfirm] = useState(false)

  // Seed default structure or fetch existing
  useEffect(() => {
    if (isOpen && store?.storeId) {
      setLoading(true)
      setError(null)
      setShowConfirm(false)
      adminAPI.getStoreOperatingHours(store.storeId)
        .then((res) => {
          const data = res?.data?.data
          if (data) {
            const formatted = {}
            daysOfWeek.forEach(day => {
              formatted[day] = data[day] || { open: "09:00 AM", close: "10:00 PM", isClosed: false }
            })
            setHours(formatted)
          }
        })
        .catch(() => {
          // Fallback to default structure
          const fallback = {}
          daysOfWeek.forEach(day => {
            fallback[day] = { open: "09:00 AM", close: "10:00 PM", isClosed: false }
          })
          setHours(fallback)
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [isOpen, store])

  if (!isOpen || !store) return null

  const handleDayToggle = (day) => {
    setHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        isClosed: !prev[day].isClosed
      }
    }))
  }

  const handleTimeChange = (day, field, value) => {
    setHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }))
  }

  // Quick action: Copy Monday schedule to all days
  const handleApplyToAll = () => {
    const mondayConfig = hours.monday || { open: "09:00 AM", close: "10:00 PM", isClosed: false }
    const updated = {}
    daysOfWeek.forEach(day => {
      updated[day] = { ...mondayConfig }
    })
    setHours(updated)
  }

  // Quick action: 24/7
  const handleSet24x7 = () => {
    const updated = {}
    daysOfWeek.forEach(day => {
      updated[day] = { open: "12:00 AM", close: "12:00 AM", isClosed: false }
    })
    setHours(updated)
  }

  // Quick action: Close all
  const handleCloseAll = () => {
    const updated = {}
    daysOfWeek.forEach(day => {
      updated[day] = { ...hours[day], isClosed: true }
    })
    setHours(updated)
  }

  const handlePreSave = (e) => {
    e.preventDefault()
    setShowConfirm(true)
  }

  const handleFinalSave = async () => {
    setLoading(true)
    setShowConfirm(false)
    try {
      await adminAPI.updateStoreOperatingHours(store.storeId, hours)
      if (onSaveSuccess) onSaveSuccess()
      onClose()
    } catch (err) {
      setError("Failed to update operating hours. Please retry.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 lg:left-[280px] z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-slate-950 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden transition-all scale-in duration-200">
          
          {/* Close Header Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="p-5 border-b border-slate-100 dark:border-slate-850">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Edit Operating Hours</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Set standard weekly operational schedule for <span className="font-semibold text-primary">{store.storeName}</span>
            </p>
          </div>

          {/* Quick Actions Panel */}
          <div className="bg-slate-50 dark:bg-slate-950/40 px-5 py-3 border-b border-slate-100 dark:border-slate-850 flex flex-wrap gap-2 items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-450 dark:text-slate-500">
              Quick Shortcuts:
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleApplyToAll}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                title="Copy Monday's timing to all days"
              >
                Apply Monday to All
              </button>
              <button
                type="button"
                onClick={handleSet24x7}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-emerald-250 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-500 hover:bg-emerald-100/55 transition-colors"
              >
                Set 24x7 Hours
              </button>
              <button
                type="button"
                onClick={handleCloseAll}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-rose-250 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-555 hover:bg-rose-100/55 transition-colors"
              >
                Close Entire Week
              </button>
            </div>
          </div>

          {/* Form / Scroll Content */}
          <form onSubmit={handlePreSave} className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {loading && !showConfirm && (
                <div className="text-center py-10 text-xs text-slate-500 dark:text-slate-400">
                  Loading schedules...
                </div>
              )}

              {error && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-xl text-xs text-rose-650 font-semibold">
                  {error}
                </div>
              )}

              {!loading && Object.keys(hours).length > 0 && (
                <div className="space-y-3">
                  {daysOfWeek.map((day) => {
                    const dayConfig = hours[day] || { open: "09:00 AM", close: "10:00 PM", isClosed: false }
                    return (
                      <div
                        key={day}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border transition-all ${
                          dayConfig.isClosed
                            ? "bg-slate-50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-850 opacity-75"
                            : "bg-white dark:bg-slate-900 border-slate-150 dark:border-slate-800 shadow-2xs"
                        }`}
                      >
                        {/* Day & Checkbox toggle */}
                        <div className="flex items-center gap-3">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!dayConfig.isClosed}
                              onChange={() => handleDayToggle(day)}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                          </label>
                          <span className="text-xs font-bold capitalize text-slate-800 dark:text-slate-200 min-w-[80px]">
                            {day}
                          </span>
                        </div>

                        {/* Timing selectors */}
                        <div className="flex items-center gap-2 mt-3 sm:mt-0">
                          {dayConfig.isClosed ? (
                            <span className="text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider py-1.5 px-3 bg-slate-100 dark:bg-slate-900 rounded-lg">
                              Closed All Day
                            </span>
                          ) : (
                            <div className="flex items-center gap-2">
                              {/* Open Time Dropdown */}
                              <div>
                                <select
                                  value={dayConfig.open}
                                  onChange={(e) => handleTimeChange(day, "open", e.target.value)}
                                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all"
                                >
                                  {timeIntervals.map(t => (
                                    <option key={t} value={t}>{t}</option>
                                  ))}
                                </select>
                              </div>

                              <span className="text-slate-400 dark:text-slate-655 text-xs font-bold">to</span>

                              {/* Close Time Dropdown */}
                              <div>
                                <select
                                  value={dayConfig.close}
                                  onChange={(e) => handleTimeChange(day, "close", e.target.value)}
                                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all"
                                >
                                  {timeIntervals.map(t => (
                                    <option key={t} value={t}>{t}</option>
                                  ))}
                                </select>
                              </div>

                              {dayConfig.open === "12:00 AM" && dayConfig.close === "12:00 AM" && (
                                <span className="text-[10px] font-bold text-emerald-650 bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded border border-emerald-100 dark:border-emerald-900/30">
                                  24h
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-850 flex items-center justify-end gap-3 bg-slate-50 dark:bg-slate-950/10">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-655 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-hover shadow-lg transition-all flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                Save Schedule
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 lg:left-[280px] z-55 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xl p-5">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-500 rounded-lg">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-950 dark:text-white text-sm">Update standard timings?</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Are you sure you want to apply these operational hours to <span className="font-semibold text-slate-855 dark:text-slate-205">{store.storeName}</span>? This will modify the weekly schedule and log an audit trail entry.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850"
              >
                Go Back
              </button>
              <button
                onClick={handleFinalSave}
                disabled={loading}
                className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-primary hover:bg-primary-hover shadow-md"
              >
                Yes, Save Timings
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
