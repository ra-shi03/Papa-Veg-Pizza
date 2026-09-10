import React, { useEffect, useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { 
  ArrowLeft, 
  Search, 
  ChevronRight, 
  Tag, 
  Pizza, 
  Smartphone, 
  CreditCard, 
  Copy, 
  Check, 
  AlertCircle,
  MapPin,
  Megaphone,
  Receipt,
  CircleDollarSign,
  ChefHat,
  Ticket
} from "lucide-react"
import AnimatedPage from "@food/components/user/AnimatedPage"
import { restaurantAPI } from "@food/api"
import { toast } from "sonner"

export default function Coupons() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [offers, setOffers] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFilter, setSelectedFilter] = useState("") // "", "online", "instore", "expiring"
  const [showAllCoupons, setShowAllCoupons] = useState(false)
  const [activeTab, setActiveTab] = useState("online") // "online", "instore"
  const [copiedCode, setCopiedCode] = useState("")

  const [isDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("appTheme")
    return savedTheme ? savedTheme === "dark" : true
  })

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        setLoading(true)
        const res = await restaurantAPI.getPublicOffers()
        const list = res?.data?.data?.allOffers || res?.data?.allOffers || []
        if (!cancelled) {
          const visible = Array.isArray(list) ? list.filter((o) => o?.showInCart !== false) : []
          setOffers(visible)
        }
      } catch (e) {
        if (!cancelled) setOffers([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const filteredOffers = useMemo(() => {
    let result = [...offers]

    // Apply Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (o) =>
          String(o?.couponCode || "").toLowerCase().includes(q) ||
          String(o?.title || "").toLowerCase().includes(q)
      )
    }

    // Apply Filter Pills
    if (selectedFilter === "online") {
      result = result.filter(
        (o) => o?.offerType?.toLowerCase() !== "instore" && o?.isInstore !== true
      )
    } else if (selectedFilter === "instore") {
      result = result.filter(
        (o) => o?.offerType?.toLowerCase() === "instore" || o?.isInstore === true
      )
    } else if (selectedFilter === "expiring") {
      const now = new Date().getTime()
      result = result.filter((o) => {
        if (!o?.endDate) return false
        const end = new Date(o.endDate).getTime()
        const diff = end - now
        return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000 // Expiring within 7 days
      })
    }

    return result.sort((a, b) =>
      String(a?.couponCode || "").localeCompare(String(b?.couponCode || ""))
    )
  }, [offers, searchQuery, selectedFilter])

  const handleCopy = async (code) => {
    const value = String(code || "").trim()
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
    if (selectedFilter === filterType) {
      setSelectedFilter("") // De-select if clicked again
    } else {
      setSelectedFilter(filterType)
      // Auto expand coupons list if a filter is chosen
      setShowAllCoupons(true)
    }
  }

  // Steps definition based on user's screenshots
  const onlineSteps = [
    {
      step: "Step 1",
      desc: "Click Apply on the coupon",
      icon: <Tag className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
    },
    {
      step: "Step 2",
      desc: "Select your favorites from the Papa Veg Pizza App!",
      icon: <Pizza className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
    },
    {
      step: "Step 3",
      desc: "Check whether offer is applied while making the payment",
      icon: <Smartphone className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
    },
    {
      step: "Step 4",
      desc: "Place the order",
      icon: <CreditCard className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
    },
    {
      step: "Step 5",
      desc: "Enjoy your meal!",
      icon: <ChefHat className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
    }
  ]

  const instoreSteps = [
    {
      step: "Step 1",
      desc: "Visit any nearby Papa Veg Pizza outlet",
      icon: <MapPin className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
    },
    {
      step: "Step 2",
      desc: "Tell the billing counter executive your selected coupon code",
      icon: <Megaphone className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
    },
    {
      step: "Step 3",
      desc: "Ensure the discount is applied to your print or digital bill",
      icon: <Receipt className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
    },
    {
      step: "Step 4",
      desc: "Complete the remaining payment at the counter",
      icon: <CircleDollarSign className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
    },
    {
      step: "Step 5",
      desc: "Relish your freshly prepared delicious pizza!",
      icon: <Pizza className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
    }
  ]

  const currentSteps = activeTab === "online" ? onlineSteps : instoreSteps

  return (
    <AnimatedPage className={`min-h-screen pb-20 select-none transition-colors duration-300 ${
      isDarkMode ? "dark bg-[#111111] text-white" : "bg-[#f8f9fa] text-zinc-900"
    }`}>
      
      {/* Header */}
      <header className={`sticky top-0 left-0 w-full z-50 h-16 flex items-center px-4 justify-between border-b transition-colors ${
        isDarkMode ? "bg-[#111111]/90 backdrop-blur-md border-white/10 text-white" : "bg-white/90 backdrop-blur-md border-zinc-200 text-zinc-950"
      }`}>
        <button
          onClick={() => navigate("/user/account")}
          className={`flex items-center justify-center p-2 rounded-full cursor-pointer transition-all active:scale-95 bg-transparent border-0 outline-none ${
            isDarkMode ? "text-white hover:bg-white/10" : "text-zinc-950 hover:bg-zinc-100"
          }`}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        
        <h1 className="text-lg font-bold text-center flex-1 font-headline-lg-mobile pr-8">
          Exclusive Offers for you
        </h1>
      </header>

      {/* Content Body */}
      <main className="max-w-md mx-auto px-5 mt-5 flex flex-col gap-5">
        
        {/* Search Coupon Code */}
        <div className={`relative flex items-center h-12 px-4 rounded-xl border transition-all ${
          isDarkMode 
            ? "bg-[#1e1e20] border-white/10 focus-within:border-[#E53935]" 
            : "bg-white border-zinc-200 focus-within:border-[#E53935]"
        }`}>
          <Search className="w-5 h-5 text-zinc-400 mr-3 shrink-0" />
          <input
            type="text"
            placeholder="Search coupon code here"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              if (e.target.value.trim() !== "") {
                setShowAllCoupons(true)
              }
            }}
            className="w-full h-full bg-transparent border-0 outline-none text-sm font-sans placeholder-zinc-400 font-medium"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
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
            Online {selectedFilter === "online" ? "✓" : "+"}
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
            In-store {selectedFilter === "instore" ? "✓" : "+"}
          </button>

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
            Expiring soon {selectedFilter === "expiring" ? "✓" : "+"}
          </button>
        </div>

        {/* Check All Your Coupons Card */}
        <div
          onClick={() => navigate("/user/account/coupons/all")}
          className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer border transition-all active:scale-[0.99] ${
            isDarkMode 
              ? "bg-[#1e1e20] border-white/10 hover:bg-[#252528]" 
              : "bg-white border-zinc-200 hover:bg-zinc-50"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#E53935]/15 border border-[#E53935]/20 flex items-center justify-center text-[#E53935] shrink-0">
              <Ticket className="w-5 h-5 fill-current" />
            </div>
            <span className={`text-sm font-bold font-sans ${isDarkMode ? "text-white" : "text-zinc-800"}`}>
              Check All Your Coupons
            </span>
          </div>
          <ChevronRight className="w-5 h-5 text-zinc-400" />
        </div>

        {/* How To Redeem Section */}
        <div className="space-y-4">
          <h2 className={`text-lg font-extrabold font-headline-lg-mobile text-left ${
            isDarkMode ? "text-white" : "text-zinc-900"
          }`}>
            How To Redeem
          </h2>

          {/* Custom Tabs */}
          <div className={`flex p-1 rounded-xl border transition-colors ${
            isDarkMode ? "bg-[#18181b]/50 border-white/10" : "bg-zinc-100 border-zinc-200"
          }`}>
            <button
              onClick={() => setActiveTab("online")}
              className={`flex-1 py-2 text-center text-xs font-extrabold rounded-lg transition-all cursor-pointer outline-none border-0 ${
                activeTab === "online"
                  ? "bg-[#E53935] text-white shadow-md shadow-[#E53935]/25"
                  : isDarkMode
                    ? "text-zinc-400 hover:text-white bg-transparent"
                    : "text-zinc-650 hover:text-zinc-900 bg-transparent"
              }`}
            >
              Online
            </button>
            <button
              onClick={() => setActiveTab("instore")}
              className={`flex-1 py-2 text-center text-xs font-extrabold rounded-lg transition-all cursor-pointer outline-none border-0 ${
                activeTab === "instore"
                  ? "bg-[#E53935] text-white shadow-md shadow-[#E53935]/25"
                  : isDarkMode
                    ? "text-zinc-400 hover:text-white bg-transparent"
                    : "text-zinc-650 hover:text-zinc-900 bg-transparent"
              }`}
            >
              In-Store
            </button>
          </div>

          {/* Steps Container */}
          <div className={`p-5 rounded-[28px] border transition-colors ${
            isDarkMode ? "bg-[#18181b] border-white/5 text-white" : "bg-white border-zinc-150 text-zinc-900"
          }`}>
            <div className="flex flex-col gap-5">
              {currentSteps.map((s, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  {/* Step Icon Box */}
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors border ${
                    isDarkMode 
                      ? "bg-white/5 border-white/5 text-white" 
                      : "bg-zinc-50 border-zinc-100 text-zinc-700"
                  }`}>
                    {s.icon}
                  </div>

                  {/* Step Description */}
                  <div className="text-left leading-normal">
                    <p className={`text-[10px] font-black uppercase ${
                      isDarkMode ? "text-zinc-500" : "text-zinc-400"
                    }`}>
                      {s.step}
                    </p>
                    <p className={`text-xs font-extrabold mt-0.5 ${
                      isDarkMode ? "text-zinc-200" : "text-zinc-800"
                    }`}>
                      {s.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Need Help Section */}
        <div className={`flex items-start gap-4 p-5 rounded-[28px] border transition-colors ${
          isDarkMode ? "bg-[#18181b]/50 border-white/5 text-white" : "bg-white border-zinc-150 text-zinc-900"
        }`}>
          <AlertCircle className="w-5 h-5 text-zinc-400 mt-0.5 shrink-0" />
          <div className="text-left">
            <h3 className="text-sm font-extrabold font-sans">Need Help?</h3>
            <span
              onClick={() => navigate("/user/account/coupons/support")}
              className="text-xs font-extrabold text-[#E53935] hover:underline cursor-pointer inline-block mt-1 font-sans"
            >
              Report an issue
            </span>
          </div>
        </div>

      </main>

    </AnimatedPage>
  )
}
