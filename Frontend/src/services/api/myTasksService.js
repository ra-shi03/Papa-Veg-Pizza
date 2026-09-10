/**
 * API client endpoints for Kitchen Operations My Tasks Module.
 * Integrates with standard apiClient and provides robust local-storage-based fallback
 * for stand-alone mock environments or incomplete backend APIs.
 */

import apiClient from "./axios";

// Helper to simulate network latency
const sleep = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms));

const MOCK_TASKS_KEY = "pvp_kitchen_tasks_data";

// Initial seed data for tasks operations (Indian names, WebP/Unsplash images)
const initialSeedData = {
  tasks: [
    {
      _id: "task-101",
      storeId: "store-indore-1",
      orderId: "PVP-9042",
      taskType: "prep",
      title: "Stretch Margherita Pizza Base (Medium)",
      description: "Prepare hand-tossed base, spread organic pizza sauce, and sprinkle mozzarella cheese evenly.",
      assignedTo: "Siddharth Verma",
      assignedBy: "Rohan Malhotra (Supervisor)",
      station: "Pizza Station",
      priority: "high",
      status: "pending",
      estimatedMinutes: 10,
      actualMinutes: 0,
      startedAt: null,
      completedAt: null,
      notes: "Ensure the base thickness is exactly 0.5 inches on the edges.",
      attachments: [],
      createdAt: new Date(Date.now() - 600000).toISOString(),
      updatedAt: new Date(Date.now() - 600000).toISOString(),
    },
    {
      _id: "task-102",
      storeId: "store-indore-1",
      orderId: "PVP-9043",
      taskType: "bake",
      title: "Bake Veg Supreme Pizza (Large)",
      description: "Bake at 320 degrees in the deck oven. Check for golden-brown crust and bubbling cheese.",
      assignedTo: "Siddharth Verma",
      assignedBy: "Rohan Malhotra (Supervisor)",
      station: "Baking Station",
      priority: "high",
      status: "in_progress",
      estimatedMinutes: 8,
      actualMinutes: 0,
      startedAt: new Date(Date.now() - 240000).toISOString(), // started 4 mins ago
      completedAt: null,
      notes: "Keep close eye on the onion toppings to prevent charring.",
      attachments: [],
      createdAt: new Date(Date.now() - 900000).toISOString(),
      updatedAt: new Date(Date.now() - 240000).toISOString(),
    },
    {
      _id: "task-103",
      storeId: "store-indore-1",
      orderId: "PVP-9041",
      taskType: "pack",
      title: "Pack Paneer Tikka Pizza + Box Sides",
      description: "Slice into 6 even wedges. Box garlic breadsticks and place inside thermal bag.",
      assignedTo: "Siddharth Verma",
      assignedBy: "Rohan Malhotra (Supervisor)",
      station: "Packaging Station",
      priority: "medium",
      status: "completed",
      estimatedMinutes: 5,
      actualMinutes: 4.8,
      startedAt: new Date(Date.now() - 3600000).toISOString(),
      completedAt: new Date(Date.now() - 3300000).toISOString(), // completed 55 mins ago
      notes: "Customer requested extra garlic dips in the box.",
      attachments: ["https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=150"],
      createdAt: new Date(Date.now() - 4000000).toISOString(),
      updatedAt: new Date(Date.now() - 3300000).toISOString(),
    },
    {
      _id: "task-104",
      storeId: "store-indore-1",
      orderId: "PVP-9039",
      taskType: "prep",
      title: "Prepare Paneer & Onion Garlic Bread",
      description: "Brush with garlic herb butter, add chopped red onions, and diced paneer cubes.",
      assignedTo: "Siddharth Verma",
      assignedBy: "System Auto-Assigner",
      station: "Pizza Station",
      priority: "medium",
      status: "delayed",
      estimatedMinutes: 6,
      actualMinutes: 0,
      startedAt: new Date(Date.now() - 1200000).toISOString(),
      completedAt: null,
      notes: "Needs standard packaging box. Butter is running low at station.",
      attachments: [],
      delayReason: "Ingredient Shortage",
      delayRemarks: "Garlic Butter refill in progress from cold inventory.",
      createdAt: new Date(Date.now() - 1500000).toISOString(),
      updatedAt: new Date(Date.now() - 1000000).toISOString(),
    },
    {
      _id: "task-105",
      storeId: "store-indore-1",
      orderId: "PVP-9045",
      taskType: "prep",
      title: "Double Cheese Margherita (Medium)",
      description: "Apply double layers of grated cheddar and mozzarella over garlic buttered marinara sauce.",
      assignedTo: "Siddharth Verma",
      assignedBy: "System Auto-Assigner",
      station: "Pizza Station",
      priority: "high",
      status: "pending",
      estimatedMinutes: 12,
      actualMinutes: 0,
      startedAt: null,
      completedAt: null,
      notes: "Gluten-Free crust selected by client.",
      attachments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: "task-106",
      storeId: "store-indore-1",
      orderId: "PVP-9046",
      taskType: "prep",
      title: "Prepare Corn & Cheese Pizza (Personal)",
      description: "Spread corn kernels evenly over mozzarella, sprinkle oregano mix.",
      assignedTo: "Karan Singh",
      assignedBy: "Rohan Malhotra (Supervisor)",
      station: "Pizza Station",
      priority: "low",
      status: "pending",
      estimatedMinutes: 7,
      actualMinutes: 0,
      startedAt: null,
      completedAt: null,
      notes: "No onion, no garlic.",
      attachments: [],
      createdAt: new Date(Date.now() - 200000).toISOString(),
      updatedAt: new Date(Date.now() - 200000).toISOString(),
    },
  ],
  logs: [],
  inventoryRequests: [
    { id: "req-1", requestedBy: "Siddharth Verma", ingredientName: "Processed Mozzarella Cheese", quantity: 5, unit: "kg", reason: "Dinner rush replenishment", status: "Approved" },
    { id: "req-2", requestedBy: "Siddharth Verma", ingredientName: "Garlic Herb Butter", quantity: 2, unit: "kg", reason: "Refilling empty containers at Station 1", status: "Pending" },
  ],
  notifications: [
    { id: "not-1", type: "task_assigned", title: "New Task Assigned", message: "Double Cheese Margherita (PVP-9045) assigned to your station.", isRead: false, createdAt: new Date(Date.now() - 50000).toISOString() },
    { id: "not-2", type: "request_approved", title: "Ingredient Request Approved", message: "Request for 5kg Mozzarella Cheese approved and ready for pickup.", isRead: true, createdAt: new Date(Date.now() - 1000000).toISOString() },
  ],
  qualityChecks: [],
};

