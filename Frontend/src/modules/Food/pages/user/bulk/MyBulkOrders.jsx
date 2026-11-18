import React, { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Banknote, Check, ChevronDown, CreditCard, Loader2, MapPin, Phone, ShoppingBag, Store, Truck, X } from "lucide-react"
import { toast } from "sonner"
import { userClient } from "@/services/api/axios"
import { orderAPI } from "@food/api"
import { initRazorpayPayment } from "@food/utils/razorpay"

const isSignedIn = () => {
  try {
    return localStorage.getItem("user_authenticated") === "true" || !!localStorage.getItem("user_accessToken")
  } catch (_) {
    return false
  }
}

const STATUS = {
  new: { label: "Waiting for the store", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  confirmed: { label: "Confirmed", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  preparing: { label: "Being prepared", cls: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  ready: { label: "Ready", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  out_for_delivery: { label: "Out for delivery", cls: "bg-sky-50 text-sky-700 border-sky-200" },
  completed: { label: "Completed", cls: "bg-emerald-600 text-white border-emerald-600" },
  rejected: { label: "Declined", cls: "bg-red-50 text-red-700 border-red-200" },
  cancelled: { label: "Cancelled", cls: "bg-zinc-100 text-zinc-600 border-zinc-200" },
}
const stepsFor = (o) => (o.fulfilment === "delivery" ? ["new", "confirmed", "preparing", "ready", "out_for_delivery", "completed"] : ["new", "confirmed", "preparing", "ready", "completed"])
const STEP_LABEL = { new: "Sent", out_for_delivery: "On the way", completed: "Delivered" }

const when = (d) => (d ? new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "")

/** The customer's own bulk orders: status, store, and a step-by-step timeline. */
export default function MyBulkOrders() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState(null)
  const [error, setError] = useState(false)
  const [open, setOpen] = useState("")
  const [busy, setBusy] = useState("")

  // Pay online: the server makes the Razorpay order, the customer pays, then the payment is verified like any order
  const payOnline = async (o) => {
    setBusy(o.id)
    try {
      const res = await userClient.post(`/food/user/bulk-orders/${o.id}/pay`, {})
      const { razorpay, orderMongoId } = res?.data?.data || {}
      if (!razorpay?.orderId) throw new Error("Payment could not be started")
      await new Promise((resolve) => {
        let settled = false
        const done = () => { if (!settled) { settled = true; resolve() } }
        initRazorpayPayment({
          key: razorpay.key,
          amount: razorpay.amount,
          currency: razorpay.currency,
          order_id: razorpay.orderId,
          description: `Bulk order ${o.reference}`,
          prefill: { name: o.name, email: o.email, contact: o.phone },
          notes: { orderId: String(orderMongoId) },
          handler: async (r) => {
            try {
              await orderAPI.verifyPayment({ orderId: String(orderMongoId), razorpayOrderId: r.razorpay_order_id, razorpayPaymentId: r.razorpay_payment_id, razorpaySignature: r.razorpay_signature })
              toast.success("Payment received")
            } catch (_) {
              toast.error("Payment received but not confirmed yet. Please contact support if it does not update.")
            }
            done()
          },
          onClose: done,
          onError: (e) => { toast.error(e?.description || "Payment failed. You can try again."); done() },
        }).catch(() => { toast.error("Could not open the payment window. Please try again."); done() })
      })
      await load()
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.response?.data?.error || err?.message || "Could not start the payment")
    } finally {
      setBusy("")
    }
  }

  const load = useCallback(async () => {
    if (!isSignedIn()) return
    try {
      const res = await userClient.get("/food/user/bulk-orders")
      setOrders(res?.data?.data?.orders || [])
      setError(false)
    } catch (_) {
      setError(true)
    }
  }, [])

  useEffect(() => {
    load()
    const t = setInterval(load, 30000) // the store may confirm while the page is open
    return () => clearInterval(t)
  }, [load])

  const cancel = async (id) => {
    setBusy(id)
    try {
      await userClient.post(`/food/user/bulk-orders/${id}/cancel`, {})
      toast.success("Request cancelled")
      await load()
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.response?.data?.error || "Could not cancel this request")
    } finally {
      setBusy("")
    }
  }

  if (!isSignedIn()) {
    return (
      <div className="py-12 text-center space-y-3">
        <p className="text-sm text-zinc-600 dark:text-zinc-300 m-0">Sign in to see your bulk orders and follow their status.</p>
        <button type="button" onClick={() => navigate("/user/auth/login")} className="h-11 px-6 rounded-xl bg-[#E53935] text-white text-sm font-bold border-0 cursor-pointer">Sign in</button>
      </div>
    )
  }
  if (error && !orders) return <p className="py-10 text-center text-sm text-[#E53935]">Could not load your bulk orders. Please try again.</p>
  if (!orders) return <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#E53935]" /></div>
  if (orders.length === 0) return <p className="py-12 text-center text-sm text-zinc-500">You have not placed a bulk order yet.</p>

  return (
    <div className="space-y-3">
      {orders.map((o) => {
        const st = STATUS[o.status] || { label: o.status, cls: "bg-zinc-100 text-zinc-600 border-zinc-200" }
        const expanded = open === o.id
        const reached = new Set((o.history || []).map((h) => h.status))
        const closed = o.status === "rejected" || o.status === "cancelled"
        return (
          <div key={o.id} className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
            <button type="button" onClick={() => setOpen(expanded ? "" : o.id)} className="w-full text-left p-4 bg-transparent border-0 cursor-pointer">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="m-0 text-sm font-extrabold text-zinc-900 dark:text-white tracking-wide">{o.reference}</p>
                  <p className="m-0 mt-0.5 text-xs text-zinc-500 truncate flex items-center gap-1"><Store className="w-3 h-3 shrink-0" />{o.storeName || "Store"}</p>
                </div>
                <span className={`shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full border ${st.cls}`}>{st.label}</span>
              </div>
              <div className="mt-2 flex items-center gap-3 text-[11px] text-zinc-500">
                <span className="flex items-center gap-1">{o.fulfilment === "delivery" ? <Truck className="w-3 h-3" /> : <ShoppingBag className="w-3 h-3" />}{o.fulfilment === "delivery" ? "Delivery" : "Takeaway"}</span>
                {o.eventDate && <span>{o.eventDate}{o.eventTime ? ` · ${o.eventTime}` : ""}</span>}
                {o.quotedAmount != null && <span className="font-bold text-zinc-800 dark:text-zinc-200">₹{Number(o.quotedAmount).toLocaleString("en-IN")}</span>}
                <ChevronDown className={`ml-auto w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
              </div>
            </button>

            {expanded && (
              <div className="px-4 pb-4 border-t border-zinc-100 dark:border-zinc-800 pt-3 space-y-3">
                {!closed && (
                  <ol className="m-0 p-0 list-none flex items-center justify-between">
                    {stepsFor(o).map((s, i) => {
                      const done = reached.has(s)
                      return (
                        <li key={s} className="flex-1 flex flex-col items-center relative">
                          {i > 0 && <span className={`absolute top-3 right-1/2 w-full h-0.5 ${done ? "bg-emerald-500" : "bg-zinc-200 dark:bg-zinc-700"}`} />}
                          <span className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center text-white ${done ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700"}`}>{done && <Check className="w-3.5 h-3.5" />}</span>
                          <span className="mt-1 text-[9px] font-bold uppercase text-zinc-500 text-center">{STEP_LABEL[s] || s}</span>
                        </li>
                      )
                    })}
                  </ol>
                )}
                {(o.items || []).length > 0 && (
                  <div className="rounded-xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-800 p-3 space-y-1">
                    {o.items.map((it, i) => (
                      <div key={i} className="flex justify-between gap-3 text-xs text-zinc-700 dark:text-zinc-300">
                        <span className="min-w-0">{it.quantity} × {it.name}{it.size ? ` (${it.size})` : ""}</span>
                        <span className="shrink-0 font-semibold">₹{Number(it.lineTotal).toLocaleString("en-IN")}</span>
                      </div>
                    ))}
                    {o.estimatedTotal != null && <div className="flex justify-between pt-1 border-t border-zinc-200 dark:border-zinc-700 text-xs font-extrabold text-zinc-900 dark:text-white"><span>Estimated total</span><span>₹{Number(o.estimatedTotal).toLocaleString("en-IN")}</span></div>}
                  </div>
                )}
                {o.quotedAmount != null && (
                  <div className="flex items-center justify-between rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2.5">
                    <div className="text-xs">
                      <p className="m-0 font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">{o.paymentMethod === "online" ? <CreditCard className="w-3.5 h-3.5" /> : <Banknote className="w-3.5 h-3.5" />}₹{Number(o.quotedAmount).toLocaleString("en-IN")} · {o.paymentMethod === "online" ? "Online" : o.fulfilment === "delivery" ? "Cash / UPI on delivery" : "Cash / UPI at the store"}</p>
                      <p className={`m-0 mt-0.5 font-semibold ${o.paymentStatus === "paid" ? "text-emerald-600" : "text-amber-600"}`}>{o.paymentStatus === "paid" ? "Paid" : "Not paid yet"}</p>
                    </div>
                    {o.canPayOnline && (
                      <button type="button" disabled={busy === o.id} onClick={() => payOnline(o)} className="h-9 px-4 rounded-lg bg-[#E53935] text-white text-xs font-bold border-0 cursor-pointer disabled:opacity-60">{busy === o.id ? "Please wait..." : "Pay now"}</button>
                    )}
                  </div>
                )}
                {o.rider && (
                  <p className="m-0 text-xs text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5"><Truck className="w-3.5 h-3.5 shrink-0" /> Delivery partner: <b>{o.rider.name}</b>{o.rider.phone && <a href={`tel:${o.rider.phone}`} className="ml-1 text-[#E53935] font-bold inline-flex items-center gap-1"><Phone className="w-3 h-3" />Call</a>}</p>
                )}
                {o.storeNote && <p className="m-0 text-xs text-zinc-600 dark:text-zinc-300"><b>Note from the store:</b> {o.storeNote}</p>}
                {o.reasonText && closed && <p className="m-0 text-xs text-zinc-600 dark:text-zinc-300"><b>Reason:</b> {o.reasonText}</p>}
                {o.fulfilment === "delivery" ? (
                  <p className="m-0 text-xs text-zinc-500 flex gap-1"><MapPin className="w-3 h-3 mt-0.5 shrink-0" />{[o.address?.street, o.address?.landmark, o.address?.city, o.address?.pincode].filter(Boolean).join(", ")}</p>
                ) : (
                  <p className="m-0 text-xs text-zinc-500 flex gap-1"><MapPin className="w-3 h-3 mt-0.5 shrink-0" />Collect from {o.storeName}{o.storeAddress ? `, ${o.storeAddress}` : ""}</p>
                )}
                <div className="space-y-1">
                  {(o.history || []).map((h, i) => (
                    <p key={i} className="m-0 text-[11px] text-zinc-500"><span className="font-bold text-zinc-700 dark:text-zinc-300">{(STATUS[h.status]?.label || h.status)}</span> · {when(h.at)}{h.note ? ` · ${h.note}` : ""}</p>
                  ))}
                </div>
                {o.status === "new" && (
                  <button type="button" disabled={busy === o.id} onClick={() => cancel(o.id)} className="h-10 px-4 rounded-xl border border-red-300 text-red-600 text-xs font-bold bg-transparent cursor-pointer flex items-center gap-1.5 disabled:opacity-60">
                    <X className="w-3.5 h-3.5" /> {busy === o.id ? "Cancelling..." : "Cancel request"}
                  </button>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
