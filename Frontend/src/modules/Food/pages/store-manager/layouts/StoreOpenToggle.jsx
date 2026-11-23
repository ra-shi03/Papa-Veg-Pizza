import React, { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { adminClient } from "@/services/api/axios"
import { Clock, Store, X, Check, Save } from "lucide-react"

// The store manager's Open / Closed switch and Dynamic Store Time (Start to End, AM to PM).
// Closed = customers cannot place new orders right now and see the store closed banner with dynamic hours.
const URL = "/food/store/open-status"
const REAL = { _isFallback: true }

const parse12h = (s, fallbackH = "10", fallbackM = "00", fallbackP = "AM") => {
  const m = String(s || "").trim().toUpperCase().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/)
  if (!m) return { hour: fallbackH, minute: fallbackM, period: fallbackP }
  let h = Number(m[1])
  if (h < 1 || h > 12) h = 10
  return {
    hour: String(h).padStart(2, "0"),
    minute: m[2] ? String(m[2]).padStart(2, "0") : "00",
    period: m[3] === "PM" ? "PM" : "AM"
  }
}

const getInitialStatus = () => {
  try {
    const cached = localStorage.getItem("store_open_status")
    if (cached) {
      const parsed = JSON.parse(cached)
      if (typeof parsed?.switchOn === "boolean" || typeof parsed?.isOpen === "boolean") {
        return {
          switchOn: parsed.switchOn ?? parsed.isOpen ?? true,
          withinHours: parsed.withinHours ?? true,
          isOpen: parsed.isOpen ?? true,
          storeName: parsed.storeName || "",
          openTime: parsed.openTime || "10:00 AM",
          closeTime: parsed.closeTime || "11:00 PM",
          storeTiming: parsed.storeTiming || "10:00 AM - 11:00 PM"
        }
      }
    }
  } catch (_) {}
  return {
    switchOn: true,
    withinHours: true,
    isOpen: true,
    storeName: "",
    openTime: "10:00 AM",
    closeTime: "11:00 PM",
    storeTiming: "10:00 AM - 11:00 PM"
  }
}

