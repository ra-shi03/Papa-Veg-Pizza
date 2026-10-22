import React, { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Loader2, X, Pencil, Phone, Mail, User } from "lucide-react"
import { toast } from "sonner"
import { useProfile } from "@food/context/ProfileContext"
import AnimatedPage from "@food/components/user/AnimatedPage"
import DeleteAccountModal from "./DeleteAccountModal"
import LogoutConfirmationModal from "./LogoutConfirmationModal"
import { userAPI, authAPI } from "@food/api"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const USER_STORAGE_KEYS = ["user_user", "currentUser", "userProfile"]

const apiErrorMessage = (err, fallback) =>
  err?.response?.data?.message || err?.response?.data?.error || fallback

/** Keep cached user objects (sidebar, header, etc.) in sync after an edit. */
const syncStoredUser = (account) => {
  USER_STORAGE_KEYS.forEach((key) => {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) return
      const parsed = JSON.parse(raw) || {}
      localStorage.setItem(
        key,
        JSON.stringify({
          ...parsed,
          name: account.name,
          firstName: account.firstName,
          lastName: account.lastName,
          email: account.email,
          phone: account.phone || parsed.phone,
        }),
      )
    } catch (_) {}
  })
  window.dispatchEvent(new Event("storage"))
}

const clearSession = () => {
  ;[
    "user_authenticated",
    "user_accessToken",
    "user_refreshToken",
    "currentUser",
    "user_user",
    "userProfile",
    "pvp_rewards_enrolled"
  ].forEach(
    (key) => localStorage.removeItem(key),
  )
  window.dispatchEvent(new Event("userAuthChanged"))
  window.dispatchEvent(new Event("storage"))
}

