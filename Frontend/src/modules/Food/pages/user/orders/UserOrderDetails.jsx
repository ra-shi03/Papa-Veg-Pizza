import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import useAppBackNavigation from "@food/hooks/useAppBackNavigation"
import {
  ArrowLeft,
  Phone,
  Copy,
  Check,
  Download,
  RotateCcw,
  MapPin,
  CreditCard,
  Clock,
  CheckCircle2,
  XCircle,
  ChefHat,
  Bike,
  PackageCheck,
  Store,
  MessageSquareWarning,
  Sparkles,
  Wallet,
  Banknote,
  ChevronRight,
  PhoneCall,
} from "lucide-react"
import { orderAPI } from "@food/api"
import { replaceCartWithLines } from "@food/utils/userCart"
import { toast } from "sonner"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { getCompanyNameAsync } from "@food/utils/businessSettings"
import { downloadFile } from "@/shared/utils/downloadUtils"

// ---------------------------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------------------------

const rupees = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`

const fmtDateTime = (value) =>
  value
    ? new Date(value).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true })
    : ""
const fmtShort = (value) =>
  value ? new Date(value).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true }) : ""

const CANCELLED = ["cancelled_by_user", "cancelled_by_store", "cancelled_by_admin", "cancelled"]
const isCancelledStatus = (s) => String(s || "").includes("cancel")

const TIMELINE = [
  { key: "created", label: "Order placed", match: ["created"], icon: Clock },
  { key: "confirmed", label: "Accepted by the store", match: ["confirmed"], icon: Store },
  { key: "preparing", label: "Preparing your pizza", match: ["preparing"], icon: ChefHat },
  { key: "ready", label: "Packed and ready", match: ["ready_for_pickup", "reached_pickup"], icon: PackageCheck },
  { key: "way", label: "Out for delivery", match: ["picked_up", "reached_drop"], icon: Bike },
  { key: "delivered", label: "Delivered", match: ["delivered"], icon: CheckCircle2 },
]

const PAYMENT_LABEL = { razorpay: "Online payment", razorpay_qr: "UPI QR", wallet: "Wallet", cash: "Cash on delivery", cod: "Cash on delivery" }

const statusHero = (status, cancelledByStore) => {
  const s = String(status || "")
  if (s === "delivered") return { tone: "green", icon: CheckCircle2, title: "Delivered", sub: "Hope you enjoyed every bite" }
  if (isCancelledStatus(s))
    return {
      tone: "red",
      icon: XCircle,
      title: s === "cancelled_by_user" ? "You cancelled this order" : cancelledByStore ? "Cancelled by the store" : "Order cancelled",
      sub: "",
    }
  if (s === "created") return { tone: "amber", icon: Clock, title: "Waiting for the store", sub: "The store will accept your order shortly" }
  if (s === "confirmed") return { tone: "blue", icon: Store, title: "Order accepted", sub: "The kitchen is getting started" }
  if (s === "preparing") return { tone: "blue", icon: ChefHat, title: "Preparing your pizza", sub: "Fresh from the oven soon" }
  if (s === "ready_for_pickup" || s === "reached_pickup") return { tone: "blue", icon: PackageCheck, title: "Packed and ready", sub: "Waiting for the delivery partner" }
  if (s === "picked_up" || s === "reached_drop") return { tone: "blue", icon: Bike, title: "On the way", sub: "Your delivery partner is heading to you" }
  return { tone: "amber", icon: Clock, title: "Processing", sub: "" }
}

const TONES = {
  green: { chip: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400", ring: "bg-emerald-500" },
  red: { chip: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400", ring: "bg-red-500" },
  amber: { chip: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400", ring: "bg-amber-500" },
  blue: { chip: "bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-400", ring: "bg-sky-500" },
}

const card = "rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-[#121212]"
const sectionTitle = "text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500"

function Reveal({ i = 0, children }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i, duration: 0.3 }}>
      {children}
    </motion.div>
  )
}

function Skeleton() {
  const bar = "animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800"
  return (
    <div className="space-y-3 p-4">
      <div className={`${bar} h-24`} />
      <div className={`${bar} h-28`} />
      <div className={`${bar} h-48`} />
      <div className={`${bar} h-56`} />
    </div>
  )
}

// ---------------------------------------------------------------------------------------------
// page
// ---------------------------------------------------------------------------------------------

export default function UserOrderDetails() {
  const navigate = useNavigate()
  const goBack = useAppBackNavigation()
  const { orderId } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [copied, setCopied] = useState(false)
  const [callOpen, setCallOpen] = useState(false)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setFailed(false)
      const response = await orderAPI.getOrderDetails(orderId)
      const data = response?.data?.data?.order || response?.data?.order || null
      if (!data || typeof data !== "object") throw new Error("not found")
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

  const d = useMemo(() => {
    if (!order) return null
    const store = order.storeId && typeof order.storeId === "object" ? order.storeId : {}
    const items = Array.isArray(order.items) ? order.items : []
    const pricing = order.pricing || {}
    const status = order.orderStatus || order.status || ""
    const addr = order.deliveryAddress || order.address || {}
    const history = Array.isArray(order.statusHistory) ? order.statusHistory : []
    const stampOf = (statuses) => {
      const hit = history.find((h) => statuses.includes(h.to))
      return hit ? hit.at || hit.createdAt || null : null
    }
    const storeName = store.storeName || order.storeName || "Papa Veg Pizza"
    const storeAddress = [store.address, store.area, store.pincode].filter(Boolean).join(", ") || order.storeAddress || ""
    const addressText = [addr.street, addr.additionalDetails, addr.city, addr.state, addr.zipCode].filter(Boolean).join(", ")
    const method = order.payment?.method || ""
    const payStatus = order.payment?.status || ""
    const contact = order.storeContact || { name: "", phone: store.phone || "", isManager: false }
    const cancelled = isCancelledStatus(status)
    const active = !cancelled && status !== "delivered"
    const savings = Number(pricing.discount || 0)
    return {
      store, items, pricing, status, addr, history, stampOf, storeName, storeAddress, addressText, method, payStatus, contact,
      cancelled, active, savings,
      displayId: order.orderId || order.order_id || order._id || orderId,
      image: items.find((i) => i.image)?.image || store.profileImage?.url || (typeof store.profileImage === "string" ? store.profileImage : "") || "",
      hero: statusHero(status, status === "cancelled_by_store" || status === "cancelled_by_admin"),
      placedAt: order.createdAt,
      cancel: order.cancellationReason || order.cancellation?.reason || "",
      cancelMessage: order.cancellationMessage || order.cancellation?.message || "",
    }
  }, [order, orderId])

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(String(d.displayId))
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      toast.error("Could not copy the order ID")
    }
  }

  const openCall = () => {
    if (!d.contact.phone) {
      toast.error("The store's phone number is not available right now")
      return
    }
    setCallOpen(true)
  }

  const handleReorder = () => {
    const added = replaceCartWithLines(d.items)
    if (!added) {
      toast.error("These items cannot be reordered right now")
      return
    }
    toast.success("Items added to your cart")
    navigate("/user/cart")
  }

  const handleInvoice = async () => {
    try {
      const company = await getCompanyNameAsync()
      const doc = new jsPDF()
      doc.setFontSize(16)
      doc.setFont("helvetica", "bold")
      doc.text(`${company}: Order Summary`, 105, 20, { align: "center" })
      doc.setFontSize(10)
      const rows = [
        ["Order ID", String(d.displayId)],
        ["Placed", fmtDateTime(d.placedAt)],
        ["Customer", order.customerName || d.addr.name || "Customer"],
        ["Delivery address", d.addressText || "N/A"],
        ["Store", d.storeName],
        ["Store address", d.storeAddress || "N/A"],
        ["Payment", `${PAYMENT_LABEL[d.method] || d.method || "N/A"}${d.payStatus ? ` (${d.payStatus.replace(/_/g, " ")})` : ""}`],
      ]
      let y = 34
      rows.forEach(([k, v]) => {
        doc.setFont("helvetica", "bold")
        doc.text(`${k}:`, 20, y)
        doc.setFont("helvetica", "normal")
        const lines = doc.splitTextToSize(String(v), 125)
        doc.text(lines, 62, y)
        y += Math.max(1, lines.length) * 6 + 1
      })
      autoTable(doc, {
        startY: y + 4,
        head: [["Item", "Qty", "Price", "Total"]],
        body: d.items.map((i) => [
          [i.name, i.size ? `(${i.size})` : ""].filter(Boolean).join(" "),
          String(i.quantity || 1),
          `Rs. ${Number(i.price || 0).toFixed(2)}`,
          `Rs. ${(Number(i.price || 0) * (i.quantity || 1)).toFixed(2)}`,
        ]),
        theme: "striped",
        headStyles: { fillColor: [229, 57, 53], textColor: 255 },
        styles: { fontSize: 9 },
        columnStyles: { 1: { halign: "center" }, 2: { halign: "right" }, 3: { halign: "right" } },
      })
      let fy = (doc.lastAutoTable?.finalY || y + 30) + 8
      const p = d.pricing
      const lines = [
        ["Item total", p.subtotal],
        p.discount ? ["Discount", -p.discount] : null,
        ["Taxes", p.tax],
        p.deliveryFee ? ["Delivery fee", p.deliveryFee] : ["Delivery fee", "Free"],
        p.packagingFee ? ["Packaging fee", p.packagingFee] : null,
        p.handlingFee ? ["Handling fee", p.handlingFee] : null,
        p.platformFee ? ["Platform fee", p.platformFee] : null,
      ].filter(Boolean)
      doc.setFont("helvetica", "normal")
      lines.forEach(([k, v]) => {
        doc.text(k, 130, fy)
        doc.text(typeof v === "number" ? `${v < 0 ? "-" : ""}Rs. ${Math.abs(v).toFixed(2)}` : String(v), 195, fy, { align: "right" })
        fy += 6
      })
      doc.setFont("helvetica", "bold")
      doc.setFontSize(12)
      doc.text("Total", 130, fy + 3)
      doc.text(`Rs. ${Number(p.total || 0).toFixed(2)}`, 195, fy + 3, { align: "right" })
      downloadFile({ data: doc.output("blob"), filename: `Order_${d.displayId}.pdf`, type: "application/pdf" })
      toast.success("Invoice downloaded")
    } catch {
      toast.error("Could not create the invoice")
    }
  }

  const reportIssue = () => {
    const id = order?._id || orderId
    if (!id) return toast.error("Order ID not available. Please refresh the page.")
    navigate(`/user/complaints/submit/${encodeURIComponent(String(id))}`)
  }

  // ------------------------------------------------------------------ states

  const header = (
    <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-gray-100 bg-white/95 px-4 py-3 backdrop-blur dark:border-gray-800 dark:bg-[#121212]/95">
      <button type="button" onClick={goBack} aria-label="Back" className="-ml-1 rounded-full p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800">
        <ArrowLeft className="h-5 w-5 text-gray-700 dark:text-gray-300" />
      </button>
      <div className="min-w-0 flex-1">
        <h1 className="text-base font-bold leading-tight text-gray-900 dark:text-gray-100">Order details</h1>
        {d && <p className="truncate text-[11px] font-medium text-gray-500 dark:text-gray-400">#{d.displayId}</p>}
      </div>
      {d && (
        <button type="button" onClick={copyId} className="flex items-center gap-1 rounded-full border border-gray-200 px-2.5 py-1 text-[11px] font-semibold text-gray-600 active:scale-95 dark:border-gray-700 dark:text-gray-300">
          {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy ID"}
        </button>
      )}
    </div>
  )

  if (loading && !order) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
        {header}
        <Skeleton />
      </div>
    )
  }

  if (failed || !order || !d) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
        {header}
        <div className="flex flex-col items-center px-8 pt-24 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <XCircle className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-base font-bold text-gray-900 dark:text-gray-100">We could not load this order</p>
          <p className="mt-1 text-sm text-gray-500">Check your connection and try again.</p>
          <div className="mt-6 flex gap-3">
            <button type="button" onClick={load} className="rounded-xl bg-[var(--primary)] px-5 py-2.5 text-sm font-bold text-white active:scale-95">Try again</button>
            <button type="button" onClick={() => navigate("/user/orders")} className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-bold text-gray-700 active:scale-95 dark:border-gray-700 dark:text-gray-300">My orders</button>
          </div>
        </div>
      </div>
    )
  }

  const tone = TONES[d.hero.tone]
  const HeroIcon = d.hero.icon
  const p = d.pricing
  const reachedIndex = (() => {
    let idx = -1
    TIMELINE.forEach((t, i) => { if (d.stampOf(t.match)) idx = Math.max(idx, i) })
    return idx
  })()
  const timeline = d.cancelled
    ? TIMELINE.filter((t, i) => i <= reachedIndex && d.stampOf(t.match)).concat([{ key: "cancelled", label: "Cancelled", icon: XCircle, cancelled: true }])
    : TIMELINE
  const paidOnline = d.method === "razorpay" || d.method === "razorpay_qr" || d.method === "wallet"
  const refundLine = d.cancelled && paidOnline
    ? d.payStatus === "refunded"
      ? { done: true, text: `${money(p.total)} has been refunded to your original payment method.` }
      : { done: false, text: "Your refund will reach your original payment method in 24 to 48 hours." }
    : null
  const PayIcon = d.method === "wallet" ? Wallet : d.method === "cash" || d.method === "cod" ? Banknote : CreditCard
  const fee = (label, value, extra) => (value ? <Row key={label} label={label} value={money(value)} {...extra} /> : null)

  return (
    <div className="min-h-screen bg-gray-50 pb-28 font-sans dark:bg-[#0a0a0a]">
      {header}

      <div className="space-y-3 p-4">
        {/* status */}
        <Reveal i={0}>
          <div className={card}>
            <div className="flex items-start gap-3">
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white ${tone.ring}`}>
                <HeroIcon className="h-6 w-6" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-extrabold text-gray-900 dark:text-gray-100">{d.hero.title}</h2>
                {d.hero.sub && <p className="text-xs text-gray-500 dark:text-gray-400">{d.hero.sub}</p>}
                <p className="mt-1 text-[11px] font-medium text-gray-400">Placed on {fmtDateTime(d.placedAt)}</p>
              </div>
            </div>

            {d.cancelled && (
              <div className="mt-3 rounded-xl border border-red-100 bg-red-50 p-3 dark:border-red-900/30 dark:bg-red-900/10">
                <p className="text-[11px] font-bold uppercase tracking-wide text-red-700 dark:text-red-400">Reason</p>
                <p className="mt-0.5 text-sm font-semibold text-red-700 dark:text-red-300">{d.cancel || "The store could not take this order."}</p>
                {d.cancelMessage && <p className="mt-1.5 text-xs leading-relaxed text-gray-700 dark:text-gray-300">{d.cancelMessage}</p>}
              </div>
            )}
            {refundLine && (
              <div className={`mt-2 flex items-start gap-2 rounded-xl p-3 text-xs font-medium ${refundLine.done ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-900/15 dark:text-emerald-300" : "bg-amber-50 text-amber-800 dark:bg-amber-900/15 dark:text-amber-300"}`}>
                {refundLine.done ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <Clock className="mt-0.5 h-4 w-4 shrink-0" />}
                <span>{refundLine.text}</span>
              </div>
            )}
            {d.active && (
              <button type="button" onClick={() => navigate(`/user/orders/${order._id || orderId}`)} className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-[var(--primary)] py-2.5 text-sm font-bold text-white shadow-sm active:scale-[0.98]">
                Track live order <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </Reveal>

        {/* store + items */}
        <Reveal i={1}>
          <div className={card}>
            <div className="flex items-center gap-3">
              {d.image ? (
                <img src={d.image} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" onError={(e) => { e.currentTarget.style.display = "none" }} />
              ) : (
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-[var(--primary)] dark:bg-red-900/20"><Store className="h-6 w-6" /></span>
              )}
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-extrabold text-gray-900 dark:text-gray-100">{d.storeName}</h3>
                <p className="line-clamp-2 text-xs text-gray-500 dark:text-gray-400">{d.storeAddress || "Store address not available"}</p>
              </div>
              <button
                type="button"
                onClick={openCall}
                aria-label="Call the store manager"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--primary)]/25 bg-[var(--primary)]/5 text-[var(--primary)] transition active:scale-90"
              >
                <Phone className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="my-3 border-t border-dashed border-gray-200 dark:border-gray-800" />

            <div className="space-y-3">
              {d.items.map((item, idx) => (
                <div key={`${item.itemId}-${idx}`} className="flex items-start gap-3">
                  {item.image ? (
                    <img src={item.image} alt="" className="h-14 w-14 shrink-0 rounded-xl border border-gray-100 object-cover dark:border-gray-800" onError={(e) => { e.currentTarget.style.display = "none" }} />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-1.5">
                      <span className={`mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center border p-[1.5px] ${item.isVeg === false ? "border-red-600" : "border-green-600"}`}>
                        <span className={`h-full w-full rounded-full ${item.isVeg === false ? "bg-red-600" : "bg-green-600"}`} />
                      </span>
                      <p className="text-sm font-semibold leading-snug text-gray-800 dark:text-gray-100">{item.name}</p>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      {[item.size && !String(item.name).toLowerCase().includes(`(${String(item.size).toLowerCase()})`) ? item.size : "", item.crust, item.variantName].filter(Boolean).join(" · ")}
                      {[item.size && !String(item.name).toLowerCase().includes(`(${String(item.size).toLowerCase()})`), item.crust, item.variantName].some(Boolean) && " · "}Qty {item.quantity || 1}
                    </p>
                    {Array.isArray(item.selectedAddons) && item.selectedAddons.length > 0 && (
                      <p className="mt-0.5 line-clamp-2 text-[11px] text-gray-400">+ {item.selectedAddons.map((a) => a.name || a).join(", ")}</p>
                    )}
                  </div>
                  <span className="shrink-0 text-sm font-bold text-gray-900 dark:text-gray-100">{money(Number(item.price || 0) * (item.quantity || 1))}</span>
                </div>
              ))}
            </div>

            {(order.sendCutlery !== undefined || order.note) && (
              <div className="mt-3 flex flex-wrap gap-2 border-t border-dashed border-gray-200 pt-3 dark:border-gray-800">
                <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${order.sendCutlery === false ? "bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"}`}>
                  {order.sendCutlery === false ? "No cutlery" : "Cutlery included"}
                </span>
                {order.note && <span className="rounded-full bg-sky-50 px-3 py-1 text-[11px] font-semibold text-sky-700 dark:bg-sky-900/20 dark:text-sky-400">Note: {order.note}</span>}
              </div>
            )}
          </div>
        </Reveal>

        {/* bill */}
        <Reveal i={2}>
          <div className={`${card} !p-0 overflow-hidden`}>
            <div className="flex items-center justify-between px-4 pt-4">
              <h3 className={sectionTitle}>Bill summary</h3>
              <button type="button" onClick={handleInvoice} aria-label="Download invoice" className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[var(--primary)] active:scale-90">
                <Download className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-2 px-4 py-3 text-sm">
              <Row label="Item total" value={money(p.subtotal)} />
              {p.discount > 0 && <Row label="Coupon discount" value={`-${money(p.discount)}`} accent="green" />}
              <Row label="Taxes" value={money(p.tax)} />
              <Row label="Delivery fee" value={p.deliveryFee ? money(p.deliveryFee) : "FREE"} accent={p.deliveryFee ? undefined : "green"} />
              {fee("Packaging fee", p.packagingFee)}
              {fee("Handling fee", p.handlingFee)}
              {fee("Platform fee", p.platformFee)}
              {p.cancellationFeeCharged > 0 && <Row label="Cancellation fee" value={money(p.cancellationFeeCharged)} />}
              <div className="flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-800">
                <span className="text-sm font-extrabold text-gray-900 dark:text-gray-100">{d.cancelled ? "Order total" : "Total paid"}</span>
                <span className="text-lg font-extrabold text-gray-900 dark:text-gray-100">{rupees(p.total)}</span>
              </div>
            </div>
            {d.savings > 0 && (
              <div className="flex items-center justify-center gap-1.5 bg-emerald-50 py-2.5 text-xs font-bold text-emerald-700 dark:bg-emerald-900/15 dark:text-emerald-400">
                <Sparkles className="h-3.5 w-3.5" /> You saved {money(d.savings)} on this order
              </div>
            )}
          </div>
        </Reveal>

        {/* timeline */}
        <Reveal i={3}>
          <div className={card}>
            <h3 className={`${sectionTitle} mb-3`}>Order timeline</h3>
            <ol className="relative">
              {timeline.map((t, i) => {
                const at = t.cancelled ? order.cancellation?.at || d.stampOf(CANCELLED) : d.stampOf(t.match)
                const done = t.cancelled || Boolean(at) || i <= reachedIndex
                const Icon = t.icon
                const last = i === timeline.length - 1
                return (
                  <li key={t.key} className="relative flex gap-3 pb-4 last:pb-0">
                    {!last && <span className={`absolute left-[13px] top-7 h-[calc(100%-1.25rem)] w-0.5 ${done && !t.cancelled ? "bg-emerald-300 dark:bg-emerald-800" : "bg-gray-200 dark:bg-gray-800"}`} />}
                    <span className={`z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${t.cancelled ? "bg-red-500 text-white" : done ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-400 dark:bg-gray-800"}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <p className={`text-sm font-semibold ${done ? "text-gray-900 dark:text-gray-100" : "text-gray-400"}`}>{t.label}</p>
                      {at && <p className="text-[11px] text-gray-400">{fmtShort(at)}</p>}
                    </div>
                  </li>
                )
              })}
            </ol>
          </div>
        </Reveal>

        {/* delivery + payment */}
        <Reveal i={4}>
          <div className={`${card} space-y-4`}>
            <Info icon={MapPin} title={d.addr.label ? `Delivery address · ${d.addr.label}` : "Delivery address"}>
              <p>{d.addressText || "Address not available"}</p>
              {(order.customerName || d.addr.name) && (
                <p className="mt-0.5 text-gray-400">{order.customerName || d.addr.name}{(order.customerPhone || d.addr.phone) ? ` · ${order.customerPhone || d.addr.phone}` : ""}</p>
              )}
            </Info>
            <Info icon={PayIcon} title="Payment">
              <p>
                {PAYMENT_LABEL[d.method] || "Payment"}
                {d.payStatus && (
                  <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${d.payStatus === "paid" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" : d.payStatus === "refunded" ? "bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-400" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"}`}>
                    {d.payStatus === "cod_pending" ? "Pay on delivery" : d.payStatus.replace(/_/g, " ")}
                  </span>
                )}
              </p>
            </Info>
            {order.scheduledAt && (
              <Info icon={Clock} title="Scheduled for"><p>{fmtDateTime(order.scheduledAt)}</p></Info>
            )}
          </div>
        </Reveal>

        <Reveal i={5}>
          <button type="button" onClick={reportIssue} className="flex w-full items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm active:scale-[0.99] dark:border-gray-800 dark:bg-[#121212]">
            <span className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-900/20"><MessageSquareWarning className="h-4.5 w-4.5" /></span>
              <span>
                <span className="block text-sm font-bold text-gray-900 dark:text-gray-100">Something wrong with this order?</span>
                <span className="block text-xs text-gray-500">Report an issue and we will look into it</span>
              </span>
            </span>
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </button>
        </Reveal>
      </div>

      {/* sticky actions */}
      <div className="fixed bottom-0 left-0 right-0 z-20 flex gap-3 border-t border-gray-100 bg-white/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur dark:border-gray-800 dark:bg-[#121212]/95">
        <button type="button" onClick={handleReorder} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] py-3 text-sm font-bold text-white shadow-md active:scale-[0.98]">
          <RotateCcw className="h-4 w-4" /> Reorder
        </button>
        <button type="button" onClick={handleInvoice} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--primary)] py-3 text-sm font-bold text-[var(--primary)] active:scale-[0.98]">
          <Download className="h-4 w-4" /> Invoice
        </button>
      </div>

      {/* call sheet: the number is the store manager's, so say so before dialling */}
      <AnimatePresence>
        {callOpen && (
          <motion.div className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setCallOpen(false)}>
            <motion.div
              className="w-full max-w-md rounded-t-3xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] dark:bg-[#161616]"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[var(--primary)]"><PhoneCall className="h-6 w-6" /></span>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{d.contact.isManager ? "Store manager" : "Store"}</p>
                  <p className="truncate text-base font-extrabold text-gray-900 dark:text-gray-100">{d.contact.name || d.storeName}</p>
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">+91 {String(d.contact.phone).replace(/^\+?91/, "")}</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-gray-500">Call about order #{d.displayId} from {d.storeName}.</p>
              <div className="mt-5 flex gap-3">
                <button type="button" onClick={() => setCallOpen(false)} className="flex-1 rounded-xl border border-gray-300 py-3 text-sm font-bold text-gray-700 active:scale-95 dark:border-gray-700 dark:text-gray-300">Cancel</button>
                <a href={`tel:${String(d.contact.phone).replace(/[^\d+]/g, "")}`} onClick={() => setCallOpen(false)} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] py-3 text-sm font-bold text-white active:scale-95">
                  <Phone className="h-4 w-4" /> Call now
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Row({ label, value, accent }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className={`font-semibold ${accent === "green" ? "text-emerald-600 dark:text-emerald-400" : "text-gray-800 dark:text-gray-200"}`}>{value}</span>
    </div>
  )
}

function Info({ icon: Icon, title, children }) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800"><Icon className="h-4 w-4" /></span>
      <div className="min-w-0 text-xs leading-relaxed text-gray-600 dark:text-gray-300">
        <h4 className="mb-0.5 text-sm font-bold text-gray-900 dark:text-gray-100">{title}</h4>
        {children}
      </div>
    </div>
  )
}
