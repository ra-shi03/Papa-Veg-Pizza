import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import io from "socket.io-client";
import apiClient from "@/services/api/axios";
import {
  mockPackagingStaff,
  initialMockPackagingOrders,
  initialMockPackagingLogs
} from "../mockData";

// LocalStorage Keys
const PACKAGING_ORDERS_KEY = "pvp_packaging_orders";
const PACKAGING_LOGS_KEY = "pvp_packaging_logs";
const PACKAGING_STAFF_KEY = "pvp_packaging_staff";

// Initialize mock DB in LocalStorage
const initializeMockDb = () => {
  if (!localStorage.getItem(PACKAGING_ORDERS_KEY)) {
    localStorage.setItem(PACKAGING_ORDERS_KEY, JSON.stringify(initialMockPackagingOrders));
  }
  if (!localStorage.getItem(PACKAGING_LOGS_KEY)) {
    localStorage.setItem(PACKAGING_LOGS_KEY, JSON.stringify(initialMockPackagingLogs));
  }
  if (!localStorage.getItem(PACKAGING_STAFF_KEY)) {
    localStorage.setItem(PACKAGING_STAFF_KEY, JSON.stringify(mockPackagingStaff));
  }
};

initializeMockDb();

// Helper functions for LocalStorage access
const getLocalOrders = () => {
  try {
    return JSON.parse(localStorage.getItem(PACKAGING_ORDERS_KEY)) || [];
  } catch (e) {
    return [];
  }
};

const setLocalOrders = (orders) => {
  localStorage.setItem(PACKAGING_ORDERS_KEY, JSON.stringify(orders));
};

const getLocalLogs = () => {
  try {
    return JSON.parse(localStorage.getItem(PACKAGING_LOGS_KEY)) || [];
  } catch (e) {
    return [];
  }
};

const setLocalLogs = (logs) => {
  localStorage.setItem(PACKAGING_LOGS_KEY, JSON.stringify(logs));
};

export function usePackagingStation(filters = {}) {
  const queryClient = useQueryClient();
  const [socketConnected, setSocketConnected] = useState(false);

  useEffect(() => {
    const socketUrl = import.meta.env?.VITE_SOCKET_URL || window.location.origin;
    const socket = io(socketUrl, {
      transports: ["websocket"],
      autoConnect: true,
      reconnectionAttempts: 5,
    });

    socket.on("connect", () => {
      setSocketConnected(true);
    });

    socket.on("disconnect", () => {
      setSocketConnected(false);
    });

    // Real-Time Socket Listeners
    socket.on("packaging_started", ({ orderId }) => {
      toast.info("Packaging started!", {
        description: `Order ${orderId} preparation has commenced.`,
      });
      queryClient.invalidateQueries({ queryKey: ["packagingStation"] });
    });

    socket.on("packaging_completed", ({ orderId }) => {
      toast.success("Packaging completed!", {
        description: `Order ${orderId} has been successfully packed and sealed.`,
      });
      queryClient.invalidateQueries({ queryKey: ["packagingStation"] });
    });

    socket.on("order_ready_for_pickup", ({ orderId }) => {
      toast.success("Order ready for pickup!", {
        description: `Order ${orderId} is now placed in the pickup counter.`,
      });
      queryClient.invalidateQueries({ queryKey: ["packagingStation"] });
    });

    // Standalone Simulation mode for demo
    let simulationTimer;
    if (import.meta.env?.VITE_STANDALONE_MOCK === "true" || !import.meta.env?.VITE_API_BASE_URL) {
      setSocketConnected(true);

      // Random simulator to change state
      simulationTimer = setInterval(() => {
        const local = getLocalOrders();
        
        // Find a ready_for_packaging order
        const readyOrder = local.find(o => o.packaging_status === "ready_for_packaging");
        if (readyOrder) {
          // Auto start packaging
          const updated = local.map(o =>
            o._id === readyOrder._id
              ? {
                  ...o,
                  packaging_status: "packaging_started",
                  assigned_staff: "staff-pack-001",
                  packaging_start_time: new Date().toISOString()
                }
              : o
          );
          setLocalOrders(updated);
          queryClient.invalidateQueries({ queryKey: ["packagingStation"] });
          toast.info(`Simulated: Started packaging for Order #${readyOrder.orderNumber}`);
        }
      }, 60000);
    }

    return () => {
      if (simulationTimer) clearInterval(simulationTimer);
      socket.disconnect();
    };
  }, [queryClient]);

  // Main React Query Fetch
  const query = useQuery({
    queryKey: ["packagingStation", filters],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/packaging", {
          params: filters,
        });

        let apiItems = [];
        if (Array.isArray(response.data)) {
          apiItems = response.data;
        } else if (Array.isArray(response.data?.items)) {
          apiItems = response.data.items;
        } else if (Array.isArray(response.data?.data)) {
          apiItems = response.data.data;
        }

        if (apiItems && apiItems.length > 0) {
          return apiItems;
        }
        throw new Error("No packaging orders returned");
      } catch (err) {
        // Fallback simulated list
        let list = getLocalOrders();

        // Search filter
        if (filters.search) {
          const q = filters.search.toLowerCase();
          list = list.filter(
            (o) =>
              o._id.toLowerCase().includes(q) ||
              o.orderNumber.toLowerCase().includes(q) ||
              o.customer.name.toLowerCase().includes(q) ||
              (o.assigned_staff &&
                (JSON.parse(localStorage.getItem(PACKAGING_STAFF_KEY)) || mockPackagingStaff)
                  .find((s) => s._id === o.assigned_staff)
                  ?.name.toLowerCase()
                  .includes(q))
          );
        }

        // Dropdown filters
        if (filters.status && filters.status !== "All") {
          list = list.filter((o) => o.packaging_status === filters.status);
        }

        if (filters.deliveryType && filters.deliveryType !== "All") {
          list = list.filter((o) => o.deliveryType === filters.deliveryType);
        }

        if (filters.staff && filters.staff !== "All") {
          list = list.filter((o) => o.assigned_staff === filters.staff);
        }

        if (filters.readyForPickup === "true") {
          list = list.filter((o) => o.status === "ready_for_pickup");
        }

        if (filters.pendingPackaging === "true") {
          list = list.filter((o) => o.packaging_status === "ready_for_packaging");
        }

        return list;
      }
    },
    refetchInterval: 15000,
  });

  return {
    ...query,
    socketConnected,
  };
}

