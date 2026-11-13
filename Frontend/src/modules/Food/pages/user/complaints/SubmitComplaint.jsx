import { useState, useEffect, useMemo, useCallback } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft,
  Pizza,
  Replace,
  PackageMinus,
  Package,
  Clock,
  MessageCircle,
  Check,
  CheckCircle2,
  Store,
  ShieldCheck,
  XCircle,
  History,
} from "lucide-react"
import { orderAPI } from "@food/api"
import useAppBackNavigation from "@food/hooks/useAppBackNavigation"
import { toast } from "sonner"

// `value` is what the server stores; the rest is only for this screen.
const COMPLAINT_TYPES = [
  { value: "Food Quality", label: "Food quality", icon: Pizza, askItems: true, hints: ["Food was cold", "Pizza was undercooked", "Toppings were missing", "Tasted stale"] },
  { value: "Wrong Item", label: "Wrong item", icon: Replace, askItems: true, hints: ["Received a different item", "Wrong size delivered", "Wrong crust or toppings"] },
  { value: "Missing Item", label: "Missing item", icon: PackageMinus, askItems: true, hints: ["An item was missing", "Dip or sauce was missing", "Cutlery was missing"] },
  { value: "Packaging Issue", label: "Packaging", icon: Package, askItems: false, hints: ["Box was damaged", "Food had spilled", "Packaging was not sealed"] },
  { value: "Late Delivery", label: "Late delivery", icon: Clock, askItems: false, hints: ["Order arrived very late", "Delivery took longer than promised"] },
  { value: "Other", label: "Something else", icon: MessageCircle, askItems: false, hints: [] },
]

const SUBJECT_MAX = 200
const DESC_MAX = 1000
const DESC_MIN = 15

const draftKey = (id) => `pvp_complaint_draft_${id}`
const field = "w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:ring-2 dark:bg-[#161616] dark:text-gray-100 dark:placeholder:text-gray-500"
const fieldOk = "border-gray-200 focus:border-[var(--primary)] focus:ring-[var(--primary)]/20 dark:border-gray-700"
const fieldBad = "border-red-300 focus:border-red-400 focus:ring-red-200 dark:border-red-800"

