import { Routes, Route, Navigate } from "react-router-dom"
import UserLayout from "./UserLayout"
import { Suspense, lazy } from "react"
import Loader from "@food/components/Loader"
import ProtectedRoute from "@food/components/ProtectedRoute"
import LocationRequiredGuard from "./LocationRequiredGuard"

const WelcomeScreen = lazy(() => import("@food/pages/user/WelcomeScreen"))

// Lazy Loading Pages

// Home & Discovery
const Home = lazy(() => import("@food/pages/user/home/Home"))
const MenuList = lazy(() => import("@food/pages/user/home/MenuList"))
const Under250 = lazy(() => import("@food/pages/user/Under250"))
const SearchResults = lazy(() => import("@food/pages/user/search/UserSearchPage"))
const ProductDetail = lazy(() => import("@food/pages/user/ProductDetail"))

// Cart
const Cart = lazy(() => import("@food/pages/user/cart/Cart"))
const SelectAddress = lazy(() => import("@food/pages/user/cart/SelectAddress"))
const AddressSelectorPage = lazy(() => import("@food/pages/user/cart/AddressSelectorPage"))

// Orders
const Orders = lazy(() => import("@food/pages/user/orders/Orders"))
const OrderHistory = lazy(() => import("@food/pages/user/profile/OrderHistory"))
const OrderTracking = lazy(() => import("@food/pages/user/orders/OrderTracking"))
const OrderInvoice = lazy(() => import("@food/pages/user/orders/OrderInvoice"))
const UserOrderDetails = lazy(() => import("@food/pages/user/orders/UserOrderDetails"))

// Offers & Promise
const Offers = lazy(() => import("@food/pages/user/Offers"))
const ComboPage = lazy(() => import("@food/pages/user/ComboPage"))
const ComboBuilder = lazy(() => import("@food/pages/user/ComboBuilder"))
const PromisePage = lazy(() => import("@food/pages/user/PromisePage"))
const BulkOrder = lazy(() => import("@food/pages/user/BulkOrder"))






// Profile
const AccountSettings = lazy(() => import("@food/pages/user/AccountSettings"))
const TrackOrder = lazy(() => import("@food/pages/user/profile/TrackOrder"))
const EditProfile = lazy(() => import("@food/pages/user/profile/EditProfile"))
const MyProfile = lazy(() => import("@food/pages/user/profile/MyProfile"))
const ProfileDetails = lazy(() => import("@food/pages/user/profile/ProfileDetails"))
const Payments = lazy(() => import("@food/pages/user/profile/Payments"))
const Coupons = lazy(() => import("@food/pages/user/profile/Coupons"))
const AllCoupons = lazy(() => import("@food/pages/user/profile/AllCoupons"))
const About = lazy(() => import("@food/pages/user/profile/About"))
const Terms = lazy(() => import("@food/pages/user/profile/Terms"))
const Privacy = lazy(() => import("@food/pages/user/profile/Privacy"))
const FAQ = lazy(() => import("@food/pages/user/profile/FAQ"))
const Nutrition = lazy(() => import("@food/pages/user/profile/Nutrition"))
const Refund = lazy(() => import("@food/pages/user/profile/Refund"))
const Shipping = lazy(() => import("@food/pages/user/profile/Shipping"))
const Cancellation = lazy(() => import("@food/pages/user/profile/Cancellation"))
const ReportSafetyEmergency = lazy(() => import("@food/pages/user/profile/ReportSafetyEmergency"))
const Accessibility = lazy(() => import("@food/pages/user/profile/Accessibility"))
const Logout = lazy(() => import("@food/pages/user/profile/Logout"))
const ReferEarn = lazy(() => import("@food/pages/user/profile/ReferEarn"))

// Auth
const Login = lazy(() => import("@food/pages/user/auth/Login"))
const SignIn = lazy(() => import("@food/pages/user/auth/SignIn"))
const OTP = lazy(() => import("@food/pages/user/auth/OTP"))
const AuthCallback = lazy(() => import("@food/pages/user/auth/AuthCallback"))
const LocationSetup = lazy(() => import("@food/pages/user/location/LocationSetup"))
const DeliveryLocation = lazy(() => import("@food/pages/user/location/DeliveryLocation"))
const TrainTerms = lazy(() => import("@food/pages/user/location/TrainTerms"))

