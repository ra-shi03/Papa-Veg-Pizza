import apiClient, { userClient, restaurantClient, deliveryClient, adminClient } from "./axios.js";
import { API_ENDPOINTS } from "./config.js";
import * as authService from "./auth.js";
import { createStubAPI, emptyDataStub, stub } from "./core.js";


export const uploadAPI = {
  /**
   * Upload a single image file to the backend (Cloudinary-backed).
   * @param {File|Blob} file
   * @param {{ folder?: string }} options
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

    return userClient.post("/uploads/image", formData, {
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
  getOrderMethods: async () => {
    try {
      const res = await userClient.get("/food/orders/methods");
      const data = res?.data?.data;
      const list = Array.isArray(data?.methods) ? data.methods : (Array.isArray(data) ? data : []);
      if (list.length > 0) return list;
    } catch (_) {}
    try {
      const homeRes = await apiClient.get('/settings/home-page');
      const list = homeRes?.data?.data?.orderMethods;
      if (Array.isArray(list) && list.length > 0) return list;
    } catch (_) {}
    try {
      const stored = localStorage.getItem("pvp_order_methods");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return [
      { id: "delivery", label: "Delivery", enabled: true },
      { id: "dine_in", label: "Dine-In", enabled: true },
      { id: "takeaway", label: "Takeaway", enabled: true },
      { id: "train", label: "Delivery on Train", enabled: true },
      { id: "incar", label: "In-Car", enabled: true }
    ];
  },
};

// Dining bookings now handled by backend

