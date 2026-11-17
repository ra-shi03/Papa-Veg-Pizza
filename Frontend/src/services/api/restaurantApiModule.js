import { adminClient } from "./axios.js";
import * as legacyStore from "./legacyStoreAdapter.js";

/**
 * Customer app reads of stores (the app still calls them "restaurants"), served by legacyStoreAdapter.
 * The old restaurant-owner API (auth, finance, menu, orders, add-ons, dining) was removed: it called /food/restaurant/*
 * routes the backend does not have.
 */
export const restaurantAPI = {
  getRestaurants: (params = {}, config = {}) => legacyStore.getRestaurants(params, config),
  getRestaurantById: (id, config = {}) => legacyStore.getRestaurantById(id, config),
  getMenuByRestaurantId: (id, config = {}) => legacyStore.getMenuByRestaurantId(id, config),
  getPublicOffers: (params = {}) => legacyStore.getPublicOffers(params),
  saveFcmToken: (token, platform = "web") => {
    if (!token) return Promise.reject(new Error("FCM token is required"));
    const path = platform === "mobile" ? "/fcm-tokens/mobile/save" : "/fcm-tokens/save";
    return adminClient.post(path, { token: String(token), platform });
  },
};
