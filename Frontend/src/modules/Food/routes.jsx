import { Routes, Route, Navigate, useLocation } from "react-router-dom"
import { useEffect, Suspense, lazy } from "react"
import ProtectedRoute from "@food/components/ProtectedRoute"
import AuthRedirect from "@food/components/AuthRedirect"
import Loader from "@food/components/Loader"
import AuthInitializer from "@food/components/AuthInitializer"
import PushSoundEnableButton from "@food/components/PushSoundEnableButton"
import { registerWebPushForCurrentModule } from "@food/utils/firebaseMessaging"
import { isModuleAuthenticated } from "@food/utils/auth"

// Lazy Loading Components
const UserRouter = lazy(() => import("@food/components/user/UserRouter"))

// Admin Module
const FranchiseAdminRouter = lazy(() => import("@food/pages/franchise-admin/routes/FranchiseAdminRouter"))
const AdminLogin = lazy(() => import("@food/pages/franchise-admin/auth/AdminLogin"))
const AdminSignup = lazy(() => import("@food/pages/franchise-admin/auth/AdminSignup"))
const AdminForgotPassword = lazy(() => import("@food/pages/franchise-admin/auth/AdminForgotPassword"))
const SuperAdminRouter = lazy(() => import("./pages/superadmin/routes/SuperAdminRouter"))

function UserPathRedirect() {
  const location = useLocation()
  // Correctly handle the /food/user -> /food redirect regardless of where it starts
  const newPath = location.pathname.replace("/user", "") || "/food"
  return <Navigate to={newPath} replace />
}

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  const location = useLocation()

  useEffect(() => {
    registerWebPushForCurrentModule(location.pathname)
  }, [location.pathname])

  return (
    <AuthInitializer>
      <>
        <ScrollToTop />
        <PushSoundEnableButton />
        <Suspense fallback={<Loader />}>
          <Routes>
            {/* Super Admin Module */}
            <Route
              path="superadmin/*"
              element={<SuperAdminRouter />}
            />

            {/* User Module - Explicitly mapped to /user and the catch-all for /food/ and / */}
            {/* NOTE: /user/food is a common mis-navigation - redirect to correct /food/user home */}
            <Route path="user/food" element={<Navigate to="/food/user" replace />} />
            <Route
              path="user/*"
              element={<UserRouter />}
            />

            {/* Make UserRouter the default for all other paths to handle / and /food/ as user home */}
            <Route path="/*" element={<UserRouter />} />
          </Routes>
        </Suspense>
      </>
    </AuthInitializer>
  )
}
