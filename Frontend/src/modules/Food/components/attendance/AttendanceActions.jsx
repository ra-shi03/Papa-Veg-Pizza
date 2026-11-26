import { useEffect, useState } from "react"
import { Loader2, X, UserCheck, CalendarOff, Check, XCircle } from "lucide-react"
import { toast } from "sonner"
import { adminClient } from "@/services/api/axios"

// Attendance actions for the people who manage it (the server decides what each may do):
//   store manager   -> mark a kitchen staff member present (hours worked), absent or on leave. Kitchen staff have no
//                      login: the manager also clocks them in / out from Staff > Attendance (StaffClockPanel)
//   franchise admin -> mark the store manager or any staff member present (on behalf, e.g. the clock-in failed), absent
//                      or on leave, and decide leave requests (the store manager's own, and staff ones when the manager is away)
// `storeId` is sent only by the franchise admin; the store manager's store comes from their sign-in.

const errText = (e) => e?.response?.data?.message || e?.response?.data?.error || e?.message || "That did not work"
const pad = (n) => String(n).padStart(2, "0")
const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }
const to12 = (hhmm) => {
  if (!hhmm) return ""
  const [h, m] = hhmm.split(":").map(Number)
  return `${pad(((h + 11) % 12) + 1)}:${pad(m)} ${h < 12 ? "AM" : "PM"}`
}
const input = "w-full h-10 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-semibold outline-none focus:border-[var(--primary)]"

