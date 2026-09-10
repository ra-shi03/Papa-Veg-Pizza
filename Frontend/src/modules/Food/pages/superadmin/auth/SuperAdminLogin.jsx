import { useState, useEffect, useRef } from "react"
import { useNavigate, Link } from "react-router-dom"
import { motion } from "framer-motion"
import { adminAPI } from "@food/api"
import { setAuthData } from "@food/utils/auth"
import { ShieldCheck, ArrowRight, Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react"
import { useSystemTheme } from "@/shared/utils/themeSync"
import logoNew from "@/assets/logo1.png"
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
  const brandColor = primaryColor || "#a43c12"
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

      // Temporarily set tokens so the /me API can use the access token
      setAuthData("admin", accessToken, adminUser, refreshToken)

      try {
        // Fetch complete, canonical user profile from /me endpoint
        const meResponse = await adminAPI.getAdminProfile()
        const fullProfile = meResponse?.data?.admin || meResponse?.data?.data?.admin
        if (fullProfile) {
          adminUser = fullProfile
          // Update local storage with the comprehensive profile
          setAuthData("admin", accessToken, adminUser, refreshToken)
        }
      } catch (meError) {
        console.warn("Failed to fetch full profile via /me, falling back to login payload", meError)
      }

      // Strict Super Admin RBAC Check
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
      className={`min-h-screen flex flex-col justify-center items-center relative overflow-hidden transition-colors duration-300 ${isDarkMode ? "dark" : ""}`}
      style={{
        backgroundColor: isDarkMode ? "#0c0d10" : "#f5f3f1",
        color: isDarkMode ? "#f1f0f0" : "#1e1d1d",
        fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif"
      }}
    >
      {/* Lightweight High-Performance 3D CSS Styling */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .console-3d-card {
          background: ${isDarkMode 
            ? "linear-gradient(145deg, rgba(26, 28, 35, 0.95) 0%, rgba(18, 19, 24, 0.98) 100%)" 
            : "linear-gradient(145deg, rgba(255, 255, 255, 0.98) 0%, rgba(250, 248, 247, 0.96) 100%)"} !important;
          backdrop-filter: blur(16px) !important;
          border: 1px solid ${isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.8)"} !important;
          box-shadow: ${isDarkMode 
            ? "0 25px 60px -15px rgba(0, 0, 0, 0.85), 0 0 45px -15px rgba(164, 60, 18, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.12)" 
            : "0 25px 65px -15px rgba(164, 60, 18, 0.14), 0 12px 25px -8px rgba(0, 0, 0, 0.06), inset 0 1px 2px rgba(255, 255, 255, 0.95)"} !important;
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
          background: linear-gradient(135deg, ${brandColor} 0%, ${hoverColor} 100%) !important;
          box-shadow: 0 10px 25px -4px ${brandColor}55, 0 4px 10px -2px rgba(0, 0, 0, 0.15), inset 0 1px 1px rgba(255, 255, 255, 0.35) !important;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .brand-3d-btn:hover:not(:disabled) {
          transform: translateY(-2px) !important;
          box-shadow: 0 14px 30px -4px ${brandColor}77, 0 6px 15px -2px rgba(0, 0, 0, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.45) !important;
        }
        .brand-3d-btn:active:not(:disabled) {
          transform: translateY(1px) !important;
          box-shadow: 0 5px 15px -4px ${brandColor}66, inset 0 2px 4px rgba(0, 0, 0, 0.2) !important;
        }
        .logo-medallion {
          box-shadow: ${isDarkMode 
            ? "0 12px 28px -6px rgba(0,0,0,0.7), 0 0 25px -5px rgba(164, 60, 18, 0.3), inset 0 1px 1px rgba(255,255,255,0.15)" 
            : "0 14px 32px -8px rgba(164, 60, 18, 0.22), 0 6px 16px -4px rgba(0,0,0,0.06), inset 0 2px 3px rgba(255,255,255,0.9)"} !important;
        }
        .grid-bg {
          background-size: 32px 32px;
          background-image: ${isDarkMode 
            ? "radial-gradient(circle, rgba(255, 255, 255, 0.04) 1px, transparent 1px)" 
            : "radial-gradient(circle, rgba(164, 60, 18, 0.08) 1px, transparent 1px)"};
        }
        `
      }} />

      {/* Lightweight Background Elements */}
      <div className="absolute inset-0 grid-bg pointer-events-none opacity-80" />
      <div 
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full blur-[140px] pointer-events-none opacity-40 transition-opacity duration-500"
        style={{ background: `radial-gradient(circle, ${brandColor} 0%, transparent 70%)` }}
      />

      <div className="w-full max-w-[420px] px-4 py-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex flex-col items-center"
        >
          {/* Logo & Header (Strictly original text/elements with 3D Medallion style) */}
          <div className="text-center mb-6 w-full">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="relative inline-block mb-3"
            >
              <div 
                className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto p-2.5 logo-medallion relative z-10 transition-transform duration-300 hover:scale-105"
                style={{
                  background: isDarkMode 
                    ? "linear-gradient(135deg, #1f2129 0%, #111318 100%)" 
                    : "linear-gradient(135deg, #ffffff 0%, #fff7f4 100%)",
                  border: `1.5px solid ${isDarkMode ? "rgba(255,255,255,0.12)" : "rgba(164, 60, 18, 0.15)"}`
                }}
              >
                <img
                  src={logo || logoNew}
                  alt="Papa Veg Pizza Logo"
                  className="w-full h-full object-contain filter drop-shadow-sm"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="flex items-center justify-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4 brand-text" />
              <span className="text-gray-700 dark:text-gray-300 font-extrabold text-[11px] uppercase tracking-[0.2em]">
                SUPER ADMIN PANEL
              </span>
            </motion.div>
          </div>

          {/* 3D Elevated Login Card */}
          <div className="console-3d-card rounded-2xl p-6 sm:p-7 w-full relative overflow-hidden transition-all duration-300">
            {/* Top Accent Line */}
            <div 
              className="absolute top-0 left-0 right-0 h-[3px] opacity-90"
              style={{
                background: `linear-gradient(90deg, transparent 0%, ${brandColor} 50%, transparent 100%)`
              }}
            />

            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email or Mobile */}
              <div className="space-y-1.5">
                <label className="block text-[12px] font-extrabold uppercase tracking-wider text-gray-800 dark:text-gray-200 ml-0.5">
                  Email or Mobile
                </label>
                <div className="relative">
                  <div className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 pointer-events-none ${focusedField === 'identifier' ? 'brand-text' : 'text-gray-400 dark:text-gray-500'}`}>
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
                    className="input-3d block w-full pl-10 pr-4 py-2.5 text-gray-900 dark:text-white rounded-xl outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 font-medium text-xs sm:text-sm"
                    placeholder="superadmin@papavegpizza.com or 9876543210"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-0.5">
                  <label className="block text-[12px] font-extrabold uppercase tracking-wider text-gray-800 dark:text-gray-200">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <div className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 pointer-events-none ${focusedField === 'password' ? 'brand-text' : 'text-gray-400 dark:text-gray-500'}`}>
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-3d block w-full pl-10 pr-10 py-2.5 text-gray-900 dark:text-white rounded-xl outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 font-medium text-xs sm:text-sm"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-md focus:outline-none transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 brand-3d-btn disabled:opacity-50 disabled:pointer-events-none text-white rounded-xl font-bold text-xs sm:text-sm tracking-wide flex items-center justify-center gap-2 group relative cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <>
                      <span>Enter Control Console</span>
                      <ArrowRight className="w-4 h-4 opacity-85 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Footer (Strictly original links/text, but made clearly visible and high-contrast) */}
          <div className="mt-6 flex flex-col items-center gap-2.5 text-xs font-semibold text-gray-700 dark:text-gray-300">
            <div className="flex items-center gap-1.5 text-gray-800 dark:text-gray-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Restricted access area</span>
            </div>
            <Link 
              to="/user/auth/support" 
              className="text-gray-700 dark:text-gray-300 hover:text-[var(--primary)] dark:hover:text-white transition-colors underline underline-offset-4 font-bold"
            >
              Need Support? Contact Support
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

