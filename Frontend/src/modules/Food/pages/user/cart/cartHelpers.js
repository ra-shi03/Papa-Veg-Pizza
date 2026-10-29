// Shared by the cart and checkout: delivery location, delivery time slots, coupons and the order item payload.

const readJson = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || "null")
  } catch (_) {
    return null
  }
}

/** The confirmed delivery point, from whichever key the location screens wrote. */
export function getCartCoords() {
  const picked = readJson("deliveryLocation")?.selectedAddress
  if (Number.isFinite(picked?.lat) && Number.isFinite(picked?.lng)) return { lat: picked.lat, lng: picked.lng }
  const setup = readJson("user_location")
  if (Number.isFinite(setup?.lat) && Number.isFinite(setup?.lng)) return { lat: setup.lat, lng: setup.lng }
  const legacy = readJson("userLocation")
  if (Number.isFinite(legacy?.latitude) && Number.isFinite(legacy?.longitude)) return { lat: legacy.latitude, lng: legacy.longitude }
  return null
}

// ---- delivery time

const SLOT_KEY = "pvp_delivery_slot"
// A slot this close is no longer offered (the server still accepts it for a few more minutes)
const SLOT_MIN_AHEAD_MS = 30 * 60 * 1000

export const isSlotStillValid = (at) => !!at && new Date(at).getTime() - Date.now() > SLOT_MIN_AHEAD_MS

/** The chosen "later" slot (ISO), kept for this tab so a trip to the location screen does not lose it. */
export function loadSlot() {
  try {
    const at = sessionStorage.getItem(SLOT_KEY)
    return isSlotStillValid(at) ? at : null
  } catch (_) {
    return null
  }
}

export function saveSlot(at) {
  try {
    if (at) sessionStorage.setItem(SLOT_KEY, at)
    else sessionStorage.removeItem(SLOT_KEY)
  } catch (_) {}
}

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const daysFromToday = (d) => Math.round((startOfDay(d) - startOfDay(new Date())) / 86400000)

export const time12 = (at) => new Date(at).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true }).toUpperCase()

/** { top: "Today" | "Tomorrow" | "Thu", bottom: "28 Oct" } for a YYYY-MM-DD date */
export function dayLabel(ymd) {
  const [y, m, d] = ymd.split("-").map(Number)
  const date = new Date(y, m - 1, d)
  const offset = daysFromToday(date)
  return {
    top: offset === 0 ? "Today" : offset === 1 ? "Tomorrow" : date.toLocaleDateString("en-IN", { weekday: "short" }),
    bottom: date.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
  }
}

/** "Today" / "Tomorrow" / "Thu 30 Oct" */
export function slotDay(at) {
  const date = new Date(at)
  const offset = daysFromToday(date)
  return offset === 0 ? "Today" : offset === 1 ? "Tomorrow" : date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })
}

/** "Today, 7:30 PM" / "Tomorrow, 7:30 PM" / "Thu 30 Oct, 7:30 PM" */
export const slotLabel = (at) => `${slotDay(at)}, ${time12(at)}`

// ---- coupons (same maths as the server's order pricing)

export function offerDiscount(offer, subtotal) {
  if (!offer || subtotal < (Number(offer.minOrderValue) || 0)) return 0
  if (offer.discountType === "percentage") {
    const raw = subtotal * (Number(offer.discountValue) / 100)
    const capped = Number(offer.maxDiscount) ? Math.min(raw, Number(offer.maxDiscount)) : raw
    return Math.max(0, Math.min(subtotal, Math.floor(capped)))
  }
  return Math.max(0, Math.min(subtotal, Math.floor(Number(offer.discountValue) || 0)))
}

export const offerHeadline = (offer) =>
  offer.discountType === "percentage" ? `${offer.discountValue}% off` : `Flat ₹${offer.discountValue} off`

export function offerTerms(offer) {
  const terms = []
  terms.push(offer.minOrderValue > 0 ? `Valid on orders of ₹${offer.minOrderValue} or more` : "No minimum order value")
  if (offer.discountType === "percentage" && offer.maxDiscount) terms.push(`Maximum discount ₹${offer.maxDiscount}`)
  if (offer.customerScope === "first-time") terms.push("Only on your first order")
  if (offer.endDate) terms.push(`Valid till ${new Date(offer.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`)
  return terms
}

// ---- order payload

export const toOrderItems = (cartItems) => cartItems.map((item) => ({
  itemId: String(item.itemId || item.id),
  name: item.name,
  price: Number(item.price) || 0,
  quantity: item.quantity,
  image: item.image || "",
  size: item.size || "",
  kind: item.kind || "product",
  ...(item.crust ? { crust: item.crust } : {}),
  ...(item.toppings?.length ? { toppings: item.toppings } : {}),
  ...(item.meals?.length ? { meals: item.meals } : {}),
  ...(item.extraCheese ? { extraCheese: true } : {}),
  notes: item.description || "",
  ...(item.offerToken ? { offerToken: item.offerToken } : {}),
}))
