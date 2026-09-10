import { useCallback } from "react"
import { useLocation, useNavigate } from "react-router-dom"

const toFoodPath = (value) => {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  if (!trimmed) return null
  if (trimmed.startsWith("/food/")) return trimmed
  if (trimmed === "/food") return trimmed
  if (trimmed.startsWith("/user/")) return `/food${trimmed}`
  if (trimmed === "/user") return "/food/user"
  return null
}

const getNormalizedUserPath = (pathname) => {
  if (pathname.startsWith("/food")) {
    return pathname.slice(5) || "/"
  }
  return pathname || "/"
}

const resolveBackPath = ({ pathname, search, state }) => {
  const normalizedPath = getNormalizedUserPath(pathname)
  const explicitBackPath = toFoodPath(state?.backTo) || toFoodPath(state?.from) || toFoodPath(state?.returnTo)
  const searchParams = new URLSearchParams(search || "")

  if (
    normalizedPath === "/user/account/profile-details/payments/new" ||
    /^\/user\/account\/profile-details\/payments\/[^/]+\/edit$/.test(normalizedPath)
  ) {
    return explicitBackPath || "/food/user/account/profile-details/payments"
  }

  if (
    /^\/user\/(profile\/(favorites|support|coupons|about|report-safety-emergency|accessibility|logout|refer-earn)|account\/profile-details\/(edit|payments))$/.test(
      normalizedPath,
    )
  ) {
    return explicitBackPath || "/food/user/account/profile-details"
  }

  if (
    /^\/user\/profile\/(terms|privacy|refund|shipping|cancellation)$/.test(
      normalizedPath,
    )
  ) {
    return explicitBackPath || "/food/user/profile"
  }

  if (normalizedPath === "/user/wallet") {
    return "/food/user/profile"
  }

  if (normalizedPath === "/user/notifications") {
    return explicitBackPath || "/food/user"
  }





  if (/^\/user\/orders\/[^/]+(\/invoice|\/details)?$/.test(normalizedPath)) {
    return "/food/user/orders"
  }

  if (
    normalizedPath === "/user/cart/checkout" ||
    normalizedPath === "/user/cart/select-address"
  ) {
    return "/food/user/cart"
  }

  if (normalizedPath === "/user/address-selector") {
    return "/food/user"
  }

  if (/^\/user\/collections\/[^/]+$/.test(normalizedPath)) {
    return "/food/user/collections"
  }

  if (normalizedPath === "/user/categories") {
    return "/food/user"
  }

  if (/^\/user\/category\/[^/]+$/.test(normalizedPath)) {
    return "/food/user/categories"
  }

  if (
    normalizedPath === "/user/offers" ||
    normalizedPath === "/user/gourmet"
  ) {
    return "/food/user"
  }

  if (/^\/user\/product\/[^/]+$/.test(normalizedPath)) {
    return explicitBackPath || "/food/user"
  }

  if (/^\/user\/complaints(\/|$)/.test(normalizedPath)) {
    return explicitBackPath || "/food/user/orders"
  }

  if (explicitBackPath && explicitBackPath !== pathname) {
    return explicitBackPath
  }

  return "/food/user"
}

export default function useAppBackNavigation() {
  const navigate = useNavigate()
  const location = useLocation()

  return useCallback(() => {
    navigate(resolveBackPath(location))
  }, [location, navigate])
}
