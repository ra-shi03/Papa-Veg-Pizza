import React from "react"
import { useNavigate } from "react-router-dom"
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
} from "lucide-react"

const BASE = "/food/superadmin"

const menu = [
  {
    type: "section",
    label: "Core Dashboard",
    items: [{ label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" }],
  },
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
]

export default function Sidebar({ isOpen, onClose, activeItem, setActiveItem }) {
  const navigate = useNavigate()
  return (
    <PanelSidebar
      isOpen={isOpen}
      onClose={onClose}
      panelLabel="Super Admin Panel"
      menu={menu}
      isActive={(item) => item.label === activeItem}
      onNavigate={(item) => {
        setActiveItem?.(item.label)
        navigate(`${BASE}${item.path}`)
      }}
    />
  )
}
