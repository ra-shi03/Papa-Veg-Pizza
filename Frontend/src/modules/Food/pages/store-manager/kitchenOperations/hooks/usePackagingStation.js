import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { storeSocket } from "../../api/storeOrdersApi";
import apiClient from "@/services/api/axios";



const KITCHEN = "/food/store/kitchen";


// LocalStorage Keys



// Helper functions for LocalStorage access




export function usePackagingStation(filters = {}) {
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

    

    return () => {
      socket.disconnect();
    };
  }, [queryClient]);

  // Main React Query Fetch
  const query = useQuery({
    queryKey: ["packagingStation", filters],
    queryFn: async () => {
      try {
        const response = await apiClient.get(`${KITCHEN}/packaging`, {
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
        // Fallback simulated list
        
      }
    },
    refetchInterval: 60000,   // safety net: changes arrive over the live socket
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
        const response = await apiClient.get("/food/store/orders/team", { params: { role: "packaging_staff" } });
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
        const response = await apiClient.put(`${KITCHEN}/packaging/start`, { orderId });
        return response.data;
      } catch (err) {
        throw err;
        
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
        const response = await apiClient.post(`${KITCHEN}/packaging/checklist`, payload);
        return response.data;
      } catch (err) {
        throw err;
        
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
        const response = await apiClient.put(`${KITCHEN}/packaging/seal`, { orderId, remarks });
        return response.data;
      } catch (err) {
        throw err;
        
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
        const response = await apiClient.put(`${KITCHEN}/orders/${orderId}/ready`, {
          status: "ready_for_pickup"
        });
        return response.data;
      } catch (err) {
        throw err;
        
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
