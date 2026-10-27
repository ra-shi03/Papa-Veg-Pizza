import { userClient } from "./axios.js";

// The user app still calls the old "restaurant" API (getRestaurants, getRestaurantById, getMenuByRestaurantId,
// getPublicOffers). There is no /food/restaurant/* on the server any more: a customer is served by a STORE, and the
// menu and coupons are the shared catalogue. These functions answer the old calls from the real endpoints and
// return the old response shapes, so no page changes:
//   getRestaurants         -> GET /food/stores/resolve (the store that serves the customer) + GET /food/stores/:id
//   getRestaurantById      -> GET /food/stores/:id
//   getMenuByRestaurantId  -> GET /food/admin/menu/public?storeId=   (store prices, unavailable items hidden)
//   getPublicOffers        -> GET /food/offers/public

const reply = (data) => ({ data: { success: true, data }, status: 200, statusText: "OK", headers: {}, config: {} });

function savedLocation() {
  try {
    const loc = JSON.parse(localStorage.getItem("userLocation") || "null");
    if (Number.isFinite(loc?.latitude) && Number.isFinite(loc?.longitude)) return loc;
  } catch (_) {}
  return null;
}

/** A store as the old "restaurant" object the pages read. */
export function toRestaurant(s) {
  const coordinates = Number.isFinite(s.longitude) && Number.isFinite(s.latitude) ? [s.longitude, s.latitude] : undefined;
  const formattedAddress = [s.address, s.city, s.state, s.pincode].filter(Boolean).join(", ");
  return {
    _id: s._id, id: s._id, restaurantId: s._id, slug: s._id,
    name: s.storeName, restaurantName: s.storeName, phone: s.phone, city: s.city, address: formattedAddress,
    isOpen: s.isOpen !== false, isAcceptingOrders: s.isOpen !== false, status: "approved",
    location: { latitude: s.latitude, longitude: s.longitude, coordinates, address: s.address, formattedAddress, city: s.city, state: s.state },
  };
}

const getStore = (id, config = {}) => userClient.get(`/food/stores/${encodeURIComponent(String(id))}`, config);

export async function getRestaurants(params = {}, config = {}) {
  const loc = savedLocation();
  const lat = Number(params.lat ?? params.latitude ?? loc?.latitude);
  const lng = Number(params.lng ?? params.longitude ?? loc?.longitude);
  try {
    const resolved = await userClient.get("/food/stores/resolve", {
      params: Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : {}, _isFallback: true, ...config,
    });
    const storeId = resolved?.data?.data?.storeId;
    if (!storeId) return reply({ restaurants: [] });
    const store = await getStore(storeId, { _isFallback: true });
    return reply({ restaurants: [toRestaurant(store.data.data)] });
  } catch (err) {
    // no store serves this location right now (closed, none approved): an empty list, not an error screen
    if (err?.response && err.response.status < 500) return reply({ restaurants: [] });
    throw err;
  }
}

export async function getRestaurantById(id, config = {}) {
  const store = await getStore(id, { ...config });
  return reply({ restaurant: toRestaurant(store.data.data) });
}

const FOOD_TYPE = { veg: "Veg", vegan: "Veg", "non-veg": "Non-Veg" };

export async function getMenuByRestaurantId(id, config = {}) {
  const safeId = String(id || "").trim();
  if (!safeId) return { data: { success: false, data: null }, status: 200, statusText: "OK", headers: {}, config: {} };
  const { noCache, ...axiosConfig } = config || {};
  const res = await userClient.get("/food/admin/menu/public", { ...axiosConfig, params: { storeId: safeId } });
  const { categories = [], products = [] } = res?.data?.data || {};
  const order = new Map(categories.map((c, i) => [String(c._id), i]));
  const sections = new Map();
  for (const p of products) {
    const cat = p.categoryId && typeof p.categoryId === "object" ? p.categoryId : { _id: String(p.categoryId || "other"), label: "Menu" };
    const key = String(cat._id);
    if (!sections.has(key)) sections.set(key, { id: key, name: cat.label || cat.name || "Menu", items: [], subsections: [] });
    sections.get(key).items.push({
      id: p._id, _id: p._id, name: p.name, description: p.shortDescription || p.description || "", image: p.image || "",
      price: p.price, originalPrice: p.originalPrice || undefined, foodType: FOOD_TYPE[p.vegType] || "Veg", isAvailable: true,
      approvalStatus: "approved", category: cat.label || cat.name || "Menu",
      variants: (p.sizes || []).map((s, i) => ({ id: String(s._id || `${p._id}-${i}`), name: s.size, price: s.price })),
    });
  }
  const sorted = [...sections.values()].sort((a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999));
  return reply({ menu: { sections: sorted } });
}

export const getPublicOffers = (params = {}) => userClient.get("/food/offers/public", { params });
