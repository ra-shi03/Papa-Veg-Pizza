import { useCallback, useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { adminClient } from "@/services/api/axios"
import { REAL, errText, money, monthLabel, card, AccountCard, PayoutList, PayoutDrawer, PageHead, when } from "@food/components/payouts/PayoutKit"

// Kitchen staff: their salary, each month's state, and "request salary" once a month is overdue (not paid by the due day).
const BASE = "/food/store/my-salary"

export default function MySalary() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [openId, setOpenId] = useState(null)
  const [asking, setAsking] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminClient.get(BASE, REAL)
      setData(res?.data?.data || null)
    } catch (e) {
      toast.error(errText(e))
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => { load() }, [load])

  const ask = async (period) => {
    setAsking(period)
    try {
      await adminClient.post(`${BASE}/request`, { period }, REAL)
      toast.success(`Salary for ${monthLabel(period)} requested from your store manager`)
      load()
    } catch (e) {
      toast.error(errText(e))
    } finally {
      setAsking("")
    }
  }

  const payouts = data?.payouts || []
  const open = payouts.find((p) => p.id === openId) || null

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-4xl mx-auto">
      <PageHead title="My salary" sub={`Your store manager pays salaries. If a month is not paid by the ${data?.rules?.dueDay || 7}th of the next month, you can request it here.`} onRefresh={load} loading={loading} />
      {loading && !data ? (
        <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" /></div>
      ) : (
        <>
          <div className={`${card} p-4`}>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">{data?.salaryType || "Monthly"} salary</span>
            <span className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{money(data?.salary)}</span>
          </div>
          <div className={`${card} divide-y divide-zinc-100 dark:divide-zinc-800`}>
            {(data?.months || []).map((m) => (
              <div key={m.period} className="px-4 py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{monthLabel(m.period)}</p>
                  <p className="text-[11px] text-zinc-500 font-medium">Due by {when(m.dueBy)}</p>
                </div>
                {m.state === "paid" ? <span className="text-xs font-bold text-emerald-600">Paid</span>
                  : m.state === "pending" ? <span className="text-xs font-bold text-amber-600">Requested</span>
                    : m.canRequest ? (
                      <button disabled={asking === m.period} onClick={() => ask(m.period)} className="px-3 py-2 rounded-lg bg-[var(--primary)] text-white text-xs font-bold disabled:opacity-50 cursor-pointer inline-flex items-center gap-1.5">
                        {asking === m.period && <Loader2 size={12} className="animate-spin" />}Request salary
                      </button>
                    ) : <span className="text-xs font-bold text-zinc-400">Not due yet</span>}
              </div>
            ))}
          </div>
          <AccountCard account={data?.account} title="Where my salary is paid" onSave={async (body) => { await adminClient.put(`${BASE}/account`, body, REAL); await load() }} />
          <p className="text-xs font-bold text-zinc-500">Payments</p>
          <PayoutList rows={payouts} onOpen={(p) => setOpenId(p.id)} who={() => "Salary"} empty="No salary recorded yet." />
        </>
      )}
      {open && <PayoutDrawer payout={open} base={BASE} canReport onClose={() => setOpenId(null)} onDone={load} />}
    </div>
  )
}
