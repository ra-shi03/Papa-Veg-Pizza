// Routing file
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Suspense, lazy, useEffect } from 'react'
import { AppShellSkeleton } from '@food/components/ui/loading-skeletons'

const NATIVE_LAST_ROUTE_KEY = 'native_last_route'

// Lazy load the Food service module (Quick-spicy app)
const FoodApp = lazy(() => import('../modules/Food/routes'))
const AuthApp = lazy(() => import('../modules/auth/routes'))
const DeliveryV2App = lazy(() => import('../modules/DeliveryV2'))
import ProtectedRoute from '@food/components/ProtectedRoute'

const PageLoader = () => <AppShellSkeleton />

/**
 * FoodAppWrapper — Quick-spicy App. को /food prefix के साथ render करता है.
 * 
 * Quick-spicy की App.jsx में routes /store, /usermain, /admin, /delivery
 * जैसे hain (bina /food prefix ke). Yahan hum useLocation se /food ke baad wala
 * path nikalne ke baad FoodApp render karte hain. FoodApp internally BrowserRouter
 * nahi use karta (sirf Routes use karta hai), isliye ye directly kaam karta hai.
 */
const FoodAppWrapper = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <FoodApp />
    </Suspense>
  )
}

const RedirectToFood = () => {
  const location = useLocation();
  // We safely replace the exact current pathname with a /food prefixed pathname
  // This effectively catches programmatic navigation to absolute paths like '/store/login'
  // and turns them into '/food/store/login'
  return <Navigate to={`/food${location.pathname}${location.search}`} replace />;
};

// const MasterLandingPage = lazy(() => import('./MasterLandingPage'))
const FranchiseAdminRouter = lazy(() => import('../modules/Food/pages/franchise-admin/routes/FranchiseAdminRouter'))
const SuperAdminRouter = lazy(() => import('../modules/Food/pages/superadmin/routes/SuperAdminRouter'))
const StoreManagerRouter = lazy(() => import('../modules/Food/pages/store-manager/routes/StoreManagerRouter'))

const SuperAdminLogin = lazy(() => import('../modules/Food/pages/superadmin/auth/SuperAdminLogin'))
const StoreLogin = lazy(() => import('../modules/Food/pages/store-manager/auth/StoreLogin'))
const FranchiseAdminLogin = lazy(() => import('../modules/Food/pages/franchise-admin/auth/AdminLogin'))


const AppRoutes = () => {
  const location = useLocation()

  useEffect(() => {
    if (typeof window === 'undefined') return

    const protocol = String(window.location?.protocol || '').toLowerCase()
    const userAgent = String(window.navigator?.userAgent || '').toLowerCase()
    const isNativeLikeShell =
      Boolean(window.flutter_inappwebview) ||
      Boolean(window.ReactNativeWebView) ||
      protocol === 'file:' ||
      userAgent.includes(' wv') ||
      userAgent.includes('; wv')

    if (!isNativeLikeShell) return

    const route = `${location.pathname || ''}${location.search || ''}`
    if (route.startsWith('/food/') || route.startsWith('/admin') || route.startsWith('/superadmin')) {
      localStorage.setItem(NATIVE_LAST_ROUTE_KEY, route)
    }
  }, [location.pathname, location.search])

  return (
    <Routes>
      {/* Auth Module */}
      <Route path="/delivery/auth/*" element={<AuthApp />} />
      <Route path="/store/auth/*" element={<AuthApp />} />

      {/* Delivery V2 Module */}
      <Route path="/delivery/*" element={<Navigate to="/food/delivery" replace />} />
      <Route path="/food/delivery/*" element={<Suspense fallback={<PageLoader />}><DeliveryV2App /></Suspense>} />

      {/* Food Module - Handle both /food and root / for the user app */}
      <Route path="/food/*" element={<FoodAppWrapper />} />

      {/* Unified Authentication Routes */}
      <Route path="/superadmin/login" element={<Suspense fallback={<PageLoader />}><SuperAdminLogin /></Suspense>} />
      <Route path="/admin/login" element={<Navigate to="/superadmin/login" replace />} />
      <Route path="/franchise-admin/login" element={<Suspense fallback={<PageLoader />}><FranchiseAdminLogin /></Suspense>} />
      <Route path="/store-operation/login" element={<Suspense fallback={<PageLoader />}><StoreLogin /></Suspense>} />

      {/* Redirects for Store operations shortcut URLs */}
      <Route path="/store/dashboard" element={<Navigate to="/store-operations/dashboard" replace />} />
      <Route path="/store/my-tasks" element={<Navigate to="/store-operations/tasks" replace />} />

      {/* Global Franchise Admin Portal */}
      <Route path="/franchise-admin/*" element={
        <ProtectedRoute module="admin" requiredRole="franchise-admin" loginPath="/franchise-admin/login">
          <FranchiseAdminRouter />
        </ProtectedRoute>
      } />
      <Route path="/admin/*" element={<Navigate to="/franchise-admin/dashboard" replace />} />
      
      {/* Unified Store Operations Panel (Role-Based) */}
      <Route path="/store-operations/*" element={
        <ProtectedRoute module="admin" requiredRole={["store-manager", "kitchen-supervisor", "kitchen-staff"]} loginPath="/store-operation/login">
          <StoreManagerRouter />
        </ProtectedRoute>
      } />

      {/* Super Admin Portal */}
      <Route path="/superadmin/*" element={
        <ProtectedRoute module="admin" requiredRole="superadmin" loginPath="/superadmin/login">
          <Suspense fallback={<PageLoader />}><SuperAdminRouter /></Suspense>
        </ProtectedRoute>
      } />


      {/* Handle root and other paths via FoodAppWrapper */}
      <Route path="/" element={<Navigate to="/welcome" replace />} />
      <Route path="/*" element={<FoodAppWrapper />} />
    </Routes>
  )
}

export default AppRoutes
