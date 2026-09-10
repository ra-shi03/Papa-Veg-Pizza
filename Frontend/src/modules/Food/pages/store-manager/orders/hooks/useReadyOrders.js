import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import io from "socket.io-client";
import { initialMockReadyOrders, initialMockRiders } from "../mockData";

// Local storage key names for fallback mock db
const READY_ORDERS_STORAGE_KEY = "pvp_ready_orders";
const RIDERS_STORAGE_KEY = "pvp_riders";
const ASSIGNMENTS_STORAGE_KEY = "pvp_delivery_assignments";

// Helpers to get/set items in local storage with automatic mock seeding
const getLocalReadyOrders = () => {
  try {
    let list = JSON.parse(localStorage.getItem(READY_ORDERS_STORAGE_KEY));
    if (!list || !Array.isArray(list) || list.length === 0) {
      list = initialMockReadyOrders;
      localStorage.setItem(READY_ORDERS_STORAGE_KEY, JSON.stringify(list));
    }
    return list;
  } catch (e) {
    localStorage.setItem(READY_ORDERS_STORAGE_KEY, JSON.stringify(initialMockReadyOrders));
    return initialMockReadyOrders;
  }
};

const setLocalReadyOrders = (orders) => {
  localStorage.setItem(READY_ORDERS_STORAGE_KEY, JSON.stringify(orders));
};

const getLocalRiders = () => {
  try {
    let list = JSON.parse(localStorage.getItem(RIDERS_STORAGE_KEY));
    if (!list || !Array.isArray(list) || list.length === 0) {
      list = initialMockRiders;
      localStorage.setItem(RIDERS_STORAGE_KEY, JSON.stringify(list));
    }
    return list;
  } catch (e) {
    localStorage.setItem(RIDERS_STORAGE_KEY, JSON.stringify(initialMockRiders));
    return initialMockRiders;
  }
};

const setLocalRiders = (riders) => {
  localStorage.setItem(RIDERS_STORAGE_KEY, JSON.stringify(riders));
};

const getLocalAssignments = () => {
  try {
    return JSON.parse(localStorage.getItem(ASSIGNMENTS_STORAGE_KEY)) || [];
  } catch (e) {
    return [];
  }
};

const setLocalAssignments = (assignments) => {
  localStorage.setItem(ASSIGNMENTS_STORAGE_KEY, JSON.stringify(assignments));
};

// Hook to query ready orders
export function useReadyOrders(filters = {}) {
  const queryClient = useQueryClient();
  const [socketConnected, setSocketConnected] = useState(false);

  useEffect(() => {
    // Simulate real-time socket connection for visual feedback
    setSocketConnected(true);

    const socketUrl = import.meta.env?.VITE_SOCKET_URL || window.location.origin;
    const socket = io(socketUrl, {
      transports: ["websocket"],
      autoConnect: false, // Don't connect to prevent console error logs
    });

    // Websocket Listeners (Simulated or triggered on updates)
    return () => {
      socket.disconnect();
    };
  }, [queryClient]);

  const readyOrdersQuery = useQuery({
    queryKey: ["readyOrders", filters],
    queryFn: async () => {
      // Artificial delay to simulate real network request
      await new Promise((resolve) => setTimeout(resolve, 300));
      
      let list = getLocalReadyOrders();

      // Only display orders that are in "ready" status
      list = list.filter((o) => o.status === "ready");

      // Apply search filters
      if (filters.search) {
        const q = filters.search.toLowerCase();
        list = list.filter(
          (o) =>
            o.orderNumber.toLowerCase().includes(q) ||
            o.customer.name.toLowerCase().includes(q) ||
            o.customer.phone.toLowerCase().includes(q)
        );
      }

      // Filter by Order Type (Delivery/Pickup)
      if (filters.orderType && filters.orderType !== "All") {
        list = list.filter((o) => o.orderType === filters.orderType.toLowerCase());
      }

      // Filter by Rider Status (Assigned/Unassigned)
      if (filters.riderStatus && filters.riderStatus !== "All") {
        list = list.filter((o) => {
          if (filters.riderStatus === "Assigned") {
            return o.deliveryPartnerId !== null;
          }
          return o.deliveryPartnerId === null;
        });
      }

      // Filter by Waiting Time
      if (filters.waitingTime && filters.waitingTime !== "All") {
        const now = new Date();
        list = list.filter((o) => {
          const readyTime = new Date(o.readyAt || o.createdAt);
          const diffMins = Math.round((now - readyTime) / 60000);
          
          if (filters.waitingTime === "Under 5 min") {
            return diffMins < 5;
          }
          if (filters.waitingTime === "5-15 min") {
            return diffMins >= 5 && diffMins <= 15;
          }
          if (filters.waitingTime === "More than 15 min") {
            return diffMins > 15;
          }
          return true;
        });
      }

      // Filter by Priority
      if (filters.priority && filters.priority !== "All") {
        list = list.filter((o) => o.priority === filters.priority.toLowerCase());
      }

      return list;
    },
    staleTime: 1000,
  });

  return {
    ...readyOrdersQuery,
    socketConnected,
  };
}

// Hook to query available riders
export function useAvailableRiders(searchQuery = "") {
  return useQuery({
    queryKey: ["availableRiders", searchQuery],
    queryFn: async () => {
      let list = getLocalRiders().filter((r) => r.status === "active" && r.availability === "available");
      
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        list = list.filter((r) => r.name.toLowerCase().includes(q) || r.employeeId.toLowerCase().includes(q));
      }
      
      return list;
    },
  });
}

