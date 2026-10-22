import { useState, useEffect, useMemo, useRef } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import {
  ArrowLeft,
  Search,
  HelpCircle,
  Package,
  CreditCard,
  User,
  Truck,
  Phone,
  Mail,
  ChevronDown,
  ChevronRight,
  Clock,
  MapPin,
  Shield,
  Loader2,
  X
} from "lucide-react"
import AnimatedPage from "@food/components/user/AnimatedPage"
import { faqAPI } from "@/services/api"

// Category icon & styling helper
const getCategoryMeta = (catName = "") => {
  const norm = String(catName).toLowerCase()
  if (norm.includes("order")) {
    return { icon: Package, color: "text-[#E53935]", bgColor: "bg-red-50 dark:bg-red-950/40" }
  }
  if (norm.includes("pay") || norm.includes("wallet") || norm.includes("billing")) {
    return { icon: CreditCard, color: "text-amber-600", bgColor: "bg-amber-50 dark:bg-amber-950/40" }
  }
  if (norm.includes("deliver") || norm.includes("track") || norm.includes("train")) {
    return { icon: Truck, color: "text-blue-600", bgColor: "bg-blue-50 dark:bg-blue-950/40" }
  }
  if (norm.includes("account") || norm.includes("profile")) {
    return { icon: User, color: "text-purple-600", bgColor: "bg-purple-50 dark:bg-purple-950/40" }
  }
  if (norm.includes("refund") || norm.includes("return") || norm.includes("policy")) {
    return { icon: Shield, color: "text-emerald-600", bgColor: "bg-emerald-50 dark:bg-emerald-950/40" }
  }
  return { icon: HelpCircle, color: "text-zinc-600 dark:text-zinc-300", bgColor: "bg-zinc-100 dark:bg-zinc-800" }
}