export default function StoreOpenToggle({ variant = "compact", storeName: propStoreName = "" }) {
  const [status, setStatus] = useState(getInitialStatus)
  const [saving, setSaving] = useState(false)
  const [showTimeModal, setShowTimeModal] = useState(false)

  // Start & End time inputs (AM to PM)
  const [startHour, setStartHour] = useState("10")
  const [startMinute, setStartMinute] = useState("00")
  const [startPeriod, setStartPeriod] = useState("AM")

  const [endHour, setEndHour] = useState("11")
  const [endMinute, setEndMinute] = useState("00")
  const [endPeriod, setEndPeriod] = useState("PM")

  const syncStatus = useCallback((next) => {
    setStatus(next)
    try {
      const payload = {
        ...next,
        isOpen: next?.switchOn && next?.withinHours !== false,
        openTime: next?.openTime || "10:00 AM",
        closeTime: next?.closeTime || "11:00 PM",
        storeTiming: next?.storeTiming || `${next?.openTime || "10:00 AM"} - ${next?.closeTime || "11:00 PM"}`,
        updatedAt: Date.now()
      }
      localStorage.setItem("store_open_status", JSON.stringify(payload))
      window.dispatchEvent(new CustomEvent("storeStatusChanged", { detail: payload }))
    } catch (_) {}
  }, [])

  const load = useCallback(async () => {
    try {
      const res = await adminClient.get(URL, REAL)
      if (res?.data?.data) {
        syncStatus(res.data.data)
      }
    } catch (_) {
      // Keep cached or default state on initial failure
    }
  }, [syncStatus])

  useEffect(() => {
    load()
    const timer = setInterval(load, 30000)
    window.addEventListener("focus", load)
    const handleStatusSync = (e) => {
      if (e.detail) setStatus((prev) => ({ ...prev, ...e.detail }))
    }
    window.addEventListener("storeStatusChanged", handleStatusSync)
    return () => {
      clearInterval(timer)
      window.removeEventListener("focus", load)
      window.removeEventListener("storeStatusChanged", handleStatusSync)
    }
  }, [load])

  const on = status ? Boolean(status.switchOn) : true
  const outsideHours = on && status?.withinHours === false
  const activeStoreName = status?.storeName || propStoreName
  const currentTiming = status?.storeTiming || `${status?.openTime || "10:00 AM"} - ${status?.closeTime || "11:00 PM"}`

  // Synchronize modal fields when modal is opened
  const handleOpenTimeModal = () => {
    const s = parse12h(status?.openTime || "10:00 AM", "10", "00", "AM")
    setStartHour(s.hour)
    setStartMinute(s.minute)
    setStartPeriod(s.period)

    const e = parse12h(status?.closeTime || "11:00 PM", "11", "00", "PM")
    setEndHour(e.hour)
    setEndMinute(e.minute)
    setEndPeriod(e.period)

    setShowTimeModal(true)
  }

  const handleSaveStoreTime = async (e) => {
    if (e) e.preventDefault()
    if (saving) return

    const openTime = `${startHour}:${startMinute} ${startPeriod}`
    const closeTime = `${endHour}:${endMinute} ${endPeriod}`
    const storeTiming = `${openTime} - ${closeTime}`

    setSaving(true)
    const optimistic = {
      ...status,
      openTime,
      closeTime,
      storeTiming,
      opensAt: openTime
    }
    syncStatus(optimistic)

    try {
      const res = await adminClient.put(URL, { openTime, closeTime }, REAL)
      const serverData = res?.data?.data
      if (serverData) {
        syncStatus(serverData)
      }
      toast.success(`Store time updated: ${storeTiming}`)
      setShowTimeModal(false)
    } catch (err) {
      const errMsg = err?.response?.data?.message || err?.response?.data?.error
      if (errMsg) {
        toast.error(errMsg)
      } else {
        toast.error("Could not update the store time. Check your connection and try again.")
      }
    } finally {
      setSaving(false)
    }
  }

  const toggle = async () => {
    if (saving) return
    setSaving(true)
    const nextOn = !on
    const optimistic = {
      ...status,
      switchOn: nextOn,
      isOpen: nextOn && status?.withinHours !== false
    }
    syncStatus(optimistic)

    try {
      const res = await adminClient.put(URL, { open: nextOn }, REAL)
      const serverData = res?.data?.data
      if (serverData) {
        syncStatus(serverData)
      }
      toast.success(nextOn ? "Store is now Open for customer orders" : "Store is now Closed: customers cannot place new orders")
    } catch (err) {
      const errMsg = err?.response?.data?.message || err?.response?.data?.error
      if (errMsg) {
        toast.error(errMsg)
        syncStatus({ ...status, switchOn: on, isOpen: on && status?.withinHours !== false })
      } else {
        toast.success(nextOn ? "Store is now Open for orders (offline mode)" : "Store is now Closed (offline mode)")
      }
    } finally {
      setSaving(false)
    }
  }

  const hoursOptions = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"]
  const minutesOptions = ["00", "15", "30", "45"]

  // --- MODAL COMPONENT (Dynamic Store Time AM to PM Configuration) ---
  const timeModal = showTimeModal && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl relative"
        style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}
      >
        <button
          type="button"
          onClick={() => setShowTimeModal(false)}
          className="absolute right-5 top-5 w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-500 flex items-center justify-center border-0 cursor-pointer transition-colors"
          aria-label="Close modal"
        >
          <X size={16} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center">
            <Clock size={20} />
          </div>
          <div>
            <h3 className="text-base font-black text-zinc-900 dark:text-white leading-tight">
              Set Store Operating Time
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Set start to end hours (AM to PM) displayed dynamically to customers.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveStoreTime} className="space-y-4">
          {/* START TIME (STORE OPENING) */}
          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60">
            <label className="block text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2">
              Start Time (Store Opening)
            </label>
            <div className="flex items-center gap-2">
              {/* Hour */}
              <div className="flex-1">
                <select
                  value={startHour}
                  onChange={(e) => setStartHour(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white font-bold text-sm outline-none focus:border-red-500"
                >
                  {hoursOptions.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
                <span className="text-[10px] text-zinc-400 mt-0.5 block text-center">Hour</span>
              </div>
              <span className="font-bold text-lg text-zinc-400 -mt-3">:</span>
              {/* Minute */}
              <div className="flex-1">
                <select
                  value={startMinute}
                  onChange={(e) => setStartMinute(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white font-bold text-sm outline-none focus:border-red-500"
                >
                  {minutesOptions.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <span className="text-[10px] text-zinc-400 mt-0.5 block text-center">Minute</span>
              </div>
              {/* Period: AM / PM */}
              <div className="flex rounded-xl bg-zinc-200 dark:bg-zinc-700 p-1 shrink-0 -mt-3.5">
                <button
                  type="button"
                  onClick={() => setStartPeriod("AM")}
                  className={`px-3 py-2 rounded-lg text-xs font-black transition-all border-0 cursor-pointer ${
                    startPeriod === "AM"
                      ? "bg-white dark:bg-zinc-900 text-red-600 shadow-xs"
                      : "text-zinc-600 dark:text-zinc-300 bg-transparent"
                  }`}
                >
                  AM
                </button>
                <button
                  type="button"
                  onClick={() => setStartPeriod("PM")}
                  className={`px-3 py-2 rounded-lg text-xs font-black transition-all border-0 cursor-pointer ${
                    startPeriod === "PM"
                      ? "bg-white dark:bg-zinc-900 text-red-600 shadow-xs"
                      : "text-zinc-600 dark:text-zinc-300 bg-transparent"
                  }`}
                >
                  PM
                </button>
              </div>
            </div>
          </div>

          {/* END TIME (STORE CLOSING) */}
          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60">
            <label className="block text-[11px] font-black uppercase tracking-wider text-red-600 dark:text-red-400 mb-2">
              End Time (Store Closing)
            </label>
            <div className="flex items-center gap-2">
              {/* Hour */}
              <div className="flex-1">
                <select
                  value={endHour}
                  onChange={(e) => setEndHour(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white font-bold text-sm outline-none focus:border-red-500"
                >
                  {hoursOptions.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
                <span className="text-[10px] text-zinc-400 mt-0.5 block text-center">Hour</span>
              </div>
              <span className="font-bold text-lg text-zinc-400 -mt-3">:</span>
              {/* Minute */}
              <div className="flex-1">
                <select
                  value={endMinute}
                  onChange={(e) => setEndMinute(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white font-bold text-sm outline-none focus:border-red-500"
                >
                  {minutesOptions.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <span className="text-[10px] text-zinc-400 mt-0.5 block text-center">Minute</span>
              </div>
              {/* Period: AM / PM */}
              <div className="flex rounded-xl bg-zinc-200 dark:bg-zinc-700 p-1 shrink-0 -mt-3.5">
                <button
                  type="button"
                  onClick={() => setEndPeriod("AM")}
                  className={`px-3 py-2 rounded-lg text-xs font-black transition-all border-0 cursor-pointer ${
                    endPeriod === "AM"
                      ? "bg-white dark:bg-zinc-900 text-red-600 shadow-xs"
                      : "text-zinc-600 dark:text-zinc-300 bg-transparent"
                  }`}
                >
                  AM
                </button>
                <button
                  type="button"
                  onClick={() => setEndPeriod("PM")}
                  className={`px-3 py-2 rounded-lg text-xs font-black transition-all border-0 cursor-pointer ${
                    endPeriod === "PM"
                      ? "bg-white dark:bg-zinc-900 text-red-600 shadow-xs"
                      : "text-zinc-600 dark:text-zinc-300 bg-transparent"
                  }`}
                >
                  PM
                </button>
              </div>
            </div>
          </div>

          {/* QUICK PRESETS */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold text-zinc-400 mr-1">Presets:</span>
            {[
              { label: "10 AM - 11 PM", sh: "10", sm: "00", sp: "AM", eh: "11", em: "00", ep: "PM" },
              { label: "09 AM - 10 PM", sh: "09", sm: "00", sp: "AM", eh: "10", em: "00", ep: "PM" },
              { label: "11 AM - 11 PM", sh: "11", sm: "00", sp: "AM", eh: "11", em: "00", ep: "PM" },
            ].map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  setStartHour(p.sh)
                  setStartMinute(p.sm)
                  setStartPeriod(p.sp)
                  setEndHour(p.eh)
                  setEndMinute(p.em)
                  setEndPeriod(p.ep)
                }}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border-0 cursor-pointer transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowTimeModal(false)}
              className="flex-1 h-11 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-bold text-xs transition-colors border-0 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 h-11 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 border-0 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Save size={14} />
              {saving ? "Saving..." : "Save Store Time"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  // --- 1. BANNER / CARD VARIANT (For Store Operations Dashboard) ---
  if (variant === "banner" || variant === "card") {
    return (
      <>
        {timeModal}
        <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-sm transition-all">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            {/* Left Info Section */}
            <div className="flex items-start sm:items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                on && !outsideHours 
                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40" 
                  : "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/40"
              }`}>
                <Store size={26} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black uppercase tracking-wider text-zinc-400">Store Time &amp; Operations</span>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${
                    on && !outsideHours
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                      : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800"
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${on && !outsideHours ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
                    {on ? (outsideHours ? "Outside Hours" : "Store Open") : "Store Closed"}
                  </span>
                  {activeStoreName && (
                    <span className="text-xs text-zinc-500 font-medium hidden sm:inline">
                      &bull; {activeStoreName}
                    </span>
                  )}
                </div>

                <h2 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-white mt-1">
                  {on 
                    ? (outsideHours ? "Store is currently outside normal operating hours" : "Store is Open & Accepting Orders") 
                    : "Store is currently Closed for delivery orders"
                  }
                </h2>

                {/* Dynamic Store Operating Hours display */}
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-xl">
                    <Clock size={13} className="text-red-600 dark:text-red-400" />
                    <span>Store Hours: <strong className="text-red-600 dark:text-red-400">{currentTiming}</strong></span>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenTimeModal}
                    className="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 dark:text-red-400 hover:underline cursor-pointer border-0 bg-transparent p-0"
                  >
                    Edit Hours (AM/PM)
                  </button>
                </div>
              </div>
            </div>

            {/* Right Toggle Controls */}
            <div className="flex items-center gap-3 self-end lg:self-center shrink-0">
              <button
                type="button"
                onClick={handleOpenTimeModal}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-bold transition-colors border-0 cursor-pointer"
              >
                <Clock size={14} />
                Set Time (AM/PM)
              </button>

              <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800/60 p-2 sm:p-2.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/60">
                <div className="flex flex-col text-right leading-tight">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Store Status</span>
                  <span className={`text-xs font-extrabold ${on && !outsideHours ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                    {on ? (outsideHours ? "Outside Hours" : "Store Open") : "Store Closed"}
                  </span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={on}
                  aria-label={on ? "Store is currently open. Click to close store" : "Store is currently closed. Click to open store"}
                  onClick={toggle}
                  disabled={saving}
                  className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border-0 transition-colors cursor-pointer shadow-inner disabled:opacity-60 ${
                    on ? "bg-emerald-500 hover:bg-emerald-600" : "bg-zinc-300 hover:bg-zinc-400 dark:bg-zinc-700 dark:hover:bg-zinc-600"
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-200 ${
                      on ? "translate-x-[28px]" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  // --- 2. COMPACT NAVBAR VARIANT ---
  return (
    <>
      {timeModal}
      <div 
        className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-750 transition-colors"
        title={outsideHours ? "Outside the operating hours: the store stays closed until they start" : `Store time: ${currentTiming} (${on ? "Store Open" : "Store Closed"})`}
      >
        <button
          type="button"
          onClick={handleOpenTimeModal}
          className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors border-0 cursor-pointer bg-transparent"
          title={`Click to set store time (Currently: ${currentTiming})`}
        >
          <Clock size={13} />
        </button>

        <div className="flex flex-col leading-tight text-right">
          <span className="text-[9px] font-black uppercase tracking-wider text-zinc-400">Store time</span>
          <div className="flex items-center gap-1 justify-end">
            <span className={`w-1.5 h-1.5 rounded-full ${on && !outsideHours ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
            <span className={`text-[11px] font-black ${on && !outsideHours ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
              {on ? (outsideHours ? "Outside hours" : "Store Open") : "Store Closed"}
            </span>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label={on ? "Store open. Switch to closed" : "Store closed. Switch to open"}
          onClick={toggle}
          disabled={saving}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-0 transition-colors cursor-pointer disabled:opacity-60 ${
            on ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700"
          }`}
        >
          <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
            on ? "translate-x-[22px]" : "translate-x-0.5"
          }`} />
        </button>
      </div>
    </>
  )
}
