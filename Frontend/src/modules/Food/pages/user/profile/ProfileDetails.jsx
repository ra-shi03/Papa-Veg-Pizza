import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useProfile } from "@food/context/ProfileContext"
import AnimatedPage from "@food/components/user/AnimatedPage"

export default function ProfileDetails() {
  const navigate = useNavigate()
  const { userProfile } = useProfile()

  const [isDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("appTheme")
    return savedTheme ? savedTheme === "dark" : true
  })

  // Get user details from profile context or fallback to localStorage
  const storedUser = JSON.parse(localStorage.getItem("currentUser") || localStorage.getItem("user_user") || "{}")
  const displayName = userProfile?.name || storedUser?.name || "User Name"
  const displayPhone = userProfile?.phone || storedUser?.phone || "+91 9300990940"
  const displayEmail = userProfile?.email || storedUser?.email || "rashijaiswal6655@gmail.com"

  return (
    <AnimatedPage className={`min-h-screen pb-32 flex flex-col transition-colors duration-300 ${isDarkMode ? "dark bg-[#111111]" : "bg-[#fbf9f8]"}`}>
      
      {/* Dynamic CSS Styling Injector */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .profile-glass-card {
          background: ${isDarkMode ? "rgba(255, 255, 255, 0.05)" : "#ffffff"} !important;
          backdrop-filter: blur(20px) !important;
          border: 1px solid ${isDarkMode ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.06)"} !important;
        }
        `
      }} />

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
        <h1 className="text-lg font-bold text-center flex-1 pr-10 font-headline-lg-mobile">
          My Profile
        </h1>
      </header>

      {/* Main Container */}
      <main className="mt-20 px-5 flex-1 flex flex-col gap-4 max-w-md mx-auto w-full">
        
        {/* User Details Card */}
        <div
          onClick={() => navigate("/user/account/profile-details/edit")}
          className="profile-glass-card rounded-2xl p-5 flex items-center justify-between cursor-pointer transition-all duration-200 active:scale-[0.98] hover:bg-white/[0.02] dark:hover:bg-white/[0.02] shadow-sm"
        >
          <div className="flex flex-col gap-1.5 text-left">
            <h2 className={`text-base font-bold font-headline-lg-mobile tracking-tight ${
              isDarkMode ? "text-white" : "text-zinc-800"
            }`}>
              {displayName}
            </h2>
            <p className={`text-sm font-medium font-body-md ${
              isDarkMode ? "text-zinc-400" : "text-zinc-500"
            }`}>
              {displayPhone}
            </p>
            <p className={`text-sm font-medium font-body-md ${
              isDarkMode ? "text-zinc-400" : "text-zinc-500"
            }`}>
              {displayEmail}
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-[#00aa5b] shrink-0" />
        </div>

        {/* Preferred Payment Card */}
        <div
          onClick={() => navigate("/user/account/profile-details/payments")}
          className="profile-glass-card rounded-2xl p-5 h-16 flex items-center justify-between cursor-pointer transition-all duration-200 active:scale-[0.98] hover:bg-white/[0.02] dark:hover:bg-white/[0.02] shadow-sm"
        >
          <span className={`text-sm font-semibold font-body-md ${
            isDarkMode ? "text-white" : "text-zinc-800"
          }`}>
            Preferred payment
          </span>
          <ChevronRight className="w-5 h-5 text-[#00aa5b] shrink-0" />
        </div>

      </main>
    </AnimatedPage>
  )
}
