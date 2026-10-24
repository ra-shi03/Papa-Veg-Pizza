import React, { useEffect, useState, useMemo, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { 
  ArrowLeft, 
  Percent, 
  Tag, 
  Ticket, 
  ChevronDown, 
  Check, 
  Copy, 
  ShoppingBag,
  Sparkles,
  Gift
} from "lucide-react"
import AnimatedPage from "@food/components/user/AnimatedPage"
import apiClient from "@/services/api/axios"
import useAppBackNavigation from "@food/hooks/useAppBackNavigation"
import { useAppConfig } from "@food/context/AppConfigContext"
import { toast } from "sonner"

export default function Coupons() {
  const navigate = useNavigate()
  const goBack = useAppBackNavigation()
  const { config: appConfig } = useAppConfig()
  const [loading, setLoading] = useState(true)
  const [coupons, setCoupons] = useState([])
  const [expandedCardIds, setExpandedCardIds] = useState({})
  const [appliedCode, setAppliedCode] = useState("")
  const [copiedCode, setCopiedCode] = useState("")

  // Sync applied coupon from localStorage
  const syncAppliedCoupon = useCallback(() => {
    try {
      const stored = localStorage.getItem("cart_applied_coupon") || localStorage.getItem("pvp_applied_coupon")
      if (stored) {
        const parsed = JSON.parse(stored)
        setAppliedCode(parsed?.code || parsed?.couponCode || "")
      } else {
        setAppliedCode("")
      }
    } catch (_) {
      setAppliedCode("")
    }
  }, [])

  // Fetch active, non-expired coupons from backend/superadmin
  const fetchActiveCoupons = useCallback(async () => {
    if (appConfig?.couponEnabled === false) {
      setCoupons([])
      setLoading(false)
      return
    }

    setLoading(true)

    let items = []

    // 1. Fetch from backend public endpoint
    try {
      const res = await apiClient.get("/settings/coupons/public")
      const data = res?.data?.data || res?.data
      if (Array.isArray(data) && data.length > 0) {
        items = data
      }
    } catch (err) {
      console.warn("Public coupons fetch error:", err)
    }

    // 2. Fallback to /settings/coupons if empty (only if couponEnabled is not false)
    if (items.length === 0 && appConfig?.couponEnabled !== false) {
      try {
        const res = await apiClient.get("/settings/coupons")
        const data = res?.data?.data || res?.data
        if (Array.isArray(data) && data.length > 0) {
          items = data
        }
      } catch (_) {}
    }

    // 3. Fallback to localStorage 'pvp_coupons' (superadmin cache) (only if couponEnabled is not false)
    if (items.length === 0 && appConfig?.couponEnabled !== false) {
      try {
        const stored = localStorage.getItem("pvp_coupons")
        if (stored) {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed) && parsed.length > 0) {
            items = parsed
          }
        }
      } catch (_) {}
    }

    // Strictly filter out inactive and expired coupons
    const now = Date.now()
    const activeCoupons = items.filter((c) => {
      // Must not be explicitly inactive
      if (c.isActive === false) return false

      // Status check (case-insensitive)
      const st = String(c.status || "active").toLowerCase().trim()
      if (st === "disabled" || st === "inactive" || st === "expired") {
        return false
      }

      // End date check: don't show expired
      if (c.endDate) {
        const end = new Date(c.endDate).getTime()
        if (!isNaN(end) && end < now) {
          return false
        }
      }

      return true
    })

    setCoupons(activeCoupons)
    setLoading(false)
  }, [appConfig?.couponEnabled])

  useEffect(() => {
    fetchActiveCoupons()
    syncAppliedCoupon()

    const handleStorageChange = () => {
      syncAppliedCoupon()
      fetchActiveCoupons()
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("pvp_coupons_changed", handleStorageChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("pvp_coupons_changed", handleStorageChange)
    }
  }, [fetchActiveCoupons, syncAppliedCoupon])

  // Toggle terms / details drawer
  const toggleExpand = (couponId) => {
    setExpandedCardIds((prev) => ({
      ...prev,
      [couponId]: !prev[couponId]
    }))
  }

  // Copy coupon code to clipboard
  const handleCopy = async (code) => {
    const value = String(code || "").trim()
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      setCopiedCode(value)
      toast.success(`Coupon ${value} copied to clipboard!`)
      setTimeout(() => setCopiedCode(""), 2200)
    } catch {
      toast.error("Failed to copy coupon code")
    }
  }

  // Handle Apply Coupon
  const handleApply = (coupon) => {
    const code = coupon.code || coupon.couponCode
    if (!code) return

    const minOrder = coupon.minimumOrderAmount || coupon.minOrderValue || 0
    const maxDiscount = coupon.maximumDiscount || coupon.maxDiscount || coupon.value || coupon.discountValue || 80
    const isPercentage = coupon.couponType === "Percentage" || coupon.discountType === "percentage"

    // If already applied, allow user to unapply or show notification
    if (appliedCode === code) {
      localStorage.removeItem("pvp_applied_coupon")
      localStorage.removeItem("cart_applied_coupon")
      setAppliedCode("")
      window.dispatchEvent(new Event("storage"))
      toast.info(`Coupon ${code} removed`)
      return
    }

    const couponObj = {
      code,
      couponCode: code,
      title: coupon.title,
      value: coupon.value || coupon.discountValue || maxDiscount,
      discount: coupon.value || coupon.discountValue || maxDiscount,
      discountValue: coupon.value || coupon.discountValue || maxDiscount,
      discountType: isPercentage ? "percentage" : "flat-price",
      minOrder,
      minimumOrderAmount: minOrder,
      maxDiscount
    }

    try {
      localStorage.setItem("pvp_applied_coupon", JSON.stringify(couponObj))
      localStorage.setItem("cart_applied_coupon", JSON.stringify(couponObj))
      setAppliedCode(code)
      window.dispatchEvent(new Event("storage"))
      navigator.clipboard?.writeText(code).catch(() => {})
      toast.success(`🎉 Coupon ${code} applied successfully!`)
    } catch (e) {
      toast.error("Failed to apply coupon")
    }
  }

  // Safe navigation back
  const handleBack = () => {
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
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
      })
    } catch {
      return ""
    }
  }

  return (
    <AnimatedPage className="min-h-screen bg-[#F4F5F7] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans select-none pb-24">
      {/* Top Header matching Image 1 */}
      <header className="sticky top-0 z-40 bg-white dark:bg-zinc-900 border-b border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center">
          <button
            type="button"
            onClick={handleBack}
            className="p-1.5 -ml-1.5 mr-3 text-zinc-800 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors cursor-pointer border-0 bg-transparent flex items-center justify-center"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-white m-0">
            Coupons
          </h1>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-4 sm:py-5">
        {/* Loading State */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="relative bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-4 min-h-[120px] flex items-center justify-between animate-pulse"
              >
                <div className="flex-1 space-y-2.5 pr-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
                    <div className="w-24 h-6 rounded bg-zinc-200 dark:bg-zinc-800" />
                  </div>
                  <div className="w-3/4 h-3.5 rounded bg-zinc-200 dark:bg-zinc-800" />
                  <div className="w-20 h-3 rounded bg-zinc-200 dark:bg-zinc-800" />
                </div>
                <div className="w-24 flex flex-col items-center gap-2">
                  <div className="w-20 h-3.5 rounded bg-zinc-200 dark:bg-zinc-800" />
                  <div className="w-20 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && coupons.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center py-16 px-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs mt-2">
            <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/40 text-[#E53935] flex items-center justify-center mb-4 shadow-inner">
              <Ticket className="w-8 h-8 stroke-[1.8]" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
              No Active Coupons Available
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mt-1.5 mb-6 leading-relaxed">
              Check back soon for exclusive deals, discount vouchers, and special offers on your favorite pizzas!
            </p>
            <button
              type="button"
              onClick={() => {
                let target = "/user/menu"
                if (window.location.pathname.startsWith("/food") && !target.startsWith("/food")) {
                  target = `/food${target}`
                }
                navigate(target)
              }}
              className="bg-[#E53935] hover:bg-[#D32F2F] active:scale-95 text-white text-xs sm:text-sm font-bold px-6 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer border-0"
            >
              Browse Menu
            </button>
          </div>
        )}

        {/* Coupons List - Ticket UI matching Image 1 */}
        {!loading && coupons.length > 0 && (
          <div className="space-y-4">
            {coupons.map((coupon) => {
              const cardId = coupon._id || coupon.code
              const isExpanded = !!expandedCardIds[cardId]
              const isApplied = appliedCode === coupon.code

              const minOrder = coupon.minimumOrderAmount || coupon.minOrderValue || 0
              const maxDiscount = coupon.maximumDiscount || coupon.maxDiscount || coupon.value || coupon.discountValue || 0
              const isPercentage = coupon.couponType === "Percentage" || coupon.discountType === "percentage"

              // Description calculation matching Image 1
              let descriptionText = coupon.description
              if (!descriptionText) {
                if (isPercentage) {
                  descriptionText = `Get ${coupon.value || 50}% off on orders of ₹${minOrder || 199} or more${
                    maxDiscount ? ` (up to ₹${maxDiscount})` : ""
                  }`
                } else if (coupon.couponType === "Flat Amount") {
                  descriptionText = `Flat ₹${coupon.value || maxDiscount} Off on orders of ₹${minOrder || 199} or more`
                } else if (coupon.couponType === "Buy One Get One") {
                  descriptionText = `Buy 1 Get 1 Free on selected orders of ₹${minOrder || 299} or more`
                } else {
                  descriptionText = `Special offer on orders of ₹${minOrder || 199} or more`
                }
              }

              // Savings calculation matching Image 1 (Green text on right side)
              let savingsText = ""
              if (isPercentage) {
                savingsText = maxDiscount ? `Save\nup to ₹${maxDiscount}\nwith this offer` : `Save ${coupon.value}%\nwith this offer`
              } else if (coupon.couponType === "Flat Amount") {
                savingsText = `Save\n₹${coupon.value || maxDiscount}\nwith this offer`
              } else if (coupon.couponType === "Buy One Get One") {
                savingsText = `Buy 1 Get 1\nFree with offer`
              } else {
                savingsText = `Save\nwith this offer`
              }

              return (
                <div
                  key={cardId}
                  className="relative bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/90 dark:border-zinc-800 shadow-2xs overflow-hidden transition-all duration-200 hover:shadow-md"
                >
                  {/* Circular Ticket Cutouts on vertical divider line matching authentic coupon tickets */}
                  <div className="absolute -top-3.5 right-[33%] sm:right-[34%] -translate-x-1/2 w-6 h-6 rounded-full bg-[#F4F5F7] dark:bg-zinc-950 border-b border-zinc-200/80 dark:border-zinc-800 z-10 pointer-events-none" />
                  <div className="absolute -bottom-3.5 right-[33%] sm:right-[34%] -translate-x-1/2 w-6 h-6 rounded-full bg-[#F4F5F7] dark:bg-zinc-950 border-t border-zinc-200/80 dark:border-zinc-800 z-10 pointer-events-none" />

                  {/* Scalloped ticket punches on outer edges matching Image 1 */}
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col gap-1 z-10 pointer-events-none">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#F4F5F7] dark:bg-zinc-950 border-r border-zinc-200/80 dark:border-zinc-800" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#F4F5F7] dark:bg-zinc-950 border-r border-zinc-200/80 dark:border-zinc-800" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#F4F5F7] dark:bg-zinc-950 border-r border-zinc-200/80 dark:border-zinc-800" />
                  </div>
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 flex flex-col gap-1 z-10 pointer-events-none">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#F4F5F7] dark:bg-zinc-950 border-l border-zinc-200/80 dark:border-zinc-800" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#F4F5F7] dark:bg-zinc-950 border-l border-zinc-200/80 dark:border-zinc-800" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#F4F5F7] dark:bg-zinc-950 border-l border-zinc-200/80 dark:border-zinc-800" />
                  </div>

                  {/* Ticket Card Body */}
                  <div className="flex items-stretch min-h-[125px]">
                    {/* Left Section (Coupon details) */}
                    <div className="flex-1 p-4 sm:p-5 pr-3 sm:pr-4 flex flex-col justify-between">
                      <div>
                        {/* Top Row: Icon Badge + Dashed Code Pill */}
                        <div className="flex items-center gap-2.5">
                          {/* Badge Icon matching Image 1 */}
                          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-sky-50 dark:bg-sky-950/50 border border-sky-100 dark:border-sky-900/60 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0">
                            {isPercentage ? (
                              <Percent className="w-4 h-4 stroke-[2.6]" />
                            ) : (
                              <Tag className="w-4 h-4 stroke-[2.6]" />
                            )}
                          </div>

                          {/* Dashed Outline Code Box */}
                          <button
                            type="button"
                            onClick={() => handleCopy(coupon.code)}
                            title="Click to copy code"
                            className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 px-2.5 sm:px-3 py-1 rounded font-mono font-bold text-xs sm:text-sm tracking-wider text-zinc-900 dark:text-zinc-100 transition-colors cursor-pointer select-all flex items-center gap-1.5"
                          >
                            <span>{coupon.code}</span>
                            {copiedCode === coupon.code ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            ) : (
                              <Copy className="w-3 h-3 text-zinc-400 hover:text-zinc-600 shrink-0" />
                            )}
                          </button>
                        </div>

                        {/* Description Text matching Image 1 */}
                        <p className="text-xs sm:text-[13px] text-zinc-600 dark:text-zinc-300 font-medium leading-relaxed mt-2.5 line-clamp-2">
                          {descriptionText}
                        </p>
                      </div>

                      {/* More Details Dropdown Toggle matching Image 1 */}
                      <div>
                        <button
                          type="button"
                          onClick={() => toggleExpand(cardId)}
                          className="text-[12px] font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center gap-1 mt-2.5 cursor-pointer transition-colors border-0 bg-transparent p-0"
                        >
                          <span>{isExpanded ? "Less Details" : "More Details"}</span>
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform duration-200 ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Dotted Vertical Divider matching Image 1 */}
                    <div className="relative border-r border-dashed border-zinc-200 dark:border-zinc-700/80 my-3" />

                    {/* Right Section: Green Savings + Apply Button */}
                    <div className="w-[33%] sm:w-[34%] min-w-[110px] p-3 sm:p-4 flex flex-col items-center justify-center text-center">
                      <p className="text-[11px] sm:text-[12px] font-bold text-emerald-600 dark:text-emerald-400 leading-tight text-center whitespace-pre-line mb-3">
                        {savingsText}
                      </p>

                      <button
                        type="button"
                        onClick={() => handleApply(coupon)}
                        className={`w-full max-w-[105px] py-2 px-3 sm:px-4 rounded-lg font-bold text-xs sm:text-sm transition-all active:scale-95 shadow-xs cursor-pointer flex items-center justify-center gap-1 border-0 ${
                          isApplied
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                            : "bg-[#E53935] hover:bg-[#D32F2F] text-white"
                        }`}
                      >
                        {isApplied ? (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Applied</span>
                          </>
                        ) : (
                          "Apply"
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expandable Terms & Conditions Drawer */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden border-t border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-850/40"
                      >
                        <div className="p-4 space-y-1.5 text-xs text-zinc-600 dark:text-zinc-300">
                          <div className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                            Offer Terms & Conditions:
                          </div>
                          {minOrder > 0 && (
                            <p className="flex items-start gap-2 m-0">
                              <span className="text-zinc-400 mt-0.5">•</span>
                              <span>
                                Valid on minimum order value of <strong>₹{minOrder}</strong>.
                              </span>
                            </p>
                          )}
                          {maxDiscount > 0 && isPercentage && (
                            <p className="flex items-start gap-2 m-0">
                              <span className="text-zinc-400 mt-0.5">•</span>
                              <span>
                                Maximum discount capped at <strong>₹{maxDiscount}</strong>.
                              </span>
                            </p>
                          )}
                          {coupon.endDate && (
                            <p className="flex items-start gap-2 m-0">
                              <span className="text-zinc-400 mt-0.5">•</span>
                              <span>
                                Offer expires on <strong>{formatDate(coupon.endDate)}</strong>.
                              </span>
                            </p>
                          )}
                          <p className="flex items-start gap-2 m-0">
                            <span className="text-zinc-400 mt-0.5">•</span>
                            <span>
                              Applicable on {coupon.applicableOn ? `${coupon.applicableOn} orders` : "all items"}.
                            </span>
                          </p>
                          {coupon.usagePerCustomer && (
                            <p className="flex items-start gap-2 m-0">
                              <span className="text-zinc-400 mt-0.5">•</span>
                              <span>
                                Usage limit: {coupon.usagePerCustomer} time(s) per customer.
                              </span>
                            </p>
                          )}
                          {coupon.terms && Array.isArray(coupon.terms) ? (
                            coupon.terms.map((t, idx) => (
                              <p key={idx} className="flex items-start gap-2 m-0">
                                <span className="text-zinc-400 mt-0.5">•</span>
                                <span>{t}</span>
                              </p>
                            ))
                          ) : coupon.terms ? (
                            <p className="flex items-start gap-2 m-0">
                              <span className="text-zinc-400 mt-0.5">•</span>
                              <span>{coupon.terms}</span>
                            </p>
                          ) : null}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </AnimatedPage>
  )
}
