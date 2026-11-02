// Who and where an order goes to. These come only from the signed-in customer's own profile, what they typed in the
// checkout, and the address they selected: there are no default values to fall back on.

const clean = (value) => String(value ?? "").trim()

const toPoint = (lat, lng) => {
  const point = { lat: Number(lat), lng: Number(lng) }
  const usable = lat != null && lng != null && Number.isFinite(point.lat) && Number.isFinite(point.lng) && (point.lat !== 0 || point.lng !== 0)
  return usable ? point : null
}

/** 10 digits, whichever way the number was saved (+91 98..., 098...). */
export const toTenDigitPhone = (value) => {
  const digits = clean(value).replace(/\D/g, "")
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2)
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1)
  return digits
}

/** `account` is data.account from GET /food/user/profile. A missing field stays empty. */
export const contactFromAccount = (account) => ({
  name: clean(account?.name),
  phone: toTenDigitPhone(account?.phone),
  email: clean(account?.email),
})

export function contactProblem({ name, phone } = {}) {
  if (!clean(name)) return "Please add your name to place the order."
  if (!/^\d{10}$/.test(toTenDigitPhone(phone))) return "Please add your 10-digit mobile number to place the order."
  // The email is optional: orders do not use it
  return null
}

const addressPoint = (address) => {
  const coordinates = address?.location?.coordinates
  if (Array.isArray(coordinates) && coordinates.length >= 2) return toPoint(coordinates[1], coordinates[0])
  return toPoint(address?.latitude, address?.longitude)
}

