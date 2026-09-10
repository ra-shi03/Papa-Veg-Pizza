import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import io from "socket.io-client";
import { initialMockActiveOrders, initialMockActiveStaff } from "../mockData";

// Local storage key names for fallback mock db
const ACTIVE_ORDERS_STORAGE_KEY = "pvp_active_orders";
const ACTIVE_STAFF_STORAGE_KEY = "pvp_active_staff";

// Helpers to get/set items in local storage with automatic mock seeding
const getLocalActiveOrders = () => {
  try {
    let list = JSON.parse(localStorage.getItem(ACTIVE_ORDERS_STORAGE_KEY));
    if (!list || !Array.isArray(list) || list.length === 0) {
      list = initialMockActiveOrders;
      localStorage.setItem(ACTIVE_ORDERS_STORAGE_KEY, JSON.stringify(list));
    }
    return list;
  } catch (e) {
    localStorage.setItem(ACTIVE_ORDERS_STORAGE_KEY, JSON.stringify(initialMockActiveOrders));
    return initialMockActiveOrders;
  }
};

const setLocalActiveOrders = (orders) => {
  localStorage.setItem(ACTIVE_ORDERS_STORAGE_KEY, JSON.stringify(orders));
};

const getLocalActiveStaff = () => {
  try {
    let list = JSON.parse(localStorage.getItem(ACTIVE_STAFF_STORAGE_KEY));
    if (!list || !Array.isArray(list) || list.length === 0) {
      list = initialMockActiveStaff;
      localStorage.setItem(ACTIVE_STAFF_STORAGE_KEY, JSON.stringify(list));
    }
    return list;
  } catch (e) {
    localStorage.setItem(ACTIVE_STAFF_STORAGE_KEY, JSON.stringify(initialMockActiveStaff));
    return initialMockActiveStaff;
  }
};

const setLocalActiveStaff = (staff) => {
  localStorage.setItem(ACTIVE_STAFF_STORAGE_KEY, JSON.stringify(staff));
};

// Main fetch hook (pure mock implementation)
export function useActiveOrders(filters = {}) {
  const queryClient = useQueryClient();
  const [socketConnected, setSocketConnected] = useState(false);

  useEffect(() => {
    // Simulate real-time socket connection for visual feedback
    setSocketConnected(true);

    const socketUrl = import.meta.env?.VITE_SOCKET_URL || window.location.origin;
    const socket = io(socketUrl, {
      transports: ["websocket"],
      autoConnect: false, // Don't actually connect to prevent console socket errors
    });

    // We simulate random incoming orders or stage updates on a interval to make frontend feel alive
    const simInterval = setInterval(() => {
      // Occasional check
    }, 15000);

    return () => {
      clearInterval(simInterval);
      socket.disconnect();
    };
  }, [queryClient]);

  const activeOrdersQuery = useQuery({
    queryKey: ["activeOrders", filters],
    queryFn: async () => {
      // Artificial delay to simulate real network request
      await new Promise((resolve) => setTimeout(resolve, 300));
      
      let list = getLocalActiveOrders();

      // Apply filters locally
      if (filters.search) {
        const q = filters.search.toLowerCase();
        list = list.filter(
          (o) =>
            o.orderNumber.toLowerCase().includes(q) ||
            o.customer.name.toLowerCase().includes(q) ||
            o.customer.phone.toLowerCase().includes(q)
        );
      }

      if (filters.kitchenStage && filters.kitchenStage !== "All") {
        if (filters.kitchenStage === "preparing") {
          list = list.filter((o) => o.status === "confirmed" || o.status === "preparing");
        } else {
          list = list.filter((o) => o.status === filters.kitchenStage);
        }
      }

      if (filters.priority && filters.priority !== "All") {
        list = list.filter((o) => o.priority === filters.priority.toLowerCase());
      }

      if (filters.orderType && filters.orderType !== "All") {
        list = list.filter((o) => o.orderType === filters.orderType.toLowerCase());
      }

      if (filters.assignedStaff && filters.assignedStaff !== "All") {
        list = list.filter((o) => {
          const staff = o.assignedStaff || {};
          return (
            staff.pizza_chef?._id === filters.assignedStaff ||
            staff.baking_chef?._id === filters.assignedStaff ||
            staff.packaging_staff?._id === filters.assignedStaff
          );
        });
      }

      if (filters.delayedOnly) {
        const now = new Date();
        list = list.filter((o) => o.expectedReadyAt && new Date(o.expectedReadyAt) < now);
      }

      return list;
    },
    staleTime: 1000,
  });

  return {
    ...activeOrdersQuery,
    socketConnected,
  };
}

// Hook to fetch active staff members
export function useActiveKitchenStaff(roleFilter = "") {
  return useQuery({
    queryKey: ["activeKitchenStaff", roleFilter],
    queryFn: async () => {
      let staff = getLocalActiveStaff();
      if (roleFilter) {
        staff = staff.filter((s) => s.role === roleFilter && s.status === "active");
      } else {
        staff = staff.filter((s) => s.status === "active");
      }
      return staff;
    },
  });
}

// Mutation to update kitchen stage (DND or button action)
export function useUpdateKitchenStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, status }) => {
      const list = getLocalActiveOrders();
      const updated = list.map((o) => {
        if (o._id === orderId) {
          const currentTimeline = o.timeline || [];
          return {
            ...o,
            status,
            timeline: [
              ...currentTimeline,
              {
                status,
                timestamp: new Date().toISOString(),
                note: `Moved order to ${status} stage`
              }
            ]
          };
        }
        return o;
      });
      setLocalActiveOrders(updated);
      return { success: true, orderId, status };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["activeOrders"] });
      toast.success(`Stage updated to ${variables.status}`);
    },
    onError: (err) => {
      toast.error("Failed to update stage: " + err.message);
    },
  });
}

