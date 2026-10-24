import React, { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { 
  ArrowLeft, 
  Search, 
  Loader2, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Phone, 
  Store, 
  Bike, 
  ChefHat, 
  AlertCircle, 
  Receipt, 
  ChevronRight, 
  RefreshCw,
  ShoppingBag,
  XCircle,
  HelpCircle
} from "lucide-react"
import AnimatedPage from "@food/components/user/AnimatedPage"
import apiClient from "@/services/api/axios"
import useAppBackNavigation from "@food/hooks/useAppBackNavigation"
import { toast } from "sonner"

export default function TrackOrder() {
  const navigate = useNavigate()
  const goBack = useAppBackNavigation()
  const location = useLocation()

  // Form input states
  const [mobileNumber, setMobileNumber] = useState("")
  const [orderId, setOrderId] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Result state
  const [orderData, setOrderData] = useState(null)

  // Auto-fill mobile number if user is logged in
  useEffect(() => {
    try {
      const stored = localStorage.getItem("currentUser") || localStorage.getItem("user_user")
      if (stored) {
        const u = JSON.parse(stored)
        const phone = u.phone || u.mobile || u.phoneNumber || ""
        const clean = String(phone).replace(/\D/g, "")
        if (clean.length >= 10) {
          setMobileNumber(clean.slice(-10))
        }
      }
    } catch (_) {}

    // Also support pre-filled orderId from location state or query params
    const params = new URLSearchParams(location.search)
    const qOrderId = params.get("orderId") || params.get("order_id") || location.state?.orderId
    const qPhone = params.get("phone") || params.get("mobile") || location.state?.phone
    if (qOrderId) setOrderId(qOrderId)
    if (qPhone) {
      const cleanQ = String(qPhone).replace(/\D/g, "")
      if (cleanQ.length >= 10) setMobileNumber(cleanQ.slice(-10))
    }
  }, [location.search, location.state])

  // Handle Form Submit
  const handleTrackOrder = async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    setError("")

    const cleanPhone = String(mobileNumber).replace(/\D/g, "")
    const cleanId = String(orderId).trim()

    if (!cleanPhone || cleanPhone.length < 10) {
      setError("Please enter a valid 10-digit mobile number")
      return
    }

    if (!cleanId) {
      setError("Please enter your Order ID")
      return
    }

    setLoading(true)
    try {
      const res = await apiClient.post("/food/orders/track", {
        phone: cleanPhone,
        orderId: cleanId
      })

      const data = res?.data?.data || res?.data
      if (data && (data.orderId || data._id || data.status)) {
        setOrderData(data)
        toast.success("Order details loaded!")
      } else {
        setError("No order found matching this Order ID and Mobile Number.")
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Unable to track order. Please verify your details."
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  // Handle Back
  const handleBack = () => {
    if (orderData) {
      // If currently viewing order details, clicking back returns to the search form
      setOrderData(null)
      setError("")
      return
    }
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      let target = "/user"
      if (window.location.pathname.startsWith("/food") && !target.startsWith("/food")) {
        target = `/food${target}`
      }
      navigate(target)
    }
  }

  // Format date helper
  const formatDate = (dateStr) => {
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return ""
      return d.toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
      })
    } catch {
      return ""
    }
  }

  return (
    <AnimatedPage className="min-h-screen bg-[#F8F9FA] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans select-none pb-24">
      {/* Top Header matching Image 2 with project theme */}
      <header className="sticky top-0 z-40 bg-white dark:bg-zinc-900 border-b border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="p-1.5 -ml-1.5 text-zinc-800 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors cursor-pointer border-0 bg-transparent flex items-center justify-center"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
            </button>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-white m-0">
              Track Current Order
            </h1>
          </div>

          {orderData && (
            <button
              type="button"
              onClick={handleTrackOrder}
              disabled={loading}
              title="Refresh status"
              className="p-2 text-zinc-400 hover:text-[#E53935] rounded-full transition-colors cursor-pointer border-0 bg-transparent"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#E53935]" : ""}`} />
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {!orderData ? (
            /* ── Initial Form Card matching Image 2 ── */
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-6 sm:p-8 shadow-sm"
            >
              <form onSubmit={handleTrackOrder} className="space-y-6">
                {/* Mobile No. Input with Underline Style (matching Image 2) */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    Mobile No.*
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={mobileNumber}
                    onChange={(e) => {
                      setError("")
                      setMobileNumber(e.target.value.replace(/\D/g, "").slice(0, 10))
                    }}
                    placeholder="Enter 10-digit mobile number"
                    className="w-full pb-2 pt-1 border-0 border-b-2 border-zinc-200 dark:border-zinc-700 focus:border-[#E53935] dark:focus:border-[#E53935] outline-none text-base font-semibold text-zinc-900 dark:text-white bg-transparent transition-colors placeholder:text-zinc-300 dark:placeholder:text-zinc-600"
                  />
                </div>

                {/* Order ID Input with Underline Style (matching Image 2) */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    Order ID*
                  </label>
                  <input
                    type="text"
                    value={orderId}
                    onChange={(e) => {
                      setError("")
                      setOrderId(e.target.value.trim())
                    }}
                    placeholder="e.g. ORD-1002 or Order Mongo ID"
                    className="w-full pb-2 pt-1 border-0 border-b-2 border-zinc-200 dark:border-zinc-700 focus:border-[#E53935] dark:focus:border-[#E53935] outline-none text-base font-semibold text-zinc-900 dark:text-white bg-transparent transition-colors placeholder:text-zinc-300 dark:placeholder:text-zinc-600 uppercase font-mono tracking-wide"
                  />
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* SUBMIT Button matching project theme color */}
                <div className="flex justify-center pt-4">
                  <button
                    type="submit"
                    disabled={loading || mobileNumber.length < 10 || !orderId.trim()}
                    className="w-full sm:w-44 py-3 bg-[#E53935] hover:bg-[#D32F2F] active:scale-95 disabled:opacity-40 disabled:pointer-events-none text-white font-bold rounded-xl text-sm uppercase tracking-wider transition-all shadow-md shadow-red-500/20 cursor-pointer border-0 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Tracking...</span>
                      </>
                    ) : (
                      "SUBMIT"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          ) : (
            /* ── Order Status Details View ── */
            <motion.div
              key="details"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Order Status Hero Card */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-5 shadow-xs">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-3 mb-4">
                  <div>
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                      Order Reference
                    </span>
                    <h3 className="text-base font-extrabold text-zinc-900 dark:text-white font-mono m-0">
                      #{orderData.orderId}
                    </h3>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                      orderData.isCancelled
                        ? "bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400"
                        : orderData.status === "delivered"
                        ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400"
                        : "bg-red-50 dark:bg-red-950/50 text-[#E53935]"
                    }`}
                  >
                    {orderData.statusLabel || orderData.status}
                  </span>
                </div>

                {/* Status Hero Details */}
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                      orderData.isCancelled
                        ? "bg-rose-100 dark:bg-rose-950/50 text-rose-600"
                        : orderData.status === "delivered"
                        ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600"
                        : "bg-red-50 dark:bg-red-950/50 text-[#E53935]"
                    }`}
                  >
                    {orderData.isCancelled ? (
                      <XCircle className="w-6 h-6 stroke-[2.2]" />
                    ) : orderData.status === "delivered" ? (
                      <CheckCircle2 className="w-6 h-6 stroke-[2.2]" />
                    ) : orderData.status === "picked_up" || orderData.status === "reached_drop" ? (
                      <Bike className="w-6 h-6 stroke-[2.2]" />
                    ) : (
                      <ChefHat className="w-6 h-6 stroke-[2.2]" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-bold text-zinc-900 dark:text-white m-0">
                      {orderData.headline}
                    </h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed m-0">
                      {orderData.description}
                    </p>
                    {orderData.createdAt && (
                      <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-2 flex items-center gap-1 m-0">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Placed on {formatDate(orderData.createdAt)}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress Timeline */}
              {!orderData.isCancelled && orderData.timeline && (
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-5 shadow-xs">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">
                    Live Progress
                  </h4>

                  <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-200 dark:before:bg-zinc-800">
                    {orderData.timeline.map((step, idx) => (
                      <div key={idx} className="relative">
                        {/* Dot indicator */}
                        <div
                          className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            step.completed
                              ? "bg-emerald-600 text-white"
                              : step.current
                              ? "bg-[#E53935] text-white ring-4 ring-red-500/20 animate-pulse"
                              : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400"
                          }`}
                        >
                          {step.completed ? "✓" : step.step}
                        </div>

                        <div>
                          <p
                            className={`text-xs font-bold leading-none ${
                              step.current
                                ? "text-[#E53935]"
                                : step.completed
                                ? "text-zinc-900 dark:text-white"
                                : "text-zinc-400 dark:text-zinc-500"
                            }`}
                          >
                            {step.title}
                          </p>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-snug">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Delivery Partner Info (if assigned) */}
              {orderData.deliveryPartner && (
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-4 shadow-xs flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-950/50 text-[#E53935] flex items-center justify-center shrink-0">
                      <Bike className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        Delivery Partner
                      </span>
                      <p className="text-sm font-bold text-zinc-900 dark:text-white leading-tight m-0">
                        {orderData.deliveryPartner.name}
                      </p>
                    </div>
                  </div>

                  {orderData.deliveryPartner.phone && (
                    <a
                      href={`tel:${orderData.deliveryPartner.phone}`}
                      className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center hover:bg-emerald-100 transition-colors"
                      title="Call Rider"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  )}
                </div>
              )}

              {/* Delivery Address & Store */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Store Card */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-4 shadow-xs space-y-1">
                  <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-xs font-semibold">
                    <Store className="w-4 h-4 text-[#E53935]" />
                    <span>Restaurant Outlet</span>
                  </div>
                  <p className="text-xs font-bold text-zinc-900 dark:text-white m-0">
                    {orderData.store?.name || "Papa Veg Pizza"}
                  </p>
                  {orderData.store?.address && (
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate m-0">
                      {orderData.store.address}
                    </p>
                  )}
                </div>

                {/* Address Card */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-4 shadow-xs space-y-1">
                  <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-xs font-semibold">
                    <MapPin className="w-4 h-4 text-[#E53935]" />
                    <span>Delivery Location</span>
                  </div>
                  <p className="text-xs font-bold text-zinc-900 dark:text-white m-0">
                    {orderData.deliveryAddress?.label || "Home"}
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate m-0">
                    {[orderData.deliveryAddress?.street, orderData.deliveryAddress?.city].filter(Boolean).join(", ")}
                  </p>
                </div>
              </div>

              {/* Items & Bill Summary */}
              {orderData.items && orderData.items.length > 0 && (
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      <ShoppingBag className="w-3.5 h-3.5" />
                      Items ({orderData.items.length})
                    </span>
                    <span className="text-xs font-bold text-zinc-900 dark:text-white">
                      ₹{orderData.pricing?.total || 0}
                    </span>
                  </div>

                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                    {orderData.items.map((item, idx) => (
                      <div key={idx} className="py-2 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-4 h-4 border border-emerald-600 rounded flex items-center justify-center p-0.5 shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                          </span>
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                            {item.quantity}x {item.name}
                          </span>
                          {item.variantName && (
                            <span className="text-[10px] text-zinc-400">({item.variantName})</span>
                          )}
                        </div>
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                          ₹{item.price * item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Pricing Breakdown */}
                  {orderData.pricing && (
                    <div className="pt-2 border-t border-dashed border-zinc-200 dark:border-zinc-800 space-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                      <div className="flex justify-between">
                        <span>Item Total</span>
                        <span>₹{orderData.pricing.subtotal}</span>
                      </div>
                      {orderData.pricing.discount > 0 && (
                        <div className="flex justify-between text-emerald-600 font-semibold">
                          <span>Discount Applied</span>
                          <span>-₹{orderData.pricing.discount}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Taxes & Charges</span>
                        <span>₹{orderData.pricing.tax}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Delivery Fee</span>
                        <span>₹{orderData.pricing.deliveryFee}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-zinc-200 dark:border-zinc-800 text-sm font-extrabold text-zinc-900 dark:text-white">
                        <span>Grand Total</span>
                        <span>₹{orderData.pricing.total}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setOrderData(null)
                    setError("")
                  }}
                  className="flex-1 py-3 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold rounded-xl text-xs sm:text-sm border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer"
                >
                  Track Another Order
                </button>

                <button
                  type="button"
                  onClick={() => {
                    let target = "/user/help"
                    if (window.location.pathname.startsWith("/food") && !target.startsWith("/food")) {
                      target = `/food${target}`
                    }
                    navigate(target)
                  }}
                  className="flex-1 py-3 bg-[#E53935] hover:bg-[#D32F2F] active:scale-95 text-white font-bold rounded-xl text-xs sm:text-sm shadow-sm transition-all cursor-pointer border-0 flex items-center justify-center gap-1.5"
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>Need Help?</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </AnimatedPage>
  )
}
