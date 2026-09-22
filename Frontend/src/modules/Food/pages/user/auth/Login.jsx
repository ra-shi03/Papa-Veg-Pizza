import React, { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Phone } from "lucide-react"
import { clearModuleAuth } from "@food/utils/auth"
import heroImg from "@/assets/hero-pizza.png"

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("SignIn")

  useEffect(() => {
    // Clear previous sessions to prevent immediate home redirection
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
      isSignUp: activeTab === "SignUp"
    }))

    setTimeout(() => {
      setIsLoading(false)
      navigate("/user/auth/otp")
    }, 2000)
  }

  return (
    <div className="w-full min-h-[100dvh] bg-[#9C7F6B] flex flex-col font-['Poppins',sans-serif] text-white overflow-hidden">
      
      {/* Top Image Section */}
      <div className="relative w-full h-[45vh] shrink-0 bg-[#e0d6c8] rounded-b-[40px] shadow-[0_10px_30px_rgba(0,0,0,0.15)] overflow-hidden">
        
        {/* Simple Back Button */}
        <button 
          onClick={() => navigate(location.state?.from || "/welcome")}
          className="absolute top-6 left-6 z-20 w-10 h-10 bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center shadow-sm text-black transition-transform active:scale-95 hover:bg-white/60"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </button>

        <img 
          src={heroImg} 
          alt="Login Background" 
          className="w-full h-full object-cover"
        />
      </div>

      {/* Bottom Form Section */}
      <div className="flex-1 px-8 pt-8 pb-10 flex flex-col items-center">
        
        {/* Tabs */}
        <div className="flex justify-center items-center gap-14 w-full mb-10">
          <button 
            onClick={() => setActiveTab("SignIn")}
            className={`text-[20px] font-extrabold pb-2 transition-all ${
              activeTab === "SignIn" 
                ? "text-white border-b-[3px] border-white" 
                : "text-white/60 border-b-[3px] border-transparent hover:text-white/80"
            }`}
          >
            Sign In
          </button>
          <button 
            onClick={() => setActiveTab("SignUp")}
            className={`text-[20px] font-extrabold pb-2 transition-all ${
              activeTab === "SignUp" 
                ? "text-white border-b-[3px] border-white" 
                : "text-white/60 border-b-[3px] border-transparent hover:text-white/80"
            }`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleLogin} className="w-full max-w-sm flex flex-col gap-8 relative">
          
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-[-20px] bg-[#9C7F6B]/90 backdrop-blur-sm z-20 flex flex-col items-center justify-center rounded-2xl gap-3"
              >
                {/* Loader Animation */}
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg border border-white/20 relative overflow-hidden">
                  <div className="absolute left-1.5 top-1/2 -translate-y-1/2 flex flex-col gap-1 z-0">
                    <motion.div animate={{ x: [12, -12], opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 0.45, ease: "linear" }} className="w-3.5 h-0.5 bg-[#4A3831] rounded-full" />
                    <motion.div animate={{ x: [16, -8], opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 0.45, ease: "linear", delay: 0.12 }} className="w-2.5 h-0.5 bg-[#4A3831] rounded-full" />
                    <motion.div animate={{ x: [8, -16], opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 0.45, ease: "linear", delay: 0.24 }} className="w-4 h-0.5 bg-[#4A3831] rounded-full" />
                  </div>
                  <motion.svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-12 h-12 fill-[#4A3831] z-10" animate={{ y: [0, -2.5, 0], x: [-0.5, 1.5, -0.5] }} transition={{ repeat: Infinity, duration: 0.35, ease: "easeInOut" }}>
                    <circle cx="28" cy="72" r="9" stroke="#4A3831" strokeWidth="4.5" fill="none" />
                    <circle cx="72" cy="72" r="9" stroke="#4A3831" strokeWidth="4.5" fill="none" />
                    <path d="M 28 72 L 42 72 L 52 72 L 64 60 L 72 72" stroke="#4A3831" strokeWidth="5.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M 64 60 L 68 35 L 56 35" stroke="#4A3831" strokeWidth="5.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    <rect x="11" y="32" width="22" height="24" rx="2" fill="#4A3831" />
                    <circle cx="48" cy="29" r="7" fill="#4A3831" />
                    <path d="M 46 36 C 46 47, 48 55, 42 65" stroke="#4A3831" strokeWidth="5.5" fill="none" strokeLinecap="round" />
                    <path d="M 46 41 L 64 38" stroke="#4A3831" strokeWidth="4.5" fill="none" strokeLinecap="round" />
                    <path d="M 44 53 L 54 62 L 54 70" stroke="#4A3831" strokeWidth="4.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </motion.svg>
                </div>
                <span className="text-[12px] font-bold text-white uppercase tracking-widest animate-pulse mt-2">
                  Sending OTP...
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Underlined Input Field */}
          <div className="flex flex-col gap-2 relative group">
            <div className="flex items-center gap-3 border-b-2 border-[#684C3A] pb-2 group-focus-within:border-white transition-colors">
              <Phone size={20} className="text-[#4A3831] group-focus-within:text-white transition-colors" />
              <span className="text-[15px] font-bold text-[#4A3831] group-focus-within:text-white transition-colors select-none whitespace-nowrap">
                Phone Number:
              </span>
              <div className="flex items-center flex-1 ml-2">
                <span className="text-[15px] font-bold text-white mr-1">+91</span>
                <input
                  type="tel"
                  maxLength="10"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                  className="flex-1 w-full bg-transparent text-[15px] font-bold outline-none border-none text-white placeholder-white/50"
                  placeholder="9876543210"
                />
              </div>
            </div>
          </div>

          {/* Sign In Button - Neumorphic Pill */}
          <div className="flex justify-center mt-6">
            <button
              type="submit"
              disabled={isLoading}
              className="w-[220px] h-[56px] rounded-full bg-[#4A3831] text-white font-extrabold text-[18px] tracking-[1px] shadow-[0_8px_15px_rgba(0,0,0,0.2),inset_0_-4px_8px_rgba(0,0,0,0.5)] hover:brightness-110 active:scale-95 active:shadow-[0_2px_5px_rgba(0,0,0,0.2),inset_0_-2px_4px_rgba(0,0,0,0.5)] transition-all flex items-center justify-center disabled:opacity-80"
            >
              {activeTab === "SignIn" ? "Sign In" : "Sign Up"}
            </button>
          </div>

          {/* Forgot Password */}
          <div className="text-center mt-[-8px]">
            <button type="button" className="text-[14px] font-medium text-white/80 hover:text-white transition-colors">
              Forgot Password?
            </button>
          </div>
          
          {/* OR Divider */}
          <div className="flex items-center gap-4 my-2 w-[85%] mx-auto">
            <div className="flex-1 h-[2px] bg-[#684C3A] rounded-full"></div>
            <span className="text-[14px] font-semibold text-[#684C3A] pb-[2px]">or</span>
            <div className="flex-1 h-[2px] bg-[#684C3A] rounded-full"></div>
          </div>

          {/* Social Icons */}
          <div className="flex justify-center items-center gap-6">
            <button type="button" className="w-[46px] h-[46px] rounded-full bg-[#4A3831] text-white shadow-md flex items-center justify-center hover:scale-105 active:scale-95 transition-transform">
              <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M22.675 0H1.325C.593 0 0 .593 0 1.325v21.351C0 23.407.593 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.323-.593 1.323-1.325V1.325C24 .593 23.407 0 22.675 0z"/></svg>
            </button>
            <button type="button" className="w-[46px] h-[46px] rounded-full bg-[#4A3831] flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-transform">
              <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
