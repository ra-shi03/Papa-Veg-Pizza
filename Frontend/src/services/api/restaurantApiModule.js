import apiClient, { userClient, restaurantClient, deliveryClient, adminClient } from "./axios.js";
import { API_ENDPOINTS } from "./config.js";
import * as authService from "./auth.js";
import { createStubAPI, emptyDataStub, stub } from "./core.js";


export const restaurantAPI = {
  sendOTP: (phone, _purpose = "login") => {
    if (!phone) return Promise.reject(new Error("Phone is required"));
    return authService.requestRestaurantOtp(phone);
  },
  verifyOTP: (phone, otp, _purpose, _name, _email, fcmToken = null, platform = "web") => {
    if (!phone || !otp)
      return Promise.reject(new Error("Phone and OTP are required"));
    return authService.verifyRestaurantOtp(phone, otp, fcmToken, platform);
  },
  getMe: () => authService.getMe("restaurant"),
  /** Restaurant dashboard: fetch current restaurant profile (deduped + short-cached). */
  getCurrentRestaurant: () => getRestaurantCurrentOnce(),
  /** Finance dashboard for `hub-finance`. */
  getFinance: (params = {}) =>
    restaurantClient.get("/food/restaurant/finance", { params: params || {} }),
  /** Fetch restaurant by owner (stub for missing backend endpoint). */
  getRestaurantByOwner: () =>
    Promise.resolve({
      data: {
        success: true,
        data: {
          restaurant: {
            name: "Your Restaurant",
            restaurantId: "REST000001",
            address: "Your address",
          },
        },
      },
    }),
  /** Submit a real withdrawal request to the backend. */
  createWithdrawalRequest: (amount) =>
    restaurantClient.post("/food/restaurant/withdraw", { amount: Number(amount) }),
  /** List withdrawal history for current restaurant. */
  getWithdrawalHistory: () =>
    restaurantClient.get("/food/restaurant/withdrawals"),
  /** Update restaurant profile fields (name/cuisines/location/menuImages). */
  updateProfile: (body) =>
    restaurantClient
      .patch("/food/restaurant/profile", body ?? {})
      .then((res) => {
        // Keep cache coherent to avoid an immediate refetch storm.
        restaurantCurrentCached = res;
        restaurantCurrentCacheTime = Date.now();
        return res;
      }),
  updateDiningSettings: (body) =>
    restaurantClient
      .patch("/food/restaurant/dining-settings", body ?? {})
      .then((res) => {
        restaurantCurrentCached = res;
        restaurantCurrentCacheTime = Date.now();
        return res;
      }),
  requestDiningUpdate: (body) =>
    restaurantClient.post("/food/restaurant/dining-settings/request", body ?? {}),
  getPendingDiningRequest: () =>
    restaurantClient.get("/food/restaurant/dining-settings/pending"),
  /** PATCH /food/restaurant/availability. Body: { isAcceptingOrders: boolean } */
  updateAcceptingOrders: (isAcceptingOrders) =>
    restaurantClient
      .patch(
        "/food/restaurant/availability",
        { isAcceptingOrders: Boolean(isAcceptingOrders) }
      )
      .then((res) => {
        // Keep cache coherent to avoid an immediate refetch storm.
        restaurantCurrentCached = res;
        restaurantCurrentCacheTime = Date.now();
        return res;
      }),
  /** Upload and set restaurant profile image (multipart). Field name: file */
  uploadProfileImage: (file) => {
    if (!file) return Promise.reject(new Error("File is required"));
    const formData = new FormData();
    formData.append("file", file);
    return restaurantClient.post("/food/restaurant/profile/profile-image", formData);
  },
  /** Upload a menu/cover image (multipart). Does not auto-attach; use updateProfile(menuImages) after. */
  uploadMenuImage: (file) => {
    if (!file) return Promise.reject(new Error("File is required"));
    const formData = new FormData();
    formData.append("file", file);
    return restaurantClient.post("/food/restaurant/profile/menu-image", formData);
  },
  uploadCoverImages: (files = []) => {
    const normalizedFiles = Array.from(files || []).filter(Boolean);
    if (normalizedFiles.length === 0) {
      return Promise.reject(new Error("At least one file is required"));
    }
    const formData = new FormData();
    normalizedFiles.forEach((file) => formData.append("files", file));
    return restaurantClient.post("/food/restaurant/profile/cover-images", formData);
  },
  uploadMenuImages: (files = []) => {
    const normalizedFiles = Array.from(files || []).filter(Boolean);
    if (normalizedFiles.length === 0) {
      return Promise.reject(new Error("At least one file is required"));
    }
    const formData = new FormData();
    normalizedFiles.forEach((file) => formData.append("files", file));
    return restaurantClient.post("/food/restaurant/profile/menu-images", formData);
  },
  /** Public Offers for users (global/selected restaurant) */
  getPublicOffers: () => userClient.get("/food/restaurant/offers"),
  /** Backward-compat helper used by Cart: returns coupons array for an item by adapting public offers */
  getCouponsByItemIdPublic: (restaurantId, _itemId) =>
    userClient.get("/food/restaurant/offers").then((res) => {
      const list = res?.data?.data?.allOffers || res?.data?.allOffers || [];
      const now = Date.now();
      const coupons = list
        .filter((o) => {
          // Guard: respect selected restaurant scope
          if (String(o?.restaurantScope) === "selected") {
            if (!restaurantId) return false;
            return String(o.restaurantId || "") === String(restaurantId || "");
          }
          return true;
        })
        .map((o) => {
          const isPct = o.discountType === "percentage";
          return {
            couponCode: o.couponCode,
            discountType: o.discountType,
            discountPercentage: isPct ? Number(o.discountValue) || 0 : 0,
            originalPrice: 0,
            discountedPrice: 0,
            minOrderValue: Number(o.minOrderValue || 0),
            minOrder: Number(o.minOrderValue || 0),
            maxDiscount: o.maxDiscount != null ? Number(o.maxDiscount) : null,
            customerGroup: o.customerScope || "all",
            isGlobalCoupon: true,
            endDate: o.endDate || null,
            showInCart: o.showInCart !== false,
            _ts: now,
          };
        });
      return { data: { success: true, data: { coupons } } };
    }),
  /** Categories (restaurant dashboard) */
  getCategories: (params = {}) =>
    // Compact payload for item creation forms (id + name only).
    restaurantClient.get("/food/restaurant/categories", {
      params: { compact: true, limit: 1000, ...params },
    }),
  // For MenuCategoriesPage compatibility
  getAllCategories: (params = {}) =>
    restaurantClient.get("/food/restaurant/categories", {
      params: {
        includeInactive: true,
        withCounts: true,
        limit: 1000,
        ...params,
      },
    }),
  createCategory: (body) =>
    restaurantClient.post("/food/restaurant/categories", body ?? {}),
  updateCategory: (id, body) =>
    restaurantClient.patch(`/food/restaurant/categories/${String(id)}`, body ?? {}),
  deleteCategory: (id) =>
    restaurantClient.delete(`/food/restaurant/categories/${String(id)}`),
  /** Menu (restaurant dashboard) */
  getMenu: (params = {}) =>
    restaurantClient.get("/food/restaurant/menu", { params }),
  /** Orders (restaurant dashboard) */
  getOrders: (params = {}) =>
    restaurantClient.get("/food/restaurant/orders", {
      params: { limit: 50, page: 1, ...params },
    }),
  getOrderById: (orderId) =>
    restaurantClient.get(`/food/restaurant/orders/${String(orderId)}`),
  updateMenu: (body) =>
    restaurantClient.patch("/food/restaurant/menu", body ?? {}),
  saveFcmToken: (token, platform = "web") => {
    if (!token) return Promise.reject(new Error("FCM token is required"));
    const path =
      platform === "mobile" ? "/fcm-tokens/mobile/save" : "/fcm-tokens/save";
    return restaurantClient.post(path, { token: String(token), platform });
  },
  removeFcmToken: (token, platform = "web") => {
    if (!token) return Promise.reject(new Error("FCM token is required"));
    return restaurantClient.delete(
      `/fcm-tokens/remove/${encodeURIComponent(String(token))}`,
      { data: { token: String(token), platform } }
    );
  },
  /** Outlet timings (restaurant dashboard) */
  getOutletTimings: () =>
    restaurantClient.get("/food/restaurant/outlet-timings"),
  saveOutletTimings: (outletTimings) =>
    restaurantClient.post(
      "/food/restaurant/outlet-timings",
      { outletTimings: outletTimings || {} }
    ),
  /** Foods (restaurant) - stored in food_items collection */
  createFood: (body) =>
    restaurantClient.post("/food/restaurant/foods", body ?? {}),
  bulkCreateFood: (items) =>
    restaurantClient.post("/food/restaurant/foods/bulk", items ?? []),
  updateFood: (id, body) =>
    restaurantClient.patch(`/food/restaurant/foods/${String(id)}`, body ?? {}),
  /** Orders (restaurant dashboard) */
  getOrders: (() => {
    // Single-flight de-dupe to avoid duplicate GETs in React StrictMode / double-mount.
    let inFlight = null;
    let inFlightKey = "";
    let cache = null;
    let cacheKey = "";
    let cacheAt = 0;
    const CACHE_MS = 800;

    const buildKey = (p = {}) => JSON.stringify({ limit: 50, page: 1, ...p });

    return (params = {}) => {
      const key = buildKey(params);
      const now = Date.now();

      if (cache && cacheKey === key && now - cacheAt < CACHE_MS) {
        return Promise.resolve(cache);
      }

      if (inFlight && inFlightKey === key) return inFlight;

      inFlightKey = key;
      inFlight = restaurantClient
        .get("/food/restaurant/orders", {
          params: { limit: 50, page: 1, ...params }
        })
        .then((res) => {
          // Backend paginated shape: { data: { data: [...], meta: {...} } }
          // Normalize to { data: { data: { orders: [...], meta } } } for restaurant UI pages.
          const payload = res?.data?.data || {};
          const rowsRaw = Array.isArray(payload.data) ? payload.data : [];

          // Normalize backend order fields to match existing restaurant UI expectations.
          // UI historically uses: order.status, order.address, order.total, order.paymentMethod
          const normalizeStatus = (s) => {
            const v = String(s || "").toLowerCase();
            // Backend: created -> treat as confirmed/new in UI
            if (v === "created") return "confirmed";
            // Backend: ready_for_pickup -> ready
            if (v === "ready_for_pickup") return "ready";
            // Backend: picked_up -> out_for_delivery (restaurant handed over)
            if (v === "picked_up") return "out_for_delivery";
            if (v.includes("cancel")) return "cancelled";
            return v || "confirmed";
          };

          const rows = rowsRaw.map((o) => {
            const status = normalizeStatus(o.orderStatus || o.status);
            const address = o.deliveryAddress || o.address;
            const total = o.pricing?.total ?? o.total ?? 0;
            const paymentMethod = o.payment?.method || o.paymentMethod || null;
            return { ...o, status, address, total, paymentMethod };
          });
          const meta = payload.meta || {};
          const normalized = {
            ...res,
            data: {
              ...res.data,
              data: { orders: rows, meta },
            },
          };

          cache = normalized;
          cacheKey = key;
          cacheAt = Date.now();
          return normalized;
        })
        .finally(() => {
          inFlight = null;
          inFlightKey = "";
        });

      return inFlight;
    };
  })(),
  updateOrderStatus: (orderId, body) => {
    const raw = body ?? {};
    const outgoing = { ...raw };

    // Translate UI-friendly statuses to backend enum values.
    const normalizeOutgoingStatus = (s) => {
      const v = String(s || "")
        .toLowerCase()
        .trim();
      if (!v) return v;
      if (v === "ready") return "ready_for_pickup";
      if (v === "out_for_delivery") return "picked_up";
      if (v === "cancelled") return "cancelled_by_restaurant";
      return v;
    };

    if (outgoing.orderStatus) {
      outgoing.orderStatus = normalizeOutgoingStatus(outgoing.orderStatus);
    }

    return restaurantClient.patch(
      `/food/restaurant/orders/${String(orderId)}/status`,
      outgoing
    );
  },
  /**
   * Accept an incoming order (restaurant).
   * UI expects this to move order into "preparing" bucket.
   * Backend supports PATCH /food/restaurant/orders/:orderId/status with { orderStatus }.
   */
  acceptOrder: async (orderId, _prepTimeMins = null) => {
    try {
      return await restaurantAPI.updateOrderStatus(orderId, {
        orderStatus: "preparing",
      });
    } catch (error) {
      const statusCode = Number(error?.response?.status || 0);
      if (statusCode === 400) {
        // Compatibility fallback: some backends treat "confirmed" as accept action.
        return restaurantAPI.updateOrderStatus(orderId, {
          orderStatus: "confirmed",
        });
      }
      throw error;
    }
  },
  /**
   * Reject/cancel order by restaurant.
   * Backend orderStatus enum: cancelled_by_restaurant.
   */
  rejectOrder: (orderId, reason = "") =>
    restaurantAPI.updateOrderStatus(orderId, {
      orderStatus: "cancelled_by_restaurant",
      note: reason,
    }),
  /** Mark order ready (restaurant handoff). */
  markOrderReady: (orderId) =>
    restaurantAPI.updateOrderStatus(orderId, {
      orderStatus: "ready_for_pickup",
    }),
  /**
   * Get a single order by id for restaurant screens.
   * Prefer direct endpoint; fallback to list+filter for backward compatibility.
   */
  getOrderById: async (orderId) => {
    return await restaurantClient.get(`/food/restaurant/orders/${String(orderId)}`);
  },
  /** Add-ons (restaurant) - approval handled by admin */
  getAddons: (params = {}) =>
    restaurantClient.get("/food/restaurant/addons", {
      // Backend validator enforces limit <= 100
      params: { limit: 100, page: 1, ...params }
    }),
  addAddon: (body) =>
    restaurantClient.post("/food/restaurant/addons", body ?? {}),
  updateAddon: (id, body) =>
    restaurantClient.patch(`/food/restaurant/addons/${String(id)}`, body ?? {}),
  deleteAddon: (id) =>
    restaurantClient.delete(`/food/restaurant/addons/${String(id)}`),
  logout: (refreshToken) => {
    restaurantCurrentInFlight = null;
    restaurantCurrentCached = null;
    restaurantCurrentCacheTime = 0;
    const token =
      refreshToken ||
      (typeof localStorage !== "undefined"
        ? localStorage.getItem("restaurant_refreshToken")
        : null);
    const fcmToken = typeof localStorage !== "undefined" ? localStorage.getItem("fcm_web_registered_token_restaurant") : null;
    return authService.logout(token, fcmToken, "web");
  },
  /** Backend has no email/password login; use phone OTP only. */
  login: (_email, _password) =>
    Promise.reject(new Error("Please use phone number and OTP to sign in.")),
  /**
   * Register a restaurant (multipart FormData).
   * Backend: POST /v1/food/restaurant/register (path relative to baseURL /api/v1)
   */
  register: (formData) => {
    if (!formData || !(formData instanceof FormData)) {
      return Promise.reject(new Error("FormData is required"));
    }
    return restaurantClient.post("/food/restaurant/register", formData);
  },
  /** Public: list approved restaurants for user app */
  getRestaurants: (params = {}, config = {}) =>
    getPublicRestaurantsOnce(params, config),
  /** Public: get single approved restaurant by id or slug */
  getRestaurantById: (id, config = {}) =>
    userClient.get(`/food/restaurant/restaurants/${String(id)}`, { ...config }),
  /** Public: get approved menu by restaurant id or slug */
  getMenuByRestaurantId: (id, config = {}) =>
    getPublicRestaurantMenuOnce(id, config),
  /** Public: get outlet timings by restaurant id */
  getOutletTimingsByRestaurantId: (id, config = {}) =>
    getPublicRestaurantOutletTimingsOnce(id, config),
  /** Public (user app): approved add-ons by restaurant id/slug */
  getAddonsByRestaurantId: (id, config = {}) =>
    userClient.get(`/food/restaurant/restaurants/${String(id)}/addons`, {
      ...config,
    }),
  getPublicOffers: (params = {}) =>
    userClient.get("/food/restaurant/offers", { params }),
  /** Resend delivery notification (restaurant dashboard) */
  resendDeliveryNotification: (orderId) =>
    restaurantClient.post(`/food/restaurant/orders/${String(orderId)}/resend-notification`, {}),
  /** List restaurant complaints (for current restaurant dashboard) */
  getComplaints: (params = {}) =>
    restaurantClient.get("/food/restaurant/complaints", { params }),
  /** Restaurant support tickets */
  createSupportTicket: (body = {}) =>
    restaurantClient.post("/food/restaurant/support/tickets", body ?? {}),
  getSupportTickets: (params = {}) =>
    restaurantClient.get("/food/restaurant/support/tickets", { params }),
  /** DELETE /food/restaurant/account - permanently delete restaurant account */
  deleteAccount: () =>
    restaurantClient.delete("/food/restaurant/account"),
};

