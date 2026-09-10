import { Suspense, lazy, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useSystemTheme } from "@/shared/utils/themeSync";
import ProtectedRoute from "@food/components/ProtectedRoute";
import FranchiseAdminLayout from "../layout/FranchiseAdminLayout";
import Loader from "@food/components/Loader";

// Lazy Loaded Pages
const AdminHome = lazy(() => import("@food/pages/franchise-admin/dashboard/FranchiseAdminDashboard"));
const AdminProfile = lazy(() => import("@food/pages/franchise-admin/AdminProfile"));
const FranchiseRevenue = lazy(() => import("@food/pages/franchise-admin/finance/FranchiseRevenue"));
const Expenses = lazy(() => import("@food/pages/franchise-admin/finance/Expenses"));
const StoreEarnings = lazy(() => import("@food/pages/franchise-admin/finance/StoreEarnings"));
const RiderPayouts = lazy(() => import("@food/pages/franchise-admin/finance/RiderPayouts"));
const Reports = lazy(() => import("@food/pages/franchise-admin/finance/Reports"));
const SalesReport = lazy(() => import("@food/pages/franchise-admin/reports/SalesReport"));
const OrdersReport = lazy(() => import("@food/pages/franchise-admin/reports/OrdersReport"));
const StaffReports = lazy(() => import("@food/pages/franchise-admin/reports/StaffReports"));
const InventoryReports = lazy(() => import("@food/pages/franchise-admin/reports/InventoryReports"));
const RefundRequests = lazy(() => import("@food/pages/franchise-admin/orders/RefundRequests"));
const OrderIssues = lazy(() => import("@food/pages/franchise-admin/orders/OrderIssues"));
const LiveOrders = lazy(() => import("@food/pages/franchise-admin/orders/LiveOrders"));
const CompletedOrders = lazy(() => import("@food/pages/franchise-admin/orders/CompletedOrders"));
const CancelledOrder = lazy(() => import("@food/pages/franchise-admin/orders/CancelledOrder"));
const Categories = lazy(() => import("@food/pages/franchise-admin/products/Categories"));

// Food Management
const Products = lazy(() => import("@food/pages/franchise-admin/products/Products"));
const Addons = lazy(() => import("@food/pages/franchise-admin/products/Addons"));
const StorePricing = lazy(() => import("@food/pages/franchise-admin/products/StorePricing"));


// Promotions Management
const Coupons = lazy(() => import("@food/pages/franchise-admin/marketing/LocalCoupons"));
const Campaigns = lazy(() => import("@food/pages/franchise-admin/marketing/Campaigns"));
const PromotionalBanner = lazy(() => import("@food/pages/franchise-admin/PromotionalBanner"));
const PromotionalBanners = lazy(() => import("@food/pages/franchise-admin/marketing/PromotionalBanners"));
const NotificationsPage = lazy(() => import("@food/pages/franchise-admin/marketing/Notifications"));

const Stores = lazy(() => import("@food/pages/franchise-admin/storeManagement/Stores"));
const StoreApprovals = lazy(() => import("@food/pages/franchise-admin/storeManagement/StoreApprovals"));
const StorePerformance = lazy(() => import("@food/pages/franchise-admin/storeManagement/StorePerformance"));
const OperatingHours = lazy(() => import("@food/pages/franchise-admin/storeManagement/OperatingHours"));
const StoreManagers = lazy(() => import("@food/pages/franchise-admin/staffManagement/StoreManagers"));
const KitchenStaff = lazy(() => import("@food/pages/franchise-admin/staffManagement/KitchenStaff"));
const DeliveryPartners = lazy(() => import("@food/pages/franchise-admin/staffManagement/DeliveryPartners"));
const Ingredients = lazy(() => import("@food/pages/franchise-admin/inventory/Ingredients"));
const StockLevels = lazy(() => import("@food/pages/franchise-admin/inventory/StockLevels"));
const LowStockAlerts = lazy(() => import("@food/pages/franchise-admin/inventory/LowStockAlerts"));
const PurchaseRequests = lazy(() => import("@food/pages/franchise-admin/inventory/PurchaseRequests"));

