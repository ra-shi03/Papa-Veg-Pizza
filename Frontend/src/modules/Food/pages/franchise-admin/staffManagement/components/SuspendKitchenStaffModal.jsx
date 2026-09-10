import React, { useState, useEffect } from "react"
import { AlertCircle, X } from "lucide-react"

export default function SuspendKitchenStaffModal({ isOpen, onClose, onConfirm, staff }) {
  const [reason, setReason] = useState("")
  const [duration, setDuration] = useState("Temporary") // Temporary | Permanent
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isOpen) {
      setReason("")
      setDuration("Temporary")
      setStartDate(new Date().toISOString().split("T")[0])
      
      const nextWeek = new Date()
      nextWeek.setDate(nextWeek.getDate() + 7)
      setEndDate(nextWeek.toISOString().split("T")[0])
      setErrors({})
    }
  }, [isOpen])

  if (!isOpen || !staff) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Validation
    const newErrors = {}
    if (!reason.trim()) {
      newErrors.reason = "Please state a reason for suspension"
    }
    if (duration === "Temporary") {
      if (!startDate) newErrors.startDate = "Start date required"
      if (!endDate) newErrors.endDate = "End date required"
      if (startDate && endDate && startDate > endDate) {
        newErrors.endDate = "End date must be after start date"
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    onConfirm(staff.id, {
      reason,
      duration,
      startDate: duration === "Temporary" ? startDate : null,
      endDate: duration === "Temporary" ? endDate : null
    })
  }

  return (
    <div className="fixed lg:left-[280px] left-0 top-[64px] right-0 bottom-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop restricted to content area */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden animate-scale-up z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-150 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20">
          <div className="flex items-center gap-2 text-zinc-900 dark:text-white">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            <h3 className="text-sm font-extrabold uppercase tracking-wider">Suspend Kitchen Staff</h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-250 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/35 rounded-xl text-xs text-amber-800 dark:text-amber-450 font-semibold leading-normal">
            <div className="flex-1">
              Suspended kitchen employee <span className="font-extrabold">{staff.name}</span> will lose KDS station logins and shift logging access immediately.
            </div>
          </div>

          {/* Duration Selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Suspension Type</label>
            <div className="grid grid-cols-2 gap-2.5">
              {["Temporary", "Permanent"].map((mode) => (
                <button
                  type="button"
                  key={mode}
                  onClick={() => setDuration(mode)}
                  className={`p-2.5 rounded-xl border text-xs font-extrabold text-center transition-all cursor-pointer ${
                    duration === mode
                      ? "border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)]"
                      : "border-zinc-100 dark:border-zinc-805 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-850"
                  }`}
                >
                  {mode === "Temporary" ? "⏰ Temporary" : "🚫 Permanent"}
                </button>
              ))}
            </div>
          </div>

          {/* Date Picker Grid if Temporary */}
          {duration === "Temporary" && (
            <div className="grid grid-cols-2 gap-3 p-3 border border-zinc-100 dark:border-zinc-850 rounded-xl bg-zinc-50/50 dark:bg-zinc-950/20">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-xs font-semibold px-2 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 focus:outline-none"
                />
                {errors.startDate && <p className="text-[9px] font-bold text-red-500">{errors.startDate}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-xs font-semibold px-2 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 focus:outline-none"
                />
                {errors.endDate && <p className="text-[9px] font-bold text-red-500">{errors.endDate}</p>}
              </div>
            </div>
          )}

          {/* Suspension Reason */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Reason for Suspension</label>
            <textarea
              rows="3"
              placeholder="State clear reasons for this action (e.g., Recipe quality issues, shift misconduct...)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-[var(--primary)] focus:bg-white"
            />
            {errors.reason && <p className="text-[9px] font-bold text-red-500">{errors.reason}</p>}
          </div>

          {/* Buttons Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800 pt-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-950 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-500/10 hover:shadow-lg transition-all cursor-pointer"
            >
              Confirm Suspension
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
