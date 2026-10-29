import React, { useEffect, useState, useMemo, useRef } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { ArrowLeft, ChevronDown, BadgePercent, Check, AlertCircle } from "lucide-react"
import { offerDiscount } from "./cartHelpers"
import apiClient from "@/services/api/axios"

/**
 * Perforated coupon ticket card matching Image 4:
 * - 3 small semicircular punch-out notches on left & right edges
 * - Left column: Dashed coupon code badge with blue percent/badge icon, dynamic description, expandable "More Details"
 * - Vertical dashed/dotted divider
 * - Right column: Green savings text, Theme red "Apply" button (or green "Applied" / gray disabled)
 * - Attached dark bottom footer bar for locked coupons: "Add Items worth ₹X or more to unlock"
 */
function CouponCard({ offer, subtotal, isApplied, onApply, onRemove, onAddItems, ui }) {
  const [expanded, setExpanded] = useState(false)
  const minOrder = Number(offer.minOrderValue) || 0
  const isUnlocked = subtotal >= minOrder
  const shortfall = Math.max(0, Math.ceil(minOrder - subtotal))
  const saving = offerDiscount(offer, subtotal)

  // Dynamic description matching Papa Veg Pizza coupon structure
  const discountText =
    offer.discountType === "percentage"
      ? `${offer.discountValue}% OFF`
      : `₹${offer.discountValue} OFF`

  const description =
    offer.description ||
    (offer.discountType === "percentage"
      ? `Get ${discountText} on orders of ₹${minOrder || 0} or more${offer.maxDiscount ? ` (up to ₹${offer.maxDiscount})` : ""}`
      : `Get Flat ${discountText} on orders of ₹${minOrder || 0} or more`)

  return (
    <div
      className="relative rounded-xl border overflow-hidden text-left shadow-sm transition-all"
      style={{
        backgroundColor: ui.dark ? "#1b1b1d" : "#ffffff",
        borderColor: isApplied ? "#16a34a" : ui.line,
      }}
    >
      {/* 3 Scallop notches on left edge (matching Image 4) */}
      <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 flex flex-col gap-1 pointer-events-none z-10">
        <span className="w-2.5 h-2.5 rounded-full border" style={{ backgroundColor: ui.page, borderColor: ui.line }} />
        <span className="w-2.5 h-2.5 rounded-full border" style={{ backgroundColor: ui.page, borderColor: ui.line }} />
        <span className="w-2.5 h-2.5 rounded-full border" style={{ backgroundColor: ui.page, borderColor: ui.line }} />
      </div>

      {/* 3 Scallop notches on right edge (matching Image 4) */}
      <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 flex flex-col gap-1 pointer-events-none z-10">
        <span className="w-2.5 h-2.5 rounded-full border" style={{ backgroundColor: ui.page, borderColor: ui.line }} />
        <span className="w-2.5 h-2.5 rounded-full border" style={{ backgroundColor: ui.page, borderColor: ui.line }} />
        <span className="w-2.5 h-2.5 rounded-full border" style={{ backgroundColor: ui.page, borderColor: ui.line }} />
      </div>

      {/* Main card 2-column flex */}
      <div className="flex items-stretch p-3.5 pl-4">
        {/* Left Column: Code Badge + Description + More Details */}
        <div className="flex-1 min-w-0 pr-3">
          {/* Dashed Code Badge */}
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded border border-dashed text-xs font-bold tracking-wide"
            style={{
              borderColor: ui.dark ? "rgba(255,255,255,0.25)" : "#cbd5e1",
              backgroundColor: ui.dark ? "rgba(255,255,255,0.06)" : "#f8fafc",
              color: ui.text,
            }}
          >
            <BadgePercent size={14} className="text-[#3b82f6] shrink-0" />
            <span>{offer.couponCode}</span>
          </div>

          {/* Description */}
          <p className="text-xs mt-2 leading-relaxed" style={{ color: ui.text }}>
            {description}
          </p>

          {/* More Details Toggle */}
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="mt-2 text-[11px] font-bold text-[#1e40af] dark:text-[#60a5fa] flex items-center gap-1 bg-transparent border-0 p-0 cursor-pointer hover:underline"
          >
            <span>More Details</span>
            <ChevronDown
              size={12}
              className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
            />
          </button>
        </div>

        {/* Dotted Vertical Divider */}
        <div
          className="w-0 border-r border-dashed my-1 self-stretch"
          style={{ borderColor: ui.line }}
        />

        {/* Right Column: Savings Text + Apply Button */}
        <div className="w-[105px] shrink-0 flex flex-col items-center justify-center pl-3 text-center">
          <p className="text-xs font-bold leading-tight" style={{ color: "#16a34a" }}>
            {isApplied || saving > 0 ? (
              <>Save ₹{saving}</>
            ) : (
              <>
                Save{" "}
                {offer.maxDiscount
                  ? `up to ₹${offer.maxDiscount}`
                  : discountText}
              </>
            )}
            <span className="block text-[10px] font-medium mt-0.5" style={{ color: ui.muted }}>
              {isApplied ? "applied" : "with this offer"}
            </span>
          </p>

          <div className="mt-2.5 w-full">
            {isApplied ? (
              <button
                type="button"
                onClick={onRemove}
                className="w-full py-1.5 rounded-lg text-xs font-bold bg-[#16a34a] text-white border-0 cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-1"
              >
                <Check size={12} strokeWidth={2.5} /> Applied
              </button>
            ) : isUnlocked ? (
              <button
                type="button"
                onClick={() => onApply(offer)}
                className="w-full py-1.5 rounded-lg text-xs font-bold bg-[#E53935] hover:bg-[#d32f2f] text-white border-0 cursor-pointer active:scale-95 transition-all shadow-sm"
              >
                Apply
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="w-full py-1.5 rounded-lg text-xs font-bold bg-gray-200 dark:bg-zinc-800 text-gray-400 dark:text-zinc-500 border-0 cursor-not-allowed"
              >
                Apply
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expandable Terms & Conditions */}
      {expanded && (
        <div
          className="px-4 py-2.5 text-[11px] leading-relaxed border-t border-dashed"
          style={{
            borderColor: ui.line,
            backgroundColor: ui.dark ? "rgba(255,255,255,0.02)" : "#fafafa",
            color: ui.muted,
          }}
        >
          <ul className="list-disc pl-4 space-y-1">
            <li>Minimum cart order value required: <b>₹{minOrder}</b></li>
            {offer.maxDiscount > 0 && <li>Maximum discount capped at <b>₹{offer.maxDiscount}</b></li>}
            {offer.endDate && (
              <li>
                Valid till:{" "}
                <b>{new Date(offer.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</b>
              </li>
            )}
            {offer.customerScope === "first-time" && <li>Valid on 1st order only</li>}
            <li>Applicable only for orders placed via Papa Veg Pizza app</li>
          </ul>
        </div>
      )}

      {/* Locked Offer Bottom Banner (Matching Image 4) */}
      {!isUnlocked && (
        <button
          type="button"
          onClick={onAddItems}
          className="w-full bg-[#212121] text-white text-xs font-bold py-2 px-3 text-center border-0 cursor-pointer hover:bg-black active:opacity-90 transition-colors flex items-center justify-center gap-1"
        >
          <span>Add Items worth ₹{shortfall} or more to unlock</span>
        </button>
      )}
    </div>
  )
}

/**
 * Full-screen Coupons view matching Image 4:
 * - Header: Back arrow, "Coupons", "Your cart value ₹299 + Charges"
 * - "Have an offer code?" input box with debounced search filter & direct apply
 * - "Best Offer" card section
 * - "Other Offers" card list
 * - Real live database coupon data (no hardcoded data)
 * - Existing Papa Veg Pizza theme colors (#E53935)
 */
export default function ApplyCoupon({
  show,
  onClose,
  offers = [],
  subtotal = 0,
  appliedCode,
  onApply,
  onRemove,
  ui,
}) {
  const reduce = useReducedMotion()
  const [searchInput, setSearchInput] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [error, setError] = useState("")
  const [dynamicOffers, setDynamicOffers] = useState([])
  const inputRef = useRef(null)

  // 1. Debouncing method for the search bar (250ms delay)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput.trim().toLowerCase())
    }, 250)
    return () => clearTimeout(handler)
  }, [searchInput])

  // 2. Fetch live real coupons on mount / when empty
  useEffect(() => {
    if (!show) return
    setError("")
    setSearchInput("")

    const fetchLiveCoupons = async () => {
      if (Array.isArray(offers) && offers.length > 0) {
        setDynamicOffers(offers)
        return
      }

      let fetched = []
      try {
        const res = await apiClient.get("/food/offers/public", { _isFallback: true })
        const list = res?.data?.data?.allOffers || res?.data?.allOffers || res?.data?.data
        if (Array.isArray(list) && list.length > 0) {
          fetched = list
        }
      } catch (_) {}

      if (fetched.length === 0) {
        try {
          const res = await apiClient.get("/settings/coupons/public")
          const list = res?.data?.data || res?.data
          if (Array.isArray(list) && list.length > 0) {
            fetched = list
          }
        } catch (_) {}
      }

      if (fetched.length > 0) {
        setDynamicOffers(fetched)
      }
    }

    fetchLiveCoupons()
  }, [show, offers])

  // Filter strictly active coupons
  const activeOffers = useMemo(() => {
    const source = dynamicOffers.length > 0 ? dynamicOffers : offers
    return (source || []).filter((o) => {
      const s = String(o.status || "active").toLowerCase()
      if (s !== "active" && s !== "published") return false
      if (o.isActive === false) return false
      if (o.showInCart === false) return false
      if (o.endDate && new Date(o.endDate) <= new Date()) return false
      return true
    })
  }, [dynamicOffers, offers])

  // Filter with debounced search query
  const filteredOffers = useMemo(() => {
    if (!debouncedSearch) return activeOffers
    return activeOffers.filter((o) => {
      const code = String(o.couponCode || "").toLowerCase()
      const desc = String(o.description || "").toLowerCase()
      const title = String(o.title || "").toLowerCase()
      return code.includes(debouncedSearch) || desc.includes(debouncedSearch) || title.includes(debouncedSearch)
    })
  }, [activeOffers, debouncedSearch])

  // Separate "Best Offer" vs "Other Offers" (matching Image 4)
  const { bestOffer, otherOffers } = useMemo(() => {
    if (filteredOffers.length === 0) return { bestOffer: null, otherOffers: [] }

    // Sort by usable discount first (biggest discount), then by lowest shortfall
    const sorted = [...filteredOffers].sort((a, b) => {
      const da = offerDiscount(a, subtotal)
      const db = offerDiscount(b, subtotal)
      if (da > 0 && db > 0) return db - da
      if (da > 0) return -1
      if (db > 0) return 1
      return (Number(a.minOrderValue) || 0) - (Number(b.minOrderValue) || 0)
    })

    const best = sorted[0] || null
    const others = sorted.slice(1)
    return { bestOffer: best, otherOffers: others }
  }, [filteredOffers, subtotal])

  // Apply typed code handler
  const handleApplyTyped = (e) => {
    if (e) e.preventDefault()
    const typed = searchInput.trim().toUpperCase()
    if (!typed) return

    const matched = activeOffers.find((o) => o.couponCode.toUpperCase() === typed)
    if (!matched) {
      setError(`Coupon code "${typed}" is invalid or expired`)
      return
    }

    const minOrder = Number(matched.minOrderValue) || 0
    if (subtotal < minOrder) {
      const short = Math.ceil(minOrder - subtotal)
      setError(`Add ₹${short} more to apply code "${matched.couponCode}"`)
      return
    }

    setError("")
    onApply(matched)
    onClose()
  }

  const handleApplyCard = (offer) => {
    setError("")
    onApply(offer)
    onClose()
  }

  const navigateToMenu = () => {
    onClose()
    const base = window.location.pathname.startsWith("/food") ? "/food/user/menu" : "/user/menu"
    window.location.href = base
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[70] flex justify-center bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Coupons"
            className="w-full max-w-md min-h-screen max-h-screen flex flex-col shadow-2xl overflow-hidden relative"
            style={{
              background: ui.dark ? "#111111" : "#F8F6F2",
              color: ui.text,
            }}
            initial={reduce ? false : { x: "100%" }}
            animate={{ x: 0 }}
            exit={reduce ? { opacity: 0 } : { x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Fixed Header Bar (Matching Image 4) */}
            <header
              className="sticky top-0 z-20 w-full px-4 py-3 flex items-center gap-3 border-b shadow-sm"
              style={{
                backgroundColor: ui.card,
                borderColor: ui.line,
              }}
            >
              <button
                type="button"
                onClick={onClose}
                aria-label="Back to cart"
                className="p-1 -ml-1 text-inherit bg-transparent border-0 cursor-pointer active:scale-95 transition-transform"
              >
                <ArrowLeft size={22} />
              </button>
              <div className="flex-1 min-w-0 text-left">
                <h1 className="text-base font-extrabold leading-none select-none" style={{ color: ui.text }}>
                  Coupons
                </h1>
                <p className="text-[11px] font-medium mt-0.5 truncate" style={{ color: ui.muted }}>
                  Your cart value ₹{subtotal} + Charges
                </p>
              </div>
            </header>

            {/* Scrollable Content Container */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 hide-scrollbar">
              {/* "Have an offer code?" Input Container (Matching Image 4) */}
              <div
                className="rounded-2xl border p-4 shadow-sm text-left"
                style={{
                  backgroundColor: ui.card,
                  borderColor: ui.line,
                }}
              >
                <h2 className="text-xs font-bold mb-2.5" style={{ color: ui.text }}>
                  Have an offer code?
                </h2>

                <form onSubmit={handleApplyTyped} className="relative">
                  <div
                    className="flex items-center rounded-xl border px-3 h-11 transition-colors"
                    style={{
                      backgroundColor: ui.dark ? "rgba(255,255,255,0.04)" : "#ffffff",
                      borderColor: error ? "#E53935" : ui.line,
                    }}
                  >
                    <input
                      ref={inputRef}
                      type="text"
                      value={searchInput}
                      onChange={(e) => {
                        setSearchInput(e.target.value.toUpperCase())
                        setError("")
                      }}
                      placeholder="Type offer code here..."
                      className="flex-1 min-w-0 bg-transparent outline-none border-0 text-xs font-bold tracking-wider uppercase placeholder:normal-case placeholder:font-normal placeholder:tracking-normal"
                      style={{ color: ui.text }}
                    />
                    <button
                      type="submit"
                      disabled={!searchInput.trim()}
                      className="text-xs font-extrabold px-2 py-1 rounded-md bg-transparent border-0 cursor-pointer active:scale-95 transition-all disabled:cursor-not-allowed"
                      style={{
                        color: searchInput.trim() ? "#E53935" : ui.muted,
                      }}
                    >
                      Apply
                    </button>
                  </div>

                  {error && (
                    <p className="text-[11px] font-bold text-[#E53935] mt-1.5 flex items-center gap-1">
                      <AlertCircle size={12} className="shrink-0" />
                      <span>{error}</span>
                    </p>
                  )}
                </form>
              </div>

              {/* No offers matching search query */}
              {filteredOffers.length === 0 && (
                <div
                  className="rounded-2xl p-6 text-center border"
                  style={{ backgroundColor: ui.card, borderColor: ui.line }}
                >
                  <BadgePercent size={32} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-sm font-bold" style={{ color: ui.text }}>
                    {debouncedSearch
                      ? `No coupons matching "${debouncedSearch}"`
                      : "No offers available right now"}
                  </p>
                  <p className="text-xs mt-1" style={{ color: ui.muted }}>
                    Check back soon for new promotions and seasonal discounts.
                  </p>
                </div>
              )}

              {/* Section 1: "Best Offer" (Matching Image 4) */}
              {bestOffer && (
                <section aria-label="Best Offer" className="space-y-2 text-left">
                  <h3 className="text-xs font-bold uppercase tracking-wider px-0.5" style={{ color: ui.text }}>
                    Best Offer
                  </h3>
                  <CouponCard
                    offer={bestOffer}
                    subtotal={subtotal}
                    isApplied={appliedCode === bestOffer.couponCode}
                    onApply={handleApplyCard}
                    onRemove={onRemove}
                    onAddItems={navigateToMenu}
                    ui={ui}
                  />
                </section>
              )}

              {/* Section 2: "Other Offers" (Matching Image 4) */}
              {otherOffers.length > 0 && (
                <section aria-label="Other Offers" className="space-y-2.5 text-left pt-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider px-0.5" style={{ color: ui.text }}>
                    Other Offers
                  </h3>
                  {otherOffers.map((offer) => (
                    <CouponCard
                      key={offer.couponCode}
                      offer={offer}
                      subtotal={subtotal}
                      isApplied={appliedCode === offer.couponCode}
                      onApply={handleApplyCard}
                      onRemove={onRemove}
                      onAddItems={navigateToMenu}
                      ui={ui}
                    />
                  ))}
                </section>
              )}

              <div className="h-6" />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
