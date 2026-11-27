import { authKey } from "@/shared/utils/authNamespace";
import React, { useState, useEffect } from "react"
import { useNavigate, useSearchParams, useLocation } from "react-router-dom"
import { User, Calendar, ChevronDown, Store, Package, ClipboardList, Users, Sun, Moon } from "lucide-react"
import { toast } from "sonner"
import { Popover, PopoverContent, PopoverTrigger } from "@food/components/ui/popover"
import PanelNavbar, { searchMenuPages } from "@food/components/PanelNavbar"
import { adminAPI } from "@food/api"
import { clearModuleAuth, getModuleRefreshToken } from "@food/utils/auth"
import { useSystemTheme } from "@/shared/utils/themeSync"
import { franchiseAdminSidebarMenu } from "./franchiseAdminSidebarMenu"

// Franchise admin top bar (Jharkhand Rasoi admin header): maintenance status, search over this panel's pages and the
// franchise's stores, low-stock alerts, the dashboard's date filter, and the profile menu.

const FA = "/franchise-admin"
const DATE_LABELS = {
  today: "Today",
  yesterday: "Yesterday",
  week: "Last 7 Days",
  thirty: "Last 30 Days",
  month: "This Month",
  custom: "Custom Range",
}

/** The dashboard's period (?date=&start=&end= in the URL, read by the dashboard widgets). */
function DateFilter() {
  const [searchParams, setSearchParams] = useSearchParams()
  const dateFilter = searchParams.get("date") || "today"
  const [open, setOpen] = useState(false)
  const [showCustom, setShowCustom] = useState(false)
  const [customStart, setCustomStart] = useState(searchParams.get("start") || "")
  const [customEnd, setCustomEnd] = useState(searchParams.get("end") || "")

  const select = (filter) => {
    if (filter === "custom") { setShowCustom(true); return }
    const params = new URLSearchParams(searchParams)
    params.set("date", filter)
    params.delete("start")
    params.delete("end")
    setSearchParams(params)
    setShowCustom(false)
    setOpen(false)
  }

  const applyCustom = (e) => {
    e.preventDefault()
    if (!customStart || !customEnd) return
    const params = new URLSearchParams(searchParams)
    params.set("date", "custom")
    params.set("start", customStart)
    params.set("end", customEnd)
    setSearchParams(params)
    setShowCustom(false)
    setOpen(false)
    toast.success(`Date filter: ${customStart} to ${customEnd}`)
  }

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) setShowCustom(false) }}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 h-10 px-3 rounded-full border border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100 transition-colors text-sm"
        >
          <Calendar className="w-4 h-4" />
          <span className="hidden sm:inline">
            {dateFilter === "custom" && searchParams.get("start") ? `${searchParams.get("start")} – ${searchParams.get("end")}` : DATE_LABELS[dateFilter]}
          </span>
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-1.5 mt-2 bg-white border border-neutral-200 rounded-lg shadow-lg">
        {!showCustom ? (
          Object.entries(DATE_LABELS).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => select(key)}
              className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${dateFilter === key ? "bg-neutral-100 text-neutral-900 font-medium" : "text-neutral-700 hover:bg-neutral-50"}`}
            >
              {label}
            </button>
          ))
        ) : (
          <form onSubmit={applyCustom} className="p-2 space-y-3">
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-slate-700">Start date</label>
              <input type="date" required value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 focus:border-[var(--primary)]" />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-slate-700">End date</label>
              <input type="date" required value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 focus:border-[var(--primary)]" />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowCustom(false)} className="flex-1 py-2 text-sm font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50">Back</button>
              <button type="submit" className="flex-1 py-2 text-sm font-medium rounded-lg bg-[var(--primary)] text-white hover:opacity-90">Apply</button>
            </div>
          </form>
        )}
      </PopoverContent>
    </Popover>
  )
}

export default function Navbar({ onToggleSidebar }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { themeMode } = useSystemTheme()
  const [adminData, setAdminData] = useState(null)
  const [franchiseData, setFranchiseData] = useState(null)
  const [storeList, setStoreList] = useState([])

  useEffect(() => {
    try { setAdminData(JSON.parse(localStorage.getItem(authKey("admin", "user")) || "null")) } catch (_) {}
    adminAPI.getMyFranchise()
      .then((res) => { if (res?.data?.data?.franchise) setFranchiseData(res.data.data.franchise) })
      .catch(() => {})
    adminAPI.getStores()
      .then((res) => {
        const data = res?.data?.data
        setStoreList(data?.stores || (Array.isArray(data) ? data : []))
      })
      .catch(() => {})
  }, [])

  const handleLogout = async () => {
    try {
      const token = getModuleRefreshToken("admin")
      if (token) await adminAPI.logout(token).catch(() => null)
    } finally {
      clearModuleAuth("admin")
      navigate(`${FA}/login`, { replace: true })
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
      homePath={`${FA}/dashboard`}
      title={franchiseData?.name}
      recentKey="franchise_recent_searches"
      search={async (q) => {
        const stores = storeList
          .filter((s) => String(s.storeName || s.name || "").toLowerCase().includes(q.toLowerCase()))
          .slice(0, 5)
          .map((s) => ({ id: String(s._id || s.id), type: "Store", title: s.storeName || s.name, description: s.city || s.approvalStatus || "Store", path: `${FA}/stores`, icon: Store }))
        return [...searchMenuPages(franchiseAdminSidebarMenu, q), ...stores]
      }}
      quickActions={[
        { icon: ClipboardList, label: "Live Orders", path: `${FA}/live-orders` },
        { icon: Store, label: "Stores", path: `${FA}/stores` },
        { icon: Users, label: "Customers", path: `${FA}/customers-list` },
        { icon: Package, label: "Stock Levels", path: `${FA}/stock-levels` },
      ]}
      loadAlerts={async () => {
        const res = await adminAPI.getDashboardInventoryAlerts({})
        return (res?.data?.data || []).map((a) => ({
          id: a.id,
          title: `Low stock: ${a.ingredient}`,
          detail: `${a.store}: ${a.currentStock} ${a.unit} left (reorder at ${a.reorderLevel})`,
          tag: a.severity || "alert",
          critical: a.severity === "critical",
        }))
      }}
      alertsSubtitle="Low-stock alerts from your stores"
      alertsPath={`${FA}/low-stock-alerts`}
      user={{
        name: franchiseData?.ownerName || adminData?.name || "Franchise Admin",
        email: franchiseData?.email || adminData?.email,
        profileImage: adminData?.profileImage,
      }}
      menuItems={[
        { icon: User, label: "Profile", onClick: () => navigate(`${FA}/dashboard/profile`) },
        { icon: themeMode === "dark" ? Sun : Moon, label: themeMode === "dark" ? "Light mode" : "Dark mode", onClick: toggleTheme },
      ]}
      onLogout={handleLogout}
      extra={/^\/franchise-admin\/dashboard\/?$/.test(location.pathname) ? <DateFilter /> : null}
    />
  )
}
