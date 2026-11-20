import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Loader2, ShieldCheck, CheckCircle2 } from "lucide-react"
import AnimatedPage from "@food/components/user/AnimatedPage"
import { Input } from "@food/components/ui/input"
import { Button } from "@food/components/ui/button"
import { deliveryClient } from "@/services/api/axios"
import { useSystemTheme } from "@/shared/utils/themeSync"
import { deliveryAPI } from "@food/api"
import { setAuthData as storeAuthData } from "@food/utils/auth"
const debugLog = (...args) => {}
const debugWarn = (...args) => {}
const debugError = (...args) => {}


// Login OTPs are 6 digits (the backend generates and verifies exactly 6).
const OTP_LENGTH = 6

export default function DeliveryOTP() {
  const navigate = useNavigate()
  // The delivery app's own colours (Settings > Delivery login): the same ones the sign-in screen uses
  const { primaryColor } = useSystemTheme()
  const [brand, setBrand] = useState({
    primary: primaryColor && primaryColor !== "#a43c12" ? primaryColor : "#EE3A43",
    secondary: "#FF5722",
  })
  useEffect(() => {
    let alive = true
    deliveryClient.get("/settings/delivery-login").then(({ data }) => {
      const cfg = data?.data
      if (alive && cfg) setBrand((b) => ({ primary: cfg.primaryColor || b.primary, secondary: cfg.secondaryColor || b.secondary }))
    }).catch(() => {})
    return () => { alive = false }
  }, [])
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""))
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  const [authData, setAuthData] = useState(null)
  const [showNameInput, setShowNameInput] = useState(false)
  const [name, setName] = useState("")
  const [nameError, setNameError] = useState("")
  const [verifiedOtp, setVerifiedOtp] = useState("")
  const [pendingMessage, setPendingMessage] = useState("")
  const [isRejected, setIsRejected] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [deviceToken, setDeviceToken] = useState(null)
  const [activePlatform, setActivePlatform] = useState("web")
  const inputRefs = useRef([])

  useEffect(() => {
    // Get auth data from sessionStorage (delivery module key)
    const stored = sessionStorage.getItem("deliveryAuthData")
    if (stored) {
      const data = JSON.parse(stored)
      setAuthData(data)
    } else {
      // No active OTP flow: if already authenticated, go to delivery home
      const token = localStorage.getItem("delivery_accessToken")
      const authenticated = localStorage.getItem("delivery_authenticated") === "true"
      if (token && authenticated) {
        try {
          const parts = token.split('.')
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
            const now = Math.floor(Date.now() / 1000)
            if (payload.exp && payload.exp > now) {
              navigate("/food/delivery", { replace: true })
              return
            }
          }
        } catch (e) {
          // Ignore token parse errors and continue to sign-in redirect
        }
      }

      // No auth data, redirect to sign in
      navigate("/food/delivery/login", { replace: true })
      return
    }

    // OTP field should be empty - delivery boy needs to enter it manually
    // No auto-fill for delivery OTP

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    // Don't auto-focus - let user manually enter OTP
    // Focus first input only if all fields are empty (small delay to ensure inputs are rendered)
    if (inputRefs.current[0] && otp.every(digit => digit === "")) {
      setTimeout(() => {
        inputRefs.current[0]?.focus()
      }, 100)
    }
  }, [otp])

  const handleChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) {
      return
    }

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    setError("")

    // Auto-focus next input
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all digits are entered and we are in OTP step
    if (!showNameInput && newOtp.every((digit) => digit !== "") && newOtp.length === OTP_LENGTH) {
      handleVerify(newOtp.join(""))
    }
  }

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === "Backspace") {
      if (otp[index]) {
        // If current input has value, clear it
        const newOtp = [...otp]
        newOtp[index] = ""
        setOtp(newOtp)
      } else if (index > 0) {
        // If current input is empty, move to previous and clear it
        inputRefs.current[index - 1]?.focus()
        const newOtp = [...otp]
        newOtp[index - 1] = ""
        setOtp(newOtp)
      }
    }
    // Handle paste
    if (e.key === "v" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      navigator.clipboard.readText().then((text) => {
        const digits = text.replace(/\D/g, "").slice(0, OTP_LENGTH).split("")
        const newOtp = [...otp]
        digits.forEach((digit, i) => {
          if (i < OTP_LENGTH) {
            newOtp[i] = digit
          }
        })
        setOtp(newOtp)
        if (digits.length === OTP_LENGTH) {
          handleVerify(newOtp.join(""))
        } else {
          inputRefs.current[digits.length]?.focus()
        }
      })
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text")
    const digits = pastedData.replace(/\D/g, "").slice(0, OTP_LENGTH).split("")
    const newOtp = [...otp]
    digits.forEach((digit, i) => {
      if (i < OTP_LENGTH) {
        newOtp[i] = digit
      }
    })
    setOtp(newOtp)
    if (!showNameInput && digits.length === OTP_LENGTH) {
      handleVerify(newOtp.join(""))
      return
    }
    inputRefs.current[digits.length]?.focus()
  }

  const handleVerify = async (otpValue = null) => {
    if (showNameInput) {
      // In name collection step, ignore OTP auto-submit
      return
    }

    const code = otpValue || otp.join("")

    // OTPs are 6 digits (OTP_LENGTH); a leftover 4-digit check made a full code do nothing
    if (code.length !== OTP_LENGTH) {
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const phone = authData?.phone
      const purpose = authData?.purpose || "login"
      const providedName = authData?.isSignUp ? authData?.name || null : null
      if (!phone) {
        setError("Phone number not found. Please try again.")
        setIsLoading(false)
        return
      }

      // Try to get FCM token before verifying OTP
      let fcmToken = null;
      let platform = "web";
      try {
        if (typeof window !== "undefined") {
          if (window.flutter_inappwebview) {
            platform = "mobile";
            const handlerNames = ["getFcmToken", "getFCMToken", "getPushToken", "getFirebaseToken"];
            for (const handlerName of handlerNames) {
              try {
                const t = await window.flutter_inappwebview.callHandler(handlerName, { module: "delivery" });
                if (t && typeof t === "string" && t.length > 20) {
                  fcmToken = t.trim();
                  break;
                }
              } catch (e) {}
            }
          } else {
            fcmToken = localStorage.getItem("fcm_web_registered_token_delivery") || null;
          }
        }
      } catch (e) {
        debugWarn("Failed to get FCM token during login", e);
      }

      setDeviceToken(fcmToken);
      setActivePlatform(platform);

      // Backend: POST /auth/delivery/verify-otp returns either:
      // - { needsRegistration: true } when no partner exists yet
      // - or { accessToken, refreshToken, user } for existing partners
      const response = await deliveryAPI.verifyOTP(phone, code, purpose, providedName, fcmToken, platform)
      debugLog("Delivery OTP Response:", response)
      const data = response?.data?.data || response?.data || {}
      debugLog("Parsed Delivery OTP Data:", data)

      if (data.pendingApproval === true) {
        sessionStorage.removeItem("deliveryAuthData")
        setIsLoading(false)
        setError("")
        setPendingMessage(data.message || "Your account is pending admin verification. You will be notified once approved.")
        setIsRejected(data.isRejected || false)
        setRejectionReason(data.rejectionReason || "")
        return
      }

      const needsRegistration = data.needsRegistration === true

      if (needsRegistration) {
        // No DB record yet; redirect to registration details page WITHOUT creating anything in DB.
        sessionStorage.removeItem("deliveryAuthData")
        sessionStorage.setItem("deliveryNeedsRegistration", "true")
        const digits = String(phone || "").replace(/\D/g, "")
        const details = {
          name: "",
          phone: digits.slice(-10),
          countryCode: "+91",
        }
        sessionStorage.setItem("deliverySignupDetails", JSON.stringify(details))
        setIsLoading(false)
        navigate("/food/delivery/signup/details", { replace: true })
        return
      }

      const accessToken = data.accessToken
      const refreshToken = data.refreshToken || null
      const user = data.user

      if (!accessToken || !user) {
        throw new Error("Invalid response from server")
      }

      sessionStorage.removeItem("deliveryAuthData")

      try {
        debugLog("Storing auth data for delivery:", { hasToken: !!accessToken, hasUser: !!user })
        storeAuthData("delivery", accessToken, user, refreshToken)
        debugLog("Auth data stored successfully")
      } catch (storageError) {
        debugError("Failed to store authentication data:", storageError)
        setError("Failed to save authentication. Please try again or clear your browser storage.")
        setIsLoading(false)
        return
      }

      window.dispatchEvent(new Event("deliveryAuthChanged"))

      setSuccess(true)
      setIsLoading(false)

      let retryCount = 0
      const maxRetries = 10
      const verifyAndNavigate = () => {
        const storedToken = localStorage.getItem("delivery_accessToken")
        const storedAuth = localStorage.getItem("delivery_authenticated")

        if (storedToken && storedAuth === "true") {
          navigate("/food/delivery", { replace: true })
        } else if (retryCount < maxRetries) {
          retryCount++
          setTimeout(verifyAndNavigate, 100)
        } else {
          setError("Failed to save authentication. Please try again.")
          setIsLoading(false)
        }
      }
      setTimeout(verifyAndNavigate, 200)
    } catch (err) {
      debugError("OTP Verification Error:", err)
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to verify OTP. Please try again."
      setError(message)
      setIsLoading(false)
    }
  }

  const handleSubmitName = async () => {
    const trimmedName = name.trim()
    if (!trimmedName) {
      setNameError("Name is required")
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
      const phone = authData?.phone
      const purpose = authData?.purpose || "login"
      if (!phone) {
        setError("Phone number not found. Please try again.")
        return
      }

      // Second call with name to auto-register and login
      const response = await deliveryAPI.verifyOTP(phone, verifiedOtp, purpose, trimmedName, deviceToken, activePlatform)
      const data = response?.data?.data || response?.data || {}

      const accessToken = data.accessToken
      const refreshToken = data.refreshToken || null
      const user = data.user

      if (!accessToken || !user) {
        throw new Error("Invalid response from server")
      }

      // Clear auth data from sessionStorage
      sessionStorage.removeItem("deliveryAuthData")

      // Store auth data using utility function to ensure proper role handling
      // The setAuthData function includes error handling and verification
      try {
        debugLog("Storing auth data for delivery (with name):", { hasToken: !!accessToken, hasUser: !!user })
        storeAuthData("delivery", accessToken, user, refreshToken)
        debugLog("Auth data stored successfully")
      } catch (storageError) {
        debugError("Failed to store authentication data:", storageError)
        setError("Failed to save authentication. Please try again or clear your browser storage.")
        setIsLoading(false)
        return
      }

      // Dispatch custom event for same-tab updates
      window.dispatchEvent(new Event("deliveryAuthChanged"))

      setSuccess(true)
      setIsLoading(false)

      // Verify token is stored and then navigate
      let retryCount = 0
      const maxRetries = 10
      const verifyAndNavigate = () => {
        const storedToken = localStorage.getItem("delivery_accessToken")
        const storedAuth = localStorage.getItem("delivery_authenticated")

        debugLog("Verifying token storage (with name):", { hasToken: !!storedToken, authenticated: storedAuth, retryCount })

        if (storedToken && storedAuth === "true") {
          // Token is stored, navigate to delivery home
          debugLog("Token verified, navigating to /delivery")
          navigate("/food/delivery", { replace: true })
        } else if (retryCount < maxRetries) {
          // Token not stored yet, retry after short delay
          retryCount++
          setTimeout(verifyAndNavigate, 100)
        } else {
          // Max retries reached, show error
          debugError("Token storage verification failed after max retries")
          setError("Failed to save authentication. Please try again.")
          setIsLoading(false)
        }
      }

      // Start verification after a small delay
      setTimeout(verifyAndNavigate, 200)
    } catch (err) {
      debugError("Name Submission Error:", err)
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
    if (resendTimer > 0) return

    setIsLoading(true)
    setError("")

    try {
      const phone = authData?.phone
      const purpose = authData?.purpose || "login"
      if (!phone) {
        setError("Phone number not found. Please go back and try again.")
        return
      }

      // Call backend to resend OTP
      await deliveryAPI.sendOTP(phone, purpose)
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

    // Reset timer to 60 seconds
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

    setOtp(Array(OTP_LENGTH).fill(""))
    setShowNameInput(false)
    setName("")
    setNameError("")
    setVerifiedOtp("")
    inputRefs.current[0]?.focus()
  }

  const getPhoneNumber = () => {
    if (!authData) return ""
    if (authData.method === "phone") {
      // Format phone number as +91-9098569620
      const phone = authData.phone || ""
      // Remove spaces and format
      const cleaned = phone.replace(/\s/g, "")
      // Add hyphen after country code if not present
      if (cleaned.startsWith("+91") && cleaned.length > 3) {
        return cleaned.slice(0, 3) + "-" + cleaned.slice(3)
      }
      return cleaned
    }
    return authData.email || ""
  }

  if (!authData) {
    return null
  }

  return (
    <AnimatedPage className="min-h-screen bg-white text-gray-900 flex flex-col font-['Poppins',sans-serif]">
      {/* Curved brand banner, like the delivery sign-in screen */}
      <div
        className="relative w-full pt-5 pb-16 px-4 overflow-hidden rounded-b-[40px] shadow-md"
        style={{ background: `linear-gradient(145deg, ${brand.primary} 0%, ${brand.secondary} 100%)` }}
      >
        <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-white/15 blur-lg pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-white/10 blur-md pointer-events-none" />
        <div className="relative flex items-center justify-center">
          <button
            onClick={() => navigate("/food/delivery/login")}
            className="absolute left-0 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
          <h1 className="text-lg font-bold text-white m-0">OTP Verification</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col px-5 -mt-8 pb-12 relative z-10">
        <div className="max-w-md mx-auto w-full bg-white rounded-[28px] border border-gray-100 shadow-[0_10px_35px_rgba(0,0,0,0.08)] px-5 py-8 space-y-7">
          {/* Message */}
          <div className="text-center space-y-3">
            <div className="mx-auto h-14 w-14 rounded-full flex items-center justify-center" style={{ backgroundColor: `${brand.primary}1A` }}>
              {success ? (
                <CheckCircle2 className="h-7 w-7 text-green-600" />
              ) : (
                <ShieldCheck className="h-7 w-7" style={{ color: brand.primary }} />
              )}
            </div>
            <p className="text-[15px] text-gray-600 leading-snug">
              {showNameInput
                ? "You're almost done! Please tell us your name to complete registration."
                : success
                  ? "Verified. Taking you to your deliveries..."
                  : "We have sent a 6-digit verification code to"}
            </p>
            {!showNameInput && !success && (
              <p className="text-lg text-gray-900 font-extrabold tracking-wide">
                {getPhoneNumber()}
              </p>
            )}
          </div>

          {/* Pending approval message – already registered, waiting for admin */}
          {pendingMessage && (
            <div className={`rounded-xl border p-5 text-center space-y-4 shadow-sm ${isRejected ? "bg-red-50 border-red-100" : "bg-amber-50 border-amber-100"}`}>
              <div className="space-y-2">
                <p className={`text-sm font-semibold ${isRejected ? "text-red-800" : "text-amber-800"}`}>
                  {isRejected ? "Application Rejected" : "Pending Verification"}
                </p>
                <p className={`text-sm leading-relaxed ${isRejected ? "text-red-700" : "text-amber-700"}`}>
                  {pendingMessage}
                </p>
                {isRejected && rejectionReason && (
                  <div className="mt-2 p-3 bg-white/50 rounded-lg border border-red-200">
                    <p className="text-xs font-medium text-red-600 uppercase tracking-wider mb-1">Reason</p>
                    <p className="text-sm text-red-800 italic">"{rejectionReason}"</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 pt-2">
                {isRejected ? (
                  <button
                    type="button"
                    onClick={() => {
                      const phone = authData?.phone
                      const digits = String(phone || "").replace(/\D/g, "")
                      sessionStorage.setItem("deliveryNeedsRegistration", "true")
                      const details = {
                        name: "",
                        phone: digits.slice(-10),
                        countryCode: "+91",
                      }
                      sessionStorage.setItem("deliverySignupDetails", JSON.stringify(details))
                      navigate("/food/delivery/signup/details", { replace: true })
                    }}
                    className="w-full py-3 bg-red-600 text-white rounded-lg font-bold text-sm hover:bg-red-700 shadow-md transition-all active:scale-95"
                  >
                    Re-apply Now
                  </button>
                ) : null}
                
                <button
                  type="button"
                  onClick={() => navigate("/food/delivery/login", { replace: true })}
                  className={`text-sm font-medium underline transition-colors ${isRejected ? "text-red-600 hover:text-red-800" : "text-amber-700 hover:text-amber-900"}`}
                >
                  Back to login
                </button>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <p role="alert" className="text-sm font-medium text-red-600 text-center bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          {/* OTP Input Fields */}
          {!showNameInput && !pendingMessage && (
            <>
              <div className="flex justify-center gap-2 sm:gap-2.5">
                {otp.map((digit, index) => (
                  <Input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    disabled={isLoading}
                    autoComplete="off"
                    autoFocus={false}
                    style={digit ? { borderColor: brand.primary, backgroundColor: `${brand.primary}0D` } : undefined}
                    className={`w-11 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold p-0 rounded-2xl border-2 outline-none transition-all focus-visible:ring-4 focus-visible:ring-black/5 text-gray-900 ${digit ? "" : "border-gray-200 bg-gray-50 focus-visible:bg-white"}`}
                  />
                ))}
              </div>

              {/* Resend Section */}
              <div className="text-center space-y-1">
                <p className="text-sm text-gray-500">
                  Didn't get the OTP?
                </p>
                {resendTimer > 0 ? (
                  <p className="text-sm font-semibold text-gray-700">
                    Resend SMS in <span className="tabular-nums" style={{ color: brand.primary }}>{resendTimer}s</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isLoading}
                    style={{ color: brand.primary }}
                    className="text-sm font-bold hover:underline disabled:opacity-50"
                  >
                    Resend SMS
                  </button>
                )}
              </div>
            </>
          )}

          {/* Name Input (shown only after OTP verified and user is new) */}
          {showNameInput && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-gray-800 text-left">
                  Full name
                </label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    if (nameError) setNameError("")
                  }}
                  disabled={isLoading}
                  placeholder="Enter your name"
                  className={`h-12 rounded-2xl border-2 bg-gray-50 ${nameError ? "border-red-500" : "border-gray-200"}`}
                />
                {nameError && (
                  <p className="text-xs text-red-500 text-left">
                    {nameError}
                  </p>
                )}
              </div>

              <Button
                onClick={handleSubmitName}
                disabled={isLoading}
                style={{ backgroundColor: brand.primary, boxShadow: `0 10px 24px -4px ${brand.primary}55` }}
                className="w-full h-12 rounded-full text-white font-bold shadow-lg hover:opacity-95 active:scale-[0.98] transition-all"
              >
                {isLoading ? "Continuing..." : "Continue"}
              </Button>
            </div>
          )}

          {/* Loading Spinner */}
          {isLoading && !showNameInput && (
            <div className="flex justify-center pt-4">
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: brand.primary }} />
            </div>
          )}
        </div>
      </div>

    </AnimatedPage>
  )
}

