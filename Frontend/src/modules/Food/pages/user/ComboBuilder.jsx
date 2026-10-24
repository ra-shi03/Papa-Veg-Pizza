import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, ChevronRight, ChevronDown, Info, Sparkles, BadgePercent, X, ArrowUpDown, Check } from "lucide-react"
import axiosInstance from "@/services/api/axios"

const GREEN = "#2E7D32"
const SORTS = [
  { id: "default", label: "Recommended" },
  { id: "price_asc", label: "Price: Low to High" },
  { id: "price_desc", label: "Price: High to Low" },
  { id: "name", label: "Name: A to Z" },
]

const fill = (template, vars) =>
  String(template || "").replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : `{${k}}`))

const rupee = (n) => `₹${Math.round(Number(n) || 0)}`

function VegMark({ type, className = "" }) {
  const isVeg = type !== "non-veg"
  const color = isVeg ? "#2E7D32" : "#8B4A2B"
  return (
    <span
      className={`inline-flex items-center justify-center w-4 h-4 border-[1.5px] bg-white shrink-0 ${className}`}
      style={{ borderColor: color, borderRadius: 3 }}
    >
      {isVeg ? (
        <span className="w-2 h-2 rounded-full" style={{ background: color }} />
      ) : (
        <span
          className="w-0 h-0"
          style={{
            borderLeft: "4px solid transparent",
            borderRight: "4px solid transparent",
            borderBottom: `7px solid ${color}`,
          }}
        />
      )}
    </span>
  )
}

function Shimmer({ className = "" }) {
  return <div className={`combo-shimmer rounded-full ${className}`} />
}

