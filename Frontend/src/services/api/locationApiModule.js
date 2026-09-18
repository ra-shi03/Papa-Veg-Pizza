import apiClient, { userClient, restaurantClient, deliveryClient, adminClient } from "./axios.js";
import { API_ENDPOINTS } from "./config.js";
import * as authService from "./auth.js";
import { createStubAPI, emptyDataStub, stub } from "./core.js";


export const locationAPI = createStubAPI();
export const zoneAPI = {
  /** Public: detect active service zone for a lat/lng point. */
  detectZone: (lat, lng) =>
    userClient.get("/food/zones/detect", {
      params: { lat, lng },
    }),
  /** Public: list active zones (for onboarding dropdowns). */
  getPublicZones: (params = {}, config = {}) =>
    userClient.get("/food/zones/public", { params: params ?? {}, ...config }),
};

export const storeAPI = {
  getPublicDishes: (params = {}) =>
    userClient.get("/food/restaurant/dishes/public", { params }),
  getStores: (params = {}) =>
    userClient.get("/food/restaurant/restaurants", { params }),
  getStoreById: (id) =>
    userClient.get(`/food/restaurant/restaurants/${String(id)}`),
};
