import apiClient, { userClient, restaurantClient, deliveryClient, adminClient } from "./axios.js";
import { API_ENDPOINTS } from "./config.js";
import * as authService from "./auth.js";
import { createStubAPI, emptyDataStub, stub } from "./core.js";


export const supportAPI = {
  createTicket: (body) =>
    userClient.post("/food/user/support/ticket", body ?? {}),
  getMyTickets: (params = {}) =>
    userClient.get("/food/user/support/my-tickets", { params }),
  getSupportTicketsAdmin: (params = {}) =>
    adminClient.get("/food/admin/support-tickets", { params }),
  updateSupportTicketAdmin: (id, body = {}) =>
    adminClient.patch(`/food/admin/support-tickets/${String(id)}`, body ?? {}),
};


export const notificationAPI = {
  getInbox: (params = {}, config = {}) =>
    apiClient.get("/food/notifications/inbox", {
      params,
      ...config,
    }),
  markAsRead: (id, config = {}) =>
    apiClient.patch(`/food/notifications/${String(id)}/read`, {}, config),
  dismiss: (id, config = {}) =>
    apiClient.delete(`/food/notifications/${String(id)}`, config),
  dismissAll: (config = {}) =>
    apiClient.delete("/food/notifications/inbox/all", config),
  sendTestNotification: (platform = "web", config = {}) =>
    apiClient.post("/fcm-tokens/test", { platform }, config),
};

