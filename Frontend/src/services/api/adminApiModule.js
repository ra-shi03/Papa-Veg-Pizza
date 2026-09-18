import apiClient, { userClient, restaurantClient, deliveryClient, adminClient } from "./axios.js";
import { API_ENDPOINTS } from "./config.js";
import * as authService from "./auth.js";
import { createStubAPI, emptyDataStub, stub } from "./core.js";


export const adminAPI = {
  getFranchises: (params = {}) => adminClient.get("/food/admin/franchises", { params }),
  getFranchiseById: (id) => adminClient.get(`/food/admin/franchises/${id}`),
  // Franchise Admin self-service: get the franchise linked to the logged-in user
  getMyFranchise: () => adminClient.get("/food/admin/franchises/my-franchise"),
  // Franchise Admin self-service: update editable fields (city, state, pincode, address)
  updateMyFranchise: (body) => adminClient.patch("/food/admin/franchises/my-franchise", body),
  getSidebarBadges: () =>
    adminClient.get("/food/admin/sidebar-badges"),
  getStores: (params = {}) => adminClient.get("/stores", { params }),
  getStoreById: (id) => adminClient.get(`/stores/${id}`),
  getStoresKPIs: () => adminClient.get("/stores/dashboard-kpis"),
  createStore: (body) => adminClient.post("/stores", body),
  updateStore: (id, body) => adminClient.patch(`/stores/${id}`, body),
  updateStoreStatus: (id, status, reason) => adminClient.patch(`/stores/${id}/status`, { status, reason }),
  updateStoreHours: (id, hours) => adminClient.patch(`/stores/${id}/hours`, { hours }),
  getStoreHours: (id) => adminClient.get(`/stores/${id}/hours`),
  getStorePerformance: (id) => adminClient.get(`/stores/${id}/performance`),
  deleteStore: (id) => adminClient.delete(`/stores/${id}`),
  getStoreOrders: (storeId) => adminClient.get("/orders", { params: { storeId } }),
  getStoreInventory: (storeId) => adminClient.get("/inventory", { params: { storeId } }),
  getStoreStaff: (storeId) => adminClient.get("/users", { params: { storeId } }),
  getStoreReviews: (storeId) => adminClient.get("/reviews", { params: { storeId } }),
  getStoreManagers: (params = {}) => adminClient.get("/store-managers", { params }),
  getStoreManagerById: (id) => adminClient.get(`/store-managers/${id}`),
  createStoreManager: (body) => {
    const formData = new FormData();
    Object.keys(body).forEach((key) => {
      if (key === 'profileImageFile' && body[key]) {
        formData.append('profileImageFile', body[key]);
      } else if (key === 'personalDetails' || key === 'permissions') {
        formData.append(key, JSON.stringify(body[key]));
      } else if (key !== 'profileImageFile') {
        formData.append(key, body[key]);
      }
    });
    return adminClient.post("/store-managers", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  updateStoreManager: (id, body) => {
    if (body.profileImageFile) {
      const formData = new FormData();
      Object.keys(body).forEach((key) => {
        if (key === 'profileImageFile') {
          formData.append('profileImageFile', body[key]);
        } else if (key === 'personalDetails' || key === 'permissions') {
          formData.append(key, JSON.stringify(body[key]));
        } else {
          formData.append(key, body[key]);
        }
      });
      return adminClient.patch(`/store-managers/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    return adminClient.patch(`/store-managers/${id}`, body);
  },
  deleteStoreManager: (id) => adminClient.delete(`/store-managers/${id}`),
  getStoreApprovalsDashboard: () => adminClient.get("/store-approvals/dashboard"),
  getStoreApprovals: (params = {}) => adminClient.get("/store-approvals", { params }),
  uploadStoreApprovalDocuments: (id, formData) => adminClient.post(`/store-approvals/${id}/documents`, formData, { headers: { "Content-Type": "multipart/form-data" } }),
  submitStoreApproval: (id) => adminClient.post(`/store-approvals/${id}/submit`),
  approveStoreApproval: (id, payload) => adminClient.patch(`/store-approvals/${id}/approve`, payload),
  rejectStoreApproval: (id, payload) => adminClient.patch(`/store-approvals/${id}/reject`, payload),
  requestChangesStoreApproval: (id, body) => adminClient.patch(`/store-approvals/${id}/request-changes`, body),
  toggleVerifyDocument: (id, docId) => adminClient.patch(`/store-approvals/${id}/documents/${docId}/verify`),
  getStoreApprovalAudit: (id) => adminClient.get(`/store-approvals/${id}/audit`),
  getStoreApprovalDocumentsZip: (id) => adminClient.get(`/store-approvals/${id}/documents`),
  getSingleStore: (id) => adminClient.get(`/stores/${id}`),
  getSingleUser: (id) => adminClient.get(`/users/${id}`),
  getStorePricing: (params = {}) => adminClient.get("/store-pricing", { params }),
  getStorePricingById: (id) => adminClient.get(`/store-pricing/${id}`),
  updateStorePricing: (id, body) => adminClient.put(`/store-pricing/${id}`, body),
  bulkPriceUpdate: (body) => adminClient.post("/bulk-price-update", body),
  copyPricing: (body) => adminClient.post("/copy-pricing", body),
  getPriceHistory: (productId, params = {}) => adminClient.get(`/price-history/${productId}`, { params }),
  applyBulkPricingAction: (pricingIds, action, payload = {}) => adminClient.put("/store-pricing/bulk-action", { pricingIds, action, payload }),
  getDashboardSummary: () => adminClient.get("/admin/dashboard"),
  getDashboardRevenue: () => adminClient.get("/admin/dashboard/revenue"),
  getDashboardLiveOrders: () => adminClient.get("/admin/dashboard/live-orders"),
  getDashboardStorePerformance: () => adminClient.get("/admin/dashboard/store-performance"),
  getDashboardInventoryAlerts: () => adminClient.get("/admin/dashboard/inventory-alerts"),
  getDashboardDeliveryPerformance: () => adminClient.get("/admin/dashboard/delivery-performance"),
  getDashboardCustomerActivity: () => adminClient.get("/admin/dashboard/customer-activity"),
  globalSearch: (q) => adminClient.get("/search", { params: { q } }),
  login: (email, password) => authService.adminLogin(email, password),
  superAdminLogin: (email, password) => authService.superAdminLogin(email, password),
  franchiseLogin: (email, password) => authService.franchiseLogin(email, password),
  storeLogin: (email, password) => authService.storeLogin(email, password),

  // Store Performance Endpoints
  getStorePerformanceDashboard: () => adminClient.get("/store-performance/dashboard"),
  getStorePerformanceRevenue: () => adminClient.get("/store-performance/revenue"),
  getStorePerformanceOrders: () => adminClient.get("/store-performance/orders"),
  getStorePerformanceRatings: () => adminClient.get("/store-performance/ratings"),
  getStorePerformanceComparison: () => adminClient.get("/store-performance/comparison"),
  getStorePerformanceBusyHours: () => adminClient.get("/store-performance/busy-hours"),
  getStorePerformanceList: (params = {}) => adminClient.get("/store-performance", { params }),
  getStorePerformanceCompare: (params = {}) => adminClient.get("/store-performance/compare", { params }),
  exportStorePerformanceReport: (params = {}) => adminClient.get("/store-performance/export", { params }),
  getStoreSpecificRevenue: (storeId) => adminClient.get(`/store-performance/${storeId}/revenue`),
  getStoreSpecificOrders: (storeId) => adminClient.get(`/store-performance/${storeId}/orders`),
  getStoreSpecificRatings: (storeId) => adminClient.get(`/store-performance/${storeId}/ratings`),
  getStoreSpecificInventory: (storeId) => adminClient.get(`/store-performance/${storeId}/inventory`),
  getStoreSpecificProducts: (storeId) => adminClient.get(`/store-performance/${storeId}/products`),
  getStoreSpecificStaff: (storeId) => adminClient.get(`/store-performance/${storeId}/staff`),

  // Operating Hours Endpoints
  getOperatingHoursDashboard: () => adminClient.get("/operating-hours/dashboard"),
  getOperatingHours: (params = {}) => adminClient.get("/operating-hours", { params }),
  getStoreOperatingHours: (storeId) => adminClient.get(`/operating-hours/${storeId}`),
  updateStoreOperatingHours: (storeId, data) => adminClient.patch(`/operating-hours/${storeId}`, data),
  updateStoreTemporaryClosure: (storeId, data) => adminClient.patch(`/stores/${storeId}/status`, data),
  updateStoreHolidays: (storeId, data) => adminClient.patch(`/operating-hours/${storeId}/holidays`, data),
  copyStoreOperatingHours: (data) => adminClient.post("/operating-hours/copy", data),
  bulkUpdateStoreOperatingHours: (data) => adminClient.patch("/operating-hours/bulk-update", data),
  exportOperatingHoursReport: (params = {}) => adminClient.get("/operating-hours/export", { params }),

  /** POST /auth/admin/forgot-password/request-otp – only accepts registered admin email */
  requestForgotPasswordOtp: (email) =>
    adminClient.post("/auth/admin/forgot-password/request-otp", {
      email: String(email || "")
        .trim()
        .toLowerCase(),
    }),
  /** POST /auth/admin/forgot-password/reset – verify OTP and set new password in one call */
  resetPasswordWithOtp: (email, otp, newPassword) =>
    adminClient.post("/auth/admin/forgot-password/reset", {
      email: String(email || "")
        .trim()
        .toLowerCase(),
      otp: String(otp || "").replace(/\D/g, ""),
      newPassword: String(newPassword || ""),
    }),
  /** Raw /auth/me for admin (e.g. navbar). For Profile & Settings use getAdminProfile. */
  getCurrentAdmin: () => authService.getMe("admin"),
  /** Single API for admin profile: GET /auth/me, returns { data: { admin } }. Use on Profile & Settings only. */
  getAdminProfile: () =>
    authService.getMe("admin").then((res) => {
      const user =
        res?.data?.data?.user ??
        res?.data?.user ??
        res?.data?.data ??
        res?.data;
      return { data: { data: { admin: user }, admin: user } };
    }),
  /** PATCH /auth/admin/profile. Body: name?, phone?, profileImage? */
  updateAdminProfile: (body) =>
    adminClient.patch("/auth/admin/profile", body ?? {}),
  /** PATCH /auth/admin/change-password */
  changeAdminPassword: (body) =>
    adminClient.patch("/auth/admin/change-password", body),
  changePassword: (currentPassword, newPassword) =>
    adminClient.patch(
      "/auth/admin/change-password",
      { currentPassword, newPassword }
    ),
  logout: (refreshToken) => {
    const token =
      refreshToken ||
      (typeof localStorage !== "undefined"
        ? localStorage.getItem("admin_refreshToken")
        : null);
    const fcmToken = typeof localStorage !== "undefined" ? localStorage.getItem("fcm_web_registered_token_admin") : null;
    return authService.logout(token, fcmToken, "web");
  },
  // Restaurant approvals and join requests
  getPendingRestaurants: () =>
    adminClient.get("/food/admin/restaurants/pending"),
  /** List restaurant complaints (admin). */
  getRestaurantComplaints: (params = {}) =>
    adminClient.get("/food/admin/restaurants/complaints", { params }),
  getRestaurantMenuPdfUrl: (id) =>
    adminClient.get(`/food/admin/restaurants/${String(id)}/menu-pdf`),
  downloadRestaurantMenuPdf: (id) =>
    adminClient.get(`/food/admin/restaurants/${String(id)}/download-menu-pdf`, {
      responseType: "blob",
    }),
  updateRestaurantComplaint: (id, body) =>
    adminClient.patch(`/food/admin/restaurants/complaints/${id}`, body),
  /** Global universal search (admin). */
  globalSearch: (query) =>
    adminClient.get("/food/admin/global-search", { params: { query } }),
  approveRestaurant: (id) =>
    adminClient.patch(`/food/admin/restaurants/${id}/approve`, {}),
  rejectRestaurant: (id, reason) =>
    adminClient.patch(`/food/admin/restaurants/${id}/reject`, { reason }),
  /** Delivery partner join requests - uses /food/admin/delivery/* (new backend API) */
  getDeliveryPartnerJoinRequests: (params) =>
    adminClient.get("/food/admin/delivery/join-requests", { params }),
  /** List approved delivery partners (Deliveryman List page) */
  getDeliveryPartners: (params) =>
    adminClient.get("/food/admin/delivery/partners", { params }),
  getDeliverymanReviews: (params = {}) =>
    adminClient.get("/food/admin/delivery/reviews", { params }),
  getContactMessages: (params = {}) =>
    adminClient.get("/food/admin/contact-messages", { params }),
  /** Dashboard summary stats (admin home) */
  getDashboardStats: (params = {}) =>
    adminClient.get("/food/admin/dashboard-stats", { params }),
  /** List restaurant withdrawal requests (admin). */
  getWithdrawals: (params = {}) =>
    adminClient.get("/food/admin/withdrawals", { params }),
  /** Update status of a withdrawal request. */
  updateWithdrawalStatus: (id, body) =>
    adminClient.patch(`/food/admin/withdrawals/${id}`, body),
  /** List delivery withdrawal requests (admin). */
  getDeliveryWithdrawals: (params = {}) =>
    adminClient.get("/food/admin/delivery/withdrawals", { params }),
  /** Update status of a delivery withdrawal request. */
  updateDeliveryWithdrawalStatus: (id, body) =>
    adminClient.patch(`/food/admin/delivery/withdrawals/${id}`, body),
  /** Delivery withdrawal aliases */
  getDeliveryWithdrawalRequests: (params) => adminAPI.getDeliveryWithdrawals(params),
  approveDeliveryWithdrawal: (id) => adminAPI.updateDeliveryWithdrawalStatus(id, { status: "approved" }),
  rejectDeliveryWithdrawal: (id, reason) => adminAPI.updateDeliveryWithdrawalStatus(id, { status: "rejected", rejectionReason: reason }),
  // Aliases for RestaurantWithdraws page
  getWithdrawalRequests: (params) => adminAPI.getWithdrawals(params),
  approveWithdrawalRequest: (id) => adminAPI.updateWithdrawalStatus(id, { status: "approved" }),
  rejectWithdrawalRequest: (id, reason) => adminAPI.updateWithdrawalStatus(id, { status: "rejected", rejectionReason: reason }),
  /** Delivery boy wallets (stub until backend implements - returns empty so list still loads) */
  getDeliveryBoyWallets: (params) =>
    adminClient.get("/food/admin/delivery/wallets", { params }),
  getDeliveryPartnerById: (id) =>
    adminClient.get(`/food/admin/delivery/${id}`),
  updateDeliveryPartner: (id, body) =>
    adminClient.patch(`/food/admin/delivery/${id}`, body),
  approveDeliveryPartner: (id) =>
    adminClient.patch(`/food/admin/delivery/${String(id)}/approve`, {}),
  rejectDeliveryPartner: (id, reason) =>
    adminClient.patch(`/food/admin/delivery/${String(id)}/reject`, { reason: String(reason || "").trim() }),
  /** GET /food/admin/delivery/support-tickets - list all delivery support tickets (query: status, priority, search, page, limit). */
  getDeliverySupportTickets: (params) =>
    adminClient.get("/food/admin/delivery/support-tickets", { params }),
  getExpiredFssaiNotifications: (params = {}) =>
    adminClient.get("/food/admin/notifications/fssai-expired", {
      params,
    }),
  /** GET /food/admin/delivery/support-tickets/stats - counts by status. */
  getDeliverySupportTicketStats: () =>
    adminClient.get("/food/admin/delivery/support-tickets/stats"),
  /** PATCH /food/admin/delivery/support-tickets/:id - update adminResponse, status. */
  updateDeliverySupportTicket: (id, body) =>
    adminClient.patch(`/food/admin/delivery/support-tickets/${id}`, body ?? {}),
  createBroadcastNotification: (body = {}) =>
    adminClient.post("/food/admin/notifications/broadcast", body ?? {}),
  getBroadcastNotifications: (params = {}) =>
    adminClient.get("/food/admin/notifications/broadcast", { params }),
  deleteBroadcastNotification: (id) =>
    adminClient.delete(`/food/admin/notifications/broadcast/${String(id)}`),
  /** List restaurants for admin. Requires admin auth. */
  getRestaurants: (params = {}, config = {}) =>
    adminClient.get("/food/admin/restaurants", {
      params: { limit: 1000, ...params },
      ...config,
    }),
  getRestaurantReviews: (params = {}) =>
    adminClient.get("/food/admin/restaurants/reviews", {
      params: { page: 1, limit: 1000, ...params }
    }),
  /** Categories (admin) */
  getCategories: (params = {}) =>
    adminClient.get("/food/admin/categories", { params }),
  /** Dining categories (admin) */
  getDiningCategories: (params = {}) =>
    adminClient.get("/food/admin/dining/categories", { params }),
  createDiningCategory: (body) =>
    adminClient.post("/food/admin/dining/categories", body ?? {}),
  updateDiningCategory: (id, body) =>
    adminClient.patch(`/food/admin/dining/categories/${String(id)}`, body ?? {}),
  deleteDiningCategory: (id) =>
    adminClient.delete(`/food/admin/dining/categories/${String(id)}`),
  getDiningRestaurants: (params = {}) =>
    adminClient.get("/food/admin/dining/restaurants", { params }),
  updateRestaurantDiningSettings: (restaurantId, body) =>
    adminClient.patch(`/food/admin/dining/restaurants/${String(restaurantId)}`, body ?? {}),
  getDiningRequests: (params = {}) =>
    adminClient.get("/food/admin/dining/requests", { params }),
  approveDiningRequest: (id) =>
    adminClient.patch(`/food/admin/dining/requests/${String(id)}/approve`, {}),
  rejectDiningRequest: (id, reason) =>
    adminClient.patch(`/food/admin/dining/requests/${String(id)}/reject`, { reason }),
  createCategory: (body) =>
    adminClient.post("/food/admin/categories", body ?? {}),
  updateCategory: (id, body) =>
    adminClient.patch(`/food/admin/categories/${id}`, body ?? {}),
  deleteCategory: (id) =>
    adminClient.delete(`/food/admin/categories/${id}`),
  approveCategory: (id) =>
    adminClient.patch(`/food/admin/categories/${String(id)}/approve`, {}),
  rejectCategory: (id, reason) =>
    adminClient.patch(`/food/admin/categories/${String(id)}/reject`, { reason: String(reason || "").trim() }),
  makeCategoryGlobal: (id) =>
    adminClient.patch(`/food/admin/categories/${String(id)}/make-global`, {}),
  toggleCategoryStatus: (id) =>
    adminClient.patch(`/food/admin/categories/${id}/toggle`, {}),
  /** Get single restaurant by id (full details for View Details modal). */
  getRestaurantById: (id) =>
    adminClient.get(`/food/admin/restaurants/${id}`),
  /** Get restaurant analytics for POS. */
  getRestaurantAnalytics: (id) =>
    adminClient.get(`/food/admin/restaurants/${id}/analytics`),
  /** Update restaurant basic details (admin). */
  updateRestaurant: (id, body) =>
    adminClient.patch(`/food/admin/restaurants/${String(id)}`, body ?? {}),
  deleteRestaurant: (id) =>
    adminClient.delete(`/food/admin/restaurants/${id}`),
  /** Update restaurant status (admin). Body: { status: boolean } */
  updateRestaurantStatus: (id, status) =>
    adminClient.patch(`/food/admin/restaurants/${String(id)}/status`, { status: status !== false }),
  /** Update restaurant location (admin). Body includes lat/lng + address fields. */
  updateRestaurantLocation: (id, body) =>
    adminClient.patch(`/food/admin/restaurants/${String(id)}/location`, body ?? {}),
  /** Restaurant menu (admin) */
  getRestaurantMenuById: (id, config = {}) =>
    adminClient.get(`/food/admin/restaurants/${id}/menu`, config),
  updateRestaurantMenuById: (id, body) =>
    adminClient.patch(`/food/admin/restaurants/${id}/menu`, body ?? {}),
  /** Foods (admin) - separate collection */
  getFoods: (params = {}) =>
    adminClient.get("/food/admin/foods", { params }),
  createFood: (body) =>
    adminClient.post("/food/admin/foods", body ?? {}),
  updateFood: (id, body) =>
    adminClient.patch(`/food/admin/foods/${id}`, body ?? {}),
  deleteFood: (id) =>
    adminClient.delete(`/food/admin/foods/${id}`),
  /** Food approvals (admin) - pending items created by restaurants */
  getPendingFoodApprovals: (params = {}) =>
    adminClient.get("/food/admin/foods/pending-approvals", { params }),
  approveFoodItem: (id) =>
    adminClient.patch(`/food/admin/foods/${String(id)}/approve`, {}),
  rejectFoodItem: (id, reason) =>
    adminClient.patch(`/food/admin/foods/${String(id)}/reject`, { reason: String(reason || "").trim() }),
  /** Bulk approve multiple food items */
  bulkApproveFood: (ids) =>
    adminClient.patch("/food/admin/foods/bulk-approve", { ids }),
  /** Customers (admin) */
  getCustomers: (params = {}) =>
    adminClient.get("/food/admin/customers", { params }),
  getCustomerById: (id) =>
    adminClient.get(`/food/admin/customers/${String(id)}`),
  updateCustomerStatus: (id, isActive) =>
    adminClient.patch(`/food/admin/customers/${String(id)}/status`, { isActive: isActive !== false }),
  /** Orders (admin) – list, get by id, assign delivery partner */
  getOrders: (params = {}) =>
    adminClient.get("/food/admin/orders", { params: { limit: 50, page: 1, ...params } }),
  getOrderById: (orderId) =>
    adminClient.get(`/food/admin/orders/${String(orderId)}`),
  deleteOrder: (orderId) =>
    adminClient.delete(`/food/admin/orders/${String(orderId)}`),
  /** Dispatch settings – auto vs manual assign (global) */
  /** Create restaurant (admin). Single API: POST /food/admin/restaurants. Body: JSON with image URLs. */
  createRestaurant: (body) =>
    adminClient.post("/food/admin/restaurants", body ?? {}),
  /** List delivery zones. Query: limit, page, isActive, search */
  getZones: (params = {}) =>
    adminClient.get("/food/admin/zones", { params: { limit: 1000, ...params } }),
  /** Restaurant report (admin). */
  getRestaurantReport: (params = {}) =>
    adminClient.get("/food/admin/reports/restaurants", { params: { page: 1, limit: 1000, ...params } }),
  getTransactionReport: (params = {}) =>
    adminClient.get("/food/admin/reports/transactions", { params: { page: 1, limit: 1000, ...params } }),
  getTaxReport: (params = {}) =>
    adminClient.get("/food/admin/reports/tax", { params: { page: 1, limit: 1000, ...params } }),
  getTaxReportDetail: (id, params = {}) =>
    adminClient.get(`/food/admin/reports/tax/${id}`, { params }),
  /** Get single zone by id */
  getZoneById: (id) =>
    adminClient.get(`/food/admin/zones/${id}`),
  /** Create zone. Body: name, zoneName?, country?, unit?, coordinates, isActive? */
  createZone: (body) =>
    adminClient.post("/food/admin/zones", body ?? {}),
  /** Update zone. Body: name?, zoneName?, country?, unit?, coordinates?, isActive? */
  updateZone: (id, body) =>
    adminClient.patch(`/food/admin/zones/${id}`, body ?? {}),
  /** Delete zone */
  deleteZone: (id) =>
    adminClient.delete(`/food/admin/zones/${id}`),

  /** Business Settings */
  getBusinessSettings: () =>
    adminClient.get("/food/admin/business-settings"),
  getPublicBusinessSettings: () =>
    userClient.get("/food/admin/business-settings/public"),
  updateBusinessSettings: (data, files = {}) => {
    const formData = new FormData();
    formData.append("data", JSON.stringify(data));
    if (files.logo) formData.append("logo", files.logo);
    if (files.favicon) formData.append("favicon", files.favicon);

    return adminClient.patch("/food/admin/business-settings", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  /** Feedback Experience (admin) */
  getFeedbackExperiences: (params = {}) =>
    adminClient.get(API_ENDPOINTS.ADMIN.FEEDBACK_EXPERIENCE, { params }),
  deleteFeedbackExperience: (id) =>
    adminClient.delete(`${API_ENDPOINTS.ADMIN.FEEDBACK_EXPERIENCE}/${id}`),

  /** Public env variables (safe subset). Used for runtime keys like Google Maps. */
  // getPublicEnvVariables removed: rely on import.meta.env instead.

  /** Public categories (user app) - zone-aware */
  getPublicCategories: (params = {}, config = {}) =>
    userClient.get("/food/restaurant/categories/public", {
      params: params ?? {},
      ...config,
    }),

  /** Offers & Coupons (admin) */
  getAllOffers: (params = {}) =>
    adminClient.get("/food/admin/offers", { params }),
  createAdminOffer: (body) =>
    adminClient.post("/food/admin/offers", body ?? {}),
  updateAdminOfferCartVisibility: (offerId, itemId, showInCart) =>
    adminClient.patch(`/food/admin/offers/${String(offerId)}/cart-visibility`, { itemId: String(itemId), showInCart: Boolean(showInCart) }),
  deleteAdminOffer: (offerId) =>
    adminClient.delete(`/food/admin/offers/${String(offerId)}`),

  /** Delivery Partner Bonus (admin) */
  getDeliveryPartnerBonusTransactions: (params = {}) =>
    adminClient.get("/food/admin/delivery/bonus-transactions", { params }),
  /** Delivery Earnings (admin) */
  getDeliveryEarnings: (params = {}) =>
    adminClient.get("/food/admin/delivery/earnings", { params }),
  addDeliveryPartnerBonus: (deliveryPartnerId, amount, reference = "") =>
    adminClient.post("/food/admin/delivery/bonus", {
      deliveryPartnerId: String(deliveryPartnerId),
      amount: Number(amount),
      reference: String(reference || ""),
    }),

  /** Earning Addon Offers (admin) */
  getEarningAddons: (params = {}) =>
    adminClient.get("/food/admin/delivery/earning-addons", { params }),
  createEarningAddon: (body) =>
    adminClient.post("/food/admin/delivery/earning-addons", body ?? {}),
  updateEarningAddon: (id, body) =>
    adminClient.patch(`/food/admin/delivery/earning-addons/${String(id)}`, body ?? {}),
  deleteEarningAddon: (id) =>
    adminClient.delete(`/food/admin/delivery/earning-addons/${String(id)}`),
  toggleEarningAddonStatus: (id, status) =>
    adminClient.patch(`/food/admin/delivery/earning-addons/${String(id)}/status`, { status: String(status) }),

  /** Earning Addon History (admin) */
  getEarningAddonHistory: (params = {}) =>
    adminClient.get("/food/admin/delivery/earning-addon-history", { params }),
  creditEarningToWallet: (historyId, notes = "") =>
    adminClient.post(`/food/admin/delivery/earning-addon-history/${String(historyId)}/credit`, { notes: String(notes || "") }),
  cancelEarningAddonHistory: (historyId, reason = "") =>
    adminClient.post(`/food/admin/delivery/earning-addon-history/${String(historyId)}/cancel`, { reason: String(reason || "") }),
  checkEarningAddonCompletions: (deliveryPartnerId, force = false) =>
    adminClient.post("/food/admin/delivery/earning-addon-completions/check", { deliveryPartnerId: String(deliveryPartnerId), force: Boolean(force) }),
  getDeliveryWallets: (params = {}) =>
    adminClient.get("/food/admin/delivery/wallets", { params }),
  getDeliveryWithdrawals: (params = {}) =>
    adminClient.get("/food/admin/delivery/withdrawals", { params }),
  updateDeliveryWithdrawalStatus: (id, body) =>
    adminClient.patch(`/food/admin/delivery/withdrawals/${String(id)}`, body),
  getCashLimitSettlements: (params = {}) =>
    adminClient.get("/food/admin/delivery/cash-limit-settlements", { params }),

  /** Restaurant Commission (admin) */
  getRestaurantCommissionBootstrap: () =>
    adminClient.get("/food/admin/restaurant-commissions/bootstrap"),
  getRestaurantCommissions: (params = {}) =>
    adminClient.get("/food/admin/restaurant-commissions", { params }),
  getRestaurantCommissionById: (id) =>
    adminClient.get(`/food/admin/restaurant-commissions/${String(id)}`),
  createRestaurantCommission: (body) =>
    adminClient.post("/food/admin/restaurant-commissions", body ?? {}),
  updateRestaurantCommission: (id, body) =>
    adminClient.patch(`/food/admin/restaurant-commissions/${String(id)}`, body ?? {}),
  deleteRestaurantCommission: (id) =>
    adminClient.delete(`/food/admin/restaurant-commissions/${String(id)}`),
  toggleRestaurantCommissionStatus: (id) =>
    adminClient.patch(`/food/admin/restaurant-commissions/${String(id)}/toggle`, {}),
  /** Backward-compatible alias used in UI */
  getApprovedRestaurants: (params = {}) =>
    adminClient.get("/food/admin/restaurants", { params: { status: "approved", limit: 1000, ...params } }),

  /** Delivery Boy Commission Rules (admin) */
  getCommissionRules: () =>
    adminClient.get("/food/admin/delivery/commission-rules"),
  createCommissionRule: (body) =>
    adminClient.post("/food/admin/delivery/commission-rules", body ?? {}),
  updateCommissionRule: (id, body) =>
    adminClient.patch(`/food/admin/delivery/commission-rules/${String(id)}`, body ?? {}),
  deleteCommissionRule: (id) =>
    adminClient.delete(`/food/admin/delivery/commission-rules/${String(id)}`),
  toggleCommissionRuleStatus: (id, status) =>
    adminClient.patch(`/food/admin/delivery/commission-rules/${String(id)}/status`, { status: Boolean(status) }),

  /** Fee Settings (admin) */
  getFeeSettings: () =>
    adminClient.get("/food/admin/fee-settings"),
  createOrUpdateFeeSettings: (body) =>
    adminClient.put("/food/admin/fee-settings", body ?? {}),

  /** Referral Settings (admin) */
  getReferralSettings: () =>
    adminClient.get("/food/admin/referral-settings"),
  createOrUpdateReferralSettings: (body) =>
    adminClient.put("/food/admin/referral-settings", body ?? {}),

  /** Safety / Emergency Reports (admin) */
  getSafetyEmergencyReports: (params) =>
    adminClient.get("/food/admin/safety-emergency-reports", { params: params ?? {} }),
  updateSafetyEmergencyStatus: (id, status) =>
    adminClient.put(`/food/admin/safety-emergency-reports/${String(id)}/status`, { status: String(status) }),
  updateSafetyEmergencyPriority: (id, priority) =>
    adminClient.put(`/food/admin/safety-emergency-reports/${String(id)}/priority`, { priority: String(priority) }),
  deleteSafetyEmergencyReport: (id) =>
    adminClient.delete(`/food/admin/safety-emergency-reports/${String(id)}`),

  /** Delivery Cash Limit (admin) */
  getDeliveryCashLimit: () =>
    adminClient.get("/food/admin/delivery-cash-limit"),
  updateDeliveryCashLimit: (body) =>
    adminClient.patch("/food/admin/delivery-cash-limit", body ?? {}),

  /** Delivery Emergency Help (admin) */
  getEmergencyHelp: () =>
    adminClient.get("/food/admin/delivery-emergency-help"),
  createOrUpdateEmergencyHelp: (body) =>
    adminClient.put("/food/admin/delivery-emergency-help", body ?? {}),

  /** Restaurant add-ons approval (admin) */
  getRestaurantAddons: (params = {}) =>
    adminClient.get("/food/admin/addons", { params: params ?? {} }),
  updateRestaurantAddon: (id, body) =>
    adminClient.patch(`/food/admin/addons/${String(id)}`, body ?? {}),
  approveRestaurantAddon: (id) =>
    adminClient.patch(`/food/admin/addons/${String(id)}/approve`, {}),
  rejectRestaurantAddon: (id, reason) =>
    adminClient.patch(`/food/admin/addons/${String(id)}/reject`, { reason: String(reason || "").trim() }),
  /** Business Settings (admin) */
  getBusinessSettings: () =>
    adminClient.get(API_ENDPOINTS.ADMIN.BUSINESS_SETTINGS),
  updateBusinessSettings: (data, files = {}) => {
    const formData = new FormData();
    // Add JSON data
    formData.append("data", JSON.stringify(data));
    // Add files
    if (files.logo) formData.append("logo", files.logo);
    if (files.favicon) formData.append("favicon", files.favicon);

    return adminClient.patch(API_ENDPOINTS.ADMIN.BUSINESS_SETTINGS, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

