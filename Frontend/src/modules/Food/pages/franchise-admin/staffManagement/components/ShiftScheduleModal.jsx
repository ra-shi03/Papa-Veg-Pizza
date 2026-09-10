import React, { useState, useEffect } from "react"
import { Clock, X, Calendar, Sparkles } from "lucide-react"

const SHIFT_TIMES = {
  Morning: { start: "08:00 AM", end: "04:00 PM" },
  Afternoon: { start: "04:00 PM", end: "12:00 AM" },
  Night: { start: "12:00 AM", end: "08:00 AM" }
};

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function ShiftScheduleModal({ isOpen, onClose, onConfirm, staff }) {
  const [shiftType, setShiftType] = useState("Morning")
  const [startTime, setStartTime] = useState("08:00 AM")
  const [endTime, setEndTime] = useState("04:00 PM")
  const [weeklyDays, setWeeklyDays] = useState([])
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isOpen && staff) {
      setShiftType(staff.shiftType || "Morning")
      
      const times = SHIFT_TIMES[staff.shiftType || "Morning"]
      setStartTime(times?.start || "08:00 AM")
      setEndTime(times?.end || "04:00 PM")
      
      setWeeklyDays(staff.weeklyDays || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"])
      setErrors({})
    }
  }, [isOpen, staff])

  if (!isOpen || !staff) return null

  const handleShiftChange = (type) => {
    setShiftType(type)
    const times = SHIFT_TIMES[type]
    if (times) {
      setStartTime(times.start)
      setEndTime(times.end)
    }
  }

  const handleDayToggle = (day) => {
    setWeeklyDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const newErrors = {}
    if (weeklyDays.length === 0) {
      newErrors.weeklyDays = "Please select at least one working day"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    onConfirm(staff.id, {
      shiftType,
      startTime,
      endTime,
      weeklyDays
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
            <Clock className="w-5 h-5 text-[var(--primary)]" />
            <h3 className="text-sm font-extrabold uppercase tracking-wider">Configure Shift Schedule</h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-250 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-850 rounded-xl">
            <img
              src={staff.profileImage}
              alt={staff.name}
              className="w-9 h-9 rounded-xl object-cover border border-zinc-200 dark:border-zinc-800 shrink-0"
            />
            <div>
              <p className="text-[10px] font-black text-zinc-850 dark:text-zinc-200 leading-none">{staff.name}</p>
              <p className="text-[8px] text-zinc-500 font-semibold mt-1">Code: {staff.employeeCode} • Current: {staff.shiftType} Shift</p>
            </div>
          </div>

          {/* Shift Type selectors */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Shift Category</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.keys(SHIFT_TIMES).map((type) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => handleShiftChange(type)}
                  className={`p-2 rounded-xl border text-[11px] font-black text-center transition-all cursor-pointer ${
                    shiftType === type
                      ? "border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)]"
                      : "border-zinc-100 dark:border-zinc-805 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-850"
                  }`}
                >
                  {type === "Morning" ? "🌅 Morning" : type === "Afternoon" ? "🌆 Afternoon" : "🌃 Night"}
                </button>
              ))}
            </div>
          </div>

          {/* Timings range inputs */}
          <div className="grid grid-cols-2 gap-3 p-3 border border-zinc-100 dark:border-zinc-850 rounded-xl bg-zinc-50/50 dark:bg-zinc-950/20">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Start Time</label>
              <input
                type="text"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full text-xs font-semibold px-2 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">End Time</label>
              <input
                type="text"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full text-xs font-semibold px-2 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 focus:outline-none"
              />
            </div>
          </div>

          {/* Weekly Days multi-select */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Weekly Working Days</label>
            <div className="flex flex-wrap gap-1.5">
              {WEEKDAYS.map((day) => {
                const isSelected = weeklyDays.includes(day)
                return (
                  <button
                    type="button"
                    key={day}
                    onClick={() => handleDayToggle(day)}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[var(--primary)] text-white shadow-xs"
                        : "bg-zinc-50 dark:bg-zinc-950 text-zinc-650 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                    }`}
                  >
                    {day.slice(0, 3)}
                  </button>
                )
              })}
            </div>
            {errors.weeklyDays && <p className="text-[9px] font-bold text-red-500">{errors.weeklyDays}</p>}
          </div>

          {/* Preview card */}
          <div className="bg-zinc-50 dark:bg-zinc-950/20 border border-dashed border-zinc-200 dark:border-zinc-800 p-3 rounded-xl space-y-1.5">
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-zinc-500 uppercase tracking-wider">
              <Sparkles size={10} className="text-[var(--primary)] shrink-0" />
              <span>Shift Preview Schedule</span>
            </div>
            <p className="text-[10px] font-bold text-zinc-800 dark:text-zinc-250 leading-normal">
              Active Shift: <span className="text-[var(--primary)]">{shiftType} ({startTime} - {endTime})</span>
            </p>
            <p className="text-[9px] text-zinc-500 font-semibold leading-normal">
              Working: {weeklyDays.length === 7 ? "All 7 days (No weekly offs)" : weeklyDays.map((d) => d.slice(0, 3)).join(", ")}
            </p>
          </div>

          {/* Footer buttons */}
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
              className="px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-xl text-xs font-bold shadow-md shadow-[var(--primary)]/10 hover:shadow-lg transition-all cursor-pointer"
            >
              Confirm Shift
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
