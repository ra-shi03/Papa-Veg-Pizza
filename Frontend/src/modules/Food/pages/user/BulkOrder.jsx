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
  const [config, setConfig] = useState({
    virtualParty: {
      isActive: true,
      title: "Virtual Pizza Party",
      bannerImage: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80",
      title1: "WORK TOGETHER, EAT TOGETHER",
      description1: "As virtual parties have become the new way to bond and enjoy together, it's time to up these unique celebrations with a unique feast.",
      calloutText: "Introducing Papa Veg Pizza's Virtual Feast, a new way to place a bulk order for your virtual celebration and get it delivered in specially designed packages.",
      title2: "CELEBRATIONS MADE EASY",
      description2: "Convert your work from home into party from home with Papa Veg Pizza's Virtual Feast. Order some good old favourites from Papa Veg Pizza and celebrate with your colleagues in a new and safer way.",
      featureImage: "https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?auto=format&fit=crop&w=1000&q=80",
      corporateEmail: "corporate.sales@papavegpizza.com",
      corporatePhone: "+91 9300990940"
    },
    egiftVoucher: {
      isActive: true,
      title: "E-Gift Voucher",
      bannerImage: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=1200&q=80",
      heading1: "LAUNCH YOUR GIFTING WITH US NOW",
      subheading1: "Get access to place order across Papa Veg Pizza stores in India via our app/website using E-Gift Voucher",
      feature1Title: "Easy and secure ordering",
      feature1Desc: "Place your E-Gift Voucher order with ease.",
      feature2Title: "Customized to meet business needs",
      feature2Desc: "Instant digital incentive with the flexibility of choosing the denominations.",
      feature3Title: "Flexible delivery option",
      feature3Desc: "Get your code delivered as an E-Gift card via e-mail.",
      heading2: "SMALL GESTURES GO A LONG WAY",
      description2: "Ultimate gifting for corporate and businesses. The Papa Veg Pizza's E-Gift Voucher is a great solution when it comes to rewarding and recognizing employees, customers and supporters with a sophisticated gifting platform.",
      featureImage: "https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?auto=format&fit=crop&w=1000&q=80",
      corporateEmail: "corporate.sales@papavegpizza.com",
      corporatePhone: "+91 9300990940",
      denominationOptions: [
        "25 - 50 Vouchers",
        "50 - 100 Vouchers",
        "100 - 500 Vouchers",
        "500+ Corporate Vouchers",
        "Custom Bulk Denomination"
      ],
      redeemHeading: "HOW TO REDEEM",
      redeemSubheading: "Redeem only on Papa Veg Pizza App and Website",
      redeemSteps: defaultRedeemSteps
    },
    contactPage: {
      feedbackHeading: "Have any feedback or queries? We'd love to hear from you. Write to us at",
      feedbackEmail: "guestcare@papavegpizza.com",
      outletButtonText: "FIND YOUR NEAREST OUTLET",
      outletButtonLink: "/food/user/delivery-location",
      outletHelpText: "Try our delicious treats and satisfy hunger with Papa Veg Pizza.",
      locateLinkText: "Locate Nearby Pizza Restaurants",
      locateLinkUrl: "/food/user/delivery-location",
      customerCareTitle: "Papa Veg Pizza Customer Care Number",
      customerCareNumber: "1800-889-1234",
      corporateOfficeTitle: "Papa Veg Pizza Corporate Office",
      companyName: "Papa Veg Pizza Private Limited",
      addressLine1: "12/2 M.G. Road, Near Palasia Square",
      addressLine2: "Indore - 452001, Madhya Pradesh, India",
      mapEmbedUrl:
        "https://maps.google.com/maps?q=Rajasthan&t=&z=7&ie=UTF8&iwloc=&output=embed",
      mapExternalUrl: "https://maps.google.com/?q=Rajasthan",
      facebookText: "Visit our page on Facebook",
      facebookUrl: "https://facebook.com/papavegpizza",
      googleText: "Visit our page on Google",
      googleUrl: "https://google.com/search?q=Papa+Veg+Pizza",
      instagramText: "Visit our page on Instagram",
      instagramUrl: "https://instagram.com/papavegpizza",
      twitterText: "Follow us on twitter for latest updates",
      twitterUrl: "https://twitter.com/papavegpizza"
    }
  })

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
        let lat = 22.7196
        let lng = 75.8577

        try {
          const savedUserLoc = localStorage.getItem("userLocation")
          if (savedUserLoc) {
            const parsed = JSON.parse(savedUserLoc)
            if (Number.isFinite(Number(parsed?.latitude)) && Number.isFinite(Number(parsed?.longitude))) {
              lat = Number(parsed.latitude)
              lng = Number(parsed.longitude)
            }
          }
        } catch (_) {}

        // If GPS is available and using default coords, attempt live GPS coordinates
        if (navigator.geolocation && lat === 22.7196) {
          await new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                lat = pos.coords.latitude
                lng = pos.coords.longitude
                resolve()
              },
              () => resolve(),
              { timeout: 3000 }
            )
          })
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
    <AnimatedPage className="min-h-screen bg-white dark:bg-black font-sans pb-16">
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

        {/* ── Brand Sub-Header (Papa Veg Pizza Logo & Nav) ── */}
        <div className="border-b border-zinc-200/80 dark:border-zinc-800 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2 shrink-0">
            <img
              src={logoImg}
              alt="Papa Veg Pizza"
              className="w-7 h-7 sm:w-8 sm:h-8 object-contain"
              onError={(e) => {
                e.target.style.display = "none"
              }}
            />
            <span className="text-base sm:text-lg font-extrabold text-[#E53935] tracking-tight whitespace-nowrap">
              Papa Veg Pizza
            </span>
          </div>

          {/* INQUIRY / CONTACT Nav Links */}
          <div className="flex items-center gap-4 text-xs font-bold text-zinc-700 dark:text-zinc-300 shrink-0">
            <button
              type="button"
              onClick={() => {
                setViewMode("inquiry")
                setShowOutlets(false)
                window.scrollTo({ top: 0, behavior: "smooth" })
              }}
              className={`transition-all cursor-pointer bg-transparent border-0 uppercase tracking-wider text-[11px] p-0 font-bold ${
                viewMode === "inquiry"
                  ? "text-[#E53935] font-extrabold border-b-2 border-[#E53935] pb-0.5"
                  : "text-zinc-500 hover:text-[#E53935]"
              }`}
            >
              Inquiry
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode("contact")
                setShowOutlets(false)
                window.scrollTo({ top: 0, behavior: "smooth" })
              }}
              className={`transition-all cursor-pointer bg-transparent border-0 uppercase tracking-wider text-[11px] p-0 font-bold ${
                viewMode === "contact"
                  ? "text-[#E53935] font-extrabold border-b-2 border-[#E53935] pb-0.5"
                  : "text-zinc-500 hover:text-[#E53935]"
              }`}
            >
              Contact
            </button>
          </div>
        </div>

        {/* ── Non-Working "Download App" Button (Strictly non-functional as requested) ── */}
        <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800 flex justify-center">
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="w-full max-w-md py-2.5 bg-[#E53935] text-white font-bold text-sm tracking-wide rounded-md shadow-sm opacity-90 cursor-default border-0 select-none pointer-events-none"
          >
            Download App
          </button>
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
                          href={`tel:${(store.phone || "1800-889-1234").replace(/\s+/g, "")}`}
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
              {/* 1. Feedback & Queries Card */}
              <section className="bg-white dark:bg-zinc-900 rounded-none border border-zinc-200/90 dark:border-zinc-800 p-6 sm:p-7 text-center space-y-4 shadow-sm">
                <p className="text-sm text-zinc-600 dark:text-zinc-300 font-medium m-0 leading-relaxed">
                  {cp.feedbackHeading || "Have any feedback or queries? We'd love to hear from you. Write to us at"}
                </p>
                <a
                  href={`mailto:${cp.feedbackEmail || "guestcare@papavegpizza.com"}`}
                  className="text-sm sm:text-base font-normal text-[#E53935] hover:underline block break-all tracking-tight"
                >
                  {cp.feedbackEmail || "guestcare@papavegpizza.com"}
                </a>

                {/* Nearest Outlet Button in Papa Veg Pizza Red */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowOutlets(true)
                      window.scrollTo({ top: 0, behavior: "smooth" })
                    }}
                    className="w-full py-3.5 px-4 bg-[#E53935] hover:bg-[#D32F2F] active:scale-[0.99] text-white font-extrabold text-xs sm:text-sm tracking-wider uppercase rounded-xl transition-all shadow-md shadow-red-500/20 cursor-pointer border-0 flex items-center justify-center gap-2"
                  >
                    <MapPin className="w-4 h-4" />
                    <span>{cp.outletButtonText || "FIND YOUR NEAREST OUTLET"}</span>
                  </button>
                </div>

                <p className="text-xs text-zinc-600 dark:text-zinc-400 m-0 leading-relaxed pt-1">
                  {cp.outletHelpText || "Try our delicious treats and satisfy hunger with Papa Veg Pizza."}{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setShowOutlets(true)
                      window.scrollTo({ top: 0, behavior: "smooth" })
                    }}
                    className="font-bold text-[#E53935] hover:underline bg-transparent border-0 p-0 inline cursor-pointer text-xs"
                  >
                    {cp.locateLinkText || "Locate Nearby Pizza Restaurants"}
                  </button>{" "}
                  nearest to you.
                </p>
              </section>

            {/* 2. Customer Care Number */}
            <section className="space-y-1.5 py-1">
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white m-0 tracking-tight">
                {cp.customerCareTitle || "Papa Veg Pizza Customer Care Number"}
              </h2>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <a
                  href={`tel:${(cp.customerCareNumber || "1800-889-1234").replace(/\s+/g, "")}`}
                  className="text-base sm:text-lg font-bold text-[#E53935] hover:underline inline-flex items-center gap-2"
                >
                  <Phone className="w-4 h-4 text-[#E53935]" />
                  <span>{cp.customerCareNumber || "1800-889-1234"}</span>
                </a>
              </div>
            </section>

            {/* 3. Corporate Office Address */}
            <section className="space-y-2.5 py-1">
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white m-0 flex items-center gap-2 tracking-tight">
                <Building className="w-4 h-4 text-[#E53935]" />
                <span>{cp.corporateOfficeTitle || "Papa Veg Pizza Corporate Office"}</span>
              </h2>
              <div className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1 leading-relaxed">
                <p className="font-normal text-zinc-700 dark:text-zinc-300 m-0">
                  {cp.companyName || "Papa Veg Pizza Private Limited"}
                </p>
                <p className="m-0">{cp.addressLine1 || "12/2 M.G. Road, Near Palasia Square"}</p>
                <p className="m-0">{cp.addressLine2 || "Indore - 452001, Madhya Pradesh, India"}</p>
              </div>
            </section>

            {/* 4. Interactive Google Map (Dynamic Search: Papa Veg Pizza + Customer City) */}
            <section className="bg-white dark:bg-zinc-900 rounded-none border border-zinc-200/90 dark:border-zinc-800 overflow-hidden shadow-sm relative">
              <div className="relative h-64 sm:h-72 w-full bg-zinc-100 dark:bg-zinc-800">
                <iframe
                  title="Corporate Office Location"
                  src={mapEmbedUrl}
                  className="w-full h-full border-0"
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                />
                <a
                  href={mapExternalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute top-3 left-3 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xs text-zinc-800 dark:text-zinc-200 hover:text-[#E53935] px-3 py-1.5 rounded-lg text-xs font-bold shadow-md border border-zinc-200 dark:border-zinc-700 flex items-center gap-1.5 no-underline transition-all hover:scale-105"
                >
                  <span>Open in Maps</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#E53935]" />
                </a>
              </div>
            </section>

            {/* 5. Social Media Channels (Full Width Black Card) */}
            <section className="-mx-4 -mb-5 w-[calc(100%+2rem)] bg-gradient-to-b from-zinc-900 to-zinc-950 text-white rounded-none p-6 sm:p-8 space-y-6 shadow-md border-y border-zinc-800 border-x-0 text-center">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#E53935] bg-red-950/50 border border-red-800/40 px-2.5 py-0.5 rounded-full inline-block">
                  Stay In Touch
                </span>
                <h3 className="text-sm font-bold text-zinc-200 m-0">
                  Official Papa Veg Pizza Channels
                </h3>
              </div>

              <div className="space-y-6 pt-2">
                {/* Facebook */}
                {cp.facebookUrl && (
                  <a
                    href={cp.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col items-center gap-2 no-underline transition-transform active:scale-95"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#1877F2]/20 border border-[#1877F2]/40 text-[#1877F2] group-hover:bg-[#1877F2] group-hover:text-white flex items-center justify-center transition-all shadow-sm">
                      <Facebook className="w-5 h-5 fill-current" />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-zinc-200 group-hover:text-white group-hover:underline">
                      {cp.facebookText || "Visit our page on Facebook"}
                    </span>
                  </a>
                )}

                {/* Google */}
                {cp.googleUrl && (
                  <a
                    href={cp.googleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col items-center gap-2 no-underline transition-transform active:scale-95"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#EA4335]/20 border border-[#EA4335]/40 text-[#EA4335] group-hover:bg-[#EA4335] group-hover:text-white flex items-center justify-center transition-all shadow-sm">
                      <span className="text-sm font-black font-sans">g+</span>
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-zinc-200 group-hover:text-white group-hover:underline">
                      {cp.googleText || "Visit our page on Google"}
                    </span>
                  </a>
                )}

                {/* Instagram */}
                {cp.instagramUrl && (
                  <a
                    href={cp.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col items-center gap-2 no-underline transition-transform active:scale-95"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500/20 via-rose-500/20 to-purple-500/20 border border-rose-500/40 text-rose-400 group-hover:bg-gradient-to-tr group-hover:from-amber-500 group-hover:via-rose-500 group-hover:to-purple-500 group-hover:text-white flex items-center justify-center transition-all shadow-sm">
                      <Instagram className="w-5 h-5" />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-zinc-200 group-hover:text-white group-hover:underline">
                      {cp.instagramText || "Visit our page on Instagram"}
                    </span>
                  </a>
                )}

                {/* Twitter / X */}
                {cp.twitterUrl && (
                  <a
                    href={cp.twitterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col items-center gap-2 no-underline transition-transform active:scale-95"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#1DA1F2]/20 border border-[#1DA1F2]/40 text-[#1DA1F2] group-hover:bg-[#1DA1F2] group-hover:text-white flex items-center justify-center transition-all shadow-sm">
                      <Twitter className="w-5 h-5 fill-current" />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-zinc-200 group-hover:text-white group-hover:underline">
                      {cp.twitterText || "Follow us on twitter for latest updates"}
                    </span>
                  </a>
                )}
              </div>
            </section>
          </div>
        )
      ) : (
          /* ── INQUIRY PAGE VIEW (Virtual Party / E-Gift Voucher) ── */
          <>
            {/* ── Contact Us Form Card (Same structure on both tabs as requested) ── */}
            <section id="inquiry-form" className="bg-white dark:bg-zinc-900 rounded-none shadow-sm border border-zinc-200/80 dark:border-zinc-800 p-6">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white m-0 tracking-tight">
              Contact Us
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 m-0">
              Please let us know your query
            </p>
          </div>

          {isSubmitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-8 text-center space-y-3"
            >
              <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white m-0">
                Inquiry Received!
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
                Thank you, <span className="font-semibold text-zinc-800 dark:text-zinc-200">{currentForm.name}</span>. Our corporate bulk desk will contact you on <span className="font-semibold text-zinc-800 dark:text-zinc-200">{currentForm.phone}</span> shortly.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsSubmitted(false)
                    handleFieldChange("query", "")
                  }}
                  className="px-5 py-2 text-xs font-bold text-[#E53935] hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors cursor-pointer border border-[#E53935]/30 bg-transparent"
                >
                  Send Another Inquiry
                </button>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name* */}
              <div>
                <input
                  type="text"
                  required
                  placeholder="Name*"
                  value={currentForm.name}
                  onChange={(e) => handleFieldChange("name", e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs outline-none focus:border-[#E53935] dark:focus:border-[#E53935] transition-colors placeholder:text-zinc-400 font-medium"
                />
              </div>

              {/* Organisation* */}
              <div>
                <input
                  type="text"
                  placeholder={activeTab === "egift_voucher" ? "Organisation*" : "Organisation"}
                  value={currentForm.organisation}
                  onChange={(e) => handleFieldChange("organisation", e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs outline-none focus:border-[#E53935] dark:focus:border-[#E53935] transition-colors placeholder:text-zinc-400 font-medium"
                />
              </div>

              {/* Contact Number* */}
              <div>
                <input
                  type="tel"
                  inputMode="numeric"
                  required
                  maxLength={10}
                  placeholder="Contact Number*"
                  value={currentForm.phone}
                  onChange={(e) => handleFieldChange("phone", e.target.value.replace(/\D/g, ""))}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs outline-none focus:border-[#E53935] dark:focus:border-[#E53935] transition-colors placeholder:text-zinc-400 font-medium"
                />
              </div>

              {/* Email ID* */}
              <div>
                <input
                  type="email"
                  required
                  placeholder="Email ID*"
                  value={currentForm.email}
                  onChange={(e) => handleFieldChange("email", e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs outline-none focus:border-[#E53935] dark:focus:border-[#E53935] transition-colors placeholder:text-zinc-400 font-medium"
                />
              </div>

              {/* Location: Area / City / State */}
              <div>
                <input
                  type="text"
                  placeholder="Location: Area / City / State"
                  value={currentForm.location}
                  onChange={(e) => handleFieldChange("location", e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs outline-none focus:border-[#E53935] dark:focus:border-[#E53935] transition-colors placeholder:text-zinc-400 font-medium"
                />
              </div>

              {/* Date of Event with Calendar Image & Choosing Date Option */}
              <div
                onClick={() => {
                  if (dateInputRef.current) {
                    if (dateInputRef.current.showPicker) {
                      dateInputRef.current.showPicker()
                    } else {
                      dateInputRef.current.focus()
                    }
                  }
                }}
                className="relative flex items-center justify-between w-full px-3.5 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs transition-colors font-medium cursor-pointer hover:border-zinc-400 focus-within:border-[#E53935] focus-within:ring-1 focus-within:ring-[#E53935]"
              >
                <span
                  className={
                    currentForm.eventDate
                      ? "text-zinc-900 dark:text-white font-semibold"
                      : "text-zinc-400 dark:text-zinc-500"
                  }
                >
                  {currentForm.eventDate
                    ? new Date(currentForm.eventDate + "T00:00:00").toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      })
                    : "Select Date*"}
                </span>

                <Calendar className="w-4 h-4 text-[#E53935] shrink-0 pointer-events-none" />

                <input
                  type="date"
                  ref={dateInputRef}
                  value={currentForm.eventDate || ""}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => {
                    handleFieldChange("eventDate", e.target.value)
                    handleFieldChange("occasion", e.target.value)
                  }}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                />
              </div>

              {/* Your Query */}
              <div>
                <textarea
                  rows={4}
                  placeholder="Your Query"
                  value={currentForm.query}
                  onChange={(e) => handleFieldChange("query", e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs outline-none focus:border-[#E53935] dark:focus:border-[#E53935] transition-colors placeholder:text-zinc-400 font-medium resize-none"
                />
              </div>

              {/* SUBMIT Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-[#E53935] hover:bg-[#D32F2F] active:scale-98 disabled:opacity-50 text-white font-bold rounded-lg text-xs uppercase tracking-wider transition-all shadow-md shadow-red-500/20 cursor-pointer border-0 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    "SUBMIT"
                  )}
                </button>
              </div>
            </form>
          )}
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
            <a
              href={`mailto:${(activeTab === "virtual_party" ? vp.corporateEmail : gv.corporateEmail) || "corporate.sales@papavegpizza.com"}`}
              className="text-xs sm:text-sm font-bold text-[#E53935] hover:underline inline-flex items-center gap-1.5 justify-center"
            >
              <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>{(activeTab === "virtual_party" ? vp.corporateEmail : gv.corporateEmail) || "corporate.sales@papavegpizza.com"}</span>
            </a>
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
