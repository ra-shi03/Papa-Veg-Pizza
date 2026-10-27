import React, { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { useSystemTheme } from "@/shared/utils/themeSync"
import { deliveryClient } from "@/services/api/axios"
import logoNew from "@/assets/logo1.png"
import heroPizza from "@/assets/hero-pizza.png"

export default function DeliveryWelcome() {
  const navigate = useNavigate()
  const { primaryColor, companyName: systemCompanyName = "Papa Veg Pizza" } = useSystemTheme()
  const fallbackBrandColor = primaryColor && primaryColor !== "#a43c12" ? primaryColor : "#EE3A43"

  const [config, setConfig] = useState({
    companyName: systemCompanyName,
    partnerBadgeText: "DELIVERY PARTNER",
    logoUrl: "/logo1.png",
    titlePrimary: "WELCOME TO",
    titleHighlight: "FOOD DELIVERY",
    subtitle: "Deliver delicious meals, earn great incentives, and enjoy flexible working hours.",
    heroMediaUrl: "/delivery_welcome_rider.png",
    plateMediaUrl: "/hero-pizza.png",
    buttonText: "Get Started",
    loginLinkText: "Already a partner? Sign In",
    primaryColor: fallbackBrandColor,
    secondaryColor: "#FF5722",
    isActive: true
  })

  useEffect(() => {
    let isMounted = true
    const fetchConfig = async () => {
      try {
        const { data } = await deliveryClient.get("/settings/delivery-welcome")
        if (data?.data && isMounted) {
          const cfg = data.data
          if (cfg.isActive === false) {
            // If welcome screen is disabled by admin, proceed directly to login
            navigate("/food/delivery/login", { replace: true })
            return
          }
          setConfig(prev => ({
            ...prev,
            ...cfg,
            companyName: cfg.companyName || prev.companyName,
            partnerBadgeText: cfg.partnerBadgeText || prev.partnerBadgeText,
            titlePrimary: cfg.titlePrimary || prev.titlePrimary,
            titleHighlight: cfg.titleHighlight || prev.titleHighlight,
            subtitle: cfg.subtitle || prev.subtitle,
            heroMediaUrl: cfg.heroMediaUrl || prev.heroMediaUrl,
            plateMediaUrl: cfg.plateMediaUrl || prev.plateMediaUrl,
            buttonText: cfg.buttonText || prev.buttonText,
            primaryColor: cfg.primaryColor || fallbackBrandColor,
            secondaryColor: cfg.secondaryColor || "#FF5722"
          }))
        }
      } catch (err) {
        console.warn("[DeliveryWelcome] Using default config due to error:", err?.message)
      }
    }

    fetchConfig()
    return () => { isMounted = false }
  }, [fallbackBrandColor, navigate])

  const effectivePrimary = config.primaryColor || fallbackBrandColor
  const effectiveSecondary = config.secondaryColor || "#FF5722"

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
      {/* Top Header with SVG Smooth Downward Swoop Curve (Catrider Image 1 Style) */}
      <div className="relative w-full overflow-visible">
        <svg
          viewBox="0 0 375 180"
          fill="none"
          preserveAspectRatio="none"
          className="w-full h-[180px] sm:h-[210px] block drop-shadow-sm"
        >
          <defs>
            <linearGradient id="deliveryWaveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={effectivePrimary} />
              <stop offset="100%" stopColor={effectiveSecondary} />
            </linearGradient>
          </defs>
          {/* Mathematically precise curve: ends at y=120, center apex dips smoothly to exact bottom edge at y=180 */}
          <path
            d="M 0,0 L 375,0 L 375,120 Q 187.5,240 0,120 Z"
            fill="url(#deliveryWaveGrad)"
          />
        </svg>

        {/* Soft Background Accent Circles */}
        <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-white/15 blur-lg pointer-events-none" />
        <div className="absolute top-2 left-6 w-32 h-32 rounded-full bg-white/10 blur-md pointer-events-none" />

        {/* Circular Logo Badge Centered Exactly on the Curve Apex */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-1/2 z-20">
          <motion.div 
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 240, damping: 20 }}
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white flex items-center justify-center p-3.5 sm:p-4 border-[3.5px] shadow-[0_12px_28px_rgba(0,0,0,0.12)] ring-4 ring-white"
            style={{ borderColor: effectivePrimary }}
          >
            <img 
              src={config.logoUrl || logoNew} 
              alt="Brand Logo" 
              className="w-full h-full object-contain"
              onError={(e) => { e.currentTarget.src = logoNew; }}
            />
          </motion.div>
        </div>
      </div>

      {/* Center Section: Red Scooter Rider & Dynamic Typography */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-4 sm:pt-20 relative z-10">
        {/* Scooter Rider Illustration with Light Warm Halo */}
        <motion.div 
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative flex items-center justify-center mb-5"
        >
          {/* Subtle brand tint halo */}
          <div 
            className="w-52 h-52 sm:w-60 sm:h-60 rounded-full absolute pointer-events-none opacity-10 blur-lg"
            style={{ backgroundColor: effectivePrimary }}
          />
          <img 
            src={config.heroMediaUrl || "/delivery_welcome_rider.png"} 
            alt="Delivery Partner Rider" 
            className="w-48 h-48 sm:w-56 sm:h-56 object-contain relative z-10 drop-shadow-md"
            onError={(e) => { e.currentTarget.src = "/delivery_welcome_rider.png"; }}
          />
        </motion.div>

        {/* Dynamic Heading & Subtitle */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="text-center"
        >
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight uppercase leading-tight font-['Poppins']">
            {config.titlePrimary} <br />
            <span style={{ color: effectivePrimary }}>{config.titleHighlight}</span>
          </h1>

          <p className="text-xs sm:text-sm text-gray-500 mt-2 max-w-[280px] mx-auto font-medium leading-relaxed">
            {config.subtitle}
          </p>
        </motion.div>
      </div>

      {/* Bottom Section: Decorative Pizza on Left & "Get Started" Pill on Right (Catrider Style) */}
      <div className="relative w-full pb-8 pt-2 px-6 flex items-end justify-between min-h-[120px]">
        {/* Decorative Pizza Plate in Bottom-Left Corner */}
        <img 
          src={config.plateMediaUrl || heroPizza} 
          alt="Delicious Pizza"
          className="absolute -bottom-7 -left-7 w-36 h-36 sm:w-44 sm:h-44 object-contain pointer-events-none drop-shadow-[0_16px_25px_rgba(0,0,0,0.14)] rotate-[15deg] z-10 select-none" 
          onError={(e) => { e.currentTarget.src = heroPizza; }}
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
              backgroundColor: effectivePrimary,
              boxShadow: `0 10px 25px -4px ${effectivePrimary}55`
            }}
          >
            <span>{config.buttonText || "Get Started"}</span>
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
          </motion.button>

          <Link 
            to="/food/delivery/login"
            className="text-[11px] font-semibold text-gray-500 hover:text-gray-900 mt-2 mr-2 transition-colors"
          >
            {config.loginLinkText?.includes("Sign In") ? (
              <>
                {config.loginLinkText.replace("Sign In", "")}
                <span className="underline font-bold" style={{ color: effectivePrimary }}>Sign In</span>
              </>
            ) : (
              config.loginLinkText || "Already a partner? Sign In"
            )}
          </Link>
        </div>
      </div>
    </div>
  )
}
