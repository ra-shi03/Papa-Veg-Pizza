import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import io from "socket.io-client";
import apiClient from "@/services/api/axios";
import {
  mockStaff,
  initialMockOvens,
  initialMockBakingItems,
  initialMockKitchenIssues
} from "../mockData";

// LocalStorage Keys
const BAKING_ITEMS_KEY = "pvp_baking_items";
const OVENS_STATUS_KEY = "pvp_ovens_status";
const STAFF_KEY = "pvp_baking_staff";
const ISSUES_KEY = "pvp_kitchen_issues";

// Initialize mock DB in LocalStorage
const initializeMockDb = () => {
  if (!localStorage.getItem(BAKING_ITEMS_KEY)) {
    localStorage.setItem(BAKING_ITEMS_KEY, JSON.stringify(initialMockBakingItems));
  }
  if (!localStorage.getItem(OVENS_STATUS_KEY)) {
    localStorage.setItem(OVENS_STATUS_KEY, JSON.stringify(initialMockOvens));
  }
  if (!localStorage.getItem(STAFF_KEY)) {
    localStorage.setItem(STAFF_KEY, JSON.stringify(mockStaff));
  }
  if (!localStorage.getItem(ISSUES_KEY)) {
    localStorage.setItem(ISSUES_KEY, JSON.stringify(initialMockKitchenIssues));
  }
};

initializeMockDb();

// Helper functions for LocalStorage access
const getLocalBakingItems = () => {
  try {
    return JSON.parse(localStorage.getItem(BAKING_ITEMS_KEY)) || [];
  } catch (e) {
    return [];
  }
};

const setLocalBakingItems = (items) => {
  localStorage.setItem(BAKING_ITEMS_KEY, JSON.stringify(items));
};

const getLocalOvens = () => {
  try {
    return JSON.parse(localStorage.getItem(OVENS_STATUS_KEY)) || [];
  } catch (e) {
    return [];
  }
};

const setLocalOvens = (ovens) => {
  localStorage.setItem(OVENS_STATUS_KEY, JSON.stringify(ovens));
};

const getLocalIssues = () => {
  try {
    return JSON.parse(localStorage.getItem(ISSUES_KEY)) || [];
  } catch (e) {
    return [];
  }
};

const setLocalIssues = (issues) => {
  localStorage.setItem(ISSUES_KEY, JSON.stringify(issues));
};