export function MarkAttendanceModal({ open, onClose, onDone, storeId, admin = false }) {
  const [people, setPeople] = useState([])
  const [form, setForm] = useState({ staffId: "", date: todayKey(), status: admin ? "present" : "absent", checkIn: "", checkOut: "", notes: "" })
  const [busy, setBusy] = useState(false)
  const params = storeId ? { storeId } : {}

  useEffect(() => {
    if (!open) return
    setForm((f) => ({ ...f, staffId: "", notes: "", checkIn: "", checkOut: "" }))
    adminClient.get("/store/attendance/people", { params })
      .then((res) => setPeople(res?.data?.data || []))
      .catch((e) => toast.error(errText(e)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, storeId])

  if (!open) return null
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const statuses = admin ? [["present", "Present (on behalf)"], ["absent", "Absent"], ["leave", "On leave"]] : [["present", "Present (hours worked)"], ["absent", "Absent"], ["leave", "On leave"]]

  const save = async () => {
    setBusy(true)
    try {
      await adminClient.post("/store/attendance", {
        staffId: form.staffId, date: form.date, status: form.status, notes: form.notes.trim(),
        ...(form.status === "present" ? { checkIn: to12(form.checkIn), ...(form.checkOut ? { checkOut: to12(form.checkOut) } : {}) } : {}),
      }, { params })
      toast.success(admin ? "Attendance marked. The person has been told." : "Attendance marked.")
      onDone?.()
      onClose()
    } catch (e) {
      toast.error(errText(e))
    } finally {
      setBusy(false)
    }
  }

  const ready = form.staffId && form.date && form.notes.trim().length >= 5 && (form.status !== "present" || form.checkIn)
  return (
    <div className="fixed inset-0 z-[300] bg-black/40 flex items-center justify-center p-4" onClick={() => !busy && onClose()}>
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-black text-zinc-900 dark:text-white inline-flex items-center gap-2"><UserCheck size={16} />Mark attendance</h2>
            <p className="text-[11px] text-zinc-500 font-medium">
              {admin ? "For a store manager or staff member who could not clock in, or is absent / on leave." : "For a past day or a missed clock-in (give the hours), or to mark someone absent or on leave. For today, use Clock in / Clock out on the Attendance page."}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"><X size={16} /></button>
        </div>
        <select className={input} value={form.staffId} onChange={set("staffId")}>
          <option value="">Choose a person</option>
          {people.map((p) => (
            <option key={p.staffId} value={p.staffId}>
              {p.name}{p.isManager ? " (Store manager)" : ` (${p.role})`}{p.today ? ` · today: ${p.today.clockedIn ? "clocked in" : p.today.status}` : " · not marked today"}
            </option>
          ))}
        </select>
        <div className="grid grid-cols-2 gap-2">
          <input type="date" className={input} value={form.date} max={todayKey()} onChange={set("date")} />
          <select className={input} value={form.status} onChange={set("status")}>
            {statuses.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        {form.status === "present" && (
          <div className="grid grid-cols-2 gap-2">
            <label className="text-[10px] font-bold text-zinc-500">Started at<input type="time" className={input} value={form.checkIn} onChange={set("checkIn")} /></label>
            <label className="text-[10px] font-bold text-zinc-500">Finished at (optional)<input type="time" className={input} value={form.checkOut} onChange={set("checkOut")} /></label>
          </div>
        )}
        <textarea className={`${input} h-20 py-2`} maxLength={300} placeholder="Reason (required), e.g. phone not working, confirmed on call" value={form.notes} onChange={set("notes")} />
        <p className="text-[10px] text-zinc-400 font-medium">Only today and the last 7 days. A day the person clocked themselves cannot be changed. Your name is saved on the record.</p>
        <div className="flex gap-2">
          <button disabled={busy || !ready} onClick={save} className="px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-xs font-bold disabled:opacity-50 cursor-pointer inline-flex items-center gap-1.5">{busy && <Loader2 size={12} className="animate-spin" />}Save</button>
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-bold cursor-pointer">Cancel</button>
        </div>
      </div>
    </div>
  )
}

/** A marked day (leave / absent / on-behalf present) can be taken back by whoever may change it. */
export async function undoMark(recordId, storeId) {
  try {
    await adminClient.delete(`/store/attendance/${recordId}`, { params: storeId ? { storeId } : {} })
    toast.success("Mark removed. The person can clock in.")
    return true
  } catch (e) {
    toast.error(errText(e))
    return false
  }
}

/** Waiting leave requests of one store, for the franchise admin (the store manager's own, and staff ones). */
export function LeaveQueue({ storeId, onChanged }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [busyId, setBusyId] = useState("")
  const load = async () => {
    if (!storeId) return
    setLoading(true)
    try {
      const res = await adminClient.get("/store/leave-requests", { params: { storeId, status: "pending" } })
      setRows(res?.data?.data?.requests || [])
    } catch (e) {
      toast.error(errText(e))
    } finally {
      setLoading(false)
    }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [storeId])

  const decide = async (r, approve) => {
    let reason = ""
    if (!approve) {
      reason = window.prompt(`Why is ${r.staffName}'s leave rejected?`) || ""
      if (!reason.trim()) return
    }
    setBusyId(r._id)
    try {
      await adminClient.patch(`/store/leave-requests/${r._id}/${approve ? "approve" : "reject"}`, approve ? {} : { reason }, { params: { storeId } })
      toast.success(approve ? "Leave approved" : "Leave rejected")
      await load()
      onChanged?.()
    } catch (e) {
      toast.error(errText(e))
    } finally {
      setBusyId("")
    }
  }

  if (!storeId) return null
  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-2">
      <p className="text-sm font-black inline-flex items-center gap-2"><CalendarOff size={15} />Leave requests waiting</p>
      {loading ? <p className="text-xs text-zinc-400">Loading...</p> : rows.length === 0 ? (
        <p className="text-xs text-zinc-400 font-semibold">Nothing waiting.</p>
      ) : (
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {rows.map((r) => (
            <li key={r._id} className="py-2 flex items-center gap-3 text-xs">
              <div className="flex-1 min-w-0">
                <p className="font-extrabold">{r.staffName} <span className="text-[10px] text-zinc-400">{r.role}</span></p>
                <p className="text-zinc-500">{r.category} · {r.startDate}{r.endDate !== r.startDate ? ` to ${r.endDate}` : ""} · {r.days} day{r.days > 1 ? "s" : ""}: {r.reason}</p>
              </div>
              <button disabled={busyId === r._id} onClick={() => decide(r, true)} className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white font-bold inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"><Check size={12} />Approve</button>
              <button disabled={busyId === r._id} onClick={() => decide(r, false)} className="px-2.5 py-1.5 rounded-lg border border-rose-300 text-rose-700 font-bold inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"><XCircle size={12} />Reject</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
