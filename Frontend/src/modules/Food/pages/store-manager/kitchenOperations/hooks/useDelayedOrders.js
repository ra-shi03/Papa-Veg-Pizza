import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { storeSocket } from "../../api/storeOrdersApi";
import apiClient from "@/services/api/axios";



const KITCHEN = "/food/store/kitchen";

const managementStaff = [];
const emptyChefs = [];
const emptyStaff = [];
const packagingStaff = [];

// LocalStorage Keys







// Hook for fetching delayed orders list
export function useDelayedOrders(filters = {}) {
  const queryClient = useQueryClient();
  const [socketConnected, setSocketConnected] = useState(false);

  useEffect(() => {
    const socket = storeSocket();   // the store panel's one signed-in socket

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

    

    return () => {
      socket.disconnect();
    };
  }, [queryClient]);

  const query = useQuery({
    queryKey: ["delayedOrders", filters],
    queryFn: async () => {
      try {
        const response = await apiClient.get(`${KITCHEN}/delayed-orders`, {
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
        return apiItems;
        
      } catch (err) {
        throw err;
        // Fallback to LocalStorage
        
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
  const allStaff = [...emptyChefs, ...emptyStaff, ...packagingStaff, ...managementStaff];
  const found = allStaff.find(s => s._id === staffId);
  return found ? found.name : "Unassigned";
}

// Helper to get all staff for reassign
export function useActiveStaff() {
  return useQuery({
    queryKey: ["activeStaff"],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/food/store/orders/team");
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
        return list;
        
      } catch (err) {
        throw err;
        // Fallback: merge chefs, baking staff, and packaging staff
        
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
        const response = await apiClient.post(`${KITCHEN}/orders/${orderId}/escalate`, {
          severity,
          reason,
          assignedTo,
          notes
        });
        return response.data;
      } catch (err) {
        throw err;
        // Fallback LocalStorage update
        
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
        const response = await apiClient.put(`${KITCHEN}/orders/${orderId}/reassign`, {
          staffId
        });
        return response.data;
      } catch (err) {
        throw err;
        // Fallback LocalStorage update
        
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
        const response = await apiClient.post(`${KITCHEN}/orders/${orderId}/notify-customer`, {
          channels,
          message
        });
        return response.data;
      } catch (err) {
        throw err;
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
        const response = await apiClient.put(`${KITCHEN}/orders/${orderId}/resolve-delay`, {
          resolutionNotes
        });
        return response.data;
      } catch (err) {
        throw err;
        // Fallback LocalStorage update: set isDelayed = false
        
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
