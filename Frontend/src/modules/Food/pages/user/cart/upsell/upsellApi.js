import apiClient from "@/services/api/axios"

const readJson = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key) || "") ?? fallback
  } catch {
    return fallback
  }
}

export const fetchCartConfig = async () => {
  const res = await apiClient.get("/settings/cart-config")
  return res?.data?.data || null
}

export const fetchSuggestions = async (cartItemIds = []) => {
  const res = await apiClient.post("/settings/cart-config/suggestions", { cartItemIds })
  return res?.data?.data || null
}

export const claimOffer = async (cartTotal = 0) => {
  const res = await apiClient.post("/settings/cart-config/offer/claim", { cartTotal })
  return res?.data?.data || null
}

export const suggestionKey = (item) => `${item.kind}-${item.id}`

// Writes a suggested product/add-on into the same storage the menu and cart already share.
export const addSuggestionToCart = (item, extra = {}) => {
  const key = extra.key || suggestionKey(item)
  const customMap = readJson("pvp_customized_items", {})
  customMap[key] = {
    id: item.id,
    title: item.name,
    name: item.name,
    price: Number(item.price) || 0,
    image: item.image || "",
    description: item.group || "",
    selectedSize: item.size || "",
    customized: true,
    kind: item.kind,
    ...extra.meta,
  }
  localStorage.setItem("pvp_customized_items", JSON.stringify(customMap))

  const userCart = readJson("userCart", {})
  const current = userCart[key]
  const currentQty = typeof current === "object" && current ? Number(current.quantity) || 0 : Number(current) || 0
  userCart[key] = extra.singleQuantity ? 1 : currentQty + 1
  localStorage.setItem("userCart", JSON.stringify(userCart))
  window.dispatchEvent(new Event("cartUpdated"))
  return key
}

export const removeCartKey = (key) => {
  const userCart = readJson("userCart", {})
  delete userCart[key]
  localStorage.setItem("userCart", JSON.stringify(userCart))
  window.dispatchEvent(new Event("cartUpdated"))
}

export const OFFER_KEY_PREFIX = "offer-"

// Totals for whatever is currently in the shared cart storage.
export const readCartSummary = (products = []) => {
  const userCart = readJson("userCart", {})
  const customMap = readJson("pvp_customized_items", {})
  let count = 0
  let total = 0
  const ids = new Set()
  Object.entries(userCart).forEach(([key, value]) => {
    const qty = typeof value === "object" && value ? Number(value.quantity) || 0 : Number(value) || 0
    if (qty <= 0) return
    let price = 0
    let baseId = key
    if (customMap[key]) {
      price = Number(customMap[key].price) || 0
      baseId = String(customMap[key].id || key)
    } else {
      const product = products.find((p) => {
        const id = String(p.id || p._id || "")
        return id && (key === id || key.startsWith(`${id}-`))
      })
      if (product) {
        baseId = String(product.id || product._id)
        const sizeName = key.length > baseId.length ? key.slice(baseId.length + 1) : ""
        const size = (product.sizes || []).find((s) => String(s.name || s.size) === sizeName)
        price = Number(size?.price ?? product.price) || 0
      } else if (typeof value === "object" && value) {
        price = Number(value.price) || 0
      }
    }
    count += qty
    total += price * qty
    ids.add(baseId)
  })
  return { count, total, ids: [...ids] }
}
