import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { storeSocket } from "../../api/storeOrdersApi";
import apiClient from "@/services/api/axios";



const KITCHEN = "/food/store/kitchen";


// LocalStorage Keys



// Helper functions for LocalStorage access






export function useBakingStation(filters = {}) {
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
    socket.on("baking_started", ({ orderItemId, ovenId }) => {
      toast.info("Pizza entered oven!", {
        description: `Baking has commenced for item ${orderItemId} in Oven ${ovenId}`,
      });
      queryClient.invalidateQueries({ queryKey: ["bakingStation"] });
    });

    socket.on("baking_completed", ({ orderItemId }) => {
      toast.success("Baking completed!", {
        description: `Pizza ${orderItemId} is out of the oven and moved to packaging.`,
      });
      queryClient.invalidateQueries({ queryKey: ["bakingStation"] });
    });

    socket.on("oven_changed", ({ orderItemId, newOvenId }) => {
      toast.warning("Oven reassigned!", {
        description: `Pizza ${orderItemId} shifted to Oven ${newOvenId}`,
      });
      queryClient.invalidateQueries({ queryKey: ["bakingStation"] });
    });

    socket.on("baking_issue_reported", ({ orderItemId, issueType }) => {
      toast.error("Issue reported!", {
        description: `Baking problem: ${issueType} recorded on item ${orderItemId}`,
      });
      queryClient.invalidateQueries({ queryKey: ["bakingStation"] });
    });

    

    return () => {
      socket.disconnect();
    };
  }, [queryClient]);

  // Query fetcher
  const query = useQuery({
    queryKey: ["bakingStation", filters],
    queryFn: async () => {
      try {
        const response = await apiClient.get(`${KITCHEN}/baking-station`, {
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
        // Local fallback
        
      }
    },
    refetchInterval: 60000,   // safety net: changes arrive over the live socket
  });

  return {
    ...query,
    socketConnected,
  };
}

// Fetch Ovens Query
export function useOvens(statusFilter) {
  return useQuery({
    queryKey: ["ovens", statusFilter],
    queryFn: async () => {
      try {
        const response = await apiClient.get(`${KITCHEN}/ovens`, {
          params: statusFilter ? { status: statusFilter } : {},
        });
        let list = [];
        if (Array.isArray(response.data)) {
          list = response.data;
        } else if (Array.isArray(response.data?.data)) {
          list = response.data.data;
        } else if (Array.isArray(response.data?.ovens)) {
          list = response.data.ovens;
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

// Fetch Staff Query
export function useBakingStaff() {
  return useQuery({
    queryKey: ["bakingStaff"],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/food/store/orders/team", { params: { role: "baking_chef" } });
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

// Fetch Issues Query (For Overcooked stats, etc.)
export function useKitchenIssues() {
  return useQuery({
    queryKey: ["kitchenIssues"],
    queryFn: async () => {
      try {
        const response = await apiClient.get(`${KITCHEN}/kitchen-issues`);
        let list = [];
        if (Array.isArray(response.data)) {
          list = response.data;
        } else if (Array.isArray(response.data?.data)) {
          list = response.data.data;
        } else if (Array.isArray(response.data?.issues)) {
          list = response.data.issues;
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

// Start Baking Mutation
export function useStartBaking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderItemId, ovenId, temperature = 250, expectedDuration = 8, remarks = "" }) => {
      try {
        const response = await apiClient.put(`${KITCHEN}/baking/start`, {
          orderItemId,
          ovenId,
          temperature,
          expectedDuration,
          remarks,
        });
        return response.data;
      } catch (err) {
        throw err;
        
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bakingStation"] });
      queryClient.invalidateQueries({ queryKey: ["ovens"] });
      toast.success("Pizza assigned to oven and baking started!");
    },
    onError: () => {
      toast.error("Failed to start baking");
    },
  });
}

// Move Oven Mutation
export function useMoveOven() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderItemId, newOvenId, remarks = "" }) => {
      try {
        const response = await apiClient.put(`${KITCHEN}/baking/move-oven`, {
          orderItemId,
          newOvenId,
          remarks,
        });
        return response.data;
      } catch (err) {
        throw err;
        
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bakingStation"] });
      queryClient.invalidateQueries({ queryKey: ["ovens"] });
      toast.success("Oven reassigned successfully.");
    },
    onError: () => {
      toast.error("Failed to move oven");
    },
  });
}

// Pause Baking Mutation
export function usePauseBaking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderItemId, reason, notes = "" }) => {
      try {
        const response = await apiClient.put(`${KITCHEN}/baking/pause`, {
          orderItemId,
          reason,
          notes,
        });
        return response.data;
      } catch (err) {
        throw err;
        
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bakingStation"] });
      queryClient.invalidateQueries({ queryKey: ["ovens"] });
      toast.warning("Baking operation paused.");
    },
    onError: () => {
      toast.error("Failed to pause baking");
    },
  });
}

// Complete Baking Mutation
export function useCompleteBaking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderItemId, remarks = "" }) => {
      try {
        const response = await apiClient.put(`${KITCHEN}/baking/complete`, {
          orderItemId,
          remarks
        });
        return response.data;
      } catch (err) {
        throw err;
        
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bakingStation"] });
      queryClient.invalidateQueries({ queryKey: ["ovens"] });
      toast.success("Pizza completed baking and sent to packaging!");
    },
    onError: () => {
      toast.error("Failed to complete baking");
    },
  });
}

// Report Baking Issue Mutation
export function useReportBakingIssue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderItemId, issueType, severity, remarks = "", image = "", notifyManager = false }) => {
      try {
        const response = await apiClient.post(`${KITCHEN}/kitchen-issues`, {
          orderItemId,
          issueType,
          severity,
          remarks,
          image,
          notifyManager
        });
        return response.data;
      } catch (err) {
        throw err;
        
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kitchenIssues"] });
      toast.success("Baking issue reported successfully.");
    },
    onError: () => {
      toast.error("Failed to report baking issue");
    },
  });
}
