import React, { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { clearModuleAuth } from "@food/utils/auth"
import { requestUserOtp } from "@/services/api/auth"
import OTP from "./OTP"

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [step, setStep] = useState("phone")

  // Sync theme and clear stale session info so login always forces a fresh login & OTP entry
  useEffect(() => {
    // Clear previous sessions to prevent immediate home redirection when opening the login/OTP page
    clearModuleAuth("user")
    localStorage.removeItem("tempPhone")
    localStorage.removeItem("currentUser")
    localStorage.removeItem("userProfile")
    localStorage.removeItem("appzeto_user_profile")
    localStorage.removeItem("user_temp_phone")
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    if (phoneNumber.trim().length < 10) {
      alert("Please enter a valid 10-digit phone number")
      return
    }
    
    setIsLoading(true)
    const formattedPhone = "+91 " + phoneNumber

    try {
      await requestUserOtp(formattedPhone)
      
      // Store userAuthData in sessionStorage for OTP.jsx to read
      sessionStorage.setItem("userAuthData", JSON.stringify({
        method: "phone",
        phone: formattedPhone,
        isSignUp: false
      }))

      // Give a little time for the pizza animation before transitioning section
      setTimeout(() => {
        setIsLoading(false)
        setStep("otp")
      }, 1500)
    } catch (err) {
      setIsLoading(false)
      alert(err?.response?.data?.message || "Failed to send OTP. Please try again.")
    }
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.15,
        delayChildren: 0.2
      } 
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  }

  return (
    <div className="min-h-[100dvh] pb-20 overflow-x-hidden flex flex-col bg-white text-[var(--primary-gray)] relative">

      {/* Interactive Back Button */}
      <motion.button
        onClick={() => {
          if (step === "otp") {
            setStep("phone")
          } else {
            navigate(location.state?.from || "/welcome")
          }
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="absolute top-6 left-6 z-30 w-11 h-11 flex items-center justify-center bg-white rounded-full shadow-[0_8px_20px_rgba(0,0,0,0.08)] border border-gray-100 text-gray-700 hover:text-[var(--accent-red)] transition-colors cursor-pointer"
        aria-label="Go back"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5 -ml-0.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
      </motion.button>

      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-20">
        {/* Floating Pizza Ingredients */}
        <motion.div animate={{ y: [0, -20, 0], rotate: [0, 15, 0] }} transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }} className="absolute top-[10%] left-[10%] text-5xl opacity-40">🍕</motion.div>
        <motion.div animate={{ y: [0, 25, 0], rotate: [0, -20, 0] }} transition={{ repeat: Infinity, duration: 8, ease: "easeInOut", delay: 1 }} className="absolute top-[25%] right-[15%] text-4xl opacity-30">🍅</motion.div>
        <motion.div animate={{ y: [0, -15, 0], rotate: [0, 30, 0] }} transition={{ repeat: Infinity, duration: 6, ease: "easeInOut", delay: 2 }} className="absolute bottom-[20%] left-[12%] text-4xl opacity-40">🧀</motion.div>
        <motion.div animate={{ y: [0, 30, 0], rotate: [0, -15, 0] }} transition={{ repeat: Infinity, duration: 9, ease: "easeInOut", delay: 0.5 }} className="absolute bottom-[25%] right-[12%] text-5xl opacity-30">🍄</motion.div>
        <motion.div animate={{ y: [0, -25, 0], rotate: [0, 45, 0] }} transition={{ repeat: Infinity, duration: 7.5, ease: "easeInOut", delay: 1.5 }} className="absolute top-[50%] left-[4%] text-3xl opacity-30">🌿</motion.div>
        <motion.div animate={{ y: [0, 20, 0], rotate: [0, -45, 0] }} transition={{ repeat: Infinity, duration: 8.5, ease: "easeInOut", delay: 2.5 }} className="absolute top-[60%] right-[5%] text-4xl opacity-30">🌶️</motion.div>
      </div>

      {/* Login Screen UX Content */}
      <main className="flex-1 flex flex-col justify-start p-6 mt-6 max-w-md mx-auto w-full z-10 relative">
        
        {/* Hero Image Section */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="w-full flex justify-center mb-8 relative"
        >
          
          <motion.img 
            src="https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80" 
            alt="Delicious Pizza" 
            className="w-48 h-48 md:w-56 md:h-56 object-cover rounded-full shadow-2xl border-4 border-white z-10"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
          />
        </motion.div>

        {step === "phone" ? (
          <motion.div 
            variants={containerVariants} 
            initial="hidden" 
            animate="visible"
            exit={{ opacity: 0, y: -20 }}
            className="bg-white p-8 rounded-[2rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-gray-100 relative overflow-hidden"
          >
          {/* Decorative corner accent */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#ef4444] to-transparent opacity-10 rounded-bl-[4rem] pointer-events-none"></div>

          {/* Title */}
          <motion.div variants={itemVariants} className="mb-2">
            <h2 className="text-3xl font-black text-gray-900 text-left tracking-tight leading-tight">
              Log in
            </h2>
          </motion.div>

          {/* Subtitle */}
          <motion.div variants={itemVariants} className="mb-8">
            <p className="text-sm text-left leading-relaxed text-gray-500 font-medium">
              Log in or Sign up to explore exclusive deals and order your favorite pizzas instantly.
            </p>
          </motion.div>

          {/* Login Form */}
          <motion.form variants={itemVariants} onSubmit={handleLogin} className="space-y-6 relative">
            <AnimatePresence>
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                  animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
                  exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                  className="absolute -inset-8 bg-white/80 z-20 flex flex-col items-center justify-center rounded-[2rem] gap-4"
                >
                  <div className="relative">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                      className="w-20 h-20 border-4 border-[var(--accent-red)] border-t-transparent border-dashed rounded-full"
                    />
                    <motion.div 
                      className="absolute inset-0 flex items-center justify-center text-4xl"
                      animate={{ scale: [1, 1.2, 1], rotate: [0, -10, 10, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                    >
                      🍕
                    </motion.div>
                  </div>
                  <motion.span 
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="text-sm font-bold text-[var(--accent-red)] tracking-wide mt-2"
                  >
                    BAKING YOUR OTP...
                  </motion.span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Phone Input Box Container */}
            <motion.div 
              className={`flex items-center border-2 rounded-2xl px-4 py-3 bg-gray-50 transition-all duration-300 ${isFocused ? 'border-[var(--accent-red)] bg-white shadow-[0_0_0_4px_rgba(239,68,68,0.1)]' : 'border-gray-200'}`}
              whileTap={{ scale: 0.98 }}
            >
              {/* Country Flag (India +91) */}
              <div className="flex items-center gap-2 pr-3 border-r border-gray-300 select-none">
                <span className="text-xl" role="img" aria-label="India flag">🇮🇳</span>
                <span className="text-sm font-bold text-gray-700">+91</span>
              </div>

              {/* Input field */}
              <input
                type="tel"
                maxLength="10"
                placeholder="Enter mobile number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className="flex-1 pl-3 bg-transparent text-base font-semibold outline-none border-none text-gray-800 placeholder-gray-400 w-full"
              />
            </motion.div>

            {/* Login Button */}
            <motion.button
              type="submit"
              disabled={isLoading || phoneNumber.length < 10}
              whileTap={{ scale: phoneNumber.length === 10 ? 0.97 : 1 }}
              className="w-full h-14 bg-[var(--accent-red)] text-white font-bold rounded-2xl text-[16px] tracking-wide cursor-pointer transition-all border-0 flex items-center justify-center gap-2 disabled:cursor-not-allowed"
            >
              Get OTP
              <motion.svg 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                strokeWidth={2.5} 
                stroke="currentColor" 
                className="w-5 h-5 ml-1"
                animate={{ x: isFocused && phoneNumber.length === 10 ? [0, 5, 0] : 0 }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </motion.svg>
            </motion.button>
          </motion.form>
        </motion.div>
        ) : (
          <OTP />
        )}
        
        {/* Footer text */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center text-xs text-gray-400 mt-8 font-medium"
        >
          By continuing, you agree to our <br/>
          <a href="#" className="text-gray-600 underline decoration-gray-300 underline-offset-2">Terms of Service</a> & <a href="#" className="text-gray-600 underline decoration-gray-300 underline-offset-2">Privacy Policy</a>
        </motion.p>

      </main>
    </div>
  )
}
