import React, { useState, useRef } from "react"
import { useNavigate, Link } from "react-router-dom"
import { motion } from "framer-motion"
import { ShieldCheck, Heart, ArrowRight, ArrowLeft, Loader2, ShieldQuestion } from "lucide-react"
import { toast } from "sonner"
import { deliveryAPI } from "@food/api"
import { clearModuleAuth } from "@food/utils/auth"
import { useSystemTheme } from "@/shared/utils/themeSync"
import heroPizza from "@/assets/hero-pizza.png"

const DEFAULT_COUNTRY_CODE = "+91"

export default function DeliverySignIn() {
  const navigate = useNavigate()
  const { primaryColor, companyName = "Papa Veg Pizza" } = useSystemTheme()
  // User app light theme: vibrant brand red/coral (no dark/black tint)
  const brandColor = primaryColor && primaryColor !== "#a43c12" ? primaryColor : "#EE3A43"

  const [phone, setPhone] = useState(() => {
    const stored = sessionStorage.getItem("deliveryAuthData")
    if (stored) {
      try {
        const data = JSON.parse(stored)
        return data.phone ? data.phone.replace("+91", "").trim() : ""
      } catch (e) { return "" }
    }
    return ""
  })
  const [loading, setLoading] = useState(false)
  const submitting = useRef(false)

  const validatePhone = (num) => {
    const digits = num.replace(/\D/g, "")
    return digits.length === 10 && ["6", "7", "8", "9"].includes(digits[0])
  }

  const handleSendOTP = async (e) => {
    if (e) e.preventDefault()
    if (!validatePhone(phone)) {
      toast.error("Please enter a valid 10-digit mobile number")
      return
    }
    if (submitting.current) return
    submitting.current = true
    setLoading(true)

    const fullPhone = `${DEFAULT_COUNTRY_CODE} ${phone}`.trim()

    try {
      clearModuleAuth("delivery")
      await deliveryAPI.sendOTP(fullPhone, "login")

      const authData = {
        method: "phone",
        phone: fullPhone,
        isSignUp: false,
        purpose: "login",
        module: "delivery",
      }
      sessionStorage.setItem("deliveryAuthData", JSON.stringify(authData))
      toast.success("Verification code sent to your phone!")
      navigate("/food/delivery/otp")
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to send OTP."
      toast.error(msg)
    } finally {
      setLoading(false)
      submitting.current = false
    }
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col justify-between relative overflow-hidden font-['Poppins',sans-serif] select-none">
      {/* Top Section with Light Curved Wave Banner */}
      <div>
        <div 
          className="relative w-full pt-6 pb-20 px-6 overflow-hidden rounded-b-[40px] sm:rounded-b-[48px] shadow-md"
          style={{
            background: `linear-gradient(145deg, ${brandColor} 0%, #FF5722 100%)`
          }}
        >
          {/* Soft Accent Circles */}
          <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-white/15 blur-lg pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-white/10 blur-md pointer-events-none" />

          {/* Top Bar with Navigation & Support */}
          <div className="relative z-10 max-w-md mx-auto flex items-center justify-between">
            <Link 
              to="/food/delivery/welcome"
              className="flex items-center gap-1.5 text-white text-xs font-semibold px-3.5 py-1.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md transition-all active:scale-95 shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Welcome</span>
            </Link>

            <Link 
              to="/delivery/auth/support"
              className="flex items-center gap-1.5 text-white text-xs font-semibold px-3.5 py-1.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md transition-all active:scale-95 shadow-sm"
            >
              <ShieldQuestion className="w-4 h-4" />
              <span>Support</span>
            </Link>
          </div>

          {/* Header Title */}
          <div className="relative z-10 text-center mt-3">
            <p className="text-[11px] font-bold tracking-[0.25em] text-white uppercase drop-shadow-sm">
              {companyName}
            </p>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-wider uppercase drop-shadow-sm mt-0.5">
              Delivery Partner
            </h2>
          </div>
        </div>

        {/* Overlapping Circular Rider Badge (Catrider Style) */}
        <div className="relative -mt-14 mb-2 flex justify-center z-20">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white p-2.5 shadow-[0_10px_25px_rgba(0,0,0,0.12)] border-4 border-white flex items-center justify-center relative overflow-hidden group"
          >
            <div 
              className="absolute inset-0 rounded-full opacity-10"
              style={{ backgroundColor: brandColor }}
            />
            <img 
              src="/MapRider.png" 
              alt="Delivery Rider" 
              className="w-full h-full object-contain relative z-10 drop-shadow-sm group-hover:scale-105 transition-transform duration-300" 
            />
          </motion.div>
        </div>

        {/* Floating Light Login Card */}
        <div className="w-full max-w-sm sm:max-w-md mx-auto px-5 relative z-20">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white rounded-[28px] sm:rounded-[32px] p-6 sm:p-8 shadow-[0_10px_35px_rgba(0,0,0,0.06)] border border-gray-100"
          >
            {/* Title */}
            <div className="text-center mb-6">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight uppercase font-['Poppins']">
                Partner Sign In
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium">
                Enter your mobile number to log in or register
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSendOTP} className="space-y-5">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 tracking-wider uppercase mb-1.5 ml-1">
                  Mobile Number
                </label>
                <div 
                  className="flex items-center bg-gray-50 border-2 border-gray-200 rounded-2xl px-4 py-3 transition-all focus-within:border-[#EE3A43] focus-within:bg-white focus-within:ring-4 focus-within:ring-red-500/10"
                >
                  <span 
                    className="text-base font-bold pr-3 border-r border-gray-300 select-none"
                    style={{ color: brandColor }}
                  >
                    +91
                  </span>
                  <input 
                    type="tel"
                    required
                    autoFocus
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    maxLength={10}
                    placeholder="00000 00000"
                    className="w-full bg-transparent pl-3 text-lg font-bold text-gray-900 outline-none tracking-wider placeholder:text-gray-300 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || phone.length < 10}
                className="w-full py-4 rounded-full font-bold text-base text-white shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:pointer-events-none"
                style={{
                  backgroundColor: brandColor,
                  boxShadow: `0 10px 24px -4px ${brandColor}55`
                }}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>Continue Delivery</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </div>

      {/* Footer & Badges */}
      <div className="relative z-10 max-w-md mx-auto px-6 py-6 text-center">
        <p className="text-[11px] text-gray-400 font-medium leading-relaxed">
          By continuing, you agree to {companyName}'s <br />
          <Link to="/food/delivery/profile/terms" className="font-bold underline text-gray-700 hover:text-[#EE3A43] transition-colors">
            Terms of Service
          </Link>
          <span className="mx-1">&</span>
          <Link to="/food/delivery/profile/privacy" className="font-bold underline text-gray-700 hover:text-[#EE3A43] transition-colors">
            Privacy Policy
          </Link>
        </p>

        <div className="flex items-center justify-center gap-6 mt-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Safe & Secure</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Heart className="w-4 h-4" style={{ color: brandColor }} />
            <span>Earning Opportunities</span>
          </div>
        </div>
      </div>

      {/* Decorative Signature Pizza Dish in Bottom-Right Corner (Catrider Style) */}
      <img 
        src={heroPizza} 
        alt="Delicious Pizza"
        className="absolute -bottom-7 -right-7 w-36 h-36 sm:w-44 sm:h-44 object-contain pointer-events-none drop-shadow-[0_16px_25px_rgba(0,0,0,0.14)] rotate-[-12deg] z-0 select-none opacity-95" 
      />
    </div>
  )
}
