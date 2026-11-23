import { readSavedCoords } from "@food/utils/savedLocation"
import React, { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Mail,
  Phone,
  Calendar,
  Building,
  MapPin,
  Users,
  MessageSquare,
  CheckCircle2,
  Sparkles,
  PartyPopper,
  Pizza,
  Gift,
  CreditCard,
  ShoppingCart,
  Ticket,
  Lock,
  Smartphone,
  Check,
  HelpCircle,
  Wallet,
  Info,
  Facebook,
  Instagram,
  Twitter,
  ExternalLink,
  Search,
  X,
  Store,
  Bell,
  Menu
} from "lucide-react"
import BulkOrderForm from "./bulk/BulkOrderForm"
import MyBulkOrders from "./bulk/MyBulkOrders"
import AnimatedPage from "@food/components/user/AnimatedPage"
import { useProfile } from "@food/context/ProfileContext"
import { locationAPI } from "@/services/api/location"
import apiClient from "@/services/api/axios"
import useAppBackNavigation from "@food/hooks/useAppBackNavigation"
import { toast } from "sonner"
import logoImg from "@/assets/logo1.png"

const defaultRedeemSteps = [
  {
    stepNumber: 1,
    title: "Place Order",
    description: "Open Papa Veg Pizza App or visit papavegpizza.com. Add products to your cart and proceed to pay.",
    icon: "cart"
  },
  {
    stepNumber: 2,
    title: "Payment Method",
    description: "Change the Payment Mode to Gift Card / eVoucher option.",
    icon: "card"
  },
  {
    stepNumber: 3,
    title: "e-Voucher / Gift Card Number",
    description: "Enter your 16 digit eVoucher number and Submit.",
    icon: "ticket"
  },
  {
    stepNumber: 4,
    title: "Make Payment",
    description: "To pay the balance (if any) use cash or online payment modes.",
    icon: "wallet"
  },
  {
    stepNumber: 5,
    title: "Enter Pin",
    description: "Enter voucher PIN and Submit.",
    icon: "lock"
  },
  {
    stepNumber: 6,
    title: "Check Your Final Payment",
    description: "Review your order and click on Pay Now.",
    icon: "check"
  }
]

const renderRedeemIcon = (iconType, index, isLast) => {
  const iconProps = { className: "w-4 h-4" }
  if (isLast) {
    return (
      <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 z-10 shadow-xs">
        <Check className="w-4 h-4 stroke-[3]" />
      </div>
    )
  }

  const styles = [
    "bg-sky-50 dark:bg-sky-950/40 text-sky-600",
    "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600",
    "bg-amber-50 dark:bg-amber-950/40 text-amber-600",
    "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600",
    "bg-violet-50 dark:bg-violet-950/40 text-violet-600",
    "bg-rose-50 dark:bg-rose-950/40 text-rose-600"
  ]
  const colorStyle = styles[index % styles.length]

  let iconNode = <Check {...iconProps} />
  switch (iconType) {
    case "cart":
      iconNode = <ShoppingCart {...iconProps} />
      break
    case "card":
      iconNode = <CreditCard {...iconProps} />
      break
    case "ticket":
      iconNode = <Ticket {...iconProps} />
      break
    case "wallet":
      iconNode = <Wallet {...iconProps} />
      break
    case "lock":
      iconNode = <Lock {...iconProps} />
      break
    case "gift":
      iconNode = <Gift {...iconProps} />
      break
    case "info":
      iconNode = <Info {...iconProps} />
      break
    default:
      iconNode = <Check {...iconProps} />
  }

  return (
    <div className={`w-8 h-8 rounded-full ${colorStyle} flex items-center justify-center shrink-0 z-10 shadow-xs`}>
      {iconNode}
    </div>
  )
}

