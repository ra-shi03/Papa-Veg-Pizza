import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useProfile } from "@food/context/ProfileContext"
import { userAPI, authAPI } from "@food/api"
import { clearModuleAuth } from "@food/utils/auth"
import { toast } from "sonner"
import AnimatedPage from "@food/components/user/AnimatedPage"
import DeleteAccountModal from "./DeleteAccountModal"

export default function EditProfile() {
  const navigate = useNavigate()
  const { userProfile, updateUserProfile } = useProfile()

  const [isDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("appTheme")
    return savedTheme ? savedTheme === "dark" : true
  })

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Load from localStorage or use context
  const storedUser = JSON.parse(localStorage.getItem("currentUser") || localStorage.getItem("user_user") || "{}")
  const initialName = userProfile?.name || storedUser?.name || ""
  const initialPhone = userProfile?.phone || storedUser?.phone || ""
  const initialEmail = userProfile?.email || storedUser?.email || ""
  const initialGender = userProfile?.gender || storedUser?.gender || "Rather not say"
  const initialBirthday = userProfile?.birthday || userProfile?.dateOfBirth || storedUser?.birthday || storedUser?.dateOfBirth || ""
  const initialSubscribe = userProfile?.subscribeOffers !== undefined ? userProfile?.subscribeOffers : (storedUser?.subscribeOffers || false)

  // Split name
  const nameParts = initialName.trim().split(/\s+/)
  const [firstName, setFirstName] = useState(nameParts[0] || "")
  const [lastName, setLastName] = useState(nameParts.slice(1).join(" ") || "")
  
  const [email, setEmail] = useState(initialEmail)
  const [phone, setPhone] = useState(() => {
    const cleaned = String(initialPhone).replace(/\D/g, "")
    return cleaned.slice(-10)
  })
  const [gender, setGender] = useState(initialGender)
  const [birthday, setBirthday] = useState(initialBirthday)
  const [subscribeOffers, setSubscribeOffers] = useState(initialSubscribe)

  const handleUpdate = () => {
    try {
      const combinedName = `${firstName.trim()} ${lastName.trim()}`.trim()
      if (!combinedName) {
        toast.error("Name is required.")
        return
      }

      const updatedUser = {
        ...storedUser,
        name: combinedName,
        email: email.trim(),
        gender: gender,
        birthday: birthday,
        dateOfBirth: birthday,
        subscribeOffers: subscribeOffers,
        profileCompleted: true
      }

      // Save back to localStorage
      localStorage.setItem("currentUser", JSON.stringify(updatedUser))
      localStorage.setItem("user_user", JSON.stringify(updatedUser))
      localStorage.setItem("userProfile", JSON.stringify(updatedUser))
      localStorage.setItem("appzeto_user_profile", JSON.stringify(updatedUser))

      // Save to completed profiles list
      const completedProfiles = JSON.parse(localStorage.getItem("completed_profiles") || "{}")
      if (updatedUser.phone) {
        completedProfiles[updatedUser.phone] = updatedUser
      }
      localStorage.setItem("completed_profiles", JSON.stringify(completedProfiles))

      // Save to global users array
      const users = JSON.parse(localStorage.getItem("users")) || []
      const index = users.findIndex(u => {
        const cleanU = String(u.phone || u.mobile || "").replace(/\D/g, "").slice(-10)
        const cleanPhone = String(updatedUser.phone || updatedUser.mobile || "").replace(/\D/g, "").slice(-10)
        return cleanU === cleanPhone
      })
      if (index > -1) {
        users[index] = { ...users[index], ...updatedUser }
      } else {
        users.push(updatedUser)
      }
      localStorage.setItem("users", JSON.stringify(users))

      // Update React context state
      updateUserProfile(updatedUser)

      // Dispatch event to refresh profile from API/context
      window.dispatchEvent(new Event("userAuthChanged"))

      toast.success("Profile updated successfully")
      navigate("/user/account/profile-details")
    } catch (e) {
      console.error(e)
      toast.error("Failed to update profile.")
    }
  }

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to log out?")) {
      try {
        await authAPI.logout()
      } catch (err) {
        console.error("API logout failed, clearing local session anyway", err)
      }
      
      // Clear credentials
      clearModuleAuth("user")
      localStorage.removeItem("accessToken")
      localStorage.removeItem("user_authenticated")
      localStorage.removeItem("currentUser")
      localStorage.removeItem("user_user")
      localStorage.removeItem("user")
      localStorage.removeItem("cart")
      
      const USER_SESSION_PREFERENCE_KEYS = ["userVegMode", "userVegModeOption", "food-under-250-filters"]
      USER_SESSION_PREFERENCE_KEYS.forEach((key) => localStorage.removeItem(key))
      window.dispatchEvent(new Event("userAuthChanged"))
      navigate("/user/auth/login", { replace: true })
    }
  }

  const handleDeleteAccount = () => {
    setIsDeleteModalOpen(true)
  }

  const confirmDeleteAccount = async () => {
    try {
      setIsDeleting(true)
      await userAPI.deleteAccount()
      toast.success("Account deleted successfully")
      
      // Clear all local data
      clearModuleAuth("user")
      localStorage.removeItem("accessToken")
      localStorage.removeItem("user_authenticated")
      localStorage.removeItem("currentUser")
      localStorage.removeItem("user_user")
      localStorage.removeItem("user")
      localStorage.removeItem("cart")
      
      const USER_SESSION_PREFERENCE_KEYS = ["userVegMode", "userVegModeOption", "food-under-250-filters"]
      USER_SESSION_PREFERENCE_KEYS.forEach((key) => localStorage.removeItem(key))
      window.dispatchEvent(new Event("userAuthChanged"))
      navigate("/user/auth/login", { replace: true })
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete account. Please try again.")
    } finally {
      setIsDeleting(false)
      setIsDeleteModalOpen(false)
    }
  }

  return (
    <AnimatedPage className={`min-h-screen pb-32 flex flex-col transition-colors duration-300 ${isDarkMode ? "dark bg-[#111111]" : "bg-[#ffffff]"}`}>
      
      {/* Header */}
      <header className={`fixed top-0 left-0 w-full z-50 h-16 flex items-center px-4 justify-between border-b ${
        isDarkMode ? "bg-[#111111] border-white/10 text-white" : "bg-[#ffffff] border-zinc-200 text-zinc-950"
      }`}>
        <button
          onClick={() => navigate(-1)}
          className={`flex items-center justify-center p-2 rounded-full cursor-pointer transition-all active:scale-95 bg-transparent border-0 outline-none ${
            isDarkMode ? "text-white hover:bg-white/10" : "text-zinc-950 hover:bg-zinc-100"
          }`}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        
        <h1 className="text-lg font-bold text-center flex-1 font-headline-lg-mobile pl-6">
          My Profile
        </h1>

        <button
          onClick={handleUpdate}
          className="text-[#E53935] hover:text-red-700 font-bold text-sm px-3 py-1.5 rounded-lg active:scale-95 cursor-pointer bg-transparent border-0 outline-none transition-all font-sans"
        >
          Save
        </button>
      </header>

      {/* Content Form */}
      <main className="mt-20 px-5 flex-1 flex flex-col max-w-md mx-auto w-full select-none text-left gap-6">
        
        <div className="space-y-4">
          <h2 className={`text-xl font-extrabold font-headline-lg-mobile ${
            isDarkMode ? "text-white" : "text-zinc-900"
          }`}>
            My Profile
          </h2>

          {/* Name fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">First name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={`h-12 px-4 border rounded-xl text-sm focus:outline-none focus:border-red-500 transition-colors font-sans ${
                  isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-white border-zinc-200 text-zinc-900"
                }`}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Last name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={`h-12 px-4 border rounded-xl text-sm focus:outline-none focus:border-red-500 transition-colors font-sans ${
                  isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-white border-zinc-200 text-zinc-900"
                }`}
              />
            </div>
          </div>

          {/* Email address */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`h-12 px-4 border rounded-xl text-sm focus:outline-none focus:border-red-500 transition-colors font-sans ${
                isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-white border-zinc-200 text-zinc-900"
              }`}
            />
          </div>

          {/* Phone field (Read-only) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Phone number</label>
            <div className="flex gap-3">
              {/* Flag container */}
              <div className={`flex items-center gap-2 px-3 border rounded-xl h-12 select-none shrink-0 ${
                isDarkMode ? "bg-white/5 border-white/10" : "bg-zinc-50 border-zinc-200"
              }`}>
                {/* CSS Indian Flag */}
                <div className="flex flex-col gap-[2px] w-5 h-3 border border-zinc-250/60 rounded-[1px] overflow-hidden shrink-0">
                  <div className="bg-[#FF9933] h-1/3 w-full"></div>
                  <div className="bg-white h-1/3 w-full flex items-center justify-center relative">
                    <div className="w-1.5 h-1.5 rounded-full border border-[#000080] flex items-center justify-center">
                      <div className="w-0.5 h-0.5 rounded-full bg-[#000080]"></div>
                    </div>
                  </div>
                  <div className="bg-[#138808] h-1/3 w-full"></div>
                </div>
                <span className={`text-sm font-bold ${isDarkMode ? "text-zinc-300" : "text-zinc-700"}`}>+91</span>
              </div>
              {/* Phone input */}
              <input
                type="text"
                readOnly
                value={phone}
                className={`flex-1 h-12 px-4 border rounded-xl text-sm cursor-not-allowed font-sans font-medium ${
                  isDarkMode ? "bg-white/5 border-white/10 text-zinc-400" : "bg-zinc-50/70 border-zinc-200 text-zinc-550"
                }`}
              />
            </div>
          </div>

          {/* Gender */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Gender (Optional)</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className={`h-12 px-4 border rounded-xl text-sm focus:outline-none focus:border-red-500 transition-colors font-sans ${
                isDarkMode ? "bg-[#1f1f1f] border-white/10 text-white" : "bg-white border-zinc-200 text-zinc-900"
              }`}
            >
              <option value="Rather not say">Rather not say</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Birthday */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Birthday (optional)</label>
            <input
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              className={`h-12 px-4 border rounded-xl text-sm focus:outline-none focus:border-red-500 transition-colors font-sans ${
                isDarkMode ? "bg-[#1f1f1f] border-white/10 text-white" : "bg-white border-zinc-200 text-zinc-900"
              }`}
            />
          </div>

          {/* Subscription Offer Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer group pt-2 select-none">
            <input
              type="checkbox"
              checked={subscribeOffers}
              onChange={(e) => setSubscribeOffers(e.target.checked)}
              className="mt-0.5 w-5 h-5 rounded-md border border-zinc-300 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
            />
            <span className={`text-xs leading-normal font-sans font-medium transition-colors ${
              isDarkMode ? "text-zinc-400 group-hover:text-zinc-200" : "text-zinc-550 group-hover:text-zinc-800"
            }`}>
              I want to receive the latest discounts and offers from Papa Veg Pizza.
            </span>
          </label>
        </div>

        {/* Account management */}
        <div className="space-y-3 pt-4 border-t border-zinc-150 dark:border-white/10">
          <h3 className={`text-sm font-bold uppercase tracking-wider ${
            isDarkMode ? "text-zinc-400" : "text-zinc-600"
          }`}>
            Account management
          </h3>

          {/* Logout button */}
          <div
            onClick={handleLogout}
            className={`flex items-center justify-between p-4 rounded-xl cursor-pointer border transition-colors ${
              isDarkMode 
                ? "bg-white/5 border-white/10 hover:bg-white/[0.08]" 
                : "bg-white border-zinc-200 hover:bg-zinc-50"
            }`}
          >
            <span className={`text-sm font-semibold font-sans ${isDarkMode ? "text-white" : "text-zinc-800"}`}>
              Logout
            </span>
            <ChevronRight className="w-5 h-5 text-[#E53935]" />
          </div>

          {/* Delete Account button */}
          <div
            onClick={handleDeleteAccount}
            className={`flex items-center justify-between p-4 rounded-xl cursor-pointer border transition-colors ${
              isDarkMode 
                ? "bg-white/5 border-white/10 hover:bg-white/[0.08]" 
                : "bg-white border-zinc-200 hover:bg-zinc-50"
            }`}
          >
            <span className={`text-sm font-semibold font-sans ${isDarkMode ? "text-white" : "text-zinc-800"}`}>
              Delete Account
            </span>
            <ChevronRight className="w-5 h-5 text-[#E53935]" />
          </div>
        </div>

      </main>

      <DeleteAccountModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteAccount}
        loading={isDeleting}
        isDarkMode={isDarkMode}
      />

    </AnimatedPage>
  )
}
