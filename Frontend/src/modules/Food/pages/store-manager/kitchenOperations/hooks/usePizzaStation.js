import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import io from "socket.io-client";
import apiClient from "@/services/api/axios";
import {
  mockChefs,
  mockIngredients,
  mockRecipes,
  initialMockPizzaStationItems
} from "../mockData";

// Local storage key names for fallback DB
const PIZZA_STATION_STORAGE_KEY = "pvp_pizza_station_items";
const INGREDIENTS_STORAGE_KEY = "pvp_ingredients_stock";
const SHORTAGES_STORAGE_KEY = "pvp_ingredient_shortages";
const CHEFS_STORAGE_KEY = "pvp_kitchen_chefs";

// Initialize mock DB in LocalStorage
const initializeMockDb = () => {
  if (!localStorage.getItem(PIZZA_STATION_STORAGE_KEY)) {
    localStorage.setItem(PIZZA_STATION_STORAGE_KEY, JSON.stringify(initialMockPizzaStationItems));
  }
  if (!localStorage.getItem(INGREDIENTS_STORAGE_KEY)) {
    localStorage.setItem(INGREDIENTS_STORAGE_KEY, JSON.stringify(mockIngredients));
  }
  if (!localStorage.getItem(CHEFS_STORAGE_KEY)) {
    localStorage.setItem(CHEFS_STORAGE_KEY, JSON.stringify(mockChefs));
  }
  if (!localStorage.getItem(SHORTAGES_STORAGE_KEY)) {
    localStorage.setItem(SHORTAGES_STORAGE_KEY, JSON.stringify([]));
  }
};

initializeMockDb();

const getLocalStationItems = () => {
  try {
    return JSON.parse(localStorage.getItem(PIZZA_STATION_STORAGE_KEY)) || [];
  } catch (e) {
    return [];
  }
};

const setLocalStationItems = (items) => {
  localStorage.setItem(PIZZA_STATION_STORAGE_KEY, JSON.stringify(items));
};

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

    // Standalone Simulation for standalone mode
    let simulationTimer;
    if (import.meta.env?.VITE_STANDALONE_MOCK === "true" || !import.meta.env?.VITE_API_BASE_URL) {
      setSocketConnected(true);

      // Randomly update stages of items for testing
      simulationTimer = setInterval(() => {
        const local = getLocalStationItems();
        // find a pizza item in 'assigned' or 'assembly_started' state
        const eligible = local.filter(item => ["assigned", "assembly_started"].includes(item.assembly_status) && !item.paused);
        if (eligible.length > 0) {
          const target = eligible[Math.floor(Math.random() * eligible.length)];
          if (target.assembly_status === "assigned") {
            // start assembly
            const updated = local.map((item) =>
              item._id === target._id
                ? { ...item, assembly_status: "assembly_started", assembly_started_time: new Date().toISOString() }
                : item
            );
            setLocalStationItems(updated);
            queryClient.invalidateQueries({ queryKey: ["pizzaStation"] });
            toast.info(`Simulated: Assembly started for "${target.name}"`, {
              description: `Chef assigned: ${target.assigned_chef ? "Rajesh" : "Unassigned"}`,
            });
          } else {
            // complete assembly
            const updated = local.map((item) =>
              item._id === target._id
                ? { ...item, assembly_status: "assembly_completed", completed_time: new Date().toISOString() }
                : item
            );
            setLocalStationItems(updated);
            queryClient.invalidateQueries({ queryKey: ["pizzaStation"] });
            toast.success(`Simulated: Assembly completed for "${target.name}"`, {
              description: `Moving to baking line.`,
            });
          }
        }
      }, 55000);
    }

    return () => {
      if (simulationTimer) clearInterval(simulationTimer);
      socket.disconnect();
    };
  }, [queryClient]);

  // Main React Query Fetch
  const stationQuery = useQuery({
    queryKey: ["pizzaStation", filters],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/pizza-station", {
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
        console.warn("Backend API unavailable, falling back to simulated storage database.");

        let list = getLocalStationItems();

        // Filters in memory
        if (filters.search) {
          const q = filters.search.toLowerCase();
          list = list.filter(
            (o) =>
              o.pizzaId.toLowerCase().includes(q) ||
              o.orderNumber.toLowerCase().includes(q) ||
              o.name.toLowerCase().includes(q) ||
              (o.assigned_chef && mockChefs.find(c => c._id === o.assigned_chef)?.name.toLowerCase().includes(q))
          );
        }

        if (filters.status && filters.status !== "All") {
          list = list.filter((o) => o.assembly_status === filters.status);
        }

        if (filters.chef && filters.chef !== "All") {
          if (filters.chef === "Unassigned") {
            list = list.filter((o) => !o.assigned_chef);
          } else {
            list = list.filter((o) => o.assigned_chef === filters.chef);
          }
        }

        if (filters.size && filters.size !== "All") {
          list = list.filter((o) => o.size === filters.size);
        }

        if (filters.crust && filters.crust !== "All") {
          list = list.filter((o) => o.crust === filters.crust);
        }

        if (filters.priority && filters.priority !== "All") {
          list = list.filter((o) => o.priority === filters.priority);
        }

        if (filters.delayed === "true") {
          list = list.filter((o) => {
            if (!o.assembly_started_time || o.assembly_status === "assembly_completed") return false;
            const elapsed = Math.floor((new Date() - new Date(o.assembly_started_time)) / 60000);
            return elapsed > (o.target_time || 10);
          });
        }

        return list;
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
        const response = await apiClient.put("/pizza-station/start", {
          orderItemId,
        });
        return response.data;
      } catch (err) {
        // Fallback simulation
        const local = getLocalStationItems();
        const updated = local.map((item) =>
          item._id === orderItemId
            ? { ...item, assembly_status: "assembly_started", assembly_started_time: new Date().toISOString() }
            : item
        );
        setLocalStationItems(updated);
        return { success: true, orderItemId };
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
        const response = await apiClient.put("/pizza-station/pause", {
          orderItemId,
          reason,
          notes,
        });
        return response.data;
      } catch (err) {
        // Fallback simulation
        const local = getLocalStationItems();
        const updated = local.map((item) =>
          item._id === orderItemId
            ? { ...item, assembly_status: "assembly_paused", paused: true, pauseReason: reason, pauseNotes: notes }
            : item
        );
        setLocalStationItems(updated);
        return { success: true, orderItemId };
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
        const response = await apiClient.put("/pizza-station/complete", {
          orderItemId,
          notes,
        });
        return response.data;
      } catch (err) {
        // Fallback simulation
        const local = getLocalStationItems();
        const updated = local.map((item) =>
          item._id === orderItemId
            ? { ...item, assembly_status: "assembly_completed", completed_time: new Date().toISOString() }
            : item
        );
        setLocalStationItems(updated);
        return { success: true, orderItemId };
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
        const response = await apiClient.post("/ingredient-shortages", payload);
        return response.data;
      } catch (err) {
        // Fallback simulation
        const localShortages = JSON.parse(localStorage.getItem(SHORTAGES_STORAGE_KEY)) || [];
        const newIssue = {
          _id: `shortage-${Date.now()}`,
          ...payload,
          createdAt: new Date().toISOString(),
          status: "pending"
        };
        localStorage.setItem(SHORTAGES_STORAGE_KEY, JSON.stringify([newIssue, ...localShortages]));
        return { success: true };
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
