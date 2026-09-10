import { useState, useEffect } from "react"
import { Outlet } from "react-router-dom"
import Sidebar from "./Sidebar"
import Navbar from "./Navbar"
import { API_BASE_URL } from "@food/api/config"

export default function StoreOperationsLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [role, setRole] = useState(() => {
    return localStorage.getItem("store_role") || "store_manager"
  })

  // Synchronize role updates across elements
  const handleRoleChange = (newRole) => {
    setRole(newRole)
    localStorage.setItem("store_role", newRole)
    // Dispatch custom event to notify other components in case they listen to role changes
    window.dispatchEvent(new CustomEvent("storeRoleChanged", { detail: newRole }))
  }

  const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem("store_sidebar_collapsed") === "true")
  const handleToggleCollapse = () => {
    const next = !isCollapsed
    setIsCollapsed(next)
    localStorage.setItem("store_sidebar_collapsed", next ? "true" : "false")
    window.dispatchEvent(new CustomEvent("sidebarCollapseChanged", { detail: next }))
  }

  return (
    <div className="h-screen bg-neutral-200 flex overflow-hidden">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Role-Based Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        role={role}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      {/* Main Content Area */}
      <div 
        id="store-ops-main-content" 
        className={`flex-1 flex min-h-0 flex-col transition-all duration-300 ease-in-out min-w-0 relative ${isCollapsed ? "lg:ml-[72px]" : "lg:ml-[280px]"}`}
      >
        {/* Top Navbar */}
        <Navbar 
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
          role={role}
          onRoleChange={handleRoleChange}
        />

        {/* Backend disconnected banner (conditional display) */}
        {!API_BASE_URL && (
          <div className="w-full bg-amber-100 border-b border-amber-300 px-4 py-2 text-center text-sm text-amber-900">
            Store operations live sync offline. Using simulated system data.
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 min-h-0 w-full max-w-full overflow-x-hidden overflow-y-auto bg-neutral-100 relative pt-0">
          <Outlet context={{ role, onRoleChange: handleRoleChange }} />
        </main>
      </div>
    </div>
  )
}