// Help
const Help = lazy(() => import("@food/pages/user/help/Help"))
const OrderHelp = lazy(() => import("@food/pages/user/help/OrderHelp"))

// Notifications
const Notifications = lazy(() => import("@food/pages/user/Notifications"))

// Wallet & Rewards
const Wallet = lazy(() => import("@food/pages/user/Wallet"))
const Rewards = lazy(() => import("@food/pages/user/Rewards"))

// Complaints
const SubmitComplaint = lazy(() => import("@food/pages/user/complaints/SubmitComplaint"))
const MyComplaints = lazy(() => import("@food/pages/user/complaints/MyComplaints"))

export default function UserRouter() {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route path="welcome" element={<WelcomeScreen />} />
        <Route element={<UserLayout />}>
          {/* Home & Discovery */}
          <Route path="" element={<Home />} />
          <Route path="menu" element={<MenuList />} />
          <Route path="promise" element={<PromisePage />} />

          <Route path="under-250" element={<Under250 />} />
          {/* old category links (the screens were removed): the menu lists every category */}
          <Route path="categories" element={<Navigate to="/food/user/menu" replace />} />
          <Route path="category/:category" element={<Navigate to="/food/user/menu" replace />} />
          <Route path="search" element={<SearchResults />} />
          <Route path="product/:id" element={<ProductDetail />} />

          {/* Cart - Protected */}
          <Route path="cart" element={<LocationRequiredGuard><Cart /></LocationRequiredGuard>} />
          <Route path="cart/select-address" element={<LocationRequiredGuard><SelectAddress /></LocationRequiredGuard>} />
          <Route path="address-selector" element={<LocationRequiredGuard><AddressSelectorPage /></LocationRequiredGuard>} />

          {/* Orders / Reorder / Order History */}
          <Route path="orders" element={<Orders />} />
          <Route path="order-history" element={<Orders />} />
          <Route path="account/order-history" element={<Orders />} />
          <Route path="profile/order-history" element={<Orders />} />
          <Route
            path="orders/:orderId"
            element={
              <ProtectedRoute requiredRole="user" loginPath="/user/auth/login">
                <OrderTracking />
              </ProtectedRoute>
            }
          />
          <Route
            path="orders/:orderId/invoice"
            element={
              <ProtectedRoute requiredRole="user" loginPath="/user/auth/login">
                <OrderInvoice />
              </ProtectedRoute>
            }
          />
          <Route
            path="orders/:orderId/details"
            element={
              <ProtectedRoute requiredRole="user" loginPath="/user/auth/login">
                <UserOrderDetails />
              </ProtectedRoute>
            }
          />

          {/* Offers & Coupons */}
          <Route path="offers" element={<Coupons />} />
          <Route path="combos" element={<ComboPage />} />
          <Route path="combos/build" element={<ComboBuilder />} />
          <Route path="coupons" element={<Coupons />} />
          <Route path="bulk-order" element={<BulkOrder />} />
          <Route path="bulk-orders" element={<BulkOrder />} />






          {/* Profile - Protected (require user auth) */}
          <Route path="account" element={<Navigate to="/food/user/account/profile-details" replace />} />
          <Route path="profile" element={<Navigate to="/food/user/account/profile-details" replace />} />
          <Route path="profile-details" element={<Navigate to="/food/user/account/profile-details" replace />} />
          <Route path="track-order" element={<TrackOrder />} />
          <Route path="account/track-order" element={<TrackOrder />} />
          <Route path="profile/track-order" element={<TrackOrder />} />
          <Route
            path="account/profile-details"
            element={<ProfileDetails />}
          />
          <Route
            path="profile/details"
            element={<ProfileDetails />}
          />
          <Route
            path="account/profile-details/edit"
            element={
              <ProtectedRoute requiredRole="user" loginPath="/user/auth/login">
                <EditProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="profile/edit"
            element={
              <ProtectedRoute requiredRole="user" loginPath="/user/auth/login">
                <EditProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="profile/create"
            element={<MyProfile />}
          />
          <Route
            path="account/profile-details/payments"
            element={
              <ProtectedRoute requiredRole="user" loginPath="/user/auth/login">
                <Payments />
              </ProtectedRoute>
            }
          />
          <Route
            path="profile/payments"
            element={
              <ProtectedRoute requiredRole="user" loginPath="/user/auth/login">
                <Payments />
              </ProtectedRoute>
            }
          />
          {/* old address links: the address is picked on Home / at checkout */}
          <Route path="account/profile-details/addresses" element={<Navigate to="/food/user" replace />} />
          <Route path="profile/addresses" element={<Navigate to="/food/user" replace />} />
          <Route path="addresses" element={<Navigate to="/food/user" replace />} />
          <Route path="account/coupons" element={<Coupons />} />
          <Route path="account/coupons/all" element={<Coupons />} />
          <Route path="profile/coupons" element={<Coupons />} />
          <Route
            path="profile/about"
            element={
              <ProtectedRoute requiredRole="user" loginPath="/user/auth/login">
                <About />
              </ProtectedRoute>
            }
          />

          <Route
            path="profile/report-safety-emergency"
            element={
              <ProtectedRoute requiredRole="user" loginPath="/user/auth/login">
                <ReportSafetyEmergency />
              </ProtectedRoute>
            }
          />
          <Route
            path="profile/accessibility"
            element={
              <ProtectedRoute requiredRole="user" loginPath="/user/auth/login">
                <Accessibility />
              </ProtectedRoute>
            }
          />
          <Route
            path="profile/logout"
            element={
              <ProtectedRoute requiredRole="user" loginPath="/user/auth/login">
                <Logout />
              </ProtectedRoute>
            }
          />
          <Route
            path="profile/refer-earn"
            element={
              <ProtectedRoute requiredRole="user" loginPath="/user/auth/login">
                <ReferEarn />
              </ProtectedRoute>
            }
          />


          {/* Public Legal Policies (stay public) */}
          <Route path="account/terms" element={<Terms />} />
          <Route path="account/privacy" element={<Privacy />} />
          <Route path="account/faqs" element={<FAQ />} />
          <Route path="account/nutrition" element={<Nutrition />} />
          <Route path="profile/refund" element={<Refund />} />
          <Route path="profile/shipping" element={<Shipping />} />
          <Route path="profile/cancellation" element={<Cancellation />} />

          {/* Auth - User login */}
          <Route path="auth/login" element={<Login />} />
          <Route path="auth/sign-in" element={<Login />} />
          <Route path="auth/callback" element={<AuthCallback />} />
          <Route path="location/setup" element={<LocationSetup />} />
          <Route path="delivery-location" element={<DeliveryLocation />} />
          <Route path="train-terms" element={<TrainTerms />} />

          {/* Help */}
          <Route path="help" element={<Help />} />
          <Route path="help/orders/:orderId" element={<OrderHelp />} />

          {/* Notifications - Protected (user auth) */}
          <Route
            path="notifications"
            element={
              <ProtectedRoute requiredRole="user" loginPath="/user/auth/login">
                <Notifications />
              </ProtectedRoute>
            }
          />

          {/* Wallet & Rewards */}
          <Route path="wallet" element={<Wallet />} />
          <Route path="rewards" element={<Rewards />} />

          {/* Complaints - Protected (user auth) */}
          <Route
            path="complaints"
            element={
              <ProtectedRoute requiredRole="user" loginPath="/user/auth/login">
                <MyComplaints />
              </ProtectedRoute>
            }
          />
          <Route
            path="complaints/submit/:orderId"
            element={
              <ProtectedRoute requiredRole="user" loginPath="/user/auth/login">
                <SubmitComplaint />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </Suspense>
  )
}