// Mutation to assign rider
export function useAssignRider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, deliveryPartnerId, estimatedDistance, estimatedETA, notes }) => {
      await new Promise((resolve) => setTimeout(resolve, 300));

      const orders = getLocalReadyOrders();
      const riders = getLocalRiders();
      const assignments = getLocalAssignments();

      const rider = riders.find((r) => r._id === deliveryPartnerId);
      if (!rider) throw new Error("Rider not found");

      // 1. Create delivery assignment record
      const newAssignment = {
        _id: `assign-${Date.now()}`,
        orderId,
        deliveryPartnerId,
        assignedBy: "Store Manager",
        assignedAt: new Date().toISOString(),
        estimatedDistance,
        estimatedETA,
        status: "assigned",
        notes
      };

      assignments.push(newAssignment);
      setLocalAssignments(assignments);

      // 2. Update order with rider information
      const updatedOrders = orders.map((o) => {
        if (o._id === orderId) {
          const currentTimeline = o.timeline || [];
          return {
            ...o,
            deliveryPartnerId,
            riderAssignedAt: new Date().toISOString(),
            timeline: [
              ...currentTimeline,
              {
                status: "ready",
                timestamp: new Date().toISOString(),
                note: `Rider ${rider.name} assigned. ETA: ${estimatedETA}m, Distance: ${estimatedDistance}km`
              }
            ]
          };
        }
        return o;
      });
      setLocalReadyOrders(updatedOrders);

      // 3. Increment rider workload
      const updatedRiders = riders.map((r) => {
        if (r._id === deliveryPartnerId) {
          return {
            ...r,
            currentDeliveries: (r.currentDeliveries || 0) + 1,
            availability: "busy" // Set busy if assigned
          };
        }
        return r;
      });
      setLocalRiders(updatedRiders);

      return { success: true, orderId, rider };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["readyOrders"] });
      queryClient.invalidateQueries({ queryKey: ["availableRiders"] });
      toast.success(`Rider ${data.rider.name} assigned successfully!`);
    },
    onError: (err) => {
      toast.error("Failed to assign rider: " + err.message);
    },
  });
}

// Mutation to confirm pickup
export function useConfirmPickup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, riderOTP, pickedUpAt, notes }) => {
      await new Promise((resolve) => setTimeout(resolve, 300));

      // OTP Verification Check (Any 4-digit code works, but let's check it is filled)
      if (!riderOTP || riderOTP.length !== 4) {
        throw new Error("Invalid OTP code. Must be a 4-digit number.");
      }

      const orders = getLocalReadyOrders();
      const order = orders.find((o) => o._id === orderId);
      if (!order) throw new Error("Order not found");

      const riders = getLocalRiders();
      const rider = riders.find((r) => r._id === order.deliveryPartnerId);

      // 1. Update order status to out_for_delivery
      const updatedOrders = orders.map((o) => {
        if (o._id === orderId) {
          const currentTimeline = o.timeline || [];
          return {
            ...o,
            status: "out_for_delivery",
            pickedUpAt: pickedUpAt || new Date().toISOString(),
            pickupNotes: notes,
            timeline: [
              ...currentTimeline,
              {
                status: "out_for_delivery",
                timestamp: pickedUpAt || new Date().toISOString(),
                note: `Order picked up by rider. Live customer tracking enabled.`
              }
            ]
          };
        }
        return o;
      });
      setLocalReadyOrders(updatedOrders);

      // 2. Free rider workload after pickup if needed or set their state
      if (rider) {
        const updatedRiders = riders.map((r) => {
          if (r._id === rider._id) {
            return {
              ...r,
              availability: "available",
              currentDeliveries: Math.max(0, (r.currentDeliveries || 1) - 1)
            };
          }
          return r;
        });
        setLocalRiders(updatedRiders);
      }

      // 3. Update assignment state
      const assignments = getLocalAssignments();
      const updatedAssignments = assignments.map((a) => {
        if (a.orderId === orderId) {
          return { ...a, status: "picked_up", pickedUpAt: pickedUpAt || new Date().toISOString() };
        }
        return a;
      });
      setLocalAssignments(updatedAssignments);

      return { success: true, orderId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["readyOrders"] });
      queryClient.invalidateQueries({ queryKey: ["availableRiders"] });
      toast.success("Order dispatched successfully!");
    },
    onError: (err) => {
      toast.error("Pickup verification failed: " + err.message);
    },
  });
}

// Mutation to escalate delay
export function useEscalateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, reason, notes }) => {
      await new Promise((resolve) => setTimeout(resolve, 300));

      const orders = getLocalReadyOrders();
      const updatedOrders = orders.map((o) => {
        if (o._id === orderId) {
          const currentTimeline = o.timeline || [];
          return {
            ...o,
            isEscalated: true,
            escalationReason: reason,
            escalationNotes: notes,
            timeline: [
              ...currentTimeline,
              {
                status: o.status,
                timestamp: new Date().toISOString(),
                note: `CRITICAL: Order escalated. Reason: ${reason} (${notes || "N/A"})`
              }
            ]
          };
        }
        return o;
      });
      setLocalReadyOrders(updatedOrders);

      return { success: true, orderId, reason };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["readyOrders"] });
      toast.warning(`Order escalated: ${variables.reason}`);
    },
    onError: (err) => {
      toast.error("Failed to escalate order: " + err.message);
    },
  });
}
