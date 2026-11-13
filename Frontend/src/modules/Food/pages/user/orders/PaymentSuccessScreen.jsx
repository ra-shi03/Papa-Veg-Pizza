import React, { useEffect, useMemo, useState, useCallback } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { Check, Loader2, Store, Receipt } from "lucide-react"

const COLORS = ["#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#ffffff", "#f472b6"]

// Shared start time, so the same screen shown first on the cart and then on the tracking page carries on where it was
// (steps already ticked, no entrance animation replayed) instead of starting over.
const sharedStart = () => {
  const now = Date.now()
  const prev = typeof window !== "undefined" ? window.__pvpPaidAt : 0
  if (!prev || now - prev > 8000) {
    if (typeof window !== "undefined") window.__pvpPaidAt = now
    return now
  }
  return prev
}

const makeBurst = (seed) =>
  Array.from({ length: 28 }, (_, i) => ({
    id: `${seed}-${i}`,
    angle: (Math.PI * 2 * i) / 28 + Math.random() * 0.4,
    dist: 110 + Math.random() * 130,
    size: 6 + Math.random() * 6,
    color: COLORS[i % COLORS.length],
    spin: (Math.random() - 0.5) * 540,
  }))

/**
 * Full-screen "you paid" moment shown between the payment and the live order page, so there is never a blank spinner.
 * Tap the badge for more confetti. `paid` says whether the customer paid online (cash orders just say "placed").
 */
export default function PaymentSuccessScreen({ paid = true, scheduled = false }) {
  const reduce = useReducedMotion()
  const [start] = useState(sharedStart)
  const resumed = Date.now() - start > 600
  const [elapsed, setElapsed] = useState(() => Date.now() - start)
  const [bursts, setBursts] = useState(() => [{ key: 0, pieces: makeBurst(0) }])

  useEffect(() => {
    const id = setInterval(() => setElapsed(Date.now() - start), 200)
    return () => clearInterval(id)
  }, [start])

  const pop = useCallback(() => {
    setBursts((list) => [...list.slice(-2), { key: Date.now(), pieces: makeBurst(Date.now()) }])
    try { navigator.vibrate?.(20) } catch (_) {}
  }, [])

  const steps = useMemo(
    () => [
      { icon: Receipt, label: paid ? "Payment received" : "Order received", at: 0 },
      { icon: Store, label: "Sent to the store", at: 1100 },
      { icon: Loader2, label: scheduled ? "Scheduled for your slot" : "Waiting for the store to accept", at: 2200 },
    ],
    [paid, scheduled],
  )
  const doneCount = steps.filter((s) => elapsed >= s.at + 700).length
  const enter = (delay) => (resumed || reduce ? { initial: false } : { initial: { opacity: 0, y: 16 }, transition: { delay } })

  return (
    <motion.div
      className="fixed inset-0 z-[90] flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#FFF4F0] via-white to-[#FDE9E3] px-6 dark:from-[#1b1212] dark:via-[#141010] dark:to-[#1b1212]"
      initial={resumed ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="status"
      aria-live="polite"
    >
      {/* tap target: badge + confetti */}
      <button type="button" onClick={pop} className="relative flex h-40 w-40 cursor-pointer items-center justify-center rounded-full outline-none" aria-label="Celebrate">
        {!reduce && [0, 1].map((i) => (
          <motion.span
            key={i}
            className="absolute inset-0 rounded-full border-2 border-emerald-400/50"
            initial={{ scale: 0.7, opacity: 0.7 }}
            animate={{ scale: 1.6, opacity: 0 }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.9, ease: "easeOut" }}
          />
        ))}
        <motion.span
          className="relative flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_14px_36px_rgba(16,185,129,0.45)]"
          initial={resumed || reduce ? false : { scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 16 }}
          whileTap={{ scale: 0.9 }}
        >
          <svg viewBox="0 0 52 52" className="h-14 w-14" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <motion.path
              d="M14 27 l8 8 l16 -18"
              initial={resumed || reduce ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.35, duration: 0.45, ease: "easeOut" }}
            />
          </svg>
        </motion.span>

        {!reduce && bursts.map((b) =>
          b.pieces.map((p) => (
            <motion.span
              key={p.id}
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 rounded-[2px]"
              style={{ width: p.size, height: p.size * 1.5, backgroundColor: p.color }}
              initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
              animate={{ x: Math.cos(p.angle) * p.dist, y: Math.sin(p.angle) * p.dist + 40, opacity: 0, rotate: p.spin, scale: 0.6 }}
              transition={{ duration: 1.1, ease: "easeOut" }}
            />
          )),
        )}
      </button>

      <motion.h1 {...enter(0.5)} animate={{ opacity: 1, y: 0 }} className="mt-6 text-center text-2xl font-extrabold text-gray-900 dark:text-white">
        {paid ? "Payment successful!" : scheduled ? "Order scheduled!" : "Order placed!"}
      </motion.h1>
      <motion.p {...enter(0.65)} animate={{ opacity: 1, y: 0 }} className="mt-1 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
        Tap the tick for a little celebration
      </motion.p>

      {/* what is happening right now */}
      <motion.ul {...enter(0.8)} animate={{ opacity: 1, y: 0 }} className="mt-8 w-full max-w-xs space-y-3">
        {steps.map((s, i) => {
          const done = i < doneCount
          const active = !done && elapsed >= s.at
          const Icon = s.icon
          return (
            <li key={s.label} className={`flex items-center gap-3 transition-opacity duration-300 ${done || active ? "opacity-100" : "opacity-35"}`}>
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${done ? "bg-emerald-500 text-white" : "bg-white text-[var(--primary)] ring-1 ring-black/10 dark:bg-white/10"}`}>
                <AnimatePresence mode="wait" initial={false}>
                  {done ? (
                    <motion.span key="d" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 14 }}>
                      <Check className="h-4 w-4" strokeWidth={3} />
                    </motion.span>
                  ) : (
                    <motion.span key="i" exit={{ scale: 0 }}>
                      <Icon className={`h-4 w-4 ${active && Icon === Loader2 ? "animate-spin" : ""}`} />
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>
              <span className={`text-sm font-semibold ${done ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-300"}`}>{s.label}</span>
            </li>
          )
        })}
      </motion.ul>

      <div className="mt-8 w-full max-w-xs">
        <div className="h-1.5 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
          <motion.div className="h-full rounded-full bg-[var(--primary)]" initial={{ width: `${Math.min(95, (elapsed / 3500) * 100)}%` }} animate={{ width: "95%" }} transition={{ duration: 3.2, ease: "easeOut" }} />
        </div>
        <p className="mt-2 text-center text-xs font-medium text-gray-400">Opening your live order tracking…</p>
      </div>
    </motion.div>
  )
}
