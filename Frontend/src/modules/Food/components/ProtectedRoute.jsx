import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { isModuleAuthenticated, getCurrentUser, getModuleToken, getRoleFromToken } from "@food/utils/auth";

// Backend issues customer tokens with role "CUSTOMER"; routes ask for "user" (backend treats them as the same role).
const ROLE_ALIASES = { customer: "user" };
const normalizeRole = (role) => {
  const value = String(role || "").toLowerCase().replace(/_/g, "-");
  return ROLE_ALIASES[value] || value;
};

/**
 * Role-based Protected Route Component
 * Only allows access if user is authenticated for the specific module and has the required role.
 */
export default function ProtectedRoute({ children, requiredRole, module = "user", loginPath = "/user/auth/login" }) {
  const location = useLocation();

  // When the session can no longer be renewed (refresh token rejected or expired) the axios client clears the login and
  // announces it: re-check right away so the user is sent to the login page then, not at some later navigation.
  const [, setSessionCheck] = useState(0);
  useEffect(() => {
    const onSessionEnded = (event) => {
      if (!event?.detail?.module || event.detail.module === module) setSessionCheck((n) => n + 1);
    };
    window.addEventListener("authRefreshFailed", onSessionEnded);
    return () => window.removeEventListener("authRefreshFailed", onSessionEnded);
  }, [module]);

  const isAuthenticated = isModuleAuthenticated(module);

  // If not authenticated for this module, redirect to login
  if (!isAuthenticated) {
    return <Navigate to={loginPath} state={{ from: location.pathname }} replace />;
  }

  // If role check is required
  if (requiredRole) {
    // The cached user object (from login or /auth/me) may not carry a role, so also accept the
    // role in the signed token. The backend still enforces roles on every API call.
    const user = getCurrentUser(module);
    const userRoles = [user?.role, getRoleFromToken(getModuleToken(module)), user?.primaryRole]
      .filter(Boolean)
      .map(normalizeRole);
    const allowed = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

    const hasRole = allowed.some(r => userRoles.includes(normalizeRole(r)));
    if (!hasRole) {
      // Forbidden: authenticated but wrong role. Redirect to login
      return <Navigate to={loginPath} replace />;
    }
  }

  return children;
}
