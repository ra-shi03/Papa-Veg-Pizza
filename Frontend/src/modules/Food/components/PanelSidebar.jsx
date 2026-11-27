import { useEffect, useState } from "react"
import * as Icons from "lucide-react"
import { useSystemTheme } from "@/shared/utils/themeSync"

/**
 * Black admin sidebar shared by the super admin, franchise admin and store manager panels, laid out like the
 * Jharkhand Rasoi admin sidebar: 320px wide (80px collapsed, icons only), logo with a collapse arrow (desktop) or a
 * close button (mobile), panel label and search, then each section's heading followed by its menu buttons.
 *
 * The sidebar's width is published as the CSS variable --panel-sidebar-w on <html>, so the page area, the top bar
 * and the modals of each panel can sit next to it (lg:pl-[var(--panel-sidebar-w,320px)]).
 *
 * menu: [{ type: "link", label, icon, path } | { type: "section", label, items: [{ label, icon, path }] }]
 * icon is a lucide component or a lucide icon name.
 */

const cx = (...classes) => classes.filter(Boolean).join(" ")
const COLLAPSED_KEY = "panel_sidebar_collapsed"
export const SIDEBAR_WIDTH = { open: "320px", collapsed: "80px" }

function MenuIcon({ icon, className }) {
  const Icon = typeof icon === "string" ? Icons[icon] || Icons.Circle : icon || Icons.Circle
  return <Icon className={className} />
}

