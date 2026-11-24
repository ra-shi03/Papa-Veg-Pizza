import { useCallback, useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { adminClient } from "@/services/api/axios"
import { REAL, errText, money, card, Tabs, BalanceCards, AccountCard, PayoutList, PayoutDrawer, RequestBox, PageHead } from "@food/components/payouts/PayoutKit"

// Franchise admin: pay the franchise's stores (their payout requests), decide "not received" reports from their riders and
// staff, and ask the super admin for what the franchise's stores are owed.
const BASE = "/food/franchise/payouts"

export default function FranchisePayouts() {
  const [tab, setTab] = useState("stores")
  const [desk, setDesk] = useState(null)
  const [loading, setLoading] = useState(true)
  const [openId, setOpenId] = useState(null)

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
  const mine = desk?.myRequests || []
  const open = [...incoming, ...disputes, ...mine].find((p) => p.id === openId) || null
  const pendingMine = mine.find((p) => p.status === "pending")

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-6xl mx-auto">
      <PageHead title="Payouts" sub="Pay your stores, check reports of payments not received, and request what your stores are owed from the platform." onRefresh={load} loading={loading} />
      <Tabs value={tab} onChange={setTab} tabs={[
        { id: "stores", label: "Store requests", count: incoming.filter((p) => p.status === "pending").length },
        { id: "disputes", label: "Not received reports", count: disputes.filter((p) => p.dispute?.status === "open").length },
        { id: "mine", label: "Franchise payouts" },
      ]} />

      {loading && !desk ? (
        <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" /></div>
      ) : tab === "stores" ? (
        <div className="space-y-3">
          <PayoutList rows={incoming} onOpen={(p) => setOpenId(p.id)} empty="No store has asked for a payout yet." />
          <p className="text-xs font-bold text-zinc-500">What each store is owed</p>
          <div className={`${card} overflow-x-auto`}>
            <table className="w-full text-xs">
              <thead><tr className="text-left text-[10px] uppercase tracking-wider text-zinc-400">
                <th className="px-4 py-2">Store</th><th className="px-4 py-2">Available</th><th className="px-4 py-2">On hold</th><th className="px-4 py-2">Waiting</th><th className="px-4 py-2">Paid</th>
              </tr></thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {(desk?.stores || []).map((s) => (
                  <tr key={s.id} className="font-semibold text-zinc-800 dark:text-zinc-200">
                    <td className="px-4 py-2">{s.name}</td><td className="px-4 py-2">{money(s.balance?.available)}</td><td className="px-4 py-2">{money(s.balance?.onHold)}</td>
                    <td className="px-4 py-2">{money(s.balance?.pending)}</td><td className="px-4 py-2">{money(s.balance?.paid)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : tab === "disputes" ? (
        <div className="space-y-2">
          <p className="text-xs text-zinc-500 font-medium">A rider or staff member says a payment their store marked paid never arrived. Check the store's proof, then decide.</p>
          <PayoutList rows={disputes} onOpen={(p) => setOpenId(p.id)} showKind empty="No reports." />
        </div>
      ) : (
        <div className="space-y-3">
          <BalanceCards balance={desk?.balance} holdHours={desk?.holdHours} />
          <AccountCard account={desk?.account} title="Franchise payout account" onSave={async (body) => { await adminClient.put(`${BASE}/account`, body, REAL); await load() }} />
          <RequestBox available={desk?.balance?.available} who="the platform"
            disabledReason={pendingMine ? `A request of ${money(pendingMine.amount)} is already waiting with the super admin.` : !desk?.account ? "Add the franchise payout account first." : !(desk?.balance?.available >= 1) ? "Nothing to request yet." : ""}
            onRequest={async (body) => { await adminClient.post(`${BASE}/request`, body, REAL); await load() }} />
          <PayoutList rows={mine} onOpen={(p) => setOpenId(p.id)} who={() => "Franchise payout"} empty="No request sent yet." />
        </div>
      )}

      {open && (
        <PayoutDrawer payout={open} base={BASE} onClose={() => setOpenId(null)} onDone={load}
          canPay={open.kind === "store_payout"} canReject={open.kind === "store_payout"}
          canReport={open.kind === "franchise_payout"} canResolve={open.kind === "rider_withdrawal" || open.kind === "staff_salary"} />
      )}
    </div>
  )
}
