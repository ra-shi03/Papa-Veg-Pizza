import React from "react"
import { motion, useReducedMotion } from "framer-motion"
import { Check } from "lucide-react"

const STEPS = ["Contact", "Address", "Payment", "Checkout"]

/**
 * The checkout progress: finished steps are filled ticks and can be tapped to go back to them, the current step
 * pulses, the rest are outlined. The line between steps fills up to the current one.
 * `current` is 0-3; `onStepClick(index)` is called for a finished step.
 */
export default function CheckoutStepper({ current = 0, onStepClick, isDarkMode = false }) {
  const reduceMotion = useReducedMotion()
  const progress = STEPS.length > 1 ? current / (STEPS.length - 1) : 0
  const track = isDarkMode ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)"

  return (
    <nav aria-label="Checkout progress" className="px-6 pt-5 pb-4 border-b" style={{ borderColor: isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}>
      <ol className="relative flex items-start justify-between">
        {/* line behind the steps, inset to the first and last step centres */}
        <span aria-hidden className="absolute top-[13px] left-[12.5%] right-[12.5%] h-[3px] rounded-full" style={{ backgroundColor: track }}>
          <motion.span
            className="block h-full rounded-full bg-primary"
            initial={reduceMotion ? false : { width: 0 }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          />
        </span>

        {STEPS.map((label, i) => {
          const done = i < current
          const active = i === current
          const tappable = done && typeof onStepClick === "function"
          const circle = (
            <span
              className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all ${
                done
                  ? "bg-primary border-primary text-white shadow-md shadow-primary/30"
                  : active
                    ? "bg-white dark:bg-[#111111] border-primary ring-4 ring-primary/15"
                    : "bg-white dark:bg-[#111111] border-zinc-300 dark:border-zinc-700"
              }`}
            >
              {done ? (
                <Check className="h-4 w-4 stroke-[3px]" />
              ) : active ? (
                <span className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
              ) : (
                <span className="text-[10px] font-bold text-zinc-400">{i + 1}</span>
              )}
            </span>
          )
          return (
            <li key={label} className="flex w-1/4 flex-col items-center" aria-current={active ? "step" : undefined}>
              {tappable ? (
                <button
                  type="button"
                  onClick={() => onStepClick(i)}
                  aria-label={`Go back to ${label}`}
                  className="flex flex-col items-center border-0 bg-transparent p-0 cursor-pointer active:scale-95 transition-transform"
                >
                  {circle}
                  <span className="mt-1.5 text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 underline-offset-2 hover:underline">{label}</span>
                </button>
              ) : (
                <>
                  {circle}
                  <span className={`mt-1.5 text-[11px] ${active ? "font-extrabold text-primary" : "font-medium text-zinc-400"}`}>{label}</span>
                </>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
