import React, { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import AnimatedPage from "@food/components/user/AnimatedPage"
import Header from "@food/components/user/Header"
import useNotificationInbox from "@food/hooks/useNotificationInbox"

// Initial mock notification data (fallback if localStorage is empty)
const DEFAULT_NOTIFICATIONS = [
  {
    id: "1",
    type: "order",
    title: "Order Confirmed",
    message: "Your order #12345 has been confirmed and is being prepared",
    time: "2 minutes ago",
    timestamp: Date.now() - 120000,
    read: false,
    icon: "CheckCircle2",
    iconColor: "text-green-500"
  },
  {
    id: "2",
    type: "offer",
    title: "Special Offer",
    message: "Get 50% off on your next order above ₹500",
    time: "1 hour ago",
    timestamp: Date.now() - 3600000,
    read: false,
    icon: "Tag",
    iconColor: "text-orange-500"
  }
]

// Mappings from Lucide / mock data names to Google Material Symbols
const getMaterialIcon = (iconName) => {
  switch (iconName) {
    case "CheckCircle2":
    case "check_circle":
      return "check_circle"
    case "Tag":
    case "local_offer":
      return "local_offer"
    case "Gift":
    case "redeem":
      return "redeem"
    case "AlertCircle":
    case "warning":
    case "error":
      return "warning"
    case "Bell":
    case "notifications":
      return "notifications"
    default:
      return "notifications"
  }
}

export default function Notifications() {
  const navigate = useNavigate()

  // Theme state: defaults to dark mode like Home.jsx
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("appTheme")
    return savedTheme ? savedTheme === "dark" : true
  })

  const [notificationsList, setNotificationsList] = useState(() => {
    const saved = localStorage.getItem('food_user_notifications')
    return saved ? JSON.parse(saved) : DEFAULT_NOTIFICATIONS
  })

  const {
    items: broadcastNotifications,
    unreadCount: broadcastUnreadCount,
    markAsRead: markBroadcastAsRead,
    dismiss: dismissBroadcastNotification,
    dismissAll: dismissAllBroadcastNotifications,
  } = useNotificationInbox("user", { limit: 100 })

  // Load Google Fonts and Material Icons dynamically
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
  }

  // Persistence: Save to localStorage whenever list updates
  useEffect(() => {
    localStorage.setItem('food_user_notifications', JSON.stringify(notificationsList))
    window.dispatchEvent(new CustomEvent('notificationsUpdated', { detail: { count: notificationsList.filter(n => !n.read).length } }))
  }, [notificationsList])

  // Real-time: Listen for status updates
  useEffect(() => {
    const handleOrderUpdate = (event) => {
      const { orderId, status, message, title } = event.detail
      const isCancelled = String(status || "").toLowerCase().includes('cancel')
      
      const newNotification = {
        id: `order-${Date.now()}`,
        type: isCancelled ? "alert" : "order",
        title: title || `Order #${orderId} ${status}`,
        message: message || `Your order status is now ${status}`,
        time: "Just now",
        timestamp: Date.now(),
        read: false,
        icon: isCancelled ? "AlertCircle" : "CheckCircle2",
        iconColor: "text-red-500"
      }
      setNotificationsList(prev => [newNotification, ...prev])
    }

    const handleDeliveryOtp = (event) => {
      const { orderId, otp, message } = event.detail
      const newNotification = {
        id: `otp-${Date.now()}`,
        type: "alert",
        title: "Delivery OTP Received",
        message: message || `Your OTP for order #${orderId} is ${otp}`,
        time: "Just now",
        timestamp: Date.now(),
        read: false,
        icon: "AlertCircle",
        iconColor: "text-red-555"
      }
      setNotificationsList(prev => [newNotification, ...prev])
    }

    window.addEventListener('orderStatusNotification', handleOrderUpdate)
    window.addEventListener('deliveryDropOtp', handleDeliveryOtp)

    return () => {
      window.removeEventListener('orderStatusNotification', handleOrderUpdate)
      window.removeEventListener('deliveryDropOtp', handleDeliveryOtp)
    }
  }, [])
  
  const mergedNotifications = useMemo(() => {
    const localItems = (notificationsList || []).map((item) => ({
      ...item,
      source: "local",
    }))
    const broadcastItems = (broadcastNotifications || []).map((item) => ({
      ...item,
      source: "broadcast",
      type: "broadcast",
      time: item.createdAt
        ? new Date(item.createdAt).toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })
        : "Just now",
      timestamp: item.createdAt || Date.now(),
      icon: "Bell",
      iconColor: "text-blue-500",
    }))

    return [...broadcastItems, ...localItems].sort(
      (a, b) =>
        new Date(b.timestamp || b.createdAt || 0).getTime() -
        new Date(a.timestamp || a.createdAt || 0).getTime()
    )
  }, [broadcastNotifications, notificationsList])

  const unreadCount = notificationsList.filter(n => !n.read).length + broadcastUnreadCount

  const handleMarkAsRead = (id, source = "local") => {
    if (source === "broadcast") {
      markBroadcastAsRead(id)
      return
    }
    setNotificationsList(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }

  const handleClearAll = () => {
    setNotificationsList([])
    dismissAllBroadcastNotifications()
  }

  const handleDeleteOne = (id, source = "local") => {
    if (source === "broadcast") {
      dismissBroadcastNotification(id)
      return
    }
    setNotificationsList((prev) => prev.filter((notification) => notification.id !== id))
  }

  const getNotificationColors = (type) => {
    switch (type) {
      case "order":
        return {
          bg: "bg-green-500/10 dark:bg-green-500/15",
          text: "text-green-600 dark:text-green-400",
          icon: "check_circle"
        }
      case "offer":
      case "promotion":
        return {
          bg: "bg-orange-500/10 dark:bg-orange-500/15",
          text: "text-orange-600 dark:text-orange-400",
          icon: "local_offer"
        }
      case "alert":
        return {
          bg: "bg-red-500/10 dark:bg-red-500/15",
          text: "text-red-600 dark:text-red-400",
          icon: "warning"
        }
      case "broadcast":
        return {
          bg: "bg-blue-500/10 dark:bg-blue-500/15",
          text: "text-blue-600 dark:text-blue-400",
          icon: "notifications"
        }
      default:
        return {
          bg: "bg-primary/10 dark:bg-primary/15",
          text: "text-primary",
          icon: "notifications"
        }
    }
  }

  return (
    <AnimatedPage>
      <div
        className={`font-body-md text-body-md min-h-screen pb-32 overflow-x-hidden flex flex-col transition-colors duration-300 ${isDarkMode ? "dark" : ""}`}
        style={{
          backgroundColor: isDarkMode ? "#111111" : "#fbf9f8",
          color: isDarkMode ? "#e5e2e1" : "#1c1b1b",
        }}
      >
        {/* Dynamic CSS Styling Injector */}
        <style dangerouslySetInnerHTML={{
          __html: `
          .glass-card {
            background: ${isDarkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.9)"} !important;
            backdrop-filter: blur(20px) !important;
            border: 1px solid ${isDarkMode ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.06)"} !important;
          }
          .font-headline-lg-mobile {
            font-family: 'Plus Jakarta Sans', sans-serif !important;
          }
          .font-body-md {
            font-family: 'Inter', sans-serif !important;
          }
          .text-primary {
            color: #E53935 !important;
          }
          .bg-primary {
            background-color: #E53935 !important;
          }
          .border-l-primary {
            border-left: 4px solid #E53935 !important;
          }
          .text-on-primary {
            color: #ffffff !important;
          }
          .px-margin-mobile {
            padding-left: 20px !important;
            padding-right: 20px !important;
          }
          .gap-sm {
            gap: 12px !important;
          }
        ` }} />

        {/* Global Header */}
        <Header 
          title="Notifications" 
          showBack={true} 
          isDarkMode={isDarkMode} 
          showThemeToggle={false} 
          showCart={true} 
        />

        {/* Main Notifications Layout Container */}
        <main className="mt-20 px-margin-mobile flex-1 flex flex-col gap-sm max-w-md mx-auto w-full">
          {mergedNotifications.length > 0 && (
            /* Sub-header Controls */
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#e4beb9] opacity-75">
                  {unreadCount > 0 ? `${unreadCount} Unread` : 'All read'}
                </span>
              </div>
              <button
                onClick={handleClearAll}
                className="flex items-center gap-1.5 text-xs font-bold text-primary hover:opacity-85 active:scale-95 transition-all bg-transparent border-0 cursor-pointer outline-none"
              >
                <span className="material-symbols-outlined text-[16px] select-none">delete</span>
                Clear All
              </button>
            </div>
          )}

          {/* Notifications List */}
          <div className="flex flex-col gap-sm w-full">
            {mergedNotifications.map((notification) => {
              const config = getNotificationColors(notification.type)
              const iconName = getMaterialIcon(notification.icon) || config.icon
              return (
                <div
                  key={notification.id}
                  onClick={() => handleMarkAsRead(notification.id, notification.source)}
                  className={`glass-card rounded-2xl p-4 flex items-start gap-3.5 cursor-pointer transition-all duration-300 active:scale-[0.99] relative ${
                    !notification.read 
                      ? "border-l-primary shadow-md bg-white/[0.08] dark:bg-white/[0.08]" 
                      : "opacity-75 hover:opacity-100"
                  }`}
                >
                  {/* Unread Dot indicator */}
                  {!notification.read && (
                    <span className="absolute top-4 right-4 w-2 h-2 bg-primary rounded-full" />
                  )}

                  {/* Icon Badge */}
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${config.bg} ${config.text}`}>
                    <span className="material-symbols-outlined text-[22px] select-none">
                      {iconName}
                    </span>
                  </div>

                  {/* Description Details */}
                  <div className="flex-1 min-w-0 pr-4">
                    <h3 className={`font-bold text-sm mb-1 ${!notification.read ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300"}`}>
                      {notification.title}
                    </h3>
                    <p className="text-xs opacity-75 leading-relaxed mb-2 text-slate-600 dark:text-[#e4beb9] line-clamp-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-[#e4beb9]/60">
                      <span className="material-symbols-outlined text-[12px] select-none">schedule</span>
                      <span>{notification.time}</span>
                    </div>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteOne(notification.id, notification.source)
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-white/10 transition-colors bg-transparent border-0 cursor-pointer absolute bottom-2 right-2 outline-none"
                    title="Delete notification"
                  >
                    <span className="material-symbols-outlined text-[18px] select-none">close</span>
                  </button>
                </div>
              )
            })}
          </div>

          {/* Empty State Screen */}
          {mergedNotifications.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4 my-auto">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <span className="material-symbols-outlined text-primary text-[44px] select-none">
                  notifications_off
                </span>
              </div>
              <h3 className="font-headline-lg-mobile text-lg font-black text-slate-900 dark:text-white">
                No Notifications
              </h3>
              <p className="text-xs opacity-65 leading-relaxed text-slate-600 dark:text-[#e4beb9] max-w-xs">
                You are all caught up! There are no new announcements or order status updates.
              </p>
            </div>
          )}
        </main>
      </div>
    </AnimatedPage>
  )
}
