import React, { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { ChevronLeft, Banknote, ShieldCheck, AlertTriangle, Check } from "lucide-react"
import { toast } from "sonner"
import AnimatedPage from "@food/components/user/AnimatedPage"
import { useAppConfig } from "@food/context/AppConfigContext"
import { PAYMENT_METHODS, readPaymentMethod } from "../cart/cartHelpers"

/**
 * Payment Options: how the customer pays. The choice is kept on the device and read by the cart's pay bar and by
 * checkout. Opened from the cart (or checkout) it shows the amount to pay and goes back once a method is picked.
 */
export default function Payments() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const { config: appConfig } = useAppConfig()
  const cameFromCart = state?.from === "cart" || state?.from === "checkout"
  const total = Number(state?.total)

  const [isDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("appTheme")
    return savedTheme ? savedTheme === "dark" : false
  })

  const [selected, setSelected] = useState(() => readPaymentMethod(appConfig).id)

  const onlineDisabled = appConfig?.paymentOptionEnabled === false
  const cashDisabled = appConfig?.codEnabled === false

  const choose = (id, disabled) => {
    if (disabled) {
      toast.error("This payment option is not available right now.")
      return
    }
    setSelected(id)
    try {
      localStorage.setItem("preferred_payment_method", id)
    } catch (_) {}
    toast.success(`${PAYMENT_METHODS[id].title} selected`)
    if (cameFromCart) setTimeout(() => navigate(-1), 250)
  }

  const ui = isDarkMode
    ? { page: "#111111", card: "#1b1b1d", line: "rgba(255,255,255,0.08)", text: "#f4f4f5", muted: "#a1a1aa" }
    : { page: "#F5F3EF", card: "#ffffff", line: "rgba(0,0,0,0.07)", text: "#1c1b1b", muted: "#71717a" }

  const Radio = ({ on, disabled }) => (
    <span
      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all"
      style={{ borderColor: on ? "#E53935" : isDarkMode ? "#52525b" : "#d4d4d8", backgroundColor: on ? "#E53935" : "transparent", opacity: disabled ? 0.5 : 1 }}
    >
      {on && <Check size={12} strokeWidth={3.5} color="#fff" />}
    </span>
  )

  const Section = ({ title, children }) => (
    <section className="mt-5">
      <h2 className="px-4 text-[15px] font-extrabold" style={{ color: ui.text }}>{title}</h2>
      <div className="mx-3 mt-2 overflow-hidden rounded-xl border" style={{ backgroundColor: ui.card, borderColor: ui.line }}>{children}</div>
    </section>
  )

  return (
    <AnimatedPage className="flex min-h-screen flex-col transition-colors duration-300">
      <div className="flex min-h-screen flex-1 flex-col pb-10" style={{ backgroundColor: ui.page }}>
      <header
        className="fixed top-0 left-1/2 z-50 flex h-16 w-full max-w-md -translate-x-1/2 items-center gap-2 border-b px-3"
        style={{ backgroundColor: ui.card, borderColor: ui.line, color: ui.text }}
      >
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="flex items-center justify-center rounded-full border-0 bg-transparent p-2 cursor-pointer active:scale-95"
          style={{ color: ui.text }}
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <div className="text-left">
          <h1 className="text-lg font-bold leading-tight">Payment Options</h1>
          {Number.isFinite(total) && total > 0 && (
            <p className="text-xs leading-tight" style={{ color: ui.muted }}>To Pay: ₹{Number(total.toFixed(2))}</p>
          )}
        </div>
      </header>

      <main className="mx-auto mt-16 w-full max-w-md flex-1 select-none pt-1">
        {(onlineDisabled || cashDisabled) && (
          <div className="mx-3 mt-4 flex items-start gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3.5 text-left text-xs text-amber-800 dark:text-amber-300">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-500" />
            <div>
              <p className="font-bold">{onlineDisabled && cashDisabled ? "Payments are switched off" : onlineDisabled ? "Online payments are switched off" : "Cash on delivery is switched off"}</p>
              <p className="mt-0.5 text-[11px] opacity-90">The store administrator has turned these off. Pick one of the available options.</p>
            </div>
          </div>
        )}

        <Section title="Pay on Delivery">
          <button
            type="button"
            onClick={() => choose("cash", cashDisabled)}
            className="flex w-full items-center gap-3 border-0 bg-transparent px-4 py-4 text-left cursor-pointer"
            style={{ opacity: cashDisabled ? 0.55 : 1 }}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border" style={{ borderColor: ui.line, color: ui.text }}>
              <Banknote size={20} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold" style={{ color: ui.text }}>Cash / UPI on Delivery</span>
              <span className="mt-0.5 block text-xs" style={{ color: ui.muted }}>Pay the delivery partner in cash, or scan a UPI QR when your order arrives.</span>
            </span>
            <Radio on={selected === "cash"} disabled={cashDisabled} />
          </button>
        </Section>

        <Section title="Pay Online">
          <button
            type="button"
            onClick={() => choose("razorpay_test", onlineDisabled)}
            className="flex w-full items-center gap-3 border-0 bg-transparent px-4 py-4 text-left cursor-pointer"
            style={{ opacity: onlineDisabled ? 0.55 : 1 }}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border" style={{ borderColor: ui.line, color: "#2563eb" }}>
              <ShieldCheck size={20} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2 text-[15px] font-semibold" style={{ color: ui.text }}>
                Razorpay
                <span className="rounded px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide" style={{ backgroundColor: "rgba(229,57,53,0.12)", color: "#E53935" }}>Test mode</span>
              </span>
              <span className="mt-0.5 block text-xs" style={{ color: ui.muted }}>UPI, cards, wallets and net banking through Razorpay. Test mode: no real money is charged.</span>
            </span>
            <Radio on={selected === "razorpay_test"} disabled={onlineDisabled} />
          </button>
        </Section>

        {!cameFromCart && (
          <p className="mx-4 mt-5 text-left text-[11px]" style={{ color: ui.muted }}>
            Your choice is used at checkout. You can change it any time from the cart.
          </p>
        )}
      </main>
      </div>
    </AnimatedPage>
  )
}
