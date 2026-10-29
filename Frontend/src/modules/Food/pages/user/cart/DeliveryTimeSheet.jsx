import React, { useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { X, Zap, CalendarClock, Check, RotateCcw, Loader2 } from "lucide-react"
import { dayLabel, isSlotStillValid, slotLabel, time12 } from "./cartHelpers"
import { haptic } from "./CartParts"

// "When do you want it?": Now, or Later with the dates on the left and that day's times on the right.
// Only slots the server returned (store hours, holidays, lead time) and that are still in the future are offered.
export default function DeliveryTimeSheet({ open, onClose, info, loading, error, onRetry, value, onConfirm, etaMinutes, ui, isDelivery }) {
  const reduce = useReducedMotion()
  const days = useMemo(
    () => (info?.days || []).map((d) => ({ ...d, slots: d.slots.filter((s) => isSlotStillValid(s.at)) })),
    [info]
  )
  const canNow = info ? info.openNow !== false : true
  const canLater = info ? info.scheduledOrdersEnabled !== false && days.some((d) => d.slots.length > 0) : false

  const [mode, setMode] = useState(value ? "later" : "now")
  const [date, setDate] = useState(null)
  const [picked, setPicked] = useState(value)
  const timesRef = useRef(null)

  // Fresh state each time the sheet opens
  useEffect(() => {
    if (!open) return
    setPicked(value)
    setMode(value || (info && !canNow) ? "later" : "now")
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  // Once slots arrive: closed now means later is the only choice; pick the chosen slot's day or the first open day
  useEffect(() => {
    if (!open || !info) return
    if (!canNow) setMode("later")
    const valueDay = value && days.find((d) => d.slots.some((s) => s.at === value))
    const first = days.find((d) => d.slots.length > 0)
    setDate((valueDay || first)?.date || null)
  }, [open, info]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (timesRef.current) timesRef.current.scrollTop = 0
  }, [date])

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  const day = days.find((d) => d.date === date)
  const confirmDisabled = mode === "now" ? !canNow : !picked
  const confirmText = mode === "now"
    ? (isDelivery ? `Deliver now · ~${etaMinutes} min` : "Order now")
    : picked ? `Schedule for ${slotLabel(picked)}` : "Pick a time"

  const confirm = () => {
    if (confirmDisabled) return
    haptic(12)
    onConfirm(mode === "now" ? null : picked)
  }

  const Option = ({ id, icon: Icon, title, subtitle, disabled }) => {
    const active = mode === id
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => { haptic(); setMode(id) }}
        aria-pressed={active}
        className="flex-1 rounded-2xl p-3 text-left border-2 cursor-pointer transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        style={{ borderColor: active ? "#E53935" : ui.line, backgroundColor: active ? (ui.dark ? "rgba(229,57,53,0.12)" : "#fff5f5") : ui.card }}
      >
        <div className="flex items-center justify-between">
          <Icon size={20} style={{ color: active ? "#E53935" : ui.muted }} />
          <span className="w-5 h-5 rounded-full flex items-center justify-center" style={active ? { backgroundColor: "#E53935" } : { border: `1.5px solid ${ui.line}` }}>
            {active && <Check size={12} strokeWidth={3} className="text-white" />}
          </span>
        </div>
        <p className="mt-2 text-[15px] font-bold" style={{ color: ui.text }}>{title}</p>
        <p className="text-xs mt-0.5" style={{ color: ui.muted }}>{subtitle}</p>
      </button>
    )
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-end justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog" aria-modal="true" aria-label="Choose delivery time"
            className="w-full max-w-md rounded-t-3xl flex flex-col max-h-[88vh]"
            style={{ backgroundColor: ui.page }}
            initial={reduce ? false : { y: "100%" }} animate={{ y: 0 }} exit={reduce ? { opacity: 0 } : { y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pt-2 flex justify-center"><span className="w-10 h-1 rounded-full" style={{ backgroundColor: ui.line }} /></div>
            <div className="px-4 pt-2 pb-3 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-extrabold" style={{ color: ui.text }}>{isDelivery ? "When should we deliver?" : "When do you want it?"}</h2>
                {info?.storeName && <p className="text-xs mt-0.5" style={{ color: ui.muted }}>From {info.storeName}</p>}
              </div>
              <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-full border-0 cursor-pointer" style={{ backgroundColor: ui.card, color: ui.text }}>
                <X size={16} />
              </button>
            </div>

            <div className="px-4 flex gap-3">
              <Option id="now" icon={Zap} title="Now" subtitle={canNow ? (isDelivery ? `In about ${etaMinutes} min` : "As soon as it's ready") : "Store is closed right now"} disabled={!canNow} />
              <Option
                id="later" icon={CalendarClock} title="Later"
                subtitle={loading ? "Checking slots…" : canLater ? "Pick a date & time" : info?.scheduledOrdersEnabled === false ? "Not available right now" : "No slots available"}
                disabled={!loading && !canLater}
              />
            </div>

            {mode === "later" && (
              <div className="mt-4 mx-4 rounded-2xl overflow-hidden flex min-h-[260px] max-h-[44vh]" style={{ backgroundColor: ui.card, border: `1px solid ${ui.line}` }}>
                {loading && !info ? (
                  <div className="flex-1 flex items-center justify-center" style={{ color: ui.muted }}><Loader2 className="w-5 h-5 animate-spin" /></div>
                ) : error && !info ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-2 p-4 text-center">
                    <p className="text-sm" style={{ color: ui.text }}>{error}</p>
                    <button onClick={onRetry} className="text-sm font-bold text-[#E53935] bg-transparent border-0 cursor-pointer flex items-center gap-1"><RotateCcw size={14} /> Retry</button>
                  </div>
                ) : (
                  <>
                    {/* Dates */}
                    <div className="w-[34%] shrink-0 overflow-y-auto" style={{ borderRight: `1px solid ${ui.line}`, backgroundColor: ui.soft }}>
                      {days.map((d) => {
                        const label = dayLabel(d.date)
                        const active = d.date === date
                        const empty = d.slots.length === 0
                        return (
                          <button
                            key={d.date}
                            type="button"
                            disabled={empty}
                            onClick={() => { haptic(); setDate(d.date) }}
                            className="w-full text-left px-3 py-3 border-0 cursor-pointer relative disabled:cursor-not-allowed"
                            style={{ backgroundColor: active ? ui.card : "transparent", opacity: empty ? 0.45 : 1 }}
                          >
                            {active && <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r bg-[#E53935]" />}
                            <p className="text-sm font-bold" style={{ color: active ? "#E53935" : ui.text }}>{label.top}</p>
                            <p className="text-[11px]" style={{ color: ui.muted }}>{empty ? "Closed" : label.bottom}</p>
                          </button>
                        )
                      })}
                    </div>
                    {/* Times */}
                    <div ref={timesRef} className="flex-1 overflow-y-auto p-2" role="listbox" aria-label="Time slots">
                      {(day?.slots || []).map((s) => {
                        const active = picked === s.at
                        return (
                          <button
                            key={s.at}
                            type="button"
                            role="option"
                            aria-selected={active}
                            onClick={() => { haptic(); setPicked(s.at) }}
                            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border-0 cursor-pointer text-sm"
                            style={{ backgroundColor: active ? (ui.dark ? "rgba(229,57,53,0.14)" : "#fff0f0") : "transparent", color: active ? "#E53935" : ui.text, fontWeight: active ? 700 : 500 }}
                          >
                            {time12(s.at)}
                            {active && <Check size={16} />}
                          </button>
                        )
                      })}
                      {day && day.slots.length === 0 && <p className="text-xs text-center py-6" style={{ color: ui.muted }}>No slots on this day</p>}
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="px-4 pt-4 pb-6">
              <button
                onClick={confirm}
                disabled={confirmDisabled}
                className="w-full h-12 rounded-xl text-white font-bold text-[15px] border-0 cursor-pointer active:scale-[0.98] transition-transform disabled:cursor-not-allowed"
                style={{ backgroundColor: confirmDisabled ? "#c9a3a5" : "#d32f3a" }}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
