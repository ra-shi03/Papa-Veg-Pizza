import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ChevronRight, ShoppingCart, ChevronsRight, Clock, X, Plus } from "lucide-react"
import {
  OFFER_KEY_PREFIX,
  addSuggestionToCart,
  claimOffer,
  fetchCartConfig,
  fetchSuggestions,
  readCartSummary,
  suggestionKey,
} from "./upsellApi"

const PRIMARY = "#E53935"
const NO_PRODUCTS = []

const CACHE_MS = 4000
const requestCache = new Map()
const cached = (key, load) => {
  const hit = requestCache.get(key)
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.promise
  const promise = load()
  requestCache.set(key, { at: Date.now(), promise })
  promise.catch(() => requestCache.delete(key))
  return promise
}

const useCartConfig = () => {
  const [config, setConfig] = useState(null)
  useEffect(() => {
    let active = true
    cached("config", fetchCartConfig)
      .then((data) => active && setConfig(data))
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])
  return config
}

// Re-reads the shared cart whenever the menu / cart page changes it.
const useCartSummary = (products) => {
  const [summary, setSummary] = useState(() => readCartSummary(products))
  useEffect(() => {
    const sync = () => setSummary(readCartSummary(products))
    sync()
    window.addEventListener("cartUpdated", sync)
    window.addEventListener("storage", sync)
    return () => {
      window.removeEventListener("cartUpdated", sync)
      window.removeEventListener("storage", sync)
    }
  }, [products])
  return summary
}

