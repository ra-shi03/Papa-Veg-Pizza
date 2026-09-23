import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react"
import AnimatedPage from "@food/components/user/AnimatedPage"
import { Input } from "@food/components/ui/input"
import { Button } from "@food/components/ui/button"
import { authAPI, userAPI } from "@food/api"
import { setAuthData as setUserAuthData } from "@food/utils/auth"
import { motion } from "framer-motion"

export default function OTP() {
  const navigate = useNavigate()
  const [otp, setOtp] = useState(["1", "2", "3", "4"]) // By default OTP is 1234
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  const [authData, setAuthData] = useState(null)
  const [showNameInput, setShowNameInput] = useState(false)
  const [name, setName] = useState("")
  const [nameError, setNameError] = useState("")
  const [verifiedOtp, setVerifiedOtp] = useState("")
  const [contactInfo, setContactInfo] = useState("")
  const [contactType, setContactType] = useState("phone")
  const [deviceToken, setDeviceToken] = useState(null)
  const [activePlatform, setActivePlatform] = useState("web")
  const inputRefs = useRef([])
  const submittingRef = useRef(false)

  useEffect(() => {
    // Redirect to home if already authenticated
    const isAuthenticated = localStorage.getItem("user_authenticated") === "true"
    if (isAuthenticated) {
      navigate("/food/user", { replace: true })
      return
    }

    // Get auth data from sessionStorage
    const stored = sessionStorage.getItem("userAuthData")
    if (!stored) {
      navigate("/user/auth/login", { replace: true })
      return
    }
    const data = JSON.parse(stored)
    setAuthData(data)

    // Handle phone number formatting
    if (data.method === "email" && data.email) {
      setContactType("email")
      setContactInfo(data.email)
    } else if (data.phone) {
      setContactType("phone")
      const phoneMatch = data.phone?.match(/(\+\d+)\s*(.+)/)
      if (phoneMatch) {
        const formattedPhone = `${phoneMatch[1]} ${phoneMatch[2].replace(/\D/g, "")}`
        setContactInfo(formattedPhone)
      } else {
        setContactInfo(data.phone || "")
      }
    }

    // Start resend timer (60 seconds)
    setResendTimer(60)
    const timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [navigate])

  useEffect(() => {
    if (inputRefs.current[0] && !showNameInput) {
      inputRefs.current[0].focus()
    }
  }, [showNameInput])

  const handleChange = (index, value) => {
    if (value && !/^\d$/.test(value)) {
      return
    }

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    setError("")

    // Auto-focus next input (4 boxes)
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all 4 digits are entered
    if (!showNameInput && newOtp.slice(0, 4).every((digit) => digit !== "")) {
      handleVerify(newOtp.slice(0, 4).join(""))
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (otp[index]) {
        const newOtp = [...otp]
        newOtp[index] = ""
        setOtp(newOtp)
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus()
        const newOtp = [...otp]
        newOtp[index - 1] = ""
        setOtp(newOtp)
      }
    }
    if (e.key === "v" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      navigator.clipboard.readText().then((text) => {
        const digits = text.replace(/\D/g, "").slice(0, 4).split("")
        const newOtp = [...otp]
        digits.forEach((digit, i) => {
          if (i < 4) newOtp[i] = digit
        })
        setOtp(newOtp)
        if (!showNameInput && digits.length === 4) {
          handleVerify(newOtp.slice(0, 4).join(""))
        } else {
          inputRefs.current[Math.min(digits.length, 3)]?.focus()
        }
      })
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text")
    const digits = pastedData.replace(/\D/g, "").slice(0, 4).split("")
    const newOtp = [...otp]
    digits.forEach((digit, i) => {
      if (i < 4) newOtp[i] = digit
    })
    setOtp(newOtp)
    if (!showNameInput && digits.length === 4) {
      handleVerify(newOtp.slice(0, 4).join(""))
    } else {
      inputRefs.current[Math.min(digits.length, 3)]?.focus()
    }
  }

  const handleVerify = async (otpValue = null) => {
    if (showNameInput) return
    if (submittingRef.current) return

    const code = (otpValue || otp.join("")).replace(/\D/g, "")
    const code4 = code.slice(0, 4)
    if (code4.length !== 4) {
      setError("OTP must be exactly 4 digits")
      return
    }

    submittingRef.current = true
    setIsLoading(true)
    setError("")

    try {
      const storedAuth = sessionStorage.getItem("userAuthData")
      const authDataParsed = storedAuth ? JSON.parse(storedAuth) : null
      const mobileNumber = authDataParsed?.phone || contactInfo

      const response = await authAPI.verifyOTP(mobileNumber, code4)
      const data = response?.data?.data || response?.data || {}
      const user = data.user || data
      const token = data.accessToken || data.token
      const refreshToken = data.refreshToken || "dummy_refresh_token"

      if (user && token) {
        // Save current user session
        setUserAuthData("user", token, user, refreshToken)
        sessionStorage.removeItem("userAuthData")
        window.dispatchEvent(new Event("userAuthChanged"))

        setSuccess(true)
        
        // Navigate based on whether the profile is complete (e.g. has a name)
        if (user.name && user.name.trim() !== "") {
          navigate("/food/user")
        } else {
          navigate("/user/profile/create", { state: { phone: mobileNumber } })
        }
      } else {
        throw new Error("Invalid response from server")
      }
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to verify OTP. Please try again.")
    } finally {
      setIsLoading(false)
      submittingRef.current = false
    }
  }

  const handleSubmitName = async () => {
    const trimmedName = name.trim()
    if (!trimmedName) {
      setNameError("Name is required")
      return
    }

    if (trimmedName.length < 2) {
      setNameError("Name must be at least 2 characters")
      return
    }

    if (!verifiedOtp) {
      setError("OTP verification step missing. Please request a new OTP.")
      return
    }

    setIsLoading(true)
    setError("")
    setNameError("")

    try {
      const response = await userAPI.updateProfile({ name: trimmedName })
      const data = response?.data?.data || response?.data || {}
      const user = data.user || data

      const accessToken = localStorage.getItem("user_accessToken")
      const refreshToken = localStorage.getItem("user_refreshToken")

      if (!accessToken) {
        throw new Error("Authentication data is missing")
      }

      setUserAuthData("user", accessToken, user, refreshToken)
      sessionStorage.removeItem("userAuthData")
      window.dispatchEvent(new Event("userAuthChanged"))

      setSuccess(true)
      setTimeout(() => {
        navigate("/food/user")
      }, 500)
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to complete registration. Please try again."
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendTimer > 0 || isLoading) return

    setIsLoading(true)
    setError("")

    try {
      const phone = authData?.method === "phone" ? authData.phone : null
      const email = authData?.method === "email" ? authData.email : null
      const purpose = authData?.isSignUp ? "register" : "login"

      await authAPI.sendOTP(phone, purpose, email)
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to resend OTP. Please try again."
      setError(message)
    } finally {
      setIsLoading(false)
    }

    setResendTimer(60)
    setOtp(["", "", "", "", "", ""])
    setShowNameInput(false)
    setName("")
    setNameError("")
    setVerifiedOtp("")
    inputRefs.current[0]?.focus()
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
  }

  if (!authData) {
    return null
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="bg-white p-8 rounded-[2rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-gray-100 relative overflow-hidden"
    >
          {/* Decorative corner accent */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#ef4444] to-transparent opacity-10 rounded-bl-[4rem] pointer-events-none"></div>

          {/* Title */}
          <div className="mb-2">
            <h2 className="text-3xl font-black text-gray-900 text-left tracking-tight leading-tight">
              {showNameInput ? "Almost there!" : "Verify OTP"}
            </h2>
          </div>

          <div className="mb-8">
            {!showNameInput && (
              <p className="text-sm text-left leading-relaxed text-gray-500 font-medium">
                We sent a 6-digit code to <br/>
                <strong className="text-gray-900 font-bold">{contactInfo}</strong>
              </p>
            )}
            
            {showNameInput && (
              <p className="text-sm text-left leading-relaxed text-gray-500 font-medium">
                We're excited to have you join us! Please tell us your full name to get started.
              </p>
            )}
          </div>

        {/* OTP Input Fields */}
        {!showNameInput && (
          <div className="space-y-6">
            <div className="flex justify-between gap-2 w-full">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  disabled={isLoading}
                  aria-label={`OTP digit ${index + 1} of 4`}
                  className="w-10 h-12 sm:w-12 sm:h-14 flex-shrink min-w-0 text-center text-lg sm:text-xl font-black border border-gray-200 rounded-xl focus:border-[var(--accent-red)] focus:ring-1 focus:ring-[var(--accent-red)] bg-transparent text-gray-900 transition-all outline-none"
                />
              ))}
            </div>

            {error && (
              <div className="flex items-center justify-center gap-1.5 text-xs text-[var(--accent-red)] bg-red-50 py-2 rounded-lg mt-4">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Verify Button */}
            <motion.button
              type="button"
              onClick={() => handleVerify()}
              disabled={isLoading || otp.some(digit => digit === "")}
              whileTap={{ scale: otp.every(digit => digit !== "") ? 0.97 : 1 }}
              className="w-full h-14 bg-[var(--accent-red)] text-white font-bold rounded-2xl text-[16px] tracking-wide cursor-pointer transition-all border-0 flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-80"
            >
              Verify OTP
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 ml-1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </motion.button>

            {/* Resend Section */}
            <div className="text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Didn't receive the code?{" "}
                {resendTimer > 0 ? (
                  <>
                    Resend in <strong className="font-extrabold text-black dark:text-white">{formatTime(resendTimer)}</strong>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isLoading}
                    className="text-red-600 hover:text-red-700 font-extrabold transition-colors disabled:opacity-50 cursor-pointer bg-transparent border-none p-0 outline-none"
                  >
                    Resend SMS
                  </button>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Name Input */}
        {showNameInput && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (nameError) setNameError("")
                }}
                disabled={isLoading}
                placeholder="Full Name"
                className={`h-11 text-sm bg-white dark:bg-[#1a1a1a] text-black dark:text-white border-slate-300 dark:border-slate-700 rounded-xl focus-visible:ring-1 focus-visible:ring-red-500 focus-visible:border-red-500 ${nameError ? "border-red-500" : ""} transition-all`}
              />
              {nameError && (
                <p className="text-xs text-red-500 pl-1">
                  {nameError}
                </p>
              )}
            </div>

            <Button
              onClick={handleSubmitName}
              disabled={isLoading}
              className="w-full h-10 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all hover:shadow-lg active:scale-[0.98]"
            >
              {isLoading ? "Saving..." : "Finish Registration"}
            </Button>
          </div>
        )}

        {/* Verification Loading Spinner */}
        {isLoading && !showNameInput && (
          <div className="flex justify-center pt-2 mt-4">
            <Loader2 className="h-6 w-6 text-[var(--accent-red)] animate-spin" />
          </div>
        )}
    </motion.div>
  )
}