// Help & Support

// Customer Management
const CustomersList = lazy(() => import("@food/pages/franchise-admin/customers/CustomersList"));
const CustomerComplaints = lazy(() => import("@food/pages/franchise-admin/customers/CustomerComplaints"));
const ReviewsRatings = lazy(() => import("@food/pages/franchise-admin/customers/ReviewsRatings"));
const LoyaltyMembers = lazy(() => import("@food/pages/franchise-admin/customers/LoyaltyMembers"));

const AdminLogin = lazy(() => import("@food/pages/franchise-admin/auth/AdminLogin"));
const AdminSignup = lazy(() => import("@food/pages/franchise-admin/auth/AdminSignup"));
const AdminForgotPassword = lazy(() => import("@food/pages/franchise-admin/auth/AdminForgotPassword"));

export default function FranchiseAdminRouter() {
  const location = useLocation();
  
  // Enforce Superadmin Theme settings
  useSystemTheme();

  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        {/* Redirect old login/signup paths to unified franchise login */}
        <Route path="login" element={<Navigate to="/franchise-admin/login" replace />} />
        <Route path="signup" element={<Navigate to="/franchise-admin/login" replace />} />
        <Route path="forgot-password" element={<AdminForgotPassword />} />

        {/* Protected Routes - With Layout */}
        <Route
          element={
            <ProtectedRoute module="admin" requiredRole="franchise-admin" loginPath="/franchise-admin/login">
              <FranchiseAdminLayout />
            </ProtectedRoute>
          }
        >
          {/* Default Admin Redirect */}
          <Route path="/" element={<Navigate to="dashboard" replace />} />
          <Route path="stores" element={<Stores />} />
          <Route path="customers-list" element={<CustomersList />} />
          <Route path="customer-complaints" element={<CustomerComplaints />} />
          <Route path="reviews-ratings" element={<ReviewsRatings />} />
          <Route path="loyalty-members" element={<LoyaltyMembers />} />
          <Route path="store-managers" element={<StoreManagers />} />
          <Route path="employees" element={<KitchenStaff />} />
          <Route path="delivery-partners" element={<DeliveryPartners />} />
          <Route path="store-approvals" element={<StoreApprovals />} />
          <Route path="store-performance" element={<StorePerformance />} />
          <Route path="operating-hours" element={<OperatingHours />} />
          <Route path="live-orders" element={<LiveOrders />} />
          <Route path="completed-orders" element={<CompletedOrders />} />
          <Route path="cancelled-orders" element={<CancelledOrder />} />
          <Route path="refund-requests" element={<RefundRequests />} />
          <Route path="order-issues" element={<OrderIssues />} />
          <Route path="products" element={<Products />} />
          <Route path="categories" element={<Categories />} />
          <Route path="addons" element={<Addons />} />
          <Route path="store-pricing" element={<StorePricing />} />
          <Route path="ingredients" element={<Ingredients />} />
          <Route path="stock-levels" element={<StockLevels />} />
          <Route path="low-stock-alerts" element={<LowStockAlerts />} />
          <Route path="purchase-requests" element={<PurchaseRequests />} />
          <Route path="franchise-revenue" element={<FranchiseRevenue />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="store-earnings" element={<StoreEarnings />} />
          <Route path="rider-payouts" element={<RiderPayouts />} />
          <Route path="reports" element={<Reports />} />
          <Route path="sales-report" element={<SalesReport />} />
          <Route path="orders-report" element={<OrdersReport />} />
          <Route path="staff-reports" element={<StaffReports />} />
          <Route path="inventory-reports" element={<InventoryReports />} />
          <Route path="coupons" element={<Coupons />} />
          <Route path="campaigns" element={<Campaigns />} />
          <Route path="banners" element={<PromotionalBanners />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="profile" element={<AdminProfile />} />

          {/* FOOD ADMIN - All food related routes nested here */}
          <Route path="dashboard/*">
            <Route index element={<AdminHome />} />
            <Route path="point-of-sale" element={<Navigate to="/franchise-admin/dashboard" replace />} />
            <Route path="profile" element={<AdminProfile />} />
            <Route path="settings" element={<Navigate to="/franchise-admin/dashboard" replace />} />
            
            {/* ORDER MANAGEMENT */}
            <Route path="orders/all" element={<Navigate to="/franchise-admin/live-orders" replace />} />
            <Route path="orders/scheduled" element={<Navigate to="/franchise-admin/live-orders" replace />} />
            <Route path="orders/pending" element={<Navigate to="/franchise-admin/live-orders" replace />} />
            <Route path="orders/accepted" element={<Navigate to="/franchise-admin/live-orders" replace />} />
            <Route path="orders/processing" element={<Navigate to="/franchise-admin/live-orders" replace />} />
            <Route path="orders/food-on-the-way" element={<Navigate to="/franchise-admin/live-orders" replace />} />
            <Route path="orders/delivered" element={<Navigate to="/franchise-admin/completed-orders" replace />} />
            <Route path="orders/canceled" element={<Navigate to="/franchise-admin/cancelled-orders" replace />} />
            <Route path="orders/store-cancelled" element={<Navigate to="/franchise-admin/live-orders" replace />} />
            <Route path="orders/payment-failed" element={<Navigate to="/franchise-admin/live-orders" replace />} />
            <Route path="orders/refunded" element={<Navigate to="/franchise-admin/live-orders" replace />} />
            <Route path="orders/offline-payments" element={<Navigate to="/franchise-admin/live-orders" replace />} />
            <Route path="order-detect-delivery" element={<Navigate to="/franchise-admin/dashboard" replace />} />
            <Route path="order-refunds/new" element={<Navigate to="/franchise-admin/refund-requests" replace />} />


            {/* FOOD & CATEGORY MANAGEMENT */}
            <Route path="inventory/ingredients" element={<Navigate to="/franchise-admin/ingredients" replace />} />
            <Route path="inventory/alerts" element={<Navigate to="/franchise-admin/low-stock-alerts" replace />} />
            <Route path="inventory/purchase-requests" element={<Navigate to="/franchise-admin/purchase-requests" replace />} />
            <Route path="categories" element={<Navigate to="/franchise-admin/categories" replace />} />
            <Route path="fee-settings" element={<Navigate to="/franchise-admin/dashboard" replace />} />
            <Route path="referral-settings" element={<Navigate to="/franchise-admin/dashboard" replace />} />
            <Route path="foods" element={<Navigate to="/franchise-admin/products" replace />} />
            <Route path="food/list" element={<Navigate to="/franchise-admin/products" replace />} />
            <Route path="addons" element={<Navigate to="/franchise-admin/addons" replace />} />
            <Route path="global-pricing" element={<Navigate to="/franchise-admin/store-pricing" replace />} />

            {/* PROMOTIONS, CUSTOMERS, DELIVERYMEN, etc. */}
            <Route path="campaigns/basic" element={<Navigate to="/franchise-admin/campaigns" replace />} />
            <Route path="campaigns/food" element={<Navigate to="/franchise-admin/campaigns" replace />} />
            <Route path="coupons" element={<Navigate to="/franchise-admin/coupons" replace />} />
            <Route path="cashback" element={<Navigate to="/franchise-admin/dashboard" replace />} />
            <Route path="banners" element={<Navigate to="/franchise-admin/banners" replace />} />
            <Route path="promotional-banner" element={<PromotionalBanner />} />
            <Route path="advertisement" element={<Navigate to="/franchise-admin/dashboard" replace />} />
            <Route path="advertisement/new" element={<Navigate to="/franchise-admin/dashboard" replace />} />
            <Route path="advertisement/requests" element={<Navigate to="/franchise-admin/dashboard" replace />} />
            
            <Route path="chattings" element={<Navigate to="/franchise-admin/dashboard" replace />} />
            <Route path="contact-messages" element={<Navigate to="/franchise-admin/dashboard" replace />} />
            <Route path="safety-emergency-reports" element={<Navigate to="/franchise-admin/order-issues" replace />} />
            
            <Route path="customers" element={<Navigate to="/franchise-admin/customers-list" replace />} />
            <Route path="support-tickets" element={<Navigate to="/franchise-admin/customer-complaints" replace />} />
            <Route path="stores/reviews" element={<Navigate to="/franchise-admin/reviews-ratings" replace />} />
            <Route path="wallet/add-fund" element={<Navigate to="/franchise-admin/dashboard" replace />} />
            <Route path="wallet/bonus" element={<Navigate to="/franchise-admin/dashboard" replace />} />
            <Route path="loyalty-point/report" element={<Navigate to="/franchise-admin/loyalty-members" replace />} />
            <Route path="subscribed-mail-list" element={<Navigate to="/franchise-admin/dashboard" replace />} />

            <Route path="delivery-boy-commission" element={<Navigate to="/franchise-admin/dashboard" replace />} />
            <Route path="delivery-cash-limit" element={<Navigate to="/franchise-admin/dashboard" replace />} />
            <Route path="cash-limit-settlement" element={<Navigate to="/franchise-admin/dashboard" replace />} />
            <Route path="delivery-withdrawal" element={<Navigate to="/franchise-admin/rider-payouts" replace />} />
            <Route path="delivery-boy-wallet" element={<Navigate to="/franchise-admin/dashboard" replace />} />
            <Route path="delivery-emergency-help" element={<Navigate to="/franchise-admin/dashboard" replace />} />
            <Route path="delivery-support-tickets" element={<Navigate to="/franchise-admin/dashboard" replace />} />

            {/* REPORTS & SETTINGS */}
            <Route path="transaction-report" element={<Navigate to="/franchise-admin/reports" replace />} />
            <Route path="expense-report" element={<Navigate to="/franchise-admin/expenses" replace />} />
            <Route path="disbursement-report/stores" element={<Navigate to="/franchise-admin/store-earnings" replace />} />
            <Route path="disbursement-report/deliverymen" element={<Navigate to="/franchise-admin/dashboard" replace />} />
            <Route path="order-report/regular" element={<Navigate to="/franchise-admin/orders-report" replace />} />
            <Route path="order-report/campaign" element={<Navigate to="/franchise-admin/dashboard" replace />} />
            <Route path="customer-report/feedback-experience" element={<Navigate to="/franchise-admin/dashboard" replace />} />
            <Route path="tax-report" element={<Navigate to="/franchise-admin/dashboard" replace />} />
            <Route path="store-vat-report" element={<Navigate to="/franchise-admin/dashboard" replace />} />
            
            {/* Extra Report paths from sidebar */}
            {/* Mapped outside to /franchise-admin/sales-report */}
            <Route path="staff-report" element={<Navigate to="/franchise-admin/staff-reports" replace />} />
            <Route path="inventory-report" element={<Navigate to="/franchise-admin/inventory-reports" replace />} />

            <Route path="store-withdraws" element={<Navigate to="/franchise-admin/dashboard" replace />} />
            <Route path="withdraw-method" element={<Navigate to="/franchise-admin/dashboard" replace />} />

            {/* SYSTEM & BUSINESS SETTINGS */}
            <Route path="business-setup" element={<Navigate to="/franchise-admin/dashboard" replace />} />
            <Route path="email-template" element={<Navigate to="/franchise-admin/dashboard" replace />} />
            <Route path="theme-settings" element={<Navigate to="/franchise-admin/dashboard" replace />} />
            <Route path="gallery" element={<Navigate to="/franchise-admin/dashboard" replace />} />
            <Route path="login-setup" element={<Navigate to="/franchise-admin/dashboard" replace />} />
            <Route path="business-settings/fcm-index" element={<Navigate to="/franchise-admin/dashboard" replace />} />
            <Route path="pages-social-media/terms" element={<Navigate to="/franchise-admin/dashboard" replace />} />
            <Route path="pages-social-media/privacy" element={<Navigate to="/franchise-admin/dashboard" replace />} />
            <Route path="pages-social-media/about" element={<Navigate to="/franchise-admin/dashboard" replace />} />
            <Route path="pages-social-media/refund" element={<Navigate to="/franchise-admin/dashboard" replace />} />
            <Route path="pages-social-media/shipping" element={<Navigate to="/franchise-admin/dashboard" replace />} />
            <Route path="pages-social-media/cancellation" element={<Navigate to="/franchise-admin/dashboard" replace />} />
            <Route path="pages-social-media/react-registration" element={<Navigate to="/franchise-admin/dashboard" replace />} />
            
            <Route path="3rd-party-configurations/party" element={<Navigate to="/franchise-admin/dashboard" replace />} />
            <Route path="3rd-party-configurations/firebase" element={<Navigate to="/franchise-admin/dashboard" replace />} />
            <Route path="3rd-party-configurations/offline-payment" element={<Navigate to="/franchise-admin/dashboard" replace />} />
            <Route path="3rd-party-configurations/join-us" element={<Navigate to="/franchise-admin/dashboard" replace />} />
            <Route path="3rd-party-configurations/analytics" element={<Navigate to="/franchise-admin/dashboard" replace />} />
            <Route path="3rd-party-configurations/ai" element={<Navigate to="/franchise-admin/dashboard" replace />} />
            <Route path="app-web-settings" element={<Navigate to="/franchise-admin/dashboard" replace />} />
            <Route path="notifications" element={<Navigate to="/franchise-admin/notifications" replace />} />
            <Route path="broadcast-notification" element={<Navigate to="/franchise-admin/dashboard" replace />} />
            <Route path="notification-channels" element={<Navigate to="/franchise-admin/dashboard" replace />} />
            <Route path="landing-page-settings/admin" element={<Navigate to="/franchise-admin/dashboard" replace />} />
            <Route path="landing-page-settings/react" element={<Navigate to="/franchise-admin/dashboard" replace />} />
            <Route path="page-meta-data" element={<Navigate to="/franchise-admin/dashboard" replace />} />
            <Route path="react-site" element={<Navigate to="/franchise-admin/dashboard" replace />} />
            <Route path="clean-database" element={<Navigate to="/franchise-admin/dashboard" replace />} />
            <Route path="addon-activation" element={<Navigate to="/franchise-admin/dashboard" replace />} />
            <Route path="hero-banner-management" element={<Navigate to="/franchise-admin/dashboard" replace />} />
            <Route path="dining-management" element={<Navigate to="/franchise-admin/dashboard" replace />} />
            <Route path="dining-list" element={<Navigate to="/franchise-admin/dashboard" replace />} />
            <Route path="dining-requests" element={<Navigate to="/franchise-admin/dashboard" replace />} />
          </Route>

          {/* TAXI ADMIN - Placeholder for future implementation */}
          <Route path="taxi/*" element={<div className="p-8 text-center text-gray-500 bg-white min-h-[50vh] flex items-center justify-center border rounded-xl m-4">Taxi Administration - Coming Soon</div>} />

          {/* QUICK COMMERCE ADMIN - Placeholder for future implementation */}
          <Route path="quick-commerce/*" element={<div className="p-8 text-center text-gray-500 bg-white min-h-[50vh] flex items-center justify-center border rounded-xl m-4">Quick Commerce Administration - Coming Soon</div>} />
        </Route>

        {/* Redirect unknown admin routes to food admin */}
        <Route path="*" element={<Navigate to="/franchise-admin/dashboard" replace />} />

      </Routes>
    </Suspense>
  );
}
