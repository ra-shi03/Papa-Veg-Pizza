import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Tag, ChevronRight, ChevronUp, Plus, Sparkles } from "lucide-react"
import { useCart } from "@food/context/CartContext"
import { useAppConfig } from "@food/context/AppConfigContext"
import ApplyCoupon from "./ApplyCoupon"
import CheckoutModal from "./CheckoutModal"
import { CartMealSuggestions, LimitedOffer } from "./upsell/CartUpsell"
import { AnimatedNumber, CartItemRow, CartSkeleton, haptic } from "./CartParts"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { toast } from "sonner"
import { removeCartKey } from "./upsell/upsellApi"
import apiClient from "@/services/api/axios"
import { orderAPI } from "@food/api"

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
  const { replaceCart } = useCart()
  const { config: appConfig } = useAppConfig()

  // Checkout Modal State
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)

  // State Management
  const [cartItems, setCartItems] = useState([])
  const [cartLoaded, setCartLoaded] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const reduceMotion = useReducedMotion()
  const [orderTypeInfo, setOrderTypeInfo] = useState("Order for Today 11:30")
  const [showCouponModal, setShowCouponModal] = useState(false)
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [fees, setFees] = useState({ handlingFee: 0, platformFee: 0, packagingFee: 0, deliveryFee: 0, freeDeliveryUpTo: 0, freeDeliveryThreshold: 0, gstRate: 0 })
  useEffect(() => {
    apiClient.get("/food/fee-config").then((res) => {
      const f = res?.data?.data
      if (f) setFees((prev) => ({ ...prev, ...f }))
    }).catch(() => {})
  }, [])
  // The server prices the cart (store prices, fees, tax, coupon); this is what the customer is charged
  const [quote, setQuote] = useState(null)
  const quoteKey = JSON.stringify([
    cartItems.map((i) => [i.itemId || i.id, i.quantity, i.size, i.crust, i.toppings, i.meals, i.extraCheese, i.offerToken]),
    appliedCoupon?.code || "",
  ])
  useEffect(() => {
    if (cartItems.length === 0) {
      setQuote(null)
      return undefined
    }
    let cancelled = false
    setQuote(null)
    const timer = setTimeout(async () => {
      try {
        let coords = null
        try {
          const loc = JSON.parse(localStorage.getItem("userLocation") || "null")
          if (Number.isFinite(loc?.latitude) && Number.isFinite(loc?.longitude)) coords = loc
        } catch (_) {}
        const resolved = await apiClient.get("/food/stores/resolve", {
          params: coords ? { lat: coords.latitude, lng: coords.longitude } : {},
          _isFallback: true,
        })
        const store = resolved?.data?.data
        if (!store?.storeId) throw new Error("No store is available right now")
        const res = await orderAPI.calculateOrder({
          storeId: store.storeId,
          items: cartItems.map((item) => ({
            itemId: String(item.itemId || item.id),
            name: item.name,
            price: Number(item.price) || 0,
            quantity: item.quantity,
            size: item.size || "",
            kind: item.kind || "product",
            ...(item.crust ? { crust: item.crust } : {}),
            ...(item.toppings?.length ? { toppings: item.toppings } : {}),
            ...(item.meals?.length ? { meals: item.meals } : {}),
            ...(item.extraCheese ? { extraCheese: true } : {}),
            ...(item.offerToken ? { offerToken: item.offerToken } : {}),
          })),
          ...(coords ? { deliveryAddress: { location: { type: "Point", coordinates: [coords.longitude, coords.latitude] } } } : {}),
          ...(appliedCoupon?.code ? { couponCode: appliedCoupon.code } : {}),
        })
        const pricing = res?.data?.data?.pricing
        if (!cancelled && pricing) setQuote(pricing)
      } catch (err) {
        if (cancelled) return
        setQuote(null)
        toast.error(err?.response?.data?.error || err?.response?.data?.message || err?.message || "Could not get the order total from the server")
      }
    }, 300)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteKey])
  const [showTaxDetails, setShowTaxDetails] = useState(false)
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

  // Resolve active location / delivery slot
  useEffect(() => {
    const activeService = localStorage.getItem("activeService") || "delivery"
    if (activeService === "takeaway") {
      const hut = localStorage.getItem("takeawayHut") || "Nearest Outlet"
      setOrderTypeInfo(`Takeaway: ${hut}`)
    } else if (activeService === "incar") {
      const car = localStorage.getItem("carNumber") || "Vehicle Dining"
      setOrderTypeInfo(`In-Car Dining: ${car}`)
    } else {
      setOrderTypeInfo("Order for Today 11:30")
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

  // Removing a line offers an Undo for a few seconds instead of silently deleting it.
  const removeItem = (item) => {
    const stored = JSON.parse(localStorage.getItem("userCart") || "{}")
    const raw = stored[item.key]
    const qty = typeof raw === "object" && raw !== null ? Number(raw.quantity || 1) : Number(raw || item.quantity || 1)
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

    toast(`Removed ${item.name}`, {
      duration: 4000,
      action: {
        label: "Undo",
        onClick: () => {
          const current = JSON.parse(localStorage.getItem("userCart") || "{}")
          current[item.key] = qty
          localStorage.setItem("userCart", JSON.stringify(current))
          window.dispatchEvent(new Event("cartUpdated"))
        },
      },
    })
  }

  const changeQty = (item, delta) => {
    if (item.quantity + delta <= 0) removeItem(item)
    else updateItemQty(item.key, delta)
  }

  // Calculate pricing sums
  const estimatedSubtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

  let estimatedDiscount = 0
  if (appliedCoupon) {
    if (estimatedSubtotal >= appliedCoupon.minOrder) {
      estimatedDiscount = appliedCoupon.discount
    }
  }

  // Until the server answers (or if it cannot), the browser estimate is shown; the server quote replaces it
  const estFreeDelivery = (fees.freeDeliveryUpTo > 0 && estimatedSubtotal >= fees.freeDeliveryUpTo) || (fees.freeDeliveryThreshold > 0 && estimatedSubtotal >= fees.freeDeliveryThreshold)
  const estHandling = estimatedSubtotal > 0
    ? Number((fees.handlingFee + fees.platformFee + fees.packagingFee + (estFreeDelivery ? 0 : fees.deliveryFee)).toFixed(2))
    : 0
  const gstShare = fees.gstRate / 2
  const estTaxable = estimatedSubtotal - estimatedDiscount + (estimatedSubtotal > 0 ? fees.handlingFee : 0)
  const estCgst = estimatedSubtotal > 0 ? Number((estTaxable * gstShare / 100).toFixed(2)) : 0
  const estTotal = estimatedSubtotal > 0 ? Number((estimatedSubtotal - estimatedDiscount + estHandling + estCgst * 2).toFixed(2)) : 0

  const subtotal = quote ? Number(quote.subtotal) : estimatedSubtotal
  const discount = quote ? Number(quote.discount || 0) : estimatedDiscount
  const handlingCharge = quote
    ? Number((Number(quote.deliveryFee || 0) + Number(quote.platformFee || 0) + Number(quote.packagingFee || 0) + Number(quote.handlingFee || 0)).toFixed(2))
    : estHandling
  const cgst = quote ? Number((Number(quote.tax || 0) / 2).toFixed(2)) : estCgst
  const sgst = cgst
  const total = quote ? Number(quote.total) : estTotal
  const savings = Number(discount.toFixed(2))
  const beforeSavings = Number((total + savings).toFixed(2))

  const serviceKind = (typeof localStorage !== "undefined" && localStorage.getItem("activeService")) || "delivery"
  const deliveryAddressLabel = typeof localStorage !== "undefined" ? localStorage.getItem("deliveryAddress") || "" : ""
  const ui = {
    page: isDarkMode ? "#0e0e0f" : "#efeff1",
    card: isDarkMode ? "#1b1b1d" : "#ffffff",
    text: isDarkMode ? "#f4f4f5" : "#1c1b1b",
    muted: isDarkMode ? "#a1a1aa" : "#6b7280",
    line: isDarkMode ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)",
  }

  return (
    <div className={`min-h-screen flex justify-center transition-colors duration-300 ${isDarkMode ? "bg-[#0a0a0a]" : "bg-gray-100"}`}>
      <div className={`font-body-md text-body-md w-full max-w-md min-h-screen pb-44 flex flex-col relative shadow-2xl border-x ${
        isDarkMode ? "border-zinc-800/40" : "border-gray-200/50"
      }`} style={{ backgroundColor: isDarkMode ? "#0e0e0f" : "#efeff1", color: isDarkMode ? "#e5e2e1" : "#1c1b1b" }}>
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
      <header className="sticky top-0 z-20 w-full h-14 flex items-center justify-between px-4 transition-shadow duration-200" style={{ backgroundColor: ui.card, borderBottom: `1px solid ${ui.line}`, boxShadow: scrolled ? "0 4px 14px rgba(0,0,0,0.10)" : "none" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} aria-label="Back" className="p-1 bg-transparent border-0 cursor-pointer active:scale-95" style={{ color: ui.text }}>
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-lg font-bold" style={{ color: ui.text }}>Cart</h1>
        </div>
        {appConfig?.couponEnabled !== false && (
          <button
            onClick={() => !appliedCoupon && setShowCouponModal(true)}
            className="flex items-center gap-1.5 text-sm font-medium bg-transparent border-0 cursor-pointer"
            style={{ color: ui.muted }}
          >
            <Tag size={18} /> Coupons
          </button>
        )}
      </header>

      {!cartLoaded ? (
        <CartSkeleton ui={ui} />
      ) : cartItems.length === 0 ? null : (
        <div className="px-4 pt-4 space-y-4">
          {/* Deliver card */}
          <div className="rounded-2xl p-4 flex items-center gap-4" style={{ backgroundColor: ui.card }}>
            <div className="shrink-0 text-left pr-4" style={{ borderRight: `1px solid ${ui.line}` }}>
              <p className="text-[11px] font-semibold tracking-wide" style={{ color: ui.muted }}>
                {serviceKind === "delivery" ? "DELIVER" : serviceKind === "takeaway" ? "TAKEAWAY" : "IN-CAR"}
              </p>
              <p className="text-xl font-bold leading-tight" style={{ color: ui.text }}>
                {serviceKind === "delivery" ? `${appConfig?.estimatedDeliveryMinutes || 30} Mins` : "Pick up"}
              </p>
            </div>
            <div className="min-w-0 text-left">
              <p className="text-sm leading-snug line-clamp-2" style={{ color: ui.muted }}>
                {serviceKind === "delivery" ? (deliveryAddressLabel || "Add a delivery address at checkout") : orderTypeInfo}
              </p>
            </div>
          </div>

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
            <p className="px-4 pb-2 pt-0 text-[11px] text-left" style={{ color: ui.muted }}>Tip: swipe an item left to remove it</p>
            <button
              onClick={() => navigate("/user/menu")}
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

          {/* Savings & rewards */}
          <div className="pt-2">
            <SectionTitle ui={ui}>Savings &amp; Rewards</SectionTitle>
            <div className="mt-3 rounded-2xl p-4 text-left space-y-3" style={{ backgroundColor: ui.card }}>
              {appConfig?.couponEnabled !== false && (
                <div className="rounded-xl p-3 flex items-center justify-between gap-3" style={{ border: `1px dashed ${ui.line}` }}>
                  <div className="flex items-center gap-3 min-w-0">
                    <Tag size={20} className="shrink-0 text-[#E53935]" />
                    <div className="min-w-0">
                      {appliedCoupon ? (
                        <>
                          <p className="text-sm font-semibold" style={{ color: ui.text }}>{appliedCoupon.code} applied</p>
                          <p className="text-xs font-semibold text-emerald-600">₹{discount} saved on this order</p>
                        </>
                      ) : (
                        <p className="text-sm font-semibold" style={{ color: ui.text }}>Apply a coupon</p>
                      )}
                    </div>
                  </div>
                  {appliedCoupon ? (
                    <button onClick={() => setAppliedCoupon(null)} className="text-xs font-bold text-[#E53935] bg-transparent border-0 cursor-pointer">Remove</button>
                  ) : (
                    <button onClick={() => setShowCouponModal(true)} className="text-xs font-bold text-[#E53935] bg-transparent border-0 cursor-pointer flex items-center">View offers <ChevronRight size={14} /></button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Bill details */}
          <div className="pt-2 pb-4">
            <SectionTitle ui={ui}>Bill Details</SectionTitle>
            <div className="mt-3 rounded-2xl p-4 text-left" style={{ backgroundColor: ui.card }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-base font-bold" style={{ color: ui.text }}>To Pay</p>
                  <button
                    onClick={() => setShowTaxDetails(!showTaxDetails)}
                    className="mt-0.5 text-xs bg-transparent border-0 p-0 cursor-pointer underline flex items-center"
                    style={{ color: ui.muted }}
                  >
                    View Details {showTaxDetails ? <ChevronUp size={13} /> : <ChevronRight size={13} />}
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
                      <BillRow label="Item total" value={`₹${subtotal}`} />
                      {discount > 0 && <BillRow label="Coupon discount" value={`-₹${discount}`} positive />}
                      <BillRow label="Restaurant handling charges" value={`₹${handlingCharge}`} />
                      <BillRow label={`CGST (${gstShare}%)`} value={`₹${cgst}`} />
                      <BillRow label={`SGST (${gstShare}%)`} value={`₹${sgst}`} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
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
              <p className="text-[11px]" style={{ color: ui.muted }}>Prices are GST-inclusive</p>
              <p className="text-[11px]" style={{ color: ui.muted }}>Choose payment next</p>
            </div>
            <button
              onClick={() => { haptic(12); setShowCheckoutModal(true) }}
              className="flex-1 h-12 rounded-xl text-white font-bold text-[15px] border-0 cursor-pointer flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
              style={{ backgroundColor: "#d32f3a" }}
            >
              Pay <AnimatedNumber value={total} />
              {savings > 0 && <span className="text-sm font-medium line-through opacity-75">₹{beforeSavings}</span>}
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Coupon Modal Overlay */}
      <ApplyCoupon
        show={showCouponModal}
        onClose={() => setShowCouponModal(false)}
        onApply={(coupon) => { setAppliedCoupon(coupon); haptic(12); toast.success(`Coupon ${coupon.code} applied`) }}
        cartTotal={subtotal}
      />

      {/* Checkout Modal Overlay */}
      <CheckoutModal
        show={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        cartItems={cartItems}
        couponCode={appliedCoupon?.code}
        subtotal={subtotal}
        discount={discount}
        handlingCharge={handlingCharge}
        cgst={cgst}
        sgst={sgst}
        total={total}
      />
      </div>
    </div>
  )
}
