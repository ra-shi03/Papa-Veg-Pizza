import React, { useCallback, useEffect, useState } from "react"
import { Check, X, UserCheck, Loader2, Store, Clock } from "lucide-react"
import { toast } from "sonner"
import { adminClient } from "@/services/api/axios"

const ago = (value) => {
  if (!value) return ""
  const mins = Math.round((Date.now() - new Date(value).getTime()) / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs} hr ago`
  return `${Math.round(hrs / 24)} day(s) ago`
}

// Kitchen supervisors / staff that a store manager added. They cannot sign in or work until this panel approves them.
export default function StaffApprovalsPanel({ onDecided }) {
  const [rows, setRows] = useState([])
  const [busyId, setBusyId] = useState(null)
  const [rejecting, setRejecting] = useState(null) // { id, reason }

  const load = useCallback(async () => {
    try {
      const res = await adminClient.get("/staff-approvals", { params: { status: "Pending Approval" } })
      setRows(res?.data?.data?.staff || [])
    } catch (_) {
      // the rest of the page still works without this panel
    }
  }, [])

  useEffect(() => {
    load()
    const timer = setInterval(load, 60000)
    return () => clearInterval(timer)
  }, [load])

  const decide = async (id, approve, reason) => {
    setBusyId(id)
    try {
      await adminClient.patch(`/staff-approvals/${id}/${approve ? "approve" : "reject"}`, approve ? {} : { reason })
      toast.success(approve ? "Approved. They can sign in now." : "Request rejected.")
      setRejecting(null)
      setRows((list) => list.filter((r) => r._id !== id))
      onDecided?.()
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not save your decision")
      load()
    } finally {
      setBusyId(null)
    }
  }

  if (rows.length === 0) return null

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900/40 dark:bg-amber-950/10">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-white"><UserCheck size={16} /></span>
        <div>
          <h2 className="text-sm font-black text-slate-900 dark:text-white">Waiting for your approval ({rows.length})</h2>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Added by store managers. They can sign in and work only after you approve.</p>
        </div>
      </div>

      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r._id} className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold text-slate-900 dark:text-white">
                  {r.name} <span className="ml-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">{r.role || "Kitchen staff"}</span>
                </p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                  <span className="flex items-center gap-1"><Store size={11} /> {r.storeName || "Store"}</span>
                  <span>{r.email}</span>
                  <span>{r.phone}</span>
                  {r.addedBy && <span>Added by {r.addedBy}</span>}
                  <span className="flex items-center gap-1"><Clock size={11} /> {ago(r.createdAt)}</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={busyId === r._id}
                  onClick={() => setRejecting({ id: r._id, reason: "" })}
                  className="flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50 dark:border-rose-900/40 dark:hover:bg-rose-950/20"
                >
                  <X size={13} /> Reject
                </button>
                <button
                  type="button"
                  disabled={busyId === r._id}
                  onClick={() => decide(r._id, true)}
                  className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
                >
                  {busyId === r._id ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Approve
                </button>
              </div>
            </div>

            {rejecting?.id === r._id && (
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-dashed border-zinc-200 pt-3 dark:border-zinc-800">
                <input
                  autoFocus
                  value={rejecting.reason}
                  onChange={(e) => setRejecting({ id: r._id, reason: e.target.value.slice(0, 300) })}
                  placeholder="Reason for rejecting (the store manager will see it)"
                  className="min-w-[220px] flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[var(--primary)] dark:border-zinc-800 dark:bg-zinc-950"
                />
                <button type="button" onClick={() => setRejecting(null)} className="rounded-lg px-3 py-2 text-xs font-bold text-zinc-500">Cancel</button>
                <button
                  type="button"
                  disabled={!rejecting.reason.trim() || busyId === r._id}
                  onClick={() => decide(r._id, false, rejecting.reason.trim())}
                  className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                >
                  Confirm reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
