/**
 * Auth storage namespaces.
 *
 * Super admin, franchise admin and store manager all talk to the backend as the "admin" module, but each panel keeps
 * its own sign-in in localStorage so all of them can be signed in at once in the same browser (one tab per panel).
 * The panel is chosen from the URL of the current tab, so code keeps asking for module "admin" and gets the sign-in
 * of the panel it runs in.
 */

const PANEL_NAMESPACES = [
  // [path prefix, storage namespace, role the legacy shared "admin" sign-in had for this panel]
  ["/superadmin", "superadmin", "superadmin"],
  ["/franchise-admin", "franchise", "franchise-admin"],
  ["/store-operation", "storemanager", "store-manager"], // /store-operation/login and /store-operations/*
  ["/store-manager", "storemanager", "store-manager"],
];

const AUTH_SUFFIXES = ["accessToken", "refreshToken", "authenticated", "user"];

function currentPath() {
  if (typeof window === "undefined") return "";
  const { pathname = "", hash = "" } = window.location || {};
  // Native shells route with the hash (#/superadmin/...)
  return hash.startsWith("#/") ? hash.slice(1) : pathname;
}

/** Namespace of the staff panel open in this tab, or null when the tab is not on a staff panel. */
export function currentPanelNamespace() {
  const path = currentPath();
  const hit = PANEL_NAMESPACES.find(([prefix]) => new RegExp(`^${prefix}s?(/|$)`).test(path));
  return hit ? hit[1] : null;
}

/** The localStorage namespace for a module: "admin" resolves to the panel open in this tab. */
export function authNamespace(module) {
  if (module !== "admin") return module;
  return currentPanelNamespace() || "admin";
}

/** localStorage key for one piece of a module's sign-in, e.g. "admin_accessToken". */
export function authKey(module, suffix) {
  return `${authNamespace(module)}_${suffix}`;
}

/**
 * One-time move of the old shared "admin_*" sign-in into the namespace of the panel it belongs to (by its role),
 * so people already signed in are not logged out by this change.
 */
function migrateLegacyAdminAuth() {
  try {
    if (typeof localStorage === "undefined") return;
    if (!localStorage.getItem("admin_accessToken") && !localStorage.getItem("admin_refreshToken")) return;

    let role = "";
    try {
      const user = JSON.parse(localStorage.getItem("admin_user") || "null");
      role = String(user?.role || user?.primaryRole || "");
    } catch (_) {}
    if (!role) {
      try {
        const token = localStorage.getItem("admin_accessToken") || "";
        const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
        role = String(payload?.role || "");
      } catch (_) {}
    }
    role = role.toLowerCase().replace(/_/g, "-");

    const target = PANEL_NAMESPACES.find(([, , panelRole]) => panelRole === role);
    if (!target) return;
    const ns = target[1];
    if (localStorage.getItem(`${ns}_accessToken`) || localStorage.getItem(`${ns}_refreshToken`)) return;

    AUTH_SUFFIXES.forEach((suffix) => {
      const value = localStorage.getItem(`admin_${suffix}`);
      if (value != null) localStorage.setItem(`${ns}_${suffix}`, value);
      localStorage.removeItem(`admin_${suffix}`);
    });
  } catch (_) {}
}

migrateLegacyAdminAuth();
