import React, { useMemo, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { Tag, Sparkles, ChevronRight, Lock, Check, Info } from "lucide-react"
import { offerDiscount } from "./cartHelpers"

/** Offers sorted for the cart: usable ones first (biggest saving first), then closest to unlock. */
export function rankOffers(offers, subtotal) {
  return [...offers].sort((a, b) => {
    const sa = offerDiscount(a, subtotal)
    const sb = offerDiscount(b, subtotal)
    if ((sa > 0) !== (sb > 0)) return sa > 0 ? -1 : 1
    if (sa !== sb) return sb - sa
    return (a.minOrderValue - subtotal) - (b.minOrderValue - subtotal)
  })
}

/**
 * Individual perforated ticket coupon card matching Image 5:
 * - Scalloped / semicircular edge notches
 * - Dashed coupon code badge with Tag icon
 * - Green savings text
 * - "Yay! You unlocked this offer" or "Add ₹X more to unlock"
 * - Red outline "Apply" button or green "Applied ✓"
 * - Green progress bar at bottom
 */
function CouponTicket({ offer, subtotal, isApplied, onApply, onRemove, onView, ui }) {
  const saving = offerDiscount(offer, subtotal)
  const minOrder = Number(offer.minOrderValue) || 0
  const isUnlocked = subtotal >= minOrder
  const short = Math.max(0, Math.ceil(minOrder - subtotal))
  const progress = minOrder > 0 ? Math.min(100, Math.round((subtotal / minOrder) * 100)) : 100

  return (
    <div
      className="relative rounded-xl border p-3 overflow-hidden transition-all text-left"
      style={{
        backgroundColor: ui.dark ? "rgba(255, 255, 255, 0.04)" : "#ffffff",
        borderColor: isApplied ? "#10b981" : ui.line,
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)"
      }}
    >
      {/* Semicircular ticket punch-out notches on left & right */}
      <span
        className="absolute -left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border pointer-events-none"
        style={{
          backgroundColor: ui.card,
          borderColor: ui.line
        }}
      />
      <span
        className="absolute -right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border pointer-events-none"
        style={{
          backgroundColor: ui.card,
          borderColor: ui.line
        }}
      />

      {/* Top row: Coupon Code Tag + Savings + Action button */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <div
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-dashed text-[12px] font-bold tracking-wide"
            style={{
              borderColor: ui.dark ? "rgba(255,255,255,0.25)" : "#cbd5e1",
              backgroundColor: ui.dark ? "rgba(255,255,255,0.06)" : "#f8fafc",
              color: ui.text
            }}
          >
            <Tag size={12} className="text-[#3b82f6] shrink-0" />
            <span>{offer.couponCode}</span>
          </div>

          <span className="text-[12px] font-bold text-[#16a34a]">
            {isApplied
              ? `Applied: Saved ₹${saving}`
              : saving > 0
              ? `Save ₹${saving}`
              : offer.discountPercent
              ? `${offer.discountPercent}% OFF`
              : `Flat ₹${offer.discountAmount || 0} OFF`}
          </span>
        </div>

        {isApplied ? (
          <button
            type="button"
            onClick={onRemove}
            className="shrink-0 px-3 py-1 rounded-lg text-xs font-bold border border-[#16a34a] text-[#16a34a] bg-emerald-50 dark:bg-emerald-950/40 cursor-pointer active:scale-95 transition-all flex items-center gap-1"
          >
            <Check size={12} strokeWidth={2.5} /> Applied
          </button>
        ) : isUnlocked ? (
          <button
            type="button"
            onClick={() => onApply(offer)}
            className="shrink-0 px-3.5 py-1 rounded-lg text-xs font-bold border border-[#E53935] text-[#E53935] bg-transparent hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer active:scale-95 transition-all"
          >
            Apply
          </button>
        ) : (
          <button
            type="button"
            onClick={onView}
            className="shrink-0 px-3 py-1 rounded-lg text-xs font-semibold text-gray-400 border border-gray-300 dark:border-zinc-700 bg-transparent cursor-pointer active:scale-95 transition-all"
          >
            View
          </button>
        )}
      </div>

      {/* Middle row: Unlock status badge */}
      <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold">
        {isUnlocked ? (
          <span className="flex items-center gap-1 text-[#16a34a]">
            <Sparkles size={13} className="shrink-0" />
            Yay! You unlocked this offer
          </span>
        ) : (
          <span className="flex items-center gap-1" style={{ color: ui.muted }}>
            <Lock size={12} className="shrink-0" />
            Add ₹{short} more to unlock
          </span>
        )}
      </div>

      {/* Bottom row: Progress bar */}
      <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ backgroundColor: ui.line }}>
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${progress}%`,
            backgroundColor: isUnlocked ? "#16a34a" : "#3b82f6"
          }}
        />
      </div>
    </div>
  )
}

/**
 * "Savings & Rewards": coupon ticket UI matching Image 5.
 */
export default function CartOffers({
  offers = [],
  subtotal = 0,
  applied,
  rejectedReason,
  deliverySaved = 0,
  freeDelivery = false,
  onApply,
  onRemove,
  onViewAll,
  ui,
}) {
  const reduce = useReducedMotion()

  // 1. Filter strictly active coupons
  const activeOffers = useMemo(() => {
    return (offers || []).filter((o) => {
      const s = String(o.status || "active").toLowerCase()
      if (s !== "active" && s !== "published") return false
      if (o.isActive === false) return false
      if (o.showInCart === false) return false
      if (o.endDate && new Date(o.endDate) <= new Date()) return false
      return true
    })
  }, [offers])

  // 2. Count unlocked vs total
  const unlockedOffers = useMemo(() => {
    return activeOffers.filter((o) => subtotal >= (Number(o.minOrderValue) || 0))
  }, [activeOffers, subtotal])

  // 3. Ranked offers for display (applied first, then ranked)
  const ranked = useMemo(() => {
    const list = rankOffers(activeOffers, subtotal)
    if (!applied) return list
    return [applied, ...list.filter((o) => o.couponCode !== applied.couponCode)]
  }, [activeOffers, subtotal, applied])

  // Limit to top 2-3 in cart view to match reference card height
  const displayOffers = useMemo(() => {
    return ranked.slice(0, 2)
  }, [ranked])

  // Smallest shortfall needed to unlock the next active coupon
  const closestShortfall = useMemo(() => {
    const locked = activeOffers.filter((o) => (Number(o.minOrderValue) || 0) > subtotal)
    if (locked.length === 0) return null
    return Math.min(...locked.map((o) => Math.ceil((Number(o.minOrderValue) || 0) - subtotal)))
  }, [activeOffers, subtotal])

  const appliedSaving = applied ? offerDiscount(applied, subtotal) : 0

  return (
    <section aria-label="Savings & Rewards" className="space-y-2">
      {/* Centered Section Divider: ── SAVINGS & REWARDS ── */}
      <div className="flex items-center justify-center gap-3 my-1">
        <div className="h-[1px] flex-1 max-w-[70px]" style={{ backgroundColor: ui.line }} />
        <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: ui.muted }}>
          Savings &amp; Rewards
        </span>
        <div className="h-[1px] flex-1 max-w-[70px]" style={{ backgroundColor: ui.line }} />
      </div>

      {/* Main Container Card matching Image 5 */}
      <div
        className="rounded-2xl border p-3.5 space-y-3 text-left shadow-sm"
        style={{
          backgroundColor: ui.card,
          borderColor: ui.line,
        }}
      >
        {/* Top Free Delivery / Savings Banner */}
        {(freeDelivery || deliverySaved > 0) ? (
          <div
            className="rounded-xl px-3 py-2 flex items-center justify-between text-xs font-bold"
            style={{
              backgroundColor: ui.dark ? "rgba(22, 163, 74, 0.18)" : "#e8f5ec",
              color: ui.dark ? "#86efac" : "#166534",
            }}
          >
            <span>You saved ₹{deliverySaved || 45} with FREE Delivery 🎊</span>
          </div>
        ) : (
          <div
            className="rounded-xl px-3 py-2 flex items-center justify-between text-xs font-bold"
            style={{
              backgroundColor: ui.dark ? "rgba(255, 255, 255, 0.05)" : "#f8fafc",
              color: ui.text,
            }}
          >
            <span>Unlock exclusive savings &amp; discounts on your meal 🎊</span>
          </div>
        )}

        {/* Subheader: Best Offers + X/Y Unlocked */}
        <div className="flex items-center justify-between px-0.5">
          <h3 className="text-sm font-extrabold" style={{ color: ui.text }}>
            Best Offers
          </h3>
          {activeOffers.length > 0 && (
            <span className="text-xs font-semibold" style={{ color: ui.muted }}>
              {unlockedOffers.length}/{activeOffers.length} Unlocked 🎊
            </span>
          )}
        </div>

        {/* Stacked Ticket Cards */}
        {displayOffers.length > 0 ? (
          <div className="space-y-2.5">
            {displayOffers.map((offer) => (
              <CouponTicket
                key={offer.couponCode}
                offer={offer}
                subtotal={subtotal}
                isApplied={applied?.couponCode === offer.couponCode && !rejectedReason && appliedSaving > 0}
                onApply={onApply}
                onRemove={onRemove}
                onView={onViewAll}
                ui={ui}
              />
            ))}
          </div>
        ) : (
          <div
            className="rounded-xl p-3 border text-left"
            style={{ backgroundColor: ui.soft, borderColor: ui.line }}
          >
            <p className="text-xs font-bold" style={{ color: ui.text }}>
              No eligible coupons available
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: ui.muted }}>
              {closestShortfall
                ? `Add items worth ₹${closestShortfall} more to unlock promotional discounts.`
                : "There are currently no promotional coupons applicable to this order."}
            </p>
          </div>
        )}

        {/* Bottom Link: View all X offers > */}
        {activeOffers.length > 0 && (
          <button
            type="button"
            onClick={onViewAll}
            className="w-full pt-1 pb-0.5 text-center text-xs font-bold text-[#E53935] bg-transparent border-0 cursor-pointer flex items-center justify-center gap-1 hover:underline active:opacity-75 transition-opacity"
          >
            <span>View all {activeOffers.length} offers</span>
            <ChevronRight size={14} />
          </button>
        )}
      </div>

      {/* Applied alert or rejection toast */}
      {applied && (
        <motion.div
          key={`${applied.couponCode}-${appliedSaving}-${rejectedReason || ""}`}
          initial={reduce ? false : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl px-3 py-2 flex items-center justify-between gap-2 text-xs font-semibold"
          style={
            rejectedReason
              ? { backgroundColor: ui.dark ? "rgba(245,158,11,0.14)" : "#fff7e6", color: ui.dark ? "#fbbf24" : "#92400e" }
              : { backgroundColor: ui.dark ? "rgba(22, 163, 74, 0.18)" : "#e8f5ec", color: ui.dark ? "#86efac" : "#166534" }
          }
        >
          <span className="truncate">
            {rejectedReason ? (
              <><b>{applied.couponCode}</b>: {rejectedReason}</>
            ) : (
              <><b>{applied.couponCode}</b> applied · saved <b>₹{appliedSaving}</b></>
            )}
          </span>
          <button
            type="button"
            onClick={onRemove}
            className="shrink-0 text-xs font-bold underline bg-transparent border-0 cursor-pointer"
            style={{ color: "inherit" }}
          >
            Remove
          </button>
        </motion.div>
      )}
    </section>
  )
}

/**
 * Cheesy Rewards Section matching Image 5:
 * - Header: Cheesy Rewards ⓘ on left, Your points: X on right
 * - Body: Add items worth ₹51 more to earn 100 Cheesy Reward points on left,
 *   and red outline "Add Items" button on right.
 */
export function CheesyRewardsCard({ subtotal = 0, ui, onAddItems, isDarkMode }) {
  // Papa Veg Pizza standard threshold to earn 100 Cheesy Reward points is ₹350
  const rewardThreshold = 350
  const pointsEarned = 100
  const shortfall = Math.max(0, Math.ceil(rewardThreshold - subtotal))
  const isUnlocked = shortfall === 0

  // Points balance (reads from user session or defaults to 0)
  const [points] = useState(() => {
    try {
      const stored = localStorage.getItem("user_rewards_points") || localStorage.getItem("pvp_cheesy_points")
      return stored ? Number(stored) : 0
    } catch (_) {
      return 0
    }
  })

  return (
    <div
      className="rounded-2xl border p-4 shadow-sm text-left transition-colors"
      style={{
        backgroundColor: ui.card,
        borderColor: ui.line,
      }}
    >
      {/* Top Header Row: Cheesy Rewards ⓘ ... Your points: 0 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-[14px] font-extrabold" style={{ color: ui.text }}>
            Cheesy Rewards
          </span>
          <button
            type="button"
            aria-label="Cheesy rewards details"
            onClick={() => {
              const base = window.location.pathname.startsWith("/food") ? "/food" : ""
              window.location.href = `${base}/user/rewards`
            }}
            className="w-4 h-4 rounded-full border flex items-center justify-center text-[10px] font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer bg-transparent"
            style={{ borderColor: ui.line }}
            title="View Cheesy Rewards"
          >
            <Info size={10} />
          </button>
        </div>

        <span className="text-xs font-semibold" style={{ color: ui.muted }}>
          Your points: <b style={{ color: ui.text }}>{points}</b>
        </span>
      </div>

      {/* Bottom Row: Shortfall / Congratulation text + Add Items button */}
      <div
        className="mt-3 pt-3 flex items-center justify-between gap-3"
        style={{ borderTop: `1px dashed ${ui.line}` }}
      >
        <p className="text-xs leading-relaxed flex-1 min-w-0" style={{ color: ui.text }}>
          {isUnlocked ? (
            <span className="text-[#16a34a] font-bold">
              🎉 You will earn {pointsEarned} Cheesy Reward points on this order!
            </span>
          ) : (
            <span>
              Add items worth <b className="text-[#E53935]">₹{shortfall}</b> more to earn{" "}
              <b>{pointsEarned}</b> Cheesy Reward points
            </span>
          )}
        </p>

        {!isUnlocked && (
          <button
            type="button"
            onClick={onAddItems}
            className="shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-bold border border-[#E53935] text-[#E53935] bg-transparent hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer active:scale-95 transition-all"
          >
            Add Items
          </button>
        )}
      </div>
    </div>
  )
}
