import React, { useState, useEffect } from "react"
import { Clock, MapPin, AlertCircle, X } from "lucide-react"

function WheelColumn({ options, value, onChange, isDarkMode }) {
  const currentIndex = options.indexOf(value)

  const handlePrev = (e) => {
    e.stopPropagation()
    if (currentIndex > 0) {
      onChange(options[currentIndex - 1])
    }
  }

  const handleNext = (e) => {
    e.stopPropagation()
    if (currentIndex < options.length - 1) {
      onChange(options[currentIndex + 1])
    }
  }

  const handleWheel = (e) => {
    if (e.deltaY > 0) {
      handleNext(e)
    } else if (e.deltaY < 0) {
      handlePrev(e)
    }
  }

  const prevItem = currentIndex > 0 ? options[currentIndex - 1] : null
  const currentItem = value
  const nextItem = currentIndex < options.length - 1 ? options[currentIndex + 1] : null

  const textPrimary = isDarkMode ? "text-white" : "text-zinc-900"
  const textMuted = isDarkMode ? "text-zinc-500/40" : "text-zinc-400/40"

  return (
    <div
      onWheel={handleWheel}
      className="flex flex-col items-center justify-between h-20 w-full select-none cursor-pointer"
    >
      {/* Top element (faded, clickable) */}
      <div
        onClick={handlePrev}
        className={`h-6 flex items-center justify-center text-sm font-semibold transition-all ${textMuted} hover:opacity-100 w-full text-center`}
      >
        {prevItem !== null ? prevItem : ""}
      </div>

      {/* Middle active element */}
      <div
        className={`h-8 flex items-center justify-center text-[15px] font-extrabold ${textPrimary} w-full text-center`}
        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        {currentItem}
      </div>

      {/* Bottom element (faded, clickable) */}
      <div
        onClick={handleNext}
        className={`h-6 flex items-center justify-center text-sm font-semibold transition-all ${textMuted} hover:opacity-100 w-full text-center`}
      >
        {nextItem !== null ? nextItem : ""}
      </div>
    </div>
  )
}

