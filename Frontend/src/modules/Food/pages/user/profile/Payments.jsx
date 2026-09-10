import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ChevronLeft, Send, CreditCard, Wallet, Landmark, Banknote } from "lucide-react"
import { toast } from "sonner"
import AnimatedPage from "@food/components/user/AnimatedPage"

export default function Payments() {
  const navigate = useNavigate()

  const [isDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("appTheme")
    return savedTheme ? savedTheme === "dark" : true
  })

  // Load selection from localStorage, defaulting to 'upi'
  const [selectedMethod, setSelectedMethod] = useState(() => {
    return localStorage.getItem("preferred_payment_method") || "upi"
  })

  const handleSave = () => {
    try {
      localStorage.setItem("preferred_payment_method", selectedMethod)
      toast.success("Preferred payment method saved successfully!")
      navigate(-1)
    } catch (e) {
      toast.error("Failed to save preferred payment method.")
    }
  }

  const paymentOptions = [
    {
      id: "upi",
      title: "UPI",
      icon: <Send className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />,
      subLogos: (
        <div className="flex items-center gap-4 mt-2.5 flex-wrap">
          {/* G Pay */}
          <span className="flex items-center font-sans font-extrabold text-sm select-none tracking-tight">
            <span className="text-[#4285F4]">G</span>
            <span className="text-[#EA4335]">P</span>
            <span className="text-[#FBBC05]">a</span>
            <span className="text-[#34A853]">y</span>
          </span>
          {/* PhonePe */}
          <span className="inline-flex items-center justify-center px-2 py-0.5 bg-[#5f259f] text-white rounded text-[10px] font-extrabold select-none">
            PhonePe
          </span>
          {/* Amazon Pay */}
          <span className="flex items-center gap-0.5 text-[#FF9900] font-sans font-bold text-[11px] select-none">
            amazon<span className="text-zinc-900 dark:text-zinc-100 font-black">pay</span>
          </span>
          {/* Paytm */}
          <span className="font-sans font-black text-xs select-none">
            <span className="text-[#00B9F5]">pay</span>
            <span className="text-[#002E6E] dark:text-[#80ccff]">tm</span>
          </span>
        </div>
      )
    },
    {
      id: "cards",
      title: "Cards",
      icon: <CreditCard className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />,
      subLogos: (
        <div className="flex items-center gap-4 mt-2.5 flex-wrap">
          {/* Visa */}
          <span className="font-serif italic font-black text-sm text-[#1A1F71] dark:text-[#4d86ff] select-none tracking-wider">
            VISA
          </span>
          {/* Mastercard */}
          <span className="flex items-center select-none shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EB001B] z-10"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F00] -ml-1"></span>
          </span>
          {/* RuPay */}
          <span className="font-sans font-black italic text-xs text-[#0A2240] dark:text-zinc-100 select-none">
            RuPay<span className="text-[#F26722]">▸</span>
          </span>
        </div>
      )
    },
    {
      id: "wallet",
      title: "Wallet",
      icon: <Wallet className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />,
      subLogos: (
        <div className="flex items-center gap-4 mt-2.5 flex-wrap">
          {/* Freecharge */}
          <span className="inline-flex items-center justify-center px-2 py-0.5 bg-[#FF5A5F] text-white rounded text-[9px] font-extrabold select-none uppercase tracking-tight">
            freecharge
          </span>
          {/* Mobikwik */}
          <span className="font-sans font-black text-[10px] text-[#005CA9] dark:text-[#3894e6] select-none">
            MobiKwik
          </span>
          {/* PhonePe Wallet */}
          <span className="inline-flex items-center justify-center px-2 py-0.5 bg-[#5f259f] text-white rounded text-[9px] font-extrabold select-none">
            PhonePe
          </span>
          {/* Ola Money */}
          <span className="font-sans font-black text-[9px] bg-black text-white dark:bg-zinc-800 dark:border dark:border-white/10 px-2 py-0.5 rounded select-none">
            OLA
          </span>
          {/* Amazon Pay Wallet */}
          <span className="flex items-center gap-0.5 text-[#FF9900] font-sans font-bold text-[10px] select-none">
            amazon<span className="text-zinc-900 dark:text-zinc-100 font-extrabold">pay</span>
          </span>
        </div>
      )
    },
    {
      id: "net_banking",
      title: "Net banking",
      icon: <Landmark className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />,
      subLogos: (
        <div className="flex items-center gap-4 mt-2.5 flex-wrap">
          {/* SBI */}
          <span className="flex items-center gap-1 select-none">
            <span className="w-3.5 h-3.5 rounded-full border border-[#00BFFF] bg-transparent flex items-center justify-center relative shrink-0">
              <span className="w-1.5 h-1.5 bg-white dark:bg-[#111] rounded-full"></span>
              <span className="absolute bottom-0 w-0.5 h-1.5 bg-[#00BFFF]"></span>
            </span>
            <span className="text-[10px] font-black text-[#002E6E] dark:text-[#66ccff]">SBI</span>
          </span>
          {/* HDFC */}
          <span className="inline-block px-1.5 py-0.5 bg-[#1d3557] text-white font-sans font-black text-[8px] rounded select-none">
            HDFC
          </span>
          {/* ICICI */}
          <span className="font-sans font-black italic text-[10px] text-[#b22222] dark:text-red-400 select-none">
            ICICI
          </span>
        </div>
      )
    },
    {
      id: "cash",
      title: "Cash",
      icon: <Banknote className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />,
      subLogos: null
    }
  ]

  return (
    <AnimatedPage className={`min-h-screen pb-32 flex flex-col transition-colors duration-300 ${isDarkMode ? "dark bg-[#111111]" : "bg-[#ffffff]"}`}>
      
      {/* Header */}
      <header className={`fixed top-0 left-0 w-full z-50 h-16 flex items-center px-4 justify-between border-b ${
        isDarkMode ? "bg-[#111111] border-white/10 text-white" : "bg-[#ffffff] border-zinc-200 text-zinc-950"
      }`}>
        <button
          onClick={() => navigate(-1)}
          className={`flex items-center justify-center p-2 rounded-full cursor-pointer transition-all active:scale-95 bg-transparent border-0 outline-none ${
            isDarkMode ? "text-white hover:bg-white/10" : "text-zinc-950 hover:bg-zinc-100"
          }`}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        
        <h1 className="text-lg font-bold text-center flex-1 font-headline-lg-mobile pl-6">
          Preferred payment
        </h1>

        <button
          onClick={handleSave}
          className="text-[#E53935] hover:text-red-700 font-bold text-sm px-3 py-1.5 rounded-lg active:scale-95 cursor-pointer bg-transparent border-0 outline-none transition-all font-sans"
        >
          Save
        </button>
      </header>

      {/* Main Options List */}
      <main className="mt-20 flex-1 flex flex-col max-w-md mx-auto w-full select-none">
        {paymentOptions.map((option) => (
          <div
            key={option.id}
            onClick={() => setSelectedMethod(option.id)}
            className={`flex items-start justify-between px-6 py-5 cursor-pointer border-b transition-colors ${
              isDarkMode 
                ? "border-white/5 hover:bg-white/[0.02]" 
                : "border-zinc-100 hover:bg-zinc-50/50"
            }`}
          >
            {/* Left part: Icon + Text */}
            <div className="flex gap-4 items-start text-left">
              <div className="mt-0.5 shrink-0">
                {option.icon}
              </div>
              <div className="flex flex-col">
                <span className={`text-base font-bold font-headline-lg-mobile ${
                  isDarkMode ? "text-white" : "text-zinc-800"
                }`}>
                  {option.title}
                </span>
                {option.subLogos}
              </div>
            </div>

            {/* Right part: Radio button */}
            <div className="flex items-center h-full pt-1.5">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                selectedMethod === option.id
                  ? "border-[#E53935] bg-[#E53935]"
                  : isDarkMode
                    ? "border-zinc-700"
                    : "border-zinc-300"
              }`}>
                {selectedMethod === option.id && (
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </div>
            </div>
          </div>
        ))}
      </main>

    </AnimatedPage>
  )
}
