import React, { useState } from "react"
import { useLocationStore } from "@food/store/locationStore"
import { ChevronDown, MapPin, Navigation, Info } from "lucide-react"

export default function TakeawayMapModal({
  show,
  onClose,
  takeawayHut,
  setTakeawayHut,
  setActiveService,
  triggerToast,
  isDarkMode,
  confirmedAddress
}) {
  const { confirmLocation } = useLocationStore()
  const [selectedStore, setSelectedStore] = useState(null)

  if (!show) return null

  const STORES = [
    { id: "hut-cp", name: "Pizza Veg Hut - Connaught Place", dist: "0.8 km", status: "Open Now", hours: "11 AM - 11 PM", coords: { x: "42%", y: "45%" }, nearest: true },
    { id: "hut-kb", name: "Pizza Veg Hut - Karol Bagh", dist: "2.1 km", status: "Open Now", hours: "11 AM - 11 PM", coords: { x: "28%", y: "32%" } },
    { id: "hut-sk", name: "Pizza Veg Hut - Saket Terminal", dist: "4.5 km", status: "Closed", hours: "Opens tomorrow", coords: { x: "65%", y: "70%" } }
  ]

  // Default to nearest store if none selected
  const activeStore = selectedStore || STORES[0]

  const handleConfirmStore = (store) => {
    setTakeawayHut(store.name)
    confirmLocation({
      address: store.name,
      serviceType: "takeaway"
    })
    setActiveService("takeaway")
    localStorage.setItem("activeService", "takeaway")
    onClose()
    triggerToast(`Takeaway store confirmed: ${store.name}`)
  }

  // Dark/Light theme styles
  const mapBg = isDarkMode ? "#1d2731" : "#d9ecf5"
  const roadColor = isDarkMode ? "#2c3e50" : "#ffffff"
  const blockColor = isDarkMode ? "#243342" : "#e3f2fd"
  const textPrimary = isDarkMode ? "text-white" : "text-zinc-900"
  const textSecondary = isDarkMode ? "text-slate-400" : "text-slate-500"
  const sheetBg = isDarkMode ? "bg-[#131313] border-t border-white/10" : "bg-[#FAF9F6]"
  const cardBg = isDarkMode ? "bg-white/5 border-white/10 hover:bg-white/10" : "bg-zinc-50 border-zinc-100 hover:bg-zinc-100"

  return (
    <div className="fixed inset-0 z-55 overflow-hidden animate-fadeIn" style={{ backgroundColor: mapBg }}>
      {/* Draggable Mock Map Area */}
      <div className="absolute inset-0 w-full h-full">
        {/* Grid of roads and blocks */}
        <svg className="absolute inset-0 w-full h-full opacity-90" xmlns="http://www.w3.org/2000/svg">
          {/* Landmass background */}
          <rect width="100%" height="100%" fill={mapBg} />

          {/* Blocks / Urban areas */}
          <rect x="20" y="40" width="80" height="180" rx="4" fill={blockColor} opacity={isDarkMode ? "0.3" : "0.6"} />
          <rect x="140" y="20" width="100" height="120" rx="4" fill={blockColor} opacity={isDarkMode ? "0.3" : "0.6"} />
          <rect x="260" y="50" width="120" height="100" rx="4" fill={blockColor} opacity={isDarkMode ? "0.3" : "0.6"} />
          <rect x="150" y="160" width="110" height="140" rx="4" fill={blockColor} opacity={isDarkMode ? "0.3" : "0.6"} />
          <rect x="20" y="260" width="90" height="150" rx="4" fill={blockColor} opacity={isDarkMode ? "0.3" : "0.6"} />
          <rect x="280" y="220" width="100" height="240" rx="4" fill={blockColor} opacity={isDarkMode ? "0.3" : "0.6"} />
          <rect x="130" y="320" width="130" height="180" rx="4" fill={blockColor} opacity={isDarkMode ? "0.3" : "0.6"} />

          {/* Major roads */}
          <path d="M-10 100 L500 100" stroke={roadColor} strokeWidth="20" fill="none" />
          <path d="M120 -10 L120 700" stroke={roadColor} strokeWidth="24" fill="none" />
          <path d="M280 -10 L280 700" stroke={roadColor} strokeWidth="18" fill="none" />
          <path d="M-10 320 L500 320" stroke={roadColor} strokeWidth="22" fill="none" />
          <path d="M200 100 L350 700" stroke={roadColor} strokeWidth="20" fill="none" />

          {/* Minor lane paths */}
          <path d="M120 200 L280 200" stroke={roadColor} strokeWidth="10" fill="none" />
          <path d="M120 480 L280 480" stroke={roadColor} strokeWidth="10" fill="none" />
        </svg>

        {/* Accuracy range circle around user's location */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full border pointer-events-none ${isDarkMode ? "border-red-500/10 bg-red-500/3" : "border-red-400/20 bg-red-200/5"}`} />

        {/* User's Current Confirmed Location Pin */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-20">
          <div className="relative">
            {/* Blue pin head for user location */}
            <div className="w-9 h-9 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center shadow-lg relative z-10">
              <span className="material-symbols-outlined text-white text-[16px] fill" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
            </div>
            <div className="w-2.5 h-2.5 bg-blue-600 rotate-45 border-r border-b border-white -mt-1.5 mx-auto relative z-0" />
          </div>
          <div className="bg-black/60 backdrop-blur-md text-[8px] font-bold text-white px-2 py-0.5 rounded-md mt-1 max-w-[120px] truncate">
            Your Location
          </div>
        </div>

        {/* Store Pins on Map */}
        {STORES.map((store) => {
          const isStoreSelected = activeStore.id === store.id
          return (
            <button
              key={store.id}
              onClick={() => setSelectedStore(store)}
              style={{ left: store.coords.x, top: store.coords.y }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-15 active:scale-95 transition-transform cursor-pointer border-0 bg-transparent outline-none`}
            >
              <div className="relative">
                {/* Store Pin Head */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md relative z-10 border ${isStoreSelected ? "bg-primary border-[#FAF9F6] text-white" : "bg-[#FAF9F6] dark:bg-[#181818] border-primary text-primary"}`}>
                  <span className="material-symbols-outlined text-sm fill" style={{ fontVariationSettings: "'FILL' 1" }}>store</span>
                </div>
                <div className={`w-2 h-2 rotate-45 -mt-1 mx-auto relative z-0 border-r border-b ${isStoreSelected ? "bg-primary border-[#FAF9F6]" : "bg-[#FAF9F6] dark:bg-[#181818] border-primary"}`} />
                {/* Pulsing effect for the nearest store */}
                {store.nearest && (
                  <div className="absolute -inset-1 rounded-full bg-primary/30 animate-ping -z-10" />
                )}
              </div>
              <div className={`text-[8.5px] font-extrabold px-1.5 py-0.5 rounded shadow mt-1 max-w-[100px] truncate ${isStoreSelected ? "bg-primary text-white" : "bg-[#FAF9F6] dark:bg-[#181818] text-slate-800 dark:text-slate-200"}`}>
                {store.name.replace("Pizza Veg Hut - ", "")}
              </div>
            </button>
          )
        })}

        {/* Floating Back Button (top-left) */}
        <button
          onClick={onClose}
          className={`absolute top-4 left-4 z-30 w-11 h-11 rounded-full shadow-[0_3px_10px_rgba(0,0,0,0.15)] flex items-center justify-center active:scale-90 transition-transform cursor-pointer border-0 outline-none ${isDarkMode ? "bg-[#181818] text-white" : "bg-[#FAF9F6] text-zinc-800"}`}
        >
          <span className="material-symbols-outlined text-lg font-bold">arrow_back</span>
        </button>
      </div>

      {/* Bottom Sheet containing recommended stores */}
      <div className={`absolute bottom-0 left-0 w-full rounded-t-[32px] shadow-[0_-8px_30px_rgba(0,0,0,0.15)] px-5 pt-3 pb-8 z-30 flex flex-col text-left ${sheetBg}`}>
        {/* Drag Handlebar pill */}
        <div className="w-12 h-1 bg-zinc-300 rounded-full mx-auto mb-4 opacity-60" />

        <div className="mb-4">
          <h3 className={`font-extrabold text-base ${textPrimary}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Select Takeaway Store
          </h3>
          <p className={`text-[10px] ${textSecondary} leading-relaxed`}>
            Showing outlets near: <span className="font-bold text-primary">{confirmedAddress || "Indore City Center"}</span>
          </p>
        </div>

        {/* Stores list */}
        <div className="space-y-2.5 max-h-[220px] overflow-y-auto mb-5 pr-1">
          {STORES.map((store) => {
            const isStoreSelected = activeStore.id === store.id
            return (
              <div
                key={store.id}
                onClick={() => setSelectedStore(store)}
                className={`p-3 border rounded-2xl flex items-center justify-between cursor-pointer active:scale-[0.99] transition-all ${cardBg} ${isStoreSelected ? "border-primary/40 ring-1 ring-primary/20" : "border-white/5"}`}
              >
                <div className="text-left space-y-1">
                  <div className="flex items-center gap-1.5">
                    <h4 className={`text-xs font-bold leading-tight ${textPrimary}`}>{store.name}</h4>
                    {store.nearest && (
                      <span className="bg-primary/10 text-primary text-[8px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-wider">Nearest</span>
                    )}
                  </div>
                  <div className="flex gap-2 text-[9px] font-semibold opacity-85">
                    <span className="text-emerald-500">{store.status}</span>
                    <span className="opacity-40">•</span>
                    <span className={textSecondary}>{store.hours}</span>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <span className={`text-[9px] px-2 py-0.5 rounded font-black tracking-wide ${isStoreSelected ? "bg-primary text-white" : "bg-primary/10 text-primary"}`}>
                    {store.dist}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Selected Store Confirmation button */}
        <button
          onClick={() => handleConfirmStore(activeStore)}
          className="w-full h-12 bg-primary hover:bg-red-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md active:scale-98 flex items-center justify-center cursor-pointer border-0 outline-none"
        >
          Confirm Store Takeaway
        </button>
      </div>
    </div>
  )
}
