import React, { useState, useEffect, useCallback, useRef } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { ArrowLeft, ChevronRight, ChevronUp, ChevronDown, Plus, Sparkles, MapPin, Clock, CalendarClock, Bike } from "lucide-react"
import { useCart } from "@food/context/CartContext"
import { useAppConfig } from "@food/context/AppConfigContext"
import ApplyCoupon from "./ApplyCoupon"
import CheckoutModal from "./CheckoutModal"
import CartOffers, { CheesyRewardsCard } from "./CartOffers"
import DeliveryTimeSheet from "./DeliveryTimeSheet"
import { getCartCoords, isSlotStillValid, loadSlot, saveSlot, slotDay, slotLabel, time12, offerDiscount, toOrderItems } from "./cartHelpers"
import { CartMealSuggestions, LimitedOffer } from "./upsell/CartUpsell"
import { AnimatedNumber, CartItemRow, CartSkeleton, haptic } from "./CartParts"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { toast } from "sonner"
import { removeCartKey } from "./upsell/upsellApi"
import apiClient from "@/services/api/axios"
import { orderAPI } from "@food/api"
import { STANDALONE_MOCK } from "@/services/api/mockPolicy"

const COUPON_KEY = "pvp_cart_coupon"

const ALL_PRODUCTS = {
  "margherita-supreme": {
    id: "margherita-supreme",
    name: "Margherita Supreme",
    price: 299,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBluz4eCNAilJO6yR3_OFzJkONQMKo9XRScol5o2w_wqSUPMQDImok1wr4UrTbZd0tDM7eicy98AOUq9ORUm23pi_z6uJuyeKQ3_tMtGkycxVZqFNywk1nb7d0RmEboytoVC-L__LD3BvG4JNTz3ZyFOnr8AyX-1ztogKmbBa3797PAAs2KoxmP2fFsZ_kMnaS2D-lsv6J0g5sQojmKXNF9d470loeENjh89lAF_TJu4TG-lB2oxnC2s56TPYL6h1CjXGleROU_bDPc",
    description: "Buffalo mozzarella, San Marzano tomatoes, fresh basil."
  },
  "farmhouse-delight": {
    id: "farmhouse-delight",
    name: "Farmhouse Delight",
    price: 349,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA6Rib9mlrsig1haXvSfhY1zS2NGAIwUFig_-dDDTjQXBRJ_hdwzvKhvSs4X_KczL-USNdycC0vnIVox-Oyrmt5zbOdPneq43yDpJwEWYB3CSCU5gL7rFmEitcAS-QChuUXgeCi6WJcn32uqxZfLupJCZNO4YVg04lB8Y1JIsHt8L0bgON_2RuBMVL02rBMhN5haheBGgLGmqbDG4wUP7bqztn0gWQKQQedaHRRZ14BMbnbI7P9oZaCYPYkXEol9_8DJ3BLamRCaUpO",
    description: "Mushrooms, onions, peppers, and sweet corn."
  },
  "fiery-schezwan": {
    id: "fiery-schezwan",
    name: "Fiery Schezwan Veggie",
    price: 299,
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=80",
    description: "Fiery schezwan sauce, dynamic mozzarella, onions, sweet bell peppers, and fresh greens."
  },
  "smokey-bbq": {
    id: "smokey-bbq",
    name: "Smokey BBQ Veggie",
    price: 299,
    image: "https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=500&auto=format&fit=crop&q=80",
    description: "Rich smokey BBQ base, melted mozzarella, loaded red onions, golden sweet corn, and BBQ drizzle."
  },
  "paneer-makhni": {
    id: "paneer-makhni",
    name: "Paneer Makhni Masala",
    price: 299,
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&auto=format&fit=crop&q=80",
    description: "Indian style Makhni sauce, premium marinated paneer cubes, capsicum, red onions, and tomatoes."
  },
  "overloaded-veggies": {
    id: "overloaded-veggies",
    name: "Overloaded Veggies",
    price: 299,
    image: "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=500&auto=format&fit=crop&q=80",
    description: "Black olives, mushrooms, sweet corn, red onions, tri-color bell peppers, and jalapeños."
  },
  "crispy-veg-burger": {
    id: "crispy-veg-burger",
    name: "Crispy Veg Burger",
    price: 149,
    image: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=500&auto=format&fit=crop&q=80",
    description: "Crispy mixed vegetable patty, fresh lettuce, tomatoes, and creamy classic mayonnaise."
  },
  "spicy-paneer-burger": {
    id: "spicy-paneer-burger",
    name: "Spicy Paneer Burger",
    price: 189,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80",
    description: "Spicy marinated paneer patty, layered with spicy dressing, melted cheese, and sliced onions."
  },
  "garlic-bread-stix": {
    id: "garlic-bread-stix",
    name: "Garlic Bread Stix",
    price: 119,
    image: "https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?w=500&auto=format&fit=crop&q=80",
    description: "Freshly baked garlic bread sticks served warm with creamy dynamic dipping sauce."
  },
  "cheese-garlic-bread": {
    id: "cheese-garlic-bread",
    name: "Cheese Garlic Bread",
    price: 149,
    image: "https://images.unsplash.com/photo-1574085733277-851d9d856a3a?w=500&auto=format&fit=crop&q=80",
    description: "Toasted thick bread slices loaded with garlic butter, fresh parsley, and gooey melted mozzarella."
  },
  "creamy-mushroom-penne": {
    id: "creamy-mushroom-penne",
    name: "Creamy Mushroom Penne",
    price: 249,
    image: "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=500&auto=format&fit=crop&q=80",
    description: "Penne tossed in a rich, creamy white parmesan sauce loaded with fresh button mushrooms and garlic herbs."
  },
  "spiced-arrabbiata": {
    id: "spiced-arrabbiata",
    name: "Spiced Arrabbiata Pasta",
    price: 229,
    image: "https://images.unsplash.com/photo-1608897013039-887f21d8c804?w=500&auto=format&fit=crop&q=80",
    description: "Penne pasta in a fiery, spiced San Marzano tomato sauce infused with fresh garlic, chili flakes, and basil leaves."
  },
  "warm-brownie": {
    id: "warm-brownie",
    name: "Warm Chocolate Brownie",
    price: 129,
    image: "https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=500&auto=format&fit=crop&q=80",
    description: "Rich, dense chocolate brownie served warm with a shiny, gooey dark chocolate glaze on top."
  },
  "choco-volcano": {
    id: "choco-volcano",
    name: "Choco Volcano Cake",
    price: 139,
    image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&auto=format&fit=crop&q=80",
    description: "Freshly baked soft chocolate sponge cake with a molten, oozing chocolate lava core inside."
  },
  "water-bottle": {
    id: "water-bottle",
    name: "Purified Water Bottle",
    price: 40,
    image: "/food/bisleri_water_bottle.png",
    description: "Ice-cold premium mineral packaged drinking water for refreshment."
  },
  "pepsi-cola": {
    id: "pepsi-cola",
    name: "Pepsi Cola (500ml)",
    price: 60,
    image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80",
    description: "500ml bottle of cold, sparkling carbonated Pepsi cola beverage."
  }
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
      const res = await apiClient.get("/food/stores/slots", { params: coords || {}, _isFallback: true })
      setSlotInfo(res?.data?.data || null)
    } catch (err) {
      setSlotError(err?.response?.data?.message || "Couldn't load delivery slots")
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

      // Only coupons the server publishes for customers; the sample ones below are for standalone mock mode only
      // (a coupon the server does not know would show a discount the order never gets)
      if (found.length === 0 && STANDALONE_MOCK) {
        try {
          const stored = localStorage.getItem("pvp_coupons")
          if (stored) {
            const list = JSON.parse(stored)
            if (Array.isArray(list) && list.length > 0) {
              found = list
            }
          }
        } catch (_) {}
      }

      if (found.length === 0 && STANDALONE_MOCK) {
        found = [
          {
            couponCode: "WELCOME50",
            title: "50% OFF up to ₹150",
            description: "Get 50% discount up to ₹150 on your order. Min order ₹249",
            discountType: "percentage",
            discountValue: 50,
            minOrderValue: 249,
            maxDiscount: 150,
            status: "active",
            showInCart: true,
          },
          {
            couponCode: "PVP100",
            title: "FLAT ₹100 OFF",
            description: "Save ₹100 instantly on fresh pizzas. Min order ₹399",
            discountType: "flat-price",
            discountValue: 100,
            minOrderValue: 399,
            maxDiscount: 100,
            status: "active",
            showInCart: true,
          },
          {
            couponCode: "FEAST20",
            title: "20% OFF Feast Deal",
            description: "Enjoy 20% off up to ₹200 on all orders above ₹499",
            discountType: "percentage",
            discountValue: 20,
            minOrderValue: 499,
            maxDiscount: 200,
            status: "active",
            showInCart: true,
          },
          {
            couponCode: "SUPERVEG",
            title: "FLAT ₹50 OFF",
            description: "Flat ₹50 off on delicious pizzas. Min order ₹199",
            discountType: "flat-price",
            discountValue: 50,
            minOrderValue: 199,
            maxDiscount: 50,
            status: "active",
            showInCart: true,
          },
        ]
      }

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

  // Keep the applied coupon while this tab is open (e.g. across a trip to the location screen)
  useEffect(() => {
    if (appliedCoupon || offers.length === 0) return
    try {
      const saved = sessionStorage.getItem(COUPON_KEY)
      const offer = saved && offers.find((o) => o.couponCode === saved)
      if (offer) setAppliedCoupon(offer)
    } catch (_) {}
  }, [offers]) // eslint-disable-line react-hooks/exhaustive-deps

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

  // Navigate directly to menu page when cart is empty
  useEffect(() => {
    if (cartLoaded && cartItems.length === 0) {
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
    const resolveAndSyncCart = () => {
      const stored = JSON.parse(localStorage.getItem("userCart") || "{}")
      const customItemsMap = JSON.parse(localStorage.getItem("pvp_customized_items") || "{}")
      let dynamicProds = []
      try {
        dynamicProds = JSON.parse(localStorage.getItem("pvp_products_v2") || "[]")
      } catch (_) {}

      const list = []

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

        let baseId = key
        let size = ""

        const matchedBaseId = Object.keys(ALL_PRODUCTS).find(id => key.startsWith(id))
        if (matchedBaseId) {
          baseId = matchedBaseId
          if (key.length > matchedBaseId.length) {
            size = key.slice(matchedBaseId.length + 1)
          }
        }

        const prod = ALL_PRODUCTS[baseId]
        if (prod) {
          list.push({
            key,
            id: key,
            itemId: baseId,
            name: size ? `${prod.name} (${size})` : prod.name,
            price: prod.price,
            image: prod.image,
            description: prod.description,
            size,
            quantity: itemQuantity,
            restaurant: "Papa Veg Pizza",
            restaurantId: "papa-veg-pizza-1"
          })
          return
        }

        // 2. Check dynamic products from superadmin / API
        if (Array.isArray(dynamicProds) && dynamicProds.length > 0) {
          const foundDyn = dynamicProds.find(p => String(p._id || p.id) === String(baseId) || key.startsWith(String(p._id || p.id)))
          if (foundDyn) {
            list.push({
              key,
              id: key,
              itemId: foundDyn._id || foundDyn.id,
              name: size ? `${foundDyn.name || foundDyn.title} (${size})` : (foundDyn.name || foundDyn.title),
              price: Number(foundDyn.price) || 0,
              image: foundDyn.image || foundDyn.imageUrl || (Array.isArray(foundDyn.images) ? foundDyn.images[0] : ""),
              description: foundDyn.description || "",
              size,
              quantity: itemQuantity,
              restaurant: "Papa Veg Pizza",
              restaurantId: "papa-veg-pizza-1"
            })
          }
        }
      })

      // A limited time offer is dropped from the cart once its countdown ends
      const expired = list.find((i) => i.isLimitedOffer && i.offerExpiresAt && i.offerExpiresAt <= Date.now())
      if (expired) {
        removeCartKey(expired.key)
        return
      }

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
        const point = getCartCoords()
        const res = await orderAPI.calculateOrder({
          storeId: slotInfo.storeId,
          items: toOrderItems(cartItems),
          ...(point ? { deliveryAddress: { location: { type: "Point", coordinates: [point.lng, point.lat] } } } : {}),
          ...(appliedCoupon?.couponCode ? { couponCode: appliedCoupon.couponCode } : {}),
          ...(scheduledAt ? { scheduledAt } : {}),
        })
        if (cancelled) return
        const pricing = res?.data?.data?.pricing || null
        setQuote(pricing ? { key: quoteKey, pricing } : null)
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
  const billHandlingFee = q ? Number(q.handlingFee || 0) : fees.handlingFee
  const freeDelivery = q ? billDeliveryFee === 0 && fees.deliveryFee > 0 : estFreeDelivery
  const handlingCharge = subtotal > 0 ? Number((billDeliveryFee + billPlatformPackaging + billHandlingFee).toFixed(2)) : 0
  const cgst = q ? Number((Number(q.tax || 0) / 2).toFixed(2)) : estCgst
  const sgst = cgst
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

  const proceed = () => {
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
        <div className="px-4 pt-4 space-y-4">
          {/* When + Where: 2-column compact layout (Delivery left, Deliver To right, each 2 rows) */}
          <div className="rounded-2xl overflow-hidden border shadow-sm" style={{ backgroundColor: ui.card, borderColor: ui.line }}>
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
              {cartItems.map((item, index) => (
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
          <div className="-mx-5">
            <CartMealSuggestions dark={isDarkMode} cartIds={cartItems.map((i) => String(i.itemId))} />
          </div>

          {/* Savings & Rewards: coupons section matching Image 5 */}
          {couponsOn && (
            <CartOffers
              offers={offers}
              subtotal={subtotal}
              applied={appliedCoupon}
              rejectedReason={couponRejected}
              deliverySaved={deliverySaved}
              freeDelivery={freeDelivery}
              onApply={(offer) => {
                applyCoupon(offer)
                toast.success(`${offer.couponCode} applied! You save ₹${offerDiscount(offer, subtotal)}`)
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
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-base font-bold" style={{ color: ui.text }}>To Pay</p>
                  <button
                    onClick={() => setShowTaxDetails(!showTaxDetails)}
                    aria-expanded={showTaxDetails}
                    className="mt-0.5 text-xs bg-transparent border-0 p-0 cursor-pointer underline flex items-center"
                    style={{ color: ui.muted }}
                  >
                    {showTaxDetails ? "Hide details" : "View details"} {showTaxDetails ? <ChevronUp size={13} /> : <ChevronRight size={13} />}
                  </button>
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
                    <div className="mt-3 pt-3 space-y-2 text-sm" style={{ borderTop: `1px dashed ${ui.line}`, color: ui.muted }}>
                      <BillRow label={`Item total (${itemCount})`} value={`₹${subtotal}`} />
                      {discount > 0 && <BillRow label={`Coupon (${appliedCoupon.couponCode})`} value={`-₹${discount}`} positive />}
                      {isDelivery && fees.deliveryFee > 0 && (
                        <BillRow label="Delivery fee" value={freeDelivery ? <><span className="line-through mr-1.5" style={{ color: ui.muted }}>₹{fees.deliveryFee}</span><span className="text-emerald-600 font-semibold">FREE</span></> : `₹${billDeliveryFee}`} />
                      )}
                      {subtotal > 0 && billPlatformPackaging > 0 && <BillRow label="Platform & packaging" value={`₹${Number(billPlatformPackaging.toFixed(2))}`} />}
                      {subtotal > 0 && billHandlingFee > 0 && <BillRow label="Restaurant handling charges" value={`₹${billHandlingFee}`} />}
                      {(q ? cgst > 0 : fees.gstRate > 0) && <BillRow label={`CGST (${gstShare}%)`} value={`₹${cgst}`} />}
                      {(q ? sgst > 0 : fees.gstRate > 0) && <BillRow label={`SGST (${gstShare}%)`} value={`₹${sgst}`} />}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <p className="mt-3 px-1 text-[11px] leading-relaxed text-left" style={{ color: ui.muted }}>
              Review your order and address before paying. Orders can't be cancelled once the kitchen starts preparing them.
            </p>
          </div>
        </div>
      )}

      {/* Sticky pay bar */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-30" style={{ backgroundColor: ui.card, boxShadow: "0 -4px 20px rgba(0,0,0,0.12)" }}>
          {savings > 0 && (
            <motion.div
              key={`saved-${savings}`}
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-3 mt-3 rounded-xl px-3 py-2.5 flex items-center gap-2 text-sm text-left" style={{ backgroundColor: isDarkMode ? "rgba(27,138,58,0.18)" : "#e8f5ec", color: isDarkMode ? "#9be7b0" : "#1b5e30" }}>
              <Sparkles size={16} className="shrink-0" />
              <span>You saved <b>₹{savings}</b> on this order</span>
            </motion.div>
          )}
          <div className="flex items-center gap-3 px-3 py-3 pb-6">
            <div className="shrink-0 text-left pl-1">
              <p className="text-[17px] font-extrabold leading-tight" style={{ color: ui.text }}><AnimatedNumber value={total} /></p>
              <button onClick={viewBill} className="text-[11px] font-bold text-[#E53935] bg-transparent border-0 p-0 cursor-pointer">View detailed bill</button>
            </div>
            <button
              onClick={proceed}
              className="flex-1 h-12 rounded-xl text-white font-bold text-[15px] border-0 cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform"
              style={{ backgroundColor: "#d32f3a" }}
            >
              {scheduledAt ? "Schedule & Pay" : "Proceed to Pay"}
              <ChevronRight size={18} />
            </button>
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

      {/* All offers + coupon code */}
      <ApplyCoupon
        show={showCouponModal}
        onClose={() => setShowCouponModal(false)}
        offers={offers}
        subtotal={subtotal}
        appliedCode={appliedCoupon?.couponCode}
        onApply={(offer) => { applyCoupon(offer); toast.success(`${offer.couponCode} applied! You save ₹${offerDiscount(offer, subtotal)}`) }}
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
      />
      </div>
    </div>
  )
}
