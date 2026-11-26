import { useCallback, useEffect, useState } from "react"
import { CheckCircle2, Loader2, Plug } from "lucide-react"
import { toast } from "sonner"
import { adminClient } from "@/services/api/axios"

// This store's own Pet Pooja (every store has its own Pet Pooja account). The store manager only enters the outlet's
// credentials and connects: the server then sends the store's orders to Pet Pooja and applies Pet Pooja's status updates
// by itself (each order carries the store's callback link). Keys are write-only: the server keeps them encrypted.
const BASE = "/food/store/pos/petpooja"
const errText = (e) => e?.response?.data?.message || e?.response?.data?.error || e?.message || "That did not work"
const card = "bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl p-5 shadow-sm"
const input = "w-full h-10 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950 text-xs font-semibold outline-none focus:border-[var(--primary)]"
const label = "text-[10px] font-black tracking-wider text-zinc-500 uppercase"
const KEYS = [["appKey", "App key"], ["appSecret", "App secret"], ["accessToken", "Access token"]]
// connecting switches everything on: orders go to Pet Pooja and Pet Pooja's updates come back
const CONNECT = { enabled: true, pushOrders: true, acceptStatusUpdates: true }

export default function PetPoojaSettings() {
  const [s, setS] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ restaurantId: "", appKey: "", appSecret: "", accessToken: "" })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const d = (await adminClient.get(BASE))?.data?.data
      setS(d)
      setForm({ restaurantId: d?.restaurantId || "", appKey: "", appSecret: "", accessToken: "" })
    } catch (e) {
      toast.error(errText(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const save = async (body, done) => {
    setSaving(true)
    try {
      const d = (await adminClient.put(BASE, body))?.data?.data
      setS(d)
      setForm({ restaurantId: d?.restaurantId || "", appKey: "", appSecret: "", accessToken: "" })
      toast.success(done)
    } catch (e) {
      toast.error(errText(e))
    } finally {
      setSaving(false)
    }
  }

  const connect = () => {
    const body = { restaurantId: form.restaurantId.trim(), ...CONNECT }
    for (const [k] of KEYS) if (form[k].trim()) body[k] = form[k].trim()
    save(body, "Pet Pooja connected")
  }

  if (loading && !s) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-zinc-400" /></div>
  if (!s) return <div className="p-6 text-xs text-zinc-500">Pet Pooja settings could not be loaded.</div>

  const connected = !!(s.enabled && s.setupComplete)
  const ready = form.restaurantId.trim() && KEYS.every(([k]) => form[k].trim() || s[k]?.set)

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-2xl">
      <header className={`${card} flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white inline-flex items-center gap-2"><Plug size={18} className="text-[var(--primary)]" />Pet Pooja</h1>
          <p className="text-zinc-500 text-xs mt-1">Enter this outlet's Pet Pooja details and connect. Your orders then appear in Pet Pooja, and what you do there updates the order here.</p>
        </div>
        <span className={`self-start sm:self-auto text-[11px] font-black px-3 py-1.5 rounded-full inline-flex items-center gap-1 ${connected ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"}`}>
          {connected && <CheckCircle2 size={12} />}{connected ? "Connected" : "Not connected"}
        </span>
      </header>

      <section className={`${card} space-y-3`}>
        <div className="flex flex-col gap-1">
          <span className={label}>Restaurant ID</span>
          <input className={input} value={form.restaurantId} onChange={(e) => setForm((f) => ({ ...f, restaurantId: e.target.value }))} placeholder="From Pet Pooja" />
        </div>
        {KEYS.map(([k, title]) => (
          <div key={k} className="flex flex-col gap-1">
            <span className={label}>{title}</span>
            <input type="password" autoComplete="new-password" className={input} value={form[k]} onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
              placeholder={s[k]?.set ? `Saved (ends ${s[k].last4 || "••••"}). Leave empty to keep` : "From Pet Pooja"} />
          </div>
        ))}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button type="button" disabled={saving || !ready} onClick={connect}
            className="px-5 py-2 rounded-full bg-[var(--primary)] text-white text-xs font-bold disabled:opacity-50 cursor-pointer inline-flex items-center gap-1.5">
            {saving && <Loader2 size={12} className="animate-spin" />}{connected ? "Save" : "Connect"}
          </button>
          {connected && (
            <button type="button" disabled={saving} onClick={() => save({ enabled: false }, "Pet Pooja disconnected")}
              className="text-xs font-bold text-zinc-500 hover:text-rose-600 cursor-pointer disabled:opacity-50">
              Disconnect
            </button>
          )}
        </div>
      </section>
    </div>
  )
}
