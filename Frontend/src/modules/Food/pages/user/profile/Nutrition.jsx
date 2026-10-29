import React, { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { ArrowLeft, Printer, Search, X, AlertTriangle, ChevronDown, Flame, Leaf, RotateCcw, SlidersHorizontal } from "lucide-react"
import apiClient from "@/services/api/axios"

// Everything on this page comes from the super admin (Super Admin > User App > Nutrition Info).

// Reference daily values (2,000 kcal diet) for the % DV bars
const DV = { totalFat: 65, satFat: 20, cholesterol: 300, sodium: 2400, carbs: 300, fiber: 25, protein: 50 }
const pct = (amount, dv) => Math.round(((Number(amount) || 0) / dv) * 100)
const MACRO_COLORS = { protein: "#2e7d32", carbs: "#f59e0b", fat: "#E53935" }
const SORTS = [
  { id: "menu", label: "Menu order" },
  { id: "kcal-asc", label: "Lowest calories" },
  { id: "protein-desc", label: "Most protein" },
]

function macroSplit(item) {
  const kcal = { protein: (item.protein || 0) * 4, carbs: (item.carbs || 0) * 4, fat: (item.totalFat || 0) * 9 }
  const total = kcal.protein + kcal.carbs + kcal.fat
  if (!total) return { protein: 0, carbs: 0, fat: 0 }
  const protein = Math.round((kcal.protein / total) * 100)
  const carbs = Math.round((kcal.carbs / total) * 100)
  return { protein, carbs, fat: Math.max(0, 100 - protein - carbs) }
}

function MacroBar({ item, height = 6, ui }) {
  const split = macroSplit(item)
  return (
    <div className="flex w-full overflow-hidden rounded-full" style={{ height, backgroundColor: ui.line }}>
      {["protein", "carbs", "fat"].map((k) => split[k] > 0 && (
        <div key={k} style={{ width: `${split[k]}%`, backgroundColor: MACRO_COLORS[k] }} />
      ))}
    </div>
  )
}

function Chip({ active, onClick, children, ui, tone = "primary" }) {
  const on = tone === "amber"
    ? { backgroundColor: "rgba(245,158,11,0.14)", color: "#b45309", borderColor: "rgba(245,158,11,0.45)" }
    : { backgroundColor: "#E53935", color: "#fff", borderColor: "#E53935" }
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className="shrink-0 px-3.5 py-1.5 rounded-full text-[13px] font-semibold border cursor-pointer transition-colors whitespace-nowrap flex items-center gap-1"
      style={active ? on : { backgroundColor: ui.card, color: ui.text, borderColor: ui.line }}
    >
      {children}
    </button>
  )
}

