import { useState, useEffect } from "react";
import { storeOrdersApi, LIVE_POLL_MS, useLiveIndicator } from "../../api/storeOrdersApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { STANDALONE_MOCK, failOrMock } from "@/services/api/mockPolicy";
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
  const query = useQuery({
    queryKey: ["readyOrders", filters],
    queryFn: async () => {
      let list = await storeOrdersApi.list("ready", filters);
      if (filters.orderType && filters.orderType !== "All") {
        list = list.filter((o) => o.orderType === filters.orderType.toLowerCase());
      }
      if (filters.riderStatus && filters.riderStatus !== "All") {
        list = list.filter((o) => (filters.riderStatus === "Assigned" ? !!o.deliveryPartnerId : !o.deliveryPartnerId));
      }
      if (filters.waitingTime && filters.waitingTime !== "All") {
        const now = new Date();
        list = list.filter((o) => {
          const mins = Math.round((now - new Date(o.readyAt || o.createdAt)) / 60000);
          if (filters.waitingTime === "Under 5 min") return mins < 5;
          if (filters.waitingTime === "5-15 min") return mins >= 5 && mins <= 15;
          if (filters.waitingTime === "More than 15 min") return mins > 15;
          return true;
        });
      }
      return list;
    },
    refetchInterval: LIVE_POLL_MS,
    staleTime: 3000,
  });
  return { ...query, data: query.data || [], socketConnected: useLiveIndicator(query) };
}

// Hook to query available riders
export function useAvailableRiders(searchQuery = "") {
  return useQuery({
    queryKey: ["availableRiders", searchQuery],
    queryFn: async () => {
      let list;
      try {
        // GET /store/delivery/available-riders: online riders, the free ones first ("idle")
        list = ((await storeOrdersApi.availableRiders()) || [])
          .filter((r) => r.availability === "idle")
          .map((r) => ({ ...r, employeeId: r.mobile || "", currentDeliveries: r.activeOrders || 0, availability: "available", status: "active" }));
      } catch (err) {
        failOrMock(err, "Could not load riders"); // the local list below only runs when VITE_STANDALONE_MOCK=true
        list = getLocalRiders().filter((r) => r.status === "active" && r.availability === "available");
      }
      
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
    mutationFn: async (args) => {
      try {
        // POST /store/delivery/assign (the same assignment the Assign Rider screen makes)
        const riders = queryClient.getQueriesData({ queryKey: ["availableRiders"] }).flatMap(([, d]) => d || []);
        const res = await storeOrdersApi.assignRider(args.orderId, args.deliveryPartnerId);
        return { ...res, orderId: args.orderId, rider: riders.find((r) => r._id === args.deliveryPartnerId) || { name: "The rider" } };
      } catch (err) {
        failOrMock(err, "Could not assign the rider"); // the local copy below only runs when VITE_STANDALONE_MOCK=true
      }
      const { orderId, deliveryPartnerId, estimatedDistance, estimatedETA, notes } = args;
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
      // OTP Verification Check (Any 4-digit code works, but let's check it is filled)
      if (!riderOTP || riderOTP.length !== 4) {
        throw new Error("Invalid OTP code. Must be a 4-digit number.");
      }
      // The server does not check this code: the system has no pickup code yet, so the store manager's confirmation is
      // what hands the order over (PATCH /store/orders/:id/pickup, the same step the rider confirms in the delivery app).
      try {
        return await storeOrdersApi.confirmPickup(orderId, { notes });
      } catch (err) {
        failOrMock(err, "Could not confirm the pickup"); // the local copy below only runs when VITE_STANDALONE_MOCK=true
      }
      await new Promise((resolve) => setTimeout(resolve, 300));

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
      try {
        // POST /food/store/kitchen/orders/:id/escalate (recorded as a kitchen escalation for this order)
        await storeOrdersApi.escalate(orderId, { reason, notes, severity: "High" });
        return { success: true, orderId, reason };
      } catch (err) {
        failOrMock(err, "Could not escalate the order"); // the local copy below only runs when VITE_STANDALONE_MOCK=true
      }
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
