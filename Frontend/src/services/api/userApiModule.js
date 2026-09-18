import apiClient, { userClient, restaurantClient, deliveryClient, adminClient } from "./axios.js";
import { API_ENDPOINTS } from "./config.js";
import * as authService from "./auth.js";
import { createStubAPI, emptyDataStub, stub } from "./core.js";


export const publicGetOnce = (url, config = {}) => {
  const safeUrl = typeof url === "string" ? url.trim() : "";
  const { noCache, params, ...axiosConfig } = config || {};
  if (!safeUrl) return Promise.reject(new Error("url is required"));

  if (noCache) {
    return userClient.get(safeUrl, { params, ...axiosConfig });
  }

  const keyParams =
    params && typeof params === "object" ? { ...params } : params;
  if (keyParams && typeof keyParams === "object") {
    // `_ts` is used as a cache-buster in some call sites; ignore it for dedupe purposes.
    delete keyParams._ts;
  }

  const key = `GET:${safeUrl}:${stableStringify(keyParams)}`;
  return publicGenericGetCache.getOrCreate(key, () =>
    userClient.get(safeUrl, { params, ...axiosConfig }),
  );
};

const getPublicRestaurantsOnce = (params = {}, config = {}) => {
  const { noCache, ...axiosConfig } = config || {};
  if (noCache) {
    return userClient.get("/food/restaurant/restaurants", {
      params: { limit: 1000, ...params },
      ...axiosConfig,
    });
  }
  const keyParams = { limit: 1000, ...params };
  // `_ts` is an explicit cache-buster in many call sites; ignore it for dedupe purposes.
  if (keyParams && typeof keyParams === "object") {
    delete keyParams._ts;
  }
  const key = `restaurants:${stableStringify(keyParams)}`;
  return publicRestaurantsCache.getOrCreate(key, () =>
    userClient.get("/food/restaurant/restaurants", {
      params: { limit: 1000, ...params },
      ...axiosConfig,
    }),
  );
};

const getPublicRestaurantMenuOnce = (id, config = {}) => {
  const safeId = String(id || "").trim();
  const { noCache, ...axiosConfig } = config || {};
  if (!safeId) {
    return Promise.resolve({
      data: { success: false, data: null },
      status: 200,
      statusText: "OK",
      headers: {},
      config: {},
    });
  }
  if (noCache) {
    return userClient.get(`/food/restaurant/restaurants/${safeId}/menu`, {
      ...axiosConfig,
    });
  }
  const key = `menu:${safeId}`;
  return publicRestaurantMenuCache.getOrCreate(key, () =>
    userClient.get(`/food/restaurant/restaurants/${safeId}/menu`, {
      ...axiosConfig,
    }),
  );
};

const getPublicRestaurantOutletTimingsOnce = (id, config = {}) => {
  const safeId = String(id || "").trim();
  const { noCache, ...axiosConfig } = config || {};
  if (!safeId) {
    return Promise.resolve({
      data: { success: false, data: null },
      status: 200,
      statusText: "OK",
      headers: {},
      config: {},
    });
  }
  if (noCache) {
    return userClient.get(
      `/food/restaurant/restaurants/${safeId}/outlet-timings`,
      { ...axiosConfig },
    );
  }
  const key = `outletTimings:${safeId}`;
  return publicRestaurantOutletTimingsCache.getOrCreate(key, () =>
    userClient.get(`/food/restaurant/restaurants/${safeId}/outlet-timings`, {
      ...axiosConfig,
    }),
  );
};

/** Single in-flight + short cache for restaurant /food/restaurant/current - prevents request storms. */
let restaurantCurrentInFlight = null;
let restaurantCurrentCached = null;
let restaurantCurrentCacheTime = 0;
const RESTAURANT_CURRENT_CACHE_MS = 3000;

const getRestaurantCurrentOnce = () => {
  const now = Date.now();
  if (
    restaurantCurrentCached &&
    now - restaurantCurrentCacheTime < RESTAURANT_CURRENT_CACHE_MS
  ) {
    return Promise.resolve(restaurantCurrentCached);
  }
  if (!restaurantCurrentInFlight) {
    restaurantCurrentInFlight = restaurantClient
      .get("/food/restaurant/current")
      .then((res) => {
        restaurantCurrentCached = res;
        restaurantCurrentCacheTime = Date.now();
        return res;
      })
      .finally(() => {
        restaurantCurrentInFlight = null;
      });
  }
  return restaurantCurrentInFlight;
};

/** Single in-flight + short cache for delivery /auth/me - one call per page load / refresh. */
let deliveryMeInFlight = null;
let deliveryMeCached = null;
let deliveryMeCacheTime = 0;
const DELIVERY_ME_CACHE_MS = 3000;

const getDeliveryMeOnce = () => {
  const now = Date.now();
  if (deliveryMeCached && now - deliveryMeCacheTime < DELIVERY_ME_CACHE_MS) {
    return Promise.resolve(deliveryMeCached);
  }
  if (!deliveryMeInFlight) {
    deliveryMeInFlight = authService
      .getMe("delivery")
      .then((res) => {
        deliveryMeCached = res;
        deliveryMeCacheTime = Date.now();
        return res;
      })
      .finally(() => {
        deliveryMeInFlight = null;
      });
  }
  return deliveryMeInFlight;
};


