import { useCallback, useEffect, useMemo, useState } from "react"
import { Loader2, RefreshCw, Search, Phone, X, Send, Clock } from "lucide-react"
import { toast } from "sonner"
import { adminClient } from "@/services/api/axios"

// Tickets the delivery partners raised in the delivery app, for the people who run them: the store manager (own store's
// riders) and the franchise admin (every store of the franchise). They reply to the rider and move the status.
// `base` is the API path; `canClose` is false for the store manager (only the franchise admin closes a ticket).
const REAL = { _isFallback: true }
const STATUS = {
  open: { label: "Open", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  in_progress: { label: "In progress", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  resolved: { label: "Resolved", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  closed: { label: "Closed", cls: "bg-zinc-100 text-zinc-600 border-zinc-200" },
}
const PRIORITY = { low: "text-zinc-500", medium: "text-amber-600", high: "text-orange-600", urgent: "text-red-600" }
const CATEGORY = { payment: "Payment", order: "Order", account: "Account", technical: "App issue", other: "Other" }
const when = (v) => (v ? new Date(v).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "")
const roleLabel = { STORE_MANAGER: "Store manager", FRANCHISE_ADMIN: "Franchise admin", SUPER_ADMIN: "Super admin" }
const err = (e) => e?.response?.data?.error || e?.response?.data?.message || e?.message || "That did not work"

export default function RiderTicketsDesk({ base, title = "Rider Tickets", canClose = true }) {
  const [tickets, setTickets] = useState([])
  const [stats, setStats] = useState({ open: 0, in_progress: 0, resolved: 0, closed: 0 })
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState("")
  const [search, setSearch] = useState("")
  const [openId, setOpenId] = useState(null)
  const [reply, setReply] = useState("")
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminClient.get(base, { ...REAL, params: { limit: 200 } })
      const d = res?.data?.data || {}
      setTickets(d.tickets || [])
      setStats(d.stats || {})
    } catch (e) {
      toast.error(err(e))
    } finally {
      setLoading(false)
    }
  }, [base])
  useEffect(() => { load() }, [load])

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase()
    return tickets.filter((t) => (!status || t.status === status)
      && (!q || [t.subject, t.ticketId, t.deliveryPartner?.name, t.description].some((v) => String(v || "").toLowerCase().includes(q))))
  }, [tickets, status, search])

  const current = tickets.find((t) => t._id === openId) || null
  const act = async (body, done) => {
    setSaving(true)
    try {
      const res = await adminClient.patch(`${base}/${openId}`, body, REAL)
      const next = res?.data?.data
      if (next) setTickets((list) => list.map((t) => (t._id === next._id ? { ...t, ...next } : t)))
      toast.success(done)
      setReply("")
      load()
    } catch (e) {
      toast.error(err(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{title}</h1>
          <p className="text-xs text-zinc-500 font-medium">What delivery partners raised in their app. Reply and update the status; the rider sees it in their app.</p>
        </div>
        <button onClick={load} className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 cursor-pointer" title="Refresh"><RefreshCw size={15} /></button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {Object.entries(STATUS).map(([key, s]) => (
          <button key={key} onClick={() => setStatus(status === key ? "" : key)}
            className={`text-left rounded-xl border p-3 cursor-pointer transition-all ${status === key ? "ring-2 ring-[var(--primary)]" : ""} bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800`}>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">{s.label}</span>
            <span className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{stats[key] || 0}</span>
          </button>
        ))}
      </div>

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by topic, ticket ID or rider"
          className="w-full h-10 pl-9 pr-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold outline-none" />
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" /></div>
        ) : shown.length === 0 ? (
          <p className="py-16 text-center text-xs font-semibold text-zinc-400">{tickets.length ? "No ticket matches." : "No rider has raised a ticket yet."}</p>
        ) : (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {shown.map((t) => (
              <li key={t._id}>
                <button onClick={() => { setOpenId(t._id); setReply("") }} className="w-full text-left px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-950 cursor-pointer flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">#{t.ticketId}</span>
                      <span className={`text-[10px] font-bold uppercase ${PRIORITY[t.priority]}`}>{t.priority}</span>
                      <span className="text-[10px] font-semibold text-zinc-400">{CATEGORY[t.category] || t.category}</span>
                    </div>
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate mt-0.5">{t.subject}</p>
                    <p className="text-[11px] text-zinc-500 font-medium truncate">{t.deliveryPartner?.name || "Rider"}{t.storeName ? ` · ${t.storeName}` : ""} · {when(t.createdAt)}</p>
                  </div>
                  <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-full border ${STATUS[t.status]?.cls}`}>{STATUS[t.status]?.label}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {current && (
        <div className="fixed inset-0 z-[300] bg-black/40 flex justify-end" onClick={() => !saving && setOpenId(null)}>
          <div className="w-full max-w-md h-full bg-white dark:bg-zinc-900 overflow-y-auto p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">#{current.ticketId}</span>
                <h2 className="text-base font-black text-zinc-900 dark:text-zinc-100 mt-1">{current.subject}</h2>
              </div>
              <button onClick={() => setOpenId(null)} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"><X size={16} /></button>
            </div>

            <div className="flex flex-wrap gap-2 text-[10px] font-bold">
              <span className={`px-2 py-1 rounded-full border ${STATUS[current.status]?.cls}`}>{STATUS[current.status]?.label}</span>
              <span className={`px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 uppercase ${PRIORITY[current.priority]}`}>{current.priority}</span>
              <span className="px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600">{CATEGORY[current.category] || current.category}</span>
            </div>

            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 text-xs space-y-1">
              <p className="font-extrabold text-zinc-900 dark:text-zinc-100">{current.deliveryPartner?.name || "Rider"}{current.deliveryPartner?.vehicleType ? ` · ${current.deliveryPartner.vehicleType}` : ""}</p>
              {current.deliveryPartner?.phone && (
                <a href={`tel:${current.deliveryPartner.phone}`} className="inline-flex items-center gap-1.5 text-[var(--primary)] font-bold"><Phone size={12} />{current.deliveryPartner.phone}</a>
              )}
              <p className="text-zinc-500 font-medium">Raised {when(current.createdAt)}{current.storeName ? ` · ${current.storeName}` : ""}</p>
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1">What the rider wrote</p>
              <p className="text-sm text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed">{current.description}</p>
            </div>

            {current.activity?.length > 0 && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-2">History</p>
                <ul className="space-y-2">
                  {current.activity.map((a, i) => (
                    <li key={i} className="text-xs rounded-xl bg-zinc-50 dark:bg-zinc-950 p-2.5">
                      <span className="font-bold text-zinc-800 dark:text-zinc-200">{roleLabel[a.byRole] || a.byRole}</span>
                      <span className="text-zinc-400 font-medium"> · {STATUS[a.status]?.label} · <Clock size={10} className="inline -mt-0.5" /> {when(a.at)}</span>
                      {a.note && <p className="mt-1 text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{a.note}</p>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {current.status === "closed" && !canClose ? (
              <p className="text-xs font-semibold text-zinc-500 bg-zinc-50 dark:bg-zinc-950 rounded-xl p-3">The franchise closed this ticket. Ask the franchise admin to reopen it.</p>
            ) : (
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Reply to the rider</p>
                <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={3} maxLength={1000} placeholder="Write what you did or what the rider should do next..."
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent p-3 text-xs font-medium outline-none resize-none" />
                <div className="flex flex-wrap gap-2">
                  <button disabled={saving || !reply.trim()} onClick={() => act({ adminResponse: reply }, "Reply sent to the rider")}
                    className="px-3 py-2 rounded-lg bg-[var(--primary)] text-white text-xs font-bold disabled:opacity-50 cursor-pointer inline-flex items-center gap-1.5">
                    {saving ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />} Send reply
                  </button>
                  {current.status !== "in_progress" && current.status !== "closed" && (
                    <button disabled={saving} onClick={() => act({ status: "in_progress" }, "Marked in progress")} className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-bold cursor-pointer">In progress</button>
                  )}
                  {current.status !== "resolved" && current.status !== "closed" && (
                    <button disabled={saving} onClick={() => act({ status: "resolved", ...(reply.trim() ? { adminResponse: reply } : {}) }, "Marked resolved")} className="px-3 py-2 rounded-lg border border-emerald-300 text-emerald-700 text-xs font-bold cursor-pointer">Mark resolved</button>
                  )}
                  {canClose && current.status !== "closed" && (
                    <button disabled={saving} onClick={() => act({ status: "closed", ...(reply.trim() ? { adminResponse: reply } : {}) }, "Ticket closed")} className="px-3 py-2 rounded-lg border border-zinc-300 text-zinc-700 text-xs font-bold cursor-pointer">Close</button>
                  )}
                  {canClose && current.status === "closed" && (
                    <button disabled={saving} onClick={() => act({ status: "open" }, "Ticket reopened")} className="px-3 py-2 rounded-lg border border-amber-300 text-amber-700 text-xs font-bold cursor-pointer">Reopen</button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
