import React, { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { CalendarCheck2, Check, X, Search, Clock, Loader2, ShieldCheck, ShieldX, Inbox } from "lucide-react"
import apiClient from "@/services/api/axios"

// The store manager accepts or rejects leave asked for by kitchen staff. A rejection needs a reason.

const TABS = [
  { key: "pending", label: "Pending", icon: Clock, tone: "text-amber-600 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40" },
  { key: "approved", label: "Approved", icon: ShieldCheck, tone: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40" },
  { key: "rejected", label: "Rejected", icon: ShieldX, tone: "text-rose-600 bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40" },
]
const pretty = (key) => new Date(`${key}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })
const ago = (v) => {
  if (!v) return ""
  const mins = Math.round((Date.now() - new Date(v).getTime()) / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.round(mins / 60)
  return hrs < 24 ? `${hrs} hr ago` : new Date(v).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
}

export default function LeaveRequests() {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState("pending")
  const [search, setSearch] = useState("")
  const [busyId, setBusyId] = useState(null)
  const [rejecting, setRejecting] = useState(null)

  const params = { status: tab, ...(search.trim() ? { search: search.trim() } : {}) }
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["leaveRequests", params],
    queryFn: async () => (await apiClient.get("/store/leave-requests", { params })).data?.data || { requests: [], counts: {} },
    refetchInterval: 45000,
  })
  const rows = data?.requests || []
  const counts = data?.counts || {}

  const decide = async (id, approve, reason) => {
    setBusyId(id)
    try {
      const res = await apiClient.patch(`/store/leave-requests/${id}/${approve ? "approve" : "reject"}`, approve ? {} : { reason })
      const skipped = res.data?.data?.skippedDays?.length
      toast.success(approve ? `Leave approved${skipped ? `. ${skipped} day(s) they had already worked were left as they are.` : "."}` : "Leave rejected. They can see your reason.")
      setRejecting(null)
      queryClient.invalidateQueries({ queryKey: ["leaveRequests"] })
      queryClient.invalidateQueries({ queryKey: ["kitchenAttendance"] })
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not save your decision")
      refetch()
    } finally {
      setBusyId(null)
    }
  }
  const input = "h-9 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-primary/25 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"

  return (
    <div className="w-full space-y-4 p-4 text-zinc-900 dark:text-zinc-100 md:p-6">
      <div className="flex items-center gap-2">
        <CalendarCheck2 className="text-primary" />
        <div>
          <h1 className="text-xl font-black tracking-tight">Leave requests</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Accept or reject the leave your kitchen staff ask for. Accepted leave appears in Attendance.</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {TABS.map((t) => {
          const Icon = t.icon
          const on = tab === t.key
          return (
            <button key={t.key} type="button" onClick={() => setTab(t.key)} aria-pressed={on}
              className={`rounded-2xl border p-3.5 text-left transition active:scale-[0.98] ${on ? `${t.tone} shadow-sm` : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"}`}>
              <Icon size={16} className={on ? "" : "text-zinc-400"} />
              <p className="mt-1 text-2xl font-black">{counts[t.key] ?? 0}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">{t.label}</p>
            </button>
          )
        })}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name" className={`${input} w-full pl-8`} />
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        {isLoading && [0, 1].map((n) => <div key={n} className="h-32 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800" />)}
        {isError && <p className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-sm font-semibold text-rose-600 xl:col-span-2">Could not load leave requests. <button type="button" onClick={() => refetch()} className="underline">Try again</button></p>}
        {!isLoading && !isError && rows.length === 0 && (
          <div className="rounded-2xl border border-dashed border-zinc-300 py-14 text-center dark:border-zinc-700 xl:col-span-2">
            <Inbox className="mx-auto text-zinc-300" size={32} />
            <p className="mt-2 text-sm font-bold text-zinc-600 dark:text-zinc-300">{tab === "pending" ? "No leave requests are waiting" : `No ${tab} requests`}</p>
          </div>
        )}

        {rows.map((r) => (
          <div key={r.id} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-black text-primary">{(r.staffName || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold">{r.staffName} <span className="ml-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">{r.role}</span></p>
                  <p className="text-[11px] text-zinc-400">Asked {ago(r.createdAt)}</p>
                </div>
              </div>
              <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[10px] font-extrabold uppercase text-sky-700 dark:bg-sky-950/20 dark:text-sky-400">{r.category}</span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-zinc-50 p-3 text-xs dark:bg-zinc-950">
              <div><p className="font-bold text-zinc-400">From</p><p className="font-black">{pretty(r.startDate)}</p></div>
              <div><p className="font-bold text-zinc-400">To</p><p className="font-black">{pretty(r.endDate)}</p></div>
            </div>
            <p className="mt-2 text-[11px] font-bold text-zinc-400">{r.days} day{r.days === 1 ? "" : "s"}</p>
            <p className="mt-1 break-words text-xs font-medium text-zinc-700 dark:text-zinc-200"><b>Reason:</b> {r.reason}</p>

            {tab === "rejected" && r.rejectionReason && <p className="mt-2 rounded-lg bg-rose-50 p-2.5 text-xs font-medium text-rose-700 dark:bg-rose-950/20 dark:text-rose-300"><b>Rejected:</b> {r.rejectionReason}</p>}
            {tab !== "pending" && r.decidedAt && <p className="mt-2 text-[11px] text-zinc-400">{r.decidedByName ? `By ${r.decidedByName} · ` : ""}{ago(r.decidedAt)}</p>}
            {tab === "approved" && r.skippedDays?.length > 0 && <p className="mt-1 text-[11px] font-medium text-amber-600">{r.skippedDays.length} day(s) already worked were not changed.</p>}

            {tab === "pending" && (
              rejecting?.id === r.id ? (
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-dashed border-zinc-200 pt-3 dark:border-zinc-800">
                  <input autoFocus value={rejecting.reason} onChange={(e) => setRejecting({ id: r.id, reason: e.target.value.slice(0, 300) })} placeholder="Reason for rejecting (they will see it)" className={`${input} min-w-[200px] flex-1`} />
                  <button type="button" onClick={() => setRejecting(null)} className="rounded-lg px-3 py-2 text-xs font-bold text-zinc-500">Cancel</button>
                  <button type="button" disabled={!rejecting.reason.trim() || busyId === r.id} onClick={() => decide(r.id, false, rejecting.reason.trim())} className="rounded-lg bg-rose-600 px-3.5 py-2 text-xs font-bold text-white disabled:opacity-50">Confirm reject</button>
                </div>
              ) : (
                <div className="mt-3 flex justify-end gap-2 border-t border-dashed border-zinc-200 pt-3 dark:border-zinc-800">
                  <button type="button" disabled={busyId === r.id} onClick={() => setRejecting({ id: r.id, reason: "" })} className="flex items-center gap-1 rounded-lg border border-rose-200 px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50 dark:border-rose-900/40 dark:hover:bg-rose-950/20"><X size={13} /> Reject</button>
                  <button type="button" disabled={busyId === r.id} onClick={() => decide(r.id, true)} className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50">
                    {busyId === r.id ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Accept
                  </button>
                </div>
              )
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
