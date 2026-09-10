import React from "react"
import { useLocationStore } from "@food/store/locationStore"

export default function DeliveryMapModal({
  show,
  onClose,
  deliveryAddress,
  setDeliveryAddress,
  setActiveService,
  triggerToast,
  isDarkMode
}) {
  const { confirmLocation } = useLocationStore()

  if (!show) return null

  // Clean address calibration using real browser geolocation
  const handleGpsCalibrate = () => {
    if (navigator.geolocation) {
      triggerToast("Calibrating location...")
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          triggerToast("Location detected! Fetching address...")
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
            .then(res => res.json())
            .then(data => {
              if (data && data.display_name) {
                setDeliveryAddress(data.display_name)
                triggerToast("Location calibrated successfully!")
              } else {
                setDeliveryAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`)
                triggerToast("Location calibrated to coordinates!")
              }
            })
            .catch(err => {
              setDeliveryAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`)
              triggerToast("Location calibrated to coordinates!")
            })
        },
        (error) => {
          triggerToast("Failed to calibrate location: " + error.message)
        }
      )
    } else {
      triggerToast("Browser geolocation is not supported.")
    }
  }

  const handleStartOrder = () => {
    const finalAddr = deliveryAddress.trim() || "Joshi Colony, Bk Sindhi Colony, Indore, Indore"
    setDeliveryAddress(finalAddr)
    
    // Confirm location globally
    confirmLocation({
      address: finalAddr,
      serviceType: "delivery",
      latitude: 22.7196,
      longitude: 75.8577
    })
    
    onClose()
    triggerToast("Delivery location confirmed!")
  }

  // Dark/Light theme styles
  const mapBg = isDarkMode ? "#1d2731" : "#d9ecf5"
  const roadColor = isDarkMode ? "#2c3e50" : "#ffffff"
  const blockColor = isDarkMode ? "#243342" : "#e3f2fd"
  const textPrimary = isDarkMode ? "text-white" : "text-zinc-900"
  const textSecondary = isDarkMode ? "text-slate-400" : "text-slate-500"
  const sheetBg = isDarkMode ? "bg-[#131313] border-t border-white/10" : "bg-[#FAF9F6]"
  const inputBg = isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-[#FAF9F6] border-zinc-200 text-zinc-800"

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

        {/* Accuracy range circle */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full border pointer-events-none ${isDarkMode ? "border-sky-500/20 bg-sky-500/5" : "border-sky-400/40 bg-sky-200/10"
          }`} />

        {/* Map POIs */}
        {/* SLB Enterprises Indore */}
        <div className="absolute top-[80px] left-[40px] flex items-center gap-1 pointer-events-none">
          <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${isDarkMode
            ? "bg-[#1976D2]/20 border-[#1976D2]/40 text-[#42a5f5]"
            : "bg-[#1976D2]/15 border-[#1976D2]/30 text-[#1976D2]"
            }`}>
            <span className="material-symbols-outlined text-[10px] fill" style={{ fontVariationSettings: "'FILL' 1" }}>business</span>
          </div>
          <div className="text-left leading-tight">
            <p className={`text-[10px] font-extrabold ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>SLB Enterprises Indore</p>
            <p className={`text-[7.5px] font-bold ${textSecondary}`}>एसएलबी एंटरप्राइजेज इंदौर</p>
          </div>
        </div>

        {/* Ganesh Bakery Sindhi Colony */}
        <div className="absolute top-[220px] right-[20px] flex items-center gap-1 pointer-events-none">
          <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${isDarkMode
            ? "bg-[#E65100]/20 border-[#E65100]/40 text-[#ffb74d]"
            : "bg-[#E65100]/15 border-[#E65100]/30 text-[#E65100]"
            }`}>
            <span className="material-symbols-outlined text-[10px] fill" style={{ fontVariationSettings: "'FILL' 1" }}>store</span>
          </div>
          <div className="text-left leading-tight">
            <p className={`text-[10px] font-extrabold ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>Ganesh Bakery Sindhi Colony</p>
            <p className={`text-[7.5px] font-bold ${textSecondary}`}>गणेश बेकरी सिंधी कॉलोनी</p>
          </div>
        </div>

        {/* Aarti Hardware */}
        <div className="absolute top-[360px] right-[40px] flex items-center gap-1 pointer-events-none">
          <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${isDarkMode
            ? "bg-[#0288D1]/20 border-[#0288D1]/40 text-[#29b6f6]"
            : "bg-[#0288D1]/15 border-[#0288D1]/30 text-[#0288D1]"
            }`}>
            <span className="material-symbols-outlined text-[10px] fill" style={{ fontVariationSettings: "'FILL' 1" }}>build</span>
          </div>
          <div className="text-left leading-tight">
            <p className={`text-[10px] font-extrabold ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>Aarti Hardware</p>
            <p className={`text-[7.5px] font-bold ${textSecondary}`}>आरती हार्डवेयर</p>
          </div>
        </div>

        {/* Wadhwani Auto Exchange */}
        <div className="absolute top-[380px] left-[30px] flex items-center gap-1 pointer-events-none">
          <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${isDarkMode
            ? "bg-[#0288D1]/20 border-[#0288D1]/40 text-[#29b6f6]"
            : "bg-[#0288D1]/15 border-[#0288D1]/30 text-[#0288D1]"
            }`}>
            <span className="material-symbols-outlined text-[10px] fill" style={{ fontVariationSettings: "'FILL' 1" }}>directions_car</span>
          </div>
          <div className="text-left leading-tight">
            <p className={`text-[10px] font-extrabold ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>Wadhwani Auto Exchange</p>
            <p className={`text-[7.5px] font-bold ${textSecondary}`}>वाधवानी ऑटो एक्सचेंज</p>
          </div>
        </div>

        {/* Veera Di Hatti */}
        <div className="absolute bottom-[230px] right-[60px] flex items-center gap-1 pointer-events-none">
          <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${isDarkMode
            ? "bg-[#E65100]/20 border-[#E65100]/40 text-[#ffb74d]"
            : "bg-[#E65100]/15 border-[#E65100]/30 text-[#E65100]"
            }`}>
            <span className="material-symbols-outlined text-[10px] fill" style={{ fontVariationSettings: "'FILL' 1" }}>store</span>
          </div>
          <div className="text-left leading-tight">
            <p className={`text-[10px] font-extrabold ${isDarkMode ? "text-slate-200" : "text-[#795548]"}`}>Veera Di Hatti</p>
            <p className={`text-[7.5px] font-bold ${isDarkMode ? "text-slate-400" : "#a1887f"}`}>वीरा दी हट्टी</p>
          </div>
        </div>

        {/* Road Labels */}
        <div className="absolute top-[170px] right-[10px] rotate-75 pointer-events-none opacity-60">
          <span className="text-[8px] font-extrabold text-slate-500 tracking-wider">Gali Number 5</span>
        </div>
        <div className="absolute bottom-[280px] right-[120px] rotate-[83deg] pointer-events-none opacity-60">
          <span className="text-[8px] font-extrabold text-slate-500 tracking-wider">Sant Shree Siruram Marg</span>
        </div>

        {/* Google Watermark */}
        <div className="absolute bottom-[220px] left-[15px] pointer-events-none opacity-60 flex items-center gap-0.5">
          <span className="text-sm font-extrabold tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <span className="text-[#4285F4]">G</span>
            <span className="text-[#EA4335]">o</span>
            <span className="text-[#FBBC05]">o</span>
            <span className="text-[#4285F4]">g</span>
            <span className="text-[#34A853]">l</span>
            <span className="text-[#EA4335]">e</span>
          </span>
        </div>

        {/* Floating Back Button (top-left) */}
        <button
          onClick={onClose}
          className={`absolute top-4 left-4 z-30 w-11 h-11 rounded-full shadow-[0_3px_10px_rgba(0,0,0,0.15)] flex items-center justify-center active:scale-90 transition-transform cursor-pointer border-0 outline-none ${isDarkMode ? "bg-[#181818] text-white" : "bg-white text-zinc-800"
            }`}
        >
          <span className="material-symbols-outlined text-lg font-bold">arrow_back</span>
        </button>

        {/* Floating GPS Locator Button (top-right) */}
        <button
          onClick={handleGpsCalibrate}
          className={`absolute top-4 right-4 z-30 w-11 h-11 rounded-full shadow-[0_3px_10px_rgba(0,0,0,0.15)] flex items-center justify-center active:scale-90 transition-transform cursor-pointer border-0 outline-none ${isDarkMode ? "bg-[#181818] text-white" : "bg-white text-zinc-800"
            }`}
        >
          <span className="material-symbols-outlined text-lg font-bold" style={{ transform: "rotate(45deg)" }}>navigation</span>
        </button>

        {/* Central Pin Marker */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-20">
          <div className="relative">
            {/* Red pin head */}
            <div className="w-10 h-10 rounded-full bg-[#E53935] border-2 border-white flex items-center justify-center shadow-lg relative z-10">
              <span className="material-symbols-outlined text-white text-lg fill" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
            </div>
            {/* Pin point triangle */}
            <div className="w-3 h-3 bg-[#E53935] rotate-45 border-r border-b border-white -mt-1.5 mx-auto relative z-0" />
          </div>
          {/* Shadow base on map */}
          <div className="w-4 h-1 bg-black/40 rounded-full blur-[1px] mt-0.5" />
        </div>
      </div>

      {/* Bottom Sheet delivery container */}
      <div className={`absolute bottom-0 left-0 w-full rounded-t-[32px] shadow-[0_-8px_30px_rgba(0,0,0,0.15)] px-5 pt-3 pb-8 z-30 flex flex-col text-left ${sheetBg}`}>
        {/* Drag Handlebar pill */}
        <div className="w-12 h-1 bg-zinc-300 rounded-full mx-auto mb-5 opacity-60" />

        <h3 className={`font-extrabold text-lg mb-4 ${textPrimary}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Delivery location
        </h3>

        {/* Search Input Box */}
        <div className="relative mb-5">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-xl">
            search
          </span>
          <input
            type="text"
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            className={`w-full h-12 rounded-xl pl-12 pr-4 text-xs font-bold outline-none border focus:border-red-400 focus:ring-1 focus:ring-red-400 ${inputBg}`}
            placeholder="Search for area, street name..."
          />
        </div>

        {/* Start my order CTA */}
        <button
          onClick={handleStartOrder}
          className="w-full h-12 bg-primary hover:bg-[#155E37] text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md active:scale-98 flex items-center justify-center cursor-pointer border-0 outline-none"
        >
          START MY ORDER
        </button>
      </div>
    </div>
  )
}
