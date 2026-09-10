import { useState, useEffect, useRef } from "react"
import { useNavigate, Link } from "react-router-dom"
import { motion } from "framer-motion"
import { adminAPI } from "@food/api"
import { setAuthData } from "@food/utils/auth"
import { ShieldCheck, ArrowRight, Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react"
import { useSystemTheme } from "@/shared/utils/themeSync"
import logoNew from "@/assets/logo1.png"
import pizzaImage from "@/assets/login-pizza.jpg"
import { toast } from "sonner"

export default function SuperAdminLogin() {
  const navigate = useNavigate()
  const { logo, themeMode, primaryColor } = useSystemTheme()
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [focusedField, setFocusedField] = useState(null)
  const submitting = useRef(false)

  const isDarkMode = themeMode === "dark"
  // Default to red if not explicitly provided
  const brandColor = primaryColor || "#dc2626"
  const hoverColor = `${brandColor}e6`

  useEffect(() => {
    const linkFonts = document.createElement("link")
    linkFonts.href = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap"
    linkFonts.rel = "stylesheet"
    document.head.appendChild(linkFonts)
    return () => {
      if (document.head.contains(linkFonts)) {
        document.head.removeChild(linkFonts)
      }
    }
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!identifier || !password) {
      toast.error("Please fill in all fields")
      return
    }
    if (submitting.current) return
    submitting.current = true
    setLoading(true)

    try {
      const response = await adminAPI.superAdminLogin(identifier.trim(), password)
      const data = response?.data?.data || response?.data || {}

      const accessToken = data.accessToken
      let adminUser = data.user || data.admin
      const refreshToken = data.refreshToken ?? null

      if (!accessToken || !adminUser) {
        throw new Error("Invalid response from server")
      }

      setAuthData("admin", accessToken, adminUser, refreshToken)

      try {
        const meResponse = await adminAPI.getAdminProfile()
        const fullProfile = meResponse?.data?.admin || meResponse?.data?.data?.admin
        if (fullProfile) {
          adminUser = fullProfile
          setAuthData("admin", accessToken, adminUser, refreshToken)
        }
      } catch (meError) {
        console.warn("Failed to fetch full profile via /me, falling back to login payload", meError)
      }

      if (String(adminUser.role || "").replace(/_/g, "-") !== "superadmin") {
        throw new Error("Access Denied: You do not have Super Admin privileges")
      }

      toast.success("Welcome, Super Administrator")
      navigate("/superadmin/dashboard", { replace: true })
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Login failed. Check your credentials."
      toast.error(msg)
    } finally {
      setLoading(false)
      submitting.current = false
    }
  }

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300 ${isDarkMode ? "dark" : ""}`}
      style={{
        backgroundColor: isDarkMode ? "#7f1d1d" : "#ef4444", // Using red color instead of yellow for bg
        fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif"
      }}
    >
      <style dangerouslySetInnerHTML={{
        __html: `
        .login-card-container {
           box-shadow: 0 30px 60px -15px rgba(0, 0, 0, 0.6), 0 20px 30px -10px rgba(0, 0, 0, 0.4);
        }
        .form-side {
           box-shadow: -20px 0 40px -15px rgba(0, 0, 0, 0.4), 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
        .input-3d {
          background: ${isDarkMode ? "#12141a" : "#ffffff"} !important;
          border: 1.5px solid ${isDarkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)"} !important;
          box-shadow: ${isDarkMode ? "inset 0 2px 4px rgba(0, 0, 0, 0.5)" : "inset 0 2px 4px rgba(0, 0, 0, 0.03)"} !important;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .input-3d:focus {
          border-color: ${brandColor} !important;
          box-shadow: 0 0 0 4px ${brandColor}22, ${isDarkMode ? "inset 0 2px 4px rgba(0, 0, 0, 0.5)" : "inset 0 2px 4px rgba(0, 0, 0, 0.02)"} !important;
          background: ${isDarkMode ? "#151821" : "#ffffff"} !important;
        }
        .brand-text {
          color: ${brandColor} !important;
        }
        .brand-3d-btn {
          background: ${brandColor} !important;
          box-shadow: 0 4px 14px 0 ${brandColor}66 !important;
          transition: all 0.2s ease !important;
        }
        .brand-3d-btn:hover:not(:disabled) {
          transform: translateY(-2px) !important;
          box-shadow: 0 6px 20px 0 ${brandColor}88 !important;
        }
        .brand-3d-btn:active:not(:disabled) {
          transform: translateY(0px) !important;
        }
        `
      }} />

      {/* Decorative gradient for the red background */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-red-800 opacity-90" />
      
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-center w-full max-w-5xl">
         
         {/* Left Side: Image Box */}
         <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="w-full md:w-1/2 h-[350px] md:h-[550px] rounded-2xl overflow-hidden relative z-10 flex-shrink-0 login-card-container"
         >
            <img 
               src={pizzaImage} 
               alt="Pizza Background" 
               className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-8 text-white">
               <h2 className="text-3xl md:text-4xl font-extrabold mb-2 leading-tight">Need some<br/>Pizza, yo?</h2>
               <p className="text-sm md:text-base text-gray-200 opacity-90 max-w-xs font-medium">C'mon and order from nearby Pizza delivery and pickup restaurants</p>
               {/* Decorative dots like the image */}
               <div className="flex gap-1.5 mt-4">
                  <div className="w-2 h-2 rounded-full bg-white opacity-100"></div>
                  <div className="w-2 h-2 rounded-full bg-white opacity-50"></div>
                  <div className="w-2 h-2 rounded-full bg-white opacity-50"></div>
               </div>
            </div>
         </motion.div>

         {/* Right Side: Form Box */}
         <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="w-full md:w-1/2 max-w-[420px] md:max-w-none md:-ml-8 -mt-10 md:mt-0 bg-white dark:bg-[#181a20] rounded-2xl p-8 sm:p-10 shadow-2xl z-20 form-side flex flex-col justify-center min-h-[450px]"
         >
            {/* Form Content */}
            <div className="flex justify-between items-start mb-8">
               <div className="flex flex-col">
                  <span className="text-gray-400 dark:text-gray-500 font-semibold text-sm mb-1 uppercase tracking-widest">
                    Super Admin
                  </span>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Welcome Back
                  </h3>
               </div>
               <img src={logo || logoNew} alt="Logo" className="w-16 h-16 object-contain" />
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Email or Mobile
                </label>
                <div className="relative">
                  <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 pointer-events-none ${focusedField === 'identifier' ? 'brand-text' : 'text-gray-400'}`}>
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={identifier}
                    onFocus={() => setFocusedField('identifier')}
                    onBlur={() => setFocusedField(null)}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="input-3d block w-full pl-11 pr-4 py-3.5 text-gray-900 dark:text-white rounded-xl outline-none placeholder:text-gray-400 font-medium text-sm"
                    placeholder="admin@papavegpizza.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Password
                </label>
                <div className="relative">
                  <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 pointer-events-none ${focusedField === 'password' ? 'brand-text' : 'text-gray-400'}`}>
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-3d block w-full pl-11 pr-11 py-3.5 text-gray-900 dark:text-white rounded-xl outline-none placeholder:text-gray-400 font-medium text-sm"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1.5 rounded-md focus:outline-none transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 brand-3d-btn disabled:opacity-50 text-white rounded-xl font-bold text-sm tracking-wide flex items-center justify-center gap-2 group relative cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                  ) : (
                    <>
                      <span>Sign In</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-8 flex flex-col items-center text-xs font-medium">
              <Link 
                to="/user/auth/support" 
                className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                Need Support? Contact Support
              </Link>
            </div>
         </motion.div>
      </div>
    </div>
  )
}
