import React, { useEffect, useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import {
  CalendarCheck, LogIn, LogOut, Clock, CalendarOff, ChevronLeft, ChevronRight,
  CheckCircle2, AlarmClock, Timer, Loader2, Info,
} from "lucide-react"
import apiClient from "@/services/api/axios"
import { useMyAttendanceToday, useClockInOut } from "../staffManagement/hooks/useAttendance"
import { localToday } from "../staffManagement/localToday"
import LeaveRequestSection from "./LeaveRequestSection"

// Kitchen staff: check in / check out, and their own attendance day by day or for a date range.

const pad = (n) => String(n).padStart(2, "0")
const keyOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const shiftDay = (key, n) => { const d = new Date(`${key}T00:00:00`); d.setDate(d.getDate() + n); return keyOf(d) }
const prettyDay = (key) => new Date(`${key}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })
const clock = (value) => (value ? new Date(value).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true }) : "--")
const hhmmss = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000))
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`
}

const STATUS = {
  present: { label: "Present", cls: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/40" },
  half_day: { label: "Half day", cls: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-900/40" },
  leave: { label: "On leave", cls: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/40" },
  absent: { label: "Absent", cls: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/40" },
}

function useHistory(params) {
  return useQuery({
    queryKey: ["myAttendanceHistory", params],
    queryFn: async () => {
      const res = await apiClient.get("/store/attendance/me", { params: { ...params, limit: 400 } })
      return res.data?.data || []
    },
  })
}

export default function MyAttendance() {
  const today = localToday()
  const { data: now, isLoading: todayLoading } = useMyAttendanceToday()
  const clockMutation = useClockInOut()

  const [mode, setMode] = useState("day") // "day" | "range"
  const [day, setDay] = useState(today)
  const [from, setFrom] = useState(shiftDay(today, -6))
  const [to, setTo] = useState(today)

  const params = mode === "day" ? { date: day } : { from, to }
  const { data: history = [], isLoading: historyLoading, refetch } = useHistory(params)

  // a running timer while checked in
  const [tick, setTick] = useState(Date.now())
  const clockedIn = !!now?.clockedIn
  useEffect(() => {
    if (!clockedIn) return undefined
    const id = setInterval(() => setTick(Date.now()), 1000)
    return () => clearInterval(id)
  }, [clockedIn])
  useEffect(() => { if (clockMutation.isSuccess) refetch() }, [clockMutation.isSuccess, refetch])

  const state = now?.state || "not_clocked_in"
  const rec = now?.record
  const onLeave = state === "on_leave"
  const finished = state === "clocked_out"
  const canIn = !clockedIn && !onLeave && !finished && state !== "marked"

  const summary = useMemo(() => ({
    worked: history.filter((r) => r.status === "present" || r.status === "half_day").length,
    late: history.filter((r) => r.late).length,
    leave: history.filter((r) => r.status === "leave").length,
    hours: Math.round(history.reduce((n, r) => n + (r.totalHours || 0), 0) * 10) / 10,
  }), [history])

  const chip = (label, active, onClick) => (
    <button key={label} type="button" onClick={onClick} className={`rounded-full border px-3 py-1.5 text-[11px] font-bold transition active:scale-95 ${active ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-zinc-200 bg-white text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"}`}>{label}</button>
  )
  const setRange = (days) => { setMode("range"); setTo(today); setFrom(shiftDay(today, -(days - 1))) }
  const monthStart = `${today.slice(0, 8)}01`

  const input = "h-9 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/25 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"

  return (
    <div className="w-full space-y-4 p-4 text-zinc-900 dark:text-zinc-100 md:p-6">
      <div className="flex items-center gap-2">
        <CalendarCheck className="text-[var(--primary)]" />
        <div>
          <h1 className="text-xl font-black tracking-tight">My attendance</h1>
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Check in when your shift starts and check out when it ends.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(340px,420px)_1fr]">
      <div className="space-y-4">
      {/* today */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className={`h-1.5 ${clockedIn ? "bg-emerald-500" : onLeave ? "bg-amber-400" : finished ? "bg-sky-500" : "bg-zinc-300 dark:bg-zinc-700"}`} />
        <div className="space-y-4 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Today · {prettyDay(today)}</p>
              <p className="mt-0.5 text-base font-extrabold">
                {todayLoading ? "Loading…" : clockedIn ? "You are checked in" : onLeave ? "You are on leave today" : finished ? "Shift finished" : state === "marked" ? "Attendance marked by your manager" : "You have not checked in yet"}
              </p>
              {now?.shift && <p className="text-xs text-zinc-500">Shift: {now.shift.shiftName} · {now.shift.startTime} to {now.shift.endTime}</p>}
            </div>
            {clockedIn && rec?.checkInAt && (
              <div className="rounded-xl bg-emerald-50 px-3 py-2 text-center dark:bg-emerald-950/20">
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Working for</p>
                <p className="font-mono text-lg font-black text-emerald-700 dark:text-emerald-400">{hhmmss(tick - new Date(rec.checkInAt).getTime())}</p>
              </div>
            )}
          </div>

          {onLeave && (
            <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-800 dark:bg-amber-950/20 dark:text-amber-300">
              <CalendarOff size={15} className="mt-0.5 shrink-0" /> <span>{rec?.notes || "Leave marked by your store manager."}</span>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 text-center">
            {[["Checked in", clock(rec?.checkInAt), LogIn], ["Checked out", clock(rec?.checkOutAt), LogOut], ["Hours", rec?.checkOutAt ? `${rec.totalHours || 0} h` : "--", Timer]].map(([label, value, Icon]) => (
              <div key={label} className="rounded-xl bg-zinc-50 p-2.5 dark:bg-zinc-950">
                <Icon size={14} className="mx-auto text-zinc-400" />
                <p className="mt-1 text-sm font-black">{value}</p>
                <p className="text-[10px] font-semibold text-zinc-400">{label}</p>
              </div>
            ))}
          </div>
          {rec?.late && <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-600"><AlarmClock size={13} /> Checked in {rec.lateMinutes} min after the shift start</p>}

          <button
            type="button"
            disabled={clockMutation.isPending || (!clockedIn && !canIn)}
            onClick={() => {
              if (clockedIn) {
                if (window.confirm("Are you sure you want to check out? This will end your shift for today.")) {
                  clockMutation.mutate("out")
                }
              } else {
                clockMutation.mutate("in")
              }
            }}
            className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-extrabold text-white shadow-md transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${clockedIn ? "bg-rose-600" : "bg-emerald-600"}`}
          >
            {clockMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : clockedIn ? <LogOut size={16} /> : <LogIn size={16} />}
            {clockedIn ? "Check out" : finished ? "Shift finished for today" : onLeave ? "On leave today" : "Check in"}
          </button>
          {!clockedIn && canIn && (
            <p className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-500"><Info size={12} /> Kitchen actions stay locked until you check in.</p>
          )}
        </div>
      </motion.div>

      {/* filters */}
      <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center gap-2">
          {chip("Day", mode === "day", () => setMode("day"))}
          {chip("Date range", mode === "range", () => setMode("range"))}
          <span className="mx-1 h-4 w-px bg-zinc-200 dark:bg-zinc-700" />
          {chip("This week", mode === "range" && to === today && from === shiftDay(today, -6), () => setRange(7))}
          {chip("This month", mode === "range" && from === monthStart && to === today, () => { setMode("range"); setFrom(monthStart); setTo(today) })}
          {chip("Last 30 days", mode === "range" && to === today && from === shiftDay(today, -29), () => setRange(30))}
        </div>
        {mode === "day" ? (
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setDay(shiftDay(day, -1))} aria-label="Previous day" className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 active:scale-95 dark:border-zinc-800"><ChevronLeft size={16} /></button>
            <input type="date" value={day} max={today} onChange={(e) => e.target.value && setDay(e.target.value)} className={`${input} flex-1`} />
            <button type="button" disabled={day >= today} onClick={() => setDay(shiftDay(day, 1))} aria-label="Next day" className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 active:scale-95 disabled:opacity-40 dark:border-zinc-800"><ChevronRight size={16} /></button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-500">From <input type="date" value={from} max={to} onChange={(e) => e.target.value && setFrom(e.target.value)} className={input} /></label>
            <label className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-500">To <input type="date" value={to} min={from} max={today} onChange={(e) => e.target.value && setTo(e.target.value)} className={input} /></label>
          </div>
        )}
      </div>

      <LeaveRequestSection />
      </div>

      <div className="space-y-4">
      {/* summary */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {[["Days worked", summary.worked, CheckCircle2, "text-emerald-600"], ["Late arrivals", summary.late, AlarmClock, "text-amber-600"], ["Leave days", summary.leave, CalendarOff, "text-sky-600"], ["Hours worked", summary.hours, Clock, "text-[var(--primary)]"]].map(([label, value, Icon, color]) => (
          <div key={label} className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <Icon size={15} className={color} />
            <p className="mt-1 text-xl font-black">{value}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{label}</p>
          </div>
        ))}
      </div>

      {/* history */}
      <div className="grid grid-cols-1 gap-2.5 xl:grid-cols-2">
        {historyLoading && [0, 1, 2].map((n) => <div key={n} className="h-20 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800" />)}
        {!historyLoading && history.length === 0 && (
          <div className="rounded-2xl border border-dashed border-zinc-300 py-10 text-center dark:border-zinc-700 xl:col-span-2">
            <CalendarCheck className="mx-auto text-zinc-300" />
            <p className="mt-2 text-sm font-bold text-zinc-600 dark:text-zinc-300">No attendance for {mode === "day" ? prettyDay(day) : "these dates"}</p>
            <p className="text-xs text-zinc-400">Days you check in will show up here.</p>
          </div>
        )}
        {history.map((r) => {
          const st = STATUS[r.status] || STATUS.present
          return (
            <div key={r.id} className="rounded-2xl border border-zinc-200 bg-white p-3.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-extrabold">{prettyDay(r.date)}</p>
                <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${st.cls}`}>{st.label}</span>
              </div>
              {r.status === "leave" ? (
                <p className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-400">{r.notes || "Leave marked by your store manager"}</p>
              ) : (
                <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                  <div><p className="font-bold text-zinc-400">In</p><p className="font-black">{clock(r.checkInAt)}</p></div>
                  <div><p className="font-bold text-zinc-400">Out</p><p className="font-black">{r.checkOutAt ? clock(r.checkOutAt) : r.checkInAt ? "Working" : "--"}</p></div>
                  <div><p className="font-bold text-zinc-400">Hours</p><p className="font-black">{r.checkOutAt ? `${r.totalHours || 0} h` : "--"}</p></div>
                </div>
              )}
              {r.late && <p className="mt-2 text-[11px] font-semibold text-amber-600">Late by {r.lateMinutes} min</p>}
            </div>
          )
        })}
      </div>
      </div>
      </div>
    </div>
  )
}