function stableStringify(value) {
  if (value === null || value === undefined) return String(value);
  if (typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(",")}}`;
}

function createInFlightCache({ ttlMs }) {
  const inFlight = new Map();
  const cached = new Map(); // key -> { t, v }

  const getCached = (key) => {
    const hit = cached.get(key);
    if (!hit) return null;
    if (Date.now() - hit.t > ttlMs) {
      cached.delete(key);
      return null;
    }
    return hit.v;
  };

  const getOrCreate = (key, factory) => {
    const cachedValue = getCached(key);
    if (cachedValue) return Promise.resolve(cachedValue);
    if (inFlight.has(key)) return inFlight.get(key);
    const p = Promise.resolve()
      .then(factory)
      .then((res) => {
        cached.set(key, { t: Date.now(), v: res });
        return res;
      })
      .finally(() => {
        inFlight.delete(key);
      });
    inFlight.set(key, p);
    return p;
  };

  return { getOrCreate };
}

// Public user-app endpoints can be called by multiple components/effects on refresh (and React StrictMode in dev).
// A small in-flight + short TTL cache collapses duplicate requests without changing functionality.
const publicRestaurantsCache = createInFlightCache({ ttlMs: 3000 });
const publicRestaurantMenuCache = createInFlightCache({ ttlMs: 3000 });
const publicRestaurantOutletTimingsCache = createInFlightCache({ ttlMs: 3000 });
const publicGenericGetCache = createInFlightCache({ ttlMs: 3000 });

export const diningAPI = {
  getCategories: (params = {}) =>
    userClient.get("/food/dining/categories/public", { params }),
  getRestaurants: (params = {}) =>
    userClient.get("/food/dining/restaurants/public", { params }),
  getOccupiedSeatsPublic: (restaurantId) =>
    userClient.get(`/food/dining/restaurants/${String(restaurantId)}/occupied-seats/public`),
  getHeroBanners: () => userClient.get("/food/hero-banners/dining/public"),
  getRestaurantBySlug: (slug) =>
    userClient.get(`/food/restaurant/restaurants/${String(slug)}`),
  getOfferBanners: () => Promise.resolve({ data: { success: true, data: [] } }),
  getStories: () => Promise.resolve({ data: { success: true, data: [] } }),
  getBankOffers: () => Promise.resolve({ data: { success: true, data: [] } }),

  // Real API calls for Bookings
  getBookings: () =>
    userClient.get("/food/dining/bookings/my"),

  getRestaurantBookings: (candidate) => {
    const id = candidate?._id || candidate?.id || candidate;
    return restaurantClient.get(`/food/dining/bookings/restaurant/${String(id)}`);
  },

  updateBookingStatusRestaurant: (bookingId, status) =>
    restaurantClient.patch(`/food/dining/bookings/${String(bookingId)}/status`, { status }),

  createReview: (payload = {}) =>
    userClient.post(`/food/dining/bookings/${String(payload?.bookingId)}/review`, payload),

  createBooking: (payload = {}) =>
    userClient.post("/food/dining/bookings", payload),
};
