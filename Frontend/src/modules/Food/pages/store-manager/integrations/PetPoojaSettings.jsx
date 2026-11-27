import { useCallback, useEffect, useState } from "react"
import { CheckCircle2, Copy, Loader2, Plug, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { adminClient } from "@/services/api/axios"
import PetPoojaItemMapping from "./PetPoojaItemMapping"

// This store's own Pet Pooja (every store has its own Pet Pooja account). Everything is entered here and saved with the
// store: the outlet's restaurant ID and keys, which Pet Pooja server (staging / production) and this server's public
// address. The server then sends the store's orders to Pet Pooja and applies Pet Pooja's updates by itself (each order
// carries the store's callback link; the menu / stock / store links below are given to Pet Pooja once).
// Keys are write-only: the server keeps them encrypted.
const BASE = "/food/store/pos/petpooja"
const errText = (e) => e?.response?.data?.message || e?.response?.data?.error || e?.message || "That did not work"
const card = "bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl p-5 shadow-sm"
const input = "w-full h-10 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950 text-xs font-semibold outline-none focus:border-[var(--primary)]"
const label = "text-[10px] font-black tracking-wider text-zinc-500 uppercase"
const btnGhost = "px-4 py-2 rounded-full border border-zinc-200 dark:border-zinc-700 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
const KEYS = [["appKey", "App key"], ["appSecret", "App secret"], ["accessToken", "Access token"]]
// connecting switches everything on: orders go to Pet Pooja and Pet Pooja's updates come back
const CONNECT = { enabled: true, pushOrders: true, acceptStatusUpdates: true }
// What Pet Pooja may change here (each one off until the manager turns it on)
const SYNC = [
  ["syncMenu", "Menu from Pet Pooja", "Pet Pooja sends its menu here whenever you change it there, for item mapping."],
  ["syncStock", "Item stock from Pet Pooja", "Marking an item out of stock in Pet Pooja takes it off your menu here, and back on."],
  ["syncStoreStatus", "Store on / off from Pet Pooja", "Turning the store off in Pet Pooja closes it for online orders here, and opens it again."],
]
const HOOKS = [
  ["pushmenu", "Push menu"],
  ["item_stock", "Item in stock"],
  ["item_stock_off", "Item out of stock"],
  ["get_store_status", "Get store status"],
  ["update_store_status", "Update store status"],
]
const emptyForm = (d) => ({
  restaurantId: d?.restaurantId || "", appKey: "", appSecret: "", accessToken: "",
  apiEnv: d?.apiEnv || "staging", apiBaseUrl: d?.apiBaseUrl || "", publicUrl: d?.publicUrl || "",
})

function LinkRow({ title, url }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      toast.success(`${title} link copied`)
    } catch {
      toast.error("Could not copy: select the link and copy it")
    }
  }
  return (
    <div className="flex flex-col gap-1">
      <span className={label}>{title}</span>
      <div className="flex gap-2">
        <input readOnly value={url} onFocus={(e) => e.target.select()} className={`${input} font-mono text-[11px]`} />
        <button type="button" onClick={copy} disabled={!url} title="Copy" className="shrink-0 h-10 w-10 rounded-xl border border-zinc-200 dark:border-zinc-700 inline-flex items-center justify-center cursor-pointer disabled:opacity-50">
          <Copy size={14} />
        </button>
      </div>
    </div>
  )
}

