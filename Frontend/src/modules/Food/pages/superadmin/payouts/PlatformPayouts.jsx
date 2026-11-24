import { useCallback, useEffect, useMemo, useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { adminClient } from "@/services/api/axios"
import { REAL, errText, money, card, Tabs, PayoutList, PayoutDrawer, PageHead, KIND, STATUS } from "@food/components/payouts/PayoutKit"

// Super admin: pay franchises (their payout requests), decide "not received" reports, and see every payout at every level.
const BASE = "/food/admin/payouts"
const select = "h-10 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold outline-none"

export default function PlatformPayouts() {
  const [tab, setTab] = useState("franchises")
  const [desk, setDesk] = useState(null)
  const [loading, setLoading] = useState(true)
  const [openId, setOpenId] = useState(null)
  const [kind, setKind] = useState("")
  const [status, setStatus] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminClient.get(BASE, REAL)
      setDesk(res?.data?.data || null)
    } catch (e) {
      toast.error(errText(e))
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => { load() }, [load])

  const incoming = desk?.incoming || []
  const disputes = desk?.disputes || []
  const all = useMemo(() => (desk?.all || []).filter((p) => (!kind || p.kind === kind) && (!status || p.status === status)), [desk, kind, status])
  const open = [...incoming, ...disputes, ...(desk?.all || [])].find((p) => p.id === openId) || null
  const totals = desk?.totals || []
  const sum = (k, s) => totals.filter((t) => t.kind === k && t.status === s).reduce((n, t) => n + t.amount, 0)

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-6xl mx-auto">
      <PageHead title="Payouts" sub="All money goes out from here level by level: you pay franchises, franchises pay stores, stores pay riders and staff." onRefresh={load} loading={loading} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {Object.entries(KIND).map(([k, label]) => (
          <div key={k} className={`${card} p-3`}>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">{label}s</span>
            <span className="text-lg font-black text-zinc-900 dark:text-zinc-100">{money(sum(k, "paid"))}</span>
            <span className="block text-[10px] text-zinc-400 font-medium">paid · {money(sum(k, "pending"))} waiting</span>
          </div>
        ))}
      </div>
      <Tabs value={tab} onChange={setTab} tabs={[
        { id: "franchises", label: "Franchise requests", count: incoming.filter((p) => p.status === "pending").length },
        { id: "disputes", label: "Not received reports", count: disputes.filter((p) => p.dispute?.status === "open").length },
        { id: "all", label: "All payouts" },
      ]} />

      {loading && !desk ? (
        <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" /></div>
      ) : tab === "franchises" ? (
        <PayoutList rows={incoming} onOpen={(p) => setOpenId(p.id)} empty="No franchise has asked for a payout yet." />
      ) : tab === "disputes" ? (
        <PayoutList rows={disputes} onOpen={(p) => setOpenId(p.id)} showKind empty="No reports." />
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2 flex-wrap">
            <select className={select} value={kind} onChange={(e) => setKind(e.target.value)}>
              <option value="">Every level</option>
              {Object.entries(KIND).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
            <select className={select} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Every status</option>
              {Object.entries(STATUS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
            </select>
          </div>
          <PayoutList rows={all} onOpen={(p) => setOpenId(p.id)} showKind empty="No payouts match." />
        </div>
      )}

      {open && (
        <PayoutDrawer payout={open} base={BASE} onClose={() => setOpenId(null)} onDone={load}
          canPay={open.kind === "franchise_payout"} canReject={open.kind === "franchise_payout"} canResolve />
      )}
    </div>
  )
}
