import React, { useEffect, useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { CalendarCheck, Search, Store, Download, CheckCircle2, AlarmClock, CalendarOff, Clock, Eye } from "lucide-react"
import { adminAPI } from "@food/api"
import { adminClient } from "@/services/api/axios"

// Read-only. Check in / check out are marked by kitchen staff themselves; leave is marked by the store
// manager. The franchise admin looks at one store at a time and cannot change anything here.

const pad = (n) => String(n).padStart(2, "0")
const keyOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const shiftDay = (key, n) => { const d = new Date(`${key}T00:00:00`); d.setDate(d.getDate() + n); return keyOf(d) }
const prettyDay = (key) => new Date(`${key}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })
const prettyShort = (key) => new Date(`${key}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
// leave written before requests existed keeps "Category: reason" in the note
const leaveCategory = (notes) => (String(notes || "").includes(": ") ? String(notes).split(": ")[0] : "Leave")
const leaveReason = (notes) => (String(notes || "").includes(": ") ? String(notes).split(": ").slice(1).join(": ") : notes || "No reason given")
const clock = (v) => (v ? new Date(v).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true }) : "--")

const STATUS = {
  present: { label: "Present", cls: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/40" },
  half_day: { label: "Half day", cls: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-900/40" },
  leave: { label: "On leave", cls: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/40" },
  absent: { label: "Absent", cls: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/40" },
}

export default function StaffAttendance() {
  const today = keyOf(new Date())
  const [storeId, setStoreId] = useState("")
  const [mode, setMode] = useState("day")
  const [day, setDay] = useState(today)
  const [from, setFrom] = useState(shiftDay(today, -6))
  const [to, setTo] = useState(today)
  const [status, setStatus] = useState("All")
  const [search, setSearch] = useState("")

  const { data: stores = [], isLoading: storesLoading } = useQuery({
    queryKey: ["franchiseStoresForAttendance"],
    queryFn: () => adminAPI.getStores({ limit: 1000 }).then((res) => res.data?.data?.stores || []),
  })
  useEffect(() => {
    if (!storeId && stores.length) setStoreId(String(stores[0]._id || stores[0].id))
  }, [stores, storeId])

  const params = { storeId, ...(mode === "day" ? { date: day } : { from, to }), ...(status !== "All" ? { status } : {}), ...(search.trim() ? { search: search.trim() } : {}), limit: 500 }
  const { data: rows = [], isLoading, isError } = useQuery({
    queryKey: ["franchiseStaffAttendance", params],
    enabled: !!storeId,
    queryFn: async () => (await adminClient.get("/store/attendance", { params })).data?.data || [],
  })

  const summary = useMemo(() => ({
    present: rows.filter((r) => r.status === "present" || r.status === "half_day").length,
    late: rows.filter((r) => r.late).length,
    leave: rows.filter((r) => r.status === "leave").length,
    hours: Math.round(rows.reduce((n, r) => n + (r.totalHours || 0), 0) * 10) / 10,
  }), [rows])

  const storeName = stores.find((s) => String(s._id || s.id) === storeId)?.storeName || ""
  const exportCsv = () => {
    const head = "Date,Name,Role,Employee Code,Check In,Check Out,Hours,Status,Late (min),Marked By,Reason\n"
    const body = rows.map((r) => [r.date, r.staffName, r.role, r.employeeCode, clock(r.checkInAt), clock(r.checkOutAt), r.totalHours || 0, r.status, r.lateMinutes || 0, r.source === "self" ? "Self" : "Store manager", (r.notes || "").replace(/"/g, "'")].map((v) => `"${v}"`).join(",")).join("\n")
    const url = URL.createObjectURL(new Blob([head + body], { type: "text/csv" }))
    const a = document.createElement("a"); a.href = url; a.download = `attendance_${storeName || "store"}_${mode === "day" ? day : `${from}_to_${to}`}.csv`; a.click(); URL.revokeObjectURL(url)
  }

  const input = "h-9 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/25 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
  const chip = (label, active, onClick) => (
    <button key={label} type="button" onClick={onClick} className={`rounded-full border px-3 py-1.5 text-[11px] font-bold transition active:scale-95 ${active ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-zinc-200 bg-white text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"}`}>{label}</button>
  )

  return (
    <div className="mx-auto max-w-7xl space-y-4 px-4 pb-6 pt-4 text-zinc-900 dark:text-zinc-100">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarCheck className="text-[var(--primary)]" />
          <div>
            <h1 className="text-xl font-black tracking-tight">Staff attendance</h1>
            <p className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400"><Eye size={12} /> View only. Staff check in and out themselves; the store manager marks leave.</p>
          </div>
        </div>
        <button type="button" onClick={exportCsv} disabled={!rows.length} className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-bold hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900">
          <Download size={13} /> Export CSV
        </button>
      </div>

      <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-[11px] font-bold text-zinc-500">
            <Store size={14} /> Store
            <select value={storeId} onChange={(e) => setStoreId(e.target.value)} className={`${input} min-w-[200px]`}>
              {storesLoading && <option>Loading stores…</option>}
              {stores.map((s) => <option key={s._id || s.id} value={String(s._id || s.id)}>{s.storeName}</option>)}
            </select>
          </label>
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or employee code" className={`${input} w-full pl-8`} />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={input}>
            <option value="All">All statuses</option>
            <option value="present">Present</option>
            <option value="half_day">Half day</option>
            <option value="leave">On leave</option>
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {chip("Day", mode === "day", () => setMode("day"))}
          {chip("Date range", mode === "range", () => setMode("range"))}
          <span className="mx-1 h-4 w-px bg-zinc-200 dark:bg-zinc-700" />
          {mode === "day" ? (
            <input type="date" value={day} max={today} onChange={(e) => e.target.value && setDay(e.target.value)} className={input} />
          ) : (
            <>
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-500">From <input type="date" value={from} max={to} onChange={(e) => e.target.value && setFrom(e.target.value)} className={input} /></label>
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-500">To <input type="date" value={to} min={from} max={today} onChange={(e) => e.target.value && setTo(e.target.value)} className={input} /></label>
              {chip("This week", to === today && from === shiftDay(today, -6), () => { setTo(today); setFrom(shiftDay(today, -6)) })}
              {chip("Last 30 days", to === today && from === shiftDay(today, -29), () => { setTo(today); setFrom(shiftDay(today, -29)) })}
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[["Present", summary.present, CheckCircle2, "text-emerald-600"], ["Late arrivals", summary.late, AlarmClock, "text-amber-600"], ["On leave", summary.leave, CalendarOff, "text-sky-600"], ["Hours worked", summary.hours, Clock, "text-[var(--primary)]"]].map(([label, value, Icon, color]) => (
          <div key={label} className="rounded-2xl border border-zinc-200 bg-white p-3.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <Icon size={16} className={color} />
            <p className="mt-1 text-2xl font-black">{value}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{label}</p>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full min-w-[760px] text-left text-xs">
          <thead className="border-b border-zinc-100 bg-zinc-50 text-[10px] font-black uppercase tracking-wider text-zinc-400 dark:border-zinc-800 dark:bg-zinc-950">
            <tr>
              {["Date", "Staff", "Check in", "Check out", "Hours", "Status", "Marked by", "Leave details"].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {(isLoading || storesLoading) && [0, 1, 2, 3].map((n) => <tr key={n}><td colSpan={8} className="px-4 py-3"><div className="h-6 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" /></td></tr>)}
            {!isLoading && isError && <tr><td colSpan={8} className="px-4 py-10 text-center font-semibold text-rose-500">Could not load attendance for this store.</td></tr>}
            {!isLoading && !isError && storeId && rows.length === 0 && <tr><td colSpan={8} className="px-4 py-10 text-center font-semibold text-zinc-400">No attendance for these dates.</td></tr>}
            {rows.map((r) => {
              const st = STATUS[r.status] || STATUS.present
              return (
                <tr key={r.id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-950/40">
                  <td className="whitespace-nowrap px-4 py-3 font-bold">{prettyDay(r.date)}</td>
                  <td className="px-4 py-3"><p className="font-extrabold">{r.staffName}</p><p className="text-[10px] text-zinc-400">{r.role} · {r.employeeCode}</p></td>
                  <td className="px-4 py-3 font-semibold">{clock(r.checkInAt)}{r.late && <span className="ml-1.5 rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-black text-amber-700">+{r.lateMinutes}m</span>}</td>
                  <td className="px-4 py-3 font-semibold">{r.checkOutAt ? clock(r.checkOutAt) : r.checkInAt ? <span className="text-emerald-600">Working</span> : "--"}</td>
                  <td className="px-4 py-3 font-semibold">{r.checkOutAt ? `${r.totalHours || 0} h` : "--"}</td>
                  <td className="px-4 py-3"><span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${st.cls}`}>{st.label}</span></td>
                  <td className="px-4 py-3 text-zinc-500">{r.status === "leave" ? `Approved by ${r.leave?.approvedBy || r.markedBy || "store manager"}` : r.source === "self" ? "Self" : r.markedBy || "Store manager"}</td>
                  <td className="max-w-[300px] px-4 py-3">
                    {r.status === "leave" ? (
                      <div className="space-y-1">
                        <p className="flex flex-wrap items-center gap-1.5">
                          <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-extrabold uppercase text-sky-700 dark:bg-sky-950/20 dark:text-sky-400">{r.leave?.category || leaveCategory(r.notes)}</span>
                          {r.leave && r.leave.days > 1 && <span className="text-[10px] font-semibold text-zinc-400">{prettyShort(r.leave.startDate)} to {prettyShort(r.leave.endDate)} · {r.leave.days} days</span>}
                        </p>
                        <p className="break-words font-medium text-zinc-700 dark:text-zinc-200">{r.leave?.reason || leaveReason(r.notes)}</p>
                      </div>
                    ) : (
                      <span className="text-zinc-400">--</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
