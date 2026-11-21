import { useEffect, useState } from "react"
import { Wallet, Loader2 } from "lucide-react"
import { adminAPI } from "@food/api"

/**
 * The franchise admin sets the delivery wallet minimum: a rider must hold at least this balance to accept this
 * franchise's orders. The wallet = the rider's recharges minus the COD cash they collected.
 */
export default function RiderWalletMinimumCard({ riders = [], onToast }) {
  const [value, setValue] = useState("")
  const [saved, setSaved] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    adminAPI.getRiderWalletSettings()
      .then((res) => {
        const v = Number(res?.data?.data?.riderWalletMinBalance) || 0
        setSaved(v)
        setValue(String(v))
      })
      .catch(() => setSaved(0))
  }, [])

  const save = async () => {
    const n = Number(value)
    if (!Number.isFinite(n) || n < 0) return onToast?.("Enter an amount of ₹0 or more", "error")
    setSaving(true)
    try {
      const res = await adminAPI.updateRiderWalletSettings(n)
      const v = Number(res?.data?.data?.riderWalletMinBalance) || 0
      setSaved(v)
      setValue(String(v))
      onToast?.(`Riders now need ₹${v.toFixed(2)} in their wallet to accept your orders`)
    } catch (err) {
      onToast?.(err?.response?.data?.error || err?.response?.data?.message || "Could not save", "error")
    } finally {
      setSaving(false)
    }
  }

  const approved = riders.filter((r) => r.status !== "Pending approval" && r.status !== "Suspended")
  const below = saved == null ? 0 : approved.filter((r) => (Number(r.walletBalance) || 0) < saved).length
  const noBank = approved.filter((r) => r.payoutDetailsComplete === false).length

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 flex flex-col md:flex-row md:items-center gap-3">
      <div className="flex items-center gap-2.5 flex-1">
        <div className="w-9 h-9 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center shrink-0"><Wallet size={16} /></div>
        <div>
          <p className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100">Rider wallet minimum</p>
          <p className="text-[10px] text-zinc-500 font-semibold">
            A rider needs this balance (recharges minus COD cash collected) to accept your orders.
            {saved != null && ` ${below} rider(s) below it, ${noBank} without bank details.`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-zinc-500">₹</span>
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => setValue(e.target.value.replace(/[^0-9.]/g, ""))}
          className="w-28 h-9 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs font-bold text-zinc-900 dark:text-zinc-100 outline-none"
        />
        <button
          onClick={save}
          disabled={saving || saved == null || Number(value) === saved}
          className="h-9 px-3 rounded-lg bg-[var(--primary)] text-white text-xs font-bold disabled:opacity-50 cursor-pointer flex items-center gap-1"
        >
          {saving && <Loader2 size={12} className="animate-spin" />} Save
        </button>
      </div>
    </div>
  )
}
