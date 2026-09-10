import { useState, useEffect, useRef } from "react"
import { useNavigate, Link } from "react-router-dom"
import { motion } from "framer-motion"
import { adminAPI } from "@food/api"
import { setAuthData } from "@food/utils/auth"
import { Pizza, ArrowRight, Loader2, Mail, Lock, Eye, EyeOff, ShieldCheck } from "lucide-react"
import { Button } from "@food/components/ui/button"
import { useSystemTheme } from "@/shared/utils/themeSync"
import logoNew from "@/assets/logo1.png"
import { toast } from "sonner"

export default function StoreLogin() {
  const navigate = useNavigate()
  const { logo, themeMode } = useSystemTheme()
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const submitting = useRef(false)

  const isDarkMode = themeMode === "dark"

  useEffect(() => {
    const linkFonts = document.createElement("link")
    linkFonts.href = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Inter:wght@400;600;700&display=swap"
    linkFonts.rel = "stylesheet"
    document.head.appendChild(linkFonts)
    return () => {
      document.head.removeChild(linkFonts)
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
      const response = await adminAPI.storeLogin(identifier.trim(), password)
      const data = response?.data?.data || response?.data || {}

      const accessToken = data.accessToken
      const rawUser = data.user
      const refreshToken = data.refreshToken ?? null

      if (!accessToken || !rawUser) {
        throw new Error("Invalid response from server")
      }
      const role = String(rawUser.role || "").replace(/_/g, "-")
      if (!["store-manager", "kitchen-supervisor", "kitchen-staff"].includes(role)) {
        throw new Error("Access Denied: This login is only for store roles")
      }
      const storeUser = { ...rawUser, role: role.replace(/-/g, "_") }

      // Store Auth Details for the store module
      setAuthData("store", accessToken, storeUser, refreshToken)
      
      // Store the specific role context
      localStorage.setItem("store_role", storeUser.role)
      window.dispatchEvent(new CustomEvent("storeRoleChanged", { detail: storeUser.role }))

      toast.success(`Signed in as ${storeUser.name || 'Store Operations'}`)

      // Role-based routing
      navigate("/store", { replace: true })
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
      className={`min-h-screen flex flex-col relative overflow-hidden transition-colors duration-300 ${isDarkMode ? "dark" : ""}`}
      style={{
        backgroundColor: isDarkMode ? "#111111" : "#fbf9f8",
        color: isDarkMode ? "#e5e2e1" : "#1c1b1b",
        fontFamily: "'Inter', sans-serif"
      }}
    >
      {/* Dynamic CSS Styling Injector */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .glass-card {
          background: ${isDarkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.9)"} !important;
          backdrop-filter: blur(20px) !important;
          border: 1px solid ${isDarkMode ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.06)"} !important;
          box-shadow: ${isDarkMode ? "none" : "0 4px 6px -1px rgba(0, 0, 0, 0.05)"} !important;
        }
        `
      }} />

      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-[var(--primary)]/10 via-[var(--primary)]/5 to-transparent pointer-events-none" />
      <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] bg-[var(--primary)]/5 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-100px] left-[-100px] w-[400px] h-[400px] bg-[var(--primary)]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-[340px]"
        >
          {/* Logo & Header */}
          <div className="text-center mb-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="relative inline-block mb-1.5"
            >
              <img
                src={logo || logoNew}
                alt="Papa Veg Pizza Logo"
                className="w-16 h-16 object-contain mx-auto transition-transform duration-300 hover:scale-105"
              />
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-gray-400 dark:text-gray-500 font-semibold text-[9px] uppercase tracking-[0.2em]"
            >
              STORE OPERATIONS
            </motion.p>
          </div>

          {/* Login Card */}
          <div className="glass-card rounded-xl p-5 sm:p-6 shadow-[0_12px_24px_-10px_rgba(229,57,53,0.1)] dark:shadow-none relative overflow-hidden">
             <form onSubmit={handleLogin} className="space-y-3.5">
              <div className="space-y-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 ml-0.5">Email or Mobile</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      required
                      autoFocus
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="block w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white border border-transparent focus:border-[var(--primary)]/50 rounded-lg outline-none transition-all placeholder:text-gray-400 font-medium text-xs"
                      placeholder="manager@papavegpizza.com or 9876543210"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center px-0.5">
                    <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Password</label>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-9 pr-9 py-2 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white border border-transparent focus:border-[var(--primary)]/50 rounded-lg outline-none transition-all placeholder:text-gray-400 font-medium text-xs"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-655 dark:hover:text-zinc-200 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-[var(--primary)] hover:bg-[var(--sa-primary-hover)] disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:text-gray-400 text-white rounded-lg font-bold text-xs shadow-md shadow-[var(--primary)]/10 transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 group overflow-hidden relative border-0 cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Enter Portal</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Quick Info / Role Map */}
          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200/10 text-[10px] opacity-75">
            <h4 className="font-semibold text-gray-500 dark:text-gray-400 mb-1">Simulated Credentials (Click to fill)</h4>
            <div className="space-y-0.5 text-xs">
              <div 
                className="flex justify-between cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800 p-1 rounded transition-colors"
                onClick={() => { setIdentifier("manager@papavegpizza.com"); setPassword("12345678"); }}
              >
                <span className="text-gray-400">Manager:</span> <code className="text-gray-600 dark:text-gray-300 font-semibold">manager@papavegpizza.com</code>
              </div>
              <div 
                className="flex justify-between cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800 p-1 rounded transition-colors"
                onClick={() => { setIdentifier("supervisor@papavegpizza.com"); setPassword("12345678"); }}
              >
                <span className="text-gray-400">Supervisor:</span> <code className="text-gray-600 dark:text-gray-300 font-semibold">supervisor@papavegpizza.com</code>
              </div>
              <div 
                className="flex justify-between cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800 p-1 rounded transition-colors"
                onClick={() => { setIdentifier("staff@papavegpizza.com"); setPassword("12345678"); }}
              >
                <span className="text-gray-400">Staff:</span> <code className="text-gray-600 dark:text-gray-300 font-semibold">staff@papavegpizza.com</code>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-col items-center gap-2 text-[10px] text-gray-400 dark:text-gray-500 font-medium">
            <div className="flex items-center gap-1 opacity-50">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Secure Operations Portal</span>
            </div>
            <Link to="/user/auth/support" className="hover:text-[var(--primary)] hover:underline transition-colors opacity-70">
              Need Support? Contact Support
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
