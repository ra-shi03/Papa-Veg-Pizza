import React, { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import Header from "@food/components/user/Header"
import { clearModuleAuth } from "@food/utils/auth"

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  // Sync theme and clear stale session info so login always forces a fresh login & OTP entry
  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark") || localStorage.getItem("appTheme") === "dark"
    setIsDarkMode(isDark)
    
    // Clear previous sessions to prevent immediate home redirection when opening the login/OTP page
    clearModuleAuth("user")
    localStorage.removeItem("tempPhone")
    localStorage.removeItem("currentUser")
    localStorage.removeItem("userProfile")
    localStorage.removeItem("appzeto_user_profile")
    localStorage.removeItem("user_temp_phone")
  }, [])

  const handleLogin = (e) => {
    e.preventDefault()
    if (phoneNumber.trim().length < 10) {
      alert("Please enter a valid 10-digit phone number")
      return
    }
    
    setIsLoading(true)
    
    // Store userAuthData in sessionStorage for OTP.jsx to read
    const formattedPhone = "+91 " + phoneNumber
    sessionStorage.setItem("userAuthData", JSON.stringify({
      method: "phone",
      phone: formattedPhone,
      isSignUp: false
    }))

    setTimeout(() => {
      setIsLoading(false)
      navigate("/user/auth/otp")
    }, 2000)
  }

  return (
    <div
      className={`font-body-md text-body-md min-h-screen pb-20 overflow-x-hidden flex flex-col transition-colors duration-300 ${isDarkMode ? "dark" : ""}`}
      style={{ backgroundColor: isDarkMode ? "#111111" : "#fbf9f8", color: isDarkMode ? "#e5e2e1" : "#1c1b1b" }}
    >
      {/* Dynamic CSS Injector */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .font-headline-lg-mobile {
          font-family: 'Plus Jakarta Sans', sans-serif !important;
        }
        .font-body-md {
          font-family: 'Inter', sans-serif !important;
        }
        .text-primary {
          color: #E53935 !important;
        }
        .bg-primary {
          background-color: #E53935 !important;
        }
        .bg-surface\\/80 {
          background-color: ${isDarkMode ? "rgba(19, 19, 19, 0.8)" : "rgba(255, 255, 255, 0.8)"} !important;
        }
        .bg-surface {
          background-color: ${isDarkMode ? "#131313" : "#ffffff"} !important;
        }
        .glass-card {
          background: ${isDarkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.9)"} !important;
          backdrop-filter: blur(20px) !important;
          border: 1px solid ${isDarkMode ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.06)"} !important;
        }
      ` }} />

      {/* Header */}
      <Header
        showBack={true}
        onBack={() => navigate(location.state?.from || "/welcome")}
        showThemeToggle={false}
        showCart={false}
      />

      {/* Login Screen UX Content */}
      <main className="flex-1 flex flex-col justify-start p-6 mt-14 max-w-sm mx-auto w-full space-y-4">

        {/* Title */}
        <h2 className="font-headline-lg-mobile text-2xl font-black text-black dark:text-white text-left tracking-tight">
          Login
        </h2>

        {/* Subtitle */}
        <p className="text-xs text-left leading-relaxed text-black dark:text-slate-200">
          To complete your order, see prices and exclusive deals, you'll need to Log in or Sign up here
        </p>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4 relative overflow-hidden rounded-2xl p-0.5">
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-white/90 dark:bg-[#111111]/92 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center rounded-xl gap-3.5"
              >
                {/* White Circle with Animated Scooter Rider SVG */}
                <div className="w-20 h-20 bg-white dark:bg-[#1e1e1e] rounded-full flex items-center justify-center shadow-lg border border-slate-100 dark:border-slate-800 relative overflow-hidden">
                  
                  {/* Speed/dust lines behind scooter */}
                  <div className="absolute left-1.5 top-1/2 -translate-y-1/2 flex flex-col gap-1 z-0">
                    <motion.div 
                      animate={{ x: [12, -12], opacity: [0, 1, 0] }}
                      transition={{ repeat: Infinity, duration: 0.45, ease: "linear" }}
                      className="w-3.5 h-0.5 bg-[#E53935] rounded-full"
                    />
                    <motion.div 
                      animate={{ x: [16, -8], opacity: [0, 1, 0] }}
                      transition={{ repeat: Infinity, duration: 0.45, ease: "linear", delay: 0.12 }}
                      className="w-2.5 h-0.5 bg-[#E53935] rounded-full"
                    />
                    <motion.div 
                      animate={{ x: [8, -16], opacity: [0, 1, 0] }}
                      transition={{ repeat: Infinity, duration: 0.45, ease: "linear", delay: 0.24 }}
                      className="w-4 h-0.5 bg-[#E53935] rounded-full"
                    />
                  </div>

                  {/* Scooter Rider SVG */}
                  <motion.svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 100 100"
                    className="w-12 h-12 fill-[#E53935] z-10"
                    animate={{ 
                      y: [0, -2.5, 0],
                      x: [-0.5, 1.5, -0.5] 
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 0.35, 
                      ease: "easeInOut" 
                    }}
                  >
                    {/* Scooter wheels */}
                    <circle cx="28" cy="72" r="9" stroke="#E53935" strokeWidth="4.5" fill="none" />
                    <circle cx="72" cy="72" r="9" stroke="#E53935" strokeWidth="4.5" fill="none" />
                    
                    {/* Scooter frame & deck */}
                    <path d="M 28 72 L 42 72 L 52 72 L 64 60 L 72 72" stroke="#E53935" strokeWidth="5.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    
                    {/* Scooter front handle/shield */}
                    <path d="M 64 60 L 68 35 L 56 35" stroke="#E53935" strokeWidth="5.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    
                    {/* Delivery box on the back */}
                    <rect x="11" y="32" width="22" height="24" rx="2" fill="#E53935" />
                    
                    {/* Rider Head */}
                    <circle cx="48" cy="29" r="7" fill="#E53935" />
                    {/* Rider Torso & limbs */}
                    <path d="M 46 36 C 46 47, 48 55, 42 65" stroke="#E53935" strokeWidth="5.5" fill="none" strokeLinecap="round" />
                    {/* Rider Arm reaching for handle */}
                    <path d="M 46 41 L 64 38" stroke="#E53935" strokeWidth="4.5" fill="none" strokeLinecap="round" />
                    {/* Rider Leg */}
                    <path d="M 44 53 L 54 62 L 54 70" stroke="#E53935" strokeWidth="4.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </motion.svg>
                </div>
                <span className="text-[10px] font-black text-black dark:text-white uppercase tracking-widest animate-pulse">
                  Sending OTP Code...
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Phone Input Box Container */}
          <div className="flex items-center border border-slate-300 dark:border-white/10 rounded-xl px-3.5 py-2.5 bg-white dark:bg-white/5 transition-all focus-within:border-primary">
            {/* Country Flag (India +91) */}
            <div className="flex items-center gap-1.5 pr-2.5 border-r border-slate-300 dark:border-white/10 select-none">
              {/* SVG representation of Indian Flag */}
              <svg className="w-5 h-3.5 rounded-sm object-cover" viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
                <rect width="640" height="160" fill="#f4c430" />
                <rect y="160" width="640" height="160" fill="#fff" />
                <rect y="320" width="640" height="160" fill="#090" />
                <circle cx="320" cy="240" r="40" fill="#008" />
              </svg>
              <span className="text-xs font-bold text-black dark:text-white">+91</span>
            </div>

            {/* Input field */}
            <input
              type="tel"
              maxLength="10"
              placeholder="Enter mobile number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
              className="flex-1 pl-2.5 bg-transparent text-xs font-semibold outline-none border-none text-black dark:text-white placeholder-slate-500 dark:placeholder-white/40"
            />
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-10 bg-[#E53935] hover:bg-red-700 text-white font-bold rounded-xl text-xs tracking-wider uppercase cursor-pointer active:scale-95 transition-all shadow-[0_0_15px_rgba(229,57,53,0.3)] border-0 flex items-center justify-center gap-2 disabled:opacity-85"
          >
            {isLoading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="w-4.5 h-4.5 border-2 border-white border-t-transparent rounded-full"
                />
                Sending...
              </>
            ) : (
              "Login with OTP"
            )}
          </button>
        </form>
      </main>
    </div>
  )
}