const distanceKm = (a, b) => {
  const rad = (deg) => (deg * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.asin(Math.sqrt(h))
}

/** "Flat 5, Vijay Nagar, Indore, Madhya Pradesh 452010, India" -> area, city, state and PIN code. */
export function parseAddressText(text) {
  const parts = clean(text).split(",").map(clean).filter(Boolean)
  if (parts.length && parts[parts.length - 1].toLowerCase() === "india") parts.pop()
  const zipCode = clean(text).match(/\b\d{6}\b/)?.[0] || ""
  if (zipCode && parts.length) {
    const last = parts[parts.length - 1].replace(zipCode, "").trim()
    if (last) parts[parts.length - 1] = last
    else parts.pop()
  }
  const state = parts.length >= 2 ? parts.pop() : ""
  const city = parts.length ? parts.pop() : ""
  return { area: parts.join(", "), city, state, zipCode }
}

/**
 * City and state for a train order (the order needs both): the station when the journey text names one, else "On train"; the
 * state is "Train delivery". The street is the journey text itself (PNR, coach, seat), which the rider needs.
 */
export function serviceArea(text) {
  const station = clean(text).match(/Station:\s*([^,]+)/i)?.[1]
  return { area: clean(text), city: clean(station) || "On train", state: "Train delivery", zipCode: "" }
}

/** The location the customer last picked on this device (the one the cart shows and quotes), from the location screens. */
export function readPickedLocation(storage = localStorage) {
  const read = (key) => {
    try {
      return JSON.parse(storage.getItem(key) || "null")
    } catch (_) {
      return null
    }
  }
  const text = clean(storage.getItem("deliveryAddress"))
  const picked = read("deliveryLocation")?.selectedAddress
  const setup = read("user_location")
  const current = read("userLocation")
  const setupPoint = toPoint(setup?.lat, setup?.lng)
  const currentPoint = toPoint(current?.latitude, current?.longitude)

  if (picked) return { address: clean(picked.address) || text, point: toPoint(picked.lat, picked.lng) }
  if (setupPoint) return { address: clean(setup.address) || text, point: setupPoint }
  if (currentPoint) {
    return {
      address: clean(current.formattedAddress || current.address) || text,
      point: currentPoint,
      city: clean(current.city),
      state: clean(current.state),
    }
  }
  return text ? { address: text, point: null } : null
}

const fromSaved = (address) => ({
  kind: "saved",
  id: address?.id || address?._id || "",
  label: address?.label || "Home",
  street: clean(address?.street),
  additionalDetails: clean(address?.additionalDetails),
  city: clean(address?.city),
  state: clean(address?.state),
  zipCode: clean(address?.zipCode),
  point: addressPoint(address),
  display: [address?.additionalDetails, address?.street, address?.city, address?.state, address?.zipCode].map(clean).filter(Boolean).join(", "),
})

/**
 * The address this order goes to: the location the customer picked (as the saved address it matches, when it does),
 * else their default saved address. Null when nothing is selected. Train, takeaway and in-car orders have no map point
 * of their own, so they keep their text and the nearest location known.
 */
export function selectDeliveryAddress({ saved = [], picked = null, service = "delivery" } = {}) {
  if (service !== "delivery") {
    if (!clean(picked?.address)) return null
    // No map point: a train has none, and a stale location from earlier must not become the drop-off
    return { kind: "service", id: "", label: "Home", ...serviceArea(picked.address), additionalDetails: "", point: null, display: clean(picked.address) }
  }
  if (picked) {
    const match = saved.find((address) => {
      const point = addressPoint(address)
      if (picked.point && point) return distanceKm(picked.point, point) <= 0.1
      return !picked.point && clean(address?.street) && clean(picked.address).includes(clean(address.street))
    })
    if (match) return fromSaved(match)
    if (clean(picked.address)) {
      const parsed = parseAddressText(picked.address)
      return {
        kind: "picked",
        id: "",
        label: "Home",
        ...parsed,
        city: picked.city || parsed.city,
        state: picked.state || parsed.state,
        additionalDetails: "",
        point: picked.point,
        display: clean(picked.address),
      }
    }
  }
  const fallback = saved.find((address) => address?.isDefault) || saved[0]
  return fallback ? fromSaved(fallback) : null
}

export function addressProblem(selected) {
  if (!selected) return "Please choose a delivery address to place your order."
  if (selected.kind === "service") return null
  if (!selected.point) return "We could not find this address on the map. Please choose it again."
  // Every order needs both (the order model requires them)
  if (!selected.city || !selected.state) return "We could not read the city and state of this address. Please choose it again."
  return null
}

/** The customer and address fields of the order. `houseNumber` and `landmark` are what the checkout form shows. */
export function buildOrderDetails({ contact, selected, houseNumber, landmark }) {
  const name = clean(contact?.name)
  const phone = toTenDigitPhone(contact?.phone)
  const house = clean(houseNumber)
  return {
    customerName: name,
    customerPhone: phone,
    address: {
      label: selected.label,
      name,
      phone,
      street: selected.kind === "saved" ? house : [house, selected.area].filter(Boolean).join(", "),
      additionalDetails: clean(landmark),
      city: selected.city,
      state: selected.state,
      zipCode: selected.zipCode,
      ...(selected.point ? { location: { type: "Point", coordinates: [selected.point.lng, selected.point.lat] } } : {}),
    },
  }
}

/**
 * The last check before an order leaves the browser: it carries this customer's contact and selected address and
 * nothing else. Throws with a message for the customer otherwise.
 */
export function assertOwnOrderDetails(payload, { contact, selected }) {
  const name = clean(contact?.name)
  const phone = toTenDigitPhone(contact?.phone)
  const location = payload?.address?.location?.coordinates
  const point = selected?.point
  const own =
    name && phone &&
    payload?.customerName === name && payload?.address?.name === name &&
    payload?.customerPhone === phone && payload?.address?.phone === phone &&
    clean(payload?.address?.street) &&
    !("email" in (payload || {})) && !("customerEmail" in (payload || {})) && !("email" in (payload?.address || {})) &&
    (point ? location?.[0] === point.lng && location?.[1] === point.lat : !location)
  if (!own) throw new Error("Please check your contact details and delivery address, then try again.")
  return payload
}
