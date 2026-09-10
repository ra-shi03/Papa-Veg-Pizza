import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useLocationStore } from "@food/store/locationStore"
import logoNew from "@/assets/logo1.png"

export default function WelcomeScreen() {
  const navigate = useNavigate()
  const { clearLocation } = useLocationStore()

  const [logoUrl, setLogoUrl] = useState(() => localStorage.getItem("sa_logo") || logoNew)

  // Load Google Fonts dynamically on mount
  useEffect(() => {
    const linkFonts = document.createElement("link")
    linkFonts.href = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Inter:wght@400;600;700&display=swap"
    linkFonts.rel = "stylesheet"
    document.head.appendChild(linkFonts)

    const handleBrandingSync = () => {
      setLogoUrl(localStorage.getItem("sa_logo") || logoNew)
    }
    window.addEventListener("systemThemeChanged", handleBrandingSync)

    return () => {
      document.head.removeChild(linkFonts)
      window.removeEventListener("systemThemeChanged", handleBrandingSync)
    }
  }, [])

  const handleSignIn = () => {
    localStorage.setItem("papa_veg_welcome_shown", "true")
    navigate("/user/auth/login")
  }

  const handleContinueAsGuest = () => {
    localStorage.setItem("papa_veg_welcome_shown", "true")
    localStorage.removeItem("user_authenticated")
    localStorage.removeItem("currentUser")
    localStorage.removeItem("user_user")
    localStorage.removeItem("userProfile")
    localStorage.removeItem("appzeto_user_profile")
    localStorage.removeItem("user_accessToken")
    localStorage.removeItem("user_refreshToken")
    localStorage.removeItem("tempPhone")
    localStorage.removeItem("user_temp_phone")
    clearLocation()
    navigate("/food/user")
  }

  return (
    <div className="min-h-screen bg-[#080808] flex justify-center">
      <div className="w-full max-w-md min-h-screen bg-[#111111] text-[#e5e2e1] flex flex-col font-sans overflow-x-hidden relative select-none shadow-2xl border-x border-zinc-800/40">
        <style dangerouslySetInnerHTML={{
          __html: `
          .welcome-glass {
            background: rgba(20, 20, 20, 0.75) !important;
            backdrop-filter: blur(25px) !important;
            border-top: 1px solid rgba(255, 255, 255, 0.12) !important;
          }
          .hero-gradient {
            background: linear-gradient(to bottom, rgba(17, 17, 17, 0) 40%, rgba(17, 17, 17, 0.95) 90%, #111111 100%) !important;
          }
          .animate-zoom {
            animation: zoomSlow 25s infinite alternate ease-in-out;
          }
          @keyframes zoomSlow {
            0% { transform: scale(1); }
            100% { transform: scale(1.12); }
          }
          `
        }} />

        {/* Hero Banner Section */}
        <div className="relative w-full h-[55vh] sm:h-[60vh] md:h-[65vh] overflow-hidden">
          {/* Background Zooming Image */}
          <img
            src="https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&auto=format&fit=crop&q=80"
            alt="Premium Papa Veg Pizza"
            className="w-full h-full object-cover animate-zoom"
          />
          {/* Shadow overlays and gradients */}
          <div className="absolute inset-0 hero-gradient" />

          {/* Floating Brand Badge */}
          <div className="absolute top-8 left-0 right-0 flex justify-center z-10">
            <div className="flex items-center gap-2.5 bg-black/45 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/10 shadow-lg">
              <img
                src={logoUrl}
                alt="Papa Veg Pizza Logo"
                className="w-9 h-9 object-contain"
              />
              <span
                className="text-lg font-black tracking-tight text-white uppercase"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Papa Veg Pizza
              </span>
            </div>
          </div>
        </div>

        {/* Welcome Section Bottom Sheet Card */}
        <div className="flex-1 flex flex-col justify-end welcome-glass px-6 pt-6 pb-12 -mt-8 z-20 relative max-w-md mx-auto w-full">
          <div className="text-center space-y-4 mb-10">
            <h1
              className="text-[32px] font-extrabold leading-tight text-white tracking-tight"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Welcome to <br />
              <span className="text-[#E53935]">Papa Veg Pizza 🍕</span>
            </h1>
            <p className="text-sm opacity-70 leading-relaxed font-medium px-4">
              Taste the magic of our signature wood-fired crusts, loaded with organic, farm-fresh ingredients!
            </p>
          </div>

          {/* Buttons Panel */}
          <div className="space-y-4 w-full">
            <button
              onClick={handleSignIn}
              className="w-full h-14 bg-[#E53935] hover:bg-red-700 text-white font-extrabold rounded-2xl text-sm uppercase tracking-wider transition-all shadow-[0_4px_20px_rgba(229,57,53,0.3)] active:scale-[0.98] cursor-pointer border-0 outline-none flex items-center justify-center gap-2"
            >
              Sign In to Unlock Offers
            </button>

            <button
              onClick={handleContinueAsGuest}
              className="w-full h-14 bg-white/5 hover:bg-white/10 text-white font-extrabold rounded-2xl text-sm uppercase tracking-wider transition-all border border-white/12 active:scale-[0.98] cursor-pointer outline-none flex items-center justify-center"
            >
              Continue as Guest
            </button>
          </div>

          {/* Premium footer tagline */}
          <div className="text-center mt-8 opacity-45 text-[10px] font-bold uppercase tracking-widest">
            100% Pure Vegetarian Quality Assured
          </div>
        </div>
      </div>
    </div>
  )
}
