import { useCallback, useEffect, useState } from "react"
import { Loader2, RefreshCw } from "lucide-react"
import { adminClient } from "@/services/api/axios"

// One layout for the franchise admin's "across my stores" screens: real data from /food/franchise/overview/*,
// a store filter, a search box, a status filter and a table. No sample data; an empty list says so.
export const errText = (e) => e?.response?.data?.message || e?.response?.data?.error || e?.message || "Could not load this page"
export const day = (v) => (v ? new Date(v).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-")
export const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`
export const BASE = "/food/franchise/overview"

const TONES = {
  green: "bg-emerald-50 text-emerald-700 border-emerald-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  red: "bg-rose-50 text-rose-700 border-rose-200",
  grey: "bg-zinc-50 text-zinc-500 border-zinc-200",
}
const TONE_OF = {
  available: "green", member: "green", approved: "green", resolved: "green", closed: "grey", low_stock: "amber", pending: "amber", open: "amber",
  in_progress: "amber", reported: "amber", medium: "amber", high: "red", critical: "red", out_of_stock: "red", rejected: "red",
  escalated: "red", active: "red",
}
export const Badge = ({ value }) => (
  <span className={`px-2 py-0.5 rounded-full border text-[10px] font-black uppercase ${TONES[TONE_OF[value] || "grey"]}`}>{String(value || "-").replace(/_/g, " ")}</span>
)

export function useOverview(path) {
  const [data, setData] = useState({ rows: [], stores: [] })
  const [storeId, setStoreId] = useState("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminClient.get(`${BASE}/${path}`, { params: storeId === "all" ? {} : { storeId } })
      setData(res?.data?.data || { rows: [], stores: [] })
      setError("")
    } catch (e) {
      setError(errText(e))
    } finally {
      setLoading(false)
    }
  }, [path, storeId])
  useEffect(() => { load() }, [load])
  return { data, storeId, setStoreId, loading, error, load }
}

const field = "h-9 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-semibold outline-none"

export default function OverviewPage({ title, subtitle, query, rows, columns, searchKeys = [], filter, summary, empty = "Nothing here yet." }) {
  const { data, storeId, setStoreId, loading, error, load } = query
  const [search, setSearch] = useState("")
  const [picked, setPicked] = useState("all")
  const all = rows || data.rows || []
  const term = search.trim().toLowerCase()
  const shown = all.filter((r) =>
    (!term || searchKeys.some((k) => String(r[k] || "").toLowerCase().includes(term))) &&
    (!filter || picked === "all" || String(r[filter.key]) === picked))

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-zinc-900 dark:text-white">{title}</h1>
          <p className="text-xs text-zinc-500 font-medium">{subtitle}</p>
        </div>
        <button onClick={load} className={`${field} inline-flex items-center gap-1.5 cursor-pointer`}>
          {loading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}Refresh
        </button>
      </div>
      {summary}
      <div className="flex flex-wrap gap-2">
        <select className={field} value={storeId} onChange={(e) => setStoreId(e.target.value)}>
          <option value="all">All stores</option>
          {(data.stores || []).map((s) => <option key={s._id} value={s._id}>{s.storeName}</option>)}
        </select>
        {searchKeys.length > 0 && <input className={`${field} w-56`} placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />}
        {filter && (
          <select className={field} value={picked} onChange={(e) => setPicked(e.target.value)}>
            <option value="all">{filter.label}</option>
            {filter.options.map((o) => <option key={o} value={o}>{o.replace(/_/g, " ")}</option>)}
          </select>
        )}
      </div>
      {error && <p className="text-xs font-bold text-rose-600">{error}</p>}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-wider text-zinc-400">
              {columns.map((c) => <th key={c.title} className="px-4 py-3 font-black">{c.title}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {shown.map((r) => (
              <tr key={r._id} className="text-zinc-700 dark:text-zinc-300 font-semibold align-top">
                {columns.map((c) => <td key={c.title} className="px-4 py-3">{c.render ? c.render(r) : r[c.key] || r[c.key] === 0 ? r[c.key] : "-"}</td>)}
              </tr>
            ))}
            {!shown.length && (
              <tr><td colSpan={columns.length} className="px-4 py-10 text-center text-zinc-400 font-semibold">{loading ? "Loading..." : empty}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
