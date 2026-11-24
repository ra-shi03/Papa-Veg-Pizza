import { useCallback, useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { adminClient } from "@/services/api/axios"
import { useOrderEvents } from "../api/storeOrdersApi"
import {
  REAL, errText, money, monthLabel, card, Tabs, BalanceCards, AccountCard, PayoutList, PayoutDrawer, RequestBox, PageHead, StatusBadge,
} from "@food/components/payouts/PayoutKit"

// Store manager: pay the store's riders (their withdrawal requests) and kitchen staff (salaries), and ask the franchise
// for what the store is owed. Every amount comes from the server.
const BASE = "/food/store/payouts"
const input = "w-full h-10 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-semibold outline-none"
const STATE = {
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  overdue: "bg-rose-50 text-rose-700 border-rose-200",
  due: "bg-zinc-50 text-zinc-600 border-zinc-200",
  upcoming: "bg-zinc-50 text-zinc-400 border-zinc-200",
}

export default function StorePayouts() {
  const [tab, setTab] = useState("riders")
  const [desk, setDesk] = useState(null)
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [openId, setOpenId] = useState(null)
  const [salaryFor, setSalaryFor] = useState(null) // { staff, period }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [d, s] = await Promise.all([adminClient.get(BASE, REAL), adminClient.get(`${BASE}/staff`, REAL)])
      setDesk(d?.data?.data || null)
      setStaff(s?.data?.data?.staff || [])
    } catch (e) {
      toast.error(errText(e))
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => { load() }, [load])

  // Live: a payout request / payment of this store (store_event "payout") or a delivered order refreshes the page at once
  const reloadSoon = useRef(null)
  useOrderEvents(() => {
    clearTimeout(reloadSoon.current)
    reloadSoon.current = setTimeout(() => load(), 600)
  })
  useEffect(() => () => clearTimeout(reloadSoon.current), [])

  const incoming = desk?.incoming || []
  const riderRows = incoming.filter((p) => p.kind === "rider_withdrawal")
  const salaryRows = incoming.filter((p) => p.kind === "staff_salary")
  const mine = desk?.myRequests || []
  const all = [...incoming, ...mine, ...staff.flatMap((s) => s.payouts || [])]
  const open = all.find((p) => p.id === openId) || null
  const waiting = (rows) => rows.filter((p) => p.status === "pending").length
  const pendingMine = mine.find((p) => p.status === "pending")

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-6xl mx-auto">
      <PageHead title="Payouts" sub="Pay your riders and staff, and request what the store is owed from the franchise." onRefresh={load} loading={loading} />
      <Tabs value={tab} onChange={setTab} tabs={[
        { id: "riders", label: "Rider withdrawals", count: waiting(riderRows) },
        { id: "staff", label: "Staff salaries", count: waiting(salaryRows) },
        { id: "store", label: "Store payouts" },
      ]} />

      {loading && !desk ? (
        <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" /></div>
      ) : tab === "riders" ? (
        <div className="space-y-2">
          <p className="text-xs text-zinc-500 font-medium">Riders ask for what they earned on this store's deliveries. Send the money to the account shown, then mark it paid with the UTR.</p>
          <PayoutList rows={riderRows} onOpen={(p) => setOpenId(p.id)} empty="No rider has asked for a withdrawal yet." />
        </div>
      ) : tab === "staff" ? (
        <div className="space-y-3">
          {salaryRows.some((p) => p.status === "pending") && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-rose-600">Salary requests from staff (overdue)</p>
              <PayoutList rows={salaryRows.filter((p) => p.status === "pending")} onOpen={(p) => setOpenId(p.id)} />
            </div>
          )}
          {staff.length === 0 ? (
            <p className={`${card} py-12 text-center text-xs font-semibold text-zinc-400`}>No approved kitchen staff yet.</p>
          ) : staff.map((s) => (
            <div key={s.staffId} className={`${card} p-4 space-y-3`}>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <p className="text-sm font-black text-zinc-900 dark:text-zinc-100">{s.name} <span className="text-[10px] text-zinc-400 font-bold">{s.role} · {s.employeeCode}</span></p>
                  <p className="text-[11px] text-zinc-500 font-medium">{s.salaryType} salary: {money(s.salary)}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {s.months.map((m) => (
                  <button key={m.period} disabled={m.state === "upcoming"}
                    onClick={() => (m.payoutId ? setOpenId(m.payoutId) : setSalaryFor({ staff: s, period: m.period }))}
                    className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold cursor-pointer disabled:cursor-default ${STATE[m.state]}`}>
                    {monthLabel(m.period)} · {m.state === "paid" ? "Paid" : m.state === "pending" ? "Requested" : m.state === "overdue" ? "Overdue: pay" : m.state === "due" ? "Pay" : "Upcoming"}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <BalanceCards balance={desk?.balance} holdHours={desk?.holdHours} />
          <AccountCard account={desk?.account} title="Store payout account" onSave={async (body) => { await adminClient.put(`${BASE}/account`, body, REAL); await load() }} />
          <RequestBox available={desk?.balance?.available} who="the franchise"
            disabledReason={pendingMine ? `A request of ${money(pendingMine.amount)} is already waiting with the franchise.` : !desk?.account ? "Add the store payout account first." : !(desk?.balance?.available >= 1) ? "Nothing to request yet." : ""}
            onRequest={async (body) => { await adminClient.post(`${BASE}/request`, body, REAL); await load() }} />
          <p className="text-xs font-bold text-zinc-500">Requests to the franchise</p>
          <PayoutList rows={mine} onOpen={(p) => setOpenId(p.id)} who={() => "Store payout"} empty="No request sent yet." />
        </div>
      )}

      {open && (
        <PayoutDrawer payout={open} base={BASE} onClose={() => setOpenId(null)} onDone={load}
          canPay={open.payer?.type === "store"} canReject={open.payer?.type === "store"} canReport={open.kind === "store_payout"} />
      )}
      {salaryFor && <RecordSalary target={salaryFor} onClose={() => setSalaryFor(null)} onDone={load} />}
    </div>
  )
}

/** Record a salary already paid for a month (no request needed). */
function RecordSalary({ target, onClose, onDone }) {
  const { staff, period } = target
  const [form, setForm] = useState({ amount: staff.salary ? String(staff.salary) : "", method: "bank_transfer", reference: "", note: "" })
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const save = async () => {
    setBusy(true)
    try {
      await adminClient.post(`${BASE}/salaries`, { staffId: staff.staffId, period, ...form }, REAL)
      toast.success(`Salary for ${monthLabel(period)} recorded as paid`)
      onDone()
      onClose()
    } catch (e) {
      toast.error(errText(e))
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="fixed inset-0 z-[300] bg-black/40 flex items-center justify-center p-4" onClick={() => !busy && onClose()}>
      <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Record salary paid</p>
          <h2 className="text-base font-black text-zinc-900 dark:text-zinc-100">{staff.name} · {monthLabel(period)}</h2>
          <StatusBadge status="pending" />
        </div>
        <p className="text-xs text-zinc-500 font-medium">Pay the salary first, then record it here with the reference. A month can be paid once.</p>
        <input className={input} placeholder="Amount paid (₹)" inputMode="decimal" value={form.amount} onChange={set("amount")} />
        <select className={input} value={form.method} onChange={set("method")}>
          <option value="bank_transfer">Bank transfer</option>
          <option value="upi">UPI</option>
          <option value="cash">Cash</option>
        </select>
        <input className={input} placeholder={form.method === "cash" ? "Cash receipt number" : "UTR / transaction reference"} value={form.reference} onChange={set("reference")} />
        <input className={input} placeholder="Note (optional, e.g. leave deduction)" value={form.note} onChange={set("note")} />
        <div className="flex gap-2">
          <button disabled={busy || !form.reference.trim() || !form.amount} onClick={save} className="px-3 py-2 rounded-lg bg-[var(--primary)] text-white text-xs font-bold disabled:opacity-50 cursor-pointer inline-flex items-center gap-1.5">{busy && <Loader2 size={12} className="animate-spin" />}Record as paid</button>
          <button onClick={onClose} className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-bold cursor-pointer">Cancel</button>
        </div>
      </div>
    </div>
  )
}
