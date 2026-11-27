import { useState, useEffect, useRef, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import {
  Menu, Search, User, ChevronDown, LogOut, ArrowRight, Bell, BellOff, Loader2, AlertCircle, FileText,
} from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@food/components/ui/dialog"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@food/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@food/components/ui/popover"
import { useSystemTheme } from "@/shared/utils/themeSync"
import { adminAPI } from "@food/api"

/**
 * Admin top bar shared by the super admin, franchise admin and store manager panels, laid out like the Jharkhand Rasoi
 * admin header: logo + name, maintenance-mode pill, search (Ctrl+K), notifications, and the profile menu.
 *
 * Props
 *  onToggleSidebar        opens the sidebar on mobile
 *  fixed                  true: fixed to the top next to the sidebar (super admin); false: sticky in the page column
 *  homePath, title        where the logo goes, and the name next to it
 *  canToggleMaintenance   true for the super admin (switches it); everyone else sees whether it is on
 *  search                 async (query) => [{ id, type, title, description, path, icon? }]
 *  quickActions           [{ icon, label, path }] shown in the search dialog before typing
 *  loadAlerts             async () => [{ id, title, detail, tag, critical }] (refreshed every minute)
 *  alertsSubtitle, alertsPath
 *  user                   { name, email, profileImage }
 *  menuItems              [{ icon, label, onClick }] in the profile menu (Logout is always last)
 *  onLogout
 *  extra                  extra controls shown on the right, before the bell (date filter, store open switch, ...)
 *  recentKey              localStorage key for recent searches
 */

const maskEmail = (email) => {
  if (!email || !email.includes("@")) return email || ""
  const [local, domain] = email.split("@")
  return `${local[0]}${"*".repeat(Math.min(local.length - 1, 5))}@${domain}`
}
const initials = (name) => (name ? name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2) : "AD")

