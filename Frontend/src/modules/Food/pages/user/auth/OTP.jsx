import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react"
import AnimatedPage from "@food/components/user/AnimatedPage"
import { Input } from "@food/components/ui/input"
import { Button } from "@food/components/ui/button"
import { authAPI, userAPI } from "@food/api"
import { setAuthData as setUserAuthData } from "@food/utils/auth"

export default function OTP() {
  const navigate = useNavigate()
  const [otp, setOtp] = useState(["", "", "", "", "", ""]) // exactly 6 digits
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

    // Auto-focus next input (6 boxes)
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all 6 digits are entered
    if (!showNameInput && newOtp.slice(0, 6).every((digit) => digit !== "")) {
      handleVerify(newOtp.slice(0, 6).join(""))
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
        const digits = text.replace(/\D/g, "").slice(0, 6).split("")
        const newOtp = [...otp]
        digits.forEach((digit, i) => {
          if (i < 6) newOtp[i] = digit
        })
        setOtp(newOtp)
        if (!showNameInput && digits.length === 6) {
          handleVerify(newOtp.slice(0, 6).join(""))
        } else {
          inputRefs.current[Math.min(digits.length, 5)]?.focus()
        }
      })
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text")
    const digits = pastedData.replace(/\D/g, "").slice(0, 6).split("")
    const newOtp = [...otp]
    digits.forEach((digit, i) => {
      if (i < 6) newOtp[i] = digit
    })
    setOtp(newOtp)
    if (!showNameInput && digits.length === 6) {
      handleVerify(newOtp.slice(0, 6).join(""))
    } else {
      inputRefs.current[Math.min(digits.length, 5)]?.focus()
    }
  }

  const handleVerify = async (otpValue = null) => {
    if (showNameInput) return
    if (submittingRef.current) return

    const code = (otpValue || otp.join("")).replace(/\D/g, "")
    const code6 = code.slice(0, 6)
    if (code6.length !== 6 && code6.length !== 4) {
      setError("OTP must be exactly 6 digits")
      return
    }

    submittingRef.current = true
    setIsLoading(true)
    setError("")

    setTimeout(() => {
      try {
        const storedAuth = sessionStorage.getItem("userAuthData")
        const authDataParsed = storedAuth ? JSON.parse(storedAuth) : null
        const verifiedPhone = authDataParsed?.phone || contactInfo

        // Check localStorage for users list
        const mobileNumber = verifiedPhone
        const users = JSON.parse(localStorage.getItem("users")) || []
        const completedProfiles = JSON.parse(localStorage.getItem("completed_profiles") || "{}")
        const cleanMobile = mobileNumber.replace(/\D/g, "").slice(-10)
        
        let existingUser = users.find(
            user => user.phone === mobileNumber
        )
        
        // Also support fuzzy search to be robust against slight format mismatches
        if (!existingUser) {
          existingUser = users.find(user => {
            const cleanUserPhone = String(user.phone || user.mobile || "").replace(/\D/g, "").slice(-10)
            return cleanUserPhone === cleanMobile
          })
        }

        // Backward compatibility: check completed_profiles dictionary
        if (!existingUser) {
          const profileByCleanPhone = completedProfiles[cleanMobile]
          const profileByFullPhone = completedProfiles[mobileNumber]
          existingUser = profileByCleanPhone || profileByFullPhone

          if (existingUser) {
            // Migrate legacy profile to users array
            users.push(existingUser)
            localStorage.setItem("users", JSON.stringify(users))
          }
        }

        if (existingUser) {
          // Save current user session
          localStorage.setItem(
              "currentUser",
              JSON.stringify(existingUser)
          )
          
          // Compatibility with existing app state
          localStorage.setItem("user_user", JSON.stringify(existingUser))
          localStorage.setItem("userProfile", JSON.stringify(existingUser))
          setUserAuthData("user", "dummy_access_token", existingUser, "dummy_refresh_token")
          localStorage.setItem("user_authenticated", "true")
          sessionStorage.removeItem("userAuthData")
          window.dispatchEvent(new Event("userAuthChanged"))

          setSuccess(true)
          setIsLoading(false)
          submittingRef.current = false

          // Navigate to Home Page
          navigate("/food/user")
        } else {
          // Save temporary phone number
          localStorage.setItem(
              "tempPhone",
              mobileNumber
          )
          
          // Compatibility with existing app state and allowing MyProfile access
          localStorage.setItem("user_temp_phone", mobileNumber)
          const dummyUser = {
            id: "user_dummy_" + Date.now(),
            name: "",
            phone: mobileNumber,
            email: "",
            profileCompleted: false
          }
          setUserAuthData("user", "dummy_access_token", dummyUser, "dummy_refresh_token")
          localStorage.setItem("user_authenticated", "true")
          sessionStorage.removeItem("userAuthData")
          window.dispatchEvent(new Event("userAuthChanged"))

          setSuccess(true)
          setIsLoading(false)
          submittingRef.current = false

          // Navigate to Create Profile Page
          navigate("/user/profile/create", { state: { phone: mobileNumber } })
        }
      } catch (err) {
        setError("Simulation failed. Please try again.")
        setIsLoading(false)
        submittingRef.current = false
      }
    }, 1500)
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
    <AnimatedPage className="min-h-screen bg-white dark:bg-[#111111] flex flex-col">
      {/* Custom Header matching the screenshot */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/80 bg-white dark:bg-[#111111] h-14">
        <button
          onClick={() => navigate("/user/auth/login")}
          className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer bg-transparent border-0"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5 text-black dark:text-white" />
        </button>
        
        {/* Centered Styled Logo */}
        <div className="flex items-center gap-1.5 pr-8 mx-auto">
          {/* Styled Logo Icon (Red Triangle) */}
          <div 
            className="w-0 h-0 border-l-[11px] border-l-transparent border-r-[11px] border-r-transparent border-b-[18px] border-b-[#E53935]" 
            style={{ transform: 'skewX(-10deg)' }}
          />
          {/* Brand text styled like Pizza Hut */}
          <span className="font-sans text-lg font-black italic tracking-tight text-[#E53935]">
            Papa Veg Pizza
          </span>
        </div>
      </div>

      <main className="flex-1 flex flex-col justify-start p-6 mt-8 max-w-sm mx-auto w-full space-y-4">
        {/* Message */}
        <div className="text-left space-y-1">
          <h2 className="text-2xl font-black text-black dark:text-white leading-tight tracking-tight">
            {showNameInput ? "Help us know you better" : "Enter code"}
          </h2>
          
          {!showNameInput && (
            <div className="text-xs text-slate-800 dark:text-slate-200 space-y-1">
              <p>
                We sent a code to <strong className="font-extrabold text-black dark:text-white">{contactInfo}</strong>
              </p>
              <p className="text-slate-500 dark:text-slate-400">
                Please enter the code to login
              </p>
            </div>
          )}
          
          {showNameInput && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              We're excited to have you join us! Please tell us your full name to get started.
            </p>
          )}
        </div>

        {/* OTP Input Fields */}
        {!showNameInput && (
          <div className="space-y-6">
            <div className="flex justify-between gap-1.5 max-w-[320px]">
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
                  aria-label={`OTP digit ${index + 1} of 6`}
                  className="w-10 h-11 text-center text-lg font-black border border-slate-300 dark:border-slate-700 rounded-lg focus:border-[#E53935] focus:ring-1 focus:ring-[#E53935] bg-white dark:bg-[#1a1a1a] text-black dark:text-white transition-all outline-none"
                />
              ))}
            </div>

            {error && (
              <div className="flex items-center justify-center gap-1.5 text-xs text-red-500 bg-red-50 dark:bg-red-900/10 py-2 rounded-lg">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>{error}</span>
              </div>
            )}

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
          <div className="flex justify-center pt-2">
            <Loader2 className="h-6 w-6 text-[#E53935] animate-spin" />
          </div>
        )}
      </main>
    </AnimatedPage>
  )
}
