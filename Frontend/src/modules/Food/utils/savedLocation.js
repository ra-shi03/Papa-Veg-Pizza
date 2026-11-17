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
