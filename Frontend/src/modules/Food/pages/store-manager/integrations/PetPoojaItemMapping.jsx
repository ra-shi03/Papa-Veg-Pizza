import { useCallback, useEffect, useMemo, useState } from "react"
import { Download, Loader2, Search, Wand2 } from "lucide-react"
import { toast } from "sonner"
import { adminClient } from "@/services/api/axios"

// Which Pet Pooja item each of our items is. Pet Pooja only accepts an order with its own item ids, so every product size,
// combo and add-on this store sells needs one. The menu comes from Pet Pooja ("Fetch menu", or Pet Pooja pushes it when
// "Menu from Pet Pooja" is on); items with exactly the same name are mapped on their own, the rest are picked here.
const BASE = "/food/store/pos/petpooja"
const PAGE = 60
const errText = (e) => e?.response?.data?.message || e?.response?.data?.error || e?.message || "That did not work"
const card = "bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl p-5 shadow-sm"
const pill = (on) => `px-3 py-1.5 rounded-full text-[11px] font-bold cursor-pointer ${on ? "bg-[var(--primary)] text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"}`
const STATUS = {
  mapped: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
  unmapped: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
  missing: "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400",
}
const STATUS_TEXT = { mapped: "Mapped", unmapped: "Not mapped", missing: "Not in Pet Pooja menu" }
const KIND_TEXT = { product: "Item", combo: "Combo", addon: "Add-on" }

