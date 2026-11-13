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

// `offer.eligibility` is the server's verdict for this cart (POST /food/orders/coupon-eligibility): the coupon's
// category / product / store / first-order rules are decided there, so the saving it gives is used as is.
// A coupon limited to categories / items cannot be judged from the cart total, so until the server has said which
// lines qualify it is not offered (never estimated against the whole cart).
const hasSizes = (offer) => Array.isArray(offer?.applicableSizes) && offer.applicableSizes.length > 0
const scoped = (offer) => !offer?.eligibility && (offer?.applicableOn === "Category" || offer?.applicableOn === "Product" || hasSizes(offer))

export const offerLocked = (offer, subtotal) =>
  subtotal < (Number(offer?.minOrderValue) || 0) || offer?.eligibility?.eligible === false || scoped(offer)

export const offerLockText = (offer, subtotal) => {
  const min = Number(offer?.minOrderValue) || 0
  if (offer?.eligibility?.eligible === false && offer.eligibility.reason) return offer.eligibility.reason
  if (scoped(offer)) {
    if (hasSizes(offer)) return `Only on ${offer.applicableSizes.join(" / ")} size pizzas`
    return offer.applicableOn === "Product" ? "Only on selected items" : "Only on selected categories"
  }
  return `Add items worth ₹${Math.max(0, Math.ceil(min - subtotal))} more to unlock`
}

export function offerDiscount(offer, subtotal) {
  if (offer?.eligibility) return offer.eligibility.eligible ? Number(offer.eligibility.saving) || 0 : 0
  if (scoped(offer)) return 0
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
  if (offer.customerScope === "returning") terms.push("Only for customers who have ordered before")
  if (hasSizes(offer)) terms.push(`Valid on ${offer.applicableSizes.join(" / ")} size pizzas`)
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

// ---- payment method (chosen on the Payment Options page, kept on the device)

export const CASH_METHOD = { id: "cash", kind: "cash", title: "Cash / UPI on Delivery", short: "Cash / UPI on\nDelivery" }

// An online method comes from a gateway the super admin switched on (see usePaymentGateways).
export const onlineMethod = (gateway) => {
  const test = gateway.environment === "Sandbox"
  return {
    id: `online:${gateway.id}`,
    kind: "online",
    gatewayId: gateway.id,
    provider: gateway.provider,
    test,
    title: `${gateway.displayName}${test ? " (Test)" : ""}`,
    short: `${gateway.displayName}\n${test ? "(Test mode)" : "(Online)"}`,
  }
}

// What the customer pays with: their saved choice when it is still on offer, otherwise the best available method.
// Cash is switched off by `codEnabled`, online payment by `paymentOptionEnabled` or by having no active gateway.
export function readPaymentMethod(appConfig, gateways = []) {
  const cashOn = appConfig?.codEnabled !== false
  const online = appConfig?.paymentOptionEnabled === false ? [] : gateways
  const fallbackOnline = online.find((g) => g.isDefault) || online[0]
  let saved = ""
  try { saved = localStorage.getItem("preferred_payment_method") || "" } catch (_) {}

  if (saved === "cash" && cashOn) return CASH_METHOD
  if (saved.startsWith("online:") || saved === "razorpay_test") {
    const chosen = online.find((g) => `online:${g.id}` === saved) || fallbackOnline
    if (chosen) return onlineMethod(chosen)
  }
  if (cashOn) return CASH_METHOD
  return fallbackOnline ? onlineMethod(fallbackOnline) : CASH_METHOD
}