export default function PanelSidebar({ isOpen, onClose, menu, isActive, onNavigate, panelLabel, onLogout }) {
  const { logo } = useSystemTheme()
  const [searchQuery, setSearchQuery] = useState("")
  const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem(COLLAPSED_KEY) === "true")
  // The mobile drawer always shows the full menu
  const collapsed = isCollapsed && !isOpen
  const query = searchQuery.toLowerCase().trim()

  useEffect(() => {
    localStorage.setItem(COLLAPSED_KEY, String(isCollapsed))
    document.documentElement.style.setProperty("--panel-sidebar-w", isCollapsed ? SIDEBAR_WIDTH.collapsed : SIDEBAR_WIDTH.open)
  }, [isCollapsed])

  const matches = (item) => item.label.toLowerCase().includes(query)
  const visibleMenu = menu
    .map((entry) => (entry.type === "section" ? { ...entry, items: entry.items.filter(matches) } : entry))
    .filter((entry) => (entry.type === "section" ? entry.items.length > 0 : matches(entry)))

  const go = (item) => {
    onNavigate(item)
    if (window.innerWidth < 1024) onClose?.()
  }

  const renderItem = (item, index) => {
    const active = isActive(item)
    return (
      <button
        key={item.path || item.label}
        type="button"
        onClick={() => go(item)}
        title={collapsed ? item.label : undefined}
        className={cx(
          "ps-menu-item w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[0.9rem] font-bold text-left border transition-all duration-300 ease-out",
          active
            ? "bg-white/10 text-white border-white/15"
            : "text-neutral-100 border-transparent hover:bg-white/5 hover:text-white",
          collapsed && "justify-center px-2"
        )}
        style={{ animationDelay: `${index * 0.05}s` }}
      >
        <MenuIcon
          icon={item.icon}
          className={cx("w-4 h-4 shrink-0 transition-all duration-300", active ? "text-white scale-110" : "text-neutral-300")}
        />
        {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
      </button>
    )
  }

  return (
    <>
      <style>{`
        @keyframes psSlideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes psFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .ps-menu-item { animation: psSlideIn 0.3s ease-out both; }
        .ps-scroll::-webkit-scrollbar { width: 2px; }
        .ps-scroll::-webkit-scrollbar-track { background: rgba(17, 24, 39, 0.4); }
        .ps-scroll::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); border-radius: 10px; }
        .ps-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.35); }
        .ps-scroll:hover::-webkit-scrollbar { width: 6px; }
        .ps-scroll { scrollbar-width: thin; scrollbar-color: rgba(255, 255, 255, 0.25) rgba(17, 24, 39, 0.4); }
        /* Jharkhand Rasoi's menu list uses the system font (Segoe UI on Windows), not Poppins */
        .ps-scroll { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; }
      `}</style>

      {/* Mobile backdrop: tap outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[65] bg-gray-900/50 lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      <aside
        id="sidebar"
        className={cx(
          "fixed left-0 top-0 z-[70] flex h-[100dvh] flex-col overflow-hidden bg-black border-r border-neutral-700/30",
          "transform transition-all duration-300 ease-in-out lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "w-[min(20rem,calc(100vw-1.5rem))]",
          collapsed ? "lg:w-20" : "lg:w-80"
        )}
        style={{
          paddingTop: "env(safe-area-inset-top, 0px)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {/* Header: logo + collapse / close, panel label, search */}
        <div className="shrink-0 px-3 py-3 bg-neutral-950 border-b border-neutral-700/30 animate-[psFadeIn_0.4s_ease-out]">
          <div className="flex items-center justify-between mb-3">
            {collapsed ? (
              <div className="w-full flex items-center justify-center">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shadow-lg shadow-black/20 ring-1 ring-white/10">
                  {logo ? <img src={logo} alt="Papa Veg Pizza" className="w-8 h-8 object-contain" /> : <Icons.Pizza className="w-5 h-5 text-white" />}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 min-w-0 animate-[psSlideIn_0.3s_ease-out]">
                {logo ? (
                  <div className="w-28 h-12 rounded-lg flex items-center justify-center">
                    <img src={logo} alt="Papa Veg Pizza" className="w-28 h-10 object-contain" />
                  </div>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center ring-1 ring-white/10 shrink-0">
                      <Icons.Pizza className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-white text-[0.9rem] truncate">Papa Veg Pizza</span>
                  </>
                )}
              </div>
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCollapsed((v) => !v)}
                className="hidden lg:inline-flex text-neutral-300 hover:text-white transition-all duration-200 hover:scale-110 p-1.5 rounded-lg hover:bg-white/5"
                title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {collapsed ? <Icons.ChevronRight className="w-4 h-4" /> : <Icons.ChevronLeft className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="lg:hidden text-neutral-300 hover:text-white transition-all duration-200 hover:scale-110"
                aria-label="Close menu"
              >
                <Icons.X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {!collapsed && (
            <>
              <div className="mb-3 animate-[psSlideIn_0.4s_ease-out_0.1s_both]">
                <h2 className="text-[0.7875rem] font-semibold text-neutral-300 uppercase tracking-wider text-left">{panelLabel}</h2>
              </div>

              <div className="relative animate-[psSlideIn_0.4s_ease-out_0.2s_both]">
                <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4 z-10" />
                <input
                  id="searchMenus"
                  name="searchMenus"
                  type="text"
                  placeholder="Search Menu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoComplete="off"
                  spellCheck="false"
                  className={cx(
                    "w-full pl-9 py-2.5 bg-neutral-900 border border-neutral-700 rounded-lg text-[0.9rem] font-bold text-white placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white/40 transition-all duration-200",
                    searchQuery ? "pr-9" : "pr-3"
                  )}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-all duration-200 hover:scale-110 z-10"
                    aria-label="Clear search"
                  >
                    <Icons.X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Menu: section heading, then its buttons */}
        <nav className="ps-scroll flex-1 min-h-0 overflow-y-auto overscroll-y-contain px-3 py-3 space-y-2">
          {visibleMenu.length === 0 ? (
            <div className="px-3 py-12 animate-[psFadeIn_0.4s_ease-out]">
              <p className="text-neutral-300 text-sm font-medium">No menu items found</p>
              <p className="text-neutral-500 text-sm mt-2">Try a different search term</p>
            </div>
          ) : (
            visibleMenu.map((entry, index) =>
              entry.type === "section" ? (
                <div
                  key={entry.label}
                  className={cx(index > 0 && "mt-4 pt-4 border-t border-neutral-800/60", "animate-[psFadeIn_0.4s_ease-out]")}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {!collapsed && (
                    <div className="px-3 py-2 mb-2">
                      <span className="text-neutral-300 font-semibold text-[0.9rem] text-left">{entry.label}</span>
                    </div>
                  )}
                  <div className="space-y-1">{entry.items.map((item, i) => renderItem(item, i))}</div>
                </div>
              ) : (
                <div key={entry.path || entry.label}>{renderItem(entry, index)}</div>
              )
            )
          )}

          {onLogout && !query && (
            <div className="mt-4 pt-4 border-t border-neutral-800/60">
              <button
                type="button"
                onClick={onLogout}
                title={collapsed ? "Log out" : undefined}
                className={cx(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[0.9rem] font-bold text-left text-red-500 hover:bg-red-500/10 hover:text-red-400 transition-all duration-300",
                  collapsed && "justify-center px-2"
                )}
              >
                <Icons.LogOut className="w-4 h-4 shrink-0" />
                {!collapsed && <span>Log out</span>}
              </button>
            </div>
          )}
        </nav>
      </aside>
    </>
  )
}
