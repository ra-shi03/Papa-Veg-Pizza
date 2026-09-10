import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import Header from "@food/components/user/Header"
import AccountWelcomeCard from "@food/pages/user/profile/account/AccountWelcomeCard"
import AccountMenuList from "@food/pages/user/profile/account/AccountMenuList"

export default function AccountSettings() {
  const navigate = useNavigate()

  // Theme state: defaults to dark mode like Home.jsx
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("appTheme")
    return savedTheme ? savedTheme === "dark" : true
  })

  // Loading skeleton support state
  const [isLoading, setIsLoading] = useState(true)
  const [toast, setToast] = useState({ visible: false, message: "" })
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const triggerToast = (message) => {
    setToast({ visible: true, message })
    setTimeout(() => {
      setToast({ visible: false, message: "" })
    }, 2500)
  }

  // Load Google Fonts and Material Icons dynamically (similar to Home.jsx)
  useEffect(() => {
    const linkFonts = document.createElement("link")
    linkFonts.href = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Inter:wght@400;600;700&display=swap"
    linkFonts.rel = "stylesheet"
    document.head.appendChild(linkFonts)

    const linkIcons = document.createElement("link")
    linkIcons.href = "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
    linkIcons.rel = "stylesheet"
    document.head.appendChild(linkIcons)

    // Check if user is logged in with completed profile
    try {
      const isAuthenticated = localStorage.getItem("user_authenticated") === "true"
      const stored = localStorage.getItem("currentUser") || localStorage.getItem("user_user")
      if (isAuthenticated && stored) {
        const userObj = JSON.parse(stored)
        if (userObj.profileCompleted) {
          setIsLoggedIn(true)
        }
      }
    } catch (e) {
      console.error(e)
    }

    // Simulate skeleton loading
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 600)

    return () => {
      document.head.removeChild(linkFonts)
      document.head.removeChild(linkIcons)
      clearTimeout(timer)
    }
  }, [])

  // Sync theme with localStorage and documentElement class (so it affects tailwind & global parts)
  useEffect(() => {
    const root = document.documentElement
    if (isDarkMode) {
      root.classList.add("dark")
      localStorage.setItem("appTheme", "dark")
    } else {
      root.classList.remove("dark")
      localStorage.setItem("appTheme", "light")
    }
  }, [isDarkMode])

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
    triggerToast(isDarkMode ? "Switched to Light mode" : "Switched to Dark mode")
  }

  return (
    <div
      className={`font-body-md text-body-md min-h-screen pb-32 overflow-x-hidden flex flex-col transition-colors duration-300 ${isDarkMode ? "dark" : ""
        }`}
      style={{
        backgroundColor: isDarkMode ? "#111111" : "#fbf9f8",
        color: isDarkMode ? "#e5e2e1" : "#1c1b1b",
      }}
    >
      {/* Dynamic CSS Styling Injector to guarantee exact alignment */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .glass-card {
          background: ${isDarkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.9)"} !important;
          backdrop-filter: blur(20px) !important;
          border: 1px solid ${isDarkMode ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.06)"} !important;
        }
        .hide-scrollbar::-webkit-scrollbar { display: none !important; }
        .hide-scrollbar { -ms-overflow-style: none !important; scrollbar-width: none !important; }
        
        /* Font Families */
        .font-headline-lg-mobile, .font-headline-lg, .font-display-lg {
          font-family: 'Plus Jakarta Sans', sans-serif !important;
        }
        .font-body-md, .font-label-sm, .font-price-xl {
          font-family: 'Inter', sans-serif !important;
        }
        
        /* Typography */
        .text-headline-lg-mobile {
          font-size: 28px !important;
          line-height: 34px !important;
          font-weight: 700 !important;
        }
        .text-body-md {
          font-size: 16px !important;
          line-height: 24px !important;
          font-weight: 400 !important;
        }
        .text-label-sm {
          font-size: 12px !important;
          line-height: 16px !important;
          letter-spacing: 0.05em !important;
          font-weight: 600 !important;
        }
        
        /* Layout spacings */
        .px-margin-mobile {
          padding-left: 20px !important;
          padding-right: 20px !important;
        }
        .p-margin-mobile {
          padding: 20px !important;
        }
        .p-md {
          padding: 16px !important;
        }
        .gap-sm {
          gap: 12px !important;
        }
        .gap-xs {
          gap: 8px !important;
        }
        .mb-md {
          margin-bottom: 16px !important;
        }
        .bg-surface\/80 {
          background-color: ${isDarkMode ? "rgba(19, 19, 19, 0.8)" : "rgba(255, 255, 255, 0.8)"} !important;
        }
        .bg-surface {
          background-color: ${isDarkMode ? "#131313" : "#ffffff"} !important;
        }
        .text-primary {
          color: #E53935 !important;
        }
        .bg-primary {
          background-color: #E53935 !important;
        }
        .text-on-primary {
          color: #ffffff !important;
        }
        .text-on-surface-variant {
          color: ${isDarkMode ? "#e4beb9" : "#6b7280"} !important;
        }
      ` }} />

      {/* Custom Toast Alert */}
      {toast.visible && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-55 bg-[#E53935] text-white px-6 py-3 rounded-full shadow-2xl glass-card font-label-sm text-xs border border-white/20 animate-bounce">
          {toast.message}
        </div>
      )}

      {/* Header component */}
      <Header showBack={false} isDarkMode={isDarkMode} showThemeToggle={false} showLogo={true} />

      {/* Main Account settings layout container */}
      <main className="mt-20 px-margin-mobile flex-1 flex flex-col gap-sm max-w-md mx-auto w-full">
        {isLoading ? (
          /* Loading Skeletons */
          <div className="space-y-4 w-full animate-pulse">
            <div className="h-44 bg-white/10 dark:bg-white/5 rounded-2xl w-full" />
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-14 bg-white/10 dark:bg-white/5 rounded-xl w-full" />
              ))}
            </div>
          </div>
        ) : (
          /* Page content when loaded */
          <div className="flex flex-col gap-sm w-full">
            {/* Welcome card */}
            <AccountWelcomeCard 
              isLoggedIn={isLoggedIn} 
              onSignIn={() => navigate("/user/auth/login", { state: { from: "/account" } })} 
            />

            {/* Menu List of cards */}
            <AccountMenuList isDarkMode={isDarkMode} onToggleTheme={toggleTheme} />
          </div>
        )}
      </main>

      {/* BottomNavBar */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-[360px] z-50 rounded-full bg-[#FAF9F6]/90 dark:bg-zinc-950/95 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-[0_16px_36px_rgba(0,0,0,0.15)] flex justify-around items-center h-[68px] px-2 m-0">
        <button
          onClick={() => {
            navigate("/user")
            triggerToast("Opening Home")
          }}
          className="flex flex-col items-center justify-center transition-all duration-300 active:scale-95 cursor-pointer bg-transparent border-0 outline-none group"
        >
          <div className="w-14 h-8 rounded-full flex items-center justify-center mb-0.5 transition-all duration-300 bg-transparent text-zinc-500 dark:text-zinc-400 group-hover:bg-black/5 dark:group-hover:bg-white/5">
            <span className="material-symbols-outlined text-[22px]">home</span>
          </div>
          <span className="text-[10px] font-semibold tracking-wide text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-800 dark:group-hover:text-zinc-200">Home</span>
        </button>
        <button
          onClick={() => {
            navigate("/user/menu")
            triggerToast("Opening Menu")
          }}
          className="flex flex-col items-center justify-center transition-all duration-300 active:scale-95 cursor-pointer bg-transparent border-0 outline-none group"
        >
          <div className="w-14 h-8 rounded-full flex items-center justify-center mb-0.5 transition-all duration-300 bg-transparent text-zinc-500 dark:text-zinc-400 group-hover:bg-black/5 dark:group-hover:bg-white/5">
            <span className="material-symbols-outlined text-[22px]">restaurant_menu</span>
          </div>
          <span className="text-[10px] font-semibold tracking-wide text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-800 dark:group-hover:text-zinc-200">Menu</span>
        </button>
        <button
          onClick={() => {
            triggerToast("You are already on Account settings")
          }}
          className="flex flex-col items-center justify-center transition-all duration-300 active:scale-95 cursor-pointer bg-transparent border-0 outline-none group"
        >
          <div className="w-14 h-8 rounded-full flex items-center justify-center mb-0.5 transition-all duration-300 bg-[#E53935]/10 text-[#E53935] dark:bg-[#E53935]/20">
            <span className="material-symbols-outlined text-[22px] fill" style={{ fontVariationSettings: " 'FILL' 1 " }}>person</span>
          </div>
          <span className="text-[10px] font-bold tracking-wide text-[#E53935]">Account</span>
        </button>
      </nav>
    </div>
  )
}