export default function ComboBuilder() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [error, setError] = useState(false)
  const [minWaitDone, setMinWaitDone] = useState(false)
  const [selection, setSelection] = useState([]) // product ids, one per slot
  const [pickerSlot, setPickerSlot] = useState(null)
  const [vegFilter, setVegFilter] = useState(null) // null | "veg" | "non-veg"
  const [sortBy, setSortBy] = useState("default")
  const [showSort, setShowSort] = useState(false)
  const [showSavings, setShowSavings] = useState(false)
  const [toast, setToast] = useState("")
  const waitTimer = useRef(null)

  useEffect(() => {
    let cancelled = false
    axiosInstance
      .get("/settings/combo-page/build")
      .then((res) => {
        if (cancelled) return
        const payload = res?.data?.data
        setData(payload)
        setSelection(payload?.defaults || [])
        const seconds = Number(payload?.config?.loadingSeconds) || 3
        waitTimer.current = setTimeout(() => setMinWaitDone(true), seconds * 1000)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
    return () => {
      cancelled = true
      clearTimeout(waitTimer.current)
    }
  }, [])

  const cfg = data?.config
  const options = useMemo(() => data?.options || [], [data])
  const optionById = useMemo(() => new Map(options.map((o) => [o.id, o])), [options])
  const chosen = selection.map((id) => optionById.get(id)).filter(Boolean)

  const totals = useMemo(() => {
    const original = chosen.reduce((s, o) => s + o.originalPrice, 0)
    const price = chosen.reduce((s, o) => s + o.finalPrice, 0)
    const saving = Math.max(0, original - price)
    return { original, price, saving, percent: original > 0 ? Math.round((saving / original) * 100) : 0 }
  }, [chosen])

  const visibleOptions = useMemo(() => {
    let list = options.filter((o) => !vegFilter || (vegFilter === "veg" ? o.vegType !== "non-veg" : o.vegType === "non-veg"))
    if (sortBy === "price_asc") list = [...list].sort((a, b) => a.finalPrice - b.finalPrice)
    else if (sortBy === "price_desc") list = [...list].sort((a, b) => b.finalPrice - a.finalPrice)
    else if (sortBy === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name))
    return list
  }, [options, vegFilter, sortBy])

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(""), 2200)
  }

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1)
    else navigate("/user/combos")
  }

  const openPicker = (slot) => {
    setVegFilter(null)
    setSortBy("default")
    setShowSort(false)
    setPickerSlot(slot)
  }

  const selectOption = (id) => {
    setSelection((prev) => prev.map((cur, i) => (i === pickerSlot ? id : cur)))
    setPickerSlot(null)
  }

  const addComboToCart = () => {
    if (chosen.length === 0) return
    const key = `combo-offer-${selection.join("-")}`
    const lineName = (o) => `${o.name} (${[o.size, o.crust].filter(Boolean).join(", ")})`
    const spec = {
      id: key,
      title: cfg.offerName || "Combo",
      price: totals.price,
      image: chosen[0].image,
      description: chosen.map(lineName).join(" + "),
      customized: true,
      selectedSize: "",
      comboLines: chosen.map((o) => ({ productId: o.id, name: o.name, size: o.size, crust: o.crust, price: o.finalPrice })),
    }
    try {
      const customMap = JSON.parse(localStorage.getItem("pvp_customized_items") || "{}")
      customMap[key] = spec
      localStorage.setItem("pvp_customized_items", JSON.stringify(customMap))
      const stored = JSON.parse(localStorage.getItem("userCart") || "{}")
      stored[key] = (Number(stored[key]) || 0) + 1
      localStorage.setItem("userCart", JSON.stringify(stored))
      window.dispatchEvent(new Event("cartUpdated"))
    } catch (_) {
      showToast("Could not add combo. Please try again.")
      return
    }
    showToast(`${cfg.offerName || "Combo"} added to cart!`)
    setTimeout(() => navigate("/user/cart"), 600)
  }

  const ready = Boolean(data) && minWaitDone
  const unavailable = error || (data && (cfg?.isActive === false || options.length === 0))
  const slotCount = cfg?.slotCount || 2
  const exploreText =
    String(cfg?.exploreText || "").includes("{maxSave}") && !(cfg?.maxSaving > 0)
      ? ""
      : fill(cfg?.exploreText, { maxSave: rupee(cfg?.maxSaving) })
  const includesTitle = fill(cfg?.includesTitle || "Combo includes {count} items", { count: slotCount })

  const banner = (
    <div className="relative w-full aspect-[5/4] overflow-hidden bg-[#1f4a2b]">
      {cfg?.bannerUrl && (
        <img src={cfg.bannerUrl} alt={cfg.offerName} className="w-full h-full object-cover object-top block" />
      )}
      <button
        type="button"
        onClick={handleBack}
        aria-label="Back"
        className="absolute top-1.5 left-2.5 w-8 h-8 rounded-full bg-black/35 backdrop-blur flex items-center justify-center text-white border-0 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4 stroke-[2.4]" />
      </button>
    </div>
  )

  return (
    <div className="user-app-theme min-h-screen flex justify-center bg-[#F8F6F2] dark:bg-[#0a0a0a]">
      <style>{`
        @keyframes combo-shimmer { 0% { background-position: -300px 0 } 100% { background-position: 300px 0 } }
        .combo-shimmer { background: linear-gradient(90deg,#ececec 0%,#f7f7f7 50%,#ececec 100%); background-size: 600px 100%; animation: combo-shimmer 1.3s linear infinite; }
        @keyframes combo-ring { 0% { stroke-dashoffset: 189; stroke: #fff } 60% { stroke-dashoffset: 0; stroke: #fff } 100% { stroke-dashoffset: 0; stroke: #43A047 } }
        @keyframes combo-disc { 0%, 55% { transform: scale(0); opacity: 0 } 80% { transform: scale(1.12); opacity: 1 } 100% { transform: scale(1); opacity: 1 } }
        @keyframes combo-tick { 0%, 70% { stroke-dashoffset: 32 } 100% { stroke-dashoffset: 0 } }
        @keyframes combo-pulse { 0% { transform: scale(.8); opacity: .45 } 100% { transform: scale(1.9); opacity: 0 } }
        @keyframes combo-rise { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
        .combo-ring { stroke-dasharray: 189; animation: combo-ring 1.1s ease-in-out forwards }
        .combo-disc { transform-origin: 38px 38px; transform: scale(0); animation: combo-disc .9s cubic-bezier(.34,1.56,.64,1) .35s forwards }
        .combo-tick { stroke-dasharray: 32; stroke-dashoffset: 32; animation: combo-tick 1.1s ease-out .35s forwards }
        .combo-pulse { opacity: 0; animation: combo-pulse 1.6s ease-out 1s infinite }
        .combo-pulse-2 { animation-delay: 1.8s }
        .combo-text { opacity: 0; animation: combo-rise .5s ease-out .9s forwards }
        .combo-text-2 { animation-delay: 1.1s }
        .combo-fade { animation: combo-rise .45s ease-out }
        @keyframes combo-sheet { from { transform: translateY(100%) } to { transform: translateY(0) } }
        .combo-sheet { animation: combo-sheet .25s ease-out }
      `}</style>

      <div className="relative w-full max-w-md min-h-screen bg-[#EEEEF0] dark:bg-[#131313] pb-44">
        {banner}

        {unavailable ? (
          <div className="px-6 py-16 text-center">
            <p className="text-base font-semibold text-[#34373C] dark:text-[#F8F6F2]">This combo is not available right now</p>
            <button
              type="button"
              onClick={handleBack}
              className="mt-5 px-6 py-2.5 rounded-lg bg-[var(--accent-red,#EE3A43)] text-white text-sm font-medium border-0 cursor-pointer"
            >
              Go back
            </button>
          </div>
        ) : (
          <div className="px-4 pt-5">
            <h2 className="text-base font-medium text-[#34373C] dark:text-[#F8F6F2]">{includesTitle}</h2>

            {!ready ? (
              <>
                <div className="mt-3 rounded-2xl overflow-hidden bg-gradient-to-b from-[#161616] to-black h-[210px] flex flex-col items-center justify-center text-white px-6 text-center shadow-sm">
                  <div className="relative w-[76px] h-[76px] flex items-center justify-center">
                    <span className="combo-pulse absolute inset-0 rounded-full bg-[#43A047]" />
                    <span className="combo-pulse combo-pulse-2 absolute inset-0 rounded-full bg-[#43A047]" />
                    <svg className="relative" width="76" height="76" viewBox="0 0 76 76" fill="none" strokeLinecap="round" strokeLinejoin="round">
                      <circle className="combo-disc" cx="38" cy="38" r="30" fill="#43A047" />
                      <circle className="combo-ring" cx="38" cy="38" r="30" strokeWidth="3" style={{ transform: "rotate(-90deg)", transformOrigin: "center" }} />
                      <path className="combo-tick" d="M26 39l9 9 16-18" stroke="#fff" strokeWidth="4" />
                    </svg>
                  </div>
                  <p className="combo-text mt-5 text-[17px] font-semibold tracking-tight">{cfg?.loadingTitle || "Building a perfect meal for you!"}</p>
                  <p className="combo-text combo-text-2 mt-1 text-[13px] text-white/70">{cfg?.loadingSubtitle || "You can change anytime"}</p>
                </div>
                <div className="mt-3 rounded-2xl bg-white dark:bg-[#1a1a1a] divide-y divide-zinc-100 dark:divide-zinc-800 shadow-sm">
                  {Array.from({ length: slotCount }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-3">
                      <Shimmer className="w-16 h-16 !rounded-xl shrink-0" />
                      <div className="flex-1 space-y-2.5">
                        <Shimmer className="h-3.5 w-3/5" />
                        <Shimmer className="h-3 w-2/5" />
                      </div>
                      <Shimmer className="h-4 w-14" />
                    </div>
                  ))}
                </div>
                <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white dark:bg-[#1a1a1a] px-4 pt-4 pb-5 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
                  <div className="flex justify-between items-center gap-6">
                    <div className="space-y-2.5 w-28">
                      <Shimmer className="h-3 w-16" />
                      <Shimmer className="h-5 w-full" />
                    </div>
                    <Shimmer className="h-12 flex-1 !rounded-xl" />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="combo-fade mt-3 rounded-2xl overflow-hidden shadow-sm">
                  <div className="flex items-center gap-2 px-4 pt-3 pb-4 text-white text-[13px] font-medium" style={{ background: GREEN }}>
                    <Sparkles className="w-4 h-4 text-yellow-300 shrink-0" />
                    <span className="truncate whitespace-nowrap">{cfg.changeNotice}</span>
                  </div>
                  <div className="-mt-2 rounded-t-2xl bg-white dark:bg-[#1a1a1a] divide-y divide-zinc-200/80 dark:divide-zinc-800">
                    {chosen.map((o, slot) => (
                      <div key={`${o.id}-${slot}`} className="flex items-center gap-3 px-3 py-3">
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-zinc-100 shrink-0">
                          {o.image && <img src={o.image} alt={o.name} className="w-full h-full object-cover" />}
                          <VegMark type={o.vegType} className="absolute bottom-1 left-1" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[15px] font-medium text-[#34373C] dark:text-[#F8F6F2] truncate">{o.name}</p>
                          <p className="text-xs text-[#62666D] dark:text-zinc-400 truncate">
                            {[o.size, o.crust].filter(Boolean).join(" | ")}
                          </p>
                          {o.saveAmount > 0 && (
                            <p className="text-sm font-medium mt-0.5" style={{ color: GREEN }}>Saving {rupee(o.saveAmount)}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => openPicker(slot)}
                          className="flex items-center gap-0.5 text-sm font-medium text-[#34373C] dark:text-[#F8F6F2] bg-transparent border-0 cursor-pointer shrink-0"
                        >
                          <span className="border-b border-dotted border-[#34373C] dark:border-zinc-400">Change</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {exploreText && (
                  <button
                    type="button"
                    onClick={() => openPicker(0)}
                    className="mt-4 w-full flex items-center justify-center gap-2 bg-white dark:bg-[#1a1a1a] rounded-2xl py-4 px-4 text-[13px] font-medium text-[#34373C] dark:text-[#F8F6F2] border-0 shadow-sm cursor-pointer"
                  >
                    <Info className="w-4 h-4 shrink-0" />
                    <span className="truncate whitespace-nowrap">{exploreText}</span>
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {ready && !unavailable && (
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-30">
            {totals.saving > 0 && (
              <div className="flex items-center justify-between px-4 py-2.5 rounded-t-2xl bg-[#E8F5E9] text-sm" style={{ color: GREEN }}>
                <span className="flex items-center gap-1.5 font-medium">
                  <BadgePercent className="w-4 h-4" />
                  You are saving {rupee(totals.saving)} with this combo!
                </span>
                <button
                  type="button"
                  onClick={() => setShowSavings(true)}
                  className="flex items-center gap-0.5 font-medium bg-transparent border-0 cursor-pointer"
                  style={{ color: GREEN }}
                >
                  <span className="border-b border-dotted" style={{ borderColor: GREEN }}>Show how</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <div className="flex items-center justify-between gap-4 bg-white dark:bg-[#1a1a1a] px-4 py-3 border-t border-zinc-100 dark:border-zinc-800">
              <div>
                <p className="text-xs text-[#34373C] dark:text-zinc-300">Combo Price</p>
                <p className="flex items-baseline gap-2">
                  <span className="text-xl font-semibold text-[#34373C] dark:text-[#F8F6F2]">{rupee(totals.price)}</span>
                  {totals.original > totals.price && (
                    <span className="text-sm text-[#62666D] line-through">{rupee(totals.original)}</span>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={addComboToCart}
                className="flex-1 max-w-[210px] h-12 rounded-xl bg-[var(--accent-red,#EE3A43)] hover:bg-[#d92d36] active:scale-95 text-white text-base font-semibold flex items-center justify-center gap-1.5 border-0 cursor-pointer transition-all"
              >
                {cfg.addButtonText || "Add Combo"} <span className="text-xl leading-none">+</span>
              </button>
            </div>
          </div>
        )}

        {/* Your Savings sheet */}
        {showSavings && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55" onClick={() => setShowSavings(false)}>
            <div
              className="combo-sheet w-full max-w-md bg-white dark:bg-[#1a1a1a] rounded-t-3xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-5 pt-5">
                <div className="flex items-center justify-between pb-3 border-b border-dotted border-zinc-300">
                  <h3 className="text-xl font-semibold text-[#34373C] dark:text-[#F8F6F2]">Your Savings!</h3>
                  <button type="button" onClick={() => setShowSavings(false)} aria-label="Close" className="bg-transparent border-0 cursor-pointer text-zinc-500">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <div className="py-3 space-y-3 border-b border-dotted border-zinc-300">
                  {chosen.map((o, i) => (
                    <div key={`${o.id}-${i}`} className="flex justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-[15px] text-[#34373C] dark:text-[#F8F6F2]">{o.name}</p>
                        <p className="text-xs text-[#62666D]">{[o.size, o.crust].filter(Boolean).join(" | ")}</p>
                      </div>
                      <span className="text-[15px] text-[#34373C] dark:text-[#F8F6F2] shrink-0">{rupee(o.originalPrice)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between py-3 text-[15px] text-[#34373C] dark:text-[#F8F6F2]">
                  <span>Total</span>
                  <span>{rupee(totals.original)}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg px-3 py-2.5 text-white text-sm font-medium" style={{ background: GREEN }}>
                  <span className="flex items-center gap-1.5">
                    <BadgePercent className="w-4 h-4" />
                    Combo Saving ({totals.percent}%)
                  </span>
                  <span>-{rupee(totals.saving)}</span>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between gap-4 border-t border-zinc-100 dark:border-zinc-800 px-5 py-3">
                <div>
                  <p className="text-xs text-[#34373C] dark:text-zinc-300">Combo Price</p>
                  <p className="flex items-baseline gap-2">
                    <span className="text-xl font-semibold text-[#34373C] dark:text-[#F8F6F2]">{rupee(totals.price)}</span>
                    <span className="text-sm text-[#62666D] line-through">{rupee(totals.original)}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setShowSavings(false); addComboToCart() }}
                  className="flex-1 max-w-[210px] h-12 rounded-xl bg-[var(--accent-red,#EE3A43)] text-white text-base font-semibold flex items-center justify-center gap-1.5 border-0 cursor-pointer"
                >
                  {cfg?.addButtonText || "Add Combo"} <span className="text-xl leading-none">+</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pizza picker */}
        {pickerSlot !== null && (
          <div className="fixed inset-0 z-50 flex justify-center bg-[#EEEEF0] dark:bg-[#131313]">
            <div className="w-full max-w-md h-full flex flex-col">
              <div className="flex items-start justify-between px-4 pt-5 pb-3 bg-white dark:bg-[#1a1a1a]">
                <div>
                  <h3 className="text-xl font-semibold text-[#34373C] dark:text-[#F8F6F2]">
                    {fill(cfg?.pickerTitle || "Select a {size} Pizza", { size: cfg?.sizeName || "" })}
                  </h3>
                  <p className="text-sm text-[#62666D]">{visibleOptions.length}+ Options</p>
                </div>
                <button type="button" onClick={() => setPickerSlot(null)} aria-label="Close" className="bg-transparent border-0 cursor-pointer text-zinc-500">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className={`items-center gap-2 px-4 py-3 relative ${cfg?.showVegFilter === false && cfg?.showNonVegFilter === false && cfg?.showSort === false ? "hidden" : "flex"}`}>
                {[
                  cfg?.showVegFilter !== false && { id: "veg", label: "Veg", mark: <VegMark type="veg" /> },
                  cfg?.showNonVegFilter !== false && { id: "non-veg", label: "Non Veg", mark: <VegMark type="non-veg" /> },
                ].filter(Boolean).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setVegFilter((cur) => (cur === f.id ? null : f.id))}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#1a1a1a] text-sm text-[#34373C] dark:text-[#F8F6F2] cursor-pointer border ${
                      vegFilter === f.id ? "border-[#34373C] dark:border-white" : "border-zinc-200 dark:border-zinc-700"
                    }`}
                  >
                    {f.mark}
                    {f.label}
                  </button>
                ))}
                {cfg?.showSort !== false && (
                <button
                  type="button"
                  onClick={() => setShowSort((v) => !v)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#1a1a1a] text-sm text-[#34373C] dark:text-[#F8F6F2] cursor-pointer border border-zinc-200 dark:border-zinc-700"
                >
                  Sort by <ArrowUpDown className="w-4 h-4" />
                </button>
                )}
                {showSort && (
                  <div className="absolute left-4 top-full -mt-1 w-52 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 z-10 py-1 overflow-hidden">
                    {SORTS.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => { setSortBy(s.id); setShowSort(false) }}
                        className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-left bg-transparent border-0 cursor-pointer text-[#34373C] dark:text-[#F8F6F2] hover:bg-zinc-50 dark:hover:bg-zinc-800"
                      >
                        {s.label}
                        {sortBy === s.id && <Check className="w-4 h-4 text-[var(--accent-red,#EE3A43)]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-3">
                {visibleOptions.length === 0 && (
                  <p className="text-center text-sm text-[#62666D] py-10">No pizzas match this filter</p>
                )}
                {visibleOptions.map((o) => {
                  const isSelected = selection[pickerSlot] === o.id
                  return (
                    <div
                      key={o.id}
                      className={`flex gap-3 p-2.5 rounded-2xl bg-white dark:bg-[#1a1a1a] border-2 ${
                        isSelected ? "border-[#1f3a5f]" : "border-transparent"
                      }`}
                    >
                      <div className="relative w-28 min-h-[7rem] rounded-xl overflow-hidden bg-zinc-100 shrink-0 self-stretch">
                        {o.image && <img src={o.image} alt={o.name} className="absolute inset-0 w-full h-full object-cover" />}
                        {o.saveAmount > 0 && (
                          <span className="absolute bottom-0 right-0 bg-white/90 text-xs font-medium px-2 py-1 rounded-tl-lg" style={{ color: GREEN }}>
                            Save {rupee(o.saveAmount)}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col py-0.5">
                        <VegMark type={o.vegType} />
                        <p className="mt-1.5 text-base font-medium text-[#34373C] dark:text-[#F8F6F2] leading-tight">{o.name}</p>
                        {o.description && (
                          <p className="mt-1 text-xs text-[#62666D] dark:text-zinc-400 line-clamp-3">{o.description}</p>
                        )}
                        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                          <p className="flex items-baseline gap-1 min-w-0 flex-wrap">
                            <span className="text-base font-semibold text-[#34373C] dark:text-[#F8F6F2]">{rupee(o.finalPrice)}</span>
                            {o.originalPrice > o.finalPrice && (
                              <span className="text-xs text-[#62666D] line-through">{rupee(o.originalPrice)}</span>
                            )}
                          </p>
                          <button
                            type="button"
                            onClick={() => selectOption(o.id)}
                            className={`shrink-0 px-4 py-1.5 rounded-lg text-[13px] font-semibold cursor-pointer ${
                              isSelected
                                ? "bg-white text-[#1f3a5f] border-2 border-[#1f3a5f]"
                                : "bg-[var(--accent-red,#EE3A43)] text-white border-0"
                            }`}
                          >
                            {isSelected ? "Selected" : "Select"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {toast && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] bg-[#34373C] text-white px-5 py-2.5 rounded-full shadow-xl text-xs">
            {toast}
          </div>
        )}
      </div>
    </div>
  )
}