export const userAPI = {
  /** Get current user profile (Bearer USER). */
  getProfile: () =>
    getUserMeOnce().then((res) => {
      const user =
        res?.data?.data?.user ??
        res?.data?.user ??
        res?.data?.data ??
        res?.data;
      return { ...res, data: { ...res.data, data: { user } } };
    }),
  /** PATCH /food/user/profile (Bearer USER) */
  updateProfile: (body) =>
    userClient.patch("/food/user/profile", body ?? {}),
  /** Upload and set user profile image (multipart). Field name: file */
  uploadProfileImage: (file) => {
    if (!file) return Promise.reject(new Error("File is required"));
    const formData = new FormData();
    formData.append("file", file);
    return userClient.post("/food/user/profile/profile-image", formData);
  },
  /** GET /food/user/wallet (Bearer USER). Deduped + short-cached. */
  getWallet: (() => {
    let inFlight = null;
    let cached = null;
    let cacheTime = 0;
    const CACHE_MS = 3000;
    return () => {
      const now = Date.now();
      if (cached && now - cacheTime < CACHE_MS) return Promise.resolve(cached);
      if (!inFlight) {
        inFlight = userClient
          .get("/food/user/wallet")
          .then((res) => {
            cached = res;
            cacheTime = Date.now();
            return res;
          })
          .finally(() => {
            inFlight = null;
          });
      }
      return inFlight;
    };
  })(),
  /** GET /food/user/referrals/stats (Bearer USER) */
  getReferralStats: () =>
    userClient.get("/food/user/referrals/stats"),
  /** GET /food/user/referrals/details (Bearer USER) */
  getReferralDetails: () =>
    userClient.get("/food/user/referrals/details"),
  /** POST /food/user/wallet/topup/order (Bearer USER). Body: { amount } */
  createWalletTopupOrder: (amount) =>
    userClient.post(
      "/food/user/wallet/topup/order",
      { amount: Number(amount) }
    ),
  /** POST /food/user/wallet/topup/verify (Bearer USER) */
  verifyWalletTopupPayment: (body) =>
    userClient.post("/food/user/wallet/topup/verify", body ?? {}),
  /** GET /food/user/addresses (Bearer USER). Deduped + short-cached. */
  getAddresses: (() => {
    let inFlight = null;
    let cached = null;
    let cacheTime = 0;
    const CACHE_MS = 3000;
    return () => {
      const now = Date.now();
      if (cached && now - cacheTime < CACHE_MS) return Promise.resolve(cached);
      if (!inFlight) {
        inFlight = userClient
          .get("/food/user/addresses")
          .then((res) => {
            cached = res;
            cacheTime = Date.now();
            return res;
          })
          .finally(() => {
            inFlight = null;
          });
      }
      return inFlight;
    };
  })(),
  /** POST /food/user/addresses (Bearer USER) */
  addAddress: (body) =>
    userClient.post("/food/user/addresses", body ?? {}),
  /** PATCH /food/user/addresses/:id (Bearer USER) */
  updateAddress: (id, body) =>
    userClient.patch(`/food/user/addresses/${String(id)}`, body ?? {}),
  /** DELETE /food/user/addresses/:id (Bearer USER) */
  deleteAddress: (id) =>
    userClient.delete(`/food/user/addresses/${String(id)}`),
  /** PATCH /food/user/addresses/:id/default (Bearer USER) */
  setDefaultAddress: (id) =>
    userClient.patch(
      `/food/user/addresses/${String(id)}/default`,
      {}
    ),
  /** POST /food/user/safety-emergency-reports (Bearer USER) */
  createSafetyEmergencyReport: (message) =>
    userClient.post(
      "/food/user/safety-emergency-reports",
      { message: String(message || "") }
    ),
  /** GET /food/user/safety-emergency-reports (Bearer USER) */
  getMySafetyEmergencyReports: (params) =>
    userClient.get("/food/user/safety-emergency-reports", {
      params: params ?? {}
    }),
  /**
   * Legacy UI compatibility: update "current user location".
   * We already persist the user's selected location in localStorage in the UI.
   * Keep this as a no-op success so existing flows don't break.
   */
  updateLocation: (_payload) =>
    Promise.resolve({
      data: { success: true, message: "Location saved (client)", data: null },
    }),
  saveFcmToken: (token, options = {}) => {
    if (!token) return Promise.reject(new Error("FCM token is required"));
    const platform = options?.platform === "mobile" ? "mobile" : "web";
    const path =
      platform === "mobile" ? "/fcm-tokens/mobile/save" : "/fcm-tokens/save";
    return userClient.post(
      path,
      { token: String(token), platform }
    );
  },
  removeFcmToken: (token, options = {}) => {
    if (!token) return Promise.reject(new Error("FCM token is required"));
    const platform = options?.platform === "mobile" ? "mobile" : "web";
    return userClient.delete(
      `/fcm-tokens/remove/${encodeURIComponent(String(token))}`,
      {
        data: { token: String(token), platform }
      }
    );
  },
  testFcmNotification: (options = {}) => {
    const platform = options?.platform === "mobile" ? "mobile" : "web";
    return userClient.post("/fcm-tokens/test", { platform });
  },
  /** DELETE /food/user/account - permanently delete user account */
  deleteAccount: () =>
    userClient.delete("/food/user/account"),
};


export const heroBannerAPI = createStubAPI();

export const publicAPI = {
  getPrivacy: (key = "privacy") => userClient.get(`/food/pages/${key}`),
  getTerms: (key = "terms") => userClient.get(`/food/pages/${key}`),
};
