import React, { useState, useEffect, useRef } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, ArrowLeft, User, Mail, Calendar, CheckCircle2, Loader2, AlertCircle } from "lucide-react"
import { useProfile } from "@food/context/ProfileContext"
import { userAPI } from "@food/api"

const CustomDropdown = ({ value, options, placeholder, onChange, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className={`relative ${className}`} ref={ref}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-12 px-3 sm:px-4 border border-gray-200 rounded-xl text-sm focus:outline-none flex items-center justify-between transition-all bg-gray-50/50 hover:bg-white cursor-pointer select-none ${isOpen ? 'border-[var(--accent-red)] ring-1 ring-[var(--accent-red)] bg-white' : ''}`}
      >
        <span className={`truncate ${value ? "text-gray-900" : "text-gray-400"}`}>
          {value || placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.1)] max-h-48 overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-gray-200"
          >
            {options.map((opt, i) => (
              <div
                key={i}
                onClick={() => {
                  onChange(opt)
                  setIsOpen(false)
                }}
                className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${value === opt ? 'bg-[var(--accent-red)]/10 text-[var(--accent-red)] font-semibold' : 'text-gray-700 hover:bg-gray-50'}`}
              >
                {opt}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function MyProfile() {
  const navigate = useNavigate()
  const location = useLocation()
  const { updateUserProfile } = useProfile()
  
  // Form fields
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  
  const [phone, setPhone] = useState(() => {
    const statePhone = location.state?.phone
    if (statePhone) {
      const cleaned = String(statePhone).replace(/\D/g, "")
      return cleaned.slice(-10)
    }
    const tempPhone = localStorage.getItem("tempPhone") || localStorage.getItem("user_temp_phone")
    if (tempPhone) {
      const cleaned = String(tempPhone).replace(/\D/g, "")
      return cleaned.slice(-10)
    }
    return "8770552411" // fallback
  })
  
  const [gender, setGender] = useState("Unspecified")
  const [subscribeOffers, setSubscribeOffers] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  
  // Custom Date fields
  const [birthDay, setBirthDay] = useState("")
  const [birthMonth, setBirthMonth] = useState("")
  const [birthYear, setBirthYear] = useState("")
  
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const days = Array.from({length: 31}, (_, i) => String(i + 1))
  const currentYear = new Date().getFullYear()
  const years = Array.from({length: 100}, (_, i) => String(currentYear - i))

  // Validation & API state
  const [isFormValid, setIsFormValid] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [apiError, setApiError] = useState("")

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("user_authenticated") === "true"
    if (!isAuthenticated) {
      navigate("/user/auth/login", { replace: true })
      return
    }

    try {
      const tempPhone = localStorage.getItem("tempPhone") || localStorage.getItem("user_temp_phone")
      if (tempPhone) {
        const cleaned = String(tempPhone).replace(/\D/g, "")
        if (cleaned.length >= 10) setPhone(cleaned.slice(-10))
        else setPhone(tempPhone)
      } else {
        const stored = localStorage.getItem("currentUser") || localStorage.getItem("user_user")
        if (stored) {
          const userObj = JSON.parse(stored)
          if (userObj.phone) {
            const cleaned = String(userObj.phone).replace(/\D/g, "")
            if (cleaned.length >= 10) setPhone(cleaned.slice(-10))
            else setPhone(userObj.phone)
          }
        }
      }

      const stored = localStorage.getItem("currentUser") || localStorage.getItem("user_user")
      if (stored) {
        const userObj = JSON.parse(stored)
        if (userObj.name) {
          const parts = userObj.name.trim().split(/\s+/)
          setFirstName(parts[0] || "")
          setLastName(parts.slice(1).join(" ") || "")
        }
        if (userObj.email) setEmail(userObj.email)
        if (userObj.gender) setGender(userObj.gender)
        
        if (userObj.birthday) {
          const parts = userObj.birthday.split('-')
          if (parts.length === 3) {
            setBirthYear(parts[0])
            const mIndex = parseInt(parts[1]) - 1
            if (mIndex >= 0 && mIndex < 12) setBirthMonth(months[mIndex])
            setBirthDay(parseInt(parts[2]).toString())
          }
        }
        
        if (userObj.subscribeOffers !== undefined) setSubscribeOffers(userObj.subscribeOffers)
        if (userObj.profileCompleted) setAgreeTerms(true)
      }
    } catch (e) {
      console.error("Error reading profile details from session", e)
    }
  }, [])

  useEffect(() => {
    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    const valid =
      firstName.trim().length > 0 &&
      lastName.trim().length > 0 &&
      isEmailValid &&
      agreeTerms
    setIsFormValid(valid)
  }, [firstName, lastName, email, agreeTerms])

  const handleCreateAccount = async () => {
    if (!isFormValid || isSaving) return
    setIsSaving(true)
    setApiError("")

    try {
      const storedUser = JSON.parse(localStorage.getItem("currentUser") || localStorage.getItem("user_user") || "{}")
      
      let formattedBirthday = ""
      if (birthDay && birthMonth && birthYear) {
        const mIndex = months.indexOf(birthMonth) + 1
        formattedBirthday = `${birthYear}-${String(mIndex).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`
      }

      let backendGender = ""
      if (gender === "Male") backendGender = "male"
      else if (gender === "Female") backendGender = "female"
      else if (gender === "Other") backendGender = "other"
      else if (gender === "Unspecified" || !gender) backendGender = "prefer-not-to-say"

      const updatedUser = {
        ...storedUser,
        name: `${firstName.trim()} ${lastName.trim()}`,
        email: email.trim(),
        gender: backendGender,
        birthday: formattedBirthday,
        dateOfBirth: formattedBirthday,
        phone: phone.includes("+91") ? phone : `+91 ${phone}`,
        mobile: phone,
        subscribeOffers: subscribeOffers,
        profileCompleted: true
      }

      // API Call (exclude phone/mobile as backend rejects changing them)
      const apiPayload = {
        name: updatedUser.name,
        email: updatedUser.email,
        gender: updatedUser.gender,
        birthday: updatedUser.birthday,
        dateOfBirth: updatedUser.dateOfBirth,
        subscribeOffers: updatedUser.subscribeOffers,
        profileCompleted: updatedUser.profileCompleted
      }
      await userAPI.updateProfile(apiPayload)

      // Sync local storage state
      localStorage.setItem("currentUser", JSON.stringify(updatedUser))
      localStorage.setItem("user_user", JSON.stringify(updatedUser))
      localStorage.setItem("userProfile", JSON.stringify(updatedUser))
      localStorage.setItem("appzeto_user_profile", JSON.stringify(updatedUser))

      const completedProfiles = JSON.parse(localStorage.getItem("completed_profiles") || "{}")
      completedProfiles[phone] = updatedUser
      localStorage.setItem("completed_profiles", JSON.stringify(completedProfiles))

      const users = JSON.parse(localStorage.getItem("users")) || []
      const index = users.findIndex(u => {
        const cleanU = String(u.phone || u.mobile || "").replace(/\D/g, "").slice(-10)
        const cleanPhone = String(phone).replace(/\D/g, "").slice(-10)
        return cleanU === cleanPhone
      })
      if (index > -1) users[index] = { ...users[index], ...updatedUser }
      else users.push(updatedUser)
      localStorage.setItem("users", JSON.stringify(users))

      localStorage.removeItem("tempPhone")
      localStorage.removeItem("user_temp_phone")

      updateUserProfile(updatedUser)
      window.dispatchEvent(new Event("userAuthChanged"))

      navigate("/food/user")
    } catch (err) {
      console.error("Error saving profile details", err)
      setApiError(err?.response?.data?.message || err?.message || "Failed to save profile. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-gray-900 pb-10" style={{ fontFamily: "Poppins, sans-serif" }}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md shadow-sm px-4 py-4 flex items-center border-b border-gray-100">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-full border border-gray-100 transition-colors mr-3"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </motion.button>
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Create Profile</h1>
      </header>

      {/* Main Content */}
      <div className="w-full max-w-md mx-auto p-4 sm:p-6 mt-2">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 space-y-8"
        >
          
          <div className="space-y-3 text-center pt-2">
            <div className="w-16 h-16 bg-[var(--accent-red)]/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-[var(--accent-red)]/20 shadow-sm">
              <User className="w-8 h-8 text-[var(--accent-red)]" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
              Welcome!
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed px-2">
              Your mobile number is verified. Let's get to know you better.
            </p>
          </div>

          {apiError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 leading-relaxed">{apiError}</p>
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-6">
            
            {/* Name Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 tracking-wide uppercase">
                  First Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full h-12 px-4 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[var(--accent-red)] focus:ring-1 focus:ring-[var(--accent-red)] transition-all bg-gray-50/50 focus:bg-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 tracking-wide uppercase">
                  Last Name
                </label>
                <input
                  type="text"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full h-12 px-4 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[var(--accent-red)] focus:ring-1 focus:ring-[var(--accent-red)] transition-all bg-gray-50/50 focus:bg-white"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 tracking-wide uppercase">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  placeholder="john.doe@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 pl-10 pr-4 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[var(--accent-red)] focus:ring-1 focus:ring-[var(--accent-red)] transition-all bg-gray-50/50 focus:bg-white"
                />
              </div>
            </div>

            {/* Phone Field (Read-only) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 tracking-wide uppercase">
                Mobile Number
              </label>
              <div className="flex gap-3">
                <div className="flex items-center gap-2 px-3 border border-gray-200 rounded-xl bg-gray-100/70 h-12 select-none shrink-0 opacity-80">
                  <div className="flex flex-col gap-[2px] w-5 h-3 border border-gray-300 rounded-[1px] overflow-hidden shrink-0">
                    <div className="bg-[#FF9933] h-1/3 w-full"></div>
                    <div className="bg-white h-1/3 w-full flex items-center justify-center relative">
                      <div className="w-1 h-1 rounded-full border border-[#000080] flex items-center justify-center">
                        <div className="w-0.5 h-0.5 rounded-full bg-[#000080]"></div>
                      </div>
                    </div>
                    <div className="bg-[#138808] h-1/3 w-full"></div>
                  </div>
                  <span className="text-sm font-bold text-gray-600">+91</span>
                </div>
                
                <div className="relative flex-1 opacity-80">
                  <input
                    type="text"
                    readOnly
                    value={phone}
                    className="w-full h-12 px-4 pr-10 border border-gray-200 rounded-xl text-sm bg-gray-100/70 text-gray-500 focus:outline-none cursor-not-allowed font-medium"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 tracking-wide uppercase">
                Gender
              </label>
              <CustomDropdown 
                value={gender}
                options={["Unspecified", "Male", "Female", "Other"]}
                placeholder="Select Gender"
                onChange={setGender}
              />
            </div>

            {/* Birthday */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 tracking-wide uppercase">
                Birthday <span className="text-gray-400 font-normal normal-case ml-1">(Optional)</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                <CustomDropdown 
                  value={birthDay}
                  options={days}
                  placeholder="Day"
                  onChange={setBirthDay}
                />
                <CustomDropdown 
                  value={birthMonth}
                  options={months}
                  placeholder="Month"
                  onChange={setBirthMonth}
                />
                <CustomDropdown 
                  value={birthYear}
                  options={years}
                  placeholder="Year"
                  onChange={setBirthYear}
                />
              </div>
            </div>

          </div>

          {/* Checkbox settings */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center mt-0.5">
                <input
                  type="checkbox"
                  checked={subscribeOffers}
                  onChange={(e) => setSubscribeOffers(e.target.checked)}
                  className="peer appearance-none w-5 h-5 rounded border-2 border-gray-300 checked:border-[var(--accent-red)] checked:bg-[var(--accent-red)] transition-all cursor-pointer"
                />
                <svg className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 5L5 9L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-xs text-gray-600 leading-relaxed select-none transition-colors">
                I want to receive the latest discounts and exclusive offers from Papa Veg Pizza.
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center mt-0.5">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="peer appearance-none w-5 h-5 rounded border-2 border-gray-300 checked:border-[var(--accent-red)] checked:bg-[var(--accent-red)] transition-all cursor-pointer"
                />
                <svg className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 5L5 9L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-xs text-gray-600 leading-relaxed select-none transition-colors">
                I have read and agree to Papa Veg Pizza's <span className="text-[var(--accent-red)] font-medium">Terms of Use</span> and <span className="text-[var(--accent-red)] font-medium">Privacy Policy</span>
              </span>
            </label>
          </div>

          {/* Create Account CTA */}
          <div className="pt-2">
            <motion.button
              whileTap={isFormValid && !isSaving ? { scale: 0.98 } : {}}
              onClick={handleCreateAccount}
              disabled={!isFormValid || isSaving}
              className={`w-full h-14 font-extrabold rounded-2xl text-[15px] uppercase tracking-wider transition-all border-0 flex items-center justify-center gap-2 bg-[var(--accent-red)] text-white shadow-md ${
                !isFormValid || isSaving
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer"
              }`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Create Account
                  {isFormValid && (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 ml-1">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                  )}
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
