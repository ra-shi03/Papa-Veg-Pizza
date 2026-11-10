import React, { useEffect, useMemo } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { Percent } from "lucide-react"

const CONFETTI_COLORS = ["#ef4444", "#4ade80", "#ffffff", "#60a5fa", "#fbbf24"]

// A scalloped badge outline (12 rounded points), drawn once as an SVG path.
const BADGE_PATH = (() => {
  const points = 12
  const cx = 50
  const cy = 50
  const outer = 48
  const inner = 41
  let d = ""
  for (let i = 0; i < points * 2; i += 1) {
    const r = i % 2 === 0 ? outer : inner
    const a = (Math.PI * i) / points - Math.PI / 2
    d += `${i === 0 ? "M" : "L"}${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)} `
  }
  return `${d}Z`
})()

/**
 * Transparent glass popup for an applied coupon: the whole screen frosts and dims, a glass badge springs in with
 * confetti falling around it, then the code, the saving and a "Yay! Thanks" button. `popup` is { code, saving, at } or
 * null; `onDone` clears it (after ~3s, on the button, or on a tap anywhere).
 */
export default function CouponAppliedPopup({ popup, onDone }) {
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (!popup) return undefined
    const timer = setTimeout(onDone, 3000)
    return () => clearTimeout(timer)
  }, [popup, onDone])

  const confetti = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 1.6 + Math.random() * 1.4,
        drift: (Math.random() - 0.5) * 90,
        spin: (Math.random() - 0.5) * 720,
        w: 5 + Math.random() * 6,
        h: 8 + Math.random() * 8,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      })),
    // a fresh burst every time a coupon is applied
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [popup?.at],
  )

  return (
    <AnimatePresence>
      {popup && (
        <motion.div
          key={popup.at}
          className="fixed inset-0 z-[70] flex items-center justify-center overflow-hidden px-8"
          style={{
            backgroundColor: "rgba(24,24,28,0.42)",
            backdropFilter: "blur(10px) saturate(140%)",
            WebkitBackdropFilter: "blur(10px) saturate(140%)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onDone}
          role="status"
          aria-live="polite"
        >
          {!reduceMotion &&
            confetti.map((c) => (
              <motion.span
                key={c.id}
                aria-hidden
                className="pointer-events-none absolute top-0 rounded-[2px]"
                style={{ left: `${c.left}%`, width: c.w, height: c.h, backgroundColor: c.color }}
                initial={{ y: -30, x: 0, rotate: 0, opacity: 0 }}
                animate={{ y: "105vh", x: c.drift, rotate: c.spin, opacity: [0, 1, 1, 0.8] }}
                transition={{ duration: c.duration, delay: c.delay, ease: "easeIn" }}
              />
            ))}

          <div className="relative flex flex-col items-center text-center">
            <motion.div
              className="relative h-32 w-32"
              initial={reduceMotion ? false : { scale: 0, rotate: -25, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 17, delay: 0.05 }}
            >
              <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
                <defs>
                  <linearGradient id="couponGlass" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.42)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0.12)" />
                  </linearGradient>
                </defs>
                <path d={BADGE_PATH} fill="url(#couponGlass)" stroke="rgba(255,255,255,0.65)" strokeWidth="1.2" strokeLinejoin="round" />
              </svg>
              <motion.span
                className="absolute inset-0 flex items-center justify-center"
                initial={reduceMotion ? false : { scale: 0.4, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 380, damping: 14, delay: 0.25 }}
              >
                <Percent size={58} strokeWidth={3} color="#ffffff" />
              </motion.span>
            </motion.div>

            <motion.p
              className="mt-5 text-[22px] font-extrabold leading-tight text-white"
              style={{ textShadow: "0 2px 12px rgba(0,0,0,0.45)" }}
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.3 }}
            >
              {popup.code} applied!
            </motion.p>
            {popup.saving > 0 && (
              <motion.p
                className="mt-1 text-base font-semibold"
                style={{ color: "#bbf7d0", textShadow: "0 2px 10px rgba(0,0,0,0.45)" }}
                initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.3 }}
              >
                You save ₹{popup.saving} on this order
              </motion.p>
            )}

            <motion.button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onDone()
              }}
              className="mt-5 cursor-pointer rounded-xl px-5 py-2 text-sm font-bold text-white active:scale-95"
              style={{
                background: "rgba(255,255,255,0.16)",
                border: "1px solid rgba(255,255,255,0.45)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
              }}
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.3 }}
            >
              Yay! Thanks
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
