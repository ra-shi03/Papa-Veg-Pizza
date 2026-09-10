import React, { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import * as Icons from "lucide-react"
import { useSystemTheme } from "@/shared/utils/themeSync"
import { storeOperationsSidebarMenu } from "./storeOperationsSidebarMenu"

export default function Sidebar({ isOpen, onClose, role, isCollapsed = false, onToggleCollapse }) {
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

  const displayCollapsed = isCollapsed && !isMobile
  
  // Set default expanded state for sections
  const [expandedGroups, setExpandedGroups] = useState({
    "Orders": true,
    "Kitchen Operations": true,
    "Delivery Operations": false,
    "Inventory": false,
    "Staff Management": false,
    "Customers": false,
    "Reports": false,
  })

  const toggleGroup = (groupTitle) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupTitle]: !prev[groupTitle]
    }))
  }

  const handleLogout = async () => {
    try {
      localStorage.removeItem("store_accessToken")
      localStorage.removeItem("store_authenticated")
      localStorage.removeItem("store_user")
      localStorage.removeItem("store_role")
      window.dispatchEvent(new Event("storeAuthChanged"))
      navigate("/store-operation/login", { replace: true })
    } catch (_) {
      navigate("/store-operation/login", { replace: true })
    }
  }

  // Dynamic Lucide Icon Helper
  const RenderIcon = ({ name, className }) => {
    const IconComponent = Icons[name] || Icons.HelpCircle
    return <IconComponent size={15} className={className} />
  }

  // Convert role identifier to display name
  const getRoleDisplayName = (r) => {
    switch (r) {
      case "store_manager":
        return "Store Manager"
      case "kitchen_supervisor":
        return "Kitchen Supervisor"
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
        id="store-operations-sidebar"
        className={`fixed inset-y-0 left-0 z-[60] flex flex-col bg-white dark:bg-zinc-900 border-r border-zinc-150 dark:border-zinc-800 transition-all duration-300 ease-in-out lg:translate-x-0 ${
          displayCollapsed ? "lg:w-[72px] w-[280px]" : "w-[280px]"
        } ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Header / Logo section */}
        <div className={`px-4 py-4 flex items-center justify-between border-b border-zinc-150 dark:border-zinc-800 ${displayCollapsed ? "lg:justify-center lg:px-2" : ""}`}>
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
                <p className="font-semibold text-black dark:text-white leading-tight text-sm">Papa Veg Pizza</p>
                <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] tracking-wide">
                  {getRoleDisplayName(role)}
                </span>
              </div>
            )}
          </div>

          {/* Collapse Toggle Button (Desktop Only) */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1 rounded-md text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
            title={displayCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {displayCollapsed ? <Icons.ChevronRight size={16} /> : <Icons.ChevronLeft size={16} />}
          </button>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-black dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 lg:hidden transition-colors"
          >
            <Icons.X size={16} />
          </button>
        </div>

        {/* Search bar section */}
        <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800">
          <div className="relative flex items-center bg-zinc-50 dark:bg-zinc-950 rounded-lg px-2 py-1.5 border border-zinc-200 dark:border-zinc-800 focus-within:border-[var(--primary)] transition-all">
            <Icons.Search size={15} className="text-zinc-400 shrink-0 mx-auto" />
            {!displayCollapsed ? (
              <input
                id="searchMenus"
                name="searchMenus"
                type="text"
                placeholder="Search menus..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ml-2 w-full text-xs bg-transparent border-0 outline-none text-zinc-800 dark:text-zinc-100 placeholder-zinc-400"
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
        <nav className="flex-1 overflow-y-auto px-2.5 py-4 space-y-2.5 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-700">
          {storeOperationsSidebarMenu
            .map((item) => {
              if (item.type === "link") {
                if (!item.allowedRoles.includes(role)) return null
                const matches = item.label.toLowerCase().includes(searchQuery.toLowerCase())
                return matches ? item : null
              }
              if (item.type === "section") {
                if (!item.allowedRoles.includes(role)) return null
                const allowedSubItems = item.items.filter((sub) =>
                  sub.allowedRoles.includes(role) &&
                  sub.label.toLowerCase().includes(searchQuery.toLowerCase())
                )
                if (allowedSubItems.length > 0) {
                  return { ...item, items: allowedSubItems }
                }
              }
              return null
            })
            .filter(Boolean)
            .map((item, idx) => {
              // Check if item is a direct link
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
                        ? "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border border-red-100 dark:border-red-900/30 shadow-sm"
                        : "text-black dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-[var(--primary)]"
                    }`}
                  >
                    <RenderIcon
                      name={item.icon}
                      className={`shrink-0 transition-transform duration-300 ${
                        isActive ? "text-red-655 dark:text-red-400" : "text-black dark:text-white group-hover:text-[var(--primary)]"
                      }`}
                    />
                    {!displayCollapsed && <span className="leading-snug">{item.label}</span>}
                  </button>
                )
              }

              // Check if item is a section
              if (item.type === "section") {
                const isExpanded = searchQuery ? true : expandedGroups[item.label]
                return (
                  <div key={idx} className="space-y-1">
                    {!displayCollapsed ? (
                      <button
                        onClick={() => toggleGroup(item.label)}
                        className="w-full flex items-center justify-between px-3.5 py-1.5 text-[10px] font-bold text-black dark:text-white uppercase tracking-widest hover:opacity-80 transition-colors focus:outline-none"
                      >
                        <span>{item.label}</span>
                        <span
                          className={`transition-transform duration-200 text-black dark:text-white ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        >
                          <svg width="8" height="5" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                      </button>
                    ) : (
                      <div className="h-px bg-zinc-150 dark:bg-zinc-800/80 my-2 mx-2" />
                    )}

                    {(isExpanded || displayCollapsed) && (
                      <div className={`space-y-0.5 pb-1.5 transition-all ${displayCollapsed ? "px-0" : "px-2"}`}>
                        {item.items.map((subItem, subIdx) => {
                          const isSubActive = location.pathname === subItem.path
                          
                          // Custom label override for Kitchen Staff
                          let displayLabel = subItem.label
                          if (role === "kitchen_staff" && subItem.label === "Stock Requests") {
                            displayLabel = "Inventory Requests"
                          }

                          return (
                            <button
                              key={subIdx}
                              title={displayCollapsed ? displayLabel : undefined}
                              onClick={() => {
                                navigate(subItem.path)
                                if (window.innerWidth < 1024) onClose()
                              }}
                              className={`w-full flex items-center rounded-md text-xs font-semibold transition-all duration-200 text-left group border border-transparent ${
                                displayCollapsed ? "justify-center px-0 py-2.5" : "gap-2 px-2.5 py-1.5"
                              } ${
                                isSubActive
                                  ? "bg-red-50 text-red-750 dark:bg-red-900/20 dark:text-red-400 border border-red-100 dark:border-red-900/30 shadow-sm"
                                  : "text-zinc-650 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-850 hover:text-[var(--primary)]"
                              }`}
                            >
                              <RenderIcon
                                name={subItem.icon}
                                className={`shrink-0 transition-transform duration-300 ${
                                  isSubActive
                                    ? "text-red-600 dark:text-red-400"
                                    : "text-zinc-500 dark:text-zinc-400 group-hover:text-[var(--primary)]"
                                }`}
                              />
                              {!displayCollapsed && <span className="leading-snug">{displayLabel}</span>}
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
            className={`w-full flex items-center rounded-md text-xs font-bold text-rose-500 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 border border-transparent text-left group ${
              displayCollapsed ? "justify-center px-0 py-2.5" : "gap-2 px-2.5 py-1.5"
            }`}
          >
            <Icons.LogOut size={15} className="shrink-0 text-rose-500" />
            {!displayCollapsed && <span className="leading-snug">Sign Out</span>}
          </button>
        </nav>

        {/* Footer info box */}
        <div className="p-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          {!displayCollapsed ? (
            <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-750 shadow-sm">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">Store Connection: Live</span>
              </div>
              <p className="text-[9px] text-black dark:text-white font-medium leading-normal">Node: PV-OPS-ACTIVE</p>
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
