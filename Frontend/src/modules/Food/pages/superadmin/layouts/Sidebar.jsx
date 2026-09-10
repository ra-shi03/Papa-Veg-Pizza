import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useSystemTheme } from "@/shared/utils/themeSync"
import {
  LayoutDashboard,
  Users,
  UserCheck,
  UserCog,
  Truck,
  ChefHat,
  ShieldCheck,
  Store,
  FileCheck,
  Map,
  MapPin,
  Pizza,
  Grid,
  Sparkles,
  Gift,
  ClipboardList,
  FileX,
  Activity,
  Ticket,
  Trophy,
  Megaphone,
  Image,
  Bell,
  CreditCard,
  History,
  Percent,
  TrendingUp,
  Landmark,
  BarChart3,
  LineChart,
  PieChart,
  Settings,
  DollarSign,
  Search,
  FileText,
  LifeBuoy,
  Star,
  Bike,
  ShieldAlert,
  X,
  ChevronLeft,
  ChevronRight
} from "lucide-react"

export default function Sidebar({ isOpen, onClose, activeItem, setActiveItem, isCollapsed = false, onToggleCollapse }) {
  const navigate = useNavigate()
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
  const [expandedGroups, setExpandedGroups] = useState({
    "Core Dashboard": true,
    "User Management": true,
    "Franchise Management": false,
    "Product Management": false,
    "Order System": false,
    "Marketing": false,
    "Financial": false,
    "Analytics & Reports": false,
    "CMS / Settings": false,
    "Support": false,
  })

  const toggleGroup = (groupTitle) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupTitle]: !prev[groupTitle]
    }))
  }

  const menuGroups = [
    {
      title: "Core Dashboard",
      items: [
        { name: "Dashboard", icon: LayoutDashboard }
      ]
    },
    {
      title: "User Management",
      items: [
        { name: "Customers", icon: Users },
        { name: "Franchise Owners", icon: UserCheck },
        { name: "Store Managers", icon: UserCog },
        { name: "Delivery Partners", icon: Truck },
        { name: "Kitchen Staff", icon: ChefHat },
        { name: "Roles & Permissions", icon: ShieldCheck }
      ]
    },
    {
      title: "Franchise Management",
      items: [
        { name: "Franchise Stores", icon: Store },
        { name: "Franchise Approvals", icon: FileCheck },
        { name: "Regions & Zones", icon: Map },
        { name: "Territory Management", icon: MapPin }
      ]
    },
    {
      title: "Product Management",
      items: [
        { name: "Products", icon: Pizza },
        { name: "Categories", icon: Grid },
        { name: "Add-ons / Toppings", icon: Sparkles },
        { name: "Combos & Deals", icon: Gift },
        { name: "Global Pricing", icon: DollarSign }
      ]
    },
    {
      title: "Order Management",
      items: [
        { name: "All Orders", icon: ClipboardList },
        { name: "Order Tracking", icon: Truck },
        { name: "Refund Requests", icon: FileX },
        { name: "Disputes", icon: Activity }
      ]
    },
    {
      title: "Financial",
      items: [
        { name: "Revenue", icon: TrendingUp },
        { name: "Franchise Commissions", icon: Percent },
        { name: "Payouts", icon: Landmark },
        { name: "Transactions", icon: History },
        { name: "Tax Reports", icon: FileText }
      ]
    },
    {
      title: "Marketing",
      items: [
        { name: "Coupons", icon: Ticket },
        { name: "Campaigns", icon: Megaphone },
        { name: "Push Notifications", icon: Bell },
        { name: "Banners", icon: Image },
        { name: "Loyalty Program", icon: Trophy }
      ]
    },
    {
      title: "Analytics & Reports",
      items: [
        { name: "Sales Analytics", icon: BarChart3 },
        { name: "Customer Analytics", icon: LineChart },
        { name: "Store Analytics", icon: Store },
        { name: "Delivery Analytics", icon: Bike },
        { name: "Growth Reports", icon: TrendingUp }
      ]
    },
    {
      title: "Settings",
      items: [
        { name: "Settings", icon: Settings },
        { name: "App Configuration", icon: Settings },
        { name: "Payment Gateways", icon: CreditCard },
        { name: "Notification Settings", icon: Bell },
        { name: "Audit Logs", icon: ClipboardList },
        { name: "Content Management", icon: FileText }
      ]
    },
    {
      title: "Support",
      items: [
        { name: "Customer Complaints", icon: ShieldAlert },
        { name: "Franchise Tickets", icon: Ticket },
        { name: "Support Requests", icon: LifeBuoy },
        { name: "Feedback & Reviews", icon: Star }
      ]
    }
  ]

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
                <Pizza size={20} className="stroke-[2.5]" />
              </div>
            )}
            {!displayCollapsed && (
              <div className="animate-fade-in whitespace-nowrap">
                <p className="font-semibold text-black dark:text-white leading-tight text-sm">Papa Veg Admin</p>
                <p className="text-[10px] text-black dark:text-white font-medium">Global Manager</p>
              </div>
            )}
          </div>
          
          {/* Collapse Toggle Button (Desktop Only) */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1 rounded-md text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
            title={displayCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {displayCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-black dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 lg:hidden transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search bar section */}
        <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800">
          <div className="relative flex items-center bg-zinc-50 dark:bg-zinc-950 rounded-lg px-2 py-1.5 border border-zinc-200 dark:border-zinc-800 focus-within:border-[var(--primary)] transition-all">
            <Search size={15} className="text-zinc-400 shrink-0 mx-auto" />
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
          {menuGroups
            .map((group) => {
              const matchedItems = group.items.filter((item) =>
                item.name.toLowerCase().includes(searchQuery.toLowerCase())
              )
              return { ...group, items: matchedItems }
            })
            .filter((group) => group.items.length > 0)
            .map((group, groupIdx) => {
              const isExpanded = searchQuery ? true : expandedGroups[group.title]
              return (
                <div key={groupIdx} className="space-y-1">
                  {!displayCollapsed ? (
                    <button
                      onClick={() => toggleGroup(group.title)}
                      className="w-full flex items-center justify-between px-3.5 py-1.5 text-[10px] font-bold text-black dark:text-white uppercase tracking-widest hover:opacity-80 transition-colors focus:outline-none"
                    >
                      <span>{group.title}</span>
                      <span className={`transition-transform duration-200 text-black dark:text-white ${isExpanded ? 'rotate-180' : ''}`}>
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
                      {group.items.map((item, itemIdx) => {
                        const Icon = item.icon
                        const isActive = activeItem === item.name
                        return (
                          <button
                            key={itemIdx}
                            title={displayCollapsed ? item.name : undefined}
                            onClick={() => {
                              setActiveItem(item.name)
                              if (item.name === "Dashboard") {
                                navigate("/food/superadmin/dashboard")
                              } else if (item.name === "Customers") {
                                navigate("/food/superadmin/customers")
                              } else if (item.name === "Franchise Stores") {
                                navigate("/food/superadmin/franchise-stores")
                              } else if (item.name === "Franchise Approvals") {
                                navigate("/food/superadmin/franchise-approvals")
                              } else if (item.name === "Regions & Zones") {
                                navigate("/food/superadmin/regions-zones")
                              } else if (item.name === "Territory Management") {
                                navigate("/food/superadmin/territory-management")
                              } else if (item.name === "Products") {
                                navigate("/food/superadmin/products")
                              } else if (item.name === "Categories") {
                                navigate("/food/superadmin/categories")
                              } else if (item.name === "Add-ons / Toppings") {
                                navigate("/food/superadmin/addons")
                              } else if (item.name === "Combos & Deals") {
                                navigate("/food/superadmin/combos-deals")
                              } else if (item.name === "Global Pricing") {
                                navigate("/food/superadmin/global-pricing")
                              } else if (item.name === "All Orders") {
                                navigate("/food/superadmin/orders")
                              } else if (item.name === "Order Tracking") {
                                navigate("/food/superadmin/order-tracking")
                              } else if (item.name === "Disputes") {
                                navigate("/food/superadmin/disputes")
                              } else if (item.name === "Refund Requests") {
                                navigate("/food/superadmin/refund-requests")
                              } else if (item.name === "Coupons") {
                                navigate("/food/superadmin/coupons")
                              } else if (item.name === "Campaigns") {
                                navigate("/food/superadmin/campaigns")
                              } else if (item.name === "Push Notifications") {
                                navigate("/food/superadmin/push-notifications")
                              } else if (item.name === "Banners") {
                                navigate("/food/superadmin/banners")
                              } else if (item.name === "Loyalty Program") {
                                navigate("/food/superadmin/loyalty")
                              } else if (item.name === "Tax Reports") {
                                navigate("/food/superadmin/tax-reports")
                              } else if (item.name === "Transactions") {
                                navigate("/food/superadmin/transactions")
                              } else if (item.name === "Franchise Commissions") {
                                navigate("/food/superadmin/commissions")
                              } else if (item.name === "Payouts") {
                                navigate("/food/superadmin/payouts")
                              } else if (item.name === "Revenue") {
                                navigate("/food/superadmin/revenue")
                              } else if (item.name === "Sales Analytics") {
                                navigate("/food/superadmin/sales-analytics")
                              } else if (item.name === "Customer Analytics") {
                                navigate("/food/superadmin/customer-analytics")
                              } else if (item.name === "Store Analytics") {
                                navigate("/food/superadmin/store-analytics")
                              } else if (item.name === "Delivery Analytics") {
                                navigate("/food/superadmin/delivery-analytics")
                              } else if (item.name === "Growth Reports") {
                                navigate("/food/superadmin/growth-reports")
                              } else if (item.name === "Settings") {
                                navigate("/food/superadmin/settings")
                              } else if (item.name === "App Configuration") {
                                navigate("/food/superadmin/app-configuration")
                              } else if (item.name === "Payment Gateways") {
                                navigate("/food/superadmin/payment-gateways")
                              } else if (item.name === "Notification Settings") {
                                navigate("/food/superadmin/notification-settings")
                              } else if (item.name === "Audit Logs") {
                                navigate("/food/superadmin/audit-logs")
                              } else if (item.name === "Content Management") {
                                navigate("/food/superadmin/content-management")
                              } else if (item.name === "Franchise Tickets") {
                                navigate("/food/superadmin/franchise-tickets")
                              } else if (item.name === "Support Requests") {
                                navigate("/food/superadmin/support-requests")
                              } else if (item.name === "Customer Complaints") {
                                navigate("/food/superadmin/customer-complaints")
                              } else if (item.name === "Feedback & Reviews") {
                                navigate("/food/superadmin/feedback-reviews")
                              } else if (item.name === "Franchise Owners") {
                                navigate("/food/superadmin/franchises")
                              } else if (item.name === "Store Managers") {
                                navigate("/food/superadmin/managers")
                              } else if (item.name === "Delivery Partners") {
                                navigate("/food/superadmin/delivery-partners")
                              } else if (item.name === "Kitchen Staff") {
                                navigate("/food/superadmin/kitchen-staff")
                              } else if (item.name === "Roles & Permissions") {
                                navigate("/food/superadmin/roles-permissions")
                              }
                              // On mobile, close sidebar when clicking a menu item
                              if (window.innerWidth < 1024) {
                                onClose()
                              }
                            }}
                            className={`w-full flex items-center rounded-md text-xs font-semibold transition-all duration-200 text-left group border border-transparent ${
                              displayCollapsed ? "justify-center px-0 py-2.5" : "gap-2 px-2.5 py-1.5"
                            } ${isActive
                              ? "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-100 dark:border-red-900/30 shadow-sm"
                              : "text-black dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-[var(--primary)]"
                              }`}
                          >
                            <Icon
                              size={15}
                              className={`shrink-0 transition-transform duration-300 ${isActive ? "text-red-600 dark:text-red-400" : "text-black dark:text-white group-hover:text-[var(--primary)]"}`}
                            />
                            {!displayCollapsed && <span className="leading-snug">{item.name}</span>}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
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
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">System: 99% Online</span>
              </div>
              <p className="text-[9px] text-black dark:text-white font-medium leading-normal">Server Central-AP-1 Active</p>
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
