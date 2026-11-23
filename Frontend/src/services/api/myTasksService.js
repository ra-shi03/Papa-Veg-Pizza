/**
 * API client endpoints for Kitchen Operations My Tasks Module.
 * Integrates with standard apiClient and provides robust local-storage-based fallback
 * for stand-alone environments or incomplete backend APIs.
 */

import apiClient from "./axios";
import { throwApiError } from "./apiError.js";

// Helper to simulate network latency


// Initial seed data for tasks operations (Indian names, WebP/Unsplash images)

// Local storage helper


export const myTasksService = {
  // GET /api/tasks
  getMyTasks: async () => {
    try {
      const res = await apiClient.get("/tasks");
      return res.data;
    } catch (err) {

      throwApiError(err, "Could not load your tasks");
      
    }
  },

  // GET /api/tasks/stats
  getMyTaskStats: async () => {
    try {
      const res = await apiClient.get("/tasks/stats");
      return res.data;
    } catch (err) {

      throwApiError(err, "Could not load your tasks");
      
    }
  },

  // PATCH /api/tasks/:id/start
  startTask: async (id, notes) => {
    try {
      const res = await apiClient.patch(`/tasks/${id}/start`, { notes });
      return res.data;
    } catch (err) {
      // A write never pretends to work: the server's answer (403 / 404 / 400) or a network failure is shown as the error.

      throwApiError(err, "Could not save your change. Please try again.");
      
    }
  },

  // Proof photos are shrunk in the browser first, then stored on Cloudinary; the task only keeps the returned URL.
  uploadProof: async (blob) => {
    const form = new FormData();
    form.append("file", blob, "proof.jpg");
    const res = await apiClient.post("/uploads/image", form, {
      contextModule: "admin",
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res?.data?.data?.url || "";
  },

  // PATCH /api/tasks/:id/complete
  completeTask: async (id, payload) => {
    try {
      const res = await apiClient.patch(`/tasks/${id}/complete`, payload);
      return res.data;
    } catch (err) {
      // A write never pretends to work: the server's answer (403 / 404 / 400) or a network failure is shown as the error.

      throwApiError(err, "Could not save your change. Please try again.");
      
    }
  },

  // PATCH /api/tasks/:id/delay
  reportDelay: async (id, payload) => {
    try {
      const res = await apiClient.patch(`/tasks/${id}/delay`, payload);
      return res.data;
    } catch (err) {
      // A write never pretends to work: the server's answer (403 / 404 / 400) or a network failure is shown as the error.

      throwApiError(err, "Could not save your change. Please try again.");
      
    }
  },

  // POST /api/v1/food/store/kitchen/inventory-requests
  requestIngredient: async (payload) => {
    try {
      const res = await apiClient.post("/food/store/kitchen/inventory-requests", payload);
      return res.data;
    } catch (err) {
      // A write never pretends to work: the server's answer (403 / 404 / 400) or a network failure is shown as the error.

      throwApiError(err, "Could not save your change. Please try again.");
      
    }
  },

  // PATCH /api/tasks/:id/request-reassign
  requestReassignment: async (id, payload) => {
    try {
      const res = await apiClient.patch(`/tasks/${id}/request-reassign`, payload);
      return res.data;
    } catch (err) {
      // A write never pretends to work: the server's answer (403 / 404 / 400) or a network failure is shown as the error.

      throwApiError(err, "Could not save your change. Please try again.");
      
    }
  },

  // PATCH /api/tasks/:id/reassign
  reassignTask: async (id, payload) => {
    try {
      const res = await apiClient.patch(`/tasks/${id}/reassign`, payload);
      return res.data;
    } catch (err) {
      // A write never pretends to work: the server's answer (403 / 404 / 400) or a network failure is shown as the error.

      throwApiError(err, "Could not save your change. Please try again.");
      
    }
  },

  // POST /api/v1/food/store/kitchen/quality-checks
  submitQualityCheck: async (payload) => {
    try {
      const res = await apiClient.post("/food/store/kitchen/quality-checks", payload);
      return res.data;
    } catch (err) {
      // A write never pretends to work: the server's answer (403 / 404 / 400) or a network failure is shown as the error.

      throwApiError(err, "Could not save your change. Please try again.");
      
    }
  },

  // GET /api/tasks/team (Supervisor widget stats)
  getTeamTasks: async () => {
    try {
      const res = await apiClient.get("/tasks/team");
      return res.data;
    } catch (err) {

      throwApiError(err, "Could not load your tasks");
      
    }
  },

  // GET /api/tasks/notifications
  getNotifications: async () => {
    try {
      const res = await apiClient.get("/tasks/notifications");
      return res.data;
    } catch (err) {

      throwApiError(err, "Could not load your tasks");
      
    }
  },

  // PATCH /api/tasks/notifications/read
  markNotificationRead: async (id) => {
    try {
      const res = await apiClient.patch(`/tasks/notifications/${id}/read`);
      return res.data;
    } catch (err) {
      // A write never pretends to work: the server's answer (403 / 404 / 400) or a network failure is shown as the error.

      throwApiError(err, "Could not save your change. Please try again.");
      
    }
  },
};
