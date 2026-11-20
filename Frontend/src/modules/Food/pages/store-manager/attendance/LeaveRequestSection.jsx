import React, { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { CalendarPlus, CalendarOff, X, Loader2, Clock, CheckCircle2, XCircle, Ban } from "lucide-react"
import apiClient from "@/services/api/axios"
import { localToday } from "../staffManagement/localToday"

// Kitchen staff ask for leave here; the store manager accepts or rejects it (with a reason).

export const LEAVE_CATEGORIES = ["Sick", "Personal", "Emergency", "Vacation", "Other"]

const STATUS = {
  pending: { label: "Waiting", icon: Clock, cls: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/40" },
  approved: { label: "Approved", icon: CheckCircle2, cls: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/40" },
  rejected: { label: "Rejected", icon: XCircle, cls: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/40" },
  cancelled: { label: "Cancelled", icon: Ban, cls: "bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700" },
}
const pretty = (key) => new Date(`${key}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
const span = (r) => (r.startDate === r.endDate ? pretty(r.startDate) : `${pretty(r.startDate)} to ${pretty(r.endDate)}`)

export function useMyLeaveRequests() {
  return useQuery({ queryKey: ["myLeaveRequests"], queryFn: async () => (await apiClient.get("/store/leave-requests/mine")).data?.data || [] })
}

function RequestModal({ onClose }) {
  const queryClient = useQueryClient()
  const today = localToday()
  const [category, setCategory] = useState("Sick")
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(today)
  const [reason, setReason] = useState("")
  const [error, setError] = useState("")

  const send = useMutation({
    mutationFn: async () => (await apiClient.post("/store/leave-requests", { category, startDate, endDate, reason: reason.trim() })).data,
    onSuccess: () => {
      toast.success("Leave request sent to your store manager")
      queryClient.invalidateQueries({ queryKey: ["myLeaveRequests"] })
      onClose()
    },
    onError: (err) => setError(err?.response?.data?.message || err?.message || "Could not send your request"),
  })

  const submit = (e) => {
    e.preventDefault()
    if (endDate < startDate) return setError("The last day cannot be before the first day.")
    if (reason.trim().length < 3) return setError("Please write the reason for your leave.")
    setError("")
    send.mutate()
  }
  const input = "h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-xs font-semibold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/25 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
  const days = Math.max(1, Math.round((new Date(`${endDate}T00:00:00`) - new Date(`${startDate}T00:00:00`)) / 86400000) + 1)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-[2px] sm:items-center" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="w-full max-w-md space-y-4 rounded-t-3xl bg-white p-5 shadow-2xl dark:bg-zinc-900 sm:rounded-3xl">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-base font-extrabold"><CalendarPlus size={18} className="text-[var(--primary)]" /> Request leave</h2>
            <p className="text-xs text-zinc-500">Your store manager will accept or reject it.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"><X size={16} /></button>
        </div>

        {error && <p role="alert" className="rounded-xl bg-rose-50 p-2.5 text-xs font-bold text-rose-700 dark:bg-rose-950/20 dark:text-rose-400">{error}</p>}

        <div className="space-y-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Leave category</span>
          <div className="flex flex-wrap gap-2">
            {LEAVE_CATEGORIES.map((c) => (
              <button type="button" key={c} onClick={() => setCategory(c)} aria-pressed={category === c}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition active:scale-95 ${category === c ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-zinc-200 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"}`}>{c}</button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1.5"><span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Start date</span>
            <input type="date" value={startDate} min={today} onChange={(e) => { setStartDate(e.target.value); if (endDate < e.target.value) setEndDate(e.target.value) }} className={input} /></label>
          <label className="space-y-1.5"><span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">End date</span>
            <input type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} className={input} /></label>
        </div>
        <p className="-mt-2 text-[11px] font-semibold text-zinc-400">{days} day{days === 1 ? "" : "s"}</p>

        <label className="block space-y-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Reason <span className="text-rose-500">*</span></span>
          <textarea value={reason} onChange={(e) => setReason(e.target.value.slice(0, 300))} rows={3} placeholder="e.g. I have a fever and the doctor advised rest."
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs font-semibold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/25 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100" />
          <span className="block text-right text-[10px] font-medium text-zinc-400">{reason.length}/300</span>
        </label>

        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-zinc-200 py-3 text-xs font-bold dark:border-zinc-700">Cancel</button>
          <button type="submit" disabled={send.isPending} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[var(--primary)] py-3 text-xs font-bold text-white disabled:opacity-60">
            {send.isPending && <Loader2 size={13} className="animate-spin" />} Send request
          </button>
        </div>
      </form>
    </div>
  )
}

export default function LeaveRequestSection() {
  const queryClient = useQueryClient()
  const { data: requests = [], isLoading } = useMyLeaveRequests()
  const [open, setOpen] = useState(false)
  const cancel = useMutation({
    mutationFn: async (id) => (await apiClient.patch(`/store/leave-requests/${id}/cancel`)).data,
    onSuccess: () => { toast.success("Request withdrawn"); queryClient.invalidateQueries({ queryKey: ["myLeaveRequests"] }) },
    onError: (err) => toast.error(err?.response?.data?.message || "Could not withdraw the request"),
  })

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-extrabold"><CalendarOff size={16} className="text-[var(--primary)]" /> My leave requests</h2>
        <button type="button" onClick={() => setOpen(true)} className="flex items-center gap-1 rounded-lg bg-[var(--primary)] px-3 py-1.5 text-[11px] font-bold text-white active:scale-95"><CalendarPlus size={13} /> Request leave</button>
      </div>

      <div className="mt-3 space-y-2">
        {isLoading && <div className="h-14 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />}
        {!isLoading && requests.length === 0 && <p className="py-4 text-center text-xs font-medium text-zinc-400">You have not asked for any leave yet.</p>}
        {requests.map((r) => {
          const st = STATUS[r.status] || STATUS.pending
          const Icon = st.icon
          return (
            <div key={r.id} className="rounded-xl border border-zinc-100 p-3 dark:border-zinc-800">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-extrabold">{r.category} leave · {r.days} day{r.days === 1 ? "" : "s"}</p>
                  <p className="text-[11px] text-zinc-500">{span(r)}</p>
                </div>
                <span className={`flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${st.cls}`}><Icon size={11} /> {st.label}</span>
              </div>
              <p className="mt-1.5 break-words text-[11px] text-zinc-600 dark:text-zinc-300">{r.reason}</p>
              {r.status === "rejected" && r.rejectionReason && <p className="mt-1.5 rounded-lg bg-rose-50 p-2 text-[11px] font-medium text-rose-700 dark:bg-rose-950/20 dark:text-rose-300"><b>Reason:</b> {r.rejectionReason}</p>}
              {r.status === "approved" && r.decidedByName && <p className="mt-1 text-[10px] text-zinc-400">Approved by {r.decidedByName}</p>}
              {r.status === "pending" && (
                <button type="button" disabled={cancel.isPending} onClick={() => cancel.mutate(r.id)} className="mt-2 text-[11px] font-bold text-rose-600 hover:underline disabled:opacity-50">Withdraw request</button>
              )}
            </div>
          )
        })}
      </div>
      {open && <RequestModal onClose={() => setOpen(false)} />}
    </div>
  )
}
