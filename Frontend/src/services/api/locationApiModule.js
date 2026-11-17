import apiClient, { userClient, restaurantClient, deliveryClient, adminClient } from "./axios.js";
import { API_ENDPOINTS } from "./config.js";
import * as authService from "./auth.js";
import { createStubAPI, emptyDataStub, stub } from "./core.js";


export const locationAPI = createStubAPI();
export const zoneAPI = {
  /**
   * Public: is this point served? Asks GET /food/stores/resolve (the nearest approved, open store, zone-aware) and
   * answers in the zone shape the screens read: { status: IN_SERVICE | OUT_OF_SERVICE, zoneId, zone }.
   * "No store here" (a 4xx) is OUT_OF_SERVICE; a network or server error is passed on.
   */
  detectZone: (lat, lng) =>
    userClient
      .get("/food/stores/resolve", { params: { lat, lng } })
      .then((res) => {
        const d = res?.data?.data || {}
        const zoneId = d.zoneId || d.storeId || null
        return {
          ...res,
          data: {
            success: true,
            data: zoneId
              ? { status: "IN_SERVICE", zoneId, zone: { _id: zoneId, name: d.storeName || "", storeId: d.storeId || null } }
              : { status: "OUT_OF_SERVICE", zoneId: null, zone: null },
          },
        }
      })
      .catch((err) => {
        const status = err?.response?.status
        if (status >= 400 && status < 500) {
          return { data: { success: true, data: { status: "OUT_OF_SERVICE", zoneId: null, zone: null } } }
        }
        throw err
      }),
  /** Public: list active zones (for onboarding dropdowns). */
  getPublicZones: (params = {}, config = {}) =>
    userClient.get("/food/zones/public", { params: params ?? {}, ...config }),
};

export const storeAPI = {
  /**
   * Public dishes for the search overlay: the active products from GET /food/products/public, returned as
   * data.data.dishes = [{ id, name, image, price }].
   */
  getPublicDishes: (params = {}) =>
    userClient
      .get("/food/products/public", { params: params?.search ? { search: params.search } : {} })
      .then((res) => {
        const list = Array.isArray(res?.data?.data) ? res.data.data : []
        const dishes = list.map((p) => ({
          id: String(p._id || p.id || ""),
          _id: String(p._id || p.id || ""),
          name: p.name || "",
          image: p.image || "",
          price: Number(p.price) || 0,
        }))
        return { ...res, data: { success: true, data: { dishes }, dishes } }
      }),
  getStores: (params = {}) =>
    userClient.get("/food/restaurant/restaurants", { params }),
  getStoreById: (id) =>
    userClient.get(`/food/restaurant/restaurants/${String(id)}`),
};
