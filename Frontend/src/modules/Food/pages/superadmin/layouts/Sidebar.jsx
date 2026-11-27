import React from "react"
import { useNavigate, useLocation } from "react-router-dom"
import PanelSidebar from "@food/components/PanelSidebar"
import {
  Home,
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
  Ticket,
  Trophy,
  CreditCard,
  Settings,
  Search,
  FileText,
  LifeBuoy,
  Star,
  Bike,
  ShieldAlert,
  Smartphone,
  Award,
  ShoppingCart,
  Apple,
  LogIn,
  Globe,
  Lock,
  Receipt,
  X,
  Bell,
  BellRing,
  ToggleLeft,
  Palette,
  KeyRound,
  Image as ImageIcon,
  Code,
  ListChecks,
} from "lucide-react"

const BASE = "/food/superadmin"

const menu = [
  { type: "link", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  {
    type: "section",
    label: "User Management",
    items: [
      { label: "Customers", icon: Users, path: "/customers" },
      { label: "Franchise Owners", icon: UserCheck, path: "/franchises" },
      { label: "Store Managers", icon: UserCog, path: "/managers" },
      { label: "Delivery Partners", icon: Truck, path: "/delivery-partners" },
      { label: "Kitchen Staff", icon: ChefHat, path: "/kitchen-staff" },
      { label: "Roles & Permissions", icon: ShieldCheck, path: "/roles-permissions" },
    ],
  },
  {
    type: "section",
    label: "Franchise Management",
    items: [
      { label: "Franchise Stores", icon: Store, path: "/franchise-stores" },
      { label: "Franchise Approvals", icon: FileCheck, path: "/franchise-approvals" },
      { label: "Regions & Zones", icon: Map, path: "/regions-zones" },
      { label: "Territory Management", icon: MapPin, path: "/territory-management" },
    ],
  },
  {
    type: "section",
    label: "Product Management",
    items: [
      { label: "Products", icon: Pizza, path: "/products" },
      { label: "Categories", icon: Grid, path: "/categories" },
      { label: "Add-ons / Toppings", icon: Sparkles, path: "/addons" },
      { label: "Combos & Deals", icon: Gift, path: "/combos-deals" },
    ],
  },
  {
    type: "section",
    label: "Order Management",
    items: [
      { label: "All Orders", icon: ClipboardList, path: "/orders" },
      { label: "Order Tracking", icon: Truck, path: "/order-tracking" },
      { label: "Bulk Orders", icon: Users, path: "/bulk-orders" },
      { label: "Refund Requests", icon: FileX, path: "/refund-requests" },
      { label: "Payouts", icon: CreditCard, path: "/payouts" },
    ],
  },
  {
    type: "section",
    label: "Marketing",
    items: [
      { label: "Coupons", icon: Ticket, path: "/coupons" },
      { label: "Rewards Program", icon: Trophy, path: "/rewards" },
    ],
  },
  {
    type: "section",
    label: "Settings",
    items: [
      { label: "Settings", icon: Settings, path: "/settings" },
      { label: "App Configuration", icon: Settings, path: "/app-configuration" },
      { label: "Fees & Charges", icon: CreditCard, path: "/fees-and-charges" },
      { label: "Payment Gateways", icon: CreditCard, path: "/payment-gateways" },
      { label: "Content Management", icon: FileText, path: "/content-management" },
    ],
  },
  {
    type: "section",
    label: "Support",
    items: [
      { label: "Customer Complaints", icon: ShieldAlert, path: "/customer-complaints" },
      { label: "Support Requests", icon: LifeBuoy, path: "/support-requests" },
      { label: "Feedback & Reviews", icon: Star, path: "/feedback-reviews" },
    ],
  },
  {
    type: "section",
    label: "User App",
    items: [
      { label: "Welcome Page", icon: Smartphone, path: "/user-app/welcome-page" },
      { label: "Home Page", icon: Home, path: "/user-app/home-page" },
      { label: "Promise Campaign", icon: Award, path: "/user-app/promise-campaign" },
      { label: "Showcase Sections", icon: Sparkles, path: "/user-app/showcase-sections" },
      { label: "Search Overlay", icon: Search, path: "/user-app/search-config" },
      { label: "Combo Page", icon: Sparkles, path: "/user-app/combo-page" },
      { label: "Cart & Upsell", icon: ShoppingCart, path: "/user-app/cart-config" },
      { label: "Hero Banners", icon: Sparkles, path: "/user-app/hero-banners" },
      { label: "Nutrition Info", icon: Apple, path: "/user-app/nutrition" },
    ],
  },
  {
    type: "section",
    label: "Delivery App",
    items: [
      { label: "Delivery Welcome Page", icon: Bike, path: "/delivery-app/welcome-page" },
      { label: "Delivery Login Page", icon: LogIn, path: "/delivery-app/login-page" },
    ],
  },
  // Sections ported from the Jharkhand Rasoi admin
  {
    type: "section",
    label: "Report Management",
    items: [
      { label: "Daily Sales & Cash Audit", icon: Receipt, path: "/reports/daily-sales" },
      { label: "Transaction Report", icon: FileText, path: "/reports/transactions" },
      { label: "Order Report", icon: ClipboardList, path: "/reports/orders" },
      { label: "Tax Report", icon: Receipt, path: "/reports/tax" },
      { label: "Store Report", icon: Store, path: "/reports/stores" },
      { label: "Customer Feedback", icon: Star, path: "/reports/feedback-experience" },
    ],
  },
  {
    type: "section",
    label: "System Settings",
    items: [
      { label: "Broadcast Notification", icon: Bell, path: "/system/broadcast-notification" },
      { label: "Store Delay Alerts", icon: BellRing, path: "/system/store-delay-alerts" },
      { label: "Toggle Management", icon: ToggleLeft, path: "/system/toggle-management" },
      { label: "Business Setup", icon: Settings, path: "/system/business-setup" },
      { label: "Theme Settings", icon: Palette, path: "/system/theme-settings" },
    ],
  },
  {
    type: "section",
    label: "Pages & Social Media",
    items: [
      { label: "About Us", icon: Globe, path: "/pages-social-media/about" },
      { label: "Terms & Conditions", icon: FileText, path: "/pages-social-media/terms" },
      { label: "Privacy Policy", icon: Lock, path: "/pages-social-media/privacy" },
      { label: "Refund Policy", icon: Receipt, path: "/pages-social-media/refund" },
      { label: "Shipping Policy", icon: Truck, path: "/pages-social-media/shipping" },
      { label: "Cancellation Policy", icon: X, path: "/pages-social-media/cancellation" },
    ],
  },
  {
    type: "section",
    label: "Developer",
    items: [
      { label: "Env Managements", icon: KeyRound, path: "/developer/env" },
      { label: "Image Setting", icon: ImageIcon, path: "/developer/image-setting" },
      { label: "Developer Settings", icon: Code, path: "/developer/settings" },
      { label: "Payment Reconciliation", icon: ListChecks, path: "/developer/payment-reconciliation" },
    ],
  },
]

// Every menu path, longest first: the current page is the item whose path matches the URL most specifically
const ALL_PATHS = menu
  .flatMap((entry) => (entry.type === "section" ? entry.items : [entry]))
  .map((item) => item.path)
  .sort((a, b) => b.length - a.length)

/** The menu path of the page that is open (the URL without its /superadmin or /food/superadmin prefix). */
function activePathOf(pathname) {
  const rel = pathname.replace(/^(\/food)?\/superadmin/, "").replace(/\/+$/, "") || "/dashboard"
  return ALL_PATHS.find((p) => rel === p || rel.startsWith(`${p}/`)) || null
}

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate()
  const location = useLocation()
  const activePath = activePathOf(location.pathname)
  return (
    <PanelSidebar
      isOpen={isOpen}
      onClose={onClose}
      panelLabel="Super Admin Panel"
      menu={menu}
      isActive={(item) => item.path === activePath}
      onNavigate={(item) => navigate(`${BASE}${item.path}`)}
    />
  )
}
