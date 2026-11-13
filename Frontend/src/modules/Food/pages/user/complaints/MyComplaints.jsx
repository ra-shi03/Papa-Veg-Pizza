import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  MessageCircle,
  Plus,
  X,
  Pizza,
  Replace,
  PackageMinus,
  Package,
  Clock,
  CheckCircle2,
  Store,
  Reply as ReplyIcon,
  Search,
  RefreshCw,
} from "lucide-react"
import { orderAPI, supportAPI } from "@food/api"
import useAppBackNavigation from "@food/hooks/useAppBackNavigation"

const PAGE_SIZE = 20

const STATUS = {
  open: { label: "Received", step: 0, chip: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400", bar: "bg-amber-400" },
  "in-progress": { label: "In progress", step: 1, chip: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400", bar: "bg-sky-500" },
  resolved: { label: "Resolved", step: 2, chip: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400", bar: "bg-emerald-500" },
}
const STEPS = ["Received", "Reviewing", "Resolved"]

const TYPE_ICON = {
  "Food Quality": Pizza,
  "Wrong Item": Replace,
  "Missing Item": PackageMinus,
  "Packaging Issue": Package,
  "Late Delivery": Clock,
}

const FILTERS = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "resolved", label: "Resolved" },
]

const when = (value) =>
  value
    ? new Date(value).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true })
    : ""

const ago = (value) => {
  if (!value) return ""
  const mins = Math.round((Date.now() - new Date(value).getTime()) / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs} hr ago`
  const days = Math.round(hrs / 24)
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`
  return when(value).split(",")[0]
}

function Reply({ title, message, at, tone = "store" }) {
  return (
    <div className={`rounded-xl p-3 ${tone === "store" ? "bg-gray-50 dark:bg-white/5" : "bg-red-50 dark:bg-red-900/10"}`}>
      <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[var(--primary)]">
        <ReplyIcon className="h-3 w-3" /> {title}
      </p>
      <p className="mt-1 whitespace-pre-wrap break-words text-sm text-gray-700 dark:text-gray-200">{message}</p>
      {at && <p className="mt-1 text-[11px] text-gray-400">{ago(at)}</p>}
    </div>
  )
}