// Fetch Staff Query
export function usePackagingStaff() {
  return useQuery({
    queryKey: ["packagingStaff"],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/staff?role=packaging");
        let list = [];
        if (Array.isArray(response.data)) {
          list = response.data;
        } else if (Array.isArray(response.data?.data)) {
          list = response.data.data;
        } else if (Array.isArray(response.data?.staff)) {
          list = response.data.staff;
        }
        if (list && list.length > 0) {
          return list;
        }
        throw new Error("No staff returned");
      } catch (err) {
        return JSON.parse(localStorage.getItem(PACKAGING_STAFF_KEY)) || mockPackagingStaff;
      }
    }
  });
}

// Start Packaging Mutation
export function useStartPackaging() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId }) => {
      try {
        const response = await apiClient.put("/packaging/start", { orderId });
        return response.data;
      } catch (err) {
        const local = getLocalOrders();
        const updated = local.map((o) =>
          o._id === orderId
            ? {
                ...o,
                packaging_status: "packaging_started",
                assigned_staff: "staff-pack-001", // Default logged-in staff simulation
                packaging_start_time: new Date().toISOString()
              }
            : o
        );
        setLocalOrders(updated);
        return { success: true, orderId };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packagingStation"] });
      toast.success("Packaging started successfully.");
    },
    onError: () => {
      toast.error("Failed to start packaging");
    },
  });
}

// Packaging Checklist (Log Verification) Mutation
export function usePackagingChecklist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      try {
        const response = await apiClient.post("/packaging/checklist", payload);
        return response.data;
      } catch (err) {
        const local = getLocalOrders();
        const localLogs = getLocalLogs();

        // 1. Create Log
        const newLog = {
          _id: `log-${Date.now()}`,
          orderId: payload.orderId,
          pizzaCountVerified: payload.pizzaCountVerified,
          saucesIncluded: payload.saucesIncluded,
          cutleryIncluded: payload.cutleryIncluded,
          billAttached: payload.billAttached,
          qualityVerified: payload.qualityVerified,
          packagingSealed: payload.packagingSealed,
          notes: payload.notes || "",
          packaging_staff: "staff-pack-001",
          createdAt: new Date().toISOString()
        };

        // 2. Update Order
        const updatedOrders = local.map((o) =>
          o._id === payload.orderId
            ? { ...o, packaging_status: "quality_checked" }
            : o
        );

        setLocalOrders(updatedOrders);
        setLocalLogs([newLog, ...localLogs]);
        return { success: true };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packagingStation"] });
      toast.success("Quality check verification logged successfully.");
    },
    onError: () => {
      toast.error("Failed to submit packaging checklist");
    },
  });
}

// Seal Package Mutation
export function useSealPackage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, remarks = "" }) => {
      try {
        const response = await apiClient.put("/packaging/seal", { orderId, remarks });
        return response.data;
      } catch (err) {
        const local = getLocalOrders();
        const updated = local.map((o) =>
          o._id === orderId
            ? {
                ...o,
                packaging_status: "sealed",
                packaging_end_time: new Date().toISOString()
              }
            : o
        );
        setLocalOrders(updated);
        return { success: true };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packagingStation"] });
      toast.success("Package marked as sealed.");
    },
    onError: () => {
      toast.error("Failed to seal package");
    },
  });
}

// Mark Order Ready for Pickup Mutation
export function useMarkReady() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId }) => {
      try {
        const response = await apiClient.put(`/orders/${orderId}/ready`, {
          status: "ready_for_pickup"
        });
        return response.data;
      } catch (err) {
        const local = getLocalOrders();
        const updated = local.map((o) =>
          o._id === orderId
            ? {
                ...o,
                status: "ready_for_pickup",
                packaging_status: "ready_for_pickup"
              }
            : o
        );
        setLocalOrders(updated);
        return { success: true };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packagingStation"] });
      toast.success("Order is ready for dispatch/pickup!");
    },
    onError: () => {
      toast.error("Failed to mark order as ready");
    },
  });
}
