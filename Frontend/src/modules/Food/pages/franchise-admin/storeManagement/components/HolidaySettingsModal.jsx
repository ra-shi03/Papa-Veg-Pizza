import React, { useState, useEffect } from "react"
import { X, Calendar, Plus, Trash2, Save, AlertCircle, Info, Clock } from "lucide-react"
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

export default function HolidaySettingsModal({ isOpen, onClose, store, onSaveSuccess }) {
  const [holidays, setHolidays] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // New holiday form state
  const [newDate, setNewDate] = useState("")
  const [newReason, setNewReason] = useState("")
  const [isClosed, setIsClosed] = useState(true)
  const [openTime, setOpenTime] = useState("10:00 AM")
  const [closeTime, setCloseTime] = useState("06:00 PM")

  useEffect(() => {
    if (isOpen && store?.storeId) {
      setLoading(true)
      setError(null)
      setNewDate("")
      setNewReason("")
      setIsClosed(true)
      
      adminAPI.getStoreOperatingHours(store.storeId)
        .then((res) => {
          setHolidays(res?.data?.data?.holidaySchedule || [])
        })
        .catch(() => {
          setHolidays([])
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [isOpen, store])

  if (!isOpen || !store) return null

  const handleAddHoliday = (e) => {
    e.preventDefault()
    if (!newDate || !newReason.trim()) return

    // Avoid duplicates
    if (holidays.some(h => h.date === newDate)) {
      alert("A holiday is already scheduled for this date.")
      return
    }

    const newItem = {
      date: newDate,
      reason: newReason.trim(),
      isClosed,
      ...(isClosed ? {} : { open: openTime, close: closeTime })
    }

    setHolidays(prev => [...prev, newItem].sort((a, b) => new Date(a.date) - new Date(b.date)))
    
    // Reset form fields
    setNewDate("")
    setNewReason("")
    setIsClosed(true)
  }

  const handleRemoveHoliday = (dateToRemove) => {
    setHolidays(prev => prev.filter(h => h.date !== dateToRemove))
  }

  const handleSaveHolidays = async () => {
    setLoading(true)
    setError(null)
    try {
      await adminAPI.updateStoreHolidays(store.storeId, { holidaySchedule: holidays })
      if (onSaveSuccess) onSaveSuccess()
      onClose()
    } catch (err) {
      setError("Failed to save holiday schedule. Please retry.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 lg:left-[280px] z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[85vh] bg-white dark:bg-slate-950 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden transition-all scale-in duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-655 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-850">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Holiday Settings</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure calendar closures and custom hours for <span className="font-semibold text-primary">{store.storeName}</span>
          </p>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-xl text-xs text-rose-650 font-semibold">
              {error}
            </div>
          )}

          {/* Form to add a holiday */}
          <form onSubmit={handleAddHoliday} className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-850 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              Add Scheduled Holiday
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-2">
                  Holiday Date *
                </label>
                <input
                  type="date"
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider mb-2">
                  Occasion Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Diwali, Holi..."
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Closure or Special Timings Option */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isClosed}
                  onChange={(e) => setIsClosed(e.target.checked)}
                  className="rounded border-slate-300 text-primary focus:ring-primary focus:ring-opacity-25"
                />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-350">
                  Close store completely all day
                </span>
              </label>

              {!isClosed && (
                <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-950 rounded-lg border border-slate-150 dark:border-slate-850 animate-in slide-in-from-top duration-200">
                  <div className="flex items-center gap-2 text-xs">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Special Hours:</span>
                    <select
                      value={openTime}
                      onChange={(e) => setOpenTime(e.target.value)}
                      className="px-2 py-1 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {timeIntervals.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <span className="text-slate-400">to</span>
                    <select
                      value={closeTime}
                      onChange={(e) => setCloseTime(e.target.value)}
                      className="px-2 py-1 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {timeIntervals.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!newDate || !newReason.trim()}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-slate-805 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-700 dark:hover:bg-white transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                Add to Schedule
              </button>
            </div>
          </form>

          {/* List of current holidays */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">
              Scheduled Calendar Dates ({holidays.length})
            </h4>

            {holidays.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 text-xs">
                No holidays or closures scheduled.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-850 border border-slate-100 dark:border-slate-850 rounded-xl overflow-hidden shadow-2xs">
                {holidays.map((h) => (
                  <div
                    key={h.date}
                    className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-900 hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {new Date(h.date).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric"
                          })}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                          ({h.reason})
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {h.isClosed ? (
                          <span className="text-rose-650 font-semibold">Closed All Day</span>
                        ) : (
                          <span>
                            Special Hours: <span className="font-semibold">{h.open} - {h.close}</span>
                          </span>
                        )}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveHoliday(h.date)}
                      className="p-1.5 text-slate-400 hover:text-rose-655 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                      title="Remove holiday schedule"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
            onClick={handleSaveHolidays}
            disabled={loading}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-hover shadow-lg transition-all flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            Apply Holidays
          </button>
        </div>
      </div>
    </div>
  )
}
