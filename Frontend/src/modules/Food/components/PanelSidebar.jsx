import { useState } from "react"
import * as Icons from "lucide-react"
import { useSystemTheme } from "@/shared/utils/themeSync"

/**
 * Black admin sidebar shared by the super admin, franchise admin and store manager panels
 * (same layout as the Jharkhand Rasoi admin sidebar): logo, panel label and search on top, then each section's
 * heading followed by its menu buttons.
 *
 * menu: [{ type: "link", label, icon, path } | { type: "section", label, items: [{ label, icon, path }] }]
 * icon is a lucide component or a lucide icon name.
 */

const cx = (...classes) => classes.filter(Boolean).join(" ")

function MenuIcon({ icon, className }) {
  const Icon = typeof icon === "string" ? Icons[icon] || Icons.Circle : icon || Icons.Circle
  return <Icon className={className} />
}

export default function PanelSidebar({ isOpen, onClose, menu, isActive, onNavigate, panelLabel, onLogout }) {
  const { logo } = useSystemTheme()
  const [searchQuery, setSearchQuery] = useState("")
  const query = searchQuery.toLowerCase().trim()

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
        className={cx(
          "ps-menu-item w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-bold text-left border transition-all duration-300 ease-out",
          active
            ? "bg-white/10 text-white border-white/15"
            : "text-neutral-200 border-transparent hover:bg-white/5 hover:text-white"
        )}
        style={{ animationDelay: `${index * 0.03}s` }}
      >
        <MenuIcon
          icon={item.icon}
          className={cx("w-4 h-4 shrink-0 transition-all duration-300", active ? "text-white scale-110" : "text-neutral-400")}
        />
        <span className="flex-1 truncate">{item.label}</span>
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
        .ps-scroll::-webkit-scrollbar-track { background: transparent; }
        .ps-scroll::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); border-radius: 10px; }
        .ps-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.35); }
        .ps-scroll:hover::-webkit-scrollbar { width: 6px; }
        .ps-scroll { scrollbar-width: thin; scrollbar-color: rgba(255, 255, 255, 0.25) transparent; }
      `}</style>

      {/* Mobile backdrop: tap outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      <aside
        id="sidebar"
        className={cx(
          "fixed inset-y-0 left-0 z-[60] flex h-[100dvh] w-[280px] flex-col overflow-hidden bg-black border-r border-white/10",
          "transition-transform duration-300 ease-in-out lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{
          paddingTop: "env(safe-area-inset-top, 0px)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {/* Header: logo, panel label, search */}
        <div className="shrink-0 px-3 py-3 bg-neutral-950 border-b border-white/10 animate-[psFadeIn_0.4s_ease-out]">
          <div className="flex items-center gap-2 mb-3 min-w-0 animate-[psSlideIn_0.3s_ease-out]">
            {logo ? (
              <img src={logo} alt="Papa Veg Pizza" className="w-28 h-10 object-contain object-left" />
            ) : (
              <>
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center ring-1 ring-white/10 shrink-0">
                  <Icons.Pizza className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-white text-base truncate">Papa Veg Pizza</span>
              </>
            )}
          </div>

          <h2 className="mb-3 text-sm font-semibold text-neutral-400 uppercase tracking-wider animate-[psSlideIn_0.4s_ease-out_0.1s_both]">
            {panelLabel}
          </h2>

          <div className="relative animate-[psSlideIn_0.4s_ease-out_0.2s_both]">
            <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 w-4 h-4 z-10" />
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
                "w-full pl-9 py-2.5 bg-neutral-900 border border-neutral-800 rounded-lg text-sm font-bold text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-all duration-200",
                searchQuery ? "pr-9" : "pr-3"
              )}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors z-10"
                aria-label="Clear search"
              >
                <Icons.X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Menu: section heading, then its buttons */}
        <nav className="ps-scroll flex-1 min-h-0 overflow-y-auto overscroll-y-contain px-3 py-3">
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
                  className={cx(index > 0 && "mt-3 pt-3 border-t border-white/10", "animate-[psFadeIn_0.4s_ease-out]")}
                >
                  <div className="px-3 py-2 mb-1 text-neutral-400 font-semibold text-sm">{entry.label}</div>
                  <div className="space-y-1">{entry.items.map((item, i) => renderItem(item, i))}</div>
                </div>
              ) : (
                <div key={entry.path || entry.label} className={cx(index > 0 && "mt-1")}>
                  {renderItem(entry, index)}
                </div>
              )
            )
          )}

          {onLogout && !query && (
            <div className="mt-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={onLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-bold text-left text-red-500 hover:bg-red-500/10 hover:text-red-400 transition-all duration-300"
              >
                <Icons.LogOut className="w-4 h-4 shrink-0" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </nav>
      </aside>
    </>
  )
}
