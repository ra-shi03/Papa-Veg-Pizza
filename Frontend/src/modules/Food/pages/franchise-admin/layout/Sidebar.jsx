import { authKey } from "@/shared/utils/authNamespace";
import React from "react"
import { useNavigate, useLocation } from "react-router-dom"
import PanelSidebar from "@food/components/PanelSidebar"
import { franchiseAdminSidebarMenu } from "./franchiseAdminSidebarMenu"
import { adminAPI } from "@food/api"
import { clearModuleAuth } from "@food/utils/auth"

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    try {
      try {
        await adminAPI.logout()
      } catch (_) {}
      clearModuleAuth("admin")
      localStorage.removeItem(authKey("admin", "accessToken"))
      localStorage.removeItem(authKey("admin", "authenticated"))
      localStorage.removeItem(authKey("admin", "user"))
      localStorage.removeItem("admin_sidebar_state")
      localStorage.removeItem("admin_recent_searches")
      sessionStorage.removeItem("adminAuthData")
      window.dispatchEvent(new Event("adminAuthChanged"))
      navigate("/franchise-admin/login", { replace: true })
    } catch (_) {
      navigate("/franchise-admin/login", { replace: true })
    }
  }

  return (
    <PanelSidebar
      isOpen={isOpen}
      onClose={onClose}
      panelLabel="Franchise Admin Panel"
      menu={franchiseAdminSidebarMenu}
      isActive={(item) => location.pathname === item.path}
      onNavigate={(item) => navigate(item.path)}
      onLogout={handleLogout}
    />
  )
}
