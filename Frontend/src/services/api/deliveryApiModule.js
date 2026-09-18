import apiClient, { userClient, restaurantClient, deliveryClient, adminClient } from "./axios.js";
import { API_ENDPOINTS } from "./config.js";
import * as authService from "./auth.js";
import { createStubAPI, emptyDataStub, stub } from "./core.js";


export const deliveryAPI = {
  sendOTP: (phone, _purpose = "login") => {
    if (!phone) return Promise.reject(new Error("Phone is required"));
    return authService.requestDeliveryOtp(phone);
  },
  verifyOTP: (phone, otp, _purpose, _name, fcmToken = null, platform = "web") => {
    if (!phone || !otp)
      return Promise.reject(new Error("Phone and OTP are required"));
    return authService.verifyDeliveryOtp(phone, otp, fcmToken, platform);
  },
  getMe: () => getDeliveryMeOnce(),
  /** Get delivery profile (same as getMe under the hood; maps response to profile shape). */
  getProfile: () =>
    getDeliveryMeOnce().then((res) => ({
      ...res,
      data: {
        ...res.data,
        data: { profile: res.data?.data?.user ?? res.data?.data },
      },
    })),
  getReferralStats: () =>
    deliveryClient.get("/food/delivery/referrals/stats"),
  logout: (refreshToken) => {
    deliveryMeCached = null;
    deliveryMeCacheTime = 0;
    try {
      localStorage.removeItem("app:isOnline");
    } catch (_) { }
    const token =
      refreshToken ||
      (typeof localStorage !== "undefined"
        ? localStorage.getItem("delivery_refreshToken")
        : null);
    const fcmToken = typeof localStorage !== "undefined" ? localStorage.getItem("fcm_web_registered_token_delivery") : null;
    return authService.logout(token, fcmToken, "web");
  },
  /** POST /food/delivery/register - multipart FormData (new partner, no token). */
  register: (formData) => {
    if (!formData || !(formData instanceof FormData)) {
      return Promise.reject(
        new Error("FormData with details and document files is required"),
      );
    }
    return deliveryClient.post("/food/delivery/register", formData);
  },
  /** PATCH /food/delivery/profile - complete profile after OTP (Bearer token required). */
  completeProfile: (formData) => {
    if (!formData || !(formData instanceof FormData)) {
      return Promise.reject(
        new Error("FormData with details and document files is required"),
      );
    }
    return deliveryClient.patch("/food/delivery/profile", formData);
  },
  /** PATCH /food/delivery/profile/details - JSON updates (vehicle number, etc). */
  updateProfileDetails: (payload) =>
    deliveryClient.patch("/food/delivery/profile/details", payload ?? {}),
  /** PATCH /food/delivery/profile - multipart updates for photos/documents (uses same endpoint). */
  updateProfileMultipart: (formData) => {
    if (!formData || !(formData instanceof FormData)) {
      return Promise.reject(new Error("FormData is required"));
    }
    return deliveryClient.patch("/food/delivery/profile", formData);
  },
  /** POST /food/delivery/profile/photo-base64 - Flutter in-app camera base64 upload. */
  updateProfilePhotoBase64: (payload) =>
    deliveryClient.post("/food/delivery/profile/photo-base64", payload ?? {}),
  /** PATCH /food/delivery/profile/bank-details - update bank details + PAN (JSON, Bearer required). */
  updateProfile: (payload) =>
    deliveryClient.patch("/food/delivery/profile/bank-details", payload ?? {}),
  /** PATCH /food/delivery/profile/bank-details - multipart updates for bank details + UPI QR (FormData required). */
  updateBankDetailsMultipart: (formData) => {
    if (!formData || !(formData instanceof FormData)) {
      return Promise.reject(new Error("FormData is required"));
    }
    return deliveryClient.patch("/food/delivery/profile/bank-details", formData);
  },
  saveFcmToken: (token, platform = "web") => {
    if (!token) return Promise.reject(new Error("FCM token is required"));
    const path =
      platform === "mobile" ? "/fcm-tokens/mobile/save" : "/fcm-tokens/save";
    return deliveryClient.post(
      path,
      { token: String(token), platform }
    );
  },
  removeFcmToken: (token, platform = "web") => {
    if (!token) return Promise.reject(new Error("FCM token is required"));
    return deliveryClient.delete(
      `/fcm-tokens/remove/${encodeURIComponent(String(token))}`,
      {
        data: { token: String(token), platform }
      }
    );
  },
  /** GET /food/delivery/support-tickets - list tickets for logged-in delivery partner. */
  getSupportTickets: () =>
    deliveryClient.get("/food/delivery/support-tickets"),
  /** POST /food/delivery/support-tickets - create ticket (body: subject, description, category?, priority?). */
  createSupportTicket: (body) =>
    deliveryClient.post("/food/delivery/support-tickets", body ?? {}),
  /** GET /food/delivery/support-tickets/:id - get one ticket (own only). */
  getSupportTicketById: (id) =>
    deliveryClient.get(`/food/delivery/support-tickets/${id}`),
  /** PATCH /food/delivery/availability - set online/offline (and optional lat/lng). */
  updateOnlineStatus: (isOnline) =>
    deliveryClient.patch(
      "/food/delivery/availability",
      { status: isOnline ? "online" : "offline" }
    ),
  updateLocation: (latitude, longitude, isOnline, extras = {}) =>
    deliveryClient.patch(
      "/food/delivery/availability",
      { status: isOnline ? "online" : "offline", latitude, longitude, ...extras }
    ),
  /** Orders */
  getOrders: (() => {
    // Collapse duplicate list fetches triggered by multiple effects + StrictMode.
    let inFlight = new Map(); // key -> Promise
    let cache = new Map(); // key -> { at, res }
    const CACHE_MS = 2500;

    const stableKey = (p = {}) => {
      const safe = p && typeof p === "object" ? { ...p } : {};
      // Ensure stable ordering + defaults.
      const normalized = { limit: 50, page: 1, ...safe };
      // Remove cache-busters if any.
      delete normalized._ts;
      return JSON.stringify(
        Object.keys(normalized)
          .sort()
          .reduce((acc, k) => {
            acc[k] = normalized[k];
            return acc;
          }, {}),
      );
    };

    return (params = {}) => {
      const key = stableKey(params);
      const now = Date.now();
      const cached = cache.get(key);
      if (cached && now - cached.at < CACHE_MS)
        return Promise.resolve(cached.res);

      const existing = inFlight.get(key);
      if (existing) return existing;

      const p = deliveryClient
        .get("/food/delivery/orders/available", {
          params: { limit: 50, page: 1, ...params }
        })
        .then((res) => {
          cache.set(key, { at: Date.now(), res });
          return res;
        })
        .finally(() => {
          inFlight.delete(key);
        });

      inFlight.set(key, p);
      return p;
    };
  })(),
  getOrderDetails: (() => {
    // Collapse duplicate calls coming from multiple effects (and React StrictMode in dev).
    let inFlight = new Map(); // key -> Promise
    let cache = new Map(); // key -> { at, res }
    const CACHE_MS = 1200;

    const isProbablyOrderIdentity = (value) => {
      const raw = String(value || "").trim();
      if (!raw) return false;
      // Mongo ObjectId
      return /^[a-f0-9]{24}$/i.test(raw);
    };

    return (orderId) => {
      const key = String(orderId || "").trim();
      if (!isProbablyOrderIdentity(key)) {
        return Promise.resolve({
          data: { success: false, message: "Invalid order id", data: null },
          status: 200,
          statusText: "OK",
          headers: {},
          config: {},
        });
      }

      const now = Date.now();
      const cached = cache.get(key);
      if (cached && now - cached.at < CACHE_MS)
        return Promise.resolve(cached.res);

      const existing = inFlight.get(key);
      if (existing) return existing;

      const p = deliveryClient
        .get(`/food/delivery/orders/${key}`)
        .then((res) => {
          cache.set(key, { at: Date.now(), res });
          return res;
        })
        .finally(() => {
          inFlight.delete(key);
        });

      inFlight.set(key, p);
      return p;
    };
  })(),
  /** GET /food/delivery/current - fallback for some UI hooks */
  getCurrentDelivery: () => deliveryClient.get("/food/delivery/orders/current"),
  acceptOrder: (orderId, body = {}) =>
    deliveryClient.patch(
      `/food/delivery/orders/${String(orderId)}/accept`,
      body ?? {}
    ),
  rejectOrder: (orderId, body = {}) =>
    deliveryClient.patch(
      `/food/delivery/orders/${String(orderId)}/reject`,
      body ?? {}
    ),
  /**
   * PATCH /food/delivery/orders/:orderId/reached-pickup
   * Marks "reached pickup" (arrival at restaurant) in backend order deliveryState.
   */
  confirmReachedPickup: (orderId) =>
    deliveryClient.patch(
      `/food/delivery/orders/${String(orderId)}/reached-pickup`,
      {}
    ),
  /**
   * Confirm order ID and upload bill image (Picked Up slide).
   * Backend endpoint: PATCH /food/delivery/orders/:id/confirm-pickup
   */
  confirmOrderId: (orderId, confirmedOrderId, location = {}, data = {}) =>
    deliveryClient.patch(
      `/food/delivery/orders/${String(orderId)}/confirm-pickup`,
      {
        confirmedOrderId,
        latitude: location.lat,
        longitude: location.lng,
        billImageUrl: data.billImageUrl,
      }
    ),
  confirmReachedDrop: (orderId) =>
    deliveryClient.patch(
      `/food/delivery/orders/${String(orderId)}/reached-drop`,
      {}
    ),
  verifyDropOtp: (orderId, otp) =>
    deliveryClient.post(
      `/food/delivery/orders/${String(orderId)}/verify-drop-otp`,
      { otp: String(otp) }
    ),
  /** POST /food/delivery/orders/:orderId/collect/qr - create Razorpay payment link (COD collection) */
  createCollectQr: (orderId, body = {}) =>
    deliveryClient.post(
      `/food/delivery/orders/${String(orderId)}/collect/qr`,
      body ?? {}
    ),
  /** GET /food/delivery/orders/:orderId/payment-status - check COD/QR payment status */
  getPaymentStatus: (orderId) =>
    deliveryClient.get(`/food/delivery/orders/${String(orderId)}/payment-status`),
  completeDelivery: (orderId, body = {}) => {
    // Backward-compatible: older UI calls completeDelivery(orderId, rating, review)
    // where rating is a number (sent as raw JSON like "3"). Normalize to an object.
    let payload = body ?? {};
    if (
      typeof payload === "number" ||
      typeof payload === "string" ||
      payload == null
    ) {
      payload = { rating: payload == null ? null : Number(payload) };
    }
    return deliveryClient.patch(
      `/food/delivery/orders/${String(orderId)}/complete`,
      payload
    );
  },
  updateOrderStatus: (orderId, body = {}) =>
    deliveryClient.patch(
      `/food/delivery/orders/${String(orderId)}/status`,
      body ?? {}
    ),
  /** Registration Re-verification */
  reverify: () =>
    deliveryClient.post("/food/delivery/reverify", {}),
  /** GET /food/delivery/wallet - wallet for Pocket/requests page (backend) */
  getWallet: () =>
    deliveryClient.get("/food/delivery/wallet"),
  /** GET /food/delivery/earnings - earnings summary for Pocket/requests page */
  getEarnings: (params) =>
    deliveryClient.get("/food/delivery/earnings", {
      params: params ?? {}
    }),
  /** Earning Addons (Hotspots/Bonus) */
  getActiveEarningAddons: () =>
    deliveryClient.get("/food/delivery/earning-addons/active"),
  /** GET /food/delivery/trip-history - completed/cancelled/pending trips for delivery partner */
  getTripHistory: (params) =>
    deliveryClient.get("/food/delivery/trip-history", {
      params: params ?? {}
    }),
  /** GET /food/delivery/pocket-details - single-call week details (trips + transactions) */
  getPocketDetails: (params) =>
    deliveryClient.get("/food/delivery/pocket-details", {
      params: params ?? {}
    }),
  /** GET /food/delivery/emergency-help - admin-set emergency numbers for delivery partner */
  getEmergencyHelp: () =>
    deliveryClient.get("/food/delivery/emergency-help"),
  /** GET /food/delivery/cash-limit - admin-set cash limit for delivery partner */
  getCashLimit: () =>
    deliveryClient.get("/food/delivery/cash-limit"),
  createWithdrawalRequest: (body) =>
    deliveryClient.post("/food/delivery/wallet/withdraw", body ?? {}),
  createDepositOrder: (amount) =>
    deliveryClient.post("/food/delivery/wallet/deposit/order", { amount }),
  verifyDepositPayment: (body) =>
    deliveryClient.post("/food/delivery/wallet/deposit/verify", body ?? {}),
  /** Wallet transactions - from wallet response (no separate backend endpoint) */
  getWalletTransactions: (params) =>
    deliveryClient
      .get("/food/delivery/wallet", {
        params: params ?? {}
      })
      .then((res) => ({
        ...res,
        data: {
          ...res.data,
          data: {
            transactions: res?.data?.data?.wallet?.transactions ?? [],
          },
        },
      })),
  /** Zone discovery */
  getZonesInRadius: (lat, lng, radiusKm = 10) =>
    deliveryClient.get("/food/zones/nearby", {
      params: { lat, lng, radius: radiusKm }
    }),
  /** DELETE /food/delivery/account - permanently delete delivery partner account */
  deleteAccount: () =>
    deliveryClient.delete("/food/delivery/account"),
};
