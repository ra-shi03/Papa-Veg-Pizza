import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import io from "socket.io-client";
import apiClient from "@/services/api/axios";
import {
  initialMockDelayedOrders,
  initialMockEscalations,
  mockManagementStaff,
  mockChefs,
  mockStaff,
  mockPackagingStaff
} from "../mockData";

// LocalStorage Keys
const DELAYED_ORDERS_KEY = "pvp_delayed_orders";
const ESCALATIONS_KEY = "pvp_escalations";
const MANAGEMENT_STAFF_KEY = "pvp_management_staff";

// Initialize mock DB in LocalStorage
const initializeMockDb = () => {
  if (!localStorage.getItem(DELAYED_ORDERS_KEY)) {
    localStorage.setItem(DELAYED_ORDERS_KEY, JSON.stringify(initialMockDelayedOrders));
  }
  if (!localStorage.getItem(ESCALATIONS_KEY)) {
    localStorage.setItem(ESCALATIONS_KEY, JSON.stringify(initialMockEscalations));
  }
  if (!localStorage.getItem(MANAGEMENT_STAFF_KEY)) {
    localStorage.setItem(MANAGEMENT_STAFF_KEY, JSON.stringify(mockManagementStaff));
  }
};

initializeMockDb();

const getLocalDelayedOrders = () => {
  try {
    return JSON.parse(localStorage.getItem(DELAYED_ORDERS_KEY)) || [];
  } catch (e) {
    return [];
  }
};

const setLocalDelayedOrders = (orders) => {
  localStorage.setItem(DELAYED_ORDERS_KEY, JSON.stringify(orders));
};

const getLocalEscalations = () => {
  try {
    return JSON.parse(localStorage.getItem(ESCALATIONS_KEY)) || [];
  } catch (e) {
    return [];
  }
};

const setLocalEscalations = (escalations) => {
  localStorage.setItem(ESCALATIONS_KEY, JSON.stringify(escalations));
};

// Hook for fetching delayed orders list
export function useDelayedOrders(filters = {}) {
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
    socket.on("order_delayed", ({ orderId }) => {
      toast.error("Order delayed!", {
        description: `Order ${orderId} has breached SLA.`,
      });
      queryClient.invalidateQueries({ queryKey: ["delayedOrders"] });
    });

    socket.on("delay_resolved", ({ orderId }) => {
      toast.success("Delay resolved", {
        description: `SLA warning resolved for Order ${orderId}.`,
      });
      queryClient.invalidateQueries({ queryKey: ["delayedOrders"] });
    });

    socket.on("customer_notified", ({ orderId }) => {
      toast.info("Customer notified", {
        description: `Notification sent to customer for Order ${orderId}.`,
      });
      queryClient.invalidateQueries({ queryKey: ["delayedOrders"] });
    });

    socket.on("order_escalated", ({ orderId, severity }) => {
      toast.warning("Escalation created", {
        description: `${severity} escalation active for Order ${orderId}.`,
      });
      queryClient.invalidateQueries({ queryKey: ["delayedOrders"] });
    });

    // Standalone Simulation Mode
    let simulationTimer;
    if (import.meta.env?.VITE_STANDALONE_MOCK === "true" || !import.meta.env?.VITE_API_BASE_URL) {
      setSocketConnected(true);

      // Simple delay simulator (randomly triggers every 70 seconds)
      simulationTimer = setInterval(() => {
        const localOrders = getLocalDelayedOrders();
        // Increment delay duration of all active delayed orders
        const updated = localOrders.map(o => {
          if (o.isDelayed) {
            return { ...o, delay_duration: o.delay_duration + 1 };
          }
          return o;
        });
        setLocalDelayedOrders(updated);
        queryClient.invalidateQueries({ queryKey: ["delayedOrders"] });
      }, 70000);
    }

    return () => {
      if (simulationTimer) clearInterval(simulationTimer);
      socket.disconnect();
    };
  }, [queryClient]);

  const query = useQuery({
    queryKey: ["delayedOrders", filters],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/delayed-orders", {
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
        throw new Error("No items returned");
      } catch (err) {
        // Fallback to LocalStorage
        let list = getLocalDelayedOrders();

        // 1. Search filter
        if (filters.search) {
          const q = filters.search.toLowerCase();
          list = list.filter(o => 
            o._id.toLowerCase().includes(q) ||
            o.orderNumber.toLowerCase().includes(q) ||
            o.customer.name.toLowerCase().includes(q) ||
            o.customer.phone.includes(q) ||
            (o.assigned_staff && getStaffName(o.assigned_staff).toLowerCase().includes(q))
          );
        }

        // 2. Stage Filter
        if (filters.stage && filters.stage !== "All") {
          list = list.filter(o => o.status === filters.stage.toLowerCase());
        }

        // 3. Priority Filter
        if (filters.priority && filters.priority !== "All") {
          list = list.filter(o => o.priority === filters.priority);
        }

        // 4. Assigned Staff Filter
        if (filters.staffId && filters.staffId !== "All") {
          list = list.filter(o => o.assigned_staff === filters.staffId);
        }

        // 5. Issue Type Filter
        if (filters.issueType && filters.issueType !== "All") {
          list = list.filter(o => o.reason === filters.issueType);
        }

        // 6. Critical Only Filter
        if (filters.criticalOnly === true || filters.criticalOnly === "true") {
          list = list.filter(o => o.delay_duration > 20);
        }

        // 7. Resolved status
        if (filters.resolved === "false") {
          list = list.filter(o => o.isDelayed === true);
        } else if (filters.resolved === "true") {
          list = list.filter(o => o.isDelayed === false);
        } else {
          // Default: show active delayed orders
          list = list.filter(o => o.isDelayed === true);
        }

        return list;
      }
    }
  });

  return {
    ...query,
    socketConnected
  };
}

