// The customer's confirmed delivery point, as one reader for every screen that prices the menu (menu, product page,
// cart, checkout). The location screens write it under different keys; the order of preference is the address the
// customer picked, then the location set-up screen, then the older userLocation key.
const readJson = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || "null")
  } catch (_) {
    return null
  }
}

/** { lat, lng } of the saved delivery point, or null when none is saved. */
export function readSavedCoords() {
  const picked = readJson("deliveryLocation")?.selectedAddress
  if (Number.isFinite(picked?.lat) && Number.isFinite(picked?.lng)) return { lat: picked.lat, lng: picked.lng }
  const setup = readJson("user_location")
  if (Number.isFinite(setup?.lat) && Number.isFinite(setup?.lng)) return { lat: setup.lat, lng: setup.lng }
  const legacy = readJson("userLocation")
  if (Number.isFinite(legacy?.latitude) && Number.isFinite(legacy?.longitude)) return { lat: legacy.latitude, lng: legacy.longitude }
  return null
}

/** The store the customer chose to collect from ({ id, name, service }), or null when ordering for delivery. */
export function readPickupStore() {
  const service = (() => { try { return localStorage.getItem("activeService") || "delivery" } catch (_) { return "delivery" } })()
  if (service === "delivery" || service === "train") return null
  const store = readJson("pickupStore")
  return store?.id && store.service === service ? { id: String(store.id), name: String(store.name || ""), service } : null
}

/**
 * Which store a coupon list is for, as query params: the pickup store, else the store saved for this address, else the
 * saved delivery point (the server finds the store serving it). Same order as the store open / closed check, so every
 * coupon screen lists exactly the coupons checkout accepts at that store.
 */
export function couponStoreParams() {
  const pickup = readPickupStore()
  if (pickup?.id) return { storeId: pickup.id }
  const saved = (() => { try { return localStorage.getItem("user_storeId") || "" } catch (_) { return "" } })()
  if (saved) return { storeId: saved }
  const p = readSavedCoords()
  return p ? { lat: p.lat, lng: p.lng } : {}
}
