import apiClient, { userClient, restaurantClient, deliveryClient, adminClient } from "./axios.js";
import { API_ENDPOINTS } from "./config.js";
import * as authService from "./auth.js";
import { createStubAPI, emptyDataStub, stub } from "./core.js";
import { readSavedCoords } from "../../modules/Food/utils/savedLocation.js";


export const uploadAPI = {
  /**
   * Upload a single image file to the backend (Cloudinary-backed).
   * @param {File|Blob} file
   * @param {{ folder?: string, client?: 'delivery' }} options
   */
  uploadMedia: (file, options = {}) => {
    if (!file) {
      return Promise.reject(new Error("File is required for upload"));
    }

    const formData = new FormData();
    formData.append("file", file);
    if (options.folder) {
      formData.append("folder", options.folder);
    }

    // The rider app is signed in on the delivery client (its own token), not the customer one
    const client = options.client === "delivery" ? deliveryClient : userClient;
    return client.post("/uploads/image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  /**
   * Upload a single non-image file (PDF) to the backend.
   * @param {File|Blob} file
   * @param {{ folder?: string }} options
   */
  uploadFile: (file, options = {}) => {
    if (!file) {
      return Promise.reject(new Error("File is required for upload"));
    }

    const formData = new FormData();
    formData.append("file", file);
    if (options.folder) {
      formData.append("folder", options.folder);
    }

    return userClient.post("/uploads/file", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

export const orderAPI = {
  calculateOrder: (payload) =>
    userClient.post("/food/orders/calculate", payload ?? {}),
  couponEligibility: (payload) =>
    userClient.post("/food/orders/coupon-eligibility", payload ?? {}),
  createOrder: (payload) =>
    userClient.post("/food/orders", payload ?? {}),
  verifyPayment: (body) =>
    userClient.post("/food/orders/verify-payment", body ?? {}),
  getOrders: (params = {}) =>
    userClient
      .get("/food/orders", {
        params: { limit: 20, page: 1, ...params }
      })
      .then((res) => {
        const payload = res?.data?.data;

        // Normalize backend paginated shape:
        // { data: { data: [...], meta: { total, page, limit, totalPages } } }
        // into UI-friendly:
        // { data: { orders: [...], pagination: { total, page, limit, pages } } }
        if (
          payload &&
          typeof payload === "object" &&
          Array.isArray(payload.data) &&
          payload.meta &&
          typeof payload.meta === "object"
        ) {
          const meta = payload.meta;
          return {
            ...res,
            data: {
              ...res.data,
              data: {
                ...payload,
                orders: payload.data,
                pagination: {
                  total: Number(meta.total || 0),
                  page: Number(meta.page || 1),
                  limit: Number(meta.limit || params.limit || 20),
                  pages: Number(meta.totalPages || 1),
                },
              },
            },
          };
        }

        return res;
      }),
  getOrderDetails: (() => {
    const inFlight = new Map();
    const cache = new Map();
    /** Dedupes overlapping calls (StrictMode, poll + socket) without hiding fresh data for long. */
    const CACHE_MS = 800;

    return (orderId, options = {}) => {
      const key = String(orderId ?? "").trim();
      if (!key) {
        return Promise.reject(new Error("orderId required"));
      }

      const force = options.force === true;
      const now = Date.now();
      if (!force) {
        const hit = cache.get(key);
        if (hit && now - hit.at < CACHE_MS) {
          return Promise.resolve(hit.res);
        }
      }

      const pending = inFlight.get(key);
      if (pending) return pending;

      const p = userClient
        .get(`/food/orders/${key}`)
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
  cancelOrder: (orderId, body = {}) =>
    userClient.patch(`/food/orders/${String(orderId)}/cancel`, body ?? {}),
  updateOrderInstructions: (orderId, instructions) =>
    userClient.patch(`/food/orders/${String(orderId)}/instructions`, { instructions }),
  submitOrderRatings: (orderId, body = {}) =>
    userClient.patch(`/food/orders/${String(orderId)}/ratings`, body ?? {}),
  /** Submit a complaint for an order (user). */
  submitComplaint: (payload) =>
    userClient.post(
      "/food/user/support/ticket",
      {
        type: "order",
        orderId: payload.orderId,
        issueType: payload.complaintType,
        description: payload.subject ? `${payload.subject}: ${payload.description}` : payload.description,
      }
    ),
  /**
   * The order methods this customer may use, from the server: the super admin's rules applied to the store that serves
   * the customer's saved location. Throws when the server cannot be reached (nothing is invented).
   */
  getOrderMethods: async () => {
    const point = readSavedCoords();
    const res = await userClient.get("/food/orders/methods", { params: point ? { lat: point.lat, lng: point.lng } : {} });
    const list = res?.data?.data?.methods;
    return Array.isArray(list) ? list : [];
  },
};

// Dining bookings now handled by backend