export default function PetPoojaSettings() {
  const [s, setS] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState("")
  const [form, setForm] = useState(emptyForm())

  const take = (d) => {
    setS(d)
    setForm(emptyForm(d))
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      take((await adminClient.get(BASE))?.data?.data)
    } catch (e) {
      toast.error(errText(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const run = async (what, fn) => {
    setBusy(what)
    try {
      await fn()
    } catch (e) {
      toast.error(errText(e))
    } finally {
      setBusy("")
    }
  }
  const save = (body, done) => run("save", async () => {
    take((await adminClient.put(BASE, body))?.data?.data)
    toast.success(done)
  })

  const connect = () => {
    const body = {
      restaurantId: form.restaurantId.trim(), apiEnv: form.apiEnv,
      apiBaseUrl: form.apiEnv === "production" ? form.apiBaseUrl.trim() : s.apiBaseUrl || "",
      publicUrl: form.publicUrl.trim(), ...CONNECT,
    }
    for (const [k] of KEYS) if (form[k].trim()) body[k] = form[k].trim()
    save(body, s.enabled ? "Pet Pooja settings saved" : "Pet Pooja connected")
  }
  const testConnection = () => run("test", async () => {
    const r = (await adminClient.post(`${BASE}/test`))?.data?.data
    setS(r.settings)
    if (r.ok) toast.success(r.message)
    else toast.error(r.message)
  })
  const newLinks = () => {
    if (!window.confirm("Make new links? The current links stop working at once: give the new ones to Pet Pooja.")) return
    run("rotate", async () => {
      take((await adminClient.post(`${BASE}/callback-key`))?.data?.data)
      toast.success("New links made")
    })
  }

  if (loading && !s) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-zinc-400" /></div>
  if (!s) return <div className="p-6 text-xs text-zinc-500">Pet Pooja settings could not be loaded.</div>

  const connected = !!(s.enabled && s.setupComplete)
  const ready = form.restaurantId.trim() && KEYS.every(([k]) => form[k].trim() || s[k]?.set)
    && (form.apiEnv !== "production" || form.apiBaseUrl.trim())
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

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
          <span className={label}>Pet Pooja server</span>
          <div className="flex gap-2">
            {[["staging", "Staging (testing)"], ["production", "Production (live)"]].map(([v, t]) => (
              <button key={v} type="button" onClick={() => setForm((f) => ({ ...f, apiEnv: v }))}
                className={`px-4 py-2 rounded-full text-xs font-bold cursor-pointer ${form.apiEnv === v ? "bg-[var(--primary)] text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
        {form.apiEnv === "production" && (
          <div className="flex flex-col gap-1">
            <span className={label}>Production URL</span>
            <input className={input} value={form.apiBaseUrl} onChange={set("apiBaseUrl")} placeholder="https://… (from Pet Pooja)" />
          </div>
        )}
        <div className="flex flex-col gap-1">
          <span className={label}>Restaurant ID</span>
          <input className={input} value={form.restaurantId} onChange={set("restaurantId")} placeholder="From Pet Pooja" />
        </div>
        {KEYS.map(([k, title]) => (
          <div key={k} className="flex flex-col gap-1">
            <span className={label}>{title}</span>
            <input type="password" autoComplete="new-password" className={input} value={form[k]} onChange={set(k)}
              placeholder={s[k]?.set ? `Saved (ends ${s[k].last4 || "••••"}). Leave empty to keep` : "From Pet Pooja"} />
          </div>
        ))}
        <div className="flex flex-col gap-1">
          <span className={label}>Public server URL</span>
          <input className={input} value={form.publicUrl} onChange={set("publicUrl")} placeholder="https://api.yourdomain.com (the address Pet Pooja can reach)" />
          <span className="text-[10px] text-zinc-500">Pet Pooja sends order updates here. Leave empty to use the address this panel uses.</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button type="button" disabled={!!busy || !ready} onClick={connect}
            className="px-5 py-2 rounded-full bg-[var(--primary)] text-white text-xs font-bold disabled:opacity-50 cursor-pointer inline-flex items-center gap-1.5">
            {busy === "save" && <Loader2 size={12} className="animate-spin" />}{connected ? "Save" : "Connect"}
          </button>
          {s.setupComplete && (
            <button type="button" disabled={!!busy} onClick={testConnection} className={btnGhost}>
              {busy === "test" && <Loader2 size={12} className="animate-spin" />}Test connection
            </button>
          )}
          {connected && (
            <button type="button" disabled={!!busy} onClick={() => save({ enabled: false }, "Pet Pooja disconnected")}
              className="text-xs font-bold text-zinc-500 hover:text-rose-600 cursor-pointer disabled:opacity-50">
              Disconnect
            </button>
          )}
        </div>
        {s.lastTest && (
          <p className={`text-[11px] font-semibold ${s.lastTest.ok ? "text-emerald-700 dark:text-emerald-400" : "text-rose-600"}`}>
            Last test ({new Date(s.lastTest.at).toLocaleString()}): {s.lastTest.message}
          </p>
        )}
      </section>

      {s.setupComplete && (
        <section className={`${card} space-y-3`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white">Links for Pet Pooja</h2>
              <p className="text-zinc-500 text-[11px] mt-1">Give these to Pet Pooja for this outlet. The order update link goes with every order on its own.</p>
            </div>
            <button type="button" disabled={!!busy} onClick={newLinks} className={btnGhost}>
              {busy === "rotate" ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}New links
            </button>
          </div>
          <LinkRow title="Order updates (callback)" url={s.callbackUrl} />
          {HOOKS.map(([k, t]) => <LinkRow key={k} title={t} url={s.hookUrls?.[k] || ""} />)}
        </section>
      )}

      {connected && (
        <section className={`${card} space-y-3`}>
          <h2 className="text-sm font-black text-slate-900 dark:text-white">Sync from Pet Pooja</h2>
          {SYNC.map(([k, title, help]) => (
            <label key={k} className="flex items-start justify-between gap-4 cursor-pointer">
              <span>
                <span className="block text-xs font-bold text-slate-900 dark:text-white">{title}</span>
                <span className="block text-[11px] text-zinc-500 mt-0.5">{help}</span>
              </span>
              <input type="checkbox" className="mt-1 h-4 w-4 accent-[var(--primary)] cursor-pointer" checked={!!s[k]} disabled={!!busy}
                onChange={(e) => save({ [k]: e.target.checked }, `${title} ${e.target.checked ? "on" : "off"}`)} />
            </label>
          ))}
        </section>
      )}

      {s.setupComplete && <PetPoojaItemMapping />}
    </div>
  )
}