export default function ProfileDetails() {
  const navigate = useNavigate()
  const { updateUserProfile } = useProfile()

  const [isDarkMode] = useState(() => localStorage.getItem("appTheme") === "dark")
  const [account, setAccount] = useState(null)
  const [loading, setLoading] = useState(true)
  const [points, setPoints] = useState(0)

  // Editing states for Name and Email
  const [isEditingName, setIsEditingName] = useState(false)
  const [isEditingEmail, setIsEditingEmail] = useState(false)
  const [nameDraft, setNameDraft] = useState("")
  const [emailDraft, setEmailDraft] = useState("")
  const [saving, setSaving] = useState(false)

  const nameInputRef = useRef(null)
  const emailInputRef = useRef(null)

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const [benefitIndex, setBenefitIndex] = useState(0)
  const LOGIN_BENEFITS = useMemo(() => ["Saved addresses", "Previous orders", "Cheesy Rewards", "Exclusive offers"], [])

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("user_authenticated") === "true" || !!localStorage.getItem("user_accessToken")
  })

  const go = (path, state) => {
    const target =
      window.location.pathname.startsWith("/food") && !path.startsWith("/food") ? `/food${path}` : path
    navigate(target, state ? { state } : undefined)
  }

  // Listen to auth state changes in storage
  useEffect(() => {
    const handleAuthChange = () => {
      const isAuth = localStorage.getItem("user_authenticated") === "true" || !!localStorage.getItem("user_accessToken")
      setIsAuthenticated(isAuth)
      if (!isAuth) {
        setAccount(null)
        setLoading(false)
      }
    }
    window.addEventListener("userAuthChanged", handleAuthChange)
    window.addEventListener("storage", handleAuthChange)
    return () => {
      window.removeEventListener("userAuthChanged", handleAuthChange)
      window.removeEventListener("storage", handleAuthChange)
    }
  }, [])

  // Rotate tagline for unauthenticated card (Matching Image 3)
  useEffect(() => {
    if (isAuthenticated) return
    const interval = setInterval(() => {
      setBenefitIndex((prev) => (prev + 1) % LOGIN_BENEFITS.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [isAuthenticated, LOGIN_BENEFITS.length])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const isAuth = localStorage.getItem("user_authenticated") === "true" || !!localStorage.getItem("user_accessToken")
      if (!isAuth) {
        if (!cancelled) {
          setAccount(null)
          setIsAuthenticated(false)
          setLoading(false)
        }
        return
      }

      try {
        const res = await userAPI.getMyProfile()
        if (!cancelled) {
          const acc = res?.data?.data?.account || null
          setAccount(acc)
          setIsAuthenticated(Boolean(acc))
          setNameDraft(acc?.name || "")
          setEmailDraft(acc?.email || "")
        }
      } catch (err) {
        if (!cancelled) {
          if (err?.response?.status === 401 || err?.response?.status === 403) {
            clearSession()
            setAccount(null)
            setIsAuthenticated(false)
          } else {
            toast.error(apiErrorMessage(err, "Could not load your profile"))
          }
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
      try {
        const rRes = await userAPI.getRewards()
        if (!cancelled) setPoints(Number(rRes?.data?.data?.rewards?.points) || 0)
      } catch (_) {}
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  // Check if anything has been modified or is currently in edit mode
  const isEditing =
    isEditingName ||
    isEditingEmail ||
    (account && (nameDraft !== (account.name || "") || emailDraft !== (account.email || "")))

  const handleSave = async () => {
    if (saving || !account) return

    const trimmedName = nameDraft.trim().replace(/\s+/g, " ")
    const trimmedEmail = emailDraft.trim().toLowerCase()

    if (!trimmedName) {
      toast.error("Please enter your name")
      nameInputRef.current?.focus()
      return
    }

    if (trimmedEmail && !EMAIL_PATTERN.test(trimmedEmail)) {
      toast.error("Please enter a valid email address")
      emailInputRef.current?.focus()
      return
    }

    const currentName = (account.name || "").trim()
    const currentEmail = (account.email || "").trim().toLowerCase()

    // If nothing changed, exit edit mode smoothly
    if (trimmedName === currentName && trimmedEmail === currentEmail) {
      setIsEditingName(false)
      setIsEditingEmail(false)
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: trimmedName,
        email: trimmedEmail || null,
      }

      const res = await userAPI.updateProfile(payload)
      const next = res?.data?.data?.account
      if (next) {
        setAccount(next)
        setNameDraft(next.name || "")
        setEmailDraft(next.email || "")
        syncStoredUser(next)
        updateUserProfile?.({
          name: next.name,
          firstName: next.firstName,
          lastName: next.lastName,
          email: next.email,
        })
      } else {
        const updated = { ...account, name: trimmedName, email: trimmedEmail || null }
        setAccount(updated)
        syncStoredUser(updated)
        updateUserProfile?.({ name: trimmedName, email: trimmedEmail || null })
      }

      setIsEditingName(false)
      setIsEditingEmail(false)
      toast.success("Profile saved successfully")
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not update your profile"))
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await authAPI.logout(localStorage.getItem("user_refreshToken") || "")
    } catch (_) {
      // Local session is cleared regardless.
    } finally {
      setLoggingOut(false)
    }
    clearSession()
    setAccount(null)
    setIsAuthenticated(false)
    setShowLogoutModal(false)
    toast.success("Logged out successfully")
    go("/user")
  }

  const handleDeleteAccount = async () => {
    setDeleting(true)
    try {
      await userAPI.deleteAccount()
      setShowDeleteModal(false)
      clearSession()
      setAccount(null)
      setIsAuthenticated(false)
      toast.success("Your account has been deleted")
      go("/user/auth/login")
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not delete your account. Please try again."))
    } finally {
      setDeleting(false)
    }
  }

  const initial = (account?.name || nameDraft || "").trim().charAt(0).toUpperCase()

  const authenticatedMenuItems = [
    { key: "cards", label: "My Saved Cards", icon: "credit_card", onClick: () => go("/user/account/profile-details/payments") },
    { key: "wallet", label: "Papa Veg Wallet", icon: "account_balance_wallet", badge: `${points} Points`, onClick: () => go("/user/wallet") },
    { key: "addresses", label: "My Addresses", icon: "location_on", onClick: () => go("/user/location/setup", { mode: "my_addresses", from: "/user/account/profile-details" }) },
    { key: "orders", label: "My Orders", icon: "receipt_long", onClick: () => go("/user/orders") },
    { key: "help", label: "Need Help", icon: "support_agent", onClick: () => go("/user/help") },
    { key: "delete", label: "Delete my account", icon: "person_remove", onClick: () => setShowDeleteModal(true) },
    { key: "logout", label: "Logout", icon: "power_settings_new", onClick: () => setShowLogoutModal(true), danger: true },
  ]

  const unauthenticatedMenuItems = [
    { key: "cards", label: "My Saved Cards", icon: "credit_card", onClick: () => go("/user/auth/login", { from: "/user/account/profile-details" }) },
    { key: "wallet", label: "Papa Veg Wallet", icon: "account_balance_wallet", onClick: () => go("/user/auth/login", { from: "/user/account/profile-details" }) },
    { key: "addresses", label: "My Addresses", icon: "location_on", onClick: () => go("/user/auth/login", { from: "/user/account/profile-details" }) },
    { key: "orders", label: "My Orders", icon: "receipt_long", onClick: () => go("/user/auth/login", { from: "/user/account/profile-details" }) },
    { key: "help", label: "Need Help", icon: "support_agent", onClick: () => go("/user/help") },
  ]

  const menuItems = isAuthenticated ? authenticatedMenuItems : unauthenticatedMenuItems

  const cardClass = "bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/70 dark:border-zinc-800 shadow-xs overflow-hidden"

  return (
    <AnimatedPage className={isDarkMode ? "dark" : ""}>
      <div
        className="min-h-screen flex flex-col font-['Poppins',sans-serif] bg-[var(--secondary-off-white,#F8F6F2)] dark:bg-zinc-950"
        style={isDarkMode ? undefined : { backgroundColor: "var(--secondary-off-white, #F8F6F2)" }}
      >
        {/* ── Top Header Matching App's Existing Theme ── */}
        <header className="sticky top-0 z-30 h-14 flex items-center justify-between px-4 bg-[var(--secondary-off-white,#F8F6F2)] dark:bg-zinc-900 border-b border-zinc-200/60 dark:border-zinc-800 select-none">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (isEditing) {
                  // Reset drafts
                  setNameDraft(account?.name || "")
                  setEmailDraft(account?.email || "")
                  setIsEditingName(false)
                  setIsEditingEmail(false)
                }
                navigate(-1)
              }}
              aria-label="Go Back"
              className="p-1 -ml-1 text-zinc-800 dark:text-zinc-200 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer border-0 bg-transparent"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
            </button>
            <h1 className="text-[17px] font-semibold text-zinc-900 dark:text-white tracking-tight m-0">My Profile</h1>
          </div>

          {/* SAVE Button in Header matching App Theme Color */}
          {isEditing && (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-white rounded-lg shadow-sm shadow-red-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-60 flex items-center gap-1.5 border-0"
              style={{ backgroundColor: "var(--primary, #EE3A43)", color: "#ffffff" }}
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  <span>SAVING</span>
                </>
              ) : (
                <span>SAVE</span>
              )}
            </button>
          )}
        </header>

        <main className="flex-1 w-full max-w-md mx-auto px-4 pt-4 pb-10 space-y-4">
          {/* ── Account Details Card Matching App Theme ── */}
          {loading ? (
            <div className={`${cardClass} p-4 space-y-4 animate-pulse`}>
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-4 w-40 rounded bg-zinc-200 dark:bg-zinc-800" />
              </div>
              <div className="h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-800 ml-[54px]" />
              <div className="h-4 w-48 rounded bg-zinc-200 dark:bg-zinc-800 ml-[54px]" />
            </div>
          ) : !isAuthenticated ? (
            /* ── Unauthenticated Profile Login Card (Matching Image 3) ── */
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/70 dark:border-zinc-800 shadow-xs p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-full bg-[#616161] dark:bg-zinc-700 flex items-center justify-center shrink-0 shadow-xs text-white">
                  <User className="w-6 h-6 text-white stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-[15px] font-bold text-zinc-900 dark:text-white leading-tight flex items-center gap-1.5 m-0">
                    <span>Login for</span>
                    <span className="text-zinc-400 text-xs tracking-widest font-mono select-none">●●●●</span>
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 truncate m-0 font-medium">
                    {LOGIN_BENEFITS[benefitIndex]}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => go("/user/auth/login", { from: "/user/account/profile-details" })}
                className="px-5 py-2 rounded-xl bg-[#E53935] hover:bg-[#d92d36] text-white font-bold text-sm tracking-wide shadow-md shadow-red-500/20 active:scale-95 transition-all cursor-pointer border-0 shrink-0"
                style={{ backgroundColor: "var(--accent-red, #EE3A43)" }}
              >
                Login
              </button>
            </div>
          ) : (
            <div className={cardClass}>
              {/* Row 1: Name (Red Theme Tint Row with Avatar + Pencil Icon) */}
              <div className="flex items-center gap-3.5 px-4 py-3.5 bg-red-50/80 dark:bg-red-950/30">
                <div
                  className="w-10 h-10 rounded-full text-white flex items-center justify-center shrink-0 shadow-md shadow-red-500/20 overflow-hidden font-bold text-base"
                  style={{ backgroundColor: "var(--primary, #EE3A43)" }}
                >
                  {account?.profileImage ? (
                    <img src={account.profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : initial ? (
                    <span>{initial}</span>
                  ) : (
                    <span className="material-symbols-outlined text-[20px]">person</span>
                  )}
                </div>

                {isEditingName ? (
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    <input
                      ref={nameInputRef}
                      type="text"
                      value={nameDraft}
                      onChange={(e) => setNameDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSave()
                        if (e.key === "Escape") {
                          setNameDraft(account?.name || "")
                          setIsEditingName(false)
                        }
                      }}
                      placeholder="Enter your name"
                      maxLength={100}
                      disabled={saving}
                      className="flex-1 min-w-0 text-[15px] font-semibold text-zinc-900 dark:text-white bg-transparent outline-none border-b border-[var(--primary,#EE3A43)] pb-0.5"
                    />
                    {nameDraft && (
                      <button
                        type="button"
                        onClick={() => {
                          setNameDraft("")
                          nameInputRef.current?.focus()
                        }}
                        className="w-5 h-5 rounded-full bg-zinc-800 dark:bg-zinc-700 text-white flex items-center justify-center cursor-pointer hover:bg-zinc-700 active:scale-95 transition-all border-0 p-0 shrink-0"
                      >
                        <X className="w-3 h-3 stroke-[2.8]" />
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <p
                      onClick={() => {
                        setIsEditingName(true)
                        setTimeout(() => nameInputRef.current?.focus(), 50)
                      }}
                      className={`flex-1 min-w-0 truncate text-[15px] font-semibold m-0 cursor-pointer ${
                        account?.name ? "text-zinc-900 dark:text-white" : "text-zinc-400 dark:text-zinc-500"
                      }`}
                    >
                      {account?.name || "Add your name"}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingName(true)
                        setTimeout(() => nameInputRef.current?.focus(), 50)
                      }}
                      aria-label="Edit name"
                      className="p-1.5 -mr-1 text-zinc-500 dark:text-zinc-400 hover:text-[var(--primary,#EE3A43)] dark:hover:text-red-400 transition-colors cursor-pointer border-0 bg-transparent shrink-0"
                    >
                      <Pencil className="w-4 h-4 stroke-[2]" />
                    </button>
                  </>
                )}
              </div>

              {/* Row 2: Phone (Login number — non-editable) */}
              <div className="flex items-center gap-3.5 px-4 py-3.5 border-t border-zinc-150/80 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                <div className="w-10 flex justify-center shrink-0">
                  <Phone className="w-5 h-5 text-zinc-600 dark:text-zinc-300 stroke-[1.8]" />
                </div>
                <p className="flex-1 min-w-0 truncate text-[14.5px] font-medium text-zinc-800 dark:text-zinc-200 m-0">
                  {account?.phone || "—"}
                </p>
              </div>

              {/* Row 3: Email (Interactive Email Field with (X) Clear Button matching Screenshot) */}
              <div
                onClick={() => {
                  if (!isEditingEmail) {
                    setIsEditingEmail(true)
                    setTimeout(() => emailInputRef.current?.focus(), 50)
                  }
                }}
                className="flex items-center gap-3.5 px-4 py-3.5 border-t border-zinc-150/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 cursor-text"
              >
                <div className="w-10 flex justify-center shrink-0">
                  <Mail className="w-5 h-5 text-zinc-600 dark:text-zinc-300 stroke-[1.8]" />
                </div>

                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <input
                    ref={emailInputRef}
                    type="email"
                    value={emailDraft}
                    onFocus={() => setIsEditingEmail(true)}
                    onChange={(e) => {
                      setEmailDraft(e.target.value)
                      setIsEditingEmail(true)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSave()
                      if (e.key === "Escape") {
                        setEmailDraft(account?.email || "")
                        setIsEditingEmail(false)
                      }
                    }}
                    placeholder="Please add your Email"
                    maxLength={200}
                    disabled={saving}
                    className="flex-1 min-w-0 text-[14.5px] text-zinc-850 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 bg-transparent outline-none border-0 p-0 font-normal"
                  />

                  {/* Clear Button (X) in a Dark Circle Matching Reference Screenshot */}
                  {isEditingEmail && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEmailDraft("")
                        emailInputRef.current?.focus()
                      }}
                      aria-label="Clear email"
                      className="w-6 h-6 rounded-full bg-zinc-800 dark:bg-zinc-700 text-white flex items-center justify-center cursor-pointer hover:bg-zinc-700 active:scale-95 transition-all border-0 p-0 shrink-0 shadow-xs"
                    >
                      <X className="w-3.5 h-3.5 stroke-[2.8]" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Account Menu Card ── */}
          <div className={`${cardClass} py-1.5`}>
            {menuItems.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={item.onClick}
                className="w-full flex items-center gap-3.5 px-4 py-3.5 text-left hover:bg-red-50/50 dark:hover:bg-zinc-800/50 active:bg-red-100/40 transition-colors cursor-pointer border-0 bg-transparent"
              >
                <div className="w-10 flex justify-center shrink-0">
                  <span
                    className={`material-symbols-outlined text-[22px] ${
                      item.danger ? "text-[#E53935]" : "text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    {item.icon}
                  </span>
                </div>
                <span
                  className={`text-sm font-medium ${
                    item.danger ? "text-[#E53935] font-semibold" : "text-zinc-800 dark:text-zinc-200"
                  }`}
                >
                  {item.label}
                </span>
                {item.badge && (
                  <span className="ml-1 px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/40 text-[#E53935] text-xs font-bold whitespace-nowrap">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </main>
      </div>

      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => !deleting && setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
        loading={deleting}
        isDarkMode={isDarkMode}
      />

      <LogoutConfirmationModal
        isOpen={showLogoutModal}
        onClose={() => !loggingOut && setShowLogoutModal(false)}
        onConfirm={handleLogout}
        loading={loggingOut}
        isDarkMode={isDarkMode}
      />
    </AnimatedPage>
  )
}
