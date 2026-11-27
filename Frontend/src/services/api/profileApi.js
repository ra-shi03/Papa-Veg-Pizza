import { authKey } from "@/shared/utils/authNamespace";
/**
 * API client endpoints for Store Operations Profile Module.
 * Integrates with standard apiClient and provides robust local-storage-based fallback
 * for stand-alone environments or incomplete backend APIs.
 */

import { adminClient } from "./axios.js";
import { throwApiError } from "./apiError.js";

// The /profile/* calls are the store team's own profile: they go through the admin client, which sends the store's sign-in.
// (The general client picks the token from the URL, and "/profile" would get the customer's.)
// Session calls carry this device's refresh token in a header, so the server can tell "this device" from the others.
const refreshHeader = () => {
  try {
    const token = localStorage.getItem(authKey("admin", "refreshToken"));
    return token ? { "X-Refresh-Token": token } : {};
  } catch {
    return {};
  }
};


const failed = (err, fallback) => ({
  success: false,
  message:
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    (err?.response ? fallback : "Could not reach the server. Check your connection and try again."),
});

// Helper to simulate network latency

// Retrieve or initialize data in localStorage for interactive UI sessions




export const profileApi = {
  // GET /api/profile
  getProfile: async () => {
    try {
      const res = await adminClient.get("/profile", { headers: refreshHeader() });
      return res.data;
    } catch (err) {
      throwApiError(err, "Could not load your profile.");
      
    }
  },

  // PUT /api/profile/personal
  updatePersonalInfo: async (personalInfo) => {
    try {
      const res = await adminClient.put("/profile/personal", personalInfo);
      return res.data;
    } catch (err) {
      return failed(err, "Failed to update profile.");
      
    }
  },



  // POST /profile/photo (multipart, field "file"): the server checks it is a real image and returns its URL
  uploadPhoto: async (file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await adminClient.post("/profile/photo", formData);
      return res.data;
    } catch (err) {
      return failed(err, "Failed to upload photo.");
      
    }
  },

  // GET /api/profile/permissions
  getPermissions: async () => {
    try {
      const res = await adminClient.get("/profile/permissions");
      return res.data;
    } catch (err) {
      throwApiError(err, "Could not load permissions.");
      
    }
  },

  // GET /api/profile/performance
  getPerformance: async () => {
    try {
      const res = await adminClient.get("/profile/performance");
      return res.data;
    } catch (err) {
      throwApiError(err, "Could not load performance.");
      
    }
  },

  // GET /api/profile/attendance
  getAttendance: async () => {
    try {
      const res = await adminClient.get("/profile/attendance");
      return res.data;
    } catch (err) {
      throwApiError(err, "Could not load attendance.");
      
    }
  },

  // PUT /api/profile/notifications
  updateNotifications: async (notifications) => {
    try {
      const res = await adminClient.put("/profile/notifications", notifications);
      return res.data;
    } catch (err) {
      return failed(err, "Failed to update preferences.");
      
    }
  },

  // GET /api/profile/activity-logs
  getActivityLogs: async () => {
    try {
      const res = await adminClient.get("/profile/activity-logs");
      return res.data;
    } catch (err) {
      throwApiError(err, "Could not load activity.");
      
    }
  },

  // PUT /api/profile/change-password
  changePassword: async (passwordData) => {
    try {
      // this device's refresh token keeps this session signed in while the other logins are signed out
      const refreshToken = refreshHeader()["X-Refresh-Token"];
      const res = await adminClient.put("/profile/change-password", refreshToken ? { ...passwordData, refreshToken } : passwordData);
      return res.data;
    } catch (err) {
      return { success: false, message: err?.response?.data?.message || err.message || "Password update failed." };
    }
  },

  // DELETE /api/profile/sessions/:id
  deleteSession: async (id) => {
    try {
      const res = await adminClient.delete(`/profile/sessions/${id}`);
      return res.data;
    } catch (err) {
      return failed(err, "Failed to end the session.");
      
    }
  },

  // DELETE /api/profile/sessions/other
  logoutOtherSessions: async () => {
    try {
      const res = await adminClient.delete("/profile/sessions?scope=other", { headers: refreshHeader() });
      return res.data;
    } catch (err) {
      return failed(err, "Failed to sign out the other sessions.");
      
    }
  },

  // DELETE /api/profile/sessions/all
  logoutAllSessions: async () => {
    try {
      const res = await adminClient.delete("/profile/sessions?scope=all");
      return res.data;
    } catch (err) {
      return failed(err, "Failed to sign out all sessions.");
      
    }
  },
};