export default function Help() {
  const navigate = useNavigate()
  const location = useLocation()
  const [faqs, setFaqs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [expandedFaqId, setExpandedFaqId] = useState(null)
  const contactSectionRef = useRef(null)

  const handleBack = () => {
    // If an explicit 'from' is provided and is NOT a looping route (location, address, help)
    if (
      location.state?.from &&
      !location.state.from.includes("location") &&
      !location.state.from.includes("address") &&
      !location.state.from.includes("help")
    ) {
      const target =
        location.state.from.startsWith("/food") || !window.location.pathname.startsWith("/food")
          ? location.state.from
          : `/food${location.state.from}`
      navigate(target)
    } else {
      const profilePath = window.location.pathname.startsWith("/food")
        ? "/food/user/account/profile-details"
        : "/user/account/profile-details"
      navigate(profilePath)
    }
  }

  // Load dynamic FAQs from backend
  useEffect(() => {
    let cancelled = false
    const fetchFaqs = async () => {
      try {
        const res = await faqAPI.getPublicFaqs()
        if (cancelled) return
        const list = res?.data?.data || []
        setFaqs(list)
      } catch (err) {
        console.error("Failed to fetch public FAQs:", err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchFaqs()
    return () => { cancelled = true }
  }, [])

  // Categories extracted from dynamic FAQs
  const categories = useMemo(() => {
    const cats = Array.from(new Set(faqs.map(f => f.category).filter(Boolean)))
    return ["All", ...cats]
  }, [faqs])

  // Filtered FAQs
  const filteredFaqs = useMemo(() => {
    return faqs.filter(faq => {
      const matchCat = selectedCategory === "All" || faq.category === selectedCategory
      const q = searchQuery.toLowerCase().trim()
      const matchQuery = !q ||
        (faq.title && faq.title.toLowerCase().includes(q)) ||
        (faq.content && faq.content.toLowerCase().includes(q)) ||
        (faq.category && faq.category.toLowerCase().includes(q))
      return matchCat && matchQuery
    })
  }, [faqs, selectedCategory, searchQuery])

  // Group filtered FAQs by Category
  const groupedFaqs = useMemo(() => {
    const map = {}
    filteredFaqs.forEach(faq => {
      const cat = faq.category || "General"
      if (!map[cat]) map[cat] = []
      map[cat].push(faq)
    })
    return map
  }, [filteredFaqs])

  const toggleFaq = (id) => {
    setExpandedFaqId(prev => (prev === id ? null : id))
  }

  const scrollToContact = () => {
    contactSectionRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <AnimatedPage className="min-h-screen bg-zinc-50 dark:bg-[#0a0a0a] flex flex-col font-sans pb-16">
      {/* Sticky Header with Back Button */}
      <div className="bg-white dark:bg-[#121212] px-4 py-3.5 flex items-center justify-between shadow-xs sticky top-0 z-20 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleBack}
            className="p-1.5 -ml-1.5 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors cursor-pointer bg-transparent border-0 flex items-center justify-center"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>
          <h1 className="text-[17px] sm:text-lg font-bold text-gray-900 dark:text-white m-0">
            Need Help
          </h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto w-full px-4 pt-4 sm:pt-6 space-y-4">
        {/* Search Card */}
        <div className="bg-white dark:bg-zinc-900 p-2 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
          <div className="relative flex items-center">
            <Search className="w-5 h-5 text-zinc-400 absolute left-3.5" />
            <input
              type="text"
              placeholder="Search help topics, questions, keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-transparent text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 p-1 text-zinc-400 hover:text-zinc-600 rounded-full bg-transparent border-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Quick Action Cards */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
          <Link
            to={window.location.pathname.startsWith("/food") ? "/food/user/orders" : "/user/orders"}
            state={{ from: "/user/account/profile-details" }}
            className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200/70 dark:border-zinc-800 flex flex-col items-center text-center hover:border-red-300 dark:hover:border-red-900 transition-all group no-underline"
          >
            <div className="w-9 h-9 rounded-full bg-red-50 dark:bg-red-950/40 text-[#E53935] flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
              <Package className="w-4.5 h-4.5" />
            </div>
            <span className="text-[11px] sm:text-xs font-bold text-zinc-800 dark:text-zinc-200 leading-tight">
              Track Order
            </span>
            <span className="text-[10px] text-zinc-400 hidden sm:block mt-0.5">
              Order status
            </span>
          </Link>

          <Link
            to={window.location.pathname.startsWith("/food") ? "/food/user/location/setup" : "/user/location/setup"}
            state={{ mode: "my_addresses", from: "/user/account/profile-details" }}
            className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200/70 dark:border-zinc-800 flex flex-col items-center text-center hover:border-red-300 dark:hover:border-red-900 transition-all group no-underline"
          >
            <div className="w-9 h-9 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
              <MapPin className="w-4.5 h-4.5" />
            </div>
            <span className="text-[11px] sm:text-xs font-bold text-zinc-800 dark:text-zinc-200 leading-tight">
              My Addresses
            </span>
            <span className="text-[10px] text-zinc-400 hidden sm:block mt-0.5">
              Saved locations
            </span>
          </Link>

          <button
            type="button"
            onClick={scrollToContact}
            className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200/70 dark:border-zinc-800 flex flex-col items-center text-center hover:border-red-300 dark:hover:border-red-900 transition-all group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
              <Phone className="w-4.5 h-4.5" />
            </div>
            <span className="text-[11px] sm:text-xs font-bold text-zinc-800 dark:text-zinc-200 leading-tight">
              Support
            </span>
            <span className="text-[10px] text-zinc-400 hidden sm:block mt-0.5">
              Phone & Email
            </span>
          </button>
        </div>

        {/* Category Filter Pills */}
        {categories.length > 1 && (
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all cursor-pointer border-0 ${
                  selectedCategory === cat
                    ? "bg-[#E53935] text-white shadow-xs"
                    : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* FAQs Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 m-0">
              Frequently Asked Questions
            </h2>
            <span className="text-xs text-zinc-400 font-medium">
              {filteredFaqs.length} {filteredFaqs.length === 1 ? "result" : "results"}
            </span>
          </div>

          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-7 h-7 text-[#E53935] animate-spin" />
              <p className="text-xs text-zinc-400">Loading help topics...</p>
            </div>
          ) : filteredFaqs.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-10 text-center">
              <HelpCircle className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                No questions found
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
                Try searching with a different term or clear your filters.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("")
                  setSelectedCategory("All")
                }}
                className="px-4 py-2 bg-[#E53935] text-white rounded-xl text-xs font-bold cursor-pointer border-0"
              >
                View All FAQs
              </button>
            </div>
          ) : (
            Object.entries(groupedFaqs).map(([categoryName, faqItems]) => {
              const meta = getCategoryMeta(categoryName)
              const CatIcon = meta.icon

              return (
                <div
                  key={categoryName}
                  className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs overflow-hidden"
                >
                  {/* Category Header */}
                  <div className="p-3.5 sm:p-4 bg-zinc-50/70 dark:bg-zinc-900/60 border-b border-zinc-100 dark:border-zinc-800/80 flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg ${meta.bgColor} ${meta.color} flex items-center justify-center shrink-0`}>
                      <CatIcon className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white m-0">
                      {categoryName}
                    </h3>
                  </div>

                  {/* FAQ Items in this Category */}
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                    {faqItems.map((faq) => {
                      const id = faq._id || faq.id
                      const isExpanded = expandedFaqId === id

                      return (
                        <div key={id} className="transition-colors">
                          <button
                            type="button"
                            onClick={() => toggleFaq(id)}
                            className="w-full px-4 py-3.5 text-left flex items-center justify-between gap-3 cursor-pointer bg-transparent border-0 hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition-colors"
                          >
                            <span className="text-[13.5px] font-semibold text-zinc-800 dark:text-zinc-200 leading-snug">
                              {faq.title}
                            </span>
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0" />
                            )}
                          </button>

                          {isExpanded && (
                            <div className="px-4 pb-4 pt-1 animate-in fade-in duration-200">
                              <p className="text-[13px] text-zinc-600 dark:text-zinc-400 leading-relaxed m-0 whitespace-pre-line bg-zinc-50 dark:bg-zinc-800/40 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800/60">
                                {faq.content}
                              </p>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Contact Support Section (NO Chat with Us) */}
        <div
          ref={contactSectionRef}
          className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs p-4 sm:p-5 space-y-4"
        >
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white m-0 flex items-center gap-2">
              <Phone className="w-4.5 h-4.5 text-[#E53935]" />
              Customer Support
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 m-0">
              Have an issue with your order or questions about our menu? Get in touch directly:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Phone Support */}
            <a
              href="tel:+919300990940"
              className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-red-400 dark:hover:border-red-900 bg-zinc-50/60 dark:bg-zinc-800/30 flex items-center gap-3 transition-colors no-underline group"
            >
              <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-950/40 text-[#E53935] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Phone className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-zinc-400 font-medium m-0">Phone Support</p>
                <p className="text-[13px] font-bold text-zinc-900 dark:text-white mt-0.5 m-0 truncate">
                  +91 9300990940
                </p>
              </div>
            </a>

            {/* Email Support */}
            <a
              href="mailto:papafoodcorporation@gmail.com"
              className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-red-400 dark:hover:border-red-900 bg-zinc-50/60 dark:bg-zinc-800/30 flex items-center gap-3 transition-colors no-underline group"
            >
              <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Mail className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-zinc-400 font-medium m-0">Email Support</p>
                <p className="text-[13px] font-bold text-zinc-900 dark:text-white mt-0.5 m-0 truncate">
                  papafoodcorporation@gmail.com
                </p>
              </div>
            </a>
          </div>

          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-xs">
            <Clock className="w-3.5 h-3.5 text-[#E53935] shrink-0" />
            <span>Support Hours: 10:00 AM – 11:30 PM Everyday</span>
          </div>
        </div>
      </div>
    </AnimatedPage>
  )
}
