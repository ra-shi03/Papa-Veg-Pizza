import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import AccountMenuCard from "./AccountMenuCard"

export default function AccountMenuList({ isDarkMode, onToggleTheme }) {
  const navigate = useNavigate()
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
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
  }, [])

  const MENU_ITEMS = [
    {
      title: "Exclusive Offers",
      icon: "local_offer",
      route: "/user/account/coupons",
    },
    ...(isLoggedIn
      ? [
          {
            title: "My Profile",
            icon: "person",
            route: "/user/account/profile-details",
          },
        ]
      : []),
    {
      title: "Track Order",
      icon: "local_shipping",
      route: "/user/account/track-order",
    },
    ...(isLoggedIn
      ? [
          {
            title: "Notification Center",
            icon: "notifications",
            route: "/user/notifications",
          },
        ]
      : []),
    {
      title: "Terms & Conditions",
      icon: "gavel",
      route: "/user/account/terms",
    },
    {
      title: "Privacy Policy",
      icon: "shield",
      route: "/user/account/privacy",
    },
    {
      title: "FAQs",
      icon: "help",
      route: "/user/account/faqs",
    },
    {
      title: "Nutrition Information",
      icon: "restaurant",
      route: "/user/account/nutrition",
    },
    {
      title: `Theme: ${isDarkMode ? "Dark Mode" : "Light Mode"}`,
      icon: isDarkMode ? "dark_mode" : "light_mode",
      isThemeToggle: true,
    },
    {
      title: "Give Feedback",
      icon: "rate_review",
      route: "/user/account/feedback",
    },
    {
      title: "Rate Us",
      icon: "star",
      route: "/rate-us",
    },
  ]

  return (
    <div className="flex flex-col gap-sm w-full">
      {MENU_ITEMS.map((item, index) => (
        <AccountMenuCard
          key={index}
          title={item.title}
          iconName={item.icon}
          onClick={() => {
            if (item.isThemeToggle) {
              onToggleTheme()
            } else {
              const state = item.route === "/user/auth/login" ? { from: "/account" } : undefined
              navigate(item.route, { state })
            }
          }}
        />
      ))}
    </div>
  )
}