export default function PetPoojaItemMapping() {
  const [d, setD] = useState(null)
  const [busy, setBusy] = useState("")
  const [edits, setEdits] = useState({})
  const [filter, setFilter] = useState("unmapped")
  const [q, setQ] = useState("")
  const [shown, setShown] = useState(PAGE)

  const take = (data, done) => {
    setD(data)
    setEdits({})
    if (done) toast.success(done)
  }
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

  const load = useCallback(() => run("load", async () => take((await adminClient.get(`${BASE}/menu`))?.data?.data)), [])
  useEffect(() => { load() }, [load])

  const fetchMenu = () => run("fetch", async () => {
    const r = (await adminClient.post(`${BASE}/menu/fetch`))?.data?.data
    take(r, `Menu fetched: ${r.items} items. ${r.autoMapped} mapped by name.`)
  })
  const autoMap = () => run("auto", async () => {
    const r = (await adminClient.post(`${BASE}/menu/auto-map`))?.data?.data
    take(r, r.autoMapped ? `${r.autoMapped} mapped by name` : "No more exact name matches")
  })
  const saveEdits = () => run("save", async () => {
    const entries = Object.entries(edits).map(([key, value]) => ({ key, value }))
    take((await adminClient.put(`${BASE}/mapping`, { entries }))?.data?.data, "Mapping saved")
  })

  const itemOptions = useMemo(() => (d?.options || []).filter((o) => o.kind === "item"), [d])
  const addonOptions = useMemo(() => (d?.options || []).filter((o) => o.kind === "addon"), [d])
  const rows = useMemo(() => {
    const words = q.trim().toLowerCase()
    return (d?.rows || []).filter((r) => (filter === "all" || r.status === filter)
      && (!words || `${r.name} ${r.size} ${r.valueLabel}`.toLowerCase().includes(words)))
  }, [d, filter, q])
  const dirty = Object.keys(edits).length

  if (!d) {
    return <section className={card}><div className="flex justify-center py-6"><Loader2 className="animate-spin text-zinc-400" /></div></section>
  }

  return (
    <section className={`${card} space-y-4`}>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-black text-slate-900 dark:text-white">Item mapping</h2>
          <p className="text-zinc-500 text-xs mt-1">
            {d.menu
              ? `Pet Pooja menu: ${d.menu.items} items, ${d.menu.addons} add-ons (${d.menu.source === "push" ? "sent by Pet Pooja" : "fetched"} ${new Date(d.menu.receivedAt).toLocaleString()}).`
              : "Fetch your Pet Pooja menu, then pick the Pet Pooja item for each of your items. Orders with unmapped items cannot be billed in Pet Pooja."}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button type="button" disabled={!!busy} onClick={fetchMenu}
            className="px-4 py-2 rounded-full border border-zinc-200 dark:border-zinc-700 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
            {busy === "fetch" ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}Fetch menu
          </button>
          {d.menu && (
            <button type="button" disabled={!!busy} onClick={autoMap}
              className="px-4 py-2 rounded-full border border-zinc-200 dark:border-zinc-700 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
              {busy === "auto" ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}Match names
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {[["unmapped", `Not mapped (${d.stats.unmapped})`], ["missing", `Not in menu (${d.stats.missing})`], ["mapped", `Mapped (${d.stats.mapped})`], ["all", `All (${d.stats.total})`]].map(([k, t]) => (
          <button key={k} type="button" className={pill(filter === k)} onClick={() => { setFilter(k); setShown(PAGE) }}>{t}</button>
        ))}
        <label className="ml-auto flex items-center gap-1.5 h-8 px-3 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950">
          <Search size={12} className="text-zinc-400" />
          <input value={q} onChange={(e) => { setQ(e.target.value); setShown(PAGE) }} placeholder="Search" className="bg-transparent outline-none text-xs w-28" />
        </label>
      </div>

      {rows.length === 0 ? (
        <p className="text-xs text-zinc-500 py-4 text-center">{filter === "unmapped" ? "Every item is mapped." : "Nothing here."}</p>
      ) : (
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {rows.slice(0, shown).map((r) => {
            const value = edits[r.key] ?? r.value
            const opts = r.kind === "addon" ? addonOptions : itemOptions
            return (
              <div key={r.key} className="py-2.5 flex flex-col md:flex-row md:items-center gap-2">
                <div className="md:w-2/5 min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{r.name}{r.size && r.kind !== "addon" ? ` — ${r.size}` : ""}</p>
                  <p className="text-[10px] text-zinc-500 flex items-center gap-1.5 mt-0.5">
                    {KIND_TEXT[r.kind]}
                    <span className={`px-1.5 py-0.5 rounded-full font-bold ${STATUS[edits[r.key] !== undefined ? (value ? "mapped" : "unmapped") : r.status]}`}>
                      {edits[r.key] !== undefined ? "Changed" : STATUS_TEXT[r.status]}
                    </span>
                  </p>
                </div>
                <select value={value} disabled={!d.menu}
                  onChange={(e) => setEdits((x) => {
                    const next = { ...x }
                    if (e.target.value === r.value) delete next[r.key]
                    else next[r.key] = e.target.value
                    return next
                  })}
                  className="flex-1 h-9 px-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950 text-xs font-semibold outline-none focus:border-[var(--primary)] disabled:opacity-50">
                  <option value="">— Not mapped —</option>
                  {r.status === "missing" && edits[r.key] === undefined && <option value={r.value}>{r.value} (no longer in the menu)</option>}
                  {opts.map((o) => <option key={o.value} value={o.value}>{o.label}{o.active ? "" : " (off in Pet Pooja)"}</option>)}
                </select>
              </div>
            )
          })}
          {rows.length > shown && (
            <button type="button" onClick={() => setShown((n) => n + PAGE)} className="w-full py-2.5 text-xs font-bold text-[var(--primary)] cursor-pointer">
              Show more ({rows.length - shown})
            </button>
          )}
        </div>
      )}

      {dirty > 0 && (
        <div className="sticky bottom-3 flex items-center justify-between gap-3 rounded-2xl bg-zinc-900 text-white px-4 py-3 shadow-lg">
          <span className="text-xs font-bold">{dirty} change{dirty === 1 ? "" : "s"} not saved</span>
          <div className="flex gap-2">
            <button type="button" onClick={() => setEdits({})} className="text-xs font-bold text-zinc-300 cursor-pointer">Discard</button>
            <button type="button" disabled={!!busy} onClick={saveEdits}
              className="px-4 py-1.5 rounded-full bg-[var(--primary)] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
              {busy === "save" && <Loader2 size={12} className="animate-spin" />}Save mapping
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