function Progress({ step }) {
  return (
    <div className="flex items-center">
      {STEPS.map((label, i) => {
        const done = i <= step
        return (
          <div key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-white ${done ? "bg-emerald-500" : "bg-gray-200 dark:bg-gray-700"}`}>
                {done && <CheckCircle2 className="h-3 w-3" />}
              </span>
              <span className={`text-[10px] font-semibold ${done ? "text-gray-800 dark:text-gray-100" : "text-gray-400"}`}>{label}</span>
            </div>
            {i < STEPS.length - 1 && <span className={`mx-1 mb-4 h-0.5 flex-1 rounded-full ${i < step ? "bg-emerald-400" : "bg-gray-200 dark:bg-gray-700"}`} />}
          </div>
        )
      })}
    </div>
  )
}

function ComplaintCard({ ticket, index }) {
  const [open, setOpen] = useState(false)
  const status = STATUS[ticket.status] || STATUS.open
  const Icon = TYPE_ICON[ticket.issueType] || MessageCircle
  const outcome = ticket.resolution
  const replies = ticket.responses || []
  const replyCount = replies.length + (ticket.adminResponse ? 1 : 0)
  const long = (ticket.description || "").length > 120 || (ticket.description || "").includes("\n")

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 6) * 0.04 }}
      className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-[#121212]"
    >
      <div className={`h-1 ${status.bar}`} />
      <div className="space-y-3 p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-[var(--primary)] dark:bg-red-900/20"><Icon className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1">
            <p className="break-words text-sm font-extrabold text-gray-900 dark:text-white">{ticket.issueType}</p>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-gray-500 dark:text-gray-400">
              {ticket.orderNumber && <span>Order #{ticket.orderNumber}</span>}
              {ticket.storeName && <span className="flex items-center gap-1"><span className="text-gray-300">•</span><Store className="h-3 w-3" />{ticket.storeName}</span>}
            </p>
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${status.chip}`}>{status.label}</span>
        </div>

        {ticket.description && (
          <div>
            <p className={`whitespace-pre-wrap break-words text-sm text-gray-600 dark:text-gray-300 ${open ? "" : "line-clamp-2"}`}>{ticket.description}</p>
            {long && (
              <button type="button" onClick={() => setOpen((o) => !o)} className="mt-1 text-xs font-bold text-[var(--primary)]">
                {open ? "Show less" : "Read more"}
              </button>
            )}
          </div>
        )}

        <Progress step={status.step} />

        <div className="flex items-center justify-between text-[11px] text-gray-400">
          <span title={when(ticket.createdAt)}>Sent {ago(ticket.createdAt)}</span>
          {replyCount > 0 && (
            <button type="button" onClick={() => setOpen((o) => !o)} className="flex items-center gap-1 font-bold text-[var(--primary)]">
              {replyCount} {replyCount === 1 ? "reply" : "replies"}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
          )}
        </div>

        <AnimatePresence initial={false}>
          {open && replyCount > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-2 overflow-hidden">
              {replies.map((reply, i) => <Reply key={i} title="Reply from the store" message={reply.message} at={reply.at} />)}
              {ticket.adminResponse && <Reply title="Reply from Papa Veg Pizza" message={ticket.adminResponse} tone="admin" />}
            </motion.div>
          )}
        </AnimatePresence>

        {outcome && (
          <div className="rounded-xl bg-emerald-50 p-3 text-sm dark:bg-emerald-500/10">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400"><CheckCircle2 className="h-3.5 w-3.5" /> How it was resolved</p>
            <p className="mt-1 whitespace-pre-wrap break-words text-gray-700 dark:text-gray-200">{outcome.actionTaken}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {outcome.refundAmount > 0 && <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-white/10 dark:text-emerald-300">Refund ₹{outcome.refundAmount}</span>}
              {outcome.couponIssued && <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-white/10 dark:text-emerald-300">Coupon {outcome.couponIssued}</span>}
              {outcome.replacementOrderId && <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-white/10 dark:text-emerald-300">Replacement {outcome.replacementOrderId}</span>}
            </div>
            {outcome.resolvedAt && <p className="mt-1.5 text-[11px] text-gray-400">{when(outcome.resolvedAt)}</p>}
          </div>
        )}
      </div>
    </motion.div>
  )
}

function OrderPicker({ onClose, onPick }) {
  const [orders, setOrders] = useState(null)
  const [failed, setFailed] = useState(false)
  const [query, setQuery] = useState("")

  useEffect(() => {
    let alive = true
    orderAPI
      .getOrders({ limit: 20, page: 1 })
      .then((res) => {
        const data = res?.data?.data
        if (alive) setOrders(data?.orders || data?.docs || (Array.isArray(data) ? data : []))
      })
      .catch(() => {
        if (alive) setFailed(true)
      })
    return () => {
      alive = false
    }
  }, [])

  const shown = (orders || []).filter((o) => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return [o.order_id, o.orderId, o.storeId?.storeName, ...(o.items || []).map((i) => i.name)].some((v) => String(v || "").toLowerCase().includes(q))
  })

  return (
    <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        role="dialog"
        aria-label="Choose an order"
        className="flex max-h-[80vh] w-full max-w-md flex-col rounded-t-3xl bg-white dark:bg-[#161616]"
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 320 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-gray-200 dark:bg-gray-700" />
        <div className="flex items-center justify-between px-4 pb-2 pt-3">
          <div>
            <h2 className="text-base font-extrabold text-gray-900 dark:text-white">Which order is this about?</h2>
            <p className="text-xs text-gray-500">Pick the order you had a problem with</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-white/10"><X className="h-5 w-5 text-gray-600 dark:text-gray-300" /></button>
        </div>
        {orders && orders.length > 4 && (
          <div className="relative px-4 pb-2">
            <Search className="absolute left-7 top-2.5 h-4 w-4 text-gray-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by order ID, store or dish" className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-[var(--primary)] dark:border-gray-700 dark:bg-[#1c1c1c] dark:text-gray-100" />
          </div>
        )}
        <div className="space-y-1.5 overflow-y-auto px-3 pb-4">
          {failed && <p className="p-6 text-center text-sm text-gray-500">Could not load your orders. Please try again.</p>}
          {!failed && orders === null && [0, 1, 2].map((n) => <div key={n} className="h-16 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />)}
          {orders?.length === 0 && <p className="p-6 text-center text-sm text-gray-500">You can raise a complaint once you have placed an order.</p>}
          {orders?.length > 0 && shown.length === 0 && <p className="p-6 text-center text-sm text-gray-500">No orders match your search.</p>}
          {shown.map((order) => {
            const img = (order.items || []).find((i) => i.image)?.image
            const names = (order.items || []).map((i) => i.name).join(", ")
            return (
              <button key={order._id} type="button" onClick={() => onPick(order._id)} className="flex w-full items-center gap-3 rounded-xl border border-gray-100 p-3 text-left active:scale-[0.99] hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5">
                {img ? <img src={img} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" onError={(e) => { e.currentTarget.style.display = "none" }} /> : <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-red-50 text-[var(--primary)] dark:bg-red-900/20"><Store className="h-5 w-5" /></span>}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-gray-900 dark:text-white">Order #{order.order_id || order.orderId || order._id}</span>
                  <span className="block truncate text-xs text-gray-500">{names || order.storeId?.storeName}</span>
                  <span className="block text-[11px] text-gray-400">{when(order.createdAt)}{order.pricing?.total ? ` · ₹${order.pricing.total}` : ""}</span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
              </button>
            )
          })}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function MyComplaints() {
  const navigate = useNavigate()
  const goBack = useAppBackNavigation()
  const [tickets, setTickets] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [failed, setFailed] = useState(false)
  const [picking, setPicking] = useState(false)
  const [filter, setFilter] = useState("all")

  const load = useCallback(async (nextPage) => {
    const res = await supportAPI.getMyTickets({ page: nextPage, limit: PAGE_SIZE })
    const data = res?.data?.data || {}
    setTickets((current) => (nextPage === 1 ? data.tickets || [] : [...current, ...(data.tickets || [])]))
    setTotal(data.total || 0)
    setPage(nextPage)
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true)
    setFailed(false)
    try {
      await load(1)
    } catch {
      setFailed(true)
    } finally {
      setLoading(false)
    }
  }, [load])

  useEffect(() => {
    refresh()
  }, [refresh])

  const loadMore = async () => {
    setLoadingMore(true)
    try {
      await load(page + 1)
    } catch {
      setFailed(true)
    } finally {
      setLoadingMore(false)
    }
  }

  const counts = useMemo(() => ({
    all: tickets.length,
    open: tickets.filter((t) => t.status !== "resolved").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
  }), [tickets])
  const shown = tickets.filter((t) => filter === "all" || (filter === "resolved" ? t.status === "resolved" : t.status !== "resolved"))

  return (
    <div className="min-h-screen bg-gray-50 pb-28 font-sans dark:bg-[#0a0a0a]">
      <div className="sticky top-0 z-20 border-b border-gray-100 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-[#121212]/95">
        <div className="flex items-center gap-3 px-4 py-3">
          <button type="button" onClick={goBack} aria-label="Back" className="-ml-1 rounded-full p-1.5 hover:bg-gray-100 dark:hover:bg-white/10"><ArrowLeft className="h-5 w-5 text-gray-700 dark:text-gray-200" /></button>
          <div className="min-w-0 flex-1">
            <h1 className="text-base font-bold leading-tight text-gray-900 dark:text-white">My complaints</h1>
            <p className="text-[11px] font-medium text-gray-500">{total > 0 ? `${total} in total` : "Track your reports here"}</p>
          </div>
          <button type="button" onClick={refresh} aria-label="Refresh" className="rounded-full p-2 text-gray-500 hover:bg-gray-100 active:scale-90 dark:hover:bg-white/10">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
        {tickets.length > 0 && (
          <div className="flex gap-2 px-4 pb-3">
            {FILTERS.map((f) => (
              <button key={f.key} type="button" onClick={() => setFilter(f.key)} aria-pressed={filter === f.key}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition active:scale-95 ${filter === f.key ? "bg-[var(--primary)] text-white" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"}`}>
                {f.label} <span className={filter === f.key ? "text-white/80" : "text-gray-400"}>{counts[f.key]}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mx-auto max-w-2xl space-y-3 p-4">
        {loading && tickets.length === 0 && [0, 1, 2].map((n) => <div key={n} className="h-40 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800" />)}

        {!loading && failed && (
          <div className="py-12 text-center">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Could not load your complaints.</p>
            <button type="button" onClick={refresh} className="mt-3 rounded-xl bg-[var(--primary)] px-5 py-2.5 text-sm font-bold text-white active:scale-95">Try again</button>
          </div>
        )}

        {!loading && !failed && tickets.length === 0 && (
          <div className="py-14 text-center">
            <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-[var(--primary)] dark:bg-red-900/20"><MessageSquare className="h-9 w-9" /></span>
            <p className="mt-4 text-base font-extrabold text-gray-900 dark:text-white">No complaints yet</p>
            <p className="mx-auto mt-1 max-w-xs text-sm text-gray-500">Hope it stays that way! If something goes wrong with an order, tell us and we will sort it out.</p>
          </div>
        )}

        {!loading && tickets.length > 0 && shown.length === 0 && (
          <p className="py-12 text-center text-sm text-gray-500">No {filter === "resolved" ? "resolved" : "open"} complaints.</p>
        )}

        {shown.map((ticket, i) => <ComplaintCard key={ticket._id} ticket={ticket} index={i} />)}

        {!loading && tickets.length < total && (
          <button type="button" onClick={loadMore} disabled={loadingMore} className="w-full rounded-xl border border-gray-200 py-3 text-sm font-bold text-[var(--primary)] active:scale-[0.99] disabled:opacity-60 dark:border-gray-700">
            {loadingMore ? "Loading…" : "Show more"}
          </button>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-gray-100 bg-white/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur dark:border-gray-800 dark:bg-[#121212]/95">
        <button type="button" onClick={() => setPicking(true)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] py-3.5 text-sm font-bold text-white shadow-md active:scale-[0.98]">
          <Plus className="h-4 w-4" /> Raise a complaint
        </button>
      </div>

      <AnimatePresence>
        {picking && <OrderPicker onClose={() => setPicking(false)} onPick={(orderId) => navigate(`/user/complaints/submit/${encodeURIComponent(String(orderId))}`)} />}
      </AnimatePresence>
    </div>
  )
}
