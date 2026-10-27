import React from "react"
import { useNavigate, Link } from "react-router-dom"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { useSystemTheme } from "@/shared/utils/themeSync"
import logoNew from "@/assets/logo1.png"
import heroPizza from "@/assets/hero-pizza.png"

export default function DeliveryWelcome() {
  const navigate = useNavigate()
  const { primaryColor, companyName = "Papa Veg Pizza" } = useSystemTheme()
  // User app light theme: vibrant brand red/coral (no dark/black tint)
  const brandColor = primaryColor && primaryColor !== "#a43c12" ? primaryColor : "#EE3A43"

  const handleGetStarted = () => {
    const token = localStorage.getItem("delivery_accessToken")
    const authenticated = localStorage.getItem("delivery_authenticated") === "true"
    if (token && authenticated) {
      navigate("/food/delivery", { replace: true })
      return
    }
    navigate("/food/delivery/login")
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col justify-between relative overflow-hidden font-['Poppins',sans-serif] select-none">
      {/* Top Curved Header in Light/Vibrant Brand Theme */}
      <div 
        className="relative w-full pt-8 pb-14 px-6 overflow-hidden rounded-b-[44px] sm:rounded-b-[52px] shadow-md"
        style={{
          background: `linear-gradient(145deg, ${brandColor} 0%, #FF5722 100%)`
        }}
      >
        {/* Soft Background Accent Circles */}
        <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-white/15 blur-lg pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full bg-white/10 blur-md pointer-events-none" />

        {/* Circular Logo Badge (Catrider Style) */}
        <div className="relative z-10 flex flex-col items-center">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 240, damping: 20 }}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white shadow-[0_8px_20px_rgba(0,0,0,0.12)] border-4 border-white p-2.5 flex items-center justify-center mb-2.5"
          >
            <img 
              src={logoNew} 
              alt={companyName} 
              className="w-full h-full object-contain"
            />
          </motion.div>

          <p className="text-xs font-bold tracking-[0.25em] text-white uppercase text-center drop-shadow-sm">
            {companyName}
          </p>
          <span className="text-[10px] text-white/90 tracking-widest uppercase font-semibold mt-0.5">
            Delivery Partner
          </span>
        </div>
      </div>

      {/* Center Section: Delivery Rider & Crisp Light Typography */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-6 relative z-10">
        {/* Rider Illustration on Pure White with Soft Glow */}
        <motion.div 
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative flex items-center justify-center mb-5"
        >
          {/* Very Soft Light Tint Halo */}
          <div 
            className="w-48 h-48 sm:w-56 sm:h-56 rounded-full absolute pointer-events-none opacity-10 blur-md"
            style={{ backgroundColor: brandColor }}
          />
          <img 
            src="/MapRider.png" 
            alt="Delivery Partner Rider" 
            className="w-44 h-44 sm:w-52 sm:h-52 object-contain relative z-10 drop-shadow-lg"
          />
        </motion.div>

        {/* Heading & Subtitle */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="text-center"
        >
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight uppercase leading-tight font-['Poppins']">
            Welcome To <br />
            <span style={{ color: brandColor }}>Food Delivery</span>
          </h1>

          <p className="text-xs sm:text-sm text-gray-500 mt-2 max-w-[280px] mx-auto font-medium leading-relaxed">
            Deliver delicious meals, earn great incentives, and enjoy flexible working hours.
          </p>
        </motion.div>
      </div>

      {/* Bottom Section: Decorative Pizza on Left & "Get Started" Pill on Right */}
      <div className="relative w-full pb-8 pt-2 px-6 flex items-end justify-between min-h-[120px]">
        {/* Decorative Pizza Plate in Bottom-Left Corner (Catrider Style) */}
        <img 
          src={heroPizza} 
          alt="Delicious Pizza"
          className="absolute -bottom-7 -left-7 w-36 h-36 sm:w-44 sm:h-44 object-contain pointer-events-none drop-shadow-[0_16px_25px_rgba(0,0,0,0.14)] rotate-[15deg] z-10 select-none" 
        />

        {/* Spacer on the left to prevent overlap */}
        <div className="w-24 sm:w-32 pointer-events-none" />

        {/* Action Button & Link on the Right */}
        <div className="relative z-20 flex flex-col items-end">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleGetStarted}
            className="px-8 py-3.5 sm:px-9 sm:py-4 rounded-full font-bold text-sm sm:text-base text-white shadow-xl flex items-center gap-2 group transition-all"
            style={{
              backgroundColor: brandColor,
              boxShadow: `0 10px 25px -4px ${brandColor}55`
            }}
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
          </motion.button>

          <Link 
            to="/food/delivery/login"
            className="text-[11px] font-semibold text-gray-500 hover:text-gray-900 mt-2 mr-2 transition-colors"
          >
            Already a partner? <span className="underline font-bold" style={{ color: brandColor }}>Sign In</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
