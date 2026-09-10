import { Navigate, useLocation } from "react-router-dom";
import { isModuleAuthenticated, getCurrentUser } from "@food/utils/auth";

/**
 * Role-based Protected Route Component
 * Only allows access if user is authenticated for the specific module and has the required role.
 */
export default function ProtectedRoute({ children, requiredRole, module = "user", loginPath = "/user/auth/login" }) {
  const location = useLocation();

  const isAuthenticated = isModuleAuthenticated(module);

  // If not authenticated for this module, redirect to login
  if (!isAuthenticated) {
    return <Navigate to={loginPath} state={{ from: location.pathname }} replace />;
  }

  // If role check is required
  if (requiredRole) {
    const user = getCurrentUser(module);
    const userRole = String(user?.role || "").toLowerCase().replace(/_/g, "-");
    const allowed = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    
    const hasRole = allowed.some(r => String(r).toLowerCase().replace(/_/g, "-") === userRole);
    if (!hasRole) {
      // Forbidden: authenticated but wrong role. Redirect to login
      return <Navigate to={loginPath} replace />;
    }
  }

  // If user has not completed profile onboarding (only for customer users), force redirect to creation page
  if (module === "user" && !location.pathname.includes("/profile/create")) {
    try {
      const storedUser = getCurrentUser("user");
      if (storedUser && !storedUser.profileCompleted) {
        return <Navigate to="/user/profile/create" replace />;
      }
    } catch (e) {
      console.error("[ProtectedRoute] Error reading profile completion", e);
    }
  }

  return children;
}
