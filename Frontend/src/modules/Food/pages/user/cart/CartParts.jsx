import React, { useEffect, useRef, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { Trash2 } from "lucide-react"

export const haptic = (ms = 8) => {
  try {
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(ms)
  } catch (_) {}
}

const formatMoney = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(2))

// Counts up/down to the new value so price changes are noticed instead of silently swapping.
export function AnimatedNumber({ value, prefix = "₹" }) {
  const reduce = useReducedMotion()
  const [shown, setShown] = useState(value)
  const from = useRef(value)

  useEffect(() => {
    if (reduce || from.current === value) {
      from.current = value
      setShown(value)
      return undefined
    }
    const start = performance.now()
    const startValue = from.current
    const duration = 380
    let frame
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setShown(Number((startValue + (value - startValue) * eased).toFixed(2)))
      if (t < 1) frame = requestAnimationFrame(tick)
      else from.current = value
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value, reduce])

  return <>{prefix}{formatMoney(shown)}</>
}

// Quantity number that pops briefly when it changes.
function PopNumber({ value, color }) {
  const reduce = useReducedMotion()
  return (
    <motion.span
      key={value}
      initial={reduce ? false : { scale: 1.4, opacity: 0.4 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 22 }}
      className="min-w-[18px] text-center text-sm font-semibold inline-block"
      style={{ color }}
    >
      {value}
    </motion.span>
  )
}

const SWIPE_REMOVE_AT = -90

// One cart line. Swipe left to remove (Undo is offered by the parent); the stepper removes at 1.
export function CartItemRow({ item, index, ui, onQty, onRemove }) {
  const reduce = useReducedMotion()
  const [imgFailed, setImgFailed] = useState(false)

  return (
    <motion.div
      layout={!reduce}
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0, transition: { duration: 0.22 } }}
      transition={{ duration: 0.25, delay: reduce ? 0 : Math.min(index, 5) * 0.04 }}
      className="relative overflow-hidden"
      style={index > 0 ? { borderTop: `1px dashed ${ui.line}` } : undefined}
    >
      {/* Revealed while swiping */}
      <div className="absolute inset-y-0 right-0 w-28 flex items-center justify-center gap-1.5 text-white text-sm font-semibold" style={{ backgroundColor: "#d32f3a" }} aria-hidden="true">
        <Trash2 size={16} /> Remove
      </div>

      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -120, right: 0 }}
        dragElastic={{ left: 0.15, right: 0 }}
        onDragEnd={(_, info) => {
          if (info.offset.x < SWIPE_REMOVE_AT) {
            haptic(14)
            onRemove()
          }
        }}
        whileTap={{ cursor: "grabbing" }}
        className="relative p-4 flex items-start gap-3 touch-pan-y"
        style={{ backgroundColor: ui.card }}
      >
        <span className="mt-1 inline-flex items-center justify-center border-2 border-[#3ce36a] rounded-[3px] w-4 h-4 shrink-0">
          <span className="rounded-full bg-[#3ce36a] w-1.5 h-1.5" />
        </span>

        {item.image && !imgFailed && (
          <img
            src={item.image}
            alt=""
            draggable={false}
            onError={() => setImgFailed(true)}
            className="w-12 h-12 rounded-lg object-cover shrink-0"
            style={{ backgroundColor: ui.line }}
          />
        )}

        <div className="flex-1 min-w-0 text-left">
          <h4 className="text-[15px] font-semibold leading-snug" style={{ color: ui.text }}>{item.name}</h4>
          {item.size && <p className="text-xs mt-0.5" style={{ color: ui.muted }}>{item.size}</p>}
          {item.description && item.kind !== "addon" && item.kind !== "topping" && (
            <p className="text-xs mt-0.5 line-clamp-2" style={{ color: ui.muted }}>{item.description}</p>
          )}
          {item.isLimitedOffer && (
            <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: "#1b8a3a" }}>
              LIMITED TIME OFFER
            </span>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="flex items-center rounded-lg h-8 select-none" style={{ border: `1px solid ${ui.line}` }}>
            <button
              onClick={() => { haptic(); onQty(-1) }}
              aria-label={item.quantity === 1 ? `Remove ${item.name}` : `Decrease ${item.name}`}
              className="w-8 h-full bg-transparent border-0 cursor-pointer text-lg active:scale-90 transition-transform"
              style={{ color: ui.text }}
            >
              {item.quantity === 1 ? <Trash2 size={14} className="mx-auto" /> : "−"}
            </button>
            <PopNumber value={item.quantity} color={ui.text} />
            <button
              onClick={() => { haptic(); onQty(1) }}
              disabled={item.isLimitedOffer}
              aria-label={`Increase ${item.name}`}
              className="w-8 h-full bg-transparent border-0 cursor-pointer text-lg disabled:opacity-30 active:scale-90 transition-transform"
              style={{ color: ui.text }}
            >
              +
            </button>
          </div>
          <p className="text-sm font-bold" style={{ color: ui.text }}>
            <AnimatedNumber value={item.price * item.quantity} />
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Placeholder shown while the cart is being resolved, so the page never flashes "empty".
export function CartSkeleton({ ui }) {
  const bar = (w, h = 12) => (
    <div className="rounded animate-pulse" style={{ width: w, height: h, backgroundColor: ui.line }} />
  )
  return (
    <div className="px-4 pt-4 space-y-4" aria-busy="true" aria-label="Loading your cart">
      <div className="rounded-2xl p-4 flex items-center gap-4" style={{ backgroundColor: ui.card }}>
        <div className="space-y-2">{bar(56, 10)}{bar(80, 22)}</div>
        <div className="flex-1 space-y-2">{bar("90%")}{bar("60%")}</div>
      </div>
      <div className="rounded-2xl p-4 space-y-4" style={{ backgroundColor: ui.card }}>
        {[0, 1].map((i) => (
          <div key={i} className="flex gap-3">
            {bar(48, 48)}
            <div className="flex-1 space-y-2">{bar("70%", 14)}{bar("40%")}</div>
            {bar(70, 32)}
          </div>
        ))}
      </div>
      <div className="rounded-2xl p-4 space-y-3" style={{ backgroundColor: ui.card }}>{bar("50%", 14)}{bar("100%", 40)}</div>
    </div>
  )
}
