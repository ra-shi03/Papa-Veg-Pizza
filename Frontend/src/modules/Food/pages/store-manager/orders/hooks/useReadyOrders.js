import { useState, useEffect } from "react";
import { storeOrdersApi, LIVE_POLL_MS, useLiveIndicator } from "../../api/storeOrdersApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { throwApiError } from "@/services/api/apiError";
import io from "socket.io-client";


// Local storage key names for fallback db

// Helpers to get/set items in local storage with automatic seeding






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
export function useAvailableRiders(searchQuery = "", enabled = true) {
  return useQuery({
    queryKey: ["availableRiders", searchQuery],
    enabled,   // only while the rider picker is open (the store manager's); kitchen staff would get a 403
    queryFn: async () => {
      let list;
      try {
        // GET /store/delivery/available-riders: online riders, the free ones first ("idle")
        list = ((await storeOrdersApi.availableRiders()) || [])
          .filter((r) => r.availability === "idle")
          .map((r) => ({ ...r, employeeId: r.mobile || "", currentDeliveries: r.activeOrders || 0, availability: "available", status: "active" }));
      } catch (err) {
        throwApiError(err, "Could not load riders");
        
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
        throwApiError(err, "Could not assign the rider");
      }
      
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
    mutationFn: async ({ orderId, pickedUpAt, notes, pickup = false }) => {
      // An order the customer collects has no rider and no code: the store just hands it over
      // The store manager's confirmation hands the order over (PATCH /store/orders/:id/pickup); the server needs the rider's bill photo first.
      try {
        return await storeOrdersApi.confirmPickup(orderId, { notes });
      } catch (err) {
        throwApiError(err, "Could not confirm the pickup");
      }
      
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
        throwApiError(err, "Could not escalate the order");
      }
      
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