function ItemCard({ item, ui, onOpen, avoided }) {
  return (
    <button
      onClick={onOpen}
      className="w-full text-left rounded-2xl p-3 flex gap-3 border-0 cursor-pointer active:scale-[0.99] transition-transform"
      style={{ backgroundColor: ui.card, boxShadow: ui.shadow }}
    >
      <div className="w-[76px] h-[76px] shrink-0 rounded-xl overflow-hidden flex items-center justify-center" style={{ backgroundColor: ui.soft }}>
        {item.image
          ? <img src={item.image} alt="" loading="lazy" className="w-full h-full object-cover" />
          : <Leaf className="w-7 h-7" style={{ color: "#2e7d32" }} />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="font-bold text-[15px] leading-snug line-clamp-2" style={{ color: ui.text }}>{item.name}</p>
          <span className="shrink-0 inline-flex items-center gap-0.5 text-[13px] font-bold" style={{ color: ui.text }}>
            <Flame className="w-3.5 h-3.5 text-[#E53935]" />{item.calories}
            <span className="text-[11px] font-medium" style={{ color: ui.muted }}>kcal</span>
          </span>
        </div>
        <p className="text-xs mt-0.5" style={{ color: ui.muted }}>{[item.category, item.servingSize].filter(Boolean).join(" · ")}</p>
        <div className="mt-2"><MacroBar item={item} ui={ui} /></div>
        <div className="mt-1.5 flex items-center gap-3 text-[11px]" style={{ color: ui.muted }}>
          <span><b style={{ color: ui.text }}>{item.protein}g</b> protein</span>
          <span><b style={{ color: ui.text }}>{item.carbs}g</b> carbs</span>
          <span><b style={{ color: ui.text }}>{item.totalFat}g</b> fat</span>
        </div>
        {item.allergens?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {item.allergens.map((a) => (
              <span
                key={a}
                className="px-2 py-0.5 rounded-md text-[10px] font-semibold"
                style={avoided.includes(a) ? { backgroundColor: "#fde2e1", color: "#b71c1c" } : { backgroundColor: ui.soft, color: ui.muted }}
              >
                {a}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  )
}

function NutrientRow({ label, value, unit, dv, indent, ui }) {
  const percent = dv ? pct(value, dv) : null
  return (
    <div className={`py-2 ${indent ? "pl-4" : ""}`} style={{ borderTop: `1px solid ${ui.line}` }}>
      <div className="flex items-baseline justify-between text-sm">
        <span style={{ color: indent ? ui.muted : ui.text }} className={indent ? "" : "font-semibold"}>{label}</span>
        <span style={{ color: ui.text }}>
          <b>{value ?? 0}{unit}</b>
          {percent !== null && <span className="ml-2 text-xs" style={{ color: ui.muted }}>{percent}% DV</span>}
        </span>
      </div>
      {percent !== null && (
        <div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{ backgroundColor: ui.line }}>
          <div className="h-full rounded-full" style={{ width: `${Math.min(100, percent)}%`, backgroundColor: percent >= 20 ? "#E53935" : percent >= 10 ? "#f59e0b" : "#2e7d32" }} />
        </div>
      )}
    </div>
  )
}

// The classic black-and-white Nutrition Facts label
function FactsLabel({ item, disclaimer }) {
  const row = (label, amount, dv, { bold = true, indent = false } = {}) => (
    <div className={`border-b border-black py-0.5 flex justify-between text-xs ${indent ? "pl-3" : ""}`}>
      <span>{bold ? <strong>{label}</strong> : label} {amount}</span>
      {dv !== undefined && <strong>{dv}%</strong>}
    </div>
  )
  return (
    <div className="fda-label border-[6px] border-black p-3 w-full max-w-[320px] mx-auto bg-white text-black">
      <h3 className="font-black text-3xl tracking-tight leading-none">Nutrition Facts</h3>
      <div className="border-b-[5px] border-black pb-1 mt-1 text-[11px]">Serving size <strong>{item.servingSize || "1 serving"}</strong></div>
      <div className="border-b-4 border-black py-1 flex justify-between items-baseline">
        <span className="font-black text-xl leading-none">Calories</span>
        <span className="font-black text-3xl leading-none">{item.calories}</span>
      </div>
      <div className="text-right text-[10px] font-black border-b border-black py-0.5">% Daily Value*</div>
      {row("Total Fat", `${item.totalFat}g`, pct(item.totalFat, DV.totalFat))}
      {row("Saturated Fat", `${item.satFat}g`, pct(item.satFat, DV.satFat), { bold: false, indent: true })}
      {row(<em>Trans</em>, `Fat ${item.transFat}g`, undefined, { bold: false, indent: true })}
      {row("Cholesterol", `${item.cholesterol}mg`, pct(item.cholesterol, DV.cholesterol))}
      {row("Sodium", `${item.sodium}mg`, pct(item.sodium, DV.sodium))}
      {row("Total Carbohydrate", `${item.carbs}g`, pct(item.carbs, DV.carbs))}
      {row("Dietary Fiber", `${item.fiber}g`, pct(item.fiber, DV.fiber), { bold: false, indent: true })}
      {row("Sugars", `${item.sugars}g`, undefined, { bold: false, indent: true })}
      <div className="border-b-[8px] border-black py-0.5 flex justify-between text-xs">
        <span><strong>Protein</strong> {item.protein}g</span><strong>{pct(item.protein, DV.protein)}%</strong>
      </div>
      <div className="border-b border-black py-0.5 flex justify-between text-xs"><span>Calcium</span><span>{item.calcium}%</span></div>
      <div className="border-b border-black py-0.5 flex justify-between text-xs"><span>Iron</span><span>{item.iron}%</span></div>
      {disclaimer && <p className="text-[9px] leading-tight pt-1.5">* {disclaimer}</p>}
    </div>
  )
}

function DetailSheet({ item, page, ui, onClose }) {
  const reduce = useReducedMotion()
  const [showLabel, setShowLabel] = useState(false)
  const split = macroSplit(item)

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev }
  }, [onClose])

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-end justify-center no-print"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <motion.div
        role="dialog" aria-modal="true" aria-label={item.name}
        className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-3xl"
        style={{ backgroundColor: ui.page }}
        initial={reduce ? false : { y: "100%" }} animate={{ y: 0 }} exit={reduce ? { opacity: 0 } : { y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 320 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 pt-2 pb-1 flex justify-center" style={{ backgroundColor: ui.page }}>
          <span className="w-10 h-1 rounded-full" style={{ backgroundColor: ui.line }} />
        </div>
        <div className="px-4 pb-6">
          <div className="flex items-start gap-3">
            {item.image && <img src={item.image} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />}
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-extrabold leading-snug" style={{ color: ui.text }}>{item.name}</h2>
              <p className="text-xs mt-0.5" style={{ color: ui.muted }}>{[item.category, item.servingSize].filter(Boolean).join(" · ")}</p>
            </div>
            <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-full border-0 cursor-pointer" style={{ backgroundColor: ui.card, color: ui.text }}>
              <X className="w-4 h-4" />
            </button>
          </div>
          {item.description && <p className="text-sm mt-3 leading-relaxed" style={{ color: ui.muted }}>{item.description}</p>}

          {/* Calories + macro split */}
          <div className="mt-4 rounded-2xl p-4" style={{ backgroundColor: ui.card }}>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[11px] font-semibold tracking-wide uppercase" style={{ color: ui.muted }}>Per serving</p>
                <p className="text-4xl font-black leading-none mt-1" style={{ color: ui.text }}>
                  {item.calories}<span className="text-base font-semibold ml-1" style={{ color: ui.muted }}>kcal</span>
                </p>
              </div>
              <p className="text-xs text-right" style={{ color: ui.muted }}>{pct(item.calories, 2000)}% of a<br />2,000 kcal day</p>
            </div>
            <div className="mt-4"><MacroBar item={item} height={10} ui={ui} /></div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[["protein", "Protein", item.protein], ["carbs", "Carbs", item.carbs], ["fat", "Fat", item.totalFat]].map(([k, label, g]) => (
                <div key={k} className="rounded-xl p-2.5" style={{ backgroundColor: ui.soft }}>
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: ui.muted }}>
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: MACRO_COLORS[k] }} />{label}
                  </div>
                  <p className="text-base font-extrabold mt-0.5" style={{ color: ui.text }}>{g}g</p>
                  <p className="text-[10px]" style={{ color: ui.muted }}>{split[k]}% of kcal</p>
                </div>
              ))}
            </div>
          </div>

          {/* Allergens */}
          <div className="mt-3 rounded-2xl p-4" style={{ backgroundColor: ui.amberBg }}>
            <p className="text-xs font-bold uppercase tracking-wide flex items-center gap-1.5" style={{ color: ui.amberText }}>
              <AlertTriangle className="w-4 h-4" /> Allergens
            </p>
            <p className="text-sm mt-1.5" style={{ color: ui.text }}>
              {item.allergens?.length ? <>Contains <b>{item.allergens.join(", ")}</b>.</> : "No major allergens listed."}
            </p>
            {page.allergenNote && <p className="text-xs mt-1" style={{ color: ui.muted }}>{page.allergenNote}</p>}
          </div>

          {/* Full breakdown */}
          <div className="mt-3 rounded-2xl px-4 pt-2 pb-1" style={{ backgroundColor: ui.card }}>
            <p className="text-xs font-bold uppercase tracking-wide py-2" style={{ color: ui.muted }}>Full breakdown</p>
            <NutrientRow ui={ui} label="Total fat" value={item.totalFat} unit="g" dv={DV.totalFat} />
            <NutrientRow ui={ui} label="Saturated fat" value={item.satFat} unit="g" dv={DV.satFat} indent />
            <NutrientRow ui={ui} label="Trans fat" value={item.transFat} unit="g" indent />
            <NutrientRow ui={ui} label="Cholesterol" value={item.cholesterol} unit="mg" dv={DV.cholesterol} />
            <NutrientRow ui={ui} label="Sodium" value={item.sodium} unit="mg" dv={DV.sodium} />
            <NutrientRow ui={ui} label="Total carbohydrate" value={item.carbs} unit="g" dv={DV.carbs} />
            <NutrientRow ui={ui} label="Dietary fiber" value={item.fiber} unit="g" dv={DV.fiber} indent />
            <NutrientRow ui={ui} label="Sugars" value={item.sugars} unit="g" indent />
            <NutrientRow ui={ui} label="Protein" value={item.protein} unit="g" dv={DV.protein} />
            <NutrientRow ui={ui} label="Calcium" value={item.calcium} unit="% DV" />
            <NutrientRow ui={ui} label="Iron" value={item.iron} unit="% DV" />
          </div>

          <button
            onClick={() => setShowLabel((v) => !v)}
            className="mt-3 w-full flex items-center justify-between rounded-2xl px-4 py-3 border-0 cursor-pointer text-sm font-semibold"
            style={{ backgroundColor: ui.card, color: ui.text }}
            aria-expanded={showLabel}
          >
            Nutrition Facts label
            <ChevronDown className={`w-4 h-4 transition-transform ${showLabel ? "rotate-180" : ""}`} />
          </button>
          <AnimatePresence initial={false}>
            {showLabel && (
              <motion.div
                initial={reduce ? false : { height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-3"><FactsLabel item={item} disclaimer={page.disclaimer} /></div>
              </motion.div>
            )}
          </AnimatePresence>

          {page.disclaimer && <p className="mt-4 text-[11px] leading-relaxed" style={{ color: ui.muted }}>* {page.disclaimer}</p>}
        </div>
      </motion.div>
    </motion.div>
  )
}

