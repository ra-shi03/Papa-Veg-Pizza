import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import Header from "@food/components/user/Header"

export default function TrackOrder() {
  const navigate = useNavigate()

  // Theme state: defaults to dark mode like Home.jsx
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("appTheme")
    return savedTheme ? savedTheme === "dark" : true
  })

  // Toast state
  const [toast, setToast] = useState({ visible: false, message: "" })

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

    return () => {
      document.head.removeChild(linkFonts)
      document.head.removeChild(linkIcons)
    }
  }, [])

  // Sync theme with localStorage and documentElement class
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
      {/* Dynamic CSS Styling Injector */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .font-headline-lg-mobile {
          font-family: 'Plus Jakarta Sans', sans-serif !important;
        }
        .font-body-md {
          font-family: 'Inter', sans-serif !important;
        }
        .text-headline-lg-mobile {
          font-size: 28px !important;
          line-height: 34px !important;
          font-weight: 700 !important;
        }
        .px-margin-mobile {
          padding-left: 20px !important;
          padding-right: 20px !important;
        }
        .bg-surface\\/80 {
          background-color: ${isDarkMode ? "rgba(19, 19, 19, 0.8)" : "rgba(255, 255, 255, 0.8)"} !important;
        }
        .text-primary {
          color: #E53935 !important;
        }
      ` }} />

      {/* Custom Toast Alert */}
      {toast.visible && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-55 bg-[#E53935] text-white px-6 py-3 rounded-full shadow-2xl font-body-md text-xs border border-white/20 animate-bounce">
          {toast.message}
        </div>
      )}

      {/* Header component */}
      <Header 
        title="Track Order" 
        showBack={true} 
        onBack={() => navigate(-1)} 
        isDarkMode={isDarkMode} 
        showThemeToggle={false} 
        showCart={false} 
      />

      {/* Main Content */}
      <main className="mt-16 px-margin-mobile pt-6 flex flex-col max-w-md mx-auto w-full text-left">
        <h2 className={`text-2xl font-bold font-headline-lg-mobile mb-2 ${isDarkMode ? "text-white" : "text-zinc-900"}`}>
          There is no order tracking currently under way
        </h2>
        <p className={`text-sm mb-12 ${isDarkMode ? "text-zinc-400" : "text-zinc-600"}`}>
          Check back after you've completed an order.
        </p>
        
        <div className="w-full flex justify-center mt-4 mix-blend-multiply dark:mix-blend-normal">
          <img 
            src="/pizza_tomato_couch.png" 
            alt="Pizza and tomato sitting on a couch" 
            className="w-[95%] object-contain"
          />
        </div>
      </main>
    </div>
  )
}
