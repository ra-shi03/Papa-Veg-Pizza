// The customer's cart lives in localStorage, the same contract the menu and the cart page use:
//   userCart               { [lineKey]: quantity }
//   pvp_customized_items   { [lineKey]: the full line spec (title, price, size, crust, toppings, ...) }
// "cartUpdated" tells the open screens to re-read it. Adding a line the way the menu does means the cart page, the
// home View Cart pill and checkout all see it, and the server re-prices it at checkout.

const readJson = (key, fallback) => {
  try {
    const v = JSON.parse(localStorage.getItem(key) || "null")
    return v && typeof v === "object" ? v : fallback
  } catch {
    return fallback
  }
}
const qtyOf = (v) => (typeof v === "object" && v !== null ? Number(v.quantity || 0) : Number(v || 0))
const notify = () => window.dispatchEvent(new Event("cartUpdated"))

const baseTitle = (name, size) => {
  const n = String(name || "Item").trim()
  const suffix = size ? ` (${size})` : ""
  return suffix && n.toLowerCase().endsWith(suffix.toLowerCase()) ? n.slice(0, n.length - suffix.length) : n
}

/** Splits what an order line recorded as add-ons back into the toppings / extras / cheese the cart page expects. */
const splitAddons = (addons = []) => {
  const toppings = []
  const meals = []
  let extraCheese = false
  ;(addons || []).forEach((a) => {
    const name = typeof a === "string" ? a : a?.name
    const type = String(a?.type || "").toLowerCase()
    if (!name) return
    if (type.includes("cheese") || /^extra cheese$/i.test(name)) extraCheese = true
    else if (type.includes("crust")) return
    else if (type.includes("topping")) toppings.push(name)
    else meals.push(name)
  })
  return { toppings, meals, extraCheese }
}

/** The cart line key for a previously ordered line. Same shape as the menu's, so the same pizza merges into one line. */
export function lineKeyFor(line) {
  const size = line.size || ""
  const { toppings, meals, extraCheese } = splitAddons(line.selectedAddons)
  const id = line.itemId || line.id || line._id
  return `${id}-${size}-${line.crust || ""}-${extraCheese ? "cheese" : "no"}-${[...toppings].sort().join("-")}-${[...meals].sort().join("-")}`
}

function specFor(line) {
  const size = line.size || ""
  const { toppings, meals, extraCheese } = splitAddons(line.selectedAddons)
  const name = baseTitle(line.name, size)
  return {
    id: String(line.itemId || line.id || line._id),
    title: size ? `${name} (${size})` : name,
    name,
    price: Number(line.price) || 0,
    image: line.image || "",
    description: line.notes || line.description || "",
    customized: true,
    kind: line.kind || "product",
    isVeg: line.isVeg !== false,
    selectedSize: size,
    crust: line.crust || "",
    toppings,
    meals,
    extraCheese,
  }
}

/** Adds `qty` of a previously ordered line. Returns the line key. */
export function addLineToCart(line, qty = 1) {
  const key = lineKeyFor(line)
  const custom = readJson("pvp_customized_items", {})
  custom[key] = specFor(line)
  const cart = readJson("userCart", {})
  cart[key] = qtyOf(cart[key]) + qty
  localStorage.setItem("pvp_customized_items", JSON.stringify(custom))
  localStorage.setItem("userCart", JSON.stringify(cart))
  notify()
  return key
}

/** Sets a line's quantity (0 removes it). */
export function setLineQty(key, qty) {
  const cart = readJson("userCart", {})
  if (qty <= 0) delete cart[key]
  else cart[key] = qty
  localStorage.setItem("userCart", JSON.stringify(cart))
  notify()
}

/** Reorder: the cart becomes exactly these lines. Skips limited-time offer lines (their price token has expired). */
export function replaceCartWithLines(lines) {
  const usable = (lines || []).filter((l) => l && (l.itemId || l.id || l._id) && !l.isLimitedOffer)
  if (!usable.length) return 0
  localStorage.setItem("userCart", "{}")
  const custom = readJson("pvp_customized_items", {})
  const cart = {}
  usable.forEach((l) => {
    const key = lineKeyFor(l)
    custom[key] = specFor(l)
    cart[key] = (cart[key] || 0) + Math.max(1, Number(l.quantity) || 1)
  })
  localStorage.setItem("pvp_customized_items", JSON.stringify(custom))
  localStorage.setItem("userCart", JSON.stringify(cart))
  notify()
  return usable.length
}

/** { count, total, lines: {key: qty} } for the View Cart bar. */
export function readCartSummary() {
  const cart = readJson("userCart", {})
  const custom = readJson("pvp_customized_items", {})
  let count = 0
  let total = 0
  const lines = {}
  Object.entries(cart).forEach(([key, v]) => {
    const q = qtyOf(v)
    if (q <= 0) return
    lines[key] = q
    count += q
    total += q * (Number(custom[key]?.price) || 0)
  })
  return { count, total, lines }
}