export default function OrderDetailsFlow({
  confirmedAddress,
  onOpenMap,
  onClearCart,
  isDarkMode,
  triggerToast
}) {
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showTimeModal, setShowTimeModal] = useState(false)
  const [showWarningModal, setShowWarningModal] = useState(false)
  const [orderTime, setOrderTime] = useState("ASAP") // "ASAP" or scheduled string
  const [selectedTimeOption, setSelectedTimeOption] = useState("ASAP")

  const [selectedDay, setSelectedDay] = useState("Today")
  const [selectedHour, setSelectedHour] = useState("")
  const [selectedMinute, setSelectedMinute] = useState("")

  // Styling helpers
  const textPrimary = isDarkMode ? "text-white" : "text-zinc-900"
  const textSecondary = isDarkMode ? "text-slate-400" : "text-slate-500"
  const modalBg = isDarkMode ? "bg-[#151515] border border-white/5" : "bg-[#FAF9F6] border border-zinc-100"
  const divider = isDarkMode ? "border-white/10" : "border-zinc-100"

  const daysList = ["Today", "Tomorrow"]

  const getAvailableHours = (day) => {
    const startHour = 11
    const endHour = 23
    const hours = []

    if (day === "Today") {
      const now = new Date()
      const currentHour = now.getHours()
      const currentMin = now.getMinutes()

      // If past 23:45, no hours are available for today
      let start = currentHour
      if (currentMin >= 45) {
        start += 1
      }

      start = Math.max(startHour, start)
      for (let h = start; h <= endHour; h++) {
        hours.push(String(h).padStart(2, "0"))
      }
    } else {
      for (let h = startHour; h <= endHour; h++) {
        hours.push(String(h).padStart(2, "0"))
      }
    }
    return hours
  }

  const getAvailableMinutes = (day, hourStr) => {
    const allMinutes = ["00", "15", "30", "45"]
    if (day === "Today") {
      const now = new Date()
      const currentHourStr = String(now.getHours()).padStart(2, "0")
      if (hourStr === currentHourStr) {
        const currentMin = now.getMinutes()
        return allMinutes.filter(m => parseInt(m) > currentMin)
      }
    }
    return allMinutes
  }

  // Set default picker selections when modal opens
  useEffect(() => {
    if (showTimeModal) {
      let activeDay = "Today"
      let hours = getAvailableHours("Today")

      if (hours.length === 0) {
        activeDay = "Tomorrow"
        hours = getAvailableHours("Tomorrow")
      }

      setSelectedDay(activeDay)

      const defaultHour = hours[0] || "11"
      setSelectedHour(defaultHour)

      const minutes = getAvailableMinutes(activeDay, defaultHour)
      setSelectedMinute(minutes[0] || "00")
    }
  }, [showTimeModal])

  // Synchronize options when selectedDay changes
  const handleDayChange = (day) => {
    setSelectedDay(day)
    const hours = getAvailableHours(day)
    if (hours.length > 0) {
      const nextHour = hours.includes(selectedHour) ? selectedHour : hours[0]
      setSelectedHour(nextHour)

      const minutes = getAvailableMinutes(day, nextHour)
      const nextMin = minutes.includes(selectedMinute) ? selectedMinute : minutes[0]
      setSelectedMinute(nextMin)
    }
  }

  // Synchronize options when selectedHour changes
  const handleHourChange = (hour) => {
    setSelectedHour(hour)
    const minutes = getAvailableMinutes(selectedDay, hour)
    if (minutes.length > 0) {
      const nextMin = minutes.includes(selectedMinute) ? selectedMinute : minutes[0]
      setSelectedMinute(nextMin)
    }
  }

  return (
    <>
      {/* 1. Delivering ASAP Confirmation Bar */}
      <div className={`mx-5 my-3 p-4 rounded-2xl shadow-sm border flex items-center justify-between transition-colors ${
        isDarkMode ? "bg-white/5 border-white/10" : "bg-[#FAF9F6] border-zinc-100"
      }`}>
        <div className="flex items-center gap-3">
          {/* Red circle icon */}
          <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <span className="material-symbols-outlined text-lg">moped</span>
          </div>
          <div className="text-left leading-tight">
            <p className={`text-xs font-extrabold ${textPrimary}`}>
              Delivering {orderTime === "ASAP" ? "ASAP" : `Scheduled (${orderTime})`} to:
            </p>
            <p className={`text-[10px] font-semibold mt-0.5 max-w-[200px] truncate ${textSecondary}`}>
              {confirmedAddress || "Selected address"}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowDetailsModal(true)}
          className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 text-xs font-bold bg-transparent border-0 cursor-pointer outline-none transition-colors"
        >
          Change
        </button>
      </div>

      {/* 2. Order Details Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-5 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-sm rounded-[2rem] p-6 shadow-2xl text-left relative ${modalBg}`}>
            {/* Close button */}
            <button
              onClick={() => setShowDetailsModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer bg-transparent border-0 outline-none"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className={`font-black text-xl mb-6 ${textPrimary}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Order details
            </h3>

            <div className="space-y-4">
              {/* Row 1: Order for ASAP / Scheduled */}
              <div className={`flex items-center justify-between pb-4 border-b ${divider}`}>
                <div className="flex items-center gap-3">
                  <Clock className={`w-5 h-5 ${textSecondary}`} />
                  <span className={`text-sm font-semibold ${textPrimary}`}>
                    Order for {orderTime === "ASAP" ? "ASAP" : orderTime}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setShowTimeModal(true)
                    setShowDetailsModal(false)
                  }}
                  className="text-emerald-600 dark:text-emerald-400 text-xs font-bold bg-transparent border-0 cursor-pointer outline-none"
                >
                  Change
                </button>
              </div>

              {/* Row 2: Delivering to location */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-start gap-3">
                  <MapPin className={`w-5 h-5 mt-0.5 shrink-0 ${textSecondary}`} />
                  <div className="leading-tight">
                    <p className={`text-xs font-extrabold ${textPrimary}`}>Delivering to:</p>
                    <p className={`text-[10px] font-semibold mt-1 max-w-[200px] leading-relaxed ${textSecondary}`}>
                      {confirmedAddress}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowWarningModal(true)
                    setShowDetailsModal(false)
                  }}
                  className="text-emerald-600 dark:text-emerald-400 text-xs font-bold bg-transparent border-0 cursor-pointer outline-none shrink-0"
                >
                  Change
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. When would you like your order? Modal */}
      {showTimeModal && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-5 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-sm rounded-[2rem] p-6 shadow-2xl text-left ${modalBg}`}>
            <h3 className={`font-black text-lg mb-6 leading-tight ${textPrimary}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              When would you like your order?
            </h3>

            <div className="space-y-4 mb-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="timeOption"
                  checked={selectedTimeOption === "ASAP"}
                  onChange={() => setSelectedTimeOption("ASAP")}
                  className="w-4 h-4 accent-emerald-600 cursor-pointer"
                />
                <span className={`text-sm font-semibold ${textPrimary}`}>ASAP</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="timeOption"
                  checked={selectedTimeOption === "Future"}
                  onChange={() => setSelectedTimeOption("Future")}
                  className="w-4 h-4 accent-emerald-600 cursor-pointer"
                />
                <span className={`text-sm font-semibold ${textPrimary}`}>Order for future</span>
              </label>
            </div>

            {selectedTimeOption === "Future" && (
              <div className="relative flex items-center justify-center gap-4 py-4 my-2 border-t border-zinc-100 dark:border-white/5">
                {/* Selection row borders spanning across the columns */}
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-10 border-y border-zinc-100 dark:border-white/10 pointer-events-none" />

                <div className="w-[40%] z-10">
                  <WheelColumn
                    options={daysList}
                    value={selectedDay}
                    onChange={handleDayChange}
                    isDarkMode={isDarkMode}
                  />
                </div>
                <div className="w-[30%] z-10">
                  <WheelColumn
                    options={getAvailableHours(selectedDay)}
                    value={selectedHour}
                    onChange={handleHourChange}
                    isDarkMode={isDarkMode}
                  />
                </div>
                <div className="w-[30%] z-10">
                  <WheelColumn
                    options={getAvailableMinutes(selectedDay, selectedHour)}
                    value={selectedMinute}
                    onChange={setSelectedMinute}
                    isDarkMode={isDarkMode}
                  />
                </div>
              </div>
            )}

            <button
              onClick={() => {
                if (selectedTimeOption === "ASAP") {
                  setOrderTime("ASAP")
                  triggerToast("Order time updated to ASAP")
                } else {
                  const timeString = `${selectedDay}, ${selectedHour}:${selectedMinute}`
                  setOrderTime(timeString)
                  triggerToast(`Order time updated to ${timeString}`)
                }
                setShowTimeModal(false)
                setShowDetailsModal(true)
              }}
              className="w-full h-12 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold rounded-xl text-sm transition-all shadow-md cursor-pointer border-0 outline-none flex items-center justify-center mt-4"
            >
              Select Timeslot
            </button>
          </div>
        </div>
      )}

      {/* 4. Are you sure you want to continue? Warning Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-5 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-sm rounded-[2rem] p-6 shadow-2xl text-center space-y-4 ${modalBg}`}>
            <AlertCircle className="w-12 h-12 text-primary mx-auto" />
            <div className="space-y-2">
              <h3 className={`font-black text-lg leading-tight ${textPrimary}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Are you sure you want to continue?
              </h3>
              <p className={`text-xs leading-relaxed ${textSecondary}`}>
                Changing your delivery or collection details will clear your cart and reset your order.
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <button
                onClick={() => {
                  setShowWarningModal(false)
                  setShowDetailsModal(true)
                }}
                className="w-full h-12 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer border-0 outline-none flex items-center justify-center"
              >
                Nope, keep it as is
              </button>
              <button
                onClick={() => {
                  onClearCart()
                  setShowWarningModal(false)
                  onOpenMap()
                  triggerToast("Cart cleared and opening map...")
                }}
                className="w-full h-12 bg-transparent hover:bg-emerald-50 dark:hover:bg-white/5 text-emerald-700 dark:text-emerald-400 font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all border border-emerald-700 dark:border-emerald-400 cursor-pointer outline-none flex items-center justify-center"
              >
                Yes, start order again
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
