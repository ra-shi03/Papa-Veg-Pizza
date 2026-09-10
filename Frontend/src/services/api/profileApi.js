/**
 * API client endpoints for Store Operations Profile Module.
 * Integrates with standard apiClient and provides robust local-storage-based fallback
 * for stand-alone mock environments or incomplete backend APIs.
 */

import apiClient from "./axios";

// Helper to simulate network latency
const sleep = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms));

// Retrieve or initialize mock data in localStorage for interactive UI sessions
const MOCK_STORAGE_KEY = "pvp_store_profile_data";

const defaultMockData = {
  user: {
    fullName: "Siddharth Verma",
    email: "siddharth.verma@papavegpizza.in",
    phone: "+91 98765 43210",
    gender: "Male",
    dateOfBirth: "1994-04-12",
    address: "B-402, Shalimar Township, AB Road, Indore, MP - 452010",
    employeeId: "PVP-EM-409",
    designation: "Store Operations Manager",
    role: "store_manager", // 'store_manager', 'kitchen_supervisor', 'kitchen_staff'
    storeName: "Vijay Nagar Store, Indore",
    joiningDate: "2023-03-15",
    status: "Active",
    lastLogin: "2026-06-25 10:24 AM",
    profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
    reportingManager: "Rajesh Khanna (Franchise Admin)",
    emergencyContact: {
      name: "Anjali Verma",
      phone: "+91 91234 56789",
      relation: "Spouse",
    },
  },
  store: {
    name: "Papa Veg Pizza - Vijay Nagar",
    address: "G-3, Orbit Mall, Vijay Nagar, Indore, Madhya Pradesh - 452010",
    openingTime: "11:00 AM",
    closingTime: "11:00 PM",
    managerName: "Siddharth Verma",
  },
  attendanceSummary: {
    attendanceRate: 96.5,
    presentDays: 24,
    absentDays: 1,
    totalHours: 192,
    lateEntries: 2,
  },
  performanceSummary: {
    ordersManaged: 1420,
    avgPrepTime: "12.5 mins",
    delayedOrders: 14,
    customerComplaints: 3,
    performanceRating: 4.8,
    yearsOfService: 3.2,
    revenueManaged: "₹8,45,000",
    customerSatisfaction: "94%",
    staffEfficiency: "91%",
    ordersPrepared: 820,
    avgPizzaTime: "9.2 mins",
    personalRating: 4.6,
  },
  recentActivities: [
    { id: "act-1", time: "2026-06-25 10:15 AM", module: "Orders", action: "Accepted Order #1203", description: "Accepted and routed order to kitchen" },
    { id: "act-2", time: "2026-06-25 09:30 AM", module: "Inventory", action: "Updated Ingredient Stock", description: "Updated cheese stock to 15kg" },
    { id: "act-3", time: "2026-06-25 08:12 AM", module: "Delivery", action: "Assigned Rider Rahul", description: "Assigned order #1198 to Rahul Dev" },
    { id: "act-4", time: "2026-06-24 06:45 PM", module: "Complaints", action: "Resolved Complaint #55", description: "Refunded customer for incorrect drink item" },
    { id: "act-5", time: "2026-06-24 11:30 AM", module: "Reports", action: "Generated Daily Report", description: "Daily operations summary generated and emailed" },
  ],
  activeSessions: [
    { id: "sess-1", device: "Desktop (Windows 11)", browser: "Chrome", ipAddress: "192.168.1.45", lastActive: "Just now", current: true },
    { id: "sess-2", device: "Mobile (OnePlus 11)", browser: "Chrome Mobile", ipAddress: "192.168.1.12", lastActive: "2 hours ago", current: false },
    { id: "sess-3", device: "Tablet (iPad Air)", browser: "Safari", ipAddress: "10.0.0.84", lastActive: "1 day ago", current: false },
  ],
  notifications: {
    orderAlerts: true,
    inventoryAlerts: true,
    shiftAlerts: false,
    complaintAlerts: true,
    dailyReports: true,
    smsAlerts: false,
    pushNotifications: true,
  },
};

