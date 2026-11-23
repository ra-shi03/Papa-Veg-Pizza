import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import io from "socket.io-client";
import apiClient from "@/services/api/axios";



const KITCHEN = "/food/store/kitchen";


// Local storage key names (shares order database with incoming orders to demonstrate flow)

// Initialize database in localStorage






export function useKitchenQueue(filters = {}, page = 1, limit = 20) {
  const queryClient = useQueryClient();
  const [socketConnected, setSocketConnected] = useState(false);

  // Initialize socket.io connection
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
    socket.on("new_order_received", (newOrder) => {
      toast.info(`New Order ${newOrder.orderNumber || newOrder._id} received!`, {
        description: `Items: ${newOrder.items?.length || 0} | Status: ${newOrder.status}`,
      });
      // Invalidate cache to refetch
      queryClient.invalidateQueries({ queryKey: ["kitchenQueue"] });
    });

    socket.on("order_accepted", ({ orderId, status }) => {
      toast.success(`Order accepted in kitchen!`, {
        description: `Order ID: ${orderId}`,
      });
      queryClient.invalidateQueries({ queryKey: ["kitchenQueue"] });
    });

    socket.on("order_assigned", ({ orderId, chefId }) => {
      toast.info(`Chef assigned!`, {
        description: `A chef was assigned to order ${orderId}`,
      });
      queryClient.invalidateQueries({ queryKey: ["kitchenQueue"] });
    });

    

    return () => {
      socket.disconnect();
    };
  }, [queryClient]);

  // Main React Query Fetch
  const queueQuery = useQuery({
    queryKey: ["kitchenQueue", filters, page, limit],
    queryFn: async () => {
      try {
        const response = await apiClient.get(`${KITCHEN}/queue`, {
          params: { page, limit, ...filters },
        });

        let apiOrders = [];
        let pagination = null;
        if (response.data && Array.isArray(response.data.orders)) {
          apiOrders = response.data.orders;
          pagination = response.data.pagination;
        } else if (response.data?.data && Array.isArray(response.data.data.orders)) {
          apiOrders = response.data.data.orders;
          pagination = response.data.data.pagination;
        }

        if (apiOrders && apiOrders.length > 0) {
          return {
            orders: apiOrders,
            pagination: pagination || {
              total: apiOrders.length,
              page,
              limit,
              totalPages: 1
            }
          };
        }
        return { orders: [], pagination: { total: 0, page, limit, totalPages: 1 } };
        
      } catch (err) {
        throw err;
        
      }
    },
    placeholderData: (previousData) => previousData,
    refetchInterval: 30000, // polling fallback every 30s
  });

  return {
    ...queueQuery,
    socketConnected,
  };
}

// Fetch all available chefs
export function useChefs() {
  return useQuery({
    queryKey: ["kitchenChefs"],
    queryFn: async () => {
      try {
        // Kitchen staff of this store, from the store-orders API
        const response = await apiClient.get("/food/store/orders/team");
        if (Array.isArray(response.data)) return response.data;
        if (Array.isArray(response.data?.data)) return response.data.data;
        throw new Error("Format mismatch");
      } catch (err) {
        throw err;
        
      }
    },
  });
}

// Accept Order Mutation
export function useAcceptOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId) => {
      try {
        const response = await apiClient.put(`${KITCHEN}/orders/${orderId}/accept`, {
          status: "queued",
        });
        return response.data;
      } catch (err) {
        throw err;
        // Fallback simulation
        
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kitchenQueue"] });
      toast.success("Order accepted and queued successfully!");
    },
    onError: () => {
      toast.error("Failed to accept order");
    },
  });
}

// Assign Chef Mutation
export function useAssignChef() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, chefId }) => {
      try {
        const response = await apiClient.put(`${KITCHEN}/orders/${orderId}/assign-chef`, {
          chefId,
        });
        return response.data;
      } catch (err) {
        throw err;
        // Fallback simulation
        
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["kitchenQueue"] });
      queryClient.invalidateQueries({ queryKey: ["kitchenChefs"] });
      toast.success("Chef assigned to order successfully!");
    },
    onError: () => {
      toast.error("Failed to assign chef");
    },
  });
}

// Reject Item Mutation
export function useRejectItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, itemIds, reason, notifyCustomer }) => {
      try {
        const response = await apiClient.post(`${KITCHEN}/orders/item-reject`, {
          orderId,
          itemIds,
          reason,
          notifyCustomer,
        });
        return response.data;
      } catch (err) {
        throw err;
        // Fallback simulation
        
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kitchenQueue"] });
      toast.success("Items rejected and order updated!");
    },
    onError: () => {
      toast.error("Failed to reject items");
    },
  });
}

// Update Order Status (e.g. Mark Preparing, Start Preparation, Cancel Order)
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, status }) => {
      try {
        // Kitchen progress goes through the order's kitchen stage; a cancel is a rejection
        const stage = { preparing: "preparing", baking: "baking", packaging: "packaging", ready_for_pickup: "ready" }[status];
        const response = stage
          ? await apiClient.patch(`/food/store/orders/${orderId}/stage`, { stage })
          : await apiClient.patch(`/food/store/orders/${orderId}/reject`, { cancelReason: "Cancelled by kitchen" });
        return response.data;
      } catch (err) {
        throw err;
        // Fallback simulation
        
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["kitchenQueue"] });
      toast.success(`Order status updated to "${variables.status}"`);
    },
    onError: () => {
      toast.error("Failed to update order status");
    },
  });
}
