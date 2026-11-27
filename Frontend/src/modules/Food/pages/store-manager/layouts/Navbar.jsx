import { authKey } from "@/shared/utils/authNamespace";
import React, { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { User, ClipboardList, Flame, Package, Users, Sun, Moon } from "lucide-react"
import PanelNavbar, { searchMenuPages } from "@food/components/PanelNavbar"
import StoreOpenToggle from "./StoreOpenToggle"
import { storeOperationsSidebarMenu } from "./storeOperationsSidebarMenu"
import { useSystemTheme } from "@/shared/utils/themeSync"
import { adminAPI } from "@food/api"
import apiClient from "@/services/api/axios"

// Store manager top bar (Jharkhand Rasoi admin header): maintenance status, search over the pages this role can
// open, the store's low-stock alerts, the store open / closed switch, and the profile menu.

const SO = "/store-operations"
const isManager = (role) => !role || ["store_manager", "store-manager", "STORE_MANAGER"].includes(role)

export default function Navbar({ onToggleSidebar, role }) {
  const navigate = useNavigate()
  const { themeMode } = useSystemTheme()
  const [userData, setUserData] = useState({ name: "", email: "" })
  const [storeName, setStoreName] = useState("")

  useEffect(() => {
    // Seed from the cached sign-in, then refresh from /auth/me
    try {
      const parsed = JSON.parse(localStorage.getItem(authKey("admin", "user")) || "null")
      if (parsed) {
        setUserData({ name: parsed.fullName || parsed.name || "Store Manager", email: parsed.email || "" })
        setStoreName(parsed.storeName || parsed.store?.name || "")
      }
    } catch (_) {}
    adminAPI.getAdminProfile().then((res) => {
      const user = res?.data?.data?.user ?? res?.data?.user ?? res?.data?.data?.admin ?? res?.data?.admin
      if (!user) return
      setUserData({ name: user.name || user.fullName || "Store Manager", email: user.email || "" })
      const sName = user.storeName || user.storeDetails?.name || user.store?.name
      if (sName) setStoreName(sName)
    }).catch(() => {})
  }, [])

  // The pages this role can open (same filter as the sidebar)
  const rolePages = useMemo(
    () =>
      storeOperationsSidebarMenu
        .filter((entry) => entry.allowedRoles.includes(role))
        .map((entry) => (entry.type === "section" ? { ...entry, items: entry.items.filter((i) => i.allowedRoles.includes(role)) } : entry)),
    [role]
  )

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem(authKey("admin", "refreshToken"))
      if (refreshToken) await adminAPI.logout(refreshToken)
    } catch (_) {
      // signing out locally even if the server call fails
    } finally {
      localStorage.removeItem(authKey("admin", "accessToken"))
      localStorage.removeItem(authKey("admin", "refreshToken"))
      localStorage.removeItem(authKey("admin", "authenticated"))
      localStorage.removeItem(authKey("admin", "user"))
      localStorage.removeItem("admin_role")
      navigate("/store-operation/login", { replace: true })
    }
  }

  const toggleTheme = () => {
    const next = themeMode === "dark" ? "light" : "dark"
    localStorage.setItem("sa_themeMode", next)
    window.dispatchEvent(new Event("systemThemeChanged"))
  }

  return (
    <PanelNavbar
      onToggleSidebar={onToggleSidebar}
      homePath={`${SO}/dashboard`}
      title={storeName || undefined}
      recentKey="store_recent_searches"
      search={async (q) => searchMenuPages(rolePages, q)}
      quickActions={[
        { icon: ClipboardList, label: "Incoming Orders", path: `${SO}/orders/incoming` },
        { icon: Flame, label: "Kitchen Queue", path: `${SO}/kitchen/queue` },
        { icon: Package, label: "Stock", path: `${SO}/inventory/stock` },
        { icon: Users, label: "Staff", path: `${SO}/staff/list` },
      ]}
      loadAlerts={async () => {
        const res = await apiClient.get("/store/dashboard/inventory-alerts")
        const list = res?.data?.data?.lowStock || res?.data?.lowStock || []
        return list.map((a) => ({
          id: a.ingredientId,
          title: `Low stock: ${a.ingredient}`,
          detail: `${a.availableQty} ${a.unit} left (reorder at ${a.reorderLevel})`,
          tag: a.severity || "alert",
          critical: String(a.severity).toLowerCase() === "critical",
        }))
      }}
      alertsSubtitle="Low-stock alerts for this store"
      alertsPath={`${SO}/inventory/low-stock`}
      user={userData}
      menuItems={[
        { icon: User, label: "Profile", onClick: () => navigate(`${SO}/profile`) },
        { icon: themeMode === "dark" ? Sun : Moon, label: themeMode === "dark" ? "Light mode" : "Dark mode", onClick: toggleTheme },
      ]}
      onLogout={handleLogout}
      extra={isManager(role) ? <StoreOpenToggle variant="compact" storeName={storeName} /> : null}
    />
  )
}