export default function PanelNavbar({
  onToggleSidebar, fixed = false, homePath, title, canToggleMaintenance = false, search, quickActions = [],
  loadAlerts, alertsSubtitle = "Alerts from your stores", alertsPath, user, menuItems = [], onLogout, extra,
  recentKey = "panel_recent_searches",
}) {
  const navigate = useNavigate()
  const { logo } = useSystemTheme()
  // The panels pass these as inline functions: keep the latest in refs so the effects below run once, not every render
  const searchFn = useRef(search)
  const alertsFn = useRef(loadAlerts)
  searchFn.current = search
  alertsFn.current = loadAlerts

  // Business settings: logo and maintenance mode
  const [settings, setSettings] = useState(null)
  const [isUpdatingMaintenance, setIsUpdatingMaintenance] = useState(false)
  useEffect(() => {
    const load = canToggleMaintenance ? adminAPI.getBusinessSettings() : adminAPI.getPublicBusinessSettings()
    load.then((res) => setSettings(res?.data?.data || null)).catch(() => {})
  }, [canToggleMaintenance])
  const maintenanceOn = Boolean(settings?.maintenanceMode)

  const handleToggleMaintenance = async (e) => {
    e?.stopPropagation()
    if (!canToggleMaintenance) {
      toast.info(maintenanceOn ? "Maintenance mode is ON: customers cannot place orders. Only the super admin can change it." : "The platform is live. Only the super admin can switch maintenance mode.")
      return
    }
    if (isUpdatingMaintenance) return
    const next = !maintenanceOn
    setIsUpdatingMaintenance(true)
    try {
      const res = await adminAPI.updateBusinessSettings({ maintenanceMode: next })
      setSettings(res?.data?.data || { ...(settings || {}), maintenanceMode: next })
      toast.success(next ? "Maintenance mode enabled (Customer ordering suspended)" : "Maintenance mode disabled (Platform is live)")
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update maintenance mode")
    } finally {
      setIsUpdatingMaintenance(false)
    }
  }

  // Notifications
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [alerts, setAlerts] = useState([])
  const hasAlerts = Boolean(loadAlerts)
  useEffect(() => {
    if (!hasAlerts) return
    const load = () => Promise.resolve(alertsFn.current?.()).then((list) => setAlerts(Array.isArray(list) ? list : [])).catch(() => {})
    load()
    const timer = setInterval(load, 60000)
    return () => clearInterval(timer)
  }, [hasAlerts])

  // Search
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [recentSearches, setRecentSearches] = useState(() => {
    try { return JSON.parse(localStorage.getItem(recentKey) || "[]") } catch { return [] }
  })
  const searchInputRef = useRef(null)

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!searchFn.current || searchQuery.trim().length < 2) { setSearchResults([]); return }
      setIsSearching(true)
      try {
        setSearchResults((await searchFn.current(searchQuery.trim())) || [])
      } catch {
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const groupedResults = useMemo(() => {
    const groups = {}
    searchResults.forEach((r) => { (groups[r.type] = groups[r.type] || []).push(r) })
    return groups
  }, [searchResults])

  const handleResultClick = (result) => {
    const recent = [result.title, ...recentSearches.filter((s) => s !== result.title)].slice(0, 5)
    setRecentSearches(recent)
    localStorage.setItem(recentKey, JSON.stringify(recent))
    setSearchOpen(false)
    setSearchQuery("")
    navigate(result.path)
  }
  const clearRecent = () => {
    setRecentSearches([])
    localStorage.removeItem(recentKey)
  }

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") { e.preventDefault(); setSearchOpen(true) }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])
  useEffect(() => {
    if (searchOpen) setTimeout(() => searchInputRef.current?.focus(), 100)
  }, [searchOpen])

  const name = title || settings?.companyName || "Papa Veg Pizza"
  const logoUrl = settings?.logo?.url || logo

  return (
    <>
      <header
        className={`${fixed ? "fixed top-0 right-0 left-0 lg:left-[var(--panel-sidebar-w,320px)]" : "sticky top-0 w-full"} z-40 h-16 shrink-0 bg-white border-b border-neutral-200 shadow-sm transition-all duration-300`}
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="flex h-full min-w-0 items-center justify-between gap-2 px-3 sm:px-6">
          {/* Left: menu (mobile), logo + name, maintenance */}
          <div className="flex min-w-0 items-center gap-1 sm:gap-3">
            <button
              onClick={onToggleSidebar}
              className="lg:hidden shrink-0 p-2 rounded-md text-neutral-700 hover:bg-neutral-100 hover:text-black transition-colors"
              aria-label="Toggle menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex min-w-0 items-center cursor-pointer" onClick={() => navigate(homePath)}>
              <div className="h-10 w-10 shrink-0 rounded-lg bg-white flex items-center justify-center overflow-hidden sm:h-12 sm:w-12">
                {logoUrl ? (
                  <img src={logoUrl} alt={name} className="h-9 w-9 object-contain sm:h-10 sm:w-10" onError={(e) => { e.currentTarget.style.display = "none" }} />
                ) : (
                  <span className="text-sm font-bold text-neutral-900">{name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <span className="hidden max-w-40 truncate text-[var(--primary)] font-extrabold text-xl ml-1 tracking-tight sm:block" title={name}>
                {name}
              </span>
            </div>

            <div className="flex items-center pl-1 sm:pl-3 border-l border-neutral-200 ml-1 sm:ml-2">
              <button
                type="button"
                role="switch"
                aria-checked={maintenanceOn}
                aria-label="Maintenance mode"
                onClick={handleToggleMaintenance}
                disabled={isUpdatingMaintenance || !settings}
                title={maintenanceOn
                  ? `Maintenance Mode is ACTIVE: Customer ordering is suspended.${canToggleMaintenance ? " Click to turn OFF." : ""}`
                  : `Maintenance Mode is OFF: Platform is live.${canToggleMaintenance ? " Click to turn ON." : ""}`}
                className={`group relative flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 sm:py-1.5 rounded-full border transition-all duration-200 select-none ${
                  maintenanceOn
                    ? "bg-amber-50 border-amber-300 text-amber-900 shadow-sm hover:bg-amber-100/80"
                    : "bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                } ${isUpdatingMaintenance ? "opacity-70 cursor-wait" : "cursor-pointer"}`}
              >
                <span className="relative flex h-2 w-2 shrink-0">
                  {maintenanceOn ? (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                    </>
                  ) : (
                    <span className="inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  )}
                </span>
                <span className="text-xs font-semibold tracking-tight hidden sm:inline">Maintenance</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded leading-none transition-colors ${maintenanceOn ? "bg-amber-200 text-amber-900" : "bg-neutral-200/80 text-neutral-600"}`}>
                  {maintenanceOn ? "ON" : "OFF"}
                </span>
                {canToggleMaintenance && (
                  <div className={`relative inline-flex h-4 w-7 sm:h-5 sm:w-9 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out ${maintenanceOn ? "bg-amber-500" : "bg-neutral-300"}`}>
                    {isUpdatingMaintenance ? (
                      <Loader2 className="absolute inset-0 m-auto h-2.5 w-2.5 sm:h-3 sm:w-3 animate-spin text-white" />
                    ) : (
                      <span className={`pointer-events-none inline-block h-3 w-3 sm:h-3.5 sm:w-3.5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${maintenanceOn ? "translate-x-3.5 sm:translate-x-4" : "translate-x-0.5 sm:translate-x-1"}`} />
                    )}
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Center: search */}
          {search && (
            <div className="hidden flex-1 justify-center max-w-md mx-4 md:flex xl:mx-8">
              <button
                onClick={() => setSearchOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-100 text-neutral-600 cursor-pointer hover:bg-neutral-200 transition-colors w-full border border-neutral-200"
              >
                <Search className="w-4 h-4 text-neutral-700" />
                <span className="text-sm flex-1 text-left text-neutral-700">Search</span>
                <span className="text-xs px-2 py-0.5 rounded bg-white text-neutral-600 border border-neutral-200">Ctrl+K</span>
              </button>
            </div>
          )}

          {/* Right: extra controls, search (mobile), notifications, profile */}
          <div className="flex shrink-0 items-center gap-1 sm:gap-2 md:gap-3">
            {extra}

            {search && (
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50 text-neutral-700 md:hidden"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </button>
            )}

            {loadAlerts && (
              <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="relative h-10 w-10 rounded-full border border-neutral-200 bg-neutral-50 text-neutral-700 flex items-center justify-center hover:bg-neutral-100 transition-colors sm:h-11 sm:w-11"
                    aria-label="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {alerts.length > 0 && (
                      <span className="absolute top-2 right-2 min-w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
                        {alerts.length > 9 ? "9+" : alerts.length}
                      </span>
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-[calc(100vw-2rem)] sm:w-96 p-0 mt-2 border border-neutral-200 shadow-2xl rounded-2xl overflow-hidden" align="end">
                  <div className="bg-white">
                    <div className="px-4 py-3 border-b border-neutral-200 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-neutral-900">Notifications</p>
                        <p className="text-xs text-neutral-500">{alertsSubtitle}</p>
                      </div>
                      {alertsPath && (
                        <button
                          type="button"
                          onClick={() => { setNotificationsOpen(false); navigate(alertsPath) }}
                          className="text-xs font-semibold text-amber-600 hover:text-amber-700"
                        >
                          View all
                        </button>
                      )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {alerts.length === 0 ? (
                        <div className="px-6 py-10 text-center flex flex-col items-center gap-2">
                          <BellOff className="w-9 h-9 text-neutral-300" />
                          <p className="text-sm text-neutral-500">No notifications yet</p>
                        </div>
                      ) : (
                        alerts.slice(0, 8).map((a) => (
                          <div key={a.id} className="w-full text-left px-4 py-4 border-b border-neutral-100 last:border-b-0">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-neutral-900 truncate">{a.title}</p>
                                <p className="text-xs text-neutral-600 mt-1 line-clamp-2">{a.detail}</p>
                              </div>
                              <span className={`shrink-0 text-[10px] font-semibold ${a.critical ? "text-red-500" : "text-amber-600"}`}>{a.tag}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-2 pl-3 border-l border-neutral-200 cursor-pointer hover:bg-neutral-100 rounded-md px-2 py-1 transition-colors">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-700 md:hidden">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="hidden md:block max-w-[180px]">
                    <p className="text-sm font-medium text-neutral-900 truncate">{user?.name || "Admin User"}</p>
                    <p className="text-xs text-neutral-500 truncate">{maskEmail(user?.email)}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-neutral-700 hidden md:block" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 bg-white border border-neutral-200 rounded-lg shadow-lg z-50 text-neutral-900">
                <div className="p-4 border-b border-neutral-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 shrink-0 rounded-full bg-neutral-100 flex items-center justify-center overflow-hidden border border-neutral-300">
                      {user?.profileImage ? (
                        <img src={user.profileImage} alt={user.name || "Admin"} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg font-semibold text-neutral-600">{initials(user?.name)}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-neutral-900 truncate">{user?.name || "Admin User"}</p>
                      <p className="text-xs text-neutral-500 truncate">{maskEmail(user?.email)}</p>
                    </div>
                  </div>
                </div>
                {menuItems.length > 0 && (
                  <DropdownMenuGroup>
                    {menuItems.map((item) => (
                      <DropdownMenuItem key={item.label} className="cursor-pointer hover:bg-neutral-100 focus:bg-neutral-100" onClick={item.onClick}>
                        <item.icon className="mr-2 w-4 h-4" />
                        <span>{item.label}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer text-red-600 hover:bg-red-50 focus:bg-red-50" onClick={onLogout}>
                  <LogOut className="mr-2 w-4 h-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Search */}
      {search && (
        <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
          <DialogContent className="max-w-2xl p-0 bg-white border border-neutral-200">
            <DialogHeader className="p-6 pb-4 border-b border-neutral-200">
              <DialogTitle className="text-xl font-semibold text-neutral-900">Universal Search</DialogTitle>
            </DialogHeader>
            <div className="p-6">
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-md border border-neutral-300 bg-white pl-10 pr-4 py-3 text-base text-neutral-900 placeholder:text-neutral-500 outline-none focus:border-neutral-900 focus:ring-[3px] focus:ring-neutral-900/40"
                />
              </div>

              {searchQuery.trim() === "" ? (
                <div className="space-y-4">
                  {quickActions.length > 0 && (
                    <>
                      <div className="text-sm text-neutral-500 mb-4">Quick Actions</div>
                      <div className="grid grid-cols-2 gap-3">
                        {quickActions.map((action) => (
                          <button
                            key={action.label}
                            onClick={() => { setSearchOpen(false); navigate(action.path) }}
                            className="flex items-center gap-3 p-4 rounded-lg border border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50 transition-all"
                          >
                            <div className="p-2 rounded-md bg-black text-white">
                              <action.icon className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-medium text-neutral-900">{action.label}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                  {recentSearches.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-neutral-200">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-neutral-500">Recent Searches</p>
                        <button onClick={clearRecent} className="text-[10px] text-red-500 hover:underline">Clear All</button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {recentSearches.map((term) => (
                          <button key={term} onClick={() => setSearchQuery(term)} className="px-3 py-1 text-xs bg-neutral-100 hover:bg-neutral-200 rounded-full text-neutral-700 transition-colors">
                            {term}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {isSearching ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-3" />
                      <p className="text-sm text-neutral-500">Searching...</p>
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="text-center py-12">
                      <AlertCircle className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                      <p className="text-sm text-neutral-500">
                        {searchQuery.trim().length < 2 ? "Type at least 2 characters" : `No results found for "${searchQuery}"`}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="text-sm text-neutral-600 mb-3 ml-1">
                        {searchResults.length} result{searchResults.length !== 1 ? "s" : ""} found
                      </div>
                      {Object.entries(groupedResults).map(([type, results]) => (
                        <div key={type} className="mb-4">
                          <div className="flex items-center gap-2 mb-2 px-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">{type}s</span>
                            <div className="h-px flex-1 bg-neutral-100" />
                          </div>
                          <div className="space-y-2">
                            {results.map((result) => {
                              const Icon = result.icon || FileText
                              return (
                                <button
                                  key={`${type}-${result.id}`}
                                  onClick={() => handleResultClick(result)}
                                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-neutral-100 hover:border-neutral-200 hover:bg-neutral-50 transition-all text-left group"
                                >
                                  <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-500 group-hover:bg-white group-hover:text-black transition-colors">
                                    <Icon className="w-5 h-5" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-neutral-900 truncate">{result.title}</p>
                                    <p className="text-xs text-neutral-500 truncate mt-0.5">{result.description}</p>
                                  </div>
                                  <ArrowRight className="w-4 h-4 text-neutral-300 group-hover:text-black group-hover:translate-x-0.5 transition-all" />
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

/** Search over a panel's sidebar menu: every page whose name matches, as search results that open the page. */
export function searchMenuPages(menu, query) {
  const q = query.toLowerCase()
  const pages = menu.flatMap((entry) => (entry.type === "section" ? entry.items.map((i) => ({ ...i, section: entry.label })) : [entry]))
  return pages
    .filter((p) => p.label.toLowerCase().includes(q) || String(p.section || "").toLowerCase().includes(q))
    .slice(0, 10)
    .map((p) => ({ id: p.path, type: "Page", title: p.label, description: p.section ? `${p.section}` : "Page", path: p.path }))
}