export default function BulkOrder() {
  const navigate = useNavigate()
  const goBack = useAppBackNavigation()

  // Navigation mode: 'inquiry' | 'contact'
  const [viewMode, setViewMode] = useState("inquiry")

  // Active tab state: 'virtual_party' | 'egift_voucher'
  const [activeTab, setActiveTab] = useState("virtual_party")

  // Dynamic configuration loaded from Superadmin
  const [config, setConfig] = useState({})

  // Form states for Virtual Party
  const [formDataVP, setFormDataVP] = useState({
    name: "",
    organisation: "",
    phone: "",
    email: "",
    location: "",
    eventDate: "",
    occasion: "",
    query: ""
  })

  // Form states for E-Gift Voucher
  const [formDataGV, setFormDataGV] = useState({
    name: "",
    organisation: "",
    phone: "",
    email: "",
    location: "",
    eventDate: "",
    occasion: "",
    query: ""
  })

  const [submitting, setSubmitting] = useState(false)
  const [submittedVP, setSubmittedVP] = useState(false)
  const [submittedGV, setSubmittedGV] = useState(false)
  const dateInputRef = useRef(null)

  // Customer city detection (1. Saved Customer City -> 2. Current GPS Location -> 3. Fallback)
  const profileContext = useProfile?.() || {}
  const { addresses = [], getDefaultAddress } = profileContext

  const [customerCity, setCustomerCity] = useState(() => {
    try {
      const savedUserLoc = localStorage.getItem("userLocation")
      if (savedUserLoc) {
        const parsed = JSON.parse(savedUserLoc)
        if (parsed?.city) return parsed.city
      }
      const savedDeliveryLoc = localStorage.getItem("deliveryLocation")
      if (savedDeliveryLoc) {
        const parsed = JSON.parse(savedDeliveryLoc)
        if (parsed?.selectedAddress?.city) return parsed.selectedAddress.city
      }
    } catch (_) {}
    return ""
  })

  useEffect(() => {
    let isMounted = true

    const resolveCustomerCity = async () => {
      // 1. Check if customer has a saved address in ProfileContext
      if (getDefaultAddress) {
        try {
          const defaultAddr = getDefaultAddress()
          if (defaultAddr?.city) {
            if (isMounted) setCustomerCity(defaultAddr.city)
            return
          }
        } catch (_) {}
      }
      if (Array.isArray(addresses) && addresses.length > 0) {
        const firstWithCity = addresses.find((a) => a?.city)
        if (firstWithCity?.city) {
          if (isMounted) setCustomerCity(firstWithCity.city)
          return
        }
      }

      // 2. Check localStorage for saved delivery / user location
      try {
        const savedUserLoc = localStorage.getItem("userLocation")
        if (savedUserLoc) {
          const parsed = JSON.parse(savedUserLoc)
          if (parsed?.city) {
            if (isMounted) setCustomerCity(parsed.city)
            return
          }
        }
        const savedDeliveryLoc = localStorage.getItem("deliveryLocation")
        if (savedDeliveryLoc) {
          const parsed = JSON.parse(savedDeliveryLoc)
          if (parsed?.selectedAddress?.city) {
            if (isMounted) setCustomerCity(parsed.selectedAddress.city)
            return
          }
        }
      } catch (_) {}

      // 3. If customer has NOT saved any city -> fetch city name from current location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            try {
              const { latitude, longitude } = pos.coords
              let detected = ""
              try {
                const res = await locationAPI.reverseGeocode(latitude, longitude)
                detected =
                  res?.city ||
                  res?.address?.city ||
                  res?.address?.town ||
                  res?.address?.village ||
                  res?.address?.state_district ||
                  res?.state ||
                  ""
              } catch (_) {
                const directRes = await fetch(
                  `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                )
                const directData = await directRes.json()
                detected =
                  directData?.address?.city ||
                  directData?.address?.town ||
                  directData?.address?.village ||
                  directData?.address?.state_district ||
                  directData?.address?.state ||
                  ""
              }
              if (detected && isMounted) {
                setCustomerCity(detected)
              }
            } catch (_) {}
          },
          () => {},
          { timeout: 8000, enableHighAccuracy: false }
        )
      }
    }

    resolveCustomerCity()

    return () => {
      isMounted = false
    }
  }, [addresses, getDefaultAddress])

  const mapSearchQuery = customerCity?.trim()
    ? `Papa Veg Pizza ${customerCity.trim()}`
    : "Papa Veg Pizza Rajasthan"
  const mapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(mapSearchQuery)}&t=&z=12&ie=UTF8&iwloc=&output=embed`
  const mapExternalUrl = `https://maps.google.com/?q=${encodeURIComponent(mapSearchQuery)}`

  // ── Nearest Outlet Finder State & Debounced Real Store Search ──
  const [showOutlets, setShowOutlets] = useState(false)
  const [storeSearch, setStoreSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [nearbyStores, setNearbyStores] = useState([])
  const [loadingStores, setLoadingStores] = useState(false)

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(storeSearch)
    }, 300)
    return () => clearTimeout(timer)
  }, [storeSearch])

  // Fetch real nearby stores from backend using customer coordinates and debounced query
  useEffect(() => {
    if (!showOutlets) return

    let isCancelled = false
    const fetchStores = async () => {
      setLoadingStores(true)
      try {
        // The customer's saved position, else live GPS; no invented default city.
        let lat = null
        let lng = null
        const saved = readSavedCoords()
        if (saved) { lat = saved.lat; lng = saved.lng }
        if (lat === null && navigator.geolocation) {
          await new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
              (pos) => { lat = pos.coords.latitude; lng = pos.coords.longitude; resolve() },
              () => resolve(),
              { timeout: 3000 }
            )
          })
        }
        if (lat === null || lng === null) {
          if (!isCancelled) setNearbyStores([])
          return
        }

        const res = await locationAPI.getNearbyStores(lat, lng, debouncedSearch)
        if (!isCancelled) {
          const storesList = res?.data?.data?.stores || []
          setNearbyStores(storesList)
        }
      } catch (err) {
        console.error("Failed to load nearby stores:", err)
      } finally {
        if (!isCancelled) {
          setLoadingStores(false)
        }
      }
    }

    fetchStores()

    return () => {
      isCancelled = true
    }
  }, [showOutlets, debouncedSearch])

  // Fetch dynamic config from backend/superadmin
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await apiClient.get("/food/bulk-order/config")
        const data = res?.data?.data || res?.data
        if (data) {
          setConfig(prev => ({
            ...prev,
            ...data,
            virtualParty: {
              ...prev.virtualParty,
              ...(data.virtualParty || {})
            },
            egiftVoucher: {
              ...prev.egiftVoucher,
              ...(data.egiftVoucher || {})
            },
            contactPage: {
              ...prev.contactPage,
              ...(data.contactPage || {})
            }
          }))
        }
      } catch (_) {}
    }
    fetchConfig()

    // Pre-fill user details if logged in
    try {
      const stored = localStorage.getItem("currentUser") || localStorage.getItem("user_user")
      if (stored) {
        const u = JSON.parse(stored)
        const phone = (u.phone || u.mobile || "").replace(/\D/g, "").slice(-10)
        const name = u.name || u.fullName || ""
        const email = u.email || ""

        setFormDataVP(prev => ({ ...prev, name: name || prev.name, phone: phone || prev.phone, email: email || prev.email }))
        setFormDataGV(prev => ({ ...prev, name: name || prev.name, phone: phone || prev.phone, email: email || prev.email }))
      }
    } catch (_) {}
  }, [])

  const currentForm = activeTab === "virtual_party" ? formDataVP : formDataGV
  const setCurrentForm = activeTab === "virtual_party" ? setFormDataVP : setFormDataGV
  const isSubmitted = activeTab === "virtual_party" ? submittedVP : submittedGV
  const setIsSubmitted = activeTab === "virtual_party" ? setSubmittedVP : setSubmittedGV

  const handleFieldChange = (field, val) => {
    setCurrentForm(prev => ({ ...prev, [field]: val }))
  }

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault()

    if (!currentForm.name.trim()) {
      toast.error("Please enter your name")
      return
    }
    const cleanPhone = currentForm.phone.replace(/\D/g, "")
    if (!cleanPhone || cleanPhone.length < 10) {
      toast.error("Please enter a valid 10-digit contact number")
      return
    }
    if (!currentForm.email.trim() || !currentForm.email.includes("@")) {
      toast.error("Please enter a valid email address")
      return
    }

    setSubmitting(true)
    try {
      await apiClient.post("/food/bulk-order/inquiry", {
        name: currentForm.name.trim(),
        organisation: currentForm.organisation.trim(),
        phone: cleanPhone,
        email: currentForm.email.trim(),
        location: currentForm.location.trim(),
        eventDate: currentForm.eventDate || "",
        occasion: currentForm.eventDate || currentForm.occasion || "",
        query: currentForm.query.trim(),
        type: activeTab
      })

      setIsSubmitted(true)
      toast.success("Inquiry submitted! Our corporate desk will contact you shortly.")
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to submit inquiry. Please try again."
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const scrollToSection = (id) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  const vp = config.virtualParty || {}
  const gv = config.egiftVoucher || {}
  const cp = config.contactPage || {}

  const partyOptions = vp.partySizeOptions || [
    "Corporate Gathering (20-50 people)",
    "Team Celebration (50-100 people)",
    "Virtual Annual Meet (100+ people)",
    "Family & Birthday Celebration",
    "Other"
  ]

  const voucherOptions = gv.denominationOptions || [
    "25 - 50 Vouchers",
    "50 - 100 Vouchers",
    "100 - 500 Vouchers",
    "500+ Corporate Vouchers",
    "Custom Bulk Denomination"
  ]

  return (
    <AnimatedPage className="min-h-screen bg-white dark:bg-black font-sans pb-16 overflow-x-hidden">
      {/* ── Sticky Header Wrapper (Sticks as user scrolls) ── */}
      <div className="sticky top-0 z-40 bg-white dark:bg-zinc-900 shadow-xs">
        {/* ── Top App Bar ── */}
        <header className="border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 flex items-center">
          <button
            type="button"
            onClick={() => {
              if (showOutlets) {
                setShowOutlets(false)
              } else {
                goBack()
              }
            }}
            className="p-1.5 -ml-1.5 text-zinc-800 dark:text-zinc-200 hover:text-[#E53935] hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors cursor-pointer border-0 bg-transparent flex items-center justify-center"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>
          <h1 className="ml-3 text-lg font-bold text-zinc-900 dark:text-white tracking-tight m-0">
            Bulk Order
          </h1>
        </header>

        {/* ── Brand + section tabs (tabs get their own full-width row so nothing crowds or overflows on a phone) ── */}
        <div className="border-b border-zinc-200/80 dark:border-zinc-800">
          <div className="px-4 pt-2.5 pb-1.5 flex items-center justify-center gap-2 min-w-0">
            <img
              src={logoImg}
              alt="Papa Veg Pizza"
              className="w-7 h-7 object-contain shrink-0"
              onError={(e) => {
                e.target.style.display = "none"
              }}
            />
            <span className="text-base font-extrabold text-[#E53935] tracking-tight truncate">Papa Veg Pizza</span>
          </div>
          <nav className="grid grid-cols-3" aria-label="Bulk order sections">
            {[["inquiry", "Order"], ["orders", "My Orders"], ["contact", "Contact"]].map(([mode, text]) => (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  setViewMode(mode)
                  setShowOutlets(false)
                  window.scrollTo({ top: 0, behavior: "smooth" })
                }}
                className={`py-2.5 text-center uppercase tracking-wider text-[11px] font-bold bg-transparent border-0 border-b-2 cursor-pointer transition-colors ${
                  viewMode === mode
                    ? "text-[#E53935] border-[#E53935] font-extrabold"
                    : "text-zinc-500 border-transparent hover:text-[#E53935]"
                }`}
              >
                {text}
              </button>
            ))}
          </nav>
        </div>

        {/* ── Tab Switcher: VIRTUAL PIZZA PARTY / E-GIFT VOUCHER (Inquiry View Only) ── */}
        {viewMode === "inquiry" && (
          <div className="bg-[#E53935] dark:bg-zinc-900 grid grid-cols-2 text-center text-xs font-bold uppercase tracking-wider shadow-inner">
            <button
              type="button"
              onClick={() => setActiveTab("virtual_party")}
              className={`py-3 transition-colors cursor-pointer border-0 font-extrabold ${
                activeTab === "virtual_party"
                  ? "bg-[#b71c1c] text-white border-b-2 border-white shadow-xs"
                  : "text-red-100/90 hover:text-white hover:bg-black/10 bg-transparent font-bold"
              }`}
            >
              Virtual Pizza Party
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("egift_voucher")}
              className={`py-3 transition-colors cursor-pointer border-0 font-extrabold ${
                activeTab === "egift_voucher"
                  ? "bg-[#b71c1c] text-white border-b-2 border-white shadow-xs"
                  : "text-red-100/90 hover:text-white hover:bg-black/10 bg-transparent font-bold"
              }`}
            >
              E-Gift Voucher
            </button>
          </div>
        )}
      </div>

      {/* ── Main Tab Content ── */}
      <main className="max-w-xl mx-auto px-4 py-5 space-y-6">
        {viewMode === "contact" ? (
          /* ── CONTACT PAGE VIEW (Dynamic from Superadmin, Styled in Project Theme) ── */
          showOutlets ? (
            /* ── NEAREST OUTLETS VIEW (Matching Image 1 with Debounced Real Store Search) ── */
            <div className="space-y-4">
              {/* Back to Contact Info button & Location indicator */}
              <div className="flex items-center justify-between pb-1">
                <button
                  type="button"
                  onClick={() => setShowOutlets(false)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-[#E53935] bg-transparent border-0 cursor-pointer p-0 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5 stroke-[2.2]" />
                  <span>Back to Contact Info</span>
                </button>
                {customerCity && (
                  <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#E53935]" />
                    Near {customerCity}
                  </span>
                )}
              </div>

              {/* Search Bar matching Image 1 with real-time debouncing */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={storeSearch}
                  onChange={(e) => setStoreSearch(e.target.value)}
                  placeholder="Search store"
                  className="w-full pl-10 pr-9 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs sm:text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none focus:border-[#E53935] focus:ring-1 focus:ring-[#E53935] shadow-2xs transition-all"
                />
                {storeSearch && (
                  <button
                    type="button"
                    onClick={() => setStoreSearch("")}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 bg-transparent border-0 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Outlets Listing */}
              {loadingStores ? (
                <div className="space-y-4 py-2">
                  {[1, 2].map((k) => (
                    <div
                      key={k}
                      className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 space-y-4 animate-pulse"
                    >
                      <div className="flex gap-3.5">
                        <div className="w-20 h-20 bg-zinc-200 dark:bg-zinc-800 rounded-lg shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded-sm w-1/3" />
                          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-sm w-3/4" />
                          <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded-sm w-full" />
                          <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded-sm w-1/4" />
                        </div>
                      </div>
                      <div className="h-8 bg-zinc-100 dark:bg-zinc-800/60 rounded-sm" />
                    </div>
                  ))}
                </div>
              ) : nearbyStores.length > 0 ? (
                <div className="space-y-4">
                  {nearbyStores.map((store) => (
                    <div
                      key={store._id}
                      className="bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-lg shadow-2xs overflow-hidden transition-all hover:border-zinc-300 dark:hover:border-zinc-700"
                    >
                      {/* Top Section */}
                      <div className="p-4 flex gap-3.5 items-start">
                        {/* Store Thumbnail */}
                        <img
                          src={
                            store.profileImage ||
                            store.coverImages?.[0] ||
                            "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=300&q=80"
                          }
                          alt={store.storeName}
                          className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg object-cover shrink-0 border border-zinc-100 dark:border-zinc-800"
                          onError={(e) => {
                            e.target.src =
                              "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=300&q=80"
                          }}
                        />

                        {/* Store Info */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <h4 className="text-xs sm:text-sm font-extrabold text-[#E53935] tracking-tight uppercase m-0">
                            Papa Veg Pizza
                          </h4>
                          <h3 className="text-xs sm:text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tight m-0 leading-tight">
                            {store.storeName || `${store.area || store.city}, ${store.city}`}
                          </h3>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 uppercase leading-snug m-0 line-clamp-2">
                            {store.address || "Main Street"}
                            {store.city ? `, ${store.city}` : ""}
                            {store.pincode ? ` - ${store.pincode}` : ""}
                            {store.phone ? `. PH NO - ${store.phone}` : ""}
                          </p>
                          <div className="pt-0.5">
                            <span className="text-[11px] font-bold text-[#E53935]">
                              {store.distanceKm !== null && store.distanceKm !== undefined
                                ? `${store.distanceKm} km away • `
                                : ""}
                              {store.estimatedTime || "20 mins delivery"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Hours Row */}
                      <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-800/40 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                          HOURS:
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                            {store.openingHours || "10:55 AM to 11:59 PM"}
                          </span>
                          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            Open Now
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons Row */}
                      <div className="grid grid-cols-3 border-t border-zinc-200/80 dark:border-zinc-800 text-xs font-bold divide-x divide-zinc-200/80 dark:divide-zinc-800">
                        {/* Call */}
                        <a
                          href={(store.phone || cp.customerCareNumber) ? `tel:${(store.phone || cp.customerCareNumber).replace(/\s+/g, "")}` : undefined}
                          className="py-2.5 px-2 flex items-center justify-center gap-1.5 text-zinc-700 dark:text-zinc-300 hover:text-[#E53935] hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors no-underline"
                        >
                          <Phone className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
                          <span>Call</span>
                        </a>

                        {/* View Menu */}
                        <button
                          type="button"
                          onClick={() => {
                            try {
                              localStorage.setItem("selectedStoreId", store._id)
                            } catch (_) {}
                            navigate(`/food/user/menu?storeId=${store._id}`)
                          }}
                          className="py-2.5 px-2 flex items-center justify-center gap-1.5 text-zinc-700 dark:text-zinc-300 hover:text-[#E53935] hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors bg-transparent border-0 cursor-pointer font-bold text-xs"
                        >
                          <Menu className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
                          <span>View Menu</span>
                        </button>

                        {/* Order Now */}
                        <button
                          type="button"
                          onClick={() => {
                            try {
                              localStorage.setItem("selectedStoreId", store._id)
                            } catch (_) {}
                            navigate(`/food/user/menu?storeId=${store._id}`)
                          }}
                          className="py-2.5 px-2 flex items-center justify-center gap-1.5 bg-[#E53935] hover:bg-[#D32F2F] text-white transition-colors border-0 cursor-pointer font-bold text-xs shadow-xs"
                        >
                          <Bell className="w-3.5 h-3.5 fill-current" />
                          <span>Order Now</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 px-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg space-y-3">
                  <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/40 text-[#E53935] flex items-center justify-center mx-auto">
                    <Store className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white m-0">
                    No Outlets Found Nearby
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto m-0 leading-relaxed">
                    {storeSearch
                      ? `We couldn't find any outlets matching "${storeSearch}". Try searching for another area or city.`
                      : "We couldn't find any outlets near your location. Try searching for your city or area in the search bar above."}
                  </p>
                  {storeSearch && (
                    <button
                      type="button"
                      onClick={() => setStoreSearch("")}
                      className="text-xs font-bold text-[#E53935] hover:underline bg-transparent border-0 cursor-pointer pt-1"
                    >
                      Clear search
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* 1. Help card: feedback, email and the nearest outlet */}
              <section className="rounded-2xl overflow-hidden bg-gradient-to-br from-[#b71c1c] via-[#c62828] to-[#E53935] text-white p-5 shadow-md shadow-red-500/20 space-y-4">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest bg-white/20 px-2.5 py-0.5 rounded-full inline-block">We're here to help</span>
                  <p className="text-sm font-medium m-0 leading-relaxed text-white/95">
                    {cp.feedbackHeading || "Have any feedback or queries? We'd love to hear from you. Write to us at"}
                  </p>
                  {cp.feedbackEmail && (
                    <a href={`mailto:${cp.feedbackEmail}`} className="text-base font-bold text-white underline underline-offset-2 break-all">{cp.feedbackEmail}</a>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => { setShowOutlets(true); window.scrollTo({ top: 0, behavior: "smooth" }) }}
                  className="w-full h-12 px-4 bg-white text-[#E53935] active:scale-[0.99] font-extrabold text-xs tracking-wider uppercase rounded-xl transition-all shadow-sm cursor-pointer border-0 flex items-center justify-center gap-2"
                >
                  <MapPin className="w-4 h-4" />
                  <span>{cp.outletButtonText || "FIND YOUR NEAREST OUTLET"}</span>
                </button>
                <p className="text-xs text-white/85 m-0 leading-relaxed">
                  {cp.outletHelpText || "Try our delicious treats and satisfy hunger with Papa Veg Pizza."}{" "}
                  <button type="button" onClick={() => { setShowOutlets(true); window.scrollTo({ top: 0, behavior: "smooth" }) }} className="font-bold text-white underline bg-transparent border-0 p-0 inline cursor-pointer text-xs">
                    {cp.locateLinkText || "Locate Nearby Pizza Stores"}
                  </button>{" "}
                  nearest to you.
                </p>
              </section>

              {/* 2. Quick contact: call and write */}
              {(cp.customerCareNumber || cp.feedbackEmail) && (
                <section className="space-y-2">
                  <h2 className="text-sm font-bold text-zinc-900 dark:text-white m-0 tracking-tight">{cp.customerCareTitle || "Papa Veg Pizza Customer Care"}</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {cp.customerCareNumber && (
                      <a href={`tel:${cp.customerCareNumber.replace(/\s+/g, "")}`} className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-3.5 flex flex-col gap-2 no-underline shadow-sm active:scale-[0.98] transition-transform min-w-0">
                        <span className="w-9 h-9 rounded-full bg-red-50 dark:bg-red-950/40 text-[#E53935] flex items-center justify-center"><Phone className="w-4 h-4" /></span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Call us</span>
                        <span className="text-sm font-extrabold text-zinc-900 dark:text-white break-words">{cp.customerCareNumber}</span>
                      </a>
                    )}
                    {cp.feedbackEmail && (
                      <a href={`mailto:${cp.feedbackEmail}`} className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-3.5 flex flex-col gap-2 no-underline shadow-sm active:scale-[0.98] transition-transform min-w-0">
                        <span className="w-9 h-9 rounded-full bg-red-50 dark:bg-red-950/40 text-[#E53935] flex items-center justify-center"><Mail className="w-4 h-4" /></span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Write to us</span>
                        <span className="text-sm font-extrabold text-zinc-900 dark:text-white break-all">{cp.feedbackEmail}</span>
                      </a>
                    )}
                  </div>
                </section>
              )}

              {/* 3. Corporate office */}
              {(cp.companyName || cp.addressLine1 || cp.addressLine2) && (
                <section className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-4 shadow-sm flex gap-3">
                  <span className="w-9 h-9 shrink-0 rounded-full bg-red-50 dark:bg-red-950/40 text-[#E53935] flex items-center justify-center"><Building className="w-4 h-4" /></span>
                  <div className="min-w-0 space-y-1">
                    <h2 className="text-sm font-bold text-zinc-900 dark:text-white m-0 tracking-tight">{cp.corporateOfficeTitle || "Papa Veg Pizza Corporate Office"}</h2>
                    <div className="text-xs text-zinc-600 dark:text-zinc-400 space-y-0.5 leading-relaxed">
                      {cp.companyName && <p className="font-semibold text-zinc-800 dark:text-zinc-200 m-0">{cp.companyName}</p>}
                      {cp.addressLine1 && <p className="m-0">{cp.addressLine1}</p>}
                      {cp.addressLine2 && <p className="m-0">{cp.addressLine2}</p>}
                    </div>
                  </div>
                </section>
              )}

              {/* 4. Map */}
              <section className="rounded-2xl overflow-hidden border border-zinc-200/80 dark:border-zinc-800 shadow-sm relative bg-zinc-100 dark:bg-zinc-800">
                <div className="relative h-56 w-full">
                  <iframe title="Corporate Office Location" src={mapEmbedUrl} className="w-full h-full border-0" loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade" />
                  <a href={mapExternalUrl} target="_blank" rel="noopener noreferrer" className="absolute top-3 left-3 bg-white/95 text-zinc-800 hover:text-[#E53935] px-3 py-1.5 rounded-lg text-xs font-bold shadow-md border border-zinc-200 inline-flex items-center gap-1.5 no-underline">
                    <span>Open in Maps</span>
                    <ExternalLink className="w-3.5 h-3.5 text-[#E53935]" />
                  </a>
                </div>
              </section>

              {/* 5. Social channels: one compact row of icons */}
              {(cp.facebookUrl || cp.googleUrl || cp.instagramUrl || cp.twitterUrl) && (
                <section className="rounded-2xl bg-gradient-to-b from-zinc-900 to-zinc-950 text-white p-5 text-center space-y-4 shadow-md">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#ff6b67] bg-red-950/50 border border-red-800/40 px-2.5 py-0.5 rounded-full inline-block">Stay in touch</span>
                    <h3 className="text-sm font-bold text-zinc-200 m-0">Official Papa Veg Pizza Channels</h3>
                  </div>
                  <div className="flex items-start justify-center gap-5">
                    {[
                      [cp.facebookUrl, cp.facebookText || "Facebook", "Facebook", <Facebook key="f" className="w-5 h-5 fill-current" />, "bg-[#1877F2]/20 border-[#1877F2]/40 text-[#4c9bff]"],
                      [cp.googleUrl, cp.googleText || "Google", "Google", <span key="g" className="text-sm font-black font-sans">g+</span>, "bg-[#EA4335]/20 border-[#EA4335]/40 text-[#ff7b6f]"],
                      [cp.instagramUrl, cp.instagramText || "Instagram", "Instagram", <Instagram key="i" className="w-5 h-5" />, "bg-rose-500/20 border-rose-500/40 text-rose-300"],
                      [cp.twitterUrl, cp.twitterText || "Twitter", "Twitter", <Twitter key="t" className="w-5 h-5 fill-current" />, "bg-[#1DA1F2]/20 border-[#1DA1F2]/40 text-[#5cc0ff]"],
                    ].filter(([url]) => url).map(([url, label, short, icon, cls]) => (
                      <a key={short} href={url} target="_blank" rel="noopener noreferrer" aria-label={label} title={label} className="flex flex-col items-center gap-1.5 no-underline active:scale-95 transition-transform">
                        <span className={`w-12 h-12 rounded-full border flex items-center justify-center ${cls}`}>{icon}</span>
                        <span className="text-[11px] font-semibold text-zinc-300">{short}</span>
                      </a>
                    ))}
                  </div>
                </section>
              )}
          </div>
        )
      ) : viewMode === "orders" ? (
          <MyBulkOrders />
      ) : (
          /* ── INQUIRY PAGE VIEW (Virtual Party / E-Gift Voucher) ── */
          <>
            {/* ── Request form: Virtual Party (choose a store, takeaway or delivery) / E-Gift Voucher ── */}
            <section id="inquiry-form" className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200/80 dark:border-zinc-800 p-5 sm:p-6">
              <div className="mb-5">
                <h2 className="text-xl font-extrabold text-zinc-900 dark:text-white m-0 tracking-tight">
                  {activeTab === "virtual_party" ? "Place a bulk order" : "E-Gift Voucher inquiry"}
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 m-0">
                  {activeTab === "virtual_party"
                    ? "Pick a store near you, tell us what you need, and the store will confirm."
                    : "Tell us how many vouchers you need and our corporate desk will get in touch."}
                </p>
              </div>
              <BulkOrderForm
                key={activeTab}
                type={activeTab}
                partyOptions={partyOptions}
                voucherOptions={voucherOptions}
                contactPhone={cp.customerCareNumber}
                onTrack={() => {
                  setViewMode("orders")
                  window.scrollTo({ top: 0, behavior: "smooth" })
                }}
              />
            </section>

        {activeTab === "virtual_party" ? (
          /* ════════════════════════════════════════════════════════════
             TAB 1: VIRTUAL PIZZA PARTY CONTENT
             ════════════════════════════════════════════════════════════ */
          <div className="space-y-6">
            {/* Graphic Banner */}
            <section className="rounded-none overflow-hidden border border-zinc-200/80 dark:border-zinc-800 shadow-sm relative group bg-gradient-to-r from-[#b71c1c] via-[#c62828] to-[#E53935] text-white">
              <div className="p-6 sm:p-8 relative z-10 flex flex-col justify-center">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#E53935] bg-white/90 px-2.5 py-0.5 rounded-full inline-block w-fit mb-2">
                  Papa Veg Pizza
                </span>
                <h3 className="text-2xl sm:text-3xl font-black italic tracking-tight m-0 text-white drop-shadow-sm">
                  VIRTUAL Party
                </h3>
                <p className="text-xs text-zinc-200 mt-2 max-w-xs leading-relaxed">
                  Celebrate together with delicious hot vegetarian pizzas delivered across your team!
                </p>
              </div>
              <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-60 sm:opacity-90 overflow-hidden pointer-events-none">
                <img
                  src={vp.bannerImage || "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80"}
                  alt="Virtual Party"
                  className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-700"
                />
              </div>
            </section>

            {/* Section 1: WORK TOGETHER, EAT TOGETHER */}
            <section className="text-center pt-2">
              <h2 className="text-lg sm:text-xl font-semibold text-zinc-900 dark:text-white uppercase tracking-tight mb-3">
                {vp.title1 || "WORK TOGETHER, EAT TOGETHER"}
              </h2>
              <p className="text-xs sm:text-[13px] text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-md mx-auto mb-5">
                {vp.description1 || "As virtual parties have become the new way to bond and enjoy together, it's time to up these unique celebrations with a unique feast."}
              </p>

              <div className="bg-gradient-to-r from-[#b71c1c] to-[#E53935] dark:bg-zinc-800 rounded-none p-4 sm:p-5 text-white text-left relative overflow-hidden shadow-xs">
                <div className="relative z-10">
                  <p className="text-xs sm:text-[13px] font-semibold leading-relaxed m-0 text-zinc-100">
                    {vp.calloutText || "Introducing Papa Veg Pizza's Virtual Feast, a new way to place a bulk order for your virtual celebration and get it delivered in specially designed packages."}
                  </p>
                </div>
              </div>
            </section>

            {/* Section 2: CELEBRATIONS MADE EASY */}
            <section className="text-center pt-3">
              <h2 className="text-lg sm:text-xl font-semibold text-zinc-900 dark:text-white uppercase tracking-tight mb-3">
                {vp.title2 || "CELEBRATIONS MADE EASY"}
              </h2>
              <p className="text-xs sm:text-[13px] text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-md mx-auto mb-5">
                {vp.description2 || "Convert your work from home into party from home with Papa Veg Pizza's Virtual Feast. Order some good old favourites from Papa Veg Pizza and celebrate with your colleagues in a new and safer way."}
              </p>

              {/* Shared Laptop Party Photo */}
              <div className="rounded-none overflow-hidden max-w-md mx-auto">
                <img
                  src={vp.featureImage || "https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?auto=format&fit=crop&w=1000&q=80"}
                  alt="Celebration"
                  className="w-full h-48 sm:h-56 object-cover"
                />
              </div>
            </section>
          </div>
        ) : (
          /* ════════════════════════════════════════════════════════════
             TAB 2: E-GIFT VOUCHER CONTENT (Matching 4 Shared Images)
             ════════════════════════════════════════════════════════════ */
          <div className="space-y-6">
            {/* E-Gift Voucher Graphic Banner (Matching Image 2) */}
            <section className="rounded-none overflow-hidden border border-zinc-200/80 dark:border-zinc-800 shadow-sm relative group bg-gradient-to-r from-[#b71c1c] via-[#c62828] to-[#E53935] text-white">
              <div className="p-6 sm:p-8 relative z-10 flex flex-col justify-center">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#E53935] bg-white px-2.5 py-0.5 rounded-full inline-block w-fit mb-2 shadow-xs">
                  Papa Veg Pizza
                </span>
                <h3 className="text-2xl sm:text-3xl font-black italic tracking-tight m-0 text-white drop-shadow-sm">
                  E-GIFT VOUCHER
                </h3>
                <p className="text-xs text-zinc-100 font-semibold mt-1 uppercase tracking-wider">
                  Vouchers That Bring Delight
                </p>
                <p className="text-[11px] text-zinc-200 mt-2 max-w-xs leading-relaxed">
                  Let your loved ones & team enjoy the goodness of Papa Veg Pizza. Give them an e-voucher today!
                </p>
              </div>
              <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-60 sm:opacity-85 overflow-hidden pointer-events-none">
                <img
                  src={gv.bannerImage || "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=1200&q=80"}
                  alt="E-Gift Voucher"
                  className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-700"
                />
              </div>
            </section>

            {/* Launch Your Gifting With Us Now (Matching Image 2) */}
            <section className="pt-2">
              <div className="text-center sm:text-left">
                <h2 className="text-lg sm:text-xl font-semibold text-zinc-900 dark:text-white uppercase tracking-tight mb-3">
                  {gv.heading1 || "LAUNCH YOUR GIFTING WITH US NOW"}
                </h2>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-5">
                  {gv.subheading1 || "Get access to place order across Papa Veg Pizza stores in India via our app/website using E-Gift Voucher"}
                </p>
              </div>

              {/* 3 Features List */}
              <div className="pt-2 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-950/40 text-[#E53935] flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white m-0">
                      {gv.feature1Title || "Easy and secure ordering"}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 m-0 leading-relaxed">
                      {gv.feature1Desc || "Place your E-Gift Voucher order with ease."}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-950/40 text-[#E53935] flex items-center justify-center shrink-0 mt-0.5">
                    <Gift className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white m-0">
                      {gv.feature2Title || "Customized to meet business needs"}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 m-0 leading-relaxed">
                      {gv.feature2Desc || "Instant digital incentive with the flexibility of choosing the denominations."}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-950/40 text-[#E53935] flex items-center justify-center shrink-0 mt-0.5">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white m-0">
                      {gv.feature3Title || "Flexible delivery option"}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 m-0 leading-relaxed">
                      {gv.feature3Desc || "Get your code delivered as an E-Gift card via e-mail."}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Small Gestures Go A Long Way (Matching Image 3) */}
            <section className="text-center pt-2">
              <div className="bg-zinc-100 dark:bg-zinc-800/60 rounded-none p-5 text-left mb-5">
                <h3 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-white uppercase tracking-tight mb-3">
                  {gv.heading2 || "SMALL GESTURES GO A LONG WAY"}
                </h3>
                <p className="text-xs sm:text-[13px] text-zinc-600 dark:text-zinc-400 leading-relaxed m-0">
                  {gv.description2 || "Ultimate gifting for corporate and businesses. The Papa Veg Pizza's E-Gift Voucher is a great solution when it comes to rewarding and recognizing employees, customers and supporters with a sophisticated gifting platform."}
                </p>
              </div>

              {/* Shared Celebration / Laptop Photo (as requested) */}
              <div className="rounded-none overflow-hidden max-w-md mx-auto">
                <img
                  src={gv.featureImage || "https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?auto=format&fit=crop&w=1000&q=80"}
                  alt="Team Gifting Celebration"
                  className="w-full h-48 sm:h-56 object-cover"
                />
              </div>
            </section>

            {/* HOW TO REDEEM Vertical Timeline (Dynamic from CMS) */}
            <section className="space-y-5 pt-3">
              <div className="text-center">
                <h2 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-white uppercase tracking-wider m-0">
                  {gv.redeemHeading || "HOW TO REDEEM"}
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 m-0">
                  {gv.redeemSubheading || "Redeem only on Papa Veg Pizza App and Website"}
                </p>
              </div>

              {/* Dynamic Step Progression Timeline */}
              <div className="space-y-6 pt-2">
                {(gv.redeemSteps && gv.redeemSteps.length > 0 ? gv.redeemSteps : defaultRedeemSteps).map((step, idx, arr) => {
                  const isLast = idx === arr.length - 1
                  return (
                    <div key={idx} className="flex items-start gap-3.5 relative">
                      {!isLast && (
                        <div className="absolute left-4 top-8 bottom-0 w-[2px] bg-zinc-200 dark:bg-zinc-800 -mb-6" />
                      )}
                      {renderRedeemIcon(step.icon, idx, isLast)}
                      <div className="pt-0.5">
                        <p className="text-xs font-bold text-zinc-900 dark:text-white m-0">
                          {step.title}
                        </p>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed m-0">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          </div>
        )}

        {/* ── Section: FEEL FREE TO WRITE TO US AT (Same on both tabs as requested) ── */}
        <section id="contact-section" className="text-center space-y-3 py-5">
          <h2 className="text-lg sm:text-xl font-semibold text-zinc-900 dark:text-white uppercase tracking-wider m-0">
            Feel Free to Write to Us At
          </h2>

          <div className="space-y-2">
            {(activeTab === "virtual_party" ? vp.corporateEmail : gv.corporateEmail) && (
            <a
              href={`mailto:${activeTab === "virtual_party" ? vp.corporateEmail : gv.corporateEmail}`}
              className="text-xs sm:text-sm font-bold text-[#E53935] hover:underline inline-flex items-center gap-1.5 justify-center"
            >
              <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>{activeTab === "virtual_party" ? vp.corporateEmail : gv.corporateEmail}</span>
            </a>
          )}
          </div>
        </section>

        {/* ── Explore Menu Button ── */}
        <div className="pt-2 pb-6 flex justify-center">
          <button
            type="button"
            onClick={() => navigate("/food/user/menu")}
            className="w-full max-w-md py-3.5 px-6 bg-[#E53935] hover:bg-[#D32F2F] active:scale-[0.99] text-white font-bold text-sm tracking-wider uppercase rounded-none transition-all shadow-md shadow-red-500/20 cursor-pointer border-0 flex items-center justify-center gap-2"
          >
            <span>Explore Menu</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </>
    )}
      </main>
    </AnimatedPage>
  )
}