const useSuggestions = (cartIds, enabled) => {
  const [data, setData] = useState(null)
  const idsKey = cartIds.join(",")
  useEffect(() => {
    if (!enabled) return undefined
    let active = true
    const timer = setTimeout(() => {
      cached(`suggestions:${idsKey}`, () => fetchSuggestions(idsKey ? idsKey.split(",") : []))
        .then((res) => active && setData(res))
        .catch(() => {})
    }, 250)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [idsKey, enabled])
  return data
}

function VegMark({ size = 14 }) {
  return (
    <span
      className="inline-flex items-center justify-center border-2 border-[#3ce36a] bg-white rounded-[3px]"
      style={{ width: size, height: size }}
    >
      <span className="rounded-full bg-[#3ce36a]" style={{ width: size / 2.4, height: size / 2.4 }} />
    </span>
  )
}

// ---------------------------------------------------------------------------------------------
// Menu: bottom bar with "Complete your order" strip and View Cart
// ---------------------------------------------------------------------------------------------

export function CartBottomBar({ products = NO_PRODUCTS, dark = false, onViewCart, onHeightChange }) {
  const config = useCartConfig()
  const summary = useCartSummary(products)
  const barRef = useRef(null)

  const visible = !!config?.bottomBar?.enabled && summary.count > 0

  useEffect(() => {
    if (!onHeightChange) return undefined
    const el = barRef.current
    if (!visible || !el) {
      onHeightChange(0)
      return undefined
    }
    const report = () => onHeightChange(el.offsetHeight)
    report()
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(report) : null
    observer?.observe(el)
    return () => {
      observer?.disconnect()
      onHeightChange(0)
    }
  }, [visible, onHeightChange])

  if (!visible) return null

  const surface = dark ? "bg-[#18181a] text-white" : "bg-white text-zinc-900"

  return (
    <div ref={barRef} className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50">
      <div className={`${surface} rounded-t-2xl shadow-[0_-6px_24px_rgba(0,0,0,0.15)] overflow-hidden`}>
        {config.bottomBar.freeDeliveryText && (
          <p className={`px-4 pb-2 text-xs font-medium ${dark ? "text-emerald-400" : "text-emerald-700"}`}>
            {config.bottomBar.freeDeliveryText}
          </p>
        )}

        <div className="px-3 pb-3 pt-1">
          <button
            type="button"
            onClick={onViewCart}
            className="w-full border-0 cursor-pointer text-white rounded-xl h-12 px-4 flex items-center justify-between active:scale-[0.99] transition-transform"
            style={{ backgroundColor: PRIMARY }}
          >
            <span className="text-sm font-medium">{summary.count} {summary.count === 1 ? "Item" : "Items"} · ₹{Math.round(summary.total)}</span>
            <span className="flex items-center gap-2 text-sm font-bold">
              <span className="relative">
                <ShoppingCart size={20} />
                <span className="absolute -top-2 -right-2 bg-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center" style={{ color: PRIMARY }}>
                  {summary.count}
                </span>
              </span>
              {config.bottomBar.ctaText || "View Cart"}
              <ChevronRight size={18} />
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------------------------
// Menu: "Complete your order now" strip shown right under a pizza card once that pizza is in the cart
// ---------------------------------------------------------------------------------------------

export function InlineUpsell({ productId, products = NO_PRODUCTS, dark = false }) {
  const config = useCartConfig()
  const summary = useCartSummary(products)
  const inCart = summary.ids.includes(String(productId))
  const enabled = inCart && !!config?.bottomBar?.showUpsell && !!config?.upsell?.enabled
  const data = useSuggestions(summary.ids, enabled)
  const items = data?.items || []

  if (!enabled || items.length === 0) return null

  const surface = dark ? "bg-[#18181a] text-white" : "bg-white text-zinc-900"
  const muted = dark ? "text-zinc-400" : "text-zinc-500"

  return (
    <div className={`${surface} w-full pt-3 pb-3 border-y ${dark ? "border-zinc-800" : "border-zinc-200"}`} onClick={(e) => e.stopPropagation()}>
      <h3 className="px-4 text-sm font-bold">{data?.title || "Complete your order now"}</h3>
      <div className="flex gap-3 overflow-x-auto px-4 pt-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item) => (
          <div
            key={suggestionKey(item)}
            className={`shrink-0 w-[150px] rounded-xl overflow-hidden border ${dark ? "border-zinc-700 bg-zinc-900" : "border-zinc-200 bg-white"}`}
          >
            <div className="relative h-[84px] bg-zinc-100">
              {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" loading="lazy" />}
              <span className="absolute top-1.5 left-1.5"><VegMark size={13} /></span>
            </div>
            <div className="p-2">
              <p className="text-xs font-semibold leading-tight line-clamp-2 min-h-[30px]">{item.name}</p>
              <div className="flex items-center justify-between mt-1.5">
                <span className={`text-xs font-medium ${muted}`}>₹{item.price}</span>
                <button
                  type="button"
                  onClick={() => addSuggestionToCart(item)}
                  className="border-0 cursor-pointer text-white text-xs font-bold rounded-md px-2.5 py-1 flex items-center gap-0.5"
                  style={{ backgroundColor: PRIMARY }}
                >
                  Add <Plus size={12} strokeWidth={3} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------------------------
// Cart page: "Complete your meal with" (category chips + cards)
// ---------------------------------------------------------------------------------------------

export function CartMealSuggestions({ dark = false, cartIds = [] }) {
  const config = useCartConfig()
  const enabled = !!config?.upsell?.enabled
  const data = useSuggestions(cartIds, enabled)
  const [group, setGroup] = useState("All")

  const items = data?.items || []
  const groups = data?.groups || []
  const visibleItems = useMemo(
    () => (group === "All" ? items : items.filter((i) => i.group === group)),
    [items, group]
  )

  useEffect(() => {
    if (group !== "All" && !groups.includes(group)) setGroup("All")
  }, [groups, group])

  if (!enabled || items.length === 0) return null

  const textMain = dark ? "text-white" : "text-[#131313]"
  const muted = dark ? "text-zinc-400" : "text-zinc-500"

  return (
    <section className="mt-6">
      <div className="flex items-center gap-3 px-5">
        <div className={`flex-1 h-px ${dark ? "bg-zinc-700" : "bg-zinc-300"}`} />
        <h3 className={`text-sm font-semibold ${muted}`}>{data?.cartTitle || "Complete Your Meal With"}</h3>
        <div className={`flex-1 h-px ${dark ? "bg-zinc-700" : "bg-zinc-300"}`} />
      </div>

      {data?.showCategoryChips && groups.length > 1 && (
        <div className="flex gap-2 overflow-x-auto px-5 pt-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {["All", ...groups].map((g) => {
            const active = g === group
            return (
              <button
                key={g}
                type="button"
                onClick={() => setGroup(g)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium cursor-pointer border ${
                  active
                    ? "bg-zinc-900 text-white border-zinc-900"
                    : dark ? "bg-transparent text-zinc-300 border-zinc-600" : "bg-white text-zinc-700 border-zinc-300"
                }`}
              >
                {g}
              </button>
            )
          })}
        </div>
      )}

      <div className={`mx-5 mt-3 rounded-xl p-3 ${dark ? "bg-white/5" : "bg-white"} border ${dark ? "border-white/10" : "border-black/5"}`}>
        <div className="flex gap-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {visibleItems.map((item) => (
            <div key={suggestionKey(item)} className="shrink-0 w-[96px]">
              <div className="relative h-[86px] rounded-lg overflow-hidden bg-zinc-100">
                {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" loading="lazy" />}
                <button
                  type="button"
                  aria-label={`Add ${item.name}`}
                  onClick={() => addSuggestionToCart(item)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-md bg-white border cursor-pointer flex items-center justify-center shadow"
                  style={{ borderColor: PRIMARY, color: PRIMARY }}
                >
                  <Plus size={14} strokeWidth={3} />
                </button>
              </div>
              <div className="mt-1.5 flex items-start gap-1">
                <span className="mt-0.5 shrink-0"><VegMark size={11} /></span>
                <p className={`text-[11px] font-medium leading-tight line-clamp-2 ${textMain}`}>{item.name}</p>
              </div>
              <p className={`text-[11px] mt-0.5 ${muted}`}>
                ₹{item.price}
                {item.originalPrice > item.price && <span className="line-through ml-1">₹{item.originalPrice}</span>}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------------------------
// Cart page: "Slide to unlock Limited Time Offer"
// ---------------------------------------------------------------------------------------------

const HANDLE = 44

function SlideToUnlock({ text, onUnlock, disabled }) {
  const trackRef = useRef(null)
  const [offset, setOffset] = useState(0)
  const dragging = useRef(false)
  const startX = useRef(0)

  const maxOffset = () => (trackRef.current ? trackRef.current.offsetWidth - HANDLE - 8 : 0)

  const onDown = (e) => {
    if (disabled) return
    dragging.current = true
    startX.current = e.clientX - offset
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  const onMove = (e) => {
    if (!dragging.current) return
    setOffset(Math.min(maxOffset(), Math.max(0, e.clientX - startX.current)))
  }
  const onUp = () => {
    if (!dragging.current) return
    dragging.current = false
    if (offset >= maxOffset() * 0.85) {
      setOffset(0)
      onUnlock()
    } else {
      setOffset(0)
    }
  }

  return (
    <div
      ref={trackRef}
      className={`relative h-[52px] rounded-xl overflow-hidden select-none ${disabled ? "opacity-60" : ""}`}
      style={{ background: "linear-gradient(90deg,#1e4d8c,#14386b)" }}
    >
      <div
        role="button"
        aria-label={text}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        className="absolute top-1 left-1 rounded-lg bg-white flex items-center justify-center touch-none cursor-grab"
        style={{ width: HANDLE, height: HANDLE, transform: `translateX(${offset}px)`, transition: dragging.current ? "none" : "transform 0.2s" }}
      >
        <ChevronsRight size={22} color="#1e4d8c" />
      </div>
      <span className="absolute inset-0 flex items-center justify-center text-white text-sm font-semibold pl-8 pointer-events-none">{text}</span>
    </div>
  )
}

const formatRemaining = (ms) => {
  const total = Math.max(0, Math.floor(ms / 1000))
  return `${Math.floor(total / 60)}m : ${String(total % 60).padStart(2, "0")}s`
}

export function LimitedOffer({ dark = false, cartTotal = 0, hasOfferInCart = false }) {
  const config = useCartConfig()
  const [claim, setClaim] = useState(null)
  const [error, setError] = useState("")
  const [now, setNow] = useState(Date.now())
  const [busy, setBusy] = useState(false)

  const offer = config?.offer
  const available = !!offer?.enabled && !!config?.offerItem && !hasOfferInCart

  useEffect(() => {
    if (!claim) return undefined
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [claim])

  const unlock = useCallback(async () => {
    if (busy) return
    setBusy(true)
    setError("")
    try {
      setClaim(await claimOffer(cartTotal))
    } catch (e) {
      setError(e?.response?.data?.message || "This offer is not available right now")
    } finally {
      setBusy(false)
    }
  }, [busy, cartTotal])

  const remaining = claim ? claim.expiresAt - now : 0
  useEffect(() => {
    if (claim && remaining <= 0) setClaim(null)
  }, [claim, remaining])

  if (!available) return null

  const accept = () => {
    const item = claim.item
    addSuggestionToCart(item, {
      key: `${OFFER_KEY_PREFIX}${item.id}`,
      singleQuantity: true,
      meta: { isLimitedOffer: true, offerToken: claim.token, offerExpiresAt: claim.expiresAt },
    })
    setClaim(null)
  }

  return (
    <>
      <div className="mt-4 px-5">
        <SlideToUnlock text={offer.sliderText} onUnlock={unlock} disabled={busy} />
        {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
      </div>

      {claim && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-6" onClick={() => setClaim(null)}>
          <div className="w-full max-w-[300px] relative" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              aria-label="Close"
              onClick={() => setClaim(null)}
              className="absolute -top-10 right-0 border-0 bg-transparent text-white cursor-pointer"
            >
              <X size={26} />
            </button>
            <h3 className="text-white text-lg font-bold text-center mb-3">{claim.title}</h3>
            <div className="rounded-2xl overflow-hidden bg-black text-white">
              <div className="relative h-[220px] bg-zinc-800">
                {claim.item.image && <img src={claim.item.image} alt={claim.item.name} className="w-full h-full object-cover" />}
                <span className="absolute top-2 left-2"><VegMark size={18} /></span>
              </div>
              <div className="px-4 pt-3 pb-4 text-center">
                <p className="text-base font-bold">{claim.item.name}</p>
                <p className="mt-1 text-lg">
                  {claim.item.originalPrice > claim.item.price && <span className="line-through opacity-70 mr-2">₹{claim.item.originalPrice}</span>}
                  <span className="font-bold">₹{claim.item.price}</span>
                </p>
                <p className="mt-2 text-xs opacity-80 flex items-center justify-center gap-1.5">
                  <Clock size={14} /> Expires in {formatRemaining(remaining)}
                </p>
                <button
                  type="button"
                  onClick={accept}
                  className="mt-3 w-full h-11 border-0 cursor-pointer text-white font-bold rounded-lg"
                  style={{ backgroundColor: PRIMARY }}
                >
                  {claim.buttonText || "Add & Continue"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
