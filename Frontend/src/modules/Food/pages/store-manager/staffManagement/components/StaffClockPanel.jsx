import { useCallback, useEffect, useState } from "react"
import { Loader2, LogIn, LogOut, Users } from "lucide-react"
import { toast } from "sonner"
import { adminClient } from "@/services/api/axios"

// Today's kitchen team with a Clock in / Clock out button each. Kitchen staff have no login, so the store manager clocks
// them in when they start and out when they leave (POST /store/attendance/staff/:staffId/clock-in | clock-out). Only people
// clocked in can be put on a station.
const errText = (e) => e?.response?.data?.message || e?.response?.data?.error || e?.message || "That did not work"

const stateOf = (p) => {
  const t = p.today
  if (!t) return { label: "Not clocked in", tone: "text-zinc-500 bg-zinc-100 dark:bg-zinc-800", canIn: true }
  if (t.clockedIn) return { label: "Clocked in", tone: "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400", canOut: true }
  if (t.status === "leave") return { label: "On leave", tone: "text-blue-700 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400" }
  if (t.status === "absent") return { label: "Absent", tone: "text-rose-700 bg-rose-50 dark:bg-rose-950/30 dark:text-rose-400" }
  return { label: "Worked today", tone: "text-amber-700 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400" }
}

export default function StaffClockPanel({ onChanged }) {
  const [people, setPeople] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState("")

  const load = useCallback(() => {
    setLoading(true)
    adminClient.get("/store/attendance/people")
      .then((res) => setPeople((res?.data?.data || []).filter((p) => !p.isManager)))
      .catch((e) => toast.error(errText(e)))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const clock = async (person, action) => {
    setBusyId(person.staffId)
    try {
      await adminClient.post(`/store/attendance/staff/${person.staffId}/clock-${action}`)
      toast.success(`${person.name} clocked ${action}.`)
      load()
      onChanged?.()
    } catch (e) {
      toast.error(errText(e))
    } finally {
      setBusyId("")
    }
  }

  return (
    <section className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-zinc-150 dark:border-zinc-850 shadow-sm space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-black text-slate-900 dark:text-white inline-flex items-center gap-2"><Users size={15} />Today's kitchen team</h2>
          <p className="text-[11px] text-zinc-500 font-medium">Kitchen staff do not sign in: clock them in when they start and out when they leave. Only people clocked in can be put on a station.</p>
        </div>
        {loading && <Loader2 size={16} className="animate-spin text-zinc-400 shrink-0" />}
      </div>
      {!loading && people.length === 0 ? (
        <p className="text-xs text-zinc-500 font-medium py-3">No approved kitchen staff yet. Add them under Kitchen Staff; the franchise admin approves new staff.</p>
      ) : (
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {people.map((p) => {
            const st = stateOf(p)
            const busy = busyId === p.staffId
            return (
              <li key={p.staffId} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{p.name}</p>
                  <p className="text-[10px] text-zinc-500 font-semibold">{p.role}{p.employeeCode ? ` · ${p.employeeCode}` : ""}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${st.tone}`}>{st.label}</span>
                  {st.canIn && (
                    <button type="button" disabled={busy} onClick={() => clock(p, "in")}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-600 text-white text-[11px] font-bold cursor-pointer disabled:opacity-50">
                      {busy ? <Loader2 size={12} className="animate-spin" /> : <LogIn size={12} />}Clock in
                    </button>
                  )}
                  {st.canOut && (
                    <button type="button" disabled={busy} onClick={() => clock(p, "out")}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-zinc-800 dark:bg-zinc-700 text-white text-[11px] font-bold cursor-pointer disabled:opacity-50">
                      {busy ? <Loader2 size={12} className="animate-spin" /> : <LogOut size={12} />}Clock out
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
