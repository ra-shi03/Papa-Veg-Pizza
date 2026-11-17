import React, { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { ArrowLeft, ChevronRight, ChevronUp, ChevronDown, Plus, Sparkles, MapPin, Clock, CalendarClock, Bike, IndianRupee } from "lucide-react"
import { useCart } from "@food/context/CartContext"
import { useAppConfig } from "@food/context/AppConfigContext"
import ApplyCoupon from "./ApplyCoupon"
import CheckoutModal from "./CheckoutModal"
import CartOffers, { CheesyRewardsCard } from "./CartOffers"
import CouponAppliedPopup from "./CouponAppliedPopup"
import { usePaymentGateways } from "./usePaymentGateways"
import DeliveryTimeSheet from "./DeliveryTimeSheet"
import { readTrainJourney, trainOrderProblem, trainStoreQuery } from "@food/utils/trainJourney"
import { useTrainStations } from "@food/hooks/useTrainStations"
import { getCartCoords, isSlotStillValid, loadSlot, saveSlot, slotDay, slotLabel, time12, offerDiscount, toOrderItems, readPaymentMethod } from "./cartHelpers"
import { CartMealSuggestions, LimitedOffer } from "./upsell/CartUpsell"
import { AnimatedNumber, CartItemRow, CartSkeleton, haptic } from "./CartParts"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { toast } from "sonner"
import { removeCartKey } from "./upsell/upsellApi"
import apiClient from "@/services/api/axios"
import { orderAPI } from "@food/api"

const COUPON_KEY = "pvp_cart_coupon"

// Cart lines saved without their full spec (plain adds from the home screen and search) are read from the public
// menu, once per cart visit, priced for the customer's saved location exactly like the menu. The server quote then
// prices every row (see `lines` below); nothing here comes from sample data or a cached product list.
let publicMenuRequest = null
const loadPublicMenu = () => {
  if (!publicMenuRequest) {
    publicMenuRequest = apiClient
      .get("/food/products/public")
      .then((res) => (Array.isArray(res?.data?.data) ? res.data.data : []))
      .catch(() => {
        publicMenuRequest = null
        return []
      })
  }
  return publicMenuRequest
}
const priceForSize = (product, size) => {
  if (size) {
    const match = (product.sizes || []).find((s) => String(s.size).toLowerCase() === String(size).toLowerCase())
    if (match) return Number(match.price) || 0
  }
  return Number(product.price) || Number(product.sizes?.[0]?.price) || 0
}

function SectionTitle({ ui, children }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px" style={{ backgroundColor: ui.line }} />
      <h3 className="text-sm font-semibold" style={{ color: ui.muted }}>{children}</h3>
      <div className="flex-1 h-px" style={{ backgroundColor: ui.line }} />
    </div>
  )
}

function BillRow({ label, value, positive }) {
  return (
    <div className="flex justify-between items-center">
      <span>{label}</span>
      <span className={positive ? "font-semibold text-emerald-600" : "font-medium"}>{value}</span>
    </div>
  )
}