// Mutation to assign staff members
export function useAssignStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, role, staffId }) => {
      const staffList = getLocalActiveStaff();
      const staffMember = staffList.find((s) => s._id === staffId);
      if (!staffMember) throw new Error("Staff member not found");

      const list = getLocalActiveOrders();
      const updated = list.map((o) => {
        if (o._id === orderId) {
          const assigned = { ...(o.assignedStaff || {}), [role]: { _id: staffMember._id, name: staffMember.name } };
          const currentTimeline = o.timeline || [];
          return {
            ...o,
            assignedStaff: assigned,
            timeline: [
              ...currentTimeline,
              {
                status: o.status,
                timestamp: new Date().toISOString(),
                note: `Assigned ${staffMember.name} as ${role.replace("_", " ")}`
              }
            ]
          };
        }
        return o;
      });

      const updatedStaff = staffList.map((s) => {
        if (s._id === staffId) {
          return { ...s, currentActiveOrders: (s.currentActiveOrders || 0) + 1 };
        }
        return s;
      });
      setLocalActiveStaff(updatedStaff);
      setLocalActiveOrders(updated);

      return { success: true, orderId, role, staffMember };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activeOrders"] });
      queryClient.invalidateQueries({ queryKey: ["activeKitchenStaff"] });
      toast.success("Kitchen staff assigned successfully");
    },
    onError: (err) => {
      toast.error("Failed to assign staff: " + err.message);
    },
  });
}

// Mutation to change priority
export function useChangePriority() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, priority, reason }) => {
      const list = getLocalActiveOrders();
      const updated = list.map((o) => {
        if (o._id === orderId) {
          const currentTimeline = o.timeline || [];
          return {
            ...o,
            priority,
            priorityReason: reason,
            timeline: [
              ...currentTimeline,
              {
                status: o.status,
                timestamp: new Date().toISOString(),
                note: `Priority changed to ${priority.toUpperCase()}. Reason: ${reason || "N/A"}`
              }
            ]
          };
        }
        return o;
      });
      setLocalActiveOrders(updated);
      return { success: true, orderId, priority, reason };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["activeOrders"] });
      toast.success(`Priority updated to ${variables.priority.toUpperCase()}`);
    },
    onError: (err) => {
      toast.error("Failed to update priority: " + err.message);
    },
  });
}

// Mutation to pause order
export function usePauseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, isPaused, reason }) => {
      const list = getLocalActiveOrders();
      const updated = list.map((o) => {
        if (o._id === orderId) {
          const currentTimeline = o.timeline || [];
          return {
            ...o,
            isPaused,
            pauseReason: reason,
            timeline: [
              ...currentTimeline,
              {
                status: o.status,
                timestamp: new Date().toISOString(),
                note: isPaused ? `Order paused. Reason: ${reason}` : "Order resumed"
              }
            ]
          };
        }
        return o;
      });
      setLocalActiveOrders(updated);
      return { success: true, orderId, isPaused, reason };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["activeOrders"] });
      toast.success(variables.isPaused ? "Order paused" : "Order resumed");
    },
    onError: (err) => {
      toast.error("Failed to pause order: " + err.message);
    },
  });
}

// Mutation to mark order ready
export function useMarkReady() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId }) => {
      const list = getLocalActiveOrders();
      const acceptedOrder = list.find((o) => o._id === orderId);
      
      setLocalActiveOrders(list.filter((o) => o._id !== orderId));
      
      if (acceptedOrder && acceptedOrder.assignedStaff) {
        const staffList = getLocalActiveStaff();
        const assignedIds = [
          acceptedOrder.assignedStaff.pizza_chef?._id,
          acceptedOrder.assignedStaff.baking_chef?._id,
          acceptedOrder.assignedStaff.packaging_staff?._id
        ].filter(Boolean);
        
        const updatedStaff = staffList.map((s) => {
          if (assignedIds.includes(s._id)) {
            return { ...s, currentActiveOrders: Math.max(0, (s.currentActiveOrders || 1) - 1) };
          }
          return s;
        });
        setLocalActiveStaff(updatedStaff);
      }

      return { success: true, orderId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activeOrders"] });
      queryClient.invalidateQueries({ queryKey: ["activeKitchenStaff"] });
      toast.success("Order marked as ready and sent to dispatch!");
    },
    onError: (err) => {
      toast.error("Failed to mark order ready: " + err.message);
    },
  });
}

// Mutation to log delay
export function useLogDelay() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, minutes, reason }) => {
      const list = getLocalActiveOrders();
      const updated = list.map((o) => {
        if (o._id === orderId) {
          const expectedTime = new Date(o.expectedReadyAt || o.createdAt);
          expectedTime.setMinutes(expectedTime.getMinutes() + parseInt(minutes));
          const currentTimeline = o.timeline || [];
          return {
            ...o,
            expectedReadyAt: expectedTime.toISOString(),
            timeline: [
              ...currentTimeline,
              {
                status: o.status,
                timestamp: new Date().toISOString(),
                note: `Delayed by ${minutes} minutes. Reason: ${reason}`
              }
            ]
          };
        }
        return o;
      });
      setLocalActiveOrders(updated);
      return { success: true, orderId, minutes, reason };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["activeOrders"] });
      toast.success(`Expected ready time delayed by ${variables.minutes} mins`);
    },
    onError: (err) => {
      toast.error("Failed to delay order: " + err.message);
    },
  });
}