function SkeletonList({ ui }) {
  return (
    <div className="space-y-3" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="rounded-2xl p-3 flex gap-3 animate-pulse" style={{ backgroundColor: ui.card }}>
          <div className="w-[76px] h-[76px] rounded-xl" style={{ backgroundColor: ui.soft }} />
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 w-2/3 rounded" style={{ backgroundColor: ui.soft }} />
            <div className="h-3 w-1/3 rounded" style={{ backgroundColor: ui.soft }} />
            <div className="h-1.5 w-full rounded-full mt-3" style={{ backgroundColor: ui.soft }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Nutrition() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("All")
  const [avoid, setAvoid] = useState([])
  const [sort, setSort] = useState("menu")
  const [active, setActive] = useState(null)
  const [isDarkMode] = useState(() => {
    try {
      return document.documentElement.classList.contains("dark") || localStorage.getItem("appTheme") === "dark"
    } catch (_) {
      return false
    }
  })

  const ui = {
    page: isDarkMode ? "#0e0e0f" : "#f3f3f5",
    card: isDarkMode ? "#1b1b1d" : "#ffffff",
    soft: isDarkMode ? "#262629" : "#f1f1f4",
    text: isDarkMode ? "#f4f4f5" : "#1c1b1b",
    muted: isDarkMode ? "#a1a1aa" : "#6b7280",
    line: isDarkMode ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)",
    shadow: isDarkMode ? "none" : "0 1px 3px rgba(0,0,0,0.06)",
    amberBg: isDarkMode ? "rgba(245,158,11,0.12)" : "#fff7e6",
    amberText: isDarkMode ? "#fbbf24" : "#b45309",
  }

  const load = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await apiClient.get("/settings/nutrition/public")
      setData(res?.data?.data || { page: {}, items: [], allergens: [] })
    } catch (err) {
      setError(err?.response?.data?.message || "Could not load nutrition information. Check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { window.scrollTo(0, 0); load() }, [])

  const items = data?.items || []
  const page = data?.page || {}
  const categories = useMemo(() => ["All", ...new Set(items.map((i) => i.category).filter(Boolean))], [items])
  const allergens = data?.allergens || []

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = items.filter((i) =>
      (category === "All" || i.category === category) &&
      (!q || `${i.name} ${i.description || ""}`.toLowerCase().includes(q)) &&
      !avoid.some((a) => (i.allergens || []).includes(a))
    )
    if (sort === "kcal-asc") return [...list].sort((a, b) => a.calories - b.calories)
    if (sort === "protein-desc") return [...list].sort((a, b) => b.protein - a.protein)
    return list
  }, [items, query, category, avoid, sort])

  const filtersOn = query || category !== "All" || avoid.length > 0
  const clearFilters = () => { setQuery(""); setCategory("All"); setAvoid([]) }
  const toggleAvoid = (a) => setAvoid((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]))
  const goBack = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate("/user/account", { replace: true }))

  return (
    <div className="min-h-screen flex justify-center" style={{ backgroundColor: isDarkMode ? "#0a0a0a" : "#e9e9ec" }}>
      <style dangerouslySetInnerHTML={{
        __html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .print-sheet { display: none; }
        @media print {
          body { background: #fff !important; }
          .no-print { display: none !important; }
          .print-sheet { display: block !important; color: #000; background: #fff; padding: 16px; }
        }
      ` }} />

      <div className="w-full max-w-md min-h-screen pb-10 no-print" style={{ backgroundColor: ui.page, fontFamily: "'Inter', sans-serif" }}>
        {/* Header (no cart on this page) */}
        <header className="sticky top-0 z-30 h-14 flex items-center justify-between px-2" style={{ backgroundColor: ui.card, borderBottom: `1px solid ${ui.line}` }}>
          <div className="flex items-center gap-1 min-w-0">
            <button onClick={goBack} aria-label="Back" className="p-2 bg-transparent border-0 cursor-pointer active:scale-95" style={{ color: ui.text }}>
              <ArrowLeft size={22} />
            </button>
            <h1 className="text-[17px] font-bold truncate" style={{ color: ui.text }}>Nutrition Information</h1>
          </div>
          {items.length > 0 && (
            <button onClick={() => window.print()} aria-label="Print or save as PDF" title="Print / save as PDF" className="p-2 bg-transparent border-0 cursor-pointer active:scale-95" style={{ color: ui.text }}>
              <Printer size={20} />
            </button>
          )}
        </header>

        <main className="px-4 pt-4">
          {/* Intro */}
          <div className="rounded-2xl p-4 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #E53935 0%, #c62828 100%)" }}>
            <Leaf className="absolute -right-3 -bottom-4 w-24 h-24 text-white/10" />
            <p className="text-[11px] font-bold tracking-widest uppercase text-white/80">100% vegetarian</p>
            <h2 className="text-xl font-extrabold text-white mt-0.5">{page.headline || "Nutrition & Allergens"}</h2>
            {page.intro && <p className="text-sm text-white/85 mt-1 leading-relaxed pr-10">{page.intro}</p>}
          </div>

          {loading ? (
            <div className="mt-4"><SkeletonList ui={ui} /></div>
          ) : error ? (
            <div className="mt-10 text-center px-6">
              <p className="text-sm font-semibold" style={{ color: ui.text }}>{error}</p>
              <button onClick={load} className="mt-3 px-5 py-2.5 rounded-xl bg-[#E53935] text-white text-sm font-bold border-0 cursor-pointer inline-flex items-center gap-2">
                <RotateCcw className="w-4 h-4" /> Try again
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="mt-12 text-center px-8">
              <div className="mx-auto w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: ui.card }}>
                <Leaf className="w-7 h-7 text-[#2e7d32]" />
              </div>
              <p className="mt-3 font-bold" style={{ color: ui.text }}>Nutrition details are on their way</p>
              <p className="text-sm mt-1" style={{ color: ui.muted }}>We're adding values for our menu. Please check back soon.</p>
            </div>
          ) : (
            <>
              {/* Search */}
              <div className="mt-4 relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: ui.muted }} />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search pizzas, sides, desserts…"
                  className="w-full h-11 rounded-xl pl-10 pr-10 text-sm outline-none border focus:border-[#E53935]"
                  style={{ backgroundColor: ui.card, color: ui.text, borderColor: ui.line }}
                />
                {query && (
                  <button onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 border-0 bg-transparent cursor-pointer" style={{ color: ui.muted }}>
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Categories */}
              {categories.length > 2 && (
                <div className="mt-3 -mx-4 px-4 flex gap-2 overflow-x-auto hide-scrollbar">
                  {categories.map((c) => <Chip key={c} ui={ui} active={category === c} onClick={() => setCategory(c)}>{c}</Chip>)}
                </div>
              )}

              {/* Allergen filter + sort */}
              {allergens.length > 0 && (
                <div className="mt-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide mb-1.5" style={{ color: ui.muted }}>Hide items with</p>
                  <div className="-mx-4 px-4 flex gap-2 overflow-x-auto hide-scrollbar">
                    {allergens.map((a) => <Chip key={a} ui={ui} tone="amber" active={avoid.includes(a)} onClick={() => toggleAvoid(a)}>{avoid.includes(a) && <X className="w-3 h-3" />}{a}</Chip>)}
                  </div>
                </div>
              )}

              <div className="mt-4 mb-2 flex items-center justify-between">
                <p className="text-xs" style={{ color: ui.muted }} aria-live="polite">
                  {shown.length} of {items.length} items
                  {filtersOn && <button onClick={clearFilters} className="ml-2 font-bold text-[#E53935] bg-transparent border-0 p-0 cursor-pointer">Clear</button>}
                </p>
                <label className="flex items-center gap-1 text-xs font-semibold" style={{ color: ui.text }}>
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <select value={sort} onChange={(e) => setSort(e.target.value)} className="bg-transparent outline-none border-0 font-semibold cursor-pointer" style={{ color: ui.text }}>
                    {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </label>
              </div>

              {shown.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-sm font-semibold" style={{ color: ui.text }}>No items match your filters</p>
                  <button onClick={clearFilters} className="mt-2 text-sm font-bold text-[#E53935] bg-transparent border-0 cursor-pointer">Clear filters</button>
                </div>
              ) : (
                <div className="space-y-3">
                  {shown.map((item) => <ItemCard key={item._id} item={item} ui={ui} avoided={avoid} onOpen={() => setActive(item)} />)}
                </div>
              )}

              <div className="mt-5 flex items-center justify-center gap-4 text-[11px]" style={{ color: ui.muted }}>
                {[["protein", "Protein"], ["carbs", "Carbs"], ["fat", "Fat"]].map(([k, l]) => (
                  <span key={k} className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: MACRO_COLORS[k] }} />{l}</span>
                ))}
              </div>
              {page.disclaimer && <p className="mt-3 text-[11px] leading-relaxed text-center px-2" style={{ color: ui.muted }}>* {page.disclaimer}</p>}
            </>
          )}
        </main>
      </div>

      <AnimatePresence>
        {active && <DetailSheet key={active._id} item={active} page={page} ui={ui} onClose={() => setActive(null)} />}
      </AnimatePresence>

      {/* Print / PDF sheet */}
      <div className="print-sheet">
        <h1 style={{ fontSize: 22, fontWeight: 900 }}>Papa Veg Pizza: {page.headline || "Nutrition & Allergens"}</h1>
        <p style={{ fontSize: 11, margin: "4px 0 12px" }}>Printed {new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}. Values per serving.</p>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
          <thead>
            <tr>
              {["Item", "Serving", "Kcal", "Protein", "Carbs", "Sugars", "Fat", "Sat. fat", "Sodium", "Allergens"].map((h) => (
                <th key={h} style={{ border: "1px solid #000", padding: 4, textAlign: "left", background: "#eee" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i._id}>
                <td style={{ border: "1px solid #000", padding: 4, fontWeight: 700 }}>{i.name}</td>
                <td style={{ border: "1px solid #000", padding: 4 }}>{i.servingSize}</td>
                <td style={{ border: "1px solid #000", padding: 4 }}>{i.calories}</td>
                <td style={{ border: "1px solid #000", padding: 4 }}>{i.protein}g</td>
                <td style={{ border: "1px solid #000", padding: 4 }}>{i.carbs}g</td>
                <td style={{ border: "1px solid #000", padding: 4 }}>{i.sugars}g</td>
                <td style={{ border: "1px solid #000", padding: 4 }}>{i.totalFat}g</td>
                <td style={{ border: "1px solid #000", padding: 4 }}>{i.satFat}g</td>
                <td style={{ border: "1px solid #000", padding: 4 }}>{i.sodium}mg</td>
                <td style={{ border: "1px solid #000", padding: 4 }}>{(i.allergens || []).join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {page.allergenNote && <p style={{ fontSize: 11, marginTop: 10 }}>{page.allergenNote}</p>}
        {page.disclaimer && <p style={{ fontSize: 10, marginTop: 4 }}>* {page.disclaimer}</p>}
      </div>
    </div>
  )
}