export function useBakingStation(filters = {}) {
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

    // Standalone Simulation mode
    let simulationTimer;
    if (import.meta.env?.VITE_STANDALONE_MOCK === "true" || !import.meta.env?.VITE_API_BASE_URL) {
      setSocketConnected(true);

      // Simple simulator
      simulationTimer = setInterval(() => {
        const localItems = getLocalBakingItems();
        const ovens = getLocalOvens();

        // 1. Try starting baking for items ready_for_baking
        const readyItem = localItems.find(item => item.baking_status === "ready_for_baking");
        const availableOven = ovens.find(o => o.status === "available");

        if (readyItem && availableOven) {
          // Start baking automatically
          const updatedItems = localItems.map(item =>
            item._id === readyItem._id
              ? {
                  ...item,
                  baking_status: "baking_started",
                  assigned_oven: availableOven._id,
                  assigned_staff: "staff-001",
                  started_time: new Date().toISOString(),
                  temperature: 250,
                  expectedDuration: 8,
                  target_time: 8
                }
              : item
          );

          const updatedOvens = ovens.map(o =>
            o._id === availableOven._id
              ? { ...o, status: "busy", current_pizza: readyItem.name, remaining_time: 480, expectedDuration: 8 }
              : o
          );

          setLocalBakingItems(updatedItems);
          setLocalOvens(updatedOvens);
          queryClient.invalidateQueries({ queryKey: ["bakingStation"] });

          toast.info(`Simulated: Pizza "${readyItem.name}" entered oven ${availableOven.oven_number}`);
          return;
        }

        // 2. Try completing baking for items baking_started that have been baking for > expectedDuration (or randomly)
        const bakingItem = localItems.find(item => item.baking_status === "baking_started" && !item.paused);
        if (bakingItem) {
          // Complete bake
          const updatedItems = localItems.map(item =>
            item._id === bakingItem._id
              ? {
                  ...item,
                  baking_status: "baking_completed",
                  completed_time: new Date().toISOString()
                }
              : item
          );

          const updatedOvens = ovens.map(o =>
            o._id === bakingItem.assigned_oven
              ? { ...o, status: "available", current_pizza: null, remaining_time: null, expectedDuration: null }
              : o
          );

          setLocalBakingItems(updatedItems);
          setLocalOvens(updatedOvens);
          queryClient.invalidateQueries({ queryKey: ["bakingStation"] });

          toast.success(`Simulated: Baking completed for "${bakingItem.name}"`);
        }
      }, 55000);
    }

    return () => {
      if (simulationTimer) clearInterval(simulationTimer);
      socket.disconnect();
    };
  }, [queryClient]);

  // Query fetcher
  const query = useQuery({
    queryKey: ["bakingStation", filters],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/baking-station", {
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
        // Local fallback
        let list = getLocalBakingItems();

        if (filters.search) {
          const q = filters.search.toLowerCase();
          list = list.filter(
            (o) =>
              o._id.toLowerCase().includes(q) ||
              o.orderNumber.toLowerCase().includes(q) ||
              o.name.toLowerCase().includes(q) ||
              (o.assigned_oven && getLocalOvens().find(ov => ov._id === o.assigned_oven)?.oven_number.toLowerCase().includes(q))
          );
        }

        if (filters.status && filters.status !== "All") {
          list = list.filter((o) => o.baking_status === filters.status);
        }

        if (filters.oven && filters.oven !== "All") {
          list = list.filter((o) => o.assigned_oven === filters.oven);
        }

        if (filters.staff && filters.staff !== "All") {
          list = list.filter((o) => o.assigned_staff === filters.staff);
        }

        if (filters.priority && filters.priority !== "All") {
          list = list.filter((o) => o.priority === filters.priority);
        }

        if (filters.delayed === "true") {
          list = list.filter((o) => {
            if (!o.started_time || o.baking_status === "baking_completed") return false;
            const elapsed = Math.floor((new Date() - new Date(o.started_time)) / 60000);
            return elapsed > (o.expectedDuration || 8);
          });
        }

        return list;
      }
    },
    refetchInterval: 15000,
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
        const response = await apiClient.get("/ovens", {
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
        throw new Error("No ovens returned");
      } catch (err) {
        let ovens = getLocalOvens();
        if (statusFilter) {
          ovens = ovens.filter(o => o.status === statusFilter);
        }
        return ovens;
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
        const response = await apiClient.get("/staff?role=baking");
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
        return JSON.parse(localStorage.getItem(STAFF_KEY)) || mockStaff;
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
        const response = await apiClient.get("/kitchen-issues");
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
        throw new Error("No issues returned");
      } catch (err) {
        return getLocalIssues();
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
        const response = await apiClient.put("/baking/start", {
          orderItemId,
          ovenId,
          temperature,
          expectedDuration,
          remarks,
        });
        return response.data;
      } catch (err) {
        const local = getLocalBakingItems();
        const ovens = getLocalOvens();
        const targetItem = local.find(item => item._id === orderItemId);

        const updated = local.map((item) =>
          item._id === orderItemId
            ? {
                ...item,
                baking_status: "baking_started",
                assigned_oven: ovenId,
                assigned_staff: "staff-001", // Default to first available staff
                started_time: new Date().toISOString(),
                temperature,
                expectedDuration,
                target_time: expectedDuration,
                remarks
              }
            : item
        );

        const updatedOvens = ovens.map((o) =>
          o._id === ovenId
            ? {
                ...o,
                status: "busy",
                current_pizza: targetItem ? targetItem.name : "Pizza",
                remaining_time: expectedDuration * 60,
                expectedDuration
              }
            : o
        );

        setLocalBakingItems(updated);
        setLocalOvens(updatedOvens);
        return { success: true, orderItemId };
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
        const response = await apiClient.put("/baking/move-oven", {
          orderItemId,
          newOvenId,
          remarks,
        });
        return response.data;
      } catch (err) {
        const local = getLocalBakingItems();
        const ovens = getLocalOvens();
        const targetItem = local.find(item => item._id === orderItemId);
        const oldOvenId = targetItem?.assigned_oven;

        const updated = local.map((item) =>
          item._id === orderItemId
            ? { ...item, assigned_oven: newOvenId, remarks: remarks || item.remarks }
            : item
        );

        const updatedOvens = ovens.map((o) => {
          if (o._id === oldOvenId) {
            return { ...o, status: "available", current_pizza: null, remaining_time: null, expectedDuration: null };
          }
          if (o._id === newOvenId) {
            return {
              ...o,
              status: "busy",
              current_pizza: targetItem ? targetItem.name : "Pizza",
              remaining_time: (targetItem?.expectedDuration || 8) * 60,
              expectedDuration: targetItem?.expectedDuration || 8
            };
          }
          return o;
        });

        setLocalBakingItems(updated);
        setLocalOvens(updatedOvens);
        return { success: true, orderItemId };
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
        const response = await apiClient.put("/baking/pause", {
          orderItemId,
          reason,
          notes,
        });
        return response.data;
      } catch (err) {
        const local = getLocalBakingItems();
        const ovens = getLocalOvens();
        const targetItem = local.find(item => item._id === orderItemId);

        const updated = local.map((item) =>
          item._id === orderItemId
            ? { ...item, baking_status: "baking_paused", paused: true, pauseReason: reason, pauseNotes: notes }
            : item
        );

        // Set oven status to maintenance if machine issue, otherwise keep busy/paused
        const updatedOvens = ovens.map((o) =>
          o._id === targetItem?.assigned_oven
            ? { ...o, status: reason === "Machine issue" ? "maintenance" : "busy" }
            : o
        );

        setLocalBakingItems(updated);
        setLocalOvens(updatedOvens);
        return { success: true, orderItemId };
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
        const response = await apiClient.put("/baking/complete", {
          orderItemId,
          remarks
        });
        return response.data;
      } catch (err) {
        const local = getLocalBakingItems();
        const ovens = getLocalOvens();
        const targetItem = local.find(item => item._id === orderItemId);

        const updated = local.map((item) =>
          item._id === orderItemId
            ? { ...item, baking_status: "baking_completed", completed_time: new Date().toISOString(), remarks: remarks || item.remarks }
            : item
        );

        const updatedOvens = ovens.map((o) =>
          o._id === targetItem?.assigned_oven
            ? { ...o, status: "available", current_pizza: null, remaining_time: null, expectedDuration: null }
            : o
        );

        setLocalBakingItems(updated);
        setLocalOvens(updatedOvens);
        return { success: true, orderItemId };
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
        const response = await apiClient.post("/kitchen-issues", {
          orderItemId,
          issueType,
          severity,
          remarks,
          image,
          notifyManager
        });
        return response.data;
      } catch (err) {
        const localIssues = getLocalIssues();
        const newIssue = {
          _id: `issue-${Date.now()}`,
          orderItemId,
          issueType,
          severity,
          remarks,
          image,
          notifyManager,
          createdAt: new Date().toISOString()
        };
        setLocalIssues([newIssue, ...localIssues]);
        return { success: true };
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
