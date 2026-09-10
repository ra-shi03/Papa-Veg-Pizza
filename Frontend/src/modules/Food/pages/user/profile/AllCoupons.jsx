import React, { useEffect, useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { 
  ArrowLeft, 
  Pizza, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Check, 
  ChevronDown, 
  ChevronUp 
} from "lucide-react"
import AnimatedPage from "@food/components/user/AnimatedPage"
import { restaurantAPI } from "@food/api"
import { toast } from "sonner"

export default function AllCoupons() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("active") // "active", "redeemed", "expired"
  const [selectedFilter, setSelectedFilter] = useState("") // "", "online", "instore", "expiring"
  const [loading, setLoading] = useState(true)
  const [activeOffers, setActiveOffers] = useState([])
  const [copiedCode, setCopiedCode] = useState("")
  const [expandedCardId, setExpandedCardId] = useState(null)

  const [isDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("appTheme")
    return savedTheme ? savedTheme === "dark" : true
  })

  // Pizza images array for premium visuals
  const pizzaImages = [
    "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=300&q=80",
    "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=300&q=80",
    "https://images.unsplash.com/photo-1571066811602-71683a3f680d?auto=format&fit=crop&w=300&q=80",
    "https://images.unsplash.com/photo-1590947132387-155cc02f3212?auto=format&fit=crop&w=300&q=80"
  ]

  // Fetch active coupons
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        setLoading(true)
        const res = await restaurantAPI.getPublicOffers()
        const list = res?.data?.data?.allOffers || res?.data?.allOffers || []
        if (!cancelled) {
          const visible = Array.isArray(list) ? list.filter((o) => o?.showInCart !== false) : []
          setActiveOffers(visible)
        }
      } catch (e) {
        if (!cancelled) setActiveOffers([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  // Mock expired coupons based on UX screenshots
  const expiredOffers = [
    {
      id: "exp-1",
      couponCode: "XXXXXX",
      actualCode: "FLAT125",
      title: "FLAT 125 OFF",
      description: "Rs. 125 Off on bill value above Rs.500",
      offerType: "online",
      isInstore: false,
      endDate: "2026-05-10",
      status: "expired",
      terms: "Valid on all pizzas except Margherita. Cannot be combined with other offers."
    },
    {
      id: "exp-2",
      couponCode: "XXXXXX",
      actualCode: "FLAT100",
      title: "FLAT 100 OFF",
      description: "Rs. 100 Off on bill value above Rs.400",
      offerType: "online",
      isInstore: false,
      endDate: "2026-05-01",
      status: "expired",
      terms: "Offer valid once per user. Applicable on delivery orders only."
    },
    {
      id: "exp-3",
      couponCode: "XXXXXX",
      actualCode: "MOM",
      title: "MOM",
      description: "Get 100% Cashback* + a FREE personal Pizza of your choice.",
      offerType: "online/instore",
      isInstore: true,
      endDate: "2026-04-15",
      status: "expired",
      terms: "100% cashback up to Rs. 200. Free pizza applies to personal pan size only."
    }
  ]

  // Mock redeemed coupons
  const redeemedOffers = [
    {
      id: "red-1",
      couponCode: "XXXXXX",
      actualCode: "WELCOME200",
      title: "WELCOME 200",
      description: "Rs. 200 Off on your very first order value above Rs.499",
      offerType: "online",
      isInstore: false,
      endDate: "2026-06-12",
      status: "redeemed",
      terms: "Only valid for newly registered users on their first completed transaction."
    },
    {
      id: "red-2",
      couponCode: "XXXXXX",
      actualCode: "FREEGB",
      title: "FREE GARLIC BREAD",
      description: "Get free Garlic Breadsticks on orders above Rs.399",
      offerType: "online/instore",
      isInstore: true,
      endDate: "2026-06-25",
      status: "redeemed",
      terms: "Must include at least one medium or large pizza in cart to redeem garlic bread."
    }
  ]

  // Determine current list to render based on active tab
  const currentOffersList = useMemo(() => {
    if (activeTab === "expired") return expiredOffers
    if (activeTab === "redeemed") return redeemedOffers
    return activeOffers
  }, [activeTab, activeOffers])

  // Filter current list based on filter pills
  const filteredOffersList = useMemo(() => {
    let result = [...currentOffersList]

    if (selectedFilter === "online") {
      result = result.filter(
        (o) => o?.offerType?.toLowerCase() !== "instore" && o?.isInstore !== true
      )
    } else if (selectedFilter === "instore") {
      result = result.filter(
        (o) => o?.offerType?.toLowerCase() === "instore" || o?.isInstore === true || o?.offerType?.toLowerCase() === "online/instore"
      )
    } else if (selectedFilter === "expiring") {
      // Only applies to active tab
      const now = new Date().getTime()
      result = result.filter((o) => {
        if (!o?.endDate) return false
        const end = new Date(o.endDate).getTime()
        const diff = end - now
        return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000
      })
    }

    return result
  }, [currentOffersList, selectedFilter])

  const handleCopy = async (offer) => {
    if (offer.status === "expired") {
      toast.error("This coupon has expired and cannot be copied.")
      return
    }
    if (offer.status === "redeemed") {
      toast.error("This coupon has already been redeemed.")
      return
    }

    const value = String(offer.couponCode || "").trim()
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      setCopiedCode(value)
      toast.success("Coupon copied successfully!")
      setTimeout(() => setCopiedCode(""), 2000)
    } catch {
      toast.error("Failed to copy coupon code")
    }
  }

  const handleFilterToggle = (filterType) => {
    setSelectedFilter((prev) => (prev === filterType ? "" : filterType))
  }

  const handleTabChange = (tabName) => {
    setActiveTab(tabName)
    setSelectedFilter("") // Reset filter pills
    setExpandedCardId(null) // Reset expanded card details
  }

  const toggleExpandCard = (id) => {
    setExpandedCardId((prev) => (prev === id ? null : id))
  }

  return (
    <AnimatedPage className={`min-h-screen pb-20 select-none transition-colors duration-300 ${
      isDarkMode ? "dark bg-[#111111] text-white" : "bg-[#f8f9fa] text-zinc-900"
    }`}>
      
      {/* Header 1 */}
      <header className={`sticky top-0 left-0 w-full z-50 h-14 flex items-center px-4 justify-between border-b transition-colors ${
        isDarkMode ? "bg-[#111111]/90 backdrop-blur-md border-white/10 text-white" : "bg-white/90 backdrop-blur-md border-zinc-200 text-zinc-950"
      }`}>
        <button
          onClick={() => navigate("/user/account/coupons")}
          className={`flex items-center justify-center p-2 rounded-full cursor-pointer transition-all active:scale-95 bg-transparent border-0 outline-none ${
            isDarkMode ? "text-white hover:bg-white/10" : "text-zinc-950 hover:bg-zinc-100"
          }`}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-sm font-bold text-center flex-1 pr-8">
          Exclusive Offers for you
        </h1>
      </header>

      {/* Main Content Body */}
      <main className="max-w-md mx-auto px-5 flex flex-col mt-4">
        
        {/* Header 2 (Sub-header with back arrow and Papa Veg Pizza logo) */}
        <div className={`flex items-center h-12 border-b mb-4 ${
          isDarkMode ? "border-white/10" : "border-zinc-200"
        }`}>
          <button
            onClick={() => navigate("/user/account/coupons")}
            className={`flex items-center justify-center p-2 rounded-full cursor-pointer transition-all active:scale-95 bg-transparent border-0 outline-none ${
              isDarkMode ? "text-zinc-400 hover:text-white" : "text-zinc-650 hover:text-zinc-950"
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          
          <div className="flex-1 flex items-center justify-center pr-8 gap-1.5">
            <Pizza className="w-5 h-5 text-[#E53935]" />
            <span className="text-sm font-black uppercase tracking-wider text-[#E53935] font-sans">
              Papa Veg Pizza
            </span>
          </div>
        </div>

        {/* Page Title */}
        <h2 className={`text-base font-extrabold text-left mb-4 font-sans ${
          isDarkMode ? "text-white" : "text-zinc-900"
        }`}>
          All Coupons
        </h2>

        {/* Tab Buttons (Active, Redeemed, Expired) */}
        <div className={`flex p-1 rounded-xl border mb-4 transition-colors ${
          isDarkMode ? "bg-[#18181b]/50 border-white/10" : "bg-zinc-100 border-zinc-200"
        }`}>
          <button
            onClick={() => handleTabChange("active")}
            className={`flex-1 py-2 text-center text-xs font-extrabold rounded-lg transition-all cursor-pointer outline-none border-0 ${
              activeTab === "active"
                ? "bg-[#E53935] text-white shadow-md shadow-[#E53935]/25"
                : isDarkMode
                  ? "text-zinc-400 hover:text-white bg-transparent"
                  : "text-zinc-650 hover:text-zinc-900 bg-transparent"
            }`}
          >
            Active
          </button>
          <button
            onClick={() => handleTabChange("redeemed")}
            className={`flex-1 py-2 text-center text-xs font-extrabold rounded-lg transition-all cursor-pointer outline-none border-0 ${
              activeTab === "redeemed"
                ? "bg-[#E53935] text-white shadow-md shadow-[#E53935]/25"
                : isDarkMode
                  ? "text-zinc-400 hover:text-white bg-transparent"
                  : "text-zinc-650 hover:text-zinc-900 bg-transparent"
            }`}
          >
            Redeemed
          </button>
          <button
            onClick={() => handleTabChange("expired")}
            className={`flex-1 py-2 text-center text-xs font-extrabold rounded-lg transition-all cursor-pointer outline-none border-0 ${
              activeTab === "expired"
                ? "bg-[#E53935] text-white shadow-md shadow-[#E53935]/25"
                : isDarkMode
                  ? "text-zinc-400 hover:text-white bg-transparent"
                  : "text-zinc-650 hover:text-zinc-900 bg-transparent"
            }`}
          >
            Expired
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 scrollbar-none">
          <button
            onClick={() => handleFilterToggle("online")}
            className={`px-4 py-2 border rounded-full text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0 font-sans outline-none ${
              selectedFilter === "online"
                ? "bg-[#E53935] border-[#E53935] text-white"
                : isDarkMode
                  ? "bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10"
                  : "bg-white border-zinc-200 text-zinc-650 hover:bg-zinc-50"
            }`}
          >
            Online +
          </button>
          
          <button
            onClick={() => handleFilterToggle("instore")}
            className={`px-4 py-2 border rounded-full text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0 font-sans outline-none ${
              selectedFilter === "instore"
                ? "bg-[#E53935] border-[#E53935] text-white"
                : isDarkMode
                  ? "bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10"
                  : "bg-white border-zinc-200 text-zinc-650 hover:bg-zinc-50"
            }`}
          >
            In-store +
          </button>

          {activeTab === "active" && (
            <button
              onClick={() => handleFilterToggle("expiring")}
              className={`px-4 py-2 border rounded-full text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0 font-sans outline-none ${
                selectedFilter === "expiring"
                  ? "bg-[#E53935] border-[#E53935] text-white"
                  : isDarkMode
                    ? "bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10"
                    : "bg-white border-zinc-200 text-zinc-650 hover:bg-zinc-50"
              }`}
            >
              Expiring soon +
            </button>
          )}
        </div>

        {/* Coupons List */}
        <div className="flex flex-col gap-4 mt-2">
          {activeTab === "active" && loading ? (
            <div className="text-center py-10 text-sm text-zinc-400 font-medium">
              Loading active coupons...
            </div>
          ) : filteredOffersList.length > 0 ? (
            filteredOffersList.map((offer, idx) => {
              const id = offer.id || offer._id
              const code = offer.couponCode || ""
              const title = offer.title || "Flat Discount"
              const desc = offer.description || ""
              const isInstore = offer.isInstore || offer.offerType?.toLowerCase() === "instore"
              const isBoth = offer.offerType?.toLowerCase() === "online/instore"
              const typeLabel = isBoth ? "ONLINE/IN-STORE" : isInstore ? "IN-STORE" : "ONLINE"
              
              // Select one pizza image based on index
              const imageSrc = pizzaImages[idx % pizzaImages.length]

              // Date formatting
              const endDate = offer.endDate ? new Date(offer.endDate) : null
              const expiryText =
                endDate && !Number.isNaN(endDate.getTime())
                  ? `Valid till ${endDate.toLocaleDateString()}`
                  : "Limited period offer"

              const isExpanded = expandedCardId === id

              return (
                <div
                  key={id}
                  className={`relative w-full rounded-[24px] shadow-lg border overflow-hidden transition-all duration-300 flex flex-col text-left ${
                    isDarkMode 
                      ? "bg-zinc-950 border-white/5" 
                      : "bg-[#18181b] border-zinc-800"
                  }`}
                >
                  
                  {/* Card Main Block (Left: Text, Right: Pizza crop image) */}
                  <div className="relative w-full flex min-h-[160px] z-10">
                    
                    {/* Left Column (Content) */}
                    <div className="w-3/5 p-4 flex flex-col justify-between z-20">
                      
                      {/* Top Type Badge */}
                      <div>
                        <span className="bg-white text-zinc-900 text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-wide">
                          {typeLabel}
                        </span>
                        
                        {/* Title & Subtitle */}
                        <h3 className="text-white font-extrabold text-lg mt-2 font-sans tracking-wide leading-tight uppercase">
                          {title}
                        </h3>
                        <p className="text-zinc-300 text-[10px] font-medium mt-1 leading-snug font-sans">
                          {desc}
                        </p>
                      </div>

                      {/* Coupon Code copy box */}
                      <div className="flex items-center gap-1.5 mt-3 select-none">
                        <div className="border border-dashed border-zinc-500 rounded-lg px-3 py-1 flex items-center justify-center bg-zinc-900 bg-opacity-40 min-w-[75px] h-8">
                          <span className="text-white font-extrabold text-xs font-sans tracking-widest uppercase">
                            {code}
                          </span>
                        </div>
                        
                        <button
                          onClick={() => handleCopy(offer)}
                          disabled={offer.status === "expired" || offer.status === "redeemed"}
                          className={`h-8 px-3 rounded-lg text-[10px] font-black font-sans uppercase flex items-center justify-center gap-1 active:scale-95 transition-all outline-none border-0 cursor-pointer ${
                            copiedCode === code
                              ? "bg-emerald-600 text-white"
                              : offer.status === "expired" || offer.status === "redeemed"
                                ? "bg-zinc-700 text-zinc-400 cursor-not-allowed"
                                : "bg-white hover:bg-zinc-200 text-zinc-900"
                          }`}
                        >
                          {copiedCode === code ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            "Copy"
                          )}
                        </button>
                      </div>

                    </div>

                    {/* Right Column (Cropped Pizza Image) */}
                    <div className="w-2/5 relative overflow-hidden select-none">
                      {/* Image mask overlay to fade slightly into text */}
                      <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-transparent to-transparent z-10 pointer-events-none" />
                      
                      <img
                        src={imageSrc}
                        alt="Pizza promo"
                        className="absolute w-[180px] h-[180px] object-cover rounded-full -right-8 top-1/2 -translate-y-1/2 scale-110 pointer-events-none"
                      />

                      {/* Top Right Status Badge */}
                      <div className="absolute top-3 right-3 z-20">
                        {offer.status === "expired" ? (
                          <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-800 bg-opacity-70 text-zinc-300 border border-white/10 text-[9px] font-bold">
                            <Clock className="w-3 h-3" />
                            Expired!
                          </div>
                        ) : offer.status === "redeemed" ? (
                          <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-900 bg-opacity-80 text-zinc-400 border border-zinc-700 text-[9px] font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            Redeemed!
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-600 bg-opacity-80 text-white text-[9px] font-bold">
                            <Clock className="w-3 h-3" />
                            Active!
                          </div>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Bottom View Details Toggle Link */}
                  <div className="border-t border-zinc-800 border-opacity-50 p-3 flex flex-col z-20 bg-zinc-900 bg-opacity-30">
                    <button
                      onClick={() => toggleExpandCard(id)}
                      className="flex items-center gap-1 text-[10px] font-extrabold text-zinc-400 hover:text-white transition-all bg-transparent border-0 outline-none cursor-pointer self-start"
                    >
                      <Pizza className="w-3 h-3 text-[#E53935]" />
                      <span>View Details</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3 h-3 ml-0.5 text-zinc-400" />
                      ) : (
                        <ChevronDown className="w-3 h-3 ml-0.5 text-zinc-400" />
                      )}
                    </button>

                    {/* Expandable Terms text */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden mt-2"
                        >
                          <p className="text-[10px] text-zinc-400 font-medium leading-relaxed font-sans border-t border-zinc-800 border-opacity-40 pt-2 text-left">
                            {offer.terms || "Terms and Conditions apply. This offer is valid on regular prices and combos according to standard restaurant menu listings. Expiry is subject to operational policies."}
                          </p>
                          <p className="text-[9px] text-[#E53935] font-semibold mt-1">
                            {expiryText}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                </div>
              )
            })
          ) : (
            <div className="text-center py-12 px-4 border border-dashed rounded-2xl border-zinc-300 dark:border-white/10 mt-2">
              <AlertCircle className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-zinc-400">No coupons found</p>
              <p className="text-xs text-zinc-500 mt-1 font-medium">
                Try toggling another category or changing filter pills
              </p>
            </div>
          )}
        </div>

      </main>

    </AnimatedPage>
  )
}