// Local storage helper
function getDB() {
  const data = localStorage.getItem(MOCK_TASKS_KEY);
  if (!data) {
    localStorage.setItem(MOCK_TASKS_KEY, JSON.stringify(initialSeedData));
    return initialSeedData;
  }
  try {
    return JSON.parse(data);
  } catch {
    return initialSeedData;
  }
}

function saveDB(db) {
  localStorage.setItem(MOCK_TASKS_KEY, JSON.stringify(db));
}

export const myTasksService = {
  // GET /api/tasks
  getMyTasks: async () => {
    try {
      const res = await apiClient.get("/tasks");
      return res.data;
    } catch (err) {
      await sleep(500);
      const db = getDB();
      // Returns only tasks assigned to the mock user "Siddharth Verma"
      const userTasks = db.tasks.filter((t) => t.assignedTo === "Siddharth Verma");
      return { success: true, data: userTasks };
    }
  },

  // GET /api/tasks/stats
  getMyTaskStats: async () => {
    try {
      const res = await apiClient.get("/tasks/stats");
      return res.data;
    } catch (err) {
      await sleep(400);
      const db = getDB();
      const userTasks = db.tasks.filter((t) => t.assignedTo === "Siddharth Verma");
      
      const pending = userTasks.filter((t) => t.status === "pending").length;
      const inProgress = userTasks.filter((t) => t.status === "in_progress").length;
      const delayed = userTasks.filter((t) => t.status === "delayed").length;
      const completed = userTasks.filter((t) => t.status === "completed").length;

      return {
        success: true,
        data: {
          pendingTasks: pending,
          inProgressTasks: inProgress,
          completedToday: completed + 11, // padded with historical stats
          delayedTasks: delayed,
          avgCompletionTime: "11.2 mins",
          performanceScore: "96.4%",
        },
      };
    }
  },

  // PATCH /api/tasks/:id/start
  startTask: async (id, notes) => {
    try {
      const res = await apiClient.patch(`/tasks/${id}/start`, { notes });
      return res.data;
    } catch (err) {
      await sleep(600);
      const db = getDB();
      db.tasks = db.tasks.map((task) => {
        if (task._id === id) {
          return {
            ...task,
            status: "in_progress",
            startedAt: new Date().toISOString(),
            notes: notes || task.notes,
            updatedAt: new Date().toISOString(),
          };
        }
        return task;
      });
      // Add log
      db.logs.push({
        taskId: id,
        userId: "Siddharth Verma",
        action: "started",
        remarks: notes || "Task prep started",
        createdAt: new Date().toISOString(),
      });
      saveDB(db);
      return { success: true, message: "Task started successfully." };
    }
  },

  // PATCH /api/tasks/:id/complete
  completeTask: async (id, payload) => {
    try {
      const res = await apiClient.patch(`/tasks/${id}/complete`, payload);
      return res.data;
    } catch (err) {
      await sleep(750);
      const db = getDB();
      db.tasks = db.tasks.map((task) => {
        if (task._id === id) {
          const started = new Date(task.startedAt || Date.now());
          const actualMin = Math.round((Date.now() - started.getTime()) / 60000 * 10) / 10;
          return {
            ...task,
            status: "completed",
            completedAt: new Date().toISOString(),
            actualMinutes: actualMin || 5.2,
            notes: payload.notes || task.notes,
            attachments: payload.image ? [payload.image] : task.attachments,
            updatedAt: new Date().toISOString(),
          };
        }
        return task;
      });
      // Add log
      db.logs.push({
        taskId: id,
        userId: "Siddharth Verma",
        action: "completed",
        remarks: payload.notes || "Quality boxes completed",
        createdAt: new Date().toISOString(),
      });
      saveDB(db);
      return { success: true, message: "Task completed successfully." };
    }
  },

  // PATCH /api/tasks/:id/delay
  reportDelay: async (id, payload) => {
    try {
      const res = await apiClient.patch(`/tasks/${id}/delay`, payload);
      return res.data;
    } catch (err) {
      await sleep(600);
      const db = getDB();
      db.tasks = db.tasks.map((task) => {
        if (task._id === id) {
          return {
            ...task,
            status: "delayed",
            delayReason: payload.reason,
            delayRemarks: payload.remarks,
            updatedAt: new Date().toISOString(),
          };
        }
        return task;
      });
      // Add log
      db.logs.push({
        taskId: id,
        userId: "Siddharth Verma",
        action: "delayed",
        remarks: `Reason: ${payload.reason} - Remarks: ${payload.remarks}`,
        createdAt: new Date().toISOString(),
      });
      saveDB(db);
      return { success: true, message: "Delay reported successfully." };
    }
  },

  // POST /api/inventory/request
  requestIngredient: async (payload) => {
    try {
      const res = await apiClient.post("/inventory/request", payload);
      return res.data;
    } catch (err) {
      await sleep(650);
      const db = getDB();
      db.inventoryRequests.push({
        id: `req-${Date.now()}`,
        requestedBy: "Siddharth Verma",
        ingredientName: payload.ingredientName,
        quantity: payload.quantity,
        unit: payload.unit,
        reason: payload.reason,
        status: "Pending",
      });
      saveDB(db);
      return { success: true, message: "Ingredient request submitted." };
    }
  },

  // PATCH /api/tasks/:id/request-reassign
  requestReassignment: async (id, payload) => {
    try {
      const res = await apiClient.patch(`/tasks/${id}/request-reassign`, payload);
      return res.data;
    } catch (err) {
      await sleep(600);
      const db = getDB();
      db.tasks = db.tasks.map((task) => {
        if (task._id === id) {
          return {
            ...task,
            status: "pending",
            assignedTo: payload.preferredStaff || "Karan Singh", // simulated handoff
            notes: `Handoff request: ${payload.reason}`,
            updatedAt: new Date().toISOString(),
          };
        }
        return task;
      });
      db.logs.push({
        taskId: id,
        userId: "Siddharth Verma",
        action: "reassigned",
        remarks: `Requested handoff to ${payload.preferredStaff}. Reason: ${payload.reason}`,
        createdAt: new Date().toISOString(),
      });
      saveDB(db);
      return { success: true, message: "Reassignment request submitted." };
    }
  },

  // PATCH /api/tasks/:id/reassign
  reassignTask: async (id, payload) => {
    try {
      const res = await apiClient.patch(`/tasks/${id}/reassign`, payload);
      return res.data;
    } catch (err) {
      await sleep(600);
      const db = getDB();
      db.tasks = db.tasks.map((task) => {
        if (task._id === id) {
          return {
            ...task,
            status: "pending",
            assignedTo: payload.assignedTo,
            notes: `Supervisor reassign: ${payload.reason}`,
            updatedAt: new Date().toISOString(),
          };
        }
        return task;
      });
      db.logs.push({
        taskId: id,
        userId: "Rohan Malhotra",
        action: "reassigned",
        remarks: `Reassigned from original handler to ${payload.assignedTo}. Reason: ${payload.reason}`,
        createdAt: new Date().toISOString(),
      });
      saveDB(db);
      return { success: true, message: "Task reassigned successfully." };
    }
  },

  // POST /api/quality-check
  submitQualityCheck: async (payload) => {
    try {
      const res = await apiClient.post("/quality-check", payload);
      return res.data;
    } catch (err) {
      await sleep(700);
      const db = getDB();
      db.qualityChecks.push({
        id: `qc-${Date.now()}`,
        orderId: payload.orderId,
        checkedBy: "Rohan Malhotra",
        rating: payload.rating,
        remarks: payload.remarks,
        createdAt: new Date().toISOString(),
      });
      saveDB(db);
      return { success: true, message: "Quality check approved and submitted." };
    }
  },

  // GET /api/tasks/team (Supervisor widget stats)
  getTeamTasks: async () => {
    try {
      const res = await apiClient.get("/tasks/team");
      return res.data;
    } catch (err) {
      await sleep(500);
      const db = getDB();
      const pending = db.tasks.filter((t) => t.status === "pending").length;
      const delayed = db.tasks.filter((t) => t.status === "delayed").length;
      const inProgress = db.tasks.filter((t) => t.status === "in_progress").length;

      // Group active staff tasks
      const activeStaff = [
        { name: "Siddharth Verma", activeTasks: inProgress, status: "Active" },
        { name: "Karan Singh", activeTasks: 1, status: "Active" },
        { name: "Amit Patel", activeTasks: 0, status: "Break" },
        { name: "Sunita Sharma", activeTasks: 2, status: "Active" },
      ];

      return {
        success: true,
        data: {
          activeStaffCount: 3,
          totalStaff: 4,
          pendingTasks: pending,
          delayedTasks: delayed,
          completedToday: 52,
          staffList: activeStaff,
        },
      };
    }
  },

  // GET /api/tasks/notifications
  getNotifications: async () => {
    try {
      const res = await apiClient.get("/tasks/notifications");
      return res.data;
    } catch (err) {
      await sleep(300);
      const db = getDB();
      return { success: true, data: db.notifications };
    }
  },

  // PATCH /api/tasks/notifications/read
  markNotificationRead: async (id) => {
    try {
      const res = await apiClient.patch(`/tasks/notifications/${id}/read`);
      return res.data;
    } catch (err) {
      const db = getDB();
      db.notifications = db.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      );
      saveDB(db);
      return { success: true };
    }
  },
};
