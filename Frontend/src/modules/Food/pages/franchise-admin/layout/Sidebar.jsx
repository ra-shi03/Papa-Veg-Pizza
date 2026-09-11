import React, { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import * as Icons from "lucide-react"
import { useSystemTheme } from "@/shared/utils/themeSync"
import { franchiseAdminSidebarMenu } from "./franchiseAdminSidebarMenu"
import { adminAPI } from "@food/api"
import { clearModuleAuth } from "@food/utils/auth"

export default function Sidebar({ isOpen, onClose, isCollapsed = false, onToggleCollapse }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { logo } = useSystemTheme()
  const [searchQuery, setSearchQuery] = useState("")

  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth < 1024 : false)

  useEffect(() => {
    if (typeof window === "undefined") return
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const displayCollapsed = isCollapsed
  const [expandedGroups, setExpandedGroups] = useState({
    "STORE MANAGEMENT": true,
    "STAFF MANAGEMENT": true,
    "ORDERS": true,
    "PRODUCTS": false,
    "INVENTORY": false,
    "CUSTOMERS": false,
    "FINANCE": false,
    "MARKETING": false,
    "REPORTS": false,
  })

  const toggleGroup = (groupTitle) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupTitle]: !prev[groupTitle]
    }))
  }

  const handleLogout = async () => {
    try {
      try {
        await adminAPI.logout()
      } catch (_) {}
      clearModuleAuth("admin")
      localStorage.removeItem("admin_accessToken")
      localStorage.removeItem("admin_authenticated")
      localStorage.removeItem("admin_user")
      localStorage.removeItem("admin_sidebar_state")
      localStorage.removeItem("admin_recent_searches")
      sessionStorage.removeItem("adminAuthData")
      window.dispatchEvent(new Event("adminAuthChanged"))
      navigate("/franchise-admin/login", { replace: true })
    } catch (_) {
      navigate("/franchise-admin/login", { replace: true })
    }
  }

  // Dynamic Lucide Icon Helper
  const RenderIcon = ({ name, className }) => {
    const IconComponent = Icons[name] || Icons.HelpCircle
    return <IconComponent size={15} className={className} />
  }

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        id="sidebar"
        className={`fixed inset-y-0 left-0 z-[60] flex flex-col bg-zinc-950 dark:bg-white border-r border-zinc-800 dark:border-zinc-200 transition-all duration-300 ease-in-out lg:translate-x-0 ${
          displayCollapsed ? "w-[72px]" : "w-[280px]"
        } ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
        onMouseEnter={() => {
          if (isCollapsed && window.matchMedia('(min-width: 1024px)').matches) setIsHovered(true)
        }}
        onMouseLeave={() => {
          if (isCollapsed && window.matchMedia('(min-width: 1024px)').matches) setIsHovered(false)
        }}
      >
        {/* Header / Logo section */}
        <div className={`py-4 flex items-center justify-between border-b border-zinc-800 dark:border-zinc-200 ${displayCollapsed ? "justify-center px-2 flex-col gap-3" : "px-4"}`}>
          <div className="flex items-center gap-2.5 overflow-hidden">
            {logo ? (
              <img src={logo} alt="Logo" className="w-9 h-9 object-contain rounded-lg shrink-0 animate-fade-in" />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-[var(--primary)] text-white flex items-center justify-center shadow-md shadow-[var(--primary)]/20 shrink-0">
                <Icons.Pizza size={20} className="stroke-[2.5]" />
              </div>
            )}
            {!displayCollapsed && (
              <div className="animate-fade-in whitespace-nowrap">
                <p className="font-semibold text-white dark:text-black leading-tight text-sm">Papa Veg Admin</p>
                <p className="text-[10px] text-zinc-400 dark:text-black font-medium">Franchise Portal</p>
              </div>
            )}
          </div>

            {/* Buttons stack horizontally when expanded, vertically/hidden when collapsed */}
            <div className={`flex items-center gap-1 ${displayCollapsed ? "flex-col" : ""}`}>
              {/* Collapse Toggle Button */}
              <button
                onClick={onToggleCollapse}
                className="flex p-1 rounded-md text-zinc-400 hover:text-black hover:bg-zinc-100 transition-colors cursor-pointer shrink-0"
                title={displayCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                {displayCollapsed ? <Icons.ChevronRight size={16} /> : <Icons.ChevronLeft size={16} />}
              </button>

              <button
                onClick={onClose}
                className={`p-1 rounded-md text-black hover:bg-zinc-100 lg:hidden transition-colors shrink-0 ${displayCollapsed ? "hidden" : ""}`}
              >
                <Icons.X size={16} />
              </button>
            </div>
        </div>

        {/* Search bar section */}
        <div className="px-3 py-2 border-b border-zinc-800 dark:border-zinc-200">
          <div className="relative flex items-center bg-zinc-900 dark:bg-zinc-100 rounded-lg px-2 py-1.5 border border-zinc-700 dark:border-zinc-300 focus-within:border-[var(--primary)] transition-all">
            <Icons.Search size={15} className="text-zinc-400 shrink-0 mx-auto" />
            {!displayCollapsed ? (
              <input
                id="searchMenus"
                name="searchMenus"
                type="text"
                placeholder="Search menus..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ml-2 w-full text-xs bg-transparent border-0 outline-none text-white dark:text-black placeholder-zinc-500"
              />
            ) : (
              <button
                onClick={onToggleCollapse}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                title="Search menus (Expand)"
              />
            )}
          </div>
        </div>

        {/* Scrollable menu content */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-4 space-y-2.5 scrollbar-thin scrollbar-thumb-zinc-700 dark:scrollbar-thumb-zinc-200">
          {franchiseAdminSidebarMenu
            .map((item) => {
              if (item.type === "link") {
                const matches = item.label.toLowerCase().includes(searchQuery.toLowerCase())
                return matches ? item : null
              }
              if (item.type === "section") {
                const matchedSubItems = item.items.filter((sub) =>
                  sub.label.toLowerCase().includes(searchQuery.toLowerCase())
                )
                if (matchedSubItems.length > 0) {
                  return { ...item, items: matchedSubItems }
                }
              }
              return null
            })
            .filter(Boolean)
            .map((item, idx) => {
              if (item.type === "link") {
                const isActive = location.pathname === item.path
                return (
                  <button
                    key={idx}
                    title={displayCollapsed ? item.label : undefined}
                    onClick={() => {
                      navigate(item.path)
                      if (window.innerWidth < 1024) onClose()
                    }}
                    className={`w-full flex items-center rounded-md text-xs font-semibold transition-all duration-200 text-left group border border-transparent ${
                      displayCollapsed ? "justify-center px-0 py-2.5" : "gap-2 px-2.5 py-1.5"
                    } ${
                      isActive
                        ? "bg-primary text-primary-foreground dark:bg-primary/10 dark:text-primary shadow-sm"
                        : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white dark:text-zinc-600 dark:hover:bg-zinc-100 dark:hover:text-black"
                    }`}
                  >
                    <RenderIcon
                      name={item.icon}
                      className={`shrink-0 transition-transform duration-300 ${
                        isActive ? "text-primary-foreground dark:text-primary" : "text-zinc-500 group-hover:text-white dark:group-hover:text-black"
                      }`}
                    />
                    {!displayCollapsed && <span className="leading-snug">{item.label}</span>}
                  </button>
                )
              }

              if (item.type === "section") {
                const isExpanded = searchQuery ? true : expandedGroups[item.label]
                return (
                  <div key={idx} className="space-y-1">
                    {!displayCollapsed ? (
                      <button
                        onClick={() => toggleGroup(item.label)}
                        className="w-full flex items-center justify-between px-3.5 py-1.5 text-[10px] font-bold text-zinc-300 dark:text-black uppercase tracking-widest hover:opacity-80 transition-colors focus:outline-none"
                      >
                        <span>{item.label}</span>
                        <span
                          className={`transition-transform duration-200 text-zinc-300 dark:text-black ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        >
                          <svg width="8" height="5" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                      </button>
                    ) : (
                      <div className="h-px bg-zinc-800/50 dark:bg-zinc-200 my-2 mx-2" />
                    )}

                    {(isExpanded || displayCollapsed) && (
                      <div className={`space-y-0.5 pb-1.5 transition-all ${displayCollapsed ? "px-0" : "px-2"}`}>
                        {item.items.map((subItem, subIdx) => {
                          const isSubActive = location.pathname === subItem.path
                          return (
                            <button
                              key={subIdx}
                              title={displayCollapsed ? subItem.label : undefined}
                              onClick={() => {
                                navigate(subItem.path)
                                if (window.innerWidth < 1024) onClose()
                              }}
                              className={`w-full flex items-center rounded-md text-xs font-semibold transition-all duration-200 text-left group border border-transparent ${
                                displayCollapsed ? "justify-center px-0 py-2.5" : "gap-2 px-2.5 py-1.5"
                              } ${
                                isSubActive
                                  ? "bg-primary text-primary-foreground dark:bg-primary/10 dark:text-primary shadow-sm"
                                  : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white dark:text-zinc-600 dark:hover:bg-zinc-100 dark:hover:text-black"
                              }`}
                            >
                              <RenderIcon
                                name={subItem.icon}
                                className={`shrink-0 transition-transform duration-300 ${
                                  isSubActive ? "text-primary-foreground dark:text-primary" : "text-zinc-500 group-hover:text-white dark:group-hover:text-black"
                                }`}
                              />
                              {!displayCollapsed && <span className="leading-snug">{subItem.label}</span>}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              }

              return null
            })}

          {/* Logout Action */}
          <button
            onClick={handleLogout}
            title={displayCollapsed ? "Sign Out" : undefined}
            className={`w-full flex items-center rounded-md text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-50 border border-transparent text-left group ${
              displayCollapsed ? "justify-center px-0 py-2.5" : "gap-2 px-2.5 py-1.5"
            }`}
          >
            <Icons.LogOut size={15} className="shrink-0 text-rose-600" />
            {!displayCollapsed && <span className="leading-snug">Sign Out</span>}
          </button>
        </nav>

         {/* Footer info box */}
        <div className="p-3 border-t border-zinc-800 dark:border-zinc-200 bg-zinc-950 dark:bg-zinc-50 mt-auto">
          {!displayCollapsed ? (
            <div className="p-2.5 rounded-lg bg-zinc-900 dark:bg-white border border-zinc-800 dark:border-zinc-200 shadow-sm">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-semibold text-emerald-500 dark:text-emerald-600">Franchise Online</span>
              </div>
              <p className="text-[9px] text-zinc-300 dark:text-black font-medium leading-normal">System Online</p>
            </div>
          ) : (
            <div className="flex justify-center py-1">
              <span className="relative flex h-2 w-2" title="System Online">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
