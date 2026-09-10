import { useState } from "react"
import { Outlet } from "react-router-dom"
import AdminSidebar from "./Sidebar"
import AdminNavbar from "./Navbar"
import { API_BASE_URL } from "@food/api/config"

export default function FranchiseAdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem("fa_sidebar_collapsed") === "true")
  const handleToggleCollapse = () => {
    const next = !isCollapsed
    setIsCollapsed(next)
    localStorage.setItem("fa_sidebar_collapsed", next ? "true" : "false")
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

      {/* Sidebar */}
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      {/* Main Content Area */}
      <div id="admin-main-content" className={`flex-1 flex min-h-0 flex-col transition-all duration-300 ease-in-out min-w-0 relative ${isCollapsed ? "lg:ml-[72px]" : "lg:ml-[280px]"}`}>
        {/* Top Navbar */}
        <AdminNavbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        {/* Backend disconnected banner */}
        {!API_BASE_URL && (
          <div className="w-full bg-amber-100 border-b border-amber-300 px-4 py-2 text-center text-sm text-amber-900">
            Backend disconnected. Data is not live.
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 min-h-0 w-full max-w-full overflow-x-hidden overflow-y-auto bg-neutral-100 relative pt-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
