import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import io from "socket.io-client";
import apiClient from "@/services/api/axios";



const KITCHEN = "/food/store/kitchen";
const INVENTORY = "/food/store/inventory";


// Local storage key names for fallback DB





export function usePizzaStation(filters = {}) {
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
    socket.on("assembly_started", ({ orderItemId }) => {
      toast.info("Pizza assembly started!", {
        description: `Assembly has commenced for pizza ${orderItemId}`,
      });
      queryClient.invalidateQueries({ queryKey: ["pizzaStation"] });
    });

    socket.on("assembly_completed", ({ orderItemId }) => {
      toast.success("Pizza assembly completed!", {
        description: `Pizza ${orderItemId} moved to ready for baking`,
      });
      queryClient.invalidateQueries({ queryKey: ["pizzaStation"] });
    });

    socket.on("assembly_paused", ({ orderItemId, reason }) => {
      toast.warning("Assembly paused!", {
        description: `Assembly paused for pizza ${orderItemId} due to ${reason}`,
      });
      queryClient.invalidateQueries({ queryKey: ["pizzaStation"] });
    });

    socket.on("ingredient_issue_reported", ({ orderItemId, ingredientName }) => {
      toast.error("Ingredient issue reported!", {
        description: `Shortage reported for ${ingredientName} on pizza ${orderItemId}`,
      });
      queryClient.invalidateQueries({ queryKey: ["pizzaStation"] });
    });

    

    return () => {
      socket.disconnect();
    };
  }, [queryClient]);

  // Main React Query Fetch
  const stationQuery = useQuery({
    queryKey: ["pizzaStation", filters],
    queryFn: async () => {
      try {
        const response = await apiClient.get(`${KITCHEN}/pizza-station`, {
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
        
      }
    },
    refetchInterval: 15000,
  });

  return {
    ...stationQuery,
    socketConnected,
  };
}

// Start Assembly Mutation
export function useStartAssembly() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderItemId }) => {
      try {
        const response = await apiClient.put(`${KITCHEN}/pizza-station/start`, {
          orderItemId,
        });
        return response.data;
      } catch (err) {
        throw err;
        // Fallback simulation
        
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pizzaStation"] });
      toast.success("Pizza assembly started successfully.");
    },
    onError: () => {
      toast.error("Failed to start pizza assembly");
    },
  });
}

// Pause Assembly Mutation
export function usePauseAssembly() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderItemId, reason, notes }) => {
      try {
        const response = await apiClient.put(`${KITCHEN}/pizza-station/pause`, {
          orderItemId,
          reason,
          notes,
        });
        return response.data;
      } catch (err) {
        throw err;
        // Fallback simulation
        
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pizzaStation"] });
      toast.success("Pizza assembly paused.");
    },
    onError: () => {
      toast.error("Failed to pause pizza assembly");
    },
  });
}

// Complete Assembly Mutation
export function useCompleteAssembly() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderItemId, notes }) => {
      try {
        const response = await apiClient.put(`${KITCHEN}/pizza-station/complete`, {
          orderItemId,
          notes,
        });
        return response.data;
      } catch (err) {
        throw err;
        // Fallback simulation
        
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pizzaStation"] });
      toast.success("Pizza assembly completed successfully.");
    },
    onError: () => {
      toast.error("Failed to complete pizza assembly");
    },
  });
}

// Report shortfalls mutation
export function useReportShortage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      try {
        const response = await apiClient.post(`${INVENTORY}/ingredient-shortages`, payload);
        return response.data;
      } catch (err) {
        throw err;
        // Fallback simulation
        
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pizzaStation"] });
      toast.success("Ingredient shortage reported successfully.");
    },
    onError: () => {
      toast.error("Failed to report ingredient issue");
    },
  });
}
