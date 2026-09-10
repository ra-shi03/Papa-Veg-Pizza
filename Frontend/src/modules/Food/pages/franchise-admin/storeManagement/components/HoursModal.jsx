import React, { useState, useEffect } from "react"
import { Clock, HelpCircle, Save, X } from "lucide-react"
import { adminAPI } from "@food/api"

export default function HoursModal({ isOpen, onClose, onConfirm, store }) {
  const [hours, setHours] = useState([])
  const [loading, setLoading] = useState(false)

  const defaultHours = [
    { day: "Monday", openTime: "11:00", closeTime: "23:00", isHoliday: false },
    { day: "Tuesday", openTime: "11:00", closeTime: "23:00", isHoliday: false },
    { day: "Wednesday", openTime: "11:00", closeTime: "23:00", isHoliday: false },
    { day: "Thursday", openTime: "11:00", closeTime: "23:00", isHoliday: false },
    { day: "Friday", openTime: "11:00", closeTime: "23:00", isHoliday: false },
    { day: "Saturday", openTime: "11:00", closeTime: "23:30", isHoliday: false },
    { day: "Sunday", openTime: "11:00", closeTime: "23:30", isHoliday: false }
  ]

  useEffect(() => {
    if (store && isOpen) {
      const fetchHours = async () => {
        try {
          setLoading(true)
          const response = await adminAPI.updateStoreHours(store._id, {}) // Trigger get/initialize logic or use fallback
          // If we had custom endpoints, otherwise use mocked updateStoreHours getter or fallback
          if (response?.data?.data?.operatingHours) {
            setHours(response.data.data.operatingHours)
          } else {
            // Check if store already has operatingHours locally seeded
            setHours(store.operatingHours || defaultHours)
          }
        } catch (_) {
          setHours(store.operatingHours || defaultHours)
        } finally {
          setLoading(false)
        }
      }
      fetchHours()
    }
  }, [store, isOpen])

  if (!isOpen || !store) return null

  const handleTimeChange = (index, field, value) => {
    const updated = [...hours]
    updated[index] = { ...updated[index], [field]: value }
    setHours(updated)
  }

  const handleHolidayToggle = (index) => {
    const updated = [...hours]
    updated[index] = { ...updated[index], isHoliday: !updated[index].isHoliday }
    setHours(updated)
  }

  const handleApplyToAll = () => {
    if (hours.length === 0) return
    const baseDay = hours[0]
    const updated = hours.map((item, idx) => {
      if (idx === 0) return item
      return {
        ...item,
        openTime: baseDay.openTime,
        closeTime: baseDay.closeTime,
        isHoliday: baseDay.isHoliday
      }
    })
    setHours(updated)
  }

  const handleSave = (e) => {
    e.preventDefault()
    onConfirm(store._id, hours)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden transition-all scale-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-850">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Operating Hours</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Set weekly times for <span className="font-semibold">{store.storeName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Loading Indicator */}
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <Clock className="w-8 h-8 animate-spin mx-auto text-amber-600 mb-3" />
            <p className="text-sm">Fetching store schedules...</p>
          </div>
        ) : (
          <form onSubmit={handleSave}>
            {/* Scrollable Form Body */}
            <div className="px-6 py-4 max-h-[60vh] overflow-y-auto space-y-4">
              
              {/* Quick Actions Panel */}
              <div className="flex items-center justify-between p-3 bg-amber-50/50 dark:bg-amber-950/15 border border-amber-100/50 dark:border-amber-900/30 rounded-xl">
                <div className="flex items-center gap-2 text-xs text-amber-800 dark:text-amber-400">
                  <HelpCircle className="w-4.5 h-4.5 shrink-0" />
                  <span>Configure Monday, then copy settings to all other days.</span>
                </div>
                <button
                  type="button"
                  onClick={handleApplyToAll}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                >
                  Apply To All Days
                </button>
              </div>

              {/* Weekly Schedule Grid */}
              <div className="space-y-2">
                {hours.map((item, index) => (
                  <div
                    key={item.day}
                    className={`grid grid-cols-12 items-center gap-4 p-3 rounded-xl border transition-all ${
                      item.isHoliday
                        ? "border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 opacity-70"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
                    }`}
                  >
                    {/* Day Column */}
                    <div className="col-span-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {item.day}
                    </div>

                    {/* Open Time Column */}
                    <div className="col-span-3">
                      <input
                        type="time"
                        disabled={item.isHoliday}
                        value={item.openTime || "11:00"}
                        onChange={(e) => handleTimeChange(index, "openTime", e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-50"
                      />
                    </div>

                    {/* Close Time Column */}
                    <div className="col-span-3">
                      <input
                        type="time"
                        disabled={item.isHoliday}
                        value={item.closeTime || "23:00"}
                        onChange={(e) => handleTimeChange(index, "closeTime", e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-50"
                      />
                    </div>

                    {/* Holiday Checkbox Column */}
                    <div className="col-span-3 flex items-center justify-end gap-2">
                      <label className="text-xs text-slate-500 dark:text-slate-400 cursor-pointer select-none">
                        Holiday
                      </label>
                      <input
                        type="checkbox"
                        checked={item.isHoliday || false}
                        onChange={() => handleHolidayToggle(index)}
                        className="w-4 h-4 rounded text-amber-600 border-slate-300 focus:ring-amber-500 bg-slate-100 dark:bg-slate-900 dark:border-slate-800"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-850">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white transition-all shadow-md"
              >
                <Save className="w-4 h-4" />
                Save Schedule
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
