import React, { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { motion } from "framer-motion"
import { ChevronDown } from "lucide-react"
import { useProfile } from "@food/context/ProfileContext"

export default function MyProfile() {
  const navigate = useNavigate()
  const location = useLocation()
  const { updateUserProfile } = useProfile()
  
  // Form fields
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  
  // Pre-fill phone number from location state, temp storage, or fallback
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
  const [gender, setGender] = useState("Rather not say")
  const [birthday, setBirthday] = useState("")
  const [subscribeOffers, setSubscribeOffers] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  
  // Validation state
  const [isFormValid, setIsFormValid] = useState(false)

  useEffect(() => {
    // Check if the user is authenticated; if not, redirect to login
    const isAuthenticated = localStorage.getItem("user_authenticated") === "true"
    if (!isAuthenticated) {
      navigate("/user/auth/login", { replace: true })
      return
    }

    // Parse verified credentials from localStorage if available
    try {
      // Priority 1: Check temporary phone from login session
      const tempPhone = localStorage.getItem("tempPhone") || localStorage.getItem("user_temp_phone")
      if (tempPhone) {
        const cleaned = String(tempPhone).replace(/\D/g, "")
        if (cleaned.length >= 10) {
          setPhone(cleaned.slice(-10))
        } else {
          setPhone(tempPhone)
        }
      } else {
        // Priority 2: Check stored userObj
        const stored = localStorage.getItem("currentUser") || localStorage.getItem("user_user")
        if (stored) {
          const userObj = JSON.parse(stored)
          if (userObj.phone) {
            const cleaned = String(userObj.phone).replace(/\D/g, "")
            if (cleaned.length >= 10) {
              setPhone(cleaned.slice(-10))
            } else {
              setPhone(userObj.phone)
            }
          }
        }
      }

      // Pre-fill other profile fields if there's existing data
      const stored = localStorage.getItem("currentUser") || localStorage.getItem("user_user")
      if (stored) {
        const userObj = JSON.parse(stored)
        if (userObj.name) {
          const parts = userObj.name.trim().split(/\s+/)
          setFirstName(parts[0] || "")
          setLastName(parts.slice(1).join(" ") || "")
        }
        if (userObj.email) {
          setEmail(userObj.email)
        }
        if (userObj.gender) {
          setGender(userObj.gender)
        }
        if (userObj.birthday) {
          setBirthday(userObj.birthday)
        }
        if (userObj.subscribeOffers !== undefined) {
          setSubscribeOffers(userObj.subscribeOffers)
        }
        if (userObj.profileCompleted) {
          setAgreeTerms(true)
        }
      }
    } catch (e) {
      console.error("Error reading profile details from session", e)
    }
  }, [])

  // Update validation status
  useEffect(() => {
    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    const valid =
      firstName.trim().length > 0 &&
      lastName.trim().length > 0 &&
      isEmailValid &&
      agreeTerms
    setIsFormValid(valid)
  }, [firstName, lastName, email, agreeTerms])

  const handleCreateAccount = () => {
    if (!isFormValid) return

    try {
      // Get existing session data
      const storedUser = JSON.parse(localStorage.getItem("currentUser") || localStorage.getItem("user_user") || "{}")
      
      // Update with user-entered profile details
      const updatedUser = {
        ...storedUser,
        name: `${firstName.trim()} ${lastName.trim()}`,
        email: email.trim(),
        gender: gender,
        birthday: birthday,
        dateOfBirth: birthday,
        phone: phone.includes("+91") ? phone : `+91 ${phone}`,
        mobile: phone,
        subscribeOffers: subscribeOffers,
        profileCompleted: true
      }

      // Save back to localStorage (keys used by auth and profile contexts)
      localStorage.setItem("currentUser", JSON.stringify(updatedUser))
      localStorage.setItem("user_user", JSON.stringify(updatedUser))
      localStorage.setItem("userProfile", JSON.stringify(updatedUser))
      localStorage.setItem("appzeto_user_profile", JSON.stringify(updatedUser))

      // Save to completed profiles list
      const completedProfiles = JSON.parse(localStorage.getItem("completed_profiles") || "{}")
      completedProfiles[phone] = updatedUser
      localStorage.setItem("completed_profiles", JSON.stringify(completedProfiles))

      // Save to global users array
      const users = JSON.parse(localStorage.getItem("users")) || []
      const index = users.findIndex(u => {
        const cleanU = String(u.phone || u.mobile || "").replace(/\D/g, "").slice(-10)
        const cleanPhone = String(phone).replace(/\D/g, "").slice(-10)
        return cleanU === cleanPhone
      })
      if (index > -1) {
        users[index] = { ...users[index], ...updatedUser }
      } else {
        users.push(updatedUser)
      }
      localStorage.setItem("users", JSON.stringify(users))

      // Clean up temporary phone storage
      localStorage.removeItem("tempPhone")
      localStorage.removeItem("user_temp_phone")

      // Update React context state
      updateUserProfile(updatedUser)

      // Trigger change event to sync navigation and UI state
      window.dispatchEvent(new Event("userAuthChanged"))

      // Navigate to customer home page
      navigate("/food/user")
    } catch (err) {
      console.error("Error saving profile details", err)
    }
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      {/* Full page layout container */}
      <div className="w-full max-w-md mx-auto p-6 space-y-6 bg-white">
        
        {/* Header */}
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold tracking-tight text-zinc-950 font-headline-lg-mobile">
            Create Profile
          </h2>
          <p className="text-sm text-zinc-500 leading-normal">
            Your mobile number has been confirmed. We just need a few more details.
          </p>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          
          {/* Name Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-800 tracking-wide">
                First name
              </label>
              <input
                type="text"
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full h-12 px-4 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-red-500 transition-colors bg-white font-sans"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-800 tracking-wide">
                Last name
              </label>
              <input
                type="text"
                placeholder="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full h-12 px-4 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-red-500 transition-colors bg-white font-sans"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-800 tracking-wide">
              Email address
            </label>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-12 px-4 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-red-500 transition-colors bg-white font-sans"
            />
          </div>

          {/* Phone Field (Read-only, matches screenshot exactly) */}
          <div className="space-y-1.5">
            <div className="flex gap-3">
              {/* Flag and Code Container */}
              <div className="flex items-center gap-2 px-3 border border-zinc-200 rounded-xl bg-zinc-50 h-12 select-none shrink-0">
                {/* CSS Indian Flag */}
                <div className="flex flex-col gap-[2px] w-5 h-3 border border-zinc-200/60 rounded-[1px] overflow-hidden shrink-0">
                  <div className="bg-[#FF9933] h-1/3 w-full"></div>
                  <div className="bg-white h-1/3 w-full flex items-center justify-center relative">
                    <div className="w-1 h-1 rounded-full border border-[#000080] flex items-center justify-center">
                      <div className="w-0.5 h-0.5 rounded-full bg-[#000080]"></div>
                    </div>
                  </div>
                  <div className="bg-[#138808] h-1/3 w-full"></div>
                </div>
                <span className="text-sm font-bold text-zinc-700">+91</span>
              </div>
              
              {/* Phone Input Box */}
              <input
                type="text"
                readOnly
                value={phone}
                className="flex-1 h-12 px-4 border border-zinc-200 rounded-xl text-sm bg-zinc-50/70 text-zinc-600 focus:outline-none cursor-not-allowed font-sans font-medium"
              />
            </div>
          </div>

          {/* Gender */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-800 tracking-wide">
              Gender (Optional)
            </label>
            <div className="relative">
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full h-12 px-4 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-red-500 transition-colors bg-white appearance-none font-sans"
              >
                <option value="Rather not say">Rather not say</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                <ChevronDown className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Birthday */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-800 tracking-wide">
              Birthday (optional)
            </label>
            <input
              type="date"
              placeholder="Birthday (optional)"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              className="w-full h-12 px-4 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-red-500 transition-colors bg-white font-sans text-zinc-600"
            />
          </div>
        </div>

        {/* Checkbox settings */}
        <div className="space-y-4 pt-2">
          {/* Subscribe */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={subscribeOffers}
              onChange={(e) => setSubscribeOffers(e.target.checked)}
              className="mt-0.5 w-5 h-5 rounded-md border border-zinc-300 text-red-500 focus:ring-red-500 cursor-pointer"
            />
            <span className="text-xs text-zinc-600 leading-normal select-none group-hover:text-zinc-800 transition-colors">
              I want to receive the latest discounts and offers from Papa Veg Pizza.
            </span>
          </label>

          {/* Terms */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="mt-0.5 w-5 h-5 rounded-md border border-zinc-300 text-red-500 focus:ring-red-500 cursor-pointer"
            />
            <span className="text-xs text-zinc-600 leading-normal select-none group-hover:text-zinc-800 transition-colors">
              I have read and agree to Papa Veg Pizza's Terms of Use and Privacy Policy
            </span>
          </label>
        </div>

        {/* Create Account CTA */}
        <motion.button
          whileTap={isFormValid ? { scale: 0.98 } : {}}
          onClick={handleCreateAccount}
          disabled={!isFormValid}
          className={`w-full h-12 font-bold rounded-xl text-sm uppercase tracking-wide transition-all border-0 shadow-md ${
            isFormValid
              ? "bg-[#E53935] text-white cursor-pointer hover:bg-red-700 active:translate-y-0.5 active:shadow-sm"
              : "bg-zinc-100 text-zinc-400 cursor-not-allowed shadow-none"
          }`}
        >
          Create Account
        </motion.button>
      </div>
    </div>
  )
}
