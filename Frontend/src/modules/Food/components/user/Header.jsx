import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { useLocationStore } from "@food/store/locationStore"
import logoNew from "@/assets/logo1.png"

export default function Header({
  title = "Papa Veg Pizza",
  showBack = false,
  onBack,
  showThemeToggle = true,
  isDarkMode = true,
  onThemeToggle,
  showCart = true,
  showLogo = false
}) {
  const navigate = useNavigate()
  const { locationConfirmed } = useLocationStore()
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    const updateCartCount = () => {
      const storedCart = JSON.parse(localStorage.getItem("userCart") || "{}")
      const count = Object.values(storedCart).reduce((sum, qty) => sum + qty, 0)
      setCartCount(count)
    }

    updateCartCount()
    window.addEventListener("cartUpdated", updateCartCount)
    window.addEventListener("storage", updateCartCount)
    return () => {
      window.removeEventListener("cartUpdated", updateCartCount)
      window.removeEventListener("storage", updateCartCount)
    }
  }, [])

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      navigate(-1)
    }
  }

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-surface/80 backdrop-blur-xl dark:bg-surface/80 border-b border-white/10 shadow-sm h-16 flex items-center justify-between px-margin-mobile transition-colors duration-300">
      {/* Left Section: Back button or empty spacer */}
      {showBack ? (
        <button
          onClick={handleBack}
          className="w-10 h-10 flex items-center justify-center text-primary dark:text-primary hover:opacity-80 transition-opacity active:scale-90 cursor-pointer bg-transparent border-0 outline-none"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
      ) : (
        <div className="w-10"></div>
      )}

      {/* Centered Brand Title / Page Title */}
      {showLogo ? (
        <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex items-center justify-center">
          <img
            src={logoNew}
            alt="Papa Veg Pizza Logo"
            className="h-14 md:h-16 w-auto object-contain transition-transform duration-300 hover:scale-105"
          />
        </div>
      ) : (
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile font-black text-primary dark:text-primary text-center flex-1 truncate px-2">
          {title}
        </h1>
      )}

      {/* Right Section: Theme switcher and/or Cart button */}
      <div className="flex items-center gap-1">
        {showCart && locationConfirmed && (
          <button
            onClick={() => navigate("/user/cart")}
            className="w-10 h-10 flex items-center justify-center text-primary dark:text-primary hover:opacity-85 transition-all active:scale-90 cursor-pointer bg-transparent border-0 outline-none relative"
            title="Cart"
          >
            <span className="material-symbols-outlined text-[24px]">shopping_cart</span>
            {cartCount > 0 && (
              <span className="absolute top-0 right-0 w-4.5 h-4.5 bg-primary text-white rounded-full text-[8.5px] font-bold flex items-center justify-center border border-white dark:border-zinc-900">
                {cartCount}
              </span>
            )}
          </button>
        )}
        {showThemeToggle && onThemeToggle ? (
          <button
            onClick={onThemeToggle}
            className="w-10 h-10 flex items-center justify-center material-symbols-outlined text-primary dark:text-primary hover:opacity-80 transition-opacity active:scale-95 cursor-pointer bg-transparent border-0 outline-none"
          >
            {isDarkMode ? "light_mode" : "dark_mode"}
          </button>
        ) : (
          (!showCart || !locationConfirmed) && <div className="w-10"></div>
        )}
      </div>
    </header>
  )
}
