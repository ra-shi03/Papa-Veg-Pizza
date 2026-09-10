import React, { Suspense, lazy, useState, useEffect } from "react"
import { Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom"
import { useSystemTheme } from "@/shared/utils/themeSync"
import ProtectedRoute from "@food/components/ProtectedRoute"
import Sidebar from "../layouts/Sidebar"
import Navbar from "../layouts/Navbar"

// Lazy load components for optimal bundle splitting
const SuperAdminDashboard = lazy(() => import("../Dashboard/SuperAdminDashboard"))
const CustomerAnalysis = lazy(() => import("../userManagement/CustomerAnalysis"))
const CustomerList = lazy(() => import("../userManagement/CustomerList"))
const UserProfile = lazy(() => import("../userManagement/UserProfile"))
const FranchiseStores = lazy(() => import("../franchiseManagement/FranchiseStores"))
const FranchiseApprovals = lazy(() => import("../franchiseManagement/FranchiseApprovals"))
const RegionsZones = lazy(() => import("../franchiseManagement/RegionsZones"))
const TerritoryManagement = lazy(() => import("../franchiseManagement/TerritoryManagement"))
const FranchiseList = lazy(() => import("../userManagement/FranchiseList"))
const StoreManagers = lazy(() => import("../userManagement/StoreManagers"))
const StoreManagersList = lazy(() => import("../userManagement/StoreManagersList"))
const DeliveryPartnersManagement = lazy(() => import("../userManagement/DeliveryPartnersManagement"))
const KitchenStaffManagement = lazy(() => import("../userManagement/KitchenStaffManagement"))
const RolesPermissionManagement = lazy(() => import("../userManagement/RolesPermissionManagement"))
const ProductsManagement = lazy(() => import("../productsManagement/ProductsManagement"))
const CategoriesManagement = lazy(() => import("../productsManagement/CategoriesManagement"))
const Addons = lazy(() => import("../productsManagement/Addons"))
const ComboDeals = lazy(() => import("../productsManagement/ComboDeals"))
const GlobalPrice = lazy(() => import("../productsManagement/GlobalPrice"))
const AllOrders = lazy(() => import("../orderManagement/AllOrders"))
const OrderTracking = lazy(() => import("../orderManagement/OrderTracking"))
const RefundRequests = lazy(() => import("../orderManagement/RefundRequests"))
const Disputes = lazy(() => import("../orderManagement/Disputes"))

const CouponsManagement = lazy(() => import("../marketing/CouponsManagement"))
const Campaign = lazy(() => import("../marketing/Campaign"))
const PushNotification = lazy(() => import("../marketing/PushNotification"))
const Banners = lazy(() => import("../marketing/Banners"))
const LoyaltyProgram = lazy(() => import("../marketing/LoyaltyProgram"))
const TaxReports = lazy(() => import("../financial/TaxReports"))
const TransactionManagement = lazy(() => import("../financial/TransactionManagement"))
const FranchiseCommission = lazy(() => import("../financial/FranchiseCommission"))
const Revenue = lazy(() => import("../financial/Revenue"))
const Payouts = lazy(() => import("../financial/Payouts"))
const SalesAnalytics = lazy(() => import("../analytics/SalesAnalytics"))
const CustomerAnalytics = lazy(() => import("../analytics/CustomerAnalytics"))
const StoreAnalytics = lazy(() => import("../analytics/StoreAnalytics"))
const DeliveryAnalytics = lazy(() => import("../analytics/DeliveryAnalytics"))
const GrowthReport = lazy(() => import("../analytics/GrowthReport"))
const Settings = lazy(() => import("../settings/Settings"))
const AppConfiguration = lazy(() => import("../settings/AppConfiguration"))
const PaymentGateways = lazy(() => import("../settings/PaymentGateways"))
const NotificationsSettings = lazy(() => import("../settings/NotificationsSettings"))
const AuditLogs = lazy(() => import("../settings/AuditLogs"))
const ContentManagement = lazy(() => import("../settings/ContentManagement"))
const FranchiseTicket = lazy(() => import("../support/FranchiseTicket"))
const SupportRequests = lazy(() => import("../support/SupportRequests"))
const FeedbackAndReview = lazy(() => import("../support/FeedbackAndReview"))
const CustomerComplaints = lazy(() => import("../support/CustomerComplaints"))

// Shared layout shell for user management pages to inherit Sidebar and Navbar
function SuperAdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  
  // Enforce Superadmin Theme settings
  useSystemTheme()

  // Sync active sidebar state based on route path
  let activeItem = "Dashboard"
  if (location.pathname.includes("/customers")) {
    activeItem = "Customers"
  } else if (location.pathname.includes("/franchise-stores")) {
    activeItem = "Franchise Stores"
  } else if (location.pathname.includes("/franchise-approvals")) {
    activeItem = "Franchise Approvals"
  } else if (location.pathname.includes("/regions-zones")) {
    activeItem = "Regions & Zones"
  } else if (location.pathname.includes("/territory-management")) {
    activeItem = "Territory Management"
  } else if (location.pathname.includes("/franchises")) {
    activeItem = "Franchise Owners"
  } else if (location.pathname.includes("/managers")) {
    activeItem = "Store Managers"
  } else if (location.pathname.includes("/delivery-partners")) {
    activeItem = "Delivery Partners"
  } else if (location.pathname.includes("/kitchen-staff")) {
    activeItem = "Kitchen Staff"
  } else if (location.pathname.includes("/roles-permissions")) {
    activeItem = "Roles & Permissions"
  } else if (location.pathname.includes("/products")) {
    activeItem = "Products"
  } else if (location.pathname.includes("/categories")) {
    activeItem = "Categories"
  } else if (location.pathname.includes("/addons")) {
    activeItem = "Add-ons / Toppings"
  } else if (location.pathname.includes("/combos-deals")) {
    activeItem = "Combos & Deals"
  } else if (location.pathname.includes("/global-pricing")) {
    activeItem = "Global Pricing"
  } else if (location.pathname.includes("/order-tracking")) {
    activeItem = "Order Tracking"
  } else if (location.pathname.includes("/orders")) {
    activeItem = "All Orders"
  } else if (location.pathname.includes("/disputes")) {
    activeItem = "Disputes"
  } else if (location.pathname.includes("/refund-requests")) {
    activeItem = "Refund Requests"

  } else if (location.pathname.includes("/coupons")) {
    activeItem = "Coupons"
  } else if (location.pathname.includes("/campaigns")) {
    activeItem = "Campaigns"
  } else if (location.pathname.includes("/push-notifications")) {
    activeItem = "Push Notifications"
  } else if (location.pathname.includes("/banners-promotions")) {
    activeItem = "Banners / Promotions"
  } else if (location.pathname.includes("/loyalty")) {
    activeItem = "Loyalty Program"
  } else if (location.pathname.includes("/tax-reports")) {
    activeItem = "Tax Reports"
  } else if (location.pathname.includes("/transactions")) {
    activeItem = "Transactions"
  } else if (location.pathname.includes("/commissions")) {
    activeItem = "Franchise Commissions"
  } else if (location.pathname.includes("/payouts")) {
    activeItem = "Payouts"
  } else if (location.pathname.includes("/revenue")) {
    activeItem = "Revenue"
  } else if (location.pathname.includes("/sales-analytics")) {
    activeItem = "Sales Analytics"
  } else if (location.pathname.includes("/customer-analytics")) {
    activeItem = "Customer Analytics"
  } else if (location.pathname.includes("/store-analytics")) {
    activeItem = "Store Analytics"
  } else if (location.pathname.includes("/delivery-analytics")) {
    activeItem = "Delivery Analytics"
  } else if (location.pathname.includes("/growth-reports")) {
    activeItem = "Growth Reports"
  } else if (location.pathname.includes("/app-configuration")) {
    activeItem = "App Configuration"
  } else if (location.pathname.includes("/payment-gateways")) {
    activeItem = "Payment Gateways"
  } else if (location.pathname.includes("/notification-settings")) {
    activeItem = "Notification Settings"
  } else if (location.pathname.includes("/audit-logs")) {
    activeItem = "Audit Logs"
  } else if (location.pathname.includes("/settings")) {
    activeItem = "Settings"
  } else if (location.pathname.includes("/content-management")) {
    activeItem = "Content Management"
  } else if (location.pathname.includes("/franchise-tickets")) {
    activeItem = "Franchise Tickets"
  } else if (location.pathname.includes("/support-requests")) {
    activeItem = "Support Requests"
  } else if (location.pathname.includes("/customer-complaints")) {
    activeItem = "Customer Complaints"
  } else if (location.pathname.includes("/feedback-reviews")) {
    activeItem = "Feedback & Reviews"
  }

  const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem("sa_sidebar_collapsed") === "true")
  const handleToggleCollapse = () => {
    const next = !isCollapsed
    setIsCollapsed(next)
    localStorage.setItem("sa_sidebar_collapsed", next ? "true" : "false")
  }

  return (
    <div className="superadmin-theme min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 transition-all duration-300">
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} isCollapsed={isCollapsed} />
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeItem={activeItem}
        setActiveItem={() => { }}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />
      {/* 280px left padding on desktop to clear fixed Sidebar (dynamic when collapsed) */}
      <div className={`pt-16 min-h-screen transition-all duration-300 ${isCollapsed ? "lg:pl-[72px]" : "lg:pl-[280px]"}`}>
        <Outlet />
      </div>
    </div>
  )
}

