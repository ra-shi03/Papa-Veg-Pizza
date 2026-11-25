import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { adminClient } from "@/services/api/axios"
import OverviewPage, { Badge, day, errText } from "../../franchise-admin/shared/OverviewPage"

// Customers' support tickets from the app. The super admin replies and moves them along; the customer sees the reply.
export default function SupportRequests() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [open, setOpen] = useState(null)
  const [reply, setReply] = useState("")
  const [status, setStatus] = useState("open")
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminClient.get("/food/admin/support-tickets", { params: { source: "user", limit: 1000 } })
      setRows((res?.data?.data?.tickets || []).map((t) => ({
        ...t, customer: t.user?.name || "Customer", phone: t.user?.phone || t.user?.email || "",
        state: t.status === "in-progress" ? "in_progress" : t.status,
      })))
      setError("")
    } catch (e) {
      setError(errText(e))
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => { load() }, [load])

  const pick = (t) => { setOpen(t); setReply(t.adminResponse || ""); setStatus(t.status) }
  const save = async () => {
    setBusy(true)
    try {
      await adminClient.patch(`/food/admin/support-tickets/${open._id}`, { source: "user", status, adminResponse: reply.trim() })
      toast.success("Ticket updated")
      setOpen(null)
      await load()
    } catch (e) {
      toast.error(errText(e))
    } finally {
      setBusy(false)
    }
  }

  const input = "w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-semibold outline-none"
  return (
    <>
      <OverviewPage
        title="Support Requests" subtitle="Tickets customers raised from the app. Complaints about orders can also be handled on Customer Complaints."
        query={{ data: {}, loading, error, load }} rows={rows} searchKeys={["customer", "phone", "issueType", "description", "storeName"]} empty="No support requests."
        filter={{ key: "state", label: "All statuses", options: ["open", "in_progress", "resolved"] }}
        columns={[
          { title: "Customer", render: (t) => <span>{t.customer}<span className="block text-[10px] text-zinc-400">{t.phone}</span></span> },
          { title: "About", key: "type" }, { title: "Issue", render: (t) => <span className="block max-w-xs">{t.issueType}<span className="block text-zinc-400">{t.description}</span></span> },
          { title: "Store", key: "storeName" }, { title: "Status", render: (t) => <Badge value={t.state} /> },
          { title: "Raised", render: (t) => day(t.createdAt) },
          { title: "", render: (t) => <button onClick={() => pick(t)} className="px-2.5 py-1.5 rounded-lg bg-[var(--primary)] text-white font-bold cursor-pointer">{t.adminResponse ? "Edit reply" : "Reply"}</button> },
        ]}
      />
      {open && (
        <div className="fixed inset-0 z-[300] bg-black/40 flex items-center justify-center p-4" onClick={() => !busy && setOpen(null)}>
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-base font-black">{open.issueType}</h2>
            <p className="text-xs text-zinc-500 font-semibold">{open.customer} · {day(open.createdAt)}</p>
            <p className="text-xs font-semibold">{open.description || "No description."}</p>
            <textarea className={`${input} h-28`} maxLength={1000} placeholder="Reply to the customer" value={reply} onChange={(e) => setReply(e.target.value)} />
            <select className={input} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="open">Open</option><option value="in-progress">In progress</option><option value="resolved">Resolved</option>
            </select>
            <div className="flex gap-2">
              <button disabled={busy} onClick={save} className="px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-xs font-bold cursor-pointer disabled:opacity-50">Save</button>
              <button onClick={() => setOpen(null)} className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-bold cursor-pointer">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
