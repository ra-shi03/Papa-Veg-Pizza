import React, { Suspense, lazy, useState, useEffect } from "react"
import { Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom"
import { useSystemTheme } from "@/shared/utils/themeSync"
import ProtectedRoute from "@food/components/ProtectedRoute"
import Sidebar from "../layouts/Sidebar"
import "@food/styles/admin-jr.css" // Jharkhand Rasoi admin look for every Super Admin page
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
const PlatformPayouts = lazy(() => import("../payouts/PlatformPayouts"))
const KitchenStaffManagement = lazy(() => import("../userManagement/KitchenStaffManagement"))
const RolesPermissionManagement = lazy(() => import("../userManagement/RolesPermissionManagement"))
const ProductsManagement = lazy(() => import("../productsManagement/ProductsManagement"))
const CategoriesManagement = lazy(() => import("../productsManagement/CategoriesManagement"))

const Addons = lazy(() => import("../productsManagement/Addons"))
const ComboDeals = lazy(() => import("../productsManagement/ComboDeals"))
const AllOrders = lazy(() => import("../orderManagement/AllOrders"))
const BulkOrdersManagement = lazy(() => import("../orderManagement/BulkOrdersManagement"))
const OrderTracking = lazy(() => import("../orderManagement/OrderTracking"))
const RefundRequests = lazy(() => import("../orderManagement/RefundRequests"))

const CouponsManagement = lazy(() => import("../marketing/CouponsManagement"))

const RewardsManagement = lazy(() => import("../marketing/RewardsManagement"))
const Settings = lazy(() => import("../settings/Settings"))
const AppConfiguration = lazy(() => import("../settings/AppConfiguration"))
const PaymentGateways = lazy(() => import("../settings/PaymentGateways"))
const FeesAndCharges = lazy(() => import("../settings/FeesAndCharges"))
const ContentManagement = lazy(() => import("../settings/ContentManagement"))
const SupportRequests = lazy(() => import("../support/SupportRequests"))
const FeedbackAndReview = lazy(() => import("../support/FeedbackAndReview"))
const CustomerComplaints = lazy(() => import("../../franchise-admin/customers/CustomerComplaints"))
const WelcomePage = lazy(() => import("../user-app/WelcomePage"))
const HomePageConfig = lazy(() => import("../user-app/HomePageConfig"))
const PromiseCampaignConfig = lazy(() => import("../user-app/PromiseCampaignConfig"))
const ShowcaseSectionsConfig = lazy(() => import("../user-app/ShowcaseSectionsConfig"))
const SearchConfig = lazy(() => import("../user-app/SearchConfig"))
const ComboPageConfig = lazy(() => import("../user-app/ComboPageConfig"))
const CartConfig = lazy(() => import("../user-app/CartConfig"))
const HeroBannersConfig = lazy(() => import("../user-app/HeroBannersConfig"))
const NutritionConfig = lazy(() => import("../user-app/NutritionConfig"))
const DeliveryWelcomePageConfig = lazy(() => import("../delivery-app/DeliveryWelcomePageConfig"))
const DeliveryLoginPageConfig = lazy(() => import("../delivery-app/DeliveryLoginPageConfig"))
// System Settings (ported from the Jharkhand Rasoi admin)
const NotificationBroadcast = lazy(() => import("../system/NotificationBroadcast"))
const StoreDelayAlerts = lazy(() => import("../system/StoreDelayAlerts"))
const ToggleManagement = lazy(() => import("../system/ToggleManagement"))
const BusinessSetup = lazy(() => import("../system/BusinessSetup"))
const ThemeSettings = lazy(() => import("../system/ThemeSettings"))
// Pages & Social Media (ported from the Jharkhand Rasoi admin)
const AboutUs = lazy(() => import("../pages-social-media/AboutUs"))
const LegalTerms = lazy(() => import("../pages-social-media/LegalTerms"))
const LegalPrivacy = lazy(() => import("../pages-social-media/LegalPrivacy"))
const RefundPolicy = lazy(() => import("../pages-social-media/RefundPolicy"))
const ShippingPolicy = lazy(() => import("../pages-social-media/ShippingPolicy"))
const CancellationPolicy = lazy(() => import("../pages-social-media/CancellationPolicy"))

// Shared layout shell for user management pages to inherit Sidebar and Navbar
function SuperAdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Enforce Superadmin Theme settings
  useSystemTheme()

  // The sidebar highlights the open page from the URL itself
  return (
    <div className="superadmin-theme min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 transition-all duration-300">
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      {/* Left padding on desktop = the sidebar's width (320px, 80px collapsed) */}
      <div className="jr-admin pt-16 min-h-screen lg:pl-[var(--panel-sidebar-w,320px)]">
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
            <Route path="/system/broadcast-notification" element={<NotificationBroadcast />} />
            <Route path="/system/store-delay-alerts" element={<StoreDelayAlerts />} />
            <Route path="/system/toggle-management" element={<ToggleManagement />} />
            <Route path="/system/business-setup" element={<BusinessSetup />} />
            <Route path="/system/theme-settings" element={<ThemeSettings />} />
            <Route path="/pages-social-media/about" element={<AboutUs />} />
            <Route path="/pages-social-media/terms" element={<LegalTerms />} />
            <Route path="/pages-social-media/privacy" element={<LegalPrivacy />} />
            <Route path="/pages-social-media/refund" element={<RefundPolicy />} />
            <Route path="/pages-social-media/shipping" element={<ShippingPolicy />} />
            <Route path="/pages-social-media/cancellation" element={<CancellationPolicy />} />
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
            <Route path="/orders" element={<AllOrders />} />
            <Route path="/order-tracking" element={<OrderTracking />} />
            <Route path="/bulk-orders" element={<BulkOrdersManagement />} />
            <Route path="/refund-requests" element={<RefundRequests />} />
            <Route path="/payouts" element={<PlatformPayouts />} />

            <Route path="/coupons" element={<CouponsManagement />} />

            <Route path="/rewards" element={<RewardsManagement />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/app-configuration" element={<AppConfiguration />} />
            <Route path="/fees-and-charges" element={<FeesAndCharges />} />
            <Route path="/payment-gateways" element={<PaymentGateways />} />
            <Route path="/content-management" element={<ContentManagement />} />
            <Route path="/support-requests" element={<SupportRequests />} />
            <Route path="/customer-complaints" element={<CustomerComplaints />} />
            <Route path="/feedback-reviews" element={<FeedbackAndReview />} />
            <Route path="/user-app/welcome-page" element={<WelcomePage />} />
            <Route path="/user-app/home-page" element={<HomePageConfig />} />
            <Route path="/user-app/promise-campaign" element={<PromiseCampaignConfig />} />
            <Route path="/user-app/showcase-sections" element={<ShowcaseSectionsConfig />} />
            <Route path="/user-app/search-config" element={<SearchConfig />} />
            <Route path="/user-app/combo-page" element={<ComboPageConfig />} />
            <Route path="/user-app/cart-config" element={<CartConfig />} />
            <Route path="/user-app/hero-banners" element={<HeroBannersConfig />} />
            <Route path="/user-app/nutrition" element={<NutritionConfig />} />
            <Route path="/delivery-app/welcome-page" element={<DeliveryWelcomePageConfig />} />
            <Route path="/delivery-app/login-page" element={<DeliveryLoginPageConfig />} />
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