function getLocalData() {
  const data = localStorage.getItem(MOCK_STORAGE_KEY);
  if (!data) {
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(defaultMockData));
    return defaultMockData;
  }
  try {
    return JSON.parse(data);
  } catch {
    return defaultMockData;
  }
}

function saveLocalData(data) {
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(data));
}

export const profileApi = {
  // GET /api/profile
  getProfile: async () => {
    try {
      const res = await apiClient.get("/profile");
      return res.data;
    } catch (err) {
      await sleep(600);
      const data = getLocalData();
      // Ensure the mock role matches any changes made in the demo environment if needed
      const savedRole = localStorage.getItem("demo_user_role");
      if (savedRole && ["store_manager", "kitchen_supervisor", "kitchen_staff"].includes(savedRole)) {
        data.user.role = savedRole;
        if (savedRole === "kitchen_staff") {
          data.user.designation = "Pizza Station Chef";
        } else if (savedRole === "kitchen_supervisor") {
          data.user.designation = "Kitchen Operations Supervisor";
        } else {
          data.user.designation = "Store Operations Manager";
        }
      }
      return { success: true, data };
    }
  },

  // PUT /api/profile/personal
  updatePersonalInfo: async (personalInfo) => {
    try {
      const res = await apiClient.put("/profile/personal", personalInfo);
      return res.data;
    } catch (err) {
      await sleep(800);
      const data = getLocalData();
      data.user = {
        ...data.user,
        fullName: personalInfo.fullName,
        email: personalInfo.email,
        phone: personalInfo.phone,
        gender: personalInfo.gender,
        dateOfBirth: personalInfo.dateOfBirth,
        address: personalInfo.address,
        emergencyContact: personalInfo.emergencyContact || data.user.emergencyContact,
      };
      saveLocalData(data);
      return { success: true, data: data.user };
    }
  },

  // GET /api/profile/work
  getWorkInfo: async () => {
    try {
      const res = await apiClient.get("/profile/work");
      return res.data;
    } catch (err) {
      await sleep(400);
      const data = getLocalData();
      return {
        success: true,
        data: {
          employeeId: data.user.employeeId,
          designation: data.user.designation,
          roleName: data.user.role === "store_manager" ? "Store Manager" : data.user.role === "kitchen_supervisor" ? "Kitchen Supervisor" : "Kitchen Staff",
          storeName: data.user.storeName,
          reportingManager: data.user.reportingManager,
          employmentStatus: data.user.status,
          joiningDate: data.user.joiningDate,
          store: data.store,
        },
      };
    }
  },

  // GET /api/profile/permissions
  getPermissions: async () => {
    try {
      const res = await apiClient.get("/profile/permissions");
      return res.data;
    } catch (err) {
      await sleep(300);
      const data = getLocalData();
      // Provide permission matrix based on role
      const role = data.user.role;
      const allPermissions = {
        Dashboard: true,
        IncomingOrders: role !== "kitchen_staff",
        ActiveOrders: true,
        KitchenQueue: true,
        PizzaStation: true,
        BakingStation: true,
        PackagingStation: true,
        DeliveryOperations: role === "store_manager",
        Inventory: role !== "kitchen_staff",
        StockRequests: role !== "kitchen_staff",
        WasteManagement: true,
        StaffManagement: role === "store_manager",
        Reports: role === "store_manager",
      };
      return { success: true, data: allPermissions };
    }
  },

  // GET /api/profile/performance
  getPerformance: async () => {
    try {
      const res = await apiClient.get("/profile/performance");
      return res.data;
    } catch (err) {
      await sleep(500);
      const data = getLocalData();
      return { success: true, data: data.performanceSummary };
    }
  },

  // GET /api/profile/attendance
  getAttendance: async () => {
    try {
      const res = await apiClient.get("/profile/attendance");
      return res.data;
    } catch (err) {
      await sleep(500);
      const data = getLocalData();
      
      // Attendance logs for table (simulated)
      const logs = [
        { id: "att-1", date: "2026-06-25", shift: "Morning Shift (09:00 - 17:00)", checkIn: "08:55 AM", checkOut: "05:05 PM", hours: "8.1 hrs", status: "Present" },
        { id: "att-2", date: "2026-06-24", shift: "Morning Shift (09:00 - 17:00)", checkIn: "09:12 AM", checkOut: "05:00 PM", hours: "7.8 hrs", status: "Late" },
        { id: "att-3", date: "2026-06-23", shift: "Morning Shift (09:00 - 17:00)", checkIn: "08:52 AM", checkOut: "05:10 PM", hours: "8.3 hrs", status: "Present" },
        { id: "att-4", date: "2026-06-22", shift: "Morning Shift (09:00 - 17:00)", checkIn: "08:58 AM", checkOut: "05:02 PM", hours: "8.0 hrs", status: "Present" },
        { id: "att-5", date: "2026-06-21", shift: "Morning Shift (09:00 - 17:00)", checkIn: "-", checkOut: "-", hours: "0.0 hrs", status: "Absent" },
        { id: "att-6", date: "2026-06-20", shift: "Morning Shift (09:00 - 17:00)", checkIn: "08:50 AM", checkOut: "05:00 PM", hours: "8.1 hrs", status: "Present" },
        { id: "att-7", date: "2026-06-19", shift: "Morning Shift (09:00 - 17:00)", checkIn: "09:05 AM", checkOut: "05:15 PM", hours: "8.1 hrs", status: "Late" },
        { id: "att-8", date: "2026-06-18", shift: "Morning Shift (09:00 - 17:00)", checkIn: "08:48 AM", checkOut: "05:04 PM", hours: "8.2 hrs", status: "Present" },
      ];

      return {
        success: true,
        data: {
          summary: data.attendanceSummary,
          logs: logs,
        },
      };
    }
  },

  // PUT /api/profile/notifications
  updateNotifications: async (notifications) => {
    try {
      const res = await apiClient.put("/profile/notifications", notifications);
      return res.data;
    } catch (err) {
      await sleep(600);
      const data = getLocalData();
      data.notifications = notifications;
      saveLocalData(data);
      return { success: true, data: data.notifications };
    }
  },

  // GET /api/profile/activity-logs
  getActivityLogs: async () => {
    try {
      const res = await apiClient.get("/profile/activity-logs");
      return res.data;
    } catch (err) {
      await sleep(500);
      const data = getLocalData();
      return { success: true, data: data.recentActivities };
    }
  },

  // PUT /api/profile/change-password
  changePassword: async (passwordData) => {
    try {
      const res = await apiClient.put("/profile/change-password", passwordData);
      return res.data;
    } catch (err) {
      await sleep(900);
      // Simulate success
      return { success: true, message: "Password updated successfully." };
    }
  },

  // DELETE /api/profile/sessions/:id
  deleteSession: async (id) => {
    try {
      const res = await apiClient.delete(`/profile/sessions/${id}`);
      return res.data;
    } catch (err) {
      await sleep(600);
      const data = getLocalData();
      data.activeSessions = data.activeSessions.filter((s) => s.id !== id);
      saveLocalData(data);
      return { success: true, message: "Session terminated successfully." };
    }
  },

  // DELETE /api/profile/sessions/other
  logoutOtherSessions: async () => {
    try {
      const res = await apiClient.delete("/profile/sessions?scope=other");
      return res.data;
    } catch (err) {
      await sleep(800);
      const data = getLocalData();
      data.activeSessions = data.activeSessions.filter((s) => s.current);
      saveLocalData(data);
      return { success: true, message: "Other sessions logged out successfully." };
    }
  },

  // DELETE /api/profile/sessions/all
  logoutAllSessions: async () => {
    try {
      const res = await apiClient.delete("/profile/sessions?scope=all");
      return res.data;
    } catch (err) {
      await sleep(800);
      const data = getLocalData();
      data.activeSessions = [];
      saveLocalData(data);
      return { success: true, message: "All sessions terminated successfully." };
    }
  },
};