export default function SuperAdminRouter() {
  const location = useLocation()
  const base = location.pathname.startsWith("/food") ? "/food/superadmin" : "/superadmin"

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-bold text-zinc-500 tracking-wider uppercase animate-pulse">
              Initializing Channels...
            </p>
          </div>
        </div>
      }
    >
      <Routes>
        <Route
          element={
            <ProtectedRoute module="admin" requiredRole="superadmin" loginPath="/superadmin/login">
              <Outlet />
            </ProtectedRoute>
          }
        >
          {/* Main Dashboard route (standalone view with its own layout states) */}
          <Route path="/dashboard" element={<SuperAdminDashboard />} />

          {/* Customer Management module routes wrapped in the shared Layout */}
          <Route element={<SuperAdminLayout />}>
            <Route path="/customers" element={<CustomerAnalysis />} />
            <Route path="/customers/list" element={<CustomerList />} />
            <Route path="/customers/profile/:id" element={<UserProfile />} />
            <Route path="/customers/profile" element={<UserProfile />} />
            <Route path="/franchise-stores" element={<FranchiseStores />} />
            <Route path="/franchise-approvals" element={<FranchiseApprovals />} />
            <Route path="/regions-zones" element={<RegionsZones />} />
            <Route path="/territory-management" element={<TerritoryManagement />} />
            <Route path="/franchises" element={<FranchiseList />} />
            <Route path="/managers" element={<StoreManagers />} />
            <Route path="/managers/list" element={<StoreManagersList />} />
            <Route path="/delivery-partners" element={<DeliveryPartnersManagement />} />
            <Route path="/kitchen-staff" element={<KitchenStaffManagement />} />
            <Route path="/roles-permissions" element={<RolesPermissionManagement />} />
            <Route path="/products" element={<ProductsManagement />} />
            <Route path="/categories" element={<CategoriesManagement />} />
            <Route path="/addons" element={<Addons />} />
            <Route path="/combos-deals" element={<ComboDeals />} />
            <Route path="/global-pricing" element={<GlobalPrice />} />
            <Route path="/orders" element={<AllOrders />} />
            <Route path="/order-tracking" element={<OrderTracking />} />
            <Route path="/disputes" element={<Disputes />} />
            <Route path="/refund-requests" element={<RefundRequests />} />

            <Route path="/coupons" element={<CouponsManagement />} />
            <Route path="/campaigns" element={<Campaign />} />
            <Route path="/push-notifications" element={<PushNotification />} />
            <Route path="/banners" element={<Banners />} />
            <Route path="/loyalty" element={<LoyaltyProgram />} />
            <Route path="/tax-reports" element={<TaxReports />} />
            <Route path="/transactions" element={<TransactionManagement />} />
            <Route path="/commissions" element={<FranchiseCommission />} />
            <Route path="/payouts" element={<Payouts />} />
            <Route path="/revenue" element={<Revenue />} />
            <Route path="/sales-analytics" element={<SalesAnalytics />} />
            <Route path="/customer-analytics" element={<CustomerAnalytics />} />
            <Route path="/store-analytics" element={<StoreAnalytics />} />
            <Route path="/delivery-analytics" element={<DeliveryAnalytics />} />
            <Route path="/growth-reports" element={<GrowthReport />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/app-configuration" element={<AppConfiguration />} />
            <Route path="/payment-gateways" element={<PaymentGateways />} />
            <Route path="/notification-settings" element={<NotificationsSettings />} />
            <Route path="/audit-logs" element={<AuditLogs />} />
            <Route path="/content-management" element={<ContentManagement />} />
            <Route path="/franchise-tickets" element={<FranchiseTicket />} />
            <Route path="/support-requests" element={<SupportRequests />} />
            <Route path="/customer-complaints" element={<CustomerComplaints />} />
            <Route path="/feedback-reviews" element={<FeedbackAndReview />} />
          </Route>
        </Route>

        {/* Redirect empty paths to dashboard */}
        <Route path="/" element={<Navigate to={`${base}/dashboard`} replace />} />

        {/* Wildcard fallback to redirect unknown paths */}
        <Route path="*" element={<Navigate to={`${base}/dashboard`} replace />} />
      </Routes>
    </Suspense>
  )
}

