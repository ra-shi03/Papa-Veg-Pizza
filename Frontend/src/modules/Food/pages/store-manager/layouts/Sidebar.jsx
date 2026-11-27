import { authKey } from "@/shared/utils/authNamespace";
import React, { useMemo } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import PanelSidebar from "@food/components/PanelSidebar"
import { storeOperationsSidebarMenu } from "./storeOperationsSidebarMenu"

// Convert role identifier to display name
const getRoleDisplayName = (r) => {
  switch (r) {
    case "store_manager":
      return "Store Manager"
    case "kitchen_staff":
      return "Kitchen Staff"
    case "assistant_manager":
      return "Assistant Manager"
    case "store_owner":
      return "Store Owner"
    default:
      return "Store Staff"
  }
}

export default function Sidebar({ isOpen, onClose, role }) {
  const navigate = useNavigate()
  const location = useLocation()

  // Only the entries this role may open
  const menu = useMemo(
    () =>
      storeOperationsSidebarMenu
        .filter((entry) => entry.allowedRoles.includes(role))
        .map((entry) => {
          if (entry.type !== "section") return entry
          const items = entry.items
            .filter((sub) => sub.allowedRoles.includes(role))
            .map((sub) =>
              role === "kitchen_staff" && sub.label === "Stock Requests" ? { ...sub, label: "Inventory Requests" } : sub
            )
          return { ...entry, items }
        })
        .filter((entry) => entry.type !== "section" || entry.items.length > 0),
    [role]
  )

  const handleLogout = async () => {
    try {
      localStorage.removeItem(authKey("admin", "accessToken"))
      localStorage.removeItem(authKey("admin", "refreshToken"))
      localStorage.removeItem(authKey("admin", "user"))
      localStorage.removeItem("store_role")
      window.dispatchEvent(new Event("storeAuthChanged"))
      navigate("/store-operation/login", { replace: true })
    } catch (_) {
      navigate("/store-operation/login", { replace: true })
    }
  }

  return (
    <PanelSidebar
      isOpen={isOpen}
      onClose={onClose}
      panelLabel={`${getRoleDisplayName(role)} Panel`}
      menu={menu}
      isActive={(item) => location.pathname === item.path}
      onNavigate={(item) => navigate(item.path)}
      onLogout={handleLogout}
    />
  )
}
