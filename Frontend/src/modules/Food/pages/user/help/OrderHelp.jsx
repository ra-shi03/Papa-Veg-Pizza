import { useEffect, useRef, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { toast } from "sonner"
import {
  ArrowLeft,
  Package,
  AlertCircle,
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  HelpCircle,
  Send,
  CheckCircle,
} from "lucide-react"
import AnimatedPage from "@food/components/user/AnimatedPage"
import ScrollReveal from "@food/components/user/ScrollReveal"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@food/components/ui/card"
import { Button } from "@food/components/ui/button"
import { Badge } from "@food/components/ui/badge"
import { orderAPI } from "@food/api"
import { supportAPI } from "@/services/api/supportApiModule"
import { loadBusinessSettings, whatsappLink } from "@food/utils/businessSettings"

// The order as this screen reads it, from the customer's own order on the server
const STATUS_FOR_SCREEN = { created: "confirmed", confirmed: "confirmed", preparing: "preparing", ready_for_pickup: "preparing", reached_pickup: "preparing", picked_up: "outForDelivery", reached_drop: "outForDelivery", delivered: "delivered" }
const STATUS_LABEL = { confirmed: "Confirmed", preparing: "Preparing", outForDelivery: "Out for Delivery", delivered: "Delivered", cancelled: "Cancelled" }
const toHelpOrder = (o) => {
  if (!o) return null
  const raw = String(o.orderStatus || o.status || "")
  const a = o.deliveryAddress || o.address || null
  return {
    mongoId: String(o._id || o.id || ""),
    id: o.order_id || o.orderId || o._id || o.id,
    status: STATUS_FOR_SCREEN[raw] || (raw.startsWith("cancelled") ? "cancelled" : raw),
    createdAt: o.createdAt,
    total: Number(o.pricing?.total ?? o.total ?? 0),
    items: o.items || [],
    address: a ? { street: a.street || "", additionalDetails: a.additionalDetails || "", city: a.city || "", state: a.state || "", zipCode: a.zipCode || "" } : null,
  }
}

// What a pizza app asks when something is wrong with an order
const ISSUE_TYPES = ["Missing item", "Wrong item", "Food quality or cold", "Damaged packaging", "Late delivery", "Other"]

const formatDate = (dateString) => {
  if (!dateString) return "N/A"
  return new Date(dateString).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
}
const formatTime = (value) => (value ? new Date(value).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "")

export default function OrderHelp() {
  const { orderId } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  // Support contact from the business settings (super admin); a card is hidden when its value is empty
  const [support, setSupport] = useState({ phone: "", email: "", whatsapp: "", hours: "" })
  const [ticket, setTicket] = useState(null) // the report for this order that is open (or the latest one)
  const [ticketsLoaded, setTicketsLoaded] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ issueType: ISSUE_TYPES[0], description: "" })
  const [submitting, setSubmitting] = useState(false)
  const [text, setText] = useState("")
  const [sending, setSending] = useState(false)
  const endRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    orderAPI.getOrderDetails(orderId)
      .then((res) => { if (!cancelled) setOrder(toHelpOrder(res?.data?.data?.order || res?.data?.order || null)) })
      .catch(() => { if (!cancelled) setOrder(null) })
      .finally(() => { if (!cancelled) setLoading(false) })
    loadBusinessSettings()
      .then((s) => {
        if (cancelled) return
        setSupport({
          phone: String(s?.supportPhone || "").trim(),
          email: String(s?.supportEmail || "").trim(),
          whatsapp: String(s?.whatsappNumber || "").trim(),
          hours: String(s?.supportHours || "").trim(),
        })
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [orderId])

  // The report(s) for this order: the open one, else the latest
  useEffect(() => {
    if (!order?.mongoId) return undefined
    let cancelled = false
    supportAPI.getMyTickets({ orderId: order.mongoId, limit: 5 })
      .then((res) => {
        if (cancelled) return
        const list = res?.data?.data?.tickets || []
        setTicket(list.find((t) => t.status !== "resolved") || list[0] || null)
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setTicketsLoaded(true) })
    return () => { cancelled = true }
  }, [order?.mongoId])

  // Live: the store's answer arrives over the socket (the customer app's own connection)
  useEffect(() => {
    const onMessage = (e) => {
      const d = e?.detail
      if (!d || !order?.mongoId || String(d.orderId) !== order.mongoId) return
      setTicket((t) => {
        if (!t || String(t._id) !== String(d.ticketId)) return t
        const exists = (t.responses || []).some((r) => r.byRole === d.message.byRole && r.message === d.message.message && String(r.at) === String(d.message.at))
        return exists ? { ...t, status: d.status || t.status } : { ...t, status: d.status || t.status, responses: [...(t.responses || []), d.message] }
      })
    }
    window.addEventListener("supportMessage", onMessage)
    return () => window.removeEventListener("supportMessage", onMessage)
  }, [order?.mongoId])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }) }, [ticket?.responses?.length])

  const refreshTicket = async () => {
    const res = await supportAPI.getMyTickets({ orderId: order.mongoId, limit: 5 })
    const list = res?.data?.data?.tickets || []
    setTicket(list.find((t) => t.status !== "resolved") || list[0] || null)
  }

  const submitReport = async (e) => {
    e.preventDefault()
    const description = form.description.trim()
    if (description.length < 5) {
      toast.error("Please tell us a little more about the problem.")
      return
    }
    setSubmitting(true)
    try {
      await supportAPI.createTicket({ type: "order", orderId: order.mongoId, issueType: form.issueType, description })
      setForm({ issueType: ISSUE_TYPES[0], description: "" })
      setShowForm(false)
      await refreshTicket()
      toast.success("Reported. The store will reply here.")
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not send your report. Please try again.")
      // already have an open report: open it
      if (err?.response?.status === 409) await refreshTicket().catch(() => {})
    } finally {
      setSubmitting(false)
    }
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    const message = text.trim()
    if (!message || !ticket) return
    setSending(true)
    try {
      const res = await supportAPI.sendTicketMessage(ticket._id, message)
      const sent = res?.data?.data?.message
      setText("")
      if (sent) {
        setTicket((t) => ((t.responses || []).some((r) => r.byRole === sent.byRole && r.message === sent.message && String(r.at) === String(sent.at)) ? t : { ...t, responses: [...(t.responses || []), sent] }))
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not send your message.")
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return <AnimatedPage className="min-h-screen bg-gradient-to-b from-yellow-50/30 via-white to-orange-50/20 p-4"><div className="max-w-4xl mx-auto" /></AnimatedPage>
  }

  if (!order) {
    return (
      <AnimatedPage className="min-h-screen bg-gradient-to-b from-yellow-50/30 via-white to-orange-50/20 p-4">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-2xl font-bold mb-2">Order Not Found</h2>
              <p className="text-muted-foreground mb-6">We couldn't find an order with ID: {orderId}</p>
              <div className="flex gap-4 justify-center">
                <Link to="/user/orders"><Button variant="outline">View All Orders</Button></Link>
                <Link to="/user/help"><Button>Go to Help Center</Button></Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </AnimatedPage>
    )
  }

  const resolved = ticket?.status === "resolved"
  const showReportForm = ticketsLoaded && (!ticket || resolved) && (showForm || !ticket)
  const conversation = ticket
    ? [{ message: ticket.description, byRole: "Customer", at: ticket.createdAt }, ...(ticket.responses || [])].filter((m) => m.message)
    : []
  const wa = whatsappLink(support.whatsapp, `Hi, I need help with order ${order.id}`)
  const hasContact = support.phone || support.email || wa

  return (
    <AnimatedPage className="min-h-screen bg-gradient-to-b from-yellow-50/30 via-white to-orange-50/20 dark:from-[#0a0a0a] dark:via-[#0a0a0a] dark:to-[#0a0a0a] p-4 md:p-6 lg:p-8">
      <div className="max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto space-y-4 md:space-y-5 lg:space-y-6">
        {/* Header */}
        <ScrollReveal>
          <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
            <Link to="/user/help">
              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 md:h-10 md:w-10">
                <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">Order Help</h1>
              <p className="text-sm md:text-base text-muted-foreground">Order {order.id}</p>
            </div>
          </div>
        </ScrollReveal>

        {/* Order Summary */}
        <ScrollReveal delay={0.1}>
          <Card className="shadow-lg">
            <CardHeader className="p-4 md:p-5 lg:p-6">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl lg:text-2xl">
                  <Package className="h-4 w-4 md:h-5 md:w-5 text-[var(--primary)]" />
                  Order Summary
                </CardTitle>
                <Badge className="bg-[var(--primary)] text-white text-xs md:text-sm">{STATUS_LABEL[order.status] || order.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-5 p-4 md:p-5 lg:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Order ID</p>
                  <p className="font-semibold">{order.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Placed On</p>
                  <p className="font-semibold">{formatDate(order.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
                  <p className="font-semibold text-[var(--primary)] text-xl">₹{order.total.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Items</p>
                  <p className="font-semibold">{order.items?.length || 0} items</p>
                </div>
              </div>
              {order.address && (
                <div className="pt-4 border-t">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Delivery Address</p>
                      <p className="text-sm">
                        {order.address.street}
                        {order.address.additionalDetails && `, ${order.address.additionalDetails}`}
                        <br />
                        {order.address.city}, {order.address.state} {order.address.zipCode}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </ScrollReveal>

        {/* Chat with the store about this order (live over the socket) */}
        {ticket && (
          <ScrollReveal delay={0.2}>
            <Card id="order-chat" className="shadow-lg">
              <CardHeader className="p-4 md:p-5 lg:p-6">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-[var(--primary)]" />
                    Chat with the store
                  </CardTitle>
                  <Badge className={resolved ? "bg-green-600 text-white" : "bg-[var(--primary)] text-white"}>
                    {resolved ? "Resolved" : ticket.status === "in-progress" ? "In progress" : "Open"}
                  </Badge>
                </div>
                <CardDescription>{ticket.issueType}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 p-4 md:p-5 lg:p-6 pt-0">
                <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                  {conversation.map((m, i) => {
                    const mine = m.byRole === "Customer"
                    return (
                      <div key={`${m.at}-${i}`} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${mine ? "bg-[var(--primary)] text-white" : "bg-muted text-foreground"}`}>
                          <p className="whitespace-pre-wrap break-words">{m.message}</p>
                          <p className={`mt-1 text-[10px] ${mine ? "text-white/70" : "text-muted-foreground"}`}>{mine ? "You" : "Store"} · {formatTime(m.at)}</p>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={endRef} />
                </div>

                {resolved && ticket.resolution && (
                  <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 p-3 text-sm space-y-1">
                    <p className="font-semibold flex items-center gap-1.5 text-green-700 dark:text-green-400"><CheckCircle className="h-4 w-4" /> Resolved</p>
                    {ticket.resolution.actionTaken && <p>{ticket.resolution.actionTaken}</p>}
                    {ticket.resolution.refundAmount > 0 && <p>Refund promised: ₹{ticket.resolution.refundAmount}. It is paid back by the team and shown in your wallet or source account.</p>}
                    {ticket.resolution.couponIssued && <p>Coupon for you: <span className="font-semibold">{ticket.resolution.couponIssued}</span></p>}
                    {ticket.resolution.replacementOrderId && <p>Replacement order: {ticket.resolution.replacementOrderId}</p>}
                  </div>
                )}

                {!resolved ? (
                  <form onSubmit={sendMessage} className="flex items-center gap-2">
                    <input
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      maxLength={1000}
                      placeholder="Write a message"
                      className="flex-1 h-11 rounded-full border border-input bg-background px-4 text-sm outline-none focus:border-[var(--primary)]"
                    />
                    <Button type="submit" disabled={sending || !text.trim()} className="h-11 w-11 rounded-full p-0 bg-[var(--primary)] hover:bg-[var(--primary-hover)]">
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                ) : (
                  <Button variant="outline" className="w-full" onClick={() => setShowForm(true)}>Report another problem</Button>
                )}
              </CardContent>
            </Card>
          </ScrollReveal>
        )}

        {/* Report a problem */}
        {showReportForm && (
          <ScrollReveal delay={0.2}>
            <Card id="report-problem" className="shadow-lg">
              <CardHeader className="p-4 md:p-5 lg:p-6">
                <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-[var(--primary)]" />
                  Report a problem
                </CardTitle>
                <CardDescription>
                  Tell the store what went wrong. You can report a delivered order for 24 hours after delivery. The store replies here, and any refund or coupon is shown on this screen.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 md:p-5 lg:p-6 pt-0">
                <form onSubmit={submitReport} className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {ISSUE_TYPES.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, issueType: t }))}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${form.issueType === t ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-input bg-background text-foreground"}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    maxLength={1000}
                    rows={4}
                    placeholder="What happened? Which item?"
                    className="w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:border-[var(--primary)]"
                  />
                  <div className="flex gap-3">
                    {ticket && <Button type="button" variant="outline" className="flex-1" onClick={() => setShowForm(false)}>Cancel</Button>}
                    <Button type="submit" disabled={submitting} className="flex-1 bg-[var(--primary)] hover:bg-[var(--primary-hover)]">
                      {submitting ? "Sending..." : "Report a problem"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </ScrollReveal>
        )}

        {/* Contact support (business settings; each line is hidden when empty) */}
        {hasContact && (
          <ScrollReveal delay={0.3}>
            <Card id="contact-support" className="shadow-lg">
              <CardHeader className="p-4 md:p-5 lg:p-6">
                <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                  <Phone className="h-5 w-5 text-[var(--primary)]" />
                  Talk to support
                </CardTitle>
                <CardDescription>
                  Mention order {order.id}.{support.hours ? ` ${support.hours}` : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 md:p-5 lg:p-6 pt-0">
                {support.phone && (
                  <a href={`tel:${support.phone.replace(/\s+/g, "")}`} className="flex items-center gap-3 rounded-lg bg-muted/50 p-3 hover:bg-muted">
                    <Phone className="h-5 w-5 text-[var(--primary)]" />
                    <span className="text-sm font-medium">{support.phone}</span>
                  </a>
                )}
                {support.email && (
                  <a href={`mailto:${support.email}?subject=${encodeURIComponent(`Help with Order ${order.id}`)}`} className="flex items-center gap-3 rounded-lg bg-muted/50 p-3 hover:bg-muted">
                    <Mail className="h-5 w-5 text-[var(--primary)]" />
                    <span className="text-sm font-medium break-all">{support.email}</span>
                  </a>
                )}
                {wa && (
                  <a href={wa} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-lg bg-muted/50 p-3 hover:bg-muted">
                    <MessageCircle className="h-5 w-5 text-[var(--primary)]" />
                    <span className="text-sm font-medium">WhatsApp</span>
                  </a>
                )}
              </CardContent>
            </Card>
          </ScrollReveal>
        )}

        {/* Back to Orders */}
        <ScrollReveal delay={0.4}>
          <div className="flex gap-4">
            <Link to="/user/orders" className="flex-1">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to All Orders
              </Button>
            </Link>
            <Link to="/user/help" className="flex-1">
              <Button variant="outline" className="w-full">
                <HelpCircle className="h-4 w-4 mr-2" />
                Help Center
              </Button>
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </AnimatedPage>
  )
}
