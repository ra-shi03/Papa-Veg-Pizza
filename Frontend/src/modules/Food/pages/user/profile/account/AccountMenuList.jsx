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

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem("user_refreshToken") || "";
      const { authAPI } = await import("@/services/api/authApiModule");
      await authAPI.logout(refreshToken);
    } catch (e) {
      console.error("Logout API failed", e);
    } finally {
      localStorage.removeItem("user_authenticated");
      localStorage.removeItem("currentUser");
      localStorage.removeItem("user_user");
      localStorage.removeItem("user_accessToken");
      localStorage.removeItem("user_refreshToken");
      window.dispatchEvent(new Event("userAuthChanged"));
      navigate("/user/auth/login");
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure you want to permanently delete your account? This action cannot be undone.")) {
      return;
    }
    try {
      const { userAPI } = await import("@/services/api/userApiModule");
      await userAPI.deleteAccount();
      // After successful deletion, clear local storage and navigate to login
      localStorage.removeItem("user_authenticated");
      localStorage.removeItem("currentUser");
      localStorage.removeItem("user_user");
      localStorage.removeItem("user_accessToken");
      localStorage.removeItem("user_refreshToken");
      window.dispatchEvent(new Event("userAuthChanged"));
      navigate("/user/auth/login");
    } catch (e) {
      console.error("Failed to delete account", e);
      alert(e?.response?.data?.message || "Failed to delete account. Please try again.");
    }
  };

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
      
      {isLoggedIn && (
        <div className="mt-4 flex flex-col gap-sm w-full">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full"
          >
            <span className="material-icons-outlined">logout</span>
            <span className="font-medium text-[15px]">Logout</span>
          </button>
          
          <button
            onClick={handleDeleteAccount}
            className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full border border-red-100 dark:border-red-900/30"
          >
            <span className="material-icons-outlined">delete_forever</span>
            <span className="font-medium text-[15px]">Delete Account</span>
          </button>
        </div>
      )}
    </div>
  )
}