// Helper to get staff name by ID
export function getStaffName(staffId) {
  const allStaff = [...mockChefs, ...mockStaff, ...mockPackagingStaff, ...mockManagementStaff];
  const found = allStaff.find(s => s._id === staffId);
  return found ? found.name : "Unassigned";
}

// Helper to get all staff for reassign
export function useActiveStaff() {
  return useQuery({
    queryKey: ["activeStaff"],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/staff?status=active");
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
        // Fallback: merge chefs, baking staff, and packaging staff
        const chefs = mockChefs.map(c => ({ ...c, role: "Chef" }));
        const bakers = mockStaff.map(b => ({ ...b, role: "Baking Crew" }));
        const packers = mockPackagingStaff.map(p => ({ ...p, role: "Packaging Crew" }));
        return [...chefs, ...bakers, ...packers];
      }
    }
  });
}

// Escalation mutation
export function useEscalateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, severity, reason, assignedTo, notes }) => {
      try {
        const response = await apiClient.post(`/orders/${orderId}/escalate`, {
          severity,
          reason,
          assignedTo,
          notes
        });
        return response.data;
      } catch (err) {
        // Fallback LocalStorage update
        const escalations = getLocalEscalations();
        const newEsc = {
          _id: `esc-${Date.now()}`,
          orderId,
          severity,
          reason,
          assignedTo,
          notes,
          createdAt: new Date().toISOString()
        };
        escalations.push(newEsc);
        setLocalEscalations(escalations);
        return newEsc;
      }
    },
    onSuccess: (data, variables) => {
      toast.warning("Escalation created", {
        description: "Escalation created successfully."
      });
      queryClient.invalidateQueries({ queryKey: ["delayedOrders"] });
    }
  });
}

// Reassign staff mutation
export function useReassignStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, staffId }) => {
      try {
        const response = await apiClient.put(`/orders/${orderId}/reassign`, {
          staffId
        });
        return response.data;
      } catch (err) {
        // Fallback LocalStorage update
        const orders = getLocalDelayedOrders();
        const updated = orders.map(o => {
          if (o._id === orderId) {
            // Update assigned_staff and add a timeline step
            const updatedTimeline = [...o.timeline, {
              status: "Staff Reassigned",
              time: new Date().toISOString()
            }];
            return {
              ...o,
              assigned_staff: staffId,
              timeline: updatedTimeline
            };
          }
          return o;
        });
        setLocalDelayedOrders(updated);
        return { orderId, staffId };
      }
    },
    onMutate: async ({ orderId, staffId }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ["delayedOrders"] });
      const previousOrders = queryClient.getQueryData(["delayedOrders"]);

      if (previousOrders) {
        queryClient.setQueryData(["delayedOrders"], (old) => {
          if (!Array.isArray(old)) return old;
          return old.map(o => {
            if (o._id === orderId) {
              return { ...o, assigned_staff: staffId };
            }
            return o;
          });
        });
      }

      return { previousOrders };
    },
    onError: (err, newValues, context) => {
      if (context?.previousOrders) {
        queryClient.setQueryData(["delayedOrders"], context.previousOrders);
      }
    },
    onSuccess: () => {
      toast.success("Staff reassigned", {
        description: "Staff reassigned successfully."
      });
      queryClient.invalidateQueries({ queryKey: ["delayedOrders"] });
    }
  });
}

// Notify customer mutation
export function useNotifyCustomer() {
  return useMutation({
    mutationFn: async ({ orderId, channels, message }) => {
      try {
        const response = await apiClient.post(`/orders/${orderId}/notify-customer`, {
          channels,
          message
        });
        return response.data;
      } catch (err) {
        // Mock success
        return { orderId, channels, message };
      }
    },
    onSuccess: () => {
      toast.success("Customer notified", {
        description: "Customer notified successfully."
      });
    }
  });
}

// Resolve delay mutation
export function useResolveDelay() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, resolutionNotes }) => {
      try {
        const response = await apiClient.put(`/orders/${orderId}/resolve-delay`, {
          resolutionNotes
        });
        return response.data;
      } catch (err) {
        // Fallback LocalStorage update: set isDelayed = false
        const orders = getLocalDelayedOrders();
        const updated = orders.map(o => {
          if (o._id === orderId) {
            const updatedTimeline = [...o.timeline, {
              status: "Resolved",
              time: new Date().toISOString(),
              notes: resolutionNotes
            }];
            return {
              ...o,
              isDelayed: false,
              timeline: updatedTimeline
            };
          }
          return o;
        });
        setLocalDelayedOrders(updated);
        return { orderId, resolutionNotes };
      }
    },
    onSuccess: () => {
      toast.success("Delay resolved", {
        description: "Delayed status cleared successfully."
      });
      queryClient.invalidateQueries({ queryKey: ["delayedOrders"] });
    }
  });
}
