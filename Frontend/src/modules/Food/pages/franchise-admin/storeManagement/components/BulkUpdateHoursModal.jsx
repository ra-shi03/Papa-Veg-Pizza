import React, { useState, useEffect } from "react"
import { X, CheckSquare, Square, Search, ShieldAlert, Check, HelpCircle } from "lucide-react"
import { adminAPI } from "@food/api"

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

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

export default function BulkUpdateHoursModal({ isOpen, onClose, stores = [], onSaveSuccess }) {
  const [selectedStoreIds, setSelectedStoreIds] = useState([])
  const [selectedWeekdays, setSelectedWeekdays] = useState([])
  const [isClosed, setIsClosed] = useState(false)
  const [openTime, setOpenTime] = useState("09:00 AM")
  const [closeTime, setCloseTime] = useState("10:00 PM")
  const [searchQuery, setSearchQuery] = useState("")
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setSelectedStoreIds([])
      setSelectedWeekdays([])
      setIsClosed(false)
      setOpenTime("09:00 AM")
      setCloseTime("10:00 PM")
      setSearchQuery("")
      setError(null)
      setShowConfirm(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  // Search filter
  const filteredStores = stores.filter(s => 
    s.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.storeCode.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleStoreSelect = (id) => {
    setSelectedStoreIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleSelectAllStores = () => {
    const visibleIds = filteredStores.map(s => s.storeId || s._id)
    const allSelected = visibleIds.every(id => selectedStoreIds.includes(id))
    if (allSelected) {
      // Remove all visible
      setSelectedStoreIds(prev => prev.filter(id => !visibleIds.includes(id)))
    } else {
      // Add all visible
      setSelectedStoreIds(prev => Array.from(new Set([...prev, ...visibleIds])))
    }
  }

  const handleWeekdaySelect = (day) => {
    setSelectedWeekdays(prev =>
      prev.includes(day) ? prev.filter(x => x !== day) : [...prev, day]
    )
  }

  const handleSelectWeekdaysOnly = () => {
    setSelectedWeekdays(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"])
  }

  const handleSelectWeekendsOnly = () => {
    setSelectedWeekdays(["Saturday", "Sunday"])
  }

  const handlePreSave = (e) => {
    e.preventDefault()
    if (selectedStoreIds.length === 0) {
      setError("Please select at least one store.")
      return
    }
    if (selectedWeekdays.length === 0) {
      setError("Please select at least one weekday.")
      return
    }
    setError(null)
    setShowConfirm(true)
  }

  const handleFinalSave = async () => {
    setLoading(true)
    setShowConfirm(false)
    try {
      await adminAPI.bulkUpdateStoreOperatingHours({
        storeIds: selectedStoreIds,
        weekdays: selectedWeekdays,
        open: openTime,
        close: closeTime,
        isClosed
      })
      if (onSaveSuccess) onSaveSuccess()
      onClose()
    } catch (err) {
      setError("Failed to run bulk update. Please retry.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 lg:left-[280px] z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="relative w-full max-w-3xl max-h-[90vh] bg-white dark:bg-slate-950 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden transition-all scale-in duration-200">
          
          {/* Close Header Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-655 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="p-5 border-b border-slate-100 dark:border-slate-850">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Bulk Update Timings</h3>
            <p className="text-xs text-slate-500 dark:text-slate-450 mt-0.5">
              Modify opening and closing hours for multiple stores at once
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mx-5 mt-4 p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-xl text-xs text-rose-650 font-semibold">
              {error}
            </div>
          )}

          {/* Scrollable Content */}
          <form onSubmit={handlePreSave} className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
              
              {/* Left Column: Store Selection */}
              <div className="flex flex-col min-h-0 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider">
                    Select Stores ({selectedStoreIds.length} Selected)
                  </label>
                  <button
                    type="button"
                    onClick={handleSelectAllStores}
                    className="text-[10px] font-bold text-primary hover:underline"
                  >
                    Select/Deselect All Visible
                  </button>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search stores..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>

                {/* Store Checklist */}
                <div className="flex-1 min-h-[220px] max-h-[300px] border border-slate-100 dark:border-slate-850 rounded-xl overflow-y-auto p-2 bg-slate-50/50 dark:bg-slate-900/10 space-y-1">
                  {filteredStores.map(s => {
                    const id = s.storeId || s._id
                    const isChecked = selectedStoreIds.includes(id)
                    return (
                      <button
                        type="button"
                        key={id}
                        onClick={() => handleStoreSelect(id)}
                        className={`w-full flex items-center gap-2.5 p-2 rounded-lg text-left text-xs transition-colors ${
                          isChecked
                            ? "bg-primary/5 text-primary font-bold"
                            : "hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-primary shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="truncate">{s.storeName}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">{s.storeCode || s.storeId} • {s.city}</p>
                        </div>
                      </button>
                    )
                  })}
                  {filteredStores.length === 0 && (
                    <div className="text-center py-10 text-xs text-slate-400">No stores found</div>
                  )}
                </div>
              </div>

              {/* Right Column: Weekdays & Hours */}
              <div className="space-y-4">
                {/* Weekdays Multi-Select */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider">
                      Select Weekdays
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleSelectWeekdaysOnly}
                        className="text-[10px] font-semibold text-slate-550 dark:text-slate-400 hover:text-primary"
                      >
                        Mon-Fri
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={handleSelectWeekendsOnly}
                        className="text-[10px] font-semibold text-slate-550 dark:text-slate-400 hover:text-primary"
                      >
                        Sat-Sun
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {daysOfWeek.map((day) => {
                      const isSelected = selectedWeekdays.includes(day)
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => handleWeekdaySelect(day)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                            isSelected
                              ? "bg-primary border-primary text-white shadow-xs"
                              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                          }`}
                        >
                          {day.substring(0, 3)}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Timing controls */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-850 space-y-4">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isClosed}
                      onChange={(e) => setIsClosed(e.target.checked)}
                      className="rounded border-slate-300 text-primary focus:ring-primary focus:ring-opacity-25"
                    />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-350">
                      Mark as Closed for selected weekdays
                    </span>
                  </label>

                  {!isClosed && (
                    <div className="space-y-3">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-450 dark:text-slate-500">
                        Operational Timing
                      </span>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <label className="block text-[9px] text-slate-400 font-bold mb-1">Open Time</label>
                          <select
                            value={openTime}
                            onChange={(e) => setOpenTime(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-300 text-xs focus:outline-none"
                          >
                            {timeIntervals.map(t => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                        <span className="text-slate-455 text-xs font-bold pt-4">to</span>
                        <div className="flex-1">
                          <label className="block text-[9px] text-slate-400 font-bold mb-1">Close Time</label>
                          <select
                            value={closeTime}
                            onChange={(e) => setCloseTime(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-855 dark:text-slate-300 text-xs focus:outline-none"
                          >
                            {timeIntervals.map(t => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

              </div>

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-850 bg-slate-50 dark:bg-slate-950/10 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-655 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={selectedStoreIds.length === 0 || selectedWeekdays.length === 0}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-hover shadow-lg transition-all disabled:opacity-50"
              >
                Apply Timing
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Confirmation Step */}
      {showConfirm && (
        <div className="fixed inset-0 lg:left-[280px] z-55 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xl p-5">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-500 rounded-lg">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-950 dark:text-white text-sm">Apply Bulk Update?</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  You are about to overwrite operating hours for <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedStoreIds.length} stores</span> on <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedWeekdays.length} weekdays</span>. This change cannot be undone in bulk.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-655 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850"
              >
                Go Back
              </button>
              <button
                onClick={handleFinalSave}
                disabled={loading}
                className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-primary hover:bg-primary-hover shadow-md"
              >
                Yes, Apply Update
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