export default function Cart() {
  const navigate = useNavigate()
  const routerLocation = useLocation()
  const { replaceCart } = useCart()
  const { config: appConfig } = useAppConfig()
  const couponsOn = appConfig?.couponEnabled !== false
  const isLoggedIn = localStorage.getItem("user_authenticated") === "true" || !!localStorage.getItem("user_accessToken")

  // Checkout Modal State
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)

  // State Management
  const [cartItems, setCartItems] = useState([])
  const [cartLoaded, setCartLoaded] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const reduceMotion = useReducedMotion()
  const [orderTypeInfo, setOrderTypeInfo] = useState("")
  const [showCouponModal, setShowCouponModal] = useState(false)
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [couponRejected, setCouponRejected] = useState("")
  const [offers, setOffers] = useState([])
  const [fees, setFees] = useState({ handlingFee: 0, platformFee: 0, packagingFee: 0, deliveryFee: 0, freeDeliveryUpTo: 0, freeDeliveryThreshold: 0, gstRate: 0 })
  useEffect(() => {
    apiClient.get("/food/fee-config").then((res) => {
      const f = res?.data?.data
      if (f) setFees((prev) => ({ ...prev, ...f }))
    }).catch(() => {})
  }, [])

  // Delivery time: null = now, otherwise the ISO time of a "later" slot
  const [scheduledAt, setScheduledAt] = useState(() => loadSlot())
  const [showTimeSheet, setShowTimeSheet] = useState(false)
  const [slotInfo, setSlotInfo] = useState(null)
  const [slotLoading, setSlotLoading] = useState(false)
  const [slotError, setSlotError] = useState("")
  const loadSlots = useCallback(async () => {
    setSlotLoading(true)
    setSlotError("")
    try {
      const coords = getCartCoords()
      const res = await apiClient.get("/food/stores/slots", { params: trainStoreQuery(readTrainJourney()) || coords || {}, _isFallback: true })
      setSlotInfo(res?.data?.data || null)
    } catch (err) {
      setSlotError(err?.response?.data?.error || err?.response?.data?.message || "Couldn't load delivery slots")
    } finally {
      setSlotLoading(false)
    }
  }, [])
  useEffect(() => { loadSlots() }, [loadSlots])

  // A chosen slot that is no longer offered (time passed, hours changed, scheduling switched off) falls back to now
  useEffect(() => {
    if (!slotInfo || !scheduledAt) return
    const stillOffered = isSlotStillValid(scheduledAt) && (slotInfo.days || []).some((d) => d.slots.some((s) => s.at === scheduledAt))
    if (!stillOffered) {
      setScheduledAt(null)
      saveSlot(null)
      toast("Your delivery slot is no longer available, please pick another time")
    }
  }, [slotInfo]) // eslint-disable-line react-hooks/exhaustive-deps

  const chooseTime = (at) => {
    setScheduledAt(at)
    saveSlot(at)
    setShowTimeSheet(false)
    toast.success(at ? `Scheduled for ${slotLabel(at)}` : "Delivering as soon as possible")
  }
  const openTimeSheet = () => {
    haptic()
    setShowTimeSheet(true)
    loadSlots()
  }
  const changeLocation = () => {
    haptic()
    const base = window.location.pathname.startsWith("/food") ? "/food" : ""
    navigate(`${base}/user/location/setup`, { state: { from: routerLocation.pathname } })
  }

  // Coupons the server will honour for this store (with robust fallback chain)
  useEffect(() => {
    if (!couponsOn) {
      setOffers([])
      return
    }

    let active = true

    const loadCoupons = async () => {
      let found = []

      // 1. Try public offers endpoint
      try {
        const storeId = slotInfo?.storeId || localStorage.getItem("user_storeId") || ""
        const res = await apiClient.get("/food/offers/public", {
          params: storeId ? { storeId } : {},
          _isFallback: true,
        })
        const list = res?.data?.data?.allOffers || res?.data?.allOffers
        if (Array.isArray(list) && list.length > 0) {
          found = list
        }
      } catch (_) {}

      // 2. Try settings coupons public endpoint
      if (found.length === 0) {
        try {
          const res = await apiClient.get("/settings/coupons/public")
          const list = res?.data?.data || res?.data
          if (Array.isArray(list) && list.length > 0) {
            found = list
          }
        } catch (_) {}
      }

      // Only the coupons the super admin created (Marketing > Coupons); nothing is made up here.
      // Normalize all offers into standard shape
      const normalized = found.map((o) => {
        const isPct = o.discountType === "percentage" || o.couponType === "Percentage"
        const val = Number(o.discountValue ?? o.value ?? 0)
        return {
          id: o._id || o.id || o.couponCode || o.code,
          _id: o._id || o.id || o.couponCode || o.code,
          couponCode: (o.couponCode || o.code || "").toUpperCase(),
          title: o.title || (isPct ? `${val}% OFF` : `FLAT ₹${val} OFF`),
          description: o.description || (isPct ? `Get ${val}% off on your order` : `Get flat ₹${val} discount`),
          discountType: isPct ? "percentage" : "flat-price",
          discountValue: val,
          minOrderValue: Number(o.minOrderValue ?? o.minOrder ?? 0),
          maxDiscount: o.maxDiscount != null ? Number(o.maxDiscount) : null,
          status: o.status || (o.isActive !== false ? "active" : "inactive"),
          showInCart: o.showInCart !== false,
          endDate: o.endDate || null,
          applicableOn: o.applicableOn || "All",
          applicableSizes: Array.isArray(o.applicableSizes) ? o.applicableSizes : [],
          customerScope: o.customerScope || "all",
        }
      })

      if (active) {
        setOffers(normalized)
      }
    }

    loadCoupons()

    return () => {
      active = false
    }
  }, [couponsOn, slotInfo?.storeId])

  // The server decides which coupons work for this cart (category / product / store / first order / limits), so the
  // list only offers "Apply" on the ones that do. Re-asked whenever the cart or store changes.
  const [eligibility, setEligibility] = useState({})
  const eligibilityKey = JSON.stringify([
    cartItems.map((i) => [i.itemId || i.id, i.quantity, i.size, i.crust, i.toppings, i.meals, i.extraCheese, i.offerToken]),
    slotInfo?.storeId || "",
  ])
  useEffect(() => {
    if (!isLoggedIn || !slotInfo?.storeId || cartItems.length === 0 || offers.length === 0) {
      setEligibility({})
      return undefined
    }
    let cancelled = false
    const timer = setTimeout(async () => {
      try {
        const res = await orderAPI.couponEligibility({ storeId: slotInfo.storeId, items: toOrderItems(cartItems) })
        if (cancelled) return
        const map = {}
        for (const c of res?.data?.data?.coupons || []) map[c.couponCode] = c
        setEligibility(map)
      } catch (_) {
        if (!cancelled) setEligibility({})
      }
    }, 400)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [eligibilityKey, isLoggedIn, offers.length]) // eslint-disable-line react-hooks/exhaustive-deps
  const offersWithEligibility = useMemo(
    () => offers.map((o) => (eligibility[o.couponCode] ? { ...o, eligibility: eligibility[o.couponCode] } : o)),
    [offers, eligibility],
  )

  // Keep the applied coupon while this tab is open (e.g. across a trip to the location screen)
  useEffect(() => {
    if (appliedCoupon || offers.length === 0) return
    try {
      const saved = sessionStorage.getItem(COUPON_KEY)
      const offer = saved && offers.find((o) => o.couponCode === saved)
      if (offer) setAppliedCoupon(offer)
    } catch (_) {}
  }, [offers]) // eslint-disable-line react-hooks/exhaustive-deps

  // Chosen on the Payment Options page; read again when this page opens
  const gateways = usePaymentGateways()
  const payMethod = readPaymentMethod(appConfig, gateways)
  const [couponPopup, setCouponPopup] = useState(null)
  const closeCouponPopup = useCallback(() => setCouponPopup(null), [])
  const applyCoupon = (offer) => {
    haptic(12)
    setCouponRejected("")
    setAppliedCoupon(offer)
    try { sessionStorage.setItem(COUPON_KEY, offer.couponCode) } catch (_) {}
  }
  const removeCoupon = () => {
    setAppliedCoupon(null)
    setCouponRejected("")
    try { sessionStorage.removeItem(COUPON_KEY) } catch (_) {}
  }

  const [showTaxDetails, setShowTaxDetails] = useState(false)
  const billRef = useRef(null)
  const [isDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("appTheme")
    return savedTheme ? savedTheme === "dark" : false
  })

  const getMenuPath = () => {
    return window.location.pathname.startsWith("/food") ? "/food/user/menu" : "/user/menu"
  }

  // Navigate directly to menu page when cart is empty (not right after an order: the customer goes to its tracking)
  const orderJustPlaced = useRef(false)
  useEffect(() => {
    if (cartLoaded && cartItems.length === 0 && !orderJustPlaced.current) {
      navigate(getMenuPath(), { replace: true })
    }
  }, [cartLoaded, cartItems.length, navigate])

  // Clear applied coupon if disabled globally
  useEffect(() => {
    if (appConfig?.couponEnabled === false && appliedCoupon) {
      setAppliedCoupon(null)
    }
  }, [appConfig?.couponEnabled, appliedCoupon])

  // Resolve Cart items from userCart localStorage on mount
  useEffect(() => {
    let runId = 0
    publicMenuRequest = null // fresh menu prices on every visit to the cart
    const resolveAndSyncCart = async () => {
      const run = ++runId
      const stored = JSON.parse(localStorage.getItem("userCart") || "{}")
      const customItemsMap = JSON.parse(localStorage.getItem("pvp_customized_items") || "{}")

      const list = []
      const plain = [] // keys saved without a spec: resolved from the public menu below

      Object.entries(stored).forEach(([key, qty]) => {
        const itemQuantity = typeof qty === 'object' && qty !== null ? Number(qty.quantity || 1) : Number(qty)
        if (itemQuantity <= 0) return

        // 1. Check if stored in pvp_customized_items
        if (customItemsMap[key]) {
          const c = customItemsMap[key]
          list.push({
            key,
            id: key,
            itemId: c.id,
            name: c.title || c.name,
            price: Number(c.price) || 0,
            image: c.image || c.imageUrl || "",
            description: c.description || "",
            size: c.selectedSize || "",
            quantity: itemQuantity,
            kind: c.kind,
            crust: c.crust,
            toppings: c.toppings,
            meals: c.meals,
            extraCheese: c.extraCheese,
            isLimitedOffer: !!c.isLimitedOffer,
            offerToken: c.offerToken,
            offerExpiresAt: c.offerExpiresAt,
            restaurant: "Papa Veg Pizza",
            restaurantId: "papa-veg-pizza-1"
          })
          return
        }

        plain.push({ key, quantity: itemQuantity })
      })

      if (plain.length > 0) {
        const menu = await loadPublicMenu()
        if (run !== runId) return
        plain.forEach(({ key, quantity }) => {
          const product = menu.find((p) => {
            const id = String(p._id || p.id || "")
            return id && (key === id || key.startsWith(`${id}-`))
          })
          if (!product) return // no longer on the menu: the server would refuse it, so it is not shown
          const id = String(product._id || product.id)
          const size = key.length > id.length ? key.slice(id.length + 1) : ""
          const name = product.name || product.title || ""
          list.push({
            key,
            id: key,
            itemId: id,
            name: size ? `${name} (${size})` : name,
            price: priceForSize(product, size),
            image: product.image || "",
            description: product.description || "",
            size,
            quantity,
            restaurant: "Papa Veg Pizza",
            restaurantId: "papa-veg-pizza-1"
          })
        })
      }

      // A limited time offer is dropped from the cart once its countdown ends
      const expired = list.find((i) => i.isLimitedOffer && i.offerExpiresAt && i.offerExpiresAt <= Date.now())
      if (expired) {
        removeCartKey(expired.key)
        return
      }

      if (run !== runId) return
      setCartItems(list)
      setCartLoaded(true)
      replaceCart(list)
    }

    resolveAndSyncCart()

    // Listen for updates from other tabs/pages
    window.addEventListener("cartUpdated", resolveAndSyncCart)
    return () => window.removeEventListener("cartUpdated", resolveAndSyncCart)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Takeaway / in-car label
  useEffect(() => {
    const activeService = localStorage.getItem("activeService") || "delivery"
    if (activeService === "takeaway") {
      setOrderTypeInfo(localStorage.getItem("takeawayHut") || "Nearest outlet")
    } else if (activeService === "incar") {
      setOrderTypeInfo(localStorage.getItem("carNumber") || "Vehicle dining")
    }
  }, [])

  // Modifying Item Quantity Handler
  const updateItemQty = (key, delta) => {
    const stored = JSON.parse(localStorage.getItem("userCart") || "{}")
    const newQty = (stored[key] || 0) + delta

    if (newQty <= 0) {
      delete stored[key]
    } else {
      stored[key] = newQty
    }

    localStorage.setItem("userCart", JSON.stringify(stored))
    window.dispatchEvent(new Event("cartUpdated"))

    const remainingKeys = Object.keys(stored).filter(k => {
      const v = stored[k]
      const q = typeof v === 'object' && v !== null ? Number(v.quantity || 1) : Number(v)
      return q > 0
    })
    if (remainingKeys.length === 0) {
      navigate(getMenuPath(), { replace: true })
    }
  }

  useEffect(() => {
    window.scrollTo(0, 0)
    const onScroll = () => setScrolled(window.scrollY > 4)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const removeItem = (item) => {
    const stored = JSON.parse(localStorage.getItem("userCart") || "{}")
    delete stored[item.key]
    localStorage.setItem("userCart", JSON.stringify(stored))
    window.dispatchEvent(new Event("cartUpdated"))

    const remainingKeys = Object.keys(stored).filter(k => {
      const v = stored[k]
      const q = typeof v === 'object' && v !== null ? Number(v.quantity || 1) : Number(v)
      return q > 0
    })
    if (remainingKeys.length === 0) {
      navigate(getMenuPath(), { replace: true })
    }
  }

  const changeQty = (item, delta) => {
    if (item.quantity + delta <= 0) removeItem(item)
    else updateItemQty(item.key, delta)
  }

  // Calculate pricing sums: a browser estimate, replaced by the server's quote (POST /food/orders/calculate) as soon as
  // it arrives. The quote is what the order will charge: store prices, fees, tax and the coupon as the server applies it.
  const estSubtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const estDiscount = appliedCoupon && !couponRejected ? offerDiscount(appliedCoupon, estSubtotal) : 0

  const [quote, setQuote] = useState(null) // { key, pricing } for the cart it was asked for
  const [quoteError, setQuoteError] = useState("")
  const quoteKey = JSON.stringify([
    cartItems.map((i) => [i.itemId || i.id, i.quantity, i.size, i.crust, i.toppings, i.meals, i.extraCheese, i.offerToken]),
    appliedCoupon?.couponCode || "",
    slotInfo?.storeId || "",
    scheduledAt || "",
  ])
  useEffect(() => {
    setCouponRejected("")
    if (!isLoggedIn || !slotInfo?.storeId || cartItems.length === 0) {
      setQuote(null)
      setQuoteError("")
      return undefined
    }
    let cancelled = false
    const timer = setTimeout(async () => {
      try {
        const point = readTrainJourney() ? null : getCartCoords()
        const res = await orderAPI.calculateOrder({
          storeId: slotInfo.storeId,
          items: toOrderItems(cartItems),
          ...(point ? { deliveryAddress: { location: { type: "Point", coordinates: [point.lng, point.lat] } } } : {}),
          ...(appliedCoupon?.couponCode ? { couponCode: appliedCoupon.couponCode } : {}),
          ...(scheduledAt ? { scheduledAt } : {}),
        })
        if (cancelled) return
        const pricing = res?.data?.data?.pricing || null
        const lines = Array.isArray(res?.data?.data?.lines) ? res.data.data.lines : null
        setQuote(pricing ? { key: quoteKey, pricing, lines } : null)
        setQuoteError("")
        // The server is the judge of the coupon (first-order-only, per-user limits, store scope...)
        if (pricing && appliedCoupon && !pricing.appliedCoupon && pricing.subtotal >= (appliedCoupon.minOrderValue || 0)) {
          setCouponRejected("not valid on this order for your account")
        }
      } catch (err) {
        if (cancelled) return
        setQuote(null)
        setQuoteError(err?.response?.data?.message || err?.response?.data?.error || "Could not get the order total from the server")
      }
    }, 400)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [quoteKey, isLoggedIn]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (quoteError) toast.error(quoteError)
  }, [quoteError])
  const q = quote && quote.key === quoteKey ? quote.pricing : null
  // Each row shows the price the server quoted for that line (same order as the cart); the local price only until then
  const quotedLines = quote && quote.key === quoteKey ? quote.lines : null
  // A signed-in customer's row shows a placeholder until the server has priced it (never the price saved when it was
  // added); a signed-out customer has no quote, so rows show the public menu's price.
  const quoteExpected = isLoggedIn && !!slotInfo?.storeId
  const shownItems = quotedLines && quotedLines.length === cartItems.length
    ? cartItems.map((item, i) => (Number.isFinite(Number(quotedLines[i]?.price)) ? { ...item, price: Number(quotedLines[i].price) } : item))
    : cartItems.map((item) => (quoteExpected && !quoteError ? { ...item, priceLoading: true } : item))

  // Fees are set by the super admin; until the quote arrives the browser estimates them (delivery by distance included)
  const freeDeliveryAt = [fees.freeDeliveryUpTo, fees.freeDeliveryThreshold].filter((v) => v > 0).sort((a, b) => a - b)[0] || 0
  const estFreeDelivery = freeDeliveryAt > 0 && estSubtotal >= freeDeliveryAt
  const gstShare = fees.gstRate / 2
  const estTaxable = estSubtotal - estDiscount + (estSubtotal > 0 ? fees.handlingFee : 0)
  const estCgst = estSubtotal > 0 ? Number((estTaxable * gstShare / 100).toFixed(2)) : 0

  const subtotal = q ? Number(q.subtotal) : estSubtotal
  const discount = q ? Number(q.discount || 0) : estDiscount
  const billDeliveryFee = q ? Number(q.deliveryFee || 0) : (estFreeDelivery ? 0 : fees.deliveryFee)
  const billPlatformPackaging = q ? Number(q.platformFee || 0) + Number(q.packagingFee || 0) : fees.platformFee + fees.packagingFee
  const billPlatformFee = q ? Number(q.platformFee || 0) : fees.platformFee
  const billPackagingFee = q ? Number(q.packagingFee || 0) : fees.packagingFee
  const billHandlingFee = q ? Number(q.handlingFee || 0) : fees.handlingFee
  const freeDelivery = q ? billDeliveryFee === 0 && fees.deliveryFee > 0 : estFreeDelivery
  const handlingCharge = subtotal > 0 ? Number((billDeliveryFee + billPlatformPackaging + billHandlingFee).toFixed(2)) : 0
  const cgst = q ? Number((Number(q.tax || 0) / 2).toFixed(2)) : estCgst
  const sgst = cgst
  const billTaxes = Number((cgst + sgst).toFixed(2))
  const billTaxesAndCharges = Number((billTaxes + billPlatformFee + billPackagingFee + billHandlingFee).toFixed(2))
  const total = q ? Number(q.total) : (subtotal > 0 ? Number((subtotal - discount + handlingCharge + cgst + sgst).toFixed(2)) : 0)
  const deliverySaved = freeDelivery && fees.deliveryFee > 0 ? fees.deliveryFee : 0
  const savings = Number((discount + deliverySaved).toFixed(2))
  const beforeSavings = Number((total + savings).toFixed(2))
  const itemCount = cartItems.reduce((n, i) => n + i.quantity, 0)

  const serviceKind = (typeof localStorage !== "undefined" && localStorage.getItem("activeService")) || "delivery"
  const isDelivery = serviceKind === "delivery"
  const deliveryAddressLabel = typeof localStorage !== "undefined" ? localStorage.getItem("deliveryAddress") || "" : ""
  const etaMinutes = appConfig?.estimatedDeliveryMinutes || 30
  const freeDeliveryShort = isDelivery && fees.deliveryFee > 0 && freeDeliveryAt > 0 && !freeDelivery ? Math.ceil(freeDeliveryAt - subtotal) : 0
  const ui = {
    dark: isDarkMode,
    page: isDarkMode ? "#111111" : "#F8F6F2",
    card: isDarkMode ? "#1b1b1d" : "#ffffff",
    soft: isDarkMode ? "#151517" : "#f6f6f8",
    text: isDarkMode ? "#f4f4f5" : "#1c1b1b",
    muted: isDarkMode ? "#a1a1aa" : "#6b7280",
    line: isDarkMode ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.10)",
  }

  const viewBill = () => {
    setShowTaxDetails(true)
    billRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" })
  }

  // A train order is refused before it is placed when no station or default train store is set up
  const trainJourney = readTrainJourney()
  const { info: trainInfo, failed: trainFailed } = useTrainStations(!!trainJourney)
  const trainProblem = trainJourney ? (trainFailed ? "Train delivery is not available yet" : trainOrderProblem(trainJourney, trainInfo)) : null

  const proceed = () => {
    if (trainProblem) {
      toast.error(trainProblem)
      return
    }
    if (slotInfo && slotInfo.openNow === false && !scheduledAt) {
      toast("The store is closed right now. Pick a delivery time to schedule your order.")
      openTimeSheet()
      return
    }
    haptic(12)
    setShowCheckoutModal(true)
  }

  return (
    <div className={`min-h-screen flex justify-center transition-colors duration-300 ${isDarkMode ? "bg-[#111111]" : "bg-[#F8F6F2]"}`}>
      <div
        className={`font-body-md text-body-md w-full max-w-md min-h-screen pb-44 flex flex-col relative shadow-2xl border-x ${
          isDarkMode ? "border-zinc-800/40" : "border-gray-200/50"
        }`}
        style={{
          background: isDarkMode
            ? "#111111"
            : "radial-gradient(circle at top left, #FFF4F3 0%, #F8F6F2 40%, #F5F3EF 80%, #F8F6F2 100%)",
          color: isDarkMode ? "#e5e2e1" : "#1c1b1b",
        }}
      >
      {/* Custom Global Scrollbar Hider and Styling injection */}      <style dangerouslySetInnerHTML={{
        __html: `
        .glass-card {
          background: ${isDarkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.9)"} !important;
          backdrop-filter: blur(20px) !important;
          border: 1px solid ${isDarkMode ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.06)"} !important;
          box-shadow: ${isDarkMode ? "none" : "0 4px 6px -1px rgba(0, 0, 0, 0.05)"} !important;
        }
        .hide-scrollbar::-webkit-scrollbar { display: none !important; }
        .hide-scrollbar { -ms-overflow-style: none !important; scrollbar-width: none !important; }
        .active-nav-glow { box-shadow: 0 0 15px rgba(229, 57, 53, 0.3) !important; }
        
        /* Font Families */
        .font-headline-lg-mobile, .font-headline-lg, .font-display-lg {
          font-family: 'Plus Jakarta Sans', sans-serif !important;
        }
        .font-body-md, .font-label-sm, .font-price-xl {
          font-family: 'Inter', sans-serif !important;
        }
        
        /* Font Sizes & Sizing Styles */
        .text-headline-lg-mobile {
          font-size: 28px !important;
          line-height: 34px !important;
          font-weight: 700 !important;
        }
        .text-headline-lg {
          font-size: 32px !important;
          line-height: 40px !important;
          letter-spacing: -0.01em !important;
          font-weight: 700 !important;
        }
        .text-display-lg {
          font-size: 40px !important;
          line-height: 48px !important;
          letter-spacing: -0.02em !important;
          font-weight: 800 !important;
        }
        .text-body-md {
          font-size: 16px !important;
          line-height: 24px !important;
          font-weight: 400 !important;
        }
        .text-label-sm {
          font-size: 12px !important;
          line-height: 16px !important;
          letter-spacing: 0.05em !important;
          font-weight: 600 !important;
        }
        .text-price-xl {
          font-size: 24px !important;
          line-height: 24px !important;
          letter-spacing: -0.01em !important;
          font-weight: 700 !important;
        }
        .px-margin-mobile {
          padding-left: 20px !important;
          padding-right: 20px !important;
        }
        .p-margin-mobile {
          padding: 20px !important;
        }
        .mx-margin-mobile {
          margin-left: 20px !important;
          margin-right: 20px !important;
        }
        .gap-gutter {
          gap: 16px !important;
        }
        .space-y-lg > :not([hidden]) ~ :not([hidden]) {
          margin-top: 24px !important;
        }
        .space-y-md > :not([hidden]) ~ :not([hidden]) {
          margin-top: 16px !important;
        }
        .space-y-sm > :not([hidden]) ~ :not([hidden]) {
          margin-top: 12px !important;
        }
        .p-md {
          padding: 16px !important;
        }
        .mt-md {
          margin-top: 16px !important;
        }
        .bg-surface\/80 {
          background-color: ${isDarkMode ? "rgba(19, 19, 19, 0.8)" : "rgba(255, 255, 255, 0.8)"} !important;
        }
        .bg-surface\/90 {
          background-color: ${isDarkMode ? "rgba(19, 19, 19, 0.9)" : "rgba(255, 255, 255, 0.9)"} !important;
        }
        .text-primary {
          color: #E53935 !important;
        }
        .bg-primary {
          background-color: #E53935 !important;
        }
        .border-primary {
          border-color: #E53935 !important;
        }
        .focus\\:border-primary:focus {
          border-color: #E53935 !important;
        }
        .text-secondary {
          color: #FF6B35 !important;
        }
        .bg-secondary {
          background-color: #FF6B35 !important;
        }
        .bg-tertiary {
          background-color: #3ce36a !important;
        }
        .text-tertiary {
          color: #3ce36a !important;
        }
        .text-on-primary {
          color: #ffffff !important;
        }
        .text-on-secondary {
          color: #ffffff !important;
        }
        .text-on-tertiary {
          color: #000000 !important;
        }
        .bg-primary-container {
          background-color: #ff544c !important;
        }
        .text-on-primary-container {
          color: #5c0005 !important;
        }
        .text-on-surface-variant {
          color: ${isDarkMode ? "#e4beb9" : "#6b7280"} !important;
        }
        .border-white\/10 {
          border-color: ${isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)"} !important;
        }
        .bg-white\/10 {
          background-color: ${isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)"} !important;
        }
        .text-white\/40 {
          color: ${isDarkMode ? "rgba(255, 255, 255, 0.4)" : "rgba(19, 19, 19, 0.4)"} !important;
        }
        `
      }} />

      {/* Header */}
      <header
        className="sticky top-0 z-20 w-full h-14 flex items-center gap-3 px-4 transition-shadow duration-200"
        style={{
          backgroundColor: ui.card,
          borderBottom: `1px solid ${ui.line}`,
          boxShadow: scrolled ? "0 4px 14px rgba(0,0,0,0.10)" : "none",
        }}
      >
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="p-1 -ml-1 flex items-center justify-center bg-transparent border-0 cursor-pointer active:scale-95 transition-transform"
          style={{ color: ui.text }}
        >
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-lg font-bold leading-none select-none" style={{ color: ui.text }}>
          Cart
        </h1>
      </header>

      {!cartLoaded ? (
        <CartSkeleton ui={ui} />
      ) : cartItems.length === 0 ? null : (
        <div className="px-2 pt-3 space-y-3">
          {/* When + Where: 2-column compact layout (Delivery left, Deliver To right, each 2 rows) */}
          <div className="rounded-lg overflow-hidden border shadow-sm" style={{ backgroundColor: ui.card, borderColor: ui.line }}>
            <div className="flex items-stretch">
              {/* Left Column: Delivery (2 rows) */}
              <button
                onClick={openTimeSheet}
                aria-label="Change delivery time"
                className="w-[38%] px-3.5 py-2.5 bg-transparent border-0 cursor-pointer text-left flex flex-col justify-center active:opacity-75 transition-opacity"
              >
                <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#E53935]">
                  <span>{scheduledAt ? "SCHEDULED" : isDelivery ? "DELIVERY" : serviceKind === "takeaway" ? "TAKEAWAY" : "IN-CAR"}</span>
                  <ChevronDown size={13} className="text-[#E53935] shrink-0" />
                </div>
                <div className="text-[13px] font-extrabold truncate mt-0.5" style={{ color: ui.text }}>
                  {scheduledAt
                    ? `${time12(scheduledAt)} · ${slotDay(scheduledAt)}`
                    : isDelivery
                    ? `${etaMinutes} Mins`
                    : "Now"}
                </div>
              </button>

              {/* Vertical divider */}
              <div className="w-[1px] my-2" style={{ backgroundColor: ui.line }} />

              {/* Right Column: Deliver to (2 rows) */}
              <button
                onClick={changeLocation}
                aria-label="Change delivery location"
                className="flex-1 min-w-0 px-3.5 py-2.5 bg-transparent border-0 cursor-pointer text-left flex flex-col justify-center active:opacity-75 transition-opacity"
              >
                <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: ui.muted }}>
                  {isDelivery ? "DELIVER TO" : "FROM"}
                </div>
                <div className="flex items-center justify-between gap-1 mt-0.5">
                  <span className="text-[13px] font-semibold truncate" style={{ color: deliveryAddressLabel || orderTypeInfo ? ui.text : "#E53935" }}>
                    {isDelivery ? (deliveryAddressLabel || "Set delivery location") : orderTypeInfo}
                  </span>
                  <ChevronRight size={14} className="shrink-0" style={{ color: ui.muted }} />
                </div>
              </button>
            </div>

            {slotInfo && slotInfo.openNow === false && !scheduledAt && (
              <button
                onClick={openTimeSheet}
                className="w-full px-3 py-1.5 text-left text-xs font-semibold border-0 cursor-pointer flex items-center gap-1.5"
                style={{
                  backgroundColor: isDarkMode ? "rgba(245,158,11,0.14)" : "#fff7e6",
                  color: isDarkMode ? "#fbbf24" : "#92400e",
                  borderTop: `1px solid ${ui.line}`,
                }}
              >
                <Clock size={13} className="shrink-0" />
                <span className="flex-1 truncate">The store is closed right now. Schedule for later.</span>
                <span className="underline shrink-0">Pick time</span>
              </button>
            )}
          </div>

          {/* Free delivery nudge */}
          {freeDeliveryShort > 0 && (
            <div className="rounded-2xl px-4 py-3" style={{ backgroundColor: ui.card }}>
              <p className="text-[13px] flex items-center gap-2" style={{ color: ui.text }}>
                <Bike size={16} className="shrink-0 text-[#1b8a3a]" />
                <span>Add <b>₹{freeDeliveryShort}</b> more for <b className="text-[#1b8a3a]">FREE delivery</b></span>
              </p>
              <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: ui.line }}>
                <motion.div className="h-full rounded-full bg-[#1b8a3a]" initial={false} animate={{ width: `${Math.min(100, (subtotal / freeDeliveryAt) * 100)}%` }} transition={{ duration: 0.4 }} />
              </div>
            </div>
          )}

          {/* Limited time offer (slide to unlock) */}
          <div className="-mx-1">
            <LimitedOffer dark={isDarkMode} cartTotal={subtotal} hasOfferInCart={cartItems.some((i) => i.isLimitedOffer)} />
          </div>

          {/* Items */}
          <div className="rounded-2xl overflow-hidden text-left" style={{ backgroundColor: ui.card }}>
            <AnimatePresence initial={false}>
              {shownItems.map((item, index) => (
                <CartItemRow
                  key={item.key}
                  item={item}
                  index={index}
                  ui={ui}
                  onQty={(delta) => changeQty(item, delta)}
                  onRemove={() => removeItem(item)}
                />
              ))}
            </AnimatePresence>
            <button
              onClick={() => navigate(getMenuPath())}
              className="w-full flex items-center gap-2 px-4 py-3.5 text-sm font-medium bg-transparent border-0 cursor-pointer text-left"
              style={{ color: ui.muted, borderTop: `1px dashed ${ui.line}` }}
            >
              <Plus size={16} /> Add more items
            </button>
          </div>

          {/* Complete your meal with */}
          <div className="-mx-2">
            <CartMealSuggestions dark={isDarkMode} cartIds={cartItems.map((i) => String(i.itemId))} />
          </div>

          {/* Savings & Rewards: coupons section matching Image 5 */}
          {couponsOn && (
            <CartOffers
              offers={offersWithEligibility}
              subtotal={subtotal}
              applied={appliedCoupon ? offersWithEligibility.find((o) => o.couponCode === appliedCoupon.couponCode) || appliedCoupon : null}
              rejectedReason={couponRejected}
              deliverySaved={deliverySaved}
              freeDelivery={freeDelivery}
              onApply={(offer) => {
                applyCoupon(offer)
                setCouponPopup({ code: offer.couponCode, saving: offerDiscount(offer, subtotal), at: Date.now() })
              }}
              onRemove={removeCoupon}
              onViewAll={() => setShowCouponModal(true)}
              ui={ui}
            />
          )}

          {/* Cheesy Rewards section matching Image 5 */}
          <CheesyRewardsCard
            subtotal={subtotal}
            ui={ui}
            onAddItems={() => navigate(getMenuPath())}
            isDarkMode={isDarkMode}
          />

          {/* Bill details */}
          <div className="pt-2 pb-4" ref={billRef}>
            <SectionTitle ui={ui}>Bill Details</SectionTitle>
            <div className="mt-3 rounded-2xl p-4 text-left" style={{ backgroundColor: ui.card }}>
              <div className="space-y-2 text-sm" style={{ color: ui.muted }}>
                <BillRow label={`Item total (${itemCount})`} value={`₹${subtotal}`} />
                {discount > 0 && <BillRow label={`Coupon (${appliedCoupon.couponCode})`} value={`-₹${discount}`} positive />}
                {isDelivery && fees.deliveryFee > 0 && (
                  <BillRow label="Delivery fee" value={freeDelivery ? <><span className="line-through mr-1.5" style={{ color: ui.muted }}>₹{fees.deliveryFee}</span><span className="text-emerald-600 font-semibold">FREE</span></> : `₹${billDeliveryFee}`} />
                )}
                {subtotal > 0 && billTaxesAndCharges > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowTaxDetails(!showTaxDetails)}
                      aria-expanded={showTaxDetails}
                      className="w-full flex justify-between items-center bg-transparent border-0 p-0 cursor-pointer text-left text-sm"
                      style={{ color: ui.muted }}
                    >
                      <span className="flex items-center gap-1">Taxes &amp; charges {showTaxDetails ? <ChevronUp size={14} /> : <ChevronRight size={14} />}</span>
                      <span className="font-medium">₹{billTaxesAndCharges}</span>
                    </button>
                    <AnimatePresence initial={false}>
                      {showTaxDetails && (
                        <motion.div
                          key="bill-breakdown"
                          initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                          transition={{ duration: 0.22 }}
                          className="overflow-hidden"
                        >
                          <div className="pl-3 space-y-2 text-[13px]">
                            {billTaxes > 0 && <BillRow label="Taxes" value={`₹${billTaxes}`} />}
                            {billPlatformFee > 0 && <BillRow label="Platform fee" value={`₹${billPlatformFee}`} />}
                            {billPackagingFee > 0 && <BillRow label="Packaging fee" value={`₹${billPackagingFee}`} />}
                            {billHandlingFee > 0 && <BillRow label="Handling fee" value={`₹${billHandlingFee}`} />}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </div>

              <div className="mt-3 pt-3 flex items-start justify-between" style={{ borderTop: `1px dashed ${ui.line}` }}>
                <div>
                  <p className="text-base font-bold" style={{ color: ui.text }}>To Pay</p>
                  <p className="text-[11px]" style={{ color: ui.muted }}>Incl. taxes and charges</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold" style={{ color: ui.text }}>
                    {savings > 0 && <span className="text-sm font-medium line-through mr-2" style={{ color: ui.muted }}>₹{beforeSavings}</span>}
                    <AnimatedNumber value={total} />
                  </p>
                  {savings > 0 && (
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[11px] font-bold text-white" style={{ backgroundColor: "#1b8a3a" }}>YOU SAVED ₹{savings}</span>
                  )}
                </div>
              </div>
            </div>
            <p className="mt-3 px-1 text-[11px] leading-relaxed text-left" style={{ color: ui.muted }}>
              Review your order and address before paying. Orders can't be cancelled once the kitchen starts preparing them.
            </p>
          </div>
        </div>
      )}

      {/* Sticky pay bar: the saved badge floats just above the white bar */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-30">
          {savings > 0 && (
            <motion.div
              key={`saved-${savings}`}
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-3 mb-2 rounded-xl px-3 py-2.5 flex items-center gap-2 text-sm text-left shadow-md" style={{ backgroundColor: isDarkMode ? "#16301f" : "#e8f5ec", color: isDarkMode ? "#9be7b0" : "#1b5e30", border: `1px solid ${isDarkMode ? "rgba(155,231,176,0.18)" : "rgba(27,94,48,0.12)"}` }}>
              <Sparkles size={16} className="shrink-0" />
              <span>You saved <b>₹{savings}</b> on this order</span>
            </motion.div>
          )}
          <div style={{ backgroundColor: ui.card, boxShadow: "0 -4px 20px rgba(0,0,0,0.12)" }}>
          {trainProblem && (
            <p role="alert" className="mx-3 pt-3 text-sm font-semibold text-left" style={{ color: "#d32f3a" }}>{trainProblem}</p>
          )}
          <div className="flex items-center gap-3 px-3 pt-3 pb-6">
            {/* Payment method: opens the Payment Options page */}
            <button
              type="button"
              onClick={() => navigate("/user/account/profile-details/payments", { state: { from: "cart", total } })}
              aria-label={`Payment method: ${payMethod.title}. Change`}
              className="shrink-0 flex items-center gap-2 rounded-xl px-2 py-1.5 cursor-pointer active:scale-[0.97] transition-transform text-left"
              style={{ backgroundColor: "transparent", border: "none" }}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border" style={{ borderColor: ui.line, backgroundColor: isDarkMode ? "rgba(255,255,255,0.06)" : "#ffffff", color: ui.text }}>
                <IndianRupee size={17} strokeWidth={2.4} />
              </span>
              <span className="whitespace-pre-line text-[12px] font-semibold leading-tight" style={{ color: ui.text }}>{payMethod.short}</span>
              <ChevronDown size={14} style={{ color: ui.muted }} />
            </button>
            <button
              onClick={proceed}
              disabled={!!trainProblem}
              className="flex-1 min-w-0 h-12 rounded-xl text-white font-bold text-[15px] border-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform"
              style={{ backgroundColor: "#d32f3a" }}
            >
              <span>{scheduledAt ? "Schedule & Pay" : "Pay"} ₹{Number(total.toFixed(2))}</span>
              {savings > 0 && <span className="text-[12px] font-medium line-through opacity-80">₹{beforeSavings}</span>}
              <ChevronRight size={18} className="shrink-0" />
            </button>
          </div>
          </div>
        </div>
      )}

      {/* Delivery time: now / later */}
      <DeliveryTimeSheet
        open={showTimeSheet}
        onClose={() => setShowTimeSheet(false)}
        info={slotInfo}
        loading={slotLoading}
        error={slotError}
        onRetry={loadSlots}
        value={scheduledAt}
        onConfirm={chooseTime}
        etaMinutes={etaMinutes}
        isDelivery={isDelivery}
        ui={ui}
      />

      <CouponAppliedPopup popup={couponPopup} onDone={closeCouponPopup} />

      {/* All offers + coupon code */}
      <ApplyCoupon
        show={showCouponModal}
        onClose={() => setShowCouponModal(false)}
        offers={offersWithEligibility}
        subtotal={subtotal}
        appliedCode={appliedCoupon?.couponCode}
        onApply={(offer) => { applyCoupon(offer); setCouponPopup({ code: offer.couponCode, saving: offerDiscount(offer, subtotal), at: Date.now() }) }}
        onRemove={removeCoupon}
        ui={ui}
      />

      {/* Checkout Modal Overlay */}
      <CheckoutModal
        show={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        cartItems={cartItems}
        couponCode={discount > 0 ? appliedCoupon?.couponCode : undefined}
        subtotal={subtotal}
        discount={discount}
        handlingCharge={handlingCharge}
        cgst={cgst}
        sgst={sgst}
        total={total}
        scheduledAt={scheduledAt}
        onChangeTime={() => { setShowCheckoutModal(false); openTimeSheet() }}
        onOrderPlaced={() => { orderJustPlaced.current = true }}
        blockedMessage={trainProblem}
      />
      </div>
    </div>
  )
}
