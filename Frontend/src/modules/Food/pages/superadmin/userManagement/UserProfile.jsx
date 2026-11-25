import { useCallback, useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { adminClient } from "@/services/api/axios"
import { Badge, day, money } from "../../franchise-admin/shared/OverviewPage"
import { errText, setCustomerActive, toCustomer } from "./customersApi"

// One customer: account, orders, refunds, support tickets and the addresses they ordered to. Block / unblock here.
const card = "rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4"

function Section({ title, empty, rows, render }) {
  return (
    <div className={card}>
      <p className="text-sm font-black mb-2">{title}</p>
      {rows.length === 0 ? <p className="text-xs text-zinc-400 font-semibold">{empty}</p> : (
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs font-semibold">{rows.map((r, i) => <li key={r._id || i} className="py-2">{render(r)}</li>)}</ul>
      )}
    </div>
  )
}

export default function UserProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [customer, setCustomer] = useState(null)
  const [history, setHistory] = useState({ orders: [], refunds: [], tickets: [], addresses: [] })
  const [loading, setLoading] = useState(!!id)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const [c, h] = await Promise.all([adminClient.get(`/food/admin/customers/${id}`), adminClient.get(`/food/admin/customers/${id}/history`)])
      setCustomer(toCustomer(c.data.data.customer))
      setHistory(h.data.data)
    } catch (e) {
      toast.error(errText(e))
    } finally {
      setLoading(false)
    }
  }, [id])
  useEffect(() => { load() }, [load])

  const toggle = async () => {
    const isActive = customer.status !== "ACTIVE"
    if (!isActive && !window.confirm(`Suspend ${customer.name}? They are signed out and cannot order.`)) return
    setBusy(true)
    try {
      await setCustomerActive(customer.id, isActive)
      toast.success(isActive ? "Account activated" : "Account suspended")
      await load()
    } catch (e) {
      toast.error(errText(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-7xl mx-auto">
      <button onClick={() => navigate("/food/superadmin/customers/list")} className="inline-flex items-center gap-1.5 text-xs font-bold cursor-pointer"><ArrowLeft size={13} />Customers</button>
      {loading && <p className="text-xs text-zinc-400 inline-flex items-center gap-2"><Loader2 size={13} className="animate-spin" />Loading...</p>}
      {!loading && !customer && <p className="text-xs text-zinc-400 font-semibold">Pick a customer from the list.</p>}
      {customer && (
        <>
          <div className={`${card} flex flex-wrap items-center justify-between gap-3`}>
            <div>
              <h1 className="text-xl font-black">{customer.name}</h1>
              <p className="text-xs text-zinc-500 font-semibold">{[customer.phone, customer.email].filter(Boolean).join(" · ") || "No contact saved"} · Member since {customer.memberSince}</p>
              <p className="text-xs font-bold mt-1">{customer.orders} orders · {money(customer.spent)} · <Badge value={customer.status === "ACTIVE" ? "member" : "rejected"} /> {customer.status === "ACTIVE" ? "Active" : "Suspended"}</p>
            </div>
            <button disabled={busy} onClick={toggle} className={`px-4 py-2 rounded-xl text-xs font-bold text-white cursor-pointer disabled:opacity-50 ${customer.status === "ACTIVE" ? "bg-rose-600" : "bg-emerald-600"}`}>
              {customer.status === "ACTIVE" ? "Suspend account" : "Activate account"}
            </button>
          </div>
          <div className="grid lg:grid-cols-2 gap-4">
            <Section title="Orders (latest 50)" empty="No orders yet." rows={history.orders} render={(o) => (
              <div className="flex justify-between gap-3">
                <div><p className="font-black">{o.orderNumber} <Badge value={o.status} /></p><p className="text-zinc-500">{o.items}</p><p className="text-zinc-400">{o.storeName} · {day(o.createdAt)}</p></div>
                <p className="font-black shrink-0">{money(o.total)}</p>
              </div>
            )} />
            <div className="space-y-4">
              <Section title="Refunds" empty="No refunds." rows={history.refunds} render={(r) => <p>{money(r.amount)} <Badge value={r.status} /> <span className="text-zinc-500">{r.reason}</span> <span className="text-zinc-400">{day(r.createdAt)}</span></p>} />
              <Section title="Support tickets" empty="No tickets." rows={history.tickets} render={(t) => <p>{t.issueType} <Badge value={t.status.replace("-", "_")} /> <span className="text-zinc-400">{day(t.createdAt)}</span></p>} />
              <Section title="Delivery addresses used" empty="None." rows={history.addresses} render={(a) => <p>{a}</p>} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