export default function SubmitComplaint() {
  const navigate = useNavigate()
  const goBack = useAppBackNavigation()
  const { orderId } = useParams()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [touched, setTouched] = useState({})
  const [form, setForm] = useState({ complaintType: "", subject: "", description: "", items: [] })

  const load = useCallback(async () => {
    if (!orderId) {
      setFailed(true)
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setFailed(false)
      const response = await orderAPI.getOrderDetails(orderId)
      const data = response?.data?.data?.order || response?.data?.order
      if (!data) throw new Error("not found")
      setOrder(data)
    } catch (error) {
      setFailed(true)
      toast.error(error?.response?.data?.message || "Could not load this order")
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    load()
  }, [load])

  // A half-written complaint survives a refresh or a trip back to the order
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(draftKey(orderId)) || "null")
      if (saved && typeof saved === "object") setForm((f) => ({ ...f, ...saved }))
    } catch (_) {}
  }, [orderId])
  useEffect(() => {
    if (done) return
    try {
      sessionStorage.setItem(draftKey(orderId), JSON.stringify(form))
    } catch (_) {}
  }, [form, orderId, done])

  const type = COMPLAINT_TYPES.find((t) => t.value === form.complaintType)
  const items = useMemo(() => (Array.isArray(order?.items) ? order.items.filter((i) => i.kind !== "addon" && i.kind !== "topping") : []), [order])
  const store = order?.storeId && typeof order.storeId === "object" ? order.storeId : {}
  const storeName = store.storeName || "Papa Veg Pizza"
  const thumb = items.find((i) => i.image)?.image || ""
  const placed = order?.createdAt
    ? new Date(order.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true })
    : ""
  const status = String(order?.orderStatus || order?.status || "")
  const statusLabel = status === "delivered" ? "Delivered" : status.includes("cancel") ? "Cancelled" : status === "created" ? "Placed" : status.replace(/_/g, " ")

  const errors = {
    complaintType: form.complaintType ? "" : "Choose what went wrong",
    subject: form.subject.trim() ? "" : "Add a short subject",
    description: form.description.trim().length >= DESC_MIN ? "" : `Tell us a little more (at least ${DESC_MIN} characters)`,
  }
  const valid = !errors.complaintType && !errors.subject && !errors.description
  const touch = (k) => setTouched((t) => ({ ...t, [k]: true }))
  const show = (k) => (touched[k] || touched.all) && errors[k]

  const pickType = (value) => {
    setForm((f) => ({ ...f, complaintType: value, items: [] }))
    touch("complaintType")
  }
  const toggleItem = (name) =>
    setForm((f) => ({ ...f, items: f.items.includes(name) ? f.items.filter((n) => n !== name) : [...f.items, name] }))

  const submit = async (e) => {
    e.preventDefault()
    if (!valid) {
      setTouched({ all: true })
      toast.error(errors.complaintType || errors.subject || errors.description)
      return
    }
    const orderMongoId = String(order?._id || orderId || "")
    if (!orderMongoId) return toast.error("Order ID not available")
    const affected = type?.askItems && form.items.length ? `Affected items: ${form.items.join(", ")}\n\n` : ""
    try {
      setSubmitting(true)
      const response = await orderAPI.submitComplaint({
        orderId: orderMongoId,
        complaintType: form.complaintType,
        subject: form.subject.trim(),
        description: `${affected}${form.description.trim()}`.slice(0, DESC_MAX + 300),
      })
      if (response?.data?.success) {
        try { sessionStorage.removeItem(draftKey(orderId)) } catch (_) {}
        setDone(true)
        setTimeout(() => navigate("/user/complaints", { replace: true }), 1900)
      } else {
        toast.error(response?.data?.message || "Could not submit your complaint")
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.response?.data?.error || "Could not submit your complaint")
    } finally {
      setSubmitting(false)
    }
  }

  const header = (
    <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-gray-100 bg-white/95 px-4 py-3 backdrop-blur dark:border-gray-800 dark:bg-[#121212]/95">
      <button type="button" onClick={goBack} aria-label="Back" className="-ml-1 rounded-full p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800">
        <ArrowLeft className="h-5 w-5 text-gray-700 dark:text-gray-300" />
      </button>
      <div className="min-w-0 flex-1">
        <h1 className="text-base font-bold leading-tight text-gray-900 dark:text-gray-100">Report an issue</h1>
        <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">We will look into it</p>
      </div>
      <button type="button" onClick={() => navigate("/user/complaints")} className="flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-bold text-[var(--primary)] active:scale-95 dark:border-gray-700">
        <History className="h-3.5 w-3.5" /> History
      </button>
    </div>
  )

  if (loading && !order) {
    const bar = "animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800"
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
        {header}
        <div className="space-y-3 p-4"><div className={`${bar} h-28`} /><div className={`${bar} h-40`} /><div className={`${bar} h-24`} /></div>
      </div>
    )
  }

  if (failed || !order) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
        {header}
        <div className="flex flex-col items-center px-8 pt-24 text-center">
          <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800"><XCircle className="h-8 w-8 text-gray-400" /></span>
          <p className="text-base font-bold text-gray-900 dark:text-gray-100">We could not load this order</p>
          <div className="mt-6 flex gap-3">
            <button type="button" onClick={load} className="rounded-xl bg-[var(--primary)] px-5 py-2.5 text-sm font-bold text-white active:scale-95">Try again</button>
            <button type="button" onClick={() => navigate("/user/orders")} className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-bold text-gray-700 active:scale-95 dark:border-gray-700 dark:text-gray-300">My orders</button>
          </div>
        </div>
      </div>
    )
  }

  const label = "mb-2 block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400"
  const subjectLeft = SUBJECT_MAX - form.subject.length
  const descLen = form.description.trim().length

  return (
    <div className="min-h-screen bg-gray-50 pb-32 font-sans dark:bg-[#0a0a0a]">
      {header}

      <form onSubmit={submit} noValidate className="space-y-5 p-4">
        {/* the order this is about */}
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-[#121212]">
          <div className="flex items-center gap-3">
            {thumb ? (
              <img src={thumb} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" onError={(e) => { e.currentTarget.style.display = "none" }} />
            ) : (
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-red-50 text-[var(--primary)] dark:bg-red-900/20"><Store className="h-6 w-6" /></span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-extrabold text-gray-900 dark:text-gray-100">{storeName}</p>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Order #{order.orderId || order._id}</p>
              <p className="text-[11px] text-gray-400">{placed}</p>
            </div>
            <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-bold uppercase text-gray-600 dark:bg-gray-800 dark:text-gray-300">{statusLabel}</span>
          </div>
          {items.length > 0 && (
            <p className="mt-3 line-clamp-1 border-t border-dashed border-gray-200 pt-3 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
              {items.length} {items.length === 1 ? "item" : "items"}: {items.map((i) => `${i.quantity || 1} × ${i.name}`).join(", ")}
            </p>
          )}
        </div>

        {/* what went wrong */}
        <section>
          <span className={label}>What went wrong? <span className="text-red-500">*</span></span>
          <div className="grid grid-cols-2 gap-2.5">
            {COMPLAINT_TYPES.map((t) => {
              const on = form.complaintType === t.value
              const Icon = t.icon
              return (
                <button
                  type="button"
                  key={t.value}
                  onClick={() => pickType(t.value)}
                  aria-pressed={on}
                  className={`relative flex items-center gap-2.5 rounded-xl border px-3 py-3 text-left text-sm font-semibold transition active:scale-[0.97] ${on ? "border-[var(--primary)] bg-[var(--primary)]/5 text-gray-900 shadow-sm dark:text-white" : "border-gray-200 bg-white text-gray-700 dark:border-gray-800 dark:bg-[#121212] dark:text-gray-300"}`}
                >
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${on ? "bg-[var(--primary)] text-white" : "bg-gray-100 text-gray-500 dark:bg-gray-800"}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="leading-tight">{t.label}</span>
                  {on && <Check className="absolute right-2 top-2 h-3.5 w-3.5 text-[var(--primary)]" strokeWidth={3} />}
                </button>
              )
            })}
          </div>
          {show("complaintType") && <p className="mt-1.5 text-xs font-medium text-red-500">{errors.complaintType}</p>}
        </section>

        {/* which items, only when it makes sense */}
        <AnimatePresence initial={false}>
          {type?.askItems && items.length > 0 && (
            <motion.section key="items" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <span className={label}>Which items? <span className="font-medium normal-case text-gray-400">(optional)</span></span>
              <div className="flex flex-wrap gap-2">
                {items.map((i, idx) => {
                  const on = form.items.includes(i.name)
                  return (
                    <button type="button" key={`${i.name}-${idx}`} onClick={() => toggleItem(i.name)} aria-pressed={on}
                      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${on ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-gray-200 bg-white text-gray-700 dark:border-gray-700 dark:bg-[#121212] dark:text-gray-300"}`}>
                      {on && <Check className="h-3 w-3" strokeWidth={3} />}
                      {i.name}{i.size ? ` (${i.size})` : ""}
                    </button>
                  )
                })}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* subject */}
        <section>
          <div className="flex items-baseline justify-between">
            <label htmlFor="c-subject" className={label}>Subject <span className="text-red-500">*</span></label>
            {form.subject.length > SUBJECT_MAX - 40 && <span className="text-[11px] font-medium text-gray-400">{subjectLeft} left</span>}
          </div>
          <input
            id="c-subject"
            type="text"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            onBlur={() => touch("subject")}
            placeholder="In a few words, what happened?"
            maxLength={SUBJECT_MAX}
            className={`${field} ${show("subject") ? fieldBad : fieldOk}`}
          />
          {type?.hints.length > 0 && !form.subject && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {type.hints.map((h) => (
                <button type="button" key={h} onClick={() => setForm((f) => ({ ...f, subject: h }))} className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600 active:scale-95 dark:bg-gray-800 dark:text-gray-300">
                  {h}
                </button>
              ))}
            </div>
          )}
          {show("subject") && <p className="mt-1.5 text-xs font-medium text-red-500">{errors.subject}</p>}
        </section>

        {/* description */}
        <section>
          <label htmlFor="c-desc" className={label}>Details <span className="text-red-500">*</span></label>
          <textarea
            id="c-desc"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            onBlur={() => touch("description")}
            placeholder="Tell us what happened. The more detail, the faster we can sort it out."
            rows={5}
            maxLength={DESC_MAX}
            className={`${field} resize-none ${show("description") ? fieldBad : fieldOk}`}
          />
          <div className="mt-1.5 flex items-center justify-between gap-3">
            <p className={`text-xs font-medium ${show("description") ? "text-red-500" : "text-gray-400"}`}>
              {show("description") ? errors.description : descLen >= DESC_MIN ? "Thanks, that helps" : `Add a few more words`}
            </p>
            <span className="text-[11px] font-medium text-gray-400">{form.description.length}/{DESC_MAX}</span>
          </div>
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
            <div className={`h-full rounded-full transition-all ${descLen >= DESC_MIN ? "bg-emerald-500" : "bg-[var(--primary)]"}`} style={{ width: `${Math.min(100, (descLen / DESC_MIN) * 100)}%` }} />
          </div>
        </section>

        <div className="flex gap-3 rounded-2xl border border-sky-100 bg-sky-50 p-4 dark:border-sky-900/30 dark:bg-sky-900/10">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-sky-600 dark:text-sky-400" />
          <div className="text-xs leading-relaxed text-sky-900 dark:text-sky-200">
            <p className="mb-0.5 text-sm font-bold">What happens next?</p>
            Your complaint goes to the store, which will review it and reply. Follow its status any time under <b>History</b>.
          </div>
        </div>

        {/* sticky submit */}
        <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-gray-100 bg-white/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur dark:border-gray-800 dark:bg-[#121212]/95">
          <button
            type="submit"
            disabled={submitting}
            className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white shadow-md transition active:scale-[0.98] disabled:cursor-not-allowed ${valid ? "bg-[var(--primary)]" : "bg-[var(--primary)]/55"}`}
          >
            {submitting ? (
              <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Sending…</>
            ) : (
              "Submit complaint"
            )}
          </button>
        </div>
      </form>

      {/* sent */}
      <AnimatePresence>
        {done && (
          <motion.div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white px-8 text-center dark:bg-[#121212]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 280, damping: 16 }} className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_14px_36px_rgba(16,185,129,0.4)]">
              <CheckCircle2 className="h-12 w-12" />
            </motion.span>
            <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mt-6 text-xl font-extrabold text-gray-900 dark:text-white">Complaint sent</motion.h2>
            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="mt-1 text-sm text-gray-500">{storeName} will review it and reply. We will take you to your complaints.</motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
