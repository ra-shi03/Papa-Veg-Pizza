import React from "react"
import { useLocationStore } from "@food/store/locationStore"

export default function DeliveryOrCollectionModal({
  show,
  onClose,
  onSelect,
  isDarkMode
}) {
  const { isModalOpen, modalMessage } = useLocationStore()

  if (!show) return null

  // Theme colors matching Pizza Hut premium visual aesthetics
  const backdropBg = "bg-black/60 backdrop-blur-sm"
  const sheetBg = isDarkMode 
    ? "bg-[#141414] border-t border-white/12 text-white" 
    : "bg-[#F7F7F7] border-t border-zinc-200 text-zinc-900"
  
  const cardBg = isDarkMode
    ? "bg-white/5 hover:bg-white/10 border-white/10 text-white"
    : "bg-[#FAF9F6] hover:bg-zinc-50 border-zinc-200 text-zinc-900"
  
  const textSecondary = isDarkMode ? "text-zinc-400" : "text-zinc-500"
  const iconBorder = isDarkMode ? "border-[#E53935]/40 bg-[#E53935]/10" : "border-[#E53935]/30 bg-[#E53935]/5"

  const options = [
    {
      id: "delivery",
      title: "Delivery",
      subtitle: "Let us know your location",
      icon: "moped"
    },
    {
      id: "takeaway",
      title: "Takeaway",
      subtitle: "Find your nearest hut",
      icon: "storefront"
    },
    {
      id: "incar",
      title: "In-Car",
      subtitle: "Dine in your vehicle",
      icon: "directions_car"
    },
    {
      id: "train",
      title: "Delivery on Train",
      subtitle: "Get food delivered to your coach",
      icon: "train"
    }
  ]

  return (
    <div 
      className={`fixed inset-0 z-55 flex items-end justify-center ${backdropBg} transition-opacity duration-300`}
      onClick={onClose}
    >
      <div 
        className={`w-full max-w-md rounded-t-[32px] shadow-[0_-8px_30px_rgba(0,0,0,0.2)] px-6 pt-3 pb-8 z-30 flex flex-col text-left transition-transform duration-300 translate-y-0 ${sheetBg}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Handle bar pill */}
        <div className="w-12 h-1 bg-zinc-400/50 rounded-full mx-auto mb-5 cursor-pointer" onClick={onClose} />

        {/* Modal Header */}
        <div className="flex justify-between items-start mb-1">
          <h3 
            className="font-bold text-[22px] tracking-tight leading-tight" 
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Select Delivery or Collection?
          </h3>
          <button 
            onClick={onClose}
            className={`material-symbols-outlined text-xl hover:opacity-80 cursor-pointer bg-transparent border-0 outline-none p-1 -mt-1 ${
              isDarkMode ? "text-white/50 hover:text-white" : "text-zinc-400 hover:text-zinc-600"
            }`}
          >
            close
          </button>
        </div>

        {/* Modal Description */}
        <p className={`text-[13px] font-medium leading-relaxed mb-6 ${textSecondary}`}>
          This enables you to see local deals and prices
        </p>

        {/* Guard message display */}
        {isModalOpen && modalMessage && (
          <div className="mb-6 p-4 rounded-[20px] bg-[#E53935]/10 border border-[#E53935]/20 text-[#E53935] text-xs font-semibold leading-relaxed animate-pulse">
            {modalMessage}
          </div>
        )}

        {/* Service Options List */}
        <div className="space-y-3">
          {options.map((opt) => (
            <div 
              key={opt.id}
              onClick={() => {
                onSelect(opt.id)
                onClose()
              }}
              className={`p-4 rounded-[20px] border flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all ${cardBg}`}
            >
              <div className="flex items-center gap-4">
                {/* Red outline circular badge for icon */}
                <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-[#E53935] ${iconBorder}`}>
                  <span className="material-symbols-outlined text-[26px]">{opt.icon}</span>
                </div>
                <div className="text-left space-y-0.5">
                  <h4 className="text-[15px] font-bold tracking-tight leading-snug">
                    {opt.title}
                  </h4>
                  <p className={`text-[11px] font-medium ${textSecondary}`}>
                    {opt.subtitle}
                  </p>
                </div>
              </div>
              
              {/* Chevron icon */}
              <span className={`material-symbols-outlined text-lg ${isDarkMode ? "text-white/40" : "text-zinc-400"}`}>
                arrow_forward_ios
              </span>
            </div>
          ))}
        </div>

        {/* Guard modal explicit actions */}
        {isModalOpen && (
          <div className="flex gap-3 mt-6 animate-fadeIn">
            <button
              onClick={onClose}
              className={`flex-1 h-12 border rounded-2xl text-xs uppercase font-extrabold cursor-pointer transition-all ${
                isDarkMode 
                  ? "bg-white/5 border-white/10 hover:bg-white/10 text-white" 
                  : "bg-zinc-100 border-zinc-200 hover:bg-zinc-200 text-zinc-700"
              }`}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onSelect("delivery")
                onClose()
              }}
              className="flex-1 h-12 bg-[#E53935] hover:bg-red-700 text-white font-extrabold rounded-2xl text-xs uppercase cursor-pointer transition-all shadow-[0_4px_12px_rgba(229,57,53,0.25)] border-0"
            >
              Confirm Location
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
